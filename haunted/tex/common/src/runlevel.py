# exec in Blender with LEVEL set: bakes every recipe in levelN_tex.py into haunted/tex/levelN/ and writes a contact sheet.
import io, contextlib, numpy as np
_B = 'C:/Users/Hunter/HollowManorBuild/'
for _f in ('texbake.py', 'texlib.py'):
    exec(compile(open(_B + _f, encoding='utf-8-sig').read(), _B + _f, 'exec'))
_PH_USED = set(); _ph0 = ph
def ph(n): _PH_USED.add(n); return _ph0(n)   # record Poly Haven sources for the credits
exec(compile(open(_B + 'level%d_tex.py' % LEVEL, encoding='utf-8-sig').read(), 'level%d_tex.py' % LEVEL, 'exec'))
_AUTH = {'wood_peeling_paint_weathered': 'Dimitrios Savva, Rob Tuytel', 'dark_wooden_planks': 'Amal Kumar', 'wood_floor_worn': 'Dimitrios Savva',
         'old_wood_floor': 'Guillaume Monsergent', 'damaged_concrete_floor': 'Rob Tuytel', 'dirt_floor': 'eye-candy.xyz', 'brown_mud_02': 'Rob Tuytel',
         'weathered_planks': 'Dario Barresi, Dimitrios Savva', 'fabric_pattern_05': 'Rob Tuytel', 'mossy_cobblestone': 'Son Nguyen', 'sand_02': 'Charlotte Baglioni',
         'snow_02': 'Rob Tuytel', 'rock_tile_floor': 'Charlotte Baglioni', 'castle_wall_slates': 'Rob Tuytel', 'herringbone_parquet': 'Jenelle van Heerden, Sergej Majboroda',
         'rocks_ground_04': 'Rob Tuytel', 'sandstone_blocks_05': 'Rob Tuytel', 'grass_ground': 'Charlotte Baglioni', 'dark_rock_02': 'Amal Kumar',
         'brick_pavement_02': 'Charlotte Baglioni', 'marble_01': 'Rob Tuytel', 'rusty_metal': 'Rob Tuytel', 'metal_plate_02': 'Rob Tuytel',
         'metal_grate_rusty': 'Dimitrios Savva, Rob Tuytel', 'rock_face_03': 'Dario Barresi, Rico Cilliers', 'cobblestone_floor_04': 'Rob Tuytel', 'floor_tiles_02': 'Rob Tuytel'}
OUTDIR = 'C:/Users/Hunter/HollowManorBuild/star-dash/haunted/tex/level%d/' % LEVEL
os.makedirs(OUTDIR, exist_ok=True)
_errs = []
for _n in (ONLY if 'ONLY' in dir() and ONLY else list(RECIPES)):
    try:
        with contextlib.redirect_stdout(io.StringIO()): make(_n)
    except Exception as e: _errs.append((_n, repr(e)[:160]))
_names = list(RECIPES); _cols = 6; _cell = 256; _rows = (len(_names) + _cols - 1) // _cols
_S = np.zeros((_rows * _cell, _cols * _cell, 4), dtype=np.float32); _S[..., 3] = 1
for _i, _n in enumerate(_names):
    try:
        _im = bpy.data.images.load(OUTDIR + _n + '.jpg', check_existing=False)
        _a = np.array(_im.pixels[:], dtype=np.float32).reshape(1024, 1024, 4)[::8, ::8]; bpy.data.images.remove(_im)
        _r, _c = divmod(_i, _cols); _y = (_rows - 1 - _r) * _cell
        _S[_y:_y + _cell, _c * _cell:_c * _cell + _cell] = np.tile(_a, (2, 2, 1))
    except Exception as e: _errs.append((_n, 'sheet ' + repr(e)[:80]))
_im = bpy.data.images.new('sheet', _S.shape[1], _S.shape[0]); _im.pixels = _S.ravel()
_im.filepath_raw = _B + 'sheet_L%d.png' % LEVEL; _im.file_format = 'PNG'; _im.save(); bpy.data.images.remove(_im)
_U = globals().get('USES', {})
with open(OUTDIR + 'README.txt', 'w', encoding='utf-8') as _fh:
    _fh.write('Level %d texture pack. Each texture: name.jpg (colour, sRGB) + name_n.jpg (tangent-space normal, OpenGL/three.js), 1024x1024, seamless unless noted.\n' % LEVEL)
    _fh.write('Baked in Blender from src/level%d_tex.py (shared generators: src/texlib.py, framework: src/texbake.py).\n\nWhere each one goes:\n' % LEVEL)
    for _n in _names: _fh.write('  %-22s %s\n' % (_n, _U.get(_n, '')))
    if _PH_USED:
        _fh.write('\nRealistic bases from Poly Haven (CC0, https://polyhaven.com):\n')
        for _p in sorted(_PH_USED): _fh.write('  %s (%s)\n' % (_p, _AUTH.get(_p, 'Poly Haven')))
os.makedirs(OUTDIR + 'src', exist_ok=True)
import shutil
for _f in ('texbake.py', 'texlib.py', 'level%d_tex.py' % LEVEL): shutil.copy(_B + _f, OUTDIR + 'src/' + _f)
print('L%d baked %d' % (LEVEL, len(_names)), _names, 'errors:', _errs)
