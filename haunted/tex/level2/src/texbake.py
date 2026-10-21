# Bake seamless 1024x1024 colour + tangent-space normal JPGs from node materials.
# exec in Blender, then call make(name) for any recipe in RECIPES.
import bpy, math, os
OUTDIR = 'C:/Users/Hunter/HollowManorBuild/star-dash/haunted/tex/level2/'
os.makedirs(OUTDIR, exist_ok=True)
SIZE = 1024
TAU = 2 * math.pi

def lin(c):   # sRGB 0..1 -> linear, so recipe colours can be picked like web colours
    return tuple(((x + .055) / 1.055) ** 2.4 if x > .04045 else x / 12.92 for x in c)

class G:
    def __init__(s, nt):
        s.nt = nt; s.x = 0
        tc = s.n('ShaderNodeTexCoord'); s.uvv = tc.outputs['UV']
        sep = s.n('ShaderNodeSeparateXYZ'); s.l(s.uvv, sep.inputs[0]); s.u = sep.outputs[0]; s.v = sep.outputs[1]
    def n(s, t, **kw):
        nd = s.nt.nodes.new(t); s.x += 1; nd.location = (s.x * 30 % 1500, -(s.x // 50) * 300)
        for k, v in kw.items(): setattr(nd, k, v)
        return nd
    def l(s, a, b): s.nt.links.new(a, b)
    def put(s, inp, x):
        if hasattr(x, 'is_output') or hasattr(x, 'links'): s.l(x, inp)
        elif isinstance(x, (tuple, list)): inp.default_value = tuple(x) + ((1.0,) if len(x) == 3 and len(inp.default_value) == 4 else ())
        else: inp.default_value = x
    # ---- scalar / vector maths ----
    def m(s, op, a, b=0.0, c=None, clamp=False):
        nd = s.n('ShaderNodeMath', operation=op, use_clamp=clamp)
        s.put(nd.inputs[0], a); s.put(nd.inputs[1], b)
        if c is not None: s.put(nd.inputs[2], c)
        return nd.outputs[0]
    def fract(s, a): return s.m('FRACT', a)
    def vec(s, x, y, z=0.0):
        nd = s.n('ShaderNodeCombineXYZ'); s.put(nd.inputs[0], x); s.put(nd.inputs[1], y); s.put(nd.inputs[2], z); return nd.outputs[0]
    def uvs(s, nx, ny=None):   # UV scaled by whole numbers -> stays seamless
        return s.vec(s.m('MULTIPLY', s.u, nx), s.m('MULTIPLY', s.v, ny if ny is not None else nx))
    def smooth(s, e0, e1, x):
        return s.m('SMOOTHSTEP', x, e0, e1) if False else s._sstep(e0, e1, x)
    def _sstep(s, e0, e1, x):
        nd = s.n('ShaderNodeMapRange', interpolation_type='SMOOTHSTEP', clamp=True)
        s.put(nd.inputs['Value'], x); nd.inputs['From Min'].default_value = e0; nd.inputs['From Max'].default_value = e1
        return nd.outputs['Result']
    # ---- seamless 4D noise: the UV square wrapped onto a torus ----
    def noise(s, scale=4.0, detail=4.0, rough=.55, seed=0.0, ax=1.0, ay=1.0, color=False, dist=0.0):
        r = 1.0 / TAU
        au = s.m('MULTIPLY', s.u, TAU); av = s.m('MULTIPLY', s.v, TAU)
        x = s.m('MULTIPLY', s.m('COSINE', au), r * ax); y = s.m('MULTIPLY', s.m('SINE', au), r * ax)
        z = s.m('MULTIPLY', s.m('COSINE', av), r * ay); w = s.m('ADD', s.m('MULTIPLY', s.m('SINE', av), r * ay), seed)
        nd = s.n('ShaderNodeTexNoise', noise_dimensions='4D')
        s.l(s.vec(x, y, z), nd.inputs['Vector']); s.put(nd.inputs['W'], w)
        nd.inputs['Scale'].default_value = scale; nd.inputs['Detail'].default_value = detail
        nd.inputs['Roughness'].default_value = rough
        if 'Distortion' in nd.inputs: nd.inputs['Distortion'].default_value = dist
        return nd.outputs['Color' if color else 'Fac']
    def white(s, vec, seed=0.0):   # per-cell random value (feed floor(uv*N))
        nd = s.n('ShaderNodeTexWhiteNoise', noise_dimensions='4D'); s.l(vec, nd.inputs['Vector']); nd.inputs['W'].default_value = seed
        return nd.outputs['Value']
    def floorv(s, v):
        nd = s.n('ShaderNodeVectorMath', operation='FLOOR'); s.l(v, nd.inputs[0]); return nd.outputs[0]
    # ---- colour ----
    def mix(s, fac, a, b, blend='MIX'):
        nd = s.n('ShaderNodeMix', data_type='RGBA', blend_type=blend, clamp_result=True)
        s.put(nd.inputs[0], fac); s.put(nd.inputs[6], a); s.put(nd.inputs[7], b); return nd.outputs[2]
    def hsv(s, col, h=.5, sat=1.0, val=1.0):
        nd = s.n('ShaderNodeHueSaturation'); s.put(nd.inputs['Color'], col); nd.inputs['Hue'].default_value = h
        nd.inputs['Saturation'].default_value = sat; nd.inputs['Value'].default_value = val; return nd.outputs[0]
    def gray(s, col):
        nd = s.n('ShaderNodeRGBToBW'); s.put(nd.inputs[0], col); return nd.outputs[0]
    def img(s, image, vec, noncolor=False):
        nd = s.n('ShaderNodeTexImage', interpolation='Cubic', extension='REPEAT'); nd.image = image
        if noncolor: image.colorspace_settings.name = 'Non-Color'
        s.l(vec, nd.inputs['Vector']); return nd.outputs['Color']
    # ---- normals ----
    def nmap(s, col, strength=1.0, base=None):
        nd = s.n('ShaderNodeNormalMap'); s.l(col, nd.inputs['Color']); nd.inputs['Strength'].default_value = strength
        return nd.outputs[0]
    def bump(s, height, strength=.5, dist=.02, normal=None):
        nd = s.n('ShaderNodeBump'); s.put(nd.inputs['Height'], height); nd.inputs['Strength'].default_value = strength
        nd.inputs['Distance'].default_value = dist
        if normal is not None: s.l(normal, nd.inputs['Normal'])
        return nd.outputs[0]

def ph(matname):
    """the diffuse and OpenGL-normal images Poly Haven imported for a material."""
    m = bpy.data.materials[matname]; out = {}
    for nd in m.node_tree.nodes:
        if nd.type == 'TEX_IMAGE' and nd.image:
            nm = nd.image.name.lower()
            if 'nor' in nm: out['nor'] = nd.image
            elif 'diff' in nm or 'col' in nm: out['diff'] = nd.image
            elif 'rough' in nm: out['rough'] = nd.image
    return out

def plane():
    ob = bpy.data.objects.get('BakePlane')
    if ob: return ob
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, -50))
    ob = bpy.context.active_object; ob.name = 'BakePlane'
    return ob

def make(name):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.device = 'CPU'
    sc.render.bake.margin = 0
    ob = plane()
    for o in bpy.context.view_layer.objects: o.select_set(False)
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    m = bpy.data.materials.get('Bake_' + name) or bpy.data.materials.new('Bake_' + name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    g = G(nt)
    color, normal = RECIPES[name](g)
    out = g.n('ShaderNodeOutputMaterial')
    emis = g.n('ShaderNodeEmission'); g.put(emis.inputs['Color'], color); emis.inputs['Strength'].default_value = 1
    bsdf = g.n('ShaderNodeBsdfPrincipled')
    if normal is not None: g.l(normal, bsdf.inputs['Normal'])
    ob.data.materials.clear(); ob.data.materials.append(m)
    res = []
    for kind, suffix, cs in (('EMIT', '', 'sRGB'), ('NORMAL', '_n', 'Non-Color')):
        iname = name + suffix
        im = bpy.data.images.get(iname)
        if im: bpy.data.images.remove(im)
        im = bpy.data.images.new(iname, SIZE, SIZE, alpha=False); im.colorspace_settings.name = cs
        tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = im
        for nd in nt.nodes: nd.select = False
        tn.select = True; nt.nodes.active = tn
        g.l((emis if kind == 'EMIT' else bsdf).outputs[0], out.inputs['Surface'])
        if kind == 'EMIT': bpy.ops.object.bake(type='EMIT')
        else: bpy.ops.object.bake(type='NORMAL', normal_space='TANGENT')
        im.filepath_raw = OUTDIR + iname + '.jpg'; im.file_format = 'JPEG'
        sc.render.image_settings.quality = 92
        im.save()
        nt.nodes.remove(tn)
        res.append(iname)
    return res

RECIPES = {}
def recipe(f): RECIPES[f.__name__] = f; return f
