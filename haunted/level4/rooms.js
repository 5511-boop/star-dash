// Level 4 — The Sunken Lighthouse. New power: DASH. Local coords: x -10..10, lz 0 (south) .. 22 (north).
import { arrivals, orbRow, setOrbs, sign, waterMat, plankMat, near, inRect } from '../lib.js';

const sailor = (R, pts, sp = 2.2, extra = {}) => R.ghost({ home: pts[0], look: 'hat', tint: 0x6a9a9a, label: 'a drowned sailor', cone: { len: 5, ang: .42, color: 0xfff1a0 }, sp, ...extra,
  think: (g, dt, st, R2, E, P) => E.AI.patrol(pts, sp, { cone: { len: 5, ang: .42 } })(g, dt, st, R2, E, P) });
const eel = (R, x, lz, extra = {}) => R.ghost({ home: [x, lz], look: 'small', tint: 0x4a8a3a, label: 'a moray eel', flat: true, ...extra });
const seaFloor = E => E.mat(0x173a44);

/* =============================================================== */
const PIER_SAFE = [[-2, 0, 2, 5], [-9.5, 8, 9.5, 11], [-9.5, 14, -5, 17], [5, 14, 9.5, 17], [-2, 14.5, 2, 22]];
const pier = {
  name: 'The Pier',
  floor: seaFloor,
  notes: [[0, 2.4, '“Too far to step. Not too far to DASH.”', 1.6]],
  hint: 'Run at the edge of a gap and dash — you fly over water while dashing. Each of you take one of the side towers and step on its lever.',
  build(R, E){
    R.floor(-10, 0, 10, 22, waterMat(E), .004);
    PIER_SAFE.forEach(([a, b, c, d]) => R.floor(a, b, c, d, plankMat(E), .02));
    R.plate('L', -7.25, 15.5, 0x4fd1c5, 1.6, '⚓'); R.plate('R', 7.25, 15.5, 0x4fd1c5, 1.6, '⚓');
  },
  init(){ return { l: 0, r: 0, done: 0 }; },
  solve(st){ st.l = st.r = st.done = 1; },
  pits(st, R){ return [R.rect(-10.5, 0, 10.5, 22)]; },
  bridges(st, R){ return PIER_SAFE.map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  host(dt, st, R, E){
    if (!st.l && R.held('L')){ st.l = 1; E.ev('chime', 'West anchor lever pulled!', 1); }
    if (!st.r && R.held('R')){ st.r = 1; E.ev('chime', 'East anchor lever pulled!', 2); }
    if (!st.done && st.l && st.r){ st.done = 1; R.open('exit'); E.ev('door', 'The lighthouse door unbolts!'); }
  },
  visual(dt, t, st, R){ R.glow('L', st.l ? 1.4 : .5); R.glow('R', st.r ? 1.4 : .5); },
  objective(st, R, E){
    if (st.done) return 'The door is open — onward!';
    return `Gaps in the pier are too wide to walk. <b>Tap ⚡ / Space to DASH</b> over them. Pull both anchor levers on the side towers. (${st.l + st.r}/2)`;
  }
};

/* =============================================================== */
const TIDE = { period: 17, low: 8 };
const tide = {
  name: 'Tide Pools',
  floor: E => E.mat(0xc8b48a),
  notes: [[3, 2.2, '“The sea comes back every few seconds. Stay on the rocks when it does.”', 1.6]],
  hint: 'Wait on the rock path for low tide, then run out to the two valves together. Dash past the eels hiding in the sand. Get back to the rocks before the tide returns.',
  init(){ return { t: 0, high: 0, done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return st.high ? [R.rect(-10.5, 4, 10.5, 22)] : []; },
  bridges(st, R){ return [R.rect(-1.5, 4, 1.5, 22)]; },
  host(dt, st, R, E){
    st.t = (st.t + dt) % TIDE.period;
    const high = st.t >= TIDE.low ? 1 : 0;
    if (high && !st.high) E.ev('splash', 'The tide rushes in!');
    if (!high && st.high) E.ev('splash', 'Low tide — go!');
    st.high = high;
    if (!st.done && !st.high && R.held('VL') && R.held('VR')){ st.done = 1; R.open('exit'); E.ev('door', 'Both valves turned — the sea gate opens!'); }
  },
  visual(dt, t, st, R, E){ this.water.material.opacity = st.high ? .92 : .0; this.water.visible = !!st.high || st.t > TIDE.low - .4; if (!st.high && st.t > TIDE.low - 2){ this.water.visible = true; this.water.material.opacity = .25 + Math.sin(t * 10) * .15; } },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; const low = !st.high; const rem = low ? TIDE.low - st.t : TIDE.period - st.t; return { frac: rem / (low ? TIDE.low : TIDE.period - TIDE.low), label: low ? `Low tide — ${rem.toFixed(1)}s until the sea returns` : `High tide — ${rem.toFixed(1)}s`, color: low ? '#8affc1' : '#4a8aff' }; },
  objective(st, R, E){ return st.done ? 'The sea gate is open!' : 'Turn BOTH valves on the sand flats at the same time — only at low tide. Stay off the sand when the water comes back, and watch for eels.'; }
};

/* =============================================================== */
const CRATES3 = [[-6, 8.5], [0, 8.5], [6, 8.5], [-3, 13.5], [3, 13.5], [-8, 18], [8, 18], [0, 18.5]];
const watch = {
  name: "The Sailors' Watch",
  floor: E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#5a4028'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a3420'; for (let i = 0; i < 4; i++) x.fillRect(0, i * 16 + 14, w, 2); }, 8, 8) }),
  notes: [[-3, 2, '“The drowned crew still keeps watch. Their lanterns see far — but not through cargo.”', 1.6]],
  hint: 'Hide behind the crates while a sailor\'s lantern passes. You can also DASH straight through a lantern beam without being seen. The lever is in the top-left corner.',
  build(R, E){
    const T = E.THREE, cm = E.mat(0x7a5a32);
    for (const [x, lz] of CRATES3) R.block(x - 1.1, lz - .7, x + 1.1, lz + .7, 1.4, cm);
    R.plate('LV', -8.6, 20.6, 0x4fd1c5, 1.4, '⚓');
    sailor(R, [[-7.5, 6], [7.5, 6]], 2.3); sailor(R, [[7.5, 11], [-7.5, 11]], 2.3); sailor(R, [[-7.5, 16], [7.5, 16]], 2.5);
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && R.on('LV')){ st.done = 1; R.open('exit'); E.ev('door', 'Lever pulled — the hatch opens!'); } },
  objective(st, R, E){ return st.done ? 'The hatch is open — go!' : 'Sneak past the drowned sailors to the lever (top-left). Their lantern beams freeze you — hide behind crates or DASH through a beam.'; }
};

/* =============================================================== */
const BOAT = { y0: 6, y1: 16, hw: 1.6, hl: 2 };
const rowboat = {
  name: 'The Rowboat',
  floor: seaFloor,
  notes: [[3, 2.2, '“Left oar, right oar, left oar… row together or drift back.”', 1.6]],
  hint: 'Stand in the boat and step on the oars ALTERNATELY — left, right, left, right. It\'s easiest with one of you on each oar taking turns. Stop rowing and the current drags you back.',
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 4, 10, 18, waterMat(E), .004);
    R.floor(-10, 0, 10, 4, plankMat(E), .02); R.floor(-10, 18, 10, 22, plankMat(E), .02);
    const g = new T.Group();
    const hull = new T.Mesh(new T.BoxGeometry(BOAT.hw * 2, .4, BOAT.hl * 2), E.mat(0x7a4a22)); hull.position.y = .15; g.add(hull);
    for (const s of [-1, 1]){ const side = new T.Mesh(new T.BoxGeometry(.15, .6, BOAT.hl * 2), E.mat(0x5a3418)); side.position.set(s * BOAT.hw, .4, 0); g.add(side); }
    this.oars = [-1, 1].map(s => { const o = new T.Mesh(new T.BoxGeometry(2.4, .1, .25), E.mat(0xb08850)); o.position.set(s * 2.2, .4, 0); g.add(o); const pad = new T.Mesh(new T.CylinderGeometry(.45, .45, .06, 16), E.glow(0x4fd1c5, .6)); pad.position.set(s * 1, .38, 0); g.add(pad); return { o, pad }; });
    this.boat = R.place(g, 0, BOAT.y0, 0);
  },
  init(){ return { blz: BOAT.y0, v: 0, last: 0, arr: 0 }; },
  solve(st){ st.blz = BOAT.y1; st.arr = 1; },
  pits(st, R){ return [R.rect(-10.5, 4, 10.5, 18)]; },
  bridges(st, R){ return [R.rect(-BOAT.hw, st.blz - BOAT.hl, BOAT.hw, st.blz + BOAT.hl)]; },
  host(dt, st, R, E){
    const L = R.local; L.prev = L.prev || [0, 0];
    const aboard = E.P.filter(p => inRect(R, p.pos, -BOAT.hw, st.blz - BOAT.hl, BOAT.hw, st.blz + BOAT.hl));
    for (const p of E.P){
      const lz = R.lz(p.pos.z), oar = aboard.includes(p) && Math.abs(lz - st.blz) < .7 ? (Math.abs(p.pos.x + 1) < .55 ? -1 : Math.abs(p.pos.x - 1) < .55 ? 1 : 0) : 0;
      if (oar && oar !== L.prev[p.idx] && oar !== st.last){ st.last = oar; st.v = Math.min(3, st.v + 1.5); E.ev('splash'); }
      L.prev[p.idx] = oar;
    }
    st.v = Math.max(0, st.v - dt * .9);
    const cur = aboard.length ? .45 : 1.6;
    if (!st.arr) st.blz = E.clamp(st.blz + (st.v - cur) * dt, BOAT.y0, BOAT.y1);
    if (!st.arr && st.blz >= BOAT.y1 - .01){ st.arr = 1; R.open('exit'); E.ev('door', 'Land ho! The boat bumps the far dock.'); }
  },
  local(dt, st, R, E){
    const L = R.local, prev = L.lb ?? st.blz;
    if (Math.abs(st.blz - prev) > 1e-4 && inRect(R, E.me.pos, -BOAT.hw - .1, prev - BOAT.hl - .1, BOAT.hw + .1, prev + BOAT.hl + .1)) E.me.pos.z -= (st.blz - prev);
    L.lb = st.blz;
  },
  visual(dt, t, st, R, E){
    this.boat.position.z = R.Z(st.blz); this.boat.rotation.z = Math.sin(t * 1.3) * .03;
    this.oars.forEach(({ o, pad }, i) => { o.rotation.y = Math.sin(t * 2 + i) * .1 + (st.last === (i ? 1 : -1) ? .35 : 0) * (i ? -1 : 1); pad.material.emissiveIntensity = st.last === (i ? 1 : -1) ? .2 : 1; });
  },
  bar(st, R, E){ if (st.arr || !R.inside(E.me.pos)) return null; return { frac: (st.blz - BOAT.y0) / (BOAT.y1 - BOAT.y0), label: 'Distance to the far dock', color: '#4fd1c5' }; },
  objective(st, R, E){ return st.arr ? 'Made it across!' : 'Climb into the rowboat. Step on the glowing oar pads ALTERNATELY (left, right, left…) to row. Stop and the current pulls you back.'; }
};

/* =============================================================== */
const TILT = { N: 7, posts: [[0, 2], [0, 5], [1, 6], [2, 0], [4, 3], [5, 3]], holes: [[0, 6], [1, 5], [3, 3]], crates: [[6, 6], [6, 5], [5, 1]] };
const tcx = c => -6 + 2 * c, tcl = r => 5 + 2 * r;
function tiltSlide(crates, d){
  const [dx, dy] = { E: [1, 0], W: [-1, 0], N: [0, 1], S: [0, -1] }[d];
  const cs = crates.map(c => c ? c.slice() : null); let moved = true;
  while (moved){
    moved = false;
    cs.forEach((c, i) => {
      if (!c) return; const n = [c[0] + dx, c[1] + dy];
      if (n[0] < 0 || n[0] >= TILT.N || n[1] < 0 || n[1] >= TILT.N) return;
      if (TILT.posts.some(p => p[0] === n[0] && p[1] === n[1])) return;
      if (cs.some(o => o && o[0] === n[0] && o[1] === n[1])) return;
      cs[i] = n; moved = true;
      if (TILT.holes.some(h => h[0] === n[0] && h[1] === n[1])) cs[i] = null;
    });
  }
  return cs;
}
const SIDES = { W: [[-8.5, 8], [-8.5, 14]], E: [[8.5, 8], [8.5, 14]], S: [[-3, 2], [3, 2]], N: [[-3, 20], [3, 20]] };
const deck = {
  name: 'The Listing Deck',
  floor: E => E.mat(0x4a3826),
  notes: [[0, 1.6, '“Lean the ship together and the cargo will slide.”', 1.4]],
  hint: 'Both of you stand on the two plates on the SAME side of the deck — the whole deck tips that way and every crate slides until it hits something. Plan the order of tilts to drop all three crates into the hatches. The red lever resets.',
  build(R, E){
    const T = E.THREE, rail = E.mat(0x8a6a42);
    R.block(-7.3, 3.7, 7.3, 4, .6, rail); R.block(-7.3, 18, 7.3, 18.3, .6, rail); R.block(-7.3, 3.7, -7, 18.3, .6, rail); R.block(7, 3.7, 7.3, 18.3, .6, rail);
    for (const [c, r] of TILT.posts){ const p = new T.Mesh(new T.CylinderGeometry(.55, .6, 1.2, 12), E.mat(0x6a4a2a)); R.place(p, tcx(c), tcl(r), .6);
      const coil = new T.Mesh(new T.TorusGeometry(.72, .1, 8, 20), E.tex('rope', { color: 0x9a8058, rx: 6, ry: 1 })); coil.rotation.x = Math.PI / 2; R.place(coil, tcx(c), tcl(r), .1); }
    for (const [c, r] of TILT.holes){ R.floor(tcx(c) - .95, tcl(r) - .95, tcx(c) + .95, tcl(r) + .95, new T.MeshBasicMaterial({ color: 0x050302 }), .02); }
    this.crates = TILT.crates.map(() => { const m = new T.Mesh(new T.BoxGeometry(1.7, 1.2, 1.7), E.mat(0x9a7442)); E.scene.add(m); return m; });
    for (const [s, ps] of Object.entries(SIDES)) ps.forEach((p, i) => R.plate(s + i, p[0], p[1], 0x4fd1c5, 1.5, { W: '◀', E: '▶', S: '▼', N: '▲' }[s]));
    R.plate('RS', -8.5, 20.5, 0xff5050, 1.3, '↺');
    this.deckG = new T.Group(); R.place(this.deckG, 0, 11, 0);
  },
  init(){ return { cr: TILT.crates.map(c => c.slice()), done: 0, moves: 0 }; },
  solve(st){ st.cr = [null, null, null]; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    if (R.edge('RS')){ st.cr = TILT.crates.map(c => c.slice()); st.moves = 0; E.ev('thud', 'The cargo slides back into place.'); return; }
    for (const [s] of Object.entries(SIDES)){
      const a = R.held(s + '0'), b = R.held(s + '1');
      const go = E.solo() ? (R.edge(s + '0') || R.edge(s + '1')) : (a && b && (R.edge(s + '0') || R.edge(s + '1')));
      if (go){
        st.cr = tiltSlide(st.cr, s); st.moves++; R.local.tilt = s; R.local.tiltT = .6; E.ev('thud', '');
        if (st.cr.every(c => !c)){ st.done = 1; R.open('exit'); E.ev('door', 'All the cargo is in the hold! The hatch opens.'); }
      }
    }
  },
  visual(dt, t, st, R, E){
    st.cr.forEach((c, i) => { const m = this.crates[i]; if (!c){ m.position.y += (-1.5 - m.position.y) * E.damp(4, dt); return; } m.position.x += (tcx(c[0]) - m.position.x) * E.damp(9, dt); const z = R.Z(tcl(c[1])); m.position.z += (z - m.position.z) * E.damp(9, dt); m.position.y = .6; });
    for (const s of Object.keys(SIDES)) for (const i of [0, 1]) R.glow(s + i, R.on(s + i) ? 1.4 : .45);
  },
  objective(st, R, E){
    if (st.done) return 'All cargo is in the hold!';
    const left = st.cr.filter(Boolean).length;
    return E.solo() ? `Step on a ◀▶▲▼ plate to tip the deck that way — every crate slides until it hits something. Drop all 3 crates into the dark hatches. (${3 - left}/3) · red ↺ resets`
      : `Lean the ship TOGETHER: both stand on the two plates on one side to tip the deck — every crate slides until it hits something. Drop all 3 crates into the hatches. (${3 - left}/3) · red ↺ resets`;
  }
};

/* =============================================================== */
const EELS6 = [[-4, 6, 'W'], [-4, 10.5, 'W'], [-4, 15, 'W'], [4, 8, 'E'], [4, 12.5, 'E'], [4, 17, 'E']];
const BAITS = { W: ['BWs', 'BWn'], E: ['BEs', 'BEn'] };
const alley = {
  name: 'Eel Alley',
  floor: seaFloor,
  notes: [[0, 1.8, '“Eels can\'t resist a fish head. Feed one wall, run past the other.”', 1.6]],
  hint: 'Standing on a fish-bucket plate keeps the eels on THAT side busy eating. One of you feeds one side while the other runs up the alley, dashing past the eels on the other side. Then swap at the far end.',
  build(R, E){
    R.wall(-10, 3, -4.3, 18); R.wall(4.3, 3, 10, 18);
    R.plate('BWs', -7, 1.6, 0xd08a4a, 1.6, '🐟'); R.plate('BEs', 7, 1.6, 0xd08a4a, 1.6, '🐟');
    R.plate('BWn', -7, 20, 0xd08a4a, 1.6, '🐟'); R.plate('BEn', 7, 20, 0xd08a4a, 1.6, '🐟');
    const T = E.THREE;
    for (const [x, lz, side] of EELS6){
      const hole = new T.Mesh(new T.CircleGeometry(.6, 16), new T.MeshBasicMaterial({ color: 0x050302 })); hole.rotation.y = side === 'W' ? Math.PI / 2 : -Math.PI / 2; R.place(hole, x + (side === 'W' ? .02 : -.02), lz, .7);
      const lunge = E.AI.lunger(4.6, 12, 1.2);
      eel(R, x + (side === 'W' ? .5 : -.5), lz, { think: (g, dt, st, R2, E2, P) => { if (BAITS[side].some(b => R2.held(b))){ g.mem.st = null; E2.stepToward(g, g.home[0], g.home[1], 6, dt); return true; } return lunge(g, dt, st, R2, E2, P); } });
    }
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && E.P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 18.6)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the alley! The far door creaks open.'); } },
  objective(st, R, E){
    const fed = ['W', 'E'].filter(s => BAITS[s].some(b => R.on(b))).map(s => s === 'W' ? 'left' : 'right');
    return `Eels lunge from the walls. A fish-bucket plate keeps that side's eels busy. Feed one side, dash past the other. ${fed.length ? `<b>${fed.join(' & ')} eels are eating.</b>` : ''}`;
  }
};

/* =============================================================== */
// bilge: tiles flood when the water is above their height; a path of slightly higher tiles leads north
const BIL_PATH = [[4, 0], [4, 1], [3, 1], [2, 1], [2, 2], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [5, 5], [4, 5], [4, 6], [4, 7]];
const bilge = {
  name: 'The Bilge',
  floor: E => E.mat(0x2a2620),
  notes: [[0, 1.6, '“The pumps only work when both are cranked at once.”', 1.4]],
  hint: 'Two pumps must be held at the same time until they clank — that lowers the water. Repeat until the winding plank path shows, then run across before the water rises. If one of you gets across alone, there\'s a third pump on the far side so you can still pump together.',
  build(R, E){
    const T = E.THREE;
    this.tiles = [];
    for (let c = 0; c < 10; c++) for (let r = 0; r < 8; r++){
      const onPath = BIL_PATH.some(([a, b]) => a === c && b === r);
      const m = R.floor(-10 + c * 2 + .05, 3 + r * 2 + .05, -8 + c * 2 - .05, 5 + r * 2 - .05, E.mat(onPath ? 0x8a6a42 : 0x4a3a2a), .012);
      this.tiles.push({ m, c, r, onPath });
    }
    this.water = R.floor(-10, 3, 10, 19, waterMat(E), .03);
    R.plate('PA', -7.5, 1.6, 0xb0b0c0, 1.6, '⇵'); R.plate('PB', 7.5, 1.6, 0xb0b0c0, 1.6, '⇵'); R.plate('PN', 7.5, 20.6, 0xb0b0c0, 1.4, '⇵');
  },
  init(){ return { w: .95, armed: 1, hold: 0, done: 0 }; },
  solve(st){ st.w = 0; st.done = 1; },
  height(c, r){ return BIL_PATH.some(([a, b]) => a === c && b === r) ? .55 : .3; },
  pits(st, R){
    const out = [];
    for (let c = 0; c < 10; c++) for (let r = 0; r < 8; r++) if (st.w > this.height(c, r)) out.push(R.rect(-10 + c * 2, 3 + r * 2, -8 + c * 2, 5 + r * 2));
    return out;
  },
  host(dt, st, R, E){
    if (st.done) return;
    if (E.P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.2)){ st.done = 1; R.open('exit'); E.ev('door', 'You reached the dry deck!'); return; }
    st.w = Math.min(.95, st.w + dt * .015);
    const both = ['PA', 'PB', 'PN'].filter(n => R.held(n)).length >= 2;
    if (!both) st.armed = 1;
    if (both && st.armed){ st.hold += dt; if (st.hold > 1.2){ st.hold = 0; st.armed = E.solo() ? 1 : 0; st.w = Math.max(.4, st.w - .17); E.ev('thud', 'CLANK — the pumps gulp water!'); } }
    else st.hold = Math.max(0, st.hold - dt);
  },
  visual(dt, t, st, R, E){
    this.water.position.y = .03; this.water.material.opacity = .25 + st.w * .67;
    for (const T of this.tiles) T.m.visible = st.w <= this.height(T.c, T.r) + .02;
  },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; return { frac: st.w, label: st.hold > 0 ? 'Pumping…' : `Water level ${(st.w * 100) | 0}%`, color: '#4a8aff' }; },
  objective(st, R, E){ return st.done ? 'You made it across the bilge!' : `The bilge is flooded and the water keeps rising. ${E.solo() ? 'Stand on both pumps (one quickly after the other)' : 'Two of you stand on two pumps at once'} to pump. Lower it until a plank path shows, then cross!`; }
};

/* =============================================================== */
// six chambers; each valve flips which chambers are flooded. Valve layout searched so the best route takes 5 turns.
const CH = [[-10, 3, 0, 8.3], [0, 3, 10, 8.3], [-10, 8.3, 0, 13.6], [0, 8.3, 10, 13.6], [-10, 13.6, 0, 19], [0, 13.6, 10, 19]];
const VALVES = [[1, 7, 5, 5.6], [0, 14, -5, 5.6], [3, 45, 5, 11], [2, 12, -5, 11]];
const valves = {
  name: 'The Flood Valves',
  floor: E => E.mat(0x3a3a40),
  notes: [[0, 1.6, '“Each wheel floods some chambers and drains others. Think before you turn.”', 1.4]],
  hint: 'A valve only works if you can reach it on dry floor. Turning a valve can flood the very chamber you\'re standing in — that just sends you back to the entrance. Try: the right-bottom valve first.',
  build(R, E){
    const T = E.THREE;
    // walls with doorways
    R.wall(-10, 2.8, -6, 3.2); R.wall(-4, 2.8, 4, 3.2); R.wall(6, 2.8, 10, 3.2);
    R.wall(-10, 8.1, -6, 8.5); R.wall(-4, 8.1, 4, 8.5); R.wall(6, 8.1, 10, 8.5);
    R.wall(-10, 13.4, -6, 13.8); R.wall(-4, 13.4, 4, 13.8); R.wall(6, 13.4, 10, 13.8);
    R.wall(-10, 18.8, -6, 19.2); R.wall(-4, 18.8, 4, 19.2); R.wall(6, 18.8, 10, 19.2);
    R.wall(-.2, 3.2, .2, 4.8); R.wall(-.2, 6.6, .2, 9.8); R.wall(-.2, 11.9, .2, 15.1); R.wall(-.2, 17.2, .2, 18.8);
    this.waters = CH.map(([a, b, c, d]) => R.floor(a, b, c, d, waterMat(E), .03));
    VALVES.forEach(([ch, mask, x, lz], i) => {
      R.zone('v' + i, x, lz, 1.6);
      const w = new T.Mesh(new T.TorusGeometry(.6, .12, 8, 18), E.tex('buoy_stripes', { color: 0xc04040, rx: 4, ry: 1 })); w.rotation.x = Math.PI / 2; R.place(w, x, lz, .9); this['w' + i] = w;
      const post = new T.Mesh(new T.CylinderGeometry(.08, .08, .9, 6), E.mat(0x6a6a72)); R.place(post, x, lz, .45);
    });
    this.labels = ['A', 'B', 'C', 'D'];
  },
  init(){ return { fl: 57, turns: 0 }; },
  solve(st){ st.fl = 20; },
  pits(st, R){ return CH.filter((c, i) => st.fl >> i & 1).map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  host(dt, st, R, E){
    VALVES.forEach(([ch, mask], i) => { if (R.edge('v' + i) && !(st.fl >> ch & 1)){ st.fl ^= mask; st.turns++; E.ev('splash', 'Gurgle… the water shifts between chambers.'); } });
    if (!R.isOpen('exit') && !(st.fl >> 4 & 1 && st.fl >> 5 & 1)) R.open('exit');
  },
  visual(dt, t, st, R, E){ this.waters.forEach((w, i) => { const on = st.fl >> i & 1; w.visible = true; w.material.opacity = .92; w.visible = !!on; }); VALVES.forEach((v, i) => this['w' + i].rotation.z += dt * (R.on('v' + i) ? 4 : 0)); },
  objective(st, R, E){ return `Turn the red valve wheels to drain a dry route to the top chambers. Each wheel floods some chambers and drains others — and you can only reach wheels on dry floor. (turns: ${st.turns})`; }
};

/* =============================================================== */
const FOG_ROCKS = [[-6, 6], [4, 5], [-2, 10], [7, 10], [-7, 13], [2, 15], [-4, 18], [6, 17], [0, 7], [-8, 9]];
const BUOY_SPOTS = [[-8.5, 4], [8.5, 7], [-5, 15.5], [8.5, 14], [-8.5, 19.5], [4.5, 20], [0, 12.5], [-3, 7.5]];
const fog = {
  name: 'The Fog Banks',
  floor: seaFloor,
  notes: [[2.5, 1.6, '“Follow the bells. The louder the ring, the closer the buoy.”', 1.4]],
  hint: 'You can barely see — listen instead. Each buoy rings its bell (louder as you get closer) — one rings ONCE, one TWICE, one THREE times. Reach them in that order: 1, 2, 3. Touch one out of turn and they all go dark again. Split up and count, and avoid the sailor wandering in the mist.',
  build(R, E){
    const T = E.THREE;
    for (const [x, lz] of FOG_ROCKS) R.block(x - .9, lz - .9, x + .9, lz + .9, 1.3, E.mat(0x4a4a52));
    this.buoys = BUOY_SPOTS.map(([x, lz]) => {
      const g = new T.Group();
      const b = new T.Mesh(new T.CylinderGeometry(.45, .55, 1.2, 12), E.tex('buoy_stripes', { color: 0xc03030, rx: 1, ry: 1 })); b.position.y = .6; g.add(b);
      const s = new T.Mesh(new T.CylinderGeometry(.46, .46, .3, 12), E.mat(0xf0f0f0)); s.position.y = .7; g.add(s);
      const bell = new T.Mesh(new T.ConeGeometry(.25, .4, 10), E.mat(0xd4af37, { metalness: .8 })); bell.position.y = 1.5; g.add(bell);
      const l = new T.Mesh(new T.SphereGeometry(.12, 8, 6), E.glow(0xfff1a0, 2)); l.position.y = 1.9; g.add(l);
      g.visible = false; return R.place(g, x, lz);
    });
    R.ghost({ home: [6, 12], look: 'hat', tint: 0x6a9a9a, sp: 1.9, radius: 6, label: 'a drowned sailor' });
  },
  // buoy k rings k+1 times; they must be reached in order 1 → 2 → 3
  init(){ const idx = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - .5).slice(0, 3); return { b: idx, got: 0, done: 0, cd: 0 }; },
  solve(st){ st.got = 7; st.done = 1; },
  host(dt, st, R, E){
    st.cd = Math.max(0, st.cd - dt);
    const next = [1, 2, 4].filter(m => st.got & m).length;
    st.b.forEach((bi, k) => {
      if (st.got & (1 << k) || st.cd > 0) return; const [x, lz] = BUOY_SPOTS[bi];
      if (!E.P.some(p => !p.frozen && near(R, p, x, lz, 1.3))) return;
      if (k === next){ st.got |= 1 << k; E.ev('chime', `${['One', 'Two', 'Three'][k]} ring${k ? 's' : ''} — right! (${k + 1}/3)`, k + 1); }
      else { st.got = 0; st.cd = 2; E.ev('wrong', `That buoy rings ${k + 1} time${k ? 's' : ''} — out of turn! Every buoy goes dark. Start again from the one that rings ONCE.`); }
    });
    if (!st.done && st.got === 7){ st.done = 1; R.open('exit'); E.ev('door', 'The fog parts — the door is open!'); }
  },
  visual(dt, t, st, R, E){
    const inside = R.inside(E.me.pos), f = E.scene.fog;
    f.near += ((inside && !st.done ? 2 : 20) - f.near) * E.damp(2, dt); f.far += ((inside && !st.done ? 9 : 42) - f.far) * E.damp(2, dt);
    this.buoys.forEach((g, i) => { const k = st.b.indexOf(i); g.visible = k >= 0; if (k >= 0){ g.rotation.z = Math.sin(t * 1.5 + i) * .1; g.children[3].material.emissiveIntensity = st.got & (1 << k) ? .2 : 2; } });
    if (inside && !st.done){
      this._t = (this._t || 0) - dt;
      if (this._t <= 0){
        this._t = 3.4;
        // every buoy rings the same bell — buoy k rings k+1 times, each in its own slot of the cycle, so count them
        st.b.forEach((bi, k) => { if (st.got & (1 << k)) return; const [x, lz] = BUOY_SPOTS[bi]; const d = Math.hypot(E.me.pos.x - x, R.lz(E.me.pos.z) - lz); for (let j = 0; j <= k; j++) E.beep(988, .5, 'sine', .22 / (1 + (d / 3.5) ** 2), 0, [0, 1, 2.1][k] + j * .24); });
      }
    }
  },
  objective(st, R, E){ return st.done ? 'The fog is lifting — onward!' : `Thick fog! Three buoys ring once, twice and three times — reach them <b>in that order</b> (out of turn, they all go dark). The closer you are, the louder the bell. (${[1, 2, 4].filter(m => st.got & m).length}/3)`; }
};

/* =============================================================== */
const LAMP = { lz: 11, r0: 2, r1: 10.5, half: .32, spin: .55, need: 14 };
const lampRoom = {
  name: 'The Lamp Room',
  floor: E => E.mat(0x2a2e36),
  notes: [[0, 1.6, '“Stand in the light together while the lens turns.”', 1.4]],
  hint: 'The two light beams sweep around the lamp. Both of you need to be inside a beam at the same time to fill the bar — walk around the room with the beam and stay away from the sailors\' lanterns.',
  build(R, E){
    const T = E.THREE;
    R.block(-1.3, LAMP.lz - 1.3, 1.3, LAMP.lz + 1.3, 3, E.mat(0xd8d8e0));
    const lens = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 12), E.glow(0xfff6c0, 1.5)); R.place(lens, 0, LAMP.lz, 3.2);
    this.beams = [0, 1].map(() => { const m = new T.Mesh(new T.CircleGeometry(LAMP.r1, 20, -Math.PI / 2 - LAMP.half, LAMP.half * 2), new T.MeshBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: .32, depthWrite: false })); m.rotation.x = -Math.PI / 2; const g = new T.Group(); m.position.y = .06; g.add(m); return R.place(g, 0, LAMP.lz); });
    const ring = [[-6, 6], [6, 6], [6, 16], [-6, 16]];
    sailor(R, ring, 1.9); sailor(R, ring.slice(2).concat(ring.slice(0, 2)), 1.9);
  },
  init(){ return { a: 0, p: 0, done: 0 }; },
  solve(st){ st.p = LAMP.need; st.done = 1; },
  lit(st, R, pos){
    const dx = pos.x, dl = R.lz(pos.z) - LAMP.lz, d = Math.hypot(dx, dl);
    if (d < LAMP.r0 || d > LAMP.r1) return false;
    const ang = Math.atan2(dx, dl);
    return [st.a, st.a + Math.PI].some(a => { let x = (ang - a) % (Math.PI * 2); if (x > Math.PI) x -= Math.PI * 2; if (x < -Math.PI) x += Math.PI * 2; return Math.abs(x) < LAMP.half; });
  },
  host(dt, st, R, E){
    if (st.done) return;
    if (E.P.some(p => R.inside(p.pos))) st.a = (st.a + LAMP.spin * dt) % (Math.PI * 2);
    const all = E.P.length && E.P.every(p => R.inside(p.pos) && !p.frozen && this.lit(st, R, p.pos));
    st.p = all ? st.p + dt : Math.max(0, st.p - dt * .25);
    if (st.p >= LAMP.need){ st.done = 1; R.open('exit'); E.ev('door', 'The great lamp blazes! The lighthouse door opens to the sea.'); }
  },
  visual(dt, t, st, R, E){ this.beams.forEach((b, i) => { b.rotation.y = -(st.a + i * Math.PI); b.visible = !st.done; }); },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; return { frac: st.p / LAMP.need, label: this.lit(st, R, E.me.pos) ? 'You\'re in the light!' : 'Get into a beam!', color: '#fff6c0' }; },
  objective(st, R, E){ return st.done ? 'The lamp is lit — escape the lighthouse!' : `${E.solo() ? 'Stay' : 'BOTH stay'} inside the turning light beams to fill the bar. Dodge the sailors' lanterns.`; }
};

// wire up the lunging eels in the tide pools now that rooms can reach the AI library at build time
tide.build = function(R, E){
  const T = E.THREE;
  R.floor(-1.5, 4, 1.5, 22, E.mat(0x6a6a72), .015);
  this.water = R.floor(-10, 4, 10, 22, waterMat(E), .03);
  R.plate('VL', -8, 12, 0xffa040, 1.8, '◎'); R.plate('VR', 8, 12, 0xffa040, 1.8, '◎');
  for (const [x, lz] of [[-5, 4.6], [6, 19], [-7, 19.5], [5, 5]]){ const r = new T.Mesh(new T.DodecahedronGeometry(.8, 0), E.mat(0x5a5a62)); R.place(r, x, lz, .3); }
  for (const [x, lz] of [[-4.5, 15], [4.5, 15]]){ const lunge = E.AI.lunger(3.3, 10, 1.4); eel(R, x, lz, { think: (g, dt, st, R2, E2, P) => st.high ? (E2.stepToward(g, g.home[0], g.home[1], 5, dt), true) : lunge(g, dt, st, R2, E2, P) }); }
};

export default {
  level: 4,
  // texture pack in tex/level4/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'ring', tex: 'buoy_stripes', w: .9, y: 1.4, every: 7, color: 0xc04040, rx: 4 },   // wall dressing: life rings (engine wallDecor)
  wallImg: 'sea_wall', trimImg: 'verdigris', texVer: 1,
  texFloors: {
    "The Pier": "pier_boards",
    "Tide Pools": "tide_sand",
    "The Rowboat": "rowboat_planks",
    "The Listing Deck": "ship_deck",
    "Eel Alley": "eel_rocks",
    "The Bilge": "bilge_metal",
    "The Flood Valves": "valve_plates",
    "The Fog Banks": "fog_shingle",
    "The Lamp Room": "lamp_tread",
    "The Sailors' Watch": "jetty_boards"
  },
  title: 'The Sunken Lighthouse',
  tagline: 'The lighthouse went dark the night the ship went down.<br>The crew never left.',
  story: 'Salt water drips from every beam. Climb the lighthouse and relight the great lamp.',
  winTitle: 'The lighthouse shines again! 🌊',
  feature: { name: 'Dash', icon: '⚡', how: 'Tap <b>Space</b> (PC) or the <b>⚡ button</b> (phone) to burst forward. You can dash over short gaps of water and straight through ghosts.' },
  accent: '#4fd1c5',
  wallColor: 0x1f3a40,
  trimColor: 0x6a8a7a,
  doorColor: 0x2a3a3a,
  sky: 0x5a8aa8,
  drone: 46,
  rooms: [pier, tide, watch, rowboat, deck, alley, bilge, valves, fog, lampRoom],
};
