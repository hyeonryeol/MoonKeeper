from sheet import get_sheet


class Earth:
    def __init__(self):
        self.sheet = get_sheet('earth')
        self.x, self.y = 400, 300
        self.radius = 40
        self.max_hp = 100
        self.hp = self.max_hp
        self.t = 0.0

    def hit(self, damage):
        self.hp = max(0, self.hp - damage)

    def update(self, dt):
        self.t += dt

    def draw(self):
        self.sheet.draw(self.t, self.x, self.y)
