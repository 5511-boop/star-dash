import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(18)
root, P = setup('Diva', 1.40, (.15, 1.31), (.07, .85), (.14, .9))
# The Fallen Diva: torn ruby ballgown, mascara tears, a crooked tiara and wilted roses (warm-toned)
def face_px(u, v):
    du = u - .75
    col = [.86, .72, .66]
    if abs(du) < .25:
        for s in (-1, 1):
            d = math.hypot((du - s * .07) / .04, (v - .45) / .06)   # rouge
            if d < 1: k = (1 - d) * .45; col = [col[0] * (1 - k) + .8 * k, col[1] * (1 - k) + .35 * k, col[2] * (1 - k) + .35 * k]
            x = (du - s * .05) / .032
            if abs(x) < 1 and abs(v - (.6 + .012 * (1 - x * x))) < .016: col = [.08, .04, .05]     # heavy kohl
            if abs(x) < 1 and abs(v - (.67 - .02 * x * x)) < .005: col = [.06, .03, .03]       # brows
            # mascara tears: wobbling streaks running down from each eye
            for k, off in enumerate((-.012, .01)):
                tx = s * .05 + off + .006 * math.sin(v * 60 + k + s)
                if abs(du - tx) < .0045 * (1 - (.58 - v) * .8) and .3 < v < .59: col = [.07, .04, .06]
        # smeared red lips
        k = du / .032
        if abs(k) < 1.2 and abs(v - .335 + .01 * k) < .018 * max(0, 1 - k * k * .7) + .004: col = [.55, .05, .08]
    return tuple(col)
FACE = mat_tex('DivaFace', make_image('DivaFace', 256, 128, face_px), .45)
RUBY = mat('RubySilk', (.35, .01, .025), .35)
RUBYD = mat('RubyShadow', (.08, .0, .008), .6)
TULLE = mat('TornTulle', (.2, .05, .06), .8)
GLOVE = mat('OperaGloveBlack', (.01, .008, .01), .4)
HAIR = mat('DivaHair', (.02, .01, .01), .45)
GOLD = mat('TiaraGold', (.85, .62, .25), .25, .8)
GEM = mat('Garnet', (.6, .05, .08), .1, 0, emit=(.5, .05, .05), es=1.5, vcol=False)
PEARL = mat('Pearl', (.86, .8, .74), .18)
SKIN = mat('DivaSkin', (.8, .62, .55), .45)
STEM = mat('DeadStem', (.09, .1, .04), .7)
WILT = mat('WiltedRose', (.25, .02, .04), .6)

# ---------- ballgown: off-shoulder bodice, huge skirt slashed and torn ----------
tear = lambda a, z: (-.14 * abs(math.sin(a * 5 + 1)) ** 6 - .04 * abs(math.sin(a * 19)) if z < .1 else 0)
SK = [(.5, .04), (.48, .15), (.42, .35), (.33, .6), (.22, .82), (.14, .96), (.13, 1.0)]
attach(lathe('Skirt', SK, RUBY, segs=44, sy=.92, mod=lambda a, z: 1 + .04 * math.sin(10 * a) * max(0, (.9 - z) / .9), zmod=tear), root, amp=.3, freq=8, grad=(.04, .5, .35))
attach(lathe('SkirtIn', [(r - .014, z) for r, z in SK[:4]], RUBYD, segs=28, sy=.92, flip=True, zmod=tear), root, amp=.1)
# torn tulle underskirt peeking at the hem
attach(lathe('Petticoat', [(.48, .02), (.46, .1), (.4, .3)], TULLE, segs=40, sy=.92, mod=lambda a, z: 1 + .05 * math.sin(a * 23), zmod=lambda a, z: (-.05 * abs(math.sin(a * 11)) if z < .03 else 0)), root, amp=.3)
# slashes in the skirt: dark rips
for k in range(5):
    a = (-90 + random.uniform(-70, 70)) * D; z = random.uniform(.2, .55)
    r = (.33 + (.48 - .33) * (.6 - z) / .45) * 1.005
    attach(ell('Rip%d' % k, (r * math.cos(a), r * .92 * math.sin(a), z), .012, .006, .07, RUBYD, segs=8, rings=5), root, noisy=False)
attach(lathe('Bodice', [(.13, .98), (.13, 1.06), (.148, 1.16), (.158, 1.24), (.15, 1.28)], RUBY, segs=26, sy=.8, zmod=lambda a, z: (.025 * math.cos(2 * (a + PI / 2)) if z > 1.26 else 0)), root, amp=.25)
attach(lathe('Chest', [(.148, 1.24), (.15, 1.29), (.125, 1.33), (.08, 1.35), (.045, 1.36)], SKIN, segs=24, sy=.8, capt=True), root, amp=.1)
attach(torus('Neckline', (0, 0, 1.28), .152, .008, RUBYD, segs=26, minor=4, scale=(1, .8, 1)), root, amp=.2)
for k in range(13):   # pearl choker
    a = (-90 + (k - 6) * 22) * D
    attach(ell('Choker%d' % k, (.042 * math.cos(a), .042 * math.sin(a) - .002, 1.405), .006, .006, .006, PEARL, segs=6, rings=4), P['Head'], amp=.1)
attach(ell('ChokerGem', (0, -.05, 1.395), .008, .005, .011, GEM, segs=8, rings=5), P['Head'], noisy=False)

# ---------- head: piled curls coming down, kohl and mascara tears, crooked tiara ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.34), (0, 0, 1.45), [(0, .036), (1, .034)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.52); R = (.08, .086, .098)
attach(ell('Face', fc, *R, FACE, segs=24, rings=14), hp, noisy=False)
eyes(hp, fc, R, mat('DivaEye', (.05, .02, .02), .1), du=.05, v=.585, size=(.009, .005, .006), glint=mat('DivaGlint', (1, .7, .4), .2, 0, emit=(1, .6, .3), es=4, vcol=False))
attach(ell('Nose', on_face(fc, R, 0, .47), .007, .01, .012, SKIN, segs=8, rings=5), hp, amp=.1)
attach(ell('HairPile', (0, .02, 1.6), .09, .085, .07, HAIR, segs=16, rings=9), hp, amp=.3, freq=24)
for k in range(8):
    a = (k / 8) * 2 * PI
    attach(ell('Curl%d' % k, (.075 * math.cos(a), .02 + .07 * math.sin(a), 1.63 + .02 * math.sin(a * 2)), .03, .03, .03, HAIR, segs=10, rings=6), hp, amp=.3)
for s, ln in ((-1, .15), (1, .22)):   # fallen ringlets
    attach(tube('Ringlet%d' % s, [(s * .08, .0, 1.56), (s * .095, -.01, 1.5), (s * .09, .0, 1.44), (s * .1, .01, 1.56 - ln)], .012, HAIR), hp, amp=.3)
tia = empty('TiaraPivot', (0, -.02, 1.64), hp)
attach(tube('TiaraBand', [(.07 * math.cos(a * D), -.02 + .07 * math.sin(a * D), 1.64) for a in range(190, 351, 20)], .004, GOLD), tia, amp=.3)
for k in range(5):
    a = (215 + k * 27.5) * D; h = .03 if k == 2 else .018
    c = (.07 * math.cos(a), -.02 + .07 * math.sin(a), 1.64)
    attach(lathe('TiaraSpike%d' % k, [(.006, 0), (.002, h), (0, h + .004)], GOLD, segs=6, xf=Matrix.Translation(c)), tia, amp=.3)
    if k % 2 == 0: attach(ell('TiaraGem%d' % k, (c[0], c[1] - .005, c[2] + h * .6), .006, .004, .007, GEM, segs=6, rings=4), tia, noisy=False)
tia.rotation_euler = (0, -.22, .1)

# ---------- arms in long black gloves; a bouquet of wilted roses in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .15, 0, 1.31), (s * .19, -.03, 1.06), (s * .2, -.1, .85)
    attach(ell('Shoulder' + key, sh, .045, .042, .042, SKIN, segs=12, rings=7), p, amp=.1)
    attach(limb('Upper' + key, sh, el, [(0, .036), (1, .031)], SKIN, segs=10), p, amp=.1)
    attach(limb('GloveUp' + key, Vector(el) + (Vector(sh) - Vector(el)) * .3, el, [(0, .033), (1, .032)], GLOVE, segs=10), p, amp=.15)
    attach(limb('Fore' + key, el, wr, [(0, .031), (1, .026)], GLOVE, segs=10), p, amp=.15)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .035
    attach(ell('Hand' + key, tuple(hc), .022, .02, .036, GLOVE, segs=10, rings=6), p, amp=.15)
pB = P['ArmB']; hb = Vector((.21, -.14, .81))
for k in range(5):
    a = k * 72 * D
    tip = hb + Vector((.03 * math.cos(a), -.06 + .03 * math.sin(a), -.18 + .02 * k))
    attach(tube('Stem%d' % k, [tuple(hb + Vector((0, 0, .04))), tuple(hb.lerp(tip, .5)), tuple(tip)], .0035, STEM), pB, noisy=False)
    attach(ell('Wilt%d' % k, tuple(tip + Vector((0, 0, -.015))), .02, .018, .024, WILT, segs=8, rings=6), pB, amp=.3)
    attach(ell('Petal%d' % k, tuple(tip + Vector((.01, -.01, -.04))), .012, .004, .008, WILT, segs=6, rings=4), pB, noisy=False)
attach(torus('BouquetRibbon', tuple(hb + Vector((0, 0, .02))), .02, .005, GOLD, segs=10, minor=4), pB, amp=.2)

# ---------- legs (hidden), satin slippers ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .85), (x, 0, .07), [(0, .045), (1, .03)], SKIN, segs=10), P[key], amp=.1)
    attach(ell('Slipper' + key, (x, -.035, .035), .03, .085, .03, RUBYD, segs=10, rings=6), P[key], amp=.2)
# ---------- Tail: a torn train trailing behind ----------
attach(lathe('Train', [(.4, .3), (.47, .15), (.55, .03)], RUBY, segs=10, sy=.95, arc=(60 * D, 120 * D),
             zmod=lambda a, z: (-.08 * abs(math.sin(a * 13)) ** 3 if z < .05 else 0)), P['Tail'], amp=.3, grad=(.03, .3, .3))

bpy.context.view_layer.update()
print('tris', tris())
