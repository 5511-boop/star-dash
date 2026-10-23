# Level 3: The Clocktower: old oak, slate, brass gearwork, a star chart, dust everywhere.
USES = {}
def use(room):
    def deco(f): USES[f.__name__] = room; return recipe(f)
    return deco

@use('The Clock Face (floor)')
def clock_wood(g): return ph_tex(g, 'dark_wooden_planks', 2, (.95, .78, .6), .9, 1.15, .3, 1)
@use('The Echo Chamber (floor)')
def echo_slate(g): return ph_tex(g, 'rock_tile_floor', 2, (.6, .7, .9), .5, .7, .3, 3)
@use('The Gear Works (floor)')
def gear_plates(g): return metal(g, (.42, .34, .2), 2, True, 4, .35, .3, (.5, .42, .3))
@use('The Broken Bridge (floor): gappy, split planks')
def bridge_planks(g): return ph_tex(g, 'weathered_planks', 2, (.8, .7, .6), .6, .9, .35, 13)
@use('The Memory Hall (floor)')
def memory_marble(g): return marble(g, (.08, .07, .1), (.42, .36, .5), 4, 5, second=(.12, .1, .14))
@use('The Dowsing Garden (floor)')
def garden_cobble(g): return ph_tex(g, 'mossy_cobblestone', 2, (.7, .8, .7), .7, .75, .3, 6)
@use('The Bell Tower (floor): boards streaked with old bird droppings and rope burns')
def belfry_boards(g):
    col, nrm = ph_tex(g, 'old_wood_floor', 1, (.85, .8, .72), .7, .95, .3, 14)
    spl = g._sstep(.74, .78, g.noise(12, 3, .5, 15))
    return g.mix(g.m('MULTIPLY', spl, .7), col, lin((.6, .58, .52))), nrm
@use('The Lamp Room (floor)')
def lamp_grate(g): return ph_tex(g, 'metal_grate_rusty', 2, (.75, .72, .7), .6, 1.0, .25, 7)
@use('The Star Chart (floor)')
def star_chart(g): return stars(g, (.03, .04, .13), (.95, .88, .65), 8)
@use('The Clock Heart (floor)')
def heart_brass(g): return metal(g, (.5, .36, .16), 3, True, 9, .2, .4, (.6, .45, .22))
@use('walls (wallImg): dark walnut boards running up the tower')
def clock_wall(g): return ph_tex(g, 'dark_wooden_planks', 2, (.85, .6, .45), .85, 1.0, .35, 2, swap=True)
@use('trim (trimImg), rails, gear rims')
def brass_trim(g): return brass(g, (.6, .45, .2), 10)
@use('clock dial (single image, not tiled): clock faces, hands-on dials')
def clock_face(g): return dial(g, (.8, .74, .6), (.07, .06, .05), (.55, .4, .18), 11)
@use('bells, bronze props')
def bell_bronze(g): return brass(g, (.42, .28, .14), 12, (.18, .32, .26))
