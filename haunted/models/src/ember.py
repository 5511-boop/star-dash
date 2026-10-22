import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(23)
L = .05
root, P = setup('Ember', 1.40 + L, (.14, 1.31 + L), (.07, .86 + L), (.0, 1.0 + L))
# The Ember Spirit: a burning wraith. An emaciated charcoal body split with fire and ribs, a long skull face frozen in a
# scream (hollow sockets, a glowing throat, splintered teeth), hair of tall flame, skeletal arms with burning claws,
# and a dress of flame torn through with scorched black rags. She carries a burning skull.
CORE = mat_glow_tex('EmberCore', make_image('EmberCore', 256, 256, magma_px), .6, 1.2)
F = [mat('FlameRed', (.22, .03, 0), .4, 0, emit=(1, .12, .01), es=.55, vcol=False),
     mat('FlameOrange', (.28, .09, 0), .4, 0, emit=(1, .32, .03), es=.55, vcol=False),
     mat('FlameYellow', (.32, .2, .04), .4, 0, emit=(1, .55, .12), es=.5, vcol=False)]
HOT = mat('RedHot', (1, .4, .15), .2, 0, emit=(1, .3, .08), es=1.6, vcol=False)
THROAT = mat('Throat', (1, .3, .03), .4, 0, emit=(1, .25, .02), es=1, vcol=False)
VOID = mat('Void', (.004, .003, .003), 1.0, vcol=False)
BONE = mat('AshBone', (.24, .2, .16), .55)
RAG = mat('ScorchedRag', (.035, .025, .022), .9)

def cone(name, base, tip, r, m, segs=6):
    return limb(name, base, tip, [(0, r), (.6, r * .55), (1, 0)], m, segs=segs)

# ---------- emaciated charcoal body: wasp waist, ribs, spine ----------
attach(lathe('Body', [(.09, .9 + L), (.085, .98 + L), (.12, 1.1 + L), (.15, 1.2 + L), (.135, 1.28 + L), (.08, 1.32 + L), (.04, 1.335 + L)], CORE, segs=24, sy=.78, capt=True), root, noisy=False)
for side in (-1, 1):
    for k in range(4):
        z = 1.11 + k * .045 + L; rr = .14 + k * .006
        pts = [(math.sin(side * t * 70 * D) * rr * 1.06, -math.cos(side * t * 70 * D) * rr * .8 - .006, z - t * .02) for t in (0, .5, 1)]
        attach(tube('Rib%d_%d' % (side, k), pts, .0055, BONE), root, amp=.5)
for k in range(6):
    attach(ell('Spine%d' % k, (0, .105, 1.02 + k * .05 + L), .012, .012, .015, BONE, segs=6, rings=4), root, amp=.4)

# ---------- the dress: flame tongues licking upward, torn through with scorched rags ----------
for ring, (z, r, n, h) in enumerate(((.02, .4, 18, .36), (.25, .33, 15, .34), (.48, .26, 13, .3), (.7, .18, 11, .27), (.88, .12, 9, .2))):
    for k in range(n):
        a = k / n * 2 * PI + ring * .4
        base = Vector((r * math.cos(a), r * .85 * math.sin(a), z + L))
        tip = base + Vector((math.cos(a) * .05, math.sin(a) * .05 + .03, h * random.uniform(.75, 1.35)))
        m = F[(k + ring) % 3] if ring < 3 else F[(k + ring) % 2 + 1]
        fl = lathe('Flame%d_%d' % (ring, k), [(.045 - ring * .004, 0), (.035 - ring * .003, h * .35), (.015, h * .75), (0, h)], m, segs=6, sy=.5,
                   xf=Matrix.Translation(base) @ (tip - base).to_track_quat('Z', 'Y').to_matrix().to_4x4() @ Matrix.Rotation(a, 4, 'Z'))
        attach(fl, root if math.sin(a) < .4 else P['Tail'], noisy=False)
for k in range(12):   # scorched black rags hanging between the flames, frayed and holed
    a = k / 12 * 2 * PI + .2; r = random.uniform(.2, .3); z = random.uniform(.3, .75)
    rg = box('Rag%d' % k, (r * math.cos(a), r * .85 * math.sin(a), z + L), (.07, .004, random.uniform(.25, .4)), RAG, rot=(random.uniform(-.2, .2), random.uniform(-.25, .25), a + PI / 2))
    attach(rg, root if math.sin(a) < .4 else P['Tail'], amp=.5); holes(rg, freq=40, thresh=.58, dark=.0)
for k in range(18):   # embers drifting off
    a = random.uniform(0, 2 * PI); r = random.uniform(.3, .6)
    attach(ell('Ember%d' % k, (r * math.cos(a), r * math.sin(a), random.uniform(.2, 1.7) + L), .007, .007, .007, F[2], segs=5, rings=3), root, noisy=False)

# ---------- head: a long charred skull frozen mid-scream ----------
hp = P['Head']
attach(limb('Neck', (0, 0, 1.32 + L), (0, -.01, 1.44 + L), [(0, .03), (1, .028)], CORE, segs=10), hp, noisy=False)
fc = (0, -.01, 1.5 + L); R = (.072, .082, .118)
attach(ell('Face', fc, *R, CORE, segs=22, rings=12), hp, noisy=False)
for s in (-1, 1):   # sunken sockets slanting down to the nose, a pinprick of red fire deep in each
    x, y, z = on_face(fc, R, s * .055, .63)
    so = ell('Socket%d' % s, (x, y + .002, z), .026, .012, .019, VOID, segs=10, rings=6); so.rotation_euler = (0, -s * .45, 0)
    attach(so, hp, noisy=False)
    attach(ell('Pupil%d' % s, (x + s * .004, y - .008, z - .004), .0045, .003, .0035, HOT, segs=6, rings=4), hp, noisy=False)
attach(ell('NoseHole', on_face(fc, R, 0, .5), .012, .01, .014, VOID, segs=8, rings=5), hp, noisy=False)
mx, my, mz = on_face(fc, R, 0, .34)
attach(ell('Mouth', (mx, my - .002, mz - .01), .032, .016, .05, VOID, segs=14, rings=8), hp, noisy=False)
attach(ell('ThroatGlow', (mx, my - .012, mz - .014), .017, .007, .03, THROAT, segs=10, rings=6), hp, noisy=False)
for k in range(5):   # splintered teeth round the rim, top and bottom
    u = (k - 2) * .013
    attach(cone('ToothT%d' % k, (mx + u, my - .015, mz + .033 - abs(k - 2) * .007), (mx + u * .8, my - .019, mz + .012), .005, BONE, 5), hp, noisy=False)
    attach(cone('ToothB%d' % k, (mx + u, my - .015, mz - .053 + abs(k - 2) * .007), (mx + u * .8, my - .019, mz - .032), .005, BONE, 5), hp, noisy=False)
for k in range(16):   # hair: tall flames streaming up and back
    a = (-160 + k * 21.3) * D
    base = Vector((.066 * math.cos(a), .07 * math.sin(a) + .02, 1.57 + L))
    h = random.uniform(.18, .36)
    tip = base + Vector((math.cos(a) * .04, .1 + math.sin(a) * .03, h))
    fl = lathe('Hair%d' % k, [(.03, 0), (.022, h * .4), (0, h)], F[k % 3], segs=6, sy=.6,
               xf=Matrix.Translation(base) @ (tip - base).to_track_quat('Z', 'Y').to_matrix().to_4x4())
    attach(fl, hp, noisy=False)

# ---------- arms: long and skeletal, burning claws ----------
for key, s in (('ArmA', -1), ('ArmB', 1)):
    p = P[key]
    sh, el, wr = (s * .14, 0, 1.31 + L), (s * .2, -.02, 1.03 + L), (s * .21, -.12, .78 + L)
    attach(ell('Shoulder' + key, sh, .028, .026, .028, BONE, segs=10, rings=6), p, amp=.4)
    attach(limb('Upper' + key, sh, el, [(0, .026), (.5, .02), (1, .022)], CORE, segs=10), p, noisy=False)
    attach(ell('Elbow' + key, el, .022, .022, .022, BONE, segs=8, rings=5), p, amp=.4)
    attach(limb('Fore' + key, el, wr, [(0, .02), (.6, .016), (1, .018)], CORE, segs=10), p, noisy=False)
    E_, W_ = Vector(el), Vector(wr); d = (W_ - E_).normalized()
    hc = W_ + d * .025
    attach(ell('Hand' + key, tuple(hc), .022, .016, .03, CORE, segs=8, rings=5), p, noisy=False)
    for k in range(4):   # long black claws, white-hot at the tips
        side = Vector((s * (k - 1.5) * .014, -.012, 0))
        b = hc + side + d * .02; t = b + d * .13 + Vector((0, -.04, 0)) + side * .6
        attach(cone('Claw%s%d' % (key, k), tuple(b), tuple(t), .007, VOID, 5), p, noisy=False)
        attach(ell('ClawTip%s%d' % (key, k), tuple(t), .004, .004, .004, HOT, segs=5, rings=3), p, noisy=False)
    for k in range(5):
        a = k / 5 * 2 * PI
        b = W_ + Vector((.025 * math.cos(a), .025 * math.sin(a), .03))
        attach(lathe('WristFlame%s%d' % (key, k), [(.014, 0), (.007, .04), (0, .08)], F[k % 3], segs=5, xf=Matrix.Translation(b) @ Matrix.Rotation(PI * .85, 4, 'X')), p, noisy=False)
# a burning skull cupped in hand B
pB = P['ArmB']; sc = (.22, -.2, .74 + L)
attach(ell('SkullFire', sc, .04, .045, .042, F[1], segs=12, rings=8), pB, noisy=False)
for s in (-1, 1):
    attach(ell('SkullEye%d' % s, (sc[0] + s * .016, sc[1] - .038, sc[2] + .008), .011, .006, .012, VOID, segs=8, rings=5), pB, noisy=False)
attach(ell('SkullJaw', (sc[0], sc[1] - .036, sc[2] - .022), .014, .006, .008, VOID, segs=8, rings=5), pB, noisy=False)
for k in range(5):
    a = k / 5 * 2 * PI
    attach(lathe('SkullFlame%d' % k, [(.012, 0), (.006, .04), (0, .08)], F[(k + 1) % 3], segs=5, xf=Matrix.Translation((sc[0] + .02 * math.cos(a), sc[1] + .02 * math.sin(a), sc[2] + .03))), pB, noisy=False)
# ---------- legs: charcoal, hidden in the flames ----------
for key, s in (('LegA', -1), ('LegB', 1)):
    x = s * .07
    attach(limb('Leg' + key, (x, 0, .86 + L), (x, 0, .06 + L), [(0, .035), (1, .022)], CORE, segs=10), P[key], noisy=False)

bpy.context.view_layer.update()
print('tris', tris())
