// Small shared helpers for level room files (Levels 4+).
export function arrivals(R, key, P, cellOf){
  const prev = R.local[key] || (R.local[key] = [-1, -1]), out = [];
  for (const p of P){
    const c = p.frozen ? -1 : cellOf(p.pos);
    if (c !== prev[p.idx] && c >= 0) out.push({ idx: p.idx, cell: c });
    prev[p.idx] = c;
  }
  return out;
}
export function orbRow(E, R, n, x0, lz, dx = 1.3, y = 2){
  const arr = [];
  for (let i = 0; i < n; i++){ const o = new E.THREE.Mesh(new E.THREE.SphereGeometry(.2, 12, 10), E.glow(0x333344, .2)); R.place(o, x0 + i * dx, lz, y); arr.push(o); }
  return arr;
}
export function setOrbs(orbs, k){ orbs.forEach((o, i) => { const on = i < k; o.material.color.setHex(on ? 0x8affc1 : 0x333344); o.material.emissive.setHex(on ? 0x4dff9a : 0x222233); o.material.emissiveIntensity = on ? 1.4 : .2; }); }
export function textPlane(E, w, h, emissive = .7){
  const tex = E.canvasTex(256, Math.round(256 * h / w), () => {});
  const m = new E.THREE.Mesh(new E.THREE.PlaneGeometry(w, h), new E.THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive, transparent: true }));
  m.userData.tex = tex; return m;
}
export function redraw(mesh, draw){ const t = mesh.userData.tex, c = t.image.getContext('2d'); c.clearRect(0, 0, t.image.width, t.image.height); draw(c, t.image.width, t.image.height); t.needsUpdate = true; }
export function sign(E, R, x, lz, text, w = 5, y = 1.7){
  const m = textPlane(E, w, 1.1); R.place(m, x, lz, y);
  redraw(m, (c, W, H) => { c.fillStyle = '#120d1a'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffe9b0'; c.font = 'bold 34px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2); });
  return m;
}
let _water = null;
export function waterMat(E){
  if (_water) return _water;
  const tex = E.tiledTex(128, 128, (x, w, h) => { x.fillStyle = '#0e3a5a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(160,220,255,.25)'; x.lineWidth = 2; for (let i = 0; i < 8; i++){ x.beginPath(); const y = i * 16 + 8; x.moveTo(0, y); x.bezierCurveTo(w * .3, y - 6, w * .6, y + 6, w, y); x.stroke(); } }, 6, 6);
  _water = new E.THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: .15, metalness: .2, emissive: 0x0a2a4a, emissiveIntensity: .5, transparent: true, opacity: .92 });
  return _water;
}
export function plankMat(E){ return E.mat(0xffffff, { map: E.tiledTex(64, 64, (x, w, h) => { x.fillStyle = '#8a6238'; x.fillRect(0, 0, w, h); x.fillStyle = '#6a4826'; for (let i = 0; i < 4; i++) x.fillRect(0, i * 16 + 14, w, 2); }, 2, 2) }); }
export const near = (R, p, x, lz, r) => Math.hypot(p.pos.x - x, R.lz(p.pos.z) - lz) < r;
export const inRect = (R, pos, x1, lz1, x2, lz2) => pos.x > x1 && pos.x < x2 && R.lz(pos.z) > lz1 && R.lz(pos.z) < lz2;
// Hollow Knight: an empty suit of armour. Can't be stunned (flash, throws, bolts do nothing) and can't pass ANY wall —
// not even ghost walls — so it gets stuck behind them while you phase through.
export function knight(R, E, home, opt = {}){
  return R.ghost({ home, look: 'knight', tint: opt.tint || 0x8a8aa6, sp: 0, flashImmune: true, noStun: true, label: opt.label || 'a Hollow Knight', b: opt.b, scale: opt.scale, gone: opt.gone, touch: opt.touch,
    think: (g, dt, st, R2, E2, P) => {
      const m = g.mem;
      if (opt.idle && opt.idle(st)){ return true; }
      const sp = (typeof opt.sp === 'function' ? opt.sp(st) : (opt.sp || 2.4)) * E2.GMULT;
      const T = E2.targetsOf(g, P).filter(p => R2.inside(p.pos) && (!opt.wants || opt.wants(g, p, st)));
      let best = null, bd = opt.radius || 40;
      for (const p of T){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
      let tx = g.home[0], tz = g.home[1];
      if (best){ tx = best.pos.x; tz = best.pos.z; } else if (opt.patrol){ const pts = opt.patrol; m.pi = m.pi || 0; const [px, pl] = pts[m.pi]; tx = px; tz = R2.Z(pl); if (Math.hypot(g.x - tx, g.z - tz) < .3) m.pi = (m.pi + 1) % pts.length; }
      const ox = g.x, oz = g.z;
      E2.stepToward(g, tx, tz, best ? sp : sp * .6, dt);
      const rects = E2.staticRects(); E2.resolve(g, rects);
      if (opt.b){ g.x = E2.clamp(g.x, g.b[0], g.b[1]); g.z = E2.clamp(g.z, g.b[2], g.b[3]); }
      m.stuck = Math.hypot(g.x - ox, g.z - oz) < sp * dt * .25 && best ? (m.stuck || 0) + dt : 0;
      if (opt.onStep) opt.onStep(g, dt, st, m, best);
      E2.ghostTouch(g, T, E2.names(), opt.touch || .95);
      return true;
    } });
}
