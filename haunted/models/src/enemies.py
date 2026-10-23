# Enemy models for Hollow Manor: one root per look the game uses (Enemy_normal, _hat, _hood, _wisp, _crown, _blob,
# _statue, _knight), all exported into models/enemies.glb. Front is -Y (the game's forward), feet/base at z = 0.
# Material names the game understands:
#   TintBody  - the ghostly flesh/cloth: the game recolours it to the level's ghost tint and keeps it see-through
#   TintGlow  - glowing parts that take the tint too (flames, auras)
#   anything else keeps its own colour (void, bone, eyes, iron, stone)
# Nodes named Sway_* get a slow ghostly sway in the game; Reach_* (arms) reach and claw toward you.
import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
reset(); random.seed(31)
BODY = mat('TintBody', (.85, .9, 1), .45, 0, emit=(.55, .7, 1), es=.6, alpha=.85, vcol=False)
TGLOW = mat('TintGlow', (1, .9, .7), .3, 0, emit=(1, .8, .5), es=3, vcol=False)
VOID = mat('Void', (.004, .003, .004), 1., vcol=False)
EYE = mat('EyeGlow', (1, .25, .15), .2, 0, emit=(1, .15, .05), es=8, vcol=False)
COLD = mat('EyeCold', (.7, .9, 1), .2, 0, emit=(.6, .85, 1), es=8, vcol=False)
BONE = mat('Bone', (.62, .58, .5), .55)
HAIR = mat('Hair', (.01, .01, .012), .7)
CLOTH = mat('BlackCloth', (.02, .018, .025), .9)
IRON = mat('RustIron', (.18, .1, .06), .55, .7)
STONE = mat('Stone', (.42, .42, .44), .95)
GOLD = mat('GhostGold', (1, .75, .25), .3, 1., emit=(1, .6, .15), es=1.5, vcol=False)
TEETH = mat('Teeth', (.75, .72, .62), .45, vcol=False)

def cone(name, b, t, r, m, segs=7): return limb(name, b, t, [(0, r), (.6, r * .55), (1, 0)], m, segs=segs)
def node(name, loc, parent): return empty(name, loc, parent)
def skeletal_arm(name, parent, s, sh, el, wr, m, finger=.16, nail=BONE):
    """long thin arm under a Reach_ pivot, with five long fingers"""
    piv = node('Reach_' + name, sh, parent)
    attach(limb(name + 'Up', sh, el, [(0, .05), (.5, .035), (1, .04)], m, segs=8), piv, noisy=False)
    attach(limb(name + 'Fore', el, wr, [(0, .035), (.6, .028), (1, .03)], m, segs=8), piv, noisy=False)
    d = (Vector(wr) - Vector(el)).normalized()
    side = Vector((1, 0, 0)).cross(d).normalized() if abs(d.x) < .9 else Vector((0, 0, 1))
    for k in range(5):
        a = (k - 2) * .35; dir2 = (d + side * a * .5 + Vector((0, 0, -.15))).normalized()
        b = Vector(wr) + side * (k - 2) * .016; t = b + dir2 * finger * (.75 if k in (0, 4) else 1)
        attach(limb(name + 'F%d' % k, tuple(b), tuple(t), [(0, .012), (.7, .008), (1, .003)], m, segs=5), piv, noisy=False)
        attach(cone(name + 'N%d' % k, tuple(t), tuple(t + dir2 * .05), .006, nail, 5), piv, noisy=False)
    return piv
def shroud(name, parent, top, bot, r_top, r_bot, m, jag=.18, segs=26, sy=.85, cx=0.):
    """a hanging robe that frays into tongues at the hem"""
    jagf = lambda a, z: (-jag * abs(math.sin(a * 5.3)) - jag * .6 * abs(math.sin(a * 13.1 + 1))) if z < bot + .02 else 0
    o = lathe(name, [(r_bot, bot), (r_bot * .92, bot + (top - bot) * .35), (r_top * 1.3, bot + (top - bot) * .75), (r_top, top)], m, segs=segs, sy=sy, zmod=jagf, center=(cx, 0))
    return attach(o, parent, noisy=False)
def ghost_face(parent, fc, R, eye_m=EYE, hair=True, mouth=True, one_eye=False):
    attach(ell('Head', fc, *R, BODY, segs=20, rings=12), parent, noisy=False)
    for s in (-1, 1):
        if one_eye and s < 0: continue
        p = on_face(fc, R, s * .06, .6)
        so = ell('Sock%d' % s, (p[0], p[1] + .006, p[2]), R[0] * .3, R[1] * .15, R[2] * .22, VOID, segs=10, rings=6); so.rotation_euler = (0, -s * .3, 0); attach(so, parent, noisy=False)
        attach(ell('Eye%d' % s, (p[0], p[1] - .004, p[2] - .005), R[0] * .08, R[1] * .05, R[2] * .07, eye_m, segs=6, rings=4), parent, noisy=False)
    if mouth:
        m = on_face(fc, R, 0, .3)
        attach(ell('Maw', (m[0], m[1] + .004, m[2] - .02), R[0] * .32, R[1] * .15, R[2] * .3, VOID, segs=12, rings=8), parent, noisy=False)
    if hair:   # long black hair hanging over the face and down the back
        for k in range(22):
            a = (-150 + k * 300 / 21) * D; r = R[0] * 1.02
            b = Vector((fc[0] + r * math.cos(a), fc[1] + R[1] * 1.02 * math.sin(a), fc[2] + R[2] * .55))
            front = math.sin(a) < -.6
            L = random.uniform(.55, .95) * (1.25 if not front else .9)
            pts = [tuple(b), tuple(b + Vector((0, (-.04 if front else .05), -L * .4))), tuple(b + Vector((random.uniform(-.03, .03), (-.05 if front else .08), -L)))]
            if front and abs(math.cos(a)) < .25: continue   # a parting for the eye
            attach(tube('Hair%d' % k, pts, .018, HAIR), parent, noisy=False)

def enemy_normal(x):
    """the Weeping Woman: a drowned-pale ghost in a fraying shroud, hair over her face, arms out and reaching"""
    root = empty('Enemy_normal', (x, 0, 0)); sw = node('Sway_body', (x, 0, 1.0), root)
    shroud('Shroud', sw, 1.42, .05, .2, .55, BODY, jag=.25, cx=x)
    attach(lathe('Shoulders', [(.2, 1.38), (.24, 1.42), (.2, 1.5), (.07, 1.56)], BODY, segs=20, sy=.8, center=(x, 0)), sw, noisy=False)
    hd = node('Sway_head', (x, 0, 1.56), sw)
    ghost_face(hd, (x, -.01, 1.7), (.13, .14, .17), one_eye=True)
    for s in (-1, 1):
        skeletal_arm('Arm%d' % s, sw, s, (x + s * .22, -.02, 1.4), (x + s * .3, -.3, 1.25), (x + s * .26, -.58, 1.18), BODY)
    return root
def enemy_hat(x):
    """the Undertaker: a seven-foot man in a funeral coat and stovepipe hat, a skull's grin, coat tails dissolving to smoke"""
    root = empty('Enemy_hat', (x, 0, 0)); sw = node('Sway_body', (x, 0, 1.0), root)
    shroud('Coat', sw, 1.55, .15, .2, .38, CLOTH, jag=.3, segs=22, cx=x)
    for k in range(10):   # coat tails trailing off into ghost-smoke
        a = (k / 10) * 2 * math.pi; b = Vector((x + .34 * math.cos(a), .3 * math.sin(a), .2)); t = b + Vector((math.cos(a) * .06, math.sin(a) * .06 + .05, -.25))
        attach(cone('Tail%d' % k, tuple(b), tuple(t), .06, BODY), sw, noisy=False)
    for z in (1.2, 1.32, 1.44): attach(ell('Button%d' % z, (x, -.21 * .85, z), .015, .01, .015, BONE, segs=6, rings=4), sw, noisy=False)
    hd = node('Sway_head', (x, 0, 1.6), sw)
    attach(limb('Neck', (x, 0, 1.52), (x, 0, 1.66), [(0, .05), (1, .045)], BONE, segs=8), hd, noisy=False)
    fc, R = (x, -.01, 1.78), (.11, .12, .15)
    attach(ell('Skull', fc, *R, BONE, segs=18, rings=10), hd, amp=.4)
    for s in (-1, 1):
        p = on_face(fc, R, s * .06, .6)
        attach(ell('Sock%d' % s, (p[0], p[1] + .008, p[2]), .032, .02, .03, VOID, segs=8, rings=5), hd, noisy=False)
        attach(ell('Eye%d' % s, (p[0], p[1] - .002, p[2] - .004), .009, .006, .009, COLD, segs=6, rings=4), hd, noisy=False)
    for k in range(9):   # the lipless grin: a row of teeth across the jaw
        p = on_face(fc, R, (k - 4) * .022, .26 + .012 * abs(k - 4))
        attach(box('Tooth%d' % k, (p[0], p[1] - .004, p[2]), (.012, .01, .03), TEETH), hd, noisy=False)
    attach(lathe('Brim', [(.21, 1.9), (.22, 1.91), (0, 1.91)], CLOTH, segs=24, center=(x, -.01)), hd, noisy=False)
    attach(lathe('Stovepipe', [(.12, 1.9), (.125, 2.2), (.13, 2.32), (0, 2.32)], CLOTH, segs=20, center=(x, -.01)), hd, noisy=False)
    attach(lathe('Band', [(.128, 1.92), (.13, 1.97)], mat('Crape', (.06, .0, .02), .6), segs=20, center=(x, -.01)), hd, noisy=False)
    for s in (-1, 1): skeletal_arm('Arm%d' % s, sw, s, (x + s * .22, 0, 1.5), (x + s * .3, -.2, 1.2), (x + s * .3, -.42, 1.02), CLOTH, finger=.19)
    return root
def enemy_hood(x):
    """the Reaper: a hooded cloak with nothing inside but two coals, bony hands, a ragged hem that never touches the floor"""
    root = empty('Enemy_hood', (x, 0, 0)); sw = node('Sway_body', (x, 0, 1.0), root)
    shroud('Cloak', sw, 1.55, .1, .22, .5, CLOTH, jag=.35, segs=26, cx=x)
    hd = node('Sway_head', (x, 0, 1.6), sw)
    fc = (x, 0, 1.78)
    hood(f'Hood', fc, .2, .5, CLOTH, hd, open_front=55, sy=1.05)
    attach(ell('Inside', (x, -.02, 1.76), .15, .14, .17, VOID, segs=14, rings=8), hd, noisy=False)
    for s in (-1, 1): attach(ell('Eye%d' % s, (x + s * .05, -.15, 1.78), .022, .01, .012, EYE, segs=8, rings=5), hd, noisy=False)
    for s in (-1, 1): skeletal_arm('Arm%d' % s, sw, s, (x + s * .24, 0, 1.48), (x + s * .3, -.2, 1.2), (x + s * .24, -.45, 1.1), BONE, finger=.17)
    for s in (-1, 1): attach(lathe('Sleeve%d' % s, [(.08, 0), (.12, .2), (.15, .32)], CLOTH, segs=12, xf=between((x + s * .3, -.2, 1.2), (x + s * .3, -.33, 1.14))[0]), sw, noisy=False)
    return root
def enemy_wisp(x):
    """a burning skull with a comet's tail of ghost-fire"""
    root = empty('Enemy_wisp', (x, 0, 0)); sw = node('Sway_body', (x, 0, 1.0), root)
    fc, R = (x, -.1, 1.1), (.17, .19, .2)
    attach(ell('Skull', fc, *R, BONE, segs=18, rings=10), sw, amp=.4)
    attach(ell('Jaw', (x, -.17, .96), .12, .1, .06, BONE, segs=12, rings=6), sw, amp=.4)
    for s in (-1, 1):
        p = on_face(fc, R, s * .06, .58)
        attach(ell('Sock%d' % s, (p[0], p[1] + .01, p[2]), .05, .03, .045, VOID, segs=8, rings=5), sw, noisy=False)
        attach(ell('Eye%d' % s, (p[0], p[1] - .004, p[2]), .016, .01, .016, TGLOW, segs=6, rings=4), sw, noisy=False)
    attach(ell('Nose', on_face(fc, R, 0, .42), .025, .02, .03, VOID, segs=6, rings=4), sw, noisy=False)
    for k in range(7): p = on_face(fc, R, (k - 3) * .025, .2); attach(box('Tooth%d' % k, (p[0], p[1] - .01, p[2] + .01), (.016, .012, .03), TEETH), sw, noisy=False)
    for k in range(9):   # flames licking up off the cranium and streaming back
        a = (k / 9) * 2 * math.pi; b = Vector((x + .12 * math.cos(a), -.08 + .12 * math.sin(a) + .05, 1.22))
        t = b + Vector((0, .25 + random.uniform(0, .15), .25 + random.uniform(0, .15)))
        attach(lathe('Flame%d' % k, [(.06, 0), (.04, .15), (0, (t - b).length)], TGLOW, segs=6, xf=Matrix.Translation(b) @ (t - b).to_track_quat('Z', 'Y').to_matrix().to_4x4()), sw, noisy=False)
    attach(lathe('Tail', [(.14, 0), (.1, .25), (.05, .5), (0, .75)], BODY, segs=10, xf=Matrix.Translation((x, .05, 1.08)) @ Vector((0, 1, .25)).to_track_quat('Z', 'Y').to_matrix().to_4x4()), sw, noisy=False)
    return root
def enemy_crown(x):
    """the Hollow King: a skeleton in rotting royal robes, ribs bare, a burning crown, one hand reaching"""
    root = empty('Enemy_crown', (x, 0, 0)); sw = node('Sway_body', (x, 0, 1.0), root)
    shroud('Robe', sw, 1.45, .05, .24, .5, BODY, jag=.25, cx=x)
    attach(lathe('Mantle', [(.36, 1.3), (.3, 1.45), (.1, 1.52)], mat('RoyalRot', (.15, .02, .05), .8), segs=22, sy=.85, center=(x, 0)), sw, noisy=True)
    for k in range(5):   # bare ribs over the open robe
        z = 1.08 + k * .06
        for s in (-1, 1):
            pts = [(x + s * .02, -.31, z), (x + s * .13, -.29, z - .02), (x + s * .21, -.2, z - .04)]
            attach(tube('Rib%d_%d' % (k, s), pts, .012, BONE), sw, amp=.4)
    attach(limb('Spine', (x, -.3, 1.0), (x, -.3, 1.4), [(0, .02), (1, .02)], BONE, segs=6), sw, amp=.4)
    hd = node('Sway_head', (x, 0, 1.52), sw)
    fc, R = (x, -.01, 1.68), (.12, .13, .15)
    attach(ell('Skull', fc, *R, BONE, segs=18, rings=10), hd, amp=.4)
    for s in (-1, 1):
        p = on_face(fc, R, s * .06, .58)
        attach(ell('Sock%d' % s, (p[0], p[1] + .01, p[2]), .035, .02, .032, VOID, segs=8, rings=5), hd, noisy=False)
        attach(ell('Eye%d' % s, (p[0], p[1] - .003, p[2]), .01, .006, .01, EYE, segs=6, rings=4), hd, noisy=False)
    for k in range(8): p = on_face(fc, R, (k - 3.5) * .022, .24); attach(box('Tooth%d' % k, (p[0], p[1] - .006, p[2]), (.013, .01, .026), TEETH), hd, noisy=False)
    attach(torus('Crown', (x, -.01, 1.82), .12, .018, GOLD, segs=20, minor=5), hd, noisy=False)
    for k in range(7):
        a = k / 7 * 2 * math.pi; b = (x + .12 * math.cos(a), -.01 + .12 * math.sin(a), 1.83)
        attach(cone('Spike%d' % k, b, (b[0] * 1 + .02 * math.cos(a), b[1] + .02 * math.sin(a), 1.96 + (.03 if k % 2 else 0)), .022, GOLD), hd, noisy=False)
    skeletal_arm('ArmR', sw, 1, (x + .26, 0, 1.4), (x + .32, -.32, 1.32), (x + .3, -.6, 1.34), BONE, finger=.15)
    skeletal_arm('ArmL', sw, -1, (x - .26, 0, 1.4), (x - .34, -.1, 1.15), (x - .3, -.15, .9), BONE, finger=.15)
    return root
def enemy_blob(x):
    """a heap of ectoplasm with a dozen eyes and a mouth that splits it in two"""
    root = empty('Enemy_blob', (x, 0, 0)); sw = node('Sway_body', (x, 0, .5), root)
    attach(ell('Mass', (x, 0, .5), .72, .65, .5, BODY, segs=24, rings=14), sw, noisy=False)
    for k in range(7):
        a = random.uniform(0, 2 * math.pi); r = random.uniform(.35, .6)
        attach(ell('Lump%d' % k, (x + r * math.cos(a), r * math.sin(a) * .9, random.uniform(.2, .6)), .25, .25, .22, BODY, segs=12, rings=8), sw, noisy=False)
    attach(ell('Mouth', (x, -.6, .42), .38, .12, .14, VOID, segs=16, rings=8), sw, noisy=False)
    for k in range(11):
        u = (k - 5) * .065
        attach(cone('UpperT%d' % k, (x + u, -.66, .52 - abs(u) * .2), (x + u, -.7, .42 - abs(u) * .2), .018, TEETH, 5), sw, noisy=False)
        attach(cone('LowerT%d' % k, (x + u, -.66, .32 + abs(u) * .2), (x + u, -.69, .4 + abs(u) * .2), .016, TEETH, 5), sw, noisy=False)
    for k in range(13):   # eyes scattered over the mass, staring every way but mostly at you
        a = random.uniform(-2.6, -.5) if k < 9 else random.uniform(0, 2 * math.pi); z = random.uniform(.5, .95)
        r = math.sqrt(max(0, 1 - ((z - .5) / .5) ** 2)) * .7 + .02
        p = (x + r * math.cos(a), r * math.sin(a) * .93, z); s = random.uniform(.035, .07)
        attach(ell('EyeW%d' % k, p, s, s, s, mat('EyeWhite', (.85, .82, .7), .3, vcol=False), segs=10, rings=6), sw, noisy=False)
        d = Vector((math.cos(a), math.sin(a), 0)) * s * .8
        attach(ell('Pupil%d' % k, (p[0] + d.x, p[1] + d.y - s * .3, p[2]), s * .45, s * .45, s * .45, EYE, segs=6, rings=4), sw, noisy=False)
    return root
def enemy_statue(x):
    """a weeping angel: hands over its face, wings folded, cracked stone, light leaking from the cracks"""
    root = empty('Enemy_statue', (x, 0, 0)); sw = node('Still_body', (x, 0, 1.0), root)
    attach(lathe('Gown', [(.4, .05), (.32, .5), (.22, 1.0), (.2, 1.3), (.24, 1.45), (.08, 1.55)], STONE, segs=22, sy=.8, center=(x, 0)), sw, amp=.5, freq=14)
    attach(box('Plinth', (x, 0, .03), (.9, .8, .06), STONE, bevel=.01), sw, amp=.5)
    fc, R = (x, -.02, 1.7), (.11, .12, .14)
    attach(ell('Head', fc, *R, STONE, segs=16, rings=10), sw, amp=.5)
    for s in (-1, 1):   # arms raised, hands over the face
        attach(limb('Upper%d' % s, (x + s * .22, 0, 1.45), (x + s * .2, -.18, 1.35), [(0, .05), (1, .045)], STONE, segs=8), sw, amp=.5)
        attach(limb('Fore%d' % s, (x + s * .2, -.18, 1.35), (x + s * .05, -.15, 1.68), [(0, .045), (1, .04)], STONE, segs=8), sw, amp=.5)
        attach(ell('Hand%d' % s, (x + s * .04, -.15, 1.72), .05, .025, .07, STONE, segs=10, rings=6), sw, amp=.5)
        w = lathe('Wing%d' % s, [(0, 0), (.12, .2), (.15, .6), (.1, .95), (0, 1.1)], STONE, segs=14, sx=.18, xf=Matrix.Translation((x + s * .14, .2, .5)) @ Matrix.Rotation(s * .25, 4, 'Y'))
        attach(w, sw, amp=.5, freq=14)
    LEAK = mat('CrackLight', (1, .9, .7), .3, 0, emit=(1, .75, .4), es=4, vcol=False)
    for k in range(6):   # glowing cracks across the stone
        pts = []; px, pz = random.uniform(-.15, .15), random.uniform(.6, 1.5)
        for j in range(4): pts.append((x + px, -.32 + abs(px) * .4 - (pz - .5) * .08, pz)); px += random.uniform(-.06, .06); pz -= random.uniform(.06, .14)
        attach(tube('Crack%d' % k, pts, .006, LEAK), sw, noisy=False)
    for s in (-1, 1): attach(ell('Peek%d' % s, (x + s * .045, -.17, 1.71), .012, .006, .006, EYE, segs=6, rings=4), sw, noisy=False)   # eyes glinting between its fingers
    return root
def enemy_knight(x):
    """a hollow suit of rusted plate: horned helm, a red slit for eyes, a broken greatsword, smoke where a body should be"""
    root = empty('Enemy_knight', (x, 0, 0)); sw = node('Still_body', (x, 0, 1.0), root)
    attach(lathe('Cuirass', [(.24, .95), (.3, 1.2), (.33, 1.45), (.26, 1.6), (.12, 1.65)], IRON, segs=20, sy=.75, center=(x, 0), capt=True), sw, amp=.5, freq=12)
    attach(lathe('Tasset', [(.3, .65), (.27, .82), (.25, .97)], IRON, segs=20, sy=.78, center=(x, 0)), sw, amp=.5)
    for s in (-1, 1):
        attach(limb('Leg%d' % s, (x + s * .12, 0, .7), (x + s * .13, 0, .08), [(0, .085), (.5, .07), (1, .08)], IRON, segs=10), sw, amp=.5)
        attach(box('Sabaton%d' % s, (x + s * .13, -.06, .05), (.13, .28, .1), IRON, bevel=.02), sw, amp=.5)
        attach(ell('Pauldron%d' % s, (x + s * .34, -.02, 1.56), .16, .15, .1, IRON, segs=14, rings=8), sw, amp=.5)
        for k in range(3): b = (x + s * (.34 + k * .03), -.02 + (k - 1) * .05, 1.64); attach(cone('Spike%d_%d' % (s, k), b, (b[0] + s * .05, b[1], b[2] + .14), .025, IRON), sw, amp=.4)
        attach(limb('Arm%d' % s, (x + s * .36, 0, 1.5), (x + s * .4, -.15, 1.05), [(0, .07), (1, .06)], IRON, segs=10), sw, amp=.5)
    fc = (x, 0, 1.82)
    attach(lathe('Helm', [(.13, 1.66), (.15, 1.75), (.15, 1.9), (.11, 1.98), (0, 2.0)], IRON, segs=18, center=(x, 0)), sw, amp=.5)
    attach(box('Slit', (x, -.15, 1.84), (.18, .02, .025), VOID), sw, noisy=False)
    attach(box('SlitGlow', (x, -.16, 1.84), (.14, .01, .012), EYE), sw, noisy=False)
    for s in (-1, 1): horn_pts = [(x + s * .13, 0, 1.9), (x + s * .26, .02, 1.98), (x + s * .32, -.04, 2.12), (x + s * .3, -.1, 2.22)]; [attach(cone('Horn%d_%d' % (s, i), horn_pts[i], horn_pts[i + 1], .045 * (1 - i / 3) + .01, IRON), sw, amp=.4) for i in range(3)]
    attach(box('Blade', (x + .45, -.32, .78), (.07, .02, .9), mat('Steel', (.4, .4, .42), .3, .9)), sw, amp=.3)
    attach(box('Guard', (x + .45, -.32, 1.23), (.26, .05, .05), IRON), sw, amp=.3)
    SMOKE = mat('InnerSmoke', (.02, .015, .02), 1., emit=(.4, .02, .02), es=.6, alpha=.6, vcol=False)
    for k in range(5): attach(ell('Smoke%d' % k, (x + random.uniform(-.08, .08), -.12, 1.62 + k * .02), .06, .04, .05, SMOKE, segs=8, rings=5), sw, noisy=False)
    return root

roots = [f(i * 2.0) for i, f in enumerate((enemy_normal, enemy_hat, enemy_hood, enemy_wisp, enemy_crown, enemy_blob, enemy_statue, enemy_knight))]
bpy.context.view_layer.update()
print('tris', tris())

# export: every enemy root back at the origin, merged by material, all into one GLB
if globals().get('EXPORT'):
    import shutil
    for r in roots: r.location.x = 0
    bpy.context.view_layer.update()
    for r in roots: merge_by_material(r.name)
    bpy.ops.object.select_all(action='DESELECT')
    for r in roots:
        r.select_set(True)
        for c in r.children_recursive: c.select_set(True)
    out = SP + 'out/enemies.glb'
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_cameras=False, export_lights=False, export_animations=False, export_vertex_color='MATERIAL')
    shutil.copy(out, SP + 'star-dash/haunted/models/enemies.glb')
    import os; print('enemies.glb', os.path.getsize(out) // 1024, 'KB')
