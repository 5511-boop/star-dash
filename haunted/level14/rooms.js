// Level 14 — The Sky Gardens. New power: SPIRIT BRIDGE.
//   Tap ☀ facing a gap → a short "light step" bridge (5 long; 8 when solo) for a few seconds.
//   Both tap ☀ at the same moment → a LONG bridge (up to 14) between the two of you.
// Enemies: Wind Spirits (gusts that shove you towards the edge) and Thorn Vines (grow across paths; light burns them back).
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const sky = E => new E.THREE.MeshBasicMaterial({ map: E.tiledTex(128, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5a7ab8'); g.addColorStop(1, '#8aa8d8'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 9; i++){ x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 14 + Math.random() * 18, 6 + Math.random() * 6, 0, 0, 7); x.fill(); } }, 4, 4) });
const grass = E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#4a8a3a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++){ x.fillStyle = ['#5a9a4a', '#3a7a2a', '#6aaa5a', '#e8d84a', '#e86aa8'][i % 5 === 0 ? 3 + (i % 2) : i % 3]; x.fillRect(Math.random() * w, Math.random() * h, 2, 3); } }, 3, 3) });
const stone = E => E.mat(0xcfc8b8, { roughness: .8 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; };
const isle = (R, E, a, b, c, d, m) => { R.floor(a, b, c, d, m || grass(E), .03); const T = E.THREE, rim = new T.Mesh(new T.BoxGeometry(c - a, .8, d - b), E.mat(0x6a5a4a)); R.place(rim, (a + c) / 2, (b + d) / 2, -.38); return R.rect(a, b, c, d); };
const ALL = R => R.rect(-10.5, -.5, 10.5, 22.5);
const segDistL = (px, pl, x1, l1, x2, l2) => { const dx = x2 - x1, dl = l2 - l1, L2 = dx * dx + dl * dl || 1e-6, t = Math.max(0, Math.min(1, ((px - x1) * dx + (pl - l1) * dl) / L2)); return Math.hypot(px - x1 - dx * t, pl - l1 - dl * t); };
const sbLocal = (R, sb) => sb ? [sb.x1, R.lz(sb.z1), sb.x2, R.lz(sb.z2)] : null;
const bridgeTip = () => solo() ? 'Tap <b>☀</b> facing a gap: a light bridge shoots out ahead of you.' : 'Tap <b>☀</b> facing a gap for a short light step — or <b>both tap ☀ together</b> for a long bridge between you.';

/* ---------- wind spirits ---------- */
function windSpirit(R, E, home, opt = {}){
  const g = R.ghost({ home, look: 'wisp', tint: 0xe8f4ff, sp: opt.sp || 1.6, radius: opt.radius || 7, harmless: true, label: 'a wind spirit', b: opt.b, gone: opt.gone, scale: 1.2 });
  const T = E.THREE; g.swirl = []; for (let i = 0; i < 8; i++){ const s = new T.Mesh(new T.TorusGeometry(.5 + i * .12, .03, 4, 16, 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 })); s.rotation.x = Math.PI / 2; s.position.y = .4 + i * .15; g.mesh.add(s); g.swirl.push(s); }
  return g;
}
function windPush(E, R, pos, gs, str = 6, rad = 3.2){
  let vx = 0, vz = 0;
  for (const g of gs){ if (g.stun > 0 || (g.gone && g.gone(R.st(), R, E))) continue; const dx = pos.x - g.x, dz = pos.z - g.z, d = Math.hypot(dx, dz); if (d < rad && d > .05){ const k = str * (1 - d / rad) + 1.2; vx += dx / d * k; vz += dz / d * k; } }
  return vx || vz ? [vx, vz] : null;
}
const spinWind = (gs, dt) => gs.forEach(g => g.swirl && g.swirl.forEach((s, i) => { s.rotation.z += dt * (6 - i * .4); s.material.opacity = g.stun > 0 ? .1 : .5; }));

/* ---------- thorn vines: grow from a root, freeze whoever the tip reaches, burn back in light ---------- */
function vineSet(R, E, defs){
  const T = E.THREE;
  const meshes = defs.map(() => { const g = new T.Group(); const stem = new T.Mesh(new T.CylinderGeometry(.18, .22, 1, 6), E.mat(0x2a5a1a)); stem.rotation.x = Math.PI / 2; g.add(stem); const tip = new T.Mesh(new T.ConeGeometry(.28, .6, 6), E.mat(0x8a2a4a)); tip.rotation.x = Math.PI / 2; g.add(tip); const thorns = []; for (let k = 0; k < 10; k++){ const th = new T.Mesh(new T.ConeGeometry(.06, .3, 4), E.mat(0xc8b8a0)); th.rotation.z = (k % 2 ? 1 : -1) * Math.PI / 2; g.add(th); thorns.push(th); } E.scene.add(g); return { g, stem, tip, thorns }; });
  return {
    init: () => ({ len: defs.map(d => d.start ?? d.max), wait: defs.map(() => 0) }),
    seg(vs, i){ const d = defs[i], L = vs.len[i]; return [d.root[0], d.root[1], d.root[0] + d.dir[0] * L, d.root[1] + d.dir[1] * L]; },
    rects(vs, R){ return defs.map((d, i) => { if (vs.len[i] < .2) return null; const [a, b, c, e] = this.seg(vs, i); return R.rect(Math.min(a, c) - .3, Math.min(b, e) - .3, Math.max(a, c) + .3, Math.max(b, e) + .3); }).filter(Boolean); },
    tick(dt, vs, R, E2){ defs.forEach((d, i) => { if (vs.wait[i] > 0){ vs.wait[i] -= dt; return; } const ol = vs.len[i]; vs.len[i] = Math.min(d.max, vs.len[i] + (d.rate || .9) * dt); vs.len[i] = +vs.len[i].toFixed(3); if (vs.len[i] > ol){ const tx = d.root[0] + d.dir[0] * vs.len[i], tl = d.root[1] + d.dir[1] * vs.len[i]; for (const p of E2.P){ if (p.frozen || !R.inside(p.pos)) continue; if (Math.hypot(p.pos.x - tx, R.lz(p.pos.z) - tl) < .75){ E2.freeze(p.idx, E2.FREEZE, `${E2.names()[p.idx]} was snagged by a thorn vine!`); vs.len[i] = Math.max(0, vs.len[i] - .9); } } } }); },
    burnNear(vs, x, lz, rad, E2){ let n = 0; defs.forEach((d, i) => { if (vs.len[i] < .2) return; const [a, b, c, e] = this.seg(vs, i); if (segDistL(x, lz, a, b, c, e) < rad){ vs.len[i] = 0; vs.wait[i] = d.regrow || 3; n++; } }); if (n) E2.ev('whoosh', 'The light scorches the thorns back!'); },
    burnSeg(vs, s, rad, E2){ if (!s) return; let n = 0; defs.forEach((d, i) => { if (vs.len[i] < .2) return; const [a, b, c, e] = this.seg(vs, i); for (let k = 0; k <= 10; k++){ const px = a + (c - a) * k / 10, pl = b + (e - b) * k / 10; if (segDistL(px, pl, ...s) < rad){ vs.len[i] = 0; vs.wait[i] = d.regrow || 3; n++; break; } } }); if (n) E2.ev('whoosh', 'The bridge of light burns through the thorns!'); },
    visual(vs, R){ meshes.forEach((m, i) => { const L = vs.len[i]; m.g.visible = L > .15; if (!m.g.visible) return; const [a, b, c, e] = this.seg(vs, i); m.g.position.set((a + c) / 2, .5, R.Z((b + e) / 2)); m.g.rotation.y = Math.atan2(c - a, -(e - b)); m.stem.scale.y = L; m.tip.position.z = L / 2; m.thorns.forEach((th, k) => { th.visible = k / 10 < L / 6; th.position.set(k % 2 ? .22 : -.22, 0, -L / 2 + (k + .5) * L / 10); }); }); },
  };
}

/* =============================================================== */
const IS1 = [[-10, 0, 10, 3], [-5.5, 5.5, -2.5, 8.5], [.5, 9.5, 3.5, 12.5], [-4.5, 14, -1.5, 17], [-10, 19.5, 10, 22]];
const steps = {
  name: 'The Cloud Steps',
  floor: sky,
  noDashJump: true,
  notes: [[0, 1.6, '“Light is solid here, if you believe it. Face the gap and let it shine.”', 1.5]],
  get hint(){ return solo() ? 'Face the next island and tap ☀ (F): a bridge of light shoots out ahead of you. Walk across before it fades.' : 'Face the next island and tap ☀ (F): a short bridge of light shoots out ahead of you (it fades after a few seconds, and ☀ needs to recharge). Each of you makes your own.'; },
  build(R, E){ EE = E; this.isl = IS1.map(([a, b, c, d]) => isle(R, E, a, b, c, d)); },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return [ALL(R)]; },
  bridges(st, R){ return IS1.map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.7)){ st.done = 1; R.open('exit'); E.ev('door', 'Across the cloud steps — the door opens!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : `<b>NEW: Spirit Bridge!</b> ${bridgeTip()}`; }
};

/* =============================================================== */
const terraces = {
  name: 'The Twin Terraces',
  floor: sky,
  noDashJump: true,
  notes: [[0, 1.6, '“Two terraces, one island between them. Make a bridge together.”', 1.5]],
  get hint(){ return solo() ? 'Stand at the inner end of a terrace facing the middle island and tap ☀ — your long solo bridge reaches it.' : 'Walk out to the ends of the two terraces (one each), facing each other across the middle. Tap ☀ at the SAME moment: a long bridge forms between you and passes right over the little island. Then light-step north.'; },
  build(R, E){
    EE = E;
    isle(R, E, -10, 0, 10, 4); isle(R, E, -10, 4, -6.5, 13); isle(R, E, 6.5, 4, 10, 13); isle(R, E, -.8, 11.2, .8, 12.8, stone(E)); isle(R, E, -1.2, 15, 1.2, 17); isle(R, E, -10, 19.5, 10, 22);
    const T = E.THREE; for (const s of [-1, 1]) for (const lz of [6, 9, 12]){ const urn = new T.Mesh(new T.CylinderGeometry(.35, .25, .7, 10), stone(E)); R.place(urn, s * 9.3, lz, .35); }
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return [ALL(R)]; },
  bridges(st, R){ return [R.rect(-10, 0, 10, 4), R.rect(-10, 4, -6.5, 13), R.rect(6.5, 4, 10, 13), R.rect(-.8, 11.2, .8, 12.8), R.rect(-1.2, 15, 1.2, 17), R.rect(-10, 19.5, 10, 22)]; },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.7)){ st.done = 1; R.open('exit'); E.ev('door', 'Over the twin terraces — the door opens!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : solo() ? 'Reach the little island in the middle, then hop north. Your solo light bridge is long.' : 'The middle island is too far for a light step. Stand at the inner ends of the two terraces and <b>both tap ☀ together</b> — the long bridge passes right over it!'; }
};

/* =============================================================== */
const IS3 = [[-10, 0, 10, 3], [-7.5, 5.5, -4, 9], [3.5, 6, 7, 9.5], [-2, 11.5, 2.5, 14.5], [-8, 15.5, -4.5, 19], [4, 16, 8, 19.5], [-10, 21, 10, 22]];
// the feathers go in the nest on the far ledge — but they're too light to hold near a wind spirit: a gust rips the
// feather away and blows it off. Catch it, use the gust, or flash the spirit first. One blown into the sky floats home.
const FE3 = [[-5.8, 7.2], [6, 17.8], [-6.2, 17.2]], NEST3 = [0, 21.5];
const onIsle3 = (x, lz) => IS3.some(([a, b, c, d]) => x > a && x < c && lz > b && lz < d);
const windy = {
  name: 'The Windy Terrace',
  floor: sky,
  noDashJump: true,
  notes: [[-3, 1.4, '“The wind spirits love to play. Their play is pushing people off terraces.”', 1.5]],
  get hint(){ return 'Bring the three golden feathers to the nest on the far ledge. Wind spirits shove you towards the edge — and a feather is so light that a spirit coming near RIPS it out of your hands and blows it away. ' + (solo() ? 'Flash a spirit to scatter it before you carry a feather past.' : 'Catch each other\'s blown feathers, or let a gust carry one towards the nest on purpose!') + ' A feather blown off into the sky floats back to where it started. (A flash also makes your light step — then ☀ has to recharge.)'; },
  build(R, E){
    EE = E; IS3.forEach(([a, b, c, d]) => isle(R, E, a, b, c, d));
    const T = E.THREE, nest = new T.Mesh(new T.TorusGeometry(.7, .25, 8, 16), E.texFrom(6, 'burlap', { color: 0x8a6a3a, tile: .6 })); nest.rotation.x = Math.PI / 2; R.place(nest, NEST3[0], NEST3[1], .25);
    this.w = [windSpirit(R, E, [0, 9]), windSpirit(R, E, [-2, 17], { sp: 1.8 }), windSpirit(R, E, [6, 12.5], { sp: 1.4 })];
    this.orbs = orbRow(E, R, 3, -1.3, 21.5, 1.3, 2.4);
  },
  init(){ return { got: 0, items: FE3.map(([x, lz]) => mkItem('feather', x, lz, { yRest: .7 })) }; },
  solve(st){ st.got = 3; st.items.forEach(it => it.s = 3); },
  itemMesh(k, E){ if (k !== 'feather') return null; const m = new E.THREE.Mesh(new E.THREE.ConeGeometry(.12, .9, 6), E.glow(0xffd34a, 1)); m.rotation.z = .5; return m; },
  pits(st, R){ return [ALL(R)]; },
  bridges(st, R){ return IS3.map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  push(st, R, E, pos){ return windPush(E, R, pos, this.w); },
  deliver(st, R, E, it){ it.s = 3; it.w = -1; st.got++; E.ev('place', `A golden feather in the nest! (${st.got}/3)`); },
  carryTick(st, R, E, it, p){
    if (near(R, p, NEST3[0], NEST3[1], 1.5)) return this.deliver(st, R, E, it);
    // a wind spirit close by tears the feather away and blows it off, away from the spirit
    const g = this.w.find(s => s.stun <= 0 && Math.hypot(s.x - p.pos.x, s.z - p.pos.z) < 2.6); if (!g) return;
    const dx = p.pos.x - g.x, dz = p.pos.z - g.z, d = Math.hypot(dx, dz) || 1;
    Object.assign(it, { s: 2, by: -1, w: -1, ft: 0, fd: .8, sx: it.x, slz: it.lz, tx: +E.clamp(it.x + dx / d * 6, -9.5, 9.5).toFixed(2), tlz: +E.clamp(it.lz - dz / d * 6, .6, 21.6).toFixed(2), pickCD: E.elapsed + .5 });
    E.ev('whoosh', 'A gust rips the feather away!');
  },
  onLand(st, R, E, it){ if (Math.hypot(it.x - NEST3[0], it.lz - NEST3[1]) < 1.5) return this.deliver(st, R, E, it); if (!onIsle3(it.x, it.lz)){ it.x = it.hx; it.lz = it.hlz; E.ev('chime', 'The feather floats away on the wind… and settles back where it started.', 2); } },
  host(dt, st, R, E){
    if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'Three golden feathers in the nest — the door opens!'); }
  },
  visual(dt, t, st){ spinWind(this.w, dt); setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 3 ? 'The door is open!' : `Bring the 3 golden feathers to the <b>nest</b> on the far ledge. A <b>wind spirit</b> near you rips a feather away and blows it off — ${E.solo() ? 'flash it first!' : 'catch it, or ride the gust!'} Blown into the sky, a feather floats back home. (${st.got}/3)`; }
};

/* =============================================================== */
const HEDGE4 = [[-10, 5, -4, 6], [-1, 5, 10, 6], [-6, 6, -5, 12], [1, 9, 10, 10], [-10, 13, 2, 14], [5, 10, 6, 17], [-3, 17, 10, 18], [-7, 14, -6, 20]];
const VINES4 = [{ root: [-2.5, 6], dir: [0, 1], max: 6.5 }, { root: [10, 7.5], dir: [-1, 0], max: 8 }, { root: [-10, 11.5], dir: [1, 0], max: 9 }, { root: [3.5, 14], dir: [0, 1], max: 3 }, { root: [-6, 15.5], dir: [1, 0], max: 6 }, { root: [-10, 19], dir: [1, 0], max: 6 }];
// each seed grows in the ROOT of a thorn vine: it can only be pulled while that vine is burnt back — and the vine
// regrows from its root, right where you're standing. [x, lz, vine index]
const SEED4 = [[9.4, 7.5, 1], [-9.4, 11.5, 2], [-5.4, 15.5, 4]];
const thornMaze = {
  name: 'The Thorn Maze',
  floor: grass,
  notes: [[0, 1.6, '“The thorns grow while you watch. Light is the only thing they fear.”', 1.5]],
  hint: 'Each seed grows in the root of a thorn vine, and it only comes loose while that vine is burnt back. Flash near the vine (or light-step along it) — it withers for a few seconds — then dash in, grab the seed and get clear: it regrows from the root, right where you\'re standing. If the growing tip reaches you, you\'re snagged.',
  build(R, E){
    EE = E; HEDGE4.forEach(([a, b, c, d]) => R.block(a, b, c, d, 1.8, E.tex('topiary', { color: 0x2a5a2a, tile: 1.4 })));
    this.v = vineSet(R, E, VINES4);
    this.sm = SEED4.map(([x, lz]) => { const m = new E.THREE.Mesh(new E.THREE.SphereGeometry(.25, 10, 8), E.glow(0xffd34a, 1)); R.place(m, x, lz, .4); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.5, 1.3, 2.2);
  },
  init(){ return { vs: this.v.init(), got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; st.vs.len = st.vs.len.map(() => 0); st.vs.wait = st.vs.wait.map(() => 1e9); },
  colliders(st, R){ return this.v.rects(st.vs, R); },
  onFlash(st, R, E, idx, x, z){ this.v.burnNear(st.vs, x, R.lz(z), 4.5, E); },
  onBridge(st, R, E, sb){ this.v.burnSeg(st.vs, sbLocal(R, sb), 1, E); },
  host(dt, st, R, E){
    this.v.tick(dt, st.vs, R, E);
    st.msg = Math.max(0, (st.msg || 0) - dt);
    SEED4.forEach(([x, lz, v], i) => {
      if (st.got[i] || !E.P.some(p => !p.frozen && near(R, p, x, lz, 1))) return;
      if (st.vs.len[v] < .2){ st.got[i] = 1; E.ev('pick', `A sky seed! (${st.got.filter(Boolean).length}/3) — get clear before the vine regrows!`); }
      else if (!st.msg){ st.msg = 3; E.ev('thud', 'The seed is wrapped in the living vine — burn it back first (flash or a light step)!'); }
    });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); this.solve(st); E.ev('door', 'Three seeds — the thorns wither away and the door opens!'); }
  },
  visual(dt, t, st, R){ this.v.visual(st.vs, R); this.sm.forEach((m, i) => { m.visible = !st.got[i]; m.material.emissiveIntensity = st.vs.len[SEED4[i][2]] < .2 ? 1.6 + Math.sin(t * 12) * .4 : .4; }); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Pull the 3 seeds from the <b>roots of the thorn vines</b> — a seed only comes loose while its vine is <b>burnt back</b> (flash or light-step it). Then get clear: it regrows from the root! (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const IS5 = [[-10, 0, 10, 3], [-9, 3, -5, 6], [-9, 15, -5, 18.5], [6, 14.5, 10, 18], [-10, 20, 10, 22]];
const STREAM5 = [[-9, 6, -5, 15, 0, 1], [-5, 15.4, 6, 17.6, 1, 0], [6.6, 18, 9.4, 20, 0, 1]];
const kites = {
  name: 'The Kite Run',
  floor: sky,
  noDashJump: true,
  notes: [[3, 1.4, '“Hold on to a kite and the sky currents will carry you.”', 1.5]],
  get hint(){ return 'Pick up a kite, then step into the glittering air current: while you hold a kite inside a current it carries you along and you can\'t fall. Ride the three currents: north, then east, then north again. ' + (solo() ? '' : 'There are two kites — one each. You can throw a kite to your partner.'); },
  build(R, E){
    EE = E; IS5.forEach(([a, b, c, d]) => isle(R, E, a, b, c, d));
    const T = E.THREE;
    this.parts = STREAM5.map(([a, b, c, d, dx, dl]) => Array.from({ length: 18 }, () => { const m = new T.Mesh(new T.SphereGeometry(.06, 4, 3), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 })); m.userData = { u: Math.random(), v: Math.random() }; E.scene.add(m); return m; }));
    STREAM5.forEach(([a, b, c, d]) => { const m = new T.Mesh(new T.BoxGeometry(c - a, .02, d - b), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .18 })); R.place(m, (a + c) / 2, (b + d) / 2, .4); });
  },
  init(){ return { done: 0, items: [mkItem('kite', -2, 2), mkItem('kite', 2, 2)] }; },
  solve(st){ st.done = 1; },
  itemMesh(k, E){ if (k !== 'kite') return null; const T = E.THREE, g = new T.Group(); const sh = new T.Shape(); sh.moveTo(0, .5); sh.lineTo(.35, 0); sh.lineTo(0, -.6); sh.lineTo(-.35, 0); sh.lineTo(0, .5); const m = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshStandardMaterial({ color: 0xe84a6a, side: T.DoubleSide, emissive: 0x6a1a2a })); m.position.y = .6; g.add(m); return g; },
  streamAt(R, pos){ const lz = R.lz(pos.z); return STREAM5.find(([a, b, c, d]) => pos.x > a && pos.x < c && lz > b && lz < d); },
  hasKite(st, idx){ return st.items.some(it => it.k === 'kite' && it.s === 1 && it.w === idx); },
  push(st, R, E, pos, idx){ if (!this.hasKite(st, idx)) return null; const s = this.streamAt(R, pos); return s ? [s[4] * 6.5, -s[5] * 6.5] : null; },
  pits(st, R){ return [ALL(R)]; },
  bridges(st, R, E){ const out = IS5.map(([a, b, c, d]) => R.rect(a, b, c, d)); if (this.hasKite(st, E.myIdx())) STREAM5.forEach(([a, b, c, d]) => out.push(R.rect(a, b, c, d))); return out; },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.2)){ st.done = 1; R.open('exit'); E.ev('door', 'What a flight — the door opens!'); } },
  visual(dt, t, st, R, E){ this.parts.forEach((ps, k) => { const [a, b, c, d, dx, dl] = STREAM5[k]; ps.forEach(m => { const u = m.userData; if (dx) u.u = (u.u + dt * .35) % 1; else u.v = (u.v + dt * .35) % 1; m.position.set(a + (c - a) * u.u, .6 + Math.sin(t * 3 + u.u * 9) * .2, R.Z(b + (d - b) * u.v)); }); }); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Grab a <b>kite</b> and ride the glittering air currents across the sky: holding a kite in a current carries you and you can\'t fall. North, east, north!'; }
};

/* =============================================================== */
const RING6 = (() => { const out = []; for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; out.push([Math.sin(a) * 6.9, 11 + Math.cos(a) * 6.9]); } return out; })();
const LINES6 = [[0, 3], [1, 4], [2, 5]];
const BEDS6 = (() => { const out = []; LINES6.forEach(([i, j]) => { const [a, b] = RING6[i], [c, d] = RING6[j]; for (const f of [.38, .62]) out.push([a + (c - a) * f, b + (d - b) * f]); }); return out; })();
const BLOOM6 = 28;
const sundial = {
  name: 'The Sundial Beds',
  floor: sky,
  noDashJump: true,
  notes: [[0, 1.6, '“The beds float out of reach. Only a bridge of light can wake them.”', 1.5]],
  get hint(){ return solo() ? 'A flower bed blooms when a light bridge passes over it. Stand on a ring island facing across the middle and tap ☀. All six beds must be in bloom together (each stays open about half a minute).' : 'A flower bed blooms when a bridge of light passes over it. The beds sit on the three straight lines between OPPOSITE islands of the ring — too far for light steps. Stand on opposite islands and both tap ☀ together. Three lines, six beds, all in bloom at once.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    isle(R, E, -10, 0, 10, 2.6); isle(R, E, -10, 19.4, 10, 22);
    this.ring = RING6.map(([x, lz]) => isle(R, E, x - 1.2, lz - 1.2, x + 1.2, lz + 1.2, stone(E)));
    for (const s of [-1, 1]){ isle(R, E, s > 0 ? 8.6 : -10, 2.6, s > 0 ? 10 : -8.6, 19.4); }
    for (let i = 0; i < 6; i++){ const [x, lz] = RING6[i], ex = x > 1 ? 8.6 : x < -1 ? -8.6 : 0; if (ex){ isle(R, E, Math.min(x, ex), lz - .5, Math.max(x, ex), lz + .5); } }
    this.bm = BEDS6.map(([x, lz]) => { const g = new T.Group(); const soil = new T.Mesh(new T.CylinderGeometry(.75, .6, .3, 12), E.tex('terracotta', { color: 0x9a5a3a, tile: 1 })); g.add(soil); const fl = []; for (let k = 0; k < 6; k++){ const f = new T.Mesh(new T.SphereGeometry(.16, 8, 6), E.glow([0xff6aa8, 0xffd34a, 0xa86aff][k % 3], .8)); f.position.set(Math.cos(k) * .4, .3, Math.sin(k) * .4); f.visible = false; g.add(f); fl.push(f); } g.userData.fl = fl; R.place(g, x, lz, -.2); return g; });
    this.sun = new T.Mesh(new T.SphereGeometry(1.2, 16, 12), E.glow(0xffd34a, .2)); R.place(this.sun, 0, 11, 7);
    this.w = [windSpirit(R, E, [9.3, 11], { sp: 1.3, b: [-10, 10, 2.6, 19.4] })];
  },
  init(){ return { bl: BEDS6.map(() => 0), done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return st.done ? [R.rect(-8.6, 2.6, 8.6, 19.4)] : [ALL(R)]; },
  bridges(st, R){ const out = [R.rect(-10, 0, 10, 2.6), R.rect(-10, 19.4, 10, 22), R.rect(8.6, 2.6, 10, 19.4), R.rect(-10, 2.6, -8.6, 19.4), ...RING6.map(([x, lz]) => R.rect(x - 1.2, lz - 1.2, x + 1.2, lz + 1.2))]; RING6.forEach(([x, lz]) => { const ex = x > 1 ? 8.6 : x < -1 ? -8.6 : 0; if (ex) out.push(R.rect(Math.min(x, ex), lz - .5, Math.max(x, ex), lz + .5)); }); out.push(R.rect(-1.2, 2.6, 1.2, 4.1), R.rect(-1.2, 17.9, 1.2, 19.4)); return out; },
  push(st, R, E, pos){ return windPush(E, R, pos, this.w, 4); },
  onBridge(st, R, E, sb){ const s = sbLocal(R, sb); let n = 0; BEDS6.forEach(([x, lz], i) => { if (segDistL(x, lz, ...s) < .9){ if (!(st.bl[i] > 0)) n++; st.bl[i] = BLOOM6; } }); if (n) E.ev('chime', `${n} flower bed${n > 1 ? 's' : ''} burst into bloom!`); },
  host(dt, st, R, E){
    if (st.done) return;
    st.bl = st.bl.map(v => Math.max(0, +(v - dt).toFixed(2)));
    if (st.bl.every(v => v > 0)){ st.done = 1; R.open('exit'); E.ev('door', 'Every bed is blooming — the sun breaks through and the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.bm.forEach((g, i) => { const on = st.done || st.bl[i] > 0; g.userData.fl.forEach(f => { f.visible = on; f.scale.setScalar(on && st.bl[i] < 5 && !st.done ? .5 + Math.abs(Math.sin(t * 6)) * .5 : 1); }); }); this.sun.material.emissiveIntensity = st.done ? 2.5 : .2 + st.bl.filter(v => v > 0).length * .25; spinWind(this.w, dt); },
  objective(st, R, E){ return st.done ? 'The sun is out — door open!' : `Make all 6 floating flower beds bloom at once: a bed blooms when a <b>light bridge passes over it</b>. They lie between opposite ring islands. (${st.bl.filter(v => v > 0).length}/6 blooming)`; }
};

/* =============================================================== */
const BELT7 = [[8, 15, 3], [17.4, 19.6, 2]];  // [lz1, lz2, regrow]
const brambleCells = (() => { const out = []; for (const [l1, l2] of BELT7) for (let x = -10; x < 10; x += 1) for (let lz = l1; lz < l2 - .01; lz += 1) out.push([x, lz, Math.min(lz + 1, l2)]); return out; })();
const bramble = {
  name: 'The Bramble Wall',
  floor: grass,
  notes: [[0, 1.6, '“The bramble is too deep for one light. Burn it together.”', 1.5]],
  get hint(){ return solo() ? 'Face the bramble and tap ☀: your light bridge burns a tunnel through. Walk it before it grows back — and don\'t be inside when it does!' : 'A light step burns a 5-long tunnel, but the bramble is 7 deep. One of you burns in, then the other walks to the end of that tunnel and burns the rest — quickly, before the first part grows back. (Or make a long bridge between you, if one of you is already through.)'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.cells = brambleCells.map(([x, l1, l2]) => { const m = new T.Mesh(new T.BoxGeometry(.98, 1.6, l2 - l1 - .02), E.tex('topiary', { color: 0x2a4a1a, tint: 0xb0c0a0, tile: 1.2 })); R.place(m, x + .5, (l1 + l2) / 2, .8); for (let k = 0; k < 2; k++){ const th = new T.Mesh(new T.ConeGeometry(.08, .35, 4), E.mat(0x8a2a4a)); th.position.set((Math.random() - .5) * .8, (Math.random() - .5) * 1.2, (Math.random() - .5) * .8); th.rotation.set(Math.random() * 3, 0, Math.random() * 3); m.add(th); } return m; });
    this.rose = new T.Mesh(new T.SphereGeometry(.45, 12, 8), E.glow(0xff3a6a, 1)); R.place(this.rose, 0, 16.3, .8);
  },
  init(){ return { burn: brambleCells.map(() => 0), rose: 0 }; },
  solve(st){ st.rose = 1; st.burn = st.burn.map(() => 1e9); },
  colliders(st, R){ return brambleCells.map(([x, l1, l2], i) => st.burn[i] > 0 ? null : R.rect(x, l1, x + 1, l2)).filter(Boolean); },
  onBridge(st, R, E, sb){ const s = sbLocal(R, sb); let n = 0; brambleCells.forEach(([x, l1, l2], i) => { if (segDistL(x + .5, (l1 + l2) / 2, ...s) < 1.1){ st.burn[i] = BELT7.find(([a, b]) => l1 >= a && l1 < b)[2] + 1.5; n++; } }); if (n) E.ev('whoosh', 'The light burns a tunnel through the bramble!'); },
  host(dt, st, R, E){
    brambleCells.forEach(([x, l1, l2], i) => { if (st.burn[i] > 0){ st.burn[i] = +(st.burn[i] - dt).toFixed(3); if (st.burn[i] <= 0){ st.burn[i] = 0; for (const p of E.P){ if (p.frozen) continue; const lz = R.lz(p.pos.z); if (p.pos.x > x - .3 && p.pos.x < x + 1.3 && lz > l1 - .3 && lz < l2 + .3){ E.freeze(p.idx, E.FREEZE, `The bramble grew back around ${E.names()[p.idx]}!`); const sp = R.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); } } } } });
    if (!st.rose && E.P.some(p => !p.frozen && near(R, p, 0, 16.3, 1))){ st.rose = 1; E.ev('pick', 'The sky rose! Now through the second bramble.'); }
    if (!R.isOpen('exit') && st.rose && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.8)){ R.open('exit'); E.ev('door', 'Through the bramble wall — the door opens!'); }
  },
  visual(dt, t, st){ this.cells.forEach((m, i) => { const b = st.burn[i]; m.visible = !(b > 0) || b < .5; m.scale.y = b > 0 && b < .5 ? 1 - b * 2 : 1; }); this.rose.visible = !st.rose; },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : !st.rose ? 'Burn through the <b>bramble wall</b> with light bridges to reach the sky rose. It\'s deeper than one light step — relay your light! It grows back fast.' : 'Now through the second, thinner bramble to the door — together!'; }
};

/* =============================================================== */
const IS8 = [[-10, 0, 10, 3], [-7, 6, -3.5, 9.5], [1.5, 7, 5, 10.5], [-4, 12.5, -.5, 16], [4, 13.5, 7.5, 17], [-10, 20.5, 10, 22]];
const CL8 = [{ a: [-9, 11], b: [9, 11], sp: .14 }, { a: [9, 18.6], b: [-9, 18.6], sp: .11 }, { a: [-9, 4.3], b: [9, 4.3], sp: .09 }];
const cloudAt = (c, t) => { const f = (Math.sin(t * c.sp * Math.PI * 2) + 1) / 2; return [c.a[0] + (c.b[0] - c.a[0]) * f, c.a[1] + (c.b[1] - c.a[1]) * f]; };
const storm = {
  name: 'The Storm Front',
  floor: sky,
  noDashJump: true,
  notes: [[0, 1.6, '“Storm clouds swallow light. And the lightning is looking for you.”', 1.5]],
  hint: 'Dark storm clouds drift across the gaps — any light bridge that touches one shatters. Wait for a gap in the clouds, then bridge. Lightning strikes where a red circle appears: keep moving!',
  build(R, E){
    EE = E; const T = E.THREE; IS8.forEach(([a, b, c, d]) => isle(R, E, a, b, c, d));
    this.cl = CL8.map(() => { const g = new T.Group(); for (let k = 0; k < 6; k++){ const s = new T.Mesh(new T.SphereGeometry(.9 + Math.random() * .5, 10, 8), new T.MeshStandardMaterial({ color: 0x3a3a4a, emissive: 0x1a1a2a, transparent: true, opacity: .9 })); s.position.set((Math.random() - .5) * 2.2, .4 + Math.random() * .6, (Math.random() - .5) * 1.6); g.add(s); } E.scene.add(g); return g; });
    this.mark = new T.Mesh(new T.RingGeometry(.3, 1.4, 24), new T.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false })); this.mark.rotation.x = -Math.PI / 2; this.mark.visible = false; E.scene.add(this.mark);
    this.bolt = new T.Mesh(new T.CylinderGeometry(.08, .25, 12, 5), E.glow(0xeef4ff, 3)); this.bolt.visible = false; E.scene.add(this.bolt);
  },
  init(){ return { t: 0, lt: 2, mk: null, done: 0 }; },
  solve(st){ st.done = 1; },
  tNow(st, R){ return R.local.t ?? st.t; },
  pits(st, R){ return [ALL(R)]; },
  bridges(st, R){ return IS8.map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  host(dt, st, R, E){
    st.t += dt;
    const sb = E.S.sb; if (sb){ const s = sbLocal(R, sb); if (CL8.some(c => { const [x, lz] = cloudAt(c, st.t); return segDistL(x, lz, ...s) < 1.7; })){ E.S.sb = null; E.ev('boom', 'The storm cloud swallowed the bridge!'); } }
    st.lt -= dt;
    if (st.mk){ st.mk[2] -= dt; if (st.mk[2] <= 0){ for (const p of E.P) if (!p.frozen && !p.dashing && Math.hypot(p.pos.x - st.mk[0], R.lz(p.pos.z) - st.mk[1]) < 1.4) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} was struck by lightning!`); E.ev('boom'); st.fl = .25; st.mk = null; } }
    else if (st.lt <= 0){ const T = E.P.filter(p => !p.frozen && R.inside(p.pos) && R.lz(p.pos.z) > 3.2 && R.lz(p.pos.z) < 20.3); if (T.length){ const p = T[Math.floor(Math.random() * T.length)]; st.mk = [+p.pos.x.toFixed(2), +R.lz(p.pos.z).toFixed(2), 1.3]; } st.lt = 2.6; }
    if (st.fl) st.fl = Math.max(0, st.fl - dt);
    if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.7)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the storm — the door opens!'); }
  },
  local(dt, st, R, E){ const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt + (st.t - L.t) * .1; },
  visual(dt, t, st, R, E){ const tt = this.tNow(st, R); this.cl.forEach((g, i) => { const [x, lz] = cloudAt(CL8[i], tt); g.position.set(x, .6, R.Z(lz)); }); this.mark.visible = !!st.mk; if (st.mk){ this.mark.position.set(st.mk[0], .08, R.Z(st.mk[1])); this.mark.material.opacity = .3 + (1.3 - st.mk[2]) * .5; } this.bolt.visible = st.fl > 0; },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Cross the storm. <b>Storm clouds</b> shatter any light bridge they touch — time your bridges. Lightning strikes the <b style="color:#ff5050">red circles</b>!'; }
};

/* =============================================================== */
const IS9 = [[-10, 0, 10, 3], [-9.5, 3, -7, 12], [-1, 8, 1, 10], [6.5, 3, 9.5, 8], [6.5, 12.5, 9.5, 15], [-3, 15, -.5, 17.5], [-10, 19, 10, 22]];
const AP9 = [[0, 9], [8, 13.7], [-1.75, 16.2]];
const STREAM9 = [[6.5, 8, 9.5, 12.5, 0, 1]];
const VINES9 = [{ root: [-3, 16.25], dir: [1, 0], max: 2.3, rate: 1.2 }, { root: [-1.75, 17.5], dir: [0, -1], max: 2.3, rate: 1.2 }];
const hanging = {
  name: 'The Hanging Gardens',
  floor: sky,
  noDashJump: true,
  notes: [[0, 1.6, '“Three golden apples, three ways to reach them. Use everything the sky has taught you.”', 1.5]],
  get hint(){ return 'Middle apple: too far for a light step from anywhere — it sits halfway between the long west terrace and the east islands, so stand either side and bridge together' + (solo() ? ' (solo: your long light bridge reaches)' : '') + '. East apple: take the kite from the start and ride the air current north. Top apple: hidden in thorns — burn them with a flash or a bridge, then grab it before they regrow. Wind spirits patrol.'; },
  build(R, E){
    EE = E; const T = E.THREE; IS9.forEach(([a, b, c, d]) => isle(R, E, a, b, c, d));
    this.am = AP9.map(([x, lz]) => { const m = new T.Mesh(new T.SphereGeometry(.32, 12, 10), new T.MeshStandardMaterial({ color: 0xffd34a, metalness: .8, roughness: .2, emissive: 0x8a6a10 })); R.place(m, x, lz, .5); return m; });
    STREAM9.forEach(([a, b, c, d]) => { const m = new T.Mesh(new T.BoxGeometry(c - a, .02, d - b), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .25 })); R.place(m, (a + c) / 2, (b + d) / 2, .4); });
    this.v = vineSet(R, E, VINES9);
    this.w = [windSpirit(R, E, [-4, 6], { sp: 1.4 }), windSpirit(R, E, [4, 17], { sp: 1.6 })];
    this.orbs = orbRow(E, R, 3, -1.3, 21.5, 1.3, 2.4);
  },
  init(){ return { vs: this.v.init(), got: [0, 0, 0], items: [mkItem('kite', 4, 1.8)] }; },
  solve(st){ st.got = [1, 1, 1]; },
  itemMesh: kites.itemMesh,
  hasKite(st, idx){ return st.items.some(it => it.k === 'kite' && it.s === 1 && it.w === idx); },
  push(st, R, E, pos, idx){ const w = windPush(E, R, pos, this.w); if (!this.hasKite(st, idx)) return w; const lz = R.lz(pos.z), s = STREAM9.find(([a, b, c, d]) => pos.x > a && pos.x < c && lz > b && lz < d); if (!s) return w; return [s[4] * 6.5 + (w ? w[0] : 0), -s[5] * 6.5 + (w ? w[1] : 0)]; },
  pits(st, R){ return [ALL(R)]; },
  bridges(st, R, E){ const out = IS9.map(([a, b, c, d]) => R.rect(a, b, c, d)); if (this.hasKite(st, E.myIdx())) STREAM9.forEach(([a, b, c, d]) => out.push(R.rect(a, b, c, d))); return out; },
  colliders(st, R){ return this.v.rects(st.vs, R); },
  onFlash(st, R, E, idx, x, z){ this.v.burnNear(st.vs, x, R.lz(z), 4.5, E); },
  onBridge(st, R, E, sb){ this.v.burnSeg(st.vs, sbLocal(R, sb), 1, E); },
  host(dt, st, R, E){
    this.v.tick(dt, st.vs, R, E);
    AP9.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, .95))){ st.got[i] = 1; E.ev('pick', `A golden apple! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three golden apples — the gardens bow and the door opens!'); }
  },
  visual(dt, t, st, R){ this.v.visual(st.vs, R); this.am.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.y += dt; }); spinWind(this.w, dt); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 golden apples — each needs a different sky trick: a <b>shared bridge</b>, a <b>kite current</b>, and <b>burning thorns</b>. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const QRING = (() => { const out = []; for (let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2; out.push([Math.sin(a) * 7, 11.5 + Math.cos(a) * 7]); } return out; })();
const queenRoom = {
  name: 'The Storm Queen',
  floor: sky,
  noDashJump: true,
  notes: [[0, 1.4, '“She is the storm. Pierce her with a bridge of light.”', 1.4]],
  get hint(){ return solo() ? 'Stand on the ring, face the Storm Queen and tap ☀ when she is within reach: your light bridge pierces her. Three hits. Dodge the lightning and the wind.' : 'The Storm Queen floats in the middle, too far for a light step. Stand on OPPOSITE sides of the ring with her between you and both tap ☀ together: the long bridge pierces her. Three hits! Dodge the lightning, mind the wind.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    isle(R, E, -10, 0, 10, 3.6); isle(R, E, -10, 19.4, 10, 22);
    QRING.forEach(([x, lz]) => isle(R, E, x - 1.3, lz - 1.3, x + 1.3, lz + 1.3, stone(E)));
    this.q = R.ghost({ home: [0, 11.5], look: 'crown', tint: 0x9ab8ff, scale: 2, sp: 0, harmless: true, flashImmune: true, label: 'the Storm Queen', gone: st => st.done, think: (g, dt, st, R2) => { const a = st.t * (.35 + st.hits * .12); g.x = Math.sin(a) * 2.6; g.z = R2.Z(11.5 + Math.cos(a * 1.3) * 2.6); g.y = .4 + Math.sin(st.t * 2) * .2; return true; } });
    this.w = [0, 1, 2].map(k => windSpirit(R, E, [k === 1 ? 8.5 : -8.5, k === 2 ? 20.5 : 2], { sp: 1.5, gone: st => st.hits < k || st.done }));
    this.mark = new T.Mesh(new T.RingGeometry(.3, 1.4, 24), new T.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false })); this.mark.rotation.x = -Math.PI / 2; this.mark.visible = false; E.scene.add(this.mark);
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 3);
  },
  init(){ return { t: 0, hits: 0, cd: 0, lt: 3, mk: null, done: 0 }; },
  solve(st){ st.hits = 3; st.done = 1; },
  pits(st, R){ return [ALL(R)]; },
  bridges(st, R){ return [R.rect(-10, 0, 10, 3.6), R.rect(-10, 19.4, 10, 22), ...QRING.map(([x, lz]) => R.rect(x - 1.3, lz - 1.3, x + 1.3, lz + 1.3))]; },
  push(st, R, E, pos){ return windPush(E, R, pos, this.w, 5); },
  onBridge(st, R, E, sb){ if (st.done || st.cd > 0 || (!E.solo() && !sb.joint)) return; const s = sbLocal(R, sb), g = this.q; if (segDistL(g.x, R.lz(g.z), ...s) < 1.5){ st.hits++; st.cd = 2; E.ev('boom', st.hits < 3 ? `The light pierces the Storm Queen! (${st.hits}/3) She howls — the winds rise!` : ''); if (st.hits >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Storm Queen dissolves into a summer breeze. The sky gardens are yours — the door opens!'); } } },
  host(dt, st, R, E){
    if (st.done) return;
    st.t += dt; st.cd = Math.max(0, st.cd - dt); st.lt -= dt;
    if (st.mk){ st.mk[2] -= dt; if (st.mk[2] <= 0){ for (const p of E.P) if (!p.frozen && !p.dashing && Math.hypot(p.pos.x - st.mk[0], R.lz(p.pos.z) - st.mk[1]) < 1.4) E.freeze(p.idx, E.FREEZE, `The Storm Queen\'s lightning struck ${E.names()[p.idx]}!`); E.ev('boom'); st.mk = null; } }
    else if (st.lt <= 0){ const T = E.P.filter(p => !p.frozen && R.inside(p.pos) && R.lz(p.pos.z) > 3.6 && R.lz(p.pos.z) < 19.4); if (T.length){ const p = T[Math.floor(Math.random() * T.length)]; st.mk = [+p.pos.x.toFixed(2), +R.lz(p.pos.z).toFixed(2), 1.2]; } st.lt = 3 - st.hits * .5; }
  },
  visual(dt, t, st, R){ this.mark.visible = !!st.mk; if (st.mk){ this.mark.position.set(st.mk[0], .08, R.Z(st.mk[1])); this.mark.material.opacity = .3 + (1.2 - st.mk[2]) * .5; } spinWind(this.w, dt); setOrbs(this.orbs, st.hits); },
  objective(st, R, E){ return st.done ? 'The storm has passed — the door is open!' : `Pierce the <b>Storm Queen</b> with a bridge of light 3 times — ${solo() ? 'face her from the ring and tap ☀.' : 'stand on opposite sides of the ring and <b>both tap ☀ together</b>.'} Lightning strikes the red circles! (${st.hits}/3)`; }
};

export default {
  level: 14,
  // texture pack in tex/level14/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'panel', tex: 'topiary', w: 2, h: 2.2, y: 1.1, every: 6, color: 0x2a5a2a, skip: 3 },   // wall dressing: ivy (engine wallDecor)
  wallImg: 'garden_wall', trimImg: 'sky_gilt', texVer: 1,
  texFloors: {
    "The Cloud Steps": "cloud_steps",
    "The Twin Terraces": "terrace_terracotta",
    "The Windy Terrace": "lichen_flags",
    "The Thorn Maze": "thorn_grass",
    "The Kite Run": "kite_lawn",
    "The Sundial Beds": "sundial_gravel",
    "The Bramble Wall": "bramble_moss",
    "The Storm Front": "storm_slate",
    "The Hanging Gardens": "bridge_planks_pale",
    "The Storm Queen": "queen_mosaic"
  },
  title: 'The Sky Gardens',
  tagline: 'Above the manor, beyond the clouds,<br>a garden floats where nobody should be able to walk.',
  story: 'Islands of grass drift in an endless sky. Here, light is solid — if you shine it right. The wind spirits play rough, and the thorns are always growing.',
  winTitle: 'Head in the clouds! ☁️',
  feature: { name: 'Spirit Bridge', icon: '🌈', how: 'Tap <b>☀</b> (F) facing a gap for a short bridge of light (a few steps long). <b>Both tap ☀ at the same moment</b> for a long bridge between you (up to 14 steps). Solo: your light bridge is longer.' },
  accent: '#9ad8ff',
  wallColor: 0xcfc8b8,
  trimColor: 0xd4af37,
  doorColor: 0x8a6a4a,
  sky: 0x9ac8ff,
  bg: 0x6a8ac8,
  drone: 52,
  rooms: [steps, terraces, windy, thornMaze, kites, sundial, bramble, storm, hanging, queenRoom],
};
