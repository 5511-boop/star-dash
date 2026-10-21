import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
exec(open(SP + 'prince_base.py', encoding='utf-8-sig').read())
reset(); random.seed(10)
# The Reflection: his outfit reversed in rose gold, sword in the other hand, a face that never comes into focus (warm-toned)
prince('Reflection', {'doublet': (.3, .1, .09), 'shard': (.95, .62, .5), 'trim': (.85, .5, .38), 'hose': (.14, .05, .05),
                      'cape': (.85, .52, .42), 'lining': (.28, .08, .08), 'hair': (.45, .2, .12), 'glove': (.85, .66, .55), 'eye': (1, .6, .4)}, True, 'ArmA')
print('tris', tris())
