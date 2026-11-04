import math
import random

import game_world
from sheet import get_sheet

SPAWN_DISTANCE = 470


class SmallAsteroid:
    radius = 5
    speed = 60
    max_hp = 1
    damage = 5
    sheet_name = 'asteroid-small'

    def __init__(self, earth, x, y):
        self.earth = earth
        self.sheet = get_sheet(self.sheet_name)
        self.x, self.y = x, y
        self.hp = self.max_hp
        self.t = random.uniform(0, 2)

    @classmethod
    def at_edge(cls, earth, angle):
        return cls(earth, earth.x + math.cos(angle) * SPAWN_DISTANCE, earth.y + math.sin(angle) * SPAWN_DISTANCE)

    def update(self, dt):
        self.t += dt
        earth = self.earth
        dx, dy = earth.x - self.x, earth.y - self.y
        d = math.hypot(dx, dy)
        self.x += dx / d * self.speed * dt
        self.y += dy / d * self.speed * dt
        if d < earth.radius + self.radius:
            earth.hit(self.damage)
            game_world.remove_object(self)

    def hit(self, damage):
        self.hp -= damage
        if self.hp <= 0:
            game_world.remove_object(self)

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)
