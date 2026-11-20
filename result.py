import math

from pico2d import draw_rectangle

import augment
from gear import level_sheet
from sheet import get_sheet

W, H = 800, 600
MOON_X, MOON_Y = 190, 300
MOON_SCALE = 3
ROW_GAP = 0.35
COUNT_TIME = 0.6

WHITE = (243, 239, 228)
DIM = (150, 156, 190)


def fit_icon(name, x, y, size, t):
    s = get_sheet(name)
    k = size / max(s.w, s.h)
    s.draw(t % s.duration(), x - (s.w / 2 - s.px) * k, y - (s.py - s.h / 2) * k, 0, k)


def draw_moon(moon, t):
    # 그 판에서 단 장비를 그대로 단 채로 크게 천천히 돌림
    spin = t * 0.5
    r = (moon.radius - 2) * MOON_SCALE
    for g in moon.gears:
        name = level_sheet(g.sheet_name, g.level) if g.key != 'turret' else g.sheet_name
        s = get_sheet(name)
        if g.key == 'shield':
            s.draw(t, MOON_X, MOON_Y, 0, MOON_SCALE)
        elif g.key == 'drone':
            for i in range(g.level):
                a = t * 1.5 + i * math.tau / g.level
                s.draw(t, MOON_X + math.cos(a) * r * 2, MOON_Y + math.sin(a) * r * 2, 0, MOON_SCALE)
        else:
            a = spin + g.offset
            s.draw(t, MOON_X + math.cos(a) * r, MOON_Y + math.sin(a) * r, a, MOON_SCALE)
    get_sheet('moon').draw(t, MOON_X, MOON_Y, 0, MOON_SCALE)


def count(value, t, row):
    # 줄마다 차례로 나타나며 0부터 올라감
    k = (t - row * ROW_GAP) / COUNT_TIME
    if k <= 0:
        return None
    return value * min(1.0, k)


def draw(t, cleared, stats, moon, font, big_font):
    draw_rectangle(0, 0, W, H, 7, 11, 31, 120, True)
    get_sheet('result-clear' if cleared else 'result-over').draw(t, W / 2, 495, 0, 2)
    draw_moon(moon, t)

    rows = [
        ('도달 웨이브', stats['wave'], lambda v: '%d / %d' % (v, stats['last'])),
        ('버틴 시간', stats['time'], lambda v: '%d:%02d' % divmod(int(v), 60)),
        ('레벨', stats['level'], lambda v: 'Lv %d' % v),
        ('부순 소행성', stats['kills'], lambda v: '%d' % v),
        ('모은 파편', stats['fragments'], lambda v: '%d' % v),
        ('남은 지구 HP', stats['hp'], lambda v: '%d' % v),
    ]
    for i, (label, value, fmt) in enumerate(rows):
        v = count(value, t, i)
        if v is None:
            continue
        y = 390 - i * 34
        font.draw(400, y, label, DIM)
        big_font.draw(590, y, fmt(v), WHITE)

    # 고른 장비와 스킬은 숫자 다 나온 뒤에
    if t > len(rows) * ROW_GAP + 0.3:
        x = 80
        font.draw(40, 150, '장비', DIM)
        for g in moon.gears:
            if g.key == 'turret':
                continue
            data = augment.AUGMENTS[g.key]
            fit_icon(level_sheet(data['sheet'], g.level), x + 22, 150, 32, t)
            font.draw(x + 6, 122, 'Lv %d' % g.level, augment.KIND_COLOR[data['kind']])
            x += 56
        if len(moon.gears) == 1:
            font.draw(x, 150, '없음', DIM)
        x = 80
        font.draw(40, 90, '스킬', DIM)
        for i, s in enumerate(moon.skills):
            data = augment.AUGMENTS[s.key]
            font.draw(x, 90, '%s %s Lv %d' % (augment.SKILL_KEYS[i], data['name'], s.level), augment.KIND_COLOR['스킬'])
            x += 200
        if not moon.skills:
            font.draw(x, 90, '없음', DIM)

    if int(t * 2) % 2 == 0 or t < 3:
        font.draw(W / 2 - 160, 35, 'R 다시 하기     T 타이틀     ESC 끄기', WHITE)
