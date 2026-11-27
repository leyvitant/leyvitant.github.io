/* =====================================================================
   Instant search palette — Cmd/Ctrl + K, "/" or the visible buttons.
   Zero dependency. Inspired by Fuse.js / MiniSearch scoring ideas and
   the cmdk / ninja-keys interaction model:
   - accent-insensitive, prefix + substring matching, 1-typo tolerance
   - French synonyms (prix → tarif, ouvert → horaire, où → adresse…)
   - "direct answers": hours, prices, address shown inside the palette
   - scope filters, full keyboard support, ARIA combobox/listbox
   The index is built from the live DOM, so it never drifts from content.
   ===================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('search');
  if (!root) return;
  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  var answerBox = document.getElementById('search-answer');
  var scopeBtns = root.querySelectorAll('[data-scope]');

  var CATS = {
    infos: { label: 'Infos pratiques', color: 'var(--seaglass)' },
    tarifs: { label: 'Tarifs', color: 'var(--brass)' },
    activites: { label: 'Activités', color: 'var(--tide)' },
    offres: { label: 'Offres', color: 'var(--coral)' },
    anniv: { label: 'Anniversaires', color: 'var(--lilac)' },
    bar: { label: 'Bar & Resto', color: 'var(--brass)' }
  };
  var PANEL_OF_CAT = { infos: 'contact', tarifs: 'activites', activites: 'activites', offres: 'offres', anniv: 'anniv', bar: 'bar' };

  var DIA = /[̀-ͯ]/g;
  function norm(s) { return (s || '').normalize('NFD').replace(DIA, '').toLowerCase().replace(/[’']/g, ' '); }
  function normChar(ch) { var n = ch.normalize('NFD').replace(DIA, '').toLowerCase(); return n.length === 1 ? n : (n[0] || ch); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function words(s) { return s.split(/[^a-z0-9€]+/).filter(Boolean); }
  function stem(w) { return w.length > 4 ? w.replace(/(es|s|x)$/, '') : w; }

  var STOP = ' le la les de des du un une et au aux pour en est quel quelle quels quelles sont vos votre nos notre ce cette il y on a l d je vous qu que qui avec sur par '.split(' ');
  var SYN = {
    prix: 'tarif', tarifs: 'tarif', cout: 'tarif', coute: 'tarif', combien: 'tarif', cher: 'tarif', euros: 'tarif',
    heure: 'horaire', heures: 'horaire', horaires: 'horaire', ouvert: 'horaire', ouverte: 'horaire', ouverture: 'horaire',
    ferme: 'horaire', fermeture: 'horaire', quand: 'horaire', soir: 'horaire', aujourd: 'horaire',
    tel: 'telephone', phone: 'telephone', appeler: 'telephone', numero: 'telephone', joindre: 'telephone',
    mail: 'email', courriel: 'email', 'e-mail': 'email', ecrire: 'email',
    ou: 'adresse', acces: 'adresse', venir: 'adresse', itineraire: 'adresse', plan: 'adresse', gps: 'adresse', carte: 'adresse', parking: 'adresse',
    anniv: 'anniversaire', anniversaires: 'anniversaire', birthday: 'anniversaire',
    resa: 'reservation', reserver: 'reservation', booking: 'reservation', reserve: 'reservation',
    lasergame: 'laser', resto: 'restaurant', manger: 'restaurant', repas: 'restaurant', boire: 'bar', biere: 'bar',
    etudiants: 'etudiant', cheque: 'ancv', cheques: 'ancv', paiement: 'ancv', payer: 'ancv',
    chaussure: 'chaussures', promo: 'offre', promos: 'offre', reduction: 'offre', bon: 'offre', plan_: 'offre',
    enfant: 'enfants', gamin: 'enfants', kids: 'enfants', bowl: 'bowling', quille: 'bowling', quilles: 'bowling'
  };

  function lev1(a, b) { // true if edit distance <= 1
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, diff = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return diff + (la - i) + (lb - j) <= 1;
  }

  /* ---------- Index ---------- */
  var INDEX = [];
  function add(entry) {
    entry.nt = norm(entry.title); entry.nk = norm(entry.keys || ''); entry.nb = norm(entry.body || '');
    entry.wt = words(entry.nt).map(stem); entry.wk = words(entry.nk).map(stem); entry.wb = words(entry.nb).map(stem);
    INDEX.push(entry);
  }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  function buildIndex() {
    INDEX = [];
    var A = window.App || {};
    // Direct answers (practical info first)
    add({ id: 'ans-horaires', answer: true, cat: 'infos', title: 'Horaires d\'ouverture', target: 'contact-hours',
      keys: 'horaire heures ouverture ouvert ferme fermeture quand aujourd hui ce soir lundi mardi mercredi jeudi vendredi samedi dimanche',
      body: 'Mardi – Jeudi 14h00 – 1h00 · Vendredi – Samedi 14h00 – 2h00 · Dimanche 14h00 – 0h00 · Lundi (vac. scolaires) 14h00 – 19h00',
      render: function () { return A.hoursAnswerHTML ? A.hoursAnswerHTML() : ''; } });
    add({ id: 'ans-adresse', answer: true, cat: 'infos', title: 'Adresse & accès', target: 'contact-adresse',
      keys: 'adresse acces venir itineraire plan carte parking granville situe gps',
      body: '511 rue du Conillot, 50400 Granville',
      render: function () { return '<span class="ans-v">511 rue du Conillot, 50400 Granville — <a href="https://www.google.com/maps/dir/?api=1&amp;destination=511+rue+du+Conillot+50400+Granville" target="_blank" rel="noopener">Itinéraire</a></span>'; } });
    add({ id: 'ans-tel', answer: true, cat: 'infos', title: 'Téléphone & réservation', target: 'contact-tel',
      keys: 'telephone appeler numero reservation reserver joindre',
      body: '02 33 91 76 77',
      render: function () { return '<span class="ans-v">Réservation au <a href="tel:+33233917677">02 33 91 76 77</a></span>'; } });
    add({ id: 'ans-email', answer: true, cat: 'infos', title: 'Email', target: 'contact-email',
      keys: 'email contact ecrire message formulaire',
      body: 'contact@boulesetbilles.fun',
      render: function () { return '<span class="ans-v"><a href="mailto:contact@boulesetbilles.fun">contact@boulesetbilles.fun</a> · ou le formulaire de contact</span>'; } });
    add({ id: 'ans-bowling', answer: true, cat: 'tarifs', title: 'Tarifs bowling', target: 'tarifs-bowling',
      keys: 'tarif bowling partie personne grille heure reduit intermediaire plein chaussures',
      body: '5 € tarif réduit · 6 € tarif intermédiaire · 7 € plein tarif, par partie et par personne selon l\'horaire de début. Location de chaussures : 1 €.',
      render: function () { return A.bowlingAnswerHTML ? A.bowlingAnswerHTML() : ''; } });
    add({ id: 'ans-laser', answer: true, cat: 'tarifs', title: 'Tarifs laser game', target: 'laser-game',
      keys: 'tarif laser game partie minutes',
      body: '9 € · 20 min — 11 € · 30 min — 15 € · 2 × 20 min',
      render: function () { return '<span class="ans-v"><b>9 €</b> · 20 min &nbsp;·&nbsp; <b>11 €</b> · 30 min &nbsp;·&nbsp; <b>15 €</b> · 2 × 20 min</span>'; } });
    add({ id: 'ans-chaussures', answer: true, cat: 'tarifs', title: 'Location de chaussures', target: 'tarifs-bowling',
      keys: 'chaussures location tarif',
      body: 'Location de chaussures : 1 €.',
      render: function () { return '<span class="ans-v">Location de chaussures : <b>1 €</b> (incluse dans les formules anniversaire)</span>'; } });
    add({ id: 'ans-anniv', answer: true, cat: 'anniv', title: 'Formules anniversaire', target: 'anniv',
      keys: 'anniversaire enfants formule tarif quilles laser strike gateau',
      body: 'Formule Quilles dès 14 € · Formule Laser dès 16 € · Formule Strike dès 18 € par enfant. Formules à partir de 6 enfants, sur réservation.',
      render: function () { return '<span class="ans-v">Quilles <b>dès 14 €</b> · Laser <b>dès 16 €</b> · Strike <b>dès 18 €</b> par enfant — à partir de 6 enfants, sur réservation, boisson offerte, gâteau bienvenu.</span>'; } });
    add({ id: 'ans-today', answer: true, cat: 'offres', title: 'Bons plans du jour', target: 'offres', filter: 'today',
      keys: 'offre bon plan promo aujourd hui jour reduction',
      body: 'Le bon plan valable aujourd\'hui',
      render: function () { return A.todayDealsHTML ? A.todayDealsHTML() : ''; } });
    add({ id: 'ans-ancv', answer: true, cat: 'infos', title: 'Chèques Vacances ANCV', target: 'offres',
      keys: 'ancv cheque vacances paiement payer moyens',
      body: 'Nous acceptons les Chèques Vacances ANCV',
      render: function () { return '<span class="ans-v">Oui, nous acceptons les <b>Chèques Vacances ANCV</b>.</span>'; } });

    // Panels (section heads)
    document.querySelectorAll('.panel').forEach(function (p) {
      var head = p.querySelector('.section-head');
      var catByPanel = { activites: 'activites', bar: 'bar', offres: 'offres', anniv: 'anniv', contact: 'infos' };
      add({ id: 'panel-' + p.id, cat: catByPanel[p.id] || 'infos', title: txt(head.querySelector('.kicker')) + ' — ' + txt(head.querySelector('h2')),
        body: txt(head.querySelector('p')), target: p.id, panel: p.id, keys: p.id });
    });

    // Every content block tagged in the markup
    document.querySelectorAll('[data-search-cat]').forEach(function (el, i) {
      if (!el.id) el.id = 'sr-' + i;
      var t = el.querySelector('h3,h4,.label,.block-title');
      var title = t ? txt(t) : txt(el).slice(0, 60);
      if (t && t.classList.contains('label')) title = txt(t) + ' : ' + txt(el.querySelector('.val'));
      var dayTag = el.querySelector('.day-tag');
      if (dayTag) title += ' · ' + txt(dayTag);
      add({ id: el.id, cat: el.getAttribute('data-search-cat'), title: title, body: txt(el), keys: el.getAttribute('data-search-keys'),
        target: el.id, panel: (el.closest('.panel') || {}).id });
    });
  }

  /* ---------- Scoring ---------- */
  function tokens(q) {
    return words(norm(q)).filter(function (w) { return STOP.indexOf(w) === -1 || SYN[w]; });
  }
  function tokenScore(e, tok) {
    var alts = [stem(tok)]; if (SYN[tok]) alts.push(stem(SYN[tok]));
    var best = 0;
    alts.forEach(function (q) {
      var s = 0, i;
      for (i = 0; i < e.wt.length; i++) { var w = e.wt[i]; if (w === q) s = Math.max(s, 10); else if (w.indexOf(q) === 0) s = Math.max(s, 7); }
      for (i = 0; i < e.wk.length; i++) { var k = e.wk[i]; if (k === q) s = Math.max(s, 9); else if (k.indexOf(q) === 0) s = Math.max(s, 6); }
      if (s < 3) for (i = 0; i < e.wb.length; i++) { if (e.wb[i].indexOf(q) === 0) { s = Math.max(s, 3); break; } }
      if (!s && q.length > 2 && e.nb.indexOf(q) !== -1) s = 1.5;
      if (!s && q.length >= 4) { // typo tolerance on title/keys
        var pool = e.wt.concat(e.wk);
        for (i = 0; i < pool.length; i++) { if (lev1(q, pool[i]) || lev1(q, pool[i].slice(0, q.length))) { s = 3; break; } }
      }
      best = Math.max(best, s);
    });
    return best;
  }
  function search(q, scope) {
    var toks = tokens(q);
    var res = [];
    INDEX.forEach(function (e) {
      if (scope !== 'all' && e.cat !== scope) return;
      if (!toks.length) return;
      var sum = 0, miss = 0;
      toks.forEach(function (t) { var s = tokenScore(e, t); if (!s) miss++; sum += s; });
      if (miss === toks.length) return;
      var score = sum * Math.pow(0.3, miss) * (e.answer ? 1.3 : 1);
      if (score >= 3) res.push({ e: e, score: score });
    });
    res.sort(function (a, b) { return b.score - a.score; });
    var seen = {};
    res = res.filter(function (r) {
      if (r.e.answer) { seen[r.e.target] = 1; return true; }
      return !seen[r.e.target];
    });
    return { toks: toks, items: res.slice(0, 14) };
  }

  /* ---------- Rendering ---------- */
  function highlight(text, toks) {
    if (!toks.length) return esc(text);
    var n = ''; for (var i = 0; i < text.length; i++) n += normChar(text[i]);
    var marks = new Array(text.length).fill(false);
    toks.forEach(function (t) {
      var alts = [t]; if (SYN[t]) alts.push(SYN[t]);
      alts.forEach(function (a) {
        if (a.length < 2) return;
        var re = new RegExp('(^|[^a-z0-9])(' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'g'), m;
        while ((m = re.exec(n))) { for (var k = m.index + m[1].length; k < m.index + m[0].length; k++) marks[k] = true; }
      });
    });
    var out = '', open = false;
    for (var j = 0; j < text.length; j++) {
      if (marks[j] && !open) { out += '<mark>'; open = true; }
      if (!marks[j] && open) { out += '</mark>'; open = false; }
      out += esc(text[j]);
    }
    return out + (open ? '</mark>' : '');
  }
  function snippet(e, toks) {
    var body = e.body || '';
    if (body.length <= 150) return body;
    var nb = e.nb, pos = -1;
    toks.some(function (t) { pos = nb.indexOf(SYN[t] || t); if (pos < 0) pos = nb.indexOf(t); return pos >= 0; });
    if (pos < 0) return body.slice(0, 140) + '…';
    var s = Math.max(0, pos - 50);
    return (s ? '…' : '') + body.slice(s, s + 150) + '…';
  }

  var scope = 'all', items = [], active = 0;
  var QUICK = ['ans-horaires', 'ans-adresse', 'ans-tel', 'ans-bowling', 'ans-laser', 'ans-anniv', 'ans-today'];

  function render() {
    var q = input.value.trim();
    var toks = [];
    if (!q) {
      items = INDEX.filter(function (e) { return QUICK.indexOf(e.id) !== -1 && (scope === 'all' || e.cat === scope); });
      if (scope !== 'all' && !items.length) items = INDEX.filter(function (e) { return e.cat === scope; }).slice(0, 10);
    } else {
      var r = search(q, scope); toks = r.toks; items = r.items.map(function (x) { return x.e; });
    }
    active = 0;
    var html = '';
    if (!items.length) {
      html = '<li class="cmdk-empty" role="presentation">Aucun résultat pour « ' + esc(q) + ' ».<br>Appelez-nous au <a href="tel:+33233917677">02 33 91 76 77</a> ou <a href="mailto:contact@boulesetbilles.fun">écrivez-nous</a>.</li>';
    } else {
      html += '<li class="cmdk-group" role="presentation">' + (q ? 'Résultats' : 'Accès rapide') + '</li>';
      items.forEach(function (e, i) {
        var c = CATS[e.cat] || CATS.infos;
        var sub = e.answer ? e.body : snippet(e, toks);
        html += '<li class="cmdk-item" role="option" id="sr-opt-' + i + '" data-i="' + i + '" aria-selected="' + (i === 0) + '" style="--c:' + c.color + '">' +
          '<span class="cmdk-bead" aria-hidden="true"></span><span><span class="t">' + highlight(e.title, toks) + '</span>' +
          '<span class="s">' + highlight(sub, toks) + '</span></span><span class="cat">' + (e.answer ? 'Réponse' : c.label) + '</span></li>';
      });
    }
    list.innerHTML = html;
    input.setAttribute('aria-activedescendant', items.length ? 'sr-opt-0' : '');
    // direct answer for the best match
    var top = items[0];
    answerBox.innerHTML = (q && top && top.answer && top.render) ? '<span class="ans-k">' + esc(top.title) + '</span>' + top.render() : '';
  }

  function setActive(i) {
    if (!items.length) return;
    active = (i + items.length) % items.length;
    list.querySelectorAll('.cmdk-item').forEach(function (li) { li.setAttribute('aria-selected', String(+li.dataset.i === active)); });
    var el = document.getElementById('sr-opt-' + active);
    if (el) { el.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', el.id); }
    var e = items[active];
    if (input.value.trim() && e.answer && e.render) answerBox.innerHTML = '<span class="ans-k">' + esc(e.title) + '</span>' + e.render();
  }

  function choose(i) {
    var e = items[i]; if (!e) return;
    close(false);
    var panel = e.panel || PANEL_OF_CAT[e.cat];
    if (window.App && window.App.goTo) window.App.goTo(e.target, panel, { filter: e.filter });
  }

  /* ---------- Open / close ---------- */
  var lastFocus = null, siblings = [];
  function open(prefill) {
    if (!root.hidden) { input.select(); return; }
    buildIndex();
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('cmdk-open');
    siblings = Array.prototype.filter.call(document.body.children, function (el) { return el !== root && el.tagName !== 'SCRIPT' && !el.inert; });
    siblings.forEach(function (el) { el.inert = true; });
    if (typeof prefill === 'string') input.value = prefill;
    render();
    input.focus(); input.select();
  }
  function close(restore) {
    if (root.hidden) return;
    root.hidden = true;
    document.body.classList.remove('cmdk-open');
    siblings.forEach(function (el) { el.inert = false; });
    if (restore !== false && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(0); }
    else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); setActive(items.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
  });
  list.addEventListener('click', function (e) { var li = e.target.closest('.cmdk-item'); if (li) choose(+li.dataset.i); });
  list.addEventListener('mousemove', function (e) { var li = e.target.closest('.cmdk-item'); if (li && +li.dataset.i !== active) setActive(+li.dataset.i); });
  root.addEventListener('click', function (e) { if (e.target.closest('[data-close-search]')) close(); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { // focus trap
      var f = root.querySelectorAll('input,button,a[href]'); var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  scopeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      scope = b.dataset.scope;
      scopeBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render(); input.focus();
    });
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open-search]'); if (t) { e.preventDefault(); open(); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) {
      e.preventDefault(); if (root.hidden) open(); else close(); return;
    }
    if (e.key === '/' && root.hidden && !e.target.closest('input,textarea,[contenteditable]')) { e.preventDefault(); open(); }
  });

  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (isMac) document.querySelectorAll('[data-mod]').forEach(function (k) { k.textContent = '⌘ K'; });

  window.SiteSearch = { open: open, close: close, search: function (q, s) { buildIndex(); return search(q, s || 'all').items.map(function (x) { return x.e.title; }); } };
})();
