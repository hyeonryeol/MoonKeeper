import math

import game_world
from bullet import Bullet
from sheet import get_sheet

# 장비가 붙는 자리, 지구 반대쪽을 0으로 잡은 각도
SLOTS = [0.0, 0.9, -0.9, 1.8, -1.8, 2.6, -2.6, math.pi]


def nearest_enemy(x, y, reach):
    best, best_d = None, reach
    for a in game_world.objects_at(game_world.ENEMY):
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
