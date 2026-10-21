import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(27)
L = .1   # she drifts
root, P = setup('Bride', 1.40 + L, (.15, 1.31 + L), (.07, .86 + L), (.0, 1.55 + L))
# The Ghost Bride: a gown and floating veil that glow like candlelight, a bouquet of dead roses (warm-toned; see-through in-game)
GOWN = mat('BridalGlow', (.95, .9, .82), .5, 0, emit=(1, .78, .5), es=.5)
LACE = mat('BridalLace', (.98, .94, .86), .6, 0, emit=(1, .8, .55), es=.6)
VEIL = mat('FloatingVeil', (.98, .94, .88), .4, 0, emit=(1, .8, .5), es=.7, alpha=.5, vcol=False)
SKIN = mat('GhostSkin', (.85, .8, .76), .4, 0, emit=(.6, .5, .4), es=.3)
HAIR = mat('PaleHair', (.55, .45, .35), .5)
PEARL = mat('Pearl', (.9, .86, .8), .18)
DEAD = mat('DeadRose', (.12, .02, .03), .7)
STEM = mat('DeadStem', (.06, .05, .03), .7)
EYE = mat('HollowEye', (.02, .01, .01), .3)

# ---------- gown: fitted bodice, full skirt fading into tatters ----------
fade = lambda a, z: (-.1 * abs(math.sin(a * 7 + 1)) ** 3 - .03 * abs(math.sin(a * 21)) if z < .05 + L else 0)
SK = [(.46, .04 + L), (.44, .15 + L), (.37, .4 + L), (.27, .68 + L), (.17, .9 + L), (.135, .98 + L), (.13, 1.0 + L)]
attach(lathe('Skirt', SK, GOWN, segs=40, sy=.9, mod=lambda a, z: 1 + .04 * math.sin(a * 12) * max(0, .9 + L - z), zmod=fade), root, amp=.2, freq=8)
for k, z in enumerate((.32, .6)):   # lace tiers
    r = .39 if k == 0 else .3
    attach(lathe('LaceTier%d' % k, [(r, z + L + .02), (r + .03, z + L - .02), (r + .035, z + L - .06)], LACE, segs=60, sy=.9, zmod=lambda a, zz: .012 * math.sin(a * 30)), root, amp=.2)
attach(lathe('Bodice', [(.13, .99 + L), (.135, 1.07 + L), (.15, 1.16 + L), (.155, 1.24 + L), (.14, 1.29 + L), (.1, 1.32 + L), (.055, 1.335 + L)], GOWN, segs=26, sy=.8, capt=True), root, amp=.15)
attach(lathe('LaceNeck', [(.06, 1.33 + L), (.065, 1.38 + L), (.075, 1.41 + L), (.07, 1.412 + L), (.058, 1.38 + L), (.055, 1.33 + L)], LACE, segs=24, closed=True, mod=lambda a, z: 1 + .04 * math.sin(a * 22)), root, amp=.15)
for k in range(9):
    attach(ell('Pearl%d' % k, (0, -.8 * .15 - .006, 1.27 + L - k * .03), .006, .006, .006, PEARL, segs=6, rings=4), root, amp=.1)

# ---------- head: pale face, hollow eyes, pearl tiara; the veil floats behind (Tail pivot) ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33 + L), (0, 0, 1.44 + L), [(0, .035), (1, .033)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.51 + L); R = (.08, .086, .098)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.1)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .05, .58)
    attach(ell('Hollow%d' % s, (x, y + .002, z), .016, .006, .012, EYE, segs=8, rings=5), hp, noisy=False)
attach(ell('Lips', on_face(fc, R, 0, .33), .012, .005, .005, mat('PaleLips', (.4, .25, .25), .5), segs=8, rings=5), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .47), .007, .01, .012, SKIN, segs=8, rings=5), hp, amp=.1)
attach(ell('HairUp', (0, .02, 1.56 + L), .088, .088, .085, HAIR, segs=16, rings=9), hp, amp=.2)
attach(ell('Chignon', (0, .08, 1.58 + L), .045, .04, .04, HAIR, segs=10, rings=6), hp, amp=.2)
for k in range(9):
    a = (225 + k * 11.25) * D
    attach(ell('Tiara%d' % k, (.088 * math.cos(a), .088 * math.sin(a), 1.6 + L + .012 * math.sin((k / 8) * PI)), .008, .008, .008, PEARL, segs=6, rings=4), hp, amp=.1)
tp = P['Tail']
veil = lathe('Veil', [(.1, 1.62 + L), (.15, 1.5 + L), (.2, 1.3 + L), (.26, 1.0 + L), (.34, .6 + L), (.42, .2 + L)], VEIL, segs=20, sy=.95, arc=(15 * D, 165 * D),
             mod=lambda a, z: 1 + .06 * math.sin(a * 7 + z * 8), zmod=lambda a, z: (-.08 * abs(math.sin(a * 5)) if z < .25 + L else 0))
veil.location = (0, .03, 0); attach(veil, tp, noisy=False)
attach(lathe('Blusher', [(.096, 1.6 + L), (.105, 1.55 + L), (.11, 1.5 + L), (.1, 1.45 + L)], VEIL, segs=12, arc=(-165 * D, -15 * D)), hp, noisy=False)

# ---------- arms in lace gloves; a bouquet of dead roses held in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .15, 0, 1.31 + L), (s * .19, -.03, 1.06 + L), (s * .2, -.1, .85 + L)
    attach(ell('Shoulder' + key, sh, .042, .04, .04, LACE, segs=10, rings=6), p, amp=.1)
    attach(limb('Upper' + key, sh, el, [(0, .033), (1, .028)], SKIN, segs=10), p, amp=.1)
    attach(limb('Glove' + key, el, wr, [(0, .029), (1, .025)], LACE, segs=10), p, amp=.1)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .03
    attach(ell('Hand' + key, tuple(hc), .021, .019, .034, LACE, segs=10, rings=6), p, amp=.1)
pB = P['ArmB']; h = Vector((.21, -.14, .8 + L))
for k in range(6):
    a = k / 6 * 2 * PI
    b = h + Vector((.035 * math.cos(a), -.03 + .035 * math.sin(a), .07))
    attach(tube('Stem%d' % k, [tuple(h + Vector((0, 0, -.1))), tuple(b)], .003, STEM), pB, noisy=False)
    attach(ell('Rose%d' % k, tuple(b + Vector((0, 0, .015))), .02, .02, .016, DEAD, segs=8, rings=5), pB, amp=.3)
attach(torus('BouquetRibbon', tuple(h + Vector((0, 0, -.02))), .018, .005, LACE, segs=10, minor=4), pB, amp=.1)
for k in range(3):   # fallen petals drifting under the bouquet
    attach(ell('Petal%d' % k, tuple(h + Vector((.02 * k - .02, -.05, -.15 - .08 * k))), .01, .003, .008, DEAD, segs=6, rings=4), pB, noisy=False)
# ---------- legs: none to see; pivots keep the hem swaying ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    attach(limb('Leg' + key, (s * .07, 0, .86 + L), (s * .07, 0, .2 + L), [(0, .04), (1, .03)], GOWN, segs=8), P[key], amp=.1)

bpy.context.view_layer.update()
print('tris', tris())
