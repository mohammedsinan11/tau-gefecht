// ---------- XV8 Crisis Battlesuit (detailliert, geriggt) ----------
// Gelenke: root → pelvis → hip/knee/ankle (Beine) und torso → shoulder/elbow/wrist (Arme).
// Der Oberkörper ist in "t-Koordinaten" gebaut (Welt-y minus XDY); off() liefert dafür passende Bauräume.
const XDY = 3.5;
const sfx = s => s > 0 ? '_L' : '_R';   // s = +1 ist die linke Seite der Figur (Figur schaut nach +z)
function off(rig, name, dy = XDY) { const o = new THREE.Group(); o.position.y = dy; rig.s(name).add(o); return o; }
const TW = p => [p[0], p[1] + XDY, p[2]];
function xv8(rig, k) {
  const D = k.dark;
  rig.joint('root', null, [0, 0, 0]);
  rig.joint('pelvis', 'root', [0, 28, 0]);
  const legs = k.legs ?? { '-1': [[-5.2, 28, 0], [-8.2, 21, 5.6], [-9.6, 8.8, -1.2]], '1': [[5.2, 28, 0], [8.2, 21, 5.6], [9.6, 8.8, -1.2]] };
  for (const s of [-1, 1]) {
    const [hip, knee, ank] = legs[s], n = ['hip', 'knee', 'ankle'].map(x => x + sfx(s));
    const gh = rig.joint(n[0], 'pelvis', hip), gk = rig.joint(n[1], n[0], knee), ga = rig.joint(n[2], n[1], ank);
    rig.leg(s, hip, knee, ank, n);
    S(gh, 2.6, D, hip);
    // Oberschenkel: gerippter schwarzer Kern, optional Seitenplatte
    const th = limb(gh, hip, knee), L1 = th.len;
    B(th, 5.6, 5.4, L1, D, [0, 0, L1 / 2]);
    for (let i = 0; i < 4; i++) B(th, 5.9, .55, 1, '#34363a', [0, -.6, L1 * (.22 + i * .17)], undefined, { round: .2 });
    // gewölbte Oberschenkelschale vorn/außen, mit dunkler Fuge und Randlinie
    const tp = shell(th, [[L1 * .02, 3.4], [L1 * .14, 4.0], [L1 * .5, 3.8], [L1 * .82, 3.2], [L1 * .97, 2.4]], 1.3, k.thighPlate, [s * .7, 2.7, 0], [0, 0, 0], { arch: 2.2, bow: .9 });
    for (const z of [L1 * .3, L1 * .62]) loftRing(tp, z, .1, D, Math.PI * .58, Math.PI * .92, 10, -.04);
    B(th, 1.1, 5, L1 * .65, k.thighPlate, [s * 3.2, .6, L1 * .45]);
    for (let i = 0; i < 2; i++) B(th, .3, 2.6, .4, '#1a1b1d', [s * 3.8, .6, L1 * (.35 + i * .2)], undefined, { round: 0 });
    B(th, .9, .9, L1 * .55, METAL, [0, -3, L1 * .5], undefined, { m: .5, r: .4 });
    S(gk, 2.4, D, knee); C(gk, 2.3, 2.3, 5.4, '#3a3d42', knee, [0, 0, Math.PI / 2], { seg: 20 });
    // Schienbein: großer, nach unten schmaler werdender Panzer, Knieplatte, Akzent, Waden
    const sh = limb(gk, knee, ank), L2 = sh.len;
    B(sh, 2.2, 2.4, L2, D, [0, 0, L2 / 2]);
    side(sh, [[-1.6, 1.6], [L2 - 1.4, 1.6], [L2 - 2, 3], [2.6, 5], [-1, 4.8]], 4.4, k.shin);
    const yf = z => z < 2.6 ? 4.8 + (z + 1) * .055 : 5 - (z - 2.6) * 2 / (L2 - 4.6);
    if (k.shinBand) for (const t of [.42, .62]) {
      const z0 = L2 * t, z1 = z0 + .9;
      side(sh, [[z0, yf(z0) - 1.4], [z1, yf(z1) - 1.4], [z1, yf(z1) + .3], [z0, yf(z0) + .3]], 6.5, k.shinBand, undefined, undefined, { bevel: .1 });
    }
    [k.shinAcc, k.shin2 ?? k.shin, k.shin2 ?? k.shin].forEach((c, i) => {
      const z0 = -1.2 + i * 3.1, z1 = z0 + 3.5;
      side(sh, [[z0, yf(z0) - .8], [z1, yf(z1) - .8], [z1 - .5, yf(z1) + .65], [z0, yf(z0) + .95]], 6.5 - i * .5, c);
    });
    side(sh, [[-4, 2.4], [-.6, 2.8], [-.8, 4.6], [-3.4, 4.2]], 5, k.knee);
    B(sh, 2.4, 1.6, L2 * .55, k.calf ?? k.shin, [0, -1.7, L2 * .45]);
    for (const zz of [.3, .7]) C(sh, .45, .45, 2.8, METAL, [0, -1.9, L2 * zz], [0, 0, Math.PI / 2], { m: .5 });
    for (let i = 0; i < 3; i++) B(sh, .3, 2.2, .45, D, [s * 3.15, 2.6, L2 * (.35 + i * .13)], undefined, { round: 0 });
    if (k.heavy) {
      th.scale.set(1, 1, 1); sh.scale.set(1.3, 1.25, 1);
      for (let i = 0; i < 5; i++) B(th, 7.4, 6.6, 1.5, i % 2 ? (k.main2 ?? k.thighPlate) : k.thighPlate, [0, .5, L1 * (.1 + i * .19)], undefined, { round: .4 });
      for (let i = 0; i < 3; i++) B(sh, 6.6, 5.8, 1.6, i % 2 ? (k.shin2 ?? k.shin) : k.shin, [0, .8, L2 * (.15 + i * .25)], undefined, { round: .35 });
      // Broadside: zusätzliche Außenpanzer und gestapelte Schienbeinplatten
      side(th, [[0, -1.6], [L1 * .9, -1.4], [L1 * .8, 3.6], [.6, 3.4]], 1.4, k.thighPlate, [s * 3.4, 0, 0]);
      for (let i = 0; i < 4; i++) B(sh, 7 - i * .3, 1.1, 2.4, i % 2 ? (k.shin2 ?? k.shin) : k.shin, [0, 4.4 - i * .45, L2 * (.22 + i * .17)], [.25, 0, 0], { round: .3 });
      side(sh, [[-1, -2], [L2 - 1.5, -1.6], [L2 - 2, 3.2], [-1, 4]], 1.4, k.shin2 ?? k.shin, [s * 3.7, 0, 0]);
    }
    // Fuß: Mittelplatte, zwei gespreizte Zehen, Fersensporn
    const fx = ank[0], fz = ank[2] + 1.6;
    S(ga, 2, D, ank);
    B(ga, 3.4, 3, 3.6, D, [fx, 6.6, fz - 1.2]);
    side(ga, [[-2.2, 4], [2.8, 4], [2.2, 5.8], [-1.4, 6.6]], 4.4, k.foot, [fx, 0, fz]);
    for (const t of [-1, 1]) side(ga, [[0, 4], [5.6, 4], [5.2, 5], [.4, 6]], 2.2, k.foot, [fx + t * 1.4, 0, fz + 1.6], [0, t * .3, 0]);
    side(ga, [[0, 4], [-5, 4], [-4.4, 5], [0, 6.2]], 2.3, k.foot2 ?? k.foot, [fx, 0, fz - 2]);
    if (k.heavy) { B(ga, 7.6, 1.4, 9.4, k.foot, [fx, 4.7, fz + .6], undefined, { round: .4 }); for (const t of [-1, 0, 1]) B(ga, 2.2, 1.2, 2.6, k.foot2 ?? '#bfb393', [fx + t * 2.5, 4.6, fz + 6], [.15, 0, 0], { round: .35 }); }
  }
  rig.joint('torso', 'pelvis', [0, 27.5 + XDY, 0]);
  const t = off(rig, 'torso');
  // Becken, seitliche Hüftplatten, gerippte Taille
  B(t, 10, 4, 7, D, [0, 25, -.3]);
  prism(t, [[-3, 2.2], [3, 2.2], [2, -2.6], [-2, -2.6]], 2, k.main, [0, 25, 3.9], [-.2, 0, 0]);
  for (const s of [-1, 1]) side(t, [[-2.5, 27.2], [2.5, 27.2], [2, 23.4], [-2, 23]], 1.2, k.main, [s * 5.7, 0, .3], [0, 0, s * .15]);
  for (let i = 0; i < 3; i++) B(t, 7 - i * .4, 1.3, 5.4, i % 2 ? '#3a3c40' : D, [0, 27.6 + i * 1.35, -.3]);
  for (const s of [-1, 1]) rod(t, [s * 3.8, 25.5, -1], [s * 4.3, 31, -1], .4, METAL, { m: .5, r: .4 });
  // Rumpf als nach vorn gezogener Keil
  side(t, [[-5.5, 31.2], [4.4, 31.2], [11, 35.6], [8.6, 39.2], [-4.6, 39.8], [-6.4, 35.4]], 7, k.chestCore ?? k.main);
  for (const s of [-1, 1]) side(t, [[-5.5, 31.2], [3.2, 31.2], [8.4, 35.6], [6.8, 39.2], [-4.6, 39.8], [-6.4, 35.4]], 2.4, k.main, [s * 4.6, 0, 0]);
  for (const s of [-1, 1]) side(t, [[-5.5, 31.2], [1.6, 31.2], [5.4, 35.6], [4.8, 39.2], [-4.6, 39.8], [-6.4, 35.4]], 2.6, k.main, [s * 6.9, 0, 0]);
  for (const s of [-1, 1]) {
    // obere Brust: Fasenplatten links/rechts der Mittelkante
    const ug = new THREE.Group(); ug.position.set(0, 37.4, 10.2); ug.rotation.set(-.42, s * .62, 0); t.add(ug);
    prism(ug, [[.4 * s, -2.4], [7.8 * s, -2], [7.4 * s, 2.3], [.4 * s, 2.6]], 1.1, k.upperChest ?? k.main2);
    // Unterbrust: zweigeteilter Panzerlatz
    const pg = new THREE.Group(); pg.position.set(0, 33.3, 8.6); pg.rotation.set(.78, s * .3, 0); t.add(pg);
    prism(pg, [[.9 * s, -3], [7 * s, -2.4], [7.4 * s, 2.6], [.9 * s, 3]], 1.4, k.plate);
  }
  if (k.chestDot) S(t, 1.1, k.chestDot, [0, 31.6, 5.9], [1, 1, .6], undefined, { r: .3 });
  if (k.port !== false) B(t, 2.2, 1.4, .8, D, [0, 34.2, 10.1], [.6, 0, 0], { round: .15 });
  { const pg = new THREE.Group(); pg.position.set(0, 26.6, 4.4); t.add(pg);
    T(pg, .95, .25, D); C(pg, .85, .85, .5, '#5a5f66', undefined, [Math.PI / 2, 0, 0], { m: .5 }); }
  if (k.midPanel) B(t, 1.4, 6, 1, k.midPanel, [0, 34.2, 9.6], [.4, 0, 0]);
  prism(t, [[-8.6, -1.1], [8.6, -1.1], [7, 1.1], [-7, 1.1]], 9, k.main, [0, 40, -1]);
  // Kopf: eigener Sensorblock, nach vorn über die Brustkante gezogen, halb im Kragen
  const hw = k.headW ?? 6.2;
  if (!k.hood) {
  if (k.collar) B(t, hw + 2.6, 2.6, 7, k.dark, [0, 39.2, 5.4], undefined, { round: .4 });
  side(t, [[-.5, 37.8], [9.4, 37.8], [11.7, 39.4], [11.1, 43], [-.5, 43.4]], hw, k.head);
  B(t, hw * .62, 1.2, .6, D, [0, 41, 11.5], undefined, { round: .15 });
  S(t, .75, k.eye, [0, 41, 11.85], [1, 1, .55], undefined, { r: .2 });
  B(t, 2.6, .8, 3, k.head, [0, 43.7, 3.5]);
  for (const s of [-1, 1]) {
    if (hw < 5) S(t, .45, '#4fa3d9', [s * (hw / 2 + .1), 41.6, 8.4], [.5, 1, 1], undefined, { r: .2 });
    side(t, [[0, 37.8], [5.5, 37.8], [5, 41], [0, 41.5]], 1.4, k.main, [s * (hw / 2 + .7), 0, .6]);
  }
  } else {
    // hohe, kastige Haube mit dunklem Visier (Broadside)
    side(t, [[-1, 38], [8.6, 38], [9.8, 40.4], [9.2, 50], [-1, 50.6]], 5.4, k.head);
    B(t, 4.4, 4.6, 1.2, '#101112', [0, 45, 9.75], [-.06, 0, 0], { round: .25 });
    S(t, .4, k.eye, [0, 45, 10.4], [1, 1, .5], undefined, { r: .2 });
    B(t, 4.8, .8, 6.4, k.main, [0, 50.9, 3.6], undefined, { round: .3 });
  }
  if (k.antenna) rod(t, [2.6, 43, 1], [3.4, 50, 0], .25, D);
  if (k.dome) {
    S(t, 2.6, k.head, [0, 44.2, 4.4], [1, .75, 1]);
    for (const [x, y] of [[-1, 44.2], [1, 44.2], [0, 45.2]]) S(t, .45, '#4fa3d9', [x, y, 6.85], [1, 1, .5], undefined, { r: .2 });
    prism(t, [[-1, 0], [1, 0], [.4, 9], [-.4, 7]], 1, k.main, [0, 40.4, -7.6], [-.35, 0, 0]);
  }
  // Schultern: kompakte facettierte Kappen
  for (const s of [-1, 1]) {
    const pc = s === -1 && k.padL ? k.padL : k.pad;
    S(t, 2.4, D, [s * 8.8, 36.5, -.3]);
    const pd = new THREE.Group(); pd.position.set(s * 11.8, 35.4, -.3); pd.rotation.set(0, 0, s * -.06); t.add(pd);
    // große, um die Schulter gewölbte Panzerschale (außen) mit innerer Stufenplatte
    B(pd, 2.4, 9.6, 7.4, D, [s * -.6, -1.4, .2], undefined, { round: .6 });
    const sg = basis(pd, [s * .4, 0, 0], [0, 0, s], [s, 0, 0], [0, 1, 0]);
    const outer = shell(sg, [[-7.2, 3.8], [-5.6, 4.9], [-1.5, 5.5], [2.2, 5.2], [4.2, 3.9], [5.0, 1.6]], 2.3, pc, [0, 0, .5], [0, 0, 0], { arch: 3.0, bow: 1.0, n: 44 });
    shell(sg, [[-5.8, 2.4], [-4.2, 3.2], [-1, 3.6], [1.8, 3.4], [3.2, 2.5], [3.7, 1]], .8, s === -1 && k.padL ? pc : k.pad2, [0, .95, -.3], [0, 0, 0], { arch: 1.2, bow: .5 });
    loftRing(outer, -4.6, .14, D, Math.PI * .2, Math.PI * .8, 16, -.05);
    if (!(k.emblem && s === -1)) { const dr = k.discR ?? 1.35; C(pd, dr, dr, .45, k.disc ?? '#8a7a5a', [s * 2.45, -.6, 0], [0, 0, Math.PI / 2], { m: .6, r: .35 }); T(pd, dr + .05, .15, D, [s * 2.4, -.6, 0], [0, Math.PI / 2, 0]); }
    if (k.emblem && s === -1) C(pd, 1.4, 1.4, .5, k.emblem, [s * 2.35, -.4, 0], [0, 0, Math.PI / 2], { r: .3 });
  }
  // Sprungmodul: Kern, zwei Düsen, hohe Finnen/Pylonen hinter dem Kopf
  side(t, [[-5.5, 30.5], [-10.5, 31.5], [-11.5, 36], [-10.2, 39.4], [-5.5, 39.4]], 10, k.main);
  B(t, 7, 2.4, 1.4, D, [0, 33, -11.4]);
  T(t, 1.9, .5, D, [0, 37.2, -11.5]); C(t, 1.6, 1.6, .4, '#3a3d42', [0, 37.2, -11.5], [Math.PI / 2, 0, 0]); C(t, .7, .7, .5, '#5a5f66', [0, 37.2, -11.55], [Math.PI / 2, 0, 0], { m: .5 });
  for (let i = 0; i < 4; i++) B(t, 5.6, .3, .5, k.main2, [0, 32.4 + i * .45, -12.1], undefined, { round: 0 });
  for (const s of [-1, 1]) {
    C(t, 2.7, 2.7, 8, k.main, [s * 6, 32.6, -10]);
    for (const y of [30.2, 31.5]) C(t, 2.85, 2.85, .4, D, [s * 6, y, -10]);
    C(t, 2.2, 3, 2.6, D, [s * 6, 27.4, -10]);
    C(t, 1.6, 1.6, .3, '#111', [s * 6, 26.1, -10]);
    const fn = new THREE.Group(); fn.position.set(s * 5.4, 43, -8.6); fn.rotation.set(-.12, 0, s * -.08); t.add(fn);
    prism(fn, [[-1.9, -9], [1.9, -9], [2.7, 2.6], [1.9, 7.5], [-1.5, 7.5], [-2.3, 2.6]].map(([x, y]) => [x * s, y]), 3.4, k.main);
    for (let i = 0; i < 6; i++) B(fn, 1.1, .42, 3.6, D, [s * 1.9, -7 + i * 1.65, 0], [0, 0, s * .08], { round: 0 });
    prism(fn, [[-.9, 3.6], [.9, 3.6], [.7, 6.4], [-.7, 6.4]], .3, D, [0, 0, -1.72], undefined, { bevel: .05, cham: .2 });
  }
  return t;
}
// Arm mit Oberarm, großem gepanzertem Unterarm und Faust (Gelenke shoulder/elbow/wrist, t-Koordinaten);
// liefert das Unterarm-Koordinatensystem (bewegt sich mit dem Ellbogen)
function xvArm(rig, k, s, elbow, wrist, handTo) {
  const D = k.dark, sh = [s * 10.6, 35, -.3], x = sfx(s);
  rig.joint('shoulder' + x, 'torso', TW(sh)); rig.joint('elbow' + x, 'shoulder' + x, TW(elbow)); rig.joint('wrist' + x, 'elbow' + x, TW(wrist));
  rig.arms.push({ joint: 'shoulder' + x, side: s });
  const ta = off(rig, 'shoulder' + x), te = off(rig, 'elbow' + x), tw = off(rig, 'wrist' + x);
  const ua = limb(ta, sh, elbow);
  B(ua, 3, 3, ua.len, D, [0, 0, ua.len / 2]);
  B(ua, 3.6, 3.8, ua.len * .55, k.upper, [0, .3, ua.len * .5]);
  S(te, 2.2, D, elbow);
  const fa = limb(te, elbow, wrist, [0, 1, 0]), L = fa.len;
  B(fa, 3.4, 3.4, L, D, [0, 0, L / 2]);
  side(fa, [[-.8, -3], [L - .3, -2.6], [L + .4, 0], [L - .3, 3], [-.8, 3.3], [-1.6, 0]], 6, k.main);
  B(fa, 1, 4, L * .7, k.main2, [s * 3.3, 0, L * .45]);
  for (let i = 0; i < 2; i++) B(fa, 1.2, .35, .5, D, [s * 3.6, .5 - i * 1, L * .3], undefined, { round: 0 });
  const hd = limb(tw, wrist, handTo);
  B(hd, 3.2, 3, 3, D, [0, 0, 1.4]);
  for (let i = 0; i < 3; i++) B(hd, .9, .95, 2.2, D, [-1.05 + i * 1.05, .65, 3.1], [.9, 0, 0], { round: .3 });
  B(hd, .95, .95, 1.9, D, [-s * 1.85, -.3, 2.1], [0, -s * .5, 0], { round: .3 });
  if (k.bigFist === s) {
    B(hd, 5, 4.6, 5.2, k.main, [0, .3, 2.2], undefined, { round: .9 });
    for (let i = 0; i < 3; i++) B(hd, 1.5, 1.2, 2.6, k.main2, [-1.6 + i * 1.6, 1.4, 4.6], [.5, 0, 0], { round: .4 });
    B(hd, 5.2, .8, 3, k.dark, [0, -1.9, 2.4], undefined, { round: .2 });
  }
  return fa;
}
// Plasmagewehr mit flacher blauer Energiezelle, Lauf entlang lokal +z
function plasmaGun(w) {
  side(w, [[-2, -1.9], [9, -1.9], [10.2, -.4], [9.2, 1.9], [-1, 2.1], [-2.6, 0]], 3.8, '#55595f');
  B(w, 2.8, 1.8, 7, '#2f6fd0', [0, 2.7, 3.6], undefined, { r: .3 });
  B(w, 2.2, .35, 6, '#8cc8ff', [0, 3.65, 3.6], undefined, { r: .2, round: .1 });
  for (const z of [-.2, 7.4]) B(w, 3.2, 2.4, .6, '#a9afb5', [0, 2.7, z], undefined, { m: .6, r: .35 });
  C(w, 1, 1, 8, '#26272a', [0, -.2, 14], [Math.PI / 2, 0, 0]);
  for (const z of [11.5, 14.5]) C(w, 1.35, 1.35, .7, '#3a3c40', [0, -.2, z], [Math.PI / 2, 0, 0]);
  C(w, 1.5, 1.2, 1.4, '#26272a', [0, -.2, 18.4], [Math.PI / 2, 0, 0]);
  B(w, .5, 1, 7, '#3a3c40', [2.05, -.4, 4], undefined, { round: 0 });
}
// Base mit Farbverlauf (hell in der Mitte, dunkel am Rand) und Sandstruktur
function gradBase(p, r, h, inner, outer, rim, seed = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const x = cv.getContext('2d'), gr = x.createRadialGradient(256, 256, 10, 256, 256, 256);
  gr.addColorStop(0, inner); gr.addColorStop(.55, inner); gr.addColorStop(.9, outer); gr.addColorStop(1, rim);
  x.fillStyle = gr; x.fillRect(0, 0, 512, 512);
  const R = rng(seed);
  for (let i = 0; i < 14000; i++) { x.fillStyle = R() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.12)'; x.fillRect(R() * 512, R() * 512, 1.6, 1.6); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const top = grime(new THREE.MeshStandardMaterial({ map: tex, color: 0xa8a8a8, bumpMap: tex, bumpScale: .4, roughness: .95 }));
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r - .7, r, h, 64), [M(rim, { r: .55 }), top, M(rim)]);
  m.position.y = h / 2; m.castShadow = m.receiveShadow = true;
  const bg = new THREE.Group(); bg.name = 'base'; bg.userData.noFx = true; bg.add(m); p.add(bg);   // Base-Gruppe: Deko (Steine, Gras) kommt mit hinein
  return bg;
}
// Lange Schulterkanone: schlanker Lauf, blaue Zelle mittig, kleine Mündung
function longGun(w) {
  B(w, 3.2, 3.2, 6, '#3a3c40', [0, 0, 1.5]);
  C(w, .85, .85, 18, '#2a2b2f', [0, 0, 13], [Math.PI / 2, 0, 0]);
  B(w, 2.6, 1.7, 5.5, '#2f6fd0', [0, 1.5, 9.5], undefined, { r: .3 });
  B(w, 2, .35, 4.6, '#8cc8ff', [0, 2.4, 9.5], undefined, { r: .2, round: .1 });
  for (const z of [6.6, 12.4]) B(w, 3, 3, .7, '#a9afb5', [0, .5, z], undefined, { m: .6, r: .35 });
  for (const z of [16, 19]) C(w, 1.15, 1.15, .6, '#3a3c40', [0, 0, z], [Math.PI / 2, 0, 0]);
  C(w, 1.2, 1.2, 1.4, '#2a2b2f', [0, 0, 22.4], [Math.PI / 2, 0, 0]);
}

// ---------- 2 · XV8 Crisis (sand/blau) ----------
function crisisBlue() {
  const g = new THREE.Group(), tan = '#bba277', tan2 = '#a88f68';
  const k = { main: tan, main2: tan2, pad: tan, pad2: tan2, upper: '#33363b', dark: '#25262a',
    knee: tan, shin: tan, shin2: tan2, shinAcc: tan, shinBand: '#25262a', calf: '#33363b', foot: tan, thighPlate: tan,
    plate: '#3a3d42', head: '#2c2f33', eye: '#d0302a', antenna: true, headW: 5, port: false, lean: .22, twist: .28, slits: false, padL: '#2c2f33', emblem: '#c8232c',
    legs: { '-1': [[-5.2, 28, 0], [-9, 20, 10], [-10, 9, 5.5]], '1': [[5.2, 28, 0], [8.6, 17.8, -1.5], [9.8, 8.6, -11]] } };
  const rig = new Rig(g);
  gradBase(g, 25, 4, '#c29e99', '#b1696f', '#9a3a45', 2);
  const t = xv8(rig, k);
  // Waffenarm nach vorn-unten gestreckt
  const fl = xvArm(rig, k, -1, [-14, 30.5, 2], [-20, 29, 8.5], [-22, 28.5, 10.5]);
  const wl = new THREE.Group(); wl.position.set(0, -4.6, 2.5); fl.add(wl); plasmaGun(wl);
  // Schildarm angewinkelt vor dem Körper, große Schildscheibe nach vorn (hängt am linken Ellbogen)
  xvArm(rig, k, 1, [12.5, 29.5, 2], [6.5, 30, 8.5], [4.8, 29.5, 10]);
  const te = off(rig, 'elbow_L');
  const n = V([.57, 0, .82]), c = V([9.5, 29.8, 5.25]).addScaledVector(n, 3.6);
  rod(te, c.clone().addScaledVector(n, -.6).toArray(), c.clone().addScaledVector(n, .6).toArray(), 5.4, '#55595f', { seg: 40 });
  rod(te, c.clone().addScaledVector(n, .5).toArray(), c.clone().addScaledVector(n, .9).toArray(), 2, '#9aa0a6', { m: .5, r: .4, seg: 24 });
  rod(te, c.clone().addScaledVector(n, -2.2).toArray(), c.clone().addScaledVector(n, -.5).toArray(), 2.6, '#33363b', { seg: 24 });
  rod(te, [9.5, 29.8, 5.25], c.clone().addScaledVector(n, -1.5).toArray(), .9, '#33363b');
  B(te, 2.6, 3.2, 4.8, '#55595f', c.clone().addScaledVector(n, -2).toArray(), undefined, { round: .4, m: .3 });
  const rim = T(te, 5.4, 1, '#26282b', c.clone().addScaledVector(n, .2).toArray());
  const ring = T(te, 3.2, .3, '#8d939a', c.clone().addScaledVector(n, .65).toArray(), undefined, { m: .5, r: .4 });
  ring.lookAt(te.localToWorld(c.clone().addScaledVector(n, 2)));
  rim.lookAt(te.localToWorld(c.clone().add(n)));
  // Schulterwaffe auf kurzem Gelenkarm, ca. 45° nach vorn geneigt
  B(t, 3, 2.4, 3.2, k.dark, [11, 40.6, -1.5]);
  rod(t, [11, 41.2, -1.5], [12, 43.6, 0], .9, k.dark); S(t, 1.4, k.dark, [12, 43.6, 0]);
  const gs = rig.add('gun_S', limb(t, [12, 43.6, 0], [13.2, 50, 7])); longGun(gs);
  // Animation: Schulterkanone und Armwaffe feuern abwechselnd
  const back = V([12, 43.6, 0]).sub(V([13.2, 50, 7])).normalize().multiplyScalar(5).toArray();
  rig.kicks.push({ joint: 'gun_S', at: 0, pos: back, lift: [[1.2, 6.4, 7], .25], torso: .1 },
    { joint: 'elbow_R', at: .5, lift: [[-6, -1.5, 6.5], .4], torso: .09 }, { joint: 'shoulder_R', at: .5, lift: [[-6, -1.5, 6.5], .16] });
  rig.walk = { ...rig.walk, period: 1.3, stride: 10 };
  rig.j.torso.rotation.set(k.lean, k.twist, 0); rig.j.torso.scale.set(1.2, 1.05, 1.15);
  rig.finalize();
  return g;
}

// ---------- 4 · XV8 Crisis (sand/grau/rot, Raketen) ----------
function crisisRed() {
  const g = new THREE.Group(), red = '#a8232b', cream = '#d2c7a8';
  const k = { disc: '#c9a24a', discR: 2.0, main: cream, main2: '#bfb393', upperChest: '#a9adb2', chestCore: '#a9adb2', plate: '#5a5f66', pad: '#4a4f55', pad2: '#5a5f66', upper: '#4a4f55',
    dark: '#26282b', knee: '#4a4f55', shin: '#8a9096', shin2: '#6b7076', shinAcc: red, calf: '#3a3d42', foot: cream, thighPlate: cream,
    head: '#a7aeb4', eye: '#e2572b', chestDot: '#c8232c', headW: 4.1, collar: true };
  const rig = new Rig(g);
  gradBase(g, 25, 4, '#c49d9a', '#b0666d', '#9a3a45', 4);
  const t = xv8(rig, k);
  for (const [s, el, wr, ht] of [[-1, [-13.2, 25.9, -1.9], [-11.9, 22.3, 7.7], [-11.6, 21, 10.6]], [1, [13.5, 26.6, -2.5], [17.1, 25.5, 7.8], [17.9, 24.7, 10.8]]]) {
    const fa = xvArm(rig, k, s, el, wr, ht);
    // kompaktes Waffenmodul außen am Unterarm, ragt vor die Faust
    const wm = new THREE.Group(); wm.position.set(s * 3.6, .4, 1); fa.add(wm);
    B(wm, 2.6, 3, 7.5, k.main, [0, 0, 3.4], undefined, { round: .5 });
    B(wm, 2.7, .8, 3, red, [0, 1.2, 2], undefined, { round: .2 });
    C(wm, .75, .75, 6, '#26282b', [0, -.2, 9.2], [Math.PI / 2, 0, 0]);
    C(wm, 1, 1, .7, '#4a4f55', [0, -.2, 12.1], [Math.PI / 2, 0, 0]);
  }
  for (const s of [-1, 1]) {
    // Raketenwerfer an der Außenseite der Pylonen, leicht nach vorn gekippt
    B(t, 2.4, 3, 4, cream, [s * 8.4, 45.5, -6.5]);
    const mp = rig.add('pod' + sfx(s), new THREE.Group()); mp.position.set(s * 10.3, 46, -3); mp.rotation.set(.25, 0, 0); t.add(mp);
    rig.kicks.push({ joint: 'pod' + sfx(s), at: s > 0 ? 0 : .5, pos: [0, .6, -2.6], rot: [-.22, 0, 0], torso: .06 });
    side(mp, [[-5.5, -2.7], [5, -2.7], [5.5, 2.7], [-5, 2.7]], 4.6, '#b7bcc0', undefined, undefined, { m: .25, r: .5 });
    B(mp, 4.8, 5.6, .7, '#a9afb4', [0, 0, 5.5], undefined, { m: .45, r: .4 });
    B(mp, 3.8, 4.8, .3, '#6b7076', [0, 0, 5.9], undefined, { m: .3, round: .1 });
    for (const dy of [1.4, -1.4]) {
      C(mp, 1.3, 1.3, 1.8, '#c9ced2', [0, dy, 6.4], [Math.PI / 2, 0, 0], { m: .55, r: .35 });
      C(mp, .85, .85, 1.84, '#0e0f10', [0, dy, 6.4], [Math.PI / 2, 0, 0]);
    }
    B(mp, 4.9, 5.7, .9, red, [0, 0, -.5]);
    for (let i = 0; i < 5; i++) B(mp, .4, 3.8, .45, '#26282b', [s * 2.4, 0, 1 + i * .8], undefined, { round: 0 });
    B(mp, 3, 1.6, 4, '#8a9096', [0, 3.1, -3], undefined, { m: .3 });
    C(mp, 1.5, 1.5, 2.6, '#4a86c8', [0, 4.9, -3.4], undefined, { r: .3 });
    C(mp, 1.65, 1.65, .8, '#c9cdd0', [0, 6.5, -3.4], undefined, { m: .6, r: .35 });
  }
  // Beim Schießen Arme leicht anheben
  rig.aim = { shoulder_L: [-.25, 0, 0], shoulder_R: [-.25, 0, 0] };
  rig.j.torso.scale.set(1.2, 1.05, 1.15);
  rig.finalize();
  return g;
}

