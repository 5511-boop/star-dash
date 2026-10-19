// Level 2 — Grimwood Carnival. Room coordinates are local: x -10..10, lz 0 (south wall) .. 22 (north wall).

/* ---------- small shared helpers ---------- */
const stripes = (a, b, n = 8) => (x, w, h) => { for (let i = 0; i < n; i++){ x.fillStyle = i % 2 ? a : b; x.fillRect(i * w / n, 0, w / n + 1, h); } };
// per-player "arrival" detection: returns [{idx, cell}] for players who just entered a new cell
function arrivals(R, key, P, cellOf){
  const prev = R.local[key] || (R.local[key] = [-1, -1]), out = [];
  for (const p of P){
    const c = p.frozen ? -1 : cellOf(p.pos);
    if (c !== prev[p.idx] && c >= 0) out.push({ idx: p.idx, cell: c });
    prev[p.idx] = c;
  }
  return out;
}
const lzOf = (R, p) => R.lz(p.z);
const inRoomP = (R, E) => E.P.filter(p => R.inside(p.pos));
function orbRow(E, R, n, x0, lz, dx = 1.3){
  const arr = [];
  for (let i = 0; i < n; i++){ const o = new E.THREE.Mesh(new E.THREE.SphereGeometry(.2, 12, 10), E.glow(0x333344, .2)); R.place(o, x0 + i * dx, lz, 2); arr.push(o); }
  return arr;
}
function setOrbs(orbs, k){ orbs.forEach((o, i) => { const on = i < k; o.material.color.setHex(on ? 0x8affc1 : 0x333344); o.material.emissive.setHex(on ? 0x4dff9a : 0x222233); o.material.emissiveIntensity = on ? 1.4 : .2; }); }
function textPlane(E, w, h, draw, emissive = .6){
  const tex = E.canvasTex(256, Math.round(256 * h / w), draw);
  const m = new E.THREE.Mesh(new E.THREE.PlaneGeometry(w, h), new E.THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive, transparent: true }));
  m.userData.tex = tex; return m;
}
function redraw(mesh, draw){ const t = mesh.userData.tex, c = t.image.getContext('2d'); c.clearRect(0, 0, t.image.width, t.image.height); draw(c, t.image.width, t.image.height); t.needsUpdate = true; }
function bulbs(E, R, lz){
  const g = new E.THREE.Group(), cols = [0xffd84d, 0xff5a5a, 0x5ad1ff, 0x8aff7a];
  for (let i = 0; i < 18; i++){ const b = new E.THREE.Mesh(new E.THREE.SphereGeometry(.09, 8, 6), E.glow(cols[i % 4], 1.4)); b.position.set(-9.4 + i * 1.1, 2.55, 0); g.add(b); }
  R.place(g, 0, lz, 0); return g;
}

/* =============================================================== */
const ticketBooth = {
  name: 'The Ticket Booth',
  floor: E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#3a1f2e'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a2a3a'; x.fillRect(0, 0, w / 2, h / 2); x.fillRect(w / 2, h / 2, w / 2, h / 2); }, 10, 11) }),
  notes: [[0, 7.5, '“Admit two. Each window knows only half the price.”']],
  build(R, E){
    const T = E.THREE, wood = E.mat(0xc23b3b), roof = E.mat(0xffffff, { map: E.canvasTex(64, 16, stripes('#ffffff', '#d23a3a', 6)) });
    for (const s of [-1, 1]){
      R.block(s * 9.3, 5.6, s * 5.2, 8.2, 2.1, wood);
      const r = new T.Mesh(new T.BoxGeometry(4.6, .25, 3.2), roof); R.place(r, s * 7.25, 6.9, 2.3);
      const win = new T.Mesh(new T.PlaneGeometry(1.6, .9), E.glow(0xfff0b0, .7)); R.place(win, s * 7.25, 5.55, 1.4);
    }
    R.plate('W1', -7.25, 4.4, 0xffd84d, 1.6, '?');
    R.plate('W2', 7.25, 4.4, 0xffd84d, 1.6, '?');
    const xs = [-6, -3, 0, 3, 6], digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    digits.forEach((d, i) => R.plate('d' + d, xs[i % 5], i < 5 ? 11 : 14, 0xffb84d, 2.2, d));
    R.plate('ENT', 2.5, 18.2, 0x5ee07a, 1.8, '✓');
    R.plate('CLR', -2.5, 18.2, 0xff5a5a, 1.8, '✗');
    this.sign = textPlane(E, 5, 1.2, () => {}); R.place(this.sign, 0, 21.4, 1.6);
    bulbs(E, R, 21.3);
  },
  init(R, E){
    const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8), op = Math.random() < .55 ? '×' : '+';
    return { a, b, op, ans: op === '×' ? a * b : a + b, entry: '', done: 0 };
  },
  solve(st){ st.done = 1; st.entry = String(st.ans); },
  host(dt, st, R, E){
    if (st.done) return;
    for (const d of '0123456789') if (R.edge('d' + d) && st.entry.length < 3){ st.entry += d; E.ev('click'); }
    if (R.edge('CLR')){ st.entry = ''; E.ev('click'); }
    if (R.edge('ENT')){
      if (st.entry && +st.entry === st.ans){ st.done = 1; R.open('exit'); E.ev('door', 'DING DING! Two tickets punched — the gate swings open!'); }
      else { st.entry = ''; E.ev('laugh', 'Wrong price! The clown cackles and the board resets.'); }
    }
  },
  visual(dt, t, st, R, E){
    const key = st.entry + '|' + st.done;
    if (this._k !== key){
      this._k = key;
      redraw(this.sign, (c, w, h) => { c.fillStyle = '#1a0f12'; c.fillRect(0, 0, w, h); c.fillStyle = st.done ? '#8aff9a' : '#ffd84d'; c.font = 'bold 40px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.done ? 'ADMIT TWO' : (st.entry || '—') + ' ¢', w / 2, h / 2); });
    }
    if (st.done) for (const id of ['W1', 'W2', 'ENT', 'CLR', ...'0123456789'.split('').map(d => 'd' + d)]) R.glow(id, .1);
  },
  panel(st, R, E){
    if (st.done) return null;
    const p = E.me.pos, solo = E.solo();
    const w1 = R.at('W1', p), w2 = R.at('W2', p);
    if (!w1 && !w2) return null;
    const half1 = `<div>The left barker whispers:</div><div class="big1">Price = ★ ${st.op} ${st.a}</div>`;
    const half2 = `<div>The right barker whispers:</div><div class="big1">★ = ${st.b}</div>`;
    if (solo) return half1 + '<br>' + half2;
    return (w1 ? half1 + '<div>Your partner\'s window knows what ★ is.</div>' : half2 + '<div>Your partner\'s window knows the rest of the price.</div>');
  },
  objective(st, R, E){
    if (st.done) return 'Tickets punched! Through the gate.';
    return `Each ticket window tells only half the price. Stand at the left and right windows, put your clues together, then step the answer on the number tiles and hit ✓. Entered: <b>${st.entry || '—'}</b>`;
  }
};

/* =============================================================== */
// disc perimeter in disc-local coords (dx east, dn north), opening on the EAST side at rotation 0
const DISC = { cx: 0, clz: 11, h: 7 };
const DISC_RECTS = [
  [-7, 7, 6.5, 7], [-7, 7, -7, -6.5], [-7, -6.5, -7, 7], [6.5, 7, -7, -1.6], [6.5, 7, 1.6, 7], [-.6, .6, -.6, .6]
];
function rotRect([x1, x2, n1, n2], k){ for (let i = 0; i < (k % 4 + 4) % 4; i++){ [x1, x2, n1, n2] = [n1, n2, -x2, -x1]; } return [x1, x2, n1, n2]; }
const carousel = {
  name: 'The Carousel',
  floor: E => E.mat(0x2c2238),
  notes: [[-6, 1.6, '“The carousel only turns when someone pulls the brass lever.”', 1.6]],
  build(R, E){
    const T = E.THREE;
    R.wall(-10, 4, -7, 18); R.wall(7, 4, 10, 18);
    R.plate('SW', -8.5, 2, 0xffc46b, 1.6, '⟳');
    R.plate('NW', 8.5, 20, 0xffc46b, 1.6, '⟳');
    const g = new T.Group(); this.disc = g;
    const top = new T.Mesh(new T.CylinderGeometry(6.9, 6.9, .1, 40), E.mat(0xffffff, { map: E.canvasTex(256, 256, (x, w, h) => {
      for (let i = 0; i < 16; i++){ x.fillStyle = i % 2 ? '#d23a3a' : '#f3e4c4'; x.beginPath(); x.moveTo(w / 2, h / 2); x.arc(w / 2, h / 2, w / 2, i / 16 * Math.PI * 2, (i + 1) / 16 * Math.PI * 2); x.fill(); }
    }) })); top.position.y = .05; g.add(top);
    const rail = E.mat(0xd4af37, { metalness: .7, roughness: .3 });
    for (const [x1, x2, n1, n2] of DISC_RECTS){
      const b = new T.Mesh(new T.BoxGeometry(x2 - x1, x1 === -.6 ? 3 : 1.4, n2 - n1), x1 === -.6 ? rail : E.mat(0x7a2a5a));
      b.position.set((x1 + x2) / 2, x1 === -.6 ? 1.5 : .7, -(n1 + n2) / 2); g.add(b);
    }
    const horseCol = [0xf3e4c4, 0x6ad1ff, 0xffd84d, 0xff8ab0];
    for (let i = 0; i < 4; i++){
      const a = i / 4 * Math.PI * 2 + .4, hx = Math.cos(a) * 3.6, hz = Math.sin(a) * 3.6;
      const pole = new T.Mesh(new T.CylinderGeometry(.06, .06, 2.6, 6), rail); pole.position.set(hx, 1.3, hz); g.add(pole);
      const body = new T.Mesh(new T.BoxGeometry(.5, .5, 1.3), E.mat(horseCol[i])); body.position.set(hx, 1.3, hz); body.rotation.y = -a; g.add(body);
      const head = new T.Mesh(new T.BoxGeometry(.35, .6, .35), E.mat(horseCol[i])); head.position.set(hx + Math.cos(a + Math.PI / 2) * .6, 1.6, hz + Math.sin(a + Math.PI / 2) * .6); g.add(head);
    }
    R.place(g, 0, DISC.clz, 0);
    bulbs(E, R, 21.3);
  },
  init(){ return { rot: 0, queue: 0, wait: 0 }; },
  solve(st){ st.rot = 3; },
  colliders(st, R){
    return DISC_RECTS.map(r => { const [x1, x2, n1, n2] = rotRect(r, st.rot); return R.rect(x1, DISC.clz + n1, x2, DISC.clz + n2); });
  },
  host(dt, st, R, E){
    for (const s of ['SW', 'NW']) if (R.edge(s) && st.queue < 3){ if (st.queue === 0 && st.wait <= 0) st.wait = .8; st.queue++; E.ev('whoosh', st.queue === 1 ? 'The carousel music starts… it\'s going to turn!' : ''); }
    if (st.wait > 0) st.wait -= dt;
    else if (st.queue > 0){ st.queue--; st.rot++; st.wait = E.solo() ? 2.6 : 1.5; E.ev('click'); }
  },
  local(dt, st, R, E){
    const L = R.local;
    if (L.lastRot === undefined) L.lastRot = st.rot;
    if (st.rot !== L.lastRot){
      const p = E.me.pos, dx = p.x, dn = R.lz(p.z) - DISC.clz;
      if (Math.abs(dx) < 7 && Math.abs(dn) < 7) L.anim = { t: 0, dx, dn, steps: st.rot - L.lastRot };
      L.lastRot = st.rot;
    }
    if (L.anim){
      const A = L.anim; A.t += dt;
      const a = Math.min(A.t / 1.2, 1) * A.steps * Math.PI / 2;
      const nx = A.dx * Math.cos(a) + A.dn * Math.sin(a), nn = -A.dx * Math.sin(a) + A.dn * Math.cos(a);
      E.me.pos.x = nx; E.me.pos.z = R.Z(DISC.clz + nn); E.me.ry -= dt * A.steps * Math.PI / 2 / 1.2; E.lock();
      if (A.t >= 1.2) L.anim = null;
    }
  },
  visual(dt, t, st, R, E){
    const target = -st.rot * Math.PI / 2;
    this.disc.rotation.y += (target - this.disc.rotation.y) * E.damp(3.2, dt);
    for (const s of ['SW', 'NW']) R.glow(s, st.queue ? 1.4 : .5 + Math.sin(t * 3) * .2);
  },
  objective(st, R, E){
    const p = E.me.pos, lz = R.lz(p.z), onDisc = Math.abs(p.x) < 7 && Math.abs(lz - DISC.clz) < 7;
    if (lz > 18.2) return E.solo() ? 'You made it across! Head through the door.' : 'You\'re across! Use the lever here to turn the carousel back for your partner.';
    if (onDisc) return 'Riding the carousel! Wait for the opening to face north, then hop off.';
    return E.solo() ? 'Step on the lever up to 3 times — the carousel turns once per pull, a few seconds apart. Ride it until the opening faces north.'
      : 'Step on the brass lever to turn the carousel a quarter turn. One rides while the other turns it. Each lever press = one turn.';
  }
};

/* =============================================================== */
const ICE_BARRELS = [[6, 3], [8, 5], [7, 6], [1, 6], [3, 2], [5, 0], [9, 7], [0, 3]];
const rink = {
  name: 'The Roller Rink',
  floor: E => E.mat(0x2a2440),
  ice: { x1: -10, x2: 10, lz1: 3, lz2: 19, rows: 8, blockers(st, R, E){
    const out = [];
    const cell = (c, r) => R.rect(-9 + 2 * c - .9, 4 + 2 * r - .9, -9 + 2 * c + .9, 4 + 2 * r + .9);
    if (st.bump) out.push(cell(5, 5));
    if (E.solo()) out.push(cell(7, 5));
    return out;
  } },
  notes: [[-6, 20.5, 'The red bumper raises a post on the ice behind you.', 1.5]],
  build(R, E){
    const T = E.THREE;
    R.floor(-10, 3, 10, 19, new T.MeshStandardMaterial({ color: 0xbfe6ff, roughness: .05, metalness: .2, emissive: 0x1a3550, emissiveIntensity: .4 }), .01);
    const grid = E.canvasTex(320, 256, (x, w, h) => { x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; for (let c = 0; c <= 10; c++){ x.beginPath(); x.moveTo(c * 32, 0); x.lineTo(c * 32, h); x.stroke(); } for (let r = 0; r <= 8; r++){ x.beginPath(); x.moveTo(0, r * 32); x.lineTo(w, r * 32); x.stroke(); } });
    R.floor(-10, 3, 10, 19, new T.MeshBasicMaterial({ map: grid, transparent: true }), .02);
    const bm = E.mat(0x8a4a2a), band = E.mat(0x333333, { metalness: .6 });
    for (const [c, r] of ICE_BARRELS){
      R.block(-9 + 2 * c - .9, 4 + 2 * r - .9, -9 + 2 * c + .9, 4 + 2 * r + .9, .01, bm);       // collider only
      const b = new T.Mesh(new T.CylinderGeometry(.85, .85, 1.3, 16), bm); R.place(b, -9 + 2 * c, 4 + 2 * r, .65);
      const ring = new T.Mesh(new T.TorusGeometry(.86, .05, 6, 20), band); ring.rotation.x = Math.PI / 2; R.place(ring, -9 + 2 * c, 4 + 2 * r, .9);
    }
    R.wall(-10, 18.85, 2, 19.15, 1.2); R.wall(4, 18.85, 10, 19.15, 1.2);
    R.plate('BUMP', -6, 20.5, 0xff5a5a, 1.4, '!');
    const post = new T.Mesh(new T.CylinderGeometry(.6, .7, 1.4, 14), E.glow(0xff5a5a, .5)); this.post = R.place(post, 1, 14, -1);
    const statue = new T.Mesh(new T.CapsuleGeometry(.5, .8, 4, 10), E.mat(0x8a8aa0)); this.statue = R.place(statue, 5, 14, .9); statue.visible = false;
    bulbs(E, R, 21.3);
  },
  init(){ return { bump: 0 }; },
  solve(st){ st.bump = 1; },
  host(dt, st, R, E){
    if (!st.bump && R.on('BUMP')){ st.bump = 1; E.ev('thud', 'CLUNK! A red post pops up on the ice — your partner can stop on it now.'); }
    const P = E.P;
    if (!R.isOpen('exit') && P.length && P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.3)){ R.open('exit'); E.ev('door', 'Both off the ice — the exit opens!'); }
  },
  visual(dt, t, st, R, E){
    this.post.position.y += ((st.bump ? .7 : -1) - this.post.position.y) * E.damp(6, dt);
    this.statue.visible = E.solo();
    R.glow('BUMP', st.bump ? .15 : .6 + Math.sin(t * 4) * .2);
  },
  objective(st, R, E){
    const lz = R.lz(E.me.pos.z);
    if (lz > 19.2) return st.bump || E.solo() ? 'Off the ice! Wait for your partner, then the exit opens.' : 'Off the ice! Step on the red bumper to raise a post that can stop your partner.';
    return E.solo() ? 'Ice! You slide until something stops you. A stone statue helps you in solo. Find a way out through the gap at the top.'
      : 'Ice! You slide until you hit something — and your PARTNER counts as something. Stand in each other\'s way to stop in the right spot. The exit gap is at the top.';
  }
};

/* =============================================================== */
// puppet show: 10x7 grid of 2x2 cells (lz 4..18), safe lanes; everything else is a pit
const LANE_L = [[2, 0], [2, 1], [1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 4], [3, 5], [2, 5], [2, 6]];
const LANE_R = [[7, 0], [7, 1], [8, 1], [8, 2], [8, 3], [7, 3], [6, 3], [6, 4], [6, 5], [7, 5], [7, 6]];
const puppet = {
  name: 'The Puppet Show',
  floor: E => E.mat(0x2a1a14),
  swap: true,
  notes: [[0, 2.4, '“On this stage, every puppet pulls the other\'s strings.”', 1.6]],
  build(R, E){
    const T = E.THREE, safe = new Set(LANE_L.concat(LANE_R).map(([c, r]) => c + ',' + r));
    const plank = E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#9a6a3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#7a4f28'; for (let i = 0; i < 4; i++) x.fillRect(0, i * 16 + 15, w, 2); }, 1, 1) });
    const pitM = new T.MeshBasicMaterial({ color: 0x050308 });
    this.pitList = [];
    for (let c = 0; c < 10; c++) for (let r = 0; r < 7; r++){
      const x = -9 + 2 * c, lz = 5 + 2 * r;
      if (safe.has(c + ',' + r)) R.floor(x - 1, lz - 1, x + 1, lz + 1, plank, .012);
      else { R.floor(x - 1, lz - 1, x + 1, lz + 1, pitM, .014); this.pitList.push([x - 1, lz - 1, x + 1, lz + 1]); }
    }
    R.plate('GL', -5, 20, 0xff8ab0, 1.8, '♥');
    R.plate('GR', 5, 20, 0x8ab0ff, 1.8, '♥');
    const curtain = E.mat(0x8a1a2a);
    R.block(-10, 21.2, -6.5, 21.5, 2.6, curtain, false); R.block(6.5, 21.2, 10, 21.5, 2.6, curtain, false);
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  pits(st, R){ return this.pitList.map(([x1, l1, x2, l2]) => R.rect(x1, l1, x2, l2)); },
  host(dt, st, R, E){
    if (!st.done && R.held('GL') && R.held('GR')){ st.done = 1; R.open('exit'); E.ev('door', 'Bravo! The puppets take a bow — the curtain rises on the exit!'); }
  },
  objective(st, R, E){
    if (st.done) return 'Curtain call! The exit is open.';
    if (E.solo()) return 'Cross the stage on the wooden planks (don\'t fall in the dark pits!) and stand on both heart plates. (In solo your controls are normal.)';
    return '🎭 While you\'re BOTH on this stage your controls are SWAPPED — your stick moves your partner! Talk each other across the planks to the two heart plates. Fall in a pit and you start over.';
  }
};

/* =============================================================== */
const PAINT = { 0: [0xf2f2f2, 'white'], 1: [0xff4d4d, 'red'], 2: [0x4d7dff, 'blue'], 4: [0xffe14d, 'yellow'], 3: [0xb04dff, 'purple'], 6: [0x4dd96b, 'green'], 5: [0xff9a3d, 'orange'], 7: [0x6b4a2a, 'muddy brown'] };
const POOLS = [
  // [x, lz, kind]  kind: 1 red, 2 blue, 4 yellow, 0 fountain (wash)
  [-6, 3, 1], [6, 3, 4], [0, 4, 0],
  [-5, 11, 2], [-8.5, 9, 1], [-8.5, 13.5, 4], [-2, 13.5, 0],
  [5, 11, 2], [8.5, 9, 4], [8.5, 13.5, 1], [2, 13.5, 0],
  [0, 17, 0],
];
const CURTAINS = [ [-8, 7, -5, 1], [5, 7, 8, 4], [-8, 15, -5, 3], [5, 15, 8, 6] ];     // x1, lz, x2, color needed
const paint = {
  name: 'Paint Splash',
  floor: E => E.mat(0x2a2a30),
  notes: [[0, 1.6, '“Red and blue make purple. Blue and yellow make green. The fountain washes you clean.”', 1.7]],
  build(R, E){
    const T = E.THREE;
    R.wall(-10, 6.8, -8, 7.2); R.wall(-5, 6.8, 5, 7.2); R.wall(8, 6.8, 10, 7.2);
    R.wall(-10, 14.8, -8, 15.2); R.wall(-5, 14.8, 5, 15.2); R.wall(8, 14.8, 10, 15.2);
    R.wall(-.3, 7.2, .3, 14.8);
    POOLS.forEach(([x, lz, k], i) => {
      R.zone('p' + i, x, lz, 1.7);
      const col = k === 0 ? 0xbfe6ff : PAINT[k][0];
      const pool = new T.Mesh(new T.CylinderGeometry(.95, 1.05, .14, 24), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: k === 0 ? .5 : .35, roughness: .2 }));
      R.place(pool, x, lz, .07);
      if (k === 0){ const sp = new T.Mesh(new T.CylinderGeometry(.12, .2, 1.2, 8), E.mat(0xd8d8e8)); R.place(sp, x, lz, .6); }
    });
    this.curt = CURTAINS.map(([x1, lz, x2, c]) => {
      const m = new T.Mesh(new T.BoxGeometry(x2 - x1, 2.3, .15), new T.MeshStandardMaterial({ color: PAINT[c][0], transparent: true, opacity: .55, emissive: PAINT[c][0], emissiveIntensity: .35 }));
      return R.place(m, (x1 + x2) / 2, lz, 1.15);
    });
    R.plate('PU', -5, 19, PAINT[3][0], 1.8, '●');
    R.plate('GR', 5, 19, PAINT[6][0], 1.8, '●');
  },
  init(){ return { col: [0, 0], pu: 0, gr: 0, done: 0 }; },
  solve(st){ st.done = 1; st.col = [0, 0]; },
  colliders(st, R, E, idx){
    if (st.done || E.solo()) return [];
    return CURTAINS.filter(c => st.col[idx] !== c[3]).map(([x1, lz, x2]) => R.rect(x1, lz - .15, x2, lz + .15));
  },
  host(dt, st, R, E){
    for (const a of arrivals(R, 'pool', E.P, pos => POOLS.findIndex((p, i) => R.at('p' + i, pos)))){
      const k = POOLS[a.cell][2], before = st.col[a.idx];
      st.col[a.idx] = k === 0 ? 0 : (before | k);
      if (st.col[a.idx] !== before) E.ev(k === 0 ? 'whoosh' : 'pick', a.idx === E.myIdx() || E.solo() ? '' : '', 0);
    }
    if (st.done) return;
    const purp = E.P.some(p => R.at('PU', p.pos) && st.col[p.idx] === 3), green = E.P.some(p => R.at('GR', p.pos) && st.col[p.idx] === 6);
    if (E.solo()){ if (purp && !st.pu){ st.pu = 1; E.ev('chime', 'Purple seal set! Now get green.'); } if (green && !st.gr){ st.gr = 1; E.ev('chime', 'Green seal set!'); } }
    if ((purp && green) || (st.pu && st.gr)){ st.done = 1; R.open('exit'); E.ev('door', 'Purple and green together — the paint door slides open!'); }
  },
  visual(dt, t, st, R, E){
    for (let idx = 0; idx < 2; idx++){
      const pos = E.playerPos(idx), ch = idx === E.myIdx() ? E.chars.me : E.chars.other;
      if (!pos) continue;
      const c = R.inside(pos) && !st.done ? st.col[idx] : 0;
      ch.bodyMat.color.setHex(c ? PAINT[c][0] : E.COLORS[idx]);
    }
    this.curt.forEach((m, i) => { m.material.opacity = st.done ? .1 : (st.col[E.myIdx()] === CURTAINS[i][3] ? .25 : .6); });
    R.glow('PU', st.pu || st.done ? 1.4 : .5); R.glow('GR', st.gr || st.done ? 1.4 : .5);
  },
  objective(st, R, E){
    if (st.done) return 'The paint door is open!';
    const c = st.col[E.myIdx()];
    return `You are <b style="color:#${PAINT[c][0].toString(16).padStart(6, '0')}">${PAINT[c][1]}</b>. Colored curtains only let the matching color through. ${E.solo() ? 'Stand on the purple plate while purple and the green plate while green.' : 'Get one of you PURPLE on the purple plate and one GREEN on the green plate at the same time.'}`;
  }
};

/* =============================================================== */
const DISCO = { xs: [-8, -4, 0, 4, 8], lzs: [6, 10, 14, 18], period: 2.1, need: 8 };
function discoTile(R, pos){
  const lz = R.lz(pos.z), c = Math.round((pos.x + 8) / 4), r = Math.round((lz - 6) / 4);
  if (c < 0 || c > 4 || r < 0 || r > 3) return -1;
  if (Math.abs(pos.x - DISCO.xs[c]) > 1.95 || Math.abs(lz - DISCO.lzs[r]) > 1.95) return -1;
  return r * 5 + c;
}
const disco = {
  name: 'Ghost Disco',
  floor: E => E.mat(0x110a1c),
  notes: [[-6, 1.8, '“Find your color before the beat drops!”', 1.6]],
  build(R, E){
    const T = E.THREE;
    this.tiles = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++){
      const m = new T.Mesh(new T.BoxGeometry(3.8, .1, 3.8), new T.MeshStandardMaterial({ color: 0x222233, emissive: 0x222233, emissiveIntensity: .3, roughness: .3 }));
      R.place(m, DISCO.xs[c], DISCO.lzs[r], .05); this.tiles.push(m);
    }
    const ball = new T.Mesh(new T.IcosahedronGeometry(.8, 1), new T.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: .15, flatShading: true }));
    this.ball = R.place(ball, 0, 12, 3.2);
    this.dj = R.ghost({ b: [-2, 2, 20.5, 21.3], home: [0, 21], sp: 0, harmless: true, think: g => { g.ry = Math.sin(Date.now() / 300) * .6; g.w = 0; return true; } });
  },
  init(){ return { beat: 0, t: DISCO.period, tiles: [-1, -1], live: 0, done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    const P = E.P, dancers = P.filter(p => R.inside(p.pos) && R.lz(p.pos.z) > 4 && R.lz(p.pos.z) < 20);
    if (dancers.length < P.length || !P.length){ st.live = 0; st.t = DISCO.period; st.tiles = [-1, -1]; return; }
    if (!st.live){ st.live = 1; st.t = DISCO.period; this.pick(st, R, P); }
    st.t -= dt;
    if (st.t <= 0){
      let ok = true;
      for (const p of P){ if (discoTile(R, p.pos) !== st.tiles[p.idx]){ ok = false; E.ev('zap', `${E.names()[p.idx]} missed the beat!`, p.idx); } }
      if (ok){ st.beat++; E.ev('beat'); if (st.beat >= DISCO.need){ st.done = 1; R.open('exit'); E.ev('door', 'The crowd of ghosts goes wild! The exit opens.'); return; } }
      else { st.beat = 0; E.ev('wrong', 'Streak broken! Back to zero.'); }
      st.t = DISCO.period; this.pick(st, R, P);
    }
  },
  pick(st, R, P){
    const taken = new Set();
    for (const p of P){
      const cur = discoTile(R, p.pos), cr = cur >= 0 ? Math.floor(cur / 5) : 1, cc = cur >= 0 ? cur % 5 : 2;
      const opts = [];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++){
        const i = r * 5 + c, d = Math.max(Math.abs(r - cr), Math.abs(c - cc));
        if (d >= 1 && d <= 2 && !taken.has(i)) opts.push(i);
      }
      const pick = opts[Math.floor(Math.random() * opts.length)] ?? 0;
      st.tiles[p.idx] = pick; taken.add(pick);
    }
  },
  visual(dt, t, st, R, E){
    this.ball.rotation.y += dt;
    this.tiles.forEach((m, i) => {
      let col = 0x222233, ei = .25 + Math.max(0, Math.sin(t * 6 + i)) * .1;
      if (!st.done && st.live){ for (let k = 0; k < 2; k++) if (st.tiles[k] === i){ col = E.COLORS[k]; ei = st.t < .5 ? 1.8 : 1; } }
      if (st.done){ col = [0xff5a9a, 0x5ad1ff, 0xffd84d, 0x8aff7a][(i + Math.floor(t * 4)) % 4]; ei = .6; }
      m.material.color.setHex(col); m.material.emissive.setHex(col); m.material.emissiveIntensity = ei;
    });
    if (st.live && !st.done && R.inside(E.me.pos)){ const ph = Math.floor((DISCO.period - st.t) / (DISCO.period / 4)); if (ph !== this._ph){ this._ph = ph; E.sfx.tick(); } }
  },
  bar(st, R, E){ if (!st.live || st.done || !R.inside(E.me.pos)) return null; return { frac: st.t / DISCO.period, label: `Beat drops in ${st.t.toFixed(1)}s · streak ${st.beat}/${DISCO.need}`, color: st.t < .6 ? '#ff5a5a' : '#ffc46b' }; },
  objective(st, R, E){
    if (st.done) return 'You nailed it! The exit is open.';
    return `Get on the dance floor ${E.solo() ? '' : 'together '}— a tile lights up in YOUR color. Be standing on it when the beat drops. ${DISCO.need} beats in a row opens the exit. (${st.beat}/${DISCO.need})`;
  }
};

/* =============================================================== */
const SPOTS = [[-8, 3.5], [-5, 6.5], [-8.5, 9.5], [8, 3.5], [5, 6.5], [8.5, 9.5]];
const PANS = { L: [-5, 15], R: [5, 15] };
const scales = {
  name: 'Strongman Scales',
  floor: E => E.mat(0x2a201a),
  notes: [[0, 4, '“Balance the scales. And remember — each of YOU weighs 10.”', 1.8]],
  build(R, E){
    const T = E.THREE, brass = E.mat(0xd4af37, { metalness: .7, roughness: .3 });
    for (const k of ['L', 'R']){
      const [x, lz] = PANS[k];
      const pan = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, .15, 28), brass); R.place(pan, x, lz, .08);
      R.plate('U' + k, x + (k === 'L' ? -3 : 3), lz, 0xff9a5a, 1.3, '↑');
    }
    const post = new T.Mesh(new T.CylinderGeometry(.15, .2, 3, 10), brass); R.place(post, 0, 19.5, 1.5);
    this.beam = new T.Group(); const bar = new T.Mesh(new T.BoxGeometry(10.5, .18, .18), brass); this.beam.add(bar);
    R.place(this.beam, 0, 19.5, 3);
    this.items = [];
    this.numTex = n => E.symTex(0x4a4a5a, String(n), '#ffd84d');
  },
  init(R, E){
    let vals, extra = Math.random() < .6 ? 10 : 0;
    for (let tries = 0; tries < 500; tries++){
      const a = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 9)), d = 1 + Math.floor(Math.random() * 9), e = 1 + Math.floor(Math.random() * 9);
      const f = a[0] + a[1] + a[2] + extra - d - e;
      if (f >= 1 && f <= 9){ vals = [...a, d, e, f]; break; }
    }
    if (!vals){ vals = [3, 4, 5, 2, 6, 4]; extra = 0; }
    const order = E.shuffle(vals.slice());
    return { items: order.map((v, i) => ({ v, s: 0, x: SPOTS[i][0], lz: SPOTS[i][1], w: -1, pan: '' })), carry: [-1, -1], panOrder: { L: [], R: [] }, done: 0, balT: 0 };
  },
  solve(st){ st.done = 1; },
  sums(st, R, E){
    const s = { L: 0, R: 0 };
    st.items.forEach(it => { if (it.s === 2) s[it.pan] += it.v; });
    for (const p of E.P) for (const k of ['L', 'R']) if (Math.hypot(p.pos.x - PANS[k][0], R.lz(p.pos.z) - PANS[k][1]) < 1.7) s[k] += 10;
    return s;
  },
  host(dt, st, R, E){
    if (st.done) return;
    for (const p of E.P){
      if (p.frozen) continue;
      const lz = R.lz(p.pos.z), ci = st.carry[p.idx];
      if (ci >= 0){
        for (const k of ['L', 'R']) if (Math.hypot(p.pos.x - PANS[k][0], lz - PANS[k][1]) < 1.6){
          const it = st.items[ci]; it.s = 2; it.pan = k; it.w = -1; st.carry[p.idx] = -1; st.panOrder[k].push(ci); E.ev('thud'); break;
        }
      } else {
        const i = st.items.findIndex(it => it.s === 0 && Math.hypot(p.pos.x - it.x, lz - it.lz) < 1.1);
        if (i >= 0){ st.items[i].s = 1; st.items[i].w = p.idx; st.carry[p.idx] = i; E.ev('pick'); }
      }
    }
    for (const k of ['L', 'R']) if (R.edge('U' + k)){
      const who = E.P.find(p => R.at('U' + k, p.pos));
      if (who && st.carry[who.idx] < 0 && st.panOrder[k].length){ const i = st.panOrder[k].pop(); st.items[i].s = 1; st.items[i].w = who.idx; st.carry[who.idx] = i; E.ev('pick'); }
    }
    const s = this.sums(st, R, E), all = st.items.every(it => it.s === 2);
    if (all && s.L === s.R){ st.balT += dt; if (st.balT > 1.5){ st.done = 1; R.open('exit'); E.ev('door', 'Perfect balance! The strongman salutes and the exit opens.'); } }
    else st.balT = 0;
  },
  visual(dt, t, st, R, E){
    const T = E.THREE;
    while (this.items.length < st.items.length){
      const v = st.items[this.items.length].v, g = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(.9, .7, .9), E.mat(0xffffff, { map: this.numTex(v) })); g.add(body);
      const knob = new T.Mesh(new T.SphereGeometry(.2, 10, 8), E.mat(0x4a4a5a)); knob.position.y = .45; g.add(knob);
      E.scene.add(g); this.items.push(g);
    }
    const panCount = { L: 0, R: 0 };
    st.items.forEach((it, i) => {
      const m = this.items[i];
      if (it.s === 1){ const pp = E.playerPos(it.w); if (pp) m.position.set(pp.x, 2.3, pp.z); }
      else if (it.s === 2){ const n = panCount[it.pan]++; const [x, lz] = PANS[it.pan]; m.position.set(x - .9 + (n % 3) * .9, .5 + Math.floor(n / 3) * .75, R.Z(lz - .4 + Math.floor(n / 3) * .1)); }
      else m.position.set(it.x, .4, R.Z(it.lz));
    });
    const s = this.sums(st, R, E), tilt = Math.max(-.25, Math.min(.25, (s.R - s.L) * .02));
    this.beam.rotation.z += (-tilt - this.beam.rotation.z) * E.damp(4, dt);
  },
  objective(st, R, E){
    if (st.done) return 'Balanced! The exit is open.';
    const s = this.sums(st, R, E), ci = st.carry[E.myIdx()];
    return `Carry ALL six weights onto the two pans so they balance (walk onto a pan to drop, ↑ plate to take one back). You each weigh 10 if you stand on a pan! <b>Left ${s.L} · Right ${s.R}</b>${ci >= 0 ? ` · carrying <b>${st.items[ci].v}</b>` : ''}`;
  }
};

/* =============================================================== */
const MELODY = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];
const chairs = {
  name: 'Musical Chairs',
  floor: E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#2a1830'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a2040'; x.beginPath(); x.arc(32, 32, 20, 0, Math.PI * 2); x.fill(); }, 8, 9) }),
  notes: [[0, 2.5, '“When the music stops, sit down. Five rounds. Don\'t be left standing.”', 1.7]],
  build(R, E){
    const T = E.THREE;
    this.chairs = [0, 1].map(() => {
      const g = new T.Group(), m = E.mat(0xd23a3a), gold = E.mat(0xd4af37, { metalness: .6 });
      const seat = new T.Mesh(new T.BoxGeometry(1.1, .15, 1.1), m); seat.position.y = .55; g.add(seat);
      const back = new T.Mesh(new T.BoxGeometry(1.1, 1, .15), m); back.position.set(0, 1.05, -.5); g.add(back);
      for (const [a, b] of [[-.45, -.45], [.45, -.45], [-.45, .45], [.45, .45]]){ const l = new T.Mesh(new T.CylinderGeometry(.05, .05, .55, 6), gold); l.position.set(a, .27, b); g.add(l); }
      const ring = new T.Mesh(new T.RingGeometry(.9, 1.1, 24), new T.MeshBasicMaterial({ color: 0xffd84d, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; g.add(ring);
      g.visible = false; E.scene.add(g); return g;
    });
    R.ghost({ b: [-9.4, 9.4, 3, 19.5], home: [8, 19], sp: 2.3, radius: 7 });
    bulbs(E, R, 21.3);
  },
  init(){ return { round: 0, ph: 'wait', t: 0, ch: [], done: 0 }; },
  solve(st){ st.done = 1; st.round = 5; },
  host(dt, st, R, E){
    if (st.done) return;
    const P = E.P, inside = P.filter(p => R.inside(p.pos) && R.lz(p.pos.z) > 2.5 && R.lz(p.pos.z) < 20);
    if (st.ph === 'wait'){ if (P.length && inside.length === P.length){ st.ph = 'music'; st.t = 4 + Math.random() * 4.5; } return; }
    st.t -= dt;
    if (st.ph === 'music' && st.t <= 0){
      st.ch = [];
      for (let k = 0; k < P.length; k++){
        for (let tries = 0; tries < 60; tries++){
          const x = -8.5 + Math.random() * 17, lz = 4 + Math.random() * 14;
          const near = P.some(p => Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < 10), far = P.every(p => Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) > 2.5);
          if (near && far && st.ch.every(c => Math.hypot(c[0] - x, c[1] - lz) > 4)){ st.ch.push([+x.toFixed(2), +lz.toFixed(2)]); break; }
        }
      }
      st.ph = 'stop'; st.t = E.solo() ? 3.2 : 2.8; E.ev('gong', 'The music STOPS! Grab a chair!', 330);
    } else if (st.ph === 'stop' && st.t <= 0){
      const used = new Set(); const fails = [];
      for (const p of P){
        const ci = st.ch.findIndex((c, i) => !used.has(i) && Math.hypot(p.pos.x - c[0], R.lz(p.pos.z) - c[1]) < 1.1);
        if (ci >= 0) used.add(ci); else fails.push(p);
      }
      if (!fails.length){ st.round++; E.ev('chime', st.round < 5 ? `Seated! Round ${st.round} of 5.` : '', st.round); }
      else for (const p of fails) E.freeze(p.idx, 2.5, `${E.names()[p.idx]} was left standing!`);
      st.ch = [];
      if (st.round >= 5){ st.done = 1; R.open('exit'); E.ev('door', 'You won musical chairs! The exit opens.'); return; }
      st.ph = 'music'; st.t = 4 + Math.random() * 5;
    }
  },
  visual(dt, t, st, R, E){
    this.chairs.forEach((c, i) => { const ch = st.ch[i]; c.visible = st.ph === 'stop' && !!ch; if (ch){ c.position.set(ch[0], 0, R.Z(ch[1])); } });
    if (st.ph === 'music' && !st.done && R.inside(E.me.pos)){
      this._mt = (this._mt || 0) - dt;
      if (this._mt <= 0){ this._mt = .26; this._mi = ((this._mi || 0) + 1) % MELODY.length; E.sfx.tone(MELODY[this._mi], .22, 0, 'square'); }
    }
  },
  bar(st, R, E){ if (st.ph !== 'stop' || st.done) return null; return { frac: st.t / 2.8, label: 'SIT DOWN!', color: '#ff5a5a' }; },
  objective(st, R, E){
    if (st.done) return 'Champions! The exit is open.';
    if (st.ph === 'wait') return 'Both of you step onto the floor to start the music.';
    return `Dance around (and dodge the ghost!). When the music stops, chairs appear — each of you grab your own chair before time runs out. Round ${st.round}/5`;
  }
};

/* =============================================================== */
const PEN = { x1: -2.4, x2: 2.4, lz1: 15.6, lz2: 19.4 };
const pen = {
  name: 'Ghost Pony Pen',
  floor: E => E.mat(0x24301e),
  notes: [[-5, 2, '“The ghost ponies are shy. Lanterns scare them. Herd them home.”', 1.8]],
  build(R, E){
    const T = E.THREE, fence = E.mat(0xc8a26a);
    R.block(-3.2, 15, -2.8, 20, 1.1, fence); R.block(2.8, 15, 3.2, 20, 1.1, fence); R.block(-3.2, 19.8, 3.2, 20.2, 1.1, fence);
    R.block(-3.2, 14.8, -1.2, 15.2, 1.1, fence); R.block(1.2, 14.8, 3.2, 15.2, 1.1, fence);
    R.floor(-2.8, 15.2, 2.8, 19.8, E.mat(0x6a5a2a), .01);
    this.gate = R.door('gate', -1.2, 14.85, 1.2, 15.15, 'gate');
    const think = k => (g, dt, st, R2, E2, P) => {
      const speed = E2.solo() ? 2.3 : 3.3;
      const lzg = R2.lz(g.z);
      if (st.cap[k]){
        g.mem.t = (g.mem.t || 0) - dt;
        if (g.mem.t <= 0 || !g.mem.w){ g.mem.w = [PEN.x1 + Math.random() * (PEN.x2 - PEN.x1), PEN.lz1 + Math.random() * (PEN.lz2 - PEN.lz1)]; g.mem.t = 2; }
        E2.stepToward(g, g.mem.w[0], R2.Z(g.mem.w[1]), 1, dt);
        g.x = E2.clamp(g.x, PEN.x1, PEN.x2); g.z = E2.clamp(g.z, R2.Z(PEN.lz2), R2.Z(PEN.lz1));
        return true;
      }
      let fx = 0, fz = 0;
      for (const p of P){ if (!R2.inside(p.pos)) continue; const dx = g.x - p.pos.x, dz = g.z - p.pos.z, d = Math.hypot(dx, dz); if (d < 4.5 && d > .01){ fx += dx / d * (4.5 - d); fz += dz / d * (4.5 - d); } }
      const px = g.x, pz = g.z;
      if (Math.hypot(fx, fz) > .05){ const l = Math.hypot(fx, fz); g.x += fx / l * speed * dt; g.z += fz / l * speed * dt; g.ry = Math.atan2(fx, fz); }
      else {
        g.mem.t = (g.mem.t || 0) - dt;
        if (g.mem.t <= 0 || !g.mem.w){ g.mem.w = [-8 + Math.random() * 16, 3 + Math.random() * 16]; g.mem.t = 3; }
        E2.stepToward(g, g.mem.w[0], R2.Z(g.mem.w[1]), 1.1, dt);
      }
      const v = new E2.THREE.Vector3(g.x, 0, g.z); E2.resolve(v, E2.staticRects());
      g.x = E2.clamp(v.x, -9.4, 9.4); g.z = E2.clamp(v.z, R2.Z(21.2), R2.Z(.8));
      if (Math.hypot(g.x - px, g.z - pz) < .001) g.mem.t = 0;
      const l2 = R2.lz(g.z);
      if (g.x > PEN.x1 && g.x < PEN.x2 && l2 > PEN.lz1 && l2 < PEN.lz2){ st.cap[k] = 1; E2.ev('chime', 'A pony is in the pen!', 2 + k); }
      return true;
    };
    this.ponies = [R.ghost({ b: [-9.4, 9.4, 1, 21], home: [-6, 8], sp: 0, look: 'wisp', tint: 0xff9ad0, harmless: true, think: think(0) }),
                   R.ghost({ b: [-9.4, 9.4, 1, 21], home: [6, 10], sp: 0, look: 'wisp', tint: 0x9affd8, harmless: true, think: think(1) })];
  },
  init(){ return { cap: [0, 0], done: 0 }; },
  solve(st){ st.cap = [1, 1]; st.done = 1; },
  host(dt, st, R, E){
    if (!st.done && st.cap[0] && st.cap[1]){ st.done = 1; R.close('gate'); R.open('exit'); E.ev('door', 'Both ponies are home! The gate latches and the exit opens.'); }
    if (!st.done) R.open('gate');
  },
  objective(st, R, E){
    if (st.done) return 'Both ponies are penned. The exit is open!';
    return `The ghost ponies run AWAY from you. ${E.solo() ? 'Herd' : 'Work together to herd'} both of them through the gap into the pen. Penned: ${st.cap[0] + st.cap[1]}/2`;
  }
};

/* =============================================================== */
const PED = [-8, 3], ALTAR = [-8, 20], RESTS = [[8, 3], [-8, 9], [8, 15]], BURN = 4;
const prize = {
  name: 'The Prize Tent',
  floor: E => E.mat(0xffffff, { map: E.tiledTex(64, 64, stripes('#3a1a24', '#2a1018', 4), 6, 6) }),
  notes: [[0, 1.8, '“Whoever holds the idol too long gets burned. Pass it!”', 1.6]],
  build(R, E){
    const T = E.THREE;
    R.wall(-10, 5.8, 6, 6.2); R.wall(-6, 11.8, 10, 12.2); R.wall(-10, 17.8, 6, 18.2);
    const ped = new T.Mesh(new T.CylinderGeometry(.6, .7, .9, 12), E.mat(0x6a5a8a)); R.place(ped, PED[0], PED[1], .45);
    const alt = new T.Mesh(new T.BoxGeometry(2, 1, 1.4), E.mat(0x8a1a2a)); R.place(alt, ALTAR[0], ALTAR[1] + .6, .5);
    R.zone('ALT', ALTAR[0], ALTAR[1], 2);
    this.rests = RESTS.map(([x, lz]) => { const m = new T.Mesh(new T.CylinderGeometry(.6, .6, .2, 12), E.glow(0x7fd1ff, .5)); return R.place(m, x, lz, .1); });
    const g = new T.Group();
    const body = new T.Mesh(new T.ConeGeometry(.35, .9, 6), E.mat(0xd4af37, { metalness: .8, roughness: .25, emissive: 0xff7b00, emissiveIntensity: .3 })); g.add(body);
    const head = new T.Mesh(new T.SphereGeometry(.25, 12, 10), E.mat(0xd4af37, { metalness: .8, roughness: .25 })); head.position.y = .55; g.add(head);
    const eye = E.glow(0xff3030, 2); for (const s of [-1, 1]){ const e = new T.Mesh(new T.SphereGeometry(.05, 6, 6), eye); e.position.set(s * .09, .6, .21); g.add(e); }
    this.idol = g; E.scene.add(g);
    this.flame = new T.Mesh(new T.ConeGeometry(.35, .8, 10), E.glow(0xff6a00, 2)); this.flame.visible = false; E.scene.add(this.flame);
    R.ghost({ b: [-9.4, 9.4, 6.5, 17.5], home: [0, 15], sp: 2.1, radius: 7, onFreeze: (g, p, st) => { if (st.h === p.idx){ st.h = -1; st.pos = PED.slice(); } } });
  },
  init(){ return { h: -1, burn: 0, cool: 0, pos: PED.slice(), done: 0 }; },
  solve(st){ st.done = 1; st.h = -1; st.pos = ALTAR.slice(); },
  speed(st, R, E, idx){ return st.h === idx ? { mult: .9, noRun: true } : null; },
  onFall(st, R, E, idx){ if (st.h === idx){ st.h = -1; st.pos = PED.slice(); } },
  host(dt, st, R, E){
    if (st.done) return;
    const L = R.local, P = E.P;
    L.repick = Math.max(0, (L.repick || 0) - dt);
    st.cool = Math.max(0, st.cool - dt);
    if (st.h < 0){
      for (const p of P){
        if (p.frozen || L.repick > 0) continue;
        if (Math.hypot(p.pos.x - st.pos[0], R.lz(p.pos.z) - st.pos[1]) < 1.1){ st.h = p.idx; st.burn = 0; L.from = RESTS.findIndex(r => r[0] === st.pos[0] && r[1] === st.pos[1]); E.ev('pick', 'You grabbed the cursed idol — it\'s heating up!'); break; }
      }
      return;
    }
    const holder = P.find(p => p.idx === st.h);
    if (!holder){ st.h = -1; st.pos = PED.slice(); return; }
    st.burn += dt;
    const hz = R.lz(holder.pos.z);
    if (Math.hypot(holder.pos.x - ALTAR[0], hz - ALTAR[1]) < 1.4){ st.done = 1; st.h = -1; st.pos = ALTAR.slice(); R.open('exit'); E.ev('door', 'The idol is back on its altar. The curse lifts — exit open!'); return; }
    const other = P.find(p => p.idx !== st.h && !p.frozen && Math.hypot(p.pos.x - holder.pos.x, p.pos.z - holder.pos.z) < 1.5);
    if (other && st.cool <= 0 && st.burn > .3){ st.h = other.idx; st.burn = 0; st.cool = .6; E.ev('whoosh'); return; }
    if (E.solo()){
      const ri = RESTS.findIndex(([x, lz]) => Math.hypot(holder.pos.x - x, hz - lz) < .9), r = RESTS[ri];
      if (r && ri !== L.from && st.burn > .5){ st.h = -1; st.pos = r.slice(); L.repick = 1.2; E.ev('thud', 'Idol set down to cool.'); return; }
    }
    if (st.burn >= (E.solo() ? 6.5 : BURN)){ const n = E.names()[st.h]; st.h = -1; st.pos = PED.slice(); E.ev('laugh', `OUCH! The idol burned ${n} and flew back to its pedestal!`); }
  },
  visual(dt, t, st, R, E){
    let x, y, z;
    if (st.h >= 0){ const pp = E.playerPos(st.h); if (pp){ x = pp.x; y = 2.3; z = pp.z; } }
    if (x === undefined){ x = st.pos[0]; y = st.pos === PED || (st.pos[0] === PED[0] && st.pos[1] === PED[1]) ? 1.35 : (st.done ? 1.45 : .5); z = R.Z(st.pos[1]); }
    this.idol.position.set(x, y + Math.sin(t * 3) * .05, z); this.idol.rotation.y += dt * 1.5;
    this.flame.visible = st.h >= 0 && st.burn > BURN * .5;
    if (this.flame.visible){ this.flame.position.set(x, y + .9, z); this.flame.scale.setScalar(.6 + st.burn / BURN + Math.sin(t * 20) * .1); }
    this.rests.forEach(m => m.visible = E.solo());
  },
  bar(st, R, E){ if (st.h < 0 || st.done) return null; const B = E.solo() ? 6.5 : BURN; return { frac: 1 - st.burn / B, label: st.h === E.myIdx() ? '🔥 It\'s burning you — pass it!' : `🔥 ${E.names()[st.h]} is burning!`, color: st.burn > B * .7 ? '#ff4a2a' : '#ffc46b' }; },
  objective(st, R, E){
    if (st.done) return 'The curse is lifted! Through the front gate — you\'re out!';
    return E.solo() ? 'Carry the cursed idol to the altar (top-left). It burns after a few seconds — set it down on the blue cooling stones to reset it.'
      : 'Carry the cursed idol to the altar (top-left). It burns whoever holds it for 4 seconds — walk into your partner to PASS it. Leapfrog each other down the path!';
  }
};

export default {
  level: 2,
  title: 'Grimwood Carnival',
  tagline: 'The carnival closed fifty years ago.<br>Nobody told the ghosts.',
  story: 'The rides are still running. Ten attractions stand between you and the exit.',
  winTitle: 'You escaped the carnival! 🎡',
  accent: '#ff5a7a',
  wallTex: stripes('#7a1f2e', '#d8c8a8', 8),
  trimColor: 0xd4af37,
  doorColor: 0x6a2a3a,
  sky: 0x8a6fa8,
  rooms: [ticketBooth, carousel, rink, puppet, paint, disco, scales, chairs, pen, prize],
};
