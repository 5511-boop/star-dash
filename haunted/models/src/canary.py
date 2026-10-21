import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(31)
root, P = setup('Canary', 1.40, (.15, 1.31), (.07, .86), (.14, 1.0))
# The Canary's Ghost: an ash-grey dress, yellow feathers, an empty birdcage glowing with a warm light (warm-toned)
ASH = mat('AshDress', (.2, .19, .18), .9)
ASHD = mat('AshShadow', (.06, .055, .05), .95)
SKIN = mat('AshSkin', (.55, .5, .46), .6)
HAIR = mat('AshHair', (.12, .11, .1), .7)
YELLOW = mat('CanaryYellow', (.95, .7, .08), .6)
BRASS = mat('CageBrass', (.7, .5, .2), .3, .8)
LIGHT = mat('CanaryLight', (1, .8, .3), .2, 0, emit=(1, .75, .2), es=7, vcol=False)
EYE = mat('AmberEye', (1, .65, .2), .2, 0, emit=(1, .6, .15), es=4, vcol=False)
SHOE = mat('AshShoe', (.04, .035, .03), .5)

# ---------- dress: long, soot-greyed, with a hem that crumbles to ash ----------
crumble = lambda a, z: (-.05 * abs(math.sin(a * 9 + 1)) ** 3 - .02 * abs(math.sin(a * 27)) if z < .07 else 0)
DR = [(.38, .05), (.36, .2), (.3, .45), (.22, .75), (.15, .93), (.135, 1.0), (.145, 1.1), (.155, 1.2), (.15, 1.28), (.12, 1.32), (.07, 1.345)]
dr = lathe('Dress', DR, ASH, segs=36, sy=.85, capt=True, zmod=crumble, mod=lambda a, z: 1 + .03 * math.sin(9 * a) * max(0, (.9 - z)))
attach(dr, root, amp=.4, freq=9, grad=(.05, .5, .5)); holes(dr, 12, .72, seed=4, dark=.4)
attach(torus('Sash', (0, 0, 1.0), .138, .012, YELLOW, segs=24, minor=4, scale=(1, .85, 1)), root, amp=.3)
attach(lathe('Shawl', [(.07, 1.35), (.15, 1.32), (.19, 1.24), (.2, 1.16)], ASHD, segs=28, sy=.85, zmod=lambda a, z: (-.08 * max(0, math.sin(a)) ** 3 if z < 1.17 else 0)), root, amp=.3)
# ash flakes drifting off the hem
for k in range(14):
    a = random.uniform(0, 2 * PI); r = random.uniform(.38, .5); z = random.uniform(.03, .3)
    attach(box('Ash%d' % k, (r * math.cos(a), r * .85 * math.sin(a), z), (.02, .003, .015), ASHD, rot=(random.uniform(0, 3), random.uniform(0, 3), 0)), root if math.sin(a) < .4 else P['Tail'], noisy=False)
# yellow feather brooch
for k in range(3):
    f = ell('Feather%d' % k, (-.08 + k * .01, -.125, 1.27 - k * .01), .008, .004, .03, YELLOW, segs=6, rings=4); f.rotation_euler = (0, .4 - k * .3, 0)
    attach(f, root, amp=.2)

# ---------- head: ash-pale face, warm eyes, hair pinned with yellow feathers ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.34), (0, 0, 1.44), [(0, .036), (1, .034)], SKIN, segs=10), hp, amp=.15)
fc = (0, 0, 1.51); R = (.08, .086, .098)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.2)
eyes(hp, fc, R, EYE, du=.05, v=.585, size=(.01, .005, .007))
attach(ell('Nose', on_face(fc, R, 0, .47), .007, .01, .012, SKIN, segs=8, rings=5), hp, amp=.1)
attach(tube('Mouth', [on_face(fc, R, -.02, .33), on_face(fc, R, 0, .32), on_face(fc, R, .02, .33)], .0022, ASHD), hp, noisy=False)
attach(ell('HairCap', (0, .018, 1.535), .088, .09, .1, HAIR, segs=18, rings=10), hp, amp=.3)
attach(ell('Bun', (0, .08, 1.56), .045, .04, .045, HAIR, segs=12, rings=7), hp, amp=.3)
for k in range(4):
    a = (k - 1.5) * .35
    f = ell('HairFeather%d' % k, (math.sin(a) * .05, .1, 1.6 + .01 * k), .012, .005, .05, YELLOW, segs=8, rings=5); f.rotation_euler = (-.6, a, 0)
    attach(f, hp, amp=.2)

# ---------- arms; the empty birdcage lantern in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.15, 0, 1.31), (.19, -.03, 1.06), (.205, -.1, .85), ASH, SKIN, r=(.042, .036, .034, .03), cuff=ASHD, amp=.3)
pB = P['ArmB']; c = Vector((.22, -.15, .66))
attach(torus('CageRing', tuple(c + Vector((0, 0, .17))), .015, .003, BRASS, rot=(PI / 2, 0, 0), segs=10, minor=4), pB, amp=.3)
attach(tube('CageHook', [tuple(Vector((.215, -.13, .82))), tuple(c + Vector((0, 0, .18)))], .003, BRASS), pB, amp=.3)
attach(lathe('CageDome', [(.07, .06), (.065, .1), (.04, .14), (0, .155)], BRASS, segs=12, center=(c.x, c.y), xf=Matrix.Translation((0, 0, c.z))), pB, amp=.3)
attach(lathe('CageBase', [(0, -.1), (.075, -.1), (.075, -.085), (.07, -.08)], BRASS, segs=12, center=(c.x, c.y), xf=Matrix.Translation((0, 0, c.z))), pB, amp=.3)
for k in range(10):
    a = k / 10 * 2 * PI
    attach(limb('Bar%d' % k, tuple(c + Vector((.07 * math.cos(a), .07 * math.sin(a), -.085))), tuple(c + Vector((.07 * math.cos(a), .07 * math.sin(a), .065))), [(0, .0025), (1, .0025)], BRASS, segs=4), pB, amp=.3)
attach(limb('Perch', tuple(c + Vector((-.06, 0, -.02))), tuple(c + Vector((.06, 0, -.02))), [(0, .004), (1, .004)], BRASS, segs=5), pB, amp=.3)
attach(ell('GhostLight', tuple(c + Vector((0, 0, .0))), .03, .03, .035, LIGHT, segs=10, rings=7), pB, noisy=False)
attach(ell('LostFeather', tuple(c + Vector((.02, 0, -.08))), .006, .003, .02, YELLOW, segs=6, rings=4), pB, noisy=False)

# ---------- legs ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .86), (x, 0, .07), [(0, .045), (1, .03)], ASHD, segs=10), P[key], amp=.2)
    attach(ell('Shoe' + key, (x, -.035, .035), .032, .085, .032, SHOE, segs=10, rings=6), P[key], amp=.2)
# ---------- Tail: the shawl's long point trailing ash ----------
attach(lathe('ShawlTail', [(.2, 1.16), (.22, 1.0), (.24, .85)], ASHD, segs=6, sy=.85, arc=(70 * D, 110 * D), zmod=lambda a, z: (-.05 * abs(math.sin(a * 13)) if z < .86 else 0)), P['Tail'], amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
