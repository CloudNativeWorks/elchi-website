import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { PRODUCTS } from './products-data.js';

// Plans page: Core is the base of every deployment; the other four products
// are licensed add-ons. No public prices — licensing is sized by managed
// client (edge node) count plus the modules enabled, quoted per deployment.

const STR = {
  en: {
    hero: {
      eyebrow: 'PLANS & LICENSING',
      title1: 'Start with Core.',
      title2: 'Add what you need.',
      subtitle: 'Every Elchi deployment starts with Elchi Core — the full Envoy management platform. Security, discovery, and traffic products attach to it as licensed add-ons.',
    },
    coreCard: {
      tag: 'BASE PLATFORM',
      included: 'Included in every deployment',
      blurb: 'The complete Envoy control plane: every resource type, full xDS, multi-version fleets, safe publish workflows, the edge agent, RBAC, observability, ACME certificates, and more.',
      cta: 'Explore Elchi Core →',
    },
    addonsTitle: 'Add-on products',
    addonsSubtitle: 'Each add-on requires Elchi Core and can be licensed independently — combine them freely.',
    requires: 'Requires Core',
    learnMore: 'Learn more →',
    how: {
      eyebrow: 'HOW LICENSING WORKS',
      title: 'Sized to your fleet, shaped by your modules.',
      items: [
        { t: 'Client count', d: 'Licenses scale with the number of managed clients (edge nodes) connected to the platform.' },
        { t: 'Product modules', d: 'Enable only the products you need — API Security, API Discovery, GSLB, and WAF are licensed individually on top of Core.' },
        { t: 'Online or offline', d: 'Licenses activate online or via signed offline files — air-gapped deployments are fully supported.' },
        { t: 'Free to start', d: 'Without a license, Elchi runs in the free tier — the full platform with a single managed client. Perfect for evaluation.' },
      ],
    },
    cta: {
      title: 'Let\'s scope your deployment.',
      subtitle: 'Tell us about your fleet and the products you need — we\'ll come back with a tailored quote and a proof-of-concept plan.',
      contact: 'Contact us',
      docs: 'Read the docs',
    },
  },
  tr: {
    hero: {
      eyebrow: 'PAKETLER & LİSANSLAMA',
      title1: 'Core ile başlayın.',
      title2: 'İhtiyacınızı ekleyin.',
      subtitle: 'Her Elchi kurulumu, eksiksiz Envoy yönetim platformu olan Elchi Core ile başlar. Güvenlik, keşif ve trafik ürünleri ona lisanslı eklentiler olarak bağlanır.',
    },
    coreCard: {
      tag: 'TEMEL PLATFORM',
      included: 'Her kurulumda dahildir',
      blurb: 'Eksiksiz Envoy control plane: tüm kaynak tipleri, tam xDS, çok sürümlü filolar, güvenli yayınlama iş akışları, edge agent, RBAC, gözlemlenebilirlik, ACME sertifikaları ve fazlası.',
      cta: 'Elchi Core\'u inceleyin →',
    },
    addonsTitle: 'Eklenti ürünler',
    addonsSubtitle: 'Her eklenti Elchi Core gerektirir ve bağımsız lisanslanır — dilediğiniz gibi birleştirin.',
    requires: 'Core gerektirir',
    learnMore: 'İncele →',
    how: {
      eyebrow: 'LİSANSLAMA NASIL İŞLER',
      title: 'Filonuza göre boyutlanır, modüllerinize göre şekillenir.',
      items: [
        { t: 'Client sayısı', d: 'Lisanslar, platforma bağlı yönetilen client (edge node) sayısıyla ölçeklenir.' },
        { t: 'Ürün modülleri', d: 'Yalnızca ihtiyacınız olan ürünleri açın — API Security, API Discovery, GSLB ve WAF, Core üzerine tek tek lisanslanır.' },
        { t: 'Online veya offline', d: 'Lisanslar online ya da imzalı offline dosyalarla etkinleşir — kapalı ağ (air-gapped) kurulumlar tam desteklenir.' },
        { t: 'Ücretsiz başlangıç', d: 'Lisanssız Elchi ücretsiz seviyede çalışır — tek yönetilen client ile tam platform. Değerlendirme için idealdir.' },
      ],
    },
    cta: {
      title: 'Kurulumunuzu birlikte planlayalım.',
      subtitle: 'Filonuzu ve ihtiyacınız olan ürünleri anlatın — size özel bir teklif ve proof-of-concept planıyla dönelim.',
      contact: 'Bize ulaşın',
      docs: 'Dokümanları okuyun',
    },
  },
};

const ADDONS = ['api-security', 'api-discovery', 'gslb', 'waf'];

function PlansApp() {
  const locale = getLocale();
  const t = STR[locale];
  const core = PRODUCTS.core;

  return (
    <>
      <Nav active="plans"/>

      {/* Hero */}
      <section className="section" style={{ paddingTop: 80, paddingBottom: 50, position: 'relative', overflow: 'hidden' }}>
        <div className="aurora" style={{ width: 800, height: 500, top: -100, left: '20%', background: 'radial-gradient(closest-side, #c7d2fe, transparent)', opacity: .5 }}></div>
        <div className="grid-bg"></div>
        <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <span className="eyebrow"><span className="dot"></span>{t.hero.eyebrow}</span>
          <h1 style={{ marginTop: 24, marginBottom: 20 }}>
            {t.hero.title1}<br/><span className="grad-text">{t.hero.title2}</span>
          </h1>
          <p style={{ fontSize: 19, color: 'var(--slate-600)', maxWidth: 660, margin: '0 auto' }}>{t.hero.subtitle}</p>
        </div>
      </section>

      {/* Core base card */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 940 }}>
          <div className="plans-core card" style={{ borderColor: `${core.accent}44` }}>
            <div className="plans-core-main">
              <span className="adv-tag mono" style={{ color: core.accent, background: `${core.accent}1a`, borderColor: `${core.accent}33` }}>{t.coreCard.tag}</span>
              <h2 style={{ margin: '14px 0 10px' }}>{core[locale].metaName}</h2>
              <p style={{ color: 'var(--slate-600)', maxWidth: 560 }}>{t.coreCard.blurb}</p>
              <a href={locHref('products/core')} className="btn btn-blue" style={{ marginTop: 18 }}>{t.coreCard.cta}</a>
            </div>
            <div className="plans-core-side">
              <span className="pill" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></span>
                {t.coreCard.included}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-head">
            <h2>{t.addonsTitle}</h2>
            <p>{t.addonsSubtitle}</p>
          </div>
          <div className="plans-addons">
            {ADDONS.map((slug) => {
              const p = PRODUCTS[slug];
              const pt = p[locale];
              return (
                <a key={slug} href={locHref(`products/${slug}`)} className="card plans-addon-card">
                  <div className="plans-addon-head">
                    <span className="plans-addon-req mono">{t.requires}</span>
                  </div>
                  <h3><span className="product-related-dot" style={{ background: p.accent }}></span>{pt.metaName}</h3>
                  <p>{pt.subtitle.length > 150 ? pt.subtitle.slice(0, 147) + '…' : pt.subtitle}</p>
                  <span className="product-related-more" style={{ color: p.accent }}>{t.learnMore}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* How licensing works */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow"><span className="dot"></span>{t.how.eyebrow}</span>
            <h2>{t.how.title}</h2>
          </div>
          <div className="plans-how">
            {t.how.items.map((it, i) => (
              <div key={i} className="card feat-card">
                <div className="product-cap-num mono" style={{ color: 'var(--blue-600)', background: 'var(--blue-50)' }}>{String(i + 1).padStart(2, '0')}</div>
                <h3>{it.t}</h3>
                <p>{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div className="dot-bg" style={{ opacity: 0.15 }}></div>
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <h2 style={{ color: 'white' }}>{t.cta.title}</h2>
          <p style={{ color: '#94a3b8', maxWidth: 560, margin: '12px auto 28px' }}>{t.cta.subtitle}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={locHref('contact')} className="btn btn-blue">{t.cta.contact}</a>
            <a href="/docs/" className="btn btn-ghost-dark">{t.cta.docs}</a>
          </div>
        </div>
      </section>

      <Footer/>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PlansApp/>);
