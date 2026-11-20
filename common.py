from pico2d import *
import pico2d.pico2d as canvas
from sdl2 import (SDL_BLENDMODE_BLEND, SDL_CreateTexture, SDL_PIXELFORMAT_RGBA8888, SDL_Rect, SDL_RenderClear,
                  SDL_RenderCopy, SDL_SetRenderDrawColor, SDL_SetRenderTarget, SDL_SetTextureBlendMode,
                  SDL_TEXTUREACCESS_TARGET)

import game_framework
import sound

# 모든 모드가 같이 쓰는 화면 크기, 글꼴, 배경, 그림판, 공통 키
W, H = 800, 600

font = None
big_font = None
background = None
screen = None
fullscreen = False


def load():
    # 처음 한 번만 읽음
    global font, big_font, background
    if font is not None:
        return
    sound.init()
    background = load_image('res/background.png')
    # 갈무리 도트 글꼴, 작은 글자는 Galmuri14 15px 큰 글자는 Galmuri11 Bold 두 배
    font = load_font('res/fonts/Galmuri14.ttf', 15)
    big_font = load_font('res/fonts/Galmuri11-Bold.ttf', 24)


def game_screen():
    # 게임 화면을 그릴 800 600 그림판, 처음 한 번만 만듦
    global screen
    if screen is None:
        screen = SDL_CreateTexture(canvas.renderer, SDL_PIXELFORMAT_RGBA8888, SDL_TEXTUREACCESS_TARGET, W, H)
        SDL_SetTextureBlendMode(screen, SDL_BLENDMODE_BLEND)
    return screen


def begin():
    # 게임은 따로 된 그림판에 그린 뒤 창 가운데에 붙임
    # 그리기 영역을 직접 옮기면 전체화면 가운데 맞춤이 풀려서 이렇게 함
    SDL_SetRenderTarget(canvas.renderer, game_screen())
    SDL_SetRenderDrawColor(canvas.renderer, 0, 0, 0, 255)
    SDL_RenderClear(canvas.renderer)


def end():
    SDL_SetRenderTarget(canvas.renderer, None)
    # 전체화면에서 남는 띠가 회색이 아니라 검게 보이게 직접 지움
    SDL_SetRenderDrawColor(canvas.renderer, 0, 0, 0, 255)
    SDL_RenderClear(canvas.renderer)
    SDL_RenderCopy(canvas.renderer, game_screen(), None, SDL_Rect(0, 0, W, H))
    update_canvas()


def draw_background():
    background.draw(W / 2, H / 2, W, H)



def toggle_fullscreen():
    global fullscreen
    fullscreen = not fullscreen
    SDL_SetWindowFullscreen(canvas.window, SDL_WINDOW_FULLSCREEN_DESKTOP if fullscreen else 0)


def handle_common(event):
    # 어느 모드에서나 같은 키, 처리했으면 True
    if event.type == SDL_QUIT:
        game_framework.quit()
    elif event.type == SDL_KEYDOWN and event.key == SDLK_F11:
        toggle_fullscreen()
    else:
        return False
    return True
