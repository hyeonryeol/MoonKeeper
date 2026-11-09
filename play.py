import math
import random

from pico2d import *

import augment
import game_world
from asteroid import SmallAsteroid
from earth import Earth
from moon import Moon
from sheet import get_sheet

W, H = 800, 600
CARD_W, CARD_H = 184, 260
CARD_X = [200, 400, 600]
CARD_Y = 290

running = True


def need(level):
    # 레벨 n에서 다음 레벨까지 파편 5n개
    return 5 * level


def init():
    global background, font, big_font, earth, moon, spawn_timer, level, xp, pending, clock, mode, cards
    game_world.clear()
    background = load_image('res/background.png')
    # 갈무리 도트 글꼴, 작은 글자는 Galmuri14 15px 큰 글자는 Galmuri11 Bold
    font = load_font('res/fonts/Galmuri14.ttf', 15)
    big_font = load_font('res/fonts/Galmuri11-Bold.ttf', 24)
    earth = Earth()
    game_world.add_object(earth, game_world.EARTH)
    moon = Moon(earth)
    game_world.add_object(moon, game_world.MOON)
    spawn_timer = 1.0
    level, xp, pending = 1, 0, 0
    clock = 0.0
    mode = 'play'
    cards = []


def gain_xp(n):
    global xp, level, pending
    xp += n
    while xp >= need(level):
        xp -= need(level)
        level += 1
        # 아직 고르지 않은 레벨업 수
        pending += 1


def open_cards():
    global mode, cards, pending
    cards = augment.roll(moon)
    pending -= 1
    # 더 달 장비가 없으면 카드 없이 계속
    mode = 'augment' if cards else 'play'


def pick(i):
    global mode
    if 0 <= i < len(cards):
        augment.apply(moon, cards[i])
        mode = 'play'


def card_at(x, y):
    for i, cx in enumerate(CARD_X[:len(cards)]):
        if abs(x - cx) < CARD_W / 2 and abs(y - CARD_Y) < CARD_H / 2:
            return i
    return -1


def handle_events():
    global running
    for event in get_events():
        if event.type == SDL_QUIT:
            running = False
        elif event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            running = False
        elif mode == 'augment':
            if event.type == SDL_KEYDOWN and event.key in (SDLK_1, SDLK_2, SDLK_3):
                pick(event.key - SDLK_1)
            elif event.type == SDL_MOUSEBUTTONDOWN:
                pick(card_at(event.x, H - 1 - event.y))
            # 카드 고르는 동안 뗀 방향키도 달에 알려줌
            elif event.type == SDL_KEYUP:
                moon.handle_event(event)
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
    # 카드를 고르는 동안은 게임이 멈춤
    if mode != 'play':
        return
    clock += dt
    game_world.update(dt)
    spawn(dt)
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


def draw_cards():
    draw_rectangle(0, 0, W, H, 7, 11, 31, 170, True)
    big_font.draw(W / 2 - 70, 500, '레벨 업!', (232, 197, 71))
    font.draw(W / 2 - 120, 460, '1 2 3 키나 클릭으로 하나 고르기', (201, 204, 224))
    for i, key in enumerate(cards):
        data = augment.AUGMENTS[key]
        cx, color = CARD_X[i], augment.KIND_COLOR[data['kind']]
        l, b = cx - CARD_W // 2, CARD_Y - CARD_H // 2
        draw_rectangle(l, b, l + CARD_W, b + CARD_H, 30, 38, 84, 255, True)
        draw_rectangle(l, b, l + CARD_W, b + CARD_H, *color)
        draw_rectangle(l, b + CARD_H - 6, l + CARD_W, b + CARD_H, *color, 255, True)
        font.draw(l + 12, b + CARD_H - 24, '%d  %s' % (i + 1, data['kind']), color)
        draw_icon(data['sheet'], cx, CARD_Y + 45, 4)
        font.draw(l + 14, CARD_Y - 20, data['name'], (243, 239, 228))
        font.draw(l + 14, CARD_Y - 42, '새 장비  무게 +1', color)
        for j, line in enumerate(data['desc']):
            font.draw(l + 14, CARD_Y - 72 - j * 20, line, (201, 204, 224))


def draw():
    clear_canvas()
    background.draw(W / 2, H / 2, W, H)
    game_world.render()
    draw_hud()
    if mode == 'augment':
        draw_cards()
    update_canvas()
