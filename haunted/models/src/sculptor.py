import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(18)
root, P = setup('Sculptor', 1.49, (.21, 1.39), (.09, .9), (.18, .85))
# The Sculptor: clay-smeared smock, a face half-melted into wax, a carving knife (cool-toned)
def face_px(u, v):
    du = u - .75
    skin = [.6, .45, .38]
    if du > -.01 + .01 * math.sin(v * 40):   # his left side has run like a candle
        n = noise.noise(Vector((u * 10, v * 40, 3))) * .5 + .5
        c = [.88 * (.9 + .1 * n), .84 * (.9 + .1 * n), .78]
        if (u * 40) % 1 < .15 and v < .55: c = [x * .9 for x in c]
        return tuple(c)
    if abs(du + .05) < .03 and abs(v - .58) < .012: return (.05, .04, .04)
    if abs(du + .05) < .035 and abs(v - .64 + .01 * ((du + .05) / .035) ** 2) < .005: return (.2, .14, .1)
    return tuple(skin)
FACE = mat_tex('HalfWaxFace', make_image('HalfWaxFace', 256, 128, face_px), .4)
SMOCK = mat('SlateSmock', (.12, .15, .2), .9)
CLAY = mat('ClaySmear', (.3, .2, .14), .8)
WAX = mat('MeltWax', (.85, .8, .72), .35)
BERET = mat('Beret', (.02, .03, .07), .9)
SCARF = mat('ArtistScarf', (.08, .2, .3), .8)
STEEL = mat('KnifeSteel', (.6, .62, .66), .2, 1.0)
WOOD = mat('KnifeHandle', (.2, .12, .06), .6)
EYE = mat('WaxEye', (.6, .85, 1), .2, 0, emit=(.5, .8, 1), es=5, vcol=False)
TROUSER = mat('Charcoal', (.03, .03, .035), .85)
SHOE = mat('Shoe', (.04, .03, .025), .5)

SY = .7
SM = [(.3, .5), (.27, .7), (.23, .9), (.225, 1.05), (.24, 1.2), (.25, 1.32), (.24, 1.4), (.19, 1.46), (.11, 1.49), (.07, 1.495)]
attach(lathe('Smock', SM, SMOCK, segs=32, sy=SY, capt=True, mod=lambda a, z: 1 + .035 * math.sin(a * 11) * max(0, 1.1 - z)), root, amp=.3, freq=9)
for k in range(12):   # clay handprints and smears
    z = random.uniform(.55, 1.3); a = random.uniform(-160, -20) * D; r = .25 if z > .9 else .28
    attach(ell('Clay%d' % k, (r * math.cos(a) * 1.02, r * SY * math.sin(a) * 1.02, z), random.uniform(.02, .04), .005, random.uniform(.015, .035), CLAY, segs=8, rings=4), root, amp=.4)
attach(box('SmockPocket', (.1, -SY * .25 - .008, .78), (.11, .008, .09), SMOCK, rot=(0, 0, -.2), bevel=.005), root, amp=.3)
for k in range(3):
    attach(limb('Tool%d' % k, (.07 + k * .02, -SY * .26 - .012, .8), (.06 + k * .025, -SY * .27 - .012, .92), [(0, .005), (1, .004)], WOOD if k % 2 else STEEL, segs=5), root, amp=.2)
attach(lathe('Scarf', [(.07, 1.45), (.08, 1.48), (.07, 1.51)], SCARF, segs=16, closed=True, mod=lambda a, z: 1 + .1 * math.sin(a * 4)), root, amp=.2)
attach(box('ScarfEnd', (.05, -.08, 1.36), (.035, .006, .16), SCARF, rot=(.1, 0, .2)), root, amp=.2)

# ---------- head: half-wax face with drips, beret ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.56), [(0, .045), (1, .044)], WAX, segs=10), hp, amp=.1)
fc = (0, 0, 1.63); R = (.093, .099, .113)
attach(ell('Face', fc, *R, FACE, segs=24, rings=14), hp, noisy=False)
attach(ell('WaxEye', on_face(fc, R, .05, .56), .012, .005, .008, EYE, segs=8, rings=5), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, -.008, .47), .012, .016, .02, mat('NoseSkin', (.6, .45, .38), .5), segs=8, rings=5), hp, amp=.1)
for k in range(6):   # wax running off the jaw and dripping onto the collar
    du = .02 + k * .02; v0 = .45 + (k % 3) * .06
    a = Vector(on_face(fc, R, du, v0)); b = Vector(on_face(fc, R, du + .005, .15)) + Vector((0, -.004, -.03 - .02 * (k % 2)))
    attach(tube('Drip%d' % k, [tuple(a), tuple(a.lerp(b, .5) + Vector((0, -.006, 0))), tuple(b)], .006 + .002 * (k % 2), WAX), hp, amp=.1)
    attach(ell('DripBead%d' % k, tuple(b + Vector((0, 0, -.008))), .009, .009, .012, WAX, segs=6, rings=4), hp, amp=.1)
attach(ell('Beret', (-.02, .0, 1.735), .12, .12, .03, BERET, segs=18, rings=8), hp, amp=.3)
attach(ell('BeretNub', (-.02, .0, 1.765), .01, .01, .015, BERET, segs=6, rings=4), hp, amp=.3)
attach(ell('HairBack', (0, .04, 1.63), .09, .08, .09, mat('GreyHair', (.25, .25, .27), .7), segs=12, rings=7), hp, amp=.3)

# ---------- legs + arms; the carving knife in hand B ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .09, .9, (.07, .056, .05), TROUSER, SHOE, boot_top=.12)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.21, 0, 1.39), (.26, -.03, 1.11), (.275, -.11, .89), SMOCK, WAX if s < 0 else mat('HandSkin', (.6, .45, .38), .5), r=(.06, .052, .048, .042), cuff=SMOCK, amp=.3)
pB = P['ArmB']; h = Vector((.285, -.15, .85))
attach(limb('Handle', tuple(h + Vector((0, 0, -.05))), tuple(h + Vector((0, 0, .05))), [(0, .013), (1, .012)], WOOD, segs=8), pB, amp=.3)
attach(lathe('Blade', [(.0, 0), (.018, .0), (.014, .12), (0, .16)], STEEL, segs=3, sy=.2, xf=Matrix.Translation(h + Vector((0, 0, .05)))), pB, amp=.15)
# ---------- Tail: smock back with a wax-stiffened hem ----------
attach(lathe('SmockBack', [(.29, .55), (.3, .5), (.31, .45)], WAX, segs=8, sy=SY, arc=(60 * D, 120 * D), zmod=lambda a, z: (-.06 * abs(math.sin(a * 11)) ** 2 if z < .46 else 0)), P['Tail'], amp=.2)

bpy.context.view_layer.update()
print('tris', tris())
