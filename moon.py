import math

from sheet import get_sheet


class Moon:
    def __init__(self, earth):
        self.sheet = get_sheet('moon')
        self.earth = earth
        self.speed = 160
        self.theta = math.pi / 2
        self.radius = 15
        self.t = 0.0
        self.orbit = self.orbit_radius()
        self.place()

    def orbit_radius(self):
        return 100 + (self.speed - 80) * 0.4

    def place(self):
        self.x = self.earth.x + math.cos(self.theta) * self.orbit
        self.y = self.earth.y + math.sin(self.theta) * self.orbit

    def update(self, dt):
        self.t += dt
        # 각속도는 속도 나누기 반지름
        self.theta += self.speed / self.orbit * dt
        self.place()

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)
