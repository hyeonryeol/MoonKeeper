from pico2d import *

import common
import game_framework
import guide
import panels
import play_mode
import sound

# 게임 시작 전에 플레이 위에 띄우는 키와 화면 설명


def init():
    guide.reset()


def finish():
    pass


def pause():
    pass


def resume():
    pass


def next_step():
    # 설명이 다 끝나 모드를 닫았으면 True
    sound.play('select')
    if guide.next_step():
        game_framework.pop_mode()
        return True
    return False


def handle_events():
    for event in get_events():
        if event.type in (SDL_KEYDOWN, SDL_KEYUP) and event.key == SDLK_TAB:
            play_mode.show_gears = event.type == SDL_KEYDOWN
            # 장비 보기 설명은 Tab을 눌렀다 떼면 넘어감
            if guide.waits_tab() and event.type == SDL_KEYUP and next_step():
                return
        elif common.handle_common(event):
            pass
        elif event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            sound.play('select')
            game_framework.pop_mode()
            return
        elif event.type == SDL_KEYDOWN and event.key in (SDLK_RETURN, SDLK_SPACE) and not guide.waits_tab():
            if next_step():
                return
        # 설명 보는 동안 누르고 뗀 방향키도 달에 알려줌
        elif event.type in (SDL_KEYDOWN, SDL_KEYUP):
            play_mode.moon.handle_event(event)


def update():
    pass


def render():
    common.begin()
    play_mode.draw_world()
    guide.draw(play_mode.moon, common.font, common.big_font)
    # 장비 보기 설명 때는 어두운 막 위에 패널을 띄움
    if play_mode.show_gears:
        panels.draw(play_mode.moon, common.font, play_mode.clock)
    common.end()
