# exec in Blender with ONLY = [script names] (or None for all) and OUT_PNG: builds each character, renders a front
# and three-quarter view with EEVEE into tmp/, then pastes everything into one contact sheet.
import os, io, contextlib, traceback, math
import bpy, numpy as np
B = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(B + 'chars_list.py', encoding='utf-8').read())
TMP = B + 'tmp_renders/'; os.makedirs(TMP, exist_ok=True)
W, H = 220, 330
def stage():
    sc = bpy.context.scene
    try: sc.render.engine = 'BLENDER_EEVEE_NEXT'
    except TypeError:
        try: sc.render.engine = 'BLENDER_EEVEE'
        except TypeError: pass
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, 100
    sc.render.film_transparent = False
    w = bpy.data.worlds.get('SheetWorld') or bpy.data.worlds.new('SheetWorld'); w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.035, .03, .05, 1); bg.inputs[1].default_value = 1
    sc.world = w
    for nm, loc, e, col in (('SKey', (2.5, -3.5, 3.2), 350, (1, .9, .8)), ('SRim', (-2.5, 2.5, 2.6), 220, (.6, .7, 1)), ('SFill', (-2, -3, 1), 90, (.8, .8, 1))):
        d = bpy.data.lights.new(nm, 'POINT'); d.energy = e; d.color = col
        o = bpy.data.objects.new(nm, d); bpy.context.collection.objects.link(o); o.location = loc
    cam = bpy.data.objects.new('SCam', bpy.data.cameras.new('SCam')); bpy.context.collection.objects.link(cam); sc.camera = cam
    cam.data.lens = 50
    return cam
def shoot(cam, ang, path, close=False):
    zs = [(o.matrix_world @ __import__('mathutils').Vector(c)).z for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box]
    top = max(zs) if zs else 1.8; mid = top / 2
    d = top * 1.55 + .5
    if close: d, mid = .95, top - .3
    cam.location = (math.sin(ang) * d, -math.cos(ang) * d, mid + (0 if close else .2))
    cam.rotation_euler = (math.radians(90) - math.atan2(.2, d) * 0, 0, ang)
    cam.rotation_euler = (math.pi / 2, 0, ang)
    bpy.context.scene.render.filepath = path
    with contextlib.redirect_stdout(io.StringIO()): bpy.ops.render.render(write_still=True)
done = []
for scr, glb, lv in CHARS:
    if ONLY and scr not in ONLY: continue
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            p = B + scr; g = {'__name__': 'char'}; exec(compile(open(p, encoding='utf-8-sig').read(), p, 'exec'), g)
            if globals().get('APPLY_HORROR'):
                exec(compile(open(B + 'horror.py', encoding='utf-8').read(), B + 'horror.py', 'exec'), g); exec(open(B + 'horror_cfg.py', encoding='utf-8').read(), g); g['horrify'](g['HORROR'][scr])
        cam = stage()
        shoot(cam, 0, TMP + '%s_0.png' % scr[:-3]); shoot(cam, math.radians(25), TMP + '%s_1.png' % scr[:-3], close=True)
        done.append(scr)
    except Exception:
        print('FAIL', scr, traceback.format_exc()[-400:])
# contact sheet: two views per character, 8 characters per row
names = [s for s in done]
cols = 8; rows = (len(names) + cols - 1) // cols
S = np.zeros((rows * H, cols * 2 * W, 4), dtype=np.float32); S[..., 3] = 1
for i, s in enumerate(names):
    r, c = divmod(i, cols)
    for k in range(2):
        im = bpy.data.images.load(TMP + '%s_%d.png' % (s[:-3], k), check_existing=False)
        a = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4); bpy.data.images.remove(im)
        y = (rows - 1 - r) * H; x = (c * 2 + k) * W
        S[y:y + H, x:x + W] = a
im = bpy.data.images.new('sheet', S.shape[1], S.shape[0]); im.pixels = S.ravel(); im.filepath_raw = OUT_PNG; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)
print('rendered', len(done), names)
