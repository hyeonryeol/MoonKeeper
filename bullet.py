import math

import effect
import game_world
from sheet import get_sheet


class Bullet:
    def __init__(self, x, y, rad, speed=420, damage=1, sheet='bullet', scale=1):
        self.sheet = get_sheet(sheet)
        self.scale = scale
        self.x, self.y, self.rad = x, y, rad
        self.vx, self.vy = math.cos(rad) * speed, math.sin(rad) * speed
        self.damage = damage
        self.radius = 2
        self.t = 0.0

    def update(self, dt):
        self.t += dt
        self.x += self.vx * dt
        self.y += self.vy * dt
        if self.t > 1.5:
            game_world.remove_object(self)
            return
        for a in game_world.objects_at(game_world.ENEMY):
            if game_world.collide(self, a):
                a.hit(self.damage)
                game_world.remove_object(self)
                return

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y, self.rad, self.scale)


class Missile:
    speed = 230
    turn = 4.0

    def __init__(self, x, y, rad, damage=2):
        self.sheet = get_sheet('missile')
        self.x, self.y, self.rad = x, y, rad
        self.damage = damage
        self.radius = 3
        self.target = None
        self.t = 0.0

    def find_target(self):
        # 쫓던 적이 남아 있으면 그대로, 없으면 가장 가까운 적
        enemies = game_world.objects_at(game_world.ENEMY)
        if self.target in enemies:
            return self.target
        best = None
        for a in enemies:
            if best is None or game_world.distance(self, a) < game_world.distance(self, best):
                best = a
        return best

    def update(self, dt):
        self.t += dt
        self.target = self.find_target()
        if self.target:
            # 한 번에 확 꺾지 않고 초당 turn 라디안까지만 돌아서 휘어 날아감
            want = math.atan2(self.target.y - self.y, self.target.x - self.x)
            diff = (want - self.rad + math.pi) % math.tau - math.pi
            self.rad += max(-self.turn * dt, min(self.turn * dt, diff))
        self.x += math.cos(self.rad) * self.speed * dt
        self.y += math.sin(self.rad) * self.speed * dt
        if self.t > 3:
            # 맞히지 못하고 연료가 다 떨어지면 그 자리에서 터짐
            effect.play('explosion-small', self.x, self.y)
            game_world.remove_object(self)
            return
        for a in game_world.objects_at(game_world.ENEMY):
            if game_world.collide(self, a):
                a.hit(self.damage)
                effect.play('explosion-small', self.x, self.y)
                game_world.remove_object(self)
                return

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y, self.rad)
