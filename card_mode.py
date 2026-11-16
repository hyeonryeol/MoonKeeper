from pico2d import *

import augment
import game_framework
import play_mode
from gear import level_sheet

# 레벨업 때 플레이 위에 띄우는 증강 카드 고르기, 고르는 동안 게임은 멈춤
W, H = 800, 600
CARD_W, CARD_H = 184, 260
CARD_X = [200, 400, 600]
CARD_Y = 290

cards = []
font = None
big_font = None


def init():
    global font, big_font
    # 갈무리 도트 글꼴, 작은 글자는 Galmuri14 15px 큰 글자는 Galmuri11 Bold
    if font is None:
        font = load_font('res/fonts/Galmuri14.ttf', 15)
        big_font = load_font('res/fonts/Galmuri11-Bold.ttf', 24)


def finish():
    pass


def pause():
    pass


def resume():
    pass


def card_at(x, y):
    for i, cx in enumerate(CARD_X[:len(cards)]):
        if abs(x - cx) < CARD_W / 2 and abs(y - CARD_Y) < CARD_H / 2:
            return i
    return -1


def pick(i):
    # 골랐으면 카드 모드를 닫고 True
    if not 0 <= i < len(cards):
        return False
    augment.apply(play_mode.moon, cards[i])
    game_framework.pop_mode()
    return True


def handle_events():
    for event in get_events():
        if event.type == SDL_QUIT:
            game_framework.quit()
        elif event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            game_framework.quit()
        # 모드가 바뀌면 남은 입력은 여기서 처리하지 않음
        elif event.type == SDL_KEYDOWN and event.key in (SDLK_1, SDLK_2, SDLK_3):
            if pick(event.key - SDLK_1):
                return
        elif event.type == SDL_MOUSEBUTTONDOWN:
            if pick(card_at(event.x, H - 1 - event.y)):
                return
        # 카드 고르는 동안 뗀 방향키도 달에 알려줌
        elif event.type == SDL_KEYUP:
            play_mode.moon.handle_event(event)


def update():
    pass


def draw_cards():
    moon = play_mode.moon
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
        lv = augment.level_of(moon, key)
        # 강화 카드에는 다음 레벨 모습을 보여줌, 방패 고리는 그림이 커서 1배
        play_mode.draw_icon(level_sheet(data['sheet'], lv + 1), cx, CARD_Y + 45, 1 if key == 'shield' else 4)
        font.draw(l + 14, CARD_Y - 20, data['name'], (243, 239, 228))
        font.draw(l + 14, CARD_Y - 42, '강화 Lv %d' % (lv + 1) if lv > 0 else '새 장비  무게 +1', color)
        for j, line in enumerate(augment.describe(moon, key)):
            font.draw(l + 14, CARD_Y - 72 - j * 20, line, (201, 204, 224))


def render():
    clear_canvas()
    play_mode.draw_world()
    draw_cards()
    update_canvas()
