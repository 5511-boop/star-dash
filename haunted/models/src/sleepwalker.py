import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(24)
L = .14   # drifts above the floor, still asleep
root, P = setup('Sleepwalker', 1.48 + L, (.2, 1.38 + L), (.09, .88 + L), (.0, 1.42 + L))
# The Sleepwalker: starry pajamas, a long nightcap, arms out in front, floating (cool-toned)
STARS = [(random.random(), random.random(), random.random() < .15) for _ in range(70)]
def pj_px(u, v):
    col = [.04, .06, .2]
    if (u * 8) % 1 < .04: col = [.06, .09, .28]       # faint stripes
    for (sx, sy, moon) in STARS:
        dx = min(abs(u - sx), 1 - abs(u - sx)); dy = abs(v - sy)
        if moon:
            if math.hypot(dx, dy) < .025 and math.hypot(dx - .01, dy - .006) > .02: return (.95, .85, .5)
        elif dx + dy < .012 or (dx < .002 and dy < .02) or (dy < .002 and dx < .02): return (.95, .92, .7)
    return tuple(col)
PJ = mat_tex('StarryPajamas', make_image('StarryPajamas', 256, 256, pj_px), .85)
CAP = mat_tex('StarryCap', make_image('StarryCap', 128, 128, pj_px), .85)
SKIN = mat('SleepySkin', (.62, .52, .5), .5)
FUZZ = mat('FuzzySlipper', (.35, .45, .7), .95)
POM = mat('Pom', (.9, .9, .95), .95)
QUILT = mat('Quilt', (.06, .1, .3), .9)
BEAR = mat('Teddy', (.4, .25, .14), .95)
LID = mat('ClosedLid', (.25, .18, .18), .5)
DREAM = mat('DreamGlow', (.6, .7, 1), .2, 0, emit=(.5, .65, 1), es=3, vcol=False)

SY = .7
TOR = [(.2, .86), (.205, .95), (.22, 1.08), (.24, 1.22), (.245, 1.3), (.235, 1.38), (.19, 1.43), (.1, 1.46), (.06, 1.465)]
attach(lathe('PJTop', [(r, z + L) for r, z in TOR], PJ, segs=28, sy=SY, capt=True, zmod=lambda a, z: (-.02 * abs(math.sin(a * 5)) if z < .87 + L else 0)), root, noisy=False)
for i, z in enumerate((1.32, 1.2, 1.08, .96)):
    attach(ell('Btn%d' % i, (0, -SY * .235 - .006, z + L), .012, .006, .012, POM, segs=8, rings=5), root, amp=.1)
attach(lathe('Collar', [(.06, 1.43 + L), (.1, 1.45 + L), (.12, 1.42 + L)], POM, segs=22, sy=.85), root, amp=.1)
attach(lathe('Hips', [(.19, .8 + L), (.205, .87 + L)], PJ, segs=22, sy=.75), root, noisy=False)
for k in range(5):   # little glowing dream-motes around her
    a = random.uniform(0, 2 * PI)
    attach(ell('Mote%d' % k, (.4 * math.cos(a), .4 * math.sin(a), random.uniform(.8, 1.8)), .012, .012, .012, DREAM, segs=6, rings=4), root, noisy=False)

# ---------- head: eyes closed, sleepy smile, a long nightcap flopping to one side ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.44 + L), (0, 0, 1.54 + L), [(0, .044), (1, .042)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.61 + L); R = (.092, .098, .112)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.12)
for s in (-1, 1):
    attach(tube('Lid%d' % s, [on_face(fc, R, s * .03, .57), on_face(fc, R, s * .05, .555), on_face(fc, R, s * .07, .57)], .003, LID), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .47), .011, .015, .018, SKIN, segs=8, rings=5), hp, amp=.1)
attach(tube('Smile', [on_face(fc, R, -.025, .34), on_face(fc, R, 0, .33), on_face(fc, R, .025, .34)], .0025, LID), hp, noisy=False)
attach(ell('Hair', (0, .03, 1.62 + L), .095, .09, .1, mat('BedHead', (.15, .1, .06), .7), segs=14, rings=8), hp, amp=.3)
cap = [(.1, 1.64), (.095, 1.7), (.075, 1.76, .02, .02), (.05, 1.8, .06, .05), (.03, 1.79, .12, .08), (.015, 1.74, .17, .1), (0, 1.68, .19, .11)]
attach(lathe('Nightcap', [(p[0], p[1] + L) + p[2:] for p in cap], CAP, segs=16), hp, noisy=False)
attach(torus('CapBand', (0, 0, 1.645 + L), .1, .014, POM, segs=20, minor=5), hp, amp=.1)
attach(ell('CapPom', (.19, .11, 1.66 + L), .03, .03, .03, POM, segs=10, rings=6), hp, amp=.1)

# ---------- arms held out in front, a teddy dangling from hand B by one ear ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .2, 0, 1.38 + L), (s * .19, -.26, 1.34 + L), (s * .16, -.5, 1.32 + L)
    attach(ell('Shoulder' + key, sh, .062, .058, .06, PJ, segs=12, rings=7), p, noisy=False)
    attach(limb('Upper' + key, sh, el, [(0, .052), (1, .046)], PJ, segs=10), p, noisy=False)
    attach(limb('Fore' + key, el, wr, [(0, .045), (.85, .042), (1, .05)], PJ, segs=10), p, noisy=False)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .04
    h = ell('Hand' + key, tuple(hc), .03, .042, .02, SKIN, segs=10, rings=6); attach(h, p, amp=.1)
pB = P['ArmB']; t = Vector((.16, -.56, 1.2 + L))
attach(ell('BearBody', tuple(t + Vector((0, 0, -.08))), .05, .045, .065, BEAR, segs=12, rings=7), pB, amp=.3)
attach(ell('BearHead', tuple(t), .04, .038, .038, BEAR, segs=12, rings=7), pB, amp=.3)
for s in (-1, 1):
    attach(ell('BearEar%d' % s, tuple(t + Vector((s * .03, 0, .035))), .014, .01, .014, BEAR, segs=8, rings=5), pB, amp=.3)
    attach(ell('BearLimb%d' % s, tuple(t + Vector((s * .05, 0, -.07))), .016, .016, .03, BEAR, segs=8, rings=5), pB, amp=.3)
    attach(ell('BearEye%d' % s, tuple(t + Vector((s * .014, -.036, .006))), .005, .003, .005, LID, segs=5, rings=3), pB, noisy=False)
attach(ell('BearMuzzle', tuple(t + Vector((0, -.035, -.01))), .016, .01, .012, mat('Muzzle', (.6, .45, .3), .9), segs=8, rings=5), pB, amp=.2)

# ---------- legs: pajama trousers, fuzzy slippers dangling ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .09
    attach(limb('Leg' + key, (x, 0, .88 + L), (x, 0, .1 + L), [(0, .075), (1, .06)], PJ, segs=12), p, noisy=False)
    attach(ell('Slipper' + key, (x, -.04, .06 + L), .055, .11, .045, FUZZ, segs=12, rings=7), p, amp=.3)
    attach(ell('SlipperPom' + key, (x, -.13, .09 + L), .02, .02, .02, POM, segs=8, rings=5), p, amp=.1)
# ---------- Tail: a quilt dragged along, slipping off the shoulders ----------
attach(lathe('Quilt', [(.24, 1.42 + L), (.29, 1.2 + L), (.33, .9 + L), (.38, .5 + L), (.42, .2)], QUILT, segs=12, sy=.9, arc=(25 * D, 155 * D), mod=lambda a, z: 1 + .04 * math.sin(a * 8 + z * 6)), P['Tail'], amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
