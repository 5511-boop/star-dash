// Level 20 — The Heart of Hollow Manor. New power: SOUL BLAST — both tap ☀ at the same moment while standing together
// (solo: tap ☀ right next to your own dream echo) and a wave of light stuns every ghost nearby for a long time.
// Final enemy: the Manor Lord.
import { orbRow, setOrbs, near, inRect, textPlane, redraw, knight } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const heartF = E => E.tex('flesh_wall', { tile: 3, roughness: .8, fallback: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#2a0a14'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6a1a2a'; x.lineWidth = 3; for (let i = 0; i < 7; i++){ x.beginPath(); x.moveTo(Math.random() * w, 0); x.bezierCurveTo(Math.random() * w, h * .3, Math.random() * w, h * .7, Math.random() * w, h); x.stroke(); } x.strokeStyle = '#3a1020'; x.strokeRect(0, 0, w, h); }, 5, 5) });
const voidMat = E => new E.THREE.MeshBasicMaterial({ color: 0x080206 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; it.fuse = 0; };
const blastTip = () => solo() ? 'Soul Blast (solo): <b>rewind</b> (R), then tap <b>☀</b> right next to your dream echo' : '<b>Soul Blast</b>: stand together and <b>both tap ☀</b> at the same moment';
const ryTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const segL = (px, pl, x1, l1, x2, l2) => { const dx = x2 - x1, dl = l2 - l1, L2 = dx * dx + dl * dl || 1e-6, t = Math.max(0, Math.min(1, ((px - x1) * dx + (pl - l1) * dl) / L2)); return Math.hypot(px - x1 - dx * t, pl - l1 - dl * t); };
const gem = (E, col) => new E.THREE.Mesh(new E.THREE.OctahedronGeometry(.3), new E.THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .9 }));
const collect = (R, E, st, list, label, n) => list.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `${label} (${st.got.filter(Boolean).length}/${n})`); } });

/* =============================================================== */
const SEAL1 = [[-5, 7], [5, 7], [-5, 16], [5, 16]];
const grand = {
  name: 'The Grand Return',
  floor: heartF,
  dark: .55,
  notes: [[0, 1.6, '“You\'ve come back to where it started. Now everything in the manor is here to stop you.”', 1.5]],
  get hint(){ return solo() ? 'The soul seals only break in a Soul Blast. Solo: rewind (R), then tap ☀ standing right next to your dream echo. A blast also stuns every ghost nearby for a long time. Two blasts — one between each pair of seals.' : 'The soul seals only break in a Soul Blast: stand close together and BOTH tap ☀ at the same moment. The blast also stuns every ghost nearby for a long time. Two blasts — one between each pair of seals.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.sm = SEAL1.map(([x, lz]) => { const g = new T.Group(); const p = new T.Mesh(new T.CylinderGeometry(.5, .6, 2, 10), E.tex('soul_slate', { color: 0x3a2a3a, tile: 1.2 })); p.position.y = 1; g.add(p); const f = new T.Mesh(new T.ConeGeometry(.35, .9, 8), new T.MeshBasicMaterial({ color: 0xb87aff })); f.position.y = 2.45; g.add(f); g.userData.f = f; R.place(g, x, lz); R.block(x - .5, lz - .5, x + .5, lz + .5, .01, E.mat(0)); return g; });
    R.wall(-10, 19.6, -1.5, 20.4); R.wall(1.5, 19.6, 10, 20.4); R.door('g', -1.5, 19.6, 1.5, 20.4, 'gate');
    this.g = [[-8, 11], [8, 11], [0, 18], [-3, 5], [3, 5], [0, 12]].map(h => R.ghost({ home: h, look: ['normal', 'hood', 'hat', 'wisp', 'blob', 'crown'][Math.abs(h[0] + h[1]) % 6], sp: 2, radius: 7 }));
    this.orbs = orbRow(E, R, 4, -1.95, 21.3, 1.3, 2.4);
  },
  init(){ return { seal: [0, 0, 0, 0] }; },
  solve(st, R){ st.seal = [1, 1, 1, 1]; R.open('g'); },
  onBlast(st, R, E, x, z){ let n = 0; SEAL1.forEach(([sx, sl], i) => { if (!st.seal[i] && Math.hypot(sx - x, sl - R.lz(z)) < 5.5){ st.seal[i] = 1; n++; } }); if (n) E.ev('crash', `${n} soul seal${n > 1 ? 's' : ''} shattered!`); if (st.seal.every(Boolean)){ R.open('g'); R.open('exit'); E.ev('door', 'Every seal is broken — the way into the heart of the manor opens!'); } },
  visual(dt, t, st){ this.sm.forEach((g, i) => { g.userData.f.visible = !st.seal[i]; g.userData.f.scale.y = 1 + Math.sin(t * 8 + i) * .2; }); setOrbs(this.orbs, st.seal.filter(Boolean).length); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : `<b>NEW: Soul Blast!</b> ${blastTip()} — it stuns every ghost around and shatters the 4 purple <b>soul seals</b>. (${st.seal.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const HC2 = [0, 11.5], FR2 = [[-7, 5], [7, 6.5], [-6.5, 17], [6, 18]];
const heartbeat = {
  name: 'The Heartbeat',
  floor: heartF,
  dark: .6,
  notes: [[0, 1.6, '“The manor has a heart, and every beat sends a ripple through the floor.”', 1.5]],
  hint: 'Every heartbeat sends a red ripple out across the floor. If it passes under your feet you\'re frozen — unless you DASH at that moment (dashing hops right over it). Watch the ring, dash as it reaches you. Collect the four heart fragments.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.heart = new T.Mesh(new T.SphereGeometry(1.2, 18, 14), E.tex('flesh_wall', { color: 0xc81a3a, emissive: 0xff2a40, emissiveIntensity: .9, emissiveMap: true, tint: 0xff8a8a, rx: 2, ry: 1 })); R.place(this.heart, HC2[0], HC2[1], 1.4); R.block(-1, 10.5, 1, 12.5, .01, E.mat(0));
    this.ring = new T.Mesh(new T.RingGeometry(.97, 1, 64), new T.MeshBasicMaterial({ color: 0xff2a4a, transparent: true, opacity: .8, side: T.DoubleSide, depthWrite: false })); this.ring.rotation.x = -Math.PI / 2; R.place(this.ring, HC2[0], HC2[1], .06);
    this.fm = FR2.map(([x, lz]) => { const m = gem(E, 0xff4a6a); R.place(m, x, lz, .6); return m; });
    this.orbs = orbRow(E, R, 4, -1.95, 21.3, 1.3, 2.4);
  },
  init(){ return { t: 0, got: [0, 0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1, 1]; },
  rad(st){ const k = st.t % 2.6; return 1.3 + k * 6; },
  host(dt, st, R, E){
    if (Math.floor(st.t / 2.6) !== Math.floor((st.t + dt) / 2.6) && !st.got.every(Boolean)) E.ev('beat');
    st.t += dt;
    if (!st.got.every(Boolean)){ const r = this.rad(st); if (r < 15) for (const p of E.P){ if (p.frozen || p.dashing || !R.inside(p.pos)) continue; const d = Math.hypot(p.pos.x - HC2[0], R.lz(p.pos.z) - HC2[1]); if (Math.abs(d - r) < .4) E.freeze(p.idx, 3, `The heartbeat ripple caught ${E.names()[p.idx]}!`); } }
    collect(R, E, st, FR2, 'A heart fragment!', 4);
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'The heart is whole — its beat softens. The door opens!'); }
  },
  visual(dt, t, st, R){ const r = this.rad(st); this.ring.scale.setScalar(r); this.ring.visible = !st.got.every(Boolean); const k = st.t % 2.6; this.heart.scale.setScalar(1 + Math.max(0, .25 - k) * 1.2); this.fm.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.y += dt; }); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 4 heart fragments. Each <b>heartbeat ripple</b> freezes anyone it passes under — <b>dash</b> to hop over it! (${st.got.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const trials = {
  name: 'The Gallery of Trials',
  floor: heartF,
  dark: .45,
  noDashJump: true,
  notes: [[0, 1.6, '“Everything the manor taught you, one last time.”', 1.5]],
  get hint(){ return 'Six barriers, six old tricks: VAULT the rope (dash), PHASE through the ghost-wall (run), GRAPPLE or light-bridge across the chasm, BOMB the cracked wall (bombs by the crate — throw from a few steps back), freeze-BOLT the blue seal, and hold the last gate open with ' + (solo() ? 'a rewind echo on the plate.' : 'your partner or a rewind echo on the plate.'); },
  build(R, E){
    EE = E; const T = E.THREE;
    R.low(-10, 3, 10, 3.5);
    R.spectral(-10, 5, 10, 5.5);
    R.wall(-10, 11, -2, 11.6); R.wall(2, 11, 10, 11.6); R.cracked('c', -2, 11, 2, 11.6);
    R.floor(-10, 13.8, 10, 16.2, voidMat(E), .015); R.hook(0, 16.9);
    R.wall(-10, 17.6, -1.5, 18.2); R.wall(1.5, 17.6, 10, 18.2); R.door('s', -1.5, 17.6, 1.5, 18.2, 'gate');
    const seal = new T.Mesh(new T.TorusGeometry(.5, .1, 8, 20), E.glow(0x5ad1ff, 1.5)); R.place(seal, 0, 17.5, 1.6); this.seal = seal;
    R.wall(-10, 19.8, -1.5, 20.4); R.wall(1.5, 19.8, 10, 20.4); R.door('h', -1.5, 19.8, 1.5, 20.4, 'gate'); R.plate('p', -5, 19, 0xd8a8ff, 1.3, '☾');
    const cr = new T.Mesh(new T.BoxGeometry(1.4, .5, 1), E.tex('manor_oak', { color: 0x5a3a1a, tile: 1 })); R.place(cr, 7, 7, .25);
    for (const [lz, txt] of [[3.25, 'VAULT'], [5.25, 'PHASE'], [11.3, 'BOMB'], [15, 'GRAPPLE'], [17.9, 'BOLT'], [20.1, 'ECHO']]){ const m = textPlane(E, 2, .5, 1); R.place(m, -8.5, lz - .35, 2.4); redraw(m, (c, W, H) => { c.fillStyle = '#2a0a1a'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffd38a'; c.font = 'bold 44px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W / 2, H / 2 + 2); }); }
  },
  init(){ return { seal: 0, items: [mkItem('bomb', 6.6, 7, { n: 0 }), mkItem('bomb', 7.4, 7, { n: 1 })] }; },
  solve(st, R, E){ st.seal = 1; E.S.broken[R.id('c')] = 1; R.open('s'); R.open('h'); },
  pits(st, R){ return [R.rect(-10.5, 13.8, 10.5, 16.2)]; },
  boltTargets(st, R){ return st.seal ? [] : [[0, R.Z(17.5), 0, 1]]; },
  onBoltTarget(st, R, E){ st.seal = 1; R.open('s'); E.ev('crash', 'The blue seal shatters — the gate swings open!'); },
  host(dt, st, R, E){
    st.items.forEach(it => { if (it.s === 3){ it.rt = (it.rt || 0) + dt; if (it.rt > 2.5 && !R.broken('c')){ it.rt = 0; home(it); } } });
    if (!R.isOpen('exit')) R.setDoor('h', R.on('p'));
    if (!R.isOpen('exit') && E.P.some(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.7)){ R.open('exit'); R.open('h'); E.ev('door', 'Every trial passed — the last gate locks open and the door opens!'); }
  },
  visual(dt, t, st){ this.seal.visible = !st.seal; this.seal.rotation.z += dt; },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : 'Six barriers, six old powers: <b>vault</b>, <b>phase</b>, <b>grapple</b>, <b>bomb</b>, <b>bolt</b>, and an <b>echo</b> (or partner) on the ☾ plate.'; }
};

/* =============================================================== */
const AN4 = [[-4, 5], [4, 8], [-4.5, 12], [4.5, 15.5], [-4, 19], [0, 10]], CR4 = [[-6.8, 6], [6.8, 12], [-6.8, 18]];
const breathing = {
  name: 'The Breathing Walls',
  floor: heartF,
  dark: .5,
  notes: [[0, 1.6, '“The manor breathes. In… and OUT.”', 1.5]],
  hint: 'The manor breathes: when it inhales, everything is sucked towards the middle; when it exhales, you\'re blown towards the edges — and off them. The glowing rings are anchors: standing on one, the wind can\'t move you. Move during the pauses, hold on during the breaths. Grab the three breath-crystals near the edges.',
  build(R, E){
    EE = E; const T = E.THREE;
    R.floor(-10, 2.5, -7.4, 20, voidMat(E), .015); R.floor(7.4, 2.5, 10, 20, voidMat(E), .015);
    this.an = AN4.map(([x, lz]) => { const m = new T.Mesh(new T.RingGeometry(.6, .8, 24), E.glow(0x8affc1, .8)); m.rotation.x = -Math.PI / 2; R.place(m, x, lz, .05); return m; });
    this.cm = CR4.map(([x, lz]) => { const m = gem(E, 0x8ad8ff); R.place(m, x, lz, .6); return m; });
    this.parts = Array.from({ length: 50 }, () => { const m = new T.Mesh(new T.SphereGeometry(.05, 4, 3), new T.MeshBasicMaterial({ color: 0xffb8c8, transparent: true, opacity: .6 })); m.userData = { a: Math.random() * 7, r: Math.random() * 9, l: 3 + Math.random() * 17 }; E.scene.add(m); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ return { t: 0, got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  phase(st){ const k = st.t % 9.2; return k < 3 ? 1 : k < 4.6 ? 0 : k < 7.6 ? -1 : 0; },
  tNow(st, R){ return R.local.t ?? st.t; },
  pits(st, R){ return st.got.every(Boolean) ? [] : [R.rect(-10.5, 2.5, -7.4, 20), R.rect(7.4, 2.5, 10.5, 20)]; },
  push(st, R, E, pos){ const lz = R.lz(pos.z); if (lz < 2.5 || lz > 20 || st.got.every(Boolean)) return null; if (AN4.some(([x, l]) => Math.hypot(pos.x - x, lz - l) < .8)) return [0, 0]; const ph = this.phase({ t: this.tNow(st, R) }); if (!ph) return null; const dx = pos.x, d = Math.abs(dx) || .1; return [-ph * Math.sign(dx) * 4.6 * Math.min(1, d / 2 + .3), 0]; },
  speed(st, R, E, idx){ const p = E.playerPos(idx); if (!p) return null; const lz = R.lz(p.z); return AN4.some(([x, l]) => Math.hypot(p.x - x, lz - l) < .8) && this.phase({ t: this.tNow(st, R) }) ? { mult: .25 } : null; },
  host(dt, st, R, E){ st.t += dt; collect(R, E, st, CR4, 'A breath-crystal!', 3); if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three crystals — the manor holds its breath. The door opens!'); } },
  local(dt, st, R, E){ const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt + (st.t - L.t) * .1; },
  visual(dt, t, st, R){ const ph = this.phase({ t: this.tNow(st, R) }); this.parts.forEach(m => { const u = m.userData; u.r = (u.r + dt * (ph === 1 ? -3 : ph === -1 ? 3 : 0) + 10) % 10; m.position.set(Math.sin(u.a) * u.r, .5, R.Z(u.l)); m.visible = !st.got.every(Boolean); }); this.cm.forEach((m, i) => m.visible = !st.got[i]); this.an.forEach(m => m.material.emissiveIntensity = ph ? 1.6 : .5); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  bar(st, R, E){ const ph = this.phase({ t: this.tNow(st, R) }); if (st.got.every(Boolean) || !R.inside(E.me.pos)) return null; const k = this.tNow(st, R) % 9.2; return { frac: ph === 1 ? (3 - k) / 3 : ph === -1 ? (7.6 - k) / 3 : 1, label: ph === 1 ? 'INHALE…' : ph === -1 ? 'EXHALE…' : 'pause — move!', color: ph ? '#ff8aa8' : '#8affc1' }; },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Grab the 3 crystals near the edges. The manor <b>inhales</b> (pulls you in) and <b>exhales</b> (blows you out over the edge) — hold on at the glowing <b>anchor rings</b>. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const SEATS5 = [[-3, 7, 'L1'], [-3, 11.5, 'L2'], [-3, 16, 'L3'], [3, 7, 'R1'], [3, 11.5, 'R2'], [3, 16, 'R3']];
const GUEST5 = [['COUNT', 2], ['COOK', 4], ['CAT', 1]];
const banquet = {
  name: 'The Haunted Banquet',
  floor: heartF,
  dark: .45,
  notes: [[0, 1.6, '“The ghostly guests insist on proper seating. And they throw the cutlery.”', 1.5]],
  hint: 'Read the three seating rules on the walls, then carry each place card to the right chair. Knives fly across the hall along the glowing lines — get off a line when it lights up.',
  build(R, E){
    EE = E; const T = E.THREE;
    const tbl = new T.Mesh(new T.BoxGeometry(3.6, .9, 12), E.tex('manor_oak', { color: 0x4a2a1a, tile: 1.6 })); R.place(tbl, 0, 11.5, .45); R.block(-1.8, 5.5, 1.8, 17.5, .01, E.mat(0)); const cloth = new T.Mesh(new T.BoxGeometry(3.8, .05, 12.2), E.mat(0xe8d8d8)); R.place(cloth, 0, 11.5, .92);
    for (let i = 0; i < 7; i++){ const c = new T.Mesh(new T.CylinderGeometry(.08, .08, .5, 6), E.glow(0xffd38a, 1.2)); R.place(c, 0, 6.5 + i * 1.65, 1.2); }
    this.chairs = SEATS5.map(([x, lz]) => { const c = new T.Mesh(new T.BoxGeometry(.9, 1.4, .9), E.tex('manor_oak', { color: 0x6a3a2a, tile: 1 })); R.place(c, x + (x < 0 ? -.7 : .7), lz, .7); const card = textPlane(E, 1.1, .5, 1); card.visible = false; R.place(card, x * .45, lz, 1.05); card.rotation.x = -Math.PI / 2; return card; });
    [['The COUNT sits on the left side,', 'in the seat nearest the way out.'], ['The COOK takes the middle seat', 'on the right side.'], ['The CAT sits directly', 'opposite the COOK.']].forEach(([a, b], i) => { const m = textPlane(E, 3.6, 1, 1); m.rotation.y = i === 1 ? -Math.PI / 2 : Math.PI / 2; R.place(m, i === 1 ? 9.7 : -9.7, 6 + i * 5, 1.8); redraw(m, (c, W, H) => { c.fillStyle = '#2a0a14'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffd38a'; c.font = 'italic 24px Georgia'; c.textAlign = 'center'; c.fillText(a, W / 2, H / 2 - 14); c.fillText(b, W / 2, H / 2 + 18); }); });
    this.lines = Array.from({ length: 2 }, () => { const m = new T.Mesh(new T.BoxGeometry(20, .03, .5), new T.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0 })); E.scene.add(m); return m; });
    this.knives = Array.from({ length: 2 }, () => { const m = new T.Mesh(new T.BoxGeometry(.8, .05, .12), E.mat(0xe8e8f0, { metalness: .9 })); m.visible = false; E.scene.add(m); return m; });
  },
  init(){ return { put: [0, 0, 0], kn: [], t: 2, items: GUEST5.map(([n], i) => mkItem('card' + i, -6 + i * 6, 3.6, { n: i })) }; },
  solve(st){ st.put = [1, 1, 1]; },
  itemMesh(k, E){ if (!k.startsWith('card')) return null; const m = textPlane(E, 1, .45, 1); redraw(m, (c, W, H) => { c.fillStyle = '#f2ead8'; c.fillRect(0, 0, W, H); c.fillStyle = '#2a0a14'; c.font = 'bold 44px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(GUEST5[+k[4]][0], W / 2, H / 2 + 2); }); return m; },
  carryTick(st, R, E, it, p){ SEATS5.forEach(([x, lz], si) => { if (!near(R, p, x, lz, 1.1)) return; if (GUEST5[it.n][1] === si){ it.s = 3; st.put[it.n] = 1; const n = st.put.filter(Boolean).length; E.ev('place', n < 3 ? `"How delightful." (${n}/3)` : ''); } else if (!it.tut){ it.tut = 1; E.ev('wrong', `A ghostly guest tuts loudly. That's not the ${GUEST5[it.n][0]}'s seat.`); } }); if (!SEATS5.some(([x, lz]) => near(R, p, x, lz, 1.6))) it.tut = 0; },
  host(dt, st, R, E){
    st.t -= dt;
    if (st.t <= 0 && !st.put.every(Boolean)){ st.t = 1.7; const lz = +(3.5 + Math.random() * 16.5).toFixed(2); st.kn.push([lz, Math.random() < .5 ? -1 : 1, -1.1]); if (st.kn.length > 2) st.kn.shift(); }
    st.kn.forEach(k => { k[2] += dt; if (k[2] > 0 && k[2] < 1.4){ const x = -k[1] * 10 + k[1] * k[2] * 16; for (const p of E.P) if (!p.frozen && !p.dashing && R.inside(p.pos) && Math.abs(R.lz(p.pos.z) - k[0]) < .5 && Math.abs(p.pos.x - x) < .8) E.freeze(p.idx, E.FREEZE, `A flying knife pinned ${E.names()[p.idx]}'s sleeve to the floor!`); } });
    if (!R.isOpen('exit') && st.put.every(Boolean)){ R.open('exit'); E.ev('door', 'The guests are seated — dinner is served, and the door opens!'); }
  },
  visual(dt, t, st, R){ this.lines.forEach((m, i) => { const k = st.kn[i]; m.material.opacity = k && k[2] < 0 ? .3 + Math.sin(t * 20) * .15 : 0; if (k) m.position.set(0, .04, R.Z(k[0])); }); this.knives.forEach((m, i) => { const k = st.kn[i]; m.visible = !!k && k[2] > 0 && k[2] < 1.4; if (m.visible) m.position.set(-k[1] * 10 + k[1] * k[2] * 16, 1, R.Z(k[0])); }); this.chairs.forEach((c, si) => { const g = GUEST5.findIndex(([, s]) => s === si); c.visible = g >= 0 && !!st.put[g]; if (c.visible && !c.userData.d){ c.userData.d = 1; redraw(c, (cx, W, H) => { cx.fillStyle = '#f2ead8'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#2a0a14'; cx.font = 'bold 44px Georgia'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(GUEST5[g][0], W / 2, H / 2 + 2); }); } }); },
  objective(st, R, E){ return st.put.every(Boolean) ? 'The door is open!' : `Seat the guests: carry each place card to the right chair — the rules are on the walls. Dodge the <b>flying knives</b> (glowing lines). (${st.put.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const LG6 = { c: 4, r: 3, x: c => -6 + c * 4, l: r => 6 + r * 4.5 };
const WORD6 = 'HOLLOW', POOL6 = ['H', 'O', 'L', 'W', 'E', 'A', 'M', 'N', 'R', 'S', 'O', 'L'];
const letters = {
  name: 'The Letters of HOLLOW',
  floor: heartF,
  dark: .5,
  notes: [[0, 1.6, '“Say its name and it will let you pass. Spell it with your feet.”', 1.5]],
  hint: 'Step on the letter tiles to spell H-O-L-L-O-W, in order. Stepping on a wrong letter starts the word over (and the tiles shuffle). You can use the same tile twice — just step off and back on. The ghosts are drawn to the word; a Soul Blast will scatter them for a long time.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.tiles = []; for (let r = 0; r < LG6.r; r++) for (let c = 0; c < LG6.c; c++){ const i = r * LG6.c + c; R.zone('t' + i, LG6.x(c), LG6.l(r), 2.4); const m = textPlane(E, 2.3, 2.3, 1); m.rotation.x = -Math.PI / 2; R.place(m, LG6.x(c), LG6.l(r), .04); this.tiles.push(m); }
    this.word = textPlane(E, 6, 1.2, 1); R.place(this.word, 0, 19.5, 2.6);
    this.g = [R.ghost({ home: [-8, 18], look: 'hood', sp: 2.1, radius: 9 }), R.ghost({ home: [8, 18], look: 'hat', sp: 2.1, radius: 9 }), R.ghost({ home: [0, 3], look: 'normal', sp: 1.9, radius: 9 })];
  },
  init(){ return { lay: POOL6.slice(), n: 0, done: 0 }; },
  solve(st){ st.done = 1; st.n = 6; },
  shuffle(st){ const a = st.lay; for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } },
  host(dt, st, R, E){
    if (st.done) return;
    for (let i = 0; i < LG6.c * LG6.r; i++){ if (!R.edge('t' + i)) continue; if (st.lay[i] === WORD6[st.n]){ st.n++; E.ev('chime', '', st.n % 4); if (st.n >= 6){ st.done = 1; R.open('exit'); E.ev('door', '"HOLLOW." The manor hears its name — the door opens!'); } } else { st.n = 0; this.shuffle(st); E.ev('wrong', `"${st.lay[i]}"? Wrong letter — the tiles shuffle and the word starts over.`); } break; }
  },
  visual(dt, t, st){ const key = st.lay.join('') + st.n; if (key !== this.k){ this.k = key; this.tiles.forEach((m, i) => redraw(m, (c, W, H) => { c.fillStyle = '#3a1020'; c.fillRect(0, 0, W, H); c.strokeStyle = '#ffd38a'; c.lineWidth = 6; c.strokeRect(6, 6, W - 12, H - 12); c.fillStyle = '#ffd38a'; c.font = 'bold 170px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.lay[i], W / 2, H / 2 + 10); })); redraw(this.word, (c, W, H) => { c.fillStyle = '#1a0a10'; c.fillRect(0, 0, W, H); c.font = 'bold 40px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; const s = WORD6.split('').map((ch, i) => i < st.n ? ch : '_').join(' '); c.fillStyle = '#ffd38a'; c.fillText(s, W / 2, H / 2); }); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Spell <b>H-O-L-L-O-W</b> by stepping on the letter tiles in order. A wrong letter starts over and shuffles the tiles. (${WORD6.slice(0, st.n) || '—'})`; }
};

/* =============================================================== */
const CH7 = [[-7, 5], [7, 6], [-6, 17], [6.5, 18], [0, 11.5]];
const choir = {
  name: 'The Ghost Choir',
  floor: heartF,
  dark: .55,
  notes: [[0, 1.6, '“Five voices, one song. Silence them all at once, or not at all.”', 1.5]],
  hint: 'Standing in a singer\'s glowing circle too long freezes you. One Soul Blast can only reach ghosts within about 9 steps — and all five singers must be stunned by the SAME blast. Singers drift towards decoy lanterns (hold ⚡): gather them together first, then blast.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.c = CH7.map((h, i) => { const g = R.ghost({ home: h, look: 'crown', tint: 0xe8d8ff, sp: 0, ignoreDecoy: true, label: 'a choir ghost', think: (g, dt, st, R2, E2) => { let d = null, bd = 11; for (const dc of E2.S.decoys){ const dd = Math.hypot(dc.x - g.x, dc.z - g.z); if (dd < bd){ bd = dd; d = dc; } } if (d && bd > 1.4) E2.stepToward(g, d.x, d.z, 2.2 * E2.GMULT, dt); g.y = Math.sin(E2.S.elapsed * 2 + i) * .2; return true; } }); const ring = new T.Mesh(new T.RingGeometry(3.3, 3.5, 32), new T.MeshBasicMaterial({ color: 0xd8a8ff, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; g.mesh.add(ring); g.ring = ring; return g; });
    this.orbs = orbRow(E, R, 5, -2.6, 21.3, 1.3, 2.4);
  },
  init(){ return { ex: [0, 0], done: 0 }; },
  solve(st){ st.done = 1; },
  onBlast(st, R, E, x, z){ if (st.done) return; const n = this.c.filter(g => Math.hypot(g.x - x, g.z - z) < 9).length; if (n >= 5){ st.done = 1; R.open('exit'); E.ev('door', 'One blast, five voices — the choir falls silent forever. The door opens!'); } else E.ev('boo', `The blast stunned ${n} of the 5 singers… the rest keep singing, and the stunned ones will soon rejoin.`); },
  host(dt, st, R, E){
    if (st.done) return;
    for (const p of E.P){ if (p.frozen || !R.inside(p.pos)){ st.ex[p.idx] = 0; continue; } const inS = this.c.some(g => !(g.stun > 0) && Math.hypot(g.x - p.pos.x, g.z - p.pos.z) < 3.4); st.ex[p.idx] = inS ? st.ex[p.idx] + dt : Math.max(0, st.ex[p.idx] - dt); if (st.ex[p.idx] > 1.6){ st.ex[p.idx] = 0; E.freeze(p.idx, E.FREEZE, `The choir's song froze ${E.names()[p.idx]} where they stood!`); } }
  },
  visual(dt, t, st){ this.c.forEach(g => { g.ring.visible = !st.done && !(g.stun > 0); g.ring.scale.setScalar(1 + Math.sin(t * 4) * .03); }); setOrbs(this.orbs, st.done ? 5 : this.c.filter(g => g.stun > 0).length); },
  bar(st, R, E){ const v = st.ex[E.myIdx()]; return v > .05 ? { frac: v / 1.6, label: 'The song…', color: '#d8a8ff' } : null; },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Silence all 5 <b>choir ghosts</b> with <b>one</b> Soul Blast (it reaches ~9 steps). Gather them with <b>decoy lanterns</b> first. Don\'t linger inside their song circles!'; }
};

/* =============================================================== */
const SP8 = [[-7, 4.5], [7, 4.5], [-7, 18.5], [7, 18.5]];
const sentinels = {
  name: 'The Lord\'s Sentinels',
  floor: heartF,
  dark: .5,
  notes: [[0, 1.6, '“The Manor Lord\'s own guard. Nothing stops them — nothing but a Soul Blast.”', 1.5]],
  hint: 'The four sentinels can\'t be flashed, bolted or bombed — only a Soul Blast stuns them (for about 8 seconds — 11 when you\'re alone). Each stands guard over a seal plate. A plate stays lit for 12 seconds after it\'s touched: blast them all from the middle, then race to touch all four plates.',
  build(R, E){
    EE = E;
    SP8.forEach(([x, lz], i) => R.plate('s' + i, x, lz, 0xff4a6a, 1.4, '✶'));
    this.s = SP8.map(([x, lz]) => knight(R, E, [x + (x < 0 ? 1.4 : -1.4), lz + (lz < 10 ? 1.2 : -1.2)], { sp: 4.3, radius: 6, touch: 1.1, tint: 0x5a2a3a, label: 'a sentinel', b: [x < 0 ? -9.6 : 2, x < 0 ? -2 : 9.6, lz < 10 ? .6 : 13, lz < 10 ? 10 : 21.4] }));
    this.orbs = orbRow(E, R, 4, -1.95, 21.3, 1.3, 2.4);
  },
  init(){ return { lit: [0, 0, 0, 0], done: 0 }; },
  solve(st){ st.done = 1; },
  onBlast(st, R, E, x, z){ let n = 0; this.s.forEach(g => { if (Math.hypot(g.x - x, g.z - z) < 9){ g.stun = solo() ? 11 : 8; n++; } }); if (n) E.ev('gong', `The blast stuns ${n} sentinel${n > 1 ? 's' : ''}!`, 70); },
  host(dt, st, R, E){
    if (st.done) return;
    SP8.forEach((_, i) => { st.lit[i] = Math.max(0, st.lit[i] - dt); if (R.on('s' + i)){ if (!(st.lit[i] > 0)) E.ev('chime', '', i); st.lit[i] = 12; } R.glow('s' + i, st.lit[i] > 0 ? 1 : undefined); });
    if (st.lit.every(v => v > 0)){ st.done = 1; R.open('exit'); E.ev('door', 'All four seal plates blaze at once — the sentinels kneel. The door opens!'); }
  },
  visual(dt, t, st){ setOrbs(this.orbs, st.done ? 4 : st.lit.filter(v => v > 0).length); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Light all 4 ✶ plates within 12 seconds of each other. The <b>sentinels</b> guarding them can only be stopped by a <b>Soul Blast</b>. (${st.lit.filter(v => v > 0).length}/4 lit)`; }
};

/* =============================================================== */
const WALL9 = [4.5, 8, 11.5, 15, 18.5], GAP9 = [[-6, 0, 6], [6, -6, 0], [0, 6, -6], [-6, 6, 0], [6, 0, -6]];
const BEAT9 = 2.4;
const maze = {
  name: 'The Heart\'s Chambers',
  floor: heartF,
  dark: .5,
  notes: [[0, 1.6, '“Five walls, four chambers, one heartbeat. The doors open to its rhythm.”', 1.5]],
  hint: 'Each heartbeat, every other wall opens a doorway — and the doorways move along the wall. The glowing marker on the floor shows where the next wall\'s doorway will open: stand by it, and go through on the beat. A wall that closes on you shoves you back. The heart-wisps in each chamber freeze anyone they catch.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.w = WALL9.map(() => [0, 1].map(() => { const m = new T.Mesh(new T.BoxGeometry(1, 2.6, .6), E.mat(0x5a1a2a)); E.scene.add(m); return m; }));
    this.mk = WALL9.map(() => { const m = new T.Mesh(new T.BoxGeometry(2.8, .04, .9), new T.MeshBasicMaterial({ color: 0xff4a6a, transparent: true, opacity: .45 })); E.scene.add(m); return m; });
    this.g = [0, 1, 2, 3].map(k => R.ghost({ home: [k % 2 ? 6 : -6, (WALL9[k] + WALL9[k + 1]) / 2], look: 'wisp', tint: 0xff4a6a, sp: 2, radius: 5, b: [-9.6, 9.6, WALL9[k] + .4, WALL9[k + 1] - .4] }));
  },
  init(){ return { t: 0 }; },
  solve(){},
  tNow(st, R){ return R.local.t ?? st.t; },
  beat(st, R){ return Math.floor(this.tNow(st, R) / BEAT9); },
  gap(st, R, i, b = this.beat(st, R)){ return (b + i) % 2 ? null : GAP9[i][b % 3]; },
  colliders(st, R){ if (R.isOpen('exit')) return []; const out = []; WALL9.forEach((lz, i) => { const g = this.gap(st, R, i); if (g === null) out.push(R.rect(-10, lz - .3, 10, lz + .3)); else out.push(R.rect(-10, lz - .3, g - 1.4, lz + .3), R.rect(g + 1.4, lz - .3, 10, lz + .3)); }); return out; },
  host(dt, st, R, E){ const a = Math.floor(st.t / BEAT9); st.t += dt; if (Math.floor(st.t / BEAT9) !== a && !R.isOpen('exit')) E.ev('beat'); if (!R.isOpen('exit') && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 19)){ R.open('exit'); E.ev('door', 'Through all four chambers of the heart — the door opens!'); } },
  local(dt, st, R, E){ const L = R.local; L.t = (L.t === undefined || Math.abs(L.t - st.t) > .3) ? st.t : L.t + dt + (st.t - L.t) * .1; },
  visual(dt, t, st, R){ const b = this.beat(st, R), open = R.isOpen('exit'); WALL9.forEach((lz, i) => { const g = this.gap(st, R, i); const segs = open ? [] : g === null ? [[-10, 10]] : [[-10, g - 1.4], [g + 1.4, 10]]; this.w[i].forEach((m, k) => { const s = segs[k]; m.visible = !!s && s[1] > s[0]; if (m.visible){ m.scale.x = s[1] - s[0]; m.position.set((s[0] + s[1]) / 2, 1.3, R.Z(lz)); } }); const ng = this.gap(st, R, i, b + 1); this.mk[i].visible = !open && g === null && ng !== null; if (ng !== null) this.mk[i].position.set(ng, .05, R.Z(lz - .8)); }); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : 'Cross the heart\'s <b>five walls</b>. Each beat, every other wall opens a doorway — the <b>red marker</b> shows where the next one will appear.'; }
};

/* =============================================================== */
const CAN10 = [[-8, 4], [8, 4], [-8, 19], [8, 19]], CRATE10 = [[0, 1.6]];
const lord = {
  name: 'The Manor Lord',
  floor: heartF,
  dark: .45,
  notes: [[0, 1.4, '“I AM Hollow Manor. You cannot leave what you are standing inside.”', 1.4]],
  get hint(){ return 'Three stages. ① Freeze-bolt the four soul candles to drop his shield, then hit him with a Soul Blast. ② He turns invisible (hold ☀ for Ghost Sight to see him): stun him with a bomb blast (bombs at the entrance — he can\'t resist the hiss of a lit fuse and comes to look), then Soul Blast him while he\'s dazed. ③ He splits into three — your dream ECHOES pop the fakes (rewind into them); Soul Blast the real one. ' + blastTip().replace(/<[^>]+>/g, '') + '.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.cm = CAN10.map(([x, lz]) => { const g = new T.Group(); const c = new T.Mesh(new T.CylinderGeometry(.25, .25, 1.2, 10), E.mat(0xe8d8c8)); c.position.y = .6; g.add(c); const f = new T.Mesh(new T.ConeGeometry(.2, .5, 8), new T.MeshBasicMaterial({ color: 0xb87aff })); f.position.y = 1.45; g.add(f); g.userData.f = f; R.place(g, x, lz); return g; });
    this.boss = R.ghost({ home: [0, 14], look: 'crown', tint: 0x6a0a2a, scale: 2.4, sp: 0, flashImmune: true, label: 'the Manor Lord', gone: st => st.done, invisible: true, revealed: st => st.ph !== 1, think: (g, dt, st, R2, E2, P) => {
      if (g.mem.daze > 0){ g.mem.daze -= dt; return true; }
      const fz = st.ph === 1 && st.items.find(it => it.s === 0 && it.fuse > 0); if (fz){ E2.stepToward(g, fz.x, R2.Z(fz.lz), 3 * E2.GMULT, dt); return true; }
      let best = null, bd = 99; for (const p of E2.targetsOf(g, P)){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
      if (best) E2.stepToward(g, best.pos.x, best.pos.z, (1.8 + st.ph * .4) * E2.GMULT, dt);
      g.x = E2.clamp(g.x, -9, 9); g.z = E2.clamp(g.z, R2.Z(21), R2.Z(3));
      E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), 1.6); return true; } });
    this.boss.noStun = true;
    this.shield = new T.Mesh(new T.SphereGeometry(2.4, 20, 14), new T.MeshStandardMaterial({ color: 0xb87aff, emissive: 0x6a2aff, emissiveIntensity: .6, transparent: true, opacity: .3, depthWrite: false })); this.shield.position.y = 1.4; this.boss.mesh.add(this.shield);
    this.fakes = [0, 1].map(k => R.ghost({ home: [k ? 7 : -7, 12], look: 'crown', tint: 0x6a0a2a, scale: 2.4, sp: 2.2, radius: 20, flashImmune: true, label: 'a false Lord', gone: st => st.ph !== 2 || st.fake[k] || st.done }));
    this.fakes.forEach(f => { f.noStun = true; });
    this.minions = [0, 1, 2].map(k => R.ghost({ home: [k === 1 ? 9 : -9, k === 2 ? 3 : 20], look: ['hood', 'hat', 'wisp'][k], sp: 2.2, radius: 8, gone: st => st.ph <= k % 2 || st.done }));
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 3);
  },
  init(){ return { ph: 0, can: [0, 0, 0, 0], open: 0, fake: [0, 0], done: 0, cd: 0, items: [mkItem('bomb', -.4, 1.6, { n: 0 }), mkItem('bomb', .4, 1.6, { n: 1 })] }; },
  solve(st){ st.ph = 3; st.done = 1; },
  boltTargets(st, R){ return st.ph === 0 && !st.done ? CAN10.map(([x, lz], i) => st.can[i] ? null : [x, R.Z(lz), i, .9]).filter(Boolean) : []; },
  onBoltTarget(st, R, E, id){ st.can[id] = 1; const n = st.can.filter(Boolean).length; E.ev('zap', n < 4 ? `A soul candle gutters out (${n}/4)` : 'The last candle dies — his shield is DOWN! Soul Blast him!'); if (n >= 4) st.open = solo() ? 11 : 7; },
  onBomb(st, R, E, it){ if (st.ph !== 1) return; const b = this.boss; if (Math.hypot(b.x - it.x, b.z - R.Z(it.lz)) < 3.2){ b.mem.daze = solo() ? 9 : 6; st.open = b.mem.daze; E.ev('crash', 'The blast knocks the invisible Lord senseless — Soul Blast him NOW!'); } },
  hit(st, R, E){ st.ph++; st.open = 0; st.cd = 2; this.boss.mem.daze = 2.5;
    if (st.ph >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Manor Lord comes apart in a storm of light. Every ghost in Hollow Manor is free — and so are you. The front doors swing open!'); return; }
    E.ev('boom', st.ph === 1 ? 'The Soul Blast tears through him! (1/3) He fades from sight — he\'s INVISIBLE now. Ghost Sight!' : 'Another hit! (2/3) He splits into THREE Lords — only one is real. Your echoes can pop the fakes.'); if (st.ph === 2){ st.fake = [0, 0]; this.fakes.forEach((f, k) => { f.x = k ? 7 : -7; f.z = R.Z(12); }); } },
  onBlast(st, R, E, x, z){ if (st.done || st.cd > 0) return; const b = this.boss; if (Math.hypot(b.x - x, b.z - z) > 9){ return; } if (st.ph === 2 && st.fake.some(f => !f)){ E.ev('boo', 'The blast hits the Lords — but you can\'t tell which is real yet. Pop the fakes with your echoes!'); return; } if (st.open > 0 || st.ph === 2) this.hit(st, R, E); else E.ev('boo', st.ph === 0 ? 'The blast splashes off his shield — put out the soul candles first!' : 'He shrugs it off — daze him with a bomb blast first!'); },
  host(dt, st, R, E){
    if (st.done) return;
    st.cd = Math.max(0, st.cd - dt);
    if (st.open > 0){ st.open -= dt; if (st.open <= 0){ st.open = 0; if (st.ph === 0){ st.can = [0, 0, 0, 0]; E.ev('wrong', 'The soul candles flare back to life — his shield returns.'); } } }
    st.items.forEach(it => { if (it.s === 3){ it.rt = (it.rt || 0) + dt; if (it.rt > 2.5){ it.rt = 0; home(it); } } });
    if (st.ph === 2) E.echoes().forEach((e, i) => this.fakes.forEach((f, k) => { if (!st.fake[k] && Math.hypot(e[1] - f.x, e[2] - f.z) < 1.6){ st.fake[k] = 1; E.ev('crash', `Your echo walks into a Lord — it bursts like a soap bubble! ${st.fake.every(Boolean) ? 'Only the real one is left — Soul Blast him!' : ''}`); } }));
  },
  visual(dt, t, st, R, E){ this.cm.forEach((g, i) => g.userData.f.visible = !st.can[i] && st.ph === 0); this.shield.visible = st.ph === 0 && !(st.open > 0) && !st.done; this.shield.material.opacity = .25 + Math.sin(t * 3) * .05; setOrbs(this.orbs, st.ph); },
  objective(st, R, E){ if (st.done) return 'The Manor Lord is gone. Walk out of Hollow Manor — you\'re free!'; if (st.ph === 0) return st.open > 0 ? '<b>His shield is down — SOUL BLAST him!</b>' : `<b>Stage 1:</b> freeze-bolt the 4 soul candles in the corners to drop his shield, then Soul Blast. (${st.can.filter(Boolean).length}/4 candles)`; if (st.ph === 1) return st.open > 0 ? '<b>He\'s dazed — SOUL BLAST him!</b>' : '<b>Stage 2:</b> he\'s invisible (hold ☀ for Ghost Sight). Daze him with a <b>bomb</b> blast (bombs at the entrance — he comes to sniff a lit fuse), then Soul Blast.'; return st.fake.every(Boolean) ? '<b>Only the real Lord remains — SOUL BLAST him!</b>' : `<b>Stage 3:</b> three Lords! Your <b>dream echoes</b> (rewind) pop the fakes — then Soul Blast the real one. (${st.fake.filter(Boolean).length}/2 fakes)`; }
};

export default {
  level: 20,
  // texture pack in tex/level20/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'panel', tex: 'flesh_wall', w: 1.6, h: 2, y: 1.2, every: 6, glow: .15, color: 0x5a0a14, skip: 3 },   // wall dressing: living flesh (engine wallDecor)
  doorImg: 'manor_oak', wallImg: 'manor_wall', trimImg: 'manor_gold', texVer: 1,
  texFloors: {
    "The Grand Return": "return_checker",
    "The Heartbeat": "heartbeat_flesh",
    "The Gallery of Trials": "trials_parquet",
    "The Breathing Walls": "breathing_boards",
    "The Haunted Banquet": "banquet_carpet",
    "The Letters of HOLLOW": "letter_tiles",
    "The Ghost Choir": "choir_flags",
    "The Heart's Chambers": "heart_chamber",
    "The Manor Lord": "lord_marble",
    "The Lord's Sentinels": "study_oak"
  },
  title: 'The Heart of Hollow Manor',
  tagline: 'Twenty floors down, at the very heart of the house,<br>something has been waiting for you since the beginning.',
  story: 'The walls breathe. The floor has a pulse. Every power you have found was the manor testing you — and now its Lord will see if you are strong enough to leave.',
  winTitle: 'Hollow Manor is free! 🏚️✨',
  winSub: 'beat the Manor Lord and escaped all 20 floors of Hollow Manor. THE END — thank you for playing! 💜',
  feature: { name: 'Soul Blast', icon: '💥', how: 'Stand together and <b>both tap ☀ at the same moment</b>: a huge wave of light stuns every ghost nearby for a long time. <b>Solo:</b> rewind (R), then tap ☀ right next to your own dream echo.' },
  accent: '#ff6a8a',
  wallColor: 0x3a0a1a,
  trimColor: 0xd4af37,
  doorColor: 0x2a0a10,
  sky: 0xc85a7a,
  bg: 0x0a0204,
  drone: 29,
  rooms: [grand, heartbeat, trials, breathing, banquet, letters, choir, sentinels, maze, lord],
};
