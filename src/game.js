// =====================================================================================================
// Tau-Gefecht – kleines 1-gegen-1-Tabletop im Browser mit den geriggten Figuren
// Einheiten: mm (wie die Figuren), Regeln in Zoll (1" = 25,4 mm). Tisch 36" × 24", x = Breite, z = Tiefe.
// Spieler 1 steht bei +z (vorne), Spieler 2 bei −z.
// =====================================================================================================
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const IN = 25.4, BW = 36 * IN, BD = 24 * IN, CELL = IN / 2, NX = 72, NZ = 48;
const ROUNDS = 5, MAX_PTS = 100, ZONE = 6;
const Q = new URLSearchParams(location.search);
const TEAMS = [{ name: 'Spieler 1', col: '#ff8a3d' }, { name: 'Spieler 2', col: '#3fb8ff' }];

// ---------- Einheiten-Profile ----------
// M Bewegung, T Widerstand, Sv Rüstung, inv Rettungswurf, W Lebenspunkte, OC Kontrollwert
// Waffen: r Reichweite, A Attacken, BS trifft auf x+, S Stärke, AP Durchschlag, D Schaden
const JET = ['Sprungdüsen', 'Bewegt sich über Gelände und Modelle hinweg.'];
const UT = {
  crisis_rot: { name: 'XV8 Crisis „Raketen“', short: 'Crisis (Raketen)', build: crisisRed, pts: 35, max: 2, M: 10, T: 5, Sv: 3, W: 5, OC: 2, fly: 'jet',
    guns: [{ n: 'Raketenkapseln', r: 30, A: 3, BS: 3, S: 7, AP: 1, D: 2, fx: 'missile', noCover: true }],
    melee: { n: 'Panzerfäuste', A: 2, BS: 5, S: 5, AP: 0, D: 1 },
    abil: [JET, ['Lenkraketen', 'Ziele erhalten keinen Deckungsbonus.']] },
  crisis_blau: { name: 'XV8 Crisis „Schild“', short: 'Crisis (Schild)', build: crisisBlue, pts: 45, max: 2, M: 10, T: 5, Sv: 3, inv: 4, W: 5, OC: 2, fly: 'jet',
    guns: [{ n: 'Plasmagewehr', r: 18, A: 3, BS: 3, S: 8, AP: 3, D: 2, fx: 'plasma' }],
    melee: { n: 'Panzerfäuste', A: 2, BS: 5, S: 5, AP: 0, D: 1 },
    abil: [JET, ['Schildgenerator', 'Rettungswurf 4+, den Durchschlag nicht verschlechtert.']] },
  broadside: { name: 'XV88 Broadside', short: 'Broadside', build: broadside, pts: 50, max: 1, M: 5, T: 6, Sv: 2, W: 8, OC: 2, steady: true, noSprint: true,
    guns: [{ n: 'Schwere Railkanone', r: 48, A: 1, BS: 3, S: 12, AP: 4, D: 'W6', fx: 'rail' },
           { n: 'Zwillings-Raketen', r: 30, A: 2, BS: 3, S: 7, AP: 1, D: 2, fx: 'missile' }],
    melee: { n: 'Wuchtfaust', A: 3, BS: 4, S: 7, AP: 1, D: 2 },
    abil: [['Stabilisiert', '+1 auf Trefferwürfe, wenn sie sich in dieser Aktivierung nicht bewegt hat.'], ['Schwerfällig', 'Kann nicht sprinten.']] },
  stealth: { name: 'XV25 Stealth', short: 'Stealth', build: stealth, pts: 22, max: 2, M: 8, T: 4, Sv: 3, W: 4, OC: 1, fly: 'jet', cloak: true,
    guns: [{ n: 'Burst Cannon', r: 18, A: 6, BS: 4, S: 5, AP: 1, D: 1, fx: 'burst' }],
    melee: { n: 'Kampfschläge', A: 2, BS: 5, S: 4, AP: 0, D: 1 },
    abil: [['Tarnfeld', 'Schüsse aus mehr als 12" Entfernung erhalten −1 auf Trefferwürfe.'], JET] },
  pathfinder: { name: 'Pathfinder', short: 'Pathfinder', build: pathfinder, pts: 15, max: 2, M: 7, T: 3, Sv: 4, W: 3, OC: 2, marker: true, scout: true,
    guns: [{ n: 'Rail Rifle', r: 30, A: 1, BS: 4, S: 10, AP: 4, D: 'W3+1', fx: 'rail' }],
    melee: { n: 'Gewehrkolben', A: 1, BS: 5, S: 3, AP: 0, D: 1 },
    abil: [['Markerlicht', 'Statt zu schießen ein sichtbares Ziel in 36" markieren: bis Rundenende +1 auf Trefferwürfe dagegen, keine Deckung.'], ['Tarnumhang', 'Gilt gegen Beschuss immer als in Deckung.']] },
  firewarrior: { name: "Fire Warrior Shas'ui", short: 'Fire Warrior', build: firewarrior, pts: 12, max: 3, M: 6, T: 3, Sv: 4, W: 3, OC: 2, steady: true,
    guns: [{ n: 'Pulskarabiner', r: 20, A: 3, BS: 4, S: 5, AP: 1, D: 1, fx: 'pulse', rapid: 1 }],
    melee: { n: 'Gewehrkolben', A: 1, BS: 5, S: 3, AP: 0, D: 1 },
    abil: [['Schnellfeuer', '+1 Attacke auf halbe Reichweite (10").'], ['Kniend im Anschlag', '+1 auf Trefferwürfe, wenn er sich nicht bewegt hat.']] },
  katze: { name: 'Geflügelte Katze', short: 'Katze', build: cat, pts: 40, max: 1, M: 12, T: 5, Sv: 5, inv: 4, W: 7, OC: 1, fly: 'wings', beast: true,
    guns: [], melee: { n: 'Krallen und Fänge', A: 4, BS: 3, S: 6, AP: 1, D: 2 },
    abil: [['Flug', 'Fliegt über Gelände und Modelle hinweg.'], ['Jagdinstinkt', 'Darf nach dem Sprinten kämpfen. Gegenschläge gegen sie treffen mit −1 (Fauchen).'], ['Schattenhaft', 'Rettungswurf 4+.']] },
};
const PRESETS = [['broadside', 'stealth', 'firewarrior', 'firewarrior'], ['crisis_blau', 'crisis_rot', 'pathfinder'], ['katze', 'stealth', 'pathfinder', 'firewarrior'],
  ['crisis_rot', 'stealth', 'pathfinder', 'firewarrior'], ['broadside', 'stealth', 'pathfinder']];
const OBJ = [{ x: -12 * IN, z: 0 }, { x: 0, z: 0 }, { x: 12 * IN, z: 0 }];

// ---------- Szene ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: Q.has('shot') });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene(), overlay = new THREE.Scene();
scene.background = new THREE.Color('#121316');
const camera = new THREE.PerspectiveCamera(36, 1, 5, 9000);
camera.position.set(0, 760, 900);
const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enableDamping: true, dampingFactor: .1, maxPolarAngle: 1.38, minDistance: 110, maxDistance: 2200, screenSpacePanning: false, zoomToCursor: true });
controls.target.set(0, 0, 60);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .42;
scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x3a3530, .5));
const sun = new THREE.DirectionalLight(0xfff0dc, 2.5);
sun.position.set(-420, 860, 380); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -640, right: 640, top: 520, bottom: -520, near: 200, far: 2400 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .5;
scene.add(sun);
const rimL = new THREE.DirectionalLight(0x9fb8ff, .75); rimL.position.set(520, 300, -640); scene.add(rimL);
const fx = makeFx(renderer, scene, camera);
const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
let dirty = true;
function renderAll() {
  if (G.fx) {
    fx.render();
    // Überlagerungen (Bewegungsfläche, Schüsse …) mit korrekter Verdeckung: Tiefe der Szene nachziehen
    renderer.autoClear = false; renderer.clearDepth();
    const bg = scene.background, su = renderer.shadowMap.autoUpdate;
    scene.background = null; scene.overrideMaterial = depthOnly; renderer.shadowMap.autoUpdate = false;
    renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; renderer.shadowMap.autoUpdate = su;
    renderer.render(overlay, camera); renderer.autoClear = true;
  } else {
    renderer.render(scene, camera);
    renderer.autoClear = false; renderer.render(overlay, camera); renderer.autoClear = true;
  }
}
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); fx.setSize(w, h, renderer.getPixelRatio());
  camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
}
new ResizeObserver(resize).observe(stage);

// ---------- Kleine Helfer ----------
// Spielzufall (Würfel) getrennt vom Optik-Zufall: online würfeln beide Geräte mit demselben Startwert identisch
let RNG = Math.random;
const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const d6 = () => 1 + Math.floor(RNG() * 6), vd6 = () => 1 + Math.floor(Math.random() * 6);
const dParse = D => { const m = /^W(\d)(?:\+(\d+))?$/.exec(String(D)); return m ? [+m[1], +(m[2] || 0)] : [6, 0]; };
const dAvg = D => typeof D === 'number' ? D : (dParse(D)[0] + 1) / 2 + dParse(D)[1];
const dRoll = D => { if (typeof D === 'number') return D; const [n, b] = dParse(D); return 1 + Math.floor(RNG() * n) + b; };
const fmt = (v, n = 1) => v.toFixed(n).replace('.', ',');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const $ = id => document.getElementById(id);
const cx = k => -BW / 2 + (k + .5) * CELL, cz = m => -BD / 2 + (m + .5) * CELL;
const cellOf = (x, z) => [Math.floor((x + BW / 2) / CELL), Math.floor((z + BD / 2) / CELL)];
const anims = new Set();
function tween(dur, fn) { return new Promise(res => { if (dur <= 0 || G.instant || G.skip) { fn(1); res(); return; } anims.add({ t: 0, dur, fn, res }); }); }
const wait = s => tween(s, () => {});
const lerpAng = (a, b, t) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

// ---------- Ton (kleine Synthesizer-Effekte, keine Dateien) ----------
let AC = null, noiseBuf = null;
function snd(kind, vol = 1) {
  if (!G.sound || G.instant) return;
  try {
    AC ??= new AudioContext(); if (AC.state === 'suspended') AC.resume();
    if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = AC.currentTime, out = AC.createGain(); out.connect(AC.destination);
    const env = (g, a, peak, dec) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * vol, t + a); g.gain.exponentialRampToValueAtTime(.001, t + a + dec); };
    const osc = (type, f0, f1, dur, peak) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, .005, peak, dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + .05); };
    const noise = (fType, f0, f1, dur, peak, q = 1) => { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = fType; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, .005, peak, dur); s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + dur + .05); };
    ({
      pulse: () => { osc('square', 1300, 260, .09, .07); noise('bandpass', 3000, 900, .07, .06, 2); },
      burst: () => { osc('square', 1600, 400, .05, .05); },
      plasma: () => { osc('sawtooth', 300, 1400, .16, .06); osc('sine', 900, 200, .2, .08); },
      rail: () => { osc('sawtooth', 3200, 90, .35, .08); noise('highpass', 6000, 1500, .3, .09); },
      missile: () => { noise('bandpass', 400, 2400, .35, .14, 1.5); },
      boom: () => { noise('lowpass', 900, 60, .7, .5); osc('sine', 120, 35, .5, .3); },
      hit: () => { noise('bandpass', 1800, 500, .12, .12, 3); },
      claw: () => { noise('highpass', 2500, 4000, .08, .15); },
      hiss: () => { noise('highpass', 3500, 5000, .7, .12); },
      jet: () => { noise('lowpass', 300, 1200, .6, .12); },
      click: () => { osc('sine', 700, 500, .05, .04); },
      round: () => { osc('triangle', 220, 220, .5, .08); osc('triangle', 330, 330, .6, .05); },
    })[kind]?.();
  } catch {}
}

// ---------- Spielfeld ----------
const COLL = [];   // Gelände-Hindernisse als achsparallele Quader {min:[x,y,z], max:[x,y,z]}
function solid(p, w, h, d, c, x, y, z, o = {}) {
  const m = B(p, w, h, d, c, [x, y + h / 2, z], undefined, { round: .8, ...o });
  if (!o.deco) COLL.push({ min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2] });
  return m;
}
function canvasTex(w, h, paint, srgb = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
}
function groundTexture() {
  return canvasTex(2304, 1536, (x, W, H) => {
    const R = rng(11), ppi = W / 36;
    x.fillStyle = '#6b6459'; x.fillRect(0, 0, W, H);
    // Flecken: Asche, Staub, Rost
    for (let i = 0; i < 900; i++) {
      const px = R() * W, py = R() * H, r = 20 + R() * 170, c = ['80,70,58', '140,128,110', '58,52,46', '120,92,62', '96,100,96'][Math.floor(R() * 5)];
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${c},${.08 + R() * .16})`); g.addColorStop(1, `rgba(${c},0)`);
      x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r);
    }
    // Betonplatten (Industrieboden), teils aufgebrochen
    const s = 3 * ppi;
    for (let gx = 0; gx < 12; gx++) for (let gy = 0; gy < 8; gy++) {
      const v = R(); if (v < .32) continue;
      const px = gx * s, py = gy * s;
      x.fillStyle = `rgba(${v < .6 ? '150,142,128' : '100,96,90'},${.06 + R() * .08})`; x.fillRect(px + 3, py + 3, s - 6, s - 6);
      x.strokeStyle = 'rgba(28,25,22,.55)'; x.lineWidth = 3; x.strokeRect(px + 2, py + 2, s - 4, s - 4);
      x.strokeStyle = 'rgba(200,190,170,.10)'; x.lineWidth = 1.5; x.strokeRect(px + 5, py + 5, s - 10, s - 10);
      if (R() < .35) { x.fillStyle = 'rgba(30,28,26,.5)'; for (let b = 0; b < 4; b++) { x.beginPath(); x.arc(px + 14 + (b % 2) * (s - 28), py + 14 + (b >> 1) * (s - 28), 4, 0, 7); x.fill(); } }
    }
    // Risse
    x.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      let px = R() * W, py = R() * H, a = R() * 7; x.beginPath(); x.moveTo(px, py);
      const n = 6 + R() * 22; for (let j = 0; j < n; j++) { a += (R() - .5) * 1.2; px += Math.cos(a) * 12; py += Math.sin(a) * 12; x.lineTo(px, py); }
      x.strokeStyle = `rgba(22,20,18,${.35 + R() * .3})`; x.lineWidth = 1 + R() * 2.2; x.stroke();
    }
    // Ölflecken
    for (let i = 0; i < 18; i++) { const px = R() * W, py = R() * H, r = 15 + R() * 50; const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(20,18,16,.5)'); g.addColorStop(.7, 'rgba(20,18,16,.25)'); g.addColorStop(1, 'rgba(20,18,16,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * (.5 + R() * .5), R() * 3, 0, 7); x.fill(); }
    // Körnung
    for (let i = 0; i < 90000; i++) { x.fillStyle = R() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)'; x.fillRect(R() * W, R() * H, 2, 2); }
  });
}
function decal(p, x, z, r, paint, rot = 0) {
  const t = canvasTex(256, 256, paint);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, .15, z); m.receiveShadow = true; m.userData.noFx = true; p.add(m); return m;
}
const crater = (x, w, h) => { const g = x.createRadialGradient(128, 128, 10, 128, 128, 126); g.addColorStop(0, 'rgba(18,15,12,.85)'); g.addColorStop(.45, 'rgba(35,30,25,.6)'); g.addColorStop(.7, 'rgba(120,110,95,.35)'); g.addColorStop(.85, 'rgba(40,35,30,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); };

// Ruinenmauer entlang x (axis 'x') oder z; Fenster als Bereiche [u0,u1] in Anteilen der Länge
function ruinWall(p, R, a, b, H, o = {}) {
  const alongX = a[1] === b[1], len = alongX ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1]), th = 9;
  const n = Math.max(3, Math.round(len / 15)), sl = len / n;
  const at = u => alongX ? [Math.min(a[0], b[0]) + u * len, a[1]] : [a[0], Math.min(a[1], b[1]) + u * len];
  const concrete = ['#9b9284', '#918879', '#a39a8a', '#8a8275'];
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n;
    let h = H;
    if (o.breakB && u > 1 - o.breakB) h *= Math.max(.12, (1 - (u - (1 - o.breakB)) / o.breakB) * (.7 + R() * .45));
    if (o.breakA && u < o.breakA) h *= Math.max(.12, (u / o.breakA) * (.7 + R() * .45));
    h = Math.max(8, h - (h > H * .9 ? R() * 5 : R() * 3));
    const [x, z] = at(u), w = alongX ? sl + .2 : th, d = alongX ? th : sl + .2, col = concrete[Math.floor(R() * 4)];
    const win = o.win?.some(([u0, u1]) => u > u0 && u < u1);
    // Mauerstücke stoßen kantig aneinander (wirkt als durchgehende Wand); Gesims-Bänder und Fensterrahmen als Deko
    const band = (y, hh, out) => B(p, alongX ? sl + .2 : th + out, hh, alongX ? th + out : sl + .2, '#7d7467', [x, y, z], undefined, { round: 0 });
    if (win) {
      solid(p, w, H * .3, d, col, x, 0, z, { round: 0 }); band(H * .3 + 1, 2, 4);
      if (h > H * .78) { solid(p, w, h - H * .7, d, col, x, H * .7, z, { round: 0 }); band(H * .7 - 1, 2, 3); }
    } else {
      solid(p, w, h, d, col, x, 0, z, { round: 0 });
      if (h > H * .34) band(H * .32, 3, 3);
      if (h > H * .8) band(H * .8, 2, 2);
    }
    if (h > H * .9 && !win) B(p, alongX ? sl + .2 : th + 3, 2.5, alongX ? th + 3 : sl + .2, '#6f675b', [x, h + 1, z], undefined, { round: 0 });
    // Bewehrungseisen an Bruchkanten
    if (h < H * .85 && R() < .55) for (let r = 0; r < 2; r++) {
      const ox = alongX ? (R() - .5) * sl : (R() - .5) * 4, oz = alongX ? (R() - .5) * 4 : (R() - .5) * sl;
      rod(p, [x + ox, h - 2, z + oz], [x + ox + (R() - .5) * 6, h + 5 + R() * 8, z + oz + (R() - .5) * 6], .7, '#5a4234');
    }
  }
  // Pfeiler und Gesims
  for (let u = 0; u <= 1.001; u += 1 / Math.max(1, Math.round(len / 90))) {
    const [x, z] = at(u), ph = (o.breakB && u > 1 - o.breakB) || (o.breakA && u < o.breakA) ? H * (.35 + R() * .3) : H + 4;
    solid(p, 15, ph, 15, '#857c6e', x, 0, z);
    B(p, 17, 3, 17, '#6f675b', [x, ph - 1.5, z], undefined, { round: .6 });
  }
  B(p, alongX ? len : th + 4, 5, alongX ? th + 4 : len, '#5f574c', [(a[0] + b[0]) / 2, 2.5, (a[1] + b[1]) / 2], undefined, { round: .8 });
}
function rubble(p, R, x, z, r, n = 26) {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g);
  gravel(g, R, r, 0, n, ['#8a8275', '#9b9284', '#6f685d', '#a39a8a', '#5d564d'], 3.2);
  for (let i = 0; i < 4; i++) B(g, 6 + R() * 10, 3 + R() * 4, 5 + R() * 8, '#8f877a', [(R() - .5) * r, 1.5, (R() - .5) * r], [R() * .4, R() * 3, R() * .4], { round: .6 });
}
function container(p, R, x, z, alongX, col) {
  const L = 152, Wd = 62, H = 64, w = alongX ? L : Wd, d = alongX ? Wd : L;
  solid(p, w, H, d, col, x, 0, z, { round: 1.2 });
  const ribs = Math.round(L / 11);
  for (let i = 0; i <= ribs; i++) {
    const t = -L / 2 + 4 + i * (L - 8) / ribs;
    for (const s of [-1, 1]) B(p, alongX ? 2.4 : 2, H - 8, alongX ? 2 : 2.4, col, alongX ? [x + t, H / 2, z + s * (Wd / 2 + .8)] : [x + s * (Wd / 2 + .8), H / 2, z + t], undefined, { round: .4 });
  }
  for (const s of [-1, 1]) {   // Türen an den Stirnseiten
    const ex = alongX ? x + s * (L / 2 + .6) : x, ez = alongX ? z : z + s * (L / 2 + .6);
    B(p, alongX ? 1.6 : Wd - 4, H - 6, alongX ? Wd - 4 : 1.6, '#3b3c3e', [ex, H / 2, ez], undefined, { round: .3, m: .4 });
    for (const o of [-10, 10]) rod(p, alongX ? [ex + s, 6, z + o] : [x + o, 6, ez + s], alongX ? [ex + s, H - 6, z + o] : [x + o, H - 6, ez + s], 1, '#77797c', { m: .6 });
  }
  B(p, w + 2, 3, d + 2, '#4a4b4e', [x, H + .5, z], undefined, { round: .8, m: .3 });
  B(p, alongX ? 30 : 16, .6, alongX ? 16 : 30, '#d8c25a', [x + (alongX ? 40 : 0), H + 2.2, z + (alongX ? 0 : 40)], undefined, { round: .2 });
}
function crate(p, R, x, y, z, s = 34) {
  solid(p, s, s, s, '#6d5a3e', x, y, z, { round: 1 });
  for (const [a, b] of [[1, 0], [0, 1]]) for (const k of [-1, 1]) {
    B(p, a ? s + .8 : 3, s + .8, a ? 3 : s + .8, '#4a3c2a', [x + (a ? 0 : k * (s / 2 - 1.2)), y + s / 2, z + (a ? k * (s / 2 - 1.2) : 0)], undefined, { round: .4 });
  }
  B(p, s * .5, .6, s * .3, '#c9b25a', [x, y + s + .2, z], undefined, { round: .2 });
}
function barrel(p, x, z, col) {
  C(p, 10, 10, 28, col, [x, 14, z], undefined, { seg: 18 });
  for (const y of [5, 14, 23]) C(p, 10.6, 10.6, 1.6, '#3d3e40', [x, y, z], undefined, { seg: 18, m: .5 });
  C(p, 8.5, 8.5, .6, '#2b2c2e', [x, 28.2, z], undefined, { seg: 18 });
  COLL.push({ min: [x - 10, 0, z - 10], max: [x + 10, 28, z + 10] });
}
function pipeline(p, x0, x1, z) {
  for (const dz of [-6, 7]) C(p, 6.5, 6.5, x1 - x0, '#6c6f72', [(x0 + x1) / 2, dz < 0 ? 24 : 18, z + dz], [0, 0, Math.PI / 2], { seg: 18, m: .5, r: .45 });
  for (let x = x0 + 12; x < x1; x += 52) {
    B(p, 6, 30, 30, '#4b4d50', [x, 15, z], undefined, { round: .6, m: .4 });
    for (const dz of [-6, 7]) C(p, 7.6, 7.6, 4, '#3b3d40', [x, dz < 0 ? 24 : 18, z + dz], [0, 0, Math.PI / 2], { seg: 18, m: .5 });
  }
  COLL.push({ min: [x0, 0, z - 14], max: [x1, 31, z + 14] });
}
// Statische Geometrie nach Material zusammenfassen (weniger Draw-Calls)
function mergeStatic(g) {
  g.updateMatrixWorld(true);
  const byMat = new Map(), keep = [];
  g.traverse(o => {
    if (!o.isMesh) return;
    if (Array.isArray(o.material) || o.material.transparent) { keep.push(o); return; }
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    geo.applyMatrix4(o.matrixWorld);
    (byMat.get(o.material) ?? byMat.set(o.material, []).get(o.material)).push(geo);
  });
  const out = new THREE.Group();
  for (const [mat, geos] of byMat) {
    const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = m.receiveShadow = true; out.add(m);
  }
  for (const o of keep) { o.updateMatrixWorld(true); const c = o.clone(); c.matrixAutoUpdate = false; c.matrix.copy(o.matrixWorld); out.add(c); }
  return out;
}
const objMarkers = [];
// Geländeaufstellungen (alle punktsymmetrisch, damit beide Seiten gleiche Chancen haben), jeweils auch an der Mittellinie
// gespiegelt spielbar. Gebaut wird eine Aufstellung erst, wenn sie zum ersten Mal gebraucht wird.
const at0 = (x, z) => [x, 0, z];
const TERRAINS = {
  ruinen: { name: 'Ruinenfeld', build(t, deco, R) {
    decal(deco, -2 * IN, 3.5 * IN, 2.6 * IN, crater); decal(deco, 2 * IN, -3.5 * IN, 2.6 * IN, crater);
    decal(deco, -15 * IN, -9 * IN, 1.8 * IN, crater, 1); decal(deco, 15 * IN, 9 * IN, 1.8 * IN, crater, 2);
    decal(deco, 8 * IN, 1 * IN, 1.4 * IN, crater); decal(deco, -8 * IN, -1 * IN, 1.4 * IN, crater);
    for (const s of [1, -1]) {
      const P = (x, z) => [s * x * IN, s * z * IN];
      // große Ruine in der Flanke
      ruinWall(t, R, P(-17, -3), P(-9, -3), 4.6 * IN, { breakB: .35, win: [[.18, .34], [.48, .62]] });
      ruinWall(t, R, P(-15, -3.4), P(-15, -9), 3.8 * IN, { breakB: .45, win: [[.3, .5]] });
      rubble(t, R, ...P(-10, -4.2), 22); rubble(t, R, ...P(-15.2, -9.6), 16, 16);
      B(t, 8 * IN, 1.2, 6 * IN, '#7c7469', [s * -13 * IN, .6, s * -6.2 * IN], undefined, { round: .6 });   // Bodenplatte
      // kurze Mauer nahe der Mitte
      ruinWall(t, R, P(-4, -1.2), P(-4, 3.4), 3 * IN, { breakA: .3, breakB: .3, win: [[.4, .6]] });
      rubble(t, R, ...P(-4.6, 3.9), 14, 14);
      // Container vor der eigenen Aufstellungszone
      container(t, R, s * 2 * IN, s * 6.6 * IN, true, s > 0 ? '#7e4a2a' : '#3e5c58');
      // Kistenstapel und Fässer
      crate(t, R, s * -9 * IN, 0, s * 5 * IN); crate(t, R, s * -9 * IN + s * 36, 0, s * 5 * IN + s * 4); crate(t, R, s * -9 * IN + s * 16, 34, s * 5 * IN + s * 2, 30);
      barrel(t, s * -6.4 * IN, s * 7.6 * IN, '#5a6b3c'); barrel(t, s * -5.6 * IN, s * 8.3 * IN, '#8a3a26'); barrel(t, s * 9.3 * IN, s * -3.2 * IN, '#5a6b3c');
      // Rohrleitung
      pipeline(t, s > 0 ? 10 * IN : -16.5 * IN, s > 0 ? 16.5 * IN : -10 * IN, s * 9.2 * IN);
    }
  } },
  // Versorgungsdepot: Container als lange Sichtsperren, dazwischen offene Gassen
  depot: { name: 'Depot', build(t, deco, R) {
    decal(deco, 0, 0, 2.2 * IN, crater); decal(deco, -14 * IN, 6 * IN, 1.6 * IN, crater, 1); decal(deco, 14 * IN, -6 * IN, 1.6 * IN, crater, 2);
    for (const s of [1, -1]) {
      const P = (x, z) => [s * x * IN, s * z * IN], col = s > 0 ? ['#7e4a2a', '#5b6b3a'] : ['#3e5c58', '#6d6a3a'];
      container(t, R, ...P(-6, -2.6), true, col[0]);                  // quer vor dem mittleren Ziel
      container(t, R, ...P(-16, 4.6), false, col[1]);                 // Flanke, längs
      container(t, R, ...P(7.5, 7.4), true, col[1]);                  // Deckung vor der Aufstellungszone
      pipeline(t, s > 0 ? 3.5 * IN : -12.5 * IN, s > 0 ? 12.5 * IN : -3.5 * IN, s * -4.8 * IN);
      crate(t, R, ...at0(...P(-9.5, 6.2))); crate(t, R, s * -9.5 * IN + s * 34, 0, s * 6.4 * IN); crate(t, R, s * -9.5 * IN + s * 17, 34, s * 6.3 * IN, 30);
      crate(t, R, ...at0(...P(4, 3.4)), 30);
      barrel(t, ...P(15.6, 0.8), '#8a3a26'); barrel(t, ...P(16.4, 1.6), '#5a6b3c'); barrel(t, ...P(-3, 8.4), '#5a6b3c');
      ruinWall(t, R, P(11, -9.5), P(16, -9.5), 3.2 * IN, { breakA: .4, win: [[.55, .75]] });
      rubble(t, R, ...P(10.4, -9), 14, 12);
    }
  } },
  // Trümmerstadt: viele Mauerzüge mit Fenstern – kurze Sichtlinien, Bewegung und Nahkampf zählen mehr
  stadt: { name: 'Trümmerstadt', build(t, deco, R) {
    decal(deco, -6 * IN, 0, 1.8 * IN, crater); decal(deco, 6 * IN, 0, 1.8 * IN, crater, 1);
    for (const s of [1, -1]) {
      const P = (x, z) => [s * x * IN, s * z * IN];
      ruinWall(t, R, P(-17.6, -1.5), P(-14.5, -1.5), 4.2 * IN, { breakB: .4, win: [[.3, .55]] });
      ruinWall(t, R, P(-8.5, -0.6), P(-8.5, 4.2), 4 * IN, { breakA: .35, win: [[.45, .7]] });
      ruinWall(t, R, P(-8.1, 4.6), P(-4.4, 4.6), 3.2 * IN, { breakB: .5 });
      ruinWall(t, R, P(1.5, -4.2), P(6.5, -4.2), 3.6 * IN, { breakA: .3, breakB: .3, win: [[.35, .5], [.6, .75]] });
      ruinWall(t, R, P(13.5, -5.5), P(13.5, -9.5), 4.4 * IN, { breakB: .4, win: [[.2, .45]] });
      ruinWall(t, R, P(14, -5.2), P(17.6, -5.2), 3.4 * IN, { breakA: .5 });
      rubble(t, R, ...P(-14, -2.4), 18); rubble(t, R, ...P(-9.4, 4.9), 14, 14); rubble(t, R, ...P(7, -3.4), 16, 14); rubble(t, R, ...P(12.8, -9.8), 14, 12);
      B(t, 6 * IN, 1.2, 5 * IN, '#7c7469', [s * 15.5 * IN, .6, s * -7.6 * IN], undefined, { round: .6 });
      crate(t, R, ...at0(...P(-1.5, 8))); crate(t, R, s * -1.5 * IN + s * 34, 0, s * 8.1 * IN);
      barrel(t, ...P(-12.5, 7.6), '#5a6b3c'); barrel(t, ...P(-11.8, 8.4), '#8a3a26');
      ruinWall(t, R, P(4, 7.4), P(9, 7.4), 3.8 * IN, { breakB: .3, win: [[.25, .45]] });
      ruinWall(t, R, P(9.4, 7.8), P(9.4, 10.4), 3.2 * IN, { breakB: .5 });
      ruinWall(t, R, P(-1.8, 2.3), P(1.8, 2.3), 2.2 * IN, { breakA: .25, breakB: .25 });
      rubble(t, R, ...P(3.6, 7.9), 12, 12);
    }
  } },
};
const LAYOUT = { id: null, mirror: false, built: {} };
function setLayout(id, mirror) {
  if (!TERRAINS[id]) id = 'ruinen';
  for (const L of Object.values(LAYOUT.built)) for (const g of L.groups) g.visible = false;
  const L = LAYOUT.built[id] ??= (() => {
    const R = rng(77), deco = new THREE.Group(), t = new THREE.Group(); COLL.length = 0;
    TERRAINS[id].build(t, deco, R);
    const merged = mergeStatic(t); scene.add(deco, merged);
    return { groups: [deco, merged], base: COLL.map(b => ({ min: [...b.min], max: [...b.max] })) };
  })();
  LAYOUT.id = id; LAYOUT.mirror = mirror; for (const g of L.groups) { g.visible = true; g.scale.x = mirror ? -1 : 1; }
  COLL.length = 0; for (const b of L.base) COLL.push(mirror ? { min: [-b.max[0], b.min[1], b.min[2]], max: [-b.min[0], b.max[1], b.max[2]] } : { min: [...b.min], max: [...b.max] });
  dirty = true;
}
function buildBoard() {
  // Tisch und Spielplatte
  const tableTex = canvasTex(512, 512, (x, w, h) => { const r = rng(3); x.fillStyle = '#2a211b'; x.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(${r() < .5 ? '0,0,0' : '90,70,55'},${.1 + r() * .2})`; x.lineWidth = 1 + r() * 3; const y = r() * h; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * .3, y + (r() - .5) * 20, w * .6, y + (r() - .5) * 20, w, y + (r() - .5) * 10); x.stroke(); } });
  tableTex.wrapS = tableTex.wrapT = THREE.RepeatWrapping; tableTex.repeat.set(4, 4);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(4200, 3200), new THREE.MeshStandardMaterial({ map: tableTex, roughness: .8, color: 0x8a8079 }));
  table.rotation.x = -Math.PI / 2; table.position.y = -20; table.receiveShadow = true; table.userData.noFx = true; scene.add(table);
  const gt = groundTexture();
  const top = new THREE.MeshStandardMaterial({ map: gt, bumpMap: gt, bumpScale: 1.2, roughness: .96 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x24211e, roughness: .7 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(BW, 20, BD), [edge, edge, top, edge, edge, edge]);
  board.position.y = -10; board.receiveShadow = true; board.userData.noFx = true; scene.add(board);
  for (const [w, d, x, z] of [[BW + 24, 12, 0, BD / 2 + 6], [BW + 24, 12, 0, -BD / 2 - 6], [12, BD, BW / 2 + 6, 0], [12, BD, -BW / 2 - 6, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, 24, d), new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: .55, metalness: .2 }));
    f.position.set(x, -8, z); f.castShadow = f.receiveShadow = true; f.userData.noFx = true; scene.add(f);
  }
  setLayout('ruinen', false);
  // Missionsziele: Datenrelais mit Leuchtkern
  OBJ.forEach((o, i) => {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); scene.add(g);
    C(g, 19, 21, 3, '#2c2d31', [0, 1.5, 0], undefined, { seg: 6, m: .5, r: .4 });
    C(g, 13, 15, 3, '#45474c', [0, 4, 0], undefined, { seg: 6, m: .6, r: .35 });
    const core = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xd9d2c0, emissiveIntensity: 1.2, roughness: .3 });
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 16, 6), core); c1.position.y = 13; c1.castShadow = true; g.add(c1);
    for (let k = 0; k < 3; k++) { const a = k * 2.094; rod(g, [Math.cos(a) * 11, 5, Math.sin(a) * 11], [Math.cos(a) * 5, 20, Math.sin(a) * 5], 1.1, '#5a5d63', { m: .6 }); }
    g.traverse(m => { if (m.isMesh) m.userData.noFx = false; });
    const ring = new THREE.Mesh(new THREE.RingGeometry(3 * IN - 1.6, 3 * IN, 96), new THREE.MeshBasicMaterial({ color: 0xd9d2c0, transparent: true, opacity: .45, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(o.x, .7, o.z); overlay.add(ring);
    const lab = document.createElement('div'); lab.className = 'ul'; lab.innerHTML = `<span class="nm" style="border-color:#d9d2c0">Ziel ${i + 1}</span>`; $('labels').append(lab);
    objMarkers.push({ core, ring, lab, owner: null });
  });
}

// ---------- Überlagerungen: Bewegungsfläche, Pfad, Ringe, Effekte ----------
const navCv = document.createElement('canvas'); navCv.width = NX; navCv.height = NZ;
const navTex = new THREE.CanvasTexture(navCv); navTex.magFilter = THREE.LinearFilter;
const navPlane = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshBasicMaterial({ map: navTex, transparent: true, depthWrite: false }));
navPlane.rotation.x = -Math.PI / 2; navPlane.position.y = .6; navPlane.visible = false; overlay.add(navPlane);
const pathLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, depthTest: false }));
pathLine.visible = false; overlay.add(pathLine);
const losLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 8, gapSize: 5, transparent: true, opacity: .95, depthTest: false }));
losLine.visible = false; overlay.add(losLine);
function showLos(a, b, cover) {
  losLine.geometry.setFromPoints([new THREE.Vector3(a.x, a.h * .85, a.z), new THREE.Vector3(b.x, b.h * .6, b.z)]); losLine.computeLineDistances();
  losLine.material.color.set(cover ? 0xffd04a : 0x7fe08a); losLine.visible = true;
}
const ringGeo = new THREE.RingGeometry(1, 1.12, 64); ringGeo.rotateX(-Math.PI / 2);
function ringMesh(col, op = .9) { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false })); m.position.y = .8; overlay.add(m); return m; }
const selRing = ringMesh(0xffffff); selRing.visible = false;
const rangeRing = new THREE.Mesh(new THREE.RingGeometry(.995, 1, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, depthWrite: false }));
rangeRing.geometry.rotateX(-Math.PI / 2); rangeRing.position.y = .9; rangeRing.visible = false; overlay.add(rangeRing);
const targetRings = [];
const glowTex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
const smokeTex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(200,200,200,.8)'); g.addColorStop(.6, 'rgba(150,150,150,.35)'); g.addColorStop(1, 'rgba(120,120,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
function sprite(tex, col, pos, size, additive = true) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  s.position.copy(pos); s.scale.setScalar(size); overlay.add(s); return s;
}
function flash(pos, col = 0xffc070, size = 30, dur = .35) {
  const s = sprite(glowTex, col, pos, size);
  tween(dur, t => { s.scale.setScalar(size * (.6 + t * .8)); s.material.opacity = 1 - t; }).then(() => { overlay.remove(s); s.material.dispose(); });
}
function smoke(pos, size = 26, dur = 1.6, col = 0x6a6660) {
  const s = sprite(smokeTex, col, pos, size, false), v = new THREE.Vector3((Math.random() - .5) * 10, 18 + Math.random() * 12, (Math.random() - .5) * 10), p0 = pos.clone();
  tween(dur, t => { s.position.copy(p0).addScaledVector(v, t); s.scale.setScalar(size * (1 + t * 1.6)); s.material.opacity = .75 * (1 - t); }).then(() => { overlay.remove(s); s.material.dispose(); });
}
const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true); beamGeo.translate(0, .5, 0); beamGeo.rotateX(Math.PI / 2);
function beam(a, b, col, width, dur) {
  const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.position.copy(a); m.lookAt(b); m.scale.set(width, width, a.distanceTo(b)); overlay.add(m);
  return tween(dur, t => { m.material.opacity = 1 - t; m.scale.x = m.scale.y = width * (1 - t * .6); }).then(() => { overlay.remove(m); m.material.dispose(); });
}
// Projektil von a nach b; Rückgabe: Promise beim Einschlag
function bolt(a, b, col, len, width, speed, arc = 0, trail = false) {
  const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const glow = sprite(glowTex, col, a, width * 14); overlay.add(m);
  const D = a.distanceTo(b), dur = D / speed, p = new THREE.Vector3(), q = new THREE.Vector3();
  let lastTrail = 0;
  return tween(dur, t => {
    const at = u => p.lerpVectors(a, b, u).setY(p.y + Math.sin(Math.PI * u) * arc);
    at(Math.max(0, t - len / D)); q.copy(p); at(t);
    m.position.copy(q); m.lookAt(p); m.scale.set(width, width, Math.max(1, q.distanceTo(p))); glow.position.copy(p);
    if (trail && t - lastTrail > .04) { lastTrail = t; smoke(p.clone(), 16, 1.1, 0x9a968e); }
  }).then(() => { overlay.remove(m); overlay.remove(glow); m.material.dispose(); glow.material.dispose(); });
}

// ---------- Spielzustand ----------
const G = { mode: 'ai', mission: 'vorherrschaft', diff: 'normal', terrain: 'zufall', owUsed: [false, false], follow: true, cp: [2, 2], phase: 'menu', units: [], round: 1, turn: 0, starter: 0, vp: [0, 0], act: null, busy: false, speed: 1, fx: true, sound: true,
  lists: [[], []], deployQ: [], firstBlood: false, view: 0 };
const isAI = s => G.mode === 'aivai' || (G.mode === 'ai' && s === 1);
// Online: NET.side ist die eigene Seite (0 = Gastgeber/orange, 1 = Gast/blau); die andere Seite steuert das Gegenüber
const NET = { side: 0, code: null, send: () => {}, q: [], ow: [], owRes: null, running: false, n: 0, chk: {}, closing: false };
const isRemote = s => G.mode === 'online' && s !== NET.side;
const notMine = s => isAI(s) || isRemote(s);
const living = s => G.units.filter(u => u.alive && u.placed && (s === undefined || u.side === s));
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const gapAt = (u, p, e) => (Math.hypot(p.x - e.x, p.z - e.z) - u.r - e.r) / IN;     // Abstand Base-Kante zu Base-Kante in Zoll
const gap = (a, b) => gapAt(a, a, b);
const engagedAt = (u, p) => living(1 - u.side).filter(e => gapAt(u, p, e) <= 1.01);
const nameOf = u => `<b style="color:${TEAMS[u.side].col}">${esc(u.T.short)}</b>`;
const plain = u => `${u.T.short} (${TEAMS[u.side].name})`;
let uid = 0;

const POOL = {};
function makeUnit(type, side) {
  const T = UT[type];
  let pd = POOL[type]?.pop();
  if (!pd) {
    const g = T.build(), holder = new THREE.Group(); holder.add(g);
    const bb = new THREE.Box3().setFromObject(g.getObjectByName('base')), r = (bb.max.x - bb.min.x) / 2;
    const h = new THREE.Box3().setFromObject(g).max.y;
    const ring = new THREE.Mesh(new THREE.RingGeometry(r + .8, r + 3.2, 64), new THREE.MeshBasicMaterial({ color: TEAMS[side].col }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .35; ring.userData.noFx = true; holder.add(ring);
    pd = { g, holder, r, h, ring };
  }
  pd.g.userData.rig?.reset(); pd.ring.material.color.set(TEAMS[side].col); pd.ring.visible = true;
  pd.holder.visible = false; pd.holder.rotation.set(0, 0, 0); scene.add(pd.holder);
  const lab = document.createElement('div'); lab.className = 'ul'; $('labels').append(lab);
  const u = { id: uid++, type, T, side, ...pd, rig: pd.g.userData.rig, w: T.W, alive: true, placed: false, done: false, marked: false, x: 0, z: 0, lab, action: null, stats: { dmg: 0, kills: 0 } };
  pd.holder.userData.unit = u;
  return u;
}
// Spielfeld leeren (neues Spiel ohne Neuladen, z. B. für Simulationen)
function clearUnits() {
  for (const u of G.units) { scene.remove(u.holder); u.lab.remove(); stopClip(u); u.rig?.reset(); (POOL[u.type] ??= []).push({ g: u.g, holder: u.holder, r: u.r, h: u.h, ring: u.ring }); }
  G.units = []; G.deployQ = []; G.act = null; clearSel();
  G.vp = [0, 0]; G.cp = null; G.round = 1;
  objMarkers.forEach(o => { o.owner = null; o.oc = [0, 0]; const c = new THREE.Color('#d9d2c0'); o.core.emissive.copy(c); o.ring.material.color.copy(c); o.ring.material.opacity = .4; o.lab.querySelector('.nm').style.borderColor = '#d9d2c0'; });
  updateHud();
}
function setPos(u, x, z) { u.x = x; u.z = z; u.holder.position.set(x, 0, z); dirty = true; }
function playClip(u, name, scale = 1) {
  if (!u.rig) return;
  u.rig.reset(); const c = u.rig.clips.find(c => c.name === name);
  if (!c) return;
  u.action = u.rig.mixer.clipAction(c); u.action.reset(); u.action.timeScale = scale; u.action.play(); u.playing = true;
}
function stopClip(u) { if (u.rig && u.playing) { u.rig.reset(); u.playing = false; dirty = true; } }

// ---------- Sichtlinie und Wegfindung ----------
function segBox(a, b, bx) {
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 3; i++) {
    const d = b[i] - a[i];
    if (Math.abs(d) < 1e-9) { if (a[i] < bx.min[i] || a[i] > bx.max[i]) return false; continue; }
    let ta = (bx.min[i] - a[i]) / d, tb = (bx.max[i] - a[i]) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) return false;
  }
  return true;
}
const clearLine = (a, b) => !COLL.some(bx => segBox(a, b, bx));
// Sicht von Einheit att (an Position ap) auf def (an dp): sichtbar, wenn einer von 4 Punkten frei ist; Deckung, wenn nicht alle frei sind
function sight(att, def, ap = att, dp = def) {
  const eye = [ap.x, att.h * .85, ap.z], dx = dp.x - ap.x, dz = dp.z - ap.z, l = Math.hypot(dx, dz) || 1, px = -dz / l * def.r * .55, pz = dx / l * def.r * .55;
  const pts = [[dp.x, def.h * .9, dp.z], [dp.x, def.h * .55, dp.z], [dp.x + px, def.h * .45, dp.z + pz], [dp.x - px, def.h * .45, dp.z - pz]];
  let n = 0; for (const p of pts) if (clearLine(eye, p)) n++;
  return { vis: n > 0, cover: n > 0 && n < 4 };
}
function inTerrain(x, z, r) {
  for (const b of COLL) if (x > b.min[0] - r && x < b.max[0] + r && z > b.min[2] - r && z < b.max[2] + r) return b;
  return null;
}
function freeSpot(u, x, z) {
  if (Math.abs(x) > BW / 2 - u.r || Math.abs(z) > BD / 2 - u.r || inTerrain(x, z, u.r)) return false;
  return !G.units.some(o => o !== u && o.alive && o.placed && Math.hypot(x - o.x, z - o.z) < u.r + o.r + .5);
}
// Dijkstra auf einem 0,5"-Raster. Bodeneinheiten umgehen Gelände und Gegner; Flieger ignorieren beides unterwegs.
function navigate(u, maxIn) {
  const N = NX * NZ, pass = new Uint8Array(N), end = new Uint8Array(N), fly = !!u.T.fly;
  for (let m = 0; m < NZ; m++) for (let k = 0; k < NX; k++) {
    const x = cx(k), z = cz(m), id = m * NX + k;
    if (Math.abs(x) > BW / 2 - u.r || Math.abs(z) > BD / 2 - u.r) continue;
    const ter = !!inTerrain(x, z, u.r);
    let enemy = false, any = false;
    for (const o of G.units) if (o !== u && o.alive && o.placed && Math.hypot(x - o.x, z - o.z) < u.r + o.r + .5) { any = true; if (o.side !== u.side) enemy = true; }
    pass[id] = fly || (!ter && !enemy) ? 1 : 0;
    end[id] = !ter && !any ? 1 : 0;
  }
  const [sk, sm] = cellOf(u.x, u.z), start = Math.max(0, Math.min(N - 1, sm * NX + sk));
  pass[start] = 1;
  const dist = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), lim = maxIn * IN;
  dist[start] = 0;
  const heap = [start], push = i => { heap.push(i); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (dist[heap[p]] <= dist[heap[c]]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let s = c; if (l < heap.length && dist[heap[l]] < dist[heap[s]]) s = l; if (r < heap.length && dist[heap[r]] < dist[heap[s]]) s = r; if (s === c) break; [heap[s], heap[c]] = [heap[c], heap[s]]; c = s; } } return top; };
  const D2 = CELL * Math.SQRT2;
  while (heap.length) {
    const i = pop(), k = i % NX, m = (i - k) / NX, di = dist[i];
    for (let dk = -1; dk <= 1; dk++) for (let dm = -1; dm <= 1; dm++) {
      if (!dk && !dm) continue;
      const nk = k + dk, nm = m + dm; if (nk < 0 || nm < 0 || nk >= NX || nm >= NZ) continue;
      const j = nm * NX + nk; if (!pass[j]) continue;
      if (dk && dm && (!pass[m * NX + nk] || !pass[nm * NX + k])) continue;
      const nd = di + (dk && dm ? D2 : CELL);
      if (nd <= lim && nd < dist[j]) { dist[j] = nd; prev[j] = i; push(j); }
    }
  }
  // Exakte Startposition: Endpunkte, die gerade erreichbar sind, nach echter Weglänge filtern
  const ok = j => end[j] && dist[j] <= lim && j !== start;
  return { dist, prev, pass, end, start, ok, lim, fly };
}
function pathTo(u, nav, j) {
  const cells = []; for (let c = j; c !== -1; c = nav.prev[c]) cells.push(c);
  cells.reverse();
  const pts = cells.map(c => ({ x: cx(c % NX), z: cz((c - c % NX) / NX) })); pts[0] = { x: u.x, z: u.z };
  // Pfad glätten: Zwischenpunkte überspringen, wenn die Gerade frei ist
  const freeSeg = (a, b) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (CELL / 3)); for (let i = 1; i < n; i++) { const [k, m] = cellOf(a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n); if (!nav.pass[m * NX + k]) return false; } return true; };
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1) { let k = pts.length - 1; while (k > i + 1 && !freeSeg(pts[i], pts[k])) k--; out.push(pts[k]); i = k; }
  return out;
}
// Fläche in 4 Pixeln pro Rasterzelle zeichnen, mit hellerem Rand
const NS = 4; navCv.width = NX * NS; navCv.height = NZ * NS;
navTex.minFilter = THREE.LinearFilter; navTex.generateMipmaps = false;
function drawNav(nav, col) {
  const x = navCv.getContext('2d'), c = new THREE.Color(col), rgb = `${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0}`;
  x.clearRect(0, 0, navCv.width, navCv.height);
  if (nav) {
    x.fillStyle = `rgba(${rgb},.42)`;
    for (let i = 0; i < NX * NZ; i++) if (nav.ok(i)) x.fillRect((i % NX) * NS, Math.floor(i / NX) * NS, NS, NS);
    x.fillStyle = `rgba(${rgb},.95)`;
    for (let i = 0; i < NX * NZ; i++) {
      if (!nav.ok(i)) continue; const k = i % NX, m = Math.floor(i / NX);
      if (k === 0 || !nav.ok(i - 1)) x.fillRect(k * NS, m * NS, 1, NS);
      if (k === NX - 1 || !nav.ok(i + 1)) x.fillRect(k * NS + NS - 1, m * NS, 1, NS);
      if (m === 0 || !nav.ok(i - NX)) x.fillRect(k * NS, m * NS, NS, 1);
      if (m === NZ - 1 || !nav.ok(i + NX)) x.fillRect(k * NS, m * NS + NS - 1, NS, 1);
    }
  }
  navTex.needsUpdate = true; navPlane.visible = !!nav; dirty = true;
}
function drawZone(side) {
  const x = navCv.getContext('2d'), c = new THREE.Color(TEAMS[side].col), rgb = `${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0}`, h = ZONE * 2 * NS, y = side === 0 ? navCv.height - h : 0;
  x.clearRect(0, 0, navCv.width, navCv.height);
  x.fillStyle = `rgba(${rgb},.38)`; x.fillRect(0, y, navCv.width, h);
  x.fillStyle = `rgba(${rgb},.95)`; x.fillRect(0, side === 0 ? y : y + h - 2, navCv.width, 2);
  navTex.needsUpdate = true; navPlane.visible = true; dirty = true;
}

// ---------- Würfelmechanik ----------
function woundNeed(S, T) { return S >= 2 * T ? 2 : S > T ? 3 : S === T ? 4 : 2 * S <= T ? 6 : 5; }
function ctxOf(att, def, kind, ap = att, dp = def, moved = !!G.act?.moved) {
  const s = kind === 'shoot' ? sight(att, def, ap, dp) : { vis: true, cover: false };
  const a = G.act, own = a && a.u === att;
  return { kind, moved, d: gapAt(att, ap, { x: dp.x, z: dp.z, r: def.r }), vis: s.vis, cover: s.cover,
    reroll: own && a.strat === 'reroll', apBonus: own && a.strat === 'ap' ? 1 : 0 };
}
function hitNeed(att, def, w, c) {
  if (c.overwatch) return { need: 6, why: ['Abwehrfeuer: nur 6en'] };
  let mod = 0; const why = [];
  if (c.kind === 'shoot') {
    if (def.marked) { mod++; why.push('Markiert +1'); }
    if (att.T.steady && !c.moved) { mod++; why.push(att.type === 'broadside' ? 'Stabilisiert +1' : 'Im Anschlag +1'); }
    if (def.T.cloak && c.d > 12) { mod--; why.push('Tarnfeld −1'); }
  } else if (c.retaliation && def.T.beast) { mod--; why.push('Fauchen −1'); }
  mod = Math.max(-1, Math.min(1, mod));
  return { need: Math.max(2, Math.min(6, w.BS - mod)), why };
}
function saveNeed(def, w, c) {
  const cover = c.kind === 'shoot' && (c.cover || def.T.scout) && !w.noCover && !def.marked && !(def.T.Sv <= 3 && w.AP + (c.apBonus ?? 0) === 0);
  const arm = def.T.Sv + w.AP + (c.apBonus ?? 0) - (cover ? 1 : 0), inv = def.T.inv ?? 7;
  return { need: Math.min(arm, inv), cover, inv: inv < arm };
}
const attacksOf = (w, c) => w.A + (w.rapid && c.kind === 'shoot' && c.d <= w.r / 2 ? w.rapid : 0);
const pr = n => n > 6 ? 0 : (7 - n) / 6;
function expect(att, def, w, c) {
  let h = pr(hitNeed(att, def, w, c).need); if (c.reroll) h += (1 - h) * h;
  const wn = pr(woundNeed(w.S, def.T.T)), sv = saveNeed(def, w, c).need;
  return Math.min(def.w, attacksOf(w, c) * h * wn * (1 - pr(sv)) * Math.min(dAvg(w.D), def.w));
}
const gunsInRange = (att, c) => att.T.guns.filter(w => c.d <= w.r);
function resolve(att, def, w, c) {
  const roll = n => Array.from({ length: n }, d6);
  const hn = hitNeed(att, def, w, c), A = attacksOf(w, c);
  let rer = 0; const hits = roll(A).map(v => v >= hn.need || !c.reroll ? v : (rer++, d6())), nh = hits.filter(v => v >= hn.need).length;
  const wn = woundNeed(w.S, def.T.T), wounds = roll(nh), nw = wounds.filter(v => v >= wn).length;
  const sv = saveNeed(def, w, c), saves = sv.need <= 6 ? roll(nw) : [], nu = sv.need <= 6 ? saves.filter(v => v < sv.need).length : nw;
  const dmg = Array.from({ length: nu }, () => dRoll(w.D));
  return { w, A, hn, hits, nh, wn, wounds, nw, sv, saves, nu, dmg, rer, apBonus: c.apBonus };
}

// ---------- Würfel-Anzeige ----------
async function showDice(att, def, res, kind) {
  if (G.instant) return;
  const el = $('dice'), sp = 1 / G.speed;
  el.innerHTML = `<div class="head">${nameOf(att)} → ${nameOf(def)} · <b>${esc(res.w.n)}</b> <span style="color:var(--mut)">${kind === 'fight' ? 'Nahkampf' : `${fmt(res.ctxD ?? 0)}"`}</span><span class="skip" title="Animationen dieser Aktivierung überspringen">⏭ Leertaste</span></div>`;
  el.style.display = 'block';
  const row = async (label, vals, cls, sum) => {
    const r = document.createElement('div'); r.className = 'drow';
    r.innerHTML = `<span class="dl">${label}</span><span class="dd"></span><span class="dr"></span>`; el.append(r);
    const dd = r.querySelector('.dd'), dice = vals.map(() => { const d = document.createElement('span'); d.className = 'die roll'; d.textContent = vd6(); dd.append(d); return d; });
    if (!vals.length) dd.innerHTML = '<span style="color:var(--mut);font-size:12px">–</span>';
    const t0 = performance.now();
    await tween(.3 * sp, () => { if (performance.now() - t0 > 40) dice.forEach(d => d.textContent = vd6()); });
    dice.forEach((d, i) => { d.className = 'die ' + cls(vals[i]); d.textContent = vals[i]; });
    r.querySelector('.dr').innerHTML = sum; await wait(.16 * sp);
  };
  const why = [...res.hn.why, ...(res.rer ? [`${res.rer} wiederholt`] : [])];
  await row(`Treffer ${res.hn.need}+${why.length ? `<br><small>${why.join(', ')}</small>` : ''}`, res.hits, v => v >= res.hn.need ? 'yes' : 'no', `${res.nh} Treffer`);
  if (!res.nh) return;
  await row(`Verwunden ${res.wn}+ <small>(S${res.w.S} gg. W${def.T.T})</small>`, res.wounds, v => v >= res.wn ? 'yes' : 'no', `${res.nw} Wunden`);
  if (!res.nw) return;
  if (res.sv.need <= 6) await row(`Rettung ${res.sv.need}+${res.sv.cover ? ' <small>Deckung</small>' : ''}${res.sv.inv ? ' <small>Rettungswurf</small>' : ''}${res.apBonus ? ' <small>Überladung</small>' : ''}`, res.saves, v => v >= res.sv.need ? 'sv' : 'no', `${res.nw - res.nu} gehalten`);
  else await row('Rettung <small>(keine)</small>', [], () => '', 'durchschlagen');
  if (res.nu) await row('Schaden', res.dmg, () => 'dmg', `${res.dmg.reduce((a, b) => a + b, 0)} Schaden`);
}
function floatText(u, txt, cls = '') {
  if (G.instant) return;
  const p = new THREE.Vector3(u.x, u.h + 12, u.z).project(camera), r = renderer.domElement.getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'float ' + cls; d.textContent = txt;
  d.style.left = (r.left + (p.x + 1) / 2 * r.width) + 'px'; d.style.top = (r.top + (1 - p.y) / 2 * r.height) + 'px';
  document.body.append(d); setTimeout(() => d.remove(), 1500);
}

// ---------- Aktionen ----------
async function turnTo(u, x, z, dur = .3) {
  const a0 = u.holder.rotation.y, a1 = Math.atan2(x - u.x, z - u.z);
  await tween(dur / G.speed, t => { u.holder.rotation.y = lerpAng(a0, a1, t * t * (3 - 2 * t)); });
}
async function moveAlong(u, pts) {
  const segs = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); segs.push(l); total += l; }
  if (total < 1) return;
  // Flieger über Gelände: Sprung mit Düsen; die Katze fliegt immer
  let over = 0;
  if (u.T.fly) for (let i = 1; i < pts.length; i++) for (let s = 0; s <= 20; s++) {
    const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * s / 20, z = pts[i - 1].z + (pts[i].z - pts[i - 1].z) * s / 20, b = inTerrain(x, z, u.r * .7);
    if (b) over = Math.max(over, b.max[1]);
    for (const o of G.units) if (o !== u && o.alive && o.placed && Math.hypot(x - o.x, z - o.z) < u.r + o.r) over = Math.max(over, o.h * .7);
  }
  const wings = u.T.fly === 'wings', jump = u.T.fly && (wings || over > 0), H = wings ? Math.max(28, over + 12) : over + 14;
  const speed = (jump ? 230 : 150) * G.speed, dur = total / speed;
  if (!jump || wings) playClip(u, 'Gehen', wings ? 1.4 : 2.2 * G.speed);
  if (jump && !wings) snd('jet');
  let ang = u.holder.rotation.y, lastPuff = 0;
  await tween(dur, t => {
    let d = t * total, i = 0; while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
    const a = pts[i], b = pts[i + 1], f = segs[i] ? Math.min(1, d / segs[i]) : 1;
    const x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f;
    ang = lerpAng(ang, Math.atan2(b.x - a.x, b.z - a.z), .25); u.holder.rotation.y = ang;
    u.x = x; u.z = z; u.holder.position.set(x, jump ? H * Math.sin(Math.PI * t) : 0, z);
    if (jump && !wings && t - lastPuff > .05 && t < .9) { lastPuff = t; flash(new THREE.Vector3(x, u.holder.position.y + 6, z), 0x7fc8ff, 16, .25); smoke(new THREE.Vector3(x, u.holder.position.y, z), 14, .8); }
  });
  stopClip(u); setPos(u, pts.at(-1).x, pts.at(-1).z);
}
// Mündungspunkt grob: vor der Brust der Figur
function muzzle(u, toward) {
  const d = new THREE.Vector3(toward.x - u.x, 0, toward.z - u.z).normalize();
  return new THREE.Vector3(u.x, u.h * .62, u.z).addScaledVector(d, u.r * .55);
}
async function shotFx(att, def, res) {
  const kind = res.w.fx, from = muzzle(att, def), shots = [];
  const hitOk = res.hits.map(v => v >= res.hn.need);
  const target = hit => {
    const a = Math.random() * 6.28, r = hit ? def.r * .35 * Math.random() : def.r * (1.1 + Math.random() * 1.2);
    return new THREE.Vector3(def.x + Math.cos(a) * r, def.h * (hit ? .3 + Math.random() * .5 : .2 + Math.random() * .9), def.z + Math.sin(a) * r);
  };
  for (let i = 0; i < hitOk.length; i++) {
    const to = target(hitOk[i]), gapT = { pulse: .12, burst: .07, plasma: .2, rail: .3, missile: .18 }[kind] ?? .15;
    shots.push(wait(i * gapT / G.speed).then(async () => {
      snd(kind, .9);
      flash(from, { pulse: 0x9fd8ff, burst: 0x9fd8ff, plasma: 0x7fb0ff, rail: 0xbff4ff, missile: 0xffb060 }[kind] ?? 0xffffff, 26, .18);
      if (kind === 'rail') { beam(from, to, 0xffffff, 1.4, .5 / G.speed); await beam(from, to, 0x6fe0ff, 4.5, .7 / G.speed); }
      else if (kind === 'missile') await bolt(from, to, 0xffb36b, 14, 2.6, 380 * G.speed, 50 + Math.random() * 40, true);
      else if (kind === 'plasma') await bolt(from, to, 0x88b8ff, 26, 4.5, 600 * G.speed);
      else await bolt(from, to, 0x9fdcff, 40, 2, 850 * G.speed);
      if (hitOk[i]) { flash(to, kind === 'missile' ? 0xff9a40 : 0xd8f0ff, kind === 'missile' ? 80 : kind === 'rail' ? 60 : 42, .45); snd(kind === 'missile' ? 'boom' : 'hit', kind === 'missile' ? .5 : .8); if (kind === 'missile' || kind === 'rail') smoke(to, 34, 1.4); }
      else { flash(to, 0xffffff, 16, .22); smoke(new THREE.Vector3(to.x, 2, to.z), 14, .8, 0x8a8478); }
    }));
  }
  await Promise.all(shots);
}
async function meleeFx(att, def, res) {
  const n = res.hits.length;
  if (att.T.beast) snd('hiss');
  for (let i = 0; i < n; i++) {
    await wait(.14 / G.speed); snd('claw');
    if (res.hits[i] >= res.hn.need) flash(new THREE.Vector3(def.x + (Math.random() - .5) * def.r, def.h * (.3 + Math.random() * .5), def.z + (Math.random() - .5) * def.r), 0xffe0b0, 36, .3);
  }
}
async function attack(att, def, kind, retaliation = false, ow = false) {
  G.busy = true; if (!retaliation && !ow && G.act) G.act.attacked = true;
  if (!retaliation) follow((att.x + def.x) / 2, (att.z + def.z) / 2);
  await turnTo(att, def.x, def.z);
  const c = ctxOf(att, def, kind, att, def, retaliation || ow ? false : !!G.act?.moved); c.retaliation = retaliation; c.overwatch = ow;
  const ws = kind === 'shoot' ? gunsInRange(att, c) : [att.T.melee];
  if (kind === 'fight' && !retaliation) { const lunge = new THREE.Vector3(def.x - att.x, 0, def.z - att.z).normalize().multiplyScalar(Math.max(0, gap(att, def) * IN - 1)); att.holder.position.add(lunge); dirty = true; }
  for (const w of ws) {
    if (!def.alive) break;
    const res = resolve(att, def, w, c); res.ctxD = c.d;
    playClip(att, 'Schiessen', G.speed);
    await Promise.all([showDice(att, def, res, kind), kind === 'shoot' ? shotFx(att, def, res) : meleeFx(att, def, res)]);
    stopClip(att);
    const total = res.dmg.reduce((a, b) => a + b, 0), lost = Math.min(def.w, total);
    log(`${nameOf(att)} ${retaliation ? 'schlägt zurück' : kind === 'shoot' ? 'schießt' : 'greift an'} (${esc(w.n)}): ${res.nh}/${res.A} Treffer, ${res.nw} Wunden, ${res.nu} nicht gerettet${lost ? ` → <b>${lost} Schaden</b> an ${nameOf(def)}` : ''}.`);
    if (lost) { def.w -= lost; att.stats.dmg += lost; floatText(def, '−' + lost); updateLabel(def); }
    else if (res.nw) floatText(def, 'gehalten', 'sv');
    else floatText(def, 'verfehlt', 'sv');
    await wait(.4 / G.speed);
    if (def.w <= 0) await kill(def, att);
  }
  if (kind === 'fight' && !retaliation) setPos(att, att.x, att.z);
  $('dice').style.display = 'none';
  if (kind === 'fight' && !retaliation && def.alive && att.alive) { await wait(.2); await attack(def, att, 'fight', true); }
  G.busy = false;
}
async function kill(u, by) {
  u.alive = false; u.lab.remove(); stopClip(u); if (by) by.stats.kills++;
  const kv = killValue(u); G.vp[1 - u.side] += kv;
  log(`☠ ${nameOf(u)} ist vernichtet. ${TEAMS[1 - u.side].name} +${kv} Siegpunkt${kv > 1 ? 'e' : ''}${!G.firstBlood ? ' (Erstes Blut +1)' : ''}.`);
  if (!G.firstBlood) { G.firstBlood = true; G.vp[1 - u.side] += 1; }
  snd('boom'); const p = new THREE.Vector3(u.x, u.h * .5, u.z);
  for (let i = 0; i < 6; i++) setTimeout(() => { flash(p.clone().add(new THREE.Vector3((Math.random() - .5) * u.r, (Math.random() - .3) * u.h * .5, (Math.random() - .5) * u.r)), 0xffa040, 70 + Math.random() * 50, .6); smoke(p.clone(), 45, 2.6, 0x3a3836); }, i * 110);
  const root = u.rig?.j.root;
  if (root) { const fall = Math.random() < .5 ? -1 : 1; await tween(.9 / G.speed, t => { const e = t * t; root.rotation.x = -1.35 * e; root.rotation.z = .25 * fall * e; root.position.y = 4 * e; }); }
  u.ring.visible = false;
  updateHud();
}

// ---------- Ablauf ----------
function log(html, cls = '') { if (G.trace) G.trace.push(html.replace(/<[^>]+>/g, '')); if (G.instant) return; const p = document.createElement('p'); p.innerHTML = html; if (cls) p.className = cls; $('log').append(p); $('log').scrollTop = 1e9; }
function banner(txt, col = '#ece8df') { if (G.instant) return; const b = $('banner'); b.textContent = txt; b.style.color = col; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
const MISSIONS = {
  vorherrschaft: { name: 'Vorherrschaft', text: 'Jedes gehaltene Missionsziel bringt am Rundenende 2 Punkte. Abschüsse 1 Punkt.' },
  kopfgeld: { name: 'Kopfgeld', text: 'Missionsziele 1 Punkt pro Runde. Abschüsse bringen Punkte nach Wert der Einheit (1 Punkt je angefangene 15 Punkte).' },
  durchbruch: { name: 'Durchbruch', text: 'Das mittlere Ziel zählt doppelt. Ab Runde 3 bringt jede eigene Einheit in der gegnerischen Aufstellungszone 1 Punkt.' },
};
const killValue = u => G.mission === 'kopfgeld' ? Math.ceil(u.T.pts / 15) : 1;
const objValue = i => G.mission === 'vorherrschaft' ? 2 : G.mission === 'durchbruch' && i === 1 ? 2 : 1;
function startGame() {
  let r0, r1; do { r0 = d6(); r1 = d6(); } while (r0 === r1);
  G.phase = 'play'; G.round = 1; G.starter = r0 > r1 ? 0 : 1; G.turn = G.starter; G.owUsed = [false, false]; G.vp = [0, 0]; G.cp = [2, G.mode === 'ai' && G.diff === 'schwer' ? 3 : 2]; G.firstBlood = false;
  controls.autoRotate = false;
  navPlane.visible = false; log('Runde 1', 'r'); log(`Initiative: ${TEAMS[0].name} W6 = ${r0}, ${TEAMS[1].name} W6 = ${r1} → <b>${TEAMS[G.starter].name}</b> ${TEAMS[G.starter].name === 'Du' ? 'beginnst' : 'beginnt'}.`); banner(`Runde 1 · ${TEAMS[G.starter].name} ${TEAMS[G.starter].name === 'Du' ? 'beginnst' : 'beginnt'}`); snd('round');
  updateObjectives(); beginTurn();
}
function beginTurn() {
  G.skip = false; G.act = null; clearSel(); setTimeout(() => { G.lastTurn = G.turn; }, 0);
  if (checkEnd()) return;
  updateHud();
  if (isAI(G.turn)) aiTurn();
  else if (isRemote(G.turn)) setHint(`<b style="color:${TEAMS[G.turn].col}">Der Gegner</b> ist am Zug …`);
  else if (G.mode === 'online') { if (G.lastTurn !== G.turn) banner('Du bist dran', TEAMS[G.turn].col); setHint(`Wähle eine deiner Einheiten (${G.turn ? 'blauer' : 'orangefarbener'} Ring), um sie zu aktivieren.`); }
  else if (G.mode === 'hot') { const c = TEAMS[G.turn]; if (G.lastTurn !== G.turn) banner(`${c.name} ist dran`, c.col); setHint(`<b style="color:${c.col}">${c.name}</b>: Wähle eine eigene Einheit zum Aktivieren.`); }
  else setHint('Wähle eine deiner Einheiten (orangefarbener Ring), um sie zu aktivieren.');
}
function endActivation() {
  if (G.mode === 'online') netCheck();
  const u = G.act?.u; if (u) { u.done = true; updateLabel(u); if (G.act.strat && !G.act.attacked) G.cp[u.side] += 1; }
  G.act = null; clearSel(); updateObjectives();
  if (checkEnd()) return;
  const other = 1 - G.turn;
  if (living(other).some(e => !e.done)) G.turn = other;
  else if (!living(G.turn).some(e => !e.done)) { endRound(); return; }
  beginTurn();
}
function endRound() {
  const got = [0, 0];
  objMarkers.forEach((o, i) => { if (o.owner !== null) { G.vp[o.owner] += objValue(i); got[o.owner] += objValue(i); } });
  if (G.mission === 'durchbruch' && G.round >= 3) for (const u of living()) if (inZone(1 - u.side, u.z)) { G.vp[u.side]++; got[u.side]++; }
  log(`Wertung am Rundenende: ${TEAMS[0].name} +${got[0]}, ${TEAMS[1].name} +${got[1]}.`);
  if (!G.instant) toast(`Runde ${G.round}: ${TEAMS[0].name} +${got[0]} · ${TEAMS[1].name} +${got[1]}`);
  G.cp = G.cp.map(v => Math.min(6, v + 1));
  if (G.round >= ROUNDS) { finish(); return; }
  G.round++; G.starter = 1 - G.starter; G.turn = G.starter;
  for (const u of G.units) { u.done = false; u.marked = false; u.sprintRoll = null; if (u.alive) updateLabel(u); }
  G.owUsed = [false, false];
  log(`Runde ${G.round}`, 'r'); banner(`Runde ${G.round}`); snd('round');
  beginTurn();
}
function checkEnd() {
  if (G.phase !== 'play') return true;
  if (!living(0).length || !living(1).length) { finish(); return true; }
  return false;
}
function finish() {
  G.phase = 'end'; updateHud(); setHint(''); $('acts').innerHTML = '';
  const [a, b] = G.vp, wiped = !living(0).length ? 1 : !living(1).length ? 0 : null;
  const win = wiped ?? (a > b ? 0 : b > a ? 1 : null);
  G.result = { win, vp: [...G.vp], round: G.round, wiped };
  if (G.instant) return;
  const all = G.units.filter(u => u.placed), mvp = all.reduce((m, u) => (u.stats.dmg + u.stats.kills * 3 > (m ? m.stats.dmg + m.stats.kills * 3 : -1) ? u : m), null);
  const statRows = s => all.filter(u => u.side === s).map(u => `<tr${u === mvp ? ' class="mvp"' : ''}><td>${PORTRAIT[u.type] ? `<img src="${PORTRAIT[u.type]}" alt="">` : ''}</td><td>${esc(u.T.short)}${u === mvp ? ' <span class="tag">Bester Kämpfer</span>' : ''}</td><td>${u.stats.dmg}</td><td>${u.stats.kills}</td><td>${u.alive ? `${u.w}/${u.T.W} LP` : '<span style="color:var(--bad)">vernichtet</span>'}</td></tr>`).join('');
  const stats = [0, 1].map(s => `<div class="statcol"><h3><i class="dot" style="background:${TEAMS[s].col}"></i>${TEAMS[s].name} · ${G.vp[s]} Punkte</h3><table class="stat"><tr><th></th><th>Einheit</th><th>Schaden</th><th>Abschüsse</th><th>Zustand</th></tr>${statRows(s)}</table></div>`).join('');
  const t = win === null ? 'Unentschieden' : (G.mode === 'ai' || G.mode === 'online' ? (win === (G.mode === 'ai' ? 0 : NET.side) ? 'Sieg!' : 'Niederlage') : `${TEAMS[win].name} gewinnt`);
  banner(t, win === null ? '#ece8df' : TEAMS[win].col); snd('round');
  setTimeout(() => modal(`<h1>${t}</h1><p class="lead">${wiped !== null ? 'Eine Armee wurde vollständig vernichtet.' : `Nach ${ROUNDS} Runden.`}</p>
    <p class="lead">Mission: ${MISSIONS[G.mission].name}</p><div class="stats2">${stats}</div>
    <div class="row" style="justify-content:center"><button class="btn pri" id="rematch">Revanche (gleiche Armeen)</button><button class="btn" id="again">Neues Spiel</button><button class="btn" id="look">Schlachtfeld ansehen</button></div>`, d => {
    d.querySelector('#rematch').onclick = () => {
      if (G.mode === 'online') { if (NET.side === 0) hostStart(G.lists[1]); else { NET.send({ t: 'rematch' }); closeModal(); setHint('Revanche angefragt – warte auf den Gastgeber …'); } return; }
      closeModal(); clearUnits(); $('log').innerHTML = ''; G.phase = 'menu'; updateHud(); startDeploy();
    };
    d.querySelector('#again').onclick = () => { if (G.mode === 'online') { netClose(); return; } closeModal(); clearUnits(); $('log').innerHTML = ''; G.vp = [0, 0]; menu(); updateHud(); };
    d.querySelector('#look').onclick = () => closeModal();
  }), 1800);
}
function updateObjectives() {
  objMarkers.forEach((o, i) => {
    const oc = [0, 0];
    for (const u of living()) if ((Math.hypot(u.x - OBJ[i].x, u.z - OBJ[i].z) - u.r) / IN <= 3) oc[u.side] += u.T.OC;
    o.owner = oc[0] > oc[1] ? 0 : oc[1] > oc[0] ? 1 : null;
    const col = new THREE.Color(o.owner === null ? '#d9d2c0' : TEAMS[o.owner].col);
    o.core.emissive.copy(col); o.ring.material.color.copy(col); o.ring.material.opacity = o.owner === null ? .4 : .75;
    o.lab.querySelector('.nm').style.borderColor = col.getStyle(); o.oc = oc;
  });
  dirty = true; updateHud();
}

// ---------- Auswahl und Eingabe des menschlichen Spielers ----------
function clearSel() {
  losLine.visible = false; selRing.visible = false; rangeRing.visible = false; pathLine.visible = false; drawNav(null);
  for (const r of targetRings) overlay.remove(r); targetRings.length = 0;
  $('acts').innerHTML = ''; $('tip').style.display = 'none'; showCard(null); dirty = true;
}
function canShoot(a) { return !a.sprint && !(a.startEng && a.moved) && !engagedAt(a.u, a.u).length && a.u.T.guns.length; }
function canFight(a) { return (!a.sprint || a.u.T.beast) && !(a.startEng && a.moved); }
function validTarget(e, mark = G.act?.markMode) {
  const a = G.act; if (!a || !e.alive || e.side === a.u.side) return null;
  if (engagedAt(a.u, a.u).includes(e)) return canFight(a) ? 'fight' : null;
  if (mark) return !a.sprint && !(a.startEng && a.moved) && !engagedAt(a.u, a.u).length && gap(a.u, e) <= 36 && sight(a.u, e).vis ? 'mark' : null;
  if (!canShoot(a)) return null;
  const c = ctxOf(a.u, e, 'shoot');
  return c.vis && gunsInRange(a.u, c).length ? 'shoot' : null;
}
function select(u) {
  if (G.act?.strat && !G.act.attacked) G.cp[G.act.u.side] += 1;
  G.act = { u, moved: false, sprint: u.sprintRoll != null, startEng: engagedAt(u, u).length > 0, markMode: false, maxMove: u.T.M + (u.sprintRoll ?? 0) };
  updateHud();
  refreshAct(); snd('click');
}
function refreshAct() {
  const a = G.act; clearSel(); if (!a) return;
  const u = a.u;
  selRing.visible = true; selRing.position.set(u.x, .8, u.z); selRing.scale.setScalar(u.r + 6); selRing.material.color.set(TEAMS[u.side].col);
  if (!a.moved) { a.nav = navigate(u, a.maxMove); drawNav(a.nav, TEAMS[u.side].col); } else a.nav = null;
  const maxR = Math.max(0, ...u.T.guns.map(w => w.r));
  if (maxR && canShoot(a)) { rangeRing.visible = true; rangeRing.position.set(u.x, .9, u.z); rangeRing.scale.setScalar(maxR * IN + u.r); }
  let nT = 0;
  for (const e of living(1 - u.side)) {
    const k = validTarget(e); if (!k) continue; nT++;
    const r = ringMesh(k === 'mark' ? 0xff3b3b : k === 'fight' ? 0xffd04a : 0xff5a48); r.position.set(e.x, .8, e.z); r.scale.setScalar(e.r + 6); targetRings.push(r);
  }
  showCard(u);
  if (isRemote(u.side)) { setHint(`${nameOf(u)} wird vom Gegner aktiviert …`); dirty = true; return; }
  const acts = $('acts'), btn = (t, fn, cls = '', dis = false) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = t; b.disabled = dis; b.onclick = () => { if (!G.busy) fn(); }; acts.append(b); };
  if (!a.moved && !a.sprint && !u.T.noSprint && !a.startEng) btn('Sprinten (+W6")', () => act('spr'));
  if (u.T.marker) btn(a.markMode ? 'Markieren: an' : 'Markerlicht', () => act('mark'), a.markMode ? 'on' : '');
  if (a.moved && a.prev) btn('↶ Bewegung zurück', () => act('undo'));
  // Taktiken (Befehlspunkte): je Aktivierung eine
  const cp = G.cp[u.side], fightNow = engagedAt(u, u).length && canFight(a), shootNow = canShoot(a) && !a.markMode;
  for (const [key, label, cost, ok] of [['reroll', 'Gezieltes Feuer', 1, shootNow || fightNow], ['ap', 'Überladung', 1, shootNow || fightNow]]) {
    if (!ok && a.strat !== key) continue;
    btn(`${label} · ${cost} BP`, () => act('strat', key),
      a.strat === key ? 'on' : '', a.strat !== key && cp < cost + (a.strat ? -1 : 0));
  }
  if (u.w < u.T.W && !a.strat && !a.sprint && !(a.startEng && a.moved)) btn('Notreparatur · 2 BP', () => act('rep'), '', cp < 2);
  btn('Aktivierung beenden', () => act('end'), 'pri');
  const parts = [];
  if (!a.moved) parts.push(a.startEng ? 'Klicke in die Fläche, um dich zurückzuziehen (danach keine Aktion)' : `Bewegen: bis ${a.maxMove}" in die farbige Fläche klicken`);
  if (nT) parts.push(a.markMode ? 'Ziel zum Markieren anklicken' : engagedAt(u, u).length ? 'Gegner im Nahkampf anklicken' : 'Gegner mit rotem Ring anklicken zum Schießen');
  else if (a.moved) parts.push('Kein Ziel in Reichweite und Sicht – Aktivierung beenden');
  if (a.strat) parts.push(a.strat === 'reroll' ? 'Gezieltes Feuer: Fehlwürfe beim Treffen werden wiederholt' : 'Überladung: Durchschlag +1');
  setHint(`${nameOf(u)}: ${parts.join(' · ')}`);
  dirty = true;
}
async function doSprint() {
  const a = G.act; if (!a || a.moved || a.sprint) return;
  const r = a.u.sprintRoll ?? d6(); a.u.sprintRoll = r; a.sprint = true; a.maxMove = a.u.T.M + r;
  log(`${nameOf(a.u)} sprintet: W6 = ${r} → ${a.maxMove}" Bewegung${a.u.T.beast ? '' : ', danach keine Aktion'}.`);
  floatText(a.u, `+${r}"`, 'sv'); snd('click');
  refreshAct();
}
// Abwehrfeuer: Nach einer Bewegung darf die Gegenseite einmal pro Runde für 1 BP mit einer Einheit schießen (trifft nur auf 6).
async function reactFire(mover) {
  const side = 1 - mover.side;
  if (!mover.alive || G.phase !== 'play' || G.owUsed[side] || G.cp[side] < 1) return;
  const ctx = s => ({ ...ctxOf(s, mover, 'shoot', s, mover, false), reroll: false, apBonus: 0, overwatch: true });
  const shooters = living(side).filter(s => s.T.guns.length && !engagedAt(s, s).length && (c => c.vis && gunsInRange(s, c).length)(ctx(s)));
  if (!shooters.length) return;
  const ev = s => { const c = ctx(s); return gunsInRange(s, c).reduce((t, w) => t + expect(s, mover, w, c), 0); };
  let shooter = null;
  if (isAI(side)) { AIS = aiLevel(side); const [b, v] = shooters.map(s => [s, ev(s)]).sort((x, y) => y[1] - x[1])[0]; if (v >= .45 || v >= mover.w * .4) shooter = b; }
  else if (isRemote(side)) { setHint('Der Gegner entscheidet über Abwehrfeuer …'); const i = await NET.waitOw(); shooter = i >= 0 ? G.units[i] : null; }
  else {
    const wasFollow = G.follow; G.follow = true; follow(mover.x, mover.z); G.follow = wasFollow;
    const hot = G.mode === 'hot', who = hot ? `${TEAMS[side].name}: ` : '';
    shooter = await new Promise(res => {
      const bar = document.createElement('div'); bar.className = 'owbar'; bar.style.borderColor = TEAMS[side].col;
      bar.innerHTML = `<div><b style="color:${TEAMS[side].col}">${who}Abwehrfeuer?</b> ${nameOf(mover)} ist in ${hot ? 'eure' : 'deine'} Sicht gezogen. Für 1 BP schießt eine Einheit sofort (trifft nur auf 6, einmal pro Runde).</div>
        <div class="row">${shooters.map((u, i) => `<button class="btn" data-i="${i}">${portraitImg(u.type, 'mini')}${esc(u.T.short)} · ⌀ ${fmt(ev(u))}</button>`).join('')}<button class="btn" data-no>Nicht schießen</button></div>`;
      document.body.append(bar);
      bar.querySelectorAll('[data-i]').forEach(b => { const s2 = shooters[+b.dataset.i]; b.onmouseenter = () => showLos(s2, mover, ctx(s2).cover); b.onmouseleave = () => { losLine.visible = false; dirty = true; }; b.onclick = () => { bar.remove(); losLine.visible = false; res(s2); }; });
      bar.querySelector('[data-no]').onclick = () => { bar.remove(); losLine.visible = false; res(null); };
    });
    if (G.mode === 'online') NET.send({ t: 'ow', i: shooter ? G.units.indexOf(shooter) : -1 });
  }
  if (!shooter) return;
  G.cp[side] -= 1; G.owUsed[side] = true; updateHud();
  log(`${nameOf(shooter)} gibt <b>Abwehrfeuer</b> auf ${nameOf(mover)} (1 BP).`); banner('Abwehrfeuer!', TEAMS[side].col);
  await attack(shooter, mover, 'shoot', false, true);
}
async function doMove(j) {
  const a = G.act, u = a.u; G.busy = true; clearSel(); setHint(`${nameOf(u)} bewegt sich …`);
  const pts = pathTo(u, a.nav, j);
  a.prev = { x: u.x, z: u.z, rot: u.holder.rotation.y };
  await moveAlong(u, pts); a.moved = true; updateObjectives();
  const hpBefore = u.w, cpBefore = G.cp[1 - u.side]; await reactFire(u); G.busy = false;
  if (G.cp[1 - u.side] !== cpBefore) a.prev = null;    // nach Abwehrfeuer keine Rücknahme mehr
  if (!u.alive) { endActivation(); return; } void hpBefore;
  refreshAct();
}
function undoMove() {
  const a = G.act; if (!a?.prev) return;
  setPos(a.u, a.prev.x, a.prev.z); a.u.holder.rotation.y = a.prev.rot; a.moved = false; a.prev = null;
  updateObjectives(); snd('click'); refreshAct();
}
async function doRepair() {
  const a = G.act, u = a.u; if (G.cp[u.side] < 2 || u.w >= u.T.W) return;
  G.cp[u.side] -= 2; const before = u.w; u.w = Math.min(u.T.W, u.w + 2);
  clearSel(); G.busy = true;
  for (let i = 0; i < 5; i++) flash(new THREE.Vector3(u.x + (Math.random() - .5) * u.r, u.h * (.3 + Math.random() * .5), u.z + (Math.random() - .5) * u.r), 0x7fe08a, 22, .5);
  snd('click'); floatText(u, `+${u.w - before} LP`, 'sv'); updateLabel(u);
  log(`${nameOf(u)} führt eine Notreparatur durch (+${u.w - before} LP, 2 BP).`);
  await wait(.7 / G.speed); G.busy = false; endActivation();
}
async function doTarget(e) {
  const a = G.act, k = validTarget(e);
  if (!k) { if (isAI(a.u.side)) endActivation(); return; }
  clearSel();
  if (k === 'mark') {
    G.busy = true; await turnTo(a.u, e.x, e.z);
    const from = muzzle(a.u, e), to = new THREE.Vector3(e.x, e.h * .6, e.z);
    snd('click'); beam(from, to, 0xff2020, .7, 1.2 / G.speed); flash(to, 0xff3030, 20, .8);
    e.marked = true; updateLabel(e); floatText(e, 'markiert', 'sv');
    log(`${nameOf(a.u)} markiert ${nameOf(e)} mit dem Markerlicht.`);
    await wait(.8 / G.speed); G.busy = false;
  } else { if (a.strat) log(`${nameOf(a.u)} nutzt <b>${a.strat === 'reroll' ? 'Gezieltes Feuer' : 'Überladung'}</b> (1 BP).`); await attack(a.u, e, k); }
  updateObjectives(); endActivation();
}

// Mausaktionen (Klick ohne Ziehen)
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction;
  const hits = [];
  for (const u of G.units) {
    if (!u.alive || !u.placed || !u.holder.visible) continue;
    const bx = { min: [u.x - u.r, 0, u.z - u.r], max: [u.x + u.r, u.h, u.z + u.r] }, far = [o.x + d.x * 5000, o.y + d.y * 5000, o.z + d.z * 5000];
    if (segBox([o.x, o.y, o.z], far, bx)) hits.push([Math.hypot(u.x - o.x, u.h / 2 - o.y, u.z - o.z), u]);
  }
  hits.sort((x, y) => x[0] - y[0]);
  // hintereinander stehende Figuren: aktivierbare eigene bzw. gültige Ziele haben Vorrang
  const useful = u => G.phase === 'play' && !notMine(G.turn) && (G.act && u.side !== G.act.u.side ? !!validTarget(u) : u.side === G.turn && !u.done && u !== G.act?.u);
  const best = (hits.find(([, u]) => useful(u)) ?? hits[0])?.[1] ?? null;
  const t = d.y < 0 ? -o.y / d.y : null;
  return { unit: best, ground: t ? { x: o.x + d.x * t, z: o.z + d.z * t } : null };
}
let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; down = null;
  if (G.busy) return;
  const p = pick(e);
  if (G.phase === 'deploy') return deployClick(p);
  if (G.phase !== 'play' || notMine(G.turn) || NET.running) return;
  const a = G.act;
  if (p.unit && p.unit.side !== G.turn && a) { if (validTarget(p.unit)) act('tgt', G.units.indexOf(p.unit)); return; }
  if (p.unit && p.unit.side === G.turn && !p.unit.done && (!a || !a.moved) && p.unit !== a?.u) { act('sel', G.units.indexOf(p.unit)); return; }
  if (a && !a.moved && p.ground && a.nav) {
    const [k, m] = cellOf(p.ground.x, p.ground.z);
    if (k >= 0 && m >= 0 && k < NX && m < NZ && a.nav.ok(m * NX + k)) act('mv', m * NX + k);
  }
});
renderer.domElement.addEventListener('dblclick', e => { const p = pick(e); if (p.unit) focusOn(p.unit); });
function focusOn(u, dist = 260) {
  const t0 = controls.target.clone(), c0 = camera.position.clone(), t1 = new THREE.Vector3(u.x, u.h * .45, u.z);
  const dir = c0.clone().sub(t0).normalize(), c1 = t1.clone().addScaledVector(dir, dist);
  tween(.7, k => { const e = k * k * (3 - 2 * k); controls.target.lerpVectors(t0, t1, e); camera.position.lerpVectors(c0, c1, e); });
}
function follow(x, z) {
  if (!G.follow || G.instant) return;
  const t0 = controls.target.clone(), c0 = camera.position.clone(), d = new THREE.Vector3(x - t0.x, 0, z - t0.z).multiplyScalar(.55);
  if (d.length() < 40) return;
  tween(.8, k => { const e = k * k * (3 - 2 * k); controls.target.copy(t0).addScaledVector(d, e); camera.position.copy(c0).addScaledVector(d, e); });
}
let hoverEv = null;
renderer.domElement.addEventListener('pointermove', e => { hoverEv = e; });
renderer.domElement.addEventListener('pointerleave', () => { hoverEv = null; $('tip').style.display = 'none'; });
function handleHover() {
  const e = hoverEv; if (!e) return; hoverEv = null;
  const tip = $('tip'); tip.style.display = 'none'; losLine.visible = false;
  if (G.busy) return;
  const p = pick(e);
  if (G.phase === 'deploy') return deployHover(p);
  if (G.phase !== 'play') return;
  const a = G.act;
  if (p.unit) {
    if (!a || p.unit !== a.u) showCard(p.unit, true);
    if (a && p.unit.side !== a.u.side) {
      const k = validTarget(p.unit);
      let html = '';
      if (k === 'shoot') {
        const c = ctxOf(a.u, p.unit, 'shoot'); showLos(a.u, p.unit, c.cover);
        html = gunsInRange(a.u, c).map(w => { const h = hitNeed(a.u, p.unit, w, c), s = saveNeed(p.unit, w, c);
          return `<b>${esc(w.n)}</b>: ${attacksOf(w, c)} × trifft ${h.need}+, verwundet ${woundNeed(w.S, p.unit.T.T)}+, Rettung ${s.need <= 6 ? s.need + '+' : 'keine'}${s.cover ? ' (Deckung)' : ''}<br>⌀ ${fmt(expect(a.u, p.unit, w, c))} Schaden`; }).join('<br>') + `<br><span style="color:var(--mut)">Entfernung ${fmt(c.d)}"${c.cover ? ' · Ziel in Deckung (Sichtlinie gelb)' : ''}</span>`;
      } else if (k === 'fight') {
        const c = ctxOf(a.u, p.unit, 'fight'), w = a.u.T.melee;
        html = `<b>Nahkampf – ${esc(w.n)}</b>: ⌀ ${fmt(expect(a.u, p.unit, w, c))} Schaden<br><span style="color:var(--mut)">Der Gegner schlägt danach zurück.</span>`;
      } else if (k === 'mark') html = '<b>Markerlicht</b>: +1 auf Treffer gegen dieses Ziel bis Rundenende, keine Deckung.';
      else { const c = ctxOf(a.u, p.unit, 'shoot'); html = `<span style="color:var(--mut)">Kein gültiges Ziel${!c.vis ? ' – keine Sichtlinie' : a.u.T.guns.length && !gunsInRange(a.u, c).length ? ` – außer Reichweite (${fmt(c.d)}")` : ''}</span>`; }
      tip.innerHTML = html; tip.style.display = 'block'; tip.style.left = (e.clientX + 16) + 'px'; tip.style.top = (e.clientY + 12) + 'px';
    }
  } else showCard(a?.u ?? null);
  // Pfadvorschau
  pathLine.visible = false;
  if (a && !a.moved && a.nav && p.ground && !p.unit) {
    const [k, m] = cellOf(p.ground.x, p.ground.z), j = m * NX + k;
    if (k >= 0 && m >= 0 && k < NX && m < NZ && a.nav.ok(j)) {
      const pts = pathTo(a.u, a.nav, j);
      pathLine.geometry.setFromPoints(pts.map(q => new THREE.Vector3(q.x, 1.2, q.z))); pathLine.visible = true;
      tip.innerHTML = `${fmt(a.nav.dist[j] / IN)}" von ${a.maxMove}"`; tip.style.display = 'block'; tip.style.left = (e.clientX + 16) + 'px'; tip.style.top = (e.clientY + 12) + 'px';
    }
  }
  dirty = true;
}

// ---------- Computergegner ----------
// Bewertet für jede eigene Einheit mögliche Zielpositionen (Schaden, Missionsziele, Gefahr) und führt die beste Aktivierung aus.
// KI-Stufe je Seite: 'leicht' | 'normal' | 'schwer' | 'greedy' (Referenz-Skript für Tests); AIS = Stufe der gerade denkenden Seite
const aiLevel = s => G.aiLvl?.[s] ?? (G.greedy === s ? 'greedy' : G.diff);
let AIS = 'normal';
const hard = () => AIS === 'schwer';
const valueOf = (e, dmg) => dmg * (e.T.pts / e.T.W) / 9 * (dmg >= e.w - .2 ? 1.5 : 1) * (hard() ? 1 + .5 * (1 - e.w / e.T.W) : 1);
// Schwer: Angriffe nach der vollständigen Schadensverteilung bewerten – ein Abschuss zählt voll, Teilschaden nur anteilig
// (mehr, wenn noch eine eigene Einheit in dieser Runde nachlegen kann: Fokusfeuer über mehrere Aktivierungen).
function dmgDist(att, def, ws, c) {
  const cap = Math.max(1, def.w); let d = new Float64Array(cap + 1); d[0] = 1;
  for (const w of ws) {
    let h = pr(hitNeed(att, def, w, c).need); if (c.reroll) h += (1 - h) * h;
    const p = h * pr(woundNeed(w.S, def.T.T)) * (1 - pr(saveNeed(def, w, c).need));
    const dd = typeof w.D === 'number' ? [[w.D, 1]] : (([n, b]) => Array.from({ length: n }, (_, i) => [i + 1 + b, 1 / n]))(dParse(w.D));
    for (let a = attacksOf(w, c); a > 0 && p > 0; a--) {
      const nd = d.map(v => v * (1 - p));
      for (let k = 0; k < cap; k++) if (d[k]) for (const [x, q] of dd) nd[Math.min(cap, k + x)] += d[k] * p * q;
      d = nd;
    }
  }
  return d;
}
const AIW = { rstep: 4, dep: .1, spr: 0, kill: 1.5, beta: .5, focus: .25, danger: .32, obj: 1.35, newOff: 1, look: 1, cands: 14, top: 3, thr: .6, vp: 1, mat: 1, wnd: .5, objv: .8 };
for (const kv of (Q.get('aiw') ?? '').split(',').filter(Boolean)) { const [k, v] = kv.split(':'); AIW[k] = +v; }   // Test: ?aiw=kill:2,beta:.4
const worth = e => e.T.pts / 9 * 1.5 + killValue(e) * AIW.kill;
const doneness = (e, x, f) => x <= 0 ? 1 : (AIW.beta + (f ? AIW.focus : 0)) * (1 - x / e.T.W);
const canFollow = (att, def) => living(att.side).some(f => f !== att && !f.done && (f.T.guns.length ? Math.max(...f.T.guns.map(w => w.r)) + f.T.M : f.T.M + 4) >= gap(f, def));
function attackGain(att, def, ws, c, d = dmgDist(att, def, ws, c)) {
  const f = canFollow(att, def); let v = 0;
  for (let k = 0; k < d.length; k++) v += d[k] * doneness(def, def.w - k, f);
  return worth(def) * (v - doneness(def, def.w, f));
}
function bestOffense(u, p, moved, sprint) {
  if (hard() && AIW.newOff) return bestOffenseHard(u, p, moved, sprint);
  let best = { v: 0 };
  const eng = engagedAt(u, p);
  if (eng.length) {
    if (sprint && !u.T.beast) return best;
    for (const e of eng) { const v = valueOf(e, expect(u, e, u.T.melee, { kind: 'fight', moved })) - .5 * valueOf(u, expect(e, u, e.T.melee, { kind: 'fight', retaliation: true })); if (v > best.v) best = { v, e, k: 'fight' }; }
    return best;
  }
  if (sprint) return best;
  for (const e of living(1 - u.side)) {
    if (u.T.guns.length) {
      const c = ctxOf(u, e, 'shoot', p, e, moved); if (!c.vis) continue;
      const v = gunsInRange(u, c).reduce((s, w) => s + valueOf(e, expect(u, e, w, c)), 0);
      if (v > best.v) best = { v, e, k: 'shoot' };
    }
    if (u.T.marker && !e.marked && gapAt(u, p, e) <= 36 && sight(u, e, p).vis) {
      let v = 0;
      for (const f of living(u.side)) {
        if (f === u || f.done || !f.T.guns.length) continue;
        const c = ctxOf(f, e, 'shoot', f, e, false); if (!c.vis) continue;
        for (const w of gunsInRange(f, c)) { const before = expect(f, e, w, c); e.marked = true; const after = expect(f, e, w, c); e.marked = false; v += valueOf(e, after - before); }
      }
      if (v > best.v) best = { v, e, k: 'mark' };
    }
  }
  return best;
}
function bestOffenseHard(u, p, moved, sprint) {
  let best = { v: 0 };
  const eng = engagedAt(u, p);
  if (eng.length) {
    if (sprint && !u.T.beast) return best;
    for (const e of eng) {
      const d = dmgDist(u, e, [u.T.melee], { kind: 'fight', moved }), back = attackGain(e, u, [e.T.melee], { kind: 'fight', retaliation: true });
      const v = attackGain(u, e, [u.T.melee], null, d) - back * (1 - d[d.length - 1]);
      if (v > best.v) best = { v, e, k: 'fight' };
    }
    return best;
  }
  if (sprint) return best;
  for (const e of living(1 - u.side)) {
    if (u.T.guns.length) {
      const c = ctxOf(u, e, 'shoot', p, e, moved); if (!c.vis) continue;
      const ws = gunsInRange(u, c); if (!ws.length) continue;
      const v = attackGain(u, e, ws, c);
      if (v > best.v) best = { v, e, k: 'shoot' };
    }
    if (u.T.marker && !e.marked && gapAt(u, p, e) <= 36 && sight(u, e, p).vis) {
      let v = 0;
      for (const f of living(u.side)) {
        if (f === u || f.done || !f.T.guns.length) continue;
        const c = ctxOf(f, e, 'shoot', f, e, false); if (!c.vis) continue;
        const ws = gunsInRange(f, c); if (!ws.length) continue;
        const before = attackGain(f, e, ws, c); e.marked = true; const after = attackGain(f, e, ws, c); e.marked = false; v = Math.max(v, after - before);
      }
      if (v > best.v) best = { v, e, k: 'mark' };
    }
  }
  return best;
}
function danger(u, p) {
  let s = 0; const ghost = { ...u, x: p.x, z: p.z };
  for (const e of living(1 - u.side)) {
    const reach = e.T.M + (e.T.noSprint ? 0 : 3.5);
    if (e.T.guns.length) {
      const c = ctxOf(e, ghost, 'shoot', e, p, true);
      if (c.vis) for (const w of e.T.guns) if (c.d <= w.r + e.T.M) s += expect(e, ghost, w, c) * (c.d <= w.r ? 1 : .6);
    }
    if (gapAt(u, p, e) <= reach + 1) s += expect(e, ghost, e.T.melee, { kind: 'fight' }) * (e.T.beast ? 1.3 : .6);
  }
  return valueOf(u, s) * (hard() ? AIW.danger : .45) * (G.round >= ROUNDS ? .3 : 1);
}
function objScore(u, p) {
  let s = 0, near = Infinity;
  OBJ.forEach((o, i) => {
    const d = (Math.hypot(p.x - o.x, p.z - o.z) - u.r) / IN;
    const oc = objMarkers[i].oc ?? [0, 0], mine = oc[u.side] - ((Math.hypot(u.x - o.x, u.z - o.z) - u.r) / IN <= 3 ? u.T.OC : 0), theirs = oc[1 - u.side];
    if (d <= 3) s += (mine > theirs ? .5 : 1.4 + (theirs >= mine ? .6 : 0) + (u.T.OC - 1) * .5) * objValue(i);
    else if (mine <= theirs) near = Math.min(near, d);
  });
  if (s === 0 && near < Infinity) s -= near * .045;
  if (G.mission === 'durchbruch' && G.round >= 2 && inZone(1 - u.side, p.z)) s += 1.1;
  return s * (hard() ? AIW.obj : 1) * (G.round >= 4 ? 1.25 : 1);
}
function planFor(u, maxMove, sprint, noise = 0, top = 0, step = 2) {
  const nav = navigate(u, maxMove), startEng = engagedAt(u, u).length > 0;
  const cand = [{ j: -1, p: { x: u.x, z: u.z } }];
  for (let i = 0; i < NX * NZ; i++) if (nav.ok(i) && (i % NX) % step === 0 && Math.floor(i / NX) % step === 0) cand.push({ j: i, p: { x: cx(i % NX), z: cz(Math.floor(i / NX)) } });
  if (sprint) for (const e of living(1 - u.side)) for (let a = 0; a < 12; a++) {     // für Angriffe: Punkte direkt an der gegnerischen Base
    const x = e.x + Math.cos(a * .5236) * (u.r + e.r + IN * .6), z = e.z + Math.sin(a * .5236) * (u.r + e.r + IN * .6), [k, m] = cellOf(x, z), j = m * NX + k;
    if (k >= 0 && m >= 0 && k < NX && m < NZ && nav.ok(j)) cand.push({ j, p: { x: cx(k), z: cz(m) } });
  }
  let best = null; const all = [];
  for (const c of cand) {
    const moved = c.j >= 0, fellBack = startEng && moved;
    const off = fellBack ? { v: 0 } : bestOffense(u, c.p, moved, sprint);
    // Referenz-Skript für Tests (G.greedy = Seite): nur zum Ziel laufen und schießen, Gefahr ignorieren
    const score = AIS === 'greedy' ? off.v * 1.1 + objScore(u, c.p) : off.v * 1.1 + objScore(u, c.p) - danger(u, c.p) + Math.random() * (.05 + noise);
    const pl = { u, j: c.j, p: c.p, off, score, nav };
    if (top) all.push(pl);
    if (!best || score > best.score) best = pl;
  }
  if (top) {     // mehrere unterschiedliche gute Pläne (anderes Ziel/andere Aktion oder mindestens 4" auseinander) für die Vorausschau
    all.sort((a, b) => b.score - a.score); best.top = [];
    for (const pl of all) {
      if (best.top.length >= top) break;
      if (best.top.every(q => q.off.e !== pl.off.e || q.off.k !== pl.off.k || Math.hypot(q.p.x - pl.p.x, q.p.z - pl.p.z) > 4 * IN)) best.top.push(pl);
    }
  }
  return best;
}
// ---------- Schwer: Vorausschau ----------
// Für die besten Kandidaten aller eigenen Einheiten: Ergebnis erwartet ausspielen (Zweige Abschuss / kein Abschuss),
// dann die für uns schlimmste Antwort des Gegners (je Einheit dessen bester Plan) und die Stellung bewerten.
function ocNow() {
  return OBJ.map(o => { const oc = [0, 0]; for (const u of living()) if ((Math.hypot(u.x - o.x, u.z - o.z) - u.r) / IN <= 3) oc[u.side] += u.T.OC; return oc; });
}
function evalState(s) {
  const own = living(s), opp = living(1 - s);
  if (!opp.length) return 1000; if (!own.length) return -1000;
  const left = (ROUNDS - G.round + 1) / ROUNDS;
  let v = (G.vp[s] - G.vp[1 - s]) * AIW.vp;
  for (const u of G.units) if (u.placed && u.alive) v += (u.side === s ? 1 : -1) * u.T.pts / 10 * AIW.mat * (.35 + .65 * left) * (1 - AIW.wnd * (1 - u.w / u.T.W));
  ocNow().forEach((oc, i) => { v += Math.sign(oc[s] - oc[1 - s]) * objValue(i) * AIW.objv; });
  if (G.mission === 'durchbruch' && G.round >= 2) for (const u of living()) if (inZone(1 - u.side, u.z)) v += (u.side === s ? 1 : -1) * AIW.objv * .6;
  // Tempo: was die noch nicht aktivierten Einheiten beider Seiten in dieser Runde voraussichtlich anrichten können
  if (AIW.thr) for (const u of G.units) if (u.placed && u.alive && !u.done) v += (u.side === s ? 1 : -1) * AIW.thr * threatOf(u);
  return v;
}
function threatOf(u) {
  let best = 0;
  for (const e of living(1 - u.side)) {
    let g = 0;
    if (gap(u, e) <= u.T.M + 1) g = attackGain(u, e, [u.T.melee], { kind: 'fight', moved: true }) * (u.T.beast ? 1 : .5);
    if (u.T.guns.length) {
      const c = ctxOf(u, e, 'shoot', u, e, true); c.d = Math.max(0, c.d - u.T.M);
      const ws = gunsInRange(u, c); if (c.vis && ws.length) g = Math.max(g, attackGain(u, e, ws, c));
    }
    best = Math.max(best, g);
  }
  return best;
}
// Plan hypothetisch ausführen: ruft fn() für jeden Ausgang (mit Wahrscheinlichkeit) auf und stellt den Zustand danach wieder her
function branchPlan(pl, fn) {
  const u = pl.u, e = pl.off.e, k = pl.off.k, S = G.units.map(o => [o, o.x, o.z, o.w, o.alive, o.done, o.marked]), vp = [...G.vp], fb = G.firstBlood;
  const back = () => { for (const [o, x, z, w, a, d, m] of S) { o.x = x; o.z = z; o.w = w; o.alive = a; o.done = d; o.marked = m; } G.vp = [...vp]; G.firstBlood = fb; };
  u.x = pl.p.x; u.z = pl.p.z; u.done = true;
  if (!e || !pl.off.v) { fn(1); back(); return; }
  if (k === 'mark') { e.marked = true; fn(1); back(); return; }
  const c = k === 'fight' ? { kind: 'fight', moved: pl.j >= 0 } : ctxOf(u, e, 'shoot', u, e, pl.j >= 0);
  const d = dmgDist(u, e, k === 'fight' ? [u.T.melee] : gunsInRange(u, c), c), pk = d[d.length - 1];
  if (pk > .01) { e.alive = false; G.vp[u.side] += killValue(e) + (G.firstBlood ? 0 : 1); G.firstBlood = true; fn(pk); back(); u.x = pl.p.x; u.z = pl.p.z; u.done = true; }
  if (pk < .99) {
    let ed = 0; for (let i = 0; i < d.length - 1; i++) ed += d[i] * i; ed /= Math.max(1e-9, 1 - pk);
    e.w = Math.max(1, Math.round(e.w - ed));
    if (k === 'fight') { const r = dmgDist(e, u, [e.T.melee], { kind: 'fight', retaliation: true }); let er = 0; r.forEach((q, i) => er += q * i); if (er >= u.w - .5) u.alive = false; else u.w = Math.max(1, Math.round(u.w - er)); }
    fn(1 - pk); back();
  }
}
function lookahead(side, plans) {
  const opp = 1 - side, saveAIS = AIS, saveOC = objMarkers.map(o => o.oc);
  const setOC = () => ocNow().forEach((oc, i) => objMarkers[i].oc = oc);
  let best = null;
  for (const pl of plans) {
    let val = 0;
    branchPlan(pl, w => {
      setOC();
      const rep = living(opp).filter(o => !o.done);
      if (!rep.length) { val += w * evalState(side); return; }
      AIS = 'normal'; let worst = Infinity;
      for (const o of rep) {
        const op = planFor(o, o.T.M, false, 0, 0, AIW.rstep);
        let r = 0; branchPlan(op, w2 => { setOC(); r += w2 * evalState(side); }); setOC();
        worst = Math.min(worst, r);
      }
      AIS = saveAIS; val += w * worst;
    });
    pl.look = val;
    if (!best || val > best.look) best = pl;
  }
  objMarkers.forEach((o, i) => o.oc = saveOC[i]); AIS = saveAIS;
  return best;
}
async function aiTurn() {
  G.busy = true; const side = G.turn; AIS = aiLevel(side);
  setHint(`<b style="color:${TEAMS[side].col}">${TEAMS[side].name}</b> (Computer) überlegt …`);
  await wait(.2 / G.speed);
  let plan = null;
  const noise = AIS === 'leicht' ? 1.6 : 0;
  const look = hard() && AIW.look, cands = [];
  for (const u of living(side).filter(u => !u.done)) { const p = planFor(u, u.T.M, false, noise, look ? AIW.top : 0); if (!plan || p.score > plan.score) plan = p; if (look) cands.push(...p.top); }
  if (look && cands.length > 1) plan = lookahead(side, cands.sort((a, b) => b.score - a.score).slice(0, AIW.cands));
  const u = plan.u;
  G.act = { u, moved: false, sprint: false, startEng: engagedAt(u, u).length > 0, markMode: false, maxMove: u.T.M };
  follow(u.x, u.z);
  selRing.visible = true; selRing.position.set(u.x, .8, u.z); selRing.scale.setScalar(u.r + 6); selRing.material.color.set(TEAMS[side].col);
  showCard(u); dirty = true;
  // Sprint, wenn ein Nahkampf nur so erreichbar ist (Katze) oder ein Missionsziel deutlich näher rückt
  if (!G.act.startEng && !u.T.noSprint && plan.off.k !== 'fight' && (u.T.beast || (!plan.off.v && ((hard() && AIW.spr) || Math.random() < .5)))) {
    const r = d6(); const sp = planFor(u, u.T.M + r, true);
    if (sp.score > plan.score + .3) { G.act.sprint = true; G.act.maxMove = u.T.M + r; log(`${nameOf(u)} sprintet: W6 = ${r} → ${G.act.maxMove}".`); floatText(u, `+${r}"`, 'sv'); plan = sp; }
  }
  if (plan.j >= 0) {
    drawNav(plan.nav, TEAMS[side].col); await wait(.35 / G.speed); drawNav(null); selRing.visible = false;
    await moveAlong(u, pathTo(u, plan.nav, plan.j)); G.act.moved = true; updateObjectives();
    await reactFire(u); G.busy = true;
    if (!u.alive) { G.busy = false; endActivation(); return; }
  }
  selRing.visible = false;
  const off = bestOffense(u, u, G.act.moved, G.act.sprint);
  G.busy = false;
  if (off.e && off.v > 0 && !(G.act.startEng && G.act.moved)) {
    if (off.k === 'mark') G.act.markMode = true;
    else if (G.cp[side] >= 1 && AIS !== 'leicht') {
      // Taktik wählen, wenn sie spürbar mehr erwarteten Schaden bringt (oder den Abschuss wahrscheinlicher macht)
      const gain = st => { G.act.strat = st; const c = ctxOf(u, off.e, off.k === 'fight' ? 'fight' : 'shoot'); const ws = off.k === 'fight' ? [u.T.melee] : gunsInRange(u, c); const v = ws.reduce((s, w) => s + expect(u, off.e, w, c), 0); G.act.strat = null; return v; };
      const base = gain(null), best = ['reroll', 'ap'].map(st => [st, gain(st) - base]).sort((x, y) => y[1] - x[1])[0];
      if (best[1] > (hard() ? .15 : .35 + (G.round < 3 ? .25 : 0))) { G.act.strat = best[0]; G.cp[side] -= 1; updateHud(); }
    }
    await doTarget(off.e);
  } else if (u.w <= u.T.W - 2 && G.cp[side] >= 2 && !G.act.sprint && !(G.act.startEng && G.act.moved)) { await doRepair(); }
  else { await wait(.3 / G.speed); endActivation(); }
}

// ---------- Aufstellung ----------
function inZone(side, z) { return side === 0 ? z > BD / 2 - ZONE * IN : z < -BD / 2 + ZONE * IN; }
// Kamera hinter die Tischkante einer Seite fliegen (0 = vorne/+z)
function homeView(side = 0, dur = 1.2) {
  controls.autoRotate = false;
  const sg = side === 0 ? 1 : -1, t0 = controls.target.clone(), c0 = camera.position.clone(), t1 = new THREE.Vector3(0, 0, 60 * sg), c1 = new THREE.Vector3(0, 760, 900 * sg);
  return tween(dur, k => { const e = k * k * (3 - 2 * k); controls.target.lerpVectors(t0, t1, e); camera.position.lerpVectors(c0, c1, e); });
}
function startDeploy() {
  G.phase = 'deploy'; homeView(G.mode === 'online' ? NET.side : 0);
  const ids = Object.keys(TERRAINS), tid = G.mode === 'online' ? G.netCfg.tid : TERRAINS[G.terrain] ? G.terrain : ids[Math.floor(Math.random() * ids.length)];
  setLayout(tid, G.mode === 'online' ? G.netCfg.mirror : Math.random() < .5);
  for (const s of [0, 1]) for (const t of G.lists[s].slice().sort((a, b) => UT[b].pts - UT[a].pts)) G.units.push(makeUnit(t, s));
  const q = [[], []]; for (const u of G.units) q[u.side].push(u);
  G.deployQ = []; while (q[0].length || q[1].length) { if (q[0].length) G.deployQ.push(q[0].shift()); if (q[1].length) G.deployQ.push(q[1].shift()); }
  log('Aufstellung', 'r'); log(`Gelände: ${TERRAINS[tid].name}${LAYOUT.mirror ? ' (gespiegelt)' : ''}`); updateHud(); nextDeploy();
}
async function nextDeploy() {
  const u = G.deployQ[0];
  if (!u) { startGame(); return; }
  drawZone(u.side); showCard(u);
  if (isAI(u.side)) {
    setHint(`<b style="color:${TEAMS[u.side].col}">${TEAMS[u.side].name}</b> stellt ${nameOf(u)} auf …`);
    G.busy = true; await wait(.25 / G.speed);
    let best = null;
    for (let i = 0; i < 160; i++) {
      const x = (Math.random() - .5) * (BW - 2 * u.r), z = (u.side ? -1 : 1) * (BD / 2 - u.r - Math.random() * (ZONE * IN - 2 * u.r));
      if (!freeSpot(u, x, z)) continue;
      let s = Math.random() * .5;
      for (const b of COLL) { const d = Math.hypot(x - (b.min[0] + b.max[0]) / 2, z - (b.min[2] + b.max[2]) / 2); if (d < 4 * IN) s += .15; }
      for (const o of G.units) if (o.placed && o.side === u.side) s -= Math.max(0, 4 - dist(o, { x, z }) / IN) * .4;
      if (u.T.guns.length) s += .2 * living(1 - u.side).filter(e => sight(u, e, { x, z }).vis).length;
      if (aiLevel(u.side) === 'schwer' && AIW.dep) {   // Schwer: aus der Sicht der gegnerischen Zone bleiben, nah an den Zielen
        const ez = (u.side ? 1 : -1) * (BD / 2 - 3 * IN), probe = { ...u, x: 0, z: ez, h: 60 };
        for (let k = -3; k <= 3; k++) { probe.x = k * 5 * IN; if (sight(probe, u, probe, { x, z }).vis) s -= AIW.dep; }
        s -= Math.min(...OBJ.map(o => Math.abs(o.x - x))) / IN * .03;
      }
      if (!best || s > best.s) best = { x, z, s };
    }
    place(u, best.x, best.z); G.busy = false; nextDeploy();
  } else if (isRemote(u.side)) {
    setHint(`<b style="color:${TEAMS[u.side].col}">Der Gegner</b> stellt ${nameOf(u)} auf …`); u.holder.visible = false;
  } else if (G.autoDep?.[u.side]) {
    for (let i = 0; i < 400; i++) { const x = (Math.random() - .5) * (BW - 2 * u.r), z = (u.side ? -1 : 1) * (BD / 2 - u.r - Math.random() * (ZONE * IN - 2 * u.r)); if (freeSpot(u, x, z)) { setTimeout(() => act('place', G.units.indexOf(u), x, z), 60); return; } }
  } else {
    setHint(`<b style="color:${TEAMS[u.side].col}">${TEAMS[u.side].name}</b>: Stelle ${nameOf(u)} in deiner Zone auf (Klick). <button class="btn" id="autoDep" style="pointer-events:auto;margin-left:8px;padding:3px 10px">Rest automatisch</button>`);
    $('autoDep').onclick = autoDeploy;
    u.holder.visible = false;
  }
}
function place(u, x, z) {
  u.placed = true; u.holder.visible = true; setPos(u, x, z); u.holder.rotation.y = u.side === 0 ? Math.PI : 0;
  G.deployQ.shift(); updateLabel(u); snd('click');
}
function deployHover(p) {
  const u = G.deployQ[0]; if (!u || notMine(u.side) || !p.ground) return;
  u.holder.visible = true; u.holder.position.set(p.ground.x, 0, p.ground.z); u.holder.rotation.y = u.side === 0 ? Math.PI : 0;
  const ok = inZone(u.side, p.ground.z) && freeSpot(u, p.ground.x, p.ground.z);
  selRing.visible = true; selRing.position.set(p.ground.x, .8, p.ground.z); selRing.scale.setScalar(u.r + 6); selRing.material.color.set(ok ? 0xffffff : 0xff3030);
}
function deployClick(p) {
  const u = G.deployQ[0]; if (!u || notMine(u.side) || NET.running || !p.ground) return;
  if (!inZone(u.side, p.ground.z) || !freeSpot(u, p.ground.x, p.ground.z)) { toast('Dort ist kein Platz – nur in der farbigen Zone, nicht auf Gelände oder Figuren.'); return; }
  selRing.visible = false; act('place', G.units.indexOf(u), p.ground.x, p.ground.z);
}
function autoDeploy() {
  const side = G.deployQ[0]?.side;
  if (G.mode === 'online') { (G.autoDep ??= [false, false])[side] = true; nextDeploy(); return; }
  for (const u of G.deployQ.filter(u => u.side === side)) {
    for (let i = 0; i < 400; i++) { const x = (Math.random() - .5) * (BW - 2 * u.r), z = (side ? -1 : 1) * (BD / 2 - u.r - Math.random() * (ZONE * IN - 2 * u.r)); if (freeSpot(u, x, z)) { u.placed = true; u.holder.visible = true; setPos(u, x, z); u.holder.rotation.y = side === 0 ? Math.PI : 0; updateLabel(u); break; } }
  }
  G.deployQ = G.deployQ.filter(u => !u.placed); selRing.visible = false; nextDeploy();
}

// ---------- Anzeige ----------
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 3200); }
function setHint(h) { $('hint').innerHTML = h; $('hint').style.display = h ? '' : 'none'; }
const scoreHtml = () => G.phase === 'deploy' ? '' : [0, 1].map(s => `<span class="chip" title="Siegpunkte · Befehlspunkte"><i class="dot" style="background:${TEAMS[s].col}"></i>${TEAMS[s].name} <b>${G.vp[s]}</b><small class="cp">${G.cp ? `${G.cp[s]} BP` : ''}</small></span>`).join('');
function updateHud() {
  $('round').textContent = G.phase === 'play' || G.phase === 'end' ? `Runde ${Math.min(G.round, ROUNDS)} / ${ROUNDS}` : G.phase === 'deploy' ? 'Aufstellung' : '';
  $('score').innerHTML = G.phase === 'menu' ? '' : scoreHtml();
  const c = TEAMS[G.turn];
  $('turn').innerHTML = G.phase !== 'play' ? '' : `<i class="dot" style="background:${c.col}"></i> ` + (G.mode === 'ai' ? (G.turn === 0 ? `<b style="color:${c.col}">Du</b> bist am Zug` : `Der <b style="color:${c.col}">Computer</b> ist am Zug`) : `<b style="color:${c.col}">${c.name}</b> ist am Zug`);
  for (const u of G.units) if (u.alive) updateLabel(u);
}
function updateLabel(u) {
  if (!u.alive) return;
  u.lab.className = 'ul' + (u.done && G.phase === 'play' ? ' done' : '');
  u.lab.innerHTML = `<span class="nm" style="border-color:${TEAMS[u.side].col}">${u.marked ? '<span class="mk">⌖ </span>' : ''}${esc(u.T.short)}</span><span class="pips">${Array.from({ length: u.T.W }, (_, i) => `<i class="${i < u.w ? '' : 'x'}"></i>`).join('')}</span>`;
}
const v3 = new THREE.Vector3();
function placeLabels() {
  const r = renderer.domElement.getBoundingClientRect();
  const put = (el, x, y, z) => { v3.set(x, y, z).project(camera); if (v3.z > 1) { el.style.display = 'none'; return; } el.style.display = ''; el.style.left = (r.left + (v3.x + 1) / 2 * r.width) + 'px'; el.style.top = (r.top + (1 - v3.y) / 2 * r.height) + 'px'; };
  for (const u of G.units) if (u.alive) { if (!u.placed || !u.holder.visible) u.lab.style.display = 'none'; else put(u.lab, u.holder.position.x, u.holder.position.y + u.h + 6, u.holder.position.z); }
  objMarkers.forEach((o, i) => put(o.lab, OBJ[i].x, 34, OBJ[i].z));
}
function statsHtml(T) {
  const st = [['Bew', T.M + '"', 'Bewegung in Zoll'], ['Wid', T.T, 'Widerstand – wie schwer die Einheit zu verwunden ist'], ['Rüst', T.Sv + '+', 'Rüstungswurf (wird durch Durchschlag verschlechtert)'], ['Rett', T.inv ? T.inv + '+' : '–', 'Rettungswurf, den Durchschlag nicht verschlechtert'], ['LP', T.W, 'Lebenspunkte'], ['OC', T.OC, 'Kontrollwert an Missionszielen']];
  const ab = (k, t) => `<abbr title="${t}">${k}</abbr>`;
  return `<div class="stats">${st.map(([k, v, t]) => `<div title="${t}"><small>${k}</small><b>${v}</b></div>`).join('')}</div>` +
    [...T.guns, T.melee].map(w => `<div class="wpn"><b>${esc(w.n)}</b> <span>${w === T.melee ? 'Nahkampf' : w.r + '"'} · ${ab('A', 'Attacken (Würfel)')}${w.A}${w.rapid ? '(+1)' : ''} · ${w === T.melee ? ab('KG', 'Kampfgeschick: trifft im Nahkampf auf') : ab('BF', 'Ballistische Fertigkeit: trifft auf')} ${w.BS}+ · ${ab('S', 'Stärke (gegen Widerstand)')}${w.S} · ${ab('DS', 'Durchschlag: verschlechtert die Rüstung')} ${w.AP ? '−' + w.AP : '0'} · ${ab('SC', 'Schaden je nicht geretteter Wunde')} ${w.D}</span></div>`).join('') +
    T.abil.map(([a, b]) => `<div class="abil"><b>${esc(a)}:</b> ${esc(b)}</div>`).join('');
}
function showCard(u, hover = false) {
  const c = $('card'); c.onclick = () => c.classList.toggle('open'); if (!u) { c.style.display = 'none'; return; }
  c.style.display = 'block';
  const tags = [u.done ? 'aktiviert' : '', u.marked ? 'markiert' : '', hover ? '' : ''].filter(Boolean).map(t => `<span class="tag">${t}</span>`).join('');
  c.innerHTML = `${portraitImg(u.type, 'card')}<h3><i class="dot" style="background:${TEAMS[u.side].col}"></i>${esc(u.T.name)}</h3><div class="sub">${TEAMS[u.side].name} · ${u.T.pts} Punkte · ${u.w}/${u.T.W} LP ${tags}</div>${statsHtml(u.T)}`;
}

// ---------- Porträts ----------
const PORTRAIT = {};
async function makePortraits() {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(220, 220, false); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1;
  const sc = new THREE.Scene(), pm = new THREE.PMREMGenerator(r);
  sc.environment = pm.fromScene(new RoomEnvironment(), .04).texture; sc.environmentIntensity = .6;
  sc.add(new THREE.HemisphereLight(0xffffff, 0x50505a, .7));
  const l = new THREE.DirectionalLight(0xfff2e0, 2.4); l.position.set(-40, 90, 70); sc.add(l);
  const l2 = new THREE.DirectionalLight(0x9fb8ff, .9); l2.position.set(60, 30, -60); sc.add(l2);
  const cam = new THREE.PerspectiveCamera(28, 1, 1, 3000);
  for (const k of Object.keys(UT)) {
    const g = UT[k].build(); sc.add(g);
    const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    const d = Math.max(size.x, size.y, size.z) / (2 * Math.tan(THREE.MathUtils.degToRad(14))) * 1.02;
    cam.position.copy(c).add(new THREE.Vector3(-.5, .22, 1).normalize().multiplyScalar(d)); cam.lookAt(c);
    r.render(sc, cam); PORTRAIT[k] = r.domElement.toDataURL('image/png');
    sc.remove(g); document.querySelectorAll(`img[data-portrait="${k}"]`).forEach(i => i.src = PORTRAIT[k]);
    await new Promise(res => setTimeout(res, 0));
  }
  pm.dispose(); r.dispose(); r.forceContextLoss();
}
const portraitImg = (k, cls = '') => `<img class="pt ${cls}" data-portrait="${k}" alt="" src="${PORTRAIT[k] ?? 'data:image/gif;base64,R0lGODlhAQABAAAAACw='}">`;

// ---------- Dialoge: Menü, Armeeauswahl, Regeln ----------
function modal(html, init) { const m = $('modal'); m.innerHTML = `<div class="dlg">${html}</div>`; m.classList.add('on'); init?.(m); }
function closeModal() { $('modal').classList.remove('on'); }
const RULES = `<div class="rules">
<h3>Ziel</h3><p>Zwei Armeen à 100 Punkte, 5 Runden. Am Ende jeder Runde bringen kontrollierte Missionsziele Siegpunkte (je nach Mission), vernichtete Einheiten ebenfalls; der erste Abschuss bringt 1 Extrapunkt (Erstes Blut). Wer am Ende mehr Punkte hat, gewinnt – oder sofort, wenn der Gegner ausgelöscht ist.</p>
<h3>Missionsziele</h3><p>Ein Ziel kontrolliert, wer innerhalb von 3" (Base-Kante) den höheren Kontrollwert (OC) hat. Der Ring färbt sich in der Farbe des Besitzers.</p>
<h3>Ablauf einer Runde</h3><p>Die Spieler aktivieren abwechselnd je eine Einheit, bis alle dran waren. Die Startseite wechselt jede Runde.</p>
<h3>Aktivierung</h3><ul><li><b>Bewegen</b> bis zum Bewegungswert (farbige Fläche). Bodeneinheiten laufen um Gelände herum, Sprungdüsen und Flügel tragen darüber.</li>
<li><b>Sprinten</b>: +W6" Bewegung, danach keine Aktion (die Katze darf trotzdem kämpfen).</li>
<li><b>Danach eine Aktion</b>: Schießen auf ein sichtbares Ziel in Reichweite (alle Waffen in Reichweite feuern), Nahkampf gegen Gegner in 1", oder Markerlicht (Pathfinder).</li>
<li>Wer im Nahkampf gebunden ist, kann nicht schießen. Wer sich aus dem Nahkampf zurückzieht, darf danach nichts mehr tun.</li></ul>
<h3>Befehlspunkte (BP)</h3><p>Jede Seite startet mit 2 BP und erhält am Ende jeder Runde 1 dazu (höchstens 6). Pro Aktivierung eine Taktik:</p><ul>
<li><b>Gezieltes Feuer</b> (1 BP): Fehlgeschlagene Trefferwürfe dieser Aktivierung werden einmal wiederholt.</li>
<li><b>Überladung</b> (1 BP): Durchschlag der Waffen +1 in dieser Aktivierung.</li>
<li><b>Notreparatur</b> (2 BP): Die Einheit erhält 2 Lebenspunkte zurück; das ist ihre Aktion.</li></ul>
<h3>Missionen</h3><ul><li><b>Vorherrschaft</b>: Jedes gehaltene Ziel 2 Punkte pro Runde, Abschüsse 1 Punkt.</li><li><b>Kopfgeld</b>: Abschüsse bringen 1 Punkt je angefangene 15 Punkte der Einheit.</li><li><b>Durchbruch</b>: Das mittlere Ziel zählt doppelt; ab Runde 3 punktet jede Einheit in der gegnerischen Aufstellungszone.</li></ul>
<h3>Abwehrfeuer</h3><p>Bewegt sich eine gegnerische Einheit in Sicht und Reichweite, darf die andere Seite einmal pro Runde für 1 BP mit einer Einheit sofort zurückschießen. Dabei trifft nur eine 6.</p>
<h3>Online-Spiel</h3><p>Im Menü „Online-Spiel“ → „Spiel erstellen“: Armee wählen, dann den Link (oder den 5-stelligen Code) an den Mitspieler schicken. Er öffnet den Link, wählt seine Armee – los geht’s. Der Gastgeber spielt Orange und legt Mission und Gelände fest. Die Verbindung läuft direkt zwischen den beiden Browsern.</p>
<h3>Tempo</h3><p><b>Leertaste</b> oder ein Klick auf die Würfelanzeige überspringt die Animationen der laufenden Aktivierung. Das Tempo (oben rechts) bleibt gespeichert.</p>
<h3>Gelände</h3><p>Drei Aufstellungen – Ruinenfeld, Depot (Container als lange Sichtsperren) und Trümmerstadt (kurze Sichtlinien) –, jeweils zufällig auch gespiegelt.</p>
<h3>Kürzel</h3><p>Bew Bewegung · Wid Widerstand · Rüst Rüstungswurf · Rett Rettungswurf · LP Lebenspunkte · OC Kontrollwert · A Attacken · BF/KG trifft auf · S Stärke · DS Durchschlag · SC Schaden. Fahre mit der Maus über einen Wert für die Erklärung.</p>
<h3>Initiative</h3><p>Vor Runde 1 würfeln beide Seiten; die höhere Zahl beginnt. Danach wechselt der Startspieler jede Runde.</p>
<h3>Würfeln</h3><ul><li><b>Treffer</b>: W6 ≥ BF/KG. Modifikatoren höchstens ±1. Eine 1 verfehlt immer.</li>
<li><b>Verwunden</b>: Stärke gegen Widerstand – doppelt so stark 2+, stärker 3+, gleich 4+, schwächer 5+, halb so stark 6+.</li>
<li><b>Rettung</b>: W6 ≥ Rüstung + Durchschlag (DS). Deckung gibt +1, ein Rettungswurf (Schild) wird nicht verschlechtert.</li>
<li><b>Schaden</b>: Jede nicht gerettete Wunde kostet SC Lebenspunkte.</li></ul>
<h3>Sicht und Deckung</h3><p>Sicht besteht, wenn mindestens einer von vier Punkten der Zielfigur frei sichtbar ist. Ist sie nur teilweise sichtbar, hat sie Deckung. Fenster in Ruinen lassen Sicht durch.</p>
<h3>Nahkampf</h3><p>Bewege dich in 1" an einen Gegner und klicke ihn an. Überlebt er, schlägt er sofort zurück.</p>
<h3>Bedienung</h3><p>Linke Maustaste ziehen: drehen · Rechte Maustaste: verschieben · Mausrad: zoomen · Doppelklick auf eine Figur: heranzoomen. Fahre über einen Gegner, um Sichtlinie (grün frei, gelb Deckung), Trefferchancen und erwarteten Schaden zu sehen. Eine Bewegung lässt sich zurücknehmen, solange noch nicht angegriffen wurde.</p></div>`;
function showRules() { modal(`<h2>Regeln</h2>${RULES}<div class="row" style="margin-top:14px"><span class="grow"></span><button class="btn pri" id="rOk">Verstanden</button></div>`, d => d.querySelector('#rOk').onclick = () => { closeModal(); }); }
function menu() {
  G.phase = 'menu'; controls.autoRotate = true; controls.autoRotateSpeed = .5;
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([k, t]) => `<button data-v="${k}" class="${k === cur ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  modal(`<h1>Tau-Gefecht</h1><p class="lead">Ein kleines Tabletop-Gefecht mit deinen bemalten Figuren: Armee auf 100 Punkte zusammenstellen, aufstellen, Missionsziele halten, Befehlspunkte klug einsetzen.</p>
  <div class="opts"><div><small>Mission</small>${seg('oMis', Object.entries(MISSIONS).map(([k, m]) => [k, m.name]), G.mission)}<p class="mdesc" id="mDesc">${MISSIONS[G.mission].text}</p></div>
  <div><small>Computer-Gegner</small>${seg('oDiff', [['leicht', 'Leicht'], ['normal', 'Normal'], ['schwer', 'Schwer']], G.diff)}</div>
  <div><small>Gelände</small>${seg('oTer', [['zufall', 'Zufall'], ...Object.entries(TERRAINS).map(([k, t]) => [k, t.name])], G.terrain)}</div></div>
  <div class="modes">
    <button class="mode" data-m="ai"><b>Gegen den Computer</b><span>Du führst die orange Armee, der Computer die blaue.</span></button>
    <button class="mode" data-m="hot"><b>Zwei Spieler</b><span>Abwechselnd am selben Gerät (Hot-Seat).</span></button>
    <button class="mode" data-m="online"><b>Online-Spiel</b><span>Zu zweit an zwei Geräten – Spiel erstellen und Link teilen.</span></button>
    <button class="mode" data-m="aivai"><b>Zuschauen</b><span>Computer gegen Computer – zum Kennenlernen.</span></button>
  </div><div class="row"><button class="btn" id="mRules">Regeln lesen</button></div>`, d => {
    d.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => {
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      if (sg.id === 'oMis') { G.mission = b.dataset.v; d.querySelector('#mDesc').textContent = MISSIONS[G.mission].text; } else if (sg.id === 'oTer') G.terrain = b.dataset.v; else G.diff = b.dataset.v;
    }));
    d.querySelectorAll('.mode').forEach(b => b.onclick = () => {
      G.mode = b.dataset.m; TEAMS[0].name = 'Spieler 1'; TEAMS[1].name = 'Spieler 2';
      if (G.mode === 'ai') { TEAMS[0].name = 'Du'; TEAMS[1].name = 'Computer'; }
      if (G.mode === 'online') { onlineMenu(); return; }
      if (G.mode === 'aivai') { TEAMS[0].name = 'Computer A'; TEAMS[1].name = 'Computer B'; G.lists = [randomList(), randomList()]; closeModal(); startDeploy(); }
      else army(0);
    });
    d.querySelector('#mRules').onclick = () => { showRules(); $('modal').querySelector('#rOk').onclick = menu; };
  });
}
function randomList(min = 85, max = MAX_PTS) {
  for (let tries = 0; ; tries++) {
    if (tries && tries % 300 === 0) min -= 5;
    const l = []; let pts = 0;
    for (;;) {
      const c = Object.keys(UT).filter(t => l.filter(x => x === t).length < UT[t].max && pts + UT[t].pts <= max);
      if (!c.length) break;
      const t = c[Math.floor(Math.random() * c.length)]; l.push(t); pts += UT[t].pts;
    }
    if (pts >= min) return l.sort((x, y) => UT[y].pts - UT[x].pts);
  }
}
function army(side) {
  const sum = l => l.reduce((t, x) => t + UT[x].pts, 0);
  const list = G.lists[side] = G.lists[side].length && sum(G.lists[side]) <= MAX_PTS ? G.lists[side] : PRESETS[side].slice();
  const draw = d => {
    const pts = list.reduce((s, t) => s + UT[t].pts, 0);
    d.querySelector('.ptsbar').textContent = `${pts} / ${MAX_PTS} Punkte`; d.querySelector('.ptsbar').classList.toggle('over', pts > MAX_PTS);
    d.querySelector('#aOk').disabled = pts > MAX_PTS || !list.length;
    d.querySelectorAll('.uc').forEach(c => {
      const t = c.dataset.t, n = list.filter(x => x === t).length;
      c.classList.toggle('sel', n > 0); c.querySelector('.cnt span').textContent = n;
      c.querySelector('.minus').disabled = !n; c.querySelector('.plus').disabled = n >= UT[t].max || pts + UT[t].pts > MAX_PTS;
    });
  };
  modal(`<h2><i class="dot" style="background:${TEAMS[side].col};width:14px;height:14px"></i>${TEAMS[side].name}: Armee wählen</h2>
    <p class="lead">Bis zu ${MAX_PTS} Punkte. Beide Armeen nutzen dieselben Figuren – unterschieden werden sie am farbigen Ring und Namensschild.</p>
    <div class="roster">${Object.entries(UT).map(([k, T]) => `<div class="uc" data-t="${k}"><div class="top">${portraitImg(k)}<b>${esc(T.name)}</b><span class="pts">${T.pts} P</span></div>${statsHtml(T)}
      <div class="cnt"><button class="minus">−</button><span>0</span><button class="plus">+</button><small style="color:var(--mut);margin-left:6px">max. ${T.max}</small></div></div>`).join('')}</div>
    <div class="row"><span class="ptsbar"></span><span class="grow"></span><button class="btn" id="aRnd">Zufällige Armee</button><button class="btn pri" id="aOk">Weiter</button></div>`, d => {
    d.querySelectorAll('.uc').forEach(c => {
      c.querySelector('.plus').onclick = () => { list.push(c.dataset.t); draw(d); };
      c.querySelector('.minus').onclick = () => { list.splice(list.lastIndexOf(c.dataset.t), 1); draw(d); };
    });
    d.querySelector('#aRnd').onclick = () => { list.length = 0; list.push(...randomList()); draw(d); };
    d.querySelector('#aOk').onclick = () => {
      if (side === 0 && G.mode === 'hot') { army(1); return; }
      if (G.mode === 'online') { G.lists[side] = list.slice(); side === 0 ? onlineHost() : onlineJoin(list.slice()); return; }
      if (G.mode === 'ai') { const pp = sum(list); G.lists[1] = randomList(pp - 5, pp); }
      closeModal(); startDeploy();
    };
    draw(d);
  });
}

// ---------- Online-Spiel ----------
// Beide Geräte führen dieselbe Partie aus: übertragen werden nur die Aktionen der Spieler, gewürfelt wird mit einem gemeinsamen
// Startwert. Verbindung direkt von Browser zu Browser (WebRTC über PeerJS, Vermittlung über den freien PeerJS-Server).
// Test ohne Netz: ?net=bc verbindet zwei Tabs desselben Browsers über einen BroadcastChannel.
const ACTIONS = {
  sel: i => select(G.units[i]),
  mv: j => doMove(j),
  undo: () => undoMove(),
  spr: () => doSprint(),
  strat: key => {
    const a = G.act, u = a.u, cost = 1;
    if (a.strat === key) { a.strat = null; G.cp[u.side] += cost; } else { if (a.strat) G.cp[u.side] += 1; a.strat = key; G.cp[u.side] -= cost; }
    snd('click'); updateHud(); refreshAct();
  },
  mark: () => { G.act.markMode = !G.act.markMode; refreshAct(); },
  tgt: i => doTarget(G.units[i]),
  rep: () => doRepair(),
  end: () => endActivation(),
  place: (i, x, z) => { place(G.units[i], x, z); nextDeploy(); },
};
// Eigene Aktion: online erst an das Gegenüber senden, dann (wie dort) ausführen
async function act(n, ...a) {
  if (G.mode !== 'online') return ACTIONS[n](...a);
  if (NET.running) return;
  NET.send({ t: 'a', n, a }); NET.running = true; NET.trace?.push(['L', n, ...a.map(v => typeof v === 'number' ? Math.round(v) : v)]);
  try { await ACTIONS[n](...a); } finally { NET.running = false; }
}
async function netPump() {
  const m = NET.q.shift(); NET.running = true; NET.trace?.push(['R', m.n, ...m.a.map(v => typeof v === 'number' ? Math.round(v) : v)]);
  try { await ACTIONS[m.n](...m.a); } catch (e) { console.error(e); }
  NET.running = false;
}
setInterval(() => { if (NET.q.length && !NET.running && !G.busy) netPump(); }, 100);   // auch ohne Bildwiederholung (Hintergrund-Tab)
NET.waitOw = () => new Promise(res => { const f = () => { if (NET.ow.length) { NET.owRes = null; res(NET.ow.shift()); } else NET.owRes = f; }; f(); });
// Prüfsumme nach jeder Aktivierung: beide Geräte müssen denselben Zustand haben
function netHash() {
  let h = 2166136261; const add = v => { h ^= v; h = Math.imul(h, 16777619); };
  for (const u of G.units) { add(Math.round(u.x)); add(Math.round(u.z)); add(u.w); add(u.alive ? 1 : 0); }
  add(G.vp[0]); add(G.vp[1]); add(G.cp?.[0] ?? 0); add(G.cp?.[1] ?? 0);
  return h >>> 0;
}
function netCheck() {
  const n = ++NET.n, h = netHash(); NET.send({ t: 'chk', n, h });
  if (NET.chk[n] !== undefined && NET.chk[n] !== h) netDesync(); else NET.chk[n] = h;
}
function netDesync() { if (NET.desync) return; NET.desync = true; toast('Achtung: Die beiden Geräte sind nicht mehr synchron. Bitte eine Revanche starten.'); }
function netMsg(m) {
  if (!m || typeof m !== 'object') return;
  if (m.t === 'a' && ACTIONS[m.n] && Array.isArray(m.a)) NET.q.push(m);
  else if (m.t === 'ow') { NET.ow.push(+m.i); NET.owRes?.(); }
  else if (m.t === 'hello' && NET.side === 0 && Array.isArray(m.list)) hostStart(m.list.filter(t => UT[t]));
  else if (m.t === 'rematch' && NET.side === 0 && G.phase === 'end') hostStart(G.lists[1]);
  else if (m.t === 'start' && NET.side === 1) startOnline(m);
  else if (m.t === 'chk') { if (NET.chk[m.n] !== undefined && NET.chk[m.n] !== m.h) netDesync(); else NET.chk[m.n] = m.h; }
  else if (m.t === 'bye') netLost();
}
// Gastgeber legt Startwert, Gelände und Mission fest und startet beide Seiten
function hostStart(guestList) {
  const ids = Object.keys(TERRAINS);
  const cfg = { t: 'start', seed: Math.floor(Math.random() * 2 ** 31), lists: [G.lists[0].slice(), guestList.slice()], mission: G.mission,
    tid: TERRAINS[G.terrain] ? G.terrain : ids[Math.floor(Math.random() * ids.length)], mirror: Math.random() < .5 };
  NET.send(cfg); startOnline(cfg);
}
function startOnline(cfg) {
  closeModal(); clearUnits(); $('log').innerHTML = '';
  RNG = seeded(cfg.seed); G.mode = 'online'; G.netCfg = cfg; G.mission = MISSIONS[cfg.mission] ? cfg.mission : 'vorherrschaft';
  G.lists = cfg.lists.map(l => l.filter(t => UT[t])); G.autoDep = [false, false];
  NET.q = []; NET.ow = []; NET.n = 0; NET.chk = {}; NET.desync = false;
  TEAMS[NET.side].name = 'Du'; TEAMS[1 - NET.side].name = 'Gegner';
  log(`Online-Spiel · Mission: ${MISSIONS[G.mission].name}`);
  startDeploy();
}
const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const peerId = code => 'tau-gefecht-' + code;
const gameLink = code => location.href.split(/[?#]/)[0] + '?join=' + code;
let PeerLib = null;
async function loadPeer() { return PeerLib ??= (await import('https://cdn.jsdelivr.net/npm/peerjs@1.5.4/+esm')).Peer; }
function bindConn(c, onOpen) {
  NET.conn = c; NET.send = m => { try { if (c.open) c.send(m); } catch {} };
  c.on('data', netMsg); c.on('open', () => onOpen?.()); c.on('close', netLost); c.on('error', netLost);
}
function useBroadcast(code, onOpen) {   // nur für Tests: zwei Tabs im selben Browser
  const ch = new BroadcastChannel('tau-' + code); NET.send = m => ch.postMessage(m); ch.onmessage = e => netMsg(e.data); NET.bc = ch; onOpen?.();
}
function onlineMenu() {
  modal(`<h2>Online-Spiel</h2><p class="lead">Zu zweit an zwei Geräten: Einer erstellt das Spiel und schickt den Link (oder den Code), der andere tritt bei.
    Die Verbindung läuft direkt zwischen den Browsern.</p>
    <div class="modes"><button class="mode" id="oHost"><b>Spiel erstellen</b><span>Du spielst Orange und legst Mission und Gelände fest.</span></button></div>
    <div class="row" style="margin-top:12px"><input id="oCode" maxlength="5" placeholder="CODE" autocomplete="off" style="text-transform:uppercase;font:600 18px monospace;width:110px;padding:7px 10px;border-radius:8px;border:1px solid var(--line);background:#0003;color:inherit">
    <button class="btn pri" id="oJoin">Beitreten</button><span class="grow"></span><button class="btn" id="oBack">Zurück</button></div>`, d => {
    d.querySelector('#oHost').onclick = () => { NET.side = 0; TEAMS[0].name = 'Du'; TEAMS[1].name = 'Gegner'; army(0); };
    const join = () => { const c = d.querySelector('#oCode').value.trim().toUpperCase(); if (!/^[A-Z0-9]{5}$/.test(c)) { toast('Der Code hat 5 Zeichen.'); return; } NET.code = c; NET.side = 1; TEAMS[1].name = 'Du'; TEAMS[0].name = 'Gegner'; army(1); };
    d.querySelector('#oJoin').onclick = join; d.querySelector('#oCode').onkeydown = e => { if (e.key === 'Enter') join(); };
    d.querySelector('#oBack').onclick = menu;
  });
}
function waitDlg(html, cancel = true) {
  modal(`${html}<div class="row" style="margin-top:14px"><span class="grow"></span>${cancel ? '<button class="btn" id="nCancel">Abbrechen</button>' : ''}</div>`, d => { const b = d.querySelector('#nCancel'); if (b) b.onclick = netClose; });
}
async function onlineHost() {
  G.mode = 'online'; NET.side = 0; TEAMS[0].name = 'Du'; TEAMS[1].name = 'Gegner';
  const code = Array.from({ length: 5 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join(''); NET.code = code;
  const show = () => waitDlg(`<h2>Warte auf Mitspieler …</h2><p class="lead">Schicke diesen Link an deinen Mitspieler:</p>
    <div class="row"><input id="nLink" readonly value="${esc(gameLink(code))}" style="flex:1;min-width:0;padding:7px 10px;border-radius:8px;border:1px solid var(--line);background:#0003;color:inherit"><button class="btn pri" id="nCopy">Kopieren</button></div>
    <p class="lead" style="margin-top:10px">… oder den Code: <b style="font:700 26px monospace;letter-spacing:4px;color:var(--acc)">${code}</b></p>
    <p class="mdesc">Mission: ${MISSIONS[G.mission].name} · Gelände: ${TERRAINS[G.terrain]?.name ?? 'Zufall'}</p>`);
  if (Q.get('net') === 'bc') { useBroadcast(code); show(); dbgCode(code); return; }
  waitDlg('<h2>Verbinde …</h2><p class="lead">Online-Spiel wird vorbereitet.</p>');
  try {
    const Peer = await loadPeer(), peer = NET.peer = new Peer(peerId(code), { debug: 0 });
    peer.on('open', () => { show(); const b = $('modal').querySelector('#nCopy'); if (b) b.onclick = () => { navigator.clipboard?.writeText(gameLink(code)).then(() => toast('Link kopiert.'), () => {}); $('modal').querySelector('#nLink').select(); }; });
    peer.on('connection', c => { if (NET.conn) { c.on('open', () => c.close()); return; } bindConn(c); });
    peer.on('error', e => { if (e.type === 'unavailable-id') { netClose(true); onlineHost(); } else if (!NET.conn) netFail(e); });
  } catch (e) { netFail(e); }
}
async function onlineJoin(list) {
  G.mode = 'online'; NET.side = 1; TEAMS[1].name = 'Du'; TEAMS[0].name = 'Gegner';
  waitDlg(`<h2>Verbinde mit Spiel ${esc(NET.code)} …</h2><p class="lead">Gleich geht es los – der Gastgeber legt Mission und Gelände fest.</p>`);
  const hello = () => NET.send({ t: 'hello', list });
  if (Q.get('net') === 'bc') { useBroadcast(NET.code, hello); return; }
  try {
    const Peer = await loadPeer(), peer = NET.peer = new Peer({ debug: 0 });
    peer.on('open', () => bindConn(peer.connect(peerId(NET.code), { reliable: true, serialization: 'json' }), hello));
    peer.on('error', e => netFail(e.type === 'peer-unavailable' ? 'Kein offenes Spiel mit diesem Code gefunden.' : e));
  } catch (e) { netFail(e); }
}
function netFail(e) {
  if (NET.closing) return;
  console.error(e); netClose(true);
  modal(`<h2>Keine Verbindung</h2><p class="lead">${esc(typeof e === 'string' ? e : 'Die Online-Verbindung konnte nicht aufgebaut werden. Prüfe die Internetverbindung; manche Firmen- oder Mobilnetze blockieren direkte Verbindungen.')}</p>
    <div class="row"><span class="grow"></span><button class="btn pri" id="nOk">Zum Menü</button></div>`, d => d.querySelector('#nOk').onclick = menu);
}
function netLost() {
  if (NET.closing || G.mode !== 'online' || !['deploy', 'play', 'end'].includes(G.phase)) return;
  netClose(true);
  modal(`<h2>Verbindung getrennt</h2><p class="lead">Die Verbindung zum Gegner ist abgebrochen.</p><div class="row"><span class="grow"></span><button class="btn pri" id="nOk">Zum Menü</button></div>`,
    d => d.querySelector('#nOk').onclick = () => { clearUnits(); $('log').innerHTML = ''; menu(); });
}
// Verbindung beenden; ohne quiet zurück ins Hauptmenü
function netClose(quiet = false) {
  NET.closing = true; try { NET.send({ t: 'bye' }); } catch {}
  try { NET.conn?.close(); } catch {} try { NET.peer?.destroy(); } catch {} try { NET.bc?.close(); } catch {}
  NET.conn = NET.peer = NET.bc = null; NET.send = () => {}; NET.q = []; NET.running = false; RNG = Math.random;
  setTimeout(() => { NET.closing = false; }, 0);
  if (!quiet) { G.mode = 'ai'; clearUnits(); $('log').innerHTML = ''; menu(); }
}
const dbgCode = code => { window.__netCode = code; };
// Testhilfen für tools/net-test.mjs
window.__NET = NET;
window.__net = { act, autoDeploy, validTarget: e => validTarget(e), randomList: () => randomList(), hash: netHash,
  hostAs: () => { G.mode = 'online'; NET.side = 0; onlineHost(); }, joinAs: l => { G.lists[1] = l; onlineJoin(l); } };

// ---------- Werkzeugleiste ----------
$('bRules').onclick = () => showRules();
$('bFollow').onclick = () => { G.follow = !G.follow; $('bFollow').textContent = 'Kamera folgt: ' + (G.follow ? 'an' : 'aus'); };
const setSpeed = v => { G.speed = v; $('bSpeed').textContent = 'Tempo: ' + ({ 1: 'normal', 2: 'schnell', 4: 'sehr schnell' })[G.speed]; try { localStorage.setItem('tauSpeed', v); } catch {} };
$('bSpeed').onclick = () => setSpeed(G.speed === 1 ? 2 : G.speed === 2 ? 4 : 1);
try { const v = +localStorage.getItem('tauSpeed'); if ([1, 2, 4].includes(v) && !Q.has('auto')) setSpeed(v); } catch {}
// Überspringen: Leertaste oder Klick auf die Würfel beendet alle Animationen der laufenden Aktivierung sofort
function skipAnims() {
  if (G.phase !== 'play' || !G.busy || G.skip) return;
  G.skip = true; for (const a of [...anims]) { anims.delete(a); a.fn(1); a.res(); } dirty = true;
}
$('dice').onclick = skipAnims;
addEventListener('keydown', e => { if (e.code === 'Space' && G.busy && G.phase === 'play' && !e.target.closest?.('input,textarea')) { e.preventDefault(); skipAnims(); } });
$('bFx').onclick = () => { G.fx = !G.fx; $('bFx').textContent = 'Grafik: ' + (G.fx ? 'hoch' : 'schnell'); dirty = true; };
$('bSnd').onclick = () => { G.sound = !G.sound; $('bSnd').textContent = 'Ton: ' + (G.sound ? 'an' : 'aus'); };
$('logHead').onclick = () => $('logbox').classList.toggle('min');
$('bCam').onclick = () => {
  const t = controls.target.clone(), off = camera.position.clone().sub(t), a0 = Math.atan2(off.x, off.z), r = Math.hypot(off.x, off.z);
  tween(.9, k => { const e = k * k * (3 - 2 * k), a = a0 + Math.PI * e; camera.position.set(t.x + Math.sin(a) * r, camera.position.y, t.z + Math.cos(a) * r); camera.lookAt(t); });
};

// ---------- Hauptschleife ----------
const clock = new THREE.Clock(), NORENDER = Q.has('norender');   // norender: Spiellogik ohne Bildausgabe (Tests)
let lastHover = 0;
function loop() {
  const dt = Math.min(clock.getDelta(), .1);
  let active = controls.update() || dirty;
  for (const a of [...anims]) { a.t += dt; a.fn(Math.min(1, a.t / a.dur)); if (a.t >= a.dur) { anims.delete(a); a.res(); } }
  if (anims.size) active = true;
  for (const u of G.units) if (u.playing) { u.rig.mixer.update(dt); active = true; }
  if (NET.q.length && !NET.running && !G.busy) netPump();
  const now = performance.now(); if (hoverEv && now - lastHover > 40) { lastHover = now; handleHover(); }
  if (!active || NORENDER) return;
  dirty = false; renderAll(); placeLabels();
}

// ---------- Start ----------
buildBoard(); resize(); if (!Q.has('sim')) setTimeout(makePortraits, 300);
if (!Q.has('sim')) renderer.setAnimationLoop(loop);
$('load').remove();
updateHud();
async function simulate(n = 50, opts = {}) {
  const out = [], saved = { speed: G.speed, follow: G.follow, sound: G.sound, mode: G.mode, mission: G.mission, terrain: G.terrain }; G.instant = true; G.follow = false;
  for (let i = 0; i < n; i++) {
    clearUnits(); G.mode = 'aivai'; G.greedy = opts.greedy ?? null; G.aiLvl = opts.ai ?? null; G.terrain = opts.terrain ?? 'zufall'; G.diff = opts.diff ?? G.diff; G.mission = opts.mission ?? Object.keys(MISSIONS)[i % 3]; G.result = null;
    G.lists = [opts.a ?? randomList(), opts.b ?? randomList()]; if (opts.mirror) G.lists[1] = G.lists[0].slice();
    startDeploy();
    // Spiellogik läuft im Sofortmodus komplett über Promises – ohne Timer, damit es auch kopflos schnell geht
    for (let k = 0; k < 500000 && !G.result; k++) await null;
    out.push({ lists: G.lists.map(l => l.slice()), mission: G.mission, terrain: LAYOUT.id, ...G.result, units: G.units.map(u => ({ type: u.type, side: u.side, alive: u.alive, dmg: u.stats.dmg, kills: u.stats.kills })) });
  }
  G.instant = false; G.greedy = null; G.aiLvl = null; Object.assign(G, saved); return out;
}
window.__sim = simulate; window.__finish = () => { G.instant = false; finish(); };
window.__G = G; window.__UT = UT; window.__dbg = { navPlane, navCv, navTex, overlay, setLayout }; window.__cam = { camera, controls, project: (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera), r = renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; }, dirty: () => { dirty = true; } }; window.__start = (mode, a, b) => { G.mode = mode; G.lists = [a ?? randomList(), b ?? randomList()]; if (mode === 'aivai') { TEAMS[0].name = 'Computer A'; TEAMS[1].name = 'Computer B'; } closeModal(); startDeploy(); };
if (Q.get('fx') === '0') { G.fx = false; $('bFx').textContent = 'Grafik: schnell'; }
if (Q.has('cam')) { const c = Q.get('cam').split(',').map(Number); camera.position.set(c[0], c[1], c[2]); controls.target.set(c[3], c[4], c[5]); }
// Auswertung vieler Simulationen: Siegquoten je Seite und Einheit, Auslöschungen, Punkteabstand
function summarize(res) {
  const ty = {}, sides = [0, 0, 0];
  for (const r of res) {
    sides[r.win ?? 2]++;
    for (const s of [0, 1]) {
      const score = r.win === null ? .5 : r.win === s ? 1 : 0;
      for (const t of new Set(r.lists[s])) { const o = ty[t] ??= { n: 0, w: 0, dmg: 0, surv: 0, cnt: 0 }; o.n++; o.w += score; }
      for (const u of r.units.filter(u => u.side === s)) { const o = ty[u.type]; o.cnt++; o.dmg += u.dmg; o.surv += u.alive; }
    }
  }
  return { games: res.length, sides, wipes: res.filter(r => r.wiped !== null).length,
    margin: +(res.reduce((a, r) => a + Math.abs(r.vp[0] - r.vp[1]), 0) / res.length).toFixed(2),
    units: Object.fromEntries(Object.entries(ty).map(([t, o]) => [t, { pts: UT[t].pts, win: +(o.w / o.n).toFixed(3), dmg: +(o.dmg / o.cnt).toFixed(2), surv: +(o.surv / o.cnt).toFixed(2) }])) };
}
window.__summarize = summarize;
// Kopflose Simulation (tools/sim.sh): ?sim=200[&greedy=1][&diff=schwer][&ai=schwer,greedy][&mission=kopfgeld] → JSON in <pre id="simresult">
if (Q.has('sim')) {
  G.fx = false; G.sound = false; $('modal').classList.remove('on');
  simulate(+Q.get('sim') || 100, { greedy: Q.has('greedy') ? +Q.get('greedy') : undefined, diff: Q.get('diff') ?? undefined, mission: Q.get('mission') ?? undefined, ai: Q.get('ai')?.split(','), mirror: Q.has('mirror'), terrain: Q.get('terrain') ?? undefined })
    .then(res => { const pre = document.createElement('pre'); pre.id = 'simresult'; pre.textContent = JSON.stringify(summarize(res)); document.body.append(pre); })
    .catch(e => { const pre = document.createElement('pre'); pre.id = 'simresult'; pre.textContent = JSON.stringify({ error: String(e?.stack || e) }); document.body.append(pre); });
} else if (Q.has('auto')) { G.speed = +Q.get('auto') || 4; G.sound = false; window.__start('aivai'); }
else if (/^[A-Z0-9]{5}$/i.test(Q.get('join') ?? '')) { G.mode = 'online'; NET.side = 1; NET.code = Q.get('join').toUpperCase(); TEAMS[1].name = 'Du'; TEAMS[0].name = 'Gegner'; army(1); }
else if (!Q.has('sim')) menu();
