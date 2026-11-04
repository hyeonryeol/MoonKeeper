import json
import math

from pico2d import load_image


class Sheet:
    def __init__(self, name):
        self.image = load_image('res/' + name + '.png')
        with open('res/' + name + '.json', encoding='utf-8') as f:
            meta = json.load(f)['meta']
        info = meta['pixelfx']
        self.w, self.h = info['frameSize']
        self.px, self.py = info['pivot']
        self.frames = info['frames']
        self.cols = info['columns']
        self.fps = info['fps']
        self.loop = info['loop']
        self.sheet_h = meta['size']['h']

    def duration(self):
        return self.frames / self.fps

    def frame_at(self, t):
        f = int(t * self.fps)
        if self.loop:
            return f % self.frames
        return min(f, self.frames - 1)

    def draw(self, t, x, y, rad=0.0, scale=1, stretch=1):
        f = self.frame_at(t)
        left = (f % self.cols) * self.w
        bottom = self.sheet_h - (f // self.cols + 1) * self.h
        sx = scale * stretch
        # 피벗이 x y에 오도록 그림 중심을 옮긴 뒤 같이 회전
        ox = (self.w / 2 - self.px) * sx
        oy = (self.py - self.h / 2) * scale
        cx = x + ox * math.cos(rad) - oy * math.sin(rad)
        cy = y + ox * math.sin(rad) + oy * math.cos(rad)
        self.image.clip_composite_draw(left, bottom, self.w, self.h, rad, '', cx, cy,
                                       self.w * sx, self.h * scale)


_sheets = {}


def get_sheet(name):
    if name not in _sheets:
        _sheets[name] = Sheet(name)
    return _sheets[name]
