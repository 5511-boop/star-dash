# Level 19: The Dream Realm: lilac and midnight, soft clouds, starry wallpaper, patterns that don't quite add up.
@use('The Waking Door (floor): lilac cloud')
def waking_clouds(g): return clouds(g, (.32, .27, .5), (.72, .65, .85), 1)
@use('The Endless Hallway (floor): repeating violet runner')
def hallway_runner(g): return velvet(g, (.16, .08, .28), (.06, .03, .12), 2, (.55, .5, .7), 6)
@use('The Twin Clocks (floor): black and lilac checker, slightly melted')
def clock_checker(g):
    col, n = tiles(g, 8, (.08, .06, .12), (.55, .48, .68), 'checker', (.2, .18, .25), .015, 0, 3, .3)
    return col, g.bump(g.noise(3, 3, .6, 4, dist=2), .3, .03, n)
@use('The Nightmare Nursery (floor): faded rug of moons and stars')
def nursery_moons(g):
    col, n = stars(g, (.12, .1, .2), (.8, .75, .55), 5, False, (.2, .15, .3))
    return grime(g, faded(g, col, .7, 1.2), .4, 3, 6), weave(g, 8, .5)
@use('The Dream Heist (floor): pastel marble')
def heist_marble(g): return marble(g, (.6, .55, .66), (.85, .75, .8), 3, 7, second=(.55, .6, .68))
@use('The Penrose Stairs (floor): impossible tumbling-block tiles')
def penrose_tiles(g):
    col, n = harlequin(g, (.35, .3, .45), (.18, .15, .25), 3, (.6, .55, .75), 8, .3)
    sh = g._sstep(.0, 1, g.fract(g.m('MULTIPLY', g.u, 6)))
    return g.mix(g.m('MULTIPLY', sh, .25), col, lin((.05, .04, .08))), n
@use('The Shadow Self (floor): ink-dark floor with silver ripples')
def shadow_ripple(g):
    d = g.noise(3, 3, .5, 9, dist=2)
    rip = g.m('SINE', g.m('MULTIPLY', d, 40))
    col = g.mix(g._sstep(.9, 1, rip), lin((.03, .025, .05)), lin((.45, .45, .55)))
    return col, g.bump(rip, .2, .01)
@use('The Hourglass (floor): pale lilac sand')
def hourglass_sand(g): return ph_tex(g, 'sand_02', 2, (.85, .75, 1), .5, 1.4, .15, 10)
@use('The Sleepwalkers (floor): pastel patchwork quilt')
def sleep_quilt(g):
    col, n = mosaic(g, [(.55, .45, .65), (.45, .55, .65), (.65, .5, .55), (.5, .6, .5), (.6, .58, .45)], 6, 11, (.85, .82, .78), .3)
    return col, weave(g, 10, .6)
@use('The Nightmare King (floor): deep purple obsidian with star specks')
def king_obsidian(g):
    n = g.noise(3, 4, .5, 12, dist=1)
    col = g.mix(g._sstep(.4, .7, n), lin((.02, .01, .04)), lin((.15, .06, .22)))
    s = g._sstep(.8, .82, g.noise(70, 1, .5, 13))
    return g.mix(s, col, lin((.8, .75, 1))), g.bump(n, .2, .01)
@use('Rewind (tutorial room floor): starfield')
def rewind_stars(g): return stars(g, (.04, .03, .1), (.9, .85, 1), 14, True, (.2, .1, .3))
@use('walls (wallImg): lilac wallpaper of moons and stars')
def dream_wall(g):
    col, n = damask(g, (.28, .22, .4), (.6, .55, .75), 3, 15)
    s = g._sstep(.82, .84, g.noise(40, 1, .5, 16))
    return g.mix(s, col, lin((.85, .8, .6))), n
@use('trim (trimImg): lavender silver')
def lavender_silver(g): return brass(g, (.55, .5, .65), 17, (.4, .35, .5))
@use('moons, lamps: pale glowing moon surface')
def moon_surface(g):
    n = g.noise(6, 5, .6, 18)
    col = g.mix(g._sstep(.3, .7, n), lin((.6, .58, .5)), lin((.9, .88, .8)))
    cr = g._sstep(.72, .76, g.noise(10, 2, .5, 19))
    return g.mix(g.m('MULTIPLY', cr, .5), col, lin((.45, .42, .38))), g.bump(g.m('SUBTRACT', n, cr), .4, .02)
@use('cloud props, pillows')
def pillow_cloud(g): return clouds(g, (.6, .58, .7), (.95, .93, 1), 20, 1)
