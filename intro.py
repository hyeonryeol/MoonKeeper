import ctypes

from sdl2.sdlttf import TTF_SizeUTF8

import sheet
import sound
from sheet import get_sheet

W, H = 800, 600
# 장면 그림과 자막, 자막은 나오는 시간과 사라지는 시간과 글
SCENES = [
    ('intro-1', [(0.6, 4.6, '달은 오늘도 조용히 지구 곁을 돌고, 방어 위성들이 하늘을 지켰다.')]),
    ('intro-2', [(0.5, 5.1, '그날, 거대한 태양 폭풍이 방어 위성을 모두 망가뜨렸다.')]),
    ('intro-3', [(0.5, 4.6, '방어망이 꺼진 지구로 소행성 떼가 몰려왔다.')]),
    ('intro-4', [(1.7, 4.4, '첫 번째 소행성이 지구에 떨어졌다.')]),
    ('intro-5', [(0.5, 3.3, '남은 건 달 하나. 멈춰 있던 달의 포탑이 다시 깨어났다.'), (3.6, 5.4, '당신은 달지기. 지구를 끝까지 지켜라.')]),
]
# 보스를 부순 뒤의 끝 이야기
ENDING = [
    ('ending-1', [(0.8, 3.2, '거대 소행성이 산산이 부서졌다.'), (3.8, 6.7, '지구는 무사하다. 달지기가 지켜 냈다.')]),
]
# 맨 처음 글자 화면 길이, 연도가 한 글자씩 찍힘
CARD = 3.0
YEAR = '2187'
CARD_LINE = '지구 궤도'
# 자막이 찍히는 빠르기, 1초에 글자 수
TYPE = 32
LIGHT = (243, 239, 228)
DIM = (170, 176, 200)
HINT = (90, 96, 120)

# scene -1 은 처음 글자 화면, scenes 는 지금 틀고 있는 이야기
scene, time, typed = -1, 0.0, 0
scenes = SCENES


def reset(ending=False):
    global scene, time, typed, scenes
    scene, time, typed = -1, 0.0, 0
    sound.stop_all()
    scenes = ENDING if ending else SCENES
    # 끝 이야기는 글자 화면 없이 바로 그림
    if ending:
        enter(0)


def enter(n):
    # 장면에 들어갈 때 앞 장면 그림은 버리고 이 장면 그림과 소리를 준비
    global scene, time
    sound.stop_all()
    if 0 <= scene < len(scenes):
        sheet._sheets.pop(scenes[scene][0], None)
    scene, time = n, 0.0
    if scene < len(scenes):
        get_sheet(scenes[scene][0])
        sound.play(scenes[scene][0].replace('-', '_'))


def length():
    if scene < 0:
        return CARD
    return get_sheet(scenes[scene][0]).duration()


def next_scene():
    # 다음 장면으로, 다 봤으면 True
    enter(scene + 1)
    return scene >= len(scenes)


def stop():
    sound.stop_all()
    if 0 <= scene < len(scenes):
        sheet._sheets.pop(scenes[scene][0], None)


def update(dt):
    global time, typed
    time += dt
    if scene < 0:
        # 연도가 찍힐 때마다 톡
        n = min(len(YEAR), int((time - 0.5) / 0.22) + 1) if time > 0.5 else 0
        if n > typed:
            typed = n
            sound.play('intro_type')
    if time >= length():
        return next_scene()
    return False


def text_width(font, text):
    w, h = ctypes.c_int(), ctypes.c_int()
    TTF_SizeUTF8(font.font, text.encode('utf-8'), ctypes.byref(w), ctypes.byref(h))
    return w.value


def center(font, y, text, color, shown=None):
    # shown 글자까지만 찍되 자리는 전체 글 기준이라 흔들리지 않음
    x = W / 2 - text_width(font, text) / 2
    font.draw(x, y, text if shown is None else text[:shown], color)


def draw(font, big_font):
    if scene < 0:
        if typed:
            center(big_font, 318, YEAR, LIGHT, typed)
        if time > 1.6:
            center(big_font, 268, CARD_LINE, DIM, int((time - 1.6) * 12))
    elif scene < len(scenes):
        name, lines = scenes[scene]
        s = get_sheet(name)
        s.draw(time, 0, H / 2 + s.h, 0, 2)
        # 자막은 아래 검은 띠 안에 한 글자씩
        for start, end, line in lines:
            if start < time < end:
                center(font, 22, line, LIGHT, int((time - start) * TYPE))
    center(font, H - 22, 'Enter 넘기기   ESC 건너뛰기', HINT)
