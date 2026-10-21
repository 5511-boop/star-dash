import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(16)
root, P = setup('Pharaoh', 1.5, (.21, 1.4), (.09, .9), (.15, 1.0))
# The Risen Pharaoh: a lapis-and-gold nemes over rotting bandages, crook in hand, cold blue eyes (cool-toned)
WRAP = mat_tex('Bandages', make_image('Bandages', 256, 256, bandage_px), .9)
LAPIS, GOLDC = (.04, .1, .45), (.85, .62, .2)
NEMES = mat_tex('Nemes', make_image('Nemes', 64, 256, lambda u, v: stripes_px(u, v, 16, [LAPIS, GOLDC])), .35, .3)
COLLAR = mat_tex('Usekh', make_image('Usekh', 64, 128, lambda u, v: stripes_px(u, v, 9, [GOLDC, (.05, .45, .45), LAPIS, (.6, .15, .1)], line=(.1, .07, .03))), .3, .4)
GOLD = mat('PharaohGold', (.85, .62, .2), .25, .8)
LINEN = mat('KiltLinen', (.7, .66, .55), .85)
DARK = mat('MummyDark', (.05, .04, .03), .9)
EYE = mat('LapisGlow', (.3, .5, 1), .2, 0, emit=(.25, .45, 1), es=9, vcol=False)

SY = .68
TOR = [(.19, .86), (.195, .95), (.21, 1.08), (.235, 1.22), (.245, 1.32), (.235, 1.4), (.19, 1.45), (.11, 1.48), (.06, 1.485)]
attach(lathe('Body', TOR, WRAP, segs=28, sy=SY, capt=True), root, noisy=False)
attach(lathe('Kilt', [(.27, .62), (.24, .72), (.21, .84), (.2, .92)], LINEN, segs=26, sy=.72, mod=lambda a, z: 1 + .03 * math.sin(a * 18)), root, amp=.4)
attach(box('KiltPanel', (0, -.17, .76), (.1, .008, .26), GOLD, bevel=.004), root, amp=.4)
attach(torus('Belt', (0, 0, .91), .205, .016, GOLD, segs=26, minor=4, scale=(1, .72, 1)), root, amp=.4)
attach(lathe('Usekh', [(.07, 1.48), (.15, 1.46), (.24, 1.4), (.27, 1.34), (.255, 1.33), (.14, 1.42), (.06, 1.46)], COLLAR, segs=30, sy=.82, closed=True), root, noisy=False)
# loose bandage strips coming away
for k, (x, z) in enumerate(((-.2, 1.1), (.15, .95), (.05, 1.25))):
    y = -SY * .23 - .01
    attach(box('Strip%d' % k, (x, y, z - .08), (.03, .004, .2), WRAP, rot=(.15, 0, random.uniform(-.3, .3))), root, noisy=False)

# ---------- head: bandaged face, glowing eyes, striped nemes, uraeus, false beard ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.45), (0, 0, 1.56), [(0, .045), (1, .044)], WRAP, segs=10), hp, noisy=False)
fc = (0, 0, 1.63); R = (.092, .098, .112)
attach(ell('Face', fc, *R, WRAP, segs=22, rings=12), hp, noisy=False)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .05, .58)
    attach(ell('Socket%d' % s, (x, y + .004, z), .02, .008, .012, DARK, segs=8, rings=5), hp, noisy=False)
eyes(hp, fc, R, EYE, du=.05, v=.58, size=(.009, .004, .006), push=-.002)
attach(limb('Beard', on_face(fc, R, 0, .22), tuple(Vector(on_face(fc, R, 0, .22)) + Vector((0, -.02, -.1))), [(0, .014), (1, .018)], NEMES, segs=8), hp, noisy=False)
nem = lathe('NemesHood', [(.1, 1.56), (.13, 1.6), (.13, 1.66), (.115, 1.72), (.08, 1.75), (0, 1.76)], NEMES, segs=26, sy=1.08, arc=(-55 * D, 235 * D))
attach(nem, hp, noisy=False)
for s in (-1, 1):   # lappets falling in front of the shoulders
    attach(limb('Lappet%d' % s, (s * .125, -.03, 1.58), (s * .135, -.06, 1.36), [(0, .032), (1, .038)], NEMES, segs=8, sy=.35), hp, noisy=False)
attach(lathe('NemesTail', [(.06, 1.62), (.05, 1.5), (.03, 1.4)], NEMES, segs=10, center=(0, .11)), hp, noisy=False)
attach(torus('Diadem', (0, 0, 1.66), .118, .006, GOLD, segs=26, minor=4, scale=(1, 1.08, 1)), hp, amp=.3)
attach(tube('Uraeus', [(0, -.125, 1.66), (0, -.13, 1.69), (0, -.145, 1.71), (0, -.14, 1.73)], .008, GOLD), hp, amp=.3)
attach(ell('UraeusHood', (0, -.142, 1.735), .014, .006, .016, GOLD, segs=8, rings=5), hp, amp=.3)

# ---------- legs + arms: bandaged, gold cuffs; the crook in hand B ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .09
    attach(limb('Leg' + key, (x, 0, .9), (x, 0, .06), [(0, .07), (.5, .055), (1, .045)], WRAP, segs=12), p, noisy=False)
    attach(ell('Foot' + key, (x, -.05, .04), .045, .11, .035, WRAP, segs=12, rings=7), p, noisy=False)
    attach(torus('Anklet' + key, (x, 0, .1), .048, .008, GOLD, segs=12, minor=4), p, amp=.3)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    hc = arm(P, key, s, (.21, 0, 1.4), (.25, -.03, 1.12), (.265, -.1, .9), WRAP, WRAP, r=(.055, .046, .042, .036), amp=.2, sleeve_tex=True)
    for t in (.3, .85):
        xf, L = between((s * .25, -.03, 1.12), (s * .265, -.1, .9))
        attach(lathe('Cuff%s%d' % (key, int(t * 10)), [(.042, 0), (.046, .02), (.042, .04)], GOLD, segs=12, xf=xf @ Matrix.Translation((0, 0, L * t - .02))), P[key], amp=.3)
pB = P['ArmB']; h = Vector((.275, -.14, .86))
attach(limb('CrookShaft', tuple(h + Vector((0, 0, -.25))), tuple(h + Vector((0, -.02, .35))), [(0, .012), (1, .012)], NEMES, segs=8), pB, noisy=False)
top = h + Vector((0, -.02, .35))
attach(tube('CrookHook', [tuple(top), tuple(top + Vector((0, -.04, .06))), tuple(top + Vector((0, -.09, .04))), tuple(top + Vector((0, -.1, -.01)))], .012, GOLD), pB, amp=.3)
# ---------- Tail: trailing bandages ----------
for k in range(3):
    attach(box('TrailWrap%d' % k, (-.06 + k * .06, .2, .55), (.03, .004, .6), WRAP, rot=(-.2, 0, (k - 1) * .2)), P['Tail'], noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
