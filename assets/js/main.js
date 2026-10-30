/* Casa Solar — interações, consentimento LGPD, rastreamento e formulário */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIGURAÇÃO — edite aqui
     GTM_ID: contêiner já usado no site atual da Casa Solar.
     GA4, Meta Pixel e Google Ads devem ser configurados DENTRO do GTM,
     disparando nos eventos abaixo (ver README).
     LEAD_ENDPOINT: opcional. URL que recebe o lead via POST (JSON) —
     ex.: webhook do CRM, Make/Zapier ou Formspree. Vazio = só WhatsApp.
  ------------------------------------------------------------------ */
  var CONFIG = {
    GTM_ID: 'GTM-N5BCC326',
    WHATSAPP: '5584998974353',
    LEAD_ENDPOINT: '',
    CONSENT_KEY: 'cs_consent_v1'
  };

  var doc = document, root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  /* ---------------- Armazenamento seguro ---------------- */
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };

  /* ---------------- UTMs / click IDs ---------------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'wbraid', 'gbraid'];
  var attribution = (function () {
    var saved = {};
    try { saved = JSON.parse(store.get('cs_utm', true) || '{}') || {}; } catch (e) {}
    var params = new URLSearchParams(location.search), found = false;
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) { saved[k] = v.slice(0, 120); found = true; }
    });
    if (found) { saved.landing = location.pathname; store.set('cs_utm', JSON.stringify(saved), true); }
    return saved;
  })();
  function refTag() {
    var p = [attribution.utm_source, attribution.utm_medium, attribution.utm_campaign].filter(Boolean);
    return p.length ? '\n\n[ref: ' + p.join(' / ') + ']' : '';
  }
  function waUrl(text) {
    return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(text + refTag());
  }

  /* ---------------- Rastreamento ---------------- */
  function track(event, data) {
    var payload = { event: event };
    for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
    UTM_KEYS.forEach(function (k) { if (attribution[k]) payload[k] = attribution[k]; });
    window.dataLayer.push(payload);
  }

  /* ---------------- Consentimento (LGPD) + GTM ---------------- */
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted',
    wait_for_update: 500
  });

  var gtmLoaded = false;
  function loadGTM() {
    if (gtmLoaded || !/^GTM-[A-Z0-9]+$/.test(CONFIG.GTM_ID)) return;
    gtmLoaded = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = doc.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + CONFIG.GTM_ID;
    doc.head.appendChild(s);
  }
  function applyConsent(c) {
    gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied'
    });
    window.dataLayer.push({ event: 'consent_update', consent_analytics: !!c.analytics, consent_marketing: !!c.marketing });
    if (c.analytics || c.marketing) loadGTM();
  }

  var banner = doc.getElementById('cookie');
  var prefs = doc.getElementById('cookie-prefs');
  var cA = doc.getElementById('c-analytics'), cM = doc.getElementById('c-marketing');
  var prefsBtn = banner.querySelector('[data-consent="prefs"]');
  var lastFocus = null;

  function readConsent() { try { return JSON.parse(store.get(CONFIG.CONSENT_KEY)); } catch (e) { return null; } }
  function saveConsent(c) { c.ts = new Date().toISOString(); store.set(CONFIG.CONSENT_KEY, JSON.stringify(c)); applyConsent(c); hideBanner(); }
  function showBanner(withPrefs) {
    var c = readConsent() || {};
    cA.checked = !!c.analytics; cM.checked = !!c.marketing;
    banner.hidden = false;
    requestAnimationFrame(function () { banner.classList.add('is-on'); });
    if (withPrefs) togglePrefs(true);
  }
  function hideBanner() {
    banner.classList.remove('is-on');
    setTimeout(function () { banner.hidden = true; }, 450);
    if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  }
  function togglePrefs(on) {
    prefs.classList.toggle('is-on', on);
    prefsBtn.setAttribute('aria-expanded', String(on));
    prefsBtn.textContent = on ? 'Salvar escolhas' : 'Personalizar';
  }
  banner.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]'); if (!b) return;
    var t = b.getAttribute('data-consent');
    if (t === 'all') saveConsent({ analytics: true, marketing: true });
    else if (t === 'none') saveConsent({ analytics: false, marketing: false });
    else if (prefs.classList.contains('is-on')) saveConsent({ analytics: cA.checked, marketing: cM.checked });
    else { togglePrefs(true); cA.focus(); }
  });
  banner.addEventListener('keydown', function (e) { if (e.key === 'Escape' && readConsent()) hideBanner(); });
  doc.querySelectorAll('[data-open-cookies]').forEach(function (b) {
    b.addEventListener('click', function () { lastFocus = b; showBanner(true); cA.focus(); });
  });

  var existing = readConsent();
  if (existing) applyConsent(existing);
  if (location.hash === '#cookies') showBanner(true);
  else if (!existing) setTimeout(function () { showBanner(false); }, 1200);

  /* ---------------- Links de WhatsApp com mensagem + UTM ---------------- */
  doc.querySelectorAll('a[data-wa]').forEach(function (a) { a.href = waUrl(a.getAttribute('data-wa')); });

  /* ---------------- Cliques rastreados ---------------- */
  doc.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]'); if (!el) return;
    track(el.getAttribute('data-track'), { click_label: el.getAttribute('data-label') || '', link_url: el.href || '' });
  });

  /* ---------------- Header, progresso e menu ativo ---------------- */
  var header = doc.querySelector('.header');
  var progress = doc.querySelector('.progress');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, h = doc.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('is-solid', y > 24);
    progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
    updateSteps(); parallax();
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  var navLinks = [].slice.call(doc.querySelectorAll('.nav a[href^="#"]:not(.btn)'));
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.toggleAttribute('aria-current', l.getAttribute('href') === '#' + en.target.id); if (l.hasAttribute('aria-current')) l.setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (l) { var s = doc.querySelector(l.getAttribute('href')); if (s) secObs.observe(s); });
  }

  /* menu mobile */
  var menuBtn = doc.querySelector('.menu-btn'), nav = doc.getElementById('menu');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    doc.body.style.overflow = open ? 'hidden' : '';
    if (open) { var f = nav.querySelector('a'); if (f) f.focus(); }
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    if (e.key === 'Tab' && nav.classList.contains('is-open')) {
      var items = [menuBtn].concat([].slice.call(nav.querySelectorAll('a')));
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* ---------------- Hero: entrada do título ---------------- */
  var hero = doc.querySelector('.hero');
  function heroReady() { hero.classList.add('is-ready'); }
  if (doc.fonts && doc.fonts.ready) { Promise.race([doc.fonts.ready, new Promise(function (r) { setTimeout(r, 400); })]).then(heroReady); }
  else heroReady();

  /* ---------------- Reveal + contadores + gráfico ---------------- */
  function countUp(el) {
    var end = +el.getAttribute('data-count');
    if (reduceMotion || end < 2) { el.textContent = end; return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  function countDec(el) {
    var raw = el.getAttribute('data-count-dec'), end = parseFloat(raw.replace(',', '.'));
    if (reduceMotion || !end) return;
    var t0 = null, dur = 1300;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? (end * e).toFixed(2).replace('.', ',') : raw;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var revealEls = doc.querySelectorAll('[data-reveal], #chart, #gauge');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.querySelectorAll('[data-count]').forEach(countUp);
        en.target.querySelectorAll('[data-count-dec]').forEach(countDec);
        io.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- Linha do processo (sequencial 01→04) ---------------- */
  var stepsWrap = doc.getElementById('steps');
  var stepsLine = stepsWrap.querySelector('.steps__line');
  var stepItems = [].slice.call(stepsWrap.querySelectorAll('.step'));
  function updateSteps() {
    var r = stepsWrap.getBoundingClientRect();
    var p = (innerHeight * 0.78 - r.top) / (r.height + innerHeight * 0.25);
    p = Math.max(0, Math.min(1, p));
    stepsLine.style.setProperty('--p', p.toFixed(3));
    var lit = Math.round(p * stepItems.length + 0.15);
    stepItems.forEach(function (s, i) { s.classList.toggle('is-lit', i < lit); });
  }

  /* ---------------- Parallax sutil ---------------- */
  var parEls = reduceMotion ? [] : [].slice.call(doc.querySelectorAll('[data-parallax]'));
  function parallax() {
    parEls.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var f = +el.getAttribute('data-parallax');
      var c = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = 'translate3d(0,' + (c * -f).toFixed(1) + 'px,0) scale(' + (1 + f) + ')';
    });
  }
  onScroll();

  /* ---------------- Filtro de projetos ---------------- */
  var filters = doc.querySelectorAll('.filter');
  var cards = doc.querySelectorAll('#cards .card');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      cards.forEach(function (c) {
        var show = f === 'todos' || c.getAttribute('data-type').split(' ').indexOf(f) > -1;
        c.hidden = !show;
        if (show && !reduceMotion) { c.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' }); }
      });
      track('project_filter', { filter: f });
    });
  });

  /* ---------------- FAQ e vídeo ---------------- */
  doc.querySelectorAll('.qa').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_open', { question: d.querySelector('summary').textContent.trim().slice(0, 90) }); });
  });
  var video = doc.getElementById('prova-video');
  if (video) video.addEventListener('play', function once() { track('video_play', { video: 'prova_social' }); video.removeEventListener('play', once); });

  /* ---------------- Formulário ---------------- */
  var form = doc.getElementById('lead-form');
  var phone = doc.getElementById('f-whats');
  function digits(v) { return (v || '').replace(/\D/g, ''); }
  phone.addEventListener('input', function () {
    var d = digits(phone.value).slice(0, 11), out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(d.length - 4);
    phone.value = out;
  });

  var rules = {
    'f-nome': function (v) { v = v.trim(); return v.length < 3 ? 'Informe seu nome completo.' : (/[<>{}]/.test(v) ? 'Use apenas letras no nome.' : ''); },
    'f-whats': function (v) { var d = digits(v); return (d.length < 10 || d.length > 11) ? 'Informe um WhatsApp válido com DDD.' : ''; },
    'f-cidade': function (v) { return v.trim().length < 2 ? 'Informe sua cidade.' : ''; },
    'f-tipo': function (v) { return v ? '' : 'Selecione o tipo de imóvel.'; },
    'f-lgpd': function (_, el) { return el.checked ? '' : 'É preciso concordar para receber o orçamento.'; }
  };
  var errIds = { 'f-nome': 'e-nome', 'f-whats': 'e-whats', 'f-cidade': 'e-cidade', 'f-tipo': 'e-tipo', 'f-lgpd': 'e-lgpd' };
  function validate(id) {
    var el = doc.getElementById(id), msg = rules[id](el.value, el);
    doc.getElementById(errIds[id]).textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  Object.keys(rules).forEach(function (id) {
    var el = doc.getElementById(id);
    el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox') validate(id); });
    el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') validate(id); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') validate(id); });
  });

  var started = false;
  form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start', { form: 'orcamento' }); } });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (id) { if (!validate(id) && !firstBad) firstBad = doc.getElementById(id); });
    if (firstBad) { firstBad.focus(); track('form_error', { form: 'orcamento' }); return; }
    if (form.site.value) return; // honeypot: bot

    var data = {
      nome: form.nome.value.trim().slice(0, 80),
      whatsapp: form.whatsapp.value.trim(),
      cidade: form.cidade.value.trim().slice(0, 60),
      tipo: form.tipo.value,
      conta: form.conta.value || 'Não informado'
    };
    var msg = 'Olá! Vim pelo site e gostaria de um orçamento de energia solar.\n\n' +
      'Nome: ' + data.nome + '\nWhatsApp: ' + data.whatsapp + '\nCidade: ' + data.cidade +
      '\nTipo de imóvel: ' + data.tipo + '\nConta de luz média: ' + data.conta;
    var url = waUrl(msg);

    // abre o WhatsApp no mesmo gesto do usuário (evita bloqueio de pop-up)
    var win = window.open(url, '_blank');
    if (win) { try { win.opener = null; } catch (err) {} }

    track('generate_lead', { form: 'orcamento', lead_type: data.tipo, lead_city: data.cidade, bill_range: data.conta, method: 'whatsapp' });

    if (CONFIG.LEAD_ENDPOINT) {
      var body = JSON.stringify(Object.assign({ origem: location.href, consentimento_lgpd: true, data_hora: new Date().toISOString() }, data, attribution));
      try {
        fetch(CONFIG.LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
      } catch (err) {}
    }

    var fb = doc.getElementById('wa-fallback');
    fb.href = url;
    form.parentNode.hidden = true;
    var ok = doc.querySelector('.form-success');
    ok.classList.add('is-on');
    ok.focus();
    if (!win) fb.textContent = 'Toque para abrir o WhatsApp';
  });
})();
