import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(17)
root, P = setup('Conductor', 1.50, (.215, 1.41), (.095, .92), (.16, .85))
# The Phantom Conductor: spectral uniform, "NO RETURN" cap, pocket watch stopped at 12:00 (cool-toned)
UNI = mat('SpectralNavy', (.03, .045, .08), .7, 0, emit=(.08, .16, .3), es=.25)
UNID = mat('UniformLining', (.01, .014, .025), .85)
TRIM = mat('GhostSilver', (.55, .6, .68), .35, 1.0)
STRIPE = mat('TrouserStripe', (.4, .45, .55), .5)
SKIN = mat('GhostSkin', (.36, .42, .48), .5)
LEATHER = mat('BlackLeather', (.01, .01, .012), .35)
DIAL = mat('StoppedDial', (.8, .9, 1), .3, 0, emit=(.6, .85, 1), es=2.5, vcol=False)
INK = mat('Ink', (.01, .01, .012), .4)
EYE = mat('SpectreEye', (.7, .9, 1), .2, 0, emit=(.6, .9, 1), es=8, vcol=False)
MUST = mat('GreyMustache', (.25, .27, .3), .7)
def band_px(u, v):
    if text_hit('NO RETURN', u, v, .75 - .16, .2, .32, .6): return (.82, .85, .9)
    if abs(v - .1) < .03 or abs(v - .9) < .03: return (.55, .58, .64)
    return (.03, .04, .07)
BAND = mat_tex('CapBand', make_image('NoReturnBand', 512, 64, band_px), .5, 0, emit=(.15, .2, .3), es=.4)

SY = .66
UP = [(.27, .78), (.235, .86), (.21, .96), (.218, 1.1), (.24, 1.24), (.25, 1.34), (.24, 1.42), (.2, 1.475), (.12, 1.5), (.08, 1.505)]
def rt(z):
    for (r0, z0), (r1, z1) in zip(UP, UP[1:]):
        if z0 <= z <= z1: return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return UP[-1][0]
def surf(x, z, off=.004):
    r = rt(z); return (x, -SY * math.sqrt(max(r * r - x * x, 0)) - off, z)
attach(lathe('Jacket', UP, UNI, segs=34, sy=SY, capt=True, arc=None), root, amp=.3, freq=10)
attach(lathe('JacketHem', [(.272, .72), (.27, .78)], UNI, segs=34, sy=SY, arc=(130 * D, 410 * D)), root, amp=.3)
attach(lathe('JacketTail', [(.272 * 1.01, .72), (.27 * 1.01, .79)], UNI, segs=8, sy=SY, arc=(50 * D, 130 * D)), P['Tail'], amp=.3)
attach(lathe('Collar', [(.088, 1.47), (.094, 1.53), (.1, 1.56), (.094, 1.562), (.086, 1.53), (.082, 1.47)], UNI, segs=22, sy=.95, closed=True, arc=(-70 * D, 250 * D)), root, amp=.3)
for s in (-1, 1):
    for i, z in enumerate((1.33, 1.21, 1.09, .97, .85)):
        x, y, zz = surf(s * .07, z, .0)
        attach(ell('Btn%d_%d' % (s, i), (x, y - .005, zz), .013, .007, .013, TRIM, segs=8, rings=5), root, amp=.5, freq=40)
    attach(tube('Lapel%d' % s, [surf(s * .09, 1.48, .008), surf(s * .17, 1.38, .008), surf(s * .1, 1.26, .008)], .004, TRIM), root, amp=.5)
attach(tube('FrontEdge', [surf(.035, z, .007) for z in (1.4, 1.2, 1.0, .8)], .004, UNID), root, amp=.2)
# the stopped pocket watch on its chain, clipped to the waistcoat
wx, wy, wz = surf(.14, .98, .02)
attach(tube('WatchChain', [surf(.0, 1.05, .015), surf(.07, 1.0, .02), (wx, wy, wz + .03)], .0025, TRIM), root, amp=.4)
attach(ell('WatchCase', (wx, wy, wz), .03, .01, .03, TRIM, segs=14, rings=7), root, amp=.4)
attach(ell('WatchDial', (wx, wy - .008, wz), .025, .004, .025, DIAL, segs=14, rings=5), root, noisy=False)
attach(box('Hand12a', (wx, wy - .012, wz + .009), (.002, .002, .018), INK), root, noisy=False)
attach(box('Hand12b', (wx + .001, wy - .013, wz + .006), (.003, .002, .012), INK), root, noisy=False)
# ticket punch on a cord at the hip
attach(box('Punch', (-.2, -.1, .78), (.02, .015, .07), TRIM, rot=(0, .3, 0), bevel=.004), root, amp=.4)
attach(tube('PunchCord', [(-.17, -.13, .92), (-.2, -.12, .85), (-.2, -.1, .81)], .002, LEATHER), root, noisy=False)

# ---------- head: spectral face, waxed mustache, peaked cap ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.47), (0, 0, 1.57), [(0, .046), (1, .044)], SKIN, segs=10), hp, amp=.15)
fc = (0, 0, 1.635); R = (.095, .1, .115)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.2, freq=16)
eyes(hp, fc, R, EYE, du=.05, v=.58, size=(.011, .005, .006))
attach(ell('Nose', on_face(fc, R, 0, .48), .012, .018, .022, SKIN, segs=8, rings=5), hp, amp=.15)
for s in (-1, 1):
    attach(tube('Mustache%d' % s, [on_face(fc, R, 0, .4), on_face(fc, R, s * .04, .395), on_face(fc, R, s * .08, .42), on_face(fc, R, s * .1, .46)], .006, MUST), hp, amp=.2)
cap = 1.715
attach(lathe('CapBand', [(.104, cap), (.105, cap + .045)], BAND, segs=36, sy=1.05), hp, noisy=False)
attach(lathe('CapTop', [(.104, cap + .045), (.122, cap + .07), (.125, cap + .09), (.1, cap + .1), (0, cap + .102)], UNI, segs=30, sy=1.05), hp, amp=.3)
attach(lathe('Peak', [(.105, cap + .005), (.13, cap - .005), (.155, cap - .012)], LEATHER, segs=12, sy=1.05, arc=(-150 * D, -30 * D)), hp, amp=.1)
attach(torus('CapCord', (0, -.005, cap + .044), .106, .003, TRIM, segs=30, minor=4, scale=(1, 1.05, 1)), hp, amp=.4)

# ---------- legs + arms ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .095, .93, (.078, .062, .055), UNI, LEATHER, boot_top=.14)
    attach(limb('Stripe' + key, (s * .095 + s * .07, 0, .9), (s * .095 + s * .056, 0, .16), [(0, .006), (1, .006)], STRIPE, segs=5), P[key], amp=.2)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    hc = arm(P, key, s, (.215, 0, 1.41), (.265, -.03, 1.13), (.28, -.11, .9), UNI, mat('WhiteGlove', (.7, .72, .76), .6), r=(.058, .05, .048, .044), cuff=UNI, amp=.3)
    xf, L = between((s * .265, -.03, 1.13), (s * .28, -.11, .9))
    for k in range(2):
        attach(torus('CuffBraid%s%d' % (key, k), tuple(Vector((s * .265, -.03, 1.13)).lerp(Vector((s * .28, -.11, .9)), .78 + k * .07)), .051, .003, TRIM, rot=xf.to_euler(), segs=14, minor=4), P[key], amp=.4)
# a brass-less, silvered lantern with a ghost flame (hand B)
pB = P['ArmB']; hx, hy = .29, -.13
attach(torus('LampBail', (hx, hy, .79), .035, .003, TRIM, rot=(PI / 2, 0, 0), segs=12, minor=4), pB, amp=.4)
attach(lathe('LampBase', [(0, .6), (.035, .6), (.04, .62), (.034, .622)], TRIM, segs=8, center=(hx, hy)), pB, amp=.4)
attach(lathe('LampCap', [(.036, .703), (.04, .71), (.03, .73), (.012, .76), (0, .765)], TRIM, segs=8, center=(hx, hy)), pB, amp=.4)
for k in range(4):
    a = k * PI / 2 + PI / 4
    attach(limb('LampPost%d' % k, (hx + .036 * math.cos(a), hy + .036 * math.sin(a), .62), (hx + .036 * math.cos(a), hy + .036 * math.sin(a), .705), [(0, .003), (1, .003)], TRIM, segs=5), pB, amp=.4)
attach(lathe('LampGlass', [(.032, .62), (.033, .705), (0, .705)], DIAL, segs=8, center=(hx, hy)), pB, noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
