/* ============================================================
   CMG · Doctor 365 — Banner flotante universal
   Se auto-carga Firebase si no está disponible.
   Solo visible para usuarios con solicitud D365 registrada.
   ============================================================ */
(function () {
  'use strict';

  /* No mostrar en páginas de inscripción/felicitaciones */
  if (document.body && document.body.dataset.noD365Banner) return;

  var CDN  = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var CFG  = {
    apiKey           : 'AIzaSyDDQgAYZn-xj0eZY_N7Flbks4annkAP3gw',
    authDomain       : 'clinica-medica-general.firebaseapp.com',
    projectId        : 'clinica-medica-general',
    storageBucket    : 'clinica-medica-general.firebasestorage.app',
    messagingSenderId: '932619628471',
    appId            : '1:932619628471:web:9a57d62b673165f0fec232'
  };
  var CACHE_KEY = 'cmg-d365-status';
  var CACHE_TTL = 60 * 60 * 1000; /* 1 hora */

  /* ── Cargar scripts secuencialmente ── */
  function loadSeq(urls, cb) {
    if (!urls.length) { cb(); return; }
    var s = document.createElement('script');
    s.src = urls[0];
    s.onload  = function () { loadSeq(urls.slice(1), cb); };
    s.onerror = function () { loadSeq(urls.slice(1), cb); };
    document.head.appendChild(s);
  }

  /* ── Init Firebase y verificar membresía ── */
  function initAndCheck() {
    if (!firebase.apps.length) firebase.initializeApp(CFG);
    var auth = firebase.auth();
    var db   = firebase.firestore();

    auth.onAuthStateChanged(function (user) {
      if (!user) { clearCache(); return; }

      /* Intentar desde caché primero */
      try {
        var cached = JSON.parse(localStorage.getItem(CACHE_KEY));
        if (cached && cached.uid === user.uid && Date.now() < cached.exp) {
          if (cached.enrolled) renderBanner(cached.data);
          return;
        }
      } catch (e) { /* ignorar */ }

      /* Consultar Firestore */
      db.collection('d365solicitudes')
        .where('userId', '==', user.uid)
        .limit(1)
        .get()
        .then(function (snap) {
          if (snap.empty) {
            saveCache(user.uid, false, null);
          } else {
            var data = snap.docs[0].data();
            saveCache(user.uid, true, data);
            renderBanner(data);
          }
        })
        .catch(function () { /* fail silently */ });
    });
  }

  function saveCache(uid, enrolled, data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        uid: uid, enrolled: enrolled, data: data,
        exp: Date.now() + CACHE_TTL
      }));
    } catch (e) { /* ignorar */ }
  }

  function clearCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignorar */ }
  }

  /* ── Renderizar banner flotante ── */
  function renderBanner(data) {
    if (document.getElementById('cmg-d365-float')) return; /* no duplicar */

    var estado  = data.estado || 'pendiente';
    var nombre  = data.nombre || '';
    var isPend  = estado === 'pendiente';

    /* Inyectar CSS */
    var style = document.createElement('style');
    style.textContent = [
      '#cmg-d365-float{',
        'position:fixed;bottom:24px;left:24px;z-index:9998;',
        'max-width:220px;font-family:inherit;',
      '}',
      '#cmg-d365-float a{',
        'display:block;text-decoration:none;',
        'background:#213C7D;',
        'border:2px solid #FDD22C;',
        'border-radius:16px;',
        'padding:14px 16px;',
        'box-shadow:0 8px 32px rgba(33,60,125,.4);',
        'transition:transform .2s,box-shadow .2s;',
        'animation:cmgD365In .4s cubic-bezier(.34,1.56,.64,1) both;',
      '}',
      '#cmg-d365-float a:hover{',
        'transform:translateY(-3px);',
        'box-shadow:0 14px 40px rgba(33,60,125,.5);',
      '}',
      '.cmgD365Badge{',
        'display:inline-flex;align-items:center;gap:5px;',
        'background:#FDD22C;color:#213C7D;',
        'border-radius:20px;padding:3px 10px;',
        'font-size:10px;font-weight:900;letter-spacing:.5px;',
        'text-transform:uppercase;margin-bottom:9px;',
      '}',
      '.cmgD365Title{',
        'font-size:13px;font-weight:700;color:#fff;',
        'line-height:1.3;margin-bottom:4px;',
      '}',
      '.cmgD365Sub{',
        'font-size:11px;color:rgba(255,255,255,.65);line-height:1.45;',
      '}',
      '.cmgD365Cta{',
        'display:block;margin-top:10px;',
        'background:#FDD22C;color:#213C7D;',
        'border-radius:8px;padding:6px 12px;',
        'font-size:11px;font-weight:900;',
        'text-align:center;letter-spacing:.3px;',
      '}',
      '@keyframes cmgD365In{',
        'from{opacity:0;transform:translateY(20px) scale(.92)}',
        'to{opacity:1;transform:translateY(0) scale(1)}',
      '}',
      '@media(max-width:480px){',
        '#cmg-d365-float{bottom:16px;left:12px;max-width:190px;}',
      '}'
    ].join('');
    document.head.appendChild(style);

    /* Inyectar HTML */
    var wrap = document.createElement('div');
    wrap.id  = 'cmg-d365-float';

    var badge = isPend
      ? '⏳ Doctor 365'
      : '✅ Doctor 365';

    var title = isPend
      ? '¡Solicitud enviada!'
      : '¡Membresía Activa!';

    var sub = isPend
      ? 'Activa tu cuenta<br>pagando L900 en caja'
      : 'Disfruta todos tus<br>beneficios CMG';

    var cta = isPend
      ? 'Ver detalles →'
      : 'Ver membresía →';

    wrap.innerHTML =
      '<a href="Felicitaciones.html">' +
        '<div class="cmgD365Badge">' + badge + '</div>' +
        '<div class="cmgD365Title">' + title + '</div>' +
        '<div class="cmgD365Sub">' + sub + '</div>' +
        '<div class="cmgD365Cta">' + cta + '</div>' +
      '</a>';

    document.body.appendChild(wrap);
  }

  /* ── Arrancar ── */
  function start() {
    if (typeof firebase !== 'undefined') {
      initAndCheck();
    } else {
      loadSeq([
        CDN + 'firebase-app-compat.js',
        CDN + 'firebase-auth-compat.js',
        CDN + 'firebase-firestore-compat.js'
      ], initAndCheck);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
