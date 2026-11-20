from pico2d import draw_rectangle

import augment
from sheet import get_sheet

SIDE = 200
H = 600
RIGHT_X = 600
SKILL_X, SKILL_Y = 650, 32
WHITE = (243, 239, 228)
DIM = (150, 156, 190)
GOLD = (232, 197, 71)
TEAL = (95, 212, 224)
EMPTY = (40, 44, 80)
HEADER_Y = 563


def fit_icon(name, x, y, size, t):
    s = get_sheet(name)
    k = size / max(s.w, s.h)
    s.draw(t % s.duration(), x - (s.w / 2 - s.px) * k, y - (s.py - s.h / 2) * k, 0, k)


def bar(x, y, w, h, k, color):
    draw_rectangle(x, y, x + w, y + h, *EMPTY, 255, True)
    if k > 0:
        draw_rectangle(x, y, x + int(w * k), y + h, *color, 255, True)


def draw_skills(moon, font, t):
    # 스킬 재사용은 늘 봐야 해서 게임 화면 오른쪽 아래에 작은 칸 3개
    for i in range(augment.MAX_SKILLS):
        cx, cy = SKILL_X + i * 50, SKILL_Y
        l, b = cx - 22, cy - 22
        draw_rectangle(l, b, l + 44, b + 44, 20, 24, 50, 255, True)
        if i >= len(moon.skills):
            draw_rectangle(l, b, l + 44, b + 44, *EMPTY)
            continue
        s = moon.skills[i]
        ready = s.ready()
        color = augment.KIND_COLOR['스킬'] if ready else DIM
        draw_rectangle(l, b, l + 44, b + 44, *color)
        fit_icon(augment.AUGMENTS[s.key]['sheet'], cx, cy + 3, 30, augment.icon_time(s.key, t))
        # 어떤 키인지는 알아야 해서 글자 하나만
        font.draw(l + 3, b + 36, augment.SKILL_KEYS[i], color)
        # 재사용 남은 만큼 아래 막대가 비어 있음
        bar(l + 4, b + 4, 36, 4, 1.0 if ready else 1 - s.wait / s.cooldown(), color)
