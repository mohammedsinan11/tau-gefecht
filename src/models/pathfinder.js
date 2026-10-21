// ---------- 6 · Pathfinder mit Rail Rifle ----------
function pathfinder() {
  const g = new THREE.Group(), rig = new Rig(g), R = rng(6);
  const red = '#d0252d';
  const k = { suit: '#1f2023', armor: '#e4e3dd', vest: '#c9c8c1', packScale: .7, armor2: '#c9c8c1', boot: '#24346e', thigh: '#2a2b2f', shin: '#2a2b2f', knee: '#2a2b2f', visor: '#15161a',
    forearm: '#2a2b2f', pack: '#c8b685', accent: red, gun: '#c8b685', gun2: '#a8975f', cu: '#8f5f28', cu2: '#5a3c1c',
    pouches: [[2.7, 16.6, 2.3, 1.2, 1.3], [-2.7, 16.6, 2.3, 1.2, 1.3], [0, 16.6, -2.9, 1.6, 1.3]],
    // geduckt: Figur wird um 2 abgesenkt, Beinpositionen vor dem Absenken
    legs: { '-1': [[-2.4, 15.6, 0], [-3.1, 12.6, 4.4], [-3.4, 8.2, 2.2]], '1': [[2.4, 15.6, 0], [3.2, 11, .6], [3.6, 8.2, -3.4]] },
    padScale: .62,
    padMark: { '-1': (pg, s) => { for (let i = 0; i < 3; i++) B(pg, .2, 1.1, .3, red, [s * .62, -.1, -.6 + i * .6], undefined, { round: 0 }); } } };
  const bs = gradBase(g, 12.5, 3.5, '#6a503e', '#523c2d', '#3a2a20', 6);
  gravel(bs, R, 11, 3.5, 34, ['#5a4232', '#3f2e22', '#6b5444'], .5);
  trooper(rig, k);
  // Poncho: schwarzer Stoff vorn und hinten, von der Hüfte bis über die Knie
  const cloth = new THREE.MeshStandardMaterial({ color: '#141517', roughness: .9, side: THREE.DoubleSide, flatShading: true });
  for (const [t0, tl] of [[-1.3, 2.6], [Math.PI - 1.2, 2.4]])
    mesh(new THREE.CylinderGeometry(3.3, 5.4, 7.6, 9, 2, true, t0, tl), cloth, rig.s('pelvis'), [0, 13.3, .2]).userData.noFx = true;
  B(rig.s('pelvis'), 6, .8, 4.2, '#3a2f22', [0, 17, .1], undefined, { round: .3 });
  // Helm: dunkel mit weißem Sichtband und rotem Zielsensor
  tauHelmet(rig.s('head'), k, { color: '#2c2f52', color2: '#2c2f52', face: '#353a66', band: '#d8d6cf', eye: true, long: .75, wedge: true });
  // Rail Rifle im Anschlag an der rechten Schulter, ca. 22° nach oben
  const w = trooperGun(rig, [-1.6, 22.2, 4.4], [9.6, 38.6, 30], railRifle, k);
  trooperArm(rig, k, -1, wpt(w, [0, -1.7, -.3]));
  trooperArm(rig, k, 1, wpt(w, [0, -1.5, 5.6]));
  // Antenne am Rückenmodul
  rig.j.root.position.y = -2.8;
  rig.j.head.rotation.set(.12, .12, 0);
  rig.walk = { period: .9, stride: 4.6, lift: 1.6, bob: .4, sway: .1, armSwing: 0, rise: .9, extra: p => ({ gun: [.05 * Math.sin(Math.PI * 4 * p), .04 * Math.sin(Math.PI * 2 * p), 0] }) };
  rig.shoot = { period: 1.4 };
  const dir = V([9.6, 38.6, 30]).sub(V([-1.6, 22.2, 4.4])).toArray(), back = V(dir).normalize().multiplyScalar(-1.4).toArray();
  rig.kicks.push({ joint: 'gun', at: 0, pos: back, lift: [dir, .17], torso: .14, decay: 5 }, { joint: 'shoulder_R', at: 0, lift: [dir, .14], decay: 5 },
    { joint: 'shoulder_L', at: 0, lift: [dir, .14], decay: 5 }, { joint: 'head', at: 0, rot: [-.14, 0, 0], decay: 5 });
  rig.j.torso.rotation.set(.3, -.15, 0);
  rig.j.head.rotation.x += .18;
  rig.finalize();
  return g;
}
