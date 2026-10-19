// Level 19 — The Dream Realm. New power: REWIND (R, or double-tap ☀): jump back to where you were 3 seconds ago —
// and a DREAM ECHO of you replays those 3 seconds. Echoes press plates, block things, and fool nightmares.
// Enemies: Nightmares.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const cloudF = E => E.mat(0xffffff, { roughness: .8, map: E.tiledTex(128, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3a2a5a'); g.addColorStop(1, '#5a3a6a'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,220,255,.12)'; for (let i = 0; i < 12; i++){ x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 14, 0, 7); x.fill(); } x.fillStyle = '#ffffffaa'; for (let i = 0; i < 10; i++) x.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }, 5, 5) });
const voidMat = E => new E.THREE.MeshBasicMaterial({ color: 0x0a0618 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const rewTip = 'Press <b>R</b> (phone: double-tap ☀) to <b>rewind</b> 3 seconds — a dream echo replays what you undid';
const segL = (px, pl, x1, l1, x2, l2) => { const dx = x2 - x1, dl = l2 - l1, L2 = dx * dx + dl * dl || 1e-6, t = Math.max(0, Math.min(1, ((px - x1) * dx + (pl - l1) * dl) / L2)); return Math.hypot(px - x1 - dx * t, pl - l1 - dl * t); };
const shard = (E, col = 0xd8a8ff) => new E.THREE.Mesh(new E.THREE.OctahedronGeometry(.3), new E.THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .9, transparent: true, opacity: .9 }));

/* ---------- nightmares: chase dreamers — real ones AND echoes (an echo they touch pops) ---------- */
function nightmare(R, E, home, opt = {}){
  const g = R.ghost({ home, look: 'hood', tint: opt.tint || 0x1a0a2a, sp: 0, label: opt.label || 'a nightmare', b: opt.b, gone: opt.gone, scale: opt.scale || 1.1,
    think: (g, dt, st, R2, E2, P) => {
      const k = opt.time ? opt.time(st) : 1; if (k <= 0) return true;
      let best = null, bd = opt.radius || 30, isEcho = -1;
      for (const p of E2.targetsOf(g, P)){ if (!R2.inside(p.pos)) continue; const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = [p.pos.x, p.pos.z]; isEcho = -1; } }
      if (!opt.ignoreEchoes) E2.echoes().forEach((e, i) => { if (!R2.inside({ z: e[2] })) return; const d = Math.hypot(e[1] - g.x, e[2] - g.z); if (d < bd * 1.15){ bd = d; best = [e[1], e[2]]; isEcho = i; } });
      if (best) E2.stepToward(g, best[0], best[1], (typeof opt.sp === 'function' ? opt.sp(st) : (opt.sp || 2.6)) * E2.GMULT * k, dt);
      if (isEcho >= 0 && bd < .9 && E2.S.echoes[isEcho]){ E2.S.echoes.splice(isEcho, 1); E2.ev('boo', 'A nightmare swallowed a dream echo!'); }
      if (opt.onStep) opt.onStep(g, dt * k, st);
      E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), opt.touch || .95);
      return true;
    } });
  const T = E.THREE; for (let i = 0; i < 2; i++){ const eye = new T.Mesh(new T.SphereGeometry(.09, 8, 6), E.glow(0xff2a4a, 2)); eye.position.set(i ? .15 : -.15, 1.55, .35); g.mesh.add(eye); }
  return g;
}

/* =============================================================== */
const waking = {
  name: 'The Waking Door',
  floor: cloudF,
  notes: [[0, 1.6, '“The door only stays open while someone stands on the plate. Someone… or something like you.”', 1.5]],
  hint: 'Stand by the door. Walk to the plate (it\'s close) and wait there a moment. Now REWIND (R / double-tap ☀): you jump back to the door, and your dream echo walks the same path again — and stands on the plate for you. Walk through while it does.',
  build(R, E){
    EE = E;
    R.wall(-10, 11.6, -1.5, 12.4); R.wall(1.5, 11.6, 10, 12.4); R.door('d', -1.5, 11.6, 1.5, 12.4, 'gate');
    R.plate('p', -5.5, 9, 0xd8a8ff, 1.6, '☾');
  },
  init(){ return { done: 0 }; },
  solve(st, R){ st.done = 1; R.open('d'); },
  host(dt, st, R, E){ R.setDoor('d', st.done || R.on('p')); if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 13)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the waking door!'); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : `<b>NEW: Rewind!</b> ${rewTip}. The gate only opens while the ☾ plate is held — and everyone has to get through.`; }
};

/* =============================================================== */
const SYM2 = ['🌙', '⭐', '☁️', '🌀', '🦉', '🕯️'];
const ARCH2 = [-6, 0, 6];
const hallway = {
  name: 'The Endless Hallway',
  floor: cloudF,
  notes: [[0, 1.6, '“Have you been here before? You have. Look closer at the paintings.”', 1.5]],
  hint: 'Three archways, three paintings above them. Two paintings are the same — walk through the archway under the ODD one. The wrong archway loops you back to the start and the paintings change. Three right in a row and you wake up.',
  build(R, E){
    EE = E; const T = E.THREE;
    R.wall(-10, 18.6, -7.5, 19.4); R.wall(-4.5, 18.6, -1.5, 19.4); R.wall(1.5, 18.6, 4.5, 19.4); R.wall(7.5, 18.6, 10, 19.4);
    this.pics = ARCH2.map(x => { const fr = new T.Mesh(new T.BoxGeometry(2.2, 1.8, .1), E.mat(0xd4af37, { metalness: .7 })); R.place(fr, x, 18.5, 3.3); const m = textPlane(E, 1.8, 1.4, 1); R.place(m, x, 18.42, 3.3); m.rotation.y = Math.PI; return m; });
    this.n = [nightmare(R, E, [-8, 10], { sp: 2.1, b: [-9.6, 9.6, .6, 18.4] }), nightmare(R, E, [8, 6], { sp: 2.1, b: [-9.6, 9.6, .6, 18.4] })];
    this.orbs = orbRow(E, R, 3, -1.3, 2, 1.3, 2.4);
  },
  init(){ return { loop: 0, odd: 1, a: 0, b: 1, right: 0, cd: 0 }; },
  solve(st){ st.right = 3; },
  roll(st){ st.odd = Math.floor(Math.random() * 3); st.a = Math.floor(Math.random() * 6); st.b = (st.a + 1 + Math.floor(Math.random() * 5)) % 6; },
  host(dt, st, R, E){
    st.cd = Math.max(0, st.cd - dt);
    if (st.right >= 3){ R.open('exit'); return; }
    if (st.cd > 0) return;
    for (const p of E.P){ const lz = R.lz(p.pos.z); if (!R.inside(p.pos) || lz < 19.5 || lz > 21.8) continue; const arch = ARCH2.findIndex(x => Math.abs(p.pos.x - x) < 1.6); if (arch < 0) continue;
      st.cd = 1; if (arch === st.odd){ st.right++; E.ev('chime', st.right < 3 ? `Right! (${st.right}/3) …but the hallway goes on.` : 'You wake up — the hallway ends!', st.right); }
      else { st.right = 0; E.ev('boo', 'Wrong archway — you\'re back at the start of the hallway…'); }
      if (st.right < 3){ st.loop++; this.roll(st); for (const q of E.P){ if (!R.inside(q.pos)) continue; const sp = R.spawnW[q.idx]; E.teleport(q.idx, sp[0], sp[1]); } }
      else { R.open('exit'); for (const q of E.P){ if (R.inside(q.pos) && R.lz(q.pos.z) < 19.5){ E.teleport(q.idx, ARCH2[st.odd], R.Z(20.5)); } } }
      break; }
  },
  visual(dt, t, st){ const key = st.loop + ':' + st.odd + st.a + st.b; if (key !== this.k){ this.k = key; this.pics.forEach((m, i) => redraw(m, (c, W, H) => { c.fillStyle = '#2a1a3a'; c.fillRect(0, 0, W, H); c.font = '120px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(SYM2[i === st.odd ? st.b : st.a], W / 2, H / 2 + 8); })); } setOrbs(this.orbs, st.right); },
  objective(st, R, E){ return st.right >= 3 ? 'The way out is open!' : `Walk through the archway under the <b>odd painting</b>. Wrong archway = back to the start. Three right in a row! (${st.right}/3)`; }
};

/* =============================================================== */
const PAIR3 = [[[-6, 5], [3, 9]], [[7, 7], [-2, 14]], [[-7, 17], [4, 19.5]]];
const clocks = {
  name: 'The Twin Clocks',
  floor: cloudF,
  notes: [[0, 1.6, '“Each clock wants its twin pressed at the very same moment.”', 1.5]],
  get hint(){ return solo() ? 'Stand on one clock, walk to its twin (same colour) and wait on it — then rewind. You jump back to the first clock while your echo walks to the second. Both pressed at once!' : 'Each pair of matching clocks must be pressed at the same moment — one of you on each. (Your dream echo counts too.) Three pairs, in order.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    PAIR3.forEach((pr, k) => pr.forEach(([x, lz], j) => { R.plate('c' + k + j, x, lz, [0xff8ad8, 0x8ad8ff, 0xffd34a][k], 1.6, ['Ⅰ', 'Ⅱ', 'Ⅲ'][k]); const face = new T.Mesh(new T.CircleGeometry(.9, 20), E.mat(0xf2ead8)); face.rotation.x = -Math.PI / 2; R.place(face, x, lz, .14); }));
    this.hands = PAIR3.flat().map(([x, lz]) => { const h = new T.Mesh(new T.BoxGeometry(.06, .05, .8), E.mat(0x1a1a1a)); h.geometry.translate(0, 0, .35); R.place(h, x, lz, .17); return h; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { n: 0 }; },
  solve(st){ st.n = 3; },
  host(dt, st, R, E){
    if (st.n < 3 && R.on('c' + st.n + '0') && R.on('c' + st.n + '1')){ st.n++; E.ev('gong', st.n < 3 ? `The clocks strike together! (${st.n}/3)` : '', 60 + st.n * 5); }
    if (!R.isOpen('exit') && st.n >= 3){ R.open('exit'); E.ev('door', 'All the twin clocks agree — the door opens!'); }
    PAIR3.forEach((_, k) => [0, 1].forEach(j => R.glow('c' + k + j, k < st.n ? 1 : k === st.n ? undefined : 0)));
  },
  visual(dt, t, st){ this.hands.forEach((h, i) => h.rotation.y = -t * (1 + (i % 2) * .3)); setOrbs(this.orbs, st.n); },
  objective(st, R, E){ return st.n >= 3 ? 'The door is open!' : `Press both clocks marked <b>${['Ⅰ', 'Ⅱ', 'Ⅲ'][st.n]}</b> at the same moment. ${solo() ? 'Your rewind echo can hold one!' : 'One each — or use an echo.'} (${st.n}/3)`; }
};

/* =============================================================== */
const TOY4 = [[-8.5, 18], [8.5, 19], [8, 5], [-3, 12]];
const nursery = {
  name: 'The Nightmare Nursery',
  floor: cloudF,
  dark: .55,
  notes: [[0, 1.6, '“Nightmares can\'t tell a dreamer from a dream. Give them something to chase.”', 1.5]],
  hint: 'Nightmares go for the nearest dreamer — including your dream echoes. Walk away from a toy, rewind, and your echo marches off the other way: the nightmares follow it while you grab the toy. A flash scatters them for a moment.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.tm = TOY4.map(([x, lz], i) => { const m = i % 2 ? new T.Mesh(new T.TorusKnotGeometry(.22, .07, 40, 6), E.glow(0xff8ad8, .8)) : new T.Mesh(new T.BoxGeometry(.5, .5, .5), E.glow(0x8ad8ff, .7)); R.place(m, x, lz, .5); return m; });
    for (let i = 0; i < 3; i++){ const crib = new T.Mesh(new T.BoxGeometry(2, .8, 1.2), E.mat(0x6a5a8a)); R.place(crib, -6 + i * 6, 10, .4); R.block(-7 + i * 6, 9.4, -5 + i * 6, 10.6, .01, E.mat(0)); }
    this.n = [nightmare(R, E, [-6, 15]), nightmare(R, E, [6, 15]), nightmare(R, E, [0, 6], { sp: 2.3 })];
    this.orbs = orbRow(E, R, 4, -1.95, 21.4, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1, 1]; },
  host(dt, st, R, E){ TOY4.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A lost toy! (${st.got.filter(Boolean).length}/4)`); } }); if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'All four toys — the nursery falls quiet. The door opens!'); } },
  visual(dt, t, st){ this.tm.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.y += dt; }); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 4 lost toys. <b>Nightmares</b> chase the nearest dreamer — your <b>dream echoes</b> make perfect bait. (${st.got.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const VAULT5 = [-3.5, 11, 3.5, 18.5], GEM5 = [0, 17.2], PED5 = [-7, 4];
const heist = {
  name: 'The Dream Heist',
  floor: cloudF,
  notes: [[0, 1.6, '“The vault door blinks open now and then. Getting in is easy. Getting out…”', 1.5]],
  hint: 'The vault door opens for a moment every few seconds. Slip in, grab the dream gem, and REWIND before you\'re three seconds inside — you jump back outside the closed door, gem and all. Bring the gem to the pedestal.',
  build(R, E){
    EE = E; const T = E.THREE;
    const [a, b, c, d] = VAULT5; R.wall(a, b, a + .4, d); R.wall(c - .4, b, c, d); R.wall(a, d - .4, c, d); R.wall(a, b, -1.2, b + .4); R.wall(1.2, b, c, b + .4); R.door('v', -1.2, b, 1.2, b + .4, 'gate');
    const ped = new T.Mesh(new T.CylinderGeometry(.5, .6, 1, 12), E.mat(0xd8c8ff)); R.place(ped, PED5[0], PED5[1], .5);
    this.gemOn = shard(E, 0x8affd8); this.gemOn.scale.setScalar(1.5); this.gemOn.visible = false; R.place(this.gemOn, PED5[0], PED5[1], 1.4);
    this.n = [nightmare(R, E, [-1.5, 15], { sp: 1.8, b: [a + .5, c - .5, b + .5, d - .5] }), nightmare(R, E, [7, 15], { sp: 2.2 })];
    this.light = new T.Mesh(new T.BoxGeometry(2.4, .1, .1), E.glow(0x8affd8, 1)); R.place(this.light, 0, b - .3, 3);
  },
  init(){ return { t: 0, done: 0, items: [mkItem('gem', GEM5[0], GEM5[1])] }; },
  solve(st, R){ st.done = 1; R.open('v'); },
  itemMesh(k, E){ return k === 'gem' ? shard(E, 0x8affd8) : null; },
  carryTick(st, R, E, it, p){ if (near(R, p, PED5[0], PED5[1] + 1, 1.5)){ it.s = 3; st.done = 1; R.open('exit'); E.ev('door', 'The dream gem is yours — the door opens!'); } },
  host(dt, st, R, E){ st.t += dt; R.setDoor('v', st.done || (st.t % 6.5) > 5.3); },
  visual(dt, t, st){ this.gemOn.visible = !!st.done; const k = st.t % 6.5; this.light.material.emissiveIntensity = k > 4.6 ? 3 : .3; },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Steal the <b>dream gem</b> from the vault and set it on the pedestal. The vault door only blinks open — get out with a <b>rewind</b> (your gem comes too).'; }
};

/* =============================================================== */
const PC6 = [0, 11.5];
const penrose = {
  name: 'The Penrose Stairs',
  floor: cloudF,
  notes: [[0, 1.6, '“Every lap of these stairs goes UP. Every lap the other way goes down.”', 1.5]],
  hint: 'Walking round the stairs clockwise climbs a floor each lap; anticlockwise goes back down. Reach the 4th floor. The higher you go, the more nightmares join the climb — don\'t let them turn you round.',
  build(R, E){
    EE = E; const T = E.THREE;
    const pil = new T.Mesh(new T.CylinderGeometry(3, 3, 6, 24), E.mat(0x4a3a6a)); R.place(pil, PC6[0], PC6[1], 3); R.block(-2.6, 8.9, 2.6, 14.1, .01, E.mat(0));
    this.steps = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; const m = new T.Mesh(new T.BoxGeometry(2.6, .1 + i * .02, 1.2), E.mat(0x6a5a8a)); m.position.set(PC6[0] + Math.sin(a) * 5.5, .05 + i * .01, R.Z(PC6[1] + Math.cos(a) * 5.5)); m.rotation.y = a; E.scene.add(m); return m; });
    this.sign = textPlane(E, 2.4, 1.2, 1); R.place(this.sign, 0, 8.5, 2.5);
    this.n = [1, 2, 3].map(k => nightmare(R, E, [k === 2 ? 8 : -8, k === 3 ? 4 : 18], { gone: st => st.floor < k || st.done, sp: 2.3 }));
  },
  init(){ return { ang: [null, null], prog: 0, floor: 0, done: 0 }; },
  solve(st){ st.done = 1; st.floor = 4; },
  host(dt, st, R, E){
    if (st.done) return;
    for (const p of E.P){ const lz = R.lz(p.pos.z), d = Math.hypot(p.pos.x - PC6[0], lz - PC6[1]); if (!R.inside(p.pos) || d > 9.5 || d < 2.5){ st.ang[p.idx] = null; continue; } const a = Math.atan2(p.pos.x - PC6[0], lz - PC6[1]); const pa = st.ang[p.idx]; st.ang[p.idx] = a; if (pa === null) continue; let da = a - pa; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > 1) continue; st.prog += da / (Math.PI * 2) / Math.max(1, E.P.length); }
    const f = Math.max(0, Math.floor(st.prog + 1e-6)); if (f !== st.floor){ E.ev(f > st.floor ? 'chime' : 'boo', f > st.floor ? `Floor ${f}!` : `Down to floor ${f}…`, f); st.floor = f; }
    if (st.floor >= 4){ st.done = 1; R.open('exit'); E.ev('door', 'The 4th floor — a door appears at the top of the stairs!'); }
  },
  visual(dt, t, st){ if (this.lf !== st.floor){ this.lf = st.floor; redraw(this.sign, (c, W, H) => { c.fillStyle = '#1a0a2a'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8a8ff'; c.font = 'bold 64px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FLOOR ' + st.floor + ' / 4', W / 2, H / 2); }); } },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Climb the impossible stairs: every <b>clockwise lap</b> goes up a floor (anticlockwise goes down). Reach floor 4! (floor ${st.floor}, ${Math.round((st.prog - Math.floor(st.prog)) * 100)}% of the next lap)`; }
};

/* =============================================================== */
const STAR7 = [[-6, 6], [6, 15], [0, 11], [-7, 17], [7, 5], [2, 19], [-3, 3], [6, 10]];
const DELAY7 = 2.2;
const shadowSelf = {
  name: 'The Shadow Self',
  floor: cloudF,
  notes: [[0, 1.6, '“Something follows exactly where you walked, a couple of seconds behind. Don\'t let it catch up.”', 1.5]],
  hint: 'Your shadow self walks your exact path a couple of seconds behind you — touch it and you\'re frozen. Don\'t double back over your own tracks, and don\'t stand still for long (it catches up!). (And rewinding here jumps you right back into it…) Collect the stars as they appear.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.sm = [0, 1].map(() => { const c = E.makeChar(0x0a0410, true); c.bodyMat.opacity = .85; c.group.visible = false; return c; });
    this.star = shard(E, 0xffd34a); E.scene.add(this.star);
    this.orbs = orbRow(E, R, 8, -4.55, 21.4, 1.3, 2.4);
  },
  init(){ return { hist: [[], []], sh: [null, null], n: 0, t: 0 }; },
  solve(st){ st.n = 8; },
  host(dt, st, R, E){
    st.t += dt;
    for (const p of E.P){ const H = st.hist[p.idx]; if (!R.inside(p.pos) || p.frozen){ H.length = 0; st.sh[p.idx] = null; continue; } H.push([st.t, +p.pos.x.toFixed(2), +R.lz(p.pos.z).toFixed(2)]); while (H.length && H[0][0] < st.t - DELAY7 - .1) H.shift(); const old = H[0]; st.sh[p.idx] = old && old[0] <= st.t - DELAY7 + .05 ? [old[1], old[2]] : null; }
    if (st.n < 8){ for (const p of E.P){ if (p.frozen || !R.inside(p.pos)) continue; const lz = R.lz(p.pos.z); for (const s of st.sh) if (s && Math.hypot(s[0] - p.pos.x, s[1] - lz) < .8){ E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} was caught by a shadow self!`); st.hist = [[], []]; break; } } }
    if (st.n < 8){ const [x, lz] = STAR7[st.n]; if (E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.n++; E.ev('chime', st.n < 8 ? '' : '', st.n % 4); } }
    if (!R.isOpen('exit') && st.n >= 8){ R.open('exit'); E.ev('door', 'Eight stars — your shadow fades away. The door opens!'); }
  },
  visual(dt, t, st, R){ this.sm.forEach((c, i) => { const s = st.sh[i]; c.group.visible = !!s && st.n < 8; if (s){ const z = R.Z(s[1]); const dx = s[0] - c.group.position.x, dz = z - c.group.position.z; if (Math.hypot(dx, dz) > .01) c.group.rotation.y = Math.atan2(dx, dz); c.group.position.set(s[0], 0, z); } }); this.star.visible = st.n < 8; if (st.n < 8){ const [x, lz] = STAR7[st.n]; this.star.position.set(x, .7 + Math.sin(t * 3) * .15, R.Z(lz)); this.star.rotation.y += dt * 2; } setOrbs(this.orbs, st.n); },
  objective(st, R, E){ return st.n >= 8 ? 'The door is open!' : `Collect the stars one by one. Your <b>shadow self</b> walks your exact path ${DELAY7} seconds behind — never cross your own tracks! (${st.n}/8)`; }
};

/* =============================================================== */
const ARM8 = [[-5, 7, 3.5, .9], [5, 7, 3.5, -1.1], [0, 13, 4.2, .8], [-5, 18, 3.5, -1], [5, 18, 3.5, 1.2]];
const VIAL8 = [[-9, 7], [9, 13], [0, 20.5]];
const hourglass = {
  name: 'The Hourglass',
  floor: cloudF,
  notes: [[0, 1.6, '“In this dream, time only passes when you move.”', 1.5]],
  hint: 'Nothing here moves unless one of you is moving — stand still and the scythes and nightmares (almost) freeze. Step, stop, look, step. Collect the three sand vials.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.arms = ARM8.map(([x, lz, len]) => { const g = new T.Group(); const hub = new T.Mesh(new T.CylinderGeometry(.4, .4, .6, 12), E.mat(0x4a3a6a)); hub.position.y = .3; g.add(hub); const bar = new T.Mesh(new T.BoxGeometry(.18, .18, len), E.mat(0xcfcfd8, { metalness: .9 })); bar.position.set(0, .6, len / 2); g.add(bar); R.place(g, x, lz); R.block(x - .4, lz - .4, x + .4, lz + .4, .01, E.mat(0)); return g; });
    this.vm = VIAL8.map(([x, lz]) => { const m = new T.Mesh(new T.CylinderGeometry(.18, .18, .5, 10), new T.MeshStandardMaterial({ color: 0xe8c888, emissive: 0x8a6a2a, transparent: true, opacity: .85 })); R.place(m, x, lz, .5); return m; });
    this.n = [nightmare(R, E, [-7, 11], { time: st => st.k, sp: 3 }), nightmare(R, E, [7, 19], { time: st => st.k, sp: 3 })];
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { tm: 0, k: 0, got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  host(dt, st, R, E){
    st.k = E.P.some(p => p.moving && !p.frozen && R.inside(p.pos)) ? 1 : .04; st.tm += dt * st.k;
    for (const p of E.P){ if (p.frozen || p.dashing || !R.inside(p.pos)) continue; const lz = R.lz(p.pos.z); ARM8.forEach(([x, l, len, w]) => { const a = st.tm * w; if (segL(p.pos.x, lz, x, l, x + Math.sin(a) * len, l + Math.cos(a) * len) < .5) E.freeze(p.idx, E.FREEZE, `A dream scythe swept ${E.names()[p.idx]} off their feet!`); }); }
    VIAL8.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A vial of dream sand! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three vials — the hourglass turns and the door opens!'); }
  },
  visual(dt, t, st, R){ this.arms.forEach((g, i) => { const a = st.tm * ARM8[i][3]; g.rotation.y = Math.atan2(Math.sin(a), -Math.cos(a)); }); this.vm.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 sand vials. <b>Time only moves while you move</b> — stop to think! (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const PLAT9 = [-8, 3, 8, 19], BED9 = [[-2, 17.5], [6.5, 11]], START9 = [[-6, 4.5, 0], [3, 4.5, 0]];
const DIR9 = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const sleep = {
  name: 'The Sleepwalkers',
  floor: cloudF,
  notes: [[0, 1.6, '“Don\'t wake a sleepwalker. Just… stand in the way.”', 1.5]],
  get hint(){ return 'The sleepwalkers walk straight ahead and turn RIGHT whenever something is in front of them — a wall, you, ' + (solo() ? 'or your dream echo' : 'your partner or an echo') + '. If one walks off the edge it wakes up screaming and both start over. Stand in their way to steer each of them into a bed.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    R.floor(-10, .6, 10, 21.4, voidMat(E), .015); R.floor(PLAT9[0], PLAT9[1], PLAT9[2], PLAT9[3], cloudF(E), .03); R.floor(-1.5, 0, 1.5, 3, cloudF(E), .03); R.floor(-1.5, 19, 1.5, 22, cloudF(E), .03);
    BED9.forEach(([x, lz]) => { const b = new T.Mesh(new T.BoxGeometry(1.6, .5, 2.2), E.mat(0xd8c8ff)); R.place(b, x, lz, .25); const pil = new T.Mesh(new T.BoxGeometry(1.2, .25, .5), E.mat(0xffffff)); R.place(pil, x, lz + .7, .55); });
    this.sw = START9.map(() => { const c = E.makeChar(0xbfbfff, true); c.bodyMat.emissive = new T.Color(0x6a6aff); c.bodyMat.emissiveIntensity = .4; const cap = new T.Mesh(new T.ConeGeometry(.3, .6, 8), E.mat(0x6a6aff)); cap.position.y = 1.3; c.rig.add(cap); return c; });
  },
  init(){ return { w: START9.map(([x, lz, d]) => [x, lz, d, 0]), done: 0 }; },
  solve(st){ st.done = 1; st.w.forEach((w, i) => { w[0] = BED9[i][0]; w[1] = BED9[i][1]; w[3] = 1; }); },
  pits(st, R){ return st.done ? [] : [R.rect(-10.5, .6, 10.5, 21.4)]; },
  bridges(st, R){ return [R.rect(PLAT9[0], PLAT9[1], PLAT9[2], PLAT9[3]), R.rect(-1.5, 0, 1.5, 3.2), R.rect(-1.5, 18.8, 1.5, 22)]; },
  host(dt, st, R, E){
    if (st.done) return;
    const bodies = [...E.P.filter(p => R.inside(p.pos)).map(p => [p.pos.x, R.lz(p.pos.z)]), ...E.echoes().map(e => [e[1], R.lz(e[2])])];
    st.w.forEach((w, i) => {
      if (w[3]) return;
      const [dx, dl] = DIR9[w[2]];
      const blocked = bodies.some(([bx, bl]) => { const ax = (bx - w[0]) * dx + (bl - w[1]) * dl, lat = Math.abs((bx - w[0]) * dl - (bl - w[1]) * dx); return ax > .2 && ax < 1.3 && lat < .8; }) || st.w.some((o, j) => j !== i && Math.hypot(o[0] - w[0] - dx * .9, o[1] - w[1] - dl * .9) < .7);
      if (blocked){ w[2] = (w[2] + 1) % 4; return; }
      w[0] = +(w[0] + dx * 1.5 * dt).toFixed(3); w[1] = +(w[1] + dl * 1.5 * dt).toFixed(3);
      const bi = BED9.findIndex(([x, lz]) => Math.hypot(x - w[0], lz - w[1]) < .7); if (bi >= 0){ w[3] = 1; w[0] = BED9[bi][0]; w[1] = BED9[bi][1]; E.ev('chime', 'A sleepwalker tucks itself into bed. Zzz…'); return; }
      if (w[0] < PLAT9[0] || w[0] > PLAT9[2] || w[1] < PLAT9[1] || w[1] > PLAT9[3]){ E.ev('boo', 'AAAH! A sleepwalker stepped off the edge and woke up — they both go back to the start!'); for (const p of E.P) if (!p.frozen && R.inside(p.pos) && Math.hypot(p.pos.x - w[0], R.lz(p.pos.z) - w[1]) < 6) E.freeze(p.idx, 2, ''); st.w = START9.map(([x, lz, d]) => [x, lz, d, 0]); }
    });
    if (st.w.every(w => w[3])){ st.done = 1; R.open('exit'); E.ev('door', 'Both sleepwalkers are tucked in — the door opens!'); }
  },
  visual(dt, t, st, R, E){ this.sw.forEach((c, i) => { const w = st.w[i]; c.group.position.set(w[0], w[3] ? .5 : 0, R.Z(w[1])); c.group.rotation.y = Math.atan2(DIR9[w[2]][0], -DIR9[w[2]][1]); c.group.rotation.z = w[3] ? Math.PI / 2 : 0; c.rig.position.y = w[3] ? 0 : Math.abs(Math.sin(t * 6 + i)) * .08; }); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Steer both <b>sleepwalkers</b> into the beds at the top. They turn right when something blocks them — stand in their way. Off the edge and they wake up! (${st.w.filter(w => w[3]).length}/2)`; }
};

/* =============================================================== */
const king = {
  name: 'The Nightmare King',
  floor: cloudF,
  dark: .5,
  notes: [[0, 1.4, '“He sees every dreamer — except the ones that already happened.”', 1.4]],
  hint: 'The Nightmare King can\'t see dream echoes — and an echo walking into him hurts him. Run straight at him, then REWIND just before he catches you: your echo keeps charging and slams into him. Three hits. (Rewind needs 10 seconds to recharge.)',
  build(R, E){
    EE = E;
    this.boss = nightmare(R, E, [0, 16], { scale: 2, label: 'the Nightmare King', sp: st => st.stun > 0 ? 0 : 2.4 + st.hits * .35, ignoreEchoes: true, touch: 1.3, gone: st => st.done, tint: 0x2a0a3a });
    this.minions = [0, 1].map(k => nightmare(R, E, [k ? 8 : -8, 20], { gone: st => st.hits <= k || st.done, sp: 2.2 }));
    const T = E.THREE; this.crown = new T.Mesh(new T.CylinderGeometry(.5, .6, .4, 6, 1, true), E.mat(0xd4af37, { metalness: .9, side: T.DoubleSide })); this.crown.position.y = 2.1; this.boss.mesh.add(this.crown);
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 3);
  },
  init(){ return { hits: 0, stun: 0, cd: 0, done: 0 }; },
  solve(st){ st.hits = 3; st.done = 1; },
  host(dt, st, R, E){
    if (st.done) return;
    st.stun = Math.max(0, st.stun - dt); st.cd = Math.max(0, st.cd - dt);
    const b = this.boss;
    if (st.cd <= 0){ const i = E.echoes().findIndex(e => Math.hypot(e[1] - b.x, e[2] - b.z) < 1.5); if (i >= 0){ E.S.echoes.splice(i, 1); st.hits++; st.cd = 2; st.stun = 2.5; E.ev('boom', st.hits < 3 ? `Your dream echo crashes into the Nightmare King! (${st.hits}/3)` : ''); if (st.hits >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Nightmare King shatters like a bad dream at sunrise. Wake up — the door is open!'); } } }
  },
  visual(dt, t, st){ this.crown.rotation.y += dt; setOrbs(this.orbs, st.hits); },
  objective(st, R, E){ return st.done ? 'Morning has come — wake up!' : `The <b>Nightmare King</b> can't see dream echoes — and they hurt him. Charge at him, then <b>rewind</b> so your echo finishes the charge! (${st.hits}/3)`; }
};

export default {
  level: 19,
  title: 'The Dream Realm',
  tagline: 'You fell asleep in the manor.<br>The manor did not let you wake up.',
  story: 'Floating halls, impossible stairs, clocks that disagree. Here time is soft — you can take back the last few seconds. But the nightmares are learning to follow.',
  winTitle: 'Wide awake! 🌙',
  feature: { name: 'Rewind', icon: '⏪', how: 'Press <b>R</b> (phone: <b>double-tap ☀</b>) to jump back to where you were <b>3 seconds ago</b>. A glowing <b>dream echo</b> then replays those 3 seconds — it presses plates, blocks things and fools nightmares. Recharges in 10 s.' },
  accent: '#d8a8ff',
  wallColor: 0x3a2a5a,
  trimColor: 0xd8a8ff,
  doorColor: 0x2a1a4a,
  sky: 0x8a6ac8,
  bg: 0x0a0618,
  drone: 47,
  rooms: [waking, hallway, clocks, nursery, heist, penrose, shadowSelf, hourglass, sleep, king],
};
