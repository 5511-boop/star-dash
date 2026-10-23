# Level 8: The Opera House: crimson and gold, gilt and dust, black stage boards, velvet everywhere.
@use('The Grand Lobby (floor): cream marble with gold veins')
def lobby_marble(g): return marble(g, (.62, .55, .44), (.6, .45, .18), 3, 1, second=(.55, .48, .38))
@use('Musical Statues (floor): honey parquet')
def statue_parquet(g): return ph_tex(g, 'herringbone_parquet', 2, (.95, .8, .65), .8, .9, .3, 2)
@use('The Fly Gallery (floor): steel catwalk grating')
def fly_catwalk(g): return ph_tex(g, 'metal_grate_rusty', 3, (.55, .55, .6), .3, .7, .25, 3)
@use('The Spotlight Booth (floor): black-painted boards with spike tape')
def spotlight_boards(g):
    col, n = ph_tex(g, 'dark_wooden_planks', 2, (.4, .38, .38), .4, .6, .3, 4)
    return board_marks(g, col, 5, (.75, .62, .2), 3), n
@use('The Orchestra Pit (floor): dark boards strewn with sheet music')
def pit_floor(g):
    col, n = ph_tex(g, 'old_wood_floor', 1, (.6, .5, .45), .6, .7, .3, 6)
    sheet = g._sstep(.71, .72, g.noise(6, 1, .5, 7, ax=1.4, ay=1))
    return g.mix(g.m('MULTIPLY', sheet, .85), col, lin((.75, .7, .6))), n
@use('The Trapdoor Stage (floor): stage boards with trapdoor outlines')
def trapdoor_stage(g):
    col, n = ph_tex(g, 'dark_wooden_planks', 2, (.6, .52, .48), .6, .8, .3, 8)
    fu, fv, edge, cell = cells(g, 3)
    out = g.m('SUBTRACT', 1, g._sstep(.004, .01, g.m('ABSOLUTE', g.m('SUBTRACT', edge, .12))))
    return g.mix(out, col, lin((.03, .02, .02))), g.bump(g.m('MULTIPLY', out, -1), .6, .01, n)
@use('The Masquerade (floor): black and white marble checker, cracked')
def masque_checker(g): return tiles(g, 6, (.7, .68, .64), (.05, .05, .06), 'checker', (.3, .28, .25), .015, .7, 9, .3)
@use('The Chandelier Hall (floor): crimson carpet, gold pattern')
def chandelier_carpet(g): return velvet(g, (.32, .03, .06), (.12, .01, .03), 10, (.6, .45, .15), 4)
@use('The Organ Loft (floor): threadbare plum carpet')
def organ_carpet(g): return velvet(g, (.18, .05, .14), (.07, .02, .06), 11)
@use('The Final Act (floor): scorched stage boards')
def final_stage(g):
    col, n = ph_tex(g, 'dark_wooden_planks', 2, (.7, .6, .5), .7, .85, .3, 12)
    return scorch(g, col, 13, .85), n
@use('Ghost Sight (tutorial room floor): faded red runner on black boards')
def runner_floor(g):
    col, n = ph_tex(g, 'dark_wooden_planks', 2, (.45, .42, .4), .4, .6, .3, 14)
    run, _ = velvet(g, (.3, .04, .06), (.12, .01, .03), 15)
    band = g.m('SUBTRACT', 1, g._sstep(.25, .26, g.m('ABSOLUTE', g.m('SUBTRACT', g.u, .5))))
    return g.mix(band, col, run), n
@use('walls (wallImg): crimson and gold damask, water-stained')
def opera_wall(g): return damask(g, (.28, .04, .07), (.55, .38, .14), 4, 16)
@use('trim (trimImg), boxes, frames: gilt')
def gilt(g): return brass(g, (.75, .56, .22), 17, (.35, .3, .2))
@use('stage curtains: crimson velvet folds')
def opera_curtain(g):
    wav = g.m('SINE', g.m('ADD', g.m('MULTIPLY', g.u, TAU * 8), g.m('MULTIPLY', g.noise(3, 2, .5, 18), 2.5)))
    fold = g.m('MULTIPLY', g.m('ADD', wav, 1), .5)
    col = g.mix(fold, lin((.1, .0, .02)), lin((.45, .03, .07)))
    col = splotch(g, col, (.35, .28, .25), 8, .72, .35, 19)
    return grime(g, col, .2, 2, 20), g.bump(fold, .45, .05, weave(g, 10, .35))
@use('theatre seats: worn red plush')
def seat_red(g): return velvet(g, (.35, .05, .07), (.14, .02, .03), 21)
