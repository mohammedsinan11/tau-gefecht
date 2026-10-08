// ---------- Rig: Gelenke, Bein-IK und gebackene Animationen ----------
// Ein Gelenk ist eine Gruppe mit Drehpunkt. Jedes Gelenk hat eine "space"-Untergruppe, deren Ursprung
// im Ruhezustand auf dem Weltnullpunkt liegt – Bauteile werden darin weiter in absoluten Koordinaten gebaut.
// Animationen sind Abweichungen (Delta-Drehungen/-Verschiebungen) von der Ruhepose und werden als
// THREE.AnimationClip gebacken, damit sie auch im GLB-Export landen.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Euler-Drehung (im Ruhe-Achsensystem), die einen Lauf mit Richtung dir um a (Radiant) anhebt
function liftRot(dir, a) {
  const d = V(dir).normalize(), ax = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
  return new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromAxisAngle(ax, a)).toArray().slice(0, 3);
}

class Rig {
  constructor(model) {
    this.model = model; model.userData.rig = this; this.j = {}; this.legs = []; this.arms = []; this.kicks = []; this.spins = []; this.aim = {}; this.labels = {};
    this.walk = { period: 1.2, stride: 9, lift: 3, bob: .9, sway: .2, armSwing: .5, rise: 0 };
    this.shoot = { period: 1.2 };
  }
  // Neues Gelenk; liefert den Bauraum (absolute Koordinaten)
  joint(name, parent, pivot) {
    const P = parent ? this.j[parent] : this.model, pp = parent ? P.userData.pivot : [0, 0, 0];
    const g = new THREE.Group(); g.name = name; g.userData.pivot = pivot;
    g.position.set(pivot[0] - pp[0], pivot[1] - pp[1], pivot[2] - pp[2]);
    const sp = new THREE.Group(); sp.name = name + '_teile'; sp.position.set(-pivot[0], -pivot[1], -pivot[2]);
    g.add(sp); g.userData.space = sp; P.add(g); this.j[name] = g;
    return sp;
  }
  s(name) { return this.j[name].userData.space; }
  // Beliebiges Objekt animierbar machen (z. B. Gatling-Lauf in einem schrägen limb()-Rahmen)
  add(name, obj) { obj.name = name; this.j[name] = obj; return obj; }
  // Bein für die IK registrieren: Positionen in absoluten Ruhe-Koordinaten, side +1 = linkes Bein der Figur
  leg(side, hip, knee, ankle, names, bend = 1) {
    const [hp, kp, ap] = [hip, knee, ankle];
    const L1 = Math.hypot(kp[2] - hp[2], kp[1] - hp[1]), L2 = Math.hypot(ap[2] - kp[2], ap[1] - kp[1]);
    this.legs.push({ side, names, bend, L1, L2,
      a1r: Math.atan2(kp[2] - hp[2], -(kp[1] - hp[1])), a2r: Math.atan2(ap[2] - kp[2], -(ap[1] - kp[1])),
      z0: ap[2] - hp[2], y0: ap[1] - hp[1] });
  }
  finalize() {
    for (const o of Object.values(this.j)) o.userData.rest = { q: o.quaternion.clone(), p: o.position.clone() };
    this.clips = [this.bake('Gehen', this.walk.period, t => this.walkPose(t)), this.bake('Schiessen', this.shoot.period, t => this.shootPose(t))];
    this.mixer = new THREE.AnimationMixer(this.model);
  }
  reset() {
    this.mixer?.stopAllAction();
    for (const o of Object.values(this.j)) { o.quaternion.copy(o.userData.rest.q); o.position.copy(o.userData.rest.p); }
  }
  play(name) {
    this.reset();
    const c = this.clips.find(c => c.name === name);
    if (c) this.mixer.clipAction(c).reset().play();
  }
  // Delta-Winkel (Drehung um x) für Hüfte, Knie, Knöchel, damit der Knöchel bei (tz, ty) relativ zur Hüfte liegt
  ik(L, tz, ty) {
    const D = Math.min(Math.hypot(tz, ty), (L.L1 + L.L2) * .999);
    const phi = Math.atan2(tz, -ty);
    const a = Math.acos(clamp((L.L1 * L.L1 + D * D - L.L2 * L.L2) / (2 * L.L1 * D), -1, 1));
    const a1 = phi + a * L.bend, kz = L.L1 * Math.sin(a1), ky = -L.L1 * Math.cos(a1);
    const a2 = Math.atan2(tz - kz, -(ty - ky));
    const hip = -(a1 - L.a1r), knee = -((a2 - a1) - (L.a2r - L.a1r));
    return [hip, knee, -(hip + knee)];
  }
  walkPose(t) {
    if (this.walk.fn) return this.walk.fn(t / this.walk.period, t);
    const o = this.walk, ph = t / o.period, d = {}, TAU = Math.PI * 2;
    const bob = o.bob * Math.cos(2 * TAU * ph), rise = o.rise ?? 0;
    const zc = this.legs.reduce((a, L) => a + L.z0, 0) / Math.max(1, this.legs.length);
    for (const L of this.legs) {
      const p = (ph + (L.side > 0 ? 0 : .5)) % 1;
      let z, y = L.y0 - rise;
      if (p < .6) z = zc + o.stride * (.5 - p / .6);
      else { const q = (p - .6) / .4; z = zc + o.stride * (q - .5); y += o.lift * Math.sin(Math.PI * q); }
      const [h, k, a] = this.ik(L, z, y - bob);
      d[L.names[0]] = [h, 0, 0]; d[L.names[1]] = [k, 0, 0]; d[L.names[2]] = [a, 0, 0];
    }
    d['@root'] = [0, bob + rise, 0];
    if (this.j.torso) d.torso = [o.sway * .3 * Math.cos(2 * TAU * ph), o.sway * Math.sin(TAU * ph), o.sway * .4 * Math.sin(TAU * ph)];
    for (const A of this.arms) d[A.joint] = [o.armSwing * Math.sin(TAU * ph + (A.side > 0 ? 0 : Math.PI)), 0, 0];
    if (o.extra) Object.assign(d, o.extra(ph, d));
    return d;
  }
  shootPose(t) {
    if (this.shoot.fn) return this.shoot.fn(t / this.shoot.period, t);
    const o = this.shoot, d = {};
    for (const [n, r] of Object.entries(this.aim)) d[n] = r.slice();
    let torsoKick = 0;
    for (const k of this.kicks) {
      const tt = ((t - k.at * o.period) % o.period + o.period) % o.period;
      const e = tt < .05 ? tt / .05 : Math.exp(-(tt - .05) * (k.decay ?? 6));
      if (k.rot) { const r = d[k.joint] ??= [0, 0, 0]; k.rot.forEach((v, i) => r[i] += v * e); }
      if (k.pos) { const p = d['@' + k.joint] ??= [0, 0, 0]; k.pos.forEach((v, i) => p[i] += v * e); }
      if (k.lift) { const r = d[k.joint] ??= [0, 0, 0]; liftRot(k.lift[0], k.lift[1] * e).forEach((v, i) => r[i] += v); }
      torsoKick = Math.max(torsoKick, e * (k.torso ?? .04));
    }
    if (this.j.torso) { const r = d.torso ??= [0, 0, 0]; r[0] -= torsoKick; }
    for (const s of this.spins) { const r = d[s.joint] ??= [0, 0, 0]; r[2] += t * s.speed; }
    if (o.extra) Object.assign(d, o.extra(t / o.period, d));
    return d;
  }
  // Funktion t → Deltas in einen AnimationClip backen
  bake(name, dur, fn, fps = 30) {
    const n = Math.round(dur * fps), frames = [], keys = new Set();
    for (let i = 0; i <= n; i++) { const d = fn(i / fps); frames.push(d); Object.keys(d).forEach(k => keys.add(k)); }
    const times = frames.map((_, i) => i / fps), tracks = [], q = new THREE.Quaternion(), e = new THREE.Euler();
    for (const key of keys) {
      const pos = key[0] === '@', obj = this.j[pos ? key.slice(1) : key];
      if (!obj) continue;
      const vals = [];
      for (const f of frames) {
        const v = f[key] ?? [0, 0, 0];
        if (pos) vals.push(...obj.userData.rest.p.clone().add(V(v)).toArray());
        else vals.push(...obj.userData.rest.q.clone().multiply(q.setFromEuler(e.set(...v))).toArray());
      }
      tracks.push(pos ? new THREE.VectorKeyframeTrack(obj.name + '.position', times, vals)
                      : new THREE.QuaternionKeyframeTrack(obj.name + '.quaternion', times, vals));
    }
    return new THREE.AnimationClip(name, dur, tracks);
  }
}
