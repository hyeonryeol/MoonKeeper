# 티저 영상에 소리를 입힘
# 게임의 효과음과 음악을 장면 시간표에 맞춰 섞어서 영상과 합침
# 저장소 폴더에서 python tools/teaser/mix_audio.py 소리없는영상.mp4 결과.mp4 로 실행
import os
import subprocess
import sys

SRC, OUT = sys.argv[1], sys.argv[2]
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
DUR = 33.0
S, M = 'res/sound/', 'res/music/'

# 달 장면에서 소행성이 터지는 시간, teaser.js 의 KILLS 와 같음
KILLS = [10 + 1.5 + i * 0.58 for i in range(9)]

# 파일, 시작 시간, 크기, 덧붙일 필터
tracks = [
    (S + 'intro_1.wav', 0.0, 0.9, ''),
    (S + 'intro_3.wav', 5.0, 0.9, ''),
    # 달 장면부터 게임 화면까지 전투 음악
    (M + 'battle.mp3', 10.0, 0.42, 'atrim=0:16.6,afade=t=in:d=0.6,afade=t=out:st=16.0:d=0.6'),
    # 게임 화면이 바뀔 때마다
    (S + 'card_pick.wav', 16.5, 0.5, ''),
    (S + 'card_pick.wav', 19.2, 0.5, ''),
    (S + 'card_pick.wav', 24.6, 0.5, ''),
    # 스킬 컷인 화면은 컷인 소리를 그림과 맞춰서, 화면이 0.33초 지난 데서 시작함
    (S + 'cutin_pierce.wav', 22.2, 0.8, 'atrim=start=0.33,asetpts=PTS-STARTPTS'),
    # 보스가 내려오는 굉음, 쾅 소리가 로고 뜨는 29.0초에 오게
    (S + 'boss_cutin.wav', 27.3, 1.0, ''),
    (S + 'boss_explode.wav', 29.0, 0.7, ''),
    # 로고 뒤 음악
    (M + 'clear.mp3', 29.4, 0.6, 'atrim=0:3.6,afade=t=in:d=0.2,afade=t=out:st=2.8:d=0.8'),
]
for tk in KILLS:
    tracks.append((S + 'laser.wav', tk - 0.16, 0.45, ''))
    tracks.append((S + 'explode_big.wav', tk, 0.55, ''))

cmd = [FFMPEG, '-y', '-i', SRC]
for path, _, _, _ in tracks:
    cmd += ['-i', path]
parts, names = [], []
for i, (_, start, vol, extra) in enumerate(tracks):
    chain = (extra + ',' if extra else '') + 'aresample=44100,aformat=channel_layouts=stereo,volume=%.2f,adelay=%d:all=1' % (vol, round(start * 1000))
    parts.append('[%d:a]%s[a%d]' % (i + 1, chain, i))
    names.append('[a%d]' % i)
parts.append('%samix=inputs=%d:normalize=0:duration=longest,atrim=0:%.2f,afade=t=out:st=%.2f:d=0.7,loudnorm=I=-14:TP=-1.5[mix]'
             % (''.join(names), len(tracks), DUR, DUR - 0.8))
cmd += ['-filter_complex', ';'.join(parts), '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart', '-shortest', OUT]
subprocess.run(cmd, check=True)
print('saved', OUT)
