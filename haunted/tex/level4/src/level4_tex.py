# Level 4: The Sunken Lighthouse: salt, algae, wet sand, verdigris and rust; cold sea greens.
@use('The Pier (floor): salt-grey boards, green slime at the seams')
def pier_boards(g):
    col, n = ph_tex(g, 'weathered_planks', 2, (.75, .8, .8), .45, 1.0, .3, 1)
    return splotch(g, col, (.12, .22, .1), 5, .64, .6, 2), n
@use('Tide Pools (floor): pale wet sand with pools and shell grit')
def tide_sand(g):
    col, n = ph_tex(g, 'sand_02', 2, (1, .95, .85), .7, 1.5, .15, 3)
    col = splotch(g, col, (.12, .16, .17), 3, .62, .75, 4, .02)
    grit = g._sstep(.78, .8, g.noise(70, 1, .5, 5))
    return g.mix(g.m('MULTIPLY', grit, .8), col, lin((.85, .82, .75))), n
@use('The Rowboat (floor): flaking sea-green boat paint')
def rowboat_planks(g): return planks_painted(g, (.35, .62, .58), 2, 6)
@use('The Listing Deck (floor): dark deck planks crusted with salt')
def ship_deck(g):
    col, n = ph_tex(g, 'dark_wooden_planks', 2, (.8, .8, .78), .6, 1.1, .3, 7)
    return splotch(g, col, (.6, .62, .6), 7, .68, .55, 8), n
@use('Eel Alley (floor): wet black rock and weed')
def eel_rocks(g):
    col, n = ph_tex(g, 'rocks_ground_04', 2, (.55, .65, .6), .5, .6, .2, 9)
    return splotch(g, col, (.05, .12, .06), 6, .6, .7, 10), n
@use('The Bilge (floor): rusted hull plate under oily water')
def bilge_metal(g):
    col, n = ph_tex(g, 'rusty_metal', 2, (.7, .7, .65), .8, .8, .3, 11)
    return splotch(g, col, (.05, .06, .05), 3, .6, .6, 12, .02), n
@use('The Flood Valves (floor): riveted iron, chipped green paint')
def valve_plates(g): return metal(g, (.16, .24, .2), 2, True, 13, .55, .3, (.25, .32, .28))
@use('The Fog Banks (floor): grey sand and shingle')
def fog_shingle(g):
    col, n = ph_tex(g, 'rocks_ground_04', 3, (.8, .82, .85), .3, .9, .2, 14)
    sand, _ = ph_tex(g, 'sand_02', 2, (.85, .85, .85), .4, 1.1, 0, 15)
    return g.mix(g._sstep(.45, .6, g.noise(3, 4, .6, 16)), col, sand), n
@use('The Lamp Room (floor): cast-iron tread plate')
def lamp_tread(g): return tread(g, (.2, .24, .26), 10, 17, .35)
@use('Dash (tutorial room floor): bleached jetty boards')
def jetty_boards(g): return ph_tex(g, 'old_wood_floor', 1, (.85, .9, .9), .35, 1.3, .25, 18)
@use('walls (wallImg): barnacled stone, salt bloom and algae')
def sea_wall(g):
    col, n = ph_tex(g, 'castle_wall_slates', 1, (.6, .78, .78), .5, .8, .35, 19)
    col = splotch(g, col, (.08, .2, .12), 4, .6, .6, 20)
    return splotch(g, col, (.7, .72, .7), 6, .7, .5, 21), n
@use('trim (trimImg), lamp housing, fittings: verdigris copper')
def verdigris(g): return brass(g, (.5, .32, .18), 22, (.22, .48, .4))
@use('rope coils, mooring lines')
def rope(g):
    tw = g.m('SINE', g.m('MULTIPLY', g.m('ADD', g.u, g.v), TAU * 24))
    col = g.mix(g._sstep(-.5, .6, tw), lin((.25, .2, .12)), lin((.6, .5, .32)))
    col = grime(g, col, .4, 3, 23)
    return col, g.bump(tw, .6, .01)
@use('buoys, life rings: faded red and white bands')
def buoy_stripes(g): return cloth_stripes(g, [(.7, .15, .12), (.85, .82, .75)], 6, 24, 'v')
