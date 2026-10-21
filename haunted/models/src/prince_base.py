# Shared build for Level 10's mirrored pair. Call prince(name, palette, blur, hand).
def prince(name, PAL, blur, hand):
    root, P = setup(name, 1.49, (.21, 1.4), (.09, .92), (.0, 1.46))
    DOUB = mat(name + 'Doublet', PAL['doublet'], .55)
    SHARD = mat(name + 'Shard', PAL['shard'], .08, 1.0)
    TRIM = mat(name + 'Trim', PAL['trim'], .3, 1.0)
    HOSE = mat(name + 'Hose', PAL['hose'], .7)
    CAPE = mat(name + 'Cape', PAL['cape'], .6)
    CAPEIN = mat(name + 'CapeLining', PAL['lining'], .4)
    HAIR = mat(name + 'Hair', PAL['hair'], .4)
    BOOT = mat(name + 'Boot', (.02, .02, .025), .3)
    EYE = mat(name + 'Eye', PAL['eye'], .2, 0, emit=PAL['eye'], es=7, vcol=False)
    if blur:
        def face_px(u, v):   # a reflection that never quite resolves: features smeared into soft streaks
            du = u - .75
            base = [.85, .66, .58]
            if abs(du) < .25:
                for s in (-1, 1):
                    d = math.hypot((du - s * .05) / .07, (v - .58) / .05)
                    if d < 1: k = (1 - d) * .45; base = [c * (1 - k) + .35 * k for c in base]
                d = math.hypot(du / .06, (v - .34) / .03)
                if d < 1: k = (1 - d) * .4; base = [base[0] * (1 - k) + .6 * k, base[1] * (1 - k) + .3 * k, base[2] * (1 - k) + .3 * k]
                n = noise.noise(Vector((u * 8, v * 40, 2))) * .5 + .5
                base = [c * (.88 + .12 * n) for c in base]
            return tuple(base)
        SKIN = mat_tex(name + 'BlurFace', make_image(name + 'BlurFace', 128, 64, face_px), .3)
    else:
        SKIN = mat(name + 'Skin', (.62, .5, .46), .5)
    SY = .66
    UP = [(.2, .86), (.215, .92), (.205, 1.0), (.222, 1.12), (.245, 1.26), (.25, 1.35), (.238, 1.42), (.19, 1.47), (.11, 1.5), (.07, 1.505)]
    attach(lathe('Doublet', UP, DOUB, segs=32, sy=SY, capt=True, zmod=lambda a, z: (-.05 * abs(math.sin(a * 4)) if z < .87 else 0)), root, amp=.25)
    # mirror shards scaled over the doublet, catching the light
    for k in range(70):
        z = random.uniform(.92, 1.42); a = random.uniform(-150, -30) * D if k < 50 else random.uniform(30, 150) * D
        r = 0
        for (r0, z0), (r1, z1) in zip(UP, UP[1:]):
            if z0 <= z <= z1: r = r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        c = Vector((r * math.cos(a) * 1.01, r * SY * math.sin(a) * 1.01, z))
        n = Vector((math.cos(a), math.sin(a) / SY, 0)).normalized()
        sz = random.uniform(.018, .032)
        o = box('Shard%d' % k, tuple(c + n * .003), (sz, .003, sz * random.uniform(.8, 1.6)), SHARD, rot=(random.uniform(-.3, .3), random.uniform(-.6, .6), math.atan2(n.y, n.x) + PI / 2))
        attach(o, root, amp=.15, freq=40)
    attach(torus('Belt', (0, 0, .95), .21, .01, TRIM, segs=28, minor=4, scale=(1, SY, 1)), root, amp=.3)
    attach(lathe('Ruff', [(.06, 1.49), (.11, 1.5), (.13, 1.52), (.07, 1.53)], DOUB, segs=40, closed=True, zmod=lambda a, z: .008 * math.sin(a * 22)), root, amp=.15)
    # short cape over one shoulder, lined in the opposite metal
    tp = P['Tail']
    CP = [(.13, 1.5), (.24, 1.45), (.27, 1.3), (.29, 1.05), (.31, .85)]
    attach(lathe('Cape', CP, CAPE, segs=24, sy=.78, arc=(-20 * D, 200 * D)), tp, amp=.25)
    attach(lathe('CapeIn', [(r - .01, z) for r, z in CP], CAPEIN, segs=24, sy=.78, arc=(-20 * D, 200 * D), flip=True), tp, amp=.15)
    for s in (-1, 1):
        attach(ell('Clasp%d' % s, (s * .14, -.07, 1.49), .016, .008, .016, SHARD, segs=10, rings=6), tp, amp=.2)
    # head: swept hair, slim crown of mirror points
    hp = P['Head']
    attach(limb('Neck', (0, 0, 1.46), (0, 0, 1.57), [(0, .044), (1, .042)], SKIN if not blur else mat(name + 'NeckSkin', (.8, .62, .55), .4), segs=10), hp, amp=.1)
    fc = (0, 0, 1.635); R = (.093, .098, .113)
    attach(ell('Face', fc, *R, SKIN, segs=22, rings=12), hp, noisy=False)
    if not blur:
        eyes(hp, fc, R, EYE, du=.05, v=.58, size=(.011, .005, .007))
        attach(ell('Nose', on_face(fc, R, 0, .47), .01, .016, .02, SKIN, segs=8, rings=5), hp, amp=.1)
        attach(tube('Mouth', [on_face(fc, R, -.025, .33), on_face(fc, R, 0, .325), on_face(fc, R, .025, .33)], .0025, mat(name + 'Lip', (.3, .1, .1), .5)), hp, noisy=False)
    attach(lathe('Hair', [(.096, 1.6), (.104, 1.66), (.1, 1.72), (.07, 1.755), (0, 1.765)], HAIR, segs=24, sy=1.06, arc=(-50 * D, 230 * D), mod=lambda a, z: 1 + .04 * math.sin(a * 9)), hp, amp=.2)
    attach(ell('HairBack', (0, .035, 1.62), .092, .085, .1, HAIR, segs=14, rings=8), hp, amp=.2)
    attach(torus('Circlet', (0, 0, 1.715), .1, .005, TRIM, segs=24, minor=4, scale=(1, 1.06, 1)), hp, amp=.3)
    for k in range(7):
        a = (270 + (k - 3) * 22) * D; h = .045 if k == 3 else .028
        attach(lathe('CrownPt%d' % k, [(.008, 0), (.002, h), (0, h + .003)], SHARD, segs=4, xf=Matrix.Translation((.1 * math.cos(a), .106 * math.sin(a), 1.715))), hp, amp=.15)
    # legs: hose and turned-down boots
    for key, s in (('LegA', -1), ('LegB', 1)):
        leg(P, key, s, .09, .9, (.07, .056, .05), HOSE, BOOT, boot_top=.42)
        attach(torus('BootCuff' + key, (s * .09, 0, .43), .062, .012, BOOT, segs=14, minor=5), P[key], amp=.2)
    # arms with puffed shard-studded sleeves; a slim rapier in the chosen hand
    for key, s in (('ArmA', -1), ('ArmB', 1)):
        arm(P, key, s, (.21, 0, 1.4), (.26, -.03, 1.12), (.275, -.11, .9), DOUB, mat(name + 'Glove', PAL['glove'], .5), r=(.065, .05, .046, .04), cuff=TRIM, amp=.25)
    ph = P[hand]; sx = -1 if hand == 'ArmA' else 1
    h = Vector((sx * .285, -.15, .86))
    attach(torus('Basket', tuple(h + Vector((0, 0, -.03))), .035, .004, TRIM, rot=(PI / 2, 0, 0), segs=14, minor=4), ph, amp=.3)
    attach(box('Quillon', tuple(h + Vector((0, 0, -.055))), (.11, .008, .008), TRIM, bevel=.002), ph, amp=.3)
    attach(limb('Blade', tuple(h + Vector((0, 0, -.06))), tuple(h + Vector((0, -.02, -.72))), [(0, .006), (1, .002)], SHARD, segs=4), ph, amp=.1)
    attach(ell('Pommel', tuple(h + Vector((0, 0, .05))), .013, .013, .013, TRIM, segs=8, rings=5), ph, amp=.3)
    return root, P
