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
    btnDemo: 'Get Started →',
    btnDocs: 'Read the docs',
    btnTalk: 'Request a demo',
    btnPlans: 'See plans',
    docsLabel: 'In the docs',
    relatedTitle: 'Works with the rest of the platform.',
    learnMore: 'Learn more →',
    ctaTitle: 'Talk to us about a demo.',
    ctaSubtitle: 'Tell us how many Envoy hosts you run, which Envoy versions, and which add-ons you are evaluating. We reply with a demo or a proof-of-concept plan for your setup. To try it yourself first, the quickstart installs the free tier.',
    ctaContact: 'Contact us',
    ctaQuickstart: 'Quickstart guide',
    shotsEyebrow: 'IN THE PRODUCT',
    videosEyebrow: 'VIDEO TUTORIALS',
    videosTitle: (name) => `${name} video tutorials`,
  },
  tr: {
    addon: 'Eklenti · Elchi Core gerektirir',
    foundation: 'Temel · Her kurulumda dahildir',
    btnDemo: 'Başlayın →',
    btnDocs: 'Dokümanları okuyun',
    btnTalk: 'Demo isteyin',
    btnPlans: 'Paketleri görün',
    docsLabel: 'Dokümanlarda',
    relatedTitle: 'Platformun geri kalanıyla birlikte çalışır.',
    learnMore: 'İncele →',
    ctaTitle: 'Bir demo için konuşalım.',
    ctaSubtitle: 'Kaç Envoy sunucusu çalıştırdığınızı, hangi Envoy sürümlerini kullandığınızı ve hangi eklentileri değerlendirdiğinizi yazın. Kurulumunuza göre bir demo ya da proof-of-concept planıyla dönelim. Önce kendiniz denemek isterseniz quickstart ücretsiz seviyeyi kurar.',
    ctaContact: 'Bize ulaşın',
    ctaQuickstart: 'Quickstart rehberi',
    shotsEyebrow: 'ÜRÜNDEN',
    videosEyebrow: 'VİDEO EĞİTİMLERİ',
    videosTitle: (name) => `${name} video eğitimleri`,
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
            <a href={locHref('contact')} className="rl-pill">{pg.btnTalk}</a>
          </>}
          aside={
            <div className="pd-facts">
              <p className="pd-tag"><span className={`rl-dot rl-dot-${tone}`}></span>{t.tag}</p>
              <p className="pd-pos"><b>{isCore ? pg.foundation : pg.addon}</b>{t.positioning}</p>
              <ul className="pd-badges">
                {t.badges.map((b) => <li key={b}><Tick/>{b}</li>)}
              </ul>
              <p className="pd-facts-links">
                <a href={p.docs} className="rl-link">{pg.btnDocs}<Arrow/></a>
                <a href={locHref('plans')} className="rl-link">{pg.btnPlans}<Arrow/></a>
              </p>
            </div>
          }
        />

        {/* Definition first: the opening passage answers "What is …?" and points at the docs */}
        <Band tone="mist" id="what">
          <div className="pd-what">
            <div className="pd-what-copy">
              <h2 className="rl-h2 pd-what-h">{t.what.q}</h2>
              <p className="pd-what-p">{t.what.p}</p>
            </div>
            <nav className="pd-docs" aria-label={pg.docsLabel}>
              <p className="pd-docs-label">{pg.docsLabel}</p>
              <ul>
                {p.guides.map((g) => (
                  <li key={g.href}><a href={g.href}><span>{g[locale]}</span><Arrow/></a></li>
                ))}
              </ul>
            </nav>
          </div>
        </Band>

        {/* Capabilities */}
        <Band tone="water" id="capabilities">
          <BandHead h2={t.capsTitle}/>
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

        {/* Screenshots: ProductShots draws the band's only heading (one H2, no duplicate) */}
        {p.shots && (
          <Band tone="mist" id="screenshots" className="pd-shots">
            <ProductShots ids={p.shots} eyebrow={pg.shotsEyebrow} title={t.shotsTitle}/>
          </Band>
        )}

        {/* Evaluation: the questions an engineer asks before running it */}
        <Band tone="mist2" id="evaluate">
          <div className="pd-eval">
            {t.evaluate.map((e) => (
              <section key={e.q} className="pd-eval-item">
                <h2 className="pd-eval-h">{e.q}</h2>
                {e.a.map((para, i) => <p key={i}>{para}</p>)}
              </section>
            ))}
          </div>
        </Band>

        {/* Video tutorials: VideoStrip draws its own band, and nothing when no video is public yet */}
        <VideoStrip slugs={VIDEOS_BY_PRODUCT[slug] || []} eyebrow={pg.videosEyebrow} title={pg.videosTitle(t.metaName)} tone="sage"/>

        {/* Flow */}
        <Band tone="mist" id="how-it-works">
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

        {/* Short Q&A (visible text only; product pages carry no FAQPage schema) */}
        <Band tone="water" id="questions">
          <BandHead h2={t.qa.title}/>
          <div className="pd-qa">
            {t.qa.items.map((it) => (
              <article key={it.q} className="pd-qa-item">
                <h3>{it.q}</h3>
                <p>{it.a}</p>
              </article>
            ))}
          </div>
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

        {/* Closing: the conversation is the goal; the quickstart is the self-serve path */}
        <Band tone="moss" className="rl-cta-band">
          <div className="pd-cta">
            <div>
              <h2 className="rl-h2 cta-h2">{pg.ctaTitle}</h2>
              <p className="rl-lede">{pg.ctaSubtitle}</p>
            </div>
            <div className="rl-actions">
              <a href={locHref('contact')} className="rl-go">{pg.ctaContact}<Arrow/></a>
              <a href="/docs/getting-started/quickstart" className="rl-pill">{pg.ctaQuickstart}</a>
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

