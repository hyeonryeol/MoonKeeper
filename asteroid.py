import math
import random

import effect
import game_framework
import game_world
import sound
from fragment import Fragment
from sheet import get_sheet

SPAWN_DISTANCE = 470
# 결과 화면에 쓰는 부순 소행성 수
destroyed = 0


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
    hit_sound = None

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
        elif self.hit_sound:
            sound.play(self.hit_sound)

    def destroy(self):
        global destroyed
        destroyed += 1
        self.hp = 0
        game_world.remove_object(self)
        effect.play(self.boom_name, self.x, self.y)
        sound.play(self.boom_sound)
        # 부서진 자리에 경험치 파편을 떨어뜨림
        for _ in range(self.fragments):
            game_world.add_object(Fragment(self.x, self.y, self.moon, self.on_collect), game_world.PICKUP)

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)


class MediumAsteroid(SmallAsteroid):
    # 예전 큰 소행성, 그림 이름은 그대로 asteroid-big
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


class LargeAsteroid(MediumAsteroid):
    radius = 18
    speed = 32
    max_hp = 10
    damage = 25
    fragments = 5
    sheet_name = 'asteroid-large'

    def destroy(self):
        SmallAsteroid.destroy(self)
        # 부서지면 중간 소행성 2개로 갈라짐
        for i in range(2):
            a = i * math.pi + random.uniform(-0.5, 0.5)
            game_world.add_object(MediumAsteroid(self.earth, self.moon, self.on_collect,
                                                 self.x + math.cos(a) * 14, self.y + math.sin(a) * 14),
                                  game_world.ENEMY)


def cluster_at_edge(earth, moon, on_collect, angle):
    # 소행성 군집, 작은 소행성 5개가 한 덩어리로 붙어서 같이 날아옴
    lead = SmallAsteroid.at_edge(earth, moon, on_collect, angle)
    group = [lead]
    for i in range(4):
        a = i * math.tau / 4 + random.uniform(-0.3, 0.3)
        group.append(SmallAsteroid(earth, moon, on_collect, lead.x + math.cos(a) * 14, lead.y + math.sin(a) * 14))
    return group


class Comet(SmallAsteroid):
    radius = 5
    speed = 120
    max_hp = 2
    damage = 10
    fragments = 2
    sheet_name = 'comet'
    # 멀리 있을수록 옆으로 크게 휘어 들어옴
    curve = 0.9

    def __init__(self, earth, moon, on_collect, x, y):
        super().__init__(earth, moon, on_collect, x, y)
        self.side = random.choice((-1, 1))
        self.rad = 0.0

    def update(self):
        dt = game_framework.frame_time
        self.t += dt
        self.ram_cool -= dt
        earth = self.earth
        dx, dy = earth.x - self.x, earth.y - self.y
        d = math.hypot(dx, dy)
        self.rad = math.atan2(dy, dx) + self.side * self.curve * min(1.0, d / SPAWN_DISTANCE)
        speed = self.speed * self.moon.slow_at(self.x, self.y)
        self.x += math.cos(self.rad) * speed * dt
        self.y += math.sin(self.rad) * speed * dt
        if d < earth.radius + self.radius:
            earth.hit(self.damage)
            effect.play(self.boom_name, self.x, self.y)
            game_world.remove_object(self)

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y, self.rad)


class Boss(MediumAsteroid):
    # 지구의 두 배 크기
    radius = 80
    speed = 20
    max_hp = 160
    # 지구에 닿으면 HP 전부를 깎아 바로 게임 오버
    damage = 100
    fragments = 30
    sheet_name = 'asteroid-boss'
    boom_sound = 'boss_explode'
    hit_sound = 'boss_hit'
    # 10초마다 작은 소행성 4개를 뿌림
    throw_gap = 10.0

    def __init__(self, earth, moon, on_collect, x, y):
        super().__init__(earth, moon, on_collect, x, y)
        self.throw = self.throw_gap

    def update(self):
        dt = game_framework.frame_time
        super().update()
        self.throw -= dt
        if self.throw <= 0 and self.hp > 0:
            self.throw = self.throw_gap
            for i in range(4):
                a = i * math.tau / 4 + random.uniform(-0.3, 0.3)
                game_world.add_object(SmallAsteroid(self.earth, self.moon, self.on_collect,
                                                    self.x + math.cos(a) * (self.radius + 6), self.y + math.sin(a) * (self.radius + 6)),
                                      game_world.ENEMY)

    def destroy(self):
        # 보스는 갈라지지 않음
        SmallAsteroid.destroy(self)
