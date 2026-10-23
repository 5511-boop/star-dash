// Level 9 — The Ruined Cathedral. New power: GRAPPLE (⚡ while facing a gold hook ring zips you to it).
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

const nave = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#4a4650'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2e2a34'; x.lineWidth = 3; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) x.strokeRect(i * 32 + (j % 2) * 16, j * 32, 32, 32); for (let k = 0; k < 6; k++){ x.strokeStyle = '#1e1a22'; x.beginPath(); x.moveTo(Math.random() * w, Math.random() * h); x.lineTo(Math.random() * w, Math.random() * h); x.stroke(); } }, 6, 6) });
const voidMat = E => new E.THREE.MeshBasicMaterial({ color: 0x030205 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; };
const isle = (R, E, x, lz, hw = 1.6, hd = hw) => R.floor(x - hw, lz - hd, x + hw, lz + hd, nave(E), .03);
const rect = (R, x, lz, hw, hd = hw) => R.rect(x - hw, lz - hd, x + hw, lz + hd);

/* ---------- Gargoyle: perches high, then dive-bombs a marked spot ---------- */
function gargoyle(R, E, key, perch, opt = {}){
  const range = opt.range || 6.5, blast = opt.blast || 1.5, cd = opt.cd || 2.6, py = opt.y || 2.6;
  const g = R.ghost({ home: perch, look: 'statue', tint: opt.tint || 0x7a7a84, flashImmune: false, label: opt.label || 'a gargoyle', sp: 0, scale: opt.scale || 1, flat: true,
    think: (g, dt, st, R2, E2, P) => {
      const m = g.mem; st.dv = st.dv || {};
      if (!m.st){ m.st = 'perch'; m.cd = 1 + Math.random() * 2; }
      if (m.st === 'perch'){
        g.x = g.home[0]; g.z = g.home[1]; g.y = py; m.cd -= dt;
        const T = E2.targetsOf(g, P).filter(p => R2.inside(p.pos) && !p.frozen);
        let best = null, bd = opt.anyRange ? 99 : range; for (const p of T){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
        if (best && m.cd <= 0 && !(opt.active && !opt.active(st))){ st.dv[key] = [+best.pos.x.toFixed(2), +R2.lz(best.pos.z).toFixed(2), 1]; m.st = 'dive'; m.f = 0; m.sx = g.x; m.sz = g.z; E2.ev('whoosh'); }
      } else if (m.st === 'dive'){
        const d = st.dv[key]; if (!d){ m.st = 'back'; m.f = 0; m.rx = g.x; m.rz = g.z; return true; }
        m.f += dt / (opt.diveT || 1.1); const f = Math.min(1, m.f), tz = R2.Z(d[1]);
        g.x = m.sx + (d[0] - m.sx) * f; g.z = m.sz + (tz - m.sz) * f; g.y = py * (1 - f) + .1; g.ry = Math.atan2(d[0] - m.sx, tz - m.sz); d[2] = 1 - f;
        if (f >= 1){
          for (const p of P) if (!p.dashing && !p.frozen && Math.hypot(p.pos.x - d[0], R2.lz(p.pos.z) - d[1]) < blast) E2.freeze(p.idx, E2.FREEZE, `${opt.label || 'A gargoyle'} slammed into ${E2.names()[p.idx]}!`);
          E2.ev('thud'); st.dv[key] = 0; m.st = 'back'; m.f = 0; m.rx = g.x; m.rz = g.z; if (opt.onLand) opt.onLand(st, d);
        }
      } else {
        m.f += dt / 1.6; const f = Math.min(1, m.f);
        g.x = m.rx + (g.home[0] - m.rx) * f; g.z = m.rz + (g.home[1] - m.rz) * f; g.y = py * f;
        if (f >= 1){ m.st = 'perch'; m.cd = cd * (opt.cdMult ? opt.cdMult(st) : 1); }
      }
      return true;
    } });
  g.key = key; return g;
}
function cancelDives(st, R, E, x, z, gs){ let n = 0; for (const g of gs){ if (g.mem.st === 'dive' && Math.hypot(g.x - x, g.z - z) < 7){ st.dv[g.key] = 0; g.mem.st = 'back'; g.mem.f = 0; g.mem.rx = g.x; g.mem.rz = g.z; n++; } } if (n) E.ev('chime', 'The flash startles the gargoyle out of its dive!', 2); }
function diveMarks(E, n = 4){ const T = E.THREE; return Array.from({ length: n }, () => { const m = new T.Mesh(new T.RingGeometry(.3, 1.5, 24), new T.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; E.scene.add(m); return m; }); }
function showMarks(marks, st, R, keys){ marks.forEach((m, i) => { const d = st.dv && st.dv[keys[i]]; m.visible = !!d; if (d){ m.position.set(d[0], .06, R.Z(d[1])); m.scale.setScalar(.5 + (1 - d[2]) * .8); m.material.opacity = .3 + (1 - d[2]) * .5; } }); }

/* =============================================================== */
const NP = [[-4, 7.5], [3, 10.5], [-2, 14], [4, 17.5]];
const collapsed = {
  name: 'The Collapsed Nave',
  floor: nave,
  notes: [[0, 2, '“Face a golden ring and press ⚡ — the grapple will carry you.”', 1.6]],
  hint: 'Turn to face a golden hook ring and tap ⚡ / Space — you zip straight to it, right over the drop. Chain from pillar to pillar.',
  build(R, E){
    R.floor(-10, 4.6, 10, 18.6, voidMat(E), .015);
    NP.forEach(([x, lz]) => { isle(R, E, x, lz, 1.3); R.hook(x, lz); });
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return [R.rect(-10.5, 4.6, 10.5, 18.6)]; },
  bridges(st, R){ return NP.map(([x, lz]) => rect(R, x, lz, 1.3)); },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 18.8)){ st.done = 1; R.open('exit'); E.ev('door', 'Across the nave! The door opens.'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : '<b>NEW: Grapple!</b> Face a golden ring and tap ⚡ / Space to zip to it. Cross the collapsed floor pillar by pillar.'; }
};

/* =============================================================== */
const PERCH2 = [[-9.3, 6], [9.3, 9.5], [-9.3, 13], [9.3, 17]], SHARDS = [[-6, 5], [6, 12], [-5, 17.5]], ALT2 = [0, 20.3];
const gallery = {
  name: 'The Gargoyle Gallery',
  floor: nave,
  notes: [[3, 1.6, '“The gargoyles wake when you pass beneath. Watch for the red shadow.”', 1.5]],
  hint: 'When a red circle appears under you, a gargoyle is diving there — move or dash out of it! A flash makes a diving gargoyle pull up. Carry the three relic shards to the altar.',
  build(R, E){
    const T = E.THREE;
    PERCH2.forEach(([x, lz]) => { const ledge = new T.Mesh(new T.BoxGeometry(1.4, .3, 1.6), E.mat(0x5a5662)); R.place(ledge, x, lz, 2.2); });
    this.gs = PERCH2.map((p, i) => gargoyle(R, E, 'g' + i, p));
    this.marks = diveMarks(E);
    const alt = new T.Mesh(new T.BoxGeometry(2.4, 1, 1.2), E.mat(0xd8d0c4)); R.place(alt, ALT2[0], ALT2[1] + .9, .5);
    for (const [x, lz] of [[-3, 9], [3, 15]]){ const c = new T.Mesh(new T.CylinderGeometry(.6, .7, 3.2, 12), E.mat(0x6a6672)); R.place(c, x, lz, 1.6); R.block(x - .6, lz - .6, x + .6, lz + .6, .01, E.mat(0)); }
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ return { got: 0, dv: {}, items: SHARDS.map(([x, lz]) => mkItem('shard', x, lz)) }; },
  solve(st){ st.got = 3; },
  itemMesh(k, E){ if (k !== 'shard') return null; return new E.THREE.Mesh(new E.THREE.OctahedronGeometry(.32), E.glow(0x9ad8ff, 1.2)); },
  onFlash(st, R, E, idx, x, z){ cancelDives(st, R, E, x, z, this.gs); },
  carryTick(st, R, E, it, p){ if (near(R, p, ALT2[0], ALT2[1], 1.8)){ it.s = 3; st.got++; E.ev('place', st.got < 3 ? `Shard placed (${st.got}/3)` : ''); } },
  onLand(st, R, E, it){ if (Math.hypot(it.x - ALT2[0], it.lz - ALT2[1]) < 1.6){ it.s = 3; st.got++; E.ev('place'); } },
  host(dt, st, R, E){ if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'The relic is whole — the gallery door opens!'); } },
  visual(dt, t, st, R){ showMarks(this.marks, st, R, ['g0', 'g1', 'g2', 'g3']); setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 3 ? 'The door is open!' : `Bring the 3 relic shards to the altar. Gargoyles dive at a <b style="color:#ff5050">red circle</b> under you — get out of it! A flash makes them pull up. (${st.got}/3)`; }
};

/* =============================================================== */
const ISL3 = [[-6, 8], [5, 9], [-4, 14], [6, 15.5]], RUNE3 = [[6, 2], [-5.2, 8.8], [5.8, 9.8], [-3.2, 14.8], [6.8, 16.3]];
const relay = {
  name: 'The Grapple Relay',
  noDashJump: true,
  floor: nave,
  notes: [[-3, 2, '“A ring only glows while someone stands on its rune.”', 1.5]],
  hint: 'An updraft from the chasm knocks you down if you try to dash across — only the grapple works here. Each hook only lights up while someone stands on its matching rune — and the rune is always somewhere else. Take turns: one stands on a rune, the other grapples to the island it lights, then THAT person lights the next one for you.',
  build(R, E){
    R.floor(-10, 4, 10, 19, voidMat(E), .015);
    this.hooks = ISL3.map(([x, lz]) => { isle(R, E, x, lz, 1.8); return R.hook(x, lz); });
    this.hooks.push(R.hook(0, 20.5));
    RUNE3.forEach(([x, lz], i) => R.plate('r' + i, x, lz, 0xd8a8ff, 1.2, String(i + 1)));
    R.plate('r5', -6, 20.5, 0xd8a8ff, 1.2, '5');
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return [R.rect(-10.5, 4, 10.5, 19)]; },
  bridges(st, R){ return ISL3.map(([x, lz]) => rect(R, x, lz, 1.8)); },
  local(dt, st, R, E){
    const all = E.solo() || st.done;
    this.hooks.forEach((h, i) => { h.off = !all && !(i < 4 ? R.on('r' + i) : (R.on('r4') || R.on('r5'))); });
  },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.2)){ st.done = 1; R.open('exit'); E.ev('door', 'Both across — the door opens!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : E.solo() ? 'Grapple island to island to the north shore.' : 'Each golden ring only glows while someone stands on its numbered rune — and the runes are on OTHER islands. Light the way for each other, island by island.'; }
};

/* =============================================================== */
const CEN = [[7.5, 6.5, .8, 0], [11.5, 6.5, 1.05, 1.9], [15.5, 6.5, .9, 3.6]], CW = 1.4;
const cenX = (C, t) => C[1] * Math.sin(t * C[2] + C[3]);
const censers = {
  name: 'The Swinging Censers',
  floor: nave,
  notes: [[0, 2, '“The censers never stop swinging. Catch one — and hold on.”', 1.5]],
  hint: 'The hook rings ride on the swinging censer platforms. Grapple onto one when it swings in front of you — you\'ll ride along. Then grapple to the next when it lines up. The last ring is on the north ledge.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 4.6, 10, 18.6, voidMat(E), .015);
    this.pl = CEN.map(() => { const g = new T.Group(); const p = new T.Mesh(new T.BoxGeometry(CW * 2, .3, CW * 2), E.mat(0x8a7442, { metalness: .5 })); g.add(p); const smoke = new T.Mesh(new T.SphereGeometry(.6, 10, 8), new T.MeshBasicMaterial({ color: 0xd8d0c4, transparent: true, opacity: .3 })); smoke.position.y = 1.6; g.add(smoke); E.scene.add(g); return g; });
    this.hooks = CEN.map(C => R.hook(0, C[0], { noPost: true }));
    R.hook(0, 20);
  },
  init(){ return { t: 0, done: 0 }; },
  solve(st){ st.done = 1; },
  tNow(st, R){ return R.local.t ?? st.t; },
  pits(st, R){ return [R.rect(-10.5, 4.6, 10.5, 18.6)]; },
  bridges(st, R){ const t = this.tNow(st, R); return CEN.map(C => rect(R, cenX(C, t), C[0], CW + .1)); },
  host(dt, st, R, E){ st.t += dt * E.GMULT; if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 18.8)){ st.done = 1; R.open('exit'); E.ev('door', 'Across! The door opens.'); } },
  local(dt, st, R, E){
    const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt * E.GMULT + (st.t - L.t) * .1;
    this.hooks.forEach((h, i) => { h.x = cenX(CEN[i], L.t); h.y = 1.5; });
    const p = E.me.pos, lz = R.lz(p.z);
    if (L.pt !== undefined && !E.me.grap){ const on = CEN.findIndex(C => Math.abs(lz - C[0]) < CW + .1 && Math.abs(p.x - cenX(C, L.pt)) < CW + .1); if (on >= 0) p.x += cenX(CEN[on], L.t) - cenX(CEN[on], L.pt); }
    L.pt = L.t;
  },
  visual(dt, t, st, R, E){ const tt = this.tNow(st, R); this.pl.forEach((g, i) => { g.position.set(cenX(CEN[i], tt), .15, R.Z(CEN[i][0])); g.rotation.z = Math.cos(tt * CEN[i][2] + CEN[i][3]) * .15; }); },
  objective(st, R, E){ return st.done ? 'Across!' : 'Grapple onto the swinging censer platforms and ride them across the chasm.'; }
};

/* =============================================================== */
const LANTS = [[-8, 4], [8, 4], [-8, 19], [8, 19]], ROOST = [[0, 21], [-9, 11], [9, 11]];
const belfry = {
  name: 'The Bat Belfry',
  floor: nave,
  notes: [[0, 1.6, '“Bats hate the flash — but they love a lantern.”', 1.4]],
  hint: 'Stand by a lantern to light it — but bat swarms fly to lit lanterns and snuff them out. Flash a swarm to scatter it back to its roost. All four lanterns must be lit at once: one lights, one guards with the flash.',
  build(R, E){
    const T = E.THREE;
    this.lamps = LANTS.map(([x, lz]) => { const post = new T.Mesh(new T.CylinderGeometry(.08, .08, 2, 6), E.mat(0x2a2a30)); R.place(post, x, lz, 1); const l = new T.Mesh(new T.BoxGeometry(.4, .5, .4), new T.MeshStandardMaterial({ color: 0x554433, emissive: 0xffb36b, emissiveIntensity: 0 })); R.place(l, x, lz, 2.1); const pl = new T.PointLight(0xffb36b, 0, 8, 1.4); R.place(pl, x, lz, 2.4); return { l, pl }; });
    this.swarms = ROOST.map((r, k) => {
      const g = R.ghost({ home: r, look: 'blob', tint: 0x1a1a22, scale: .5, sp: 0, harmless: true, label: 'a bat swarm', think: (g, dt, st, R2, E2, P) => {
        const m = g.mem; if (m.rest > 0){ m.rest -= dt; return true; }
        let tgt = null, bd = 30; LANTS.forEach(([x, lz], i) => { if (st.lit[i] > 0){ const d = Math.hypot(g.x - x, g.z - R2.Z(lz)); if (d < bd){ bd = d; tgt = i; } } });
        if (tgt !== null){ const [x, lz] = LANTS[tgt]; if (E2.stepToward(g, x, R2.Z(lz), 3.4 * E2.GMULT, dt) < 1){ m.sn = (m.sn || 0) + dt; if (m.sn > .5){ st.lit[tgt] = 0; m.sn = 0; E2.ev('whoosh', 'The bats snuffed out a lantern!'); } } }
        else { m.t = (m.t || 0) - dt; if (m.t <= 0 || !m.w){ m.w = [-8 + Math.random() * 16, 4 + Math.random() * 15]; m.t = 3; } E2.stepToward(g, m.w[0], R2.Z(m.w[1]), 2 * E2.GMULT, dt); }
        g.y = 1.2;
        return true;
      } });
      const T2 = E.THREE; g.bats = []; for (let i = 0; i < 14; i++){ const b = new T2.Mesh(new T2.SphereGeometry(.12, 6, 4), E.mat(0x111116)); b.scale.set(2, .5, 1); g.mesh.add(b); g.bats.push(b); }
      return g;
    });
  },
  init(){ return { lit: [0, 0, 0, 0], sw: [0, 0], lp: [0, 0, 0, 0], done: 0 }; },
  solve(st){ st.done = 1; st.lit = [1, 1, 1, 1]; },
  onFlash(st, R, E, idx, x, z){ let n = 0; this.swarms.forEach((g, k) => { if (Math.hypot(g.x - x, g.z - z) < 6){ g.x = ROOST[k][0]; g.z = R.Z(ROOST[k][1]); g.mem.rest = 4; g.stun = 0; n++; } }); if (n) E.ev('whoosh', 'The bats scatter back to the rafters!'); },
  host(dt, st, R, E){
    if (st.done) return;
    LANTS.forEach(([x, lz], i) => { if (st.lit[i]) return; if (E.P.some(p => !p.frozen && near(R, p, x, lz, 1.6))){ st.lp[i] += dt; if (st.lp[i] > 1.2){ st.lit[i] = 1; st.lp[i] = 0; E.ev('chime', '', i + 1); } } else st.lp[i] = 0; });
    for (const p of E.P){ const inS = this.swarms.some(g => !(g.mem.rest > 0) && Math.hypot(g.x - p.pos.x, g.z - p.pos.z) < 1.7); st.sw[p.idx] = inS && !p.frozen ? st.sw[p.idx] + dt : 0; if (st.sw[p.idx] > 1){ st.sw[p.idx] = 0; E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} got lost in the bat swarm!`); } }
    if (st.lit.every(Boolean)){ st.done = 1; R.open('exit'); E.ev('door', 'All four lanterns blaze — the bats flee the belfry!'); }
  },
  visual(dt, t, st, R, E){
    this.lamps.forEach(({ l, pl }, i) => { l.material.emissiveIntensity = st.lit[i] ? 2 : 0; pl.intensity = st.lit[i] ? 4 : 0; });
    this.swarms.forEach((g, k) => g.bats.forEach((b, i) => { const a = t * 6 + i * .9 + k; b.position.set(Math.cos(a) * (1.2 + (i % 3) * .4), 1 + Math.sin(a * 1.7) * .5, Math.sin(a) * (1.2 + (i % 3) * .4)); b.rotation.y = -a; b.scale.y = .5 + Math.abs(Math.sin(t * 30 + i)) * .6; }));
  },
  bar(st, R, E){ const i = LANTS.findIndex(([x, lz]) => near(R, { pos: E.me.pos }, x, lz, 1.6)); if (i < 0 || st.lit[i] || st.done) return null; return { frac: st.lp[i] / 1.2, label: 'Lighting…', color: '#ffb36b' }; },
  objective(st, R, E){ return st.done ? 'The bats are gone — door open!' : `Light all 4 lanterns at once (stand next to one). Bat swarms fly to lit lanterns and snuff them — <b>flash</b> a swarm to scatter it. (${st.lit.filter(Boolean).length}/4 lit)`; }
};

/* =============================================================== */
const WELL = [-6, 2.5], FONT = [0, 20.2];
const font = {
  name: 'The Holy Water Font',
  floor: nave,
  notes: [[-3, 1.6, '“The bucket leaks. The long way round is too long.”', 1.4]],
  hint: 'The bucket leaks while you carry it. Fill it at the well, then grapple across the chasm (the hooks work even while you carry something) — or throw it to your partner on the far side, but throwing spills some. The font needs 10 units.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 7.5, 7, 13, voidMat(E), .015);
    isle(R, E, -3, 10.3, 1.3); R.hook(-3, 10.3); R.hook(-3, 15); R.hook(-3, 5.4);
    const well = new T.Mesh(new T.CylinderGeometry(1, 1, .9, 16), E.mat(0x6a6a72)); R.place(well, WELL[0], WELL[1] - 1.4, .45); R.block(WELL[0] - 1, WELL[1] - 2.4, WELL[0] + 1, WELL[1] - .4, .01, E.mat(0));
    const f = new T.Mesh(new T.CylinderGeometry(1.2, .8, 1, 16), E.mat(0xd8d0c4)); R.place(f, FONT[0], FONT[1] + 1.1, .5); this.water = new T.Mesh(new T.CylinderGeometry(1.05, 1.05, .05, 16), E.glow(0x7ad1ff, .6)); R.place(this.water, FONT[0], FONT[1] + 1.1, .55);
    gargoyle(R, E, 'gw', [9.3, 10], { range: 7 });
    this.marks = diveMarks(E, 1);
  },
  init(){ return { font: 0, dv: {}, items: [mkItem('bucket', WELL[0], WELL[1], { water: 0 })] }; },
  solve(st){ st.font = 10; },
  itemMesh(k, E){ if (k !== 'bucket') return null; const T = E.THREE, g = new T.Group(); g.add(new T.Mesh(new T.CylinderGeometry(.3, .24, .45, 12, 1, true), new T.MeshStandardMaterial({ color: 0x8a6a42, side: T.DoubleSide }))); const w = new T.Mesh(new T.CylinderGeometry(.27, .27, .03, 12), E.glow(0x7ad1ff, .8)); w.position.y = .1; g.add(w); g.userData.w = w; return g; },
  onThrow(st, R, E, it){ it.water = Math.max(0, +(it.water - .8).toFixed(2)); },
  carryTick(st, R, E, it, p){
    if (near(R, p, WELL[0], WELL[1], 1.7) && it.water < 4){ it.water = 4; E.ev('splash'); }
    if (near(R, p, FONT[0], FONT[1], 1.8) && it.water > 0){ st.font = +(st.font + it.water).toFixed(2); it.water = 0; E.ev('splash', `Poured! The font is ${Math.min(100, Math.round(st.font * 10))}% full.`); }
  },
  onLand(st, R, E, it){ if (it.lz > 7.4 && it.lz < 13.1 && it.x < 7 && !(Math.abs(it.x + 3) < 1.3 && Math.abs(it.lz - 10.3) < 1.3)){ home(it); it.water = 0; E.ev('splash', 'The bucket fell into the chasm — a new one appears at the well.'); } },
  onFlash(st, R, E, idx, x, z){ cancelDives(st, R, E, x, z, E.ghostsOf(R.i)); },
  pits(st, R){ return [R.rect(-10.5, 7.5, 7, 13)]; },
  bridges(st, R){ return [rect(R, -3, 10.3, 1.3)]; },
  host(dt, st, R, E){
    const it = st.items[0];
    if (it.s !== 0 && it.water > 0) it.water = Math.max(0, +(it.water - dt * .5).toFixed(3));
    if (!R.isOpen('exit') && st.font >= 10){ R.open('exit'); E.ev('door', 'The font overflows with holy light — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.water.position.y = .1 + Math.min(1, st.font / 10) * .45; showMarks(this.marks, st, R, ['gw']); },
  bar(st, R, E){ if (st.font >= 10 || !R.inside(E.me.pos)) return null; const it = st.items[0]; if (it.s === 1 && it.w === E.myIdx()) return { frac: it.water / 4, label: 'Bucket (leaking!)', color: '#7ad1ff' }; return { frac: st.font / 10, label: 'Holy water font', color: '#d8d0c4' }; },
  objective(st, R, E){ return st.font >= 10 ? 'The font is full — the door is open!' : `Fill the font (north) with holy water from the well (south-west). The bucket LEAKS — the walk round the right side is too slow. <b>Grapple across while carrying it</b>, or throw it to your partner. (${Math.min(10, st.font).toFixed(1)}/10)`; }
};

/* =============================================================== */
const RC = [0, 11.5], RINGS = [[8.6, .32], [6.2, -.45], [3.8, .6]], GAPW = 2.4;
const ringPts = (r, a) => { const n = Math.round(Math.PI * 2 * r / .75), out = []; const gh = GAPW / r / 2; for (let i = 0; i < n; i++){ const th = i / n * Math.PI * 2; let d = th - a; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < gh) continue; out.push([RC[0] + Math.sin(th) * r, RC[1] + Math.cos(th) * r]); } return out; };
const LEV7 = [[-9.3, 1.3], [9.3, 1.3], [-9.3, 21]];
const reliquary = {
  name: 'The Rotating Reliquary',
  floor: nave,
  notes: [[3, 1.4, '“Three walls turn around the relic. A lever stops a wall while you stand on it.”', 1.4]],
  hint: 'The three ring walls keep turning, each with one gap. The levers in the corners STOP a ring while someone stands on them. One holds rings still when their gaps line up; the other slips through to the relic in the middle and carries it back out to the altar (top-right corner).',
  build(R, E){
    const T = E.THREE;
    this.pillars = RINGS.map(([r]) => { const n = Math.round(Math.PI * 2 * r / .75); return Array.from({ length: n }, () => { const m = new T.Mesh(new T.BoxGeometry(.7, 2, .7), E.mat(0x6a6672)); E.scene.add(m); return m; }); });
    LEV7.forEach(([x, lz], i) => R.plate('L' + i, x, lz, [0xff9a3d, 0x5ad1ff, 0xd8a8ff][i], 1.4, ['Ⅰ', 'Ⅱ', 'Ⅲ'][i]));
    const alt = new T.Mesh(new T.BoxGeometry(1.6, .9, 1.2), E.mat(0xd8d0c4)); R.place(alt, 8.6, 20.8, .45);
  },
  init(){ return { a: [0, 2.1, 4.2], done: 0, items: [mkItem('relic', RC[0], RC[1], { yRest: .7 })] }; },
  solve(st){ st.done = 1; st.items[0].s = 3; },
  itemMesh(k, E){ if (k !== 'relic') return null; const T = E.THREE, g = new T.Group(); g.add(new T.Mesh(new T.BoxGeometry(.5, .4, .35), E.mat(0xd4af37, { metalness: .8 }))); const c = new T.Mesh(new T.BoxGeometry(.08, .5, .08), E.glow(0xfff1c0, 1)); c.position.y = .4; g.add(c); return g; },
  colliders(st, R){ if (st.done) return []; const out = []; RINGS.forEach(([r], k) => { for (const [x, lz] of ringPts(r, st.a[k])) out.push(R.rect(x - .35, lz - .35, x + .35, lz + .35)); }); return out; },
  carryTick(st, R, E, it, p){ if (near(R, p, 8.6, 20, 1.6) && !st.done){ it.s = 3; st.done = 1; R.open('exit'); E.ev('door', 'The relic is home — the walls grind to a halt and the door opens!'); } },
  host(dt, st, R, E){
    if (st.done) return;
    if (!E.P.some(p => R.inside(p.pos))) return;
    RINGS.forEach(([r, sp], k) => { if (!R.held('L' + k)) st.a[k] = +((st.a[k] + sp * dt * E.GMULT) % (Math.PI * 2)).toFixed(4); });
  },
  local(dt, st, R, E){ const L = R.local; L.a = st.a.slice(); },
  visual(dt, t, st, R, E){
    RINGS.forEach(([r], k) => { const pts = st.done ? [] : ringPts(r, st.a[k]); this.pillars[k].forEach((m, i) => { const p = pts[i]; m.visible = !!p; if (p) m.position.set(p[0], 1, R.Z(p[1])); }); });
    LEV7.forEach((l, i) => R.glow('L' + i, R.on('L' + i) ? 1.4 : .45));
  },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Three ring walls keep turning around the relic, each with one gap. Standing on a corner lever STOPS that ring. Reach the relic in the middle and carry it to the altar (top-right).'; }
};

/* =============================================================== */
const GAPS8 = [[6.5, 9.5], [13, 16.8]];
const aisle = {
  name: 'The Collapsing Aisle',
  floor: nave,
  notes: [[0, 1.4, '“Run. The floor is falling in behind you.”', 1.4]],
  hint: 'As soon as you step in, the floor starts collapsing from the south. Keep moving north: dash over the first gap, grapple across the second (ring on the far side), and don\'t stop. If anyone falls, the whole aisle rebuilds and you both start over.',
  build(R, E){
    const T = E.THREE;
    GAPS8.forEach(([a, b]) => R.floor(-10, a, 10, b, voidMat(E), .015));
    for (const [x1, l1, x2, l2] of [[-10, 3.5, -2, 4.3], [2, 11, 10, 11.8], [-10, 18.2, -3, 19]]) R.block(x1, l1, x2, l2, 2.2, E.mat(0x5a5662));
    R.hook(-5, 18); R.hook(5, 17.6);
    this.front = R.floor(-10, 0, 10, 1, voidMat(E), .02);
    this.dust = new T.Mesh(new T.BoxGeometry(20, 2, .3), new T.MeshBasicMaterial({ color: 0x8a8090, transparent: true, opacity: .35 })); E.scene.add(this.dust);
  },
  init(){ return { cf: 0, go: 0, done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ const out = GAPS8.map(([a, b]) => R.rect(-10.5, a, 10.5, b)); if (st.cf > .5) out.push(R.rect(-10.5, -1, 10.5, st.cf)); return out; },
  onFall(st, R, E){ if (st.done) return; st.cf = 0; st.go = 0; E.ev('boo', 'The aisle rebuilds itself… start again!'); for (const p of E.P) if (R.inside(p.pos)){ const sp = R.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); } },
  host(dt, st, R, E){
    if (st.done) return;
    if (!st.go && E.P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 2.2)){ st.go = 1; E.ev('boom', 'The floor is collapsing — RUN!'); }
    if (st.go) st.cf = Math.min(19.5, st.cf + dt * 2.7 * E.GMULT);
    for (const p of E.P) if (R.inside(p.pos) && !p.dashing && R.lz(p.pos.z) < st.cf - .4 && st.go){ this.onFall(st, R, E); break; }
    if (E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.6)){ st.done = 1; R.open('exit'); E.ev('door', 'You made it! The door slams open.'); }
  },
  visual(dt, t, st, R, E){ this.front.scale.y = Math.max(.01, st.cf); this.front.position.z = R.Z(st.cf / 2); this.front.visible = st.cf > .1 && !st.done; this.dust.visible = st.go && !st.done; this.dust.position.set(0, 1, R.Z(st.cf)); },
  objective(st, R, E){ return st.done ? 'You made it!' : st.go ? '<b>RUN!</b> The floor is collapsing behind you — dash the first gap, grapple the second!' : 'Step in and the floor will start collapsing. Be ready to run, dash and grapple.'; }
};

/* =============================================================== */
const SC9 = { cols: 10, cx: c => -9 + 2 * c, rows: [9, 11, 13], north: [15, 17, 19] };
const STAT0 = [[2, 0], [5, 1], [8, 0]];   // (col, north-row index)
const fallen = {
  name: 'The Fallen Statues',
  floor: nave,
  notes: [[-3, 2, '“The saints are heavy, but a hook pulls them to you.”', 1.4]],
  hint: 'Hooks on the statues work differently — grappling one PULLS the statue toward you, one square per pull until it hits something. A statue pulled into the chasm fills that square. Line three statues up in one column (someone on the north side pulls them sideways), then pull them south into the chasm one by one. Once a square is filled you can stand on it to pull the next statue over it.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 8, 10, 14, voidMat(E), .015);
    this.fills = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++){ const m = R.floor(SC9.cx(c) - 1, SC9.rows[r] - 1, SC9.cx(c) + 1, SC9.rows[r] + 1, nave(E), .03); m.visible = false; this.fills.push(m); }
    this.stat = STAT0.map(() => { const g = new T.Group(); const b = new T.Mesh(new T.BoxGeometry(1.3, 2, 1.1), E.mat(0xb8b0a4)); b.position.y = 1; g.add(b); const h = new T.Mesh(new T.SphereGeometry(.4, 10, 8), E.mat(0xb8b0a4)); h.position.y = 2.3; g.add(h); E.scene.add(g); return g; });
    this.hooks = STAT0.map((_, i) => R.hook(0, 0, { pull: true, noPost: true, sid: i }));
    R.hook(-8.5, 16.5, {}); R.hook(8.5, 6, {});
  },
  init(){ return { st: STAT0.map(([c, r]) => [c, 3 + r]), fill: Array(30).fill(0), done: 0 }; },
  solve(st){ st.done = 1; for (let r = 0; r < 3; r++) st.fill[r * 10 + 4] = 1; },
  pits(st, R){ const out = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) if (!st.fill[r * 10 + c]) out.push(R.rect(SC9.cx(c) - 1, SC9.rows[r] - 1, SC9.cx(c) + 1, SC9.rows[r] + 1)); return out; },
  colliders(st, R){ return st.st.filter(s => s[1] >= 3).map(([c, r]) => R.rect(SC9.cx(c) - .7, SC9.north[r - 3] - .6, SC9.cx(c) + .7, SC9.north[r - 3] + .6)); },
  cellLz(r){ return r < 3 ? SC9.rows[r] : SC9.north[r - 3]; },
  onPull(st, R, E, idx, h){
    const s = st.st[h.sid]; if (!s || s[1] < 3) return;
    const p = E.P.find(q => q.idx === idx); if (!p) return;
    const dx = p.pos.x - SC9.cx(s[0]), dl = R.lz(p.pos.z) - this.cellLz(s[1]);
    const [mc, mr] = Math.abs(dx) > Math.abs(dl) ? [Math.sign(dx), 0] : [0, Math.sign(dl)];
    for (let step = 0; step < 7; step++){
      const nc = s[0] + mc, nr = s[1] + mr;
      if (nc < 0 || nc >= 10 || nr < 0 || nr > 5) break;
      if (st.st.some((o, j) => j !== h.sid && o[0] === nc && o[1] === nr)) break;
      const pc = nr >= 3 ? [SC9.cx(nc), this.cellLz(nr)] : null;
      if (pc && E.P.some(q => Math.hypot(q.pos.x - pc[0], R.lz(q.pos.z) - pc[1]) < 1)) break;
      s[0] = nc; s[1] = nr;
      if (nr < 3){ if (!st.fill[nr * 10 + nc]){ st.fill[nr * 10 + nc] = 1; s[1] = -1; E.ev('thud', 'The statue topples into the chasm and fills the gap!'); break; } }
    }
    E.ev('thud');
    for (let c = 0; c < 10; c++) if (st.fill[c] && st.fill[10 + c] && st.fill[20 + c] && !st.done){ st.done = 1; R.open('exit'); E.ev('door', 'A bridge of saints spans the chasm — the door opens!'); }
  },
  local(dt, st, R, E){ this.hooks.forEach((h, i) => { const s = st.st[i]; h.hidden = !s || s[1] < 3; if (s && s[1] >= 3){ h.x = SC9.cx(s[0]); h.z = R.Z(this.cellLz(s[1])); h.y = 2.9; } }); },
  visual(dt, t, st, R, E){
    st.st.forEach((s, i) => { const g = this.stat[i]; g.visible = s[1] >= 3; if (s[1] >= 3){ g.position.x += (SC9.cx(s[0]) - g.position.x) * E.damp(10, dt); g.position.z += (R.Z(this.cellLz(s[1])) - g.position.z) * E.damp(10, dt); } });
    this.fills.forEach((m, i) => m.visible = !!st.fill[i]);
  },
  objective(st, R, E){ return st.done ? 'The bridge of saints is complete!' : 'Grappling a statue\'s ring <b>pulls the statue toward you</b>. Fill a whole column of the chasm (3 squares) by pulling statues into it. Line them up from the north side first!'; }
};

/* =============================================================== */
const ANCH = [[-7, 6], [7, 6], [0, 19.2]];
const king = {
  name: 'The Gargoyle King',
  floor: nave,
  notes: [[0, 1.6, '“Break his three chains and the King will fall.”', 1.4]],
  hint: 'Grapple to the centre island, then out to the three chain anchors. Stand on an anchor for 2 seconds to break its chain. The King dives at whoever he marks with a red circle — dash out of it, or flash him mid-dive.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 3, 10, 21.2, voidMat(E), .015);
    isle(R, E, 0, 11.5, 2.4); ANCH.forEach(([x, lz]) => isle(R, E, x, lz, 1.7));
    R.hook(0, 11.5); ANCH.forEach(([x, lz]) => R.hook(x, lz)); R.hook(0, 2);
    ANCH.forEach(([x, lz], i) => R.plate('a' + i, x, lz + (lz > 10 ? -.8 : .8), 0xff5050, 1.2, '⛓'));
    this.chains = ANCH.map(([x, lz]) => { const c = new T.Mesh(new T.CylinderGeometry(.12, .12, 1, 6), E.mat(0x6a6a72, { metalness: .8 })); E.scene.add(c); return c; });
    this.boss = gargoyle(R, E, 'k', [0, 16], { scale: 2, anyRange: true, blast: 2.3, cd: 2.2, cdMult: st => 1 - st.n * .2, y: 4, label: 'the Gargoyle King', tint: 0x5a5662, active: st => !st.done, diveT: 1.25 });
    this.marks = diveMarks(E, 1);
  },
  init(){ return { br: [0, 0, 0], pr: [0, 0, 0], n: 0, dv: {}, done: 0 }; },
  solve(st){ st.n = 3; st.br = [1, 1, 1]; st.done = 1; },
  pits(st, R){ return [R.rect(-10.5, 3, 10.5, 21.2)]; },
  bridges(st, R){ return [rect(R, 0, 11.5, 2.4), ...ANCH.map(([x, lz]) => rect(R, x, lz, 1.7)), R.rect(-2, 19, 2, 22)]; },
  onFlash(st, R, E, idx, x, z){ cancelDives(st, R, E, x, z, [this.boss]); },
  host(dt, st, R, E){
    if (st.done) return;
    ANCH.forEach(([x, lz], i) => { if (st.br[i]) return; if (E.P.some(p => R.at('a' + i, p.pos) && !p.frozen)){ st.pr[i] += dt; if (st.pr[i] >= 2){ st.br[i] = 1; st.n++; E.ev('gong', st.n < 3 ? `A chain snaps! (${st.n}/3) The King roars!` : '', 90); } } else st.pr[i] = Math.max(0, st.pr[i] - dt); });
    if (st.n >= 3){ st.done = 1; st.dv.k = 0; R.open('exit'); E.ev('boom', 'The last chain breaks — the Gargoyle King crumbles to rubble! The cathedral doors open.'); }
  },
  visual(dt, t, st, R, E){
    const g = this.boss; ANCH.forEach(([x, lz], i) => { const c = this.chains[i]; c.visible = !st.br[i] && !st.done; const ax = x, az = R.Z(lz), bx = g.x, bz = g.z, len = Math.hypot(bx - ax, bz - az); c.position.set((ax + bx) / 2, 1.5, (az + bz) / 2); c.scale.y = len; c.rotation.set(Math.PI / 2, 0, -Math.atan2(bx - ax, bz - az)); });
    if (st.done){ g.mesh.position.y = Math.max(-2, g.mesh.position.y - dt * 3); }
    showMarks(this.marks, st, R, ['k']);
  },
  bar(st, R, E){ const i = [0, 1, 2].find(k => R.at('a' + k, E.me.pos)); if (i === undefined || st.br[i]) return null; return { frac: st.pr[i] / 2, label: 'Breaking the chain…', color: '#ff5050' }; },
  objective(st, R, E){ return st.done ? 'The King has fallen — escape the cathedral!' : `Grapple out to the 3 chain anchors and stand on each to break its chain. The Gargoyle King dives at the red circles — dash away or flash him. (${st.n}/3)`; }
};

export default {
  level: 9,
  // texture pack in tex/level9/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'panel', tex: 'stained_glass', w: 1.1, h: 1.8, y: 1.45, every: 5, glow: .55, frame: true, mullion: true, color: 0x8a6a3a },   // wall dressing: stained-glass windows (engine wallDecor)
  wallImg: 'cathedral_wall', trimImg: 'wrought_iron', texVer: 1,
  texFloors: {
    "The Collapsed Nave": "nave_flags",
    "The Gargoyle Gallery": "gallery_cobble",
    "The Grapple Relay": "tomb_slabs",
    "The Swinging Censers": "censer_mosaic",
    "The Bat Belfry": "belfry_guano",
    "The Holy Water Font": "font_wet",
    "The Rotating Reliquary": "reliquary_marble",
    "The Collapsing Aisle": "aisle_rubble",
    "The Fallen Statues": "statue_dust",
    "The Gargoyle King": "king_stone"
  },
  title: 'The Ruined Cathedral',
  tagline: 'The bells stopped ringing a century ago.<br>The gargoyles never stopped watching.',
  story: 'Half the floor has fallen into the crypts below. Golden rings hang from the broken pillars.',
  winTitle: 'The cathedral falls silent! ⛪',
  feature: { name: 'Grapple', icon: '🪝', how: 'Face a <b>golden ring</b> and tap <b>Space</b> / <b>⚡</b> to zip straight to it — right over gaps. It works even while you\'re carrying something.' },
  accent: '#b8a0e0',
  wallColor: 0x3a3640,
  trimColor: 0x8a7a9a,
  doorColor: 0x2a2228,
  sky: 0x8a80a0,
  bg: 0x06050a,
  drone: 36,
  rooms: [collapsed, gallery, relay, censers, belfry, font, reliquary, aisle, fallen, king],
};
