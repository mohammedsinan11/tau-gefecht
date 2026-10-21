// ---------- 1 · Geflügelte Katze (geriggt, bemalt als getigerte Katze) ----------
// Gelenke: root → body → head → jaw, ear_L/R; body → fleg_L/R, tail1→tail2→tail3, wing_L/R.
// Animationen: "Gehen" = Fliegen (Körper waagerecht, Beine angezogen, Flügelschlag),
//              "Schießen" = Fauchen (Maul auf, Ohren angelegt, Buckel, Pfotenhieb, Flügel gespreizt).
function cat() {
  const g = new THREE.Group(), rig = new Rig(g), R = rng(1);
  const lin = c => { const k = new THREE.Color(c); return `${k.r.toFixed(3)}, ${k.g.toFixed(3)}, ${k.b.toFixed(3)}`; };
  // Fell mit schmalen Tigerstreifen (Objektraum, damit die Streifen bei Bewegung mitgehen)
  const fur = (c, st, expr, amt = .85) => grime(new THREE.MeshStandardMaterial({ color: c, roughness: .9 }), `
  float sN = gn(vLP * .6);
  float str = smoothstep(.7, .95, sin(${expr} + sN * 2.));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${lin(st)}), str * ${amt});`);
  const F = fur('#8f877f', '#3a3532', 'vLP.y * 3.2 + vLP.x * .3 + sin(vLP.z * .4) * 1.2 + gn(vLP * .22) * 5.', .7), FT = fur('#8f877f', '#3a3532', '(vLP.x + vLP.z) * 1.7');
  const W = M('#e2dbcf', { r: .9 }), D = '#3a3532';
  const FE = fur('#8f877f', '#3a3532', 'vLP.y * 3.2 + sin(vLP.x * .5) * 1.2 + gn(vLP * .22) * 5.', '.75 * (1. - smoothstep(-.6, .4, vLP.z))');   // Ohr: Streifen nur außen
  const bs = gradBase(g, 16, 3.5, '#77736d', '#5f5b56', '#43403c', 8);
  gravel(bs, R, 14, 3.5, 26, ['#6b6762', '#57534e', '#86817a'], .7);
  rig.joint('root', null, [0, 0, 0]);
  // Körper: Rumpf, Brust, buschige Fellkrause, Hinterläufe mit Pfoten
  const b = rig.joint('body', 'root', [0, 8, -1]);
  // Rumpf als Loft (sitzend: breite Hinterpartie unten, schmale Brust und Hals oben, Brust nach vorn gewölbt).
  // Lokal z = Weltachse y, lokal +y = hinten. Streifen laufen als Bänder über die Flanken.
  const FB = fur('#8f877f', '#3a3532', 'vLP.z * 3.2 + vLP.x * .3 + sin(vLP.y * .4) * 1.2 + gn(vLP * .22) * 5.', .7), FL = fur('#8f877f', '#3a3532', 'vLP.z * 2.6 + gn(vLP * .3) * 3.', .6);
  const torsoRings = [
    { z: .2, w: 6.6, h: 7.2, hb: 5.2, y: 1.6, e: 2.2 },
    { z: 2.6, w: 7.8, h: 8.4, hb: 6.2, y: 1.8, e: 2.2 },
    { z: 6.4, w: 7.6, h: 8.0, hb: 6.3, y: 1.6, e: 2.2 },
    { z: 10.6, w: 6.5, h: 6.6, hb: 6.0, y: .9, e: 2.1 },
    { z: 14.8, w: 5.4, h: 5.1, hb: 5.7, y: .2, e: 2.1 },
    { z: 18.8, w: 4.6, h: 3.9, hb: 5.2, y: -.6, e: 2.1 },
    { z: 22.2, w: 3.9, h: 3.2, hb: 4.3, y: -1.1, e: 2.1 },
    { z: 24.6, w: 3.2, h: 2.6, hb: 3.2, y: -1.4, e: 2.1 },
    { z: 25.6, w: .4, h: .4, hb: .4, y: -1.4 },
  ];
  loft(b, torsoRings, FB, [0, 0, -1], [-Math.PI / 2, 0, 0], { n: 48, sub: 5 });
  // weißes Brustlatz-Fell: schmaler Loft, der nur vorn aus dem Rumpf ragt
  loft(b, [
    { z: 11, w: .5, h: .3, hb: .5, y: -.4 }, { z: 13.5, w: 3.4, h: .4, hb: 6.0, y: 0 }, { z: 17.5, w: 3.6, h: .4, hb: 5.6, y: -.6 },
    { z: 21.5, w: 3.2, h: .4, hb: 4.75, y: -1.1 }, { z: 24.4, w: 2.4, h: .4, hb: 3.6, y: -1.4 }, { z: 25.2, w: .3, h: .3, hb: .3, y: -1.4 },
  ], W, [0, 0, -1], [-Math.PI / 2, 0, 0], { n: 40, sub: 4 });
  for (const [y, r, n, len] of [[23.4, 5.4, 15, 4], [21.2, 5.6, 13, 3.6], [18.8, 5.2, 9, 3]]) {
    for (let i = 0; i < n; i++) {
      const a = (-.62 + 1.24 * i / (n - 1)) * Math.PI, x = Math.sin(a) * r, z = 1.6 + Math.cos(a) * r * .8;
      const c = Math.abs(a) < 1 ? W : F;
      const l = len * (.7 + R() * .6), rr = .9 + R() * .7;
      K(b, rr, l, c, [x + (R() - .5) * .8, y - l * .35, z + .2], [Math.PI * (.82 + R() * .12), (R() - .5) * .4, -Math.sin(a) * .6 + (R() - .5) * .5]);
    }
  }
  for (const s of [-1, 1]) {
    // Hinterlauf: länglicher Oberschenkel, der flach am Rumpf anliegt (Loft entlang z)
    loft(b, [
      { z: -6.6, w: .5, h: .5, hb: .5, y: 5.6 }, { z: -5.2, w: 2.6, h: 3.8, hb: 3.0, y: 6.4 }, { z: -2, w: 3.3, h: 5.2, hb: 4.4, y: 6.6 },
      { z: 1.4, w: 3.0, h: 4.4, hb: 4.4, y: 5.4 }, { z: 4.2, w: 2.2, h: 2.6, hb: 3.0, y: 3.8 }, { z: 5.6, w: .4, h: .4, hb: .4, y: 3.2 },
    ].map(r => ({ ...r, w: r.w * 1.2, h: r.h * 1.2, hb: r.hb * 1.2 })), F, [s * 5.9, 0, 0], [0, 0, s * -.12], { n: 36, sub: 4 });
    S(b, 2.5, W, [s * 7.2, 1.6, 4.5], [1, .62, 1.4]);
    for (let i = 0; i < 3; i++) S(b, .55, '#cfc6b8', [s * 7.2 + (i - 1) * .9, 1.4, 7.6]);
  }
  // Kopf: fuchsartig, spitze Schnauze, schmale Augen, „M“ auf der Stirn, Schnurrhaare
  const h = rig.joint('head', 'body', [0, 24, 2.5]);
  // Kopf als Loft von hinten nach vorn: runder Hinterkopf, breite Wangen, spitz zulaufende Schnauze
  const head = loft(h, [
    { z: -4.6, w: .5, h: .5, hb: .5, y: 29.2 },
    { z: -3.6, w: 5.0, h: 4.8, hb: 4.0, y: 29.3, e: 2.1 },
    { z: -1.0, w: 7.0, h: 6.0, hb: 5.0, y: 29.2, e: 2.1 },
    { z: 2.0, w: 7.6, h: 5.9, hb: 5.1, y: 28.9, e: 2.15 },
    { z: 5.0, w: 6.6, h: 5.1, hb: 4.3, y: 28.7, e: 2.05 },
    { z: 7.2, w: 4.6, h: 3.9, hb: 3.2, y: 28.4, e: 2.0 },
    { z: 8.7, w: 2.9, h: 2.2, hb: 2.1, y: 27.8, e: 2.1 },
    { z: 9.8, w: 2.0, h: 1.5, hb: 1.6, y: 27.4, e: 2.1 },
    { z: 10.5, w: .9, h: .8, hb: .8, y: 27.3 },
    { z: 10.65, w: .1, h: .1, hb: .1, y: 27.3 },
  ], F, [0, 0, 0], [0, 0, 0], { n: 48, sub: 5 });
  // helle Schnauzenpartie als vorgelagerter Loft
  loft(h, [
    { z: 6.4, w: .3, h: .3, hb: .3, y: 27.2 }, { z: 7.4, w: 3.6, h: 1.4, hb: 2.6, y: 27.4 }, { z: 8.9, w: 2.9, h: 1.2, hb: 2.2, y: 27.3 },
    { z: 10.0, w: 2.1, h: .9, hb: 1.7, y: 27.2 }, { z: 10.7, w: .8, h: .5, hb: .8, y: 27.2 }, { z: 10.85, w: .1, h: .1, hb: .1, y: 27.2 },
  ], W, [0, 0, 0], [0, 0, 0], { n: 40, sub: 4 });
  for (const s of [-1, 1]) {
    S(h, 3.2, F, [s * 5.4, 26.6, 3.4], [1.2, .8, .9]);
    for (let i = 0; i < 3; i++) K(h, 1, 2.8, F, [s * (7.6 + i * .2), 26.8 - i * 1.1, 2.6], [0, 0, s * (1.7 + i * .2)]);
    S(h, 2, W, [s * 1.2, 27, 8.4], [1, .75, .85]);
    // schmale, grimmige Augen
    S(h, 1.3, '#a6c94a', [s * 2.8, 30.4, 8], [1.2, .45, .5], [0, 0, s * .32], { r: .2 });
    B(h, .25, .8, .3, '#111', [s * 2.8, 30.4, 8.52], [0, 0, s * .32], { round: 0 });
    B(h, 3.8, 1, 1.8, F, [s * 2.9, 31.4, 8], [0, s * .35, s * .4]);
    for (let i = 0; i < 3; i++) rod(h, [s * 2, 27.2 - i * .4, 9.9], [s * 7.6, 27.6 - i * 1.1, 10.6], .07, '#e8e4dc');
    // Ohren an eigenem Gelenk (werden beim Fauchen angelegt)
    const e = rig.joint('ear' + sfx(s), 'head', [s * 4.05, 32.8, 1]);
    K(e, 4.3, 7.8, FE, [s * 5.25, 35.6, 1], [0, 0, s * -.32]);
    K(e, 2.7, 5.4, '#c98d8f', [s * 5.05, 35.4, 2.35], [0, 0, s * -.32]);
    K(e, .65, 2.2, W, [s * 6.05, 38.9, 1.2], [0, 0, s * -.32]);
  }
  // „M“ auf der Stirn als dunkle Linie direkt auf der Kopfoberfläche (x seitlich, z entlang der Stirn nach vorn-unten)
  { const at = (x, z) => V(head.pt(z, Math.PI / 2 - x / 5.4, .04));
    const M = [[-2.3, 7.0], [-1.2, 5.9], [0, 6.75], [1.2, 5.9], [2.3, 7.0]], pts = [];
    for (let i = 0; i < M.length - 1; i++) for (let j = 0; j < 6; j++) { const f = j / 6; pts.push(at(M[i][0] + (M[i + 1][0] - M[i][0]) * f, M[i][1] + (M[i + 1][1] - M[i][1]) * f)); }
    pts.push(at(...M.at(-1)));
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), 60, .17, 6, false), D, h); }
  S(h, .8, '#c77d84', [0, 28.4, 11.4], [1.3, .8, .8], undefined, { r: .4 });
  // Oberkiefer-Zähne und Rachen (sichtbar, wenn das Maul offen ist)
  S(h, 1.9, '#b0444f', [0, 25.9, 7.9], [1, .5, 1]);
  for (const s of [-1, 1]) K(h, .62, 2.6, '#f2efe6', [s * 1.1, 25.5, 10.5], [Math.PI, 0, 0]);
  const jw = rig.joint('jaw', 'head', [0, 26.4, 6.4]);
  S(jw, 2.6, W, [0, 25, 9], [1, .45, 1.2]);
  for (const s of [-1, 1]) K(jw, .3, 1, '#f2efe6', [s * .8, 26.2, 10.4]);
  // Vorderbeine mit Pfoten und Krallen
  for (const s of [-1, 1]) {
    const fl = rig.joint('fleg' + sfx(s), 'body', [s * 3.2, 14, 5]);
    // schlanker Oberarm schräg nach hinten-unten zum Ellenbogen (liegt am Brustkorb an), Unterarm fast senkrecht zur Pfote
    const sh = [s * 2.9, 15, 4.8], elb = [s * 3.5, 8.8, 2.7], wr = [s * 3.7, 2.6, 6.4];
    { const ua = limb(fl, sh, elb), L = ua.len;
      loft(ua, [{ z: -1.2, w: .4, h: .4, hb: .4 }, { z: 0, w: 1.75, h: 2.0, hb: 1.8 }, { z: L * .45, w: 1.4, h: 1.6, hb: 1.5 },
        { z: L, w: 1.15, h: 1.35, hb: 1.2 }, { z: L + .9, w: .3, h: .3, hb: .3 }], FL, [0, 0, 0], [0, 0, 0], { n: 28, sub: 4 }); }
    S(fl, 1.25, FL, elb, [.95, 1, 1.15]);                                                    // Ellenbogen
    { const fa = limb(fl, elb, wr), L = fa.len;
      loft(fa, [{ z: -.4, w: .3, h: .3, hb: .3 }, { z: .3, w: 1.05, h: 1.2, hb: 1.05 }, { z: L * .5, w: .9, h: 1.0, hb: .9 },
        { z: L * .88, w: .8, h: .85, hb: .8 }, { z: L, w: .9, h: .95, hb: .85 }, { z: L + .8, w: .3, h: .3, hb: .3 }], FL, [0, 0, 0], [0, 0, 0], { n: 28, sub: 4 }); }
    S(fl, 2.25, W, [s * 3.3, 1.6, 7.7], [1.05, .62, 1.25]);
    for (let i = 0; i < 3; i++) K(fl, .28, .8, '#d8d2c4', [s * 3.3 + (i - 1) * .8, 1.3, 9.9], [Math.PI / 2, 0, 0]);
  }
  // Schwanz in drei Gliedern; Kugeln an beiden Enden schließen die Fugen
  const curve = new THREE.CatmullRomCurve3([[0, 3, -9], [7, 2, -9.5], [13, 2, -5], [14, 2, 2], [11, 2.2, 8], [8, 3, 10]].map(V));
  const cuts = [0, .35, .7, 1];
  for (let i = 0; i < 3; i++) {
    const p0 = curve.getPoint(cuts[i]), p1 = curve.getPoint(cuts[i + 1]), r = 2 - i * .25;
    const tj = rig.joint('tail' + (i + 1), i ? 'tail' + i : 'body', p0.toArray());
    const pts = []; for (let j = 0; j <= 12; j++) pts.push(curve.getPoint(cuts[i] + (cuts[i + 1] - cuts[i]) * j / 12));
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 14, false), FT, tj);
    S(tj, r, FT, p0.toArray()); if (i < 2) S(tj, r * .98, FT, p1.toArray());
    else K(tj, r * .95, 3, FT, p1.clone().add(curve.getTangent(1).multiplyScalar(1.4)).toArray()).quaternion.setFromUnitVectors(V([0, 1, 0]), curve.getTangent(1));
  }
  // Flügel: groß, an den Schulterblättern; dunkle Knochen, rötlich-dunkle Membran
  for (const s of [-1, 1]) {
    const wj = rig.joint('wing' + sfx(s), 'body', [s * 3.6, 19.6, -4.4]);
    const wg = new THREE.Group(); wg.position.set(s * 3.6, 19.6, -4.4); wg.rotation.set(-.12, s * .35, s * -.04); wg.scale.setScalar(1.4); wj.add(wg);
    const pts = [[0, 0], [6, 3.5], [12, 7], [16, 10], [18.5, 11.5], [17, 8], [15.5, 5.2], [13, 4.2], [11.5, 1], [9, -.2], [6.5, -4], [3.5, -3], [0, -4.5]];
    const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x * s, y)));
    mesh(new THREE.ExtrudeGeometry(sh, { depth: .6, bevelEnabled: false }), M('#4a2c30', { r: .7 }), wg, [0, 0, -.3]);
    const bone = [[0, 0], [6, 3.5], [12, 7], [18.5, 11.5]].map(([x, y]) => [x * s, y + .3, 0]);
    for (let i = 0; i < 3; i++) rod(wg, bone[i], bone[i + 1], .9 - i * .15, '#2e2a2c');
    for (const p of bone.slice(1)) S(wg, 1, '#2e2a2c', p);
    K(wg, .65, 2.2, '#d8d2c4', add(bone[3], [s * 1.1, .8, 0]), [0, 0, s * -.9]);
    for (const tip of [[15.5, 5.2], [11.5, 1], [6.5, -4]]) rod(wg, bone[2], [tip[0] * s, tip[1], 0], .4, '#2e2a2c');
  }
  // Katze sitzt auf der Base
  rig.j.root.position.y = 3.5;
  rig.labels = { Gehen: 'Fliegen', Schiessen: 'Fauchen' };
  const TAU = Math.PI * 2;
  rig.walk = { period: 1, fn: p => {
    const f = Math.sin(TAU * p), d = {};
    d.wing_L = [0, 0, -.75 + .55 * f]; d.wing_R = [0, 0, .75 - .55 * f];
    d['@root'] = [0, 10 + 1.6 * Math.sin(TAU * p + Math.PI / 2), 0];
    d.body = [.85 + .05 * f, 0, 0];
    d.head = [-.7 - .05 * f, 0, 0];
    d.fleg_L = [1, 0, 0]; d.fleg_R = [1, 0, 0];
    d.tail1 = [-.9, 1.45 + .08 * Math.sin(TAU * p), 0]; d.tail2 = [0, 1.25 + .1 * Math.sin(TAU * p - .8), 0]; d.tail3 = [0, 1.1 + .12 * Math.sin(TAU * p - 1.6), 0];
    return d;
  } };
  rig.shoot = { period: 1.2, fn: p => {
    const d = {}, hiss = Math.min(1, Math.exp(-((p - .14) ** 2) / .02) * 1.5), swipe = Math.exp(-((p - .5) ** 2) / .006);
    d.wing_L = [-.2, .45 * hiss, .25 + .25 * hiss]; d.wing_R = [-.2, -.45 * hiss, -.25 - .25 * hiss];
    d['@root'] = [0, 1.6 * hiss, 0];
    d.body = [.3 * hiss, 0, 0];
    d.head = [-.3 * hiss, .05 * Math.sin(TAU * p), 0];
    d.jaw = [1.2 * hiss, 0, 0];
    d.ear_L = [-.4 * hiss, 0, -.75 * hiss]; d.ear_R = [-.4 * hiss, 0, .75 * hiss];   // Ohren seitlich angelegt („Flugzeugohren“)
    d.fleg_R = [-1.1 * swipe, 0, -.2 * swipe];
    for (let i = 1; i <= 3; i++) d['tail' + i] = [0, .45 * Math.sin(TAU * p * 2 - i * .9), 0];
    return d;
  } };
  // Fell, Gesicht und Augen ohne Kantenlinien (nur weicher AO-Wash); die Flügel behalten den Effekt
  rig.j.root.traverse(o => { if (o.isMesh) o.userData.noFx = !['wing_L', 'wing_R'].some(n => { for (let p = o; p; p = p.parent) if (p.name === n) return true; return false; }); });
  rig.finalize();
  return g;
}
