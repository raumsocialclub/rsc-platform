"""Synthesise the 15s soundtrack for the RSC showreel (120 BPM, cut points match index.html).

    python3 audio.py  ->  out/soundtrack.wav   (48 kHz / 24-bit stereo)
"""
import pathlib
import wave

import numpy as np
from scipy import signal

SR = 48000
DUR = 15.0
N = int(SR * DUR)
BEAT = 0.5  # 120 BPM
rng = np.random.default_rng(11)

dry = np.zeros((2, N))
verb = np.zeros((2, N))
duck_bus = np.zeros((2, N))  # pads / keys that pump against the kick


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0, rev=0.0, bus=None):
    """Add a mono or stereo signal at time `at` (s)."""
    sig = np.atleast_2d(sig)
    if sig.shape[0] == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig[0] * l * 1.414, sig[0] * r * 1.414])
    i0 = int(round(at * SR))
    if i0 < 0:
        sig, i0 = sig[:, -i0:], 0
    n = min(sig.shape[1], N - i0)
    if n <= 0:
        return
    target = duck_bus if bus == 'duck' else dry
    target[:, i0:i0 + n] += sig[:, :n] * gain
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
    """Low-pass whose cutoff glides f0 -> f1 (block-wise, state carried)."""
    out = np.zeros_like(x)
    blk = 256
    zi = None
    nb = int(np.ceil(len(x) / blk))
    for k in range(nb):
        p = (k / max(nb - 1, 1)) ** curve
        fc = f0 * (f1 / f0) ** p
        b, a = signal.butter(2, min(fc, SR / 2 * .95) / (SR / 2), 'low')
        if zi is None:
            zi = signal.lfilter_zi(b, a) * 0
        seg = x[k * blk:(k + 1) * blk]
        out[k * blk:k * blk + len(seg)], zi = signal.lfilter(b, a, seg, zi=zi)
    return out


def env_adsr(n, a=.005, d=.1, s=.6, r=.2, hold=None):
    t = np.arange(n) / SR
    hold = hold if hold is not None else n / SR - r
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((t - hold) / r, 0, 1)
    return e * (1 - rel)


# ---------------------------------------------------------------- instruments
def kick(soft=1.0):
    t = tt(.55)
    f = 44 + 100 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 400) * .12
    return np.tanh(1.6 * (body + click)) * soft


def clap():
    t = tt(.35)
    n = bp(rng.standard_normal(len(t)), 900, 5200)
    e = np.zeros_like(t)
    for off in (0, .009, .018):
        e += (t >= off) * np.exp(-np.clip(t - off, 0, None) * 180) * .5
    e += (t >= .024) * np.exp(-np.clip(t - .024, 0, None) * 22)
    return n * e * .6


def hat(open_=False):
    t = tt(.4 if open_ else .08)
    n = hp(rng.standard_normal(len(t)), 7500, 3)
    return n * np.exp(-t * (9 if open_ else 70)) * .5


def tick():
    t = tt(.09)
    return (np.sin(2 * np.pi * 3150 * t) * .7 + np.sin(2 * np.pi * 5230 * t) * .3) * np.exp(-t * 85)


def epiano(m, dur=1.6, vel=1.0):
    """Two-operator FM electric piano."""
    t = tt(dur)
    f = mtof(m)
    idx = 1.6 * np.exp(-t * 5) + .25
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 26) * .12
    e = np.minimum(t / .003, 1) * np.exp(-t * (1.6 + f / 900))
    return (car + tine) * e * vel * .32


def bell(m, dur=3.2):
    t = tt(dur)
    f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
         + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6))
    return s * np.minimum(t / .002, 1) * np.exp(-t * 1.4) * .2


def pad(notes, dur, att=.6, rel=.9, bright=2600, detune=.11):
    t = tt(dur + rel)
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for m in notes:
        for k, cents in enumerate((-detune * 100, 0, detune * 100)):
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
    trem = 1 + .06 * np.sin(2 * np.pi * .35 * t)
    g = .06 / max(len(notes), 1) ** .5
    return np.vstack([lp(L, bright * .8), lp(R, bright * .8)]) * e * trem * g


def bass(m, dur):
    t = tt(dur + .05)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t) + .08 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(t / .006, 1) * np.exp(-t * 2.2) * (1 - np.clip((t - dur) / .05, 0, 1))
    return np.tanh(1.3 * s) * e * .42


def boom(dur=2.2, gain=1.0):
    t = tt(dur)
    f = 30 + 55 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    thump = lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 18) * .8
    return np.tanh(1.4 * (s + thump)) * gain


def whoosh(dur, f0=300, f1=9000, rise=True, gain=.3, curve=1.6):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    y = sweep_lp(n, f0, f1, curve) if rise else sweep_lp(n, f1, f0, 1 / curve)
    p = t / dur
    e = (p ** 2.2 if rise else (1 - p) ** 1.5 * np.minimum(p / .05, 1))
    return y * e * gain


def reverse_swell(notes, dur=1.2):
    s = sum(bell(m, dur) for m in notes)
    s = s + np.convolve(s, np.exp(-np.arange(int(.4 * SR)) / SR * 6) * rng.standard_normal(int(.4 * SR)) * .02, 'same')
    s = s[::-1] * np.linspace(0, 1, len(s)) ** 1.5
    return s * .8


# ---------------------------------------------------------------- harmony
CHORDS = {
    'Fmaj9': [53, 57, 60, 64, 67],
    'Dm9': [50, 53, 57, 60, 64],
    'Bbmaj9': [50, 53, 57, 60, 62],
    'Gm9': [53, 57, 58, 62, 65],
    'C9sus': [58, 62, 65, 67, 70],
    'Fmaj9hi': [57, 60, 64, 67, 72],
}
ROOT = {'Fmaj9': 29, 'Dm9': 38, 'Bbmaj9': 34, 'Gm9': 31, 'C9sus': 36}

# pads (section by section)
place(pad(CHORDS['Fmaj9'], 4.0, att=1.4, bright=1800), 0.0, 1.0, rev=.35, bus='duck')
place(pad(CHORDS['Dm9'], 2.0, att=.08), 4.0, 1.0, rev=.25, bus='duck')
place(pad(CHORDS['Bbmaj9'], 2.0, att=.08), 6.0, 1.0, rev=.25, bus='duck')
place(pad(CHORDS['Gm9'], 2.0, att=.08), 8.0, 1.0, rev=.25, bus='duck')
place(pad(CHORDS['C9sus'], 2.0, att=.3, bright=2200), 10.0, 1.1, rev=.5, bus='duck')
place(pad(CHORDS['Fmaj9hi'] + [41], 2.6, att=.02, rel=.5, bright=3200), 12.0, 1.3, rev=.6)

# ---------------------------------------------------------------- 0–2 s  intro: arch draws
for i, m in enumerate([69, 72, 76, 79]):           # A4 C5 E5 G5 rising with the gold line
    place(epiano(m, 2.0, .7), .12 + i * .25, .9, pan=-.3 + i * .2, rev=.55)
place(bell(84, 2.5), 1.12, .45, pan=.25, rev=.7)
place(whoosh(.5, 200, 7000, gain=.28), 1.5, 1.0, rev=.3)          # zoom through the arch
place(reverse_swell([72, 76, 79], 1.0), 1.0, .5, rev=.2)
place(boom(1.8, .8), 2.0, .9, rev=.15)
place(hat(True), 2.0, .25, pan=.2, rev=.3)

# ---------------------------------------------------------------- 2–4 s  headline
for i, m in enumerate([65, 69, 72, 76]):
    place(epiano(m, 1.4, .55), 2.0 + i * .02, .7, pan=-.2 + i * .12, rev=.4)
for b in (2.0, 3.0):
    place(kick(.55), b, .8)
for k in range(7):
    place(hat(), 2.25 + k * .25, .18 if k % 2 == 0 else .09, pan=.3, rev=.1)
place(whoosh(.25, 400, 9000, gain=.22), 3.75, 1.0)

# ---------------------------------------------------------------- 4–10.5 s  groove
bass_pat = [(0, .4), (.75, .2), (1.25, .2), (1.5, .45)]
for bar_start, ch in ((4.0, 'Dm9'), (6.0, 'Bbmaj9'), (8.0, 'Gm9')):
    r = ROOT[ch]
    for off, d in bass_pat:
        m = r + (12 if off == 1.25 else 7 if off == 1.5 else 0)
        place(bass(m, d), bar_start + off, 1.0)
place(bass(ROOT['C9sus'], .4), 10.0, 1.0)
place(bass(ROOT['C9sus'] + 7, .2), 10.25, .9)

KICKS = [4.0 + k * BEAT for k in range(13)]           # 4.0 .. 10.0
for b in KICKS:
    place(kick(), b, 1.0)
for b in KICKS:
    if round((b - 4.0) / BEAT) % 2 == 1:
        place(clap(), b, .55, pan=-.05, rev=.25)
for k in range(13):
    place(hat(), 4.25 + k * BEAT, .32, pan=.25)
    if k % 4 == 3:
        place(hat(True), 4.25 + k * BEAT, .18, pan=.3, rev=.2)
for k in range(20):                                     # ghost 16ths
    place(hat(), 4.125 + k * .25, .05, pan=-.25)

# cut accents: keys on each category cut
for b, m in zip([4.0, 4.5, 5.0, 5.5, 6.0, 6.5], [74, 77, 81, 84, 82, 86]):
    place(epiano(m, 1.0, .9), b, .8, pan=(-.35 if int(b * 2) % 2 else .35), rev=.35, bus='duck')
    place(whoosh(.14, 800, 12000, gain=.14), b - .14, 1.0, pan=(.4 if int(b * 2) % 2 else -.4))
place(whoosh(.3, 9000, 400, rise=False, gain=.18), 5.0, 1.0)          # into WELLNESS type
place(boom(.8, .35), 6.5, 1.0)                                         # TALK zoom-cut punch

# triptych arches
for b, ms in ((7.0, [70, 74, 77]), (7.5, [69, 74, 77]), (8.0, [70, 74, 79])):
    for i, m in enumerate(ms):
        place(bell(m + 12, 1.4), b + i * .012, .7, pan=-.3 + i * .3, rev=.5, bus='duck')
place(whoosh(.4, 200, 9000, gain=.3), 8.6, 1.0, rev=.25)             # zoom-through
place(boom(1.2, .55), 9.0, .9)
place(hat(True), 9.0, .35, rev=.4)

# RAUM SOLO ticker ticks + 16ths
for i in range(7):
    place(tick(), 9.25 + i * .1875, .38, pan=-.6 + i * .2, rev=.2)
for k in range(6):
    place(hat(), 9.125 + k * .25, .12, pan=-.3)
place(epiano(79, 1.2, .8), 9.0, .7, rev=.4)
place(epiano(74, 1.2, .8), 9.0, .6, rev=.4)

# ---------------------------------------------------------------- 10.5 curtain split + breakdown
place(np.vstack([whoosh(.45, 300, 6000, rise=False, gain=.3), np.zeros(int(.45 * SR))]), 10.42, 1.0)
place(np.vstack([np.zeros(int(.45 * SR)), whoosh(.45, 300, 6000, rise=False, gain=.3)]), 10.46, 1.0)
place(epiano(79, 2.0, .6), 10.6, .6, pan=.2, rev=.7)
place(epiano(77, 2.0, .5), 11.1, .5, pan=-.2, rev=.7)
riser_t = tt(1.4)
riser = np.sin(2 * np.pi * np.cumsum(180 * (6 ** (riser_t / 1.4))) / SR) * (riser_t / 1.4) ** 3 * .08
place(riser, 10.6, 1.0, rev=.4)
place(whoosh(1.4, 150, 8000, gain=.26, curve=2.4), 10.6, 1.0, rev=.4)
place(reverse_swell([72, 76, 79, 84], 1.3), 10.7, .7)

# ---------------------------------------------------------------- 12.0 logo
place(boom(3.0, 1.0), 12.0, 1.0, rev=.2)
for i, m in enumerate([77, 81, 84, 88, 91]):
    place(bell(m, 3.0), 12.0 + i * .045, .8, pan=-.5 + i * .25, rev=.8)
for i, m in enumerate([65, 69, 72, 76]):
    place(epiano(m, 3.0, .8), 12.0 + i * .01, .8, pan=-.2 + i * .13, rev=.5)
place(epiano(84, 2.0, .45), 13.05, .55, pan=.3, rev=.8)     # sheen on the emblem
place(epiano(79, 2.0, .4), 13.45, .45, pan=-.3, rev=.8)

# ---------------------------------------------------------------- sidechain + reverb + master
t_all = np.arange(N) / SR
duck = np.ones(N)
for b in KICKS:
    m = t_all >= b
    duck[m] *= 1 - .5 * np.exp(-(t_all[m] - b) / .12)
dry += duck_bus * duck

ir_t = np.arange(int(2.6 * SR)) / SR
irs = []
for _ in range(2):
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6)
    ir = lp(ir, 5200)
    ir[:int(.018 * SR)] = 0
    irs.append(ir / np.sqrt(np.sum(ir ** 2)))
wet = np.vstack([signal.fftconvolve(verb[0], irs[0])[:N],
                 signal.fftconvolve(verb[1], irs[1])[:N]])
mix = dry + wet * .55

mix = hp(mix, 28)
fade = np.clip((DUR - t_all) / .7, 0, 1) ** 1.5
fade *= np.clip(t_all / .01, 0, 1)
mix *= fade
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
print(out, f'{DUR}s', 'peak', float(np.max(np.abs(mix))))
