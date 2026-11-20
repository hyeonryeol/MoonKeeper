import sys

from pico2d import *

import asteroid
import augment
import card_mode
import common
import cutin_mode
import game_framework
import game_world
import panels
import pause_mode
import result_mode
import sound
from common import W, H
from earth import Earth
from moon import Moon, MIN_SPEED, MAX_SPEED
from sheet import get_sheet
from wave import Waves, LAST, REST

# 작은 궤도 다이얼 속도계 자리, 경험치 막대 오른쪽
SPEEDO_X, SPEEDO_Y = 290, 36
# 스킬 팝업 왼쪽 위 자리, 웨이브 칸 바로 아래
POPUP_X, POPUP_Y = 538, 562
# 스킬은 얻은 순서대로 Q W E
SKILL_KEYS = {SDLK_q: 0, SDLK_w: 1, SDLK_e: 2}

# Tab을 누르고 있는 동안 장비 패널을 띄움
show_gears = False


def start():
    # 다른 모드에서 플레이로 들어올 때, 선택 소리는 앞 모드가 끝난 뒤에 남
    game_framework.change_mode(sys.modules[__name__])
    sound.play('select')


def need(level):
    # 레벨 n에서 다음 레벨까지 파편 5n개
    return 5 * level


def init():
    global earth, moon, level, xp, pending, waves, clock, popup, boss_cut, fragments, show_gears
    common.load()
    game_world.clear()
    earth = Earth()
    game_world.add_object(earth, game_world.EARTH)
    moon = Moon(earth)
    game_world.add_object(moon, game_world.MOON)
    level, xp, pending = 1, 0, 0
    fragments = 0
    show_gears = False
    asteroid.destroyed = 0
    waves = Waves(earth, moon, gain_xp)
    sound.music('battle')
    # 오른쪽 위 작은 스킬 팝업 그림 이름과 지난 시간
    popup = None
    boss_cut = False
    clock = 0.0


def finish():
    game_world.clear()


def pause():
    pass


def resume():
    pass


def gain_xp(n):
    global xp, level, pending, fragments
    xp += n
    fragments += n
    while xp >= need(level):
        xp -= need(level)
        level += 1
        # 아직 고르지 않은 레벨업 수
        pending += 1


def open_cards():
    global pending
    cards = augment.roll(moon, level)
    pending -= 1
    sound.play('levelup')
    # 더 고를 카드가 없으면 그냥 계속, 있으면 카드 모드를 위에 띄움
    if cards:
        card_mode.cards = cards
        game_framework.push_mode(card_mode)


def use_skill(i):
    if i >= len(moon.skills) or not moon.skills[i].ready():
        return
    s = moon.skills[i]
    data = augment.AUGMENTS[s.key]
    if s.seen:
        # 두 번째부터는 게임을 멈추지 않고 웨이브 칸 아래 작은 팝업만 띄우고 바로 스킬
        global popup
        popup = ['popup-' + s.key, 0.0]
        s.use()
        return
    s.seen = True
    # 처음에는 컷인이 끝나야 스킬이 나감, 컷인 동안 배경음을 멈추고 끝나면 멈춘 자리부터 이어서
    sound.pause_music()
    cutin_mode.start(data['cutin'], data['name'], augment.KIND_COLOR['스킬'], lambda: skill_done(s), sfx='cutin_' + s.key)


def skill_done(s):
    sound.resume_music()
    s.use()


def handle_events():
    global show_gears
    for event in get_events():
        if event.type in (SDL_KEYDOWN, SDL_KEYUP) and event.key == SDLK_TAB:
            show_gears = event.type == SDL_KEYDOWN
        elif common.handle_common(event):
            pass
        elif event.type == SDL_KEYDOWN and event.key == SDLK_ESCAPE:
            game_framework.push_mode(pause_mode)
            return
        elif event.type == SDL_KEYDOWN and event.key == SDLK_n:
            # 시험용 웨이브 건너뛰기
            waves.skip()
        elif event.type == SDL_KEYDOWN and event.key == SDLK_l:
            # 시험용 바로 레벨업, 다음 레벨까지 모자란 파편만큼 채움
            gain_xp(need(level) - xp)
        elif event.type == SDL_KEYDOWN and event.key in SKILL_KEYS:
            use_skill(SKILL_KEYS[event.key])
        else:
            moon.handle_event(event)


def update():
    global clock, popup, boss_cut
    dt = game_framework.frame_time
    clock += dt
    if popup:
        popup[1] += dt
        if popup[1] >= get_sheet(popup[0]).duration():
            popup = None
    game_world.update()
    waves.update()
    if waves.boss and not boss_cut:
        # 보스가 나오는 순간 한 번 보스 컷인
        boss_cut = True
        # 화면 전체 컷인이라 제목은 소행성과 지구 사이에, 컷인 동안은 음악을 끄고 끝나면 보스 음악
        sound.stop_music()
        cutin_mode.start('cutin-boss', '거대 소행성 접근', (242, 133, 74), lambda: sound.music('boss'), 215, 1.85, 'boss_cutin')
    elif earth.hp <= 0:
        end_game(False)
    elif waves.cleared():
        end_game(True)
    elif pending > 0:
        open_cards()


def end_game(cleared):
    # 끝난 순간의 기록을 결과 화면용으로 남김
    stats = dict(wave=waves.number, last=LAST, time=clock, level=level,
                 kills=asteroid.destroyed, fragments=fragments, hp=earth.hp)
    result_mode.set_result(cleared, stats, moon)
    game_framework.change_mode(result_mode)


def bar(x, y, w, h, k, color):
    draw_rectangle(x, y, x + w, y + h, 40, 44, 80, 255, True)
    if k > 0:
        draw_rectangle(x, y, x + int(w * k), y + h, *color, 255, True)
    draw_rectangle(x, y, x + w, y + h, 201, 204, 224)


def fit_icon(name, x, y, size, t=None):
    # 그림의 긴 쪽이 size가 되게 줄여서 그림
    s = get_sheet(name)
    draw_icon(name, x, y, size / max(s.w, s.h), t)


def draw_icon(name, x, y, scale, t=None):
    s = get_sheet(name)
    # 피벗 말고 그림 가운데가 x y에 오게 그림, 한 번만 도는 그림도 아이콘에서는 반복
    s.draw((clock if t is None else t) % s.duration(), x - (s.w / 2 - s.px) * scale, y - (s.py - s.h / 2) * scale, 0, scale)


def draw_hud():
    # 글자 없이 그림과 막대로만
    fit_icon('earth', 30, H - 26, 30)
    bar(52, H - 33, 200, 14, earth.hp / earth.max_hp, (79, 176, 160))
    fit_icon('fragment', 30, 26, 18)
    bar(52, 21, 200, 10, xp / need(level), (232, 197, 71))
    # 속도 단계마다 한 장씩 그린 41장 중 지금 속도에 맞는 장
    k = (moon.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)
    get_sheet('speedo-hud').draw(round(k * 40), SPEEDO_X, SPEEDO_Y)
    panels.draw_skills(moon, common.font, clock)
    draw_wave()


def draw_wave():
    # 웨이브 칸 10개, 지나간 칸은 채우고 지금 칸은 깜빡임, 마지막은 보스 그림
    x0, y = 540, H - 26
    for n in range(1, LAST):
        l = x0 + (n - 1) * 20
        if n < waves.number:
            color = (232, 197, 71)
        elif n == waves.number:
            color = (243, 239, 228) if int(clock * 3) % 2 == 0 else (232, 197, 71)
        else:
            color = (40, 44, 80)
        draw_rectangle(l, y - 6, l + 14, y + 6, *color, 255, True)
    fit_icon('asteroid-boss', x0 + (LAST - 1) * 20 + 12, y, 30 if waves.number == LAST else 24)
    boss = waves.boss
    if waves.number == LAST and boss and boss.hp > 0:
        fit_icon('asteroid-boss', 180, H - 59, 22)
        bar(200, H - 64, 400, 10, boss.hp / boss.max_hp, (242, 133, 74))
    # 웨이브 사이 쉬는 3초 동안 pixelfx로 그린 알림 글자
    if waves.resting():
        name = 'boss-incoming' if waves.number == LAST else 'wave-%d' % waves.number
        get_sheet(name).draw(REST - waves.timer, W / 2, H / 2 + 120, 0, 2)


def draw_world():
    # 플레이 화면, 위에 띄우는 카드 모드도 이것부터 그림
    common.draw_background()
    game_world.render()
    draw_hud()
    if popup:
        get_sheet(popup[0]).draw(popup[1], POPUP_X, POPUP_Y)


def render():
    common.begin()
    draw_world()
    if show_gears:
        panels.draw(moon, common.font, clock)
    common.end()
