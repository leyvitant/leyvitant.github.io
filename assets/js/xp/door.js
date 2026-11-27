/* =====================================================================
   The real LASER GAME entrance, rebuilt in 3D: a sci-fi bulkhead frame
   with gold lettering, hazard-striped jambs and purple LEDs, and a door
   leaf airbrushed in fluorescent paint (galaxy vortex, planets, armoured
   green trooper). Shared by the bowling hall (end shot) and the arena.
   The leaf swings inwards on a hinge at its left edge: setOpen(0..1).
   ===================================================================== */
import { THREE, canvasTex, rng } from './util.js';

const W = 2.7, H = 2.95, DEPTH = 0.3;

function paintDoor() {
  const R = rng(77);
  return canvasTex(512, 800, (g, w, h) => {
    // deep space
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1a1150'); bg.addColorStop(0.5, '#241a78'); bg.addColorStop(1, '#120a3a');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // vortex: concentric glowing rings around an off-centre black hole
    const cx = w * 0.52, cy = h * 0.36;
    for (let i = 26; i > 0; i--) {
      const r = i * 15;
      g.strokeStyle = i % 2 ? 'rgba(120,150,255,.35)' : 'rgba(190,120,255,.25)';
      g.lineWidth = 7 + (i % 3) * 3;
      g.beginPath(); g.ellipse(cx, cy, r * 1.1, r * 0.78, -0.3, 0, Math.PI * 2); g.stroke();
    }
    const hole = g.createRadialGradient(cx, cy, 0, cx, cy, 70);
    hole.addColorStop(0, '#05030f'); hole.addColorStop(1, 'rgba(5,3,15,0)');
    g.fillStyle = hole; g.beginPath(); g.arc(cx, cy, 70, 0, 7); g.fill();
    // planets & debris (fluorescent)
    const cols = ['#ff5a3c', '#3fe0ff', '#ffe14a', '#ff4fd8', '#4a7bff', '#ff9a2a', '#7dff6a'];
    const planet = (x, y, r, c) => { const pg = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.25, c); pg.addColorStop(1, '#14082e'); g.fillStyle = pg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    for (let i = 0; i < 26; i++) planet(40 + R() * 200, 230 + R() * 120, 4 + R() * 14, cols[i % cols.length]);
    planet(30, 300, 70, '#ff7a3a'); planet(60, 420, 55, '#ffe14a');
    planet(150, 640, 40, '#ff5a3c'); planet(330, 690, 60, '#3f7bff'); planet(80, 720, 75, '#ffe14a'); planet(450, 600, 34, '#ff4fd8');
    for (let i = 0; i < 160; i++) { g.fillStyle = cols[Math.floor(R() * cols.length)]; g.globalAlpha = 0.5 + R() * 0.5; g.fillRect(R() * w, R() * h, 2, 2); }
    g.globalAlpha = 1;
    // armoured green trooper on the right, holding a violet blaster
    g.save(); g.translate(w * 0.74, h * 0.16); g.lineJoin = 'round';
    const green = '#86ff3c', dark = '#102010';
    const part = (pts, fill) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = dark; g.lineWidth = 4; g.stroke(); };
    g.shadowColor = '#86ff3c'; g.shadowBlur = 14;
    g.beginPath(); g.ellipse(0, 20, 34, 42, 0, 0, 7); g.fillStyle = green; g.fill(); g.shadowBlur = 0; g.strokeStyle = dark; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#2a0a3a'; g.fillRect(-6, 0, 12, 30); g.fillStyle = '#ff2a6a'; g.beginPath(); g.arc(0, 14, 5, 0, 7); g.fill();
    part([-46, 70, 46, 70, 56, 200, 30, 260, -30, 260, -56, 200], green);   // torso
    g.strokeStyle = '#3a2a7a'; g.lineWidth = 9; g.beginPath(); g.moveTo(-30, 70); g.lineTo(10, 250); g.moveTo(30, 70); g.lineTo(-10, 250); g.stroke();
    for (const [x, y, c] of [[-14, 120, '#ff4fd8'], [14, 120, '#3fe0ff'], [0, 170, '#ffe14a']]) { g.fillStyle = c; g.fillRect(x - 8, y - 8, 16, 16); }
    part([-30, 255, -6, 255, -14, 400, -24, 470, -50, 470, -40, 400], green); // legs
    part([30, 255, 6, 255, 14, 400, 24, 470, 50, 470, 40, 400], green);
    part([-56, 80, -40, 80, -60, 200, -82, 210], green); part([56, 80, 40, 80, 20, 190, 0, 200], green); // arms
    g.fillStyle = '#6a4bd8'; g.strokeStyle = dark; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-150, 205); g.lineTo(30, 175); g.lineTo(34, 200); g.lineTo(-146, 232); g.closePath(); g.fill(); g.stroke();
    g.restore();
    // grab handle
    g.strokeStyle = '#e8c870'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(270, 560); g.lineTo(335, 450); g.stroke();
  });
}

function stripeTex(c2) {
  return canvasTex(32, 256, (g, w, h) => {
    g.fillStyle = '#0b0a10'; g.fillRect(0, 0, w, h);
    g.fillStyle = c2;
    for (let y = -w; y < h + w; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y - 14); g.lineTo(w, y - 3); g.lineTo(0, y + 11); g.closePath(); g.fill(); }
  });
}

export function makeLaserDoor({ glowTex }) {
  const group = new THREE.Group();

  // bulkhead frame: rectangle with a stepped, chamfered opening
  const outer = new THREE.Shape();
  outer.moveTo(-W / 2, 0); outer.lineTo(W / 2, 0); outer.lineTo(W / 2, H); outer.lineTo(-W / 2, H); outer.closePath();
  const o = [[-0.74, 0], [-0.74, 0.55], [-0.86, 0.72], [-0.86, 1.55], [-0.74, 1.72], [-0.74, 2.2], [-0.56, 2.38]];
  const hole = new THREE.Path();
  const pts = o.concat(o.slice().reverse().map(([x, y]) => [-x, y]));
  hole.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => hole.lineTo(x, y)); hole.closePath();
  outer.holes.push(hole);
  const frameGeo = new THREE.ExtrudeGeometry(outer, { depth: DEPTH, bevelEnabled: false });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xa79fb5, roughness: 0.7, emissive: 0x2a1650, emissiveIntensity: 0.6 });
  const frame = new THREE.Mesh(frameGeo, frameMat); frame.position.z = -DEPTH; group.add(frame);

  // gold "LASER GAME" lettering on the lintel
  const title = canvasTex(1024, 160, (g, w, h) => {
    g.font = '800 104px Syne, "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText('LASER GAME').width, sc = Math.min(1, (w - 40) / tw);
    g.setTransform(sc, 0, 0, sc, w / 2 * (1 - sc), h / 2 * (1 - sc));
    g.lineWidth = 10; g.strokeStyle = '#3a2408'; g.strokeText('LASER GAME', w / 2, h / 2);
    const gold = g.createLinearGradient(0, h * 0.2, 0, h * 0.8); gold.addColorStop(0, '#ffe08a'); gold.addColorStop(1, '#c98a1c');
    g.fillStyle = gold; g.fillText('LASER GAME', w / 2, h / 2);
  });
  const lint = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.3), new THREE.MeshStandardMaterial({ map: title, transparent: true, roughness: 0.5, emissive: 0xffc04a, emissiveMap: title, emissiveIntensity: 0.35 }));
  lint.position.set(0, 2.66, 0.005); group.add(lint);

  // hazard stripes along the jambs (yellow below, pink above)
  const yel = stripeTex('#f2c21b'), pink = stripeTex('#ff4f9a');
  for (const s of [-1, 1]) {
    for (const [y0, y1, tex, x] of [[0.05, 0.55, yel, 0.79], [0.72, 1.55, pink, 0.91], [1.72, 2.25, pink, 0.79]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09, y1 - y0), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 }));
      m.position.set(s * x, (y0 + y1) / 2, 0.006); group.add(m);
    }
  }

  // purple LED spots on the frame
  for (const s of [-1, 1]) for (const y of [0.9, 1.55, 2.2]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xb04dff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    sp.position.set(s * 1.12, y, 0.05); sp.scale.set(0.45, 0.45, 1); group.add(sp);
  }
  const ledLight = new THREE.PointLight(0x9a4dff, 2.2, 3.5, 2); ledLight.position.set(0, 1.4, 0.8); group.add(ledLight);

  // the painted door leaf on its hinge
  const hinge = new THREE.Group(); hinge.position.set(-0.74, 0, -0.12); group.add(hinge);
  const art = paintDoor();
  const edge = new THREE.MeshStandardMaterial({ color: 0x1b1630, roughness: 0.8 });
  const face = new THREE.MeshStandardMaterial({ color: 0x0c0a18, roughness: 0.85, emissive: 0xffffff, emissiveMap: art, emissiveIntensity: 0.85 });
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.48, 2.36, 0.05), [edge, edge, edge, edge, face, face]);
  leaf.position.set(0.74, 1.18, 0); hinge.add(leaf);

  return { group, setOpen(k) { hinge.rotation.y = k * 1.45; } };
}
