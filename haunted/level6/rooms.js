// Level 6 — The Witch's Bog. New power: THROW (⚡ while carrying). Local coords: x -10..10, lz 0..22.
import { orbRow, setOrbs, near, inRect } from '../lib.js';

const bogFloor = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#3a3a22'; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++){ x.fillStyle = `rgba(${40 + Math.random() * 30},${50 + Math.random() * 30},20,.5)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 0, 7); x.fill(); } }, 5, 5) });
const grassFloor = E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#2e4a24'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++){ x.fillStyle = '#3a5a2c'; x.fillRect(Math.random() * w, Math.random() * h, 2, 5); } }, 8, 8) });
let _mud = null;
const mudMat = E => _mud || (_mud = new E.THREE.MeshStandardMaterial({ color: 0x3a2a14, roughness: .3, metalness: .1, emissive: 0x1a1006, emissiveIntensity: .4 }));
const bogWater = E => new E.THREE.MeshStandardMaterial({ color: 0x1e3a1a, roughness: .2, emissive: 0x0a1a08, emissiveIntensity: .5 });
const itemAt = (R, it) => ({ x: it.x, z: R.Z(it.lz) });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; };
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });

/* ---------- Hex crow: circles overhead, then swoops through a player ---------- */
function crow(R, cx, clz, rad, opt = {}){
  return R.ghost({ home: [cx, clz], look: 'small', tint: 0x4a2a6a, harmless: false, noReturn: true, flat: true, label: 'a hex crow', sp: 0, scale: 1.4,
    think: (g, dt, st, R2, E, P) => {
      const m = g.mem; if (!m.st){ m.st = 'circle'; m.a = Math.random() * 6; m.t = 2 + Math.random() * 2; }
      if (m.st === 'circle'){
        m.a += dt * .9; g.x = cx + Math.cos(m.a) * rad; g.z = R2.Z(clz + Math.sin(m.a) * rad * .6); g.y = 3.2; g.ry = m.a + Math.PI;
        m.t -= dt;
        const T = E.targetsOf(g, P).filter(p => R2.inside(p.pos));
        if (m.t <= 0 && T.length){
          let tgt = T[Math.floor(Math.random() * T.length)];
          if (opt.carrier){ const c = T.find(p => E.carrying(p.idx)); if (c) tgt = c; }
          const dx = tgt.pos.x - g.x, dz = tgt.pos.z - g.z, d = Math.hypot(dx, dz) || 1;
          m.sx = g.x; m.sz = g.z; m.ex = tgt.pos.x + dx / d * 3; m.ez = tgt.pos.z + dz / d * 3; m.ft = d / (d + 3); m.f = 0; m.d = (d + 3) / (opt.speed || 11); m.st = 'swoop';
          E.ev('whoosh');
        }
      } else if (m.st === 'swoop'){
        m.f += dt / m.d; const f = Math.min(1, m.f);
        g.x = m.sx + (m.ex - m.sx) * f; g.z = m.sz + (m.ez - m.sz) * f; g.ry = Math.atan2(m.ex - m.sx, m.ez - m.sz);
        g.y = 3.2 * Math.abs(f - m.ft) / Math.max(m.ft, 1 - m.ft);
        if (g.y < 1.3) E.ghostTouch(g, E.targetsOf(g, P), E.names(), 1.1);
        if (f >= 1){ m.st = 'rise'; m.f = 0; m.rx = g.x; m.rz = g.z; }
      } else {
        m.f += dt; const tx = cx + Math.cos(m.a) * rad, tz = R2.Z(clz + Math.sin(m.a) * rad * .6), f = Math.min(1, m.f);
        g.x = m.rx + (tx - m.rx) * f; g.z = m.rz + (tz - m.rz) * f; g.y = 3.2 * f;
        if (f >= 1){ m.st = 'circle'; m.t = (opt.wait || 2.5) + Math.random() * 2; }
      }
      return true;
    } });
}

/* ---------- Bog hands: stand in mud too long and a hand grabs you ---------- */
function handsTick(st, R, E, dt, inMud, grab = .9){
  st.mud = st.mud || [0, 0];
  for (const p of E.P){
    if (!R.inside(p.pos) || p.frozen || p.dashing || !inMud(p.pos)){ st.mud[p.idx] = 0; continue; }
    st.mud[p.idx] += dt;
    if (st.mud[p.idx] > grab){ st.mud[p.idx] = 0; E.freeze(p.idx, E.FREEZE, `A bog hand grabbed ${E.names()[p.idx]}!`); }
  }
}
function handMeshes(E){
  const T = E.THREE, mk = () => { const g = new T.Group(), m = E.mat(0x4a5a2a); const palm = new T.Mesh(new T.BoxGeometry(.5, .5, .2), m); palm.position.y = .5; g.add(palm); for (let i = 0; i < 4; i++){ const f = new T.Mesh(new T.CylinderGeometry(.05, .06, .4, 5), m); f.position.set(-.18 + i * .12, .9, 0); g.add(f); } g.visible = false; E.scene.add(g); return g; };
  return [mk(), mk()];
}
function handVisual(hm, st, E, grab = .9){
  for (let i = 0; i < 2; i++){
    const v = (st.mud || [0, 0])[i], pos = E.playerPos(i), h = hm[i];
    h.visible = !!pos && v > grab * .4;
    if (h.visible){ h.position.set(pos.x + .3, -1 + (v / grab) * 1.1, pos.z + .2); }
  }
}

/* =============================================================== */
const SC = [[-7, 12.5], [-2.5, 13.5], [2.5, 13.5], [7, 12.5]];
const scarecrows = {
  name: 'The Scarecrow Field',
  floor: grassFloor,
  throwRange: 8,
  notes: [[3.5, 1.6, '“Pick up a stone, face your target, and THROW.”', 1.5]],
  hint: 'Walk over a stone to pick it up, face a scarecrow, and tap ⚡ (Space) to throw. Hit all four heads off. Stones that land in the ditch come back to the pile.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 6.5, 10, 11.5, bogWater(E), .015);
    this.heads = SC.map(([x, lz]) => {
      const post = new T.Mesh(new T.CylinderGeometry(.08, .08, 2.4, 6), E.mat(0x6a4a2a)); R.place(post, x, lz, 1.2);
      const arm = new T.Mesh(new T.BoxGeometry(1.8, .1, .1), E.mat(0x6a4a2a)); R.place(arm, x, lz, 1.7);
      const shirt = new T.Mesh(new T.BoxGeometry(.9, .9, .3), E.mat(0x8a3a2a)); R.place(shirt, x, lz, 1.4);
      const head = new T.Mesh(new T.SphereGeometry(.38, 12, 10), E.mat(0xd08a3a)); R.place(head, x, lz, 2.4);
      const hat = new T.Mesh(new T.ConeGeometry(.45, .6, 10), E.mat(0x2a2a1a)); head.add(hat); hat.position.y = .45;
      return head;
    });
    this.bridge = R.floor(-1.6, 6.4, 1.6, 11.6, E.mat(0x8a6238), .03);
  },
  init(){ return { down: 0, items: [mkItem('stone', -3, 3.5), mkItem('stone', 0, 4.2), mkItem('stone', 3, 3.5)] }; },
  solve(st){ st.down = 15; },
  pits(st, R){ return [R.rect(-10.5, 6.5, 10.5, 11.5)]; },
  bridges(st, R){ return st.down === 15 ? [R.rect(-1.6, 6.4, 1.6, 11.6)] : []; },
  onLand(st, R, E, it){ if (it.lz > 6.3) home(it); },
  host(dt, st, R, E){
    for (const it of st.items) if (it.s === 2) SC.forEach(([x, lz], i) => {
      if (st.down & (1 << i)) return;
      if (Math.hypot(it.x - x, it.lz - lz) < 1.15){ st.down |= 1 << i; it.ft = it.fd; E.ev('thud', `Scarecrow down! (${[1, 2, 4, 8].filter(b => st.down & b).length}/4)`); }
    });
    if (st.down === 15 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'All four scarecrows are down — a plank bridge drops over the ditch!'); }
  },
  visual(dt, t, st, R, E){ this.heads.forEach((h, i) => { const d = st.down & (1 << i); h.position.y += ((d ? .3 : 2.4) - h.position.y) * E.damp(6, dt); }); this.bridge.visible = st.down === 15; },
  objective(st, R, E){ return st.down === 15 ? 'Cross the plank bridge!' : `Pick up a stone and <b>THROW it (⚡ / Space)</b> at the scarecrows across the ditch. Knock off all four heads. (${[1, 2, 4, 8].filter(b => st.down & b).length}/4)`; }
};

/* =============================================================== */
const TB = { K1: [6, 5], L1: [-6, 9], K2: [-6, 14], L2: [6, 13] };
const banks = {
  name: 'The Two Banks',
  floor: grassFloor,
  spawn: [[-.7, 1.8], [.7, 1.8]],
  notes: [[0, 3, '“The gangplanks rot through once crossed. Choose your bank.”', 1.4]],
  hint: 'Each of you crosses to a different bank — the planks break behind you. Throw the keys across the river to each other: the key for the left gate is on the right bank, and the next key is past that gate. A key that falls in the river goes back to where it started.',
  build(R, E){
    const T = E.THREE;
    R.floor(-3, 0, 3, 19, bogWater(E), .015);
    R.floor(-1.6, .4, 1.6, 3.4, E.mat(0x8a6238), .03);
    this.planks = [R.floor(-3, 1.2, -1.6, 2.6, E.mat(0x9a7448), .035), R.floor(1.6, 1.2, 3, 2.6, E.mat(0x9a7448), .035)];
    R.door('gw', -10, 10.8, -3, 11.2, 'gate'); R.door('ge', 3, 14.8, 10, 15.2, 'gate');
    for (const [n, [x, lz]] of [['L1', TB.L1], ['L2', TB.L2]]){ const lock = new T.Mesh(new T.BoxGeometry(.7, 1, .4), E.mat(0xb08a3a, { metalness: .6 })); R.place(lock, x, lz, .5); }
    R.plate('RW', -8.5, 2, 0xff5050, 1.2, '↺'); R.plate('RE', 8.5, 2, 0xff5050, 1.2, '↺');
  },
  init(){ return { pk: [0, 0], on: [0, 0], u1: 0, u2: 0, items: [mkItem('key', ...TB.K1), mkItem('key', ...TB.K2)] }; },
  solve(st){ st.u1 = st.u2 = 1; st.items.forEach(i => i.s = 3); },
  pits(st, R){ return [R.rect(-3, 0, 3, 19)]; },
  bridges(st, R){ const b = [R.rect(-1.6, .4, 1.6, 3.4)]; if (!st.pk[0]) b.push(R.rect(-3.2, 1.2, -1.4, 2.6)); if (!st.pk[1]) b.push(R.rect(1.4, 1.2, 3.2, 2.6)); return b; },
  onLand(st, R, E, it){
    if (it.x > -3 && it.x < 3 && it.lz < 19 && !(it.lz < 3.4 && Math.abs(it.x) < 1.6)){ home(it); E.ev('splash', 'Splash — the key sinks and washes back to where it was.'); return; }
    this.tryLock(st, R, E, it, it.x, it.lz);
  },
  carryTick(st, R, E, it, p){ this.tryLock(st, R, E, it, p.pos.x, R.lz(p.pos.z)); },
  tryLock(st, R, E, it, x, lz){
    if (it === st.items[0] && !st.u1 && Math.hypot(x - TB.L1[0], lz - TB.L1[1]) < 1.5){ st.u1 = 1; it.s = 3; R.open('gw'); E.ev('door', 'Click! The left gate swings open.'); }
    if (it === st.items[1] && !st.u2 && Math.hypot(x - TB.L2[0], lz - TB.L2[1]) < 1.5){ st.u2 = 1; it.s = 3; R.open('ge'); E.ev('door', 'Click! The right gate swings open.'); }
  },
  host(dt, st, R, E){
    if (st.u1) R.open('gw'); if (st.u2) R.open('ge');
    if (!E.solo()) for (const p of E.P){
      const lz = R.lz(p.pos.z), x = p.pos.x;
      const onPlank = lz > 1.2 && lz < 2.6 ? (x < -1.6 && x > -3 ? 1 : x > 1.6 && x < 3 ? 2 : 0) : 0;
      if (st.on[p.idx] && !onPlank && R.inside(p.pos)){ const k = st.on[p.idx] - 1; if ((k === 0 ? x < -3 : x > 3) && !st.pk[k]){ st.pk[k] = 1; E.ev('thud', 'The rotten plank cracks and sinks behind you!'); } }
      st.on[p.idx] = onPlank;
    }
    if (R.edge('RW') || R.edge('RE')){ st.pk = [0, 0]; st.items.forEach((it, i) => { if (!(i ? st.u2 : st.u1) && it.s !== 1) home(it); }); E.ev('click', 'New planks float into place.'); }
    if (!R.isOpen('exit') && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.2)){ R.open('exit'); E.ev('door', 'Both across — the far door opens!'); }
  },
  visual(dt, t, st, R){ this.planks.forEach((p, i) => p.visible = !st.pk[i]); },
  objective(st, R, E){
    if (R.isOpen('exit')) return 'The door is open!';
    return E.solo() ? 'Carry each key to its lock on the far bank (the locks are by the gates).'
      : `Cross to <b>different</b> banks — the planks sink behind you. <b>Throw</b> the keys across the river to unlock each other's gates, then meet at the north end.`;
  }
};

/* =============================================================== */
const SHROOMS = [[-8, 4], [8, 6], [-7, 17], [7.5, 18.5]], CAUL = [0, 11];
const roost = {
  name: "The Crows' Roost",
  floor: bogFloor,
  notes: [[-3, 1.6, '“Four toadstools for the cauldron. The crows want them too.”', 1.5]],
  hint: 'The crows always dive at whoever is CARRYING a toadstool. Toss it to your partner just before a crow dives, or throw it straight into the cauldron from a distance. A stone (or a flash) knocks a crow out of the sky.',
  build(R, E){
    const T = E.THREE;
    const c = new T.Mesh(new T.CylinderGeometry(1.2, .9, 1.1, 18), E.mat(0x1a1a1a, { metalness: .5 })); R.place(c, CAUL[0], CAUL[1], .55);
    const brew = new T.Mesh(new T.CylinderGeometry(1.05, 1.05, .05, 18), E.glow(0x6aff4a, .8)); R.place(brew, CAUL[0], CAUL[1], 1.08); this.brew = brew;
    R.block(CAUL[0] - 1.1, CAUL[1] - 1.1, CAUL[0] + 1.1, CAUL[1] + 1.1, .01, E.mat(0x000000));
    for (const [x, lz] of [[-4, 7], [4, 15], [-4.5, 15.5], [4.5, 6.5]]){ const tr = new T.Mesh(new T.CylinderGeometry(.35, .5, 3, 8), E.mat(0x3a2a1a)); R.place(tr, x, lz, 1.5); R.block(x - .5, lz - .5, x + .5, lz + .5, .01, E.mat(0)); }
    crow(R, 0, 11, 6, { carrier: true }); crow(R, 0, 11, 7.5, { carrier: true, speed: 12 }); crow(R, 0, 11, 5, { carrier: true, wait: 3 });
    this.orbs = orbRow(E, R, 4, -1.95, 21.3);
  },
  init(){ return { got: 0, items: SHROOMS.map(([x, lz]) => mkItem('shroom', x, lz)).concat([mkItem('stone', -2, 2), mkItem('stone', 2, 2)]) }; },
  solve(st){ st.got = 4; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ if (k !== 'shroom') return null; const T = E.THREE, g = new T.Group(); const stem = new T.Mesh(new T.CylinderGeometry(.1, .14, .35, 8), E.mat(0xf2e6c8)); g.add(stem); const cap = new T.Mesh(new T.SphereGeometry(.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), E.mat(0xd03030)); cap.position.y = .15; g.add(cap); return g; },
  feed(st, R, E, it){ it.s = 3; st.got++; E.ev('splash', st.got < 4 ? `Plop! Into the cauldron (${st.got}/4)` : ''); },
  carryTick(st, R, E, it, p){ if (it.k === 'shroom' && near(R, p, CAUL[0], CAUL[1], 1.9)) this.feed(st, R, E, it); },
  onLand(st, R, E, it){ if (it.k === 'shroom' && Math.hypot(it.x - CAUL[0], it.lz - CAUL[1]) < 1.6) this.feed(st, R, E, it); },
  onPick(st, R, E, it){ return true; },
  host(dt, st, R, E){ if (!R.isOpen('exit') && st.got >= 4){ R.open('exit'); E.ev('door', 'The brew bubbles over — the door bursts open!'); } },
  visual(dt, t, st, R, E){ setOrbs(this.orbs, st.got); this.brew.material.emissiveIntensity = .5 + st.got * .3 + Math.sin(t * 4) * .1; },
  objective(st, R, E){ return st.got >= 4 ? 'The brew is ready — the door is open!' : `Get 4 toadstools into the cauldron. Hex crows dive at whoever is carrying one — <b>toss it to your partner</b> or throw it in from afar. Stones knock crows down. (${st.got}/4)`; }
};

/* =============================================================== */
const BR = { WB1: [-10, 7.5, -.4, 8.5], EB: [.4, 13.5, 10, 14.5], WB2: [-10, 17.5, -.4, 18.5] };
const LOCKS = { LE1: [5, 11, 'WB1'], LW: [-5, 15.5, 'EB'], LE2: [5, 17, 'WB2'] };
const brambles = {
  name: 'The Bramble Maze',
  floor: grassFloor,
  notes: [[3, 1.6, '“A lit key burns the thorns — for a little while.”', 1.4]],
  hint: 'Each lock burns away a bramble wall in the OTHER corridor for 10 seconds. Carry the key to a lock, then throw it over the hedge to your partner so they can reach the next lock. Order: right lock first, then left, then right again.',
  build(R, E){
    const T = E.THREE, hedge = E.mat(0x1e3a18);
    R.block(-.4, 3, .4, 19, 2.6, hedge);
    for (const [x1, l1, x2, l2] of [[-10, 11.5, -6, 12.3], [-4, 5, -2.5, 6.5], [6, 6.2, 10, 7], [2.5, 9, 4, 10.5], [-6.5, 14, -5, 15]]) R.block(x1, l1, x2, l2, 2.2, hedge);
    this.br = Object.entries(BR).map(([k, [x1, l1, x2, l2]]) => {
      const g = new T.Group(); const n = Math.round((x2 - x1) / .7);
      for (let i = 0; i < n; i++){ const s = new T.Mesh(new T.ConeGeometry(.35, 1.6, 5), E.mat(0x4a2a3a)); s.position.set(x1 + .35 + i * .7, .8, 0); s.rotation.z = (i % 2 ? .3 : -.3); g.add(s); }
      return { k, g: R.place(g, 0, (l1 + l2) / 2) };
    });
    for (const [k, [x, lz]] of Object.entries(LOCKS)){ const b = new T.Mesh(new T.CylinderGeometry(.4, .5, 1.1, 10), E.mat(0xb08a3a, { metalness: .6 })); R.place(b, x, lz, .55); const f = new T.Mesh(new T.ConeGeometry(.3, .7, 8), E.flameMat); R.place(f, x, lz, 1.5); this['f' + k] = f; }
  },
  init(){ return { burn: { WB1: 0, EB: 0, WB2: 0 }, used: {}, items: [mkItem('key', -5, 4)] }; },
  solve(st){ st.burn = { WB1: 99, EB: 99, WB2: 99 }; st.items[0].s = 3; },
  colliders(st, R){ return Object.entries(BR).filter(([k]) => !(st.burn[k] > 0)).map(([k, [x1, l1, x2, l2]]) => R.rect(x1, l1, x2, l2)); },
  useLock(st, R, E, x, lz){
    for (const [k, [lx, ll, b]] of Object.entries(LOCKS)){
      if (Math.hypot(x - lx, lz - ll) > 1.5 || st.burn[b] > 0) continue;
      st.burn[b] = E.solo() ? 9999 : 10; E.ev('whoosh', `The key flares — a bramble wall burns away${E.solo() ? '' : ' for 10 seconds'}!`);
    }
  },
  carryTick(st, R, E, it, p){ this.useLock(st, R, E, p.pos.x, R.lz(p.pos.z)); },
  onLand(st, R, E, it){
    const z = R.Z(it.lz);
    if (E.staticRects().some(r => it.x > r.x1 - .2 && it.x < r.x2 + .2 && z > r.z1 - .2 && z < r.z2 + .2)){ home(it); E.ev('thud', 'The key got tangled in the thorns and reappeared at the start.'); return; }
    this.useLock(st, R, E, it.x, it.lz);
  },
  host(dt, st, R, E){
    for (const k of Object.keys(st.burn)) if (st.burn[k] > 0 && st.burn[k] < 9000){ st.burn[k] -= dt; if (st.burn[k] <= 0){ st.burn[k] = 0; E.ev('thud', 'The brambles grow back!');
      // anyone caught inside regrowing thorns is pushed out to the south side
      const [x1, l1, x2, l2] = BR[k]; for (const p of E.P) if (inRect(R, p.pos, x1, l1 - .5, x2, l2 + .5)) E.teleport(p.idx, p.pos.x, R.Z(l1 - .8)); } }
    if (!R.isOpen('exit') && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.2)){ R.open('exit'); E.ev('door', 'Out of the maze! The door opens.'); }
  },
  visual(dt, t, st, R, E){
    this.br.forEach(({ k, g }) => { const s = st.burn[k] > 0 ? .05 : 1; g.scale.y += (s - g.scale.y) * E.damp(6, dt); g.visible = g.scale.y > .08; });
    for (const k of Object.keys(LOCKS)) this['f' + k].visible = st.burn[LOCKS[k][2]] > 0;
  },
  bar(st, R, E){ const k = Object.keys(st.burn).find(k => st.burn[k] > 0 && st.burn[k] < 9000); if (!k || !R.inside(E.me.pos)) return null; return { frac: st.burn[k] / 10, label: 'Thorns regrow in ' + st.burn[k].toFixed(1) + 's', color: '#ff7a3a' }; },
  objective(st, R, E){ return R.isOpen('exit') ? 'Out of the maze!' : `Bramble walls block both corridors. Touch a lock with the key to burn a bramble in the OTHER corridor${E.solo() ? '' : ' for 10 seconds'}. <b>Throw the key over the hedge</b> to each other. Both reach the north end.`; }
};

/* =============================================================== */
const HUMS = [[-7.5, 5], [-2.5, 5], [2.5, 5], [7.5, 5], [-5, 10], [0, 10], [5, 10], [-7.5, 15], [-2.5, 15], [2.5, 15], [7.5, 15]];
const onHum = (R, pos) => HUMS.some(([x, lz]) => Math.hypot(pos.x - x, R.lz(pos.z) - lz) < 1.35);
const swamp = {
  name: 'The Hand Swamp',
  floor: bogFloor,
  throwRange: 7,
  notes: [[4, 1.6, '“The frog idols are heavy. The hands are hungry. Don\'t linger in the mud.”', 1.5]],
  hint: 'Hands grab anyone who stays in the mud for about a second. Walking is fast enough — but carrying an idol slows you down too much. Stand on the next mound and have your partner THROW the idol to you, leapfrogging across.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 3, 10, 19, mudMat(E), .012);
    for (const [x, lz] of HUMS){ const m = new T.Mesh(new T.CylinderGeometry(1.35, 1.5, .25, 18), E.mat(0x4a6a2a)); R.place(m, x, lz, .12); }
    const sh = new T.Mesh(new T.BoxGeometry(2.4, 1, 1.2), E.mat(0x4a5a3a)); R.place(sh, 0, 21, .5);
    this.hm = handMeshes(E); this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 1.6);
  },
  init(){ return { got: 0, mud: [0, 0], items: [mkItem('frog', -3, 1.7), mkItem('frog', 0, 2.2), mkItem('frog', 3, 1.7)] }; },
  solve(st){ st.got = 3; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ if (k !== 'frog') return null; const T = E.THREE, g = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.4, 12, 10), E.mat(0x5a8a3a, { metalness: .3 })); b.scale.set(1.2, .8, 1); g.add(b); for (const s of [-1, 1]){ const e = new T.Mesh(new T.SphereGeometry(.12, 8, 6), E.mat(0xffd84d)); e.position.set(s * .2, .3, .25); g.add(e); } return g; },
  speed(st, R, E, idx){ return E.carrying(idx) && E.carrying(idx).R === R ? { mult: .5, noRun: true } : null; },
  deliver(st, R, E, it){ it.s = 3; st.got++; E.ev('place', st.got < 3 ? `Idol returned to the shrine (${st.got}/3)` : ''); },
  carryTick(st, R, E, it, p){ if (R.lz(p.pos.z) > 19.2) this.deliver(st, R, E, it); },
  onLand(st, R, E, it){
    if (it.lz > 19.2) return this.deliver(st, R, E, it);
    if (it.lz > 3 && !onHum(R, itemAt(R, it))){ it.sink = 3; }
  },
  host(dt, st, R, E){
    handsTick(st, R, E, dt, pos => { const lz = R.lz(pos.z); return lz > 3 && lz < 19 && !onHum(R, pos); });
    for (const it of st.items) if (it.s === 0 && it.sink > 0){ it.sink -= dt; if (it.sink <= 0){ it.sink = 0; home(it); E.ev('splash', 'An idol sank into the mud and bobbed up back at the start.'); } }
    for (const it of st.items) if (it.s !== 0) it.sink = 0;
    if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'All three idols are home. The swamp gate opens.'); }
  },
  visual(dt, t, st, R, E){ handVisual(this.hm, st, E); setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 3 ? 'The gate is open!' : `Bring the 3 frog idols to the far shore. Bog hands grab anyone who stays in the mud — and idols are heavy. <b>Throw</b> them from mound to mound. (${st.got}/3)`; }
};

/* =============================================================== */
const HOLE = [-8.4, 14, -6.6, 14.5];
const cottage = {
  name: "The Witch's Cottage",
  floor: E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#5a3a24'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a2e1c'; for (let i = 0; i < 4; i++) x.fillRect(0, i * 16 + 14, w, 2); }, 8, 8) }),
  notes: [[0, 1.6, '“Green makes you small. Purple makes you mighty. Do not drink both.”', 1.5]],
  hint: 'Drink a potion by walking over it. The SMALL one fits through the mouse hole into the closet with the lever. The BIG one is heavy enough to press the big plate. One of you gets small and pulls the lever while the other gets big and stands on the plate.',
  build(R, E){
    const T = E.THREE;
    R.wall(-10, 14, HOLE[0], 14.5); R.wall(HOLE[2], 14, -4.6, 14.5); R.wall(-5, 14.5, -4.6, 22);
    const arch = new T.Mesh(new T.TorusGeometry(.5, .1, 6, 12, Math.PI), E.mat(0x2a1a10)); R.place(arch, -7.5, 14.25, 0);
    R.plate('LV', -7.5, 19.5, 0xffa040, 1.2, '⇩');
    R.plate('HV', 7, 18, 0x9a5aff, 2.4, '⬇');
    for (const [x, lz] of [[-8.5, 4], [8.5, 4]]){ const sh = new T.Mesh(new T.BoxGeometry(1.8, .9, .8), E.mat(0x4a2a1a)); R.place(sh, x, lz - .9, .45); }
    const pot = new T.Mesh(new T.CylinderGeometry(1, .8, 1, 14), E.mat(0x1a1a1a)); R.place(pot, 2, 10, .5); R.block(1, 9, 3, 11, .01, E.mat(0));
    R.ghost({ home: [3, 15], look: 'small', tint: 0x2a1a3a, sp: 2.7, radius: 9, label: 'the witch\'s cat', scale: 1.1 });
  },
  init(){ return { fx: [[0, 0], [0, 0]], lever: 0, done: 0, items: [mkItem('shrink', -8.5, 4.6, { yRest: .8 }), mkItem('grow', 8.5, 4.6, { yRest: .8 })] }; },
  solve(st){ st.done = 1; },
  itemMesh(k, E){ if (k !== 'shrink' && k !== 'grow') return null; const T = E.THREE, g = new T.Group(); const c = k === 'shrink' ? 0x4aff6a : 0xb04aff; const b = new T.Mesh(new T.SphereGeometry(.28, 12, 10), E.glow(c, .8)); g.add(b); const n = new T.Mesh(new T.CylinderGeometry(.08, .08, .25, 8), E.mat(0xd8d8e8)); n.position.y = .3; g.add(n); return g; },
  onPick(st, R, E, it, idx){
    if (it.k !== 'shrink' && it.k !== 'grow') return true;
    st.fx[idx] = [it.k === 'shrink' ? 1 : 2, 22]; it.s = 3; it.re = 10;
    E.ev('pick', it.k === 'shrink' ? `${E.names()[idx]} shrank to the size of a mouse!` : `${E.names()[idx]} grew HUGE!`);
    return false;
  },
  colliders(st, R, E, idx){ return idx >= 0 && st.fx[idx] && st.fx[idx][0] === 1 ? [] : [R.rect(...HOLE)]; },
  speed(st, R, E, idx){ return st.fx[idx] && st.fx[idx][0] === 2 ? { mult: .8 } : null; },
  host(dt, st, R, E){
    for (let i = 0; i < 2; i++) if (st.fx[i][1] > 0){ st.fx[i][1] -= dt; if (st.fx[i][1] <= 0){ st.fx[i] = [0, 0]; E.ev('whoosh', `${E.names()[i]}'s potion wore off.`);
      // a player who grows back inside the closet is gently pushed out of the mouse hole
      const p = E.P.find(q => q.idx === i); if (p && inRect(R, p.pos, -10, 14, -5, 22)) E.teleport(i, -7.5, R.Z(12.8)); } }
    for (const it of st.items) if (it.s === 3 && it.re > 0){ it.re -= dt; if (it.re <= 0) home(it); }
    if (st.done) return;
    if (R.edge('LV') && E.P.some(p => R.at('LV', p.pos) && st.fx[p.idx][0] === 1)){ st.lever = E.solo() ? 9999 : 8; E.ev('click', 'The lever clunks down!'); }
    if (st.lever > 0 && st.lever < 9000) st.lever -= dt;
    const heavy = E.P.some(p => R.at('HV', p.pos) && st.fx[p.idx][0] === 2);
    if (heavy && st.lever > 0){ st.done = 1; R.open('exit'); E.ev('door', 'Lever down, plate pressed — the cottage door creaks open!'); }
  },
  visual(dt, t, st, R, E){
    for (let i = 0; i < 2; i++){
      const ch = i === E.myIdx() ? E.chars.me : E.chars.other, pos = E.playerPos(i);
      const want = pos && R.inside(pos) ? [1, .45, 1.7][st.fx[i][0]] : 1;
      const s = ch.group.scale.x + (want - ch.group.scale.x) * E.damp(6, dt); ch.group.scale.setScalar(s);
    }
    R.glow('HV', st.done ? .2 : E.P.some(p => R.at('HV', p.pos)) ? 1.2 : .45);
  },
  bar(st, R, E){ const f = st.fx[E.myIdx()]; if (f[0] && R.inside(E.me.pos)) return { frac: f[1] / 22, label: f[0] === 1 ? 'Tiny!' : 'Huge!', color: f[0] === 1 ? '#4aff6a' : '#b04aff' }; if (st.lever > 0 && st.lever < 9000) return { frac: st.lever / 8, label: 'Lever down…', color: '#ffa040' }; return null; },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Drink the potions on the shelves. Only someone SMALL fits through the mouse hole to the lever. Only someone HUGE can press the big purple plate. Lever + plate at the same time opens the door.'; }
};

/* =============================================================== */
const ISL = [[5.5, 6.5, .55, 0], [9.5, 6.5, .75, 1.2], [13.5, 6.5, .62, 2.6], [17.5, 6.5, .85, .7]], IW = 2.1, ID = 1.5;
const islX = (L, t) => L[1] * Math.sin(t * L[2] + L[3]);
const isles = {
  name: 'The Drifting Isles',
  floor: bogFloor,
  notes: [[0, 1.8, '“The moon jar must cross. The islands will not wait.”', 1.4]],
  hint: 'Ride the drifting islands and hop to the next one when they line up. The moon jar can be thrown between islands — whoever is ahead catches it. Crows dive at you, so time your hops.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 3.5, 10, 19.5, bogWater(E), .012);
    this.isl = ISL.map(() => { const g = new T.Group(); const top = new T.Mesh(new T.BoxGeometry(IW * 2, .4, ID * 2), E.mat(0x4a6a2a)); top.position.y = .1; g.add(top); const roots = new T.Mesh(new T.ConeGeometry(1.6, 1.4, 8), E.mat(0x3a2a1a)); roots.position.y = -.6; roots.rotation.x = Math.PI; g.add(roots); E.scene.add(g); return g; });
    const ped = new T.Mesh(new T.CylinderGeometry(.6, .7, .9, 12), E.mat(0x8a8aa0)); R.place(ped, 0, 21, .45);
    crow(R, 0, 11.5, 7, { wait: 3.5 });
  },
  init(){ return { t: 0, done: 0, items: [mkItem('jar', 0, 2.2)] }; },
  solve(st){ st.done = 1; st.items[0].s = 3; },
  tNow(st, R){ return R.local.t ?? st.t; },
  pits(st, R){ return [R.rect(-10.5, 3.5, 10.5, 19.5)]; },
  bridges(st, R){ const t = this.tNow(st, R); return ISL.map(L => { const x = islX(L, t); return R.rect(x - IW, L[0] - ID, x + IW, L[0] + ID); }); },
  itemMesh(k, E){ if (k !== 'jar') return null; const T = E.THREE; return new T.Mesh(new T.SphereGeometry(.35, 14, 10), E.glow(0xdfe8ff, 1.2)); },
  onLand(st, R, E, it){
    if (it.lz > 19.5){ if (Math.hypot(it.x, it.lz - 21) < 1.6){ it.s = 3; this.win(st, R, E); } return; }
    if (it.lz < 3.5) return;
    const t = st.t, on = ISL.find(L => Math.abs(it.lz - L[0]) < ID && Math.abs(it.x - islX(L, t)) < IW);
    if (on){ it.isl = ISL.indexOf(on); it.off = it.x - islX(on, t); }
    else { home(it); E.ev('splash', 'The moon jar sank — it floats back to the start.'); }
  },
  carryTick(st, R, E, it, p){ if (Math.hypot(p.pos.x, R.lz(p.pos.z) - 21) < 1.7){ it.s = 3; this.win(st, R, E); } },
  win(st, R, E){ if (st.done) return; st.done = 1; R.open('exit'); E.ev('door', 'The moon jar is on its pedestal — the door opens!'); },
  host(dt, st, R, E){
    st.t += dt;
    for (const it of st.items){ if (it.s === 0 && it.isl !== undefined && it.isl >= 0){ it.x = +(islX(ISL[it.isl], st.t) + it.off).toFixed(2); } if (it.s !== 0) it.isl = -1; }
  },
  local(dt, st, R, E){
    const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt; L.t += (st.t - L.t) * .1;
    const p = E.me.pos, lz = R.lz(p.z);
    const on = ISL.findIndex(I => Math.abs(lz - I[0]) < ID + .05 && Math.abs(p.x - islX(I, L.pt ?? L.t)) < IW + .05);
    if (on >= 0 && L.pt !== undefined) p.x += islX(ISL[on], L.t) - islX(ISL[on], L.pt);
    L.pt = L.t;
  },
  visual(dt, t, st, R, E){ const tt = this.tNow(st, R); this.isl.forEach((g, i) => g.position.set(islX(ISL[i], tt), 0, R.Z(ISL[i][0]))); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Ride the drifting islands across the bog and hop between them when they line up. Get the glowing moon jar onto the far pedestal — <b>throw it</b> island to island.'; }
};

/* =============================================================== */
const HAG_PATH = [[-5.5, 7], [5.5, 7], [5.5, 15], [-5.5, 15]];
const hollow = {
  name: "The Hag's Hollow",
  floor: grassFloor,
  notes: [[-6, 1.8, '“The old hag is curious. Throw a stone and she\'ll go and look.”', 1.5]],
  hint: 'Throw a stone somewhere away from the key — the hag walks over to investigate it. While she\'s looking the other way, the other one sneaks in, grabs the key and carries it to the lock at the north end. Hedges block her lantern.',
  build(R, E){
    const T = E.THREE, hedge = E.mat(0x1e3a18);
    for (const [x1, l1, x2, l2] of [[-2.5, 9, -1.5, 13], [1.5, 9, 2.5, 13], [-8.5, 10.5, -7, 11.5], [7, 10.5, 8.5, 11.5], [-3, 18, 3, 18.8], [-9, 4, -6, 4.8], [6, 4, 9, 4.8]]) R.block(x1, l1, x2, l2, 1.8, hedge);
    const ped = new T.Mesh(new T.CylinderGeometry(.5, .6, .7, 10), E.mat(0x7a7a8a)); R.place(ped, 0, 11, .35);
    const lock = new T.Mesh(new T.BoxGeometry(1, 1.2, .5), E.mat(0xb08a3a, { metalness: .6 })); R.place(lock, 0, 21, .6);
    this.hag = R.ghost({ home: HAG_PATH[0], look: 'hood', tint: 0x6a8a4a, sp: 0, label: 'the swamp hag', cone: { len: 7, ang: .5, color: 0xd8ff8a },
      think: (g, dt, st, R2, E2, P) => {
        const m = g.mem; if (m.i === undefined){ m.i = 1; }
        if (st.lure && st.lure[2] > 0){
          const [lx, ll] = st.lure; const d = E2.stepToward(g, lx, R2.Z(ll), 3 * E2.GMULT, dt);
          if (d < .3){ st.lure[2] -= dt; g.ry += dt * 1.6; }
        } else {
          const [px, pl] = HAG_PATH[m.i]; if (E2.stepToward(g, px, R2.Z(pl), 2.1 * E2.GMULT, dt) < .1) m.i = (m.i + 1) % HAG_PATH.length;
        }
        for (const p of E2.targetsOf(g, P)) if (!p.dashing && E2.inCone(g, p.pos, 7, .5) && !E2.losBlocked(g.x, g.z, p.pos.x, p.pos.z)) E2.freeze(p.idx, E2.FREEZE, `The swamp hag spotted ${E2.names()[p.idx]}!`);
        E2.ghostTouch(g, E2.targetsOf(g, P), E2.names());
        return true;
      } });
  },
  init(){ return { lure: null, done: 0, items: [mkItem('key', 0, 11, { yRest: .9 }), mkItem('stone', -8, 2), mkItem('stone', 8, 2), mkItem('stone', 0, 2.5)] }; },
  solve(st){ st.done = 1; st.items[0].s = 3; },
  onLand(st, R, E, it){
    if (it.k !== 'stone') return;
    const z = R.Z(it.lz);
    if (E.staticRects().some(r => it.x > r.x1 && it.x < r.x2 && z > r.z1 && z < r.z2)){ home(it); return; }
    st.lure = [it.x, it.lz, 3.5]; E.ev('thud', 'Thunk! The hag turns toward the noise…');
  },
  carryTick(st, R, E, it, p){ if (it.k === 'key' && near(R, p, 0, 20.3, 1.6) && !st.done){ it.s = 3; st.done = 1; R.open('exit'); E.ev('door', 'The key turns — the hollow\'s gate opens!'); } },
  host(dt, st, R, E){},
  objective(st, R, E){ return st.done ? 'The gate is open!' : 'The swamp hag guards the key. <b>Throw a stone</b> to make her go investigate the noise — then sneak in, grab the key and carry it to the lock (north).'; }
};

/* =============================================================== */
const PUMPS = [[-8, 6], [-3, 9], [4, 5], [8.5, 10], [-8.5, 15], [-1, 15.5], [5, 19], [8.5, 15.5]];
const MUDS = [[-6, 10.5, -1, 13], [1, 7, 6.5, 9], [2, 12, 7, 14], [-6, 17, -2, 20]];
const BOWL = [0, 2.6];
const patch = {
  name: 'The Pumpkin Patch',
  floor: grassFloor,
  dark: .55,
  throwRange: 8,
  notes: [[-3.5, 1.6, '“Light every lantern before the first goes cold.”', 1.4]],
  hint: 'The torch burns out after 8 seconds (dip it back in the fire bowl to relight it). A THROWN torch lights every pumpkin it flies past! Stand far apart and toss the torch back and forth across the patch. Pumpkins only stay lit for a while.',
  build(R, E){
    const T = E.THREE;
    MUDS.forEach(([x1, l1, x2, l2]) => R.floor(x1, l1, x2, l2, mudMat(E), .014));
    this.pk = PUMPS.map(([x, lz]) => { const g = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.6, 14, 10), new T.MeshStandardMaterial({ color: 0xd8701a, emissive: 0xff9a2a, emissiveIntensity: 0 })); b.scale.y = .8; b.position.y = .45; g.add(b); const st = new T.Mesh(new T.CylinderGeometry(.06, .08, .25, 6), E.mat(0x3a5a1a)); st.position.y = .95; g.add(st); const l = new T.PointLight(0xff9a2a, 0, 6, 1.4); l.position.y = 1; g.add(l); return R.place(g, x, lz); });
    const bowl = new T.Mesh(new T.CylinderGeometry(.8, .5, .6, 14), E.mat(0x3a3a44, { metalness: .5 })); R.place(bowl, BOWL[0], BOWL[1] - 1.2, .3);
    const fire = new T.Mesh(new T.ConeGeometry(.5, 1, 10), E.flameMat); R.place(fire, BOWL[0], BOWL[1] - 1.2, .9);
    this.hm = handMeshes(E);
  },
  init(R, E){ return { lit: Array(8).fill(0), burn: 0, done: 0, mud: [0, 0], items: [mkItem('torch', BOWL[0], BOWL[1])] }; },
  solve(st){ st.done = 1; st.lit.fill(99); },
  itemMesh(k, E){ if (k !== 'torch') return null; const T = E.THREE, g = new T.Group(); const h = new T.Mesh(new T.CylinderGeometry(.06, .08, .8, 6), E.mat(0x6a4a2a)); g.add(h); const f = new T.Mesh(new T.ConeGeometry(.18, .4, 8), E.flameMat); f.position.y = .55; g.add(f); g.userData.f = f; return g; },
  onPick(st, R, E, it){ if (st.burn <= 0) st.burn = 8; return true; },
  host(dt, st, R, E){
    handsTick(st, R, E, dt, pos => MUDS.some(([x1, l1, x2, l2]) => inRect(R, pos, x1, l1, x2, l2)));
    const life = E.solo() ? 45 : 25;
    for (let i = 0; i < 8; i++) if (st.lit[i] > 0 && st.lit[i] < 90) st.lit[i] = Math.max(0, st.lit[i] - dt);
    if (st.done) return;
    const it = st.items[0];
    if (it.s !== 0 || Math.hypot(it.x - BOWL[0], it.lz - BOWL[1]) > .5){
      st.burn -= dt;
      if (Math.hypot(it.x - BOWL[0], it.lz - BOWL[1]) < 1.8) st.burn = 8;
      if (st.burn <= 0){ home(it); st.burn = 0; E.ev('splash', 'The torch fizzled out — a fresh one waits in the fire bowl.'); }
      else PUMPS.forEach(([x, lz], i) => { if (Math.hypot(it.x - x, it.lz - lz) < 1.4){ if (st.lit[i] <= 0) E.ev('chime', '', 1 + (i % 4)); st.lit[i] = life; } });
    }
    if (st.lit.every(v => v > 0)){ st.done = 1; st.lit.fill(99); R.open('exit'); E.ev('door', 'Every jack-o\'-lantern blazes! The patch gate opens.'); }
  },
  visual(dt, t, st, R, E){
    this.pk.forEach((g, i) => { const on = st.lit[i] > 0; g.children[0].material.emissiveIntensity = on ? 1 + Math.sin(t * 9 + i) * .15 : 0; g.children[2].intensity = on ? 3 : 0; });
    handVisual(this.hm, st, E);
  },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; const it = st.items[0]; if (st.burn > 0 && (it.s !== 0 || Math.hypot(it.x - BOWL[0], it.lz - BOWL[1]) > .5)) return { frac: st.burn / 8, label: 'Torch burning…', color: '#ffa53a' }; return { frac: st.lit.filter(v => v > 0).length / 8, label: `${st.lit.filter(v => v > 0).length}/8 pumpkins lit`, color: '#ff9a2a' }; },
  objective(st, R, E){ return st.done ? 'Every pumpkin is lit — the gate is open!' : `Light all 8 pumpkins with the torch — a <b>thrown</b> torch lights every pumpkin it flies past. The torch burns out after 8s (relight it at the fire bowl) and pumpkins don't stay lit forever. Avoid the mud!`; }
};

/* =============================================================== */
const FLASK_SPOTS = [[-8.5, 3], [8.5, 3], [-8.5, 19.5], [8.5, 19.5]];
const witch = {
  name: "The Bog Witch's Lair",
  floor: bogFloor,
  throwRange: 8,
  notes: [[0, 1.6, '“Her shield breaks in bright light. Holy water does the rest.”', 1.4]],
  hint: 'FLASH the witch (☀) to break her green shield for a few seconds — then THROW a holy water flask at her. Three hits beat her. Step out of the glowing hex circles before they burst.',
  build(R, E){
    const T = E.THREE;
    this.boss = R.ghost({ home: [0, 14], look: 'hat', tint: 0x6aff4a, scale: 1.4, flashImmune: true, label: 'the Bog Witch', sp: 0, touch: 1.3, gone: st => st.hp <= 0,
      think: (g, dt, st, R2, E2, P) => {
        const m = g.mem; m.a = (m.a || 0) + dt * (.45 + (3 - st.hp) * .12);
        g.x = Math.sin(m.a) * 6.5; g.z = R2.Z(11.5 + Math.sin(m.a * 2) * 5); g.ry = Math.cos(m.a) > 0 ? Math.PI / 2 : -Math.PI / 2; g.y = 0;
        E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), 1.3); g.ret = false;
        return true;
      } });
    this.shield = new T.Mesh(new T.SphereGeometry(1.9, 18, 14), new T.MeshBasicMaterial({ color: 0x6aff4a, transparent: true, opacity: .25, depthWrite: false })); E.scene.add(this.shield);
    this.hexM = [0, 1, 2].map(() => { const m = new T.Mesh(new T.RingGeometry(1.4, 1.75, 28), new T.MeshBasicMaterial({ color: 0xb04aff, transparent: true, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .06; m.visible = false; E.scene.add(m); return m; });
    crow(R, 0, 11, 7.5, { wait: 4 });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3);
  },
  init(){ return { hp: 3, sh: 0, hex: [], ht: 3, done: 0, items: FLASK_SPOTS.map(([x, lz]) => mkItem('flask', x, lz)) }; },
  solve(st){ st.hp = 0; st.done = 1; },
  itemMesh(k, E){ if (k !== 'flask') return null; const T = E.THREE, g = new T.Group(); g.add(new T.Mesh(new T.SphereGeometry(.25, 12, 10), E.glow(0x9ad8ff, 1.2))); const n = new T.Mesh(new T.CylinderGeometry(.07, .07, .25, 8), E.mat(0xd8d8e8)); n.position.y = .28; g.add(n); return g; },
  onFlash(st, R, E, idx, x, z){ const g = this.boss; if (st.hp > 0 && Math.hypot(g.x - x, g.z - z) < 7){ st.sh = 3.5; E.ev('chime', 'Her shield shatters — THROW NOW!', 3); } },
  onHitGhost(st, R, E, it, g){
    if (g !== this.boss) return true;
    if (it.k !== 'flask') return false;
    if (st.sh > 0){ st.hp--; st.sh = 0; it.s = 3; it.re = 4; g.stun = 1.2; E.ev('gong', st.hp > 0 ? `Direct hit! (${3 - st.hp}/3)` : '', 140); if (st.hp <= 0){ st.done = 1; R.open('exit'); E.ev('door', 'The Bog Witch melts into a puddle of green slime! The way out is open.'); } }
    else { E.ev('laugh', 'The flask bounces off her shield!'); }
    return false;
  },
  onLand(st, R, E, it){ if (it.k === 'flask'){ it.s = 3; it.re = 3; E.ev('splash'); } },
  host(dt, st, R, E){
    for (const it of st.items) if (it.s === 3 && it.re > 0){ it.re -= dt; if (it.re <= 0) home(it); }
    if (st.sh > 0) st.sh -= dt;
    if (st.done) return;
    st.ht -= dt;
    const T = E.P.filter(p => R.inside(p.pos) && !p.frozen);
    if (st.ht <= 0 && T.length){ const p = T[Math.floor(Math.random() * T.length)]; st.hex.push([+p.pos.x.toFixed(2), +R.lz(p.pos.z).toFixed(2), 1.3]); st.ht = 2.6 + st.hp * .5; E.ev('whoosh'); }
    for (const h of st.hex){ h[2] -= dt; if (h[2] <= 0){ for (const p of E.P) if (!p.dashing && Math.hypot(p.pos.x - h[0], R.lz(p.pos.z) - h[1]) < 1.75) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} got caught in a hex!`); E.ev('zap'); } }
    st.hex = st.hex.filter(h => h[2] > 0);
  },
  visual(dt, t, st, R, E){
    const g = this.boss; this.shield.visible = st.hp > 0 && !(st.sh > 0); this.shield.position.set(g.x, 1.6, g.z); this.shield.material.opacity = .2 + Math.sin(t * 5) * .05;
    this.hexM.forEach((m, i) => { const h = st.hex[i]; m.visible = !!h; if (h){ m.position.set(h[0], .06, R.Z(h[1])); m.material.opacity = .4 + (1.3 - h[2]) * .45; m.scale.setScalar(.6 + (1.3 - h[2]) * .35); } });
    setOrbs(this.orbs, 3 - st.hp);
  },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; if (st.sh > 0) return { frac: st.sh / 3.5, label: 'SHIELD DOWN — THROW A FLASK!', color: '#9ad8ff' }; return { frac: st.hp / 3, label: 'Bog Witch', color: '#6aff4a' }; },
  objective(st, R, E){ return st.done ? 'The witch is gone — escape the bog!' : `<b>Flash</b> the Bog Witch to break her shield, then <b>throw</b> a holy-water flask at her. Dodge the purple hex circles. (${3 - st.hp}/3 hits)`; }
};

export default {
  level: 6,
  title: "The Witch's Bog",
  tagline: 'The witch never died. She just sank a little.<br>The bog remembers everything.',
  story: 'Fog curls over black water. Things move under the mud.',
  winTitle: 'You escaped the bog! 🧙',
  feature: { name: 'Throw', icon: '⚡', how: 'While carrying something, tap <b>Space</b> / <b>⚡</b> to <b>throw</b> it. Your partner catches it if they\'re in the way. Thrown stones knock ghosts out of the air.' },
  accent: '#8ad04a',
  wallColor: 0x2a3a22,
  trimColor: 0x5a6a3a,
  doorColor: 0x3a2a1a,
  sky: 0x6a8a5a,
  bg: 0x070a05,
  drone: 43,
  rooms: [scarecrows, banks, roost, brambles, swamp, cottage, isles, hollow, patch, witch],
};
