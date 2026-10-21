import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(14)
root, P = setup('Aeronaut', 1.48, (.215, 1.39), (.095, .91), (.0, 1.47))
# The Aeronaut: flight jacket with a fleece collar, goggles, a long silk scarf streaming behind (cool-toned)
JACKET = mat('FlightLeather', (.09, .06, .045), .5)
FLEECE = mat('Fleece', (.7, .66, .58), .95)
SCARF = mat('SkySilk', (.45, .62, .85), .3)
JOD = mat('JodhpursSlate', (.08, .09, .11), .85)
BOOT = mat('FlyingBoot', (.03, .025, .02), .35)
SKIN = mat('WindSkin', (.6, .45, .38), .5)
CAP = mat('CapLeather', (.07, .045, .03), .5)
BRASS = mat('GoggleBrass', (.65, .48, .2), .3, .9)
LENS = mat('SkyLens', (.4, .7, 1), .05, 0, emit=(.3, .6, 1), es=3, vcol=False)
STEEL = mat('Zip', (.5, .52, .56), .3, 1.0)
EYE = mat('Eye', (.08, .12, .2), .2)

SY = .68
TOR = [(.21, .88), (.215, .95), (.23, 1.08), (.25, 1.22), (.26, 1.32), (.25, 1.4), (.2, 1.46), (.12, 1.49), (.07, 1.495)]
attach(lathe('Jacket', TOR, JACKET, segs=30, sy=SY, capt=True), root, amp=.4, freq=12, seed=1)
attach(torus('Waistband', (0, 0, .9), .212, .02, JACKET, segs=28, minor=5, scale=(1, SY, 1)), root, amp=.4)
attach(tube('Zipper', [(.02, -SY * r - .006, z) for r, z in TOR[1:6]], .005, STEEL), root, amp=.3)
for s in (-1, 1):   # chest pockets with flaps, shoulder patches
    attach(box('Pocket%d' % s, (s * .11, -SY * .245 - .006, 1.18), (.08, .008, .08), JACKET, rot=(0, 0, -s * .3), bevel=.006), root, amp=.4)
    attach(box('Flap%d' % s, (s * .11, -SY * .245 - .012, 1.22), (.085, .01, .025), JACKET, rot=(0, 0, -s * .3), bevel=.004), root, amp=.4)
attach(ell('Wings', (-.11, -SY * .25 - .012, 1.3), .05, .004, .015, BRASS, segs=10, rings=4), root, amp=.3)   # pilot's wings badge
attach(lathe('FleeceCollar', [(.1, 1.44), (.17, 1.45), (.2, 1.5), (.15, 1.55), (.09, 1.53)], FLEECE, segs=24, sy=.85, closed=True, mod=lambda a, z: 1 + .05 * math.sin(a * 13)), root, amp=.3, freq=30)
attach(lathe('Hips', [(.19, .8), (.205, .87), (.21, .9)], JOD, segs=22, sy=.72), root, amp=.3)

# ---------- head: leather flying cap with ear flaps, goggles up, scarf at the neck ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.56), [(0, .045), (1, .044)], SKIN, segs=10), hp, amp=.15)
fc = (0, 0, 1.63); R = (.094, .1, .113)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.15)
eyes(hp, fc, R, EYE, du=.05, v=.57, size=(.01, .005, .007))
attach(ell('Nose', on_face(fc, R, 0, .47), .012, .017, .021, SKIN, segs=8, rings=5), hp, amp=.15)
attach(tube('Grin', [on_face(fc, R, -.03, .34), on_face(fc, R, 0, .325), on_face(fc, R, .03, .34)], .0025, mat('Lip', (.3, .12, .1), .5)), hp, noisy=False)
attach(lathe('FlyingCap', [(.1, 1.6), (.104, 1.66), (.098, 1.72), (.07, 1.755), (0, 1.765)], CAP, segs=24, sy=1.06, arc=(-60 * D, 240 * D)), hp, amp=.4)
for s in (-1, 1):
    attach(ell('EarFlap%d' % s, (s * .098, .0, 1.58), .015, .045, .06, CAP, segs=10, rings=6), hp, amp=.4)
    attach(tube('Strap%d' % s, [(s * .095, -.02, 1.53), (s * .06, -.07, 1.5), (0, -.08, 1.5)], .004, CAP), hp, amp=.3)
    c = (s * .04, -.098, 1.705)
    xf = Matrix.Translation(c) @ Matrix.Rotation(-1.1, 4, 'X')
    attach(lathe('GoggleRim%d' % s, [(.025, 0), (.028, .014), (.022, .016)], BRASS, segs=14, xf=xf), hp, amp=.3)
    attach(lathe('GoggleLens%d' % s, [(.022, .012), (0, .016)], LENS, segs=14, xf=xf), hp, noisy=False)
attach(torus('GoggleBand', (0, 0, 1.7), .105, .008, CAP, rot=(-.2, 0, 0), segs=24, minor=4, scale=(1, 1.06, 1)), hp, amp=.3)
attach(lathe('ScarfWrap', [(.07, 1.45), (.075, 1.48), (.07, 1.51)], SCARF, segs=18, closed=True, mod=lambda a, z: 1 + .08 * math.sin(a * 5)), root, amp=.15)

# ---------- legs: slate jodhpurs, laced flying boots ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .095
    attach(limb('Jod' + key, (x, 0, .91), (x, 0, .45), [(0, .085), (.35, .098), (1, .06)], JOD, segs=12), p, amp=.3)
    leg(P, key, s, .095, .46, (.06, .06, .058), JOD, BOOT, boot_top=.42)
    attach(lathe('BootFleece' + key, [(.064, .42), (.072, .45), (.06, .46)], FLEECE, segs=14, center=(x, 0)), p, amp=.3)
# ---------- arms + a folded map in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.215, 0, 1.39), (.26, -.03, 1.11), (.275, -.11, .89), JACKET, mat('Gauntlet', (.06, .04, .03), .5), r=(.062, .054, .05, .045), cuff=FLEECE, amp=.4)
attach(box('Map', (.29, -.17, .83), (.12, .01, .08), mat('Map', (.75, .7, .55), .9), rot=(-.4, 0, .2)), P['ArmB'], amp=.3)
# ---------- Tail: the long silk scarf streaming out behind ----------
tp = P['Tail']
for k, off in enumerate((-.03, .03)):
    pts = [(off, .06, 1.48), (off + .02, .16, 1.42), (off - .02, .28, 1.3), (off + .03, .4, 1.18), (off, .5, 1.08)]
    attach(tube('ScarfTail%d' % k, pts, .02, SCARF), tp, amp=.15)
    attach(box('ScarfEnd%d' % k, (off, .52, 1.05), (.045, .006, .06), SCARF, rot=(.8, 0, 0)), tp, amp=.15)

bpy.context.view_layer.update()
print('tris', tris())
