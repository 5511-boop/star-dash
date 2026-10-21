import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(9)
root, P = setup('Knight', 1.52, (.24, 1.43), (.1, .93), (.15, .95))
# The Penitent Knight: chained armour, a torn tabard, a candle burning on his great helm (cool-toned)
STEEL = mat('WornSteel', (.42, .45, .5), .42, 1.0)
DARK = mat('ArmourGap', (.02, .02, .025), .7)
CHAIN = mat('ChainIron', (.22, .23, .25), .5, 1.0)
TABARD = mat('SlateTabard', (.04, .06, .11), .9)
CROSS = mat('FadedCross', (.55, .56, .6), .9)
WAX = mat('CandleWax', (.85, .8, .7), .55)
FLAME = mat('HelmFlame', (1, .75, .35), .3, 0, emit=(1, .6, .2), es=12, vcol=False)
EYE = mat('SlitGlow', (.4, .7, 1), .2, 0, emit=(.35, .65, 1), es=9, vcol=False)
LEATHER = mat('Strap', (.06, .035, .02), .6)

def chain(name, pts, parent, link=.022):
    """a run of interlocking links along a polyline."""
    path = [Vector(p) for p in pts]
    segs = list(zip(path, path[1:])); total = sum((b - a).length for a, b in segs)
    n = int(total / link); d = 0; k = 0
    for i in range(n):
        t = i * link
        for a, b in segs:
            L = (b - a).length
            if t <= L:
                c = a + (b - a) * (t / L); dirv = (b - a).normalized(); break
            t -= L
        q = dirv.to_track_quat('Y', 'Z').to_euler()
        o = torus('%s%d' % (name, i), tuple(c), .009, .0028, CHAIN, rot=(q.x, q.y + (PI / 2 if i % 2 else 0), q.z), segs=7, minor=3, scale=(1, 1.5, 1))
        attach(o, parent, amp=.4, freq=40)

SY = .68
BR = [(.21, .95), (.22, 1.02), (.245, 1.15), (.262, 1.27), (.265, 1.36), (.25, 1.43), (.2, 1.48), (.12, 1.51), (.08, 1.515)]
attach(lathe('Breastplate', BR, STEEL, segs=30, sy=SY, capt=True, mod=lambda a, z: 1 + .035 * max(0, -math.sin(a)) ** 8 * (z > 1.1)), root, amp=.45, freq=12, seed=2)
for k in range(4):   # fauld: overlapping hip lames
    z = .98 - k * .055; r = .225 + k * .018
    attach(lathe('Lame%d' % k, [(r - .01, z + .01), (r, z), (r + .006, z - .05), (r - .004, z - .055)], STEEL, segs=28, sy=SY * 1.05), root, amp=.45, freq=12, seed=k)
    attach(torus('LameGap%d' % k, (0, 0, z - .052), r - .002, .004, DARK, segs=28, minor=3, scale=(1, SY * 1.05, 1)), root, noisy=False)
# torn tabard over the plate, front and back
rag = lambda a, z: (-.07 * abs(math.sin(a * 9 + 1)) ** 3 if z < .62 else 0)
for nm, arc in (('TabardF', (-128 * D, -52 * D)), ('TabardB', (52 * D, 128 * D))):
    attach(lathe(nm, [(.25, 1.44), (.272, 1.3), (.265, 1.1), (.29, .9), (.31, .6)], TABARD, segs=10, sy=SY * 1.05, arc=arc, zmod=rag), root if nm == 'TabardF' else P['Tail'], amp=.4, freq=10)
attach(box('CrossV', (0, -SY * 1.05 * .27 - .006, 1.05), (.04, .004, .36), CROSS, bevel=.002), root, amp=.5, freq=12)
attach(box('CrossH', (0, -SY * 1.05 * .27 - .006, 1.13), (.22, .004, .04), CROSS, bevel=.002), root, amp=.5, freq=12)
attach(torus('SwordBelt', (0, 0, .97), .25, .012, LEATHER, rot=(0, .12, 0), segs=28, minor=4, scale=(1, SY * 1.08, 1)), root, amp=.3)
# penitent's chains wound round the body
chain('BodyChain', [(-.22, -.12, 1.42), (-.1, -.2, 1.3), (.08, -.19, 1.15), (.22, -.12, 1.02), (.24, .1, .98), (.05, .19, 1.1), (-.18, .16, 1.3), (-.22, .02, 1.42)], root)

# ---------- great helm with an eye slit and a candle melting on top ----------
hp = P['Head']
attach(limb('Gorget', (0, 0, 1.47), (0, 0, 1.56), [(0, .085), (1, .07)], STEEL, segs=16), hp, amp=.4)
helm = lathe('GreatHelm', [(.105, 1.55), (.112, 1.6), (.115, 1.68), (.11, 1.76), (.09, 1.79), (0, 1.8)], STEEL, segs=24, sy=1.08, capb=True,
             mod=lambda a, z: 1 + .06 * max(0, -math.sin(a)) ** 6)   # keel down the face
attach(helm, hp, amp=.45, freq=14, seed=4)
attach(box('EyeSlit', (0, -.124, 1.705), (.13, .02, .014), DARK), hp, noisy=False)
for s in (-1, 1):
    attach(ell('Eye%d' % s, (s * .03, -.115, 1.705), .01, .004, .005, EYE, segs=8, rings=5), hp, noisy=False)
for i in range(3):
    for j in range(2):
        attach(ell('Breath%d%d' % (i, j), ((j * 2 - 1) * (.035 + i * .015), -.12 + .01 * i, 1.63 - i * .015), .004, .006, .004, DARK, segs=6, rings=4), hp, noisy=False)
attach(torus('HelmBand', (0, 0, 1.66), .114, .006, STEEL, segs=24, minor=4, scale=(1, 1.08, 1)), hp, amp=.4)
attach(limb('Candle', (.0, .0, 1.79), (0, 0, 1.92), [(0, .028), (1, .025)], WAX, segs=12), hp, amp=.15)
for k in range(6):   # wax running down the helm
    a = k * 60 * D + .3
    top = Vector((.03 * math.cos(a), .03 * math.sin(a), 1.8)); bot = Vector((.1 * math.cos(a), .1 * 1.08 * math.sin(a), 1.76 - .02 * (k % 3)))
    attach(tube('Drip%d' % k, [tuple(top), tuple(top.lerp(bot, .5) + Vector((0, 0, .005))), tuple(bot)], .007, WAX), hp, amp=.15)
attach(ell('WaxPool', (0, 0, 1.795), .05, .05, .012, WAX, segs=14, rings=6), hp, amp=.15)
attach(limb('Wick', (0, 0, 1.915), (0, 0, 1.93), [(0, .002), (1, .0015)], DARK, segs=4), hp, noisy=False)
attach(ell('Flame', (0, 0, 1.96), .014, .014, .035, FLAME, segs=10, rings=7), hp, noisy=False)

# ---------- armoured legs: cuisses, knee cops, greaves, pointed sabatons ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .1
    attach(limb('Cuisse' + key, (x, 0, .93), (x, 0, .55), [(0, .085), (1, .068)], STEEL, segs=12), p, amp=.45, freq=12)
    attach(ell('Knee' + key, (x, -.04, .52), .06, .045, .055, STEEL, segs=12, rings=7), p, amp=.45)
    attach(limb('Greave' + key, (x, 0, .5), (x, 0, .1), [(0, .062), (.35, .066), (1, .05)], STEEL, segs=12), p, amp=.45, freq=12)
    attach(lathe('Sabaton' + key, [(.05, 0), (.048, .04), (.03, .1), (.01, .17), (0, .19)], STEEL, segs=10, sy=.6,
                 xf=Matrix.Translation((x, .04, .045)) @ Matrix.Rotation(PI / 2, 4, 'X')), p, amp=.45)
    for k in range(2):
        attach(torus('GreaveStrap%s%d' % (key, k), (x, 0, .3 + k * .1), .064, .005, LEATHER, segs=12, minor=4), p, amp=.3)
# ---------- arms: layered pauldrons, plate, gauntlets; a broken sword in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .24, 0, 1.43), (s * .29, -.03, 1.15), (s * .3, -.11, .92)
    for k in range(3):
        pa = ell('Pauldron%s%d' % (key, k), (s * (.25 + k * .012), 0, 1.47 - k * .045), .1 - k * .008, .09 - k * .006, .05, STEEL, segs=14, rings=7)
        pa.rotation_euler = (0, s * (.4 + k * .1), 0); attach(pa, p, amp=.45, freq=12, seed=k)
    attach(limb('Rerebrace' + key, sh, el, [(0, .058), (1, .05)], STEEL, segs=12), p, amp=.45)
    attach(ell('Couter' + key, el, .055, .055, .055, STEEL, segs=12, rings=7), p, amp=.45)
    attach(limb('Vambrace' + key, el, wr, [(0, .05), (1, .045)], STEEL, segs=12), p, amp=.45)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .045
    attach(lathe('GauntletCuff' + key, [(.048, 0), (.06, .04), (.058, .045)], STEEL, segs=12, xf=between(el, wr)[0] @ Matrix.Translation((0, 0, between(el, wr)[1] * .85))), p, amp=.45)
    attach(ell('Gauntlet' + key, tuple(hc), .036, .034, .046, STEEL, segs=12, rings=7), p, amp=.45)
    chain('ArmChain' + key, [tuple(Vector(el) + Vector((s * .05, -.01, -.05))), tuple(Vector(wr) + Vector((s * .045, -.01, .06))), tuple(Vector(wr) + Vector((s * .02, -.04, -.04)))], p)
pB = P['ArmB']; h = Vector((.31, -.15, .86))
attach(limb('Grip', tuple(h + Vector((0, 0, .06))), tuple(h + Vector((0, 0, -.05))), [(0, .013), (1, .013)], LEATHER, segs=8), pB, amp=.3)
attach(ell('Pommel', tuple(h + Vector((0, 0, .075))), .02, .02, .02, STEEL, segs=8, rings=6), pB, amp=.45)
attach(box('Crossguard', tuple(h + Vector((0, 0, -.06))), (.16, .025, .02), STEEL, bevel=.006), pB, amp=.45)
blade = box('Blade', tuple(h + Vector((0, 0, -.22))), (.045, .009, .3), STEEL, bevel=.003)
attach(blade, pB, amp=.35, freq=20)
attach(lathe('BladeBreak', [(.0, 0), (.026, .0), (.0, -.04)], STEEL, segs=3, xf=Matrix.Translation(h + Vector((.005, 0, -.37)))), pB, amp=.35)
# ---------- Tail: a chain dragging behind with a broken shackle ----------
chain('DragChain', [(.1, .2, .97), (.12, .26, .7), (.1, .32, .4), (.06, .42, .12), (0, .55, .03)], P['Tail'], link=.026)
attach(torus('Shackle', (0, .58, .035), .03, .009, CHAIN, rot=(PI / 2, 0, .4), segs=12, minor=5), P['Tail'], amp=.4)

bpy.context.view_layer.update()
print('tris', tris())
