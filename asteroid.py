import math
import random

import effect
import game_framework
import game_world
import sound
from fragment import Fragment
from sheet import get_sheet

SPAWN_DISTANCE = 470


class SmallAsteroid:
    radius = 5
    speed = 60
    max_hp = 1
    damage = 5
    fragments = 1
    heavy = False
    sheet_name = 'asteroid-small'
    boom_name = 'explosion-small'
    boom_sound = 'explode_small'

    def __init__(self, earth, moon, on_collect, x, y):
        self.earth, self.moon, self.on_collect = earth, moon, on_collect
        self.sheet = get_sheet(self.sheet_name)
        self.x, self.y = x, y
        self.hp = self.max_hp
        # 달과 같은 소행성이 매 프레임 계속 부딪히지 않게
        self.ram_cool = 0.0
        # 방패에 튕겨 나가는 남은 시간
        self.knock = 0.0
        self.t = random.uniform(0, 2)

    @classmethod
    def at_edge(cls, earth, moon, on_collect, angle):
        return cls(earth, moon, on_collect,
                   earth.x + math.cos(angle) * SPAWN_DISTANCE, earth.y + math.sin(angle) * SPAWN_DISTANCE)

    def knock_back(self):
        self.knock = 0.8

    def update(self):
        dt = game_framework.frame_time
        self.t += dt
        self.ram_cool -= dt
        earth = self.earth
        dx, dy = earth.x - self.x, earth.y - self.y
        d = math.hypot(dx, dy)
        speed = self.speed * self.moon.slow_at(self.x, self.y)
        if self.knock > 0:
            # 튕겨 나가는 동안은 지구 반대쪽으로 밀려남
            self.knock -= dt
            speed = -120
        self.x += dx / d * speed * dt
        self.y += dy / d * speed * dt
        if d < earth.radius + self.radius:
            earth.hit(self.damage)
            effect.play(self.boom_name, self.x, self.y)
            game_world.remove_object(self)

    def hit(self, damage):
        if self.hp <= 0:
            return
        self.hp -= damage
        if self.hp <= 0:
            self.destroy()

    def destroy(self):
        self.hp = 0
        game_world.remove_object(self)
        effect.play(self.boom_name, self.x, self.y)
        sound.play(self.boom_sound)
        # 부서진 자리에 경험치 파편을 떨어뜨림
        for _ in range(self.fragments):
            game_world.add_object(Fragment(self.x, self.y, self.moon, self.on_collect), game_world.PICKUP)

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)


class BigAsteroid(SmallAsteroid):
    radius = 11
    speed = 40
    max_hp = 4
    damage = 15
    fragments = 3
    heavy = True
    sheet_name = 'asteroid-big'
    boom_name = 'explosion-big'
    boom_sound = 'explode_big'

    def destroy(self):
        super().destroy()
        # 부서지면 작은 소행성 3개로 갈라짐
        for i in range(3):
            a = i * math.tau / 3 + random.uniform(-0.4, 0.4)
            game_world.add_object(SmallAsteroid(self.earth, self.moon, self.on_collect,
                                                self.x + math.cos(a) * 10, self.y + math.sin(a) * 10),
                                  game_world.ENEMY)
