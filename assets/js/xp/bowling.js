/* =====================================================================
   Scene 1 — Bowling. 8 neon lanes, the ball tracked at lane level,
   a deterministic strike (scrubs backwards), then the camera turns to the
   glowing LASER GAME door that opens scene 2.
   ===================================================================== */
import { THREE, clamp, sstep, V, rng, canvasTex, glowTextures, neon, rigCamera } from './util.js';
import { makeLaserDoor } from './door.js';

/* ---------- world constants (metres) ---------- */
const LANE_W = 1.066, GUT = 0.235, CAP = 0.12, PITCH = LANE_W + 2 * GUT + CAP;
const N_LANES = 8, HERO = 4, LEN = 19.2, HEAD_Z = -18.29;
const R_BALL = 0.109, R_PIN = 0.06, PIN_H = 0.381;
const laneX = (i) => (i - HERO) * PITCH;
const RACK = []; // classic 10-pin triangle
for (let row = 0; row < 4; row++) for (let j = 0; j <= row; j++) RACK.push([(j - row / 2) * 0.3048, HEAD_Z - row * 0.264]);
const DOOR_X = 7.2, DOOR_Z = -6.1;

export async function buildBowling({ renderer, small }) {
  const scene = new THREE.Scene();
  const FOG = new THREE.Color(0x02041a);
  scene.fog = new THREE.FogExp2(FOG.clone(), 0.045);
  scene.background = FOG.clone();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.03, 80);

  /* ---------- environment map for glossy reflections ---------- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x07080a);
  const strip = (c, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
  strip(0x6a4dff, -4, 3, -3, 6, 0.2); strip(0x6a4dff, 4, 3, -3, 6, 0.2); strip(0x9aa8ff, 0, 4, 0, 5, 1.2); strip(0x3a55ff, 0, 0.5, 5, 8, 0.25);
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envMap;

  /* ---------- textures ---------- */
  const { glow: glowTex, line: lineGlowTex } = glowTextures();
  const R = rng(42);
  const laneTex = canvasTex(256, 2048, (g, w, h) => {
    const px = h / LEN, board = w / 39;
    for (let b = 0; b < 39; b++) {
      const zones = [[0, 4.9, '#eef1fa'], [4.9, 16.5, '#e2e7f5'], [16.5, LEN, '#eef1fa']]; // synthetic lane, glows under UV
      for (const [a, z2, col] of zones) {
        g.fillStyle = col; g.globalAlpha = 1; g.fillRect(b * board, h - z2 * px, board + 0.5, (z2 - a) * px);
        g.fillStyle = R() > 0.5 ? '#000' : '#fff'; g.globalAlpha = 0.04 + R() * 0.05; g.fillRect(b * board, h - z2 * px, board, (z2 - a) * px);
      }
    }
    g.globalAlpha = 0.05; g.strokeStyle = '#8a96c0';
    for (let i = 0; i < 900; i++) { const x = R() * w; g.lineWidth = 0.5 + R(); g.beginPath(); g.moveTo(x, R() * h); g.lineTo(x + (R() - 0.5) * 2, R() * h); g.stroke(); }
    g.globalAlpha = 0.35; g.fillStyle = '#b4bfe2';
    for (let b = 0; b <= 39; b++) g.fillRect(b * board - 0.3, 0, 0.6, h);
    // range finders: dots at 2.1 m, arrows at 4.6 m (boards 5..35)
    g.globalAlpha = 1; g.fillStyle = '#2b3aa8';
    for (const bd of [3, 5, 8, 11, 14]) for (const s of [-1, 1]) { const x = w / 2 + s * (19.5 - bd) * board; g.beginPath(); g.arc(x, h - 2.1 * px, board * 0.32, 0, 7); g.fill(); }
    for (let k = 0; k < 7; k++) {
      const bd = 5 + k * 5, x = (39 - bd) * board + board / 2, y = h - (4.6 + Math.abs(k - 3) * 0.3) * px;
      g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x - board * 0.6, y + 10); g.lineTo(x + board * 0.6, y + 10); g.closePath(); g.fill();
    }
    g.fillStyle = '#1a2a80'; g.fillRect(0, h - 4, w, 4); // foul line
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
    lane: new THREE.MeshStandardMaterial({ color: 0x0b1440, emissive: 0x2f55ff, emissiveMap: laneTex, emissiveIntensity: 1.0, roughness: 0.14, metalness: 0, envMapIntensity: 1.0, transparent: true, opacity: 0.84 }),
    approach: new THREE.MeshStandardMaterial({ color: 0xc9975c, map: laneTex, roughness: 0.35, envMapIntensity: 0.5 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x060a20, roughness: 0.5, metalness: 0.3 }),
    gutter: new THREE.MeshStandardMaterial({ color: 0x0c1440, roughness: 0.2, metalness: 0.8, emissive: 0x0a1650, emissiveIntensity: 0.5 }),
    pin: new THREE.MeshStandardMaterial({ map: pinTex, roughness: 0.25, metalness: 0, envMapIntensity: 0.8, emissive: 0x6fa8ff, emissiveMap: pinTex, emissiveIntensity: 0.55 }),
    ball: new THREE.MeshPhysicalMaterial({ map: ballTex, roughness: 0.12, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 }),
  };
  const mirrorOf = (m) => { const c = m.clone(); c.transparent = false; c.opacity = 1; return c; }; // winding flip handled by three.js (negative determinant)
  const UVB = 0x4a68ff;

  const world = new THREE.Group(); scene.add(world);
  const mirror = new THREE.Group(); mirror.scale.y = -1; scene.add(mirror); // cheap planar reflection under the glossy lanes

  /* ---------- hall ---------- */
  const laneGeo = new THREE.PlaneGeometry(LANE_W, LEN); laneGeo.rotateX(-Math.PI / 2); laneGeo.translate(0, 0, -LEN / 2);
  const apprGeo = new THREE.PlaneGeometry(PITCH * N_LANES, 4.8); apprGeo.rotateX(-Math.PI / 2); apprGeo.translate(0, -0.002, 2.4);
  for (let i = 0; i < N_LANES; i++) { const l = new THREE.Mesh(laneGeo, M.lane); l.position.x = laneX(i); l.renderOrder = 2; world.add(l); }
  const appr = new THREE.Mesh(apprGeo, new THREE.MeshStandardMaterial({ color: 0x0a1238, roughness: 0.3, envMapIntensity: 0.6, emissive: 0x0a1a6a, emissiveIntensity: 0.5 }));
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
    const col = UVB;
    const s = new THREE.Mesh(stripGeo, neon(col, 0.5)); s.position.x = x; world.add(s);
    const gl = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({ map: lineGlowTex, color: col, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    gl.position.x = x; world.add(gl);
    strips.push({ s, gl, base: new THREE.Color(col) });
  }
  world.add(gut, caps);

  // pin deck, pit, masking unit, back wall
  const pit = new THREE.Mesh(new THREE.PlaneGeometry(PITCH * N_LANES, 1.2), M.dark);
  pit.rotation.x = -Math.PI / 2; pit.position.set(appr.position.x, -0.5, -LEN - 0.6); world.add(pit);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(PITCH * N_LANES + 0.4, 0.95, 0.35), M.dark);
  mask.position.set(appr.position.x, 1.5, -18.95); world.add(mask);
  const maskStrip = new THREE.Mesh(new THREE.BoxGeometry(PITCH * N_LANES + 0.4, 0.02, 0.02), neon(UVB));
  maskStrip.position.set(appr.position.x, 1.02, -18.77); world.add(maskStrip);
  const maskGlow = new THREE.Mesh(new THREE.PlaneGeometry(PITCH * N_LANES + 0.4, 0.5), new THREE.MeshBasicMaterial({ map: lineGlowTex, color: UVB, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  maskGlow.material.map = lineGlowTex.clone(); maskGlow.material.map.rotation = Math.PI / 2; maskGlow.material.map.center.set(0.5, 0.5);
  maskGlow.position.set(appr.position.x, 1.02, -18.76); world.add(maskGlow);
  const kickbacks = new THREE.InstancedMesh(new THREE.BoxGeometry(CAP, 0.42, 2.6), M.dark, N_LANES + 1);
  for (let b = 0; b <= N_LANES; b++) { m4.makeTranslation(laneX(b) - PITCH / 2, 0.21, -17.9); kickbacks.setMatrixAt(b, m4); }
  world.add(kickbacks);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.9 }));
  wall.position.set(0, 4, -20.5); world.add(wall);

  // pop-art banner over the pin decks, one panel per lane, as in the hall
  try { await Promise.race([document.fonts.load('700 40px Georgia'), new Promise((res) => setTimeout(res, 800))]); } catch (e) {}
  const SLOGANS = ['Bowling for all', 'Sport, détente|élégance', 'Bowl with us', 'Faites 300, on offre|le champagne', 'Get smart|be bowling', 'Bowling à gogo', 'Bowl for health', '10 quilles tombées|Strike assuré'];
  const bannerTex = canvasTex(4096, 280, (g, w, h) => {
    const pw = w / 8, art = h * 0.7;
    const pinPath = (x, y, s, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(-7, -30, -9, -20, -6, -14); g.bezierCurveTo(-4, -10, -14, -4, -14, 10); g.bezierCurveTo(-14, 26, -6, 34, 0, 34); g.bezierCurveTo(6, 34, 14, 26, 14, 10); g.bezierCurveTo(14, -4, 4, -10, 6, -14); g.bezierCurveTo(9, -20, 7, -30, 0, -30); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 2.5; g.stroke(); g.fillStyle = '#d4202a'; g.fillRect(-5, -13, 10, 3); g.fillRect(-5, -8, 10, 3); g.restore(); };
    for (let i = 0; i < 8; i++) {
      const x0 = i * pw;
      g.save(); g.beginPath(); g.rect(x0 + 6, 6, pw - 12, art - 6); g.clip();
      g.fillStyle = '#0b0b0f'; g.fillRect(x0, 0, pw, art);
      if (i % 2 === 0) {           // pins & ball, pop-art
        g.fillStyle = '#d4202a'; g.beginPath(); g.moveTo(x0, art); g.lineTo(x0 + pw * 0.7, 0); g.lineTo(x0 + pw, 0); g.lineTo(x0 + pw * 0.3, art); g.closePath(); g.fill();
        g.fillStyle = '#fff'; for (let yy = 10; yy < art; yy += 14) for (let xx = x0 + 10 + (yy % 28 ? 7 : 0); xx < x0 + pw; xx += 14) { g.beginPath(); g.arc(xx, yy, 2.2, 0, 7); g.fill(); }
        for (let k = 0; k < 5; k++) pinPath(x0 + pw * (0.25 + k * 0.14), art * (0.35 + (k % 2) * 0.2), 2.1, (k - 2) * 0.35);
        g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 4; g.beginPath(); g.arc(x0 + pw * 0.22, art * 0.72, 46, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#000'; for (const [dx, dy] of [[-10, -12], [8, -14], [0, 4]]) { g.beginPath(); g.arc(x0 + pw * 0.22 + dx, art * 0.72 + dy, 6, 0, 7); g.fill(); }
      } else {                     // portrait with sunglasses
        const bgk = (i >> 1) % 3;
        if (bgk === 0) { g.fillStyle = '#fff'; for (let xx = x0; xx < x0 + pw; xx += 18) g.fillRect(xx, 0, 9, art); }
        else if (bgk === 1) { g.fillStyle = '#d4202a'; g.beginPath(); g.arc(x0 + pw / 2, art * 0.55, art * 0.55, 0, 7); g.fill(); }
        else { g.fillStyle = '#d4202a'; for (let yy = 0; yy < art; yy += 16) g.fillRect(x0, yy, pw, 8); }
        const cx = x0 + pw / 2, cy = art * 0.55;
        g.fillStyle = '#000'; g.beginPath(); g.ellipse(cx, cy - 8, 64, 78, 0, 0, 7); g.fill();                  // hair
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, cy + 6, 44, 56, 0, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke();
        g.fillStyle = '#000'; g.beginPath(); g.ellipse(cx - 20, cy - 4, 20, 13, 0, 0, 7); g.ellipse(cx + 20, cy - 4, 20, 13, 0, 0, 7); g.fill(); g.fillRect(cx - 4, cy - 7, 8, 4);
        g.fillStyle = '#d4202a'; g.beginPath(); g.ellipse(cx, cy + 34, 13, 6, 0, 0, 7); g.fill();
        if (i === 3 || i === 7) { g.fillStyle = i === 3 ? '#d4202a' : '#fff'; g.beginPath(); g.ellipse(cx, cy - 58, 110, 22, -0.1, 0, 7); g.fill(); g.fillRect(cx - 50, cy - 110, 100, 55); g.strokeStyle = '#000'; g.stroke(); }
        if (i === 1) { g.fillStyle = '#d4202a'; g.fillRect(cx - 70, art - 40, 140, 40); g.fillStyle = '#fff'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(cx - 60 + k * 20, art - 22, 4, 0, 7); g.fill(); } }
        if (i === 5) { g.fillStyle = '#fff'; g.fillRect(cx - 70, art - 36, 140, 36); g.fillStyle = '#000'; for (let k = 0; k < 8; k++) g.fillRect(cx - 66 + k * 17, art - 36, 7, 36); }
      }
      g.restore();
      // caption bar: lane number + slogan
      g.fillStyle = '#000'; g.fillRect(x0 + 6, art, pw - 12, h - art - 6);
      g.strokeStyle = '#e8e8f0'; g.lineWidth = 2; g.strokeRect(x0 + 8, art + 2, pw - 16, h - art - 10);
      g.fillStyle = '#f4f4f8'; g.fillRect(x0 + 16, art + 10, 50, h - art - 26);
      g.fillStyle = '#000'; g.font = '700 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), x0 + 41, art + (h - art) / 2 - 2);
      g.fillStyle = '#f4f4f8'; g.font = '700 26px Georgia, serif';
      const lines = SLOGANS[i].split('|'), mid = art + (h - art) / 2 - 2;
      lines.forEach((ln, k) => g.fillText(ln, x0 + pw / 2 + 30, mid + (k - (lines.length - 1) / 2) * 28));
    }
  });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(PITCH * N_LANES, 0.9), new THREE.MeshBasicMaterial({ map: bannerTex, color: 0xdfe4ff }));
  banner.position.set((laneX(0) + laneX(N_LANES - 1)) / 2, 1.5, -18.76); world.add(banner);

  // ceiling: corrugated steel deck lit blue, beams, long rows of UV tubes
  const ribs = canvasTex(64, 512, (g, w, h) => { for (let x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? '#2a40c8' : '#101c70'; g.fillRect(x, 0, 8, h); } });
  ribs.wrapS = ribs.wrapT = THREE.RepeatWrapping; ribs.repeat.set(30, 1);
  const deckRoof = new THREE.Mesh(new THREE.PlaneGeometry(22, 30), new THREE.MeshStandardMaterial({ color: 0x0a1240, emissive: 0xffffff, emissiveMap: ribs, emissiveIntensity: 0.32, roughness: 0.5, metalness: 0.5 }));
  deckRoof.rotation.x = Math.PI / 2; deckRoof.position.set(0, 4.3, -7); world.add(deckRoof);
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(22, 0.22, 0.14), M.dark, 9);
  for (let k = 0; k < 9; k++) { m4.makeTranslation(0, 4.05, 3 - k * 2.6); beams.setMatrixAt(k, m4); }
  world.add(beams);
  const tubeGeo = new THREE.BoxGeometry(0.05, 0.04, 1.25);
  const lampMat = neon(0x8a6bff, 0.95);
  const housing = new THREE.MeshStandardMaterial({ color: 0xcfd6ff, roughness: 0.4, emissive: 0x4a50c0, emissiveIntensity: 0.4 });
  const rowsX = []; for (let x = -7.2; x <= 6.2; x += 1.35) rowsX.push(x);
  const nZ = 14, lamps = new THREE.InstancedMesh(tubeGeo, lampMat, rowsX.length * nZ), houses = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.04, 1.3), housing, rowsX.length * nZ);
  let li = 0;
  rowsX.forEach((x) => { for (let k = 0; k < nZ; k++) { m4.makeTranslation(x, 3.55, 3.5 - k * 1.6); lamps.setMatrixAt(li, m4); m4.makeTranslation(x, 3.6, 3.5 - k * 1.6); houses.setMatrixAt(li++, m4); } });
  world.add(lamps, houses);
  const rowGlowGeo = new THREE.PlaneGeometry(0.8, 22); rowGlowGeo.rotateX(Math.PI / 2);
  rowsX.forEach((x) => { const gl = new THREE.Mesh(rowGlowGeo, new THREE.MeshBasicMaterial({ map: lineGlowTex, color: 0x7a5cff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); gl.position.set(x, 3.52, -7.5); world.add(gl); });
  // big translucent ventilation duct on the right
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 24, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x8fa4ff, transparent: true, opacity: 0.22, roughness: 0.2, metalness: 0.6, emissive: 0x1a2a8a, emissiveIntensity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
  duct.rotation.x = Math.PI / 2; duct.position.set(5.9, 3.75, -7); world.add(duct);
  const ringGeo = new THREE.TorusGeometry(0.42, 0.015, 6, 28);
  for (let z = 4; z > -19; z -= 1.3) { const rg = new THREE.Mesh(ringGeo, housing); rg.position.set(5.9, 3.75, z); world.add(rg); }
  // black pillars on the left, between lanes 1 and 2
  const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.3, 18);
  for (const z of [-5.5, -11.5]) { const pl = new THREE.Mesh(pillarGeo, new THREE.MeshStandardMaterial({ color: 0x05060c, roughness: 0.4, metalness: 0.3 })); pl.position.set(laneX(0) + PITCH / 2, 2.15, z); world.add(pl); }


  /* ---------- side wall & door to the laser arena (transition to the next scene) ---------- */
  const side = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), new THREE.MeshStandardMaterial({ color: 0x0b0a10, roughness: 0.9 }));
  side.rotation.y = -Math.PI / 2; side.position.set(DOOR_X + 0.35, 3.5, -8); world.add(side);
  // white zig-zag line art on the right wall, as in the hall
  const zig = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(DOOR_X - 0.01, 1.6, -11), V(DOOR_X - 0.01, 3.4, -13.5), V(DOOR_X - 0.01, 2.3, -15), V(DOOR_X - 0.01, 3.6, -18.5)]), new THREE.LineBasicMaterial({ color: 0xe8ecff, toneMapped: false }));
  world.add(zig);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x0c0b10, roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.09, -6); world.add(floor);
  const laserDoor = makeLaserDoor({ glowTex });
  laserDoor.group.position.set(DOOR_X, 0, DOOR_Z); laserDoor.group.rotation.y = -Math.PI / 2; world.add(laserDoor.group);
  // the wall around the bulkhead frame
  for (const [w, h, y, z] of [[9.6, 4.6, 2.3, DOOR_Z + 6.15], [11.6, 4.6, 2.3, DOOR_Z - 7.15], [2.7, 1.65, 3.78, DOOR_Z]]) { const pc = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0x0b0a16, roughness: 0.9 })); pc.rotation.y = -Math.PI / 2; pc.position.set(DOOR_X + 0.005, y, z); world.add(pc); }

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
  const hemi = new THREE.HemisphereLight(0x3a55ff, 0x05081a, 0.75); scene.add(hemi);
  const deck = new THREE.SpotLight(0xc8d2ff, 26, 9, 0.75, 0.6, 1.4); deck.position.set(0, 1.0, -17.2); deck.target.position.set(0, 0, -18.7); scene.add(deck, deck.target);
  const laneLights = [-3, -9, -14].map((z) => { const l = new THREE.PointLight(0x5a6dff, 7, 10, 1.6); l.position.set(0, 2.9, z); scene.add(l); return l; });
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe0c0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false, fog: false }));
  flash.position.set(0.05, 0.2, -18.45); flash.scale.set(2.4, 2.4, 1); world.add(flash);

  const NH = small ? 220 : 600;
  const hazePos = new Float32Array(NH * 3);
  for (let i = 0; i < NH; i++) { hazePos[i * 3] = (R() - 0.5) * 14; hazePos[i * 3 + 1] = R() * 3.2; hazePos[i * 3 + 2] = -19 + R() * 22; }
  const hazeGeo = new THREE.BufferGeometry(); hazeGeo.setAttribute('position', new THREE.BufferAttribute(hazePos, 3));
  const haze = new THREE.Points(hazeGeo, new THREE.PointsMaterial({ map: glowTex, size: 0.09, color: 0x7a8cff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
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
    { p: 0.86, pos: () => V(2.4, 1.7, -8.2), look: () => V(DOOR_X, 1.5, DOOR_Z), fov: 54 },
    { p: 1.0, pos: () => V(DOOR_X - 3.6, 1.6, DOOR_Z + 0.2), look: () => V(DOOR_X, 1.55, DOOR_Z), fov: 50 },
  ];

  /* ---------- per-frame scene state ---------- */
  const IMPACT_P = 0.52, SIM_END_P = 0.66;
  function update(p, time, pointer) {
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

    haze.rotation.y = Math.sin(time * 0.05) * 0.04;

    // strike flash
    const fl = Math.exp(-Math.pow((p - (IMPACT_P + 0.012)) / 0.012, 2));
    flash.material.opacity = fl * 0.9; deck.intensity = 26 + 60 * fl;

    rigCamera(camera, K, p, time, pointer);
  }

  return { scene, camera, update };
}
