import { useState } from 'react';
import { getLocale, locHref, otherLocaleHref } from './i18n.js';
import { PRODUCTS } from './products-data.js';

const ELCHI_UI_VERSION = typeof __ELCHI_UI_VERSION__ !== 'undefined' ? __ELCHI_UI_VERSION__ : 'dev';
const ELCHI_BACKEND_VERSION = typeof __ELCHI_BACKEND_VERSION__ !== 'undefined' ? __ELCHI_BACKEND_VERSION__ : 'dev';

// Shared nav/footer strings. Technical terms (Envoy, proxy, xDS, Helm, GitHub, Demo…)
// are intentionally kept in English in both locales.
const SHARED = {
  en: {
    nav: { home: 'Home', products: 'Products', features: 'Features', architecture: 'Architecture', plans: 'Plans', docs: 'Docs', contact: 'Contact', demo: 'Try Demo →', allPlans: 'Plans & Licensing' },
    footer: {
      tagline: 'Enterprise proxy management platform. 3-process distributed architecture with full xDS protocol support.',
      demoOnline: 'Demo online',
      products: 'Products', platform: 'Platform', resources: 'Resources', company: 'Company',
      features: 'Features', architecture: 'Architecture', screenshots: 'Screenshots', demo: 'Demo', plans: 'Plans & Licensing',
      documentation: 'Documentation', helm: 'Helm Charts', github: 'GitHub',
      clientInstall: 'Client Install', platformInstall: 'Platform Install',
      about: 'About', contact: 'Contact',
      rights: 'All rights reserved.',
    },
  },
  tr: {
    nav: { home: 'Ana Sayfa', products: 'Ürünler', features: 'Özellikler', architecture: 'Mimari', plans: 'Paketler', docs: 'Dokümanlar', contact: 'İletişim', demo: 'Demoyu Dene →', allPlans: 'Paketler & Lisanslama' },
    footer: {
      tagline: 'Kurumsal proxy yönetim platformu. Tam xDS protokol desteğiyle 3 süreçli dağıtık mimari.',
      demoOnline: 'Demo çevrimiçi',
      products: 'Ürünler', platform: 'Platform', resources: 'Kaynaklar', company: 'Şirket',
      features: 'Özellikler', architecture: 'Mimari', screenshots: 'Ekran Görüntüleri', demo: 'Demo', plans: 'Paketler & Lisanslama',
      documentation: 'Dokümantasyon', helm: 'Helm Charts', github: 'GitHub',
      clientInstall: 'Client Kurulumu', platformInstall: 'Platform Kurulumu',
      about: 'Hakkında', contact: 'İletişim',
      rights: 'Tüm hakları saklıdır.',
    },
  },
};

// Order of products in the nav dropdown and footer.
const PRODUCT_SLUGS = ['core', 'api-security', 'api-discovery', 'gslb', 'waf'];

// Per-product icons (Lucide, MIT — lucide.dev): layers / shield-check /
// scan-search / globe / brick-wall. Stroke inherits the product accent color.
const PRODUCT_ICONS = {
  core: (
    <>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
    </>
  ),
  'api-security': (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </>
  ),
  'api-discovery': (
    <>
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="m16 16-1.9-1.9"/>
    </>
  ),
  gslb: (
    <>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </>
  ),
  waf: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M12 9v6"/>
      <path d="M16 15v6"/>
      <path d="M16 3v6"/>
      <path d="M3 9h18"/>
      <path d="M3 15h18"/>
      <path d="M8 15v6"/>
      <path d="M8 3v6"/>
    </>
  ),
};

function ProductIcon({ slug, size = 16 }) {
  return (
    <svg
      className="nav-dd-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={PRODUCTS[slug].accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PRODUCT_ICONS[slug]}
    </svg>
  );
}

// Docs stays at /docs/ for both locales until the docs themselves are translated
// (see docs-site/docs/contributing/translating.md).
const docsHref = '/docs/';

// ============== NAV ==============
function Nav({ active }) {
  const locale = getLocale();
  const t = SHARED[locale].nav;
  const [ddOpen, setDdOpen] = useState(false);
  const onProductPage = typeof active === 'string' && active.startsWith('products/');
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href={locHref('home')} className="brand">
          <span className="brand-mark"></span>
        </a>
        <div className="nav-links">
          <a href={locHref('home')} className={active === 'home' ? 'active' : ''}>{t.home}</a>
          <div className={`nav-dd${ddOpen ? ' open' : ''}`}>
            <button
              type="button"
              className={`nav-dd-trigger${onProductPage ? ' active' : ''}`}
              onClick={() => setDdOpen(!ddOpen)}
              aria-expanded={ddOpen}
            >
              {t.products}
              <svg className="nav-dd-caret" width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="nav-dd-menu">
              {PRODUCT_SLUGS.map((slug) => (
                <a key={slug} href={locHref(`products/${slug}`)} className={active === `products/${slug}` ? 'active' : ''}>
                  <ProductIcon slug={slug}/>
                  {PRODUCTS[slug][locale].metaName}
                </a>
              ))}
              <div className="nav-dd-sep"></div>
              <a href={locHref('plans')} className={active === 'plans' ? 'active' : ''}>{t.allPlans}</a>
            </div>
          </div>
          <a href={locHref('features')} className={active === 'features' ? 'active' : ''}>{t.features}</a>
          <a href={locHref('architecture')} className={active === 'architecture' ? 'active' : ''}>{t.architecture}</a>
          <a href={locHref('plans')} className={active === 'plans' ? 'active' : ''}>{t.plans}</a>
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
            <h5>{t.products}</h5>
            <ul>
              {PRODUCT_SLUGS.map((slug) => (
                <li key={slug}><a href={locHref(`products/${slug}`)}>{PRODUCTS[slug][locale].metaName}</a></li>
              ))}
              <li><a href={locHref('plans')}>{t.plans}</a></li>
            </ul>
          </div>
          <div>
            <h5>{t.platform}</h5>
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
