from pico2d import *

import augment
import common
import game_framework
import guide
import play_mode
import sound

# 첫 스킬을 얻었을 때 그 칸을 비추고 키를 한 번 눌러 보게 함
new_skill = 0


def init():
    pass


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
        if event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            sound.play('select')
            game_framework.pop_mode()
            return
        elif event.type == SDL_KEYDOWN and play_mode.SKILL_KEYS.get(event.key) == new_skill:
            game_framework.pop_mode()
            play_mode.use_skill(new_skill)
            return
        elif event.type in (SDL_KEYDOWN, SDL_KEYUP):
            play_mode.moon.handle_event(event)


def update():
    pass


def render():
    common.begin()
    play_mode.draw_world()
    s = play_mode.moon.skills[new_skill]
    guide.draw_skill(new_skill, augment.AUGMENTS[s.key]['name'], augment.SKILL_KEYS[new_skill], common.font)
    common.end()
