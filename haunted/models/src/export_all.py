# exec in Blender with ONLY = [scripts] or None: builds each character, applies its horror pass (horror_cfg.py),
# merges by material and exports the GLB into out/ and the game's models/ folder. Prints tris and height per model.
import io, contextlib, traceback, shutil
B = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(B + 'chars_list.py', encoding='utf-8').read())
MODELS = B + 'star-dash/haunted/models/'
res = []
for scr, glb, lv in CHARS:
    if ONLY and scr not in ONLY: continue
    try:
        g = {'__name__': 'char'}
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compile(open(B + scr, encoding='utf-8-sig').read(), B + scr, 'exec'), g)
            exec(compile(open(B + 'horror.py', encoding='utf-8').read(), B + 'horror.py', 'exec'), g)
            exec(open(B + 'horror_cfg.py', encoding='utf-8').read(), g)
            g['horrify'](g['HORROR'][scr])
            root = next(o for o in bpy.data.objects if o.name.endswith('_Root'))
            g['merge_by_material'](root.name); n = g['tris'](); g['export_glb'](root.name, B + 'out/' + glb)
        shutil.copy(B + 'out/' + glb, MODELS + glb)
        res.append('%-20s %6d tris' % (glb, n))
    except Exception:
        res.append('FAIL %s %s' % (scr, traceback.format_exc()[-300:]))
print('\n'.join(res))
