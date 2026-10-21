import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(15)
L = .06
root, P = setup('Fairy', 1.36 + L, (.14, 1.27 + L), (.065, .84 + L), (.0, 1.15 + L))
# The Bloom Fairy: a gown of petals, dragonfly wings, a flower crown, a dandelion wand (warm-toned)
PET = [mat('PetalRose', (.85, .35, .4), .5), mat('PetalPeach', (.95, .55, .35), .5), mat('PetalGold', (.95, .72, .25), .5)]
LEAF = mat('Leaf', (.15, .35, .08), .6)
SKIN = mat('FairySkin', (.82, .6, .5), .45)
HAIR = mat('HoneyHair', (.55, .3, .08), .5)
WING = mat('DragonflyWing', (.85, .8, .6), .1, 0, emit=(.5, .45, .2), es=.4, alpha=.45, vcol=False)
VEIN = mat('WingVein', (.5, .35, .15), .4)
DAND = mat('Dandelion', (.95, .95, .9), .6, 0, emit=(.9, .85, .6), es=.8, vcol=False)
EYE = mat('FairyEye', (.2, .5, .15), .2, 0, emit=(.4, .8, .2), es=1.5, vcol=False)
STEM = mat('Stem', (.12, .3, .06), .6)

# ---------- petal gown: layers of overlapping petals ----------
attach(lathe('Bodice', [(.11, .95 + L), (.12, 1.05 + L), (.135, 1.14 + L), (.14, 1.2 + L), (.12, 1.25 + L), (.08, 1.275 + L), (.05, 1.28 + L)], LEAF, segs=22, sy=.8, capt=True), root, amp=.3)
attach(lathe('Underskirt', [(.11, .95 + L), (.15, .8 + L), (.2, .55 + L), (.23, .3 + L)], LEAF, segs=24, sy=.85), root, amp=.3)
for ring, (z, r, n, ln) in enumerate(((.95, .13, 10, .2), (.8, .19, 12, .26), (.62, .25, 14, .3), (.44, .3, 16, .28))):
    for k in range(n):
        a = k / n * 2 * PI + ring * .3
        c = Vector((r * math.cos(a), r * .85 * math.sin(a), z + L - ln * .45))
        p = ell('Petal%d_%d' % (ring, k), tuple(c), .055 + ring * .008, .012, ln * .5, PET[(k + ring) % 3], segs=8, rings=6)
        p.rotation_euler = (math.sin(a) * .35, -math.cos(a) * .35, a + PI / 2)
        attach(p, root if math.sin(a) < .5 else P['Tail'], amp=.25, freq=20)
for k in range(8):   # petal collar
    a = k / 8 * 2 * PI
    p = ell('Collar%d' % k, (.09 * math.cos(a), .075 * math.sin(a), 1.27 + L), .04, .01, .025, PET[k % 3], segs=8, rings=5)
    p.rotation_euler = (math.sin(a) * .9, -math.cos(a) * .9, 0); attach(p, root, amp=.2)

# ---------- head: honey hair, flower crown ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.27 + L), (0, 0, 1.38 + L), [(0, .033), (1, .031)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.45 + L); R = (.078, .083, .095)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.1)
eyes(hp, fc, R, EYE, du=.05, v=.585, size=(.011, .005, .008))
attach(ell('Nose', on_face(fc, R, 0, .47), .006, .009, .011, SKIN, segs=8, rings=5), hp, amp=.1)
attach(ell('Lips', on_face(fc, R, 0, .33), .012, .005, .005, PET[0], segs=8, rings=5), hp, noisy=False)
attach(ell('HairCap', (0, .016, 1.47 + L), .085, .088, .098, HAIR, segs=18, rings=10), hp, amp=.3)
hair = lathe('HairFall', [(.08, 1.48 + L), (.095, 1.38 + L), (.1, 1.25 + L), (.09, 1.15 + L)], HAIR, segs=14, arc=(20 * D, 160 * D), sy=.9, mod=lambda a, z: 1 + .06 * math.sin(a * 9 + z * 20))
hair.location = (0, .02, 0); attach(hair, hp, amp=.3)
for k in range(9):   # flower crown
    a = (k / 9) * 2 * PI
    c = (.085 * math.cos(a), .088 * math.sin(a), 1.535 + L)
    attach(ell('CrownBloom%d' % k, c, .018, .018, .012, PET[k % 3], segs=8, rings=5), hp, amp=.2)
    attach(ell('CrownCore%d' % k, (c[0], c[1], c[2] + .008), .007, .007, .006, PET[2], segs=6, rings=4), hp, noisy=False)
    attach(ell('CrownLeaf%d' % k, (.09 * math.cos(a + .35), .093 * math.sin(a + .35), 1.53 + L), .014, .005, .008, LEAF, segs=6, rings=4), hp, noisy=False)

# ---------- dragonfly wings on her back (two pairs, veined, faintly glowing) ----------
for s in (-1, 1):
    for k, (z, ln, tilt) in enumerate(((1.24, .32, .35), (1.12, .26, -.15))):
        c = Vector((s * (.04 + ln * .45), .12, z + L))
        w = ell('Wing%d%d' % (s, k), tuple(c), ln * .5, .004, .055 - k * .01, WING, segs=14, rings=6)
        w.rotation_euler = (0, s * tilt, s * .25); attach(w, root, noisy=False)
        attach(tube('Vein%d%d' % (s, k), [(s * .04, .12, z + L), tuple(c + Vector((s * ln * .45 * math.cos(tilt), 0, ln * .45 * math.sin(tilt) * s * s)))], .002, VEIN), root, noisy=False)

# ---------- arms; a dandelion clock as a wand in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .14, 0, 1.27 + L), (s * .18, -.03, 1.03 + L), (s * .19, -.1, .83 + L)
    attach(ell('Shoulder' + key, sh, .038, .036, .036, SKIN, segs=10, rings=6), p, amp=.1)
    attach(limb('Upper' + key, sh, el, [(0, .03), (1, .026)], SKIN, segs=10), p, amp=.1)
    attach(limb('Fore' + key, el, wr, [(0, .025), (1, .021)], SKIN, segs=10), p, amp=.1)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .03
    attach(ell('Hand' + key, tuple(hc), .018, .016, .03, SKIN, segs=8, rings=5), p, amp=.1)
    attach(torus('Bracelet' + key, tuple(Vector(el).lerp(Vector(wr), .85)), .024, .006, LEAF, rot=between(el, wr)[0].to_euler(), segs=10, minor=4), p, amp=.2)
pB = P['ArmB']; h = Vector((.2, -.13, .8 + L))
attach(limb('WandStem', tuple(h + Vector((0, 0, -.06))), tuple(h + Vector((0, -.04, .3))), [(0, .004), (1, .003)], STEM, segs=5), pB, amp=.2)
attach(ell('Puff', tuple(h + Vector((0, -.045, .34))), .045, .045, .045, DAND, segs=12, rings=8), pB, noisy=False)
for k in range(5):   # seeds drifting away from the puff
    a = k * 1.3
    attach(ell('Seed%d' % k, tuple(h + Vector((.06 * math.cos(a), -.05 + .06 * math.sin(a), .4 + k * .025))), .006, .006, .006, DAND, segs=5, rings=3), pB, noisy=False)

# ---------- legs: barely seen, petal slippers ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .065
    attach(limb('Leg' + key, (x, 0, .84 + L), (x, 0, .07 + L), [(0, .04), (1, .026)], SKIN, segs=10), P[key], amp=.1)
    attach(ell('Slipper' + key, (x, -.03, .035 + L), .028, .075, .028, PET[0], segs=10, rings=6), P[key], amp=.2)

bpy.context.view_layer.update()
print('tris', tris())
