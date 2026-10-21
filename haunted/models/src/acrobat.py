import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
reset()
PI = math.pi; D = PI / 180
root = empty('Acrobat_Root', (0, 0, 0))
P = {
    'Head': empty('Pivot_Head', (0, 0, 1.40), root),
    'ArmA': empty('Pivot_ArmA', (-.16, 0, 1.33), root),
    'ArmB': empty('Pivot_ArmB', (.16, 0, 1.33), root),
    'LegA': empty('Pivot_LegA', (-.07, 0, .86), root),
    'LegB': empty('Pivot_LegB', (.07, 0, .86), root),
    'Tail': empty('Pivot_Tail', (0, .07, 1.43), root),
}
# The Porcelain Acrobat: cracked china face, faded harlequin leotard (warm rose / mustard / cream)
def frac(x): return x - math.floor(x)
def harl_px(u, v):
    x, y = u * 8, v * 7
    i, j = math.floor(x + y), math.floor(x - y)
    c = [(.74, .46, .46), (.79, .63, .38), (.88, .82, .71)][(i + 2 * j) % 3]
    fx, fy = frac(x + y), frac(x - y)
    n = noise.noise(Vector((u * 30, v * 30, 2))) * .5 + .5
    fade = .82 + .18 * n
    c = [ch * fade for ch in c]
    if min(fx, 1 - fx, fy, 1 - fy) < .035: c = [.22, .17, .16]
    return tuple(c)
HARL = mat_tex('FadedHarlequin', make_image('Harlequin', 256, 256, harl_px), .75)

random.seed(7)
def crack(x0, y0, steps, dx, dy):
    pts = [(x0, y0)]
    for _ in range(steps):
        x0 += dx + random.uniform(-.012, .012); y0 += dy + random.uniform(-.02, .02); pts.append((x0, y0))
    return pts
CRACKS = [crack(.765, .88, 9, -.004, -.045), crack(.70, .62, 6, -.006, -.03), crack(.745, .56, 4, .01, -.02), crack(.80, .8, 5, .007, -.03)]
SEGS = [(a, b) for c in CRACKS for a, b in zip(c, c[1:])]
def segd(px, py, a, b):
    ax, ay = a; bx, by = b; vx, vy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy + 1e-9)))
    return math.hypot(px - ax - t * vx, py - ay - t * vy)
def face_px(u, v):
    du = u - .75
    col = [.93, .88, .80]
    if abs(du) < .25:
        for s in (-1, 1):   # painted rosy cheeks
            d = math.hypot((du - s * .07) / .04, (v - .44) / .07)
            if d < 1: k = (1 - d) * .6; col = [col[0] * (1 - k) + .86 * k, col[1] * (1 - k) + .45 * k, col[2] * (1 - k) + .45 * k]
        for s in (-1, 1):   # thin arched brows
            x = (du - s * .05) / .035
            if abs(x) < 1 and abs(v - (.68 - .025 * x * x)) < .006: col = [.18, .1, .08]
            # lower lashes painted like a doll
            if abs(x) < .8 and abs(v - .555) < .004 and (du * 120) % 1 < .5: col = [.25, .14, .12]
        # cupid's-bow lips
        k = du / .03
        if abs(k) < 1 and abs(v - (.335 + .012 * (abs(k) - .5) * (abs(k) < .5))) < .02 * (1 - k * k) + .003: col = [.62, .12, .15]
        # chipped temple: hollow porcelain showing through
        if math.hypot((du + .12) / .03, (v - .72) / .05) + noise.noise(Vector((u * 50, v * 50, 1))) * .4 < 1: col = [.32, .29, .27]
    if abs(du) < .25:
        dmin = min(segd(du + .75, v, a, b) for a, b in SEGS)
        if dmin < .0035: col = [.15, .12, .11]
        elif dmin < .007: col = [c * .86 for c in col]
    return tuple(col)
FACE = mat_tex('ChinaFace', make_image('AcrobatFace', 256, 128, face_px), .25)
IVORY = mat('Porcelain', (.86, .8, .72), .25)
CREAM = mat('CreamLace', (.8, .74, .62), .8)
ROSE = mat('FadedRose', (.55, .2, .2), .7)
HAIR = mat('AuburnHair', (.09, .025, .012), .55)
GILT = mat('Gilt', (.75, .52, .2), .35, .6)
EYE = mat('GlassEye', (.06, .03, .02), .1)
GLINT = mat('WarmGlint', (1, .6, .25), .2, 0, emit=(1, .55, .2), es=5, vcol=False)

# ---------- torso + peplum frill + ruff ----------
TOR = [(.112, .84), (.13, .9), (.124, .97), (.104, 1.06), (.11, 1.15), (.128, 1.24), (.136, 1.31), (.12, 1.37), (.07, 1.40), (.045, 1.41)]
attach(lathe('Leotard', TOR, HARL, segs=28, sy=.74, capb=True, capt=True), root, noisy=False)
for k, (z, r, m) in enumerate(((.905, .14, CREAM), (.885, .15, ROSE))):
    fr = lathe('Peplum%d' % k, [(r - .012, z + .02), (r, z), (r + .035, z - .045)], m, segs=48, sy=.8, zmod=lambda a, zz: .01 * math.sin(24 * a))
    attach(fr, root, amp=.2, freq=20)
for k, (z, r0, r1, m) in enumerate(((1.43, .05, .175, CREAM), (1.415, .05, .19, ROSE), (1.45, .045, .15, CREAM))):
    ruff = lathe('Ruff%d' % k, [(r0, z + .012), (r1 * .6, z + .004), (r1, z - .012)], m, segs=56, sy=.92, zmod=lambda a, zz: .016 * math.sin(26 * a))
    attach(ruff, root, amp=.2, freq=20)
for i, z in enumerate((1.33, 1.25, 1.17)):   # three cream pom buttons
    attach(ell('Pom%d' % i, (0, -.74 * .136 - .01, z), .016, .012, .016, CREAM, segs=10, rings=6), root, amp=.2)

# ---------- head ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.40), (0, 0, 1.47), [(0, .04), (1, .036)], IVORY, segs=10), hp, amp=.08)
fc = (0, 0, 1.53); RX, RY, RZ = .086, .09, .102
attach(ell('Face', fc, RX, RY, RZ, FACE, segs=24, rings=14), hp, noisy=False)
attach(ell('Hair', (0, .018, 1.545), .092, .092, .102, HAIR, segs=18, rings=10), hp, amp=.3, freq=22)
attach(ell('Bun', (0, .085, 1.585), .045, .042, .042, HAIR, segs=12, rings=7), hp, amp=.3, freq=22)
for s in (-1, 1):
    a = (270 + s * 18.5) * D; t = .59 * PI
    x = RX * math.sin(t) * math.cos(a); y = RY * math.sin(t) * math.sin(a); z = fc[2] - math.cos(t) * RZ
    attach(ell('Eye%d' % s, (x, y + .003, z), .013, .006, .011, EYE, segs=10, rings=6), hp, noisy=False)
    attach(ell('Glint%d' % s, (x + .003, y - .002, z + .003), .0035, .002, .003, GLINT, segs=6, rings=4), hp, noisy=False)
attach(ell('Nose', (0, -.091, 1.515), .008, .01, .012, IVORY, segs=8, rings=5), hp, amp=.05)
hat = empty('HatPivot', (.035, .0, 1.615), hp)
attach(lathe('Cap', [(.055, 1.615), (.048, 1.65), (.03, 1.69), (.012, 1.72), (0, 1.725)], HARL, segs=16, center=(.035, 0)), hat, noisy=False)
attach(torus('CapBrim', (.035, 0, 1.617), .055, .008, CREAM, segs=18, minor=5), hat, amp=.2)
attach(ell('CapPom', (.035, 0, 1.735), .022, .022, .022, ROSE, segs=10, rings=6), hat, amp=.2)
for c in hat.children: c.location.x += 0
hat.rotation_euler = (0, .32, 0)

# ---------- legs: harlequin tights, satin slippers with laced ribbons ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .07
    attach(limb('Tights' + key, (x, 0, .9), (x, 0, .07), [(0, .068), (.25, .064), (.48, .046), (.52, .047), (.78, .041), (1, .032)], HARL, segs=12), p, noisy=False)
    attach(ell('Slipper' + key, (x, -.035, .038), .035, .095, .036, CREAM, segs=12, rings=7), p, amp=.15)
    pts = [(x + .036 * math.cos(a * D), .036 * math.sin(a * D), .05 + .0006 * (a % 720)) for a in range(0, 900, 60)]
    attach(tube('Ribbon' + key, pts, .004, ROSE), p, amp=.2)

# ---------- arms: harlequin sleeves, porcelain hands, frilled cuffs ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    shp = (s * .16, 0, 1.33); el = (s * .195, -.02, 1.08); wr = (s * .21, -.085, .86)
    attach(ell('Puff' + key, (s * .165, 0, 1.335), .058, .055, .055, HARL, segs=14, rings=8), p, noisy=False)
    attach(limb('Upper' + key, shp, el, [(0, .046), (1, .036)], HARL, segs=10), p, noisy=False)
    attach(limb('Fore' + key, el, wr, [(0, .035), (1, .03)], HARL, segs=10), p, noisy=False)
    xf, L = between(el, wr)
    attach(lathe('CuffFrill' + key, [(.03, 0), (.045, .02), (.055, .035)], CREAM, segs=28, xf=xf @ Matrix.Translation((0, 0, L * .82)), zmod=lambda a, z: .006 * math.sin(16 * a)), p, amp=.2)
    attach(ell('Hand' + key, (s * .214, -.095, .815), .022, .02, .04, IVORY, segs=10, rings=6), p, amp=.06)
    attach(ell('Thumb' + key, (s * .214 - s * .008, -.115, .83), .008, .009, .018, IVORY, segs=8, rings=4), p, amp=.06)
# gilt hoop held in hand B
pB = P['ArmB']
attach(torus('Hoop', (.235, -.1, .62), .19, .011, GILT, rot=(0, PI / 2, 0), segs=40, minor=6), pB, amp=.35, freq=30)
for k in range(6):   # faded ribbon wraps on the hoop
    a = k * 60 * D
    attach(torus('HoopWrap%d' % k, (.235, -.1 + .19 * math.cos(a), .62 + .19 * math.sin(a)), .016, .004, ROSE, rot=(a, 0, 0), segs=8, minor=4), pB, amp=.2)
# ---------- ribbons streaming from the back of the ruff (Tail pivot) ----------
for s in (-1, 1):
    attach(box('BackRibbon%d' % s, (s * .03, .1, 1.24), (.028, .005, .36), ROSE, rot=(-.12, 0, s * .1), bevel=.002), P['Tail'], amp=.25)
attach(ell('RibbonKnot', (0, .085, 1.42), .024, .018, .02, ROSE, segs=10, rings=6), P['Tail'], amp=.2)

bpy.context.view_layer.update()
print('tris', tris())
