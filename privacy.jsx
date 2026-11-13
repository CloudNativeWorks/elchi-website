import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale } from './i18n.js';
import { Band, PageHero } from './relief.jsx';
import { CONTACT_EMAIL, COMPANY } from './offices.jsx';
import { LegalDoc, Ext, Table } from './legal-layout.jsx';

// Privacy notice (EN) and KVKK aydınlatma metni + çerez politikası (TR).
//
// Every statement here must stay true of what the site actually runs. The sources:
//   - Google Tag Manager GTM-5G5WC537: injected by public/consent.js ONLY after the
//     visitor accepts (no GTM request before consent); Consent Mode default "denied" from
//     vite.config.js (CONSENT_DEFAULT) and the docs config. On 2026-11-13 the
//     published container (gtm.js?id=GTM-5G5WC537) held no tags ("tags":[]).
//   - Crisp live chat and the 'elchi-consent' localStorage key: public/consent.js
//     (Crisp is loaded only after the visitor accepts).
//   - YouTube: video-player.jsx / videos.jsx (youtube-nocookie.com, loaded only on play).
//   - Release list: shared.jsx fetches https://archive.elchi.io/index.json.
//   - Hosting: GitHub Pages (.github/workflows/deploy.yaml; archive.elchi.io too).
//   - Fonts are self-hosted on both the marketing pages (@fontsource) and the docs
//     (docs-site/static/fonts, docs-site/src/css/custom.css). Docs search is local
//     (@easyops-cn/docusaurus-search-local, no third party).
// Change this page (and LAST_UPDATED) whenever one of those changes.
const LAST_UPDATED = { en: '13 November 2026', tr: '13 Kasım 2026' };

const LINKS = {
  google: 'https://policies.google.com/privacy',
  crisp: 'https://crisp.chat/en/privacy/',
  github: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
  kvkk: 'https://www.kvkk.gov.tr',
};

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
const Prefs = ({ children }) => <a href="#cookie-preferences" className="legal-btn">{children}</a>;

// ---------------------------------------------------------------- English
function sectionsEn() {
  return [
    {
      id: 'who',
      title: 'Who we are',
      body: <>
        <p>www.elchi.io and its documentation at www.elchi.io/docs/ are run by <strong>{COMPANY.legalName}</strong> (“CloudNativeWorks”, “we”), which builds Elchi. We are the controller of the personal data described in this notice.</p>
        <dl className="legal-facts">
          <div><dt>Registered address</dt><dd>{COMPANY.address}</dd></div>
          <div><dt>Tax office / tax ID</dt><dd>{COMPANY.taxOffice} · {COMPANY.vkn}</dd></div>
          <div><dt>Contact</dt><dd><Mail /></dd></div>
        </dl>
        <p style={{ marginTop: 16 }}>This notice covers this website only. The Elchi software you install runs in your own infrastructure; its documentation describes what it stores.</p>
      </>,
    },
    {
      id: 'glance',
      title: 'At a glance',
      body: <ul>
        <li>Browsing the site needs no account, and we do not ask who you are.</li>
        <li>Analytics and the live chat set cookies <strong>only if you accept</strong> them in the cookie banner. Rejecting is as easy as accepting, and you can change your choice at any time.</li>
        <li>We only receive personal data you choose to send us: an e-mail, a phone call or a chat message.</li>
        <li>We do not sell your data and we do not add you to a mailing list.</li>
      </ul>,
    },
    {
      id: 'collect',
      title: 'What we collect, why, and on what basis',
      body: <>
        <h3>Visiting the site</h3>
        <p>The site is hosted on <strong>GitHub Pages</strong>. To serve and protect it, GitHub may record technical data such as your IP address, the pages requested, the time and your browser’s user agent. We do not receive these logs; GitHub processes them under its own <Ext href={LINKS.github}>privacy statement</Ext>.</p>
        <p>Each page also fetches the list of current Elchi releases from archive.elchi.io, which is hosted on GitHub Pages as well, so the same kind of technical data reaches GitHub.</p>
        <p><strong>Google Tag Manager</strong> (container GTM-5G5WC537) is not loaded until you accept cookies. Before that, no request goes to Google from our pages, so Google receives nothing about your visit. After you accept, Tag Manager is loaded from Google’s servers and Google receives your IP address and the page address.</p>
        <p><strong>Legal basis:</strong> our legitimate interest in delivering a working, secure website.</p>

        <h3>Analytics (only with your consent)</h3>
        <p>If you accept, tags loaded through Google Tag Manager may measure how the site is used (pages visited, referrer, device and browser type) so we can see which pages help visitors. On 13 November 2026 our Tag Manager container published no tags, so no analytics cookies are set even after you accept. Before we add a tag that sets cookies, we will list those cookies in the table below.</p>
        <p><strong>Legal basis:</strong> your consent, which you can withdraw at any time.</p>

        <h3>Live chat (only with your consent)</h3>
        <p>The chat window is provided by <strong>Crisp</strong> and is not loaded at all until you accept. Once loaded, Crisp processes your chat messages, any name or e-mail address you type into the chat, and technical data such as your IP address, browser and device type and the page you are on. See Crisp’s <Ext href={LINKS.crisp}>privacy policy</Ext>.</p>
        <p><strong>Legal basis:</strong> your consent for loading the chat and its cookies; for the content of your messages, the steps you ask us to take before a possible contract and our legitimate interest in answering you.</p>

        <h3>Videos</h3>
        <p>Video thumbnails are served from this site. The YouTube player (from youtube-nocookie.com) is loaded only when you press play; from then on Google receives your IP address and data about the playback under its <Ext href={LINKS.google}>privacy policy</Ext>. Links that say “Watch on YouTube” take you to YouTube itself.</p>
        <p><strong>Legal basis:</strong> your request when you start a video.</p>

        <h3>Documentation</h3>
        <p>Fonts and images on the site and in the documentation at /docs/ are served from this site itself. The docs search runs in your browser and sends your search terms nowhere. The cookie banner, Tag Manager and the live chat work on the docs exactly as on the rest of the site.</p>

        <h3>When you write to us or call us</h3>
        <p>When you e-mail <Mail />, call one of our offices or write in the chat, we receive what you send: usually your name, work e-mail address, company, phone number and your message (for example, details about your environment for a demo or a license).</p>
        <p>We use it to answer you and to follow up on the request you made. <strong>Legal basis:</strong> the steps you ask us to take before a possible contract, and our legitimate interest in answering enquiries.</p>
      </>,
    },
    {
      id: 'cookies',
      title: 'Cookies and similar technologies',
      body: <>
        <p>Only the first entry below is used without your consent: it stores the choice you made in the banner, so we do not ask again on every page.</p>
        <Table
          caption="Cookies and browser storage used on www.elchi.io"
          head={['Name', 'Provider', 'Purpose', 'Duration', 'When']}
          rows={[
            [<code>elchi-consent</code>, 'elchi.io (browser localStorage, not a cookie)', 'Remembers whether you accepted or rejected cookies', 'Until you clear your browser’s site data', 'Always (strictly necessary)'],
            [<code>crisp-client/*</code>, 'Crisp', 'Keeps your live chat session and conversation', 'Set by Crisp; the session cookie lasts up to 6 months', 'Only after you accept'],
            ['Cookies of tags in Google Tag Manager', 'Google', 'Analytics', 'As set by each tag; listed here before a tag that sets cookies is added', 'Only after you accept (none on 13 November 2026)'],
            ['YouTube player storage', 'Google (youtube-nocookie.com)', 'Plays the video you started', 'Set by Google', 'Only after you press play'],
          ]}
        />
        <p style={{ marginTop: 16 }}>You can change or withdraw your choice at any time. Withdrawing does not affect processing that took place before.</p>
        <Prefs>Change cookie preferences</Prefs>
      </>,
    },
    {
      id: 'recipients',
      title: 'Who receives your data, and transfers abroad',
      body: <>
        <p>We share personal data only with the service providers that run parts of this site, each for the purpose described above:</p>
        <ul>
          <li><strong>GitHub, Inc.</strong> (United States): hosting of the site, the docs and the release archive.</li>
          <li><strong>Google</strong>: Google Tag Manager and any tags in it, and the YouTube player.</li>
          <li><strong>Crisp IM SAS</strong> (France): the live chat, only after you accept.</li>
          <li>Our e-mail provider, which stores the messages you send us.</li>
        </ul>
        <p>These providers process data outside Türkiye, and some outside the European Economic Area. Where you accept cookies or start the chat or a video, the transfer is based on your consent; otherwise it takes place under the conditions the applicable law sets for transfers abroad. We may also disclose data to public authorities where the law requires it.</p>
      </>,
    },
    {
      id: 'retention',
      title: 'How long we keep it',
      body: <ul>
        <li><strong>E-mails and chat conversations:</strong> for as long as we need them to handle your request and any work that follows from it, and then deleted, unless a legal obligation (for example, on keeping commercial correspondence) requires us to keep them longer.</li>
        <li><strong>Your cookie choice:</strong> in your own browser until you clear it.</li>
        <li><strong>Hosting logs, chat technical data and Google data:</strong> kept by GitHub, Crisp and Google for the periods described in their own policies.</li>
      </ul>,
    },
    {
      id: 'rights',
      title: 'Your rights',
      body: <>
        <p>You can ask us whether we process personal data about you and for a copy of it; ask us to correct, delete or restrict it; object to processing based on our legitimate interests; ask for data you gave us in a portable format; and withdraw your consent at any time. You also have the rights listed in Article 11 of the Turkish Personal Data Protection Law No. 6698 (KVKK), which the <a href="/tr/privacy.html">Turkish version of this notice</a> describes in full.</p>
        <p>If you think we have not handled your data properly, you can complain to the Turkish Personal Data Protection Authority (<Ext href={LINKS.kvkk}>kvkk.gov.tr</Ext>) or, if you are in the EU or EEA, to the data protection authority where you live.</p>
      </>,
    },
    {
      id: 'contact',
      title: 'How to make a request',
      body: <>
        <p>Send your request by e-mail to <Mail />, or by post to {COMPANY.legalName}, {COMPANY.address}. Tell us who you are and what you are asking for, so we can find your data and answer you. We answer free of charge and within 30 days at the latest.</p>
      </>,
    },
    {
      id: 'changes',
      title: 'Changes to this notice',
      body: <p>When what the site collects changes, we update this page and the date at the top.</p>,
    },
  ];
}

// ---------------------------------------------------------------- Türkçe
function sectionsTr() {
  return [
    {
      id: 'veri-sorumlusu',
      title: 'Veri sorumlusu',
      body: <>
        <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla <strong>{COMPANY.legalName}</strong> (“CloudNativeWorks”, “Şirket”) tarafından aşağıda açıklanan kapsamda işlenmektedir. Bu metin, KVKK’nın 10. maddesi ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca hazırlanmıştır.</p>
        <dl className="legal-facts">
          <div><dt>Unvan</dt><dd>{COMPANY.legalName}</dd></div>
          <div><dt>Adres</dt><dd>{COMPANY.address}</dd></div>
          <div><dt>Vergi dairesi / VKN</dt><dd>{COMPANY.taxOffice} V.D. · {COMPANY.vkn}</dd></div>
          <div><dt>E-posta</dt><dd><Mail /></dd></div>
        </dl>
        <p style={{ marginTop: 16 }}>Bu metin yalnızca www.elchi.io sitesini ve www.elchi.io/docs/ altındaki dokümantasyonu kapsar. Kurduğunuz Elchi yazılımı sizin altyapınızda çalışır; neleri sakladığı dokümantasyonunda anlatılır.</p>
      </>,
    },
    {
      id: 'veriler',
      title: 'İşlenen kişisel veriler ve toplama yöntemi',
      body: <>
        <p>Siteyi gezmek için hesap açmanız gerekmez ve kim olduğunuzu sormayız. Aşağıdaki veriler işlenebilir:</p>
        <ul>
          <li><strong>İşlem güvenliği verileri:</strong> IP adresi, ziyaret edilen sayfa, erişim zamanı, tarayıcı ve cihaz bilgisi. Siteye her girişte barındırma hizmeti ve tarayıcınızın yaptığı istekler aracılığıyla <strong>otomatik yollarla</strong> toplanır.</li>
          <li><strong>Kullanım (analiz) verileri:</strong> ziyaret edilen sayfalar, yönlendiren adres, cihaz ve tarayıcı türü. Yalnızca çerezlere onay verirseniz, çerezler ve benzeri teknolojilerle <strong>otomatik yollarla</strong> toplanabilir.</li>
          <li><strong>Kimlik ve iletişim verileri:</strong> ad soyad, iş e-posta adresi, telefon numarası, şirket. Bize e-posta gönderdiğinizde, telefonla aradığınızda veya canlı destekte yazdığınızda <strong>sizin tarafınızdan iletilerek</strong> toplanır.</li>
          <li><strong>Müşteri işlem verileri:</strong> mesajınızın içeriği ve talebiniz (örneğin demo veya lisans için ortamınıza ilişkin bilgiler). Aynı kanallarla sizin tarafınızdan iletilir.</li>
        </ul>
        <p>Özel nitelikli kişisel veri talep etmiyoruz; lütfen mesajlarınızda bu tür veriler paylaşmayın.</p>
      </>,
    },
    {
      id: 'amaclar',
      title: 'İşleme amaçları ve hukuki sebepler',
      body: <>
        <Table
          caption="İşleme amaçları ve hukuki sebepler"
          head={['Faaliyet', 'Amaç', 'Hukuki sebep (KVKK md. 5)']}
          rows={[
            ['Sitenin barındırılması ve sunulması (GitHub Pages); güncel sürüm listesinin archive.elchi.io’dan alınması', 'Sitenin çalışması ve güvenliği', 'Meşru menfaat (md. 5/2-f)'],
            ['Google Tag Manager’ın yüklenmesi ve onun üzerinden yüklenen analiz etiketleri ve çerezleri', 'Sitenin nasıl kullanıldığını ölçmek', 'Açık rıza (md. 5/1)'],
            ['Canlı destek penceresinin (Crisp) yüklenmesi ve çerezleri', 'Canlı destek sunmak', 'Açık rıza (md. 5/1)'],
            ['E-posta, telefon veya canlı destek üzerinden gelen taleplerin cevaplanması', 'Sorularınızı cevaplamak; demo ve lisans taleplerinizi takip etmek', 'Bir sözleşmenin kurulmasıyla doğrudan ilgili olması (md. 5/2-c) ve meşru menfaat (md. 5/2-f)'],
            ['Video oynatıcının (youtube-nocookie.com) yüklenmesi', 'Başlattığınız videoyu oynatmak', 'Açık rıza (md. 5/1): oynatıcı yalnızca siz oynat düğmesine bastığınızda yüklenir'],
            ['Çerez tercihinizin tarayıcınızda saklanması', 'Tercihinizi her sayfada tekrar sormamak', 'Meşru menfaat (md. 5/2-f); zorunlu teknik kayıt'],
          ]}
        />
        <p style={{ marginTop: 16 }}>Kişisel verileriniz, kanunların açıkça öngördüğü hâllerde ve yetkili kamu kurumlarının talebi üzerine hukuki yükümlülüklerimizi yerine getirmek amacıyla da işlenebilir (md. 5/2-ç).</p>
        <p>Google Tag Manager, çerezleri kabul etmediğiniz sürece yüklenmez; onayınızdan önce sayfalarımızdan Google’a hiçbir istek gönderilmez. Onay verdiğinizde Google Tag Manager Google sunucularından yüklenir ve IP adresiniz ile sayfa adresi Google’a ulaşır. 13 Kasım 2026 itibarıyla konteynerimizde yayınlanmış bir etiket bulunmamaktadır.</p>
      </>,
    },
    {
      id: 'aktarim',
      title: 'Aktarım: alıcılar ve yurt dışına aktarım',
      body: <>
        <p>Kişisel verileriniz yalnızca yukarıdaki amaçlarla ve bu amaçlar için gerekli olduğu ölçüde aşağıdaki hizmet sağlayıcılara aktarılır:</p>
        <ul>
          <li><strong>GitHub, Inc.</strong> (ABD): sitenin, dokümantasyonun ve sürüm arşivinin barındırılması (<Ext href={LINKS.github}>gizlilik bildirimi</Ext>).</li>
          <li><strong>Google</strong>: Google Tag Manager ve içindeki etiketler ile YouTube oynatıcısı (<Ext href={LINKS.google}>gizlilik politikası</Ext>).</li>
          <li><strong>Crisp IM SAS</strong> (Fransa): canlı destek, yalnızca onay vermenizden sonra (<Ext href={LINKS.crisp}>gizlilik politikası</Ext>).</li>
          <li>E-posta hizmet sağlayıcımız: bize gönderdiğiniz e-postaların saklanması.</li>
        </ul>
        <p>Bu hizmet sağlayıcıların sunucuları yurt dışında bulunduğundan, söz konusu aktarımlar <strong>yurt dışına aktarım</strong> niteliğindedir ve KVKK’nın 9. maddesinde öngörülen şartlara uygun olarak yapılır. Google Tag Manager ve analiz çerezleri, canlı destek ve video oynatıcı bakımından aktarım, çerez onayı veya oynatıcıyı başlatmanızla verdiğiniz <strong>açık rızanıza</strong> dayanır; açık rıza vermemeniz siteyi kullanmanıza engel değildir.</p>
        <p>Kanunen yetkili kamu kurum ve kuruluşlarına, talep etmeleri hâlinde ve mevzuatın izin verdiği ölçüde aktarım yapılabilir.</p>
      </>,
    },
    {
      id: 'saklama',
      title: 'Saklama süreleri',
      body: <ul>
        <li><strong>E-postalar ve canlı destek yazışmaları:</strong> talebinizin ve bundan doğan işin gerektirdiği süre boyunca saklanır, ardından silinir. İlgili mevzuattaki saklama yükümlülükleri (örneğin ticari yazışmalara ilişkin olanlar) saklıdır.</li>
        <li><strong>Çerez tercihiniz:</strong> siz tarayıcınızdaki site verilerini silene kadar yalnızca sizin tarayıcınızda saklanır.</li>
        <li><strong>Barındırma kayıtları, canlı destek teknik verileri ve Google’a ulaşan veriler:</strong> GitHub, Crisp ve Google tarafından kendi politikalarında belirtilen süreler boyunca saklanır.</li>
      </ul>,
    },
    {
      id: 'haklar',
      title: 'KVKK md. 11 kapsamındaki haklarınız',
      body: <>
        <p>KVKK’nın 11. maddesi uyarınca veri sorumlusuna başvurarak:</p>
        <ul>
          <li>kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
          <li>işlenmişse buna ilişkin bilgi talep etme,</li>
          <li>işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,</li>
          <li>eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
          <li>KVKK’nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
          <li>düzeltme, silme veya yok etme işlemlerinin kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>işlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
          <li>kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
        </ul>
        <p style={{ marginTop: 12 }}>haklarına sahipsiniz. Verdiğiniz açık rızayı da istediğiniz zaman geri alabilirsiniz; geri alma, o tarihe kadar yapılan işlemleri etkilemez.</p>
      </>,
    },
    {
      id: 'basvuru',
      title: 'Başvuru yolu',
      body: <>
        <p>Haklarınıza ilişkin taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ’e uygun olarak:</p>
        <ul>
          <li>yazılı olarak ve ıslak imzalı şekilde <strong>{COMPANY.legalName}, {COMPANY.address}</strong> adresine posta veya elden teslim yoluyla,</li>
          <li>kayıtlı elektronik posta (KEP), güvenli elektronik imza veya mobil imza ile,</li>
          <li>ya da daha önce tarafımıza bildirdiğiniz ve sistemimizde kayıtlı olan e-posta adresinizden <Mail /> adresine e-posta göndererek</li>
        </ul>
        <p style={{ marginTop: 12 }}>iletebilirsiniz. Başvurunuzda adınız soyadınız, (yazılı başvurularda) imzanız, T.C. kimlik numaranız (yabancılar için uyruk ile pasaport veya kimlik numarası), tebligata esas yerleşim yeri veya iş yeri adresiniz, varsa bildirime esas e-posta adresiniz, telefon numaranız ve talebinizin konusu bulunmalıdır.</p>
        <p>Başvurunuzu, talebin niteliğine göre en kısa sürede ve en geç <strong>otuz gün</strong> içinde ücretsiz olarak sonuçlandırırız. İşlemin ayrıca bir maliyet gerektirmesi hâlinde Kişisel Verileri Koruma Kurulu’nca belirlenen tarifedeki ücret alınabilir. Başvurunuzun reddedilmesi, verilen cevabı yetersiz bulmanız veya süresinde cevap verilmemesi hâlinde Kişisel Verileri Koruma Kurulu’na (<Ext href={LINKS.kvkk}>kvkk.gov.tr</Ext>) şikâyette bulunabilirsiniz.</p>
      </>,
    },
    {
      id: 'cerez-politikasi',
      title: 'Çerez Politikası',
      body: <>
        <p>Çerezler, ziyaret ettiğiniz sitenin tarayıcınıza kaydettiği küçük dosyalardır; localStorage gibi tarayıcı depolama alanları da benzer amaçla kullanılır. Sitemiz ilk ziyaretinizde bir çerez bildirimi gösterir. <strong>Kabul et</strong> ve <strong>Reddet</strong> seçenekleri eşit şekilde sunulur; onay vermediğiniz sürece analiz ve canlı destek çerezleri kullanılmaz.</p>
        <Table
          caption="www.elchi.io üzerinde kullanılan çerezler ve tarayıcı depolama alanları"
          head={['Ad', 'Sağlayıcı', 'Amaç', 'Süre', 'Ne zaman']}
          rows={[
            [<code>elchi-consent</code>, 'elchi.io (tarayıcı localStorage, çerez değil)', 'Çerezleri kabul edip etmediğinizi hatırlar', 'Tarayıcınızdaki site verilerini silene kadar', 'Her zaman (zorunlu)'],
            [<code>crisp-client/*</code>, 'Crisp', 'Canlı destek oturumunuzu ve yazışmanızı sürdürür', 'Crisp tarafından belirlenir; oturum çerezi 6 aya kadar', 'Yalnızca onay verirseniz'],
            ['Google Tag Manager’daki etiketlerin çerezleri', 'Google', 'Analiz', 'Etikete göre değişir; çerez kullanan bir etiket eklenmeden önce burada listelenir', 'Yalnızca onay verirseniz (13 Kasım 2026 itibarıyla yok)'],
            ['YouTube oynatıcı depolaması', 'Google (youtube-nocookie.com)', 'Başlattığınız videoyu oynatır', 'Google tarafından belirlenir', 'Yalnızca oynat düğmesine bastığınızda'],
          ]}
        />
        <p style={{ marginTop: 16 }}>Tercihinizi istediğiniz zaman sayfa altındaki “Çerez tercihleri” bağlantısından veya aşağıdaki düğmeden değiştirebilirsiniz. Ayrıca tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz.</p>
        <Prefs>Çerez tercihlerini değiştir</Prefs>
      </>,
    },
    {
      id: 'degisiklikler',
      title: 'Değişiklikler',
      body: <p>Sitenin topladığı veriler değiştiğinde bu sayfayı ve en üstteki tarihi güncelleriz.</p>,
    },
  ];
}

const STR = {
  en: {
    title: 'Privacy notice.',
    lede: 'What www.elchi.io collects about you, why, and who handles it.',
    updated: `Last updated: ${LAST_UPDATED.en}`,
    alt: <>Türkçe: <a href="/tr/privacy.html" hrefLang="tr" lang="tr">KVKK Aydınlatma Metni ve Çerez Politikası</a></>,
    toc: 'On this page',
    sections: sectionsEn,
  },
  tr: {
    title: 'Kişisel Verilerin Korunması ve Gizlilik.',
    lede: 'KVKK Aydınlatma Metni ve Çerez Politikası: www.elchi.io hangi verileri, neden ve kimlerle işler.',
    updated: `Son güncelleme: ${LAST_UPDATED.tr}`,
    alt: <>English: <a href="/privacy.html" hrefLang="en" lang="en">Privacy notice</a></>,
    toc: 'Bu sayfada',
    sections: sectionsTr,
  },
};

function PrivacyApp() {
  const locale = getLocale();
  const t = STR[locale];
  return (
    <>
      <Nav active="privacy" />
      <main className="rl">
        <PageHero
          title={t.title}
          lede={t.lede}
          actions={<div>
            <p className="legal-updated">{t.updated}</p>
            <p className="legal-alt">{t.alt}</p>
          </div>}
        />
        <Band tone="mist2">
          <LegalDoc tocLabel={t.toc} sections={t.sections()} />
        </Band>
      </main>
      <Footer />
    </>
  );
}

export const Page = PrivacyApp;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<PrivacyApp/>);
