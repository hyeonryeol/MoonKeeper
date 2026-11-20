import sys

from pico2d import *

import common
import game_framework
import play_mode
import sound
from common import W, H
from sheet import get_sheet

# 스킬을 처음 쓸 때와 보스가 나올 때 플레이 위에 띄우는 컷인
# 그림 이름, 제목, 제목 색, 끝나고 할 일, 제목 높이, 제목 나오는 시간
sheet_name, title, color, action, title_y, title_at = None, '', (255, 255, 255), None, 130, 1.9
cutin_time = 0.0


def start(name, text, text_color, then=None, text_y=130, text_at=1.9, sfx=None):
    global sheet_name, title, color, action, title_y, title_at
    sheet_name, title, color, action, title_y, title_at = name, text, text_color, then, text_y, text_at
    if sfx:
        sound.play(sfx)
    game_framework.push_mode(sys.modules[__name__])


def init():
    global cutin_time
    cutin_time = 0.0


def finish():
    pass


def pause():
    pass


def resume():
    pass


def handle_events():
    for event in get_events():
        if common.handle_common(event):
            continue
        if event.type == SDL_KEYUP:
            play_mode.moon.handle_event(event)


def update():
    global cutin_time
    cutin_time += game_framework.frame_time
    if cutin_time >= get_sheet(sheet_name).duration():
        game_framework.pop_mode()
        if action:
            action()


def render():
    common.begin()
    play_mode.draw_world()
    # 그림을 두 배로 늘려 화면 가운데에 그림, 어두운 막도 그림 안에 있음
    s = get_sheet(sheet_name)
    s.draw(cutin_time, 0, H / 2 + s.h, 0, 2)
    if title_at < cutin_time < 2.6:
        common.big_font.draw(W / 2 - 13 * len(title), title_y, title, color)
    common.end()
