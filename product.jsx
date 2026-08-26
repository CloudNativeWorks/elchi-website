import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { PRODUCTS } from './products-data.js';

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
  },
};

function ProductPage({ slug }) {
  const locale = getLocale();
  const p = PRODUCTS[slug];
  const t = p[locale];
  const pg = PAGE[locale];
  const isCore = slug === 'core';

  return (
    <>
      <Nav active={`products/${slug}`}/>

      {/* Hero */}
      <section className="section product-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="aurora" style={{ width: 800, height: 500, top: -120, left: '18%', background: `radial-gradient(closest-side, ${p.accent}33, transparent)`, opacity: .7 }}></div>
        <div className="grid-bg"></div>
        <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <span className="eyebrow"><span className="dot" style={{ background: p.accent }}></span>{t.tag}</span>
          <h1 style={{ marginTop: 24, marginBottom: 20 }}>
            {t.title1}<br/><span className="grad-text">{t.title2}</span>
          </h1>
          <p style={{ fontSize: 19, color: 'var(--slate-600)', maxWidth: 680, margin: '0 auto' }}>{t.subtitle}</p>
          <div className="product-badges">
            {t.badges.map((b, i) => (
              <span key={i} className="pill product-badge" style={{ borderColor: `${p.accent}44`, color: 'var(--slate-700)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent }}></span>{b}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
            <a href="/docs/getting-started/quickstart" className="btn btn-blue">{pg.btnDemo}</a>
            <a href={p.docs} className="btn btn-ghost">{pg.btnDocs}</a>
            <a href={locHref('plans')} className="btn btn-ghost">{pg.btnPlans}</a>
          </div>
          <div className="product-positioning" style={{ borderColor: `${p.accent}33`, background: `${p.accent}0d` }}>
            <span className="product-positioning-tag mono" style={{ color: p.accent }}>{isCore ? pg.foundation : pg.addon}</span>
            <span>{t.positioning}</span>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow"><span className="dot" style={{ background: p.accent }}></span>{pg.capsEyebrow}</span>
            <h2>{pg.capsTitle}</h2>
          </div>
          <div className="features-grid">
            {t.caps.map((c, i) => (
              <div key={i} className="card feat-card">
                <div className="product-cap-num mono" style={{ color: p.accent, background: `${p.accent}14` }}>{String(i + 1).padStart(2, '0')}</div>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </div>
            ))}
          </div>
          {t.also && (
            <div className="product-also">
              <h4>{t.also.title}</h4>
              <div className="product-also-items">
                {t.also.items.map((a, i) => (
                  <span key={i} className="pill">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WAF comparison (only when defined) */}
      {t.versus && (
        <section className="section">
          <div className="container" style={{ maxWidth: 900 }}>
            <div className="section-head">
              <h2>{t.versus.title}</h2>
              <p>{t.versus.subtitle}</p>
            </div>
            <div className="versus-table card">
              <div className="versus-row versus-head">
                <div style={{ color: p.accent }}>{t.versus.colA}</div>
                <div>{t.versus.colB}</div>
              </div>
              {t.versus.rows.map((r, i) => (
                <div key={i} className="versus-row">
                  <div>{r[0]}</div>
                  <div>{r[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Flow */}
      <section className="section" style={t.versus ? { background: 'var(--bg-tint)', borderTop: '1px solid var(--border)' } : {}}>
        <div className="container">
          <div className="section-head">
            <h2>{t.flow.title}</h2>
          </div>
          <div className="product-flow">
            {t.flow.steps.map((s, i) => (
              <div key={i} className="product-flow-step card">
                <div className="product-flow-num mono" style={{ background: p.accent }}>{i + 1}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related products */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow"><span className="dot"></span>{pg.relatedEyebrow}</span>
            <h2>{pg.relatedTitle}</h2>
          </div>
          <div className="product-related">
            {p.related.map((slug2) => {
              const rp = PRODUCTS[slug2];
              const rt = rp[locale];
              return (
                <a key={slug2} href={locHref(`products/${slug2}`)} className="card product-related-card">
                  <h3><span className="product-related-dot" style={{ background: rp.accent }}></span>{rt.metaName}</h3>
                  <p>{rt.subtitle.length > 130 ? rt.subtitle.slice(0, 127) + '…' : rt.subtitle}</p>
                  <span className="product-related-more" style={{ color: rp.accent }}>{pg.learnMore}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div className="dot-bg" style={{ opacity: 0.15 }}></div>
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <h2 style={{ color: 'white' }}>{pg.ctaTitle}</h2>
          <p style={{ color: '#94a3b8', maxWidth: 560, margin: '12px auto 28px' }}>{pg.ctaSubtitle}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/docs/getting-started/quickstart" className="btn btn-blue">{pg.btnDemo}</a>
            <a href={locHref('contact')} className="btn btn-ghost-dark">{pg.ctaContact}</a>
          </div>
        </div>
      </section>

      <Footer/>
    </>
  );
}

const rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(<ProductPage slug={rootEl.dataset.product}/>);

