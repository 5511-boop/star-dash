# Level 6: The Witch's Bog: dead grass, black peat, moss and fungus glow, rotten boardwalks.
@use('The Scarecrow Field (floor): dead, flattened stubble')
def stubble_field(g): return ph_tex(g, 'grass_ground', 2, (.85, .75, .5), .5, .8, .3, 1)
@use('The Two Banks (floor): dark wet grass')
def bank_grass(g): return ph_tex(g, 'grass_ground', 2, (.55, .7, .45), .8, .65, .3, 2)
@use('The Bramble Maze (floor): thorny mud and dead leaves')
def bramble_mud(g):
    col, n = ph_tex(g, 'brown_mud_02', 2, (.75, .7, .55), .7, .75, .25, 3)
    leaf = g._sstep(.66, .69, g.noise(25, 2, .5, 4))
    return g.mix(g.m('MULTIPLY', leaf, .8), col, lin((.35, .2, .08))), n
@use('The Hand Swamp (floor): moss over mud, faintly glowing fungus')
def swamp_moss(g):
    col, n = ph_tex(g, 'brown_mud_02', 2, (.5, .6, .4), .6, .6, .2, 5)
    col = splotch(g, col, (.1, .2, .06), 4, .55, .55, 6)
    fung = g._sstep(.8, .82, g.noise(40, 1, .5, 7))
    return g.mix(g.m('MULTIPLY', fung, .9), col, lin((.6, .9, .5))), n
@use('The Drifting Isles (floor): black peat')
def isle_peat(g): return ph_tex(g, 'dirt_floor', 2, (.45, .4, .35), .5, .55, .25, 8)
@use('The Pumpkin Patch (floor): furrowed soil rows')
def pumpkin_furrows(g):
    col, n = ph_tex(g, 'dirt_floor', 2, (.8, .6, .45), .8, .8, .2, 9)
    row = g.m('SINE', g.m('MULTIPLY', g.v, TAU * 6))
    col = g.mix(g._sstep(-.2, .8, row), g.hsv(col, .5, 1, .55), col)
    return col, g.bump(row, .6, .05, n)
@use('Throw (tutorial room floor): rotting boardwalk over the bog')
def boardwalk(g):
    col, n = ph_tex(g, 'weathered_planks', 2, (.6, .7, .5), .6, .8, .35, 10)
    return splotch(g, col, (.1, .2, .06), 5, .6, .6, 11), n
@use('bog water: black water with duckweed (for pools)')
def bog_water(g):
    w = g.noise(3, 4, .6, 12)
    col = g.mix(g._sstep(.3, .7, w), lin((.01, .02, .015)), lin((.04, .06, .04)))
    weed = g._sstep(.62, .64, g.noise(30, 2, .5, 13))
    weed = g.m('MULTIPLY', weed, g._sstep(.45, .6, g.noise(3, 3, .6, 14)))
    return g.mix(weed, col, lin((.2, .35, .08))), g.bump(weed, .3, .01)
@use('walls (wallImg): dense dark hedge')
def bog_hedge(g): return leaves(g, (.03, .08, .02), (.1, .2, .05), 15)
@use('trim (trimImg), posts: mossy rotten wood')
def moss_wood(g):
    col, n = ph_tex(g, 'weathered_planks', 3, (.6, .7, .5), .6, .7, .3, 16, swap=True)
    return splotch(g, col, (.12, .25, .06), 4, .55, .7, 17), n
@use('scarecrows, sacks: burlap')
def burlap(g):
    col = g.mix(g._sstep(.4, .7, g.noise(8, 4, .6, 18)), lin((.3, .22, .12)), lin((.5, .4, .25)))
    col = grime(g, col, .4, 3, 19)
    P = ph('fabric_pattern_05')
    return col, g.nmap(g.img(P['nor'], g.uvs(4), True), 1.5)
@use('pumpkins: ribbed orange skin (wrap around)')
def pumpkin_skin(g):
    rib = g.m('ABSOLUTE', g.m('SINE', g.m('MULTIPLY', g.u, TAU * 4)))
    col = g.mix(g._sstep(.0, .5, rib), lin((.22, .08, .02)), lin((.5, .22, .05)))
    col = splotch(g, col, (.25, .3, .1), 6, .7, .5, 20)
    return grime(g, col, .3, 3, 21), g.bump(rib, .7, .03)
