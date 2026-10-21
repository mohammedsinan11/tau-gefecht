// ---------- T'au-Infanterie (Pathfinder, Fire Warrior), geriggt ----------
// Gelenke: root → pelvis → hip/knee/ankle; pelvis → torso → head, shoulder/elbow/wrist, gun.
// Base-Oberkante y = 3.5, Figur schaut nach +z. Positionen in absoluten Ruhe-Koordinaten.
function trooper(rig, k) {
  const A = k.armor, U = k.suit;
  rig.joint('root', null, [0, 0, 0]);
  rig.joint('pelvis', 'root', [0, 15.6, 0]);
  const legs = k.legs ?? { '-1': [[-2.1, 15.6, 0], [-2.6, 10.2, 1.8], [-2.7, 5.4, -.4]], '1': [[2.1, 15.6, 0], [2.6, 10.2, 1.8], [2.7, 5.4, -.4]] };
  for (const s of [-1, 1]) {
    const [hip, knee, ank] = legs[s], n = ['hip', 'knee', 'ankle'].map(x => x + sfx(s));
    const gh = rig.joint(n[0], 'pelvis', hip), gk = rig.joint(n[1], n[0], knee), ga = rig.joint(n[2], n[1], ank);
    rig.leg(s, hip, knee, ank, n);
    S(gh, 1.35, U, hip);
    // Oberschenkel: Anzug mit vorderer und äußerer Panzerplatte
    const th = limb(gh, hip, knee), L1 = th.len;
    const tw = k.thighW ?? 3.3;
    B(th, tw, tw * .97, L1, U, [0, 0, L1 / 2], undefined, { round: .8 });
    for (let i = 0; i < 3; i++) { const z0 = L1 * (.12 + i * .27), z1 = z0 + L1 * .24;
      side(th, [[z0, 1.2], [z1, 1.2], [z1 - .15, 2.35 - i * .1], [z0, 2.45 - i * .1]], (3.1 - i * .15) * tw / 3.3, k.thigh ?? A, undefined, undefined, { bevel: .18, cham: .25 }); }
    B(th, .7, 2, L1 * .55, k.thigh ?? A, [s * 1.35, .3, L1 * .45], undefined, { round: .25 });
    // Knie und Schienbeinschutz
    S(gk, 1.15, U, knee);
    const sh = limb(gk, knee, ank), L2 = sh.len;
    B(sh, 1.9, 2, L2, U, [0, 0, L2 / 2], undefined, { round: .5 });
    S(sh, .95, k.knee ?? A, [0, 1.3, -.3], [1.05, .85, 1.15]);
    side(sh, [[-.3, .9], [L2 - .9, .9], [L2 - 1.1, 2], [.9, 2.7], [-.3, 2.6]], 3.1, k.shin ?? A, undefined, undefined, { bevel: .2, cham: .3 });
    for (let i = 0; i < 2; i++) B(sh, .25, 1.2, .3, '#1a1b1d', [s * 1.2, 1.2, L2 * (.4 + i * .2)], undefined, { round: 0 });
    // Hufstiefel: Schaft, zweigeteilte Spitze, Ferse
    const fx = ank[0], fz = ank[2], fy = ank[1] - 1.9;   // Bodenhöhe unter dem Knöchel (vor dem Absenken der Figur)
    S(ga, 1, U, ank);
    B(ga, 2.2, 2.2, 2.6, k.boot, [fx, fy + 1.4, fz + .1], undefined, { round: .5 });
    for (const t of [-1, 1]) side(ga, [[0, fy], [2.6, fy], [2.4, fy + .8], [.2, fy + 1.4]], 1, k.boot, [fx + t * .58, 0, fz + 1], undefined, { bevel: .15, cham: .25 });
    side(ga, [[0, fy], [-1.9, fy], [-1.6, fy + .9], [0, fy + 1.5]], 1.8, k.boot, [fx, 0, fz - .6], undefined, { bevel: .15, cham: .25 });
  }
  // Becken: Gürtel, Schrittplatte, Hüftplatten
  const pv = rig.s('pelvis');
  B(pv, 5, 2.2, 3.4, U, [0, 15.7, 0], undefined, { round: .6 });
  B(pv, 5.4, .7, 3.7, k.belt ?? '#2a2b2e', [0, 16.6, 0], undefined, { round: .3 });
  prism(pv, [[-1.4, 1.2], [1.4, 1.2], [1, -1.6], [-1, -1.6]], .7, U, [0, 15.2, 1.95], [-.15, 0, 0], { bevel: .15, cham: .3 });
  for (const s of [-1, 1]) side(pv, [[-1.6, 16.6], [1.6, 16.6], [1.3, 13.8], [-1.1, 13.6]], .7, '#2a2b2f', [s * 2.9, 0, 0], [0, 0, s * .2], { bevel: .15, cham: .3 });
  for (const p of k.pouches ?? []) B(pv, p[3] ?? 1.3, p[4] ?? 1.5, 1.1, k.pouch ?? '#6f7d4e', p.slice(0, 3), undefined, { round: .3 });
  // Rumpf
  rig.joint('torso', 'pelvis', [0, 16.6, 0]);
  const t = rig.s('torso');
  // geschlossener Rumpf: Anzug-Kern plus Panzerweste von der Hüfte bis zur Brust
  side(t, [[-2.2, 16.6], [2.2, 16.6], [2.6, 18.8], [3, 20.6], [2.6, 23], [-2, 23.4], [-2.6, 21], [-2.4, 18.4]], 5.8, U);
  side(t, [[-2.5, 16.8], [2.7, 16.8], [3.1, 19.2], [-2.7, 19.4]], k.vestW ?? 6.2, k.vest ?? A, undefined, undefined, { bevel: .25, cham: .5 });
  // Brustpanzer: großer, leicht V-förmiger Latz mit Mittelkante
  for (const s of [-1, 1]) {
    const cg = new THREE.Group(); cg.position.set(0, 21, 3.6); cg.rotation.set(-.08, s * .32, 0); t.add(cg);
    prism(cg, [[.15 * s, -2.3], [3.4 * s, -1.6], [3.7 * s, 1.6], [2.2 * s, 2.5], [.15 * s, 2.6]], .9, A, undefined, undefined, { bevel: .2, cham: .35 });
  }
  prism(t, [[-2.2, .9], [2.2, .9], [1.6, -.9], [-1.6, -.9]], .8, A, [0, 18.6, 2.3], [-.25, 0, 0], { bevel: .15, cham: .3 });
  B(t, 5.4, 1, 3.8, k.armor2 ?? A, [0, 23.2, -.1], undefined, { round: .4 });       // Kragen
  // Rückenmodul
  { const ps = new THREE.Group(); ps.position.set(0, 21, -2.4); ps.scale.setScalar(k.packScale ?? 1); t.add(ps);
    const pk = new THREE.Group(); pk.position.set(0, -21, 2.4); ps.add(pk);
    side(pk, [[-2.2, 18.6], [-4.4, 19], [-4.8, 22.6], [-3.8, 23.6], [-2.2, 23.4]], 4.6, k.pack ?? A, undefined, undefined, { bevel: .2, cham: .4 });
    for (let i = 0; i < 3; i++) B(pk, 3.2, .25, .3, '#1a1b1d', [0, 19.8 + i * .7, -4.75], undefined, { round: 0 });
    for (const s of [-1, 1]) C(pk, .6, .6, 3.6, k.armor2 ?? A, [s * 2.5, 20.8, -3.4]); }
  // Kopf
  rig.joint('head', 'torso', [0, 23.6, .2]);
  C(rig.s('head'), .9, 1, 1.4, U, [0, 23.9, .2]);
  return t;
}
// Arm einer Infanterie-Figur zu einem Handpunkt (z. B. am Waffengriff); Schulterpanzer bewegt sich mit
function trooperArm(rig, k, s, hand, o = {}) {
  const x = sfx(s), sh = [s * 3.5, 21.8, 0];
  const el = o.elbow ?? [(sh[0] + hand[0]) / 2 + s * 1.4, (sh[1] + hand[1]) / 2 - 1.8, (sh[2] + hand[2]) / 2 - .6];
  const a = rig.joint('shoulder' + x, 'torso', sh), e = rig.joint('elbow' + x, 'shoulder' + x, el), w = rig.joint('wrist' + x, 'elbow' + x, hand);
  S(a, 1.2, k.suit, sh);
  const ua = limb(a, sh, el);
  B(ua, 1.6, 1.6, ua.len, k.suit, [0, 0, ua.len / 2], undefined, { round: .5 });
  // Schulterpanzer: gewölbte, facettierte Schale
  const ps = k.padScale ?? 1, pg = new THREE.Group(); pg.position.set(s * (4.2 + ps - 1), 22.4, 0); pg.rotation.set(0, 0, s * -.38); a.add(pg);
  S(pg, 2.3 * ps, k.pad ?? k.armor, [s * -.3, 0, 0], [.38, .9, 1.15]);
  T(pg, 2.05 * ps, .14, k.armor2 ?? k.armor, [s * -.25, 0, 0], [0, Math.PI / 2, 0]).scale.set(1.15, .9, 1);
  if (k.padMark?.[s]) k.padMark[s](pg, s, ps);
  S(e, 1, k.suit, el);
  const fa = limb(e, el, hand, [0, 1, 0]);
  B(fa, 1.5, 1.5, fa.len, k.suit, [0, 0, fa.len / 2], undefined, { round: .5 });
  side(fa, [[.3, -1], [fa.len - .4, -.9], [fa.len - .2, .9], [.3, 1.1]], 1.9, k.forearm ?? k.armor, undefined, undefined, { bevel: .15, cham: .25 });
  // Hand um den Griff
  B(w, 1.2, 1.4, 1.5, k.glove ?? k.suit, hand, undefined, { round: .45 });
  return { shoulder: sh, elbow: el };
}
// Rail Rifle (Pathfinder): Schaft, Gehäuse, Doppelschiene mit Kupferspule, Mündungsblock mit roter Linse
function railRifle(w, k) {
  side(w, [[-7.4, -1.6], [-2, -.9], [-2, .9], [-7.6, .5]], .9, k.gun, undefined, undefined, { bevel: .15, cham: .3 });
  B(w, 1.1, 2.4, .8, k.gun2, [0, -.6, -7.5], undefined, { round: .2 });
  side(w, [[-2.4, -1.1], [6, -1.1], [6.6, .2], [6, 1.3], [-2.4, 1.3]], 1.45, k.gun, undefined, undefined, { bevel: .25, cham: .5 });
  C(w, .95, .95, 7, k.gun, [0, .1, 2.2], [Math.PI / 2, 0, 0], { seg: 12 });
  B(w, .9, 2.2, 1.2, k.gun2, [0, -2, .1], [.3, 0, 0], { round: .3 });
  B(w, .9, 1.8, 1.1, k.gun2, [0, -1.8, 5.4], [.15, 0, 0], { round: .3 });
  for (const dy of [-.5, 1.3]) C(w, .32, .32, 11, k.gun, [0, dy, 11.8], [Math.PI / 2, 0, 0], { seg: 10 });
  for (let i = 0; i < 9; i++) C(w, .36, .36, .55, i % 2 ? k.cu : k.cu2, [0, .4, 7.2 + i * 1.08], [Math.PI / 2, 0, 0], { m: .5, r: .4, seg: 10 });
  for (let i = 0; i < 4; i++) S(w, .16, '#6fc3ff', [.62, .4, 8 + i * 2.2], undefined, undefined, { r: .2 });
  C(w, 1.1, 1.1, 2.4, k.gun, [0, .4, 18.4], [Math.PI / 2, 0, 0], { seg: 10 });
  S(w, .8, k.accent, [0, .4, 19.6], [1, 1, .55], undefined, { r: .2 });
  C(w, .48, .48, 5, k.gun2, [0, 2.2, 2.6], [Math.PI / 2, 0, 0]);
  for (const z of [.1, 5.1]) C(w, .55, .55, .4, '#1a1b1d', [0, 2.2, z], [Math.PI / 2, 0, 0]);
}
// Pulskarabiner (Fire Warrior): Gehäuse, Laufmantel, Rotpunktvisier, Munitionstrommel
function pulseCarbine(w, k) {
  side(w, [[-4.6, -1.4], [-1.6, -1], [-1.6, 1.1], [-4.8, .7]], 1.2, k.gun, undefined, undefined, { bevel: .15, cham: .3 });
  side(w, [[-2, -1.2], [6.4, -1.2], [7.2, .3], [6.4, 1.4], [-2, 1.4]], 1.5, k.gun, undefined, undefined, { bevel: .2, cham: .35 });
  C(w, .78, .78, 9.6, k.gun, [0, .2, 11.4], [Math.PI / 2, 0, 0], { seg: 12 });
  for (const z of [7.2, 11.4, 15.6]) C(w, .95, .95, .6, k.gun2, [0, .2, z], [Math.PI / 2, 0, 0], { seg: 12 });
  C(w, .42, .42, 11, k.gun2, [0, 1.35, 10], [Math.PI / 2, 0, 0], { seg: 10 });
  C(w, .45, .45, 1.2, '#1a1b1d', [0, .2, 16.4], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 4; i++) B(w, 2.3, .25, .4, '#55595e', [0, 1.6, 9 + i * .8], undefined, { round: 0 });
  B(w, 1, 2.2, 1.2, k.gun2, [0, -2, -.4], [.3, 0, 0], { round: .3 });
  B(w, 1, 1.6, 2.6, k.gun2, [0, -1.9, 5.6], undefined, { round: .3 });
  S(w, .7, k.accent, [1.2, .5, 7.6], [.5, 1, 1], undefined, { r: .2 });
  B(w, .6, .9, 2.4, k.gun2, [0, 2, 3.4], undefined, { round: .2 });
  // Munitionsgurt: kurz, schräg nach hinten zum Körper; Kimme oben hinten
  const belt = new THREE.Group(); belt.position.set(0, -1.6, 2.6); belt.rotation.set(-.75, 0, 0); w.add(belt);
  for (let i = 0; i < 5; i++) C(belt, 1 - i * .03, 1 - i * .03, .55, i % 2 ? '#8a6a3a' : '#a8854b', [0, -i * .58, 0], undefined, { m: .5, r: .4 });
  B(w, 1, .8, .5, k.gun2, [0, 1.9, -1.2], undefined, { round: .15 });
}
// T'au-Helm: nach hinten gezogene Kuppel, flaches geneigtes Gesichtsschild, Sichtschlitz, Nackenschutz, Sensorblock links
function tauHelmet(h0, k, o = {}) {
  const c = o.color ?? k.armor, c2 = o.color2 ?? k.armor2 ?? c, cf = o.face ?? c;
  // Helmschale als Loft von hinten (−z) nach vorn: hohe Kuppel, nach vorn abfallendes Gesicht, spitzes Kinn
  const L = o.long ?? 1, Fh = o.flat ?? 1, sh = r => ({ ...r, z: r.z > 0 ? r.z * L : r.z, h: r.h * Fh, w: r.w * (Fh < 1 ? 1.08 : 1) });
  const hm = loft(h0, [
    { z: -3.0, w: .5, h: .5, hb: .5, y: 25.4 },
    { z: -2.6, w: 1.75, h: 1.45, hb: 1.3, y: 25.5, e: 2.4 },
    { z: -1.6, w: 2.25, h: 1.9, hb: 1.7, y: 25.6, e: 2.5 },
    { z: -.2, w: 2.35, h: 1.95, hb: 1.9, y: 25.6, e: 2.6 },
    { z: 1.1, w: 2.15, h: 1.5, hb: 2.0, y: 25.3, e: 3.0 },
    { z: 2.1, w: 1.75, h: .95, hb: 1.95, y: 24.9, e: 3.2 },
    { z: 2.9, w: 1.2, h: .5, hb: 1.6, y: 24.4, e: 3.0 },
    { z: 3.35, w: .6, h: .25, hb: .85, y: 24.0, e: 2.6 },
    { z: 3.45, w: .1, h: .1, hb: .1, y: 23.9 },
  ].map(sh), c, [0, 0, 0], [0, 0, 0], { n: 48, sub: 5 });
  // Gesichtskeil (o.wedge): flache, fünfeckige Platte, die schräg nach vorn-unten bis zum spitzen Kinn aus der Kuppel tritt
  if (o.wedge) {
    const W = o.wedge === true ? 1 : o.wedge, fg = new THREE.Group(); fg.position.set(0, 24.45, 2.75 * L + .75); fg.rotation.set(-1.0, 0, 0); fg.scale.setScalar(1.15); h0.add(fg);
    prism(fg, [[-2.05 * W, 1.7], [2.05 * W, 1.7], [2.3 * W, .3], [1.25 * W, -1.6], [0, -2.35], [-1.25 * W, -1.6], [-2.3 * W, .3]], .9, cf, [0, 0, 0], undefined, { bevel: .22, cham: .35 });
    prism(fg, [[-.18, 1.2], [.18, 1.2], [.18, -2.1], [0, -2.25], [-.18, -2.1]], .4, c2, [0, 0, .55], undefined, { bevel: .08, cham: .1 });   // Mittelgrat
    B(fg, 3.3 * W, .5, .3, k.visor ?? '#2f3247', [0, .55, .5], undefined, { round: .1, r: .25 });                                      // Sichtschlitz
    B(fg, 3.5 * W, .14, .2, o.band ?? c2, [0, .9, .55], undefined, { round: .05 });
    for (const sg of [-1, 1]) B(fg, .9, .22, .2, '#1a1b1d', [sg * 1.35 * W, -.7, .5], [0, 0, sg * -.5], { round: .05 });            // Atemschlitze
  }
  // Gesichtsplatte in eigener Farbe: etwas größere Schale nur über die Vorderseite
  else if (cf !== c) loft(h0, [
    { z: 1.0, w: .1, h: .1, hb: .1, y: 24.6 }, { z: 1.4, w: 2.12, h: 1.4, hb: 2.02, y: 25.2, e: 3.0 }, { z: 2.1, w: 1.8, h: 1.0, hb: 2.0, y: 24.9, e: 3.2 },
    { z: 2.9, w: 1.25, h: .55, hb: 1.65, y: 24.4, e: 3.0 }, { z: 3.4, w: .62, h: .28, hb: .9, y: 24.0, e: 2.6 }, { z: 3.5, w: .1, h: .1, hb: .1, y: 23.9 }].map(sh), cf, [0, 0, 0], [0, 0, 0], { n: 48, sub: 4 });
  // Visier: dunkler, schmaler Schlitz quer über die Gesichtsschräge, mit hellem Rahmen
  if (!o.wedge) {
    const vs = onSurf(hm, 2.05 * L, Math.PI / 2, 0);
    B(vs, 3.1, .48, .34, k.visor ?? '#2f3247', [0, 0, .05], undefined, { round: .12, r: .25 });
    B(vs, 3.3, .14, .2, c2, [0, .32, .08], undefined, { round: .05 });
    loftLine(hm, -Math.PI / 2, -1.2, 3.1, .1, '#2a2b2e', 24, -.02);                 // Kinnnaht
    for (const sgn of [-1, 1]) loftRing(hm, 1.0, .09, '#2a2b2e', Math.PI / 2 + sgn * .15, Math.PI / 2 + sgn * 1.45, 16, -.02);   // Gesichtskante
  }
  // Nackenschutz hinten unten
  side(h0, [[-3.3, 23.2], [-1.2, 23.3], [-1.3, 24.6], [-3.0, 25.0]], 4.4, c2, undefined, undefined, { bevel: .2, cham: .4 });
  // Sensorkapsel links mit drei Linsen, Halterung
  B(h0, 1.4, 2.0, 3.2, c2, [-2.6, 25.4, .7], undefined, { round: .4 });
  B(h0, .7, .5, 1.2, c2, [-1.95, 25.9, .5], undefined, { round: .15 });
  for (let i = 0; i < 3; i++) C(h0, .4, .4, .4, '#2f3247', [-3.32, 25.45, 1.8 - i * .85], [0, 0, Math.PI / 2]);
  if (o.eye) S(h0, .4, k.accent, [-3.35, 25.45, 2.2], [.6, 1, 1], undefined, { r: .2 });
  if (o.mark) for (const i of [-1, 1]) { const mk = onSurf(hm, .7, Math.PI / 2 + i * .32, .02); B(mk, .5, 1.6, .12, k.accent, [0, 0, 0], undefined, { round: 0 }); }
  if (o.antenna !== false) { B(h0, .9, 1.1, 1.2, c2, [2.25, 25.9, -1], undefined, { round: .2 }); rod(h0, [2.4, 26.4, -1.1], [2.6, 28.8, -1.5], .18, c2); }
  return hm;
}
// Waffe am Rumpf (beidhändig): Gelenk 'gun' im Griffpunkt, Lauf zielt auf target
function trooperGun(rig, grip, target, build, k) {
  rig.joint('gun', 'torso', grip);
  const w = limb(rig.s('gun'), grip, target, [0, 1, 0]); build(w, k);
  return w;
}
