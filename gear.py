import math

import effect
import game_world
from bullet import Bullet, Missile
from sheet import get_sheet

# 장비가 붙는 자리, 지구 반대쪽을 0으로 잡은 각도
SLOTS = [0.0, 0.9, -0.9, 1.8, -1.8, 2.6, -2.6, math.pi]


def nearest_enemy(x, y, reach, skip=()):
    # skip에 든 적은 빼고 찾음
    best, best_d = None, reach
    for a in game_world.objects_at(game_world.ENEMY):
        if a in skip:
            continue
        d = math.hypot(a.x - x, a.y - y)
        if d < best_d:
            best, best_d = a, d
    return best


class Gear:
    def __init__(self, moon, key, sheet_name, slot):
        self.moon = moon
        self.key = key
        self.sheet = get_sheet(sheet_name)
        self.offset = SLOTS[slot % len(SLOTS)]
        self.t = 0.0

    def mount(self):
        # 달 중심에서 장착 각도 방향으로 달 반지름만큼
        a = self.moon.theta + self.offset
        r = self.moon.radius - 2
        return self.moon.x + math.cos(a) * r, self.moon.y + math.sin(a) * r, a

    def update(self, dt):
        self.t += dt

    def draw(self):
        x, y, a = self.mount()
        self.sheet.draw(self.t, x, y, a)


class Turret(Gear):
    def __init__(self, moon, key, sheet_name, slot):
        super().__init__(moon, key, sheet_name, slot)
        self.cool = 0.0
        self.aim = None

    def reach(self):
        return 260

    def reload(self):
        return 0.5

    def shoot(self, x, y, rad):
        game_world.add_object(Bullet(x, y, rad), game_world.SHOT)

    def update(self, dt):
        super().update(dt)
        self.cool -= dt
        x, y, _ = self.mount()
        target = nearest_enemy(x, y, self.reach())
        if target is None:
            self.aim = None
            return
        # 가장 가까운 적을 자동으로 조준해서 쏨
        self.aim = math.atan2(target.y - y, target.x - x)
        if self.cool <= 0:
            self.shoot(x + math.cos(self.aim) * 9, y + math.sin(self.aim) * 9, self.aim)
            self.cool = self.reload()

    def draw(self):
        x, y, a = self.mount()
        self.sheet.draw(self.t, x, y, a if self.aim is None else self.aim)


class LaserTurret(Turret):
    # 기본 포탑보다 사거리는 짧고 연사는 빠름
    def reach(self):
        return 150

    def reload(self):
        return 0.25

    def shoot(self, x, y, rad):
        game_world.add_object(Bullet(x, y, rad, 520, 1, 'laser-beam', 0.5), game_world.SHOT)


class MissilePod(Gear):
    def __init__(self, moon, key, sheet_name, slot):
        super().__init__(moon, key, sheet_name, slot)
        self.cool = 1.0

    def update(self, dt):
        super().update(dt)
        self.cool -= dt
        if self.cool > 0 or not game_world.objects_at(game_world.ENEMY):
            return
        # 4초마다 장착된 방향으로 유도탄 2발을 벌려서 쏨
        x, y, a = self.mount()
        for i in range(2):
            game_world.add_object(Missile(x, y, a + (i - 0.5) * 0.5), game_world.SHOT)
        self.cool = 4.0


class DroneUnit:
    radius = 5
    speed = 260
    orbit = 26
    reach = 110
    leash = 180

    def __init__(self, owner, x, y):
        self.owner = owner
        self.x, self.y = x, y
        self.state = 'orbit'
        self.target = None

    def home(self, i, n):
        # 드론 n대가 달 둘레에 고르게 나눠 돎
        moon = self.owner.moon
        a = self.owner.t * 3 + i * math.tau / n
        return moon.x + math.cos(a) * self.orbit, moon.y + math.sin(a) * self.orbit

    def fly_to(self, x, y, dt):
        dx, dy = x - self.x, y - self.y
        d = math.hypot(dx, dy)
        # 달이 빨리 돌아도 따라잡도록 달 속도를 더함
        step = (self.speed + self.owner.moon.speed) * dt
        if d <= step:
            self.x, self.y = x, y
            return True
        self.x += dx / d * step
        self.y += dy / d * step
        return False

    def update(self, dt, i, n):
        moon = self.owner.moon
        hx, hy = self.home(i, n)
        if self.state == 'orbit':
            self.x, self.y = hx, hy
            # 다른 드론이 노리는 적은 빼고 가까운 적을 찾음
            taken = [d.target for d in self.owner.units if d is not self]
            self.target = nearest_enemy(moon.x, moon.y, self.reach, taken)
            if self.target:
                self.state = 'attack'
        elif self.state == 'attack':
            # 목표가 사라졌거나 달에서 너무 멀어지면 돌아옴
            if self.target not in game_world.objects_at(game_world.ENEMY) or                     math.hypot(self.x - moon.x, self.y - moon.y) > self.leash:
                self.state = 'return'
                return
            self.fly_to(self.target.x, self.target.y, dt)
            if math.hypot(self.target.x - self.x, self.target.y - self.y) < self.target.radius + self.radius:
                self.target.hit(1)
                self.state = 'return'
        elif self.state == 'return':
            self.target = None
            if self.fly_to(hx, hy, dt):
                self.state = 'orbit'


class Drone(Gear):
    def __init__(self, moon, key, sheet_name, slot):
        super().__init__(moon, key, sheet_name, slot)
        self.units = [DroneUnit(self, moon.x, moon.y)]
        self.units[0].state = 'return'

    def update(self, dt):
        super().update(dt)
        n = len(self.units)
        for i, u in enumerate(self.units):
            u.update(dt, i, n)

    def draw(self):
        # 달에 붙지 않고 드론마다 제자리에 그림
        for u in self.units:
            self.sheet.draw(self.t, u.x, u.y)


class Coil(Gear):
    def __init__(self, moon, key, sheet_name, slot):
        super().__init__(moon, key, sheet_name, slot)
        self.cool = 0.0

    def update(self, dt):
        super().update(dt)
        self.cool -= dt
        if self.cool > 0:
            return
        x, y, _ = self.mount()
        target = nearest_enemy(x, y, 120)
        if target is None:
            return
        # 가장 가까운 적에서 시작해 80 안의 다음 적으로 3개까지 번개가 옮겨 감
        hit = []
        while target is not None and len(hit) < 3:
            dx, dy = target.x - x, target.y - y
            # 62픽셀짜리 번개 그림을 두 점 사이 길이에 맞춰 늘림
            effect.play('chain-lightning', x, y, math.atan2(dy, dx), max(0.3, math.hypot(dx, dy) / 62))
            hit.append(target)
            x, y = target.x, target.y
            target = nearest_enemy(x, y, 80, hit)
        for a in hit:
            a.hit(1)
        self.cool = 1.2
