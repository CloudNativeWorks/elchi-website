import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale } from './i18n.js';

// All user-visible copy for the contact page. Office names, addresses and
// phone numbers are shared verbatim between locales.
const STR = {
  en: {
    hero: {
      eyebrow: 'CONTACT',
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
      eyebrow: 'İLETİŞİM',
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
      flag: '🇹🇷',
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
      flag: '🇹🇷',
      city: 'İstanbul',
      sub: t.tr,
      address: t.istanbulOffice,
      phones: [
        { label: t.tel, num: '+90 212 212 8021', link: true },
      ],
    },
    {
      flag: '🇧🇬',
      city: 'Sofia',
      sub: t.bg,
      address: '1 Dimitar Manchev St., Vitosha Tulip, Block G, Floor 1, No:3, 1407 Krastova vada, Sofia',
      phones: [
        { label: t.tel, num: '+359 89 677 0220', link: true },
      ],
    },
  ];
}

function OfficeCard({ office }) {
  return (
    <div className="card office-card">
      <div className="office-head">
        <span className="office-flag">{office.flag}</span>
        <div>
          <h3>{office.city}</h3>
          <span className="office-sub">{office.sub}</span>
        </div>
      </div>
      <p className="office-address">{office.address}</p>
      <div className="office-lines">
        {office.phones.map((p, i) => (
          <span key={i} className="office-line mono">
            <span className="office-line-key">{p.label}:</span>
            {p.link
              ? <a href={`tel:${p.num.replace(/\s/g, '')}`}>{p.num}</a>
              : <span>{p.num}</span>}
          </span>
        ))}
        <span className="office-line mono">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </span>
      </div>
    </div>
  );
}

function ContactApp() {
  const locale = getLocale();
  const t = STR[locale];
  return (
    <>
      <Nav active="contact" />
      <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg"></div>
        <div className="container" style={{ position: 'relative' }}>
          <div className="section-head">
            <span className="eyebrow"><span className="dot"></span>{t.hero.eyebrow}</span>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', marginBottom: 16 }}>{t.hero.title}</h1>
            <p style={{ fontSize: 18 }}>{t.hero.subtitle}</p>
          </div>
          <div className="offices-grid">
            {offices(t).map((o, i) => <OfficeCard key={i} office={o} />)}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ContactApp/>);
