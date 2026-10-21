import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(6)
root, P = setup('LanternMan', 1.55, (.2, 1.46), (.08, .95), (.2, 1.0))
# The Bog Lantern Man: peat cloak, moss and reeds, a will-o'-wisp caged on a crooked stick (cool, marsh-light green)
PEAT = mat('PeatCloak', (.035, .03, .018), .95)
PEATD = mat('PeatShadow', (.01, .009, .006), .95)
MOSS = mat('Moss', (.05, .1, .02), .9)
REED = mat('Reed', (.2, .17, .07), .8)
RAG = mat('MudRags', (.09, .07, .045), .95)
MUD = mat('Mud', (.05, .035, .02), .7)
SKIN = mat('GauntSkin', (.17, .21, .14), .6)
WOOD = mat('CrookedWood', (.06, .04, .025), .8)
IRON = mat('RustIron', (.12, .08, .05), .6, .6)
WISP = mat('Wisp', (.4, 1, .8), .2, 0, emit=(.3, 1, .7), es=8, vcol=False)
EYE = mat('MarshEye', (.4, 1, .8), .2, 0, emit=(.3, 1, .7), es=7, vcol=False)

SY = .7
rag = lambda a, z: (-.08 * abs(math.sin(a * 13 + 2)) ** 2 - .03 * abs(math.sin(a * 31)) if z < .35 else 0)
CL = [(.36, .3), (.32, .5), (.27, .8), (.235, 1.05), (.24, 1.25), (.25, 1.38), (.24, 1.46), (.19, 1.52), (.11, 1.545), (.07, 1.55)]
sway = lambda a, z: 1 + .04 * math.sin(6 * a + z * 5) * max(0, (1.1 - z) / .8)
attach(lathe('Cloak', CL, PEAT, segs=40, sy=SY, mod=sway, capt=True, arc=(-70 * D, 250 * D), zmod=rag), root, amp=.45, freq=7, grad=(.3, .8, .4))
attach(lathe('CloakIn', [(r - .012, z) for r, z in CL[:5]], PEATD, segs=30, sy=SY, mod=sway, flip=True, arc=(-70 * D, 250 * D), zmod=rag), root, amp=.1)
# under the open front: ragged tunic
attach(lathe('Tunic', [(.17, .78), (.2, .9), (.205, 1.1), (.22, 1.3), (.2, 1.45), (.1, 1.52)], RAG, segs=20, sy=SY * .95, zmod=lambda a, z: (-.05 * abs(math.sin(a * 7)) if z < .8 else 0)), root, amp=.4, freq=12)
attach(tube('RopeBelt', [(.21 * math.cos(a * D), .21 * SY * .95 * math.sin(a * D), 1.0) for a in range(0, 361, 30)], .009, REED), root, amp=.3)
# moss clumps and reeds caught in the cloak
for k, (x, z, s) in enumerate(((-.17, 1.47, 1.2), (.15, 1.48, 1), (-.25, .9, .9), (.22, .6, 1.1), (.0, 1.5, .8), (-.3, .45, 1))):
    r = .245 if z > 1.2 else .3
    y = -SY * math.sqrt(max(r * r - x * x, .001)) * (1 if x == 0 else 1) - .004
    attach(ell('Moss%d' % k, (x, y if abs(x) < .2 else y * .6, z), .05 * s, .025 * s, .03 * s, MOSS, segs=10, rings=6), root, amp=.5, freq=40)
for k in range(7):
    a = (-90 + random.uniform(-80, 80)) * D; z0 = random.uniform(.4, 1.0)
    r = .3; x, y = r * math.cos(a), r * SY * math.sin(a) - .01
    attach(tube('Reed%d' % k, [(x, y, z0), (x * 1.1, y * 1.1, z0 + .12), (x * 1.15 + .02, y * 1.15, z0 + .22)], .004, REED), root, amp=.3)

# ---------- head: hooded, long gaunt face, marsh-light eyes ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.5), (0, 0, 1.62), [(0, .04), (1, .038)], SKIN, segs=10), hp, amp=.2)
fc = (0, -.01, 1.69); R = (.085, .095, .13)
attach(ell('Face', fc, *R, SKIN, segs=20, rings=12), hp, amp=.3, freq=18)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .05, .6)
    attach(ell('Socket%d' % s, (x, y + .006, z), .02, .01, .016, PEATD, segs=10, rings=6), hp, noisy=False)
    attach(ell('Cheek%d' % s, on_face(fc, R, s * .08, .42), .012, .012, .025, PEATD, segs=8, rings=5), hp, noisy=False)
eyes(hp, fc, R, EYE, du=.05, v=.6, size=(.008, .004, .006), push=-.002)
attach(ell('Nose', on_face(fc, R, 0, .5), .012, .024, .03, SKIN, segs=8, rings=5), hp, amp=.3)
attach(tube('Mouth', [on_face(fc, R, -.03, .3), on_face(fc, R, 0, .28), on_face(fc, R, .03, .3)], .003, PEATD), hp, noisy=False)
hood('Hood', (0, 0, 1.69), .125, .36, PEAT, hp, open_front=40, sy=1.1, droop=.01)
attach(ell('HoodMoss', (0, .07, 1.84), .06, .05, .025, MOSS, segs=10, rings=6), hp, amp=.5, freq=40)

# ---------- legs: rag-wrapped, mud-caked ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .08
    attach(limb('Leg' + key, (x, 0, .95), (x, 0, .1), [(0, .065), (.5, .05), (1, .045)], RAG, segs=10), p, amp=.4)
    for k in range(4):
        attach(torus('Wrap%s%d' % (key, k), (x, 0, .2 + k * .08), .05 - k * .002, .007, RAG, rot=(.15 * (k % 2) - .07, 0, 0), segs=12, minor=4), p, amp=.4)
    attach(ell('Foot' + key, (x, -.05, .045), .05, .13, .045, MUD, segs=12, rings=7), p, amp=.5, freq=20)
    attach(ell('MudCake' + key, (x, -.01, .1), .058, .06, .05, MUD, segs=10, rings=6), p, amp=.5, freq=20)

# ---------- arms: long, thin, cloak-draped ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.2, 0, 1.46), (.25, -.04, 1.16), (.265, -.13, .92), PEAT, SKIN, r=(.055, .046, .042, .036), cuff=RAG, amp=.4)
# the caged will-o'-wisp on a crooked stick, held out in hand B
pB = P['ArmB']
h = Vector((.27, -.15, .87))
stick = [tuple(h + Vector((0, .02, -.06))), tuple(h + Vector((0, -.04, .1))), tuple(h + Vector((.01, -.13, .26))), tuple(h + Vector((0, -.2, .32))), tuple(h + Vector((0, -.25, .3)))]
attach(tube('Stick', stick, .011, WOOD), pB, amp=.4)
top = h + Vector((0, -.25, .29))
attach(tube('Tether', [tuple(top), tuple(top + Vector((0, 0, -.06)))], .003, IRON), pB, amp=.4)
cc = top + Vector((0, 0, -.13))
for k in range(6):   # cage ribs
    a = k * PI / 6
    pts = [tuple(cc + Vector((.06 * math.sin(t) * math.cos(a), .06 * math.sin(t) * math.sin(a), .07 * math.cos(t)))) for t in [i * PI / 6 for i in range(7)]]
    attach(tube('Rib%d' % k, pts, .0028, IRON), pB, amp=.4)
attach(torus('CageBand', tuple(cc), .062, .004, IRON, segs=16, minor=4), pB, amp=.4)
attach(ell('Wisp', tuple(cc), .03, .03, .038, WISP, segs=12, rings=8), pB, noisy=False)
attach(ell('WispTail', tuple(cc + Vector((0, .015, .02))), .012, .012, .03, WISP, segs=8, rings=5), pB, noisy=False)
# ---------- Tail: ragged back of the cloak ----------
attach(lathe('CloakBack', [(.31, .45), (.34, .32), (.37, .2)], PEAT, segs=10, sy=SY, arc=(55 * D, 125 * D), mod=lambda a, z: sway(a, z) * 1.03,
             zmod=lambda a, z: (-.1 * abs(math.sin(a * 9)) ** 2 if z < .22 else 0)), P['Tail'], amp=.45, freq=7)

bpy.context.view_layer.update()
print('tris', tris())
