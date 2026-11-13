// Contact details and the office card, shared by the contact page (contact.jsx)
// and the about page (about.jsx). Office names, addresses and phone numbers are
// the same in both locales; only the labels come from the page's string table.
// The card's styles live in contact.css (both pages link it).

export const CONTACT_EMAIL = 'info@profelis.com.tr';

// The legal entity behind CloudNativeWorks, as published on
// https://www.cloudnativeworks.com/company (checked 2026-11-13).
export const COMPANY = {
  brand: 'CloudNativeWorks',
  legalName: 'Cloud Native Teknoloji Bilişim ve Danışmanlık Ticaret ve Sanayi Anonim Şirketi',
  address: 'Aziziye Mah. Vali Doktor Reşit Sk. No: 6 İç Kapı No: 1, Çankaya / Ankara, Türkiye',
  taxOffice: 'Hitit',
  vkn: '2111569107',
  url: 'https://www.cloudnativeworks.com',
};

// t: { hq, tr, bg, istanbulOffice, tel, fax } from the page's strings.
export function offices(t) {
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

export function OfficeCard({ office, hq }) {
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
