from pico2d import get_time, load_music, load_wav
from sdl2.sdlmixer import Mix_AllocateChannels, Mix_HaltChannel, Mix_HaltMusic, Mix_PauseMusic, Mix_ResumeMusic, Mix_VolumeMusic

# 소리마다 크기 0 ~ 128, 자주 나는 소리일수록 작게
VOLUME = {
    'shot': 18, 'laser': 22, 'missile': 40, 'coil': 40, 'drone': 35,
    'explode_small': 40, 'explode_big': 70, 'boss_hit': 45, 'boss_explode': 110,
    'ram': 80, 'shield': 70, 'pickup': 30,
    'levelup': 80, 'card_pick': 70,
    'cutin_jump': 100, 'cutin_pierce': 100, 'cutin_gbomb': 100, 'cutin_boost': 100,
    'skill_pierce': 90, 'skill_boost': 90, 'skill_gbomb': 90, 'skill_jump': 80, 'jump_shock': 85,
    'wave_start': 70, 'earth_hit': 75, 'boss_cutin': 115, 'select': 70,
    'intro_type': 35, 'intro_1': 110, 'intro_2': 120, 'intro_3': 120, 'intro_4': 125, 'intro_5': 120, 'ending_1': 120,
}
# 같은 소리가 이 시간 안에 또 나면 건너뜀
GAP = 0.05

_wavs = {}
_last = {}
_songs = {}
song = None
muted = False
# 일시정지 화면에서 고르는 크기 0 ~ 10
sfx_level = 2
music_level = 2


def init():
    # 소리가 많이 겹쳐도 끊기지 않게 채널을 넉넉히
    Mix_AllocateChannels(32)


def play(name):
    if muted:
        return
    now = get_time()
    if now - _last.get(name, -1.0) < GAP:
        return
    _last[name] = now
    if name not in _wavs:
        _wavs[name] = load_wav('res/sound/' + name + '.wav')
        _wavs[name].set_volume(chunk_volume(name))
    _wavs[name].play()


def stop_all():
    # 나오고 있는 효과음을 전부 끊음
    Mix_HaltChannel(-1)


def chunk_volume(name):
    return int(VOLUME.get(name, 64) * sfx_level / 10)


def set_sfx(level):
    global sfx_level
    sfx_level = max(0, min(10, level))
    for name, w in _wavs.items():
        w.set_volume(chunk_volume(name))


def music_volume():
    return 0 if muted else int(128 * music_level / 10)


def set_music(level):
    global music_level
    music_level = max(0, min(10, level))
    Mix_VolumeMusic(music_volume())


def music(name, loop=True):
    # 배경음 바꾸기, 같은 곡이 이미 나오고 있으면 처음부터 다시 틀지 않음
    global song
    if name == song:
        return
    song = name
    if name not in _songs:
        _songs[name] = load_music('res/music/' + name + '.mp3')
    Mix_VolumeMusic(music_volume())
    if loop:
        _songs[name].repeat_play()
    else:
        _songs[name].play(1)


def pause_music():
    # 멈춘 자리를 기억해 두고 이어서 틀 수 있게
    Mix_PauseMusic()


def resume_music():
    Mix_ResumeMusic()


def stop_music():
    global song
    song = None
    Mix_HaltMusic()


def toggle():
    global muted
    muted = not muted
    Mix_VolumeMusic(music_volume())
