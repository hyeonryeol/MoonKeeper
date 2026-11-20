from pico2d import *

import common
import game_framework
import pause as pause_menu
import play_mode
import sound
import title_mode

# 게임 중 ESC로 플레이 위에 띄우는 일시정지 메뉴


def init():
    pause_menu.reset()
    sound.play('select')


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
            # 멈춘 동안 뗀 방향키도 달에 알려줌
            play_mode.moon.handle_event(event)
            continue
        if event.type != SDL_KEYDOWN:
            continue
        if event.key == SDLK_ESCAPE:
            game_framework.pop_mode()
            return
        elif event.key == SDLK_UP:
            pause_menu.move(-1)
        elif event.key == SDLK_DOWN:
            pause_menu.move(1)
        elif event.key == SDLK_LEFT:
            pause_menu.adjust(-1)
        elif event.key == SDLK_RIGHT:
            pause_menu.adjust(1)
        elif event.key in (SDLK_RETURN, SDLK_SPACE):
            item = pause_menu.choice()
            if item == '계속하기':
                game_framework.pop_mode()
                return
            elif item == '타이틀로':
                # 일시정지를 닫고 그 아래 플레이까지 끝낸 뒤 타이틀로
                game_framework.pop_mode()
                game_framework.change_mode(title_mode)
                sound.play('select')
                return
            elif item == '게임 끄기':
                game_framework.quit()


def update():
    pass


def render():
    common.begin()
    play_mode.draw_world()
    pause_menu.draw(common.font, common.big_font)
    common.end()
