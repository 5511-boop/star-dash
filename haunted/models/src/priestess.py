import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(17)
root, P = setup('Priestess', 1.40, (.15, 1.31), (.07, .86), (.14, .95))
# The Jackal Priestess: a black jackal mask, white linen and gold, a glowing ankh (warm-toned)
LINEN = mat('SheerLinen', (.78, .74, .64), .8)
GOLD = mat('TempleGold', (.88, .62, .2), .25, .85)
BLACK = mat('JackalBlack', (.008, .008, .01), .3)
SKIN = mat('BronzeSkin', (.45, .28, .18), .45)
ANKH = mat('AnkhGlow', (1, .75, .3), .2, 0, emit=(1, .65, .2), es=6, vcol=False)
EYE = mat('JackalEye', (1, .6, .15), .2, 0, emit=(1, .55, .1), es=8, vcol=False)
COLLAR = mat_tex('PriestessCollar', make_image('PriestessCollar', 64, 128, lambda u, v: stripes_px(u, v, 8, [(.88, .62, .2), (.6, .12, .08), (.88, .62, .2), (.05, .4, .4)], line=(.15, .1, .04))), .3, .4)

# ---------- sheath dress with a gold sash, broad collar ----------
DR = [(.3, .03), (.27, .3), (.2, .65), (.15, .9), (.14, 1.0), (.15, 1.12), (.155, 1.22), (.14, 1.29), (.1, 1.32), (.06, 1.335)]
attach(lathe('Dress', DR, LINEN, segs=32, sy=.8, capt=True, mod=lambda a, z: 1 + .02 * math.sin(a * 16) * max(0, .9 - z)), root, amp=.3, freq=10)
attach(torus('Sash', (0, 0, .97), .145, .014, GOLD, segs=24, minor=4, scale=(1, .8, 1)), root, amp=.3)
for s in (-1, 1):
    attach(box('SashEnd%d' % s, (s * .03, -.13, .7), (.035, .006, .5), GOLD, rot=(.04, 0, s * .05)), root, amp=.3)
attach(lathe('Collar', [(.06, 1.34), (.13, 1.33), (.19, 1.28), (.21, 1.23), (.2, 1.22), (.12, 1.3), (.055, 1.33)], COLLAR, segs=28, sy=.82, closed=True), root, noisy=False)

# ---------- head: the jackal mask: long snout, tall ears, gold-rimmed eyes ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.44), [(0, .036), (1, .034)], SKIN, segs=10), hp, amp=.15)
attach(ell('MaskHead', (0, .01, 1.52), .085, .095, .1, BLACK, segs=20, rings=10), hp, amp=.1)
snout = lathe('Snout', [(.05, 0), (.045, .05), (.03, .11), (.018, .15), (0, .16)], BLACK, segs=14, sy=.8,
              xf=Matrix.Translation((0, -.06, 1.49)) @ Matrix.Rotation(PI / 2 + .25, 4, 'X'))
attach(snout, hp, amp=.1)
attach(ell('Nose', (0, -.215, 1.45), .014, .012, .01, BLACK, segs=8, rings=5), hp, amp=.1)
for s in (-1, 1):
    ear = lathe('Ear%d' % s, [(.03, 0), (.025, .06), (.012, .12), (0, .15)], BLACK, segs=8, sx=1.0, sy=.4,
                xf=Matrix.Translation((s * .05, .02, 1.59)) @ Matrix.Rotation(s * -.2, 4, 'Y'))
    attach(ear, hp, amp=.1)
    attach(lathe('EarGold%d' % s, [(.018, .02), (.012, .08), (0, .11)], GOLD, segs=6, sy=.3,
                 xf=Matrix.Translation((s * .05, .009, 1.59)) @ Matrix.Rotation(s * -.2, 4, 'Y')), hp, amp=.2)
    attach(ell('Eye%d' % s, (s * .04, -.075, 1.54), .013, .006, .008, EYE, segs=8, rings=5), hp, noisy=False)
    attach(torus('EyeRim%d' % s, (s * .04, -.078, 1.54), .016, .003, GOLD, rot=(PI / 2, 0, 0), segs=10, minor=3, scale=(1.3, 1, 1)), hp, amp=.2)
attach(tube('MaskTrim', [(s * .07, -.06, 1.47) for s in (-1,)] + [(0, -.1, 1.45)] + [(.07, -.06, 1.47)], .004, GOLD), hp, amp=.2)
# linen headcloth hanging behind the mask
attach(lathe('Headcloth', [(.09, 1.55), (.11, 1.45), (.13, 1.32), (.13, 1.25)], LINEN, segs=14, sy=.9, arc=(20 * D, 160 * D)), hp, amp=.3)

# ---------- arms: bare bronze skin, gold cuffs; the glowing ankh in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.15, 0, 1.31), (.19, -.03, 1.06), (.205, -.1, .85), SKIN, SKIN, r=(.038, .032, .03, .026), amp=.15)
    for t, r in ((.35, .036), (.85, .03)):
        a0, a1 = (s * .15, 0, 1.31), (s * .19, -.03, 1.06)
        if t > .5: a0, a1 = (s * .19, -.03, 1.06), (s * .205, -.1, .85)
        xf, L = between(a0, a1)
        attach(lathe('Cuff%s%d' % (key, int(t * 10)), [(r, 0), (r * 1.15, .02), (r, .04)], GOLD, segs=12, xf=xf @ Matrix.Translation((0, 0, L * .4))), P[key], amp=.3)
pB = P['ArmB']; h = Vector((.215, -.14, .8))
attach(limb('AnkhStem', tuple(h + Vector((0, 0, -.12))), tuple(h + Vector((0, 0, .1))), [(0, .012), (1, .012)], ANKH, segs=8), pB, noisy=False)
attach(limb('AnkhBar', tuple(h + Vector((-.06, 0, .1))), tuple(h + Vector((.06, 0, .1))), [(0, .011), (1, .011)], ANKH, segs=8), pB, noisy=False)
attach(torus('AnkhLoop', tuple(h + Vector((0, 0, .155))), .04, .011, ANKH, rot=(PI / 2, 0, 0), segs=16, minor=6, scale=(.8, 1.2, 1)), pB, noisy=False)
# ---------- legs: sandals ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .86), (x, 0, .06), [(0, .045), (1, .03)], SKIN, segs=10), P[key], amp=.1)
    attach(ell('Foot' + key, (x, -.035, .03), .03, .08, .022, SKIN, segs=10, rings=6), P[key], amp=.1)
    attach(box('Sandal' + key, (x, -.035, .006), (.065, .18, .012), GOLD, bevel=.004), P[key], amp=.3)
# ---------- Tail: the linen train ----------
attach(lathe('Train', [(.25, .5), (.3, .25), (.34, .03)], LINEN, segs=8, sy=.85, arc=(65 * D, 115 * D)), P['Tail'], amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
