"""Cut 9:16 detail plates out of the 4K brand film (브랜딩압축.mp4) -> img/*.jpg

The film has the RAUM SOCIAL CLUB wordmark burned into the middle of every shot, so each plate is
a window taken entirely above (y < 1760) or below (y > 2030) that band, at (near) native 4K resolution.

    SRC=path/to/브랜딩압축.mp4 python3 prep_images.py
"""
import os
import pathlib
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image

here = pathlib.Path(__file__).parent
SRC = os.environ['SRC']
FF = imageio_ffmpeg.get_ffmpeg_exe()
OUT_W, OUT_H = 1188, 2112          # 1.1x the reel frame, headroom for slow push-ins

# name: (time in film, x0, y0, window height)  — window width = h * 9/16
PLATES = {
    'candles':    (6.95, 1100, 2030, 1810),
    'chandelier': (1.45, 650, 0, 1760),
    'gothic':     (6.95, 120, 0, 1760),
    'table':      (4.50, 0, 2030, 1810),
    'arch':       (0.30, 560, 0, 1760),
}


def frame(t):
    raw = subprocess.run([FF, '-loglevel', 'error', '-ss', str(t), '-i', SRC, '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb48le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<u2').reshape(3840, 2160, 3).astype(np.float32) / 65535


def grade(x):
    # the film is shot under a dark overlay: lift it back, roll highlights off softly, warm the mids a touch
    x = x * 1.55
    x = 1 - np.exp(-x * 1.25)
    x = x / (1 - np.exp(-1.25 * 1.55))
    x[..., 0] *= 1.02
    x[..., 2] *= .96
    return np.clip(x, 0, 1) ** 1.04


out = here / 'img'
out.mkdir(exist_ok=True)
cache = {}
for name, (t, x0, y0, h) in PLATES.items():
    if t not in cache:
        cache[t] = frame(t)
    w = round(h * 9 / 16)
    crop = grade(cache[t][y0:y0 + h, x0:x0 + w])
    im = Image.fromarray((crop * 255 + .5).astype(np.uint8)).resize((OUT_W, OUT_H), Image.LANCZOS)
    im.save(out / f'{name}.jpg', quality=90, optimize=True, progressive=True)
    print(name, f'{w}x{h} -> {OUT_W}x{OUT_H}')
