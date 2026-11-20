from pico2d import *

import augment
import card_mode
import common
import game_framework
import game_world
import sound
from common import W, H
from earth import Earth
from moon import Moon
from sheet import get_sheet
from wave import Waves, LAST

def need(level):
    # 레벨 n에서 다음 레벨까지 파편 5n개
    return 5 * level


def init():
    global earth, moon, level, xp, pending, waves, clock
    common.load()
    game_world.clear()
    earth = Earth()
    game_world.add_object(earth, game_world.EARTH)
    moon = Moon(earth)
    game_world.add_object(moon, game_world.MOON)
    level, xp, pending = 1, 0, 0
    waves = Waves(earth, moon, gain_xp)
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


def update():
    global clock
    clock += game_framework.frame_time
    game_world.update()
    waves.update()
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
    draw_wave()


def draw_wave():
    # 웨이브 칸, 지나간 칸은 채우고 지금 칸은 깜빡임
    x0, y = 540, H - 26
    for n in range(1, LAST):
        l = x0 + (n - 1) * 20
        if n < waves.number:
            color = (232, 197, 71)
        elif n == waves.number:
            color = (243, 239, 228) if int(clock * 3) % 2 == 0 else (232, 197, 71)
        else:
            color = (40, 44, 80)
        draw_rectangle(l, y - 6, l + 14, y + 6, *color, 255, True)


def draw_world():
    # 플레이 화면, 위에 띄우는 카드 모드도 이것부터 그림
    common.draw_background()
    game_world.render()
    draw_hud()


def render():
    common.begin()
    draw_world()
    common.end()
