import pico2d.pico2d as canvas
from pico2d import *

import game_framework
import play_mode
from common import W, H

# 도트가 번지지 않게 확대할 때 가까운 픽셀 사용
SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, b'0')
open_canvas(W, H)
# 반투명 사각형을 쓰려고 블렌딩 켬
SDL_SetRenderDrawBlendMode(canvas.renderer, SDL_BLENDMODE_BLEND)
# 창 크기가 바뀌어도 800 600 화면 비율 그대로 늘려서 그림
SDL_RenderSetLogicalSize(canvas.renderer, W, H)

game_framework.run(play_mode)
close_canvas()
