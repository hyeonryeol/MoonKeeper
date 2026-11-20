from pico2d import *

import common
import game_framework
import intro_mode
import play_mode
import sound
import title

title_time = 0.0


def init():
    global title_time
    common.load()
    sound.music('title')
    title_time = 0.0


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
        if event.type != SDL_KEYDOWN:
            continue
        if event.key == SDLK_ESCAPE:
            game_framework.quit()
        elif event.key in (SDLK_RETURN, SDLK_SPACE):
            # 시작 이야기는 게임을 켜고 처음 한 번만
            if intro_mode.seen:
                play_mode.start(True)
            else:
                game_framework.change_mode(intro_mode)
            return


def update():
    global title_time
    title_time += game_framework.frame_time


def render():
    common.begin()
    common.draw_background()
    title.draw(title_time, common.font, common.big_font)
    common.end()
