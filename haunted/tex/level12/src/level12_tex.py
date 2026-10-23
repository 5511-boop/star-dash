# Level 12: The Toy Factory: faded nursery pastels gone sickly, chipped paint, rubber belts and sawdust.
@use('The Wrapping Room (floor): faded pink and cream checker')
def wrap_checker(g): return tiles(g, 8, (.62, .42, .45), (.75, .68, .58), 'checker', (.3, .25, .25), .02, .4, 1, .4)
@use("Jack-in-the-Box Alley (floor): harlequin diamonds, red and mustard")
def jack_harlequin(g): return harlequin(g, (.32, .08, .08), (.45, .36, .16), 4, (.12, .08, .06), 2, .55)
@use('The Conveyor Floor (floor): ribbed black rubber belting')
def conveyor_rubber(g): return rubber(g, (.05, .05, .055), 24, 3)
@use('The Alphabet Blocks (floor): painted wooden squares in faded primaries')
def block_floor(g): return mosaic(g, [(.4, .14, .12), (.14, .22, .36), (.5, .42, .2), (.17, .3, .2), (.5, .45, .38)], 6, 4, (.2, .15, .1), .5)
@use('The Spinning Tops (floor): concentric ringed tiles')
def tops_rings(g): return rings(g, (.45, .2, .35), (.65, .55, .4), 3, 4, 5)
@use('The Dollhouse (floor): tiny pink-tinted parquet')
def dollhouse_parquet(g): return ph_tex(g, 'herringbone_parquet', 4, (1, .75, .75), .7, .9, .3, 6)
@use('The Ball Pit (floor): padded foam mats, faded blue and red')
def ballpit_mats(g): return tiles(g, 3, (.16, .22, .34), (.36, .13, .13), 'checker', (.08, .08, .1), .02, 0, 7, .45)
@use('The Clockwork Parade (floor): teal and brass tin checker')
def parade_tin(g):
    col, n = tiles(g, 6, (.1, .24, .24), (.42, .32, .15), 'checker', (.1, .1, .1), .015, .3, 8, .45)
    return splotch(g, col, (.4, .4, .42), 8, .72, .5, 9), n
@use('The Mouse Maze (floor): gnawed dark boards')
def mouse_boards(g):
    col, n = ph_tex(g, 'weathered_planks', 2, (.6, .55, .5), .5, .65, .35, 10)
    return splotch(g, col, (.03, .02, .02), 20, .78, .8, 11, .02), n
@use('The Toymaker (floor): workshop boards dusted with sawdust and shavings')
def workshop_boards(g):
    col, n = ph_tex(g, 'old_wood_floor', 1, (.95, .82, .65), .7, .95, .3, 12)
    return splotch(g, col, (.75, .6, .38), 14, .64, .6, 13), n
@use('Decoy (tutorial room floor): pastel mint tiles')
def mint_tiles(g): return tiles(g, 6, (.45, .6, .5), (.4, .55, .45), 'random', (.2, .22, .2), .02, .3, 14)
@use('walls (wallImg): faded striped nursery wallpaper, peeling')
def nursery_wall(g):
    col, n = cloth_stripes(g, [(.6, .45, .48), (.72, .66, .55), (.45, .5, .55), (.72, .66, .55)], 16, 15)
    return splotch(g, col, (.4, .34, .26), 3, .66, .7, 16), n
@use('trim (trimImg): chipped gold paint')
def chipped_gold(g):
    col, n = brass(g, (.75, .58, .22), 17, (.4, .36, .3))
    return splotch(g, col, (.35, .25, .18), 12, .7, .8, 18, .03), n
@use('gift boxes, wrapping: faded polka-dot paper')
def polka_paper(g):
    fu, fv, edge, cell = cells(g, 8)
    d = g.m('SQRT', g.m('ADD', g.m('MULTIPLY', g.m('SUBTRACT', fu, .5), g.m('SUBTRACT', fu, .5)), g.m('MULTIPLY', g.m('SUBTRACT', fv, .5), g.m('SUBTRACT', fv, .5))))
    col = g.mix(g.m('SUBTRACT', 1, g._sstep(.18, .2, d)), lin((.5, .15, .25)), lin((.85, .78, .62)))
    return grime(g, col, .4, 3, 19), g.bump(g.noise(40, 2, .5, 20), .1, .005)
@use('tin toys, drums: chipped red tin')
def red_tin(g):
    col, n = metal(g, (.45, .08, .07), 1, False, 21, 0, .4, (.5, .1, .08))
    return splotch(g, col, (.5, .5, .52), 10, .72, .7, 22, .03), n
@use('toy tables, billiard-style felt')
def toy_felt(g): return velvet(g, (.1, .25, .12), (.04, .1, .05), 23)
