# Level 20: The Heart of Hollow Manor: the manor come alive: crimson damask, dark oak, gold, and flesh beneath.
@use('The Grand Return (floor): the old ballroom checker marble, faded (an echo of Level 1)')
def return_checker(g): return tiles(g, 6, (.62, .58, .52), (.12, .04, .05), 'checker', (.25, .2, .15), .015, .6, 1, .5)
@use('The Heartbeat (floor): red veined flesh')
def heartbeat_flesh(g): return flesh(g, (.4, .06, .08), (.12, 0, .03), 2)
@use('The Gallery of Trials (floor): dark herringbone, old blood in the grain')
def trials_parquet(g):
    col, n = ph_tex(g, 'herringbone_parquet', 2, (.6, .4, .35), .7, .55, .3, 3)
    return splotch(g, col, (.2, .01, .02), 5, .7, .45, 4), n
@use('The Breathing Walls (floor): boards giving way to flesh')
def breathing_boards(g):
    wood, n = ph_tex(g, 'dark_wooden_planks', 2, (.7, .5, .45), .7, .7, .3, 5)
    fl, _ = flesh(g, (.35, .05, .07), (.1, 0, .03), 6)
    return g.mix(g._sstep(.55, .65, g.noise(3, 5, .6, 7)), wood, fl), n
@use('The Haunted Banquet (floor): wine carpet, spilled wine and crumbs')
def banquet_carpet(g):
    col, n = velvet(g, (.25, .03, .07), (.1, .01, .03), 8, (.5, .38, .14), 4)
    col = splotch(g, col, (.08, .0, .02), 5, .7, .6, 9)
    return splotch(g, col, (.5, .4, .25), 40, .8, .6, 10, .02), n
@use('The Letters of HOLLOW (floor): cracked encaustic tiles')
def letter_tiles(g): return tiles(g, 10, (.45, .38, .28), (.18, .1, .08), 'checker', (.08, .06, .05), .03, .8, 11, .45)
@use('The Ghost Choir (floor): cold chapel flagstones, rimed with frost')
def choir_flags(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.7, .72, .85), .3, .75, .3, 12)
    return splotch(g, col, (.8, .85, .95), 5, .68, .5, 13), n
@use("The Lord's Study (floor): dark oak boards")
def study_oak(g): return ph_tex(g, 'old_wood_floor', 1, (.6, .45, .38), .7, .6, .3, 14)
@use("The Heart's Chamber (floor): glowing red flesh, veins lit from within")
def heart_chamber(g):
    col, n = flesh(g, (.5, .07, .07), (1, .25, .15), 15)
    return col, n
@use('The Manor Lord (floor): black marble with red veins')
def lord_marble(g): return marble(g, (.04, .03, .035), (.5, .05, .06), 3, 16, second=(.07, .05, .06))
@use('Soul Blast (tutorial room floor): plain dark slate')
def soul_slate(g): return ph_tex(g, 'rock_tile_floor', 2, (.5, .45, .5), .3, .55, .3, 17)
@use('walls (wallImg): crimson damask, peeling to the plaster')
def manor_wall(g): return damask(g, (.25, .03, .06), (.5, .35, .14), 4, 18, peel=.8)
@use('trim (trimImg), frames, candelabra: old gold')
def manor_gold(g): return brass(g, (.7, .52, .2), 19, (.3, .26, .18))
@use('the breathing walls, the heart: living flesh')
def flesh_wall(g): return flesh(g, (.38, .05, .07), (.1, 0, .03), 20)
@use('furniture, panelling: dark oak')
def manor_oak(g): return ph_tex(g, 'dark_wooden_planks', 2, (.75, .55, .45), .8, .75, .3, 21, swap=True)
