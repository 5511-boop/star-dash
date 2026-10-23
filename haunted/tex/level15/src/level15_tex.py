# Level 15: The Pharaoh's Tomb: sandstone and sand, lapis and gold, black basalt, painted glyphs.
@use('The Antechamber (floor): worn sandstone slabs')
def ante_sandstone(g): return ph_tex(g, 'sandstone_blocks_05', 1, (1, .9, .75), .7, .95, .35, 1)
@use('The Scarab Nest (floor): sand riddled with burrows and beetle shells')
def scarab_sand(g):
    col, n = ph_tex(g, 'sand_02', 2, (1, .85, .6), .8, 1.2, .2, 2)
    holes = g._sstep(.74, .76, g.noise(30, 1, .5, 3))
    col = g.mix(holes, col, lin((.08, .05, .02)))
    sh = g._sstep(.79, .8, g.noise(50, 1, .5, 4))
    return g.mix(sh, col, lin((.12, .3, .2))), n
@use('The Hall of Anubis (floor): black basalt tiles with gold inlay')
def anubis_basalt(g):
    col, n = tiles(g, 4, (.06, .06, .07), (.09, .08, .08), 'random', (.65, .48, .18), .012, .3, 5, .3)
    return col, n
@use('The Canopic Shrine (floor): lapis and gold checker')
def canopic_tiles(g): return tiles(g, 8, (.07, .11, .32), (.48, .36, .14), 'checker', (.1, .08, .05), .02, .4, 6, .45)
@use('The Sand Chutes (floor): rippled sand')
def chute_sand(g):
    col, n = ph_tex(g, 'sand_02', 2, (1, .9, .7), .7, 1.6, .15, 7)
    rip = g.m('SINE', g.m('ADD', g.m('MULTIPLY', g.v, TAU * 14), g.m('MULTIPLY', g.noise(3, 2, .5, 8), 4)))
    return g.mix(g.m('MULTIPLY', g._sstep(.2, 1, rip), .3), col, g.hsv(col, .5, 1, 1.3)), g.bump(rip, .4, .02, n)
@use('The Blade Corridor (floor): cracked stone, old rust-red stains')
def blade_stone(g):
    col, n = ph_tex(g, 'rock_tile_floor', 2, (.95, .82, .62), .5, .85, .35, 9)
    return splotch(g, col, (.3, .06, .04), 5, .7, .5, 10), n
@use("The Sphinx's Riddle (floor): huge pale limestone slabs")
def sphinx_slabs(g): return blocks(g, 2, 2, (.65, .58, .46), (.25, .2, .14), 11, .15, .35, .015)
@use('The Sarcophagus Hall (floor): dark green granite')
def granite_floor(g):
    col, n = speckle(g, (.06, .1, .08), (.02, .03, .03), (.3, .35, .3), 70, 12)
    fu, fv, edge, cell = cells(g, 3)
    return g.mix(g.m('SUBTRACT', 1, g._sstep(.004, .01, edge)), col, lin((.5, .38, .15))), n
@use('The Star Shafts (floor): lapis vault with gold stars')
def lapis_stars(g): return stars(g, (.04, .08, .3), (.85, .65, .22), 13, False, (.06, .12, .4))
@use('The Pharaoh (floor): gold tiles bordered with glyph bands')
def pharaoh_gold(g):
    col, n = tiles(g, 4, (.55, .4, .14), (.5, .36, .12), 'random', (.2, .14, .05), .015, 0, 14, .3)
    return glyphs(g, col, 8, 8, 15, (.08, .12, .4))[0], n
@use('Freeze Bolt (tutorial room floor): plain sandstone')
def plain_sandstone(g): return ph_tex(g, 'sandstone_blocks_05', 1, (.95, .88, .75), .6, .9, .3, 16)
@use('walls (wallImg): sandstone blocks carved and painted with glyph rows')
def glyph_wall(g):
    col, n = ph_tex(g, 'sandstone_blocks_05', 1, (1, .9, .72), .7, .95, .3, 17)
    return glyphs(g, col, 6, 8, 18, (.1, .25, .45))[0], n
@use('trim (trimImg), sarcophagi, idols: tomb gold')
def tomb_gold(g): return brass(g, (.8, .6, .22), 19, (.35, .3, .2))
@use('lapis panels, scarab inlays')
def lapis(g): return speckle(g, (.06, .12, .42), (.03, .06, .2), (.75, .6, .25), 50, 20)
@use('mummy wrappings, linen hangings')
def tomb_linen(g):
    col = g.mix(g._sstep(.3, .7, g.noise(8, 4, .6, 21)), lin((.5, .44, .32)), lin((.68, .6, .45)))
    col = splotch(g, col, (.35, .25, .15), 4, .66, .5, 22)
    P = ph('fabric_pattern_05')
    return grime(g, col, .35, 3, 23), g.nmap(g.img(P['nor'], g.uvs(6), True), 1.2)
