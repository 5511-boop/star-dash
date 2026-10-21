import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(14)
root, P = setup('Doll', 1.3, (.16, 1.22), (.075, .8), (.0, 1.25))
# The Stitched Doll: rag skin with seams, button eyes, a stitched smile, yarn hair, patchwork pinafore (warm-toned)
def check_px(u, v):
    i, j = int(u * 12), int(v * 8)
    c = (.7, .25, .15) if (i + j) % 2 else (.85, .62, .35)
    if (u * 12 % 1) < .06 or (v * 8 % 1) < .06: c = (.4, .12, .08)
    n = noise.noise(Vector((u * 30, v * 30, 1))) * .5 + .5
    return tuple(ch * (.85 + .15 * n) for ch in c)
GINGHAM = mat_tex('Gingham', make_image('DollGingham', 128, 128, check_px), .95)
RAG = mat('RagSkin', (.8, .58, .45), .95)
APRON = mat('Apron', (.82, .78, .7), .9)
YARN = mat('YarnHair', (.6, .14, .04), .9)
BTN = mat('ButtonEye', (.01, .01, .012), .2)
THREAD = mat('Thread', (.45, .05, .05), .8)
STRIPE = mat('StockingRed', (.5, .06, .05), .8)
SHOE = mat('MaryJane', (.02, .015, .015), .3)
STEEL = mat('NeedleSteel', (.7, .72, .75), .2, 1.0)
PATCH = mat('KneePatch', (.25, .3, .5), .95)

def stitches(name, pts, parent, n=8, w=.012):
    """a seam: a running line with little cross stitches."""
    attach(tube(name, pts, .0025, THREAD), parent, noisy=False)
    path = [Vector(p) for p in pts]
    for i in range(n):
        t = (i + .5) / n * (len(path) - 1); j = min(int(t), len(path) - 2); f = t - j
        c = path[j].lerp(path[j + 1], f); d = (path[j + 1] - path[j]).normalized()
        side = d.cross(Vector((0, -1, 0))).normalized() * w
        attach(tube('%sX%d' % (name, i), [tuple(c - side), tuple(c + side)], .0022, THREAD), parent, noisy=False)

# ---------- pinafore dress over a rag body ----------
SK = [(.3, .38), (.28, .5), (.22, .7), (.17, .84), (.15, .9)]
attach(lathe('Skirt', SK, GINGHAM, segs=32, sy=.85, mod=lambda a, z: 1 + .05 * math.sin(10 * a) * max(0, (.8 - z) / .4)), root, noisy=False)
attach(lathe('Bodice', [(.15, .89), (.155, .98), (.165, 1.08), (.168, 1.15), (.15, 1.2), (.1, 1.225), (.06, 1.23)], GINGHAM, segs=24, sy=.8, capt=True), root, noisy=False)
attach(lathe('Apron', [(.31, .42), (.26, .58), (.2, .76), (.165, .9)], APRON, segs=10, sy=.86, arc=(-125 * D, -55 * D)), root, amp=.2)
attach(box('Bib', (0, -.8 * .165 - .006, 1.04), (.12, .006, .16), APRON, bevel=.004), root, amp=.2)
for s in (-1, 1):
    attach(box('Strap%d' % s, (s * .06, -.06, 1.18), (.025, .004, .14), APRON, rot=(.5, 0, 0)), root, amp=.2)
attach(tube('ApronHem', [(.31 * math.cos(a * D), .31 * .86 * math.sin(a * D) - .002, .42) for a in range(-125, -54, 10)], .006, THREAD), root, noisy=False)
attach(ell('Patch', (.08, -.8 * .167 - .008, 1.0), .03, .004, .03, PATCH, segs=8, rings=4), root, amp=.3)
stitches('PatchSeam', [(.05, -.142, .975), (.05, -.142, 1.025), (.11, -.142, 1.025)], root, n=4, w=.006)

# ---------- head: big rag head, button eyes, stitched smile, yarn hair ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.22), (0, 0, 1.32), [(0, .04), (1, .04)], RAG, segs=10), hp, amp=.15)
fc = (0, 0, 1.43); R = (.13, .125, .13)
attach(ell('Head', fc, *R, RAG, segs=22, rings=12), hp, amp=.15, freq=14)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .065, .57)
    attach(ell('Button%d' % s, (x, y - .006, z), .03, .01, .03, BTN, segs=14, rings=6), hp, amp=.1)
    for i in range(4):
        hx = x + (.008 if i % 2 else -.008); hz = z + (.008 if i < 2 else -.008)
        attach(ell('BtnHole%d%d' % (s, i), (hx, y - .016, hz), .004, .002, .004, RAG, segs=5, rings=3), hp, noisy=False)
    attach(tube('BtnThreadA%d' % s, [(x - .008, y - .017, z - .008), (x + .008, y - .017, z + .008)], .0018, THREAD), hp, noisy=False)
    attach(tube('BtnThreadB%d' % s, [(x - .008, y - .017, z + .008), (x + .008, y - .017, z - .008)], .0018, THREAD), hp, noisy=False)
smile = [on_face(fc, R, -.08, .37), on_face(fc, R, -.04, .33), on_face(fc, R, 0, .32), on_face(fc, R, .04, .33), on_face(fc, R, .08, .37)]
stitches('Smile', smile, hp, n=9, w=.01)
stitches('HeadSeam', [on_face(fc, R, .12, .2), on_face(fc, R, .13, .5), on_face(fc, R, .12, .8)], hp, n=6)
for k in range(16):   # yarn hair: bangs + long strands
    a = (-160 + k * 22) * D
    top = (R[0] * .8 * math.cos(a), R[1] * .8 * math.sin(a) + .02, 1.54)
    if math.sin(a) < -.6:
        attach(tube('Bang%d' % k, [top, (R[0] * 1.02 * math.cos(a), R[1] * 1.02 * math.sin(a), 1.5)], .01, YARN), hp, amp=.2)
    else:
        mid = (R[0] * 1.08 * math.cos(a), R[1] * 1.08 * math.sin(a) + .02, 1.42)
        attach(tube('Yarn%d' % k, [top, mid, (R[0] * 1.15 * math.cos(a), R[1] * 1.15 * math.sin(a) + .03, 1.22 + .02 * (k % 3))], .011, YARN), hp, amp=.2)
attach(ell('YarnCap', (0, .02, 1.5), .12, .115, .08, YARN, segs=14, rings=7), hp, amp=.25)
for s in (-1, 1):
    attach(ell('Bow%d' % s, (s * .05, .02, 1.57), .04, .012, .025, THREAD, segs=8, rings=5), hp, amp=.2)

# ---------- floppy rag arms with seams; a big needle and thread in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .16, 0, 1.22), (s * .21, -.02, 1.0), (s * .22, -.08, .8)
    attach(ell('Puff' + key, (s * .165, 0, 1.22), .055, .05, .05, GINGHAM, segs=12, rings=7), p, noisy=False)
    attach(limb('Arm' + key, sh, wr, [(0, .036), (.5, .034), (1, .032)], RAG, segs=10), p, amp=.15)
    attach(ell('Mitt' + key, tuple(Vector(wr) + Vector((0, -.012, -.04))), .03, .025, .045, RAG, segs=10, rings=6), p, amp=.15)
    stitches('ArmSeam' + key, [tuple(Vector(sh) + Vector((s * .03, 0, -.05))), tuple(Vector(wr) + Vector((s * .03, 0, .02)))], p, n=5, w=.006)
pB = P['ArmB']; h = Vector((.225, -.11, .76))
attach(limb('Needle', tuple(h + Vector((0, -.02, .2))), tuple(h + Vector((0, -.04, -.2))), [(0, .006), (.9, .005), (1, .0)], STEEL, segs=6), pB, amp=.1)
attach(torus('NeedleEye', tuple(h + Vector((0, -.02, .18))), .007, .002, STEEL, rot=(0, PI / 2, 0), segs=8, minor=3), pB, noisy=False)
attach(tube('NeedleThread', [tuple(h + Vector((0, -.02, .18))), tuple(h + Vector((.06, .0, .1))), tuple(h + Vector((.05, .05, -.1))), tuple(h + Vector((.08, .1, -.35)))], .0025, THREAD), pB, noisy=False)

# ---------- legs: striped stockings, Mary Janes, a patched knee ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .075
    attach(limb('Leg' + key, (x, 0, .8), (x, 0, .07), [(0, .05), (1, .04)], RAG, segs=10), p, amp=.1)
    for k in range(6):
        attach(torus('Stripe%s%d' % (key, k), (x, 0, .1 + k * .055), .042, .007, STRIPE, segs=12, minor=4), p, noisy=False)
    attach(ell('Shoe' + key, (x, -.035, .04), .045, .085, .04, SHOE, segs=12, rings=7), p, amp=.15)
    attach(torus('ShoeStrap' + key, (x, -.02, .07), .04, .005, SHOE, rot=(0, PI / 2, 0), segs=12, minor=4), p, noisy=False)
attach(ell('KneePatchL', (-.075, -.04, .45), .03, .006, .03, PATCH, segs=8, rings=4), P['LegA'], amp=.3)
# ---------- Tail: a big apron bow and a loose thread at the back ----------
tp = P['Tail']
for s in (-1, 1):
    attach(ell('ApronBow%d' % s, (s * .05, .15, .9), .045, .012, .03, APRON, segs=10, rings=6), tp, amp=.2)
    attach(box('ApronTie%d' % s, (s * .03, .16, .75), (.025, .005, .25), APRON, rot=(-.12, 0, s * .15)), tp, amp=.2)
attach(tube('LooseThread', [(0, .14, 1.0), (.03, .2, .8), (-.02, .25, .55), (.02, .3, .4)], .002, THREAD), tp, noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
