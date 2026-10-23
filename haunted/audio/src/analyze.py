# Checks rendered soundscapes without listening: loudness (EBU R128 via ffmpeg), peaks, the loop seam,
# and a picture per level (bed spectrogram + loudness over time, fx sheet spectrogram).
# usage: python analyze.py [level ...]
import os, sys, re, subprocess, shutil, glob
import numpy as np, librosa, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.join(HERE, '..', 'star-dash', 'haunted', 'audio')
FFMPEG = shutil.which('ffmpeg') or glob.glob(os.path.expanduser('~/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/*/bin/ffmpeg.exe'))[0]

def lufs(path):
    r = subprocess.run([FFMPEG, '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r); return float(m[-1]) if m else float('nan')
levels = [int(a) for a in sys.argv[1:]] or list(range(2, 21))
for n in levels:
    bed, fx = os.path.join(AUD, 'level%d_bed.mp3' % n), os.path.join(AUD, 'level%d_fx.mp3' % n)
    yb, sr = librosa.load(bed, sr=22050, mono=True); yf, _ = librosa.load(fx, sr=22050, mono=True)
    p = int(sr * .1); loop = yb[p:len(yb) - p]
    seam = abs(loop[-1] - loop[0]) / (np.std(loop) + 1e-9)    # jump across the loop point, in standard deviations
    rms = librosa.feature.rms(y=loop, frame_length=4096, hop_length=2048)[0]
    print('L%-2d bed %6.1f LUFS peak %5.2f seam %.2fsd  rms-swing %4.1f dB | fx %6.1f LUFS peak %5.2f' % (
        n, lufs(bed), np.abs(yb).max(), seam, 20 * np.log10(rms.max() / (rms.min() + 1e-9)), lufs(fx), np.abs(yf).max()))
    fig, ax = plt.subplots(3, 1, figsize=(11, 7), gridspec_kw={'height_ratios': [3, 1, 3]})
    for a, y, title in ((ax[0], loop, 'bed loop'), (ax[2], yf, 'fx sheet (8 s slots)')):
        S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=2048, hop_length=512)), ref=np.max)
        a.imshow(S, origin='lower', aspect='auto', cmap='magma', vmin=-80, extent=[0, len(y) / sr, 0, sr / 2]); a.set_yscale('symlog', linthresh=500); a.set_ylim(40, 11000); a.set_title('Level %d %s' % (n, title))
    ax[1].plot(np.arange(len(rms)) * 2048 / sr, 20 * np.log10(rms + 1e-9)); ax[1].set_ylabel('dB'); ax[1].set_xlim(0, len(loop) / sr)
    for k in range(1, int(len(yf) / sr / 8) + 1): ax[2].axvline(k * 8, color='w', lw=.5)
    fig.tight_layout(); fig.savefig(os.path.join(HERE, 'tmp', 'level%d.png' % n), dpi=70); plt.close(fig)

