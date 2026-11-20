import random

from gear import Gear, LaserTurret, MissilePod, Drone, Coil, Shield, Anchor
from skill import PierceLaser, EarthBoost

MAX_LEVEL = 3
MAX_SKILLS = 3
# 이 레벨 전까지는 장비 카드만 나옴
SKILL_LEVEL = 5
SKILL_KEYS = 'QWE'

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
    'pierce': dict(name='관통 레이저', kind='스킬', desc=['적이 많은 쪽으로', '일직선 빔 피해 3', '재사용 8초'], sheet='laser-beam', cutin='cutin-laser-long', cls=PierceLaser),
    'boost': dict(name='지구 추진기', kind='스킬', desc=['지구가 소행성', '반대쪽으로 피함', '재사용 20초'], sheet='earth-thruster', cutin='cutin-earth-thruster-long', cls=EarthBoost),
}

# 같은 증강을 다시 고를 때 카드에 보여줄 강화 내용
UPGRADES = {
    'laser': [['사거리 170', '연사 0.2초'], ['사거리 190', '연사 0.15초']],
    'missile': ['한 번에 3발', '한 번에 4발'],
    'drone': ['드론 2대', '드론 3대'],
    'coil': [['연쇄 4개'], ['연쇄 5개', '범위 150']],
    'shield': ['재충전 6초', '재충전 4초'],
    'anchor': ['범위 110', '범위 130'],
    'spikes': ['들이받기 피해 3', '들이받기 피해 4'],
    'thruster': ['무게 영향 1/3', '무게 영향 1/4'],
    'pierce': [['3갈래 피해 4', '재사용 7초'], ['5갈래 피해 5', '재사용 6초']],
    'boost': [['두 배 멀리 피함', '재사용 17초'], ['소행성이 없는 곳으로', '재사용 14초']],
}

KIND_COLOR = {'무기': (242, 133, 74), '방어': (95, 212, 224), '스킬': (232, 197, 71)}


def is_skill(key):
    return AUGMENTS[key]['kind'] == '스킬'


def owned(moon, key):
    return moon.skill(key) if is_skill(key) else moon.gear(key)


def level_of(moon, key):
    g = owned(moon, key)
    return g.level if g else 0


def can_take(moon, key):
    lv = level_of(moon, key)
    # 스킬 칸은 Q W E 세 개뿐
    if lv == 0 and is_skill(key):
        return len(moon.skills) < MAX_SKILLS
    return lv < MAX_LEVEL


def describe(moon, key):
    # 처음 다는 장비는 설명, 강화 카드는 다음 레벨 내용
    lv = level_of(moon, key)
    if lv == 0:
        return AUGMENTS[key]['desc']
    up = UPGRADES[key][lv - 1]
    return up if isinstance(up, list) else [up]


def roll(moon, level, n=3):
    # 아직 더 올릴 수 있는 증강 중에서 뽑음
    keys = [k for k in AUGMENTS if can_take(moon, k) and (level >= SKILL_LEVEL or not is_skill(k))]
    return random.sample(keys, min(n, len(keys)))


def apply(moon, key):
    # 이미 달았으면 강화, 처음이면 새로 닮
    g = owned(moon, key)
    if g:
        g.level += 1
        return
    data = AUGMENTS[key]
    if is_skill(key):
        moon.skills.append(data['cls'](moon, key))
        return
    moon.gears.append(data['cls'](moon, key, data['sheet'], len(moon.gears)))
