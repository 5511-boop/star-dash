import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(9)
LIFT = .12   # she floats
root, P = setup('Wraith', 1.42 + LIFT, (.15, 1.33 + LIFT), (.07, .9 + LIFT), (.16, 1.0 + LIFT))
# The Snow Wraith: a white shroud fraying into snow; ember-amber eyes and a warm heart-glow (warm-toned)
SHROUD = mat('Shroud', (.84, .81, .77), .92)
SHROUDIN = mat('ShroudShadow', (.2, .18, .17), .95)
FLAKE = mat('Snowflake', (.92, .95, 1), .3, 0, emit=(.7, .8, 1), es=.6, vcol=False)
VOID = mat('WraithVoid', (.01, .008, .008), .95)
EMBER = mat('EmberEye', (1, .55, .2), .2, 0, emit=(1, .5, .15), es=9, vcol=False)
HEART = mat('HeartGlow', (1, .55, .25), .3, 0, emit=(1, .45, .15), es=3, vcol=False)
GOLD = mat('PaleGold', (.75, .58, .32), .35, .6)
BONE = mat('PaleHands', (.78, .7, .6), .5)

L = LIFT
# shroud: from the crown of the head to a hem that tears into long strips
fray = lambda a, z: (-.22 * abs(math.sin(a * 9 + 1)) ** 3 - .06 * abs(math.sin(a * 23)) if z < .2 + L else 0)
SH = [(.40, .12 + L), (.36, .3 + L), (.3, .55 + L), (.24, .85 + L), (.2, 1.05 + L), (.22, 1.2 + L), (.235, 1.3 + L), (.2, 1.38 + L), (.12, 1.42 + L)]
drape = lambda a, z: 1 + .045 * math.sin(7 * a + z * 4) * max(0, (1.2 + L - z) / 1.0)
attach(lathe('Shroud', SH, SHROUD, segs=42, sy=.82, mod=drape, zmod=fray), root, amp=.25, freq=8, grad=(.05 + L, .7 + L, .25))
attach(lathe('ShroudIn', [(r - .014, z) for r, z in SH[:5]], SHROUDIN, segs=28, sy=.82, mod=drape, flip=True, zmod=fray), root, amp=.1)
# a warm heart-glow showing through a tear in the chest
attach(ell('Heart', (0, -.188, 1.22 + L), .03, .012, .035, HEART, segs=10, rings=6), root, noisy=False)
attach(torus('Tear', (0, -.19, 1.22 + L), .036, .006, SHROUDIN, rot=(PI / 2, 0, 0), segs=12, minor=4, scale=(1, 1.3, 1)), root, amp=.1)
# pale-gold thread stitched along the hood edge and a clasp
attach(ell('Clasp', (0, -.17, 1.36 + L), .022, .008, .022, GOLD, segs=10, rings=6), root, amp=.3)
# snow shed from the hem: flakes hanging in the air around her
def flake(name, c, s, parent):
    for k in range(3):
        b = box('%s_%d' % (name, k), c, (s, s * .12, s * .25), FLAKE, rot=(0, k * PI / 3, 0))
        attach(b, parent, noisy=False)
for k in range(26):
    a = random.uniform(0, 2 * PI); r = random.uniform(.3, .55); z = random.uniform(.02, .45) + L * .3
    flake('Flake%d' % k, (r * math.cos(a), r * .85 * math.sin(a), z), random.uniform(.03, .05), root if math.sin(a) < .4 else P['Tail'])

# ---------- head: deep shroud hood over a void with ember eyes ----------
hp = P['Head']
fc = (0, .0, 1.53 + L)
attach(ell('Void', fc, .085, .088, .1, VOID, segs=16, rings=10), hp, noisy=False)
for s in (-1, 1):
    attach(ell('Eye%d' % s, (s * .029, -.084, 1.545 + L), .012, .005, .007, EMBER, segs=8, rings=5), hp, noisy=False)
hood('Hood', fc, .118, .3, SHROUD, hp, open_front=38, sy=1.1, droop=.01)
for s in (-1, 1):
    a = (-90 + s * 38) * D
    pts = [(r * math.cos(a), r * 1.1 * math.sin(a) + .01, z + L) for r, z in ((.09, 1.4), (.122, 1.47), (.127, 1.53), (.12, 1.59), (.09, 1.68), (.035, 1.71))]
    attach(tube('GoldThread%d' % s, pts, .0035, GOLD), hp, amp=.3)

# ---------- arms: trailing shroud sleeves, thin pale hands ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .15, 0, 1.33 + L), (s * .2, -.04, 1.08 + L), (s * .22, -.12, .88 + L)
    attach(ell('Shoulder' + key, sh, .055, .052, .052, SHROUD, segs=12, rings=7), p, amp=.25)
    attach(limb('Upper' + key, sh, el, [(0, .045), (1, .05)], SHROUD, segs=10), p, amp=.25)
    xf, Ln = between(el, wr)
    sl = lathe('Sleeve' + key, [(.05, 0), (.07, Ln * .6), (.1, Ln), (.11, Ln * 1.15)], SHROUD, segs=14, xf=xf, zmod=lambda a, z, Ln=Ln: (-.07 * abs(math.sin(a * 3 + 1)) ** 2 if z > Ln * 1.1 else 0))
    attach(sl, p, amp=.25)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .05
    attach(ell('Hand' + key, tuple(hc), .022, .018, .04, BONE, segs=10, rings=6), p, amp=.2)
    for k in range(4):   # long thin fingers
        f0 = hc + Vector((s * (k - 1.5) * .009, -.012, -.025))
        attach(limb('Finger%s%d' % (key, k), tuple(f0), tuple(f0 + Vector((0, -.012, -.045))), [(0, .0045), (1, .003)], BONE, segs=5), p, amp=.2)

# ---------- no feet: leg pivots carry only drifting snow (they still drive the hem sway) ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    for k in range(3):
        flake('LegFlake%s%d' % (key, k), (s * .07 + random.uniform(-.05, .05), random.uniform(-.1, .05), .15 + L * .4 + k * .08), .02, P[key])
# ---------- Tail: a long trailing strip of shroud behind her ----------
attach(lathe('Trail', [(.28, .75 + L), (.34, .45 + L), (.4, .2 + L), (.44, .02 + L)], SHROUD, segs=8, arc=(70 * D, 110 * D), sy=.9,
             zmod=lambda a, z: (-.12 * abs(math.sin(a * 11)) if z < .05 + L else 0)), P['Tail'], amp=.25, freq=8)

bpy.context.view_layer.update()
print('tris', tris())
