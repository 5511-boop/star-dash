import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(4)
root, P = setup('Keeper', 1.50, (.22, 1.41), (.095, .92), (.18, .82))
# The Drowned Keeper: barnacled sea-green oilskin, a lamp burning cold blue (cool-toned)
OIL = mat('SeaOilskin', (.035, .11, .085), .32)
OILD = mat('OilskinLining', (.01, .03, .025), .6)
BARN = mat('Barnacle', (.42, .42, .38), .8)
WEED = mat('Seaweed', (.03, .06, .015), .5)
SKIN = mat('DrownedSkin', (.3, .38, .4), .45)
BEARD = mat('MattedBeard', (.13, .16, .13), .8)
RUBBER = mat('Rubber', (.012, .016, .015), .3)
HORN = mat('HornToggle', (.2, .14, .08), .4)
TIN = mat('Tin', (.32, .36, .38), .4, 1.0)
BLUE = mat('ColdBlueFlame', (.35, .65, 1), .2, 0, emit=(.3, .6, 1), es=7, vcol=False)
EYE = mat('DeepEye', (.4, .9, 1), .2, 0, emit=(.3, .85, 1), es=6, vcol=False)

SY = .68
UP = [(.30, .82), (.26, .92), (.215, 1.02), (.22, 1.14), (.245, 1.27), (.252, 1.36), (.242, 1.43), (.2, 1.48), (.12, 1.505), (.08, 1.51)]
SK = [(.38, .42), (.36, .5), (.335, .62), (.315, .73), (.30, .82)]
rag = lambda a, z: (-.03 * abs(math.sin(a * 17) * math.sin(a * 5 + 2)) if z < .43 else 0)
fold = lambda a, z: 1 + .03 * math.sin(8 * a + 2 * z) * max(0, (.85 - z) / .4)
body = lathe('Coat', UP, OIL, segs=34, sy=SY, capt=True)
attach(body, root, amp=.35, freq=8, seed=1, grad=(.82, 1.0, .2))
skf = lathe('SkirtF', SK, OIL, segs=36, sy=SY, mod=fold, arc=(130 * D, 410 * D), zmod=rag)
attach(skf, root, amp=.4, freq=8, seed=2, grad=(.42, .7, .4))
attach(lathe('SkirtFL', [(r - .012, z) for r, z in SK], OILD, segs=36, sy=SY, mod=fold, arc=(130 * D, 410 * D), flip=True, zmod=rag), root, amp=.1)
skt = lathe('SkirtT', SK, OIL, segs=10, sy=SY, mod=lambda a, z: fold(a, z) * 1.014, arc=(50 * D, 130 * D), zmod=rag)
attach(skt, P['Tail'], amp=.4, freq=8, seed=3, grad=(.42, .7, .4))
attach(lathe('SkirtTL', [(r - .012, z) for r, z in SK], OILD, segs=10, sy=SY, mod=lambda a, z: fold(a, z) * 1.014, arc=(50 * D, 130 * D), flip=True, zmod=rag), P['Tail'], amp=.1)
# turned-up storm collar
attach(lathe('Collar', [(.1, 1.48), (.115, 1.55), (.14, 1.61), (.132, 1.612), (.105, 1.555), (.092, 1.48)], OIL, segs=24, sy=.95, closed=True, arc=(-60 * D, 240 * D)), root, amp=.35)
# horn toggles + rope loops down the front
for i, z in enumerate((1.33, 1.2, 1.07, .94, .8, .66)):
    r = .242 if z > 1 else .3
    y = -SY * max(r, .22) - .006
    attach(limb('Toggle%d' % i, (-.028, y, z), (.028, y, z), [(0, .007), (.5, .009), (1, .007)], HORN, segs=6), root, amp=.3)
    attach(torus('Loop%d' % i, (.035, y, z), .012, .0025, WEED, rot=(PI / 2, 0, 0), segs=8, minor=4), root, amp=.3)
# barnacle clusters on shoulders, chest and hem
def barnacle(name, c, s, parent):
    attach(lathe(name, [(.012 * s, 0), (.011 * s, .006 * s), (.006 * s, .012 * s), (.0035 * s, .011 * s), (0, .008 * s)], BARN, segs=7, xf=Matrix.Translation(c)), parent, amp=.4, freq=60)
spots = [(-.18, 1.45), (-.2, 1.42), (-.15, 1.47), (.17, 1.3), (.2, 1.24), (-.25, .55), (-.28, .5), (.22, .62), (-.05, .45), (.12, 1.05)]
for k, (x, z) in enumerate(spots):
    r = .25 if z > .9 else .34
    y = -SY * math.sqrt(max(r * r - x * x, .0004)) - .002
    barnacle('Barn%d' % k, (x, y, z), random.uniform(.8, 1.4), root)
# seaweed draped from the shoulders and caught on the hem
for k, (x, z0, ln) in enumerate(((-.16, 1.47, .3), (.19, 1.44, .22), (-.3, .5, .14), (.26, .6, .2), (.05, .5, .12))):
    r = .25 if z0 > .9 else .34
    y = -SY * math.sqrt(max(r * r - x * x, .0004)) - .006
    pts = [(x, y, z0), (x + .02, y - .01, z0 - ln * .4), (x - .01, y - .006, z0 - ln * .75), (x + .015, y - .01, z0 - ln)]
    attach(tube('Weed%d' % k, pts, .0055, WEED), root, amp=.4, freq=30)

# ---------- head: drowned face, matted beard, sou'wester ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.47), (0, 0, 1.57), [(0, .046), (1, .044)], SKIN, segs=10), hp, amp=.2)
fc = (0, 0, 1.64); R = (.097, .103, .116)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.3, freq=16, seed=9)
for s in (-1, 1):   # sunken sockets with a cold glow at the bottom
    x, y, z = on_face(fc, R, s * .05, .58)
    attach(ell('Socket%d' % s, (x, y + .004, z), .019, .008, .014, mat('Socket', (.02, .03, .035), .9), segs=10, rings=6), hp, noisy=False)
eyes(hp, fc, R, EYE, du=.05, v=.58, size=(.007, .004, .005), push=.0)
attach(ell('Nose', (0, -.106, 1.63), .014, .018, .024, SKIN, segs=10, rings=6), hp, amp=.2)
attach(ell('Beard', (0, -.06, 1.565), .08, .06, .07, BEARD, segs=14, rings=8), hp, amp=.4, freq=24)
for k in range(5):   # dripping beard strands
    x = (k - 2) * .025
    attach(tube('BeardStrand%d' % k, [(x, -.09, 1.55), (x * 1.1, -.1, 1.5), (x * .9, -.095, 1.45 - abs(x))], .008, BEARD), hp, amp=.4)
hat = empty('HatPivot', (0, 0, 1.72), hp)
attach(lathe('SouWesterCrown', [(.108, 1.69), (.112, 1.74), (.1, 1.785), (.06, 1.80), (0, 1.802)], OIL, segs=24, sy=1.08), hat, amp=.35, freq=10)
brim = lathe('SouWesterBrim', [(.108, 1.695), (.16, 1.68), (.2, 1.655), (.205, 1.648), (.16, 1.672), (.108, 1.687)], OIL, segs=30, sy=1.1, closed=True,
             mod=lambda a, z: 1 + .55 * max(0, math.sin(a)) ** 2)   # long sloping back brim
attach(brim, hat, amp=.35, freq=10)
attach(torus('HatBand', (0, 0, 1.70), .111, .006, WEED, segs=22, minor=4, scale=(1, 1.08, 1)), hat, amp=.3)
barnacle('HatBarn0', (.07, -.08, 1.77), 1.1, hat); barnacle('HatBarn1', (-.09, .03, 1.775), .9, hat)
attach(tube('HatWeed', [(.1, .02, 1.72), (.15, .1, 1.66), (.16, .2, 1.58), (.15, .25, 1.5)], .006, WEED), hat, amp=.4)
hat.rotation_euler = (.06, 0, 0)

# ---------- legs + arms ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .095, .93, (.08, .065, .058), OILD, RUBBER, boot_top=.42)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.22, 0, 1.41), (.27, -.03, 1.13), (.285, -.11, .9), OIL, SKIN, r=(.06, .053, .05, .047), cuff=OIL, amp=.35)
# ---------- the cold blue storm lamp (hand B) ----------
pB = P['ArmB']; hx, hy = .3, -.13
attach(torus('LampBail', (hx, hy, .74), .05, .004, TIN, rot=(PI / 2, 0, 0), segs=16, minor=4, scale=(1, 1.3, 1)), pB, amp=.4)
attach(lathe('LampFont', [(.05, .48), (.055, .5), (.05, .53), (.035, .54), (0, .54)], TIN, segs=16, capb=True, center=(hx, hy)), pB, amp=.5, freq=25)
attach(lathe('LampGlobe', [(.025, .54), (.042, .57), (.046, .61), (.036, .65), (.022, .67), (0, .675)], BLUE, segs=16, center=(hx, hy)), pB, noisy=False)
attach(lathe('LampCap', [(.03, .665), (.035, .68), (.02, .7), (.008, .71), (0, .712)], TIN, segs=12, center=(hx, hy)), pB, amp=.5)
for s in (-1, 1):
    attach(tube('LampGuard%d' % s, [(hx + s * .05, hy, .53), (hx + s * .056, hy, .6), (hx + s * .045, hy, .67)], .003, TIN), pB, amp=.4)
barnacle('LampBarn', (hx + .045, hy - .02, .5), .8, pB)

bpy.context.view_layer.update()
print('tris', tris())
