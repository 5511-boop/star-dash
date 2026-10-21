import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(13)
root, P = setup('Miner', 1.48, (.215, 1.39), (.095, .9), (.16, 1.1))
# The Lost Miner: soot-black overalls, a sputtering cold-white headlamp, a pickaxe (cool-toned)
OVER = mat('SootDenim', (.04, .05, .07), .9)
SHIRT = mat('SootShirt', (.07, .07, .075), .9)
SKIN = mat('SootySkin', (.2, .17, .16), .7)
HELM = mat('MinerHelmet', (.06, .07, .08), .45, .3)
LAMP = mat('LampTin', (.35, .37, .4), .4, 1.0)
BEAM = mat('Headlamp', (.75, .9, 1), .1, 0, emit=(.7, .88, 1), es=10, vcol=False)
WOOD = mat('PickHaft', (.15, .09, .05), .7)
IRON = mat('PickIron', (.2, .2, .22), .5, .8)
BOOT = mat('PitBoot', (.03, .025, .02), .6)
KERCH = mat('Kerchief', (.04, .07, .14), .8)
EYE = mat('PaleEye', (.85, .9, 1), .2, 0, emit=(.8, .9, 1), es=3, vcol=False)

SY = .7
TOR = [(.2, .88), (.205, 1.0), (.225, 1.15), (.24, 1.28), (.245, 1.35), (.23, 1.41), (.18, 1.46), (.1, 1.48), (.06, 1.485)]
attach(lathe('Shirt', TOR, SHIRT, segs=28, sy=SY, capt=True), root, amp=.45, freq=10, seed=2)
bib = lathe('Bib', [(r * 1.03, z) for r, z in TOR[:5]], OVER, segs=12, sy=SY, arc=(-125 * D, -55 * D))
attach(bib, root, amp=.5, freq=9); holes(bib, 14, .7, seed=3, dark=.5)
attach(lathe('OverallHips', [(.19, .8), (.205, .88), (.21, .95)], OVER, segs=24, sy=.74), root, amp=.5)
for s in (-1, 1):
    attach(box('Brace%d' % s, (s * .09, -.05, 1.35), (.035, .006, .3), OVER, rot=(.35, 0, s * .1)), root, amp=.5)
    attach(ell('BraceBtn%d' % s, (s * .09, -SY * .24 - .015, 1.23), .012, .006, .012, LAMP, segs=8, rings=5), root, amp=.4)
attach(box('BibPocket', (0, -SY * .24 - .012, 1.1), (.09, .006, .07), OVER, bevel=.004), root, amp=.5)
attach(lathe('Kerchief', [(.06, 1.45), (.085, 1.48), (.07, 1.51)], KERCH, segs=18, closed=True), root, amp=.4)
attach(ell('KerchiefKnot', (0, -.075, 1.45), .025, .015, .04, KERCH, segs=8, rings=5), root, amp=.4)
# canteen + coil of fuse at the belt
attach(ell('Canteen', (-.21, -.06, .9), .05, .025, .06, LAMP, segs=12, rings=6), root, amp=.4)
attach(torus('Fuse', (.2, -.08, .88), .04, .006, mat('Fuse', (.3, .2, .1), .8), rot=(PI / 2, 0, .3), segs=14, minor=4), root, amp=.3)

# ---------- head: soot-smeared face, hollow pale eyes, helmet and headlamp ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.45), (0, 0, 1.55), [(0, .045), (1, .044)], SKIN, segs=10), hp, amp=.4)
fc = (0, 0, 1.62); R = (.095, .1, .112)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.5, freq=20)
eyes(hp, fc, R, EYE, du=.05, v=.58, size=(.01, .004, .006))
attach(ell('Nose', on_face(fc, R, 0, .47), .013, .018, .022, SKIN, segs=8, rings=5), hp, amp=.4)
attach(ell('Stubble', (0, -.05, 1.555), .08, .06, .045, mat('Stubble', (.05, .045, .045), .9), segs=12, rings=6), hp, amp=.4)
attach(lathe('Helmet', [(.115, 1.66), (.12, 1.69), (.112, 1.74), (.09, 1.78), (.05, 1.795), (0, 1.8)], HELM, segs=24, sy=1.08), hp, amp=.45, freq=12)
attach(lathe('HelmBrim', [(.115, 1.665), (.14, 1.66), (.15, 1.655), (.14, 1.662), (.115, 1.672)], HELM, segs=24, sy=1.15, closed=True), hp, amp=.45)
attach(box('HelmRidge', (0, 0, 1.79), (.02, .2, .012), HELM, bevel=.004), hp, amp=.4)
xf = Matrix.Translation((0, -.115, 1.72)) @ Matrix.Rotation(PI / 2 + .1, 4, 'X')
attach(lathe('LampBody', [(0, -.01), (.03, -.01), (.032, .02), (.035, .035), (.03, .038)], LAMP, segs=14, xf=xf), hp, amp=.4)
attach(lathe('LampLens', [(.03, .036), (0, .038)], BEAM, segs=14, xf=xf), hp, noisy=False)
attach(box('LampMount', (0, -.11, 1.69), (.02, .02, .04), LAMP), hp, amp=.4)

# ---------- legs + arms + pickaxe ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .095, .92, (.08, .066, .06), OVER, BOOT, boot_top=.3)
    attach(torus('Cuff' + key, (s * .095, 0, .31), .064, .012, OVER, segs=14, minor=5), P[key], amp=.5)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.215, 0, 1.39), (.26, -.03, 1.11), (.275, -.11, .89), SHIRT, SKIN, r=(.06, .052, .046, .04), cuff=SHIRT, amp=.45)
pB = P['ArmB']; h = Vector((.285, -.15, .85))
attach(limb('Haft', tuple(h + Vector((0, 0, -.25))), tuple(h + Vector((0, -.03, .45))), [(0, .014), (1, .016)], WOOD, segs=8), pB, amp=.4)
pick = h + Vector((0, -.03, .45))
attach(lathe('PickHead', [(.02, -.22), (.016, -.1), (.022, 0), (.016, .1), (.0, .25)], IRON, segs=6, xf=Matrix.Translation(pick) @ Matrix.Rotation(PI / 2, 4, 'X')), pB, amp=.4)
# ---------- Tail: a dented lunch pail swinging at the back of the belt ----------
tp = P['Tail']
attach(lathe('Pail', [(0, .82), (.05, .82), (.055, .92), (.05, .93), (0, .93)], LAMP, segs=14, center=(.0, .2)), tp, amp=.5)
attach(torus('PailHandle', (0, .2, .95), .05, .004, LAMP, rot=(PI / 2, 0, PI / 2), segs=12, minor=4), tp, amp=.4)

bpy.context.view_layer.update()
print('tris', tris())
