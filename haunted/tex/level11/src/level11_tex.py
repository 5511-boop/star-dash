# Level 11: The Spectral Archive: plum and ink, dark parquet, leather and brass, paper everywhere.
@use('The Reading Room (floor): dark polished herringbone')
def reading_parquet(g): return ph_tex(g, 'herringbone_parquet', 2, (.6, .45, .38), .7, .6, .3, 1)
@use('The Card Catalogue (floor): small brown and cream encaustic tiles')
def catalogue_tiles(g): return tiles(g, 12, (.55, .45, .32), (.25, .14, .1), 'checker', (.12, .1, .08), .04, .3, 2, .35)
@use('The Lending Desk (floor): honey boards worn pale in a path')
def lending_boards(g):
    col, n = ph_tex(g, 'old_wood_floor', 1, (1, .85, .65), .8, 1.0, .3, 3)
    return splotch(g, col, (.55, .45, .35), 2, .5, .4, 4), n
@use('The Forged Shelves (floor): bottle-green carpet')
def forged_carpet(g): return velvet(g, (.06, .16, .1), (.02, .06, .04), 5, (.4, .32, .14), 5)
@use('The Sealed Booths (floor): speckled cork tiles')
def sealed_cork(g):
    col, n = speckle(g, (.42, .3, .18), (.22, .14, .07), (.6, .48, .3), 90, 6)
    fu, fv, edge, cell = cells(g, 4)
    return g.mix(g.m('SUBTRACT', 1, g._sstep(.006, .012, edge)), col, lin((.1, .07, .04))), n
@use('The Turning Pages (floor): parquet strewn with loose pages')
def pages_floor(g):
    col, n = ph_tex(g, 'herringbone_parquet', 2, (.7, .55, .45), .7, .65, .3, 7)
    pg = g._sstep(.7, .705, g.noise(5, 1, .5, 8, ax=1.3, ay=1))
    return g.mix(g.m('MULTIPLY', pg, .9), col, lin((.72, .66, .52))), n
@use('The Restricted Section (floor): black iron grille')
def restricted_iron(g): return ph_tex(g, 'metal_grate_rusty', 3, (.4, .38, .42), .3, .5, .25, 9)
@use('The Ink Tide (floor): boards drowned in glossy black ink')
def ink_floor(g):
    col, n = ph_tex(g, 'dark_wooden_planks', 2, (.7, .6, .6), .6, .7, .2, 10)
    ink = g._sstep(.5, .54, g.noise(2.5, 5, .65, 11))
    return g.mix(ink, col, lin((.01, .01, .02))), g.bump(g.m('MULTIPLY', ink, .3), .2, .01, n)
@use('The Flickering Vault (floor): riveted steel vault plate')
def vault_steel(g): return metal(g, (.25, .26, .3), 2, True, 12, .2, .35, (.35, .36, .4))
@use('The Archivist (floor): deep purple rug with a gold border pattern')
def archivist_rug(g): return velvet(g, (.16, .06, .2), (.06, .02, .08), 13, (.6, .45, .18), 3)
@use('Phase Run (tutorial room floor): grey slate tiles')
def phase_slate(g): return ph_tex(g, 'rock_tile_floor', 2, (.6, .58, .65), .25, .7, .25, 14)
@use('walls (wallImg): plum damask above dark panelling')
def archive_wall(g): return damask(g, (.16, .08, .18), (.38, .3, .2), 4, 15)
@use('trim (trimImg), lamps, ladders: dull brass')
def archive_brass(g): return brass(g, (.5, .38, .18), 16)
@use('bookshelves: rows of book spines')
def bookshelf(g): return books(g, 17)
@use('desks, chairs: green leather')
def desk_leather(g):
    n = g.noise(25, 5, .7, 18, dist=.5)
    col = g.mix(g._sstep(.3, .7, n), lin((.03, .08, .05)), lin((.08, .18, .1)))
    return grime(g, splotch(g, col, (.3, .3, .25), 6, .72, .4, 19), .3, 3, 20), g.bump(n, .3, .01)
@use('scrolls, notices, loose pages: inked parchment')
def parchment_ink(g): return parchment(g, (.78, .68, .48), 21)
