import math

from pico2d import draw_rectangle

from panels import SKILL_X, SKILL_Y

W, H = 800, 600
WHITE = (243, 239, 228)
DIM = (150, 156, 190)
GOLD = (232, 197, 71)
BOX_W = 300

# 비출 곳 왼쪽 아래 오른쪽 위, 말풍선 가운데, 제목, 설명 줄
# 비출 곳이 moon이면 달 자리, None이면 비추지 않고 상자만
# 장비 단계는 Enter 대신 Tab을 눌렀다 떼야 넘어감
TAB_STEP = 1
STEPS = [
    ('moon', (610, 450), '달 조종', ['오른쪽 키 가속  왼쪽 키 감속', '빠를수록 궤도가 넓어짐', '손을 떼면 그 속도 유지']),
    (None, (250, 400), '장비 보기', ['Tab을 누르고 있는 동안', '단 장비와 가속력이 뜸', '지금 Tab을 눌러 보기']),
    ((14, 556, 256, 590), (200, 455), '지구 HP', ['소행성이 지구에 닿으면 줄어듦', '0이 되면 게임 오버']),
    ((530, 560, 750, 592), (600, 455), '웨이브', ['칸 9개를 다 버티면 보스', '보스를 부수면 클리어']),
    ((14, 12, 256, 40), (200, 150), '파편과 경험치', ['부순 소행성의 파편을 달로 주움', '막대가 다 차면 레벨업', '증강 카드 하나 고르기']),
    ((256, 4, 324, 68), (400, 170), '속도계', ['지금 달 속도', '장비가 많을수록 천천히 바뀜']),
    ((624, 6, 776, 58), (620, 170), '스킬 칸', ['레벨 5부터 스킬 카드가 나옴', '얻은 순서대로 Q W E']),
]

step = 0


def reset():
    global step
    step = 0


def next_step():
    # 마지막 설명까지 봤으면 True
    global step
    step += 1
    return step >= len(STEPS)


def target_rect(target, moon):
    if target == 'moon':
        return moon.x - 32, moon.y - 32, moon.x + 32, moon.y + 32
    return target


def box_rect(center, lines):
    cx, cy = center
    # 제목 줄과 아래 안내 줄까지 포함한 높이
    h = 76 + len(lines) * 22
    return cx - BOX_W / 2, cy - h / 2, cx + BOX_W / 2, cy + h / 2


def inside(x, y, r, pad=0):
    return r[0] - pad <= x <= r[2] + pad and r[1] - pad <= y <= r[3] + pad


def draw_shade(hole):
    # 비출 곳만 빼고 화면을 어둡게 덮음
    shade = (7, 11, 31, 190, True)
    if hole is None:
        draw_rectangle(0, 0, W, H, *shade)
        return
    l, b, r, t = hole
    draw_rectangle(0, 0, W, b, *shade)
    draw_rectangle(0, t, W, H, *shade)
    draw_rectangle(0, b, l, t, *shade)
    draw_rectangle(r, b, W, t, *shade)
    draw_rectangle(l, b, r, t, *GOLD)


def draw_pointer(box, hole):
    # 말풍선에서 비춘 곳까지 점선, 끝에는 큰 점
    bx, by = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    tx = min(max(bx, hole[0]), hole[2])
    ty = min(max(by, hole[1]), hole[3])
    if inside(bx, by, hole):
        return
    d = math.hypot(tx - bx, ty - by)
    n = int(d / 9)
    for i in range(n):
        x = bx + (tx - bx) * i / n
        y = by + (ty - by) * i / n
        if not inside(x, y, box, 2):
            draw_rectangle(x - 1, y - 1, x + 2, y + 2, *GOLD, 255, True)
    draw_rectangle(tx - 4, ty - 4, tx + 4, ty + 4, *GOLD, 255, True)


def waits_tab():
    return step == TAB_STEP


def draw_box(font, box, title, lines, count, footer):
    l, b, r, t = box
    draw_rectangle(l, b, r, t, 30, 38, 84, 255, True)
    draw_rectangle(l, b, r, t, *GOLD)
    draw_rectangle(l, t - 5, r, t, *GOLD, 255, True)
    font.draw(l + 16, t - 24, title, GOLD)
    for i, line in enumerate(lines):
        font.draw(l + 16, t - 52 - i * 22, line, WHITE)
    if count:
        font.draw(r - 46, t - 24, count, DIM)
    font.draw(l + 16, b + 16, footer, DIM)


def draw(moon, font, big_font):
    target, center, title, lines = STEPS[step]
    hole = None if target is None else target_rect(target, moon)
    draw_shade(hole)
    box = box_rect(center, lines)
    if hole:
        draw_pointer(box, hole)
    footer = 'Tab 누르기   ESC 건너뛰기' if waits_tab() else 'Enter 다음   ESC 건너뛰기'
    draw_box(font, box, title, lines, '%d/%d' % (step + 1, len(STEPS)), footer)


def draw_skill(i, name, key, font):
    # 새 스킬을 얻으면 그 칸을 비추고 키를 한 번 눌러 보게 함
    cx = SKILL_X + i * 50
    hole = cx - 26, SKILL_Y - 26, cx + 26, SKILL_Y + 26
    draw_shade(hole)
    lines = ['%s 키로 쓰고' % key, '아래 막대가 다 차면 다시 쓸 수 있음', '지금 %s 키를 눌러 보기' % key]
    box = box_rect((610, 190), lines)
    draw_pointer(box, hole)
    draw_box(font, box, '새 스킬  ' + name, lines, None, '%s 누르기   ESC 건너뛰기' % key)
