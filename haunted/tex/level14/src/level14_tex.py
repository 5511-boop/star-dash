# Level 14: The Sky Gardens: pale stone, lichen and lawn, terracotta and gilt; airy but overgrown and storm-worn.
@use('The Cloud Steps (floor): pale stone veiled in cloud wisps')
def cloud_steps(g):
    col, n = ph_tex(g, 'floor_tiles_02', 2, (.95, .95, 1), .4, 1.1, .2, 1)
    wisp = g._sstep(.55, .8, g.noise(3, 6, .7, 2, dist=2))
    return g.mix(g.m('MULTIPLY', wisp, .6), col, lin((.85, .88, .95))), n
@use('The Twin Terraces (floor): sun-faded terracotta tiles')
def terrace_terracotta(g): return ph_tex(g, 'floor_tiles_02', 2, (1, .62, .45), .9, .95, .3, 3)
@use('The Windy Terrace (floor): lichen-spotted flagstones')
def lichen_flags(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.9, .9, .85), .3, 1.1, .25, 4)
    return splotch(g, col, (.55, .6, .3), 12, .68, .6, 5, .04), n
@use('The Thorn Maze (floor): overgrown grass with thorny runners')
def thorn_grass(g):
    col, n = ph_tex(g, 'grass_ground', 2, (.7, .85, .55), .9, .85, .25, 6)
    th = ridge(g, 6, .01, 7, 3, dist=1)
    return g.mix(g.m('MULTIPLY', th, .8), col, lin((.18, .12, .06))), n
@use('The Kite Run (floor): long lawn')
def kite_lawn(g): return ph_tex(g, 'grass_ground', 2, (.7, .88, .55), .8, .85, .25, 8)
@use('The Sundial Beds (floor): raked pale gravel with brass inlay lines')
def sundial_gravel(g):
    col, n = speckle(g, (.62, .6, .55), (.4, .38, .35), (.8, .78, .72), 90, 9)
    rake = g.m('SINE', g.m('MULTIPLY', g.v, TAU * 30))
    col = g.mix(g._sstep(.6, 1, rake), col, g.hsv(col, .5, 1, .8))
    inl = g.m('SUBTRACT', 1, g._sstep(.004, .008, g.m('ABSOLUTE', g.m('SUBTRACT', g.u, .5))))
    return g.mix(inl, col, lin((.6, .45, .2))), g.bump(rake, .2, .01, n)
@use('The Bramble Wall (floor): moss and fallen brambles')
def bramble_moss(g):
    col, n = ph_tex(g, 'grass_ground', 2, (.45, .65, .35), .8, .6, .3, 10)
    return splotch(g, col, (.12, .25, .07), 5, .55, .6, 11), n
@use('The Storm Front (floor): wet dark slate')
def storm_slate(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.55, .58, .68), .3, .55, .2, 12)
    return splotch(g, col, (.05, .06, .08), 3, .6, .4, 13, .03), n
@use('The Hanging Gardens (floor): bleached rope-bridge planks')
def bridge_planks_pale(g): return ph_tex(g, 'weathered_planks', 2, (1, .95, .85), .3, 1.4, .25, 14)
@use('The Storm Queen (floor): sky-blue and white mosaic')
def queen_mosaic(g): return mosaic(g, [(.4, .55, .7), (.75, .78, .8), (.3, .4, .55), (.6, .7, .78)], 20, 15, (.6, .6, .58), .25)
@use('Spirit Bridge (tutorial room floor): ghostly pale-cyan glass tiles')
def spirit_glass(g): return tiles(g, 5, (.45, .65, .7), (.4, .58, .65), 'random', (.75, .85, .88), .02, 0, 16, .2)
@use('walls (wallImg): pale sandstone balustrade stone')
def garden_wall(g): return ph_tex(g, 'sandstone_blocks_05', 1, (1, .98, .92), .4, 1.15, .3, 17)
@use('trim (trimImg), finials: weathered gilt')
def sky_gilt(g): return brass(g, (.75, .6, .3), 18, (.4, .5, .4))
@use('hedges, topiary')
def topiary(g): return leaves(g, (.05, .14, .04), (.15, .32, .08), 19)
@use('planters, urns: terracotta')
def terracotta(g):
    col = g.mix(g._sstep(.3, .7, g.noise(8, 5, .6, 20)), lin((.4, .16, .08)), lin((.6, .28, .14)))
    col = splotch(g, col, (.6, .6, .55), 4, .68, .5, 21)
    return grime(g, col, .3, 3, 22), g.bump(g.noise(30, 3, .5, 23), .15, .005)
