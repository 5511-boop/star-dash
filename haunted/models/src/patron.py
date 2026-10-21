import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(8)
root, P = setup('Patron', 1.50, (.215, 1.41), (.095, .92), (.05, 1.47))
# The Masked Patron: evening dress, porcelain half-mask, opera cape lined in sapphire (cool-toned)
BLACK = mat('EveningBlack', (.01, .01, .014), .55)
SATIN = mat('SapphireSatin', (.02, .06, .3), .3, 0, emit=(.02, .05, .2), es=.3)
SHIRT = mat('DressShirt', (.7, .72, .76), .6)
PORC = mat('MaskPorcelain', (.88, .88, .9), .15)
SKIN = mat('PaleSkin', (.55, .45, .42), .5)
HAIR = mat('SlickHair', (.01, .01, .012), .25)
SILV = mat('Silver', (.6, .63, .68), .3, 1.0)
GLOVE = mat('WhiteGlove', (.75, .76, .8), .55)
EYE = mat('SapphireEye', (.4, .6, 1), .2, 0, emit=(.3, .5, 1), es=6, vcol=False)
ROSE = mat('RedRose', (.4, .02, .03), .5)

SY = .66
UP = [(.21, .9), (.205, 1.0), (.22, 1.12), (.242, 1.26), (.25, 1.35), (.24, 1.42), (.2, 1.47), (.12, 1.5), (.075, 1.505)]
attach(lathe('Coat', UP, BLACK, segs=32, sy=SY, capt=True), root, amp=.2)
attach(lathe('ShirtFront', [(r * 1.03, z) for r, z in UP[2:7]], SHIRT, segs=6, sy=SY, arc=(-103 * D, -77 * D)), root, amp=.1)
for s in (-1, 1):
    a0, a1 = sorted(((-90 - s * 13) * D, (-90 - s * 21) * D))
    attach(lathe('Lapel%d' % s, [(r * 1.04, z) for r, z in UP[2:7]], SATIN, segs=4, sy=SY, arc=(a0, a1)), root, amp=.15)
attach(ell('Cravat', (0, -.09, 1.45), .03, .016, .04, SHIRT, segs=10, rings=6), root, amp=.1)
attach(ell('CravatPin', (0, -.105, 1.44), .007, .005, .009, SATIN, segs=6, rings=4), root, noisy=False)
attach(lathe('Collar', [(.064, 1.47), (.066, 1.53), (.072, 1.545), (.06, 1.53), (.058, 1.47)], SHIRT, segs=16, closed=True), root, amp=.1)
attach(ell('Boutonniere', (-.15, -.17, 1.32), .02, .015, .02, ROSE, segs=8, rings=6), root, amp=.3)
attach(lathe('Hips', [(.17, .8), (.19, .88), (.205, .92)], BLACK, segs=20, sy=.72), root, amp=.2)

# ---------- the opera cape: black outside, sapphire inside, billows back on the Tail pivot ----------
tp = P['Tail']
CAPE = [(.12, 1.52), (.24, 1.47), (.29, 1.38), (.31, 1.1), (.34, .7), (.37, .32)]
billow = lambda a, z: 1 + .04 * math.sin(7 * a + z * 3) * max(0, (1.3 - z) / 1.0)
arc = ((-90 + 32) * D, (270 - 32) * D)
attach(lathe('Cape', CAPE, BLACK, segs=36, sy=.78, arc=arc, mod=billow), tp, amp=.25, freq=8)
attach(lathe('CapeLining', [(r - .01, z) for r, z in CAPE], SATIN, segs=36, sy=.78, arc=arc, mod=billow, flip=True), tp, amp=.15)
attach(lathe('CapeCollar', [(.12, 1.5), (.15, 1.58), (.19, 1.66), (.18, 1.665), (.14, 1.58), (.11, 1.5)], SATIN, segs=20, sy=.85, arc=(-30 * D, 210 * D), closed=True), tp, amp=.15)
attach(tube('CapeChain', [(-.12, -.1, 1.47), (0, -.13, 1.43), (.12, -.1, 1.47)], .003, SILV), tp, amp=.3)
for s in (-1, 1):
    attach(ell('CapeClasp%d' % s, (s * .12, -.1, 1.47), .016, .008, .016, SILV, segs=10, rings=6), tp, amp=.3)

# ---------- head: slicked hair, porcelain half-mask over the right side ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.57), [(0, .045), (1, .043)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.64); R = (.095, .1, .115)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.12)
mask = lathe('HalfMask', [(.0, 1.535), (.07, 1.545), (.1, 1.6), (.104, 1.66), (.09, 1.72), (.05, 1.755), (0, 1.76)], PORC, segs=14, arc=(-90 * D, 0 * D), sy=1.06)
mask.location = (.002, -.004, 0); attach(mask, hp, amp=.08, freq=30)
x, y, z = on_face(fc, R, .05, .58)
attach(torus('MaskEyeRim', (x, y - .008, z), .016, .003, SILV, rot=(PI / 2, 0, 0), segs=12, minor=4, scale=(1.25, 1, 1)), hp, amp=.3)
eyes(hp, fc, R, EYE, du=.05, v=.58, size=(.01, .006, .007), push=.006)
attach(ell('Nose', on_face(fc, R, -.012, .47), .011, .016, .02, SKIN, segs=8, rings=5), hp, amp=.1)
attach(tube('Mouth', [on_face(fc, R, -.04, .32), on_face(fc, R, -.01, .31), on_face(fc, R, .02, .33)], .0025, mat('Lip', (.2, .06, .06), .5)), hp, noisy=False)
attach(lathe('Hair', [(.098, 1.6), (.106, 1.66), (.1, 1.72), (.07, 1.76), (0, 1.775)], HAIR, segs=24, sy=1.06, arc=(-60 * D, 240 * D)), hp, amp=.15)
attach(ell('HairBack', (0, .03, 1.64), .095, .09, .1, HAIR, segs=16, rings=8), hp, amp=.15)

# ---------- legs + arms + silver-topped cane ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .095, .93, (.076, .06, .053), BLACK, mat('PatentShoe', (.005, .005, .007), .15), boot_top=.13)
    attach(limb('SatinStripe' + key, (s * .165, 0, .9), (s * .15, 0, .16), [(0, .005), (1, .005)], SATIN, segs=5), P[key], noisy=False)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.215, 0, 1.41), (.265, -.03, 1.13), (.28, -.11, .9), BLACK, GLOVE, r=(.055, .048, .046, .042), cuff=SHIRT, amp=.2)
pB = P['ArmB']; hx, hy = .3, -.13
attach(limb('Cane', (hx, hy, .06), (hx, hy, .86), [(0, .008), (1, .011)], BLACK, segs=8), pB, amp=.2)
attach(ell('CaneHead', (hx, hy - .02, .88), .02, .035, .02, SILV, segs=10, rings=6), pB, amp=.3)
attach(ell('CaneTip', (hx, hy, .06), .01, .01, .012, SILV, segs=6, rings=4), pB, amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
