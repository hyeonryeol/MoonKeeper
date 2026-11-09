import math
import random

from pico2d import *

import game_world
from asteroid import SmallAsteroid
from earth import Earth
from moon import Moon
from sheet import get_sheet

W, H = 800, 600

running = True


def need(level):
    # 레벨 n에서 다음 레벨까지 파편 5n개
    return 5 * level


def init():
    global background, earth, moon, spawn_timer, level, xp, pending, clock
    game_world.clear()
    background = load_image('res/background.png')
    earth = Earth()
    game_world.add_object(earth, game_world.EARTH)
    moon = Moon(earth)
    game_world.add_object(moon, game_world.MOON)
    spawn_timer = 1.0
    level, xp, pending = 1, 0, 0
    clock = 0.0


def gain_xp(n):
    global xp, level, pending
    xp += n
    while xp >= need(level):
        xp -= need(level)
        level += 1
        # 아직 고르지 않은 레벨업 수
        pending += 1


def handle_events():
    global running
    for event in get_events():
        if event.type == SDL_QUIT:
            running = False
        elif event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            running = False
        else:
            moon.handle_event(event)


def spawn(dt):
    global spawn_timer
    spawn_timer -= dt
    if spawn_timer <= 0:
        # 포탑 시험용으로 2초마다 화면 밖 아무 방향에서 하나씩
        game_world.add_object(SmallAsteroid.at_edge(earth, moon, gain_xp, random.uniform(0, math.tau)), game_world.ENEMY)
        spawn_timer = 2.0


def update(dt):
    global clock
    clock += dt
    game_world.update(dt)
    spawn(dt)


def bar(x, y, w, h, k, color):
    draw_rectangle(x, y, x + w, y + h, 40, 44, 80, 255, True)
    if k > 0:
        draw_rectangle(x, y, x + int(w * k), y + h, *color, 255, True)
    draw_rectangle(x, y, x + w, y + h, 201, 204, 224)


def fit_icon(name, x, y, size):
    # 그림의 긴 쪽이 size가 되게 줄여서 가운데에 그림
    s = get_sheet(name)
    scale = size / max(s.w, s.h)
    s.draw(clock % s.duration(), x - (s.w / 2 - s.px) * scale, y - (s.py - s.h / 2) * scale, 0, scale)


def draw_hud():
    # 글자 없이 그림과 막대로만
    fit_icon('earth', 30, H - 26, 30)
    bar(52, H - 33, 200, 14, earth.hp / earth.max_hp, (79, 176, 160))
    fit_icon('fragment', 30, 26, 18)
    bar(52, 21, 200, 10, xp / need(level), (232, 197, 71))


def draw():
    clear_canvas()
    background.draw(W / 2, H / 2, W, H)
    game_world.render()
    draw_hud()
    update_canvas()
