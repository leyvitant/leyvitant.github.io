/* =====================================================================
   The venue's laser blaster, modelled from photos (side, three-quarter,
   rear): long matte-black body with a wedge-shaped upper slide, a ribbed
   translucent light bar on the top front in the team colour, three
   slanted side windows, a grey frame sight, a two-tier dark-grey nose
   with a round side button, angled grip with its cable to the vest, and
   the rear display the player reads while playing.
   Built from extruded side profiles (no model file to download).
   Local axes: -Z forward, +Y up, origin at the top of the grip.
   ===================================================================== */
import { THREE, canvasTex } from './util.js';

function profile(points, thickness, mat, bevel = 0.003) {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]); points.slice(1).forEach(([u, v]) => s.lineTo(u, v)); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thickness - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(thickness - bevel * 2) / 2);
  g.rotateY(Math.PI / 2);                        // profile u (forward) → -Z, thickness → X
  return new THREE.Mesh(g, mat);
}

export function makeGenesisGun({ team = 0x39ff6a } = {}) {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.55, metalness: 0.15 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x3b3b47, roughness: 0.65, metalness: 0.1 });
  const teamCol = new THREE.Color(team);

  // body: wedge-shaped upper slide + lower receiver
  group.add(profile([[-0.24, 0.006], [-0.05, 0.062], [0.17, 0.07], [0.19, 0.064], [0.19, 0], [-0.2, -0.004]], 0.046, body));
  group.add(profile([[-0.18, -0.002], [0.2, -0.002], [0.21, -0.052], [0, -0.06], [-0.12, -0.05], [-0.16, -0.028]], 0.042, body));
  // two-tier nose in dark grey
  group.add(profile([[0.185, 0], [0.185, 0.068], [0.258, 0.062], [0.276, 0.04], [0.272, 0]], 0.05, grey, 0.004));
  group.add(profile([[0.2, -0.004], [0.266, -0.004], [0.262, -0.048], [0.21, -0.056]], 0.046, grey, 0.004));
  // grip (angled back), trigger guard, trigger
  group.add(profile([[-0.105, -0.045], [-0.045, -0.045], [-0.085, -0.2], [-0.15, -0.2]], 0.036, body, 0.005));
  const guard = new THREE.Shape();
  [[-0.045, -0.05], [0.06, -0.05], [0.06, -0.09], [0.045, -0.106], [-0.06, -0.106]].forEach(([u, v], i) => (i ? guard.lineTo(u, v) : guard.moveTo(u, v)));
  const hole = new THREE.Path();
  [[-0.035, -0.058], [0.05, -0.058], [0.05, -0.086], [0.04, -0.096], [-0.045, -0.096]].forEach(([u, v], i) => (i ? hole.lineTo(u, v) : hole.moveTo(u, v)));
  guard.holes.push(hole);
  const gg = new THREE.ExtrudeGeometry(guard, { depth: 0.012, bevelEnabled: false }); gg.translate(0, 0, -0.006); gg.rotateY(Math.PI / 2);
  group.add(new THREE.Mesh(gg, body));
  const trig = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.012), grey); trig.position.set(0, -0.072, 0.0); trig.rotation.x = 0.35; group.add(trig);

  // ribbed translucent light bar (team colour) + LED strip underneath
  const ribs = canvasTex(256, 32, (g, w, h) => {
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 22) { g.fillStyle = '#ffffff'; g.fillRect(x, 0, 14, h); g.fillStyle = '#5a5a5a'; g.fillRect(x + 14, 0, 2, h); }
    g.fillStyle = '#ffffff'; g.fillRect(0, h - 5, w, 5);
  });
  const barMat = new THREE.MeshStandardMaterial({ color: 0x0a140c, emissive: teamCol, emissiveMap: ribs, emissiveIntensity: 1.4, roughness: 0.15, transparent: true, opacity: 0.92 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.034, 0.15), barMat); bar.position.set(0, 0.046, -0.1); group.add(bar);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.004, 0.15), new THREE.MeshBasicMaterial({ color: teamCol, toneMapped: false }));
  led.position.set(0, 0.03, -0.1); group.add(led);

  // three slanted side windows (both sides)
  const winMat = new THREE.MeshBasicMaterial({ color: teamCol, toneMapped: false, side: THREE.DoubleSide });
  const ws = new THREE.Shape(); ws.moveTo(0, 0); ws.lineTo(0.022, 0); ws.lineTo(0.03, 0.026); ws.lineTo(0.008, 0.026); ws.closePath();
  const wg = new THREE.ShapeGeometry(ws); wg.rotateY(Math.PI / 2);
  for (const side of [-1, 1]) for (const u of [-0.078, -0.048, -0.018]) {
    const m = new THREE.Mesh(wg, winMat); m.position.set(side * 0.0235, 0.018, -u); group.add(m);
  }

  // grey frame sight on top
  for (const s of [-1, 1]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.032, 0.07), grey); pl.position.set(s * 0.018, 0.068, 0.085); pl.rotation.x = -0.12; group.add(pl); }
  const sightTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, 0.03), grey); sightTop.position.set(0, 0.085, 0.06); group.add(sightTop);

  // rear display (what the player reads: team, hits, score)
  const hud = canvasTex(160, 256, (g, w, h) => {
    g.fillStyle = '#020804'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#39ff6a'; g.font = '700 34px Inter, Arial, sans-serif'; g.textAlign = 'center';
    g.fillText('2 450', w / 2, 70); g.font = '600 20px Inter, Arial, sans-serif'; g.fillText('SCORE', w / 2, 30);
    for (let i = 0; i < 5; i++) { g.globalAlpha = i < 4 ? 1 : 0.25; g.fillRect(20 + i * 25, 110, 20, 40); }
    g.globalAlpha = 1; g.fillText('VIE', w / 2, 180); g.fillText('×12', w / 2, 230);
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.09), new THREE.MeshBasicMaterial({ map: hud, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2 + 0.29; screen.position.set(0, 0.028, 0.15); group.add(screen);

  // details: grip grooves on the lower front, side button, gold-outlined plate
  const groove = new THREE.MeshStandardMaterial({ color: 0x08080c, roughness: 0.9 });
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) { const gr = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.034, 0.004), groove); gr.position.set(s * 0.0215, -0.03, -(0.06 + k * 0.022)); gr.rotation.x = 0.45; group.add(gr); }
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.006, 20), grey); btn.rotation.z = Math.PI / 2; btn.position.set(s * 0.025, -0.018, -0.2); group.add(btn);
    const plate = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-0.05, -0.04], [0.05, -0.04], [0.06, -0.012], [-0.05, -0.012]].map(([u, v]) => new THREE.Vector3(s * 0.0215, v, -u))), new THREE.LineBasicMaterial({ color: 0xd8a23a }));
    group.add(plate);
  }

  // cable from the grip down to the vest
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.2, 0.14), new THREE.Vector3(0.01, -0.3, 0.2), new THREE.Vector3(-0.04, -0.45, 0.32)]), 20, 0.008, 8), new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.6 }));
  group.add(cable);

  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.03, -0.28); group.add(muzzle);
  group.traverse((o) => { if (o.isMesh) o.castShadow = false; });

  return {
    group, muzzle,
    setGlow(k) { barMat.emissiveIntensity = 1.4 + k * 2.2; },
  };
}
