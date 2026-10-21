import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(26)
root, P = setup('Hunter', 1.5, (.225, 1.41), (.095, .92), (.0, .8))
# The Ghost Hunter: a long coat hung with charms, vials and bells, and a spirit lantern (cool-toned)
COAT = mat('HunterCoat', (.05, .1, .11), .8)
COATIN = mat('CoatLining', (.02, .03, .04), .85)
LEATHER = mat('HunterLeather', (.08, .05, .03), .55)
SILVER = mat('CharmSilver', (.6, .63, .68), .3, 1.0)
IRON = mat('CharmIron', (.2, .2, .22), .5, .8)
BLUEEYE = mat('EvilEyeBead', (.1, .3, .9), .1, 0, emit=(.1, .3, .9), es=1, vcol=False)
VIAL = mat('SpiritVial', (.3, 1, .9), .05, 0, emit=(.25, .95, .85), es=4, vcol=False)
WISP = mat('CapturedWisp', (.5, 1, 1), .1, 0, emit=(.4, .95, 1), es=7, vcol=False)
GLASS = mat('LanternGlass', (.6, .8, .85), .05, 0, alpha=.35, vcol=False)
SKIN = mat('WeatheredSkin', (.55, .4, .32), .55)
STUB = mat('Stubble', (.15, .1, .08), .9)
HAT = mat('HunterHat', (.03, .035, .04), .85)
TROUSER = mat('Trousers', (.04, .04, .05), .85)
BOOT = mat('Boot', (.03, .02, .015), .45)

SY = .66
UP = [(.32, .8), (.27, .9), (.22, 1.0), (.225, 1.12), (.248, 1.26), (.256, 1.36), (.245, 1.43), (.2, 1.48), (.12, 1.505), (.08, 1.51)]
SK = [(.38, .38), (.36, .46), (.34, .6), (.32, .72), (.32, .8)]
attach(lathe('Coat', UP, COAT, segs=32, sy=SY, capt=True), root, amp=.35, freq=9)
attach(lathe('Skirt', SK, COAT, segs=32, sy=SY, arc=(-60 * D, 240 * D), zmod=lambda a, z: (-.03 * abs(math.sin(a * 9)) if z < .39 else 0)), root, amp=.35, freq=9, grad=(.38, .6, .3))
attach(lathe('SkirtIn', [(r - .012, z) for r, z in SK], COATIN, segs=32, sy=SY, arc=(-60 * D, 240 * D), flip=True), root, amp=.1)
attach(lathe('Collar', [(.1, 1.48), (.13, 1.55), (.17, 1.6), (.16, 1.605), (.12, 1.55), (.09, 1.48)], COAT, segs=22, sy=.95, closed=True, arc=(-50 * D, 230 * D)), root, amp=.35)
# bandolier of glowing spirit vials across the chest
band = [(-.2, -.1, 1.42), (-.1, -.17, 1.3), (.03, -.18, 1.15), (.15, -.15, 1.0), (.22, -.06, .92)]
attach(tube('Bandolier', band, .016, LEATHER), root, amp=.4)
for k in range(5):
    p = Vector(band[0]).lerp(Vector(band[-1]), .12 + k * .18) + Vector((0, -.03, 0))
    attach(limb('Vial%d' % k, tuple(p + Vector((0, 0, -.03))), tuple(p + Vector((0, 0, .03))), [(0, .011), (1, .011)], VIAL, segs=8), root, noisy=False)
    attach(ell('Cork%d' % k, tuple(p + Vector((0, 0, .037))), .009, .009, .007, LEATHER, segs=6, rings=4), root, noisy=False)
# charms pinned all over the coat: crosses, bells, horseshoes, evil-eye beads
def surf(x, z):
    r = .3 if z < .9 else .25
    return Vector((x, -SY * math.sqrt(max(r * r - x * x, .001)) - .008, z))
for k in range(18):
    x = random.uniform(-.2, .2); z = random.uniform(.5, 1.38)
    if abs(x) < .06 and z > 1.0: x += .1
    c = surf(x, z); kind = k % 4
    if kind == 0:
        attach(box('CrossV%d' % k, tuple(c), (.008, .004, .035), SILVER), root, amp=.4); attach(box('CrossH%d' % k, tuple(c + Vector((0, 0, .008))), (.024, .004, .008), SILVER), root, amp=.4)
    elif kind == 1:
        attach(lathe('Bell%d' % k, [(0, -.02), (.014, -.02), (.012, -.005), (.006, .006), (0, .008)], SILVER, segs=8, xf=Matrix.Translation(c)), root, amp=.4)
    elif kind == 2:
        attach(torus('Shoe%d' % k, tuple(c), .016, .004, IRON, rot=(PI / 2, 0, 0), segs=10, minor=4), root, amp=.4)
    else:
        attach(ell('Eye%d' % k, tuple(c), .012, .006, .012, BLUEEYE, segs=8, rings=5), root, noisy=False)
attach(torus('Belt', (0, 0, .92), .24, .016, LEATHER, segs=28, minor=4, scale=(1, SY * 1.1, 1)), root, amp=.4)
for s in (-1, 1):
    attach(box('Pouch%d' % s, (s * .19, -.1, .86), (.07, .04, .08), LEATHER, rot=(0, 0, -s * .5), bevel=.008), root, amp=.4)

# ---------- head: weathered face, stubble, wide hat hung with a feather and bell ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.56), [(0, .046), (1, .044)], SKIN, segs=10), hp, amp=.15)
fc = (0, 0, 1.63); R = (.094, .1, .114)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.2)
eyes(hp, fc, R, mat('HunterEye', (.05, .1, .12), .2), du=.05, v=.58, size=(.01, .005, .006), glint=mat('Glint', (.6, .9, 1), .2, 0, emit=(.5, .9, 1), es=3, vcol=False))
attach(ell('Nose', on_face(fc, R, 0, .47), .013, .018, .022, SKIN, segs=8, rings=5), hp, amp=.15)
attach(ell('Stubble', (0, -.04, 1.56), .085, .07, .05, STUB, segs=12, rings=6), hp, amp=.3)
attach(tube('Scar', [on_face(fc, R, .06, .62), on_face(fc, R, .075, .5)], .002, mat('Scar', (.4, .2, .18), .6)), hp, noisy=False)
hb = 1.7
attach(lathe('HatBrim', [(.105, hb + .012), (.2, hb + .01), (.25, hb + .03), (.255, hb + .04), (.248, hb + .04), (.2, hb + .002), (.105, hb)], HAT, segs=30, sy=1.05, closed=True), hp, amp=.35)
attach(lathe('HatCrown', [(.106, hb), (.108, hb + .08), (.1, hb + .13), (.06, hb + .145), (0, hb + .15)], HAT, segs=22, sy=1.08, mod=lambda a, z: 1 - .08 * _smoothstep(hb + .1, hb + .15, z) * abs(math.cos(a))), hp, amp=.35)
attach(torus('HatBand', (0, 0, hb + .015), .108, .008, LEATHER, segs=22, minor=4, scale=(1, 1.08, 1)), hp, amp=.3)
attach(ell('HatFeather', (.1, .04, hb + .08), .008, .02, .08, mat('Feather', (.1, .12, .15), .7), segs=8, rings=5), hp, amp=.2)
attach(lathe('HatBell', [(0, -.02), (.012, -.02), (.01, -.005), (0, .006)], SILVER, segs=8, xf=Matrix.Translation((-.24, -.05, hb + .015))), hp, amp=.4)

# ---------- legs + arms; the spirit lantern in hand B ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    leg(P, key, s, .095, .93, (.078, .062, .056), TROUSER, BOOT, boot_top=.4)
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.225, 0, 1.41), (.275, -.03, 1.13), (.29, -.11, .9), COAT, LEATHER, r=(.06, .053, .05, .046), cuff=COATIN, amp=.35)
pB = P['ArmB']; c = Vector((.3, -.14, .64))
attach(torus('LanternRing', tuple(c + Vector((0, 0, .17))), .02, .004, IRON, rot=(PI / 2, 0, 0), segs=10, minor=4), pB, amp=.4)
attach(tube('LanternChain', [(.3, -.14, .84), tuple(c + Vector((0, 0, .19)))], .003, IRON), pB, amp=.4)
attach(lathe('LanternTop', [(.06, .1), (.065, .11), (.04, .14), (.0, .16)], IRON, segs=4, center=(c.x, c.y), xf=Matrix.Translation((0, 0, c.z)) @ Matrix.Rotation(PI / 4, 4, 'Z')), pB, amp=.4)
attach(lathe('LanternBase', [(0, -.1), (.065, -.1), (.06, -.085)], IRON, segs=4, center=(c.x, c.y), xf=Matrix.Translation((0, 0, c.z)) @ Matrix.Rotation(PI / 4, 4, 'Z')), pB, amp=.4)
attach(lathe('LanternGlass', [(.055, -.085), (.055, .1)], GLASS, segs=4, center=(c.x, c.y), xf=Matrix.Translation((0, 0, c.z)) @ Matrix.Rotation(PI / 4, 4, 'Z')), pB, noisy=False)
for k in range(4):
    a = k * PI / 2
    attach(limb('LanternPost%d' % k, tuple(c + Vector((.055 * math.cos(a), .055 * math.sin(a), -.09))), tuple(c + Vector((.055 * math.cos(a), .055 * math.sin(a), .105))), [(0, .004), (1, .004)], IRON, segs=4), pB, amp=.4)
ws = spin('Wisp', tuple(c), (0, 0, 0), pB)   # the trapped spirit circles inside the glass
attach(ell('WispCore', tuple(c + Vector((.02, 0, .0))), .022, .022, .03, WISP, segs=10, rings=7), ws, noisy=False)
attach(ell('WispTail', tuple(c + Vector((-.015, .01, .03))), .01, .01, .025, WISP, segs=6, rings=4), ws, noisy=False)
# ---------- Tail: the back of the coat ----------
attach(lathe('CoatBack', [(.32, .8), (.33, .72), (.35, .6), (.37, .46), (.385, .38)], COAT, segs=10, sy=SY * 1.02, arc=(60 * D, 120 * D), zmod=lambda a, z: (-.03 * abs(math.sin(a * 9)) if z < .39 else 0)), P['Tail'], amp=.35, freq=9)

bpy.context.view_layer.update()
print('tris', tris())
