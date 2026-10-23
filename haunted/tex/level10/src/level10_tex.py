# Level 10: The Mirror Palace: lilac and silver, gilt, glass and tarnished mirror; cool and glittering.
@use('The Gilded Foyer (floor): white marble with gold veins')
def foyer_marble(g): return marble(g, (.72, .7, .7), (.65, .48, .18), 3, 1, second=(.66, .64, .66))
@use('The Reflecting Pool (floor): wet pale-blue glazed tiles')
def pool_tiles(g):
    col, n = tiles(g, 8, (.4, .52, .6), (.34, .45, .52), 'random', (.2, .24, .27), .03, .3, 2, .3)
    return splotch(g, col, (.15, .2, .25), 3, .6, .4, 3), n
@use('The Prism Hall (floor): glass tiles with a faint rainbow sheen')
def prism_glass(g):
    col, n = tiles(g, 6, (.3, .32, .4), (.36, .32, .42), 'random', (.5, .52, .58), .02, 0, 4, .2)
    hue = g.hsv(lin((.6, .3, .3)), g.m('MULTIPLY', g.noise(2, 2, .5, 5), 1.0), 1, 1)
    return g.mix(.2, col, hue, 'SCREEN'), n
@use('The Glass Maze (floor): black glass tiles')
def maze_glass(g): return tiles(g, 6, (.05, .05, .07), (.08, .08, .11), 'checker', (.3, .3, .34), .015, .3, 6, .25)
@use('The Vanity of Crowns (floor): gilded parquet')
def crowns_parquet(g): return ph_tex(g, 'herringbone_parquet', 2, (.95, .78, .55), .75, .75, .3, 7)
@use('The Shattering Floor (floor): cracked mirror floor')
def shatter_mirror(g): return mirror(g, (.6, .62, .68), 8, .9, .4)
@use('The Looking-Glass Gallery (floor): rose marble')
def rose_marble(g): return marble(g, (.55, .38, .38), (.75, .65, .6), 3, 9, second=(.5, .35, .36))
@use('The Haunted Mirrors (floor): dark grey marble, smudged handprints')
def haunted_marble(g):
    col, n = marble(g, (.12, .12, .14), (.35, .35, .4), 3, 10)
    return splotch(g, col, (.3, .3, .32), 14, .76, .4, 11, .03), n
@use('The Soul Exchange (floor): violet marble')
def soul_marble(g): return marble(g, (.18, .1, .25), (.55, .45, .65), 3, 12, second=(.22, .14, .3))
@use('The Mirror Queen (floor centrepiece, single image): silver starburst inlay')
def queen_star(g):
    cu, cv = g.m('SUBTRACT', g.u, .5), g.m('SUBTRACT', g.v, .5)
    ang = g.m('ARCTAN2', cv, cu); rad = g.m('SQRT', g.m('ADD', g.m('MULTIPLY', cu, cu), g.m('MULTIPLY', cv, cv)))
    rays = g._sstep(.6, .7, g.m('COSINE', g.m('MULTIPLY', ang, 16)))
    star = g.m('MULTIPLY', rays, g.m('SUBTRACT', 1, g._sstep(.25, .48, rad)))
    col, n = marble(g, (.15, .13, .2), (.4, .35, .5), 0, 13)
    col = g.mix(star, col, lin((.7, .72, .78)))
    ring = g.m('SUBTRACT', 1, g._sstep(.005, .01, g.m('ABSOLUTE', g.m('SUBTRACT', rad, .48))))
    return g.mix(ring, col, lin((.7, .52, .2))), g.bump(g.m('ADD', star, ring), .3, .01)
@use('Soul Swap (tutorial room floor): plain silver-grey tiles')
def silver_tiles(g): return tiles(g, 5, (.45, .45, .5), (.4, .4, .45), 'random', (.2, .2, .22), .02, .3, 14)
@use('walls (wallImg): lilac silk damask')
def palace_wall(g): return damask(g, (.3, .25, .4), (.55, .52, .62), 4, 15)
@use('trim (trimImg), frames: bright gilt')
def palace_gilt(g): return brass(g, (.8, .62, .26), 16, (.4, .38, .3))
@use('mirrors: old silvered glass with foxing')
def old_mirror(g): return mirror(g, (.75, .78, .84), 17, 0, .6)
