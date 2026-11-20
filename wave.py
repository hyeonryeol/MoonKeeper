import math
import random

import game_framework
import game_world
import sound
from asteroid import SmallAsteroid, MediumAsteroid, LargeAsteroid, Comet, Boss, cluster_at_edge

# 웨이브 표, 작은 중간 혜성 군집 큰 소행성 수
# 1웨이브는 예전 그대로, 2웨이브부터는 위험도가 예전의 두 배 이상이 되게 종류를 섞음
# 중간은 2웨이브, 혜성은 3웨이브, 군집과 큰 소행성은 5웨이브부터 나오고 뒤로 갈수록 무거운 종류가 많아짐
WAVES = [
    (32, 0, 0, 0, 0),
    (60, 7, 0, 0, 0),
    (80, 14, 13, 0, 0),
    (70, 18, 15, 0, 0),
    (50, 14, 14, 6, 2),
    (50, 16, 16, 8, 3),
    (30, 20, 20, 8, 4),
    (60, 18, 20, 10, 5),
    (60, 24, 24, 10, 6),
]
LAST = len(WAVES) + 1
REST = 3.0
# 웨이브를 막아 내면 지구 HP 회복
HEAL = 10
# 7웨이브는 양쪽에서 동시에 공격
TWO_SIDES = 7


def duration(n):
    # 웨이브 1은 60초, 9는 90초로 조금씩 길어짐
    return 60 + (n - 1) * 30 / (len(WAVES) - 1)


# 웨이브 상태 머신, 수업의 Idle Run Sleep처럼 상태마다 클래스로 나눔
# 상태 그림
#   REST 쉬기 --time_out--> SPAWN 소행성 나옴 --wave_cleared--> REST
#   REST --boss_time--> BOSS 보스전 --boss_down--> CLEAR 클리어
#   REST SPAWN --skip--> REST  시험용 N 키
class Rest:
    def enter(self, waves):
        waves.timer = REST

    def do(self, waves):
        waves.timer -= game_framework.frame_time
        if waves.timer <= 0:
            waves.fire('boss_time' if waves.number == LAST else 'time_out')


class Spawn:
    def enter(self, waves):
        sound.play('wave_start')
        small, medium, comet, cluster, large = WAVES[waves.number - 1]
        waves.queue = ([SmallAsteroid] * small + [MediumAsteroid] * medium + [Comet] * comet +
                       ['cluster'] * cluster + [LargeAsteroid] * large)
        random.shuffle(waves.queue)
        # 웨이브 시간 동안 고르게 나눠서 나옴
        waves.gap = duration(waves.number) / len(waves.queue)
        waves.timer = 1.0
        waves.side = random.uniform(0, math.tau)

    def do(self, waves):
        waves.timer -= game_framework.frame_time
        if waves.timer <= 0 and waves.queue:
            waves.spawn_next()
            waves.timer = waves.gap
        # 다 나오고 화면의 적을 다 부수면 웨이브 끝
        if not waves.queue and not game_world.objects_at(game_world.ENEMY):
            waves.earth.heal(HEAL)
            waves.number += 1
            waves.fire('wave_cleared')


class BossFight:
    def enter(self, waves):
        waves.boss = Boss.at_edge(waves.earth, waves.moon, waves.on_collect, random.uniform(0, math.tau))
        game_world.add_object(waves.boss, game_world.ENEMY)

    def do(self, waves):
        if waves.boss.hp <= 0 and not game_world.objects_at(game_world.ENEMY):
            waves.fire('boss_down')


class Clear:
    def enter(self, waves):
        pass

    def do(self, waves):
        pass


# 이벤트, 지금 상태, 다음 상태
TRANSITIONS = [
    ('time_out', ['REST'], 'SPAWN'),
    ('boss_time', ['REST'], 'BOSS'),
    ('wave_cleared', ['SPAWN'], 'REST'),
    ('skip', ['REST', 'SPAWN'], 'REST'),
    ('boss_down', ['BOSS'], 'CLEAR'),
]


class Waves:
    def __init__(self, earth, moon, on_collect):
        self.earth, self.moon, self.on_collect = earth, moon, on_collect
        self.number = 1
        self.timer = 0.0
        self.queue = []
        self.gap = 0.0
        self.side = 0.0
        self.boss = None
        self.states = {'REST': Rest(), 'SPAWN': Spawn(), 'BOSS': BossFight(), 'CLEAR': Clear()}
        self.state = 'REST'
        self.states[self.state].enter(self)

    def fire(self, event):
        # 표에서 지금 상태로 받을 수 있는 이벤트면 다음 상태로 옮김
        for trigger, sources, dest in TRANSITIONS:
            if trigger == event and self.state in sources:
                self.state = dest
                self.states[dest].enter(self)
                return True
        return False

    def angle(self):
        if self.number == TWO_SIDES:
            # 정반대 두 방향에서 번갈아 나옴
            self.side += math.pi
            return self.side + random.uniform(-0.4, 0.4)
        return random.uniform(0, math.tau)

    def spawn_next(self):
        kind = self.queue.pop()
        if kind == 'cluster':
            group = cluster_at_edge(self.earth, self.moon, self.on_collect, self.angle())
        else:
            group = [kind.at_edge(self.earth, self.moon, self.on_collect, self.angle())]
        game_world.add_objects(group, game_world.ENEMY)

    def update(self):
        self.states[self.state].do(self)

    def skip(self):
        # 시험용 다음 웨이브로 바로 넘어감, 화면의 소행성도 지움
        if self.number >= LAST:
            return
        for a in game_world.objects_at(game_world.ENEMY)[:]:
            game_world.remove_object(a)
        self.queue = []
        self.number += 1
        self.fire('skip')

    def resting(self):
        return self.state == 'REST'

    def cleared(self):
        return self.state == 'CLEAR'
