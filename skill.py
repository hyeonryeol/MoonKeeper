import math

import game_framework
import game_world
import sound
from earth import MARGIN
from gear import nearest_enemy
from sheet import get_sheet

# 관통 레이저는 화면 끝까지, 막 들어오는 적도 맞게 화면 밖 여유
BEAM_MARGIN = 40
# 지구 추진기 3레벨 속도
SAFE_SPEED = 360
# 관통 레이저 갈래 사이 각도
SPREAD = math.radians(25)


def beam_length(x, y, rad):
    # 달 자리에서 쏜 방향으로 화면 끝까지 거리
    ux, uy = math.cos(rad), math.sin(rad)
    ts = []
    if ux > 1e-6:
        ts.append((800 + BEAM_MARGIN - x) / ux)
    elif ux < -1e-6:
        ts.append((-BEAM_MARGIN - x) / ux)
    if uy > 1e-6:
        ts.append((600 + BEAM_MARGIN - y) / uy)
    elif uy < -1e-6:
        ts.append((-BEAM_MARGIN - y) / uy)
    return max(0.0, min(ts))


class Skill:
    def __init__(self, moon, key):
        self.moon = moon
        self.key = key
        self.level = 1
        self.wait = 0.0
        # 전체 화면 컷인은 처음 한 번만, 그 뒤로는 작은 팝업
        self.seen = False

    def by_level(self, values):
        return values[min(self.level, len(values)) - 1]

    def cooldown(self):
        return 10

    def ready(self):
        return self.wait <= 0

    def use(self):
        self.wait = self.cooldown()
        sound.play('skill_' + self.key)
        self.fire()

    def fire(self):
        pass

    def update(self):
        dt = game_framework.frame_time
        self.wait = max(0.0, self.wait - dt)


class PierceLaser(Skill):
    def cooldown(self):
        return self.by_level([8, 7, 6])

    def in_beam(self, rad):
        moon = self.moon
        ux, uy = math.cos(rad), math.sin(rad)
        reach = beam_length(moon.x, moon.y, rad)
        hit = []
        for a in game_world.objects_at(game_world.ENEMY):
            dx, dy = a.x - moon.x, a.y - moon.y
            along = dx * ux + dy * uy
            side = abs(dx * uy - dy * ux)
            if 0 < along < reach + a.radius and side < a.radius + 6:
                hit.append(a)
        return hit

    def aim(self):
        moon = self.moon
        # 적 하나하나 쪽으로 쏴 보고 가장 많이 맞는 방향을 고름
        best, best_n = moon.theta + math.pi / 2, 0
        for a in game_world.objects_at(game_world.ENEMY):
            rad = math.atan2(a.y - moon.y, a.x - moon.x)
            n = len(self.in_beam(rad))
            if n > best_n:
                best, best_n = rad, n
        return best

    def fire(self):
        moon = self.moon
        base = self.aim()
        # 레벨이 오르면 가장 많이 맞는 방향을 가운데로 부채꼴 3갈래, 5갈래
        n = self.by_level([1, 3, 5])
        hit = []
        for j in range(n):
            rad = base + (j - (n - 1) / 2) * SPREAD
            game_world.add_object(PierceBeam(moon, rad), game_world.BEAM)
            # 여러 갈래에 겹쳐도 한 번만 맞음
            hit += [a for a in self.in_beam(rad) if a not in hit]
        for a in hit:
            a.hit(self.by_level([3, 4, 5]))


class PierceBeam:
    # 쏜 방향은 그대로 두고 출발점은 달을 따라감
    life = 0.5
    grow = 0.08
    fade = 0.15

    def __init__(self, moon, rad):
        self.sheet = get_sheet('laser-beam')
        self.moon = moon
        self.rad = rad
        self.t = 0.0

    def update(self):
        dt = game_framework.frame_time
        self.t += dt
        if self.t >= self.life:
            game_world.remove_object(self)

    def draw(self):
        # 달에서 빠르게 뻗어 나가고, 처음엔 굵게 번쩍였다가 끝에 가늘어지며 꺼짐
        k = min(1.0, self.t / self.grow)
        length = beam_length(self.moon.x, self.moon.y, self.rad) * (1 - (1 - k) ** 3)
        thick = 1.6 - 0.6 * k
        left = self.life - self.t
        if left < self.fade:
            thick *= left / self.fade
        if length < 2 or thick <= 0.05:
            return
        self.sheet.draw(self.t, self.moon.x, self.moon.y, self.rad, thick, length / (32 * thick))


class EarthBoost(Skill):
    def cooldown(self):
        return self.by_level([20, 17, 14])

    def fire(self):
        earth = self.moon.earth
        if self.level >= 3:
            # 3레벨은 화면에서 소행성이 가장 먼 곳까지 빠르게 날아감
            earth.boost_to(*self.safest(), SAFE_SPEED)
            return
        target = nearest_enemy(earth.x, earth.y, 1000)
        if target is None:
            rad = self.moon.theta + math.pi
        else:
            rad = math.atan2(earth.y - target.y, earth.x - target.x)
        # 2레벨은 두 배 멀리
        earth.boost(rad, self.by_level([1.0, 2.0]))

    def safest(self):
        # 화면을 40칸 간격으로 훑어 가장 가까운 소행성이 제일 먼 자리를 고름
        earth = self.moon.earth
        enemies = game_world.objects_at(game_world.ENEMY)
        if not enemies:
            return earth.x, earth.y
        best, best_d = (earth.x, earth.y), -1
        for x in range(MARGIN, 800 - MARGIN + 1, 40):
            for y in range(MARGIN, 600 - MARGIN + 1, 40):
                d = min(math.hypot(a.x - x, a.y - y) for a in enemies)
                if d > best_d:
                    best, best_d = (x, y), d
        return best


class GravityBomb(Skill):
    def cooldown(self):
        return self.by_level([12, 10, 8])

    def fire(self):
        moon = self.moon
        reach = self.by_level([120, 140, 160])
        # 레벨이 오르면 3개, 5개, 이미 고른 폭탄 범위 밖에서 다음으로 많이 모인 곳을 차례로 고름
        left = list(game_world.objects_at(game_world.ENEMY))
        spots = []
        for _ in range(self.by_level([1, 3, 5])):
            x, y, best_n = None, None, 0
            # 적 하나하나를 가운데로 놓아 보고 범위 안에 가장 많이 들어오는 곳
            for a in left:
                n = sum(1 for b in left if math.hypot(b.x - a.x, b.y - a.y) < reach)
                if n > best_n:
                    x, y, best_n = a.x, a.y, n
            if x is None:
                break
            spots.append((x, y))
            left = [b for b in left if math.hypot(b.x - x, b.y - y) >= reach]
        # 적이 하나도 없으면 달 자리에 하나
        for x, y in spots or [(moon.x, moon.y)]:
            game_world.add_object(GravityWell(x, y, reach), game_world.EFFECT)


class GravityWell:
    pull = 110
    damage = 2

    def __init__(self, x, y, reach):
        self.sheet = get_sheet('gravity-bomb')
        self.x, self.y = x, y
        self.reach = reach
        self.t = 0.0

    def update(self):
        dt = game_framework.frame_time
        self.t += dt
        if self.t >= self.sheet.duration():
            # 다 모은 뒤 가운데에서 터짐
            for a in game_world.objects_at(game_world.ENEMY)[:]:
                if math.hypot(a.x - self.x, a.y - self.y) < 40:
                    a.hit(self.damage)
            game_world.remove_object(self)
            return
        for a in game_world.objects_at(game_world.ENEMY):
            dx, dy = self.x - a.x, self.y - a.y
            d = math.hypot(dx, dy)
            if 2 < d < self.reach:
                step = min(d, self.pull * dt)
                a.x += dx / d * step
                a.y += dy / d * step

    def draw(self):
        # 그림은 반지름 48 기준이라 범위에 맞춰 키움
        self.sheet.draw(self.t, self.x, self.y, 0, self.reach / 48)
