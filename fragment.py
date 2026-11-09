import math
import random

import game_world
from sheet import get_sheet

GRAVITY = 10
MAX_FALL = 35


class Fragment:
    def __init__(self, x, y, moon, on_collect):
        self.sheet = get_sheet('fragment')
        self.x, self.y = x, y
        self.vx, self.vy = random.uniform(-40, 40), random.uniform(-40, 40)
        self.fall = 0.0
        self.rest = None
        self.radius = 5
        self.moon = moon
        self.on_collect = on_collect
        self.t = random.uniform(0, 1)

    def update(self, dt):
        self.t += dt
        self.x += self.vx * dt
        self.y += self.vy * dt
        # 튕겨 나온 뒤 천천히 멈춤
        self.vx *= 0.96
        self.vy *= 0.96
        self.pull(dt)
        if game_world.distance(self, self.moon) < self.radius + self.moon.pickup_radius:
            game_world.remove_object(self)
            self.on_collect(1)

    def pull(self, dt):
        earth = self.moon.earth
        dx, dy = self.x - earth.x, self.y - earth.y
        d = math.hypot(dx, dy)
        if d == 0:
            return
        low, high = self.moon.min_orbit_radius(), self.moon.max_orbit_radius()
        # 최대 궤도 밖이면 궤도 사이 아무 곳에 멈출 자리를 정함
        if self.rest is None and d > high:
            self.rest = random.uniform(low, high)
        if self.rest is not None:
            goal = self.rest
        elif d < low:
            goal = low
        else:
            # 처음부터 달이 닿는 범위에 있으면 그 자리에 둠
            return
        # 지구 중력처럼 점점 빨라지며 멈출 자리로 감
        self.fall = min(MAX_FALL, self.fall + GRAVITY * dt)
        gap = d - goal
        step = min(abs(gap), self.fall * dt)
        if gap < 0:
            step = -step
        self.x -= dx / d * step
        self.y -= dy / d * step

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)
