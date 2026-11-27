/* =====================================================================
   Boot for the scroll-driven 3D film:
     scene 1 — bowling (assets/js/xp/bowling.js)
     scene 2 — laser game in black light (assets/js/xp/laser.js)
   Scene 2 is built only when the visitor approaches it.
   Static mode (reduced motion / user switch / no WebGL): one still each.
   ===================================================================== */
import { runStage } from './xp/stage.js';

const docEl = document.documentElement;
const toStatic = () => { docEl.classList.remove('xp-live'); docEl.classList.add('xp-static'); };

const stages = [
  { sel: '#top', load: () => import('./xp/bowling.js').then((m) => m.buildBowling), stillP: 0.5 },
  { sel: '#arene', load: () => import('./xp/laser.js').then((m) => m.buildLaser), stillP: 0.478 },
];

async function start(st) {
  const section = document.querySelector(st.sel);
  if (!section || st.started) return;
  st.started = true;
  try { await runStage({ section, build: await st.load(), stillP: st.stillP }); }
  catch (e) { console.warn('[xp] scene disabled:', e); section.classList.add('is-failed'); if (st === stages[0]) toStatic(); }
}

start(stages[0]).then(() => {
  const second = document.querySelector(stages[1].sel);
  if (!second) return;
  if (docEl.classList.contains('xp-static') || !('IntersectionObserver' in window)) { start(stages[1]); return; }
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); start(stages[1]); } }, { rootMargin: '150% 0px' });
  io.observe(second);
});
