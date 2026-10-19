// Level 11 — The Spectral Archive. New power: PHASE RUN (sprint straight through purple ghost-walls).
// Enemies: Hollow Knights — empty armour that can't be stunned, but can't pass ANY wall either.
import { orbRow, setOrbs, near, inRect, textPlane, redraw, knight } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const parquet = E => E.mat(0xffffff, { map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#4a3222'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++){ x.fillStyle = i % 2 ? '#563a26' : '#432c1d'; x.fillRect((i % 4) * 32, Math.floor(i / 4) * 64, 32, 64); } x.strokeStyle = '#2a1a10'; x.lineWidth = 2; for (let i = 0; i <= 4; i++){ x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); } }, 6, 6) });
const shelfMat = E => E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#3a2416'; x.fillRect(0, 0, w, h); const C = ['#7a2a2a', '#2a4a7a', '#2a6a3a', '#8a6a2a', '#5a2a6a', '#6a6a6a']; for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++){ x.fillStyle = C[(i * 3 + r) % C.length]; x.fillRect(i * 8 + 1, r * 32 + 4, 6, 26); } }, 2, 2) });
const fakeMat = E => new E.THREE.MeshStandardMaterial({ color: 0x9a6bff, emissive: 0x6a3aff, emissiveIntensity: .6, transparent: true, opacity: .35 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const rect = (R, x, lz, hw, hd = hw) => R.rect(x - hw, lz - hd, x + hw, lz + hd);
const bookMesh = (E, col) => { const T = E.THREE, g = new T.Group(); const b = new T.Mesh(new T.BoxGeometry(.5, .14, .38), E.mat(col)); g.add(b); const p = new T.Mesh(new T.BoxGeometry(.46, .1, .34), E.mat(0xf0e6c8)); p.position.set(.03, 0, 0); g.add(p); return g; };
const pageMesh = E => { const m = new E.THREE.Mesh(new E.THREE.PlaneGeometry(.5, .65), new E.THREE.MeshStandardMaterial({ color: 0xf4ecd4, emissive: 0x8a8060, emissiveIntensity: .5, side: E.THREE.DoubleSide })); m.rotation.x = -.6; return m; };
const runTip = () => EE && EE.solo !== undefined ? 'Hold <b>Shift</b> (phone: RUN button) while moving' : '';
// a dynamic ghost-wall mesh pool: boxes re-laid every frame from a list of rects
function wallPool(E, n, mat){ const T = E.THREE; return Array.from({ length: n }, () => { const m = new T.Mesh(new T.BoxGeometry(1, 2.6, 1), mat || E.spectralMat); m.visible = false; E.scene.add(m); return m; }); }
function layPool(pool, rects){ pool.forEach((m, i) => { const r = rects[i]; m.visible = !!r; if (!r) return; m.scale.set(r.x2 - r.x1, 1, r.z2 - r.z1); m.position.set((r.x1 + r.x2) / 2, 1.3, (r.z1 + r.z2) / 2); }); }

/* =============================================================== */
const reading = {
  name: 'The Reading Room',
  floor: parquet,
  notes: [[0, 1.6, '“The shelves here are only memories. Run, and you\'ll pass right through.”', 1.5]],
  hint: 'Hold Shift (phone: the RUN button) and keep moving into a purple wall — while you RUN you pass straight through. Running uses stamina: the thick last wall needs a full bar, so catch your breath first.',
  build(R, E){
    EE = E; const T = E.THREE;
    R.spectral(-10, 4.4, 10, 5); R.spectral(-10, 8, 10, 11); R.spectral(-10, 13, 10, 19.5);
    for (const s of [-1, 1]) for (const lz of [6.5, 12]){ const lamp = new T.Mesh(new T.SphereGeometry(.2, 10, 8), E.glow(0xffd38a, 1.6)); R.place(lamp, s * 9.4, lz, 1.8); const l = new T.PointLight(0xffb36b, 3, 7, 1.5); R.place(l, s * 9, lz, 2); }
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19.9)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the phantom shelves — the door opens!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : '<b>NEW: Phase Run!</b> Hold <b>Shift</b> (phone: RUN button) while moving to RUN — running carries you through purple ghost-walls. Watch your stamina on the thick ones.'; }
};

/* =============================================================== */
const CARDS2 = [[-7, 16.5], [7, 6], [7, 17]], DRAWER2 = [0, 11];
const catalogue = {
  name: 'The Card Catalogue',
  floor: parquet,
  notes: [[-3, 1.4, '“The Hollow Knight guards the catalogue. Light can\'t stop it — but walls can.”', 1.5]],
  hint: 'The Hollow Knight can\'t be stunned, but it can\'t pass ANY wall — not even ghost walls. When it closes in, phase through a purple partition and it\'s stuck on the other side. Bring each index card to the drawer in the middle (or throw it there).',
  build(R, E){
    EE = E; const T = E.THREE;
    R.spectral(-10, 2.3, 10, 2.7);
    R.spectral(-3.7, 2.7, -3.3, 21.5); R.spectral(3.3, 2.7, 3.7, 21.5);
    R.spectral(-10, 10.8, -3.7, 11.2); R.spectral(3.7, 10.8, 10, 11.2);
    const cab = new T.Mesh(new T.BoxGeometry(2.2, 1.4, 1), E.mat(0x5a3a22)); R.place(cab, DRAWER2[0], DRAWER2[1], .7); R.block(DRAWER2[0] - 1.1, DRAWER2[1] - .5, DRAWER2[0] + 1.1, DRAWER2[1] + .5, .01, E.mat(0));
    for (let i = 0; i < 6; i++){ const d = new T.Mesh(new T.BoxGeometry(.6, .35, .05), E.mat(0x8a6a42)); R.place(d, -.7 + (i % 3) * .7, DRAWER2[1] - .52, .35 + Math.floor(i / 3) * .5); }
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
    this.k = knight(R, E, [0, 17], { sp: 2.6, gone: st => st.got >= 3 });
  },
  init(){ return { got: 0, items: CARDS2.map(([x, lz]) => mkItem('card', x, lz)) }; },
  solve(st){ st.got = 3; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ if (k !== 'card') return null; const m = new E.THREE.Mesh(new E.THREE.BoxGeometry(.45, .04, .3), new E.THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xffe0a0, emissiveIntensity: .6 })); return m; },
  file(st, E, it){ it.s = 3; st.got++; E.ev('place', st.got < 3 ? `Card filed (${st.got}/3)` : ''); },
  carryTick(st, R, E, it, p){ if (near(R, p, DRAWER2[0], DRAWER2[1], 1.9)) this.file(st, E, it); },
  onLand(st, R, E, it){ if (Math.hypot(it.x - DRAWER2[0], it.lz - DRAWER2[1]) < 1.7) this.file(st, E, it); },
  host(dt, st, R, E){ if (!R.isOpen('exit') && st.got >= 3){ R.open('exit'); E.ev('door', 'All cards filed — the Hollow Knight clanks back to sleep. The door opens!'); } },
  visual(dt, t, st){ setOrbs(this.orbs, st.got); },
  objective(st, R, E){ return st.got >= 3 ? 'The door is open!' : `File the 3 glowing index cards in the drawer in the middle. The <b>Hollow Knight</b> can't be stunned — but it can't pass ghost-walls. Phase through one to escape it! (${st.got}/3)`; }
};

/* =============================================================== */
const BOOKS3 = [[-2, 4.6, 0xb03030], [0, 4.6, 0x30a050], [2, 4.6, 0x3060c0]];
const SLOT3 = [[-9.2, 9.5], [9.2, 14.5], [0, 21]];
const lending = {
  name: 'The Lending Desk',
  floor: parquet,
  solidCarry: true,
  notes: [[3, 1.4, '“Books are heavy with words. Nobody carries one through a ghost-wall.”', 1.5]],
  hint: 'While you hold a book you are SOLID — no phasing. Throw the book through the purple wall into its alcove, phase in after it with empty hands, pick it up and put it on the glowing shelf at the back. Red goes left, green right, blue at the top.',
  build(R, E){
    EE = E; const T = E.THREE;
    const desk = new T.Mesh(new T.BoxGeometry(5, 1, .8), E.mat(0x5a3a22)); R.place(desk, 0, 2.6, .5); R.block(-2.5, 2.2, 2.5, 3, .01, E.mat(0));
    // red alcove (west)
    R.wall(-10, 6.8, -5, 7.2); R.wall(-10, 11.8, -5, 12.2); R.spectral(-5.2, 7.2, -4.8, 11.8);
    // green alcove (east)
    R.wall(5, 11.8, 10, 12.2); R.wall(5, 16.8, 10, 17.2); R.spectral(4.8, 12.2, 5.2, 16.8);
    // blue alcove (north) — the exit is at its back
    R.wall(-3.2, 17.5, -2.8, 22); R.wall(2.8, 17.5, 3.2, 22); R.spectral(-2.8, 17.3, 2.8, 17.7);
    this.slots = SLOT3.map(([x, lz], i) => { const s = new T.Mesh(new T.BoxGeometry(i === 2 ? 1.6 : .5, 1.6, i === 2 ? .5 : 1.6), E.mat(0x3a2416)); R.place(s, x + (i === 0 ? -.5 : i === 1 ? .5 : 0), lz + (i === 2 ? .6 : 0), .8); const g = new T.Mesh(new T.BoxGeometry(.9, .06, .9), E.glow(BOOKS3[i][2], .8)); R.place(g, x, lz, .04); const b = bookMesh(E, BOOKS3[i][2]); b.visible = false; R.place(b, x, lz, 1.2); return b; });
    this.orbs = orbRow(E, R, 3, -1.3, 3.4, 1.3, 1.5);
    knight(R, E, [0, 10], { sp: 2.4, label: 'the Librarian Knight', gone: st => st.put.every(Boolean) });
  },
  init(){ return { put: [0, 0, 0], items: BOOKS3.map(([x, lz], i) => mkItem('book' + i, x, lz, { n: i })) }; },
  solve(st){ st.put = [1, 1, 1]; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ return k.startsWith('book') ? bookMesh(E, BOOKS3[+k[4]][2]) : null; },
  carryTick(st, R, E, it, p){ const [x, lz] = SLOT3[it.n]; if (near(R, p, x, lz, 1.3)){ it.s = 3; st.put[it.n] = 1; const n = st.put.filter(Boolean).length; E.ev('place', n < 3 ? `Book shelved (${n}/3)` : ''); } },
  host(dt, st, R, E){ if (!R.isOpen('exit') && st.put.every(Boolean)){ R.open('exit'); E.ev('door', 'Every book is home — the door behind the blue shelf opens!'); } },
  visual(dt, t, st){ this.slots.forEach((b, i) => b.visible = !!st.put[i]); setOrbs(this.orbs, st.put.filter(Boolean).length); },
  objective(st, R, E){ return st.put.every(Boolean) ? 'All books shelved — the door is in the blue alcove!' : `Shelve each book on the glowing slot of its colour. <b>Holding a book makes you solid</b> — throw it through the ghost-wall, phase in after it, then carry it to the shelf. (${st.put.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const FC = 5, FR = 4, FX = c => -10 + c * 4, FL = r => 2 + r * 4.5;
const FW = { '0,0|1,0': 'O', '0,0|0,1': 'F', '0,1|1,1': 'F', '0,1|0,2': 'O', '0,2|1,2': 'S', '0,2|0,3': 'F', '0,3|1,3': 'T', '1,0|2,0': 'F', '1,0|1,1': 'S', '1,1|2,1': 'O', '1,1|1,2': 'S', '1,2|2,2': 'O', '1,2|1,3': 'F', '1,3|2,3': 'F', '2,0|3,0': 'F', '2,0|2,1': 'O', '2,1|3,1': 'O', '2,1|2,2': 'F', '2,2|3,2': 'O', '2,2|2,3': 'O', '2,3|3,3': 'S', '3,0|4,0': 'O', '3,0|3,1': 'T', '3,1|4,1': 'F', '3,1|3,2': 'F', '3,2|4,2': 'F', '3,2|3,3': 'O', '3,3|4,3': 'T', '4,0|4,1': 'O', '4,1|4,2': 'O', '4,2|4,3': 'O' };
const forged = {
  name: 'The Forged Shelves',
  floor: parquet,
  notes: [[0, 1.4, '“Some ghost-walls are forgeries — solid wood painted purple. Ghost Sight shows the true ones.”', 1.5]],
  hint: 'Hold ☀ for Ghost Sight: TRUE ghost-walls glow bright white-violet. The dull purple ones are fakes — you\'ll bounce off. The straight route up the middle is all fakes; the real way loops round the right side. Two Hollow Knights guard the open halls.',
  build(R, E){
    EE = E; const T = E.THREE, fm = fakeMat(E), sm = shelfMat(E);
    const wall = (x1, l1, x2, l2, t) => { if (t === 'O') return; if (t === 'T') R.spectral(x1, l1, x2, l2); else if (t === 'F') R.block(x1, l1, x2, l2, 2.6, fm); else R.block(x1, l1, x2, l2, 2.6, sm); };
    for (const [k, t] of Object.entries(FW)){
      const [a, b] = k.split('|').map(s => s.split(',').map(Number));
      if (a[1] === b[1]){ const x = FX(a[0] + 1); wall(x - .2, FL(a[1]), x + .2, FL(a[1] + 1), t); }
      else { const l = FL(a[1] + 1); wall(FX(a[0]), l - .2, FX(a[0] + 1), l + .2, t); }
    }
    for (let c = 0; c < FC; c++){ if (c !== 2){ R.block(FX(c), FL(0) - .2, FX(c + 1), FL(0) + .2, 2.6, sm); R.block(FX(c), FL(4) - .2, FX(c + 1), FL(4) + .2, 2.6, sm); } }
    knight(R, E, [6, 4], { sp: 2.2, b: [-1.6, 9.6, 2.3, 19.7] });
    knight(R, E, [2, 15], { sp: 2.2, b: [-6, 9.6, 2.3, 19.7] });
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && E.P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.3)){ st.done = 1; R.open('exit'); E.ev('door', 'Out of the forged stacks — the door opens!'); } if (st.done) R.open('exit'); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Find the way through the stacks. Hold <b>☀</b> for Ghost Sight: true ghost-walls glow — the dull purple ones are <b>forgeries</b> you can\'t phase through.'; }
};

/* =============================================================== */
const GLY5 = ['☾', '☀', '✦', '♆', '♅', '☿'];
const BOOTH5 = [[-10, 8, -5.6, 14], [-2, 17.2, 2, 21.6], [5.6, 8, 10, 14]];
const DIAL5 = [[-2.6, 7], [0, 7], [2.6, 7]];
const booths = {
  name: 'The Sealed Booths',
  floor: parquet,
  notes: [[0, 1.4, '“Each booth hides one symbol. Only the reader inside can see it.”', 1.5]],
  get hint(){ return solo() ? 'Phase into each booth and remember its symbol. Then step on the matching dial (← booth, ↑ booth, → booth) until it shows that symbol. Step off and on again to turn a dial.' : 'Only the person INSIDE a booth can see its symbol — so one of you reads them out while the other turns the dials. Step off and back on a dial to turn it. The Hollow Knight can\'t follow anyone into a booth.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    R.wall(-10, 7.8, -5.6, 8.2); R.wall(-10, 13.8, -5.6, 14.2); R.spectral(-6, 8.2, -5.6, 13.8);
    R.wall(5.6, 7.8, 10, 8.2); R.wall(5.6, 13.8, 10, 14.2); R.spectral(5.6, 8.2, 6, 13.8);
    R.wall(-2.4, 16.8, -2, 21.6); R.wall(2, 16.8, 2.4, 21.6); R.spectral(-2, 16.8, 2, 17.2);
    this.gly = BOOTH5.map(([x1, l1, x2, l2]) => { const m = textPlane(E, 1.4, 1.4, 1.2); m.visible = false; R.place(m, (x1 + x2) / 2, (l1 + l2) / 2, 1.9); return m; });
    this.dials = DIAL5.map(([x, lz], i) => { R.plate('d' + i, x, lz, 0xffd38a, 1.3, ['←', '↑', '→'][i]); const m = textPlane(E, 1, 1, 1); R.place(m, x, lz + .9, 1.6); return m; });
    const desk = new T.Mesh(new T.BoxGeometry(7.6, .8, .5), E.mat(0x5a3a22)); R.place(desk, 0, 8.2, .4); R.block(-3.8, 7.95, 3.8, 8.45, .01, E.mat(0));
    this.k = knight(R, E, [0, 13], { sp: 2.5, gone: st => st.done });
    this.last = null;
  },
  init(){ const r = () => Math.floor(Math.random() * 6); return { code: [r(), r(), r()], dial: [0, 0, 0], done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    DIAL5.forEach((_, i) => { if (R.edge('d' + i)){ st.dial[i] = (st.dial[i] + 1) % 6; E.ev('click'); } });
    if (st.dial.every((d, i) => d === st.code[i])){ st.done = 1; R.open('exit'); E.ev('door', 'The three dials match the booths — the archive door unseals!'); }
  },
  visual(dt, t, st, R, E){
    const p = E.me.pos, lz = R.lz(p.z);
    this.gly.forEach((m, i) => { const [x1, l1, x2, l2] = BOOTH5[i]; const inside = R.inside(p) && p.x > x1 && p.x < x2 && lz > l1 + .3 && lz < l2; m.visible = inside && !st.done; m.rotation.y = Math.atan2(p.x - m.position.x, p.z - m.position.z); });
    const key = st.code.join() + '|' + st.dial.join();
    if (key !== this.last){ this.last = key;
      this.gly.forEach((m, i) => redraw(m, (c, W, H) => { c.fillStyle = '#e8dcff'; c.font = 'bold 190px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(GLY5[st.code[i]], W / 2, H / 2 + 10); }));
      this.dials.forEach((m, i) => redraw(m, (c, W, H) => { c.fillStyle = '#1a1020'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffd38a'; c.font = 'bold 180px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(GLY5[st.dial[i]], W / 2, H / 2 + 10); }));
    }
  },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Each sealed booth (left, top, right) shows a symbol — but only to whoever is inside. Set the three dials (← ↑ →) to match. ${solo() ? 'Step off and on a dial to turn it.' : 'One reads, one turns!'}`; }
};

/* =============================================================== */
const PC6 = [0, 11.2], PR6 = 8.3, PW6 = .3, BM6 = [45, 135, 225, 315].map(a => [PC6[0] + Math.sin(a * Math.PI / 180) * 5.4, PC6[1] + Math.cos(a * Math.PI / 180) * 5.4]);
const ringRects6 = (() => { const out = [], n = 90; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, x = PC6[0] + Math.sin(a) * PR6, l = PC6[1] + Math.cos(a) * PR6; out.push([x - .36, l - .36, x + .36, l + .36]); } return out; })();
const pages = {
  name: 'The Turning Pages',
  floor: parquet,
  notes: [[0, 1.4, '“The great book turns its pages forever. Its guardians are trapped between them.”', 1.5]],
  hint: 'The ring and the four turning pages are ghost-walls: you can phase through them, the knights can\'t. Each knight is trapped in its slice of the book. Wait until a bookmark\'s slice turns so its knight is far away, phase in, touch the bookmark and phase out. Keep some stamina to get out!',
  build(R, E){
    EE = E; const T = E.THREE;
    this.ring = wallPool(E, ringRects6.length); layPool(this.ring, ringRects6.map(([a, b, c, d]) => R.rect(a, b, c, d)));
    this.pg = wallPool(E, 4 * 12);
    const spine = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 2.8, 16), E.mat(0x5a2a1a)); R.place(spine, PC6[0], PC6[1], 1.4); R.block(PC6[0] - .9, PC6[1] - .9, PC6[0] + .9, PC6[1] + .9, .01, E.mat(0));
    BM6.forEach(([x, lz], i) => R.plate('b' + i, x, lz, 0xff6a4a, 1.3, '🔖'));
    this.knights = [45, 135, 225, 315].map(a => knight(R, E, [PC6[0] + Math.sin((a + 20) * Math.PI / 180) * 4.5, PC6[1] + Math.cos((a + 20) * Math.PI / 180) * 4.5], { sp: 2.5, b: [-8.4, 8.4, 2.6, 19.8] }));
    this.orbs = orbRow(E, R, 4, -1.95, 21, 1.3, 2.6);
  },
  init(){ return { t: 0, bm: [0, 0, 0, 0], done: 0 }; },
  solve(st){ st.bm = [1, 1, 1, 1]; st.done = 1; },
  tNow(st, R){ return R.local.t ?? st.t; },
  pageRects(st, R){ const out = [], t = this.tNow(st, R); for (let k = 0; k < 4; k++){ const a = t * .32 + k * Math.PI / 2; for (let j = 0; j < 12; j++){ const d = 1.3 + j * .6, x = PC6[0] + Math.sin(a) * d, l = PC6[1] + Math.cos(a) * d; out.push(R.rect(x - PW6, l - PW6, x + PW6, l + PW6)); } } return out; },
  spectral(st, R){ return [...ringRects6.map(([a, b, c, d]) => R.rect(a, b, c, d)), ...this.pageRects(st, R)]; },
  host(dt, st, R, E){
    st.t += dt * E.GMULT;
    BM6.forEach((_, i) => { if (!st.bm[i] && R.on('b' + i)){ st.bm[i] = 1; E.ev('chime', `Bookmark taken! (${st.bm.filter(Boolean).length}/4)`, i); } });
    if (!st.done && st.bm.every(Boolean)){ st.done = 1; R.open('exit'); E.ev('door', 'All four bookmarks — the great book closes and the door opens!'); }
  },
  local(dt, st, R, E){ const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt * E.GMULT + (st.t - L.t) * .1; },
  visual(dt, t, st, R, E){ layPool(this.pg, this.pageRects(st, R)); setOrbs(this.orbs, st.bm.filter(Boolean).length); BM6.forEach((_, i) => R.glow('b' + i, st.bm[i] ? 1 : undefined)); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Touch the 4 bookmarks inside the great book. The ring and the turning pages are ghost-walls — the <b>knights can't cross them</b>, but you can. (${st.bm.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const POST7 = [[-7, 9.5, 0], [5, 14.5, Math.PI], [-3, 19.5, Math.PI / 2]];
const TOME7 = [0, 20.2], DESK7 = [0, 3.2];
const GAPS7 = [[6.5, 6.5], [-8.5, 12], [6.5, 17]];
const restricted = {
  name: 'The Restricted Section',
  floor: parquet,
  solidCarry: true,
  notes: [[-3, 1.4, '“The sentries see straight through ghost-walls. And the Forbidden Tome is very, very solid.”', 1.5]],
  hint: 'The sentry knights stand still until their lantern cone catches you — their gaze goes right through ghost-walls. Once they chase, phase through a wall to lose them. With the Tome in your hands you can\'t phase: use the gaps in the walls, or throw the Tome through a wall and phase after it.',
  build(R, E){
    EE = E; const T = E.THREE;
    [6.5, 12, 17].forEach((lz, i) => { const g = GAPS7[i][0]; R.spectral(-10, lz - .25, g - 1.1, lz + .25); R.spectral(g + 1.1, lz - .25, 10, lz + .25); const a = new T.Mesh(new T.BoxGeometry(2.2, .2, .6), E.mat(0x3a2416)); R.place(a, g, lz, 2.5); });
    const lect = new T.Mesh(new T.BoxGeometry(1, 1.1, .8), E.mat(0x3a2416)); R.place(lect, TOME7[0], TOME7[1] + .9, .55);
    const desk = new T.Mesh(new T.BoxGeometry(2, .9, 1), E.mat(0x5a3a22)); R.place(desk, DESK7[0], DESK7[1] - .7, .45);
    this.tomeOn = bookMesh(E, 0x4a0a2a); this.tomeOn.scale.setScalar(1.6); this.tomeOn.visible = false; R.place(this.tomeOn, DESK7[0], DESK7[1] - .7, 1);
    this.sent = POST7.map(([x, lz, ry], i) => {
      const g = knight(R, E, [x, lz], { sp: 3, tint: 0x6a6a86, label: 'a sentry knight', wants: (g, p, st) => st.alert[i] > 0, onStep: (g, dt, st, m, best) => { if (!(st.alert[i] > 0) && Math.hypot(g.x - g.home[0], g.z - g.home[1]) < .3){ g.ry = ry + Math.sin(E.elapsed * .6 + i * 2) * .9; } } });
      g.coneMesh = E.sector(6.5, .42, 0xfff1a0, .16); g.mesh.add(g.coneMesh); g.post = ry; return g;
    });
  },
  init(){ return { alert: [0, 0, 0], items: [mkItem('tome', TOME7[0], TOME7[1])], done: 0 }; },
  solve(st){ st.done = 1; st.items[0].s = 3; },
  itemMesh(k, E){ if (k !== 'tome') return null; const b = bookMesh(E, 0x4a0a2a); b.scale.setScalar(1.6); const gl = new E.THREE.Mesh(new E.THREE.SphereGeometry(.4, 10, 8), new E.THREE.MeshBasicMaterial({ color: 0xff3080, transparent: true, opacity: .25 })); b.add(gl); return b; },
  carryTick(st, R, E, it, p){ if (near(R, p, DESK7[0], DESK7[1], 1.7)){ it.s = 3; st.done = 1; R.open('exit'); E.ev('door', 'The Forbidden Tome is checked out! The door at the far end opens — back you go!'); } },
  onLand(st, R, E, it){ if (Math.hypot(it.x - DESK7[0], it.lz - DESK7[1]) < 1.5){ it.s = 3; st.done = 1; R.open('exit'); E.ev('door', 'The Forbidden Tome lands on the desk! The far door opens.'); } },
  host(dt, st, R, E){
    if (st.done) return;
    this.sent.forEach((g, i) => {
      st.alert[i] = Math.max(0, st.alert[i] - dt);
      if (g.stun > 0) return;
      for (const p of E.P){ if (p.frozen || !R.inside(p.pos)) continue; if (E.inCone(g, p.pos, 6.5, .42)){ if (!(st.alert[i] > 0)) E.ev('boo', `A sentry spotted ${E.names()[p.idx]}!`); st.alert[i] = 5; } }
    });
  },
  visual(dt, t, st, R, E){ this.tomeOn.visible = !!st.done; this.sent.forEach((g, i) => { g.coneMesh.visible = !st.done; g.coneMesh.material.color.setHex(st.alert[i] > 0 ? 0xff4040 : 0xfff1a0); }); },
  objective(st, R, E){ return st.done ? 'The Tome is checked out — now get to the far door!' : 'Fetch the <b>Forbidden Tome</b> from the lectern (far end) and bring it to the desk by the entrance. Sentries see <b>through</b> ghost-walls. Holding the Tome makes you <b>solid</b> — use the gaps, or throw it.'; }
};

/* =============================================================== */
const PUD8 = [[-8, 6, -4, 9], [2, 4.5, 6, 7.5], [-3, 12, 2, 14.5], [4.5, 16, 9, 19], [-9, 16.5, -5, 19.5]];
const PG8 = [[-8.5, 20.5], [8.5, 20.5], [0, 18], [-6, 12], [7.5, 10]];
const WAVE8 = { period: 8, speed: 5.4, thick: 1.4, from: 21.6, to: 2 };
const waveLz = t => { const k = t % WAVE8.period, tr = (WAVE8.from - WAVE8.to) / WAVE8.speed; return k < tr ? WAVE8.from - k * WAVE8.speed : null; };
const tide = {
  name: 'The Ink Tide',
  floor: parquet,
  notes: [[0, 1.4, '“Every few seconds the ink tide rolls in. Run through it — or be swept away.”', 1.5]],
  hint: 'The black wave is a moving ghost-wall. If you\'re RUNNING when it reaches you, you phase straight through; if not, it shoves you all the way back. Save stamina for when it arrives — and don\'t be standing in an ink puddle (you can\'t run there). It sweeps the knights back too!',
  build(R, E){
    EE = E; const T = E.THREE;
    PUD8.forEach(([a, b, c, d]) => R.floor(a, b, c, d, new T.MeshStandardMaterial({ color: 0x0a0814, roughness: .1, metalness: .4, emissive: 0x1a0a3a, emissiveIntensity: .4 }), .02));
    this.wave = new T.Mesh(new T.BoxGeometry(20, 2.8, WAVE8.thick), new T.MeshStandardMaterial({ color: 0x1a0830, emissive: 0x4a1a8a, emissiveIntensity: .5, transparent: true, opacity: .75 })); this.wave.visible = false; E.scene.add(this.wave);
    this.warn = new T.Mesh(new T.BoxGeometry(20, .06, 1), E.glow(0x8a4aff, 1)); R.place(this.warn, 0, 21.4, .05);
    knight(R, E, [-5, 15], { sp: 2.3, radius: 7 }); knight(R, E, [5, 8], { sp: 2.3, radius: 7 });
    this.orbs = orbRow(E, R, 5, -2.6, 21.4, 1.3, 2.4);
  },
  init(){ return { t: 0, got: [0, 0, 0, 0, 0], items: PG8.map(([x, lz], i) => mkItem('page', x, lz, { n: i })) }; },
  solve(st){ st.got = [1, 1, 1, 1, 1]; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ return k === 'page' ? pageMesh(E) : null; },
  onPick(st, R, E, it){ it.s = 3; st.got[it.n] = 1; E.ev('pick', `Page saved from the ink! (${st.got.filter(Boolean).length}/5)`); return false; },
  tNow(st, R){ return R.local.t ?? st.t; },
  spectral(st, R){ const w = waveLz(this.tNow(st, R)); return w === null ? [] : [R.rect(-10, w - WAVE8.thick / 2, 10, w + WAVE8.thick / 2)]; },
  speed(st, R, E, idx){ const p = E.playerPos(idx); if (!p) return null; const lz = R.lz(p.z); return PUD8.some(([a, b, c, d]) => p.x > a && p.x < c && lz > b && lz < d) ? { mult: .6, noRun: true } : null; },
  host(dt, st, R, E){ st.t += dt; if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All five pages saved — the door opens!'); } },
  local(dt, st, R, E){ const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt + (st.t - L.t) * .1; },
  visual(dt, t, st, R, E){ const tt = this.tNow(st, R), w = waveLz(tt); this.wave.visible = w !== null; if (w !== null) this.wave.position.set(0, 1.4, R.Z(w)); const k = tt % WAVE8.period; this.warn.material.emissiveIntensity = k > WAVE8.period - 1.2 ? 2 + Math.sin(t * 20) : .3; setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'All pages saved — door open!' : `Save the 5 floating pages. The <b>ink tide</b> sweeps the room: be <b>running</b> when it hits you (not in a puddle!) or it shoves you back. (${st.got.filter(Boolean).length}/5)`; }
};

/* =============================================================== */
const VX9 = [-10, -3.33, 3.33, 10], VL9 = [2.5, 8, 13.5, 19];
const VPG9 = [[0, 0], [2, 1], [1, 1], [0, 2], [2, 2]], VKN9 = [[1, 1], [0, 2]];
const VCYCLE = 6, VOPEN = 2.6;
const vaultRects = (() => { const out = []; for (let i = 1; i < 3; i++) for (let r = 0; r < 3; r++) out.push([VX9[i] - .2, VL9[r], VX9[i] + .2, VL9[r + 1]]); for (let j = 0; j < 4; j++) for (let c = 0; c < 3; c++) out.push([VX9[c], VL9[j] - .2, VX9[c + 1], VL9[j] + .2]); return out; })();
const vcc = (c, r) => [(VX9[c] + VX9[c + 1]) / 2, (VL9[r] + VL9[r + 1]) / 2];
const vault = {
  name: 'The Flickering Vault',
  floor: parquet,
  notes: [[0, 1.4, '“The vault walls are only ghosts for a moment at a time. Don\'t be caught between them.”', 1.5]],
  hint: 'Every 6 seconds the vault walls turn to ghost-walls for a couple of seconds (they glow and hum first). Run through then! When they turn solid again you\'re locked in that chamber — so don\'t get locked in with a knight. Collect the 5 vault pages.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.solidMat = E.mat(0x2a1a3a, { emissive: 0x1a0a2a, emissiveIntensity: .3 });
    this.walls = vaultRects.map(([a, b, c, d]) => { const m = new T.Mesh(new T.BoxGeometry(c - a, 2.6, d - b), this.solidMat); R.place(m, (a + c) / 2, (b + d) / 2, 1.3); return m; });
    VPG9.forEach(([c, r], i) => { const [x, lz] = vcc(c, r); R.plate('p' + i, x + (c === 1 ? 1.6 : 0), lz, 0xf4ecd4, 1.3, '📜'); });
    VKN9.forEach(([c, r]) => { const [x, lz] = vcc(c, r); knight(R, E, [x - 1.5, lz], { sp: 2.6, b: [VX9[c] + .5, VX9[c + 1] - .5, VL9[r] + .5, VL9[r + 1] - .5] }); });
    this.orbs = orbRow(E, R, 5, -2.6, 20.6, 1.3, 2.4);
  },
  init(){ return { t: 0, got: [0, 0, 0, 0, 0], done: 0 }; },
  solve(st){ st.done = 1; st.got = [1, 1, 1, 1, 1]; },
  tNow(st, R){ return R.local.t ?? st.t; },
  isOpenWin(st, R){ return st.done || (this.tNow(st, R) % VCYCLE) < VOPEN; },
  rects(R){ return vaultRects.map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  spectral(st, R){ return this.isOpenWin(st, R) ? this.rects(R) : []; },
  colliders(st, R){ return this.isOpenWin(st, R) ? [] : this.rects(R); },
  host(dt, st, R, E){
    st.t += dt;
    VPG9.forEach((_, i) => { if (!st.got[i] && R.on('p' + i)){ st.got[i] = 1; E.ev('pick', `Vault page! (${st.got.filter(Boolean).length}/5)`); } });
    if (!st.done && st.got.every(Boolean)){ st.done = 1; R.open('exit'); E.ev('door', 'All five vault pages — the vault falls still and the door opens!'); }
  },
  local(dt, st, R, E){ const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt + (st.t - L.t) * .1; const k = L.t % VCYCLE, open = st.done || k < VOPEN; if (open !== L.open){ L.open = open; if (R.inside(E.me.pos) && !st.done) E.sfx.tone && E.beep(open ? 520 : 220, .15, 'sine', .06); } },
  visual(dt, t, st, R, E){
    const k = this.tNow(st, R) % VCYCLE, open = this.isOpenWin(st, R), warn = !open && k > VCYCLE - .9;
    this.walls.forEach(m => { m.material = open ? E.spectralMat : this.solidMat; m.visible = !st.done; });
    this.solidMat.emissiveIntensity = warn ? .9 + Math.sin(t * 30) * .4 : .3;
    setOrbs(this.orbs, st.got.filter(Boolean).length);
  },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Collect the 5 vault pages 📜. The walls are <b>ghost-walls for ~2.5s</b> every 6s — run through then, or you're locked in. Two chambers hold knights! (${st.got.filter(Boolean).length}/5)`; }
};

/* =============================================================== */
const SEAL10 = [[-8, 4], [8, 4], [-8, 19.5], [8, 19.5]];
const SHELF10 = [[-6.5, 6.5, -3, 8], [3, 6.5, 6.5, 8], [-1.8, 10, 1.8, 13], [-6.5, 15, -3, 16.5], [3, 15, 6.5, 16.5], [-9.6, 11, -7, 12.4], [7, 11, 9.6, 12.4]];
const archivist = {
  name: 'The Archivist',
  floor: parquet,
  notes: [[0, 1.4, '“The Archivist has catalogued every soul in this manor. Break his four seals.”', 1.4]],
  hint: 'The Archivist can\'t be stopped and gets faster with every seal — but he can\'t cross a ghost-shelf. Lure him to one side of a shelf, phase through and run to a seal. If he leans on a shelf for a few seconds he tears it apart, so don\'t hide behind the same one forever. Stand on a seal for 2 seconds to break it.',
  build(R, E){
    EE = E; const T = E.THREE;
    SEAL10.forEach(([x, lz], i) => R.plate('s' + i, x, lz, 0xff5050, 1.5, '✶'));
    this.sh = wallPool(E, SHELF10.length);
    this.boss = knight(R, E, [0, 17.5], { sp: st => 2.9 + st.n * .45, scale: 1.8, touch: 1.35, label: 'the Archivist', tint: 0x4a4a62, gone: st => st.done, onStep: (g, dt, st, m, best) => {
      if (!(m.stuck > 0)) { m.tear = 0; return; }
      const i = SHELF10.findIndex(([a, b, c, d], k) => !st.torn[k] && g.x > a - 1.2 && g.x < c + 1.2 && R.lz(g.z) > b - 1.2 && R.lz(g.z) < d + 1.2);
      if (i < 0) return; m.tear = (m.tear || 0) + dt;
      if (m.tear > 2.8){ st.torn[i] = 1; m.tear = 0; E.ev('crash', 'The Archivist tears a ghost-shelf apart!'); }
    } });
    this.squires = [0, 1, 2].map(k => knight(R, E, [k === 1 ? 9 : -9, k === 2 ? 2.6 : 21], { sp: 2.2, label: 'a squire knight', gone: st => st.n <= k || st.done }));
    this.orbs = orbRow(E, R, 4, -1.95, 21.2, 1.3, 3);
  },
  init(){ return { br: [0, 0, 0, 0], pr: [0, 0, 0, 0], torn: SHELF10.map(() => 0), n: 0, done: 0 }; },
  solve(st){ st.n = 4; st.br = [1, 1, 1, 1]; st.done = 1; },
  spectral(st, R){ return SHELF10.filter((_, i) => !st.torn[i]).map(([a, b, c, d]) => R.rect(a, b, c, d)); },
  host(dt, st, R, E){
    if (st.done) return;
    SEAL10.forEach((_, i) => { if (st.br[i]) return; if (E.P.some(p => R.at('s' + i, p.pos) && !p.frozen)){ st.pr[i] += dt; if (st.pr[i] >= 2){ st.br[i] = 1; st.n++; E.ev('gong', st.n < 4 ? `A seal breaks! (${st.n}/4) The Archivist quickens — and a squire wakes!` : '', 90); } } else st.pr[i] = Math.max(0, st.pr[i] - dt); });
    if (st.n >= 4){ st.done = 1; R.open('exit'); E.ev('boom', 'The last seal shatters — the Archivist collapses into a heap of empty armour! The archive doors open.'); }
  },
  visual(dt, t, st, R, E){ layPool(this.sh, SHELF10.map(([a, b, c, d], i) => st.torn[i] ? null : R.rect(a, b, c, d))); setOrbs(this.orbs, st.n); SEAL10.forEach((_, i) => R.glow('s' + i, st.br[i] ? 0 : undefined)); },
  bar(st, R, E){ const i = [0, 1, 2, 3].find(k => R.at('s' + k, E.me.pos)); if (i === undefined || st.br[i]) return null; return { frac: st.pr[i] / 2, label: 'Breaking the seal…', color: '#ff5050' }; },
  objective(st, R, E){ return st.done ? 'The Archivist has fallen — escape the archive!' : `Break the 4 seals ✶ (stand on each for 2s). The <b>Archivist</b> can't be stopped — keep ghost-shelves between you and him. He tears shelves he leans on! (${st.n}/4)`; }
};

export default {
  level: 11,
  title: 'The Spectral Archive',
  tagline: 'Every book ever burned is still on these shelves.<br>So are their guardians.',
  story: 'Half the shelves are only ghosts of shelves. The Hollow Knights that guard them are empty armour — they cannot be frightened, and they never sleep.',
  winTitle: 'The archive is closed! 📚',
  feature: { name: 'Phase Run', icon: '👻', how: 'Hold <b>Shift</b> (phone: <b>RUN</b>) while moving to run — running carries you straight through <b>purple ghost-walls</b>. Running burns stamina, and anything heavy you carry can make you solid.' },
  accent: '#b89aff',
  wallColor: 0x2e2238,
  trimColor: 0x8a6a42,
  doorColor: 0x3a2416,
  sky: 0x8a7aa8,
  bg: 0x07050c,
  drone: 39,
  rooms: [reading, catalogue, lending, forged, booths, pages, restricted, tide, vault, archivist],
};
