import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(22)
root, P = setup('Forgemaster', 1.5, (.29, 1.38), (.11, .9), (.0, 1.0))
# The Forgemaster: a hunched brute of cracked magma with a riveted iron mask bolted to its skull, a grille over a
# molten maw, black iron horns, spiked pauldrons, ribs burst through its chest, chains, meat hooks and a spiked hammer.
MAGMA = mat_glow_tex('MagmaSkin', make_image('MagmaSkin', 256, 256, magma_px), .6, 1.2)
LEATHER = mat('BurntLeather', (.06, .035, .022), .75)
IRON = mat('RustIron', (.16, .085, .05), .55, .75)
BLACK = mat('BlackIron', (.035, .032, .035), .35, .9)
BONE = mat('CharredBone', (.32, .26, .2), .5)
CHAR = mat('Charcoal', (.03, .025, .025), .8)
MAW = mat('MoltenMaw', (1, .3, .02), .4, 0, emit=(1, .22, .01), es=1, vcol=False)
DRIP = mat('MoltenDrip', (1, .4, .05), .3, 0, emit=(1, .3, .02), es=.8, vcol=False)
SPARK = mat('Spark', (1, .7, .2), .3, 0, emit=(1, .6, .15), es=8, vcol=False)
EYE = mat('HellEye', (1, .6, .25), .2, 0, emit=(1, .4, .1), es=1.6, vcol=False)

def cone(name, base, tip, r, m, segs=7):
    return limb(name, base, tip, [(0, r), (.6, r * .55), (1, 0)], m, segs=segs)
def horn(name, pts, r0, m, parent):
    """a tapering horn along pts (chain of cones), thickest at the root"""
    n = len(pts) - 1
    for i in range(n):
        ra, rb = r0 * (1 - i / n) ** .8, r0 * max(.02, (1 - (i + 1) / n)) ** .8
        attach(limb('%s%d' % (name, i), pts[i], pts[i + 1], [(0, ra), (1, rb)], m, segs=9), parent, amp=.35)
def chain(name, p0, p1, n, m, parent, r=.018):
    p0, p1 = Vector(p0), Vector(p1); d = (p1 - p0)
    q = d.to_track_quat('Z', 'Y')
    for i in range(n):
        c = p0 + d * (i / max(n - 1, 1))
        rot = (q @ Quaternion((0, 0, 1), (i % 2) * PI / 2) @ Quaternion((1, 0, 0), PI / 2)).to_euler()
        attach(torus('%s%d' % (name, i), tuple(c), r, r * .3, m, rot=tuple(rot), segs=10, minor=4, scale=(1, 1.5, 1)), parent, amp=.4)

SY = .74; HY = lambda z: -.1 * max(0, (z - 1.0) / .5) ** 1.5   # the hunch: upper body leans forward
# ---------- torso: hunched magma, ribs torn out through the chest ----------
TOR = [(.23, .84), (.25, .96), (.29, 1.1), (.33, 1.24), (.345, 1.33), (.32, 1.41), (.25, 1.46), (.13, 1.5), (.07, 1.505)]
attach(lathe('Torso', [(r, z, 0, HY(z)) for r, z in TOR], MAGMA, segs=30, sy=SY, capt=True), root, noisy=False)
for side in (-1, 1):
    for k in range(4):   # ribs: blackened bone arcs bursting out of the chest, splayed and broken
        z = 1.12 + k * .06; a0 = side * 10 * D; rr = .32 + k * .012
        pts = [(math.sin(a0 + side * t * 32 * D) * rr, -math.cos(a0 + side * t * 32 * D) * rr * SY * 1.02 - .035 * (1 - t) + HY(z), z - t * .025) for t in (0, .5, 1)]
        attach(tube('Rib%d_%d' % (side, k), pts, .0085, BONE), root, amp=.5)
        attach(cone('RibTip%d_%d' % (side, k), pts[0], (pts[0][0] - side * .015, pts[0][1] - .045, pts[0][2] + .015), .0085, BONE, 6), root, amp=.5)
# ---------- tattered burnt apron, belt hung with chains and meat hooks ----------
jag = lambda a, z: (-.07 * abs(math.sin(a * 7.3)) - .04 * abs(math.sin(a * 17.1))) if z < .5 else 0
apron = lathe('Apron', [(.28, .42), (.26, .7), (.25, .9), (.27, 1.1), (.3, 1.24)], LEATHER, segs=22, sy=SY * 1.06, arc=(-150 * D, -30 * D), zmod=jag)
attach(apron, root, amp=.45, freq=14); holes(apron, freq=22, thresh=.7, dark=.05)
attach(torus('Belt', (0, 0, .9), .25, .026, LEATHER, segs=28, minor=5, scale=(1, SY * 1.06, 1)), root, amp=.4)
attach(lathe('Hips', [(.225, .78), (.24, .86)], LEATHER, segs=22, sy=.76), root, amp=.4)
for k, x in enumerate((-.2, -.08, .1, .21)):   # meat hooks swinging on short chains
    yb = -math.sqrt(max(0, .25 ** 2 - x * x)) * SY * 1.06 - .02
    chain('HookChain%d' % k, (x, yb, .88), (x, yb - .01, .74), 4, IRON, root, .014)
    hk = [(x, yb - .01, .73), (x, yb - .02, .66), (x + .03, yb - .04, .62), (x + .045, yb - .03, .66)]
    attach(tube('Hook%d' % k, hk, .006, BLACK), root, amp=.3)
# ---------- spiked pauldrons ----------
for s in (-1, 1):
    c = Vector((s * .28, -.04, 1.42))
    attach(ell('Pauldron%d' % s, tuple(c), .14, .13, .08, IRON, segs=16, rings=8), root, amp=.5, freq=14)
    for k, (dx, dz, ln) in enumerate(((.02, .07, .16), (.08, .03, .13), (-.05, .06, .11))):
        b = c + Vector((s * dx, -.01, dz)); t = b + Vector((s * ln * .55, .02, ln))
        attach(cone('PSpike%d_%d' % (s, k), tuple(b), tuple(t), .028, BLACK), root, amp=.3)
    for k in range(5):
        a = (k / 5) * PI
        attach(ell('Rivet%d_%d' % (s, k), tuple(c + Vector((s * .1 * math.cos(a), -.11 * math.sin(a), .03))), .01, .01, .01, BLACK, segs=6, rings=4), root, noisy=False)
# ---------- smoking vents growing out of the spine ----------
for k, (x, z, tilt) in enumerate(((-.09, 1.36, -.35), (.09, 1.36, .35), (0, 1.25, 0))):
    b = Vector((x, .19, z)); t = b + Vector((tilt * .1, .12, .15))
    attach(limb('Vent%d' % k, tuple(b), tuple(t), [(0, .045), (1, .038)], BLACK, segs=10, caps=False), root, amp=.4)
    attach(ell('VentGlow%d' % k, tuple(t), .033, .033, .012, MAW, segs=10, rings=5), root, noisy=False)
    for j in range(3):
        attach(ell('Smoke%d_%d' % (k, j), tuple(t + Vector((random.uniform(-.03, .03), .04 * j, .05 + .07 * j))), .006, .006, .006, SPARK, segs=5, rings=3), root, noisy=False)

# ---------- head: an iron mask bolted onto the skull, eye slits and a grille over a molten maw, horns ----------
hp = P['Head']; HYh = -.09
attach(limb('Neck', (0, HYh, 1.45), (0, HYh - .02, 1.56), [(0, .085), (1, .07)], MAGMA, segs=12), hp, noisy=False)
fc = (0, HYh - .02, 1.63); R = (.105, .11, .12)
attach(ell('Skull', fc, *R, MAGMA, segs=22, rings=12), hp, noisy=False)
mask = lathe('Mask', [(.09, 1.52), (.112, 1.56), (.12, 1.62), (.116, 1.69), (.1, 1.73), (.06, 1.755)], BLACK, segs=20, sy=1.05, arc=(-165 * D, -15 * D), center=(0, fc[1] - .008))
attach(mask, hp, amp=.5, freq=16)
for s in (-1, 1):   # eye slits: black recesses with white-hot pinpoints
    ex = s * .045; ey = fc[1] - .118
    attach(box('Slit%d' % s, (ex, ey, 1.655), (.05, .012, .013), CHAR, rot=(0, s * -.25, 0)), hp, noisy=False)
    attach(ell('Eye%d' % s, (ex, ey - .006, 1.655), .02, .004, .007, EYE, segs=8, rings=5, xf=None), hp, noisy=False)
    attach(ell('BrowRidge%d' % s, (s * .05, ey + .005, 1.682), .05, .02, .012, BLACK, segs=10, rings=5), hp, amp=.3)
my = fc[1] - .008 - .125   # front surface of the mask at mouth height
attach(ell('Maw', (0, my, 1.575), .05, .006, .03, MAW, segs=14, rings=6), hp, noisy=False)
for k in range(6):   # grille bars over the maw
    attach(limb('Grille%d' % k, ((k - 2.5) * .017, my - .008, 1.61), ((k - 2.5) * .015, my - .006, 1.54), [(0, .0045), (1, .0045)], BLACK, segs=6), hp, amp=.3)
for k in range(5):   # molten drool dripping through the grille
    x = (k - 2) * .019; l = random.uniform(.025, .065)
    attach(limb('Drip%d' % k, (x, my - .005, 1.55), (x, my - .012, 1.55 - l), [(0, .006), (.8, .004), (1, .0065)], DRIP, segs=6), hp, noisy=False)
for k in range(8):   # bolts hammered through the mask into the skull
    a = (-160 + k * 20) * D
    p = (math.cos(a) * .118, fc[1] - .008 + math.sin(a) * .12 * 1.05, 1.715 if k % 2 else 1.53)
    attach(ell('Bolt%d' % k, p, .011, .011, .011, IRON, segs=6, rings=4), hp, noisy=False)
for s in (-1, 1):   # curling black iron horns
    pts = [(s * .085, fc[1] + .01, 1.7), (s * .15, fc[1] + .04, 1.77), (s * .22, fc[1] + .03, 1.79), (s * .27, fc[1] - .02, 1.75), (s * .28, fc[1] - .07, 1.69), (s * .26, fc[1] - .1, 1.66)]
    horn('Horn%d_' % s, pts, .042, BLACK, hp)

# ---------- legs: charred trousers, iron boots, shackles ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .11, .88, (.1, .082, .07), CHAR, BLACK, boot_top=.36, toe=.16)
    attach(torus('Shackle' + key, (s * .11, 0, .3), .085, .016, IRON, segs=14, minor=5), P[key], amp=.4)
    chain('LegChain' + key, (s * .11, -.08, .29), (s * .16, -.2, .02), 6, IRON, P[key], .014)
    attach(cone('KneeSpike' + key, (s * .11, -.08, .55), (s * .11, -.2, .6), .025, BLACK), P[key], amp=.3)
# ---------- arms: thick cracked magma, chains wound round them, black claws ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    sh, el, wr = (.29, -.03, 1.38), (.36, -.07, 1.1), (.37, -.16, .87)
    hc = arm(P, key, s, sh, el, wr, MAGMA, CHAR, r=(.1, .082, .08, .062), amp=.1, sleeve_tex=True)
    p = P[key]; E_, W_ = Vector((s * el[0], el[1], el[2])), Vector((s * wr[0], wr[1], wr[2]))
    for k in range(5):   # chain wrapped round the forearm
        c = E_.lerp(W_, .15 + k * .17)
        attach(torus('ArmChain%s%d' % (key, k), tuple(c), .075, .012, IRON, rot=(.25 * (k % 2), .3, 0), segs=12, minor=4), p, amp=.4)
    d = (W_ - E_).normalized(); hv = Vector(hc)
    for k in range(4):   # long hooked claws
        side = Vector((s * (k - 1.5) * .022, -.02, 0))
        b = hv + side + d * .03; t = b + d * .09 + Vector((0, -.05, -.02))
        attach(cone('Claw%s%d' % (key, k), tuple(b), tuple(t), .012, BLACK, 6), p, amp=.2)
# a huge spiked hammer with a glowing face in hand B
pB = P['ArmB']; h = Vector((.38, -.22, .82))
attach(limb('HammerHaft', tuple(h + Vector((0, 0, -.18))), tuple(h + Vector((0, -.02, .52))), [(0, .02), (1, .024)], LEATHER, segs=8), pB, amp=.4)
for k in range(3):
    attach(torus('HaftWrap%d' % k, tuple(h + Vector((0, -.004, .05 + k * .05))), .026, .006, IRON, segs=10, minor=4), pB, amp=.3)
hh = h + Vector((0, -.03, .57))
attach(box('HammerHead', tuple(hh), (.11, .3, .13), BLACK, bevel=.015), pB, amp=.5, freq=14)
attach(box('HammerFace', tuple(hh + Vector((0, -.155, 0))), (.12, .02, .14), MAGMA, bevel=.006), pB, noisy=False)
for k, (dx, dz) in enumerate(((0, .075), (.065, 0), (-.065, 0), (0, -.075))):
    b = hh + Vector((dx, .04, dz)); t = b + Vector((dx * 1.4, .0, dz * 1.4)) + Vector((0, .0, 0))
    if dx == 0 and dz > 0: t = b + Vector((0, 0, .12))
    attach(cone('HSpike%d' % k, tuple(b), tuple(t if (t - b).length > .01 else b + Vector((0, .12, 0))), .022, IRON), pB, amp=.3)
attach(cone('HSpikeBack', tuple(hh + Vector((0, .15, 0))), tuple(hh + Vector((0, .3, .02))), .035, IRON), pB, amp=.3)
# ---------- Tail: chains and a flayed rag dragging behind ----------
tp = P['Tail']
for s in (-1, 1):
    chain('TailChain%d' % s, (s * .1, .2, .9), (s * .14, .3, .3), 7, IRON, tp, .016)
rag = box('Rag', (-.15, .2, .72), (.1, .006, .26), LEATHER, rot=(-.15, 0, .25)); attach(rag, tp, amp=.5); holes(rag, freq=30, thresh=.6, dark=.05)

bpy.context.view_layer.update()
print('tris', tris())
