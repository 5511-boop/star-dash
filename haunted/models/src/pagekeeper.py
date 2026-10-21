import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(11)
root, P = setup('PageKeeper', 1.49, (.21, 1.4), (.09, .9), (.18, .9))
# The Keeper of Pages: ink-stained archivist's robe, round spectacles, pages swirling around him (cool-toned)
ROBE = mat('ArchiveRobe', (.07, .09, .16), .85)
ROBEIN = mat('RobeShadow', (.015, .02, .04), .9)
STOLE = mat('InkStole', (.02, .03, .08), .6)
SKIN = mat('OldSkin', (.55, .42, .36), .55)
BEARD = mat('WhiteBeard', (.7, .7, .72), .8)
CAP = mat('SkullCap', (.02, .025, .06), .6)
BRASS = mat('SpecBrass', (.6, .5, .3), .3, 1.0)
LENS = mat('SpecLens', (.5, .8, 1), .05, 0, emit=(.4, .75, 1), es=2.5, vcol=False)
PAGE = mat_tex('PageText', make_image('PageText', 128, 128, lambda u, v: script_px(u, v, 14, seed=2)), .8)
INK = mat('Ink', (.01, .01, .02), .2)
QUILL = mat('Quill', (.85, .85, .9), .6)
BOOK = mat('BookLeather', (.04, .06, .14), .6)

SY = .72
RB = [(.34, .03), (.31, .3), (.26, .65), (.23, .92), (.235, 1.12), (.25, 1.28), (.255, 1.36), (.24, 1.43), (.19, 1.48), (.11, 1.5), (.07, 1.505)]
rb = lathe('Robe', RB, ROBE, segs=36, sy=SY, capt=True, mod=lambda a, z: 1 + .025 * math.sin(10 * a) * max(0, (1 - z)))
attach(rb, root, amp=.3, freq=9); holes(rb, 9, .66, seed=4, dark=.15)       # ink stains
attach(lathe('RobeIn', [(r - .012, z) for r, z in RB[:3]], ROBEIN, segs=24, sy=SY, flip=True), root, amp=.1)
for s in (-1, 1):   # a scholar's stole hanging down the front
    attach(box('Stole%d' % s, (s * .07, -SY * .24 - .02, 1.05), (.06, .01, .75), STOLE, rot=(.06, 0, -s * .04), bevel=.004), root, amp=.3)
    attach(ell('StoleKey%d' % s, (s * .07, -SY * .24 - .03, .72), .02, .006, .025, BRASS, segs=8, rings=5), root, amp=.3)
attach(torus('Cord', (0, 0, .96), .232, .01, STOLE, segs=28, minor=4, scale=(1, SY, 1)), root, amp=.3)
# inkpot and spare quills at the belt
attach(lathe('Inkpot', [(0, .86), (.03, .86), (.035, .9), (.02, .93), (.015, .95), (0, .95)], INK, segs=12, center=(.2, -.13)), root, amp=.2)
for k in range(2):
    attach(tube('BeltQuill%d' % k, [(.17 + k * .02, -.16, .9), (.16 + k * .03, -.18, 1.05)], .004, QUILL), root, amp=.2)

# ---------- head: long white beard, skull cap, round glowing spectacles ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.56), [(0, .045), (1, .043)], SKIN, segs=10), hp, amp=.15)
fc = (0, 0, 1.635); R = (.095, .1, .115)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.2, freq=18)
eyes(hp, fc, R, INK, du=.048, v=.58, size=(.008, .004, .005))
attach(ell('Nose', on_face(fc, R, 0, .47), .015, .022, .028, SKIN, segs=8, rings=5), hp, amp=.2)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .048, .58)
    attach(torus('Spec%d' % s, (x, y - .012, z), .022, .003, BRASS, rot=(PI / 2, 0, 0), segs=14, minor=4), hp, amp=.3)
    attach(ell('Lens%d' % s, (x, y - .012, z), .02, .002, .02, LENS, segs=10, rings=5), hp, noisy=False)
    attach(tube('SpecArm%d' % s, [(x + s * .02, y - .01, z), (s * .095, -.02, z + .005), (s * .1, .04, z - .01)], .002, BRASS), hp, amp=.3)
attach(box('SpecBridge', (0, on_face(fc, R, 0, .58)[1] - .014, on_face(fc, R, 0, .58)[2]), (.03, .003, .003), BRASS), hp, amp=.3)
attach(ell('Beard', (0, -.07, 1.53), .085, .06, .11, BEARD, segs=14, rings=8), hp, amp=.3, freq=24)
attach(ell('BeardTip', (0, -.09, 1.4), .04, .035, .07, BEARD, segs=10, rings=6), hp, amp=.3, freq=24)
for s in (-1, 1):
    attach(tube('Mustache%d' % s, [on_face(fc, R, 0, .42), on_face(fc, R, s * .05, .4), (s * .06, -.09, 1.55)], .01, BEARD), hp, amp=.3)
attach(lathe('Cap', [(.098, 1.68), (.1, 1.71), (.08, 1.75), (0, 1.758)], CAP, segs=20), hp, amp=.2)
attach(ell('HairFringe', (0, .04, 1.64), .1, .08, .07, BEARD, segs=14, rings=7), hp, amp=.3)

# ---------- arms: wide sleeves; an open book in hand A, a quill in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .21, 0, 1.4), (s * .26, -.04, 1.12), (s * .27, -.12, .9)
    attach(ell('Shoulder' + key, sh, .07, .066, .068, ROBE, segs=14, rings=8), p, amp=.3)
    attach(limb('Upper' + key, sh, el, [(0, .06), (1, .062)], ROBE, segs=12), p, amp=.3)
    xf, Ln = between(el, wr)
    attach(lathe('Sleeve' + key, [(.06, 0), (.08, Ln * .6), (.1, Ln), (.085, Ln * .98)], ROBE, segs=16, xf=xf), p, amp=.3)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .035
    attach(ell('Hand' + key, tuple(hc), .028, .026, .04, SKIN, segs=10, rings=6), p, amp=.15)
pA = P['ArmA']; bc = Vector((-.28, -.2, .86))
for s in (-1, 1):
    attach(box('BookPage%d' % s, tuple(bc + Vector((s * .065, 0, .01))), (.12, .006, .16), PAGE, rot=(-.5, s * .18, 0)), pA, noisy=False)
attach(box('BookCover', tuple(bc + Vector((0, .01, 0))), (.27, .01, .17), BOOK, rot=(-.5, 0, 0), bevel=.003), pA, amp=.3)
pB = P['ArmB']; q = Vector((.29, -.16, .86))
attach(tube('Quill', [tuple(q + Vector((0, .02, -.03))), tuple(q + Vector((.01, -.03, .12))), tuple(q + Vector((.03, -.05, .22)))], .003, QUILL), pB, amp=.2)
attach(ell('QuillVane', tuple(q + Vector((.02, -.04, .17))), .012, .004, .06, QUILL, segs=8, rings=5), pB, amp=.2)

# ---------- legs (under the robe) ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .09
    attach(limb('Leg' + key, (x, 0, .9), (x, 0, .08), [(0, .06), (1, .04)], ROBEIN, segs=10), P[key], amp=.1)
    attach(ell('Slipper' + key, (x, -.05, .035), .042, .11, .032, BOOK, segs=12, rings=7), P[key], amp=.2)

# ---------- pages swirling around him (Spin_: they orbit slowly) ----------
sw = spin('Pages', (0, 0, 0), (0, 0, 0), root)
for k in range(11):
    a = k / 11 * 2 * PI; r = random.uniform(.42, .55); z = random.uniform(.45, 1.65)
    c = (r * math.cos(a), r * math.sin(a), z)
    attach(box('Page%d' % k, c, (.1, .003, .13), PAGE, rot=(random.uniform(-.5, .5), random.uniform(-.4, .4), a + PI / 2)), sw, noisy=False)
# ---------- Tail: a long scroll hanging from his belt at the back ----------
attach(box('BackScroll', (0, SY * .24 + .02, .6), (.1, .004, .7), PAGE, rot=(-.08, 0, 0)), P['Tail'], noisy=False)
attach(limb('ScrollRod', (-.07, SY * .24 + .025, .25), (.07, SY * .24 + .025, .25), [(0, .012), (1, .012)], BOOK, segs=8), P['Tail'], amp=.2)

bpy.context.view_layer.update()
print('tris', tris())
