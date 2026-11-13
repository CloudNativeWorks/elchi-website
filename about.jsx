import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { Band, BandHead, PageHero, Arrow } from './relief.jsx';
import { CONTACT_EMAIL, COMPANY, offices, OfficeCard } from './offices.jsx';
import { LegalDoc, Ext } from './legal-layout.jsx';

// About page: who builds Elchi and how it reaches you. Facts only. The company
// details come from https://www.cloudnativeworks.com/company (checked 2026-11-13),
// the product facts from PRODUCT.md and faq-data.js. No team members, customers or
// history: none are published. The relationship to Profelis is not documented,
// so the page states only what the site already shows (contact address, footer).
const LINKS = {
  archive: 'https://github.com/CloudNativeWorks/elchi-archive/releases',
  charts: 'https://charts.elchi.io',
  artifacthub: 'https://artifacthub.io/packages/search?repo=elchi',
  github: 'https://github.com/CloudNativeWorks',
  youtube: 'https://www.youtube.com/@CloudNativeWorks',
  profelis: 'https://profelis.com.tr',
};

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

function sectionsEn() {
  return [
    {
      id: 'product',
      title: 'What Elchi is',
      body: <>
        <p>Elchi is a visual control plane for Envoy proxy fleets. You configure listeners, routes, clusters, endpoints, filters and certificates in a UI whose editors are generated from each Envoy version’s protobufs. Each change is validated twice, goes through draft, save and publish steps with an audit log, and reaches the running Envoys over xDS without a restart.</p>
        <p>Several Envoy versions run side by side, and listeners can be upgraded from one version to the next without dropping requests. Security and visibility are part of the same control plane: <strong>Shield</strong>, an ext_proc sidecar with a built-in WAF in the request path, and API discovery derived from real traffic.</p>
        <p>The product family is <strong>Elchi Core</strong>, the base of every deployment, and the licensed add-ons <strong>API Security</strong>, <strong>API Discovery</strong> and <strong>GSLB</strong>. The platform runs as three processes (Registry, Controller and Control Plane), with a lightweight agent, the Elchi client, on every edge host. Everything installs in your own infrastructure.</p>
        <p><a href={locHref('features')}>Features</a> · <a href={locHref('architecture')}>Architecture</a> · <a href={locHref('plans')}>Plans &amp; licensing</a> · <a href={locHref('faq')}>FAQ</a></p>
      </>,
    },
    {
      id: 'company',
      title: 'Who builds it',
      body: <>
        <p>Elchi is built by <strong>CloudNativeWorks</strong>, an infrastructure software company from Türkiye. CloudNativeWorks builds its products in-house; besides Elchi they are ClusterEye (database observability and operations), MergePilot (merge-request governance for GitLab) and CertAutoPilot (certificate lifecycle management).</p>
        <dl className="legal-facts">
          <div><dt>Legal name</dt><dd>{COMPANY.legalName}</dd></div>
          <div><dt>Registered address</dt><dd>{COMPANY.address}</dd></div>
          <div><dt>Tax office</dt><dd>{COMPANY.taxOffice}</dd></div>
          <div><dt>Tax ID (VKN)</dt><dd>{COMPANY.vkn}</dd></div>
          <div><dt>Website</dt><dd><Ext href={COMPANY.url}>cloudnativeworks.com</Ext></dd></div>
        </dl>
      </>,
    },
    {
      id: 'distribution',
      title: 'How Elchi is distributed',
      body: <>
        <p>Elchi releases are published in public, so you can check what you install:</p>
        <div className="about-links">
          <Ext href={LINKS.archive}><b>Release archive</b><span>Release builds and the release manifest, in the public elchi-archive repository on GitHub.</span></Ext>
          <Ext href={LINKS.charts}><b>Helm charts</b><span>charts.elchi.io, also listed on ArtifactHub, for installing the platform on Kubernetes.</span></Ext>
          <a href="/docs/"><b>Documentation</b><span>Installation (Helm, Docker Swarm, bare metal), configuration, operations and the automation API.</span></a>
          <Ext href={LINKS.github}><b>GitHub</b><span>The CloudNativeWorks organization on GitHub.</span></Ext>
        </div>
        <p style={{ marginTop: 16 }}>Without a license, Elchi runs Elchi Core with one managed client, enough to evaluate the platform end to end. Start with the <a href="/docs/getting-started/quickstart">quickstart</a>.</p>
      </>,
    },
    {
      id: 'videos',
      title: 'Videos',
      body: <p>Tutorials and product films are on the <Ext href={LINKS.youtube}>CloudNativeWorks YouTube channel</Ext> and on the <a href={locHref('videos')}>video tutorials</a> page of this site.</p>,
    },
    {
      id: 'contact',
      title: 'Contact',
      body: <>
        <p>For a demo, an enterprise license or support, write to <Mail />. Requests are handled through this address, and the site is marked “Powered by Profelis” (<Ext href={LINKS.profelis}>profelis.com.tr</Ext>). Office addresses and phone numbers are below and on the <a href={locHref('contact')}>contact page</a>.</p>
        <p>How we handle what you send is described in the <a href="/privacy.html">privacy notice</a>.</p>
      </>,
    },
  ];
}

function sectionsTr() {
  return [
    {
      id: 'urun',
      title: 'Elchi nedir',
      body: <>
        <p>Elchi, Envoy proxy filoları için görsel bir control plane’dir. Listener, route, cluster, endpoint, filtre ve sertifikaları, editörleri her Envoy sürümünün protobuf’larından üretilen bir arayüzde yapılandırırsınız. Her değişiklik iki kez doğrulanır, audit log ile taslak, kaydet ve yayınla adımlarından geçer ve çalışan Envoy’lara yeniden başlatma olmadan xDS ile ulaşır.</p>
        <p>Birden fazla Envoy sürümü yan yana çalışır; listener’lar bir sürümden diğerine istek düşürmeden yükseltilebilir. Güvenlik ve görünürlük aynı control plane’in parçasıdır: istek yolunda yerleşik WAF’lı bir ext_proc sidecar olan <strong>Shield</strong> ve gerçek trafikten çıkarılan API keşfi.</p>
        <p>Ürün ailesi, her kurulumun temeli olan <strong>Elchi Core</strong> ile ayrı lisanslanan <strong>API Security</strong>, <strong>API Discovery</strong> ve <strong>GSLB</strong> ek ürünlerinden oluşur. Platform üç süreç olarak çalışır (Registry, Controller ve Control Plane); her edge sunucuda hafif bir agent, Elchi client bulunur. Hepsi sizin altyapınıza kurulur.</p>
        <p><a href={locHref('features')}>Özellikler</a> · <a href={locHref('architecture')}>Mimari</a> · <a href={locHref('plans')}>Paketler &amp; lisanslama</a> · <a href={locHref('faq')}>SSS</a></p>
      </>,
    },
    {
      id: 'sirket',
      title: 'Kim geliştiriyor',
      body: <>
        <p>Elchi’yi Türkiye’den bir altyapı yazılımı şirketi olan <strong>CloudNativeWorks</strong> geliştirir. CloudNativeWorks ürünlerini kendi bünyesinde geliştirir; Elchi dışındaki ürünleri ClusterEye (veritabanı gözlemlenebilirliği ve operasyonları), MergePilot (GitLab için merge request yönetişimi) ve CertAutoPilot’tur (sertifika yaşam döngüsü yönetimi).</p>
        <dl className="legal-facts">
          <div><dt>Unvan</dt><dd>{COMPANY.legalName}</dd></div>
          <div><dt>Adres</dt><dd>{COMPANY.address}</dd></div>
          <div><dt>Vergi dairesi</dt><dd>{COMPANY.taxOffice}</dd></div>
          <div><dt>VKN</dt><dd>{COMPANY.vkn}</dd></div>
          <div><dt>Web sitesi</dt><dd><Ext href={COMPANY.url}>cloudnativeworks.com</Ext></dd></div>
        </dl>
      </>,
    },
    {
      id: 'dagitim',
      title: 'Elchi nasıl dağıtılır',
      body: <>
        <p>Elchi sürümleri herkese açık olarak yayınlanır; kurduğunuz şeyi kontrol edebilirsiniz:</p>
        <div className="about-links">
          <Ext href={LINKS.archive}><b>Sürüm arşivi</b><span>Sürüm derlemeleri ve sürüm manifesti, GitHub’daki herkese açık elchi-archive deposunda.</span></Ext>
          <Ext href={LINKS.charts}><b>Helm chart’ları</b><span>charts.elchi.io, ArtifactHub’da da listelenir; platformu Kubernetes’e kurmak için.</span></Ext>
          <a href="/docs/"><b>Dokümantasyon</b><span>Kurulum (Helm, Docker Swarm, bare metal), yapılandırma, operasyon ve automation API.</span></a>
          <Ext href={LINKS.github}><b>GitHub</b><span>GitHub’daki CloudNativeWorks organizasyonu.</span></Ext>
        </div>
        <p style={{ marginTop: 16 }}>Lisans olmadan Elchi, Elchi Core’u bir yönetilen client ile çalıştırır; bu, platformu uçtan uca değerlendirmeye yeter. <a href="/docs/getting-started/quickstart">Hızlı başlangıç</a> ile başlayın.</p>
      </>,
    },
    {
      id: 'videolar',
      title: 'Videolar',
      body: <p>Eğitim videoları ve ürün filmleri <Ext href={LINKS.youtube}>CloudNativeWorks YouTube kanalında</Ext> ve bu sitedeki <a href={locHref('videos')}>video eğitimleri</a> sayfasındadır.</p>,
    },
    {
      id: 'iletisim',
      title: 'İletişim',
      body: <>
        <p>Demo, kurumsal lisans veya destek için <Mail /> adresine yazın. Talepler bu adres üzerinden yürütülür; site “Powered by Profelis” (<Ext href={LINKS.profelis}>profelis.com.tr</Ext>) ibaresini taşır. Ofis adresleri ve telefon numaraları aşağıda ve <a href={locHref('contact')}>iletişim sayfasında</a>.</p>
        <p>Gönderdiğiniz bilgileri nasıl işlediğimiz <a href="/tr/privacy.html">KVKK aydınlatma metninde</a> anlatılır.</p>
      </>,
    },
  ];
}

const STR = {
  en: {
    title: 'About Elchi.',
    lede: 'Elchi is a visual control plane for Envoy proxy fleets, built by CloudNativeWorks, an infrastructure software company from Türkiye.',
    contact: 'Book a demo',
    docs: 'Read the docs',
    toc: 'On this page',
    offices: 'Offices',
    hq: 'Headquarters · Türkiye', tr: 'Türkiye', bg: 'Bulgaria', istanbulOffice: 'İstanbul Office', tel: 'Tel', fax: 'Fax',
    sections: sectionsEn,
  },
  tr: {
    title: 'Elchi hakkında.',
    lede: 'Elchi, Envoy proxy filoları için görsel bir control plane’dir; Türkiye’den bir altyapı yazılımı şirketi olan CloudNativeWorks tarafından geliştirilir.',
    contact: 'Demo talep et',
    docs: 'Dokümanları okuyun',
    toc: 'Bu sayfada',
    offices: 'Ofisler',
    hq: 'Genel Merkez · Türkiye', tr: 'Türkiye', bg: 'Bulgaristan', istanbulOffice: 'İstanbul Ofisi', tel: 'Tel', fax: 'Faks',
    sections: sectionsTr,
  },
};

function AboutApp() {
  const locale = getLocale();
  const t = STR[locale];
  const list = offices(t);
  return (
    <>
      <Nav active="about" />
      <main className="rl">
        <PageHero
          title={t.title}
          lede={t.lede}
          actions={<>
            <a href={locHref('contact')} className="rl-go">{t.contact}<Arrow /></a>
            <a href="/docs/" className="rl-link">{t.docs}<Arrow /></a>
          </>}
        />
        <Band tone="mist2">
          <LegalDoc tocLabel={t.toc} sections={t.sections()} />
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

export const Page = AboutApp;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<AboutApp/>);
