import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { Band, BandHead, PageHero, Arrow } from './relief.jsx';
import { CONTACT_EMAIL, offices, OfficeCard } from './offices.jsx';

// All user-visible copy for the contact page. Office names, addresses and
// phone numbers live in offices.jsx and are shared verbatim between locales.
const STR = {
  en: {
    hero: {
      title: 'Get in touch.',
      subtitle: 'Questions about Elchi, enterprise support, or a demo? Reach us at any of our offices.',
    },
    privacy: <>We use what you send only to answer you and to follow up on your request. See the <a href="/privacy.html">privacy notice</a>.</>,
    next: {
      h2: 'What happens next',
      intro: 'Write to us by e-mail. A few lines about your setup are enough to start.',
      steps: [
        {
          h: 'Tell us about your fleet',
          p: 'Roughly how many hosts run Envoy, whether they are VMs, Kubernetes or both, which Envoy versions you use, and which add-ons you are looking at: API Security (Shield), API Discovery or GSLB.',
        },
        {
          h: 'We reply by e-mail',
          p: 'We answer your questions and, if you want one, suggest a time for a demo call.',
        },
        {
          h: 'Demo call',
          p: 'We show Elchi working on the parts that matter to you and go through your questions about installation, architecture and operations.',
        },
        {
          h: 'Scoping a license',
          p: 'Licenses are sized by the number of managed clients (edge nodes) and by product. We work out the scope with you; a license can be activated online or with an offline license file.',
        },
      ],
      meanwhile: 'Meanwhile, the free tier runs Elchi Core with one managed client.',
      quickstart: 'Start with the quickstart',
      plans: 'Plans & licensing',
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
    privacy: <>Gönderdiğiniz bilgileri yalnızca size cevap vermek ve talebinizi takip etmek için kullanırız. Ayrıntılar <a href="/tr/privacy.html">KVKK aydınlatma metninde</a>.</>,
    next: {
      h2: 'Sonra ne olur',
      intro: 'Bize e-posta ile yazın. Başlamak için kurulumunuzu anlatan birkaç satır yeterli.',
      steps: [
        {
          h: 'Filonuzu anlatın',
          p: 'Yaklaşık kaç sunucuda Envoy çalıştığını, bunların VM mi Kubernetes mi (ya da ikisi) olduğunu, hangi Envoy sürümlerini kullandığınızı ve hangi ek ürünlerle ilgilendiğinizi yazın: API Security (Shield), API Discovery veya GSLB.',
        },
        {
          h: 'E-posta ile cevap veririz',
          p: 'Sorularınızı cevaplarız ve isterseniz bir demo görüşmesi için zaman öneririz.',
        },
        {
          h: 'Demo görüşmesi',
          p: 'Elchi’yi sizin için önemli olan kısımlarda çalışırken gösterir; kurulum, mimari ve operasyonla ilgili sorularınızın üzerinden geçeriz.',
        },
        {
          h: 'Lisansın kapsamı',
          p: 'Lisanslar yönetilen client (edge node) sayısına ve ürüne göre belirlenir. Kapsamı sizinle birlikte çıkarırız; lisans çevrimiçi veya çevrimdışı bir lisans dosyasıyla etkinleştirilebilir.',
        },
      ],
      meanwhile: 'Bu arada, ücretsiz sürüm Elchi Core’u bir yönetilen client ile çalıştırır.',
      quickstart: 'Hızlı başlangıç ile başlayın',
      plans: 'Paketler & lisanslama',
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
            <p className="contact-privacy">{t.privacy}</p>
          </>}
        />
        <Band tone="mist2">
          <BandHead h2={t.next.h2} intro={t.next.intro} />
          <ol className="contact-steps">
            {t.next.steps.map((s, i) => (
              <li key={i} className="contact-step">
                <span className="contact-step-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </li>
            ))}
          </ol>
          <p className="contact-meanwhile">
            {t.next.meanwhile}{' '}
            <a href="/docs/getting-started/quickstart" className="rl-link">{t.next.quickstart}<Arrow /></a>
            <a href={locHref('plans')} className="rl-link">{t.next.plans}<Arrow /></a>
          </p>
        </Band>
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
