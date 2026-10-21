import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(23)
L = .05
root, P = setup('Ember', 1.40 + L, (.14, 1.31 + L), (.07, .86 + L), (.0, 1.0 + L))
# The Ember Spirit: a dress of living flame over a charcoal body cracked with fire (warm-toned)
CORE = mat_glow_tex('EmberCore', make_image('EmberCore', 256, 256, magma_px), .6, 3)
F = [mat('FlameRed', (1, .25, .03), .4, 0, emit=(1, .2, .02), es=2, vcol=False),
     mat('FlameOrange', (1, .5, .05), .4, 0, emit=(1, .45, .05), es=2.4, vcol=False),
     mat('FlameYellow', (1, .8, .3), .4, 0, emit=(1, .75, .25), es=2.8, vcol=False)]
EYE = mat('WhiteHot', (1, .95, .8), .2, 0, emit=(1, .9, .7), es=10, vcol=False)

# ---------- charcoal body ----------
attach(lathe('Body', [(.11, .9 + L), (.12, 1.0 + L), (.14, 1.12 + L), (.148, 1.22 + L), (.13, 1.29 + L), (.08, 1.32 + L), (.045, 1.33 + L)], CORE, segs=24, sy=.8, capt=True), root, noisy=False)
# ---------- the flame dress: rings of flame tongues licking upward ----------
for ring, (z, r, n, h) in enumerate(((.02, .38, 16, .32), (.25, .32, 14, .3), (.48, .25, 13, .28), (.7, .18, 11, .26), (.9, .14, 9, .2))):
    for k in range(n):
        a = k / n * 2 * PI + ring * .4
        base = Vector((r * math.cos(a), r * .85 * math.sin(a), z + L))
        tip = base + Vector((math.cos(a) * .03, math.sin(a) * .03, h * random.uniform(.8, 1.2)))
        m = F[(k + ring) % 3] if ring < 3 else F[(k + ring) % 2 + 1]
        fl = lathe('Flame%d_%d' % (ring, k), [(.045 - ring * .004, 0), (.035 - ring * .003, h * .35), (.015, h * .75), (0, h)], m, segs=6, sy=.5,
                   xf=Matrix.Translation(base) @ (tip - base).to_track_quat('Z', 'Y').to_matrix().to_4x4() @ Matrix.Rotation(a, 4, 'Z'))
        attach(fl, root if math.sin(a) < .4 else P['Tail'], noisy=False)
for k in range(14):   # embers drifting off
    a = random.uniform(0, 2 * PI); r = random.uniform(.3, .55)
    attach(ell('Ember%d' % k, (r * math.cos(a), r * math.sin(a), random.uniform(.2, 1.5) + L), .007, .007, .007, F[2], segs=5, rings=3), root, noisy=False)

# ---------- head: charcoal face, white-hot eyes and mouth, hair of flame ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.32 + L), (0, 0, 1.43 + L), [(0, .034), (1, .032)], CORE, segs=10), hp, noisy=False)
fc = (0, 0, 1.5 + L); R = (.08, .086, .098)
attach(ell('Face', fc, *R, CORE, segs=22, rings=12), hp, noisy=False)
eyes(hp, fc, R, EYE, du=.05, v=.58, size=(.012, .005, .008))
attach(ell('Mouth', on_face(fc, R, 0, .33), .016, .005, .006, EYE, segs=8, rings=5), hp, noisy=False)
for k in range(12):   # hair: tall flames streaming up and back
    a = (-150 + k * 25) * D
    base = Vector((.07 * math.cos(a), .07 * math.sin(a) + .02, 1.56 + L))
    h = random.uniform(.12, .22)
    tip = base + Vector((math.cos(a) * .03, .06 + math.sin(a) * .02, h))
    fl = lathe('Hair%d' % k, [(.028, 0), (.02, h * .4), (0, h)], F[k % 3], segs=6, sy=.6,
               xf=Matrix.Translation(base) @ (tip - base).to_track_quat('Z', 'Y').to_matrix().to_4x4())
    attach(fl, hp, noisy=False)

# ---------- arms: charcoal, wreathed in flame at the wrists ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .14, 0, 1.31 + L), (s * .18, -.03, 1.06 + L), (s * .19, -.1, .85 + L)
    attach(ell('Shoulder' + key, sh, .04, .038, .038, CORE, segs=10, rings=6), p, noisy=False)
    attach(limb('Upper' + key, sh, el, [(0, .032), (1, .027)], CORE, segs=10), p, noisy=False)
    attach(limb('Fore' + key, el, wr, [(0, .026), (1, .022)], CORE, segs=10), p, noisy=False)
    hc = Vector(wr) + (Vector(wr) - Vector(el)).normalized() * .03
    attach(ell('Hand' + key, tuple(hc), .02, .018, .032, CORE, segs=8, rings=5), p, noisy=False)
    for k in range(5):
        a = k / 5 * 2 * PI
        b = Vector(wr) + Vector((.03 * math.cos(a), .03 * math.sin(a), .03))
        attach(lathe('WristFlame%s%d' % (key, k), [(.016, 0), (.008, .04), (0, .07)], F[k % 3], segs=5, xf=Matrix.Translation(b) @ Matrix.Rotation(PI * .85, 4, 'X')), p, noisy=False)
# a fireball cupped in hand B
pB = P['ArmB']
attach(ell('Fireball', (.2, -.15, .8 + L), .045, .045, .05, F[2], segs=12, rings=8), pB, noisy=False)
attach(ell('FireballCore', (.2, -.15, .8 + L), .025, .025, .028, EYE, segs=8, rings=5), pB, noisy=False)
# ---------- legs: charcoal, hidden in the flames ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .86 + L), (x, 0, .06 + L), [(0, .04), (1, .028)], CORE, segs=10), P[key], noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
