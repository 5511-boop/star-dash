import math
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py').read())
reset()
PI = math.pi
D = PI / 180
root = empty('Lady_Root', (0, 0, 0))
P = {
    'Head': empty('Pivot_Head', (0, 0, 1.43), root),
    'ArmA': empty('Pivot_ArmA', (-.19, 0, 1.33), root),
    'ArmB': empty('Pivot_ArmB', (.19, 0, 1.33), root),
    'LegA': empty('Pivot_LegA', (-.07, 0, .80), root),
    'LegB': empty('Pivot_LegB', (.07, 0, .80), root),
    'Tail': empty('Pivot_Tail', (0, .24, .75), root),
}
# ---------- materials: warm-toned so she reads as the "warm" player in the dark ----------
DRESS = mat('DoveGrey', (.34, .30, .30), .85)
DRESS2 = mat('DoveGreyDeep', (.2, .18, .185), .88)
LACE = mat('BlackLace', (.012, .009, .012), .8)
SATIN = mat('BlackSatin', (.01, .008, .011), .35)
SKIN = mat('Porcelain', (.85, .66, .6), .5)
HAIR = mat('Hair', (.035, .014, .01), .6)
LIPS = mat('Lips', (.35, .08, .09), .45)
EYE = mat('EyeDark', (.02, .01, .01), .2)
GLINT = mat('EyeGlint', (1, .6, .25), .2, 0, emit=(1, .55, .2), es=5, vcol=False)
ROSEGOLD = mat('RoseGold', (.72, .38, .3), .3, 1.0)
IVORY = mat('Ivory', (.78, .66, .5), .45)
CAMEO = mat('CameoRelief', (.5, .33, .26), .5)
CANDLE = mat('Candle', (.9, .82, .68), .55)
FLAME = mat('CandleFlame', (1, .75, .35), .3, 0, emit=(1, .62, .22), es=16, vcol=False)
PEWTER = mat('Pewter', (.38, .36, .36), .4, 1.0)
VEIL = mat('VeilNet', (.01, .008, .012), .6, 0, alpha=.5)

def pleat(a, z):
    bustle = 1 + .13 * math.exp(-((a - 90 * D) / (55 * D)) ** 2) * _smoothstep(.35, .55, z) * (1 - _smoothstep(.9, 1.0, z))
    return bustle * (1 + .022 * math.sin(14 * a) * max(0, (1.0 - z) / .9))

SK = [(.50, .06), (.492, .10), (.466, .16), (.44, .25), (.452, .262), (.44, .275), (.415, .34), (.388, .44), (.398, .455), (.386, .47), (.36, .52), (.335, .62), (.30, .72), (.25, .82), (.19, .92), (.14, .99)]
SK = [(r, z, 0, 0, .96) for r, z in SK]
BOD = [(.125, 1.02), (.14, 1.08), (.158, 1.16), (.166, 1.24), (.17, 1.31), (.172, 1.36), (.15, 1.40), (.10, 1.425), (.062, 1.435)]
BSY = .74
skirt = lathe('Skirt', SK, DRESS, segs=48, mod=pleat, sy=1.0)
attach(skirt, root, amp=.3, freq=8, seed=2, grad=(.06, .5, .4))
inner = lathe('SkirtInner', [(r - .015, z, 0, 0, .96) for r, z, _, _, _ in SK[:10]], DRESS2, segs=24, mod=pleat, flip=True)
attach(inner, root, amp=.1)
bod = lathe('Bodice', BOD, DRESS, segs=32, sy=BSY, capt=True)
attach(bod, root, amp=.3, freq=11, seed=5)
# lace-trimmed flounces + hem ruffles
for k, (z, r) in enumerate(((.07, .505), (.262, .455), (.462, .402))):
    ruff = lambda a, zz, k=k: 1 + .035 * math.sin((46 + k * 6) * a)
    fr = lathe('Frill%d' % k, [(r, z, 0, 0, .96), (r + .022, z - .018, 0, 0, .96), (r + .03, z - .05, 0, 0, .96)], LACE, segs=96, mod=lambda a, zz, k=k: pleat(a, z) * (1 + .03 * math.sin((46 + k * 6) * a)))
    attach(fr, root, amp=.2, freq=20)
    attach(tube('HemTrim%d' % k, [(r * pleat(a * D, z) * math.cos(a * D), r * .96 * pleat(a * D, z) * math.sin(a * D), z) for a in range(0, 361, 15)], .0055, SATIN, closed=False), root, noisy=False)
# bodice details: black satin waist band + buttons + yoke lace
attach(tube('Waistband', [(.13 * math.cos(a * D), .13 * BSY * math.sin(a * D) , 1.03) for a in range(0, 361, 20)], .011, SATIN), root, noisy=False)
yoke = lathe('LaceYoke', [(.172, 1.355), (.168, 1.37), (.15, 1.395), (.115, 1.415), (.075, 1.43)], LACE, segs=32, sy=BSY * 1.04, mod=lambda a, z: 1 + .02 * math.sin(30 * a))
attach(yoke, root, amp=.2, freq=22)
for i in range(9):
    z = 1.31 - i * .03
    attach(ell('Btn%d' % i, (0, -BSY * (.166 + (z - 1.24) * .06 + .1 * 0) - .006 - .0, z), .0075, .005, .0075, SATIN, segs=8, rings=5), root, noisy=False)
# high lace collar + ruffle
col = lathe('LaceCollar', [(.072, 1.42), (.074, 1.47), (.082, 1.50), (.092, 1.52), (.084, 1.525), (.07, 1.5), (.066, 1.47), (.064, 1.42)], LACE, segs=24, closed=True, mod=lambda a, z: 1 + .03 * math.sin(26 * a))
attach(col, root, amp=.2, freq=20)
neck = lathe('Neck', [(.046, 1.40), (.043, 1.46), (.045, 1.50)], SKIN, segs=14)
attach(neck, P['Head'], noisy=False)
# cameo brooch
bz = 1.345
by = -BSY * .172 - .004
attach(torus('CameoRing', (0, by - .003, bz), .021, .0045, ROSEGOLD, rot=(PI / 2, 0, 0), segs=20, minor=6, scale=(1, 1.3, 1)), root, amp=.3, freq=30)
attach(ell('CameoBase', (0, by - .003, bz), .021, .004, .027, IVORY, segs=16, rings=6), root, amp=.15, freq=30)
attach(ell('CameoHead', (0, by - .007, bz + .002), .01, .003, .015, CAMEO, segs=10, rings=6), root, noisy=False)
attach(ell('CameoHair', (0, by - .008, bz + .012), .008, .003, .007, CAMEO, segs=8, rings=4), root, noisy=False)

# ---------- legs (mostly hidden under the skirt; shoes peek when walking) ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .07
    attach(limb('Stocking' + key, (x, 0, .80), (x, 0, .10), [(0, .05), (.6, .04), (1, .032)], SATIN, segs=10), p, noisy=False)
    attach(ell('Shoe' + key, (x, -.04, .04), .038, .105, .04, SATIN, segs=12, rings=7), p, noisy=False)
    attach(box('ShoeHeel' + key, (x, .04, .022), (.05, .04, .044), SATIN, bevel=.004), p, noisy=False)

# ---------- head ----------
hp = P['Head']
attach(ell('Hair', (0, .018, 1.558), .101, .102, .108, HAIR, segs=18, rings=10), hp, amp=.3, freq=20)
attach(ell('Bun', (0, .1, 1.545), .05, .05, .045, HAIR, segs=12, rings=7), hp, amp=.3, freq=20)
attach(ell('FaceSkin', (0, -.012, 1.552), .085, .088, .1, SKIN, segs=18, rings=10), hp, amp=.12, freq=14)
for s in (-1, 1):
    attach(ell('Eye%d' % s, (s * .032, -.093, 1.565), .0125, .006, .0085, EYE, segs=10, rings=6), hp, noisy=False)
    attach(ell('Glint%d' % s, (s * .032, -.1, 1.567), .0045, .002, .0035, GLINT, segs=6, rings=4), hp, noisy=False)
    attach(tube('Brow%d' % s, [(s * .052, -.092, 1.59), (s * .033, -.1, 1.595), (s * .014, -.098, 1.59)], .0025, HAIR), hp, noisy=False)
attach(ell('Nose', (0, -.103, 1.545), .008, .01, .012, SKIN, segs=8, rings=5), hp, amp=.1)
attach(ell('Lips', (0, -.097, 1.512), .017, .007, .006, LIPS, segs=10, rings=5), hp, noisy=False)
# mourning hat: small black pillbox with a satin rose and ribbon
hat = lathe('Hat', [(.07, 1.625), (.115, 1.628), (.125, 1.645), (.115, 1.675), (.08, 1.69), (.03, 1.693), (0, 1.692)], SATIN, segs=24, sy=1.05)
attach(hat, hp, amp=.15, freq=14)
attach(torus('HatBand', (0, 0, 1.636), .121, .008, LACE, segs=24, minor=5, scale=(1, 1.05, 1)), hp, amp=.2)
for k in range(5):
    a = k * 72 * D
    attach(ell('Petal%d' % k, (.075 + .03 * math.cos(a), -.075 + .026 * math.sin(a), 1.7), .026, .026, .012, SATIN, segs=10, rings=5), hp, noisy=False)
attach(ell('RoseCore', (.075, -.075, 1.708), .016, .016, .012, LACE, segs=8, rings=5), hp, noisy=False)
# black lace veil: net over the face and a long drape behind
veil_front = lathe('VeilNet', [(.105, 1.50), (.112, 1.53), (.114, 1.58), (.108, 1.63), (.07, 1.655)], VEIL, segs=24, arc=(-170 * D, -10 * D), mod=lambda a, z: 1 + .015 * math.sin(30 * a), sy=1.0)
veil_front.location = (0, -.012, 0)
attach(veil_front, hp, noisy=False)
drape = lathe('VeilDrape', [(.12, 1.62), (.15, 1.55), (.18, 1.45), (.205, 1.33), (.22, 1.2), (.225, 1.08)], VEIL, segs=18, arc=(10 * D, 170 * D), mod=lambda a, z: 1 + .035 * math.sin(20 * a + z * 8), sy=.9)
drape.location = (0, .02, 0)
attach(drape, hp, noisy=False)

# ---------- arms ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh = (s * .19, 0, 1.33); el = (s * .235, -.035, 1.07); wr = (s * .245, -.13, .86)
    attach(ell('Puff' + key, (s * .195, 0, 1.345), .075, .07, .07, DRESS, segs=14, rings=8), p, amp=.3, freq=11)
    attach(limb('Upper' + key, sh, el, [(0, .06), (.5, .048), (1, .04)], DRESS, segs=12), p, amp=.3, freq=11, seed=s)
    attach(limb('Fore' + key, el, wr, [(0, .04), (.7, .036), (1, .034)], DRESS, segs=12), p, amp=.3, freq=11, seed=s + 2)
    xf, L = between(el, wr)
    c = Vector(el) + (Vector(wr) - Vector(el)) * .96
    fr = torus('CuffLace' + key, tuple(c), .042, .01, LACE, segs=16, minor=4)
    fr.rotation_euler = xf.to_euler(); attach(fr, p, amp=.2, freq=22)
    attach(ell('Hand' + key, (s * .245, -.14, .815), .03, .028, .042, LACE, segs=10, rings=6), p, amp=.15, freq=20)
    attach(ell('Thumb' + key, (s * .245 - s * .01, -.168, .83), .011, .012, .022, LACE, segs=8, rings=4), p, amp=.15)
    for k in range(3):
        attach(ell('Fing%s%d' % (key, k), (s * .245 + (k - 1) * .011, -.157, .785), .009, .01, .02, LACE, segs=7, rings=4), p, amp=.15)
# the never-melting candle (right hand, ArmB side)
pB = P['ArmB']
cx, cy = .245, -.14
attach(torus('CandleDish', (cx, cy, .835), .048, .006, PEWTER, segs=18, minor=5), pB, amp=.4, freq=24)
attach(lathe('CandleDishBase', [(.046, .832), (.034, .826), (0, .826)], PEWTER, segs=16, center=(cx, cy, 0)), pB, amp=.3)
attach(limb('CandleHolder', (cx, cy, .835), (cx, cy, .86), [(0, .027), (1, .021)], PEWTER, segs=10), pB, amp=.3)
attach(limb('CandleWax', (cx, cy, .86), (cx, cy, 1.02), [(0, .0195), (.55, .019), (1, .0175)], CANDLE, segs=14), pB, amp=.15, freq=18)
attach(ell('CandleDrip', (cx + .017, cy - .006, .985), .005, .005, .02, CANDLE, segs=6, rings=4), pB, noisy=False)
attach(limb('Wick', (cx, cy, 1.015), (cx, cy, 1.032), [(0, .0018), (1, .0014)], LACE, segs=5), pB, noisy=False)
attach(ell('CandleFlame', (cx, cy, 1.062), .013, .013, .033, FLAME, segs=10, rings=7), pB, noisy=False)

# ---------- back bustle bow (Tail pivot, sways when she walks) ----------
tp = P['Tail']
for s in (-1, 1):
    attach(ell('BowLoop%d' % s, (s * .07, .262, .86), .07, .02, .04, SATIN, segs=12, rings=7, ), tp, noisy=False)
    b = box('BowTail%d' % s, (s * .04, .335, .66), (.04, .01, .2), SATIN, rot=(-.22, 0, s * .1), bevel=.004)
    attach(b, tp, noisy=False)
attach(ell('BowKnot', (0, .255, .86), .028, .026, .028, SATIN, segs=10, rings=6), tp, noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
