# Level 17: The Abyssal Depths: deep teal and black, silt, barnacles, bone and bioluminescence.
def biolume(g, col, c=(.3, .9, .9), scale=50, th=.8, seed=0):
    s = g._sstep(th, th + .02, g.noise(scale, 1, .5, seed))
    return g.mix(s, col, lin(c))

@use('The Diving Bell (floor): riveted copper-iron bell plate')
def bell_plate(g): return metal(g, (.25, .2, .14), 2, True, 1, .3, .3, (.2, .3, .28))
@use('The Kelp Forest (floor): dark silt and kelp holdfasts')
def kelp_silt(g):
    col, n = ph_tex(g, 'sand_02', 2, (.45, .65, .5), .6, .8, .2, 2)
    return splotch(g, col, (.06, .14, .06), 7, .66, .7, 3), n
@use("The Anglerfish Lair (floor): black rock with lure-light flecks")
def angler_rock(g):
    col, n = ph_tex(g, 'dark_rock_02', 1, (.35, .45, .55), .5, .75, .2, 4)
    return biolume(g, col, (.9, .7, .3), 60, .82, 5), n
@use('The Jellyfish Bloom (floor): pale silt glowing faintly blue')
def jelly_silt(g):
    col, n = ph_tex(g, 'sand_02', 2, (.6, .78, .95), .5, 1.2, .15, 6)
    col = splotch(g, col, (.3, .5, .7), 3, .6, .35, 7)
    return biolume(g, col, (.5, .8, 1), 40, .8, 8), n
@use('The Sunken Galleon (floor): waterlogged deck with barnacles')
def galleon_deck(g):
    col, n = ph_tex(g, 'dark_wooden_planks', 2, (.6, .7, .62), .6, .9, .3, 9)
    return splotch(g, col, (.45, .45, .42), 14, .74, .7, 10, .03), n
@use('The Searchlight (floor): grey rippled silt')
def search_silt(g):
    col, n = ph_tex(g, 'sand_02', 2, (.65, .68, .7), .25, 1.15, .15, 11)
    rip = g.m('SINE', g.m('ADD', g.m('MULTIPLY', g.u, TAU * 10), g.m('MULTIPLY', g.noise(3, 2, .5, 12), 4)))
    return g.mix(g.m('MULTIPLY', g._sstep(.3, 1, rip), .25), col, g.hsv(col, .5, 1, 1.4)), g.bump(rip, .4, .02, n)
@use('The Whirlpool (floor): silt swirled into spirals')
def whirl_silt(g):
    sw = g.noise(2, 4, .6, 13, dist=6)
    col = g.mix(g._sstep(.3, .7, sw), lin((.05, .16, .2)), lin((.25, .45, .48)))
    return grime(g, col, .3, 3, 14), g.bump(sw, .4, .02)
@use('The Trench (floor): cracked blue-black trench rock')
def trench_rock(g):
    col, n = ph_tex(g, 'rock_face_03', 1, (.3, .42, .6), .6, .7, .2, 15)
    cr = ridge(g, 3, .015, 16, 4)
    return g.mix(cr, col, lin((.01, .02, .03))), n
@use('The Ink Cloud (floor): black silt in drifting ink')
def ink_silt(g):
    col, n = ph_tex(g, 'sand_02', 2, (.2, .22, .28), .3, .35, .1, 17)
    return splotch(g, col, (.005, .005, .01), 2.5, .5, .8, 18, .2), n
@use('The Leviathan (floor): seabed scattered with old bone')
def bone_seabed(g):
    col, n = ph_tex(g, 'sand_02', 2, (.5, .6, .58), .4, .85, .2, 19)
    bone = g._sstep(.68, .7, g.noise(8, 2, .5, 20, ax=3, ay=.8))
    return g.mix(g.m('MULTIPLY', bone, .85), col, lin((.62, .6, .52))), n
@use('Shadow Step (tutorial room floor): sunken, algae-dark stone tiles')
def sunken_tiles(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.4, .6, .55), .5, .8, .3, 21)
    return splotch(g, col, (.05, .12, .08), 5, .6, .6, 22), n
@use('walls (wallImg): deep teal rock face')
def abyss_wall(g):
    col, n = ph_tex(g, 'rock_face_03', 1, (.3, .5, .55), .6, .7, .25, 23)
    return biolume(g, col, (.35, .9, .85), 45, .83, 24), n
@use('trim (trimImg), pipes, portholes: barnacled verdigris copper')
def abyss_copper(g):
    col, n = brass(g, (.45, .3, .16), 25, (.2, .45, .4))
    return splotch(g, col, (.55, .55, .5), 16, .74, .7, 26, .03), n
@use('coral growths')
def coral(g):
    n = g.noise(10, 4, .5, 27, dist=2)
    col = g.mix(g._sstep(.35, .65, n), lin((.35, .08, .12)), lin((.75, .35, .3)))
    return biolume(g, col, (.95, .6, .5), 40, .8, 28), g.bump(n, .8, .03)
@use('wrecks, anchors, chains: barnacle-crusted rusty iron')
def barnacle_iron(g):
    col, n = ph_tex(g, 'rusty_metal', 2, (.5, .55, .5), .6, .6, .3, 29)
    return splotch(g, col, (.5, .5, .46), 18, .72, .8, 30, .03), n
