BACK, EARTH, PICKUP, ENEMY, MOON, SHOT, EFFECT = range(7)

world = [[] for _ in range(7)]


def add_object(o, depth):
    world[depth].append(o)


def remove_object(o):
    for layer in world:
        if o in layer:
            layer.remove(o)
            return


def objects_at(depth):
    return world[depth]


def update(dt):
    for layer in world:
        for o in layer[:]:
            o.update(dt)


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
