import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { Band, BandHead, PageHero, Arrow } from './relief.jsx';
import { PRODUCTS } from './products-data.js';
import { REVIEWED, COMPARE_SLUGS, CRITERIA, ELCHI, COMPARE, HUB } from './compare-data.js';

// Comparison pages. One component serves the hub (compare.html, data-product="hub")
// and the three comparisons (compare/<slug>.html, data-product="<slug>"). The prerender
// passes data-product as the `slug` prop; in the browser it is read from #root.
// All copy and every cited fact live in compare-data.js. The JSON-LD (BreadcrumbList +
// WebPage) is static in each HTML entry's <head>.

const STR = {
  en: {
    home: 'Home',
    hub: 'Compare',
    demo: 'Book a demo',
    free: 'Try the free tier',
    criterion: 'Criterion',
    docsTitle: 'Read further',
    docsIntro: 'The Elchi documentation behind the claims on this page, and the products it mentions.',
    productsLabel: 'Products',
    docsLabel: 'Documentation',
    plans: 'Plans and licensing',
    otherTitle: 'Other comparisons',
    allComparisons: 'All comparisons',
    ctaTitle: 'See it on your own fleet.',
    ctaText: 'Tell us where your Envoys run and what you need to change on them. We will show the product on a setup like yours, or help you start on the free tier with one managed client.',
    sourcesTitle: 'Sources',
    sourcesIntro: 'Facts about other projects come from their official documentation and repositories, checked on the date below. Elchi facts come from the Elchi documentation.',
    reviewed: 'Last reviewed:',
    open: 'Read the comparison',
  },
  tr: {
    home: 'Ana Sayfa',
    hub: 'Karşılaştırmalar',
    demo: 'Demo isteyin',
    free: 'Ücretsiz seviyeyi deneyin',
    criterion: 'Kriter',
    docsTitle: 'Devamını okuyun',
    docsIntro: 'Bu sayfadaki iddiaların dayandığı Elchi dokümanları ve sözü geçen ürünler.',
    productsLabel: 'Ürünler',
    docsLabel: 'Dokümantasyon',
    plans: 'Paketler ve lisanslama',
    otherTitle: 'Diğer karşılaştırmalar',
    allComparisons: 'Tüm karşılaştırmalar',
    ctaTitle: 'Kendi filonuzda görün.',
    ctaText: 'Envoy’larınızın nerede çalıştığını ve üzerlerinde neyi değiştirmeniz gerektiğini anlatın. Ürünü sizinkine benzer bir kurulumda gösterelim ya da bir yönetilen client ile ücretsiz seviyede başlamanıza yardım edelim.',
    sourcesTitle: 'Kaynaklar',
    sourcesIntro: 'Diğer projelerle ilgili bilgiler, aşağıdaki tarihte kontrol edilen resmi dokümanlarından ve depolarından alınmıştır. Elchi bilgileri Elchi dokümantasyonundan gelir.',
    reviewed: 'Son inceleme:',
    open: 'Karşılaştırmayı okuyun',
  },
};

const QUICKSTART = '/docs/getting-started/quickstart';

function Crumbs({ t, current }) {
  return (
    <nav className="cmpx-crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href={locHref('home')}>{t.home}</a></li>
        {current
          ? <><li><a href={locHref('compare')}>{t.hub}</a></li><li aria-current="page">{current}</li></>
          : <li aria-current="page">{t.hub}</li>}
      </ol>
    </nav>
  );
}

function HeroActions({ t }) {
  return (
    <>
      <a href={locHref('contact')} className="rl-go">{t.demo}<Arrow /></a>
      <a href={QUICKSTART} className="rl-pill">{t.free}</a>
    </>
  );
}

// A real <table> with text cells, so the comparison survives text extraction.
function CompareTable({ caption, head, rows, hub = false }) {
  return (
    <div className="cmpx-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className={`cmpx-table${hub ? ' cmpx-hub' : ''}`}>
        <caption>{caption}</caption>
        <thead>
          <tr>{head.map((h, i) => <th key={i} scope="col" className={i === 1 ? 'cmpx-elchi' : undefined}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <th scope="row">{r[0]}</th>
              {r.slice(1).map((c, i) => <td key={i} className={i === 0 ? 'cmpx-elchi' : undefined}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sources({ t, locale, sources }) {
  return (
    <Band tone="mist">
      <div className="cmpx-sources">
        <h2 className="cmpx-h2s">{t.sourcesTitle}</h2>
        <p>{t.sourcesIntro}</p>
        <ol>
          {sources.map((s) => (
            <li key={s.url}><a href={s.url} rel="noopener" target="_blank">{s.label}</a></li>
          ))}
        </ol>
        <p className="cmpx-reviewed">{t.reviewed} <time dateTime={REVIEWED.iso}>{REVIEWED[locale]}</time></p>
      </div>
    </Band>
  );
}

function Cta({ t }) {
  return (
    <Band tone="moss">
      <div className="cmpx-cta">
        <div>
          <h2 className="rl-h2">{t.ctaTitle}</h2>
          <p className="rl-lede">{t.ctaText}</p>
        </div>
        <div className="rl-actions">
          <HeroActions t={t} />
        </div>
      </div>
    </Band>
  );
}

function ComparisonPage({ slug, locale, t }) {
  const c = COMPARE[slug];
  const s = c[locale];
  const head = [t.criterion, 'Elchi', s.col];
  const rows = CRITERIA.map((k) => [k[locale], ELCHI[locale][k.key], s.them[k.key]]);
  const others = COMPARE_SLUGS.filter((x) => x !== slug);
  return (
    <>
      <Crumbs t={t} current={`Elchi vs ${c.name}`} />
      <PageHero title={s.h1} lede={s.answer} actions={<HeroActions t={t} />} />

      <Band tone="water">
        <BandHead h2={s.tableTitle} />
        <CompareTable caption={s.tableCaption} head={head} rows={rows} />
      </Band>

      <Band tone="mist">
        <BandHead h2={s.contextTitle} />
        <div className="cmpx-prose">
          {s.context.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Band>

      <Band tone="mist2">
        <div className="cmpx-split">
          <section>
            <h2 className="cmpx-h2s">{s.chooseTitle}</h2>
            <ul className="cmpx-list">{s.choose.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
          <section>
            <h2 className="cmpx-h2s">{s.fitsTitle}</h2>
            <ul className="cmpx-list cmpx-list-elchi">{s.fits.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
        </div>
      </Band>

      <Band tone="water">
        <BandHead h2={t.docsTitle} intro={t.docsIntro} />
        <div className="cmpx-links">
          <div>
            <h3>{t.docsLabel}</h3>
            <ul>
              {c.docs.map((d) => (
                <li key={d.href}><a className="rl-link" href={d.href}>{d[locale]}<Arrow /></a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{t.productsLabel}</h3>
            <ul>
              {c.products.map((p) => (
                <li key={p}><a className="rl-link" href={locHref(`products/${p}`)}>{PRODUCTS[p][locale].metaName}<Arrow /></a></li>
              ))}
              <li><a className="rl-link" href={locHref('plans')}>{t.plans}<Arrow /></a></li>
            </ul>
          </div>
          <div>
            <h3>{t.otherTitle}</h3>
            <ul>
              {others.map((o) => (
                <li key={o}><a className="rl-link" href={locHref(`compare/${o}`)}>Elchi vs {COMPARE[o].name}<Arrow /></a></li>
              ))}
              <li><a className="rl-link" href={locHref('compare')}>{t.allComparisons}<Arrow /></a></li>
            </ul>
          </div>
        </div>
      </Band>

      <Cta t={t} />
      <Sources t={t} locale={locale} sources={c.sources} />
    </>
  );
}

function HubPage({ locale, t }) {
  const h = HUB[locale];
  return (
    <>
      <Crumbs t={t} />
      <PageHero title={h.h1} lede={h.answer} actions={<HeroActions t={t} />} />

      <Band tone="water">
        <BandHead h2={h.tableTitle} />
        <CompareTable caption={h.tableCaption} head={[t.criterion, ...h.cols]} rows={h.rows} hub />
      </Band>

      <Band tone="mist">
        <BandHead h2={h.pagesTitle} />
        <div className="cmpx-cards">
          {COMPARE_SLUGS.map((slug) => {
            const [title, text] = h.pages[slug];
            return (
              <a key={slug} className="cmpx-card" href={locHref(`compare/${slug}`)}>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="cmpx-more">{t.open}<Arrow /></span>
              </a>
            );
          })}
        </div>
      </Band>

      <Band tone="mist2">
        <div className="cmpx-prose">
          <h2 className="cmpx-h2s">{h.notTitle}</h2>
          <p>{h.not}</p>
        </div>
      </Band>

      <Cta t={t} />
      <Sources t={t} locale={locale} sources={HUB.sources} />
    </>
  );
}

function CompareApp({ slug }) {
  const locale = getLocale();
  const t = STR[locale];
  const isHub = !COMPARE[slug];
  return (
    <>
      <Nav active={isHub ? 'compare' : `compare/${slug}`} />
      <main className="rl cmpx">
        {isHub ? <HubPage locale={locale} t={t} /> : <ComparisonPage slug={slug} locale={locale} t={t} />}
      </main>
      <Footer />
    </>
  );
}

export const Page = CompareApp;
if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  ReactDOM.createRoot(root).render(<CompareApp slug={root.dataset.product || 'hub'} />);
}
