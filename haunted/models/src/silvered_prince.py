import math, random
SP = 'C:/Users/Hunter/HollowManorBuild/'
exec(open(SP + 'bl_helpers.py', encoding='utf-8-sig').read())
exec(open(SP + 'kit.py', encoding='utf-8-sig').read())
exec(open(SP + 'prince_base.py', encoding='utf-8-sig').read())
reset(); random.seed(10)
# The Silvered Prince: a doublet of mirror shards (cool-toned)
prince('Prince', {'doublet': (.05, .08, .16), 'shard': (.8, .85, .92), 'trim': (.6, .64, .7), 'hose': (.03, .04, .08),
                  'cape': (.04, .06, .14), 'lining': (.7, .75, .82), 'hair': (.55, .56, .6), 'glove': (.7, .72, .76), 'eye': (.5, .8, 1)}, False, 'ArmB')
print('tris', tris())
