/* =====================================================================
   Stage — the shared machinery behind every scroll-driven 3D scene:
   renderer, sizing, HTML chapters synced to progress, HUD, render loop.
   Scroll is never hijacked: progress follows native scroll with damping,
   and snaps when the page jumps (tabs, search, skip link) so a scene is
   never "replayed" at high speed. Rendering stops off-screen.
   ===================================================================== */
import { THREE, clamp, sstep } from './util.js';

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
let pointerBound = false;

export async function runStage({ section, build, stillP = 0.5 }) {
  const docEl = document.documentElement;
  const canvas = section.querySelector('.xp-canvas');
  const small = matchMedia('(max-width: 700px)').matches || matchMedia('(pointer: coarse)').matches;
  const isStatic = docEl.classList.contains('xp-static');
  if (!pointerBound && !small) {
    pointerBound = true;
    window.addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.3 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x040506, 1);

  const { scene, camera, update } = await build({ renderer, small });

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
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  const renderStill = () => { update(stillP, 3, pointer); renderer.render(scene, camera); };
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (isStatic) renderStill(); }, 100); }, { passive: true });

  if (isStatic) { renderStill(); section.classList.add('is-ready'); return; }

  /* loop */
  const target = () => { const r = section.getBoundingClientRect(); const total = r.height - innerHeight; return total > 0 ? clamp(-r.top / total) : 0; };
  let prog = target(), last = performance.now(), visible = true, raf = 0, clock = 0;
  updateDOM(prog);
  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05); last = now; clock += dt;
    const tg = target();
    // a jump (tab, search result, skip link) lands directly: no fast replay of the film
    prog = Math.abs(tg - prog) > 0.15 ? tg : prog + (tg - prog) * (1 - Math.exp(-dt * 6));
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    update(prog, clock, pointer);
    renderer.render(scene, camera);
    updateDOM(prog);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px' }).observe(section);
  document.addEventListener('visibilitychange', kick);
  update(prog, 0, pointer); renderer.compile(scene, camera); renderer.render(scene, camera);
  section.classList.add('is-ready');
  kick();
}
