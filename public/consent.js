// Cookie consent banner (KVKK / GDPR), shared by the marketing site and the docs.
//
// Served at /consent.js. The docs are deployed under /docs/ on the same origin,
// so they load this same file and the visitor's choice (localStorage) carries
// over between the two. Until the visitor accepts, nothing third-party loads
// (KVKK md.5/md.9: no request to Google or Crisp without consent):
//   - Google Tag Manager is not loaded at all — loadTagManager() injects it
//     after "Accept" (or on a later visit when the stored choice is granted).
//     The Consent Mode default (inline snippet in vite.config.js and
//     docs-site/docusaurus.config.ts) still starts every storage type "denied"
//     and is updated to "granted" before GTM loads;
//   - the Crisp live chat is not loaded at all.
// Any link to "#cookie-preferences" (site and docs footers) reopens the banner.
(function () {
  var KEY = 'elchi-consent';
  var CRISP_WEBSITE_ID = '266053e3-c2f1-4923-9b9c-3d9eb8d2d995';

  var TEXT = {
    en: {
      body: 'We use cookies for analytics (Google Tag Manager) and for the live chat (Crisp). They are only set if you accept. You can change your choice at any time via “Cookie preferences” in the footer.',
      short: 'Cookies for analytics and live chat, only if you accept.',
      more: 'Privacy notice',
      href: '/privacy.html',
      accept: 'Accept',
      reject: 'Reject',
      label: 'Cookie consent',
    },
    tr: {
      body: 'Analiz (Google Tag Manager) ve canlı destek (Crisp) için çerez kullanıyoruz. Bu çerezler yalnızca onay vermeniz halinde kullanılır. Tercihinizi sayfa altındaki “Çerez tercihleri” bağlantısından istediğiniz zaman değiştirebilirsiniz.',
      short: 'Analiz ve canlı destek çerezleri, yalnızca onay verirseniz.',
      more: 'KVKK ve Çerez Politikası',
      href: '/tr/privacy.html',
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
    '[data-theme="dark"] .elchi-consent{background:#1e293b;color:#cbd5e1;border-color:rgba(255,255,255,.12);box-shadow:0 10px 30px rgba(0,0,0,.4)}' +
    // the marketing pages (relief design) carry no data-theme; the docs site (Docusaurus) keeps the look above
    'html:not([data-theme]) .elchi-consent{border:0;border-radius:24px;padding:16px 16px 16px 24px;background:#f4f8f6;color:#2f4a60;' +
    'box-shadow:0 2px 6px rgba(23,50,74,.08),0 30px 60px -28px rgba(13,27,38,.5);font-family:"Hanken Grotesk",system-ui,sans-serif;font-size:15px}' +
    'html:not([data-theme]) .elchi-consent button{border:0;border-radius:999px;padding:11px 20px;background:#17324a;color:#fff}' +
    'html:not([data-theme]) .elchi-consent button:first-child{background:#e3ebe1;color:#17324a}' +
    'html:not([data-theme]) .elchi-consent button:focus-visible{outline-color:#1f7a99}' +
    '.elchi-consent a{color:inherit;font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
    '.elchi-consent .ec-short{display:none}' +
    '.elchi-consent button{min-height:44px}' +
    // phones: one compact bar at the bottom edge (short copy, link, two buttons)
    // instead of a card that covered almost half the screen
    '@media (max-width:600px){' +
      '.elchi-consent,html:not([data-theme]) .elchi-consent{left:0;right:0;bottom:0;max-width:none;flex-wrap:nowrap;gap:10px;' +
      'padding:8px 10px 8px 14px;padding-bottom:calc(8px + env(safe-area-inset-bottom));border-radius:16px 16px 0 0;font-size:13px;line-height:1.35}' +
      '.elchi-consent p{flex:1 1 auto;min-width:0}' +
      '.elchi-consent .ec-long{display:none}' +
      '.elchi-consent .ec-short{display:inline}' +
      '.elchi-consent-actions{gap:6px;flex:none}' +
      '.elchi-consent button,html:not([data-theme]) .elchi-consent button{padding:0 12px;font-size:13px}' +
    '}';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: ask again next visit */ }
  }

  function gtag() {
    (window.dataLayer = window.dataLayer || []).push(arguments);
  }

  var GTM_ID = 'GTM-5G5WC537';
  function loadTagManager() {
    if (window.__elchiGtm) return;
    window.__elchiGtm = true;
    var dl = (window.dataLayer = window.dataLayer || []);
    dl.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }

  function loadChat() {
    if (window.$crisp) return;
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
    var s = document.createElement('script');
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
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

  // The marketing pages are /tr/… in Turkish; the docs (/docs/, /docs/tr/…) set
  // <html lang>, which is checked first.
  function locale() {
    var lang = (document.documentElement.lang || '').toLowerCase();
    if (lang) return lang.indexOf('tr') === 0 ? 'tr' : 'en';
    return location.pathname.indexOf('/tr/') === 0 ? 'tr' : 'en';
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
      loadTagManager();
      loadChat();
    } else if (wasGranted && (window.$crisp || window.__elchiGtm)) {
      // A loaded chat widget or tag container cannot be torn down; reload so it is gone.
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

    // Long copy on wide screens, a short line on phones; both end with the
    // link to the privacy notice of the visitor's language.
    var p = document.createElement('p');
    var long = document.createElement('span');
    long.className = 'ec-long';
    long.textContent = t.body + ' ';
    var short = document.createElement('span');
    short.className = 'ec-short';
    short.textContent = t.short + ' ';
    var more = document.createElement('a');
    more.href = t.href;
    more.textContent = t.more;
    p.appendChild(long);
    p.appendChild(short);
    p.appendChild(more);

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
    if (state === 'granted') { setConsent('granted'); loadTagManager(); loadChat(); }
    else if (state !== 'denied') show();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
