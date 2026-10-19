// Level 10 — The Mirror Palace. New power: SOUL SWAP (both press G / tap each other to trade places).
// Solo: G drops a soul anchor; G again jumps back to it and flips your soul colour (blue ⇄ pink).
// Enemies: Reflections — silver copies of you that MIRROR your moves.
import { orbRow, setOrbs, near, inRect } from '../lib.js';

let EE = null;
const BLUE = 0, PINK = 1, CNAME = ['blue', 'pink'];
const marble = E => E.mat(0xffffff, { roughness: .35, map: E.tiledTex(128, 128, (x, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ x.fillStyle = (i + j) % 2 ? '#d9d4e4' : '#3a3448'; x.fillRect(i * 32, j * 32, 32, 32); } x.strokeStyle = '#c8a24a'; x.lineWidth = 2; x.strokeRect(0, 0, w, h); }, 5, 5) });
const mirrorMat = E => E.mat(0xd8e4f4, { metalness: .95, roughness: .06, emissive: 0x334466, emissiveIntensity: .35 });
const goldMat = E => E.mat(0xd4af37, { metalness: .8, roughness: .3, emissive: 0x5a4210, emissiveIntensity: .4 });
const voidMat = E => new E.THREE.MeshBasicMaterial({ color: 0x05040a });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const rect = (R, x, lz, hw, hd = hw) => R.rect(x - hw, lz - hd, x + hw, lz + hd);
const solo = () => EE && EE.solo();

/* ---------- tinted soul-glass: blue souls pass blue glass, pink souls pass pink glass ---------- */
function glass(R, E, list, x1, lz1, x2, lz2, c, h = 2.6){
  const T = E.THREE, col = E.COLORS[c];
  const m = new T.Mesh(new T.BoxGeometry(Math.abs(x2 - x1), h, Math.abs(lz2 - lz1)), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .45, transparent: true, opacity: .3, depthWrite: false }));
  R.place(m, (x1 + x2) / 2, (lz1 + lz2) / 2, h / 2);
  const rim = new T.Mesh(new T.BoxGeometry(Math.abs(x2 - x1) + .02, .08, Math.abs(lz2 - lz1) + .02), E.glow(col, 1.4)); R.place(rim, (x1 + x2) / 2, (lz1 + lz2) / 2, h);
  const g = { r: R.rect(x1, lz1, x2, lz2), c, m, rim }; list.push(g); return g;
}
function cell(R, E, list, x1, lz1, x2, lz2, c, t = .3){
  glass(R, E, list, x1, lz1, x2, lz1 + t, c); glass(R, E, list, x1, lz2 - t, x2, lz2, c);
  glass(R, E, list, x1, lz1 + t, x1 + t, lz2 - t, c); glass(R, E, list, x2 - t, lz1 + t, x2, lz2 - t, c);
}
const showGlass = (list, on) => list.forEach(g => { g.m.visible = on; g.rim.visible = on; });
const glassCol = (list, E, idx) => { const s = E.soul(idx); return s < 0 ? [] : list.filter(g => g.c !== s).map(g => g.r); };
const soulTip = () => solo() ? 'Press <b>G</b> to drop a soul anchor, <b>G</b> again to jump back to it — each jump flips your soul between blue and pink.' : 'Both press <b>G</b> (phone: tap each other) to swap places.';

/* ---------- reflection figures ---------- */
const RCOL = [0xa8d0ff, 0xffb8dc];
function reflFig(E, idx){ const c = E.makeChar(RCOL[idx], true); c.group.visible = false; c.bodyMat.emissive = new E.THREE.Color(RCOL[idx]); c.bodyMat.emissiveIntensity = .6; return c; }
function showFig(f, on, x, z, dt, E, snap){ f.group.visible = on; if (!on) return; const p = f.group.position, dx = x - p.x, dz = z - p.z; if (snap || Math.hypot(dx, dz) > 4){ p.set(x, 0, z); return; } const k = E.damp(14, dt); p.x += dx * k; p.z += dz * k; if (Math.hypot(dx, dz) > .02) f.group.rotation.y = Math.atan2(dx, dz); f.rig.position.y = Math.abs(Math.sin(performance.now() / 120)) * .08 * Math.min(1, Math.hypot(dx, dz) * 8); }
function pushOut(x, lz, rects, rad = .35){
  for (let pass = 0; pass < 3; pass++) for (const b of rects){
    const cx = Math.max(b[0], Math.min(x, b[2])), cz = Math.max(b[1], Math.min(lz, b[3])), dx = x - cx, dz = lz - cz, d = Math.hypot(dx, dz);
    if (d < rad){
      if (d > 1e-6){ x = cx + dx / d * rad; lz = cz + dz / d * rad; }
      else { const o = [[b[0] - rad - x, 0], [b[2] + rad - x, 0], [0, b[1] - rad - lz], [0, b[3] + rad - lz]].sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1]))[0]; x += o[0]; lz += o[1]; }
    }
  }
  return [x, lz];
}

/* =============================================================== */
const foyer = {
  name: 'The Gilded Foyer',
  floor: marble,
  notes: [[0, 1.5, '“Blue souls pass blue glass. Pink souls pass pink glass. Trade souls to trade places.”', 1.5]],
  get hint(){ return solo() ? 'Press G to drop a soul anchor, then G again to jump back to it — the jump flips your soul colour. Pink passes the pink wall, blue passes the blue one.' : 'Whoever is PINK walks through the pink wall. Then you BOTH press G (or tap each other on the phone) to swap — now blue is through. Do the same at the blue wall.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.gl = [];
    glass(R, E, this.gl, -10, 6.85, 10, 7.15, PINK);
    glass(R, E, this.gl, -10, 13.85, 10, 14.15, BLUE);
    for (const s of [-1, 1]) for (const lz of [4, 10.5, 17.5]){ const f = new T.Mesh(new T.BoxGeometry(.15, 2.4, 1.8), goldMat(E)); R.place(f, s * 9.9, lz, 1.6); const m = new T.Mesh(new T.PlaneGeometry(1.5, 2.1), mirrorMat(E)); m.rotation.y = -s * Math.PI / 2; R.place(m, s * 9.8, lz, 1.6); }
    const ch = new T.Mesh(new T.TorusGeometry(1.2, .1, 8, 24), goldMat(E)); ch.rotation.x = Math.PI / 2; R.place(ch, 0, 10.5, 4.2);
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  colliders(st, R, E, idx){ return st.done ? [] : glassCol(this.gl, E, idx); },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 15)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the gilded glass — the foyer doors open!'); } },
  visual(dt, t, st){ showGlass(this.gl, !st.done); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `<b>NEW: Soul Swap!</b> Coloured glass only lets a matching soul through. ${soulTip()} Get everyone past both walls.`; }
};

/* =============================================================== */
// The reflecting pool: each player's reflection on the far bank copies your moves, mirrored left↔right.
const EW2 = [[1.2, 6.8, 7.5, 7.2], [3.5, 10.8, 10, 11.2], [1.2, 14.3, 7.5, 14.7], [5.3, 7.2, 5.7, 9.2]];
const BOUND2 = [[-1.2, 2.6, 1.2, 17.4], [1.2, 2.6, 10.6, 3], [1.2, 17, 10.6, 17.4], [9.6, 2.6, 10.6, 17.4]];
const PL2 = [[3, 9.2], [8.6, 12.8], [3, 16]];
const pool = {
  name: 'The Reflecting Pool',
  floor: marble,
  notes: [[-3, 1.6, '“Your reflection walks the far bank. It copies every step — but left is right.”', 1.6]],
  hint: 'Walk along the left bank: your silver reflection on the right bank copies you, mirrored (you go left, it goes right). Steer it through the hedges onto the three glowing plates. If it gets stuck, walk to the far left wall — it presses against the right wall and lines up again.',
  build(R, E){
    EE = E; const T = E.THREE;
    const water = new T.Mesh(new T.BoxGeometry(2.4, .3, 14.4), new T.MeshStandardMaterial({ color: 0x9ab8e8, metalness: .9, roughness: .05, emissive: 0x2a3a6a, emissiveIntensity: .5 }));
    R.place(water, 0, 10, .15); R.block(-1.2, 2.6, 1.2, 17.4, .01, E.mat(0), true);
    R.block(1.2, 2.6, 10, 3, .9, goldMat(E)); R.block(1.2, 17, 10, 17.4, .9, goldMat(E));
    EW2.forEach(([a, b, c, d]) => R.block(a, b, c, d, 1.4, E.mat(0x3a6a4a), false));
    PL2.forEach(([x, lz], i) => R.plate('m' + i, x, lz, 0xbfe0ff, 1.6, '✦'));
    this.figs = [reflFig(E, 0), reflFig(E, 1)];
    this.orbs = orbRow(E, R, 3, -1.3, 20.5, 1.3, 2.4);
    this.rects = [...EW2, ...BOUND2];
  },
  init(){ return { rf: [null, null], pv: [null, null], lit: [0, 0, 0], done: 0 }; },
  solve(st){ st.lit = [1, 1, 1]; st.done = 1; },
  occupants(st, R){ return st.rf.filter(Boolean).map(([x, lz]) => ({ x, z: R.Z(lz) })); },
  host(dt, st, R, E){
    for (const p of E.P){
      const lz = R.lz(p.pos.z), inZ = R.inside(p.pos) && p.pos.x < -1.1 && lz > 2.8 && lz < 17.2;
      const pv = st.pv[p.idx]; st.pv[p.idx] = inZ ? [p.pos.x, lz] : null;
      if (!inZ) continue;
      if (!st.rf[p.idx]){ st.rf[p.idx] = pushOut(-p.pos.x, lz, this.rects); continue; }
      if (!pv) continue;
      const dx = p.pos.x - pv[0], dl = lz - pv[1]; if (Math.hypot(dx, dl) > 1.5) continue;
      let [x, l] = st.rf[p.idx]; const n = Math.max(1, Math.ceil(Math.hypot(dx, dl) / .12));
      for (let k = 0; k < n; k++){ [x, l] = pushOut(Math.min(9.6, x - dx / n), l + dl / n, this.rects); }
      st.rf[p.idx] = [+x.toFixed(3), +l.toFixed(3)];
    }
    PL2.forEach((_, i) => { if (!st.lit[i] && R.on('m' + i)){ st.lit[i] = 1; E.ev('chime', `A mirror plate shines! (${st.lit.filter(Boolean).length}/3)`); } });
    if (!st.done && st.lit.every(Boolean)){ st.done = 1; R.open('exit'); E.ev('door', 'All three plates shine — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.figs.forEach((f, i) => { const r = st.rf[i]; showFig(f, !!r, r ? r[0] : 0, r ? R.Z(r[1]) : 0, dt, E); }); setOrbs(this.orbs, st.lit.filter(Boolean).length); PL2.forEach((_, i) => R.glow('m' + i, st.lit[i] ? 1 : undefined)); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `<b>Reflections</b> copy your moves — mirrored. Walk the LEFT bank to steer your reflection on the right bank onto the 3 star plates. (${st.lit.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
// Prism hall: a freezing light beam bounces off mirrors. Pads (some inside coloured glass booths) turn the mirrors.
const EMIT = [-9.6, 4], CRYST = [7.5, 19];
const MIR3 = [[-5, 4], [4, 4], [4, 12], [-5, 12], [-5, 19]];
const PAD3 = [[-5, 1.8, -1], [4, 1.8, BLUE], [6.8, 12, PINK], [-2.2, 12, BLUE], [-2.2, 19, PINK]];
const PILLAR3 = [-5.6, 7.4, -4.4, 8.6];
function traceBeam(ms){
  let x = EMIT[0], l = EMIT[1], dx = 1, dl = 0; const segs = []; let hit = false;
  for (let n = 0; n < 12; n++){
    let best = null, bd = 99;
    MIR3.forEach(([mx, ml], i) => { if (!ms[i]) return; const t = dx ? (mx - x) * dx : (ml - l) * dl; if (t <= .01) return; if (dx && Math.abs(ml - l) > .01) return; if (dl && Math.abs(mx - x) > .01) return; if (t < bd){ bd = t; best = ['m', i]; } });
    { const [cx, cl] = CRYST, t = dx ? (cx - x) * dx : (cl - l) * dl; if (t > .01 && (dx ? Math.abs(cl - l) < .5 : Math.abs(cx - x) < .5) && t < bd){ bd = t; best = ['c']; } }
    { const [a, b, c, d] = PILLAR3; if (dx && l > b && l < d){ const t = (dx > 0 ? a : c) - x; if (t * dx > .01 && Math.abs(t) < bd){ bd = Math.abs(t); best = ['w']; } } if (dl && x > a && x < c){ const t = (dl > 0 ? b : d) - l; if (t * dl > .01 && Math.abs(t) < bd){ bd = Math.abs(t); best = ['w']; } } }
    const wallT = dx > 0 ? 9.9 - x : dx < 0 ? x + 9.9 : dl > 0 ? 21.8 - l : l - .2;
    if (!best || wallT < bd){ segs.push([x, l, x + dx * wallT, l + dl * wallT]); break; }
    const nx = x + dx * bd, nl = l + dl * bd; segs.push([x, l, nx, nl]); x = nx; l = nl;
    if (best[0] === 'c'){ hit = true; break; }
    if (best[0] === 'w') break;
    const s = ms[best[1]];
    if (s === 1){ [dx, dl] = [dl, dx]; } else { [dx, dl] = [-dl, -dx]; }
  }
  return { segs, hit };
}
const prism = {
  name: 'The Prism Hall',
  floor: marble,
  notes: [[0, 1.4, '“The light freezes whatever it touches. Bend it to the crystal.”', 1.4]],
  get hint(){ return 'Each mirror has a pad: step on it to turn the mirror (/ → \\ → edge-on). The beam must go: right along the bottom, up the right side, left across the middle, up the left side and right into the crystal. The stone pillar blocks the shortcut. Dash through a beam — dashing makes you immune. Pads inside coloured booths need the matching soul.' + (solo() ? ' (Solo: flip your soul colour with the anchor.)' : ' (Swap to get the right colour into each booth.)'); },
  build(R, E){
    EE = E; const T = E.THREE;
    this.gl = [];
    PAD3.forEach(([x, lz, c], i) => { R.plate('p' + i, x, lz, 0xfff1a0, 1.3, '⟲'); if (c >= 0) cell(R, E, this.gl, x - 1.3, lz - 1.3, x + 1.3, lz + 1.3, c, .25); });
    this.mir = MIR3.map(([x, lz]) => { const g = new T.Group(); const base = new T.Mesh(new T.CylinderGeometry(.45, .55, .5, 12), goldMat(E)); base.position.y = .25; g.add(base); const m = new T.Mesh(new T.BoxGeometry(1.5, 1.3, .1), mirrorMat(E)); m.position.y = 1.2; g.add(m); R.place(g, x, lz); R.block(x - .45, lz - .45, x + .45, lz + .45, .01, E.mat(0)); return g; });
    const em = new T.Mesh(new T.ConeGeometry(.5, 1.2, 8), E.glow(0xfff6c8, 1.6)); em.rotation.z = -Math.PI / 2; R.place(em, EMIT[0] + .3, EMIT[1], 1.1);
    this.cry = new T.Mesh(new T.OctahedronGeometry(.7), new T.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x6ab8ff, emissiveIntensity: .4, transparent: true, opacity: .85 })); R.place(this.cry, CRYST[0], CRYST[1], 1.2); R.block(CRYST[0] - .5, CRYST[1] - .5, CRYST[0] + .5, CRYST[1] + .5, .01, E.mat(0));
    R.block(PILLAR3[0], PILLAR3[1], PILLAR3[2], PILLAR3[3], 2.6, E.mat(0x6a6478));
    this.beams = Array.from({ length: 12 }, () => { const b = new T.Mesh(new T.BoxGeometry(1, .14, .14), new T.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: .85 })); b.visible = false; E.scene.add(b); return b; });
  },
  init(){ return { m: [1, 0, 1, 0, 2], gr: [0, 0], done: 0 }; },
  solve(st){ st.m = [0, 1, 2, 2, 1]; st.done = 1; },
  colliders(st, R, E, idx){ return glassCol(this.gl, E, idx); },
  host(dt, st, R, E){
    if (st.done) return;
    PAD3.forEach((_, i) => { if (R.edge('p' + i)){ st.m[i] = (st.m[i] + 1) % 3; E.ev('click', '', i); } });
    const { segs, hit } = traceBeam(st.m);
    if (hit){ st.done = 1; R.open('exit'); E.ev('door', 'The beam strikes the crystal — the hall blazes with light and the door opens!'); return; }
    for (const p of E.P){
      if (E.isFrozen(p.idx)){ st.gr[p.idx] = 2; continue; }
      st.gr[p.idx] = Math.max(0, st.gr[p.idx] - dt);
      if (st.gr[p.idx] > 0 || p.dashing || !R.inside(p.pos)) continue;
      const lz = R.lz(p.pos.z);
      if (segs.some(([a, b, c, d]) => E.segDist(p.pos.x, lz, a, b, c, d) < .45)) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} was frozen by the prism beam! Dash through beams instead.`);
    }
  },
  visual(dt, t, st, R, E){
    MIR3.forEach((_, i) => { const s = st.m[i], g = this.mir[i]; const target = s === 0 ? 0 : s === 1 ? -Math.PI / 4 : Math.PI / 4; g.rotation.y += (target - g.rotation.y) * E.damp(10, dt); });
    const { segs } = st.done ? { segs: [] } : traceBeam(st.m);
    this.beams.forEach((b, i) => { const s = segs[i]; b.visible = !!s; if (!s) return; const [a, l1, c, l2] = s, len = Math.hypot(c - a, l2 - l1); b.scale.x = Math.max(.01, len); b.position.set((a + c) / 2, 1.2, R.Z((l1 + l2) / 2)); b.rotation.y = Math.abs(c - a) > Math.abs(l2 - l1) ? 0 : Math.PI / 2; b.material.opacity = .65 + Math.sin(t * 20 + i) * .2; });
    this.cry.rotation.y += dt; this.cry.material.emissiveIntensity = st.done ? 2.5 : .4;
  },
  objective(st, R, E){ return st.done ? 'The crystal is lit — door open!' : `Bend the freezing light beam into the crystal (top-right). Step on a mirror's pad to turn it. <b>Dash</b> through beams. Pads in coloured booths need that soul colour — ${solo() ? 'flip with your anchor' : 'swap'}!`; }
};

/* =============================================================== */
// Glass maze: your reflection lives in the same maze, mirrored top↔bottom, and hops a tile whenever you do.
const MZ = { cols: 8, rows: 8, x0: -10, cw: 2.5, l0: 2.4, rh: 2.4 };
const BLK4 = [[1, 4], [2, 3], [3, 1], [3, 2], [3, 3], [3, 6], [4, 4], [5, 1], [5, 3], [6, 4]];
const isBlk4 = (c, r) => c < 0 || r < 0 || c >= MZ.cols || r >= MZ.rows || BLK4.some(b => b[0] === c && b[1] === r);
const cellOf4 = (x, lz) => { const c = Math.floor((x - MZ.x0) / MZ.cw), r = Math.floor((lz - MZ.l0) / MZ.rh); return c >= 0 && c < MZ.cols && r >= 0 && r < MZ.rows ? [c, r] : null; };
const cc4 = ([c, r]) => [MZ.x0 + (c + .5) * MZ.cw, MZ.l0 + (r + .5) * MZ.rh];
const maze = {
  name: 'The Glass Maze',
  floor: marble,
  notes: [[0, 1.4, '“Across the silver line, your reflection walks toward you. Never let it catch you.”', 1.4]],
  hint: 'Your reflection hops one tile every time you do — same left/right, but opposite up/down. Walk into a dead end and it keeps going; push it against a mirror pillar and it gets stuck while you move on. Use the pillars to slip past it. If it touches you, you\'re sent back.',
  build(R, E){
    EE = E; const T = E.THREE;
    BLK4.forEach(cr => { const [x, lz] = cc4(cr); const m = new T.Mesh(new T.BoxGeometry(MZ.cw - .15, 2.6, MZ.rh - .15), mirrorMat(E)); R.place(m, x, lz, 1.3); R.block(x - MZ.cw / 2 + .05, lz - MZ.rh / 2 + .05, x + MZ.cw / 2 - .05, lz + MZ.rh / 2 - .05, .01, E.mat(0)); });
    const line = new T.Mesh(new T.BoxGeometry(20, .05, .12), E.glow(0xbfe0ff, 1.4)); R.place(line, 0, MZ.l0 + MZ.rh * 4, .05);
    this.tiles = new T.Mesh(new T.PlaneGeometry(20, MZ.rh * 8), new T.MeshBasicMaterial({ map: E.tiledTex(64, 64, (x, w, h) => { x.strokeStyle = 'rgba(190,220,255,.35)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); }, 8, 8), transparent: true, depthWrite: false }));
    this.tiles.rotation.x = -Math.PI / 2; R.place(this.tiles, 0, MZ.l0 + MZ.rh * 4, .02);
    this.figs = [reflFig(E, 0), reflFig(E, 1)];
  },
  init(){ return { rc: [null, null], pc: [null, null] }; },
  solve(){},
  touch(st, R, E, idx, why){ const sp = R.spawnW[idx]; E.freeze(idx, 1.5, `${E.names()[idx]} was caught by ${why}! Back to the start.`); E.teleport(idx, sp[0], sp[1]); st.pc[idx] = null; st.rc[idx] = null; },
  host(dt, st, R, E){
    if (!R.isOpen('exit') && st.pc.some(c => c && c[1] === MZ.rows - 1)) R.open('exit');
    for (const p of E.P){
      if (p.frozen) continue;
      const cur = R.inside(p.pos) ? cellOf4(p.pos.x, R.lz(p.pos.z)) : null, prev = st.pc[p.idx];
      st.pc[p.idx] = cur;
      if (!cur){ st.rc[p.idx] = null; continue; }
      if (!prev || !st.rc[p.idx]){ const m = [cur[0], MZ.rows - 1 - cur[1]]; st.rc[p.idx] = isBlk4(...m) ? null : m; continue; }
      const dc = cur[0] - prev[0], dr = cur[1] - prev[1];
      if (!dc && !dr) continue;
      if (Math.abs(dc) > 1 || Math.abs(dr) > 1){ st.rc[p.idx] = [cur[0], MZ.rows - 1 - cur[1]]; continue; }
      const steps = []; if (dc) steps.push([dc, 0]); if (dr) steps.push([0, dr]);
      let pc = prev;
      for (const [a, b] of steps){
        const np = [pc[0] + a, pc[1] + b], rc = st.rc[p.idx], nr = [rc[0] + a, rc[1] - b];
        const moved = !isBlk4(...nr); const rr = moved ? nr : rc;
        st.rc[p.idx] = rr;
        if ((rr[0] === np[0] && rr[1] === np[1]) || (moved && rr[0] === pc[0] && rr[1] === pc[1] && rc[0] === np[0] && rc[1] === np[1])){ this.touch(st, R, E, p.idx, 'their own reflection'); break; }
        pc = np;
      }
    }
    // reflections also catch the OTHER player
    for (const p of E.P){ if (p.frozen) continue; const c = st.pc[p.idx]; if (!c) continue; for (let j = 0; j < 2; j++){ if (j === p.idx || !st.rc[j]) continue; if (st.rc[j][0] === c[0] && st.rc[j][1] === c[1]){ this.touch(st, R, E, p.idx, `${E.names()[j]}'s reflection`); st.rc[j] = null; break; } } }
  },
  visual(dt, t, st, R, E){ this.figs.forEach((f, i) => { const r = st.rc[i]; if (!r){ f.group.visible = false; return; } const [x, lz] = cc4(r); const was = f.group.visible; showFig(f, true, x, R.Z(lz), dt, E, !was); }); },
  objective(st, R, E){ return 'Reach the door at the far end. Your <b>reflection</b> starts on the far side and hops a tile every time you do — mirrored top↔bottom. Don\'t let it touch you: trap it behind the mirror pillars, then slip past.'; }
};

/* =============================================================== */
// The vanity: crowns sealed in coloured cells, pedestals sealed in the other colour. Swapping carries your crown with you.
const CR5 = [[-7.25, 6], [-7.25, 13.5], [0, 18]], PED5 = [[7.25, 6], [7.25, 13.5], [0, 11.6]];
const vanity = {
  name: 'The Vanity of Crowns',
  floor: marble,
  noThrow: true,
  notes: [[0, 1.6, '“The Countess counts her crowns. Don\'t let her catch you holding one.”', 1.5]],
  get hint(){ return solo() ? 'Flip to pink (anchor + jump), walk into the pink cell and take the crown, walk out, flip to blue, walk into the blue cell and set it down. The middle crown is inside TWO cells: pink outside, blue inside — flip as you go. Stay out of the Countess\'s lantern.' : 'Crowns can\'t be thrown. Pink fetches the crown from a pink cell; blue stands inside the blue cell; SWAP — your crown comes with you! Swap again to get out. For the double cell (pink outside, blue inside): pink walks in, swap so blue is inside the ring, blue takes the crown out to the ring, swap again so pink can carry it out.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.gl = [];
    cell(R, E, this.gl, -9.7, 3.6, -4.8, 8.4, PINK); cell(R, E, this.gl, 4.8, 3.6, 9.7, 8.4, BLUE);
    cell(R, E, this.gl, -9.7, 11.1, -4.8, 15.9, BLUE); cell(R, E, this.gl, 4.8, 11.1, 9.7, 15.9, PINK);
    cell(R, E, this.gl, -3.3, 15.0, 3.3, 20.4, PINK); cell(R, E, this.gl, -1.7, 16.4, 1.7, 19.6, BLUE);
    this.ped = PED5.map(([x, lz]) => { const p = new T.Mesh(new T.CylinderGeometry(.5, .6, 1, 12), goldMat(E)); R.place(p, x, lz + .9, .5); const c = this.crownMesh(E); c.visible = false; R.place(c, x, lz + .9, 1.2); return c; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.6);
    R.ghost({ home: [0, 5], look: 'crown', tint: 0xe8d8ff, label: 'the Countess', sp: 1.7, flashImmune: false, b: [-4.6, 4.6, 2, 14.5], cone: { len: 5, ang: .5, color: 0xffe08a }, think: E.AI.patrol([[-3.8, 4.2], [3.8, 4.2], [3.8, 13.6], [-3.8, 13.6]], 1.7, { cone: { len: 5, ang: .5 } }) });
  },
  crownMesh(E){ const T = E.THREE, g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(.3, .3, .2, 12, 1, true), new T.MeshStandardMaterial({ color: 0xffd34a, metalness: .9, roughness: .2, emissive: 0x6a5010, side: T.DoubleSide })); g.add(b); for (let i = 0; i < 5; i++){ const s = new T.Mesh(new T.ConeGeometry(.07, .2, 6), b.material); const a = i / 5 * Math.PI * 2; s.position.set(Math.sin(a) * .28, .18, Math.cos(a) * .28); g.add(s); } const j = new T.Mesh(new T.SphereGeometry(.07, 8, 6), E.glow(0xff4060, 1.5)); j.position.set(0, .05, .3); g.add(j); return g; },
  init(){ return { put: [0, 0, 0], items: CR5.map(([x, lz], i) => mkItem('crown', x, lz, { n: i })) }; },
  solve(st){ st.put = [1, 1, 1]; st.items.forEach(it => it.s = 3); },
  itemMesh(k, E){ return k === 'crown' ? this.crownMesh(E) : null; },
  colliders(st, R, E, idx){ return glassCol(this.gl, E, idx); },
  carryTick(st, R, E, it, p){ const [x, lz] = PED5[it.n]; if (near(R, p, x, lz + .9, 1.5)){ it.s = 3; st.put[it.n] = 1; const n = st.put.filter(Boolean).length; E.ev('place', n < 3 ? `A crown returns to its pedestal (${n}/3)` : ''); } },
  host(dt, st, R, E){ if (!R.isOpen('exit') && st.put.every(Boolean)){ R.open('exit'); E.ev('door', 'Three crowns on three pedestals — the Countess bows and the door opens!'); } },
  visual(dt, t, st, R, E){ this.ped.forEach((c, i) => { c.visible = !!st.put[i]; c.rotation.y += dt; }); setOrbs(this.orbs, st.put.filter(Boolean).length); },
  objective(st, R, E){ return st.put.every(Boolean) ? 'All crowns returned — door open!' : `Return each crown to the gold pedestal of the same row (the middle crown goes to the centre). Crowns are too precious to throw. ${solo() ? 'Flip your soul colour with the anchor (G) to pass the glass.' : '<b>Swap</b> carries your crown with you!'} Avoid the Countess's lantern. (${st.put.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
// The shattering floor: glass tiles shatter the moment you step off them. Shatter every one.
const TC6 = 5, TR6 = 4, TP6 = 3.6, TH6 = 1.3, TX6 = c => (c - 2) * TP6, TL6 = r => 5.5 + r * TP6;
const STONE6 = [[0, 0], [3, 3]], CUT6 = [[[3, 0], [4, 0]]];
const isStone6 = (c, r) => STONE6.some(s => s[0] === c && s[1] === r);
const cut6 = (a, b) => CUT6.some(([p, q]) => (p[0] === a[0] && p[1] === a[1] && q[0] === b[0] && q[1] === b[1]) || (p[0] === b[0] && p[1] === b[1] && q[0] === a[0] && q[1] === a[1]));
const PLANK6 = []; for (let c = 0; c < TC6; c++) for (let r = 0; r < TR6; r++){ if (c < TC6 - 1 && !cut6([c, r], [c + 1, r])) PLANK6.push([TX6(c) + TP6 / 2, TL6(r), .55, .5]); if (r < TR6 - 1 && !cut6([c, r], [c, r + 1])) PLANK6.push([TX6(c), TL6(r) + TP6 / 2, .5, .55]); }
const TI6 = (c, r) => r * TC6 + c;
const shatter = {
  name: 'The Shattering Floor',
  floor: marble,
  noDashJump: true,
  notes: [[-3, 1.4, '“Every pane breaks the moment you step off it. Crack them all — and don\'t get stranded.”', 1.5]],
  get hint(){ return 'Plan a route that visits every glass pane exactly once — grey stone tiles never break, so you can cross them as often as you like. The two right-hand panes on the bottom row aren\'t joined. ' + (solo() ? 'Drop a soul anchor on the shore first: if you get stranded, jump back to it.' : 'Split the floor between you — and if one of you is stranded, swap with the other.') + ' Stand on the mend plate to restore the glass.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    R.floor(-10, 3.2, 10, 18.6, voidMat(E), .015);
    R.floor(-.6, 3.2, .6, 4.2, marble(E), .03); R.floor(-.6, 17.6, .6, 18.6, marble(E), .03);
    PLANK6.forEach(([x, lz, hw, hd]) => R.floor(x - hw, lz - hd, x + hw, lz + hd, goldMat(E), .03));
    this.tiles = []; this.cracks = [];
    for (let r = 0; r < TR6; r++) for (let c = 0; c < TC6; c++){
      const st = isStone6(c, r);
      const m = new T.Mesh(new T.BoxGeometry(TH6 * 2, .12, TH6 * 2), st ? E.mat(0x6a6478) : new T.MeshStandardMaterial({ color: 0xcfe4ff, metalness: .7, roughness: .08, emissive: 0x4a6aa0, emissiveIntensity: .45, transparent: true, opacity: .85 }));
      R.place(m, TX6(c), TL6(r), .06); this.tiles.push(m);
      const ck = new T.Mesh(new T.PlaneGeometry(TH6 * 2, TH6 * 2), new T.MeshBasicMaterial({ map: E.canvasTex(64, 64, (x, w, h) => { x.strokeStyle = '#ffffff'; x.lineWidth = 2; for (let i = 0; i < 7; i++){ x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(Math.random() * w, Math.random() * h); x.stroke(); } }), transparent: true, depthWrite: false }));
      ck.rotation.x = -Math.PI / 2; ck.visible = false; R.place(ck, TX6(c), TL6(r), .13); this.cracks.push(ck);
    }
    this.reform = R.floor(-10, 3.2, 10, 18.6, marble(E), .04); this.reform.visible = false;
    R.plate('mend', -6, 1.6, 0x8affc1, 1.4, '↺');
    this.orbs = orbRow(E, R, 6, -3.2, 20.6, 1.3, 2.4);
  },
  init(){ return { br: Array(TC6 * TR6).fill(0), t: Array(TC6 * TR6).fill(0), done: 0 }; },
  solve(st){ st.done = 1; },
  glassLeft(st){ let n = 0; for (let r = 0; r < TR6; r++) for (let c = 0; c < TC6; c++) if (!isStone6(c, r) && st.br[TI6(c, r)] < 1) n++; return n; },
  pits(st, R){ return st.done ? [] : [R.rect(-10.5, 3.2, 10.5, 18.6)]; },
  bridges(st, R){
    const out = [R.rect(-.6, 3, .6, 4.4), R.rect(-.6, 17.4, .6, 18.8)];
    for (let r = 0; r < TR6; r++) for (let c = 0; c < TC6; c++) if (isStone6(c, r) || st.br[TI6(c, r)] < 2) out.push(rect(R, TX6(c), TL6(r), TH6));
    PLANK6.forEach(([x, lz, hw, hd]) => out.push(rect(R, x, lz, hw, hd)));
    return out;
  },
  host(dt, st, R, E){
    if (st.done) return;
    if (R.edge('mend')){ st.br.fill(0); st.t.fill(0); E.ev('chime', 'The glass knits itself back together.'); }
    for (let r = 0; r < TR6; r++) for (let c = 0; c < TC6; c++){
      if (isStone6(c, r)) continue; const i = TI6(c, r);
      const occ = E.P.some(p => R.inside(p.pos) && Math.abs(p.pos.x - TX6(c)) < TH6 + .25 && Math.abs(R.lz(p.pos.z) - TL6(r)) < TH6 + .25);
      if (st.br[i] === 0 && occ){ st.br[i] = 1; st.t[i] = 0; E.ev('click'); }
      else if (st.br[i] === 1 && !occ){ st.t[i] += dt; if (st.t[i] > .3){ st.br[i] = 2; E.ev('crash'); } }
      else if (st.br[i] === 1) st.t[i] = 0;
    }
    if (this.glassLeft(st) === 0){ st.done = 1; R.open('exit'); E.ev('door', 'Every pane is cracked — the broken glass reforms as solid marble. The door opens!'); }
  },
  visual(dt, t, st, R, E){
    this.tiles.forEach((m, i) => { m.visible = !st.done && st.br[i] < 2; }); this.cracks.forEach((m, i) => { m.visible = !st.done && st.br[i] === 1; });
    this.reform.visible = !!st.done; setOrbs(this.orbs, Math.round((18 - this.glassLeft(st)) / 3));
  },
  objective(st, R, E){ return st.done ? 'The floor is whole again — door open!' : `Crack every glass pane by stepping on it — but each one shatters as soon as you step OFF. Stone tiles are safe to reuse. Stuck? ${solo() ? 'Anchor-jump back' : 'Swap with your partner'}, or use the ↺ plate to mend the glass. (${this.glassLeft(st)} panes left)`; }
};

/* =============================================================== */
// Looking-glass gallery: past the great mirror, left and right swap — and deeper in, up and down too.
const SH7 = [[-7.2, 11], [7, 17.4], [-6.5, 20.4]], ALT7 = [0, 3.2];
const PIL7 = [[-4, 8.6, -2.6, 10], [2.6, 8.6, 4, 10], [-1, 12, 1, 13.4], [-5, 16.5, -3.6, 18], [3, 19, 4.4, 20.4], [5.6, 14.6, 9, 15.2]];
const looking = {
  name: 'The Looking-Glass Gallery',
  floor: marble,
  notes: [[0, 1.4, '“Step through the glass and the world turns around you.”', 1.4]],
  hint: 'In the violet half your left and right are swapped. In the red half (the back) up and down are swapped too! Move in short taps. Flash the ghosts to stun them. You can THROW shards back through the frame to your partner — or onto the altar.',
  build(R, E){
    EE = E; const T = E.THREE;
    R.wall(-10, 5.7, -1.7, 6.3); R.wall(1.7, 5.7, 10, 6.3);
    const fr = new T.Mesh(new T.TorusGeometry(1.9, .18, 8, 24, Math.PI), goldMat(E)); R.place(fr, 0, 6, 0);
    R.floor(-10, 6.3, 10, 14, E.mat(0x5a3a8a, { roughness: .4, emissive: 0x2a1a5a, emissiveIntensity: .4 }), .01);
    R.floor(-10, 14, 10, 22, E.mat(0x7a2a3a, { roughness: .4, emissive: 0x4a1020, emissiveIntensity: .4 }), .01);
    PIL7.forEach(([a, b, c, d]) => R.block(a, b, c, d, 2.4, mirrorMat(E)));
    const alt = new T.Mesh(new T.BoxGeometry(1.6, .9, 1.1), goldMat(E)); R.place(alt, ALT7[0], ALT7[1], .45); R.block(ALT7[0] - .8, ALT7[1] - .55, ALT7[0] + .8, ALT7[1] + .55, .01, E.mat(0));
    this.orbs = orbRow(E, R, 3, -1.3, ALT7[1], 1.3, 1.6);
    R.ghost({ home: [6, 9], look: 'hat', tint: 0xb8a0ff, sp: 2.1, radius: 6, label: 'a looking-glass ghost', b: [-9.4, 9.4, 6.6, 13.8] });
    R.ghost({ home: [-2, 20], look: 'hat', tint: 0xff8aa0, sp: 2.4, radius: 6, label: 'a looking-glass ghost', b: [-9.4, 9.4, 14.2, 21.4] });
  },
  init(){ return { got: 0, items: SH7.map(([x, lz]) => mkItem('shard', x, lz)) }; },
  solve(st){ st.got = 3; st.items.forEach(it => it.s = 3); },
  itemMesh(k, E){ return k === 'shard' ? new E.THREE.Mesh(new E.THREE.TetrahedronGeometry(.36), new E.THREE.MeshStandardMaterial({ color: 0xe8f0ff, metalness: .9, roughness: .05, emissive: 0x6a8aff, emissiveIntensity: .7 })) : null; },
  inputMod(st, R, E, pos){ const lz = R.lz(pos.z); if (lz > 14) return [-1, -1]; if (lz > 6.2) return [-1, 1]; return null; },
  place(st, E, it){ it.s = 3; st.got++; E.ev('place', st.got < 3 ? `A shard is back in the frame (${st.got}/3)` : ''); },
  carryTick(st, R, E, it, p){ if (near(R, p, ALT7[0], ALT7[1], 1.7)) this.place(st, E, it); },
  onLand(st, R, E, it){ if (Math.hypot(it.x - ALT7[0], it.lz - ALT7[1]) < 1.5) this.place(st, E, it); },
  host(dt, st, R, E){ if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'The mirror is whole again — the far door opens (yes, you have to go back through!)'); } },
  visual(dt, t, st, R, E){ setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 3 ? 'Now cross the looking-glass world again to the far door!' : `Bring the 3 mirror shards to the gold altar by the frame. Through the glass, <b style="color:#b8a0ff">left ⇄ right</b> — and on the red floor, <b style="color:#ff8aa0">up ⇄ down too</b>. (${st.got}/3)`; }
};

/* =============================================================== */
// Haunted mirrors: two lanes of leap-frogging gates. Some wall mirrors hide lunging reflections — only Ghost Sight shows which.
const GATE8 = { W1: 7, W2: 11, W3: 15, E1: 9, E2: 13, E3: 17 };
const PLATE8 = [['e1', 7.5, 5, 'W1'], ['w1', -7.5, 9.2, 'E1'], ['e2', 7.5, 11.2, 'W2'], ['w2', -7.5, 13.2, 'E2'], ['e3', 7.5, 15.2, 'W3'], ['n', -5, 20.4, 'E3']];
const MIRS8 = [[-9.7, 5.5, 1], [-9.7, 10, 0], [-9.7, 12.2, 1], [-9.7, 17.5, 1], [-1.3, 8, 0], [-1.3, 14, 1], [9.7, 7.2, 1], [9.7, 10.4, 0], [9.7, 13.6, 1], [9.7, 16.8, 0], [1.3, 5.6, 0], [1.3, 12, 1], [1.3, 15.8, 1]];
const haunted = {
  name: 'The Haunted Mirrors',
  floor: marble,
  notes: [[0, 1.4, '“Some of these mirrors are only mirrors. Hold ☀ to see which are not.”', 1.5]],
  get hint(){ return solo() ? 'Solo: the gates are open. Hold ☀ (Ghost Sight) to see which mirrors hide a lunging reflection, and slip past while they recover.' : 'Leap-frog: each plate opens a gate in the OTHER lane, only while someone stands on it. Before walking along a wall, hold ☀ for Ghost Sight — haunted mirrors show a reflection waiting to lunge. Flash stuns them; dash past them.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    R.wall(-1, 3, 1, 19);
    for (const [k, lz] of Object.entries(GATE8)){ const w = k[0] === 'W'; R.door(k, w ? -9.9 : 1, lz - .25, w ? -1 : 9.9, lz + .25, 'gate'); }
    PLATE8.forEach(([n, x, lz]) => R.plate(n, x, lz, 0xbfe0ff, 1.5));
    MIRS8.forEach(([x, lz, haunt]) => {
      const s = Math.sign(x), fr = new T.Mesh(new T.BoxGeometry(.12, 2.2, 1.5), goldMat(E)); R.place(fr, x + s * .1, lz, 1.4);
      const m = new T.Mesh(new T.PlaneGeometry(1.2, 1.9), mirrorMat(E)); m.rotation.y = -s * Math.PI / 2; R.place(m, x, lz, 1.4);
      if (haunt){ const off = -s * .6; R.ghost({ home: [x + off, lz], look: 'normal', tint: 0xdfe8ff, invisible: true, label: 'a haunted reflection', b: [-9.9, 9.9, lz - 5, lz + 5], think: E.AI.lunger(4.2, 12, 1.5) }); }
    });
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){
    PLATE8.forEach(([n, , , g]) => R.setDoor(g, E.solo() || R.held(n)));
    if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.2)){ st.done = 1; R.open('exit'); E.ev('door', 'Both through the mirror lanes — the door opens!'); }
    if (st.done) R.open('exit');
  },
  objective(st, R, E){ return st.done ? 'The door is open!' : E.solo() ? 'Reach the far end. Hold <b>☀</b> for Ghost Sight to spot the haunted mirrors.' : 'Take a lane each. A plate opens a gate in the <b>other</b> lane while you stand on it — leap-frog to the top. Hold <b>☀</b> for Ghost Sight: haunted mirrors lunge!'; }
};

/* =============================================================== */
// Soul exchange: nine glass chambers. Light the two pairs of soul plates — each pair at the same moment.
const CX9 = [[-10, -3], [-3, 3], [3, 10]], RL9 = [[3, 8.5], [8.5, 14], [14, 19.5]];
const WALL9 = { '0,0|1,0': 'P', '0,0|0,1': 'X', '0,1|1,1': 'B', '0,1|0,2': 'X', '0,2|1,2': 'P', '1,0|2,0': 'P', '1,0|1,1': 'B', '1,1|2,1': 'B', '1,1|1,2': 'P', '1,2|2,2': 'O', '2,0|2,1': 'X', '2,1|2,2': 'X' };
const cc9 = (c, r) => [(CX9[c][0] + CX9[c][1]) / 2, (RL9[r][0] + RL9[r][1]) / 2];
const SP9 = { A: [0, 2], B: [2, 2], C: [2, 0], D: [0, 0] };
const exchange = {
  name: 'The Soul Exchange',
  floor: marble,
  notes: [[0, 1.4, '“Two souls, nine chambers. Light each pair of plates at the same moment.”', 1.4]],
  get hint(){ return solo() ? 'Plates count for 5 seconds after you step off. Drop your anchor ON plate A, walk to plate B, then jump back: you land on A while B still glows. The jump flips your colour, so plan which doors you can use afterwards. Then do the same for C and D.' : 'You must stand on both moon plates (A+B) at the same moment, then both sun plates (C+D). Each of you can only use doorways of your own colour (grey = anyone). Swapping is the only way into some chambers — sometimes you\'ll swap several times in a row.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.gl = [];
    const stone = (x1, lz1, x2, lz2) => R.wall(x1, lz1, x2, lz2, 2.6);
    // outer south wall with an open doorway into the middle-bottom chamber; north wall with the sealed gate
    stone(-10, 2.8, -1.2, 3.2); stone(1.2, 2.8, 10, 3.2);
    stone(-10, 19.3, -1.2, 19.7); stone(1.2, 19.3, 10, 19.7); R.door('gate', -1.2, 19.3, 1.2, 19.7, 'gate');
    for (const [k, t] of Object.entries(WALL9)){
      const [a, b] = k.split('|').map(s => s.split(',').map(Number));
      if (a[1] === b[1]){ // vertical wall between columns
        const x = CX9[a[0]][1], [l1, l2] = RL9[a[1]], m = (l1 + l2) / 2;
        stone(x - .2, l1, x + .2, m - 1.2); stone(x - .2, m + 1.2, x + .2, l2);
        if (t === 'X') stone(x - .2, m - 1.2, x + .2, m + 1.2); else if (t !== 'O') glass(R, E, this.gl, x - .15, m - 1.2, x + .15, m + 1.2, t === 'B' ? BLUE : PINK);
      } else { // horizontal wall between rows
        const lz = RL9[a[1]][1], [x1, x2] = CX9[a[0]], m = (x1 + x2) / 2;
        stone(x1, lz - .2, m - 1.2, lz + .2); stone(m + 1.2, lz - .2, x2, lz + .2);
        if (t === 'X') stone(m - 1.2, lz - .2, m + 1.2, lz + .2); else if (t !== 'O') glass(R, E, this.gl, m - 1.2, lz - .15, m + 1.2, lz + .15, t === 'B' ? BLUE : PINK);
      }
    }
    for (const [n, [c, r]] of Object.entries(SP9)){ const [x, lz] = cc9(c, r); R.plate(n, x, lz, n === 'A' || n === 'B' ? 0xbfd0ff : 0xffd38a, 1.6, n === 'A' || n === 'B' ? '☾' : '☀'); }
    this.orbs = orbRow(E, R, 2, -.65, 20.8, 1.3, 2.4);
  },
  init(){ return { ab: 0, cd: 0 }; },
  solve(st){ st.ab = st.cd = 1; },
  colliders(st, R, E, idx){ return st.cd ? [] : glassCol(this.gl, E, idx); },
  host(dt, st, R, E){
    if (!st.ab && R.held('A') && R.held('B') && (R.on('A') || R.on('B'))){ st.ab = 1; E.ev('chime', 'The moon plates ring together! Now the sun plates.'); }
    if (st.ab && !st.cd && R.held('C') && R.held('D') && (R.on('C') || R.on('D'))){ st.cd = 1; E.ev('door', 'Both pairs are lit — the soul-glass melts away and the gate opens!'); }
    if (st.ab && st.cd){ R.open('gate'); R.open('exit'); }
    for (const n of ['A', 'B']) R.glow(n, st.ab ? 1 : undefined); for (const n of ['C', 'D']) R.glow(n, st.cd ? 1 : undefined);
  },
  visual(dt, t, st, R, E){ setOrbs(this.orbs, st.ab + st.cd); showGlass(this.gl, !st.cd); },
  objective(st, R, E){ return st.cd ? 'The soul gate is open!' : !st.ab ? `Stand on both <b>☾ moon plates</b> at the same moment (top-left and top-right chambers). Doorways only let their own colour through. ${solo() ? 'A plate keeps glowing 5s after you leave it — and your anchor jump is instant.' : 'Swap to reach the chambers your colour can\'t.'}` : 'Now both <b>☀ sun plates</b> at the same moment (bottom-left and bottom-right chambers).'; }
};

/* =============================================================== */
// The Mirror Queen: she hides in one of four mirrors (Ghost Sight shows which). Pin her reflection on the opposite pad, flash her mirror to crack it.
const QC = [0, 11.5], QM = [[0, 19], [7.5, 11.5], [0, 4], [-7.5, 11.5]], QP = QM.map(([x, lz]) => [QC[0] + (x - QC[0]) * .62, QC[1] + (lz - QC[1]) * .62]);
const QRECT = QM.map(([x, lz]) => x === 0 ? [x - 1.2, lz - .3, x + 1.2, lz + .3] : [x - .3, lz - 1.2, x + .3, lz + 1.2]);
const QBOUND = [[-10.6, 2.4, -9.6, 21.6], [9.6, 2.4, 10.6, 21.6], [-10, 1.4, 10, 2.4], [-10, 21.6, 10, 22.6]];
const queen = {
  name: 'The Mirror Queen',
  floor: marble,
  notes: [[0, 1.5, '“She is in one mirror only. Hold the opposite reflection — and shatter the true glass.”', 1.4]],
  hint: 'Hold ☀ for Ghost Sight: the Queen\'s face shows in one mirror. One of you stands on the pad in front of the OPPOSITE mirror, the other walks up to her mirror and flashes (tap ☀). Three cracks and she shatters. Your silver reflections copy your moves THROUGH the centre point — don\'t walk across the middle!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.mir = QM.map(([x, lz], i) => {
      const g = new T.Group(); const fr = new T.Mesh(new T.BoxGeometry(2.6, 3.2, .3), goldMat(E)); fr.position.y = 1.6; g.add(fr);
      const m = new T.Mesh(new T.PlaneGeometry(2.1, 2.7), mirrorMat(E).clone()); m.position.set(0, 1.6, .17); g.add(m); g.userData.m = m;
      const face = new T.Mesh(new T.SphereGeometry(.55, 14, 10), new T.MeshBasicMaterial({ color: 0xff4070, transparent: true, opacity: .8 })); face.position.set(0, 1.9, .3); face.visible = false; g.add(face); g.userData.face = face;
      const cr = new T.Mesh(new T.PlaneGeometry(2.1, 2.7), new T.MeshBasicMaterial({ map: E.canvasTex(64, 64, (c, w, h) => { c.strokeStyle = '#fff'; c.lineWidth = 2; for (let k = 0; k < 9; k++){ c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(Math.random() * w, Math.random() * h); c.stroke(); } }), transparent: true, depthWrite: false })); cr.position.set(0, 1.6, .19); cr.visible = false; g.add(cr); g.userData.cr = cr;
      g.rotation.y = Math.atan2(QC[0] - x, -(QC[1] - lz)); R.place(g, x, lz);
      const r = QRECT[i]; R.block(r[0], r[1], r[2], r[3], .01, E.mat(0));
      R.plate('q' + i, QP[i][0], QP[i][1], 0xffb8dc, 1.5, '♛');
      return g;
    });
    this.figs = [reflFig(E, 0), reflFig(E, 1)];
    this.knights = [0, 1, 2].map(k => R.ghost({ home: [k === 1 ? 8.5 : -8.5, k === 2 ? 20.5 : 3], look: 'knight', tint: 0xc8d8f0, sp: 1.9 + k * .3, radius: 9, label: 'a mirror knight', gone: st => st.n <= k || st.done }));
    this.marks = orbRow(E, R, 3, -1.3, 21.2, 1.3, 3);
  },
  init(){ return { q: 2, n: 0, rf: [null, null], pv: [null, null], done: 0, cd: 0 }; },
  solve(st){ st.n = 3; st.done = 1; },
  rects: [...QRECT, ...QBOUND],
  onFlash(st, R, E, idx, x, z){
    if (st.done || st.cd > 0) return;
    const [mx, ml] = QM[st.q]; if (Math.hypot(x - mx, R.lz(z) - ml) > 3.4) return;
    const opp = (st.q + 2) % 4;
    if (!R.held('q' + opp)){ E.ev('boo', 'She laughs — someone must hold her reflection on the pad in front of the OPPOSITE mirror!'); return; }
    st.n++; st.cd = 1.5;
    if (st.n >= 3){ st.done = 1; R.open('exit'); E.ev('boom', 'The Mirror Queen shatters into a thousand shards! The palace doors open.'); return; }
    const opts = [0, 1, 2, 3].filter(i => i !== st.q); st.q = opts[Math.floor(Math.random() * opts.length)];
    E.ev('crash', `Her mirror cracks! (${st.n}/3) She flees into another mirror — and a mirror knight steps out!`);
  },
  host(dt, st, R, E){
    st.cd = Math.max(0, st.cd - dt);
    for (const p of E.P){
      const lz = R.lz(p.pos.z), inA = R.inside(p.pos) && lz > 2.6 && !st.done;
      const pv = st.pv[p.idx]; st.pv[p.idx] = inA && !p.frozen ? [p.pos.x, lz] : null;
      if (!inA){ st.rf[p.idx] = null; continue; }
      if (p.frozen) continue;
      if (!st.rf[p.idx]){ st.rf[p.idx] = pushOut(2 * QC[0] - p.pos.x, 2 * QC[1] - lz, this.rects); continue; }
      if (!pv) continue;
      const dx = p.pos.x - pv[0], dl = lz - pv[1]; if (Math.hypot(dx, dl) > 1.5) continue;
      let [x, l] = st.rf[p.idx]; const n = Math.max(1, Math.ceil(Math.hypot(dx, dl) / .12));
      for (let k = 0; k < n; k++) [x, l] = pushOut(x - dx / n, l - dl / n, this.rects);
      st.rf[p.idx] = [+x.toFixed(3), +l.toFixed(3)];
    }
    for (const p of E.P){ if (p.frozen || p.dashing) continue; const lz = R.lz(p.pos.z); for (let j = 0; j < 2; j++){ const r = st.rf[j]; if (r && Math.hypot(r[0] - p.pos.x, r[1] - lz) < .9){ E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} walked into ${j === p.idx ? 'their own' : E.names()[j] + '\'s'} reflection!`); st.rf[j] = null; break; } } }
  },
  visual(dt, t, st, R, E){
    this.mir.forEach((g, i) => { const f = g.userData.face; f.visible = !st.done && i === st.q && E.sight; f.scale.setScalar(1 + Math.sin(t * 4) * .08); g.userData.cr.visible = st.done || false; g.visible = !(st.done && i === st.q && false); });
    this.figs.forEach((f, i) => { const r = st.rf[i]; showFig(f, !!r, r ? r[0] : 0, r ? R.Z(r[1]) : 0, dt, E); });
    setOrbs(this.marks, st.n);
  },
  objective(st, R, E){ return st.done ? 'The Mirror Queen is shattered — escape the palace!' : `Hold <b>☀</b> to find the Queen's mirror. One stands on the ♛ pad of the <b>opposite</b> mirror; the other <b>flashes</b> her mirror up close. Your reflections mirror you through the centre — keep away from it! (${st.n}/3)`; }
};

export default {
  level: 10,
  title: 'The Mirror Palace',
  tagline: 'Every hall is a reflection of another.<br>Every reflection is watching you.',
  story: 'Gilded glass divides the palace. Blue souls pass blue glass, pink souls pass pink — and your reflections walk wherever you walk.',
  winTitle: 'The mirrors are silent! 🪞',
  feature: { name: 'Soul Swap', icon: '🔁', how: 'Both press <b>G</b> (phone: tap each other) within 3 seconds to <b>trade places</b> — anything you carry comes too. Coloured glass only lets a matching soul through. Solo: <b>G</b> drops an anchor, <b>G</b> again jumps back and flips your colour.' },
  accent: '#c8d8ff',
  wallColor: 0x3a3450,
  trimColor: 0xd4af37,
  doorColor: 0x2a2440,
  sky: 0x9aa8d0,
  bg: 0x07060e,
  drone: 41,
  rooms: [foyer, pool, prism, maze, vanity, shatter, looking, haunted, exchange, queen],
};
