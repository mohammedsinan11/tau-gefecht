const MODELS = [
  { id: 'katze', name: 'Geflügelte Katze', sub: '3D-Druck, bemalt', photos: ['1089'], build: cat,
    desc: 'Sitzende Katze mit Fledermausflügeln, Halskrause und um die Pfoten gelegtem Schwanz. Bemalt als getigerte Katze mit weißer Brust, grünen Augen und dunklen Flügeln, auf einer Steinbase. Animationen: Fliegen und Fauchen.' },
  { id: 'crisis_blau', name: 'XV8 Crisis – sand/blau', sub: 'Bemalt, roter Base', photos: ['1091', '1090'], build: crisisBlue,
    desc: 'Crisis Battlesuit mit einem gestreckten und einem erhobenen Waffenarm (blaue Energiezellen) und einem Schildgenerator an der Hüfte.' },
  { id: 'broadside', name: 'XV88 Broadside', sub: 'Bemalt wie die Crisis Suits', photos: ['1092'], build: broadside,
    desc: 'Massiger Anzug mit gestapelten Beinpanzern, langer Rail-Kanone, schwerer Doppelwaffe, Gatling-Arm und Faust. Das Original ist nur grundiert; hier im Farbschema des grau/roten Crisis Suits bemalt. Base mit Schotter und Wrackteil.' },
  { id: 'crisis_rot', name: 'XV8 Crisis – sand/grau/rot', sub: 'Bemalt, roter Base', photos: ['1094', '1093', '1098', '1099', '1100'], build: crisisRed,
    desc: 'Crisis Battlesuit mit zwei Raketenwerfern auf den Schultern (blau-silberne Kappen), grauer Brustplatte, dunklen Schulterpanzern und roten Schienbeinen.' },
  { id: 'stealth', name: 'XV25 Stealth Suit', sub: 'Schwarzer Base', photos: ['1097', '1095', '1096'], build: stealth,
    desc: 'Kompakter, runder Stealth-Anzug in Sand mit roten Panel-Linien. Burst Cannon im rechten Arm, kleines Gerät in der linken Hand.' },
  { id: 'pathfinder', name: 'Pathfinder', sub: 'Rail Rifle', photos: ['1101'], build: pathfinder,
    desc: 'Infanterist mit weißer Brustplatte, rotem Abzeichen, Helmband mit rotem Sensor, blauen Stiefeln und langem Rail Rifle mit Kupferspule.' },
  { id: 'firewarrior', name: "Fire Warrior / Shas'ui", sub: 'Gras-Base', photos: ['1102', '1103'], build: firewarrior,
    desc: 'Weißer Helm mit rotem Haarbusch und „III“-Abzeichen, große Schulterpanzer, Pulswaffe mit Munitionstrommel. Base mit Steinen und Grasbüschel.' },
];

// ---------- Szene ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: location.search.includes('sheet=') });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92;
stage.prepend(renderer.domElement);
const scene = new THREE.Scene();
const SHEET = new URLSearchParams(location.search).get('sheet');
if (SHEET) document.body.classList.add('sheet');
// Hintergrund als Verlauf (statt CSS), damit die Nachbearbeitung ihn mitbekommt
{
  const cs = getComputedStyle(stage), cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const x = cv.getContext('2d'), gr = x.createRadialGradient(128, 110, 10, 128, 128, 190);
  gr.addColorStop(0, cs.getPropertyValue('--stage1').trim()); gr.addColorStop(1, cs.getPropertyValue('--stage2').trim());
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  scene.background = new THREE.CanvasTexture(cv); scene.background.colorSpace = THREE.SRGBColorSpace;
}
const camera = new THREE.PerspectiveCamera(35, 1, .5, 2000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.6;
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .55;
scene.add(new THREE.HemisphereLight(0xffffff, 0x50505a, .6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(30, 140, 40); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 300 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .03;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xbfd4ff, .8); rim.position.set(-60, 40, -70); scene.add(rim);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: .22 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; // nicht in die Szene: der AO-Pass würde sonst einen Horizont zeichnen
const { composer, cavity, maskTarget, render: renderFrame } = makeFx(renderer, scene, camera);

let current = null, animName = '';
const built = {}, clock = new THREE.Clock();
const rigOf = m => m?.group?.userData.rig;
const baseOf = m => m?.group?.getObjectByName('base');
function frame() {
  const box = new THREE.Box3().setFromObject(current.group);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const fit = Math.max(size.y, size.x / camera.aspect, size.z / camera.aspect);
  const dist = fit / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.15 + Math.max(size.x, size.z) / 2;
  controls.target.copy(c);
  camera.position.copy(c).add(new THREE.Vector3(.55, .35, 1).normalize().multiplyScalar(dist));
  controls.update();
}
function setAnim(name) {
  animName = name;
  const rig = rigOf(current);
  if (rig) name ? rig.play(name) : rig.reset();
  document.querySelectorAll('#anim button').forEach(b => {
    b.textContent = rig?.labels[b.dataset.a] ?? ({ '': 'Pose', Gehen: 'Gehen', Schiessen: 'Schießen' })[b.dataset.a];
    b.classList.toggle('on', b.dataset.a === name);
    b.disabled = !rig && !!b.dataset.a;
  });
}
function show(i) {
  const m = MODELS[i];
  if (current) { rigOf(current)?.reset(); scene.remove(current.group); }
  m.group = built[m.id] ??= m.build();
  scene.add(m.group); current = m; frame();
  const b = baseOf(m); if (b) b.visible = document.getElementById('showBase').checked;
  setAnim(rigOf(m) ? animName : '');
  document.querySelectorAll('.item').forEach((el, j) => el.classList.toggle('on', j === i));
  document.getElementById('title').textContent = m.name;
  document.getElementById('desc').textContent = m.desc;
  const ph = document.getElementById('photos'); ph.innerHTML = '';
  for (const id of m.photos) {
    const f = document.createElement('figure');
    f.innerHTML = `<img alt="IMG_${id}" src="${PHOTOS[id]}"><figcaption>IMG_${id}</figcaption>`;
    f.querySelector('img').onclick = () => { lb.querySelector('img').src = PHOTOS[id]; lb.classList.add('on'); };
    ph.append(f);
  }
  try { localStorage.setItem('figur', i); } catch {}
}
const list = document.getElementById('list');
MODELS.forEach((m, i) => {
  const b = document.createElement('button'); b.className = 'item';
  b.innerHTML = `<img alt="" src="${PHOTOS[m.photos[0]]}"><div><b>${m.name}</b><span>${m.sub}</span></div>`;
  b.onclick = () => show(i); list.append(b);
});
const lb = document.getElementById('lb'); lb.onclick = () => lb.classList.remove('on');

const rotBtn = document.getElementById('rot');
rotBtn.onclick = () => { controls.autoRotate = !controls.autoRotate; rotBtn.textContent = 'Auto-Drehen: ' + (controls.autoRotate ? 'an' : 'aus'); };
document.getElementById('reset').onclick = frame;
document.querySelectorAll('#anim button').forEach(b => b.onclick = () => setAnim(b.dataset.a));
document.getElementById('showBase').onchange = e => { const b = baseOf(current); if (b) b.visible = e.target.checked; };
document.getElementById('fx').onchange = e => { cavity.uniforms.enabled.value = e.target.checked ? 1 : 0; };
function download(data, name, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
// Export immer aus der Ruhepose; danach läuft die Animation weiter
function atRest(fn) {
  const rig = rigOf(current), b = baseOf(current), vis = b?.visible;
  rig?.reset(); if (b) b.visible = true; current.group.updateMatrixWorld(true);
  try { return fn(); } finally { if (b) b.visible = vis; if (rig && animName) rig.play(animName); }
}
document.getElementById('stl').onclick = () => atRest(() => {
  // Standmodell mit Base; für Slicer Z nach oben drehen
  const wrap = new THREE.Group(); wrap.add(current.group.clone()); wrap.rotation.x = Math.PI / 2; wrap.updateMatrixWorld(true);
  download(new STLExporter().parse(wrap, { binary: true }), current.id + '.stl', 'model/stl');
});
document.getElementById('glb').onclick = () => atRest(() => {
  const rig = rigOf(current);
  new GLTFExporter().parse(current.group, data => download(data, current.id + '.glb', 'model/gltf-binary'),
    err => alert('GLB-Export fehlgeschlagen: ' + err), { binary: true, animations: rig?.clips ?? [] });
});

function resize() {
  if (SHEET) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  cavity.uniforms.resolution.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()); maskTarget.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage); resize();
let start = 0; try { start = +localStorage.getItem('figur') || 0; } catch {}
window.__show = i => { controls.autoRotate = false; show(i); };
window.__anim = setAnim;
window.__cur = () => current?.group;
window.__THREE = THREE;
// Render-Bogen für Bewertungen: ?sheet=<id> zeigt 4 Ansichten (vorne, 3/4, Seite, hinten);
// mit &anim=Gehen|Schiessen stattdessen 4 Zeitpunkte der Animation aus der 3/4-Ansicht
if (SHEET) {
  const q = new URLSearchParams(location.search), ANIM = q.get('anim');
  show(Math.max(0, MODELS.findIndex(m => m.id === SHEET)));
  const rig = rigOf(current), clip = ANIM && rig?.clips.find(c => c.name === ANIM);
  const box = new THREE.Box3().setFromObject(current.group);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  // Schießen: Zeitpunkte rund um den ersten Rückstoß; Gehen: gleichmäßig über den Zyklus
  const times = ANIM === 'Schiessen' ? [0, .05, .14, .4] : [0, .25, .5, .75].map(f => f * (clip?.duration ?? 1));
  const views = clip ? times.map(t => [.75, .2, .65, `${ANIM} t=${t.toFixed(2)}s`, t])
    : [[0, .12, 1, 'vorne'], [-.8, .3, .75, '3/4 links'], [1, .12, 0, 'Seite rechts'], [.35, .25, -1, 'hinten']];
  // Jede Ansicht einzeln (mit AO) rendern und in ein 2D-Raster kopieren
  const W = stage.clientWidth, H = stage.clientHeight, w = Math.floor(W / 2), h = Math.floor(H / 2);
  renderer.setPixelRatio(1); renderer.setSize(w, h, false); composer.setPixelRatio(1); composer.setSize(w, h); cavity.uniforms.resolution.value.set(w, h); maskTarget.setSize(w, h);
  if (new URLSearchParams(location.search).get('fx') === '0') cavity.uniforms.enabled.value = 0;
  renderer.domElement.style.display = 'none';
  const out = document.createElement('canvas'); out.width = W; out.height = H; out.style.cssText = 'width:100%;height:100%;display:block';
  stage.prepend(out); const ctx = out.getContext('2d');
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const dist = Math.max(size.y, size.x / camera.aspect, size.z / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.08 + Math.max(size.x, size.z) / 2;
  if (clip) rig.mixer.clipAction(clip).play();
  const draw = () => views.forEach(([x, y, z, , t], i) => {
    if (clip) rig.mixer.setTime(t);
    camera.position.copy(c).add(new THREE.Vector3(x, y, z).normalize().multiplyScalar(dist)); camera.lookAt(c);
    renderFrame(); ctx.drawImage(renderer.domElement, (i % 2) * w, i < 2 ? 0 : h, w, h);
  });
  views.forEach(([, , , t], i) => { const d = document.createElement('div'); d.className = 'vlabel'; d.textContent = t; d.style.left = (i % 2 ? 50 : 0) + '%'; d.style.top = (i < 2 ? 0 : 50) + '%'; stage.append(d); });
  let n = 0; renderer.setAnimationLoop(() => { draw(); if (++n >= 3) renderer.setAnimationLoop(null); });
} else {
  show(Math.min(start, MODELS.length - 1));
  renderer.setAnimationLoop(() => { const dt = clock.getDelta(); rigOf(current)?.mixer.update(dt); controls.update(); renderFrame(); });
}
// Selbsttest (?selftest): baut alle Figuren, prüft Rig, Clips, STL- und GLB-Export, schreibt das Ergebnis als JSON in die Seite
async function selftest() {
  const res = [];
  for (const m of MODELS) {
    const r = { id: m.id };
    try {
      const g = m.build(), rig = g.userData.rig;
      let shaderErr = 0; renderer.debug.onShaderError = () => { shaderErr++; };
      const sc = new THREE.Scene(); sc.add(g); renderer.compile(sc, camera); renderer.debug.onShaderError = null;
      if (shaderErr) r.fehler = shaderErr + ' Shader-Fehler';
      r.joints = rig ? Object.keys(rig.j).length : 0;
      r.clips = rig?.clips.map(c => `${c.name}:${c.tracks.length} Spuren/${c.duration.toFixed(2)}s`);
      const wrap = new THREE.Group(); wrap.add(g); wrap.updateMatrixWorld(true);
      r.stlKB = Math.round(new STLExporter().parse(wrap, { binary: true }).byteLength / 1024);
      const glb = await new GLTFExporter().parseAsync(g, { binary: true, animations: rig?.clips ?? [] });
      r.glbKB = Math.round(glb.byteLength / 1024);
    } catch (e) { r.fehler = e.message; }
    res.push(r);
  }
  const pre = document.createElement('pre'); pre.id = 'selftest'; pre.textContent = JSON.stringify(res); document.body.append(pre);
  return res;
}
window.__selftest = selftest;
if (new URLSearchParams(location.search).has('selftest')) selftest();
