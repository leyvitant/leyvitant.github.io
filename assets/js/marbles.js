/* =====================================================================
   Marbles — a tiny circle-only physics stage (~6 KB, no dependency).
   Glass marbles, brushed-steel boules and a bowling ball roll, collide
   elastically and react to cursor, touch, scroll and taps.
   - Fixed-step integration (120 Hz), impulse-based elastic collisions
   - Pre-rendered sprites (rotating body + fixed light layer)
   - Sleeps when everything is at rest; pauses when tab is hidden
   - prefers-reduced-motion / user toggle => one static, settled frame
   The canvas has pointer-events:none: it never blocks clicks or scroll.
   ===================================================================== */
(function () {
  'use strict';
  var canvas = document.getElementById('marbles');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var W = 0, H = 0, DPR = 1, small = false;
  var bodies = [];
  var sprites = {};
  var running = false, enabled = true, rafId = 0, lastT = 0, acc = 0, idleFor = 0;
  var STEP = 1 / 120;
  var G = 1150;                 // px/s²
  var E_BALL = 0.86, E_WALL = 0.55;

  var pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, active: false, t: 0, touch: false };

  var TINTS = {
    seaglass: [143, 214, 200], tide: [143, 179, 255], lilac: [200, 168, 240],
    brass: [232, 181, 106], coral: [255, 93, 79], clear: [226, 236, 240]
  };
  var GLASS_MIX = ['seaglass', 'tide', 'lilac', 'brass', 'clear', 'seaglass', 'tide', 'lilac', 'clear', 'coral'];

  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function mkCanvas(s) { var c = document.createElement('canvas'); c.width = c.height = s; return c; }

  /* ---------- Sprites ---------- */
  function sprite(kind, tint, r) {
    var key = kind + tint + Math.round(r) + '@' + DPR;
    if (sprites[key]) return sprites[key];
    var s = Math.ceil(r * 2 * DPR) + 4, c = s / 2, R = r * DPR;
    var body = mkCanvas(s), light = mkCanvas(s);
    var b = body.getContext('2d'), l = light.getContext('2d');
    b.save(); b.beginPath(); b.arc(c, c, R, 0, Math.PI * 2); b.clip();

    if (kind === 'glass') {
      var t = TINTS[tint];
      var g = b.createRadialGradient(c, c, R * 0.1, c, c, R);
      g.addColorStop(0, rgba(t, 0.22)); g.addColorStop(0.65, rgba(t, 0.38)); g.addColorStop(1, rgba(t, 0.85));
      b.fillStyle = g; b.fillRect(0, 0, s, s);
      // cat's-eye vanes
      b.translate(c, c);
      for (var i = 0; i < 3; i++) {
        b.rotate(Math.PI * 2 / 3);
        var vg = b.createLinearGradient(0, 0, R * 0.8, 0);
        vg.addColorStop(0, rgba(t, 0.95)); vg.addColorStop(1, rgba(t, 0.05));
        b.fillStyle = vg;
        b.beginPath(); b.moveTo(0, 0);
        b.quadraticCurveTo(R * 0.45, -R * 0.38, R * 0.82, -R * 0.06);
        b.quadraticCurveTo(R * 0.4, R * 0.12, 0, 0); b.fill();
      }
      b.setTransform(1, 0, 0, 1, 0, 0);
      if (b.createConicGradient) { // iridescence
        var cg = b.createConicGradient(0, c, c);
        cg.addColorStop(0, 'rgba(143,214,200,.16)'); cg.addColorStop(0.33, 'rgba(200,168,240,.16)');
        cg.addColorStop(0.66, 'rgba(232,181,106,.16)'); cg.addColorStop(1, 'rgba(143,214,200,.16)');
        b.globalCompositeOperation = 'screen'; b.fillStyle = cg; b.fillRect(0, 0, s, s);
      }
    } else if (kind === 'steel') {
      var sg = b.createRadialGradient(c - R * 0.3, c - R * 0.35, R * 0.1, c, c, R);
      sg.addColorStop(0, '#eef2f3'); sg.addColorStop(0.45, '#9aa6ad'); sg.addColorStop(1, '#2c3439');
      b.fillStyle = sg; b.fillRect(0, 0, s, s);
      if (b.createConicGradient) { // brushed finish
        var bg = b.createConicGradient(0.3, c, c);
        for (var k = 0; k <= 12; k++) bg.addColorStop(k / 12, k % 2 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)');
        b.globalCompositeOperation = 'overlay'; b.fillStyle = bg; b.fillRect(0, 0, s, s);
        b.globalCompositeOperation = 'source-over';
      }
      // pétanque grooves
      b.strokeStyle = 'rgba(20,26,30,.7)'; b.lineWidth = Math.max(1, R * 0.05);
      for (var gI = -1; gI <= 1; gI += 2) {
        b.beginPath(); b.ellipse(c + gI * R * 0.42, c, R * 0.22, R * 1.05, 0, 0, Math.PI * 2); b.stroke();
      }
    } else { // bowling ball
      var bb = b.createRadialGradient(c - R * 0.2, c - R * 0.3, R * 0.05, c, c, R);
      bb.addColorStop(0, '#3b6d75'); bb.addColorStop(0.55, '#173238'); bb.addColorStop(1, '#070d10');
      b.fillStyle = bb; b.fillRect(0, 0, s, s);
      b.globalAlpha = 0.25; b.strokeStyle = '#8fd6c8'; b.lineWidth = R * 0.05;   // marbled veins
      for (var v = 0; v < 4; v++) {
        b.beginPath(); b.moveTo(c - R, c + rand(-R, R));
        b.bezierCurveTo(c - R * 0.3, c + rand(-R, R), c + R * 0.3, c + rand(-R, R), c + R, c + rand(-R, R)); b.stroke();
      }
      b.globalAlpha = 1;
      [[0.0, -0.42, 0.13], [-0.2, -0.12, 0.11], [0.2, -0.12, 0.11]].forEach(function (h) {
        var hx = c + h[0] * R, hy = c + h[1] * R, hr = h[2] * R;
        var hg = b.createRadialGradient(hx + hr * 0.3, hy + hr * 0.3, 0, hx, hy, hr);
        hg.addColorStop(0, '#000'); hg.addColorStop(0.8, '#05080a'); hg.addColorStop(1, 'rgba(143,214,200,.5)');
        b.fillStyle = hg; b.beginPath(); b.arc(hx, hy, hr, 0, Math.PI * 2); b.fill();
      });
    }
    b.restore();

    // fixed light layer (does not rotate)
    l.save(); l.beginPath(); l.arc(c, c, R, 0, Math.PI * 2); l.clip();
    var spec = l.createRadialGradient(c - R * 0.38, c - R * 0.45, 0, c - R * 0.38, c - R * 0.45, R * 0.55);
    spec.addColorStop(0, 'rgba(255,255,255,' + (kind === 'glass' ? 0.9 : 0.75) + ')'); spec.addColorStop(1, 'rgba(255,255,255,0)');
    l.fillStyle = spec; l.fillRect(0, 0, s, s);
    var caus = l.createRadialGradient(c + R * 0.35, c + R * 0.5, 0, c + R * 0.35, c + R * 0.5, R * 0.6);
    var ct = kind === 'glass' ? TINTS[tint] : TINTS.brass;  // warm coastal bounce light
    caus.addColorStop(0, rgba(ct, kind === 'glass' ? 0.55 : 0.28)); caus.addColorStop(1, rgba(ct, 0));
    l.fillStyle = caus; l.fillRect(0, 0, s, s);
    l.restore();
    l.beginPath(); l.arc(c, c, R - 0.5 * DPR, 0, Math.PI * 2);
    l.strokeStyle = kind === 'glass' ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.12)'; l.lineWidth = DPR; l.stroke();

    return (sprites[key] = { body: body, light: light, size: s });
  }

  /* ---------- World ---------- */
  function makeBody(kind, r, tint, x, y) {
    var density = kind === 'steel' ? 2.6 : kind === 'bowling' ? 1.7 : 1;
    return { kind: kind, tint: tint || '', r: r, m: r * r * density, x: x, y: y,
      vx: rand(-60, 60), vy: rand(-40, 40), a: rand(0, 6.28), w: rand(-1, 1), spr: null };
  }

  function populate() {
    bodies = [];
    var area = W * H;
    var n = small ? Math.round(Math.min(16, Math.max(10, area / 26000))) : Math.round(Math.min(30, Math.max(14, area / 42000)));
    var sc = small ? 0.72 : 1;
    function spawnY() { return rand(H * 0.05, H * 0.55); }
    bodies.push(makeBody('bowling', 52 * sc, '', rand(W * 0.55, W * 0.85), spawnY()));
    var steel = small ? 2 : 3;
    for (var i = 0; i < steel; i++) bodies.push(makeBody('steel', rand(30, 38) * sc, '', rand(40, W - 40), spawnY()));
    for (var j = 0; j < n - steel - 1; j++) {
      var big = Math.random() < 0.15;
      bodies.push(makeBody('glass', (big ? rand(24, 30) : rand(10, 21)) * sc, GLASS_MIX[j % GLASS_MIX.length], rand(30, W - 30), spawnY()));
    }
    bodies.forEach(function (b) { b.spr = sprite(b.kind, b.tint, b.r); });
  }

  function resize() {
    var nw = window.innerWidth, nh = window.innerHeight;
    var nd = Math.min(window.devicePixelRatio || 1, nw < 700 ? 1.5 : 2);
    var first = !W;
    var widthChanged = Math.abs(nw - W) > 80 || nd !== DPR;
    W = nw; H = nh; small = W < 700;
    if (nd !== DPR) { DPR = nd; sprites = {}; }
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    if (first || widthChanged) populate();
    bodies.forEach(function (b) { b.spr = sprite(b.kind, b.tint, b.r); b.x = Math.min(Math.max(b.x, b.r), W - b.r); b.y = Math.min(b.y, H - b.r); });
    if (!running) draw();
  }

  function step(dt) {
    var i, j, b, n = bodies.length;
    var pr = pointer.touch ? 130 : 105;
    var pActive = pointer.active && (performance.now() - pointer.t < 1200);
    for (i = 0; i < n; i++) {
      b = bodies[i];
      b.vy += G * dt;
      if (pActive) {
        var dx = b.x - pointer.x, dy = b.y - pointer.y, d2 = dx * dx + dy * dy, R = pr + b.r;
        if (d2 < R * R && d2 > 0.01) {
          var d = Math.sqrt(d2), f = (1 - d / R);
          var k = 5200 * f * f / (b.m / 400 + 1);
          // repulsion + "flick": blend toward the pointer's velocity (bounded)
          var pvx = Math.max(-2500, Math.min(2500, pointer.vx)), pvy = Math.max(-2500, Math.min(2500, pointer.vy));
          b.vx += (dx / d) * k * dt + (pvx - b.vx) * f * 0.06;
          b.vy += (dy / d) * k * dt + (pvy - b.vy) * f * 0.06;
        }
      }
      b.vx *= 0.9995; b.vy *= 0.9995;
      b.x += b.vx * dt; b.y += b.vy * dt;
      // walls
      if (b.x < b.r) { b.x = b.r; b.vx = -b.vx * E_WALL; }
      else if (b.x > W - b.r) { b.x = W - b.r; b.vx = -b.vx * E_WALL; }
      if (b.y < b.r) { b.y = b.r; b.vy = -b.vy * E_WALL; }
      if (b.y > H - b.r) {
        b.y = H - b.r;
        b.vy = Math.abs(b.vy) < 40 ? 0 : -b.vy * E_WALL;
        b.vx *= 0.992;                         // rolling friction
        b.w += (b.vx / b.r - b.w) * 0.2;        // roll without slipping
      }
      b.a += b.w * dt;
    }
    // collisions (2 relaxation passes)
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < n; i++) {
        var A = bodies[i];
        for (j = i + 1; j < n; j++) {
          var B = bodies[j];
          var cx = B.x - A.x, cy = B.y - A.y, rr = A.r + B.r;
          var dd = cx * cx + cy * cy;
          if (dd >= rr * rr || dd === 0) continue;
          var dist = Math.sqrt(dd), nx = cx / dist, ny = cy / dist, over = rr - dist;
          var ia = 1 / A.m, ib = 1 / B.m, sum = ia + ib;
          var corr = over / sum * 0.85;
          A.x -= nx * corr * ia; A.y -= ny * corr * ia;
          B.x += nx * corr * ib; B.y += ny * corr * ib;
          var rvx = B.vx - A.vx, rvy = B.vy - A.vy, vn = rvx * nx + rvy * ny;
          if (vn < 0) {
            var e = vn < -60 ? E_BALL : 0.1;       // resting contacts: no bounce jitter
            var jimp = -(1 + e) * vn / sum;
            A.vx -= jimp * nx * ia; A.vy -= jimp * ny * ia;
            B.vx += jimp * nx * ib; B.vy += jimp * ny * ib;
            // tangential spin transfer
            var vt = rvx * -ny + rvy * nx;
            A.w += vt / A.r * 0.04; B.w -= vt / B.r * 0.04;
          }
        }
      }
    }
  }

  function energy() {
    var m = 0;
    for (var i = 0; i < bodies.length; i++) { var b = bodies[i]; m = Math.max(m, Math.abs(b.vx) + Math.abs(b.vy)); }
    return m;
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i], s = b.spr, h = s.size / 2;
      var x = b.x * DPR, y = b.y * DPR;
      // contact shadow
      var floorGap = H - (b.y + b.r);
      if (floorGap < 60) {
        ctx.globalAlpha = 0.35 * (1 - floorGap / 60);
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x, (H - 2) * DPR, b.r * DPR * 0.9, b.r * DPR * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      var cos = Math.cos(b.a), sin = Math.sin(b.a);
      ctx.setTransform(cos, sin, -sin, cos, x, y);
      ctx.drawImage(s.body, -h, -h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(s.light, x - h, y - h);
    }
  }

  function frame(t) {
    if (!running) return;
    var dt = Math.min((t - lastT) / 1000 || 0, 1 / 30);
    lastT = t; acc += dt;
    while (acc >= STEP) { step(STEP); acc -= STEP; }
    draw();
    if (energy() < 14 && performance.now() - pointer.t > 1500) idleFor += dt; else idleFor = 0;
    if (idleFor > 1.2) { stop(); return; }   // sleep: zero cost at rest
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !enabled || document.hidden) return;
    running = true; idleFor = 0; lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(rafId); }
  function wake() { if (enabled) start(); }

  function settleStatic() {
    // simulate silently so the still frame shows a natural pile
    for (var i = 0; i < 900; i++) step(STEP);
    bodies.forEach(function (b) { b.vx = b.vy = b.w = 0; });
    draw();
  }

  /* ---------- Input (all passive, never preventDefault) ---------- */
  var INTERACTIVE = 'a,button,input,textarea,select,label,iframe,summary,[role="tab"],[contenteditable]';
  window.addEventListener('pointermove', function (e) {
    if (!enabled) return;
    var now = performance.now(), dt = Math.max(now - pointer.t, 8) / 1000;
    if (pointer.active) {
      pointer.vx = pointer.vx * 0.6 + ((e.clientX - pointer.x) / dt) * 0.4;
      pointer.vy = pointer.vy * 0.6 + ((e.clientY - pointer.y) / dt) * 0.4;
    }
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = now; pointer.active = true;
    pointer.touch = e.pointerType === 'touch';
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', function () { pointer.active = false; }, { passive: true });
  window.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') pointer.active = false; }, { passive: true });

  function shock(x, y, power, radius) {
    radius = radius || 280;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i], dx = b.x - x, dy = b.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < radius) {
        var f = (1 - d / radius) * power * (600 / (b.m / 200 + 600)) ;
        b.vx += dx / d * f; b.vy += dy / d * f - f * 0.35;
      }
    }
    wake();
  }
  window.addEventListener('pointerdown', function (e) {
    if (!enabled || (e.target.closest && e.target.closest(INTERACTIVE))) return;
    shock(e.clientX, e.clientY, 900);
  }, { passive: true });

  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY, dy = y - lastY; lastY = y;
    if (!enabled || !dy) return;
    var deep = document.body.classList.contains('is-deep');
    var kick = Math.max(-900, Math.min(900, -dy * (deep ? 3 : 9)));
    for (var i = 0; i < bodies.length; i++) { var b = bodies[i]; b.vy += kick * (0.6 + Math.random() * 0.5); b.vx += (Math.random() - 0.5) * Math.abs(kick) * 0.3; }
    wake();
  }, { passive: true });

  var rT;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { resize(); if (enabled) wake(); else settleStatic(); }, 120); }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else wake(); });

  /* ---------- Public API ---------- */
  function setEnabled(on) {
    enabled = !!on;
    if (enabled) { wake(); } else { stop(); settleStatic(); }
  }
  window.Marbles = {
    setEnabled: setEnabled,
    isEnabled: function () { return enabled; },
    shock: shock,
    nudge: function (dir) { // tab switch: the whole tray tilts toward the new tab
      if (!enabled) return;
      for (var i = 0; i < bodies.length; i++) { bodies[i].vx += dir * rand(260, 520); bodies[i].vy -= rand(120, 380); }
      wake();
    }
  };

  resize();
  var stored = null;
  try { stored = localStorage.getItem('bb-motion'); } catch (e) {}
  enabled = !(mqReduce.matches || stored === 'off');
  if (enabled) start(); else settleStatic();
  (mqReduce.addEventListener ? mqReduce.addEventListener.bind(mqReduce, 'change') : mqReduce.addListener.bind(mqReduce))(function (ev) {
    var st = null; try { st = localStorage.getItem('bb-motion'); } catch (e) {}
    setEnabled(!ev.matches && st !== 'off');
    document.dispatchEvent(new CustomEvent('marbles:change'));
  });
})();
