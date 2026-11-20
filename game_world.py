# BEAM은 달 아래에 깔리는 빔, 달보다 먼저 그림
BACK, EARTH, PICKUP, ENEMY, BEAM, MOON, SHOT, EFFECT = range(8)

world = [[] for _ in range(8)]


def add_object(o, depth):
    world[depth].append(o)


def remove_object(o):
    for layer in world:
        if o in layer:
            layer.remove(o)
            return


def add_objects(ol, depth):
    world[depth] += ol


def objects_at(depth):
    return world[depth]


def update():
    for layer in world:
        for o in layer[:]:
            o.update()


def render():
    for layer in world:
        for o in layer:
            o.draw()


def clear():
    for layer in world:
        layer.clear()


def distance(a, b):
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5


def collide(a, b):
    return distance(a, b) < a.radius + b.radius
