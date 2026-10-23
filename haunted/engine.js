// Hollow Manor shared engine (Levels 2–20). A level supplies a list of room plugins; the engine handles
// the house layout, players, powers, items, ghosts, plates, doors, networking (PeerJS), HUD and menus.
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
const LEVEL_NAMES = ['Hollow Manor', 'Grimwood Carnival', 'The Clocktower', 'The Sunken Lighthouse', 'The Frozen Monastery', "The Witch's Bog", 'The Ghost Train',
  'The Opera House', 'The Ruined Cathedral', 'The Mirror Palace', 'The Spectral Archive', 'The Toy Factory', 'The Coal Mine', 'The Sky Gardens', "The Pharaoh's Tomb",
  'The Wax Museum', 'The Abyssal Depths', 'The Volcano Forge', 'The Dream Realm', 'The Heart of Hollow Manor'];
const BUILT = 20;                     // highest level that exists on the site
const LEVELS = LEVEL_NAMES.slice(0, BUILT).map((name, i) => ({ n: i + 1, name }));
// powers unlock at a level and are kept for every later level
const UNLOCK = { dash: 4, flash: 5, throw: 6, ping: 7, sight: 8, grapple: 9, swap: 10, phase: 11, decoy: 12, oil: 13, bridge: 14, bolt: 15, vault: 16, shadow: 17, bombs: 18, rewind: 19, blast: 20 };
const has = k => LEVEL >= (UNLOCK[k] || 99);
const BASE_GMULT = CFG.ghostMult || (1 + Math.max(0, LEVEL - 3) * .03);
let GMULT = BASE_GMULT;   // eased by hostTick after repeated freezes or while a puzzle panel is up (see pressure())
const FREEZE = CFG.freezeSecs || (LEVEL >= 4 ? 6 + Math.floor((LEVEL - 4) / 4) : 6);
const RESET_RULE = LEVEL >= 8;
// player options from the ☰ menu, saved per browser and shared by all levels
const OPT_DEF = { vol: 1, sfx: 1, amb: 1, sens: 1, inv: false, shake: true, dread: true, qual: 'high' };
const OPT = (() => { try { return { ...OPT_DEF, ...JSON.parse(store.get('hm_opts', '{}')) }; } catch { return { ...OPT_DEF }; } })();
const QUAL = { high: 1, medium: .75, low: .5 };
// leaving for another level: fade to black with its name, then go (the new page fades in from the same black)
function goLevel(n, query = ''){
  const f = document.getElementById('fade');
  if (f){ f.querySelector('small').textContent = 'LEVEL ' + n; f.querySelector('b').textContent = LEVEL_NAMES[n - 1] || ''; f.classList.remove('out'); }
  setTimeout(() => { location.href = levelUrl(n) + query; }, f ? 420 : 0);
}
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
  h1{margin:0 0 2px;font-size:36px;letter-spacing:1px;font-weight:700;color:#efe8ff;text-shadow:0 0 18px var(--accent)}
  .lvl{font-family:system-ui,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px;color:var(--accent);margin-bottom:6px}
  .feat{font-family:system-ui,sans-serif;font-size:13px;background:#ffffff10;border:1px solid var(--accent);border-radius:12px;padding:8px 10px;margin:0 0 14px;color:#fff;line-height:1.35}
  .feat b{color:var(--gold)}
  h2{margin:0 0 8px;font-size:26px}
  .sub{margin:0 0 14px;color:var(--dim);font-size:15px;line-height:1.4}
  label{display:block;text-align:left;font-size:13px;margin-bottom:12px;color:var(--dim)}
  input,select{font:inherit;font-family:system-ui,sans-serif;font-size:18px;width:100%;padding:11px 14px;border-radius:12px;border:2px solid #3a3160;margin-top:6px;
    background:#0d0b1a;color:var(--ink);-webkit-user-select:text;user-select:text}
  select{font-size:15px;-webkit-appearance:none;appearance:none}
  .two{display:flex;gap:8px}.two label{flex:1;min-width:0}
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
  .best{font-family:system-ui,sans-serif;font-size:13px;font-weight:700;color:var(--gold);margin:-6px 0 14px}
  .stars{font-size:40px;color:var(--gold);letter-spacing:6px;margin:4px 0}
  #hud{position:fixed;inset:0;pointer-events:none;z-index:10;padding:calc(10px + env(safe-area-inset-top)) 12px 0;font-family:system-ui,sans-serif}
  #hudTop{display:flex;justify-content:center;gap:8px;align-items:center;flex-wrap:wrap}
  .pill{background:#0b0918cc;border:1px solid #ffffff1f;border-radius:999px;padding:6px 14px;font-weight:700;font-size:15px}
  #hintBtn{pointer-events:auto;background:#3a2a10dd;border-color:var(--gold);color:var(--gold);cursor:pointer}
  #roomName{font-family:Georgia,serif;font-size:16px}
  #objective{margin:8px auto 0;max-width:560px;text-align:center;background:#0b0918b3;border-radius:12px;padding:8px 12px;font-size:14px;line-height:1.35;color:#ddd5ff}
  #objective.hint{border:1px solid var(--gold);color:#ffe9b8}
  #panel{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);background:#120d22ee;border:2px solid var(--accent);border-radius:18px;padding:14px 18px;text-align:center;
    width:min(420px,calc(100% - 24px));font-size:16px;line-height:1.45}
  #panel .big1{font-size:30px;font-weight:800;color:var(--gold);font-family:system-ui,sans-serif}
  #barWrap{margin:8px auto 0;width:min(320px,80%);height:12px;border-radius:6px;background:#ffffff22;overflow:hidden;position:relative}
  #barWrap i{position:absolute;left:0;top:0;bottom:0;background:var(--gold)}
  #barLbl{text-align:center;font-size:12px;font-weight:700;margin-top:3px;color:#fff;text-shadow:0 1px 3px #000}
  #toast{position:absolute;left:50%;top:calc(132px + env(safe-area-inset-top));transform:translateX(-50%);background:#000c;color:#fff;padding:8px 16px;border-radius:12px;
    font-weight:700;font-size:15px;opacity:0;transition:opacity .25s;max-width:calc(100% - 24px);text-align:center}
  #toast.show{opacity:1}
  #fade{position:fixed;inset:0;z-index:60;background:#05060c;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
    opacity:1;transition:opacity .55s;pointer-events:none;font-family:Georgia,serif;color:#efe8ff;text-align:center;padding:16px}
  #fade.out{opacity:0}
  #fade small{font-family:system-ui,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px;color:var(--accent)}
  #fade b{font-size:32px;text-shadow:0 0 18px var(--accent)}
  #story{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,calc(100% - 32px));text-align:center;background:#0b0918e6;border:1px solid #ffffff22;
    border-radius:18px;padding:20px;font-family:Georgia,serif;font-size:17px;line-height:1.5;opacity:0;transition:opacity .6s}
  #story.show{opacity:1}
  #story b{color:var(--gold)}
  #meters{position:absolute;right:calc(26px + env(safe-area-inset-right));bottom:calc(282px + env(safe-area-inset-bottom));display:grid;gap:4px;width:92px}
  body:not(.touch) #meters{left:50%;right:auto;transform:translateX(-50%);bottom:20px;width:120px}
  .meter{height:8px;border-radius:4px;background:#ffffff22;overflow:hidden}
  .meter i{display:block;height:100%;width:100%;background:var(--gold)}
  #oilM i{background:#ff9a3d}
  #powRow{position:absolute;left:50%;bottom:50px;transform:translateX(-50%);display:flex;gap:10px}
  body.touch #powRow{display:none}
  .pwc{display:flex;flex-direction:column;align-items:center;gap:4px}
  .pw{width:42px;height:42px;border-radius:12px;background:#0b0918cc;border:1px solid #ffffff33;display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;overflow:hidden}
  .pw i{position:absolute;left:0;right:0;bottom:0;background:#ffffff33}
  .key{min-width:22px;padding:1px 6px;border-radius:5px;background:#0b0918dd;border:1px solid #ffffff40;border-bottom-width:2px;font-size:11px;font-weight:700;line-height:15px;text-align:center;color:#fffc}
  #arrow{position:absolute;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-bottom:22px solid var(--pink);transform-origin:50% 60%;filter:drop-shadow(0 0 6px #000)}
  #flash{position:fixed;inset:0;background:#9fd8ff;opacity:0;pointer-events:none;z-index:9;transition:opacity .5s}
  #flash.on{opacity:.4;transition:none}
  #frost{position:fixed;inset:0;pointer-events:none;z-index:9;opacity:0;transition:opacity .3s;background:radial-gradient(circle at 50% 50%,#0000 35%,#a8e4ff66 75%,#d8f3ffaa 100%)}
  #frost.on{opacity:1}
  #sightFx{position:fixed;inset:0;pointer-events:none;z-index:9;opacity:0;transition:opacity .25s;background:radial-gradient(circle at 50% 50%,#0000 40%,#7a3aff55 85%,#3a0a8aaa 100%)}
  #sightFx.on{opacity:1}
  #dread{position:fixed;inset:0;pointer-events:none;z-index:9;opacity:0;background:radial-gradient(ellipse at 50% 50%,#0000 38%,#12000acc 82%,#000000f0 100%)}
  #touch{position:fixed;inset:0;z-index:8}
  #joyBase{position:absolute;width:120px;height:120px;border-radius:50%;background:#ffffff1c;border:3px solid #ffffff55;left:calc(30px + env(safe-area-inset-left));bottom:calc(40px + env(safe-area-inset-bottom))}
  #joyKnob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:#ffffffaa}
  .tb{position:absolute;border-radius:50%;font-weight:900;color:#fff;padding:0;display:flex;align-items:center;justify-content:center}
  #runBtn{right:calc(24px + env(safe-area-inset-right));bottom:calc(52px + env(safe-area-inset-bottom));width:96px;height:96px;background:#ffc46b44;border:3px solid #ffc46bcc;font-size:16px}
  #dashBtn{right:calc(38px + env(safe-area-inset-right));bottom:calc(162px + env(safe-area-inset-bottom));width:72px;height:72px;background:#5ad1ff44;border:3px solid #5ad1ffcc;font-size:26px}
  #powBtn{right:calc(132px + env(safe-area-inset-right));bottom:calc(60px + env(safe-area-inset-bottom));width:72px;height:72px;background:#fff3a044;border:3px solid #fff3a0cc;font-size:26px}
  .tb.on{filter:brightness(1.6)}
  .tb.cd{opacity:.45}
  #btnExit{position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:11;padding:6px 12px;font-size:13px;background:#0b0918cc;border:1px solid #ffffff22}
  #leftBtns{position:fixed;top:calc(10px + env(safe-area-inset-top));left:12px;z-index:11;display:flex;gap:6px}
  #leftBtns button{padding:6px 12px;font-size:13px;background:#0b0918cc;border:1px solid #ffffff22}
  #leftBtns button[hidden]{display:none}
  #hudTop{padding:0 92px}
  body:not(.touch) #hudTop{padding:0 270px}
  body.touch #leftBtns .full{display:none}
  #pause{background:#05030cb8;z-index:25}
  #pause .card{width:min(460px,100%);text-align:left;touch-action:pan-y}
  #pause h2{text-align:center}
  .pnote{font-family:system-ui,sans-serif;font-size:12.5px;color:var(--dim);text-align:center;margin:0 0 12px}
  .prow{display:flex;gap:6px;margin-bottom:8px}
  .prow button{flex:1;font-size:14px;padding:10px 6px}
  .sec{font-family:system-ui,sans-serif;font-size:12px;font-weight:800;letter-spacing:2px;color:var(--accent);margin:16px 0 4px}
  label.opt{display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:system-ui,sans-serif;font-size:14px;padding:7px 0;margin:0;border-bottom:1px solid #ffffff10;color:var(--ink)}
  .opt input[type=range]{width:46%;margin:0;padding:0;border:0;background:none;accent-color:var(--accent)}
  .opt input[type=checkbox]{width:22px;height:22px;margin:0;padding:0;accent-color:var(--accent)}
  .opt select{width:46%;margin:0;padding:6px 10px;font-size:14px}
  .ctl{display:grid;grid-template-columns:minmax(84px,36%) 1fr;gap:6px 12px;font-family:system-ui,sans-serif;font-size:13.5px;line-height:1.35}
  .ctl b{color:var(--gold)}
  #pause .link{display:block;margin:10px auto 0}`;
document.head.appendChild(style);
const SKIN_SETS = {
  1: [{ name: 'The Night Warden', url: 'models/night_warden.glb', scale: .92, swing: 1 }, { name: 'The Lady in Grey', url: 'models/lady_in_grey.glb', scale: .96, swing: .5 }],   // Level 1 lives at haunted/ itself
  2: [{ name: 'The Last Ringmaster', url: '../models/last_ringmaster.glb', scale: .85, swing: 1 }, { name: 'The Porcelain Acrobat', url: '../models/porcelain_acrobat.glb', scale: .92, swing: 1 }],
  3: [{ name: 'The Horologist', url: '../models/horologist.glb', scale: .9, swing: 1 }, { name: 'The Clockwork Ballerina', url: '../models/clockwork_ballerina.glb', scale: .95, swing: .8 }],
  4: [{ name: 'The Drowned Keeper', url: '../models/drowned_keeper.glb', scale: .9, swing: 1 }, { name: 'The Tide Siren', url: '../models/tide_siren.glb', scale: .95, swing: .5 }],
  5: [{ name: 'The Silent Abbot', url: '../models/silent_abbot.glb', scale: .9, swing: .55 }, { name: 'The Snow Wraith', url: '../models/snow_wraith.glb', scale: .88, swing: .4 }],
  6: [{ name: 'The Bog Lantern Man', url: '../models/bog_lantern_man.glb', scale: .87, swing: 1 }, { name: 'The Hedge Witch', url: '../models/hedge_witch.glb', scale: .88, swing: .6 }],
  7: [{ name: 'The Phantom Conductor', url: '../models/phantom_conductor.glb', scale: .9, swing: 1 }, { name: 'The Last Passenger', url: '../models/last_passenger.glb', scale: .98, swing: 1, flicker: true }],
  8: [{ name: 'The Masked Patron', url: '../models/masked_patron.glb', scale: .92, swing: 1 }, { name: 'The Fallen Diva', url: '../models/fallen_diva.glb', scale: .96, swing: .45 }],
  9: [{ name: 'The Penitent Knight', url: '../models/penitent_knight.glb', scale: .85, swing: .9 }, { name: 'The Stained-Glass Saint', url: '../models/stained_glass_saint.glb', scale: .9, swing: .4 }],
  10: [{ name: 'The Silvered Prince', url: '../models/silvered_prince.glb', scale: .93, swing: 1 }, { name: 'The Reflection', url: '../models/the_reflection.glb', scale: .93, swing: 1 }],
  11: [{ name: 'The Keeper of Pages', url: '../models/keeper_of_pages.glb', scale: .92, swing: .55 }, { name: 'The Living Manuscript', url: '../models/living_manuscript.glb', scale: .95, swing: .5 }],
  12: [{ name: 'The Broken Soldier', url: '../models/broken_soldier.glb', scale: .84, swing: .8 }, { name: 'The Stitched Doll', url: '../models/stitched_doll.glb', scale: 1, swing: 1 }],
  13: [{ name: 'The Lost Miner', url: '../models/lost_miner.glb', scale: .92, swing: 1 }, { name: "The Canary's Ghost", url: '../models/canarys_ghost.glb', scale: .97, swing: .5 }],
  14: [{ name: 'The Aeronaut', url: '../models/aeronaut.glb', scale: .92, swing: 1 }, { name: 'The Bloom Fairy', url: '../models/bloom_fairy.glb', scale: 1, swing: .5 }],
  15: [{ name: 'The Risen Pharaoh', url: '../models/risen_pharaoh.glb', scale: .92, swing: .9 }, { name: 'The Jackal Priestess', url: '../models/jackal_priestess.glb', scale: .95, swing: .5 }],
  16: [{ name: 'The Sculptor', url: '../models/the_sculptor.glb', scale: .92, swing: .8 }, { name: 'The Exhibit', url: '../models/the_exhibit.glb', scale: .97, swing: .5 }],
  17: [{ name: 'The Deep Diver', url: '../models/deep_diver.glb', scale: .92, swing: .8 }, { name: 'The Angler Queen', url: '../models/angler_queen.glb', scale: .95, swing: .5 }],
  18: [{ name: 'The Forgemaster', url: '../models/forgemaster.glb', scale: .93, swing: .9 }, { name: 'The Ember Spirit', url: '../models/ember_spirit.glb', scale: .92, swing: .4 }],
  19: [{ name: 'The Sleepwalker', url: '../models/sleepwalker.glb', scale: .88, swing: .3 }, { name: 'The Moon Jester', url: '../models/moon_jester.glb', scale: .95, swing: 1 }],
  20: [{ name: 'The Ghost Hunter', url: '../models/ghost_hunter.glb', scale: .9, swing: 1 }, { name: 'The Ghost Bride', url: '../models/ghost_bride.glb', scale: .94, swing: .4, opacity: .72 }],
};
const MODEL_VER = 4;   // bump when models/*.glb change so browsers don't show old cached ones
const SKINS = /[?&]noskin/.test(location.search) ? null : SKIN_SETS[LEVEL];
// Either player may wear either skin: 'auto' = host gets [0], guest gets [1]. Saved per browser, shared by all levels.
const skinOpts = () => SKINS ? `<option value="auto">Auto (host = ${esc(SKINS[0].name)}, guest = ${esc(SKINS[1].name)})</option><option value="0">${esc(SKINS[0].name)}</option><option value="1">${esc(SKINS[1].name)}</option>` : '';
const feat = CFG.feature ? `<div class="feat">NEW POWER: <b>${CFG.feature.icon || ''} ${esc(CFG.feature.name)}</b><br>${CFG.feature.how}</div>` : '';
document.body.innerHTML = `
<div id="fade"><small>LEVEL ${LEVEL}</small><b>${esc(CFG.title)}</b></div>
<canvas id="c"></canvas><div id="dread"></div><div id="flash"></div><div id="frost"></div><div id="sightFx"></div>
<div id="hud" hidden>
  <div id="hudTop"><div class="pill" id="roomName"></div><div class="pill" id="timer">0:00</div><div class="pill" id="hintBtn" hidden>💡 Hint</div></div>
  <div id="objective"></div>
  <div id="barBox" hidden><div id="barWrap"><i id="barFill"></i></div><div id="barLbl"></div></div>
  <div id="panel" hidden></div>
  <div id="toast"></div><div id="story"></div>
  <div id="meters"><div class="meter" id="stamM"><i></i></div><div class="meter" id="oilM" hidden><i></i></div></div>
  <div id="powRow"></div>
  <div id="arrow" hidden></div>
</div>
<button id="btnExit" hidden title="Menu (Esc)">☰ Menu</button>
<div id="pause" class="screen" hidden><div class="card">
  <h2>☰ Menu</h2>
  <p class="pnote">The game keeps running while this is open — the ghosts don't wait!</p>
  <div class="prow"><button id="pResume" class="big" style="margin:0">Resume${isTouch ? '' : ' (Esc)'}</button></div>
  <div class="prow"><button id="pHint">💡 Hint</button><button id="pRespawn">↺ Room start</button><button id="pSkip">⏭ Skip room</button></div>
  <div class="prow" id="fsRow"><button id="pFull">⛶ Fullscreen</button></div>
  <div class="sec">SOUND</div>
  <label class="opt">Master volume<input type="range" id="oVol" min="0" max="1" step="0.05"></label>
  <label class="opt">Sound effects<input type="range" id="oSfx" min="0" max="1" step="0.05"></label>
  <label class="opt">Ambience<input type="range" id="oAmb" min="0" max="1" step="0.05"></label>
  <div class="sec">CAMERA &amp; SCREEN</div>
  <label class="opt">Camera sensitivity<input type="range" id="oSens" min="0.3" max="2.5" step="0.1"></label>
  <label class="opt">Invert camera tilt<input type="checkbox" id="oInv"></label>
  <label class="opt">Camera shake &amp; vibration<input type="checkbox" id="oShake"></label>
  <label class="opt">Dread effects (dark edges, flicker)<input type="checkbox" id="oDread"></label>
  <label class="opt">Graphics quality<select id="oQual"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low (faster)</option></select></label>
  <div class="sec">CONTROLS</div>
  <div class="ctl" id="ctlList"></div>
  <button id="pReset" class="link">Reset options</button>
  <button id="pLeave" class="link" style="color:#ff9a9a">Leave game</button>
</div></div><div id="leftBtns"><button id="btnRespawn" hidden title="Stuck? Go back to the start of this room (T)">↺<span class="full"> Room start (T)</span></button><button id="btnSkip" hidden title="Skip this room">⏭<span class="full"> Skip room</span></button></div>
<div id="touch" hidden><div id="joyBase"><div id="joyKnob"></div></div>
  <button class="tb" id="runBtn">RUN</button><button class="tb" id="dashBtn" hidden>⚡</button><button class="tb" id="powBtn" hidden>☀</button></div>
<div id="menu" class="screen"><div class="card">
  <div class="lvl">LEVEL ${LEVEL}</div>
  <h1>${esc(CFG.title)}</h1>
  <p class="sub">${CFG.tagline}</p>
  <p class="best" id="bestLine" hidden></p>
  ${feat}
  <label>Your name<input id="name" maxlength="12" autocomplete="off" placeholder="Name"></label>
  ${SKINS ? `<label>Character<select class="skinSel">${skinOpts()}</select></label>` : ''}
  <div class="two"><label>Level<select id="levelSel"></select></label><label>Start at<select id="startRoom"></select></label></div>
  <button id="btnResume" class="big" hidden></button>
  <button id="btnHost" class="big">Create game</button>
  <div class="join"><input id="code" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false"><button id="btnJoin">Join</button></div>
  <button id="btnSolo" class="link">Explore solo (test mode)</button>
  <p id="status"></p>
</div></div>
<div id="lobby" class="screen" hidden><div class="card">
  <h2>Room code</h2><div class="code" id="roomCode">····</div><p id="lobbyMsg">Connecting…</p>
  ${SKINS ? `<label>Your character<select class="skinSel">${skinOpts()}</select></label>` : ''}
  <button id="btnStart" class="big" disabled>Enter</button><button id="btnLeave" class="link">Leave</button>
</div></div>
<div id="won" class="screen" hidden><div class="card">
  <h2 id="wonTitle">You escaped! 🌙</h2><div class="stars" id="wonStars"></div><p class="sub" id="wonSub"></p><div class="rows" id="wonRows"></div>
  <button id="btnNext" class="big" hidden>Next level →</button>
  <button id="btnAgain" class="big">Play again</button><button id="btnMenu" class="link">Back to menu</button>
</div></div>`;
if (isTouch) document.body.classList.add('touch');

/* ===================== audio ===================== */
// Layers: a detuned drone, a whisper (band-passed noise) that swells and pans toward the nearest ghost, a heartbeat
// that quickens as one closes in, low wind, and the odd creak from somewhere in the house (see updateAmbience).
// Everything routes through master; one-shot effects go via sfxBus and the looping layers via ambBus (menu volume sliders).
let actx = null, droneGain = null, whisperGain = null, whisperPan = null, master = null, sfxBus = null, ambBus = null;
let themeGain = null, noiseBuf = null, brownBuf = null, ambOut = null;   // level soundscape (see THEMES below)
function applyAudio(){ if (!master) return; master.gain.value = OPT.vol; sfxBus.gain.value = OPT.sfx; ambBus.gain.value = OPT.amb; }
// The audio graph is built and the level's soundscape downloaded as soon as the page loads (the context starts
// suspended), so the first tap only has to resume it. Browsers that remember you tapped on this site start it at once.
function initAudio(){
  try {
    if (!actx){
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain(); master.connect(actx.destination);
      sfxBus = actx.createGain(); sfxBus.connect(master); ambBus = actx.createGain(); ambBus.connect(master); applyAudio();
      const o = actx.createOscillator(), o2 = actx.createOscillator(); droneGain = actx.createGain();
      o.type = 'sine'; o.frequency.value = CFG.drone || 55; o2.type = 'sine'; o2.frequency.value = (CFG.drone || 55) + .7;
      droneGain.gain.value = 0.04; o.connect(droneGain); o2.connect(droneGain); droneGain.connect(ambBus); o.start(); o2.start();
      const len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const n = actx.createBufferSource(); n.buffer = buf; n.loop = true;
      const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
      whisperGain = actx.createGain(); whisperGain.gain.value = 0;
      whisperPan = actx.createStereoPanner ? actx.createStereoPanner() : null;
      n.connect(f).connect(whisperGain); (whisperPan ? whisperGain.connect(whisperPan) : whisperGain).connect(ambBus); n.start();
      noiseBuf = buf; brownBuf = actx.createBuffer(1, len, actx.sampleRate);
      { const b = brownBuf.getChannelData(0); let v = 0; for (let i = 0; i < len; i++){ v = (v + .02 * (Math.random() * 2 - 1)) / 1.02; b[i] = v * 3.5; } }
      themeGain = actx.createGain(); themeGain.connect(ambBus);
      loadScape();
    }
  } catch {}
}
function unlockAudio(){
  initAudio();
  try { if (actx && actx.state !== 'running') actx.resume(); } catch {}
}
const audioOn = () => actx && actx.state === 'running';
// any tap or key unlocks audio, including pages reached by the auto-join redirect (no button press there)
addEventListener('pointerdown', unlockAudio, { passive: true }); addEventListener('keydown', unlockAudio);
function out(pan){
  const dst = ambOut || sfxBus;   // soundscape one-shots (asAmb) go to the ambience bus instead
  if (!pan || !actx.createStereoPanner) return dst;
  const p = actx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(dst); return p;
}
function beep(freq, dur = 0.12, type = 'sine', vol = 0.12, slide = 0, delay = 0, pan = 0){
  if (!audioOn()) return;   // nothing queues up while the context is still suspended
  const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out(pan)); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur = .3, vol = .12, freq = 800, delay = 0, pan = 0){
  if (!audioOn()) return;
  const t = actx.currentTime + delay, len = Math.floor(actx.sampleRate * dur), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const n = actx.createBufferSource(); n.buffer = buf; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = actx.createGain(); g.gain.value = vol; n.connect(f).connect(g).connect(out(pan)); n.start(t);
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
  dash(){ noise(.18, .1, 2500); beep(400, .15, 'sine', .05, 500); },
  flash(){ beep(1800, .35, 'sine', .08, -900); noise(.25, .06, 4000); },
  ping(){ beep(1320, .1, 'sine', .1); beep(1760, .18, 'sine', .08, 0, .08); },
  throw(){ noise(.15, .06, 1800); },
  splash(){ noise(.4, .12, 900); },
  boom(){ noise(.8, .25, 400); beep(60, .6, 'sawtooth', .12, -30); },
  crash(){ noise(.25, .18, 3000); beep(2400, .12, 'triangle', .05); beep(3100, .1, 'triangle', .04, 0, .05); beep(1800, .15, 'triangle', .04, 0, .1); },
  swap(){ beep(500, .3, 'sine', .1, 500); beep(1000, .3, 'sine', .1, -500, .05); },
  hook(){ beep(900, .25, 'square', .05, -500); },
  rewind(){ [900, 700, 500, 350].forEach((f, i) => beep(f, .08, 'sine', .08, 0, i * .05)); },
  bolt(){ beep(2200, .2, 'square', .05, -1800); },
  blast(){ noise(1, .3, 300); beep(200, 1, 'sine', .15, -150); },
  ui(){ beep(900, .04, 'triangle', .05); beep(1350, .05, 'triangle', .03, 0, .03); },
  pulse(v = 1){ beep(55, .16, 'sine', .22 * v, -15); beep(48, .2, 'sine', .16 * v, -12, .17); },
  creak(pan = 0){ const f = 140 + Math.random() * 120; beep(f, .9, 'sawtooth', .025, f * .35, 0, pan); beep(f * 1.5, .7, 'triangle', .015, -f * .4, .25, pan); },
  gust(pan = 0){ noise(2.2, .05, 600, 0, pan); },
};
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button') && !e.target.closest('#touch')) sfx.ui(); });
document.addEventListener('change', e => { if (e.target.tagName === 'SELECT') sfx.ui(); });

/* ----- level soundscapes: each level gets its own looping beds (noise / pads), a steady pulse (clock, rails, heart)
   and random one-shots, all synthesized. They play on the menu (quieter) and in the level, through themeGain. ----- */
const rnd = (a, b) => a + Math.random() * (b - a), rpan = () => rnd(-.8, .8), st = (f, s) => f * Math.pow(2, s / 12);
const pick = a => a[Math.floor(Math.random() * a.length)];
function asAmb(f){ ambOut = themeGain; try { f(); } finally { ambOut = null; } }
function bed(o){   // looping filtered noise: o.f filter freq, o.type, o.q, o.g gain, o.lfo swell rate (Hz), o.sweep [depth Hz, rate Hz], o.brown
  const s = actx.createBufferSource(); s.buffer = o.brown ? brownBuf : noiseBuf; s.loop = true; s.playbackRate.value = o.rate || 1;
  const f = actx.createBiquadFilter(); f.type = o.type || 'lowpass'; f.frequency.value = o.f || 600; f.Q.value = o.q || .7;
  const g = actx.createGain(); g.gain.value = o.g;
  s.connect(f).connect(g).connect(themeGain); s.start();
  if (o.lfo){ const l = actx.createOscillator(), lg = actx.createGain(); l.frequency.value = o.lfo; lg.gain.value = o.g * (o.depth ?? .7); l.connect(lg).connect(g.gain); l.start(); }
  if (o.sweep){ const l = actx.createOscillator(), lg = actx.createGain(); l.frequency.value = o.sweep[1]; lg.gain.value = o.sweep[0]; l.connect(lg).connect(f.frequency); l.start(); }
}
function pad(freqs, o = {}){   // sustained chord, each note a detuned pair, through a lowpass; o.trem = tremolo rate
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp || 900;
  const g = actx.createGain(); g.gain.value = o.g || .006; f.connect(g).connect(themeGain);
  for (const fr of freqs) for (const d of [-1, 1]){ const os = actx.createOscillator(); os.type = o.type || 'sine'; os.frequency.value = fr; os.detune.value = d * (o.det ?? 6); os.connect(f); os.start(); }
  if (o.trem){ const l = actx.createOscillator(), lg = actx.createGain(); l.frequency.value = o.trem; lg.gain.value = (o.g || .006) * .6; l.connect(lg).connect(g.gain); l.start(); }
}
const mel = (base, seq, step, type, vol, pan = 0, dur) => seq.forEach((s, i) => { if (s !== null) beep(st(base, s), dur || step * 1.6, type, vol, 0, i * step, pan); });
const A = {   // one-shot sound library
  bell(f, p = 0, v = .035){ beep(f, 3.5, 'sine', v, 0, 0, p); beep(f * 2.76, 2.2, 'sine', v * .35, 0, 0, p); beep(f * 5.4, 1.2, 'sine', v * .15, 0, 0, p); beep(f * .5, 4, 'sine', v * .5, 0, 0, p); },
  drip(p){ const f = rnd(1200, 2000); beep(f, .07, 'sine', .035, -f * .6, 0, p); beep(f * .9, .07, 'sine', .012, -f * .5, .28, -p); },
  gull(p){ beep(rnd(1600, 2000), .3, 'sine', .02, -700, 0, p); beep(rnd(1500, 1900), .35, 'sine', .018, -800, .38, p); },
  foghorn(){ beep(98, 3, 'sawtooth', .016, -3); beep(147, 3, 'sawtooth', .008, -4); },
  crow(p){ [0, .32].forEach(d => beep(rnd(500, 620), .22, 'sawtooth', .018, -220, d, p)); },
  croak(p){ const f = rnd(85, 120); for (let i = 0; i < 3; i++) beep(f, .12, 'sawtooth', .022, -25, i * .16, p); },
  crickets(p){ for (let i = 0; i < 8; i++) beep(4200, .025, 'sine', .008, 0, i * .06 + (i > 3 ? .2 : 0), p); },
  bubble(p){ const n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) beep(rnd(200, 500), .1, 'sine', .03, rnd(300, 700), i * rnd(.08, .2), p); },
  whistle(p){ [740, 932, 1108].forEach((f, i) => beep(f, 1.8, 'triangle', .016 - i * .003, -30, 0, p)); },
  choir(base, p){ [0, 3, 7].forEach(s => beep(st(base, s), 5, 'triangle', .008, st(base, s) * .006, 0, p)); },
  soprano(p){ mel(rnd(520, 660), [0, 1, 0, -2, 0, 3, null, -1], .55, 'sine', .018, p, .9); },
  clang(p){ beep(rnd(480, 560), 1.2, 'triangle', .028, -15, 0, p); beep(1350, .7, 'sine', .012, 0, 0, p); noise(.05, .05, 5000, 0, p); },
  bloop(p){ beep(rnd(60, 90), .35, 'sine', .05, rnd(40, 90), 0, p); },
  whale(p){ const f = rnd(120, 180); beep(f, 3.5, 'sine', .028, f * rnd(-.4, .3), 0, p); beep(f * 1.5, 3, 'sine', .01, f * .2, .4, p); },
  sonar(){ beep(1500, 1, 'sine', .02); beep(1500, 1, 'sine', .006, 0, .9); },
  pages(p){ for (let i = 0; i < 3; i++) noise(.2, .035, 3500, i * .18, p); },
  musicbox(base, seq, p, step = .32){ mel(base, seq, step, 'triangle', .016, p, .5); },
  ratchet(p){ for (let i = 0; i < 6; i++) beep(2600, .02, 'square', .01, 0, i * .05, p); },
  squeak(p){ beep(rnd(2000, 2600), .15, 'sine', .01, rnd(300, 800), 0, p); },
  chimes(p){ for (let i = 0; i < 5; i++) beep(st(1046, pick([0, 2, 4, 7, 9])), 1.2, 'triangle', .011, 0, i * rnd(.1, .3), p); },
  birds(p){ for (let i = 0; i < 4; i++) beep(rnd(2500, 3500), .08, 'sine', .01, rnd(600, 1200), i * .12, p); },
  sand(p){ noise(1.5, .025, 2500, 0, p); },
  oud(p){ const s = [0, 1, 4, 5, 7, 8, 7, 5, 4, 1]; const k = Math.floor(Math.random() * 4); mel(147, s.slice(k, k + 6), .22, 'sawtooth', .008, p, .4); },
  scarab(p){ for (let i = 0; i < 5; i++) beep(3000, .015, 'square', .008, 0, i * rnd(.04, .09), p); },
  pickaxe(p){ beep(2300, .18, 'triangle', .018, 0, 0, p); beep(2300, .18, 'triangle', .006, 0, .35, -p); },
  canary(p){ for (let i = 0; i < 6; i++) beep(rnd(3200, 3800), .05, 'sine', .01, 400, i * .07, p); },
  rumble(){ noise(2.5, .06, 120); },
  whisper(p){ noise(1.2, .018, 1400, 0, p); },
  shimmer(p){ for (let i = 0; i < 4; i++) beep(rnd(2000, 4200), .9, 'sine', .007, 0, i * .15, p); },
  rise(p){ beep(200, 1.2, 'sine', .018, 600, 0, p); },
  crackle(p){ const n = 3 + Math.floor(Math.random() * 5); for (let i = 0; i < n; i++) noise(.02, .045, 6000, rnd(0, .6), p); },
  waltz(p){ mel(rnd(330, 392), [0, 4, 7, 4, 0, -1, 2, 7, null], .4, 'triangle', .013, p, .6); },
  calliope(p){ mel(rnd(240, 300), [0, 3, 7, 6, 3, null, 0, -1], .28, 'square', .01, p); },
  laughter(p){ [420, 380, 440, 360, 300].forEach((f, i) => beep(f * rnd(.6, .8), .12, 'sawtooth', .013, -40, i * .11, p)); },
  creak: p => sfx.creak(p), gust: p => sfx.gust(p),
};
const LULLABY = [0, 4, 7, 12, 7, 4, 0, null, 2, 5, 9, 5];
// per level: build() makes the looping layers, ev = [[fn, weight], ...] fired every `every` seconds, pulse = [interval, fn(k)]
const THEMES = {
  2: { build(){ bed({ f: 380, g: .02, lfo: .07 }); pad([110, st(110, 3), st(110, 7)], { type: 'triangle', g: .005, lp: 700, trem: .25 }); },
       ev: [[A.calliope, 1], [A.laughter, .6], [A.creak, .6]], every: [6, 13] },                                       // Grimwood Carnival
  3: { build(){ bed({ f: 500, g: .014, lfo: .05 }); },
       pulse: [1, k => beep(k % 2 ? 1500 : 1100, .035, 'square', .02)],
       ev: [[p => A.bell(rnd(150, 210), p), 1], [p => { noise(1.4, .02, 700, 0, p); A.ratchet(p); }, .7], [A.creak, .5]], every: [8, 16] },   // Clocktower
  4: { build(){ bed({ brown: 1, f: 500, g: .05, lfo: .12, depth: .9 }); bed({ f: 2500, g: .006, lfo: .12, depth: .9 }); },
       ev: [[A.gull, 1], [A.foghorn, .5], [A.creak, .6]], every: [6, 14] },                                            // Sunken Lighthouse
  5: { build(){ bed({ type: 'bandpass', f: 700, q: 3, g: .045, sweep: [400, .05], lfo: .09 }); },
       ev: [[p => A.choir(rnd(98, 131), p), 1], [p => A.bell(rnd(180, 240), p, .02), .6], [A.gust, .6]], every: [8, 16] },   // Frozen Monastery
  6: { build(){ bed({ brown: 1, f: 300, g: .02 }); },
       ev: [[A.croak, 1], [A.crickets, 1], [A.bubble, .8], [A.crow, .5]], every: [3, 8] },                            // Witch's Bog
  7: { build(){ bed({ brown: 1, f: 160, g: .05, lfo: .5, depth: .3 }); },
       pulse: [.45, k => { if (k % 4 < 2) noise(.05, .045, 1800); }],
       ev: [[A.whistle, 1], [A.gust, .6]], every: [10, 20] },                                                         // Ghost Train
  8: { build(){ pad([65.4, 98, 130.8], { type: 'triangle', g: .006, lp: 600 }); },
       ev: [[A.soprano, 1], [p => beep(440, 3, 'sawtooth', .005, 0, 0, p), .4], [A.creak, .6]], every: [8, 15] },     // Opera House
  9: { build(){ pad([55, 82.4, 110, 164.8], { type: 'triangle', g: .006, lp: 700, trem: .1 }); bed({ f: 600, g: .012, lfo: .06 }); },
       ev: [[p => A.bell(rnd(110, 147), p), .8], [p => A.choir(rnd(110, 147), p), 1], [A.drip, .7], [A.crow, .5]], every: [7, 14] },   // Ruined Cathedral
  10: { build(){ pad([880, 1318.5, 1760], { g: .0018, trem: .2, det: 10 }); bed({ f: 3000, g: .004 }); },
        ev: [[A.shimmer, 1], [A.rise, .7], [A.whisper, .6]], every: [6, 12] },                                        // Mirror Palace
  11: { build(){ bed({ f: 250, g: .015 }); },
        pulse: [2, () => beep(900, .05, 'square', .012)],
        ev: [[A.pages, 1], [A.whisper, .7], [A.creak, .6]], every: [5, 11] },                                         // Spectral Archive
  12: { build(){ bed({ brown: 1, f: 250, g: .02, lfo: .8, depth: .3 }); },
        ev: [[p => A.musicbox(523, LULLABY, p), 1], [A.ratchet, .7], [A.squeak, .7]], every: [6, 12] },   // Toy Factory
  13: { build(){ bed({ brown: 1, f: 120, g: .04, lfo: .05 }); },
        ev: [[A.drip, 1.4], [A.pickaxe, .8], [A.canary, .5], [A.rumble, .4]], every: [3, 8] },                        // Coal Mine
  14: { build(){ bed({ type: 'bandpass', f: 900, q: 1.5, g: .03, sweep: [300, .07], lfo: .1 }); },
        ev: [[A.chimes, 1], [A.birds, .8], [A.gust, .6]], every: [4, 9] },                                            // Sky Gardens
  15: { build(){ bed({ f: 1800, g: .008, lfo: .06, depth: .9 }); pad([73.4, 110], { type: 'sawtooth', g: .004, lp: 300 }); },
        ev: [[A.oud, 1], [A.sand, .7], [A.scarab, .6], [A.whisper, .5]], every: [6, 12] },                            // Pharaoh's Tomb
  16: { build(){ bed({ f: 6000, g: .003 }); },
        ev: [[A.waltz, 1], [A.drip, .6], [A.creak, .6], [A.crackle, 1]], every: [5, 11] },                            // Wax Museum
  17: { build(){ bed({ brown: 1, f: 200, g: .06, lfo: .08 }); },
        ev: [[A.whale, 1], [A.sonar, .6], [A.bubble, 1]], every: [6, 13] },                                           // Abyssal Depths
  18: { build(){ bed({ brown: 1, f: 420, g: .05, lfo: .3, depth: .4 }); },
        ev: [[p => { A.clang(p); if (Math.random() < .5) A.clang(p); }, 1], [A.bloop, .9], [A.crackle, 1.2], [A.rumble, .4]], every: [3, 7] },   // Volcano Forge
  19: { build(){ pad([261.6, 329.6, 392, 493.9], { g: .0028, trem: .15, det: 14 }); },
        ev: [[p => A.musicbox(392, LULLABY.slice().reverse(), p, .45), 1], [A.whisper, .6], [A.rise, .6], [A.shimmer, .6]], every: [6, 12] },   // Dream Realm
  20: { build(){ pad([41.2, 61.7, 82.4], { type: 'sawtooth', g: .004, lp: 400 }); },
        pulse: [1.4, () => sfx.pulse(.3)],
        ev: [[A.creak, 1], [A.whisper, .8], [p => A.choir(rnd(73, 98), p), .6], [p => A.bell(rnd(98, 123), p, .02), .4]], every: [6, 12] },   // Heart of Hollow Manor
};
const THEME = THEMES[LEVEL] || { ev: [[A.creak, 1], [A.gust, .5]], every: [9, 23] };
// Pre-rendered soundscape (audio/levelN_bed.mp3 = seamless loop, levelN_fx.mp3 = one-shots in 5 s slots; made by
// soundscape/render.py). Until it loads nothing plays; if it can't load, the synthesized THEME above is used instead.
const AUDIO_VER = 3, BED_GAIN = .5, FX_GAIN = .28, FX_SLOT = 8;   // FX_SLOT matches SLOT in render.py
let scape = 'loading', ambEvT = 3, pulseT = 0, pulseK = 0;
async function loadScape(){
  try {
    const get = s => fetch((LEVEL === 1 ? './' : '../') + 'audio/level' + LEVEL + s + '.mp3?v=' + AUDIO_VER)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(a => new Promise((ok, no) => actx.decodeAudioData(a, ok, no)));
    const [bed, fx] = await Promise.all([get('_bed'), get('_fx')]);
    const s = actx.createBufferSource(), g = actx.createGain(), t = actx.currentTime;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(BED_GAIN, t + 1.2);   // fade in (runs once the context is going)
    s.buffer = bed; s.loop = true; s.loopStart = .1; s.loopEnd = bed.duration - .1;   // the files carry .1 s of wrap-around padding at each end
    s.connect(g).connect(themeGain); s.start(0, .1);
    scape = { fx, slots: Math.max(1, Math.round(fx.duration / FX_SLOT)) };
  } catch (e){
    scape = null;
    try { THEME.build && THEME.build(); } catch (e2){ console.warn('soundscape', e2); }
  }
}
function scapeFx(){
  const src = actx.createBufferSource(), g = actx.createGain(), k = Math.floor(Math.random() * scape.slots);
  src.buffer = scape.fx; g.gain.value = FX_GAIN * rnd(.5, 1);
  let node = g; if (actx.createStereoPanner){ const p = actx.createStereoPanner(); p.pan.value = rpan(); g.connect(p); node = p; }
  node.connect(themeGain); src.connect(g); src.start(0, k * FX_SLOT, FX_SLOT);
}
initAudio();   // build the graph and start downloading this level's soundscape right away
function themeTick(dt){
  if (!audioOn() || !themeGain) return;
  themeGain.gain.value = phase === 'play' ? 1 : .6;   // the menu gets the same soundscape, a little quieter
  if (scape === 'loading') return;
  if (scape){ ambEvT -= dt; if (ambEvT <= 0){ const [a, b] = THEME.every; ambEvT = rnd(a, b) * 1.4; scapeFx(); } return; }
  if (THEME.pulse){ pulseT -= dt; if (pulseT <= 0){ pulseT += THEME.pulse[0]; if (pulseT < 0) pulseT = THEME.pulse[0]; asAmb(() => THEME.pulse[1](pulseK++)); } }
  ambEvT -= dt;
  if (ambEvT <= 0 && THEME.ev){
    const [a, b] = THEME.every; ambEvT = rnd(a, b);
    let w = Math.random() * THEME.ev.reduce((s, e) => s + e[1], 0);
    const e = THEME.ev.find(e => (w -= e[1]) <= 0) || THEME.ev[0];
    asAmb(() => e[0](rpan()));
  }
}

/* ===================== renderer / scene ===================== */
const renderer = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
// levels with an image texture pack get filmic tone mapping so the darker, detailed textures still read
if (CFG.texVer){ renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = CFG.exposure || 1.7; }
const scene = new THREE.Scene();
const BG = CFG.bg || 0x05060c;
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 20, 42);
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300);
function resize(){ renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * (QUAL[OPT.qual] || 1)); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const AMB = CFG.ambient || 0.8;
const hemi = new THREE.HemisphereLight(CFG.sky || 0x6a6fa8, 0x15121f, AMB); scene.add(hemi);
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
function sector(len, half, color, opacity = .18){
  const m = new THREE.Mesh(new THREE.CircleGeometry(len, 20, -Math.PI / 2 - half, half * 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = .05; return m;
}

/* ===================== image textures (tex/levelN/) ===================== */
// pbr('name', repeatX, repeatY, opts) makes a material that starts with its old look (opts.fallback canvas texture
// or opts.color) and swaps in tex/levelN/name.jpg + name_n.jpg (normal map) once they load, so a missing file is harmless.
// opts.tile = metres per texture repeat on boxes (walls, blocks); opts.fullHeight stretches V over the box height.
const TL = new THREE.TextureLoader();
const TEX_DIR = LEVEL === 1 ? './tex/' : '../tex/level' + LEVEL + '/';   // Level 1's pack predates the per-level folders
const TEX_VER = CFG.texVer || 1;   // bump in the level file when its textures change so browsers don't show cached ones
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
const TEX_ROOT = LEVEL === 1 ? './tex/' : '../tex/';   // Level 1's pack sits in the root; shared maps in tex/common/
const COMMON_VER = 1;
// one texture per file + repeat, shared by every material that asks for it (many props each make their own material)
const TEXC = new Map();
function loadInto(m, slot, file, rx, ry, srgb, dir){
  const url = (dir || TEX_DIR) + file + '?v=' + (dir ? COMMON_VER : TEX_VER), key = url + '|' + rx + '|' + ry;
  let e = TEXC.get(key);
  if (!e){
    e = { t: null, wait: [] }; TEXC.set(key, e);
    TL.load(url, t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = MAX_ANISO;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      e.t = t; e.wait.forEach(f => f(t)); e.wait = null;
    }, undefined, () => { e.wait = null; });
  }
  const put = t => { m[slot] = t; if (slot === 'map') m.color.setHex(m.userData.tint ?? 0xffffff); m.needsUpdate = true; };
  if (e.t) put(e.t); else if (e.wait) e.wait.push(put);
}
function pbr(name, rx = 1, ry = 1, o = {}){
  const m = new THREE.MeshStandardMaterial({ color: o.color ?? 0xffffff, roughness: o.roughness ?? .85, metalness: o.metalness ?? 0, map: o.fallback || null });
  m.userData.tint = o.tint ?? 0xffffff; m.userData.pbr = true; if (o.tile) m.userData.tile = o.tile; if (o.fullHeight) m.userData.fullHeight = true;
  if (o.emissive !== undefined){ m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.emissiveIntensity ?? .3; if (o.emissiveMap) loadInto(m, 'emissiveMap', name + '.jpg', rx, ry, true, o.dir); }
  if (o.transparent){ m.transparent = true; m.opacity = o.opacity ?? .85; m.depthWrite = false; }
  loadInto(m, 'map', name + '.jpg', rx, ry, true, o.dir);
  if (o.normal !== 0){ loadInto(m, 'normalMap', name + '_n.jpg', rx, ry, false, o.dir); m.normalScale = new THREE.Vector2(o.normal ?? 1, o.normal ?? 1); }
  return m;
}
// another level's texture (pbrFrom(1, 'door') = Level 1's pack, pbrFrom('common', …) = tex/common/)
const pbrFrom = (lv, name, rx, ry, o = {}) => pbr(name, rx, ry, { ...o, dir: lv === 'common' ? TEX_ROOT + 'common/' : lv === 1 ? TEX_ROOT : TEX_ROOT + 'level' + lv + '/' });
// a level-pack texture for a prop (rooms call E.tex('pew_oak', { color })): keeps the colour as the fallback look
// Without rx/ry the texture repeats every o.tile metres (default 1.5) on whatever mesh uses it (UVs are scaled per mesh by detailPass).
const propTex = (name, o = {}) => {
  const m = pbr(name, o.rx || 1, o.ry || 1, { color: o.color ?? 0xffffff, roughness: o.roughness ?? .75, metalness: o.metalness ?? 0, tint: o.tint, normal: o.normal, emissive: o.emissive, emissiveIntensity: o.emissiveIntensity, emissiveMap: o.emissiveMap, transparent: o.transparent, opacity: o.opacity, tile: o.tile, dir: o.dir, fallback: o.fallback });
  if (o.side !== undefined) m.side = o.side;
  if (!o.rx && !o.ry) m.userData.autoUV = o.tile || 1.5;
  return m;
};

/* ----- detail pass: every plain-coloured prop (no texture of its own) gets a shared detail map that multiplies over its colour
   (wood grain, stone pits and cracks, brushed metal, or soft grime, chosen from the colour), repeated about once a metre ----- */
const DETAIL = {};
function detailMats(kind){
  if (DETAIL[kind]) return DETAIL[kind];
  const mk = (f, srgb) => { const t = TL.load(TEX_ROOT + 'common/' + f + '?v=' + COMMON_VER); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, MAX_ANISO); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return DETAIL[kind] = { map: mk('detail_' + kind + '.jpg', true), normal: OPT.qual === 'low' ? null : mk('detail_' + kind + '_n.jpg', false) };
}
const _hsl = {}, _ws = new THREE.Vector3(), _bb = new THREE.Box3(), _sz = new THREE.Vector3();
function detailKind(m){
  if (m.metalness > .45) return 'metal';
  m.color.getHSL(_hsl);
  if (_hsl.s > .2 && _hsl.h > .02 && _hsl.h < .13 && _hsl.l < .55) return 'wood';
  if (_hsl.s < .2) return 'stone';
  return 'grime';
}
function detailUV(mesh, tile = 1.4){
  const geo = mesh.geometry; if (!geo || geo.userData.duv || !geo.attributes.uv) return;
  geo.userData.duv = true;
  mesh.getWorldScale(_ws); const p = geo.parameters || {};
  if (geo.type === 'BoxGeometry'){ boxUV(geo, p.width * _ws.x, p.height * _ws.y, p.depth * _ws.z, tile, false); return; }
  if (!geo.boundingBox) geo.computeBoundingBox(); _bb.copy(geo.boundingBox).getSize(_sz).multiply(_ws);
  let su, sv;
  if (geo.type === 'CylinderGeometry' || geo.type === 'ConeGeometry'){ const r = Math.max(p.radiusTop ?? p.radius ?? .5, p.radiusBottom ?? p.radius ?? .5) * Math.max(_ws.x, _ws.z); su = 2 * Math.PI * r / tile; sv = (p.height || 1) * _ws.y / tile; }
  else if (geo.type === 'SphereGeometry'){ const r = (p.radius || .5) * Math.max(_ws.x, _ws.y, _ws.z); su = 2 * Math.PI * r / tile; sv = Math.PI * r / tile; }
  else if (geo.type === 'PlaneGeometry'){ su = (p.width || 1) * _ws.x / tile; sv = (p.height || 1) * _ws.y / tile; }
  else { const d = Math.max(_sz.x, _sz.y, _sz.z); su = sv = d / tile; }
  su = Math.max(.35, su); sv = Math.max(.35, sv);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); uv.needsUpdate = true;
}
function detailPass(root = scene){
  if (CFG.detail === false) return;
  const walk = o => {
    if (o.userData.noDetail) return;
    if (o.isMesh && !Array.isArray(o.material)){
      const m = o.material;
      if (m && m.isMeshStandardMaterial && !m.map && !m.userData.pbr && !m.userData.noDetail && !m.transparent && !(m.emissiveIntensity > .05 && m.emissive && m.emissive.getHex()))
      {
        if (!m.userData.detail){ const d = detailMats(detailKind(m)); m.map = d.map; if (d.normal && !m.normalMap){ m.normalMap = d.normal; m.normalScale = new THREE.Vector2(.8, .8); } m.color.multiplyScalar(1.07); m.userData.detail = true; m.needsUpdate = true; }
        if (m.userData.detail) detailUV(o);
      } else if (m && m.userData.detail) detailUV(o);
      else if (m && m.userData.autoUV) detailUV(o, m.userData.autoUV);
    }
    for (const c of o.children) walk(c);
  };
  walk(root);
}
// rescale a box's UVs so its texture repeats every `tile` metres instead of stretching once per face
function boxUV(geo, sx, sy, sz, tile, fullHeight){
  const uv = geo.attributes.uv, dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++){
    const [w, h] = dims[f], side = f !== 2 && f !== 3;
    for (let k = 0; k < 4; k++){ const i = f * 4 + k; uv.setXY(i, uv.getX(i) * w / tile, (side && fullHeight) ? uv.getY(i) : uv.getY(i) * h / tile); }
  }
  uv.needsUpdate = true;
}

/* ===================== map helpers ===================== */
const WALL_H = 2.4;
const RECTS = [];
const wallMat = CFG.wallImg ? pbr(CFG.wallImg, 1, 1, { fallback: CFG.wallTex ? canvasTex(128, 128, CFG.wallTex) : null, color: CFG.wallTex ? 0xffffff : (CFG.wallColor || 0x3a2b4d), tile: 2.4, fullHeight: true, roughness: .9 })
  : CFG.wallTex ? mat(0xffffff, { map: canvasTex(128, 128, CFG.wallTex) }) : mat(CFG.wallColor || 0x3a2b4d);
const trimMat = CFG.trimImg ? pbr(CFG.trimImg, 1, 1, { color: CFG.trimColor || 0x5c4670, tile: 1, roughness: .45, metalness: .5 }) : mat(CFG.trimColor || 0x5c4670);
function block(x1, z1, x2, z2, h, m, collide = true){
  if (x1 > x2) [x1, x2] = [x2, x1]; if (z1 > z2) [z1, z2] = [z2, z1];
  const geo = new THREE.BoxGeometry(x2 - x1, h, z2 - z1);
  if (m.userData && m.userData.tile){ boxUV(geo, x2 - x1, h, z2 - z1, m.userData.tile, !!m.userData.fullHeight); geo.userData.duv = true; }
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set((x1 + x2) / 2, h / 2, (z1 + z2) / 2); scene.add(mesh);
  if (collide) RECTS.push({ x1, x2, z1, z2 });
  return mesh;
}
function wallBox(x1, z1, x2, z2, h = WALL_H){
  if (x1 > x2) [x1, x2] = [x2, x1]; if (z1 > z2) [z1, z2] = [z2, z1];
  block(x1, z1, x2, z2, h, wallMat);
  const tg = new THREE.BoxGeometry(x2 - x1 + .08, .14, z2 - z1 + .08); if (trimMat.userData.tile) boxUV(tg, x2 - x1 + .08, .14, z2 - z1 + .08, 1);
  const t = new THREE.Mesh(tg, trimMat);
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
const glassMat = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: .22, roughness: .05, metalness: .2, emissive: 0x335577, emissiveIntensity: .3 });
const _doorMats = {};   // CFG.doorImg / CFG.frontDoorImg give doors an image texture
function doorMat(front){
  const k = front ? 'f' : 'd'; if (_doorMats[k]) return _doorMats[k];
  const img = front ? CFG.frontDoorImg : CFG.doorImg, col = front ? 0x5a1f1f : (CFG.doorColor || 0x5b3a22);
  // levels without their own door art borrow Level 1's carved doors (tinted toward the level's door colour)
  return _doorMats[k] = img ? pbr(img, 1, 1, { color: col, roughness: front ? .6 : .7, normal: 1.4 })
    : pbrFrom(1, front ? 'frontdoor' : 'door', 1, 1, { color: col, roughness: front ? .6 : .7, normal: 1.4, tint: front ? 0xffffff : new THREE.Color(col).lerp(new THREE.Color(0xffffff), .55).getHex() });
}
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
  } else if (style === 'glass'){
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), glassMat); p.position.y = WALL_H / 2; g.add(p);
  } else {
    const dm = doorMat(style === 'front');
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
/* ===================== 3D skins (models/*.glb, built in Blender) ===================== */
// Each level's character pair: player 1 (host) wears [0] (cool-toned), player 2 wears [1] (warm-toned).
// The models use Pivot_* nodes for the walk cycle and Spin_* nodes for things that turn (gears, watch hands, keys).
// Needs an importmap for 'three/addons/' in the level page; without one, a failed load or ?noskin, the blob characters stay.
let skinKitP = null;
function skinKit(){   // GLTFLoader + a soft studio reflection so brass and silver read as metal
  return skinKitP = skinKitP || Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/environments/RoomEnvironment.js')])
    .then(([g, r]) => { const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromScene(new r.RoomEnvironment(), .04).texture; pm.dispose(); return { loader: new g.GLTFLoader(), env }; })
    .catch(e => { console.warn('3D skins unavailable', e); return null; });
}
const skinLoads = [];
function loadSkin(i){
  return skinLoads[i] = skinLoads[i] || skinKit().then(kit => kit && new Promise(res =>
    kit.loader.load(SKINS[i].url + '?v=' + MODEL_VER, g => res({ scene: g.scene, env: kit.env }), undefined, e => { console.warn('skin failed', SKINS[i].url, e); res(null); })));
}
function makeChar(color, ghostly = false){
  const group = new THREE.Group(), rig = new THREE.Group(); group.add(rig); group.userData.noDetail = true;
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
    out.hold = new THREE.Group(); out.hold.position.set(0, 1.9, 0); group.add(out.hold);
    out.label = nameSprite(); out.label.position.y = 2.25; group.add(out.label);
  }
  // 3D skin: swaps out the blob body once its model has loaded
  out.skins = [null, null]; out.skinIdx = color === COLORS[1] ? 1 : 0; out.skin = null;
  out.setSkin = idx => {
    out.skinIdx = idx; const sk = out.skins[idx] || null;
    for (const s of out.skins) if (s) s.root.visible = s === sk;
    for (const ch of rig.children) if (!ch.userData.skin) ch.visible = !sk;
    out.skin = sk;
  };
  if (SKINS && !ghostly) [0, 1].forEach(i => loadSkin(i).then(r => {
    if (!r) return;
    const root = r.scene.clone(true); root.userData.skin = true; root.scale.setScalar(SKINS[i].scale);
    const mats = [], spins = [];
    root.traverse(o => {
      if (o.name.startsWith('Spin_')) spins.push(o);
      if (!o.isMesh) return;
      o.material = o.material.clone(); o.material.envMap = r.env; o.material.envMapIntensity = .35;
      if (SKINS[i].flicker || SKINS[i].opacity){ o.material.transparent = true; o.material.depthWrite = true; }   // flickering / see-through skins stay transparent so fades don't recompile shaders
      if (SKINS[i].opacity) o.material.opacity *= SKINS[i].opacity;
      o.material.userData.op = o.material.opacity; o.material.userData.tr = o.material.transparent; mats.push(o.material);
    });
    const f = n => root.getObjectByName(n);
    out.skins[i] = { root, mats, spins, swing: SKINS[i].swing, flicker: !!SKINS[i].flicker, legs: [f('Pivot_LegA'), f('Pivot_LegB')], arms: [f('Pivot_ArmA'), f('Pivot_ArmB')], head: f('Pivot_Head'), tail: f('Pivot_Tail') };
    rig.add(root); out.setSkin(out.skinIdx);
  }));
  scene.add(group);
  return out;
}
function animChar(c, dt, moving, running, oil = 1){
  c.t += dt * (moving ? (running ? 16 : 11) : 2.5);
  const sk = c.skin;
  const bob = sk ? (moving ? Math.abs(Math.cos(c.t)) * (running ? .07 : .045) : Math.sin(c.t) * .01) : moving ? Math.abs(Math.sin(c.t)) * .15 : Math.sin(c.t) * .025;
  c.rig.position.y = bob; c.rig.rotation.z = moving ? Math.sin(c.t) * (sk ? .035 : .07) : 0;
  if (sk){   // limb swing on the model's Pivot_* nodes, same feel as Level 1
    const s = Math.sin(c.t), sw = moving ? (running ? .85 : .6) : 0;
    c.rig.rotation.x = moving ? (running ? .12 : .05) : 0;
    sk.legs[0].rotation.x = s * sw * sk.swing; sk.legs[1].rotation.x = -s * sw * sk.swing;
    sk.arms[0].rotation.x = -s * sw * .9;
    sk.arms[1].rotation.x = moving ? s * sw * .5 - .15 : Math.sin(c.t * .5) * .04 - .1;
    sk.head.rotation.y = moving ? 0 : Math.sin(c.t * .35) * .18; sk.head.rotation.z = moving ? s * .04 : 0;
    if (sk.tail) sk.tail.rotation.x = moving ? .05 + Math.abs(s) * (running ? .32 : .15) : Math.sin(c.t * .8) * .03;
    const now = performance.now() / 1000;
    for (const o of sk.spins) o.rotation.y = o.name.includes('Hands') ? -Math.floor(now) * Math.PI / 30 : -now * .8;   // watch hands tick, gears and keys turn
    let op = c.bodyMat.opacity;   // follow the blob material's fade (shadow hiding)
    if (sk.flicker){ const f = Math.sin(now * 2.3) + Math.sin(now * 5.7 + 1) + Math.sin(now * 13.1 + 2); op *= f > 2.2 ? .2 : f > 1.9 ? .55 : 1; }   // a faulty projector
    if (op !== sk.op){ sk.op = op; for (const m of sk.mats){ const tr = m.userData.tr || op < .999; if (tr !== m.transparent){ m.transparent = tr; m.needsUpdate = true; } m.opacity = m.userData.op * op; } }
  }
  if (c.light){ const k = has('oil') ? .3 + .7 * oil : 1; c.light.intensity = (6 + Math.sin(performance.now() * .013) * .4 + Math.sin(performance.now() * .031) * .3) * k * (CFG.lantern || 1); c.light.distance = 15 * (has('oil') ? .45 + .55 * oil : 1); }
}

/* ===================== ghosts ===================== */
const GHOSTS = [];
const ghostMat = new THREE.MeshStandardMaterial({ color: 0xeaf2ff, emissive: 0x9fc4ff, emissiveIntensity: .55, transparent: true, opacity: .82, roughness: .5, side: THREE.DoubleSide });
function ghostMesh(look, tint){
  const gm = tint ? new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: .5, transparent: true, opacity: .85, roughness: .5, side: THREE.DoubleSide }) : ghostMat;
  const grp = new THREE.Group(); grp.userData.noDetail = true;
  const eye = new THREE.MeshBasicMaterial({ color: 0x0b0710 });
  if (look === 'wisp' || look === 'small'){
    const b = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 12), gm); b.position.y = .9; b.scale.set(1.2, .9, 1.5); grp.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 10), gm); h.position.set(0, 1.35, .55); grp.add(h);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.2, .8, 8), gm); tail.position.set(0, 1, -.75); tail.rotation.x = -1.2; grp.add(tail);
    for (const s of [-1, 1]){ const e = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), eye); e.position.set(s * .12, 1.42, .78); grp.add(e); }
    if (look === 'small') grp.scale.setScalar(.6);
    return grp;
  }
  if (look === 'blob'){
    const b = new THREE.Mesh(new THREE.SphereGeometry(.7, 16, 12), gm); b.position.y = .6; b.scale.set(1, .7, 1); grp.add(b);
    for (const s of [-1, 1]){ const e = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), eye); e.position.set(s * .25, .8, .6); grp.add(e); }
    return grp;
  }
  if (look === 'knight' || look === 'statue'){
    const solid = mat(tint || 0x6a6a7a, { metalness: look === 'knight' ? .7 : .1, roughness: .4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.4, .6), solid); body.position.y = 1; grp.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .55), solid); head.position.y = 2; grp.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(.4, .08, .05), glow(0xff3a3a, 2)); visor.position.set(0, 2.02, .29); grp.add(visor);
    for (const s of [-1, 1]){ const leg = new THREE.Mesh(new THREE.BoxGeometry(.3, .5, .3), solid); leg.position.set(s * .22, .25, 0); grp.add(leg); }
    return grp;
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 18, 14), gm); head.position.y = 1.55; grp.add(head);
  const skirtGeo = new THREE.CylinderGeometry(.55, .78, 1.2, 18, 3, true);
  const pos = skirtGeo.attributes.position;
  for (let i = 0; i < pos.count; i++){ if (pos.getY(i) < -.5){ const a = Math.atan2(pos.getZ(i), pos.getX(i)); pos.setY(i, pos.getY(i) + Math.sin(a * 6) * .12); } }
  skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, gm); skirt.position.y = .95; grp.add(skirt);
  for (const s of [-1, 1]){ const e = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), eye); e.scale.set(1, 1.5, .5); e.position.set(s * .2, 1.62, .5); grp.add(e); }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), eye); mouth.scale.set(1, 1.3, .4); mouth.position.set(0, 1.32, .52); grp.add(mouth);
  for (const s of [-1, 1]){ const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .4, 4, 8), gm); arm.position.set(s * .62, 1.15, .2); arm.rotation.set(-.9, 0, s * .4); grp.add(arm); }
  if (look === 'hat'){ const hm = mat(0x1a1a24); const brim = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .06, 16), hm); brim.position.y = 2; grp.add(brim); const top = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .45, 16), hm); top.position.y = 2.25; grp.add(top); }
  if (look === 'hood'){ const hood = new THREE.Mesh(new THREE.ConeGeometry(.62, .9, 16), gm); hood.position.y = 2.1; grp.add(hood); }
  if (look === 'crown'){ const cm = glow(0xffd84d, .8); for (let i = 0; i < 6; i++){ const sp = new THREE.Mesh(new THREE.ConeGeometry(.1, .35, 4), cm); const a = i / 6 * Math.PI * 2; sp.position.set(Math.cos(a) * .4, 2.15, Math.sin(a) * .4); grp.add(sp); } }
  if (look === 'big' || look === 'crown') grp.scale.setScalar(1.6);
  return grp;
}
// Sculpted enemies (models/enemies.glb, one Enemy_<look> root each) replace the shapes above once loaded.
// TintBody / TintGlow take the level's ghost tint; Sway_* nodes drift, Reach_* arms reach for you when close.
const ENEMY_ROOT = { small: 'wisp', big: 'normal' };
let enemyGlb = null;
function dressGhost(g){
  if (!enemyGlb || g.model) return;
  const src = enemyGlb.getObjectByName('Enemy_' + (ENEMY_ROOT[g.look] || g.look)) || enemyGlb.getObjectByName('Enemy_normal');
  if (!src) return;
  const solid = g.look === 'statue' || g.look === 'knight', mats = {};
  const root = src.clone(); root.position.set(0, 0, 0);
  root.traverse(o => {
    if (!o.isMesh) return;
    o.userData.enemy = 1;
    const n = o.material.name;
    if (n !== 'TintBody' && n !== 'TintGlow') return;
    o.material = mats[n] = mats[n] || (() => {
      const m = o.material.clone();
      if (n === 'TintGlow'){ if (g.tint) m.emissive.setHex(g.tint); }
      else if (solid){ if (g.tint) m.color.setHex(g.tint); }
      else { m.color.setHex(g.tint || 0xeaf2ff); m.emissive.setHex(g.tint || 0x9fc4ff); m.emissiveIntensity = .45; m.transparent = true; m.opacity = .85; m.depthWrite = false; m.side = THREE.DoubleSide; }
      return m;
    })();
  });
  for (const ch of g.mesh.children) if (ch !== g.coneMesh && ch !== g.beamMesh) ch.visible = false;
  g.mesh.add(root);
  g.model = root; g.sway = []; g.reach = []; g.reachK = 0;
  root.traverse(o => {
    if (o.isMesh) return;   // merged meshes inherit their pivot's name; only the pivots move
    const p = { o, rx: o.rotation.x, rz: o.rotation.z, ph: Math.random() * 6 };
    if (o.name.startsWith('Sway_')) g.sway.push(p);
    else if (o.name.startsWith('Reach_')) g.reach.push(p);
  });
}
function animGhost(g, t, dt, gd){
  if (!g.model) return;
  for (const s of g.sway){ s.o.rotation.z = s.rz + Math.sin(t * 1.3 + s.ph) * .07; s.o.rotation.x = s.rx + Math.sin(t * .9 + s.ph) * .05; }
  g.reachK += (clamp((6 - gd) / 5, 0, 1) - g.reachK) * damp(4, dt);
  g.reach.forEach((r, i) => { r.o.rotation.x = r.rx - g.reachK * 1.1 + Math.sin(t * (2 + g.reachK * 6) + i * 1.7) * (.05 + g.reachK * .12); });
}
const DEV = /[?&]dev\b/.test(location.search);
if (DEV) window.HM = { GHOSTS, scene, get me(){ return me; }, ghost(look, tint){ const g = { look, tint, mesh: ghostMesh(look, tint) }; dressGhost(g); return g; }, animGhost };
if (!/noskin/.test(location.search)) skinKit().then(kit => kit && kit.loader.load((LEVEL === 1 ? '' : '../') + 'models/enemies.glb?v=' + MODEL_VER,
  gl => { enemyGlb = gl.scene; GHOSTS.forEach(dressGhost); }, undefined, e => console.warn('enemy models failed', e)));

/* ===================== state ===================== */
let role = null, phase = 'menu', paused = false;
let myName = store.get('hm_name', '');
let remoteName = 'Partner';
let skinPref = store.get('hm_skin', 'auto'), remoteSkin = null;
const mySkin = () => skinPref === 'auto' ? myIdx() : (+skinPref ? 1 : 0);
const otherSkin = () => remoteSkin === null ? 1 - myIdx() : remoteSkin;
const reachKey = 'hm_reached_L' + LEVEL;
let reached = parseInt(store.get(reachKey, LEVEL === 1 ? store.get('hm_reached', '0') : '0')) || 0;   // Level 1 used to save under hm_reached
const myIdx = () => role === 'guest' ? 1 : 0;
const names = () => myIdx() === 0 ? [myName || 'You', remoteName] : [remoteName, myName || 'You'];
const SOLO = () => role === 'solo';
const ECHO = 5;
const S = { doors: {}, plateOn: {}, frozen: [0, 0], freezes: 0, elapsed: 0, startRoom: 0, rs: [], broken: {}, decoys: [], bolts: [], sb: null, fx: [], echoes: [], ev: [] };
function echoPos(e){ const p = e.p; if (e.t >= p[p.length - 1][0]) return [p[p.length - 1][1], p[p.length - 1][2]]; for (let i = 1; i < p.length; i++) if (p[i][0] >= e.t){ const a = p[i - 1], b = p[i], f = (e.t - a[0]) / ((b[0] - a[0]) || 1); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; } return [p[0][1], p[0][2]]; }
function echoList(){ return role === 'guest' ? (S.ev || []) : S.echoes.map(e => { const [x, z] = echoPos(e); return [e.idx, r2(x), r2(z)]; }); }
const hostMem = {};
const me = { pos: new THREE.Vector3(0, 0, 6), ry: Math.PI, moving: false, running: false, stamina: 2.5, slide: null, inp: [0, 0, 0], dash: null, grap: null, dashCD: 0, powCD: 0, sight: 0, sightE: 1, oil: 1, hist: [], rewCD: 0, decoyCD: 0 };
const other = { target: new THREE.Vector3(0, 0, 6), ry: 0, moving: false, running: false, seen: false, inp: [0, 0, 0], dashing: 0, sight: 0, oil: 1 };
let curP = [];
const edges = {}, held = {};
const PINGS = [];

/* ===================== rooms ===================== */
const ROOMS = [];
const HOOKS = [], SPECTRAL = [], LOWS = [], CRACKED = [];
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
  R.open = n => { S.doors[R.id(n)] = 1; if (n === 'exit') for (let k = 1; k < (def.exits || []).length; k++) S.doors['X' + i + '_' + k] = 1; };
  R.close = n => { S.doors[R.id(n)] = 0; };
  R.setDoor = (n, v) => { S.doors[R.id(n)] = v ? 1 : 0; };
  R.isOpen = n => !!S.doors[R.id(n)];
  R.inside = pos => pos.z <= R.zS && pos.z > R.zN;
  R.st = () => S.rs[i];
  R.ghost = gdef => {
    const g = { ...gdef, room: i };
    g.b = gdef.b ? [gdef.b[0], gdef.b[1], R.Z(gdef.b[3]), R.Z(gdef.b[2])] : [-9.4, 9.4, R.Z(21.4), R.Z(.6)];
    g.home = [gdef.home[0], R.Z(gdef.home[1])];
    g.mesh = ghostMesh(gdef.look || 'normal', gdef.tint); scene.add(g.mesh);
    if (gdef.cone){ g.coneMesh = sector(gdef.cone.len, gdef.cone.ang, gdef.cone.color || 0xfff1a0, .16); g.mesh.add(g.coneMesh); }
    if (gdef.beam){ const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .12, gdef.beam.len), new THREE.MeshBasicMaterial({ color: gdef.beam.color || 0xbfeaff, transparent: true, opacity: .6 })); b.position.set(0, 1, gdef.beam.len / 2); g.mesh.add(b); g.beamMesh = b; }
    if (gdef.scale) g.mesh.scale.setScalar(gdef.scale);
    g.x = g.tx = g.home[0]; g.z = g.tz = g.home[1]; g.y = 0; g.ry = gdef.ry || 0; g.rest = 1.5; g.ret = false; g.wx = null; g.wt = 0; g.w = 0; g.mem = {}; g.stun = 0;
    g.look = gdef.look || 'normal';
    GHOSTS.push(g); dressGhost(g); return g;
  };
  R.hook = (x, lz, opt = {}) => { const h = { x, z: R.Z(lz), room: i, ...opt }; HOOKS.push(h); return h; };
  R.spectral = (x1, lz1, x2, lz2) => { const r = R.rect(x1, lz1, x2, lz2); SPECTRAL.push(r); return r; };
  R.low = (x1, lz1, x2, lz2) => { const r = R.rect(x1, lz1, x2, lz2); LOWS.push(r); return r; };
  R.cracked = (n, x1, lz1, x2, lz2) => { const c = { id: R.id(n), rect: R.rect(x1, lz1, x2, lz2), room: i }; CRACKED.push(c); return c; };
  R.broken = n => !!S.broken[R.id(n)];
  const sp = def.spawn || [[-1.5, 1.6], [1.5, 1.6]];
  R.spawnW = sp.map(([x, lz]) => [x, R.Z(lz)]);
  ROOMS.push(R);
});
const OUT_Z = zCursor, WIN_Z = OUT_Z - 4;
const roomAt = z => ROOMS.findIndex(R => z <= R.zS && z > R.zN);

/* ----- shell ----- */
vwall(-10.5, 10.5, OUT_Z - .5); vwall(10.5, 10.5, OUT_Z - .5); hwall(10, -11, 11);
// each room's north wall has one exit (def.exitX) or several (def.exits: [[x1, x2], ...]); door 'X'+i is the first,
// any others are 'X'+i+'_1', '_2'… and R.open('exit') opens them all
ROOMS.forEach((R, i) => {
  const gaps = (R.def.exits || [R.def.exitX || [-1.5, 1.5]]).slice().sort((a, b) => a[0] - b[0]);
  let x = -11;
  for (const [dx1, dx2] of gaps){ hwall(R.zN, x, dx1); x = dx2; }
  hwall(R.zN, x, 11);
  (R.def.exits || [R.def.exitX || [-1.5, 1.5]]).forEach(([dx1, dx2], k) => makeDoor('X' + i + (k ? '_' + k : ''), dx1, R.zN - .4, dx2, R.zN + .4, i === ROOMS.length - 1 ? 'front' : 'wood'));
});
// the garden you escape into (every level): Level 1's grass and hedge textures
floor(-25, OUT_Z - 40, 25, OUT_Z, pbrFrom(1, 'grass', 12, 10, { color: 0x1d3322, tint: 0xd8e8d0, roughness: .95 }), .002);
{
  const hedge = pbrFrom(1, 'hedge', 1, 1, { color: 0x234a2a, tint: 0xe0f0e0, tile: 1.5, roughness: .9 });
  block(-5, OUT_Z - 20, -4, OUT_Z - .5, 1.2, hedge); block(4, OUT_Z - 20, 5, OUT_Z - .5, 1.2, hedge); block(-5, OUT_Z - 21, 5, OUT_Z - 20, 1.2, hedge);
  for (let i = 0; i < 16; i++){
    const side = i % 2 ? 1 : -1, x = side * (8 + Math.random() * 12), z = OUT_Z - 3 - Math.random() * 28;
    const tr = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4 + Math.random() * 2, 7), mat(0x14261a)); tr.position.set(x, 2.5, z); scene.add(tr);
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })); m.position.set(-30, 30, OUT_Z - 70); scene.add(m);
}

/* ----- wall dressing (CFG.decor): the level's theme repeated along the side walls of every room — stained glass,
   curtains, shelves, dials, crystals… Purely visual (no colliders); a spot is skipped when anything already stands
   against the wall there, or the room sets noDecor.
   decor: { kind: 'panel' | 'drape' | 'disc' | 'ring' | 'cluster', tex, w, h, y, every, skip, glow, frame, mullion, color, tint } (no lights: they'd slow every material) ----- */
function wallDecor(){
  const D = CFG.decor; if (!D) return;
  const list = Array.isArray(D) ? D : [D];
  // what already touches the side walls (props and blocks within 1.1 m of them), so dressing never clips through it
  const near = [];
  const bb = new THREE.Box3();
  scene.traverse(o => { if (!o.isMesh || o.material === wallMat || o.material === trimMat || o.geometry.type === 'PlaneGeometry' && Math.abs(o.rotation.x + Math.PI / 2) < .01) return; bb.setFromObject(o); if (bb.max.y < .15 || bb.isEmpty()) return; if (bb.max.x > 8.9 || bb.min.x < -8.9){ if (bb.max.x - bb.min.x > 18) return; near.push(bb.clone()); } });
  const blocked = (s, z1, z2) => near.some(b => (s > 0 ? b.max.x > 8.9 : b.min.x < -8.9) && b.max.z > z1 - .2 && b.min.z < z2 + .2);
  const frameMat = trimMat;
  ROOMS.forEach((R, ri) => {
    if (R.def.noDecor) return;
    list.forEach((d, di) => {
      const every = d.every || 5, w = d.w || 1.6, h = d.h || 1.6, y = d.y ?? 1.3, inset = 9.96;
      const m = d.tex ? propTex(d.tex, { color: d.color ?? 0x888888, tint: d.tint, rx: d.rx || 1, ry: d.ry || 1, emissive: d.glow ? 0xffffff : undefined, emissiveIntensity: d.glow, emissiveMap: !!d.glow, side: THREE.DoubleSide, roughness: d.roughness, metalness: d.metalness, transparent: d.transparent, opacity: d.opacity })
        : mat(d.color || 0x888888);
      const n = Math.floor((R.depth - 4) / every);
      for (let k = 0; k <= n; k++){
        const lz = 2 + (R.depth - 4) * (n ? k / n : .5) + (di ? every / 2 : 0);
        if (lz > R.depth - 1.5) continue;
        for (const s of [-1, 1]){
          const z = R.Z(lz), z1 = z - w / 2, z2 = z + w / 2;
          if (blocked(s, z1, z2)) continue;
          if (d.skip && (ri + k + (s > 0 ? 1 : 0) + di) % d.skip === 0) continue;   // thin the pattern out
          const g = new THREE.Group(); g.position.set(s * inset, 0, z); g.rotation.y = -s * Math.PI / 2; g.userData.decor = true;
          if (d.kind === 'drape'){
            const geo = new THREE.PlaneGeometry(w, h, 24, 1), p = geo.attributes.position;
            for (let i = 0; i < p.count; i++){ const u = p.getX(i) / w; p.setZ(i, Math.abs(Math.sin(u * Math.PI * 6)) * .12 + (p.getY(i) < 0 ? Math.sin(u * Math.PI * 3) * .05 : 0)); }
            geo.computeVertexNormals(); const c = new THREE.Mesh(geo, m); c.position.set(0, y, .08); g.add(c);
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, w + .3, 8), frameMat); rod.rotation.z = Math.PI / 2; rod.position.set(0, y + h / 2 + .04, .14); g.add(rod);
          } else if (d.kind === 'disc' || d.kind === 'ring'){
            const r = w / 2;
            const disc = new THREE.Mesh(d.kind === 'ring' ? new THREE.TorusGeometry(r, r * .22, 10, 24) : new THREE.CircleGeometry(r, 32), m); disc.position.set(0, y, .06); g.add(disc);
            if (d.frame && d.kind === 'disc'){ const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .06, 8, 32), frameMat); rim.position.set(0, y, .07); g.add(rim); }
          } else if (d.kind === 'cluster'){
            const rnd = mulberry32(ri * 97 + k * 13 + (s > 0 ? 7 : 0));
            for (let i = 0; i < 6; i++){
              const cs = .25 + rnd() * .4, c = new THREE.Mesh(d.shape === 'coral' ? new THREE.CylinderGeometry(cs * .25, cs * .4, cs * 2.4, 6) : new THREE.ConeGeometry(cs * .45, cs * 2.4, 5), m);
              c.position.set((rnd() - .5) * w, cs * 1.1 + (i > 3 ? rnd() * 1.2 : 0), .15 + rnd() * .25); c.rotation.set((rnd() - .2) * .6, rnd() * 3, (rnd() - .5) * .8); g.add(c);
            }
          } else {
            const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(0, y, .06); g.add(p);
            if (d.frame){ const f = .09; for (const [fx, fy, fw, fh] of [[0, h / 2, w + f * 2, f], [0, -h / 2, w + f * 2, f], [-w / 2, 0, f, h], [w / 2, 0, f, h]]){ const b = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, .1), frameMat); b.position.set(fx, y + fy, .07); g.add(b); } }
            if (d.mullion){ const b = new THREE.Mesh(new THREE.BoxGeometry(.06, h, .06), frameMat); b.position.set(0, y, .1); g.add(b); const b2 = new THREE.Mesh(new THREE.BoxGeometry(w, .06, .06), frameMat); b2.position.set(0, y + h * .1, .1); g.add(b2); }
          }
          scene.add(g);
        }
      }
    });
  });
}

/* ===================== engine API for rooms ===================== */
let lockMove = false;
let _api = null;
function EAPI(){
  if (_api) return _api;
  _api = {
    THREE, scene, mat, glow, canvasTex, tiledTex, pbr, pbrFrom, tex: propTex, detailPass, boxUV,
    common: (name, o = {}) => propTex('detail_' + name, { tint: o.color, ...o, dir: TEX_ROOT + 'common/' }),   // shared detail map that keeps the prop's colour
    texFrom: (lv, name, o = {}) => propTex(name, { ...o, dir: lv === 1 ? TEX_ROOT : TEX_ROOT + 'level' + lv + '/' }),   // another level's pack
    symTex, sector, sfx, beep, noise, clamp, damp, shuffle, mulberry32, esc, fmtTime, COLORS, CSSCOL,
    makeChar, animChar, nameSprite, flameMat, WALL_H, has, LEVEL, FREEZE, glassMat, camera, renderer,
    get GMULT(){ return GMULT; },
    get P(){ return curP; },
    get elapsed(){ return S.elapsed; },
    get phase(){ return phase; },
    get sight(){ return me.sight > 0; },
    get S(){ return S; },
    solo: SOLO, names, myIdx,
    soul: idx => idx < 0 ? -1 : SOLO() ? (S.soulFlip ? 1 : 0) : idx,
    me, other,
    ev, toast, flash,
    freeze(idx, secs = FREEZE, msg = ''){ if (S.frozen[idx] > 0) return; S.frozen[idx] = secs; S.freezes++; S.mercy = Math.min(4, (S.mercy || 0) + 1); ev('freeze', msg, idx); },
    isFrozen: idx => S.frozen[idx] > 0,
    teleport(idx, x, z){
      if (idx === myIdx()){ me.pos.set(x, 0, z); me.slide = null; me.dash = null; me.grap = null; }
      else { other.target.set(x, 0, z); send({ t: 'tp', x, z }); }
    },
    respawnLocal(x, z, msg){ me.pos.set(x, 0, z); me.slide = null; me.dash = null; me.grap = null; if (msg){ toast(msg); } },
    lock(){ lockMove = true; },
    playerPos(idx){ return idx === myIdx() ? me.pos : (otherChar.group.visible ? otherChar.group.position : null); },
    partnerPresent: () => role !== 'solo' && other.seen,
    rooms: ROOMS,
    roomAt,
    carrying,
    resetRoom,
    dashing: idx => idx === myIdx() ? !!(me.dash || me.grap) : !!other.dashing,
    segDist,
    ghostsOf: ri => GHOSTS.filter(g => g.room === ri),
    echoes: () => echoList(),
  };
  return _api;
}
const E = EAPI();
function segDist(px, pz, x1, z1, x2, z2){
  const dx = x2 - x1, dz = z2 - z1, l2 = dx * dx + dz * dz || 1e-6;
  const t = clamp(((px - x1) * dx + (pz - z1) * dz) / l2, 0, 1);
  return Math.hypot(px - (x1 + dx * t), pz - (z1 + dz * t));
}

// reusable enemy behaviors for rooms: each returns a think() for R.ghost({ think })
const AI = {
  // walk a loop of local [x,lz] points; optional lantern cone that freezes anyone inside it
  patrol(pts, sp, opt = {}){
    return (g, dt, st, R, E2, P) => {
      const m = g.mem; if (m.i === undefined){ m.i = 0; m.wait = 0; }
      if (m.wait > 0) m.wait -= dt;
      else { const [px, pl] = pts[m.i]; if (stepToward(g, px, R.Z(pl), sp * GMULT, dt) < .08){ m.i = (m.i + 1) % pts.length; m.wait = opt.wait || 0; } }
      if (m.wait > 0 && opt.look){ const [nx, nl] = pts[m.i]; g.ry = Math.atan2(nx - g.x, R.Z(nl) - g.z); }
      const T = targetsOf(g, P).filter(p => !p.dashing && R.inside(p.pos));
      if (opt.cone){ for (const p of T){ if (inCone(g, p.pos, opt.cone.len, opt.cone.ang) && !losBlocked(g.x, g.z, p.pos.x, p.pos.z)){ E2.freeze(p.idx, FREEZE, `${n2()[p.idx]} was spotted by ${g.label || 'a ghost'}!`); } } }
      ghostTouch(g, T, n2());
      return true;
    };
  },
  // sits in a hole; lunges at anyone who comes within reach, then slides back
  lunger(reach = 4, speed = 11, cool = 1.4){
    return (g, dt, st, R, E2, P) => {
      const m = g.mem; m.cd = (m.cd || 0) - dt;
      if (m.st === 'out'){ if (stepToward(g, m.tx, m.tz, speed, dt) < .1) m.st = 'back'; ghostTouch(g, targetsOf(g, P), n2(), 1.1); return true; }
      if (m.st === 'back'){ if (stepToward(g, g.home[0], g.home[1], speed * .5, dt) < .1){ m.st = null; m.cd = cool; } return true; }
      if (m.cd > 0) return true;
      const T = targetsOf(g, P).filter(p => Math.hypot(p.pos.x - g.home[0], p.pos.z - g.home[1]) < reach);
      if (T.length){ const p = T[0], dx = p.pos.x - g.home[0], dz = p.pos.z - g.home[1], d = Math.hypot(dx, dz) || 1; m.tx = g.home[0] + dx / d * Math.min(reach, d + .6); m.tz = g.home[1] + dz / d * Math.min(reach, d + .6); m.st = 'out'; ev('whoosh'); }
      return true;
    };
  },
  // stays put and sweeps a freezing gaze beam back and forth
  sweeper(len, from, to, period){
    return (g, dt, st, R, E2, P) => {
      g.mem.t = (g.mem.t || 0) + dt;
      const f = (Math.sin(g.mem.t / period * Math.PI * 2) + 1) / 2; g.ry = from + (to - from) * f;
      const ex = g.x + Math.sin(g.ry) * len, ez = g.z + Math.cos(g.ry) * len;
      for (const p of targetsOf(g, P)) if (!p.dashing && segDist(p.pos.x, p.pos.z, g.x, g.z, ex, ez) < .6) E2.freeze(p.idx, FREEZE, `${n2()[p.idx]} was caught in ${g.label || 'the gaze'}!`);
      return true;
    };
  },
};
function n2(){ return names(); }
function inCone(g, pos, len, ang){ const dx = pos.x - g.x, dz = pos.z - g.z, d = Math.hypot(dx, dz); if (d > len || d < .01) return d < .01; return (dx * Math.sin(g.ry) + dz * Math.cos(g.ry)) / d > Math.cos(ang); }
function losBlocked(x1, z1, x2, z2){
  const rs = colliders(-1, { phasing: false, vaulting: true });
  for (let i = 1; i < 10; i++){ const x = x1 + (x2 - x1) * i / 10, z = z1 + (z2 - z1) * i / 10; if (rs.some(r => x > r.x1 && x < r.x2 && z > r.z1 && z < r.z2)) return true; }
  return false;
}
const spectralMat = new THREE.MeshStandardMaterial({ color: 0x9a6bff, emissive: 0x6a3aff, emissiveIntensity: .6, transparent: true, opacity: .35 });
E.spectralMat = spectralMat;
Object.assign(E, { stepToward, ghostTouch, inBounds, colliders, resolve, AI, inCone, losBlocked, targetsOf, overPit,
  staticRects: () => colliders(-1, { vaulting: true }) });
// level files can name an image floor per room (texFloors: { 'Room Name': 'texture' }); the room's own floor stays as the fallback look
ROOMS.forEach(R => {
  let m = R.def.floor ? R.def.floor(E) : mat(0x3a3040);
  const img = CFG.texFloors && CFG.texFloors[R.def.name];
  if (img){ const d = Math.abs(R.zS - R.zN); m = pbr(img, 5, d / 4, { fallback: m.map || null, color: m.map ? 0xffffff : m.color.getHex(), roughness: m.roughness }); }
  floor(-10, R.zN, 10, R.zS, m, .002);
});
ROOMS.forEach(R => R.def.build && R.def.build(R, E));

// visuals for engine-level map pieces registered by rooms
for (const r of SPECTRAL){ const m = new THREE.Mesh(new THREE.BoxGeometry(r.x2 - r.x1, WALL_H, r.z2 - r.z1), spectralMat); m.position.set((r.x1 + r.x2) / 2, WALL_H / 2, (r.z1 + r.z2) / 2); scene.add(m); }
const lowMat = mat(CFG.lowColor || 0x6a5a4a);
for (const r of LOWS){ const m = new THREE.Mesh(new THREE.BoxGeometry(r.x2 - r.x1, .7, r.z2 - r.z1), lowMat); m.position.set((r.x1 + r.x2) / 2, .35, (r.z1 + r.z2) / 2); scene.add(m); }
const crackTex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#5a4a40'; x.fillRect(0, 0, w, h); x.strokeStyle = '#1a1210'; x.lineWidth = 4; for (let i = 0; i < 6; i++){ x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(Math.random() * w, Math.random() * h); x.stroke(); } });
for (const c of CRACKED){ const r = c.rect; c.mesh = new THREE.Mesh(new THREE.BoxGeometry(r.x2 - r.x1, WALL_H, r.z2 - r.z1), mat(0xffffff, { map: crackTex })); c.mesh.position.set((r.x1 + r.x2) / 2, WALL_H / 2, (r.z1 + r.z2) / 2); scene.add(c.mesh); }
const hookMat = mat(0xd4af37, { metalness: .8, roughness: .3, emissive: 0x6a5010, emissiveIntensity: .5 });
wallDecor();
detailPass(); setTimeout(detailPass, 2500);   // and again for anything rooms build lazily
for (const h of HOOKS){ h.mat = hookMat.clone(); const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .08, 8, 20), h.mat); ring.position.set(h.x, 2.6, h.z); scene.add(ring); h.mesh = ring; const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.2, 6), h.mat); post.position.set(h.x, 1.1, h.z); scene.add(post); h.post = post; if (h.noPost) post.visible = false; }

/* ===================== chars ===================== */
const meChar = makeChar(COLORS[0]);
const otherChar = makeChar(COLORS[1]);
otherChar.group.visible = false; meChar.group.visible = false;
const arrowEl = $('arrow');
function applyColors(){
  const mi = myIdx();
  meChar.bodyMat.color.setHex(COLORS[mi]); otherChar.bodyMat.color.setHex(COLORS[1 - mi]);
  meChar.setSkin(mySkin()); otherChar.setSkin(otherSkin());
  arrowEl.style.borderBottomColor = CSSCOL[1 - mi];
}

/* ===================== world reset / chapter select ===================== */
function initRoomState(R){ R.local = {}; const st = R.def.init ? R.def.init(R, E) : {}; return st; }
const lastPow = [{ t: -9 }, { t: -9 }], swapReq = [-9, -9];
function resetWorld(){
  for (const id of DOOR_IDS) S.doors[id] = 0;
  for (const id of PLATE_IDS){ S.plateOn[id] = 0; hostMem[id] = 0; }
  S.frozen = [0, 0]; S.freezes = 0; S.elapsed = 0; S.startRoom = 0; S.broken = {}; S.decoys = []; S.bolts = []; S.sb = null; S.echoes = []; S.ev = []; lastPow[0] = { t: -9 }; lastPow[1] = { t: -9 }; swapReq[0] = swapReq[1] = -9;
  S.rs = ROOMS.map(R => initRoomState(R));
  for (const g of GHOSTS) ghostHome(g);
  me.slide = null; me.dash = null; me.grap = null; me.oil = 1; me.hist = [];
}
function ghostHome(g){ g.x = g.tx = g.home[0]; g.z = g.tz = g.home[1]; g.y = 0; g.rest = 1.5; g.ret = false; g.wx = null; g.w = 0; g.mem = {}; g.stun = 0; }
function solveUpTo(r){
  S.startRoom = r;
  for (let i = 0; i < r; i++){ const R = ROOMS[i]; if (R.def.solve) R.def.solve(S.rs[i], R, E); R.open('exit'); }
}
function resetRoom(i, msg){
  const R = ROOMS[i]; if (!R) return;
  S.rs[i] = initRoomState(R);
  for (const id of DOOR_IDS) if (id.startsWith(i + ':') || id === 'X' + i || id.startsWith('X' + i + '_')) S.doors[id] = 0;
  for (const c of CRACKED) if (c.room === i) delete S.broken[c.id];
  for (const g of GHOSTS) if (g.room === i) ghostHome(g);
  S.frozen = [0, 0];
  for (const p of curP) if (R.inside(p.pos)){ const sp = R.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); }
  ev('boo', msg || 'You were both frozen — the room resets!');
}
resetWorld();

/* ===================== input ===================== */
const keys = {};
const btn = { dash: false, pow: false, dashT: 0, powT: 0, dashUsed: false, powUsed: false, lastPowTap: -9 };
function pressDash(){ if (!has('dash') || btn.dash) return; btn.dash = true; btn.dashT = 0; btn.dashUsed = false; }
function releaseDash(){ if (!btn.dash) return; btn.dash = false; if (!btn.dashUsed) actDash(false); }
function pressPow(){ if (!has('flash') || btn.pow) return; btn.pow = true; btn.powT = 0; btn.powUsed = false; }
function releasePow(){ if (!btn.pow) return; btn.pow = false; if (!btn.powUsed) actPow(); me.sight = 0; }
addEventListener('keydown', e => {
  const typing = e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox';
  if (!e.repeat && (e.code === 'Escape' || (e.code === 'KeyP' && !typing)) && (phase === 'play' || paused)){ setPaused(!paused); e.preventDefault(); return; }
  if (paused) return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  if (e.repeat){ if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); return; }
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'KeyE') pressDash();
  if (e.code === 'KeyF') pressPow();
  if (e.code === 'KeyQ' && has('ping') && phase === 'play') doPing(me.pos.x, me.pos.z);
  if (e.code === 'KeyR' && has('rewind')) doRewind();
  if (e.code === 'KeyG' && has('swap')) requestSwap();
  if (e.code === 'KeyH') showHint();
  if (e.code === 'KeyT') respawnRoom();
  if (e.code === 'KeyC') resetCam();
  if (e.code && (e.code.startsWith('Arrow') || e.code === 'Space')) e.preventDefault();
});
addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'Space' || e.code === 'KeyE') releaseDash();
  if (e.code === 'KeyF') releasePow();
});
addEventListener('blur', () => { for (const k in keys) keys[k] = false; btn.dash = btn.pow = false; me.sight = 0; });
// ---- touch camera: drag with one finger on the right side to turn/tilt, pinch with two to zoom, double-tap to reset ----
const camTouch = (() => {
  const pts = new Map(); let pinch0 = 0, zoom0 = 1, lastTap = -1e9;
  const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  return {
    start(t){
      pts.set(t.identifier, { x: t.clientX, y: t.clientY });
      if (pts.size === 1){ const now = performance.now(); if (now - lastTap < 300) resetCam(); lastTap = now; }
      if (pts.size === 2){ pinch0 = dist(); zoom0 = CAM.tz; }
    },
    move(t){
      const p = pts.get(t.identifier); if (!p) return false;
      if (pts.size === 1){
        CAM.ty -= (t.clientX - p.x) * .009 * OPT.sens;
        CAM.tp = clamp(CAM.tp + (t.clientY - p.y) * .006 * OPT.sens * (OPT.inv ? -1 : 1), .5 - BASE_PITCH, 1.45 - BASE_PITCH);
      }
      p.x = t.clientX; p.y = t.clientY;
      if (pts.size >= 2 && pinch0 > 0) CAM.tz = clamp(zoom0 * pinch0 / Math.max(20, dist()), .3, 1.8);
      return true;
    },
    end(t){ pts.delete(t.identifier); if (pts.size < 2) pinch0 = 0; }
  };
})();
const joy = { x: 0, y: 0, id: null, ox: 0, oy: 0 };
let runTouch = false;
const taps = {};
{
  const layer = $('touch'), base = $('joyBase'), knob = $('joyKnob'), runBtn = $('runBtn'), dashBtn = $('dashBtn'), powBtn = $('powBtn'), R = 52;
  const reset = () => { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; base.style.left = ''; base.style.top = ''; base.style.bottom = ''; };
  layer.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches){
      if (t.target === runBtn || t.target === dashBtn || t.target === powBtn) continue;
      if (joy.id === null && t.clientX < innerWidth * .5){
        joy.id = t.identifier; joy.ox = t.clientX; joy.oy = t.clientY;
        base.style.left = (t.clientX - 60) + 'px'; base.style.top = (t.clientY - 60) + 'px'; base.style.bottom = 'auto';
      } else { taps[t.identifier] = { x: t.clientX, y: t.clientY, t: performance.now() }; camTouch.start(t); }
    }
  }, { passive: false });
  layer.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches){
      if (t.identifier !== joy.id){ camTouch.move(t); continue; }
      let dx = t.clientX - joy.ox, dy = t.clientY - joy.oy; const l = Math.hypot(dx, dy);
      if (l > R){ dx *= R / l; dy *= R / l; }
      knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / R; joy.y = dy / R;
    }
  }, { passive: false });
  const end = e => {
    for (const t of e.changedTouches){
      if (t.identifier === joy.id) reset();
      camTouch.end(t);
      const tp = taps[t.identifier]; delete taps[t.identifier];
      if (tp && performance.now() - tp.t < 350 && Math.hypot(t.clientX - tp.x, t.clientY - tp.y) < 16) screenPing(t.clientX, t.clientY);
    }
  };
  layer.addEventListener('touchend', end); layer.addEventListener('touchcancel', end);
  const hold = (el, on, off) => {
    el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('on'); on(); }, { passive: false });
    const up = e => { e.preventDefault(); e.stopPropagation(); el.classList.remove('on'); off(); };
    el.addEventListener('touchend', up, { passive: false }); el.addEventListener('touchcancel', up, { passive: false });
  };
  hold(runBtn, () => { runTouch = true; }, () => { runTouch = false; });
  hold(dashBtn, pressDash, releaseDash);
  hold(powBtn, pressPow, releasePow);
  $('c').addEventListener('mousedown', e => { if (!isTouch && e.button === 0) screenPing(e.clientX, e.clientY); });
  document.addEventListener('gesturestart', e => e.preventDefault());
}
/* ===================== camera controls ===================== */
// Hold right mouse and drag: turn the camera around you and tilt it. Mouse wheel: zoom. C: reset.
const CAM = { yaw: 0, pitch: 0, zoom: 1, ty: 0, tp: 0, tz: 1, drag: false, lx: 0, ly: 0 };
const BASE_PITCH = Math.atan2(14, 7.5), BASE_DIST = Math.hypot(14, 7.5);
function resetCam(){ CAM.ty = Math.round(CAM.ty / (Math.PI * 2)) * Math.PI * 2; CAM.tp = 0; CAM.tz = 1; }
{
  const cv = $('c');
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => { if (e.button === 2){ CAM.drag = true; CAM.lx = e.clientX; CAM.ly = e.clientY; e.preventDefault(); } });
  addEventListener('pointermove', e => {
    if (!CAM.drag) return;
    const dx = e.clientX - CAM.lx, dy = e.clientY - CAM.ly; CAM.lx = e.clientX; CAM.ly = e.clientY;
    CAM.ty -= dx * .006 * OPT.sens; CAM.tp = clamp(CAM.tp + dy * .004 * OPT.sens * (OPT.inv ? -1 : 1), .5 - BASE_PITCH, 1.45 - BASE_PITCH);
  });
  addEventListener('pointerup', e => { if (e.button === 2) CAM.drag = false; });
  addEventListener('blur', () => { CAM.drag = false; });
  cv.addEventListener('wheel', e => { e.preventDefault(); CAM.tz = clamp(CAM.tz * Math.exp(e.deltaY * .0012), .3, 1.8); }, { passive: false });
}
/* ----- gamepad: left stick moves, right stick turns the camera; A dash · X lantern (hold: sight) · RT/RB run · Y ping ·
   B swap · LB rewind · Start menu · Back room start · D-pad up hint · R3 reset camera ----- */
const gpad = { x: 0, z: 0, run: false, prev: [] };
addEventListener('gamepadconnected', () => { if (phase === 'play') toast('🎮 Controller connected'); });
function pollPad(dt){
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected) : null;
  if (!gp){ gpad.x = gpad.z = 0; gpad.run = false; return; }
  const dz = v => Math.abs(v || 0) < .18 ? 0 : v, b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const edge = (i, on, off) => { const p = b(i); if (p && !gpad.prev[i] && on) on(); if (!p && gpad.prev[i] && off) off(); gpad.prev[i] = p; };
  gpad.x = dz(gp.axes[0]); gpad.z = dz(gp.axes[1]); gpad.run = b(7) || b(5) || b(10);
  const rx = dz(gp.axes[2]), ry = dz(gp.axes[3]);
  if (rx || ry){ CAM.ty -= rx * dt * 2.6 * OPT.sens; CAM.tp = clamp(CAM.tp + ry * dt * 1.6 * OPT.sens * (OPT.inv ? -1 : 1), .5 - BASE_PITCH, 1.45 - BASE_PITCH); }
  if (paused){ edge(9, () => setPaused(false)); edge(1, () => setPaused(false)); for (let i = 0; i < gp.buttons.length; i++) gpad.prev[i] = b(i); return; }
  edge(0, pressDash, releaseDash);
  edge(2, pressPow, releasePow);
  edge(3, () => { if (has('ping') && phase === 'play') doPing(me.pos.x, me.pos.z); });
  edge(1, () => { if (has('swap')) requestSwap(); });
  edge(4, () => { if (has('rewind')) doRewind(); });
  edge(9, () => { if (phase === 'play') setPaused(true); });
  edge(8, respawnRoom);
  edge(12, showHint);
  edge(11, resetCam);
}
function rawInput(){
  if (paused) return [0, 0, 0];
  let x = joy.x + gpad.x, z = joy.y + gpad.z;
  if (keys.KeyW || keys.ArrowUp) z -= 1;
  if (keys.KeyS || keys.ArrowDown) z += 1;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  const l = Math.hypot(x, z); if (l > 1){ x /= l; z /= l; }
  // controls follow the camera: W always walks away from it (turned into world directions here, so swap rooms still work)
  const c = Math.cos(CAM.yaw), sn = Math.sin(CAM.yaw); [x, z] = [x * c + z * sn, -x * sn + z * c];
  return [x, z, (runTouch || gpad.run || keys.ShiftLeft || keys.ShiftRight) ? 1 : 0];
}

/* ===================== powers (local side) ===================== */
function facing(){ return [Math.sin(me.ry), Math.cos(me.ry)]; }
function findHook(){
  const [fx, fz] = facing(); let best = null, bd = 9.5;
  let bs = -1, bdist = 0;
  for (const h of HOOKS){ if (h.off || h.hidden) continue; const dx = h.x - me.pos.x, dz = h.z - me.pos.z, d = Math.hypot(dx, dz); if (d < 1.2 || d > bd) continue; const c = (dx * fx + dz * fz) / d; if (c < .7) continue; const sc = c - d * .01; if (sc > bs){ bs = sc; best = h; bdist = d; } }
  return best ? [best, bdist] : null;
}
function actDash(isHold){
  if (phase !== 'play' || myFrozen()) return;
  const c = carrying(myIdx());
  if (has('decoy') && isHold && !c){
    if (me.decoyCD > 0){ toast('Decoy not ready yet.'); return; }
    me.decoyCD = 15; sendAb({ k: 'decoy', x: me.pos.x, z: me.pos.z }); sfx.place(); return;
  }
  if (has('grapple')){
    const f = findHook();
    if (f){
      const [h, d] = f;
      if (h.pull){ sendAb({ k: 'pull', hid: HOOKS.indexOf(h) }); sfx.hook(); return; }
      me.grap = { sx: me.pos.x, sz: me.pos.z, tx: h.x, tz: h.z, h, t: 0, d: .18 + d * .035 }; sfx.hook(); return;
    }
  }
  if (c && !c.R.def.noThrow && (has('throw') || c.R.def.allowThrow)){ sendAb({ k: 'throw', ry: me.ry }); sfx.throw(); return; }
  if (me.dashCD > 0) return;
  let [mx, mz] = me.inp; if (Math.hypot(mx, mz) < .2){ [mx, mz] = facing(); } const l = Math.hypot(mx, mz) || 1;
  me.dash = { dx: mx / l, dz: mz / l, t: .2 }; me.dashCD = 1.1; me.ry = Math.atan2(mx, mz); sfx.dash();
}
function actPow(){
  if (phase !== 'play' || myFrozen()) return;
  const now = performance.now() / 1000;
  if (has('rewind') && now - btn.lastPowTap < .32){ btn.lastPowTap = -9; doRewind(); return; }
  btn.lastPowTap = now;
  sendAb({ k: 'pow', x: me.pos.x, z: me.pos.z, ry: r2(me.ry) });       // used for bridge / blast sync
  if (me.powCD > 0) return;
  if (has('bolt') && me.moving){ me.powCD = 3; sendAb({ k: 'bolt', x: me.pos.x, z: me.pos.z, ry: me.ry }); sfx.bolt(); return; }
  me.powCD = 5; if (has('oil')) me.oil = Math.max(0, me.oil - .08);
  sendAb({ k: 'flash', x: me.pos.x, z: me.pos.z, ry: r2(me.ry) }); flashFx(me.pos.x, me.pos.z, myIdx());
}
function doRewind(){
  if (!has('rewind') || phase !== 'play' || myFrozen()) return;
  if (me.rewCD > 0){ toast('Rewind recharging…'); return; }
  const target = me.hist.find(h => h[0] >= S.elapsed - 3.05) || me.hist[0];
  if (!target) return;
  if (roomAt(target[1] === undefined ? me.pos.z : target[2]) !== roomAt(me.pos.z)) { toast('Can\'t rewind into another room.'); return; }
  const t0 = target[0], path = me.hist.filter(h => h[0] >= t0).map(h => [r2(h[0] - t0), r2(h[1]), r2(h[2])]); path.push([r2(S.elapsed - t0), r2(me.pos.x), r2(me.pos.z)]);
  me.pos.set(target[1], 0, target[2]); me.slide = null; me.dash = null; me.grap = null; me.rewCD = 10; sfx.rewind(); flash();
  if (path.length > 1) sendAb({ k: 'echo', p: path });
}
function screenPing(sx, sy){
  if (!has('ping') || phase !== 'play') return;
  const v = new THREE.Vector3((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1, .5);
  if (!v.unproject) return;
  v.unproject(camera); const o = camera.position, dx = v.x - o.x, dy = v.y - o.y, dz = v.z - o.z;
  if (dy >= -1e-4) return;
  const t = -o.y / dy, x = o.x + dx * t, z = o.z + dz * t;
  if (has('swap') && SOLO() && Math.hypot(x - me.pos.x, z - me.pos.z) < 1.3){ requestSwap(); return; }
  if (has('swap') && otherChar.group.visible && Math.hypot(x - other.target.x, z - other.target.z) < 1.3){ requestSwap(); doPing(other.target.x, other.target.z, true); return; }
  doPing(x, z);
}
let soloAnchor = null, anchorMesh = null, swapCD = 0;
function requestSwap(){
  if (phase !== 'play' || myFrozen() || swapCD > 0) return;
  swapCD = 1;
  if (SOLO()){
    if (!soloAnchor){ soloAnchor = { x: me.pos.x, z: me.pos.z }; toast('Soul anchor placed — press G again to jump back to it.'); sfx.place(); }
    else { me.pos.set(soloAnchor.x, 0, soloAnchor.z); me.slide = null; me.dash = null; me.grap = null; soloAnchor = null; sfx.swap(); flash(); S.soulFlip = S.soulFlip ? 0 : 1; meChar.bodyMat.color.setHex(COLORS[S.soulFlip]); toast(S.soulFlip ? 'Your soul shimmers PINK — pink glass lets you through.' : 'Your soul shimmers BLUE — blue glass lets you through.'); ROOMS.forEach((R, i) => R.def.onSwap && R.def.onSwap(S.rs[i], R, E)); }
    return;
  }
  sendAb({ k: 'swap' }); toast('Swap requested — your partner presses G (or taps you) to swap!');
}
function doPing(x, z, swap = false){ addPing(x, z, myIdx(), swap); send({ t: 'ping', x: r2(x), z: r2(z), w: myIdx(), sw: swap ? 1 : 0 }); sfx.ping(); if (role !== 'guest') hostPing(myIdx(), x, z); }
function hostPing(idx, x, z){ ROOMS.forEach((R, i) => { if (R.def.onPing && z <= R.zS && z > R.zN) R.def.onPing(S.rs[i], R, E, idx, x, z); }); }
const pingGeo = new THREE.RingGeometry(.6, .85, 28);
function addPing(x, z, who, swap){
  const g = new THREE.Group();
  const ring = new THREE.Mesh(pingGeo, new THREE.MeshBasicMaterial({ color: swap ? 0xffffff : COLORS[who], transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .08; g.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 5, 6), new THREE.MeshBasicMaterial({ color: COLORS[who], transparent: true, opacity: .6 })); beam.position.y = 2.5; g.add(beam);
  g.position.set(x, 0, z); scene.add(g); PINGS.push({ g, t: 4, ring });
}
function sendAb(a){ if (role === 'guest') send({ t: 'ab', ...a }); else hostAbility(myIdx(), a); }
const fxLights = [];
function flashFx(x, z, who){
  const l = new THREE.PointLight(0xfff6c0, 30, 12, 1.2); l.position.set(x, 2, z); scene.add(l);
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: .45, depthWrite: false })); s.position.set(x, 1, z); scene.add(s);
  fxLights.push({ l, s, t: .45 }); sfx.flash();
}

/* ===================== movement & collision ===================== */
const PR = .4, WALK = 4.8, RUN = 7.4, STAM = 2.5, SLIDE = 10, DASHV = 22;
function colliders(idx, opts = {}){
  const list = RECTS.slice();
  for (const id of DOOR_IDS) if (!S.doors[id]) list.push(DOORS[id].rect);
  for (const c of CRACKED) if (!S.broken[c.id]) list.push(c.rect);
  if (!opts.phasing){ for (const r of SPECTRAL) list.push(r); ROOMS.forEach((R, i) => { if (R.def.spectral) for (const r of R.def.spectral(S.rs[i], R, E)) list.push(r); }); }
  if (!opts.vaulting){ for (const r of LOWS) list.push(r); ROOMS.forEach((R, i) => { if (R.def.lows) for (const r of R.def.lows(S.rs[i], R, E)) list.push(r); }); }
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
  // grapple zip: fly straight to the hook, ignoring pits
  if (me.grap){
    const g = me.grap; g.t += dt; const f = Math.min(1, g.t / g.d); if (g.h){ g.tx = g.h.x; g.tz = g.h.z; }
    me.pos.x = g.sx + (g.tx - g.sx) * f; me.pos.z = g.sz + (g.tz - g.sz) * f; me.ry = Math.atan2(g.tx - g.sx, g.tz - g.sz); me.moving = true;
    if (f >= 1){ me.grap = null; const p = me.pos.clone(); resolve(p, colliders(myIdx())); me.pos.copy(p); }
    return;
  }
  let [mx, mz, run] = myFrozen() ? [0, 0, 0] : inp;
  if (myFrozen()){ me.dash = null; }
  if (R && R.def.inputMod){ const im = R.def.inputMod(st, R, E, me.pos, myIdx()); if (im){ mx *= im[0]; mz *= im[1]; } }
  const mod = (R && R.def.speed) ? (R.def.speed(st, R, E, myIdx()) || {}) : {};
  me.moving = Math.hypot(mx, mz) > .1;
  me.running = me.moving && run && !mod.noRun && me.stamina > 0;
  if (me.running) me.stamina = Math.max(0, me.stamina - dt);
  else me.stamina = Math.min(STAM, me.stamina + dt * (me.moving ? .45 : .8));
  let sp = (me.running ? RUN : WALK) * (mod.mult || 1);
  me.phasing = has('phase') && me.running && !(R && R.def.solidCarry && carrying(myIdx()));
  const rects = colliders(myIdx(), { phasing: me.phasing, vaulting: has('vault') && !!me.dash });
  // ---- dash
  if (me.dash){
    const d = me.dash; d.t -= dt;
    me.pos.x += d.dx * DASHV * dt; me.pos.z += d.dz * DASHV * dt;
    resolve(me.pos, rects); me.moving = true;
    if (d.t <= 0) me.dash = null;
    if (R && R.def.noDashJump && overPit(R, st, me.pos)) me.dash = null;      // updrafts: no leaping this chasm
    return afterMove(R, st);
  }
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
      if (Math.hypot(probe.x - me.pos.x, probe.z - me.pos.z) > .2){
        me.slide = dir;
        if (dir[0]) me.pos.z = rowZ(clamp(rowOf(me.pos.z), 0, ice.rows - 1)); else me.pos.x = cx(clamp(colOf(me.pos.x), 0, 9));
      }
    }
    if (me.slide){
      const px = me.pos.x, pz = me.pos.z, step = SLIDE * dt;
      me.pos.x += me.slide[0] * step; me.pos.z += me.slide[1] * step;
      resolve(me.pos, rects.concat(extra));
      const moved = Math.hypot(me.pos.x - px, me.pos.z - pz);
      if (moved < step * .5) me.slide = null;
      if (me.slide) me.ry = Math.atan2(me.slide[0], me.slide[1]);
      me.moving = !!me.slide;
      return afterMove(R, st);
    }
    me.moving = false; return afterMove(R, st);
  } else me.slide = null;
  if (me.moving){ let d = Math.atan2(mx, mz) - me.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); me.ry += d * damp(16, dt); }
  let vx = mx * sp, vz = mz * sp;
  if (R && R.def.push){ const f = R.def.push(st, R, E, me.pos, myIdx()); if (f){ vx += f[0]; vz += f[1]; } }
  me.pos.x += vx * dt; me.pos.z += vz * dt;
  resolve(me.pos, rects);
  afterMove(R, st);
}
let fallCD = 0;
function overPit(R, st, pos){
  if (!R || !R.def.pits) return false;
  const pits = R.def.pits(st, R, E), bridges = R.def.bridges ? R.def.bridges(st, R, E) : [];
  const inR = (b, m) => pos.x > b.x1 + m && pos.x < b.x2 - m && pos.z > b.z1 + m && pos.z < b.z2 - m;
  const inAt = (x, z) => pits.some(b => x >= b.x1 && x <= b.x2 && z >= b.z1 && z <= b.z2);
  // over water only if a small ring around you is all water (so seams between pit tiles aren't safe, but edges are forgiving)
  if (![[0, 0], [.15, 0], [-.15, 0], [0, .15], [0, -.15]].every(([dx, dz]) => inAt(pos.x + dx, pos.z + dz))) return false;
  if (bridges.some(b => inR(b, -.25))) return false;
  if (S.sb && segDist(pos.x, pos.z, S.sb.x1, S.sb.z1, S.sb.x2, S.sb.z2) < 1) return false;
  return true;
}
function afterMove(R, st){
  if (!R || phase !== 'play' || fallCD > 0 || me.dash || me.grap) return;
  if (overPit(R, st, me.pos)){
    fallCD = .8;
    const sp = R.spawnW[myIdx()];
    me.pos.set(sp[0], 0, sp[1]); me.slide = null;
    sfx.fall(); toast('Aaah! You fell — back to the start of the room.');
    send({ t: 'ev', k: 'fallo', m: `${myName || 'Your partner'} fell in!` });
    if (R.def.onFall && (role === 'host' || role === 'solo')) R.def.onFall(st, R, E, myIdx());
    if (role === 'guest') send({ t: 'fell' });
  }
}

/* ===================== items (carry / throw / catch) ===================== */
function carrying(idx){
  for (let i = 0; i < ROOMS.length; i++){ const st = S.rs[i]; if (!st || !st.items) continue; const it = st.items.find(t => t.s === 1 && t.w === idx); if (it) return { R: ROOMS[i], st, it }; }
  return null;
}
function hostItems(dt, P){
  ROOMS.forEach((R, ri) => {
    const st = S.rs[ri]; if (!st || !st.items) return;
    for (const it of st.items){
      if (it.s === 1){
        const p = P.find(q => q.idx === it.w);
        if (!p || !R.inside(p.pos) && !R.def.carryOut){ it.s = 0; it.w = -1; if (p){ it.x = clamp(p.pos.x, -9.5, 9.5); it.lz = clamp(R.lz(p.pos.z), .7, 21.3); } continue; }
        it.x = r2(p.pos.x); it.lz = r2(R.lz(p.pos.z));
        if (S.frozen[p.idx] > 0 && !it.keepFrozen){ it.s = 0; it.w = -1; }
        else if (R.def.carryTick) R.def.carryTick(st, R, E, it, p);
      } else if (it.s === 2){
        it.ft += dt; const f = Math.min(1, it.ft / it.fd);
        it.x = r2(it.sx + (it.tx - it.sx) * f); it.lz = r2(it.slz + (it.tlz - it.slz) * f); it.y = r2(1.4 + Math.sin(Math.PI * f) * 1.8 - f * 1.1);
        const wz = R.Z(it.lz);
        if (f > .2){
          const c = P.find(q => q.idx !== it.by && S.frozen[q.idx] <= 0 && !carrying(q.idx) && Math.hypot(q.pos.x - it.x, q.pos.z - wz) < 1.1);
          if (c && !it.nocatch){ it.s = 1; it.w = c.idx; it.y = 0; ev('pick', `${names()[c.idx]} caught it!`); if (R.def.onCatch) R.def.onCatch(st, R, E, it, c.idx); continue; }
          const g = GHOSTS.find(g => g.room === ri && g.y < 5 && !g.harmlessHit && Math.hypot(g.x - it.x, g.z - wz) < 1);
          if (g){ if (!(R.def.onHitGhost && R.def.onHitGhost(st, R, E, it, g) === false)) { if (!g.noStun) g.stun = Math.max(g.stun, it.k === 'bomb' ? 0 : 2.5); } it.ft = it.fd; }
        }
        if (it.ft >= it.fd){ it.s = 0; it.y = 0; ev('thud'); if (it.k === 'bomb') it.fuse = 1.3; if (R.def.onLand) R.def.onLand(st, R, E, it); }
      } else if (it.s === 0){
        if (it.fuse > 0){ it.fuse -= dt; if (it.fuse <= 0){ it.s = 3; explode(R, ri, it.x, R.Z(it.lz)); if (R.def.onBomb) R.def.onBomb(st, R, E, it); } continue; }
        if (it.nopick) continue;
        for (const p of P){
          if (S.frozen[p.idx] > 0 || carrying(p.idx) || E.dashing(p.idx)) continue;
          if (it.pickCD && it.pickCD > S.elapsed) continue;
          if (Math.hypot(p.pos.x - it.x, R.lz(p.pos.z) - it.lz) < .95){
            if (R.def.onPick && R.def.onPick(st, R, E, it, p.idx) === false) continue;
            if (it.k === 'oil'){ it.s = 3; ev('oil', '', p.idx); break; }
            it.s = 1; it.w = p.idx; it.fuse = 0; ev('pick'); break;
          }
        }
      }
    }
  });
}
function throwItem(idx, ry){
  const c = carrying(idx); if (!c) return;
  const { R, st, it } = c, fx = Math.sin(ry), fz = Math.cos(ry);
  const range = R.def.throwRange || 7;
  it.s = 2; it.by = idx; it.ft = 0; it.fd = .55; it.sx = it.x; it.slz = it.lz;
  it.tx = r2(clamp(it.x + fx * range, -9.5, 9.5)); it.tlz = r2(clamp(it.lz - fz * range, .6, 21.4));
  it.w = -1; it.pickCD = S.elapsed + .6;
  if (R.def.onThrow) R.def.onThrow(st, R, E, it, idx);
}
function explode(R, ri, x, z){
  ev('boom', '', 0, x, z);
  for (const c of CRACKED) if (!S.broken[c.id]){ const r = c.rect, cx = clamp(x, r.x1, r.x2), cz = clamp(z, r.z1, r.z2); if (Math.hypot(x - cx, z - cz) < 3) { S.broken[c.id] = 1; } }
  for (const g of GHOSTS) if (g.room === ri && Math.hypot(g.x - x, g.z - z) < 4.5 && !g.bombImmune && !g.noStun) g.stun = Math.max(g.stun, 4);
  for (const p of curP) if (Math.hypot(p.pos.x - x, p.pos.z - z) < 2.2) E.freeze(p.idx, 3, `${names()[p.idx]} got caught in the blast!`);
}

/* ===================== host: powers ===================== */
function hostAbility(idx, a){
  const P = curP, p = P.find(q => q.idx === idx);
  const ri = p ? roomAt(p.pos.z) : -1, R = ROOMS[ri], st = S.rs[ri];
  switch (a.k){
    case 'throw': throwItem(idx, a.ry); break;
    case 'flash':
      if (idx !== myIdx()) ev('flashfx', '', idx, a.x, a.z);
      for (const g of GHOSTS) if (g.y < 5 && !g.flashImmune && !g.noStun && Math.hypot(g.x - a.x, g.z - a.z) < 5.5) g.stun = Math.max(g.stun, g.flashStun || 3.5);
      if (R && R.def.onFlash) R.def.onFlash(st, R, E, idx, a.x, a.z);
      if (has('bridge') && a.ry !== undefined && !(S.sb && S.sb.joint)){ const L = SOLO() ? 8 : 4; makeBridge(a.x, a.z, a.x + Math.sin(a.ry) * L, a.z + Math.cos(a.ry) * L, 3.5, 0); }
      break;
    case 'bolt': S.bolts.push({ x: a.x, z: a.z, vx: Math.sin(a.ry) * 16, vz: Math.cos(a.ry) * 16, t: .9, by: idx }); if (idx !== myIdx()) ev('bolt'); break;
    case 'pull': { const h = HOOKS[a.hid]; if (h && h.room >= 0){ const Rr = ROOMS[h.room]; if (Rr.def.onPull) Rr.def.onPull(S.rs[h.room], Rr, E, idx, h); } break; }
    case 'echo': { S.echoes.push({ idx, p: a.p, t: 0 }); const ri = roomAt(a.p[0][2]), Rr = ROOMS[ri]; if (Rr && Rr.def.onEcho) Rr.def.onEcho(S.rs[ri], Rr, E, idx); break; }
    case 'decoy': S.decoys.push({ x: r2(a.x), z: r2(a.z), t: 6 }); ev('place', `${names()[idx]} dropped a decoy lantern!`); break;
    case 'swap': {
      swapReq[idx] = S.elapsed;
      if (P.length === 2 && Math.abs(swapReq[0] - swapReq[1]) < 3){
        swapReq[0] = swapReq[1] = -9;
        const a0 = P[0].pos.clone(), a1 = P[1].pos.clone();
        E.teleport(P[0].idx, a1.x, a1.z); E.teleport(P[1].idx, a0.x, a0.z); ev('swap', 'Soul swap!');
        ROOMS.forEach((Rr, i) => Rr.def.onSwap && Rr.def.onSwap(S.rs[i], Rr, E));
      }
      break; }
    case 'pow': {
      lastPow[idx] = { t: S.elapsed, x: a.x, z: a.z };
      const o = lastPow[1 - idx];
      if (P.length === 2 && Math.abs(S.elapsed - o.t) < .6){
        const d = Math.hypot(o.x - a.x, o.z - a.z);
        lastPow[0] = { t: -9 }; lastPow[1] = { t: -9 };
        if (has('blast') && d < 3.2){
          soulBlast((o.x + a.x) / 2, (o.z + a.z) / 2);
        } else if (has('bridge') && d >= 2.5 && d <= 14){
          makeBridge(o.x, o.z, a.x, a.z, 5, 1); ev('chime', 'A spirit bridge shimmers between you!', 3);
        }
      } else if (has('blast')){
        const ec = echoList().find(e => e[0] === idx && Math.hypot(e[1] - a.x, e[2] - a.z) < 3.2);
        if (ec){ S.echoes = S.echoes.filter(e => e.idx !== idx); soulBlast((ec[1] + a.x) / 2, (ec[2] + a.z) / 2); }
      }
      break; }
  }
}

function soulBlast(x, z){
  ev('blast', 'SOUL BLAST!', 0, x, z);
  for (const g of GHOSTS) if (g.y < 5 && !g.noStun && !g.blastImmune && Math.hypot(g.x - x, g.z - z) < 9) g.stun = Math.max(g.stun, 8);
  ROOMS.forEach((Rr, i) => { if (Rr.def.onBlast && Rr.inside(new THREE.Vector3(x, 0, z))) Rr.def.onBlast(S.rs[i], Rr, E, x, z); });
}
function makeBridge(x1, z1, x2, z2, t, joint){
  S.sb = { x1: r2(x1), z1: r2(z1), x2: r2(x2), z2: r2(z2), t, joint };
  ROOMS.forEach((Rr, i) => Rr.def.onBridge && Rr.def.onBridge(S.rs[i], Rr, E, S.sb));
}
/* ===================== host simulation ===================== */
function playerList(){
  const host = role === 'guest' ? other : me;
  const L = [{ idx: 0, pos: role === 'guest' ? other.target : me.pos, ry: host.ry, moving: host.moving, inp: host === me ? me.inp : other.inp }];
  if (role === 'host' && conn && conn.open && other.seen) L.push({ idx: 1, pos: other.target, ry: other.ry, moving: other.moving, inp: other.inp });
  if (role === 'guest') L.push({ idx: 1, pos: me.pos, ry: me.ry, moving: me.moving, inp: me.inp });
  for (const p of L){ p.frozen = S.frozen[p.idx] > 0; p.dashing = E.dashing(p.idx); p.running = p.idx === myIdx() ? me.running : other.running; p.sight = p.idx === myIdx() ? me.sight > 0 : !!other.sight; p.oil = p.idx === myIdx() ? me.oil : (other.oil ?? 1); }
  for (const p of L) p.hidden = has('shadow') && L.some(q => q !== p && !q.frozen && (() => { const dx = p.pos.x - q.pos.x, dz = p.pos.z - q.pos.z, d = Math.hypot(dx, dz); return d < 1.9 && d > .2 && (dx * Math.sin(q.ry) + dz * Math.cos(q.ry)) / d < -.45; })());
  for (const p of L){ if (p.hidden) continue; const ri = roomAt(p.pos.z), Rr = ROOMS[ri]; if (Rr && Rr.def.shadows && Rr.def.shadows(S.rs[ri], Rr, E).some(r => p.pos.x > r.x1 && p.pos.x < r.x2 && p.pos.z > r.z1 && p.pos.z < r.z2)) p.hidden = true; }
  return L;
}
function ev(k, m = '', a = 0, x, z){ const e = { t: 'ev', k, m, a }; if (x !== undefined){ e.x = r2(x); e.z = r2(z); } playEv(e); send(e); }
function playEv(e){
  switch (e.k){
    case 'door': sfx.door(); break;
    case 'chime': sfx.chime(e.a); break;
    case 'wrong': sfx.wrong(); break;
    case 'freeze': sfx.freeze(); if (e.a === myIdx()){ flash(); shakeT = .5; if (OPT.shake && navigator.vibrate) try { navigator.vibrate([90, 60, 160]); } catch {} } break;
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
    case 'splash': sfx.splash(); break;
    case 'crash': sfx.crash(); break;
    case 'swap': sfx.swap(); break;
    case 'bolt': sfx.bolt(); break;
    case 'flashfx': if (e.x !== undefined) flashFx(e.x, e.z, e.a); break;
    case 'boom': sfx.boom(); if (e.x !== undefined) flashFx(e.x, e.z, 0); break;
    case 'blast': sfx.blast(); if (e.x !== undefined) flashFx(e.x, e.z, 0); flash(); break;
    case 'oil': if (e.a === myIdx()){ me.oil = 1; toast('Lantern refilled!'); } sfx.pick(); break;
    case 'pz': break;   // partner opened the menu: just the toast below
    default: { ROOMS.find(R => R.def.onEvent && R.def.onEvent(e, R, E)); }
  }
  if (e.m) toast(e.m);
}
function flash(){ const f = $('flash'); f.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on'))); }
function hostTick(dt){
  if (phase !== 'play') return;
  S.elapsed += dt;
  const P = curP = playerList();
  for (const e of S.echoes) e.t += dt; S.echoes = S.echoes.filter(e => e.t < e.p[e.p.length - 1][0] + .5);
  const ECH = echoList().map(([i, x, z]) => ({ x, z }));
  const extra = ROOMS.map((R, i) => R.def.occupants ? R.def.occupants(S.rs[i], R, E) : []);
  for (const id of PLATE_IDS){
    const pl = PLATES[id];
    const occ = P.some(p => onPlate(pl, p.pos)) || (pl.room >= 0 && extra[pl.room].some(o => onPlate(pl, o))) || ECH.some(o => onPlate(pl, o));
    edges[id] = occ && !S.plateOn[id];
    S.plateOn[id] = occ ? 1 : 0;
    if (occ) hostMem[id] = SOLO() ? ECHO : 0; else hostMem[id] = Math.max(0, hostMem[id] - dt);
    held[id] = occ || hostMem[id] > 0;
  }
  hostItems(dt, P);
  ROOMS.forEach((R, i) => R.def.host && R.def.host(dt, S.rs[i], R, E));
  // decoys, bolts, spirit bridge
  for (const d of S.decoys) d.t -= dt;
  S.decoys = S.decoys.filter(d => d.t > 0);
  for (const b of S.bolts){
    b.t -= dt; b.x += b.vx * dt; b.z += b.vz * dt;
    const g = GHOSTS.find(g => g.y < 5 && Math.hypot(g.x - b.x, g.z - b.z) < 1);
    if (g){ if (!g.noStun) g.stun = Math.max(g.stun, 6); b.t = 0; ev('zap'); const R = ROOMS[g.room]; if (R.def.onBoltHit) R.def.onBoltHit(S.rs[g.room], R, E, g); }
    if (b.t > 0) ROOMS.forEach((Rr, i) => { if (b.t <= 0 || !Rr.def.boltTargets) return; for (const [tx, tz, id, rad] of Rr.def.boltTargets(S.rs[i], Rr, E)){ if (Math.hypot(b.x - tx, b.z - tz) < (rad || .8)){ b.t = 0; ev('zap'); Rr.def.onBoltTarget(S.rs[i], Rr, E, id, b); break; } } });
    if (b.t > 0) ROOMS.forEach((Rr, i) => { if (Rr.def.boltStep && Rr.inside(new THREE.Vector3(b.x, 0, b.z))) Rr.def.boltStep(S.rs[i], Rr, E, b, dt); });
    if (colliders(-1, { vaulting: true }).some(r => b.x > r.x1 && b.x < r.x2 && b.z > r.z1 && b.z < r.z2)) b.t = 0;
  }
  S.bolts = S.bolts.filter(b => b.t > 0);
  if (S.sb){ S.sb.t -= dt; if (S.sb.t <= 0) S.sb = null; }
  const n = names();
  GMULT = BASE_GMULT * pressure(dt, P);
  // walls, closed doors, uncracked walls and ghost-walls stop every enemy (low walls can still be crossed).
  // Exempt: ghosts drifting home after a freeze (harmless until they rest), ones a room marks throughWalls, and
  // ones already overlapping something (crows on perches, reflections in mirrors) until they've stepped clear of it.
  const solid = GHOSTS.length ? colliders(-1, { vaulting: true }) : null;
  const overlaps = g => solid.some(b => Math.hypot(g.x - clamp(g.x, b.x1, b.x2), g.z - clamp(g.z, b.z1, b.z2)) < PR * .8);   // .8: one resting against a wall is still "free"
  for (const g of GHOSTS){
    const free = !g.ret && !g.throughWalls && g.y < 1 && !overlaps(g);
    updateGhost(g, dt, P, n);
    if (free) resolve(g, solid);
  }
  for (const p of P){
    if (S.frozen[p.idx] <= 0) continue;
    S.frozen[p.idx] -= dt;
    const rescuer = P.find(q => q.idx !== p.idx && S.frozen[q.idx] <= 0 && Math.hypot(q.pos.x - p.pos.x, q.pos.z - p.pos.z) < 1.6);
    if (rescuer){ S.frozen[p.idx] = 0; ev('thaw', `${n[rescuer.idx]} saved ${n[p.idx]}!`); }
    else if (S.frozen[p.idx] <= 0){ S.frozen[p.idx] = 0; ev('thaw'); }
  }
  if (RESET_RULE && P.length === 2 && P.every(p => S.frozen[p.idx] > 0)){
    const ri = roomAt(P[0].pos.z);
    if (ri >= 0 && ri === roomAt(P[1].pos.z)) resetRoom(ri);
    else S.frozen = [Math.min(S.frozen[0], 2), Math.min(S.frozen[1], 2)];
  }
  // a dropped partner must rejoin before the level can be won
  if ((SOLO() || P.length === 2) && P.every(p => p.pos.z < WIN_Z)) setPhase('won');
}
// Ghost pressure eases a little after recent freezes (mercy decays over ~20 s each) and while either player
// is in a room with a puzzle panel up, so ciphers and talking things through don't end in back-to-back wipes.
function pressure(dt, P){
  S.mercy = Math.max(0, (S.mercy || 0) - dt / 20);
  const puzzling = P.some(p => { const ri = roomAt(p.pos.z), R = ROOMS[ri]; try { return !!(R && R.def.panel && R.def.panel(S.rs[ri], R, E)); } catch { return false; } });
  return clamp(1 - S.mercy * .07 - (puzzling ? .12 : 0), .7, 1);
}
function inBounds(g, pos, m = .6){ return pos.x > g.b[0] - m && pos.x < g.b[1] + m && pos.z > g.b[2] - m && pos.z < g.b[3] + m; }
function stepToward(g, tx, tz, sp, dt){
  const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz);
  if (d < .05) return d;
  const s = Math.min(d, sp * dt); g.x += dx / d * s; g.z += dz / d * s; g.ry = Math.atan2(dx, dz);
  return d;
}
function targetsOf(g, P){ return P.filter(p => S.frozen[p.idx] <= 0 && !p.hidden && inBounds(g, p.pos)); }
function decoyFor(g){ let best = null, bd = 10; for (const d of S.decoys){ if (!inBounds(g, { x: d.x, z: d.z })) continue; const dd = Math.hypot(d.x - g.x, d.z - g.z); if (dd < bd){ bd = dd; best = d; } } return best; }
function updateGhost(g, dt, P, n){
  const st = S.rs[g.room], R = ROOMS[g.room];
  if (g.gone && g.gone(st, R, E)){ g.y = Math.min(g.y + dt * 2.5, 12); return; }
  g.y = 0; g.w = 0;
  if (g.stun > 0){ g.stun -= dt; g.w = 1; return; }
  if (!g.ignoreDecoy && !g.harmless){ const d = decoyFor(g); if (d){ stepToward(g, d.x, d.z, (g.sp || 2.5) * GMULT, dt); if (Math.hypot(d.x - g.x, d.z - g.z) < .7) d.t = 0; return; } }
  if (g.think && g.think(g, dt, st, R, E, P)) return;
  const active = P.some(p => inBounds(g, p.pos, 0));
  if (g.rest > 0){ g.rest -= dt; return; }
  if (g.ret){ if (stepToward(g, g.home[0], g.home[1], 6, dt) < .2){ g.ret = false; g.rest = 2.2; } return; }
  if (!active){ stepToward(g, g.home[0], g.home[1], 1.5, dt); return; }
  const targets = targetsOf(g, P);
  let best = null, bd = g.radius || 9;
  for (const p of targets){ const d = Math.hypot(p.pos.x - g.x, p.pos.z - g.z); if (d < bd){ bd = d; best = p; } }
  if (best) stepToward(g, best.pos.x, best.pos.z, g.sp * GMULT, dt);
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
function ghostTouch(g, targets, n, rad = .95){
  for (const p of targets){
    if (p.dashing || p.frozen || p.hidden) continue;
    if (Math.hypot(p.pos.x - g.x, p.pos.z - g.z) < (g.touch || rad)){
      g.ret = !g.noReturn;
      const helper = role === 'solo' ? 'Wait it out…' : `${n[1 - p.idx]}, touch them to break the ice!`;
      E.freeze(p.idx, FREEZE, `${n[p.idx]} got frozen${g.label ? ' by ' + g.label : ''}! ${helper}`);
      if (g.onFreeze) g.onFreeze(g, p, S.rs[g.room], ROOMS[g.room], E);
      return true;
    }
  }
  return false;
}


/* ===================== networking ===================== */
let peer = null, conn = null, code = '';
function send(o){ try { if (conn && conn.open) conn.send(o); } catch {} }
function randomCode(){ const A = 'ABCDEFGHJKMNPQRSTUVWXYZ'; let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
// useCode: re-host under the same code after a refresh. The signalling server can hold the old id for a while,
// so keep retrying it (about a minute) before giving up and picking a fresh code.
/* ----- connection servers: several STUN servers let each side find its public address; a TURN relay (configured in
   haunted/turn.json) carries the game when two networks won't connect directly — mobile data, school or work Wi-Fi.
   turn.json: {"metered": "<app>.metered.live", "apiKey": "..."}  or  {"iceServers": [{urls, username, credential}, ...]} ----- */
const STUN = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
let ICE = STUN, hasRelay = false;
const iceReady = fetch((LEVEL === 1 ? './' : '../') + 'turn.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(async j => {
  if (!j) return;
  let extra = j.iceServers || [];
  if (j.metered && j.apiKey) extra = await fetch(`https://${j.metered}/api/v1/turn/credentials?apiKey=${encodeURIComponent(j.apiKey)}`).then(r => r.json());
  if (Array.isArray(extra) && extra.length){ ICE = STUN.concat(extra); hasRelay = true; }
}).catch(() => {});
const peerOpts = () => ({ config: { iceServers: ICE } });
const netHelp = () => hasRelay ? 'Check both of you are online and try again.' : 'Your networks may block direct links (common on mobile data and school/work Wi-Fi) — try both on the same Wi-Fi.';
function hostGame(useCode = null, tries = 0){
  if (typeof Peer === 'undefined'){ status('Could not load the network library. Check your connection.'); return; }
  role = 'host'; applyColors(); code = useCode || randomCode();
  $('roomCode').textContent = code; $('lobbyMsg').textContent = useCode ? `Reopening game ${code}…` : 'Connecting…';
  $('btnStart').disabled = true; $('btnStart').textContent = 'Enter';
  show('lobby'); phase = 'lobby';
  iceReady.then(() => { if (role === 'host' && phase === 'lobby' && !peer) openHost(useCode, tries); });
}
function openHost(useCode, tries){
  peer = new Peer(PREFIX + code, peerOpts());
  peer.on('open', () => { $('lobbyMsg').textContent = resume ? `Waiting for ${remoteName} to rejoin code ${code}… (or share it again)` : 'Tell your partner to enter this code and tap Join.'; });
  peer.on('connection', c => {
    // a refreshed partner can arrive before their old link has timed out: take over a link that has gone quiet
    if (conn && conn.open && performance.now() - lastRecv < 4000){ c.on('open', () => c.close()); return; }
    const old = conn; conn = c; wireConn(); if (old){ try { old.close(); } catch {} }
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id'){
      peer.destroy(); peer = null;
      if (useCode && tries < 20){ $('lobbyMsg').textContent = `Reopening game ${code}… (${tries + 1})`; setTimeout(() => { if (role === 'host' && phase === 'lobby' && !peer) hostGame(useCode, tries + 1); }, 3000); }
      else hostGame();
      return;
    }
    $('lobbyMsg').textContent = 'Network error: ' + e.type;
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch {} });
}
let rejoinCode = '', rejoinTries = 0;
function tryRejoin(){
  if (!rejoinCode || role !== null || phase !== 'menu') return;
  if (rejoinTries++ >= 15){ status('Could not reconnect. Ask your partner for their code.'); rejoinCode = ''; return; }
  joinGame(rejoinCode); status(rejoinTries > 1 ? `Waiting for game ${rejoinCode}… (${rejoinTries})` : `Connecting to ${rejoinCode}…`);
}
function joinGame(c){
  if (typeof Peer === 'undefined'){ status('Could not load the network library. Check your connection.'); return; }
  role = 'guest'; applyColors(); code = c; status('Connecting to ' + c + '…');
  iceReady.then(() => { if (role === 'guest' && phase === 'menu' && !peer) openGuest(c); });
}
function openGuest(c){
  peer = new Peer(peerOpts());
  const p0 = peer;
  peer.on('open', () => { conn = peer.connect(PREFIX + c, { reliable: true }); wireConn(); });
  peer.on('error', e => { if (peer !== p0) return; status(e.type === 'peer-unavailable' ? 'No game found with code ' + c + '. Check the code — the host\'s lobby must still be open.' : 'Network error: ' + e.type); cleanupNet(); role = null; if (rejoinCode) setTimeout(tryRejoin, 4000); });
  setTimeout(() => { if (peer === p0 && role === 'guest' && phase === 'menu' && !(conn && conn.open)){ status('Found the game but couldn\'t link up. ' + netHelp()); cleanupNet(); role = null; if (rejoinCode) setTimeout(tryRejoin, 1000); } }, 15000);
}
/* ----- resume after a refresh or dropped connection: sessionStorage survives a reload of this tab only ----- */
let resume = null, sessT = 0;
const sess = {
  get(){ try { const v = JSON.parse(sessionStorage.getItem('hm_sess') || 'null'); return v && v.lv === LEVEL && Date.now() - v.ts < 15 * 60e3 ? v : null; } catch { return null; } },
  save(){ try { sessionStorage.setItem('hm_sess', JSON.stringify({ lv: LEVEL, role, code: role === 'solo' ? '' : code, room: Math.max(0, roomAt(me.pos.z)), el: r2(S.elapsed), fz: S.freezes, partner: remoteName, ts: Date.now() })); } catch {} },
  clear(){ try { sessionStorage.removeItem('hm_sess'); } catch {} }
};
function applyResume(){ if (!resume) return; startGame(resume.room); S.elapsed = resume.el || 0; S.freezes = resume.fz || 0; resume = null; }
let lastRecv = 0;
function wireConn(){
  const c = conn, onOpen = () => send({ t: 'hi', n: myName, sk: mySkin() });
  if (c.open) onOpen(); else c.on('open', onOpen);
  // the direct link failed outright (usually a strict network): say so instead of hanging on "Connecting…"
  setTimeout(() => { const pc = c.peerConnection; if (pc) pc.addEventListener('iceconnectionstatechange', () => {
    if (pc.iceConnectionState !== 'failed' || c !== conn) return;
    if (role === 'guest' && phase === 'menu') status('Couldn\'t link up with the host. ' + netHelp());
    else if (role === 'host' && phase === 'lobby') $('lobbyMsg').textContent = `Your partner found the game but the link failed. ${netHelp()}`;
  }); }, 0);
  c.on('data', m => { if (c === conn) onData(m); }); c.on('close', () => onDisconnect(c)); c.on('error', () => onDisconnect(c));
}
function onData(m){
  if (!m || typeof m !== 'object') return;
  lastRecv = performance.now();
  switch (m.t){
    case 'hi':
      remoteName = String(m.n || 'Partner').slice(0, 12); if (m.sk === 0 || m.sk === 1) remoteSkin = m.sk; applyColors();
      if (role === 'host'){
        send({ t: 'welcome', n: myName, lv: LEVEL, sk: mySkin() }); sfx.chime(1);
        if (phase === 'play'){
          // partner rejoined mid-level: drop them at the start of the room you're in
          toast(`${remoteName} is back!`);
          setTimeout(() => { if (phase !== 'play' || !(conn && conn.open)) return; const R = ROOMS[Math.max(0, roomAt(me.pos.z))], sp = R.spawnW[1]; E.teleport(1, sp[0], sp[1]); }, 900);
        } else if (resume) applyResume();
        else { $('lobbyMsg').textContent = `${remoteName} is here. Ready when you are…`; $('btnStart').disabled = false; }
      }
      break;
    case 'welcome':
      if (m.lv && m.lv !== LEVEL){ cleanupNet(); goLevel(m.lv, '?join=' + encodeURIComponent(code)); return; }
      remoteName = String(m.n || 'Partner').slice(0, 12); if (m.sk === 0 || m.sk === 1) remoteSkin = m.sk; applyColors();
      if (rejoinCode) status(''); rejoinCode = ''; rejoinTries = 0;
      $('roomCode').textContent = code; $('lobbyMsg').textContent = `Connected to ${remoteName}. Waiting for them to start…`;
      $('btnStart').disabled = true; $('btnStart').textContent = 'Waiting for host';
      show('lobby'); phase = 'lobby';
      break;
    case 'skin': if (m.sk === 0 || m.sk === 1){ remoteSkin = m.sk; applyColors(); } break;
    case 'g':
      if (role !== 'host') break;
      other.target.set(m.p[0], 0, m.p[1]); other.ry = m.p[2]; other.moving = !!m.p[3]; other.running = !!m.p[4]; other.dashing = m.p[5] || 0; other.sight = m.p[6] || 0; other.oil = m.p[7] ?? 1;
      other.inp = m.in || [0, 0, 0];
      if (!other.seen){ other.seen = true; otherChar.group.position.copy(other.target); if (phase === 'play') otherChar.group.visible = true; }
      break;
    case 'ab': if (role === 'host') hostAbility(1, m); break;
    case 'ping': addPing(m.x, m.z, m.w, !!m.sw); sfx.ping(); if (role === 'host') hostPing(m.w, m.x, m.z); if (m.sw) toast(`${remoteName} wants to SWAP — press G or tap them to accept!`); break;
    case 'again': if (role === 'host' && phase === 'won') startGame(S.startRoom); break;
    case 'next': if (role === 'host' && phase === 'won') goNextLevel(); break;
    case 'skiproom': if (role === 'host' && phase === 'play') hostSkipRoom(m.r); break;
    case 'nextlv': if (role === 'guest'){ cleanupNet(); goLevel(m.lv, '?join=' + encodeURIComponent(m.code)); } break;
    case 'tp': if (role === 'guest'){ me.pos.set(m.x, 0, m.z); me.slide = null; me.dash = null; me.grap = null; } break;
    case 'unfz': if (role === 'host') S.frozen[1] = 0; break;
    case 'fell': if (role === 'host'){ const ri = roomAt(other.target.z), R = ROOMS[ri]; if (R && R.def.onFall) R.def.onFall(S.rs[ri], R, E, 1); } break;
    case 's':
      if (role !== 'guest') break;
      DOOR_IDS.forEach((id, i) => S.doors[id] = m.d[i] === '1' ? 1 : 0);
      PLATE_IDS.forEach((id, i) => S.plateOn[id] = m.pl[i] === '1' ? 1 : 0);
      S.frozen = m.fr; S.freezes = m.fz; S.elapsed = m.el; S.startRoom = m.sr; S.rs = m.rs;
      S.broken = m.br || {}; S.decoys = m.dc || []; S.bolts = m.bo || []; S.sb = m.sb || null; S.ev = m.ec || [];
      m.gh.forEach((v, i) => { const g = GHOSTS[i]; g.tx = v[0]; g.tz = v[1]; g.y = v[2]; g.ry = v[3]; g.w = v[4]; });
      other.target.set(m.hp[0], 0, m.hp[1]); other.ry = m.hp[2]; other.moving = !!m.hp[3]; other.running = !!m.hp[4]; other.dashing = m.hp[5] || 0; other.sight = m.hp[6] || 0; other.oil = m.hp[7] ?? 1;
      other.inp = m.in || [0, 0, 0];
      if (!other.seen){ other.seen = true; otherChar.group.position.copy(other.target); }
      if (m.ph !== phase) setPhase(m.ph);
      break;
    case 'ev': if (role === 'guest' || m.k === 'fallo' || m.k === 'zap' || m.k === 'respo' || m.k === 'pz') playEv(m); break;
  }
}
function onDisconnect(c){
  if (!conn || (c && c !== conn)) return;
  conn = null; other.seen = false; otherChar.group.visible = false;
  if (role === 'host' && phase === 'play'){
    // keep the level running; the peer stays open so they can rejoin (a refreshed tab offers Resume)
    toast(`${remoteName} disconnected — they can rejoin with code ${code}.`);
  } else if (role === 'host'){
    phase = 'lobby'; hideGameUI();
    $('roomCode').textContent = code; $('btnStart').disabled = true; $('btnStart').textContent = 'Enter';
    $('lobbyMsg').textContent = `${remoteName} left. They can rejoin with the same code.`;
    show('lobby');
  } else if (role === 'guest'){
    const c = code, wasIn = phase === 'play' || phase === 'won';
    toMenu('Lost connection to the host.');
    if ((wasIn || rejoinCode) && c){ if (wasIn) rejoinTries = 0; rejoinCode = c; setTimeout(tryRejoin, 1500); }
  }
}
function cleanupNet(){ try { conn && conn.close(); } catch {} try { peer && peer.destroy(); } catch {} conn = null; peer = null; }
function myP(){ return [r2(me.pos.x), r2(me.pos.z), r2(me.ry), me.moving ? 1 : 0, me.running ? 1 : 0, (me.dash || me.grap) ? 1 : 0, me.sight > 0 ? 1 : 0, r2(me.oil)]; }
function sendState(){
  const p = myP();
  if (role === 'guest'){ send({ t: 'g', p, in: me.inp.map(r2) }); return; }
  send({
    t: 's', ph: phase === 'won' ? 'won' : phase === 'play' ? 'play' : 'lobby',
    d: DOOR_IDS.map(id => S.doors[id] ? '1' : '0').join(''),
    pl: PLATE_IDS.map(id => S.plateOn[id] ? '1' : '0').join(''),
    fr: S.frozen.map(r2), fz: S.freezes, el: r2(S.elapsed), sr: S.startRoom, rs: S.rs,
    br: S.broken, dc: S.decoys, bo: S.bolts.map(b => ({ x: r2(b.x), z: r2(b.z) })), sb: S.sb, ec: echoList(),
    gh: GHOSTS.map(g => [r2(g.x), r2(g.z), r2(g.y), r2(g.ry), g.w]),
    hp: p, in: me.inp.map(r2)
  });
}

/* ===================== UI / phases ===================== */
const screens = ['menu', 'lobby', 'won'];
function show(id){ screens.forEach(s => $(s).hidden = s !== id); }
function status(t){ $('status').textContent = t; }
let toastT = 0, storyT = 0, roomTime = 0, lastRoom = -1, hintT = 0;
function toast(t){ const el = $('toast'); el.textContent = t; el.classList.add('show'); toastT = 3.2; }
function hideGameUI(){ setPaused(false); $('hud').hidden = true; $('touch').hidden = true; $('btnExit').hidden = true; $('btnRespawn').hidden = true; $('btnSkip').hidden = true; $('frost').classList.remove('on'); $('sightFx').classList.remove('on'); }
function chosenStart(){ return clamp(parseInt($('startRoom').value) || 0, 0, Math.min(reached, ROOMS.length - 1)); }
function startGame(startRoom = 0){ resetWorld(); S.mercy = 0; GMULT = BASE_GMULT; solveUpTo(startRoom); setPhase('play'); }
function spawn(){ fallCD = 0; soloAnchor = null; S.soulFlip = 0; if (SOLO()) meChar.bodyMat.color.setHex(COLORS[0]); const sp = ROOMS[clamp(S.startRoom, 0, ROOMS.length - 1)].spawnW[myIdx()]; me.pos.set(sp[0], 0, sp[1]); me.ry = Math.PI; me.stamina = STAM; me.slide = null; me.dash = null; me.grap = null; me.oil = 1; me.hist = []; }
function setPhase(p){
  const prev = phase; phase = p;
  if (p === 'play'){
    if (role === 'guest' && prev !== 'play') for (const g of GHOSTS){ g.x = g.tx; g.z = g.tz; }
    show(null); $('hud').hidden = false; $('touch').hidden = !isTouch; $('btnExit').hidden = false; $('btnRespawn').hidden = false; $('btnSkip').hidden = false;
    $('dashBtn').hidden = !has('dash'); $('powBtn').hidden = !has('flash'); $('oilM').hidden = !has('oil');
    spawn(); meChar.group.visible = true; otherChar.group.visible = role !== 'solo';
    const partner = role === 'solo' ? 'You arrive' : `You and <b>${esc(remoteName)}</b> arrive`;
    const where = S.startRoom > 0 ? ` in <b>${ROOMS[S.startRoom].name}</b>` : '';
    const fl = CFG.feature ? `<br><br>New power: <b>${CFG.feature.icon || ''} ${esc(CFG.feature.name)}</b> — ${CFG.feature.how}` : '';
    $('story').innerHTML = `${partner}${where} at <b>${esc(CFG.title)}</b>.<br><br>${CFG.story || ''}${fl}`;
    $('story').classList.add('show'); storyT = 8;
    roomTime = 0; lastRoom = -1;
    sfx.boo();
  }
  if (p === 'won'){
    sess.clear(); setPaused(false);
    sfx.win(); $('touch').hidden = true; $('frost').classList.remove('on');
    const t = S.elapsed, full = S.startRoom === 0, bk = 'hm_best_L' + LEVEL;
    const best = parseFloat(store.get(bk, LEVEL === 1 ? store.get('hm_best10', '0') : '0')) || 0, newBest = full && (!best || t < best);
    if (newBest) store.set(bk, String(t));
    const stars = S.freezes <= 2 ? 3 : S.freezes <= 6 ? 2 : 1;
    if (full && stars > (parseInt(store.get('hm_stars_L' + LEVEL, '0')) || 0)) store.set('hm_stars_L' + LEVEL, String(stars));
    $('wonStars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('wonTitle').textContent = CFG.winTitle || 'You escaped! 🌙';
    $('wonSub').textContent = (role === 'solo' ? 'You made it out alive.' : `${names()[0]} and ${names()[1]} made it out alive.`) + ' (★★★ = frozen 2 times or fewer)';
    if (CFG.winSub) $('wonSub').textContent = (role === 'solo' ? 'You' : `${names()[0]} and ${names()[1]}`) + ' ' + CFG.winSub + ' (★★★ = frozen 2 times or fewer)';
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
  if (role === 'host'){ send({ t: 'nextlv', lv: n, code }); setTimeout(() => { cleanupNet(); goLevel(n, '?host=' + code); }, 400); }
  else { cleanupNet(); goLevel(n); }
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
  for (const l of LEVELS){ const o = document.createElement('option'); o.value = l.n; const st = parseInt(store.get('hm_stars_L' + l.n, '0')) || 0; o.textContent = `${l.n}. ${l.name}${st ? ' ' + '★'.repeat(st) : ''}`; ls.appendChild(o); }
  ls.value = String(LEVEL);
  // your record on this level, under the title
  const stars = parseInt(store.get('hm_stars_L' + LEVEL, '0')) || 0, best = parseFloat(store.get('hm_best_L' + LEVEL, LEVEL === 1 ? store.get('hm_best10', '0') : '0')) || 0;
  $('bestLine').hidden = !stars && !best;
  $('bestLine').textContent = [stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '', best ? 'Best escape ' + fmtTime(best) : ''].filter(Boolean).join('  ·  ');
}
function showHint(){
  const ri = roomAt(me.pos.z), R = ROOMS[ri];
  if (phase !== 'play' || !R || !R.def.hint) return;
  hintT = 12;
}
$('hintBtn').addEventListener('click', showHint);
$('hintBtn').addEventListener('touchstart', e => { e.preventDefault(); showHint(); }, { passive: false });
function powIcons(){
  const out = [];
  // icon with its cooldown fill, and the key that uses it underneath
  const pw = (icon, v, max, key) => out.push(`<div class="pwc"><div class="pw">${icon}<i style="height:${clamp(v / max, 0, 1) * 100}%"></i></div><span class="key">${key}</span></div>`);
  if (has('dash')) pw('⚡', me.dashCD, 1.1, 'Space');
  if (has('flash')) pw('☀', me.powCD, 5, 'F');
  if (has('decoy')) pw('🏮', me.decoyCD, 15, 'Hold Space');
  if (has('swap')) pw('🔁', swapCD, 1, 'G');
  if (has('rewind')) pw('⏪', me.rewCD, 10, 'R');
  return out.join('');
}
function updateHud(dt){
  const ri = roomAt(me.pos.z), R = ROOMS[ri], st = S.rs[ri];
  if (ri !== lastRoom){ lastRoom = ri; roomTime = 0; hintT = 0; }
  roomTime += dt; if (hintT > 0) hintT -= dt;
  $('roomName').textContent = R ? `${ri + 1}. ${R.name}` : 'Outside';
  $('timer').textContent = fmtTime(S.elapsed);
  $('hintBtn').hidden = !(R && R.def.hint && roomTime > 40 && hintT <= 0);
  let obj = '';
  const showingHint = R && R.def.hint && hintT > 0;
  if (myFrozen()) obj = `❄ You're frozen! ${SOLO() ? 'Wait for the ice to melt' : `${esc(remoteName)} can touch you to break the ice`} — or press ↺ Room start${isTouch ? '' : ' (T)'}.`;
  else if (showingHint) obj = '💡 ' + R.def.hint;
  else if (R){
    const note = R.def.notes && R.def.notes.find(n => Math.hypot(me.pos.x - n[0], me.pos.z - R.Z(n[1])) < (n[3] || 1.8));
    obj = note ? `<i>${esc(note[2])}</i>` : (R.def.objective ? R.def.objective(st, R, E) : '');
  } else obj = SOLO() || curP.every(p => p.pos.z < WIN_Z) ? 'Free!' : `You're out! Wait for ${esc(remoteName)}…`;
  if ($('objective').innerHTML !== obj) $('objective').innerHTML = obj;
  $('objective').classList.toggle('hint', !!showingHint);
  const pan = R && R.def.panel && phase === 'play' ? R.def.panel(st, R, E) : null;
  $('panel').hidden = !pan; if (pan && $('panel').innerHTML !== pan) $('panel').innerHTML = pan;
  const bar = R && R.def.bar && phase === 'play' ? R.def.bar(st, R, E) : null;
  $('barBox').hidden = !bar;
  if (bar){ $('barFill').style.width = (clamp(bar.frac, 0, 1) * 100) + '%'; $('barFill').style.background = bar.color || 'var(--gold)'; $('barLbl').textContent = bar.label || ''; }
  $('stamM').firstElementChild.style.width = (me.stamina / STAM * 100) + '%';
  if (has('oil')) $('oilM').firstElementChild.style.width = (me.oil * 100) + '%';
  const pi = powIcons(); if ($('powRow').innerHTML !== pi) $('powRow').innerHTML = pi;
  $('dashBtn').classList.toggle('cd', me.dashCD > 0 && !carrying(myIdx())); $('powBtn').classList.toggle('cd', me.powCD > 0);
  $('frost').classList.toggle('on', myFrozen());
  $('sightFx').classList.toggle('on', me.sight > 0);
  if (toastT > 0){ toastT -= dt; if (toastT <= 0) $('toast').classList.remove('show'); }
  if (storyT > 0 && storyT < 6.5 && me.moving) storyT = Math.min(storyT, .01);   // once you're on the move, the intro card gets out of the way
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
$('levelSel').addEventListener('change', e => { const n = +e.target.value; if (n !== LEVEL) goLevel(n); });
for (const el of document.querySelectorAll('.skinSel')){
  el.value = skinPref;
  el.addEventListener('change', e => {
    skinPref = e.target.value; store.set('hm_skin', skinPref);
    document.querySelectorAll('.skinSel').forEach(o => o.value = skinPref);
    applyColors(); send({ t: 'skin', sk: mySkin() });
  });
}
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
$('btnLeave').onclick = () => { sess.clear(); resume = null; rejoinCode = ''; toMenu(); };
$('btnMenu').onclick = () => { sess.clear(); toMenu(); };
$('btnExit').onclick = e => { e.currentTarget.blur(); setPaused(true); };
/* ----- ☰ menu: only an overlay — the level keeps running underneath (it's co-op; nothing can stop the ghosts) ----- */
function setPaused(on){
  if (on && phase !== 'play') return;
  if (on === paused) return;
  paused = on; $('pause').hidden = !on;
  if (on){
    for (const k in keys) keys[k] = false;
    btn.dash = btn.pow = false; me.sight = 0; runTouch = false; CAM.drag = false;
    joy.id = null; joy.x = joy.y = 0; $('joyKnob').style.transform = '';
    syncOptInputs(); $('ctlList').innerHTML = controlsHTML();
    if (role !== 'solo') send({ t: 'ev', k: 'pz', m: `${myName || 'Your partner'} opened the menu.` });
  }
}
function controlsHTML(){
  const rows = [], r = (pc, ph, what) => rows.push(`<b>${esc(isTouch ? ph : pc)}</b><span>${what}</span>`);
  r('W A S D / arrows', 'Joystick (left side)', 'Move — forward is away from the camera');
  r('Shift (hold)', 'RUN', 'Run (uses stamina)' + (has('phase') ? ' — runs through purple ghost-walls' : ''));
  if (has('dash')) r('Space / E', '⚡', 'Dash through ghosts and over short gaps' + (has('throw') ? '; throw what you carry' : '') + (has('grapple') ? '; zip to a golden ring you face' : '') + (has('vault') ? '; vault low barriers' : ''));
  if (has('decoy')) r('Hold Space', 'Hold ⚡', 'Drop a decoy lantern (15 s)');
  if (has('flash')) r('F', '☀', 'Lantern flash — stuns nearby ghosts (5 s)' + (has('bolt') ? '; while moving: freeze bolt' : '') + (has('bridge') ? '; facing a gap: spirit bridge' : ''));
  if (has('sight')) r('Hold F', 'Hold ☀', 'Ghost Sight — see invisible ghosts and hidden things');
  if (has('ping')) r('Click the ground / Q', 'Tap the ground', 'Ping a marker for your partner');
  if (has('swap')) r('G / click partner', 'Tap partner', 'Soul Swap — trade places' + (SOLO() ? ' (solo: drop / return to an anchor)' : ''));
  if (has('rewind')) r('R', 'Double-tap ☀', 'Rewind 3 seconds and leave a dream echo');
  if (has('blast')) r('Both F together', 'Both ☀ together', 'Soul Blast');
  if (has('shadow')) r('Passive', 'Passive', 'Hide behind your partner\'s back or in deep shadow');
  if (has('oil')) r('Passive', 'Passive', 'Your lantern burns oil in dark rooms — red cans refill it');
  r('Right-drag · wheel · C', 'Drag right side · pinch · double-tap', 'Turn · zoom · reset the camera');
  r('H', '💡', 'Hint (after 40 s in a room)');
  r('T', '↺', 'Back to the start of this room');
  r('Esc / P', '☰ Menu', 'This menu');
  if (!isTouch) r('🎮 Gamepad', '', 'Left stick move · right stick camera · A dash · X lantern · RT run · Y ping · Back room start · Start menu');
  return rows.join('');
}
const OPT_INPUTS = { oVol: 'vol', oSfx: 'sfx', oAmb: 'amb', oSens: 'sens', oInv: 'inv', oShake: 'shake', oDread: 'dread', oQual: 'qual' };
function syncOptInputs(){ for (const [id, k] of Object.entries(OPT_INPUTS)){ const el = $(id); if (!el) continue; if (el.type === 'checkbox') el.checked = !!OPT[k]; else el.value = OPT[k]; } }
function applyOpts(){
  applyAudio(); resize();
  store.set('hm_opts', JSON.stringify(OPT));
}
for (const [id, k] of Object.entries(OPT_INPUTS)){
  const el = $(id); if (!el) continue;
  el.addEventListener(el.type === 'range' ? 'input' : 'change', () => { OPT[k] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value; applyOpts(); });
}
$('pResume').onclick = () => setPaused(false);
$('pHint').onclick = () => { setPaused(false); showHint(); if (hintT <= 0) toast('No hint for this room.'); };
$('pRespawn').onclick = () => { setPaused(false); respawnRoom(); };
$('pSkip').onclick = () => { setPaused(false); skipRoom(); };
{
  const de = document.documentElement, fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const label = () => { $('pFull').textContent = fsOn() ? '⛶ Exit fullscreen' : '⛶ Fullscreen'; };
  $('fsRow').hidden = !(de.requestFullscreen || de.webkitRequestFullscreen);
  $('pFull').onclick = () => {
    try {
      if (fsOn()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const p = (de.requestFullscreen || de.webkitRequestFullscreen).call(de); if (p && p.catch) p.catch(() => toast('Fullscreen isn\'t allowed here.')); }
    } catch {}
  };
  document.addEventListener('fullscreenchange', label); document.addEventListener('webkitfullscreenchange', label);
}
$('pReset').onclick =() => { Object.assign(OPT, OPT_DEF); syncOptInputs(); applyOpts(); toast('Options reset.'); };
$('pLeave').onclick = () => { if (role !== 'solo' && !confirm('Leave the game? Your partner will be left on their own.')) return; setPaused(false); sess.clear(); toMenu(); };
{
  const s = sess.get();
  if (s){
    const where = `room ${s.room + 1}, ${ROOMS[s.room] ? ROOMS[s.room].name : ''}`;
    $('btnResume').hidden = false;
    $('btnResume').textContent = s.role === 'solo' ? `↻ Resume solo — ${where}` : s.role === 'host' ? `↻ Reopen game ${s.code} — ${where}` : `↻ Rejoin ${s.code} — ${where}`;
    $('btnResume').onclick = () => {
      unlockAudio(); if (s.role !== 'solo' && !needName()) return;
      $('btnResume').hidden = true; status('');
      if (s.partner) remoteName = s.partner;
      if (s.role === 'solo'){ myName = $('name').value.trim().slice(0, 12) || 'You'; role = 'solo'; applyColors(); resume = s; applyResume(); }
      else if (s.role === 'host'){ resume = s; hostGame(s.code); }
      else { rejoinCode = s.code; rejoinTries = 0; tryRejoin(); }
    };
  }
}
$('btnRespawn').onclick = e => { e.currentTarget.blur(); respawnRoom(); };
$('btnSkip').onclick = e => { e.currentTarget.blur(); skipRoom(); };
// skip the room you're in: it counts as solved and everyone in it (or behind it) hops to the start of the next room
function skipRoom(){
  if (phase !== 'play') return;
  const ri = roomAt(me.pos.z), R = ROOMS[ri]; if (!R) return;
  if (!confirm(`Skip ${R.name}?` + (role === 'solo' ? '' : ' Your partner will come with you.'))) return;
  if (role === 'guest'){ send({ t: 'skiproom', r: ri }); toast('Skipping…'); }
  else hostSkipRoom(ri);
}
function hostSkipRoom(ri){
  const R = ROOMS[ri]; if (!R || R.isOpen('exit') && ri < ROOMS.length - 1 && !curP.some(p => roomAt(p.pos.z) === ri)) return;
  if (R.def.solve) R.def.solve(S.rs[ri], R, E);
  R.open('exit'); S.frozen = [0, 0];
  const N = ROOMS[ri + 1];
  for (const p of curP){ const pr = roomAt(p.pos.z); if (pr < 0 || pr > ri) continue;
    if (N){ const sp = N.spawnW[p.idx]; E.teleport(p.idx, sp[0], sp[1]); } else E.teleport(p.idx, p.idx ? 1.5 : -1.5, WIN_Z - 2); }
  ev('door', `Skipped ${R.name}!`);
}
// stuck? hop back to the start of the room you're in (not the level). Only you move — the room and your partner stay as they are.
let respawnCD = 0;
function respawnRoom(){
  if (phase !== 'play' || lockMove) return;
  if (S.elapsed < respawnCD){ toast('One moment…'); return; }
  // frozen? going back to the room start breaks the ice (the host owns freeze state, so a guest asks it)
  if (myFrozen()){ if (role === 'guest') send({ t: 'unfz' }); S.frozen[myIdx()] = 0; }
  const ri = roomAt(me.pos.z), R = ROOMS[ri]; if (!R) return;
  const sp = R.spawnW[myIdx()];
  me.pos.set(sp[0], 0, sp[1]); me.slide = null; me.dash = null; me.grap = null; me.hist = []; me.ry = Math.PI; fallCD = .5;
  respawnCD = S.elapsed + 2;
  toast('Back to the start of ' + R.name + '.');
  if (role !== 'solo') send({ t: 'ev', k: 'respo', m: `${myName || 'Your partner'} went back to the start of the room.` });
}
$('btnAgain').onclick = () => {
  unlockAudio();
  if (role === 'guest'){ send({ t: 'again' }); $('btnAgain').disabled = true; $('btnAgain').textContent = 'Starting…'; }
  else startGame(S.startRoom);
};
$('btnNext').onclick = () => {
  if (role === 'guest'){ send({ t: 'next' }); $('btnNext').disabled = true; $('btnNext').textContent = 'Asking host…'; }
  else goNextLevel();
};
try {
  const q = new URLSearchParams(location.search), jc = q.get('join');
  // sent on by "Next level": the host reopens the same code here and the guest keeps trying it until it's up
  const hc = (q.get('host') || '').toUpperCase();
  if (jc){ $('code').value = jc.toUpperCase(); if (myName){ status('Joining ' + jc + '…'); rejoinCode = jc.toUpperCase(); rejoinTries = 0; setTimeout(tryRejoin, 600); } else status('Type your name and tap Join.'); }
  else if (/^[A-Z]{4}$/.test(hc) && myName) setTimeout(() => { if (phase === 'menu' && !role) hostGame(hc); }, 200);
  else if (hc && myName) status('Tap Create game — your partner will be sent here when they join your new code.');
  if (jc || q.get('host')) history.replaceState(null, '', location.pathname);
} catch {}

/* ===================== visuals ===================== */
const itemMeshes = new Map();
const decoyMeshes = [], boltMeshes = [], echoMeshes = [];
let sbMesh = null;
function itemMesh(R, ri, k, idx){
  const key = ri + ':' + idx;
  let m = itemMeshes.get(key);
  if (!m || m.userData.k !== k){
    if (m) scene.remove(m);
    m = (R.def.itemMesh && R.def.itemMesh(k, E)) || defaultItem(k);
    m.userData.k = k; scene.add(m); itemMeshes.set(key, m);
  }
  return m;
}
function defaultItem(k){
  const g = new THREE.Group();
  if (k === 'bomb'){ const b = new THREE.Mesh(new THREE.SphereGeometry(.35, 14, 10), mat(0x1a1a1a, { roughness: .4 })); g.add(b); const f = new THREE.Mesh(new THREE.ConeGeometry(.08, .25, 6), flameMat); f.position.y = .42; g.add(f); return g; }
  if (k === 'oil'){ const c = new THREE.Mesh(new THREE.CylinderGeometry(.22, .25, .5, 10), mat(0xc85a1a, { metalness: .5 })); g.add(c); return g; }
  if (k === 'key'){ g.add(new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 8, 14), glow(0xffd84d, .8))); const s = new THREE.Mesh(new THREE.BoxGeometry(.08, .5, .08), glow(0xffd84d, .8)); s.position.y = -.35; g.add(s); return g; }
  g.add(new THREE.Mesh(new THREE.DodecahedronGeometry(.3, 0), mat(0x8a8a94))); return g;
}
function updateWorldVisuals(dt, t){
  for (const id of DOOR_IDS){ const m = DOORS[id].mesh; m.position.y += ((S.doors[id] ? -2.55 : 0) - m.position.y) * damp(5, dt); }
  for (const c of CRACKED) c.mesh.visible = !S.broken[c.id];
  for (const h of HOOKS){ h.mesh.position.set(h.x, h.y ?? 2.6, h.z); h.post.position.set(h.x, 1.1, h.z); h.mesh.visible = !h.hidden; h.post.visible = !h.hidden && !h.noPost; h.mat.emissiveIntensity = h.off ? .05 : .5 + Math.sin(t * 4) * .2; h.mesh.rotation.y += dt; }
  ROOMS.forEach((R, i) => R.def.visual && R.def.visual(dt, t, S.rs[i], R, E));
  for (const id of PLATE_IDS){
    const p = PLATES[id]; if (!p.mesh) continue;
    const on = !!S.plateOn[id];
    p.mesh.position.y += ((on ? .01 : .06) - p.mesh.position.y) * damp(12, dt);
    const ei = p.force !== undefined ? p.force : on ? 1.1 : .35;
    p.mat.emissiveIntensity += (ei - p.mat.emissiveIntensity) * damp(10, dt);
    p.force = undefined;
  }
  // items
  const seen = new Set();
  ROOMS.forEach((R, ri) => {
    const st = S.rs[ri]; if (!st || !st.items) return;
    st.items.forEach((it, i) => {
      const m = itemMesh(R, ri, it.k, i); seen.add(ri + ':' + i);
      m.visible = it.s !== 3 && (!it.hidden || it.s !== 0 || me.sight > 0);
      if (!m.visible) return;
      if (it.s === 1){ const pp = E.playerPos(it.w); if (pp){ m.position.set(pp.x, 2.2, pp.z); } }
      else m.position.set(it.x, it.s === 2 ? (it.y || 1) : (it.yRest ?? .4), R.Z(it.lz));
      m.rotation.y += dt * (it.s === 0 ? .8 : 4);
      if (it.k === 'bomb' && it.fuse > 0) m.scale.setScalar(1 + Math.sin(t * 30) * .12);
    });
  });
  for (const [k, m] of itemMeshes) if (!seen.has(k)) m.visible = false;
  // decoys / bolts / spirit bridge / pings / flash fx
  { const el = echoList(); while (echoMeshes.length < el.length){ const c = makeChar(0xffffff, true); c.bodyMat.emissive = new THREE.Color(0x8a8aff); c.bodyMat.emissiveIntensity = .7; echoMeshes.push(c); } echoMeshes.forEach((c, i) => { const e = el[i]; c.group.visible = !!e; if (e){ c.bodyMat.color.setHex(COLORS[e[0]]); const dx = e[1] - c.group.position.x, dz = e[2] - c.group.position.z; if (Math.hypot(dx, dz) > .02) c.group.rotation.y = Math.atan2(dx, dz); c.group.position.set(e[1], 0, e[2]); } }); }
  while (decoyMeshes.length < S.decoys.length){ const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(.35, .5, .35), glow(0xffcf7a, 2))); const l = new THREE.PointLight(0xffb36b, 5, 8, 1.2); l.position.y = 1; g.add(l); scene.add(g); decoyMeshes.push(g); }
  decoyMeshes.forEach((m, i) => { const d = S.decoys[i]; m.visible = !!d; if (d){ m.position.set(d.x, .3 + Math.sin(t * 6) * .05, d.z); } });
  while (boltMeshes.length < S.bolts.length){ const b = new THREE.Mesh(new THREE.SphereGeometry(.25, 10, 8), glow(0x9fe8ff, 2.5)); scene.add(b); boltMeshes.push(b); }
  boltMeshes.forEach((m, i) => { const b = S.bolts[i]; m.visible = !!b; if (b) m.position.set(b.x, 1.1, b.z); });
  if (S.sb){
    if (!sbMesh){ sbMesh = new THREE.Mesh(new THREE.BoxGeometry(1, .1, 1.6), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .7 })); scene.add(sbMesh); }
    const b = S.sb, len = Math.hypot(b.x2 - b.x1, b.z2 - b.z1);
    sbMesh.visible = true; sbMesh.scale.set(len, 1, 1); sbMesh.position.set((b.x1 + b.x2) / 2, .12, (b.z1 + b.z2) / 2); sbMesh.rotation.y = -Math.atan2(b.z2 - b.z1, b.x2 - b.x1);
    sbMesh.material.opacity = .35 + Math.min(1, b.t) * .4;
  } else if (sbMesh) sbMesh.visible = false;
  if (soloAnchor){ if (!anchorMesh){ anchorMesh = new THREE.Mesh(new THREE.TorusGeometry(.6, .08, 8, 24), glow(0xd8a8ff, 1.5)); anchorMesh.rotation.x = Math.PI / 2; scene.add(anchorMesh); } anchorMesh.visible = true; anchorMesh.position.set(soloAnchor.x, .1, soloAnchor.z); anchorMesh.rotation.z += dt * 2; } else if (anchorMesh) anchorMesh.visible = false;
  for (let i = PINGS.length - 1; i >= 0; i--){ const p = PINGS[i]; p.t -= dt; const s = 1 + (4 - p.t) * .15; p.ring.scale.setScalar(s); p.g.children.forEach(c => c.material.opacity = Math.max(0, p.t / 4)); if (p.t <= 0){ scene.remove(p.g); PINGS.splice(i, 1); } }
  for (let i = fxLights.length - 1; i >= 0; i--){ const f = fxLights[i]; f.t -= dt; f.l.intensity = Math.max(0, f.t / .45 * 30); f.s.scale.setScalar(1 + (.45 - f.t) * 12); f.s.material.opacity = Math.max(0, f.t / .45 * .45); if (f.t <= 0){ scene.remove(f.l); scene.remove(f.s); fxLights.splice(i, 1); } }
  // ghosts
  let nearest = 99, ng = null;
  spectralMat.emissiveIntensity = me.sight > 0 ? 1.8 : .6; spectralMat.color.setHex(me.sight > 0 ? 0xeee6ff : 0x9a6bff);
  for (const g of GHOSTS){
    if (role === 'guest'){ g.x += (g.tx - g.x) * damp(10, dt); g.z += (g.tz - g.z) * damp(10, dt); }
    const m = g.mesh, shake = g.w ? Math.sin(t * 60) * .04 : 0;
    m.position.set(g.x + shake, g.y + (g.flat ? 0 : .15 + Math.sin(t * 2.2 + g.home[0]) * .15), g.z);
    let d = g.ry - m.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); m.rotation.y += d * damp(g.snap ? 30 : 8, dt);
    const hidden = g.invisible && !(me.sight > 0) && !(g.revealed && g.revealed(S.rs[g.room]));
    m.visible = g.y < 11 && !hidden;
    const gd = Math.hypot(g.x - me.pos.x, g.z - me.pos.z) + (hidden ? 1 : 0);
    if (m.visible) animGhost(g, t, dt, g.harmless ? 99 : gd);
    if ((m.visible && !g.harmless || hidden) && gd < nearest){ nearest = gd; ng = g; }
  }
  updateAmbience(dt, nearest, ng);
  // darkness: dim the world while you're in a dark room; lights stutter when a ghost is close (and now and then anyway)
  const R = ROOMS[roomAt(me.pos.z)], dark = R && R.def.dark ? (typeof R.def.dark === 'function' ? R.def.dark(S.rs[R.i], R, E) : R.def.dark) : 0;
  hemiBase += (AMB * (1 - dark * .9) - hemiBase) * damp(3, dt);
  moonBase += (.45 * (1 - dark) - moonBase) * damp(3, dt);
  const flk = flicker(dt, nearest);
  hemi.intensity = hemiBase * flk; moon.intensity = moonBase * flk;
}
let hemiBase = AMB, moonBase = .45, beatT = 0, flickT = 30, flickOn = 0, shakeT = 0;
const camShake = new THREE.Vector3();
const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function updateAmbience(dt, nearest, ng){
  const play = phase === 'play', close = play ? clamp((7 - nearest) / 7, 0, 1) : 0;
  if (whisperGain) whisperGain.gain.value = close * .07;
  if (whisperPan && ng){
    // pan toward the ghost relative to the camera's right-hand side (the camera sits behind you at CAM.yaw)
    const dx = ng.x - me.pos.x, dz = ng.z - me.pos.z, d = Math.hypot(dx, dz) || 1;
    whisperPan.pan.value = clamp((dx * Math.cos(CAM.yaw) - dz * Math.sin(CAM.yaw)) / d, -1, 1) * .8;
  }
  if (droneGain) droneGain.gain.value = phase === 'menu' ? .02 : .045;
  themeTick(dt);
  $('dread').style.opacity = play && OPT.dread ? (clamp((5 - nearest) / 4, 0, 1) * .85).toFixed(3) : '0';
  if (!play) return;
  // heartbeat: starts within 4.5 m and quickens to ~130 bpm when a ghost is on top of you
  if (nearest < 4.5 && !myFrozen()){ beatT -= dt; if (beatT <= 0){ const k = 1 - nearest / 4.5; sfx.pulse(.5 + k * .5); beatT = 1.05 - k * .6; } } else beatT = .2;
  if (nearest < 1.6 && shakeT < .15) shakeT = .15;
}
function flicker(dt, nearest){
  if (phase !== 'play' || !OPT.dread) return 1;
  flickT -= dt;
  if (flickT <= 0){ flickT = 25 + Math.random() * 30; flickOn = .35; }
  if (flickOn > 0){ flickOn -= dt; return Math.random() < .5 ? .35 : 1; }
  if (nearest < 3.5 && Math.random() < (3.5 - nearest) / 3.5 * .12) return .55 + Math.random() * .3;
  return 1;
}
function updateCharVisuals(c, frozenSec){
  const fr = frozenSec > 0;
  c.ice.visible = fr;
  c.bodyMat.emissive.setHex(fr ? 0x2a6a9a : 0x000000); c.bodyMat.emissiveIntensity = fr ? .5 : 0;
}

/* ===================== main loop ===================== */
let last = performance.now(), clockT = 0, netT = 0, histT = 0;
const camPos = new THREE.Vector3(0, 16, 20), camLook = new THREE.Vector3();
camera.position.copy(camPos);
function tick(dt){
  clockT += dt; fallCD -= dt; pollPad(dt);
  me.dashCD = Math.max(0, me.dashCD - dt); swapCD = Math.max(0, swapCD - dt); me.powCD = Math.max(0, me.powCD - dt); me.rewCD = Math.max(0, me.rewCD - dt); me.decoyCD = Math.max(0, me.decoyCD - dt);
  if (btn.dash){ btn.dashT += dt; if (has('decoy') && !btn.dashUsed && btn.dashT > .65 && !carrying(myIdx())){ btn.dashUsed = true; actDash(true); } }
  if (btn.pow){ btn.powT += dt; if (has('sight') && btn.powT > .3 && phase === 'play'){ btn.powUsed = true; if (me.sightE > 0){ me.sight = 1; me.sightE = Math.max(0, me.sightE - dt / 5); } else me.sight = 0; } }
  else me.sightE = Math.min(1, me.sightE + dt / 6);
  if (role === 'host' || role === 'solo') hostTick(dt);
  else { curP = playerList(); if (role === 'guest' && phase === 'play') S.elapsed += dt; }
  const inGame = phase === 'play' || phase === 'won';
  lockMove = false;
  if (inGame){
    ROOMS.forEach((R, i) => R.def.local && R.def.local(dt, S.rs[i], R, E));
    updateMe(dt);
    histT -= dt; if (histT <= 0){ histT = .05; me.hist.push([S.elapsed, me.pos.x, me.pos.z]); while (me.hist.length && me.hist[0][0] < S.elapsed - 4) me.hist.shift(); }
    const R = ROOMS[roomAt(me.pos.z)];
    if (has('oil') && R && R.def.dark && phase === 'play'){ me.oil = Math.max(0, me.oil - dt * (R.def.oilRate || 1 / 70)); }
    meChar.group.position.copy(me.pos); meChar.group.rotation.y = me.ry;
    animChar(meChar, dt, me.moving, me.running, me.oil);
    { const Rm = ROOMS[roomAt(me.pos.z)]; if (Rm && Rm.def.lantern && meChar.light){ const k = Rm.def.lantern(S.rs[Rm.i], Rm, E); meChar.light.distance *= k; meChar.light.intensity *= k; } }
    meChar.rig.scale.setScalar(me.dash || me.grap ? .85 : 1);
    updateCharVisuals(meChar, S.frozen[myIdx()]);
    { let hid = false; const Rm = ROOMS[roomAt(me.pos.z)];
      if (has('shadow') && otherChar.group.visible && role !== 'solo'){ const q = other.target, dx = me.pos.x - q.x, dz = me.pos.z - q.z, d = Math.hypot(dx, dz); hid = d < 1.9 && d > .2 && (dx * Math.sin(other.ry) + dz * Math.cos(other.ry)) / d < -.45; }
      if (!hid && Rm && Rm.def.shadows) hid = Rm.def.shadows(S.rs[Rm.i], Rm, E).some(r => me.pos.x > r.x1 && me.pos.x < r.x2 && me.pos.z > r.z1 && me.pos.z < r.z2);
      me.hiddenL = hid; meChar.bodyMat.transparent = true; meChar.bodyMat.opacity += ((hid ? .35 : 1) - meChar.bodyMat.opacity) * damp(8, dt); }
    meChar.label.setText(myFrozen() ? `❄ ${Math.ceil(S.frozen[myIdx()])}` : (myName || 'You'), myFrozen() ? '#bfeaff' : CSSCOL[myIdx()]);
    if (otherChar.group.visible && other.seen){
      otherChar.group.position.lerp(other.target, damp(14, dt));
      let d = other.ry - otherChar.group.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); otherChar.group.rotation.y += d * damp(14, dt);
      animChar(otherChar, dt, other.moving, other.running, other.oil);
      { const Ro = ROOMS[roomAt(other.target.z)]; if (Ro && Ro.def.lantern && otherChar.light){ const k = Ro.def.lantern(S.rs[Ro.i], Ro, E); otherChar.light.distance *= k; otherChar.light.intensity *= k; } }
      const of = S.frozen[1 - myIdx()];
      updateCharVisuals(otherChar, of);
      otherChar.label.setText(of > 0 ? `❄ ${remoteName} — touch to save!` : remoteName, of > 0 ? '#bfeaff' : CSSCOL[1 - myIdx()]);
    }
    const rm = roomAt(me.pos.z);
    if (phase === 'play' && rm > reached && rm < ROOMS.length){ reached = rm; store.set(reachKey, String(reached)); }
    sessT -= dt; if (phase === 'play' && sessT <= 0 && rm >= 0){ sessT = 2; sess.save(); }
  }
  updateWorldVisuals(dt, clockT);
  if (inGame){
    const k = camera.aspect < 1 ? 1.3 : 1;
    const e = damp(14, dt); CAM.yaw += (CAM.ty - CAM.yaw) * e; CAM.pitch += (CAM.tp - CAM.pitch) * e; CAM.zoom += (CAM.tz - CAM.zoom) * e;
    const P = BASE_PITCH + CAM.pitch, D = BASE_DIST * k * CAM.zoom, sy = Math.sin(CAM.yaw), cy = Math.cos(CAM.yaw);
    const look = 1.2 * Math.min(1, CAM.zoom);
    camLook.set(me.pos.x - sy * look, .8 + (1 - Math.min(1, CAM.zoom)) * .5, me.pos.z - cy * look);
    camPos.set(me.pos.x + sy * Math.cos(P) * D, Math.sin(P) * D + .4, me.pos.z + cy * Math.cos(P) * D);
    camera.position.sub(camShake).lerp(camPos, damp(5, dt)); camera.lookAt(camLook);
    // shake is a small offset added after lookAt and removed next frame, so it never drifts the follow camera
    camShake.set(0, 0, 0);
    if (shakeT > 0){ shakeT -= dt; if (!calm && OPT.shake){ const a = Math.min(1, shakeT / .5) * .12; camShake.set((Math.random() - .5) * a, (Math.random() - .5) * a, (Math.random() - .5) * a); camera.position.add(camShake); } }
  } else {
    const a = clockT * .08;
    camera.position.set(Math.sin(a) * 9, 13, 2 + Math.cos(a) * 9); camera.lookAt(0, 0, 0);
  }
  netT -= dt;
  if (netT <= 0 && conn && conn.open && (phase === 'play' || phase === 'won' || phase === 'lobby')){ netT = role === 'guest' ? 1 / 20 : 1 / 15; sendState(); }
  if (inGame) updateHud(dt);
}
E.chars = { me: meChar, other: otherChar };
// CFG.fancy (Level 1): soft lantern shadows and a bloom glow on flames. Decided at load; Low graphics quality skips it.
let composer = null;
const FANCY = !!CFG.fancy && OPT.qual !== 'low';
function shadowPass(){
  scene.traverse(o => {
    if (!o.isMesh) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    o.receiveShadow = true;   // floors, glowing bits and see-through things don't cast
    o.castShadow = ms.every(m => !m.transparent && !m.isMeshBasicMaterial) && o.geometry.type !== 'PlaneGeometry' && !(ms[0].emissiveIntensity > .8);
  });
}
if (FANCY){
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  for (const c of [meChar, otherChar]) if (c.light){ const l = c.light; l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.camera.near = .2; l.shadow.camera.far = 16; l.shadow.bias = -.004; l.shadow.radius = 3; }
  shadowPass(); setTimeout(shadowPass, 3000); setTimeout(shadowPass, 9000);   // again once the character models have loaded
  Promise.all(['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'OutputPass'].map(n => import('three/addons/postprocessing/' + n + '.js'))).then(([ec, rp, ub, op]) => {
    composer = new ec.EffectComposer(renderer); composer.addPass(new rp.RenderPass(scene, camera));
    composer.addPass(new ub.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .55, .45, .82)); composer.addPass(new op.OutputPass());
    const fit = () => { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight); }; fit(); addEventListener('resize', fit);
  }).catch(e => console.warn('bloom unavailable', e));
}
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  tick(dt); if (composer) composer.render(); else renderer.render(scene, camera);
}
requestAnimationFrame(loop);
// A background tab gets no animation frames, which would freeze a co-op game for both players. While hidden and linked,
// keep simulating (and talking to your partner) on a timer; browsers slow timers to about once a second, so catch up in steps.
let bgT = 0;
setInterval(() => {
  if (!document.hidden || !(conn && conn.open)){ bgT = 0; return; }
  const now = performance.now(); let dt = bgT ? Math.min(2, (now - bgT) / 1000) : 0; bgT = now;
  while (dt > 1e-3){ const s = Math.min(.05, dt); tick(s); dt -= s; }
}, 250);
// fade in once the first frame is drawn, and quietly fetch the next level so "Next level" opens fast
requestAnimationFrame(() => requestAnimationFrame(() => $('fade').classList.add('out')));
setTimeout(() => $('fade').classList.add('out'), 1500);   // in case frames are paused (background tab)
if (LEVELS.some(l => l.n === LEVEL + 1)){
  const v = new URL(import.meta.url).searchParams.get('v'), next = levelUrl(LEVEL + 1);
  for (const u of [next, next + 'rooms.js' + (v ? '?v=' + v : '')]){ const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u; document.head.appendChild(l); }
}

// handle for automated tests (also window.G with ?dev)
const handle = {
  S, me, other, tick, startGame, solveUpTo, resetWorld, ROOMS, GHOSTS, PLATES, DOORS, colliders, keys, E, roomAt, HOOKS, requestSwap, getAnchor: () => soloAnchor,
  setRole: r => { role = r; }, setConn: c => { conn = c; }, getPhase: () => phase, WIN_Z, setRemote: n => { remoteName = n; },
  pressDash, releaseDash, pressPow, releasePow, hostAbility, doRewind, respawnRoom, skipRoom, btn, carrying, doPing, hostPing
};
if (DEV){ window.G = handle; handle.step = (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) tick(dt); if (composer) composer.render(); else renderer.render(scene, camera); }; }
return handle;
}
