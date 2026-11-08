import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { PRODUCTS } from './products-data.js';
import { ProductShots } from './screens.jsx';
import { VideoStrip } from './video-player.jsx';
import { Band, BandHead, PageHero, Tick, Arrow } from './relief.jsx';

// Product pages share one component; the HTML shell selects the product via
// <div id="root" data-product="core">. Copy lives here as STR-style {en,tr}
// blocks per product. Technical terms (Envoy, xDS, WAF, JWT, DLP, CRS, …) are
// intentionally kept in English inside the Turkish prose (same rule as the
// other marketing pages).

// Shared page-level strings.
const PAGE = {
  en: {
    addon: 'Add-on · Requires Elchi Core',
    foundation: 'Foundation · Included in every deployment',
    capsEyebrow: 'CAPABILITIES',
    capsTitle: 'What you get.',
    btnDemo: 'Get Started →',
    btnDocs: 'Read the docs',
    btnPlans: 'See plans',
    relatedEyebrow: 'BETTER TOGETHER',
    relatedTitle: 'Works with the rest of the platform.',
    learnMore: 'Learn more →',
    ctaTitle: 'See it live.',
    ctaSubtitle: 'Talk to us about a proof of concept, or start with the quickstart guide.',
    ctaContact: 'Contact us',
    shotsEyebrow: 'IN THE PRODUCT',
    shotsTitle: 'See it in action.',
    videosEyebrow: 'VIDEO TUTORIALS',
    videosTitle: 'Watch it work.',
  },
  tr: {
    addon: 'Eklenti · Elchi Core gerektirir',
    foundation: 'Temel · Her kurulumda dahildir',
    capsEyebrow: 'YETENEKLER',
    capsTitle: 'Neler sunar.',
    btnDemo: 'Başlayın →',
    btnDocs: 'Dokümanları okuyun',
    btnPlans: 'Paketleri görün',
    relatedEyebrow: 'BİRLİKTE DAHA GÜÇLÜ',
    relatedTitle: 'Platformun geri kalanıyla birlikte çalışır.',
    learnMore: 'İncele →',
    ctaTitle: 'Canlı görün.',
    ctaSubtitle: 'Bir proof of concept için bizimle konuşun ya da quickstart rehberiyle başlayın.',
    ctaContact: 'Bize ulaşın',
    shotsEyebrow: 'ÜRÜNDEN',
    shotsTitle: 'İş başında görün.',
    videosEyebrow: 'VİDEO EĞİTİMLERİ',
    videosTitle: 'Çalışırken izleyin.',
  },
};

// Video tutorials per product page, in viewing order (slugs of videos-data.js).
const VIDEOS_BY_PRODUCT = {
  core: ['explainer', 'http-service-step-by-step', 'canary-weighted', 'blue-green-switch', 'health-checks', 'https-lets-encrypt'],
  'api-security': ['shield-waf', 'shield-api-keys', 'shield-jwt', 'shield-traffic', 'shield-positive', 'shield-dlp', 'shield-signed', 'shield-mtls-identity', 'shield-advanced'],
  'api-discovery': ['api-discovery', 'api-discovery-deep', 'access-logs', 'ai-analyzer', 'metrics', 'reports'],
  gslb: ['gslb', 'ha-pair', 'bgp-vip'],
};

// One colour, one meaning: Core = lake, API Security (Shield) = coral,
// API Discovery = flow (the request path), GSLB = moss.
const TONE = { core: 'lake', 'api-security': 'coral', 'api-discovery': 'flow', gslb: 'moss' };

const noArrow = (s) => s.replace(/\s*→$/, '');

function ProductPage({ slug }) {
  const locale = getLocale();
  const p = PRODUCTS[slug];
  const t = p[locale];
  const pg = PAGE[locale];
  const isCore = slug === 'core';
  const tone = TONE[slug];

  return (
    <>
      <Nav active={`products/${slug}`}/>
      <main className={`rl pd pd-${tone}`}>
        <PageHero
          title={<><span className="rl-h1-line">{t.title1}</span>{' '}<span className="rl-h1-line">{t.title2}</span></>}
          lede={t.subtitle}
          actions={<>
            <a href="/docs/getting-started/quickstart" className="rl-go">{noArrow(pg.btnDemo)}<Arrow/></a>
            <a href={p.docs} className="rl-pill">{pg.btnDocs}</a>
          </>}
          aside={
            <div className="pd-facts">
              <p className="pd-tag"><span className={`rl-dot rl-dot-${tone}`}></span>{t.tag}</p>
              <p className="pd-pos"><b>{isCore ? pg.foundation : pg.addon}</b>{t.positioning}</p>
              <ul className="pd-badges">
                {t.badges.map((b) => <li key={b}><Tick/>{b}</li>)}
              </ul>
              <a href={locHref('plans')} className="rl-link">{pg.btnPlans}<Arrow/></a>
            </div>
          }
        />

        {/* Capabilities */}
        <Band tone="water" id="capabilities">
          <BandHead h2={pg.capsTitle}/>
          <ul className="rl-notes pd-caps">
            {t.caps.map((c) => (
              <li key={c.t}>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </li>
            ))}
          </ul>
          {t.also && (
            <div className="pd-also">
              <h3 className="rl-h3">{t.also.title}</h3>
              <ul>
                {t.also.items.map((a) => <li key={a} className="rl-chip">{a}</li>)}
              </ul>
            </div>
          )}
        </Band>

        {/* Screenshots (ProductShots draws its own heading; the band heading replaces it) */}
        {p.shots && (
          <Band tone="mist" id="screenshots" className="pd-shots">
            <BandHead h2={pg.shotsTitle}/>
            <ProductShots ids={p.shots} eyebrow={pg.shotsEyebrow} title={pg.shotsTitle}/>
          </Band>
        )}

        {/* Video tutorials: VideoStrip draws its own band, and nothing when no video is public yet */}
        <VideoStrip slugs={VIDEOS_BY_PRODUCT[slug] || []} eyebrow={pg.videosEyebrow} title={pg.videosTitle} tone="sage"/>

        {/* Flow */}
        <Band tone="mist2" id="how-it-works">
          <BandHead h2={t.flow.title}/>
          <ol className="pd-flow">
            {t.flow.steps.map((s, i) => (
              <li key={s.t} className={`pd-step pd-step-${i}`}>
                <span className="pd-step-n" aria-hidden="true">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </Band>

        {/* Related products */}
        <Band tone="mist" id="related">
          <BandHead h2={pg.relatedTitle}/>
          <div className="pd-rel">
            {p.related.map((slug2) => {
              const rt = PRODUCTS[slug2][locale];
              return (
                <a key={slug2} href={locHref(`products/${slug2}`)} className="pd-rel-row">
                  <h3><span className={`rl-dot rl-dot-${TONE[slug2]}`}></span>{rt.metaName}</h3>
                  <p>{rt.subtitle}</p>
                  <span className="pf-more">{noArrow(pg.learnMore)}<Arrow/></span>
                </a>
              );
            })}
          </div>
        </Band>

        {/* Closing */}
        <Band tone="moss" className="rl-cta-band">
          <div className="pd-cta">
            <div>
              <h2 className="rl-h2 cta-h2">{pg.ctaTitle}</h2>
              <p className="rl-lede">{pg.ctaSubtitle}</p>
            </div>
            <div className="rl-actions">
              <a href="/docs/getting-started/quickstart" className="rl-go">{noArrow(pg.btnDemo)}<Arrow/></a>
              <a href={locHref('contact')} className="rl-pill">{pg.ctaContact}</a>
            </div>
          </div>
        </Band>
      </main>
      <Footer/>
    </>
  );
}

export const Page = ProductPage;
if (typeof document !== 'undefined') {
  const rootEl = document.getElementById('root');
  ReactDOM.createRoot(rootEl).render(<ProductPage slug={rootEl.dataset.product}/>);
}

