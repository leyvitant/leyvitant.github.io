# leyvitant.github.io
test du site internet boules&amp;billes ISANBAPT
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BOULES et BILLES — Bowling & Laser Game à Granville</title>
<meta name="description" content="Le complexe de jeux de Granville : 8 pistes de bowling, laser game dernière génération, billard et brasserie. Bons plans toute la semaine.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;800;900&family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#080608;
    --bg-2:#140c0e;
    --surface:rgba(255,255,255,.035);
    --surface-2:rgba(255,255,255,.06);
    --border:rgba(255,255,255,.10);
    --border-strong:rgba(255,255,255,.18);
    --ink:#fbf3f3;
    --muted:#c0a3a6;
    --muted-2:#8c6f72;
    --red:#ff2e3e;
    --red-soft:#ff8088;
    --red-deep:#c30f22;
    --ember:#ff6a2f;
    --gold:#ffc24b;
    --gold-soft:#ffdc92;
    --grad:linear-gradient(120deg,var(--red),#ff4a2f 50%,var(--gold));
    --radius:22px;
    --maxw:1180px;
    --shadow:0 30px 70px -30px rgba(0,0,0,.85);
  }

  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    background:var(--bg);
    color:var(--ink);
    font-family:'Sora',system-ui,sans-serif;
    line-height:1.65;
    overflow-x:hidden;
    -webkit-font-smoothing:antialiased;
    position:relative;
  }
  body::before{
    content:"";position:fixed;inset:0;z-index:0;pointer-events:none;
    background:
      radial-gradient(60% 50% at 12% 8%, rgba(255,46,62,.20), transparent 60%),
      radial-gradient(55% 50% at 88% 18%, rgba(255,106,47,.15), transparent 60%),
      radial-gradient(70% 60% at 50% 110%, rgba(255,194,75,.12), transparent 60%);
  }
  body::after{
    content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.05;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    mix-blend-mode:overlay;
  }
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 24px;position:relative;z-index:1}

  a{color:inherit;text-decoration:none}
  img{max-width:100%;display:block}
  ::selection{background:var(--red);color:#fff}

  h1,h2,h3,.brand-name,.eyebrow,.tab,.btn,.stat-num,.block-title,.day-tag,.deal-price{font-family:'Unbounded',sans-serif}

  /* ============ NAV ============ */
  header.nav{
    position:sticky;top:0;z-index:60;
    backdrop-filter:blur(18px);
    background:rgba(8,6,8,.74);
    border-bottom:1px solid var(--border);
  }
  .nav-inner{
    max-width:var(--maxw);margin:0 auto;padding:14px 24px;
    display:flex;align-items:center;gap:20px;
  }
  .brand{display:flex;align-items:center;gap:13px;flex-shrink:0}
  .brand-logo{height:46px;width:auto;filter:drop-shadow(0 4px 14px rgba(255,46,62,.5))}
  .brand-fallback{
    height:46px;width:46px;border-radius:13px;background:var(--grad);
    display:none;align-items:center;justify-content:center;
    font-family:'Unbounded';font-weight:900;font-size:1.2rem;color:#fff;
  }
  .brand-txt{display:flex;flex-direction:column;line-height:1}
  .brand-name{font-weight:800;font-size:1.02rem;letter-spacing:.5px}
  .brand-name b{color:var(--red)}
  .brand-sub{font-size:.66rem;color:var(--muted);letter-spacing:2.5px;text-transform:uppercase;margin-top:4px;font-family:'Sora'}

  .tabs{display:flex;gap:6px;margin-left:auto;overflow-x:auto;scrollbar-width:none}
  .tabs::-webkit-scrollbar{display:none}
  .tab{
    border:1px solid transparent;background:transparent;color:var(--muted);
    font-size:.82rem;font-weight:600;letter-spacing:.3px;
    padding:11px 18px;border-radius:999px;cursor:pointer;white-space:nowrap;
    transition:.25s;position:relative;
  }
  .tab:hover{color:var(--ink);background:var(--surface)}
  .tab[aria-selected="true"]{
    color:#fff;border-color:rgba(255,46,62,.55);
    background:linear-gradient(180deg,rgba(255,46,62,.26),rgba(255,106,47,.16));
    box-shadow:0 0 0 1px rgba(255,46,62,.3),0 8px 24px -10px rgba(255,46,62,.8);
  }
  .nav-cta{
    flex-shrink:0;display:inline-flex;align-items:center;gap:9px;
    padding:11px 18px;border-radius:999px;font-family:'Unbounded';font-weight:600;
    font-size:.8rem;background:var(--grad);color:#fff;
    transition:.25s;box-shadow:0 10px 26px -10px rgba(255,46,62,.85)
  }
  .nav-cta:hover{transform:translateY(-2px);box-shadow:0 16px 32px -10px rgba(255,46,62,1)}
  .nav-cta svg{width:15px;height:15px}

  /* ============ HERO ============ */
  .hero{
    position:relative;overflow:hidden;
    padding:clamp(70px,11vw,140px) 0 clamp(60px,8vw,110px);
    border-bottom:1px solid var(--border);
  }
  .hero-bg{
    position:absolute;inset:0;z-index:0;
    background:linear-gradient(180deg,rgba(8,6,8,.5),rgba(8,6,8,.82) 55%,var(--bg) 100%),
      url("https://boulesetbilles.fun/wp-content/uploads/2019/03/cropped-bowling-laser-game-granville-6-1024x614.jpg") center/cover no-repeat;
    transform:scale(1.05);
    filter:saturate(1.15);
  }
  .hero-bg::after{
    content:"";position:absolute;inset:0;
    background:radial-gradient(60% 80% at 80% 0%,rgba(255,194,75,.22),transparent 60%),
               radial-gradient(55% 75% at 5% 100%,rgba(255,46,62,.32),transparent 60%);
    mix-blend-mode:screen;
  }
  .hero .wrap{display:grid;gap:28px;max-width:920px}
  .eyebrow{
    display:inline-flex;align-items:center;gap:10px;width:fit-content;
    font-size:.72rem;letter-spacing:3px;text-transform:uppercase;color:var(--red-soft);
    padding:8px 16px;border:1px solid rgba(255,46,62,.4);border-radius:999px;
    background:rgba(255,46,62,.08);font-weight:600;
  }
  .pulse{width:8px;height:8px;border-radius:50%;background:var(--red);box-shadow:0 0 14px var(--red);animation:pulse 1.6s infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.6)}}
  .hero h1{
    font-weight:900;line-height:.96;letter-spacing:-1px;
    font-size:clamp(2.6rem,7vw,5.4rem);
    text-shadow:0 0 50px rgba(255,46,62,.45);
  }
  .hero h1 .neon{
    background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;
    filter:drop-shadow(0 0 26px rgba(255,106,47,.55));
  }
  .hero p.lead{font-size:clamp(1.05rem,2.2vw,1.32rem);color:var(--muted);max-width:620px}
  .hero-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:6px}
  .btn{
    display:inline-flex;align-items:center;gap:10px;cursor:pointer;border:none;
    font-weight:600;font-size:.9rem;letter-spacing:.3px;
    padding:16px 28px;border-radius:14px;transition:.28s;
  }
  .btn svg{width:17px;height:17px;transition:.28s}
  .btn-primary{background:var(--grad);color:#fff;background-size:160% 160%;
    box-shadow:0 18px 40px -16px rgba(255,46,62,.9)}
  .btn-primary:hover{background-position:100% 0;transform:translateY(-3px)}
  .btn-primary:hover svg{transform:translateX(4px)}
  .btn-ghost{background:var(--surface-2);color:var(--ink);border:1px solid var(--border-strong)}
  .btn-ghost:hover{background:rgba(255,255,255,.12);transform:translateY(-3px)}

  .hero-stats{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px}
  .chip{
    display:flex;align-items:center;gap:10px;padding:13px 18px;border-radius:14px;
    background:var(--surface);border:1px solid var(--border);font-size:.85rem;color:var(--muted)
  }
  .chip b{color:var(--ink);font-family:'Unbounded';font-weight:700}
  .chip .dot{width:9px;height:9px;border-radius:50%;background:var(--gold);box-shadow:0 0 12px var(--gold)}

  /* ============ MARQUEE ============ */
  .marquee{
    border-bottom:1px solid var(--border);overflow:hidden;
    background:linear-gradient(90deg,rgba(255,46,62,.09),rgba(255,194,75,.08));
    padding:16px 0;white-space:nowrap;
  }
  .marquee-track{display:inline-flex;gap:34px;animation:scroll 28s linear infinite;will-change:transform}
  .marquee-track span{font-family:'Unbounded';font-weight:700;font-size:1rem;letter-spacing:1px;color:var(--ink);opacity:.85;display:inline-flex;align-items:center;gap:34px}
  .marquee-track span::after{content:"●";color:var(--red);font-size:.6rem}
  @keyframes scroll{to{transform:translateX(-50%)}}

  /* ============ PANELS ============ */
  #panels{scroll-margin-top:90px;padding:clamp(56px,8vw,96px) 0}
  .panel{display:none}
  .panel.active{display:block;animation:panelIn .55s cubic-bezier(.2,.7,.2,1) both}
  @keyframes panelIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
  .panel.active .reveal{animation:fadeUp .65s cubic-bezier(.2,.7,.2,1) both}
  .panel.active .reveal:nth-child(2){animation-delay:.06s}
  .panel.active .reveal:nth-child(3){animation-delay:.12s}
  .panel.active .reveal:nth-child(4){animation-delay:.18s}
  .panel.active .reveal:nth-child(5){animation-delay:.24s}
  .panel.active .reveal:nth-child(6){animation-delay:.30s}
  .panel.active .reveal:nth-child(7){animation-delay:.36s}
  @keyframes fadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}

  .section-head{max-width:680px;margin-bottom:46px}
  .kicker{font-size:.74rem;letter-spacing:3px;text-transform:uppercase;font-weight:600;margin-bottom:16px;display:inline-block;font-family:'Unbounded'}
  .kicker.m{color:var(--red)} .kicker.c{color:var(--ember)} .kicker.a{color:var(--gold)} .kicker.v{color:var(--red)}
  .section-head h2{font-size:clamp(2rem,4.5vw,3.2rem);font-weight:800;line-height:1.02;letter-spacing:-.5px}
  .section-head p{color:var(--muted);font-size:1.05rem;margin-top:18px}

  .block-title{font-weight:800;font-size:clamp(1.3rem,2.6vw,1.85rem);margin:56px 0 26px;display:flex;align-items:center;gap:14px;letter-spacing:-.3px}
  .block-title::before{content:"";width:34px;height:5px;border-radius:5px;background:var(--grad);flex-shrink:0}
  .block-title.first{margin-top:6px}

  /* feature rows */
  .feature{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;align-items:center;margin-bottom:64px}
  .feature:nth-child(even){grid-template-columns:1fr 1.05fr}
  .feature:nth-child(even) .feature-media{order:-1}
  .feature-media{
    position:relative;border-radius:var(--radius);overflow:hidden;
    aspect-ratio:4/3;border:1px solid var(--border);box-shadow:var(--shadow);
    background:linear-gradient(135deg,rgba(255,46,62,.42),rgba(255,106,47,.35),rgba(255,194,75,.4));
  }
  .feature-media img,.feature-media svg.scene{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.1s ease}
  .feature-media:hover img,.feature-media:hover svg.scene{transform:scale(1.05)}
  .feature-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(8,6,8,.5))}
  .media-tag{
    position:absolute;top:16px;left:16px;z-index:2;font-family:'Unbounded';font-weight:700;
    font-size:.7rem;letter-spacing:1.5px;text-transform:uppercase;color:#fff;
    padding:8px 14px;border-radius:999px;background:rgba(8,6,8,.62);border:1px solid var(--border-strong);backdrop-filter:blur(6px)
  }
  .feature-body h3{font-size:clamp(1.5rem,3vw,2.1rem);font-weight:800;line-height:1.1;margin-bottom:16px}
  .feature-body h3 em{font-style:normal;color:var(--red)}
  .feature-body p{color:var(--muted);margin-bottom:18px}
  .tick-list{list-style:none;display:grid;gap:11px;margin:8px 0 26px}
  .tick-list li{display:flex;gap:12px;align-items:flex-start;font-size:.94rem;color:var(--ink)}
  .tick-list svg{width:20px;height:20px;flex-shrink:0;margin-top:2px}
  .price-pill{display:inline-flex;flex-wrap:wrap;gap:8px;margin-bottom:26px}
  .price-pill span{background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:10px 15px;font-size:.85rem;color:var(--ink)}
  .price-pill span b{font-family:'Unbounded';color:var(--gold-soft)}

  /* card grid */
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px}
  .card{
    position:relative;border:1px solid var(--border);border-radius:var(--radius);
    padding:30px;background:var(--surface);overflow:hidden;transition:.35s;display:flex;flex-direction:column;
  }
  .card::after{content:"";position:absolute;left:0;top:0;height:3px;width:100%;background:var(--grad);transform:scaleX(0);transform-origin:left;transition:transform .4s}
  .card:hover{transform:translateY(-7px);border-color:var(--border-strong);background:var(--surface-2);box-shadow:var(--shadow)}
  .card:hover::after{transform:scaleX(1)}
  .card-icon{
    width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;
    margin-bottom:20px;background:linear-gradient(135deg,rgba(255,46,62,.22),rgba(255,194,75,.18));
    border:1px solid var(--border-strong)
  }
  .card-icon svg{width:26px;height:26px}
  .card h3{font-size:1.22rem;font-weight:700;margin-bottom:11px;font-family:'Unbounded'}
  .card p{color:var(--muted);font-size:.92rem;margin-bottom:18px}
  .card-link{display:inline-flex;align-items:center;gap:8px;color:var(--gold-soft);font-weight:600;font-size:.85rem;cursor:pointer;margin-top:auto}
  .card-link svg{width:15px;height:15px;transition:.25s}
  .card:hover .card-link svg{transform:translateX(4px)}

  /* promo / deal card */
  .card.promo{border-top:1px solid var(--border)}
  .day-tag{
    align-self:flex-start;display:inline-flex;align-items:center;gap:7px;
    font-weight:700;font-size:.66rem;letter-spacing:1.2px;text-transform:uppercase;color:#fff;
    padding:7px 13px;border-radius:999px;background:linear-gradient(120deg,var(--red),var(--ember));
    box-shadow:0 8px 20px -8px rgba(255,46,62,.85);margin-bottom:16px
  }
  .card.promo h3{font-size:1.18rem;margin-bottom:9px}
  .deal-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:auto;padding-top:18px;border-top:1px solid var(--border)}
  .deal-price{font-weight:800;font-size:1.45rem;line-height:1.05;color:var(--gold-soft)}
  .deal-price small{display:block;font-family:'Sora';font-weight:400;font-size:.68rem;color:var(--muted-2);letter-spacing:.3px;margin-top:5px}

  .badge-row{display:flex;flex-wrap:wrap;gap:14px;margin-top:48px;padding:24px;border:1px dashed var(--border-strong);border-radius:var(--radius);background:var(--surface);align-items:center}
  .badge-row .bi{display:flex;align-items:center;gap:12px;font-size:.9rem;color:var(--ink)}
  .badge-row .bi svg{width:26px;height:26px;color:var(--gold)}
  .badge-row .bi b{font-family:'Unbounded';font-weight:700}

  /* ============ CONTACT ============ */
  .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:34px;align-items:start}
  .info-stack{display:grid;gap:16px}
  .info-card{display:flex;gap:18px;align-items:flex-start;padding:22px;border-radius:18px;background:var(--surface);border:1px solid var(--border);transition:.3s}
  .info-card:hover{border-color:var(--border-strong);background:var(--surface-2)}
  .info-card .ico{width:48px;height:48px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(255,46,62,.24),rgba(255,106,47,.22));border:1px solid var(--border-strong)}
  .info-card .ico svg{width:22px;height:22px}
  .info-card .label{font-size:.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted-2);margin-bottom:5px}
  .info-card .val{font-weight:600;font-size:1rem;line-height:1.45}
  .info-card .val a:hover{color:var(--gold-soft)}

  .hours{padding:24px;border-radius:18px;background:var(--surface);border:1px solid var(--border)}
  .hours h4{font-family:'Unbounded';font-size:1rem;margin-bottom:16px;display:flex;align-items:center;gap:10px}
  .hours h4 svg{width:18px;height:18px;color:var(--gold)}
  .hours ul{list-style:none;display:grid;gap:2px}
  .hours li{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:.9rem}
  .hours li:last-child{border:none}
  .hours li span:first-child{color:var(--muted)}
  .hours li span:last-child{font-weight:600;color:var(--ink)}
  .hours .note{font-size:.78rem;color:var(--muted-2);margin-top:12px;font-style:italic}

  .form-card{padding:30px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--border)}
  .form-card h3{font-family:'Unbounded';font-size:1.3rem;margin-bottom:6px}
  .form-card .sub{color:var(--muted);font-size:.9rem;margin-bottom:24px}
  .field{margin-bottom:16px}
  .field label{display:block;font-size:.76rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
  .field input,.field textarea{
    width:100%;background:rgba(0,0,0,.35);border:1px solid var(--border);border-radius:12px;
    padding:14px 16px;color:var(--ink);font-family:'Sora';font-size:.95rem;transition:.25s;resize:vertical
  }
  .field input:focus,.field textarea:focus{outline:none;border-color:var(--red);box-shadow:0 0 0 3px rgba(255,46,62,.16);background:rgba(0,0,0,.5)}
  .field input::placeholder,.field textarea::placeholder{color:var(--muted-2)}
  .form-card .btn{width:100%;justify-content:center;margin-top:6px}
  .form-note{font-size:.74rem;color:var(--muted-2);text-align:center;margin-top:14px}

  .map-wrap{margin-top:34px;border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);box-shadow:var(--shadow);position:relative}
  .map-wrap iframe{width:100%;height:380px;border:0;display:block;filter:grayscale(.3) contrast(1.05)}

  /* ============ FOOTER ============ */
  footer{border-top:1px solid var(--border);padding:60px 0 36px;margin-top:40px;position:relative;z-index:1;background:linear-gradient(180deg,transparent,rgba(255,46,62,.05))}
  .foot-top{display:flex;flex-wrap:wrap;gap:40px;justify-content:space-between;margin-bottom:40px}
  .foot-brand{max-width:340px}
  .foot-brand .brand{margin-bottom:16px}
  .foot-brand p{color:var(--muted);font-size:.9rem}
  .foot-cols{display:flex;gap:60px;flex-wrap:wrap}
  .foot-col h5{font-family:'Unbounded';font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
  .foot-col a,.foot-col span{display:block;color:var(--ink);font-size:.9rem;margin-bottom:11px;cursor:pointer;transition:.2s;opacity:.85}
  .foot-col a:hover{opacity:1;color:var(--gold-soft)}
  .socials{display:flex;gap:12px}
  .socials a{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--surface-2);border:1px solid var(--border);transition:.25s}
  .socials a:hover{background:var(--grad);transform:translateY(-3px)}
  .socials svg{width:19px;height:19px}
  .foot-bottom{padding-top:26px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;align-items:center}
  .foot-bottom p{font-size:.78rem;color:var(--muted-2)}
  .legal{font-size:.72rem;color:var(--muted-2);line-height:1.6;margin-top:6px;max-width:760px}

  /* ============ RESPONSIVE ============ */
  @media(max-width:900px){
    .nav-cta .lbl{display:none}
    .nav-cta{padding:11px 13px}
    .brand-sub{display:none}
    .feature,.feature:nth-child(even){grid-template-columns:1fr;gap:28px}
    .feature:nth-child(even) .feature-media{order:0}
    .contact-grid{grid-template-columns:1fr}
  }
  @media(max-width:640px){
    .wrap{padding:0 18px}
    .nav-inner{padding:12px 18px;gap:12px;flex-wrap:wrap}
    .tabs{order:3;width:100%;margin-left:0;padding-bottom:2px}
    .brand-logo,.brand-fallback{height:40px}
    .hero-actions{flex-direction:column;align-items:stretch}
    .btn{justify-content:center}
    .foot-cols{gap:36px}
  }
  @media(prefers-reduced-motion:reduce){
    *{animation:none!important;transition:none!important}
    html{scroll-behavior:auto}
  }
</style>
</head>
<body>

<!-- ============ NAV ============ -->
<header class="nav">
  <div class="nav-inner">
    <a href="#top" class="brand" onclick="showTab('activites');return false;">
      <img class="brand-logo" src="https://boulesetbilles.fun/wp-content/uploads/2018/11/cropped-bowling-de-Granville.png" alt="Boules et Billes" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="brand-fallback">B&amp;B</div>
      <div class="brand-txt">
        <span class="brand-name">BOULES <b>et</b> BILLES</span>
        <span class="brand-sub">Granville</span>
      </div>
    </a>

    <nav class="tabs" role="tablist" aria-label="Navigation principale">
      <button class="tab" role="tab" aria-selected="true" data-tab="activites" onclick="showTab('activites')">Activités</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="bar" onclick="showTab('bar')">Bar &amp; Restauration</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="offres" onclick="showTab('offres')">Offres</button>
      <button class="tab" role="tab" aria-selected="false" data-tab="contact" onclick="showTab('contact')">Contact</button>
    </nav>

    <a class="nav-cta" href="tel:+33233917677">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span class="lbl">02 33 91 76 77</span>
    </a>
  </div>
</header>

<!-- ============ HERO ============ -->
<section class="hero" id="top">
  <div class="hero-bg"></div>
  <div class="wrap">
    <span class="eyebrow"><span class="pulse"></span> Complexe de jeux · 511 rue du Conillot, Granville</span>
    <h1>Le terrain de jeu<br>de <span class="neon">Granville</span></h1>
    <p class="lead">Bowling, laser game dernière génération, billard et brasserie : une seule adresse pour s'amuser entre amis, en famille ou en équipe — jusque tard dans la nuit.</p>
    <div class="hero-actions">
      <button class="btn btn-primary" onclick="showTab('activites')">
        Découvrir les activités
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
      <button class="btn btn-ghost" onclick="showTab('offres')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"/></svg>
        Voir les bons plans
      </button>
    </div>
    <div class="hero-stats">
      <div class="chip"><span class="dot"></span><b>8</b>&nbsp;pistes de bowling</div>
      <div class="chip"><span class="dot"></span>Laser game <b>300&nbsp;m²</b></div>
      <div class="chip"><span class="dot"></span>Ouvert <b>jusqu'à 2h</b> le week-end</div>
      <div class="chip"><span class="dot"></span>Dès <b>4 ans</b></div>
    </div>
  </div>
</section>

<!-- ============ MARQUEE ============ -->
<div class="marquee" aria-hidden="true">
  <div class="marquee-track">
    <span>BOWLING</span><span>LASER GAME</span><span>BILLARD ANGLAIS</span><span>BRASSERIE</span><span>BONS PLANS</span><span>SOIRÉES</span>
    <span>BOWLING</span><span>LASER GAME</span><span>BILLARD ANGLAIS</span><span>BRASSERIE</span><span>BONS PLANS</span><span>SOIRÉES</span>
  </div>
</div>

<!-- ============ PANELS ============ -->
<main id="panels">
  <div class="wrap">

    <!-- ===== ACTIVITÉS ===== -->
    <section class="panel active" id="activites" role="tabpanel">
      <div class="section-head reveal">
        <span class="kicker m">Nos activités</span>
        <h2>De quoi vibrer à chaque visite</h2>
        <p>Un complexe de jeux dernière génération, pensé pour tous les âges et tous les niveaux. Choisissez votre terrain.</p>
      </div>

      <div class="feature reveal">
        <div class="feature-body">
          <h3><em>Bowling</em> — 8 pistes pour tous les niveaux</h3>
          <p>Notre salle s'adapte à tous les styles de jeu : débutants, enfants dès 4 ans ou joueurs confirmés (clubs, ligues et pros). Vous trouverez toujours votre place au cœur du bowling de Granville.</p>
          <ul class="tick-list">
            <li><svg viewBox="0 0 24 24" fill="none" stroke="#ff2e3e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> 8 pistes professionnelles</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="#ff2e3e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Lance-boules pour les plus petits</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="#ff2e3e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Billard anglais (8 pool), babyfoots & jeux vidéo</li>
          </ul>
          <a class="btn btn-primary" href="tel:+33233917677">Réserver une piste
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        </div>
        <div class="feature-media">
          <span class="media-tag">Bowling</span>
          <img src="https://boulesetbilles.fun/wp-content/uploads/2018/11/salle-de-bowling-et-jeux.jpg" alt="Salle de bowling de Granville : pistes et panneaux de pistes" loading="lazy" onerror="this.onerror=null;this.src='https://boulesetbilles.fun/wp-content/uploads/2018/11/2-1024x498.jpg'">
        </div>
      </div>

      <div class="feature reveal">
        <div class="feature-body">
          <h3><em>Laser Game</em> — l'immersion dernière génération</h3>
          <p>Une salle de 300 m², labyrinthique et futuriste, équipée d'un matériel de toute dernière génération pour des tirs d'une précision redoutable. Deux équipes, des pièges, des cachettes : gardez votre sang-froid et marquez un maximum de points !</p>
          <div class="price-pill">
            <span><b>9 €</b> · 20 min</span>
            <span><b>11 €</b> · 30 min</span>
            <span><b>14,50 €</b> · 2 × 20 min</span>
          </div>
          <a class="btn btn-primary" href="tel:+33233917677">Embarquer dans l'arène
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        </div>
        <div class="feature-media">
          <span class="media-tag">Laser Game</span>
          <img src="https://boulesetbilles.fun/wp-content/uploads/2024/02/laser-game-normandie.jpg" alt="Salle de laser game dernière génération à Granville" loading="lazy" onerror="this.onerror=null;this.src='https://boulesetbilles.fun/wp-content/uploads/2024/06/laser-game-de-granville.jpg'">
        </div>
      </div>
    </section>

    <!-- ===== BAR & RESTAURATION ===== -->
    <section class="panel" id="bar" role="tabpanel">
      <div class="section-head reveal">
        <span class="kicker a">Bar &amp; Restauration</span>
        <h2>Une brasserie conviviale au cœur du jeu</h2>
        <p>On s'y retrouve entre amis ou en famille, autour de plats simples et traditionnels — ou simplement pour boire un verre après une bonne partie.</p>
      </div>

      <div class="feature reveal">
        <div class="feature-body">
          <h3><em>Brasserie</em> & comptoir convivial</h3>
          <p>Notre espace brasserie se veut avant tout un endroit chaleureux et convivial. Des choses simples et gourmandes à partager, dans une ambiance détendue : l'arrêt parfait entre deux parties de bowling ou de laser game.</p>
          <ul class="tick-list">
            <li><svg viewBox="0 0 24 24" fill="none" stroke="#ffc24b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Bar ouvert & restauration sur place</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="#ffc24b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Tapas, frites, paninis & petites faims</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="#ffc24b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg> Réservation conseillée de 14h à minuit</li>
          </ul>
        </div>
        <div class="feature-media">
          <span class="media-tag">Brasserie</span>
          <svg class="scene" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration : une dizaine d'amis attablés autour de frites, nuggets et paninis, dans l'ambiance néon du bowling">
            <defs>
              <linearGradient id="bbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d0f12"/><stop offset=".55" stop-color="#120a0c"/><stop offset="1" stop-color="#090607"/></linearGradient>
              <radialGradient id="bgr" cx=".5" cy=".16" r=".62"><stop offset="0" stop-color="#ff2e3e" stop-opacity=".42"/><stop offset="1" stop-color="#ff2e3e" stop-opacity="0"/></radialGradient>
              <radialGradient id="bgo" cx=".8" cy=".1" r=".5"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".38"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>
              <radialGradient id="bvig" cx=".5" cy=".46" r=".75"><stop offset=".58" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
              <linearGradient id="btab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c2618"/><stop offset="1" stop-color="#1c110b"/></linearGradient>
              <linearGradient id="drink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd884"/><stop offset="1" stop-color="#ff8f2f"/></linearGradient>
              <g id="person"><path d="M-32,42 C-32,8 -16,-8 0,-8 C16,-8 32,8 32,42 Z" fill="#110b0c"/><circle cx="0" cy="-26" r="16" fill="#110b0c"/><path d="M-30,40 C-30,8 -15,-7 0,-7" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/><path d="M-13,-34 A16 16 0 0 1 14,-31" fill="none" stroke="currentColor" stroke-opacity=".42" stroke-width="2.2" stroke-linecap="round"/></g>
              <g id="glass"><path d="M-9,-19 L9,-19 L7,11 Q7,16 0,16 Q-7,16 -7,11 Z" fill="url(#drink)"/><ellipse cx="0" cy="-19" rx="9" ry="3" fill="#fff" opacity=".2"/><rect x="-6" y="-15" width="3" height="21" rx="1.5" fill="#fff" opacity=".22"/><path d="M-9,-19 L9,-19 L7,11 Q7,16 0,16 Q-7,16 -7,11 Z" fill="none" stroke="#ffd98a" stroke-opacity=".35" stroke-width="1.1"/></g>
              <g id="pin"><path d="M0,-30 c-4,0 -6,4 -5,8 c1,3 3,4 3,7 c0,3 -7,5 -7,14 c0,9 5,17 9,17 c4,0 9,-8 9,-17 c0,-9 -7,-11 -7,-14 c0,-3 2,-4 3,-7 c1,-4 -1,-8 -5,-8 z" fill="#f1e3e3"/><ellipse cx="0" cy="-11" rx="6" ry="2.3" fill="#ff2e3e"/></g>
            </defs>
            <rect width="800" height="600" fill="url(#bbg)"/>
            <rect width="800" height="600" fill="url(#bgr)"/>
            <rect width="800" height="600" fill="url(#bgo)"/>
            <g opacity=".5"><use href="#pin" transform="translate(86,72)"/><use href="#pin" transform="translate(120,84) scale(.9)"/><use href="#pin" transform="translate(60,92) scale(.85)"/></g>
            <g opacity=".55"><circle cx="722" cy="92" r="20" fill="#140809" stroke="#ff5a4f" stroke-opacity=".5" stroke-width="1.5"/><circle cx="716" cy="86" r="2.4" fill="#ff8a3a"/><circle cx="726" cy="85" r="2.4" fill="#ff8a3a"/><circle cx="721" cy="94" r="2.4" fill="#ff8a3a"/></g>
            <use href="#person" transform="translate(235,372) scale(.82)" style="color:#ffcf6b"/>
            <use href="#person" transform="translate(320,363) scale(.78)" style="color:#ff6b6b"/>
            <use href="#person" transform="translate(448,356) scale(.74)" style="color:#ff6b6b"/>
            <use href="#person" transform="translate(405,360) scale(.78)" style="color:#ffcf6b"/>
            <use href="#person" transform="translate(490,363) scale(.78)" style="color:#ff6b6b"/>
            <use href="#person" transform="translate(575,372) scale(.82)" style="color:#ffcf6b"/>
            <ellipse cx="400" cy="548" rx="298" ry="34" fill="#000" opacity=".4"/>
            <ellipse cx="400" cy="450" rx="300" ry="78" fill="url(#btab)"/>
            <ellipse cx="400" cy="436" rx="272" ry="58" fill="#fff" opacity=".05"/>
            <ellipse cx="400" cy="450" rx="300" ry="78" fill="none" stroke="#ffc24b" stroke-opacity=".22" stroke-width="2"/>
            <g>
              <rect x="232" y="406" width="6" height="30" rx="2" transform="rotate(-7 235 421)" fill="#ffce5a" stroke="#dca23c" stroke-width=".8"/>
              <rect x="244" y="402" width="6" height="32" rx="2" transform="rotate(3 247 418)" fill="#ffd66a" stroke="#dca23c" stroke-width=".8"/>
              <rect x="256" y="405" width="6" height="30" rx="2" transform="rotate(10 259 420)" fill="#ffce5a" stroke="#dca23c" stroke-width=".8"/>
              <rect x="250" y="408" width="6" height="28" rx="2" transform="rotate(-3 253 422)" fill="#ffd66a" stroke="#dca23c" stroke-width=".8"/>
              <path d="M228,470 L268,470 L274,430 L222,430 Z" fill="#d4342f"/>
              <rect x="236" y="432" width="4" height="36" fill="#f3e9e9" opacity=".75"/>
              <rect x="252" y="432" width="4" height="36" fill="#f3e9e9" opacity=".75"/>
            </g>
            <ellipse cx="400" cy="460" rx="54" ry="16" fill="#231711" stroke="#3b2b21" stroke-width="1"/>
            <g fill="#efab43" stroke="#c78a2e" stroke-width="1">
              <ellipse cx="382" cy="456" rx="14" ry="9" transform="rotate(-18 382 456)"/>
              <ellipse cx="404" cy="452" rx="14" ry="9" transform="rotate(12 404 452)"/>
              <ellipse cx="420" cy="459" rx="13" ry="8.5" transform="rotate(-8 420 459)"/>
              <ellipse cx="391" cy="464" rx="13" ry="8.5" transform="rotate(20 391 464)"/>
              <ellipse cx="411" cy="464" rx="12" ry="8" transform="rotate(-22 411 464)"/>
            </g>
            <ellipse cx="440" cy="454" rx="7" ry="4" fill="#d4342f"/>
            <ellipse cx="540" cy="448" rx="50" ry="15" fill="#231711" stroke="#3b2b21" stroke-width="1"/>
            <g>
              <path d="M510,448 L546,438 L556,450 L520,460 Z" fill="#e6b566" stroke="#c79443" stroke-width="1"/>
              <path d="M528,438 L562,430 L572,442 L538,450 Z" fill="#edbf73" stroke="#c79443" stroke-width="1"/>
              <path d="M520,446 L548,439" stroke="#7a4f2b" stroke-width="2" stroke-opacity=".55" stroke-linecap="round"/>
              <path d="M524,452 L552,445" stroke="#7a4f2b" stroke-width="2" stroke-opacity=".55" stroke-linecap="round"/>
              <path d="M538,440 L566,433" stroke="#7a4f2b" stroke-width="2" stroke-opacity=".5" stroke-linecap="round"/>
            </g>
            <use href="#glass" transform="translate(325,418)"/>
            <use href="#glass" transform="translate(470,424)"/>
            <use href="#glass" transform="translate(600,446) scale(.95)"/>
            <use href="#glass" transform="translate(214,452) scale(.95)"/>
            <use href="#person" transform="translate(130,408) scale(.95)" style="color:#ff6b6b"/>
            <use href="#person" transform="translate(670,408) scale(.95)" style="color:#ffcf6b"/>
            <use href="#person" transform="translate(292,566) scale(1.25)" style="color:#ff6b6b"/>
            <use href="#person" transform="translate(512,570) scale(1.3)" style="color:#ffcf6b"/>
            <rect width="800" height="600" fill="url(#bvig)"/>
          </svg>
        </div>
      </div>

      <div class="grid reveal">
        <div class="card">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#ffc24b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg></div>
          <h3>Un verre entre amis</h3>
          <p>Boissons fraîches, ambiance décontractée : posez-vous au bar avant, pendant ou après le jeu.</p>
        </div>
        <div class="card">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#ff2e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-3 5v6c0 1.1.9 2 2 2h1zm0 0v7"/></svg></div>
          <h3>Pause gourmande</h3>
          <p>Tapas, frites, paninis et autres petites faims pour reprendre des forces entre deux strikes.</p>
        </div>
        <div class="card">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#ff6a2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <h3>Privatisation</h3>
          <p>Départ en retraite, repas d'équipe, événement d'entreprise : privatisez le resto, on s'occupe du reste.</p>
          <span class="card-link" onclick="showTab('contact')">Nous écrire <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </div>
    </section>

    <!-- ===== OFFRES ===== -->
    <section class="panel" id="offres" role="tabpanel">
      <div class="section-head reveal">
        <span class="kicker c">Offres &amp; Bons plans</span>
        <h2>Des formules pour toutes les occasions</h2>
        <p>Chaque jour son bon plan, et des formules sur mesure pour les groupes et les entreprises. Réservation au 02 33 91 76 77.</p>
      </div>

      <!-- Bons plans de la semaine -->
      <h3 class="block-title first reveal">Les bons plans de la semaine</h3>
      <div class="grid reveal">
        <div class="card promo">
          <span class="day-tag">Lun – Jeu · 14h-18h</span>
          <h3>Unlimited Bowl</h3>
          <p>Bowling en illimité tout l'après-midi, à prix fixe. Enchaînez les parties autant que vous le souhaitez.</p>
          <div class="deal-foot">
            <div class="deal-price">15 €<small>l'après-midi, en illimité</small></div>
            <span class="card-link" onclick="showTab('contact')">Réserver <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>

        <div class="card promo">
          <span class="day-tag">Mardi</span>
          <h3>Le mardi, tout permis</h3>
          <p>Une partie achetée vous donne droit à une boisson offerte ou à une seconde partie offerte. C'est vous qui choisissez votre bonus !</p>
          <div class="deal-foot">
            <div class="deal-price">1 = 1 offert<small>boisson ou partie</small></div>
            <span class="card-link" onclick="showTab('contact')">Réserver <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>

        <div class="card promo">
          <span class="day-tag">Mercredi</span>
          <h3>Mercredi Family Bowl</h3>
          <p>Sortie en famille : une partie offerte pour les enfants et petits-enfants qui accompagnent parents et grands-parents.</p>
          <div class="deal-foot">
            <div class="deal-price">Offert<small>une partie pour les enfants</small></div>
            <span class="card-link" onclick="showTab('contact')">Réserver <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>

        <div class="card promo">
          <span class="day-tag">Jeudi</span>
          <h3>Jeudi Campus</h3>
          <p>Le QG des étudiants : sur présentation de la carte étudiante, 1 € de moins sur tout, et la pinte à -2 €.</p>
          <div class="deal-foot">
            <div class="deal-price">-1 €<small>sur tout · pinte à -2 €</small></div>
            <span class="card-link" onclick="showTab('contact')">En profiter <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>

        <div class="card promo">
          <span class="day-tag">Vendredi soir</span>
          <h3>Pizza Strike</h3>
          <p>1 pizza + 1 boisson + 1 partie de bowling. Le food-truck pizza s'installe sur le parking : la soirée complète, au même endroit.</p>
          <div class="deal-foot">
            <div class="deal-price">20 €<small>pizza + boisson + partie</small></div>
            <span class="card-link" onclick="showTab('contact')">Réserver <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>
      </div>

      <!-- Entreprises & afterwork -->
      <h3 class="block-title reveal">Pour les entreprises & l'afterwork</h3>
      <div class="grid reveal">
        <div class="card promo">
          <span class="day-tag">17h30 – 19h30</span>
          <h3>Afterwork collègues</h3>
          <p>Une piste réservée pour 6 personnes, une planche apéro (charcuterie & fromage) et une girafe de bière ou deux bouteilles de vin. Le moment parfait après le boulot.</p>
          <div class="deal-foot">
            <div class="deal-price">90 €<small>tout compris · 6 personnes</small></div>
            <span class="card-link" onclick="showTab('contact')">Réserver <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>

        <div class="card promo">
          <span class="day-tag">Chaque mois</span>
          <h3>Challenge Inter-Entreprise</h3>
          <p>Un tournoi mensuel entre entreprises locales. L'équipe gagnante remporte le trophée à remettre en jeu et un bon d'achat. La compétition amicale qui soude les équipes.</p>
          <div class="deal-foot">
            <div class="deal-price">Trophée<small>+ bon d'achat à gagner</small></div>
            <span class="card-link" onclick="showTab('contact')">Inscrire mon équipe <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>

        <div class="card promo">
          <span class="day-tag">Sur mesure</span>
          <h3>Entreprises & CE</h3>
          <p>Séminaire, départ en retraite, team-building : privatisez tout ou partie du complexe et exposez-nous vos envies, on construit la formule avec vous.</p>
          <div class="deal-foot">
            <div class="deal-price">Sur devis<small>formule personnalisée</small></div>
            <span class="card-link" onclick="showTab('contact')">Demander un devis <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          </div>
        </div>
      </div>

      <!-- Événements & groupes -->
      <h3 class="block-title reveal">Événements & groupes</h3>
      <div class="grid reveal">
        <div class="card">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#ff2e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>
          <h3>Anniversaires & Soirées</h3>
          <p>Une formule clé en main pour fêter ça en grand, dès le plus jeune âge. Renseignez-vous sur nos parties offertes !</p>
          <span class="card-link" onclick="showTab('contact')">Organiser <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
        <div class="card">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#ffc24b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 16.8 5.7 21.4 8 14 2 9.4h7.6z"/></svg></div>
          <h3>EVJF & EVG</h3>
          <p>Bowling, laser game, bar… tout est réuni pour un enterrement de vie de célibataire mémorable entre amis.</p>
          <span class="card-link" onclick="showTab('contact')">Réserver <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
        <div class="card">
          <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#ff6a2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg></div>
          <h3>Affiches & invitations</h3>
          <p>Besoin d'une affiche ou de cartons d'invitation pour votre événement ? On vous donne un coup de pouce.</p>
          <span class="card-link" onclick="showTab('contact')">Nous contacter <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </div>

      <div class="badge-row reveal">
        <div class="bi">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span>Nous acceptons les <b>Chèques Vacances ANCV</b></span>
        </div>
        <div class="bi">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>Une <b>partie offerte</b> pour les anniversaires</span>
        </div>
        <a class="btn btn-primary" href="tel:+33233917677" style="margin-left:auto">Composer le 02 33 91 76 77</a>
      </div>
    </section>

    <!-- ===== CONTACT ===== -->
    <section class="panel" id="contact" role="tabpanel">
      <div class="section-head reveal">
        <span class="kicker v">Contact</span>
        <h2>On vous attend à Granville</h2>
        <p>Une question, une réservation, un événement à organiser ? Écrivez-nous ou passez nous voir.</p>
      </div>

      <div class="contact-grid">
        <div class="reveal">
          <div class="info-stack">
            <div class="info-card">
              <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#ff2e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
              <div><div class="label">Adresse</div><div class="val">511 rue du Conillot<br>50400 Granville</div></div>
            </div>
            <div class="info-card">
              <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#ffc24b" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
              <div><div class="label">Téléphone</div><div class="val"><a href="tel:+33233917677">02 33 91 76 77</a></div></div>
            </div>
            <div class="info-card">
              <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#ff6a2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg></div>
              <div><div class="label">Email</div><div class="val"><a href="mailto:contact@boulesetbilles.fun">contact@boulesetbilles.fun</a></div></div>
            </div>
            <div class="hours">
              <h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Horaires d'ouverture</h4>
              <ul>
                <li><span>Mardi – Jeudi</span><span>14h00 – 1h00</span></li>
                <li><span>Vendredi – Samedi</span><span>14h00 – 2h00</span></li>
                <li><span>Dimanche</span><span>14h00 – 0h00</span></li>
                <li><span>Lundi (vac. scolaires)</span><span>14h00 – 19h00</span></li>
              </ul>
              <p class="note">Réservation conseillée pour la restauration, de 14h à minuit.</p>
            </div>
          </div>
        </div>

        <div class="form-card reveal">
          <h3>Écrivez-nous</h3>
          <p class="sub">Réponse rapide pour vos réservations et événements.</p>
          <form onsubmit="return sendMail(event)">
            <div class="field"><label for="cn">Votre nom</label><input id="cn" type="text" placeholder="Jean Dupont" required></div>
            <div class="field"><label for="ce">Votre e-mail</label><input id="ce" type="email" placeholder="jean@email.com" required></div>
            <div class="field"><label for="cs">Sujet</label><input id="cs" type="text" placeholder="Réservation anniversaire, devis groupe…"></div>
            <div class="field"><label for="cm">Votre message</label><textarea id="cm" rows="4" placeholder="Dites-nous tout…" required></textarea></div>
            <button class="btn btn-primary" type="submit">Envoyer le message
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
            <p class="form-note">Le formulaire ouvre votre messagerie. Vous pouvez aussi appeler le 02 33 91 76 77.</p>
          </form>
        </div>
      </div>

      <div class="map-wrap reveal">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2181.4376527614295!2d-1.5621465847111033!3d48.84044917928576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x480c053267c05bab%3A0x9fc40c314e3c9b0a!2s511+Rue+du+Conillot%2C+50400+Granville!5e1!3m2!1sfr!2sfr!4v1505728176507" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Carte Boules et Billes Granville"></iframe>
      </div>
    </section>

  </div>
</main>

<!-- ============ FOOTER ============ -->
<footer>
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-brand">
        <div class="brand">
          <img class="brand-logo" src="https://boulesetbilles.fun/wp-content/uploads/2018/11/cropped-bowling-de-Granville.png" alt="Boules et Billes" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="brand-fallback">B&amp;B</div>
          <div class="brand-txt"><span class="brand-name">BOULES <b>et</b> BILLES</span><span class="brand-sub">Granville</span></div>
        </div>
        <p>Le complexe de jeux de Granville : bowling, laser game, billard et brasserie. Le bon plan sortie, à deux pas du centre.</p>
      </div>
      <div class="foot-cols">
        <div class="foot-col">
          <h5>Activités</h5>
          <a onclick="showTab('activites')">Bowling</a>
          <a onclick="showTab('activites')">Laser Game</a>
          <a onclick="showTab('bar')">Bar & Resto</a>
        </div>
        <div class="foot-col">
          <h5>Infos</h5>
          <a onclick="showTab('offres')">Nos offres</a>
          <a onclick="showTab('contact')">Contact</a>
          <a href="tel:+33233917677">02 33 91 76 77</a>
          <a href="mailto:contact@boulesetbilles.fun">Nous écrire</a>
        </div>
        <div class="foot-col">
          <h5>Suivez-nous</h5>
          <div class="socials">
            <a href="https://www.facebook.com/boulesetbilles/" target="_blank" rel="noopener" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="mailto:contact@boulesetbilles.fun" aria-label="Email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
            </a>
            <a href="tel:+33233917677" aria-label="Téléphone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="foot-bottom">
      <p>© <span id="yr"></span> Boules et Billes — Bowling de Granville. Tous droits réservés.</p>
      <p>511 rue du Conillot, 50400 Granville</p>
    </div>
    <p class="legal">BOULES &amp; BILLES — SAS au capital de 80 000 € · SIRET 828 328 369 00016 · TVA Intracom FR28828328369 · Code APE 9311Z.</p>
  </div>
</footer>

<script>
  function showTab(id){
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected','false'));
    const panel = document.getElementById(id);
    if(panel) panel.classList.add('active');
    const tab = document.querySelector('.tab[data-tab="'+id+'"]');
    if(tab) tab.setAttribute('aria-selected','true');
    const target = document.getElementById('panels');
    const headerH = document.querySelector('header.nav').offsetHeight;
    const y = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({top:y, behavior:'smooth'});
  }

  function sendMail(e){
    e.preventDefault();
    const name = document.getElementById('cn').value.trim();
    const from = document.getElementById('ce').value.trim();
    const subjRaw = document.getElementById('cs').value.trim() || 'Demande via le site';
    const msg = document.getElementById('cm').value.trim();
    const subject = encodeURIComponent(subjRaw + ' — ' + name);
    const body = encodeURIComponent(msg + '\n\n— ' + name + '\n' + from);
    window.location.href = 'mailto:contact@boulesetbilles.fun?subject=' + subject + '&body=' + body;
    return false;
  }

  document.getElementById('yr').textContent = new Date().getFullYear();
</script>
</body>
</html>
