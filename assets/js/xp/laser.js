/* =====================================================================
   Scene 2 — Laser game under black light, first-person.
     0.00  dark corridor, the LASER GAME door
     0.10  the door slides open, we walk into the arena
     0.30  look around: fluorescent paint, haze, glowing maze edges
     0.42  engagement: we aim and fire green lasers at four opponents;
           their vest sensors flash and blink once hit
     0.88  rise above the arena, hand over to the rest of the site
   Everything is a pure function of scroll progress (scrubs backwards).
   ===================================================================== */
import { THREE, clamp, sstep, V, rng, canvasTex, glowTextures, neon, rigCamera } from './util.js';

const UV = ['#39ff6a', '#ff2fd6', '#ff9a1f', '#2ff0ff', '#b46bff', '#f6ff3a'];
const GREEN = 0x39ff6a, RED = 0xff2a3a;

export async function buildLaser({ small }) {
  const R = rng(1337);
  const scene = new THREE.Scene();
  const FOG = new THREE.Color(0x0b0518);
  scene.fog = new THREE.FogExp2(FOG.clone(), 0.055);
  scene.background = FOG.clone();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.02, 60);
  scene.add(camera);
  const { glow: glowTex } = glowTextures();

  /* ---------- fluorescent "black light" paint (emissive maps) ---------- */
  const uvPaint = (variant, size = 512) => canvasTex(size, size, (g, w, h) => {
    g.fillStyle = '#06040b'; g.fillRect(0, 0, w, h);
    const col = () => UV[Math.floor(R() * UV.length)];
    if (variant === 'graffiti') {
      for (let i = 0; i < 14; i++) {
        g.strokeStyle = col(); g.lineWidth = 6 + R() * 22; g.lineCap = 'round'; g.shadowColor = g.strokeStyle; g.shadowBlur = 18;
        g.beginPath(); g.moveTo(R() * w, R() * h); g.bezierCurveTo(R() * w, R() * h, R() * w, R() * h, R() * w, R() * h); g.stroke();
      }
      for (let i = 0; i < 60; i++) { g.fillStyle = col(); g.globalAlpha = 0.6 + R() * 0.4; g.beginPath(); g.arc(R() * w, R() * h, 2 + R() * 10, 0, 7); g.fill(); }
      g.globalAlpha = 1;
      for (let i = 0; i < 6; i++) { const x = R() * w, y = R() * h * 0.6; g.strokeStyle = col(); g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 6, y + 60 + R() * 120); g.stroke(); }
    } else if (variant === 'grid') {
      g.shadowBlur = 10; const c1 = '#2ff0ff', c2 = '#ff2fd6';
      const s = w / 8;
      for (let x = 0; x <= 8; x++) for (let y = 0; y <= 8; y++) {
        const cx = x * s + (y % 2 ? s / 2 : 0), cy = y * s * 0.87;
        g.strokeStyle = (x + y) % 3 ? c1 : c2; g.shadowColor = g.strokeStyle; g.lineWidth = 3; g.beginPath();
        for (let k = 0; k <= 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; g.lineTo(cx + Math.cos(a) * s * 0.45, cy + Math.sin(a) * s * 0.45); }
        g.stroke();
      }
    } else if (variant === 'stripes') {
      g.save(); g.translate(w / 2, h / 2); g.rotate(-Math.PI / 4);
      for (let i = -12; i < 12; i++) { g.fillStyle = i % 2 ? '#ff9a1f' : '#06040b'; g.fillRect(i * 40, -w, 40, w * 2); }
      g.restore();
      g.fillStyle = '#06040b'; g.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.4);
      g.fillStyle = '#39ff6a'; g.shadowColor = '#39ff6a'; g.shadowBlur = 16;
      for (let k = 0; k < 3; k++) { const x = w * 0.22 + k * w * 0.2; g.beginPath(); g.moveTo(x, h * 0.36); g.lineTo(x + 50, h * 0.5); g.lineTo(x, h * 0.64); g.lineTo(x + 18, h * 0.5); g.closePath(); g.fill(); }
    } else { // floor splatter
      for (let i = 0; i < 260; i++) { g.fillStyle = col(); g.globalAlpha = 0.35 + R() * 0.65; g.beginPath(); g.arc(R() * w, R() * h, 0.8 + R() * 3.2, 0, 7); g.fill(); }
      g.globalAlpha = 0.5; g.strokeStyle = '#b46bff'; g.lineWidth = 2;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, R() * h); g.lineTo(w, R() * h); g.stroke(); }
    }
  });
  const paint = {
    graffiti: uvPaint('graffiti'), grid: uvPaint('grid'), stripes: uvPaint('stripes'), floor: uvPaint('floor', 256),
  };
  paint.floor.wrapS = paint.floor.wrapT = THREE.RepeatWrapping; paint.floor.repeat.set(10, 10);
  const uvMat = (tex, k = 1.1) => new THREE.MeshStandardMaterial({ color: 0x0c0914, roughness: 0.9, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: k });
  const M = { graffiti: uvMat(paint.graffiti), grid: uvMat(paint.grid, 0.9), stripes: uvMat(paint.stripes, 0.8), floor: uvMat(paint.floor, 0.9), plain: new THREE.MeshStandardMaterial({ color: 0x100c1a, roughness: 0.9 }), corridor: uvMat(paint.stripes, 0.35) };

  const world = new THREE.Group(); scene.add(world);
  const box = (w, h, d, x, y, z, mat, edge) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); world.add(m);
    if (edge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: edge, toneMapped: false })); e.position.copy(m.position); world.add(e); }
    return m;
  };

  /* ---------- corridor, door, arena shell ---------- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 26), M.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -3); world.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(18, 26), M.plain); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.3, -3); world.add(ceil);
  box(0.2, 3.3, 6, -1.2, 1.65, 7, M.corridor); box(0.2, 3.3, 6, 1.2, 1.65, 7, M.corridor);           // corridor
  box(7.2, 3.3, 0.3, -4.6, 1.65, 4.1, M.graffiti); box(7.2, 3.3, 0.3, 4.6, 1.65, 4.1, M.graffiti); // front wall
  box(2, 0.95, 0.3, 0, 2.83, 4.1, M.plain);
  box(0.3, 3.3, 18, -8, 1.65, -5, M.grid); box(0.3, 3.3, 18, 8, 1.65, -5, M.graffiti); box(16, 3.3, 0.3, 0, 1.65, -14, M.grid);
  // the door: two sliding leaves + neon frame + sign
  const leafL = box(0.75, 2.3, 0.08, -0.375, 1.15, 4.12, M.stripes), leafR = box(0.75, 2.3, 0.08, 0.375, 1.15, 4.12, M.stripes);
  const frame = neon(GREEN);
  for (const [w, h, x, y] of [[0.05, 2.4, -0.78, 1.2], [0.05, 2.4, 0.78, 1.2], [1.6, 0.05, 0, 2.38]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), frame); b.position.set(x, y, 4.28); world.add(b); }
  const signTex = canvasTex(1024, 256, (g, w, h) => {
    g.textBaseline = 'middle'; g.textAlign = 'left';
    const parts = [['LASER', '800 120px Syne, "Arial Black", sans-serif', '#39ff6a'], ['game', 'italic 400 140px "Instrument Serif", Georgia, serif', '#ff2fd6']];
    const ws = parts.map(([s, f]) => { g.font = f; return g.measureText(s).width; }); const gap = 30, tot = ws[0] + ws[1] + gap, sc = Math.min(1, (w - 60) / tot);
    g.setTransform(sc, 0, 0, sc, (w - tot * sc) / 2, h / 2 * (1 - sc));
    let x = 0; parts.forEach(([s, f, c], i) => { g.font = f; g.shadowColor = c; for (const b of [40, 16, 5]) { g.shadowBlur = b; g.fillStyle = c; g.fillText(s, x, h / 2); } g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = 0.8; g.fillText(s, x, h / 2); g.globalAlpha = 1; x += ws[i] + gap; });
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sign.position.set(0, 2.85, 4.3); world.add(sign);

  /* ---------- the maze: covers, pillars, barrels with glowing edges ---------- */
  const E = [GREEN, 0xff2fd6, 0xff9a1f, 0x2ff0ff];
  box(1.7, 1.15, 0.35, -2.2, 0.575, -2.3, M.stripes, E[1]);   // cover A
  box(1.5, 1.05, 0.35, 2.7, 0.525, -5.7, M.grid, E[3]);       // cover B
  box(0.8, 3.3, 0.8, -1.1, 1.65, -8.8, M.graffiti, E[0]);     // pillar C
  box(1.3, 1.0, 0.4, 4.0, 0.5, -1.2, M.graffiti, E[2]);       // cover D
  box(0.35, 2.6, 4, -5, 1.3, -6.5, M.grid, E[3]); box(0.35, 2.6, 5, 5.6, 1.3, -9, M.graffiti, E[1]);
  box(4, 2.6, 0.35, -3.6, 1.3, -11.8, M.graffiti, E[2]); box(3, 2.6, 0.35, 2.8, 1.3, -12.4, M.stripes, E[0]);
  const barrelGeo = new THREE.CylinderGeometry(0.33, 0.33, 1, 20);
  for (const [x, z] of [[-6, -2], [6.5, -4.5], [1.5, -3.4], [-3.2, -9.5]]) {
    const b = new THREE.Mesh(barrelGeo, M.stripes); b.position.set(x, 0.5, z); world.add(b);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.012, 6, 32), neon(E[Math.floor(R() * 4)])); ring.rotation.x = Math.PI / 2; ring.position.set(x, 1.0, z); world.add(ring);
  }

  /* ---------- black-light tubes, lights, haze ---------- */
  const tubeGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8); tubeGeo.rotateZ(Math.PI / 2);
  const tubeMat = neon(0x8a4dff);
  const tubes = [[0, 3.2, 7], [-4, 3.2, 0], [3, 3.2, -1], [-2, 3.2, -6], [3.5, 3.2, -8], [0, 3.2, -12]];
  for (const [x, y, z] of tubes) {
    const t = new THREE.Mesh(tubeGeo, tubeMat); t.position.set(x, y, z); world.add(t);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x7a3cff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.position.set(x, y - 0.05, z); s.scale.set(2.6, 1.1, 1); world.add(s);
  }
  scene.add(new THREE.HemisphereLight(0x6a3cff, 0x10061e, 0.5));
  for (const [x, y, z] of [[0, 3, 7], [-3, 3, -1], [3, 3, -6], [0, 3, -11]]) { const l = new THREE.PointLight(0x7a3cff, 7, 9, 1.6); l.position.set(x, y, z); scene.add(l); }
  const NH = small ? 260 : 700, hp = new Float32Array(NH * 3);
  for (let i = 0; i < NH; i++) { hp[i * 3] = (R() - 0.5) * 16; hp[i * 3 + 1] = R() * 3.2; hp[i * 3 + 2] = -14 + R() * 24; }
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hp, 3));
  const haze = new THREE.Points(hg, new THREE.PointsMaterial({ map: glowTex, size: 0.08, color: 0xc9a8ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  world.add(haze);

  /* ---------- opponents (red team, vests with sensors) ---------- */
  const suit = new THREE.MeshStandardMaterial({ color: 0x241d33, roughness: 0.8 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x15111f, roughness: 0.6, emissive: RED, emissiveIntensity: 0.15 });
  const cap = (r, l, x, y, z, rx = 0, rz = 0, mat = suit, parent) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); parent.add(m); return m; };
  function opponent(x, z, crouch = 0) {
    const g = new THREE.Group(); g.position.set(x, -crouch, z); world.add(g);
    const body = new THREE.Group(); g.add(body);
    cap(0.085, 0.62, -0.1, 0.42, 0, 0, 0, suit, body); cap(0.085, 0.62, 0.1, 0.42, 0, 0, 0, suit, body);
    cap(0.19, 0.42, 0, 1.2, 0, 0, 0, suit, body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), suit); head.position.set(0, 1.66, 0); body.add(head);
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.32), vestMat); vest.position.set(0, 1.28, 0); body.add(vest);
    cap(0.055, 0.38, -0.24, 1.25, 0.16, -1.2, 0.2, suit, body); cap(0.055, 0.38, 0.24, 1.25, 0.16, -1.2, -0.2, suit, body);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.4), suit); gun.position.set(0.06, 1.24, 0.38); body.add(gun);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), neon(RED)); tip.position.set(0.06, 1.25, 0.6); body.add(tip);
    const sMat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false });
    const sensors = [[0, 1.36, 0.17], [-0.2, 1.52, 0.06], [0.2, 1.52, 0.06], [0, 1.36, -0.17], [0, 1.74, 0.09]].map(([sx, sy, sz]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), sMat); s.position.set(sx, sy, sz); body.add(s); return s; });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: RED, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    halo.position.set(0, 1.4, 0.2); halo.scale.set(0.9, 0.9, 1); body.add(halo);
    g.lookAt(0, -crouch, 2); g.rotation.x = 0; g.rotation.z = 0;
    const chest = new THREE.Vector3();
    return { g, body, sMat, halo, chest: () => sensors[0].getWorldPosition(chest) };
  }
  const foes = [opponent(-2.2, -3.0, 0.08), opponent(2.9, -6.5, 0.1), opponent(-0.15, -9.6), opponent(4.6, -2.0, 0.12)];
  world.updateMatrixWorld(true);
  const AIM = foes.map((f) => f.chest().clone());

  /* ---------- the player's laser gun (first person, child of the camera) ---------- */
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1e2230, roughness: 0.4, metalness: 0.6, emissive: 0x1b0f3a, emissiveIntensity: 0.6 });
  const gun = new THREE.Group(); camera.add(gun);
  const part = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; gun.add(m); return m; };
  part(new THREE.BoxGeometry(0.1, 0.12, 0.42), gunMat, 0, 0, 0);
  const barrel = new THREE.CylinderGeometry(0.026, 0.03, 0.26, 16); barrel.rotateX(Math.PI / 2);
  part(barrel, gunMat, 0, 0.01, -0.32);
  part(new THREE.BoxGeometry(0.07, 0.17, 0.09), gunMat, 0, -0.12, 0.1, 0.35);
  part(new THREE.BoxGeometry(0.03, 0.04, 0.16), gunMat, 0, 0.08, -0.02);
  for (const s of [-1, 1]) part(new THREE.BoxGeometry(0.006, 0.02, 0.36), neon(GREEN), s * 0.052, 0.02, -0.02);
  const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 20), neon(GREEN)); muzzleRing.position.set(0, 0.01, -0.45); gun.add(muzzleRing);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.01, -0.47); gun.add(muzzle);
  const GUN_REST = V(0.24, -0.25, -0.52);
  gun.position.copy(GUN_REST); gun.rotation.set(0.02, 0.06, 0);
  const gunLight = new THREE.PointLight(GREEN, 0, 2.5, 2); camera.add(gunLight); gunLight.position.set(0.2, -0.15, -0.8);

  /* ---------- beams ---------- */
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true); beamGeo.translate(0, 0.5, 0);
  function beam(color) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(beamGeo, neon(color, 0)); core.scale.set(0.006, 1, 0.006);
    const halo = new THREE.Mesh(beamGeo, neon(color, 0)); halo.scale.set(0.04, 1, 0.04);
    g.add(core, halo); scene.add(g);
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const impact = flash.clone(); impact.material = flash.material.clone(); scene.add(flash, impact);
    return {
      set(a, b, k) {
        g.visible = k > 0.01;
        if (!g.visible) { flash.material.opacity = impact.material.opacity = 0; return; }
        const d = b.clone().sub(a), len = d.length();
        g.position.copy(a); g.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.scale.set(1, len, 1);
        core.material.opacity = k; halo.material.opacity = 0.3 * k;
        flash.position.copy(a); flash.scale.setScalar(0.35 * k); flash.material.opacity = k;
        impact.position.copy(b); impact.scale.setScalar(0.9 * k); impact.material.opacity = k;
      },
    };
  }
  const shots = [0.465, 0.6, 0.715, 0.815].map((p, i) => ({ p, foe: i, b: beam(GREEN) }));
  const enemyShot = { p: 0.655, b: beam(RED) };   // return fire that grazes past us

  /* ---------- camera choreography ---------- */
  const at = (i) => () => AIM[i];
  const K = [
    { p: 0.0, pos: () => V(0, 1.62, 9.2), look: () => V(0, 1.7, 4), fov: 55 },
    { p: 0.1, pos: () => V(0, 1.62, 7.3), look: () => V(0, 1.6, 4), fov: 55 },
    { p: 0.22, pos: () => V(0, 1.6, 3.9), look: () => V(0, 1.35, -4), fov: 60 },
    { p: 0.33, pos: () => V(-0.5, 1.58, 2.3), look: () => V(-4, 1.3, -5), fov: 60 },
    { p: 0.42, pos: () => V(-0.3, 1.56, 1.5), look: at(0), fov: 52 },
    { p: 0.5, pos: () => V(-0.3, 1.56, 1.5), look: at(0), fov: 52 },
    { p: 0.56, pos: () => V(0.2, 1.55, 0.8), look: at(1), fov: 50 },
    { p: 0.64, pos: () => V(0.2, 1.55, 0.8), look: at(1), fov: 50 },
    { p: 0.68, pos: () => V(0.4, 1.52, 0.1), look: at(2), fov: 46 },
    { p: 0.75, pos: () => V(0.4, 1.52, 0.1), look: at(2), fov: 46 },
    { p: 0.79, pos: () => V(0.7, 1.52, -0.3), look: at(3), fov: 52 },
    { p: 0.86, pos: () => V(0.7, 1.52, -0.3), look: at(3), fov: 52 },
    { p: 1.0, pos: () => V(0, 6.2, 6.5), look: () => V(0, 0, -5), fov: 52 },
  ];

  const a = new THREE.Vector3(), white = new THREE.Color(0xffffff), red = new THREE.Color(RED);
  function update(p, time, pointer) {
    // door
    const open = sstep(0.08, 0.2, p);
    leafL.position.x = -0.375 - open * 0.8; leafR.position.x = 0.375 + open * 0.8;
    sign.material.opacity = 0.85 + 0.15 * Math.sin(time * 4.3) * Math.sin(time * 2.1);
    haze.rotation.y = Math.sin(time * 0.05) * 0.05;

    rigCamera(camera, K, p, time, pointer, 0.5);
    // walking bob while moving in, gun lowered on the final rise
    const walk = sstep(0.1, 0.16, p) * (1 - sstep(0.36, 0.42, p));
    const lower = sstep(0.87, 0.95, p);
    let kick = 0;
    for (const s of shots) kick = Math.max(kick, Math.exp(-Math.pow((p - s.p - 0.004) / 0.008, 2)));
    gun.position.set(GUN_REST.x, GUN_REST.y - lower * 0.5 + Math.sin(p * 160) * 0.012 * walk, GUN_REST.z + kick * 0.06);
    gun.rotation.x = 0.02 + kick * 0.16 + Math.sin(p * 80) * 0.02 * walk;
    gunLight.intensity = kick * 4;
    camera.updateMatrixWorld(true);
    muzzle.getWorldPosition(a);

    shots.forEach((s) => {
      const k = sstep(s.p - 0.002, s.p + 0.003, p) * (1 - sstep(s.p + 0.012, s.p + 0.026, p));
      s.b.set(a.clone(), AIM[s.foe], k);
    });
    const ek = sstep(enemyShot.p - 0.002, enemyShot.p + 0.003, p) * (1 - sstep(enemyShot.p + 0.012, enemyShot.p + 0.024, p));
    enemyShot.b.set(foes[2].body.localToWorld(V(0.06, 1.25, 0.6)), camera.position.clone().add(V(0.55, -0.1, 0.4)), ek);

    foes.forEach((f, i) => {
      const sp = shots[i].p;
      const hit = sstep(sp + 0.004, sp + 0.008, p);
      const flash = Math.exp(-Math.pow((p - sp - 0.012) / 0.012, 2));
      // after a hit the vest "dies": sensors blink, the player recoils
      const blink = hit ? 0.35 + 0.65 * (Math.sin(time * 14 + i) > 0 ? 1 : 0) : 1;
      f.sMat.color.copy(red).multiplyScalar(blink).lerp(white, flash);
      f.halo.material.opacity = 0.7 * blink + flash;
      f.halo.material.color.copy(red).lerp(white, flash);
      f.halo.scale.setScalar(0.9 + flash * 1.6);
      f.body.rotation.x = -0.22 * hit * (0.6 + 0.4 * Math.exp(-(p - sp) * 30));
    });
  }

  return { scene, camera, update };
}
