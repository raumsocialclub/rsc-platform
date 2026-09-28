"""Synthesise the 15 s soundtrack for the RSC reel.

128 BPM, 8 bars = exactly 15.0 s, so every scene cut in index.html lands on a bar line and the
reel loops seamlessly (the reverb tail past 15 s is wrapped back onto the start).

    python3 audio.py  ->  out/soundtrack.wav   (48 kHz / 24-bit stereo)
"""
import pathlib
import wave

import numpy as np
from scipy import signal

SR = 48000
DUR = 15.0
N = int(SR * DUR)
TAIL = int(SR * 3.0)             # rendered past the end, then wrapped onto the start
NT = N + TAIL
B = 60 / 128                     # beat
BAR = 4 * B
S16 = B / 4
rng = np.random.default_rng(128)

dry = np.zeros((2, NT))
verb = np.zeros((2, NT))
duck_bus = np.zeros((2, NT))


def bt(n):
    return n * B


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0, rev=0.0, bus=None):
    sig = np.atleast_2d(sig)
    if sig.shape[0] == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig[0] * l * 1.414, sig[0] * r * 1.414])
    i0 = int(round(at * SR))
    if i0 < 0:
        sig, i0 = sig[:, -i0:], 0
    n = min(sig.shape[1], NT - i0)
    if n <= 0:
        return
    (duck_bus if bus == 'duck' else dry)[:, i0:i0 + n] += sig[:, :n] * gain
    if rev:
        verb[:, i0:i0 + n] += sig[:, :n] * gain * rev


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR / 2 * .95) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def sweep_lp(x, f0, f1, curve=2.0):
    out = np.zeros_like(x)
    blk, zi = 256, None
    nb = int(np.ceil(len(x) / blk))
    for k in range(nb):
        fc = f0 * (f1 / f0) ** ((k / max(nb - 1, 1)) ** curve)
        b, a = signal.butter(2, min(fc, SR / 2 * .95) / (SR / 2), 'low')
        if zi is None:
            zi = signal.lfilter_zi(b, a) * 0
        seg = x[k * blk:(k + 1) * blk]
        out[k * blk:k * blk + len(seg)], zi = signal.lfilter(b, a, seg, zi=zi)
    return out


# ---------------------------------------------------------------- instruments
def kick(g=1.0, tight=1.0):
    t = tt(.5)
    f = 46 + 120 * np.exp(-t * 34)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7 * tight)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 500) * .15
    return np.tanh(1.8 * (body + click)) * g


def clap():
    t = tt(.3)
    n = bp(rng.standard_normal(len(t)), 1000, 6000)
    e = sum((t >= o) * np.exp(-np.clip(t - o, 0, None) * 200) * .5 for o in (0, .008, .016))
    e = e + (t >= .022) * np.exp(-np.clip(t - .022, 0, None) * 24)
    return n * e * .55


def snap():
    t = tt(.12)
    return bp(rng.standard_normal(len(t)), 1800, 7000) * np.exp(-t * 60) * .5


def hat(open_=False):
    t = tt(.35 if open_ else .06)
    return hp(rng.standard_normal(len(t)), 8000, 3) * np.exp(-t * (10 if open_ else 90)) * .45


def shaker():
    t = tt(.09)
    return bp(rng.standard_normal(len(t)), 5000, 11000) * np.sin(np.pi * np.clip(t / .09, 0, 1)) ** 2 * .3


def tick(f=3200):
    t = tt(.08)
    return (np.sin(2 * np.pi * f * t) * .7 + np.sin(2 * np.pi * f * 1.66 * t) * .3) * np.exp(-t * 90)


def marimba(m, vel=1.0, dur=.7):
    t = tt(dur)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + .35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 30) \
        + .12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 70)
    return s * np.minimum(t / .001, 1) * vel * .3


def epiano(m, dur=1.4, vel=1.0):
    t = tt(dur)
    f = mtof(m)
    idx = 1.5 * np.exp(-t * 5) + .25
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 26) * .1
    return (car + tine) * np.minimum(t / .003, 1) * np.exp(-t * (1.8 + f / 900)) * vel * .3


def stab(notes, dur=.32, vel=1.0, bright=3800):
    """Short detuned-saw chord stab (house organ-ish) with a fast filter pluck."""
    t = tt(dur + .15)
    out = np.zeros((2, len(t)))
    for m in notes:
        for ch, cents in ((0, -9), (1, 9)):
            f = mtof(m) * 2 ** (cents / 1200)
            ph = (f * t + rng.uniform()) % 1
            out[ch] += 2 * ph - 1
    env_f = 400 + bright * np.exp(-t * 16)
    for ch in range(2):
        y = np.zeros_like(t)
        blk = 256
        zi = None
        for k in range(0, len(t), blk):
            b, a = signal.butter(2, min(env_f[k], SR * .45) / (SR / 2), 'low')
            if zi is None:
                zi = signal.lfilter_zi(b, a) * 0
            y[k:k + blk], zi = signal.lfilter(b, a, out[ch, k:k + blk], zi=zi)
        out[ch] = y
    e = np.minimum(t / .004, 1) * np.clip(1 - (t - dur) / .15, 0, 1) * np.exp(-t * 3)
    return out * e * vel * .09 / max(len(notes), 1) ** .5


def pad(notes, dur, att=.5, rel=.8, bright=2600):
    t = tt(dur + rel)
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for m in notes:
        for k, cents in enumerate((-10, 0, 10)):
            f = mtof(m) * 2 ** (cents / 1200)
            v = np.zeros_like(t)
            ph = rng.uniform(0, 2 * np.pi)
            for h in range(1, int(bright / f) + 1):
                v += np.sin(2 * np.pi * f * h * t + ph * h) / h
            if k == 0:
                L += v
            elif k == 2:
                R += v
            else:
                L += v * .7
                R += v * .7
    e = np.clip(t / att, 0, 1) ** 2 * (1 - np.clip((t - dur) / rel, 0, 1))
    g = .05 / max(len(notes), 1) ** .5
    return np.vstack([lp(L, bright * .8), lp(R, bright * .8)]) * e * g


def bass(m, dur, g=1.0):
    t = tt(dur + .04)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t) + .1 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(t / .005, 1) * np.exp(-t * 1.8) * np.clip(1 - (t - dur) / .04, 0, 1)
    return np.tanh(1.5 * s) * e * .38 * g


def bell(m, dur=2.5):
    t = tt(dur)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) \
        + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)
    return s * np.minimum(t / .002, 1) * np.exp(-t * 1.5) * .18


def boom(dur=1.8, g=1.0):
    t = tt(dur)
    f = 32 + 60 * np.exp(-t * 10)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    thump = lp(rng.standard_normal(len(t)), 260) * np.exp(-t * 20) * .8
    return np.tanh(1.4 * (s + thump)) * g


def whoosh(dur, f0=300, f1=9000, rise=True, g=.3, curve=1.6):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    y = sweep_lp(n, f0, f1, curve) if rise else sweep_lp(n, f1, f0, 1 / curve)
    p = t / dur
    e = p ** 2.2 if rise else (1 - p) ** 1.5 * np.minimum(p / .05, 1)
    return y * e * g


def zip_(dur=.16, g=.25):
    """Fast rising band sweep – the strike-through line."""
    t = tt(dur)
    f = 900 * (12 ** (t / dur))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * .3 + bp(rng.standard_normal(len(t)), 2500, 9000) * .6
    return s * np.sin(np.pi * t / dur) ** .7 * g


def riser(dur, f0=180, mult=6, g=.08):
    t = tt(dur)
    s = np.sin(2 * np.pi * np.cumsum(f0 * mult ** (t / dur)) / SR)
    s += .5 * np.sin(2 * np.pi * np.cumsum(f0 * 1.5 * mult ** (t / dur)) / SR)
    return s * (t / dur) ** 3 * g


def crash():
    t = tt(2.2)
    n = hp(rng.standard_normal(len(t)), 4500, 2)
    return n * np.exp(-t * 2.2) * .22


def reverse_swell(notes, dur=1.0):
    s = sum(bell(m, dur) for m in notes)
    return s[::-1] * np.linspace(0, 1, len(s)) ** 1.6 * .9


def thud():
    t = tt(.25)
    f = 70 + 90 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18) * .8


# ---------------------------------------------------------------- harmony (F major, lounge-house)
CH = {
    'F': [53, 57, 60, 64, 67],      # Fmaj9
    'Dm': [50, 53, 57, 60, 64],     # Dm9
    'Bb': [50, 53, 57, 60, 62],     # Bbmaj9 (3rd inv.)
    'Gm': [53, 57, 58, 62, 65],     # Gm9
    'Am': [52, 55, 57, 60, 64],     # Am7(add9-ish)
    'C': [55, 58, 60, 65, 67],      # C9sus
}
ROOT = {'F': 41, 'Dm': 38, 'Bb': 34, 'Gm': 43, 'Am': 45, 'C': 36}
PROG = ['F', 'Dm', 'Bb', 'Gm', 'Am', 'Bb', 'F', 'C']   # one chord per bar / scene

KICKS = []


def groove(bar, kick_g=1.0, hats=1.0, clap_on=True, bassline=True, stabs=True):
    t0 = bar * BAR
    ch = PROG[bar]
    for k in range(4):
        place(kick(kick_g), t0 + bt(k), 1.0)
        KICKS.append(t0 + bt(k))
        place(hat(), t0 + bt(k) + B / 2, .34 * hats, pan=.22)
        place(shaker(), t0 + bt(k) + S16, .22 * hats, pan=-.3)
        place(shaker(), t0 + bt(k) + 3 * S16, .16 * hats, pan=-.3)
    if clap_on:
        for k in (1, 3):
            place(clap(), t0 + bt(k), .5, pan=-.04, rev=.2)
    place(hat(True), t0 + bt(3) + B / 2, .15 * hats, pan=.3, rev=.2)
    if bassline:
        r = ROOT[ch]
        for off, d, iv in ((0, .2, 0), (.75, .12, 0), (1.5, .2, 12), (2.5, .2, 7), (3.25, .12, 0), (3.5, .2, 10)):
            place(bass(r + iv, d), t0 + bt(off), 1.0)
    if stabs:
        for off in (.5, 1.75, 2.5):
            place(stab(CH[ch], .22, 1.0), t0 + bt(off), 1.0, rev=.18, bus='duck')


# pads under everything (one per bar), ducked by the kick
for i, ch in enumerate(PROG):
    place(pad(CH[ch], BAR, att=.12 if i else .02, rel=.4, bright=2400 if i != 1 else 1500), i * BAR, .9, rev=.3, bus='duck')

# ---------------------------------------------------------------- bar 1 · opener (0 – 1.875)
place(boom(1.2, .55), 0, 1.0)
place(crash(), 0, .5, rev=.2)
for k in range(4):
    place(kick(.8, 1.2), bt(k), 1.0)
    KICKS.append(bt(k))
    place(hat(), bt(k) + B / 2, .26, pan=.2)
for i, m in enumerate([65, 69, 72, 76]):
    place(epiano(m, 1.6, .9), i * .012, .85, pan=-.2 + i * .13, rev=.35)
place(epiano(79, 1.2, .6), bt(1.5), .5, pan=.35, rev=.5)
place(epiano(77, 1.2, .5), bt(2.5), .45, pan=-.35, rev=.5)
place(whoosh(.3, 500, 9000, g=.16), 1.34 - .05, 1.0, pan=-.2)                  # words exit
place(reverse_swell([72, 77, 81], .6), bt(3.5) - .6 + .02, .55)                 # portal opens
place(whoosh(.24, 200, 10000, g=.34, curve=2.2), BAR - .24, 1.0, rev=.2)  # zoom-through

# ---------------------------------------------------------------- bar 2 · "만남을 세지 않고," (sparse, half-time)
t0 = BAR
place(boom(1.6, .9), t0, 1.0, rev=.1)
place(kick(.9), t0, 1.0)
KICKS.append(t0)
place(bass(ROOT['Dm'], .6), t0, 1.0)
for k in range(8):
    place(hat(), t0 + k * B / 2 + B / 4, .14, pan=.25)
for i, m in enumerate([62, 65, 69, 72, 74]):                                    # five counted meetings
    place(marimba(m, 1.0), bt(5) + i * S16, .9, pan=-.5 + i * .25, rev=.25)
place(zip_(.16, .3), bt(6), 1.0, pan=.1, rev=.15)                                # strike-through
place(snap(), bt(6), .5, rev=.3)
place(kick(.7), bt(6), 1.0)
KICKS.append(bt(6))
place(epiano(69, 1.0, .7), bt(6), .6, rev=.35)
place(epiano(72, 1.0, .6), bt(6.5), .55, rev=.35)
place(whoosh(.25, 9000, 400, rise=False, g=.12), bt(6.5), 1.0)                  # dots merge
place(marimba(81, .8), bt(7), .7, rev=.3)                                        # the one dot
place(riser(bt(1), 220, 5, .07), bt(7), 1.0, rev=.3)
place(whoosh(bt(.5), 250, 11000, g=.3, curve=2.4), bt(7.5), 1.0, rev=.2)         # circle floods

# ---------------------------------------------------------------- bars 3–7 · groove
place(crash(), BAR * 2, .6, rev=.25)
place(boom(1.0, .6), BAR * 2, 1.0)
for bar in (2, 3, 4):
    groove(bar)
groove(5, hats=.6, stabs=False)                                                  # relationship: a little softer
groove(6)
place(crash(), BAR * 6, .55, rev=.25)
place(boom(1.4, .75), BAR * 6, 1.0, rev=.1)

# S3 · SOCIAL ×3 slide-ins + ring
for i, pan in enumerate((.6, -.6, .6)):
    place(whoosh(.18, 700, 12000, g=.14), BAR * 2 + i * S16 - .1, 1.0, pan=pan)
place(whoosh(.4, 9000, 300, rise=False, g=.15), BAR * 2 + .05, 1.0, rev=.2)
for k in (1, 2, 3):
    place(tick(2600 + 300 * k), BAR * 2 + bt(k), .25, pan=(-.4, .4, 0)[k - 1])  # outline flips
place(whoosh(.3, 400, 9000, g=.22), BAR * 3 - .3, 1.0, pan=-.2)                  # cream panel rises

# S4 · tiles pop (diagonal order), glyph spins, colour swap, tile expand
tile_times = []
for i in range(12):
    col, row = i % 4, i // 4
    tile_times.append((BAR * 3 + .06 + (col + row) * S16 * .75 + (i % 2) * .03, i))
scale = [69, 72, 74, 77, 79, 81, 84, 86, 81, 84, 88, 89]
for tp, i in sorted(tile_times):
    place(marimba(scale[i], .75), tp, .75, pan=-.6 + (i % 4) * .4, rev=.2)
place(tick(3000), BAR * 3 + bt(2), .35, rev=.2)
place(tick(3400), BAR * 3 + bt(3), .35, rev=.2)
place(epiano(84, .8, .6), BAR * 3 + bt(3), .4, pan=.3, rev=.4)
place(whoosh(.3, 300, 10000, g=.26, curve=2), BAR * 4 - .3, 1.0, rev=.15)

# S5 · stamp + connection lines
place(thud(), BAR * 4 + bt(1) + .05, .7)
place(snap(), BAR * 4 + bt(1) + .05, .35, rev=.2)
for i, m in enumerate([72, 76, 79]):
    place(marimba(m, .8), BAR * 4 + bt(1) + i * .12, .6, pan=-.4 + i * .4, rev=.3)
place(whoosh(.32, 400, 9000, g=.22), BAR * 5 - .32, 1.0, pan=.3)               # ink blinds

# S6 · six weeks tick, then the meeting
for i in range(6):
    place(tick(2400 + i * 180), bt(22) - (5 - i) * S16, .3, pan=-.5 + i * .2, rev=.15)
for i, m in enumerate([77, 81, 84, 89]):
    place(bell(m, 2.2), bt(22) + i * .03, .75, pan=-.3 + i * .2, rev=.7)
place(epiano(72, 1.6, .7), bt(22), .6, rev=.5)
place(whoosh(.25, 300, 9000, g=.3), BAR * 6 - .25, 1.0, rev=.2)                  # curtain parts
place(riser(.8, 200, 4, .05), BAR * 6 - .8, 1.0, rev=.3)

# S7 · the name: letters rise on 32nds, sphere bounces with the kick
for r in range(3):
    for c in range(6 if r == 1 else (4 if r == 0 else 5)):
        place(tick(3600 + 150 * c), BAR * 6 + r * B / 2 + c * .035, .1, pan=-.5 + c * .2)
for i, m in enumerate([65, 69, 72, 76, 79]):
    place(epiano(m, 1.8, .9), BAR * 6 + i * .01, .7, pan=-.25 + i * .12, rev=.45)
place(whoosh(.2, 9000, 600, rise=False, g=.18), BAR * 7 - .42, 1.0)             # sphere drops
place(whoosh(.2, 300, 10000, g=.3, curve=2.2), BAR * 7 - .2, 1.0, rev=.2)        # cream circle

# ---------------------------------------------------------------- bar 8 · lockup, then the loop landing
t0 = BAR * 7
place(boom(1.0, .45), t0, 1.0)
place(kick(.7), t0, 1.0)
KICKS.append(t0)
for i, m in enumerate([67, 70, 74, 77]):
    place(epiano(m, 1.8, .8), t0 + i * .015, .7, pan=-.2 + i * .13, rev=.5)
for k in range(8):
    place(hat(), t0 + k * B / 2 + B / 4, .16, pan=.25)
for i in range(10):                                                             # lockup lines
    place(tick(4200 + i * 60), t0 + .02 + i * .045, .06, pan=-.3 + i * .06)
place(whoosh(.2, 8000, 500, rise=False, g=.15), bt(30), 1.0)                    # lockup exits
for i, g in enumerate((.9, .8, .85)):                                          # RAUM / SOCIAL / CLUB. land on 16ths
    place(thud(), bt(30.5) + i * S16, g)
    place(snap(), bt(30.5) + i * S16, .25 * g, rev=.2)
place(riser(bt(1.5), 240, 4, .06), bt(30.5), 1.0, rev=.3)
place(reverse_swell([72, 77, 81, 84], .7), DUR - .7, .6)
place(whoosh(.5, 300, 9000, g=.24, curve=2), DUR - .5, 1.0, rev=.2)

# ---------------------------------------------------------------- sidechain, reverb, loop wrap, master
t_all = np.arange(NT) / SR
duck = np.ones(NT)
for b in KICKS:
    i0 = int(b * SR)
    seg = t_all[i0:] - b
    duck[i0:] *= 1 - .55 * np.exp(-seg / .11)
dry += duck_bus * duck

ir_t = np.arange(int(2.2 * SR)) / SR
irs = []
for _ in range(2):
    ir = lp(rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.0), 5500)
    ir[:int(.015 * SR)] = 0
    irs.append(ir / np.sqrt(np.sum(ir ** 2)))
wet = np.vstack([signal.fftconvolve(verb[0], irs[0])[:NT], signal.fftconvolve(verb[1], irs[1])[:NT]])
full = dry + wet * .5
full = hp(full, 30)

mix = full[:, :N].copy()
mix[:, :TAIL] += full[:, N:N + TAIL]          # seamless loop: what rings past 15 s continues at 0 s
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.4) / np.tanh(1.4)
mix *= 10 ** (-1.0 / 20)

out = pathlib.Path(__file__).parent / 'out' / 'soundtrack.wav'
out.parent.mkdir(exist_ok=True)
pcm = (np.clip(mix.T, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
b24 = np.ascontiguousarray(pcm, dtype='<i4').view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(b24)
print(out, f'{DUR}s', 'peak', float(np.max(np.abs(mix))))
