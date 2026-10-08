// ---------- Nachbearbeitung: Ambient Occlusion + Kantenlichter/Wash (geteilt von Figurenseite und Spiel) ----------
function makeFx(renderer, scene, camera) {
  // Ambient Occlusion: Schatten in Fugen und Gelenken
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 800, 600);
  ao.updateGtaoMaterial({ radius: 2.8, distanceExponent: 1.4, thickness: 2.2, scale: 1.8, samples: 16, distanceFallOff: 1 });
  ao.blendIntensity = 1;
  composer.addPass(ao);
  // Oberflächen-Effekt (wie Kantenbemalung und Wash bei echten Miniaturen): aus den Normalen des AO-Passes
  // die Krümmung bestimmen. Konvexe Kanten werden aufgehellt, konkave Fugen und Vertiefungen abgedunkelt.
  // Tiefensprünge (Silhouetten) werden ausgeblendet, damit am Umriss keine Ränder entstehen.
  const cavity = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tNormal: { value: ao.normalTexture }, tDepth: { value: ao.depthTexture },
      resolution: { value: new THREE.Vector2(800, 600) }, cameraNear: { value: camera.near }, cameraFar: { value: camera.far },
      tMask: { value: null }, ridge: { value: 1.1 }, valley: { value: 1.5 }, radius: { value: 1 }, enabled: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      #include <packing>
      uniform sampler2D tDiffuse, tNormal, tDepth, tMask; uniform vec2 resolution;
      uniform float cameraNear, cameraFar, ridge, valley, radius, enabled;
      varying vec2 vUv;
      vec3 N(vec2 uv) { return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
      float Z(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
      void main() {
        vec4 col = texture2D(tDiffuse, vUv);
        float d = texture2D(tDepth, vUv).x;
        if (enabled < .5 || d >= 1.0 || texture2D(tMask, vUv).r > .5) { gl_FragColor = col; return; }
        vec2 o = vec2(radius / resolution.x, 0.0), p = vec2(0.0, radius / resolution.y);
        float z = Z(vUv);
        float jump = max(max(abs(Z(vUv - o) - z), abs(Z(vUv + o) - z)), max(abs(Z(vUv - p) - z), abs(Z(vUv + p) - z)));
        float mask = 1.0 - smoothstep(.006, .02, jump / z);
        float curv = (N(vUv + o).x - N(vUv - o).x) + (N(vUv + p).y - N(vUv - p).y);
        float hi = smoothstep(.22, .7, curv) * ridge * mask, lo = smoothstep(.22, .7, -curv) * valley * mask;
        float lum = dot(col.rgb, vec3(.2126, .7152, .0722)), dark = 1.0 - smoothstep(.03, .25, lum);
        col.rgb = col.rgb * (1.0 - .75 * lo) + hi * mix(col.rgb * .55 + .1, vec3(.06), dark);
        gl_FragColor = col;
      }`,
  });
  // ShaderPass klont seine Uniforms; Render-Target-Texturen müssen danach direkt gesetzt werden
  cavity.uniforms.tNormal.value = ao.normalTexture; cavity.uniforms.tDepth.value = ao.depthTexture;
  // Maske: Teile mit userData.noFx (Fell, Umhang, Base-Deko) bekommen keine Kantenlinien.
  // Dazu wird die Szene einmal mit Schwarz/Weiß-Materialien in ein eigenes Ziel gerendert (mit Tiefe, damit Verdeckung stimmt).
  const maskTarget = new THREE.WebGLRenderTarget(800, 600);
  const maskOn = new THREE.MeshBasicMaterial({ color: 0xffffff }), maskOff = new THREE.MeshBasicMaterial({ color: 0x000000 });
  cavity.uniforms.tMask.value = maskTarget.texture;
  const noFx = o => { for (let p = o; p; p = p.parent) if (p.userData.noFx) return true; return false; };
  function renderMask() {
    const swapped = [], bg = scene.background;
    scene.traverse(o => { if (o.isMesh) { swapped.push([o, o.material]); o.material = (o.userData._nofx ??= noFx(o)) ? maskOn : maskOff; } });
    const su = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
    scene.background = null; renderer.setRenderTarget(maskTarget); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); scene.background = bg; renderer.shadowMap.autoUpdate = su;
    for (const [o, m] of swapped) o.material = m;
  }
  function renderFrame() { if (cavity.uniforms.enabled.value) renderMask(); composer.render(); }
  composer.addPass(cavity);
  composer.addPass(new OutputPass());
  function setSize(w, h, pr) {
    composer.setPixelRatio(pr); composer.setSize(w, h);
    cavity.uniforms.resolution.value.set(w * pr, h * pr); maskTarget.setSize(w * pr, h * pr);
  }
  return { composer, ao, cavity, maskTarget, render: renderFrame, setSize };
}
