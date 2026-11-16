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

KIND_COLOR = {'무기': (242, 133, 74), '방어': (95, 212, 224)}


def roll(moon, n=3):
    # 아직 달지 않은 장비 중에서 뽑음
    keys = [k for k in AUGMENTS if moon.gear(k) is None]
    return random.sample(keys, min(n, len(keys)))


def apply(moon, key):
    data = AUGMENTS[key]
    moon.gears.append(data['cls'](moon, key, data['sheet'], len(moon.gears)))
