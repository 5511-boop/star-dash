// Level 17 — The Abyssal Depths. New power: SHADOW STEP — stand right behind your partner's back (or in a deep shadow) and nothing can see you.
// Enemies: Anglerfish (their lures pull you in), Currents, and everything else that lives down here.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const seabed = E => E.mat(0xffffff, { roughness: .95, map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#123040'; x.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++){ x.fillStyle = ['#0e2836', '#1a4050', '#2a5060', '#0a1a24'][i % 4]; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 0, 7); x.fill(); } }, 6, 6) });
const rockMat = E => E.mat(0x1a2a34, { roughness: 1 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const segL = (px, pl, x1, l1, x2, l2) => { const dx = x2 - x1, dl = l2 - l1, L2 = dx * dx + dl * dl || 1e-6, t = Math.max(0, Math.min(1, ((px - x1) * dx + (pl - l1) * dl) / L2)); return Math.hypot(px - x1 - dx * t, pl - l1 - dl * t); };
const shadowTip = () => solo() ? 'Stand in the deep shadows (dark patches) to hide.' : 'Stand right behind your partner\'s back — or in a deep shadow — to hide.';
function shadeMeshes(E, R, list){ const T = E.THREE; return list.map(([a, b, c, d]) => { const m = new T.Mesh(new T.PlaneGeometry(c - a, d - b), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .55, depthWrite: false })); m.rotation.x = -Math.PI / 2; R.place(m, (a + c) / 2, (b + d) / 2, .03); const rk = new T.Mesh(new T.BoxGeometry(c - a, .25, .5), rockMat(E)); R.place(rk, (a + c) / 2, d, 2.4); return m; }); }
const shadeRects = (R, list) => list.map(([a, b, c, d]) => R.rect(a, b, c, d));
const pick = (R, E, st, list, key, label, n) => list.forEach(([x, lz], i) => { if (!st[key][i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st[key][i] = 1; E.ev('pick', `${label} (${st[key].filter(Boolean).length}/${n})`); } });
const pearlMesh = (E, col = 0xf0f0ff) => new E.THREE.Mesh(new E.THREE.SphereGeometry(.28, 12, 10), new E.THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .6, metalness: .3, roughness: .1 }));
const bubbles = (E, R, n, x, lz, spread = 1) => Array.from({ length: n }, () => { const m = new E.THREE.Mesh(new E.THREE.SphereGeometry(.06 + Math.random() * .06, 6, 4), new E.THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .6 })); m.userData = { x: x + (Math.random() - .5) * spread, z: R.Z(lz + (Math.random() - .5) * spread), y: Math.random() * 3, s: .5 + Math.random() }; E.scene.add(m); return m; });
const riseBubbles = (bs, dt) => bs.forEach(m => { const u = m.userData; u.y += dt * u.s; if (u.y > 3) u.y = 0; m.position.set(u.x + Math.sin(u.y * 3) * .1, u.y, u.z); });

/* =============================================================== */
const SH1 = [[-9.5, 6, -5, 9], [-2, 10.5, 2.5, 13.5], [5, 14.5, 9.5, 17.5], [-6, 17, -2, 19.5]];
const bell = {
  name: 'The Diving Bell',
  floor: seabed,
  dark: .8,
  notes: [[0, 1.6, '“Down here, the trick is not to be seen.”', 1.5]],
  get hint(){ return solo() ? 'The lantern eels freeze anything their light touches — unless it\'s hiding. Step into the deep shadows under the rock ledges while the eels pass.' : 'The lantern eels freeze anything their light touches — unless it\'s hiding. Stand RIGHT behind your partner (at their back) and you\'re invisible. The deep shadows under the rock ledges hide you too.'; },
  build(R, E){
    EE = E; this.sm = shadeMeshes(E, R, SH1);
    E.AI && [[[-8, 4], [8, 4], [8, 10], [-8, 10]], [[8, 13], [-8, 13], [-8, 19.5], [8, 19.5]]].forEach((pts, k) => R.ghost({ home: pts[0], look: 'wisp', tint: 0x2a6a5a, sp: 0, flashImmune: true, label: 'a lantern eel', cone: { len: 6, ang: .55, color: 0x6affd8 }, think: E.AI.patrol(pts, 2.2 + k * .3, { cone: { len: 6, ang: .55 } }) }));
    this.bb = bubbles(E, R, 20, 0, 1.5, 3);
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  shadows(st, R){ return shadeRects(R, SH1); },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.2)){ st.done = 1; R.open('exit'); E.ev('door', 'Past the eels — the door opens!'); } },
  visual(dt){ riseBubbles(this.bb, dt); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `<b>NEW: Shadow Step!</b> ${shadowTip()} The lantern eels can't freeze what they can't see.`; }
};

/* =============================================================== */
const CUR2 = [[-10, 4.5, 10, 7, -3.2, 0], [-10, 10, 10, 12.5, 3.2, 0], [-10, 15.5, 10, 18, -3.2, 0]];
const KELP2 = [[-9, 7.4, -6, 9.6], [-1.5, 7.4, 1.5, 9.6], [6, 12.9, 9, 15.1], [-4, 12.9, -1, 15.1], [3, 18.4, 6.5, 20.6]];
const PRL2 = [[8.5, 5.5], [-8.5, 11], [0, 17]];
const kelp = {
  name: 'The Kelp Forest',
  floor: seabed,
  dark: .75,
  notes: [[3, 1.4, '“The currents will carry you whether you like it or not. The kelp will hide you.”', 1.5]],
  hint: 'The three bands of glittering water are currents: they shove you sideways (left, right, left). The kelp thickets between them are shadows — the hunting eels can\'t see you in there. Grab the three pearls.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.sm = shadeMeshes(E, R, KELP2);
    KELP2.forEach(([a, b, c, d]) => { for (let i = 0; i < 6; i++){ const k = new T.Mesh(new T.CylinderGeometry(.05, .08, 2.6 + Math.random(), 4), E.mat(0x2a6a2a)); R.place(k, a + Math.random() * (c - a), b + Math.random() * (d - b), 1.3); } });
    this.parts = CUR2.map(([a, b, c, d]) => Array.from({ length: 16 }, () => { const m = new T.Mesh(new T.SphereGeometry(.05, 4, 3), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .7 })); m.userData = { u: Math.random(), v: Math.random() }; E.scene.add(m); return m; }));
    this.pm = PRL2.map(([x, lz]) => { const m = pearlMesh(E); R.place(m, x, lz, .4); return m; });
    R.ghost({ home: [0, 9], look: 'wisp', tint: 0x2a6a5a, sp: 2.6, radius: 8, label: 'a hunting eel' }); R.ghost({ home: [0, 15], look: 'wisp', tint: 0x2a6a5a, sp: 2.4, radius: 8, label: 'a hunting eel' });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  shadows(st, R){ return shadeRects(R, KELP2); },
  push(st, R, E, pos){ const lz = R.lz(pos.z), c = CUR2.find(([a, b, cc, d]) => pos.x > a && pos.x < cc && lz > b && lz < d); return c ? [c[4], -c[5]] : null; },
  host(dt, st, R, E){ pick(R, E, st, PRL2, 'got', 'A pearl!', 3); if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three pearls — the door opens!'); } },
  visual(dt, t, st, R){ this.parts.forEach((ps, k) => { const [a, b, c, d, dx] = CUR2[k]; ps.forEach(m => { const u = m.userData; u.u = (u.u + dt * .2 * Math.sign(dx) + 1) % 1; m.position.set(a + (c - a) * u.u, .5 + Math.sin(t * 2 + u.v * 9) * .3, R.Z(b + (d - b) * u.v)); }); }); this.pm.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 pearls. <b>Currents</b> push you sideways; the <b>kelp</b> hides you from the eels. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const FISH3 = [[-5, 12, 0], [5.5, 17, Math.PI], [4, 6.5, -Math.PI / 2]];
const EGG3 = [[-8.5, 12.5], [8.5, 19], [8.5, 4.5]];
const SH3 = [[-3, 3, 0, 5], [1, 10, 4, 12.5], [-9.5, 16, -6, 19], [-1, 18.5, 2, 21]];
const lure = (f, R) => [f[0] + Math.sin(f[2]) * 2.2, f[1] - Math.cos(f[2]) * 2.2 * -1];
const angler = {
  name: 'The Anglerfish Lair',
  floor: seabed,
  dark: .93,
  notes: [[3, 1.4, '“Don\'t look at the pretty light. Definitely don\'t follow it.”', 1.5]],
  get hint(){ return 'Each anglerfish dangles a glowing lure. If it can see you, the lure drags you towards its jaws — fight it, or hide (' + (solo() ? 'deep shadows' : 'your partner\'s back, or deep shadows') + ') and the pull stops. The eggs are right beside them.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.sm = shadeMeshes(E, R, SH3);
    this.fish = FISH3.map(([x, lz, a]) => { const g = new T.Group(); const body = new T.Mesh(new T.SphereGeometry(1.2, 14, 10), E.mat(0x1a1a24)); body.scale.set(1, .8, 1.3); body.position.y = 1; g.add(body); for (let k = 0; k < 8; k++){ const tooth = new T.Mesh(new T.ConeGeometry(.08, .35, 4), E.mat(0xe8e8e8)); tooth.position.set(-.6 + k * .17, .75, 1.3); tooth.rotation.x = Math.PI; g.add(tooth); } const rod = new T.Mesh(new T.CylinderGeometry(.03, .03, 2.4, 4), E.mat(0x1a1a24)); rod.position.set(0, 2.2, 1.2); rod.rotation.x = .9; g.add(rod); const bulb = new T.Mesh(new T.SphereGeometry(.25, 10, 8), E.glow(0x9affd8, 2.5)); bulb.position.set(0, 2.5, 2.2); g.add(bulb); const l = new T.PointLight(0x9affd8, 4, 7, 1.4); l.position.copy(bulb.position); g.add(l); g.rotation.y = a; R.place(g, x, lz); R.block(x - 1, lz - 1, x + 1, lz + 1, .01, E.mat(0)); g.userData.bulb = bulb; return g; });
    this.em = EGG3.map(([x, lz]) => { const m = pearlMesh(E, 0xffb36b); m.scale.set(1, 1.3, 1); R.place(m, x, lz, .4); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  shadows(st, R){ return shadeRects(R, SH3); },
  jaws(i){ const [x, lz, a] = FISH3[i]; return [x + Math.sin(a) * 1.6, lz - Math.cos(a) * 1.6]; },
  push(st, R, E, pos){ if (E.me.hiddenL) return null; const lz = R.lz(pos.z); let vx = 0, vl = 0; FISH3.forEach((f, i) => { const [jx, jl] = this.jaws(i), dx = jx - pos.x, dl = jl - lz, d = Math.hypot(dx, dl); if (d < 7 && d > .3){ const k = 4.4 * (1 - d / 9); vx += dx / d * k; vl += dl / d * k; } }); return vx || vl ? [vx, -vl] : null; },
  host(dt, st, R, E){
    for (const p of E.P){ if (p.frozen || p.hidden || !R.inside(p.pos)) continue; FISH3.forEach((f, i) => { const [jx, jl] = this.jaws(i); if (Math.hypot(p.pos.x - jx, R.lz(p.pos.z) - jl) < 1.3){ E.freeze(p.idx, E.FREEZE, `CHOMP! An anglerfish got ${E.names()[p.idx]}!`); } }); }
    pick(R, E, st, EGG3, 'got', 'A glowing egg!', 3);
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three eggs — the door opens!'); }
  },
  visual(dt, t, st){ this.fish.forEach((g, i) => { g.userData.bulb.position.y = 2.5 + Math.sin(t * 2 + i) * .15; }); this.em.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Steal the 3 glowing eggs. <b>Anglerfish lures</b> drag in anyone they can see — <b>hide</b> to break free. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const JF4 = Array.from({ length: 9 }, (_, i) => ({ cx: -6 + (i % 3) * 6, cl: 6 + Math.floor(i / 3) * 5.5, rx: 2.4 + (i % 2), rl: 1.6 + (i % 3) * .4, w: .35 + (i % 4) * .08, ph: i * 1.3 }));
const jfPos = (j, t) => [j.cx + Math.sin(t * j.w + j.ph) * j.rx, j.cl + Math.cos(t * j.w * 1.3 + j.ph) * j.rl];
const STAR4 = [[-9, 13], [9, 8], [0, 20.5]];
const jelly = {
  name: 'The Jellyfish Bloom',
  floor: seabed,
  dark: .85,
  notes: [[0, 1.6, '“Jellyfish have no eyes. Hiding won\'t help you here.”', 1.5]],
  hint: 'The jellyfish drift in slow loops and sting anything they bump into — they\'re blind, so hiding is useless. A freeze bolt stops one in place for a few seconds (and frozen ones don\'t sting). Collect the three starfish.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.jm = JF4.map((_, i) => { const g = new T.Group(); const bell = new T.Mesh(new T.SphereGeometry(.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: [0xff8ad8, 0x8ad8ff, 0xd8ff8a][i % 3], emissive: [0xff4aa8, 0x4aa8ff, 0xa8ff4a][i % 3], emissiveIntensity: .6, transparent: true, opacity: .7 })); bell.position.y = 1.4; g.add(bell); const ten = []; for (let k = 0; k < 6; k++){ const tt = new T.Mesh(new T.CylinderGeometry(.02, .02, 1.2, 3), bell.material); tt.position.set(Math.cos(k) * .35, .8, Math.sin(k) * .35); g.add(tt); ten.push(tt); } const ice = new T.Mesh(new T.SphereGeometry(.8, 10, 8), new T.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: .4 })); ice.position.y = 1.2; ice.visible = false; g.add(ice); g.userData = { ten, ice }; E.scene.add(g); return g; });
    this.sm = STAR4.map(([x, lz]) => { const m = new T.Mesh(new T.CylinderGeometry(.4, .4, .08, 5), E.glow(0xffa04a, .7)); R.place(m, x, lz, .1); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { t: 0, fz: JF4.map(() => 0), ft: JF4.map(() => 0), got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  pos(st, i){ return jfPos(JF4[i], st.ft[i]); },
  boltTargets(st, R){ return JF4.map((j, i) => { const [x, lz] = this.pos(st, i); return st.fz[i] > 0 ? null : [x, R.Z(lz), i, .9]; }).filter(Boolean); },
  onBoltTarget(st, R, E, id){ st.fz[id] = 6; E.ev('zap', 'A jellyfish freezes solid!'); },
  host(dt, st, R, E){
    st.t += dt; JF4.forEach((j, i) => { if (st.fz[i] > 0) st.fz[i] = Math.max(0, st.fz[i] - dt); else st.ft[i] += dt * E.GMULT; });
    for (const p of E.P){ if (p.frozen || p.dashing || !R.inside(p.pos)) continue; JF4.forEach((j, i) => { if (st.fz[i] > 0) return; const [x, lz] = this.pos(st, i); if (Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < .95) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} was stung by a jellyfish!`); }); }
    pick(R, E, st, STAR4, 'got', 'A starfish!', 3);
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three starfish — the door opens!'); }
  },
  visual(dt, t, st, R){ this.jm.forEach((g, i) => { const [x, lz] = this.pos(st, i); g.position.set(x, Math.sin(t * 2 + i) * .15, R.Z(lz)); g.userData.ice.visible = st.fz[i] > 0; g.userData.ten.forEach((tt, k) => tt.rotation.z = Math.sin(t * 3 + k + i) * .3); }); this.sm.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 starfish. <b>Jellyfish</b> are blind (hiding won't help) and sting on touch — <b>freeze bolts</b> stop them for a few seconds. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const AIR5 = [[-1.5, 0, 1.5, 2.5], [-9.5, 9, -6.5, 12], [6.5, 11.5, 9.5, 13.8], [-3, 17.4, 0, 19.8]];
const HULL5 = [[-10, 6, -2, 6.6], [2, 6, 10, 6.6], [-6, 6.6, -5.4, 14], [-10, 14, -2.5, 14.6], [2, 14, 10, 14.6], [4.5, 6.6, 5.1, 11], [-1, 16.5, 10, 17.1]];
const WHEEL5 = [[0, 5.2, 'd0'], [0, 13.2, 'd1']];
const O2RATE = 1 / 17;
const galleon = {
  name: 'The Sunken Galleon',
  floor: E => E.mat(0x3a2a1a, { roughness: .95 }),
  dark: .82,
  notes: [[3, 1.4, '“No air down here. Breathe at the bubbles, or swim back to the bell.”', 1.5]],
  hint: 'Your air (bar) drains while you\'re out of the bubbles; run out and you\'re hauled back up to the start. Hold still on a valve wheel to open the hatch past it. Fetch the captain\'s key from the stern and open the treasure chest. Morays lurk in the holes in the hull — hide from them!',
  build(R, E){
    EE = E; const T = E.THREE;
    HULL5.forEach(([a, b, c, d]) => R.block(a, b, c, d, 2.6, E.mat(0x4a3420)));
    R.door('d0', -2, 5.9, 2, 6.7, 'gate'); R.door('d1', -2.5, 13.9, 2, 14.7, 'gate');
    WHEEL5.forEach(([x, lz, n], i) => R.plate('w' + i, x, lz, 0xd4af37, 1.2, '⎈'));
    this.bb = AIR5.flatMap(([a, b, c, d]) => bubbles(E, R, 10, (a + c) / 2, (b + d) / 2, Math.min(c - a, d - b)));
    AIR5.forEach(([a, b, c, d]) => { const m = new T.Mesh(new T.CylinderGeometry(Math.min(c - a, d - b) / 2, Math.min(c - a, d - b) / 2, .05, 16), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .25 })); R.place(m, (a + c) / 2, (b + d) / 2, .03); });
    const chest = new T.Mesh(new T.BoxGeometry(1.6, 1, 1), E.mat(0x6a4a1a)); R.place(chest, 6, 20, .5); R.block(5.2, 19.5, 6.8, 20.5, .01, E.mat(0));
    [[-9.6, 4, Math.PI / 2], [9.6, 10, -Math.PI / 2], [-9.6, 16, Math.PI / 2]].forEach(([x, lz]) => R.ghost({ home: [x + (x < 0 ? .6 : -.6), lz], look: 'wisp', tint: 0x4a5a2a, sp: 0, label: 'a moray eel', think: E.AI.lunger(4, 11, 1.6) }));
  },
  init(){ return { done: 0, pr: [0, 0], items: [mkItem('key', -7.5, 18.5)] }; },
  solve(st, R){ st.done = 1; R.open('d0'); R.open('d1'); },
  itemMesh(k, E){ return k === 'key' ? new E.THREE.Mesh(new E.THREE.TorusGeometry(.2, .06, 6, 12), E.mat(0xd4af37, { metalness: .9, emissive: 0x6a5010 })) : null; },
  carryTick(st, R, E, it, p){ if (near(R, p, 6, 19.2, 1.4)){ it.s = 3; st.done = 1; R.open('exit'); E.ev('door', 'The chest bursts open — gold everywhere! The door opens.'); } },
  host(dt, st, R, E){ WHEEL5.forEach(([x, lz, n], i) => { if (R.isOpen(n)) return; if (E.P.some(p => !p.frozen && R.at('w' + i, p.pos))){ st.pr[i] += dt; if (st.pr[i] > 1.5){ R.open(n); E.ev('door', 'The hatch creaks open!'); } } else st.pr[i] = 0; }); },
  local(dt, st, R, E){
    const L = R.local; if (L.o2 === undefined) L.o2 = 1;
    if (!R.inside(E.me.pos) || E.phase !== 'play'){ L.o2 = 1; return; }
    const lz = R.lz(E.me.pos.z), inAir = AIR5.some(([a, b, c, d]) => E.me.pos.x > a && E.me.pos.x < c && lz > b && lz < d);
    L.o2 = inAir ? Math.min(1, L.o2 + dt * .8) : Math.max(0, L.o2 - dt * O2RATE);
    if (L.o2 <= 0){ L.o2 = 1; const sp = R.spawnW[E.myIdx()]; E.respawnLocal(sp[0], sp[1], 'Out of air! You\'re hauled back up to the bell.'); E.sfx.fall(); }
  },
  visual(dt){ riseBubbles(this.bb, dt); },
  bar(st, R, E){ const L = R.local; if (!R.inside(E.me.pos)) return null; const i = WHEEL5.findIndex(([x, lz, n], k) => !R.isOpen(n) && R.at('w' + k, E.me.pos)); if (i >= 0) return { frac: st.pr[i] / 1.5, label: 'Turning the wheel…', color: '#d4af37' }; return { frac: L.o2 ?? 1, label: 'Air', color: (L.o2 ?? 1) < .3 ? '#ff5050' : '#bfe8ff' }; },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Fetch the captain\'s key (stern, top left) and open the treasure chest (top right). Watch your <b>air</b> — breathe at the bubbles. Stand on a ⎈ wheel to open a hatch.'; }
};

/* =============================================================== */
const ROCK6 = [[-7, 6, -5, 7.5], [3, 9, 5.5, 10.5], [-4, 13, -1.5, 14.5], [5, 15.5, 7.5, 17], [-8, 17.5, -5.5, 19]];
const LEV6 = [[-9, 10.5], [9, 19.5]];
const searchlight = {
  name: 'The Searchlight',
  floor: seabed,
  dark: .9,
  notes: [[0, 1.6, '“A drowned submarine still hunts these waters. Stay out of its light.”', 1.5]],
  get hint(){ return 'The ghost submarine sweeps its searchlight across the room. Standing in the beam fills your "seen" bar — when it\'s full you\'re frozen and dragged back. The rocks cast shadows away from the light (step right behind one)' + (solo() ? '.' : ', and so does your partner: stand behind them, in line with the sub.') + ' Pull both levers to open the door.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    ROCK6.forEach(([a, b, c, d]) => R.block(a, b, c, d, 1.6, rockMat(E)));
    this.sub = new T.Group(); const hull = new T.Mesh(new T.CapsuleGeometry(1, 4, 6, 12), E.mat(0x3a4a3a, { metalness: .6 })); hull.rotation.z = Math.PI / 2; hull.position.y = 1.3; this.sub.add(hull); const tower = new T.Mesh(new T.BoxGeometry(1.2, 1, 1), hull.material); tower.position.y = 2.4; this.sub.add(tower); this.lamp = new T.Mesh(new T.SphereGeometry(.3, 10, 8), E.glow(0xffffd8, 3)); this.lamp.position.set(0, 1.3, .9); this.sub.add(this.lamp); E.scene.add(this.sub);
    this.cone = E.sector(17, .3, 0xffffd8, .18); E.scene.add(this.cone);
    LEV6.forEach(([x, lz], i) => R.plate('l' + i, x, lz, 0xd4af37, 1.3, '⏚'));
  },
  init(){ return { t: 0, ex: [0, 0], lev: [0, 0] }; },
  solve(st){ st.lev = [1, 1]; },
  subPos(t){ return [Math.sin(t * .25) * 6, 20.8]; },
  aim(t){ return Math.sin(t * .7) * .75; },
  shadowed(R, sx, sl, p, others){ const px = p.pos.x, pl = R.lz(p.pos.z); for (const [a, b, c, d] of ROCK6){ const cx = (a + c) / 2, cl = (b + d) / 2, hw = (c - a) / 2 + .2; if (cl < pl) continue; if (segL(cx, cl, sx, sl, px, pl) < hw * .9 && Math.hypot(px - cx, pl - cl) < 4) return true; } return others.some(q => { if (q === p || q.frozen) return false; const qx = q.pos.x, ql = R.lz(q.pos.z); return Math.hypot(qx - sx, ql - sl) < Math.hypot(px - sx, pl - sl) && Math.hypot(px - qx, pl - ql) < 2.2 && segL(qx, ql, sx, sl, px, pl) < .55; }); },
  host(dt, st, R, E){
    st.t += dt;
    LEV6.forEach((_, i) => { if (!st.lev[i] && R.on('l' + i)){ st.lev[i] = 1; E.ev('click', `A lever clanks over (${st.lev.filter(Boolean).length}/2)`); } });
    if (!R.isOpen('exit') && st.lev.every(Boolean)){ R.open('exit'); E.ev('door', 'Both levers — the door opens!'); }
    const [sx, sl] = this.subPos(st.t), a = this.aim(st.t);
    for (const p of E.P){
      if (p.frozen || !R.inside(p.pos)){ st.ex[p.idx] = 0; continue; }
      const px = p.pos.x, pl = R.lz(p.pos.z), dx = px - sx, dl = pl - sl, d = Math.hypot(dx, dl);
      const ang = Math.atan2(dx, -dl); let df = ang - a; df = Math.atan2(Math.sin(df), Math.cos(df));
      const lit = d < 17 && Math.abs(df) < .3 && !p.hidden && !this.shadowed(R, sx, sl, p, E.P);
      st.ex[p.idx] = lit ? st.ex[p.idx] + dt : Math.max(0, st.ex[p.idx] - dt * .5);
      if (st.ex[p.idx] > 1){ st.ex[p.idx] = 0; E.freeze(p.idx, 1.5, `The searchlight caught ${E.names()[p.idx]}!`); const sp = R.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); }
    }
  },
  visual(dt, t, st, R){ const [sx, sl] = this.subPos(st.t); this.sub.position.set(sx, 0, R.Z(sl)); this.cone.position.set(sx, .06, R.Z(sl)); this.cone.rotation.y = this.aim(st.t); },
  bar(st, R, E){ const v = st.ex[E.myIdx()]; return v > .05 ? { frac: v, label: 'SEEN!', color: '#ffffd8' } : null; },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : `Pull both levers (left, then top right). Stay out of the <b>searchlight</b>: rocks — ${solo() ? '' : 'and your partner — '}cast shadows away from the sub. (${st.lev.filter(Boolean).length}/2)`; }
};

/* =============================================================== */
const WC = [0, 11.5], COIN7 = [[0, 5], [6.5, 11.5], [0, 18], [-6.5, 11.5]];
const whirl = {
  name: 'The Whirlpool',
  floor: seabed,
  dark: .7,
  notes: [[0, 1.6, '“The water turns and turns, and everything ends up in the middle.”', 1.5]],
  hint: 'The whirlpool drags you round and inward — the closer you get, the stronger. Get sucked into the eye and you\'re spat back to the start. Dash (or run) outward to escape. Grab the four doubloons circling it.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.sp = Array.from({ length: 60 }, (_, i) => { const m = new T.Mesh(new T.SphereGeometry(.07, 4, 3), new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .6 })); m.userData = { r: 1 + Math.random() * 8, a: Math.random() * 7 }; E.scene.add(m); return m; });
    const eye = new T.Mesh(new T.CircleGeometry(1.4, 24), new T.MeshBasicMaterial({ color: 0x020a12 })); eye.rotation.x = -Math.PI / 2; R.place(eye, WC[0], WC[1], .03);
    this.cm = COIN7.map(([x, lz]) => { const m = new T.Mesh(new T.CylinderGeometry(.3, .3, .06, 14), E.mat(0xd4af37, { metalness: .9, emissive: 0x6a5010 })); m.rotation.x = Math.PI / 2; R.place(m, x, lz, .6); return m; });
    this.orbs = orbRow(E, R, 4, -1.95, 21.4, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1, 1]; },
  push(st, R, E, pos){ if (st.got.every(Boolean)) return null; const dx = pos.x - WC[0], dl = R.lz(pos.z) - WC[1], d = Math.hypot(dx, dl); if (d > 10 || d < .05) return null; const k = Math.max(0, 1 - d / 10); const inw = 1.2 + 3.2 * k, tan = 2 + 3.5 * k; const vx = -dx / d * inw + (-dl / d) * tan, vl = -dl / d * inw + (dx / d) * tan; return [vx, -vl]; },
  local(dt, st, R, E){ const p = E.me.pos; if (!R.inside(p) || E.me.dash) return; if (Math.hypot(p.x - WC[0], R.lz(p.z) - WC[1]) < 1.1){ const sp = R.spawnW[E.myIdx()]; E.respawnLocal(sp[0], sp[1], 'Glug! The whirlpool spat you out at the start.'); E.sfx.fall(); } },
  host(dt, st, R, E){ pick(R, E, st, COIN7, 'got', 'A doubloon!', 4); if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Four doubloons — the whirlpool calms and the door opens!'); } },
  visual(dt, t, st, R){ const calm = st.got.every(Boolean); this.sp.forEach(m => { const u = m.userData; u.a += dt * (calm ? .2 : 3 / Math.max(1, u.r) + .5); u.r -= dt * (calm ? 0 : .6); if (u.r < 1) u.r = 9; m.position.set(WC[0] + Math.sin(u.a) * u.r, .4, R.Z(WC[1] + Math.cos(u.a) * u.r)); }); this.cm.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.z += dt * 3; }); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Grab the 4 doubloons around the <b>whirlpool</b>. It drags you round and in — don't get sucked into the eye! (${st.got.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const SH8 = [[-9.5, 4, -6.5, 6.5], [6, 7, 9.5, 9.5], [-3, 10, 0, 12.5], [-9.5, 13.5, -6, 16], [3.5, 15, 7, 17.5], [-3, 18.5, 1, 20.5]];
const REL8 = [[-8, 11], [8.5, 13], [8, 19.5]];
const trench = {
  name: 'The Trench',
  floor: seabed,
  dark: .9,
  notes: [[0, 1.6, '“Something enormous lives at the bottom of the trench. It hunts by sight.”', 1.5]],
  get hint(){ return 'A giant squid slams its tentacles down where it last saw you — a red circle marks the spot. Get out of the circle, or hide (' + (solo() ? 'deep shadows' : 'deep shadows or your partner\'s back') + ') and it loses track of you. Collect the three relics.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.sm = shadeMeshes(E, R, SH8);
    this.marks = [0, 1].map(() => { const m = new T.Mesh(new T.RingGeometry(.3, 1.5, 24), new T.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; E.scene.add(m); return m; });
    this.tent = [0, 1].map(() => { const m = new T.Mesh(new T.CylinderGeometry(.3, .7, 8, 8), E.mat(0x8a2a4a)); m.visible = false; E.scene.add(m); return m; });
    this.eye = new T.Mesh(new T.SphereGeometry(1.2, 14, 10), E.glow(0xffd34a, 1.5)); R.place(this.eye, 6, 21.3, 3.2);
    this.rm = REL8.map(([x, lz]) => { const m = new T.Mesh(new T.OctahedronGeometry(.35), E.glow(0x8affc1, .9)); R.place(m, x, lz, .6); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { mk: [null, null], cd: [1, 2], fl: [0, 0], got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  shadows(st, R){ return shadeRects(R, SH8); },
  host(dt, st, R, E){
    [0, 1].forEach(k => {
      st.fl[k] = Math.max(0, st.fl[k] - dt);
      if (st.mk[k]){ st.mk[k][2] -= dt; if (st.mk[k][2] <= 0){ const [x, lz] = st.mk[k]; for (const p of E.P) if (!p.frozen && !p.dashing && Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < 1.5) E.freeze(p.idx, E.FREEZE, `A tentacle slammed down on ${E.names()[p.idx]}!`); E.ev('thud'); st.fl[k] = .4; st.mk[k] = null; st.cd[k] = 1.1; } return; }
      st.cd[k] -= dt; if (st.cd[k] > 0) return;
      const T = E.P.filter(p => !p.frozen && !p.hidden && R.inside(p.pos) && R.lz(p.pos.z) > 3); if (!T.length){ st.cd[k] = .4; return; }
      const p = T[(k + Math.floor(E.elapsed)) % T.length]; st.mk[k] = [+p.pos.x.toFixed(2), +R.lz(p.pos.z).toFixed(2), 1.15];
    });
    pick(R, E, st, REL8, 'got', 'A relic!', 3);
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three relics — the squid sinks back into the deep. The door opens!'); }
  },
  visual(dt, t, st, R){ this.marks.forEach((m, k) => { const mk = st.mk[k]; m.visible = !!mk; if (mk){ m.position.set(mk[0], .06, R.Z(mk[1])); m.material.opacity = .3 + (1.15 - mk[2]) * .5; } }); this.tent.forEach((m, k) => { m.visible = st.fl[k] > 0; }); this.rm.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.y += dt; }); this.eye.scale.y = .6 + Math.abs(Math.sin(t * .7)) * .4; setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 relics. The <b>squid</b> slams the <b style="color:#ff5050">red circles</b> where it sees you — hide to throw it off. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const OC = [0, 12.5], TR9 = [[-5, 15.5], [5, 15.5], [0, 7.5]];
const ink = {
  name: 'The Ink Cloud',
  floor: seabed,
  dark: .85,
  notes: [[0, 1.6, '“The octopus guards its treasure — and hides in its own ink.”', 1.5]],
  hint: 'The octopus\'s tentacles lash at anyone it can see within reach. But it keeps puffing out clouds of ink that drift away from it — inside an ink cloud you\'re hidden. Ride the clouds in, grab a treasure, ride them out. A freeze bolt stuns the octopus for a while.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.oct = R.ghost({ home: OC, look: 'blob', tint: 0x6a2a5a, scale: 2.2, sp: 0, flashImmune: true, label: 'the octopus', think: (g, dt, st, R2, E2, P) => { g.x = OC[0]; g.z = R2.Z(OC[1]); const m = g.mem; m.cd = (m.cd || 0) - dt; if (m.cd > 0) return true; const T2 = E2.targetsOf(g, P).filter(p => Math.hypot(p.pos.x - g.x, p.pos.z - g.z) < 6.5); if (T2.length){ const p = T2[0]; E2.freeze(p.idx, E2.FREEZE, `The octopus grabbed ${E2.names()[p.idx]}!`); m.cd = 1.5; m.lash = [p.pos.x, p.pos.z, .4]; } return true; } });
    this.lash = new T.Mesh(new T.CylinderGeometry(.15, .4, 1, 6), E.mat(0x6a2a5a)); this.lash.visible = false; E.scene.add(this.lash);
    this.cl = Array.from({ length: 6 }, () => { const m = new T.Mesh(new T.CylinderGeometry(1, 1, 2.4, 18), new T.MeshBasicMaterial({ color: 0x050208, transparent: true, opacity: .75, depthWrite: false })); m.visible = false; E.scene.add(m); return m; });
    this.tm = TR9.map(([x, lz]) => { const m = new T.Mesh(new T.BoxGeometry(.7, .5, .5), E.mat(0xd4af37, { metalness: .8, emissive: 0x6a5010 })); R.place(m, x, lz, .25); return m; });
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 2.4);
  },
  init(){ return { cl: [], t: 0, got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  shadows(st, R){ return st.cl.map(([x, lz, r]) => R.rect(x - r * .8, lz - r * .8, x + r * .8, lz + r * .8)); },
  host(dt, st, R, E){
    st.t -= dt;
    if (st.t <= 0){ st.t = 1.6; const a = Math.random() * Math.PI * 2; st.cl.push([OC[0] + Math.sin(a) * 1.5, OC[1] + Math.cos(a) * 1.5, 1.6, Math.sin(a) * 1.3, Math.cos(a) * 1.3, 7]); if (st.cl.length > 6) st.cl.shift(); }
    st.cl.forEach(c => { c[0] = +(c[0] + c[3] * dt).toFixed(3); c[1] = +(c[1] + c[4] * dt).toFixed(3); c[2] = Math.min(2.4, +(c[2] + dt * .15).toFixed(3)); c[5] -= dt; });
    st.cl = st.cl.filter(c => c[5] > 0 && Math.abs(c[0]) < 11 && c[1] > -1 && c[1] < 23);
    pick(R, E, st, TR9, 'got', 'Treasure!', 3);
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three treasures — the octopus sulks in its ink. The door opens!'); }
  },
  visual(dt, t, st, R, E){ this.cl.forEach((m, i) => { const c = st.cl[i]; m.visible = !!c; if (c){ m.position.set(c[0], 1.2, R.Z(c[1])); m.scale.set(c[2], 1, c[2]); m.material.opacity = Math.min(.75, c[5] / 2); } }); const L = this.oct.mem.lash; this.lash.visible = !!(L && L[2] > 0); if (L && L[2] > 0){ L[2] -= dt; const ox = this.oct.x, oz = this.oct.z, len = Math.hypot(L[0] - ox, L[1] - oz); this.lash.scale.y = len; this.lash.position.set((ox + L[0]) / 2, .6, (oz + L[1]) / 2); this.lash.rotation.set(Math.PI / 2, 0, -Math.atan2(L[0] - ox, L[1] - oz)); } this.tm.forEach((m, i) => m.visible = !st.got[i]); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Grab the 3 treasures beside the <b>octopus</b>. Its tentacles grab anyone it can see nearby — hide inside its drifting <b>ink clouds</b>! (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const SH10 = [[-9.5, 3, -6.5, 5.5], [6.5, 3, 9.5, 5.5], [-1.5, 10.5, 1.5, 12.5], [-9.5, 17.5, -6.5, 20], [6.5, 17.5, 9.5, 20]];
const HARP10 = [{ pad: [-9.2, 8], a: [-10, 8], b: [10, 8] }, { pad: [9.2, 15], a: [10, 15], b: [-10, 15] }, { pad: [-4, 20.8], a: [-4, 22], b: [-4, 1] }];
const leviathan = {
  name: 'The Leviathan',
  floor: seabed,
  dark: .85,
  notes: [[0, 1.4, '“The oldest thing in the sea. Every harpoon in this wreck was meant for it.”', 1.4]],
  get hint(){ return 'The Leviathan hunts whoever it can see; its long body follows its head — touch either and you\'re frozen. Three harpoon guns (gold pads) each fire across one lane (the dotted line). Lure the head across a lane and step on its pad: the harpoon flies a moment later. Hide in the shadows' + (solo() ? '' : ' or behind your partner') + ' to make it lose you.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    this.sm = shadeMeshes(E, R, SH10);
    this.head = R.ghost({ home: [0, 16], look: 'big', tint: 0x2a4a5a, scale: 1.4, sp: 0, flashImmune: true, label: 'the Leviathan', gone: st => st.done, think: (g, dt, st, R2, E2, P) => {
      const m = g.mem; if (st.stun > 0){ return true; }
      const T2 = E2.targetsOf(g, P).filter(p => R2.inside(p.pos)); let best = null, bd = 99; for (const p of T2){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
      if (best) E2.stepToward(g, best.pos.x, best.pos.z, (3 + st.hits * .4) * E2.GMULT, dt); else { m.w = m.w && Math.hypot(m.w[0] - g.x, m.w[1] - g.z) > .5 ? m.w : [(Math.random() - .5) * 16, R2.Z(3 + Math.random() * 17)]; E2.stepToward(g, m.w[0], m.w[1], 2 * E2.GMULT, dt); }
      g.x = E2.clamp(g.x, -9.4, 9.4); g.z = E2.clamp(g.z, R2.Z(21.4), R2.Z(.8));
      E2.ghostTouch(g, T2, E2.names(), 1.4); return true; } });
    this.segs = Array.from({ length: 12 }, (_, i) => { const m = new T.Mesh(new T.SphereGeometry(.85 - i * .04, 12, 8), E.mat(0x1a3a4a, { roughness: .6 })); m.position.y = .7; E.scene.add(m); return m; });
    HARP10.forEach((h, i) => { R.plate('h' + i, h.pad[0], h.pad[1], 0xd4af37, 1.3, '➹'); const n = Math.round(Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]) / 1); for (let k = 0; k <= n; k++){ const d = new T.Mesh(new T.CircleGeometry(.08, 6), new T.MeshBasicMaterial({ color: 0xd4af37 })); d.rotation.x = -Math.PI / 2; R.place(d, h.a[0] + (h.b[0] - h.a[0]) * k / n, h.a[1] + (h.b[1] - h.a[1]) * k / n, .04); } });
    this.harp = new T.Mesh(new T.CylinderGeometry(.06, .06, 2.4, 6), E.mat(0xd4af37, { metalness: .9 })); this.harp.rotation.x = Math.PI / 2; this.harp.visible = false; E.scene.add(this.harp);
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 3);
  },
  init(){ return { trail: [], hits: 0, stun: 0, fire: null, cd: [0, 0, 0], done: 0 }; },
  solve(st){ st.hits = 3; st.done = 1; },
  shadows(st, R){ return shadeRects(R, SH10); },
  host(dt, st, R, E){
    if (st.done) return;
    st.stun = Math.max(0, st.stun - dt);
    const h = this.head, hl = R.lz(h.z);
    const last = st.trail[0]; if (!last || Math.hypot(last[0] - h.x, last[1] - hl) > .7){ st.trail.unshift([+h.x.toFixed(2), +hl.toFixed(2)]); if (st.trail.length > 13) st.trail.pop(); }
    for (const p of E.P){ if (p.frozen || p.dashing) continue; const pl = R.lz(p.pos.z); if (st.trail.slice(1).some(([x, l]) => Math.hypot(p.pos.x - x, pl - l) < .95)) E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} brushed the Leviathan's coils!`); }
    HARP10.forEach((hp, i) => { st.cd[i] = Math.max(0, st.cd[i] - dt); if (st.cd[i] <= 0 && !st.fire && R.edge('h' + i)){ st.fire = [i, .45]; st.cd[i] = 3; E.ev('click', 'The harpoon gun creaks…'); } });
    if (st.fire){ st.fire[1] -= dt; if (st.fire[1] <= 0){ const hp = HARP10[st.fire[0]]; E.ev('whoosh'); if (st.stun <= 0 && segL(h.x, hl, hp.a[0], hp.a[1], hp.b[0], hp.b[1]) < 1.4){ st.hits++; st.stun = 3; E.ev('boom', st.hits < 3 ? `The harpoon strikes the Leviathan! (${st.hits}/3) It thrashes and comes back faster!` : ''); if (st.hits >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Leviathan sinks into the abyss for good. The way up is open!'); } } st.fx = [st.fire[0], .5]; st.fire = null; } }
    if (st.fx){ st.fx[1] -= dt; if (st.fx[1] <= 0) st.fx = null; }
  },
  visual(dt, t, st, R){ this.segs.forEach((m, i) => { const p = st.trail[i + 1]; m.visible = !!p && !st.done; if (p) m.position.set(p[0], .7 + Math.sin(t * 3 - i * .5) * .15, R.Z(p[1])); }); this.harp.visible = !!st.fx; if (st.fx){ const hp = HARP10[st.fx[0]], f = 1 - st.fx[1] / .5; this.harp.position.set(hp.a[0] + (hp.b[0] - hp.a[0]) * f, 1, R.Z(hp.a[1] + (hp.b[1] - hp.a[1]) * f)); this.harp.rotation.set(Math.PI / 2, 0, -Math.atan2(hp.b[0] - hp.a[0], -(hp.b[1] - hp.a[1]))); } setOrbs(this.orbs, st.hits); },
  objective(st, R, E){ return st.done ? 'The Leviathan is gone — swim for the surface!' : `Harpoon the <b>Leviathan</b> 3 times: lure its head across a dotted lane, then step on that lane's ➹ pad. Its whole body freezes on touch! Hide to shake it. (${st.hits}/3)`; }
};

export default {
  level: 17,
  // texture pack in tex/level17/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  wallImg: 'abyss_wall', trimImg: 'abyss_copper', texVer: 1,
  texFloors: {
    "The Diving Bell": "bell_plate",
    "The Kelp Forest": "kelp_silt",
    "The Anglerfish Lair": "angler_rock",
    "The Jellyfish Bloom": "jelly_silt",
    "The Sunken Galleon": "galleon_deck",
    "The Searchlight": "search_silt",
    "The Whirlpool": "whirl_silt",
    "The Trench": "trench_rock",
    "The Ink Cloud": "ink_silt",
    "The Leviathan": "bone_seabed"
  },
  title: 'The Abyssal Depths',
  tagline: 'Below the manor, below the sea,<br>the water is black and something is breathing.',
  story: 'A diving bell lowers you into the deep. Down here everything hunts by sight — so the trick is not to be seen.',
  winTitle: 'Back to the surface! 🐙',
  feature: { name: 'Shadow Step', icon: '🌑', how: 'Stand <b>right behind your partner\'s back</b> and nothing can see you. Deep shadows (dark patches) hide you too — and you go see-through so you know it\'s working.' },
  accent: '#6affd8',
  wallColor: 0x0e2430,
  trimColor: 0x2a6a6a,
  doorColor: 0x1a2a2a,
  sky: 0x2a6a8a,
  bg: 0x020810,
  drone: 30,
  rooms: [bell, kelp, angler, jelly, galleon, searchlight, whirl, trench, ink, leviathan],
};
