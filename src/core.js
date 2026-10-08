import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const PHOTOS = window.PHOTOS || {};

// ---------- Bau-Helfer (Einheiten ≈ mm, y = oben, Figur schaut nach +z) ----------
const mats = {};
function M(c, o = {}) {
  const k = `${c}|${o.r ?? .7}|${o.m ?? .05}|${!!o.flat}`;
  return mats[k] ??= grime(new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .7, metalness: o.m ?? .05, flatShading: !!o.flat }));
}
// Leichte, ortsabhängige Farbschwankung (wirkt wie Wash/Schmutz auf bemalten Figuren)
function grime(mat, extra = '') {
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGP;\nvarying vec3 vLP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvGP = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvLP = transformed;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vGP;
varying vec3 vLP;
float gh(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float gn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(gh(i), gh(i + vec3(1, 0, 0)), f.x), mix(gh(i + vec3(0, 1, 0)), gh(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(gh(i + vec3(0, 0, 1)), gh(i + vec3(1, 0, 1)), f.x), mix(gh(i + vec3(0, 1, 1)), gh(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  float gN = gn(vGP * .8) * .55 + gn(vGP * 3.3) * .3 + gn(vGP * 11.) * .15;
  diffuseColor.rgb *= mix(.84, 1.05, gN);
  float dust = smoothstep(13., 5., vGP.y) * smoothstep(4.05, 4.5, vGP.y) * smoothstep(.3, .8, gn(vGP * 1.3)) * .12;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.5, .45, .42), dust);
` + extra);
  };
  mat.customProgramCacheKey = () => 'grime' + extra;
  return mat;
}
function mesh(geo, c, p, pos = [0, 0, 0], rot = [0, 0, 0], o = {}) {
  const mt = x => x?.isMaterial ? x : M(x, o);
  const m = new THREE.Mesh(geo, Array.isArray(c) ? c.map(mt) : mt(c));
  m.position.set(...pos); m.rotation.set(...rot);
  m.castShadow = m.receiveShadow = true;
  p.add(m); return m;
}
function B(p, w, h, d, c, pos, rot, o = {}) {
  const r = Math.min(o.round ?? .5, Math.min(w, h, d) * .45);
  const g = r > .05 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  return mesh(g, c, p, pos, rot, o);
}
const C = (p, rt, rb, h, c, pos, rot, o = {}) => mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 20), c, p, pos, rot, o);
const K = (p, r, h, c, pos, rot, o = {}) => mesh(new THREE.ConeGeometry(r, h, o.seg ?? 16), c, p, pos, rot, o);
const T = (p, R, r, c, pos, rot, o = {}) => mesh(new THREE.TorusGeometry(R, r, 8, 32), c, p, pos, rot, o);
function S(p, r, c, pos, sc = [1, 1, 1], rot, o = {}) {
  const m = mesh(new THREE.SphereGeometry(r, 24, 16), c, p, pos, rot, o);
  m.scale.set(...sc); return m;
}
const V = a => new THREE.Vector3(...a);
function orient(m, a, b) {
  const A = V(a), Bv = V(b), d = Bv.clone().sub(A);
  m.position.copy(A).add(Bv).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
const seg = (p, a, b, w, d, c, o) => orient(B(p, w, V(a).distanceTo(V(b)), d, c, undefined, undefined, o), a, b);
const rod = (p, a, b, r, c, o = {}) => orient(C(p, o.r2 ?? r, r, V(a).distanceTo(V(b)), c, undefined, undefined, o), a, b);
// Gruppe an pos, deren lokale +z-Achse auf target zeigt (für Waffen)
function aim(p, pos, target) {
  const g = new THREE.Group(); g.position.set(...pos); p.add(g);
  g.updateWorldMatrix(true, false); g.lookAt(V(target)); g.updateWorldMatrix(true, false);
  return g;
}
const wpt = (g, local) => g.localToWorld(V(local)).toArray();
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function base(p, r, h, top, rim) { C(p, r - .7, r, h, [rim, top, rim], [0, h / 2, 0], undefined, { seg: 64 }); }
function gravel(p, R, r, y, n, colors, size) {
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r, s = size * (.5 + R());
    mesh(new THREE.IcosahedronGeometry(s, 0), colors[Math.floor(R() * colors.length)], p,
      [Math.cos(a) * d, y + s * .25, Math.sin(a) * d], [R() * 6, R() * 6, R() * 6], { flat: true, r: .95 });
  }
}
function tuft(p, R, pos, c, n = 16, h = 5) {
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(); g.position.set(...pos);
    g.rotation.set((R() - .5) * 1.1, R() * 6, (R() - .5) * 1.1); p.add(g);
    const l = h * (.6 + .5 * R());
    K(g, .22, l, c[i % c.length], [0, l / 2, 0], undefined, { seg: 4 });
  }
}
// Hand-Arm vom Schulterpunkt zu einem Zielpunkt mit automatischem Ellbogen
function armTo(g, sh, hand, s, w, c, drop = 2, out = 1.5) {
  const el = [(sh[0] + hand[0]) / 2 + s * out, (sh[1] + hand[1]) / 2 - drop, (sh[2] + hand[2]) / 2];
  seg(g, sh, el, w, w, c); S(g, w * .55, c, el); seg(g, el, hand, w * 1.05, w * 1.05, c);
  return el;
}

// ---------- Detail-Helfer für Kampfanzüge ----------
// Extrudiertes Profil in XY (Tiefe entlang z, zentriert) mit gefasten Kanten
function cham(pts, c) {
  if (!c) return pts;
  const out = [];
  pts.forEach((v, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    for (const n of [a, b]) {
      const dx = n[0] - v[0], dy = n[1] - v[1], l = Math.hypot(dx, dy), f = Math.min(c / l, .3);
      out.push([v[0] + dx * f, v[1] + dy * f]);
    }
  });
  return out;
}
function prism(p, pts, depth, c, pos, rot, o = {}) {
  const bv = Math.min(o.bevel ?? .4, depth * .3), dd = Math.max(depth - 2 * bv, .02);
  const sh = new THREE.Shape(cham(pts, o.cham ?? .45).map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: dd, bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv * .8, bevelSegments: 1, curveSegments: 6 });
  geo.translate(0, 0, -dd / 2);
  return mesh(geo, c, p, pos, rot, { flat: true, ...o });
}
// Profil als (z, y) gezeichnet, Breite entlang x
function side(p, pts, width, c, pos = [0, 0, 0], rot = [0, 0, 0], o) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); p.add(g);
  prism(g, pts, width, c, [0, 0, 0], [0, -Math.PI / 2, 0], o); return g;
}
// Lokales Gliedmaßen-Koordinatensystem: z = entlang a→b, y = "vorne" (Richtung fwd), x = seitlich
function limb(p, a, b, fwd = [0, 0, 1]) {
  const A = V(a), z = V(b).sub(A).normalize();
  let f = V(fwd); if (Math.abs(f.dot(z)) > .9) f = V([0, 1, 0]);
  const y = f.sub(z.clone().multiplyScalar(f.dot(z))).normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  const g = new THREE.Group(); g.position.copy(A);
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  p.add(g); g.updateWorldMatrix(true, false); g.len = V(a).distanceTo(V(b));
  return g;
}
const METAL = '#6b6e73';
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const add = (a, b) => a.map((v, i) => v + b[i]);


// ---------- Loft: glatte Körper aus Querschnitten (Rümpfe, Helme, gewölbte Platten, Tierkörper) ----------
// rings: [{ z, x, y, w, h, hb, e, eb }] – Querschnitt in der lokalen xy-Ebene, Achse = lokales z.
// w halbe Breite, h halbe Höhe oben (+y), hb unten (−y); e/eb Superellipsen-Exponent (2 = Ellipse, 4+ = kantig gerundet).
// Zwischen den Ringen wird mit Catmull-Rom weich interpoliert. Die Enden werden mit Kappen geschlossen.
// Rückgabe: Mesh mit .pt(z, a, off) → Punkt auf der Oberfläche (Winkel a: 0 = +x, π/2 = +y) im Elternraum, .nrm(z, a) → Normale.
const LOFT_KEYS = ['z', 'x', 'y', 'w', 'h', 'hb', 'e', 'eb'];
function loftEval(rings, t) {
  const n = rings.length - 1, i = Math.max(0, Math.min(n - 1, Math.floor(t))), f = t - i;
  const r0 = rings[Math.max(0, i - 1)], r1 = rings[i], r2 = rings[i + 1], r3 = rings[Math.min(n, i + 2)], out = {};
  for (const k of LOFT_KEYS) {
    const v = r => r[k] ?? (k === 'hb' ? r.h : k === 'eb' ? (r.e ?? 2.5) : k === 'e' ? 2.5 : (k === 'x' || k === 'y') ? 0 : r[k]);
    const p0 = v(r0), p1 = v(r1), p2 = v(r2), p3 = v(r3);
    out[k] = .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  }
  out.w = Math.max(out.w, .01); out.h = Math.max(out.h, .01); out.hb = Math.max(out.hb, .01); out.e = Math.max(out.e, 1.2); out.eb = Math.max(out.eb, 1.2);
  return out;
}
const spow = (t, e) => Math.sign(t) * Math.pow(Math.abs(t), 2 / e);
function loftPoint(r, a, off = 0) {
  const ca = Math.cos(a), sa = Math.sin(a), top = sa >= 0, e = top ? r.e : r.eb, hh = top ? r.h : r.hb;
  const x = r.w * spow(ca, e), y = hh * spow(sa, e);
  // Versatz entlang der (näherungsweisen) Querschnittsnormalen
  let nx = x / (r.w * r.w), ny = y / (hh * hh); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
  return [r.x + x + nx * off, r.y + y + ny * off];
}
function loft(p, rings, c, pos = [0, 0, 0], rot = [0, 0, 0], o = {}) {
  const N = o.n ?? 40, S = o.sub ?? 4, rows = [];
  for (let i = 0; i < rings.length - 1; i++) for (let s = 0; s < S; s++) rows.push(loftEval(rings, i + s / S));
  rows.push(loftEval(rings, rings.length - 1));
  const pos3 = [], idx = [];
  for (const r of rows) for (let i = 0; i < N; i++) {
    const [x, y] = loftPoint(r, i / N * Math.PI * 2); const v = [x, y, r.z]; o.warp?.(v, r); pos3.push(...v);
  }
  const R = rows.length;
  for (let j = 0; j < R - 1; j++) for (let i = 0; i < N; i++) {
    const a = j * N + i, b = j * N + (i + 1) % N, c2 = a + N, d = b + N;
    idx.push(a, b, c2, b, d, c2);
  }
  // Kappen
  for (const [j, flip] of [[0, true], [R - 1, false]]) {
    const r = rows[j], v = [r.x, r.y, r.z]; o.warp?.(v, r); const ci = pos3.length / 3; pos3.push(...v);
    for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N; flip ? idx.push(ci, b, a) : idx.push(ci, a, b); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos3, 3)); geo.setIndex(idx);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos3.length / 3 * 2).fill(0), 2));
  geo.computeVertexNormals();
  const m = mesh(geo, c, p, pos, rot, o);
  const tAt = z => { // Ring-Parameter zur Höhe z (monoton steigendes z vorausgesetzt)
    for (let i = 0; i < rings.length - 1; i++) if (z <= rings[i + 1].z || i === rings.length - 2) {
      let lo = i, hi = i + 1; for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; loftEval(rings, mid).z < z ? lo = mid : hi = mid; } return (lo + hi) / 2; }
  };
  m.updateMatrix();
  m.local = (z, a, off = 0) => { const r = loftEval(rings, tAt(z)), [x, y] = loftPoint(r, a, off), v = [x, y, r.z]; o.warp?.(v, r); return v; };
  m.pt = (z, a, off = 0) => V(m.local(z, a, off)).applyMatrix4(m.matrix).toArray();
  m.nrm = (z, a) => { const P = V(m.local(z, a, 0)), Q = V(m.local(z, a, 1)); return Q.sub(P).normalize().transformDirection(m.matrix).toArray(); };
  return m;
}
// Schmales Band/Linie auf einer Loft-Oberfläche: um den Körper bei Höhe z (Winkel a0..a1) …
function loftRing(L, z, r, c, a0 = 0, a1 = Math.PI * 2, n = 64, off = .05) {
  const pts = []; for (let i = 0; i <= n; i++) pts.push(V(L.pt(z, a0 + (a1 - a0) * i / n, off)));
  const closed = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6; if (closed) pts.pop();
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), n, r, 6, closed), c, L.parent);
}
// … oder längs bei festem Winkel a von z0 bis z1
function loftLine(L, a, z0, z1, r, c, n = 24, off = .05) {
  const pts = []; for (let i = 0; i <= n; i++) pts.push(V(L.pt(z0 + (z1 - z0) * i / n, a, off)));
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, 6, false), c, L.parent);
}
// Objekt auf die Oberfläche setzen: lokale +z-Achse entlang der Flächennormalen
function onSurf(L, z, a, off = 0) {
  const g = new THREE.Group(); g.position.set(...L.pt(z, a, off)); L.parent.add(g);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), V(L.nrm(z, a)));
  return g;
}
// Gewölbte Panzerplatte (Loft entlang z, flacher kantig-gerundeter Querschnitt, quer gewölbt):
// prof: [[z, halbe Breite], …], th Dicke, arch Wölbung quer (Mitte höher), bow Wölbung längs
function shell(p, prof, th, c, pos, rot, o = {}) {
  const zs = prof.map(q => q[0]), z0 = Math.min(...zs), z1 = Math.max(...zs), W = Math.max(...prof.map(q => q[1]));
  const rings = prof.map(([z, w, dy = 0]) => ({ z, w, h: th / 2, e: o.e ?? 6, y: dy }));
  return loft(p, rings, c, pos, rot, { n: o.n ?? 36, sub: o.sub ?? 4, ...o,
    warp: v => { const u = v[0] / W, s = ((v[2] - z0) / (z1 - z0 || 1)) * 2 - 1; v[1] -= (o.arch ?? 0) * u * u + (o.bow ?? 0) * s * s; o.warp2?.(v); } });
}
// Gruppe mit frei gewählten lokalen Achsen (X, Y, Z als Weltrichtungen im Elternraum)
function basis(p, pos, X, Y, Z) {
  const g = new THREE.Group(); g.position.set(...pos);
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(X).normalize(), V(Y).normalize(), V(Z).normalize()));
  p.add(g); return g;
}
