# Horror pass for the player characters (exec'd after bl_helpers.py + kit.py and a character script).
# horrify(cfg) works on the finished model through its named parts:
#   face  - the head/face ellipsoid ('Face', 'FaceSkin', 'Head'...): hollow sockets with burning pupils, a mouth
#           (gape / stitch / grin / scream), cracks, tears running from the eyes, sickly skin
#   hands - 'HandArmA'/'HandArmB' (or gloves): long hooked claws
#   tatters, grime and blood soaked into the vertex colours, a drained colour grade, and per-character extras.
import math, random
from mathutils import Vector
_HB = 'C:/Users/Hunter/HollowManorBuild/'
for _f in ('bl_helpers.py', 'kit.py'): exec(open(_HB + _f, encoding='utf-8-sig').read())   # some older scripts don't load the kit

def obj(name): return bpy.data.objects.get(name)
def bbox(o):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx
def base_input(m):
    """the socket that holds a mat() material's colour (vertex-colour mix input, or the BSDF base colour)"""
    nt = m.node_tree
    mx = next((n for n in nt.nodes if n.type == 'MIX' and getattr(n, 'data_type', '') == 'RGBA'), None)
    if mx: return mx.inputs[6]
    b = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    return b.inputs['Base Color'] if b and not b.inputs['Base Color'].is_linked else None
def emissive(m):
    b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m and m.use_nodes else None
    return b is not None and (b.inputs['Emission Strength'].default_value > .3 or b.inputs['Emission Color'].is_linked)
def grade(desat=.3, dark=.15, skip=()):
    """drain the colour out of every non-glowing material"""
    for m in bpy.data.materials:
        if not m.use_nodes or m.name in skip or emissive(m): continue
        s = base_input(m)
        if not s: continue
        r, g, b, a = s.default_value; l = .3 * r + .59 * g + .11 * b
        s.default_value = tuple(((c * (1 - desat) + l * desat) * (1 - dark)) for c in (r, g, b)) + (a,)
def grime(amount=.35, blood=0., blood_col=(.5, .04, .03), low=.9, seed=5, skip=()):
    """soak dirt into every vertex-coloured mesh; blood pools low on the body and at random splashes"""
    for o in bpy.data.objects:
        if o.type != 'MESH' or 'Col' not in o.data.color_attributes or o.name in skip: continue
        ca = o.data.color_attributes['Col']; mw = o.matrix_world; me = o.data
        for li, lp in enumerate(me.loops):
            co = mw @ me.vertices[lp.vertex_index].co
            n = noise.noise(co * 6 + Vector((seed, 1, 2))) * .5 + .5
            n2 = noise.noise(co * 23 + Vector((seed, 4, 9))) * .5 + .5
            c = list(ca.data[li].color)
            k = 1 - amount * max(0, n * 1.6 - .6) - .15 * amount * n2
            c = [c[0] * k, c[1] * k, c[2] * k]
            if blood:
                b = noise.noise(co * 4.5 + Vector((seed + 7, 3, 1))) * .5 + .5
                w = max(0, (b - (1 - blood * .4)) * 5) * (1.2 if co.z < low else .55)
                w = min(1, w)
                c = [c[i] * (1 - w) + blood_col[i] * w for i in range(3)]
            ca.data[li].color = (c[0], c[1], c[2], 1)

def face_frame(name):
    o = obj(name); mn, mx = bbox(o); c = (mn + mx) / 2; R = (mx - mn) / 2
    return o, (c.x, c.y, c.z), (R.x, R.y, R.z)
def F(fc, R, du, v, push=0.):
    """point on the face ellipsoid; push > 0 sinks it inward"""
    x, y, z = on_face(fc, R, du, v); return (x, y + push, z)

def hollow_eyes(hp, fc, R, glow, du=.055, v=.6, slant=.35, size=1., tears=None, drip=1.):
    VOID = mat('HVoid', (.004, .003, .003), 1., vcol=False)
    EYE = mat('HEye_%02x%02x%02x' % tuple(int(c * 255) for c in glow), tuple(min(1, c * 1.2) for c in glow), .2, 0, emit=glow, es=7, vcol=False)
    for s in (-1, 1):
        p = F(fc, R, s * du, v, .004)
        so = ell('HSocket%d' % s, p, R[0] * .3 * size, R[1] * .16, R[2] * .2 * size, VOID, segs=10, rings=6); so.rotation_euler = (0, -s * slant, 0)
        attach(so, hp, noisy=False)
        q = F(fc, R, s * du * .95, v - .01, -.01)
        attach(ell('HPupil%d' % s, q, R[0] * .085 * size, R[1] * .05, R[2] * .07 * size, EYE, segs=6, rings=4), hp, noisy=False)
        if tears:
            TM = mat('HTear_%02x%02x%02x' % tuple(int(c * 255) for c in tears), tears, .25, vcol=False)
            a = Vector(F(fc, R, s * du, v - .06, -.006)); b = Vector(F(fc, R, s * du * 1.05, v - .06 - .22 * drip, -.006))
            attach(limb('HTear%d' % s, tuple(a), tuple(b), [(0, R[0] * .05), (.85, R[0] * .03), (1, R[0] * .05)], TM, segs=6), hp, noisy=False)
def mouth(hp, fc, R, kind, v=.3, w=1., teeth=(.75, .7, .6)):
    VOID = mat('HVoid', (.004, .003, .003), 1., vcol=False)
    TEETH = mat('HTeeth', teeth, .45, vcol=False)
    THREAD = mat('HThread', (.05, .04, .035), .8, vcol=False)
    if kind in ('gape', 'scream'):
        tall = 1.6 if kind == 'scream' else 1.
        p = F(fc, R, 0, v, -.002)
        attach(ell('HMouth', p, R[0] * .32 * w, R[1] * .14, R[2] * .17 * tall, VOID, segs=12, rings=8), hp, noisy=False)
        for k in range(5):
            u = (k - 2) * .03 * w; top = F(fc, R, u, v + .07 * tall - abs(k - 2) * .008, -.012); bot = F(fc, R, u, v - .07 * tall + abs(k - 2) * .008, -.012)
            attach(limb('HToothT%d' % k, top, (top[0], top[1] - .003, top[2] - .016 * tall), [(0, .0042), (1, 0)], TEETH, segs=5), hp, noisy=False)
            attach(limb('HToothB%d' % k, bot, (bot[0], bot[1] - .003, bot[2] + .014 * tall), [(0, .0042), (1, 0)], TEETH, segs=5), hp, noisy=False)
    elif kind == 'grin':   # a too-wide grin of needle teeth, curling up into the cheeks
        pts = [F(fc, R, u, v + 3.2 * u * u, -.004) for u in [i / 10 * .22 - .11 for i in range(11)]]
        for i, pp in enumerate(pts):
            attach(ell('HGrin%d' % i, pp, R[0] * .07, R[1] * .1, R[2] * .07, VOID, segs=6, rings=4), hp, noisy=False)
            if 1 <= i <= 9: attach(limb('HGT%d' % i, (pp[0], pp[1] - .008, pp[2] + .012), (pp[0], pp[1] - .01, pp[2] - .006), [(0, .005), (1, 0)], TEETH, segs=4), hp, noisy=False)
    elif kind == 'stitch':   # mouth sewn shut
        a = Vector(F(fc, R, -.09 * w, v, -.006)); b = Vector(F(fc, R, .09 * w, v, -.006))
        attach(tube('HSeam', [tuple(a), tuple((a + b) / 2 + Vector((0, -.004, -.004))), tuple(b)], .0035, THREAD), hp, noisy=False)
        for k in range(7):
            u = -.08 * w + k * .16 * w / 6; c = Vector(F(fc, R, u, v, -.008))
            attach(limb('HStitch%d' % k, tuple(c + Vector((0, 0, .025))), tuple(c + Vector((0, 0, -.025))), [(0, .0028), (1, .0028)], THREAD, segs=4), hp, noisy=False)
def cracks(hp, fc, R, n=4, col=(.02, .015, .015), glow=None, seed=3):
    rnd = random.Random(seed)
    m = mat('HCrackGlow', glow, .3, 0, emit=glow, es=3, vcol=False) if glow else mat('HCrack', col, .9, vcol=False)
    for k in range(n):
        u, v = rnd.uniform(-.12, .12), rnd.uniform(.35, .9); pts = []
        for j in range(5):
            pts.append(F(fc, R, u, v, -.001)); u += rnd.uniform(-.03, .03); v -= rnd.uniform(.03, .07)
        attach(tube('HCrack%d' % k, pts, R[0] * .022, m), hp, noisy=False)
def claws(names, col=(.05, .04, .04), length=.11, glowtip=None):
    CL = mat('HClaw', col, .35, vcol=False)
    TIP = mat('HClawTip', glowtip, .3, 0, emit=glowtip, es=3, vcol=False) if glowtip else None
    for nm in names:
        h = obj(nm)
        if not h: continue
        mn, mx = bbox(h); c = (mn + mx) / 2; piv = h.parent
        d = (c - piv.matrix_world.translation); d.z = min(d.z, -.05); d = d.normalized() if d.length > 1e-4 else Vector((0, 0, -1))
        d = (d + Vector((0, -.25, -.35))).normalized()
        side = Vector((1, 0, 0)) if abs(d.x) < .7 else Vector((0, 1, 0))
        for k in range(4):
            off = side * ((k - 1.5) * .018) + Vector((0, -.012, 0))
            b = c + d * .02 + off; t = b + d * length + Vector((0, -.03, 0)) + off * .5
            attach(limb('HClaw%s%d' % (nm, k), tuple(b), tuple(t), [(0, .009), (.6, .006), (1, 0)], CL, segs=6), piv, noisy=False)
            if TIP: attach(ell('HClawTip%s%d' % (nm, k), tuple(t), .0045, .0045, .0045, TIP, segs=5, rings=3), piv, noisy=False)
def tatters(parent, z, rx, ry, n=16, length=(.12, .3), col=(.05, .045, .05), seed=11, front=True):
    rnd = random.Random(seed); m = mat('HRag_%02x%02x%02x' % tuple(int(c * 255) for c in col), col, .9)
    for k in range(n):
        a = k / n * 2 * math.pi + rnd.uniform(-.1, .1)
        if not front and math.sin(a) < -.3: continue
        L = rnd.uniform(*length)
        rg = box('HRag%d' % k, (rx * math.cos(a), ry * math.sin(a), z - L / 2), (rnd.uniform(.04, .08), .004, L), m, rot=(rnd.uniform(-.15, .15), rnd.uniform(-.2, .2), a + math.pi / 2))
        attach(rg, parent, amp=.5); holes(rg, freq=45, thresh=.6, dark=0.)
def drop_eyes(names=('Eye-1', 'Eye1', 'Glint-1', 'Glint1')):
    for nm in names:
        o = obj(nm)
        if o: bpy.data.objects.remove(o, do_unlink=True)
def skin(face_name, col):
    o = obj(face_name)
    if not o or not o.data.materials: return
    s = base_input(o.data.materials[0])
    if s: s.default_value = tuple(col) + (1,)

def surface(x, z, y0=-2.):
    """where a ray fired from the front (-y) at (x, z) first hits the model"""
    dg = bpy.context.evaluated_depsgraph_get()
    hit, loc, nrm, idx, ob, mw = bpy.context.scene.ray_cast(dg, Vector((x, y0, z)), Vector((0, 1, 0)))
    return (loc, nrm) if hit else (None, None)
def body_span():
    sh = obj('Pivot_ArmA').matrix_world.translation.z; hip = obj('Pivot_LegA').matrix_world.translation.z
    return hip, sh
def slashes(parent, n=3, seed=4, glow=(.6, .02, .02)):
    """deep wounds clawed across the chest and belly, wet and faintly glowing so they read in the dark"""
    rnd = random.Random(seed); hip, sh = body_span()
    WET = mat('HWound', (.25, .01, .01), .15, 0, emit=glow, es=1.2, vcol=False)
    for k in range(n):
        x, z = rnd.uniform(-.1, .1), rnd.uniform(hip + .12, sh - .12)
        p, nr = surface(x, z)
        if p is None: continue
        ang = rnd.uniform(.5, 1.0) * rnd.choice((-1, 1))
        for j in range(3):   # three parallel claw marks
            q = p + Vector((math.cos(ang + 1.57) * .03 * (j - 1), -.004, math.sin(ang + 1.57) * .03 * (j - 1)))
            w = box('HSlash%d_%d' % (k, j), tuple(q), (.17, .01, .012), WET, rot=(0, -ang, 0)); attach(w, parent, noisy=False)
def ribs(parent, col=(.7, .65, .55), seed=2):
    hip, sh = body_span(); BONE = mat('HBone', col, .5)
    for k in range(4):
        z = sh - .1 - k * .055
        for s in (-1, 1):
            pts = []
            for t in (.02, .06, .1, .14):
                p, _ = surface(s * t, z - t * .25)
                if p is not None: pts.append(tuple(p + Vector((0, -.012, 0))))
            if len(pts) >= 3: attach(tube('HRib%d_%d' % (k, s), pts, .008, BONE), parent, amp=.4)
    p, _ = surface(0, sh - .2)
    if p is not None: attach(limb('HSternum', tuple(p + Vector((0, -.01, .08))), tuple(p + Vector((0, -.01, -.1))), [(0, .012), (1, .009)], BONE, segs=6), parent, amp=.4)
def aura(parent, glow, n=14, seed=9, dark=(.01, .008, .015)):
    """a drift of black ectoplasm and a few sparks hanging around the body"""
    rnd = random.Random(seed); hip, sh = body_span()
    SM = mat('HSmoke', dark, 1., alpha=.3, vcol=False); SP = mat('HMote_%02x' % int(glow[0] * 255), glow, .3, 0, emit=glow, es=5, vcol=False)
    for k in range(n):
        a = rnd.uniform(0, 2 * math.pi); r = rnd.uniform(.28, .42); z = rnd.uniform(.05, .6); s = rnd.uniform(.025, .045)
        attach(ell('HSmoke%d' % k, (r * math.cos(a), r * math.sin(a), z), s, s, s * 4, SM, segs=8, rings=5), parent, noisy=False)   # thin wisps curling up from the floor
    for k in range(n // 2):
        a = rnd.uniform(0, 2 * math.pi); r = rnd.uniform(.25, .45)
        attach(ell('HMote%d' % k, (r * math.cos(a), r * math.sin(a), rnd.uniform(.3, sh + .3)), .008, .008, .008, SP, segs=5, rings=3), parent, noisy=False)
def horrify(c):
    random.seed(c.get('seed', 7))
    hp = obj('Pivot_Head'); root = next(o for o in bpy.data.objects if o.name.endswith('_Root'))
    if c.get('grade', True): grade(c.get('desat', .3), c.get('dark', .12), skip=c.get('keep_mats', ()))
    if c.get('face'):
        fo, fc, R = face_frame(c['face'])
        if c.get('skin'): skin(c['face'], c['skin'])
        if c.get('drop_eyes', True): drop_eyes(c.get('eye_names', ('Eye-1', 'Eye1', 'Glint-1', 'Glint1')))
        if c.get('eyes', True): hollow_eyes(hp, fc, R, c.get('eye', (1, .15, .05)), du=c.get('eye_du', .055), v=c.get('eye_v', .6), slant=c.get('slant', .35), size=c.get('eye_size', 1.), tears=c.get('tears'), drip=c.get('drip', 1.))
        if c.get('mouth'): mouth(hp, fc, R, c['mouth'], v=c.get('mouth_v', .3), w=c.get('mouth_w', 1.))
        if c.get('cracks'): cracks(hp, fc, R, n=c['cracks'], glow=c.get('crack_glow'))
    if c.get('glow_eyes'):   # eyes for faces hidden inside helmets, hoods and masks
        EYE = mat('HEyeHidden', c.get('eye', (1, .15, .05)), .2, 0, emit=c.get('eye', (1, .15, .05)), es=6, vcol=False)
        for k, p in enumerate(c['glow_eyes']): attach(ell('HGlowEye%d' % k, p, .016, .008, .011, EYE, segs=8, rings=5), hp, noisy=False)
    if c.get('claws', True): claws(c.get('hands', ('HandArmA', 'HandArmB')), c.get('claw_col', (.05, .04, .04)), c.get('claw_len', .11), c.get('claw_tip'))
    if c.get('tatters'): tatters(root, **c['tatters'])
    if c.get('slashes'): slashes(root, c['slashes'])
    if c.get('ribs'): ribs(root, c.get('bone', (.7, .65, .55)))
    if c.get('aura'): aura(root, c.get('eye', (1, .15, .05)), c['aura'] if isinstance(c['aura'], int) else 14)
    if c.get('tilt'): hp.rotation_euler.x += c['tilt']   # head hanging forward (the game only turns heads side to side)
    if c.get('grime', .35) or c.get('blood'): grime(c.get('grime', .35), c.get('blood', 0.), c.get('blood_col', (.5, .04, .03)), skip=(c.get('face'),))
    if c.get('extra'): exec(c['extra'], globals(), {'hp': hp, 'root': root, 'P': {n: obj('Pivot_' + n) for n in ('Head', 'ArmA', 'ArmB', 'LegA', 'LegB', 'Tail')}})
    bpy.context.view_layer.update()
