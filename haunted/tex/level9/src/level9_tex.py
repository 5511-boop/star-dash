# Level 9: The Ruined Cathedral: grey-violet stone, rubble and dust, faded mosaics, warm glass light.
@use('The Collapsed Nave (floor): flagstones under fallen rubble')
def nave_flags(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.75, .72, .8), .35, .85, .35, 1)
    rub, _ = ph_tex(g, 'rocks_ground_04', 3, (.75, .72, .75), .3, .9, 0, 2)
    return g.mix(g._sstep(.6, .7, g.noise(3, 5, .6, 3)), col, rub), n
@use('The Gargoyle Gallery (floor): worn grey cobbles')
def gallery_cobble(g): return ph_tex(g, 'cobblestone_floor_04', 2, (.7, .7, .75), .25, .8, .3, 4)
@use('The Grapple Relay (floor): tomb slabs with carved inscriptions')
def tomb_slabs(g):
    col, n = blocks(g, 2, 2, (.42, .4, .44), (.1, .09, .1), 5, .2, .35, .02)
    return glyphs(g, col, 8, 6, 6)[0], n
@use('The Swinging Censers (floor): faded Byzantine mosaic')
def censer_mosaic(g): return mosaic(g, [(.55, .45, .25), (.35, .12, .1), (.2, .25, .35), (.6, .55, .45), (.15, .1, .08)], 28, 7)
@use('The Bat Belfry (floor): boards white with guano')
def belfry_guano(g):
    col, n = ph_tex(g, 'old_wood_floor', 1, (.75, .7, .7), .5, .8, .3, 8)
    return splotch(g, col, (.6, .6, .55), 9, .68, .7, 9, .05), n
@use('The Holy Water Font (floor): wet flagstones and puddles')
def font_wet(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.6, .62, .7), .3, .6, .25, 10)
    return splotch(g, col, (.04, .05, .07), 3, .6, .6, 11, .03), n
@use('The Rotating Reliquary (floor): red and grey inlaid marble')
def reliquary_marble(g): return marble(g, (.35, .1, .1), (.6, .55, .5), 4, 12, second=(.4, .38, .4))
@use('The Collapsing Aisle (floor): cracked, dusty broken stone')
def aisle_rubble(g):
    col, n = ph_tex(g, 'rocks_ground_04', 2, (.8, .78, .8), .2, 1.0, .35, 13)
    return splotch(g, col, (.6, .58, .55), 4, .6, .4, 14), n
@use('The Fallen Statues (floor): pale marble, thick with dust')
def statue_dust(g):
    col, n = marble(g, (.6, .58, .55), (.35, .33, .32), 3, 15)
    return splotch(g, col, (.55, .52, .48), 3, .55, .5, 16), n
@use('The Gargoyle King (floor): dark carved stone, stained rust-red')
def king_stone(g):
    col, n = ph_tex(g, 'castle_wall_slates', 2, (.45, .38, .42), .4, .6, .35, 17)
    return splotch(g, col, (.25, .05, .04), 4, .66, .5, 18), n
@use('Grapple (tutorial room floor): plain worn flagstones')
def plain_flags(g): return ph_tex(g, 'rock_tile_floor', 2, (.8, .78, .85), .3, .95, .3, 19)
@use('walls (wallImg): grey-violet cathedral stone')
def cathedral_wall(g): return ph_tex(g, 'castle_wall_slates', 1, (.72, .68, .8), .3, .8, .35, 20)
@use('trim (trimImg), railings, lamps: wrought iron')
def wrought_iron(g): return metal(g, (.08, .08, .09), 1, False, 21, .35, .2)
@use('stained-glass windows: warm leaded glass (glows)')
def stained_glass(g):
    P = [(.95, .6, .12), (.75, .12, .1), (.98, .78, .3), (.25, .3, .7), (.6, .08, .12), (.2, .5, .35)]
    col, n = mosaic(g, P, 9, 22, (.03, .03, .03), .1)
    return col, n
@use('pews, doors: dark oak')
def pew_oak(g): return ph_tex(g, 'dark_wooden_planks', 2, (.8, .7, .62), .7, .9, .3, 23, swap=True)
