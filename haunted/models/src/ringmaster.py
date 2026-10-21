import math
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
reset()
PI = math.pi; D = PI / 180
root = empty('Ringmaster_Root', (0, 0, 0))
P = {
    'Head': empty('Pivot_Head', (0, 0, 1.50), root),
    'ArmA': empty('Pivot_ArmA', (-.225, 0, 1.42), root),
    'ArmB': empty('Pivot_ArmB', (.225, 0, 1.42), root),
    'LegA': empty('Pivot_LegA', (-.095, 0, .92), root),
    'LegB': empty('Pivot_LegB', (.095, 0, .92), root),
    'Tail': empty('Pivot_Tail', (0, .14, 1.0), root),
}
# The Last Ringmaster: moth-eaten crimson tailcoat; cool accents (teal velvet, tarnished silver braid, ice-blue eyes)
CRIMSON = mat('MothCrimson', (.28, .016, .02), .78)
LININGC = mat('CrimsonLining', (.07, .004, .008), .85)
TEAL = mat('TealVelvet', (.006, .055, .065), .7)
BRAID = mat('SilverBraid', (.5, .52, .56), .4, 1.0)
WAIST = mat('BlackSatin', (.008, .008, .011), .35)
SHIRT = mat('Shirt', (.62, .64, .68), .7)
JOD = mat('Jodhpurs', (.42, .39, .33), .85)
BOOT = mat('BootGloss', (.006, .006, .008), .22)
GLOVE = mat('WhiteGlove', (.66, .66, .68), .6)
HAT = mat('HatSilk', (.01, .01, .013), .45)
WHIP = mat('WhipLeather', (.03, .014, .008), .5)
EYE = mat('IceEye', (.6, .9, 1), .2, 0, emit=(.5, .85, 1), es=8, vcol=False)

def face_px(u, v):
    du = u - .75
    col = [.93, .92, .9]
    # wear: grey greasepaint cracking
    n = noise.noise(Vector((u * 40, v * 20, 1.3))) * .5 + .5
    col = [c * (.9 + .1 * n) for c in col]
    if abs(du) < .25:
        # eye diamonds
        for s in (-1, 1):
            dd = abs(du - s * .055) / .03 + abs(v - .6) / .1
            if dd < 1: col = [.02, .03, .04]
        # arched brows
        for s in (-1, 1):
            x = (du - s * .06) / .035
            if abs(x) < 1 and abs(v - (.74 - .03 * x * x)) < .008: col = [.02, .02, .03]
        # the too-wide painted grin, ear to ear
        if abs(du) < .19:
            k = du / .19
            yg = .34 + .13 * k * k
            t = .03 * (1 - k * k) + .01
            d = abs(v - yg)
            if d < t + .009: col = [.03, .01, .01]
            if d < t:
                col = [.62, .04, .06]
                if (du * 70) % 1 < .14: col = [.05, .01, .01]     # stitched teeth
            if abs(d - t * .2) < .002 and abs(k) < .9: col = [.08, .01, .02]
        # red nose dot
        if (du / .02) ** 2 + ((v - .5) / .04) ** 2 < 1: col = [.7, .05, .07]
    return tuple(col)

FACE_IMG = make_image('RingmasterFace', 256, 128, face_px)
FACE = mat_tex('PaintedFace', FACE_IMG, .55)

SY = .66
TORSO = [(.20, .98), (.195, 1.04), (.212, 1.16), (.238, 1.28), (.248, 1.36), (.238, 1.43), (.2, 1.475), (.12, 1.50), (.07, 1.51)]
def rt(z):
    for (r0, z0), (r1, z1) in zip(TORSO, TORSO[1:]):
        if z0 <= z <= z1: return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return TORSO[-1][0]
def surf(x, z, off=.004):
    r = rt(z); return (x, -SY * math.sqrt(max(r * r - x * x, 0)) - off, z)

# ---------- torso: coat, waistcoat, shirt, lapels ----------
coat = lathe('Coat', TORSO, CRIMSON, segs=34, sy=SY, capt=True)
attach(coat, root, amp=.3, freq=10, seed=4, grad=(.98, 1.2, .2)); holes(coat, 16, .7)
front = (-90 - 33) * D, (-90 + 33) * D
wc = lathe('Waistcoat', [(r * 1.02, z) for r, z in TORSO[:6]], WAIST, segs=12, sy=SY, arc=front)
attach(wc, root, amp=.15)
sh = lathe('ShirtFront', [(r * 1.035, z) for r, z in TORSO[4:8]], SHIRT, segs=6, sy=SY, arc=(-104 * D, -76 * D))
attach(sh, root, amp=.1)
for s in (-1, 1):
    a0, a1 = sorted(((-90 - s * 33) * D, (-90 - s * 47) * D))
    lp = lathe('Lapel%d' % s, [(r * 1.04, z) for r, z in TORSO[2:7]], TEAL, segs=4, sy=SY, arc=(a0, a1))
    attach(lp, root, amp=.2)
    attach(tube('LapelBraid%d' % s, [surf(s * .13, 1.18, .012), surf(s * .17, 1.30, .012), surf(s * .15, 1.42, .012), surf(s * .085, 1.47, .012)], .004, BRAID), root, amp=.6, freq=24)
# frogging: silver braid bars across the chest with loops and toggles
for i, z in enumerate((1.07, 1.15, 1.23, 1.31)):
    attach(tube('Frog%d' % i, [surf(-.13, z, .014), surf(-.06, z + .01, .02), surf(0, z, .022), surf(.06, z + .01, .02), surf(.13, z, .014)], .0045, BRAID), root, amp=.6, freq=24)
    for s in (-1, 1):
        x, y, zz = surf(s * .135, z, .016)
        attach(torus('FrogLoop%d%d' % (i, s), (x, y, zz), .014, .0035, BRAID, rot=(PI / 2, 0, 0), segs=10, minor=4), root, amp=.6, freq=24)
    x, y, zz = surf(0, z, .026)
    attach(ell('Toggle%d' % i, (x, y, zz), .016, .007, .007, BRAID, segs=8, rings=5), root, amp=.6, freq=30)
# wing collar + bow tie
attach(lathe('WingCollar', [(.064, 1.47), (.066, 1.53), (.072, 1.545), (.068, 1.547), (.061, 1.53), (.059, 1.47)], SHIRT, segs=18, sy=.95, closed=True), root, amp=.1)
for s in (-1, 1):
    attach(ell('BowLobe%d' % s, (s * .034, -.07, 1.49), .03, .012, .02, WAIST, segs=10, rings=6), root, noisy=False)
attach(ell('BowKnot', (0, -.075, 1.49), .012, .01, .014, WAIST, segs=8, rings=5), root, noisy=False)
# epaulettes with silver fringe
for s in (-1, 1):
    pa = P['ArmA' if s < 0 else 'ArmB']
    e = ell('Epaulette%d' % s, (s * .232, 0, 1.475), .062, .048, .016, BRAID, segs=14, rings=6)
    e.rotation_euler = (0, s * .35, 0); attach(e, pa, amp=.6, freq=30)
    for k in range(4):
        attach(tube('Fringe%d_%d' % (s, k), [(s * (.2 + k * .022), -.025 + k * .01, 1.47), (s * (.205 + k * .022), -.03 + k * .01, 1.415)], .0028, BRAID), pa, amp=.5)
# hips under the cut-away front
attach(lathe('Hips', [(.165, .80), (.185, .88), (.19, .96), (.19, 1.0)], JOD, segs=20, sy=.72), root, amp=.2)
# ---------- tails: long, tattered, hinged at the back of the waist ----------
TAILP = [(.205, .99), (.218, .85), (.232, .70), (.248, .55)]
tatter = lambda a, z: (-.05 * abs(math.sin(a * 23) * math.sin(a * 7 + 1))) if z < .56 else 0
for k, (a0, a1) in enumerate(((36 * D, 88 * D), (92 * D, 144 * D))):
    tl = lathe('Tail%d' % k, TAILP, CRIMSON, segs=10, sy=SY * 1.04, arc=(a0, a1), zmod=tatter)
    attach(tl, P['Tail'], amp=.35, freq=9, seed=k, grad=(.5, .8, .35)); holes(tl, 16, .68, seed=k)
    li = lathe('TailLining%d' % k, [(r - .01, z) for r, z in TAILP], LININGC, segs=10, sy=SY * 1.04, arc=(a0, a1), flip=True, zmod=tatter)
    attach(li, P['Tail'], amp=.15)
for s in (-1, 1):
    attach(ell('TailBtn%d' % s, (s * .04, SY * .205 + .012, .985), .013, .008, .013, BRAID, segs=8, rings=5), P['Tail'], amp=.6, freq=40)

# ---------- head: painted face, glowing eyes, battered top hat ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.58), [(0, .046), (1, .044)], FACE, segs=10), hp, noisy=False)
fc = (0, 0, 1.64); RX, RY, RZ = .1, .106, .118
attach(ell('Face', fc, RX, RY, RZ, FACE, segs=24, rings=14), hp, noisy=False)
for s in (-1, 1):
    a = (270 + s * 19.8) * D; t = .6 * PI
    x = RX * math.sin(t) * math.cos(a); y = RY * math.sin(t) * math.sin(a); z = fc[2] - math.cos(t) * RZ
    attach(ell('Eye%d' % s, (x * 1.02, y - .006, z), .011, .006, .008, EYE, segs=8, rings=5), hp, noisy=False)
for s in (-1, 1):   # slicked dark hair at the temples, tucked under the hat
    attach(ell('Tuft%d' % s, (s * .075, .04, 1.685), .03, .055, .035, WAIST, segs=10, rings=6), hp, amp=.2)
hat = empty('HatPivot', (0, 0, 1.715), hp)
hb = 1.715
attach(lathe('HatBrim', [(.104, hb), (.16, hb), (.19, hb + .01), (.2, hb + .026), (.193, hb + .031), (.17, hb + .017), (.104, hb + .013)], HAT, segs=30, sy=1.1, closed=True), hat, amp=.3)
crown = lathe('HatCrown', [(.104, hb + .012), (.103, hb + .08), (.107, hb + .17), (.112, hb + .215), (.096, hb + .22), (0, hb + .219)], HAT, segs=26, sy=1.12, mod=lambda a, z: 1 + .035 * math.sin(3 * a + z * 22))
attach(crown, hat, amp=.35, freq=10); holes(crown, 20, .7)
attach(lathe('HatBand', [(.1065, hb + .014), (.1065, hb + .055), (.1035, hb + .055), (.1035, hb + .014)], CRIMSON, segs=26, sy=1.12, closed=True), hat, amp=.3)
attach(ell('HatBuckle', (0, -.12, hb + .035), .016, .006, .016, BRAID, segs=8, rings=5), hat, amp=.6, freq=30)
hat.rotation_euler = (-.05, .14, 0)

# ---------- legs: flared jodhpurs, glossy riding boots ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .095
    attach(limb('Jod' + key, (x, 0, .93), (x, 0, .50), [(0, .088), (.3, .102), (.65, .072), (1, .056)], JOD, segs=14), p, amp=.25, freq=12)
    attach(lathe('Boot' + key, [(.056, .1), (.06, .25), (.064, .45), (.072, .56), (.068, .565), (.06, .55)], BOOT, segs=16, center=(x, 0)), p, amp=.15, freq=14)
    attach(ell('Foot' + key, (x, -.06, .05), .052, .14, .052, BOOT, segs=14, rings=8), p, amp=.15)
    attach(box('Sole' + key, (x, -.05, .012), (.098, .3, .024), BOOT, bevel=.006), p, amp=.1)
    attach(box('Heel' + key, (x, .05, .03), (.07, .07, .05), BOOT, bevel=.005), p, amp=.1)
    attach(torus('BootCuff' + key, (x, 0, .555), .07, .007, BRAID, segs=16, minor=5), p, amp=.6, freq=22)

# ---------- arms ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    shp = (s * .225, 0, 1.42); el = (s * .275, -.03, 1.13); wr = (s * .29, -.115, .9)
    attach(ell('Shoulder' + key, shp, .068, .064, .066, CRIMSON, segs=14, rings=8), p, amp=.3)
    up = limb('Upper' + key, shp, el, [(0, .058), (.55, .052), (1, .047)], CRIMSON, segs=12); attach(up, p, amp=.3); holes(up, 16, .72)
    attach(ell('Elbow' + key, el, .048, .048, .048, CRIMSON, segs=12, rings=7), p, amp=.3)
    fo = limb('Fore' + key, el, wr, [(0, .047), (.7, .045), (1, .048)], CRIMSON, segs=12); attach(fo, p, amp=.3); holes(fo, 16, .72, seed=5)
    xf, L = between(el, wr)
    c = Vector(el) + (Vector(wr) - Vector(el)) * .85
    cuff = lathe('Cuff' + key, [(.05, 0), (.054, .07), (.05, .072)], TEAL, segs=14, xf=xf @ Matrix.Translation((0, 0, L * .78)))
    attach(cuff, p, amp=.2)
    for t in (.82, .9):
        tor = torus('CuffBraid%s%d' % (key, int(t * 10)), tuple(Vector(el) + (Vector(wr) - Vector(el)) * t), .0545, .0035, BRAID, segs=14, minor=4)
        tor.rotation_euler = xf.to_euler(); attach(tor, p, amp=.6, freq=26)
    hc = (s * .295, -.125, .84)
    attach(ell('Glove' + key, hc, .033, .031, .045, GLOVE, segs=12, rings=7), p, amp=.15)
    attach(ell('Thumb' + key, (s * .295 - s * .008, -.157, .85), .012, .014, .025, GLOVE, segs=8, rings=5), p, amp=.15)
# the whip (hand B): leather handle with a silver pommel, coiled lash hanging below
pB = P['ArmB']
attach(limb('WhipHandle', (.295, -.13, .80), (.30, -.2, .99), [(0, .016), (.85, .013), (1, .011)], WHIP, segs=8), pB, amp=.3, freq=30)
attach(ell('WhipPommel', (.295, -.128, .795), .019, .019, .016, BRAID, segs=10, rings=6), pB, amp=.5)
for k, (zz, R) in enumerate(((.74, .075), (.70, .068), (.665, .072))):
    tr = torus('Coil%d' % k, (.31, -.125, zz), R, .0065, WHIP, rot=(PI / 2 - .25, .2 * k, PI / 2), segs=22, minor=5)
    attach(tr, pB, amp=.3)
attach(tube('Lash', [(.31, -.14, .64), (.33, -.12, .52), (.31, -.08, .40), (.34, -.03, .30)], .004, WHIP), pB, amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
