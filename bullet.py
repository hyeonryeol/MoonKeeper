import math

import game_world
from sheet import get_sheet


class Bullet:
    def __init__(self, x, y, rad, speed=420, damage=1):
        self.sheet = get_sheet('bullet')
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
        self.sheet.draw(self.t, self.x, self.y, self.rad)
