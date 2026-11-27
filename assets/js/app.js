/* =====================================================================
   App — tabs + hash routing, live opening status (Europe/Paris),
   today highlights, offer filters, micro-interactions, contact form.
   ===================================================================== */
(function () {
  'use strict';
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function motionOK() { return !mqReduce.matches && !document.body.classList.contains('motion-off'); }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var tabs = $$('.tab');
  var tabsBar = $('.tabs');
  var indicator = $('.tab-indicator');
  var PANELS = tabs.map(function (t) { return t.dataset.tab; });
  var current = ($('.panel.active') || {}).id || 'activites';

  /* ---------- Paris clock & opening hours ---------- */
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  // [open, close] in hours; close > 24 means after midnight. Monday: school holidays only.
  var HOURS = { 0: [14, 24], 1: [14, 19], 2: [14, 25], 3: [14, 25], 4: [14, 25], 5: [14, 26], 6: [14, 26] };
  function parisNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { d: d, h: (+o.hour % 24) + (+o.minute) / 60 };
    } catch (e) { var n = new Date(); return { d: n.getDay(), h: n.getHours() + n.getMinutes() / 60 }; }
  }
  // the "service day": 0h30 on Saturday still belongs to Friday night
  function serviceDay() { var n = parisNow(), y = (n.d + 6) % 7, c = HOURS[y][1]; return (y !== 1 && c > 24 && n.h < c - 24) ? y : n.d; }
  function fmtH(h) { return (h % 24) + 'h00'; }
  function computeStatus() {
    var n = parisNow(), d = n.d, h = n.h, y = (d + 6) % 7;
    var yc = HOURS[y][1];
    if (yc > 24 && h < yc - 24 && y !== 1) return { state: 'open', title: 'Ouvert maintenant', sub: 'jusqu\'à ' + fmtH(yc) + ' · ' + DAYS[y] + ' soir' };
    var t = HOURS[d];
    if (d === 1) {
      if (h < 19) return { state: 'maybe', title: 'Lundi : vacances scolaires uniquement', sub: 'ouvert 14h00 – 19h00 pendant les vacances · sinon dès mardi 14h00' };
      return { state: 'closed', title: 'Fermé', sub: 'réouverture mardi à 14h00' };
    }
    if (h < t[0]) return { state: 'closed', title: 'Fermé', sub: 'ouvre aujourd\'hui à 14h00 · jusqu\'à ' + fmtH(t[1]) };
    if (h < t[1]) return { state: 'open', title: 'Ouvert maintenant', sub: 'jusqu\'à ' + fmtH(t[1]) + ' · aujourd\'hui 14h00 – ' + fmtH(t[1]) };
    var nd = (d + 1) % 7;
    return { state: 'closed', title: 'Fermé', sub: nd === 1 ? 'réouverture mardi à 14h00 (lundi : vacances scolaires uniquement)' : 'réouverture demain à 14h00' };
  }
  function statusHTML(s) {
    var cls = s.state === 'open' ? 'is-open' : s.state === 'closed' ? 'is-closed' : 'is-maybe';
    return '<span class="status ' + cls + '">' + s.title + '</span><small class="ess-sub">' + s.sub + '</small>';
  }
  function paintToday() {
    var el = $('#open-status');
    if (el) el.innerHTML = statusHTML(computeStatus());
    var sd = String(serviceDay());
    $$('table.tarifs tbody tr').forEach(function (tr) { tr.classList.toggle('is-today', tr.dataset.day === sd); });
    $$('.hours li[data-days]').forEach(function (li) { li.classList.toggle('is-today', li.dataset.days.split(' ').indexOf(sd) !== -1); });
    $$('#offres .card[data-days]').forEach(function (c) {
      var on = c.dataset.days.split(' ').indexOf(sd) !== -1;
      c.classList.toggle('is-today', on);
      var b = c.querySelector('.today-badge');
      if (on && !b) { b = document.createElement('span'); b.className = 'today-badge'; b.textContent = 'Aujourd\'hui'; c.appendChild(b); }
      if (!on && b) b.remove();
    });
  }

  /* answers used by the search palette */
  function hoursAnswerHTML() {
    var sd = String(serviceDay());
    var rows = $$('.hours li[data-days]').map(function (li) {
      var sp = li.querySelectorAll('span');
      var today = li.dataset.days.split(' ').indexOf(sd) !== -1;
      return '<tr' + (today ? ' class="is-today"' : '') + '><td>' + sp[0].textContent + (today ? ' · aujourd\'hui' : '') + '</td><td>' + sp[1].textContent + '</td></tr>';
    }).join('');
    return '<div class="ans-v">' + statusHTML(computeStatus()) + '</div><table>' + rows + '</table>';
  }
  function bowlingAnswerHTML() {
    var sd = serviceDay();
    var tr = $('table.tarifs tbody tr[data-day="' + sd + '"]');
    var line = '';
    if (tr) {
      var cells = $$('td', tr), ranges = [], cur = null;
      cells.forEach(function (td, i) {
        var v = td.textContent.trim();
        if (!v) { cur = null; return; }
        if (cur && cur.v === v) cur.to = 15 + i; else { cur = { v: v, from: 14 + i, to: 15 + i }; ranges.push(cur); }
      });
      line = ranges.map(function (r) { return '<b>' + r.v + ' €</b> de ' + (r.from % 24) + 'h à ' + (r.to % 24) + 'h'; }).join(' · ');
      line = 'Aujourd\'hui (' + DAYS[sd] + (sd === 1 ? ', vacances scolaires & été' : '') + ') : ' + line + '<br>';
    }
    return '<span class="ans-v">' + line + '5 € tarif réduit · 6 € intermédiaire · 7 € plein tarif, par partie et par personne selon l\'heure de début. Chaussures : <b>1 €</b>.</span>';
  }
  function todayDealsHTML() {
    var sd = String(serviceDay());
    var deals = $$('#offres .card[data-days]').filter(function (c) { return c.dataset.days.split(' ').indexOf(sd) !== -1; });
    if (!deals.length) return '<span class="ans-v">Pas de bon plan spécifique aujourd\'hui (' + DAYS[+sd] + '). Formules entreprises, groupes et anniversaires disponibles sur réservation au <a href="tel:+33233917677">02 33 91 76 77</a>.</span>';
    return '<span class="ans-v">' + deals.map(function (c) {
      var p = c.querySelector('.deal-price');
      return '<b>' + c.querySelector('h3').textContent + '</b> (' + c.querySelector('.day-tag').textContent + ') — ' + p.firstChild.textContent.trim();
    }).join('<br>') + '</span>';
  }

  /* ---------- Tabs ---------- */
  function moveIndicator(instant) {
    var t = $('.tab[aria-selected="true"]');
    if (!t || !indicator) return;
    if (instant) indicator.style.transition = 'none';
    indicator.style.width = t.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + t.offsetLeft + 'px)';
    if (instant) { void indicator.offsetWidth; indicator.style.transition = ''; }
    // keep the active tab visible on narrow screens without moving the page
    var l = t.offsetLeft - tabsBar.clientWidth / 2 + t.offsetWidth / 2;
    if (tabsBar.scrollWidth > tabsBar.clientWidth) tabsBar.scrollTo({ left: l, behavior: motionOK() ? 'smooth' : 'auto' });
  }

  function scrollToEl(el, offset) {
    var headerH = $('header.nav').offsetHeight;
    var y = el.getBoundingClientRect().top + window.scrollY - headerH - (offset || 8);
    window.scrollTo({ top: Math.max(0, y), behavior: motionOK() ? 'smooth' : 'auto' });
  }

  function showTab(id, opts) {
    opts = opts || {};
    if (PANELS.indexOf(id) === -1) id = 'activites';
    var prev = current;
    var panel = document.getElementById(id);
    if (id !== prev || !panel.classList.contains('active')) {
      $$('.panel').forEach(function (p) { p.classList.remove('active', 'is-entering'); });
      panel.classList.add('active');
      if (motionOK()) {
        $$('.reveal', panel).forEach(function (r, i) { r.style.setProperty('--i', i); });
        void panel.offsetWidth;
        panel.classList.add('is-entering');
        clearTimeout(panel._t); panel._t = setTimeout(function () { panel.classList.remove('is-entering'); }, 1400);
      }
      if (window.Marbles && prev !== id) window.Marbles.nudge(PANELS.indexOf(id) > PANELS.indexOf(prev) ? 1 : -1);
    }
    current = id;
    tabs.forEach(function (t) {
      var on = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    moveIndicator();
    if (!opts.fromPop) {
      var hash = '#' + id;
      if (location.hash !== hash) {
        try { history[opts.replace ? 'replaceState' : 'pushState'](null, '', hash); } catch (e) {}
      }
    }
    if (!opts.noScroll) scrollToEl(document.getElementById('panels'));
  }
  window.showTab = function (id) { showTab(id); };

  // WAI-ARIA tabs keyboard pattern
  if (tabsBar) tabsBar.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement); if (i < 0) return;
    var n = null;
    if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
    if (n === null) return;
    e.preventDefault(); tabs[n].focus(); showTab(tabs[n].dataset.tab);
  });

  /* ---------- Deep links: panel ids and inner blocks ---------- */
  function goTo(targetId, panelId, opts) {
    opts = opts || {};
    var el = document.getElementById(targetId);
    if (!panelId) { var p = el && el.closest('.panel'); panelId = p ? p.id : (PANELS.indexOf(targetId) !== -1 ? targetId : current); }
    showTab(panelId, { noScroll: true });
    if (opts.filter) applyFilter(opts.filter);
    requestAnimationFrame(function () {
      var dest = el && !el.classList.contains('panel') ? el : document.getElementById('panels');
      scrollToEl(dest, 16);
      if (dest !== document.getElementById('panels')) {
        if (!dest.hasAttribute('tabindex')) dest.setAttribute('tabindex', '-1');
        dest.focus({ preventScroll: true });
        dest.classList.remove('flash'); void dest.offsetWidth; dest.classList.add('flash');
        setTimeout(function () { dest.classList.remove('flash'); }, 1700);
      }
    });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-goto]');
    if (a) { e.preventDefault(); goTo(a.dataset.goto); }
  });
  function routeFromHash(initial) {
    var h = decodeURIComponent(location.hash.slice(1));
    if (!h) { if (!initial) showTab('activites', { fromPop: true, noScroll: true }); return; }
    if (PANELS.indexOf(h) !== -1) showTab(h, { fromPop: true });
    else if (h === 'top') window.scrollTo(0, 0);
    else { var el = document.getElementById(h); if (el && el.closest('.panel')) goTo(h); }
  }
  window.addEventListener('popstate', function () { routeFromHash(false); });

  /* ---------- Offer filters ---------- */
  var filterBtns = $$('.filter[data-filter]');
  function applyFilter(f) {
    var groups = $$('#offres .offer-group');
    var sd = String(serviceDay()), shown = 0;
    groups.forEach(function (g) {
      var cards = $$('.card', g), any = false;
      cards.forEach(function (c) {
        var vis = f === 'all' || f === g.dataset.group || (f === 'today' && c.dataset.days && c.dataset.days.split(' ').indexOf(sd) !== -1);
        c.hidden = !vis; if (vis) { any = true; shown++; }
      });
      g.hidden = !any;
    });
    var empty = $('#offres .filter-empty');
    if (empty) empty.hidden = shown !== 0;
    var cnt = $('#offres .filter-count');
    if (cnt) cnt.textContent = f === 'all' ? '' : shown + (shown > 1 ? ' offres' : ' offre');
    filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === f)); });
    var off = $('#offres');
    if (motionOK()) { off.classList.remove('is-filtering'); void off.offsetWidth; off.classList.add('is-filtering'); clearTimeout(off._f); off._f = setTimeout(function () { off.classList.remove('is-filtering'); }, 600); }
  }
  filterBtns.forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.dataset.filter); }); });
  var reset = $('[data-filter-reset]'); if (reset) reset.addEventListener('click', function () { applyFilter('all'); });

  /* ---------- Micro-interactions (fine pointers + motion only) ---------- */
  function setupPointerFX() {
    if (!finePointer.matches) return;
    $$('.magnetic').forEach(function (el) {
      var raf = 0;
      el.addEventListener('pointermove', function (e) {
        if (!motionOK()) return;
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.classList.add('is-pulled');
          el.style.transform = 'translate(' + (dx * 6).toFixed(2) + 'px,' + (dy * 5).toFixed(2) + 'px)';
        });
      });
      el.addEventListener('pointerleave', function () { cancelAnimationFrame(raf); el.classList.remove('is-pulled'); el.style.transform = ''; });
    });
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card');
      if (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    }, { passive: true });
    var bg = $('.hero-bg'), hero = $('.hero');
    if (bg && hero) hero.addEventListener('pointermove', function (e) {
      if (!motionOK()) return;
      var r = hero.getBoundingClientRect();
      bg.style.setProperty('--px', (((e.clientX - r.left) / r.width - 0.5) * -14).toFixed(1) + 'px');
      bg.style.setProperty('--py', (((e.clientY - r.top) / r.height - 0.5) * -14).toFixed(1) + 'px');
    }, { passive: true });
  }

  /* dim the marbles once the reader leaves the hero */
  var heroEl = $('.hero');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) { document.body.classList.toggle('is-deep', !ents[0].isIntersecting); }, { threshold: 0, rootMargin: '-35% 0px 0px 0px' }).observe(heroEl);
  }

  /* ---------- Motion toggle (WCAG 2.2.2 pause control) ---------- */
  var mt = $('#motion-toggle');
  function syncMotionUI() {
    var stored = null; try { stored = localStorage.getItem('bb-motion'); } catch (e) {}
    var off = stored === 'off';
    document.body.classList.toggle('motion-off', off || mqReduce.matches);
    if (!mt) return;
    var lbl = mt.querySelector('.mt-lbl');
    if (mqReduce.matches) { mt.disabled = true; mt.setAttribute('aria-pressed', 'true'); lbl.textContent = 'Animations réduites (réglage système)'; return; }
    mt.disabled = false;
    mt.setAttribute('aria-pressed', String(off));
    lbl.textContent = off ? 'Relancer les billes' : 'Mettre les billes en pause';
  }
  if (mt) mt.addEventListener('click', function () {
    var off = mt.getAttribute('aria-pressed') !== 'true';
    try { localStorage.setItem('bb-motion', off ? 'off' : 'on'); } catch (e) {}
    if (window.Marbles) window.Marbles.setEnabled(!off);
    syncMotionUI();
  });
  document.addEventListener('marbles:change', syncMotionUI);

  /* ---------- Contact form (unchanged behaviour: opens the mail client) ---------- */
  window.sendMail = function (e) {
    e.preventDefault();
    var name = document.getElementById('cn').value.trim();
    var from = document.getElementById('ce').value.trim();
    var subjRaw = document.getElementById('cs').value.trim() || 'Demande via le site';
    var msg = document.getElementById('cm').value.trim();
    var subject = encodeURIComponent(subjRaw + ' — ' + name);
    var body = encodeURIComponent(msg + '\n\n— ' + name + '\n' + from);
    window.location.href = 'mailto:contact@boulesetbilles.fun?subject=' + subject + '&body=' + body;
    return false;
  };

  /* ---------- Boot ---------- */
  window.App = { showTab: showTab, goTo: goTo, applyFilter: applyFilter, hoursAnswerHTML: hoursAnswerHTML, bowlingAnswerHTML: bowlingAnswerHTML, todayDealsHTML: todayDealsHTML, status: computeStatus };
  document.getElementById('yr').textContent = new Date().getFullYear();
  if (tabsBar) tabsBar.classList.add('has-indicator');
  tabs.forEach(function (t) { t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1; });
  syncMotionUI();
  paintToday();
  setInterval(paintToday, 60000);
  setupPointerFX();
  moveIndicator(true);
  window.addEventListener('resize', function () { moveIndicator(true); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveIndicator(true); });
  routeFromHash(true);
})();
