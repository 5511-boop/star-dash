# Grimwood Carnival texture recipes. Every pattern repeats a whole number of times across the
# square and all noise is 4D torus noise, so each baked image tiles seamlessly.

def grime(g, col, amount=.45, scale=3.0, seed=0.0, tint=(.32, .26, .2)):
    """broad dirty blotches + fine grit, pulling the colour down toward a brownish soot."""
    n = g.noise(scale, 5, .6, seed)
    big = g._sstep(.42, .72, n)
    fine = g.noise(scale * 9, 3, .5, seed + 3.3)
    soot = g.mix(big, col, g.mix(.5, col, lin(tint), 'MULTIPLY'))
    dirt = g.m('MULTIPLY', g._sstep(.3, .8, fine), amount * .5)
    return g.mix(g.m('ADD', g.m('MULTIPLY', big, amount), dirt, clamp=True), col, soot)

def stripes(g, n_pairs, a, b, soft=.06, axis='u'):
    t = g.m('SINE', g.m('MULTIPLY', g.u if axis == 'u' else g.v, TAU * n_pairs))
    wob = g.m('MULTIPLY', g.m('SUBTRACT', g.noise(6, 2, .5, 7.7), .5), .25)   # hand-painted, not ruler straight
    fac = g._sstep(-soft, soft, g.m('ADD', t, wob))
    return g.mix(fac, lin(b), lin(a)), fac

def weave(g, n=6, strength=.55):
    P = ph('fabric_pattern_05')
    return g.nmap(g.img(P['nor'], g.uvs(n), True), strength)

def faded(g, col, sat=.7, val=.85):
    return g.hsv(col, .5, sat, val)

@recipe
def wall_stripes(g):
    """striped tent canvas for the walls: wine and cream, water-stained, sun-faded."""
    col, fac = stripes(g, 4, (.48, .12, .17), (.78, .7, .56))
    stain = g._sstep(.5, .72, g.noise(2.0, 6, .65, 11, ay=1.6))
    col = g.mix(g.m('MULTIPLY', stain, .7), col, lin((.4, .3, .2)), 'MULTIPLY')
    drips = g._sstep(.52, .62, g.noise(3, 4, .6, 12, ax=7, ay=.7))   # rain streaks running down the canvas
    col = g.mix(g.m('MULTIPLY', drips, .45), col, lin((.3, .24, .18)), 'MULTIPLY')
    mould = g._sstep(.68, .8, g.noise(5, 6, .7, 13))
    col = g.mix(g.m('MULTIPLY', mould, .6), col, lin((.22, .25, .16)))
    col = grime(g, faded(g, col, .7, .78), .6, 3, 1)
    nrm = g.bump(g.noise(40, 2, .5, 2), .15, .01, weave(g, 8, .6))
    return col, nrm

@recipe
def awning(g):
    """red-and-cream booth awning canvas, faded and streaked."""
    col, fac = stripes(g, 3, (.62, .1, .1), (.85, .78, .62), .04)
    streak = g._sstep(.5, .78, g.noise(3, 4, .6, 21, ax=4, ay=.6))
    col = g.mix(g.m('MULTIPLY', streak, .5), col, lin((.4, .3, .22)), 'MULTIPLY')
    col = grime(g, faded(g, col, .78, .85), .4, 4, 2)
    return col, weave(g, 6, .7)

@recipe
def tent_floor(g):
    """the prize tent's striped floorcloth, trampled and dark."""
    col, fac = stripes(g, 4, (.24, .09, .13), (.16, .06, .08), .1)
    col = grime(g, col, .55, 2.5, 3)
    scuff = g._sstep(.6, .8, g.noise(10, 3, .5, 31, ax=3, ay=1))
    col = g.mix(g.m('MULTIPLY', scuff, .35), col, lin((.35, .3, .26)))
    return col, g.bump(g.noise(30, 3, .6, 4), .12, .01, weave(g, 8, .5))

@recipe
def booth_wood(g):
    """ticket-booth boards: carnival red paint flaking off old wood."""
    P = ph('wood_peeling_paint_weathered')
    d = g.img(P['diff'], g.uvs(2))
    col = g.hsv(g.mix(1, d, lin((1, .3, .26)), 'MULTIPLY'), .5, 1.25, 2.1)   # red paint over the flaking boards, grain kept
    col = grime(g, faded(g, col, .8, .9), .35, 3, 5)
    return col, g.nmap(g.img(P['nor'], g.uvs(2), True), 2.2)

@recipe
def ticket_floor(g):
    """plum checkerboard tiles, cracked and scuffed."""
    N = 8
    cell = g.floorv(g.uvs(N))
    fu, fv = g.fract(g.m('MULTIPLY', g.u, N)), g.fract(g.m('MULTIPLY', g.v, N))
    sep = g.n('ShaderNodeSeparateXYZ'); g.l(cell, sep.inputs[0])
    chk = g.m('MODULO', g.m('ADD', sep.outputs[0], sep.outputs[1]), 2)
    base = g.mix(chk, lin((.23, .11, .18)), lin((.36, .2, .27)))
    jitter = g.white(cell, 1.3)
    base = g.mix(g.m('MULTIPLY', jitter, .35), base, lin((.15, .1, .12)), 'MULTIPLY')
    edge = g.m('MINIMUM', g.m('MINIMUM', fu, g.m('SUBTRACT', 1, fu)), g.m('MINIMUM', fv, g.m('SUBTRACT', 1, fv)))
    grout = g._sstep(.025, .045, edge)
    col = g.mix(grout, lin((.07, .05, .05)), base)
    crack_n = g.noise(5, 6, .6, 9)
    crack = g.m('SUBTRACT', 1, g._sstep(.004, .012, g.m('ABSOLUTE', g.m('SUBTRACT', crack_n, .5))))
    col = g.mix(g.m('MULTIPLY', crack, .8), col, lin((.05, .04, .04)))
    col = grime(g, col, .45, 3, 6)
    h = g.m('SUBTRACT', g.m('MULTIPLY', grout, 1), g.m('MULTIPLY', crack, .5))
    return col, g.bump(h, .6, .02, g.bump(g.noise(60, 2, .5, 8), .08, .005))

@recipe
def carousel_floor(g):
    """dark plum-stained planks around the carousel."""
    P = ph('dark_wooden_planks')
    d = g.img(P['diff'], g.uvs(2))
    col = g.mix(.55, d, lin((.75, .6, .85)), 'MULTIPLY')
    col = grime(g, faded(g, col, .85, 1.25), .25, 3, 7)
    return col, g.nmap(g.img(P['nor'], g.uvs(2), True), 2.2)

@recipe
def carousel_disc(g):
    """the carousel platform top: 16 faded red/cream wedges, a gilt ring, worn by feet (centred, not tiled)."""
    cu, cv = g.m('SUBTRACT', g.u, .5), g.m('SUBTRACT', g.v, .5)
    ang = g.m('ARCTAN2', cv, cu); rad = g.m('SQRT', g.m('ADD', g.m('MULTIPLY', cu, cu), g.m('MULTIPLY', cv, cv)))
    wedge = g._sstep(-.05, .05, g.m('SINE', g.m('MULTIPLY', ang, 8)))
    col = g.mix(wedge, lin((.84, .76, .6)), lin((.6, .12, .12)))
    ring = g.m('SUBTRACT', 1, g._sstep(.008, .016, g.m('ABSOLUTE', g.m('SUBTRACT', rad, .455))))
    ring2 = g.m('SUBTRACT', 1, g._sstep(.004, .009, g.m('ABSOLUTE', g.m('SUBTRACT', rad, .42))))
    hub = g.m('SUBTRACT', 1, g._sstep(.07, .08, rad))
    gold = lin((.62, .46, .18))
    col = g.mix(g.m('MAXIMUM', ring, ring2), col, gold)
    col = g.mix(hub, col, gold)
    outer = g._sstep(.49, .5, rad)
    col = g.mix(outer, col, lin((.18, .1, .1)))
    wear = g._sstep(.35, .7, g.m('MULTIPLY', g.noise(4, 5, .6, 12), g.m('SUBTRACT', 1.3, g.m('MULTIPLY', g.m('ABSOLUTE', g.m('SUBTRACT', rad, .3)), 3))))
    col = g.mix(g.m('MULTIPLY', wear, .55), col, lin((.36, .28, .22)))
    col = grime(g, faded(g, col, .78, .85), .35, 3, 13)
    h = g.m('ADD', g.m('MULTIPLY', g.m('MAXIMUM', ring, ring2), .5), g.m('MULTIPLY', g._sstep(-.02, .02, g.m('SINE', g.m('MULTIPLY', ang, 8))), .1))
    return col, g.bump(h, .4, .02, g.bump(g.noise(50, 3, .5, 14), .1, .005))

@recipe
def rink_floor(g):
    """the roller rink's maple boards, scuffed grey with old wheel marks."""
    P = ph('wood_floor_worn')
    d = g.img(P['diff'], g.uvs(2))
    col = faded(g, d, .6, .7)
    swirl = g._sstep(.48, .52, g.noise(3, 2, .4, 15, dist=2))
    col = g.mix(g.m('MULTIPLY', swirl, .25), col, lin((.2, .17, .15)))
    col = grime(g, col, .3, 3, 16)
    return col, g.nmap(g.img(P['nor'], g.uvs(2), True), 2.2)

@recipe
def stage_planks(g):
    """the puppet theatre's stage boards."""
    P = ph('old_wood_floor')
    d = g.img(P['diff'], g.uvs(1))
    col = grime(g, faded(g, d, .85, .85), .3, 3, 17)
    return col, g.nmap(g.img(P['nor'], g.uvs(1), True), 2.2)

@recipe
def curtain(g):
    """heavy stage velvet: deep folds, dusty crests, moth-worn."""
    wav = g.m('SINE', g.m('ADD', g.m('MULTIPLY', g.u, TAU * 7), g.m('MULTIPLY', g.noise(3, 2, .5, 18), 2.5)))
    fold = g.m('MULTIPLY', g.m('ADD', wav, 1), .5)
    col = g.mix(fold, lin((.12, .01, .025)), lin((.42, .05, .08)))
    dust = g.m('MULTIPLY', g._sstep(.8, .98, fold), g._sstep(.4, .7, g.noise(8, 4, .6, 19)))
    col = g.mix(g.m('MULTIPLY', dust, .45), col, lin((.42, .34, .3)))
    moth = g.m('SUBTRACT', 1, g._sstep(.0, .015, g.m('SUBTRACT', .73, g.noise(16, 3, .5, 20))))
    col = g.mix(g.m('MULTIPLY', moth, .9), col, lin((.03, .01, .01)))
    col = grime(g, col, .25, 2, 21)
    return col, g.bump(fold, .45, .05, weave(g, 10, .35))

@recipe
def paint_floor(g):
    """concrete floor of the paint-splash booth, crusted with faded old splatters."""
    P = ph('damaged_concrete_floor')
    d = g.img(P['diff'], g.uvs(1))
    col = faded(g, d, .7, .8)
    for k, c in enumerate(((.15, .55, .6), (.85, .7, .2), (.85, .3, .5), (.4, .7, .3))):
        sp = g._sstep(.62, .645, g.noise(2.5 + k * .8, 5, .7, 30 + k * 4.1, dist=.8))
        col = g.mix(g.m('MULTIPLY', sp, .7), col, g.mix(.5, lin(c), d, 'MULTIPLY'))
    col = grime(g, col, .3, 3, 22)
    return col, g.nmap(g.img(P['nor'], g.uvs(1), True), 2.2)

@recipe
def disco_floor(g):
    """ghost disco: smoked glass tiles, a few still faintly tinted, scratched and filthy."""
    N = 6
    cell = g.floorv(g.uvs(N))
    fu, fv = g.fract(g.m('MULTIPLY', g.u, N)), g.fract(g.m('MULTIPLY', g.v, N))
    r = g.white(cell, 4.2)
    tint = g.mix(g._sstep(.5, .52, r), lin((.2, .07, .26)), lin((.06, .16, .24)))
    base = g.mix(g._sstep(.6, .65, g.white(cell, 9.1)), lin((.04, .035, .055)), tint)
    edge = g.m('MINIMUM', g.m('MINIMUM', fu, g.m('SUBTRACT', 1, fu)), g.m('MINIMUM', fv, g.m('SUBTRACT', 1, fv)))
    grout = g._sstep(.02, .035, edge)
    glowc = g.m('MULTIPLY', g.m('SUBTRACT', 1, g._sstep(.0, .5, g.m('MULTIPLY', g.m('ABSOLUTE', g.m('SUBTRACT', fu, .5)), 2))), .08)
    base = g.mix(glowc, base, lin((.5, .4, .6)), 'SCREEN')
    col = g.mix(grout, lin((.18, .17, .2)), base)
    scratch = g._sstep(.495, .5, g.noise(30, 2, .4, 23, ax=6, ay=.5))
    col = g.mix(g.m('MULTIPLY', scratch, .25), col, lin((.4, .4, .45)))
    col = grime(g, col, .4, 3, 24)
    return col, g.bump(grout, .5, .02, g.bump(scratch, .05, .002))

@recipe
def sawdust_floor(g):
    """the strongman's pitch: packed dirt strewn with sawdust."""
    P = ph('dirt_floor')
    d = g.img(P['diff'], g.uvs(1))
    chips = g._sstep(.62, .66, g.noise(60, 2, .5, 25))
    col = g.mix(g.m('MULTIPLY', chips, .8), faded(g, d, .8, .85), lin((.62, .5, .32)))
    drift = g._sstep(.5, .7, g.noise(3, 4, .6, 26))
    col = g.mix(g.m('MULTIPLY', drift, .3), col, lin((.55, .45, .3)))
    col = grime(g, faded(g, col, .9, .8), .4, 3, 27)
    return col, g.bump(chips, .2, .005, g.nmap(g.img(P['nor'], g.uvs(1), True), 2.2))

@recipe
def circus_rug(g):
    """musical-chairs rug: faded plum with gilt medallions, threadbare in patches."""
    N = 4
    fu, fv = g.fract(g.m('MULTIPLY', g.u, N)), g.fract(g.m('MULTIPLY', g.v, N))
    du, dv = g.m('SUBTRACT', fu, .5), g.m('SUBTRACT', fv, .5)
    rad = g.m('SQRT', g.m('ADD', g.m('MULTIPLY', du, du), g.m('MULTIPLY', dv, dv)))
    ring = g.m('SUBTRACT', 1, g._sstep(.015, .03, g.m('ABSOLUTE', g.m('SUBTRACT', rad, .3))))
    ang = g.m('ARCTAN2', dv, du)
    petals = g.m('SUBTRACT', 1, g._sstep(.0, .03, g.m('SUBTRACT', rad, g.m('ADD', .12, g.m('MULTIPLY', g.m('COSINE', g.m('MULTIPLY', ang, 8)), .06)))))
    diamond = g.m('SUBTRACT', 1, g._sstep(.0, .02, g.m('SUBTRACT', g.m('ADD', g.m('ABSOLUTE', du), g.m('ABSOLUTE', dv)), .5)))
    col = g.mix(diamond, lin((.22, .08, .2)), lin((.3, .1, .22)))
    col = g.mix(g.m('MAXIMUM', ring, petals), col, lin((.66, .5, .22)))
    bare = g._sstep(.55, .7, g.noise(3, 5, .6, 28))
    col = g.mix(g.m('MULTIPLY', bare, .7), col, lin((.4, .33, .28)))
    col = grime(g, faded(g, col, .75, .85), .35, 3, 29)
    return col, g.bump(g.m('MAXIMUM', ring, petals), .15, .01, weave(g, 12, .7))

@recipe
def pen_ground(g):
    """the ghost-pony pen: trampled mud with scattered straw."""
    P = ph('brown_mud_02')
    d = g.img(P['diff'], g.uvs(2))
    s1 = g._sstep(.6, .62, g.noise(10, 2, .4, 32, ax=5, ay=.7))
    s2 = g._sstep(.61, .63, g.noise(10, 2, .4, 33, ax=.8, ay=4))
    straw = g.m('MAXIMUM', s1, s2)
    col = g.mix(g.m('MULTIPLY', straw, .6), faded(g, d, .85, .9), lin((.55, .45, .25)))
    col = grime(g, col, .25, 3, 34)
    return col, g.bump(straw, .35, .01, g.nmap(g.img(P['nor'], g.uvs(2), True), 2.2))

@recipe
def fence_wood(g):
    """grey, split fence boards for the pony pen."""
    P = ph('weathered_planks')
    d = g.img(P['diff'], g.uvs(2))
    col = grime(g, faded(g, d, .55, .95), .3, 3, 35)
    return col, g.nmap(g.img(P['nor'], g.uvs(2), True), 2.2)

@recipe
def tarnished_gold(g):
    """gilt trim and brass poles gone dull: dark tarnish in the low spots, worn bright on the edges."""
    n = g.noise(6, 6, .65, 36)
    col = g.mix(g._sstep(.3, .7, n), lin((.22, .16, .08)), lin((.55, .42, .2)))
    verd = g._sstep(.62, .75, g.noise(4, 4, .6, 37))
    col = g.mix(g.m('MULTIPLY', verd, .6), col, lin((.25, .32, .24)))
    scr = g._sstep(.497, .5, g.noise(25, 2, .4, 38, ax=5, ay=.4))
    col = g.mix(g.m('MULTIPLY', scr, .0), col, lin((.7, .58, .35)))
    return col, g.bump(g.noise(20, 4, .6, 39), .25, .01)

@recipe
def sign_board(g):
    """a painted carnival sign: cream panel, red border, a row of empty bulb sockets, flaking paint."""
    P = ph('wood_peeling_paint_weathered')
    d = g.img(P['diff'], g.uvs(1))
    ex = g.m('MINIMUM', g.m('MINIMUM', g.u, g.m('SUBTRACT', 1, g.u)), g.m('MINIMUM', g.v, g.m('SUBTRACT', 1, g.v)))
    border = g.m('SUBTRACT', 1, g._sstep(.1, .105, ex))
    inset = g.m('SUBTRACT', 1, g._sstep(.004, .008, g.m('ABSOLUTE', g.m('SUBTRACT', ex, .12))))
    col = g.mix(border, lin((.86, .78, .6)), lin((.62, .12, .1)))
    col = g.mix(inset, col, lin((.7, .52, .2)))
    # bulb sockets around the border
    k = 12
    bu = g.m('SUBTRACT', g.fract(g.m('MULTIPLY', g.u, k)), .5); bv = g.m('SUBTRACT', g.fract(g.m('MULTIPLY', g.v, k)), .5)
    nearedge = g.m('SUBTRACT', 1, g._sstep(.06, .065, ex))
    dot = g.m('SUBTRACT', 1, g._sstep(.18, .24, g.m('SQRT', g.m('ADD', g.m('MULTIPLY', bu, bu), g.m('MULTIPLY', bv, bv)))))
    sock = g.m('MULTIPLY', dot, nearedge)
    col = g.mix(sock, col, lin((.1, .08, .06)))
    col = g.mix(.85, col, g.hsv(d, .5, .6, 2.6), 'MULTIPLY')   # wood grain and flaking show through the paint
    col = grime(g, faded(g, col, .8, .85), .4, 3, 40)
    return col, g.bump(g.m('ADD', inset, g.m('MULTIPLY', sock, -1)), .4, .02, g.nmap(g.img(P['nor'], g.uvs(1), True), .8))
