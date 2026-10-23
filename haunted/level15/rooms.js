// Level 15 — The Pharaoh's Tomb. New power: FREEZE BOLT (tap ☀ while MOVING to fire an icy bolt the way you're going).
// Enemies: Mummies (light can't stop them — but a bolt freezes them solid) and Scarab Swarms.
import { orbRow, setOrbs, near, inRect, textPlane, redraw } from '../lib.js';

let EE = null;
const solo = () => EE && EE.solo();
const sandstone = E => E.mat(0xffffff, { roughness: .9, map: E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#b8955a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a6a3a'; x.lineWidth = 3; for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) x.strokeRect(i * 64 + (j % 2) * 32, j * 32, 64, 32); for (let k = 0; k < 30; k++){ x.fillStyle = 'rgba(90,60,30,.25)'; x.fillRect(Math.random() * w, Math.random() * h, 3, 2); } }, 6, 6) });
const blockMat = E => E.tex('plain_sandstone', { color: 0xc8a66a, roughness: .9, tile: 1.8 });
const goldMat = E => E.tex('tomb_gold', { color: 0xd4af37, metalness: .85, roughness: .25, emissive: 0x5a4210, emissiveIntensity: .4, tile: 1 });
const voidMat = E => new E.THREE.MeshBasicMaterial({ color: 0x0a0604 });
const mkItem = (k, x, lz, extra = {}) => ({ k, s: 0, x, lz, hx: x, hlz: lz, w: -1, ...extra });
const home = it => { it.s = 0; it.x = it.hx; it.lz = it.hlz; it.w = -1; it.y = 0; };
const boltTip = 'Tap <b>☀</b> while <b>moving</b> to fire a freeze bolt';
const label = (E, R, x, lz, text, w = 2.4, y = 1.6, col = '#ffe9b0', bg = '#2a1a0a') => { const m = textPlane(E, w, w * .45, 1); R.place(m, x, lz, y); redraw(m, (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); c.fillStyle = col; c.font = 'bold 44px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + 2); }); return m; };
const flatLabel = (E, R, x, lz, text, w = 2) => { const m = label(E, R, x, lz, text, w, .05); m.rotation.x = -Math.PI / 2; return m; };

/* ---------- mummies: shamble after you; light does nothing, a freeze bolt stops them for a while ---------- */
function mummy(R, E, home, opt = {}){
  const g = R.ghost({ home, look: 'hood', tint: 0xd8c8a0, sp: opt.sp || 1.7, radius: opt.radius || 9, flashImmune: true, label: opt.label || 'a mummy', b: opt.b, gone: opt.gone, scale: opt.scale || 1.05, think: opt.think });
  const T = E.THREE; for (let i = 0; i < 5; i++){ const band = new T.Mesh(new T.TorusGeometry(.48 - i * .02, .04, 4, 16), E.mat(0xa89870)); band.rotation.x = Math.PI / 2 + (i % 2 ? .2 : -.2); band.position.y = .5 + i * .22; g.mesh.add(band); }
  return g;
}
const iceShow = (gs, E) => gs.forEach(g => { if (!g.ice){ g.ice = new E.THREE.Mesh(new E.THREE.BoxGeometry(1.2, 2, 1.2), new E.THREE.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: .4, emissive: 0x4fb6ff, emissiveIntensity: .4 })); g.ice.position.y = 1; g.mesh.add(g.ice); } g.ice.visible = g.stun > 0; });
function targetMeshes(E, R, list, col = 0x5ad1ff){ const T = E.THREE; return list.map(([x, lz, y = 1.6]) => { const g = new T.Group(); const ring = new T.Mesh(new T.TorusGeometry(.4, .07, 8, 20), goldMat(E)); g.add(ring); const gem = new T.Mesh(new T.SphereGeometry(.25, 12, 10), E.glow(col, .6)); g.add(gem); g.userData.gem = gem; R.place(g, x, lz, y); return g; }); }
const faceCenter = (g, R) => { g.rotation.y = Math.atan2(-g.position.x, R.Z(11) - g.position.z); };

/* =============================================================== */
const SEAL1 = [[-4, 21.4], [0, 21.4], [4, 21.4]];
const antechamber = {
  name: 'The Antechamber',
  floor: sandstone,
  notes: [[0, 1.6, '“Light does not trouble the dead here. Cold does.”', 1.5]],
  hint: 'Mummies ignore your flash. Tap ☀ (F) WHILE MOVING to fire a freeze bolt in the direction you\'re walking — it freezes a mummy solid for a few seconds. Bolts also break the three blue seals above the door.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.tg = targetMeshes(E, R, SEAL1.map(([x, lz]) => [x, lz, 2.2]));
    for (const x of [-8, 8]){ const s = new T.Mesh(new T.BoxGeometry(1.2, .9, 2.4), goldMat(E)); R.place(s, x, 17, .45); R.block(x - .6, 15.8, x + .6, 18.2, .01, E.mat(0)); }
    this.m = [mummy(R, E, [-6.5, 15]), mummy(R, E, [6.5, 15])];
  },
  init(){ return { seal: [0, 0, 0] }; },
  solve(st){ st.seal = [1, 1, 1]; },
  boltTargets(st, R){ return SEAL1.map(([x, lz], i) => st.seal[i] ? null : [x, R.Z(lz) + .3, i, 1]).filter(Boolean); },
  onBoltTarget(st, R, E, id){ st.seal[id] = 1; const n = st.seal.filter(Boolean).length; E.ev('crash', n < 3 ? `A seal shatters! (${n}/3)` : ''); if (n === 3){ R.open('exit'); E.ev('door', 'All three seals broken — the tomb door grinds open!'); } },
  visual(dt, t, st){ this.tg.forEach((g, i) => { g.userData.gem.visible = !st.seal[i]; g.rotation.y = Math.sin(t + i) * .2; }); iceShow(this.m, EE); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : `<b>NEW: Freeze Bolt!</b> ${boltTip} — it freezes <b>mummies</b> (your flash doesn't work on them) and shatters the 3 blue seals over the door. (${st.seal.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const NEST2 = [[-6, 9], [6, 12], [-2, 17]], AMU2 = [[-8.5, 12.5], [8.5, 7], [3, 19.5]];
const scarabs = {
  name: 'The Scarab Nest',
  floor: sandstone,
  notes: [[3, 1.4, '“Step near a nest and the scarabs boil out. A bolt scatters them.”', 1.5]],
  hint: 'Each dark hole is a scarab nest: come within a few steps and a swarm pours out and chases you. A freeze bolt sends a swarm back down its hole for a while. Grab the three golden amulets.',
  build(R, E){
    EE = E; const T = E.THREE;
    NEST2.forEach(([x, lz]) => { const h = new T.Mesh(new T.CircleGeometry(1, 20), new T.MeshBasicMaterial({ color: 0x0a0604 })); h.rotation.x = -Math.PI / 2; R.place(h, x, lz, .02); });
    this.am = AMU2.map(([x, lz]) => { const m = new T.Mesh(new T.TorusGeometry(.25, .08, 8, 16), goldMat(E)); R.place(m, x, lz, .6); return m; });
    this.sw = NEST2.map(([x, lz], i) => {
      const g = R.ghost({ home: [x, lz], look: 'blob', tint: 0x1a2a1a, sp: 0, scale: .7, label: 'a scarab swarm', think: (g, dt, st, R2, E2, P) => {
        const m = g.mem; m.t = (m.t || 0) - dt;
        if (!m.s){ g.y = 6; g.x = g.home[0]; g.z = g.home[1]; if (m.t <= 0 && P.some(p => !p.frozen && Math.hypot(p.pos.x - g.home[0], p.pos.z - g.home[1]) < 4.5)){ m.s = 1; m.t = 8; g.y = 0; E2.ev('whoosh', 'Scarabs boil out of the nest!'); } return true; }
        g.y = 0; const T2 = E2.targetsOf(g, P); let best = null, bd = 99; for (const p of T2){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
        if (best && m.t > 0) E2.stepToward(g, best.pos.x, best.pos.z, 3.3 * E2.GMULT, dt); else if (E2.stepToward(g, g.home[0], g.home[1], 3 * E2.GMULT, dt) < .2){ m.s = 0; m.t = 3; }
        E2.ghostTouch(g, T2, E2.names(), .9);
        return true;
      } });
      g.bugs = []; for (let k = 0; k < 16; k++){ const b = new T.Mesh(new T.SphereGeometry(.09, 6, 4), E.mat(0x2a3a1a, { metalness: .6 })); b.scale.set(1, .5, 1.4); g.mesh.add(b); g.bugs.push(b); }
      return g;
    });
    this.orbs = orbRow(E, R, 3, -1.3, 21.3, 1.3, 2.4);
  },
  init(){ return { got: [0, 0, 0] }; },
  solve(st){ st.got = [1, 1, 1]; },
  host(dt, st, R, E){
    this.sw.forEach(g => { if (g.stun > 0 && g.mem.s){ g.mem.s = 0; g.mem.t = 6; g.stun = 0; E.ev('zap', 'The swarm scatters back into its nest!'); } });
    AMU2.forEach(([x, lz], i) => { if (!st.got[i] && E.P.some(p => !p.frozen && near(R, p, x, lz, 1))){ st.got[i] = 1; E.ev('pick', `A golden amulet! (${st.got.filter(Boolean).length}/3)`); } });
    if (!R.isOpen('exit') && st.got.every(Boolean)){ R.open('exit'); E.ev('door', 'Three amulets — the door opens!'); }
  },
  visual(dt, t, st){ this.am.forEach((m, i) => { m.visible = !st.got[i]; m.rotation.y += dt; }); this.sw.forEach((g, k) => g.bugs.forEach((b, i) => { const a = t * 5 + i * .7 + k; b.position.set(Math.cos(a) * (.4 + (i % 4) * .2), .1 + (i % 3) * .1, Math.sin(a * 1.3) * (.4 + (i % 4) * .2)); b.rotation.y = -a; })); setOrbs(this.orbs, st.got.filter(Boolean).length); },
  objective(st, R, E){ return st.got.every(Boolean) ? 'The door is open!' : `Collect the 3 golden amulets. <b>Scarab swarms</b> pour out of their nests when you get close — a <b>freeze bolt</b> drives them back. (${st.got.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const ANU3 = [[-9.3, 4.5, Math.PI / 2, 9], [9.3, 8.5, -Math.PI / 2, 9], [-9.3, 12.5, Math.PI / 2, 9], [9.3, 16.5, -Math.PI / 2, 9], [-9.3, 20, Math.PI / 2, 9]];
const anubis = {
  name: 'The Hall of Anubis',
  floor: sandstone,
  notes: [[0, 1.6, '“The jackal-headed judges sweep the hall with their gaze.”', 1.5]],
  hint: 'Each Anubis statue sweeps a freezing gaze across the hall. A freeze bolt to the statue stops its gaze for a few seconds — but your bolt needs 3 seconds to recharge, so pick your moment (or take turns).',
  build(R, E){
    EE = E;
    this.st = ANU3.map(([x, lz, a, len]) => R.ghost({ home: [x, lz], look: 'statue', tint: 0x2a2a2a, sp: 0, flashImmune: true, label: 'Anubis', beam: { len, color: 0xffd34a }, think: E.AI.sweeper(len, a - .9, a + .9, 3.4 + (lz % 3) * .3) }));
    this.st.forEach(g => { const T = E.THREE; for (const s of [-1, 1]){ const ear = new T.Mesh(new T.ConeGeometry(.15, .6, 4), goldMat(E)); ear.position.set(s * .2, 2.2, 0); g.mesh.add(ear); } });
  },
  init(){ return { done: 0 }; },
  solve(st){ st.done = 1; },
  host(dt, st, R, E){ if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.6)){ st.done = 1; R.open('exit'); E.ev('door', 'Judged and found worthy — the door opens!'); } },
  visual(dt, t, st){ this.st.forEach(g => { if (g.beamMesh) g.beamMesh.visible = !(g.stun > 0); }); iceShow(this.st, EE); },
  objective(st, R, E){ return st.done ? 'The door is open!' : `Cross the hall. The <b>Anubis statues</b> sweep a freezing gaze — ${boltTip.toLowerCase()} at a statue to stop it for a few seconds.`; }
};

/* =============================================================== */
const JARS4 = [['Imsety', 'man', 0], ['Hapi', 'baboon', 1], ['Duamutef', 'jackal', 2], ['Qebehsenuef', 'falcon', 3]];
const NICHE4 = [[-8.5, 18, 'LIVER'], [-3, 20.6, 'LUNGS'], [3, 20.6, 'STOMACH'], [8.5, 18, 'GUTS']];
const ORDER4 = [0, 1, 2, 3];      // jar i belongs in niche ORDER4[i]
const JPOS4 = [[-4.5, 4], [-1.5, 4], [1.5, 4], [4.5, 4]];
const CLUE4 = [[-9.7, 8, 'The baboon breathes for the dead.'], [9.7, 8, 'The jackal keeps the belly full.'], [-9.7, 13, 'The falcon watches what winds within.'], [9.7, 13, 'Only a man may keep the liver.']];
const canopic = {
  name: 'The Canopic Shrine',
  floor: sandstone,
  noThrow: true,
  notes: [[0, 1.6, '“Four jars, four guardians, four gifts for the afterlife. Read the walls.”', 1.5]],
  hint: 'Each jar\'s lid is a head: man, baboon, jackal, falcon. The wall carvings tell you which organ each one guards: baboon → lungs, jackal → stomach, falcon → guts, man → liver. Carry each jar (they\'re too fragile to throw) to its niche. Mummies wander the shrine.',
  build(R, E){
    EE = E; const T = E.THREE;
    NICHE4.forEach(([x, lz, n]) => { const nb = new T.Mesh(new T.BoxGeometry(1.6, 1.8, .8), E.mat(0x6a4a2a)); R.place(nb, x, lz + .6, .9); label(E, R, x, lz + .15, n, 1.8, 2.2); R.plate('n' + NICHE4.indexOf(NICHE4.find(q => q[2] === n)), x, lz - .8, 0xd4af37, 1.2); });
    CLUE4.forEach(([x, lz, txt]) => { const m = textPlane(E, 3.6, 1.2, .9); m.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; R.place(m, x, lz, 1.7); redraw(m, (c, W, H) => { c.fillStyle = '#3a2410'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffd38a'; c.font = 'italic 22px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; const words = txt.split(' '); let line = '', y = H / 2 - 14; const out = []; for (const w of words){ if ((line + w).length > 22){ out.push(line); line = ''; } line += w + ' '; } out.push(line); out.forEach((l, i) => c.fillText(l.trim(), W / 2, H / 2 - (out.length - 1) * 14 + i * 28)); }); });
    this.placed = NICHE4.map(([x, lz]) => { const j = this.jarMesh(E, 0); j.visible = false; R.place(j, x, lz + .4, 1.8); return j; });
    this.m = [mummy(R, E, [-6, 11]), mummy(R, E, [6, 14], { sp: 1.9 })];
    this.orbs = orbRow(E, R, 4, -1.95, 2.2, 1.3, 1.6);
  },
  jarMesh(E, i){ const T = E.THREE, g = new T.Group(); const b = new T.Mesh(new T.CylinderGeometry(.22, .17, .5, 12), E.mat(0xe8dcc0)); b.position.y = .25; g.add(b); const head = new T.Mesh(i === 3 ? new T.ConeGeometry(.15, .3, 8) : new T.SphereGeometry(.17, 10, 8), E.mat([0xc89a6a, 0x8a7a6a, 0x2a2a2a, 0x6a4a2a][i])); head.position.y = .62; if (i === 3) head.rotation.x = Math.PI / 2; g.add(head); if (i === 2){ for (const s of [-1, 1]){ const ear = new T.Mesh(new T.ConeGeometry(.05, .2, 4), E.mat(0x2a2a2a)); ear.position.set(s * .08, .8, 0); g.add(ear); } } return g; },
  init(){ return { put: [0, 0, 0, 0], items: JPOS4.map(([x, lz], i) => mkItem('jar' + i, x, lz, { n: i })) }; },
  solve(st){ st.put = [1, 1, 1, 1]; st.items.forEach(i => i.s = 3); },
  itemMesh(k, E){ return k.startsWith('jar') ? this.jarMesh(E, +k[3]) : null; },
  carryTick(st, R, E, it, p){
    NICHE4.forEach(([x, lz], ni) => { if (!near(R, p, x, lz - .8, 1)) return; if (ORDER4[it.n] === ni){ it.s = 3; st.put[ni] = 1; const n = st.put.filter(Boolean).length; E.ev('place', n < 4 ? `${JARS4[it.n][0]} the ${JARS4[it.n][1]} is home (${n}/4)` : ''); } else if (!it.bounce){ it.bounce = 1; E.ev('wrong', `${JARS4[it.n][0]} the ${JARS4[it.n][1]} doesn't belong there — the jar slips out of your hands!`); it.s = 0; it.w = -1; it.x = p.pos.x; it.lz = R.lz(p.pos.z) - 1.6; it.pickCD = E.elapsed + 1; } });
    if (it.bounce && !NICHE4.some(([x, lz]) => near(R, p, x, lz - .8, 1.6))) it.bounce = 0;
  },
  host(dt, st, R, E){ if (!R.isOpen('exit') && st.put.every(Boolean)){ R.open('exit'); E.ev('door', 'The four sons of Horus stand guard — the door opens!'); } },
  visual(dt, t, st, R, E){ this.placed.forEach((j, i) => j.visible = !!st.put[i]); iceShow(this.m, E); setOrbs(this.orbs, st.put.filter(Boolean).length); },
  objective(st, R, E){ return st.put.every(Boolean) ? 'The door is open!' : `Put each canopic jar in its niche: man, baboon, jackal, falcon → liver, lungs, stomach, guts. <b>Read the wall carvings</b>. (${st.put.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const CHUTE5 = [[-9.6, 7], [9.6, 9.5], [-9.6, 14], [9.6, 16.5]], DUNE5 = [[-6.5, 7], [6.5, 9.5], [-6.5, 14], [6.5, 16.5]];
const sand = {
  name: 'The Sand Chutes',
  floor: sandstone,
  notes: [[0, 1.6, '“The tomb is filling with sand. Plug the chutes — but only when their grates open.”', 1.5]],
  hint: 'Four chutes pour sand into the tomb, and the dunes grow (you\'re slow in deep sand and can\'t run). Each chute\'s plug is behind a grate that only opens for a moment — fire a freeze bolt at the plug while the grate is up. Plug all four, then cross to the door.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.tg = targetMeshes(E, R, CHUTE5.map(([x, lz]) => [x, lz, 1.4]), 0xff9a3d);
    this.tg.forEach(g => faceCenter(g, R));
    this.grates = CHUTE5.map(([x, lz]) => { const g = new T.Mesh(new T.BoxGeometry(.2, 1.4, 1.4), E.mat(0x3a3a3a, { metalness: .8 })); R.place(g, x + (x < 0 ? .4 : -.4), lz, 1.4); return g; });
    this.dunes = DUNE5.map(([x, lz]) => { const m = new T.Mesh(new T.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), E.mat(0xd8b878)); m.scale.set(1, .25, 1); R.place(m, x, lz, 0); return m; });
    this.streams = CHUTE5.map(([x, lz]) => { const m = new T.Mesh(new T.CylinderGeometry(.15, .3, 2.5, 6), new T.MeshBasicMaterial({ color: 0xe8c888, transparent: true, opacity: .7 })); m.rotation.z = x < 0 ? -1.1 : 1.1; R.place(m, x + (x < 0 ? 1.4 : -1.4), lz, 1.2); return m; });
    this.m = [mummy(R, E, [0, 19], { sp: 1.5 })];
    this.orbs = orbRow(E, R, 4, -1.95, 21.3, 1.3, 2.4);
  },
  init(){ return { t: 0, r: DUNE5.map(() => 1), plug: [0, 0, 0, 0] }; },
  solve(st){ st.plug = [1, 1, 1, 1]; },
  openG(st, i){ return ((st.t + i * 1.3) % 4.4) < 1.4; },
  boltTargets(st, R){ return CHUTE5.map(([x, lz], i) => !st.plug[i] && this.openG(st, i) ? [x + (x < 0 ? .5 : -.5), R.Z(lz), i, 1] : null).filter(Boolean); },
  onBoltTarget(st, R, E, id){ st.plug[id] = 1; const n = st.plug.filter(Boolean).length; E.ev('thud', n < 4 ? `Chute plugged! (${n}/4)` : ''); if (n === 4){ R.open('exit'); E.ev('door', 'The sand stops — the door opens!'); } },
  speed(st, R, E, idx){ const p = E.playerPos(idx); if (!p) return null; const lz = R.lz(p.z); return DUNE5.some(([x, l], i) => Math.hypot(p.x - x, lz - l) < st.r[i]) ? { mult: .5, noRun: true } : null; },
  host(dt, st, R, E){ st.t += dt; st.r = st.r.map((r, i) => st.plug[i] ? r : Math.min(5.5, +(r + dt * .12).toFixed(3))); },
  visual(dt, t, st, R, E){ this.dunes.forEach((m, i) => m.scale.set(st.r[i], .25 + st.r[i] * .08, st.r[i])); this.grates.forEach((g, i) => { g.position.y = st.plug[i] ? 1.4 : this.openG(st, i) ? 3.2 : 1.4; }); this.streams.forEach((m, i) => m.visible = !st.plug[i]); this.tg.forEach((g, i) => g.userData.gem.material.emissiveIntensity = st.plug[i] ? 0 : this.openG(st, i) ? 1.6 : .2); iceShow(this.m, E); setOrbs(this.orbs, st.plug.filter(Boolean).length); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : `Plug the 4 sand chutes: fire a <b>freeze bolt</b> at a chute's plug while its grate is <b>up</b> (it glows). The dunes keep growing! (${st.plug.filter(Boolean).length}/4)`; }
};

/* =============================================================== */
const LANE6 = [[5, 1.3, 0], [8.6, 1.7, 1.2], [12.2, 1.1, 2.4], [15.8, 1.9, .7], [19.4, 1.5, 1.9]];
const bladeX = (L, t) => Math.sin(t * L[1] + L[2]) * 8.6;
const blades = {
  name: 'The Blade Corridor',
  floor: sandstone,
  notes: [[0, 1.6, '“The tomb-builders left their blades swinging. Each one hangs from a gear.”', 1.5]],
  hint: 'Five blades swing across the corridor. Each lane has a gear in the right-hand wall: a freeze bolt fired at it (walk right along the lane and tap ☀) jams that blade for a few seconds. Your bolt recharges in 3 seconds — take turns jamming and running.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.tg = targetMeshes(E, R, LANE6.map(([lz]) => [9.6, lz, 1.4]), 0x9a9aa4); this.tg.forEach(g => g.rotation.y = -Math.PI / 2);
    this.bl = LANE6.map(() => { const g = new T.Group(); const arm = new T.Mesh(new T.CylinderGeometry(.05, .05, 3, 6), E.mat(0x5a5a62)); arm.position.y = 2.2; g.add(arm); const blade = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, .06, 20, 1, false, 0, Math.PI), E.mat(0xcfcfd8, { metalness: .9, roughness: .2 })); blade.rotation.z = Math.PI / 2; blade.rotation.y = Math.PI / 2; blade.position.y = .7; g.add(blade); E.scene.add(g); return g; });
    for (const [lz] of LANE6){ const slot = new T.Mesh(new T.BoxGeometry(18, .02, .2), new T.MeshBasicMaterial({ color: 0x1a1008 })); R.place(slot, 0, lz, .02); }
  },
  init(){ return { t: 0, jam: LANE6.map(() => 0), jt: LANE6.map(() => 0), done: 0 }; },
  solve(st){ st.done = 1; },
  bx(st, i){ return bladeX(LANE6[i], st.jt[i]); },
  boltTargets(st, R){ return LANE6.map(([lz], i) => [9.4, R.Z(lz), i, .9]); },
  onBoltTarget(st, R, E, id){ st.jam[id] = 6; E.ev('click', 'The gear jams — the blade stops!'); },
  host(dt, st, R, E){
    st.t += dt;
    LANE6.forEach((L, i) => { if (st.jam[i] > 0) st.jam[i] = Math.max(0, st.jam[i] - dt); else st.jt[i] += dt * E.GMULT; const x = this.bx(st, i), lz = L[0]; if (st.jam[i] > 0) return; for (const p of E.P) if (!p.frozen && !p.dashing && R.inside(p.pos) && Math.abs(p.pos.x - x) < 1.2 && Math.abs(R.lz(p.pos.z) - lz) < .7){ E.freeze(p.idx, E.FREEZE, `${E.names()[p.idx]} was caught by a swinging blade!`); const sp = R.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); } });
    if (!st.done && E.P.length && E.P.every(p => R.inside(p.pos) && R.lz(p.pos.z) > 20.8)){ st.done = 1; R.open('exit'); E.ev('door', 'Through the blades — the door opens!'); }
  },
  visual(dt, t, st, R){ this.bl.forEach((g, i) => { g.position.set(this.bx(st, i), 0, R.Z(LANE6[i][0])); g.rotation.z = Math.cos(st.jt[i] * LANE6[i][1] + LANE6[i][2]) * .5; }); this.tg.forEach((g, i) => { g.rotation.x = st.jam[i] > 0 ? 0 : st.jt[i] * 3; g.userData.gem.material.color.setHex(st.jam[i] > 0 ? 0x5ad1ff : 0x9a9aa4); }); },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Get through the 5 swinging blades. Fire a <b>freeze bolt</b> at a lane\'s gear (right wall) to jam its blade for a few seconds.'; }
};

/* =============================================================== */
const ANS7 = [['RIVER', -7.5, 9], ['SUN', -4.5, 9], ['SCARAB', -1.5, 9], ['SPHINX', 1.5, 9], ['PYRAMID', 4.5, 9], ['MUMMY', 7.5, 9]];
// Each riddle comes in two halves. In co-op each player hears only one half, and a half on its own fits more than one
// answer — you have to put them together. [half A, half B, answer index into ANS7]
const RID7 = [
  ['I have a mouth, yet I never eat.', 'I have a bed, yet I never sleep — and I run without feet.', 0],
  ['Every year I flood, and the fields grow fat.', 'Boats ride my back all the way to the sea.', 0],
  ['Born each dawn, I die each dusk.', 'The old priests said a beetle pushes me across the sky.', 1],
  ['I am the eye of Ra.', 'Stare at me too long and I will blind you.', 1],
  ['I wear a jewelled shell and roll my treasure before me.', 'Carved on rings and amulets, I am a lucky little beetle.', 2],
  ['A lion\'s body, a man\'s face.', 'And here, I am the one who asks the questions.', 3],
  ['Built of stone for a king who never leaves.', 'Four faces, no eyes, and a point I never make.', 4],
  ['Square at my feet, a single point above.', 'My tip once wore gold to catch the morning light.', 4],
  ['Wrapped from head to toe — and yet no gift am I.', 'I walk the halls, though I died a thousand years ago.', 5],
  ['Seventy days of salt made me what I am.', 'My heart stays, but my other organs wait in four jars.', 5],
];
const sphinx = {
  name: 'The Sphinx\'s Riddles',
  floor: sandstone,
  notes: [[0, 1.6, '“Answer well and pass. Answer badly and the dead will wake.”', 1.5]],
  get hint(){ return solo() ? 'Read both halves of the riddle and step on the answer. Three right answers opens the door; a wrong one wakes a mummy, costs you a right answer and the Sphinx asks something new.' : 'You each hear only HALF of every riddle — and each half fits more than one answer. Tell each other your half, then step on the answer. A wrong answer wakes a mummy, costs you a right answer, and the Sphinx asks something new.'; },
  build(R, E){
    EE = E; const T = E.THREE;
    const body = new T.Mesh(new T.BoxGeometry(6, 2.2, 3), blockMat(E)); R.place(body, 0, 17.5, 1.1); const head = new T.Mesh(new T.BoxGeometry(1.8, 2, 1.6), blockMat(E)); R.place(head, 0, 15.6, 2.6); const nem = new T.Mesh(new T.BoxGeometry(2.6, 1.6, .4), E.mat(0x2a4a8a)); R.place(nem, 0, 16.3, 2.6);
    R.block(-3, 16, 3, 19, .01, E.mat(0));
    this.eyes = [-.4, .4].map(x => { const e = new T.Mesh(new T.SphereGeometry(.12, 8, 6), E.glow(0x5ad1ff, 1)); R.place(e, x, 14.79, 2.9); return e; });
    ANS7.forEach(([w, x, lz], i) => { R.plate('a' + i, x, lz, 0xd4af37, 2, null); flatLabel(E, R, x, lz, w, 1.8); });
    this.m = [0, 1, 2].map(k => mummy(R, E, [k === 1 ? 8.5 : -8.5, k === 2 ? 20 : 4], { gone: st => st.wrong <= k || st.n >= 3 }));
    this.orbs = orbRow(E, R, 3, -1.3, 20.5, 1.3, 2.6);
  },
  init(R, E){ return { n: 0, wrong: 0, cd: 0, q: E.shuffle(RID7.map((_, i) => i)), k: 0 }; },
  solve(st){ st.n = 3; },
  riddle(st){ return RID7[st.q[st.k % st.q.length]]; },
  host(dt, st, R, E){
    st.cd = Math.max(0, st.cd - dt);
    if (st.n >= 3) return;
    ANS7.forEach((a, i) => {
      if (st.cd > 0 || !R.edge('a' + i)) return;
      st.cd = 1.2; st.k++;   // right or wrong, the next riddle is a new one
      if (i === this.riddle({ ...st, k: st.k - 1 })[2]){
        st.n++; E.ev('gong', st.n < 3 ? `"Correct." (${st.n}/3) The Sphinx asks again…` : '', 70);
        if (st.n >= 3){ R.open('exit'); E.ev('door', '"You may pass." The Sphinx bows its head — the door opens!'); }
      } else { st.wrong = Math.min(3, st.wrong + 1); st.n = Math.max(0, st.n - 1); E.ev('boo', `"WRONG." A sarcophagus creaks open — a mummy wakes! (${st.n}/3)`); }
    });
  },
  visual(dt, t, st, R, E){ setOrbs(this.orbs, st.n); this.eyes.forEach(e => e.material.emissiveIntensity = st.cd > 0 ? 3 : 1); iceShow(this.m, E); },
  objective(st, R, E){
    if (st.n >= 3) return 'The Sphinx lets you pass — door open!';
    const r = this.riddle(st);
    if (E.solo()) return `<b>The Sphinx asks (${st.n + 1}/3):</b> <i>“${r[0]} ${r[1]}”</i> — step on your answer.`;
    return `<b>The Sphinx whispers to you (${st.n}/3 right):</b> <i>“${r[E.myIdx()]}”</i> Your partner heard the other half — put them together, then step on the answer.`;
  }
};

/* =============================================================== */
const SAR8 = [[-7, 7], [-7, 12], [-7, 17], [7, 7], [7, 12], [7, 17]], LOCK8 = [0, 21];
const sarcophagi = {
  name: 'The Sarcophagus Hall',
  floor: sandstone,
  notes: [[0, 1.6, '“One coffin holds the ankh key. The others hold their owners.”', 1.5]],
  hint: 'Hold ☀ for Ghost Sight: the coffin with the ankh glows gold. Stand at a coffin\'s foot to pry it open. Every wrong coffin lets a mummy out — freeze bolts stop them. Carry the ankh to the lock at the door.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.cof = SAR8.map(([x, lz], i) => { const g = new T.Group(); const box = new T.Mesh(new T.BoxGeometry(1.4, .9, 2.6), goldMat(E)); box.position.y = .45; g.add(box); const lid = new T.Mesh(new T.BoxGeometry(1.4, .2, 2.6), E.mat(0x2a4a8a, { metalness: .5 })); lid.position.y = 1; g.add(lid); const aura = new T.Mesh(new T.BoxGeometry(1.9, 1.6, 3.1), new T.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: .3, depthWrite: false })); aura.position.y = .8; aura.visible = false; g.add(aura); g.userData = { lid, aura }; R.place(g, x, lz); R.block(x - .7, lz - 1.3, x + .7, lz + 1.3, .01, E.mat(0)); return g; });
    const lk = new T.Mesh(new T.BoxGeometry(1.4, 1.4, .4), goldMat(E)); R.place(lk, LOCK8[0] + 2.5, LOCK8[1], 1.2);
    this.m = SAR8.map(([x, lz], i) => mummy(R, E, [x + (x < 0 ? 1.4 : -1.4), lz], { gone: st => !st.open[i] || st.key === i || st.done }));
  },
  init(){ return { key: Math.floor(Math.random() * 6), open: SAR8.map(() => 0), pr: SAR8.map(() => 0), done: 0, items: [mkItem('ankh', -30, 0, { s: 3 })] }; },
  solve(st){ st.done = 1; },
  itemMesh(k, E){ if (k !== 'ankh') return null; const T = E.THREE, g = new T.Group(), m = goldMat(E); const ring = new T.Mesh(new T.TorusGeometry(.18, .05, 6, 14), m); ring.position.y = .9; g.add(ring); const bar = new T.Mesh(new T.BoxGeometry(.5, .08, .08), m); bar.position.y = .68; g.add(bar); const st = new T.Mesh(new T.BoxGeometry(.08, .55, .08), m); st.position.y = .4; g.add(st); return g; },
  carryTick(st, R, E, it, p){ if (near(R, p, LOCK8[0] + 2.5, LOCK8[1] - .8, 1.6)){ it.s = 3; st.done = 1; R.open('exit'); E.ev('door', 'The ankh turns in the lock — the door opens!'); } },
  host(dt, st, R, E){
    if (st.done) return;
    SAR8.forEach(([x, lz], i) => { if (st.open[i]) return; const fx = x + (x < 0 ? 1.3 : -1.3); if (E.P.some(p => !p.frozen && near(R, p, fx, lz, .9))){ st.pr[i] += dt; if (st.pr[i] > 1.5){ st.open[i] = 1; if (i === st.key){ const it = st.items[0]; it.s = 0; it.x = fx; it.lz = lz + 1.5; it.hx = it.x; it.hlz = it.lz; E.ev('chime', 'The ankh key! Take it to the lock by the door.'); } else E.ev('boo', 'A mummy lurches out of the coffin!'); } } else st.pr[i] = 0; });
  },
  visual(dt, t, st, R, E){ this.cof.forEach((g, i) => { g.userData.lid.position.set(st.open[i] ? (SAR8[i][0] < 0 ? .9 : -.9) : 0, st.open[i] ? .7 : 1, 0); g.userData.lid.rotation.z = st.open[i] ? (SAR8[i][0] < 0 ? -.6 : .6) : 0; g.userData.aura.visible = E.sight && i === st.key && !st.open[i]; }); iceShow(this.m, E); },
  bar(st, R, E){ const i = SAR8.findIndex(([x, lz], k) => !st.open[k] && near(R, { pos: E.me.pos }, x + (x < 0 ? 1.3 : -1.3), lz, .9)); return i < 0 ? null : { frac: st.pr[i] / 1.5, label: 'Prying the lid…', color: '#d4af37' }; },
  objective(st, R, E){ return st.done ? 'The door is open!' : 'Find the <b>ankh key</b> in one of the six coffins (stand at a coffin\'s foot to open it). Hold <b>☀</b> for Ghost Sight — the right one glows. Wrong coffins release mummies!'; }
};

/* =============================================================== */
const MIR9 = [[-6, 6], [0, 6], [6, 6], [6, 14], [-6, 14]], PAD9 = [[-6, 3.6], [0, 3.6], [6, 3.6], [8.4, 14], [-8.4, 14]];
const STAR9 = [[-6, 20], [0, 21], [6, 20]];
const WALL9 = [[-10, 16.4, -6.35, 17], [-5.65, 16.4, -.35, 17], [6.35, 16.4, 10, 17]];
const shafts = {
  name: 'The Star Shafts',
  floor: sandstone,
  notes: [[0, 1.6, '“The bolt flies true — until bronze turns it.”', 1.5]],
  hint: 'The three star gems are behind the wall, each lined up with a narrow slit. Bronze mirrors bounce your freeze bolts at right angles (step on a mirror\'s pad to turn it). Walk straight along a row of mirrors and tap ☀: let a mirror turn the bolt north through a slit.',
  build(R, E){
    EE = E; const T = E.THREE;
    WALL9.forEach(([a, b, c, d]) => R.wall(a, b, c, d)); R.door('gate', .35, 16.4, 5.65, 17, 'gate');
    this.mm = MIR9.map(([x, lz]) => { const g = new T.Group(); const base = new T.Mesh(new T.CylinderGeometry(.35, .45, .4, 10), goldMat(E)); base.position.y = .2; g.add(base); const m = new T.Mesh(new T.BoxGeometry(1.4, 1.2, .08), E.mat(0xc88a3a, { metalness: .95, roughness: .15 })); m.position.y = 1; g.add(m); R.place(g, x, lz); return g; });
    PAD9.forEach(([x, lz], i) => R.plate('p' + i, x, lz, 0xd4af37, 1.2, '⟲'));
    this.tg = targetMeshes(E, R, STAR9.map(([x, lz]) => [x, lz, 1.4]), 0xffe08a); this.tg.forEach(g => faceCenter(g, R));
    this.sw = [R.ghost({ home: [0, 13], look: 'blob', tint: 0x1a2a1a, scale: .6, sp: 2.2, radius: 6, label: 'a scarab swarm', b: [-9.5, 9.5, 2, 16] })];
    this.orbs = orbRow(E, R, 3, -1.3, 2, 1.3, 1.6);
  },
  init(){ return { m: [2, 2, 2, 1, 1], lit: [0, 0, 0] }; },
  solve(st, R){ st.lit = [1, 1, 1]; R.open('gate'); },
  boltTargets(st, R){ return STAR9.map(([x, lz], i) => st.lit[i] ? null : [x, R.Z(lz), i, 1.1]).filter(Boolean); },
  onBoltTarget(st, R, E, id){ st.lit[id] = 1; const n = st.lit.filter(Boolean).length; E.ev('chime', n < 3 ? `A star gem blazes! (${n}/3)` : '', id); if (n === 3){ R.open('exit'); R.open('gate'); E.ev('door', 'Three stars align — the gate and the door open!'); } },
  boltStep(st, R, E, b){ MIR9.forEach(([x, lz], i) => { if (b.mi === i) return; if (Math.hypot(b.x - x, b.z - R.Z(lz)) < .55){ const vx = b.vx, vl = -b.vz; let nx, nl; if (st.m[i] === 1){ nx = vl; nl = vx; } else { nx = -vl; nl = -vx; } b.vx = nx; b.vz = -nl; b.x = x; b.z = R.Z(lz); b.mi = i; b.t = Math.max(b.t, 1.1); E.ev('zap'); } }); },
  host(dt, st, R, E){ PAD9.forEach((_, i) => { if (R.edge('p' + i)){ st.m[i] = st.m[i] === 1 ? 2 : 1; E.ev('click'); } }); },
  visual(dt, t, st, R, E){ this.mm.forEach((g, i) => { const target = st.m[i] === 1 ? -Math.PI / 4 : Math.PI / 4; g.rotation.y += (target - g.rotation.y) * E.damp(10, dt); }); this.tg.forEach((g, i) => g.userData.gem.material.emissiveIntensity = st.lit[i] ? 2.5 : .3); setOrbs(this.orbs, st.lit.filter(Boolean).length); },
  objective(st, R, E){ return R.isOpen('exit') ? 'The door is open!' : `Hit the 3 star gems hidden behind the top wall with <b>freeze bolts</b>, bounced off the bronze mirrors (step on a ⟲ pad to turn one). (${st.lit.filter(Boolean).length}/3)`; }
};

/* =============================================================== */
const GUARD10 = [[-6, 6], [6, 6], [-6, 17], [6, 17]];
const pharaoh = {
  name: 'The Pharaoh',
  floor: sandstone,
  notes: [[0, 1.4, '“Four guardians hold the Pharaoh\'s shield. Freeze them all at once.”', 1.4]],
  hint: 'The Pharaoh\'s golden shield is powered by his four mummy guards. Freeze all four with bolts so they\'re frozen at the SAME time — the shield drops for a few seconds. Then bolt the Pharaoh himself. Three hits! Scarabs pour in as he weakens.',
  build(R, E){
    EE = E; const T = E.THREE;
    this.g = GUARD10.map(([x, lz]) => mummy(R, E, [x, lz], { sp: 1.2, radius: 5, b: [x - 3, x + 3, lz - 3, lz + 3], gone: st => st.done }));
    this.boss = R.ghost({ home: [0, 12], look: 'crown', tint: 0xd4af37, scale: 2, sp: 0, flashImmune: true, label: 'the Pharaoh', gone: st => st.done, think: (g, dt, st, R2, E2, P) => { const a = E2.elapsed * .4; const tx = Math.sin(a) * 3.5, tz = R2.Z(12 + Math.cos(a * 1.3) * 3); E2.stepToward(g, tx, tz, 2, dt); E2.ghostTouch(g, E2.targetsOf(g, P), E2.names(), 1.5); return true; } });
    this.boss.noStun = true;
    this.shield = new T.Mesh(new T.SphereGeometry(2.2, 20, 14), new T.MeshStandardMaterial({ color: 0xffd34a, emissive: 0xffa020, emissiveIntensity: .6, transparent: true, opacity: .3, depthWrite: false })); this.shield.position.y = 1.4; this.boss.mesh.add(this.shield);
    this.sw = [0, 1, 2].map(k => R.ghost({ home: [k === 1 ? 9 : -9, k === 2 ? 2 : 21], look: 'blob', tint: 0x1a2a1a, scale: .6, sp: 2.5, radius: 8, label: 'a scarab swarm', gone: st => st.hits <= k || st.done }));
    this.orbs = orbRow(E, R, 3, -1.3, 21.4, 1.3, 3);
  },
  init(){ return { hits: 0, open: 0, done: 0, cd: 0 }; },
  solve(st){ st.hits = 3; st.done = 1; },
  onBoltHit(st, R, E, g){ if (this.g.includes(g)){ if (E.solo()) g.stun = 12; return; } if (g !== this.boss || !(st.open > 0) || st.done || st.cd > 0) return; st.hits++; st.cd = 1.5; st.open = 0; E.ev('boom', st.hits < 3 ? `The bolt strikes the Pharaoh! (${st.hits}/3) The shield returns — and scarabs pour in!` : ''); if (st.hits >= 3){ st.done = 1; R.open('exit'); E.ev('door', 'The Pharaoh crumbles to dust. The tomb is yours — the doors open!'); } },
  host(dt, st, R, E){
    if (st.done) return;
    st.cd = Math.max(0, st.cd - dt);
    if (st.open > 0) st.open = Math.max(0, st.open - dt);
    else if (this.g.every(g => g.stun > .3)){ st.open = 4; E.ev('gong', 'All four guards are frozen — the Pharaoh\'s shield drops! Bolt him NOW!', 80); }
  },
  visual(dt, t, st, R, E){ this.shield.visible = !(st.open > 0); this.shield.material.opacity = .25 + Math.sin(t * 4) * .05; iceShow(this.g, E); setOrbs(this.orbs, st.hits); },
  objective(st, R, E){ return st.done ? 'The Pharaoh is dust — escape the tomb!' : st.open > 0 ? '<b>The shield is DOWN — bolt the Pharaoh!</b>' : `Freeze all <b>4 mummy guards at the same time</b> with bolts to drop the Pharaoh's shield, then bolt him. (${st.hits}/3)`; }
};

export default {
  level: 15,
  // texture pack in tex/level15/ (Poly Haven + Blender-baked by Claude Desktop; see README.txt there)
  decor: { kind: 'panel', tex: 'lapis', w: 1.1, h: 1.5, y: 1.4, every: 6, frame: true, metalness: .2, roughness: .4, color: 0x1a2a8a },   // wall dressing: lapis panels (engine wallDecor)
  wallImg: 'glyph_wall', trimImg: 'tomb_gold', texVer: 1,
  texFloors: {
    "The Antechamber": "ante_sandstone",
    "The Scarab Nest": "scarab_sand",
    "The Hall of Anubis": "anubis_basalt",
    "The Canopic Shrine": "canopic_tiles",
    "The Sand Chutes": "chute_sand",
    "The Blade Corridor": "blade_stone",
    "The Sphinx's Riddles": "sphinx_slabs",
    "The Sarcophagus Hall": "granite_floor",
    "The Star Shafts": "lapis_stars",
    "The Pharaoh": "pharaoh_gold"
  },
  title: 'The Pharaoh\'s Tomb',
  tagline: 'Sealed for four thousand years.<br>Something inside has been waiting.',
  story: 'The sand has buried the pyramid to its neck. Inside, the dead still walk their halls — and they do not fear the light.',
  winTitle: 'Out of the tomb! 🏺',
  feature: { name: 'Freeze Bolt', icon: '❄️', how: 'Tap <b>☀</b> (F) <b>while moving</b> to fire an icy bolt the way you\'re going. It freezes most enemies solid for a few seconds, and breaks things. Recharges in 3 s. (Standing still, ☀ is still a flash.)' },
  accent: '#ffd38a',
  wallColor: 0x9a7a4a,
  trimColor: 0xd4af37,
  doorColor: 0x5a3a1a,
  sky: 0xe8c88a,
  bg: 0x1a1008,
  drone: 38,
  rooms: [antechamber, scarabs, anubis, canopic, sand, blades, sphinx, sarcophagi, shafts, pharaoh],
};
