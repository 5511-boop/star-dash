# Level 18: The Volcano Forge: black basalt and soot, glowing lava cracks, fire brick, obsidian and hot iron.
@use('The Cracked Gate (floor): basalt with thin glowing cracks')
def gate_basalt(g): return lava_rock(g, 'dark_rock_02', 1, (1, .4, .08), 1, .012)
@use('The Hammer Hall (floor): sooty iron plates')
def hammer_iron(g):
    col, n = metal(g, (.13, .12, .12), 2, True, 2, .25, .3)
    return splotch(g, col, (.02, .02, .02), 3, .6, .5, 3), n
@use('The Magma Channels (floor): cooled crust over bright magma')
def channel_crust(g): return lava_rock(g, 'rocks_ground_04', 2, (1, .5, .1), 4, .035, (.45, .4, .4))
@use('The Elemental Furnace (floor): scorched fire brick')
def furnace_brick(g):
    col, n = ph_tex(g, 'brick_pavement_02', 2, (1, .55, .4), .8, .7, .3, 5)
    return scorch(g, col, 6, .7), n
@use('The Powder Kegs (floor): sooty boards with black powder spills')
def keg_boards(g):
    col, n = ph_tex(g, 'old_wood_floor', 1, (.7, .6, .5), .6, .65, .35, 7)
    return splotch(g, col, (.03, .03, .03), 9, .7, .8, 8, .03), n
@use('The Crucible (floor): splattered slag and spilled metal')
def crucible_slag(g):
    col, n = ph_tex(g, 'dark_rock_02', 2, (.5, .45, .45), .3, .5, .2, 9)
    sp = g._sstep(.66, .68, g.noise(7, 4, .65, 10, dist=1))
    return g.mix(sp, col, lin((.55, .52, .5))), g.bump(sp, .4, .01, n)
@use('The Obsidian Maze (floor): glossy black obsidian, purple sheen')
def obsidian_floor(g):
    n = g.noise(3, 4, .5, 11, dist=1)
    col = g.mix(g._sstep(.4, .7, n), lin((.01, .01, .015)), lin((.08, .05, .12)))
    con = g.m('MAXIMUM', ridge(g, 4, .01, 12, 2), ridge(g, 9, .006, 13, 2))
    return g.mix(g.m('MULTIPLY', con, .5), col, lin((.25, .2, .3))), g.bump(con, .3, .01)
@use('The Eruption (floor): heavily cracked, lava breaking through')
def eruption_floor(g): return lava_rock(g, 'dark_rock_02', 1, (1, .55, .12), 14, .05)
@use("The Smith's Anvil (floor): dark stone hearth slabs")
def hearth_stone(g):
    col, n = blocks(g, 3, 3, (.16, .14, .13), (.05, .04, .04), 15, .2, .4, .02)
    return scorch(g, col, 16, .5), n
@use('The Forge Titan (floor): huge riveted black iron with glowing seams')
def titan_plates(g):
    col, n = metal(g, (.08, .075, .075), 2, True, 17, .1, .2)
    fu, fv, edge, cell = cells(g, 2)
    seam = g.m('SUBTRACT', 1, g._sstep(.005, .02, edge))
    return g.mix(seam, col, lin((1, .4, .08))), n
@use('Bombs (tutorial room floor): grey ash ground')
def ash_ground(g): return ph_tex(g, 'dirt_floor', 2, (.55, .52, .5), .1, .75, .25, 18)
@use('walls (wallImg): charred black rock with ember glints')
def forge_wall(g):
    col, n = ph_tex(g, 'dark_rock_02', 1, (.4, .36, .36), .3, .45, .25, 19)
    em = g._sstep(.8, .82, g.noise(40, 1, .5, 20))
    return g.mix(em, col, lin((1, .45, .1))), n
@use('trim (trimImg): heat-scaled iron')
def hot_iron(g):
    col, n = metal(g, (.12, .1, .1), 1, False, 21, .2, .3)
    return splotch(g, col, (.35, .15, .35), 3, .6, .4, 22), n
@use('lava pools, molten metal (pair with an emissive tint)')
def lava(g):
    n = g.noise(3, 6, .65, 23, dist=2)
    col = g.mix(g._sstep(.25, .75, n), lin((.5, .05, .0)), lin((1, .65, .15)))
    crust = g._sstep(.62, .7, g.noise(5, 4, .6, 24))
    return g.mix(crust, col, lin((.06, .03, .02))), g.bump(crust, .5, .02)
@use('obsidian pillars, props: conchoidal faceted glass')
def obsidian(g):
    f = g.noise(5, 2, .4, 25, dist=3)
    col = g.mix(g._sstep(.4, .6, f), lin((.01, .01, .02)), lin((.12, .08, .18)))
    return col, g.bump(g._sstep(.45, .55, f), .8, .02)
