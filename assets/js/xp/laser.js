/* =====================================================================
   Scene 2 — the real Boules et Billes laser game, first-person.
   Modelled on the venue photos:
     • the bulkhead entrance (gold "LASER GAME", hazard jambs, purple
       LEDs) and its fluorescent galaxy/trooper door, which swings in
     • smoke lit orange behind the door
     • a maze of tall airbrushed partitions (orange/yellow clouds, blue
       highlights) under light-wood rafters and blue UV tubes
     • a dripping skull mural and, at the end of the corridor, the black
       soldier silhouette with its yellow-orange halo
   Timeline: door 0.08–0.22 · walk in · 3 opponents engaged in the side
   openings (green laser hits) with one red return shot · end mural ·
   aerial view over the maze. Pure function of scroll (scrubs back).
   ===================================================================== */
import { THREE, sstep, V, rng, canvasTex, glowTextures, neon, rigCamera } from './util.js';
import { makeLaserDoor } from './door.js';
import { makeGenesisGun } from './gun.js';

const GREEN = 0x39ff6a, RED = 0xff2a3a;
const WALL_H = 2.5;

export async function buildLaser({ small }) {
  const R = rng(1337);
  const scene = new THREE.Scene();
  const FOG = new THREE.Color(0x07061a);
  scene.fog = new THREE.FogExp2(FOG.clone(), 0.07);
  scene.background = FOG.clone();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.02, 60);
  scene.add(camera);
  const { glow: glowTex } = glowTextures();

  /* ---------- airbrushed fluorescent murals (emissive maps) ---------- */
  const blob = (g, x, y, r, c, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c.replace('A', a)); gr.addColorStop(1, c.replace('A', 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const airbrush = (g, w, h, warm = 1) => {
    g.fillStyle = '#050309'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) blob(g, R() * w, R() * h, 40 + R() * 120, R() > 0.4 ? 'rgba(255,140,40,A)' : 'rgba(255,214,70,A)', 0.35 * warm + R() * 0.25);
    for (let i = 0; i < 10; i++) blob(g, R() * w, R() * h, 30 + R() * 90, 'rgba(90,110,255,A)', 0.35 + R() * 0.25);
    g.strokeStyle = 'rgba(5,3,9,.45)'; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) { g.lineWidth = 2 + R() * 5; g.beginPath(); g.moveTo(R() * w, R() * h); g.bezierCurveTo(R() * w, R() * h, R() * w, R() * h, R() * w, R() * h); g.stroke(); }
  };
  const tex = {
    a: canvasTex(512, 512, (g, w, h) => airbrush(g, w, h, 1)),
    b: canvasTex(512, 512, (g, w, h) => airbrush(g, w, h, 0.7)),
    skull: canvasTex(512, 512, (g, w, h) => {
      airbrush(g, w, h, 0.8);
      const cx = w * 0.45, cy = h * 0.38, ink = '#f2d27a';
      g.fillStyle = ink; g.shadowColor = '#ffb040'; g.shadowBlur = 20;
      g.beginPath(); g.ellipse(cx, cy, 120, 105, 0, 0, 7); g.fill();
      g.fillRect(cx - 70, cy + 60, 140, 80);
      g.shadowBlur = 0;
      for (let i = 0; i < 11; i++) { const x = cx - 100 + i * 20 + R() * 8, len = 60 + R() * 160; g.fillRect(x, cy + 120, 7, len); g.beginPath(); g.arc(x + 3.5, cy + 120 + len, 6, 0, 7); g.fill(); }
      g.fillStyle = '#050309';
      g.beginPath(); g.ellipse(cx - 45, cy + 5, 32, 38, 0.15, 0, 7); g.fill();
      g.beginPath(); g.ellipse(cx + 45, cy + 5, 32, 38, -0.15, 0, 7); g.fill();
      g.beginPath(); g.moveTo(cx, cy + 40); g.lineTo(cx - 14, cy + 70); g.lineTo(cx + 14, cy + 70); g.closePath(); g.fill();
      for (let i = 0; i < 6; i++) g.fillRect(cx - 55 + i * 20, cy + 95, 4, 40);
    }),
    soldier: canvasTex(320, 500, (g, w, h) => {
      g.fillStyle = '#04040c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) blob(g, R() * w, R() * h, 40 + R() * 90, R() > 0.5 ? 'rgba(80,100,255,A)' : 'rgba(255,200,60,A)', 0.4);
      const cx = w / 2, top = 70;
      g.save(); g.shadowColor = '#ffc23a'; g.shadowBlur = 34; g.fillStyle = '#000';
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.ellipse(cx, top + 26, 30, 28, 0, Math.PI, 0); g.lineTo(cx + 34, top + 34); g.lineTo(cx - 34, top + 34); g.closePath(); g.fill(); // helmet
        g.beginPath(); g.arc(cx, top + 48, 20, 0, 7); g.fill();                                    // head
        g.fillRect(cx - 52, top + 70, 104, 150);                                                   // torso
        g.fillRect(cx - 50, top + 215, 44, 190); g.fillRect(cx + 6, top + 215, 44, 190);           // legs
        g.fillRect(cx - 60, top + 400, 54, 18); g.fillRect(cx + 6, top + 400, 54, 18);             // boots
        g.fillRect(cx - 72, top + 80, 24, 120); g.fillRect(cx + 48, top + 80, 24, 110);            // arms
        g.save(); g.translate(cx + 20, top + 160); g.rotate(-0.55); g.fillRect(-110, -9, 200, 18); g.fillRect(40, 9, 14, 34); g.restore(); // rifle
      }
      g.restore();
    }),
    floor: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#07060c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { g.fillStyle = ['#ff9a2a', '#5a6bff', '#ffd23a'][i % 3]; g.globalAlpha = 0.15 + R() * 0.3; g.beginPath(); g.arc(R() * w, R() * h, 0.8 + R() * 2.5, 0, 7); g.fill(); } }),
  };
  tex.floor.wrapS = tex.floor.wrapT = THREE.RepeatWrapping; tex.floor.repeat.set(12, 12);
  const paint = (t, k = 0.95) => new THREE.MeshStandardMaterial({ color: 0x0a0812, roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k });
  const M = {
    a: paint(tex.a), b: paint(tex.b, 0.8), skull: paint(tex.skull), soldier: paint(tex.soldier, 1.05),
    floor: paint(tex.floor, 0.5), dark: new THREE.MeshStandardMaterial({ color: 0x0b0914, roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xc9925a, roughness: 0.75, emissive: 0x4a2408, emissiveIntensity: 0.5 }),
    carpet: new THREE.MeshStandardMaterial({ color: 0x3a2a72, roughness: 1, emissive: 0x2a1060, emissiveIntensity: 0.55 }),
  };

  const world = new THREE.Group(); scene.add(world);
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); world.add(m); return m; };

  /* ---------- antechamber & entrance ---------- */
  const carpet = add(new THREE.PlaneGeometry(4, 6.2), M.carpet, 0, 0, 7.2); carpet.rotation.x = -Math.PI / 2;
  add(new THREE.BoxGeometry(0.2, 3.6, 6.2), M.dark, -2, 1.8, 7.2); add(new THREE.BoxGeometry(0.2, 3.6, 6.2), M.dark, 2, 1.8, 7.2);
  add(new THREE.BoxGeometry(2.7, 3.6, 0.2), M.dark, -2.7, 1.8, 4.0); add(new THREE.BoxGeometry(2.7, 3.6, 0.2), M.dark, 2.7, 1.8, 4.0);
  add(new THREE.BoxGeometry(2.7, 0.7, 0.2), M.dark, 0, 3.3, 4.0);
  const door = makeLaserDoor({ glowTex }); door.group.position.set(0, 0, 4.1); world.add(door.group);

  /* ---------- the maze (walls: w, d, x, z, material) ---------- */
  const floor = add(new THREE.PlaneGeometry(14, 16), M.floor, 0, 0, -3); floor.rotation.x = -Math.PI / 2;
  const ceil = add(new THREE.PlaneGeometry(14, 16), M.dark, 0, 3.6, -3); ceil.rotation.x = Math.PI / 2;
  const WALLS = [
    [0.14, 6.0, -1.1, 0.9, M.a], [0.14, 4.7, 1.1, 1.45, M.b],                         // corridor 1
    [2.84, 0.14, 2.45, -0.9, M.b], [3.0, 0.14, 2.3, -2.6, M.a], [0.14, 1.84, 3.8, -1.75, M.skull], // alcove A
    [0.44, 0.14, -0.95, -2.1, M.b],
    [0.14, 2.9, -0.8, -3.55, M.a], [0.14, 3.3, -0.8, -8.85, M.skull],                 // corridor 2, left
    [0.14, 5.4, 0.8, -5.3, M.b], [0.14, 0.6, 0.8, -10.2, M.a],                         // corridor 2, right
    [2.2, 0.14, -1.9, -5.0, M.b], [2.2, 0.14, -1.9, -7.2, M.a], [0.14, 2.2, -3.0, -6.1, M.b],    // alcove B
    [2.4, 0.14, 2.0, -8.0, M.a], [2.4, 0.14, 2.0, -9.9, M.b], [0.14, 1.9, 3.2, -8.95, M.a],      // alcove C
    [1.6, 0.14, 0, -10.5, M.soldier],                                                  // end mural
  ];
  const post = new THREE.BoxGeometry(0.09, WALL_H + 0.06, 0.09);
  for (const [w, d, x, z, mat] of WALLS) {
    add(new THREE.BoxGeometry(w, WALL_H, d), mat, x, WALL_H / 2, z);
    add(new THREE.BoxGeometry(w + 0.04, 0.08, d + 0.04), M.wood, x, WALL_H + 0.04, z);   // top cap
    const long = d > w;
    for (const s of [-1, 1]) add(post, M.wood, long ? x : x + s * w / 2, (WALL_H + 0.06) / 2, long ? z + s * d / 2 : z);
  }
  // light-wood rafters across the corridors
  const rafter = (len) => new THREE.BoxGeometry(len, 0.07, 0.11);
  for (let z = 3.4; z > -2.2; z -= 0.9) add(rafter(2.4), M.wood, 0, WALL_H + 0.1, z);
  for (let z = -2.6; z > -10.4; z -= 0.9) add(rafter(1.8), M.wood, 0, WALL_H + 0.1, z);

  /* ---------- light: blue UV tubes, warm spill, smoke ---------- */
  const tubeGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.3, 8);
  const tubeMat = neon(0x4f63ff);
  for (const [x, z, ry, rz] of [[-1.8, 2.5, 0.3, 1.2], [1.6, 0.5, -0.5, 1.4], [0, -3, 0, 1.57], [-1.5, -6, 0.8, 1.3], [1.4, -9, -0.4, 1.4], [3, -4, 1.2, 1.5], [-3, -2, -1, 1.5]]) {
    const t = add(tubeGeo, tubeMat, x, 3.45, z); t.rotation.set(0, ry, rz);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x3a4dff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.position.set(x, 3.4, z); s.scale.set(2.2, 1.2, 1); world.add(s);
  }
  scene.add(new THREE.HemisphereLight(0x3a4cff, 0x100818, 0.5));
  for (const [x, y, z, c, i] of [[0, 3.2, 1.5, 0x3a4dff, 5], [0, 3.2, -5, 0x3a4dff, 5], [0, 3.2, -9.5, 0x3a4dff, 4], [0, 2.4, 3.0, 0xff7a2a, 5], [2.4, 2.4, -1.7, 0xff8a3a, 3], [-1.9, 2.4, -6.1, 0xff8a3a, 3], [2.0, 2.4, -8.9, 0xff8a3a, 3], [0, 2.3, -9.6, 0xffb040, 2.5]]) {
    const l = new THREE.PointLight(c, i, 7, 1.6); l.position.set(x, y, z); scene.add(l);
  }
  const smoke = [];
  for (let i = 0; i < (small ? 14 : 26); i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 3 ? 0xd98a5a : 0x8a7a9a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set((R() - 0.5) * 2, 0.4 + R() * 2.0, 3.6 - R() * 4.5); const sc = 1.2 + R() * 2.2; s.scale.set(sc, sc * 0.8, 1);
    world.add(s); smoke.push({ s, base: 0.06 + R() * 0.1, ph: R() * 6.28, x: s.position.x });
  }

  /* ---------- opponents (red team, vests with sensors) ---------- */
  const suit = new THREE.MeshStandardMaterial({ color: 0x241d33, roughness: 0.8 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x15111f, roughness: 0.6, emissive: RED, emissiveIntensity: 0.15 });
  const cap = (r, l, x, y, z, rx, rz, parent) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), suit); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); parent.add(m); return m; };
  function opponent(x, z, faceX, faceZ) {
    const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
    const body = new THREE.Group(); g.add(body);
    cap(0.085, 0.62, -0.1, 0.42, 0, 0, 0, body); cap(0.085, 0.62, 0.1, 0.42, 0, 0, 0, body);
    cap(0.19, 0.42, 0, 1.2, 0, 0, 0, body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), suit); head.position.set(0, 1.66, 0); body.add(head);
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.32), vestMat); vest.position.set(0, 1.28, 0); body.add(vest);
    cap(0.055, 0.38, -0.24, 1.25, 0.16, -1.2, 0.2, body); cap(0.055, 0.38, 0.24, 1.25, 0.16, -1.2, -0.2, body);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.4), suit); gun.position.set(0.06, 1.24, 0.38); body.add(gun);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), neon(RED)); tip.position.set(0.06, 1.25, 0.6); body.add(tip);
    const sMat = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false });
    const sensors = [[0, 1.36, 0.17], [-0.2, 1.52, 0.06], [0.2, 1.52, 0.06], [0, 1.36, -0.17], [0, 1.74, 0.09]].map(([sx, sy, sz]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), sMat); s.position.set(sx, sy, sz); body.add(s); return s; });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: RED, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    halo.position.set(0, 1.4, 0.2); halo.scale.set(0.9, 0.9, 1); body.add(halo);
    g.lookAt(faceX, 0, faceZ);
    const chest = new THREE.Vector3();
    return { g, body, sMat, halo, chest: () => sensors[0].getWorldPosition(chest) };
  }
  const CAM_A = V(0.4, 1.58, -1.2), CAM_B = V(0.3, 1.56, -5.2), CAM_C = V(-0.3, 1.55, -8.4);
  const foes = [opponent(3.0, -1.75, CAM_A.x, CAM_A.z), opponent(-2.5, -6.1, CAM_B.x, CAM_B.z), opponent(2.45, -8.95, CAM_C.x, CAM_C.z)];
  world.updateMatrixWorld(true);
  const AIM = foes.map((f) => f.chest().clone());

  /* ---------- the player's laser blaster (venue model, first person) ---------- */
  const blaster = makeGenesisGun({ team: GREEN });
  const gun = blaster.group; camera.add(gun);
  const muzzle = blaster.muzzle;
  const GUN_REST = V(0.2, -0.2, -0.46);
  gun.position.copy(GUN_REST); gun.rotation.set(0.04, 0.1, 0);
  const gunLight = new THREE.PointLight(GREEN, 0, 1.2, 2); camera.add(gunLight); gunLight.position.set(0.2, -0.12, -0.7);
  const fill = new THREE.PointLight(0x9a7cff, 0.6, 1.2, 2); camera.add(fill); fill.position.set(0.05, 0.1, -0.2); // UV spill on the gun

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
        impact.position.copy(b); impact.scale.setScalar(0.6 * k); impact.material.opacity = 0.6 * k;
      },
    };
  }
  const shots = [0.465, 0.61, 0.755].map((p, i) => ({ p, foe: i, b: beam(GREEN) }));
  const enemyShot = { p: 0.705, b: beam(RED) };   // opponent C fires first and grazes us

  /* ---------- camera choreography ---------- */
  const at = (i) => () => AIM[i];
  const K = [
    { p: 0.0, pos: () => V(0, 1.62, 8.8), look: () => V(0, 1.55, 4.1), fov: 55 },
    { p: 0.1, pos: () => V(0, 1.62, 6.8), look: () => V(0, 1.5, 4.1), fov: 55 },
    { p: 0.22, pos: () => V(0, 1.6, 4.6), look: () => V(0, 1.4, -3), fov: 60 },
    { p: 0.32, pos: () => V(0, 1.6, 1.4), look: () => V(0.3, 1.5, -6), fov: 60 },
    { p: 0.4, pos: () => CAM_A, look: at(0), fov: 50 },
    { p: 0.5, pos: () => CAM_A, look: at(0), fov: 50 },
    { p: 0.55, pos: () => CAM_B, look: at(1), fov: 50 },
    { p: 0.65, pos: () => CAM_B, look: at(1), fov: 50 },
    { p: 0.69, pos: () => CAM_C, look: at(2), fov: 48 },
    { p: 0.79, pos: () => CAM_C, look: at(2), fov: 48 },
    { p: 0.86, pos: () => V(0, 1.55, -7.9), look: () => V(0, 1.25, -10.5), fov: 52 },
    { p: 1.0, pos: () => V(0, 7.2, 1.8), look: () => V(0, 0, -5), fov: 55 },
  ];

  const a = new THREE.Vector3(), white = new THREE.Color(0xffffff), red = new THREE.Color(RED);
  function update(p, time, pointer) {
    door.setOpen(sstep(0.08, 0.22, p));
    const smokeK = sstep(0.1, 0.2, p) * (1 - 0.6 * sstep(0.4, 0.6, p));
    smoke.forEach((m, i) => { m.s.material.opacity = m.base * smokeK; m.s.position.x = m.x + Math.sin(time * 0.3 + m.ph) * 0.15; m.s.material.rotation = time * 0.05 * (i % 2 ? 1 : -1); });

    rigCamera(camera, K, p, time, pointer, 0.5);
    const walk = sstep(0.1, 0.16, p) * (1 - sstep(0.36, 0.42, p)) + sstep(0.5, 0.52, p) * (1 - sstep(0.54, 0.56, p)) + sstep(0.65, 0.66, p) * (1 - sstep(0.68, 0.69, p));
    const lower = sstep(0.87, 0.95, p);
    let kick = 0;
    for (const s of shots) kick = Math.max(kick, Math.exp(-Math.pow((p - s.p - 0.004) / 0.008, 2)));
    gun.position.set(GUN_REST.x, GUN_REST.y - lower * 0.5 + Math.sin(p * 160) * 0.012 * walk, GUN_REST.z + kick * 0.06);
    gun.rotation.x = 0.02 + kick * 0.16 + Math.sin(p * 80) * 0.02 * walk;
    gunLight.intensity = kick * 1.5;
    blaster.setGlow(kick);
    camera.updateMatrixWorld(true);
    muzzle.getWorldPosition(a);

    shots.forEach((s) => {
      const k = sstep(s.p - 0.002, s.p + 0.003, p) * (1 - sstep(s.p + 0.012, s.p + 0.026, p));
      s.b.set(a.clone(), AIM[s.foe], k);
    });
    const ek = sstep(enemyShot.p - 0.002, enemyShot.p + 0.003, p) * (1 - sstep(enemyShot.p + 0.012, enemyShot.p + 0.024, p));
    enemyShot.b.set(foes[2].body.localToWorld(V(0.06, 1.25, 0.6)), camera.position.clone().add(V(-0.5, 0.15, 0.6)), ek);

    foes.forEach((f, i) => {
      const sp = shots[i].p;
      const hit = sstep(sp + 0.004, sp + 0.008, p);
      const flash = Math.exp(-Math.pow((p - sp - 0.012) / 0.012, 2));
      const blink = hit ? 0.35 + 0.65 * (Math.sin(time * 14 + i) > 0 ? 1 : 0) : 1;   // a hit vest "dies" and blinks
      f.sMat.color.copy(red).multiplyScalar(blink).lerp(white, flash);
      f.halo.material.opacity = 0.55 * blink + 0.5 * flash;
      f.halo.material.color.copy(red).lerp(white, flash);
      f.halo.scale.setScalar(0.8 + flash * 0.8);
      f.body.rotation.x = -0.22 * hit * (0.6 + 0.4 * Math.exp(-(p - sp) * 30));
    });
  }

  return { scene, camera, update, bloom: { strength: 0.45, radius: 0.45, threshold: 0.85 } };
}
