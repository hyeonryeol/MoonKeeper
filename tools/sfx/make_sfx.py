# 달지기 효과음 합성기
# 파이썬 기본 모듈만으로 8비트 느낌 효과음을 계산해서 res/sound 에 wav로 저장
# 저장소 폴더에서 python tools/sfx/make_sfx.py 로 실행
import math
import os
import random
import struct
import wave

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'res', 'sound')


# 파형 한 개, p 는 0에서 1 사이 위상
def square(p, duty=0.5):
    return 1.0 if p % 1.0 < duty else -1.0


def triangle(p):
    p %= 1.0
    return 4 * p - 1 if p < 0.5 else 3 - 4 * p


def saw(p):
    return 2 * (p % 1.0) - 1


def sine(p):
    return math.sin(p * math.tau)


class Noise:
    # 일정 주기마다 값을 새로 뽑는 거친 잡음, 주기가 길수록 낮은 소리
    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.value = 0.0
        self.phase = 0.0

    def next(self, freq):
        self.phase += freq / RATE
        if self.phase >= 1.0:
            self.phase %= 1.0
            self.value = self.rng.uniform(-1, 1)
        return self.value


def sweep(f0, f1, k):
    # 지수로 음 높이를 바꿔 귀에 고르게 들리게 함
    return f0 * (f1 / f0) ** k


def env(t, dur, attack=0.005, curve=2.0):
    # 짧게 올라갔다가 끝까지 줄어듦
    if t < attack:
        return t / attack
    k = (t - attack) / max(1e-6, dur - attack)
    return max(0.0, 1 - k) ** curve


def tone(dur, f0, f1=None, wave_fn=square, vol=1.0, attack=0.005, curve=2.0, vib=0.0, vib_rate=0.0, start=0.0, **kw):
    # 한 음을 샘플 목록으로, start 초 뒤에 시작
    f1 = f1 or f0
    # 반올림으로 한 칸 모자라지 않게 시작과 길이를 따로 셈
    out = [0.0] * (int(start * RATE) + int(dur * RATE) + 1)
    p = 0.0
    for i in range(int(dur * RATE)):
        t = i / RATE
        f = sweep(f0, f1, t / dur) * (1 + vib * math.sin(t * vib_rate * math.tau))
        p += f / RATE
        s = wave_fn(p, **kw) if kw else wave_fn(p)
        out[int(start * RATE) + i] = s * vol * env(t, dur, attack, curve)
    return out


def noise(dur, f0, f1=None, vol=1.0, attack=0.002, curve=2.0, seed=1, start=0.0, crackle=0.0):
    f1 = f1 or f0
    n = Noise(seed)
    rng = random.Random(seed + 99)
    # 반올림으로 한 칸 모자라지 않게 시작과 길이를 따로 셈
    out = [0.0] * (int(start * RATE) + int(dur * RATE) + 1)
    for i in range(int(dur * RATE)):
        t = i / RATE
        s = n.next(sweep(f0, f1, t / dur))
        # 가끔 튀는 소리로 타닥거림
        if crackle and rng.random() < crackle / RATE * 40:
            s = rng.choice((-1, 1))
        out[int(start * RATE) + i] = s * vol * env(t, dur, attack, curve)
    return out


def mix(*layers):
    n = max(len(l) for l in layers)
    out = [0.0] * n
    for l in layers:
        for i, s in enumerate(l):
            out[i] += s
    return out


def gate(samples, rate, duty=0.5):
    # 소리를 빠르게 끊었다 이어서 떨림
    return [s if (i / RATE * rate) % 1.0 < duty else 0.0 for i, s in enumerate(samples)]


def tremolo(samples, rate, depth):
    return [s * (1 - depth + depth * (0.5 + 0.5 * math.sin(i / RATE * rate * math.tau))) for i, s in enumerate(samples)]


def lowpass(samples, cut):
    # 높은 소리를 깎아 먹먹하게
    a = 1 - math.exp(-math.tau * cut / RATE)
    y, out = 0.0, []
    for s in samples:
        y += a * (s - y)
        out.append(y)
    return out


def notes(seq, step, wave_fn=square, vol=0.5, length=None, **kw):
    # 음 이름 대신 주파수 목록을 차례로
    layers = []
    for i, f in enumerate(seq):
        if f:
            layers.append(tone(length or step * 1.6, f, wave_fn=wave_fn, vol=vol, start=i * step, curve=1.5, **kw))
    return mix(*layers)


C5, D5, E5, F5, G5, A5, B5 = 523.3, 587.3, 659.3, 698.5, 784.0, 880.0, 987.8
C6, E6, G6 = 1046.5, 1318.5, 1568.0


def save(name, samples, peak=0.9):
    os.makedirs(OUT, exist_ok=True)
    top = max(1e-6, max(abs(s) for s in samples))
    k = peak / top
    # 끝을 짧게 줄여 딱 소리 없이 끝남
    fade = int(0.004 * RATE)
    data = bytearray()
    for i, s in enumerate(samples):
        if i > len(samples) - fade:
            s *= (len(samples) - i) / fade
        data += struct.pack('<h', int(max(-1, min(1, s * k)) * 32000))
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(data))
    print('%-14s %.2fs' % (name, len(samples) / RATE))


# 컷인용 조각 소리, 컷인 그림의 시간표에 맞춰 start 초에 놓음
# 반짝임 0.2  장치 펼침 0.5 ~ 1.1  충전 1.1 ~ 1.6  발사 1.6  띠 1.78  빠져나감 2.45
FLASH = 1.6


def ting(start, f=2600, vol=0.25):
    return tone(0.25, f, f * 1.01, sine, vol=vol, start=start, curve=2.5)


def clack(start, f=900, vol=0.35, seed=61):
    # 금속 장치가 철컥 걸리는 소리
    return mix(tone(0.05, f, f * 0.6, square, vol=vol, duty=0.3, start=start),
               noise(0.04, 9000, vol=vol * 0.6, seed=seed, start=start))


def servo(start, dur, f0=180, f1=320, vol=0.18):
    # 모터가 돌며 펼쳐지는 위잉
    return tone(dur, f0, f1, square, vol=vol, duty=0.2, curve=0.5, attack=0.04, vib=0.06, vib_rate=28, start=start)


def whine(start, dur, f0, f1, vol=0.3, wave_fn=saw):
    # 점점 높아지며 커지는 충전 소리, 끝으로 갈수록 떨림이 빨라짐
    # 반올림으로 한 칸 모자라지 않게 시작과 길이를 따로 셈
    out = [0.0] * (int(start * RATE) + int(dur * RATE) + 1)
    p = 0.0
    for i in range(int(dur * RATE)):
        t = i / RATE
        k = t / dur
        f = sweep(f0, f1, k ** 1.4) * (1 + 0.02 * k * math.sin(t * (10 + 50 * k) * math.tau))
        p += f / RATE
        out[int(start * RATE) + i] = wave_fn(p) * vol * (0.15 + 0.85 * k ** 1.5)
    return out


def whoosh(start, dur=0.3, up=True, vol=0.35, seed=71):
    f0, f1 = (1500, 9000) if up else (9000, 1200)
    return lowpass(noise(dur, f0, f1, vol=vol, attack=dur * 0.6, curve=2.5, seed=seed, start=start), 6000)


def boom(start, vol=0.7, seed=81):
    return mix(lowpass(noise(0.6, 1600, 120, vol=vol, curve=1.6, seed=seed, start=start), 1500),
               tone(0.45, 120, 35, square, vol=vol * 0.6, start=start, curve=1.5))


def band_and_leave():
    # 1.78 띠가 철썩 들어오고 2.45 다 같이 빠져나감
    return mix(whoosh(1.7, 0.18, True, 0.3, 91), whoosh(2.42, 0.35, False, 0.25, 93))


SOUNDS = {
    # 무기
    'shot': lambda: tone(0.06, 900, 420, square, duty=0.25),
    'laser': lambda: mix(tone(0.09, 1500, 600, square, duty=0.125, vib=0.03, vib_rate=60), tone(0.09, 750, 300, triangle, vol=0.4)),
    'missile': lambda: mix(lowpass(noise(0.3, 3000, 8000, vol=0.7, attack=0.02, curve=1.2, seed=3), 2500), tone(0.3, 180, 520, saw, vol=0.3, curve=1.2)),
    'coil': lambda: mix(gate(noise(0.22, 9000, 4000, vol=0.8, seed=5), 38, 0.6), tone(0.22, 1300, 900, square, vol=0.3, duty=0.1, vib=0.2, vib_rate=47)),
    'drone': lambda: mix(tone(0.09, 360, 120, triangle), noise(0.05, 5000, vol=0.3, seed=7)),
    # 소행성
    'explode_small': lambda: mix(lowpass(noise(0.28, 2600, 500, seed=11), 3000), tone(0.2, 140, 50, square, vol=0.35)),
    'explode_big': lambda: mix(lowpass(noise(0.7, 1800, 200, curve=1.6, seed=13, crackle=6), 1600), tone(0.5, 100, 35, square, vol=0.4)),
    'boss_hit': lambda: mix(tone(0.12, 240, 180, square, vol=0.5, duty=0.3), noise(0.08, 6000, vol=0.5, seed=17)),
    'boss_explode': lambda: mix(lowpass(noise(1.8, 1500, 90, curve=1.3, seed=19, crackle=14), 1200),
                                tone(1.6, 80, 28, square, vol=0.45, curve=1.4), noise(0.25, 7000, vol=0.5, seed=23)),
    # 달
    'ram': lambda: mix(tone(0.22, 170, 45, triangle, vol=1.0, curve=1.5), lowpass(noise(0.15, 1500, 300, vol=0.5, seed=29), 1200)),
    'shield': lambda: mix(tone(0.35, 700, 1400, triangle, vol=0.6, curve=1.2), tone(0.35, 1400, 2800, sine, vol=0.3, vib=0.01, vib_rate=30)),
    'pickup': lambda: mix(tone(0.05, C6, wave_fn=square, vol=0.5, duty=0.25), tone(0.08, G6, wave_fn=square, vol=0.5, duty=0.25, start=0.04)),
    # 성장
    'levelup': lambda: notes([C5, E5, G5, C6, E6], 0.06, square, duty=0.25, vol=0.5),
    'card_pick': lambda: notes([G5, C6, G6], 0.05, square, duty=0.5, vol=0.45),
    # 스킬
    'skill_pierce': lambda: mix(tone(0.3, 300, 1800, saw, vol=0.3, curve=0.3, attack=0.28),
                                tone(0.5, 1800, 900, square, vol=0.5, duty=0.125, vib=0.04, vib_rate=70, start=0.3),
                                noise(0.5, 9000, 3000, vol=0.25, seed=41, start=0.3)),
    'skill_boost': lambda: mix(lowpass(noise(1.1, 800, 2400, vol=0.9, attack=0.15, curve=1.1, seed=43, crackle=4), 1800),
                               tone(1.1, 60, 110, saw, vol=0.35, curve=1.2)),
    'skill_gbomb': lambda: mix(tremolo(tone(1.0, 420, 55, sine, vol=0.8, curve=0.8), 9, 0.6),
                               tone(0.25, 900, 80, square, vol=0.4, start=1.0), lowpass(noise(0.3, 3000, 400, vol=0.6, seed=47, start=1.0), 2500)),
    # 궤도 점프 충격파, 달이 떨어지는 무게감이 나게 낮게 꺼지는 워프음과 묵직한 쿵, 땅울림
    'jump_shock': lambda: mix(tone(0.55, 900, 55, square, vol=0.35, duty=0.35, vib=0.04, vib_rate=30, curve=1.4),
                              tone(0.7, 90, 28, sine, vol=0.9, attack=0.01, curve=1.2),
                              tone(0.4, 140, 40, triangle, vol=0.6, curve=1.6),
                              lowpass(noise(0.7, 900, 120, vol=0.7, curve=1.5, seed=121, crackle=3), 500),
                              tremolo(tone(0.45, 520, 480, sine, vol=0.12, attack=0.02, curve=1.5), 14, 0.7)),
    'skill_jump': lambda: mix(tone(0.25, 220, 2400, square, vol=0.4, duty=0.25), notes([0, 0, 0, 0, C6, G6], 0.04, triangle, vol=0.4)),
    # 스킬 컷인 2.8초 그림 시간표에 맞춤
    'cutin_jump': lambda: mix(
        ting(0.2), clack(0.55, 1100), clack(0.75, 1300), clack(0.92, 1500),
        tone(0.4, 90, 220, sine, vol=0.4, attack=0.1, curve=1, start=0.85),
        notes([0] * 22 + [C6, E6, G6], 0.05, triangle, vol=0.2),
        whine(1.05, 0.55, 300, 2600, 0.35, saw), whine(1.05, 0.55, 302, 2610, 0.2, square),
        tone(0.35, 2200, 160, square, vol=0.6, duty=0.25, start=FLASH, curve=1.3),
        noise(0.12, 12000, 3000, vol=0.5, seed=101, start=FLASH), tone(0.3, 140, 45, triangle, vol=0.6, start=FLASH),
        tone(0.15, 1800, 3500, square, vol=0.25, duty=0.125, start=1.66),
        band_and_leave()),
    'cutin_pierce': lambda: mix(
        ting(0.2), clack(0.47, 500, 0.4), servo(0.55, 0.3, 160, 280), clack(0.82, 800), clack(1.0, 1200),
        notes([0] * 19 + [A5, C6, E6, A5 * 2], 0.05, square, vol=0.15, duty=0.25),
        whine(1.1, 0.5, 400, 3000, 0.35, saw),
        tone(0.9, 1600, 700, square, vol=0.45, duty=0.125, vib=0.05, vib_rate=80, start=FLASH, curve=1.1),
        noise(0.8, 9000, 2500, vol=0.35, seed=103, start=FLASH, curve=1.2), boom(FLASH, 0.6, 105),
        band_and_leave()),
    'cutin_gbomb': lambda: mix(
        ting(0.2, 2000), servo(0.5, 0.35, 140, 240), clack(0.84, 700), tone(0.5, 330, 340, sine, vol=0.25, start=0.8, attack=0.1, curve=1),
        tremolo(whine(1.0, 0.6, 120, 700, 0.45, triangle), 14, 0.7),
        tone(0.5, 600, 50, sine, vol=0.8, start=FLASH, curve=1.2), boom(FLASH, 0.6, 107),
        tremolo(tone(0.9, 90, 60, square, vol=0.3, start=1.7, curve=1.0), 7, 0.6),
        band_and_leave()),
    'cutin_boost': lambda: mix(
        ting(0.2, 2300), servo(0.5, 0.36, 90, 160, 0.25), clack(0.86, 400, 0.45), lowpass(noise(0.3, 6000, 2000, vol=0.3, seed=109, start=0.88), 5000),
        clack(1.12, 1000, 0.2), clack(1.2, 1100, 0.2), clack(1.28, 1200, 0.2),
        lowpass(whine(1.3, 0.3, 60, 220, 0.6, saw), 900),
        boom(FLASH, 0.8, 111), lowpass(noise(1.1, 900, 2200, vol=0.8, attack=0.05, curve=1.0, seed=113, start=FLASH, crackle=5), 1800),
        band_and_leave()),
    # 알림
    'wave_start': lambda: notes([A5, 0, A5, E6], 0.09, square, duty=0.5, vol=0.4, length=0.08),
    'earth_hit': lambda: tremolo(tone(0.3, 110, 90, square, vol=0.8, duty=0.4, curve=1.2), 18, 0.7),
    'boss_cutin': lambda: mix(tone(1.7, 40, 70, saw, vol=0.45, attack=0.6, curve=0.2), tremolo(tone(1.7, 55, 55, square, vol=0.25, attack=0.8, curve=0.2), 6, 0.5),
                              lowpass(noise(1.3, 1200, 80, vol=1.0, curve=1.4, seed=53, crackle=10, start=1.7), 1400),
                              tone(1.0, 90, 30, square, vol=0.5, start=1.7, curve=1.5)),
    # 화면
    'select': lambda: notes([E6, G6], 0.04, square, duty=0.25, vol=0.4, length=0.06),
}

# 시작 시네마틱용, 장면 그림의 시간표에 맞춘 긴 소리 한 장면에 하나
def pad(dur, f, vol=0.2, start=0.0, beat=0.0):
    # 낮게 깔리는 우주 소리, beat 를 주면 두 음이 맞물려 울렁임
    a = tone(dur, f, wave_fn=sine, vol=vol, attack=min(1.0, dur * 0.3), curve=0.4, start=start)
    if beat:
        a = mix(a, tone(dur, f + beat, wave_fn=sine, vol=vol, attack=min(1.0, dur * 0.3), curve=0.4, start=start))
    return a


def blip(start, f=1568.0, vol=0.08):
    return mix(tone(0.05, f, wave_fn=square, vol=vol, duty=0.25, start=start), tone(0.05, f, wave_fn=square, vol=vol, duty=0.25, start=start + 0.09))


def flyby(at, vol=0.7, seed=201):
    # 큰 돌이 카메라 옆을 스쳐 지나가는 소리
    return mix(lowpass(noise(0.8, 400, 2600, vol=vol * 0.6, attack=0.4, curve=2.0, seed=seed, start=at - 0.4), 3000),
               tone(0.8, 150, 48, triangle, vol=vol, attack=0.35, curve=1.2, start=at - 0.4))


def alarm(start, vol=0.16):
    return mix(tone(0.18, 660, wave_fn=square, vol=vol, duty=0.5, start=start, curve=0.6), tone(0.18, 520, wave_fn=square, vol=vol, duty=0.5, start=start + 0.2, curve=0.6))


def meteor(hit, vol=1.0, seed=211):
    # 떨어지는 휘파람 뒤에 쾅
    return mix(tone(0.9, 2400, 500, sine, vol=0.18 * vol, attack=0.6, curve=0.4, start=hit - 0.9),
               lowpass(noise(0.9, 1500, 5000, vol=0.25 * vol, attack=0.8, curve=0.5, seed=seed, start=hit - 0.9), 4000),
               lowpass(noise(1.5, 1500, 100, vol=vol, curve=1.4, seed=seed + 1, crackle=12, start=hit), 1300),
               tone(1.1, 90, 28, square, vol=0.6 * vol, start=hit, curve=1.4))


INTRO = {
    'intro_type': lambda: tone(0.025, 1900, 1500, square, vol=0.5, duty=0.25),
    # 1 평화, 낮은 울림과 별 반짝임과 위성 신호음
    'intro_1': lambda: mix(pad(5.0, 55, 0.3), pad(5.0, 82.4, 0.18), pad(5.0, 110, 0.1, beat=0.7),
                           ting(0.9, 2000, 0.07), ting(2.0, 2400, 0.06), ting(3.2, 1800, 0.07), ting(4.0, 2600, 0.05),
                           blip(1.3), blip(2.6, 1318.5), blip(3.7)),
    # 2 태양 폭풍, 끓다가 1.3 터지고 1.5부터 파도가 지나가고 2.9 위성이 맞음
    'intro_2': lambda: mix(lowpass(noise(1.3, 200, 900, vol=0.6, attack=1.2, curve=0.5, seed=231), 700),
                           tone(1.3, 40, 90, saw, vol=0.4, attack=1.1, curve=0.3), boom(1.3, 0.9, 233),
                           lowpass(noise(2.5, 3000, 500, vol=0.55, attack=0.3, curve=1.0, seed=235, crackle=6, start=1.5), 2500),
                           boom(2.9, 0.8, 237), gate(noise(0.9, 9000, 3000, vol=0.5, seed=239, start=2.9), 40, 0.5),
                           tone(1.2, 900, 70, square, vol=0.25, duty=0.25, start=3.1, curve=1.0),
                           pad(5.5, 49, 0.2, beat=1.5)),
    # 3 소행성 떼, 경보와 1.55 2.85 3.95 에 스쳐 지나감
    'intro_3': lambda: mix(pad(5.0, 46, 0.35, beat=3.0), pad(5.0, 69, 0.15),
                           alarm(1.0), alarm(2.0), alarm(3.0), alarm(4.0),
                           flyby(1.55, 0.8, 241), flyby(2.85, 1.0, 243), flyby(3.95, 0.9, 245)),
    # 4 첫 충돌, 1.6 크게 2.75 3.35 작게
    'intro_4': lambda: mix(pad(4.8, 43, 0.3, beat=2.0), meteor(1.6, 1.0, 251), meteor(2.75, 0.55, 253), meteor(3.35, 0.65, 255),
                           lowpass(noise(3.0, 300, 120, vol=0.3, attack=0.5, curve=0.8, seed=257, start=1.7), 400)),
    # 5 포탑, 1.5 전원 2.2 ~ 3.3 일어섬 3.5 ~ 4.2 충전 4.2 발사
    'intro_5': lambda: mix(pad(5.8, 55, 0.18), ting(1.5, 1800, 0.2), tone(0.7, 80, 300, saw, vol=0.25, attack=0.5, curve=0.5, start=1.5),
                           blip(1.55, 2093.0, 0.1), blip(1.8, 2093.0, 0.1), tone(4.0, 120, 122, triangle, vol=0.12, attack=0.4, curve=0.3, start=1.8),
                           clack(2.2, 500, 0.45), servo(2.25, 1.05, 90, 210, 0.3), clack(3.3, 700, 0.5, 63), clack(3.42, 1200, 0.3, 65),
                           whine(3.5, 0.7, 300, 2600, 0.35, saw), whine(3.5, 0.7, 302, 2610, 0.2, square),
                           tone(0.5, 2200, 160, square, vol=0.6, duty=0.25, start=4.2, curve=1.3), boom(4.2, 0.7, 261),
                           noise(0.15, 12000, 3000, vol=0.5, seed=263, start=4.2)),
    # 엔딩, 부서진 조각이 흩어지다가 3.2 부터 해가 뜨며 밝은 화음
    'ending_1': lambda: mix(lowpass(noise(2.6, 1400, 90, vol=0.9, curve=1.3, seed=291, crackle=10), 1200), tone(1.6, 80, 30, square, vol=0.4, curve=1.4),
                            pad(7.2, 65.4, 0.2),
                            pad(4.0, 130.8, 0.22, start=3.2), pad(4.0, 164.8, 0.18, start=3.4), pad(4.0, 196.0, 0.18, start=3.6), pad(3.4, 261.6, 0.12, start=3.8),
                            ting(3.8, 1568.0, 0.08), ting(4.5, 2093.0, 0.08), ting(5.2, 2637.0, 0.07),
                            notes([0] * 28 + [G5, C6, E6, G6], 0.18, triangle, vol=0.22, length=0.6)),
}
SOUNDS.update(INTRO)

if __name__ == '__main__':
    import sys
    # 이름을 주면 그 글자로 시작하는 소리만 다시 만듦
    only = sys.argv[1] if len(sys.argv) > 1 else ''
    for name, make in SOUNDS.items():
        if name.startswith(only):
            save(name, make())
