import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(25)
root, P = setup('Jester', 1.45, (.18, 1.36), (.08, .88), (.15, 1.0))
# The Moon Jester: gold-and-plum motley, a belled hat, a mask that turns from laughter to sorrow (warm-toned)
GOLDC, PLUM = (.85, .6, .18), (.32, .06, .22)
def motley_px(u, v):
    half = GOLDC if u < .5 else PLUM
    x, y = u * 8, v * 6
    if (math.floor(x + y) + math.floor(x - y)) % 2 == 0: half = PLUM if half == GOLDC else GOLDC
    n = noise.noise(Vector((u * 30, v * 30, 1))) * .5 + .5
    return tuple(c * (.85 + .15 * n) for c in half)
MOTLEY = mat_tex('Motley', make_image('Motley', 256, 256, motley_px), .6)
def mask_px(u, v, sad=False):
    du = (u - .75) if not sad else (u - .25)
    col = [.95, .93, .88]
    if abs(du) < .2:
        for s in (-1, 1):   # crescent-moon eyes
            d = math.hypot((du - s * .055) / .035, (v - .58) / .05)
            d2 = math.hypot((du - s * .055) / .035, (v - .58 + (.03 if not sad else -.03)) / .05)
            if d < 1 and d2 > 1: col = [.85, .6, .15]
        k = du / .09
        if abs(k) < 1:   # smile or frown
            yc = .36 - .08 * (1 - k * k) * (1 if not sad else -1) + (0 if not sad else -.08)
            if abs(v - yc) < .012: col = [.5, .05, .2]
        if sad:
            for s in (-1, 1):
                if abs(du - s * .055) < .006 and .38 < v < .53: col = [.35, .5, .85]   # painted tear
    return tuple(col)
COMEDY = mat_tex('ComedyMask', make_image('ComedyMask', 256, 128, lambda u, v: mask_px(u, v)), .25)
TRAGEDY = mat_tex('TragedyMask', make_image('TragedyMask', 256, 128, lambda u, v: mask_px(u, v, True)), .25)
GOLD = mat('BellGold', (.9, .66, .22), .25, .85)
DARK = mat('Shadow', (.02, .01, .02), .9)
RUFF = mat('RuffCream', (.85, .8, .7), .8)
MOON = mat('MoonGlow', (1, .9, .6), .2, 0, emit=(1, .85, .5), es=3, vcol=False)

SY = .72
TOR = [(.19, .84), (.2, .92), (.205, 1.04), (.22, 1.18), (.23, 1.28), (.22, 1.35), (.17, 1.4), (.1, 1.43), (.06, 1.435)]
attach(lathe('Doublet', TOR, MOTLEY, segs=28, sy=SY, capt=True, zmod=lambda a, z: (-.07 * abs(math.sin(a * 6)) ** 2 if z < .85 else 0)), root, noisy=False)
for k in range(12):   # bells on the points of the doublet hem
    a = (k / 12 + 1 / 24) * 2 * PI
    attach(ell('HemBell%d' % k, (.2 * math.cos(a) * 1.02, .2 * SY * math.sin(a) * 1.02, .79), .014, .014, .016, GOLD, segs=8, rings=5), root, amp=.3)
for k, (z, r) in enumerate(((1.43, .17), (1.415, .19))):
    attach(lathe('Ruff%d' % k, [(.05, z + .012), (r * .6, z + .004), (r, z - .012)], RUFF if k == 0 else MOTLEY, segs=48, sy=.9, zmod=lambda a, zz: .014 * math.sin(a * 24)), root, amp=.2)

# ---------- head: a dark face behind a mask that turns (comedy in front, tragedy behind) ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.42), (0, 0, 1.51), [(0, .038), (1, .036)], DARK, segs=10), hp, noisy=False)
fc = (0, 0, 1.58)
attach(ell('Head', fc, .085, .09, .1, DARK, segs=16, rings=8), hp, noisy=False)
mk = spin('Mask', fc, (0, 0, 0), hp)
attach(lathe('Comedy', [(0, 1.475), (.06, 1.49), (.092, 1.54), (.097, 1.59), (.09, 1.64), (.06, 1.675), (0, 1.69)], COMEDY, segs=20, sy=1.04, arc=(-150 * D, -30 * D)), mk, noisy=False)
attach(lathe('Tragedy', [(0, 1.475), (.06, 1.49), (.092, 1.54), (.097, 1.59), (.09, 1.64), (.06, 1.675), (0, 1.69)], TRAGEDY, segs=20, sy=1.04, arc=(30 * D, 150 * D)), mk, noisy=False)
# three-pointed hat with bells
for k, a in enumerate((-60, 90, 240)):
    a = a * D
    base = Vector((.05 * math.cos(a), .05 * math.sin(a), 1.67))
    tip = base + Vector((.2 * math.cos(a), .2 * math.sin(a), .1))
    droop = tip + Vector((.04 * math.cos(a), .04 * math.sin(a), -.12))
    attach(lathe('Point%d' % k, [(.06, 0), (.035, .1), (.012, .2), (0, .24)], MOTLEY, segs=10, xf=Matrix.Translation(base) @ (droop - base).to_track_quat('Z', 'Y').to_matrix().to_4x4()), hp, noisy=False)
    attach(ell('HatBell%d' % k, tuple(droop + Vector((0, 0, -.015))), .02, .02, .022, GOLD, segs=8, rings=5), hp, amp=.3)
attach(lathe('HatBand', [(.1, 1.64), (.098, 1.68)], GOLD, segs=20), hp, amp=.3)

# ---------- arms in motley; a marotte (a stick with a little moon on it) in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.18, 0, 1.36), (.22, -.03, 1.1), (.235, -.1, .88), MOTLEY, mat('WhiteGlove', (.8, .78, .74), .5), r=(.048, .04, .038, .034), cuff=RUFF, amp=.2, sleeve_tex=True)
pB = P['ArmB']; h = Vector((.245, -.14, .84))
attach(limb('MarotteStick', tuple(h + Vector((0, 0, -.15))), tuple(h + Vector((0, -.02, .25))), [(0, .008), (1, .008)], GOLD, segs=6), pB, amp=.3)
top = h + Vector((0, -.02, .3))
attach(ell('MoonHead', tuple(top), .04, .02, .04, MOON, segs=12, rings=7), pB, noisy=False)
attach(ell('MoonBite', tuple(top + Vector((.022, -.005, .01))), .032, .022, .034, DARK, segs=10, rings=6), pB, noisy=False)
for k in range(3):
    attach(ell('MarotteBell%d' % k, tuple(top + Vector(((k - 1) * .03, 0, -.05))), .01, .01, .012, GOLD, segs=6, rings=4), pB, amp=.3)
# ---------- legs: split-colour hose, curled shoes with bells ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .08
    attach(limb('Hose' + key, (x, 0, .88), (x, 0, .07), [(0, .065), (.5, .05), (1, .04)], mat('Hose' + key, GOLDC if s < 0 else PLUM, .6), segs=12), p, amp=.15)
    attach(ell('Shoe' + key, (x, -.05, .04), .04, .1, .035, mat('ShoeDark', (.1, .03, .08), .5), segs=10, rings=6), p, amp=.2)
    attach(tube('ShoeCurl' + key, [(x, -.13, .05), (x, -.18, .08), (x, -.17, .12), (x, -.14, .11)], .012, mat('ShoeDark', (.1, .03, .08), .5)), p, amp=.2)
    attach(ell('ShoeBell' + key, (x, -.14, .1), .012, .012, .013, GOLD, segs=6, rings=4), p, amp=.3)
# ---------- Tail: streamers of ribbon with bells ----------
for s in (-1, 1):
    attach(box('Streamer%d' % s, (s * .04, .16, .8), (.03, .005, .35), MOTLEY, rot=(-.15, 0, s * .2)), P['Tail'], noisy=False)
    attach(ell('StreamerBell%d' % s, (s * .07, .18, .62), .012, .012, .013, GOLD, segs=6, rings=4), P['Tail'], amp=.3)

bpy.context.view_layer.update()
print('tris', tris())
