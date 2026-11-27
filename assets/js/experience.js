/* =====================================================================
   Scroll-driven 3D experience — "La partie parfaite"
   Three.js (vendored, r169), fully procedural scene: no model to load.
   Scroll scrubs a timeline (never hijacked: native scroll + damping):
     0.00  wide shot over 8 neon lanes
     0.15  the ball leaves the approach, camera tracks it at lane level
     0.52  impact — deterministic pin simulation (scrubs backwards too)
     0.68  the hall switches to laser game: beams, haze, colour shift
     0.90  pull back, wide shot, hand over to the rest of the site
   Static mode (reduced motion / user switch / no WebGL): one still frame.
   ===================================================================== */
import * as THREE from '../vendor/three/three.module.min.js';

const docEl = document.documentElement;
const section = document.querySelector('.xp');
const canvas = document.getElementById('xp-canvas');


function toStatic() {
  docEl.classList.remove('xp-live');
  docEl.classList.add('xp-static');
}

/* ---------- helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ---------- world constants (metres) ---------- */
const LANE_W = 1.066, GUT = 0.235, CAP = 0.12, PITCH = LANE_W + 2 * GUT + CAP;
const N_LANES = 8, HERO = 4, LEN = 19.2, HEAD_Z = -18.29;
const R_BALL = 0.109, R_PIN = 0.06, PIN_H = 0.381;
const laneX = (i) => (i - HERO) * PITCH;
const RACK = []; // classic 10-pin triangle
for (let row = 0; row < 4; row++) for (let j = 0; j <= row; j++) RACK.push([(j - row / 2) * 0.3048, HEAD_Z - row * 0.264]);

async function init() {
  const small = matchMedia('(max-width: 700px)').matches || matchMedia('(pointer: coarse)').matches;
  const isStatic = docEl.classList.contains('xp-static');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance', alpha: false });
  } catch (e) { toStatic(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.3 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x040506, 1);

  const scene = new THREE.Scene();
  const FOG = new THREE.Color(0x050608);
  scene.fog = new THREE.FogExp2(FOG.clone(), 0.045);
  scene.background = FOG.clone();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.03, 80);

  /* ---------- environment map for glossy reflections ---------- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x07080a);
  const strip = (c, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
  strip(0xff5a46, -4, 1, -3, 6, 0.3); strip(0x3ff0ff, 4, 1, -3, 6, 0.3); strip(0xffd7a8, 0, 4, 0, 5, 1.2); strip(0xff5a46, 0, 0.5, 5, 8, 0.25);
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;

  /* ---------- textures ---------- */
  const glowTex = canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  const lineGlowTex = canvasTex(64, 4, (g, w, h) => {
    const r = g.createLinearGradient(0, 0, w, 0);
    r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });

  const R = rng(42);
  const laneTex = canvasTex(256, 2048, (g, w, h) => {
    const px = h / LEN, board = w / 39;
    for (let b = 0; b < 39; b++) {
      const zones = [[0, 4.9, '#d6a66a'], [4.9, 16.5, '#c08850'], [16.5, LEN, '#d9ab70']]; // maple / pine / maple
      for (const [a, z2, col] of zones) {
        g.fillStyle = col; g.globalAlpha = 1; g.fillRect(b * board, h - z2 * px, board + 0.5, (z2 - a) * px);
        g.fillStyle = R() > 0.5 ? '#000' : '#fff'; g.globalAlpha = 0.04 + R() * 0.05; g.fillRect(b * board, h - z2 * px, board, (z2 - a) * px);
      }
    }
    g.globalAlpha = 0.07; g.strokeStyle = '#3a2410';
    for (let i = 0; i < 900; i++) { const x = R() * w; g.lineWidth = 0.5 + R(); g.beginPath(); g.moveTo(x, R() * h); g.lineTo(x + (R() - 0.5) * 2, R() * h); g.stroke(); }
    g.globalAlpha = 0.5; g.fillStyle = '#2a1408';
    for (let b = 0; b <= 39; b++) g.fillRect(b * board - 0.3, 0, 0.6, h);
    // range finders: dots at 2.1 m, arrows at 4.6 m (boards 5..35)
    g.globalAlpha = 1; g.fillStyle = '#7a1d14';
    for (const bd of [3, 5, 8, 11, 14]) for (const s of [-1, 1]) { const x = w / 2 + s * (19.5 - bd) * board; g.beginPath(); g.arc(x, h - 2.1 * px, board * 0.32, 0, 7); g.fill(); }
    for (let k = 0; k < 7; k++) {
      const bd = 5 + k * 5, x = (39 - bd) * board + board / 2, y = h - (4.6 + Math.abs(k - 3) * 0.3) * px;
      g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x - board * 0.6, y + 10); g.lineTo(x + board * 0.6, y + 10); g.closePath(); g.fill();
    }
    g.fillStyle = '#0d0d10'; g.fillRect(0, h - 4, w, 4); // foul line
  });
  laneTex.anisotropy = 8;

  const pinTex = canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#f5f2ec'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d7241f';
    for (const [a, b] of [[0.615, 0.645], [0.665, 0.695]]) g.fillRect(0, (1 - b) * h, w, (b - a) * h);
  });

  const ballTex = canvasTex(512, 256, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2a0712'); bg.addColorStop(0.5, '#4a0d22'); bg.addColorStop(1, '#14061e');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cols = ['#ff4b3e', '#ff7a3a', '#8a1fd0', '#2ad8ff', '#ff2e5e'];
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = cols[i % cols.length]; g.globalAlpha = 0.12 + R() * 0.35; g.lineWidth = 2 + R() * 9;
      g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y);
      for (let s = 0; s < 4; s++) { g.bezierCurveTo(x + (R() - 0.5) * 160, y + (R() - 0.5) * 90, x + (R() - 0.5) * 160, y + (R() - 0.5) * 90, x += (R() - 0.5) * 140, y += (R() - 0.5) * 70); }
      g.stroke();
    }
    g.globalAlpha = 1;
    for (const [x, y, r] of [[0.25, 0.36, 9], [0.22, 0.47, 8], [0.29, 0.47, 8]]) {
      const hg = g.createRadialGradient(x * w + 2, y * h + 2, 0, x * w, y * h, r);
      hg.addColorStop(0, '#000'); hg.addColorStop(0.8, '#050205'); hg.addColorStop(1, '#ff7a6a');
      g.fillStyle = hg; g.beginPath(); g.ellipse(x * w, y * h, r * 1.1, r, 0, 0, 7); g.fill();
    }
  });

  /* ---------- materials ---------- */
  const M = {
    lane: new THREE.MeshStandardMaterial({ map: laneTex, roughness: 0.22, metalness: 0, envMapIntensity: 0.9, transparent: true, opacity: 0.8 }),
    approach: new THREE.MeshStandardMaterial({ color: 0xc9975c, map: laneTex, roughness: 0.35, envMapIntensity: 0.5 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.6, metalness: 0.2 }),
    gutter: new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 0.25, metalness: 0.9 }),
    pin: new THREE.MeshStandardMaterial({ map: pinTex, roughness: 0.25, metalness: 0, envMapIntensity: 0.8 }),
    ball: new THREE.MeshPhysicalMaterial({ map: ballTex, roughness: 0.12, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 }),
  };
  const mirrorOf = (m) => { const c = m.clone(); c.transparent = false; c.opacity = 1; return c; }; // winding flip handled by three.js (negative determinant)
  const neon = (hex, op = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
  const CORAL = 0xff4a3a, CYAN = 0x2ff0ff;

  const world = new THREE.Group(); scene.add(world);
  const mirror = new THREE.Group(); mirror.scale.y = -1; scene.add(mirror); // cheap planar reflection under the glossy lanes

  /* ---------- hall ---------- */
  const laneGeo = new THREE.PlaneGeometry(LANE_W, LEN); laneGeo.rotateX(-Math.PI / 2); laneGeo.translate(0, 0, -LEN / 2);
  const apprGeo = new THREE.PlaneGeometry(PITCH * N_LANES, 4.8); apprGeo.rotateX(-Math.PI / 2); apprGeo.translate(0, -0.002, 2.4);
  for (let i = 0; i < N_LANES; i++) { const l = new THREE.Mesh(laneGeo, M.lane); l.position.x = laneX(i); l.renderOrder = 2; world.add(l); }
  const appr = new THREE.Mesh(apprGeo, new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.4, envMapIntensity: 0.4 }));
  appr.position.x = (laneX(0) + laneX(N_LANES - 1)) / 2; world.add(appr);

  const gutGeo = new THREE.BoxGeometry(GUT, 0.02, LEN); gutGeo.translate(0, -0.06, -LEN / 2);
  const gut = new THREE.InstancedMesh(gutGeo, M.gutter, N_LANES * 2);
  const capGeo = new THREE.BoxGeometry(CAP, 0.05, LEN); capGeo.translate(0, 0.01, -LEN / 2);
  const caps = new THREE.InstancedMesh(capGeo, M.dark, N_LANES + 1);
  const stripGeo = new THREE.BoxGeometry(0.018, 0.012, LEN); stripGeo.translate(0, 0.04, -LEN / 2);
  const glowGeo = new THREE.PlaneGeometry(0.5, LEN); glowGeo.rotateX(-Math.PI / 2); glowGeo.translate(0, 0.045, -LEN / 2);
  const strips = [], m4 = new THREE.Matrix4();
  for (let i = 0; i < N_LANES; i++) {
    m4.makeTranslation(laneX(i) - LANE_W / 2 - GUT / 2, 0, 0); gut.setMatrixAt(i * 2, m4);
    m4.makeTranslation(laneX(i) + LANE_W / 2 + GUT / 2, 0, 0); gut.setMatrixAt(i * 2 + 1, m4);
  }
  for (let b = 0; b <= N_LANES; b++) {
    const x = laneX(b) - PITCH / 2;
    m4.makeTranslation(x, 0, 0); caps.setMatrixAt(b, m4);
    const col = b % 2 ? CYAN : CORAL;
    const s = new THREE.Mesh(stripGeo, neon(col)); s.position.x = x; world.add(s);
    const gl = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ map: lineGlowTex, color: col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    gl.position.x = x; world.add(gl);
    strips.push({ s, gl, base: new THREE.Color(col) });
  }
  world.add(gut, caps);

  // pin deck, pit, masking unit, back wall
  const pit = new THREE.Mesh(new THREE.PlaneGeometry(PITCH * N_LANES, 1.2), M.dark);
  pit.rotation.x = -Math.PI / 2; pit.position.set(appr.position.x, -0.5, -LEN - 0.6); world.add(pit);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(PITCH * N_LANES + 0.4, 0.95, 0.35), M.dark);
  mask.position.set(appr.position.x, 1.5, -18.95); world.add(mask);
  const maskStrip = new THREE.Mesh(new THREE.BoxGeometry(PITCH * N_LANES + 0.4, 0.02, 0.02), neon(CORAL));
  maskStrip.position.set(appr.position.x, 1.02, -18.77); world.add(maskStrip);
  const maskGlow = new THREE.Mesh(new THREE.PlaneGeometry(PITCH * N_LANES + 0.4, 0.5), new THREE.MeshBasicMaterial({ map: lineGlowTex, color: CORAL, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  maskGlow.material.map = lineGlowTex.clone(); maskGlow.material.map.rotation = Math.PI / 2; maskGlow.material.map.center.set(0.5, 0.5);
  maskGlow.position.set(appr.position.x, 1.02, -18.76); world.add(maskGlow);
  const kickbacks = new THREE.InstancedMesh(new THREE.BoxGeometry(CAP, 0.42, 2.6), M.dark, N_LANES + 1);
  for (let b = 0; b <= N_LANES; b++) { m4.makeTranslation(laneX(b) - PITCH / 2, 0.21, -17.9); kickbacks.setMatrixAt(b, m4); }
  world.add(kickbacks);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.9 }));
  wall.position.set(0, 4, -20.5); world.add(wall);

  // neon sign
  try { await Promise.race([document.fonts.load('800 120px Syne'), new Promise((r) => setTimeout(r, 1200))]); } catch (e) {}
  const signTex = canvasTex(1024, 220, (g, w, h) => {
    // measure first so the whole sign always fits, whatever the font metrics
    const SANS = '800 100px Syne, "Arial Black", sans-serif', SERIF = 'italic 400 112px "Instrument Serif", Georgia, serif';
    const parts = [['BOULES', SANS, '#ff4a3a'], ['et', SERIF, '#ffb36b'], ['BILLES', SANS, '#2ff0ff']];
    const gap = 34;
    const widths = parts.map(([s, f]) => { g.font = f; return g.measureText(s).width; });
    const total = widths.reduce((a, b) => a + b, 0) + gap * 2, sc = Math.min(1, (w - 80) / total);
    g.setTransform(sc, 0, 0, sc, (w - total * sc) / 2, h / 2 * (1 - sc));
    g.textAlign = 'left'; g.textBaseline = 'middle';
    let x = 0;
    parts.forEach(([s, f, col], i) => {
      g.font = f; g.shadowColor = col;
      for (const b of [36, 14, 4]) { g.shadowBlur = b * sc; g.fillStyle = col; g.fillText(s, x, h / 2); }
      g.shadowBlur = 0; g.fillStyle = '#fff6f0'; g.globalAlpha = 0.85; g.fillText(s, x, h / 2); g.globalAlpha = 1;
      x += widths[i] + gap;
    });
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.375), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  sign.position.set(0, 2.6, -18.75); world.add(sign);

  // ceiling lamps (instanced, additive)
  const lampGeo = new THREE.PlaneGeometry(0.9, 0.12); lampGeo.rotateX(Math.PI / 2);
  const lampMat = neon(0xffd9a8, 0.9);
  const lamps = new THREE.InstancedMesh(lampGeo, lampMat, N_LANES * 6);
  let li = 0;
  for (let i = 0; i < N_LANES; i++) for (let k = 0; k < 6; k++) { m4.makeTranslation(laneX(i), 3.3, 1 - k * 3.4); lamps.setMatrixAt(li++, m4); }
  world.add(lamps);

  /* ---------- pins & ball ---------- */
  const prof = [[0, 0], [0.026, 0], [0.04, 0.03], [0.055, 0.075], [0.0605, 0.115], [0.056, 0.16], [0.043, 0.205], [0.026, 0.25], [0.021, 0.27], [0.025, 0.3], [0.031, 0.33], [0.029, 0.358], [0.018, 0.376], [0, PIN_H]].map(([r, y]) => new THREE.Vector2(r, y));
  const pinGeo = new THREE.LatheGeometry(prof, small ? 14 : 24);
  { const pos = pinGeo.attributes.position, uv = pinGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, pos.getY(i) / PIN_H); }
  const pinMirrorMat = mirrorOf(M.pin);
  const others = N_LANES - 1;
  const oPins = new THREE.InstancedMesh(pinGeo, M.pin, others * 10);
  const oPinsM = new THREE.InstancedMesh(pinGeo, pinMirrorMat, others * 10);
  let oi = 0;
  for (let i = 0; i < N_LANES; i++) { if (i === HERO) continue; for (const [x, z] of RACK) { m4.makeTranslation(laneX(i) + x, 0, z); oPins.setMatrixAt(oi, m4); oPinsM.setMatrixAt(oi++, m4); } }
  world.add(oPins); mirror.add(oPinsM);

  const pins = RACK.map(() => { const m = new THREE.Mesh(pinGeo, M.pin); world.add(m); const mm = new THREE.Mesh(pinGeo, pinMirrorMat); mirror.add(mm); return { m, mm }; });
  const ballGeo = new THREE.SphereGeometry(R_BALL, small ? 32 : 48, small ? 20 : 32);
  const ball = new THREE.Mesh(ballGeo, M.ball); world.add(ball);
  const ballM = new THREE.Mesh(ballGeo, mirrorOf(M.ball)); mirror.add(ballM);
  const ballLight = new THREE.PointLight(0xff5a46, 0.9, 1.4, 2); scene.add(ballLight);

  // contact shadows (soft blobs)
  const blobMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.NormalBlending });
  blobMat.onBeforeCompile = (s) => { s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', 'vec4 texelColor = texture2D( map, vMapUv ); diffuseColor = vec4(0.,0.,0., texelColor.r * opacity);'); };
  const blobGeo = new THREE.PlaneGeometry(1, 1); blobGeo.rotateX(-Math.PI / 2);
  const ballBlob = new THREE.Mesh(blobGeo, blobMat); ballBlob.scale.set(0.34, 1, 0.34); ballBlob.renderOrder = 3; world.add(ballBlob);

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0x9fb0c8, 0x1a0c08, 0.55); scene.add(hemi);
  const deck = new THREE.SpotLight(0xffe6c8, 26, 9, 0.75, 0.6, 1.4); deck.position.set(0, 1.0, -17.2); deck.target.position.set(0, 0, -18.7); scene.add(deck, deck.target);
  const laneLights = [-3, -9, -14].map((z) => { const l = new THREE.PointLight(0xffd2a0, 6, 10, 1.6); l.position.set(0, 2.9, z); scene.add(l); return l; });
  const lzRed = new THREE.PointLight(0xff2e3e, 0, 14, 1.4); lzRed.position.set(-3, 2.2, -14);
  const lzCyan = new THREE.PointLight(0x2ff0ff, 0, 14, 1.4); lzCyan.position.set(3, 2.2, -11);
  scene.add(lzRed, lzCyan);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe0c0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false, fog: false }));
  flash.position.set(0.05, 0.2, -18.45); flash.scale.set(2.4, 2.4, 1); world.add(flash);

  /* ---------- laser game layer ---------- */
  const lasers = new THREE.Group(); world.add(lasers);
  const beamGeo = new THREE.CylinderGeometry(0.006, 0.006, 1, 6, 1, true); beamGeo.translate(0, 0.5, 0);
  const beamGlowGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 8, 1, true); beamGlowGeo.translate(0, 0.5, 0);
  const LCOL = [0xff2e3e, 0x2ff0ff, 0x4dff9a, 0xff3fd2];
  const beams = [];
  const nBeams = small ? 10 : 16;
  for (let i = 0; i < nBeams; i++) {
    const col = LCOL[i % LCOL.length];
    const core = new THREE.Mesh(beamGeo, neon(col, 0)), glow = new THREE.Mesh(beamGlowGeo, neon(col, 0));
    const g = new THREE.Group(); g.add(core, glow);
    const side = i % 2 ? 1 : -1;
    g.position.set(side * (2 + R() * 5), 0.3 + R() * 2.8, -19.6 + R() * 12);
    lasers.add(g);
    beams.push({ g, core, glow, ph: R() * 6.28, sp: 0.25 + R() * 0.5, aim: V(-side * (0.6 + R()), (R() - 0.5) * 0.6, -0.4 + R() * 0.8).normalize() });
  }
  const NH = small ? 220 : 600;
  const hazePos = new Float32Array(NH * 3);
  for (let i = 0; i < NH; i++) { hazePos[i * 3] = (R() - 0.5) * 14; hazePos[i * 3 + 1] = R() * 3.2; hazePos[i * 3 + 2] = -19 + R() * 22; }
  const hazeGeo = new THREE.BufferGeometry(); hazeGeo.setAttribute('position', new THREE.BufferAttribute(hazePos, 3));
  const haze = new THREE.Points(hazeGeo, new THREE.PointsMaterial({ map: glowTex, size: 0.09, color: 0x9fdfff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  world.add(haze);

  /* ---------- ball path & deterministic pin simulation ---------- */
  const START_Z = 1.6, END_Z = -18.05;
  const pathX = (t) => 0.32 + 0.08 * Math.sin(Math.PI * 0.8 * t) - 0.262 * t * t * t;
  const pathZ = (t) => START_Z + (END_Z - START_Z) * t;
  const SPEED = 8.2;
  const dxdz = (pathX(1) - pathX(0.999)) / (pathZ(1) - pathZ(0.999));
  const vz0 = -SPEED / Math.hypot(1, dxdz), vx0 = vz0 * dxdz;
  const pathLen = (() => { let s = 0, px = pathX(0), pz = pathZ(0); for (let i = 1; i <= 200; i++) { const t = i / 200, x = pathX(t), z = pathZ(t); s += Math.hypot(x - px, z - pz); px = x; pz = z; } return s; })();

  const SIM = (() => {
    const r = rng(7), MB = 7, MP = 1.6, dt = 1 / 240, T = 1.6, FR = 60;
    const P = RACK.map(([x, z]) => ({ x, z, y: 0, vx: 0, vz: 0, vy: 0, tilt: 0, tv: 0, dir: 0, yaw: r() * 6.28, yv: 0, hit: false }));
    const B = { x: pathX(1), z: END_Z, vx: vx0, vz: vz0, y: R_BALL };
    const knock = (p, rel, dx, dz) => {
      const n = Math.hypot(dx, dz) || 1;
      p.hit = true; p.dir = Math.atan2(dz / n, dx / n);
      p.tv = Math.max(p.tv, 3 + rel * 2.4);
      p.vy = Math.max(p.vy, (0.3 + r() * 1.1) * Math.min(rel, 7) / 7 * 2.6);
      p.yv = (r() - 0.5) * 16;
    };
    const head = (p) => { const s = Math.sin(Math.min(p.tilt, Math.PI / 2)) * 0.2; return [p.x + Math.cos(p.dir) * s, p.z + Math.sin(p.dir) * s]; };
    const frames = []; let rec = 0; const q = new THREE.Quaternion(), qy = new THREE.Quaternion(), ax = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    for (let step = 0, t = 0; t <= T + 1e-6; step++, t = step * dt) {
      B.x += B.vx * dt; B.z += B.vz * dt;
      if (B.z < -LEN - 0.1) { B.vy = (B.vy || 0) - 9.81 * dt; B.y += B.vy * dt; if (B.y < -0.4) { B.y = -0.4; B.vx = B.vz = 0; } }
      for (const p of P) {
        if (p.y > 0.25) continue;
        const dx = p.x - B.x, dz = p.z - B.z, d = Math.hypot(dx, dz);
        if (d < R_BALL + R_PIN && d > 0) {
          const nx = dx / d, nz = dz / d, rel = (B.vx - p.vx) * nx + (B.vz - p.vz) * nz;
          if (rel > 0) { const j = (1 + 0.55) * rel / (1 / MB + 1 / MP); B.vx -= j * nx / MB; B.vz -= j * nz / MB; p.vx += j * nx / MP; p.vz += j * nz / MP; knock(p, rel, p.vx, p.vz); }
          const o = R_BALL + R_PIN - d; p.x += nx * o; p.z += nz * o;
        }
      }
      for (let i = 0; i < P.length; i++) for (let k = i + 1; k < P.length; k++) {
        const a = P[i], b = P[k];
        if (Math.abs(a.y - b.y) > 0.3) continue;
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
        if (d < 0.12 && d > 0) {
          const nx = dx / d, nz = dz / d, rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
          if (rel > 0) { const j = (1 + 0.5) * rel / 2; a.vx -= j * nx; a.vz -= j * nz; b.vx += j * nx; b.vz += j * nz; if (rel > 0.3) { knock(b, rel, b.vx, b.vz); if (!a.hit) knock(a, rel * 0.6, a.vx, a.vz); } }
          const o = (0.12 - d) / 2; a.x -= nx * o; a.z -= nz * o; b.x += nx * o; b.z += nz * o;
        }
        // a toppling pin's head sweeps its neighbours
        for (const [s, o] of [[a, b], [b, a]]) {
          if (s.hit && s.tilt > 0.5 && o.tilt < 0.3) { const [hx, hz] = head(s); if (Math.hypot(hx - o.x, hz - o.z) < 0.09) { o.vx += (o.x - s.x) * 4; o.vz += (o.z - s.z) * 4; knock(o, 1.8, o.x - s.x, o.z - s.z); } }
        }
      }
      for (const p of P) {
        if (!p.hit) continue;
        const inPit = p.z < -LEN - 0.05;
        const floor = inPit ? -0.5 : 0;
        p.vy -= 9.81 * dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt;
        if (p.y < floor) { p.y = floor; p.vy *= -0.25; p.vx *= 0.985; p.vz *= 0.985; }
        const lim = LANE_W / 2 + GUT + 0.02;
        if (Math.abs(p.x) > lim) { p.x = Math.sign(p.x) * lim; p.vx *= -0.45; }
        if (p.z < -LEN - 0.6) { p.z = -LEN - 0.6; p.vz *= -0.2; }
        p.tilt += p.tv * dt;
        if (p.tilt > Math.PI / 2) { if (p.y <= floor + 0.01) { p.tilt = Math.PI / 2; p.tv *= -0.15; } else if (p.tilt > Math.PI / 2 + 0.5) { p.tilt = Math.PI / 2 + 0.5; p.tv = 0; } }
        p.tv *= 0.996; p.yaw += p.yv * dt; p.yv *= 0.99;
      }
      if (t > 0.55) for (const p of P) if (!p.hit) { // the mix in the pit always clears the deck: STRIKE
        let best = null, bd = 9; for (const o of P) if (o.hit) { const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; best = o; } }
        if (best) knock(p, 2.2, p.x - best.x, p.z - best.z);
      }
      if (t + 1e-9 >= rec / FR) {
        const f = new Float32Array(P.length * 7 + 3);
        P.forEach((p, i) => {
          const tl = Math.min(p.tilt, Math.PI / 2 + 0.5);
          ax.set(Math.sin(p.dir), 0, -Math.cos(p.dir));
          q.setFromAxisAngle(ax, tl); qy.setFromAxisAngle(UP, p.yaw); q.multiply(qy);
          f.set([p.x, p.y + Math.sin(Math.min(tl, Math.PI / 2)) * 0.055, p.z, q.x, q.y, q.z, q.w], i * 7);
        });
        f.set([B.x, B.y, B.z], P.length * 7);
        frames.push(f); rec++;
      }
    }
    return { frames, fr: FR };
  })();

  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  function applySim(time) {
    const fi = clamp(time * SIM.fr, 0, SIM.frames.length - 1.001);
    const i0 = Math.floor(fi), k = fi - i0, A = SIM.frames[i0], Bf = SIM.frames[i0 + 1];
    pins.forEach((p, i) => {
      const o = i * 7;
      p.m.position.set(A[o] + (Bf[o] - A[o]) * k, A[o + 1] + (Bf[o + 1] - A[o + 1]) * k, A[o + 2] + (Bf[o + 2] - A[o + 2]) * k);
      qa.set(A[o + 3], A[o + 4], A[o + 5], A[o + 6]); qb.set(Bf[o + 3], Bf[o + 4], Bf[o + 5], Bf[o + 6]);
      p.m.quaternion.slerpQuaternions(qa, qb, k);
    });
    const o = pins.length * 7;
    return V(A[o] + (Bf[o] - A[o]) * k, A[o + 1] + (Bf[o + 1] - A[o + 1]) * k, A[o + 2] + (Bf[o + 2] - A[o + 2]) * k);
  }

  /* ---------- camera choreography ---------- */
  const B = V(0, R_BALL, START_Z);
  const K = [
    { p: 0.0, pos: () => V(0, 3.4, 9.5), look: () => V(0, 0.3, -14), fov: 40 },
    { p: 0.11, pos: () => V(0.7, 0.6, 3.1), look: () => B.clone().add(V(-0.1, 0, -3)), fov: 38 },
    { p: 0.17, pos: () => B.clone().add(V(0.22, 0.26, 1.05)), look: () => B.clone().add(V(0, 0.04, -4)), fov: 44 },
    { p: 0.31, pos: () => B.clone().add(V(1.0, 0.3, 0.25)), look: () => B.clone().add(V(0, 0.05, -1.2)), fov: 46 },
    { p: 0.44, pos: () => B.clone().add(V(-0.3, 0.16, 0.95)), look: () => V(0.05, 0.2, -18.6), fov: 40 },
    { p: 0.52, pos: () => V(0.62, 0.34, -16.35), look: () => V(0, 0.16, -18.65), fov: 38 },
    { p: 0.65, pos: () => V(0.42, 0.5, -16.85), look: () => V(0, 0.1, -18.9), fov: 40 },
    { p: 0.73, pos: () => V(0, 2.1, -13.2), look: () => V(0, 1.7, -19.5), fov: 52 },
    { p: 0.87, pos: () => V(-2.4, 1.5, -9.2), look: () => V(1.4, 1.3, -19), fov: 56 },
    { p: 1.0, pos: () => V(0, 6.4, 7.8), look: () => V(0, -0.2, -11), fov: 42 },
  ];
  const look = new THREE.Vector3();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!small) window.addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  /* ---------- per-frame scene state ---------- */
  const IMPACT_P = 0.52, SIM_END_P = 0.66;
  const tmpC = new THREE.Color();
  function update(p, time) {
    // ball before impact
    const bt = clamp((p - 0.15) / (IMPACT_P - 0.15));
    let travelled;
    if (p < IMPACT_P) {
      B.set(pathX(bt), R_BALL, pathZ(bt));
      travelled = bt * pathLen;
      applySim(0);
    } else {
      const st = clamp((p - IMPACT_P) / (SIM_END_P - IMPACT_P)) * 1.6;
      const sb = applySim(st);
      B.copy(sb);
      travelled = pathLen + st * SPEED * 0.8;
    }
    ball.position.copy(B);
    ball.rotation.set(-travelled / R_BALL, 0.3, 0.35 * bt);
    ballLight.position.copy(B).add(V(0, 0.25, 0.1));
    ballBlob.position.set(B.x, 0.003, B.z); ballBlob.visible = B.y > -0.05;
    ballM.position.copy(ball.position); ballM.quaternion.copy(ball.quaternion); ballM.visible = B.z > -LEN;
    pins.forEach((pn) => { pn.mm.position.copy(pn.m.position); pn.mm.quaternion.copy(pn.m.quaternion); pn.mm.visible = pn.m.position.z > -LEN && pn.m.position.y > -0.05; });

    // laser mode
    const L = sstep(0.66, 0.75, p) * (1 - 0.45 * sstep(0.93, 1, p));
    hemi.intensity = 0.55 * (1 - 0.75 * L);
    laneLights.forEach((l) => (l.intensity = 6 * (1 - 0.85 * L)));
    lampMat.opacity = 0.9 * (1 - 0.85 * L);
    lzRed.intensity = 9 * L; lzCyan.intensity = 9 * L;
    scene.fog.density = 0.045 + 0.02 * L;
    tmpC.setRGB(0.02 + 0.03 * L, 0.02, 0.03 + 0.05 * L); scene.fog.color.copy(tmpC); scene.background.copy(tmpC);
    strips.forEach((s, i) => { const c = s.base.clone().lerp(new THREE.Color(i % 2 ? 0x4dff9a : 0xff3fd2), L); s.s.material.color.copy(c); s.gl.material.color.copy(c); });
    beams.forEach((b) => {
      const sw = Math.sin(time * b.sp + b.ph), sw2 = Math.cos(time * b.sp * 0.7 + b.ph);
      const d = b.aim.clone().add(V(sw * 0.35, sw2 * 0.25, sw2 * 0.3)).normalize();
      b.g.quaternion.setFromUnitVectors(V(0, 1, 0), d);
      b.g.scale.set(1, 24, 1);
      b.core.material.opacity = L * 0.95; b.glow.material.opacity = L * 0.16;
      b.g.visible = L > 0.01;
    });
    haze.material.opacity = 0.08 + 0.4 * L;
    haze.rotation.y = Math.sin(time * 0.05) * 0.04;

    // strike flash
    const fl = Math.exp(-Math.pow((p - (IMPACT_P + 0.012)) / 0.012, 2));
    flash.material.opacity = fl * 0.9; deck.intensity = 26 + 60 * fl;
    sign.material.opacity = 0.85 + 0.15 * Math.sin(time * 3.1) * Math.sin(time * 1.7);

    // camera
    let i = 0; while (i < K.length - 2 && p > K[i + 1].p) i++;
    const a = K[i], b = K[i + 1], t = easeIO(clamp((p - a.p) / (b.p - a.p)));
    camera.position.copy(a.pos()).lerp(b.pos(), t);
    look.copy(a.look()).lerp(b.look(), t);
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    camera.position.x += pointer.x * 0.12; camera.position.y -= pointer.y * 0.06;
    camera.position.y += Math.sin(time * 0.6) * 0.008;
    camera.lookAt(look);
    const aspect = camera.aspect;
    camera.fov = (a.fov + (b.fov - a.fov) * t) * (aspect < 1 ? 1.5 : 1);
    camera.updateProjectionMatrix();
  }

  /* ---------- HTML chapters & HUD ---------- */
  const chapters = [...section.querySelectorAll('.xp-ch')].map((el) => ({ el, from: +el.dataset.from, to: +el.dataset.to, inert: null }));
  const hudTrack = section.querySelector('.xp-track');
  const hudCount = section.querySelector('.xp-count');
  function updateDOM(p) {
    let idx = 0;
    chapters.forEach((c, i) => {
      const fin = c.from <= 0 ? 1 : sstep(c.from, c.from + 0.035, p);
      const fout = c.to > 1 ? 1 : 1 - sstep(c.to - 0.035, c.to, p);
      const o = fin * fout;
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = `translate3d(0,${((1 - fin) * 30 - (1 - fout) * 30).toFixed(1)}px,0)`;
      c.el.classList.toggle('is-on', o > 0.02);
      const inert = o < 0.5;
      if (inert !== c.inert) { c.inert = inert; c.el.inert = inert; }
      if (p >= c.from - 0.01) idx = i;
    });
    if (hudTrack) hudTrack.style.setProperty('--xp', p.toFixed(4));
    if (hudCount) hudCount.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
  }
  const pill = section.querySelector('.xp-pill'), pillTxt = document.getElementById('xp-status');
  function paintStatus() {
    const s = window.App && window.App.status ? window.App.status() : null;
    if (!s || !pill) return;
    pill.classList.remove('is-open', 'is-closed', 'is-maybe');
    pill.classList.add(s.state === 'open' ? 'is-open' : s.state === 'closed' ? 'is-closed' : 'is-maybe');
    pillTxt.textContent = s.state === 'open' ? 'Ouvert · ' + s.sub.split(' · ')[0] : s.state === 'closed' ? 'Fermé · ' + s.sub.split(' · ')[0].split(' (')[0] : 'Lundi : vacances scolaires';
  }
  paintStatus(); setInterval(paintStatus, 60000);

  /* ---------- sizing ---------- */
  const sticky = section.querySelector('.xp-sticky');
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (isStatic) renderStill(); }, 100); }, { passive: true });

  function renderStill() { update(0.985, 3); renderer.render(scene, camera); }

  if (isStatic) {
    renderStill();
    section.classList.add('is-ready');
    return;
  }

  /* ---------- loop: native scroll + critically damped progress ---------- */
  const target = () => { const r = section.getBoundingClientRect(); const total = r.height - innerHeight; return total > 0 ? clamp(-r.top / total) : 0; };
  let prog = target(), last = performance.now(), visible = true, raf = 0, clock = 0;
  updateDOM(prog);
  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt;
    prog += (target() - prog) * (1 - Math.exp(-dt * 6));
    update(prog, clock);
    renderer.render(scene, camera);
    updateDOM(prog);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px' }).observe(section);
  document.addEventListener('visibilitychange', kick);
  // compile shaders before the first visible frame to avoid a hitch
  update(prog, 0); renderer.compile(scene, camera); renderer.render(scene, camera);
  section.classList.add('is-ready');
  kick();
}

if (section && canvas) init().catch((e) => { console.warn('[xp] disabled:', e); toStatic(); });
