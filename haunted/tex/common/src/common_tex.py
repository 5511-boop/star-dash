# Shared detail maps (tex/common/): near-white colour maps that multiply over a prop's own colour, plus normals.
# The engine's detail pass puts one on every plain-coloured prop, picked by its colour (see engine.js detailPass).
def _lift(g, f, lo):   # 0..1 factor -> grey lo..1 (multiplies the prop colour, so it never goes past the original)
    return g.mix(f, lin((lo, lo, lo)), lin((1, 1, 1)))

@use('wood: grain lines, knots, worn edges')
def detail_wood(g):
    grain = g.noise(3, 6, .6, 1, ax=.35, ay=7, dist=.6)
    lines = ridge(g, 4, .05, 2, 5, ax=.4, ay=9)
    knot = g._sstep(.74, .8, g.noise(5, 2, .5, 3))
    f = g.m('MULTIPLY', g.m('SUBTRACT', 1, g.m('MULTIPLY', lines, .55)), g.m('ADD', .55, g.m('MULTIPLY', grain, .45)))
    f = g.m('MULTIPLY', f, g.m('SUBTRACT', 1, g.m('MULTIPLY', knot, .4)))
    col = _lift(g, g.m('MULTIPLY', f, 1.15, clamp=True), .55)
    col = grime(g, col, .25, 3, 4, tint=(.7, .65, .6))
    return col, g.bump(g.m('ADD', g.m('MULTIPLY', lines, -1), g.m('MULTIPLY', grain, .3)), .45, .02)

@use('stone, plaster, bone: pits, hairline cracks, soot')
def detail_stone(g):
    base = g.noise(6, 6, .65, 11)
    pits = g._sstep(.66, .7, g.noise(60, 2, .5, 12))
    cr = g.m('MAXIMUM', ridge(g, 3, .012, 13, 4, dist=.8), g.m('MULTIPLY', ridge(g, 7, .007, 14, 3), .6))
    f = g.m('ADD', .62, g.m('MULTIPLY', base, .45))
    f = g.m('SUBTRACT', f, g.m('ADD', g.m('MULTIPLY', pits, .25), g.m('MULTIPLY', cr, .45)))
    col = _lift(g, g.m('MULTIPLY', f, 1.12, clamp=True), .5)
    col = grime(g, col, .3, 3, 15, tint=(.65, .62, .6))
    return col, g.bump(g.m('SUBTRACT', g.m('ADD', base, g.m('MULTIPLY', pits, -.6)), cr), .55, .02)

@use('metal: brushed scratches, pitting, dark seams of grime')
def detail_metal(g):
    sc = ridge(g, 30, .02, 21, 2, ax=6, ay=.4)
    sc2 = ridge(g, 18, .015, 22, 2, ax=.5, ay=5)
    pit = g._sstep(.7, .74, g.noise(45, 2, .5, 23))
    cloud = g.noise(4, 5, .6, 24)
    f = g.m('ADD', .42, g.m('MULTIPLY', cloud, .55))
    f = g.m('ADD', f, g.m('MULTIPLY', g.m('MAXIMUM', sc, sc2), .3))
    f = g.m('SUBTRACT', f, g.m('MULTIPLY', pit, .35))
    col = _lift(g, g.m('MULTIPLY', f, 1.0, clamp=True), .5)
    col = grime(g, col, .25, 3, 25, tint=(.55, .5, .45))
    return col, g.bump(g.m('ADD', g.m('MULTIPLY', g.m('MAXIMUM', sc, sc2), .3), g.m('MULTIPLY', pit, -.6)), .35, .01)

@use('painted / generic: soft cloudy grime, chips and fine grain')
def detail_grime(g):
    cloud = g.noise(3, 6, .65, 31)
    chips = g._sstep(.72, .75, g.noise(25, 3, .55, 32))
    fine = g.noise(80, 2, .5, 33)
    f = g.m('ADD', .38, g.m('MULTIPLY', cloud, .6))
    f = g.m('SUBTRACT', f, g.m('ADD', g.m('MULTIPLY', chips, .3), g.m('MULTIPLY', fine, .12)))
    col = _lift(g, g.m('MULTIPLY', f, 1.12, clamp=True), .55)
    return col, g.bump(g.m('ADD', g.m('MULTIPLY', chips, -1), g.m('MULTIPLY', fine, .3)), .3, .01)

@use('cloth, upholstery, rope: woven threads')
def detail_cloth(g):
    cloud = g.noise(4, 5, .6, 41)
    f = g.m('ADD', .45, g.m('MULTIPLY', cloud, .5))
    thr = g.m('MULTIPLY', g.m('ADD', g.m('SINE', g.m('MULTIPLY', g.u, TAU * 64)), g.m('SINE', g.m('MULTIPLY', g.v, TAU * 64))), .05)
    col = _lift(g, g.m('ADD', f, thr, clamp=True), .55)
    col = grime(g, col, .25, 3, 42, tint=(.6, .55, .5))
    return col, weave(g, 8, .7)
