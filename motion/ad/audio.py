"""Synthesise the 15 s score for the RSC ad reel (96 BPM lounge groove, 6 bars = 15.0 s).

Hits line up with index.html: window pass 3.125 s, table 5.0 s, toast 7.5 s (glass clink ~8.3 s),
end card 10.0 s, PREVIEW tap 13.75 s.

    python3 audio.py  ->  out/soundtrack.wav   (48 kHz / 24-bit stereo)
"""
import pathlib
import wave

import numpy as np
from scipy import signal

SR = 48000
DUR = 15.0
N = int(SR * DUR)
TAIL = int(SR * 2.5)
NT = N + TAIL
B = 60 / 96
BAR = 4 * B
S16 = B / 4
rng = np.random.default_rng(96)

dry = np.zeros((2, NT))
verb = np.zeros((2, NT))
duck_bus = np.zeros((2, NT))
KICKS = []


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
def kick(g=1.0):
    t = tt(.45)
    f = 48 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 450) * .12
    return np.tanh(1.7 * (body + click)) * g


def snare():
    t = tt(.32)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * .5
    n = bp(rng.standard_normal(len(t)), 1200, 7500) * np.exp(-t * 16)
    return (tone + n) * .5


def rim():
    t = tt(.06)
    return (np.sin(2 * np.pi * 1700 * t) + bp(rng.standard_normal(len(t)), 2000, 6000) * .5) * np.exp(-t * 90) * .35


def hat(open_=False):
    t = tt(.3 if open_ else .05)
    return hp(rng.standard_normal(len(t)), 8200, 3) * np.exp(-t * (11 if open_ else 95)) * .42


def epiano(m, dur=1.6, vel=1.0):
    t = tt(dur)
    f = mtof(m)
    idx = 1.4 * np.exp(-t * 4.5) + .3
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 24) * .1
    trem = 1 + .12 * np.sin(2 * np.pi * 4.8 * t)
    return (car + tine) * np.minimum(t / .003, 1) * np.exp(-t * (1.3 + f / 1000)) * trem * vel * .28


def chord(notes, at, dur=1.6, vel=.8, spread=.012, rev=.3):
    for i, m in enumerate(notes):
        place(epiano(m, dur, vel), at + i * spread, .8, pan=-.3 + .6 * i / max(len(notes) - 1, 1), rev=rev, bus='duck')


def bass(m, dur, g=1.0):
    t = tt(dur + .04)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t) + .08 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(t / .006, 1) * np.exp(-t * 2.0) * np.clip(1 - (t - dur) / .04, 0, 1)
    return np.tanh(1.4 * s) * e * .4 * g


def pad(notes, dur, att=.4, rel=.8, bright=2200):
    t = tt(dur + rel)
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for m in notes:
        for k, c in enumerate((-9, 0, 9)):
            f = mtof(m) * 2 ** (c / 1200)
            ph = (f * t + rng.uniform()) % 1
            v = 2 * ph - 1
            if k == 0:
                L += v
            elif k == 2:
                R += v
            else:
                L += .7 * v
                R += .7 * v
    e = np.clip(t / att, 0, 1) ** 2 * (1 - np.clip((t - dur) / rel, 0, 1))
    g = .02 / max(len(notes), 1) ** .5
    return np.vstack([lp(lp(L, bright), bright), lp(lp(R, bright), bright)]) * e * g


def whoosh(dur, f0=300, f1=10000, g=.3, curve=1.8):
    t = tt(dur)
    y = sweep_lp(rng.standard_normal(len(t)), f0, f1, curve)
    return y * (t / dur) ** 2.2 * g


def whoosh_out(dur, f1=9000, f0=300, g=.25):
    t = tt(dur)
    y = sweep_lp(rng.standard_normal(len(t)), f1, f0, .6)
    p = t / dur
    return y * (1 - p) ** 1.6 * np.minimum(p / .04, 1) * g


def boom(dur=1.4, g=1.0):
    t = tt(dur)
    f = 34 + 60 * np.exp(-t * 11)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.8)
    thump = lp(rng.standard_normal(len(t)), 240) * np.exp(-t * 22) * .7
    return np.tanh(1.3 * (s + thump)) * g


def clink(g=1.0):
    """Two wine glasses: inharmonic bright partials, a little beating, long ring."""
    t = tt(2.6)
    out = np.zeros_like(t)
    for f, a, d in ((2380, 1, 2.2), (2412, .8, 2.4), (5860, .45, 5), (6010, .3, 6), (9750, .18, 11), (3510, .25, 3.5)):
        out += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * d)
    tick = hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 300) * .5
    return (out * .09 + tick * .15) * np.minimum(t / .0008, 1) * g


def pop(f=1400, g=1.0):
    t = tt(.08)
    fr = f * (1 + .6 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 55) * .22 * g


def tap():
    t = tt(.12)
    return (np.sin(2 * np.pi * 900 * t) * np.exp(-t * 70) + hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 250) * .4) * .35


def chime(notes, at):
    for i, m in enumerate(notes):
        t = tt(2.5)
        f = mtof(m)
        s = (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)) * np.exp(-t * 1.6) * .14
        place(s * np.minimum(t / .002, 1), at + i * .07, .9, pan=-.3 + .3 * i, rev=.6)


def riser(dur, g=.06):
    t = tt(dur)
    s = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (t / dur)) / SR) + .4 * np.sin(2 * np.pi * np.cumsum(330 * 4 ** (t / dur)) / SR)
    return s * (t / dur) ** 3 * g


# ---------------------------------------------------------------- harmony: Dbmaj9 → Bbm9 → Gbmaj9 → Ab13sus (warm, late-night)
CH = {'Db': [49, 56, 60, 63, 65], 'Bbm': [46, 53, 56, 60, 61], 'Gb': [54, 58, 61, 65, 68], 'Ab': [56, 61, 63, 66, 70]}
ROOT = {'Db': 37, 'Bbm': 34, 'Gb': 30, 'Ab': 32}
PROG = ['Db', 'Bbm', 'Gb', 'Ab', 'Db', 'Ab']        # one per bar (2.5 s)

# pads everywhere
for i, ch in enumerate(PROG):
    place(pad(CH[ch], BAR, att=.3 if i else 1.2, rel=.5, bright=1500 if i == 0 else 2400), i * BAR, .9, rev=.3, bus='duck')

# bar 1 (0–2.5): exterior – filtered intro, rim + hats, e-piano stabs; riser into the window
for k in range(4):
    place(hat(), k * B + B / 2, .16, pan=.25)
    if k % 2:
        place(rim(), k * B, .45, pan=-.2, rev=.2)
chord(CH['Db'], 0.02, 2.4, .7, rev=.45)
place(kick(.7), 0, 1.0); KICKS.append(0)
place(epiano(72, 1.2, .6), 1.5 * B, .5, pan=.3, rev=.5)
place(riser(1.2, .06), 1.95, 1.0, rev=.3)
place(whoosh(.62, 200, 11000, .34, 2.2), 3.125 - .62, 1.0, rev=.2)              # through the glass

# full groove from the window pass (3.125 = beat 5) to the end card
def groove(t0, t1, hats=1.0):
    k = 0
    while t0 + k * B < t1 - 1e-6:
        tb = t0 + k * B
        beat = round(tb / B)
        place(kick(), tb, 1.0); KICKS.append(tb)
        if beat % 2 == 1:
            place(snare(), tb, .55, rev=.18)
        place(hat(), tb + B / 2, .3 * hats, pan=.22)
        place(hat(), tb + 3 * S16, .1 * hats, pan=-.25)
        k += 1


groove(3.125, 9.375)
# bass: follows the bar chords, syncopated
for bar in range(1, 4):
    r = ROOT[PROG[bar]]
    for off, d, iv in ((0, .3, 0), (.75, .15, 12), (1.5, .3, 7), (2.5, .25, 0), (3.25, .15, 10), (3.5, .3, 12)):
        tb = bar * BAR + off * B
        if 3.1 <= tb < 9.4:
            place(bass(r + iv, d), tb, 1.0)
place(bass(ROOT['Bbm'], .3), 3.125, 1.0)
# chord hits on the scene arrivals
chord(CH['Bbm'], 3.125, 1.8, .85)
place(boom(1.2, .55), 3.125, 1.0)
place(hat(True), 3.125, .3, rev=.3)
place(whoosh(.5, 250, 10000, .3, 2.2), 5.0 - .5, 1.0, pan=-.2, rev=.2)          # into the table
chord(CH['Gb'], 5.0, 1.8, .85)
place(epiano(77, 1.4, .6), 5.0 + 1.5 * B, .5, pan=.35, rev=.5)
place(whoosh(.55, 250, 10000, .32, 2.2), 7.5 - .55, 1.0, pan=.2, rev=.2)         # into the glass → the toast
chord(CH['Ab'], 7.5, 1.8, .9)
place(clink(1.0), 8.3, 1.0, pan=.1, rev=.45)                                    # glasses meet (glint)
place(clink(.6), 8.33, 1.0, pan=-.25, rev=.45)
# break before the card
place(whoosh_out(.5, 9000, 300, .18), 9.4, 1.0)
place(riser(.6, .05), 9.4, 1.0, rev=.3)
place(whoosh(.35, 300, 9000, .28, 2), 10.0 - .35, 1.0, rev=.2)

# end card (10.0–15.0): groove returns lighter, UI pops, the tap
place(boom(1.6, .8), 10.0, 1.0, rev=.15)
place(hat(True), 10.0, .3, rev=.3)
chord(CH['Db'], 10.0, 2.4, .9, rev=.45)
groove(10.0, 15.0, hats=.8)
for bar, ch in ((4, 'Db'), (5, 'Ab')):
    r = ROOT[ch]
    for off, d, iv in ((0, .3, 0), (.75, .15, 12), (1.5, .3, 7), (2.5, .25, 0), (3.5, .3, 12)):
        place(bass(r + iv, d), bar * BAR + off * B, 1.0)
for i in range(10):                                                              # UI rows pop in
    place(pop(1200 + i * 90, .8), 11.05 + i * .11, 1.0, pan=-.3 + i * .06)
place(whoosh(.4, 400, 7000, .16), 10.55, 1.0)                                   # phone slides up
place(tap(), 13.75, 1.0)
chime([80, 84, 87], 13.78)
chord(CH['Ab'], 12.5, 2.4, .8, rev=.45)

# ---------------------------------------------------------------- sidechain, reverb, master
t_all = np.arange(NT) / SR
duck = np.ones(NT)
for b in KICKS:
    i0 = int(b * SR)
    duck[i0:] *= 1 - .45 * np.exp(-(t_all[i0:] - b) / .12)
dry += duck_bus * duck
ir_t = np.arange(int(2.4 * SR)) / SR
irs = []
for _ in range(2):
    ir = lp(rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6), 5000)
    ir[:int(.018 * SR)] = 0
    irs.append(ir / np.sqrt(np.sum(ir ** 2)))
wet = np.vstack([signal.fftconvolve(verb[0], irs[0])[:NT], signal.fftconvolve(verb[1], irs[1])[:NT]])
mix = hp(dry + wet * .5, 30)[:, :N]
fade = np.clip((DUR - t_all[:N]) / .35, 0, 1)
mix = mix * fade
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.35) / np.tanh(1.35)
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
print(out, f'{DUR}s', 'peak', round(float(np.max(np.abs(mix))), 3), 'rms dB', round(float(20 * np.log10(np.sqrt(np.mean(mix ** 2)))), 1))
