import math

from sheet import get_sheet

W, H = 800, 600
EARTH_X, EARTH_Y = 400, 230
# 비스듬히 내려다본 궤도라 납작한 타원
ORBIT_RX, ORBIT_RY = 200, 64
ORBIT_SPEED = 0.6
# 달에 주렁주렁 매달린 장비 그림과 붙는 각도
GEARS = [('gear-turret', 0.0), ('gear-laser-3', 0.9), ('gear-missile-pod-2', -0.9),
         ('gear-coil', 1.8), ('gear-thruster-2', math.pi)]


def moon_pos(t):
    a = t * ORBIT_SPEED
    return EARTH_X + math.cos(a) * ORBIT_RX, EARTH_Y + math.sin(a) * ORBIT_RY, a


def draw_moon(t):
    x, y, a = moon_pos(t)
    moon = get_sheet('moon')
    # 장비는 지구 반대쪽을 0으로 잡은 각도에 붙임
    out = math.atan2(y - EARTH_Y, x - EARTH_X)
    for name, off in GEARS:
        s = get_sheet(name)
        r = out + off
        s.draw(t, x + math.cos(r) * 26, y + math.sin(r) * 26, r, 2)
    moon.draw(t, x, y, 0, 2)


def draw_orbit(far):
    dot = get_sheet('fragment')
    for i in range(48):
        a = i / 48 * math.tau
        if (math.sin(a) > 0) != far:
            continue
        x, y = EARTH_X + math.cos(a) * ORBIT_RX, EARTH_Y + math.sin(a) * ORBIT_RY
        dot.draw(0, x, y, 0, 0.5)


def draw(t, font, big_font):
    _, _, a = moon_pos(t)
    # 궤도 위쪽 절반은 지구 뒤라서 지구보다 먼저 그림
    far = math.sin(a) > 0
    draw_orbit(True)
    if far:
        draw_moon(t)
    get_sheet('earth').draw(t, EARTH_X, EARTH_Y, 0, 2)
    draw_orbit(False)
    if not far:
        draw_moon(t)

    logo = get_sheet('title-logo')
    logo.draw(t, W / 2, 465, 0, 2)

    # 시작 안내는 깜빡임
    if int(t * 2) % 2 == 0:
        big_font.draw(W / 2 - 125, 90, 'Enter 키를 눌러 시작', (243, 239, 228))
