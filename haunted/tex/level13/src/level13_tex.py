# Level 13: The Coal Mine: black rock and coal dust, oily timber, rust, the odd glow of crystal and glow-worm.
@use('The Lamp House (floor): oily, coal-black boards')
def lamphouse_boards(g):
    col, n = ph_tex(g, 'weathered_planks', 2, (.5, .45, .42), .4, .55, .35, 1)
    return splotch(g, col, (.02, .02, .02), 3, .58, .5, 2), n
@use('The Knocking Tunnels (floor): rough coal-dusted rock')
def tunnel_rock(g): return ph_tex(g, 'rocks_ground_04', 2, (.6, .48, .38), .6, .55, .3, 3)
@use('The Ore Carts (floor): ballast and spilled coal')
def cart_ballast(g):
    col, n = ph_tex(g, 'rocks_ground_04', 3, (.6, .55, .5), .4, .7, .2, 4)
    coal = g._sstep(.6, .63, g.noise(16, 3, .5, 5))
    return g.mix(coal, col, lin((.02, .02, .025))), n
@use("The Canary's Cage room (floor): dusty stone flags")
def canary_flags(g): return ph_tex(g, 'rock_tile_floor', 2, (.7, .62, .52), .4, .7, .35, 6)
@use('The Crystal Cavern (floor): dark rock shot with violet crystal')
def crystal_rock(g):
    col, n = ph_tex(g, 'dark_rock_02', 1, (.55, .5, .6), .5, .6, .2, 7)
    cr = g._sstep(.7, .72, g.noise(12, 2, .5, 8))
    return g.mix(cr, col, lin((.45, .3, .75))), n
@use('The Echo Pit (floor): wet black rock and still pools')
def echo_wet(g):
    col, n = ph_tex(g, 'dark_rock_02', 1, (.45, .45, .5), .3, .5, .2, 9)
    return splotch(g, col, (.01, .015, .02), 3, .6, .7, 10, .03), n
@use('The Glow-worm Grotto (floor): damp rock pricked with cyan glow')
def glowworm_rock(g):
    col, n = ph_tex(g, 'rocks_ground_04', 2, (.3, .45, .45), .6, .45, .2, 11)
    gw = g._sstep(.78, .8, g.noise(60, 1, .5, 12))
    return g.mix(gw, col, lin((.4, .9, .95))), n
@use('The Knocker Warren (floor): freshly dug earth')
def warren_earth(g): return ph_tex(g, 'dirt_floor', 2, (.65, .55, .5), .6, .6, .3, 13)
@use('The Lost Miner (floor): collapsed rubble and splintered props')
def collapse_rubble(g):
    col, n = ph_tex(g, 'rocks_ground_04', 2, (.8, .78, .75), .15, .9, .35, 14)
    spl = g._sstep(.66, .68, g.noise(10, 2, .5, 15, ax=4, ay=.6))
    return g.mix(g.m('MULTIPLY', spl, .8), col, lin((.3, .2, .12))), n
@use('The Old Knocker (floor): dark stone scratched with tally marks')
def knocker_stone(g):
    col, n = ph_tex(g, 'dark_rock_02', 2, (.5, .48, .48), .3, .55, .3, 16)
    t = g.m('MULTIPLY', g._sstep(.6, .62, g.noise(3, 1, .5, 17)), g.m('SUBTRACT', 1, g._sstep(.0, .3, g.m('ABSOLUTE', g.m('SINE', g.m('MULTIPLY', g.u, TAU * 60))))))
    return g.mix(g.m('MULTIPLY', t, .6), col, lin((.4, .38, .36))), n
@use('Lantern Oil (tutorial room floor): oil-stained planks')
def oil_planks(g):
    col, n = ph_tex(g, 'old_wood_floor', 1, (.6, .55, .5), .5, .7, .3, 18)
    return splotch(g, col, (.05, .04, .03), 4, .6, .55, 19), n
@use('walls (wallImg): black coal seam with glinting facets')
def coal_seam(g):
    col, n = ph_tex(g, 'dark_rock_02', 1, (.3, .3, .32), .2, .45, .2, 20)
    gl = g._sstep(.78, .8, g.noise(50, 1, .5, 21))
    return g.mix(g.m('MULTIPLY', gl, .7), col, lin((.4, .42, .45))), n
@use('trim (trimImg), pit props, beams: dark oily timber')
def mine_timber(g): return ph_tex(g, 'weathered_planks', 2, (.55, .45, .38), .5, .6, .35, 22, swap=True)
@use('rails, cart bodies, buckets: rusted iron')
def rail_iron(g): return ph_tex(g, 'rusty_metal', 2, (.6, .55, .5), .7, .65, .3, 23)
@use('crystals: glowing violet crystal facets')
def crystal_face(g):
    f = g.noise(6, 2, .4, 24, dist=3)
    col = g.mix(g._sstep(.3, .7, f), lin((.15, .05, .35)), lin((.65, .45, .95)))
    return col, g.bump(g._sstep(.45, .55, f), .7, .02)
