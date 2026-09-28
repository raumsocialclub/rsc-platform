"""Synthesise the 15 s ambient score for the RSC mood reel (no drums: piano, strings, candle room).

Chords change as each line of type appears; the arch opening/closing get their own swells; the
emblem lands on a resolved F major with bells.

    python3 audio.py  ->  out/soundtrack.wav   (48 kHz / 24-bit stereo)
"""
import pathlib
import wave

import numpy as np
from scipy import signal

SR = 48000
DUR = 15.0
N = int(SR * DUR)
TAIL = int(SR * 4.0)
NT = N + TAIL
rng = np.random.default_rng(1215)

dry = np.zeros((2, NT))
verb = np.zeros((2, NT))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0, rev=0.0):
    sig = np.atleast_2d(sig)
    if sig.shape[0] == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig[0] * l * 1.414, sig[0] * r * 1.414])
    i0 = int(round(at * SR))
    n = min(sig.shape[1], NT - i0)
    if n <= 0:
        return
    dry[:, i0:i0 + n] += sig[:, :n] * gain
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
def piano(m, vel=.7, dur=4.0):
    """Additive piano: stretched partials, two slightly detuned strings, hammer thump; brighter when harder."""
    t = tt(dur)
    f0 = mtof(m)
    Bi = .00035 * (1 + max(0, 60 - m) * .01)
    out = np.zeros_like(t)
    bright = .55 + .6 * vel
    for n in range(1, 14):
        fn = f0 * n * np.sqrt(1 + Bi * n * n)
        if fn > 12000:
            break
        amp = (1 / n ** 1.25) * (bright ** (n - 1) if n > 1 else 1)
        dec = (.9 + .05 * f0 / 100) * (1 + .55 * (n - 1))
        for det in (-.6, .6):
            out += amp * np.sin(2 * np.pi * fn * (1 + det / 1200 * (1 + .1 * n)) * t + rng.uniform(0, 6.28)) * np.exp(-t * dec)
    # two-stage decay: prompt then aftersound
    out *= (.65 * np.exp(-t * 2.2) + .35)
    thump = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 60) * .08
    env = np.minimum(t / .0025, 1) * np.clip(1 - (t - (dur - .4)) / .4, 0, 1)
    return (out * .16 + thump) * env * vel


def roll(notes, at, vel=.6, spread=.055, dur=4.5, pan0=-.35, pan1=.35, rev=.5, g=1.0):
    for i, m in enumerate(notes):
        k = i / max(len(notes) - 1, 1)
        place(piano(m, vel * (.85 + .3 * rng.uniform()), dur), at + i * spread + rng.uniform(0, .012),
              g, pan=pan0 + (pan1 - pan0) * k, rev=rev)


def strings(notes, dur, att=1.2, rel=1.5, bright=1800, g=1.0):
    """Slow ensemble: detuned saws, gentle vibrato, low-passed."""
    t = tt(dur + rel)
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for m in notes:
        for k, cents in enumerate((-7, -2, 3, 8)):
            f = mtof(m) * 2 ** (cents / 1200)
            vib = 1 + .0025 * np.sin(2 * np.pi * (4.6 + .3 * k) * t + rng.uniform(0, 6.28))
            ph = np.cumsum(f * vib) / SR + rng.uniform()
            saw = 2 * (ph % 1) - 1
            (L if k % 2 == 0 else R)[:] += saw
    e = np.clip(t / att, 0, 1) ** 1.6 * (1 - np.clip((t - dur) / rel, 0, 1))
    g0 = .018 * g / max(len(notes), 1) ** .5
    return np.vstack([lp(lp(L, bright), bright * 1.3), lp(lp(R, bright), bright * 1.3)]) * e * g0


def sub(m, dur, att=1.0, rel=1.5, g=1.0):
    t = tt(dur + rel)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .2 * np.sin(2 * np.pi * 2 * f * t)
    e = np.clip(t / att, 0, 1) ** 2 * (1 - np.clip((t - dur) / rel, 0, 1))
    return s * e * .16 * g


def bell(m, dur=4.0, g=1.0):
    t = tt(dur)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * f * 2.756 * t) * np.exp(-t * 2.5) \
        + .22 * np.sin(2 * np.pi * f * 5.404 * t) * np.exp(-t * 5) + .1 * np.sin(2 * np.pi * f * 8.93 * t) * np.exp(-t * 9)
    return s * np.minimum(t / .002, 1) * np.exp(-t * 1.1) * .14 * g


def glass_swell(m, dur, g=1.0):
    """Bowed-glass shimmer that grows (for the arch line drawing)."""
    t = tt(dur)
    f = mtof(m)
    s = sum(np.sin(2 * np.pi * f * h * t + rng.uniform(0, 6.28)) / h ** 1.5 for h in (1, 2, 3, 4.2))
    trem = 1 + .15 * np.sin(2 * np.pi * 5.5 * t)
    return s * (t / dur) ** 1.8 * trem * .05 * g


def air(dur, f0=300, f1=5000, g=.1, rise=True):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    y = sweep_lp(n, f0, f1, 1.5) if rise else sweep_lp(n, f1, f0, .7)
    p = t / dur
    e = np.sin(np.pi * p) ** 1.5 if rise else (1 - p) ** 1.2 * np.minimum(p / .1, 1)
    return y * e * g


def crackle(dur, density=9, g=.05):
    """Candle / wick: sparse soft clicks over a faint warm hiss."""
    n = int(dur * SR)
    out = lp(rng.standard_normal(n), 2500) * .04
    for _ in range(int(dur * density)):
        i = rng.integers(0, n - 2000)
        ln = rng.integers(60, 600)
        click = hp(rng.standard_normal(ln), 1500) * np.exp(-np.arange(ln) / (ln / 5)) * rng.uniform(.2, 1)
        out[i:i + ln] += click
    return out * g


# ---------------------------------------------------------------- score
F3 = 53
CH = {
    'F':  [41, 53, 60, 64, 67, 69],          # Fmaj9 (F2 F3 C4 E4 G4 A4)
    'Am': [45, 52, 59, 60, 64, 67],          # Am9
    'Bb': [46, 53, 57, 60, 62, 65],          # Bbmaj9
    'Csus': [48, 55, 58, 62, 65, 67],        # C9sus4
    'Fend': [29, 41, 48, 57, 64, 67, 69, 72],
}

# room: candle crackle + warm air bed across the whole piece
place(np.vstack([crackle(DUR + 2, 8, .05), crackle(DUR + 2, 8, .05)]), 0, 1.0, rev=.15)

# 0.0–1.5  arch line draws in the dark
place(sub(29, 3.2, att=1.4, rel=2.0, g=.9), 0.0, 1.0)
place(glass_swell(81, 1.45), 0.05, 1.0, pan=-.2, rev=.7)
place(glass_swell(88, 1.45, .6), 0.08, 1.0, pan=.25, rev=.7)
# 1.0  "아름다운 공간에서,"
roll(CH['F'], 1.0, vel=.55, spread=.07, dur=5.0)
place(strings([53, 60, 64, 69], 3.4, att=1.4, rel=1.6), 1.0, 1.0, rev=.4)
place(air(1.3, 200, 3500, .07), 1.55, 1.0, rev=.4)                    # the window opens
for t, m, v in ((2.05, 84, .45), (2.75, 81, .42), (3.35, 79, .38)):  # C6 A5 G5
    place(piano(m, v, 4.0), t, .9, pan=.25, rev=.6)

# 4.15  "서로의 특별함을"
roll(CH['Am'], 4.15, vel=.52, spread=.065, dur=5.0)
place(strings([52, 59, 64, 67], 3.2, att=1.0, rel=1.6), 4.1, 1.0, rev=.4)
place(sub(33, 3.0, att=.8, rel=1.5, g=.7), 4.1, 1.0)
for t, m, v in ((4.95, 76, .42), (5.6, 74, .38), (6.35, 72, .4)):    # E5 D5 C5
    place(piano(m, v, 4.0), t, .9, pan=-.2, rev=.6)

# 7.6  "발견하는 곳."
roll(CH['Bb'], 7.6, vel=.55, spread=.065, dur=5.0)
place(strings([53, 57, 62, 65], 3.2, att=1.0, rel=1.6), 7.55, 1.0, rev=.4)
place(sub(34, 3.0, att=.8, rel=1.5, g=.7), 7.55, 1.0)
for t, m, v in ((8.35, 74, .4), (9.0, 77, .44), (9.75, 81, .46)):    # D5 F5 A5 – lifting
    place(piano(m, v, 4.0), t, .9, pan=.2, rev=.6)

# 10.55 "A private community for remarkable singles."
roll(CH['Csus'], 10.55, vel=.5, spread=.07, dur=4.5)
place(strings([55, 58, 62, 65, 67], 2.4, att=.9, rel=1.2, bright=2200), 10.5, 1.0, rev=.45)
place(sub(36, 2.2, att=.8, rel=1.0, g=.7), 10.5, 1.0)
for t, m, v in ((11.3, 79, .4), (11.95, 77, .36)):                  # G5 F5
    place(piano(m, v, 4.0), t, .9, pan=-.15, rev=.6)

# 12.6–13.9 the frame closes into the arch window
place(air(1.4, 5000, 250, .08, rise=False), 12.55, 1.0, rev=.5)
rev_sw = sum(bell(m, 1.3) for m in (79, 84, 88))[::-1] * np.linspace(0, 1, int(1.3 * SR)) ** 2
place(rev_sw, 13.35 - 1.3, .8, rev=.4)
# 13.35 emblem – resolution
roll(CH['Fend'], 13.35, vel=.62, spread=.045, dur=6.0, pan0=-.45, pan1=.45, rev=.55)
place(strings([53, 60, 64, 69, 72], 3.0, att=.5, rel=2.5, bright=2400, g=1.2), 13.3, 1.0, rev=.5)
place(sub(29, 2.5, att=.3, rel=2.5, g=1.0), 13.33, 1.0)
for i, m in enumerate((84, 88, 91, 96)):                             # C6 E6 G6 C7 – the sweep of light
    place(bell(m, 4.0, .9), 13.4 + .16 * i + (.55 if i == 3 else 0), .8, pan=-.4 + i * .27, rev=.8)

# ---------------------------------------------------------------- reverb (long hall), loop wrap, master
ir_t = np.arange(int(4.0 * SR)) / SR
irs = []
for _ in range(2):
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 1.5)
    ir = lp(ir, 4200)
    ir[:int(.025 * SR)] = 0
    irs.append(ir / np.sqrt(np.sum(ir ** 2)))
wet = np.vstack([signal.fftconvolve(verb[0], irs[0])[:NT], signal.fftconvolve(verb[1], irs[1])[:NT]])
full = hp(dry + wet * .7, 25)

mix = full[:, :N].copy()
mix[:, :TAIL] += full[:, N:N + TAIL] * .7          # the last chord's hall rings on into the loop's opening
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.15) / np.tanh(1.15)
mix *= 10 ** (-1.5 / 20)

out = pathlib.Path(__file__).parent / 'out' / 'soundtrack.wav'
out.parent.mkdir(exist_ok=True)
pcm = (np.clip(mix.T, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
b24 = np.ascontiguousarray(pcm, dtype='<i4').view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(b24)
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)))
print(out, f'{DUR}s', 'peak', round(float(np.max(np.abs(mix))), 3), 'rms dB', round(float(rms), 1))
