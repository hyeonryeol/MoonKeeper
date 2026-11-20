# 티저에 넣을 실제 게임 화면 녹화
# 게임을 자동 조종으로 돌리면서 정한 구간의 프레임을 jpg로 저장
# 저장소 폴더에서 python tools/teaser/record_gameplay.py 저장할폴더 로 실행
import ctypes
import os
import sys

sys.path.insert(0, os.getcwd())
import sdl2
import pico2d.pico2d as canvas
from pico2d import *
from PIL import Image

import augment
import card_mode
import game_framework
import game_world
import intro_mode
import play_mode
import skill_guide_mode
import title_mode

OUT = sys.argv[1]
FPS = 30
os.makedirs(OUT, exist_ok=True)


def key(sym, down=True):
    e = sdl2.SDL_Event()
    e.type = sdl2.SDL_KEYDOWN if down else sdl2.SDL_KEYUP
    e.key.keysym.sym = sym
    sdl2.SDL_PushEvent(ctypes.byref(e))


def tap(sym):
    return [lambda: key(sym, True), lambda: key(sym, False)]


def give(keys):
    # 정한 증강을 차례로 붙임, 카드 화면을 거치지 않고 바로
    def f():
        for k in keys:
            augment.apply(play_mode.moon, k)
    return f


def dense(gap):
    def f():
        play_mode.waves.gap = gap
        play_mode.waves.timer = 0.0
    return f


# 보여 주려고 일부러 띄운 카드와 스킬 안내는 자동으로 넘기지 않음
hold = False


def skill_card(k):
    def f():
        global hold
        hold = True
        # 게임의 뽑기로 뽑고 첫 장만 보여 줄 스킬로 바꿈
        rest = [c for c in augment.roll(play_mode.moon, play_mode.level) if c != k and not augment.is_skill(c)]
        card_mode.cards = [k] + rest[:2]
        game_framework.push_mode(card_mode)
    return f


def release():
    global hold
    hold = False


def auto_pick():
    # 녹화가 카드 화면에서 멈추지 않게 스킬이 아닌 카드를 바로 고름
    if hold or not game_framework.stack:
        return
    top = game_framework.stack[-1]
    if top is card_mode:
        plain = [i for i, k in enumerate(card_mode.cards) if not augment.is_skill(k)]
        card_mode.pick(plain[0] if plain else 0)
    elif top is skill_guide_mode:
        game_framework.pop_mode()


clip_name, clip_left, clip_index = None, 0, 0


def record(name, seconds):
    def f():
        global clip_name, clip_left, clip_index
        clip_name, clip_left, clip_index = name, int(seconds * FPS), 0
    return f


def save_frame():
    global clip_left, clip_index
    s = sdl2.SDL_CreateRGBSurface(0, 800, 600, 32, 0x00ff0000, 0x0000ff00, 0x000000ff, 0xff000000)
    sdl2.SDL_RenderReadPixels(canvas.renderer, None, sdl2.SDL_PIXELFORMAT_ARGB8888, s.contents.pixels, s.contents.pitch)
    raw = ctypes.string_at(s.contents.pixels, 800 * 600 * 4)
    sdl2.SDL_FreeSurface(s)
    Image.frombuffer('RGBA', (800, 600), raw, 'raw', 'BGRA', 0, 1).convert('RGB').save(
        os.path.join(OUT, '%s_%03d.jpg' % (clip_name, clip_index)), quality=92)
    clip_index += 1
    clip_left -= 1


def keep_alive():
    # 녹화 중에 게임 오버가 나지 않게
    if game_framework.stack and game_framework.stack[0] is play_mode and hasattr(play_mode, 'earth'):
        play_mode.earth.hp = max(play_mode.earth.hp, 60)


RIGHT, LEFT = SDLK_RIGHT, SDLK_LEFT
# 기다릴 프레임 수와 할 일
SCRIPT = [
    (5, tap(SDLK_RETURN)), (5, tap(SDLK_ESCAPE)),
    # 1 초반, 달이 궤도를 넓히며 소행성을 쏨
    (100, dense(0.3)), (5, lambda: key(RIGHT, True)),
    (240, record('a', 3.0)),
    (95, lambda: key(RIGHT, False)),
    # 2 장비를 잔뜩 달고 5웨이브
    (5, give(['laser', 'missile', 'drone', 'coil', 'shield', 'laser', 'missile', 'drone', 'coil', 'anchor'])),
    (2, tap(SDLK_n)), (2, tap(SDLK_n)), (2, tap(SDLK_n)), (2, tap(SDLK_n)),
    (100, dense(0.15)), (5, lambda: key(LEFT, True)), (60, lambda: key(LEFT, False)),
    (60, lambda: key(RIGHT, True)), (120, lambda: key(RIGHT, False)),
    (30, lambda: key(RIGHT, True)),
    (10, record('b', 4.0)),
    (125, lambda: key(RIGHT, False)),
    # 3 첫 스킬 카드, 컷인, 관통 레이저
    (5, skill_card('pierce')), (20, record('c', 1.2)), (40, tap(SDLK_1)), (10, tap(SDLK_q)),
    (2, record('d', 4.2)), (2, release),
    (140, tap(SDLK_n)), (2, tap(SDLK_n)), (2, tap(SDLK_n)), (2, tap(SDLK_n)),
    # 4 보스
    (2, tap(SDLK_n)),
    (95, record('e', 3.4)),
    (110, lambda: key(RIGHT, True)),
    (150, record('f', 3.0)),
    (100, lambda: key(RIGHT, False)),
]

queue = []
t = 0
for wait, acts in SCRIPT:
    t += wait
    for a in (acts if isinstance(acts, list) else [acts]):
        queue.append((t, a))
        t += 1
end_frame = t + 10


class FakeTime:
    now = 1000.0
    frame = 0

    def time(self):
        return FakeTime.now

    def sleep(self, s):
        FakeTime.now += 1 / FPS
        FakeTime.frame += 1
        if clip_left > 0:
            save_frame()
        keep_alive()
        auto_pick()
        while queue and queue[0][0] <= FakeTime.frame:
            queue.pop(0)[1]()
        if FakeTime.frame > end_frame:
            game_framework.quit()


game_framework.time = FakeTime()
intro_mode.seen = True

SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, b'0')
open_canvas(800, 600)
SDL_SetRenderDrawBlendMode(canvas.renderer, SDL_BLENDMODE_BLEND)
SDL_RenderSetLogicalSize(canvas.renderer, 800, 600)
game_framework.run(title_mode)
close_canvas()
print('frames', FakeTime.frame, 'saved', len(os.listdir(OUT)))
