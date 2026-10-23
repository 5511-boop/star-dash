# Level 5: The Frozen Monastery: snow, frost, grey-blue stone, warm temple wood and faded prayer cloth.
@use('The Crevasse Field (floor): snow split by blue crevasse cracks')
def crevasse_snow(g):
    col, n = ph_tex(g, 'snow_02', 2, (.92, .95, 1), .6, 1.0, .1, 1)
    cr = ridge(g, 2.5, .009, 2, 4, dist=1)
    return g.mix(cr, col, lin((.1, .2, .32))), g.bump(g.m('MULTIPLY', cr, -1), .7, .03, n)
@use('The Prayer Flags (floor): frosted flagstones')
def flag_stones(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.75, .82, .95), .4, .9, .25, 3)
    return splotch(g, col, (.85, .9, .95), 5, .66, .55, 4), n
@use('The Meditation Hall (floor): woven reed mats')
def reed_mats(g): return reed_mat(g, (.5, .4, .22), 6, 5)
@use('The Frozen Lake (shore floor): trampled snow')
def lake_snow(g): return ph_tex(g, 'snow_02', 2, (.85, .9, .98), .5, .9, .2, 6)
@use('The Frozen Lake (the ice itself): dark clear ice, cracks and bubbles')
def lake_ice(g): return ice(g, (.04, .1, .18), (.45, .6, .72), 7)
@use('The Silent Library (floor): dark boards, frost creeping in at the edges')
def library_boards(g):
    col, n = ph_tex(g, 'old_wood_floor', 1, (.7, .65, .65), .6, .75, .3, 8)
    return splotch(g, col, (.8, .86, .92), 4, .7, .5, 9), n
@use('The Hot Springs (floor): wet dark cobbles, snow melted away')
def spring_stones(g):
    col, n = ph_tex(g, 'cobblestone_floor_04', 2, (.75, .78, .8), .55, .7, .2, 10)
    return splotch(g, col, (.03, .04, .05), 3, .6, .45, 11), n
@use('The Avalanche Run (floor): rough snow with rock poking through')
def avalanche_snow(g):
    sn, n = ph_tex(g, 'snow_02', 2, (.95, .97, 1), .5, 1.0, .1, 12)
    rk, _ = ph_tex(g, 'rocks_ground_04', 2, (.6, .65, .7), .3, .7, .1, 13)
    return g.mix(g._sstep(.58, .64, g.noise(4, 5, .65, 14)), sn, rk), n
@use('The Wraith Hunt (floor): black slate furred with frost ferns')
def wraith_slate(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.45, .5, .6), .3, .6, .25, 15)
    fern = g.m('MAXIMUM', ridge(g, 6, .02, 16, 5, dist=2), ridge(g, 12, .015, 17, 4, dist=2))
    return g.mix(g.m('MULTIPLY', fern, .7), col, lin((.75, .82, .9))), n
@use('The Boiler Pipes (floor): rusting iron plate, rimed with frost')
def boiler_plates(g):
    col, n = metal(g, (.22, .22, .24), 2, True, 18, .45, .3)
    return splotch(g, col, (.75, .8, .85), 5, .68, .45, 19), n
@use('Lantern Flash (tutorial room floor): blue-grey glazed tiles')
def glazed_tiles(g): return tiles(g, 6, (.32, .38, .45), (.26, .3, .36), 'random', (.12, .13, .15), seed=20)
@use('walls (wallImg): grey-blue stone with flaking white plaster and frost')
def monastery_wall(g):
    col, n = ph_tex(g, 'castle_wall_slates', 1, (.72, .78, .9), .35, .85, .3, 21)
    col = splotch(g, col, (.7, .7, .68), 3, .6, .4, 22)
    return splotch(g, col, (.85, .9, .95), 6, .7, .4, 23), n
@use('trim (trimImg): frosted pewter')
def frost_silver(g): return brass(g, (.5, .54, .6), 24, (.75, .82, .9))
@use('prayer flags, banners: faded five-colour cloth')
def prayer_cloth(g): return cloth_stripes(g, [(.2, .35, .6), (.85, .82, .75), (.65, .15, .12), (.2, .45, .25), (.8, .65, .2)], 5, 25)
