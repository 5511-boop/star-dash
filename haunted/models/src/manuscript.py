import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(12)
root, P = setup('Manuscript', 1.40, (.15, 1.31), (.07, .86), (.14, 1.3))
# The Living Manuscript: a dress of handwritten parchment, illuminated capitals, quills in her hair (warm-toned)
TEXT = mat_tex('ManuscriptText', make_image('ManuscriptText', 256, 256, lambda u, v: script_px(u, v, 46, seed=5)), .85)
TEXT2 = mat_tex('ManuscriptText2', make_image('ManuscriptText2', 128, 128, lambda u, v: script_px(u, v, 20, ink=(.5, .06, .05), seed=9)), .85)
GOLD = mat('IlluminatedGold', (.9, .62, .22), .25, .8)
SKIN = mat('ParchmentSkin', (.82, .68, .5), .55)
INKH = mat('InkHair', (.01, .008, .012), .25)
INKL = mat('InkLips', (.03, .01, .02), .3)
QUILL = mat('QuillFeather', (.9, .85, .75), .6)
RED = mat('Vermilion', (.6, .07, .04), .5)
EYE = mat('InkEye', (.02, .015, .02), .1)
GL = mat('GoldGlint', (1, .75, .3), .2, 0, emit=(1, .7, .25), es=5, vcol=False)

# ---------- dress: the skirt is a scroll of writing, with curled torn edges ----------
torn = lambda a, z: (-.05 * abs(math.sin(a * 7 + 1)) ** 2 - .02 * abs(math.sin(a * 23)) if z < .06 else 0)
SK = [(.42, .04), (.4, .15), (.34, .4), (.25, .7), (.16, .92), (.13, .99)]
attach(lathe('Skirt', SK, TEXT, segs=40, sy=.85, mod=lambda a, z: 1 + .035 * math.sin(8 * a) * max(0, (.85 - z)), zmod=torn), root, noisy=False)
attach(lathe('Bodice', [(.13, .97), (.135, 1.05), (.152, 1.16), (.158, 1.24), (.142, 1.3), (.1, 1.33), (.06, 1.345)], TEXT2, segs=26, sy=.8, capt=True), root, noisy=False)
attach(torus('GoldBelt', (0, 0, .985), .135, .01, GOLD, segs=24, minor=4, scale=(1, .8, 1)), root, amp=.3)
for k in range(5):   # illuminated letters pinned down the front like buttons
    z = 1.28 - k * .06
    attach(box('Capital%d' % k, (0, -.8 * .155 - .006, z), (.03, .004, .035), RED if k % 2 else GOLD, bevel=.003), root, amp=.3)
# wax seal brooch with a ribbon
attach(ell('Seal', (0, -.105, 1.33), .022, .008, .022, RED, segs=12, rings=6), root, amp=.3)
for s in (-1, 1):
    attach(box('SealRibbon%d' % s, (s * .012, -.11, 1.29), (.012, .003, .05), RED, rot=(0, 0, s * .2)), root, amp=.3)

# ---------- head: ink-black hair in a knot pierced by quills, ink lips ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.33), (0, 0, 1.44), [(0, .036), (1, .034)], SKIN, segs=10), hp, amp=.1)
fc = (0, 0, 1.51); R = (.08, .086, .098)
attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, amp=.12)
eyes(hp, fc, R, EYE, du=.05, v=.585, size=(.01, .005, .007), glint=GL)
attach(ell('Lips', on_face(fc, R, 0, .33), .013, .006, .006, INKL, segs=8, rings=5), hp, noisy=False)
attach(ell('Nose', on_face(fc, R, 0, .47), .007, .01, .012, SKIN, segs=8, rings=5), hp, amp=.1)
for s in (-1, 1):   # a line of script running down one cheek like a tattoo
    if s > 0:
        attach(tube('CheekScript', [on_face(fc, R, .07, .55), on_face(fc, R, .085, .45), on_face(fc, R, .075, .36)], .002, INKH), hp, noisy=False)
attach(ell('HairCap', (0, .018, 1.53), .088, .09, .1, INKH, segs=18, rings=10), hp, amp=.15)
attach(ell('Knot', (0, .07, 1.6), .045, .04, .04, INKH, segs=12, rings=7), hp, amp=.15)
for k in range(3):
    a = (k - 1) * .5
    b = Vector((0, .07, 1.6)); d = Vector((math.sin(a) * .8, .4, .8)).normalized()
    attach(tube('HairQuill%d' % k, [tuple(b), tuple(b + d * .14)], .003, QUILL), hp, amp=.2)
    attach(ell('HairVane%d' % k, tuple(b + d * .11), .012, .004, .045, QUILL, segs=8, rings=5), hp, amp=.2)

# ---------- arms; an unrolled scroll held in hand B ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    arm(P, key, s, (.15, 0, 1.31), (.19, -.03, 1.06), (.205, -.1, .85), TEXT2, SKIN, r=(.04, .034, .032, .028), cuff=GOLD, amp=.1, sleeve_tex=True)
pB = P['ArmB']; h = Vector((.22, -.15, .82))
attach(limb('ScrollRod', tuple(h + Vector((0, 0, .1))), tuple(h + Vector((0, 0, -.1))), [(0, .014), (1, .014)], GOLD, segs=8), pB, amp=.3)
attach(box('ScrollSheet', tuple(h + Vector((.0, -.05, -.17))), (.008, .1, .15), TEXT2, rot=(.3, 0, 0)), pB, noisy=False)
# ---------- legs ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .86), (x, 0, .07), [(0, .045), (1, .03)], SKIN, segs=10), P[key], amp=.1)
    attach(ell('Shoe' + key, (x, -.035, .035), .03, .085, .03, INKH, segs=10, rings=6), P[key], amp=.1)
# ---------- Tail: a long ribbon of manuscript trailing from the shoulders ----------
attach(box('Train', (0, .13, .75), (.16, .004, 1.1), TEXT, rot=(-.12, 0, 0)), P['Tail'], noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
