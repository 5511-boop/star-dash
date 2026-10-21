import math
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
reset()
PI = math.pi; D = PI / 180
root = empty('Ballerina_Root', (0, 0, 0))
P = {
    'Head': empty('Pivot_Head', (0, 0, 1.37), root),
    'ArmA': empty('Pivot_ArmA', (-.145, 0, 1.29), root),
    'ArmB': empty('Pivot_ArmB', (.145, 0, 1.29), root),
    'LegA': empty('Pivot_LegA', (-.065, 0, .88), root),
    'LegB': empty('Pivot_LegB', (.065, 0, .88), root),
    'Tail': empty('Pivot_Tail', (0, .09, .95), root),
}
# The Clockwork Ballerina: polished brass body, ivory bodice and tutu, a winding key in her back (warm-toned)
BRASS = mat('PolishedBrass', (.78, .54, .2), .28, 1.0)
BRONZE = mat('BronzeJoint', (.32, .18, .07), .38, 1.0)
IVORY = mat('IvorySatin', (.86, .8, .7), .5)
TULLE = mat('IvoryTulle', (.9, .84, .76), .85)
ROSE = mat('RoseRibbon', (.6, .28, .26), .55)
GLOW = mat('AmberEye', (1, .6, .25), .2, 0, emit=(1, .55, .2), es=6, vcol=False)

def face_px(u, v):
    du = u - .75
    b = noise.noise(Vector((u * 20, v * 20, 3))) * .5 + .5
    col = [.86 * (.92 + .08 * b), .64 * (.92 + .08 * b), .3]          # brass, slightly mottled
    if abs(du) < .25:
        for s in (-1, 1):
            d = math.hypot((du - s * .068) / .036, (v - .44) / .06)
            if d < 1: k = (1 - d) * .55; col = [col[0] * (1 - k) + .85 * k, col[1] * (1 - k) + .38 * k, col[2] * (1 - k) + .35 * k]
            x = (du - s * .047) / .03
            if abs(x) < 1 and abs(v - (.66 - .02 * x * x)) < .005: col = [.18, .09, .03]
            if abs(x) < 1.1 and abs(v - (.57 + .015 * (1 - x * x))) < .004: col = [.12, .06, .02]   # painted upper lashes
        k = du / .028
        if abs(k) < 1 and abs(v - .335) < .016 * (1 - k * k) + .003: col = [.6, .14, .14]
        if abs(du) < .004 and .40 < v < .5: col = [c * .75 for c in col]   # seam line down the nose
    return tuple(col)
FACE = mat_tex('BrassFace', make_image('BallerinaFace', 256, 128, face_px), .3, .55)

# ---------- brass torso with an ivory sweetheart bodice ----------
TOR = [(.1, .88), (.116, .92), (.098, 1.0), (.102, 1.1), (.12, 1.19), (.126, 1.26), (.108, 1.32), (.06, 1.35), (.034, 1.36)]
SY = .74
attach(lathe('BrassTorso', TOR, BRASS, segs=26, sy=SY, capb=True, capt=True), root, amp=.12, freq=14)
heart = lambda a, z: (-.035 * math.exp(-((a / D + 90) / 18) ** 2) + .012 * math.cos(2 * (a + PI / 2)) ** 2 if z > 1.2 else 0)
bod = lathe('Bodice', [(r * 1.035, z) for r, z in TOR[1:6]], IVORY, segs=28, sy=SY, zmod=heart)
attach(bod, root, amp=.15, freq=18)
for s in (-1, 1):   # boning seams on the bodice
    for x in (.03, .07):
        attach(tube('Boning%d%d' % (s, int(x * 100)), [(s * x, -SY * math.sqrt(max(.104 ** 2 - x * x, 0)) * 1.05 - .004, z) for z in (.93, 1.02, 1.1, 1.17)], .0025, IVORY), root, amp=.1)
# rivets around the brass shoulders
for k in range(14):
    a = k * (360 / 14) * D
    attach(ell('Rivet%d' % k, (.118 * math.cos(a), .118 * SY * math.sin(a), 1.285), .006, .006, .006, BRONZE, segs=6, rings=4), root, amp=.2)
# neck: segmented brass with bronze rings
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.44), [(0, .034), (1, .03)], BRASS, segs=12), P['Head'], amp=.1)
for z in (1.36, 1.39, 1.42):
    attach(torus('NeckRing%d' % int(z * 100), (0, 0, z), .033, .004, BRONZE, segs=14, minor=4), P['Head'], amp=.2)
# ---------- tutu: three scalloped tulle layers ----------
for k, (z, r) in enumerate(((.955, .34), (.935, .37), (.915, .4))):
    sc = lambda a, zz, k=k: 1 + .035 * abs(math.sin(14 * a + k))
    tu = lathe('Tutu%d' % k, [(.105, z + .015), (r * .6, z + .004), (r, z - .012)], TULLE, segs=56, mod=sc, zmod=lambda a, zz, k=k: .01 * math.sin(9 * a + k * 2))
    attach(tu, root, amp=.18, freq=16, seed=k)
attach(torus('Waistband', (0, 0, .962), .108, .009, ROSE, segs=24, minor=5, scale=(1, SY, 1)), root, amp=.2)

# ---------- head: brass face, glowing amber eyes, sculpted bun, a tiara of gears ----------
hp = P['Head']
fc = (0, 0, 1.5); RX, RY, RZ = .082, .086, .098
attach(ell('Face', fc, RX, RY, RZ, FACE, segs=24, rings=14), hp, noisy=False)
for s in (-1, 1):
    a = (270 + s * 17) * D; t = .58 * PI
    x = RX * math.sin(t) * math.cos(a); y = RY * math.sin(t) * math.sin(a); z = fc[2] - math.cos(t) * RZ
    attach(ell('Eye%d' % s, (x, y + .002, z), .012, .005, .008, GLOW, segs=8, rings=5), hp, noisy=False)
attach(ell('HairShell', (0, .015, 1.515), .088, .088, .098, BRASS, segs=18, rings=10), hp, amp=.15, freq=20)
attach(torus('Bun', (0, .06, 1.585), .03, .016, BRASS, rot=(.9, 0, 0), segs=16, minor=6), hp, amp=.15)
attach(ell('BunCore', (0, .065, 1.58), .026, .026, .026, BRASS, segs=10, rings=6), hp, amp=.15)
for s in (-1, 1):   # hair grooves
    attach(tube('Groove%d' % s, [(s * .02, -.06, 1.585), (s * .05, .0, 1.6), (s * .03, .07, 1.57)], .003, BRONZE), hp, amp=.1)
for k in range(5):   # tiara of tiny gears, the middle one turns
    a = (270 + (k - 2) * 22) * D
    c = (.088 * math.cos(a), .088 * math.sin(a), 1.585 + (.012 if k == 2 else 0))
    if k == 2:
        g = spin('TiaraGear', c, (PI / 2, 0, 0), hp)
        attach(torus('TGRim', c, .016, .004, BRASS, rot=(PI / 2, 0, 0), segs=14, minor=4), g, amp=.2)
        for t in range(8):
            b = t * 45 * D
            attach(box('TGTooth%d' % t, (c[0] + .02 * math.cos(b), c[1], c[2] + .02 * math.sin(b)), (.006, .004, .006), BRASS, rot=(0, -b, 0)), g, amp=.2)
        attach(ell('TGJewel', (c[0], c[1] - .003, c[2]), .006, .004, .006, ROSE, segs=8, rings=5), g, noisy=False)
    else:
        attach(torus('TGear%d' % k, c, .01, .003, BRASS, rot=(PI / 2, 0, a + PI / 2), segs=10, minor=4), hp, amp=.2)

# ---------- legs: brass with bronze ball joints, ivory pointe shoes with crossed ribbons ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .065
    attach(ell('Hip' + key, (x, 0, .88), .05, .05, .05, BRONZE, segs=12, rings=7), p, amp=.2)
    attach(limb('Thigh' + key, (x, 0, .88), (x, 0, .5), [(0, .055), (1, .042)], BRASS, segs=12), p, amp=.12)
    attach(ell('Knee' + key, (x, 0, .49), .044, .044, .044, BRONZE, segs=12, rings=7), p, amp=.2)
    attach(limb('Shin' + key, (x, 0, .49), (x, 0, .13), [(0, .04), (.4, .04), (1, .026)], BRASS, segs=12), p, amp=.12)
    attach(ell('Ankle' + key, (x, 0, .125), .026, .026, .026, BRONZE, segs=10, rings=6), p, amp=.2)
    attach(ell('Pointe' + key, (x, -.012, .065), .03, .036, .068, IVORY, segs=12, rings=8), p, amp=.15)
    attach(box('PointeTip' + key, (x, -.014, .004), (.04, .04, .008), IVORY, bevel=.004), p, amp=.1)
    pts = [(x + .03 * math.cos(a * D), .03 * math.sin(a * D), .1 + .0005 * (a % 1000)) for a in range(0, 900, 45)]
    attach(tube('Ribbon' + key, pts, .0035, ROSE), p, amp=.2)

# ---------- arms: brass, graceful, bronze joints ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    shp = (s * .145, 0, 1.29); el = (s * .2, -.03, 1.06); wr = (s * .21, -.1, .86)
    attach(ell('Shoulder' + key, shp, .038, .038, .038, BRONZE, segs=12, rings=7), p, amp=.2)
    attach(limb('Upper' + key, shp, el, [(0, .033), (1, .028)], BRASS, segs=10), p, amp=.12)
    attach(ell('Elbow' + key, el, .029, .029, .029, BRONZE, segs=10, rings=6), p, amp=.2)
    attach(limb('Fore' + key, el, wr, [(0, .027), (1, .021)], BRASS, segs=10), p, amp=.12)
    attach(ell('Wrist' + key, wr, .02, .02, .02, BRONZE, segs=8, rings=5), p, amp=.2)
    attach(ell('Hand' + key, (s * .212, -.112, .825), .016, .02, .035, BRASS, segs=10, rings=6), p, amp=.12)
    for k in range(3):
        attach(ell('Finger%s%d' % (key, k), (s * .212 + (k - 1) * .008, -.125, .79), .005, .006, .02, BRASS, segs=6, rings=4), p, amp=.12)
    attach(torus('Bracelet' + key, tuple(Vector(el) + (Vector(wr) - Vector(el)) * .8), .025, .004, ROSE, rot=between(el, wr)[0].to_euler(), segs=12, minor=4), p, amp=.2)

# ---------- the winding key in her back (turns slowly: Spin_) ----------
ky = SY * .102 + .004
key = spin('WindKey', (0, ky, 1.12), (-PI / 2, 0, 0), root)
attach(limb('KeyShaft', (0, ky - .01, 1.12), (0, ky + .075, 1.12), [(0, .009), (1, .009)], BRASS, segs=10), key, amp=.2)
attach(ell('KeyCollar', (0, ky + .005, 1.12), .018, .008, .018, BRONZE, segs=12, rings=6), key, amp=.2)
for s in (-1, 1):
    attach(torus('KeyWing%d' % s, (s * .048, ky + .085, 1.12), .042, .009, BRASS, rot=(PI / 2, 0, 0), segs=18, minor=5, scale=(1.15, .8, 1)), key, amp=.2)
attach(ell('KeyHub', (0, ky + .085, 1.12), .014, .014, .014, BRASS, segs=10, rings=6), key, amp=.2)
# ---------- Tail: rose sash bow at the back of the waist ----------
tp = P['Tail']
for s in (-1, 1):
    attach(ell('SashLoop%d' % s, (s * .045, .1, .965), .045, .014, .025, ROSE, segs=12, rings=6), tp, amp=.2)
    attach(box('SashTail%d' % s, (s * .03, .12, .80), (.03, .006, .28), ROSE, rot=(-.15, 0, s * .12), bevel=.002), tp, amp=.2)
attach(ell('SashKnot', (0, .098, .965), .018, .014, .018, ROSE, segs=8, rings=5), tp, amp=.2)

bpy.context.view_layer.update()
print('tris', tris())
