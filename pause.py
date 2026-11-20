from pico2d import draw_rectangle

import sound

W, H = 800, 600
ITEMS = ['계속하기', '효과음', '배경음', '타이틀로', '게임 끄기']
WHITE = (243, 239, 228)
DIM = (150, 156, 190)
GOLD = (232, 197, 71)

selected = 0


def reset():
    global selected
    selected = 0


def move(d):
    global selected
    selected = (selected + d) % len(ITEMS)
    sound.play('select')


def adjust(d):
    # 왼쪽 오른쪽 키로 고른 줄의 크기를 한 칸씩
    if ITEMS[selected] == '효과음':
        sound.set_sfx(sound.sfx_level + d)
        sound.play('pickup')
    elif ITEMS[selected] == '배경음':
        sound.set_music(sound.music_level + d)


def choice():
    return ITEMS[selected]


def draw_level(x, y, level, on):
    for i in range(10):
        l = x + i * 18
        color = GOLD if i < level else (60, 64, 100)
        if not on and i < level:
            color = DIM
        draw_rectangle(l, y, l + 12, y + 14, *color, 255, True)


def draw(font, big_font):
    draw_rectangle(0, 0, W, H, 7, 11, 31, 225, True)
    big_font.draw(W / 2 - 52, 485, '일시정지', GOLD)
    for i, item in enumerate(ITEMS):
        y = 370 - i * 46
        on = i == selected
        if on:
            draw_rectangle(200, y - 18, 600, y + 18, 30, 38, 84, 255, True)
            draw_rectangle(200, y - 18, 204, y + 18, *GOLD, 255, True)
        font.draw(230, y, item, WHITE if on else DIM)
        if item == '효과음':
            draw_level(360, y - 7, sound.sfx_level, on)
            font.draw(550, y, '%d' % sound.sfx_level, WHITE if on else DIM)
        elif item == '배경음':
            draw_level(360, y - 7, sound.music_level, on)
            font.draw(550, y, '%d' % sound.music_level, WHITE if on else DIM)
    font.draw(W / 2 - 205, 90, '위 아래 고르기   왼쪽 오른쪽 크기   Enter 결정   ESC 계속', DIM)
    if sound.muted:
        font.draw(W / 2 - 80, 60, 'M 키로 소리가 꺼져 있음', (242, 133, 74))
