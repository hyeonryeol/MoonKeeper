from pico2d import *

import common
import game_framework
import intro
import result_mode
import sound


def init():
    # 보스를 부수면 결과 화면 전에 끝 이야기
    sound.stop_music()
    intro.reset(True)


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
            game_framework.change_mode(result_mode)
            return
        elif event.key in (SDLK_RETURN, SDLK_SPACE) and intro.next_scene():
            game_framework.change_mode(result_mode)
            return


def update():
    if intro.update(game_framework.frame_time):
        game_framework.change_mode(result_mode)


def render():
    common.begin()
    intro.draw(common.font, common.big_font)
    common.end()
