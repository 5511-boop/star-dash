import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(33)
L = .05   # drifts just above the floor
root, P = setup('Saint', 1.42 + L, (.15, 1.33 + L), (.07, .88 + L), (.14, .95 + L))
# The Stained-Glass Saint: robes of glowing leaded glass, a crown of thorns as a halo (warm-toned)
PAL = [(.95, .6, .12), (.75, .12, .1), (.98, .78, .3), (.85, .35, .3), (.6, .08, .12), (.9, .48, .2), (.95, .85, .55)]
PTS = [(random.random(), random.random(), PAL[i % len(PAL)]) for i in range(46)]
def glass_px(u, v):
    best = [9, 9]; col = None
    for (px, py, c) in PTS:
        dx = min(abs(u - px), 1 - abs(u - px)); dy = abs(v - py)
        d = dx * dx + dy * dy * 1.6
        if d < best[0]: best = [d, best[0]]; col = c
        elif d < best[1]: best[1] = d
    if math.sqrt(best[1]) - math.sqrt(best[0]) < .012: return (.05, .04, .035)     # lead came
    n = noise.noise(Vector((u * 30, v * 30, 4))) * .5 + .5
    return tuple(ch * (.75 + .25 * n) for ch in col)
GLASS = mat_glow_tex('StainedGlass', make_image('StainedGlass', 256, 256, glass_px), .15, 1.1)
LEAD = mat('Lead', (.05, .045, .04), .5, .6)
SKIN = mat('GildedSkin', (.85, .64, .42), .35)
THORN = mat('Thorn', (.12, .07, .03), .7)
HALO = mat('HaloGlow', (1, .75, .35), .3, 0, emit=(1, .7, .3), es=4, vcol=False)
LIDS = mat('ClosedEyes', (.25, .12, .05), .5)

# ---------- glass robe: long panels hanging from the shoulders, pointed at the hem ----------
pts = lambda a, z: (-.06 * abs(math.sin(a * 6)) ** 2 if z < .06 + L else 0)
RB = [(.36, .04 + L), (.33, .25 + L), (.27, .55 + L), (.2, .85 + L), (.16, 1.0 + L), (.165, 1.12 + L), (.18, 1.24 + L), (.17, 1.31 + L), (.12, 1.35 + L), (.06, 1.36 + L)]
attach(lathe('Robe', RB, GLASS, segs=36, sy=.85, capt=True, zmod=pts), root, noisy=False)
for k in range(12):   # lead mullions down the robe
    a = k / 12 * 2 * PI
    path = [((r + .003) * math.cos(a), (r + .003) * .85 * math.sin(a), z) for r, z in RB[:5]]
    attach(tube('Mullion%d' % k, path, .005, LEAD), root if math.sin(a) < .5 else P['Tail'], amp=.2)
for z, r in ((.85 + L, .2), (.55 + L, .27), (.25 + L, .33)):
    attach(torus('Transom%d' % int(z * 100), (0, 0, z), r + .004, .005, LEAD, segs=36, minor=4, scale=(1, .85, 1)), root, amp=.2)
attach(torus('Girdle', (0, 0, 1.0 + L), .165, .01, LEAD, segs=24, minor=4, scale=(1, .85, 1)), root, amp=.2)

# ---------- head: gilded face, eyes closed in prayer, glass veil, thorn halo ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.35 + L), (0, 0, 1.46 + L), [(0, .036), (1, .034)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.53 + L); R = (.08, .086, .098)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.1)
for s in (-1, 1):
    attach(tube('Lid%d' % s, [on_face(fc, R, s * .03, .58), on_face(fc, R, s * .05, .565), on_face(fc, R, s * .07, .58)], .0025, LIDS), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .47), .008, .011, .014, SKIN, segs=8, rings=5), hp, amp=.1)
attach(tube('Mouth', [on_face(fc, R, -.02, .33), on_face(fc, R, 0, .325), on_face(fc, R, .02, .33)], .0022, LIDS), hp, noisy=False)
hood('Veil', (0, 0, 1.53 + L), .108, .3, GLASS, hp, open_front=40, sy=1.08, droop=.012)
for s in (-1, 1):
    a = (-90 + s * 40) * D
    attach(tube('VeilLead%d' % s, [(r * math.cos(a), r * 1.08 * math.sin(a) + .012, z + L) for r, z in ((.08, 1.4), (.11, 1.47), (.116, 1.53), (.11, 1.6), (.08, 1.69), (.03, 1.72))], .005, LEAD), hp, amp=.2)
hc = Vector((0, .11, 1.56 + L))
attach(torus('HaloRing', tuple(hc), .17, .009, HALO, rot=(PI / 2, 0, 0), segs=36, minor=5), hp, noisy=False)
attach(torus('ThornCrown', tuple(hc + Vector((0, .006, 0))), .17, .014, THORN, rot=(PI / 2, 0, 0), segs=36, minor=5), hp, amp=.3)
for k in range(24):   # thorns, alternating out and in
    a = k / 24 * 2 * PI + random.uniform(-.05, .05)
    base = hc + Vector((.17 * math.cos(a), .006, .17 * math.sin(a)))
    out = Vector((math.cos(a), random.uniform(-.4, .4), math.sin(a))).normalized() * (1 if k % 2 else -.6)
    attach(lathe('Thorn%d' % k, [(.006, 0), (.002, .03), (0, .04)], THORN, segs=5,
                 xf=Matrix.Translation(base) @ out.to_track_quat('Z', 'Y').to_matrix().to_4x4()), hp, amp=.3)

# ---------- arms: glass sleeves, gilded hands; a glowing glass heart cradled in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .15, 0, 1.33 + L), (s * .19, -.04, 1.08 + L), (s * .2, -.12, .88 + L)
    attach(ell('Shoulder' + key, sh, .05, .048, .048, GLASS, segs=12, rings=7), p, noisy=False)
    attach(limb('Upper' + key, sh, el, [(0, .042), (1, .046)], GLASS, segs=10), p, noisy=False)
    xf, Ln = between(el, wr)
    attach(lathe('Sleeve' + key, [(.045, 0), (.065, Ln * .6), (.09, Ln), (.095, Ln * 1.05)], GLASS, segs=14, xf=xf), p, noisy=False)
    attach(torus('SleeveLead' + key, tuple(Vector(el).lerp(Vector(wr), 1.02)), .092, .005, LEAD, rot=xf.to_euler(), segs=14, minor=4), p, amp=.2)
    hcen = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .04
    attach(ell('Hand' + key, tuple(hcen), .022, .02, .036, SKIN, segs=10, rings=6), p, amp=.1)
pB = P['ArmB']
heart = Vector((.2, -.17, .83 + L))
for s in (-1, 1):
    attach(ell('HeartLobe%d' % s, tuple(heart + Vector((s * .014, 0, .01))), .02, .016, .02, HALO, segs=10, rings=6), pB, noisy=False)
attach(lathe('HeartTip', [(.03, 0), (.0, -.04)], HALO, segs=10, sy=.8, xf=Matrix.Translation(heart + Vector((0, 0, .005)))), pB, noisy=False)
attach(torus('HeartThorns', tuple(heart + Vector((0, 0, .005))), .03, .004, THORN, rot=(PI / 2, 0, 0), segs=14, minor=4), pB, amp=.3)

# ---------- no visible feet; leg pivots carry glass shards under the hem ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    for k in range(2):
        b = box('Shard%s%d' % (key, k), (s * .07 + random.uniform(-.03, .03), -.05 + random.uniform(-.03, .03), .02 + L + k * .03), (.03, .004, .05), GLASS, rot=(random.uniform(-.5, .5), random.uniform(-.5, .5), random.uniform(0, 3)))
        attach(b, P[key], noisy=False)
# ---------- Tail: a glass train panel behind ----------
attach(lathe('Train', [(.3, .4 + L), (.36, .2 + L), (.42, .02 + L)], GLASS, segs=8, sy=.9, arc=(65 * D, 115 * D), zmod=pts), P['Tail'], noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
