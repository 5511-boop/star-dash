import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(12)
root, P = setup('Soldier', 1.47, (.2, 1.38), (.085, .9), (.0, 1.15))
# The Broken Soldier: chipped tin, a winding key that grinds round, a dangling arm (cool-toned)
TIN = mat('TinBlue', (.03, .08, .32), .28, .35)
WHITE = mat('PaintWhite', (.75, .76, .78), .35)
BARE = mat('BareTin', (.5, .52, .56), .3, 1.0)
GOLD = mat('PaintGold', (.75, .55, .18), .3, .6)
BLACK = mat('PaintBlack', (.01, .01, .012), .25)
FACE = mat('TinFace', (.82, .66, .58), .3, .2)
CHEEK = mat('PaintCheek', (.7, .15, .15), .4)
RUST = mat('Rust', (.25, .08, .03), .8)

SY = .75
BODY = [(.18, .88), (.19, .95), (.2, 1.1), (.215, 1.25), (.22, 1.34), (.2, 1.41), (.14, 1.45), (.07, 1.46)]
attach(lathe('Coat', BODY, TIN, segs=24, sy=SY, capt=True), root, amp=.2)
attach(lathe('CoatSkirt', [(.205, .76), (.19, .82), (.18, .88)], TIN, segs=24, sy=SY), root, amp=.2)
for s in (-1, 1):   # white cross-belts
    attach(tube('CrossBelt%d' % s, [(s * .17, -.1, 1.36), (s * .05, -SY * .21 - .008, 1.18), (-s * .12, -SY * .2 - .006, .95)], .012, WHITE), root, amp=.15)
attach(torus('Belt', (0, 0, .9), .19, .014, WHITE, segs=24, minor=4, scale=(1, SY, 1)), root, amp=.15)
attach(box('BeltPlate', (0, -SY * .19 - .012, .9), (.05, .008, .035), GOLD, bevel=.004), root, amp=.3)
for i, z in enumerate((1.3, 1.2, 1.1, 1.0)):
    attach(ell('Btn%d' % i, (0, -SY * .215 - .006, z), .012, .007, .012, GOLD, segs=8, rings=5), root, amp=.3)
# chipped paint: bare tin and rust showing through
for k in range(14):
    z = random.uniform(.8, 1.4); a = random.uniform(0, 2 * PI); r = .2
    attach(ell('Chip%d' % k, (r * math.cos(a) * 1.04, r * SY * math.sin(a) * 1.04, z), random.uniform(.012, .025), .004, random.uniform(.01, .02), BARE if k % 3 else RUST, segs=6, rings=4), root, noisy=False)
attach(tube('Crack', [(.08, -.15, 1.3), (.1, -.152, 1.22), (.07, -.155, 1.15), (.09, -.154, 1.08)], .003, BLACK), root, noisy=False)
# epaulettes
for s in (-1, 1):
    e = ell('Epaulette%d' % s, (s * .2, 0, 1.43), .06, .05, .02, GOLD, segs=12, rings=6); e.rotation_euler = (0, s * .4, 0)
    attach(e, P['ArmA' if s < 0 else 'ArmB'], amp=.3)

# ---------- head: painted tin face, tall shako ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.43), (0, 0, 1.52), [(0, .045), (1, .045)], FACE, segs=10), hp, amp=.1)
fc = (0, 0, 1.6); R = (.095, .1, .11)
attach(ell('Face', fc, *R, FACE, segs=20, rings=12), hp, amp=.1)
eyes(hp, fc, R, BLACK, du=.05, v=.57, size=(.012, .004, .012), push=.0)
for s in (-1, 1):
    attach(ell('Cheek%d' % s, on_face(fc, R, s * .075, .44), .02, .005, .018, CHEEK, segs=10, rings=5), hp, noisy=False)
    attach(tube('Mustache%d' % s, [on_face(fc, R, 0, .4), on_face(fc, R, s * .045, .39), on_face(fc, R, s * .065, .43)], .007, BLACK), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .48), .012, .014, .016, FACE, segs=8, rings=5), hp, amp=.1)
attach(lathe('Shako', [(0, 1.67), (.1, 1.67), (.104, 1.7), (.11, 1.8), (.112, 1.86), (0, 1.86)], BLACK, segs=22, capb=True), hp, amp=.15)
attach(torus('ShakoBand', (0, 0, 1.69), .102, .008, GOLD, segs=22, minor=4), hp, amp=.3)
attach(lathe('Visor', [(.1, 1.672), (.13, 1.665), (.14, 1.66)], BLACK, segs=10, arc=(-150 * D, -30 * D)), hp, amp=.1)
attach(ell('Badge', (0, -.112, 1.77), .025, .006, .03, BARE, segs=10, rings=6), hp, amp=.3)
attach(ell('Plume', (0, -.04, 1.93), .022, .022, .07, WHITE, segs=10, rings=6), hp, amp=.2)
attach(tube('ChinStrap', [(-.1, -.02, 1.67), (-.06, -.09, 1.52), (.06, -.09, 1.52), (.1, -.02, 1.67)], .004, GOLD), hp, amp=.3)

# ---------- legs: stiff white trousers, black boots ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .085, .9, (.07, .062, .056), WHITE, BLACK, boot_top=.36)
# ---------- arms: the left one hangs loose from a broken joint; rifle with bayonet in hand B ----------
arm(P, 'ArmA', -1, (.2, 0, 1.38), (.27, .02, 1.1), (.31, -.02, .86), TIN, WHITE, r=(.055, .048, .046, .04), cuff=GOLD, amp=.2)
attach(ell('BrokenJoint', (-.2, .0, 1.36), .03, .03, .03, RUST, segs=8, rings=5), P['ArmA'], noisy=False)
arm(P, 'ArmB', 1, (.2, 0, 1.38), (.24, -.03, 1.12), (.25, -.11, .9), TIN, WHITE, r=(.055, .048, .046, .04), cuff=GOLD, amp=.2)
pB = P['ArmB']; h = Vector((.26, -.15, .86))
attach(box('Stock', tuple(h + Vector((0, .0, -.2))), (.03, .05, .22), mat('ToyWood', (.25, .12, .05), .5), bevel=.006), pB, amp=.3)
attach(limb('Barrel', tuple(h + Vector((0, 0, -.1))), tuple(h + Vector((0, 0, .55))), [(0, .011), (1, .009)], BARE, segs=8), pB, amp=.3)
attach(lathe('Bayonet', [(.006, 0), (.004, .14), (0, .2)], BARE, segs=4, xf=Matrix.Translation(h + Vector((.015, 0, .53)))), pB, amp=.2)
# ---------- the winding key, grinding round (Spin_) ----------
ky = SY * .21
key = spin('WindKey', (0, ky, 1.15), (-PI / 2, 0, 0), root)
attach(limb('KeyShaft', (0, ky - .01, 1.15), (0, ky + .08, 1.15), [(0, .012), (1, .012)], BARE, segs=8), key, amp=.3)
for s in (-1, 1):
    attach(torus('KeyWing%d' % s, (s * .05, ky + .09, 1.15), .045, .011, BARE, rot=(PI / 2, 0, 0), segs=16, minor=5, scale=(1.1, .85, 1)), key, amp=.4)
attach(ell('KeyRust', (.05, ky + .09, 1.12), .015, .012, .015, RUST, segs=6, rings=4), key, noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
