import math
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
reset()
PI = math.pi; D = PI / 180
root = empty('Horologist_Root', (0, 0, 0))
P = {
    'Head': empty('Pivot_Head', (0, 0, 1.50), root),
    'ArmA': empty('Pivot_ArmA', (-.215, 0, 1.41), root),
    'ArmB': empty('Pivot_ArmB', (.215, 0, 1.41), root),
    'LegA': empty('Pivot_LegA', (-.095, 0, .92), root),
    'LegB': empty('Pivot_LegB', (.095, 0, .92), root),
    'Tail': empty('Pivot_Tail', (0, .15, .96), root),
}
# The Horologist: leather waistcoat, brass goggles, ticking watches; cool accents (steel-blue shirt, teal-glowing glass)
SHIRT = mat('SteelShirt', (.07, .11, .18), .82)
LEATHER = mat('WaistcoatLeather', (.085, .042, .02), .55)
TROUSER = mat('Charcoal', (.018, .02, .026), .88)
BOOT = mat('Boot', (.022, .014, .01), .45)
SKIN = mat('Skin', (.55, .38, .3), .55)
GREY = mat('GreyHair', (.5, .5, .53), .7)
BRASS = mat('Brass', (.62, .42, .13), .32, 1.0)
STEEL = mat('Steel', (.4, .42, .46), .35, 1.0)
CRAVAT = mat('TealCravat', (.01, .07, .075), .5)
TEALGL = mat('TealGlass', (.3, .9, .85), .1, 0, emit=(.25, .85, .8), es=4, vcol=False)
DIAL = mat('GlowDial', (.75, .95, .92), .3, 0, emit=(.6, .95, .9), es=2.5, vcol=False)
INK = mat('Ink', (.01, .01, .012), .4)
EYEW = mat('EyeDark', (.02, .02, .03), .2)

SY = .66
TOR = [(.19, .92), (.192, 1.0), (.205, 1.1), (.228, 1.22), (.238, 1.32), (.228, 1.40), (.19, 1.455), (.11, 1.485), (.06, 1.49)]
def rt(z):
    for (r0, z0), (r1, z1) in zip(TOR, TOR[1:]):
        if z0 <= z <= z1: return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return TOR[-1][0]
def surf(x, z, off=.004):
    r = rt(z); return (x, -SY * math.sqrt(max(r * r - x * x, 0)) - off, z)

attach(lathe('Shirt', TOR, SHIRT, segs=30, sy=SY, capt=True), root, amp=.2, freq=10)
gap = 13 * D
wcp = [(r * 1.03, z) for r, z in TOR[:7]]
wc = lathe('Waistcoat', wcp, LEATHER, segs=30, sy=SY, arc=(-90 * D + gap, 270 * D - gap), zmod=lambda a, z: (-.06 * max(0, 1 - abs(((a / D + 90) % 360) - 180) / 40) if z < .93 else 0))
attach(wc, root, amp=.45, freq=14, seed=3, grad=(.92, 1.05, .2))
for s in (-1, 1):   # stitched leather edges + brass buttons
    edge = [surf(s * .045, z, .014) for z in (.9, 1.0, 1.1, 1.2, 1.3, 1.38)]
    attach(tube('WCEdge%d' % s, edge, .0045, LEATHER), root, amp=.4)
for i, z in enumerate((1.0, 1.08, 1.16, 1.24, 1.32)):
    x, y, zz = surf(.055, z, .016)
    attach(ell('Btn%d' % i, (x, y, zz), .011, .006, .011, BRASS, segs=8, rings=5), root, amp=.5, freq=40)
attach(ell('Cravat', (0, -.085, 1.45), .035, .02, .045, CRAVAT, segs=10, rings=6), root, amp=.2)
attach(ell('CravatKnot', (0, -.095, 1.475), .018, .014, .016, CRAVAT, segs=8, rings=5), root, amp=.2)
attach(ell('Pin', (0, -.11, 1.44), .006, .004, .006, TEALGL, segs=6, rings=4), root, noisy=False)
# collar
attach(lathe('Collar', [(.062, 1.46), (.066, 1.52), (.07, 1.53), (.059, 1.52), (.057, 1.46)], SHIRT, segs=16, closed=True), root, amp=.15)
# belt + pouches
attach(torus('Belt', (0, 0, .935), .195, .014, BOOT, segs=30, minor=5, scale=(1, SY * 1.03, 1)), root, amp=.3)
attach(box('Buckle', (0, -.135, .935), (.04, .01, .032), BRASS, bevel=.003), root, amp=.4)
for s in (-1, 1):
    attach(box('Pouch%d' % s, (s * .17, -.07, .89), (.07, .045, .085), LEATHER, rot=(0, 0, -s * .5), bevel=.008), root, amp=.4, freq=16)

# pocket watches on chains across the waistcoat, faces glowing teal-white
def watch(name, c, r, parent, face=(0, -1, 0)):
    attach(ell(name + 'Case', c, r, r * .35, r, BRASS, segs=14, rings=7), parent, amp=.4, freq=40)
    attach(ell(name + 'Dial', (c[0], c[1] - r * .3, c[2]), r * .82, r * .1, r * .82, DIAL, segs=14, rings=5), parent, noisy=False)
    attach(torus(name + 'Bow', (c[0], c[1], c[2] + r * 1.15), r * .3, r * .08, BRASS, rot=(PI / 2, 0, 0), segs=10, minor=4), parent, amp=.4)
for s, z in ((-1, 1.04), (1, 1.12)):
    x, y, zz = surf(s * .13, z, .02)
    watch('Watch%d' % s, (x, y, zz), .026, root)
    attach(tube('Chain%d' % s, [surf(s * .045, 1.2, .018), surf(s * .08, 1.15, .02), (x, y, zz + .03)], .0025, BRASS), root, amp=.4)
# lapel gear that turns slowly (Spin_)
gx, gy, gz = surf(-.12, 1.3, .016)
g = spin('LapelGear', (gx, gy, gz), (PI / 2, 0, 0), root)
attach(torus('GearRim', (gx, gy, gz), .018, .004, BRASS, rot=(PI / 2, 0, 0), segs=16, minor=4), g, amp=.4)
for k in range(8):
    a = k * 45 * D
    attach(box('Tooth%d' % k, (gx + .023 * math.cos(a), gy, gz + .023 * math.sin(a)), (.008, .004, .008), BRASS, rot=(0, -a, 0)), g, amp=.4)
attach(ell('GearHub', (gx, gy - .002, gz), .006, .004, .006, STEEL, segs=8, rings=4), g, amp=.3)

# ---------- head: old craftsman with mutton chops, goggles pushed up, a loupe in one eye ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.56), [(0, .048), (1, .046)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.635)
attach(ell('Face', fc, .098, .104, .118, SKIN, segs=22, rings=12), hp, amp=.15, freq=18)
attach(ell('Nose', (0, -.108, 1.625), .016, .02, .024, SKIN, segs=10, rings=6), hp, amp=.15)
for s in (-1, 1):
    attach(ell('Eye%d' % s, (s * .036, -.094, 1.648), .01, .005, .007, EYEW, segs=8, rings=5), hp, noisy=False)
    attach(tube('Brow%d' % s, [(s * .058, -.088, 1.672), (s * .036, -.1, 1.682), (s * .014, -.098, 1.676)], .006, GREY), hp, amp=.2)
    attach(tube('Mustache%d' % s, [(0, -.112, 1.598), (s * .03, -.11, 1.592), (s * .058, -.098, 1.582), (s * .075, -.08, 1.592)], .011, GREY), hp, amp=.3, freq=30)
    attach(ell('Chop%d' % s, (s * .088, -.03, 1.6), .022, .045, .055, GREY, segs=10, rings=6), hp, amp=.3, freq=30)
    attach(ell('Ear%d' % s, (s * .1, .005, 1.635), .012, .022, .03, SKIN, segs=8, rings=5), hp, amp=.15)
for k, (x, y, z, r) in enumerate(((0, .03, 1.73, .07), (-.06, .05, 1.7, .05), (.06, .05, 1.7, .05), (0, .08, 1.67, .06), (-.04, .0, 1.745, .035), (.045, .01, 1.74, .035))):
    attach(ell('Tuft%d' % k, (x, y, z), r, r * .9, r * .7, GREY, segs=10, rings=6), hp, amp=.35, freq=28, seed=k)
# goggles pushed up on the forehead
attach(torus('GoggleStrap', (0, .0, 1.70), .108, .009, BOOT, rot=(-.25, 0, 0), segs=24, minor=4, scale=(1, 1.02, 1)), hp, amp=.3)
for s in (-1, 1):
    c = (s * .042, -.1, 1.718)
    xf = Matrix.Translation(c) @ Matrix.Rotation(-1.2, 4, 'X')
    attach(lathe('GoggleRim%d' % s, [(.026, 0), (.028, .012), (.027, .024), (.022, .026)], BRASS, segs=14, xf=xf), hp, amp=.4, freq=30)
    attach(lathe('GoggleLens%d' % s, [(.022, .02), (.012, .026), (0, .027)], TEALGL, segs=14, xf=xf), hp, noisy=False)
attach(box('GoggleBridge', (0, -.1, 1.72), (.022, .006, .008), BRASS), hp, amp=.4)
# jeweller's loupe screwed into the right eye
xf = Matrix.Translation((-.036, -.095, 1.648)) @ Matrix.Rotation(PI / 2, 4, 'X')
attach(lathe('Loupe', [(.016, 0), (.014, .035), (.016, .036)], BRASS, segs=12, xf=xf), hp, amp=.4)
attach(lathe('LoupeGlass', [(.013, .03), (0, .033)], TEALGL, segs=12, xf=xf), hp, noisy=False)

# ---------- legs ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .095
    attach(limb('Trouser' + key, (x, 0, .93), (x, 0, .2), [(0, .08), (.5, .062), (1, .056)], TROUSER, segs=12), p, amp=.15)
    attach(lathe('Boot' + key, [(.056, .07), (.058, .2), (.06, .25), (.054, .26)], BOOT, segs=14, center=(x, 0)), p, amp=.3)
    attach(ell('Foot' + key, (x, -.06, .05), .054, .135, .05, BOOT, segs=14, rings=8), p, amp=.35, freq=14)
    attach(box('Sole' + key, (x, -.05, .012), (.1, .29, .024), BOOT, bevel=.006), p, amp=.1)
    for k in range(3):
        attach(box('Lace%s%d' % (key, k), (x, -.08 - k * .025, .085 + k * .012), (.04, .004, .004), STEEL, rot=(-.6, 0, 0)), p, noisy=False)

# ---------- arms: rolled sleeves, leather bracer, wristwatches ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    shp = (s * .215, 0, 1.41); el = (s * .265, -.03, 1.13); wr = (s * .28, -.115, .9)
    attach(ell('Shoulder' + key, shp, .066, .062, .064, SHIRT, segs=14, rings=8), p, amp=.2)
    attach(limb('Upper' + key, shp, el, [(0, .056), (1, .05)], SHIRT, segs=12), p, amp=.2)
    attach(torus('Roll' + key, el, .053, .018, SHIRT, rot=between(shp, el)[0].to_euler(), segs=14, minor=6), p, amp=.3)
    attach(limb('Fore' + key, el, wr, [(0, .042), (.7, .036), (1, .032)], SKIN, segs=12), p, amp=.15)
    xf, L = between(el, wr)
    if key == 'ArmA':
        attach(lathe('Bracer', [(.042, 0), (.044, .02), (.04, .12), (.037, .14)], LEATHER, segs=14, xf=xf @ Matrix.Translation((0, 0, L * .3))), p, amp=.45, freq=18)
        for k in range(3):
            attach(torus('BracerStrap%d' % k, tuple(Vector(el) + (Vector(wr) - Vector(el)) * (.4 + k * .15)), .043, .004, BRASS, rot=xf.to_euler(), segs=14, minor=4), p, amp=.4)
    c = Vector(el) + (Vector(wr) - Vector(el)) * .88
    attach(torus('WristBand' + key, tuple(c), .035, .006, BOOT, rot=xf.to_euler(), segs=14, minor=4), p, amp=.3)
    attach(ell('WristDial' + key, tuple(c + Vector((0, -.033, 0))), .013, .006, .013, DIAL, segs=10, rings=5), p, noisy=False)
    hc = (s * .29, -.125, .845)
    attach(ell('Hand' + key, hc, .03, .029, .043, SKIN, segs=12, rings=7), p, amp=.15)
    attach(ell('Thumb' + key, (s * .29 - s * .008, -.155, .855), .011, .013, .023, SKIN, segs=8, rings=5), p, amp=.15)
# hand B: a big open hunter-case watch on a chain, its hands ticking round (Spin_)
pB = P['ArmB']
wc0 = (.295, -.13, .66)
attach(tube('BigChain', [(.29, -.13, .82), (.295, -.13, .76), (.295, -.13, .735)], .003, BRASS), pB, amp=.4)
attach(torus('BigBow', (.295, -.13, .728), .012, .003, BRASS, rot=(PI / 2, 0, 0), segs=10, minor=4), pB, amp=.4)
attach(ell('BigCase', wc0, .066, .022, .066, BRASS, segs=24, rings=10), pB, amp=.4, freq=30)
attach(ell('BigDial', (wc0[0], wc0[1] - .016, wc0[2]), .056, .008, .056, DIAL, segs=24, rings=6), pB, noisy=False)
lid = ell('BigLid', (wc0[0] + .07, wc0[1] - .045, wc0[2]), .066, .006, .066, BRASS, segs=24, rings=6)
lid.rotation_euler = (0, 0, -1.1); attach(lid, pB, amp=.4)
for k in range(12):
    a = k * 30 * D
    attach(box('Tick%d' % k, (wc0[0] + .046 * math.cos(a), wc0[1] - .026, wc0[2] + .046 * math.sin(a)), (.003, .002, .009 if k % 3 else .014), INK, rot=(0, -a + PI / 2, 0)), pB, noisy=False)
hands = spin('WatchHands', (wc0[0], wc0[1] - .028, wc0[2]), (PI / 2, 0, 0), pB)
attach(box('MinuteHand', (wc0[0], wc0[1] - .028, wc0[2] + .02), (.003, .002, .042), INK), hands, noisy=False)
attach(box('HourHand', (wc0[0] + .012, wc0[1] - .029, wc0[2]), (.026, .002, .004), INK), hands, noisy=False)
attach(ell('HandCap', (wc0[0], wc0[1] - .03, wc0[2]), .005, .003, .005, BRASS, segs=6, rings=4), hands, amp=.3)

# ---------- Tail: a ring of clock keys jingling at the back of the belt ----------
tp = P['Tail']
attach(torus('KeyRing', (.06, .16, .9), .028, .004, STEEL, rot=(PI / 2, 0, .3), segs=14, minor=4), tp, amp=.3)
for k in range(4):
    a = (k - 1.5) * .35
    x = .06 + .03 * math.sin(a); z = .87 - .02 * math.cos(a)
    attach(limb('KeyShaft%d' % k, (x, .16, z), (x + .015 * math.sin(a), .16, z - .07), [(0, .003), (1, .003)], BRASS, segs=6), tp, amp=.4)
    attach(torus('KeyBow%d' % k, (x, .16, z - .002), .009, .0025, BRASS, rot=(PI / 2, 0, 0), segs=8, minor=4), tp, amp=.4)
    attach(box('KeyBit%d' % k, (x + .015 * math.sin(a) + .006, .16, z - .065), (.01, .003, .01), BRASS), tp, amp=.4)

bpy.context.view_layer.update()
print('tris', tris())
