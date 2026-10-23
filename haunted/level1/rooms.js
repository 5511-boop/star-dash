// Level 1 — Hollow Manor, on the shared engine. The ten rooms keep the exact layout of the original standalone
// Level 1, so this file works in world coordinates (x -10..10, z from +10 at the foyer's south wall down to -206)
// through the W(R) helpers below; R.lz / R.Z convert to and from each room's local coordinates.
import { arrivals, setOrbs, orbRow } from '../lib.js';

/* ---------- world-coordinate wrappers around the room API ---------- */
function W(R){
  const L = z => R.lz(z);
  return {
    block: (x1, z1, x2, z2, h, m, c = true) => R.block(x1, L(z1), x2, L(z2), h, m, c),
    hwall: (z, x1, x2) => R.hwall(L(z), x1, x2),
    vwall: (x, z1, z2) => R.vwall(x, L(z1), L(z2)),
    plate: (n, x, z, col, s = 1.6, sym = null) => R.plate(n, x, L(z), col, s, sym),
    door: (n, x1, z1, x2, z2, style) => R.door(n, x1, L(z1), x2, L(z2), style),
    place: (o, x, z, y = 0) => R.place(o, x, L(z), y),
    ghost: d => R.ghost({ ...d, home: [d.home[0], L(d.home[1])], b: [d.b[0], d.b[1], L(d.b[3]), L(d.b[2])] }),
    at: (n, pos) => R.at(n, pos),
  };
}
const N = (x, z, text, r = 1.8) => ({ x, z, text, r });   // wall notes, in world coordinates
const notesOf = (R, list) => list.map(n => [n.x, R.lz(n.z), n.text, n.r]);
const TILE_COL = [0xff4d4d, 0x4d8bff, 0x4dff7a, 0xffe14d], TILE_CSS = ['#ff4d4d', '#4d8bff', '#4dff7a', '#ffe14d'];
const TILE_SYM = ['▲', '●', '■', '★'], TILE_NAME = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const NOTE_L = [130.8, 164.8, 196.0, 220.0], NOTE_R = [523.3, 659.3, 784.0, 880.0];
const snd = {
  note: (E, j, delay = 0) => E.beep(j < 4 ? NOTE_L[j] : NOTE_R[j - 4], .7, 'triangle', .13, 0, delay),
  key: E => { E.beep(880, .1, 'triangle', .1); E.beep(1320, .25, 'triangle', .1, 0, .08); },
  beam: E => E.beep(990, .6, 'sine', .08, 600),
};
let EE = null;   // the engine API, for helpers that need it outside a hook

/* ---------- shared look: pillars, glowing wall notes, panel styles ---------- */
const PILLAR_MATS = {};
function pillar(E, w, x, z, s = 1.2, h = E.WALL_H + .6, c = 0x6d5c80){
  const m = PILLAR_MATS[c] || (PILLAR_MATS[c] = E.pbr('marble', 1, 1, { color: c, tint: new E.THREE.Color(c).lerp(new E.THREE.Color(0xffffff), .45).getHex(), tile: 1.6, roughness: .3, normal: .4 }));
  w.block(x - s / 2, z - s / 2, x + s / 2, z + s / 2, h, m);
}
function noteDecals(E, w, list){ for (const n of list){ const p = new E.THREE.Mesh(new E.THREE.PlaneGeometry(.5, .6), E.glow(0xe8dcb0, .35)); p.rotation.x = -Math.PI / 2; w.place(p, n.x, n.z, .02); } }
let styled = false;
function panelStyles(){
  if (styled) return; styled = true;
  const s = document.createElement('style');
  s.textContent = `.l1syms{display:flex;justify-content:center;gap:10px;margin-top:8px}
    .l1sym{width:62px;height:72px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#120d22;font-family:system-ui,sans-serif}
    .l1sym small{font-size:11px;font-weight:800;margin-top:2px}
    .l1map{display:block;width:min(320px,80vw);height:auto;margin:6px auto 0;border-radius:8px;background:#0b0a18}`;
  document.head.appendChild(s);
}

/* ---------- atmosphere: candle sconces on every room's side walls (a small pool of real lights follows you to
   the nearest ones) and dust drifting in the lantern light. Built once by the Foyer, updated from its visual(). ---------- */
const ATMO = { sconces: [], lights: [], dust: null, seeds: null, N: 300 };
function buildAtmosphere(E){
  const T = E.THREE, brass = E.mat(0x8a7442, { metalness: .7, roughness: .35 }), wax = E.mat(0xf2ead8, { roughness: .6 }), flame = E.glow(0xffa53a, 3);
  const rooms = [[-10, 10], [-30, -10], [-50, -30], [-74, -50], [-96, -74], [-118, -96], [-140, -118], [-162, -140], [-184, -162], [-206, -184]];
  rooms.forEach(([z1, z2], ri) => {
    for (const side of [-1, 1]) for (const z of [z1 + (z2 - z1) * .3, z1 + (z2 - z1) * .72]){
      if (ri === 2 && side === -1 && Math.abs(z + 40) < 3) continue;     // keep the painting clear
      if (ri === 5 && side === -1) continue;                             // the mirror wall
      if (ri === 8 && side === -1 && Math.abs(z + 167.5) < 2) continue;  // the observatory window
      const x = side * 9.88, g = new T.Group(); g.position.set(x, 1.75, z);
      g.add(new T.Mesh(new T.BoxGeometry(.06, .5, .26), brass));
      const arm = new T.Mesh(new T.CylinderGeometry(.03, .03, .32, 6), brass); arm.rotation.z = Math.PI / 2; arm.position.set(-side * .16, -.05, 0); g.add(arm);
      const cup = new T.Mesh(new T.CylinderGeometry(.09, .06, .07, 10), brass); cup.position.set(-side * .3, 0, 0); g.add(cup);
      const c = new T.Mesh(new T.CylinderGeometry(.045, .05, .2, 8), wax); c.position.set(-side * .3, .13, 0); g.add(c);
      const f = new T.Mesh(new T.ConeGeometry(.04, .12, 8), flame); f.position.set(-side * .3, .29, 0); g.add(f);
      E.scene.add(g); ATMO.sconces.push({ x: x - side * .3, y: 2.1, z, flame: f, ph: Math.random() * 10 });
    }
  });
  for (let i = 0; i < 5; i++){ const l = new T.PointLight(0xff9a48, 0, 8.5, 1.6); E.scene.add(l); ATMO.lights.push(l); }
  const geo = new T.BufferGeometry(), pos = new Float32Array(ATMO.N * 3); ATMO.seeds = new Float32Array(ATMO.N);
  for (let i = 0; i < ATMO.N; i++){ pos[i * 3] = (Math.random() - .5) * 18; pos[i * 3 + 1] = Math.random() * 2.6; pos[i * 3 + 2] = (Math.random() - .5) * 18; ATMO.seeds[i] = Math.random() * 100; }
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const tex = E.canvasTex(32, 32, x => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,235,200,1)'); g.addColorStop(1, 'rgba(255,235,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); });
  ATMO.dust = new T.Points(geo, new T.PointsMaterial({ size: .07, map: tex, transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending }));
  E.scene.add(ATMO.dust);
}
function updateAtmosphere(dt, t, E){
  const inGame = E.phase === 'play' || E.phase === 'won', fx = inGame ? E.me.pos.x : 0, fz = inGame ? E.me.pos.z : 0;
  for (const s of ATMO.sconces){ s.f = 1 + Math.sin(t * 13 + s.ph) * .1 + Math.sin(t * 29 + s.ph * 2) * .06; s.flame.scale.setScalar(s.f); s.d = Math.hypot(s.x - fx, s.z - fz); }
  const near = ATMO.sconces.slice().sort((a, b) => a.d - b.d);
  ATMO.lights.forEach((l, i) => { const s = near[i]; if (!s){ l.intensity = 0; return; } l.position.set(s.x, s.y, s.z); l.intensity = 3.2 * s.f * E.clamp(1.4 - s.d / 22, 0, 1); });
  const a = ATMO.dust.geometry.attributes.position;
  for (let i = 0; i < ATMO.N; i++){
    let x = a.getX(i) + Math.sin(t * .3 + ATMO.seeds[i]) * dt * .15, y = a.getY(i) + dt * .05 * Math.sin(ATMO.seeds[i]), z = a.getZ(i) + Math.cos(t * .27 + ATMO.seeds[i]) * dt * .15;
    if (y > 2.6) y = 0; if (y < 0) y = 2.6; if (x > 9) x -= 18; if (x < -9) x += 18; if (z > 9) z -= 18; if (z < -9) z += 18;
    a.setXYZ(i, x, y, z);
  }
  a.needsUpdate = true; ATMO.dust.position.set(fx, 0, fz);
}

/* =============================================================== 1 */
const FOYER_NOTES = [N(0, 9, '“Two must stand where one cannot.”', 2.2), N(-9, 5, 'The clock stopped at midnight. It is always midnight here.', 2)];
const foyer = {
  name: 'The Foyer', depth: 20, spawn: [[-1.5, 4], [1.5, 4]],
  floor: E => E.pbr('wood', 8, 8, { roughness: .6, normal: 1.2 }),
  hint: 'Both blue plates have to be pressed at the same time. Stand on one each. Solo: a plate stays pressed for 5 seconds after you step off — sprint from one to the other.',
  build(R, E){
    EE = E; const T = E.THREE, w = W(R); this.notes = notesOf(R, FOYER_NOTES);
    buildAtmosphere(E); panelStyles();
    { const rug = new T.Mesh(new T.PlaneGeometry(8, 8), E.pbr('rug', 1, 1, { color: 0x6e1f2e, roughness: 1, normal: .6 })); rug.rotation.x = -Math.PI / 2; w.place(rug, 0, 4, .01); }
    pillar(E, w, -9, 2, 1, 1.9, 0x7c8494); pillar(E, w, 9, 2, 1, 1.9, 0x7c8494);
    w.block(-9.7, 7.6, -8.3, 8.9, 2.3, E.mat(0x2b1b14));   // the grandfather clock
    const face = new T.Mesh(new T.CircleGeometry(.4, 20), E.glow(0xe8dcb0, .25)); face.rotation.y = Math.PI; w.place(face, -9, 7.58, 1.7);
    w.plate('A0', -7, -5, 0x7fd1ff); w.plate('B0', 7, -5, 0x7fd1ff);
    noteDecals(E, w, FOYER_NOTES);
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && R.held('A0') && R.held('B0')){ st.done = 1; R.open('exit'); E.ev('door', 'The foyer door creaks open…'); } },
  visual(dt, t, st, R, E){ updateAtmosphere(dt, t, E); if (st.done){ R.glow('A0', .15); R.glow('B0', .15); } },
  objective(st, R, E){
    return st.done ? 'The door is open. Head north into the library.'
      : E.solo() ? 'Two plates must be pressed at once. (Solo: a plate stays pressed for 5 seconds — sprint!)'
      : 'Two must stand where one cannot — each of you stand on a glowing blue plate.';
  }
};

/* =============================================================== 2 */
const LIB_NOTES = [N(0, -12, '“One holds the way, one walks the way.”', 2.2)];
const library = {
  name: 'The Library', depth: 20, spawn: [[-1.5, 2], [1.5, 2]], exits: [[4.5, 7.5], [-7.5, -4.5]],
  floor: E => E.pbr('wood', 8, 8, { roughness: .6, normal: 1.2 }),
  hint: 'One of you stands on the orange plate to hold the gate open while the other goes through to the red lever plate at the back. Solo: step on orange, then sprint through before it shuts. The lever opens two doors — one each.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, LIB_NOTES);
    const bookTex = E.canvasTex(128, 64, (x, wd, h) => { x.fillStyle = '#24160e'; x.fillRect(0, 0, wd, h); const cols = ['#7a2b2b', '#2b4a7a', '#3d6b3a', '#7a6a2b', '#5a2b6b']; for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++){ x.fillStyle = cols[(i * 7 + r * 3) % 5]; x.fillRect(i * 8 + 1, r * 21 + 3, 6, 17); } });
    const books = E.pbr('books', 1, 1, { fallback: bookTex, tile: 2.1, fullHeight: true, roughness: .8, normal: 1 }); EE.books = books;
    w.hwall(-20, -11, 4.5); w.hwall(-20, 7.5, 11);   // the shelf divider, with the gate in it
    w.door('G1', 4.5, -20.3, 7.5, -19.7, 'gate');
    w.block(-10, -18.5, -9.2, -11.5, 2.1, books); w.block(9.2, -18.5, 10, -11.5, 2.1, books); w.block(-3, -24.8, 3, -24.2, 2.1, books);
    w.block(-1.5, -15.6, 1.5, -14.4, .9, E.mat(0x5b3a26));
    w.plate('P1', -6, -14, 0xffc46b); w.plate('L1', -7, -27.5, 0xff7b7b);
    w.ghost({ b: [-9.4, 9.4, -29.4, -20.6], home: [0, -27], sp: 2.6 });
    noteDecals(E, w, LIB_NOTES);
  },
  init(){ return { latch: 0 }; },
  solve(st, R){ st.latch = 1; R.setDoor('G1', 1); },
  host(dt, st, R, E){
    if (!st.latch && R.on('L1')){ st.latch = 1; R.open('exit'); E.ev('door', 'Click! The gate locks open — and two doors open ahead. Split up!'); }
    const g = st.latch || R.held('P1') ? 1 : 0;
    if (g !== (R.isOpen('G1') ? 1 : 0)){ R.setDoor('G1', g); if (!st.latch) E.ev('click'); }
  },
  visual(dt, t, st, R){ if (st.latch){ R.glow('P1', .15); R.glow('L1', .15); } },
  objective(st, R, E){
    if (st.latch) return 'Two doors stand open ahead. Split up — one through each door!';
    if (E.me.pos.z > -20) return E.solo() ? 'Step on the orange plate, then sprint through the gate before it shuts.' : 'One of you holds the orange plate to open the gate. The other slips through.';
    return 'Find the red lever plate at the back of the library. Watch out for the ghost!';
  }
};

/* =============================================================== 3 */
const GAL_NOTES = [N(-7, -32, '“The lady in the painting only speaks to one.”', 2)];
const gallery = {
  name: 'The Gallery', depth: 20, spawn: [[-6, 1.6], [6, 1.6]], exitX: [4.5, 7.5],
  floor: E => E.pbr('wood', 8, 8, { roughness: .6, normal: 1.2 }),
  hint: 'Whoever stands on the purple rug by the painting sees four coloured symbols in order. Read them out; your partner steps on the matching tiles in the right-hand room in that order. A wrong tile restarts the sequence.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, GAL_NOTES);
    w.vwall(0, -30, -45); w.vwall(0, -48, -50);
    w.door('G3', -.3, -48, .3, -45, 'gate');
    pillar(E, w, -4.5, -34, .9, 1.4, 0x8f8a99); pillar(E, w, -4.5, -46, .9, 1.4, 0x8f8a99);
    w.plate('S2', -8.2, -40, 0xc77dff, 2);
    for (let i = 0; i < 4; i++) w.plate('T' + i, [3, 7.5, 3, 7.5][i], [-36, -36, -42, -42][i], TILE_COL[i], 2, TILE_SYM[i]);
    const tex = E.canvasTex(256, 320, (x, wd, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b1a3a'); g.addColorStop(1, '#0e0814'); x.fillStyle = g; x.fillRect(0, 0, wd, h);
      x.fillStyle = '#d9c9b0'; x.beginPath(); x.ellipse(128, 130, 58, 74, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#3b2030'; x.beginPath(); x.ellipse(128, 300, 100, 90, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#1a0f12'; x.beginPath(); x.ellipse(128, 80, 66, 44, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#c77dff'; for (const ex of [104, 152]){ x.beginPath(); x.arc(ex, 128, 9, 0, Math.PI * 2); x.fill(); }
      x.strokeStyle = '#5a2a2a'; x.lineWidth = 4; x.beginPath(); x.moveTo(110, 170); x.quadraticCurveTo(128, 162, 146, 170); x.stroke();
    });
    w.place(new T.Mesh(new T.BoxGeometry(.15, 2.2, 1.8), E.mat(0x8a6a2a, { metalness: .5, roughness: .4 })), -9.9, -40, 1.7);
    const pic = new T.Mesh(new T.PlaneGeometry(1.5, 1.9), new T.MeshStandardMaterial({ map: tex, emissive: 0x332244, emissiveIntensity: .3 })); pic.rotation.y = Math.PI / 2; w.place(pic, -9.8, -40, 1.7);
    this.orbs = [0, 1, 2, 3].map(i => { const o = new T.Mesh(new T.SphereGeometry(.18, 14, 10), E.glow(0x333344, .2)); w.place(o, 9.85, -37 - i * 1.5, 1.8); return o; });
    w.ghost({ b: [1, 9.4, -49.4, -30.6], home: [6, -47.5], sp: 2.5 });
    noteDecals(E, w, GAL_NOTES);
  },
  init(R, E){ return { seq: E.shuffle([0, 1, 2, 3]), k: 0 }; },
  solve(st, R){ st.k = 4; R.setDoor('G3', 1); },
  host(dt, st, R, E){
    if (st.k >= 4) return;
    const awake = E.solo() || R.on('S2');
    for (const a of arrivals(R, 'tile', E.P, pos => { for (let i = 0; i < 4; i++) if (R.at('T' + i, pos)) return i; return -1; })){
      if (!awake){ if (!(R.local.cold > E.elapsed)){ R.local.cold = E.elapsed + 3; E.ev('wrong', 'The tiles are cold… someone has to look at the painting.'); } }
      else if (a.cell === st.seq[st.k]){
        st.k++; E.ev('chime', '', st.k);
        if (st.k === 4){ R.setDoor('G3', 1); R.open('exit'); E.ev('door', 'The lady smiles. The gate and the ballroom door open!'); }
      } else { st.k = 0; E.ev('wrong', 'Wrong tile! The sequence resets.'); }
    }
  },
  visual(dt, t, st, R, E){
    setOrbs(this.orbs, st.k);
    const awake = (E.solo() || R.on('S2')) && st.k < 4;
    for (let i = 0; i < 4; i++) R.glow('T' + i, awake ? (R.on('T' + i) ? 1.2 : .55 + Math.sin(t * 4) * .1) : .08);
    if (st.k >= 4) R.glow('S2', .15);
  },
  panel(st, R, E){
    if (st.k >= 4 || !R.at('S2', E.me.pos)) return null;
    return `<div>The painting's eyes glow… read this to your partner:</div><div class="l1syms">${st.seq.map((c, i) => `<div class="l1sym" style="background:${TILE_CSS[c]};opacity:${i < st.k ? .35 : 1}">${TILE_SYM[c]}<small>${i + 1}. ${TILE_NAME[c]}</small></div>`).join('')}</div>`;
  },
  objective(st, R, E){
    const pn = E.esc(E.names()[1 - E.myIdx()]);
    if (st.k >= 4) return E.me.pos.x < 0 ? 'The gate at the end is open — go through and into the ballroom.' : 'Through the door to the ballroom!';
    if (E.me.pos.x < 0) return E.solo() ? 'Stand on the purple rug to read the painting. Remember the order, then step on the tiles in the right room.' : 'Stand on the purple rug to read the painting. Call out the order to your partner!';
    return E.solo() ? 'Step on the tiles in the order the painting showed (the painting is in the left room).' : `Step on the tiles in the order ${pn} reads from the painting. (${st.k}/4)`;
  }
};

/* =============================================================== 4 */
const CANDLE_SPOTS = [[-8, -53], [8.5, -53], [-8, -72], [8, -72]], CANDELABRA = [0, -62];
const ARM_OFF = [[-.45, 0], [.45, 0], [0, -.45], [0, .45]];
const BALL_NOTES = [N(0, -52, '“Light her four candles and she will let you leave.”', 2.5)];
const ballroom = {
  name: 'The Ballroom', depth: 24, spawn: [[5, 1.6], [7, 1.6]], exitX: [-2, 2],
  floor: E => E.pbr('checker', 4, 4.8, { fallback: E.tiledTex(128, 128, x => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ x.fillStyle = (i + j) % 2 ? '#d8d0c4' : '#2a2433'; x.fillRect(i * 32, j * 32, 32, 32); } }, 4, 4.8), roughness: .22, normal: .8 }),
  hint: 'Walk into a candle on a stand to pick it up, then carry it to the brass candelabra in the middle. One at a time each. If a ghost freezes you, you drop it. Four lit candles banish the ghosts.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, BALL_NOTES);
    for (const [x, z] of [[-4.5, -56.5], [4.5, -56.5], [-4.5, -67.5], [4.5, -67.5]]) pillar(E, w, x, z, 1.2, E.WALL_H + 1.2, 0xbab1c7);
    w.block(-.6, -62.6, .6, -61.4, .5, E.mat(0x8a7442, { metalness: .6, roughness: .4 }));
    const brass = E.mat(0x8a7442, { metalness: .6, roughness: .4 });
    w.place(new T.Mesh(new T.CylinderGeometry(.08, .08, 1.0, 8), brass), 0, -62, 1);
    for (const [ox, oz] of ARM_OFF) w.place(new T.Mesh(new T.CylinderGeometry(.14, .1, .12, 10), brass), ox, -62 + oz, 1.5);
    for (const [x, z] of CANDLE_SPOTS) w.place(new T.Mesh(new T.CylinderGeometry(.35, .45, .4, 12), E.mat(0x4a3a2a)), x, z, .2);
    this.lit = ARM_OFF.map(([ox, oz]) => { const c = candle(E); w.place(c, ox, -62 + oz, 1.56); c.visible = false; return c; });
    this.glowL = new T.PointLight(0xffa53a, 0, 14, 1.2); w.place(this.glowL, 0, -62, 2.6);
    const gone = st => st.lit >= 4;
    w.ghost({ b: [-9.4, 9.4, -73.4, -50.6], home: [-7, -62], sp: 2.8, gone });
    w.ghost({ b: [-9.4, 9.4, -73.4, -50.6], home: [7, -62], sp: 3.2, gone });
    noteDecals(E, w, BALL_NOTES);
  },
  init(R){ return { lit: 0, items: CANDLE_SPOTS.map(([x, z]) => ({ k: 'candle', s: 0, x, lz: R.lz(z), hx: x, hlz: R.lz(z), w: -1 })) }; },
  solve(st){ st.lit = 4; st.items.forEach(it => { it.s = 3; }); },
  itemMesh(k, E){ return k === 'candle' ? candle(E) : null; },
  carryTick(st, R, E, it, p){
    if (Math.hypot(p.pos.x - CANDELABRA[0], p.pos.z - CANDELABRA[1]) > 2.3) return;
    it.s = 3; it.w = -1; st.lit++;
    E.ev('place', st.lit < 4 ? `Candle lit — ${st.lit} of 4` : '');
    if (st.lit === 4){ R.open('exit'); E.ev('door', 'The ghosts wail and fade away… A hidden door opens to the cellar!'); }
  },
  visual(dt, t, st, R){
    this.lit.forEach((c, i) => { c.visible = i < st.lit; c.userData.flame.scale.setScalar(1 + Math.sin(t * 17 + i) * .12); });
    this.glowL.intensity += (st.lit * 2.2 - this.glowL.intensity) * Math.min(1, dt * 3);
  },
  objective(st){ return st.lit < 4 ? `Carry the candles to the candelabra in the middle, one at a time. Lit: ${st.lit}/4` : 'A hidden door opened at the north end. Into the cellar!'; }
};
function candle(E){
  const T = E.THREE, g = new T.Group();
  const stick = new T.Mesh(new T.CylinderGeometry(.09, .1, .5, 10), E.mat(0xf2ead8)); stick.position.y = .25; g.add(stick);
  const flame = new T.Mesh(new T.ConeGeometry(.07, .2, 8), E.flameMat || E.glow(0xffa53a, 2.2)); flame.position.y = .62; g.add(flame);
  g.userData.flame = flame; return g;
}

/* =============================================================== 5 */
const MZ = { cols: 10, rows: 8, x0: -10, z0: -78, entry: 4, exit: 7 };   // rows run north (toward -z) in 2 m cells
const MAZE_START = [MZ.x0 + MZ.entry * 2 + 1, MZ.z0 + 1.2];
function genMaze(seed, mulberry32){
  const rnd = mulberry32(seed), C = MZ.cols, R = MZ.rows, right = [], up = [], seen = [];
  for (let r = 0; r < R; r++){ right.push(Array(C).fill(true)); up.push(Array(C).fill(true)); seen.push(Array(C).fill(false)); }
  const stack = [[MZ.entry, 0]]; seen[0][MZ.entry] = true;
  while (stack.length){
    const [c, r] = stack[stack.length - 1];
    const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([a, b]) => a >= 0 && a < C && b >= 0 && b < R && !seen[b][a]);
    if (!nb.length){ stack.pop(); continue; }
    const [a, b] = nb[Math.floor(rnd() * nb.length)];
    if (a > c) right[r][c] = false; else if (a < c) right[r][a] = false; else if (b > r) up[r][c] = false; else up[b][c] = false;
    seen[b][a] = true; stack.push([a, b]);
  }
  const segs = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++){
    const x = MZ.x0 + c * 2, z = MZ.z0 - r * 2;
    if (c < C - 1 && right[r][c]) segs.push({ x1: x + 2 - .1, x2: x + 2 + .1, z1: z - 2, z2: z });
    if (r < R - 1 && up[r][c]) segs.push({ x1: x, x2: x + 2, z1: z - 2 - .1, z2: z - 2 + .1 });
  }
  return segs;
}
const CELLAR_NOTES = [N(4, -76, '“Only the map knows the way. The walls bite.”')];
const cellar = {
  name: 'The Cellar', depth: 22, spawn: [[-1, 1.5], [1, 1.5]],
  floor: E => E.pbr('cellar', 5, 5.5, { roughness: .95, normal: 1.6 }),
  hint: 'The maze walls are invisible. Whoever stands on the map plate (left of the entrance) sees the walls and the other player, and talks them from E1 to H8 using the letters and numbers on the floor. Touching a wall zaps you back to the start.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, CELLAR_NOTES);
    const thin = E.pbr('brick', 1, 1, { color: 0x55607a, tile: 1.1, roughness: .9, normal: 1.2 });
    const thinH = (z, x1, x2) => w.block(x1, z - .15, x2, z + .15, 1.1, thin);
    thinH(MZ.z0, -10, MZ.x0 + MZ.entry * 2); thinH(MZ.z0, MZ.x0 + MZ.entry * 2 + 2, 10);
    thinH(MZ.z0 - 16, -10, MZ.x0 + MZ.exit * 2); thinH(MZ.z0 - 16, MZ.x0 + MZ.exit * 2 + 2, 10);
    w.block(-8.2, -77.4, -5.8, -76.6, .9, E.mat(0x5b3a26), false).position.z = -77.6;   // the map table
    const grid = E.canvasTex(640, 512, (x, wd, h) => {
      x.clearRect(0, 0, wd, h); x.strokeStyle = 'rgba(180,200,255,.18)'; x.lineWidth = 2;
      for (let c = 0; c <= 10; c++){ x.beginPath(); x.moveTo(c * 64, 0); x.lineTo(c * 64, h); x.stroke(); }
      for (let r = 0; r <= 8; r++){ x.beginPath(); x.moveTo(0, r * 64); x.lineTo(wd, r * 64); x.stroke(); }
      x.fillStyle = 'rgba(200,215,255,.45)'; x.font = 'bold 20px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let c = 0; c < 10; c++) for (let r = 0; r < 8; r++) x.fillText('ABCDEFGHIJ'[c] + (r + 1), c * 64 + 32, (7 - r) * 64 + 32);
    });
    const f = new T.Mesh(new T.PlaneGeometry(20, 16), new T.MeshBasicMaterial({ map: grid, transparent: true })); f.rotation.x = -Math.PI / 2; f.renderOrder = 1; w.place(f, 0, -86, .02);
    this.wallMat = new T.MeshStandardMaterial({ color: 0x7fd1ff, emissive: 0x2a6aa0, emissiveIntensity: .6, transparent: true, opacity: 0 });
    this.group = new T.Group(); E.scene.add(this.group); this.seed = -1;
    w.plate('M5', -7, -76.2, 0x7fd1ff, 1.8); w.plate('G5', 5, -94.8, 0x8affc1, 1.4);
    noteDecals(E, w, CELLAR_NOTES);
  },
  init(){ return { seed: 1 + Math.floor(Math.random() * 1e9), done: 0 }; },
  solve(st){ st.done = 1; },
  segs(st, E){ if (this._seed !== st.seed){ this._seed = st.seed; this._segs = genMaze(st.seed, E.mulberry32); } return this._segs; },
  host(dt, st, R, E){ if (!st.done && R.on('G5')){ st.done = 1; R.open('exit'); E.ev('door', 'You made it through! The maze walls appear and go quiet… the door opens.'); } },
  local(dt, st, R, E){   // each player checks their own walls: touching one zaps you back to the start
    R.local.zap = (R.local.zap || 0) - dt;
    if (st.done || E.phase !== 'play' || R.local.zap > 0 || !R.inside(E.me.pos)) return;
    const p = E.me.pos;
    if (p.z > MZ.z0 + .2 || p.z < MZ.z0 - 16.2) return;
    if (this.segs(st, E).some(b => Math.hypot(p.x - E.clamp(p.x, b.x1, b.x2), p.z - E.clamp(p.z, b.z1, b.z2)) < .28)){
      R.local.zap = .6;
      E.ev('zap', E.solo() ? '' : `${E.names()[E.myIdx()]} hit a wall — zap!`, E.myIdx());   // partner hears it; the toast below is yours
      E.respawnLocal(MAZE_START[0], MAZE_START[1], 'ZAP! You hit a wall — back to the start.');
    }
  },
  visual(dt, t, st, R, E){
    if (this.seed !== st.seed){
      this.seed = st.seed;
      while (this.group.children.length){ const m = this.group.children.pop(); m.geometry.dispose(); }
      for (const s of this.segs(st, E)){ const m = new E.THREE.Mesh(new E.THREE.BoxGeometry(Math.max(.12, s.x2 - s.x1), 1.1, Math.max(.12, s.z2 - s.z1)), this.wallMat); m.position.set((s.x1 + s.x2) / 2, .55, (s.z1 + s.z2) / 2); this.group.add(m); }
    }
    const op = st.done ? .55 : E.solo() ? .3 : 0;
    this.wallMat.opacity += (op - this.wallMat.opacity) * Math.min(1, dt * 3); this.group.visible = this.wallMat.opacity > .01;
    if (st.done){ R.glow('M5', .15); R.glow('G5', .15); }
  },
  panel(st, R, E){   // the map: an SVG of the walls with both players on it
    if (st.done || !R.at('M5', E.me.pos)) return null;
    const Wd = 320, H = 300, pad = 26, cw = (Wd - pad * 2) / MZ.cols, ch = (H - pad * 2) / MZ.rows;
    const X = wx => (pad + (wx - MZ.x0) / 2 * cw).toFixed(1), Y = wz => (pad + (wz - (MZ.z0 - 16)) / 2 * ch).toFixed(1);
    let d = `M${pad} ${pad}H${pad + MZ.exit * cw}M${pad + (MZ.exit + 1) * cw} ${pad}H${Wd - pad}M${pad} ${H - pad}H${pad + MZ.entry * cw}M${pad + (MZ.entry + 1) * cw} ${H - pad}H${Wd - pad}M${pad} ${pad}V${H - pad}M${Wd - pad} ${pad}V${H - pad}`;
    for (const s of this.segs(st, E)) d += s.x2 - s.x1 < .5 ? `M${X((s.x1 + s.x2) / 2)} ${Y(s.z2)}V${Y(s.z1)}` : `M${X(s.x1)} ${Y((s.z1 + s.z2) / 2)}H${X(s.x2)}`;
    let txt = '';
    for (let c = 0; c < MZ.cols; c++) txt += `<text x="${pad + c * cw + cw / 2}" y="${H - pad / 2}" fill="${c === MZ.entry ? '#ffd56b' : '#8fb8d8'}">${'ABCDEFGHIJ'[c]}</text>`;
    for (let r = 0; r < MZ.rows; r++) txt += `<text x="${pad / 2}" y="${pad + (MZ.rows - 1 - r) * ch + ch / 2}" fill="#8fb8d8">${r + 1}</text>`;
    txt += `<text x="${pad + MZ.exit * cw + cw / 2}" y="${pad - 9}" fill="#8affc1">EXIT</text>`;
    let dots = '';
    for (const p of E.P){ if (p.pos.z > MZ.z0 + 1.5 || p.pos.z < MZ.z0 - 17.5) continue; dots += `<circle cx="${X(p.pos.x)}" cy="${Y(p.pos.z)}" r="6" fill="${E.CSSCOL[p.idx]}" stroke="#fff" stroke-width="1.5"/>`; }
    return `<div>The cellar map — guide your partner! Walls are shown in blue.</div><svg class="l1map" viewBox="0 0 ${Wd} ${H}" font-family="system-ui" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="middle"><path d="${d}" stroke="#7fd1ff" stroke-width="3" stroke-linecap="round" fill="none"/>${txt}${dots}</svg>`;
  },
  objective(st, R, E){
    const pn = E.esc(E.names()[1 - E.myIdx()]);
    if (st.done) return 'The maze is safe now. Through the door to the north!';
    if (R.at('M5', E.me.pos)) return `You're reading the map! Guide ${E.solo() ? 'yourself' : pn} from E1 to the exit at H8. Use the floor labels.`;
    return E.solo() ? 'Walk the maze from E1 to H8 (walls are faintly visible in solo). Touch a wall and you get zapped back!'
      : `An invisible maze! ${pn} can stand on the map table (left of the entrance) to see the walls and guide you. Touch a wall = zap.`;
  }
};

/* =============================================================== 6 */
const reflectionOf = pos => (pos.x < -.2 && pos.z < -99 && pos.z > -118) ? { x: -pos.x, z: pos.z } : null;
const MIR_NOTES = [N(0, -98, '“Your reflection goes where you cannot.”')];
const mirrors = {
  name: 'Hall of Mirrors', depth: 22, spawn: [[-1.5, 1.6], [1.5, 1.6]], exitX: [4.5, 7.5],
  floor: E => E.pbr('mirrorfloor', 5, 5.5, { roughness: .12, metalness: .1, normal: .6 }),
  hint: 'The player on the LEFT of the glass has a reflection on the right side. Move so the reflection stands on each glowing plate behind the gates — that opens the gate for the player on the right. The red plate at the far end opens everything.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, MIR_NOTES);
    w.block(-.15, -115, .15, -99, E.WALL_H, E.glassMat);   // the glass divider (solid)
    for (const z of [-102, -107, -112]){
      w.place(new T.Mesh(new T.BoxGeometry(.12, 2, 1.4), E.mat(0xb8a060, { metalness: .6, roughness: .3 })), -9.9, z, 1.4);
      const mr = new T.Mesh(new T.PlaneGeometry(1.2, 1.8), new T.MeshStandardMaterial({ color: 0xcfe6ff, metalness: .9, roughness: .05, emissive: 0x223344, emissiveIntensity: .4 })); mr.rotation.y = Math.PI / 2; w.place(mr, -9.83, z, 1.4);
    }
    w.door('G6a', .15, -103.15, 10, -102.85, 'gate'); w.door('G6b', .15, -108.15, 10, -107.85, 'gate'); w.door('G6c', .15, -113.15, 10, -112.85, 'gate');
    w.door('GL6', -.15, -117.5, .15, -115, 'glass');
    w.plate('R6a', 5, -105, 0xc0e6ff); w.plate('R6b', 2.5, -110.5, 0xc0e6ff); w.plate('R6c', 3, -115.8, 0xc0e6ff); w.plate('L6', 8.2, -116.4, 0xff7b7b, 1.4);
    this.refl = [E.makeChar(E.COLORS[0], true), E.makeChar(E.COLORS[1], true)]; this.refl.forEach(c => c.group.visible = false);
    noteDecals(E, w, MIR_NOTES);
  },
  init(){ return { latch: 0, r6: [0, 0, 0] }; },
  solve(st, R){ st.latch = 1; ['G6a', 'G6b', 'G6c', 'GL6'].forEach(n => R.setDoor(n, 1)); },
  host(dt, st, R, E){
    if (st.latch) return;
    const refl = E.P.map(p => reflectionOf(p.pos)).filter(Boolean);
    ['R6a', 'R6b', 'R6c'].forEach((id, i) => {
      const pressed = E.P.some(p => R.at(id, p.pos)) || refl.some(r => R.at(id, r));
      R.local['p' + i] = pressed;
      if (E.solo() && pressed) st.r6[i] = 1;
      const open = E.solo() ? st.r6[i] : pressed;
      if (!!open !== R.isOpen('G6' + 'abc'[i])){ R.setDoor('G6' + 'abc'[i], open); E.ev('click'); }
    });
    if (R.on('L6')){ st.latch = 1; ['G6a', 'G6b', 'G6c', 'GL6'].forEach(n => R.setDoor(n, 1)); R.open('exit'); E.ev('door', 'The mirrors shatter-chime! The glass door and the exit open.'); }
  },
  visual(dt, t, st, R, E){
    const P = E.phase === 'play' || E.phase === 'won' ? E.P : [];
    for (let i = 0; i < 2; i++){
      const p = P.find(q => q.idx === i), c = this.refl[i], rf = p ? reflectionOf(p.pos) : null;
      c.group.visible = !!rf && !st.latch;
      if (rf){ c.group.position.set(rf.x, 0, rf.z); c.group.rotation.y = -p.ry; c.bodyMat.color.setHex(E.COLORS[i]); E.animChar(c, dt, p.moving, false); }
    }
    ['R6a', 'R6b', 'R6c'].forEach((id, i) => {
      const refl = P.map(p => reflectionOf(p.pos)).filter(Boolean), on = P.some(p => R.at(id, p.pos)) || refl.some(r => R.at(id, r));
      R.glow(id, st.latch ? .15 : on || st.r6[i] ? 1.4 : .45 + Math.sin(t * 3) * .1);
    });
    if (st.latch) R.glow('L6', .15);
  },
  objective(st, R, E){
    const pn = E.esc(E.names()[1 - E.myIdx()]), solo = E.solo(), p = E.me.pos;
    if (st.latch) return 'The glass door and exit are open — head out through the right side.';
    if (p.z > -99) return solo ? 'Go left: your reflection on the other side of the glass can press the plates behind the gates.' : 'Split up! One goes LEFT of the glass, one goes RIGHT.';
    if (p.x < 0) return solo ? 'Move so your reflection stands on each glowing plate (gates stay open in solo). Then go around to the right side.'
      : `Your reflection walks on the other side of the glass. Move it onto the glowing plates to open each gate for ${pn}.`;
    return `Wait for ${solo ? 'your' : pn + "'s"} reflection to open each gate, then go through. Step on the red plate at the far end.`;
  }
};

/* =============================================================== 7 */
const SG = { x: c => -9 + 2 * c, z: r => -119.5 - 2 * r, cols: 10, rows: 10 };
const SHELF_CELLS = [[0, 5], [0, 6], [9, 8], [9, 9], [6, 9]];
const CRATE_DEF = [{ c: 2, r: 2, w: 1, tc: 2, tr: 7 }, { c: 6, r: 3, w: 1, tc: 8, tr: 6 }, { c: 3, r: 4, w: 2, tc: 3, tr: 8 }];
const crateCells = (i, c, r) => { const out = []; for (let k = 0; k < CRATE_DEF[i].w; k++) out.push([c + k, r]); return out; };
const crateRect = (i, c, r) => { const d = CRATE_DEF[i], x = SG.x(c) + (d.w - 1), z = SG.z(r), hw = d.w - .1; return { x1: x - hw, x2: x + hw, z1: z - .9, z2: z + .9 }; };
const STORE_NOTES = [N(1.5, -121.5, '“Some burdens are too heavy for one.”', 1.6)];
const storeroom = {
  name: 'The Storeroom', depth: 22, spawn: [[5, 1.6], [7, 1.6]],
  floor: E => E.pbr('storefloor', 7, 7.7, { roughness: .8, normal: 1.2 }),
  hint: 'Walk into a crate and keep pushing to slide it one square. Get each crate onto the glowing square of its colour. The HEAVY crate only moves when you both push it from the same side. The red plate puts every crate back.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, STORE_NOTES);
    for (const [c, r] of SHELF_CELLS) w.block(SG.x(c) - .95, SG.z(r) - .95, SG.x(c) + .95, SG.z(r) + .95, 2.1, EE.books);
    const crateTex = E.canvasTex(128, 128, (x, wd, h) => { x.fillStyle = '#8a6236'; x.fillRect(0, 0, wd, h); x.strokeStyle = '#4e3317'; x.lineWidth = 10; x.strokeRect(5, 5, wd - 10, h - 10); x.beginPath(); x.moveTo(8, 8); x.lineTo(wd - 8, h - 8); x.stroke(); });
    const heavyTex = E.canvasTex(256, 128, (x, wd, h) => { x.fillStyle = '#5d6470'; x.fillRect(0, 0, wd, h); x.strokeStyle = '#2d3138'; x.lineWidth = 10; x.strokeRect(5, 5, wd - 10, h - 10); x.fillStyle = '#ffd56b'; x.font = 'bold 40px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HEAVY', wd / 2, h / 2 + 2); });
    const cm = E.pbr('crate', 1, 1, { fallback: crateTex, roughness: .85, normal: 1.4 }), hm = E.pbr('heavy', 1, 1, { fallback: heavyTex, roughness: .5, metalness: .5, normal: 1 });
    this.crates = CRATE_DEF.map(d => { const m = new T.Mesh(new T.BoxGeometry(d.w * 2 - .2, 1.5, 1.8), d.w === 2 ? hm : cm); m.position.set(SG.x(d.c) + (d.w - 1), .75, SG.z(d.r)); E.scene.add(m); return m; });
    this.targets = CRATE_DEF.map(d => { const m = new T.Mesh(new T.BoxGeometry(d.w * 2 - .1, .06, 1.9), E.glow(d.w === 2 ? 0xffd56b : 0x8affc1, .5)); m.position.set(SG.x(d.tc) + (d.w - 1), .04, SG.z(d.tr)); E.scene.add(m); return m; });
    w.plate('RS7', 9, -119.5, 0xff5050, 1.4);
    noteDecals(E, w, STORE_NOTES);
  },
  init(){ return { crates: CRATE_DEF.map(d => [d.c, d.r]), done: 0 }; },
  solve(st){ st.crates = CRATE_DEF.map(d => [d.tc, d.tr]); st.done = 1; },
  colliders(st){ return st.crates.map(([c, r], i) => crateRect(i, c, r)); },
  free(st, i, c, r){
    for (const [a, b] of crateCells(i, c, r)){
      if (a < 0 || a >= SG.cols || b < 0 || b >= SG.rows) return false;
      if (SHELF_CELLS.some(([x, y]) => x === a && y === b)) return false;
      for (let j = 0; j < 3; j++) if (j !== i && crateCells(j, st.crates[j][0], st.crates[j][1]).some(([x, y]) => x === a && y === b)) return false;
    }
    return true;
  },
  host(dt, st, R, E){
    if (st.done) return;
    if (R.edge('RS7')){ st.crates = CRATE_DEF.map(d => [d.c, d.r]); E.ev('thud', 'The crates slide back where they started.'); }
    const L = R.local; L.push = L.push || [0, 0, 0]; L.cd = L.cd || [0, 0, 0];
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]], PR = .4;
    for (let i = 0; i < 3; i++){
      L.cd[i] -= dt; if (L.cd[i] > 0) continue;
      const d = CRATE_DEF[i], rc = crateRect(i, st.crates[i][0], st.crates[i][1]);
      let best = -1, bestCount = 0;
      DIRS.forEach(([dx, dz], di) => {
        let cnt = 0;
        for (const p of E.P){
          if (!p.moving || p.frozen) continue;
          const fx = Math.sin(p.ry), fz = Math.cos(p.ry);
          if ((dx && fx * dx < .72) || (dz && fz * dz < .72)) continue;
          const pp = p.pos, reach = PR + .22; let touching = false;
          if (dx === 1) touching = pp.x <= rc.x1 + .05 && rc.x1 - pp.x < reach && pp.z > rc.z1 - .1 && pp.z < rc.z2 + .1;
          if (dx === -1) touching = pp.x >= rc.x2 - .05 && pp.x - rc.x2 < reach && pp.z > rc.z1 - .1 && pp.z < rc.z2 + .1;
          if (dz === 1) touching = pp.z <= rc.z1 + .05 && rc.z1 - pp.z < reach && pp.x > rc.x1 - .1 && pp.x < rc.x2 + .1;
          if (dz === -1) touching = pp.z >= rc.z2 - .05 && pp.z - rc.z2 < reach && pp.x > rc.x1 - .1 && pp.x < rc.x2 + .1;
          if (touching) cnt++;
        }
        if (cnt > bestCount){ bestCount = cnt; best = di; }
      });
      const need = d.w === 2 && !E.solo() ? 2 : 1;
      if (best < 0 || bestCount < need){ L.push[i] = 0; if (best >= 0 && d.w === 2 && !E.solo() && !(L.warn > E.elapsed)){ L.push[i] = 0; } continue; }
      L.push[i] += dt; if (L.push[i] < .3) continue; L.push[i] = 0;
      const [dx, dz] = DIRS[best], nc = st.crates[i][0] + dx, nr = st.crates[i][1] - dz;   // rows grow toward -z
      if (this.free(st, i, nc, nr)){ st.crates[i] = [nc, nr]; L.cd[i] = .35; E.ev('thud'); }
    }
    // pushing the heavy crate alone: tell them why it won't budge
    { const i = 2, rc = crateRect(i, st.crates[i][0], st.crates[i][1]);
      const lone = !E.solo() && E.P.filter(p => p.moving && !p.frozen && Math.hypot(p.pos.x - E.clamp(p.pos.x, rc.x1, rc.x2), p.pos.z - E.clamp(p.pos.z, rc.z1, rc.z2)) < .7).length === 1;
      if (lone){ L.lone = (L.lone || 0) + dt; if (L.lone > 1.2 && !(L.warn > E.elapsed)){ L.warn = E.elapsed + 4; E.ev('thud', 'Too heavy! You need to push it together.'); } } else L.lone = 0; }
    if (CRATE_DEF.every((d, i) => st.crates[i][0] === d.tc && st.crates[i][1] === d.tr)){ st.done = 1; R.open('exit'); E.ev('door', 'All three crates in place — the door unlocks!'); }
  },
  visual(dt, t, st, R, E){
    st.crates.forEach(([c, r], i) => {
      const d = CRATE_DEF[i], m = this.crates[i], tx = SG.x(c) + (d.w - 1), tz = SG.z(r), k = Math.min(1, dt * 10);
      m.position.x += (tx - m.position.x) * k; m.position.z += (tz - m.position.z) * k;
      this.targets[i].material.emissiveIntensity = c === d.tc && r === d.tr ? 1.6 : .45 + Math.sin(t * 3 + i) * .12;
    });
    if (st.done) R.glow('RS7', .1);
  },
  objective(st, R, E){ return st.done ? 'All crates in place — the door north is open!' : `Push the crates onto the glowing squares by walking into them. The HEAVY crate only moves if ${E.solo() ? 'you push it (solo: works alone)' : 'you BOTH push it together'}. Red plate resets the crates.`; }
};

/* =============================================================== 8 */
const KEY_X = [-8.5, -6.5, -4.5, -2.5, 2.5, 4.5, 6.5, 8.5], KEY_SYM = ['♩', '♪', '♫', '♬'];
const MUSIC_NOTES = [N(3, -142, '“Ring the bell. Listen. Play it back — together.”')];
const music = {
  name: 'The Music Room', depth: 22, spawn: [[-1.5, 1.5], [1.5, 1.5]],
  floor: E => E.pbr('carpet', 3, 3.3, { color: 0x5a1622, roughness: 1, normal: .6 }),
  hint: 'Step on the bell plate: the ghost plays four chords, each one key on the LEFT keyboard and one on the RIGHT. Play each chord back by stepping on both keys at the same moment, one of you on each side. A wrong chord makes the pianist furious — run!',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, MUSIC_NOTES);
    w.block(-7.5, -160.5, -2.5, -157.5, 1.1, E.mat(0x15121a, { roughness: .3 }));
    const lid = new T.Mesh(new T.BoxGeometry(5, .08, 3), E.mat(0x0e0c12, { roughness: .25 })); lid.rotation.x = .5; w.place(lid, -5, -159.2, 1.9);
    w.place(new T.Mesh(new T.BoxGeometry(4.6, .12, .5), E.mat(0xf0f0f0)), -5, -157.3, 1.15);
    w.place(new T.Mesh(new T.ConeGeometry(.35, .5, 14, 1, true), E.mat(0xd4af37, { metalness: .8, roughness: .3, side: T.DoubleSide })), 0, -145.2, 1.4);
    w.place(new T.Mesh(new T.CylinderGeometry(.05, .05, 1.2, 6), E.mat(0x333333)), 0, -145.2, .6);
    w.plate('BELL', 0, -144, 0xffd56b);
    for (let j = 0; j < 8; j++) w.plate('K' + j, KEY_X[j], -150, TILE_COL[j % 4], 1.7, KEY_SYM[j % 4]);
    this.orbs = [0, 1, 2, 3].map(i => { const o = new T.Mesh(new T.SphereGeometry(.18, 14, 10), E.glow(0x333344, .2)); w.place(o, 3 + i * 1.5, -161.4, 1.9); return o; });
    // the ghost pianist: sits at the piano until a wrong chord makes it furious
    w.ghost({ b: [-9.4, 9.4, -161.4, -140.6], home: [-5, -155.6], sp: 3.4, radius: 99, label: 'the furious pianist',
      think: (g, dt, st, R2, E2, P) => {
        const active = P.some(p => E2.inBounds(g, p.pos, 0));
        if (st.angry > 0 && active) return false;
        if (E2.stepToward(g, g.home[0], g.home[1], 3, dt) < .1) g.ry = Math.PI;
        return true;
      }, onFreeze: (g, p, st) => { st.angry = 0; } });
    noteDecals(E, w, MUSIC_NOTES);
  },
  init(){ return { seq: [0, 1, 2, 3].map(() => [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)]), k: 0, angry: 0 }; },
  solve(st){ st.k = 4; },
  host(dt, st, R, E){
    const L = R.local; L.demo = Math.max(0, (L.demo || 0) - dt);
    if (st.angry > 0) st.angry = Math.max(0, st.angry - dt);
    if (st.k >= 4) return;
    if (R.edge('BELL') && L.demo <= 0){ L.demo = 7; E.ev('l1demo', 'The ghost pianist plays… watch the keys and listen!'); }
    const win = E.solo() ? 3 : .8;
    for (let j = 0; j < 8; j++){ if (!R.edge('K' + j)) continue; E.ev('l1note', '', j); if (j < 4) L.pl = { k: j, t: E.elapsed }; else L.pr = { k: j - 4, t: E.elapsed }; }
    if (L.pl && E.elapsed - L.pl.t > win && !L.pr) L.pl = null;
    if (L.pr && E.elapsed - L.pr.t > win && !L.pl) L.pr = null;
    if (L.pl && L.pr){
      if (Math.abs(L.pl.t - L.pr.t) <= win){
        const want = st.seq[st.k];
        if (L.pl.k === want[0] && L.pr.k === want[1]){
          st.k++; E.ev('chime', st.k < 4 ? `Chord ${st.k} of 4 — beautiful!` : '', st.k);
          if (st.k === 4){ R.open('exit'); st.angry = 0; E.ev('door', 'The pianist bows. The door creaks open!'); }
        } else { st.k = 0; st.angry = 9; E.ev('boo', 'Wrong chord! The pianist is FURIOUS — run!'); }
      }
      L.pl = L.pr = null;
    }
  },
  onEvent(e, R, E){
    if (e.k === 'l1note'){ snd.note(E, e.a); return true; }
    if (e.k === 'l1demo'){
      const st = R.st(); this.demo = { t0: performance.now(), seq: st.seq.map(c => c.slice()) };
      this.demo.seq.forEach(([l, r], i) => { snd.note(E, l, 1 + i * 1.4); snd.note(E, 4 + r, 1 + i * 1.4); });
      return true;
    }
    return false;
  },
  visual(dt, t, st, R, E){
    setOrbs(this.orbs, st.k);
    if (this.demo && performance.now() - this.demo.t0 > 8000) this.demo = null;
    for (let j = 0; j < 8; j++){
      let v = st.k >= 4 ? .1 : R.on('K' + j) ? 1.3 : .3;
      if (this.demo && st.k < 4){
        const el = (performance.now() - this.demo.t0) / 1000 - 1, i = Math.floor(el / 1.4), f = el - i * 1.4;
        if (i >= 0 && i < 4 && f < .9){ const [l, r] = this.demo.seq[i]; if (j === l || j === 4 + r) v = 2.2; }
      }
      R.glow('K' + j, v);
    }
    R.glow('BELL', st.k >= 4 ? .15 : R.on('BELL') ? 1.2 : .45 + Math.sin(t * 2) * .15);
  },
  objective(st){ return st.k >= 4 ? 'Bravo! The door is open.' : `Ring the bell to hear the ghost play 4 chords. Play each one back: one on the LEFT keys, one on the RIGHT, stepping at the same time. (${st.k}/4)`; }
};

/* =============================================================== 9 */
const OG = { x: c => -9 + 2 * c, z: r => -163.5 - 2 * r, cols: 10, rows: 10 };
const OMIR = [{ c: 3, r: 2, plate: 'PM1', kind: 'toggle' }, { c: 3, r: 7, plate: 'PM2', kind: 'hold' }, { c: 8, r: 7, plate: 'PM3', kind: 'hold' }, { c: 6, r: 4, plate: 'PM4', kind: 'toggle' }];
const CRYSTAL = { c: 8, r: 9 }, BEAM_IN = { r: 2 };
const mirrorStates = st => st.solved ? [1, 1, 1, st.m4] : [st.m1, st.h2, st.h3, st.m4];   // 0 = '\'  1 = '/'
function traceBeam(states){
  let c = -1, r = BEAM_IN.r, dc = 1, dr = 0; const pts = [[-10, OG.z(r)]];
  for (let step = 0; step < 60; step++){
    c += dc; r += dr;
    if (c < 0 || c >= OG.cols || r < 0 || r >= OG.rows){ pts.push([c < 0 ? -10 : c >= OG.cols ? 10 : OG.x(c), r < 0 ? -162.5 : r >= OG.rows ? -182.5 : OG.z(r)]); return { pts, hit: false }; }
    if (c === CRYSTAL.c && r === CRYSTAL.r){ pts.push([OG.x(c), OG.z(r)]); return { pts, hit: true }; }
    const mi = OMIR.findIndex(m => m.c === c && m.r === r);
    if (mi >= 0){ pts.push([OG.x(c), OG.z(r)]); if (states[mi] === 1){ const t = dc; dc = dr; dr = t; } else { const t = dc; dc = -dr; dr = -t; } }
  }
  return { pts, hit: false };
}
const OBS_NOTES = [N(-3.5, -164.5, '“Lead the moonlight home to the crystal.”', 1.6)];
const observatory = {
  name: 'The Observatory', depth: 22, spawn: [[-1.5, 1.5], [1.5, 1.5]],
  floor: E => {
    const m = E.pbr('stars', 2, 2.2, { roughness: .4, normal: .5 }); m.emissive = new E.THREE.Color(0xfff2d0); m.emissiveIntensity = 0;
    new E.THREE.TextureLoader().load('tex/stars_e.jpg?v=2', t => { t.wrapS = t.wrapT = E.THREE.RepeatWrapping; t.repeat.set(2, 2.2); t.colorSpace = E.THREE.SRGBColorSpace; m.emissiveMap = t; m.emissiveIntensity = .9; m.needsUpdate = true; });
    return m;
  },
  hint: 'The moonbeam comes in through the window and bounces off the mirrors. Blue switches flip a mirror each time you step on them; orange switches only flip theirs while someone stands there. Find the combination that lands the beam on the crystal.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, OBS_NOTES);
    this.mirrors = OMIR.map(m => {
      const g = new T.Group();
      const base = new T.Mesh(new T.CylinderGeometry(.35, .45, .3, 12), E.mat(0x8a7442, { metalness: .6, roughness: .4 })); base.position.y = .15; g.add(base);
      const piv = new T.Group(); g.add(piv);
      const gl = new T.Mesh(new T.BoxGeometry(1.6, 1.5, .08), new T.MeshStandardMaterial({ color: 0xdfefff, metalness: .9, roughness: .05, emissive: 0x334466, emissiveIntensity: .5 })); gl.position.y = 1.05; piv.add(gl);
      const fr = new T.Mesh(new T.BoxGeometry(1.7, .1, .12), E.mat(m.kind === 'hold' ? 0xffa040 : 0x5fe0ff)); fr.position.y = 1.85; piv.add(fr);
      w.place(g, OG.x(m.c), OG.z(m.r)); g.userData.piv = piv; return g;
    });
    this.crystal = new T.Mesh(new T.OctahedronGeometry(.55), new T.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x4fb6ff, emissiveIntensity: .3, roughness: .1, metalness: .3, transparent: true, opacity: .9 }));
    w.place(this.crystal, OG.x(CRYSTAL.c), OG.z(CRYSTAL.r), 1.3);
    w.block(OG.x(CRYSTAL.c) - .4, OG.z(CRYSTAL.r) - .4, OG.x(CRYSTAL.c) + .4, OG.z(CRYSTAL.r) + .4, .7, E.mat(0x6d5c80));
    { const win = new T.Mesh(new T.PlaneGeometry(1.6, 1.8), E.glow(0xdfe8ff, 1.2)); win.rotation.y = Math.PI / 2; w.place(win, -9.95, OG.z(BEAM_IN.r), 1.3); }
    w.block(-8.2, -182.6, -6.2, -181.2, 1.2, E.mat(0x4a4a5a));
    { const tube = new T.Mesh(new T.CylinderGeometry(.25, .35, 2.6, 12), E.mat(0x8a7442, { metalness: .6, roughness: .4 })); tube.rotation.set(.5, 0, -.6); w.place(tube, -7.2, -181.9, 2); }
    this.beamMat = new T.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: .85 }); this.beam = new T.Group(); E.scene.add(this.beam); this.key = '';
    w.plate('PM1', -7, -171.5, 0x5fe0ff); w.plate('PM2', -9, -179.5, 0xffa040); w.plate('PM3', 9, -173.5, 0xffa040); w.plate('PM4', 3, -163.5, 0x5fe0ff);
    w.ghost({ b: [-9.4, 9.4, -183.4, -162.6], home: [8, -165], sp: 2.1 });
    noteDecals(E, w, OBS_NOTES);
  },
  init(){ return { m1: 0, h2: 0, h3: 0, m4: 1, solved: 0 }; },
  solve(st){ st.solved = 1; },
  colliders(){ return OMIR.map(m => ({ x1: OG.x(m.c) - .35, x2: OG.x(m.c) + .35, z1: OG.z(m.r) - .35, z2: OG.z(m.r) + .35 })); },
  host(dt, st, R, E){
    if (st.solved) return;
    if (R.edge('PM1')) st.m1 ^= 1;
    if (R.edge('PM4')) st.m4 ^= 1;
    st.h2 = R.held('PM2') ? 1 : 0; st.h3 = R.held('PM3') ? 1 : 0;
    if (traceBeam(mirrorStates(st)).hit){ st.solved = 1; R.open('exit'); E.ev('l1beam'); E.ev('door', 'The moonlight hits the crystal! The door opens.'); }
  },
  onEvent(e, R, E){ if (e.k === 'l1beam'){ snd.beam(E); return true; } return false; },
  visual(dt, t, st, R, E){
    const s = mirrorStates(st), key = s.join('');
    if (key !== this.key){
      this.key = key;
      while (this.beam.children.length){ const m = this.beam.children.pop(); m.geometry.dispose(); }
      const { pts, hit } = traceBeam(s);
      for (let i = 0; i < pts.length - 1; i++){
        const [x1, z1] = pts[i], [x2, z2] = pts[i + 1], len = Math.hypot(x2 - x1, z2 - z1);
        const m = new E.THREE.Mesh(new E.THREE.BoxGeometry(len, .14, .14), this.beamMat); m.position.set((x1 + x2) / 2, 1.05, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); this.beam.add(m);
      }
      this.crystal.material.emissiveIntensity = hit ? 2.2 : .3;
      OMIR.forEach((m, i) => { this.mirrors[i].userData.piv.rotation.y = s[i] === 1 ? Math.PI / 4 : -Math.PI / 4; });
    }
    this.crystal.rotation.y += dt * (st.solved ? 2 : .5);
    for (const id of ['PM1', 'PM2', 'PM3', 'PM4']) R.glow(id, st.solved ? .15 : R.on(id) ? 1.2 : .4);
  },
  objective(st){ return st.solved ? 'The crystal is lit! The door opens.' : 'Guide the moonbeam into the crystal. Blue switches flip a mirror. Orange switches only work while someone stands on them.'; }
};

/* =============================================================== 10 */
const KEY_SPOTS = [[-9, -187.5], [9, -194], [-8.5, -203.5]];
const keyCount = k => (k & 1) + (k >> 1 & 1) + (k >> 2 & 1);
const CRYPT_NOTES = [N(3, -186, '“They only move when no one is watching.”')];
function watchedBy(g, P){
  return P.some(p => {
    if (p.frozen) return false;
    const dx = g.x - p.pos.x, dz = g.z - p.pos.z, d = Math.hypot(dx, dz);
    if (d > 13 || d < .01) return d <= .01;
    return (Math.sin(p.ry) * dx + Math.cos(p.ry) * dz) / d > Math.cos(.87);
  });
}
const crypt = {
  name: 'The Crypt', depth: 22, spawn: [[-1.5, 1.6], [1.5, 1.6]], exitX: [-2, 2],
  floor: E => E.pbr('crypt', 5, 5.5, { color: 0x9a9aa8, roughness: .95, normal: 1.5 }),
  hint: 'These ghosts freeze in place while either of you is facing them (the pale cone shows where you\'re looking). One of you keeps them in view while the other grabs the three skull keys. Get all three and run for the front door.',
  build(R, E){
    const T = E.THREE, w = W(R); this.notes = notesOf(R, CRYPT_NOTES);
    const tomb = E.pbr('tomb', 1, 1, { color: 0x6a6a74, roughness: .9, normal: 1.4 }), lidM = E.pbr('tomb', 1, 1, { color: 0x7d7d88, tint: 0xd8d8e0, roughness: .85, normal: 1.4 });
    for (const [x1, z1, x2, z2] of [[-7, -192, -5, -189], [5, -192, 7, -189], [-7, -199, -5, -196], [5, -199, 7, -196]]){
      w.block(x1, z1, x2, z2, 1.0, tomb);
      w.place(new T.Mesh(new T.BoxGeometry(x2 - x1 + .2, .15, z2 - z1 + .2), lidM), (x1 + x2) / 2, (z1 + z2) / 2, 1.05);
    }
    w.block(-1, -201, 1, -198, 1.3, E.mat(0x4a3f5a));
    this.keys = KEY_SPOTS.map(([x, z]) => {
      const g = new T.Group();
      const skull = new T.Mesh(new T.SphereGeometry(.22, 12, 10), E.glow(0xe8e0c8, .5)); skull.position.y = .9; g.add(skull);
      const shaft = new T.Mesh(new T.BoxGeometry(.08, .5, .08), E.glow(0xd4af37, .5)); shaft.position.y = .52; g.add(shaft);
      const bit = new T.Mesh(new T.BoxGeometry(.18, .07, .08), E.glow(0xd4af37, .5)); bit.position.set(.08, .33, 0); g.add(bit);
      w.place(g, x, z); return g;
    });
    const gone = st => keyCount(st.keys) === 3;
    const shy = (home, sp) => w.ghost({ b: [-9.4, 9.4, -205.4, -184.6], home, sp, radius: 99, tint: 0xb8a0e0, label: 'a crypt ghost', gone,
      think: (g, dt, st, R2, E2, P) => {
        g.sp = sp * (E2.solo() ? .6 : 1);
        if (P.some(p => E2.inBounds(g, p.pos, 0)) && watchedBy(g, P)){ g.w = 1; return true; }   // frozen in place while someone looks
        return false;
      } });
    shy([0, -203.5], 3.2); shy([-8.5, -195], 2.9); shy([8.5, -201], 2.9);
    noteDecals(E, w, CRYPT_NOTES);
  },
  init(){ return { keys: 0 }; },
  host(dt, st, R, E){
    if (keyCount(st.keys) === 3) return;
    for (const p of E.P){
      if (p.frozen) continue;
      KEY_SPOTS.forEach(([x, z], i) => {
        if (!(st.keys & (1 << i)) && Math.hypot(p.pos.x - x, p.pos.z - z) < 1.1){
          st.keys |= 1 << i; const got = keyCount(st.keys);
          E.ev('l1key', got < 3 ? `${E.names()[p.idx]} grabbed a skull key (${got}/3)` : '');
          if (got === 3){ R.open('exit'); E.ev('door', 'The crypt gate grinds open and the ghosts crumble to dust. GET OUT!'); }
        }
      });
    }
  },
  onEvent(e, R, E){ if (e.k === 'l1key'){ snd.key(E); return true; } return false; },
  visual(dt, t, st, R, E){
    this.keys.forEach((k, i) => { k.visible = !(st.keys & (1 << i)); k.rotation.y += dt * 2; k.position.y = Math.sin(t * 2 + i) * .1; });
    // gaze cones on both characters while the crypt ghosts are about
    if (!this.cones && E.chars){
      this.cones = [E.chars.me, E.chars.other].map(c => {
        const cone = new E.THREE.Mesh(new E.THREE.CircleGeometry(13, 24, -Math.PI / 2 - .87, 1.74), new E.THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: .055, depthWrite: false }));
        cone.rotation.x = -Math.PI / 2; cone.position.y = .04; cone.visible = false; c.group.add(cone); return cone;
      });
    }
    if (this.cones){
      const live = keyCount(st.keys) < 3 && E.phase === 'play', mi = E.myIdx();
      this.cones[0].visible = live && R.inside(E.chars.me.group.position) && !E.isFrozen(mi);
      this.cones[1].visible = live && E.chars.other.group.visible && R.inside(E.chars.other.group.position) && !E.isFrozen(1 - mi);
    }
  },
  objective(st, R, E){ return keyCount(st.keys) === 3 ? 'The gate is open! GET OUT!' : `These ghosts only move when nobody is looking at them. ${E.solo() ? 'Keep facing them as you' : 'One of you watches, the other'} grabs the skull keys. Keys: ${keyCount(st.keys)}/3`; }
};

export default {
  level: 1,
  title: 'Hollow Manor',
  tagline: 'Two of you. Ten haunted rooms.<br>Escape together — and don\'t let the ghosts touch you.',
  story: 'The doors are locked behind you. Ghosts freeze anyone they touch — touch your frozen partner to break the ice. Escape together.',
  winTitle: 'You escaped! 🌙',
  accent: '#9b6bff',
  wallImg: 'wallpaper', trimImg: 'trim', wallColor: 0x3a2b4d, trimColor: 0x2e1d14, doorImg: 'door', frontDoorImg: 'frontdoor', doorColor: 0x5b3a22,
  texVer: 2, exposure: 1.7, sky: 0x8a8fc8, ambient: .9, bg: 0x05060c, lantern: 1.8, fancy: true,
  ghostMult: 1,
  rooms: [foyer, library, gallery, ballroom, cellar, mirrors, storeroom, music, observatory, crypt],
};
