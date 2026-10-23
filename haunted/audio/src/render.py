# Hollow Manor soundscapes. For each level (2-20) renders
#   levelN_bed.mp3 - a seamless 42 s ambience loop: noise beds, pads, steady pulses and a few distant events, through reverb
#   levelN_fx.mp3  - one-shot effects in 5 s slots; the game fires a random slot now and then at a random pan
# Everything is synthesized here (numpy + pedalboard), loudness-matched, and encoded with ffmpeg.
# usage: python render.py [level ...]  (no args = all)
import os, sys, glob, shutil, subprocess
import numpy as np, scipy.signal as sg, soundfile as sf
from pedalboard import Pedalboard, Reverb, Delay, Chorus

SR = 44100; L = 42.0; N = int(SR * L); F = int(SR * 3); SLOT = 8.0   # engine.js FX_SLOT must match
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'star-dash', 'haunted', 'audio')
TMP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tmp')
FFMPEG = shutil.which('ffmpeg') or (glob.glob(os.path.expanduser('~/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/*/bin/ffmpeg.exe')) or ['ffmpeg'])[0]
rng = np.random.default_rng(7)

# ---------------- basics ----------------
def T(d): return np.arange(int(SR * d)) / SR
def white(n): return rng.standard_normal(n)
def brown(n):
    x = np.cumsum(rng.standard_normal(n)); x = sg.sosfilt(sg.butter(1, 15, 'hp', fs=SR, output='sos'), x)
    return x / (np.abs(x).max() + 1e-9)
def pink(n):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); f[0] = 1; X /= np.sqrt(f)
    x = np.fft.irfft(X, n); return x / (np.abs(x).max() + 1e-9)
def bp(x, lo, hi, o=2): return sg.sosfilt(sg.butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sg.sosfilt(sg.butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sg.sosfilt(sg.butter(o, f, 'highpass', fs=SR, output='sos'), x)
def reson(x, f, q=20): b, a = sg.iirpeak(f, q, fs=SR); return sg.lfilter(b, a, x)
def nrm(x, peak=1.0): return x * (peak / (np.abs(x).max() + 1e-9))
def env(n, a=.01, r=.2, hold=None):
    """attack / release envelope over n samples (release ends at n)"""
    e = np.ones(n); na = max(1, int(SR * a)); nr = max(1, int(SR * r))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e
def dec(n, tau): return np.exp(-np.arange(n) / SR / tau)
def slow(n, rate, lo=0., hi=1., seed=None):
    """smooth random wander between lo and hi, about `rate` changes per second"""
    r = np.random.default_rng(seed if seed is not None else int(rng.integers(10 ** 9)))
    k = max(4, int(n / SR * rate) + 4); pts = r.random(k)
    x = np.interp(np.linspace(0, k - 3, n), np.arange(k), pts)
    x = sg.sosfiltfilt(sg.butter(1, max(rate, .05), 'lp', fs=SR, output='sos'), x)
    x = (x - x.min()) / (np.ptp(x) + 1e-9); return lo + (hi - lo) * x
def osc(freq, n, shape='sine'):
    """freq: scalar or per-sample array"""
    ph = 2 * np.pi * np.cumsum(np.broadcast_to(freq, (n,)).astype(float)) / SR
    if shape == 'sine': return np.sin(ph)
    if shape == 'saw': return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if shape == 'square': return np.sign(np.sin(ph))
    if shape == 'tri': return 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1) - 1) - 1
def pan2(x, p=0.):
    a = (p + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)], 1)
def st(f, s): return f * 2 ** (s / 12)
def vib(n, f, rate=5.5, depth=.006, delay=.3):
    t = np.arange(n) / SR; d = np.clip((t - delay) / .4, 0, 1); return f * (1 + depth * d * np.sin(2 * np.pi * rate * t))
def formant(x, vowel='ah'):
    F = {'ah': [(730, 1), (1090, .5), (2440, .25)], 'oo': [(300, 1), (870, .4), (2240, .1)], 'ee': [(270, 1), (2290, .4), (3010, .2)], 'oh': [(570, 1), (840, .45), (2410, .15)]}[vowel]
    return sum(g * reson(x, f, 8) for f, g in F)

# ---------------- instruments (mono) ----------------
def bell(f, d=6., v=1.):
    t = T(d); P = [(.56, 1, 1), (.92, .67, .9), (1.19, 1, .65), (1.71, 1.8, .55), (2, 2.67, .325), (2.74, 1.67, .35), (3, 1.46, .25), (3.76, 1.33, .2), (4.07, 1.33, .15)]
    x = sum(a * np.sin(2 * np.pi * f * r * t + rng.random() * 6) * np.exp(-t / (d * df / 4)) for r, a, df in P)
    return nrm(x) * v
def organ(freqs, d, a=1.2, r=2.):
    n = int(SR * d); x = np.zeros(n)
    for f in freqs:
        for h, g in ((1, 1), (2, .5), (3, .3), (4, .2), (6, .1), (8, .05)):
            for det in (-.0015, .0015): x += g * osc(f * h * (1 + det), n)
    return nrm(lp(x, 2500) * env(n, a, r))
def choir(freqs, d, vowel='ah', a=1.6, r=2.2):
    n = int(SR * d); x = np.zeros(n)
    for f in freqs:
        for k in range(3):
            x += osc(vib(n, f * (1 + rng.uniform(-.004, .004)), rng.uniform(4.6, 5.6), .005, rng.uniform(.2, .8)), n, 'saw')
    x = formant(x, vowel) + .05 * hp(white(n), 3000) * slow(n, 2)
    return nrm(x * env(n, a, r))
def soprano(notes, vowel='oo'):
    """notes: [(freq, seconds)] sung legato with vibrato"""
    n = int(SR * sum(d for _, d in notes)); fr = np.concatenate([np.full(int(SR * d), f) for f, d in notes])[:n]
    fr = np.pad(fr, (0, n - len(fr)), 'edge'); fr = sg.sosfiltfilt(sg.butter(1, 6, 'lp', fs=SR, output='sos'), fr)
    fr = fr * (1 + .012 * np.sin(2 * np.pi * 5.6 * np.arange(n) / SR) * np.clip(np.arange(n) / SR / .6, 0, 1))
    x = osc(fr, n) + .35 * osc(fr * 2, n) + .15 * osc(fr * 3, n)
    return nrm(formant(x, vowel) * .6 + x * .4) * env(n, .5, 1.)
def pluck(f, d=1.4, bright=.5):
    """Karplus-Strong string"""
    n = int(SR * d); p = max(2, int(SR / f)); buf = list(rng.uniform(-1, 1, p) * (1 if bright > .5 else .7)); y = np.zeros(n); k = .5 + bright * .49
    for i in range(n):
        s = buf[i % p]; y[i] = s; buf[i % p] = k * s + (1 - k) * buf[(i + 1) % p] if bright > .5 else .498 * (s + buf[(i + 1) % p])
    return nrm(y)
def tine(f, d=2.):   # music box
    t = T(d); x = np.sin(2 * np.pi * f * t) * np.exp(-t / .7) + .3 * np.sin(2 * np.pi * f * 4.01 * t) * np.exp(-t / .12) + .1 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / .05)
    return nrm(x)
def calliope(f, d):
    n = int(SR * d); fr = vib(n, f, 6.5, .012, 0)
    x = osc(fr, n, 'saw') * .6 + osc(fr * 1.009, n, 'square') * .3 + .08 * bp(white(n), 800, 3000)
    return nrm(lp(x, 2600) * env(n, .03, .08))
def melody(fn, notes, step, overlap=1.6):
    """notes: semitone offsets / None, rendered with fn(freq, dur) at base frequency fn.base"""
    out = np.zeros(int(SR * (step * len(notes) + step * overlap + 2)))
    for i, s in enumerate(notes):
        if s is None: continue
        x = fn(s); a = int(SR * i * step); out[a:a + len(x)] += x[:len(out) - a]
    return out
def gull():
    out = np.zeros(int(SR * 1.2))
    for k, a in enumerate((0, .45)):
        d = rng.uniform(.28, .4); n = int(SR * d); f = np.linspace(rng.uniform(1700, 2000), rng.uniform(1000, 1250), n) ** 1
        x = osc(f, n) + .5 * osc(f * 2, n) + .2 * osc(f * 3, n); x = x * env(n, .03, .15) * (1 - .5 * k)
        i = int(SR * a); out[i:i + n] += x
    return nrm(out)
def crow():
    out = np.zeros(int(SR * 1.3))
    for k in range(rng.integers(2, 4)):
        n = int(SR * .26); f = np.linspace(560, 430, n)
        x = osc(f, n, 'saw') * (1 + .7 * osc(70, n, 'square')) + .4 * white(n)
        x = formant(x, 'ah') * env(n, .02, .1); i = int(SR * k * .36); out[i:i + n] += x
    return nrm(out)
def frog():
    n = int(SR * .7); f0 = rng.uniform(80, 120); x = osc(f0, n, 'saw') * (osc(rng.uniform(18, 26), n, 'square') > 0)
    gates = np.zeros(n)
    for k in range(3): a = int(SR * k * .2); gates[a:a + int(SR * .13)] = 1
    return nrm(bp(x * gates, 150, 900) * env(n, .01, .05))
def crickets(d=2.):
    n = int(SR * d); x = osc(4400, n) * (osc(30, n, 'square') > 0) * (osc(2.2, n, 'square') > 0)
    return nrm(x * env(n, .05, .3))
def bubbles():
    out = np.zeros(int(SR * 1.5))
    for k in range(rng.integers(3, 8)):
        d = rng.uniform(.05, .14); n = int(SR * d); f0 = rng.uniform(250, 700)
        x = osc(f0 * (1 + 2.5 * np.arange(n) / n), n) * dec(n, d / 3); i = int(SR * rng.uniform(0, 1.2)); out[i:i + n] += x * rng.uniform(.4, 1)
    return nrm(out)
def whale():
    n = int(SR * 4.5); f = np.interp(np.linspace(0, 1, n), [0, .35, .7, 1], [rng.uniform(110, 140), rng.uniform(170, 210), rng.uniform(150, 180), rng.uniform(90, 115)])
    x = osc(f, n) + .3 * osc(f * 2, n) + .1 * osc(f * 3.01, n)
    return nrm(lp(x, 900) * env(n, 1., 1.2))
def sonar():
    n = int(SR * 1.2); return nrm(osc(1500, n) * dec(n, .25) * env(n, .005, .1))
def drip():
    n = int(SR * .35); f = rng.uniform(1300, 2100); x = osc(f * np.exp(-np.arange(n) / SR / .03) * .5 + f * .5, n) * dec(n, .04)
    return nrm(x)
def clang(f=None):
    f = f or rng.uniform(480, 640); t = T(2.2)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / tau) for r, a, tau in ((1, 1, .9), (2.76, .6, .5), (5.4, .35, .25), (8.93, .2, .12)))
    x[:int(SR * .02)] += hp(white(int(SR * .02)), 3000) * .8
    return nrm(x)
def crackles(d, rate=12, amp=1.):
    n = int(SR * d); x = np.zeros(n)
    for i in rng.integers(0, n - 2000, int(d * rate)):
        g = int(rng.uniform(30, 300)); x[i:i + g] += hp(white(g), 2500) * rng.uniform(.2, 1) * amp * dec(g, g / SR / 3)
    return x
def bloop():
    n = int(SR * .5); f = np.linspace(rng.uniform(55, 75), rng.uniform(100, 140), n)
    return nrm((osc(f, n) + .3 * osc(f * 2, n)) * dec(n, .12) * env(n, .01, .1))
def clack():
    n = int(SR * .06); return nrm(bp(white(n), 900, 4000) * dec(n, .012) + .6 * osc(85, n) * dec(n, .03))
def tick(f):
    n = int(SR * .12); return nrm(hp(white(n), 2000) * dec(n, .003) + .7 * osc(f, n) * dec(n, .02))
def thump(f=52, v=1.):
    n = int(SR * .35); fr = f * (1 + 1.2 * np.exp(-np.arange(n) / SR / .03)); return nrm(osc(fr, n) * dec(n, .09)) * v
def rustle():
    n = int(SR * .8); x = np.zeros(n)
    for i in rng.integers(0, n - 1500, 18): g = int(rng.uniform(300, 1400)); x[i:i + g] += white(g) * np.hanning(g) * rng.uniform(.2, 1)
    return nrm(bp(x, 1800, 7000))
def whisper(d=1.8):
    n = int(SR * d); src = white(n) * .7 + .3 * osc(rng.uniform(140, 200), n, 'saw') * .2
    syl = np.zeros(n); i = 0
    while i < n: g = int(SR * rng.uniform(.08, .2)); syl[i:i + g] = np.hanning(g)[:n - i] * rng.uniform(.3, 1); i += g + int(SR * rng.uniform(0, .08))
    vowels = ['ah', 'ee', 'oo', 'oh']; seg = n // 4
    x = np.concatenate([formant(src[k * seg:(k + 1) * seg], vowels[rng.integers(4)]) for k in range(4)] + [np.zeros(n - 4 * seg)])
    return nrm((x + .3 * hp(src, 4000)) * syl * env(n, .2, .4))
def chimes():
    out = np.zeros(int(SR * 4))
    for k in range(rng.integers(4, 8)):
        f = st(1046, int(rng.choice([0, 2, 4, 7, 9, 12]))); t = T(2.5)
        x = (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / .4)) * np.exp(-t / 1.1)
        i = int(SR * rng.uniform(0, 1.4)); out[i:i + len(x)] += x * rng.uniform(.4, 1)
    return nrm(out)
def birds():
    out = np.zeros(int(SR * 2))
    for k in range(rng.integers(3, 7)):
        d = rng.uniform(.05, .12); n = int(SR * d); f = np.linspace(rng.uniform(2400, 3200), rng.uniform(3400, 4600), n)
        i = int(SR * k * rng.uniform(.1, .2)); out[i:i + n] += osc(f, n) * np.hanning(n)
    return nrm(out)
def sand(d=2.5):
    n = int(SR * d); return nrm(bp(white(n), 2500, 9000) * env(n, .8, 1.) * slow(n, 3, .3, 1))
def laugh():
    out = np.zeros(int(SR * 2.2)); f = rng.uniform(150, 190)
    for k in range(6):
        n = int(SR * .2); fr = np.linspace(f, f * .85, n) * (1 - k * .04); x = formant(osc(fr, n, 'saw') + .3 * white(n), 'ah') * env(n, .02, .12)
        i = int(SR * k * .27); out[i:i + n] += x * (1 - k * .1)
    return nrm(out)
def creak():
    n = int(SR * rng.uniform(.9, 1.6)); x = np.zeros(n); i = 0
    rate = slow(n, 4, 25, 90)
    while i < n: x[i] = rng.uniform(.5, 1); i += max(1, int(SR / rate[i] * rng.uniform(.8, 1.2)))
    y = reson(x, rng.uniform(420, 560), 12) + .7 * reson(x, rng.uniform(1000, 1300), 10) + .3 * reson(x, 2300, 8)
    return nrm(y * env(n, .1, .3) * slow(n, 2, .4, 1))
def foghorn():
    n = int(SR * 3.4); x = osc(vib(n, 98, 4, .002, 0), n, 'saw') + .6 * osc(vib(n, 146.8, 4.3, .002, 0), n, 'saw')
    return nrm(lp(x, 500) * env(n, .5, 1.2))
def steam_whistle():
    n = int(SR * 2.3); bend = 1 - .04 * np.clip((np.arange(n) / SR - 1.6) / .7, 0, 1)
    x = sum(g * osc(f * bend, n) for f, g in ((740, 1), (932, .8), (1108, .6))) + .25 * bp(white(n), 900, 3000)
    return nrm(x * env(n, .15, .5))
def canary():
    n = int(SR * .8); f = 3500 + 400 * osc(24, n); return nrm(osc(f, n) * env(n, .02, .2) * (osc(3, n) > -.5))
def rumble(d=4.):
    n = int(SR * d); return nrm(lp(brown(n), 90) * env(n, 1.2, 1.8))
def shimmer():
    out = np.zeros(int(SR * 4))
    for k in range(6):
        f = rng.uniform(1800, 4600); t = T(2.5); x = np.sin(2 * np.pi * f * t) * np.exp(-t / .9) * (1 - np.exp(-t / .01))
        i = int(SR * rng.uniform(0, 1.2)); out[i:i + len(x)] += x * rng.uniform(.3, 1)
    return nrm(out)
def rise():
    n = int(SR * 2.4); t = np.arange(n) / n
    x = osc(180 + 700 * t ** 2, n) * .5 + bp(white(n), 400, 3000) * t
    e = t ** 2.5; e[-int(SR * .03):] *= np.linspace(1, 0, int(SR * .03)); return nrm(x * e)
def gramophone(d):
    n = int(SR * d); return crackles(d, 30, .8)[:n] + .04 * hp(white(n), 4000)
def oud_phrase():
    scale = [0, 1, 4, 5, 7, 8, 10, 12]; k = rng.integers(0, 3); notes = [scale[(k + j) % 8] for j in (0, 1, 2, 1, 3, 2, 1, 0)]
    return melody(lambda s: pluck(st(146.8, s), 1.2, .7), notes, .24)
def drone_tone(freqs, n, shape='sine', det=.003, cut=800):
    x = sum(osc(f * (1 + d), n, shape) for f in freqs for d in (-det, det)); return lp(x, cut)

# ---------------- assembly ----------------
class Loop:
    def __init__(s): s.bed = np.zeros((N + F, 2)); s.ev = np.zeros((N, 2))
    def _fit(s, x):
        x = x[:N + F]; return np.pad(x, ((0, N + F - len(x)),) + ((0, 0),) * (x.ndim - 1)) if len(x) < N + F else x
    def layer(s, mono_or_stereo, g):
        x = s._fit(mono_or_stereo)
        if x.ndim == 1: x = pan2(x, 0)
        s.bed += x * g
    def wide(s, make, g):
        """independent left/right versions of a texture for width"""
        s.bed += np.stack([s._fit(make()), s._fit(make())], 1) * g
    def put(s, x, t, g=1., p=0.):
        y = pan2(x, p) * g; i = int(SR * t) % N; k = min(len(y), N)
        a = min(k, N - i); s.ev[i:i + a] += y[:a]; s.ev[:k - a] += y[a:k]
    def pulse(s, fn, period):
        k = 0; t = 0.
        while t < L - 1e-6: s.put(fn(k), t, 1, 0); k += 1; t += period
    def scatter(s, fn, count, g=(.4, .8), pan=.8):
        for t in np.sort(rng.uniform(0, L, count)): s.put(fn(), t, rng.uniform(*g), rng.uniform(-pan, pan))
    def render(s, room=.85, wet=.35, dry=.8, damping=.5, echo=None):
        w = np.sin(np.linspace(0, np.pi / 2, F))[:, None]
        y = s.bed[:N].copy(); y[:F] = s.bed[:F] * w + s.bed[N:N + F] * np.cos(np.linspace(0, np.pi / 2, F))[:, None]
        mix = (y + s.ev).astype(np.float32)
        fx = [Reverb(room_size=room, damping=damping, wet_level=wet, dry_level=dry, width=1.)]
        if echo: fx.insert(0, Delay(delay_seconds=echo[0], feedback=echo[1], mix=echo[2]))
        tiled = Pedalboard(fx)(np.ascontiguousarray(np.concatenate([mix, mix, mix]).T), SR).T   # tails from the copy before wrap into the middle one
        return tiled[N:2 * N]

def finish_bed(x, lufs_rms=-24.):
    rms = np.sqrt(np.mean(x ** 2)); x = x * (10 ** (lufs_rms / 20) / (rms + 1e-9))
    pk = np.abs(x).max()
    if pk > .7: x = np.tanh(x / .7) * .7   # gentle soft-clip on rare peaks
    return x
def fx_sheet(events, room=.8, wet=.3, echo=None):
    """events: list of mono arrays; each goes in its own SLOT-second slot with its reverb tail, peak-normalised"""
    slots = []
    fx = [Reverb(room_size=room, damping=.5, wet_level=wet, dry_level=.85, width=1.)]
    if echo: fx.insert(0, Delay(delay_seconds=echo[0], feedback=echo[1], mix=echo[2]))
    pb = Pedalboard(fx)
    for e in events:
        z = np.zeros(int(SR * SLOT)); k = min(len(e), len(z) - int(SR * .4)); z[:k] = e[:k] * np.linspace(1, 0, k) ** .05
        y = pb(np.ascontiguousarray(pan2(z, 0).astype(np.float32).T), SR).T
        y[-int(SR * .4):] *= np.linspace(1, 0, int(SR * .4))[:, None]
        slots.append(nrm(y, .7))
    return np.concatenate(slots)
def measure_lufs(x):
    import re
    os.makedirs(TMP, exist_ok=True); w = os.path.join(TMP, '_m.wav'); sf.write(w, x.astype(np.float32), SR)
    r = subprocess.run([FFMPEG, '-hide_banner', '-nostats', '-i', w, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1])
def to_lufs(x, target, ceiling=.9):
    x = x * 10 ** ((target - measure_lufs(x)) / 20)
    pk = np.abs(x).max()
    if pk > ceiling: x = np.where(np.abs(x) > ceiling * .8, np.sign(x) * (ceiling * .8 + (ceiling * .2) * np.tanh((np.abs(x) - ceiling * .8) / (ceiling * .2))), x)
    return x
BED_LUFS, FX_LUFS = -27., -18.
def write(name, x, wrap=False, kbps=96):
    os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
    if wrap:   # .1 s of the loop's end before it and .1 s of its start after it: the game loops between .1 and duration-.1
        p = int(SR * .1); x = np.concatenate([x[-p:], x, x[:p]])
    wav = os.path.join(TMP, name + '.wav'); sf.write(wav, x.astype(np.float32), SR)
    mp3 = os.path.join(OUT, name + '.mp3')
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '%dk' % kbps, mp3], check=True)
    return mp3

# ---------------- the levels ----------------
def wind(n, lo=300, hi=900, gust=.25):
    return bp(pink(n), lo, hi) * slow(n, gust, .25, 1)
def lvl_synth(n):   # first, fully synthesized version (kept for reference / no-samples fallback)
    lp_ = Loop(); X = N + F
    if n == 2:   # Grimwood Carnival: night wind, a far-off calliope going round, laughter, a creaking ride
        lp_.wide(lambda: wind(X, 200, 700, .2), .35)
        lp_.layer(organ([110, st(110, 3), st(110, 7)], X / SR, 4, 4) * slow(X, .1, .4, 1), .06)
        cal = lambda: melody(lambda s: calliope(st(262, s), .3), [0, 3, 7, 6, 3, None, 0, -1, 0, 3, 7, 10, 8, 7, 3, None], .3)
        for t in (4, 25): lp_.put(lp(cal(), 1500), t, .12, rng.uniform(-.6, .6))
        lp_.scatter(creak, 3, (.15, .3))
        return lp_.render(.8, .35), fx_sheet([cal(), cal(), laugh(), laugh(), creak(), creak(), bell(523, 3, 1) * .6])
    if n == 3:   # Clocktower: tick-tock, gears, wind round the tower, distant bells
        lp_.wide(lambda: wind(X, 300, 1000, .15), .18)
        lp_.layer(bp(brown(X), 60, 300) * slow(X, .3, .5, 1), .25)
        lp_.pulse(lambda k: tick(2100 if k % 2 else 1650), 1.0)
        lp_.put(bell(196, 6), 9, .25, -.4); lp_.put(bell(147, 6), 30, .2, .5)
        return lp_.render(.7, .3), fx_sheet([bell(rng.uniform(150, 220), 5) for _ in range(3)] + [lp(white(int(SR * 2)), 900) * env(int(SR * 2), .3, .6) * .5 + crackles(2, 40, .3)[:int(SR * 2)], creak(), creak()])
    if n == 4:   # Sunken Lighthouse: surf rolling in and out, wind, gulls, foghorn
        waves = lambda: lp(brown(X), 700) * (.35 + .65 * (.5 + .5 * np.sin(2 * np.pi * 5 * np.arange(X) / SR / L + rng.random() * 6)) ** 2)
        lp_.wide(waves, .9)
        lp_.wide(lambda: hp(pink(X), 2500) * (.5 + .5 * np.sin(2 * np.pi * 5 * np.arange(X) / SR / L)) ** 4, .05)
        lp_.wide(lambda: wind(X, 400, 1200), .12)
        lp_.put(foghorn(), 15, .35, 0)
        return lp_.render(.75, .25), fx_sheet([gull(), gull(), gull(), foghorn(), creak(), lp(bp(white(int(SR * 1.5)), 200, 2000), 1500) * env(int(SR * 1.5), .3, .8)])
    if n == 5:   # Frozen Monastery: howling wind, a monk choir far away, a cold bell
        for lo, hi in ((250, 600), (500, 1100), (900, 1800)): lp_.wide(lambda lo=lo, hi=hi: wind(X, lo, hi, .3), .3)
        lp_.layer(choir([98, 147], X / SR, 'oo', 5, 5) * slow(X, .08, .3, 1), .05)
        lp_.put(bell(220, 6), 21, .2, .3)
        return lp_.render(.9, .45), fx_sheet([choir([st(98, s) for s in (0, 3, 7)], 4.5, 'oh'), choir([st(110, s) for s in (0, 3, 7)], 4.5, 'oo'), bell(196, 5), wind(int(SR * 3), 500, 1500, 1) * env(int(SR * 3), .8, 1.2), creak()])
    if n == 6:   # Witch's Bog: insects, frogs, bubbling mud, crows, a low hum
        lp_.wide(lambda: bp(pink(X), 100, 400) * slow(X, .2, .5, 1), .25)
        lp_.wide(lambda: crickets(X / SR) * slow(X, .5, .2, 1), .05)
        lp_.scatter(frog, 14, (.2, .45)); lp_.scatter(bubbles, 8, (.2, .4))
        return lp_.render(.6, .2), fx_sheet([frog(), frog(), crow(), crow(), bubbles(), crickets(2), laugh()])
    if n == 7:   # Ghost Train: rumble, rail clacks, wind past the carriages, a whistle
        lp_.wide(lambda: lp(brown(X), 160) * (.7 + .3 * slow(X, .5)), .8)
        lp_.wide(lambda: wind(X, 500, 1500, .4), .12)
        lp_.pulse(lambda k: clack() * (1 if k % 2 == 0 else .8), .4375)   # da-dum, da-dum: pairs every .875 s
        lp_.put(steam_whistle(), 20, .2, -.3)
        return lp_.render(.5, .2), fx_sheet([steam_whistle(), steam_whistle(), creak(), lp(white(int(SR * 2)), 2000) * env(int(SR * 2), .1, 1.5), bell(880, 2.5)])
    if n == 8:   # Opera House: a low organ note, a dusty hall, a distant soprano
        lp_.layer(organ([65.4, 98, 130.8], X / SR, 5, 5) * slow(X, .07, .5, 1), .07)
        lp_.wide(lambda: lp(pink(X), 1200), .03)
        so = lambda: soprano([(st(523, s), d) for s, d in ((0, .7), (1, .5), (0, .5), (-2, .7), (0, .6), (3, 1.4))], 'oo')
        lp_.put(so(), 12, .12, -.5)
        return lp_.render(.92, .5), fx_sheet([so(), so(), soprano([(st(587, s), d) for s, d in ((0, 1), (-1, .5), (-4, 1.6))], 'ah'), creak(), laugh()])
    if n == 9:   # Ruined Cathedral: organ chord, wind through broken windows, choir, drips, crows, bells
        lp_.layer(organ([55, 82.4, 110, 164.8], X / SR, 5, 5) * slow(X, .06, .5, 1), .08)
        lp_.wide(lambda: wind(X, 300, 900), .15)
        lp_.scatter(drip, 10, (.1, .25))
        lp_.put(bell(130.8, 6), 6, .2, .4)
        return lp_.render(.95, .5), fx_sheet([choir([st(110, s) for s in (0, 3, 7)], 4.5, 'ah'), choir([st(98, s) for s in (0, 5, 8)], 4.5, 'oh'), bell(130.8, 5), crow(), drip()])
    if n == 10:   # Mirror Palace: glassy high drone, shimmering glints, rising swells, whispers
        lp_.layer(drone_tone([880, 1318.5, 1760], X, det=.004, cut=4000) * slow(X, .2, .3, 1), .02)
        lp_.wide(lambda: hp(pink(X), 5000), .01)
        lp_.scatter(shimmer, 5, (.15, .3))
        return lp_.render(.95, .55), fx_sheet([shimmer(), shimmer(), rise(), rise(), whisper(), whisper()])
    if n == 11:   # Spectral Archive: hushed room, a slow clock, pages turning, whispers
        lp_.wide(lambda: lp(pink(X), 400), .12)
        lp_.pulse(lambda k: tick(1200) * .6, 2.0)
        lp_.scatter(rustle, 6, (.15, .3))
        return lp_.render(.8, .35), fx_sheet([rustle(), rustle(), whisper(), whisper(), creak()])
    if n == 12:   # Toy Factory: machinery hum, a music box lullaby, wind-up toys, squeaks
        lp_.wide(lambda: bp(brown(X), 80, 300) * (.7 + .3 * osc(.75 + 0 * np.arange(X), X) ** 2), .3)
        lull = lambda b, rev=False: (lambda x: x[::-1] if rev else x)(melody(lambda s: tine(st(b, s)), [0, 4, 7, 12, 7, 4, 0, None, 2, 5, 9, 5, 2, None], .34))
        lp_.put(lull(523), 6, .15, -.4)
        ratchet = lambda: np.concatenate([tick(2600) * .5 for _ in range(10)])
        return lp_.render(.7, .3), fx_sheet([lull(523), lull(587), ratchet(), laugh(), bp(osc(np.linspace(2000, 2600, int(SR * .3)), int(SR * .3)), 1500, 4000)])
    if n == 13:   # Coal Mine: deep rumble, echoing drips, picks far down the tunnels, a canary
        lp_.wide(lambda: lp(brown(X), 110) * slow(X, .1, .5, 1), .7)
        lp_.scatter(drip, 18, (.15, .35))
        pickaxe = lambda: clang(rng.uniform(1900, 2400)) * .7
        lp_.scatter(pickaxe, 4, (.08, .15))
        return lp_.render(.85, .35, echo=(.37, .4, .35)), fx_sheet([drip(), pickaxe(), pickaxe(), canary(), rumble(), creak()], echo=(.37, .4, .35))
    if n == 14:   # Sky Gardens: high wind, chimes, birds
        for lo, hi in ((400, 900), (800, 2000)): lp_.wide(lambda lo=lo, hi=hi: wind(X, lo, hi, .35), .3)
        lp_.scatter(chimes, 4, (.15, .3)); lp_.scatter(birds, 5, (.1, .2))
        return lp_.render(.7, .25), fx_sheet([chimes(), chimes(), birds(), birds(), wind(int(SR * 3), 600, 2000, 1) * env(int(SR * 3), .8, 1.2)])
    if n == 15:   # Pharaoh's Tomb: drifting sand, a low drone, an oud, scarabs
        lp_.wide(lambda: bp(pink(X), 2000, 8000) * slow(X, .2, .2, 1), .06)
        lp_.layer(drone_tone([73.4, 110], X, 'saw', .002, 400), .05)
        lp_.put(oud_phrase(), 14, .15, .4)
        scarab = lambda: np.concatenate([tick(3000) * rng.uniform(.3, 1) for _ in range(6)])
        return lp_.render(.8, .4), fx_sheet([oud_phrase(), oud_phrase(), sand(), scarab(), whisper()])
    if n == 16:   # Wax Museum: gramophone crackle, a slow waltz, wax drips, creaks
        lp_.wide(lambda: gramophone(X / SR), .25)
        note = lambda s: (lambda a, b: a * .7 + np.pad(b, (0, len(a) - len(b))) * .3)(tine(st(330, s)), calliope(st(330, s), .35))
        waltz = lambda: bp(melody(note, [0, 4, 7, 4, 0, -1, 2, 7, 5, 2, -1, None], .42), 300, 3000)
        lp_.put(waltz(), 9, .18, -.3)
        return lp_.render(.75, .3), fx_sheet([waltz(), waltz(), drip(), creak(), creak(), laugh()])
    if n == 17:   # Abyssal Depths: muffled pressure, whale song, sonar, bubbles
        lp_.wide(lambda: lp(brown(X), 220) * slow(X, .08, .5, 1), .8)
        lp_.wide(lambda: lp(pink(X), 600), .04)
        lp_.put(whale(), 8, .25, -.5); lp_.scatter(bubbles, 6, (.15, .3))
        return lp_.render(.95, .55, echo=(.5, .3, .25)), fx_sheet([whale(), whale(), sonar(), bubbles(), bubbles()], echo=(.6, .35, .3))
    if n == 18:   # Volcano Forge: fire roar and crackle, hammers on anvils, lava bloops, rumble
        lp_.wide(lambda: lp(brown(X), 450) * (.6 + .4 * slow(X, .6)), .7)
        lp_.wide(lambda: crackles(X / SR, 14, 1.)[:X], .25)
        lp_.scatter(lambda: clang(), 6, (.25, .4)); lp_.scatter(bloop, 8, (.25, .45))
        double = lambda: (lambda a: (np.pad(a, (0, int(SR * .45))) + np.pad(a * .8, (int(SR * .45), 0))))(clang())
        return lp_.render(.75, .3), fx_sheet([clang(), double(), double(), bloop(), crackles(2.5, 30, 1.), rumble()])
    if n == 19:   # Dream Realm: a hovering chord, a backwards lullaby, whispers, shimmer
        lp_.layer(drone_tone([261.6, 329.6, 392, 493.9], X, det=.006, cut=2000) * slow(X, .15, .3, 1), .03)
        lull = lambda: melody(lambda s: tine(st(392, s)), [0, 4, 7, 12, 7, 4, 0, None, 2, 5, 9, 5], .45)[::-1]
        lp_.put(lull(), 5, .14, .3); lp_.scatter(shimmer, 3, (.1, .2))
        return lp_.render(.95, .6), fx_sheet([lull(), whisper(), whisper(), rise(), shimmer()])
    if n == 20:   # The Heart of Hollow Manor: a slow heartbeat in the walls, low organ, creaks, whispers, choir
        lp_.layer(organ([41.2, 61.7, 82.4], X / SR, 5, 5) * slow(X, .06, .5, 1), .06)
        lp_.wide(lambda: wind(X, 200, 600, .15), .15)
        lp_.pulse(lambda k: thump(48) + np.pad(thump(44, .6), (int(SR * .28), 0))[:int(SR * .35)], 1.4)
        lp_.scatter(creak, 4, (.15, .3))
        return lp_.render(.85, .4), fx_sheet([creak(), creak(), whisper(), choir([st(73.4, s) for s in (0, 3, 7)], 4.5, 'oh'), bell(98, 5), laugh()])

# ---------------- recorded samples (CC0 previews from freesound.org, see samples/CREDITS.txt) ----------------
import librosa
SAMP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'samples'); _cache = {}
def db(g): return 10 ** (g / 20)
def S(name):
    """stereo (n, 2) at SR, rumble-filtered, active part RMS-normalised to -20 dBFS"""
    if name not in _cache:
        y, _ = librosa.load(os.path.join(SAMP, name + '.mp3'), sr=SR, mono=False)
        y = np.stack([y, y], 1) if y.ndim == 1 else y.T
        y = sg.sosfilt(sg.butter(2, 25, 'hp', fs=SR, output='sos'), y, axis=0)
        m = np.abs(y).mean(1); act = m > m.max() * .03
        _cache[name] = y * (.1 / (np.sqrt(np.mean(y[act] ** 2)) + 1e-9))
    return _cache[name]
def E(name, a=None, d=None, fade=.12):
    """mono one-shot: the whole sample trimmed of silence, or an excerpt from a seconds, d long"""
    x = S(name).mean(1)
    if a is None: x, _ = librosa.effects.trim(x, top_db=40)
    else: x = x[int(SR * a):int(SR * (a + d))]
    f = min(int(SR * fade), len(x) // 4); x = x.copy(); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f); return x
def texture(name, n=None, xf=2.5):
    """a texture n samples long built from a recording: random-offset stretches joined by equal-power crossfades"""
    n = n or N + F; x = S(name); L0 = len(x); c = min(int(SR * xf), L0 // 3); out = np.zeros((n + c, 2)); pos = 0; first = True
    while pos < n:
        ln = min(L0, n + c - pos); a = int(rng.integers(0, L0 - ln + 1)); seg = x[a:a + ln].copy()
        if not first: seg[:c] *= np.sin(np.linspace(0, np.pi / 2, c))[:, None]
        if pos + ln < n + c: seg[-c:] *= np.cos(np.linspace(0, np.pi / 2, c))[:, None]
        out[pos:pos + ln] += seg; pos += ln - c; first = False
    return out[:n]
def lvl(n):
    lp_ = Loop(); X = N + F
    T = lambda name, g, **k: lp_.layer(texture(name, **k), db(g))
    if n == 1:   # Hollow Manor: a storm lashing the house, wind moaning in the chimneys, the grandfather clock in the hall,
                 # a dying fire, thunder rolling over the moors, an owl outside; ghosts, creaks and footsteps come at random
        T('l1_storm', 0); T('l1_wind_howl', -9); T('l1_clock', -11, xf=.04); T('l1_fire', -20)
        lp_.wide(lambda: lp(brown(X), 140) * slow(X, .07, .4, 1), .25)
        lp_.put(E('l1_thunder_roll'), 6, db(-3), -.3); lp_.put(E('l1_thunder_far'), 27, db(-6), .4)
        lp_.put(E('l1_owl', 0, 7), 17, db(-13), .7); lp_.put(E('l1_floor_creak', 2, 5), 34, db(-11), -.6)
        return lp_.render(.75, .3), fx_sheet([E('l1_thunder_clap'), E('l1_thunder_far'), E('l1_clock_strike', 0, 7.4), E('l1_owl', 0, 7.4),
                                             E('l1_door_creak'), E('l1_big_door'), E('l1_stairs', 0, 7.4), E('l1_floor_creak', 8, 7.4),
                                             E('l1_moan'), E('l1_ghost_moan'), E('l1_ghost_crying'), E('l1_ghost_singing', 0, 7.4),
                                             E('l1_ghost_piano', 0, 7.4), E('l1_chains')], room=.75, wet=.28)
    if n == 2:   # Grimwood Carnival: a broken calliope and creepy circus tune drifting over the empty fair, a ride grinding, clowns
        lp_.wide(lambda: wind(X, 200, 700, .2), .3)
        T('l2_ride_mech', -14)
        lp_.put(lp(E('l2_calliope', 4, 14), 3000), 3, db(-9), -.5)
        lp_.put(lp(E('l2_circus', 10, 16), 2200), 22, db(-12), .5)
        lp_.put(E('l2_clown_laugh2'), 18, db(-10), .7)
        return lp_.render(.85, .4), fx_sheet([E('l2_clown_laugh1'), E('l2_clown_laugh2'), E('l2_laugh1'), E('l2_laugh2'), E('l2_clown_horn'),
                                             E('l2_calliope', 24, 7), E('l2_circus', 30, 7), creak()])
    if n == 3:   # Clocktower: real tick-tock, gears and levers, wind round the tower, distant bells
        T('l3_ticktock', -6, xf=.03)
        lp_.wide(lambda: wind(X, 300, 1000, .15), .15)
        T('l3_levers', -16)
        lp_.put(E('l3_bells_far'), 9, db(-6), -.4); lp_.put(bell(147, 6), 30, .15, .5)
        return lp_.render(.75, .3), fx_sheet([E('l3_bells_far'), E('l3_levers', 0, 6), E('l3_levers', 7, 6), bell(rng.uniform(150, 220), 5), creak()])
    if n == 4:   # Sunken Lighthouse: real surf on rocks, wind, gulls, the foghorn
        T('l4_waves', 0); lp_.wide(lambda: wind(X, 400, 1200), .1)
        lp_.put(E('l4_foghorn'), 15, db(-8), 0); lp_.put(E('l4_gulls', 0, 5), 31, db(-14), .6)
        return lp_.render(.7, .2), fx_sheet([E('l4_gulls', 0, 5), E('l4_gulls', 5, 5), E('l4_gulls', 9, 4.5), E('l4_foghorn'), creak()])
    if n == 5:   # Frozen Monastery: a nor'easter howling, monks chanting far below, an eerie choir, a cold bell
        T('l5_storm', 0); T('l5_monks', -18)
        lp_.put(E('l5_bell'), 21, db(-8), .3)
        return lp_.render(.9, .4), fx_sheet([E('l5_chorus', 0, 7.4), E('l5_chorus', 14, 7.4), E('l5_chorus', 28, 7.4), E('l5_monks', 10, 7.4), E('l5_bell')])
    if n == 6:   # Witch's Bog: frogs and insects at night, bubbling mud, crows
        T('l6_frogs_night', 0); T('l6_mud', -12)
        lp_.put(E('l6_crow'), 26, db(-10), -.6)
        return lp_.render(.6, .2), fx_sheet([E('l6_crow'), E('l6_crow'), E('l6_mud', 0, 6), frog(), laugh()])
    if n == 7:   # Ghost Train: a real carriage rumbling, wheels clacking on the rails, a distant steam train, the horn
        T('l7_rumble', 0); T('l7_clack', -6)
        lp_.put(E('l7_steam_far'), 20, db(-8), -.3)
        return lp_.render(.5, .2), fx_sheet([E('l7_horn', 0, 7), E('l7_steam_far'), steam_whistle(), creak(), E('l7_clack', 10, 6)])
    if n == 8:   # Opera House: a murmuring audience that isn't there, the orchestra tuning, a soprano, ghostly singing
        T('l8_murmur', -6); T('l8_tuning', -14); lp_.layer(organ([65.4, 98, 130.8], X / SR, 5, 5) * slow(X, .07, .5, 1), .05)
        lp_.put(E('l8_soprano', 0, 9), 12, db(-12), -.5)
        return lp_.render(.92, .45), fx_sheet([E('l8_soprano', 0, 7.4), E('l8_soprano', 9, 7.4), E('l8_ghost_sing'), E('l8_remorse'), E('l8_tuning', 5, 7), E('l8_creak')])
    if n == 9:   # Ruined Cathedral: the organ, wind through broken windows, Gregorian chant, the bell, drips
        lp_.layer(organ([55, 82.4, 110, 164.8], X / SR, 5, 5) * slow(X, .06, .5, 1), .05)
        lp_.wide(lambda: wind(X, 300, 900), .15)
        lp_.put(E('l9_organ', 0, 20), 4, db(-8), 0); lp_.put(E('l9_chant', 0, 12), 27, db(-12), .4)
        lp_.scatter(drip, 8, (.1, .2))
        return lp_.render(.95, .5), fx_sheet([E('l9_chant', 0, 7.4), E('l9_chant', 8, 7.4), E('l9_bell'), E('l9_organ', 20, 7.4), crow(), drip()])
    if n == 10:   # Mirror Palace: singing glass, glass rings, a reversed breath, something cracking
        T('l10_singing_glass', -10); lp_.wide(lambda: hp(pink(X), 5000), .008)
        lp_.put(E('l10_glass_ring'), 17, db(-8), .5); lp_.scatter(shimmer, 3, (.1, .2))
        return lp_.render(.95, .55), fx_sheet([E('l10_glass_ring'), E('l10_rev_breath'), E('l10_glass_break'), E('l10_singing_glass', 4, 7), whisper(), rise()])
    if n == 11:   # Spectral Archive: hushed stacks, a slow clock, pages turning, a quill scratching, whispers
        lp_.wide(lambda: lp(pink(X), 400), .1); lp_.pulse(lambda k: tick(1200) * .5, 2.0)
        lp_.put(E('l11_quill'), 14, db(-8), -.4); lp_.put(E('l11_pages'), 30, db(-10), .5)
        return lp_.render(.8, .35), fx_sheet([E('l11_pages'), E('l11_page'), E('l11_quill'), whisper(), whisper(), creak()])
    if n == 12:   # Toy Factory: machinery, music boxes, a detuned toy piano, wind-up toys, squeaks
        T('l12_machine', -12)
        lp_.put(E('l12_vintage_box', 0, 14), 6, db(-12), -.4)
        return lp_.render(.7, .3), fx_sheet([E('l12_musicbox', 0, 7.4), E('l12_vintage_box', 8, 7.4), E('l12_toy_piano', 0, 7.4), E('l12_toy_piano', 12, 7.4),
                                             E('l12_windup'), E('l12_squeak')])
    if n == 13:   # Coal Mine: water dripping in a huge cave, a deep rumble, picks in far tunnels, the canary
        T('l13_drips', 0); T('l13_rumble', -4)
        lp_.put(E('l13_pick', 0, 4), 19, db(-10), .6)
        return lp_.render(.8, .3, echo=(.37, .35, .3)), fx_sheet([E('l13_pick', 0, 4), E('l13_pick', 3.5, 4), canary(), rumble(), creak()], echo=(.37, .35, .3))
    if n == 14:   # Sky Gardens: high wind, wind chimes, swallows
        for lo, hi in ((400, 900), (800, 2000)): lp_.wide(lambda lo=lo, hi=hi: wind(X, lo, hi, .35), .3)
        T('l14_chimes', -10); lp_.scatter(lambda: E('l14_swallows'), 3, (.1, .2))
        return lp_.render(.7, .25), fx_sheet([E('l14_chimes', 0, 7.4), E('l14_chimes', 8, 7.4), E('l14_swallows'), birds(), wind(int(SR * 3), 600, 2000, 1) * env(int(SR * 3), .8, 1.2)])
    if n == 15:   # Pharaoh's Tomb: Saharan wind, the tomb's breath, a ney flute somewhere in the dark, scarabs
        T('l15_sahara', 0); T('l15_tomb', -6)
        lp_.put(E('l15_ney', 0, 12), 14, db(-12), .4)
        scarab = lambda: np.concatenate([tick(3000) * rng.uniform(.3, 1) for _ in range(6)])
        return lp_.render(.8, .4), fx_sheet([E('l15_ney', 0, 7.4), E('l15_ney', 12, 7.4), E('l15_ney', 20, 7.4), oud_phrase(), scarab(), whisper()])
    if n == 16:   # Wax Museum: a crackling record, guttering candles, an antique music box waltz, an old gramophone tune
        T('l16_vinyl', -4); T('l16_candle', -14)
        lp_.put(bp(E('l16_waltz_box', 0, 16), 200, 5000), 8, db(-10), -.3)
        return lp_.render(.75, .3), fx_sheet([E('l16_waltz_box', 0, 7.4), E('l16_waltz_box', 16, 7.4), bp(E('l16_gramophone', 0, 7.4), 250, 4000), bp(E('l16_radio_box', 5, 7.4), 250, 4500),
                                             creak(), drip()])
    if n == 17:   # Abyssal Depths: an underwater cave, whale song, sonar, bubbles
        T('l17_cave', 0); lp_.wide(lambda: lp(brown(X), 220) * slow(X, .08, .5, 1), .3)
        lp_.put(E('l17_whale', 0, 10), 8, db(-8), -.5); lp_.scatter(bubbles, 5, (.1, .25))
        return lp_.render(.95, .5, echo=(.5, .3, .25)), fx_sheet([E('l17_whale', 0, 7.4), E('l17_whale', 8, 7.4), E('l17_sonar'), E('l17_sonar'), whale(), bubbles()], echo=(.6, .35, .3))
    if n == 18:   # Volcano Forge: roaring fire, bubbling lava, the anvil, bellows, steam
        T('l18_fire', 0); T('l18_lava', -4)
        lp_.put(E('l18_anvil', 0, 5), 12, db(-8), .5); lp_.put(E('l18_bellows', 0, 6), 29, db(-10), -.5)
        return lp_.render(.7, .25), fx_sheet([E('l18_anvil', 0, 5), E('l18_anvil', 5, 5), E('l18_steam'), E('l18_bellows', 0, 7.4), clang(), bloop()])
    if n == 19:   # Dream Realm: a drifting pad, an eerie music box played backwards, whispers, a reversed piano
        T('l19_pad', -6); lp_.layer(drone_tone([261.6, 329.6, 392, 493.9], X, det=.006, cut=2000) * slow(X, .15, .3, 1), .015)
        lp_.put(E('l19_musicbox', 10, 14)[::-1], 5, db(-10), .3)
        return lp_.render(.95, .55), fx_sheet([E('l19_musicbox', 0, 7.4), E('l19_musicbox', 30, 7.4)[::-1], E('l19_whispers', 0, 7.4), E('l19_rev_piano'), shimmer(), rise()])
    if n == 20:   # The Heart of Hollow Manor: the house's heartbeat, a ghastly presence, creaking floors, footsteps, whispers
        T('l20_heart', -4, xf=.05); T('l20_presence', -10)
        lp_.layer(organ([41.2, 61.7, 82.4], X / SR, 5, 5) * slow(X, .06, .5, 1), .03)
        lp_.put(E('l20_floorboards'), 13, db(-10), -.5); lp_.put(E('l20_footsteps', 0, 7), 31, db(-12), .6)
        return lp_.render(.85, .4), fx_sheet([E('l20_creak'), E('l20_floorboards'), E('l20_footsteps', 0, 7.4), whisper(), choir([st(73.4, s) for s in (0, 3, 7)], 7, 'oh')])   # the cackle is the Witch's Bog's alone

if __name__ == '__main__':
    levels = [int(a) for a in sys.argv[1:]] or list(range(2, 21))
    for n in levels:
        rng = np.random.default_rng(100 + n)
        bed, fxs = lvl(n)
        b = write('level%d_bed' % n, to_lufs(bed, BED_LUFS), wrap=True)
        f = write('level%d_fx' % n, to_lufs(fxs, FX_LUFS))
        print('L%d bed %.0f KB  fx %.0f KB (%d slots)' % (n, os.path.getsize(b) / 1024, os.path.getsize(f) / 1024, round(len(fxs) / SR / SLOT)))
