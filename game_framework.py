import time

running = False
stack = []
# 한 프레임 걸린 시간, 오브젝트는 이 값으로 움직임
frame_time = 0.0
# 그림을 읽느라 한 번 크게 멈춰도 한 프레임에 이만큼만 진행
MAX_FRAME_TIME = 0.05


def change_mode(mode):
    if stack:
        stack.pop().finish()
    stack.append(mode)
    mode.init()


def push_mode(mode):
    if stack:
        stack[-1].pause()
    stack.append(mode)
    mode.init()


def pop_mode():
    if stack:
        stack.pop().finish()
    if stack:
        stack[-1].resume()
    else:
        quit()


def quit():
    global running
    running = False


def run(start_mode):
    global running, stack, frame_time
    running = True
    stack = [start_mode]
    try:
        start_mode.init()
        frame_time = 0.0
        current_time = time.time()
        while running:
            stack[-1].handle_events()
            stack[-1].update()
            stack[-1].render()
            time.sleep(0.01)
            now = time.time()
            frame_time = min(now - current_time, MAX_FRAME_TIME)
            current_time = now
    finally:
        while stack:
            stack.pop().finish()
        running = False
