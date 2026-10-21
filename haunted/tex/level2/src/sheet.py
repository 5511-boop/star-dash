# contact sheets: every texture tiled 2x2 (so seams show), colour and normal
import bpy, numpy as np
for _f in ('texbake.py', 'level2_recipes.py'):
    _p = 'C:/Users/Hunter/HollowManorBuild/' + _f
    exec(compile(open(_p, encoding='utf-8-sig').read(), _p, 'exec'))
names = list(RECIPES)
def _load(n):
    im = bpy.data.images.load(OUTDIR + n + '.jpg', check_existing=False)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4); bpy.data.images.remove(im); return a
def sheet(suffix, out, cols=6, cell=256):
    rows = (len(names) + cols - 1) // cols
    S = np.zeros((rows * cell, cols * cell, 4), dtype=np.float32); S[..., 3] = 1
    for i, n in enumerate(names):
        a = _load(n + suffix)[::8, ::8]
        t = np.tile(a, (2, 2, 1))
        r, c = divmod(i, cols); y = (rows - 1 - r) * cell
        S[y:y + cell, c * cell:c * cell + cell] = t
    im = bpy.data.images.new('sheet', S.shape[1], S.shape[0]); im.pixels = S.ravel()
    im.filepath_raw = out; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)
sheet('', 'C:/Users/Hunter/HollowManorBuild/sheet_col.png')
sheet('_n', 'C:/Users/Hunter/HollowManorBuild/sheet_nor.png')
print(names)
