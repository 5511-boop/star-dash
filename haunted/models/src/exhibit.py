import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(19)
root, P = setup('Exhibit', 1.40, (.15, 1.31), (.07, .86), (.14, .9))
# The Exhibit: a wax figure in a rose gown, slowly melting (warm-toned)
def face_px(u, v):
    du = u - .75
    col = [.9, .78, .68]
    if abs(du) < .25:
        for s in (-1, 1):   # painted doll features, the left eye sliding down the cheek
            drop = .07 if s > 0 else 0
            x = (du - s * .05) / .028
            if abs(x) < 1 and abs(v - (.58 - drop)) < .01 * (1 + drop * 8): col = [.15, .08, .06]
            if abs(x) < 1 and abs(v - (.66 - drop * .6)) < .004: col = [.4, .25, .15]
            d = math.hypot((du - s * .07) / .035, (v - .45) / .05)
            if d < 1: k = (1 - d) * .4; col = [col[0] * (1 - k) + .85 * k, col[1] * (1 - k) + .45 * k, col[2] * (1 - k) + .45 * k]
        k = du / .025
        if abs(k) < 1 and abs(v - .335 + .02 * max(0, k)) < .015 * (1 - k * k) + .003: col = [.65, .15, .2]
        if du > .03 and v < .52 and (u * 60) % 1 < .3: col = [c * .96 for c in col]   # run marks
    return tuple(col)
FACE = mat_tex('WaxDollFace', make_image('WaxDollFace', 256, 128, face_px), .3)
GOWN = mat('RoseSatin', (.62, .2, .26), .35)
GOWND = mat('RoseShadow', (.2, .05, .07), .6)
WAX = mat('FleshWax', (.9, .78, .68), .3)
HAIR = mat('WaxCurls', (.75, .55, .3), .35)
PEARL = mat('Pearl', (.86, .8, .74), .18)
VELVET = mat('RopeVelvet', (.35, .03, .05), .9)
BRASS = mat('Brass', (.8, .58, .22), .25, .8)

# ---------- gown: drips of wax run off the hem and sleeves ----------
drip = lambda a, z: (-.12 * max(0, math.sin(a * 7 + 1)) ** 8 - .05 * max(0, math.sin(a * 13)) ** 6 if z < .08 else 0)
SK = [(.44, .05), (.42, .15), (.36, .38), (.27, .65), (.18, .88), (.14, .97), (.135, 1.0)]
attach(lathe('Gown', SK, GOWN, segs=40, sy=.88, mod=lambda a, z: 1 + .04 * math.sin(a * 10) * max(0, .9 - z), zmod=drip), root, amp=.25, freq=9, grad=(.05, .4, .3))
attach(lathe('GownIn', [(r - .014, z) for r, z in SK[:4]], GOWND, segs=24, sy=.88, flip=True, zmod=drip), root, amp=.1)
attach(lathe('Bodice', [(.135, .98), (.14, 1.06), (.155, 1.16), (.16, 1.24), (.145, 1.28)], GOWN, segs=26, sy=.8), root, amp=.2)
attach(lathe('Decolletage', [(.145, 1.27), (.13, 1.31), (.09, 1.335), (.05, 1.345)], WAX, segs=24, sy=.8, capt=True), root, amp=.1)
attach(torus('Neckline', (0, 0, 1.28), .147, .01, GOWND, segs=26, minor=4, scale=(1, .8, 1)), root, amp=.2)
for k in range(10):   # wax pooling and running down the bodice
    a = random.uniform(-150, -30) * D; z0 = random.uniform(1.15, 1.32)
    r = .155
    p0 = Vector((r * math.cos(a), r * .8 * math.sin(a) - .004, z0))
    attach(tube('BodiceDrip%d' % k, [tuple(p0), tuple(p0 + Vector((0, -.004, -.05 - .04 * (k % 3))))], .006, WAX), root, amp=.1)
for k in range(11):
    a = (-90 + (k - 5) * 14) * D
    attach(ell('Pearl%d' % k, (.1 * math.cos(a), .1 * .8 * math.sin(a) - .006, 1.31 - .03 * math.cos((k - 5) / 5 * PI / 2)), .007, .007, .007, PEARL, segs=6, rings=4), root, amp=.1)

# ---------- head: wax doll face, curls sagging, a museum number tag ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.44), [(0, .036), (1, .034)], WAX, segs=10), hp, amp=.1)
fc = (0, 0, 1.51); R = (.08, .086, .098)
attach(ell('Face', fc, *R, FACE, segs=24, rings=14), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .47), .007, .01, .012, WAX, segs=8, rings=5), hp, amp=.1)
attach(ell('HairPile', (0, .02, 1.585), .085, .085, .065, HAIR, segs=16, rings=8), hp, amp=.15)
for k in range(10):
    a = k / 10 * 2 * PI
    sag = .03 if math.cos(a) > .3 else 0
    attach(ell('Curl%d' % k, (.08 * math.cos(a), .02 + .075 * math.sin(a), 1.57 - sag), .026, .026, .03 + sag, HAIR, segs=8, rings=6), hp, amp=.15)
for k in range(4):   # chin and jaw dripping
    a = Vector(on_face(fc, R, .02 + k * .015, .3)); b = a + Vector((0, -.004, -.05 - .015 * k))
    attach(tube('ChinDrip%d' % k, [tuple(a), tuple(b)], .005, WAX), hp, amp=.1)
    attach(ell('ChinBead%d' % k, tuple(b), .007, .007, .009, WAX, segs=6, rings=4), hp, amp=.1)

# ---------- arms with dripping fingers; a velvet rope hook held in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .15, 0, 1.31), (s * .19, -.03, 1.06), (s * .2, -.1, .85)
    attach(ell('Puff' + key, (s * .155, 0, 1.31), .05, .048, .048, GOWN, segs=12, rings=7), p, amp=.2)
    attach(limb('Upper' + key, sh, el, [(0, .034), (1, .029)], WAX, segs=10), p, amp=.1)
    attach(limb('Fore' + key, el, wr, [(0, .028), (1, .024)], WAX, segs=10), p, amp=.1)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .03
    attach(ell('Hand' + key, tuple(hc), .021, .019, .034, WAX, segs=10, rings=6), p, amp=.1)
    attach(tube('FingerDrip' + key, [tuple(hc + Vector((0, 0, -.03))), tuple(hc + Vector((0, -.005, -.09)))], .005, WAX), p, amp=.1)
pB = P['ArmB']; h = Vector((.21, -.13, .81))
attach(tube('Rope', [tuple(h), tuple(h + Vector((.03, .05, -.15))), tuple(h + Vector((.0, .12, -.3)))], .014, VELVET), pB, amp=.2)
attach(torus('RopeHook', tuple(h + Vector((0, 0, .02))), .02, .005, BRASS, rot=(PI / 2, 0, 0), segs=10, minor=4), pB, amp=.2)
# ---------- legs ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .86), (x, 0, .07), [(0, .045), (1, .03)], WAX, segs=10), P[key], amp=.1)
    attach(ell('Slipper' + key, (x, -.035, .035), .03, .085, .03, GOWND, segs=10, rings=6), P[key], amp=.15)
# ---------- Tail: a hanging exhibit tag on a ribbon at the back ----------
attach(tube('TagRibbon', [(0, .12, 1.0), (0, .15, .9)], .003, VELVET), P['Tail'], noisy=False)
attach(box('Tag', (0, .155, .86), (.06, .004, .04), mat('TagCard', (.85, .8, .65), .8), bevel=.003), P['Tail'], amp=.2)

bpy.context.view_layer.update()
print('tris', tris())
