// Level 12 — The Toy Factory. New power: DECOY (hold ⚡ to drop a lure lantern that enemies walk to).
// Enemies: Wind-up Soldiers (march, can't be flashed, follow decoys) and Jack-in-the-Boxes (pop at anything that comes near).
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const tiles = E => E.mat(0xffffff, { roughness: .6, map: E.tiledTex(128, 128, (x, w, h) => { const C = ['#c84a4a', '#e8c25a', '#4a8ac8', '#5ab86a']; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ x.fillStyle = (i + j) % 2 ? '#f2ead8' : C[(i * 2 + j) % 4]; x.fillRect(i * 32, j * 32, 32, 32); } }, 5, 5) });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; };

/* ---------- wind-up soldier: marches its route, walks to decoy lanterns, can't be flashed, can't pass walls ---------- */
function soldier(R, E, opt){
  const g = R.ghost({ home: opt.path[0], look: 'hat', tint: opt.tint || 0xc83a3a, sp: 0, ignoreDecoy: true, flashImmune: true, label: opt.label || 'a wind-up soldier', b: opt.b, gone: opt.gone, scale: opt.scale || .9,
    think: (g, dt, st, R2, E2, P) => {
      const m = g.mem; m.key = (m.key || 0) + dt;
      if (opt.halt && opt.halt(g, st, m)){ m.moving = 0; return true; }
      let tx, tz, d = null, bd = opt.lure || 9;
      for (const dc of E2.S.decoys){ const dd = Math.hypot(dc.x - g.x, dc.z - g.z); if (dd < bd && (!opt.b || E2.inBounds(g, { x: dc.x, z: dc.z }, 0))){ bd = dd; d = dc; } }
      if (d){ tx = d.x; tz = d.z; m.lured = 1; }
      else { const pts = opt.path; if (m.i === undefined) m.i = 0; const [px, pl] = pts[m.i]; tx = px; tz = R2.Z(pl); if (Math.hypot(g.x - tx, g.z - tz) < .25) m.i = (m.i + 1) % pts.length; m.lured = 0; }
      const ox = g.x, oz = g.z, sp = (typeof opt.sp === 'function' ? opt.sp(st, g) : (opt.sp || 2.2)) * E2.GMULT;
      if (Math.hypot(tx - g.x, tz - g.z) > (d ? .8 : .05)) E2.stepToward(g, tx, tz, sp, dt);
      if (!opt.noCollide){ E2.resolve(g, E2.staticRects()); }
      m.moving = Math.hypot(g.x - ox, g.z - oz) > .001;
      if (!opt.harmless || !opt.harmless(g, st, m)) E2.ghostTouch(g, E2.targetsOf(g, P), E2.names());
      return true;
    } });
  const T = E.THREE, key = new T.Group(); const ring = new T.Mesh(new T.TorusGeometry(.18, .05, 6, 12), E.mat(0xd4af37, { metalness: .8 })); ring.position.y = .2; key.add(ring); const shaft = new T.Mesh(new T.CylinderGeometry(.04, .04, .4, 6), ring.material); shaft.rotation.x = Math.PI / 2; key.add(shaft); key.position.set(0, 1.1, -.55); g.mesh.add(key); g.keyMesh = key;
  return g;
}
const spinKeys = (gs, dt) => gs.forEach(g => { if (g.keyMesh && (g.mem.moving || g.mem.lured)) g.keyMesh.rotation.z += dt * 6; });

/* ---------- jack-in-the-boxes: anything near them starts the tune; then POP ---------- */
const JK = { trig: 3.2, pop: 2.7, tune: 1.0, rew: 3.5 };
function jackMeshes(R, E, list, scale = 1){
  const T = E.THREE;
  return list.map(([x, lz]) => {
    const g = new T.Group(); const box = new T.Mesh(new T.BoxGeometry(1.2, 1.2, 1.2), E.mat(0xffffff, { map: E.canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#c83a3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8c25a'; c.font = 'bold 40px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, h / 2 + 2); }) })); box.position.y = .6; g.add(box);
    const crank = new T.Mesh(new T.CylinderGeometry(.05, .05, .5, 6), E.mat(0xd4af37)); crank.rotation.z = Math.PI / 2; crank.position.set(.8, .7, 0); g.add(crank);
    const head = new T.Group(); const face = new T.Mesh(new T.SphereGeometry(.42, 14, 10), E.mat(0xf2e0c8)); head.add(face); const hat = new T.Mesh(new T.ConeGeometry(.4, .6, 8), E.mat(0x7a3ac8)); hat.position.y = .5; head.add(hat); const nose = new T.Mesh(new T.SphereGeometry(.1, 8, 6), E.glow(0xff3030, 1)); nose.position.set(0, 0, .42); head.add(nose);
    head.position.y = .9; head.visible = false; g.add(head);
    const spring = new T.Mesh(new T.CylinderGeometry(.12, .12, 1, 8), E.mat(0xb0b0b8, { metalness: .7 })); spring.visible = false; g.add(spring);
    const ring = new T.Mesh(new T.RingGeometry(JK.pop - .1, JK.pop, 32), new T.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; ring.scale.setScalar(1 / scale); g.add(ring);
    g.scale.setScalar(scale); R.place(g, x, lz); R.block(x - .6 * scale, lz - .6 * scale, x + .6 * scale, lz + .6 * scale, .01, E.mat(0));
    return { g, box, head, spring, ring, x, lz };
  });
}
// host: st.jk = [[state, t], ...]  state 0 idle, 1 tune, 2 open
function jackTick(dt, st, R, E, list, extraTrig = () => false, onPop = null){
  list.forEach(([x, lz], i) => {
    const j = st.jk[i]; j[1] = Math.max(0, j[1] - dt);
    if (j[0] === 0){
      const near2 = (px, plz) => Math.hypot(px - x, plz - lz) < JK.trig;
      const trig = E.P.some(p => !p.frozen && R.inside(p.pos) && near2(p.pos.x, R.lz(p.pos.z))) || E.S.decoys.some(d => near2(d.x, R.lz(d.z))) || extraTrig(i, x, lz);
      if (trig){ j[0] = 1; j[1] = JK.tune; E.ev('tone', '', 0); }
    } else if (j[0] === 1 && j[1] <= 0){
      j[0] = 2; j[1] = JK.rew; E.ev('boo');
      for (const p of E.P) if (!p.frozen && !p.dashing && R.inside(p.pos) && Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < JK.pop) E.freeze(p.idx, E.FREEZE, `POP! A jack-in-the-box got ${E.names()[p.idx]}!`);
      if (onPop) onPop(i, x, lz);
    } else if (j[0] === 2 && j[1] <= 0){ j[0] = 0; }
  });
}
function jackVisual(meshes, st, t){
  meshes.forEach((m, i) => { const [s, tt] = st.jk[i];
    m.box.rotation.z = s === 1 ? Math.sin(t * 40) * .08 : 0; m.box.position.x = s === 1 ? Math.sin(t * 53) * .04 : 0;
    const up = s === 2 ? Math.min(1, (JK.rew - tt) * 8) : 0; m.head.visible = s === 2; m.spring.visible = s === 2; m.head.position.y = .9 + up * 1.4; m.spring.position.y = 1.2 + up * .55; m.spring.scale.y = .2 + up; m.head.rotation.z = s === 2 ? Math.sin(t * 9) * .3 : 0;
    m.ring.material.opacity = s === 1 ? .35 + Math.sin(t * 25) * .25 : s === 2 && tt > JK.rew - .3 ? .6 : 0; });
}

/* =============================================================== */
const wrapping = {
  name: 'The Wrapping Room',
  floor: tiles,
  notes: [[0, 1.6, '“Tin soldiers can\'t resist a lantern. Hold ⚡ to leave one behind.”', 1.5]],
  hint: 'The aisle on the left is too narrow to get past the soldier. HOLD ⚡ (Space) to drop a decoy lantern somewhere far from the aisle — the soldier marches over to guard it for a few seconds. Then slip up the aisle.',
  build(R, E){
    EE = E; const T = E.THREE;
    R.block(-8, 6, 10, 18, 1.4, E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 }));
    for (let i = 0; i < 14; i++){ const s = .5 + Math.random() * .6, b = new T.Mesh(new T.BoxGeometry(s, s, s), E.mat([0xc83a3a, 0x4a8ac8, 0x5ab86a, 0xe8c25a][i % 4])); R.place(b, -6 + Math.random() * 15, 6.5 + Math.random() * 11, 1.4 + s / 2); }
    this.s = [soldier(R, E, { path: [[-9, 7], [-9, 17]], sp: 2.2, b: [-10, 10, .5, 21.5] })];
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 18.6)){ st.done = 1; R.open('exit'); E.ev('door', 'Past the tin soldier — the door opens!'); } },
  visual(dt, t, st){ spinKeys(this.s, dt); },
  objective(st, R, E){ return st.done ? 'The door is open!' : '<b>NEW: Decoy!</b> <b>Hold ⚡</b> (Space) to drop a lure lantern. Wind-up soldiers march to it and guard it for a while — lead the soldier out of the narrow aisle, then sneak past.'; }
};

/* =============================================================== */
const JA2 = [[-7.6, 5], [-2, 8.5], [5.5, 7.4], [-6, 13], [2.4, 14.6], [7.2, 18.4], [-3.8, 19]];
const BL2 = [[-1, 2.4], [4, 3], [-8.5, 9.5], [8, 12], [-1, 11.5]];
const alley = {
  name: 'Jack-in-the-Box Alley',
  floor: tiles,
  notes: [[3, 1.4, '“Pop goes the weasel… anything that comes near sets them off.”', 1.5]],
  hint: 'A jack box plays its tune when ANYTHING comes near — you, a decoy lantern, or a toy block you throw next to it. Then it pops and freezes everyone close by, and takes a few seconds to wind back down. Set them off from a distance, then walk past while they rewind.',
  build(R, E){
    EE = E; const T = E.THREE;
    R.block(-10, 10.2, -3.5, 10.8, 1.4, E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 })); R.block(4, 10.2, 10, 10.8, 1.4, E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 })); R.block(-1, 16.4, 10, 17, 1.4, E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 }));
    this.jm = jackMeshes(R, E, JA2);
  },
  init(){ return { jk: JA2.map(() => [0, 0]), items: BL2.map(([x, lz], i) => mkItem('block', x, lz, { n: i })), land: [], done: 0 }; },
  solve(st){ st.done = 1; },
  itemMesh(k, E){ if (k !== 'block') return null; const m = new E.THREE.Mesh(new E.THREE.BoxGeometry(.5, .5, .5), E.mat(0xffffff, { map: E.canvasTex(32, 32, (c, w, h) => { c.fillStyle = ['#c83a3a', '#4a8ac8', '#5ab86a', '#e8c25a'][Math.floor(Math.random() * 4)]; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ABCDEFG'[Math.floor(Math.random() * 7)], w / 2, h / 2 + 1); }) })); return m; },
  onLand(st, R, E, it){ st.land.push([it.x, it.lz, .2]); },
  host(dt, st, R, E){
    st.land = st.land.filter(l => (l[2] -= dt) > 0);
    jackTick(dt, st, R, E, JA2, (i, x, lz) => st.land.some(([a, b]) => Math.hypot(a - x, b - lz) < JK.trig + .6));
    if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.4)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the alley — the door opens!'); }
  },
  visual(dt, t, st){ jackVisual(this.jm, st, t); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Get through the alley. <b>Jack-in-the-boxes</b> pop at anything that comes near — set them off from a distance with a <b>decoy</b> or a <b>thrown block</b>, then pass while they rewind.'; }
};

/* =============================================================== */
const BC3 = 6, BR3 = 5, BX3 = c => -6.25 + c * 2.5, BL3 = r => 5.25 + r * 2.5;
const BELT3 = 'SWWWNSNWNEESEWESNNNSSNNSEESEWW';
const SW3 = [[2, 4], [2, 2], [3, 1], [5, 1]], SWP3 = [[1.25, 19.6], [-9.2, 10.3], [-6, 1.6], [9.2, 7.8]];
const DV3 = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] }, CYC3 = ['N', 'E', 'S', 'W'];
const HOP3 = [0, 4], BOX3 = [5, 0];
const conveyor = {
  name: 'The Conveyor Floor',
  floor: tiles,
  notes: [[0, 1.4, '“The press is too hot to touch. Let the belts carry the parts to the box.”', 1.5]],
  hint: 'Toy parts drop out of the hopper (top left) and ride the arrows. Step on a switch pad to turn its belt (the four belts with gold rims). Follow a part from the hopper and fix each wrong turn until it reaches the gift box (bottom right). The belts push you too!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.arrows = []; this.belts = [];
    for (let c = 0; c < BC3; c++) for (let r = 0; r < BR3; r++){
      const sw = SW3.some(([a, b]) => a === c && b === r);
      const m = new T.Mesh(new T.BoxGeometry(2.4, .08, 2.4), E.mat(sw ? 0x6a5a2a : 0x3a3a44, { roughness: .8 })); R.place(m, BX3(c), BL3(r), .04);
      const a = new T.Group(), cone = new T.Mesh(new T.ConeGeometry(.45, .9, 3), E.glow(sw ? 0xffd34a : 0x9ad8ff, .9)); cone.rotation.x = -Math.PI / 2; a.add(cone); R.place(a, BX3(c), BL3(r), .12); this.arrows.push({ a, c, r });
    }
    SWP3.forEach(([x, lz], i) => R.plate('s' + i, x, lz, 0xffd34a, 1.3, '⟳'));
    const hop = new T.Mesh(new T.CylinderGeometry(1, .5, 1.4, 10, 1, true), new T.MeshStandardMaterial({ color: 0x8a8a94, metalness: .7, side: T.DoubleSide })); R.place(hop, BX3(HOP3[0]), BL3(HOP3[1]) + .4, 2.6);
    const box = new T.Mesh(new T.BoxGeometry(2.2, 1.2, 1.6), E.tex('polka_paper', { color: 0xc83a3a, tile: 1 })); R.place(box, BX3(BOX3[0]), BL3(BOX3[1]) - 2.3, .6); const bow = new T.Mesh(new T.TorusGeometry(.35, .12, 8, 16), E.mat(0xe8c25a)); R.place(bow, BX3(BOX3[0]), BL3(BOX3[1]) - 2.3, 1.4);
    this.orbs = orbRow(E, R, 3, 4, 1.4, 1.3, 1.8);
    this.s = [soldier(R, E, { path: [[-9, 3], [-9, 18], [9, 18], [9, 3]], sp: 2, b: [-10, 10, .5, 21.5], noCollide: true })];
  },
  init(){ return { dir: SW3.map(() => 'N'), got: 0, t: 1, items: [0, 1, 2].map(i => mkItem('part', -20, 0, { n: i, s: 3, nopick: true })) }; },
  solve(st){ st.got = 3; },
  dirAt(st, c, r){ const k = SW3.findIndex(([a, b]) => a === c && b === r); return k >= 0 ? st.dir[k] : BELT3[r * BC3 + c]; },
  itemMesh(k, E){ if (k !== 'part') return null; const T = E.THREE, g = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.3, 10, 8), E.mat(0xe8c25a, { metalness: .5 })); b.position.y = .3; g.add(b); const c = new T.Mesh(new T.TorusGeometry(.3, .07, 6, 12), E.mat(0x4a8ac8)); c.position.y = .3; g.add(c); return g; },
  cellOf(x, lz){ const c = Math.round((x - BX3(0)) / 2.5), r = Math.round((lz - BL3(0)) / 2.5); return c >= 0 && c < BC3 && r >= 0 && r < BR3 && Math.abs(x - BX3(c)) < 1.25 && Math.abs(lz - BL3(r)) < 1.25 ? [c, r] : null; },
  push(st, R, E, pos){ const cr = this.cellOf(pos.x, R.lz(pos.z)); if (!cr) return null; const [dx, dl] = DV3[this.dirAt(st, ...cr)]; return [dx * 2.4, -dl * 2.4]; },
  host(dt, st, R, E){
    SW3.forEach((_, i) => { if (R.edge('s' + i)){ st.dir[i] = CYC3[(CYC3.indexOf(st.dir[i]) + 1) % 4]; E.ev('click'); } });
    st.t -= dt;
    if (st.t <= 0 && st.got < 3){ const it = st.items.find(i => i.s === 3 && !i.done); if (it){ it.s = 0; it.x = BX3(HOP3[0]); it.lz = BL3(HOP3[1]); it.y = 0; } st.t = 4.5; }
    for (const it of st.items){
      if (it.s !== 0 || it.done) continue;
      const cr = this.cellOf(it.x, it.lz);
      if (!cr){ it.s = 3; E.ev('thud', 'A part fell off the belts into the scrap bin!'); continue; }
      const d = this.dirAt(st, ...cr), [dx, dl] = DV3[d], sp = 2.2 * dt;
      if (dx){ it.lz += (BL3(cr[1]) - it.lz) * Math.min(1, dt * 8); it.x += dx * sp; } else { it.x += (BX3(cr[0]) - it.x) * Math.min(1, dt * 8); it.lz += dl * sp; }
      it.x = +it.x.toFixed(3); it.lz = +it.lz.toFixed(3);
      if (cr[0] === BOX3[0] && cr[1] === BOX3[1] && d === 'S' && it.lz < BL3(0) - 1.1){ it.s = 3; it.done = 1; st.got++; E.ev('place', st.got < 3 ? `A part drops into the gift box! (${st.got}/3)` : ''); }
    }
    if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'The toy is assembled — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.arrows.forEach(({ a, c, r }) => { const [dx, dl] = DV3[this.dirAt(st, c, r)]; a.rotation.y = Math.atan2(-dx, dl); }); setOrbs(this.orbs, st.got); spinKeys(this.s, dt); },
  objective(st, R, E){ return st.got >= 3 ? 'The door is open!' : `Route the toy parts from the hopper (top left) to the gift box (bottom right). Step on a ⟳ pad to turn its gold-rimmed belt. (${st.got}/3)`; }
};

/* =============================================================== */
const SC4 = 8, SR4 = 7, SX4 = c => -8.75 + c * 2.5, SL4 = r => 2.25 + r * 2.5;
const WALL4 = [[1, 5], [6, 5], [3, 4], [2, 2], [5, 2]];
const BLK4 = [[5, 3, 'B'], [1, 3, 'O'], [4, 1, 'O']], TGT4 = [[2, 6, 'B'], [3, 6, 'O'], [4, 6, 'O']];
const blocks = {
  name: 'The Alphabet Blocks',
  floor: tiles,
  notes: [[-5, 1.4, '“Spell what every ghost says. Push the blocks — they only slide, never pull.”', 1.5]],
  hint: 'Walk into a block to push it one square. Spell B-O-O on the three gold squares at the top, left to right. A block in a corner is stuck for good — use the ↺ pad to reset. The soldier marching up the right side can\'t walk through blocks.',
  build(R, E){
    EE = E; const T = E.THREE;
    WALL4.forEach(([c, r]) => { R.block(SX4(c) - 1.2, SL4(r) - 1.2, SX4(c) + 1.2, SL4(r) + 1.2, 1.6, E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 })); });
    TGT4.forEach(([c, r, l]) => { const m = new T.Mesh(new T.BoxGeometry(2.3, .06, 2.3), E.glow(0xe8c25a, .5)); R.place(m, SX4(c), SL4(r), .03); });
    R.block(-10, 18.5, 7.5, 19, 2.4, E.mat(0x6a4a2a));
    this.bm = BLK4.map(([c, r, l]) => { const m = new T.Mesh(new T.BoxGeometry(2.2, 2, 2.2), E.mat(0xffffff, { map: E.canvasTex(128, 128, (x, w, h) => { x.fillStyle = l === 'B' ? '#4a8ac8' : '#c83a3a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#f2ead8'; x.lineWidth = 8; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = '#f2ead8'; x.font = 'bold 90px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(l, w / 2, h / 2 + 6); }) })); E.scene.add(m); return m; });
    R.plate('reset', -6, 1.2, 0x8affc1, 1.2, '↺');
    this.s = [soldier(R, E, { path: [[8.75, 3], [8.75, 17]], sp: 1.8, b: [-10, 10, .5, 21.5] })];
  },
  init(){ return { b: BLK4.map(([c, r, l]) => [c, r, l]), pt: [0, 0], done: 0 }; },
  solve(st){ st.done = 1; st.b = TGT4.map(([c, r, l]) => [c, r, l]); },
  colliders(st, R){ return st.b.map(([c, r]) => R.rect(SX4(c) - 1.1, SL4(r) - 1.1, SX4(c) + 1.1, SL4(r) + 1.1)); },
  freeCell(st, R, E, c, r, skip){ if (c < 0 || r < 0 || c >= SC4 || r >= SR4) return false; if (WALL4.some(([a, b]) => a === c && b === r)) return false; if (st.b.some(([a, b], i) => i !== skip && a === c && b === r)) return false; if (E.P.some(p => Math.abs(p.pos.x - SX4(c)) < 1.5 && Math.abs(R.lz(p.pos.z) - SL4(r)) < 1.5)) return false; return true; },
  host(dt, st, R, E){
    if (st.done) return;
    if (R.edge('reset')){ st.b = BLK4.map(([c, r, l]) => [c, r, l]); E.ev('chime', 'The blocks tumble back to where they started.'); }
    for (const p of E.P){
      if (p.frozen || !p.moving || !R.inside(p.pos)){ st.pt[p.idx] = 0; continue; }
      const fx = Math.sin(p.ry), fl = -Math.cos(p.ry), lz = R.lz(p.pos.z);
      const dir = Math.abs(fx) > Math.abs(fl) ? [Math.sign(fx), 0] : [0, Math.sign(fl)];
      if (Math.max(Math.abs(fx), Math.abs(fl)) < .8){ st.pt[p.idx] = 0; continue; }
      const i = st.b.findIndex(([c, r]) => { const ax = SX4(c) - p.pos.x, al = SL4(r) - lz; return dir[0] ? (Math.sign(ax) === dir[0] && Math.abs(ax) < 1.75 && Math.abs(al) < .9) : (Math.sign(al) === dir[1] && Math.abs(al) < 1.75 && Math.abs(ax) < .9); });
      if (i < 0){ st.pt[p.idx] = 0; continue; }
      st.pt[p.idx] += dt;
      if (st.pt[p.idx] > .22){ st.pt[p.idx] = 0; const [c, r] = st.b[i], nc = c + dir[0], nr = r + dir[1]; if (this.freeCell(st, R, E, nc, nr, i)){ st.b[i] = [nc, nr, st.b[i][2]]; E.ev('thud'); } }
    }
    if (TGT4.every(([c, r, l]) => st.b.some(([a, b, m]) => a === c && b === r && m === l))){ st.done = 1; R.open('exit'); E.ev('door', 'B-O-O! The blocks spell it out — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.bm.forEach((m, i) => { const [c, r] = st.b[i]; const x = SX4(c), z = R.Z(SL4(r)); if (Math.hypot(m.position.x - x, m.position.z - z) > 4) m.position.set(x, 1, z); m.position.x += (x - m.position.x) * E.damp(14, dt); m.position.z += (z - m.position.z) * E.damp(14, dt); m.position.y = 1; }); spinKeys(this.s, dt); },
  objective(st, R, E){ return st.done ? 'BOO! The door is open (top right).' : 'Push the letter blocks to spell <b>B O O</b> on the gold squares at the top (left to right). Walk into a block to push it. Stuck? ↺ resets.'; }
};

/* =============================================================== */
const BOX5 = [[-8.4, 2.2], [8.4, 2.2], [-8.4, 19.8], [8.4, 19.8]], TOP5 = [[-3, 8, 3.2, 2.1], [4, 13, -2.4, 3], [0, 17, 3.6, -1.6]];
const tops = {
  name: 'The Spinning Tops',
  floor: tiles,
  notes: [[0, 1.4, '“The tops are drawn to light like moths. Steer them into the toy chests.”', 1.5]],
  hint: 'The tops bounce off the walls and curve towards any decoy lantern nearby. Drop a lantern near a toy chest in a corner and a top will swerve into it. Catch all three — and don\'t let one hit you.',
  build(R, E){
    EE = E; const T = E.THREE;
    BOX5.forEach(([x, lz]) => { const b = new T.Mesh(new T.BoxGeometry(2.4, .5, 2.4), E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 })); R.place(b, x, lz, .25); const i = new T.Mesh(new T.BoxGeometry(2, .05, 2), E.glow(0xe8c25a, .4)); R.place(i, x, lz, .51); });
    this.tm = TOP5.map((_, i) => { const g = new T.Group(); const body = new T.Mesh(new T.ConeGeometry(.8, 1.1, 16), E.mat([0xc83a3a, 0x4a8ac8, 0x5ab86a][i], { metalness: .3 })); body.rotation.x = Math.PI; body.position.y = .75; g.add(body); const cap = new T.Mesh(new T.CylinderGeometry(.8, .8, .2, 16), E.mat(0xe8c25a)); cap.position.y = 1.35; g.add(cap); const st = new T.Mesh(new T.CylinderGeometry(.07, .07, .6, 6), E.mat(0xe8c25a)); st.position.y = 1.7; g.add(st); E.scene.add(g); return g; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.2, 1.3, 2.4);
  },
  init(){ return { tp: TOP5.map(([x, lz, vx, vl]) => [x, lz, vx, vl, 0]), got: 0 }; },
  solve(st){ st.got = 3; st.tp.forEach(t => t[4] = 1); },
  host(dt, st, R, E){
    for (const t of st.tp){
      if (t[4]) continue;
      let [x, lz, vx, vl] = t; const sp = Math.hypot(vx, vl) || 1;
      let d = null, bd = 9; for (const dc of E.S.decoys){ const dd = Math.hypot(dc.x - x, R.lz(dc.z) - lz); if (dd < bd){ bd = dd; d = dc; } }
      if (d){ const want = Math.atan2(d.x - x, R.lz(d.z) - lz), cur = Math.atan2(vx, vl); let df = want - cur; df = Math.atan2(Math.sin(df), Math.cos(df)); const a = cur + Math.max(-2.2 * dt, Math.min(2.2 * dt, df)); vx = Math.sin(a) * sp; vl = Math.cos(a) * sp; }
      x += vx * dt * E.GMULT; lz += vl * dt * E.GMULT;
      if (x < -9.2){ x = -9.2; vx = Math.abs(vx); } if (x > 9.2){ x = 9.2; vx = -Math.abs(vx); }
      if (lz < .9){ lz = .9; vl = Math.abs(vl); } if (lz > 21.1){ lz = 21.1; vl = -Math.abs(vl); }
      t[0] = +x.toFixed(3); t[1] = +lz.toFixed(3); t[2] = +vx.toFixed(3); t[3] = +vl.toFixed(3);
      const bi = BOX5.findIndex(([bx, bl]) => Math.abs(x - bx) < 1.2 && Math.abs(lz - bl) < 1.2);
      if (bi >= 0){ t[4] = 1; st.got++; E.ev('thud', st.got < 3 ? `A top tumbles into the toy chest! (${st.got}/3)` : ''); continue; }
      for (const p of E.P) if (!p.frozen && !p.dashing && R.inside(p.pos) && Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < 1.1) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} was bowled over by a spinning top!`);
    }
    if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'All three tops are in their chests — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.tm.forEach((g, i) => { const tp = st.tp[i]; const bi = BOX5.findIndex(([bx, bl]) => Math.abs(tp[0] - bx) < 1.3 && Math.abs(tp[1] - bl) < 1.3); g.position.set(tp[0], tp[4] ? .3 : 0, R.Z(tp[1])); g.rotation.y += dt * (tp[4] ? 2 : 14); g.rotation.z = tp[4] ? .5 : Math.sin(t * 3 + i) * .08; g.visible = !(tp[4] && bi < 0); }); setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 3 ? 'The door is open!' : `Catch the 3 spinning tops in the corner toy chests. Tops <b>curve towards decoy lanterns</b> — use them to steer! Don't get bowled over. (${st.got}/3)`; }
};

/* =============================================================== */
const CL6 = [{ x1: -10, l1: 4, x2: -6, l2: 9, door: [-6.2, 5.2, -5.8, 7.8] }, { x1: 6, l1: 9, x2: 10, l2: 14, door: [5.8, 10.2, 6.2, 12.8] }, { x1: -10, l1: 15, x2: -6, l2: 20, door: [-6.2, 16.2, -5.8, 18.8] }];
const MODEL6 = [[-1.2, 10.6], [1.2, 12], [-1.2, 13.4]];
const dollhouse = {
  name: 'The Dollhouse',
  floor: tiles,
  notes: [[0, 1.6, '“What you do to the little house happens to the big one.”', 1.5]],
  get hint(){ return 'The tiny doors on the model in the middle open and shut the big closet doors. Lure a soldier into a closet with a decoy lantern (drop it inside, then get out), and when the soldier is inside, step on the model door to slam it shut. ' + (solo() ? 'Solo: you\'ll have to sprint from the closet to the model.' : 'One lures, one works the model.'); },
  build(R, E){
    EE = E; const T = E.THREE;
    CL6.forEach((c, i) => {
      const ex = c.x1 < 0 ? c.x2 : c.x1; // open side
      R.wall(Math.min(c.x1, c.x2), c.l1 - .2, Math.max(c.x1, c.x2), c.l1 + .2); R.wall(Math.min(c.x1, c.x2), c.l2 - .2, Math.max(c.x1, c.x2), c.l2 + .2);
      R.wall(ex - .2, c.l1, ex + .2, c.door[1]); R.wall(ex - .2, c.door[3], ex + .2, c.l2);
      R.door('c' + i, c.door[0], c.door[1], c.door[2], c.door[3], 'gate');
    });
    const tbl = new T.Mesh(new T.BoxGeometry(4.2, .9, 4.4), E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 })); R.place(tbl, 0, 12, .45);
    const roof = new T.Mesh(new T.ConeGeometry(2.2, 1.4, 4), E.tex('red_tin', { color: 0xc83a3a, metalness: .4, roughness: .45, tile: 1.4 })); roof.rotation.y = Math.PI / 4; R.place(roof, 0, 12, 1.6);
    MODEL6.forEach(([x, lz], i) => R.plate('m' + i, x + (i === 1 ? 1.9 : -1.9), lz, 0xe8c25a, 1.1, ['Ⅰ', 'Ⅱ', 'Ⅲ'][i]));
    R.block(-2.1, 9.8, 2.1, 14.2, .01, E.mat(0));
    this.s = [
      soldier(R, E, { path: [[-3, 3], [4, 3], [4, 8], [-3, 8]], sp: 2, b: [-10, 10, .5, 21.5], halt: (g, st) => this.trapped(st, R, g) }),
      soldier(R, E, { path: [[4.6, 8.5], [4.6, 15], [5.2, 15], [5.2, 8.5]], sp: 2, b: [-10, 10, .5, 21.5], halt: (g, st) => this.trapped(st, R, g) }),
      soldier(R, E, { path: [[-4, 20], [3, 20], [3, 15.5], [-4, 15.5]], sp: 2, b: [-10, 10, .5, 21.5], halt: (g, st) => this.trapped(st, R, g) }),
    ];
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  inCloset(R, g){ return CL6.findIndex(c => g.x > Math.min(c.x1, c.x2) && g.x < Math.max(c.x1, c.x2) && R.lz(g.z) > c.l1 && R.lz(g.z) < c.l2); },
  trapped(st, R, g){ const i = this.inCloset(R, g); return i >= 0 && !st.open[i]; },
  init(){ return { open: [1, 1, 1], done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){
    MODEL6.forEach((_, i) => { if (R.edge('m' + i)){ st.open[i] = st.open[i] ? 0 : 1; E.ev(st.open[i] ? 'door' : 'thud', st.open[i] ? '' : 'SLAM! A closet door shuts.'); } R.setDoor('c' + i, st.open[i]); });
    const n = this.s.filter(g => { const i = this.inCloset(R, g); return i >= 0 && !st.open[i]; }).length;
    st.n = n;
    if (!st.done && n >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'All three soldiers are shut in the dollhouse closets — the door opens!'); }
  },
  visual(dt, t, st){ spinKeys(this.s, dt); setOrbs(this.orbs, st.n || 0); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Shut a wind-up soldier in each of the 3 closets. Lure them in with a <b>decoy</b>, then step on the little door on the <b>model house</b> to slam the real one shut. (${st.n || 0}/3)`; }
};

/* =============================================================== */
const PIT7 = [-9.6, 3, 9.6, 19], JB7 = [[-5, 6.5], [3, 5.5], [7, 11], [-1, 10.5], [-6.5, 14.5], [2, 16.5], [6.5, 17.8], [-3, 18.8]];
const MB7 = [[-7.5, 8.5], [5.5, 8], [-3.5, 15.5], [8, 15.5]];
const ballpit = {
  name: 'The Ball Pit',
  floor: tiles,
  notes: [[0, 1.6, '“Something is buried under the balls. Ping to see what lurks.”', 1.5]],
  hint: 'Jack-in-the-boxes are buried in the ball pit — you can\'t see them, and you can\'t run in the balls. Click / tap the pit to PING: buried boxes near the ping light up for a few seconds. Decoys and thrown things still set them off from afar.',
  build(R, E){
    EE = E; const T = E.THREE;
    const tex = E.tiledTex(128, 128, (x, w, h) => { const C = ['#c83a3a', '#e8c25a', '#4a8ac8', '#5ab86a', '#c85ab8']; x.fillStyle = '#2a2a3a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++){ x.fillStyle = C[i % 5]; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 7, 0, 7); x.fill(); } }, 6, 6);
    R.floor(PIT7[0], PIT7[1], PIT7[2], PIT7[3], new T.MeshStandardMaterial({ map: tex, roughness: .5 }), .3);
    this.jm = jackMeshes(R, E, JB7);
    this.jm.forEach(m => { m.g.position.y = -.9; });
    this.orbs = orbRow(E, R, 4, -1.95, 20.8, 1.3, 2.2);
  },
  init(){ return { jk: JB7.map(() => [0, 0]), rv: JB7.map(() => 0), got: [0, 0, 0, 0], items: MB7.map(([x, lz], i) => mkItem('marble', x, lz, { n: i })), land: [] }; },
  solve(st){ st.got = [1, 1, 1, 1]; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ return k === 'marble' ? new E.THREE.Mesh(new E.THREE.SphereGeometry(.3, 14, 10), new E.THREE.MeshStandardMaterial({ color: 0xbfe6ff, metalness: .4, roughness: .05, emissive: 0x4a8aff, emissiveIntensity: .6, transparent: true, opacity: .9 })) : null; },
  onPick(st, R, E, it){ it.s = 3; st.got[it.n] = 1; E.ev('pick', `A glass marble! (${st.got.filter(Boolean).length}/4)`); return false; },
  onPing(st, R, E, idx, x, z){ JB7.forEach(([jx, jl], i) => { if (Math.hypot(jx - x, jl - R.lz(z)) < 6) st.rv[i] = 4; }); },
  onLand(st, R, E, it){ st.land.push([it.x, it.lz, .2]); },
  speed(st, R, E, idx){ const p = E.playerPos(idx); return p && inRect(R, p, PIT7[0], PIT7[1], PIT7[2], PIT7[3]) ? { mult: .55, noRun: true } : null; },
  host(dt, st, R, E){
    st.rv = st.rv.map(v => Math.max(0, v - dt)); st.land = st.land.filter(l => (l[2] -= dt) > 0);
    jackTick(dt, st, R, E, JB7, (i, x, lz) => st.land.some(([a, b]) => Math.hypot(a - x, b - lz) < JK.trig + .6));
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All four marbles — the door opens!'); }
  },
  visual(dt, t, st, R, E){ jackVisual(this.jm, st, t); this.jm.forEach((m, i) => { const show = st.rv[i] > 0 || st.jk[i][0] > 0; m.g.position.y += ((show ? (st.jk[i][0] === 2 ? 0 : -.55) : -.9) - m.g.position.y) * E.damp(8, dt); m.ring.material.opacity = Math.max(m.ring.material.opacity, st.rv[i] > 0 ? .25 : 0); }); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 4 glass marbles in the ball pit. Jack-in-the-boxes are <b>buried</b> — <b>click / tap</b> the pit to ping and reveal them. You can't run in the balls! (${st.got.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const GP8 = [[-6.5, 16], [0, 7], [6.5, 16]], CR8 = [[-9, 2], [0, 21], [9, 2]];
const PATH8 = [[[-7, 4], [-7, 11], [-2, 11], [-2, 4]], [[2, 12], [2, 19], [-2, 19], [-2, 12]], [[7, 4], [7, 11], [3, 11], [3, 4]]];
const SPRING8 = 9;
const parade = {
  name: 'The Clockwork Parade',
  floor: tiles,
  notes: [[3, 1.4, '“A soldier stops dead when its spring runs down. Make each one stop on a gear.”', 1.5]],
  hint: 'Each soldier has its own winding key (gold pad). Winding it gives it ~9 seconds of march. A soldier follows a decoy lantern, and stops for good wherever its spring runs out. So: wind a soldier, wait a few seconds, then drop a decoy on its gear plate — it walks there, waits by the lantern, and winds down ON the gear. All three gears at once!',
  build(R, E){
    EE = E; const T = E.THREE;
    GP8.forEach(([x, lz], i) => R.plate('g' + i, x, lz, 0xe8c25a, 1.8, '⚙'));
    CR8.forEach(([x, lz], i) => R.plate('k' + i, x, lz, 0xffd34a, 1.2, '🔑'));
    this.s = PATH8.map((path, i) => soldier(R, E, { path, sp: 2.1, tint: [0xc83a3a, 0x3a6ac8, 0x3a9a4a][i], b: [-10, 10, .5, 21.5], noCollide: true, halt: (g, st) => !(st.sp[i] > 0), harmless: (g, st) => !(st.sp[i] > 0) }));
    this.keys = this.s.map((g, i) => { const k = g.keyMesh; k.scale.setScalar(1.6); return k; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.6);
  },
  init(){ return { sp: [0, 0, 0], done: 0 }; },
  solve(st){ st.done = 1; },
  occupants(st, R){ return this.s.map(g => ({ x: g.x, z: g.z })); },
  host(dt, st, R, E){
    if (st.done) return;
    CR8.forEach((_, i) => { if (R.edge('k' + i)){ st.sp[i] = SPRING8; E.ev('tick', `Soldier ${['Ⅰ', 'Ⅱ', 'Ⅲ'][i]} is wound up!`); } });
    st.sp = st.sp.map(v => Math.max(0, +(v - dt).toFixed(3)));
    const on = GP8.map((_, i) => this.s.some(g => Math.abs(g.x - GP8[i][0]) < .9 && Math.abs(R.lz(g.z) - GP8[i][1]) < .9) && this.s.every((g, k) => !(st.sp[k] > 0) || !(Math.abs(g.x - GP8[i][0]) < .9 && Math.abs(R.lz(g.z) - GP8[i][1]) < .9)));
    st.on = on.filter(Boolean).length;
    if (on.every(Boolean)){ st.done = 1; R.open('exit'); E.ev('door', 'Three soldiers stand still on three gears — the parade is over and the door opens!'); }
  },
  visual(dt, t, st){ this.s.forEach((g, i) => { if (st.sp[i] > 0) g.keyMesh.rotation.z += dt * 8; }); setOrbs(this.orbs, st.on || 0); },
  bar(st, R, E){ let best = -1, bd = 3.5; this.s.forEach((g, i) => { const d = Math.hypot(g.x - E.me.pos.x, g.z - E.me.pos.z); if (d < bd && st.sp[i] > 0){ bd = d; best = i; } }); return best < 0 ? null : { frac: st.sp[best] / SPRING8, label: 'Spring', color: '#e8c25a' }; },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Park a <b>wound-down</b> soldier on each ⚙ gear. 🔑 pads wind a soldier up (~9s of marching); soldiers follow <b>decoys</b> and stop dead where their spring runs out. Wound soldiers freeze you! (${st.on || 0}/3)`; }
};

/* =============================================================== */
const MC9 = 8, MR9 = 7, MX9 = c => -8.75 + c * 2.5, ML9 = r => 2.25 + r * 2.5;
const MW9 = [[1, 1], [3, 1], [5, 1], [6, 1], [1, 2], [3, 3], [4, 3], [6, 3], [0, 4], [1, 4], [6, 4], [3, 5], [4, 5], [1, 6], [5, 6]];
const MICE9 = [[7, 2], [2, 3], [5, 5], [2, 6]], CH9 = [[7, 3], [0, 2], [7, 6]];
const mwall9 = (c, r) => c < 0 || r < 0 || c >= MC9 || r >= MR9 || MW9.some(([a, b]) => a === c && b === r);
const mice = {
  name: 'The Mouse Maze',
  floor: tiles,
  notes: [[-3, 1.4, '“Wind-up mice: they see along straight lines and they never stop until they hit a wall.”', 1.5]],
  hint: 'A mouse sitting at home looks straight up, down, left and right. If you (or a lantern) are in its line of sight, it zooms along that line until it hits a wall — then it has to wind back up and trundle home. Bait them with decoys, or cross their lines while they\'re away. Collect the 3 cheeses.',
  build(R, E){
    EE = E; const T = E.THREE;
    MW9.forEach(([c, r]) => R.block(MX9(c) - 1.2, ML9(r) - 1.2, MX9(c) + 1.2, ML9(r) + 1.2, 1.6, E.tex('workshop_boards', { color: 0x8a5a3a, tile: 1.6 })));
    R.block(-10, 18.5, -1.2, 19, 2.4, E.mat(0x6a4a2a)); R.block(1.2, 18.5, 10, 19, 2.4, E.mat(0x6a4a2a));
    this.mm = MICE9.map(() => { const g = new T.Group(); const b = new T.Mesh(new T.SphereGeometry(.45, 12, 8), E.mat(0x9a9aa4, { metalness: .6 })); b.scale.set(1, .7, 1.5); b.position.y = .35; g.add(b); for (const s of [-1, 1]){ const ear = new T.Mesh(new T.CircleGeometry(.2, 10), E.mat(0xe8a0b0, { side: T.DoubleSide })); ear.position.set(s * .25, .75, .35); g.add(ear); } const tail = new T.Mesh(new T.TorusGeometry(.25, .04, 4, 8, Math.PI * 1.4), E.mat(0xe8a0b0)); tail.position.set(0, .3, -.7); g.add(tail); const k = new T.Mesh(new T.TorusGeometry(.18, .04, 6, 10), E.mat(0xd4af37)); k.position.set(0, .8, -.3); g.add(k); g.userData.k = k; E.scene.add(g); return g; });
    this.cm = CH9.map(([c, r]) => { const m = new T.Mesh(new T.CylinderGeometry(.45, .45, .35, 3), E.mat(0xffd34a)); R.place(m, MX9(c), ML9(r), .3); return m; });
  },
  init(){ return { m: MICE9.map(([c, r]) => ({ x: MX9(c), l: ML9(r), s: 0, t: 0, d: [0, 0] })), got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  sees(c0, r0, tc, tr){ if (c0 !== tc && r0 !== tr) return null; const dc = Math.sign(tc - c0), dr = Math.sign(tr - r0); if (!dc && !dr) return [0, 0]; let c = c0 + dc, r = r0 + dr; while (!(c === tc && r === tr)){ if (mwall9(c, r)) return null; c += dc; r += dr; } return [dc, dr]; },
  cell(x, lz){ const c = Math.round((x - MX9(0)) / 2.5), r = Math.round((lz - ML9(0)) / 2.5); return [c, r]; },
  host(dt, st, R, E){
    st.m.forEach((m, i) => {
      const [hc, hr] = MICE9[i];
      if (m.s === 0){
        const targets = [...E.P.filter(p => !p.frozen && R.inside(p.pos)).map(p => [p.pos.x, R.lz(p.pos.z)]), ...E.S.decoys.map(d => [d.x, R.lz(d.z)])];
        for (const [x, lz] of targets){ const [tc, tr] = this.cell(x, lz); if (Math.abs(x - MX9(tc)) > 1.25 || Math.abs(lz - ML9(tr)) > 1.25) continue; const dir = this.sees(hc, hr, tc, tr); if (dir && (dir[0] || dir[1]) && Math.hypot(tc - hc, tr - hr) <= 6){ m.s = 1; m.d = dir; E.ev('whoosh'); break; } }
      } else if (m.s === 1){
        const nx = m.x + m.d[0] * 11 * dt, nl = m.l + m.d[1] * 11 * dt; const [c, r] = this.cell(nx + m.d[0] * .9, nl + m.d[1] * .9);
        if (mwall9(c, r)){ const [cc, rr] = this.cell(m.x, m.l); m.x = MX9(cc); m.l = ML9(rr); m.s = 2; m.t = 3; E.ev('thud'); }
        else { m.x = +nx.toFixed(3); m.l = +nl.toFixed(3); }
      } else if (m.s === 2){ m.t -= dt; if (m.t <= 0) m.s = 3; }
      else { const tx = MX9(hc), tl = ML9(hr), dx = tx - m.x, dl = tl - m.l, d = Math.hypot(dx, dl); if (d < .05){ m.s = 0; m.x = tx; m.l = tl; } else { const s = Math.min(d, 2.4 * dt); m.x += dx / d * s; m.l += dl / d * s; } }
      if (m.s === 1 || m.s === 3) for (const p of E.P) if (!p.frozen && !p.dashing && R.inside(p.pos) && Math.hypot(p.pos.x - m.x, R.lz(p.pos.z) - m.l) < .9){ E.freeze(p.idx, E.FREEZE, `A wind-up mouse ran into ${E.names()[p.idx]}!`); }
    });
    CH9.forEach(([c, r], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && Math.abs(p.pos.x - MX9(c)) < .9 && Math.abs(R.lz(p.pos.z) - ML9(r)) < .9)){ st.got[i] = 1; E.ev('pick', `Cheese! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All the cheese — the mouse maze door opens!'); }
  },
  visual(dt, t, st, R, E){ this.mm.forEach((g, i) => { const m = st.m[i]; g.position.set(m.x, 0, R.Z(m.l)); if (m.s === 1) g.rotation.y = Math.atan2(m.d[0], -m.d[1]); g.userData.k.rotation.z += dt * (m.s === 2 ? 14 : 3); }); this.cm.forEach((m, i) => m.visible = !st.got[i]); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 cheeses. <b>Wind-up mice</b> zoom along any straight line where they see you (or a lantern) until they hit a wall. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const JB10 = [[-5.5, 7], [5.5, 7], [-5.5, 16], [5.5, 16]];
const toymaker = {
  name: 'The Toymaker',
  floor: tiles,
  notes: [[0, 1.6, '“He made every toy in this factory. Let his own toys teach him a lesson.”', 1.4]],
  hint: 'The Toymaker can\'t be stunned by light, but his jack-in-the-boxes hit HIM too. Get him next to a box when it pops: lead him there yourself (and dash out of the ring!), or drop a decoy by a box — he can\'t resist walking to a lantern. Three hits!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.jm = jackMeshes(R, E, JB10, 1.2);
    this.boss = R.ghost({ home: [0, 18], look: 'hat', tint: 0x6a3a8a, scale: 1.8, sp: 0, flashImmune: true, label: 'the Toymaker', gone: st => st.done, think: (g, dt, st, R2, E2, P) => {
      if (g.mem.stun > 0){ g.mem.stun -= dt; g.y = Math.sin(E2.elapsed * 20) * .1; return true; }
      let tx = null, tz = null; let bd = 99;
      for (const d of E2.S.decoys){ const dd = Math.hypot(d.x - g.x, d.z - g.z); if (dd < 12 && dd < bd){ bd = dd; tx = d.x; tz = d.z; } }
      if (tx === null){ for (const p of E2.targetsOf(g, P)){ const dd = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (dd < bd){ bd = dd; tx = p.pos.x; tz = p.pos.z; } } }
      if (tx !== null && bd > .6) E2.stepToward(g, tx, tz, (1.9 + st.hits * .35) * E2.GMULT, dt);
      E2.resolve(g, E2.staticRects());
      E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), 1.4);
      return true;
    } });
    this.squads = [0, 1, 2, 3].map(k => soldier(R, E, { path: k % 2 ? [[-8.5, 3 + k * 4], [8.5, 3 + k * 4]] : [[8.5, 4 + k * 4], [-8.5, 4 + k * 4]], sp: 2.3, b: [-10, 10, .5, 21.5], gone: st => st.done || st.hits < Math.ceil((k + 1) / 2), noCollide: true }));
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 3);
  },
  init(){ return { jk: JB10.map(() => [0, 0]), hits: 0, done: 0 }; },
  solve(st){ st.hits = 3; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    const b = this.boss;
    jackTick(dt, st, R, E, JB10, (i, x, lz) => Math.hypot(b.x - x, R.lz(b.z) - lz) < JK.trig - 1.2, (i, x, lz) => {
      if (!(b.mem.stun > 0) && Math.hypot(b.x - x, R.lz(b.z) - lz) < JK.pop + .4){ st.hits++; b.mem.stun = 3; E.ev('boom', st.hits < 3 ? `POP! The Toymaker gets a jack-in-the-box right in the face! (${st.hits}/3) — more soldiers march in!` : ''); if (st.hits >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Toymaker falls apart like a broken toy! The factory doors open.'); } }
    });
  },
  visual(dt, t, st){ jackVisual(this.jm, st, t); spinKeys(this.squads, dt); setOrbs(this.orbs, st.hits); },
  objective(st, R, E){ return st.done ? 'The Toymaker is broken — escape the factory!' : `Hit the <b>Toymaker</b> with his own jack-in-the-boxes 3 times: he must be next to a box when it POPS. He walks to decoy lanterns! (${st.hits}/3)`; }
};

export default {
  level: 12,
  // texture pack in tex/level12/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  wallImg: 'nursery_wall', trimImg: 'chipped_gold', texVer: 1,
  texFloors: {
    "The Wrapping Room": "wrap_checker",
    "Jack-in-the-Box Alley": "jack_harlequin",
    "The Conveyor Floor": "conveyor_rubber",
    "The Alphabet Blocks": "block_floor",
    "The Spinning Tops": "tops_rings",
    "The Dollhouse": "dollhouse_parquet",
    "The Ball Pit": "ballpit_mats",
    "The Clockwork Parade": "parade_tin",
    "The Mouse Maze": "mouse_boards",
    "The Toymaker": "workshop_boards"
  },
  title: 'The Toy Factory',
  tagline: 'The toys were never meant to be played with.<br>They were meant to play with YOU.',
  story: 'The machines still run. Tin soldiers march the aisles, the jack-in-the-boxes are wound tight, and somewhere the Toymaker is still at work.',
  winTitle: 'Playtime is over! 🧸',
  feature: { name: 'Decoy', icon: '🏮', how: '<b>Hold Space / ⚡</b> to drop a decoy lantern. Most enemies walk to it and guard it for a few seconds — and some things are set off by it. It recharges in 15 s.' },
  accent: '#e8c25a',
  wallColor: 0x4a2a3a,
  trimColor: 0xe8c25a,
  doorColor: 0x6a2a2a,
  lowColor: 0x8a5a3a,
  sky: 0xc89ab0,
  bg: 0x0a0608,
  drone: 44,
  rooms: [wrapping, alley, conveyor, blocks, tops, dollhouse, ballpit, parade, mice, toymaker],
};
