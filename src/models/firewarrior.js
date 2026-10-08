// ---------- 7 · Fire Warrior / Shas'ui ----------
function firewarrior() {
  const g = new THREE.Group(), rig = new Rig(g), R = rng(7);
  const red = '#c41f2a', ar = '#d9d8cf', ar2 = '#bdb8a6';
  const k = { suit: '#1d1e21', armor: ar, vest: '#1d1e21', vestW: 5, shin: '#2a2b2f', thighW: 2.6, armor2: ar2, boot: '#1d1e21', thigh: '#2a2b2f', accent: red, gun: '#b8bdb7', gun2: '#8f9590',
    padScale: .62, pack: ar,
    // kniend: Figur wird um 4 abgesenkt; linkes Knie (Figur-links) am Boden, rechtes Bein aufgestellt
    legs: { '-1': [[-2.1, 15.6, 0], [-2.6, 13.6, 5.4], [-2.8, 9.4, 4.6]], '1': [[2.1, 15.6, 0], [2.5, 9, 1], [2.7, 9.4, -4.6]] },
    padMark: { '1': (pg, s, ps) => S(pg, .8, red, [s * .7, .1, 0], [.4, 1, 1], undefined, { r: .25 }),
               '-1': (pg, s, ps) => S(pg, .8, red, [s * .7, .1, 0], [.4, 1, 1], undefined, { r: .25 }) } };
  const bs = gradBase(g, 12.5, 3.5, '#5d4434', '#4b3729', '#3a2a20', 7);
  gravel(bs, R, 11.3, 3.5, 60, ['#5b4231', '#3d2c21', '#7a6a5c', '#8c8378'], .55);
  gravel(bs, R, 10, 3.6, 22, ['#7fae5a', '#a9c25a', '#c9c94e'], .4);
  mesh(new THREE.IcosahedronGeometry(1.3, 0), '#6a7cc0', bs, [1.6, 4, 5.4], [1, 2, 0], { flat: true });
  mesh(new THREE.IcosahedronGeometry(1.5, 0), '#7d7f84', bs, [-2.4, 4.1, 6.8], [0, 1, 2], { flat: true });
  tuft(bs, R, [-7.5, 3.5, 3], ['#8a7a4a', '#a08e58', '#6f6a3c'], 26, 5.5);
  tuft(bs, R, [7, 3.5, -5], ['#8a7a4a', '#a08e58', '#6f6a3c'], 14, 4);
  trooper(rig, k);
  // Helm mit rotem „III“-Symbol; roter Haarbusch fällt hinten rechts herab
  const h = rig.s('head');
  tauHelmet(h, k, { mark: true, antenna: false, long: 1.1, flat: .9 });
  // Haarbusch: drei flache, fließende Bänder, die hinten rechts herabfallen
  // Ansatz hinten oben am Helm, fällt breit nach hinten-unten
  [[0, 0, 1], [1.2, .25, .9], [-1.1, .2, .85]].forEach(([dx, dz, l], j) => {
    const pts = [[.5, 25.5, -4.6], [1, 24.9, -5.4], [1.5, 23.8, -5.8], [1.9, 22.6, -5.7], [2.2, 21.4, -5.3], [2.4, 20.3, -4.9]]
      .slice(0, Math.round(6 * l)).map(([x, y, z], i) => V([x + dx * (.4 + i * .25), y - Math.abs(dx) * i * .15, z + dz * i * .15]));
    const pl = new THREE.Group(); pl.position.set(pts[0].x, 0, 0); h.add(pl);
    const tube = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => p.clone().setX(p.x - pts[0].x))), 20, .56 - j * .07, 8, false), M(red, { r: .45 }), pl);
    tube.scale.set(.55, 1, 1);
  });
  // Pulskarabiner im Anschlag an der rechten Schulter, nach vorn
  const w = trooperGun(rig, [-2.3, 21.1, 4.7], [5, 21.7, 33.8], pulseCarbine, k);
  trooperArm(rig, k, -1, wpt(w, [0, -1.6, -.4]));
  trooperArm(rig, k, 1, wpt(w, [0, -1.8, 5.6]));
  rig.j.root.position.y = -4;
  rig.j.head.rotation.set(.1, -.15, 0);
  rig.walk = { period: .9, stride: 4.6, lift: 1.6, bob: .55, sway: .17, armSwing: 0, rise: 4, extra: p => ({ gun: [.09 * Math.sin(Math.PI * 4 * p), .06 * Math.sin(Math.PI * 2 * p), 0], head: [.06 * Math.sin(Math.PI * 4 * p + 1), 0, 0] }) };
  rig.shoot = { period: .9 };
  const dir = [7.3, .6, 29.1], back = V(dir).normalize().multiplyScalar(-1.1).toArray();
  for (const at of [0, .33, .66]) rig.kicks.push({ joint: 'gun', at, pos: back, lift: [dir, .14], torso: .05, decay: 9 }, { joint: 'shoulder_R', at, lift: [dir, .06], decay: 9 }, { joint: 'shoulder_L', at, lift: [dir, .06], decay: 9 });
  rig.j.torso.rotation.set(.04, -.1, 0);
  rig.j.head.rotation.x += .28;
  rig.finalize();
  return g;
}
