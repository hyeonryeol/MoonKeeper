import game_world
from sheet import get_sheet


class Effect:
    # 한 번 재생하고 사라지는 그림
    def __init__(self, name, x, y, rad=0.0, stretch=1):
        self.sheet = get_sheet(name)
        self.x, self.y, self.rad, self.stretch = x, y, rad, stretch
        self.t = 0.0

    def update(self, dt):
        self.t += dt
        if self.t >= self.sheet.duration():
            game_world.remove_object(self)

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y, self.rad, 1, self.stretch)


def play(name, x, y, rad=0.0, stretch=1):
    game_world.add_object(Effect(name, x, y, rad, stretch), game_world.EFFECT)
