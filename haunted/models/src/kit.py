# Shared building blocks for the character scripts (exec'd after bl_helpers.py).
import math
PI = math.pi; D = PI / 180

def setup(name, head, sh, hip, tail):
    """Root + the six Pivot_* empties every skin needs. sh/hip are (x, z); head/tail are z / (y, z)."""
    root = empty(name + '_Root', (0, 0, 0))
    P = {
        'Head': empty('Pivot_Head', (0, 0, head), root),
        'ArmA': empty('Pivot_ArmA', (-sh[0], 0, sh[1]), root),
        'ArmB': empty('Pivot_ArmB', (sh[0], 0, sh[1]), root),
        'LegA': empty('Pivot_LegA', (-hip[0], 0, hip[1]), root),
        'LegB': empty('Pivot_LegB', (hip[0], 0, hip[1]), root),
        'Tail': empty('Pivot_Tail', (0, tail[0], tail[1]), root),
    }
    return root, P

def on_face(fc, R, du, v):
    """point on an ell() face at texture coords (u = .75 + du is straight ahead, v 0 chin .. 1 crown)."""
    a = (270 + du * 360) * D; t = v * PI
    return (fc[0] + R[0] * math.sin(t) * math.cos(a), fc[1] + R[1] * math.sin(t) * math.sin(a), fc[2] - math.cos(t) * R[2])

def eyes(hp, fc, R, m, du=.052, v=.58, size=(.011, .005, .008), glint=None, push=.002):
    for s in (-1, 1):
        x, y, z = on_face(fc, R, s * du, v)
        attach(ell('Eye%d' % s, (x, y - push, z), *size, m, segs=8, rings=5), hp, noisy=False)
        if glint:
            attach(ell('Glint%d' % s, (x + .003, y - push - .003, z + .002), .0035, .002, .003, glint, segs=6, rings=4), hp, noisy=False)

def arm(P, key, s, sh, el, wr, sleeve, hand, r=(.058, .05, .046, .04), cuff=None, amp=.25, sleeve_tex=False):
    """shoulder ball + upper + forearm + simple hand. sh/el/wr given for the +x side; s mirrors them."""
    p = P[key]
    S = lambda q: (s * q[0], q[1], q[2])
    sh, el, wr = S(sh), S(el), S(wr)
    nz = not sleeve_tex
    attach(ell('Shoulder' + key, sh, r[0] * 1.15, r[0] * 1.08, r[0] * 1.1, sleeve, segs=14, rings=8), p, amp=amp, noisy=nz)
    attach(limb('Upper' + key, sh, el, [(0, r[0]), (1, r[1])], sleeve, segs=12), p, amp=amp, noisy=nz)
    attach(ell('Elbow' + key, el, r[1], r[1], r[1], sleeve, segs=10, rings=6), p, amp=amp, noisy=nz)
    attach(limb('Fore' + key, el, wr, [(0, r[2]), (1, r[3])], sleeve, segs=12), p, amp=amp, noisy=nz)
    d = (Vector(wr) - Vector(el)).normalized()
    hc = Vector(wr) + d * .045
    attach(ell('Hand' + key, tuple(hc), .03, .028, .042, hand, segs=12, rings=7), p, amp=.15)
    attach(ell('Thumb' + key, tuple(hc + Vector((-s * .008, -.03, .01))), .011, .013, .023, hand, segs=8, rings=5), p, amp=.15)
    if cuff:
        xf, L = between(el, wr)
        attach(lathe('Cuff' + key, [(r[3] * 1.15, 0), (r[3] * 1.35, .05), (r[3] * 1.3, .055)], cuff, segs=14, xf=xf @ Matrix.Translation((0, 0, L * .82))), p, amp=.2)
    return tuple(hc)

def leg(P, key, s, x, top, knee_r, cloth, boot, boot_top=.3, toe=.13, amp=.2, cloth_tex=False):
    p = P[key]; x = s * x
    attach(limb('Leg' + key, (x, 0, top), (x, 0, boot_top - .02), [(0, knee_r[0]), (.5, knee_r[1]), (1, knee_r[2])], cloth, segs=12), p, amp=amp, noisy=not cloth_tex)
    attach(lathe('Boot' + key, [(knee_r[2] * .95, .08), (knee_r[2] * 1.02, boot_top * .7), (knee_r[2] * 1.12, boot_top), (knee_r[2] * 1.05, boot_top + .008)], boot, segs=14, center=(x, 0)), p, amp=.3)
    attach(ell('Foot' + key, (x, -.055, .048), .05, toe, .048, boot, segs=14, rings=8), p, amp=.3)
    attach(box('Sole' + key, (x, -.045, .011), (.094, toe * 2.1, .022), boot, bevel=.005), p, amp=.1)

def hood(name, c, r, h, m, parent, open_front=50, sy=1.05, droop=.0):
    """a cowl: open-fronted lathe shell around the head."""
    a0 = (-90 + open_front) * D; a1 = (270 - open_front) * D
    prof = [(r * .75, c[2] - h * .45), (r * 1.02, c[2] - h * .25), (r * 1.08, c[2]), (r * 1.02, c[2] + h * .3), (r * .75, c[2] + h * .5), (r * .3, c[2] + h * .6), (0, c[2] + h * .62)]
    o = lathe(name, prof, m, segs=26, arc=(a0, a1), sy=sy, center=(c[0], c[1] + droop))
    return attach(o, parent, amp=.3)

# --- a tiny 5x7 pixel font for painted lettering ---
FONT = {
    'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    ' ': ['00000'] * 7,
}
def text_hit(txt, u, v, u0, v0, w, h):
    """is (u, v) on a pixel of txt drawn in the box (u0, v0, w, h)?"""
    if not (u0 <= u < u0 + w and v0 <= v < v0 + h): return False
    n = len(txt); cw = w / n
    k = int((u - u0) / cw); ch = txt[k]
    gx = int(((u - u0) - k * cw) / cw * 6); gy = int((1 - (v - v0) / h) * 7)
    return gx < 5 and 0 <= gy < 7 and FONT.get(ch, FONT[' '])[gy][gx] == '1'

def mat_glow_tex(name, img, rough=.3, es=1.5):
    """image drives both colour and emission (stained glass, glowing runes)."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    nt.links.new(t.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = es
    b.inputs['Roughness'].default_value = rough
    return m

def script_px(u, v, lines=18, ink=(.08, .06, .08), base=(.86, .76, .56), seed=0, caps=True):
    """parchment covered in rows of handwriting, with the odd red and gold capital."""
    n = noise.noise(Vector((u * 12, v * 12, seed))) * .5 + .5
    col = [c * (.82 + .18 * n) for c in base]
    row = v * lines; k = int(row); f = row - k
    wobble = .18 * math.sin(u * 70 + k * 3.1) + .1 * math.sin(u * 190 + k)
    word = noise.noise(Vector((u * 18, k * 1.7, seed + 3)))
    if word > -.25 and abs(f - .5 - wobble * .5) < .07: col = list(ink)
    if caps and ((int(u * 9) + k * 5) % 23 == 0) and .15 < f < .85 and (u * 9 % 1) < .1:
        col = [.65, .08, .06] if k % 2 else [.85, .62, .2]
    return tuple(col)

def stripes_px(u, v, n, cols, line=None):
    """horizontal bands (v) cycling through cols, optional thin dividing line colour."""
    x = v * n; k = int(x) % len(cols); f = x - int(x)
    if line and (f < .08 or f > .92): return line
    nz = noise.noise(Vector((u * 25, v * 25, k))) * .5 + .5
    return tuple(c * (.85 + .15 * nz) for c in cols[k])

def bandage_px(u, v):
    x = v * 34 + u * 6 + .4 * math.sin(u * 20)
    f = x - math.floor(x)
    nz = noise.noise(Vector((u * 30, v * 30, 7))) * .5 + .5
    base = [(.62 + .1 * nz) * c for c in (1, .92, .74)]
    if f < .12: base = [c * .45 for c in base]
    stain = noise.noise(Vector((u * 5, v * 5, 2)))
    if stain > .35: base = [base[0] * .7, base[1] * .62, base[2] * .5]
    return tuple(base)

def magma_px(u, v, pts=None):
    """cooled dark rock split by glowing cracks (use with mat_glow_tex)."""
    global _MAGMA_PTS
    if pts is None:
        if '_MAGMA_PTS' not in globals():
            import random as _r; _r.seed(77); _MAGMA_PTS = [(_r.random(), _r.random()) for _ in range(40)]
        pts = _MAGMA_PTS
    b0 = b1 = 9
    for px, py in pts:
        dx = min(abs(u - px), 1 - abs(u - px)); d = dx * dx + (v - py) ** 2 * 1.5
        if d < b0: b0, b1 = d, b0
        elif d < b1: b1 = d
    e = math.sqrt(b1) - math.sqrt(b0)
    if e < .012: return (1, .45, .08)
    if e < .03: k = (.03 - e) / .018; return (.04 + .7 * k, .025 + .2 * k, .02)
    n = noise.noise(Vector((u * 30, v * 30, 1))) * .5 + .5
    return (.035 * (.7 + .3 * n), .03 * (.7 + .3 * n), .03 * (.7 + .3 * n))
