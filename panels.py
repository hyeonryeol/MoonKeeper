from pico2d import draw_rectangle

import augment
from gear import level_sheet
from moon import BASE_FORCE
from result import fit_icon
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



def frame(x):
    # 내용 높이에 맞춘 100 172 틀을 두 배로, 뒤 게임이 조금 비치게
    sheet = get_sheet('panel-tab')
    sheet.image.opacify(0.85)
    sheet.draw(0, x, H, 0, 2)


def icon(name, x, y, scale, t):
    # 도트가 뭉개지지 않게 정수배로 키워 가운데에 그림
    s = get_sheet(name)
    s.draw(t % s.duration(), x - (s.w / 2 - s.px) * scale, y - (s.py - s.h / 2) * scale, 0, scale)


def bar(x, y, w, h, k, color):
    draw_rectangle(x, y, x + w, y + h, *EMPTY, 255, True)
    if k > 0:
        draw_rectangle(x, y, x + int(w * k), y + h, *color, 255, True)


def pips(x, y, level):
    for i in range(augment.MAX_LEVEL):
        color = GOLD if i < level else EMPTY
        draw_rectangle(x + i * 12, y - 4, x + i * 12 + 8, y + 4, *color, 255, True)


def draw_gear(moon, font, t):
    # 장비와 가속력만, 스킬은 화면 구석 칸에 따로
    x = RIGHT_X
    # 제목 대신 기본 포탑 그림
    icon('gear-turret', x + SIDE / 2, HEADER_Y, 2, t)
    # 장비는 그림과 레벨 점만, 두 줄로 나란히
    gears = [g for g in moon.gears if g.key != 'turret']
    for i, g in enumerate(gears):
        cx = x + 30 + (i % 2) * 80
        cy = 505 - (i // 2) * 44
        data = augment.AUGMENTS[g.key]
        name = level_sheet(data['sheet'], g.level)
        # 방패 고리는 그림이 커서 줄여 그림
        if g.key == 'shield':
            fit_icon(name, cx + 12, cy + 6, 30, t)
        else:
            icon(name, cx + 12, cy + 6, 2, t)
        pips(cx - 3, cy - 16, g.level)
    # 무게 때문에 줄어든 가속력을 추진기 그림과 막대로
    icon('gear-thruster', x + 40, 318, 2, t)
    bar(x + 54, 313, 110, 10, moon.force() / BASE_FORCE, TEAL)



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


def draw(moon, font, t):
    # Tab을 누르고 있는 동안만 오른쪽에 장비 패널
    frame(RIGHT_X)
    draw_gear(moon, font, t)
