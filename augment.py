import random

from gear import Gear, LaserTurret, MissilePod, Drone, Coil, Shield, Anchor

# 가시 갑옷과 추진기는 따로 하는 일 없이 달이 가지고 있는지만 봄
AUGMENTS = {
    'laser': dict(name='레이저 포탑', kind='무기', desc=['짧은 사거리', '빠른 연사'], sheet='gear-laser', cls=LaserTurret),
    'missile': dict(name='미사일 포드', kind='무기', desc=['4초마다 유도탄', '큰 소행성에 강함'], sheet='gear-missile-pod', cls=MissilePod),
    'drone': dict(name='궤도 드론', kind='무기', desc=['달 둘레를 돌다가', '다가온 적을 들이받음'], sheet='drone', cls=Drone),
    'coil': dict(name='번개 코일', kind='무기', desc=['가까운 적 3개에', '연쇄 공격'], sheet='gear-coil', cls=Coil),
    'shield': dict(name='방패 고리', kind='방어', desc=['큰 소행성 1개 튕겨냄', '8초 재충전'], sheet='shield-ring', cls=Shield),
    'anchor': dict(name='중력 닻', kind='방어', desc=['주변 소행성', '속도 50%'], sheet='gear-anchor', cls=Anchor),
    'spikes': dict(name='가시 갑옷', kind='방어', desc=['들이받아도', '감속 없음'], sheet='gear-spikes', cls=Gear),
    'thruster': dict(name='추진기', kind='방어', desc=['무게 영향', '절반'], sheet='gear-thruster', cls=Gear),
}

# 같은 증강을 다시 고를 때 카드에 보여줄 강화 내용, 레벨 2와 3
MAX_LEVEL = 3
UPGRADES = {
    'laser': [['사거리 170', '연사 0.2초'], ['사거리 190', '연사 0.15초']],
    'missile': ['한 번에 3발', '한 번에 4발'],
    'drone': ['드론 2대', '드론 3대'],
    'coil': [['연쇄 4개'], ['연쇄 5개', '범위 150']],
    'shield': ['재충전 6초', '재충전 4초'],
    'anchor': ['범위 110', '범위 130'],
    'spikes': ['들이받기 피해 3', '들이받기 피해 4'],
    'thruster': ['무게 영향 1/3', '무게 영향 1/4'],
}

KIND_COLOR = {'무기': (242, 133, 74), '방어': (95, 212, 224)}


def level_of(moon, key):
    g = moon.gear(key)
    return g.level if g else 0


def describe(moon, key):
    # 처음 다는 장비는 설명, 강화 카드는 다음 레벨 내용
    lv = level_of(moon, key)
    if lv == 0:
        return AUGMENTS[key]['desc']
    up = UPGRADES[key][lv - 1]
    return up if isinstance(up, list) else [up]


def roll(moon, n=3):
    # 아직 Lv 3이 안 된 증강 중에서 뽑음
    keys = [k for k in AUGMENTS if level_of(moon, k) < MAX_LEVEL]
    return random.sample(keys, min(n, len(keys)))


def apply(moon, key):
    # 이미 단 장비면 강화, 처음이면 새로 닮
    g = moon.gear(key)
    if g:
        g.level += 1
        return
    data = AUGMENTS[key]
    moon.gears.append(data['cls'](moon, key, data['sheet'], len(moon.gears)))
