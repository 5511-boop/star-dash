// Level 13 — The Coal Mine. New power: LANTERN OIL — down here your lantern burns oil, and the darker it gets the less you see.
// Enemies: Tommyknockers — little mine spirits drawn to light. The brighter your lantern, the further away they notice you.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const rock = E => E.mat(0xffffff, { roughness: .95, map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#2a2420'; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++){ x.fillStyle = ['#1a1612', '#3a3028', '#141010', '#4a3a2a'][i % 4]; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 9, 0, 7); x.fill(); } }, 6, 6) });
const voidMat = E => new E.THREE.MeshBasicMaterial({ color: 0x020101 });
const stoneMat = E => E.mat(0x3a3028, { roughness: 1 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; };
const oilCans = (list) => list.map(([x, lz], i) => mkItem('oil', x, lz, { n: 100 + i }));
const glowOre = (E, col = 0xffc84a) => { const T = E.THREE, m = new T.Mesh(new T.DodecahedronGeometry(.3), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .9, metalness: .6, roughness: .3 })); return m; };
const timber = (R, E, x, lz) => { const T = E.THREE, m = E.mat(0x5a3a1a); for (const s of [-1, 1]){ const p = new T.Mesh(new T.BoxGeometry(.3, 2.8, .3), m); R.place(p, x + s * 1.6, lz, 1.4); } const b = new T.Mesh(new T.BoxGeometry(3.5, .3, .35), m); R.place(b, x, lz, 2.8); };

/* ---------- Tommyknocker: hunts the brightest light it can see ---------- */
function knocker(R, E, home, opt = {}){
  const g = R.ghost({ home, look: 'small', tint: opt.tint || 0x9a7a4a, sp: 0, label: opt.label || 'a Tommyknocker', b: opt.b, gone: opt.gone, ignoreDecoy: true, scale: opt.scale || .85,
    think: (g, dt, st, R2, E2, P) => {
      const m = g.mem; let best = null, bs = 0;
      for (const p of E2.targetsOf(g, P)){ if (!R2.inside(p.pos)) continue; const b = Math.max(0, p.oil ?? 1), d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < (opt.base || 2.2) + (opt.reach || 8) * b){ const s = (b + .25) / (d + 1); if (s > bs){ bs = s; best = [p.pos.x, p.pos.z, 1]; } } }
      for (const dc of E2.S.decoys){ const d = Math.hypot(dc.x - g.x, dc.z - g.z); if (d < 10){ const s = 1.5 / (d + 1); if (s > bs){ bs = s; best = [dc.x, dc.z, 0]; } } }
      if (opt.lights) for (const [x, z, b] of opt.lights(st, R2)){ const d = Math.hypot(x - g.x, z - g.z); if (d < 3 + 8 * b){ const s = (b + .25) / (d + 1); if (s > bs){ bs = s; best = [x, z, 0]; } } }
      const sp = (typeof opt.sp === 'function' ? opt.sp(st) : (opt.sp || 2.6)) * E2.GMULT;
      if (best){ if (Math.hypot(best[0] - g.x, best[1] - g.z) > (best[2] ? .05 : .7)) E2.stepToward(g, best[0], best[1], sp, dt); m.hunt = 1; }
      else { m.hunt = 0; m.t = (m.t || 0) - dt; if (m.t <= 0 || !m.w){ m.w = [g.home[0] + (Math.random() - .5) * 6, g.home[1] + (Math.random() - .5) * 6]; m.t = 3; } E2.stepToward(g, m.w[0], m.w[1], sp * .4, dt); }
      if (opt.walls !== false) E2.resolve(g, E2.staticRects());
      if (g.b){ g.x = E2.clamp(g.x, g.b[0], g.b[1]); g.z = E2.clamp(g.z, g.b[2], g.b[3]); }
      if (opt.onStep) opt.onStep(g, dt, st, m);
      E2.ghostTouch(g, E2.targetsOf(g, P), E2.names());
      return true;
    } });
  const T = E.THREE, pick = new T.Group(); const h = new T.Mesh(new T.CylinderGeometry(.04, .04, .7, 5), E.mat(0x6a4a2a)); h.rotation.z = .6; pick.add(h); const head = new T.Mesh(new T.BoxGeometry(.5, .08, .08), E.mat(0x8a8a90, { metalness: .8 })); head.position.set(-.2, .3, 0); head.rotation.z = .6; pick.add(head); pick.position.set(.45, .8, .2); g.mesh.add(pick); g.pick = pick;
  return g;
}
const swingPicks = (gs, t) => gs.forEach((g, i) => { if (g.pick) g.pick.rotation.x = g.mem.hunt ? Math.sin(t * 9 + i) * .8 : Math.sin(t * 2 + i) * .2; });

/* =============================================================== */
const PIT1 = [[-10, 4, -1.8, 6.2], [1.8, 7.6, 10, 9.8], [-10, 11.2, -0.5, 13.4], [0.5, 14.8, 10, 17], [-10, 18.2, -3, 20]];
const OIL1 = [[6.5, 5], [-6, 9], [5, 12.3], [-5, 16]];
const lamphouse = {
  name: 'The Lamp House',
  floor: rock,
  dark: .93,
  oilRate: 1 / 24,
  notes: [[0, 1.6, '“Down here your lantern drinks oil. When it\'s dry, the dark is very dark.”', 1.5]],
  hint: 'Your lantern burns oil (the orange bar). As it runs low your light shrinks and you can barely see the shafts in the floor. Pick up the red oil cans along the way to refill.',
  build(R, E){
    EE = E; const T = E.THREE;
    PIT1.forEach(([a, b, c, d]) => R.floor(a, b, c, d, voidMat(E), .015));
    for (const lz of [3, 10.5, 17.6]) timber(R, E, lz === 10.5 ? 3 : -3, lz);
  },
  init(){ return { done: 0, items: oilCans(OIL1) }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return PIT1.map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.4)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the lamp house — the door opens!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : '<b>NEW: Lantern Oil!</b> Down the mine your lantern burns oil (orange bar) — the lower it gets, the less you can see. Grab the red <b>oil cans</b> and mind the shafts!'; }
};

/* =============================================================== */
const NUG2 = [[-8, 18.5], [8, 12], [-2, 9]], OIL2 = [[7.5, 3], [-8, 10], [3, 19]];
const PIL2 = [[-6, 6, -3, 8], [2, 4.5, 4.5, 7], [-4, 12, 1, 14], [4, 14.5, 7, 16.5], [-6.5, 15, -4, 17]];
const tunnels = {
  name: 'The Knocking Tunnels',
  floor: rock,
  dark: .92,
  oilRate: 1 / 45,
  notes: [[3, 1.4, '“Hear that knocking? Tommyknockers. They go for the brightest light.”', 1.5]],
  hint: 'Tommyknockers spot you from further away the brighter your lantern is — with a full tank they see you across the room, nearly empty they almost have to bump into you. They\'re also drawn to decoy lanterns. A flash scares them off, but it costs oil.',
  build(R, E){
    EE = E;
    PIL2.forEach(([a, b, c, d]) => R.block(a, b, c, d, 2.6, stoneMat(E)));
    this.nm = NUG2.map(([x, lz]) => { const m = glowOre(E); R.place(m, x, lz, .5); return m; });
    this.k = [knocker(R, E, [6, 9]), knocker(R, E, [-6, 13]), knocker(R, E, [0, 17.5])];
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0], items: oilCans(OIL2) }; },
  solve(st){ st.got = [1, 1, 1]; },
  host(dt, st, R, E){
    NUG2.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A gold nugget! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All three nuggets — the door opens!'); }
  },
  visual(dt, t, st){ this.nm.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.y += dt; }); swingPicks(this.k, t); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 glowing gold nuggets. <b>Tommyknockers</b> hunt the brightest light — the more oil in your lantern, the further they see you. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
// ore carts: one cart rides a loop of rails across the chasm; a lever picks the route at the junction
const CH3 = [-10, 7, 10, 15];
const LOOPA = [[-7, 3], [7, 3], [7, 5.5], [-7, 5.5]];          // short loop: stays south
const LOOPB = [[-7, 3], [7, 3], [7, 18.5], [-7, 18.5]];        // long loop: crosses the chasm twice
const ORE3 = [[-4, 17.5], [0, 20.5], [4, 17.5]], CRUSH3 = [-9, 1.5];
const segLen = pts => pts.map((p, i) => Math.hypot(pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1]));
const along = (pts, s) => { const L = segLen(pts), tot = L.reduce((a, b) => a + b, 0); s = ((s % tot) + tot) % tot; for (let i = 0; i < pts.length; i++){ if (s <= L[i]){ const a = pts[i], b = pts[(i + 1) % pts.length], f = s / L[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[0] - a[0], -(b[1] - a[1]))]; } s -= L[i]; } return [pts[0][0], pts[0][1], 0]; };
const carts = {
  name: 'The Ore Carts',
  floor: rock,
  dark: .6,
  oilRate: 1 / 90,
  notes: [[3, 1.4, '“The only way over the chasm is by cart. Throw the switch to send it north.”', 1.5]],
  hint: 'Stand in the cart to ride it. The lever (by the junction, bottom right) decides the cart\'s route next time it passes: short loop, or the long loop over the chasm. Ride north, grab ore, ride back and drop it in the crusher (bottom left). Don\'t stand on the rails in front of the cart!',
  build(R, E){
    EE = E; const T = E.THREE;
    R.floor(CH3[0], CH3[1], CH3[2], CH3[3], voidMat(E), .015);
    const rail = E.mat(0x6a6a72, { metalness: .8 });
    const lay = (a, b) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); for (const o of [-.45, .45]){ const r = new T.Mesh(new T.BoxGeometry(.08, .08, len), rail); const ang = Math.atan2(b[0] - a[0], -(b[1] - a[1])); r.rotation.y = ang; R.place(r, (a[0] + b[0]) / 2 + Math.cos(ang) * o, (a[1] + b[1]) / 2 + Math.sin(ang) * o, .1); } };
    [[LOOPB[0], LOOPB[1]], [LOOPB[1], LOOPB[2]], [LOOPB[2], LOOPB[3]], [LOOPB[3], LOOPB[0]], [[7, 5.5], [-7, 5.5]]].forEach(([a, b]) => lay(a, b));
    this.cart = new T.Group(); const box = new T.Mesh(new T.BoxGeometry(1.6, .8, 1.2), E.mat(0x5a4a3a, { metalness: .4 })); box.position.y = .55; this.cart.add(box); for (const sx of [-.6, .6]) for (const sz of [-.45, .45]){ const w = new T.Mesh(new T.CylinderGeometry(.2, .2, .1, 10), E.mat(0x2a2a2a)); w.rotation.z = Math.PI / 2; w.position.set(sx, .2, sz); this.cart.add(w); } const lamp = new T.PointLight(0xffb36b, 4, 9, 1.4); lamp.position.y = 1.5; this.cart.add(lamp); E.scene.add(this.cart);
    R.plate('lever', 9, 4.2, 0xffd34a, 1.2, '⇄');
    this.sign = textPlane(E, 1.6, .8, 1); R.place(this.sign, 9, 5.6, 1.6);
    const cr = new T.Mesh(new T.CylinderGeometry(1, .7, 1.2, 10, 1, true), new T.MeshStandardMaterial({ color: 0x6a6a72, metalness: .7, side: T.DoubleSide })); R.place(cr, CRUSH3[0], CRUSH3[1], .6);
    this.orbs = orbRow(E, R, 3, -6.5, 1, 1.3, 1.6);
  },
  init(){ return { s: 0, route: 0, next: 0, got: 0, ride: [0, 0], items: ORE3.map(([x, lz], i) => mkItem('ore', x, lz, { n: i })) }; },
  solve(st){ st.got = 3; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ return k === 'ore' ? glowOre(E, 0x8ad8ff) : null; },
  loop(st){ return st.route ? LOOPB : LOOPA; },
  sNow(st, R){ return R.local.s ?? st.s; },
  cartPos(st, R){ return along(this.loop(st), this.sNow(st, R)); },
  pits(st, R){ return [R.rect(CH3[0], CH3[1], CH3[2], CH3[3])]; },
  bridges(st, R){ const [x, lz] = this.cartPos(st, R); return [R.rect(x - .9, lz - .9, x + .9, lz + .9)]; },
  carryTick(st, R, E, it, p){ if (near(R, p, CRUSH3[0], CRUSH3[1], 1.6)){ it.s = 3; st.got++; E.ev('thud', st.got < 3 ? `Crunch! Ore into the crusher (${st.got}/3)` : ''); } },
  onLand(st, R, E, it){ if (Math.hypot(it.x - CRUSH3[0], it.lz - CRUSH3[1]) < 1.6){ it.s = 3; st.got++; E.ev('thud'); } else if (it.lz > CH3[1] && it.lz < CH3[3]){ home(it); E.ev('thud', 'The ore tumbles into the chasm — another lump falls from the seam up north.'); } },
  host(dt, st, R, E){
    if (R.edge('lever')){ st.next = st.next ? 0 : 1; E.ev('click', st.next ? 'Switch set: LONG loop (over the chasm).' : 'Switch set: short loop.'); }
    const before = st.s; st.s += 3.2 * dt * E.GMULT;
    const tot = segLen(this.loop(st)).reduce((a, b) => a + b, 0);
    if (st.s >= tot){ st.s -= tot; if (st.route !== st.next){ st.route = st.next; } }
    const [x, lz, a] = along(this.loop(st), st.s);
    for (const p of E.P){ if (p.frozen || p.dashing || !R.inside(p.pos)) continue; const dx = p.pos.x - x, dl = R.lz(p.pos.z) - lz; const riding = Math.abs(dx) < .95 && Math.abs(dl) < .95; if (riding) continue; const fx = Math.sin(a), fl = -Math.cos(a); const ahead = dx * fx + dl * fl, side = Math.abs(-dx * fl + dl * fx); if (ahead > 0 && ahead < 1.5 && side < .8) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} was run over by the ore cart!`); }
    if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'Three loads of ore crushed — the door opens!'); }
  },
  local(dt, st, R, E){
    const L = R.local; const tot = segLen(this.loop(st)).reduce((a, b) => a + b, 0);
    const prev = L.s; L.s = (L.s === undefined || Math.abs(L.s - st.s) > 2 || L.route !== st.route) ? st.s : L.s + 3.2 * dt * E.GMULT + (st.s - L.s) * .1; L.route = st.route;
    const p = E.me.pos; const [x, lz] = along(this.loop(st), L.s);
    if (L.pp && !E.me.dash && R.inside(p)){ const dx = p.x - L.pp[0], dl = R.lz(p.z) - L.pp[1]; if (Math.abs(dx) < .95 && Math.abs(dl) < .95){ p.x += x - L.pp[0]; p.z -= lz - L.pp[1]; } }
    L.pp = [x, lz];
  },
  visual(dt, t, st, R, E){ const [x, lz, a] = this.cartPos(st, R); this.cart.position.set(x, 0, R.Z(lz)); this.cart.rotation.y = a; setOrbs(this.orbs, st.got); if (this.lastN !== st.next){ this.lastN = st.next; redraw(this.sign, (c, W, H) => { c.fillStyle = '#1a1410'; c.fillRect(0, 0, W, H); c.fillStyle = st.next ? '#8affc1' : '#ffd34a'; c.font = 'bold 54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.next ? 'NORTH ↑' : 'LOOP ↺', W / 2, H / 2); }); } },
  objective(st, R, E){ return st.got >= 3 ? 'The door is open (across the chasm)!' : `Ride the cart over the chasm, fetch the 3 blue ore lumps and drop them in the crusher (bottom left). The ⇄ lever sets the cart's route. (${st.got}/3)`; }
};

/* =============================================================== */
const GAS4 = [[-10, 7, -4.5, 10.5], [-2.5, 6.5, 3, 9], [5, 7.5, 10, 11], [-7.5, 12.5, -1.5, 15.5], [1, 11, 6.5, 14.5], [-10, 16.5, -6, 19], [-1, 17, 10, 19.2]];
const DRAIN4 = [-6, 3.5], OIL4 = [[8.5, 21], [-8, 21]];
const canary = {
  name: 'The Canary\'s Song',
  floor: rock,
  dark: .9,
  oilRate: 1 / 60,
  notes: [[3, 1.4, '“Firedamp: invisible, and it hates a flame. Take the canary — she knows.”', 1.5]],
  get hint(){ return 'Carry the canary: the closer you are to a pocket of gas, the more frantically she sings (watch her bar). A lit lantern in the gas means BOOM. Either thread between the pockets by her song — or pour your oil away at the grate until your lantern is almost out, then walk through in the dark and refill at the far end.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    R.plate('drain', DRAIN4[0], DRAIN4[1], 0x6a4a2a, 1.4, '⛁');
    const cage = new T.Mesh(new T.CylinderGeometry(.5, .5, .1, 12), E.mat(0xd4af37)); R.place(cage, 3, 3, .05);
    this.puffs = GAS4.map(([a, b, c, d]) => { const m = new T.Mesh(new T.BoxGeometry(c - a, .02, d - b), new T.MeshBasicMaterial({ color: 0x9aff6a, transparent: true, opacity: 0 })); R.place(m, (a + c) / 2, (b + d) / 2, .05); return m; });
  },
  init(){ return { boom: GAS4.map(() => 0), items: [mkItem('canary', 3, 3), ...oilCans(OIL4)] }; },
  solve(){},
  itemMesh(k, E){ if (k !== 'canary') return null; const T = E.THREE, g = new T.Group(); const cage = new T.Mesh(new T.CylinderGeometry(.3, .3, .6, 10, 1, true), new T.MeshStandardMaterial({ color: 0xd4af37, metalness: .8, wireframe: true })); cage.position.y = .3; g.add(cage); const b = new T.Mesh(new T.SphereGeometry(.15, 10, 8), E.glow(0xffe04a, .8)); b.position.y = .3; g.add(b); g.userData.bird = b; return g; },
  gasNear(R, x, lz){ let d = 99; for (const [a, b, c, e] of GAS4){ const cx = Math.max(a, Math.min(x, c)), cl = Math.max(b, Math.min(lz, e)); d = Math.min(d, Math.hypot(x - cx, lz - cl)); } return d; },
  inGas(R, x, lz){ return GAS4.findIndex(([a, b, c, d]) => x > a && x < c && lz > b && lz < d); },
  host(dt, st, R, E){
    st.boom = st.boom.map(v => Math.max(0, v - dt));
    for (const p of E.P){ if (p.frozen || !R.inside(p.pos)) continue; const i = this.inGas(R, p.pos.x, R.lz(p.pos.z)); if (i >= 0 && (p.oil ?? 1) > .12){ st.boom[i] = 1.2; E.ev('boom', `BOOM! ${E.names()[p.idx]}\'s lantern lit the firedamp!`); E.freeze(p.idx, E.FREEZE); const sp = R.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); } }
    if (!R.isOpen('exit') && E.P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 20)) R.open('exit');
  },
  local(dt, st, R, E){ if (R.inside(E.me.pos) && R.at('drain', E.me.pos)){ E.me.oil = Math.max(0, E.me.oil - dt * .35); } },
  visual(dt, t, st, R, E){
    this.puffs.forEach((m, i) => m.material.opacity = st.boom[i] > 0 ? st.boom[i] * .5 : (E.sight ? .12 : 0));
    const it = st.items[0], d = this.gasNear(R, it.x, it.lz), k = Math.max(0, 1 - d / 4);
    const L = R.local; L.ch = (L.ch || 0) - dt; if (it.s === 1 && k > 0 && L.ch <= 0 && R.inside(E.me.pos)){ E.beep(1800 + k * 900, .05, 'sine', .04 + k * .05); L.ch = .9 - k * .8; }
  },
  bar(st, R, E){ const it = st.items[0]; if (it.s !== 1 || it.w !== E.myIdx()) return R.at('drain', E.me.pos) ? { frac: E.me.oil, label: 'Pouring out oil…', color: '#ff9a3d' } : null; const d = this.gasNear(R, it.x, it.lz); return { frac: Math.max(0, 1 - d / 4), label: d < .1 ? 'GAS! (the canary fainted)' : 'Canary song', color: '#ffe04a' }; },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : 'Cross the gallery. Invisible <b>firedamp</b> explodes if a lit lantern touches it. The <b>canary</b> sings faster near gas — or pour your oil out at the ⛁ grate and cross in the dark. Oil cans wait at the far end.'; }
};

/* =============================================================== */
const CRY5 = [[-6, 2.6], [-2, 7], [3, 9.5], [6.5, 13.5], [2, 17], [-5, 13], [-7.5, 18]];
const LIT5 = 9, RAD5 = 3.2;
const crystals = {
  name: 'The Crystal Cavern',
  floor: rock,
  dark: .95,
  oilRate: 1 / 50,
  notes: [[-3, 1.4, '“The crystals drink lantern light and pour it out as solid ground.”', 1.5]],
  hint: 'A crystal lights up when a lantern with plenty of oil comes close to it — and while it glows, its circle of light is solid floor over the chasm. Each one glows about 9 seconds. Hop from light to light: reach the next crystal before the last one fades. Keep your oil up (there\'s a can on the middle crystal).',
  build(R, E){
    EE = E; const T = E.THREE;
    R.floor(-10, 4.2, 10, 19.4, voidMat(E), .015);
    this.cm = CRY5.map(([x, lz]) => { const g = new T.Group(); const c = new T.Mesh(new T.OctahedronGeometry(.55), new T.MeshStandardMaterial({ color: 0x8ad8ff, emissive: 0x2a6aff, emissiveIntensity: .2, transparent: true, opacity: .9 })); c.scale.y = 1.8; c.position.y = 1; g.add(c); const disc = new T.Mesh(new T.CircleGeometry(RAD5, 32), new T.MeshBasicMaterial({ color: 0x8ad8ff, transparent: true, opacity: 0, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = .04; g.add(disc); const l = new T.PointLight(0x8ad8ff, 0, 9, 1.4); l.position.y = 1.5; g.add(l); g.userData = { c, disc, l }; R.place(g, x, lz); R.floor(x - .7, lz - .7, x + .7, lz + .7, stoneMat(E), .03); return g; });
  },
  init(){ return { lit: CRY5.map((_, i) => i === 0 ? LIT5 : 0), items: oilCans([[3, 9.5]]) }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return st.done ? [] : [R.rect(-10.5, 4.2, 10.5, 19.4)]; },
  bridges(st, R){ const out = CRY5.map(([x, lz]) => R.rect(x - .7, lz - .7, x + .7, lz + .7)); CRY5.forEach(([x, lz], i) => { if (st.lit[i] > 0){ for (let k = -3; k <= 3; k++){ const hw = Math.sqrt(Math.max(0, RAD5 * RAD5 - (k * RAD5 / 3.5) ** 2)); out.push(R.rect(x - hw, lz + k * RAD5 / 3.5 - .5, x + hw, lz + k * RAD5 / 3.5 + .5)); } } }); return out; },
  host(dt, st, R, E){
    st.lit = st.lit.map((v, i) => i === 0 && st.lit.every((w, j) => j === 0 || w <= 0) ? Math.max(v - dt, 0) : Math.max(0, v - dt));
    CRY5.forEach(([x, lz], i) => { if (E.P.some(p => !p.frozen && (p.oil ?? 1) > .3 && near(R, p, x, lz, 3))){ if (st.lit[i] < LIT5 - .5) E.ev('chime', '', i % 4); st.lit[i] = LIT5; } });
    if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.6)){ st.done = 1; R.open('exit'); E.ev('door', 'Across the crystal cavern — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.cm.forEach((g, i) => { const v = st.lit[i] / LIT5, on = st.lit[i] > 0, warn = on && st.lit[i] < 2.5; const { c, disc, l } = g.userData; c.material.emissiveIntensity = on ? (warn ? .6 + Math.sin(t * 20) * .5 : 1.6) : .2; disc.material.opacity = on ? (warn ? .15 + Math.sin(t * 20) * .1 : .32) : 0; l.intensity = on ? 3 : 0; c.rotation.y += dt * (on ? 2 : .3); }); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Cross the chasm on <b>crystal light</b>: bring a well-fuelled lantern near a crystal to light it — its glow is solid ground for ~9 seconds. Hop light to light!'; }
};

/* =============================================================== */
const EW6 = [[-10, 4, -3, 4.6], [0, 4, 6, 4.6], [-6, 6.5, -5.4, 10], [3, 7, 10, 7.6], [-3, 7.6, -2.4, 13], [-10, 10, -6, 10.6], [-2.4, 10, 4, 10.6], [6, 10.6, 6.6, 16], [-7, 13, -3, 13.6], [0, 13.6, .6, 18.5], [-10, 16, -4, 16.6], [3, 16, 6, 16.6], [-4, 18.5, 0, 19.1], [3, 19.1, 3.6, 22]];
const TAG6 = [[-8, 7], [8.5, 13], [-8, 19.5]];
const echo = {
  name: 'The Echo Pit',
  floor: rock,
  dark: .99,
  lantern: () => .18,
  notes: [[3, 1.4, '“The air is too thick for a lantern. Listen for the walls instead.”', 1.5]],
  hint: 'Your lantern is almost useless in the choking air. Click / tap to PING — the echo lights up the rock walls around the ping for a moment. But the Tommyknockers hear pings: every ping draws them towards it. Find the three miner\'s tags.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.wm = EW6.map(([a, b, c, d]) => { const m = new T.Mesh(new T.BoxGeometry(c - a, 2.6, d - b), new T.MeshStandardMaterial({ color: 0x1a1410, emissive: 0x8ad8ff, emissiveIntensity: 0 })); R.place(m, (a + c) / 2, (b + d) / 2, 1.3); R.block(a, b, c, d, .01, E.mat(0)); return m; });
    this.tm = TAG6.map(([x, lz]) => { const m = new T.Mesh(new T.BoxGeometry(.35, .05, .5), E.glow(0xd4af37, .5)); R.place(m, x, lz, .3); return m; });
    this.k = [knocker(R, E, [7, 3], { reach: .6, lights: st => (st.pg || []).map(([x, l, t]) => [x, R.Z(l), t > 0 ? .9 : 0]) }), knocker(R, E, [-8, 13], { reach: .6, lights: st => (st.pg || []).map(([x, l, t]) => [x, R.Z(l), t > 0 ? .9 : 0]) })];
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { pg: [], got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  onPing(st, R, E, idx, x, z){ st.pg.push([+x.toFixed(2), +R.lz(z).toFixed(2), 3]); if (st.pg.length > 6) st.pg.shift(); },
  host(dt, st, R, E){
    st.pg.forEach(p => p[2] = +(p[2] - dt).toFixed(3)); st.pg = st.pg.filter(p => p[2] > -2);
    TAG6.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A miner's tag! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All three tags — the way out opens!'); }
  },
  visual(dt, t, st, R, E){
    const me = E.me.pos;
    this.wm.forEach((m, i) => { const [a, b, c, d] = EW6[i]; let v = 0; for (const [x, l, tt] of st.pg){ if (tt <= 0) continue; const cx = Math.max(a, Math.min(x, c)), cl = Math.max(b, Math.min(l, d)), dd = Math.hypot(x - cx, l - cl); if (dd < 8) v = Math.max(v, (1 - dd / 8) * Math.min(1, tt / 1.5)); } const close = Math.max(0, 1 - (() => { const cx = Math.max(a, Math.min(me.x, c)), cl = Math.max(b, Math.min(R.lz(me.z), d)); return Math.hypot(me.x - cx, R.lz(me.z) - cl); })() / 1.6); m.material.emissiveIntensity = Math.max(v * 1.4, close * .5); });
    this.tm.forEach((m, i) => m.visible = !st.got[i]); swingPicks(this.k, t); setOrbs(this.orbs, st.got.filter(Boolean).length);
  },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Find the 3 miner's tags in the pitch black. <b>Click / tap to ping</b>: the echo outlines the walls — but Tommyknockers come running to every ping. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const PATH7 = [[0, 0], [1, 0], [1, 1], [1, 2], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4], [3, 3], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5], [4, 5], [3, 5]];
const GC7 = 6, GR7 = 6, GX7 = c => -6.25 + c * 2.5, GL7 = r => 5.25 + r * 2.4;
const glow = {
  name: 'The Glow-worm Grotto',
  floor: rock,
  dark: .96,
  oilRate: 1 / 80,
  notes: [[3, 1.4, '“The glow-worms mark the safe stones — but they hide from a bright flame.”', 1.5]],
  get hint(){ return 'The floor is riddled with hidden shafts. Glow-worms sit above the safe stones, but they only shine for someone whose lantern is LOW, and they go dark near any bright lantern. Pour out oil at the grate, then follow the worms. ' + (solo() ? 'Refill at the far side.' : 'Your partner should keep their bright lantern well away — or dim theirs too.'); },
  build(R, E){
    EE = E; const T = E.THREE;
    R.plate('drain', -7, 2.5, 0x6a4a2a, 1.4, '⛁');
    this.worms = PATH7.map(([c, r]) => { const g = new T.Group(); for (let k = 0; k < 5; k++){ const w = new T.Mesh(new T.SphereGeometry(.07, 6, 4), new T.MeshBasicMaterial({ color: 0x9affc8, transparent: true, opacity: 0 })); w.position.set((Math.random() - .5) * 1.6, 2.4 + Math.random() * .3, (Math.random() - .5) * 1.6); g.add(w); } R.place(g, GX7(c), GL7(r)); return g; });
  },
  init(){ return { items: oilCans([[7, 20.5], [-7, 20.5]]) }; },
  solve(st){ st.done = 1; },
  safe(R){ return PATH7.map(([c, r]) => R.rect(GX7(c) - 1.25, GL7(r) - 1.2, GX7(c) + 1.25, GL7(r) + 1.2)); },
  pits(st, R){ return st.done ? [] : [R.rect(-10.5, 4.05, 10.5, 18.45)]; },
  bridges(st, R){ return this.safe(R); },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.8)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the grotto — the door opens!'); } },
  local(dt, st, R, E){ if (R.inside(E.me.pos) && R.at('drain', E.me.pos)) E.me.oil = Math.max(0, E.me.oil - dt * .35); },
  visual(dt, t, st, R, E){
    const myLow = E.me.oil < .3 && R.inside(E.me.pos);
    const bright = []; if (E.me.oil >= .3) bright.push(E.me.pos); if (E.other.seen && !E.solo() && (E.other.oil ?? 1) >= .3) bright.push(E.other.target);
    this.worms.forEach((g, i) => { const [c, r] = PATH7[i], x = GX7(c), z = R.Z(GL7(r)); const hid = bright.some(p => Math.hypot(p.x - x, p.z - z) < 4.5); const on = myLow && !hid; g.children.forEach((w, k) => { w.material.opacity += ((on ? .9 : 0) - w.material.opacity) * E.damp(6, dt); w.position.y = 2.4 + Math.sin(t * 2 + k + i) * .08; }); });
  },
  bar(st, R, E){ return R.at('drain', E.me.pos) ? { frac: E.me.oil, label: 'Pouring out oil…', color: '#ff9a3d' } : null; },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Hidden shafts everywhere! <b>Glow-worms</b> mark the safe path — but they only shine for a <b>dim</b> lantern and hide from bright ones. Pour out oil at the ⛁ grate, follow the worms, refill at the far side.'; }
};

/* =============================================================== */
const PICK8 = [[-8.5, 7], [8.5, 9], [-3, 15], [7, 19.5]];
const ROCK8 = [[-6, 4, -4, 5.5], [3, 3.5, 5, 5], [-2, 8, 2, 9.5], [-8, 11, -5.5, 12.5], [5, 12, 8, 13.5], [-4, 17, -1, 18.5], [2, 15.5, 3.5, 17.5]];
const warren = {
  name: 'The Knocker Warren',
  floor: rock,
  dark: .94,
  oilRate: 1 / 35,
  notes: [[0, 1.6, '“This is their home. Keep your flame low and your feet quiet.”', 1.5]],
  build(R, E){
    EE = E;
    ROCK8.forEach(([a, b, c, d]) => R.block(a, b, c, d, 2.6, stoneMat(E)));
    this.pm = PICK8.map(([x, lz]) => { const T = E.THREE, g = new T.Group(); const h = new T.Mesh(new T.CylinderGeometry(.05, .05, 1, 5), E.mat(0x6a4a2a)); h.rotation.z = .9; g.add(h); const hd = new T.Mesh(new T.BoxGeometry(.7, .1, .1), E.glow(0xbfbfc8, .4)); hd.position.set(-.3, .2, 0); hd.rotation.z = .9; g.add(hd); R.place(g, x, lz, .3); return g; });
    this.k = [[-5, 9], [6, 6], [0, 13], [-6, 17], [6, 17]].map(h => knocker(R, E, h, { sp: 2.8 }));
    this.orbs = orbRow(E, R, 4, -1.95, 21.3, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0, 0], items: oilCans([[0, 2.5], [9, 21]]) }; },
  solve(st){ st.got = [1, 1, 1, 1]; },
  host(dt, st, R, E){
    PICK8.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A lost pickaxe! (${st.got.filter(Boolean).length}/4)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All four pickaxes recovered — the door opens!'); }
  },
  visual(dt, t, st){ this.pm.forEach((m, i) => m.visible = !st.got[i]); swingPicks(this.k, t); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Recover the 4 lost pickaxes from the Tommyknockers' warren. A <b>dim lantern</b> is your best disguise — your oil drains fast here. (${st.got.filter(Boolean).length}/4)`; }
};
warren.hint = 'Five Tommyknockers live here, and they hunt light. Let your lantern burn low before you go in (it drains fast here) — a dim lantern is nearly invisible to them. Decoy lanterns pull them away, and a flash stuns them — but every flash costs oil.';

/* =============================================================== */
const WALL9 = [[-10, 6, 4, 6.6], [-4, 6.6, -3.4, 12], [1, 9.5, 10, 10.1], [-10, 12, -6, 12.6], [-1, 12.6, -.4, 16.5], [3, 14, 10, 14.6], [-6, 16.5, 1, 17.1]];
const MINER9 = [-7.5, 3], LIFT9 = [7.5, 19.5];
const miner = {
  name: 'The Lost Miner',
  floor: rock,
  dark: .93,
  oilRate: 1 / 55,
  notes: [[0, 1.6, '“A miner\'s ghost is lost in the dark. He\'ll follow any bright lantern home.”', 1.5]],
  hint: 'The lost miner follows the nearest lantern that still has plenty of oil — so keep yours bright and stay close. The Tommyknockers ALSO follow bright lanterns, and if one touches the miner he runs back to where he started. Decoys pull the knockers (but not the miner). Lead him to the lift cage in the top right.',
  build(R, E){
    EE = E; const T = E.THREE;
    WALL9.forEach(([a, b, c, d]) => R.block(a, b, c, d, 2.6, stoneMat(E)));
    const cage = new T.Mesh(new T.BoxGeometry(2.4, 2.8, 2.4), new T.MeshStandardMaterial({ color: 0x6a6a72, metalness: .8, wireframe: true })); R.place(cage, LIFT9[0], LIFT9[1], 1.4);
    R.plate('lift', LIFT9[0], LIFT9[1], 0x8affc1, 2.2);
    this.m = R.ghost({ home: MINER9, look: 'hood', tint: 0xffd38a, sp: 0, harmless: true, ignoreDecoy: true, label: 'the lost miner', think: (g, dt, st, R2, E2, P) => {
      if (st.safe){ g.x = LIFT9[0]; g.z = R2.Z(LIFT9[1]); return true; }
      let best = null, bd = 6;
      for (const p of P){ if (p.frozen || (p.oil ?? 1) < .3 || !R2.inside(p.pos)) continue; const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
      if (best && bd > 1.4) E2.stepToward(g, best.pos.x, best.pos.z, 2.6 * E2.GMULT, dt);
      E2.resolve(g, E2.staticRects());
      g.mem.follow = !!best;
      return true;
    } });
    const lamp = new T.PointLight(0xffd38a, 2.5, 6, 1.4); lamp.position.y = 1.4; this.m.mesh.add(lamp);
    this.k = [knocker(R, E, [3, 8], { lights: st => [[this.m.x, this.m.z, .5]] }), knocker(R, E, [-7, 15], { lights: st => [[this.m.x, this.m.z, .5]] }), knocker(R, E, [6, 17], { lights: st => [[this.m.x, this.m.z, .5]] })];
  },
  init(){ return { safe: 0, items: oilCans([[-8.5, 9], [5, 12]]) }; },
  solve(st){ st.safe = 1; },
  host(dt, st, R, E){
    if (st.safe) return;
    const g = this.m;
    if (this.k.some(k => !(k.stun > 0) && Math.hypot(k.x - g.x, k.z - g.z) < 1)){ g.x = MINER9[0]; g.z = R.Z(MINER9[1]); E.ev('boo', 'A Tommyknocker spooked the miner — he fled back to the start!'); }
    if (Math.hypot(g.x - LIFT9[0], R.lz(g.z) - LIFT9[1]) < 1.3){ st.safe = 1; R.open('exit'); E.ev('door', 'The miner steps into the lift cage — "Thank ye kindly!" The door opens.'); }
  },
  visual(dt, t, st){ swingPicks(this.k, t); },
  objective(st, R, E){ return st.safe ? 'The miner is safe — the door is open!' : 'Lead the <b>lost miner</b> to the lift cage (top right). He follows the nearest <b>bright</b> lantern — but so do the Tommyknockers, and they scare him back to the start!'; }
};

/* =============================================================== */
const X10 = [[-5, 8], [5, 8], [0, 16]], LEV10 = [[9, 14], [-9, 14], [0, 3.5]];
const oldKnocker = {
  name: 'The Old Knocker',
  floor: rock,
  dark: .9,
  oilRate: 1 / 45,
  notes: [[0, 1.6, '“The eldest knocker. He wants your light more than anything.”', 1.4]],
  hint: 'The Old Knocker chases the brightest lantern (and decoys). Three ore buckets hang over the X marks. Lure him onto an X, then step on that bucket\'s lever: the bucket drops on his head. Each lever is far from its X — so one of you lures and one pulls, or drop a decoy on the X and run.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.bk = X10.map(([x, lz], i) => { const mk = new T.Mesh(new T.RingGeometry(1.1, 1.4, 24), new T.MeshBasicMaterial({ color: 0xff5050, side: T.DoubleSide, transparent: true, opacity: .6 })); mk.rotation.x = -Math.PI / 2; R.place(mk, x, lz, .04); const b = new T.Group(); const pail = new T.Mesh(new T.CylinderGeometry(.9, .7, 1.2, 12), E.mat(0x5a4a3a, { metalness: .5 })); b.add(pail); const ore = glowOre(E); ore.scale.setScalar(2.4); ore.position.y = .7; b.add(ore); const rope = new T.Mesh(new T.CylinderGeometry(.04, .04, 4, 4), E.mat(0x8a7a5a)); rope.position.y = 2.6; b.add(rope); R.place(b, x, lz, 4); R.plate('l' + i, LEV10[i][0], LEV10[i][1], 0xffd34a, 1.3, ['Ⅰ', 'Ⅱ', 'Ⅲ'][i]); const sg = textPlane(E, .9, .9, 1); R.place(sg, x, lz, .05); sg.rotation.x = -Math.PI / 2; redraw(sg, (c, W, H) => { c.fillStyle = '#ffd34a'; c.font = 'bold 150px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(['Ⅰ', 'Ⅱ', 'Ⅲ'][i], W / 2, H / 2); }); return b; });
    this.boss = knocker(R, E, [0, 19], { scale: 2, label: 'the Old Knocker', tint: 0x6a5030, reach: 14, sp: st => st.stun > 0 ? 0 : 2.3 + st.hits * .35, gone: st => st.done });
    this.kids = [0, 1].map(k => knocker(R, E, [k ? 8 : -8, 20], { gone: st => st.hits <= k || st.done }));
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 3);
  },
  init(){ return { drop: [0, 0, 0], up: [0, 0, 0], hits: 0, stun: 0, done: 0, items: oilCans([[-8.5, 4], [8.5, 4], [-8.5, 20], [8.5, 20]]) }; },
  solve(st){ st.hits = 3; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    st.stun = Math.max(0, st.stun - dt);
    st.items.forEach(it => { if (it.s === 3){ it.rt = (it.rt || 0) + dt; if (it.rt > 20){ it.rt = 0; home(it); } } });
    X10.forEach(([x, lz], i) => {
      st.up[i] = Math.max(0, st.up[i] - dt);
      if (st.drop[i] > 0){ st.drop[i] -= dt; if (st.drop[i] <= 0){ st.drop[i] = 0; st.up[i] = 6; const b = this.boss; E.ev('thud'); if (st.stun <= 0 && Math.hypot(b.x - x, R.lz(b.z) - lz) < 1.7){ st.hits++; st.stun = 3; E.ev('boom', st.hits < 3 ? `CLANG! A bucket of ore lands on the Old Knocker! (${st.hits}/3)` : ''); if (st.hits >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Old Knocker is out cold — the mine is yours! The door opens.'); } } for (const p of E.P) if (!p.frozen && Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < 1.3) E.freeze(p.idx, E.FREEZE, `A falling bucket clipped ${E.names()[p.idx]}!`); } }
      else if (st.up[i] <= 0 && R.edge('l' + i)){ st.drop[i] = .6; E.ev('click', 'The bucket drops…'); }
    });
  },
  visual(dt, t, st, R, E){ this.bk.forEach((b, i) => { const y = st.drop[i] > 0 ? .6 + (st.drop[i] / .6) * 3.4 : st.up[i] > 0 ? .6 + Math.min(3.4, (6 - st.up[i]) * 3.4) : 4; b.position.y = y; }); setOrbs(this.orbs, st.hits); },
  objective(st, R, E){ return st.done ? 'The Old Knocker is down — escape the mine!' : `Lure the <b>Old Knocker</b> onto an X, then step on its lever (same number) to drop a bucket of ore on him. He follows the brightest lantern and decoys. (${st.hits}/3)`; }
};

export default {
  level: 13,
  // texture pack in tex/level13/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'cluster', tex: 'crystal_face', w: 1.4, every: 7, glow: .6, color: 0x9a6bff, skip: 2 },   // wall dressing: glowing crystals (engine wallDecor)
  wallImg: 'coal_seam', trimImg: 'mine_timber', texVer: 1,
  texFloors: {
    "The Lamp House": "lamphouse_boards",
    "The Knocking Tunnels": "tunnel_rock",
    "The Ore Carts": "cart_ballast",
    "The Crystal Cavern": "crystal_rock",
    "The Echo Pit": "echo_wet",
    "The Glow-worm Grotto": "glowworm_rock",
    "The Knocker Warren": "warren_earth",
    "The Lost Miner": "collapse_rubble",
    "The Old Knocker": "knocker_stone",
    "The Canary's Song": "canary_flags"
  },
  title: 'The Coal Mine',
  tagline: 'Three hundred miners went down.<br>Their lanterns are still burning.',
  story: 'Every lantern down here burns oil, and the dark is very, very dark. Listen for the knocking — the Tommyknockers are drawn to light.',
  winTitle: 'Back to the surface! ⛏️',
  feature: { name: 'Lantern Oil', icon: '🛢️', how: 'Down the mine your lantern <b>burns oil</b> (orange bar): the lower it gets, the less you see. Red <b>oil cans</b> refill it. A <b>dim</b> lantern also hides you from things that hunt light…' },
  accent: '#ff9a3d',
  wallColor: 0x2a221c,
  trimColor: 0x5a3a1a,
  doorColor: 0x3a2a1a,
  sky: 0x5a4a3a,
  bg: 0x030202,
  drone: 33,
  rooms: [lamphouse, tunnels, carts, canary, crystals, echo, glow, warren, miner, oldKnocker],
};
