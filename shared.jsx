import { getLocale, locHref, otherLocaleHref } from './i18n.js';

const ELCHI_UI_VERSION = typeof __ELCHI_UI_VERSION__ !== 'undefined' ? __ELCHI_UI_VERSION__ : 'dev';
const ELCHI_BACKEND_VERSION = typeof __ELCHI_BACKEND_VERSION__ !== 'undefined' ? __ELCHI_BACKEND_VERSION__ : 'dev';

// Shared nav/footer strings. Technical terms (Envoy, proxy, xDS, Helm, GitHub, Demo…)
// are intentionally kept in English in both locales.
const SHARED = {
  en: {
    nav: { home: 'Home', features: 'Features', architecture: 'Architecture', docs: 'Docs', contact: 'Contact', demo: 'Try Demo →' },
    footer: {
      tagline: 'Enterprise proxy management platform. 3-process distributed architecture with full xDS protocol support.',
      demoOnline: 'Demo online',
      product: 'Product', resources: 'Resources', company: 'Company',
      features: 'Features', architecture: 'Architecture', screenshots: 'Screenshots', demo: 'Demo',
      documentation: 'Documentation', helm: 'Helm Charts', github: 'GitHub',
      clientInstall: 'Client Install', platformInstall: 'Platform Install',
      about: 'About', contact: 'Contact',
      rights: 'All rights reserved.',
    },
  },
  tr: {
    nav: { home: 'Ana Sayfa', features: 'Özellikler', architecture: 'Mimari', docs: 'Dokümanlar', contact: 'İletişim', demo: 'Demoyu Dene →' },
    footer: {
      tagline: 'Kurumsal proxy yönetim platformu. Tam xDS protokol desteğiyle 3 süreçli dağıtık mimari.',
      demoOnline: 'Demo çevrimiçi',
      product: 'Ürün', resources: 'Kaynaklar', company: 'Şirket',
      features: 'Özellikler', architecture: 'Mimari', screenshots: 'Ekran Görüntüleri', demo: 'Demo',
      documentation: 'Dokümantasyon', helm: 'Helm Charts', github: 'GitHub',
      clientInstall: 'Client Kurulumu', platformInstall: 'Platform Kurulumu',
      about: 'Hakkında', contact: 'İletişim',
      rights: 'Tüm hakları saklıdır.',
    },
  },
};

// Docs stays at /docs/ for both locales until the docs themselves are translated
// (see docs-site/docs/contributing/translating.md).
const docsHref = '/docs/';

// ============== NAV ==============
function Nav({ active }) {
  const locale = getLocale();
  const t = SHARED[locale].nav;
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href={locHref('home')} className="brand">
          <span className="brand-mark"></span>
        </a>
        <div className="nav-links">
          <a href={locHref('home')} className={active === 'home' ? 'active' : ''}>{t.home}</a>
          <a href={locHref('features')} className={active === 'features' ? 'active' : ''}>{t.features}</a>
          <a href={locHref('architecture')} className={active === 'architecture' ? 'active' : ''}>{t.architecture}</a>
          <a href={docsHref} className={active === 'docs' ? 'active' : ''}>{t.docs}</a>
          <a href={locHref('contact')} className={active === 'contact' ? 'active' : ''}>{t.contact}</a>
        </div>
        <div className="nav-cta">
          <div className="lang-switch">
            <a href={otherLocaleHref(active)} className="lang-switch-link" title={locale === 'en' ? 'Türkçe' : 'English'}>
              {locale === 'en' ? 'TR' : 'EN'}
            </a>
          </div>
          <div className="nav-versions">
            <a
              href={`https://github.com/CloudNativeWorks/elchi-archive/releases/tag/elchi-ui-${ELCHI_UI_VERSION}`}
              target="_blank"
              rel="noopener"
              className="nav-version"
              title={`Elchi UI ${ELCHI_UI_VERSION}`}
            >
              <span className="nav-version-key">UI</span>
              <span className="nav-version-tag">{ELCHI_UI_VERSION}</span>
            </a>
            <a
              href={`https://github.com/CloudNativeWorks/elchi-archive/releases/tag/elchi-backend-${ELCHI_BACKEND_VERSION}`}
              target="_blank"
              rel="noopener"
              className="nav-version"
              title={`Elchi Backend ${ELCHI_BACKEND_VERSION}`}
            >
              <span className="nav-version-key">API</span>
              <span className="nav-version-tag">{ELCHI_BACKEND_VERSION}</span>
            </a>
          </div>
          <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-primary">{t.demo}</a>
        </div>
      </div>
    </nav>
  );
}

// ============== FOOTER ==============
function Footer() {
  const locale = getLocale();
  const t = SHARED[locale].footer;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{marginBottom: 14}}>
              <span className="brand-mark"></span>
            </div>
            <p style={{maxWidth: 360, fontSize: 14, lineHeight: 1.6}}>
              {t.tagline}
            </p>
            <div style={{display: 'flex', gap: 8, marginTop: 18}}>
              <span className="pill" style={{background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0'}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e'}}></span>
                {t.demoOnline}
              </span>
              <span className="pill">UI {ELCHI_UI_VERSION}</span>
              <span className="pill">API {ELCHI_BACKEND_VERSION}</span>
            </div>
          </div>
          <div>
            <h5>{t.product}</h5>
            <ul>
              <li><a href={locHref('features')}>{t.features}</a></li>
              <li><a href={locHref('architecture')}>{t.architecture}</a></li>
              <li><a href={locHref('home#screenshots')}>{t.screenshots}</a></li>
              <li><a href="https://demo.elchi.io" target="_blank" rel="noopener">{t.demo}</a></li>
            </ul>
          </div>
          <div>
            <h5>{t.resources}</h5>
            <ul>
              <li><a href={docsHref}>{t.documentation}</a></li>
              <li><a href="https://charts.elchi.io" target="_blank" rel="noopener">{t.helm}</a></li>
              <li><a href="https://github.com/orgs/CloudNativeWorks/repositories" target="_blank" rel="noopener">{t.github}</a></li>
              <li><a href="/docs/installation/client/installation">{t.clientInstall}</a></li>
              <li><a href="/docs/installation/helm-platform/installation">{t.platformInstall}</a></li>
            </ul>
          </div>
          <div>
            <h5>{t.company}</h5>
            <ul>
              <li><a href="https://www.cloudnativeworks.com" target="_blank" rel="noopener">{t.about}</a></li>
              <li><a href={locHref('contact')}>{t.contact}</a></li>
              <li><a href="https://github.com/orgs/CloudNativeWorks/repositories" target="_blank" rel="noopener">{t.github}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Elchi. {t.rights}</span>
          <a href="https://profelis.com.tr" target="_blank" rel="noopener" className="powered-by">
            <span>Powered by</span>
            <span className="powered-by-logo">
              <img src="/profelis-logo.webp" alt="Profelis" height="16" loading="lazy" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export { Nav, Footer };
