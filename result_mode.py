from pico2d import *

import common
import game_framework
import play_mode
import result
import sound
import title_mode

# 끝난 판의 기록, 플레이 모드가 끝날 때 채움
cleared = False
stats = None
moon = None
result_time = 0.0


def set_result(win, record, the_moon):
    global cleared, stats, moon
    cleared, stats, moon = win, record, the_moon


def init():
    global result_time
    result_time = 0.0


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
        elif event.key == SDLK_r:
            play_mode.start()
            return
        elif event.key == SDLK_t:
            game_framework.change_mode(title_mode)
            sound.play('select')
            return


def update():
    global result_time
    result_time += game_framework.frame_time


def render():
    common.begin()
    # 결과 화면에서는 게임 화면을 숨기고 배경 위에 결과만
    common.draw_background()
    result.draw(result_time, cleared, stats, moon, common.font, common.big_font)
    common.end()
