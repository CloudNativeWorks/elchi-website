import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { Band, BandHead, PageHero, Arrow } from './relief.jsx';
import { FAQ_GROUPS } from './faq-data.js';

// FAQ page. The answers are plain text in faq-data.js, and the same entries become the
// page's FAQPage JSON-LD below, so the markup always matches the visible text.
const STR = {
  en: {
    title: 'Frequently asked questions.',
    lede: 'Short, factual answers about what Elchi is, how it runs, and how it is licensed. Each answer links the documentation page that covers it in full.',
    docs: 'Read the docs',
    contact: 'Ask us',
    more: 'In the docs',
  },
  tr: {
    title: 'Sık sorulan sorular.',
    lede: 'Elchi’nin ne olduğu, nasıl çalıştığı ve nasıl lisanslandığı hakkında kısa ve net cevaplar. Her cevap, konuyu ayrıntılı anlatan doküman sayfasına bağlanır.',
    docs: 'Dokümanları okuyun',
    contact: 'Bize sorun',
    more: 'Dokümanda',
  },
};

function JsonLd({ locale }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: FAQ_GROUPS.flatMap((g) => g.items.map((it) => ({
      '@type': 'Question',
      name: it[locale][0],
      acceptedAnswer: { '@type': 'Answer', text: it[locale][1] },
    }))),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}/>;
}

function FaqApp() {
  const locale = getLocale();
  const t = STR[locale];
  return (
    <>
      <JsonLd locale={locale} />
      <Nav active="faq" />
      <main className="rl">
        <PageHero
          title={t.title}
          lede={t.lede}
          actions={<>
            <a href="/docs/" className="rl-go">{t.docs}<Arrow /></a>
            <a href={locHref('contact')} className="rl-link">{t.contact}<Arrow /></a>
          </>}
        />
        {FAQ_GROUPS.map((g, gi) => (
          <Band key={gi} tone={gi % 2 ? 'mist2' : 'water'}>
            <BandHead h2={g[locale]} />
            <div className="faq-list">
              {g.items.map((it) => {
                const [q, a] = it[locale];
                return (
                  <article className="faq-item" key={q}>
                    <h3>{q}</h3>
                    <p>{a}</p>
                    <a className="faq-doc" href={it.doc}>{t.more}<Arrow /></a>
                  </article>
                );
              })}
            </div>
          </Band>
        ))}
      </main>
      <Footer />
    </>
  );
}

export const Page = FaqApp;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<FaqApp/>);
