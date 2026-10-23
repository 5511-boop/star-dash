# Level 7: The Ghost Train: soot, wet brick, carriage carpet and mahogany, rust and coal.
@use('Platform 13 (floor): wet, sooty platform bricks')
def platform_bricks(g):
    col, n = ph_tex(g, 'brick_pavement_02', 2, (.7, .65, .65), .5, .7, .35, 1)
    return splotch(g, col, (.04, .04, .05), 3, .62, .45, 2), n
@use('Ticket Inspection (floor): carriage carpet, wine with a gold lozenge')
def inspection_carpet(g): return velvet(g, (.3, .05, .08), (.12, .02, .04), 3, (.55, .4, .15), 6)
@use('The Roof Run (floor): corrugated, rusted carriage roof')
def roof_tin(g): return ph_tex(g, 'rusty_metal', 2, (.75, .7, .7), .7, .8, .25, 4)
@use('The Switching Yard (floor): oily ballast gravel')
def yard_gravel(g):
    col, n = ph_tex(g, 'rocks_ground_04', 3, (.7, .68, .66), .3, .7, .3, 5)
    return splotch(g, col, (.03, .03, .03), 4, .62, .5, 6), n
@use('The Baggage Car (floor): scuffed rough boards')
def baggage_boards(g): return ph_tex(g, 'old_wood_floor', 1, (.85, .75, .65), .7, .9, .4, 7)
@use('The Engine Room (floor): sooty tread plate')
def engine_tread(g):
    col, n = tread(g, (.2, .19, .18), 10, 8, .2)
    return splotch(g, col, (.02, .02, .02), 3, .55, .6, 9), n
@use('The Dining Car (floor): parquet with old wine stains')
def dining_parquet(g):
    col, n = ph_tex(g, 'herringbone_parquet', 2, (.8, .6, .5), .7, .75, .3, 10)
    return splotch(g, col, (.25, .03, .05), 5, .7, .45, 11), n
@use('The Mail Car (floor): cracked green linoleum')
def mail_lino(g): return tiles(g, 8, (.2, .3, .24), (.16, .24, .2), 'checker', (.1, .12, .1), .02, .6, 12)
@use('The Coupling (floor): oily coupling plate')
def coupling_plate(g):
    col, n = ph_tex(g, 'metal_plate_02', 2, (.75, .75, .8), .5, .75, .3, 13)
    return splotch(g, col, (.03, .03, .04), 4, .6, .45, 14), n
@use('Ping (tutorial room floor): faded blue carriage carpet')
def ping_carpet(g): return velvet(g, (.08, .12, .25), (.03, .05, .1), 15, (.4, .35, .2), 5)
@use('walls (wallImg): mahogany carriage panelling')
def carriage_panels(g): return ph_tex(g, 'dark_wooden_planks', 3, (.9, .55, .45), 1.0, 1.0, .35, 16, swap=True)
@use('trim (trimImg), luggage racks, lamps: dull brass')
def train_brass(g): return brass(g, (.55, .42, .2), 17)
@use('carriage seats: worn green plush')
def seat_plush(g): return velvet(g, (.1, .22, .14), (.04, .09, .05), 18)
@use('trunks, suitcases: scuffed leather')
def luggage_leather(g):
    n = g.noise(25, 5, .7, 19, dist=.5)
    col = g.mix(g._sstep(.3, .7, n), lin((.15, .07, .03)), lin((.3, .16, .08)))
    col = splotch(g, col, (.4, .3, .22), 6, .7, .5, 20)
    return grime(g, col, .35, 3, 21), g.bump(n, .3, .01)
@use('the engine boiler, firebox: soot-black iron, heat-blued')
def boiler_iron(g):
    col, n = metal(g, (.1, .1, .12), 2, True, 22, .3, .2)
    return splotch(g, col, (.12, .15, .3), 3, .65, .4, 23), n
