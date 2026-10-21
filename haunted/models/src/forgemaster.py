import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(22)
root, P = setup('Forgemaster', 1.5, (.25, 1.4), (.1, .9), (.0, 1.0))
# The Forgemaster: arms of cooling magma, an ember beard, a blue-steel apron and hammer (cool accents on a fire-born smith)
MAGMA = mat_glow_tex('MagmaSkin', make_image('MagmaSkin', 256, 256, magma_px), .6, 3)
APRON = mat('BlueSteelLeather', (.04, .07, .12), .45)
STEEL = mat('BlueSteel', (.3, .4, .55), .3, 1.0)
CHAR = mat('Charcoal', (.03, .025, .025), .8)
EMBER = mat('EmberBeard', (1, .4, .05), .4, 0, emit=(1, .35, .05), es=2.2, vcol=False)
SPARK = mat('Spark', (1, .7, .2), .3, 0, emit=(1, .6, .15), es=8, vcol=False)
EYE = mat('ColdFireEye', (.6, .85, 1), .2, 0, emit=(.5, .8, 1), es=9, vcol=False)
BOOT = mat('ForgeBoot', (.04, .03, .025), .5)
BELT = mat('Belt', (.06, .04, .025), .6)

SY = .72
TOR = [(.22, .86), (.235, .96), (.26, 1.1), (.29, 1.24), (.3, 1.33), (.28, 1.41), (.22, 1.46), (.12, 1.49), (.07, 1.495)]
attach(lathe('Torso', TOR, MAGMA, segs=28, sy=SY, capt=True), root, noisy=False)
attach(lathe('Apron', [(.27, .45), (.25, .7), (.24, .9), (.26, 1.1), (.29, 1.25), (.29, 1.33)], APRON, segs=14, sy=SY * 1.05, arc=(-140 * D, -40 * D)), root, amp=.4, freq=12)
for s in (-1, 1):
    attach(tube('ApronStrap%d' % s, [(s * .12, -SY * .3 - .01, 1.33), (s * .15, -.05, 1.46), (s * .1, .15, 1.4)], .012, APRON), root, amp=.4)
attach(torus('Belt', (0, 0, .9), .24, .022, BELT, segs=28, minor=5, scale=(1, SY * 1.05, 1)), root, amp=.4)
attach(box('Buckle', (0, -SY * .25 - .025, .9), (.06, .012, .05), STEEL, bevel=.005), root, amp=.4)
attach(box('ApronPocket', (0, -SY * .26 - .02, .72), (.14, .01, .1), APRON, bevel=.006), root, amp=.4)
attach(lathe('Hips', [(.22, .78), (.235, .86)], APRON, segs=22, sy=.75), root, amp=.4)

# ---------- head: bald and scarred, cold-fire eyes, a beard of embers ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.45), (0, 0, 1.55), [(0, .065), (1, .058)], MAGMA, segs=12), hp, noisy=False)
fc = (0, 0, 1.63); R = (.1, .105, .115)
attach(ell('Head', fc, *R, MAGMA, segs=22, rings=12), hp, noisy=False)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .05, .58)
    attach(ell('Brow%d' % s, (x, y - .005, z + .02), .03, .012, .012, CHAR, segs=8, rings=5), hp, noisy=False)
eyes(hp, fc, R, EYE, du=.05, v=.57, size=(.011, .005, .006))
attach(ell('Nose', on_face(fc, R, 0, .47), .016, .02, .022, MAGMA, segs=8, rings=5), hp, noisy=False)
attach(ell('Beard', (0, -.08, 1.5), .07, .045, .065, EMBER, segs=14, rings=8), hp, noisy=False)
for k in range(7):   # beard flickering up into flame tongues and sparks
    x = (k - 3) * .025
    attach(lathe('BeardFlame%d' % k, [(.015, 0), (.008, .05), (0, .08)], EMBER, segs=6, xf=Matrix.Translation((x, -.1, 1.44)) @ Matrix.Rotation(PI + (k - 3) * .15, 4, 'Y') @ Matrix.Rotation(.3, 4, 'X')), hp, noisy=False)
for k in range(6):
    attach(ell('Spark%d' % k, (random.uniform(-.1, .1), random.uniform(-.15, -.05), random.uniform(1.4, 1.7)), .006, .006, .006, SPARK, segs=5, rings=3), hp, noisy=False)

# ---------- legs: charred trousers, heavy boots ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .1, .88, (.09, .075, .066), CHAR, BOOT, boot_top=.35, toe=.15)
    attach(torus('BootStrap' + key, (s * .1, 0, .25), .07, .01, STEEL, segs=14, minor=4), P[key], amp=.3)
# ---------- arms: bare magma, thick and cracked; a blue-steel hammer in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.25, 0, 1.4), (.31, -.03, 1.12), (.32, -.12, .9), MAGMA, MAGMA, r=(.085, .07, .068, .055), amp=.1, sleeve_tex=True)
    xf, L = between((s * .31, -.03, 1.12), (s * .32, -.12, .9))
    attach(lathe('Bracer' + key, [(.06, 0), (.064, .04), (.06, .08)], STEEL, segs=14, xf=xf @ Matrix.Translation((0, 0, L * .55))), P[key], amp=.3)
pB = P['ArmB']; h = Vector((.33, -.17, .85))
attach(limb('HammerHaft', tuple(h + Vector((0, 0, -.12))), tuple(h + Vector((0, -.02, .38))), [(0, .016), (1, .018)], BELT, segs=8), pB, amp=.4)
hh = h + Vector((0, -.02, .42))
attach(box('HammerHead', tuple(hh), (.07, .2, .08), STEEL, bevel=.012), pB, amp=.35)
attach(box('HammerFace', tuple(hh + Vector((0, -.105, 0))), (.08, .02, .09), STEEL, bevel=.006), pB, amp=.3)
# ---------- Tail: tongs and a rag hanging at the back of the belt ----------
tp = P['Tail']
for s in (-1, 1):
    attach(limb('Tong%d' % s, (s * .02, .2, .92), (s * .03, .22, .55), [(0, .008), (1, .006)], STEEL, segs=6), tp, amp=.4)
attach(box('Rag', (-.12, .19, .78), (.08, .006, .2), CHAR, rot=(-.1, 0, .2)), tp, amp=.4)

bpy.context.view_layer.update()
print('tris', tris())
