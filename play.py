from pico2d import *

import game_world
from earth import Earth
from moon import Moon

W, H = 800, 600

running = True


def init():
    global background, earth, moon
    game_world.clear()
    background = load_image('res/background.png')
    earth = Earth()
    game_world.add_object(earth, game_world.EARTH)
    moon = Moon(earth)
    game_world.add_object(moon, game_world.MOON)


def handle_events():
    global running
    for event in get_events():
        if event.type == SDL_QUIT:
            running = False
        elif event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            running = False


def update(dt):
    game_world.update(dt)


def draw():
    clear_canvas()
    background.draw(W / 2, H / 2, W, H)
    game_world.render()
    update_canvas()
