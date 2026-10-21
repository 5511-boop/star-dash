import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(21)
root, P = setup('Passenger', 1.40, (.15, 1.32), (.07, .86), (.13, .85))
# The Last Passenger: faded rose 1920s drop-waist dress with fringe, cloche hat, long pearls; she flickers in-game (warm-toned)
DRESS = mat('FadedRose', (.5, .25, .24), .7)
FRINGE = mat('RoseGoldFringe', (.62, .38, .25), .45, .3)
SASH = mat('DustyMauve', (.3, .13, .15), .5)
CLOCHE = mat('ClocheFelt', (.28, .12, .13), .85)
SKIN = mat('PaleSkin', (.74, .56, .5), .5)
BOB = mat('BobHair', (.06, .025, .015), .45)
PEARL = mat('Pearl', (.86, .8, .74), .18)
LIPS = mat('BerryLips', (.3, .03, .06), .35)
SHADOW = mat('SmokyLid', (.12, .07, .08), .7)
SHOE = mat('TStrapShoe', (.08, .02, .02), .3)
STOCK = mat('SilkStocking', (.42, .3, .26), .4)
EYE = mat('PassengerEye', (.1, .05, .03), .2)
GLINT = mat('WarmGlint', (1, .6, .3), .2, 0, emit=(1, .55, .25), es=4, vcol=False)

# ---------- straight drop-waist shift with tiers of fringe ----------
DR = [(.2, .42), (.205, .55), (.195, .7), (.19, .82), (.178, .92), (.165, 1.02), (.17, 1.12), (.168, 1.22), (.15, 1.29), (.1, 1.325), (.06, 1.335)]
attach(lathe('Dress', DR, DRESS, segs=32, sy=.78, capt=True), root, amp=.3, freq=10, grad=(.42, .7, .2))
attach(torus('Sash', (0, 0, .85), .192, .016, SASH, segs=28, minor=5, scale=(1, .78, 1)), root, amp=.3)
attach(ell('SashBow', (-.15, -.11, .85), .035, .015, .025, SASH, segs=10, rings=6), root, amp=.3)
attach(ell('SashBow2', (-.17, -.1, .82), .02, .01, .04, SASH, segs=8, rings=5), root, amp=.3)
for tier, (z, ln, n) in enumerate(((.86, .14, 36), (.66, .14, 38), (.48, .14, 40))):
    r = {0: .2, 1: .2, 2: .205}[tier]
    for k in range(n):
        a = k / n * 2 * PI
        x, y = (r + .006) * math.cos(a), (r + .006) * .78 * math.sin(a)
        attach(limb('Fringe%d_%d' % (tier, k), (x, y, z - .02), (x * 1.03, y * 1.03, z - .02 - ln), [(0, .0035), (1, .0025)], FRINGE, segs=4), root if math.sin(a) < .5 else P['Tail'], amp=.3, freq=40)
# beaded neckline
for k in range(16):
    a = (-90 + (k - 7.5) * 9) * D
    attach(ell('Bead%d' % k, (.12 * math.cos(a), .12 * .78 * math.sin(a) - .006, 1.3 - .012 * math.cos((k - 7.5) / 7.5 * PI / 2)), .006, .006, .006, FRINGE, segs=6, rings=4), root, amp=.2)
# a long rope of pearls looped to the dropped waist, knotted once
def strand(name, pts, n, parent, r=.0075):
    for i in range(n):
        t = i / (n - 1); seg = t * (len(pts) - 1); j = min(int(seg), len(pts) - 2); f = seg - j
        attach(ell('%s%d' % (name, i), tuple(Vector(pts[j]).lerp(Vector(pts[j + 1]), f)), r, r, r, PEARL, segs=7, rings=5), parent, amp=.1)
strand('Pearls', [(-.075, -.07, 1.32), (-.07, -.13, 1.2), (-.03, -.15, 1.02), (.0, -.155, .96), (.03, -.15, 1.02), (.07, -.13, 1.2), (.075, -.07, 1.32)], 34, root)
strand('PearlKnot', [(0, -.16, .96), (.01, -.165, .9), (-.005, -.165, .84)], 6, root, .008)

# ---------- head: sleek bob with finger waves, smoky eyes, berry lips, cloche hat ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.44), [(0, .036), (1, .034)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.51); R = (.08, .086, .098)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.1)
for s in (-1, 1):
    x, y, z = on_face(fc, R, s * .05, .6)
    attach(ell('Lid%d' % s, (x, y - .001, z + .004), .016, .004, .008, SHADOW, segs=8, rings=5), hp, noisy=False)
eyes(hp, fc, R, EYE, du=.05, v=.585, size=(.009, .005, .006), glint=GLINT)
attach(ell('Lips', on_face(fc, R, 0, .32), .014, .006, .006, LIPS, segs=8, rings=5), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .47), .007, .01, .012, SKIN, segs=8, rings=5), hp, amp=.1)
bob = lathe('Bob', [(.086, 1.43), (.096, 1.47), (.1, 1.52), (.095, 1.57), (.075, 1.6), (.04, 1.615), (0, 1.618)], BOB, segs=26, sy=1.0, arc=(-55 * D, 235 * D), mod=lambda a, z: 1 + .03 * math.sin(z * 120) * (z < 1.55))
bob.location = (0, .012, 0); attach(bob, hp, amp=.2)
for s in (-1, 1):   # kiss curls on the cheeks
    attach(torus('Curl%d' % s, on_face(fc, R, s * .1, .45), .012, .003, BOB, rot=(PI / 2, 0, s * .4), segs=10, minor=4), hp, noisy=False)
cl = 1.555
attach(lathe('Cloche', [(.1, cl - .05), (.112, cl - .03), (.112, cl + .02), (.1, cl + .055), (.065, cl + .075), (0, cl + .08)], CLOCHE, segs=28, sy=1.04), hp, amp=.3)
attach(lathe('ClocheBrim', [(.11, cl - .05), (.13, cl - .07), (.135, cl - .075)], CLOCHE, segs=28, sy=1.04, arc=(-200 * D, 20 * D)), hp, amp=.3)
attach(torus('ClocheBand', (0, 0, cl - .02), .113, .007, SASH, segs=28, minor=4, scale=(1, 1.04, 1)), hp, amp=.3)
for k in range(5):   # ribbon rosette at the side
    a = k * 72 * D
    attach(ell('Rosette%d' % k, (.105 + .004 * math.cos(a), -.04 + .016 * math.sin(a), cl - .02 + .016 * math.cos(a)), .006, .016, .012, SASH, segs=8, rings=5), hp, noisy=False)
attach(ell('RosetteCore', (.11, -.04, cl - .02), .008, .008, .008, PEARL, segs=7, rings=5), hp, noisy=False)

# ---------- arms: long gloves; a beaded clutch in hand B ----------
GLOVE = mat('OperaGlove', (.75, .66, .58), .5)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .15, 0, 1.32), (s * .19, -.03, 1.07), (s * .2, -.1, .86)
    attach(ell('Shoulder' + key, sh, .045, .042, .042, SKIN, segs=12, rings=7), p, amp=.1)
    attach(limb('Upper' + key, sh, el, [(0, .036), (1, .03)], SKIN, segs=10), p, amp=.1)
    attach(limb('Fore' + key, el, wr, [(0, .03), (1, .025)], GLOVE, segs=10), p, amp=.15)
    attach(limb('GloveTop' + key, Vector(el) + (Vector(sh) - Vector(el)) * .25, el, [(0, .033), (1, .031)], GLOVE, segs=10), p, amp=.15)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .035
    attach(ell('Hand' + key, tuple(hc), .022, .02, .036, GLOVE, segs=10, rings=6), p, amp=.15)
pB = P['ArmB']
cb = (.215, -.14, .75)
attach(box('Clutch', cb, (.04, .025, .09), FRINGE, bevel=.008), pB, amp=.35, freq=50)
attach(torus('ClutchClasp', (cb[0], cb[1], cb[2] + .048), .012, .003, PEARL, rot=(PI / 2, 0, 0), segs=8, minor=4), pB, amp=.2)
attach(tube('ClutchChain', [(cb[0], cb[1], cb[2] + .05), (cb[0] + .004, cb[1], cb[2] + .07), (.215, -.14, .81)], .002, FRINGE), pB, noisy=False)

# ---------- legs: silk stockings, T-strap heels ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    p = P[key]; x = s * .07
    attach(limb('Leg' + key, (x, 0, .86), (x, 0, .07), [(0, .05), (.45, .042), (.55, .04), (.8, .036), (1, .024)], STOCK, segs=12), p, amp=.1)
    attach(ell('Shoe' + key, (x, -.035, .04), .03, .085, .03, SHOE, segs=10, rings=6), p, amp=.15)
    attach(box('Heel' + key, (x, .03, .03), (.018, .02, .06), SHOE, bevel=.003), p, amp=.15)
    attach(torus('Strap' + key, (x, -.01, .075), .028, .004, SHOE, segs=10, minor=4), p, amp=.15)

bpy.context.view_layer.update()
print('tris', tris())
