/* =====================================================================
   Stage — the shared machinery behind every scroll-driven 3D scene:
   renderer + cinematic post-processing, sizing, HTML chapters synced to
   progress, HUD, render loop.

   Image quality ("as close to 4K as the device allows"):
   • renders at the screen's native density — up to 2× CSS pixels, i.e.
     3840 px wide on a 4K display (`?q=4k` forces a 3840-px-wide render)
   • HDR (half-float) pipeline, 4× MSAA, bloom on neons / UV / lasers,
     ACES tone mapping, 2× texture density, real shadows (desktop)
   • dynamic resolution: if frames get slow the render scale drops a
     notch (and climbs back when there is headroom) so motion stays fluid

   Scroll is never hijacked: progress follows native scroll with damping,
   and snaps when the page jumps (tabs, search, skip link) so a scene is
   never "replayed" at high speed. Rendering stops off-screen.
   ===================================================================== */
import { THREE, clamp, sstep, setTextureQuality } from './util.js';
import { EffectComposer } from '../../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../../vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../../vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../../vendor/three/addons/postprocessing/OutputPass.js';

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
let pointerBound = false;

function qualityProfile(small) {
  const dpr = window.devicePixelRatio || 1;
  const force4k = /[?&]q=4k\b/.test(location.search);
  const q = small
    ? { maxPR: Math.min(dpr, 1.6), minPR: 0.7, msaa: 0, tex: 1, shadows: false }
    : { maxPR: Math.min(Math.max(dpr, 1), 2), minPR: 0.75, msaa: 4, tex: 2, shadows: true };
  if (force4k) { q.maxPR = Math.max(q.maxPR, 3840 / Math.max(innerWidth, 1)); q.minPR = q.maxPR; q.tex = 2; }
  return q;
}

export async function runStage({ section, build, stillP = 0.5 }) {
  const docEl = document.documentElement;
  const canvas = section.querySelector('.xp-canvas');
  const small = matchMedia('(max-width: 700px)').matches || matchMedia('(pointer: coarse)').matches;
  const isStatic = docEl.classList.contains('xp-static');
  if (!pointerBound && !small) {
    pointerBound = true;
    window.addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  }

  const Q = qualityProfile(small);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
  let pr = Q.maxPR;
  renderer.setPixelRatio(pr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x040506, 1);
  renderer.shadowMap.enabled = Q.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  setTextureQuality({ scale: Q.tex, max: renderer.capabilities.maxTextureSize, aniso: renderer.capabilities.getMaxAnisotropy() });

  const { scene, camera, update, bloom: B = {}, anchors = {} } = await build({ renderer, small, quality: Q });

  /* post-processing: HDR target + MSAA → bloom → tone mapping / sRGB */
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: Q.msaa });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), B.strength ?? 0.55, B.radius ?? 0.5, B.threshold ?? 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* chapters & HUD */
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
  /* comic-book bubbles: shown inside their progress window, pinned to a 3D anchor */
  const bubbles = [...section.querySelectorAll('.bd[data-bubble]')].map((el) => ({ el, id: el.dataset.bubble, from: +el.dataset.from, to: +el.dataset.to, on: false }));
  const proj = new THREE.Vector3();
  function updateBubbles(p) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const b of bubbles) {
      const on = p >= b.from && p <= b.to && !!anchors[b.id];
      if (on !== b.on) { b.on = on; b.h = 0; b.el.classList.toggle('is-on', on); }   // re-adding the class replays the pop
      if (!on) continue;
      proj.copy(anchors[b.id]()).project(camera);
      if (proj.z > 1) { b.el.style.opacity = '0'; continue; }
      b.el.style.opacity = '';
      if (!b.h) b.h = b.el.firstElementChild.offsetHeight + 24;              // bubbles grow upwards from their anchor
      const top = Math.max(90, (document.querySelector('header.nav') || {}).offsetHeight || 0) + 12;
      const x = clamp((proj.x * 0.5 + 0.5) * w, 100, w - 100), y = clamp((-proj.y * 0.5 + 0.5) * h, top + b.h, h - 40);
      b.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    }
  }
  const pill = section.querySelector('.xp-pill'), pillTxt = section.querySelector('.xp-status-txt');
  function paintStatus() {
    const s = window.App && window.App.status ? window.App.status() : null;
    if (!s || !pill || !pillTxt) return;
    pill.classList.remove('is-open', 'is-closed', 'is-maybe');
    pill.classList.add(s.state === 'open' ? 'is-open' : s.state === 'closed' ? 'is-closed' : 'is-maybe');
    pillTxt.textContent = s.state === 'open' ? 'Ouvert · ' + s.sub.split(' · ')[0] : s.state === 'closed' ? 'Fermé · ' + s.sub.split(' · ')[0].split(' (')[0] : 'Lundi : vacances scolaires';
  }
  paintStatus(); setInterval(paintStatus, 60000);

  /* sizing */
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  const renderStill = () => { update(stillP, 3, pointer); composer.render(); };
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (isStatic) renderStill(); }, 100); }, { passive: true });

  if (isStatic) { renderStill(); section.classList.add('is-ready'); return; }

  /* loop + dynamic resolution */
  const progressTarget = () => { const r = section.getBoundingClientRect(); const total = r.height - innerHeight; return total > 0 ? clamp(-r.top / total) : 0; };
  let prog = progressTarget(), last = performance.now(), visible = true, raf = 0, clock = 0;
  let ema = 16, sinceAdjust = 0;
  updateDOM(prog);
  function adaptResolution(dt) {
    ema += (dt * 1000 - ema) * 0.08;
    sinceAdjust += dt;
    if (sinceAdjust < 1) return;
    let next = pr;
    if (ema > 24 && pr > Q.minPR) next = Math.max(Q.minPR, pr * 0.85);
    else if (ema < 13 && pr < Q.maxPR) next = Math.min(Q.maxPR, pr * 1.1);
    if (Math.abs(next - pr) > 0.01) { pr = next; resize(); sinceAdjust = 0; }
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt;
    const tg = progressTarget();
    // a jump (tab, search result, skip link) lands directly: no fast replay of the film
    prog = Math.abs(tg - prog) > 0.15 ? tg : prog + (tg - prog) * (1 - Math.exp(-dt * 6));
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    adaptResolution(dt);          // resize *before* drawing: a resized canvas is cleared, never present it empty
    update(prog, clock, pointer);
    composer.render(dt);
    updateDOM(prog);
    updateBubbles(prog);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px' }).observe(section);
  document.addEventListener('visibilitychange', kick);
  update(prog, 0, pointer); renderer.compile(scene, camera); composer.render();
  section.classList.add('is-ready');
  kick();
}
