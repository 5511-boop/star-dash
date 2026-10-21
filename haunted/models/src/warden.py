import math
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py').read())
reset()
PI = math.pi
root = empty('Warden_Root', (0, 0, 0))
P = {
    'Head': empty('Pivot_Head', (0, 0, 1.52), root),
    'ArmA': empty('Pivot_ArmA', (-.235, 0, 1.43), root),
    'ArmB': empty('Pivot_ArmB', (.235, 0, 1.43), root),
    'LegA': empty('Pivot_LegA', (-.1, 0, .92), root),
    'LegB': empty('Pivot_LegB', (.1, 0, .92), root),
    'Tail': empty('Pivot_Tail', (0, .2, .8), root),
}
# ---------- materials (linear colours) ----------
COAT = mat('Coat', (.022, .042, .125), .88)
LINING = mat('Lining', (.012, .014, .04), .9)
SILVER = mat('TarnishedSilver', (.46, .48, .52), .42, 1.0)
BRASS = mat('Brass', (.62, .42, .13), .34, 1.0)
LEATHER = mat('Leather', (.014, .011, .011), .5)
GLOVE = mat('Glove', (.012, .012, .016), .6)
FELT = mat('Felt', (.014, .022, .06), .86)
BAND = mat('HatBand', (.006, .01, .028), .6)
SHADE = mat('FaceShade', (.003, .003, .006), .95)
EYE = mat('Eye', (.6, .9, 1), .2, 0, emit=(.55, .85, 1), es=9, vcol=False)
GLOW = mat('LanternGlow', (1, .6, .2), .3, 0, emit=(1, .6, .2), es=5, vcol=False)
FLAME = mat('Flame', (1, .85, .5), .3, 0, emit=(1, .8, .4), es=14, vcol=False)
TROUSER = mat('Trouser', (.01, .013, .028), .9)

def fold(a, z):
    return 1 + .04 * math.sin(9 * a + 1.5 * z) * max(0, (.85 - z) / .4)

SY = .66
UPPER = [(.318, .80), (.285, .88), (.232, .98), (.208, 1.06), (.222, 1.18), (.248, 1.30), (.256, 1.38), (.246, 1.45), (.205, 1.495), (.13, 1.525), (.085, 1.535)]
SKIRT = [(.384, .40), (.376, .46), (.35, .58), (.332, .70), (.318, .80)]
RP = SKIRT[:-1] + UPPER

def rprof(z):
    for (r0, z0), (r1, z1) in zip(RP, RP[1:]):
        if z0 <= z <= z1: return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return RP[-1][0]

def surf(x, z, off=.004):
    r = rprof(z)
    return (x, -SY * math.sqrt(max(r * r - x * x, 0)) / r * r / r * 1.0 - off, z) if False else (x, -SY * math.sqrt(max(r * r - x * x, 0)) - off, z)

def ring_pts(R, z, a0, a1, n, modf=None, sy=SY):
    pts = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        k = modf(a, z) if modf else 1
        pts.append((R * k * math.cos(a), R * k * sy * math.sin(a), z))
    return pts

# ---------- legs ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .1
    attach(limb('Trouser' + key, (x, 0, .92), (x, 0, .38), [(0, .075), (.5, .06), (1, .053)], TROUSER, segs=12), p, amp=.15)
    shaft = lathe('Boot' + key, [(.058, .12), (.062, .22), (.067, .34), (.077, .40), (.071, .412), (.062, .40)], LEATHER, segs=14, closed=False, capb=False)
    attach(shaft, p, amp=.3, seed=s, freq=14)
    # worn leather instep + toe
    attach(ell('Foot' + key, (x, -.06, .05), .052, .135, .052, LEATHER, segs=14, rings=8), p, amp=.35, freq=12, seed=s + 3)
    attach(box('Sole' + key, (x, -.05, .012), (.098, .29, .024), LEATHER, bevel=.006), p, amp=.1)
    attach(box('Heel' + key, (x, .045, .03), (.072, .07, .05), LEATHER, bevel=.005), p, amp=.1)
    attach(torus('BootTrim' + key, (x, 0, .405), .074, .0065, SILVER, segs=16, minor=5), p, amp=.5, freq=20)
    for k, (zz, rr) in enumerate(((.30, .067), (.21, .061))):
        attach(torus('BootStrap%s%d' % (key, k), (x, 0, zz), rr, .007, LEATHER, segs=16, minor=5), p, amp=.2)
        attach(box('BootBuckle%s%d' % (key, k), (x, -rr - .003, zz), (.022, .007, .02), SILVER, bevel=.002), p, amp=.5, freq=25)

# ---------- coat body ----------
body = lathe('CoatBody', UPPER, COAT, segs=36, sy=SY, capt=True)
attach(body, root, amp=.3, freq=11, seed=5, grad=(.8, 1.0, .25))
front = lambda a, z: fold(a, z)
tailf = lambda a, z: fold(a, z) * 1.014
skf = lathe('CoatSkirtFront', SKIRT, COAT, segs=40, mod=front, sy=SY, arc=(135 * PI / 180, 405 * PI / 180))
attach(skf, root, amp=.35, freq=9, seed=2, grad=(.46, .75, .45))
skl = lathe('CoatSkirtLiningF', [(r - .012, z) for r, z in SKIRT], LINING, segs=40, mod=front, sy=SY, arc=(135 * PI / 180, 405 * PI / 180), flip=True)
attach(skl, root, amp=.1)
skt = lathe('CoatTail', SKIRT, COAT, segs=12, mod=tailf, sy=SY, arc=(45 * PI / 180, 135 * PI / 180))
attach(skt, P['Tail'], amp=.35, freq=9, seed=7, grad=(.46, .75, .45))
sktl = lathe('CoatTailLining', [(r - .012, z) for r, z in SKIRT], LINING, segs=12, mod=tailf, sy=SY, arc=(45 * PI / 180, 135 * PI / 180), flip=True)
attach(sktl, P['Tail'], amp=.1)
# hem piping (silver thread)
hemF = tube('HemF', ring_pts(.385, .402, 135 * PI / 180, 405 * PI / 180, 44, front), .0055, SILVER)
attach(hemF, root, amp=.6, freq=22, seed=1)
hemT = tube('HemT', ring_pts(.385 * 1.014, .402, 45 * PI / 180, 135 * PI / 180, 10, tailf), .0055, SILVER)
attach(hemT, P['Tail'], amp=.6, freq=22, seed=1)
# collar
collar = lathe('Collar', [(.108, 1.49), (.112, 1.56), (.118, 1.60), (.134, 1.645), (.128, 1.648), (.108, 1.60), (.101, 1.56), (.098, 1.49)], COAT, segs=26, sy=.92, closed=True)
attach(collar, root, amp=.3, freq=12, seed=9)
attach(tube('CollarPiping', ring_pts(.1305, 1.6465, 0, 2 * PI, 26, None, .92), .0035, SILVER, closed=True), root, amp=.6, freq=22)
# front closure overlap + lapels
for s in (-1, 1):
    pts = [surf(s * .105, 1.515), surf(s * .20, 1.43), surf(s * .15, 1.33), surf(s * .06, 1.22)]
    attach(tube('LapelEdge%d' % s, pts, .0045, SILVER), root, amp=.6, freq=22)
seam = [surf(.05, z, .006) for z in (1.27, 1.1, .95, .8, .6, .475)]
attach(tube('FrontOverlap', seam, .006, COAT), root, amp=.3)
attach(tube('FrontSeam', [surf(.05, z, .0085) for z in (1.27, 1.1, .95, .8, .6, .475)], .0022, SILVER), root, amp=.6, freq=22)
# buttons
bz = [1.17, 1.07, .97, .87, .76, .65]
for s in (-1, 1):
    for i, z in enumerate(bz):
        x, y, zz = surf(s * .075 + (s * .0 if s < 0 else 0), z, .0)
        b = ell('Button%d_%d' % (s, i), (x, y - .004, zz), .0165, .009, .0165, SILVER, segs=10, rings=6)
        attach(b, root, amp=.6, freq=40, seed=i * 3 + s)
        attach(torus('ButtonRim%d_%d' % (s, i), (x, y - .006, zz), .0165, .0025, SILVER, rot=(PI / 2, 0, 0), segs=10, minor=4), root, amp=.5, freq=40)
# back waist buttons + vent seam
for s in (-1, 1):
    attach(ell('BackBtn%d' % s, (s * .055, SY * .205 + .006, 1.06), .014, .008, .014, SILVER, segs=8, rings=5), root, amp=.6, freq=40)
attach(tube('BackSeam', [(0, SY * .208 + .001, 1.08), (0, SY * .26 + .001, .95), (0, SY * .31 + .001, .82)], .004, COAT), root)
# pocket flaps, watch chain
for s in (-1, 1):
    x, y, z = surf(s * .14, .90, .006)
    attach(box('PocketFlap%d' % s, (x, y, z), (.11, .012, .038), COAT, rot=(0, 0, -s * .5), bevel=.003), root, amp=.3)
    attach(ell('FlapBtn%d' % s, (x - s * .0, y - .008, z - .01), .009, .006, .009, SILVER, segs=8, rings=5), root, amp=.6, freq=40)
chain = [surf(-.075, 1.27, .012), surf(-.02, 1.235, .01), surf(.05, 1.225, .01), surf(.12, 1.255, .01), surf(.15, 1.27, .01)]
attach(tube('WatchChain', chain, .0028, SILVER), root, amp=.5, freq=30)
attach(ell('WatchFob', surf(-.02, 1.20, .012), .011, .005, .015, SILVER, segs=8, rings=6), root, amp=.5, freq=30)

# ---------- head, hat ----------
attach(ell('Face', (0, 0, 1.70), .097, .105, .113, SHADE, segs=20, rings=12), P['Head'], noisy=False)
for s in (-1, 1):
    attach(ell('Eye%d' % s, (s * .037, -.094, 1.715), .0165, .007, .0085, EYE, segs=10, rings=6), P['Head'], noisy=False)
hp = empty('HatPivot', (0, 0, 1.74), P['Head'])
brim = lathe('HatBrim', [(.115, 1.752), (.19, 1.752), (.26, 1.758), (.30, 1.783), (.312, 1.796), (.304, 1.797), (.298, 1.788), (.265, 1.744), (.19, 1.738), (.115, 1.74)], FELT, segs=40, sy=1.04, closed=True)
attach(brim, hp, amp=.35, freq=7, seed=4)
crown_mod = lambda a, z: 1 - .12 * _smoothstep(1.8, 1.91, z) * abs(math.cos(a))
crown = lathe('HatCrown', [(.112, 1.74), (.113, 1.76), (.11, 1.84), (.10, 1.895), (.085, 1.91), (.04, 1.915), (0, 1.913)], FELT, segs=28, mod=crown_mod, sy=1.1)
attach(crown, hp, amp=.35, freq=8, seed=6)
attach(lathe('HatBand', [(.1165, 1.742), (.1165, 1.778), (.1128, 1.778), (.1128, 1.742)], BAND, segs=28, sy=1.1, closed=True), hp, amp=.2)
attach(box('HatBuckle', (0, -.1295, 1.76), (.032, .006, .03), SILVER, bevel=.002), hp, amp=.6, freq=30)
attach(box('HatBuckleIn', (0, -.1335, 1.76), (.018, .004, .017), BAND, bevel=.001), hp, noisy=False)
attach(tube('BrimPiping', ring_pts(.308, 1.797, 0, 2 * PI, 40, None, 1.04), .0035, SILVER, closed=True), hp, amp=.6, freq=20)
hp.rotation_euler.x = .05

# ---------- arms ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh = (s * .235, 0, 1.43); el = (s * .288, -.03, 1.13); wr = (s * .30, -.115, .89)
    attach(ell('Shoulder' + key, sh, .072, .068, .07, COAT, segs=14, rings=8), p, amp=.3, freq=11, seed=3)
    attach(limb('Upper' + key, sh, el, [(0, .062), (.55, .056), (1, .05)], COAT, segs=12), p, amp=.3, freq=11, seed=s)
    attach(ell('Elbow' + key, el, .052, .052, .052, COAT, segs=12, rings=7), p, amp=.3, freq=11)
    attach(limb('Fore' + key, el, wr, [(0, .05), (.6, .047), (.92, .054), (1, .056)], COAT, segs=12), p, amp=.3, freq=11, seed=s + 2)
    xf, L = between(el, wr)
    for t, rr in ((.93, .0585), ):
        c = Vector(el) + (Vector(wr) - Vector(el)) * t
        tor = torus('Cuff' + key, tuple(c), rr, .0075, SILVER, segs=14, minor=5)
        tor.rotation_euler = xf.to_euler(); attach(tor, p, amp=.6, freq=26)
        for k in range(3):
            cc = Vector(el) + (Vector(wr) - Vector(el)) * (.78 - .06 * k)
            b = ell('CuffBtn%s%d' % (key, k), tuple(cc + Vector((s * .0, -.052, 0))), .009, .006, .009, SILVER, segs=8, rings=5)
            attach(b, p, amp=.6, freq=40)
    # glove + fingers
    hand_c = (s * .30, -.125, .835)
    attach(ell('Hand' + key, hand_c, .033, .032, .046, GLOVE, segs=12, rings=7), p, amp=.2, freq=14)
    attach(ell('Thumb' + key, (s * .30 - s * .008, -.158, .845), .012, .014, .026, GLOVE, segs=8, rings=5), p, amp=.2)
    if key == 'ArmA':
        for k in range(3):
            attach(ell('Fing%d' % k, (s * .30 + (k - 1) * .01, -.14, .795), .0095, .011, .02, GLOVE, segs=7, rings=4), p, amp=.2)
# silver epaulettes
for s in (-1, 1):
    e = ell('Epaulette%d' % s, (s * .245, 0, 1.485), .062, .045, .014, SILVER, segs=14, rings=6)
    e.rotation_euler = (0, s * .35, 0); attach(e, P['ArmA' if s < 0 else 'ArmB'], amp=.6, freq=30)
    for k in range(3):
        attach(tube('Fringe%d_%d' % (s, k), [(s * (.215 + k * .027), -.02, 1.48), (s * (.22 + k * .027), -.025, 1.43)], .0025, SILVER), P['ArmA' if s < 0 else 'ArmB'], amp=.5)

# ---------- brass lantern on a chain (hand B) ----------
pB = P['ArmB']
hx, hy = .30, -.125
top = .655
for i in range(8):
    z = .82 - i * .021
    l = torus('Link%d' % i, (hx, hy, z), .0085, .0022, BRASS, rot=(PI / 2, 0, (PI / 2) * (i % 2)), segs=10, minor=4, scale=(1, 1.45, 1))
    attach(l, pB, amp=.4, freq=40)
attach(torus('LanternRing', (hx, hy, .64), .026, .0045, BRASS, rot=(PI / 2, 0, 0), segs=16, minor=5), pB, amp=.4, freq=30)
lz0 = .35
attach(lathe('LanternBase', [(.056, lz0), (.058, lz0 + .012), (.05, lz0 + .026), (.046, lz0 + .03), (0, lz0 + .03)], BRASS, segs=18, capb=True, center=(hx, hy, 0)), pB, amp=.5, freq=25)
attach(lathe('LanternGlass', [(.042, lz0 + .03), (.042, lz0 + .165), (0, lz0 + .165)], GLOW, segs=6, center=(hx, hy, 0)), pB, noisy=False)
attach(ell('LanternFlame', (hx, hy, lz0 + .1), .016, .016, .03, FLAME, segs=10, rings=7), pB, noisy=False)
for k in range(6):
    a = k * PI / 3
    attach(tube('LPost%d' % k, [(hx + .043 * math.cos(a), hy + .043 * math.sin(a), lz0 + .028), (hx + .043 * math.cos(a), hy + .043 * math.sin(a), lz0 + .168)], .0045, BRASS), pB, amp=.4, freq=30)
attach(lathe('LanternCap', [(.056, lz0 + .166), (.058, lz0 + .176), (.046, lz0 + .192), (.026, lz0 + .21), (.012, lz0 + .226), (.014, lz0 + .236), (0, lz0 + .24)], BRASS, segs=18, center=(hx, hy, 0)), pB, amp=.5, freq=25)

# ---------- finish: report ----------
bpy.context.view_layer.update()
print('tris', tris())
