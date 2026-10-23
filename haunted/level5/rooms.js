// Level 5 — The Frozen Monastery. New power: LANTERN FLASH (stuns ghosts). Local coords: x -10..10, lz 0..22.
import { arrivals, orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

const snowFloor = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#dfe8f2'; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++){ x.fillStyle = `rgba(160,180,210,${Math.random() * .25})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, 7); x.fill(); } }, 5, 5) });
const stoneFloor = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#5a5e6a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3a3e48'; x.lineWidth = 3; for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) x.strokeRect(i * 64 + (j % 2) * 32, j * 32, 64, 32); }, 6, 6) });
const wraith = (R, home, extra = {}) => R.ghost({ home, look: 'hood', tint: 0xbfe8ff, sp: 3.3, radius: 11, label: 'a frost wraith', ...extra });

/* =============================================================== */
const CV = { cols: 10, rows: 8 }, cvx = c => -9 + 2 * c, cvl = r => 4 + 2 * r;
const crevasse = {
  name: 'The Crevasse Field',
  floor: snowFloor,
  notes: [[3, 1.8, '“The snow hides the crevasses. Your lantern\'s flash does not lie.”', 1.5]],
  hint: 'Press ☀ / F to flash your lantern — it reveals hidden crevasses near you for a few seconds. It takes 5 seconds to recharge, so take turns flashing and remember the safe snow.',
  build(R, E){
    const T = E.THREE;
    this.holes = [];
    for (let r = 0; r < CV.rows; r++) for (let c = 0; c < CV.cols; c++){
      const m = R.floor(cvx(c) - 1, cvl(r) - 1, cvx(c) + 1, cvl(r) + 1, new T.MeshBasicMaterial({ color: 0x0a1424, transparent: true, opacity: 0 }), .02);
      this.holes.push(m);
    }
    const flag = new T.Mesh(new T.ConeGeometry(.3, .8, 4), E.glow(0xff5a5a, .8)); R.place(flag, 0, 20.5, 1.2);
  },
  init(){
    const pit = Array(CV.rows * CV.cols).fill(1);
    let c = Math.floor(Math.random() * CV.cols), r = 0; pit[c] = 0;
    while (r < CV.rows - 1){
      const opts = [[0, 1], [0, 1], [1, 0], [-1, 0]].filter(([dc]) => c + dc >= 0 && c + dc < CV.cols);
      const [dc, dr] = opts[Math.floor(Math.random() * opts.length)];
      if (dr === 0 && !pit[r * CV.cols + c + dc]) continue;
      c += dc; r += dr; pit[r * CV.cols + c] = 0;
    }
    for (let i = 0; i < pit.length; i++) if (pit[i] && Math.random() < .3) pit[i] = 0;
    return { pit, seen: Array(pit.length).fill(0), rt: 0, rx: 0, rl: 0, done: 0 };
  },
  solve(st){ st.done = 1; st.pit.fill(0); },
  cellOf(R, pos){ const lz = R.lz(pos.z); if (lz < 3 || lz >= 19) return -1; const c = Math.floor((pos.x + 10) / 2), r = Math.floor((lz - 3) / 2); return c >= 0 && c < CV.cols && r >= 0 && r < CV.rows ? r * CV.cols + c : -1; },
  pits(st, R){ const out = []; st.pit.forEach((p, i) => { if (p){ const c = i % CV.cols, r = Math.floor(i / CV.cols); out.push(R.rect(cvx(c) - 1, cvl(r) - 1, cvx(c) + 1, cvl(r) + 1)); } }); return out; },
  onFlash(st, R, E, idx, x, z){ st.rx = +x.toFixed(2); st.rl = +R.lz(z).toFixed(2); st.rt = 3; },
  onFall(st, R, E, idx){ const c = (R.local.last || [])[idx]; if (c >= 0) st.seen[c] = 1; },
  host(dt, st, R, E){
    R.local.last = R.local.last || [-1, -1];
    for (const p of E.P) R.local.last[p.idx] = this.cellOf(R, p.pos);
    if (st.rt > 0) st.rt -= dt;
    if (!st.done && E.P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.3)){ st.done = 1; R.open('exit'); E.ev('door', 'Across the crevasses! The monastery gate opens.'); }
  },
  visual(dt, t, st, R, E){
    this.holes.forEach((m, i) => {
      if (!st.pit[i]){ m.material.opacity = 0; return; }
      const c = i % CV.cols, r = Math.floor(i / CV.cols);
      const shown = st.seen[i] || (st.rt > 0 && Math.hypot(cvx(c) - st.rx, cvl(r) - st.rl) < 6.5);
      const target = shown ? (st.rt > 0 && !st.seen[i] ? Math.min(1, st.rt) : .9) : 0;
      m.material.opacity += (target - m.material.opacity) * E.damp(8, dt);
    });
  },
  objective(st, R, E){ return st.done ? 'The gate is open!' : 'Hidden crevasses lie under the snow. <b>Press ☀ / F to FLASH your lantern</b> — it reveals crevasses near you for a moment. Reach the red flag.'; }
};

/* =============================================================== */
const FLAGS = [[-8, 4.5], [8, 4.5], [-8, 18.5], [8, 18.5]], WHEEL2 = [0, 20], FCOL = ['#ff5a5a', '#5ad1ff', '#ffd84d', '#8aff7a'], FNAME = ['RED', 'BLUE', 'YELLOW', 'GREEN'];
let E5 = null;
const flags = {
  name: 'The Prayer Flags',
  floor: stoneFloor,
  notes: [[0, 1.8, '“Raise the four prayer flags — in the order the wheel speaks them. The wraiths will not like it.”', 1.5]],
  get hint(){ return 'The flags must go up in a set order, and only the prayer wheel (north, middle) shows it — while someone stands on it. Raise a flag out of turn and every flag drops. ' + (E5 && E5.solo() ? 'Read the order, remember it, then go — flash the wraiths (☀/F) when they close in.' : 'One of you reads the order from the wheel while the other raises flags (a couple of seconds on each plate). Flash the wraiths (☀/F) to cover each other.'); },
  build(R, E){
    const T = E.THREE;
    this.flags = FLAGS.map(([x, lz], i) => {
      R.plate('f' + i, x, lz, 0xffd84d, 1.8, '⚑');
      const pole = new T.Mesh(new T.CylinderGeometry(.06, .06, 3.2, 6), E.mat(0x8a6a42)); R.place(pole, x + (x < 0 ? -1.3 : 1.3), lz, 1.6);
      const cloth = new T.Mesh(new T.PlaneGeometry(1.1, .7), E.common('cloth', { color: [0xff5a5a, 0x5ad1ff, 0xffd84d, 0x8aff7a][i], side: T.DoubleSide, emissive: 0x222222, emissiveIntensity: 1 }));
      R.place(cloth, x + (x < 0 ? -.75 : 1.85), lz, .4); return cloth;
    });
    for (const [x, lz] of [[-3, 9], [3, 9], [-3, 14], [3, 14]]) R.block(x - .6, lz - .6, x + .6, lz + .6, 2.6, E.mat(0x7a7e8a));
    // the prayer wheel: shows the flag order only while someone stands on it
    E5 = E; R.plate('wh', WHEEL2[0], WHEEL2[1], 0xd8a8ff, 1.6, '☸');
    this.wheel = new T.Mesh(new T.CylinderGeometry(.55, .55, 1.2, 16), E.mat(0xc9a24a, { metalness: .6, roughness: .35 })); R.place(this.wheel, WHEEL2[0] + 1.4, WHEEL2[1], 1.1);
    this.sign = textPlane(E, 4.2, 1, 1); R.place(this.sign, WHEEL2[0], WHEEL2[1] + 1.4, 2.5);
    wraith(R, [0, 11.5]); wraith(R, [-6, 11.5], { sp: 3.1 }); wraith(R, [6, 11.5], { sp: 3.5 });
  },
  init(R, E){ return { p: [0, 0, 0, 0], done: 0, ord: E.shuffle([0, 1, 2, 3]), k: 0 }; },
  solve(st){ st.p = [1, 1, 1, 1]; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    for (let i = 0; i < 4; i++){
      if (st.p[i] >= 1) continue;
      if (R.on('f' + i)){
        if (i !== st.ord[st.k]){   // out of turn: the wind tears every flag down
          if (st.p.some(v => v > 0) || R.edge('f' + i)){ st.p = [0, 0, 0, 0]; st.k = 0; E.ev('wrong', `The ${FNAME[i].toLowerCase()} flag isn't next — the wind tears every flag down! Check the prayer wheel.`); }
          continue;
        }
        st.p[i] = Math.min(1, st.p[i] + dt / 2); if (st.p[i] >= 1){ st.k++; E.ev('chime', `Flag raised! (${st.k}/4)`, i + 1); }
      }
      else st.p[i] = Math.max(0, st.p[i] - dt / 6);
    }
    if (st.p.every(v => v >= 1)){ st.done = 1; R.open('exit'); E.ev('door', 'All four flags fly! The cloister door opens.'); }
  },
  visual(dt, t, st, R, E){
    this.flags.forEach((f, i) => { f.position.y += ((.4 + st.p[i] * 2.4) - f.position.y) * E.damp(6, dt); f.rotation.y = Math.sin(t * 3 + i) * .3; });
    const read = R.on('wh') && !st.done; if (read) this.wheel.rotation.y += dt * 4;
    const key = read + ':' + st.ord.join('') + st.k + st.done;
    if (key !== this.sk){ this.sk = key; redraw(this.sign, (c, W, H) => { c.fillStyle = '#1a1424'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle';
      if (!read && !st.done){ c.fillStyle = '#8a7aa8'; c.font = 'bold 26px Georgia'; c.fillText('☸ stand on the wheel to read', W / 2, H / 2); return; }
      st.ord.forEach((f, j) => { const x = W * (j + .5) / 4; c.fillStyle = FCOL[f]; c.globalAlpha = j < st.k || st.done ? .35 : 1; c.beginPath(); c.arc(x, H / 2, 20, 0, 7); c.fill(); c.globalAlpha = 1; c.fillStyle = '#ece6ff'; c.font = 'bold 14px system-ui'; c.fillText(String(j + 1), x, H / 2 + 34 > H ? H - 6 : H / 2 + 34); }); }); }
  },
  bar(st, R, E){ const i = [0, 1, 2, 3].find(k => R.at('f' + k, E.me.pos)); if (i === undefined || st.p[i] >= 1) return null; return { frac: st.p[i], label: 'Raising the flag…', color: '#ffd84d' }; },
  objective(st, R, E){ if (st.done) return 'The flags fly — onward!'; const next = R.on('wh') ? ` Next: <b style="color:${FCOL[st.ord[st.k]]}">${FNAME[st.ord[st.k]]}</b>.` : ''; return `Raise the four prayer flags <b>in the order the prayer wheel shows</b> (stand on ☸, north) — out of order, they all drop.${next} Frost wraiths hunt you: <b>FLASH (☀/F)</b>. (${st.k}/4)`; }
};

/* =============================================================== */
const MONKS = [[9.2, 6, -1], [-9.2, 10, 1], [9.2, 14, -1], [-9.2, 18, 1]];
const meditation = {
  name: 'The Meditation Hall',
  floor: E => E.mat(0x3a2a24),
  notes: [[-5, 1.8, '“The monks\' gaze freezes the soul. A bright light makes them blink.”', 1.6]],
  hint: 'Walk up close to a monk and flash him (☀/F) — his gaze stops for a few seconds. Your flash takes 5 seconds to recharge, so take turns: one flashes the next monk while the other runs. You can also dash straight through a gaze.',
  build(R, E){
    MONKS.forEach(([x, lz, s], i) => {
      const mat = R.block(x - .5 * s - .3, lz - .6, x - .5 * s + .3, lz + .6, .5, E.mat(0x8a2a2a), false);
      R.ghost({ home: [x, lz], look: 'hood', tint: 0xd8a05a, sp: 0, label: 'a snow monk', beam: { len: 21, color: 0xbfeaff }, snap: true,
        think: E.AI.sweeper(21, s * Math.PI / 2 - 1.15, s * Math.PI / 2 + 1.15, 2.4 + i * .3) });
    });
    R.plate('A', -4, 20.6, 0xd8a05a, 1.6, '☸'); R.plate('B', 4, 20.6, 0xd8a05a, 1.6, '☸');
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && R.held('A') && R.held('B')){ st.done = 1; R.open('exit'); E.ev('door', 'You reach the altar. The monks bow their heads — the door opens.'); } },
  visual(dt, t, st, R, E){ for (const g of E.ghostsOf(R.i)) if (g.beamMesh) g.beamMesh.visible = !g.w; },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Snow monks sweep the hall with freezing gazes. Flash a monk to make him blink, then run past. ${E.solo() ? 'Stand on both altar mats.' : 'Both of you stand on the altar mats.'}`; }
};

/* =============================================================== */
const LK = { C: 6, Rr: 4, rocks: [[1, 1], [4, 1]] }, lkx = c => -7.5 + 3 * c, lkl = r => 6.5 + 3 * r;
const isRock = (c, r) => LK.rocks.some(([a, b]) => a === c && b === r);
const lake = {
  name: 'The Frozen Lake',
  floor: snowFloor,
  notes: [[-5, 2.4, '“Each patch of ice holds once. Crack every one and the lake gives up its key.”', 1.6]],
  hint: 'Every ice tile breaks the moment you step OFF it. You must crack every single tile and both reach the far shore. Plan two snaking routes that never cross — one of you takes the left side, one the right. Falling in refreezes the lake.',
  build(R, E){
    const T = E.THREE;
    this.tiles = [];
    this.crackTex = E.canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#e8f4ff'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6a8ab0'; x.lineWidth = 2; for (let i = 0; i < 7; i++){ x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(Math.random() * w, Math.random() * h); x.stroke(); } });
    for (let r = 0; r < LK.Rr; r++) for (let c = 0; c < LK.C; c++){
      if (isRock(c, r)){ R.block(lkx(c) - 1.2, lkl(r) - 1.2, lkx(c) + 1.2, lkl(r) + 1.2, 1.2, E.mat(0x6a6e78)); this.tiles.push(null); continue; }
      const m = new T.Mesh(new T.BoxGeometry(2.9, .1, 2.9), E.tex('lake_ice', { color: 0xbfe6ff, roughness: .1, metalness: .2, emissive: 0x2a4a6a, emissiveIntensity: .3, tint: 0xd8f0ff }));
      R.place(m, lkx(c), lkl(r), .05); this.tiles.push(m);
    }
    R.floor(-10, 5, 10, 17, new T.MeshBasicMaterial({ color: 0x07101c }), .01);
    R.plate('RS', -8.6, 2, 0xff5050, 1.3, '↺');
  },
  init(){ return { t: Array(LK.C * LK.Rr).fill(0), on: [-1, -1], done: 0, open: 0 }; },
  solve(st){ st.t = st.t.map((v, i) => isRock(i % LK.C, Math.floor(i / LK.C)) ? 0 : 2); st.done = 1; st.open = 1; },
  tileAt(R, pos, cur){
    const lz = R.lz(pos.z); if (lz < 5 || lz > 17) return lz < 5 ? -2 : -3;
    const c = Math.floor((pos.x + 9) / 3), r = Math.floor((lz - 5) / 3);
    if (c < 0 || c >= LK.C || r < 0 || r >= LK.Rr) return cur;
    const fx = pos.x + 9 - c * 3, fl = lz - 5 - r * 3, m = .35;
    if (cur >= -1 && (fx < m || fx > 3 - m || fl < m || fl > 3 - m)) return cur;     // hysteresis: must be well inside a new tile
    return r * LK.C + c;
  },
  pits(st, R){ const out = []; st.t.forEach((v, i) => { if (v === 2 && !st.done){ const c = i % LK.C, r = Math.floor(i / LK.C); out.push(R.rect(lkx(c) - 1.5, lkl(r) - 1.5, lkx(c) + 1.5, lkl(r) + 1.5)); } }); return out; },
  refreeze(st, E, msg){ st.t = st.t.map(() => 0); st.on = [-1, -1]; E.ev('splash', msg); },
  onFall(st, R, E){ if (!st.done) this.refreeze(st, E, 'Splash! The lake freezes over again.'); },
  host(dt, st, R, E){
    if (st.done){ if (!st.open && E.P.every(p => R.lz(p.pos.z) > 17.2 || !R.inside(p.pos))){ st.open = 1; R.open('exit'); E.ev('door', 'Every tile cracked — the key rises from the lake! The door opens.'); } return; }
    if (R.edge('RS')){ this.refreeze(st, E, 'The lake freezes over again.'); return; }
    for (const p of E.P){
      if (!R.inside(p.pos)){ st.on[p.idx] = -1; continue; }
      const prev = st.on[p.idx], cur = this.tileAt(R, p.pos, prev);
      if (cur === prev) continue;
      if (prev >= 0 && st.on[1 - p.idx] !== prev){ st.t[prev] = 2; E.ev('thud'); }
      if (cur >= 0 && st.t[cur] === 0) st.t[cur] = 1;
      st.on[p.idx] = cur;
    }
    const all = st.t.every((v, i) => v === 2 || isRock(i % LK.C, Math.floor(i / LK.C)));
    if (all){ st.done = 1; E.ev('chime', 'Every tile is cracked!', 4); }
  },
  visual(dt, t, st, R, E){
    this.tiles.forEach((m, i) => {
      if (!m) return; const v = st.done ? 2 : st.t[i];
      m.visible = v !== 2;
      if (v === 1 && m.material.map !== this.crackTex){ m.userData.ice = m.material.map; m.material.map = this.crackTex; m.material.needsUpdate = true; }
      if (v === 0 && m.material.map === this.crackTex){ m.material.map = m.userData.ice || null; m.material.needsUpdate = true; }
    });
  },
  objective(st, R, E){
    if (st.open) return 'The lake gave up its key — the door is open!';
    if (st.done) return 'Every tile is cracked! Get everyone onto the far shore.';
    const left = st.t.filter((v, i) => v !== 2 && !isRock(i % LK.C, Math.floor(i / LK.C))).length;
    return `Each ice tile breaks as soon as you step OFF it. Crack EVERY tile and end on the far shore ${E.solo() ? '' : '— plan two routes that never cross'}. (${left} tiles left) · red ↺ refreezes`;
  }
};

/* =============================================================== */
const SCROLLS = [[-8.5, 7.5], [8.5, 11.5], [-8.5, 16]], ALTAR5 = [0, 20.3];
const quiet = {
  name: 'The Silent Library',
  floor: E => E.mat(0x2e2420),
  notes: [[3, 1.8, '“Silence. The monks are sleeping. Running wakes them.”', 1.5]],
  hint: 'Don\'t run or dash — it fills the noise meter, and if it fills up the monks wake and hunt you for a while (flash them to buy time). A scroll RUSTLES while you carry it: walking it past a sleeping monk fills the meter fast, so find a route that stays well clear of them — or throw it over a shelf to your partner (the thud makes some noise too).',
  build(R, E){
    const T = E.THREE, shelf = E.mat(0x5a3a24);
    for (const lz of [5.5, 9.5, 13.5]){ R.block(-10, lz - .4, -3, lz + .4, 2.2, shelf); R.block(3, lz - .4, 10, lz + .4, 2.2, shelf); }
    R.block(-1.2, 17.6, 1.2, 18.4, 2.2, shelf);
    const alt = new T.Mesh(new T.BoxGeometry(2, 1, 1.2), E.mat(0x8a6a42)); R.place(alt, ALTAR5[0], ALTAR5[1] + .8, .5);
    this.monks = [];
    for (const [x, lz] of [[-6, 3.5], [6, 11.5], [-6, 15.5]])
      this.monks.push(R.ghost({ home: [x, lz], look: 'hood', tint: 0xd8a05a, sp: 2.9, radius: 30, label: 'a woken monk', think: (g, dt, st, R2, E2, P) => {
        if (st.awake <= 0){ E2.stepToward(g, g.home[0], g.home[1], 2, dt); g.ry = Math.PI; return true; }
        return false;
      } }));
  },
  init(){ return { noise: 0, awake: 0, got: 0, items: SCROLLS.map(([x, lz]) => ({ k: 'scroll', s: 0, x, lz, w: -1 })) }; },
  onLand(st, R, E, it){ if (it.s === 0) st.noise += .22; },   // a scroll hitting the floor goes "thud"
  solve(st){ st.got = 3; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ const T = E.THREE, g = new T.Group(); const r = new T.Mesh(new T.CylinderGeometry(.14, .14, .8, 10), E.mat(0xf2e6c8)); r.rotation.z = Math.PI / 2; g.add(r); const b = new T.Mesh(new T.TorusGeometry(.15, .03, 6, 10), E.glow(0xd04040, .5)); b.rotation.y = Math.PI / 2; g.add(b); return g; },
  carryTick(st, R, E, it, p){ if (Math.hypot(p.pos.x - ALTAR5[0], R.lz(p.pos.z) - ALTAR5[1]) < 1.7){ it.s = 3; st.got++; E.ev('place', st.got < 3 ? `Scroll returned (${st.got}/3)` : ''); } },
  host(dt, st, R, E){
    if (st.awake > 0) st.awake -= dt;
    for (const p of E.P){ if (!R.inside(p.pos)) continue; if (p.running) st.noise += dt * .55; if (p.dashing) st.noise += dt * 2.5; }
    // a carried scroll rustles: the closer to a sleeping monk, the louder
    if (st.awake <= 0) for (const it of st.items){ if (it.s !== 1) continue; const p = E.playerPos(it.w); if (!p) continue; const d = Math.min(...this.monks.map(g => Math.hypot(g.x - p.x, g.z - p.z))); if (d < 3.6) st.noise += dt * .9 * (1 - d / 3.6) * 2; }
    st.noise = Math.max(0, st.noise - dt * .1);
    if (st.noise >= 1){ st.noise = 0; st.awake = 9; E.ev('boo', 'Too loud! The monks are AWAKE!'); }
    if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); st.awake = 0; E.ev('door', 'All the scrolls are home. The library door opens.'); }
  },
  bar(st, R, E){ if (st.got >= 3 || !R.inside(E.me.pos)) return null; if (st.awake > 0) return { frac: st.awake / 9, label: 'THE MONKS ARE AWAKE!', color: '#ff5a5a' }; return { frac: st.noise, label: 'Noise', color: st.noise > .7 ? '#ff9a3d' : '#9ab0d0' }; },
  objective(st, R, E){ return st.got >= 3 ? 'The door is open!' : `Return the 3 scrolls to the altar. <b>Don't run or dash</b> — and a carried scroll <b>rustles</b>: keep it away from the sleeping monks. Noise wakes them. (${st.got}/3)`; }
};

/* =============================================================== */
const SPRINGS = [[-5, 6.5], [5, 11.5], [-4, 16.5]], SHRINES = [[-8.5, 20.5], [8.5, 2.2]];
const springs = {
  name: 'The Hot Springs',
  floor: snowFloor,
  notes: [[0, 1.6, '“The cold kills the lonely. Warm yourselves in the springs — or in each other.”', 1.5]],
  hint: 'Your chill meter rises while you\'re alone in the cold. Standing in a hot spring or next to your partner warms you. One of you waits warm in a spring while the other walks to the far shrine — then both step on your shrines at the same time.',
  build(R, E){
    const T = E.THREE;
    this.pools = SPRINGS.map(([x, lz]) => { const m = new T.Mesh(new T.CylinderGeometry(1.6, 1.7, .12, 24), new T.MeshStandardMaterial({ color: 0x5ad1c8, emissive: 0x2a8a8a, emissiveIntensity: .7, roughness: .1 })); R.place(m, x, lz, .07); return m; });
    SHRINES.forEach(([x, lz], i) => R.plate('S' + i, x, lz, 0xffa040, 1.5, '❄'));
    for (const [x, lz] of [[0, 8], [-2, 13], [6, 17], [7, 6]]) R.block(x - .8, lz - .8, x + .8, lz + .8, 1.4, E.mat(0x7a8a9a));
    wraith(R, [2, 19], { sp: 2.4 });
  },
  init(){ return { ch: [0, 0], hold: 0, done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){
    for (const p of E.P){
      if (!R.inside(p.pos) || st.done){ st.ch[p.idx] = Math.max(0, st.ch[p.idx] - dt); continue; }
      const lz = R.lz(p.pos.z), warm = SPRINGS.some(([x, l]) => Math.hypot(p.pos.x - x, lz - l) < 1.8) || E.P.some(q => q !== p && Math.hypot(q.pos.x - p.pos.x, q.pos.z - p.pos.z) < 2.5) || lz < 1.4;
      st.ch[p.idx] = E.clamp(st.ch[p.idx] + (warm ? -.45 : .1) * dt, 0, 1);
      if (st.ch[p.idx] >= 1 && !p.frozen){ st.ch[p.idx] = .45; E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} froze solid from the cold!`); }
    }
    if (st.done) return;
    if (R.held('S0') && R.held('S1')){ st.hold += dt; if (st.hold > 3){ st.done = 1; R.open('exit'); E.ev('door', 'Both shrines glow — the warm door opens!'); } }
    else st.hold = 0;
  },
  visual(dt, t, st, R){ this.pools.forEach((m, i) => m.material.emissiveIntensity = .6 + Math.sin(t * 2 + i) * .15); },
  bar(st, R, E){
    if (st.done || !R.inside(E.me.pos)) return null;
    if (st.hold > 0) return { frac: st.hold / 3, label: 'Shrines glowing…', color: '#ffa040' };
    const c = st.ch[E.myIdx()]; return { frac: 1 - c, label: c > .7 ? 'FREEZING — get warm!' : 'Body warmth', color: c > .7 ? '#7ad1ff' : '#ffa040' };
  },
  objective(st, R, E){ return st.done ? 'The door is open!' : `The cold freezes you if you stay alone too long. Hot springs and your partner keep you warm. Stand on BOTH ❄ shrines at once for 3 seconds.`; }
};

/* =============================================================== */
const LANES = [[6, 1, 4.6, 0], [9.5, -1, 5.4, 5], [13, 1, 4.2, 9], [16.5, -1, 5.8, 2]];
function balls(t){
  const out = [];
  LANES.forEach(([lz, dir, sp, ph]) => { for (let k = 0; k < 2; k++){ const u = ((t * sp + ph + k * 12) % 24 + 24) % 24; out.push([dir > 0 ? -12 + u : 12 - u, lz]); } });
  return out;
}
const sled = {
  name: 'The Avalanche Run',
  floor: snowFloor,
  notes: [[3.5, 1.6, '“The relic sled is heavy. It moves only when two pull together.”', 1.5]],
  hint: 'Both stand right next to the sled — it follows when you BOTH walk the same way. Watch the snowball lanes and cross between boulders. A snowball hitting the sled sends it back to the start.',
  build(R, E){
    const T = E.THREE, g = new T.Group();
    const base = new T.Mesh(new T.BoxGeometry(1.6, .3, 2.2), E.mat(0x8a5a2a)); base.position.y = .3; g.add(base);
    const rel = new T.Mesh(new T.OctahedronGeometry(.5), E.glow(0x9ad8ff, 1)); rel.position.y = 1; g.add(rel);
    for (const s of [-1, 1]){ const run = new T.Mesh(new T.BoxGeometry(.1, .1, 2.6), E.mat(0xc0c0c8, { metalness: .7 })); run.position.set(s * .7, .06, 0); g.add(run); }
    this.sled = g; E.scene.add(g);
    this.ballM = []; for (let i = 0; i < 8; i++){ const b = new T.Mesh(new T.SphereGeometry(.9, 16, 12), E.mat(0xf2f6fa)); E.scene.add(b); this.ballM.push(b); }
    for (const [lz] of LANES) R.floor(-10, lz - 1, 10, lz + 1, E.mat(0xc8d4e2), .012);
    const alt = new T.Mesh(new T.CylinderGeometry(1.4, 1.6, .25, 20), E.glow(0x9ad8ff, .4)); R.place(alt, 0, 20, .12);
  },
  init(){ return { t: 0, sx: 0, sl: 2.6, done: 0 }; },
  solve(st){ st.sl = 20; st.done = 1; },
  speed(st, R, E, idx){ const p = E.playerPos(idx); return p && R.inside(p) && !st.done && Math.hypot(p.x - st.sx, R.lz(p.z) - st.sl) < 2.4 ? { mult: .62, noRun: true } : null; },
  host(dt, st, R, E){
    const L = R.local; L.pp = L.pp || {};
    st.t += dt;
    const B = balls(st.t);
    for (const p of E.P) if (R.inside(p.pos) && !p.frozen && !p.dashing && B.some(([x, l]) => Math.hypot(p.pos.x - x, R.lz(p.pos.z) - l) < 1.25)) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} got flattened by a snowball!`);
    if (!st.done){
      const holders = E.P.filter(p => !p.frozen && R.inside(p.pos) && Math.hypot(p.pos.x - st.sx, R.lz(p.pos.z) - st.sl) < 2.4);
      const need = E.solo() ? 1 : 2;
      if (holders.length >= need){
        let dx = 0, dl = 0;
        for (const p of holders){ const pr = L.pp[p.idx]; if (pr){ dx += p.pos.x - pr[0]; dl += R.lz(p.pos.z) - pr[1]; } }
        dx /= holders.length; dl /= holders.length;
        const m = Math.hypot(dx, dl), cap = 3.4 * dt; if (m > cap){ dx *= cap / m; dl *= cap / m; }
        st.sx = E.clamp(st.sx + dx, -8.5, 8.5); st.sl = E.clamp(st.sl + dl, 1.5, 20.5);
      }
      if (B.some(([x, l]) => Math.hypot(st.sx - x, st.sl - l) < 1.4)){ st.sx = 0; st.sl = 2.6; E.ev('thud', 'A snowball smashed into the sled — it slid back to the start!'); }
      if (st.sl > 19.3){ st.done = 1; R.open('exit'); E.ev('door', 'The relic is safe on the altar! The door opens.'); }
    }
    for (const p of E.P) L.pp[p.idx] = [p.pos.x, R.lz(p.pos.z)];
  },
  visual(dt, t, st, R, E){
    this.sled.position.set(st.sx, 0, R.Z(st.sl));
    balls(st.t).forEach(([x, l], i) => { const b = this.ballM[i]; b.position.set(x, .9, R.Z(l)); b.rotation.z -= dt * 6 * Math.sign(LANES[Math.floor(i / 2)][1]); });
  },
  objective(st, R, E){ return st.done ? 'The relic is home!' : `Drag the relic sled to the altar. It only moves when ${E.solo() ? 'you are' : 'you are BOTH'} right next to it walking the same way. Dodge the snowballs!`; }
};

/* =============================================================== */
const hunt = {
  name: 'The Wraith Hunt',
  floor: stoneFloor,
  notes: [[0, 1.8, '“Three wraiths stole the abbot\'s keys. Catch them: blind them, then grab them.”', 1.6]],
  hint: 'The wraiths flee from you and blink away if you get too close. Flash one (☀/F) to stun it, then touch it before it recovers. Corner them together — one chases, one cuts them off.',
  build(R, E){
    for (const [x, lz] of [[-4.5, 7], [4.5, 7], [-4.5, 15], [4.5, 15], [0, 11]]) R.block(x - .9, lz - .9, x + .9, lz + .9, 2.4, E.mat(0x7a7e8a));
    const think = k => (g, dt, st, R2, E2, P) => {
      if (st.cap & (1 << k)) return true;
      const sp = E2.solo() ? 3.8 : 4.4;
      let fx = 0, fz = 0, closest = 99;
      for (const p of P){ if (!R2.inside(p.pos)) continue; const dx = g.x - p.pos.x, dz = g.z - p.pos.z, d = Math.hypot(dx, dz); closest = Math.min(closest, d); if (d < 7 && d > .01){ fx += dx / d * (7 - d); fz += dz / d * (7 - d); } }
      const lzw = R2.lz(g.z), wall = 2;
      if (g.x < -9.2 + wall) fx += (-9.2 + wall - g.x) * 1.6; if (g.x > 9.2 - wall) fx -= (g.x - 9.2 + wall) * 1.6;
      if (lzw < 1.2 + wall) fz -= (1.2 + wall - lzw) * 1.6; if (lzw > 20.8 - wall) fz += (lzw - 20.8 + wall) * 1.6;
      g.mem.blink = (g.mem.blink || 0) - dt;
      if (closest < 2 && g.mem.blink <= 0 && Math.hypot(fx, fz) > .01){ const l = Math.hypot(fx, fz); g.x += fx / l * 3.5; g.z += fz / l * 3.5; g.mem.blink = 3; E2.ev('whoosh'); }
      else if (Math.hypot(fx, fz) > .05){ const l = Math.hypot(fx, fz); g.x += fx / l * sp * dt; g.z += fz / l * sp * dt; g.ry = Math.atan2(fx, fz); }
      else { g.mem.t = (g.mem.t || 0) - dt; if (g.mem.t <= 0 || !g.mem.w){ g.mem.w = [-8 + Math.random() * 16, 3 + Math.random() * 16]; g.mem.t = 3; } E2.stepToward(g, g.mem.w[0], R2.Z(g.mem.w[1]), 1.6, dt); }
      const v = new E2.THREE.Vector3(g.x, 0, g.z); E2.resolve(v, E2.staticRects());
      g.x = E2.clamp(v.x, -9.2, 9.2); g.z = E2.clamp(v.z, R2.Z(20.8), R2.Z(1.2));
      return true;
    };
    for (let k = 0; k < 3; k++) R.ghost({ home: [[-6, 11], [6, 11], [0, 18]][k], look: 'wisp', tint: 0xbfe8ff, harmless: true, sp: 0, think: think(k), gone: st => !!(st.cap & (1 << k)) });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3);
  },
  init(){ return { cap: 0 }; },
  solve(st){ st.cap = 7; },
  host(dt, st, R, E){
    let k = 0;
    for (const g of E.ghostsOf(R.i)){
      if (!(st.cap & (1 << k)) && g.stun > 0 && E.P.some(p => !p.frozen && Math.hypot(p.pos.x - g.x, p.pos.z - g.z) < 1.3)){ st.cap |= 1 << k; E.ev('chime', `Wraith caught! (${[1, 2, 4].filter(m => st.cap & m).length}/3)`, k + 1); }
      k++;
    }
    if (!R.isOpen('exit') && st.cap === 7){ R.open('exit'); E.ev('door', 'All three wraiths caught — the abbot\'s keys clatter to the floor!'); }
  },
  visual(dt, t, st, R){ setOrbs(this.orbs, [1, 2, 4].filter(m => st.cap & m).length); },
  objective(st, R, E){ return st.cap === 7 ? 'All caught! The door is open.' : `Catch the 3 fleeing wraiths: <b>flash one to stun it, then touch it</b>. They blink away if you get too close. (${[1, 2, 4].filter(m => st.cap & m).length}/3)`; }
};

/* =============================================================== */
const PG = { C: 6, Rr: 4 }, pgx = c => -7.5 + 3 * c, pgl = r => 6.5 + 3 * r;
const N1 = 1, E1 = 2, S1 = 4, W1 = 8;
const rotM = (m, r) => { for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
const SRC = [0, 1], SNK = [5, 2];
function pipesConnected(base, rot){
  const mask = i => rotM(base[i], rot[i]);
  const start = SRC[1] * PG.C + SRC[0];
  if (!(mask(start) & W1)) return [false, new Set()];
  const seen = new Set([start]), q = [start];
  const D = [[N1, 0, 1, S1], [E1, 1, 0, W1], [S1, 0, -1, N1], [W1, -1, 0, E1]];
  while (q.length){
    const i = q.shift(), c = i % PG.C, r = Math.floor(i / PG.C), m = mask(i);
    for (const [b, dc, dr, opp] of D){
      if (!(m & b)) continue; const a = c + dc, bb = r + dr; if (a < 0 || a >= PG.C || bb < 0 || bb >= PG.Rr) continue;
      const j = bb * PG.C + a; if (seen.has(j) || !(mask(j) & opp)) continue; seen.add(j); q.push(j);
    }
  }
  const end = SNK[1] * PG.C + SNK[0];
  return [seen.has(end) && !!(mask(end) & E1), seen];
}
const boiler = {
  name: 'The Boiler Pipes',
  floor: E => E.mat(0x2a2a30),
  notes: [[-6, 2, '“Turn the pipes and the steam will flow. Step on a pipe to turn it.”', 1.5]],
  hint: 'Every time you step onto a pipe tile, it turns a quarter. Connect the boiler on the left to the radiator on the right — the glowing pipes show where the steam already reaches. Stun the wraiths with your flash if they get close.',
  build(R, E){
    const T = E.THREE;
    this.tiles = [];
    for (let r = 0; r < PG.Rr; r++) for (let c = 0; c < PG.C; c++){
      const g = new T.Group(); const base = new T.Mesh(new T.BoxGeometry(2.8, .08, 2.8), E.mat(0x3a3a44)); g.add(base);
      const arms = [];
      for (let k = 0; k < 4; k++){ const a = new T.Mesh(new T.BoxGeometry(.5, .4, 1.5), new T.MeshStandardMaterial({ color: 0x8a6a4a, metalness: .6, roughness: .4, emissive: 0xff7a2a, emissiveIntensity: 0 })); a.position.set(0, .25, -.75); const piv = new T.Group(); piv.rotation.y = -k * Math.PI / 2; piv.add(a); g.add(piv); arms.push(a); }
      const hub = new T.Mesh(new T.CylinderGeometry(.35, .35, .45, 10), E.mat(0x6a5a4a, { metalness: .6 })); hub.position.y = .25; g.add(hub);
      R.place(g, pgx(c), pgl(r)); this.tiles.push({ g, arms });
    }
    const boil = new T.Mesh(new T.CylinderGeometry(.9, 1, 2.2, 14), E.mat(0x7a3a2a, { metalness: .5 })); R.place(boil, -9.3, pgl(SRC[1]), 1.1);
    const rad = new T.Mesh(new T.BoxGeometry(.6, 1.8, 2.2), E.mat(0x8a8a9a, { metalness: .6 })); R.place(rad, 9.4, pgl(SNK[1]), .9);
    R.wall(-.25, 5.3, .25, 16.7);
    R.ghost({ home: [-5, 15], look: 'hood', tint: 0xbfe8ff, sp: 2.4, b: [-9.4, -.6, 5, 17], label: 'a frost wraith' });
    R.ghost({ home: [5, 15], look: 'hood', tint: 0xbfe8ff, sp: 2.4, b: [.6, 9.4, 5, 17], label: 'a frost wraith' });
  },
  init(){
    const C = PG.C, Rr = PG.Rr, idx = (c, r) => r * C + c;
    let path = null;
    for (let tries = 0; tries < 200 && !path; tries++){
      const seen = new Set([idx(...SRC)]), p = [SRC.slice()];
      const go = () => { const [c, r] = p[p.length - 1]; if (c === SNK[0] && r === SNK[1]) return p.length >= 10; const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([a, b]) => a >= 0 && a < C && b >= 0 && b < Rr && !seen.has(idx(a, b))).sort(() => Math.random() - .5);
        for (const n of nb){ seen.add(idx(...n)); p.push(n); if (go()) return true; p.pop(); seen.delete(idx(...n)); } return false; };
      if (go()) path = p;
    }
    const base = Array(C * Rr).fill(0);
    const dirBit = (a, b) => b[1] > a[1] ? N1 : b[1] < a[1] ? S1 : b[0] > a[0] ? E1 : W1;
    path.forEach((p, i) => { let m = 0; if (i === 0) m |= W1; else m |= dirBit(p, path[i - 1]); if (i === path.length - 1) m |= E1; else m |= dirBit(p, path[i + 1]); base[idx(...p)] = m; });
    const shapes = [N1 | S1, N1 | E1, N1 | E1 | S1];
    for (let i = 0; i < base.length; i++) if (!base[i]) base[i] = shapes[Math.floor(Math.random() * 3)];
    let rot; do { rot = base.map(() => Math.floor(Math.random() * 4)); } while (pipesConnected(base, rot)[0]);
    return { base, rot, path: path.map(([c, r]) => idx(c, r)), done: 0 };
  },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    for (const a of arrivals(R, 'pipe', E.P, pos => { const lz = R.lz(pos.z), c = Math.floor((pos.x + 9) / 3), r = Math.floor((lz - 5) / 3); if (c < 0 || c >= PG.C || r < 0 || r >= PG.Rr) return -1; const fx = pos.x + 9 - c * 3, fl = lz - 5 - r * 3; return fx > .4 && fx < 2.6 && fl > .4 && fl < 2.6 ? r * PG.C + c : -1; })){
      st.rot[a.cell] = (st.rot[a.cell] + 1) % 4; E.ev('click');
      if (pipesConnected(st.base, st.rot)[0]){ st.done = 1; R.open('exit'); E.ev('door', 'Steam roars through the pipes — the ice door melts away!'); }
    }
  },
  visual(dt, t, st, R, E){
    const [ok, lit] = pipesConnected(st.base, st.rot);
    this.tiles.forEach(({ g, arms }, i) => {
      const m = st.base[i];
      arms.forEach((a, k) => { a.visible = !!(m & (1 << k)); a.material.emissiveIntensity = lit.has(i) || st.done ? .8 + Math.sin(t * 6) * .2 : 0; });
      const target = -st.rot[i] * Math.PI / 2; let d = target - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * E.damp(12, dt);
    });
  },
  objective(st, R, E){ return st.done ? 'The steam melted the door — go!' : 'Step onto a pipe to turn it. Connect the boiler (left wall) to the radiator (right wall). Glowing pipes already have steam.'; }
};

/* =============================================================== */
const BRAZ = [[-8.3, 19.3], [8.3, 19.3], [0, 11]];
const abbot = {
  name: "The Abbot's Sanctum",
  floor: E => E.mat(0x2a3040),
  notes: [[0, 1.8, '“The Frost Abbot shrugs off one light. Two lights at once will blind him.”', 1.6]],
  hint: 'One flash won\'t stop the Abbot — you both have to flash him within a split second of each other (count down: 3, 2, 1, flash!). While he\'s stunned, light a brazier by standing next to it. Each lit brazier makes him angrier.',
  build(R, E){
    const T = E.THREE;
    this.braz = BRAZ.map(([x, lz]) => { const b = new T.Mesh(new T.CylinderGeometry(.7, .5, .9, 12), E.mat(0x3a3a44, { metalness: .6 })); R.place(b, x, lz, .45); const f = new T.Mesh(new T.ConeGeometry(.5, 1.1, 10), E.flameMat); R.place(f, x, lz, 1.4); f.visible = false; return f; });
    this.boss = R.ghost({ home: [0, 18], look: 'hood', tint: 0xa8dcff, scale: 1.7, flashImmune: true, sp: 2.5, radius: 40, label: 'the Frost Abbot', touch: 1.5, gone: st => !!st.done,
      think: (g, dt, st, R2, E2, P) => {
        if (g.rest > 0){ g.rest -= dt; return true; }
        const T2 = E2.targetsOf(g, P); let best = null, bd = 99;
        for (const p of T2){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
        if (best) E2.stepToward(g, best.pos.x, best.pos.z, (2.5 + st.lit * .35) * E2.GMULT, dt);
        if (E2.ghostTouch(g, T2, E2.names(), 1.5)){ g.ret = false; g.rest = 1.5; }
        return true;
      } });
    this.adds = [0, 1].map(k => R.ghost({ home: [k ? 7 : -7, 6], look: 'hood', tint: 0xbfe8ff, sp: 2.9, radius: 14, label: 'a frost wraith', gone: st => st.lit <= k || st.done }));
  },
  init(){ return { lit: 0, lp: [0, 0, 0], done: 0, fl: [-9, -9], bl: [0, 0, 0] }; },
  solve(st){ st.done = 1; st.lit = 3; st.bl = [1, 1, 1]; },
  onFlash(st, R, E, idx, x, z){
    const g = this.boss; if (!g || st.done) return;
    st.fl[idx] = E.elapsed;
    const close = Math.hypot(g.x - x, g.z - z) < 6.5;
    if (E.solo()){ if (close){ g.stun = 4; E.ev('chime', 'The Abbot is blinded!', 3); } return; }
    if (close && Math.abs(st.fl[0] - st.fl[1]) < .7){ g.stun = 6; st.fl = [-9, -9]; E.ev('chime', 'DOUBLE FLASH! The Abbot is blinded!', 3); }
    else if (close) E.ev('laugh', 'The Abbot shrugs off a single light…');
  },
  host(dt, st, R, E){
    if (st.done) return;
    const g = this.boss, bossNear = (x, lz) => g.stun <= 0 && Math.hypot(g.x - x, R.Z(lz) - g.z) < 5;
    BRAZ.forEach(([x, lz], i) => {
      if (st.bl[i]) return;
      const here = E.P.some(p => !p.frozen && Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < 1.6);
      if (here && !bossNear(x, lz)){ st.lp[i] += dt; if (st.lp[i] > 1.5){ st.bl[i] = 1; st.lit++; E.ev('gong', st.lit < 3 ? `A brazier roars to life! (${st.lit}/3) The Abbot is furious!` : '', 160 + st.lit * 40); } }
      else st.lp[i] = Math.max(0, st.lp[i] - dt);
    });
    if (st.lit >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Abbot shatters into snowflakes! The monastery doors open.'); }
  },
  visual(dt, t, st, R, E){ this.braz.forEach((f, i) => { f.visible = !!st.bl[i]; f.scale.setScalar(1 + Math.sin(t * 13 + i) * .1); }); },
  bar(st, R, E){ const i = BRAZ.findIndex(([x, lz]) => Math.hypot(E.me.pos.x - x, R.lz(E.me.pos.z) - lz) < 1.6); if (i < 0 || st.bl[i]) return null; return { frac: st.lp[i] / 1.5, label: 'Lighting the brazier…', color: '#ffa53a' }; },
  objective(st, R, E){ return st.done ? 'The Abbot is gone — escape the monastery!' : `Light the 3 braziers. The Frost Abbot snuffs any flame he's near. ${E.solo() ? 'Flash him to blind him.' : 'One flash won\'t stop him — <b>FLASH HIM AT THE SAME TIME</b> to blind him.'} (${st.lit}/3)`; }
};

export default {
  level: 5,
  // texture pack in tex/level5/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'panel', tex: 'prayer_cloth', w: 1.1, h: 1.6, y: 1.4, every: 5, color: 0x8a8a8a, skip: 3 },   // wall dressing: prayer banners (engine wallDecor)
  wallImg: 'monastery_wall', trimImg: 'frost_silver', texVer: 1,
  texFloors: {
    "The Crevasse Field": "crevasse_snow",
    "The Prayer Flags": "flag_stones",
    "The Meditation Hall": "reed_mats",
    "The Frozen Lake": "lake_snow",
    "The Silent Library": "library_boards",
    "The Hot Springs": "spring_stones",
    "The Avalanche Run": "avalanche_snow",
    "The Wraith Hunt": "wraith_slate",
    "The Boiler Pipes": "boiler_plates",
    "The Abbot's Sanctum": "glazed_tiles"
  },
  title: 'The Frozen Monastery',
  tagline: 'High in the mountains, the monks still pray.<br>They have been praying for three hundred winters.',
  story: 'Snow blows through broken windows. Your lantern burns brighter here.',
  winTitle: 'The monastery thaws! ❄️',
  feature: { name: 'Lantern Flash', icon: '☀', how: 'Press <b>F</b> (PC) or the <b>☀ button</b> (phone) to flash your lantern. It stuns nearby ghosts for a few seconds, then takes 5 seconds to recharge.' },
  accent: '#8ad0ff',
  wallColor: 0x5a6070,
  trimColor: 0xb8c8d8,
  doorColor: 0x4a3a2a,
  sky: 0x9ab0d0,
  bg: 0x0a0e18,
  drone: 41,
  rooms: [crevasse, flags, meditation, lake, quiet, springs, sled, hunt, boiler, abbot],
};
