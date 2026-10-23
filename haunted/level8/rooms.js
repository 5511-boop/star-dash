// Level 8 — The Opera House. New power: GHOST SIGHT (hold ☀ / F to see invisible things).
// From this level on: if BOTH of you are frozen at once, the room resets.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

const velvet = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#5a1020'; x.fillRect(0, 0, w, h); x.fillStyle = '#6a1a2a'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) x.fillRect(i * 16, j * 16, 16, 16); }, 5, 5) });
const stageFloor = E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#6a4a2a'; x.fillRect(0, 0, w, h); x.fillStyle = '#5a3c20'; for (let i = 0; i < 4; i++) x.fillRect(i * 16 + 14, 0, 2, h); }, 8, 8) });
const marble = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#d8d0c4'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b8b0a4'; x.lineWidth = 2; for (let i = 0; i < 5; i++){ x.beginPath(); x.moveTo(Math.random() * w, 0); x.bezierCurveTo(Math.random() * w, h / 3, Math.random() * w, h * .6, Math.random() * w, h); x.stroke(); } x.strokeStyle = '#8a8478'; x.strokeRect(0, 0, w, h); }, 5, 5) });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const phantom = (R, extra) => R.ghost({ look: 'hat', tint: 0xf2f2f2, invisible: true, label: 'the Phantom', sp: 2.2, radius: 9, ...extra });
function shadowGrab(st, R, E, dt, exposed, key = 'sg', t = 1){
  st[key] = st[key] || [0, 0];
  for (const p of E.P){
    if (!R.inside(p.pos) || p.frozen || p.dashing || !exposed(p)){ st[key][p.idx] = 0; continue; }
    st[key][p.idx] += dt; if (st[key][p.idx] > t){ st[key][p.idx] = 0; E.freeze(p.idx, E.FREEZE, `Shadow hands dragged ${E.names()[p.idx]} into the dark!`); }
  }
}

/* =============================================================== */
const PROGS = [[-8, 7], [7.5, 5], [-3, 15], [8, 18.5]];
const lobby = {
  name: 'The Grand Lobby',
  floor: marble,
  notes: [[3, 1.6, '“Some things can only be seen with the second sight. HOLD the lantern button.”', 1.6]],
  hint: 'HOLD ☀ / F (don\'t just tap it) to use Ghost Sight. It reveals the hidden programs AND the invisible Phantom wandering the lobby. Sight drains fast, so take turns looking and calling out what you see.',
  build(R, E){
    const T = E.THREE;
    for (const [x, lz] of [[-5, 6], [5, 6], [-5, 13], [5, 13]]){ const c = new T.Mesh(new T.CylinderGeometry(.6, .7, 3.2, 14), E.mat(0xe8e0d4)); R.place(c, x, lz, 1.6); R.block(x - .6, lz - .6, x + .6, lz + .6, .01, E.mat(0)); }
    R.floor(-1.1, .8, 1.1, 18.8, E.tex('runner_floor', { rx: 1, ry: 8 }), .01);   // tex/level8/runner_floor
    const desk = new T.Mesh(new T.BoxGeometry(4, 1, 1), E.mat(0x5a2a1a)); R.place(desk, 0, 19.5, .5); R.block(-2, 19, 2, 20, .01, E.mat(0));
    phantom(R, { home: [0, 10] });
    this.orbs = orbRow(E, R, 4, -1.95, 21.3);
  },
  init(){ return { got: 0, items: PROGS.map(([x, lz]) => mkItem('program', x, lz, { hidden: true })) }; },
  solve(st){ st.got = 4; },
  itemMesh(k, E){ if (k !== 'program') return null; const T = E.THREE; return new T.Mesh(new T.BoxGeometry(.5, .05, .7), E.glow(0xd8a8ff, 1.2)); },
  onPick(st, R, E, it){ if (it.k !== 'program') return true; it.s = 3; st.got++; E.ev('chime', st.got < 4 ? `Found a ghostly program! (${st.got}/4)` : '', st.got); if (st.got >= 4 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'All four programs — the usher opens the theatre doors.'); } return false; },
  visual(dt, t, st, R){ setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 4 ? 'The theatre doors are open!' : `Find the 4 ghostly programs. They're invisible — <b>HOLD ☀ / F for Ghost Sight</b>. An invisible Phantom roams here too. (${st.got}/4)`; }
};

/* =============================================================== */
const MARKS = [[-7, 6], [7, 8], [-5, 16], [6, 18]];
const statues = {
  name: 'Musical Statues',
  floor: stageFloor,
  notes: [[3, 1.6, '“Dance while the music plays. When it stops — DON\'T MOVE.”', 1.5]],
  hint: 'Move only while the music is playing (and dodge the dancers). The moment it stops, freeze in place — the chorus is watching for anyone who moves. Light all four spotlight marks.',
  build(R, E){
    const T = E.THREE;
    MARKS.forEach(([x, lz], i) => R.plate('m' + i, x, lz, 0xfff1a0, 1.8, '★'));
    this.chorus = [0, 1, 2, 3, 4].map(i => R.ghost({ home: [-8 + i * 4, 12], look: 'normal', tint: 0xffd8f0, label: 'a chorus dancer', sp: 0, think: (g, dt, st, R2, E2, P) => {
      if (!st.play) { g.ry = Math.PI; return true; }
      const a = st.ct * 1.1 + i * 1.26;
      g.x = Math.sin(a) * 7.5; g.z = R2.Z(12 + Math.sin(a * 1.7 + i) * 6.5); g.ry = a;
      E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), 1); g.ret = false;
      return true;
    } }));
    this.lamp = new T.PointLight(0xfff1a0, 0, 30, 1); R.place(this.lamp, 0, 11, 6);
  },
  init(){ return { play: 0, t: 3, ct: 0, lit: 0, mv: [0, 0] }; },
  solve(st){ st.lit = 15; },
  host(dt, st, R, E){
    if (st.lit === 15) return;
    const L = R.local; L.pp = L.pp || {};
    const any = E.P.some(p => R.inside(p.pos)); if (!any) return;
    st.t -= dt;
    if (st.t <= 0){ st.play ^= 1; st.t = st.play ? 4 + Math.random() * 3.5 : 3.2; E.ev(st.play ? 'chime' : 'gong', st.play ? '♪ The music plays — dance!' : 'The music STOPS — freeze!', st.play ? 3 : 200); }
    if (st.play) st.ct += dt;
    for (const p of E.P){
      const pr = L.pp[p.idx], v = pr ? Math.hypot(p.pos.x - pr[0], p.pos.z - pr[1]) / dt : 0;
      if (!st.play && st.t < 2.6 && R.inside(p.pos) && !p.frozen && v > 1.2){ E.freeze(p.idx, E.FREEZE, `The chorus saw ${E.names()[p.idx]} move!`); }
      L.pp[p.idx] = [p.pos.x, p.pos.z];
    }
    MARKS.forEach((m, i) => { if (!(st.lit & (1 << i)) && R.on('m' + i)){ st.lit |= 1 << i; E.ev('chime', `Spotlight! (${[1, 2, 4, 8].filter(b => st.lit & b).length}/4)`, i + 1); } });
    if (st.lit === 15 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'Bravo! The curtain opens on the exit.'); }
  },
  visual(dt, t, st, R, E){
    MARKS.forEach((m, i) => R.glow('m' + i, st.lit & (1 << i) ? 1.6 : .4));
    this.lamp.intensity = st.play ? 2 + Math.sin(t * 8) : .6;
    if (st.play && st.lit !== 15 && R.inside(E.me.pos)){ this._mt = (this._mt || 0) - dt; if (this._mt <= 0){ this._mt = .3; this._mi = ((this._mi || 0) + 1) % 8; E.sfx.tone([392, 440, 494, 523, 587, 523, 494, 440][this._mi], .25, 0, 'triangle'); } }
  },
  bar(st, R, E){ if (st.lit === 15 || !R.inside(E.me.pos)) return null; return st.play ? { frac: 1, label: '♪ MUSIC — move!', color: '#8affc1' } : { frac: st.t / 3.2, label: 'SILENCE — don\'t move!', color: '#ff5a5a' }; },
  objective(st, R, E){ return st.lit === 15 ? 'Bravo! Exit open.' : `Light all 4 ★ spotlight marks. Move only while the music plays — when it stops, <b>stand perfectly still</b> or the chorus freezes you. (${[1, 2, 4, 8].filter(b => st.lit & b).length}/4)`; }
};

/* =============================================================== */
const FC = [[-10, -4.83], [-4.83, .33], [.33, 5.5]], FROWS = [5, 9.5, 14, 18.5];
const ROPES = [2240, 896, 2053, 2072];
const fly = {
  name: 'The Fly Gallery',
  floor: stageFloor,
  notes: [[7.5, 1.5, '“Each rope raises some scenery and lowers some. Up on the gallery, you see it all.”', 1.4]],
  hint: 'One of you goes up the gallery on the right and pulls ropes (each rope raises and lowers several flats). The other crosses the stage through the gaps. You may need to pull a rope AFTER your partner has moved. Mind the invisible Phantom on the gallery!',
  build(R, E){
    const T = E.THREE;
    R.wall(5.5, 2.5, 6, 19.3); R.wall(6, 19.3, 10, 19.7);
    R.door('gg', 6, 19.2, 10, 19.8, 'gate');
    R.wall(-4.98, 5.2, -4.68, 9.3); R.wall(.18, 5.2, .48, 9.3); R.wall(-4.98, 14.2, -4.68, 18.3); R.wall(.18, 14.2, .48, 18.3);
    this.flats = [];
    FROWS.forEach((lz, r) => FC.forEach(([x1, x2], c) => {
      const m = new T.Mesh(new T.BoxGeometry(x2 - x1 - .05, 2.4, .3), E.mat([0x2a4a6a, 0x6a2a4a, 0x4a6a2a, 0x6a5a2a][r], { map: null }));
      R.place(m, (x1 + x2) / 2, lz, 1.2); this.flats.push(m);
    }));
    ROPES.forEach((r, i) => { R.plate('r' + i, 8, 4.5 + i * 4.3, 0xc8a26a, 1.4, String(i + 1)); const rope = new T.Mesh(new T.CylinderGeometry(.04, .04, 3, 6), E.mat(0xc8a26a)); R.place(rope, 9.4, 4.5 + i * 4.3, 1.5); });
    phantom(R, { home: [8, 16], b: [6.3, 9.8, 2.5, 19], sp: 1.9, radius: 7 });
  },
  init(){ return { fl: 0, crossed: 0 }; },
  solve(st){ st.fl = 4095; st.crossed = 1; },
  colliders(st, R){ const out = []; FROWS.forEach((lz, r) => FC.forEach(([x1, x2], c) => { if (!(st.fl >> (r * 3 + c) & 1)) out.push(R.rect(x1, lz - .2, x2, lz + .2)); })); return out; },
  host(dt, st, R, E){
    ROPES.forEach((m, i) => { if (R.edge('r' + i)){ st.fl ^= m; E.ev('whoosh', 'Ropes creak — scenery rises and falls!'); } });
    for (const p of E.P) if (R.inside(p.pos) && p.pos.x < 5.5 && R.lz(p.pos.z) > 18.8 && !st.crossed){ st.crossed = 1; R.open('gg'); E.ev('chime', 'Across the stage! The gallery gate opens.', 3); }
    if (st.crossed) R.open('gg');
    if (!R.isOpen('exit') && st.crossed && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.8 || R.lz(p.pos.z) > 22)){ R.open('exit'); E.ev('door', 'The stage door opens!'); }
  },
  visual(dt, t, st, R, E){ this.flats.forEach((m, k) => { const up = st.fl >> k & 1; m.position.y += ((up ? 3.9 : 1.2) - m.position.y) * E.damp(5, dt); }); },
  objective(st, R, E){ return st.crossed ? 'Meet at the north end — the exit is there.' : 'Scenery flats block the stage. Ropes on the gallery (right side) raise and lower them — each rope moves several. One pulls ropes, one crosses the stage.'; }
};

/* =============================================================== */
const STARS = [[-7, 7], [-2, 12], [5, 9], [7, 17], [-6, 18]];
const spotlight = {
  name: 'The Spotlight Booth',
  floor: stageFloor,
  dark: .92,
  notes: [[-8, 1.4, '“Stand on the pad and lean — the spotlight follows your lean.”', 1.3]],
  hint: 'One of you stands on the control pad (bottom-left) and leans in the direction the light should move — further from the middle = faster. The other walks the dark stage and must stay inside the light while collecting the 5 stars.',
  build(R, E){
    const T = E.THREE;
    R.plate('JS', -7.8, 2.2, 0x9ad8ff, 2.6, '✛');
    const lamp = new T.PointLight(0xfff1c0, 2, 4, 1.5); R.place(lamp, -7.8, 2.2, 2);
    this.pool = new T.Mesh(new T.CircleGeometry(2.6, 30), new T.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: .35, depthWrite: false })); this.pool.rotation.x = -Math.PI / 2; E.scene.add(this.pool);
    this.light = new T.PointLight(0xfff6d0, 14, 9, 1.4); E.scene.add(this.light);
    this.hm = [0, 1].map(() => { const h = new T.Mesh(new T.ConeGeometry(.4, 1.2, 6), E.mat(0x111111)); h.visible = false; E.scene.add(h); return h; });
  },
  init(){ return { sx: -2, sl: 6, got: 0, items: STARS.map(([x, lz]) => mkItem('star', x, lz, { yRest: .7 })) }; },
  solve(st){ st.got = 5; },
  itemMesh(k, E){ if (k !== 'star') return null; const T = E.THREE; return new T.Mesh(new T.OctahedronGeometry(.35), E.glow(0xffe14d, 1.4)); },
  onPick(st, R, E, it){ if (it.k !== 'star') return true; it.s = 3; st.got++; E.ev('chime', st.got < 5 ? `Star! (${st.got}/5)` : '', st.got); if (st.got >= 5 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'Curtain call — the exit opens!'); } return false; },
  host(dt, st, R, E){
    const op = E.P.find(p => R.at('JS', p.pos) && !p.frozen);
    if (op){ const pl = R.plateObj('JS'), dx = op.pos.x - pl.x, dl = -(op.pos.z - pl.z); const k = 4.5; st.sx += dx * k * dt; st.sl += dl * k * dt; }
    else if (E.solo()){ const p = E.P[0]; if (p && R.inside(p.pos)){ const dx = p.pos.x - st.sx, dl = R.lz(p.pos.z) - st.sl, d = Math.hypot(dx, dl); if (d > .1){ const s = Math.min(d, 2.6 * dt); st.sx += dx / d * s; st.sl += dl / d * s; } } }
    st.sx = E.clamp(st.sx, -9, 9); st.sl = E.clamp(st.sl, 4, 20.5);
    shadowGrab(st, R, E, dt, p => R.lz(p.pos.z) > 4.6 && Math.hypot(p.pos.x - st.sx, R.lz(p.pos.z) - st.sl) > 2.6, 'sg', 1.1);
  },
  visual(dt, t, st, R, E){
    this.pool.position.set(st.sx, .05, R.Z(st.sl)); this.light.position.set(st.sx, 3.5, R.Z(st.sl));
    for (let i = 0; i < 2; i++){ const v = (st.sg || [0, 0])[i], pos = E.playerPos(i), h = this.hm[i]; h.visible = !!pos && v > .3; if (h.visible) h.position.set(pos.x - .4, -1 + v, pos.z); }
  },
  objective(st, R, E){ return st.got >= 5 ? 'The exit is open!' : `Collect the 5 stars on the dark stage — but shadow hands grab anyone OUTSIDE the spotlight. ${E.solo() ? 'The light slowly follows you.' : 'One of you steers the light from the ✛ pad (lean to move it).'} (${st.got}/5)`; }
};

/* =============================================================== */
const RAILS = [-7.5, -2.5, 2.5, 7.5], INSTR = ['violin', 'cello', 'flute', 'horn'], BASE = [440, 196, 587, 262];
const pitchOf = (i, lz) => BASE[i] * Math.pow(2, (lz - 11) / 12);
const orchestra = {
  name: 'The Orchestra Pit',
  floor: E => E.mat(0x2a1a14),
  notes: [[0, 1.4, '“Tune every instrument to the Phantom\'s pitch. Listen for the wobble.”', 1.4]],
  hint: 'Stand on an instrument\'s rail — sliding up and down changes its pitch. When it\'s close to the right note you hear a slow wobble; when the wobble stops, hold still. The conductor\'s podium (north) shows needles for every instrument — whoever stands there can call out "higher" or "lower".',
  build(R, E){
    const T = E.THREE;
    this.rails = RAILS.map((x, i) => { R.floor(x - .8, 4, x + .8, 18, E.mat(0x3a3a44), .012); const g = new T.Mesh(new T.BoxGeometry(1.6, .06, .3), E.glow([0xd08a3a, 0x8a4a2a, 0xd8d8e8, 0xc9a24a][i], .5)); E.scene.add(g); return g; });
    R.plate('POD', 0, 20.3, 0x9ad8ff, 1.6, '𝄞');
    this.needles = textPlane(E, 4, 1.6); R.place(this.needles, 0, 21.4, 2.2);
    R.ghost({ home: [0, 11], look: 'hat', tint: 0xf2f2f2, invisible: true, label: 'the Phantom', sp: 1.6, radius: 6 });
  },
  init(){ return { tg: RAILS.map(() => +(5.5 + Math.random() * 11).toFixed(2)), cur: [11, 11, 11, 11], hold: [0, 0, 0, 0], lock: 0 }; },
  solve(st){ st.lock = 15; },
  railOf(R, pos){ const lz = R.lz(pos.z); if (lz < 4 || lz > 18) return -1; return RAILS.findIndex(x => Math.abs(pos.x - x) < .8); },
  host(dt, st, R, E){
    if (st.lock === 15) return;
    for (const p of E.P){
      const i = this.railOf(R, p.pos); if (i < 0 || (st.lock & (1 << i)) || p.frozen) continue;
      st.cur[i] = +R.lz(p.pos.z).toFixed(2);
      if (Math.abs(st.cur[i] - st.tg[i]) < .45){ st.hold[i] += dt; if (st.hold[i] > 1.5){ st.lock |= 1 << i; E.ev('chime', `The ${INSTR[i]} is in tune! (${[1, 2, 4, 8].filter(b => st.lock & b).length}/4)`, i + 1); } }
      else st.hold[i] = 0;
    }
    if (st.lock === 15 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'The orchestra plays in perfect harmony. The doors open!'); }
  },
  local(dt, st, R, E){
    const i = this.railOf(R, E.me.pos); if (i < 0 || (st.lock & (1 << i)) || E.phase !== 'play') return;
    const L = R.local; L.bt = (L.bt || 0) - dt;
    if (L.bt <= 0){ L.bt = 1.2; const f = pitchOf(i, R.lz(E.me.pos.z)), ft = pitchOf(i, st.tg[i]); E.beep(f, 1.15, 'sine', .07); E.beep(ft, 1.15, 'sine', .07); }
  },
  visual(dt, t, st, R, E){
    this.rails.forEach((g, i) => { g.position.set(RAILS[i], .08, R.Z(st.cur[i])); g.material.emissiveIntensity = st.lock & (1 << i) ? 1.6 : .5; });
    const k = st.cur.map((c, i) => Math.round((c - st.tg[i]) * 4)).join(',') + st.lock;
    if (this._k !== k){ this._k = k; redraw(this.needles, (c, w, h) => { c.fillStyle = '#1a120a'; c.fillRect(0, 0, w, h); RAILS.forEach((_, i) => { const cx = 32 + i * 64, cy = h / 2; c.strokeStyle = '#6a5a3a'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy + 20, 26, Math.PI, 0); c.stroke(); const off = st.lock & (1 << i) ? 0 : E.clamp((st.cur[i] - st.tg[i]) / 6, -1, 1); const a = -Math.PI / 2 + off * 1.3; c.strokeStyle = st.lock & (1 << i) ? '#4ac06a' : '#ffd88a'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, cy + 20); c.lineTo(cx + Math.cos(a) * 24, cy + 20 + Math.sin(a) * 24); c.stroke(); }); }); }
  },
  panel(st, R, E){
    const onPod = R.at('POD', E.me.pos), i = this.railOf(R, E.me.pos);
    if (!onPod && !(E.solo() && i >= 0)) return null;
    const rows = RAILS.map((_, k) => { const d = st.cur[k] - st.tg[k]; const s = st.lock & (1 << k) ? '✓ in tune' : Math.abs(d) < .45 ? 'hold it!' : d > 0 ? '▼ go LOWER (south)' : '▲ go HIGHER (north)'; return `<div>${INSTR[k]}: <b>${s}</b></div>`; });
    return `<div class="big1">𝄞</div>${E.solo() ? rows[i] : rows.join('')}`;
  },
  objective(st, R, E){ return st.lock === 15 ? 'In perfect harmony — the doors are open!' : `Tune all 4 instruments: stand on a rail and slide north/south to change its pitch. Hold still when the "wobble" stops. The 𝄞 podium shows which way each one is off. (${[1, 2, 4, 8].filter(b => st.lock & b).length}/4)`; }
};

/* =============================================================== */
const TD = { C: 10, Rr: 8 }, tdx = c => -9 + 2 * c, tdl = r => 4 + 2 * r;
// the diva only accepts a rose THROWN onto her spotlight mark, which drifts around the stage — and a rose that lands
// in an open trapdoor is lost (it reappears where it was found)
const ROSES = [[-7, 6], [5, 5], [-1, 11], [7, 14], [-5, 18]];
const markAt = t => [Math.sin(t * .23) * 5.5, 11.5 + Math.sin(t * .37 + 1) * 5.5];
const trapdoors = {
  name: 'The Trapdoor Stage',
  floor: stageFloor,
  notes: [[3, 1.6, '“Where the Phantom walks, the trapdoors open.”', 1.4]],
  hint: 'The diva wants five roses — THROWN onto her golden spotlight mark (it drifts slowly round the stage). Pick up a rose, face the mark and tap ⚡ to toss it. The invisible Phantom opens trapdoors wherever he walks: a rose that lands in an open trapdoor is lost and reappears where it was found, and so do you if you step in one. Hold ☀ for Ghost Sight to see him coming.',
  build(R, E){
    const T = E.THREE;
    this.holes = [];
    for (let r = 0; r < TD.Rr; r++) for (let c = 0; c < TD.C; c++){ const m = R.floor(tdx(c) - .95, tdl(r) - .95, tdx(c) + .95, tdl(r) + .95, new T.MeshBasicMaterial({ color: 0x050303, transparent: true, opacity: 0 }), .02); this.holes.push(m); }
    this.mark = new T.Mesh(new T.RingGeometry(.9, 1.3, 32), new T.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: .55, side: T.DoubleSide, depthWrite: false })); this.mark.rotation.x = -Math.PI / 2; E.scene.add(this.mark);
    this.ph = R.ghost({ home: [0, 11], look: 'hat', tint: 0xf2f2f2, invisible: true, label: 'the Phantom', sp: 0, think: (g, dt, st, R2, E2, P) => {
      const m = g.mem; m.t = (m.t || 0) - dt;
      if (m.t <= 0 || !m.w){ const T2 = E2.targetsOf(g, P).filter(p => R2.inside(p.pos)); const p = T2.length && Math.random() < .5 ? T2[Math.floor(Math.random() * T2.length)] : null; m.w = p ? [p.pos.x, R2.lz(p.pos.z)] : [-8 + Math.random() * 16, 4 + Math.random() * 15]; m.t = 3; }
      E2.stepToward(g, m.w[0], R2.Z(m.w[1]), 2.3 * E2.GMULT, dt);
      const lz = R2.lz(g.z), c = Math.floor((g.x + 10) / 2), r = Math.floor((lz - 3) / 2);
      if (c >= 0 && c < TD.C && r >= 0 && r < TD.Rr){ st.open[r * TD.C + c] = 3.5; }
      E2.ghostTouch(g, E2.targetsOf(g, P), E2.names()); g.ret = false;
      return true;
    } });
  },
  init(){ return { open: Array(TD.C * TD.Rr).fill(0), got: 0, mt: 0, items: ROSES.map(([x, lz]) => mkItem('rose', x, lz)) }; },
  solve(st){ st.got = 5; st.open.fill(0); st.items.forEach(it => it.s = 3); },
  itemMesh(k, E){ if (k !== 'rose') return null; const T = E.THREE, g = new T.Group(); const s = new T.Mesh(new T.CylinderGeometry(.03, .03, .6, 5), E.mat(0x2a6a2a)); g.add(s); const b = new T.Mesh(new T.SphereGeometry(.18, 10, 8), E.glow(0xd01030, .6)); b.position.y = .35; g.add(b); return g; },
  onLand(st, R, E, it){
    if (it.k !== 'rose' || it.s !== 0) return;
    const [mx, ml] = markAt(st.mt);
    if (Math.hypot(it.x - mx, it.lz - ml) < 1.5){ it.s = 3; st.got++; E.ev('chime', st.got < 5 ? `The diva catches the rose! (${st.got}/5)` : '', st.got); if (st.got >= 5 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'The diva is pleased — the stage door opens!'); } return; }
    const c = Math.floor((it.x + 10) / 2), r = Math.floor((it.lz - 3) / 2);
    if (c >= 0 && c < TD.C && r >= 0 && r < TD.Rr && st.open[r * TD.C + c] > 0){ it.x = it.hx; it.lz = it.hlz; E.ev('thud', 'The rose fell through a trapdoor — it\'s back where you found it.'); }
  },
  pits(st, R){ const out = []; st.open.forEach((v, i) => { if (v > 0){ const c = i % TD.C, r = Math.floor(i / TD.C); out.push(R.rect(tdx(c) - 1, tdl(r) - 1, tdx(c) + 1, tdl(r) + 1)); } }); return out; },
  host(dt, st, R, E){ st.mt += dt; for (let i = 0; i < st.open.length; i++) if (st.open[i] > 0) st.open[i] = Math.max(0, st.open[i] - dt); },
  visual(dt, t, st, R, E){ this.holes.forEach((m, i) => { m.material.opacity += ((st.open[i] > 0 ? .95 : 0) - m.material.opacity) * E.damp(12, dt); }); const [mx, ml] = markAt(st.mt); this.mark.position.set(mx, .07, R.Z(ml)); this.mark.visible = st.got < 5; this.mark.material.opacity = .45 + Math.sin(t * 3) * .15; },
  objective(st, R, E){ return st.got >= 5 ? 'The stage door is open!' : `Toss 5 roses onto the diva's drifting <b style="color:#ffd34a">golden mark</b> (pick one up, face the mark, ⚡). Trapdoors open wherever the INVISIBLE Phantom walks — a rose that lands in one is lost. Ghost Sight shows him. (${st.got}/5)`; }
};

/* =============================================================== */
const MQ = { cx: 0, cl: 11.5, n: 8 };
const masquerade = {
  name: 'The Masquerade',
  floor: marble,
  notes: [[3, 1.6, '“The Phantom hides among the dancers. Only the second sight sees through his mask.”', 1.5]],
  hint: 'Use Ghost Sight near the dancers — the Phantom glows RED. Tag him by walking into him. Tag the wrong dancer and you\'re frozen. He changes disguise after each tag. One of you looks and pings, the other tags.',
  build(R, E){
    const tints = [0xffd8f0, 0xd8f0ff, 0xf0ffd8, 0xffe8c8, 0xe8d8ff, 0xd8fff0, 0xfff0d8, 0xf0d8ff];
    this.dancers = tints.map((tint, i) => R.ghost({ home: [0, 11.5], look: 'hat', tint, harmless: true, label: 'a masked dancer', sp: 0, think: (g, dt, st, R2) => {
      const a = st.a + i * Math.PI * 2 / MQ.n, rr = 5.5 + Math.sin(st.a * 2 + i) * 1.5;
      g.x = MQ.cx + Math.sin(a) * rr; g.z = R2.Z(MQ.cl + Math.cos(a) * rr * .9); g.ry = a + Math.PI / 2; return true;
    } }));
    const T = E.THREE;
    this.redGlow = new T.PointLight(0xff2020, 0, 4, 1.5); E.scene.add(this.redGlow);
    this.orbs = orbRow(E, R, 3, -1.3, 21.3);
  },
  init(){ return { a: 0, ph: Math.floor(Math.random() * MQ.n), round: 0, cd: [0, 0] }; },
  solve(st){ st.round = 3; },
  host(dt, st, R, E){
    if (st.round >= 3) return;
    if (E.P.some(p => R.inside(p.pos))) st.a += dt * (.35 + st.round * .1);
    for (const p of E.P){
      st.cd[p.idx] = Math.max(0, st.cd[p.idx] - dt);
      if (p.frozen || st.cd[p.idx] > 0) continue;
      const i = this.dancers.findIndex(g => Math.hypot(g.x - p.pos.x, g.z - p.pos.z) < 1.15);
      if (i < 0) continue;
      st.cd[p.idx] = 1.5;
      if (i === st.ph){ st.round++; let n; do { n = Math.floor(Math.random() * MQ.n); } while (n === st.ph); st.ph = n; E.ev('gong', st.round < 3 ? `Unmasked! But he slips into another disguise… (${st.round}/3)` : '', 180); }
      else E.freeze(p.idx, E.FREEZE, `Wrong dancer! ${E.names()[p.idx]} is frozen by an offended guest.`);
    }
    if (st.round >= 3 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'The Phantom flees the ball! The doors open.'); }
  },
  visual(dt, t, st, R, E){
    const g = this.dancers[st.ph], see = E.sight && Math.hypot(g.x - E.me.pos.x, g.z - E.me.pos.z) < 6.5 && st.round < 3;
    this.redGlow.intensity = see ? 8 : 0; this.redGlow.position.set(g.x, 1.6, g.z);
    setOrbs(this.orbs, st.round);
  },
  objective(st, R, E){ return st.round >= 3 ? 'The doors are open!' : `The Phantom is disguised as one of the dancers. <b>Ghost Sight</b> nearby shows him glowing RED. Tag him (walk into him) 3 times — tagging the wrong dancer freezes you. (${st.round}/3)`; }
};

/* =============================================================== */
const ROPES8 = [[-8.5, 3], [8.5, 3], [-8.5, 19.5], [8.5, 19.5]];
const chandelier = {
  name: 'The Chandelier Hall',
  floor: velvet,
  notes: [[0, 1.6, '“Cut the four ropes and the great chandelier will fall.”', 1.4]],
  hint: 'The chandelier swings across the hall and slowly changes direction. Watch its path and only stand on a rope plate when it\'s swinging the other way. Each rope takes 2 seconds.',
  build(R, E){
    const T = E.THREE, gold = E.mat(0xd4af37, { metalness: .8, roughness: .3 });
    const g = new T.Group(); const ring = new T.Mesh(new T.TorusGeometry(1.4, .15, 8, 24), gold); ring.rotation.x = Math.PI / 2; g.add(ring);
    for (let i = 0; i < 8; i++){ const c = new T.Mesh(new T.SphereGeometry(.18, 8, 6), E.glow(0xfff1c0, 1.5)); c.position.set(Math.cos(i / 8 * 6.28) * 1.4, .2, Math.sin(i / 8 * 6.28) * 1.4); g.add(c); }
    const l = new T.PointLight(0xfff1c0, 8, 12, 1.3); g.add(l);
    this.ch = g; E.scene.add(g);
    this.chain = new T.Mesh(new T.CylinderGeometry(.06, .06, 1, 6), gold); E.scene.add(this.chain);
    this.ropes = ROPES8.map(([x, lz], i) => { R.plate('r' + i, x, lz, 0xc8a26a, 1.6, '✂'); const r = new T.Mesh(new T.CylinderGeometry(.05, .05, 3, 6), E.mat(0xc8a26a)); return R.place(r, x + (x < 0 ? -.9 : .9), lz, 1.5); });
  },
  init(){ return { t: 0, cut: [0, 0, 0, 0], n: 0, done: 0 }; },
  solve(st){ st.n = 4; st.done = 1; },
  pos(st, R){ const th = st.t * .22, sw = Math.sin(st.t * 1.15) * 8.5; return [Math.cos(th) * sw, 11 + Math.sin(th) * sw * .95]; },
  host(dt, st, R, E){
    if (st.done) return;
    if (E.P.some(p => R.inside(p.pos))) st.t += dt * E.GMULT;
    const [cx, cl] = this.pos(st, R);
    for (const p of E.P) if (R.inside(p.pos) && !p.frozen && !p.dashing && Math.hypot(p.pos.x - cx, R.lz(p.pos.z) - cl) < 1.8) E.freeze(p.idx, E.FREEZE, `The chandelier slammed into ${E.names()[p.idx]}!`);
    for (let i = 0; i < 4; i++){
      if (st.cut[i] >= 2) continue;
      if (E.P.some(p => R.at('r' + i, p.pos) && !p.frozen)){ st.cut[i] += dt; if (st.cut[i] >= 2){ st.n++; E.ev('thud', st.n < 4 ? `Snip! A rope is cut. (${st.n}/4)` : ''); } } else st.cut[i] = Math.max(0, st.cut[i] - dt * .5);
    }
    if (st.n >= 4){ st.done = 1; R.open('exit'); E.ev('boom', 'CRASH! The great chandelier falls and shatters — the exit is clear!'); }
  },
  visual(dt, t, st, R, E){
    const [cx, cl] = st.done ? [0, 11] : this.pos(st, R);
    this.ch.position.set(cx, st.done ? .3 : 1.6, R.Z(cl)); this.ch.rotation.z = st.done ? .4 : 0;
    this.chain.visible = !st.done; this.chain.position.set(cx, 5, R.Z(cl)); this.chain.scale.y = 6.6;
    this.ropes.forEach((r, i) => r.visible = st.cut[i] < 2);
  },
  bar(st, R, E){ const i = [0, 1, 2, 3].find(k => R.at('r' + k, E.me.pos)); if (i === undefined || st.cut[i] >= 2) return null; return { frac: st.cut[i] / 2, label: 'Cutting…', color: '#c8a26a' }; },
  objective(st, R, E){ return st.done ? 'The chandelier is down — onward!' : `Cut all four ropes (stand on ✂ for 2 seconds). Watch out for the swinging chandelier! (${st.n}/4)`; }
};

/* =============================================================== */
const ORGAN = [0, 21], STOPS = [[-4.5, 16], [4.5, 16], [0, 12]];
const organ = {
  name: 'The Organ Loft',
  exitX: [6.5, 9.5],
  floor: velvet,
  notes: [[3.5, 1.4, '“The organ\'s chords freeze the air. The gap always points at whoever plays the keys.”', 1.4]],
  hint: 'Freezing sound rings blast out from the organ. Each ring has a gap that points at whoever stands on the keyboard (the long strip at the south end). The keyboard player slides left and right to aim the gap at their partner, who walks through it to pull the three organ stops.',
  build(R, E){
    const T = E.THREE;
    const org = new T.Group(); for (let i = 0; i < 9; i++){ const p = new T.Mesh(new T.CylinderGeometry(.22, .22, 2 + Math.abs(4 - i) * -.25 + 2, 10), E.mat(0xc9a24a, { metalness: .8 })); p.position.set(-2 + i * .5, 2, 0); org.add(p); } R.place(org, ORGAN[0], ORGAN[1]); R.block(-2.5, 20.3, 2.5, 21.8, .01, E.mat(0));
    R.floor(-9, .6, 9, 3, E.mat(0xf2f2e8), .015);
    for (let i = 0; i < 18; i++){ const k = new T.Mesh(new T.BoxGeometry(.4, .1, 1.2), E.mat(0x111111)); R.place(k, -8.5 + i, 2.2, .06); }
    STOPS.forEach(([x, lz], i) => R.plate('s' + i, x, lz, 0xd8a8ff, 1.4, '◉'));
    this.rings = [0, 1, 2, 3, 4].map(() => { const m = new T.Mesh(new T.RingGeometry(.5, 1, 64, 1, 0, Math.PI * 2 - 1.1), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .55, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; E.scene.add(m); return m; });
  },
  init(){ return { rings: [], rt: 0, gap: Math.PI, lit: 0, done: 0 }; },
  solve(st){ st.lit = 7; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    const kb = E.P.find(p => R.inside(p.pos) && R.lz(p.pos.z) < 3 && !p.frozen);
    let want = st.gap;
    if (kb && !E.solo()){ let rel = Math.atan2(kb.pos.x - ORGAN[0], R.lz(kb.pos.z) - ORGAN[1]) - Math.PI; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); want = Math.PI + E.clamp(rel * 2.5, -1.25, 1.25); }
    else if (E.solo() && E.P[0]) want = Math.atan2(E.P[0].pos.x - ORGAN[0], R.lz(E.P[0].pos.z) - ORGAN[1]);
    let d = want - st.gap; d = Math.atan2(Math.sin(d), Math.cos(d)); st.gap += E.clamp(d, -dt * (E.solo() ? .9 : 3), dt * (E.solo() ? .9 : 3));
    if (E.P.some(p => R.inside(p.pos))){ st.rt -= dt; if (st.rt <= 0){ st.rings.push([0, +st.gap.toFixed(3)]); st.rt = 1.7; } }
    for (const r of st.rings) r[0] += dt * 5.5;
    st.rings = st.rings.filter(r => r[0] < 24);
    for (const p of E.P){
      if (!R.inside(p.pos) || p.frozen || p.dashing || R.lz(p.pos.z) < 3.2) continue;      // the keyboard strip is shielded
      const dx = p.pos.x - ORGAN[0], dl = R.lz(p.pos.z) - ORGAN[1], dist = Math.hypot(dx, dl), ang = Math.atan2(dx, dl);
      for (const [rr] of st.rings){ if (Math.abs(dist - rr) < .45){ let a = ang - st.gap; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) > .55 * Math.max(1, 3 / Math.max(rr, 1))) E.freeze(p.idx, E.FREEZE, `A freezing chord hit ${E.names()[p.idx]}!`); } }
    }
    STOPS.forEach((s, i) => { if (!(st.lit & (1 << i)) && R.on('s' + i)){ st.lit |= 1 << i; E.ev('gong', `An organ stop is pulled! (${[1, 2, 4].filter(b => st.lit & b).length}/3)`, 90 + i * 30); } });
    if (st.lit === 7){ st.done = 1; R.open('exit'); E.ev('door', 'The organ falls silent. The loft door opens!'); }
  },
  visual(dt, t, st, R, E){
    this.rings.forEach((m, i) => { const r = st.rings[i]; m.visible = !!r && !st.done; if (r){ m.scale.setScalar(Math.max(.05, r[0])); m.position.set(ORGAN[0], .07, R.Z(ORGAN[1])); m.rotation.z = Math.PI / 2 - st.gap + .55; } });
    STOPS.forEach((s, i) => R.glow('s' + i, st.lit & (1 << i) ? 1.6 : .5));
  },
  objective(st, R, E){ return st.done ? 'The organ is silent — go!' : `Pull the 3 organ stops (◉). Freezing sound rings blast from the organ — each has a GAP pointing at ${E.solo() ? 'you (it turns slowly)' : 'whoever stands on the keyboard strip (south). Keyboard player: slide left/right to swing the gap onto your partner!'} (${[1, 2, 4].filter(b => st.lit & b).length}/3)`; }
};

/* =============================================================== */
const XS = [[-5, 8], [5, 8], [0, 15.5]], RP = [[-9, 3], [9, 3], [0, 20.5]];
const finale = {
  name: 'The Final Act',
  floor: stageFloor,
  notes: [[3, 1.6, '“Lure him onto a mark. Drop the sandbag. Three times, and the curtain falls.”', 1.4]],
  hint: 'The Phantom chases you but is invisible — use Ghost Sight. One of you stands on a red ✕ as bait; when the Phantom reaches the ✕, the other steps on that ✕\'s rope plate and a sandbag drops. Bait: dash away before it lands!',
  build(R, E){
    const T = E.THREE;
    XS.forEach(([x, lz], i) => { const m = new T.Mesh(new T.PlaneGeometry(1.6, .25), new T.MeshBasicMaterial({ color: 0xff2020 })); m.rotation.x = -Math.PI / 2; m.rotation.z = .785; R.place(m, x, lz, .03); const m2 = m.clone(); m2.rotation.z = -.785; R.place(m2, x, lz, .03); R.plate('rp' + i, RP[i][0], RP[i][1], 0xc8a26a, 1.4, String(i + 1)); });
    this.bags = XS.map(() => { const b = new T.Mesh(new T.CylinderGeometry(.6, .7, 1, 10), E.mat(0x8a7a5a)); E.scene.add(b); return b; });
    this.boss = R.ghost({ home: [0, 18], look: 'hat', tint: 0xf2f2f2, invisible: true, scale: 1.4, label: 'the Phantom', sp: 0, touch: 1.2, gone: st => st.hp <= 0, revealed: st => st.vis > 0,
      think: (g, dt, st, R2, E2, P) => {
        if (st.vis > 0) return true;
        const T2 = E2.targetsOf(g, P).filter(p => R2.inside(p.pos)); let best = null, bd = 99;
        for (const p of T2){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
        if (best) E2.stepToward(g, best.pos.x, best.pos.z, (2.7 + (3 - st.hp) * .25) * E2.GMULT, dt);
        if (E2.ghostTouch(g, T2, E2.names(), 1.2)){ g.ret = false; g.rest = 1; }
        return true;
      } });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.6);
  },
  init(){ return { hp: 3, drop: [-1, -1, -1], vis: 0, done: 0, cd: [0, 0, 0] }; },
  solve(st){ st.hp = 0; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    const g = this.boss;
    if (st.vis > 0) st.vis -= dt;
    for (let i = 0; i < 3; i++){
      st.cd[i] = Math.max(0, st.cd[i] - dt);
      const auto = E.solo() && st.cd[i] <= 0 && st.drop[i] < 0 && Math.hypot(g.x - XS[i][0], R.lz(g.z) - XS[i][1]) < 1.2 && st.vis <= 0;
      if ((R.edge('rp' + i) || auto) && st.drop[i] < 0 && st.cd[i] <= 0){ st.drop[i] = .55; E.ev('whoosh', 'A sandbag drops from the rafters!'); }
      if (st.drop[i] > 0){
        st.drop[i] -= dt;
        if (st.drop[i] <= 0){
          st.drop[i] = -1; st.cd[i] = 3; E.ev('thud');
          const [x, lz] = XS[i];
          if (st.vis <= 0 && Math.hypot(g.x - x, R.lz(g.z) - lz) < 1.5){ st.hp--; st.vis = 2.5; g.stun = 2.5; E.ev('gong', st.hp > 0 ? `DIRECT HIT! The Phantom staggers (${3 - st.hp}/3)` : '', 110); }
          for (const p of E.P) if (!p.dashing && Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < 1.3) E.freeze(p.idx, E.FREEZE, `The sandbag landed on ${E.names()[p.idx]}!`);
        }
      }
    }
    if (st.hp <= 0){ st.done = 1; R.open('exit'); E.ev('door', 'The Phantom\'s mask falls to the stage… the curtain closes. The way out is open!'); }
  },
  visual(dt, t, st, R, E){ this.bags.forEach((b, i) => { const [x, lz] = XS[i]; const y = st.drop[i] > 0 ? .5 + st.drop[i] / .55 * 5 : (st.cd[i] > 0 ? .5 : 6); b.position.set(x, y, R.Z(lz)); }); setOrbs(this.orbs, 3 - st.hp); },
  objective(st, R, E){ return st.done ? 'Curtain! The way out is open.' : `The invisible Phantom hunts you (Ghost Sight shows him). ${E.solo() ? 'Lure him over a red ✕ — the sandbag drops on its own.' : 'One of you baits him onto a red ✕, the other steps on that ✕\'s rope plate to drop a sandbag.'} (${3 - st.hp}/3 hits)`; }
};

export default {
  level: 8,
  // texture pack in tex/level8/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'drape', tex: 'opera_curtain', w: 2.2, h: 2.3, y: 1.2, every: 6, color: 0x6a1020 },   // wall dressing: velvet drapes (engine wallDecor)
  wallImg: 'opera_wall', trimImg: 'gilt', texVer: 1,
  texFloors: {
    "The Grand Lobby": "lobby_marble",
    "Musical Statues": "statue_parquet",
    "The Fly Gallery": "fly_catwalk",
    "The Spotlight Booth": "spotlight_boards",
    "The Orchestra Pit": "pit_floor",
    "The Trapdoor Stage": "trapdoor_stage",
    "The Masquerade": "masque_checker",
    "The Chandelier Hall": "chandelier_carpet",
    "The Organ Loft": "organ_carpet",
    "The Final Act": "final_stage"
  },
  title: 'The Opera House',
  tagline: 'Every night at midnight, the show goes on.<br>The audience never leaves its seats.',
  story: 'Red velvet, gold leaf, and a voice singing somewhere you can\'t see. <b>From now on, if you\'re BOTH frozen at the same time, the room resets.</b>',
  winTitle: 'Bravo! You escaped the Opera! 🎭',
  feature: { name: 'Ghost Sight', icon: '👁', how: '<b>HOLD</b> F (PC) or the <b>☀ button</b> (phone) to see invisible ghosts and hidden things. It drains in 5 seconds and recharges when you let go. A quick tap still flashes.' },
  accent: '#d04060',
  wallColor: 0x4a1020,
  trimColor: 0xd4af37,
  doorColor: 0x3a0a14,
  sky: 0x8a5a7a,
  bg: 0x0a0306,
  drone: 49,
  rooms: [lobby, statues, fly, spotlight, orchestra, trapdoors, masquerade, chandelier, organ, finale],
};
