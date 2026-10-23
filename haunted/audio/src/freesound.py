# Freesound helper: search CC0 sounds and download their HQ previews. The API key is read from freesound_key.txt
# (kept outside the game repo) and sent in the Authorization header, never in a URL.
# usage: python freesound.py search "query" [max_seconds]   |   python freesound.py get <id> <name>
import os, sys, json, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
KEY = open(os.path.join(HERE, 'freesound_key.txt'), encoding='utf-8').read().strip()
API = 'https://freesound.org/apiv2/'
def call(path, **q):
    url = API + path + ('?' + urllib.parse.urlencode(q) if q else '')
    req = urllib.request.Request(url, headers={'Authorization': 'Token ' + KEY, 'User-Agent': 'HollowManor-soundscape'})
    with urllib.request.urlopen(req, timeout=30) as r: return json.loads(r.read())
def search(query, max_dur=120, n=8):
    r = call('search/text/', query=query, filter='license:"Creative Commons 0" duration:[2 TO %s]' % max_dur,
             sort='rating_desc', page_size=n, fields='id,name,duration,avg_rating,num_ratings,username,previews')
    return r.get('results', [])
def get(sid, name):
    info = call('sounds/%s/' % sid, fields='id,name,license,username,previews')
    assert 'creativecommons.org/publicdomain/zero' in info['license'], 'not CC0: ' + info['license']
    url = info['previews']['preview-hq-mp3']
    os.makedirs(os.path.join(HERE, 'samples'), exist_ok=True)
    out = os.path.join(HERE, 'samples', name + '.mp3')
    req = urllib.request.Request(url, headers={'Authorization': 'Token ' + KEY, 'User-Agent': 'HollowManor-soundscape'})
    with urllib.request.urlopen(req, timeout=60) as r, open(out, 'wb') as f: f.write(r.read())
    with open(os.path.join(HERE, 'samples', 'CREDITS.txt'), 'a', encoding='utf-8') as f:
        f.write('%s.mp3  <- freesound.org/s/%s "%s" by %s (CC0)\n' % (name, info['id'], info['name'], info['username']))
    return out, os.path.getsize(out)
if __name__ == '__main__':
    if sys.argv[1] == 'search':
        for s in search(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 120):
            print('%7d  %5.1fs  %.1f*(%d)  %s  [%s]' % (s['id'], s['duration'], s['avg_rating'], s['num_ratings'], s['name'][:60], s['username']))
    elif sys.argv[1] == 'get':
        print(*get(sys.argv[2], sys.argv[3]))
