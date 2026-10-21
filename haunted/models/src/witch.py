import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(13)
root, P = setup('Witch', 1.39, (.15, 1.31), (.07, .85), (.14, .9))
# The Hedge Witch: herb-stitched hat, a raven on her shoulder, bone charms, patchwork skirt (warm-toned)
def patch_px(u, v):
    i, j = int(u * 9), int(v * 5)
    h = (i * 7 + j * 13) % 5
    c = [(.55, .22, .1), (.68, .48, .18), (.36, .16, .22), (.5, .36, .2), (.62, .3, .16)][h]
    n = noise.noise(Vector((u * 40, v * 40, h))) * .5 + .5
    c = [ch * (.8 + .2 * n) for ch in c]
    fu, fv = u * 9 - i, v * 5 - j
    if min(fu, 1 - fu) < .03 or min(fv, 1 - fv) < .05:     # stitched seams
        c = [.12, .07, .04] if (u * 140 + v * 40) % 1 < .55 else [.75, .65, .45]
    return tuple(c)
PATCH = mat_tex('Patchwork', make_image('WitchPatchwork', 256, 256, patch_px), .9)
BODICE = mat('MossBodice', (.06, .08, .03), .85)
SHAWL = mat('RustShawl', (.35, .1, .04), .95)
HAT = mat('HatFelt', (.03, .02, .02), .9)
SKIN = mat('WarmSkin', (.66, .42, .32), .55)
HAIR = mat('WildAuburn', (.3, .08, .03), .6)
BONE = mat('Bone', (.8, .74, .62), .6)
STEM = mat('HerbStem', (.08, .16, .04), .7)
MARI = mat('Marigold', (.9, .45, .05), .6)
ROSEHIP = mat('Rosehip', (.6, .06, .04), .4)
LAV = mat('Lavender', (.35, .25, .55), .7)
RAVEN = mat('Raven', (.008, .008, .012), .35)
BEAK = mat('Beak', (.05, .04, .03), .3)
BROOM = mat('BroomStraw', (.5, .38, .15), .9)
WOOD = mat('Ash', (.15, .09, .05), .7)
EYE = mat('WitchEye', (.15, .4, .1), .2, 0, emit=(.6, .9, .2), es=1.5, vcol=False)
REYE = mat('RavenEye', (1, .55, .1), .2, 0, emit=(1, .5, .1), es=6, vcol=False)

# ---------- patchwork skirt, mossy bodice, rust shawl ----------
SK = [(.42, .04), (.4, .15), (.34, .42), (.24, .75), (.15, .92), (.13, .98)]
attach(lathe('Skirt', SK, PATCH, segs=36, sy=.85, mod=lambda a, z: 1 + .04 * math.sin(9 * a) * max(0, (.8 - z) / .8),
             zmod=lambda a, z: (.03 * math.sin(a * 5) if z < .06 else 0)), root, noisy=False)
attach(lathe('Bodice', [(.13, .97), (.135, 1.05), (.15, 1.15), (.158, 1.24), (.142, 1.3), (.1, 1.33), (.06, 1.345)], BODICE, segs=24, sy=.8, capt=True), root, amp=.3)
for i, z in enumerate((1.06, 1.12, 1.18, 1.24)):   # bodice lacing
    for s in (-1, 1):
        attach(tube('Lace%d%d' % (i, s), [(-s * .025, -.8 * .15 - .006, z), (s * .025, -.8 * .15 - .006, z + .05)], .003, BONE), root, noisy=False)
attach(lathe('Shawl', [(.06, 1.36), (.15, 1.33), (.2, 1.27), (.215, 1.2), (.2, 1.12)], SHAWL, segs=32, sy=.85,
             zmod=lambda a, z: (-.14 * max(0, math.sin(a)) ** 3 + .012 * math.sin(a * 6) if z < 1.15 else 0)), root, amp=.45, freq=20)
for k in range(12):   # shawl fringe
    a = (k / 12) * 2 * PI
    z0 = 1.12 - .14 * max(0, math.sin(a)) ** 3
    x, y = .2 * math.cos(a), .2 * .85 * math.sin(a)
    attach(tube('Fringe%d' % k, [(x, y, z0), (x * 1.03, y * 1.03, z0 - .05)], .004, SHAWL), root, amp=.3)
# bone charms: necklace of finger bones + charms at the belt
for k in range(9):
    a = (-90 + (k - 4) * 15) * D
    x, y = .12 * math.cos(a), .12 * .85 * math.sin(a) - .01
    z = 1.3 - .05 * math.cos((k - 4) / 4 * PI / 2)
    attach(limb('NeckBone%d' % k, (x, y, z), (x, y - .004, z - .028), [(0, .004), (.5, .003), (1, .0045)], BONE, segs=5), root, amp=.3)
attach(tube('Cord', [(.12 * math.cos(a * D), .12 * .85 * math.sin(a * D) - .01, 1.3 - .05 * math.cos((a + 90) / 60 * PI / 2)) for a in range(-150, -29, 15)], .002, BEAK), root, noisy=False)
attach(torus('Belt', (0, 0, .97), .135, .01, WOOD, segs=24, minor=4, scale=(1, .85, 1)), root, amp=.3)
for k, x in enumerate((-.1, -.05, .06, .11)):
    y = -.85 * math.sqrt(max(.14 ** 2 - x * x, .001)) - .01
    attach(tube('CharmCord%d' % k, [(x, y, .96), (x, y - .01, .88 - k % 2 * .04)], .002, BEAK), root, noisy=False)
    if k % 2: attach(ell('Skull%d' % k, (x, y - .012, .86 - .04), .014, .012, .016, BONE, segs=8, rings=6), root, amp=.3)
    else: attach(limb('Bone%d' % k, (x - .012, y - .01, .875), (x + .012, y - .01, .875), [(0, .006), (.5, .004), (1, .006)], BONE, segs=6), root, amp=.3)

# ---------- head: freckled warm face, wild hair, a crooked hat stitched with herbs ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.44), [(0, .036), (1, .034)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.51); R = (.082, .088, .1)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.12, freq=18)
eyes(hp, fc, R, EYE, du=.05, v=.585, size=(.01, .005, .007))
attach(ell('Nose', on_face(fc, R, 0, .48), .011, .02, .016, SKIN, segs=8, rings=5), hp, amp=.12)
attach(tube('Smile', [on_face(fc, R, -.035, .33), on_face(fc, R, 0, .31), on_face(fc, R, .035, .33)], .0028, ROSEHIP), hp, noisy=False)
for k in range(10):
    du = random.uniform(-.09, .09); v = random.uniform(.43, .52)
    if abs(du) > .02: attach(ell('Freckle%d' % k, on_face(fc, R, du, v), .003, .002, .003, mat('Freckle', (.3, .14, .08), .6), segs=5, rings=3), hp, noisy=False)
attach(ell('HairMass', (0, .03, 1.5), .1, .1, .11, HAIR, segs=16, rings=9), hp, amp=.35, freq=26)
for k in range(9):   # wild locks
    a = (40 + k * 12) * D + PI
    s = 1 if k % 2 else -1
    base = (s * .085, .03 + .01 * k, 1.53 - .01 * k)
    attach(tube('Lock%d' % k, [base, (s * .12, .05 + .01 * k, 1.42 - .02 * k), (s * .11 + .02 * math.sin(k), .07 + .01 * k, 1.3 - .02 * k)], .011, HAIR), hp, amp=.35)
hat = empty('HatPivot', (0, 0, 1.585), hp)
attach(lathe('HatBrim', [(.09, 1.585), (.18, 1.578), (.23, 1.565), (.235, 1.56), (.18, 1.572), (.09, 1.58)], HAT, segs=30, closed=True, mod=lambda a, z: 1 + .06 * math.sin(3 * a)), hat, amp=.4, freq=12)
cone = [(.1, 1.58), (.09, 1.65), (.07, 1.72), (.05, 1.79, .01, .0), (.032, 1.85, .03, .01), (.016, 1.9, .06, .02), (0, 1.93, .09, .03)]
attach(lathe('HatCone', cone, HAT, segs=20, mod=lambda a, z: 1 + .05 * math.sin(4 * a + z * 20)), hat, amp=.45, freq=14)
attach(torus('HatBand', (0, 0, 1.605), .097, .009, SHAWL, segs=20, minor=4), hat, amp=.4)
# herbs stitched into the band: stems with leaves, marigolds, rosehips, lavender
for k in range(9):
    a = (200 + k * 18) * D
    b = Vector((.1 * math.cos(a), .1 * math.sin(a), 1.61))
    d = Vector((math.cos(a) * .4, math.sin(a) * .4, 1)).normalized()
    tip = b + d * random.uniform(.06, .1)
    attach(tube('Stem%d' % k, [tuple(b), tuple(b.lerp(tip, .5) + Vector((0, 0, .005))), tuple(tip)], .0025, STEM), hat, noisy=False)
    m = [MARI, ROSEHIP, LAV][k % 3]
    if m is LAV:
        for t in range(4): attach(ell('Lav%d_%d' % (k, t), tuple(b.lerp(tip, .55 + t * .15)), .006, .006, .009, LAV, segs=6, rings=4), hat, noisy=False)
    else:
        attach(ell('Bloom%d' % k, tuple(tip), .014 if m is MARI else .009, .014 if m is MARI else .009, .008 if m is MARI else .011, m, segs=8, rings=5), hat, amp=.2)
    attach(ell('Leaf%d' % k, tuple(b.lerp(tip, .4) + Vector((.008, 0, 0))), .012, .004, .007, STEM, segs=6, rings=4), hat, noisy=False)
hat.rotation_euler = (-.08, .12, 0)

# ---------- the raven on her left shoulder (rides with the body) ----------
rc = Vector((-.16, .02, 1.385))
rp = empty('RavenPivot', tuple(rc), root)
attach(ell('RavenBody', tuple(rc + Vector((0, .01, .05))), .04, .06, .045, RAVEN, segs=12, rings=7), rp, amp=.2)
attach(ell('RavenHead', tuple(rc + Vector((0, -.04, .1))), .028, .03, .028, RAVEN, segs=10, rings=6), rp, amp=.2)
attach(lathe('RavenBeak', [(.01, 0), (.006, .02), (0, .04)], BEAK, segs=8, xf=Matrix.Translation(rc + Vector((0, -.065, .1))) @ Matrix.Rotation(PI / 2 + .2, 4, 'X')), rp, amp=.2)
for s in (-1, 1):
    attach(ell('RavenEye%d' % s, tuple(rc + Vector((s * .02, -.055, .108))), .005, .004, .005, REYE, segs=6, rings=4), rp, noisy=False)
    w = ell('RavenWing%d' % s, tuple(rc + Vector((s * .035, .025, .05))), .015, .065, .035, RAVEN, segs=10, rings=6)
    w.rotation_euler = (-.3, 0, s * .15); attach(w, rp, amp=.2)
attach(box('RavenTail', tuple(rc + Vector((0, .085, .025))), (.035, .07, .008), RAVEN, rot=(.4, 0, 0), bevel=.003), rp, amp=.2)
for s in (-1, 1):
    attach(limb('RavenLeg%d' % s, tuple(rc + Vector((s * .012, .0, .015))), tuple(rc + Vector((s * .012, -.005, -.005))), [(0, .003), (1, .003)], BEAK, segs=4), rp, noisy=False)

rp.scale = (1.4, 1.4, 1.4)
# ---------- arms + a straw broom in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.15, 0, 1.31), (.19, -.03, 1.06), (.205, -.1, .85), SHAWL, SKIN, r=(.042, .036, .034, .03), cuff=BODICE, amp=.35)
pB = P['ArmB']; hx, hy = .215, -.14
attach(limb('BroomHandle', (hx, hy, .3), (hx + .01, hy - .02, 1.45), [(0, .013), (1, .011)], WOOD, segs=8), pB, amp=.4, freq=20)
attach(lathe('Bristles', [(.02, .34), (.045, .26), (.07, .12), (.085, .03), (0, .03)], BROOM, segs=18, center=(hx, hy), mod=lambda a, z: 1 + .12 * math.sin(a * 11)), pB, amp=.4, freq=30)
attach(torus('BroomBind', (hx, hy, .3), .03, .006, SHAWL, segs=12, minor=4), pB, amp=.3)

# ---------- legs: striped stockings and buckled boots, peeking under the skirt ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .07
    attach(limb('Leg' + key, (x, 0, .85), (x, 0, .1), [(0, .05), (1, .034)], mat('Stocking', (.05, .03, .02), .8), segs=10), p, amp=.1)
    for k in range(4):
        attach(torus('Stripe%s%d' % (key, k), (x, 0, .13 + k * .05), .036 + k * .002, .004, SHAWL, segs=12, minor=4), p, noisy=False)
    attach(ell('Boot' + key, (x, -.04, .045), .04, .11, .045, HAT, segs=12, rings=7), p, amp=.3)
    attach(lathe('BootToe' + key, [(.02, 0), (.01, .04), (0, .05)], HAT, segs=8, xf=Matrix.Translation((x, -.14, .05)) @ Matrix.Rotation(-PI / 2 - .5, 4, 'X')), p, amp=.3)
# ---------- Tail: a bundle of dried herbs and a charm hanging at the back of the belt ----------
tp = P['Tail']
for k in range(5):
    attach(tube('Bundle%d' % k, [(-.03 + k * .015, .14, .95), (-.04 + k * .02, .16, .8)], .004, STEM if k % 2 else BROOM), tp, amp=.3)
attach(torus('BundleTie', (0, .145, .92), .03, .005, SHAWL, rot=(.2, 0, 0), segs=12, minor=4), tp, amp=.3)
attach(ell('BackSkull', (0, .16, .78), .016, .014, .018, BONE, segs=8, rings=6), tp, amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
