import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(11)
root, P = setup('Siren', 1.40, (.15, 1.31), (.07, .85), (.12, .9))
# The Tide Siren: kelp-and-pearl gown, coral crown, long copper hair (warm-toned)
KELP = mat('Kelp', (.16, .12, .03), .45)
KELP2 = mat('KelpAmber', (.32, .18, .03), .45)
GOWN = mat('GownSilk', (.12, .1, .05), .4)
PEARL = mat('Pearl', (.86, .8, .74), .18)
CORAL = mat('Coral', (.75, .2, .1), .6)
SKIN = mat('SirenSkin', (.78, .56, .48), .45)
HAIR = mat('CopperHair', (.26, .07, .025), .45)
SCALE = mat('Scales', (.5, .45, .3), .25, .6)
GOLD = mat('ShellGold', (.85, .55, .3), .35)
EYE = mat('AmberEye', (1, .6, .25), .2, 0, emit=(1, .55, .2), es=5, vcol=False)
LIPS = mat('CoralLips', (.5, .1, .08), .4)

# ---------- gown: fitted bodice flaring into a floor-length skirt ----------
GW = [(.42, .03), (.40, .1), (.34, .3), (.27, .52), (.2, .74), (.15, .9), (.13, .98), (.135, 1.06), (.152, 1.16), (.158, 1.24), (.14, 1.3), (.1, 1.33), (.06, 1.345)]
wave = lambda a, z: 1 + .035 * math.sin(11 * a + z * 3) * max(0, (.8 - z) / .8)
attach(lathe('Gown', GW, GOWN, segs=40, sy=.85, mod=wave, capt=True, zmod=lambda a, z: (.025 * math.sin(7 * a) if z < .05 else 0)), root, amp=.35, freq=9, grad=(.03, .4, .3))
# kelp blades hanging from the waist all round the skirt
for k in range(22):
    a = (k / 22) * 2 * PI + random.uniform(-.08, .08)
    m = KELP2 if k % 3 == 0 else KELP
    z0 = .98; ln = random.uniform(.6, .9)
    pts = []
    for t in (0, .25, .5, .75, 1):
        z = z0 - ln * t
        r = (.15 + (.42 - .15) * min(1, (z0 - z) / .95)) * .99 + .012
        aa = a + .08 * math.sin(t * 5 + k)
        pts.append((r * math.cos(aa), r * .85 * math.sin(aa), z))
    ob = tube('Kelp%d' % k, pts, .011, m)
    ob.scale = (1, 1, 1)
    attach(ob, root if math.sin(a) < .3 else P['Tail'], amp=.3, freq=14, seed=k)
# pearl strands: across the bodice and swagged on the skirt
def strand(name, pts, n, parent, r=.0075):
    for i in range(n):
        t = i / (n - 1)
        seg = t * (len(pts) - 1); j = min(int(seg), len(pts) - 2); f = seg - j
        p = Vector(pts[j]).lerp(Vector(pts[j + 1]), f)
        attach(ell('%s%d' % (name, i), tuple(p), r, r, r, PEARL, segs=8, rings=5), parent, amp=.1)
strand('PearlNeck', [(-.09, -.05, 1.34), (-.05, -.12, 1.28), (0, -.135, 1.26), (.05, -.12, 1.28), (.09, -.05, 1.34)], 13, root)
strand('PearlNeck2', [(-.1, -.06, 1.33), (-.06, -.135, 1.23), (0, -.15, 1.2), (.06, -.135, 1.23), (.1, -.06, 1.33)], 15, root)
for k in range(4):
    a = (-90 + (k - 1.5) * 50) * D
    c = lambda aa, z: (.3 * math.cos(aa) * 1.04, .3 * .85 * math.sin(aa) * 1.04 - .005, z)
    strand('Swag%d_' % k, [c(a - .35, .5), c(a, .43), c(a + .35, .5)], 9, root, .007)
# scalloped shell bodice edge
for k in range(9):
    a = (-90 + (k - 4) * 16) * D
    attach(ell('Shell%d' % k, (.142 * math.cos(a), .142 * .85 * math.sin(a) - .006, 1.3), .02, .006, .016, GOLD, segs=8, rings=5), root, amp=.2)

# ---------- head: copper hair to the waist, coral crown, scales on the cheekbones ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.45), [(0, .038), (1, .036)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.52); R = (.082, .086, .098)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.1)
eyes(hp, fc, R, EYE, du=.05, v=.585, size=(.011, .005, .007))
attach(ell('Lips', on_face(fc, R, 0, .33), .014, .006, .006, LIPS, segs=8, rings=5), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .47), .007, .01, .012, SKIN, segs=8, rings=5), hp, amp=.1)
for s in (-1, 1):
    for i in range(4):
        x, y, z = on_face(fc, R, s * (.085 + i * .012), .5 + (i % 2) * .03)
        attach(ell('Scale%d%d' % (s, i), (x, y - .001, z), .006, .003, .006, SCALE, segs=6, rings=4), hp, amp=.3)
attach(ell('HairCap', (0, .016, 1.535), .088, .09, .1, HAIR, segs=18, rings=10), hp, amp=.3, freq=24)
hair = lathe('HairFall', [(.085, 1.55), (.1, 1.45), (.12, 1.3), (.13, 1.12), (.12, 1.0), (.1, .95)], HAIR, segs=16, arc=(15 * D, 165 * D), sy=.9, mod=lambda a, z: 1 + .05 * math.sin(10 * a + z * 12))
hair.location = (0, .03, 0); attach(hair, hp, amp=.3, freq=20)
# coral crown: forking branches
def branch(name, base, d, ln, depth, parent):
    end = Vector(base) + Vector(d).normalized() * ln
    attach(tube(name, [tuple(base), tuple(Vector(base).lerp(end, .5) + Vector((0, 0, .004))), tuple(end)], .006 * (depth + 1) / 3 + .003, CORAL), parent, amp=.35, freq=40)
    if depth > 0:
        for sgn in (-1, 1):
            nd = Vector(d).normalized() + Vector((sgn * .5, 0, .2))
            branch(name + ('L' if sgn < 0 else 'R'), end, nd, ln * .62, depth - 1, parent)
for k in range(5):
    a = (270 + (k - 2) * 30) * D
    base = (.085 * math.cos(a), .085 * math.sin(a), 1.585)
    branch('Coral%d' % k, base, (math.cos(a) * .3, math.sin(a) * .3, 1), .05 if k != 2 else .065, 2, hp)

# ---------- arms (bare, pearl bracelets) + a conch in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    hc = arm(P, key, s, (.15, 0, 1.31), (.19, -.03, 1.06), (.205, -.1, .85), SKIN, SKIN, r=(.036, .03, .028, .022), amp=.1)
    xf, L = between((s * .19, -.03, 1.06), (s * .205, -.1, .85))
    attach(torus('Bracelet' + key, tuple(Vector((s * .19, -.03, 1.06)).lerp(Vector((s * .205, -.1, .85)), .82)), .026, .006, PEARL, rot=xf.to_euler(), segs=12, minor=5), P[key], amp=.1)
pB = P['ArmB']
cx, cy, cz = .24, -.16, .8
conch = lathe('Conch', [(0, 0), (.035, .02), (.042, .05), (.03, .09), (.015, .12), (0, .14)], GOLD, segs=18, mod=lambda a, z: 1 + .25 * math.sin(a * 2 + z * 30),
              xf=Matrix.Translation((cx, cy, cz)) @ Matrix.Rotation(-1.2, 4, 'X') @ Matrix.Translation((0, 0, -.05)))
attach(conch, pB, amp=.4, freq=30)
attach(ell('ConchLip', (cx, cy - .05, cz - .03), .03, .012, .04, CORAL, segs=10, rings=6), pB, amp=.3)

# ---------- legs: barely seen bare feet under the hem ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .85), (x, 0, .07), [(0, .045), (1, .028)], SKIN, segs=10), P[key], amp=.1)
    attach(ell('Foot' + key, (x, -.04, .03), .03, .08, .025, SKIN, segs=10, rings=6), P[key], amp=.1)
    strand('Anklet' + key, [(x - .03, -.01, .08), (x, -.035, .075), (x + .03, -.01, .08)], 5, P[key], .005)

bpy.context.view_layer.update()
print('tris', tris())
