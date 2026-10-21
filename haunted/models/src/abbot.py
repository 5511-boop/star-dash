import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(5)
root, P = setup('Abbot', 1.49, (.21, 1.41), (.09, .9), (.2, .9))
# The Silent Abbot: frosted indigo robes, a hood that glows from within (cool-toned)
ROBE = mat('IndigoRobe', (.03, .03, .12), .85)
ROBED = mat('IndigoShadow', (.008, .008, .03), .9)
RIME = mat('Rime', (.7, .8, .92), .35)
ICE = mat('Icicle', (.6, .78, .95), .1, 0, emit=(.3, .5, .8), es=.6, vcol=False)
ROPE = mat('Rope', (.25, .2, .14), .9)
WOOD = mat('StaffWood', (.07, .045, .03), .6)
SILV = mat('FrostSilver', (.55, .6, .66), .35, 1.0)
GLOW = mat('HoodGlow', (.05, .1, .2), .3, 0, emit=(.3, .55, 1), es=2.5, vcol=False)
EYE = mat('HoodEye', (.9, .97, 1), .2, 0, emit=(.85, .95, 1), es=10, vcol=False)
SKIN = mat('ColdHands', (.42, .45, .52), .5)

SY = .72
ROB = [(.36, .03), (.34, .2), (.3, .45), (.25, .75), (.22, .95), (.23, 1.1), (.248, 1.26), (.255, 1.36), (.24, 1.43), (.19, 1.48), (.11, 1.505), (.07, 1.51)]
pleat = lambda a, z: 1 + .03 * math.sin(12 * a) * max(0, (1.0 - z) / 1.0)
icejag = lambda a, z: (-.02 * abs(math.sin(a * 13)) if z < .04 else 0)
attach(lathe('Robe', ROB, ROBE, segs=40, sy=SY, mod=pleat, capt=True, zmod=icejag), root, amp=.3, freq=9, grad=(.03, .5, .35))
attach(lathe('RobeIn', [(r - .012, z) for r, z in ROB[:4]], ROBED, segs=24, sy=SY, mod=pleat, flip=True), root, amp=.1)
# rime on the hem, icicles hanging off it
attach(lathe('HemRime', [(.365, .02), (.368, .06), (.35, .1)], RIME, segs=40, sy=SY, mod=lambda a, z: pleat(a, z) * (1 + .03 * math.sin(a * 21)), zmod=icejag), root, amp=.25, freq=30)
for k in range(16):
    a = k / 16 * 2 * PI + random.uniform(-.1, .1)
    r = .37 * pleat(a, .06)
    x, y = r * math.cos(a), r * SY * math.sin(a)
    attach(lathe('Icicle%d' % k, [(.008, .0), (.004, -.03), (0, -.05)], ICE, segs=6, xf=Matrix.Translation((x, y, .06 + random.uniform(-.01, .01)))), root, noisy=False)
# frost settled on the shoulders
for s in (-1, 1):
    f = ell('ShoulderFrost%d' % s, (s * .15, .02, 1.475), .12, .1, .03, RIME, segs=14, rings=6)
    f.rotation_euler = (0, s * .45, 0); attach(f, root, amp=.3, freq=30)
# rope girdle with knotted tails + frosted prayer beads
attach(torus('Girdle', (0, 0, .97), .225, .011, ROPE, segs=32, minor=5, scale=(1, SY * 1.03, 1)), root, amp=.4, freq=40)
for s, ln in ((-1, .4), (1, .32)):
    pts = [(s * .05, -SY * .225 - .01, .96), (s * .06, -SY * .25 - .02, .8), (s * .055, -SY * .28 - .02, .96 - ln)]
    attach(tube('Cord%d' % s, pts, .008, ROPE), root, amp=.4)
    for k in range(3):
        attach(ell('Knot%d%d' % (s, k), Vector(pts[0]).lerp(Vector(pts[2]), .3 + k * .3)[:], .014, .014, .016, ROPE, segs=8, rings=5), root, amp=.3)
for i in range(14):
    t = i / 13; a = (-90 + 48 - 96 * t) * D
    z = 1.44 - .26 * math.sin(t * PI) - .02
    r = .25 if z > 1.1 else .235
    attach(ell('Bead%d' % i, (r * math.cos(a) * 1.02, r * SY * math.sin(a) - .012, z), .012, .012, .012, SILV if i % 5 == 0 else ROPE, segs=8, rings=5), root, amp=.3)
attach(box('BeadSigil', (0, -SY * .235 - .02, 1.0), (.03, .008, .045), SILV, bevel=.003), root, amp=.5)
attach(box('BeadSigilX', (0, -SY * .235 - .02, 1.01), (.05, .008, .012), SILV, bevel=.003), root, amp=.5)

# ---------- head: a deep cowl, glowing within, two white pinpoints for eyes ----------
hp = P['Head']
fc = (0, 0, 1.62)
attach(ell('Void', (0, .01, 1.62), .095, .1, .11, ROBED, segs=18, rings=10), hp, noisy=False)
attach(ell('InnerGlow', (0, .035, 1.615), .118, .06, .128, GLOW, segs=16, rings=8), hp, noisy=False)   # a halo of light behind the dark face
for s in (-1, 1):
    attach(ell('Eye%d' % s, (s * .032, -.088, 1.63), .013, .005, .006, EYE, segs=8, rings=5), hp, noisy=False)
hood('Hood', (0, .0, 1.62), .13, .32, ROBE, hp, open_front=42, sy=1.12, droop=.01)
for s in (-1, 1):   # frost along the hood's opening
    a = (-90 + s * 42) * D
    pts = [(r * math.cos(a), r * 1.12 * math.sin(a) + .01, z) for r, z in ((.1, 1.48), (.135, 1.55), (.142, 1.62), (.135, 1.68), (.1, 1.78), (.04, 1.81))]
    attach(tube('HoodRime%d' % s, pts, .008, RIME), hp, amp=.25)
attach(lathe('Mantle', [(.27, 1.4), (.24, 1.47), (.17, 1.51), (.12, 1.53)], ROBE, segs=30, sy=.85), root, amp=.3)

# ---------- arms: bell sleeves frosted at the cuff; a tall staff in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .21, 0, 1.41), (s * .26, -.03, 1.13), (s * .27, -.1, .9)
    attach(ell('Shoulder' + key, sh, .07, .066, .068, ROBE, segs=14, rings=8), p, amp=.3)
    attach(limb('Upper' + key, sh, el, [(0, .06), (1, .062)], ROBE, segs=12), p, amp=.3)
    xf, L = between(el, wr)
    attach(lathe('Bell' + key, [(.06, 0), (.075, L * .5), (.1, L * .95), (.105, L), (.09, L * .97)], ROBE, segs=16, xf=xf), p, amp=.3)
    attach(lathe('BellRime' + key, [(.1, L * .92), (.108, L), (.096, L * 1.01)], RIME, segs=16, xf=xf, zmod=lambda a, z: .006 * math.sin(a * 9)), p, amp=.25)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .03
    attach(ell('Hand' + key, tuple(hc), .028, .026, .04, SKIN, segs=10, rings=6), p, amp=.15)
pB = P['ArmB']; hx, hy = .275, -.13
attach(limb('Staff', (hx, hy, .08), (hx, hy, 1.72), [(0, .013), (.5, .015), (1, .013)], WOOD, segs=8), pB, amp=.4, freq=20)
attach(torus('Crook', (hx, hy - .055, 1.74), .055, .012, WOOD, rot=(0, PI / 2, 0), segs=18, minor=6), pB, amp=.4)
attach(lathe('StaffBell', [(0, -.04), (.02, -.035), (.028, -.005), (.03, 0)], SILV, segs=12, xf=Matrix.Translation((hx, hy - .11, 1.7))), pB, amp=.4)
for k in range(4):
    attach(torus('StaffRing%d' % k, (hx, hy, 1.1 + k * .14), .016, .003, SILV, segs=10, minor=4), pB, amp=.4)
for k in range(5):
    attach(lathe('StaffIce%d' % k, [(.007, 0), (.003, -.03), (0, -.045)], ICE, segs=6, xf=Matrix.Translation((hx + .02 * math.cos(k * 1.3), hy - .055 + .055 * math.cos(k * 1.1), 1.69))), pB, noisy=False)

# ---------- feet in sandals, peeking from the robe ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .09
    attach(limb('Leg' + key, (x, 0, .9), (x, 0, .07), [(0, .06), (1, .04)], ROBED, segs=10), P[key], amp=.1)
    attach(ell('Foot' + key, (x, -.05, .035), .04, .11, .03, SKIN, segs=12, rings=7), P[key], amp=.15)
    attach(box('Sandal' + key, (x, -.05, .008), (.085, .23, .016), ROPE, bevel=.005), P[key], amp=.3)
# ---------- Tail: a frosted back hem that flicks ----------
flap = lambda a, z: pleat(a, z) * 1.025
attach(lathe('BackPanel', [(.3, .45), (.33, .3), (.357, .12), (.36, .07)], ROBE, segs=10, arc=(58 * D, 122 * D), sy=SY, mod=flap, zmod=icejag), P['Tail'], amp=.3, freq=9, grad=(.03, .5, .35))
attach(lathe('BackPanelRime', [(.357, .07), (.362, .11), (.35, .14)], RIME, segs=10, arc=(58 * D, 122 * D), sy=SY, mod=lambda a, z: flap(a, z) * 1.006), P['Tail'], amp=.25)

bpy.context.view_layer.update()
print('tris', tris())
