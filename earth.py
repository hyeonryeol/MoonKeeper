import math

from pico2d import clamp

import game_framework
import sound
from sheet import get_sheet

HOME_X, HOME_Y = 400, 300
BOOST_SPEED = 120
RETURN_SPEED = 40
MARGIN = 60


class Earth:
    def __init__(self):
        self.sheet = get_sheet('earth')
        self.flame = get_sheet('earth-thruster')
        self.x, self.y = HOME_X, HOME_Y
        self.radius = 40
        self.max_hp = 100
        self.hp = self.max_hp
        self.t = 0.0
        self.boost_time = 0.0
        self.boost_rad = 0.0
        self.boost_speed = BOOST_SPEED

    def hit(self, damage):
        self.hp = max(0, self.hp - damage)
        sound.play('earth_hit')

    def heal(self, amount):
        self.hp = min(self.max_hp, self.hp + amount)

    def boost(self, rad, time, speed=BOOST_SPEED):
        self.boost_rad = rad
        self.boost_time = time
        self.boost_speed = speed

    def boost_to(self, x, y, speed):
        # 정한 자리까지 날아가는 시간만큼 추진
        d = math.hypot(x - self.x, y - self.y)
        self.boost(math.atan2(y - self.y, x - self.x), d / speed, speed)

    def update(self):
        dt = game_framework.frame_time
        self.t += dt
        if self.boost_time > 0:
            self.boost_time -= dt
            self.x += math.cos(self.boost_rad) * self.boost_speed * dt
            self.y += math.sin(self.boost_rad) * self.boost_speed * dt
            self.x = clamp(MARGIN, self.x, 800 - MARGIN)
            self.y = clamp(MARGIN, self.y, 600 - MARGIN)
            return
        # 추진이 끝나면 천천히 제자리로 돌아감
        dx, dy = HOME_X - self.x, HOME_Y - self.y
        d = math.hypot(dx, dy)
        step = RETURN_SPEED * dt
        if d <= step:
            self.x, self.y = HOME_X, HOME_Y
        else:
            self.x += dx / d * step
            self.y += dy / d * step

    def draw(self):
        if self.boost_time > 0:
            # 불꽃은 움직이는 반대쪽으로 뿜음
            back = self.boost_rad + math.pi
            self.flame.draw(self.t, self.x + math.cos(back) * (self.radius - 4),
                            self.y + math.sin(back) * (self.radius - 4), back)
        self.sheet.draw(self.t, self.x, self.y)
