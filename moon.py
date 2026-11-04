import math

from pico2d import SDL_KEYDOWN, SDL_KEYUP, SDLK_LEFT, SDLK_RIGHT, clamp

from gear import Turret
from sheet import get_sheet

MIN_SPEED, MAX_SPEED = 80, 400
FORCE = 200
ORBIT_EASE = 5


class Moon:
    def __init__(self, earth):
        self.sheet = get_sheet('moon')
        self.earth = earth
        self.speed = 160
        self.theta = math.pi / 2
        self.radius = 15
        self.right = self.left = False
        self.gears = []
        self.t = 0.0
        # 실제 궤도 반지름, 속도가 갑자기 바뀌어도 이 값은 천천히 따라감
        self.orbit = self.orbit_radius()
        self.place()
        # 기본 포탑은 처음부터 달려 있음
        self.gears.append(Turret(self, 'turret', 'gear-turret', 0))

    def orbit_radius(self):
        return 100 + (self.speed - 80) * 0.4

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

    def update(self, dt):
        self.t += dt
        # 오른쪽 가속 왼쪽 감속 손을 떼면 그 속도 유지
        push = (1 if self.right else 0) - (1 if self.left else 0)
        self.speed = clamp(MIN_SPEED, self.speed + push * FORCE * dt, MAX_SPEED)
        # 목표 궤도 쪽으로 부드럽게 미끄러지듯 옮겨 감
        self.orbit += (self.orbit_radius() - self.orbit) * min(1.0, ORBIT_EASE * dt)
        # 각속도는 속도 나누기 반지름
        self.theta += self.speed / self.orbit * dt
        self.place()
        for g in self.gears:
            g.update(dt)

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)
        for g in self.gears:
            g.draw()
