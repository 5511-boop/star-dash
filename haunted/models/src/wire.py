# usage: python wire.py LEVEL "Commit title" glb1:scale:swing[:flag=val] glb2:scale:swing[:flag=val] script1.py script2.py ...
# Copies models + build scripts into the repo, adds the level's SKIN_SETS entry, makes the preview page, commits.
import sys, os, re, shutil, subprocess
B = 'C:/Users/Hunter/HollowManorBuild/'
R = B + 'star-dash/haunted/'
L = int(sys.argv[1]); title = sys.argv[2]
specs = [a for a in sys.argv[3:] if a.endswith('.glb') or '.glb:' in a]
scripts = [a for a in sys.argv[3:] if a.endswith('.py')]
ents = []
for s in specs:
    parts = s.split(':'); glb, scale, swing = parts[0], parts[1], parts[2]
    extra = ''.join(', %s: %s' % tuple(p.split('=')) for p in parts[3:])
    shutil.copy(B + 'out/' + glb, R + 'models/' + glb)
    ents.append("{ url: '../models/%s', scale: %s, swing: %s%s }" % (glb, scale, swing, extra))
for f in scripts:
    t = open(B + f, encoding='utf-8-sig').read()
    open(R + 'models/src/' + f, 'w', encoding='utf-8').write(t)
eng = open(R + 'engine.js', encoding='utf-8').read()
line = '  %d: [%s],\n' % (L, ', '.join(ents))
eng = re.sub(r'\n  %d: \[.*?\],\n' % L, '\n', eng)
i = eng.index('const SKIN_SETS = {'); j = eng.index('\n};', i)
eng = eng[:j + 1] + line + eng[j + 1:]
open(R + 'engine.js', 'w', encoding='utf-8').write(eng)
src = open(R + 'level%d/index.html' % L, encoding='utf-8').read()
im = '<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}</script>\n'
assert 'importmap' not in src
open(R + 'level%d/preview-skins.html' % L, 'w', encoding='utf-8').write(src.replace('</head>', im + '</head>', 1))
os.chdir(B + 'star-dash')
subprocess.run(['git', 'add', 'haunted/engine.js', 'haunted/models', 'haunted/level%d/preview-skins.html' % L], check=True, capture_output=True)
subprocess.run(['git', '-c', 'user.name=Claude', '-c', 'user.email=noreply@anthropic.com', 'commit', '-q', '-m',
                'Level %d: %s skins (preview page)\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' % (L, title)], check=True, capture_output=True)
print(subprocess.run(['git', 'log', '--oneline', '-1'], capture_output=True, text=True).stdout.strip())
print(line.strip())
