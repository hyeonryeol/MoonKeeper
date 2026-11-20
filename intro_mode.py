from pico2d import *

import common
import game_framework
import intro
import play_mode
import sound

# 게임을 켜고 시작 이야기를 이미 봤는지
seen = False


def init():
    global seen
    seen = True
    sound.play('select')
    # 이야기 동안은 배경음 끔
    sound.stop_music()
    intro.reset()


def finish():
    intro.stop()


def pause():
    pass


def resume():
    pass


def handle_events():
    for event in get_events():
        if common.handle_common(event):
            continue
        if event.type != SDL_KEYDOWN:
            continue
        if event.key == SDLK_ESCAPE:
            play_mode.start(True)
            return
        elif event.key in (SDLK_RETURN, SDLK_SPACE) and intro.next_scene():
            play_mode.start(True)
            return


def update():
    if intro.update(game_framework.frame_time):
        play_mode.start(True)


def render():
    common.begin()
    intro.draw(common.font, common.big_font)
    common.end()
