/* Shared helpers for the 3D stages. */
import * as THREE from '../../vendor/three/three.module.min.js';
export { THREE };
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function glowTextures() {
  const glow = canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  const line = canvasTex(64, 4, (g, w, h) => {
    const r = g.createLinearGradient(0, 0, w, 0);
    r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(0.5, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  return { glow, line };
}
export const neon = (hex, op = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });

/* Keyframed camera: piecewise eased interpolation between keys {p,pos(),look(),fov}. */
const _look = new THREE.Vector3();
export function rigCamera(camera, K, p, time, pointer, sway = 1) {
  let i = 0; while (i < K.length - 2 && p > K[i + 1].p) i++;
  const a = K[i], b = K[i + 1], t = easeIO(clamp((p - a.p) / (b.p - a.p)));
  camera.position.copy(a.pos()).lerp(b.pos(), t);
  _look.copy(a.look()).lerp(b.look(), t);
  camera.position.x += pointer.x * 0.12 * sway; camera.position.y -= pointer.y * 0.06 * sway;
  camera.position.y += Math.sin(time * 0.6) * 0.008;
  camera.lookAt(_look);
  camera.fov = (a.fov + (b.fov - a.fov) * t) * (camera.aspect < 1 ? 1.5 : 1);
  camera.updateProjectionMatrix();
}
