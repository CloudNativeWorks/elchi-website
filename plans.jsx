import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { PRODUCTS } from './products-data.js';
import { Band, BandHead, PageHero, Tick, Arrow } from './relief.jsx';

// Plans page: the free tier first, then licensed Core, then Core with add-ons.
// No public prices — licensing is sized by managed client (edge node) count plus
// the modules enabled, quoted per deployment. Every statement here is backed by
// docs-site/docs/administration/licensing.md; keep the two in step.

const STR = {
  en: {
    hero: {
      eyebrow: 'PLANS & LICENSING',
      title1: 'Elchi plans and licensing:',
      title2: 'start free, add what you need.',
      subtitle: 'Every Elchi deployment starts with Elchi Core, the Envoy control plane. Without a license it runs as the free tier with one managed client. A license raises the client count, and API Security, API Discovery and GSLB attach to Core as licensed add-ons.',
    },
    tiers: {
      title: 'Three ways to run Elchi',
      intro: 'The same software in every case. What changes is how many edge nodes may connect at once and which add-on products you license.',
      items: [
        {
          id: 'free',
          name: 'Free tier',
          kind: 'No license needed',
          blurb: 'What an install runs before any license is activated. Enough to evaluate the platform end to end.',
          list: ['Elchi Core with one managed client (edge node)', 'Every Core feature: all Envoy resource types, xDS, several Envoy versions, draft/save/publish, the edge agent, RBAC, observability, ACME certificates', 'No activation and no license API access needed'],
          cta: 'Install with the quickstart',
          href: '/docs/getting-started/quickstart',
        },
        {
          id: 'core',
          name: 'Elchi Core',
          kind: 'Licensed by client count',
          blurb: 'The full Envoy control plane for a fleet. The license sets how many managed clients may be connected at the same time.',
          list: ['Managed clients sized to your fleet', 'Online activation with a license key, or an offline license file for networks without internet access', 'A license stays in force through license-server outages until its expiry date'],
          cta: 'Ask for a quote',
          contact: true,
        },
        {
          id: 'addons',
          name: 'Core + add-ons',
          kind: 'Licensed per product',
          blurb: 'Elchi Core plus any of the add-on products, each licensed individually on top of it.',
          list: ['API Security: Shield, the ext_proc sidecar with its built-in WAF', 'API Discovery: the API inventory built from Envoy access logs', 'GSLB: health-checked DNS for Envoy edges'],
          cta: 'Ask for a quote',
          contact: true,
        },
      ],
    },
    coreCard: {
      tag: 'BASE PLATFORM',
      included: 'Included in every deployment',
      blurb: 'The Envoy control plane: every resource type, full xDS, multi-version fleets, draft/save/publish with an audit log, the edge agent, RBAC, observability, ACME certificates and more.',
      cta: 'Explore Elchi Core →',
    },
    addonsTitle: 'Add-on products',
    addonsSubtitle: 'Each add-on requires Elchi Core and can be licensed independently. Combine them as you need.',
    requires: 'Requires Core',
    learnMore: 'Learn more →',
    how: {
      eyebrow: 'HOW LICENSING WORKS',
      title: 'Sized to your fleet, shaped by your modules.',
      items: [
        { t: 'Client count', d: 'Licenses scale with the number of managed clients (edge nodes) connected to the platform at the same time.' },
        { t: 'Product modules', d: 'Buy only the products you need: API Security (with its built-in WAF), API Discovery and GSLB are licensed individually on top of Core. Per-product enforcement is being rolled out; current releases enforce the client count.' },
        { t: 'Resilient validation', d: 'Licenses activate online; after that, a license-server outage never downgrades a validly licensed deployment before its expiry date.' },
        { t: 'Free to start', d: 'Without a license, Elchi runs the free tier with a single managed client, which is enough to evaluate the platform end to end.' },
      ],
    },
    faq: {
      title: 'Licensing questions',
      items: [
        { q: 'What counts as a managed client?', a: 'An edge node whose agent is connected to the controller. The limit applies to clients connected at the same time. Each member of an HA pair is a client, so a full pair uses two slots.' },
        { q: 'What happens when the client limit is reached?', a: 'A client that tries to connect beyond the licensed cap is rejected with a “license limit reached” error. Removing a license, or one that expires, returns the platform to the free tier.' },
        { q: 'What if the license server cannot be reached?', a: 'After activation, the license API is asked only when a controller starts or when you press re-check. If it cannot be reached, the stored signed answer keeps the license in force until its expiry date.' },
        { q: 'Can an air-gapped installation be licensed?', a: 'Yes. CloudNativeWorks issues an offline license file, a signed JSON document. You upload it under Settings → License; the license API is never contacted.' },
        { q: 'Are prices published?', a: 'No. Licenses are quoted per deployment, from the number of managed clients and the add-on products you need.' },
      ],
      doc: 'Licensing in the docs',
    },
    cta: {
      title: 'Let\'s scope your deployment.',
      subtitle: 'Tell us about your fleet: how many edge hosts, which Envoy versions, and which add-ons you are evaluating.',
      next: 'What happens next: we reply by email, agree on what you need, and send a quote and, if you want one, a proof-of-concept plan for your setup.',
      contact: 'Contact us',
      docs: 'Read the docs',
    },
  },
  tr: {
    hero: {
      eyebrow: 'PAKETLER & LİSANSLAMA',
      title1: 'Elchi paketleri ve lisanslama:',
      title2: 'ücretsiz başlayın, ihtiyacınızı ekleyin.',
      subtitle: 'Her Elchi kurulumu Envoy control plane’i olan Elchi Core ile başlar. Lisans olmadan bir yönetilen client’lı ücretsiz seviye olarak çalışır. Lisans client sayısını artırır; API Security, API Discovery ve GSLB, Core’a lisanslı eklentiler olarak bağlanır.',
    },
    tiers: {
      title: 'Elchi’yi çalıştırmanın üç yolu',
      intro: 'Her durumda aynı yazılım. Değişen, aynı anda kaç edge node’un bağlanabileceği ve hangi eklenti ürünleri lisansladığınızdır.',
      items: [
        {
          id: 'free',
          name: 'Ücretsiz seviye',
          kind: 'Lisans gerekmez',
          blurb: 'Bir kurulumun, herhangi bir lisans etkinleştirilmeden önce çalıştırdığı seviye. Platformu uçtan uca denemek için yeterlidir.',
          list: ['Bir yönetilen client (edge node) ile Elchi Core', 'Core’un tüm özellikleri: tüm Envoy kaynak tipleri, xDS, birden çok Envoy sürümü, taslak/kaydet/yayınla, edge agent, RBAC, gözlemlenebilirlik, ACME sertifikaları', 'Etkinleştirme ya da lisans API erişimi gerekmez'],
          cta: 'Quickstart ile kurun',
          href: '/docs/getting-started/quickstart',
        },
        {
          id: 'core',
          name: 'Elchi Core',
          kind: 'Client sayısına göre lisanslanır',
          blurb: 'Bir filo için eksiksiz Envoy control plane. Lisans, aynı anda kaç yönetilen client’ın bağlı olabileceğini belirler.',
          list: ['Filonuza göre boyutlanan yönetilen client sayısı', 'Lisans anahtarıyla online etkinleştirme ya da internet erişimi olmayan ağlar için çevrimdışı lisans dosyası', 'Lisans, lisans sunucusu kesintilerinde süresi dolana kadar geçerli kalır'],
          cta: 'Teklif isteyin',
          contact: true,
        },
        {
          id: 'addons',
          name: 'Core + eklentiler',
          kind: 'Ürün başına lisanslanır',
          blurb: 'Elchi Core ve üzerine ayrı ayrı lisanslanan eklenti ürünlerden istedikleriniz.',
          list: ['API Security: yerleşik WAF’ıyla ext_proc sidecar’ı Shield', 'API Discovery: Envoy access log’larından oluşturulan API envanteri', 'GSLB: Envoy edge’leri için sağlık kontrollü DNS'],
          cta: 'Teklif isteyin',
          contact: true,
        },
      ],
    },
    coreCard: {
      tag: 'TEMEL PLATFORM',
      included: 'Her kurulumda dahildir',
      blurb: 'Envoy control plane: tüm kaynak tipleri, tam xDS, çok sürümlü filolar, denetim kaydıyla taslak/kaydet/yayınla, edge agent, RBAC, gözlemlenebilirlik, ACME sertifikaları ve fazlası.',
      cta: 'Elchi Core\'u inceleyin →',
    },
    addonsTitle: 'Eklenti ürünler',
    addonsSubtitle: 'Her eklenti Elchi Core gerektirir ve bağımsız lisanslanır. İhtiyacınıza göre birleştirin.',
    requires: 'Core gerektirir',
    learnMore: 'İncele →',
    how: {
      eyebrow: 'LİSANSLAMA NASIL İŞLER',
      title: 'Filonuza göre boyutlanır, modüllerinize göre şekillenir.',
      items: [
        { t: 'Client sayısı', d: 'Lisanslar, platforma aynı anda bağlı yönetilen client (edge node) sayısıyla ölçeklenir.' },
        { t: 'Ürün modülleri', d: 'Yalnızca ihtiyacınız olan ürünleri satın alın: API Security (yerleşik WAF’ıyla), API Discovery ve GSLB, Core üzerine tek tek lisanslanır. Ürün bazlı denetim kademeli olarak devreye alınıyor; mevcut sürümler client sayısını denetler.' },
        { t: 'Dayanıklı doğrulama', d: 'Lisanslar online etkinleşir; sonrasında lisans sunucusundaki bir kesinti, geçerli lisanslı bir kurulumu süresi dolmadan alt seviyeye düşürmez.' },
        { t: 'Ücretsiz başlangıç', d: 'Lisanssız Elchi, tek yönetilen client ile ücretsiz seviyede çalışır; bu, platformu uçtan uca denemek için yeterlidir.' },
      ],
    },
    faq: {
      title: 'Lisanslama soruları',
      items: [
        { q: 'Yönetilen client ne sayılır?', a: 'Agent’ı controller’a bağlı olan bir edge node. Sınır, aynı anda bağlı client’lara uygulanır. Bir HA çiftinin her üyesi bir client’tır; tam bir çift iki yer kullanır.' },
        { q: 'Client sınırına ulaşıldığında ne olur?', a: 'Lisanslı sınırın ötesinde bağlanmaya çalışan client “license limit reached” hatasıyla reddedilir. Lisansı kaldırmak ya da süresinin dolması platformu ücretsiz seviyeye döndürür.' },
        { q: 'Lisans sunucusuna ulaşılamazsa ne olur?', a: 'Etkinleştirmeden sonra lisans API’sine yalnızca bir controller başladığında ya da yeniden kontrole bastığınızda sorulur. Ulaşılamazsa saklanan imzalı yanıt, lisansı süresi dolana kadar geçerli tutar.' },
        { q: 'İnternetsiz (air-gapped) bir kurulum lisanslanabilir mi?', a: 'Evet. CloudNativeWorks imzalı bir JSON belgesi olan çevrimdışı lisans dosyası verir. Dosyayı Settings → License altında yüklersiniz; lisans API’sine hiç bağlanılmaz.' },
        { q: 'Fiyatlar yayınlanıyor mu?', a: 'Hayır. Lisanslar kurulum başına, yönetilen client sayısına ve ihtiyacınız olan eklenti ürünlere göre fiyatlandırılır.' },
      ],
      doc: 'Dokümanlarda lisanslama',
    },
    cta: {
      title: 'Kurulumunuzu birlikte planlayalım.',
      subtitle: 'Filonuzu anlatın: kaç edge sunucu, hangi Envoy sürümleri ve hangi eklentileri değerlendirdiğiniz.',
      next: 'Sonrasında ne olur: e-postayla dönüyor, ihtiyacınızı netleştiriyor, bir teklif ve isterseniz kurulumunuz için bir proof-of-concept planı gönderiyoruz.',
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

        {/* The plans, free tier first */}
        <Band tone="mist" id="plans">
          <BandHead h2={t.tiers.title} intro={t.tiers.intro}/>
          <ol className="pl-tiers">
            {t.tiers.items.map((it) => (
              <li key={it.id} className={`pl-tier pl-${it.id}`}>
                <h3>{it.name}</h3>
                <span className="pl-kind">{it.kind}</span>
                <p>{it.blurb}</p>
                <ul>{it.list.map((l) => <li key={l}><Tick/><span>{l}</span></li>)}</ul>
                <a href={it.contact ? locHref('contact') : it.href} className="rl-link pl-cta">{it.cta}<Arrow/></a>
              </li>
            ))}
          </ol>
        </Band>

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

        {/* Licensing questions (visible text only, no FAQPage schema) */}
        <Band tone="mist2" id="licensing-questions">
          <BandHead h2={t.faq.title}/>
          <div className="pd-qa pl-faq">
            {t.faq.items.map((it) => (
              <article key={it.q} className="pd-qa-item">
                <h3>{it.q}</h3>
                <p>{it.a}</p>
              </article>
            ))}
          </div>
          <p className="pl-faq-doc"><a href="/docs/administration/licensing" className="rl-link">{t.faq.doc}<Arrow/></a></p>
        </Band>

        {/* Closing */}
        <Band tone="moss" className="rl-cta-band">
          <div className="pd-cta">
            <div>
              <h2 className="rl-h2 cta-h2">{t.cta.title}</h2>
              <p className="rl-lede">{t.cta.subtitle}</p>
              <p className="pl-next">{t.cta.next}</p>
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
