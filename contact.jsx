import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale } from './i18n.js';
import { Band, BandHead, PageHero, Arrow } from './relief.jsx';

// All user-visible copy for the contact page. Office names, addresses and
// phone numbers are shared verbatim between locales.
const STR = {
  en: {
    hero: {
      title: 'Get in touch.',
      subtitle: 'Questions about Elchi, enterprise support, or a demo? Reach us at any of our offices.',
    },
    offices: 'Offices',
    hq: 'Headquarters · Türkiye',
    tr: 'Türkiye',
    bg: 'Bulgaria',
    istanbulOffice: 'İstanbul Office',
    tel: 'Tel',
    fax: 'Fax',
  },
  tr: {
    hero: {
      title: 'Bize ulaşın.',
      subtitle: 'Elchi hakkında sorularınız, kurumsal destek veya demo için ofislerimizden bize ulaşabilirsiniz.',
    },
    offices: 'Ofisler',
    hq: 'Genel Merkez · Türkiye',
    tr: 'Türkiye',
    bg: 'Bulgaristan',
    istanbulOffice: 'İstanbul Ofisi',
    tel: 'Tel',
    fax: 'Faks',
  },
};

const CONTACT_EMAIL = 'info@profelis.com.tr';

function offices(t) {
  return [
    {
      city: 'Ankara',
      sub: t.hq,
      address: 'Cinnah Cad. Vali Doktor Reşit Sok. No:6/1, 06690 Çankaya / Ankara',
      phones: [
        { label: t.tel, num: '+90 312 482 8021', link: true },
        { label: t.tel, num: '+90 312 482 8012', link: true },
        { label: t.fax, num: '+90 312 482 8040', link: false },
      ],
    },
    {
      city: 'İstanbul',
      sub: t.tr,
      address: t.istanbulOffice,
      phones: [
        { label: t.tel, num: '+90 212 212 8021', link: true },
      ],
    },
    {
      city: 'Sofia',
      sub: t.bg,
      address: '1 Dimitar Manchev St., Vitosha Tulip, Block G, Floor 1, No:3, 1407 Krastova vada, Sofia',
      phones: [
        { label: t.tel, num: '+359 89 677 0220', link: true },
      ],
    },
  ];
}

// A small map pin (replaces the flag emoji: no glyphs as icons).
const Pin = () => (
  <svg className="office-pin" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 16.2s5.4-4.9 5.4-9A5.4 5.4 0 0 0 3.6 7.2c0 4.1 5.4 9 5.4 9z" fill="currentColor" opacity=".2"/><circle cx="9" cy="7.2" r="2.2" fill="currentColor"/></svg>
);

function OfficeCard({ office, hq }) {
  return (
    <article className={`office${hq ? ' office-hq' : ''}`}>
      <header className="office-head">
        <span className="rl-map-label office-country"><Pin />{office.sub}</span>
        <h3>{office.city}</h3>
      </header>
      <p className="office-address">{office.address}</p>
      <dl className="office-lines">
        {office.phones.map((p, i) => (
          <div key={i} className="office-line">
            <dt>{p.label}</dt>
            <dd>{p.link
              ? <a href={`tel:${p.num.replace(/\s/g, '')}`}>{p.num}</a>
              : <span>{p.num}</span>}</dd>
          </div>
        ))}
      </dl>
      <a className="office-mail" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </article>
  );
}

function ContactApp() {
  const locale = getLocale();
  const t = STR[locale];
  const list = offices(t);
  const hqTel = list[0].phones[0].num;
  return (
    <>
      <Nav active="contact" />
      <main className="rl">
        <PageHero
          title={t.hero.title}
          lede={t.hero.subtitle}
          actions={<>
            <a href={`mailto:${CONTACT_EMAIL}`} className="rl-go contact-mail">{CONTACT_EMAIL}<Arrow /></a>
            <a href={`tel:${hqTel.replace(/\s/g, '')}`} className="rl-pill contact-tel">{hqTel}</a>
          </>}
        />
        <Band tone="water">
          <BandHead h2={t.offices} />
          <div className="offices-grid">
            {list.map((o, i) => <OfficeCard key={o.city} office={o} hq={i === 0} />)}
          </div>
        </Band>
      </main>
      <Footer />
    </>
  );
}

export const Page = ContactApp;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<ContactApp/>);
