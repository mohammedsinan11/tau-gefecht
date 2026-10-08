// ---------- 5 · XV25 Stealth Suit (geriggt) ----------
// Gebückter, eiförmiger Rumpf mit integriertem Sensorkopf, flache ovale Schulterplatten, rote Panel-Konturen.
// Burst Cannon rechts (dreht und rüttelt beim Schießen), kleines Gerät links. Kleine flache schwarze Base.
function stealth() {
  const g = new THREE.Group(), rig = new Rig(g);
  const sd = '#c8bd9e', sd2 = '#b2a785', red = '#a8242c', dk = '#232325', gun = '#6d7278', G = 2;
  const line = (p, a, b, w = .32) => seg(p, a, b, w, .22, red, { round: 0 });
  const outline = (p, pts, z) => pts.forEach((q, i) => line(p, [...q, z], [...pts[(i + 1) % pts.length], z]));
  gradBase(g, 11.5, G, '#26262a', '#1c1c1f', '#121214', 5);
  rig.joint('root', null, [0, 0, 0]);
  rig.joint('pelvis', 'root', [0, 14.4, 0]);
  const legs = { '-1': [[-3.1, 14.4, 0], [-3.9, 9.6, 3], [-4.1, 4.2, -.4]], '1': [[3.1, 14.4, 0], [3.9, 9.8, 2.4], [4.2, 4.2, -1.4]] };
  for (const s of [-1, 1]) {
    const [hip, knee, ank] = legs[s], n = ['hip', 'knee', 'ankle'].map(x => x + sfx(s));
    const gh = rig.joint(n[0], 'pelvis', hip), gk = rig.joint(n[1], n[0], knee), ga = rig.joint(n[2], n[1], ank);
    rig.leg(s, hip, knee, ank, n);
    S(gh, 1.6, dk, hip);
    // Oberschenkel: schlanker Kern, sandfarbene Panzerschale mit roter Kontur
    const th = limb(gh, hip, knee), L1 = th.len;
    B(th, 2.4, 2.6, L1, dk, [0, 0, L1 / 2], undefined, { round: .5 });
    side(th, [[.3, .9], [L1 * .85, .9], [L1 * .7, 2.5], [.9, 2.4]], 3.2, sd, undefined, undefined, { cham: .45 });
    line(th, [s * 1.65, 1.2, .8], [s * 1.65, 1.2, L1 * .78]);
    S(gk, 1.5, sd, knee, [1, 1, 1.1]);
    // Schienbein: nach unten schmaler werdender Panzer
    const sh = limb(gk, knee, ank), L2 = sh.len;
    B(sh, 2.1, 2.2, L2, dk, [0, 0, L2 / 2], undefined, { round: .45 });
    side(sh, [[-1.2, 1], [L2 - .9, 1], [L2 - 1.2, 1.9], [1.2, 2.8], [-.9, 2.6]], 3, sd, undefined, undefined, { cham: .45 });
    line(sh, [0, 2.95, -.3], [0, 2.1, L2 - 1.3]);
    // Fuß: zwei Zehen vorn, Ferse
    const fx = ank[0], fz = ank[2];
    S(ga, 1.1, dk, ank);
    B(ga, 2.2, 1.8, 2.6, dk, [fx, G + 1, fz], undefined, { round: .45 });
    for (const t of [-1, 1]) side(ga, [[0, G], [3.2, G], [2.9, G + .8], [.2, G + 1.4]], 1.1, sd, [fx + t * .62, 0, fz + .8], [0, t * .2, 0], { bevel: .18, cham: .3 });
    side(ga, [[0, G], [-2.4, G], [-2, G + .9], [0, G + 1.5]], 1.5, sd2, [fx, 0, fz - .8], undefined, { bevel: .18, cham: .3 });
  }
  const pv = rig.s('pelvis');
  B(pv, 5.8, 2.6, 4, dk, [0, 15, 0], undefined, { round: .6 });
  prism(pv, [[-1.8, 1.3], [1.8, 1.3], [1.2, -1.7], [-1.2, -1.7]], .9, sd, [0, 14.4, 2.2], [-.15, 0, 0], { cham: .4 });
  for (const s of [-1, 1]) side(pv, [[-1.8, 16], [1.8, 16], [1.4, 12.8], [-1.4, 12.6]], .9, sd, [s * 3.2, 0, .2], [0, 0, s * .18], { cham: .4 });
  // Rumpf: gebücktes Ei (Gelenk 'torso' neigt ihn ca. 25° nach vorn)
  rig.joint('torso', 'pelvis', [0, 15.6, 0]);
  const t = rig.s('torso');
  for (let i = 0; i < 3; i++) B(t, 4.6 - i * .3, .9, 3.6, i % 2 ? '#2e2f33' : dk, [0, 16.4 + i * .8, 0], undefined, { round: .35 });
  // Rumpf als Loft: unten schmale Taille, vorgewölbte Brust, oben der integrierte Kopfbuckel.
  // Loft-Achse = Weltachse y (lokal z), lokal +y = hinten, hb = Tiefe nach vorn.
  const body = loft(t, [
    { z: 16.4, w: 2.5, h: 2.0, hb: 2.2, e: 2.4 },
    { z: 17.7, w: 4.1, h: 3.1, hb: 3.6, e: 2.5 },
    { z: 19.5, w: 5.1, h: 4.0, hb: 5.0, e: 2.8 },
    { z: 21.4, w: 5.4, h: 4.3, hb: 5.8, e: 3.0, y: -.2 },
    { z: 23.2, w: 5.0, h: 4.1, hb: 6.2, e: 3.0, y: -.6 },
    { z: 24.6, w: 4.2, h: 3.4, hb: 5.8, e: 2.8, y: -.9 },
    { z: 25.6, w: 3.0, h: 2.4, hb: 4.4, e: 2.5, y: -.9 },
    { z: 26.2, w: 1.5, h: 1.2, hb: 2.2, e: 2.2, y: -.7 },
    { z: 26.4, w: .15, h: .15, hb: .15, y: -.6 },
  ], sd, [0, 0, 1.6], [-Math.PI / 2, 0, 0], { n: 56, sub: 5 });
  const F = -Math.PI / 2, BK = Math.PI / 2;     // Winkel: vorn / hinten
  // umlaufende Naht unter der Brust, Rückennaht, Schulterkanten
  loftRing(body, 19.1, .2, red, 0, Math.PI * 2, 96);
  loftRing(body, 22.6, .14, '#4a463e', -2.45, -.7, 48);
  for (const d of [-.32, .32]) loftLine(body, BK + d, 19.4, 25.6, .17, red);
  // Brustplatten seitlich unter dem Sensorfeld (auf die Oberfläche gesetzt), mit roter Kontur
  for (const s of [-1, 1]) {
    const cg = onSurf(body, 20.8, F + s * .66, .05); cg.rotateZ(s * .15); cg.scale.set(.7, .7, 1);
    const pts = [[-1.7, -1.5], [1.7, -1.2], [1.6, 1.5], [-1.6, 1.7]];
    prism(cg, pts, .55, sd2, undefined, undefined, { cham: .45, bevel: .15 });
    outline(cg, cham(pts, .45).filter((_, i) => i % 2 === 0), .3);
  }
  // eingelassenes Sensorfeld vorn am Kopfbuckel: dunkle Fläche, roter Sensor, Augenbraue, rote Kontur
  const sg = onSurf(body, 24.2, F, -.05); sg.scale.set(.88, .72, .72);
  const sp = [[-1.9, -1.1], [1.9, -1.1], [1.5, 1.1], [-1.5, 1.1]];
  prism(sg, sp, .3, '#1d1d20', undefined, undefined, { cham: .35, bevel: .05 });
  S(sg, .55, red, [0, 0, .12], [1, 1, .45], undefined, { r: .2 });
  for (const s of [-1, 1]) S(sg, .22, '#6fc3ff', [s * 1.1, -.2, .12], [1, 1, .5], undefined, { r: .2 });
  B(sg, 4.4, .55, .7, sd2, [0, 1.5, .2], [-.35, 0, 0], { round: .2 });
  outline(sg, sp, .12);
  // zwei kurze rote Antennen oben hinten
  for (const s of [-1, 1]) prism(t, [[-.4, 0], [.4, 0], [.2, 3.4], [-.2, 3]], .5, red, [s * 1.6, 22.3, -5.2], [-.6, 0, s * -.2], { bevel: .1, cham: .15 });
  // Rückenmodul mit roten Kanten
  side(t, [[-2.4, 18.4], [-5.6, 18.7], [-5.9, 21.8], [-4.8, 22.6], [-2.4, 22.6]], 5.4, sd, undefined, undefined, { cham: .5 });
  for (const s of [-1, 1]) { line(t, [s * 2.75, 19, -5], [s * 2.75, 22.2, -5.3]); C(t, .8, .8, .8, sd2, [s * 1.6, 22.9, -4.6]); }
  for (let i = 0; i < 3; i++) B(t, 3.2, .25, .3, dk, [0, 19.4 + i * .7, -5.95], undefined, { round: 0 });
  // Arme mit flachen, ovalen Schulterplatten (Spiralscheibe, rote Kontur)
  const arm = (s, elbow, wrist, handTo) => {
    const x = sfx(s), sh = [s * 4.9, 23, -.4];
    const a = rig.joint('shoulder' + x, 'torso', sh), e = rig.joint('elbow' + x, 'shoulder' + x, elbow), w = rig.joint('wrist' + x, 'elbow' + x, wrist);
    rig.arms.push({ joint: 'shoulder' + x, side: s });
    S(a, 1.2, dk, [sh[0] * .97, sh[1] - .6, sh[2]]);
    // gewölbte, ovale Schulterschale mit roten Randlinien und rundem Emblem
    const pg = basis(a, [s * 6.4, 20.2, -.5], [0, 0, s], [s, -.27, 0], [s * .27, 1, 0]);
    const pad = shell(pg, [[-4.2, .4], [-3.4, 2.5], [-1.4, 3.5], [1.4, 3.5], [3.4, 2.5], [4.2, .4]], 1.1, sd, [0, 0, 0], [0, 0, 0], { arch: 1.4, bow: 1.2, n: 40 });
    for (const ang of [0, Math.PI]) loftLine(pad, ang, -3.6, 3.6, .17, red, 30, -.05);
    C(pg, 1.3, 1.3, .35, sd2, [0, .1, 0], [0, 0, 0]);
    T(pg, 1.05, .13, red, [0, .32, 0], [Math.PI / 2, 0, 0]);
    T(pg, .5, .1, dk, [0, .34, 0], [Math.PI / 2, 0, 0]);
    const ua = limb(a, sh, elbow);
    B(ua, 2.1, 2.1, ua.len, dk, [0, 0, ua.len / 2], undefined, { round: .45 });
    S(e, 1.4, dk, elbow);
    const fa = limb(e, elbow, wrist, [0, 1, 0]);
    B(fa, 2, 2, fa.len, dk, [0, 0, fa.len / 2], undefined, { round: .45 });
    side(fa, [[-.4, -1.6], [fa.len, -1.4], [fa.len + .3, 0], [fa.len, 1.7], [-.4, 1.9]], 3, sd, undefined, undefined, { cham: .4 });
    line(fa, [s * 1.55, 1.1, .2], [s * 1.55, .9, fa.len - .3]);
    const hd = limb(w, wrist, handTo);
    B(hd, 2, 1.8, 2, dk, [0, 0, .8], undefined, { round: .45 });
    for (let i = 0; i < 3; i++) B(hd, .55, .6, 1.5, dk, [-.65 + i * .65, .35, 1.9], [.7, 0, 0], { round: .22 });
    return fa;
  };
  // Burst Cannon am rechten Unterarm: lang, dick, metallisch; Läufe drehen sich beim Schießen
  const fr = arm(-1, [-7.4, 19.6, 1.6], [-8.6, 18.4, 6.6], [-8.8, 17.8, 8.4]);
  const bc = rig.add('cannon', new THREE.Group()); bc.position.set(0, -2.7, -1.2); fr.add(bc);
  C(bc, 2.1, 2.1, 11, gun, [0, 0, 5.5], [Math.PI / 2, 0, 0], { m: .6, r: .4 });
  for (const z of [1.4, 9.8]) C(bc, 2.25, 2.25, .7, '#2a2c30', [0, 0, z], [Math.PI / 2, 0, 0], { m: .5 });
  B(bc, 1.6, 1.4, 6, gun, [0, 2.2, 4.5], undefined, { m: .5, round: .3 });
  const br = rig.add('barrels', new THREE.Group()); br.position.set(0, 0, 11); bc.add(br);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; C(br, .5, .5, 4.6, '#2a2c30', [Math.cos(a) * 1, Math.sin(a) * 1, 2.3], [Math.PI / 2, 0, 0], { m: .5 }); }
  for (const z of [.8, 4.2]) C(br, 1.75, 1.75, .55, gun, [0, 0, z], [Math.PI / 2, 0, 0], { m: .6, r: .4 });
  // Gerät in der linken Hand
  arm(1, [7.8, 19, .8], [8.7, 15.4, 3.4], [8.9, 13.8, 5]);
  const dv = limb(rig.s('wrist_L'), [8.9, 14.2, 4.2], [9.2, 12.2, 8.8]);
  C(dv, 1.2, 1.2, 3.2, gun, [0, 0, 1.3], [Math.PI / 2, 0, 0], { m: .6, r: .4 });
  C(dv, 1.35, 1.35, .5, '#9aa0a6', [0, 0, 3], [Math.PI / 2, 0, 0], { m: .6, r: .35 });
  S(dv, .45, red, [0, 1.2, 1.1], undefined, undefined, { r: .25 });
  rig.walk = { period: 1, stride: 6, lift: 2.2, bob: .5, sway: .09, armSwing: .15 };
  rig.shoot = { period: 1 };
  rig.spins.push({ joint: 'barrels', speed: Math.PI * 6 });
  // schnelles Rütteln der Kanone und des Arms
  // schnelles Rütteln: vier Stöße kurz hintereinander, dann Pause
  for (const at of [0, .1, .2, .3]) rig.kicks.push({ joint: 'cannon', at, pos: [0, .5, -3.6], rot: [-.14, 0, 0], decay: 16 }, { joint: 'elbow_R', at, rot: [-.38, 0, 0], torso: .09, decay: 16 });
  rig.aim = { shoulder_R: [-.15, 0, 0] };
  rig.j.torso.rotation.set(.42, .06, 0);
  rig.j.shoulder_R.rotation.set(-.42, 0, 0); rig.j.shoulder_L.rotation.set(-.3, 0, 0);
  rig.finalize();
  return g;
}
