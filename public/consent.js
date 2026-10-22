// Cookie consent banner (KVKK / GDPR), shared by the marketing site and the docs.
//
// Served at /consent.js. The docs are deployed under /docs/ on the same origin,
// so they load this same file and the visitor's choice (localStorage) carries
// over between the two. Until the visitor accepts:
//   - Google tags run in Consent Mode with every storage type "denied" (the
//     default is set by an inline snippet ahead of GTM — vite.config.js and
//     docs-site/docusaurus.config.ts), so they set no cookies;
//   - the Tawk.to live chat is not loaded at all.
// Any link to "#cookie-preferences" (site and docs footers) reopens the banner.
(function () {
  var KEY = 'elchi-consent';
  var TAWK_SRC = 'https://embed.tawk.to/6ad9ee18aaa3a33459814448/1k5hkk3r2';

  var TEXT = {
    en: {
      body: 'We use cookies for analytics (Google Tag Manager) and for the live chat (Tawk.to). They are only set if you accept. You can change your choice at any time via “Cookie preferences” in the footer.',
      accept: 'Accept',
      reject: 'Reject',
      label: 'Cookie consent',
    },
    tr: {
      body: 'Analiz (Google Tag Manager) ve canlı destek (Tawk.to) için çerez kullanıyoruz. Bu çerezler yalnızca onay vermeniz halinde kullanılır. Tercihinizi sayfa altındaki “Çerez tercihleri” bağlantısından istediğiniz zaman değiştirebilirsiniz.',
      accept: 'Kabul et',
      reject: 'Reddet',
      label: 'Çerez onayı',
    },
  };

  var CSS =
    '.elchi-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:720px;margin:0 auto;' +
    'display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;padding:16px 20px;border-radius:12px;' +
    'background:#ffffff;color:#334155;border:1px solid rgba(15,23,42,.14);box-shadow:0 10px 30px rgba(15,23,42,.12);' +
    'font:14px/1.5 Inter,system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.elchi-consent p{flex:1 1 320px;margin:0}' +
    '.elchi-consent-actions{display:flex;gap:8px;margin-left:auto}' +
    '.elchi-consent button{font:inherit;font-weight:600;cursor:pointer;padding:8px 18px;border-radius:8px;' +
    'border:1px solid #2563eb;background:#2563eb;color:#fff}' +
    '.elchi-consent button:focus-visible{outline:2px solid #60a5fa;outline-offset:2px}' +
    '[data-theme="dark"] .elchi-consent{background:#1e293b;color:#cbd5e1;border-color:rgba(255,255,255,.12);box-shadow:0 10px 30px rgba(0,0,0,.4)}';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: ask again next visit */ }
  }

  function gtag() {
    (window.dataLayer = window.dataLayer || []).push(arguments);
  }

  function loadTawk() {
    if (window.Tawk_LoadStart) return;
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    var s = document.createElement('script');
    s.async = true;
    s.src = TAWK_SRC;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
  }

  function setConsent(state) {
    gtag('consent', 'update', {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
      functionality_storage: state,
      personalization_storage: state,
    });
  }

  function locale() {
    var lang = (document.documentElement.lang || '').toLowerCase();
    return lang.indexOf('tr') === 0 || location.pathname.indexOf('/tr/') === 0 ? 'tr' : 'en';
  }

  var banner = null;

  function hide() {
    if (banner) { banner.remove(); banner = null; }
  }

  function choose(state) {
    var wasGranted = read() === 'granted';
    write(state);
    hide();
    setConsent(state);
    if (state === 'granted') {
      loadTawk();
    } else if (wasGranted && window.Tawk_LoadStart) {
      // A loaded chat widget cannot be torn down; reload so it is gone.
      location.reload();
    }
  }

  function show() {
    if (banner) return;
    if (!document.getElementById('elchi-consent-style')) {
      var style = document.createElement('style');
      style.id = 'elchi-consent-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    var t = TEXT[locale()];
    banner = document.createElement('div');
    banner.className = 'elchi-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', t.label);

    var p = document.createElement('p');
    p.textContent = t.body;

    // Accept and Reject are deliberately styled the same: refusing must be as
    // easy as accepting.
    var actions = document.createElement('div');
    actions.className = 'elchi-consent-actions';
    var reject = document.createElement('button');
    reject.type = 'button';
    reject.textContent = t.reject;
    reject.addEventListener('click', function () { choose('denied'); });
    var accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = t.accept;
    accept.addEventListener('click', function () { choose('granted'); });
    actions.appendChild(reject);
    actions.appendChild(accept);

    banner.appendChild(p);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href$="#cookie-preferences"]');
    if (!link) return;
    e.preventDefault();
    show();
  });

  function init() {
    var state = read();
    if (state === 'granted') loadTawk();
    else if (state !== 'denied') show();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
