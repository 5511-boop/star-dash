// Level 3 — The Clocktower. Room coordinates are local: x -10..10, lz 0 (south wall) .. 22 (north wall).

function arrivals(R, key, P, cellOf){
  const prev = R.local[key] || (R.local[key] = [-1, -1]), out = [];
  for (const p of P){
    const c = p.frozen ? -1 : cellOf(p.pos);
    if (c !== prev[p.idx] && c >= 0) out.push({ idx: p.idx, cell: c });
    prev[p.idx] = c;
  }
  return out;
}
function orbRow(E, R, n, x0, lz, dx = 1.3, y = 2){
  const arr = [];
  for (let i = 0; i < n; i++){ const o = new E.THREE.Mesh(new E.THREE.SphereGeometry(.2, 12, 10), E.glow(0x333344, .2)); R.place(o, x0 + i * dx, lz, y); arr.push(o); }
  return arr;
}
function setOrbs(orbs, k){ orbs.forEach((o, i) => { const on = i < k; o.material.color.setHex(on ? 0x8affc1 : 0x333344); o.material.emissive.setHex(on ? 0x4dff9a : 0x222233); o.material.emissiveIntensity = on ? 1.4 : .2; }); }
function textPlane(E, w, h, emissive = .7){
  const tex = E.canvasTex(256, Math.round(256 * h / w), () => {});
  const m = new E.THREE.Mesh(new E.THREE.PlaneGeometry(w, h), new E.THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive, transparent: true }));
  m.userData.tex = tex; return m;
}
function redraw(mesh, draw){ const t = mesh.userData.tex, c = t.image.getContext('2d'); c.clearRect(0, 0, t.image.width, t.image.height); draw(c, t.image.width, t.image.height); t.needsUpdate = true; }
const brassOf = E => E.mat(0xc9a24a, { metalness: .75, roughness: .3 });
function gearMesh(E, r, teeth, m){
  const T = E.THREE, g = new T.Group();
  const disc = new T.Mesh(new T.CylinderGeometry(r, r, .22, 24), m); g.add(disc);
  for (let i = 0; i < teeth; i++){ const a = i / teeth * Math.PI * 2, t = new T.Mesh(new T.BoxGeometry(.22, .22, .3), m); t.position.set(Math.cos(a) * (r + .1), 0, Math.sin(a) * (r + .1)); t.rotation.y = -a; g.add(t); }
  const hub = new T.Mesh(new T.CylinderGeometry(r * .3, r * .3, .3, 12), E.mat(0x3a2a1a)); g.add(hub);
  return g;
}
const woodFloor = E => E.mat(0xffffff, { map: E.tiledTex(256, 256, (x, w, h) => {
  x.fillStyle = '#4a3324'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++){ x.fillStyle = i % 2 ? '#553b29' : '#46301f'; x.fillRect(0, i * 32, w, 31); x.fillStyle = '#2e1f17'; x.fillRect((i * 97) % w, i * 32, 2, 32); }
}, 5, 5) });
const clockAngle = (x, lzRel) => Math.atan2(x, lzRel);                          // 0 = 12 o'clock, clockwise
const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };

/* =============================================================== */
const FACE = { lz: 11, r: 7.5 };
const clockFace = {
  name: 'The Clock Face',
  floor: woodFloor,
  notes: [[0, 2.3, '“Blue is the long minute hand. Pink is the short hour hand. YOU are the hands.”', 1.7]],
  build(R, E){
    const T = E.THREE, brass = brassOf(E);
    const face = new T.Mesh(new T.CylinderGeometry(FACE.r, FACE.r, .08, 48), E.mat(0xffffff, { map: E.canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#efe4c8'; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#3a2a1a'; x.lineWidth = 10; x.stroke();
      x.fillStyle = '#2a1a10'; x.font = 'bold 54px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let i = 1; i <= 12; i++){ const a = i / 12 * Math.PI * 2; x.fillText(String(i), w / 2 + Math.sin(a) * 205, h / 2 - Math.cos(a) * 205); }
      for (let i = 0; i < 60; i++){ const a = i / 60 * Math.PI * 2, r1 = i % 5 ? 235 : 225; x.lineWidth = i % 5 ? 3 : 6; x.beginPath(); x.moveTo(w / 2 + Math.sin(a) * r1, h / 2 - Math.cos(a) * r1); x.lineTo(w / 2 + Math.sin(a) * 248, h / 2 - Math.cos(a) * 248); x.stroke(); }
    }) }));
    R.place(face, 0, FACE.lz, .04);
    const mk = (len, col, w) => { const g = new T.Group(); const b = new T.Mesh(new T.BoxGeometry(w, .12, len), E.glow(col, .6)); b.position.z = -len / 2; g.add(b); const tip = new T.Mesh(new T.ConeGeometry(w * .9, .6, 4), E.glow(col, .8)); tip.rotation.x = -Math.PI / 2; tip.position.z = -len - .2; g.add(tip); return R.place(g, 0, FACE.lz, .2); };
    this.minute = mk(6.4, E.COLORS[0], .35); this.hour = mk(4.2, E.COLORS[1], .5);
    const hub = new T.Mesh(new T.CylinderGeometry(.6, .6, .5, 16), brass); R.place(hub, 0, FACE.lz, .25);
    this.board = textPlane(E, 4.4, 1.4); R.place(this.board, 0, 21.4, 1.7);
    this.orbs = orbRow(E, R, 3, 4.5, 21.3, 1.2, 1.8);
  },
  init(){
    const times = [];
    while (times.length < 3){ const h = 1 + Math.floor(Math.random() * 12), m = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; if (!times.some(t => t[0] === h)) times.push([h, m]); }
    return { times, k: 0, hold: 0, done: 0 };
  },
  solve(st){ st.k = 3; st.done = 1; },
  angles(st){ const [h, m] = st.times[Math.min(st.k, 2)]; return { min: m / 60 * Math.PI * 2, hr: ((h % 12) + m / 60) / 12 * Math.PI * 2 }; },
  playerAng(R, pos){ const dx = pos.x, dl = R.lz(pos.z) - FACE.lz, d = Math.hypot(dx, dl); return d > 1.6 && d < FACE.r + .6 ? clockAngle(dx, dl) : null; },
  host(dt, st, R, E){
    if (st.done) return;
    const tgt = this.angles(st), P = E.P, tol = .26;
    const p0 = P.find(p => p.idx === 0), p1 = P.find(p => p.idx === 1);
    const a0 = p0 ? this.playerAng(R, p0.pos) : null, a1 = p1 ? this.playerAng(R, p1.pos) : null;
    const okMin = a0 !== null && angDiff(a0, tgt.min) < tol;
    const okHr = E.solo() ? true : (a1 !== null && angDiff(a1, tgt.hr) < tol);
    if (okMin && okHr){ st.hold += dt; if (st.hold > 2){ st.k++; st.hold = 0; E.ev('gong', st.k < 3 ? `BONG! ${st.k} of 3 — next time!` : '', 220 + st.k * 40); if (st.k >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The clock strikes true. The door opens!'); } } }
    else st.hold = Math.max(0, st.hold - dt * 2);
  },
  visual(dt, t, st, R, E){
    const set = (hand, idx, fallback) => {
      const pos = E.playerPos(idx), a = pos && R.inside(pos) ? this.playerAng(R, pos) : null;
      const target = a !== null ? a : fallback;
      let cur = -hand.rotation.y, d = target - cur; d = Math.atan2(Math.sin(d), Math.cos(d));
      hand.rotation.y = -(cur + d * E.damp(8, dt));
    };
    const tg = this.angles(st);
    set(this.minute, 0, st.done ? t * .5 : tg.min + Math.sin(t) * .05);
    set(this.hour, E.solo() ? -1 : 1, st.done ? t * .04 : tg.hr);
    if (E.solo()){ let cur = -this.hour.rotation.y, d = tg.hr - cur; d = Math.atan2(Math.sin(d), Math.cos(d)); this.hour.rotation.y = -(cur + d * E.damp(6, dt)); }
    const key = st.k + '|' + st.done;
    if (this._k !== key){
      this._k = key;
      const [h, m] = st.times[Math.min(st.k, 2)];
      redraw(this.board, (c, w, hh) => { c.fillStyle = '#1a120a'; c.fillRect(0, 0, w, hh); c.fillStyle = st.done ? '#8aff9a' : '#ffd88a'; c.font = 'bold 54px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.done ? '✓' : `${h}:${String(m).padStart(2, '0')}`, w / 2, hh / 2); });
    }
    setOrbs(this.orbs, st.k);
  },
  bar(st, R, E){ if (st.done || st.hold <= 0) return null; return { frac: st.hold / 2, label: 'Hold it…', color: '#8affc1' }; },
  objective(st, R, E){
    if (st.done) return 'The clock strikes true! Through the door.';
    const [h, m] = st.times[st.k];
    return E.solo() ? `Stand where the long minute hand should point for <b>${h}:${String(m).padStart(2, '0')}</b> (the hour hand moves itself in solo). ${st.k}/3`
      : `Show <b>${h}:${String(m).padStart(2, '0')}</b>! Blue = long MINUTE hand, Pink = short HOUR hand. Stand on the clock face where your hand should point and hold still. (Remember: at :30 the hour hand sits halfway between numbers.) ${st.k}/3`;
  }
};

/* =============================================================== */
const ECHO_DELAY = 6;
const EPLATES = [['P1', -8, 4], ['P2', 8, 6], ['P3', -8, 15], ['P4', 8, 18]];
const echo = {
  name: 'The Echo Chamber',
  floor: E => E.mat(0x1e2230),
  notes: [[0, 2.3, '“Every step you take here is repeated six seconds later.”', 1.7]],
  build(R, E){
    const T = E.THREE;
    EPLATES.forEach(([n, x, lz]) => R.plate(n, x, lz, 0x9ad0ff, 1.8, n.slice(1)));
    R.block(-3, 9.5, 3, 11, 1.4, E.mat(0x3a3a5a));
    this.echoes = [E.makeChar(E.COLORS[0], true), E.makeChar(E.COLORS[1], true)];
    this.echoes.forEach(c => c.group.visible = false);
    for (let i = 0; i < 3; i++){ const pend = new T.Mesh(new T.SphereGeometry(.45, 14, 10), brassOf(E)); this['pend' + i] = R.place(pend, -6 + i * 6, 21, 1.8); }
  },
  init(){ return { echo: [0, 0], done: 0 }; },
  solve(st){ st.done = 1; },
  occupants(st, R){ return st.echo.filter(Boolean).map(([x, z]) => ({ x, z })); },
  host(dt, st, R, E){
    const L = R.local, t = E.elapsed;
    L.h = L.h || [[], []];
    for (const p of E.P){ const h = L.h[p.idx]; if (R.inside(p.pos)) h.push([t, p.pos.x, p.pos.z]); while (h.length && h[0][0] < t - ECHO_DELAY - 1) h.shift(); }
    for (let i = 0; i < 2; i++){
      const h = L.h[i]; let e = 0;
      for (let k = h.length - 1; k >= 0; k--){ if (h[k][0] <= t - ECHO_DELAY){ if (t - ECHO_DELAY - h[k][0] < .3) e = [+h[k][1].toFixed(2), +h[k][2].toFixed(2)]; break; } }
      st.echo[i] = e;
    }
    if (st.done) return;
    const need = E.solo() ? ['P1', 'P2'] : ['P1', 'P2', 'P3', 'P4'];
    if (need.every(n => R.on(n))){ st.done = 1; R.open('exit'); E.ev('door', 'Four plates at once — past and present together! The door opens.'); }
  },
  visual(dt, t, st, R, E){
    this.echoes.forEach((c, i) => {
      const e = st.echo[i]; c.group.visible = !!e && !st.done;
      if (e){ const nx = e[0], nz = e[1]; const mv = Math.hypot(nx - c.group.position.x, nz - c.group.position.z) > .01; c.group.position.set(nx, 0, nz); E.THREE && (c.bodyMat.color.setHex(E.COLORS[i])); c.t += dt * (mv ? 11 : 2); c.rig.position.y = mv ? Math.abs(Math.sin(c.t)) * .15 : 0; }
    });
    for (let i = 0; i < 3; i++) this['pend' + i].position.x = -6 + i * 6 + Math.sin(t * 2 + i) * .8;
    if (E.solo()){ R.glow('P3', .05); R.glow('P4', .05); }
    if (R.inside(E.me.pos)){ const s = Math.floor(t); if (s !== this._s){ this._s = s; E.sfx.tick(); } }
  },
  objective(st, R, E){
    if (st.done) return 'The door is open!';
    return E.solo() ? 'Your ghostly echo copies everything you do 6 seconds later. Hold plates 1 and 2 at the same time — you and your echo.'
      : 'Your ghostly echoes repeat your moves 6 seconds later. All FOUR plates must be pressed at once — by the two of you AND your two echoes.';
  }
};

/* =============================================================== */
const GX = [-6, -3, 0, 3, 6], GLZ = [8, 11, 14, 17], RUST = [[1, 1], [2, 2]], MOTOR = [0, 1], OUTPUT = [4, 2], NGEARS = 8;
const pegIdx = (c, r) => r * 5 + c;
function chainOK(pegs){
  const seen = new Set([pegIdx(...MOTOR)]), q = [MOTOR];
  if (!pegs[pegIdx(...MOTOR)]) return false;
  while (q.length){
    const [c, r] = q.shift(); if (c === OUTPUT[0] && r === OUTPUT[1]) return true;
    for (const [a, b] of [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]){ const i = pegIdx(a, b); if (a < 0 || a > 4 || b < 0 || b > 3 || seen.has(i) || !pegs[i]) continue; seen.add(i); q.push([a, b]); }
  }
  return false;
}
const gears = {
  name: 'The Gear Works',
  floor: E => E.mat(0x2a2620),
  notes: [[3, 1.8, '“Link the motor to the door. There are exactly enough gears — and rust won\'t hold one.”', 1.6]],
  build(R, E){
    const T = E.THREE, brass = brassOf(E), rust = E.mat(0x8a3a1a);
    this.pegMeshes = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++){
      const rusted = RUST.some(([a, b]) => a === c && b === r);
      const peg = new T.Mesh(new T.CylinderGeometry(.18, .22, .9, 10), rusted ? rust : E.mat(0x5a5a6a, { metalness: .6 })); R.place(peg, GX[c], GLZ[r], .45);
      if (rusted){ const x = new T.Mesh(new T.BoxGeometry(1.2, .05, .15), E.glow(0xff3a1a, .6)); x.rotation.y = .7; R.place(x, GX[c], GLZ[r], .05); const x2 = x.clone(); x2.rotation.y = -.7; R.place(x2, GX[c], GLZ[r], .05); }
      const g = gearMesh(E, .95, 10, brass); g.visible = false; R.place(g, GX[c], GLZ[r], .55); this.pegMeshes.push(g);
    }
    const motor = new T.Group(); const box = new T.Mesh(new T.BoxGeometry(1.4, 1.6, 1.4), E.mat(0x3a3a4a, { metalness: .5 })); box.position.y = .8; motor.add(box);
    this.motorGear = gearMesh(E, .8, 9, brass); this.motorGear.position.set(1, .55, 0); motor.add(this.motorGear); R.place(motor, -9.2, GLZ[1]);
    const out = new T.Group(); const box2 = new T.Mesh(new T.BoxGeometry(1.4, 1.6, 1.4), E.mat(0x3a3a4a, { metalness: .5 })); box2.position.y = .8; out.add(box2);
    this.outGear = gearMesh(E, .8, 9, brass); this.outGear.position.set(-1, .55, 0); out.add(this.outGear); R.place(out, 9.2, GLZ[2]);
    R.block(-9.9, GLZ[1] - .7, -8.5, GLZ[1] + .7, .01, brass); R.block(8.5, GLZ[2] - .7, 9.9, GLZ[2] + .7, .01, brass);
    R.zone('PILE', 0, 3.6, 2);
    this.pile = []; for (let i = 0; i < NGEARS; i++){ const g = gearMesh(E, .7, 8, brass); R.place(g, (i % 2 ? .3 : -.3), 3.6, .15 + i * .26); this.pile.push(g); }
    R.plate('CR', -8.5, 3, 0xffa040, 1.6, '⟳');
    this.carry = [gearMesh(E, .55, 8, brass), gearMesh(E, .55, 8, brass)]; this.carry.forEach(g => { g.visible = false; E.scene.add(g); });
  },
  init(){ return { pile: NGEARS, carry: [0, 0], pegs: Array(20).fill(0), done: 0 }; },
  solve(st){ st.done = 1; st.pile = 0; [[0, 1], [0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [3, 2], [4, 2]].forEach(([c, r]) => st.pegs[pegIdx(c, r)] = 1); },
  host(dt, st, R, E){
    const L = R.local; L.tk = L.tk || [0, 0]; L.msg = Math.max(0, (L.msg || 0) - dt);
    if (st.done) return;
    for (const p of E.P){
      if (p.frozen) continue;
      const lz = R.lz(p.pos.z);
      if (!st.carry[p.idx] && st.pile > 0 && R.at('PILE', p.pos)){ st.pile--; st.carry[p.idx] = 1; E.ev('pick'); continue; }
      let near = -1;
      for (let i = 0; i < 20; i++){ const c = i % 5, r = Math.floor(i / 5); if (Math.hypot(p.pos.x - GX[c], lz - GLZ[r]) < .95) near = i; }
      if (near < 0){ L.tk[p.idx] = 0; continue; }
      const c = near % 5, r = Math.floor(near / 5), rusted = RUST.some(([a, b]) => a === c && b === r);
      if (L.tk[p.idx] < 0) continue;                                   // step off the peg before it does anything else
      if (st.carry[p.idx] && !st.pegs[near]){
        if (rusted){ if (L.msg <= 0){ L.msg = 3; E.ev('wrong', 'That peg is rusted solid — a gear won\'t fit.'); } }
        else { st.pegs[near] = 1; st.carry[p.idx] = 0; E.ev('thud'); L.tk[p.idx] = -1; }
      } else if (!st.carry[p.idx] && st.pegs[near]){
        L.tk[p.idx] += dt; if (L.tk[p.idx] > 1.2){ st.pegs[near] = 0; st.carry[p.idx] = 1; L.tk[p.idx] = -1; E.ev('pick', 'Gear removed.'); }
      }
    }
    if (chainOK(st.pegs) && R.held('CR')){ st.done = 1; R.open('exit'); E.ev('door', 'The gears mesh and the motor roars — the door grinds open!'); }
  },
  visual(dt, t, st, R, E){
    const linked = chainOK(st.pegs), spin = st.done || (linked && R.on('CR'));
    this.pegMeshes.forEach((g, i) => { g.visible = !!st.pegs[i]; if (g.visible && (spin || R.on('CR'))) g.rotation.y += dt * (((i % 5) + Math.floor(i / 5)) % 2 ? 2 : -2) * (spin ? 1 : .15); });
    if (R.on('CR') || st.done) this.motorGear.rotation.y += dt * 2;
    if (spin) this.outGear.rotation.y -= dt * 2;
    this.pile.forEach((g, i) => g.visible = i < st.pile);
    for (let idx = 0; idx < 2; idx++){ const g = this.carry[idx], pp = E.playerPos(idx); g.visible = !!st.carry[idx] && !!pp; if (g.visible){ g.position.set(pp.x, 2.2, pp.z); g.rotation.y += dt; } }
  },
  objective(st, R, E){
    if (st.done) return 'The machine is running — the door is open!';
    const used = st.pegs.reduce((a, b) => a + b, 0);
    return `Take gears from the pile and walk them onto pegs to build a chain from the MOTOR (left) to the DOOR gear (right). Only ${NGEARS} gears — find the shortest route around the rusted pegs. Then ${E.solo() ? 'step on' : 'someone holds'} the crank ⟳. (Placed ${used}/${NGEARS}${chainOK(st.pegs) ? ' — linked!' : ''}) Stand on a placed gear to take it back.`;
  }
};

/* =============================================================== */
const CHASMS = [[6, 9], [14, 18]];
const PLANKS = [{ x: -5, lz: 3.5, len: 4.4 }, { x: 5, lz: 11.5, len: 5.4 }];
const bridge = {
  name: 'The Broken Bridge',
  floor: woodFloor,
  notes: [[1.5, 2.2, '“The planks are heavy — it takes two. Walk one to the edge, pointing across, and it will tip over.”', 1.5]],
  build(R, E){
    const T = E.THREE;
    CHASMS.forEach(([a, b]) => {
      R.floor(-10, a, 10, b, new T.MeshBasicMaterial({ color: 0x020104 }), .015);
      for (const lz of [a, b]){ const edge = new T.Mesh(new T.BoxGeometry(20, .25, .3), E.mat(0x5a4a3a)); R.place(edge, 0, lz, .12); }
    });
    this.planks = PLANKS.map(p => { const m = new T.Mesh(new T.BoxGeometry(p.len, .16, 1.3), E.mat(0x9a6a3a)); E.scene.add(m); return m; });
  },
  init(){ return { pl: PLANKS.map(p => ({ x: p.x, lz: p.lz, a: 0, s: 0, e: [-1, -1], tip: 0 })), done: 0 }; },
  solve(st){ st.done = 1; st.pl.forEach((p, i) => { p.s = 2; p.x = 0; p.a = Math.PI / 2; p.lz = (CHASMS[i][0] + CHASMS[i][1]) / 2; }); },
  pits(st, R){ return CHASMS.map(([a, b]) => R.rect(-10.5, a, 10.5, b)); },
  bridges(st, R){ return st.pl.filter(p => p.s === 2).map((p, i) => { const k = CHASMS.findIndex(([a, b]) => p.lz > a && p.lz < b); const [a, b] = CHASMS[k]; return R.rect(p.x - .8, a - .6, p.x + .8, b + .6); }); },
  ends(p, len){ const c = Math.cos(p.a), s = Math.sin(p.a); return [[p.x - c * len / 2, p.lz - s * len / 2], [p.x + c * len / 2, p.lz + s * len / 2]]; },
  dropPlank(p, i){
    p.s = 0; p.e = [-1, -1]; p.tip = 0;
    if (CHASMS.some(([a, b]) => p.lz > a - .3 && p.lz < b + .3)){ p.x = PLANKS[i].x; p.lz = PLANKS[i].lz; p.a = 0; }
  },
  onFall(st, R, E, idx){ st.pl.forEach((p, i) => { if (p.s === 1 && p.e.includes(idx)) this.dropPlank(p, i); }); },
  host(dt, st, R, E){
    const P = E.P, at = idx => { const p = P.find(q => q.idx === idx); return p && !p.frozen ? [p.pos.x, R.lz(p.pos.z), p] : null; };
    if (!R.isOpen('exit') && P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 18.6)){ R.open('exit'); st.done = 1; }
    st.pl.forEach((p, i) => {
      const len = PLANKS[i].len;
      if (p.s === 0){
        const [e0, e1] = this.ends(p, len), free = P.filter(q => !q.frozen && !st.pl.some(o => o.s === 1 && o.e.includes(q.idx)));
        const near = (e, q) => Math.hypot(q.pos.x - e[0], R.lz(q.pos.z) - e[1]) < 1.3;
        if (E.solo()){ const q = free.find(q => near(e0, q) || near(e1, q)); if (q){ p.s = 1; p.e = [q.idx, -1]; E.ev('pick', 'You heave the plank up.'); } }
        else {
          const a = free.find(q => near(e0, q)), b = free.find(q => q !== a && near(e1, q));
          if (a && b){ p.s = 1; p.e = [a.idx, b.idx]; E.ev('pick', 'Lift! You carry the plank together.'); }
          else if ((a || free.find(q => near(e1, q))) && !(R.local.hint > 0)){ R.local.hint = 4; E.ev('thud', 'Too heavy for one — your partner needs the other end.'); }
        }
        R.local.hint = (R.local.hint || 0) - dt;
      } else if (p.s === 1){
        const A = at(p.e[0]);
        if (!A){ this.dropPlank(p, i); return; }
        if (p.e[1] < 0){
          const ry = A[2].ry, fx = Math.sin(ry), fl = -Math.cos(ry);
          p.x = A[0] + fx * len / 2; p.lz = A[1] + fl * len / 2; p.a = Math.atan2(fl, fx);
        } else {
          const B = at(p.e[1]);
          if (!B){ this.dropPlank(p, i); return; }
          const d = Math.hypot(B[0] - A[0], B[1] - A[1]);
          if (d > len + 2.6 || d < 1){ this.dropPlank(p, i); E.ev('thud', 'You dropped the plank.'); return; }
          p.x = (A[0] + B[0]) / 2; p.lz = (A[1] + B[1]) / 2; p.a = Math.atan2(B[1] - A[1], B[0] - A[0]);
        }
        const [e0, e1] = this.ends(p, len), north = e0[1] > e1[1] ? e0 : e1, south = north === e0 ? e1 : e0;
        const k = CHASMS.findIndex(([a]) => Math.abs(Math.sin(p.a)) > .88 && north[1] > a - 1.4 && north[1] < a + 1.2 && south[1] < a);
        if (k >= 0 && !st.pl.some(o => o.s === 2 && o.lz > CHASMS[k][0] && o.lz < CHASMS[k][1]) && len > CHASMS[k][1] - CHASMS[k][0] + .2){
          p.tip += dt;
          if (p.tip > .7){ p.s = 2; p.e = [-1, -1]; p.a = Math.PI / 2; p.lz = (CHASMS[k][0] + CHASMS[k][1]) / 2; p.x = E.clamp(north[0], -9, 9); E.ev('thud', 'KA-THUNK! The plank tips over and bridges the chasm!'); }
        } else p.tip = 0;
      }
    });
  },
  visual(dt, t, st, R, E){
    st.pl.forEach((p, i) => { const m = this.planks[i]; m.position.set(p.x, p.s === 1 ? 1.1 : .1, R.Z(p.lz)); m.rotation.y = p.a; m.rotation.z = p.s === 1 && p.tip > 0 ? Math.sin(t * 30) * .03 : 0; });
  },
  objective(st, R, E){
    if (R.lz(E.me.pos.z) > 18.6) return 'You made it across!';
    return E.solo() ? 'Pick up a plank by walking to its end; it sticks out in front of you. Walk it to a chasm edge pointing straight across and it tips over into a bridge.'
      : 'Each of you stand at one END of a plank to lift it together. Carry it to the chasm edge pointing straight across (north) and it tips over to make a bridge. Don\'t step in the chasm!';
  }
};

/* =============================================================== */
const MX = [-6, -2, 2, 6], MLZ = [7, 11, 15], SYMS = [['☀', 0xffc84d], ['☾', 0x9ab8ff], ['★', 0xffe14d], ['♥', 0xff5a7a], ['♠', 0x9aff9a], ['♣', 0xd08aff]];
const memory = {
  name: 'The Memory Hall',
  floor: E => E.mat(0x22202a),
  notes: [[-5, 2.3, '“A tile only remembers while it is stood upon. Match the pairs together.”', 1.7]],
  build(R, E){
    const T = E.THREE;
    this.back = E.symTex(0x3a3448, '?', '#9a8ab8');
    this.fronts = SYMS.map(([s, c]) => E.symTex(c, s, '#15101f'));
    this.tiles = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++){
      const i = r * 4 + c;
      R.zone('t' + i, MX[c], MLZ[r], 2.6);
      const m = new T.Mesh(new T.BoxGeometry(2.6, .12, 2.6), new T.MeshStandardMaterial({ map: this.back, emissive: 0xffffff, emissiveMap: this.back, emissiveIntensity: .25 }));
      R.place(m, MX[c], MLZ[r], .06); this.tiles.push(m);
    }
    this.orbs = orbRow(E, R, 6, -3.25, 21.3);
  },
  init(R, E){ return { sym: E.shuffle([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]), found: Array(12).fill(0), done: 0, mis: 0 }; },
  solve(st){ st.found.fill(1); st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    const shown = [];
    for (let i = 0; i < 12; i++) if (!st.found[i] && R.held('t' + i)) shown.push(i);
    if (shown.length === 2){
      const [a, b] = shown;
      if (st.sym[a] === st.sym[b]){ st.found[a] = st.found[b] = 1; st.mis = 0; const n = st.found.filter(Boolean).length / 2; E.ev('chime', n < 6 ? `A match! ${n} of 6.` : '', n); if (n === 6){ st.done = 1; R.open('exit'); E.ev('door', 'Every pair found — the hall remembers you. Door open!'); } }
      else { st.mis += dt; if (st.mis > .9 && st.mis - dt <= .9) E.ev('wrong'); }
    } else st.mis = 0;
  },
  visual(dt, t, st, R, E){
    const showOf = i => st.found[i] || (E.solo() ? R.held('t' + i) : R.on('t' + i));
    this.tiles.forEach((m, i) => {
      const tex = showOf(i) ? this.fronts[st.sym[i]] : this.back;
      if (m.material.map !== tex){ m.material.map = tex; m.material.emissiveMap = tex; m.material.needsUpdate = true; }
      m.material.emissiveIntensity = st.found[i] ? .5 : showOf(i) ? .9 : .25;
    });
    setOrbs(this.orbs, st.found.filter(Boolean).length / 2);
  },
  objective(st, R, E){
    if (st.done) return 'All pairs found! The door is open.';
    return E.solo() ? 'Tiles show their picture while stood on (and for 5 seconds after, in solo). Find all 6 matching pairs.'
      : 'A tile only shows its picture while someone stands on it. Each of you stand on a tile at the same time — if they match, they stay. Find all 6 pairs!';
  }
};

/* =============================================================== */
const DGX = [-8, -4, 0, 4, 8], DGLZ = [4.5, 8.5, 12.5, 16.5, 20];
const STONES = [['S1', -9.2, 2.2], ['S2', 9.2, 2.2], ['S3', -9.2, 14.5], ['S4', 9.2, 14.5]];
const dowsing = {
  name: 'The Dowsing Garden',
  floor: E => E.mat(0x1c2a1a),
  notes: [[0, 1.6, '“The ley stones feel the buried key. Each stone tells how far.”', 1.5]],
  build(R, E){
    const T = E.THREE, stone = E.mat(0x7a7a84), dirt = E.mat(0x4a3324);
    this.graves = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++){
      const g = new T.Group();
      const mound = new T.Mesh(new T.SphereGeometry(.9, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), dirt); mound.scale.set(1, .35, 1.3); g.add(mound);
      const head = new T.Mesh(new T.BoxGeometry(.9, 1.1, .2), stone); head.position.set(0, .55, -1.1); g.add(head);
      const hole = new T.Mesh(new T.CylinderGeometry(.8, .8, .05, 16), new T.MeshBasicMaterial({ color: 0x050302 })); hole.position.y = .03; hole.visible = false; g.add(hole);
      g.userData.hole = hole; g.userData.mound = mound;
      R.place(g, DGX[c], DGLZ[r]); this.graves.push(g);
    }
    STONES.forEach(([n, x, lz]) => { R.plate(n, x, lz, 0x9a7aff, 1.4, '◆'); const m = new T.Mesh(new T.CylinderGeometry(.25, .35, 1.4, 6), E.glow(0x9a7aff, .4)); R.place(m, x + (x < 0 ? -.5 : .5), lz, .7); });
    const key = new T.Group(); key.add(new T.Mesh(new T.TorusGeometry(.25, .07, 8, 14), E.glow(0xffd84d, 1))); const sh = new T.Mesh(new T.BoxGeometry(.1, .7, .1), E.glow(0xffd84d, 1)); sh.position.y = -.5; key.add(sh);
    this.key = key; key.visible = false; E.scene.add(key);
    R.ghost({ b: [-9.4, 9.4, 1, 21.4], home: [0, 12], sp: 2.8, think: (g, dt, st, R2, E2, P) => {
      if (st.ang <= 0){ g.y = 12; g.x = DGX[st.gx % 5]; g.z = R2.Z(DGLZ[Math.floor(st.gx / 5)]); return true; }
      st.ang -= dt;
      const tg = P.filter(p => !p.frozen && R2.inside(p.pos));
      let best = null, bd = 99; for (const p of tg){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
      if (best) E2.stepToward(g, best.pos.x, best.pos.z, 2.8, dt);
      if (E2.ghostTouch(g, tg, E2.names())) st.ang = 0;
      return true;
    } });
  },
  init(){ return { key: 5 + Math.floor(Math.random() * 20), dug: 0, found: 0, ang: 0, gx: 12 }; },
  solve(st){ st.found = 1; },
  host(dt, st, R, E){
    const L = R.local; L.dig = L.dig || [0, 0];
    if (st.found) return;
    for (const p of E.P){
      let gi = -1; const lz = R.lz(p.pos.z);
      for (let i = 0; i < 25; i++) if (Math.hypot(p.pos.x - DGX[i % 5], lz - DGLZ[Math.floor(i / 5)]) < .9) gi = i;
      if (gi < 0 || p.frozen || (st.dug & (1 << gi))){ L.dig[p.idx] = 0; continue; }
      L.dig[p.idx] += dt;
      if (L.dig[p.idx] > 1.6){
        L.dig[p.idx] = 0;
        if (gi === st.key){ st.found = 1; R.open('exit'); E.ev('door', 'CLANK — the shovel hits the key! The garden gate opens.'); }
        else { st.dug |= 1 << gi; st.gx = gi; st.ang = 8; E.ev('boo', 'Empty grave… and something is climbing OUT of it!'); }
      }
    }
  },
  visual(dt, t, st, R, E){
    this.graves.forEach((g, i) => { const d = !!(st.dug & (1 << i)) || (st.found && i === st.key); g.userData.hole.visible = d; g.userData.mound.visible = !d; });
    this.key.visible = !!st.found; if (st.found){ this.key.position.set(DGX[st.key % 5], 1.6 + Math.sin(t * 3) * .15, R.Z(DGLZ[Math.floor(st.key / 5)])); this.key.rotation.y += dt * 2; }
  },
  panel(st, R, E){
    if (st.found) return null;
    const s = STONES.find(([n]) => R.at(n, E.me.pos));
    if (!s) return null;
    const kx = DGX[st.key % 5], kl = DGLZ[Math.floor(st.key / 5)], d = Math.hypot(s[1] - kx, s[2] - kl);
    return `<div>The ley stone hums…</div><div class="big1">${d.toFixed(1)} paces</div><div>from this stone to the buried key.</div>`;
  },
  bar(st, R, E){
    const L = R.local; if (st.found || !L.dig) return null;
    const v = L.dig[E.myIdx()]; if (!v) return null;
    return { frac: v / 1.6, label: 'Digging…', color: '#c8a26a' };
  },
  objective(st, R, E){
    if (st.found) return 'You found the key! The gate is open.';
    return `A key is buried under ONE grave. Stand on the purple ley stones in the corners — each tells how far the key is from that stone. ${E.solo() ? 'Visit two or three stones' : 'Each take a stone'} and work out which grave matches. Stand on a grave to dig — but dig the wrong one and a ghost climbs out!`;
  }
};

/* =============================================================== */
const BELLS = [[-8, 7], [-4.5, 12.5], [-8, 18], [8, 7], [4.5, 12.5], [8, 18]];
const PITCH = [262, 294, 330, 392, 440, 523, 587, 659];
const bells = {
  name: 'The Bell Tower',
  floor: woodFloor,
  notes: [[0, 2.2, '“Ring the bells from the lowest voice to the highest.”', 1.6]],
  build(R, E){
    const T = E.THREE, brass = brassOf(E);
    R.wall(-.3, 3.5, .3, 19.5);
    R.door('gw', -10, 19.35, -.3, 19.65, 'gate'); R.door('ge', .3, 19.35, 10, 19.65, 'gate');
    this.bells = BELLS.map(([x, lz], i) => {
      R.plate('b' + i, x, lz, 0xc9a24a, 1.8, '♪');
      const g = new T.Group();
      const bell = new T.Mesh(new T.CylinderGeometry(.35, .85, 1.1, 18, 1, true), new T.MeshStandardMaterial({ color: 0xc9a24a, metalness: .8, roughness: .25, side: T.DoubleSide })); bell.position.y = -.6; g.add(bell);
      const top = new T.Mesh(new T.SphereGeometry(.36, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass); top.position.y = -.05; g.add(top);
      const rope = new T.Mesh(new T.CylinderGeometry(.03, .03, .8, 6), E.mat(0xc8a26a)); rope.position.y = .4; g.add(rope);
      R.place(g, x, lz, 3); return g;
    });
    this.orbs = orbRow(E, R, 6, -3.25, 21.3);
  },
  init(R, E){ const f = E.shuffle(PITCH.slice()).slice(0, 6); return { f, order: f.slice().sort((a, b) => a - b), k: 0, done: 0 }; },
  solve(st){ st.k = 6; st.done = 1; },
  host(dt, st, R, E){
    if (st.done){ R.open('gw'); R.open('ge'); return; }
    for (let i = 0; i < 6; i++) if (R.edge('b' + i)){
      const f = st.f[i]; E.ev('tone', '', f); (R.local.swing = R.local.swing || [])[i] = 1;
      if (f === st.order[st.k]){ st.k++; if (st.k === 6){ st.done = 1; R.open('exit'); E.ev('door', 'A perfect scale! The tower sings and the gates open.'); } }
      else if (st.k > 0){ st.k = 0; E.ev('wrong', 'A sour note! Start again from the lowest bell.'); }
    }
  },
  visual(dt, t, st, R, E){
    this.bells.forEach((g, i) => { const on = R.on('b' + i); g.rotation.z += ((on ? Math.sin(t * 9) * .35 : 0) - g.rotation.z) * E.damp(6, dt); });
    setOrbs(this.orbs, st.k);
  },
  objective(st, R, E){
    if (st.done) return 'A perfect scale! The way is open.';
    return `Six bells, six voices. Ring them in order from the LOWEST pitch to the HIGHEST — listen carefully. ${E.solo() ? '' : 'The fence splits the bells between you, so take turns. '}Ringing a bell out of order after you\'ve started resets the scale. (${st.k}/6)`;
  }
};

/* =============================================================== */
const LX = [-6, -2, 2, 6], LLZ = [5, 9, 13, 17];
const PLUS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]], CROSS = [[0, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
function press(lit, i, pat){ const r = Math.floor(i / 4), c = i % 4; for (const [dr, dc] of pat){ const a = r + dr, b = c + dc; if (a >= 0 && a < 4 && b >= 0 && b < 4) lit[a * 4 + b] ^= 1; } }
const lamps = {
  name: 'The Lamp Room',
  floor: E => E.mat(0x1a1612),
  notes: [[0, 2.2, '“Blue feet flip a plus. Pink feet flip a cross. Light every lamp.”', 1.6]],
  build(R, E){
    const T = E.THREE, brass = brassOf(E);
    this.lamps = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
      const i = r * 4 + c; R.zone('L' + i, LX[c], LLZ[r], 2.8);
      const tile = new T.Mesh(new T.BoxGeometry(3.4, .08, 3.4), new T.MeshStandardMaterial({ color: 0x2a2420, emissive: 0xffc46b, emissiveIntensity: 0 })); R.place(tile, LX[c], LLZ[r], .04);
      const post = new T.Mesh(new T.CylinderGeometry(.06, .06, 1.6, 6), brass); R.place(post, LX[c] + 1.2, LLZ[r] + 1.2, .8);
      const bulb = new T.Mesh(new T.SphereGeometry(.28, 12, 10), new T.MeshStandardMaterial({ color: 0x554433, emissive: 0xffc46b, emissiveIntensity: 0 })); R.place(bulb, LX[c] + 1.2, LLZ[r] + 1.2, 1.7);
      this.lamps.push({ tile, bulb });
    }
    R.plate('MODE', -8.5, 20, 0x9a7aff, 1.6, '±');
  },
  init(){
    let lit;
    do { lit = Array(16).fill(1); for (let k = 0; k < 4; k++) press(lit, Math.floor(Math.random() * 16), PLUS); for (let k = 0; k < 3; k++) press(lit, Math.floor(Math.random() * 16), CROSS); } while (lit.every(Boolean));
    return { lit, mode: 0, done: 0 };
  },
  solve(st){ st.lit.fill(1); st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    if (E.solo() && R.edge('MODE')){ st.mode ^= 1; E.ev('click', st.mode ? 'You now flip an × (cross).' : 'You now flip a + (plus).'); }
    for (const a of arrivals(R, 'lamp', E.P, pos => { for (let i = 0; i < 16; i++) if (R.at('L' + i, pos)) return i; return -1; })){
      const pat = (E.solo() ? st.mode : a.idx) ? CROSS : PLUS;
      press(st.lit, a.cell, pat); E.ev('click');
      if (st.lit.every(Boolean)){ st.done = 1; R.open('exit'); E.ev('door', 'Every lamp blazes! The door opens.'); }
    }
  },
  visual(dt, t, st, R, E){
    this.lamps.forEach(({ tile, bulb }, i) => { const on = st.lit[i]; bulb.material.emissiveIntensity += ((on ? 2 : 0) - bulb.material.emissiveIntensity) * E.damp(10, dt); tile.material.emissiveIntensity += ((on ? .35 : 0) - tile.material.emissiveIntensity) * E.damp(10, dt); });
    R.glow('MODE', E.solo() ? .7 : .05);
  },
  objective(st, R, E){
    if (st.done) return 'All lamps lit! The door is open.';
    const n = st.lit.filter(Boolean).length;
    if (E.solo()) return `Light all 16 lamps. Stepping on a tile flips it and its neighbors. The purple ± plate switches between a + and an × pattern. (${n}/16)`;
    return `Light all 16 lamps! Stepping on a tile flips lamps: <b style="color:#5aa2ff">Blue flips a + shape</b>, <b style="color:#ff6fae">Pink flips an × shape</b>. Plan it together. (${n}/16)`;
  }
};

/* =============================================================== */
const STARS = [[-6, 5], [0, 4], [6, 5], [-4, 13], [4, 13], [0, 18.5]];
const EDGES = [[0, 1], [1, 2], [0, 3], [1, 3], [2, 4], [3, 4], [4, 5]];
const edgeIdx = (a, b) => EDGES.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
const stars = {
  name: 'The Star Chart',
  floor: E => E.mat(0xffffff, { map: E.tiledTex(256, 256, (x, w, h) => { x.fillStyle = '#0c1028'; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++){ x.fillStyle = `rgba(255,255,255,${.2 + Math.random() * .5})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, 4, 4) }),
  notes: [[-8, 2, '“Trace the constellation. Never walk a line twice, never leap between stars.”', 1.6]],
  build(R, E){
    const T = E.THREE;
    STARS.forEach(([x, lz], i) => {
      R.zone('s' + i, x, lz, 1.5);
      const st = new T.Mesh(new T.OctahedronGeometry(.6), E.glow(0xfff1b0, 1)); st.scale.y = .4; R.place(st, x, lz, .35);
    });
    this.lines = EDGES.map(([a, b]) => {
      const [x1, l1] = STARS[a], [x2, l2] = STARS[b], len = Math.hypot(x2 - x1, l2 - l1);
      const m = new T.Mesh(new T.BoxGeometry(len, .04, .22), new T.MeshBasicMaterial({ color: 0x8090c0, transparent: true, opacity: .25 }));
      m.position.set((x1 + x2) / 2, .05, R.Z((l1 + l2) / 2)); m.rotation.y = Math.atan2(l2 - l1, x2 - x1); E.scene.add(m); return m;
    });
    const chart = new T.Mesh(new T.PlaneGeometry(4, 3.2), E.mat(0xffffff, { map: E.canvasTex(256, 205, (x, w, h) => {
      x.fillStyle = '#10142e'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffe9a0'; x.lineWidth = 3;
      const px = ([sx, sl]) => [w / 2 + sx * 11, h - 20 - sl * 9];
      for (const [a, b] of EDGES){ const [x1, y1] = px(STARS[a]), [x2, y2] = px(STARS[b]); x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
      x.fillStyle = '#fff'; for (const s of STARS){ const [sx, sy] = px(s); x.beginPath(); x.arc(sx, sy, 6, 0, Math.PI * 2); x.fill(); }
    }), emissive: 0xffffff, emissiveIntensity: .3 }));
    R.place(chart, 6.5, 21.4, 1.7);
  },
  init(){ return { drawn: 0, by: Array(EDGES.length).fill(-1), last: [-1, -1], chains: 0, done: 0 }; },
  solve(st){ st.drawn = (1 << EDGES.length) - 1; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    for (const a of arrivals(R, 'star', E.P, pos => { for (let i = 0; i < STARS.length; i++) if (R.at('s' + i, pos)) return i; return -1; })){
      const s = a.cell, last = st.last[a.idx];
      if (last < 0){ if (E.solo() && st.chains >= 2) { this.fail(st, E); continue; } st.last[a.idx] = s; st.chains++; E.ev('click'); continue; }
      if (s === last) continue;
      const e = edgeIdx(last, s);
      if (e >= 0 && !(st.drawn & (1 << e))){
        st.drawn |= 1 << e; st.by[e] = a.idx; st.last[a.idx] = s; E.ev('chime', '', 1 + (st.drawn.toString(2).split('1').length - 1) % 6);
        if (st.drawn === (1 << EDGES.length) - 1){ st.done = 1; R.open('exit'); E.ev('door', 'The constellation blazes to life! The door opens.'); }
      } else if (E.solo() && st.chains < 2){ st.last[a.idx] = s; st.chains++; E.ev('click', 'You lifted your pen — that\'s your second (last) line.'); }
      else this.fail(st, E);
    }
  },
  fail(st, E){ st.drawn = 0; st.by.fill(-1); st.last = [-1, -1]; st.chains = 0; E.ev('wrong', 'The stars scatter! You can\'t retrace a line or jump between stars. Start again.'); },
  visual(dt, t, st, R, E){
    this.lines.forEach((m, i) => { const d = st.drawn & (1 << i); m.material.color.setHex(d ? (st.by[i] >= 0 ? E.COLORS[st.by[i]] : 0xfff1b0) : 0x8090c0); m.material.opacity = d ? 1 : .22 + Math.sin(t * 2 + i) * .05; m.scale.z = d ? 1.8 : 1; });
  },
  objective(st, R, E){
    if (st.done) return 'The stars are aligned! The door is open.';
    const n = (st.drawn.toString(2).match(/1/g) || []).length;
    return E.solo() ? `Walk from star to star to draw the constellation on the chart (top right). You get two separate lines; never retrace a line. (${n}/${EDGES.length})`
      : `Walk star to star to draw the constellation (chart on the wall). It can't be drawn in one line — you EACH draw one unbroken line. Never retrace, never jump. (${n}/${EDGES.length})`;
  }
};

/* =============================================================== */
const HEART = { lz: 11, r: 7, len: 8.7, spin: Math.PI * 2 / 10 };
const heart = {
  name: 'The Clock Heart',
  floor: E => E.mat(0x2a1e14),
  notes: [[0, 1.8, '“Light all eight at once, before they gutter out. Mind the great hand.”', 1.6]],
  build(R, E){
    const T = E.THREE, brass = brassOf(E);
    const ring = new T.Mesh(new T.RingGeometry(HEART.r - .9, HEART.r + .9, 64), new T.MeshStandardMaterial({ color: 0x5a4024, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; R.place(ring, 0, HEART.lz, .02);
    this.flames = [];
    for (let i = 0; i < 8; i++){
      const a = i / 8 * Math.PI * 2, x = Math.sin(a) * HEART.r, lz = HEART.lz + Math.cos(a) * HEART.r;
      R.zone('c' + i, x, lz, 1.4);
      const stick = new T.Mesh(new T.CylinderGeometry(.14, .16, .8, 10), E.mat(0xf2ead8)); R.place(stick, x, lz, .4);
      const f = new T.Mesh(new T.ConeGeometry(.12, .35, 8), E.flameMat); R.place(f, x, lz, .98); f.visible = false; this.flames.push(f);
    }
    const g = new T.Group();
    const arm = new T.Mesh(new T.BoxGeometry(.5, .5, HEART.len), brass); arm.position.set(0, .6, -HEART.len / 2); g.add(arm);
    const tip = new T.Mesh(new T.ConeGeometry(.5, 1, 4), brass); tip.rotation.x = -Math.PI / 2; tip.position.set(0, .6, -HEART.len - .3); g.add(tip);
    const hub = new T.Mesh(new T.CylinderGeometry(.9, .9, 1.2, 20), brass); hub.position.y = .6; g.add(hub);
    this.hand = R.place(g, 0, HEART.lz);
    this.heartGlow = new T.PointLight(0xff6a2a, 0, 16, 1.2); R.place(this.heartGlow, 0, HEART.lz, 2);
  },
  init(){ return { lit: Array(8).fill(0), ang: Math.PI, done: 0 }; },
  solve(st){ st.done = 1; st.lit.fill(99); },
  host(dt, st, R, E){
    if (st.done) return;
    const any = E.P.some(p => R.inside(p.pos));
    if (any) st.ang = (st.ang + HEART.spin * dt) % (Math.PI * 2);
    const burn = E.solo() ? 16 : 7;
    for (let i = 0; i < 8; i++){ if (st.lit[i] > 0) st.lit[i] = Math.max(0, st.lit[i] - dt); if (R.edge('c' + i)){ if (st.lit[i] <= 0) E.ev('pick'); st.lit[i] = burn; } }
    if (st.lit.every(v => v > 0)){ st.done = 1; R.open('exit'); E.ev('door', 'All eight flames burn at once — the great clock stops. The tower doors open!'); return; }
    const tx = Math.sin(st.ang), tl = Math.cos(st.ang);
    for (const p of E.P){
      if (p.frozen || !R.inside(p.pos)) continue;
      const px = p.pos.x, pl = R.lz(p.pos.z) - HEART.lz, proj = px * tx + pl * tl;
      if (proj < 1 || proj > HEART.len + .6) continue;
      const d = Math.abs(px * tl - pl * tx);
      if (d < .75) E.freeze(p.idx, 3.5, `The great hand swept ${E.names()[p.idx]}!`);
    }
  },
  visual(dt, t, st, R, E){
    this.hand.rotation.y = -st.ang;
    this.flames.forEach((f, i) => { f.visible = st.lit[i] > 0; if (f.visible) f.scale.setScalar(.6 + Math.min(1, st.lit[i] / 3) * .6 + Math.sin(t * 17 + i) * .08); });
    this.heartGlow.intensity = st.lit.filter(v => v > 0).length * .8;
  },
  bar(st, R, E){ if (st.done || !R.inside(E.me.pos)) return null; const n = st.lit.filter(v => v > 0).length; if (!n) return null; return { frac: n / 8, label: `${n}/8 flames burning`, color: '#ffa53a' }; },
  objective(st, R, E){
    if (st.done) return 'The great clock has stopped. Run for the doors — you\'re almost free!';
    return `Step on the candles around the ring to light them. Each burns out after ${E.solo() ? 16 : 7} seconds — get all 8 burning at once${E.solo() ? '' : ' (split the ring between you)'}. Don\'t let the giant clock hand sweep you!`;
  }
};

export default {
  level: 3,
  title: 'The Clocktower',
  tagline: 'Time stopped in this tower long ago.<br>Make it tick again.',
  story: 'The gears groan above you. Ten rooms climb to the clock\'s heart.',
  winTitle: 'You escaped the Clocktower! 🕰️',
  accent: '#e0a94a',
  wallColor: 0x4a3626,
  trimColor: 0xc9a24a,
  doorColor: 0x3a2618,
  drone: 49,
  sky: 0x9a8a6a,
  rooms: [clockFace, echo, gears, bridge, memory, dowsing, bells, lamps, stars, heart],
};
