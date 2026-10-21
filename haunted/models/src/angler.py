import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(21)
root, P = setup('Angler', 1.40, (.15, 1.31), (.07, .86), (.14, .95))
# The Angler Queen: eel-skin gown, a mouth of needle teeth, a glowing lure dangling before her face (warm-toned)
EEL = mat('EelSkin', (.12, .02, .05), .25, .1)
EELD = mat('EelBelly', (.04, .01, .02), .4)
FIN = mat('FinMembrane', (.35, .08, .1), .4)
SKIN = mat('DeepSkin', (.1, .04, .06), .3)
TOOTH = mat('NeedleTooth', (.9, .88, .8), .2)
MOUTH = mat('MouthDark', (.02, .0, .01), .9)
LURE = mat('LureGlow', (1, .75, .3), .2, 0, emit=(1, .7, .25), es=10, vcol=False)
SPOT = mat('Biolume', (1, .55, .2), .3, 0, emit=(1, .5, .15), es=3, vcol=False)
EYE = mat('PaleEye', (.85, .8, .7), .1, 0, emit=(.6, .55, .4), es=1, vcol=False)
PUPIL = mat('Pupil', (.0, .0, .0), .1)
GOLD = mat('AbyssGold', (.75, .5, .2), .3, .8)

# ---------- gown: eel skin with finned ruffles and glowing spots ----------
GW = [(.4, .03), (.38, .15), (.32, .38), (.24, .65), (.17, .88), (.135, .98), (.14, 1.08), (.155, 1.18), (.15, 1.26), (.12, 1.31), (.07, 1.335)]
attach(lathe('Gown', GW, EEL, segs=36, sy=.85, capt=True, mod=lambda a, z: 1 + .04 * math.sin(a * 6 + z * 10)), root, amp=.3, freq=10)
for k, (z, r) in enumerate(((.05, .4), (.35, .33), (.62, .25))):   # finned ruffles, spined
    attach(lathe('Fin%d' % k, [(r, z + .02), (r + .05, z - .02), (r + .07, z - .07)], FIN, segs=48, sy=.85, zmod=lambda a, zz: .025 * abs(math.sin(a * 14))), root, amp=.25)
for k in range(20):
    a = random.uniform(-170, -10) * D; z = random.uniform(.2, 1.2)
    r = 0
    for (r0, z0), (r1, z1) in zip(GW, GW[1:]):
        if z0 <= z <= z1: r = r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    attach(ell('Spot%d' % k, (r * math.cos(a) * 1.02, r * .85 * math.sin(a) * 1.02, z), .008, .004, .008, SPOT, segs=6, rings=4), root, noisy=False)
attach(lathe('FinCollar', [(.06, 1.33), (.14, 1.36), (.22, 1.4)], FIN, segs=32, sy=.85, arc=(-10 * D, 190 * D), zmod=lambda a, z: .05 * abs(math.sin(a * 9)) if z > 1.38 else 0), root, amp=.25)

# ---------- head: wide-jawed, needle teeth, pale eyes, dorsal fin crown, lure on a stalk ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.44), [(0, .04), (1, .038)], SKIN, segs=10), hp, amp=.15)
fc = (0, 0, 1.52); R = (.088, .092, .1)
attach(ell('Head', fc, *R, SKIN, segs=22, rings=12), hp, amp=.2)
attach(ell('Jaw', (0, -.03, 1.46), .085, .075, .045, SKIN, segs=16, rings=8), hp, amp=.2)
attach(ell('Mouth', (0, -.085, 1.47), .068, .02, .034, MOUTH, segs=14, rings=6), hp, noisy=False)
for k in range(9):   # needle teeth, top and bottom
    x = (k - 4) * .013
    for up, z in ((1, 1.502), (-1, 1.438)):
        attach(lathe('Tooth%d%d' % (k, up), [(.0045, 0), (.0, .032 + .01 * (k % 2))], TOOTH, segs=4,
                     xf=Matrix.Translation((x, -.092 + abs(x) * .3, z)) @ Matrix.Rotation(PI if up > 0 else 0, 4, 'X')), hp, noisy=False)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .06, .62)
    attach(ell('Eye%d' % s, (x, y, z), .015, .01, .015, EYE, segs=10, rings=6), hp, noisy=False)
    attach(ell('Pupil%d' % s, (x, y - .01, z), .007, .004, .007, PUPIL, segs=6, rings=4), hp, noisy=False)
attach(lathe('DorsalFin', [(.02, 1.6), (.015, 1.68), (0, 1.72)], FIN, segs=6, sx=.3, sy=3, zmod=lambda a, z: .02 * math.sin(a * 6)), hp, amp=.25)
for s in (-1, 1):
    f = lathe('SideFin%d' % s, [(.03, 0), (.02, .07), (0, .1)], FIN, segs=6, sy=.25, xf=Matrix.Translation((s * .085, .02, 1.55)) @ Matrix.Rotation(s * -1.0, 4, 'Y'))
    attach(f, hp, amp=.25)
stalk = [(0, -.05, 1.6), (0, -.06, 1.7), (0, -.14, 1.76), (0, -.22, 1.72), (0, -.25, 1.63)]
attach(tube('LureStalk', stalk, .005, SKIN), hp, amp=.2)
attach(ell('Lure', (0, -.25, 1.6), .025, .025, .03, LURE, segs=10, rings=7), hp, noisy=False)
attach(torus('Crown', (0, 0, 1.6), .075, .006, GOLD, segs=20, minor=4), hp, amp=.3)

# ---------- arms: webbed hands, fin-trimmed sleeves ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .15, 0, 1.31), (s * .19, -.03, 1.06), (s * .2, -.1, .85)
    attach(ell('Shoulder' + key, sh, .045, .042, .042, EEL, segs=12, rings=7), p, amp=.3)
    attach(limb('Upper' + key, sh, el, [(0, .035), (1, .03)], EEL, segs=10), p, amp=.3)
    attach(limb('Fore' + key, el, wr, [(0, .029), (1, .025)], SKIN, segs=10), p, amp=.2)
    xf, L = between(el, wr)
    attach(lathe('SleeveFin' + key, [(.03, 0), (.06, .05), (.07, .07)], FIN, segs=16, xf=xf @ Matrix.Translation((0, 0, L * .05)), zmod=lambda a, z: .015 * abs(math.sin(a * 6))), p, amp=.25)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .035
    attach(ell('Hand' + key, tuple(hc), .026, .012, .038, SKIN, segs=10, rings=6), p, amp=.2)
    for k in range(4):
        attach(limb('Claw%s%d' % (key, k), tuple(hc + Vector((s * (k - 1.5) * .01, -.005, -.03))), tuple(hc + Vector((s * (k - 1.5) * .012, -.01, -.075))), [(0, .004), (1, .001)], TOOTH, segs=4), p, noisy=False)
# ---------- legs (hidden) ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .86), (x, 0, .07), [(0, .045), (1, .03)], EELD, segs=10), P[key], amp=.1)
    attach(ell('Foot' + key, (x, -.035, .035), .03, .085, .03, EELD, segs=10, rings=6), P[key], amp=.1)
# ---------- Tail: a long eel-tail train ----------
attach(lathe('EelTrain', [(.3, .5), (.35, .25), (.42, .03)], EEL, segs=10, sy=.9, arc=(60 * D, 120 * D), zmod=lambda a, z: (-.06 * abs(math.sin(a * 8)) if z < .05 else 0)), P['Tail'], amp=.3)
attach(lathe('TrainFin', [(.42, .04), (.48, .02), (.52, -.0)], FIN, segs=10, sy=.9, arc=(60 * D, 120 * D), zmod=lambda a, z: .03 * abs(math.sin(a * 12))), P['Tail'], amp=.25)

bpy.context.view_layer.update()
print('tris', tris())
