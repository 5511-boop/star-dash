// Level 18 — The Volcano Forge. New power: BOMBS (pick one up, throw it — it goes off a moment after it lands and blows open cracked walls).
// Enemies: Fire Elementals and Forge Hammers.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const basalt = E => E.mat(0xffffff, { roughness: .95, map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#2a2224'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ff5a1a'; x.globalAlpha = .35; x.lineWidth = 2; for (let i = 0; i < 6; i++){ x.beginPath(); x.moveTo(Math.random() * w, Math.random() * h); x.lineTo(Math.random() * w, Math.random() * h); x.stroke(); } x.globalAlpha = 1; x.strokeStyle = '#1a1416'; x.lineWidth = 3; for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) x.strokeRect(i * 64 + (j % 2) * 32, j * 32, 64, 32); }, 6, 6) });
// molten lava: tex/level18/lava.jpg over a hot emissive glow (the flat orange stays as the look until the image loads)
const lavaMat = (E, rx = 1, ry = 1) => E.pbr('lava', rx, ry, { color: 0xff5a1a, emissive: 0xff3a0a, emissiveIntensity: .25, roughness: .5, normal: .6 });
const ironMat = E => E.mat(0x4a4a52, { metalness: .8, roughness: .4 });
const reinforcedMat = E => E.mat(0x5a3a2a, { metalness: .6, roughness: .5, emissive: 0x3a1a0a, emissiveIntensity: .3 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; it.fuse = 0; };
const bombs = (list, n0 = 0) => list.map(([x, lz], i) => mkItem('bomb', x, lz, { n: n0 + i }));
const respawnBombs = (st, dt, delay = 2.2) => (st.items || []).forEach(it => { if (it.k !== 'bomb' || it.s !== 3 || it.noRespawn) return; it.rt = (it.rt || 0) + dt; if (it.rt > delay){ it.rt = 0; home(it); } });
const crate = (E, R, x, lz) => { const T = E.THREE, m = new T.Mesh(new T.BoxGeometry(1.6, .5, 1.2), E.mat(0x5a3a1a)); R.place(m, x, lz, .25); return m; };
const bombTip = 'Pick up a <b>bomb</b> (walk over it) and <b>throw</b> it (Space / ⚡) — it explodes a moment after it lands';
function blastAt(E, R, x, lz, rad = 2.2, msg = 'got caught in the blast!'){ E.ev('boom', '', 0, x, R.Z(lz)); for (const p of E.P) if (!p.frozen && Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < rad) E.freeze(p.idx, 3, `${E.names()[p.idx]} ${msg}`); }

/* ---------- fire elementals ---------- */
function elemental(R, E, home, opt = {}){
  const g = R.ghost({ home, look: 'wisp', tint: 0xff6a1a, sp: opt.sp || 2.3, radius: opt.radius || 8, label: 'a fire elemental', b: opt.b, gone: opt.gone, scale: opt.scale || 1.1 });
  const T = E.THREE; g.fl = []; for (let i = 0; i < 5; i++){ const f = new T.Mesh(new T.ConeGeometry(.25, .9, 6), new T.MeshBasicMaterial({ color: [0xff3a0a, 0xff8a1a, 0xffd34a][i % 3], transparent: true, opacity: .85 })); f.position.set(Math.cos(i * 1.3) * .3, 1.4, Math.sin(i * 1.3) * .3); g.mesh.add(f); g.fl.push(f); }
  const l = new T.PointLight(0xff6a1a, 3, 6, 1.4); l.position.y = 1.2; g.mesh.add(l);
  return g;
}
const flicker = (gs, t) => gs.forEach((g, k) => g.fl && g.fl.forEach((f, i) => { f.scale.y = .8 + Math.sin(t * 14 + i + k) * .3; f.visible = !(g.stun > 0) || Math.sin(t * 30) > 0; }));

/* =============================================================== */
const gate = {
  name: 'The Cracked Gate',
  floor: basalt,
  dark: .35,
  notes: [[0, 1.6, '“The forge-masters sealed the way with cracked stone. Bombs, please.”', 1.5]],
  hint: 'Walk over a bomb to pick it up, then press Space / ⚡ to throw it. It explodes a second after landing and smashes any cracked wall nearby — keep clear of the blast! New bombs appear in the crate.',
  build(R, E){
    EE = E;
    R.wall(-10, 9.6, -2, 10.4); R.wall(2, 9.6, 10, 10.4); R.cracked('c1', -2, 9.6, 2, 10.4);
    R.wall(-10, 15.6, 5, 16.4); R.wall(8, 15.6, 10, 16.4); R.cracked('c2', 5, 15.6, 8, 16.4);
    crate(E, R, 0, 3.5);
  },
  init(){ return { items: bombs([[-.4, 3.5], [.4, 3.5]]) }; },
  solve(st, R, E){ ['c1', 'c2'].forEach(n => E.S.broken[R.id(n)] = 1); },
  host(dt, st, R, E){ respawnBombs(st, dt); if (!R.isOpen('exit') && R.broken('c1') && R.broken('c2')){ R.open('exit'); E.ev('door', 'Both gates blasted — the door opens!'); } },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : `<b>NEW: Bombs!</b> ${bombTip}. Blow open the two cracked walls.`; }
};

/* =============================================================== */
const ANV2 = [[-6, 6, 0], [0, 11, 1.1], [6, 16, 2.2]], HP2 = 3.3;
const RW2 = [[-10, 7.6, -2, 8.4], [-2, 12.6, 4, 13.4], [2, 17.6, 10, 18.4]];
const hammers = {
  name: 'The Hammer Hall',
  floor: basalt,
  dark: .35,
  notes: [[0, 1.6, '“Iron walls. An ordinary bomb won\'t scratch them — but a bomb under a forge hammer…”', 1.5]],
  hint: 'The dark iron walls shrug off ordinary blasts. But if a bomb is sitting on an anvil when its giant hammer comes down, the hammer sets off a HUGE explosion that tears the nearby iron wall apart. Time your throw so the bomb lands just before the slam. Never stand on an anvil!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.rwm = RW2.map(([a, b, c, d]) => { const m = new T.Mesh(new T.BoxGeometry(c - a, 2.6, d - b), reinforcedMat(E)); R.place(m, (a + c) / 2, (b + d) / 2, 1.3); return m; });
    R.wall(-2, 7.6, 10, 8.4); R.wall(-10, 12.6, -2, 13.4); R.wall(4, 12.6, 10, 13.4); R.wall(-10, 17.6, 2, 18.4);
    this.hm = ANV2.map(([x, lz]) => { const an = new T.Mesh(new T.BoxGeometry(1.6, .6, 1.2), ironMat(E)); R.place(an, x, lz, .3); const g = new T.Group(); const head = new T.Mesh(new T.BoxGeometry(1.8, 1, 1.4), ironMat(E)); g.add(head); const shaft = new T.Mesh(new T.CylinderGeometry(.15, .15, 3, 8), E.mat(0x5a3a1a)); shaft.position.y = 2; g.add(shaft); R.place(g, x, lz, 4); return g; });
    crate(E, R, 0, 2.5);
  },
  init(){ return { t: 0, rw: [0, 0, 0], items: bombs([[-.4, 2.5], [.4, 2.5]]) }; },
  solve(st){ st.rw = [1, 1, 1]; },
  colliders(st, R){ return RW2.map(([a, b, c, d], i) => st.rw[i] ? null : R.rect(a, b, c, d)).filter(Boolean); },
  phase(st, i){ return (st.t + ANV2[i][2]) % HP2; },
  host(dt, st, R, E){
    respawnBombs(st, dt);
    const prev = st.t; st.t += dt;
    ANV2.forEach(([x, lz, off], i) => {
      const a = (prev + off) % HP2, b = (st.t + off) % HP2; if (!(b < a)) return; // slam happens on wrap
      E.ev('thud');
      for (const p of E.P) if (!p.frozen && Math.abs(p.pos.x - x) < 1.1 && Math.abs(R.lz(p.pos.z) - lz) < .9) E.freeze(p.idx, E.FREEZE, `The forge hammer flattened ${E.names()[p.idx]}!`);
      const bomb = st.items.find(it => it.k === 'bomb' && it.s === 0 && Math.abs(it.x - x) < 1 && Math.abs(it.lz - lz) < .8);
      if (bomb){ bomb.s = 3; blastAt(E, R, x, lz, 3.5, 'was caught in the hammer blast!'); RW2.forEach(([q, w, c, d], k) => { const cx = Math.max(q, Math.min(x, c)), cl = Math.max(w, Math.min(lz, d)); if (!st.rw[k] && Math.hypot(x - cx, lz - cl) < 5){ st.rw[k] = 1; E.ev('crash', 'KA-BOOM! The hammer-blast rips the iron wall apart!'); } }); }
    });
    if (!R.isOpen('exit') && st.rw.every(Boolean)){ R.open('exit'); E.ev('door', 'All three iron walls down — the door opens!'); }
  },
  visual(dt, t, st, R){ this.hm.forEach((g, i) => { const ph = this.phase(st, i); g.position.y = ph < .15 ? .9 : ph < .6 ? .9 + (ph - .15) / .45 * 3.1 : ph > HP2 - .3 ? 4 - (ph - (HP2 - .3)) / .3 * 3.1 : 4; }); this.rwm.forEach((m, i) => m.visible = !st.rw[i]); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : `The <b>iron walls</b> ignore bombs — but a bomb ON AN ANVIL when its <b>forge hammer</b> slams makes a huge blast. (${st.rw.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const RIV3 = [[6, 9.5], [13.5, 17]];
const PIL3 = [[-5, 5.2], [4, 5.2], [-1, 12.8], [7, 12.8]];   // pillars on the near banks
const magma = {
  name: 'The Magma Channels',
  floor: basalt,
  dark: .32,
  notes: [[0, 1.6, '“A blast pushes. Topple the stone pillars across the lava.”', 1.5]],
  hint: 'A bomb blast knocks a stone pillar over AWAY from the explosion. To drop one across a lava river, land a bomb on the near side of it (between you and the pillar) — then stand well back. The fallen pillar is a bridge.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.lm = RIV3.map(([a, b]) => { const m = lavaMat(E, 5, (b - a) / 4); R.floor(-10, a, 10, b, m, .02); return m; });
    this.pm = PIL3.map(([x, lz]) => { const m = new T.Mesh(new T.CylinderGeometry(.55, .65, 5, 10), E.mat(0x5a5052)); m.position.set(x, 2.5, R.Z(lz)); E.scene.add(m); return m; });
    crate(E, R, 0, 2.2); crate(E, R, -7, 11.2);
    this.e = [elemental(R, E, [6, 11], { b: [-9.5, 9.5, 9.8, 13.2] })];
  },
  init(){ return { fall: PIL3.map(() => 0), items: bombs([[-.4, 2.2], [.4, 2.2], [-7, 11.2]]) }; },
  solve(st){ st.fall = PIL3.map(() => [0, 1]); },
  colliders(st, R){ return PIL3.map(([x, lz], i) => st.fall[i] ? null : R.rect(x - .6, lz - .6, x + .6, lz + .6)).filter(Boolean); },
  pits(st, R){ return RIV3.map(([a, b]) => R.rect(-10.5, a, 10.5, b)); },
  bridges(st, R){ return PIL3.map(([x, lz], i) => { const f = st.fall[i]; if (!f) return null; const ex = x + f[0] * 5, el = lz + f[1] * 5; return R.rect(Math.min(x, ex) - .65, Math.min(lz, el) - .65, Math.max(x, ex) + .65, Math.max(lz, el) + .65); }).filter(Boolean); },
  onBomb(st, R, E, it){ PIL3.forEach(([x, lz], i) => { if (st.fall[i]) return; const dx = x - it.x, dl = lz - it.lz, d = Math.hypot(dx, dl); if (d < 3){ const ax = Math.abs(dx) > Math.abs(dl) ? [Math.sign(dx), 0] : [0, Math.sign(dl)]; st.fall[i] = ax; E.ev('crash', ax[1] > 0 ? 'The pillar topples across the lava!' : 'The pillar topples — the wrong way!'); } }); },
  host(dt, st, R, E){ respawnBombs(st, dt); if (!R.isOpen('exit') && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 17.5)){ R.open('exit'); E.ev('door', 'Over the magma — the door opens!'); } },
  visual(dt, t, st, R, E){ this.lm.forEach((m, i) => { if (m.map) m.map.offset.x = t * (i ? -.03 : .03); if (m.normalMap) m.normalMap.offset.x = m.map ? m.map.offset.x : 0; }); this.pm.forEach((m, i) => { const f = st.fall[i]; if (!f){ m.rotation.set(0, 0, 0); m.position.y = 2.5; return; } const [x, lz] = PIL3[i]; m.position.set(x + f[0] * 2.5, .5, R.Z(lz + f[1] * 2.5)); m.rotation.set(f[1] ? -Math.PI / 2 * f[1] * -1 : 0, 0, f[0] ? -Math.PI / 2 * f[0] : 0); }); flicker(this.e, t); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : 'Cross the two <b>lava rivers</b>: a bomb blast topples a stone pillar <b>away from the explosion</b> — knock them across the lava as bridges.'; }
};

/* =============================================================== */
const CR4 = [[-6.4, 2, -6, 6, 'a'], [6, 9, 6.4, 13, 'b'], [-6.4, 15, -6, 19, 'c']];
const ING4 = [[-8, 4], [8, 11], [-8, 17]], BOMB4 = [[-5, 4], [5, 11], [-5, 17]];
const furnace = {
  name: 'The Elemental Furnace',
  floor: basalt,
  dark: .39,
  notes: [[0, 1.6, '“These bombs are too hot to touch. But a fire elemental will happily light one…”', 1.5]],
  hint: 'The bombs here are glowing hot — you can\'t pick them up. A fire elemental that touches one lights its fuse! Lure an elemental onto a bomb beside a cracked wall, then run. Each blast opens an alcove with a golden ingot.',
  build(R, E){
    EE = E;
    R.wall(-10, 1.6, -6, 2); R.wall(-10, 6, -6, 6.4); R.wall(6, 8.6, 10, 9); R.wall(6, 13, 10, 13.4); R.wall(-10, 14.6, -6, 15); R.wall(-10, 19, -6, 19.4);
    CR4.forEach(([a, b, c, d, n]) => R.cracked(n, a, b, c, d));
    this.im = ING4.map(([x, lz]) => { const m = new E.THREE.Mesh(new E.THREE.BoxGeometry(.6, .25, .3), E.mat(0xd4af37, { metalness: .9, emissive: 0x6a5010 })); R.place(m, x, lz, .3); return m; });
    this.e = [elemental(R, E, [0, 12], { sp: 2.2 }), elemental(R, E, [2, 18], { sp: 2 })];
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0], items: bombs(BOMB4).map(b => ({ ...b, nopick: true, noRespawn: true })) }; },
  solve(st){ st.got = [1, 1, 1]; },
  itemMesh(k, E){ if (k !== 'bomb') return null; const T = E.THREE, g = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.4, 14, 10), new T.MeshStandardMaterial({ color: 0x5a1a0a, emissive: 0xff3a0a, emissiveIntensity: .7 })); g.add(b); return g; },
  host(dt, st, R, E){
    st.items.forEach(it => { if (it.k !== 'bomb' || it.s !== 0 || it.fuse > 0) return; if (this.e.some(g => !(g.stun > 0) && Math.hypot(g.x - it.x, g.z - R.Z(it.lz)) < 1)){ it.fuse = 1.3; E.ev('whoosh', 'The fire elemental lit a bomb!'); } });
    st.items.forEach(it => { if (it.k === 'bomb' && it.s === 3){ it.rt = (it.rt || 0) + dt; if (it.rt > 5 && !this.allOpen(R)){ it.rt = 0; home(it); } } });
    ING4.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A golden ingot! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three ingots — the door opens!'); }
  },
  allOpen(R){ return CR4.every(c => R.broken(c[4])); },
  visual(dt, t, st){ flicker(this.e, t); this.im.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `The bombs are too hot to touch — lure a <b>fire elemental</b> onto one to light it beside a cracked wall. Grab the 3 ingots behind. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const KEG5 = [[-6, 5], [6, 4], [-7, 9], [3, 8.5], [8, 13], [-3, 14.5]];
const WALL5 = [-2, 20.4, 2, 21.2];
const kegs = {
  name: 'The Powder Kegs',
  floor: basalt,
  dark: .35,
  notes: [[0, 1.6, '“One bomb. A long way to the door. And a cellar full of gunpowder.”', 1.5]],
  hint: 'A powder keg explodes when another explosion happens within a few steps of it — and that can set off the next keg, and the next. The iron door at the far end only breaks in a keg blast. Carry and throw the kegs into a chain (each within about 3 steps of the next) from the bomb crate to the door, then light the first one with your bomb. Stand clear!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.dm = new T.Mesh(new T.BoxGeometry(4, 2.6, .8), reinforcedMat(E)); R.place(this.dm, 0, 20.8, 1.3);
    R.wall(-10, 20.4, -2, 21.2); R.wall(2, 20.4, 10, 21.2);
    crate(E, R, 0, 2);
    R.plate('reset', -8.5, 1.5, 0x8affc1, 1.2, '↺');
  },
  init(){ return { door: 0, chain: [], items: [...bombs([[0, 2]]), ...KEG5.map(([x, lz], i) => mkItem('keg', x, lz, { n: i }))] }; },
  solve(st){ st.door = 1; },
  itemMesh(k, E){ if (k !== 'keg') return null; const T = E.THREE, g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(.35, .35, .7, 12), E.mat(0x6a4a2a)); b.position.y = .35; g.add(b); for (const y of [.12, .58]){ const r = new T.Mesh(new T.TorusGeometry(.36, .03, 4, 14), ironMat(E)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); } const x = new T.Mesh(new T.BoxGeometry(.3, .02, .3), E.glow(0xff3a0a, .5)); x.position.y = .71; g.add(x); return g; },
  colliders(st, R){ return st.door ? [] : [R.rect(...WALL5)]; },
  boom(st, R, E, x, lz){ blastAt(E, R, x, lz, 2.2); st.items.forEach(it => { if (it.k === 'keg' && it.s === 0 && !it.lit && Math.hypot(it.x - x, it.lz - lz) < 3.3){ it.lit = .3; } }); },
  onBomb(st, R, E, it){ this.boom(st, R, E, it.x, it.lz); },
  host(dt, st, R, E){
    respawnBombs(st, dt);
    if (R.edge('reset') && !st.door){ const fresh = this.init(); st.items = fresh.items; E.ev('chime', 'Fresh kegs roll in from the store.'); }
    st.items.forEach(it => { if (it.k !== 'keg' || !(it.lit > 0)) return; it.lit -= dt; if (it.lit <= 0){ it.lit = 0; it.s = 3; this.boom(st, R, E, it.x, it.lz); if (!st.door && Math.hypot(it.x - 0, it.lz - 20.8) < 3.4){ st.door = 1; R.open('exit'); E.ev('crash', 'KA-BOOM! The chain reaction blows the iron door clean off!'); } } });
  },
  visual(dt, t, st){ this.dm.visible = !st.door; },
  objective(st, R, E){ return st.door ? 'The door is blown open!' : 'Blow up the <b>iron door</b>: only a powder-keg blast can. Kegs set each other off when they\'re close — carry and throw them into a chain, then start it with a bomb. ↺ brings fresh kegs.'; }
};

/* =============================================================== */
const NODE6 = { S: [-7, 19], A: [-7, 13], B: [0, 13], C: [0, 7], D: [7, 7], M: [7, 2.6], X1: [-7, 7], X2: [7, 13], X3: [0, 2.6] };
const EDGE6 = [['S', 'A', null], ['A', 'X1', 'p0'], ['A', 'B', 'p1'], ['B', 'X2', 'p2'], ['B', 'C', 'p3'], ['C', 'X3', 'p4'], ['C', 'D', 'p5'], ['D', 'M', null]];
const PLUG6 = { p0: [-7, 10], p1: [-3.5, 13], p2: [3.5, 13], p3: [0, 10], p4: [0, 4.8], p5: [3.5, 7] };
const crucible = {
  name: 'The Crucible',
  floor: basalt,
  dark: .35,
  notes: [[0, 1.6, '“Pour the molten iron into the mould — and nowhere else.”', 1.5]],
  hint: 'The molten iron runs from the crucible (top left) along every open channel. The channels are blocked by clay plugs — a bomb blast within a couple of steps smashes a plug. Open exactly the plugs on the path to the mould (bottom right). Any open branch to a drain wastes the pour. Pull the lever to pour; ↺ rebuilds the plugs.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.ch = EDGE6.map(([a, b]) => { const [x1, l1] = NODE6[a], [x2, l2] = NODE6[b]; const m = new T.Mesh(new T.BoxGeometry(Math.abs(x2 - x1) + .8, .06, Math.abs(l2 - l1) + .8), E.mat(0x3a2a24)); R.place(m, (x1 + x2) / 2, (l1 + l2) / 2, .03); const lava = new T.Mesh(new T.BoxGeometry(Math.abs(x2 - x1) + .5, .08, Math.abs(l2 - l1) + .5), lavaMat(E)); R.place(lava, (x1 + x2) / 2, (l1 + l2) / 2, .05); lava.visible = false; return lava; });
    this.pm = Object.entries(PLUG6).map(([n, [x, lz]]) => { const m = new T.Mesh(new T.BoxGeometry(1, .8, 1), E.mat(0xa86a3a)); R.place(m, x, lz, .4); return m; });
    const cru = new T.Mesh(new T.CylinderGeometry(1.2, .8, 1.4, 12), ironMat(E)); R.place(cru, NODE6.S[0], NODE6.S[1] + 1, 1.2);
    const mould = new T.Mesh(new T.BoxGeometry(2, .5, 1.4), ironMat(E)); R.place(mould, NODE6.M[0], NODE6.M[1] - .6, .25);
    ['X1', 'X2', 'X3'].forEach(k => { const d = new T.Mesh(new T.CylinderGeometry(.8, .8, .05, 12), new T.MeshBasicMaterial({ color: 0x0a0604 })); R.place(d, ...NODE6[k], .04); });
    R.plate('pour', -9, 21, 0xff6a1a, 1.2, '⇩'); R.plate('reset', 9, 21, 0x8affc1, 1.2, '↺');
    crate(E, R, 0, 19.5);
  },
  init(){ return { plug: Object.keys(PLUG6).map(() => 1), flow: null, done: 0, items: bombs([[-.4, 19.5], [.4, 19.5]]) }; },
  solve(st){ st.done = 1; },
  onBomb(st, R, E, it){ Object.values(PLUG6).forEach(([x, lz], i) => { if (st.plug[i] && Math.hypot(it.x - x, it.lz - lz) < 2.2){ st.plug[i] = 0; E.ev('crash', 'A clay plug shatters!'); } }); },
  reach(st){ const open = e => !e[2] || !st.plug[+e[2].slice(1)]; const seen = new Set(['S']), q = ['S']; while (q.length){ const n = q.shift(); for (const e of EDGE6){ if (!open(e)) continue; const o = e[0] === n ? e[1] : e[1] === n ? e[0] : null; if (o && !seen.has(o)){ seen.add(o); q.push(o); } } } return seen; },
  host(dt, st, R, E){
    respawnBombs(st, dt);
    if (st.done) return;
    if (R.edge('reset') && !st.flow){ st.plug = st.plug.map(() => 1); E.ev('chime', 'The smiths rebuild the clay plugs.'); }
    if (R.edge('pour') && !st.flow){ st.flow = 2.5; E.ev('splash', 'The crucible tips — molten iron pours out!'); }
    if (st.flow){ st.flow -= dt; if (st.flow <= 0){ st.flow = null; const r = this.reach(st); if (r.has('M') && !['X1', 'X2', 'X3'].some(x => r.has(x))){ st.done = 1; R.open('exit'); E.ev('door', 'The iron fills the mould perfectly — a great iron key! The door opens.'); } else { E.ev('wrong', r.has('M') ? 'Some of the iron ran down a drain — not enough to fill the mould. Rebuild the plugs and try again.' : 'The iron never reached the mould.'); st.plug = st.plug.map(() => 1); } } }
  },
  visual(dt, t, st){ const r = st.flow || st.done ? this.reach(st) : null; this.ch.forEach((m, i) => { const [a, b, p] = EDGE6[i]; const open = !p || !st.plug[+p.slice(1)]; m.visible = !!r && open && r.has(a) && r.has(b); }); this.pm.forEach((m, i) => m.visible = !!st.plug[i]); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Route the molten iron from the crucible to the <b>mould</b> (bottom right). Bomb the clay plugs on the right path <b>only</b> — any open branch to a drain wastes the pour. ⇩ pours, ↺ rebuilds.'; }
};

/* =============================================================== */
const MW7 = [[-10, 9, -2, 9.6], [-2, 9, 2, 9.6, 'k0'], [2, 9, 10, 9.6], [-4.3, 9.6, -3.7, 14, 'k2'], [3.7, 9.6, 4.3, 14, 'k3'], [-10, 14, -4.3, 14.6], [-4.3, 14, 4.3, 14.6, 'k1'], [4.3, 14, 10, 14.6]];
const RUBY7 = [7.5, 11.8];
const obsidian = {
  name: 'The Obsidian Maze',
  floor: basalt,
  dark: .42,
  notes: [[0, 1.6, '“Three bombs. That\'s all the forge can spare.”', 1.5]],
  hint: 'You only get three bombs here (↺ resets the maze and the bombs). Every cracked wall you blow costs one — think about which walls actually lead to the ruby (right side, middle) and then to the door. Fire elementals wander the halls.',
  build(R, E){
    EE = E;
    MW7.forEach(([a, b, c, d, n]) => n ? R.cracked(n, a, b, c, d) : R.wall(a, b, c, d));
    R.plate('reset', -8.5, 1.5, 0x8affc1, 1.2, '↺');
    this.rm = new E.THREE.Mesh(new E.THREE.OctahedronGeometry(.4), E.glow(0xff1a4a, 1)); R.place(this.rm, RUBY7[0], RUBY7[1], .6);
    this.e = [elemental(R, E, [-8, 11.5], { sp: 2 }), elemental(R, E, [0, 17], { sp: 2 })];
    crate(E, R, 0, 1.5);
  },
  init(){ return { ruby: 0, used: 0, items: bombs([[-.5, 1.5], [0, 1.5], [.5, 1.5]]).map(b => ({ ...b, noRespawn: true })) }; },
  solve(st, R, E){ st.ruby = 1; ['k0', 'k1', 'k3'].forEach(n => E.S.broken[R.id(n)] = 1); },
  onBomb(st){ st.used++; },
  host(dt, st, R, E){
    if (R.edge('reset') && !st.ruby){ ['k0', 'k1', 'k2', 'k3'].forEach(n => delete E.S.broken[R.id(n)]); st.items.forEach(home); st.used = 0; E.ev('chime', 'The obsidian walls knit back together — three fresh bombs.'); }
    if (!st.ruby && E.P.some(p => !p.frozen && near(R, p, RUBY7[0], RUBY7[1], 1))){ st.ruby = 1; R.open('exit'); E.ev('door', 'The fire ruby! The door opens — now find your way out.'); }
  },
  visual(dt, t, st){ this.rm.visible = !st.ruby; this.rm.rotation.y += dt; flicker(this.e, t); },
  objective(st, R, E){ return st.ruby ? 'You have the ruby — get to the door!' : `Reach the fire ruby with only <b>3 bombs</b> — plan which cracked walls to blow. ↺ resets. (${3 - st.items.filter(i => i.s === 3).length} bombs left)`; }
};

/* =============================================================== */
const SHEL8 = [[-9.5, 3, -6.5, 6], [3, 5, 6.5, 8], [-4, 9.5, -.5, 12.5], [5, 12.5, 9, 15.5], [-9, 15, -5.5, 18], [-1, 17.5, 3, 20]];
const eruption = {
  name: 'The Eruption',
  floor: basalt,
  dark: .32,
  notes: [[0, 1.6, '“When the mountain roars, get under a rock.”', 1.5]],
  hint: 'Every few seconds the volcano erupts and molten rocks rain down on the red circles. Shelter under the stone overhangs (dark patches) — nothing can hit you there. The door is behind a cracked wall: bomb it (bombs in the crate at the start). Falling lava rocks will set off any bomb lying around!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.sh = SHEL8.map(([a, b, c, d]) => { const m = new T.Mesh(new T.PlaneGeometry(c - a, d - b), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: .5, depthWrite: false })); m.rotation.x = -Math.PI / 2; R.place(m, (a + c) / 2, (b + d) / 2, .03); const roof = new T.Mesh(new T.BoxGeometry(c - a, .3, d - b), E.mat(0x3a3034)); R.place(roof, (a + c) / 2, (b + d) / 2, 2.6); return m; });
    R.wall(-10, 20.6, -2, 21.4); R.wall(2, 20.6, 10, 21.4); R.cracked('c', -2, 20.6, 2, 21.4);
    this.marks = Array.from({ length: 7 }, () => { const m = new T.Mesh(new T.RingGeometry(.3, 1.5, 24), new T.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; E.scene.add(m); return m; });
    this.rocks = this.marks.map(() => { const m = new T.Mesh(new T.DodecahedronGeometry(.5), lavaMat(E)); m.visible = false; E.scene.add(m); return m; });
    crate(E, R, 0, 1.5);
  },
  init(){ return { t: 3, mk: [], items: bombs([[-.4, 1.5], [.4, 1.5]]) }; },
  solve(st, R, E){ E.S.broken[R.id('c')] = 1; },
  safe(R, x, lz){ return SHEL8.some(([a, b, c, d]) => x > a && x < c && lz > b && lz < d); },
  host(dt, st, R, E){
    respawnBombs(st, dt);
    st.t -= dt;
    if (st.t <= 0){ st.t = 4.2; E.ev('boom', 'The volcano ERUPTS!'); const T = E.P.filter(p => !p.frozen && R.inside(p.pos)); st.mk = []; T.forEach(p => st.mk.push([+p.pos.x.toFixed(2), +R.lz(p.pos.z).toFixed(2), 1.4])); while (st.mk.length < 7) st.mk.push([+(Math.random() * 18 - 9).toFixed(2), +(3 + Math.random() * 17).toFixed(2), 1.2 + Math.random() * .8]); }
    st.mk.forEach(m => { if (m[2] <= 0) return; m[2] -= dt; if (m[2] <= 0){ for (const p of E.P) if (!p.frozen && !p.dashing && Math.hypot(p.pos.x - m[0], R.lz(p.pos.z) - m[1]) < 1.5 && !this.safe(R, p.pos.x, R.lz(p.pos.z))) E.freeze(p.idx, E.FREEZE, `A lava bomb landed on ${E.names()[p.idx]}!`); st.items.forEach(it => { if (it.k === 'bomb' && it.s === 0 && !(it.fuse > 0) && Math.hypot(it.x - m[0], it.lz - m[1]) < 1.6) it.fuse = .6; }); } });
    if (!R.isOpen('exit') && R.broken('c')){ R.open('exit'); E.ev('door', 'The wall is blasted — the door opens!'); }
  },
  visual(dt, t, st, R){ this.marks.forEach((m, i) => { const k = st.mk[i]; m.visible = !!k && k[2] > 0; if (m.visible){ m.position.set(k[0], .06, R.Z(k[1])); m.material.opacity = .3 + (1.4 - Math.min(1.4, k[2])) * .45; } const r = this.rocks[i]; r.visible = m.visible && k[2] < .6; if (r.visible){ r.position.set(k[0], k[2] * 9, R.Z(k[1])); r.rotation.x += dt * 5; } }); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : 'Bomb the cracked wall at the far end. Every few seconds the volcano rains lava on the <b style="color:#ff5050">red circles</b> — shelter under the stone overhangs!'; }
};

/* =============================================================== */
const FURN9 = [-7, 12], ANV9 = [0, 12], QUENCH9 = [7, 12], ORE9 = [[-8, 3.5], [-6, 3.5], [-4, 3.5]], HP9 = 2.6;
const smithy = {
  name: 'The Smith\'s Workshop',
  floor: basalt,
  dark: .32,
  notes: [[0, 1.6, '“Furnace, anvil, water. Three blades for the ghost-smith, and be quick about it.”', 1.5]],
  hint: 'Carry an ore lump into the furnace glow (left) and hold it there until it\'s red-hot. Then THROW it onto the anvil (middle): the hammer shapes it into a blade on its next blow. Pick the blade up and carry it to the quenching barrel (right) before it cools. Hot metal cools in ~10 seconds. Don\'t stand on the anvil!',
  build(R, E){
    EE = E; const T = E.THREE;
    const f = new T.Mesh(new T.BoxGeometry(2.6, 2.4, 1.6), E.mat(0x3a2a24)); R.place(f, FURN9[0], FURN9[1] + 1.6, 1.2); const mouth = new T.Mesh(new T.PlaneGeometry(1.4, 1), E.glow(0xff6a1a, 2)); R.place(mouth, FURN9[0], FURN9[1] + .79, .8); R.block(FURN9[0] - 1.3, FURN9[1] + .8, FURN9[0] + 1.3, FURN9[1] + 2.4, .01, E.mat(0));
    const an = new T.Mesh(new T.BoxGeometry(1.6, .6, 1.2), ironMat(E)); R.place(an, ANV9[0], ANV9[1], .3);
    this.ham = new T.Group(); const head = new T.Mesh(new T.BoxGeometry(1.6, .9, 1.2), ironMat(E)); this.ham.add(head); R.place(this.ham, ANV9[0], ANV9[1], 4);
    const q = new T.Mesh(new T.CylinderGeometry(.9, .8, 1, 14), E.mat(0x5a3a1a)); R.place(q, QUENCH9[0], QUENCH9[1], .5); const w = new T.Mesh(new T.CircleGeometry(.8, 14), new T.MeshStandardMaterial({ color: 0x4a8ac8, emissive: 0x1a3a6a })); w.rotation.x = -Math.PI / 2; R.place(w, QUENCH9[0], QUENCH9[1], 1.01); R.block(QUENCH9[0] - .9, QUENCH9[1] - .9, QUENCH9[0] + .9, QUENCH9[1] + .9, .01, E.mat(0));
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { t: 0, done: 0, items: ORE9.map(([x, lz], i) => mkItem('ore', x, lz, { n: i, heat: 0, blade: 0 })) }; },
  solve(st){ st.done = 3; },
  itemMesh(k, E){ if (!['ore', 'oreH', 'blade', 'bladeH'].includes(k)) return null; const T = E.THREE, hot = k.endsWith('H'); const m = k.startsWith('blade') ? new T.Mesh(new T.BoxGeometry(.14, .1, 1.1), new T.MeshStandardMaterial({ color: hot ? 0xffa060 : 0xcfcfd8, metalness: .9, roughness: .2, emissive: hot ? 0xff3a0a : 0, emissiveIntensity: hot ? 1.2 : 0 })) : new T.Mesh(new T.DodecahedronGeometry(.3), new T.MeshStandardMaterial({ color: hot ? 0xff8a3a : 0x5a5a62, emissive: hot ? 0xff3a0a : 0, emissiveIntensity: hot ? 1.2 : 0 })); return m; },
  carryTick(st, R, E, it, p){
    if (near(R, p, FURN9[0], FURN9[1], 1.8)){ if (it.heat < 1){ it.heat = Math.min(1, +(it.heat + .02).toFixed(3)); if (it.heat >= 1) E.ev('chime', 'Red-hot! Throw it onto the anvil.'); } }
    if (it.blade && near(R, p, QUENCH9[0], QUENCH9[1], 1.6)){ if (it.heat > 0){ it.s = 3; st.done++; E.ev('splash', st.done < 3 ? `HISSS! A finished blade (${st.done}/3)` : ''); } else E.ev('wrong', 'The blade has gone cold — quenching does nothing now. Reheat it!'); }
  },
  host(dt, st, R, E){
    st.items.forEach(it => { if (it.s !== 3 && it.heat > 0 && !(it.s === 1 && near(R, E.P.find(p => p.idx === it.w) || { pos: { x: 99, z: 99 } }, FURN9[0], FURN9[1], 1.8))) it.heat = Math.max(0, +(it.heat - dt / 10).toFixed(3)); });
    const prev = st.t; st.t += dt;
    if ((st.t % HP9) < (prev % HP9)){ E.ev('thud'); for (const p of E.P) if (!p.frozen && Math.abs(p.pos.x - ANV9[0]) < 1.1 && Math.abs(R.lz(p.pos.z) - ANV9[1]) < .9) E.freeze(p.idx, E.FREEZE, `The hammer came down on ${E.names()[p.idx]}!`); const it = st.items.find(i => i.s === 0 && Math.abs(i.x - ANV9[0]) < 1 && Math.abs(i.lz - ANV9[1]) < .8); if (it){ if (it.heat > .3 && !it.blade){ it.blade = 1; E.ev('chime', 'CLANG! The hammer beats the hot ore into a blade!'); } else if (!it.blade) E.ev('wrong', 'CLANK. Cold ore just bounces — heat it first!'); } }
    st.items.forEach(it => { if (it.s !== 3) it.k = (it.blade ? 'blade' : 'ore') + (it.heat > .3 ? 'H' : ''); });
    if (!R.isOpen('exit') && st.done >= 3){ R.open('exit'); E.ev('door', 'Three fine blades — the ghost-smith nods. The door opens!'); }
  },
  visual(dt, t, st, R){ const ph = st.t % HP9; this.ham.position.y = ph < .12 ? .9 : ph < .6 ? .9 + (ph - .12) / .48 * 3.1 : ph > HP9 - .25 ? 4 - (ph - (HP9 - .25)) / .25 * 3.1 : 4; setOrbs(this.orbs, st.done); },
  objective(st, R, E){ return st.done >= 3 ? 'The door is open!' : `Forge 3 blades: <b>heat</b> ore in the furnace → <b>throw</b> it on the anvil for the hammer → <b>quench</b> the hot blade in the barrel. Metal cools fast! (${st.done}/3)`; }
};

/* =============================================================== */
const CRATE10 = [[-8.5, 3], [8.5, 3], [-8.5, 20], [8.5, 20]];
const titan = {
  name: 'The Forge Titan',
  floor: basalt,
  dark: .28,
  notes: [[0, 1.4, '“Iron plates, a heart of fire. Crack the plates — then freeze the heart.”', 1.4]],
  hint: 'Bomb blasts right next to the Titan crack its armour plates. When all three plates are cracked its fiery heart is exposed for a few seconds — hit it with a freeze bolt (tap ☀ while moving towards it). Three hearts\' worth. Mind the stomp shockwave (the red ring).',
  build(R, E){
    EE = E; const T = E.THREE;
    CRATE10.forEach(([x, lz]) => crate(E, R, x, lz));
    this.boss = R.ghost({ home: [0, 14], look: 'big', tint: 0x4a4a52, scale: 2.4, sp: 0, flashImmune: true, label: 'the Forge Titan', gone: st => st.done, think: (g, dt, st, R2, E2, P) => { if (st.open > 0) return true; let best = null, bd = 99; for (const p of E2.targetsOf(g, P)){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } } if (best && bd > 1) E2.stepToward(g, best.pos.x, best.pos.z, (1.5 + st.hits * .3) * E2.GMULT, dt); E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), 1.6); return true; } });
    this.boss.noStun = true;
    this.plates = [0, 1, 2].map(i => { const m = new T.Mesh(new T.BoxGeometry(.9, .9, .2), ironMat(E)); const a = i / 3 * Math.PI * 2; m.position.set(Math.sin(a) * .7, 1.2, Math.cos(a) * .7); m.rotation.y = a; this.boss.mesh.add(m); return m; });
    this.heart = new T.Mesh(new T.SphereGeometry(.45, 12, 10), E.glow(0xff6a1a, 2)); this.heart.position.y = 1.2; this.boss.mesh.add(this.heart);
    this.ring = new T.Mesh(new T.RingGeometry(3.2, 3.6, 32), new T.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false })); this.ring.rotation.x = -Math.PI / 2; E.scene.add(this.ring);
    this.e = [0, 1, 2].map(k => elemental(R, E, [k === 1 ? 9 : -9, 11], { gone: st => st.hits <= k || st.done }));
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 3);
  },
  init(){ return { cracked: 0, open: 0, hits: 0, stomp: 4, cd: 0, done: 0, items: bombs(CRATE10.map(([x, lz]) => [x, lz])) }; },
  solve(st){ st.hits = 3; st.done = 1; },
  onBomb(st, R, E, it){ const b = this.boss; if (st.open > 0 || st.done) return; if (Math.hypot(b.x - it.x, b.z - R.Z(it.lz)) < 3){ st.cracked++; E.ev('crash', st.cracked < 3 ? `An armour plate cracks! (${st.cracked}/3)` : 'The last plate cracks — its HEART is exposed! Freeze bolt, now!'); if (st.cracked >= 3) st.open = 6; } },
  onBoltHit(st, R, E, g){ if (g !== this.boss || !(st.open > 0) || st.done) return; st.hits++; st.open = 0; st.cracked = 0; E.ev('boom', st.hits < 3 ? `The freeze bolt hits the Titan\'s heart! (${st.hits}/3) Its plates re-forge…` : ''); if (st.hits >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Forge Titan\'s heart goes cold. It topples with a crash that shakes the volcano. The way out is open!'); } },
  host(dt, st, R, E){
    respawnBombs(st, dt, 3);
    if (st.done) return;
    if (st.open > 0){ st.open -= dt; if (st.open <= 0){ st.open = 0; st.cracked = 0; E.ev('wrong', 'Too slow — the Titan\'s plates re-forge.'); } }
    st.stomp -= dt;
    if (st.stomp <= 0){ st.stomp = 4.5 - st.hits * .6; const b = this.boss; E.ev('thud', 'The Titan STOMPS!'); for (const p of E.P){ if (p.frozen || p.dashing) continue; const d = Math.hypot(p.pos.x - b.x, p.pos.z - b.z); if (d > 2.6 && d < 4) E.freeze(p.idx, 3, `The Titan's shockwave knocked ${E.names()[p.idx]} flat!`); } }
  },
  visual(dt, t, st, R){ this.plates.forEach((m, i) => { m.material.color.setHex(i < st.cracked ? 0x8a3a1a : 0x4a4a52); m.visible = !(st.open > 0); }); this.heart.material.emissiveIntensity = st.open > 0 ? 3 + Math.sin(t * 20) : .5; const b = this.boss; this.ring.position.set(b.x, .05, b.z); this.ring.material.opacity = st.stomp < 1 && !st.done ? (1 - st.stomp) * .6 : 0; flicker(this.e, t); setOrbs(this.orbs, st.hits); },
  objective(st, R, E){ return st.done ? 'The Titan has fallen — escape the forge!' : st.open > 0 ? '<b>Its heart is exposed — FREEZE BOLT it now!</b>' : `<b>Bomb</b> the Forge Titan to crack its 3 armour plates, then hit its exposed heart with a <b>freeze bolt</b>. Dodge the stomp ring! (${st.hits}/3)`; }
};

export default {
  level: 18,
  // texture pack in tex/level18/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  wallImg: 'forge_wall', trimImg: 'hot_iron', texVer: 1,
  texFloors: {
    "The Cracked Gate": "gate_basalt",
    "The Hammer Hall": "hammer_iron",
    "The Magma Channels": "ash_ground",   // plain ash so the lava rivers are the only thing that looks hot
    "The Elemental Furnace": "furnace_brick",
    "The Powder Kegs": "keg_boards",
    "The Crucible": "crucible_slag",
    "The Obsidian Maze": "obsidian_floor",
    "The Eruption": "eruption_floor",
    "The Forge Titan": "titan_plates",
    "The Smith's Workshop": "hearth_stone"
  },
  title: 'The Volcano Forge',
  tagline: 'Deep inside the mountain the forges still burn,<br>and the smiths are made of fire.',
  story: 'Rivers of lava, roaring furnaces, hammers the size of carriages. The way through is sealed with stone — so bring something that goes BOOM.',
  winTitle: 'Out of the fire! 🌋',
  feature: { name: 'Bombs', icon: '💣', how: 'Walk over a <b>bomb</b> to pick it up and <b>throw</b> it (Space / ⚡). It explodes a second after it lands — smashing <b>cracked walls</b> and stunning enemies. Stand clear of the blast!' },
  accent: '#ff8a3a',
  wallColor: 0x2a2224,
  trimColor: 0xff5a1a,
  doorColor: 0x3a2a24,
  sky: 0xff6a3a,
  bg: 0x0a0402,
  ambient: 1.6, exposure: 2.2,   // brighter than the engine defaults (0.8 / 1.7): the dark forge textures were too murky
  drone: 35,
  rooms: [gate, hammers, magma, furnace, kegs, crucible, obsidian, eruption, smithy, titan],
};
