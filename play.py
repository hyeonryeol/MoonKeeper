import math
import random

from pico2d import *

import game_world
from asteroid import SmallAsteroid
from earth import Earth
from moon import Moon

W, H = 800, 600

running = True


def init():
    global background, earth, moon, spawn_timer, xp
    game_world.clear()
    background = load_image('res/background.png')
    earth = Earth()
    game_world.add_object(earth, game_world.EARTH)
    moon = Moon(earth)
    game_world.add_object(moon, game_world.MOON)
    spawn_timer = 1.0
    xp = 0


def gain_xp(n):
    global xp
    xp += n


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
    game_world.update(dt)
    spawn(dt)


def draw():
    clear_canvas()
    background.draw(W / 2, H / 2, W, H)
    game_world.render()
    update_canvas()
