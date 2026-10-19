// Level 16 — The Wax Museum. New power: VAULT (a dash carries you over low walls — rope barriers, plinths, benches).
// Enemies: Wax Figures (they only move when nobody is LOOKING at them) and melting floors.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const carpet = E => E.mat(0xffffff, { roughness: .95, map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#6a1a24'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c8a24a'; x.lineWidth = 2; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = '#8a2a34'; x.beginPath(); x.arc(w / 2, h / 2, 10, 0, 7); x.fill(); }, 8, 8) });
const marbleF = E => E.mat(0xffffff, { roughness: .3, map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#e8e2d8'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,110,100,.3)'; x.lineWidth = 2; for (let i = 0; i < 5; i++){ x.beginPath(); x.moveTo(Math.random() * w, 0); x.bezierCurveTo(Math.random() * w, h / 3, Math.random() * w, h * .6, Math.random() * w, h); x.stroke(); } x.strokeStyle = '#a89878'; x.strokeRect(0, 0, w, h); }, 6, 6) });
const voidMat = E => new E.THREE.MeshBasicMaterial({ color: 0x0a0604 });
const waxMat = E => E.mat(0xf0d8b8, { roughness: .4, emissive: 0x3a2a1a, emissiveIntensity: .2 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const rope = (R, E, x1, lz1, x2, lz2) => { R.low(x1, lz1, x2, lz2); const T = E.THREE; const horiz = Math.abs(x2 - x1) > Math.abs(lz2 - lz1); const len = horiz ? Math.abs(x2 - x1) : Math.abs(lz2 - lz1); const n = Math.max(2, Math.round(len / 2.2)); for (let i = 0; i <= n; i++){ const f = i / n, px = horiz ? x1 + (x2 - x1) * f : (x1 + x2) / 2, pl = horiz ? (lz1 + lz2) / 2 : lz1 + (lz2 - lz1) * f; const post = new T.Mesh(new T.CylinderGeometry(.07, .1, .9, 8), E.mat(0xd4af37, { metalness: .8 })); R.place(post, px, pl, .45); } const r = new T.Mesh(new T.BoxGeometry(horiz ? len : .1, .1, horiz ? .1 : len), E.mat(0xa81a2a)); R.place(r, (x1 + x2) / 2, (lz1 + lz2) / 2, .8); };
const vaultTip = '<b>Dash</b> (Space / ⚡) into a low barrier to vault over it';

/* ---------- wax figures: frozen while anyone looks at them, terrifyingly quick when nobody does ---------- */
function watchedBy(g, P, R, extra){ return P.some(p => { if (p.frozen || !R.inside(p.pos)) return false; const dx = g.x - p.pos.x, dz = g.z - p.pos.z, d = Math.hypot(dx, dz); if (d < .01 || d > 17) return false; if ((dx * Math.sin(p.ry) + dz * Math.cos(p.ry)) / d < .62) return false; return !extra || extra(p, d); }); }
function waxFig(R, E, home, opt = {}){
  const g = R.ghost({ home, look: 'statue', tint: opt.tint || 0xf0d8b8, sp: 0, flashImmune: !!opt.flashImmune, label: opt.label || 'a wax figure', b: opt.b, gone: opt.gone, scale: opt.scale || 1,
    think: (g, dt, st, R2, E2, P) => {
      const m = g.mem;
      const watched = opt.watched ? opt.watched(g, st, P) : watchedBy(g, P, R2, opt.see ? (p, d) => opt.see(st, g, p, d) : null);
      m.watched = watched; if (watched){ m.still = (m.still || 0) + dt; return true; }
      m.still = 0;
      let best = null, bd = opt.radius || 30; for (const p of E2.targetsOf(g, P)){ if (!R2.inside(p.pos)) continue; const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
      if (best){ E2.stepToward(g, best.pos.x, best.pos.z, (typeof opt.sp === 'function' ? opt.sp(st) : (opt.sp || 3)) * E2.GMULT, dt); E2.resolve(g, E2.colliders(-1)); }
      E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), .9);
      return true;
    } });
  const T = E.THREE; const plinth = new T.Mesh(new T.CylinderGeometry(.5, .55, .1, 12), E.mat(0x3a3a3a)); g.mesh.add(plinth);
  return g;
}

/* =============================================================== */
const ROPE1 = [[-10, 5, 10, 5.4], [-10, 9.2, 10, 9.6], [-10, 13.4, 10, 13.8], [-10, 17.6, 10, 18]];
const ropes = {
  name: 'The Velvet Ropes',
  floor: carpet,
  notes: [[0, 1.6, '“Please do not touch the exhibits.” (Nobody said anything about jumping over them.)', 1.5]],
  hint: 'Run at a rope barrier and dash (Space / ⚡) — the dash vaults you clean over it. Ordinary walls are still too tall.',
  build(R, E){ EE = E; ROPE1.forEach(r => rope(R, E, ...r)); for (const x of [-7, 7]) for (const lz of [7.3, 11.5, 15.7]){ const T = E.THREE, p = new T.Mesh(new T.BoxGeometry(.8, 1, .8), E.mat(0x2a2a2a)); R.place(p, x, lz, .5); const f = new T.Mesh(new T.SphereGeometry(.4, 10, 8), waxMat(E)); R.place(f, x, lz, 1.5); } },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 18.4)){ st.done = 1; R.open('exit'); E.ev('door', 'Over the ropes — the door opens!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : `<b>NEW: Vault!</b> ${vaultTip}. Get over all four rope lines.`; }
};

/* =============================================================== */
const TIX2 = [[-8, 17], [8, 12], [0, 20.5]];
const gallery = {
  name: 'The Figure Gallery',
  floor: carpet,
  notes: [[3, 1.4, '“They only move when nobody is watching. So… watch them.”', 1.5]],
  hint: 'A wax figure is frozen while either of you is FACING it. The moment nobody looks, it rushes at you. Walk backwards, keep them in front of you, and ' + 'vault the ropes. Collect the three golden tickets.',
  build(R, E){
    EE = E;
    rope(R, E, -10, 8, -3, 8.4); rope(R, E, 3, 8, 10, 8.4); rope(R, E, -3, 14, 3, 14.4); rope(R, E, -10, 15, -5, 15.4); rope(R, E, 5, 15.5, 10, 15.9);
    this.f = [waxFig(R, E, [-6, 11]), waxFig(R, E, [6, 5]), waxFig(R, E, [5, 18.5])];
    this.tm = TIX2.map(([x, lz]) => { const m = new E.THREE.Mesh(new E.THREE.BoxGeometry(.5, .04, .25), E.glow(0xffd34a, .9)); R.place(m, x, lz, .5); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  host(dt, st, R, E){
    TIX2.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A golden ticket! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three tickets — the door opens!'); }
  },
  visual(dt, t, st){ this.tm.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.y += dt * 2; }); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 golden tickets. <b>Wax figures</b> only move when <b>nobody is looking at them</b> — keep them in view! (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const LAMP3 = [[6.5, .55, 0], [11.5, .7, 1.7], [16.5, .45, 3.1]];
const KEY3 = [[-8, 9], [8, 14], [-3, 19]];
const meltFloor = {
  name: 'The Melting Floor',
  floor: E => E.mat(0xe8c890, { roughness: .4 }),
  notes: [[3, 1.4, '“The heat lamps melt the wax floor. A freeze bolt sets it hard again.”', 1.5]],
  hint: 'Wherever a heat lamp passes, the wax floor melts into a puddle you\'ll sink through. Puddles harden again after a while — or instantly if you fire a freeze bolt over them. Vault the benches. Collect the three wax keys.',
  build(R, E){
    EE = E; const T = E.THREE;
    rope(R, E, -4, 4, 4, 4.4); rope(R, E, -10, 12, -4, 12.4); rope(R, E, 4, 17, 10, 17.4);
    this.lamps = LAMP3.map(() => { const g = new T.Group(); const sh = new T.Mesh(new T.ConeGeometry(.6, .8, 12, 1, true), new T.MeshStandardMaterial({ color: 0x3a3a3a, side: T.DoubleSide })); sh.position.y = 3; g.add(sh); const b = new T.Mesh(new T.SphereGeometry(.25, 10, 8), E.glow(0xff6a2a, 2)); b.position.y = 2.7; g.add(b); const l = new T.PointLight(0xff6a2a, 4, 6, 1.2); l.position.y = 2.4; g.add(l); E.scene.add(g); return g; });
    this.pud = Array.from({ length: 40 }, () => { const m = new T.Mesh(new T.CircleGeometry(1.5, 18), new T.MeshStandardMaterial({ color: 0xffa040, emissive: 0xff6a10, emissiveIntensity: .5, transparent: true, opacity: .85 })); m.rotation.x = -Math.PI / 2; m.visible = false; E.scene.add(m); return m; });
    this.km = KEY3.map(([x, lz]) => { const m = new T.Mesh(new T.TorusGeometry(.2, .06, 6, 12), waxMat(E)); R.place(m, x, lz, .5); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ return { t: 0, sp: [], got: [0, 0, 0], drop: 0 }; },
  solve(st){ st.got = [1, 1, 1]; st.sp = []; },
  lampX(L, t){ return Math.sin(t * L[1] + L[2]) * 8.5; },
  pits(st, R){ return st.sp.map(([x, lz]) => R.rect(x - 1.25, lz - 1.25, x + 1.25, lz + 1.25)); },
  boltStep(st, R, E, b){ const n0 = st.sp.length; st.sp = st.sp.filter(([x, lz]) => Math.hypot(b.x - x, R.lz(b.z) - lz) > 2); if (st.sp.length < n0 && !b.cooled){ b.cooled = 1; E.ev('zap', 'The bolt sets the melted wax hard!'); } },
  host(dt, st, R, E){
    st.t += dt; st.drop -= dt;
    st.sp.forEach(s => s[2] -= dt); st.sp = st.sp.filter(s => s[2] > 0);
    if (st.drop <= 0){ st.drop = .45; LAMP3.forEach(L => { const x = +this.lampX(L, st.t).toFixed(2); if (!st.sp.some(([a, b]) => Math.hypot(a - x, b - L[0]) < 1.2)) st.sp.push([x, L[0], 3.6]); }); if (st.sp.length > 40) st.sp.splice(0, st.sp.length - 40); }
    KEY3.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A wax key! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three wax keys — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.lamps.forEach((g, i) => g.position.set(this.lampX(LAMP3[i], st.t), 0, R.Z(LAMP3[i][0]))); this.pud.forEach((m, i) => { const s = st.sp[i]; m.visible = !!s; if (s){ m.position.set(s[0], .02, R.Z(s[1])); m.material.opacity = Math.min(.85, s[2] / 2); } }); this.km.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 wax keys. <b>Heat lamps</b> melt the floor into puddles you fall through — a <b>freeze bolt</b> over a puddle hardens it instantly. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const RING4 = (() => { const out = []; for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; out.push([Math.sin(a) * 6.5, 11.5 + Math.cos(a) * 6.5]); } return out; })();
const impostor = {
  name: 'The Impostor',
  floor: marbleF,
  notes: [[0, 1.6, '“Eight figures. Seven are wax. One is very much not.”', 1.5]],
  hint: 'One of the eight figures is a real ghost wearing a wax face. Hold ☀ for Ghost Sight — the impostor glows. Then hit it with a freeze bolt (move toward it and tap ☀). Bolt a real wax figure and they ALL come to life for a while…',
  build(R, E){
    EE = E; const T = E.THREE;
    this.fig = RING4.map(([x, lz]) => { const g = new T.Group(); const p = new T.Mesh(new T.CylinderGeometry(.6, .7, .6, 12), E.mat(0x2a2a2a)); p.position.y = .3; g.add(p); const b = new T.Mesh(new T.CapsuleGeometry(.35, .8, 6, 12), waxMat(E)); b.position.y = 1.2; g.add(b); const h = new T.Mesh(new T.SphereGeometry(.3, 12, 10), waxMat(E)); h.position.y = 2.05; g.add(h); const aura = new T.Mesh(new T.SphereGeometry(.9, 12, 10), new T.MeshBasicMaterial({ color: 0x9affd8, transparent: true, opacity: .3, depthWrite: false })); aura.position.y = 1.4; aura.visible = false; g.add(aura); g.userData.aura = aura; R.place(g, x, lz); R.block(x - .6, lz - .6, x + .6, lz + .6, .01, E.mat(0)); return g; });
    this.wake = [0, 1, 2].map(k => waxFig(R, E, RING4[k * 3], { gone: st => !(st.awake > 0) || st.done, sp: 3.4 }));
  },
  init(){ return { imp: Math.floor(Math.random() * 8), awake: 0, done: 0, hit: RING4.map(() => 0) }; },
  solve(st){ st.done = 1; },
  boltTargets(st, R){ return st.done ? [] : RING4.map(([x, lz], i) => st.hit[i] ? null : [x, R.Z(lz), i, .9]).filter(Boolean); },
  onBoltTarget(st, R, E, id){ if (id === st.imp){ st.done = 1; R.open('exit'); E.ev('crash', 'The wax face cracks — the ghost inside shrieks and flees! The door opens.'); } else { st.hit[id] = 1; st.awake = 9; this.wake.forEach((g, k) => { const [x, lz] = RING4[(k * 3 + 1) % 8]; g.x = x; g.z = R.Z(lz); }); E.ev('boo', 'Wrong figure! The whole exhibit lurches to life!'); } },
  host(dt, st, R, E){ st.awake = Math.max(0, st.awake - dt); },
  visual(dt, t, st, R, E){ this.fig.forEach((g, i) => { g.userData.aura.visible = E.sight && i === st.imp && !st.done; g.visible = !(st.done && i === st.imp); g.children[1].material.color.setHex(st.hit[i] ? 0xc8a888 : 0xf0d8b8); }); },
  objective(st, R, E){ return st.done ? 'The impostor is gone — the door is open!' : st.awake > 0 ? '<b>The figures are awake!</b> Keep them in view until they settle…' : 'One of the 8 figures is a <b>real ghost</b>. Find it with Ghost Sight (hold ☀), then hit it with a <b>freeze bolt</b>. Wrong guess wakes the exhibit!'; }
};

/* =============================================================== */
const CB = 8, CX5 = c => -8.75 + c * 2.5, CL5 = r => 2.25 + r * 2.4;
const KN5 = [[1, 3], [5, 4], [2, 6], [6, 1]];
const KM = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const chess = {
  name: 'The Wax Chessboard',
  floor: E => E.mat(0xffffff, { roughness: .5, map: E.tiledTex(64, 64, (x, w, h) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++){ x.fillStyle = (i + j) % 2 ? '#2a2420' : '#e8dcc8'; x.fillRect(i * 32, j * 32, 32, 32); } }, 4, 4.3) }),
  notes: [[0, 1.4, '“The wax knights leap whenever your back is turned — and they only ever move like knights.”', 1.5]],
  hint: 'Each wax knight hops one L-shaped knight\'s move towards you every second that NOBODY is facing it. Watched, it can\'t move. Plan a route where you can keep the nearest knights in view, and reach the crown on the far side.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.kn = KN5.map(() => { const g = new T.Group(); const base = new T.Mesh(new T.CylinderGeometry(.45, .55, .4, 12), waxMat(E)); base.position.y = .2; g.add(base); const neck = new T.Mesh(new T.BoxGeometry(.4, 1, .55), waxMat(E)); neck.position.set(0, .8, .05); neck.rotation.x = -.3; g.add(neck); const head = new T.Mesh(new T.BoxGeometry(.38, .4, .8), waxMat(E)); head.position.set(0, 1.35, .3); g.add(head); E.scene.add(g); return g; });
    this.crown = new T.Mesh(new T.TorusGeometry(.35, .1, 8, 6), E.mat(0xd4af37, { metalness: .8, emissive: 0x5a4210 })); this.crown.rotation.x = Math.PI / 2; R.place(this.crown, 0, 20.5, .8);
  },
  init(){ return { k: KN5.map(([c, r]) => [c, r]), t: KN5.map((_, i) => .5 + i * .2), got: 0 }; },
  solve(st){ st.got = 1; },
  colliders(st, R){ return []; },
  host(dt, st, R, E){
    if (!st.got && E.P.some(p => !p.frozen && near(R, p, 0, 20.5, 1))){ st.got = 1; R.open('exit'); E.ev('door', 'The wax crown! The knights slump back onto their squares — the door opens.'); }
    if (st.got) return;
    for (const p of E.P){ if (p.frozen || !R.inside(p.pos)) continue; if (st.k.some(([c, r]) => Math.hypot(p.pos.x - CX5(c), R.lz(p.pos.z) - CL5(r)) < .9)) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} bumped into a wax knight!`); }
    st.k.forEach((k, i) => {
      const x = CX5(k[0]), lz = CL5(k[1]), g = { x, z: R.Z(lz) };
      const watched = watchedBy(g, E.P, R);
      if (watched){ st.t[i] = Math.max(st.t[i], .6); return; }
      st.t[i] -= dt; if (st.t[i] > 0) return; st.t[i] = 1;
      const T = E.P.filter(p => !p.frozen && R.inside(p.pos)); if (!T.length) return;
      let best = null, bd = 1e9; for (const [dc, dr] of KM){ const nc = k[0] + dc, nr = k[1] + dr; if (nc < 0 || nr < 0 || nc >= CB || nr >= CB) continue; if (st.k.some((o, j) => j !== i && o[0] === nc && o[1] === nr)) continue; const d = Math.min(...T.map(p => Math.hypot(p.pos.x - CX5(nc), R.lz(p.pos.z) - CL5(nr)))); if (d < bd){ bd = d; best = [nc, nr]; } }
      if (best){ st.k[i] = best; E.ev('thud'); for (const p of T) if (Math.abs(p.pos.x - CX5(best[0])) < 1.3 && Math.abs(R.lz(p.pos.z) - CL5(best[1])) < 1.3) E.freeze(p.idx, E.FREEZE, `A wax knight leapt onto ${E.names()[p.idx]}!`); }
    });
  },
  visual(dt, t, st, R, E){ this.kn.forEach((g, i) => { const [c, r] = st.k[i]; const x = CX5(c), z = R.Z(CL5(r)); if (Math.hypot(g.position.x - x, g.position.z - z) > 6) g.position.set(x, 0, z); g.position.x += (x - g.position.x) * E.damp(12, dt); g.position.z += (z - g.position.z) * E.damp(12, dt); g.position.y = Math.min(1.2, Math.hypot(g.position.x - x, g.position.z - z) * .6); const near2 = E.P.length ? E.P[0].pos : E.me.pos; g.rotation.y = Math.atan2(near2.x - g.position.x, near2.z - g.position.z); }); this.crown.visible = !st.got; this.crown.rotation.z += dt; },
  objective(st, R, E){ return st.got ? 'The door is open!' : 'Cross the chessboard to the wax crown. Each <b>wax knight</b> leaps a knight\'s move towards you every second <b>nobody is facing it</b>.'; }
};

/* =============================================================== */
const BLK6 = [[-6.5, 4.5], [-2.5, 6.5], [2, 5], [6, 8], [1.5, 10.5], [-3, 12], [-7, 14.5], [-2.5, 16.5], [3, 15], [7, 17.5]];
const SINK6 = 1.4, UP6 = 3.5;
const bath = {
  name: 'The Wax Bath',
  floor: E => E.mat(0xff9a3a, { roughness: .2, emissive: 0xc84a10, emissiveIntensity: .5 }),
  notes: [[0, 1.6, '“A vat of molten wax. The floating blocks sink under your weight.”', 1.5]],
  hint: 'Each floating block starts sinking a moment after someone stands on it, and bobs back up a few seconds later. Dash (Space) to leap the gaps — you can\'t walk them. Keep moving!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.bm = BLK6.map(([x, lz]) => { const m = new T.Mesh(new T.BoxGeometry(2.4, .6, 2.4), waxMat(E)); R.place(m, x, lz, .1); return m; });
    R.floor(-10, 0, 10, 2.6, marbleF(E), .05); R.floor(-10, 19.6, 10, 22, marbleF(E), .05);
  },
  init(){ return { on: BLK6.map(() => 0), dn: BLK6.map(() => 0), done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return st.done ? [] : [R.rect(-10.5, 2.6, 10.5, 19.6)]; },
  bridges(st, R){ return BLK6.map(([x, lz], i) => st.dn[i] > 0 ? null : R.rect(x - 1.2, lz - 1.2, x + 1.2, lz + 1.2)).filter(Boolean); },
  host(dt, st, R, E){
    BLK6.forEach(([x, lz], i) => {
      if (st.dn[i] > 0){ st.dn[i] = Math.max(0, st.dn[i] - dt); return; }
      if (E.P.some(p => !p.frozen && R.inside(p.pos) && Math.abs(p.pos.x - x) < 1.3 && Math.abs(R.lz(p.pos.z) - lz) < 1.3)){ st.on[i] += dt; if (st.on[i] > SINK6){ st.dn[i] = UP6; st.on[i] = 0; E.ev('splash'); } } else st.on[i] = Math.max(0, st.on[i] - dt * .5);
    });
    if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.8)){ st.done = 1; R.open('exit'); E.ev('door', 'Across the wax bath — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.bm.forEach((m, i) => { const sink = st.dn[i] > 0 ? -.8 : -(st.on[i] / SINK6) * .35; m.position.y += (.1 + sink - m.position.y) * E.damp(8, dt); m.rotation.z = Math.sin(t * 1.3 + i) * .03; }); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Cross the vat of molten wax. <b>Dash</b> between the floating blocks — each one <b>sinks</b> if you stand on it too long.'; }
};

/* =============================================================== */
const MASK7 = [[-8, 18], [8, 9], [0, 13]];
const darkGallery = {
  name: 'The Dark Gallery',
  floor: carpet,
  dark: st => st.lights ? .2 : .96,
  notes: [[0, 1.6, '“When the lights go out, you can only watch what your lantern shows you.”', 1.5]],
  hint: 'The gallery lights flicker off every few seconds. In the dark you can only "watch" a figure that\'s inside your lantern\'s glow — the rest come for you. A flash lights the room up for a moment. Grab the three masks.',
  build(R, E){
    EE = E;
    rope(R, E, -10, 6, -4, 6.4); rope(R, E, 4, 6, 10, 6.4); rope(R, E, -3, 11, 3, 11.4); rope(R, E, -10, 15, -4, 15.4); rope(R, E, 4, 16, 10, 16.4);
    this.f = [[-6, 9], [6, 13], [-5, 19], [5, 20], [0, 6]].map(h => waxFig(R, E, h, { sp: 2.7, see: (st, g, p, d) => st.lights || st.fl > 0 || d < 4 }));
    this.mm = MASK7.map(([x, lz]) => { const m = new E.THREE.Mesh(new E.THREE.SphereGeometry(.3, 12, 8, 0, Math.PI), E.mat(0xffffff, { side: E.THREE.DoubleSide, emissive: 0x8a8a8a })); R.place(m, x, lz, .7); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ return { t: 0, lights: 1, fl: 0, got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  onFlash(st){ st.fl = 2; },
  host(dt, st, R, E){
    st.t += dt; st.fl = Math.max(0, st.fl - dt); const k = st.t % 7; const l = k < 4 ? 1 : 0; if (l !== st.lights){ st.lights = l; E.ev(l ? 'click' : 'boo', l ? '' : 'The lights go out…'); }
    MASK7.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A carnival mask! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three masks — the lights come on for good and the door opens!'); st.done = 1; }
  },
  visual(dt, t, st){ this.mm.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 masks. When the lights go out, you can only hold still the figures inside your <b>lantern glow</b> — a <b>flash</b> lights everything for a moment. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const FG = 2, FC8 = 9, FR8 = 8, FX8 = c => -9 + c * FG, FL8 = r => 3.5 + r * FG;
const ART8 = [[-7, 15.5], [7, 9.5], [1, 17.5]];
const fire = {
  name: 'The Fire Exit',
  floor: marbleF,
  notes: [[0, 1.6, '“A wax museum and an open flame. What could go wrong?”', 1.5]],
  hint: 'The fire spreads from tile to tile, and walking into flames sends you back to the start. A freeze bolt puts out every flame along its path. Save the three masterpieces (just touch them) and get to the door. The low benches can be vaulted.',
  build(R, E){
    EE = E; const T = E.THREE;
    rope(R, E, -6, 8.5, 0, 8.9); rope(R, E, 2, 13.5, 8, 13.9);
    this.fm = []; for (let c = 0; c < FC8; c++) for (let r = 0; r < FR8; r++){ const g = new T.Group(); for (let k = 0; k < 3; k++){ const f = new T.Mesh(new T.ConeGeometry(.35, 1 + Math.random() * .6, 6), new T.MeshBasicMaterial({ color: [0xff4a10, 0xffa020, 0xffe060][k], transparent: true, opacity: .85 })); f.position.set((Math.random() - .5) * 1.2, .5, (Math.random() - .5) * 1.2); g.add(f); } g.visible = false; R.place(g, FX8(c) + 1, FL8(r) + 1); this.fm.push(g); }
    this.am = ART8.map(([x, lz]) => { const g = new T.Group(); const fr = new T.Mesh(new T.BoxGeometry(1.4, 1, .1), E.mat(0xd4af37, { metalness: .8 })); fr.position.y = 1.2; g.add(fr); const pic = new T.Mesh(new T.PlaneGeometry(1.2, .8), E.glow(0x6a8ac8, .5)); pic.position.set(0, 1.2, .06); g.add(pic); R.place(g, x, lz); return g; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ const f = Array(FC8 * FR8).fill(0); [[2, 3], [7, 5], [4, 7]].forEach(([c, r]) => f[r * FC8 + c] = 9); return { f, t: 0, got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; st.f.fill(0); },
  cellAt(x, lz){ const c = Math.floor((x - FX8(0)) / FG), r = Math.floor((lz - FL8(0)) / FG); return c >= 0 && r >= 0 && c < FC8 && r < FR8 ? r * FC8 + c : -1; },
  boltStep(st, R, E, b){ const i = this.cellAt(b.x, R.lz(b.z)); if (i >= 0){ const c = i % FC8, r = Math.floor(i / FC8); let n = 0; for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++){ const cc = c + dc, rr = r + dr; if (cc < 0 || rr < 0 || cc >= FC8 || rr >= FR8) continue; if (st.f[rr * FC8 + cc] > 0){ st.f[rr * FC8 + cc] = -6; n++; } } if (n && !b.doused){ b.doused = 1; E.ev('splash', 'The freeze bolt snuffs out the flames!'); } } },
  host(dt, st, R, E){
    if (st.got.every(Boolean)){ st.f.fill(0); }
    st.t += dt;
    st.f = st.f.map(v => v > 0 ? (v - dt > 0 ? +(v - dt).toFixed(2) : -8) : v < 0 ? Math.min(0, +(v + dt).toFixed(2)) : 0);
    if (st.t > 1.4 && !st.got.every(Boolean)){ st.t = 0; const nf = st.f.slice(); st.f.forEach((v, i) => { if (!(v > 0)) return; const c = i % FC8, r = Math.floor(i / FC8); for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const cc = c + dc, rr = r + dr; if (cc < 0 || rr < 0 || cc >= FC8 || rr >= FR8) continue; if (nf[rr * FC8 + cc] === 0 && Math.random() < .28) nf[rr * FC8 + cc] = 9; } }); if (!nf.some(v => v > 0)) nf[Math.floor(Math.random() * nf.length)] = 9; st.f = nf; }
    for (const p of E.P){ if (p.frozen || !R.inside(p.pos)) continue; const i = this.cellAt(p.pos.x, R.lz(p.pos.z)); if (i >= 0 && st.f[i] > 0){ E.freeze(p.idx, 2, `${E.names()[p.idx]} got singed! Back to the start.`); const sp = R.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); } }
    ART8.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1.2))){ st.got[i] = 1; E.ev('pick', `Masterpiece saved! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All three masterpieces saved — the sprinklers kick in and the door opens!'); }
  },
  visual(dt, t, st){ this.fm.forEach((g, i) => { g.visible = st.f[i] > 0; if (g.visible) g.children.forEach((f, k) => f.scale.y = .8 + Math.sin(t * 12 + k + i) * .25); }); this.am.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Save the 3 masterpieces from the spreading fire. <b>Freeze bolts</b> put out the flames they pass. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const twin = {
  name: 'The Twin Exhibits',
  floor: marbleF,
  notes: [[0, 1.4, '“Through the glass, you can watch what your partner can\'t.”', 1.5]],
  get hint(){ return solo() ? 'Solo: the figures freeze whenever you face them, as usual. Get to the top of either hall.' : 'A glass wall splits the gallery. The figures on YOUR side only freeze when your PARTNER is looking at them through the glass — your own gaze does nothing. Walk up side by side and watch each other\'s backs.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    const g = new T.Mesh(new T.BoxGeometry(.2, 2.6, 18), new T.MeshStandardMaterial({ color: 0xbfe0ff, transparent: true, opacity: .25 })); R.place(g, 0, 10.5, 1.3); R.block(-.1, 1.5, .1, 19.5, .01, E.mat(0));
    rope(R, E, -10, 7, -4, 7.4); rope(R, E, 4, 9, 10, 9.4); rope(R, E, -6, 13, -.5, 13.4); rope(R, E, .5, 15, 6, 15.4);
    const side = (g, x) => x < 0 ? 0 : 1;
    const watchOther = (g, st, P) => { if (EE.solo()) return watchedBy(g, P, R); const s = side(g, g.x); return watchedBy(g, P.filter(p => (p.pos.x < 0 ? 0 : 1) !== s), R); };
    this.f = [[-6, 10], [-3, 17], [-8, 19], [6, 6], [3, 12], [8, 18]].map(h => waxFig(R, E, h, { sp: 2.8, watched: watchOther, b: h[0] < 0 ? [-9.6, -.4, 1.6, 21.4] : [.4, 9.6, 1.6, 21.4] }));
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20)){ st.done = 1; R.open('exit'); E.ev('door', 'Both exhibits crossed — the door opens!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : solo() ? 'Reach the far end. Keep the figures in view!' : 'One of you in each hall. The figures on your side only freeze when <b>your partner</b> watches them through the glass!'; }
};

/* =============================================================== */
const LAMP10 = [[-5, 8], [5, 8], [0, 16]], PLATE10 = [[9, 4], [-9, 4], [0, 21]];
const madame = {
  name: 'Madame Wax',
  floor: marbleF,
  notes: [[0, 1.4, '“The curator made every figure here. She was the first.”', 1.4]],
  hint: 'Madame Wax only moves when nobody is looking at her — so look away to lure her. Get her under one of the three heat lamps (the circles), then switch that lamp on with its numbered plate. Keep her there: while someone WATCHES her she can\'t walk out of the heat. She melts a little more each time.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.lm = LAMP10.map(([x, lz], i) => { const ring = new T.Mesh(new T.RingGeometry(1.6, 1.9, 28), new T.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: .5, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; R.place(ring, x, lz, .03); const lamp = new T.Mesh(new T.ConeGeometry(.7, .9, 12, 1, true), new T.MeshStandardMaterial({ color: 0x3a3a3a, side: T.DoubleSide })); R.place(lamp, x, lz, 4); const glowc = new T.Mesh(new T.CylinderGeometry(.3, 1.8, 3.6, 16, 1, true), new T.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: .25, side: T.DoubleSide, depthWrite: false })); R.place(glowc, x, lz, 1.9); R.plate('l' + i, PLATE10[i][0], PLATE10[i][1], 0xff6a2a, 1.3, ['Ⅰ', 'Ⅱ', 'Ⅲ'][i]); return glowc; });
    this.boss = waxFig(R, E, [0, 12], { scale: 1.6, label: 'Madame Wax', tint: 0xe8b8c8, sp: st => 2.8 + (1 - st.hp / 9) * 1.8, gone: st => st.done, flashImmune: true });
    this.minions = [0, 1].map(k => waxFig(R, E, [k ? 8.5 : -8.5, 20], { sp: 2.6, gone: st => st.hp > 6 - k * 3 || st.done }));
  },
  init(){ return { hp: 9, on: [0, 0, 0], done: 0 }; },
  solve(st){ st.hp = 0; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    PLATE10.forEach((_, i) => { if (R.edge('l' + i)){ st.on[i] = 5; E.ev('click', 'A heat lamp blazes on!'); } st.on[i] = Math.max(0, st.on[i] - dt); });
    const b = this.boss; LAMP10.forEach(([x, lz], i) => { if (st.on[i] > 0 && Math.hypot(b.x - x, R.lz(b.z) - lz) < 1.9){ const before = Math.ceil(st.hp / 3); st.hp = Math.max(0, st.hp - dt); if (Math.ceil(st.hp / 3) < before) E.ev('boo', st.hp > 0 ? 'Madame Wax is MELTING! She shrieks — her figures stir!' : ''); } });
    if (st.hp <= 0){ st.done = 1; R.open('exit'); E.ev('door', 'Madame Wax melts into a puddle! The museum doors swing open.'); }
  },
  visual(dt, t, st, R, E){ this.lm.forEach((m, i) => { m.visible = st.on[i] > 0; m.material.opacity = .2 + Math.sin(t * 9) * .05; }); const s = .7 + .3 * (st.hp / 9); this.boss.mesh.scale.set(1.6, 1.6 * s, 1.6); },
  bar(st){ return st.done ? null : { frac: st.hp / 9, label: 'Madame Wax', color: '#e8b8c8' }; },
  objective(st, R, E){ return st.done ? 'She\'s a puddle — escape the museum!' : 'Melt <b>Madame Wax</b>: lure her under a heat-lamp circle (she only moves when <b>no one looks</b>), switch that lamp on with its plate, and <b>watch her</b> so she can\'t walk out of the heat.'; }
};

export default {
  level: 16,
  title: 'The Wax Museum',
  tagline: 'Every figure here was modelled on a real visitor.<br>None of them ever left.',
  story: 'Velvet ropes, glass cases, rows of waxen faces. The figures are perfectly still — as long as somebody is looking.',
  winTitle: 'Out of the museum! 🕯️',
  feature: { name: 'Vault', icon: '🤸', how: '<b>Dash</b> (Space / ⚡) into a low barrier — a rope, a bench, a plinth — to <b>vault right over it</b>. Tall walls still stop you.' },
  accent: '#e8b8c8',
  wallColor: 0x5a1a24,
  trimColor: 0xd4af37,
  doorColor: 0x3a1a1a,
  lowColor: 0xa81a2a,
  sky: 0xc89aa8,
  bg: 0x0a0406,
  drone: 41,
  rooms: [ropes, gallery, meltFloor, impostor, chess, bath, darkGallery, fire, twin, madame],
};
