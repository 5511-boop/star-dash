# Generic seamless surface generators (exec after texbake.py). Each returns (colour_socket, normal_socket).
# Everything repeats a whole number of times across the square or uses 4D torus noise, so bakes tile.

def grime(g, col, amount=.45, scale=3.0, seed=0.0, tint=(.32, .26, .2)):
    n = g.noise(scale, 5, .6, seed)
    big = g._sstep(.42, .72, n)
    fine = g.noise(scale * 9, 3, .5, seed + 3.3)
    soot = g.mix(big, col, g.mix(.5, col, lin(tint), 'MULTIPLY'))
    dirt = g.m('MULTIPLY', g._sstep(.3, .8, fine), amount * .5)
    return g.mix(g.m('ADD', g.m('MULTIPLY', big, amount), dirt, clamp=True), col, soot)

def faded(g, col, sat=.7, val=.85): return g.hsv(col, .5, sat, val)

def weave(g, n=6, strength=.55):
    P = ph('fabric_pattern_05')
    return g.nmap(g.img(P['nor'], g.uvs(n), True), strength)

def tint(g, col, t, amt=1.0): return g.mix(amt, col, lin(t), 'MULTIPLY')

def ph_tex(g, name, N=1, tnt=None, sat=1.0, val=1.0, dirt=.3, seed=0, nstr=2.2, swap=False):
    """a Poly Haven surface, tinted/desaturated for the level's mood."""
    P = ph(name)
    uv = g.uvs(N) if not swap else g.vec(g.m('MULTIPLY', g.v, N), g.m('MULTIPLY', g.u, N))   # swap = boards run the other way
    col = g.img(P['diff'], uv)
    if tnt: col = tint(g, col, tnt)
    col = g.hsv(col, .5, sat, val)
    if dirt: col = grime(g, col, dirt, 3, seed)
    return col, g.nmap(g.img(P['nor'], uv, True), nstr)

def ridge(g, scale, width, seed, detail=5, dist=0.0, ax=1.0, ay=1.0):
    """thin wandering lines (cracks, veins) from the zero-crossings of noise."""
    n = g.noise(scale, detail, .6, seed, ax=ax, ay=ay, dist=dist)
    return g.m('SUBTRACT', 1, g._sstep(width * .3, width, g.m('ABSOLUTE', g.m('SUBTRACT', n, .5))))

def cells(g, N, M=None):
    M = M or N
    fu, fv = g.fract(g.m('MULTIPLY', g.u, N)), g.fract(g.m('MULTIPLY', g.v, M))
    edge = g.m('MINIMUM', g.m('MINIMUM', fu, g.m('SUBTRACT', 1, fu)), g.m('MINIMUM', fv, g.m('SUBTRACT', 1, fv)))
    return fu, fv, edge, g.floorv(g.uvs(N, M))

def tiles(g, N, a, b=None, mode='checker', grout=(.08, .07, .07), gw=.035, crack=.5, seed=0, dirt=.45, jit=.3):
    fu, fv, edge, cell = cells(g, N)
    sep = g.n('ShaderNodeSeparateXYZ'); g.l(cell, sep.inputs[0])
    if mode == 'checker':
        k = g.m('MODULO', g.m('ADD', sep.outputs[0], sep.outputs[1]), 2); base = g.mix(k, lin(a), lin(b))
    elif mode == 'random':
        base = g.mix(g._sstep(.45, .55, g.white(cell, seed + 2)), lin(a), lin(b or a))
    else: base = lin(a)
    base = g.mix(g.m('MULTIPLY', g.white(cell, seed + 1.3), jit), base, lin((.15, .12, .12)), 'MULTIPLY')
    gr = g._sstep(gw * .6, gw, edge)
    col = g.mix(gr, lin(grout), base)
    cr = ridge(g, 5, .012, seed + 9) if crack else None
    if cr: col = g.mix(g.m('MULTIPLY', cr, crack), col, lin((.04, .035, .035)))
    col = grime(g, col, dirt, 3, seed + 6)
    h = g.m('SUBTRACT', gr, g.m('MULTIPLY', cr, .5)) if cr else gr
    return col, g.bump(h, .6, .02, g.bump(g.noise(60, 2, .5, seed + 8), .08, .005))

def marble(g, base, vein, N=0, seed=0, grout=(.1, .09, .09), dirt=.25, polish=True, second=None):
    v1 = ridge(g, 2.5, .03, seed, 6, dist=1.5)
    v2 = ridge(g, 6, .012, seed + 5, 4, dist=1.0)
    cloud = g.noise(3, 5, .6, seed + 2)
    col = g.mix(g.m('MULTIPLY', cloud, .25), lin(base), lin(second or base), 'MULTIPLY' if not second else 'MIX')
    col = g.mix(g.m('MAXIMUM', v1, g.m('MULTIPLY', v2, .6)), col, lin(vein))
    h = g.m('MULTIPLY', v1, .1)
    if N:
        fu, fv, edge, cell = cells(g, N)
        gr = g._sstep(.008, .016, edge)
        col = g.mix(g.m('MULTIPLY', g.white(cell, seed + 4), .15), col, lin((.6, .6, .6)), 'MULTIPLY')
        col = g.mix(gr, lin(grout), col); h = gr
    col = grime(g, col, dirt, 3, seed + 7)
    return col, g.bump(h, .4, .02)

def metal(g, base, N=2, rivets=True, seed=0, rust=.4, scratch=.3, dark=None):
    fu, fv, edge, cell = cells(g, N)
    seam = g._sstep(.006, .014, edge)
    col = g.mix(g.m('MULTIPLY', g.white(cell, seed), .25), lin(base), lin(dark or (.4, .4, .42)), 'MULTIPLY')
    sc = ridge(g, 30, .02, seed + 3, 2, ax=6, ay=.4)
    col = g.mix(g.m('MULTIPLY', sc, scratch), col, g.hsv(col, .5, .6, 1.8))
    if rust:
        rs = g._sstep(.58, .72, g.noise(4, 6, .7, seed + 4))
        col = g.mix(g.m('MULTIPLY', rs, rust), col, lin((.32, .14, .06)))
    col = g.mix(seam, lin((.04, .04, .045)), col)
    h = seam
    if rivets:
        ru = g.m('SUBTRACT', g.fract(g.m('MULTIPLY', g.u, N * 6)), .5); rv = g.m('SUBTRACT', g.fract(g.m('MULTIPLY', g.v, N * 6)), .5)
        near = g.m('SUBTRACT', 1, g._sstep(.06, .09, edge))
        dot = g.m('MULTIPLY', g.m('SUBTRACT', 1, g._sstep(.15, .25, g.m('SQRT', g.m('ADD', g.m('MULTIPLY', ru, ru), g.m('MULTIPLY', rv, rv))))), near)
        col = g.mix(g.m('MULTIPLY', dot, .5), col, g.hsv(col, .5, .8, 1.5))
        h = g.m('ADD', g.m('MULTIPLY', seam, 1), g.m('MULTIPLY', dot, -.6))
    col = grime(g, col, .35, 3, seed + 5)
    return col, g.bump(g.m('SUBTRACT', 1, h), .6, .02, g.bump(sc, .05, .002))

def brass(g, base=(.55, .42, .2), seed=0, tarnish=(.25, .3, .22), polish=.5):
    n = g.noise(6, 6, .65, seed)
    col = g.mix(g._sstep(.3, .7, n), lin(tuple(c * .45 for c in base)), lin(base))
    verd = g._sstep(.62, .76, g.noise(4, 4, .6, seed + 1))
    col = g.mix(g.m('MULTIPLY', verd, .55), col, lin(tarnish))
    return col, g.bump(g.noise(20, 4, .6, seed + 2), .2, .01)

def stars(g, bg=(.03, .04, .12), star=(.95, .9, .75), seed=0, lines=True, nebula=(.18, .1, .3)):
    neb = g._sstep(.45, .8, g.noise(2.5, 6, .65, seed))
    col = g.mix(g.m('MULTIPLY', neb, .6), lin(bg), lin(nebula))
    for k, (sc, th) in enumerate(((90, .78), (45, .8), (20, .83))):
        s = g._sstep(th, th + .03, g.noise(sc, 1, .5, seed + 3 + k))
        col = g.mix(s, col, lin(star))
    if lines:
        ln = ridge(g, 3, .004, seed + 9, 1)
        col = g.mix(g.m('MULTIPLY', ln, .35), col, lin((.6, .55, .4)))
    col = grime(g, col, .2, 3, seed + 11)
    return col, g.bump(g.noise(40, 2, .5, seed + 12), .05, .005)

def blocks(g, rows, cols, col_a, mortar=(.12, .1, .09), seed=0, jit=.25, dirt=.45, mw=.03):
    """running-bond stone blocks."""
    rowi = g.m('FLOOR', g.m('MULTIPLY', g.v, rows))
    off = g.m('MULTIPLY', g.m('MODULO', rowi, 2), .5)
    uu = g.m('ADD', g.m('MULTIPLY', g.u, cols), off)
    fu, fv = g.fract(uu), g.fract(g.m('MULTIPLY', g.v, rows))
    edge = g.m('MINIMUM', g.m('MULTIPLY', g.m('MINIMUM', fu, g.m('SUBTRACT', 1, fu)), 1.0 * rows / cols), g.m('MINIMUM', fv, g.m('SUBTRACT', 1, fv)))
    cell = g.vec(g.m('MODULO', g.m('FLOOR', uu), cols), rowi)
    base = g.mix(g.m('MULTIPLY', g.white(cell, seed), jit), lin(col_a), lin((.2, .16, .12)), 'MULTIPLY')
    stone = g.noise(8, 5, .6, seed + 1)
    base = g.mix(g.m('MULTIPLY', stone, .3), base, lin((.4, .35, .3)), 'MULTIPLY')
    gr = g._sstep(mw * .5, mw, edge)
    col = g.mix(gr, lin(mortar), base)
    col = grime(g, col, dirt, 3, seed + 2)
    return col, g.bump(g.m('ADD', gr, g.m('MULTIPLY', stone, .2)), .7, .03)

def damask(g, base, ink, N=4, seed=0, dirt=.35, peel=0.0):
    """wallpaper: a repeating medallion of petals and rings on a faint stripe."""
    fu = g.fract(g.m('MULTIPLY', g.u, N)); rowi = g.m('FLOOR', g.m('MULTIPLY', g.v, N))
    fu = g.fract(g.m('ADD', fu, g.m('MULTIPLY', g.m('MODULO', rowi, 2), .5)))
    fv = g.fract(g.m('MULTIPLY', g.v, N))
    du, dv = g.m('SUBTRACT', fu, .5), g.m('MULTIPLY', g.m('SUBTRACT', fv, .5), .8)
    rad = g.m('SQRT', g.m('ADD', g.m('MULTIPLY', du, du), g.m('MULTIPLY', dv, dv)))
    ang = g.m('ARCTAN2', dv, du)
    petal = g.m('SUBTRACT', 1, g._sstep(0, .02, g.m('SUBTRACT', rad, g.m('ADD', .16, g.m('MULTIPLY', g.m('COSINE', g.m('MULTIPLY', ang, 6)), .12)))))
    hole = g.m('SUBTRACT', 1, g._sstep(0, .015, g.m('SUBTRACT', rad, .06)))
    ring = g.m('SUBTRACT', 1, g._sstep(.008, .016, g.m('ABSOLUTE', g.m('SUBTRACT', rad, .4))))
    curl = g.m('SUBTRACT', 1, g._sstep(.01, .02, g.m('ABSOLUTE', g.m('SUBTRACT', g.m('ABSOLUTE', g.m('SINE', g.m('MULTIPLY', ang, 3))), g.m('MULTIPLY', rad, 2.2)))))
    curl = g.m('MULTIPLY', curl, g._sstep(.22, .26, rad))
    motif = g.m('MAXIMUM', g.m('MAXIMUM', g.m('SUBTRACT', petal, hole), ring), g.m('MULTIPLY', curl, g.m('SUBTRACT', 1, g._sstep(.36, .4, rad))))
    col = g.mix(motif, lin(base), lin(ink))
    if peel:
        p = g._sstep(.66, .7, g.noise(3, 5, .65, seed + 3))
        col = g.mix(g.m('MULTIPLY', p, peel), col, lin((.38, .33, .26)))
    stain = g._sstep(.52, .72, g.noise(2, 6, .65, seed + 4, ay=1.6))
    col = g.mix(g.m('MULTIPLY', stain, .5), col, lin((.4, .3, .2)), 'MULTIPLY')
    col = grime(g, faded(g, col, .8, .9), dirt, 3, seed + 5)
    return col, g.bump(motif, .12, .01, weave(g, 8, .25))

def velvet(g, base, dark, seed=0, pattern=None, N=4):
    nap = g.noise(14, 4, .6, seed, dist=1)
    col = g.mix(g._sstep(.3, .7, nap), lin(dark), lin(base))
    if pattern:
        fu, fv, edge, cell = cells(g, N)
        du, dv = g.m('SUBTRACT', fu, .5), g.m('SUBTRACT', fv, .5)
        manh = g.m('ADD', g.m('ABSOLUTE', du), g.m('ABSOLUTE', dv))
        lozenge = g.m('SUBTRACT', 1, g._sstep(.008, .02, g.m('ABSOLUTE', g.m('SUBTRACT', manh, .3))))
        dot = g.m('SUBTRACT', 1, g._sstep(.05, .07, manh))
        bd = g.m('SUBTRACT', 1, g._sstep(.006, .014, edge))
        col = g.mix(g.m('MULTIPLY', g.m('MAXIMUM', g.m('MAXIMUM', lozenge, dot), bd), .8), col, lin(pattern))
    worn = g._sstep(.6, .78, g.noise(3, 5, .6, seed + 1))
    col = g.mix(g.m('MULTIPLY', worn, .45), col, lin((.3, .25, .22)))
    col = grime(g, col, .3, 3, seed + 2)
    return col, g.bump(nap, .15, .01, weave(g, 10, .3))

def ice(g, deep=(.05, .12, .2), pale=(.55, .7, .8), seed=0):
    d = g.noise(2, 5, .6, seed)
    col = g.mix(g._sstep(.3, .75, d), lin(deep), lin(pale))
    cr = g.m('MAXIMUM', ridge(g, 3, .01, seed + 1, 3), g.m('MULTIPLY', ridge(g, 8, .006, seed + 2, 2), .6))
    col = g.mix(cr, col, lin((.85, .92, 1)))
    bub = g._sstep(.74, .76, g.noise(40, 1, .5, seed + 3))
    col = g.mix(g.m('MULTIPLY', bub, .6), col, lin((.75, .85, .95)))
    frost = g._sstep(.6, .8, g.noise(5, 6, .7, seed + 4))
    col = g.mix(g.m('MULTIPLY', frost, .5), col, lin((.8, .85, .9)))
    return col, g.bump(g.m('ADD', g.m('MULTIPLY', cr, -1), g.m('MULTIPLY', frost, .3)), .4, .01)

def clouds(g, a=(.35, .3, .55), b=(.75, .68, .85), seed=0, swirl=2.0):
    n = g.noise(3, 7, .7, seed, dist=swirl)
    col = g.mix(g._sstep(.35, .7, n), lin(a), lin(b))
    glow = g._sstep(.62, .8, g.noise(6, 4, .6, seed + 1))
    col = g.mix(g.m('MULTIPLY', glow, .4), col, lin((.95, .9, 1)))
    return col, g.bump(n, .35, .03)

def flesh(g, base=(.35, .06, .08), vein=(.12, .0, .04), seed=0):
    n = g.noise(4, 6, .65, seed, dist=1.5)
    col = g.mix(g._sstep(.3, .7, n), lin(tuple(c * .5 for c in base)), lin(base))
    v = g.m('MAXIMUM', ridge(g, 3, .02, seed + 1, 4, dist=2), g.m('MULTIPLY', ridge(g, 8, .01, seed + 2, 3, dist=1.5), .7))
    col = g.mix(v, col, lin(vein))
    wet = g._sstep(.6, .75, g.noise(10, 3, .5, seed + 3))
    col = g.mix(g.m('MULTIPLY', wet, .3), col, lin((.6, .25, .25)))
    return col, g.bump(g.m('ADD', n, g.m('MULTIPLY', v, .5)), .6, .03)

def lava_rock(g, rock='dark_rock_02', N=1, glow=(1, .35, .05), seed=0, width=.02, tnt=(.6, .55, .55)):
    col, nrm = ph_tex(g, rock, N, tnt, .5, .7, .2, seed)
    cr = g.m('MAXIMUM', ridge(g, 3, width, seed + 1, 4, dist=1), g.m('MULTIPLY', ridge(g, 7, width * .5, seed + 2, 3), .7))
    hot = g.mix(g._sstep(.3, 1, cr), lin((.4, .06, .01)), lin(glow))
    col = g.mix(cr, col, hot)
    return col, g.bump(g.m('MULTIPLY', cr, -1), .4, .02, nrm)

def planks_painted(g, base, N=2, seed=0, src='wood_peeling_paint_weathered', gain=2.1, sat=1.2):
    P = ph(src)
    d = g.img(P['diff'], g.uvs(N))
    col = g.hsv(g.mix(1, d, lin(base), 'MULTIPLY'), .5, sat, gain)
    return grime(g, col, .35, 3, seed), g.nmap(g.img(P['nor'], g.uvs(N), True), 2.0)

def cloth_stripes(g, cols, n=None, seed=0, axis='u', soft=.02):
    n = n or len(cols)
    x = g.m('MULTIPLY', g.u if axis == 'u' else g.v, n)
    k = g.m('MODULO', g.m('FLOOR', x), len(cols))
    col = lin(cols[0])
    for i, c in enumerate(cols[1:], 1):
        col = g.mix(g.m('COMPARE', k, i, .5), col, lin(c))
    col = grime(g, faded(g, col, .75, .85), .4, 3, seed)
    return col, weave(g, 8, .6)

def leaves(g, dark=(.04, .1, .03), light=(.15, .3, .08), seed=0):
    n1 = g.noise(45, 3, .5, seed); n2 = g.noise(45, 3, .5, seed + 7)
    l1 = g._sstep(.5, .56, n1); l2 = g._sstep(.52, .58, n2)
    col = g.mix(l1, lin(tuple(c * .4 for c in dark)), lin(dark))
    col = g.mix(l2, col, lin(light))
    berries = g._sstep(.8, .82, g.noise(30, 1, .5, seed + 3))
    col = g.mix(g.m('MULTIPLY', berries, .7), col, lin((.3, .05, .1)))
    return grime(g, col, .2, 3, seed + 1), g.bump(g.m('ADD', l1, l2), .8, .03)

def glyphs(g, base_col, rows=6, cols=8, seed=0, paint=None):
    """carved symbols in rows (abstract hieroglyph shapes from random strokes)."""
    fu, fv, edge, cell = cells(g, cols, rows)
    r1, r2, r3 = g.white(cell, seed + 1), g.white(cell, seed + 2), g.white(cell, seed + 3)
    du, dv = g.m('SUBTRACT', fu, .5), g.m('SUBTRACT', fv, .5)
    circ = g.m('MULTIPLY', g._sstep(.5, .55, r1), g.m('SUBTRACT', 1, g._sstep(.03, .06, g.m('ABSOLUTE', g.m('SUBTRACT', g.m('SQRT', g.m('ADD', g.m('MULTIPLY', du, du), g.m('MULTIPLY', dv, dv))), .22)))))
    bar = g.m('MULTIPLY', g._sstep(.4, .45, r2), g.m('SUBTRACT', 1, g._sstep(.04, .07, g.m('ABSOLUTE', du))))
    bar = g.m('MULTIPLY', bar, g.m('SUBTRACT', 1, g._sstep(.3, .33, g.m('ABSOLUTE', dv))))
    hz = g.m('MULTIPLY', g._sstep(.6, .65, r3), g.m('SUBTRACT', 1, g._sstep(.04, .07, g.m('ABSOLUTE', g.m('ADD', dv, .15)))))
    hz = g.m('MULTIPLY', hz, g.m('SUBTRACT', 1, g._sstep(.25, .28, g.m('ABSOLUTE', du))))
    sym = g.m('MINIMUM', g.m('MAXIMUM', g.m('MAXIMUM', circ, bar), hz), 1)
    line = g.m('SUBTRACT', 1, g._sstep(.02, .035, g.m('MINIMUM', fv, g.m('SUBTRACT', 1, fv))))
    col = base_col
    col = g.mix(g.m('MULTIPLY', sym, .6), col, g.hsv(col, .5, 1, .5))
    if paint: col = g.mix(g.m('MULTIPLY', sym, .35), col, lin(paint))
    col = g.mix(g.m('MULTIPLY', line, .5), col, g.hsv(col, .5, 1, .6))
    return col, g.bump(g.m('MULTIPLY', g.m('MAXIMUM', sym, line), -1), .6, .02)

def books(g, seed=0):
    """shelves of book spines: rows of varied leather colours, gilt bands, dark shelf lines."""
    rows = 4
    rowi = g.m('FLOOR', g.m('MULTIPLY', g.v, rows))
    w = g.m('ADD', g.m('MULTIPLY', g.u, 22), g.m('MULTIPLY', rowi, 3.7))
    bi = g.m('FLOOR', w); fu = g.fract(w); fv = g.fract(g.m('MULTIPLY', g.v, rows))
    cell = g.vec(g.m('MODULO', bi, 22), rowi)
    r = g.white(cell, seed); r2 = g.white(cell, seed + 1)
    pal = [(.3, .06, .05), (.08, .15, .1), (.1, .08, .18), (.35, .22, .1), (.15, .1, .06)]
    col = lin(pal[0])
    for i, c in enumerate(pal[1:], 1):
        col = g.mix(g._sstep(i / len(pal) - .01, i / len(pal) + .01, r), col, lin(c))
    top = g.m('ADD', .75, g.m('MULTIPLY', r2, .2))
    gap = g._sstep(top, g.m('ADD', top, .01), fv)
    band = g.m('MULTIPLY', g.m('SUBTRACT', 1, g._sstep(.01, .02, g.m('ABSOLUTE', g.m('SUBTRACT', fv, .2)))), g._sstep(.5, .55, r2))
    band = g.m('MAXIMUM', band, g.m('MULTIPLY', g.m('SUBTRACT', 1, g._sstep(.01, .02, g.m('ABSOLUTE', g.m('SUBTRACT', fv, g.m('SUBTRACT', top, .08))))), g._sstep(.3, .35, r2)))
    col = g.mix(g.m('MULTIPLY', band, .8), col, lin((.6, .45, .18)))
    edge = g.m('SUBTRACT', 1, g._sstep(.0, .08, g.m('MINIMUM', fu, g.m('SUBTRACT', 1, fu))))
    col = g.mix(g.m('MULTIPLY', edge, .6), col, lin((.02, .015, .01)))
    col = g.mix(gap, col, lin((.02, .015, .012)))
    shelf = g.m('SUBTRACT', 1, g._sstep(.0, .04, fv))
    col = g.mix(shelf, col, lin((.12, .07, .04)))
    col = grime(g, faded(g, col, .8, .9), .35, 3, seed + 2)
    return col, g.bump(g.m('ADD', g.m('MULTIPLY', gap, -1), g.m('MULTIPLY', edge, -.5)), .6, .02)

def dial(g, face=(.82, .76, .62), ink=(.06, .05, .04), rim=(.6, .45, .2), seed=0):
    """a clock dial (centred, not tiled): hour bars, minute ticks, a brass rim, crazed glass."""
    cu, cv = g.m('SUBTRACT', g.u, .5), g.m('SUBTRACT', g.v, .5)
    ang = g.m('ARCTAN2', cv, cu); rad = g.m('SQRT', g.m('ADD', g.m('MULTIPLY', cu, cu), g.m('MULTIPLY', cv, cv)))
    col = lin(face)
    mt = g.m('MULTIPLY', g._sstep(.9, .97, g.m('COSINE', g.m('MULTIPLY', ang, 60))), g.m('MULTIPLY', g._sstep(.4, .405, rad), g.m('SUBTRACT', 1, g._sstep(.43, .435, rad))))
    ht = g.m('MULTIPLY', g._sstep(.985, .995, g.m('COSINE', g.m('MULTIPLY', ang, 12))), g.m('MULTIPLY', g._sstep(.33, .335, rad), g.m('SUBTRACT', 1, g._sstep(.43, .435, rad))))
    ring = g.m('SUBTRACT', 1, g._sstep(.003, .006, g.m('ABSOLUTE', g.m('SUBTRACT', rad, .44))))
    col = g.mix(g.m('MAXIMUM', g.m('MAXIMUM', mt, ht), ring), col, lin(ink))
    hub = g.m('SUBTRACT', 1, g._sstep(.025, .03, rad))
    rimm = g._sstep(.46, .47, rad)
    col = g.mix(g.m('MAXIMUM', hub, rimm), col, lin(rim))
    craze = g.m('MAXIMUM', ridge(g, 4, .006, seed, 3), ridge(g, 9, .004, seed + 1, 2))
    col = g.mix(g.m('MULTIPLY', craze, .4), col, lin((.3, .26, .2)))
    col = grime(g, col, .45, 3, seed + 2)
    return col, g.bump(g.m('ADD', g.m('MULTIPLY', rimm, 1), g.m('MULTIPLY', g.m('MAXIMUM', mt, ht), .2)), .5, .02)

USES = {}
def use(room):
    """register a recipe and note where it belongs (written to the level's README)."""
    def deco(f): USES[f.__name__] = room; return recipe(f)
    return deco

def splotch(g, col, c, scale=6, th=.66, amt=.7, seed=0, soft=.12):
    """scatter patches of colour c (puddles, algae, salt, moss, frost...)."""
    s = g._sstep(th, th + soft, g.noise(scale, 5, .65, seed))
    return g.mix(g.m('MULTIPLY', s, amt), col, lin(c))

def tread(g, base=(.25, .26, .28), N=10, seed=0, rust=.3):
    """diamond tread plate."""
    x = g.m('MULTIPLY', g.u, N); y = g.m('MULTIPLY', g.v, N)
    row = g.m('MODULO', g.m('FLOOR', y), 2)
    fu = g.fract(g.m('ADD', x, g.m('MULTIPLY', row, .5))); fv = g.fract(y)
    a = g.m('SUBTRACT', fu, .5); b = g.m('SUBTRACT', fv, .5)
    dir1 = g.m('ABSOLUTE', g.m('SUBTRACT', g.m('MULTIPLY', a, .7), g.m('MULTIPLY', b, .7)))
    dir2 = g.m('ABSOLUTE', g.m('ADD', g.m('MULTIPLY', a, .7), g.m('MULTIPLY', b, .7)))
    sel = g.m('MODULO', g.m('ADD', g.m('FLOOR', x), g.m('FLOOR', y)), 2)
    bar = g.m('SUBTRACT', 1, g._sstep(.05, .08, g.mix(sel, dir1, dir2) if False else g.m('ADD', g.m('MULTIPLY', sel, dir1), g.m('MULTIPLY', g.m('SUBTRACT', 1, sel), dir2))))
    bar = g.m('MULTIPLY', bar, g.m('SUBTRACT', 1, g._sstep(.3, .34, g.m('MAXIMUM', g.m('ABSOLUTE', a), g.m('ABSOLUTE', b)))))
    col = g.mix(g.m('MULTIPLY', bar, .9), lin(base), g.hsv(lin(base), .5, .6, 2.6))
    if rust: col = splotch(g, col, (.3, .13, .06), 4, .6, rust, seed + 1)
    col = grime(g, col, .35, 3, seed + 2)
    return col, g.bump(bar, .5, .01)

def reed_mat(g, base=(.55, .45, .25), N=6, seed=0):
    """woven tatami / reed matting with bound edges."""
    fine = g.m('SINE', g.m('MULTIPLY', g.v, TAU * 80))
    col = g.mix(g._sstep(-.4, .4, fine), lin(tuple(c * .75 for c in base)), lin(base))
    fu, fv, edge, cell = cells(g, N // 3 or 1, N)
    bind = g.m('SUBTRACT', 1, g._sstep(.0, .03, fu))
    col = g.mix(bind, col, lin((.12, .14, .1)))
    col = g.mix(g.m('MULTIPLY', g.white(cell, seed), .15), col, lin((.6, .55, .45)), 'MULTIPLY')
    col = grime(g, col, .35, 3, seed + 1)
    return col, g.bump(g.m('ADD', fine, g.m('MULTIPLY', bind, 2)), .25, .01)

def mirror(g, tint=(.75, .78, .82), seed=0, crack=0.0, foxing=.5):
    """old silvered glass: soft cloudy reflection, brown foxing spots, optional spider cracks."""
    cl = g.noise(2, 4, .6, seed)
    col = g.mix(g._sstep(.3, .75, cl), lin(tuple(c * .55 for c in tint)), lin(tint))
    fox = g._sstep(.7, .76, g.noise(18, 3, .6, seed + 1))
    col = g.mix(g.m('MULTIPLY', fox, foxing), col, lin((.3, .24, .15)))
    edge = g._sstep(.6, .8, g.noise(3, 5, .6, seed + 2))
    col = g.mix(g.m('MULTIPLY', edge, .4), col, lin((.25, .25, .27)))
    h = g.m('MULTIPLY', fox, .1)
    if crack:
        cr = g.m('MAXIMUM', ridge(g, 3, .006, seed + 3, 2, dist=.3), ridge(g, 6, .004, seed + 4, 2, dist=.3))
        col = g.mix(g.m('MULTIPLY', cr, crack), col, lin((.95, .97, 1)))
        h = g.m('SUBTRACT', h, cr)
    return col, g.bump(h, .3, .01)

def mosaic(g, palette, N=24, seed=0, grout=(.15, .13, .1), dirt=.35):
    fu, fv, edge, cell = cells(g, N)
    r = g.white(cell, seed)
    col = lin(palette[0])
    for i, c in enumerate(palette[1:], 1):
        col = g.mix(g._sstep(i / len(palette) - .005, i / len(palette) + .005, r), col, lin(c))
    col = g.mix(g.m('MULTIPLY', g.white(cell, seed + 1), .3), col, lin((.4, .4, .4)), 'MULTIPLY')
    gr = g._sstep(.05, .1, edge)
    col = g.mix(gr, lin(grout), col)
    col = splotch(g, col, (.3, .27, .24), 4, .62, .5, seed + 2)   # missing tesserae / dust
    col = grime(g, col, dirt, 3, seed + 3)
    return col, g.bump(gr, .5, .01)

def scorch(g, col, seed=0, amt=.8):
    return splotch(g, col, (.02, .015, .01), 3, .6, amt, seed, .15)

def board_marks(g, col, seed=0, c=(.8, .7, .2), n=3):
    """painted stage tape / spike marks: little bars scattered on boards."""
    for k in range(n):
        m = g.m('MULTIPLY', g._sstep(.79, .8, g.noise(9, 1, .5, seed + k, ax=4, ay=.6)), .8)
        col = g.mix(m, col, lin(c))
    return col

def harlequin(g, a, b, N=4, line=None, seed=0, dirt=.4):
    x = g.m('MULTIPLY', g.m('ADD', g.u, g.v), N); y = g.m('MULTIPLY', g.m('SUBTRACT', g.u, g.v), N)
    k = g.m('MODULO', g.m('ADD', g.m('FLOOR', x), g.m('FLOOR', y)), 2)
    k = g.m('ABSOLUTE', k)
    col = g.mix(k, lin(a), lin(b))
    h = 0.0
    if line:
        fx, fy = g.fract(x), g.fract(y)
        e = g.m('MINIMUM', g.m('MINIMUM', fx, g.m('SUBTRACT', 1, fx)), g.m('MINIMUM', fy, g.m('SUBTRACT', 1, fy)))
        ln = g.m('SUBTRACT', 1, g._sstep(.01, .025, e))
        col = g.mix(ln, col, lin(line)); h = ln
    return grime(g, col, dirt, 3, seed), g.bump(h, .4, .01) if line else g.bump(g.noise(40, 2, .5, seed), .05, .005)

def speckle(g, base, dark, light=None, scale=80, seed=0):
    """cork / terrazzo / granite: fine flecks on a base."""
    col = g.mix(g._sstep(.45, .62, g.noise(scale, 2, .5, seed)), lin(base), lin(dark))
    if light: col = g.mix(g._sstep(.7, .74, g.noise(scale * .7, 1, .5, seed + 1)), col, lin(light))
    return grime(g, col, .3, 3, seed + 2), g.bump(g.noise(scale, 2, .5, seed), .15, .005)

def rings(g, a, b, N=3, n_rings=4, seed=0):
    """concentric rings in each cell (spinning-top floors, target mats)."""
    fu, fv, edge, cell = cells(g, N)
    du, dv = g.m('SUBTRACT', fu, .5), g.m('SUBTRACT', fv, .5)
    rad = g.m('SQRT', g.m('ADD', g.m('MULTIPLY', du, du), g.m('MULTIPLY', dv, dv)))
    k = g._sstep(-.1, .1, g.m('SINE', g.m('MULTIPLY', rad, TAU * n_rings * 1.4)))
    col = g.mix(k, lin(a), lin(b))
    col = g.mix(g._sstep(.48, .5, rad), col, g.hsv(lin(a), .5, .8, .6))
    return grime(g, col, .4, 3, seed), g.bump(k, .1, .01)

def parchment(g, base=(.78, .68, .48), seed=0, ink=True):
    col = g.mix(g._sstep(.3, .8, g.noise(4, 6, .65, seed)), lin(tuple(c * .7 for c in base)), lin(base))
    if ink:
        row = g.fract(g.m('MULTIPLY', g.v, 30))
        word = g._sstep(-.1, .2, g.m('SUBTRACT', g.noise(20, 2, .5, seed + 1, ax=3, ay=.3), .5))
        txt = g.m('MULTIPLY', g.m('SUBTRACT', 1, g._sstep(.06, .12, g.m('ABSOLUTE', g.m('SUBTRACT', row, .5)))), word)
        col = g.mix(g.m('MULTIPLY', txt, .7), col, lin((.12, .08, .06)))
    col = splotch(g, col, (.45, .32, .18), 4, .66, .5, seed + 2)
    return grime(g, col, .3, 3, seed + 3), g.bump(g.noise(30, 3, .5, seed + 4), .1, .005)

def rubber(g, base=(.05, .05, .055), N=24, seed=0, axis='v'):
    r = g.m('SINE', g.m('MULTIPLY', g.v if axis == 'v' else g.u, TAU * N))
    col = g.mix(g._sstep(-.3, .3, r), lin(base), lin(tuple(c * 1.8 for c in base)))
    col = splotch(g, col, (.2, .2, .2), 6, .7, .4, seed)
    return grime(g, col, .3, 3, seed + 1), g.bump(r, .5, .01)
