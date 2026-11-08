import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { PRODUCTS } from './products-data.js';
import { Band, BandHead, PageHero, Arrow } from './relief.jsx';

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
        { t: 'Product modules', d: 'Buy only the products you need: API Security (with its built-in WAF), API Discovery and GSLB are licensed individually on top of Core. Per-product enforcement is being rolled out; current releases enforce the client count.' },
        { t: 'Resilient validation', d: 'Licenses activate online; a transient network outage never downgrades a validly licensed deployment.' },
        { t: 'Free to start', d: 'Without a license, Elchi runs the free tier with a single managed client. Perfect for evaluation.' },
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
        { t: 'Ürün modülleri', d: 'Yalnızca ihtiyacınız olan ürünleri satın alın: API Security (yerleşik WAF’ıyla), API Discovery ve GSLB, Core üzerine tek tek lisanslanır. Ürün bazlı denetim kademeli olarak devreye alınıyor; mevcut sürümler client sayısını denetler.' },
        { t: 'Dayanıklı doğrulama', d: 'Lisanslar online etkinleşir; geçici bir ağ kesintisi, geçerli lisanslı bir kurulumu asla alt seviyeye düşürmez.' },
        { t: 'Ücretsiz başlangıç', d: 'Lisanssız Elchi, tek yönetilen client ile ücretsiz seviyede çalışır. Değerlendirme için idealdir.' },
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

const ADDONS = ['api-security', 'api-discovery', 'gslb'];
// One colour, one meaning (see product.jsx): Shield = coral, Discovery = flow, GSLB = moss.
const PF_TONE = { 'api-security': 'coral', 'api-discovery': 'flow', gslb: 'moss' };
const noArrow = (s) => s.replace(/\s*→$/, '');

function PlansApp() {
  const locale = getLocale();
  const t = STR[locale];
  const core = PRODUCTS.core;

  return (
    <>
      <Nav active="plans"/>
      <main className="rl plans">
        <PageHero
          title={<><span className="rl-h1-line">{t.hero.title1}</span>{' '}<span className="rl-h1-line">{t.hero.title2}</span></>}
          lede={t.hero.subtitle}
          actions={<>
            <a href={locHref('contact')} className="rl-go">{t.cta.contact}<Arrow/></a>
            <a href="/docs/" className="rl-pill">{t.cta.docs}</a>
          </>}
        />

        {/* The family: add-ons standing on the Core base */}
        <Band tone="water" id="products">
          <BandHead h2={t.addonsTitle} intro={t.addonsSubtitle}/>
          <div className="pf">
            <div className="pf-addons">
              {ADDONS.map((slug) => {
                const pt = PRODUCTS[slug][locale];
                return (
                  <a key={slug} href={locHref(`products/${slug}`)} className={`pf-unit pf-${PF_TONE[slug]}`}>
                    <h3>{pt.metaName}</h3>
                    <p>{pt.subtitle}</p>
                    <span className="pf-foot"><span className="pf-kind">{t.requires}</span><span className="pf-more">{noArrow(t.learnMore)}<Arrow/></span></span>
                  </a>
                );
              })}
            </div>
            <a href={locHref('products/core')} className="pf-core">
              <h3>{core[locale].metaName}</h3>
              <span className="pf-kind">{t.coreCard.included}</span>
              <p>{t.coreCard.blurb}</p>
              <span className="pf-more">{noArrow(t.coreCard.cta)}<Arrow/></span>
            </a>
          </div>
        </Band>

        {/* How licensing works */}
        <Band tone="mist" id="licensing">
          <BandHead h2={t.how.title}/>
          <ul className="rl-notes rl-notes-4 plans-how">
            {t.how.items.map((it) => (
              <li key={it.t}>
                <h3>{it.t}</h3>
                <p>{it.d}</p>
              </li>
            ))}
          </ul>
        </Band>

        {/* Closing */}
        <Band tone="moss" className="rl-cta-band">
          <div className="pd-cta">
            <div>
              <h2 className="rl-h2 cta-h2">{t.cta.title}</h2>
              <p className="rl-lede">{t.cta.subtitle}</p>
            </div>
            <div className="rl-actions">
              <a href={locHref('contact')} className="rl-go">{t.cta.contact}<Arrow/></a>
              <a href="/docs/" className="rl-pill">{t.cta.docs}</a>
            </div>
          </div>
        </Band>
      </main>
      <Footer/>
    </>
  );
}

export const Page = PlansApp;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<PlansApp/>);
