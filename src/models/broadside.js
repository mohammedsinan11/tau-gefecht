// ---------- 3 · XV88 Broadside (geriggt, im Farbschema der Crisis-Suits bemalt) ----------
// Schwerer XV8-Körper mit Zusatzpanzern; links lange Rail-Kanone auf der Schulter, rechts schwere Doppelwaffe,
// rechter Arm mit Gatling (dreht beim Schießen), linker Arm mit Faust.
function broadside() {
  const g = new THREE.Group(), rig = new Rig(g), R = rng(3);
  const red = '#a8232b', cream = '#d2c7a8', grey = '#8a9096', dgrey = '#4a4f55';
  const k = { main: cream, main2: '#bfb393', upperChest: '#a9adb2', chestCore: '#a9adb2', plate: '#5a5f66', pad: cream, pad2: '#5a5f66', upper: dgrey,
    dark: '#26282b', knee: dgrey, shin: dgrey, shin2: '#3e4247', shinAcc: red, calf: '#3a3d42', foot: cream, thighPlate: cream,
    head: '#a7aeb4', eye: '#e2572b', chestDot: '#c8232c', heavy: true, hood: true, bigFist: -1,
    legs: { '-1': [[-5.4, 28, 0], [-8.8, 17.6, 3.6], [-10, 8.8, -.6]], '1': [[5.4, 28, 0], [8.8, 17.6, 3.6], [10, 8.8, -.6]] } };
  const bs = gradBase(g, 30, 4, '#8a857c', '#726e67', '#9aa0a6', 3);
  gravel(bs, R, 27, 4, 150, ['#8f8c84', '#a7a49a', '#6f6c66', '#9b968a'], .9);
  B(bs, 9, 2.2, 4.5, '#6c7076', [-9, 5.1, 16], [0, .5, .08], { m: .3 });
  rod(bs, [-7, 5.8, 16], [-2, 5.6, 20], .5, '#6c7076');
  B(bs, 3, 1.2, 3, '#a8232b', [-10.5, 6.3, 15.2], [0, .5, .1]);
  const t = xv8(rig, k);
  // Ganzes Rig etwas größer als ein Crisis Suit, Füße bleiben auf der Base
  rig.j.root.scale.setScalar(1.12); rig.j.root.position.y = 4 - 4 * 1.12;
  rig.j.torso.scale.set(1.34, 1.08, 1.22);   // deutlich breiterer, blockiger Rumpf
  for (const s of [-1, 1]) { C(t, 3.4, 3.4, 4.4, '#3a3d42', [s * 9.4, 36.6, -.3], [0, 0, Math.PI / 2], { seg: 24 }); C(t, 2, 2, 4.6, '#5a5f66', [s * 9.4, 36.6, -.3], [0, 0, Math.PI / 2], { m: .4 }); }
  // Linke Schulter: langer, dünner Einzellauf (wie im Foto fast senkrecht)
  B(t, 4.6, 5.2, 5.6, cream, [-11.2, 43.6, -3]);
  B(t, 4.8, 1, 5.8, red, [-11.2, 41.6, -3], undefined, { round: .2 });
  S(t, 2.1, k.dark, [-11.2, 46.8, -.6]);
  const rc = rig.add('gun_S_R', limb(t, [-11.2, 46.2, -3], [-11.3, 66, -.4], [0, 0, 1]));
  side(rc, [[-1.6, -2.2], [5, -2.2], [5.6, 0], [5, 2.4], [-1.6, 2.4]], 3.8, grey, undefined, undefined, { m: .25 });
  B(rc, 2, 1.4, 4, '#2f6fd0', [0, 2.6, 2.4], undefined, { r: .3 });
  B(rc, 1.6, .3, 3.4, '#8cc8ff', [0, 3.35, 2.4], undefined, { round: .1 });
  C(rc, .9, .9, 15, cream, [0, 0, 12.5], [Math.PI / 2, 0, 0]);
  for (const z of [9, 14.5]) C(rc, 1.25, 1.25, .7, grey, [0, 0, z], [Math.PI / 2, 0, 0], { m: .3 });
  B(rc, 2.2, 2.2, 2, grey, [0, 0, 20.5], undefined, { m: .25, round: .3 });
  // Rechte Schulter: aufrechte Zwillingswaffe mit Ringen, runde Trommel oben
  B(t, 4.6, 3.2, 5.2, cream, [12.2, 42.6, -2], undefined, { round: .4 });
  B(t, 4.7, .9, 5.3, red, [12.2, 43.8, -2], undefined, { round: .2 });
  const tw = rig.add('gun_S_L', limb(t, [12.6, 44.4, -1.4], [13.4, 60, 2.4], [0, 0, 1]));
  B(tw, 5, 4, 4, grey, [0, 0, 1.6], undefined, { m: .25, round: .5 });
  for (const dx of [-1.4, 1.4]) { C(tw, 1.15, 1.15, 12, cream, [dx, 0, 9.5], [Math.PI / 2, 0, 0]); C(tw, .6, .6, 12.2, '#1a1b1d', [dx, 0, 9.5], [Math.PI / 2, 0, 0]); }
  for (const z of [6.5, 10.5]) B(tw, 5.2, 2.8, .8, grey, [0, 0, z], undefined, { m: .3, round: .3 });
  C(tw, 2.5, 2.5, 5, cream, [0, 0, 16.4], [0, 0, Math.PI / 2]);
  for (const x of [-2.6, 2.6]) C(tw, 2.6, 2.6, .4, k.dark, [x, 0, 16.4], [0, 0, Math.PI / 2]);
  // Linker Arm (Figur-rechts): Faust
  xvArm(rig, k, -1, [-14.6, 28.5, 2.4], [-15.6, 23.6, 7], [-15.8, 20.6, 8.6]);
  // Rechter Arm (Figur-links): kurze Zwillingswaffe außen am Unterarm, schräg nach vorn-unten
  const fa = xvArm(rig, k, 1, [15, 28.4, -1], [16.6, 25.8, 6.7], [16.9, 24.8, 9]);
  // langes Zwillingsrohr mit Ringen außen am Unterarm, schräg nach vorn-unten
  const gb = rig.add('armgun', new THREE.Group()); gb.position.set(4, -1.4, -.4); fa.add(gb);
  B(gb, 5, 4.4, 5, grey, [0, 0, 2], undefined, { m: .25, round: .5 });
  B(gb, 5.1, 1, 2.4, red, [0, 2.2, 1.8], undefined, { round: .2 });
  for (const dx of [-1.3, 1.3]) { C(gb, 1.2, 1.2, 24, cream, [dx, 0, 15.5], [Math.PI / 2, 0, 0]); C(gb, .65, .65, 24.2, '#1a1b1d', [dx, 0, 15.5], [Math.PI / 2, 0, 0]); }
  for (const z of [9, 17, 25]) B(gb, 4.8, 2.8, .8, grey, [0, 0, z], undefined, { m: .3, round: .3 });
  B(gb, 4.4, 2.6, 1.6, grey, [0, 0, 27.3], undefined, { m: .3, round: .3 });
  // Animationen: schwere, langsame Schritte; Waffen feuern nacheinander, der ganze Körper sackt beim Rückstoß ab
  rig.walk = { period: 1.7, stride: 6.5, lift: 2, bob: 1.2, sway: .1, armSwing: .2 };
  rig.shoot = { period: 1.8 };
  const back = (a, b, d) => V(a).sub(V(b)).normalize().multiplyScalar(d).toArray();
  for (const [j, at, a, b] of [['gun_S_R', 0, [-11.2, 46.2, -3], [-11.3, 66, -.4]], ['gun_S_L', .33, [12.6, 44.4, -1.4], [13.4, 60, 2.4]]])
    rig.kicks.push({ joint: j, at, pos: back(a, b, 3.4), rot: [-.15, 0, 0], torso: .09, decay: 5 }, { joint: 'root', at, pos: [0, -1, -.8], decay: 5 });
  rig.kicks.push({ joint: 'armgun', at: .66, pos: [0, 0, -5], torso: .1, decay: 5 }, { joint: 'elbow_L', at: .66, rot: [-.45, 0, 0], decay: 5 },
    { joint: 'root', at: .66, pos: [0, -.6, -.5], decay: 5 });
  rig.finalize();
  return g;
}
