# exec in Blender with JOBS = [(script, root, glb), ...]; prints tris / height per model
import io, contextlib
exec(open('C:/Users/Hunter/HollowManorBuild/bl_helpers.py', encoding='utf-8-sig').read())
_OUT = 'C:/Users/Hunter/HollowManorBuild/out/'
_res = []
for _scr, _rn, _fn in JOBS:
    _p = 'C:/Users/Hunter/HollowManorBuild/' + _scr
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(open(_p, encoding='utf-8-sig').read(), _p, 'exec'))
        merge_by_material(_rn); _n = tris(); export_glb(_rn, _OUT + _fn)
    _zs = [(o.matrix_world @ Vector(c)).z for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box]
    _res.append((_fn, _n, round(min(_zs), 2), round(max(_zs), 2)))
for _r in _res: print(_r)
