import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(20)
root, P = setup('Diver', 1.42, (.23, 1.36), (.1, .88), (.0, 1.55))
# The Deep Diver: canvas suit, cracked brass helmet glowing with algae from inside (cool-toned)
CANVAS = mat('DiveCanvas', (.12, .16, .2), .9)
BRASS = mat('HelmetBrass', (.55, .38, .14), .35, .9)
GLASS = mat('AlgaeGlass', (.2, .9, .7), .05, 0, emit=(.15, .85, .65), es=4, vcol=False)
ALGAE = mat('AlgaeSpots', (.2, .9, .7), .5, 0, emit=(.1, .8, .6), es=2.5, vcol=False)
LEAD = mat('LeadWeight', (.15, .16, .17), .6, .5)
RUBBER = mat('HoseRubber', (.03, .03, .03), .5)
CRACK = mat('Crack', (.01, .02, .02), .5)
BARN = mat('Barnacle', (.42, .42, .38), .8)

SY = .75
SU = [(.24, .84), (.25, .95), (.27, 1.1), (.28, 1.22), (.27, 1.3), (.2, 1.36), (.1, 1.38)]
attach(lathe('Suit', SU, CANVAS, segs=28, sy=SY, capt=True, mod=lambda a, z: 1 + .03 * math.sin(a * 7 + z * 9)), root, amp=.4, freq=8)
attach(lathe('Corselet', [(.295, 1.19), (.28, 1.3), (.21, 1.385), (.13, 1.43), (.115, 1.46)], BRASS, segs=24, sy=.82), root, amp=.45, freq=12)
for k in range(10):
    a = k / 10 * 2 * PI
    attach(ell('Bolt%d' % k, (.235 * math.cos(a), .235 * .82 * math.sin(a), 1.355), .011, .011, .01, BRASS, segs=6, rings=4), root, amp=.4)
for s in (-1, 1):
    attach(box('ChestWeight%d' % s, (s * .09, -SY * .27 - .02, 1.12), (.09, .03, .12), LEAD, bevel=.008), root, amp=.4)
attach(torus('Belt', (0, 0, .9), .25, .018, mat('Strap', (.08, .05, .03), .6), segs=26, minor=4, scale=(1, SY, 1)), root, amp=.3)
for k in range(16):   # glowing algae colonies on the suit
    z = random.uniform(.85, 1.25); a = random.uniform(0, 2 * PI); r = .27
    attach(ell('Algae%d' % k, (r * math.cos(a) * 1.02, r * SY * math.sin(a) * 1.02, z), random.uniform(.008, .016), .005, random.uniform(.008, .016), ALGAE, segs=6, rings=4), root, noisy=False)

# ---------- helmet: copper-brass sphere, three ports, the front glass cracked ----------
hp = P['Head']
hc = (0, 0, 1.6)
attach(lathe('Helmet', [(.11, 1.43), (.17, 1.48), (.19, 1.58), (.18, 1.68), (.13, 1.75), (.06, 1.78), (0, 1.785)], BRASS, segs=26), hp, amp=.45, freq=12, seed=3)
attach(ell('Inner', hc, .15, .15, .15, mat('Dark', (.005, .01, .01), .9), segs=12, rings=6), hp, noisy=False)
for s, (ang, sz) in enumerate(((-90, .075), (0, .05), (180, .05))):
    a = ang * D
    c = Vector((.185 * math.cos(a), .185 * math.sin(a), 1.6))
    n = Vector((math.cos(a), math.sin(a), 0))
    xf = Matrix.Translation(c) @ n.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    attach(lathe('PortRim%d' % s, [(sz, -.005), (sz + .012, .0), (sz + .012, .02), (sz, .022)], BRASS, segs=18, xf=xf), hp, amp=.4)
    attach(lathe('PortGlass%d' % s, [(sz, .01), (0, .016)], GLASS, segs=18, xf=xf), hp, noisy=False)
    if s == 0:
        for k in range(3):   # bars across the front port
            attach(box('PortBar%d' % k, tuple(c + Vector(((k - 1) * .035, -.025, 0))), (.008, .006, .15), BRASS), hp, amp=.4)
c0 = Vector((0, -.2, 1.6))
for k, d in enumerate(((.05, .04), (-.04, .05), (.03, -.05), (-.05, -.02))):
    attach(tube('Crack%d' % k, [tuple(c0 + Vector((.005, -.004, 0))), tuple(c0 + Vector((d[0] * .5, -.004, d[1] * .5 + .005))), tuple(c0 + Vector((d[0], -.002, d[1])))], .0018, CRACK), hp, noisy=False)
attach(lathe('Airvalve', [(.02, 0), (.022, .03), (.012, .035)], BRASS, segs=10, xf=Matrix.Translation((0, .17, 1.68)) @ Matrix.Rotation(-PI / 2 + .4, 4, 'X')), hp, amp=.4)
barn = lambda nm, c, s: attach(lathe(nm, [(.012 * s, 0), (.011 * s, .006 * s), (.006 * s, .012 * s), (0, .009 * s)], BARN, segs=7, xf=Matrix.Translation(c)), hp, amp=.4)
barn('HelmBarn0', (.1, -.12, 1.72), 1.2); barn('HelmBarn1', (-.13, -.05, 1.7), 1)

# ---------- legs: heavy lead boots; arms: canvas with brass cuffs, a dive knife in hand B ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .1
    attach(limb('Leg' + key, (x, 0, .88), (x, 0, .2), [(0, .095), (.5, .08), (1, .075)], CANVAS, segs=12), p, amp=.4)
    attach(box('LeadBoot' + key, (x, -.03, .09), (.13, .26, .17), LEAD, bevel=.02), p, amp=.4)
    attach(box('BootSole' + key, (x, -.03, .012), (.14, .28, .024), BRASS, bevel=.006), p, amp=.4)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.23, 0, 1.36), (.28, -.03, 1.08), (.29, -.11, .86), CANVAS, mat('Mitt', (.1, .1, .1), .6), r=(.075, .065, .062, .055), cuff=BRASS, amp=.4)
pB = P['ArmB']; h = Vector((.3, -.15, .82))
attach(limb('KnifeGrip', tuple(h + Vector((0, 0, .05))), tuple(h + Vector((0, 0, -.05))), [(0, .014), (1, .014)], BRASS, segs=8), pB, amp=.4)
attach(lathe('KnifeBlade', [(0, 0), (.02, 0), (.016, .15), (0, .2)], mat('Steel', (.5, .52, .56), .3, 1.0), segs=3, sy=.2, xf=Matrix.Translation(h + Vector((0, 0, -.05))) @ Matrix.Rotation(PI, 4, 'X')), pB, amp=.3)
# ---------- Tail: the air hose trailing from the back of the helmet ----------
attach(tube('AirHose', [(0, .2, 1.65), (0, .3, 1.5), (.05, .38, 1.2), (-.03, .45, .8), (.04, .55, .4), (0, .65, .05)], .022, RUBBER), P['Tail'], amp=.3)
for k in range(4):
    attach(torus('HoseBand%d' % k, (0 if k % 2 else .02, .3 + k * .08, 1.45 - k * .3), .026, .005, BRASS, rot=(.6, 0, 0), segs=10, minor=4), P['Tail'], amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
