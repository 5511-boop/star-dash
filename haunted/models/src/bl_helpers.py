import bpy, bmesh, math
from mathutils import Vector, Quaternion, Matrix, noise

def reset():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for b in list(coll):
            if b.users == 0:
                coll.remove(b)

def mat(name, col, rough=.6, metal=0., emit=None, es=0., alpha=1., vcol=True):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    base = (col[0], col[1], col[2], 1)
    if vcol:
        a = nt.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
        mx.inputs[0].default_value = 1.0
        mx.inputs[6].default_value = base
        nt.links.new(a.outputs['Color'], mx.inputs[7])
        nt.links.new(mx.outputs[2], b.inputs['Base Color'])
    else:
        b.inputs['Base Color'].default_value = base
    if emit is not None:
        b.inputs['Emission Color'].default_value = (emit[0], emit[1], emit[2], 1)
        b.inputs['Emission Strength'].default_value = es
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
    return m

def _smoothstep(a, b, x):
    t = max(0, min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t)

def lathe(name, prof, m, segs=24, mod=None, sx=1.0, sy=1.0, arc=None, closed=False, flip=False,
          xf=None, subsurf=0, smooth=True, capb=False, capt=False, center=None, zmod=None):
    """prof: [(r,z[,cx,cy])]. mod(a,z)->radius mult. arc=(a0,a1) radians for an open sweep."""
    bm = bmesh.new()
    full = arc is None
    a0, a1 = (0, 2 * math.pi) if full else arc
    n = segs if full else segs + 1
    rings = []
    for p in prof:
        r, z = p[0], p[1]; cx = p[2] if len(p) > 2 else 0; cy = p[3] if len(p) > 3 else 0
        if r < 1e-6:
            v = bm.verts.new((cx, cy, z)); rings.append([v] * n); continue
        ring = []
        for i in range(n):
            a = a0 + (a1 - a0) * (i / segs)
            k = mod(a, z) if mod else 1.0
            ys = p[4] if len(p) > 4 else 1.0
            dz = zmod(a, z) if zmod else 0.0
            ring.append(bm.verts.new((cx + r * k * sx * math.cos(a), cy + r * k * sy * ys * math.sin(a), z + dz)))
        rings.append(ring)
    uvl = bm.loops.layers.uv.new('UVMap')
    nr = max(len(rings) - 1, 1)
    def link(r1, r2, v1, v2):
        for i in range(n if not full else segs):
            j = (i + 1) % n if full else i + 1
            if not full and i == n - 1: break
            vs = [r1[i], r1[j], r2[j], r2[i]]
            uvs = {r1[i]: (i / segs, v1), r1[j]: ((i + 1) / segs, v1), r2[j]: ((i + 1) / segs, v2), r2[i]: (i / segs, v2)}
            uniq = []
            for v in vs:
                if v not in uniq: uniq.append(v)
            if len(uniq) >= 3:
                try: f = bm.faces.new(uniq)
                except ValueError: continue
                for l in f.loops: l[uvl].uv = uvs[l.vert]
    for j in range(len(rings) - 1): link(rings[j], rings[j + 1], j / nr, (j + 1) / nr)
    if closed: link(rings[-1], rings[0], 1.0, 1.0)
    if full and capb and prof[0][0] > 1e-6:
        try: bm.faces.new(rings[0][::-1])
        except ValueError: pass
    if full and capt and prof[-1][0] > 1e-6:
        try: bm.faces.new(rings[-1])
        except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if flip: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    if xf is not None: bmesh.ops.transform(bm, matrix=xf, verts=bm.verts)
    if center is not None: bmesh.ops.translate(bm, vec=(center[0], center[1], 0), verts=bm.verts)
    return _mk(name, bm, m, smooth, subsurf)

def _mk(name, bm, m, smooth=True, subsurf=0):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    me.materials.append(m)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    if subsurf:
        md = ob.modifiers.new('sub', 'SUBSURF'); md.levels = subsurf; md.render_levels = subsurf
    return ob

def ell(name, c, rx, ry, rz, m, segs=18, rings=10, xf=None, subsurf=0):
    prof = [(math.sin(t), -math.cos(t) * rz / max(rx, 1e-6)) for t in [math.pi * k / rings for k in range(rings + 1)]]
    prof = [(max(r, 0), z) for r, z in prof]
    o = lathe(name, prof, m, segs=segs, sx=1.0, sy=ry / rx, xf=None)
    # scale: lathe r=sin*1 => x radius 1*rx
    o.scale = (rx, rx, rx)
    o.location = c
    bpy.context.view_layer.update()
    return o

def box(name, c, size, m, rot=(0, 0, 0), bevel=0.0, smooth=False):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=2, affect='EDGES')
    ob = _mk(name, bm, m, smooth)
    ob.location = c; ob.rotation_euler = rot
    return ob

def between(p0, p1):
    p0 = Vector(p0); p1 = Vector(p1)
    q = (p1 - p0).to_track_quat('Z', 'Y')
    return Matrix.Translation(p0) @ q.to_matrix().to_4x4(), (p1 - p0).length

def limb(name, p0, p1, radii, m, segs=12, caps=True, subsurf=0, sy=1.0):
    """tapered lathe from p0 to p1; radii = list of (t in 0..1, r)"""
    xf, L = between(p0, p1)
    prof = [(r, t * L) for t, r in radii]
    return lathe(name, prof, m, segs=segs, sy=sy, xf=xf, capb=caps, capt=caps, subsurf=subsurf)

def torus(name, c, R, r, m, rot=(0, 0, 0), segs=16, minor=6, scale=(1, 1, 1)):
    bm = bmesh.new()
    vs = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        row = []
        for j in range(minor):
            b = 2 * math.pi * j / minor
            rr = R + r * math.cos(b)
            row.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), r * math.sin(b))))
        vs.append(row)
    for i in range(segs):
        for j in range(minor):
            bm.faces.new((vs[i][j], vs[(i + 1) % segs][j], vs[(i + 1) % segs][(j + 1) % minor], vs[i][(j + 1) % minor]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = _mk(name, bm, m, True)
    ob.location = c; ob.rotation_euler = rot; ob.scale = scale
    return ob

def tube(name, pts, rad, m, res=4, closed=False, radfn=None):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts):
        bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    sp.use_cyclic_u = closed
    cu.bevel_depth = rad; cu.bevel_resolution = 1; cu.use_fill_caps = True; cu.resolution_u = 1 if len(pts) > 12 else 2
    ob = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob, do_unlink=True); bpy.data.curves.remove(cu)
    o2 = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o2)
    me.materials.append(m)
    for p in me.polygons: p.use_smooth = True
    return o2

def empty(name, loc, parent=None):
    e = bpy.data.objects.new(name, None); e.empty_display_type = 'PLAIN_AXES'; e.empty_display_size = .05
    bpy.context.collection.objects.link(e); e.location = loc
    if parent:
        bpy.context.view_layer.update()
        e.parent = parent
        e.matrix_parent_inverse = parent.matrix_world.inverted()   # keep loc in world space
    bpy.context.view_layer.update()
    return e

def vcol(ob, amp=.22, freq=9.0, seed=0, grad=None, tint=None):
    """bake wear/cavity variation into vertex colours. grad=(z0,z1,dark) darkens toward z0."""
    me = ob.data
    if 'Col' in me.color_attributes: me.color_attributes.remove(me.color_attributes['Col'])
    ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    mw = ob.matrix_world
    for li, lp in enumerate(me.loops):
        co = mw @ me.vertices[lp.vertex_index].co
        n = noise.noise(co * freq + Vector((seed, seed * 1.7, seed * .3))) * .5 + .5
        n2 = noise.noise(co * freq * 3.1 + Vector((seed, 4, 2))) * .5 + .5
        v = 1.0 - amp * (n * .7 + n2 * .3)
        if grad:
            z0, z1, dk = grad
            v *= 1.0 - dk * (1 - _smoothstep(z0, z1, co.z))
        c = (v, v, v, 1)
        if tint: c = (v * tint[0], v * tint[1], v * tint[2], 1)
        ca.data[li].color = c

def attach(ob, parent, amp=.2, freq=9.0, seed=0, grad=None, tint=None, noisy=True):
    bpy.context.view_layer.update()
    ob.parent = parent
    ob.matrix_parent_inverse = parent.matrix_world.inverted()
    bpy.context.view_layer.update()
    vcol(ob, amp if noisy else 0, freq, seed, grad, tint)
    return ob

def tris():
    dg = bpy.context.evaluated_depsgraph_get(); n = 0
    for ob in bpy.data.objects:
        if ob.type == 'MESH':
            me = ob.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); n += len(me.loop_triangles)
            ob.evaluated_get(dg).to_mesh_clear()
    return n

def lighting():
    for nm, loc, e, col in (('KeyL', (3, -4, 5), 600, (1, .85, .7)), ('RimL', (-4, 3, 3), 300, (.6, .75, 1))):
        d = bpy.data.lights.new(nm, 'POINT'); d.energy = e; d.color = col
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o); o.location = loc

def export_glb(root_name, path):
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    root = bpy.data.objects[root_name]
    def walk(o):
        o.select_set(True)
        for c in o.children: walk(c)
    walk(root)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
        export_yup=True, export_cameras=False, export_lights=False, export_animations=False,
        export_vertex_color='MATERIAL', export_all_vertex_colors=False, export_image_format='AUTO')

def merge_by_material(root_name):
    root = bpy.data.objects[root_name]
    groups = {}
    def walk(o):
        for c in list(o.children):
            if c.type == 'MESH' and c.data.materials:
                groups.setdefault((o.name, c.data.materials[0].name), []).append(c)
            walk(c)
    walk(root)
    for (pn, mn), objs in groups.items():
        if len(objs) < 2: continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
        objs[0].name = '%s_%s' % (pn.replace('Pivot_', ''), mn)
    bpy.context.view_layer.update()

def make_image(name, w, h, fn):
    """fn(u, v) -> (r, g, b) in sRGB 0..1; packed so the glTF exporter embeds it."""
    img = bpy.data.images.get(name)
    if img: bpy.data.images.remove(img)
    img = bpy.data.images.new(name, w, h, alpha=False)
    px = [0.0] * (w * h * 4)
    for y in range(h):
        for x in range(w):
            r, g, b = fn((x + .5) / w, (y + .5) / h)
            k = (y * w + x) * 4
            px[k] = r; px[k + 1] = g; px[k + 2] = b; px[k + 3] = 1.0
    img.pixels = px
    img.pack()
    return img

def mat_tex(name, img, rough=.6, metal=0., emit=None, es=0.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(b.outputs['BSDF'], out.inputs['Surface'])
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
    nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit is not None:
        b.inputs['Emission Color'].default_value = (emit[0], emit[1], emit[2], 1)
        b.inputs['Emission Strength'].default_value = es
    return m

def holes(ob, freq=18.0, thresh=.62, seed=3, dark=.08):
    """moth-eaten look: darken vertex colours where noise is high (call after attach)."""
    me = ob.data; ca = me.color_attributes['Col']; mw = ob.matrix_world
    for li, lp in enumerate(me.loops):
        co = mw @ me.vertices[lp.vertex_index].co
        n = noise.noise(co * freq + Vector((seed, 2, 5))) * .5 + .5
        if n > thresh:
            c = ca.data[li].color; ca.data[li].color = (c[0] * dark, c[1] * dark, c[2] * dark, 1)

def spin(name, loc, rot, parent):
    """an empty whose local Z is the spin axis; the game rotates any node named Spin_* (glTF local Y)."""
    e = empty('Spin_' + name, loc, parent)
    e.rotation_euler = rot
    bpy.context.view_layer.update()
    return e
