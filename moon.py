import math

from pico2d import SDL_KEYDOWN, SDL_KEYUP, SDLK_LEFT, SDLK_RIGHT, clamp

import game_framework
import game_world
from gear import Turret
from sheet import get_sheet

MIN_SPEED, MAX_SPEED = 80, 400
BASE_FORCE = 200
ORBIT_EASE = 5


class Moon:
    def __init__(self, earth):
        self.sheet = get_sheet('moon')
        self.earth = earth
        self.speed = 160
        self.theta = math.pi / 2
        self.radius = 15
        self.pickup_radius = 18
        self.right = self.left = False
        self.gears = []
        self.t = 0.0
        # 실제 궤도 반지름, 속도가 갑자기 바뀌어도 이 값은 천천히 따라감
        self.orbit = self.orbit_radius()
        self.place()
        # 기본 포탑은 처음부터 달려 있음
        self.gears.append(Turret(self, 'turret', 'gear-turret', 0))

    def orbit_radius(self, speed=None):
        if speed is None:
            speed = self.speed
        return 100 + (speed - 80) * 0.4

    def min_orbit_radius(self):
        return self.orbit_radius(MIN_SPEED)

    def max_orbit_radius(self):
        return self.orbit_radius(MAX_SPEED)

    def weight(self):
        # 처음부터 달린 기본 포탑은 무게에 넣지 않음
        return len(self.gears) - 1

    def force(self):
        # 장비가 늘수록 가속도 감속도 둔해짐, 추진기가 있으면 무게 영향이 레벨마다 1/2 1/3 1/4
        k = 0.15 * self.weight()
        thruster = self.gear('thruster')
        if thruster:
            k /= 1 + thruster.level
        return BASE_FORCE / (1 + k)

    def gear(self, key):
        for g in self.gears:
            if g.key == key:
                return g
        return None

    def slow_at(self, x, y):
        # 중력 닻 범위 안의 소행성은 절반 속도
        anchor = self.gear('anchor')
        if anchor and math.hypot(x - self.x, y - self.y) < anchor.reach():
            return 0.5
        return 1.0

    def handle_event(self, event):
        if event.type in (SDL_KEYDOWN, SDL_KEYUP):
            down = event.type == SDL_KEYDOWN
            if event.key == SDLK_RIGHT:
                self.right = down
            elif event.key == SDLK_LEFT:
                self.left = down

    def place(self):
        self.x = self.earth.x + math.cos(self.theta) * self.orbit
        self.y = self.earth.y + math.sin(self.theta) * self.orbit

    def ram(self, a):
        a.ram_cool = 0.5
        # 작은 소행성은 들이받으면 바로 부서짐
        if not a.heavy:
            a.destroy()
            return
        # 방패가 충전돼 있으면 큰 소행성을 튕겨내고 달은 그대로
        shield = self.gear('shield')
        if shield and shield.use():
            a.knock_back()
            return
        # 큰 소행성은 피해 1만 주고 달 속도가 절반으로 떨어짐
        # 가시 갑옷이 있으면 피해가 레벨마다 2 3 4에 감속 없음
        spikes = self.gear('spikes')
        a.hit(1 + (spikes.level if spikes else 0))
        if not spikes:
            self.speed = max(MIN_SPEED, self.speed / 2)

    def update(self):
        dt = game_framework.frame_time
        self.t += dt
        # 오른쪽 가속 왼쪽 감속 손을 떼면 그 속도 유지
        push = (1 if self.right else 0) - (1 if self.left else 0)
        self.speed = clamp(MIN_SPEED, self.speed + push * self.force() * dt, MAX_SPEED)
        # 목표 궤도 쪽으로 부드럽게 미끄러지듯 옮겨 감
        self.orbit += (self.orbit_radius() - self.orbit) * min(1.0, ORBIT_EASE * dt)
        # 각속도는 속도 나누기 반지름
        self.theta += self.speed / self.orbit * dt
        self.place()
        for a in game_world.objects_at(game_world.ENEMY)[:]:
            if a.ram_cool <= 0 and game_world.collide(self, a):
                self.ram(a)
        for g in self.gears:
            g.update()

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)
        for g in self.gears:
            g.draw()
