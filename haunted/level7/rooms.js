// Level 7 — The Ghost Train. New power: PING (click / tap the ground to mark a spot). Local coords: x -10..10, lz 0..22.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

const carFloor = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#4a1e24'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6a2e34'; x.lineWidth = 6; for (let i = 0; i < 4; i++){ x.beginPath(); x.moveTo(0, i * 32 + 16); x.lineTo(w, i * 32 + 16); x.stroke(); } x.fillStyle = '#d4af3733'; for (let i = 0; i < 8; i++) x.fillRect(i * 16 + 6, 0, 3, h); }, 5, 5) });
const platFloor = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#6a6a72'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4a4a52'; x.lineWidth = 2; for (let i = 0; i <= 4; i++){ x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 32); x.lineTo(w, i * 32); x.stroke(); } }, 6, 6) });
const roofFloor = E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#3a3a44'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2a32'; for (let i = 0; i < 8; i++) x.fillRect(i * 8, 0, 2, h); }, 8, 8) });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; };
function trunkMesh(E, color = 0x7a4a2a){
  const T = E.THREE, g = new T.Group();
  const body = new T.Mesh(new T.BoxGeometry(1.5, .8, 1), E.mat(color)); body.position.y = .4; g.add(body);
  const lid = new T.Group(); lid.position.set(0, .8, -.5); g.add(lid);
  const top = new T.Mesh(new T.BoxGeometry(1.52, .25, 1.02), E.mat(color)); top.position.set(0, .12, .5); lid.add(top);
  const band = new T.Mesh(new T.BoxGeometry(1.55, .82, .1), E.mat(0xc9a24a, { metalness: .6 })); band.position.y = .4; g.add(band);
  const teeth = new T.Group(); for (let i = 0; i < 6; i++){ const t = new T.Mesh(new T.ConeGeometry(.07, .2, 4), E.mat(0xf2f2e8)); t.position.set(-.6 + i * .24, .78, .45); t.rotation.x = Math.PI; teeth.add(t); } teeth.visible = false; g.add(teeth);
  g.userData = { lid, teeth }; return g;
}
const conductorMesh = { look: 'hat', tint: 0x2a3a6a };

/* =============================================================== */
const TRK1 = [[-7, 4], [-3.5, 4], [0, 4], [3.5, 4], [7, 4], [-7, 7.5], [-3.5, 7.5], [0, 7.5], [3.5, 7.5], [7, 7.5]];
const platform = {
  name: 'Platform 13',
  floor: platFloor,
  notes: [[3, 1.6, '“The lookout sees what you can\'t. Point the way — click or tap the ground to PING.”', 1.6]],
  hint: 'Only someone standing on the lookout (top-left) can see which trunk is glowing. They PING it — click the ground on PC, tap the screen on phone (or press Q to ping where you stand). The other opens it by standing next to it for a second. Wrong trunks bite!',
  build(R, E){
    const T = E.THREE;
    this.trunks = TRK1.map(([x, lz]) => R.place(trunkMesh(E), x, lz));
    R.block(-10, 15, -5.5, 19, .05, E.mat(0x5a5a62), false); R.plate('LK', -7.75, 17, 0x9ad8ff, 1.6, '👁');
    for (const [x, lz] of [[-9.6, 15.2], [-5.9, 15.2], [-9.6, 18.8], [-5.9, 18.8]]){ const post = new T.Mesh(new T.CylinderGeometry(.08, .08, 2.4, 6), E.mat(0x3a3a44)); R.place(post, x, lz, 1.2); }
    const sign = textPlane(E, 4, 1); R.place(sign, 3, 21.3, 2); redraw(sign, (c, w, h) => { c.fillStyle = '#1a2a1a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e0b0'; c.font = 'bold 40px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PLATFORM 13', w / 2, h / 2); });
    this.glowM = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, .05, 20), new T.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: .55 })); this.glowM.visible = false; E.scene.add(this.glowM);
  },
  init(){ return { ok: Math.floor(Math.random() * TRK1.length), bad: 0, open: [0, 0], got: 0 }; },
  solve(st){ st.got = 1; },
  host(dt, st, R, E){
    if (st.got) return;
    for (const p of E.P){
      const i = TRK1.findIndex(([x, lz]) => near(R, p, x, lz, 1.3));
      if (i < 0 || p.frozen || (st.bad & (1 << i))){ st.open[p.idx] = 0; continue; }
      st.open[p.idx] += dt;
      if (st.open[p.idx] > .9){
        st.open[p.idx] = 0;
        if (i === st.ok){ st.got = 1; R.open('exit'); E.ev('door', 'Inside: a golden ticket! The train doors hiss open.'); }
        else { st.bad |= 1 << i; E.freeze(p.idx, E.FREEZE, `CHOMP! That trunk was a luggage mimic!`); }
      }
    }
  },
  visual(dt, t, st, R, E){
    this.trunks.forEach((g, i) => { const bad = st.bad & (1 << i); g.userData.teeth.visible = !!bad; g.userData.lid.rotation.x += ((bad ? -.9 + Math.sin(t * 8) * .2 : (st.got && i === st.ok ? -1.4 : 0)) - g.userData.lid.rotation.x) * E.damp(8, dt); });
    const sees = R.at('LK', E.me.pos) || (E.solo() && R.held('LK'));
    this.glowM.visible = !st.got && sees; if (sees){ const [x, lz] = TRK1[st.ok]; this.glowM.position.set(x, .05, R.Z(lz)); this.glowM.material.opacity = .4 + Math.sin(t * 6) * .2; }
  },
  bar(st, R, E){ const v = st.open[E.myIdx()]; return v > 0 ? { frac: v / .9, label: 'Opening the trunk…', color: '#c9a24a' } : null; },
  objective(st, R, E){
    if (st.got) return 'You found the ticket — all aboard!';
    if (R.at('LK', E.me.pos)) return '👁 You can see the glowing trunk! <b>PING it</b> for your partner (click the ground / tap the screen).';
    return 'One trunk holds the golden ticket — the rest are luggage MIMICS. Only someone on the lookout platform (top-left) can see the right one. Ping it and open it (stand next to it).';
  }
};

/* =============================================================== */
const PA = [-3.5, 16], PB = [3.5, 16];
const inspection = {
  name: 'Ticket Inspection',
  floor: carFloor,
  notes: [[0, 2, '“Tickets, please. ONE ticket between two passengers? We shall see.”', 1.6]],
  hint: 'Both levers must be held, but there\'s only one ticket. The Conductor walks to one of you at a time — throw the ticket to whoever he\'s heading for before he gets there!',
  build(R, E){
    const T = E.THREE;
    for (const [x, lz] of [[-7.5, 5], [7.5, 5], [-7.5, 9.5], [7.5, 9.5], [-7.5, 14], [7.5, 14]]){ const s = new T.Mesh(new T.BoxGeometry(2.4, .9, 1.2), E.mat(0x6a2a3a)); R.place(s, x, lz, .45); R.block(x - 1.2, lz - .6, x + 1.2, lz + .6, .01, E.mat(0)); }
    R.plate('A', PA[0], PA[1], 0xffc46b, 1.6, '⇩'); R.plate('B', PB[0], PB[1], 0xffc46b, 1.6, '⇩');
    this.cond = R.ghost({ home: [0, 20.5], ...conductorMesh, flashImmune: true, label: 'the Conductor', sp: 0, scale: 1.2, harmless: true,
      think: (g, dt, st, R2, E2, P) => {
        if (st.done){ E2.stepToward(g, 0, R2.Z(20.5), 2, dt); return true; }
        const m = g.mem; if (m.tg === undefined){ m.tg = 0; m.w = 0; }
        if (!(st.hold > 0)) { E2.stepToward(g, 0, R2.Z(20.5), 2, dt); return true; }
        const [tx, tl] = m.tg ? PB : PA, ax = tx, al = tl + 1.7;
        if (m.w > 0){ m.w -= dt; g.ry = Math.PI; if (m.w <= 0) m.tg ^= 1; return true; }
        if (E2.stepToward(g, ax, R2.Z(al), 2.3 * E2.GMULT, dt) < .1){
          m.w = 1.4; const p = P.find(q => !q.frozen && near(R2, q, tx, tl, 1.6));
          if (p){ if (E2.carrying(p.idx) && E2.carrying(p.idx).it.k === 'ticket') E2.ev('chime', '“Ticket… very good.”', 2); else E2.freeze(p.idx, E2.FREEZE, `“No ticket?!” The Conductor froze ${E2.names()[p.idx]}!`); }
        }
        g.mem.next = m.tg;
        return true;
      } });
    this.arrow = new T.Mesh(new T.ConeGeometry(.35, .7, 4), E.glow(0xff5050, 1)); this.arrow.rotation.x = Math.PI; E.scene.add(this.arrow);
  },
  init(){ return { prog: 0, hold: 0, done: 0, items: [mkItem('ticket', 0, 3)] }; },
  solve(st){ st.done = 1; st.items[0].s = 3; },
  itemMesh(k, E){ if (k !== 'ticket') return null; const T = E.THREE; return new T.Mesh(new T.BoxGeometry(.6, .05, .35), E.glow(0xffd84d, .8)); },
  host(dt, st, R, E){
    if (st.done) return;
    const both = E.solo() ? (R.held('A') || R.held('B')) : (R.on('A') && R.on('B') && E.P.every(p => !p.frozen));
    st.hold = both ? 1 : 0;
    if (both){ st.prog += dt; if (st.prog >= 14){ st.done = 1; st.items[0].s = 3; R.open('exit'); E.ev('door', 'The levers lock — the next car\'s door opens!'); } }
  },
  visual(dt, t, st, R, E){
    const g = this.cond, tg = g.mem && g.mem.tg !== undefined ? g.mem.tg : 0, show = st.hold && !st.done;
    this.arrow.visible = !!show; if (show){ const [x, lz] = tg ? PB : PA; this.arrow.position.set(x, 2.6 + Math.sin(t * 5) * .15, R.Z(lz)); }
  },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; return { frac: st.prog / 14, label: st.hold ? 'Holding the levers…' : 'Both hold a lever', color: '#ffc46b' }; },
  objective(st, R, E){ return st.done ? 'Next car!' : `Hold BOTH levers for 14 seconds. The Conductor checks whoever he walks up to (red arrow) — <b>throw the one ticket</b> to that person before he arrives!`; }
};

/* =============================================================== */
const HATCH = [[-5, 3], [3, 4.5], [-2, 8], [6, 9], [-6.5, 11.5], [1, 13], [-3, 16.5], [5.5, 16], [0, 19.5]];
const roof = {
  name: 'The Roof Run',
  floor: roofFloor,
  notes: [[-7, 1.4, '“Duck into a hatch when a bridge comes. Mind the wind.”', 1.4]],
  hint: 'Low bridges sweep over the roof — when the warning light flashes, get into a hatch (the glowing squares) before the bridge reaches your row. The wind pushes you toward the left edge; lean right.',
  build(R, E){
    const T = E.THREE;
    this.hatches = HATCH.map(([x, lz]) => { const m = new T.Mesh(new T.BoxGeometry(2, .06, 2), E.glow(0x7fd1ff, .4)); return R.place(m, x, lz, .04); });
    R.floor(-10, 0, -8.5, 22, new T.MeshBasicMaterial({ color: 0x020203 }), .02); R.floor(8.5, 0, 10, 22, new T.MeshBasicMaterial({ color: 0x020203 }), .02);
    this.beam = new T.Mesh(new T.BoxGeometry(20, .6, .8), E.mat(0x5a4a3a)); E.scene.add(this.beam);
    this.warn = new T.Mesh(new T.SphereGeometry(.4, 12, 10), E.glow(0xff3030, 0)); R.place(this.warn, 0, 21.3, 2.4);
  },
  init(){ return { t: 0, bz: -1, done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return [R.rect(-10.5, 0, -8.5, 22), R.rect(8.5, 0, 10.5, 22)]; },
  push(st, R, E, pos){ if (st.done || !R.inside(pos)) return null; return [-2.1 - Math.max(0, Math.sin(E.elapsed * 1.3)) * 1.6, 0]; },
  inHatch(R, pos){ return HATCH.some(([x, lz]) => Math.abs(pos.x - x) < 1.05 && Math.abs(R.lz(pos.z) - lz) < 1.05); },
  host(dt, st, R, E){
    if (st.done) return;
    if (E.P.some(p => R.inside(p.pos))) st.t += dt;
    const ph = st.t % 4.2;
    st.bz = ph > 1.2 ? 22 - (ph - 1.2) * 9 : -1;
    if (st.bz > 0) for (const p of E.P) if (R.inside(p.pos) && !p.frozen && !p.dashing && Math.abs(R.lz(p.pos.z) - st.bz) < .6 && !this.inHatch(R, p.pos)) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} got clobbered by a low bridge!`);
    if (E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.6) || (E.solo() && E.P.some(p => R.lz(p.pos.z) > 20.6 && R.inside(p.pos)))){ st.done = 1; R.open('exit'); E.ev('door', 'You slip through the roof hatch into the next car!'); }
  },
  visual(dt, t, st, R, E){
    this.beam.visible = st.bz > 0 && !st.done; if (st.bz > 0) this.beam.position.set(0, 1.3, R.Z(st.bz));
    const ph = st.t % 4.2; this.warn.material.emissiveIntensity = !st.done && ph < 1.2 ? (Math.sin(t * 20) > 0 ? 2 : .2) : 0;
    this.hatches.forEach(h => h.material.emissiveIntensity = !st.done && ph < 1.2 ? .9 : .35);
  },
  objective(st, R, E){ return st.done ? 'Down the hatch!' : 'Cross the roof of the speeding train. When the red light flashes, a low bridge is coming — <b>stand in a glowing hatch</b> as it passes. The wind pushes you toward the edge!'; }
};

/* =============================================================== */
// track: list of nodes; edges chosen at switches. Cart travels along polyline.
const SY = { S: [-8, 2.5], J1: [-8, 7], J2: [-2, 13], J3: [5, 13] };
const ROUTES = {
  start: [[-8, 2.5], [-8, 7]],
  j1a: [[-8, 7], [-2, 7], [-2, 13]], j1b: [[-8, 7], [-8, 12.5]],
  j2a: [[-2, 13], [5, 13]], j2b: [[-2, 13], [-2, 19]],
  j3a: [[5, 13], [5, 19.5]], j3b: [[5, 13], [9, 13]],
};
const SWP = { J1: [-6.3, 8.6], J2: [-3.7, 14.6], J3: [6.7, 14.6] };
const yard = {
  name: 'The Switching Yard',
  floor: platFloor,
  notes: [[-5, 1.6, '“The switches spring back the moment you let go.”', 1.4]],
  hint: 'Pull the start lever to release the runaway car. Each switch only stays thrown while someone stands on it. Split up: one holds the first switch, the other the second — then whoever is free races to the third before the car gets there.',
  build(R, E){
    const T = E.THREE, rail = E.mat(0x8a8a94, { metalness: .7 });
    const seg = (a, b) => {
      const ax = a[0], az = R.Z(a[1]), bx = b[0], bz = R.Z(b[1]), dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      for (const o of [-.45, .45]){ const r = new T.Mesh(new T.BoxGeometry(len + .1, .08, .1), rail); r.position.set((ax + bx) / 2 + (-dz / len) * o, .05, (az + bz) / 2 + (dx / len) * o); r.rotation.y = -Math.atan2(dz, dx); E.scene.add(r); }
      const n = Math.floor(len / .8); for (let i = 0; i <= n; i++){ const tie = new T.Mesh(new T.BoxGeometry(.2, .05, 1.3), E.mat(0x4a3420)); const f = i / Math.max(1, n); tie.position.set(ax + dx * f, .02, az + dz * f); tie.rotation.y = -Math.atan2(dz, dx); E.scene.add(tie); }
    };
    Object.values(ROUTES).forEach(r => { for (let i = 0; i < r.length - 1; i++) seg(r[i], r[i + 1]); });
    for (const [k, [x, lz]] of Object.entries(SWP)) R.plate(k, x, lz, 0xffc46b, 1.4, '⇄');
    R.plate('GO', -5.5, 2.2, 0x5ee07a, 1.4, '▶');
    for (const [x, lz] of [[-8, 13.2], [-2, 19.7], [9.6, 13]]){ const b = new T.Mesh(new T.BoxGeometry(1.4, 1, .5), E.mat(0xc03030)); R.place(b, x, lz, .5); }
    this.barricade = R.block(3.5, 20.3, 6.5, 21, 1.6, E.mat(0x6a4a2a), false);
    const g = new T.Group(); const base = new T.Mesh(new T.BoxGeometry(1.4, .4, 1.8), E.mat(0x3a3a44, { metalness: .5 })); base.position.y = .45; g.add(base);
    const lever = new T.Mesh(new T.BoxGeometry(1.6, .1, .2), E.mat(0x6a4a2a)); lever.position.y = 1.2; g.add(lever); g.userData.lever = lever;
    const glowC = new T.Mesh(new T.SphereGeometry(.3, 10, 8), E.glow(0x9fe8ff, 1.5)); glowC.position.y = .9; g.add(glowC);
    this.cart = g; E.scene.add(g);
  },
  init(){ return { run: 0, route: 'start', f: 0, cx: SY.S[0], cl: SY.S[1], crash: 0, done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    if (st.crash > 0){ st.crash -= dt; if (st.crash <= 0){ st.run = 0; st.route = 'start'; st.f = 0; [st.cx, st.cl] = SY.S; } return; }
    if (!st.run){ if (R.edge('GO')){ st.run = 1; E.ev('whoosh', 'The runaway car rattles off down the tracks!'); } return; }
    const r = ROUTES[st.route]; let len = 0; for (let i = 0; i < r.length - 1; i++) len += Math.hypot(r[i + 1][0] - r[i][0], r[i + 1][1] - r[i][1]);
    st.f += dt * 3 * E.GMULT / len;
    let d = Math.min(1, st.f) * len, i = 0;
    while (i < r.length - 2 && d > Math.hypot(r[i + 1][0] - r[i][0], r[i + 1][1] - r[i][1])){ d -= Math.hypot(r[i + 1][0] - r[i][0], r[i + 1][1] - r[i][1]); i++; }
    const a = r[i], b = r[i + 1], sl = Math.hypot(b[0] - a[0], b[1] - a[1]); st.cx = a[0] + (b[0] - a[0]) * d / sl; st.cl = a[1] + (b[1] - a[1]) * d / sl;
    for (const p of E.P) if (!p.frozen && !p.dashing && near(R, p, st.cx, st.cl, 1.1)) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} got run over by the handcar!`);
    if (st.f >= 1){
      const sw = n => R.held(n);
      const next = { start: sw('J1') ? 'j1a' : 'j1b', j1a: sw('J2') ? 'j2a' : 'j2b', j2a: sw('J3') ? 'j3a' : 'j3b' }[st.route];
      if (next){ st.route = next; st.f = 0; E.ev('click'); }
      else if (st.route === 'j3a'){ st.done = 1; R.open('exit'); E.ev('door', 'CRASH! The handcar smashes through the barricade!'); }
      else { st.crash = 2; E.ev('thud', 'The car hits a dead end and rolls back to the start.'); }
    }
  },
  visual(dt, t, st, R, E){
    this.cart.position.set(st.cx, 0, R.Z(st.cl)); this.cart.userData.lever.rotation.z = st.run ? Math.sin(t * 8) * .4 : 0;
    this.barricade.visible = !st.done;
    for (const n of Object.keys(SWP)) R.glow(n, R.held(n) ? 1.4 : .4);
  },
  objective(st, R, E){ return st.done ? 'The barricade is smashed — onward!' : `Route the runaway handcar into the barricade (top right). Each ⇄ switch only stays thrown <b>while someone stands on it</b>. Press ▶ to release the car.`; }
};

/* =============================================================== */
const BAG = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) BAG.push([-5.25 + c * 3.5, 8 + r * 3.5]);
const baggage = {
  name: 'The Baggage Car',
  floor: carFloor,
  notes: [[-6, 2, '“Mimics hold their breath when you\'re close. From afar, you can see them twitch.”', 1.6]],
  hint: 'Mimic trunks twitch — but only when you\'re standing far away from them (more than 6 steps). One of you stays back, watches, and PINGS the trunks that DON\'T twitch. The other opens those. Four real trunks hold the gears you need.',
  build(R, E){
    this.trunks = BAG.map(([x, lz]) => R.place(trunkMesh(E, 0x5a3a2a), x, lz));
    this.orbs = orbRow(E, R, 4, -1.95, 21.3);
  },
  init(R, E){ const idx = E.shuffle(BAG.map((_, i) => i)); return { real: idx.slice(0, 4).reduce((m, i) => m | (1 << i), 0), opened: 0, bad: 0, open: [0, 0], got: 0 }; },
  solve(st){ st.got = 4; },
  host(dt, st, R, E){
    if (st.got >= 4) return;
    for (const p of E.P){
      const i = BAG.findIndex(([x, lz]) => near(R, p, x, lz, 1.3));
      if (i < 0 || p.frozen || ((st.opened | st.bad) & (1 << i))){ st.open[p.idx] = 0; continue; }
      st.open[p.idx] += dt;
      if (st.open[p.idx] > .9){
        st.open[p.idx] = 0;
        if (st.real & (1 << i)){ st.opened |= 1 << i; st.got++; E.ev('chime', st.got < 4 ? `A brass gear! (${st.got}/4)` : '', st.got); if (st.got >= 4){ R.open('exit'); E.ev('door', 'All four gears found — the car door unjams!'); } }
        else { st.bad |= 1 << i; E.freeze(p.idx, E.FREEZE, 'CHOMP! A luggage mimic!'); }
      }
    }
  },
  visual(dt, t, st, R, E){
    this.trunks.forEach((g, i) => {
      const [x, lz] = BAG[i], far = Math.hypot(E.me.pos.x - x, R.lz(E.me.pos.z) - lz) > 6, mimic = !(st.real & (1 << i)), bad = st.bad & (1 << i), op = st.opened & (1 << i);
      g.userData.teeth.visible = !!bad;
      let lid = 0; if (bad) lid = -.9 + Math.sin(t * 8) * .2; else if (op) lid = -1.4; else if (mimic && far) lid = -Math.max(0, Math.sin(t * 3 + i * 1.7)) * .35;
      g.userData.lid.rotation.x += (lid - g.userData.lid.rotation.x) * E.damp(10, dt);
      g.position.y = mimic && far && !bad ? Math.max(0, Math.sin(t * 3 + i * 1.7)) * .08 : 0;
    });
    setOrbs(this.orbs, st.got);
  },
  bar(st, R, E){ const v = st.open[E.myIdx()]; return v > 0 ? { frac: v / .9, label: 'Opening…', color: '#c9a24a' } : null; },
  objective(st, R, E){ return st.got >= 4 ? 'The door is open!' : `Find the 4 real trunks. Mimics <b>twitch — but only when you're far away</b> from them. Watch from a distance and PING the safe ones. (${st.got}/4)`; }
};

/* =============================================================== */
const PILE = [-7.5, 3], BOX = [7, 18.5];
const engineRoom = {
  name: 'The Engine Room',
  floor: E => E.mat(0x2a2420),
  notes: [[-4.5, 1.6, '“Keep her in the green. Too hot and she blows. Too cold and we stall.”', 1.6]],
  hint: 'Coal makes the fire hotter and the pressure climbs; the valve plate (far left) vents steam. Keep the needle in the GREEN band. One shovels coal (throw it into the firebox), the other works the valve.',
  build(R, E){
    const T = E.THREE;
    const boil = new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 9, 20), E.mat(0x2a2a30, { metalness: .6 })); boil.rotation.z = Math.PI / 2; R.place(boil, 1, 12, 2.2); R.block(-3.5, 9.8, 5.5, 14.2, .01, E.mat(0));
    const fb = new T.Mesh(new T.BoxGeometry(2, 1.6, 1.4), E.mat(0x1a1a1a, { metalness: .5 })); R.place(fb, BOX[0], BOX[1] + 1.2, .8);
    this.fire = new T.Mesh(new T.BoxGeometry(1.4, .8, .1), E.glow(0xff6a1a, 1)); R.place(this.fire, BOX[0], BOX[1] + .48, .6);
    const pile = new T.Mesh(new T.ConeGeometry(1.4, 1, 10), E.mat(0x111111)); R.place(pile, PILE[0], PILE[1] - .6, .5);
    R.plate('V', -8.5, 18, 0x9ad8ff, 1.6, '♨');
    this.gauge = textPlane(E, 2.6, 2.6); R.place(this.gauge, 0, 21.4, 1.8);
    R.ghost({ home: [0, 6], look: 'blob', tint: 0x2a2a2a, sp: 2, radius: 6, label: 'a coal sprite' });
  },
  init(){ return { p: .4, fire: .3, prog: 0, done: 0, items: [mkItem('coal', PILE[0], PILE[1]), mkItem('coal', PILE[0] + 1, PILE[1] + .8)] }; },
  solve(st){ st.done = 1; st.p = .65; },
  itemMesh(k, E){ if (k !== 'coal') return null; const T = E.THREE; return new T.Mesh(new T.DodecahedronGeometry(.3, 0), E.mat(0x111111, { roughness: .4, metalness: .3 })); },
  feed(st, R, E, it){ st.fire = Math.min(1, st.fire + .32); home(it); E.ev('whoosh'); },
  carryTick(st, R, E, it, p){ if (near(R, p, BOX[0], BOX[1], 1.6)) this.feed(st, R, E, it); },
  onLand(st, R, E, it){ if (Math.hypot(it.x - BOX[0], it.lz - BOX[1]) < 1.6) this.feed(st, R, E, it); },
  host(dt, st, R, E){
    if (st.done) return;
    const any = E.P.some(p => R.inside(p.pos));
    if (!any) return;
    st.fire = Math.max(0, st.fire - dt * .06);
    st.p = E.clamp(st.p + (st.fire * .16 - .045 - (R.held('V') ? .2 : 0)) * dt, 0, 1);
    const green = st.p > .55 && st.p < .75;
    if (green){ st.prog += dt; if (st.prog >= 16){ st.done = 1; R.open('exit'); E.ev('door', 'Full steam ahead! The engine room door opens.'); } }
    if (st.p >= .97){ st.p = .45; st.fire = .2; st.prog = Math.max(0, st.prog - 6); E.ev('boom', 'KA-BOOM! The boiler vents — everyone is blasted with steam!'); for (const p of E.P) if (R.inside(p.pos)) E.freeze(p.idx, 3, ''); }
    if (st.p <= .12 && st.prog > 0){ st.prog = 0; E.ev('wrong', 'The engine stalls! Progress lost.'); }
  },
  visual(dt, t, st, R, E){
    this.fire.material.emissiveIntensity = .3 + st.fire * 2 + Math.sin(t * 9) * .1;
    const k = Math.round(st.p * 100) + '|' + Math.round(st.prog);
    if (this._k !== k){ this._k = k; redraw(this.gauge, (c, w, h) => {
      c.fillStyle = '#efe4c8'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 4, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = '#3a2a1a'; c.stroke();
      const ang = v => Math.PI * .75 + v * Math.PI * 1.5; c.lineWidth = 18;
      c.strokeStyle = '#4ac06a'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 30, ang(.55), ang(.75)); c.stroke();
      c.strokeStyle = '#d04040'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 30, ang(.9), ang(1)); c.stroke();
      c.strokeStyle = '#1a1a1a'; c.lineWidth = 6; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(ang(st.p)) * (w / 2 - 40), h / 2 + Math.sin(ang(st.p)) * (w / 2 - 40)); c.stroke();
      c.fillStyle = '#3a2a1a'; c.font = 'bold 26px Georgia'; c.textAlign = 'center'; c.fillText(Math.floor(st.prog) + ' / 16', w / 2, h - 50);
    }); }
  },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; const green = st.p > .55 && st.p < .75; return { frac: st.p, label: green ? `In the green! ${Math.floor(st.prog)}/16s` : st.p >= .75 ? 'TOO HOT — vent steam!' : 'Too cold — more coal!', color: green ? '#4ac06a' : st.p >= .75 ? '#d04040' : '#7ab0ff' }; },
  objective(st, R, E){ return st.done ? 'Full steam ahead!' : 'Keep the boiler pressure in the <b>green band</b> for 16 seconds. Coal (throw it into the firebox, top-right) heats it up; the ♨ valve plate (far left) vents steam. Too hot and it blows!'; }
};

/* =============================================================== */
const DINERS = [[-7, 7], [7, 7], [-7, 14], [7, 14]], DISH = ['🍗', '🍰', '🍝', '🥧'], DCOL = [0xd08a3a, 0xff9ad0, 0xffe14d, 0xb06a3a];
const KITCH = [[-4.5, 20], [-1.5, 20], [1.5, 20], [4.5, 20]];
const dining = {
  name: 'The Dining Car',
  floor: carFloor,
  throwRange: 8,
  notes: [[3, 2, '“The passengers whisper their orders. Lean close to hear them.”', 1.6]],
  hint: 'You can only hear a diner\'s order when you stand right next to them. One of you listens and tells the other; the other grabs the right dish from the kitchen and throws it onto the diner\'s table. A wrong dish makes them throw a fit.',
  build(R, E){
    const T = E.THREE;
    DINERS.forEach(([x, lz]) => { const tb = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, .1, 16), E.mat(0xf2ead8)); R.place(tb, x + (x < 0 ? 2 : -2), lz, .9); const leg = new T.Mesh(new T.CylinderGeometry(.1, .1, .9, 6), E.mat(0x3a2a1a)); R.place(leg, x + (x < 0 ? 2 : -2), lz, .45); R.block(x + (x < 0 ? 1 : -3), lz - 1, x + (x < 0 ? 3 : -1), lz + 1, .01, E.mat(0)); });
    const counter = new T.Mesh(new T.BoxGeometry(12, 1, 1), E.mat(0x8a6a42)); R.place(counter, 0, 21.2, .5);
    this.diners = DINERS.map(([x, lz]) => R.ghost({ home: [x, lz], look: 'hat', tint: 0xd8c8ff, harmless: true, sp: 0, label: 'a diner', think: (g, dt) => { g.ry = x < 0 ? Math.PI / 2 : -Math.PI / 2; return true; } }));
    this.orbs = orbRow(E, R, 4, -1.95, 2.2, 1.3, 1.6);
  },
  init(R, E){ return { want: DINERS.map(() => Math.floor(Math.random() * 4)), fed: 0, items: KITCH.map(([x, lz], i) => mkItem('dish' + i, x, lz, { yRest: 1 })) }; },
  solve(st){ st.fed = 15; },
  itemMesh(k, E){ if (!k.startsWith('dish')) return null; const T = E.THREE, g = new T.Group(); g.add(new T.Mesh(new T.CylinderGeometry(.4, .3, .08, 14), E.mat(0xf2f2f2))); const food = new T.Mesh(new T.SphereGeometry(.25, 10, 8), E.mat(DCOL[+k.slice(4)])); food.position.y = .15; food.scale.y = .6; g.add(food); return g; },
  serve(st, R, E, it, x, lz){
    const di = DINERS.findIndex(([dx, dl]) => Math.hypot(x - (dx + (dx < 0 ? 2 : -2)), lz - dl) < 1.5 || Math.hypot(x - dx, lz - dl) < 1.2);
    if (di < 0 || (st.fed & (1 << di))) return;
    if (+it.k.slice(4) === st.want[di]){ st.fed |= 1 << di; home(it); E.ev('chime', `“Delicious!” (${[1, 2, 4, 8].filter(b => st.fed & b).length}/4)`, 2); }
    else { home(it); E.ev('boo', '“THAT\'S NOT WHAT I ORDERED!”'); for (const p of E.P) if (near(R, p, DINERS[di][0], DINERS[di][1], 3.2)) E.freeze(p.idx, 3, ''); }
    if (st.fed === 15 && !R.isOpen('exit')){ R.open('exit'); E.ev('door', 'Every diner is happy — the car door opens!'); }
  },
  carryTick(st, R, E, it, p){ this.serve(st, R, E, it, p.pos.x, R.lz(p.pos.z)); },
  onLand(st, R, E, it){ this.serve(st, R, E, it, it.x, it.lz); },
  visual(dt, t, st, R, E){ setOrbs(this.orbs, [1, 2, 4, 8].filter(b => st.fed & b).length); },
  panel(st, R, E){
    const di = DINERS.findIndex(([x, lz]) => near(R, { pos: E.me.pos }, x, lz, 2.2));
    if (di < 0 || (st.fed & (1 << di))) return null;
    return `<div>The diner whispers:</div><div class="big1">${DISH[st.want[di]]}</div><div>“…I'd like the ${['roast chicken', 'cake', 'spaghetti', 'pie'][st.want[di]]}, please.”</div>`;
  },
  objective(st, R, E){ return st.fed === 15 ? 'Everyone is fed!' : `Serve each ghost diner the dish they whisper (stand next to them to hear). Dishes are on the kitchen counter (north). Carry or <b>throw</b> a dish onto their table. (${[1, 2, 4, 8].filter(b => st.fed & b).length}/4)`; }
};

/* =============================================================== */
const BELTS = [[-9.5, -5], [-2, 2], [5, 9.5]], SLOTS = [[-9.6, 12, 0], [9.6, 8, 1], [9.6, 16, 2]], MCOL = [0xff5a5a, 0x5aa2ff, 0x5ee07a];
const onBelt = pos => BELTS.some(([a, b]) => pos.x > a && pos.x < b);
const mail = {
  name: 'The Mail Car',
  floor: carFloor,
  notes: [[3.5, 1.4, '“Sort the letters before the shredder eats them.”', 1.4]],
  hint: 'Three conveyor belts carry letters toward the shredder at the south end. Grab a letter and take it (or throw it) to the wall slot with the matching color. Walking against a belt is slow — use the still floor between belts.',
  build(R, E){
    const T = E.THREE;
    this.beltTex = E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#2a2a30'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a4a54'; for (let i = 0; i < 4; i++) x.fillRect(0, i * 16, w, 6); }, 1, 6);
    this.belts = BELTS.map(([a, b]) => R.floor(a, 2.5, b, 21, E.mat(0xffffff, { map: this.beltTex }), .014));
    const shred = new T.Mesh(new T.BoxGeometry(20, .6, 1), E.mat(0x3a3a44, { metalness: .6 })); R.place(shred, 0, 1.8, .3);
    SLOTS.forEach(([x, lz, c]) => { const s = new T.Mesh(new T.BoxGeometry(.3, 1.4, 2), E.glow(MCOL[c], .7)); R.place(s, x, lz, 1); });
    this.orbs = orbRow(E, R, 6, -3.25, 21.3);
  },
  init(){ const items = []; for (let i = 0; i < 4; i++) items.push(this.newLetter(i)); return { got: 0, items }; },
  newLetter(i){ const b = BELTS[i % 3]; return mkItem('mail' + Math.floor(Math.random() * 3), (b[0] + b[1]) / 2 + (Math.random() - .5) * 2, 18 + Math.random() * 2.5); },
  solve(st){ st.got = 6; },
  itemMesh(k, E){ if (!k.startsWith('mail')) return null; const T = E.THREE, g = new T.Group(); g.add(new T.Mesh(new T.BoxGeometry(.7, .06, .45), E.mat(0xf2ead8))); const st = new T.Mesh(new T.BoxGeometry(.18, .07, .18), E.glow(MCOL[+k.slice(4)], .8)); st.position.set(.2, .02, -.1); g.add(st); return g; },
  push(st, R, E, pos){ return R.inside(pos) && onBelt(pos) && R.lz(pos.z) > 2.5 && !st.done ? [0, 2.8] : null; },
  sort(st, R, E, it, x, lz){
    const sl = SLOTS.find(([sx, sl2]) => Math.hypot(x - sx, lz - sl2) < 1.9);
    if (!sl) return false;
    if (+it.k.slice(4) === sl[2]){ st.got++; E.ev('chime', st.got < 6 ? `Sorted! (${st.got}/6)` : '', 1 + st.got % 4); }
    else E.ev('wrong', 'Wrong slot! That letter got lost.');
    Object.assign(it, this.newLetter(Math.floor(Math.random() * 3)));
    if (st.got >= 6 && !R.isOpen('exit')){ st.done = 1; R.open('exit'); E.ev('door', 'All the mail is sorted — the door opens!'); }
    return true;
  },
  carryTick(st, R, E, it, p){ this.sort(st, R, E, it, p.pos.x, R.lz(p.pos.z)); },
  onLand(st, R, E, it){ this.sort(st, R, E, it, it.x, it.lz); },
  host(dt, st, R, E){
    for (const it of st.items){
      if (it.s !== 0) continue;
      if (onBelt({ x: it.x }) ) it.lz = +(it.lz - 2.8 * dt).toFixed(3);
      if (it.lz < 2.4){ Object.assign(it, this.newLetter(Math.floor(Math.random() * 3))); E.ev('thud'); }
    }
  },
  visual(dt, t, st, R, E){ this.beltTex.offset.y = (t * .45) % 1; setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 6 ? 'All sorted — onward!' : `Letters ride the belts toward the shredder. Take each one to the wall slot of the <b>same color</b> (or throw it in). (${st.got}/6)`; }
};

/* =============================================================== */
const GAP = 11;
const coupling = {
  name: 'The Coupling',
  floor: E => E.mat(0x3a3a40),
  notes: [[0, 2, '“The cars are drifting apart! Pull both coupling pins at once.”', 1.4]],
  hint: 'The gap between the cars widens and narrows as the train rounds the bends. DASH across when it\'s narrow. Then one of you holds the pin on each side at the same time.',
  build(R, E){
    const T = E.THREE;
    this.gapM = R.floor(-10, GAP - 1, 10, GAP + 1, new T.MeshBasicMaterial({ color: 0x050405 }), .02);
    this.lipS = new T.Mesh(new T.BoxGeometry(20, .3, .3), E.mat(0x8a8a94, { metalness: .6 })); E.scene.add(this.lipS); this.lipN = this.lipS.clone(); E.scene.add(this.lipN);
    R.plate('PS', -8, 6, 0xffc46b, 1.6, '⚙'); R.plate('PN', 8, 16, 0xffc46b, 1.6, '⚙');
    const lunge = E.AI.lunger(3.2, 9, 1.6);
    for (const [x, lz] of [[-3, 4], [4, 18.5]]){ R.place(trunkMesh(E, 0x4a2a1a), x, lz); R.ghost({ home: [x, lz], look: 'small', tint: 0x4a2a1a, flat: true, label: 'a luggage mimic', think: lunge }); }
  },
  init(){ return { t: 0, hold: 0, done: 0 }; },
  solve(st){ st.done = 1; },
  half(st, R){ return st.done ? 0 : .45 + 1.65 * (1 + Math.sin((R.local.t ?? st.t) * .85)) / 2; },
  pits(st, R){ const h = this.half(st, R); return h > .05 ? [R.rect(-10.5, GAP - h, 10.5, GAP + h)] : []; },
  push(st, R, E, pos){ return R.inside(pos) && !st.done ? [Math.sin(E.elapsed * .9) * 1.4, 0] : null; },
  host(dt, st, R, E){
    if (st.done) return; st.t += dt;
    if (R.on('PS') && R.on('PN') || (E.solo() && R.held('PS') && R.held('PN'))){ st.hold += dt; if (st.hold > 2){ st.done = 1; R.open('exit'); E.ev('door', 'CLANK — the cars lock together!'); } } else st.hold = 0;
  },
  local(dt, st, R){ const L = R.local; L.t = L.t === undefined || Math.abs(L.t - st.t) > .3 ? st.t : L.t + dt + (st.t - L.t) * .1; },
  visual(dt, t, st, R, E){ const h = this.half(st, R); this.gapM.scale.y = Math.max(.01, h); this.gapM.visible = h > .05; this.lipS.position.set(0, .15, R.Z(GAP - h)); this.lipN.position.set(0, .15, R.Z(GAP + h)); },
  bar(st, R, E){ return st.hold > 0 && !st.done ? { frac: st.hold / 2, label: 'Coupling…', color: '#ffc46b' } : null; },
  objective(st, R, E){ return st.done ? 'The cars are locked together!' : 'The gap between the cars keeps widening and narrowing. <b>Dash</b> across when it\'s narrow, then hold BOTH coupling pins (one on each side) at the same time.'; }
};

/* =============================================================== */
const CORDS = [[-8.5, 5], [8.5, 11], [-8.5, 18.5]];
const conductor = {
  name: "The Conductor's Car",
  floor: carFloor,
  notes: [[0, 2, '“The Conductor goes wherever he hears a call. Use that.”', 1.4]],
  hint: 'The Conductor can\'t be stunned — but he always walks over to check a fresh PING. One of you pings far away from the cord your partner is pulling. Each brake cord takes a few seconds to pull.',
  build(R, E){
    const T = E.THREE;
    this.cords = CORDS.map(([x, lz], i) => { R.plate('c' + i, x, lz, 0xff5050, 1.6, '⛔'); const c = new T.Mesh(new T.CylinderGeometry(.05, .05, 2, 6), E.mat(0xc03030)); R.place(c, x + (x < 0 ? -.8 : .8), lz, 1.6); const h = new T.Mesh(new T.TorusGeometry(.2, .05, 6, 12), E.mat(0xd4af37, { metalness: .7 })); R.place(h, x + (x < 0 ? -.8 : .8), lz, .55); return h; });
    for (const [x, lz] of [[-4, 8], [4, 8], [-4, 14], [4, 14], [0, 11]]){ const s = new T.Mesh(new T.BoxGeometry(2, .9, 1.2), E.mat(0x6a2a3a)); R.place(s, x, lz, .45); R.block(x - 1, lz - .6, x + 1, lz + .6, .01, E.mat(0)); }
    this.boss = R.ghost({ home: [0, 20], ...conductorMesh, scale: 1.6, flashImmune: true, label: 'the Conductor', sp: 0, touch: 1.4, gone: st => !!st.done,
      think: (g, dt, st, R2, E2, P) => {
        const m = g.mem;
        if (st.lure && E2.elapsed - st.lure[2] < 5){
          const d = E2.stepToward(g, st.lure[0], R2.Z(st.lure[1]), 3.4 * E2.GMULT, dt);
          if (d < .4){ m.look = (m.look || 0) + dt; g.ry += dt * 2.5; if (m.look > 1.6){ st.lure = null; m.look = 0; E2.ev('laugh', '“Hmph. Nobody here.”'); } }
        } else {
          const T = E2.targetsOf(g, P).filter(p => R2.inside(p.pos)); let best = null, bd = 99;
          for (const p of T){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
          if (best) E2.stepToward(g, best.pos.x, best.pos.z, (2.6 + st.n * .3) * E2.GMULT, dt);
        }
        const v = new E2.THREE.Vector3(g.x, 0, g.z); E2.resolve(v, E2.staticRects()); g.x = v.x; g.z = v.z;
        if (E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), 1.4)) g.ret = false;
        return true;
      },
      onHitGhost: null });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3);
  },
  init(){ return { pull: [0, 0, 0], n: 0, lure: null, done: 0 }; },
  solve(st){ st.pull = [3, 3, 3]; st.n = 3; st.done = 1; },
  onPing(st, R, E, idx, x, z){ if (!st.done) st.lure = [+x.toFixed(2), +R.lz(z).toFixed(2), E.elapsed]; },
  onHitGhost(st, R, E, it, g){ return g !== this.boss; },
  host(dt, st, R, E){
    if (st.done) return;
    for (let i = 0; i < 3; i++){
      if (st.pull[i] >= 2.5) continue;
      if (E.P.some(p => R.at('c' + i, p.pos) && !p.frozen)){ st.pull[i] += dt; if (st.pull[i] >= 2.5){ st.n++; E.ev('gong', st.n < 3 ? `Brake cord pulled! (${st.n}/3) The train shudders…` : '', 120 + st.n * 30); } }
      else st.pull[i] = Math.max(0, st.pull[i] - dt * .5);
    }
    if (st.n >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'SCREEEECH — the ghost train grinds to a halt and the Conductor fades away! Doors open.'); }
  },
  visual(dt, t, st, R, E){ this.cords.forEach((h, i) => h.position.y = st.pull[i] >= 2.5 ? .25 : .55 - st.pull[i] * .1); setOrbs(this.orbs, st.n); },
  bar(st, R, E){ const i = [0, 1, 2].find(k => R.at('c' + k, E.me.pos)); if (i === undefined || st.pull[i] >= 2.5) return null; return { frac: st.pull[i] / 2.5, label: 'Pulling the brake cord…', color: '#ff5050' }; },
  objective(st, R, E){ return st.done ? 'The train has stopped — get off!' : `Pull all 3 emergency brake cords (stand on ⛔ for a few seconds). The Conductor can't be stunned — but he'll walk over to any fresh <b>PING</b>. Lure him away! (${st.n}/3)`; }
};

export default {
  level: 7,
  // texture pack in tex/level7/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  wallImg: 'carriage_panels', trimImg: 'train_brass', texVer: 1,
  texFloors: {
    "Platform 13": "platform_bricks",
    "Ticket Inspection": "inspection_carpet",
    "The Roof Run": "roof_tin",
    "The Switching Yard": "yard_gravel",
    "The Baggage Car": "baggage_boards",
    "The Engine Room": "engine_tread",
    "The Dining Car": "dining_parquet",
    "The Mail Car": "mail_lino",
    "The Coupling": "coupling_plate",
    "The Conductor's Car": "ping_carpet"
  },
  title: 'The Ghost Train',
  tagline: 'The midnight train has no stops.<br>Nobody who boards it ever gets off.',
  story: 'The whistle screams. The carriages rattle through the dark. Get to the front and stop this train.',
  winTitle: 'You stopped the ghost train! 🚂',
  feature: { name: 'Ping', icon: '📍', how: '<b>Click</b> the ground (PC) or <b>tap</b> the screen (phone) to drop a glowing marker your partner can see. Press <b>Q</b> to ping where you stand.' },
  accent: '#e0505a',
  wallColor: 0x3a1a20,
  trimColor: 0xc9a24a,
  doorColor: 0x2a1a14,
  sky: 0x7a6a8a,
  bg: 0x07050a,
  drone: 38,
  rooms: [platform, inspection, roof, yard, baggage, engineRoom, dining, mail, coupling, conductor],
};
