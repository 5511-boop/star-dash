// Hollow Manor shared engine (Levels 2+). A level supplies a list of room plugins; the engine handles
// the house layout, players, ghosts, plates, doors, networking (PeerJS), HUD and menus.
export function run(THREE, CFG){

/* ===================== helpers ===================== */
const $ = id => document.getElementById(id);
const isTouch = typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch {} }
};
const PREFIX = 'hollowmanor-hh26-';
const LEVEL = CFG.level;
const COLORS = [0x5aa2ff, 0xff6fae];
const CSSCOL = ['#5aa2ff', '#ff6fae'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = s => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const LEVELS = [{ n: 1, name: 'Hollow Manor' }, { n: 2, name: 'Grimwood Carnival' }, { n: 3, name: 'The Clocktower' }];
function levelUrl(n){
  const p = location.pathname, i = p.indexOf('/haunted/');
  const base = i >= 0 ? p.slice(0, i + 9) : (LEVEL === 1 ? './' : '../');
  return base + (n === 1 ? '' : 'level' + n + '/');
}

/* ===================== DOM ===================== */
const accent = CFG.accent || '#9b6bff';
const style = document.createElement('style');
style.textContent = `
  :root{ --ink:#ece6ff; --dim:#a99fc9; --card:#16122aee; --pink:#ff6fae; --gold:#ffc46b; --accent:${accent}; }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0;height:100%;overflow:hidden;background:#05060c;font-family:Georgia,"Times New Roman",serif;color:var(--ink);
    position:fixed;inset:0;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  #c{position:fixed;inset:0;width:100vw;height:100vh;display:block}
  [hidden]{display:none!important}
  .screen{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;z-index:20;background:radial-gradient(circle at 50% 40%,#0000 0%,#000a 80%)}
  .card{background:var(--card);border:1px solid #ffffff1a;border-radius:20px;padding:24px 22px;width:min(390px,100%);text-align:center;box-shadow:0 20px 60px #000c;max-height:calc(100% - 8px);overflow:auto}
  h1{margin:0 0 2px;font-size:38px;letter-spacing:1px;font-weight:700;color:#efe8ff;text-shadow:0 0 18px var(--accent)}
  .lvl{font-family:system-ui,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px;color:var(--accent);margin-bottom:6px}
  h2{margin:0 0 8px;font-size:26px}
  .sub{margin:0 0 16px;color:var(--dim);font-size:15px;line-height:1.4}
  label{display:block;text-align:left;font-size:13px;margin-bottom:12px;color:var(--dim)}
  input,select{font:inherit;font-family:system-ui,sans-serif;font-size:18px;width:100%;padding:11px 14px;border-radius:12px;border:2px solid #3a3160;margin-top:6px;
    background:#0d0b1a;color:var(--ink);-webkit-user-select:text;user-select:text}
  select{font-size:16px;-webkit-appearance:none;appearance:none}
  .two{display:flex;gap:8px}.two label{flex:1}
  input:focus,select:focus{outline:none;border-color:var(--accent)}
  button{font:inherit;font-family:system-ui,sans-serif;cursor:pointer;border:0;border-radius:14px;padding:13px 16px;font-weight:700;font-size:17px;background:#2a2446;color:var(--ink)}
  button:disabled{opacity:.45;cursor:default}
  .big{width:100%;background:var(--accent);color:#fff;font-size:19px;padding:15px;margin-bottom:12px}
  .join{display:flex;gap:8px;margin-bottom:10px}
  .join input{margin:0;text-transform:uppercase;letter-spacing:4px;text-align:center;font-weight:700}
  .join button{background:var(--pink);color:#fff;flex:0 0 auto;padding:0 20px}
  .link{background:none;font-weight:600;font-size:15px;color:var(--dim);padding:8px}
  #status,#lobbyMsg{min-height:20px;font-size:14px;margin:8px 0 0;color:var(--dim)}
  .code{font-size:54px;font-weight:800;letter-spacing:10px;margin:4px 0 6px;color:var(--gold);font-family:system-ui,sans-serif}
  .rows{margin:14px 0 16px;display:grid;gap:6px}
  .row{display:flex;justify-content:space-between;background:#ffffff0d;border-radius:10px;padding:10px 12px;font-family:system-ui,sans-serif;font-weight:600}
  #hud{position:fixed;inset:0;pointer-events:none;z-index:10;padding:calc(10px + env(safe-area-inset-top)) 12px 0;font-family:system-ui,sans-serif}
  #hudTop{display:flex;justify-content:center;gap:8px;align-items:center}
  .pill{background:#0b0918cc;border:1px solid #ffffff1f;border-radius:999px;padding:6px 14px;font-weight:700;font-size:15px}
  #roomName{font-family:Georgia,serif;font-size:16px}
  #objective{margin:8px auto 0;max-width:560px;text-align:center;background:#0b0918b3;border-radius:12px;padding:8px 12px;font-size:14px;line-height:1.35;color:#ddd5ff}
  #panel{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);background:#120d22ee;border:2px solid var(--accent);border-radius:18px;padding:14px 18px;text-align:center;
    width:min(420px,calc(100% - 24px));font-size:16px;line-height:1.45}
  #panel .big1{font-size:30px;font-weight:800;color:var(--gold);font-family:system-ui,sans-serif}
  #barWrap{margin:8px auto 0;width:min(320px,80%);height:12px;border-radius:6px;background:#ffffff22;overflow:hidden;position:relative}
  #barWrap i{position:absolute;left:0;top:0;bottom:0;background:var(--gold)}
  #barLbl{text-align:center;font-size:12px;font-weight:700;margin-top:3px;color:#fff;text-shadow:0 1px 3px #000}
  #toast{position:absolute;left:50%;top:calc(132px + env(safe-area-inset-top));transform:translateX(-50%);background:#000c;color:#fff;padding:8px 16px;border-radius:12px;
    font-weight:700;font-size:15px;opacity:0;transition:opacity .25s;max-width:calc(100% - 24px);text-align:center}
  #toast.show{opacity:1}
  #story{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,calc(100% - 32px));text-align:center;background:#0b0918e6;border:1px solid #ffffff22;
    border-radius:18px;padding:20px;font-family:Georgia,serif;font-size:17px;line-height:1.5;opacity:0;transition:opacity .6s}
  #story.show{opacity:1}
  #story b{color:var(--gold)}
  #hint{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:13px;color:#ffffff88}
  #stam{position:absolute;right:calc(26px + env(safe-area-inset-right));bottom:calc(176px + env(safe-area-inset-bottom));width:92px;height:8px;border-radius:4px;background:#ffffff22;overflow:hidden}
  #stam i{display:block;height:100%;width:100%;background:var(--gold)}
  body:not(.touch) #stam{left:50%;right:auto;transform:translateX(-50%);bottom:36px}
  #arrow{position:absolute;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-bottom:22px solid var(--pink);transform-origin:50% 60%;filter:drop-shadow(0 0 6px #000)}
  #flash{position:fixed;inset:0;background:#9fd8ff;opacity:0;pointer-events:none;z-index:9;transition:opacity .5s}
  #flash.on{opacity:.4;transition:none}
  #frost{position:fixed;inset:0;pointer-events:none;z-index:9;opacity:0;transition:opacity .3s;background:radial-gradient(circle at 50% 50%,#0000 35%,#a8e4ff66 75%,#d8f3ffaa 100%)}
  #frost.on{opacity:1}
  #touch{position:fixed;inset:0;z-index:8}
  #joyBase{position:absolute;width:120px;height:120px;border-radius:50%;background:#ffffff1c;border:3px solid #ffffff55;left:calc(30px + env(safe-area-inset-left));bottom:calc(40px + env(safe-area-inset-bottom))}
  #joyKnob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:#ffffffaa}
  #runBtn{position:absolute;right:calc(24px + env(safe-area-inset-right));bottom:calc(52px + env(safe-area-inset-bottom));width:100px;height:100px;border-radius:50%;background:#ffc46b44;border:3px solid #ffc46bcc;font-size:17px;font-weight:900;color:#fff;padding:0}
  #runBtn.on{background:#ffc46b99}
  #btnExit{position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:11;padding:6px 12px;font-size:13px;background:#0b0918cc;border:1px solid #ffffff22}`;
document.head.appendChild(style);
document.body.innerHTML = `
<canvas id="c"></canvas><div id="flash"></div><div id="frost"></div>
<div id="hud" hidden>
  <div id="hudTop"><div class="pill" id="roomName"></div><div class="pill" id="timer">0:00</div></div>
  <div id="objective"></div>
  <div id="barBox" hidden><div id="barWrap"><i id="barFill"></i></div><div id="barLbl"></div></div>
  <div id="panel" hidden></div>
  <div id="toast"></div><div id="story"></div>
  <div id="stam"><i></i></div><div id="arrow" hidden></div>
  <div id="hint">WASD / arrows to move · hold Shift to run</div>
</div>
<button id="btnExit" hidden>Leave</button>
<div id="touch" hidden><div id="joyBase"><div id="joyKnob"></div></div><button id="runBtn">RUN</button></div>
<div id="menu" class="screen"><div class="card">
  <div class="lvl">LEVEL ${LEVEL}</div>
  <h1>${esc(CFG.title)}</h1>
  <p class="sub">${CFG.tagline}</p>
  <label>Your name<input id="name" maxlength="12" autocomplete="off" placeholder="Name"></label>
  <div class="two"><label>Level<select id="levelSel"></select></label><label>Start at<select id="startRoom"></select></label></div>
  <button id="btnHost" class="big">Create game</button>
  <div class="join"><input id="code" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false"><button id="btnJoin">Join</button></div>
  <button id="btnSolo" class="link">Explore solo (test mode)</button>
  <p id="status"></p>
</div></div>
<div id="lobby" class="screen" hidden><div class="card">
  <h2>Room code</h2><div class="code" id="roomCode">····</div><p id="lobbyMsg">Connecting…</p>
  <button id="btnStart" class="big" disabled>Enter</button><button id="btnLeave" class="link">Leave</button>
</div></div>
<div id="won" class="screen" hidden><div class="card">
  <h2 id="wonTitle">You escaped! 🌙</h2><p class="sub" id="wonSub"></p><div class="rows" id="wonRows"></div>
  <button id="btnNext" class="big" hidden>Next level →</button>
  <button id="btnAgain" class="big">Play again</button><button id="btnMenu" class="link">Back to menu</button>
</div></div>`;
if (isTouch) document.body.classList.add('touch');

/* ===================== audio ===================== */
let actx = null, droneGain = null, whisperGain = null;
function unlockAudio(){
  try {
    if (!actx){
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), o2 = actx.createOscillator(); droneGain = actx.createGain();
      o.type = 'sine'; o.frequency.value = CFG.drone || 55; o2.type = 'sine'; o2.frequency.value = (CFG.drone || 55) + .7;
      droneGain.gain.value = 0.04; o.connect(droneGain); o2.connect(droneGain); droneGain.connect(actx.destination); o.start(); o2.start();
      const len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const n = actx.createBufferSource(); n.buffer = buf; n.loop = true;
      const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
      whisperGain = actx.createGain(); whisperGain.gain.value = 0;
      n.connect(f).connect(whisperGain).connect(actx.destination); n.start();
    }
    if (actx.state === 'suspended') actx.resume();
  } catch {}
}
function beep(freq, dur = 0.12, type = 'sine', vol = 0.12, slide = 0, delay = 0){
  if (!actx) return;
  const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  door(){ beep(70, .9, 'sawtooth', .07, -30); beep(110, .6, 'triangle', .06, -50, .1); },
  click(){ beep(300, .06, 'square', .05); },
  chime(n = 0){ beep(660 + n * 110, .25, 'triangle', .12); },
  wrong(){ beep(160, .35, 'sawtooth', .1, -60); beep(120, .4, 'square', .05, -40, .05); },
  freeze(){ beep(1400, .5, 'sine', .08, -1100); beep(90, .6, 'sawtooth', .08, -40); },
  thaw(){ [520, 660, 880].forEach((f, i) => beep(f, .15, 'triangle', .09, 0, i * .07)); },
  pick(){ beep(500, .12, 'triangle', .1, 200); },
  place(){ beep(700, .2, 'triangle', .1); beep(1050, .3, 'triangle', .08, 0, .1); },
  win(){ [523, 659, 784, 1047].forEach((f, i) => beep(f, .35, 'triangle', .12, 0, i * .14)); },
  boo(){ beep(240, .7, 'sine', .1, -150); },
  zap(){ beep(1300, .18, 'square', .07, -1000); beep(70, .35, 'sawtooth', .1, -20); },
  thud(){ beep(90, .18, 'square', .07, -40); },
  fall(){ beep(600, .6, 'sine', .1, -520); },
  tone(f, d = .7, delay = 0, type = 'triangle'){ beep(f, d, type, .13, 0, delay); },
  laugh(){ [420, 380, 440, 360].forEach((f, i) => beep(f, .1, 'square', .05, 0, i * .09)); },
  beat(){ beep(60, .2, 'sine', .25, -20); beep(2000, .03, 'square', .03); },
  tick(){ beep(1800, .03, 'square', .04); },
  whoosh(){ beep(300, .4, 'sawtooth', .04, 400); },
  gong(f = 110){ beep(f, 1.6, 'sine', .14); beep(f * 2.01, 1.2, 'sine', .05); },
};

/* ===================== renderer / scene ===================== */
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const BG = CFG.bg || 0x05060c;
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 20, 42);
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300);
function resize(){ renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
scene.add(new THREE.HemisphereLight(CFG.sky || 0x6a6fa8, 0x15121f, CFG.ambient || 0.8));
const moon = new THREE.DirectionalLight(0x9aa8ff, 0.45); moon.position.set(-10, 30, 10); scene.add(moon);
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .9, metalness: 0, ...o });
const glow = (c, i = 1) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: .6 });
function canvasTex(w, h, draw){
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function tiledTex(w, h, draw, rx, ry){ const t = canvasTex(w, h, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }
function symTex(color, sym, fg = '#15101f'){
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color; c.fillRect(0, 0, w, h);
    c.fillStyle = fg; c.font = 'bold 76px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sym, 64, 70);
  });
}

/* ===================== map helpers ===================== */
const WALL_H = 2.4;
const RECTS = [];
const wallMat = CFG.wallTex ? mat(0xffffff, { map: canvasTex(128, 128, CFG.wallTex) }) : mat(CFG.wallColor || 0x3a2b4d);
const trimMat = mat(CFG.trimColor || 0x5c4670);
function block(x1, z1, x2, z2, h, m, collide = true){
  if (x1 > x2) [x1, x2] = [x2, x1]; if (z1 > z2) [z1, z2] = [z2, z1];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, h, z2 - z1), m);
  mesh.position.set((x1 + x2) / 2, h / 2, (z1 + z2) / 2); scene.add(mesh);
  if (collide) RECTS.push({ x1, x2, z1, z2 });
  return mesh;
}
function wallBox(x1, z1, x2, z2, h = WALL_H){
  if (x1 > x2) [x1, x2] = [x2, x1]; if (z1 > z2) [z1, z2] = [z2, z1];
  block(x1, z1, x2, z2, h, wallMat);
  const t = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1 + .08, .14, z2 - z1 + .08), trimMat);
  t.position.set((x1 + x2) / 2, h, (z1 + z2) / 2); scene.add(t);
}
const hwall = (z, x1, x2) => wallBox(x1, z - .5, x2, z + .5);
const vwall = (x, z1, z2) => wallBox(x - .5, Math.min(z1, z2), x + .5, Math.max(z1, z2));
function floor(x1, z1, x2, z2, m, y = 0){
  if (x1 > x2) [x1, x2] = [x2, x1]; if (z1 > z2) [z1, z2] = [z2, z1];
  const f = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m);
  f.rotation.x = -Math.PI / 2; f.position.set((x1 + x2) / 2, y, (z1 + z2) / 2); scene.add(f); return f;
}

/* ===================== doors & plates ===================== */
const DOOR_IDS = [], DOORS = {};
function makeDoor(id, x1, z1, x2, z2, style = 'wood'){
  if (x1 > x2) [x1, x2] = [x2, x1]; if (z1 > z2) [z1, z2] = [z2, z1];
  const g = new THREE.Group(); const w = x2 - x1, d = z2 - z1;
  if (style === 'gate'){
    const barMat = mat(0x2a2a33, { metalness: .7, roughness: .4 });
    const along = w > d, len = along ? w : d, n = Math.max(2, Math.round(len / .32));
    for (let i = 0; i <= n; i++){
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, WALL_H, 6), barMat);
      const o = -len / 2 + i * len / n; b.position.set(along ? o : 0, WALL_H / 2, along ? 0 : o); g.add(b);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(along ? len : .14, .14, along ? .14 : len), barMat); top.position.y = WALL_H - .1; g.add(top);
  } else {
    const dm = mat(style === 'front' ? 0x5a1f1f : (CFG.doorColor || 0x5b3a22));
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, Math.max(.2, d * .7)), dm); slab.position.y = WALL_H / 2; g.add(slab);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), mat(0xd4af37, { metalness: .8, roughness: .3 }));
    knob.position.set(w * .3, 1.1, d * .4); g.add(knob);
  }
  g.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2); scene.add(g);
  DOORS[id] = { rect: { x1, x2, z1, z2 }, mesh: g }; DOOR_IDS.push(id);
}
const PLATE_IDS = [], PLATES = {};
function makePlate(id, x, z, color, s = 1.6, sym = null, opt = {}){
  let m = null, mesh = null;
  if (!opt.hidden){
    if (sym !== null){ const tex = symTex(color, sym); m = new THREE.MeshStandardMaterial({ map: tex, emissive: color, emissiveMap: tex, emissiveIntensity: .25, roughness: .6 }); }
    else m = glow(color, .35);
    mesh = new THREE.Mesh(new THREE.BoxGeometry(s, .12, s), m); mesh.position.set(x, .06, z); scene.add(mesh);
  }
  PLATES[id] = { x, z, s, mesh, mat: m, force: undefined, room: opt.room ?? -1 }; PLATE_IDS.push(id);
}
const onPlate = (p, pos) => Math.abs(pos.x - p.x) < p.s / 2 && Math.abs(pos.z - p.z) < p.s / 2;

/* ===================== characters ===================== */
function nameSprite(){
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, fog: false }));
  sp.scale.set(2.4, .6, 1); sp.renderOrder = 10;
  let last = '';
  sp.setText = (txt, col) => {
    if (txt + col === last) return; last = txt + col;
    const x = cv.getContext('2d'); x.clearRect(0, 0, 256, 64);
    x.font = 'bold 32px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const w = Math.min(250, x.measureText(txt).width + 30);
    x.fillStyle = 'rgba(10,8,20,.75)'; x.beginPath(); if (x.roundRect) x.roundRect(128 - w / 2, 8, w, 48, 24); else x.rect(128 - w / 2, 8, w, 48); x.fill();
    x.fillStyle = col; x.fillText(txt, 128, 33); tex.needsUpdate = true;
  };
  return sp;
}
const flameMat = glow(0xffa53a, 2.2);
function makeChar(color, ghostly = false){
  const group = new THREE.Group(), rig = new THREE.Group(); group.add(rig);
  const bodyMat = mat(color, { roughness: .5, transparent: ghostly, opacity: ghostly ? .4 : 1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.4, .5, 6, 14), bodyMat); body.position.y = .68; rig.add(body);
  const eyeW = mat(0xffffff, { roughness: .3, transparent: ghostly, opacity: ghostly ? .5 : 1 }), eyeB = mat(0x111111);
  for (const s of [-1, 1]){
    const e = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 10), eyeW); e.position.set(s * .15, .98, .33); rig.add(e);
    const p = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), eyeB); p.position.set(s * .15, .98, .42); rig.add(p);
    const f = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), bodyMat); f.scale.set(1, .6, 1.3); f.position.set(s * .2, .08, .05); rig.add(f);
  }
  const out = { group, rig, body, bodyMat, t: 0 };
  if (!ghostly){
    const lant = new THREE.Group(); lant.position.set(.45, .7, .25); rig.add(lant);
    lant.add(new THREE.Mesh(new THREE.BoxGeometry(.2, .26, .2), glow(0xffcf7a, 1.6)));
    out.light = new THREE.PointLight(0xffb36b, 6, 15, 1); out.light.position.set(0, 2.2, 0); group.add(out.light);
    out.ice = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 1.1), new THREE.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: .45, roughness: .1, emissive: 0x4fb6ff, emissiveIntensity: .35 }));
    out.ice.position.y = .8; out.ice.visible = false; group.add(out.ice);
    out.hold = new THREE.Group(); out.hold.position.set(0, 1.9, 0); group.add(out.hold);     // things carried overhead
    out.label = nameSprite(); out.label.position.y = 2.25; group.add(out.label);
  }
  scene.add(group);
  return out;
}
function animChar(c, dt, moving, running){
  c.t += dt * (moving ? (running ? 16 : 11) : 2.5);
  const bob = moving ? Math.abs(Math.sin(c.t)) * .15 : Math.sin(c.t) * .025;
  c.rig.position.y = bob; c.rig.rotation.z = moving ? Math.sin(c.t) * .07 : 0;
  if (c.light) c.light.intensity = 6 + Math.sin(performance.now() * .013) * .4 + Math.sin(performance.now() * .031) * .3;
}

/* ===================== ghosts ===================== */
const GHOSTS = [];
const ghostMat = new THREE.MeshStandardMaterial({ color: 0xeaf2ff, emissive: 0x9fc4ff, emissiveIntensity: .55, transparent: true, opacity: .82, roughness: .5, side: THREE.DoubleSide });
function ghostMesh(look, tint){
  const gm = tint ? new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: .5, transparent: true, opacity: .85, roughness: .5, side: THREE.DoubleSide }) : ghostMat;
  const grp = new THREE.Group();
  if (look === 'wisp'){
    const b = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 12), gm); b.position.y = .9; b.scale.set(1.2, .9, 1.5); grp.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 10), gm); h.position.set(0, 1.35, .55); grp.add(h);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.2, .8, 8), gm); tail.position.set(0, 1, -.75); tail.rotation.x = -1.2; grp.add(tail);
    const eye = new THREE.MeshBasicMaterial({ color: 0x0b0710 });
    for (const s of [-1, 1]){ const e = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), eye); e.position.set(s * .12, 1.42, .78); grp.add(e); }
    return grp;
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 18, 14), gm); head.position.y = 1.55; grp.add(head);
  const skirtGeo = new THREE.CylinderGeometry(.55, .78, 1.2, 18, 3, true);
  const pos = skirtGeo.attributes.position;
  for (let i = 0; i < pos.count; i++){ if (pos.getY(i) < -.5){ const a = Math.atan2(pos.getZ(i), pos.getX(i)); pos.setY(i, pos.getY(i) + Math.sin(a * 6) * .12); } }
  skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, gm); skirt.position.y = .95; grp.add(skirt);
  const eye = new THREE.MeshBasicMaterial({ color: 0x0b0710 });
  for (const s of [-1, 1]){ const e = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), eye); e.scale.set(1, 1.5, .5); e.position.set(s * .2, 1.62, .5); grp.add(e); }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), eye); mouth.scale.set(1, 1.3, .4); mouth.position.set(0, 1.32, .52); grp.add(mouth);
  for (const s of [-1, 1]){ const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .4, 4, 8), gm); arm.position.set(s * .62, 1.15, .2); arm.rotation.set(-.9, 0, s * .4); grp.add(arm); }
  if (look === 'big') grp.scale.setScalar(1.6);
  return grp;
}

/* ===================== state ===================== */
let role = null, phase = 'menu';
let myName = store.get('hm_name', '');
let remoteName = 'Partner';
const reachKey = 'hm_reached_L' + LEVEL;
let reached = parseInt(store.get(reachKey, '0')) || 0;
const myIdx = () => role === 'guest' ? 1 : 0;
const names = () => myIdx() === 0 ? [myName || 'You', remoteName] : [remoteName, myName || 'You'];
const SOLO = () => role === 'solo';
const ECHO = 5;
const S = { doors: {}, plateOn: {}, frozen: [0, 0], freezes: 0, elapsed: 0, startRoom: 0, rs: [] };
const hostMem = {};
const me = { pos: new THREE.Vector3(0, 0, 6), ry: Math.PI, moving: false, running: false, stamina: 2.5, slide: null, inp: [0, 0, 0] };
const other = { target: new THREE.Vector3(0, 0, 6), ry: 0, moving: false, running: false, seen: false, inp: [0, 0, 0] };
let curP = [];
const edges = {}, held = {};

/* ===================== rooms ===================== */
const ROOMS = [];
let zCursor = 10;
CFG.rooms.forEach((def, i) => {
  const depth = def.depth || 22;
  const R = { def, i, depth, zS: zCursor, zN: zCursor - depth, local: {} };
  zCursor -= depth;
  R.name = def.name;
  R.Z = lz => R.zS - lz;
  R.id = n => n === 'exit' ? 'X' + i : i + ':' + n;
  R.plate = (n, x, lz, color, s = 1.6, sym = null, opt = {}) => makePlate(R.id(n), x, R.Z(lz), color, s, sym, { ...opt, room: i });
  R.zone = (n, x, lz, s = 1.6) => makePlate(R.id(n), x, R.Z(lz), 0, s, null, { hidden: true, room: i });
  R.door = (n, x1, lz1, x2, lz2, style) => makeDoor(R.id(n), x1, R.Z(lz1), x2, R.Z(lz2), style);
  R.block = (x1, lz1, x2, lz2, h, m, collide = true) => block(x1, R.Z(lz1), x2, R.Z(lz2), h, m, collide);
  R.wall = (x1, lz1, x2, lz2, h) => wallBox(x1, R.Z(lz1), x2, R.Z(lz2), h);
  R.hwall = (lz, x1, x2) => wallBox(x1, R.Z(lz) - .5, x2, R.Z(lz) + .5);
  R.vwall = (x, lz1, lz2) => wallBox(x - .5, R.Z(lz1), x + .5, R.Z(lz2));
  R.floor = (x1, lz1, x2, lz2, m, y = .006) => floor(x1, R.Z(lz1), x2, R.Z(lz2), m, y);
  R.place = (obj, x, lz, y = 0) => { obj.position.set(x, y, R.Z(lz)); scene.add(obj); return obj; };
  R.rect = (x1, lz1, x2, lz2) => ({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(R.Z(lz1), R.Z(lz2)), z2: Math.max(R.Z(lz1), R.Z(lz2)) });
  R.lz = z => R.zS - z;
  R.on = n => !!S.plateOn[R.id(n)];
  R.edge = n => !!edges[R.id(n)];
  R.held = n => !!held[R.id(n)];
  R.at = (n, pos) => onPlate(PLATES[R.id(n)], pos);
  R.plateObj = n => PLATES[R.id(n)];
  R.glow = (n, v) => { PLATES[R.id(n)].force = v; };
  R.open = n => { S.doors[R.id(n)] = 1; };
  R.close = n => { S.doors[R.id(n)] = 0; };
  R.setDoor = (n, v) => { S.doors[R.id(n)] = v ? 1 : 0; };
  R.isOpen = n => !!S.doors[R.id(n)];
  R.inside = pos => pos.z <= R.zS && pos.z > R.zN;
  R.st = () => S.rs[i];
  R.ghost = gdef => {
    const g = { ...gdef, room: i };
    g.b = [gdef.b[0], gdef.b[1], R.Z(gdef.b[3]), R.Z(gdef.b[2])];
    g.home = [gdef.home[0], R.Z(gdef.home[1])];
    g.mesh = ghostMesh(gdef.look || 'normal', gdef.tint); scene.add(g.mesh);
    g.x = g.tx = g.home[0]; g.z = g.tz = g.home[1]; g.y = 0; g.ry = 0; g.rest = 1.5; g.ret = false; g.wx = null; g.wt = 0; g.w = 0; g.mem = {};
    GHOSTS.push(g); return g;
  };
  const sp = def.spawn || [[-1.5, 1.6], [1.5, 1.6]];
  R.spawnW = sp.map(([x, lz]) => [x, R.Z(lz)]);
  ROOMS.push(R);
});
const OUT_Z = zCursor, WIN_Z = OUT_Z - 4;
const roomAt = z => ROOMS.findIndex(R => z <= R.zS && z > R.zN);

/* ----- shell: outer walls, room separators, exits, floors, garden ----- */
vwall(-10.5, 10.5, OUT_Z - .5); vwall(10.5, 10.5, OUT_Z - .5); hwall(10, -11, 11);
ROOMS.forEach((R, i) => {
  const [dx1, dx2] = R.def.exitX || [-1.5, 1.5];
  hwall(R.zN, -11, dx1); hwall(R.zN, dx2, 11);
  makeDoor('X' + i, dx1, R.zN - .4, dx2, R.zN + .4, i === ROOMS.length - 1 ? 'front' : 'wood');
});
floor(-25, OUT_Z - 40, 25, OUT_Z, mat(0x1d3322), .002);
{
  const hedge = mat(0x234a2a);
  block(-5, OUT_Z - 20, -4, OUT_Z - .5, 1.2, hedge); block(4, OUT_Z - 20, 5, OUT_Z - .5, 1.2, hedge); block(-5, OUT_Z - 21, 5, OUT_Z - 20, 1.2, hedge);
  for (let i = 0; i < 16; i++){
    const side = i % 2 ? 1 : -1, x = side * (8 + Math.random() * 12), z = OUT_Z - 3 - Math.random() * 28;
    const tr = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4 + Math.random() * 2, 7), mat(0x14261a)); tr.position.set(x, 2.5, z); scene.add(tr);
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })); m.position.set(-30, 30, OUT_Z - 70); scene.add(m);
}

/* ===================== engine API for rooms ===================== */
const reflCache = {};
let lockMove = false;
let _api = null;
function EAPI(){
  if (_api) return _api;
  _api = {
    THREE, scene, mat, glow, canvasTex, tiledTex, symTex, sfx, beep, clamp, damp, shuffle, mulberry32, esc, fmtTime, COLORS, CSSCOL,
    makeChar, nameSprite, flameMat, WALL_H,
    get P(){ return curP; },
    get elapsed(){ return S.elapsed; },
    get phase(){ return phase; },
    solo: SOLO, names, myIdx,
    me, other,
    ev, toast, flash,
    freeze(idx, secs = 5, msg = ''){ if (S.frozen[idx] > 0) return; S.frozen[idx] = secs; S.freezes++; ev('freeze', msg, idx); },
    isFrozen: idx => S.frozen[idx] > 0,
    teleport(idx, x, z){
      if (idx === myIdx()){ me.pos.set(x, 0, z); me.slide = null; }
      else { other.target.set(x, 0, z); send({ t: 'tp', x, z }); }
    },
    respawnLocal(x, z, msg){ me.pos.set(x, 0, z); me.slide = null; if (msg){ toast(msg); } },
    lock(){ lockMove = true; },
    playerPos(idx){ return idx === myIdx() ? me.pos : (otherChar.group.visible ? otherChar.group.position : null); },
    partnerPresent: () => role !== 'solo' && other.seen,
    rooms: ROOMS,
    roomAt,
  };
  return _api;
}
const E = EAPI();

ROOMS.forEach(R => floor(-10, R.zN, 10, R.zS, R.def.floor ? R.def.floor(E) : mat(0x3a3040), .002));
ROOMS.forEach(R => R.def.build && R.def.build(R, E));

/* ===================== chars ===================== */
const meChar = makeChar(COLORS[0]);
const otherChar = makeChar(COLORS[1]);
otherChar.group.visible = false; meChar.group.visible = false;
const arrowEl = $('arrow');
function applyColors(){
  const mi = myIdx();
  meChar.bodyMat.color.setHex(COLORS[mi]); otherChar.bodyMat.color.setHex(COLORS[1 - mi]);
  arrowEl.style.borderBottomColor = CSSCOL[1 - mi];
}

/* ===================== world reset / chapter select ===================== */
function resetWorld(){
  for (const id of DOOR_IDS) S.doors[id] = 0;
  for (const id of PLATE_IDS){ S.plateOn[id] = 0; hostMem[id] = 0; }
  S.frozen = [0, 0]; S.freezes = 0; S.elapsed = 0; S.startRoom = 0;
  S.rs = ROOMS.map(R => { R.local = {}; return R.def.init ? R.def.init(R, E) : {}; });
  for (const g of GHOSTS){ g.x = g.tx = g.home[0]; g.z = g.tz = g.home[1]; g.y = 0; g.rest = 1.5; g.ret = false; g.wx = null; g.w = 0; g.mem = {}; }
  me.slide = null;
}
function solveUpTo(r){
  S.startRoom = r;
  for (let i = 0; i < r; i++){ const R = ROOMS[i]; if (R.def.solve) R.def.solve(S.rs[i], R, E); R.open('exit'); }
}
resetWorld();

/* ===================== input ===================== */
const keys = {};
addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  keys[e.code] = true;
  if (e.code && (e.code.startsWith('Arrow') || e.code === 'Space')) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 };
let runTouch = false;
{
  const layer = $('touch'), base = $('joyBase'), knob = $('joyKnob'), runBtn = $('runBtn'), R = 52;
  const reset = () => { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; base.style.left = ''; base.style.top = ''; base.style.bottom = ''; };
  layer.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches){
      if (t.target === runBtn) continue;
      if (joy.id === null && t.clientX < innerWidth * .62){
        joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY;
        base.style.left = (t.clientX - 60) + 'px'; base.style.top = (t.clientY - 60) + 'px'; base.style.bottom = 'auto';
      }
    }
  }, { passive: false });
  layer.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches){
      if (t.identifier !== joy.id) continue;
      let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy; const l = Math.hypot(dx, dy);
      if (l > R){ dx *= R / l; dy *= R / l; }
      knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / R; joy.y = dy / R;
    }
  }, { passive: false });
  const end = e => { for (const t of e.changedTouches) if (t.identifier === joy.id) reset(); };
  layer.addEventListener('touchend', end); layer.addEventListener('touchcancel', end);
  const runOn = e => { e.preventDefault(); e.stopPropagation(); runTouch = true; runBtn.classList.add('on'); };
  const runOff = e => { e.preventDefault(); e.stopPropagation(); runTouch = false; runBtn.classList.remove('on'); };
  runBtn.addEventListener('touchstart', runOn, { passive: false });
  runBtn.addEventListener('touchend', runOff, { passive: false });
  runBtn.addEventListener('touchcancel', runOff, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
}
function rawInput(){
  let x = joy.x, z = joy.y;
  if (keys.KeyW || keys.ArrowUp) z -= 1;
  if (keys.KeyS || keys.ArrowDown) z += 1;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  const l = Math.hypot(x, z); if (l > 1){ x /= l; z /= l; }
  return [x, z, (runTouch || keys.ShiftLeft || keys.ShiftRight) ? 1 : 0];
}

/* ===================== movement & collision ===================== */
const PR = .4, WALK = 4.8, RUN = 7.4, STAM = 2.5, SLIDE = 10;
function colliders(idx){
  const list = RECTS.slice();
  for (const id of DOOR_IDS) if (!S.doors[id]) list.push(DOORS[id].rect);
  ROOMS.forEach((R, i) => { if (R.def.colliders) for (const r of R.def.colliders(S.rs[i], R, E, idx)) list.push(r); });
  return list;
}
function resolve(p, rects){
  for (let pass = 0; pass < 2; pass++){
    for (const b of rects){
      const cx = clamp(p.x, b.x1, b.x2), cz = clamp(p.z, b.z1, b.z2);
      const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
      if (d >= PR) continue;
      if (d > 1e-5){ const k = (PR - d) / d; p.x += dx * k; p.z += dz * k; }
      else {
        const opts = [[b.x1 - PR - p.x, 0], [b.x2 + PR - p.x, 0], [0, b.z1 - PR - p.z], [0, b.z2 + PR - p.z]];
        opts.sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1]));
        p.x += opts[0][0]; p.z += opts[0][1];
      }
    }
  }
  p.x = clamp(p.x, -24, 24); p.z = clamp(p.z, OUT_Z - 30, 9.6);
}
const myFrozen = () => S.frozen[myIdx()] > 0;
function partnerInRoom(R){ return role !== 'solo' && other.seen && R.inside(other.target); }
function updateMe(dt){
  const ri = roomAt(me.pos.z), R = ROOMS[ri], st = S.rs[ri];
  let inp = phase === 'play' ? rawInput() : [0, 0, 0];
  me.inp = inp;
  if (R && R.def.swap && partnerInRoom(R)) inp = other.inp || [0, 0, 0];
  if (lockMove){ me.moving = false; me.running = false; return; }
  let [mx, mz, run] = myFrozen() ? [0, 0, 0] : inp;
  const mod = (R && R.def.speed) ? (R.def.speed(st, R, E, myIdx()) || {}) : {};
  me.moving = Math.hypot(mx, mz) > .1;
  me.running = me.moving && run && !mod.noRun && me.stamina > 0;
  if (me.running) me.stamina = Math.max(0, me.stamina - dt);
  else me.stamina = Math.min(STAM, me.stamina + dt * (me.moving ? .45 : .8));
  let sp = (me.running ? RUN : WALK) * (mod.mult || 1);
  const rects = colliders(myIdx());
  // ---- ice: slide until something stops you (your partner counts!)
  const ice = R && R.def.ice;
  if (ice && R.inside(me.pos) && me.pos.x > ice.x1 && me.pos.x < ice.x2 && me.pos.z < R.Z(ice.lz1) && me.pos.z > R.Z(ice.lz2)){
    const cx = c => -9 + 2 * c, colOf = x => Math.round((x + 9) / 2);
    const rowZ = r => R.Z(ice.lz1 + 1 + 2 * r), rowOf = z => Math.round((R.lz(z) - ice.lz1 - 1) / 2);
    const extra = [];
    if (partnerInRoom(R)) extra.push({ x1: other.target.x - .85, x2: other.target.x + .85, z1: other.target.z - .85, z2: other.target.z + .85 });
    if (ice.blockers) for (const b of ice.blockers(st, R, E)) extra.push(b);
    if (!me.slide && me.moving){
      const dir = Math.abs(mx) > Math.abs(mz) ? [Math.sign(mx), 0] : [0, Math.sign(mz)];
      const probe = me.pos.clone(); probe.x += dir[0] * .3; probe.z += dir[1] * .3; resolve(probe, rects.concat(extra));
      if (Math.hypot(probe.x - me.pos.x, probe.z - me.pos.z) > .2){          // only start a slide if you can actually move that way
        me.slide = dir;
        if (dir[0]) me.pos.z = rowZ(clamp(rowOf(me.pos.z), 0, ice.rows - 1)); else me.pos.x = cx(clamp(colOf(me.pos.x), 0, 9));
      }
    }
    if (me.slide){
      const px = me.pos.x, pz = me.pos.z, step = SLIDE * dt;
      me.pos.x += me.slide[0] * step; me.pos.z += me.slide[1] * step;
      resolve(me.pos, rects.concat(extra));
      const moved = Math.hypot(me.pos.x - px, me.pos.z - pz);
      if (moved < step * .5) me.slide = null;               // stopped against something — stay right there
      if (me.slide) me.ry = Math.atan2(me.slide[0], me.slide[1]);
      me.moving = !!me.slide;
      return afterMove(R, st);
    }
    me.moving = false; return afterMove(R, st);             // on ice you only ever move by sliding
  } else me.slide = null;
  if (me.moving){ let d = Math.atan2(mx, mz) - me.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); me.ry += d * damp(16, dt); }
  me.pos.x += mx * sp * dt; me.pos.z += mz * sp * dt;
  resolve(me.pos, rects);
  afterMove(R, st);
}
let fallCD = 0;
function afterMove(R, st){
  // pits: fall in and you're sent back to the room's start
  if (!R || !R.def.pits || phase !== 'play' || fallCD > 0) return;
  const pits = R.def.pits(st, R, E), bridges = R.def.bridges ? R.def.bridges(st, R, E) : [];
  const inR = (b, m) => me.pos.x > b.x1 + m && me.pos.x < b.x2 - m && me.pos.z > b.z1 + m && me.pos.z < b.z2 - m;
  if (pits.some(b => inR(b, .15)) && !bridges.some(b => inR(b, -.25))){
    fallCD = .8;
    const sp = R.spawnW[myIdx()];
    me.pos.set(sp[0], 0, sp[1]); me.slide = null;
    sfx.fall(); toast('Aaah! You fell — back to the start of the room.');
    send({ t: 'ev', k: 'fallo', m: `${myName || 'Your partner'} fell in!` });
    if (R.def.onFall && (role === 'host' || role === 'solo')) R.def.onFall(st, R, E, myIdx());
    if (role === 'guest') send({ t: 'fell' });
  }
}

/* ===================== host simulation ===================== */
function playerList(){
  const host = role === 'guest' ? other : me;
  const L = [{ idx: 0, pos: role === 'guest' ? other.target : me.pos, ry: host.ry, moving: host.moving, inp: host === me ? me.inp : other.inp }];
  if (role === 'host' && conn && conn.open && other.seen) L.push({ idx: 1, pos: other.target, ry: other.ry, moving: other.moving, inp: other.inp });
  if (role === 'guest') L.push({ idx: 1, pos: me.pos, ry: me.ry, moving: me.moving, inp: me.inp });
  for (const p of L) p.frozen = S.frozen[p.idx] > 0;
  return L;
}
function ev(k, m = '', a = 0){ const e = { t: 'ev', k, m, a }; playEv(e); send(e); }
function playEv(e){
  switch (e.k){
    case 'door': sfx.door(); break;
    case 'chime': sfx.chime(e.a); break;
    case 'wrong': sfx.wrong(); break;
    case 'freeze': sfx.freeze(); if (e.a === myIdx()) flash(); break;
    case 'thaw': sfx.thaw(); break;
    case 'pick': sfx.pick(); break;
    case 'place': sfx.place(); break;
    case 'boo': sfx.boo(); break;
    case 'click': sfx.click(); break;
    case 'thud': sfx.thud(); break;
    case 'zap': sfx.zap(); if (e.a === myIdx()) flash(); break;
    case 'fallo': sfx.fall(); break;
    case 'tone': sfx.tone(e.a); break;
    case 'laugh': sfx.laugh(); break;
    case 'beat': sfx.beat(); break;
    case 'tick': sfx.tick(); break;
    case 'whoosh': sfx.whoosh(); break;
    case 'gong': sfx.gong(e.a || 110); break;
    default: { const R = ROOMS.find(R => R.def.onEvent && R.def.onEvent(e, R, E)); }
  }
  if (e.m) toast(e.m);
}
function flash(){ const f = $('flash'); f.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on'))); }
function hostTick(dt){
  if (phase !== 'play') return;
  S.elapsed += dt;
  const P = curP = playerList();
  // extra bodies (echoes etc.) per room
  const extra = ROOMS.map((R, i) => R.def.occupants ? R.def.occupants(S.rs[i], R, E) : []);
  for (const id of PLATE_IDS){
    const pl = PLATES[id];
    const occ = P.some(p => onPlate(pl, p.pos)) || (pl.room >= 0 && extra[pl.room].some(o => onPlate(pl, o)));
    edges[id] = occ && !S.plateOn[id];
    S.plateOn[id] = occ ? 1 : 0;
    if (occ) hostMem[id] = SOLO() ? ECHO : 0; else hostMem[id] = Math.max(0, hostMem[id] - dt);
    held[id] = occ || hostMem[id] > 0;
  }
  ROOMS.forEach((R, i) => R.def.host && R.def.host(dt, S.rs[i], R, E));
  const n = names();
  for (const g of GHOSTS) updateGhost(g, dt, P, n);
  for (const p of P){
    if (S.frozen[p.idx] <= 0) continue;
    S.frozen[p.idx] -= dt;
    const rescuer = P.find(q => q.idx !== p.idx && S.frozen[q.idx] <= 0 && Math.hypot(q.pos.x - p.pos.x, q.pos.z - p.pos.z) < 1.6);
    if (rescuer){ S.frozen[p.idx] = 0; ev('thaw', `${n[rescuer.idx]} saved ${n[p.idx]}!`); }
    else if (S.frozen[p.idx] <= 0){ S.frozen[p.idx] = 0; ev('thaw'); }
  }
  if (P.every(p => p.pos.z < WIN_Z)) setPhase('won');
}
const inBounds = (g, pos, m = .6) => pos.x > g.b[0] - m && pos.x < g.b[1] + m && pos.z > g.b[2] - m && pos.z < g.b[3] + m;
function stepToward(g, tx, tz, sp, dt){
  const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz);
  if (d < .05) return d;
  const s = Math.min(d, sp * dt); g.x += dx / d * s; g.z += dz / d * s; g.ry = Math.atan2(dx, dz);
  return d;
}
function updateGhost(g, dt, P, n){
  const st = S.rs[g.room], R = ROOMS[g.room];
  if (g.gone && g.gone(st, R, E)){ g.y = Math.min(g.y + dt * 2.5, 12); return; }
  g.y = 0; g.w = 0;
  if (g.think && g.think(g, dt, st, R, E, P)) return;
  const active = P.some(p => inBounds(g, p.pos, 0));
  if (g.rest > 0){ g.rest -= dt; return; }
  if (g.ret){ if (stepToward(g, g.home[0], g.home[1], 6, dt) < .2){ g.ret = false; g.rest = 2.2; } return; }
  if (!active){ stepToward(g, g.home[0], g.home[1], 1.5, dt); return; }
  const targets = P.filter(p => S.frozen[p.idx] <= 0 && inBounds(g, p.pos));
  let best = null, bd = g.radius || 9;
  for (const p of targets){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
  if (best) stepToward(g, best.pos.x, best.pos.z, g.sp, dt);
  else {
    g.wt -= dt;
    if (g.wx === null || g.wt <= 0 || Math.hypot(g.wx - g.x, g.wz - g.z) < .3){
      g.wx = g.b[0] + Math.random() * (g.b[1] - g.b[0]); g.wz = g.b[2] + Math.random() * (g.b[3] - g.b[2]); g.wt = 4;
    }
    stepToward(g, g.wx, g.wz, g.sp * .55, dt);
  }
  g.x = clamp(g.x, g.b[0], g.b[1]); g.z = clamp(g.z, g.b[2], g.b[3]);
  if (!g.harmless) ghostTouch(g, targets, n);
}
function ghostTouch(g, targets, n){
  for (const p of targets){
    if (Math.hypot(p.pos.x - g.x, p.pos.z - g.z) < .95){
      g.ret = true;
      const helper = role === 'solo' ? 'Wait it out…' : `${n[1 - p.idx]}, touch them to break the ice!`;
      E.freeze(p.idx, 6, `${n[p.idx]} got frozen! ${helper}`);
      if (g.onFreeze) g.onFreeze(g, p, S.rs[g.room], ROOMS[g.room], E);
      return true;
    }
  }
  return false;
}
E.stepToward = stepToward; E.ghostTouch = ghostTouch; E.inBounds = inBounds;
E.colliders = colliders; E.resolve = resolve; E.staticRects = () => RECTS.concat(DOOR_IDS.filter(id => !S.doors[id]).map(id => DOORS[id].rect));

/* ===================== networking ===================== */
let peer = null, conn = null, code = '';
function send(o){ try { if (conn && conn.open) conn.send(o); } catch {} }
function randomCode(){ const A = 'ABCDEFGHJKMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
function hostGame(){
  if (typeof Peer === 'undefined'){ status('Could not load the network library. Check your connection.'); return; }
  role = 'host'; applyColors(); code = randomCode();
  $('roomCode').textContent = code; $('lobbyMsg').textContent = 'Connecting…';
  $('btnStart').disabled = true; $('btnStart').textContent = 'Enter';
  show('lobby'); phase = 'lobby';
  peer = new Peer(PREFIX + code);
  peer.on('open', () => { $('lobbyMsg').textContent = 'Tell your partner to enter this code and tap Join.'; });
  peer.on('connection', c => { if (conn && conn.open){ c.on('open', () => c.close()); return; } conn = c; wireConn(); });
  peer.on('error', e => { if (e.type === 'unavailable-id'){ peer.destroy(); hostGame(); return; } $('lobbyMsg').textContent = 'Network error: ' + e.type; });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch {} });
}
function joinGame(c){
  if (typeof Peer === 'undefined'){ status('Could not load the network library. Check your connection.'); return; }
  role = 'guest'; applyColors(); code = c; status('Connecting to ' + c + '…');
  peer = new Peer();
  peer.on('open', () => { conn = peer.connect(PREFIX + c, { reliable: true }); wireConn(); });
  peer.on('error', e => { status(e.type === 'peer-unavailable' ? 'No game found with code ' + c + '.' : 'Network error: ' + e.type); cleanupNet(); role = null; });
  setTimeout(() => { if (role === 'guest' && phase === 'menu' && !(conn && conn.open)){ status('Could not connect. Try both on the same Wi-Fi.'); cleanupNet(); role = null; } }, 15000);
}
function wireConn(){
  const onOpen = () => send({ t: 'hi', n: myName });
  if (conn.open) onOpen(); else conn.on('open', onOpen);
  conn.on('data', onData); conn.on('close', onDisconnect); conn.on('error', onDisconnect);
}
function onData(m){
  if (!m || typeof m !== 'object') return;
  switch (m.t){
    case 'hi':
      remoteName = String(m.n || 'Partner').slice(0, 12); applyColors();
      if (role === 'host'){ send({ t: 'welcome', n: myName, lv: LEVEL }); $('lobbyMsg').textContent = `${remoteName} is here. Ready when you are…`; $('btnStart').disabled = false; sfx.chime(1); }
      break;
    case 'welcome':
      if (m.lv && m.lv !== LEVEL){ cleanupNet(); location.href = levelUrl(m.lv) + '?join=' + encodeURIComponent(code); return; }
      remoteName = String(m.n || 'Partner').slice(0, 12); applyColors();
      $('roomCode').textContent = code; $('lobbyMsg').textContent = `Connected to ${remoteName}. Waiting for them to start…`;
      $('btnStart').disabled = true; $('btnStart').textContent = 'Waiting for host';
      show('lobby'); phase = 'lobby';
      break;
    case 'g':
      if (role !== 'host') break;
      other.target.set(m.p[0], 0, m.p[1]); other.ry = m.p[2]; other.moving = !!m.p[3]; other.running = !!m.p[4]; other.inp = m.in || [0, 0, 0];
      if (!other.seen){ other.seen = true; otherChar.group.position.copy(other.target); }
      break;
    case 'again': if (role === 'host' && phase === 'won') startGame(S.startRoom); break;
    case 'next': if (role === 'host' && phase === 'won') goNextLevel(); break;
    case 'nextlv': if (role === 'guest'){ cleanupNet(); location.href = levelUrl(m.lv) + '?join=' + encodeURIComponent(m.code); } break;
    case 'tp': if (role === 'guest'){ me.pos.set(m.x, 0, m.z); me.slide = null; } break;
    case 'fell': if (role === 'host'){ const ri = roomAt(other.target.z), R = ROOMS[ri]; if (R && R.def.onFall) R.def.onFall(S.rs[ri], R, E, 1); } break;
    case 's':
      if (role !== 'guest') break;
      DOOR_IDS.forEach((id, i) => S.doors[id] = m.d[i] === '1' ? 1 : 0);
      PLATE_IDS.forEach((id, i) => S.plateOn[id] = m.pl[i] === '1' ? 1 : 0);
      S.frozen = m.fr; S.freezes = m.fz; S.elapsed = m.el; S.startRoom = m.sr; S.rs = m.rs;
      m.gh.forEach((v, i) => { const g = GHOSTS[i]; g.tx = v[0]; g.tz = v[1]; g.y = v[2]; g.ry = v[3]; g.w = v[4]; });
      other.target.set(m.hp[0], 0, m.hp[1]); other.ry = m.hp[2]; other.moving = !!m.hp[3]; other.running = !!m.hp[4]; other.inp = m.in || [0, 0, 0];
      if (!other.seen){ other.seen = true; otherChar.group.position.copy(other.target); }
      if (m.ph !== phase) setPhase(m.ph);
      break;
    case 'ev': if (role === 'guest' || m.k === 'fallo' || m.k === 'zap') playEv(m); break;
  }
}
function onDisconnect(){
  if (!conn) return;
  conn = null; other.seen = false; otherChar.group.visible = false;
  if (role === 'host'){
    phase = 'lobby'; hideGameUI();
    $('roomCode').textContent = code; $('btnStart').disabled = true; $('btnStart').textContent = 'Enter';
    $('lobbyMsg').textContent = `${remoteName} left. They can rejoin with the same code.`;
    show('lobby');
  } else if (role === 'guest') toMenu('Lost connection to the host.');
}
function cleanupNet(){ try { conn && conn.close(); } catch {} try { peer && peer.destroy(); } catch {} conn = null; peer = null; }
function sendState(){
  const p = [r2(me.pos.x), r2(me.pos.z), r2(me.ry), me.moving ? 1 : 0, me.running ? 1 : 0];
  if (role === 'guest'){ send({ t: 'g', p, in: me.inp.map(r2) }); return; }
  send({
    t: 's', ph: phase === 'won' ? 'won' : phase === 'play' ? 'play' : 'lobby',
    d: DOOR_IDS.map(id => S.doors[id] ? '1' : '0').join(''),
    pl: PLATE_IDS.map(id => S.plateOn[id] ? '1' : '0').join(''),
    fr: S.frozen.map(r2), fz: S.freezes, el: r2(S.elapsed), sr: S.startRoom, rs: S.rs,
    gh: GHOSTS.map(g => [r2(g.x), r2(g.z), r2(g.y), r2(g.ry), g.w]),
    hp: p, in: me.inp.map(r2)
  });
}

/* ===================== UI / phases ===================== */
const screens = ['menu', 'lobby', 'won'];
function show(id){ screens.forEach(s => $(s).hidden = s !== id); }
function status(t){ $('status').textContent = t; }
let toastT = 0, storyT = 0;
function toast(t){ const el = $('toast'); el.textContent = t; el.classList.add('show'); toastT = 3.2; }
function hideGameUI(){ $('hud').hidden = true; $('touch').hidden = true; $('btnExit').hidden = true; $('frost').classList.remove('on'); }
function chosenStart(){ return clamp(parseInt($('startRoom').value) || 0, 0, Math.min(reached, ROOMS.length - 1)); }
function startGame(startRoom = 0){ resetWorld(); solveUpTo(startRoom); setPhase('play'); }
function spawn(){ const sp = ROOMS[clamp(S.startRoom, 0, ROOMS.length - 1)].spawnW[myIdx()]; me.pos.set(sp[0], 0, sp[1]); me.ry = Math.PI; me.stamina = STAM; me.slide = null; }
function setPhase(p){
  const prev = phase; phase = p;
  if (p === 'play'){
    if (role === 'guest' && prev !== 'play') for (const g of GHOSTS){ g.x = g.tx; g.z = g.tz; }
    show(null); $('hud').hidden = false; $('touch').hidden = !isTouch; $('btnExit').hidden = false; $('hint').hidden = isTouch;
    spawn(); meChar.group.visible = true; otherChar.group.visible = role !== 'solo';
    const partner = role === 'solo' ? 'You arrive' : `You and <b>${esc(remoteName)}</b> arrive`;
    const where = S.startRoom > 0 ? ` in <b>${ROOMS[S.startRoom].name}</b>` : '';
    $('story').innerHTML = `${partner}${where} at <b>${esc(CFG.title)}</b>.<br><br>${CFG.story || ''}<br>Ghosts freeze anyone they touch — ${role === 'solo' ? 'the ice melts after a few seconds' : 'touch your frozen partner to break the ice'}.`;
    $('story').classList.add('show'); storyT = 7;
    sfx.boo();
  }
  if (p === 'won'){
    sfx.win(); $('touch').hidden = true; $('frost').classList.remove('on');
    const t = S.elapsed, full = S.startRoom === 0, bk = 'hm_best_L' + LEVEL;
    const best = parseFloat(store.get(bk, '0')) || 0, newBest = full && (!best || t < best);
    if (newBest) store.set(bk, String(t));
    $('wonTitle').textContent = CFG.winTitle || 'You escaped! 🌙';
    $('wonSub').textContent = role === 'solo' ? 'You made it out alive.' : `${names()[0]} and ${names()[1]} made it out alive.`;
    $('wonRows').innerHTML =
      `<div class="row"><span>Escape time</span><span>${fmtTime(t)}${full ? '' : ' (from room ' + (S.startRoom + 1) + ')'}</span></div>` +
      `<div class="row"><span>Times frozen</span><span>${S.freezes}</span></div>` +
      `<div class="row"><span>Best full run</span><span>${newBest ? fmtTime(t) + ' 🎉' : best ? fmtTime(best) : '—'}</span></div>`;
    $('btnAgain').disabled = false; $('btnAgain').textContent = 'Play again';
    const hasNext = LEVELS.some(l => l.n === LEVEL + 1);
    $('btnNext').hidden = !hasNext; $('btnNext').disabled = false; $('btnNext').textContent = `Level ${LEVEL + 1} →`;
    show('won');
  }
}
function goNextLevel(){
  const n = LEVEL + 1;
  if (role === 'host'){ send({ t: 'nextlv', lv: n, code }); setTimeout(() => { cleanupNet(); location.href = levelUrl(n) + '?host=1'; }, 400); }
  else { cleanupNet(); location.href = levelUrl(n); }
}
function toMenu(msg = ''){
  cleanupNet(); role = null; phase = 'menu'; hideGameUI();
  meChar.group.visible = false; otherChar.group.visible = false; other.seen = false;
  resetWorld(); fillSelects(); show('menu'); status(msg);
}
function fillSelects(){
  const sel = $('startRoom'); sel.innerHTML = '';
  for (let i = 0; i <= Math.min(reached, ROOMS.length - 1); i++){ const o = document.createElement('option'); o.value = i; o.textContent = `${i + 1}. ${ROOMS[i].name}`; sel.appendChild(o); }
  sel.value = '0';
  const ls = $('levelSel'); ls.innerHTML = '';
  for (const l of LEVELS){ const o = document.createElement('option'); o.value = l.n; o.textContent = `${l.n}. ${l.name}`; ls.appendChild(o); }
  ls.value = String(LEVEL);
}
function updateHud(dt){
  const ri = roomAt(me.pos.z), R = ROOMS[ri], st = S.rs[ri];
  $('roomName').textContent = R ? `${ri + 1}. ${R.name}` : 'Outside';
  $('timer').textContent = fmtTime(S.elapsed);
  let obj = '';
  if (myFrozen()) obj = `❄ You're frozen! ${SOLO() ? 'Wait for the ice to melt…' : `${esc(remoteName)} can touch you to break the ice.`}`;
  else if (R){
    const note = R.def.notes && R.def.notes.find(n => Math.hypot(me.pos.x - n[0], me.pos.z - R.Z(n[1])) < (n[3] || 1.8));
    obj = note ? `<i>${esc(note[2])}</i>` : (R.def.objective ? R.def.objective(st, R, E) : '');
  } else obj = SOLO() || curP.every(p => p.pos.z < WIN_Z) ? 'Free!' : `You're out! Wait for ${esc(remoteName)}…`;
  if ($('objective').innerHTML !== obj) $('objective').innerHTML = obj;
  const pan = R && R.def.panel && phase === 'play' ? R.def.panel(st, R, E) : null;
  $('panel').hidden = !pan; if (pan && $('panel').innerHTML !== pan) $('panel').innerHTML = pan;
  const bar = R && R.def.bar && phase === 'play' ? R.def.bar(st, R, E) : null;
  $('barBox').hidden = !bar;
  if (bar){ $('barFill').style.width = (clamp(bar.frac, 0, 1) * 100) + '%'; $('barFill').style.background = bar.color || 'var(--gold)'; $('barLbl').textContent = bar.label || ''; }
  $('stam').firstElementChild.style.width = (me.stamina / STAM * 100) + '%';
  $('frost').classList.toggle('on', myFrozen());
  if (toastT > 0){ toastT -= dt; if (toastT <= 0) $('toast').classList.remove('show'); }
  if (storyT > 0){ storyT -= dt; if (storyT <= 0) $('story').classList.remove('show'); }
  if (otherChar.group.visible && other.seen && phase === 'play'){
    const v = otherChar.group.position.clone(); v.y = 1; v.project(camera);
    const off = Math.abs(v.x) > .92 || Math.abs(v.y) > .92 || v.z > 1;
    arrowEl.hidden = !off;
    if (off){
      let x = v.x, y = v.y; if (v.z > 1){ x = -x; y = -y; }
      const a = Math.atan2(x, y), k = .86 / Math.max(Math.abs(x), Math.abs(y), .001);
      arrowEl.style.left = ((x * k * .5 + .5) * innerWidth - 11) + 'px'; arrowEl.style.top = ((-y * k * .5 + .5) * innerHeight - 11) + 'px'; arrowEl.style.transform = `rotate(${a}rad)`;
    }
  } else arrowEl.hidden = true;
}

/* ===================== menu wiring ===================== */
$('name').value = myName;
fillSelects();
$('levelSel').addEventListener('change', e => { const n = +e.target.value; if (n !== LEVEL) location.href = levelUrl(n); });
$('name').addEventListener('input', e => { myName = e.target.value.trim().slice(0, 12); store.set('hm_name', myName); });
function needName(){
  myName = $('name').value.trim().slice(0, 12);
  if (!myName){ status('Type your name first.'); $('name').focus(); return false; }
  store.set('hm_name', myName); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return true;
}
$('btnHost').onclick = () => { unlockAudio(); if (needName()){ status(''); hostGame(); } };
$('btnJoin').onclick = () => {
  unlockAudio(); if (!needName()) return;
  const c = $('code').value.trim().toUpperCase();
  if (c.length !== 4){ status('Enter the 4-letter code.'); return; }
  joinGame(c);
};
$('code').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnJoin').click(); });
$('code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });
$('btnSolo').onclick = () => { unlockAudio(); myName = $('name').value.trim().slice(0, 12) || 'You'; role = 'solo'; applyColors(); startGame(chosenStart()); };
$('btnStart').onclick = () => { unlockAudio(); if (role === 'host' && conn && conn.open) startGame(chosenStart()); };
$('btnLeave').onclick = () => toMenu();
$('btnMenu').onclick = () => toMenu();
$('btnExit').onclick = () => toMenu();
$('btnAgain').onclick = () => {
  unlockAudio();
  if (role === 'guest'){ send({ t: 'again' }); $('btnAgain').disabled = true; $('btnAgain').textContent = 'Starting…'; }
  else startGame(S.startRoom);
};
$('btnNext').onclick = () => {
  if (role === 'guest'){ send({ t: 'next' }); $('btnNext').disabled = true; $('btnNext').textContent = 'Asking host…'; }
  else goNextLevel();
};
// arriving via a join link (?join=CODE) or a "next level" hop (?host=1)
try {
  const q = new URLSearchParams(location.search), jc = q.get('join');
  if (jc){ $('code').value = jc.toUpperCase(); if (myName){ status('Joining ' + jc + '… tap Join if nothing happens.'); setTimeout(() => $('btnJoin').click(), 400); } else status('Type your name and tap Join.'); }
  else if (q.get('host') && myName) status('Tap Create game — your partner will be sent here when they join your new code.');
  if (jc || q.get('host')) history.replaceState(null, '', location.pathname);
} catch {}

/* ===================== visuals ===================== */
function updateWorldVisuals(dt, t){
  for (const id of DOOR_IDS){ const m = DOORS[id].mesh; m.position.y += ((S.doors[id] ? -2.55 : 0) - m.position.y) * damp(5, dt); }
  ROOMS.forEach((R, i) => R.def.visual && R.def.visual(dt, t, S.rs[i], R, E));
  for (const id of PLATE_IDS){
    const p = PLATES[id]; if (!p.mesh) continue;
    const on = !!S.plateOn[id];
    p.mesh.position.y += ((on ? .01 : .06) - p.mesh.position.y) * damp(12, dt);
    const ei = p.force !== undefined ? p.force : on ? 1.1 : .35;
    p.mat.emissiveIntensity += (ei - p.mat.emissiveIntensity) * damp(10, dt);
    p.force = undefined;
  }
  let nearest = 99;
  for (const g of GHOSTS){
    if (role === 'guest'){ g.x += (g.tx - g.x) * damp(10, dt); g.z += (g.tz - g.z) * damp(10, dt); }
    const m = g.mesh, shake = g.w ? Math.sin(t * 60) * .04 : 0;
    m.position.set(g.x + shake, g.y + .15 + Math.sin(t * 2.2 + g.home[0]) * .15, g.z);
    let d = g.ry - m.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); m.rotation.y += d * damp(8, dt);
    m.visible = g.y < 11;
    if (m.visible && !g.harmless) nearest = Math.min(nearest, Math.hypot(g.x - me.pos.x, g.z - me.pos.z));
  }
  if (whisperGain) whisperGain.gain.value = phase === 'play' ? clamp((7 - nearest) / 7, 0, 1) * .07 : 0;
  if (droneGain) droneGain.gain.value = phase === 'menu' ? .02 : .045;
}
function updateCharVisuals(c, frozenSec){
  const fr = frozenSec > 0;
  c.ice.visible = fr;
  c.bodyMat.emissive.setHex(fr ? 0x2a6a9a : 0x000000); c.bodyMat.emissiveIntensity = fr ? .5 : 0;
}

/* ===================== main loop ===================== */
let last = performance.now(), clockT = 0, netT = 0;
const camPos = new THREE.Vector3(0, 16, 20), camLook = new THREE.Vector3();
camera.position.copy(camPos);
function tick(dt){
  clockT += dt; fallCD -= dt;
  if (role === 'host' || role === 'solo') hostTick(dt);
  else { curP = playerList(); if (role === 'guest' && phase === 'play') S.elapsed += dt; }
  const inGame = phase === 'play' || phase === 'won';
  lockMove = false;
  if (inGame){
    ROOMS.forEach((R, i) => R.def.local && R.def.local(dt, S.rs[i], R, E));
    updateMe(dt);
    meChar.group.position.copy(me.pos); meChar.group.rotation.y = me.ry;
    animChar(meChar, dt, me.moving, me.running);
    updateCharVisuals(meChar, S.frozen[myIdx()]);
    meChar.label.setText(myFrozen() ? `❄ ${Math.ceil(S.frozen[myIdx()])}` : (myName || 'You'), myFrozen() ? '#bfeaff' : CSSCOL[myIdx()]);
    if (otherChar.group.visible && other.seen){
      otherChar.group.position.lerp(other.target, damp(14, dt));
      let d = other.ry - otherChar.group.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); otherChar.group.rotation.y += d * damp(14, dt);
      animChar(otherChar, dt, other.moving, other.running);
      const of = S.frozen[1 - myIdx()];
      updateCharVisuals(otherChar, of);
      otherChar.label.setText(of > 0 ? `❄ ${remoteName} — touch to save!` : remoteName, of > 0 ? '#bfeaff' : CSSCOL[1 - myIdx()]);
    }
    const rm = roomAt(me.pos.z);
    if (phase === 'play' && rm > reached && rm < ROOMS.length){ reached = rm; store.set(reachKey, String(reached)); }
  }
  updateWorldVisuals(dt, clockT);
  if (inGame){
    const k = camera.aspect < 1 ? 1.3 : 1;
    camLook.set(me.pos.x, .8, me.pos.z - 1.2);
    camPos.set(me.pos.x, 14 * k, me.pos.z + 7.5 * k);
    camera.position.lerp(camPos, damp(5, dt)); camera.lookAt(camLook);
  } else {
    const a = clockT * .08;
    camera.position.set(Math.sin(a) * 9, 13, 2 + Math.cos(a) * 9); camera.lookAt(0, 0, 0);
  }
  netT -= dt;
  if (netT <= 0 && conn && conn.open && (phase === 'play' || phase === 'won' || phase === 'lobby')){ netT = role === 'guest' ? 1 / 20 : 1 / 15; sendState(); }
  if (inGame) updateHud(dt);
}
E.chars = { me: meChar, other: otherChar };
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  tick(dt); renderer.render(scene, camera);
}
requestAnimationFrame(loop);

// handle for automated tests
return {
  S, me, other, tick, startGame, solveUpTo, resetWorld, ROOMS, GHOSTS, PLATES, DOORS, colliders, keys, E, roomAt,
  setRole: r => { role = r; }, setConn: c => { conn = c; }, getPhase: () => phase, WIN_Z, setRemote: n => { remoteName = n; }
};
}
