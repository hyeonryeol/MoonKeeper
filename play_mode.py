import math
import random

from pico2d import *

import augment
import card_mode
import common
import game_framework
import game_world
import sound
from asteroid import SmallAsteroid, BigAsteroid
from common import W, H
from earth import Earth
from moon import Moon
from sheet import get_sheet


def need(level):
    # 레벨 n에서 다음 레벨까지 파편 5n개
    return 5 * level


def init():
    global earth, moon, spawn_timer, spawn_count, level, xp, pending, clock
    common.load()
    game_world.clear()
    earth = Earth()
    game_world.add_object(earth, game_world.EARTH)
    moon = Moon(earth)
    game_world.add_object(moon, game_world.MOON)
    spawn_timer = 1.0
    spawn_count = 0
    level, xp, pending = 1, 0, 0
    clock = 0.0


def finish():
    game_world.clear()


def pause():
    pass


def resume():
    pass


def gain_xp(n):
    global xp, level, pending
    xp += n
    while xp >= need(level):
        xp -= need(level)
        level += 1
        # 아직 고르지 않은 레벨업 수
        pending += 1


def open_cards():
    global pending
    cards = augment.roll(moon)
    pending -= 1
    sound.play('levelup')
    # 더 고를 카드가 없으면 그냥 계속, 있으면 카드 모드를 위에 띄움
    if cards:
        card_mode.cards = cards
        game_framework.push_mode(card_mode)


def handle_events():
    for event in get_events():
        if common.handle_common(event):
            pass
        elif event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            game_framework.quit()
        else:
            moon.handle_event(event)


def spawn():
    global spawn_timer, spawn_count
    spawn_timer -= game_framework.frame_time
    if spawn_timer <= 0:
        # 시험용으로 2초마다 화면 밖 아무 방향에서 하나씩, 네 번째마다 큰 소행성
        spawn_count += 1
        kind = BigAsteroid if spawn_count % 4 == 0 else SmallAsteroid
        game_world.add_object(kind.at_edge(earth, moon, gain_xp, random.uniform(0, math.tau)), game_world.ENEMY)
        spawn_timer = 2.0


def update():
    global clock
    clock += game_framework.frame_time
    game_world.update()
    spawn()
    if pending > 0:
        open_cards()


def bar(x, y, w, h, k, color):
    draw_rectangle(x, y, x + w, y + h, 40, 44, 80, 255, True)
    if k > 0:
        draw_rectangle(x, y, x + int(w * k), y + h, *color, 255, True)
    draw_rectangle(x, y, x + w, y + h, 201, 204, 224)


def fit_icon(name, x, y, size):
    # 그림의 긴 쪽이 size가 되게 줄여서 그림
    s = get_sheet(name)
    draw_icon(name, x, y, size / max(s.w, s.h))


def draw_icon(name, x, y, scale):
    s = get_sheet(name)
    # 피벗 말고 그림 가운데가 x y에 오게 그림
    s.draw(clock % s.duration(), x - (s.w / 2 - s.px) * scale, y - (s.py - s.h / 2) * scale, 0, scale)


def draw_hud():
    # 글자 없이 그림과 막대로만
    fit_icon('earth', 30, H - 26, 30)
    bar(52, H - 33, 200, 14, earth.hp / earth.max_hp, (79, 176, 160))
    fit_icon('fragment', 30, 26, 18)
    bar(52, 21, 200, 10, xp / need(level), (232, 197, 71))


def draw_world():
    # 플레이 화면, 위에 띄우는 카드 모드도 이것부터 그림
    common.draw_background()
    game_world.render()
    draw_hud()


def render():
    common.begin()
    draw_world()
    common.end()
