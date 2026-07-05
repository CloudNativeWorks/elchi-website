import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';

// All user-visible copy for the features page. Technical terms (Envoy, xDS, WAF,
// DLP, JWT, mTLS, Kubernetes, Grafana, OpenAPI, GSLB, ACME, …) are intentionally
// kept in English inside the Turkish prose. STR.en is the current English verbatim.
const STR = {
  en: {
    hero: {
      eyebrow: 'FEATURES',
      title1: 'A complete proxy ',
      title2: 'management toolkit.',
      subtitle: 'Comprehensive platform for enterprise proxy management with modern UI, intelligent automation, and powerful enterprise capabilities.',
      btnDemo: 'Try Demo →',
      btnArch: 'See architecture',
    },
    core: {
      eyebrow: 'CORE FEATURES',
      title1: 'The fundamentals,',
      title2: 'automated end-to-end.',
      subtitle: 'Comprehensive platform for enterprise proxy management with modern UI and powerful automation.',
      items: [
        { t: 'Proto to UI Auto-Generation', d: 'Automatically generates UI configuration components from Envoy protobuf definitions. Create Listeners, Clusters, Endpoints, and Routes with full TypeScript type safety and validation.' },
        { t: 'Interactive Dependency Graphs', d: 'React Flow visual diagrams display relationships between Envoy components. Understand resource dependencies, data flow, and troubleshoot configurations.' },
        { t: 'Quick Start Scenarios', d: 'Pre-built templates for common Envoy configurations. Generate complete setups for API gateways, load balancers, and service mesh deployments with just a few clicks.' },
        { t: 'Go-Based Agent', d: 'Lightweight Go agent for client-side Envoy management. Automatic registration, health monitoring, log export to Syslog/ELK, and seamless integration with the control plane.' },
        { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS) using go-control-plane. Delta xDS support for efficient incremental configuration updates.' },
        { t: 'Two-Step Validation', d: 'Frontend TypeScript validation and backend protoc-gen-validate ensures configurations are correct before deployment. Catch errors early and prevent misconfigurations.' },
        { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically when ready. Rollback support for quick recovery from issues.' },
        { t: 'Multi-Version Envoy Support', d: 'Manage Envoy versions 1.27 through 1.38+ from a single interface. Intelligent version-based routing with seamless version upgrade capability.' },
        { t: 'Project-Based Multi-Tenancy', d: 'Organize configurations by teams, environments, or customers. Complete resource isolation with 4-tier RBAC (Owner, Admin, Editor, Viewer).' },
      ],
    },
    advanced: {
      eyebrow: 'ADVANCED FEATURES',
      title1: 'Enterprise-grade capabilities.',
      title2: 'Modern cloud-native architecture.',
      subtitle: 'Intelligent automation meets cloud-native architecture.',
      items: [
        {
          tag: 'API Security Inventory',
          t: 'API Discovery',
          d: 'Turn live proxy traffic into a continuously-scored inventory of every API you expose. Find shadow endpoints, missing auth, and PII leaks — and export the whole surface as OpenAPI.',
          bullets: ['Two-axis threat & exposure scoring', 'Drift detection vs. baselines', 'Consumer & PII analytics', 'OpenAPI 3.0.3 export'],
        },
        {
          tag: 'Edge API Security',
          t: 'Shield',
          d: 'A per-edge ext_proc sidecar that enforces API security right in the request path: WAF, authentication, rate limiting, bot defense, and data-loss prevention — twelve engines you compose per route and roll out safely from detect to block.',
          bullets: ['12 engines: JWT, mTLS, WAF, DLP, bot & more', 'OWASP CRS + positive-security OpenAPI', 'Detect → shadow → block rollout', 'Live metrics & forensic event feed'],
        },
        {
          tag: 'OpenRouter AI Integration',
          t: 'AI-Powered Analysis',
          d: 'Bring your own OpenRouter API key and choose any AI model for configuration analysis, log debugging, pattern recognition, and intelligent troubleshooting recommendations.',
          bullets: ['Configuration analysis', 'Log pattern recognition', 'Anomaly detection', 'Root cause analysis'],
        },
        {
          tag: 'Auto Endpoint Management',
          t: 'Kubernetes Discovery',
          d: 'Automatic discovery and synchronization of Kubernetes endpoints with real-time updates as your services scale.',
          bullets: ['Auto-discover K8s services', 'Real-time endpoint updates', 'Multi-cluster support', 'Service mesh integration'],
        },
        {
          tag: 'Automated SSL/TLS',
          t: 'ACME Certificate Management',
          d: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services. DNS-01 challenge verification with auto-renewal.',
          bullets: ['Let\'s Encrypt integration', 'Google Trust Services', 'DNS provider management', 'Automatic renewal'],
        },
        {
          tag: 'DNS-Based Traffic Management',
          t: 'Global Server Load Balancing',
          d: 'Enterprise GSLB with intelligent health probing, automatic failover, and geo-based traffic routing. Integrate with CoreDNS for dynamic DNS responses based on endpoint health.',
          bullets: ['HTTP/HTTPS/TCP health probes', 'Anti-flapping protection', 'Per-record failover zones', 'Circuit breaker with backoff'],
        },
      ],
    },
    comprehensive: {
      eyebrow: 'COMPREHENSIVE FEATURES',
      title1: 'Security, monitoring,',
      title2: 'operational excellence.',
      subtitle: 'Advanced capabilities for security, monitoring, and operational excellence — all integrated into a unified platform.',
      items: [
        { t: 'Web Application Firewall (WAF)', d: 'Integrated OWASP Core Rule Set (CRS) with customizable directive sets, per-authority rules, and comprehensive filtering by severity, phase, and paranoia level.', list: ['OWASP CRS integration','Custom directive management','Domain-specific rules','Rule browser & import'] },
        { t: 'Scenario Workflows', d: 'Pre-built scenario workflows with step-by-step wizards for common Envoy configurations. Execute, test, and deploy configurations efficiently.', list: ['Scenario wizard','Dynamic forms','Configuration review','Quick deployment'] },
        { t: 'Service Discovery', d: 'Discover and manage clusters automatically. Track service status, monitor cluster health, and manage registration with real-time updates.', list: ['Cluster discovery','Status monitoring','Usage statistics','Last seen tracking'] },
        { t: 'Audit Logging', d: 'Complete audit trail for all user actions, configuration changes, and system operations. Filter by date, action type, user, and resource.', list: ['Action tracking','User accountability','Resource changes','Compliance reporting'] },
        { t: 'Advanced Metrics', d: 'ECharts-powered visualization with downstream, upstream, and listener metrics. Custom time ranges, metric grouping, and auto-refresh.', list: ['Real-time charts','Custom time ranges','Metric filtering','Export capabilities'] },
        { t: 'Log Management', d: 'Real-time service logs with JSON parsing, HTTP access log detection, and intelligent log analysis for pattern detection and troubleshooting.', list: ['JSON log parsing','Log level filtering','Search functionality','Pattern detection'] },
        { t: 'Registry Management', d: 'Centralized configuration registry with version tracking, resource metadata, and schema information for all Envoy configurations.', list: ['Version tracking','Resource metadata','Schema validation','Registry browser'] },
        { t: 'Version Upgrade', d: 'Effortlessly upgrade Envoy configurations from one version to another. Migrate resources from version X to version Y with automated compatibility checks.', list: ['Cross-version migration','Compatibility validation','Resource transformation','Zero-downtime upgrades'] },
        { t: 'Log Export', d: 'Export logs to external systems via Syslog and Elastic Logstash. Centralize log management and integrate with your existing observability stack.', list: ['Syslog integration','Elastic Logstash support','Centralized logging','Flexible export formats'] },
        { t: 'Metrics Visualization', d: 'View detailed metrics both on the platform and through Grafana integration. Monitor performance, traffic patterns, and system health in real-time.', list: ['Built-in dashboards','Grafana integration','Custom metrics','Real-time updates'] },
        { t: 'LDAP Authentication', d: 'Integrate with your existing LDAP/Active Directory infrastructure. Centralized user authentication and authorization for enterprise deployments.', list: ['LDAP integration','Active Directory support','Centralized auth','Enterprise SSO'] },
        { t: 'ACME Certificates', d: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services with DNS-01 challenge.', list: ['Let\'s Encrypt integration','Google Trust Services','DNS provider management','Automatic renewal'] },
        { t: 'API Discovery & Inventory', d: 'Continuously discover every API your proxies expose, score each endpoint for threat and exposure, and catch drift, missing auth, and PII leaks before they become incidents.', list: ['Two-axis risk scoring','Drift & baseline snapshots','PII & consumer analytics','OpenAPI 3.0.3 export'] },
        { t: 'Threat Intelligence & GeoIP', d: 'Enrich traffic analytics with reputation feeds and GeoIP databases. Flag malicious sources and resolve clients to country, ASN, and geography across dashboards.', list: ['Custom threat feeds','GeoIP / ASN resolution','Bot & scanner detection','Reputation-based flags'] },
        { t: 'Background Job Engine', d: 'Long-running operations run asynchronously with full visibility. Track snapshot updates, WAF propagation, ACME verification, and version upgrades with retry support.', list: ['Async job tracking','Live phase & logs','Stuck-job detection','One-click retry'] },
        { t: 'Two-Factor Authentication', d: 'TOTP-based multi-factor authentication with QR enrollment and backup codes. Admins can enforce 2FA and reset it for locked-out users.', list: ['TOTP / authenticator apps','Backup codes','Admin reset & enforcement','Per-user enrollment'] },
        { t: 'Registry HA & Topology', d: 'Run multiple controllers and control-planes with leader election and live topology visibility. Standby nodes hydrate from registry snapshots for resilient operations.', list: ['Instance monitoring','Leader election status','Multi-controller HA','Stale instance cleanup'] },
      ],
    },
    compliance: {
      eyebrow: 'COMPLIANCE & STANDARDS',
      title1: 'Built with a security-',
      title2: 'first mindset.',
      subtitle: 'Built with security-first mindset for enterprise-grade deployments.',
      items: [
        'SOC 2 Ready Architecture',
        'GDPR Compliant Data Handling',
        'Complete Audit Trail',
        'Data Encryption at Rest',
        'Role-Based Access Control',
        'Multi-Factor Authentication Ready',
      ],
    },
  },
  tr: {
    hero: {
      eyebrow: 'ÖZELLİKLER',
      title1: 'Eksiksiz bir proxy ',
      title2: 'yönetim araç seti.',
      subtitle: 'Modern arayüz, akıllı otomasyon ve güçlü kurumsal yeteneklerle donatılmış, kurumsal proxy yönetimi için kapsamlı bir platform.',
      btnDemo: 'Demoyu Dene →',
      btnArch: 'Mimariyi inceleyin',
    },
    core: {
      eyebrow: 'TEMEL ÖZELLİKLER',
      title1: 'Temel işlevler,',
      title2: 'uçtan uca otomatik.',
      subtitle: 'Modern arayüz ve güçlü otomasyonla kurumsal proxy yönetimi için kapsamlı bir platform.',
      items: [
        { t: "Proto'dan Arayüze Otomatik Üretim", d: "Envoy protobuf tanımlarından arayüz yapılandırma bileşenlerini otomatik olarak üretir. Tam TypeScript tip güvenliği ve doğrulamayla Listener, Cluster, Endpoint ve Route oluşturun." },
        { t: "Etkileşimli Bağımlılık Grafikleri", d: "React Flow görsel diyagramları Envoy bileşenleri arasındaki ilişkileri gösterir. Kaynak bağımlılıklarını ve veri akışını anlayın, yapılandırma sorunlarını giderin." },
        { t: "Hızlı Başlangıç Senaryoları", d: "Yaygın Envoy yapılandırmaları için hazır şablonlar. API gateway, load balancer ve service mesh dağıtımları için eksiksiz kurulumları yalnızca birkaç tıklamayla oluşturun." },
        { t: "Go Tabanlı Agent", d: "İstemci tarafı Envoy yönetimi için hafif bir Go agent. Otomatik kayıt, sağlık izleme, Syslog/ELK'ye log aktarımı ve control plane ile kusursuz entegrasyon." },
        { t: "Tam xDS Protokol Desteği", d: "go-control-plane kullanan eksiksiz xDS (ADS, CDS, EDS, LDS, RDS, VHDS) implementasyonu. Verimli artımlı yapılandırma güncellemeleri için Delta xDS desteği." },
        { t: "İki Aşamalı Doğrulama", d: "Frontend TypeScript doğrulaması ve backend protoc-gen-validate, yapılandırmaların dağıtımdan önce doğru olmasını sağlar. Hataları erken yakalayın ve hatalı yapılandırmaları önleyin." },
        { t: "Kaydet & Yayınla İş Akışı", d: "Güvenli yapılandırma değişiklikleri için taslak modu. Değişiklikleri kademeli kaydedin, hazır olduğunuzda toplu güncellemeleri atomik biçimde yayınlayın. Sorunlardan hızlı kurtulmak için geri alma desteği." },
        { t: "Çok Sürümlü Envoy Desteği", d: "Envoy 1.27'den 1.38+'a kadar sürümleri tek bir arayüzden yönetin. Kusursuz sürüm yükseltme yeteneğiyle akıllı, sürüm tabanlı yönlendirme." },
        { t: "Proje Bazlı Çok Kiracılı Yapı", d: "Yapılandırmaları ekiplere, ortamlara veya müşterilere göre düzenleyin. 4 katmanlı RBAC (Owner, Admin, Editor, Viewer) ile tam kaynak izolasyonu." },
      ],
    },
    advanced: {
      eyebrow: 'GELİŞMİŞ ÖZELLİKLER',
      title1: 'Kurumsal düzeyde yetenekler.',
      title2: 'Modern cloud-native mimari.',
      subtitle: 'Akıllı otomasyon, cloud-native mimariyle buluşuyor.',
      items: [
        {
          tag: 'API Güvenlik Envanteri',
          t: 'API Discovery',
          d: "Canlı proxy trafiğini, sunduğunuz her API'nin sürekli puanlanan bir envanterine dönüştürün. Shadow endpoint'leri, eksik kimlik doğrulamayı ve PII sızıntılarını bulun — ve tüm yüzeyi OpenAPI olarak dışa aktarın.",
          bullets: ['İki eksenli tehdit & maruziyet puanlaması', 'Temel çizgilere karşı sapma tespiti', 'Tüketici & PII analitiği', 'OpenAPI 3.0.3 dışa aktarımı'],
        },
        {
          tag: 'Edge API Güvenliği',
          t: 'Shield',
          d: "API güvenliğini doğrudan istek yolunda uygulayan, her edge'de çalışan bir ext_proc sidecar: WAF, kimlik doğrulama, rate limiting, bot savunması ve veri sızıntısı önleme — her route için birleştirdiğiniz ve detect'ten block'a güvenle yaydığınız on iki engine.",
          bullets: ['12 engine: JWT, mTLS, WAF, DLP, bot ve daha fazlası', 'OWASP CRS + pozitif güvenlik OpenAPI', 'Detect → shadow → block dağıtımı', 'Canlı metrikler & adli olay akışı'],
        },
        {
          tag: 'OpenRouter AI Entegrasyonu',
          t: 'AI Destekli Analiz',
          d: 'Kendi OpenRouter API anahtarınızı getirin ve yapılandırma analizi, log hata ayıklama, örüntü tanıma ve akıllı sorun giderme önerileri için dilediğiniz AI modelini seçin.',
          bullets: ['Yapılandırma analizi', 'Log örüntü tanıma', 'Anomali tespiti', 'Kök neden analizi'],
        },
        {
          tag: 'Otomatik Endpoint Yönetimi',
          t: 'Kubernetes Keşfi',
          d: "Servisleriniz ölçeklenirken gerçek zamanlı güncellemelerle Kubernetes endpoint'lerinin otomatik keşfi ve senkronizasyonu.",
          bullets: ['K8s servislerini otomatik keşfet', 'Gerçek zamanlı endpoint güncellemeleri', 'Çoklu cluster desteği', 'Service mesh entegrasyonu'],
        },
        {
          tag: 'Otomatik SSL/TLS',
          t: 'ACME Sertifika Yönetimi',
          d: "Let's Encrypt ve Google Trust Services için ACME protokol desteğiyle otomatik sertifika yaşam döngüsü yönetimi. Otomatik yenilemeyle DNS-01 challenge doğrulaması.",
          bullets: ["Let's Encrypt entegrasyonu", 'Google Trust Services', 'DNS sağlayıcı yönetimi', 'Otomatik yenileme'],
        },
        {
          tag: 'DNS Tabanlı Trafik Yönetimi',
          t: 'Global Server Load Balancing',
          d: 'Akıllı sağlık kontrolü, otomatik yük devretme ve coğrafi trafik yönlendirmesi sunan kurumsal GSLB. Endpoint sağlığına göre dinamik DNS yanıtları için CoreDNS ile entegre olun.',
          bullets: ['HTTP/HTTPS/TCP sağlık kontrolleri', 'Anti-flapping koruması', 'Kayıt başına failover bölgeleri', "Backoff'lu circuit breaker"],
        },
      ],
    },
    comprehensive: {
      eyebrow: 'KAPSAMLI ÖZELLİKLER',
      title1: 'Güvenlik, izleme,',
      title2: 'operasyonel mükemmellik.',
      subtitle: 'Güvenlik, izleme ve operasyonel mükemmellik için gelişmiş yetenekler — hepsi tek bir birleşik platformda entegre.',
      items: [
        { t: 'Web Application Firewall (WAF)', d: 'Özelleştirilebilir direktif setleri, yetki bazlı kurallar ve önem derecesi, faz ve paranoya seviyesine göre kapsamlı filtreleme sunan entegre OWASP Core Rule Set (CRS).', list: ['OWASP CRS entegrasyonu','Özel direktif yönetimi',"Domain'e özel kurallar",'Kural tarayıcı & içe aktarma'] },
        { t: 'Senaryo İş Akışları', d: 'Yaygın Envoy yapılandırmaları için adım adım sihirbazlar içeren hazır senaryo iş akışları. Yapılandırmaları verimli biçimde çalıştırın, test edin ve dağıtın.', list: ['Senaryo sihirbazı','Dinamik formlar','Yapılandırma incelemesi','Hızlı dağıtım'] },
        { t: 'Servis Keşfi', d: "Cluster'ları otomatik olarak keşfedin ve yönetin. Servis durumunu takip edin, cluster sağlığını izleyin ve kaydı gerçek zamanlı güncellemelerle yönetin.", list: ['Cluster keşfi','Durum izleme','Kullanım istatistikleri','Son görülme takibi'] },
        { t: 'Denetim Kaydı', d: 'Tüm kullanıcı eylemleri, yapılandırma değişiklikleri ve sistem operasyonları için eksiksiz denetim izi. Tarihe, eylem türüne, kullanıcıya ve kaynağa göre filtreleyin.', list: ['Eylem takibi','Kullanıcı hesap verebilirliği','Kaynak değişiklikleri','Uyumluluk raporlaması'] },
        { t: 'Gelişmiş Metrikler', d: 'Downstream, upstream ve listener metrikleriyle ECharts destekli görselleştirme. Özel zaman aralıkları, metrik gruplama ve otomatik yenileme.', list: ['Gerçek zamanlı grafikler','Özel zaman aralıkları','Metrik filtreleme','Dışa aktarma yetenekleri'] },
        { t: 'Log Yönetimi', d: 'JSON ayrıştırma, HTTP erişim logu tespiti ve örüntü tespiti ile sorun giderme için akıllı log analizi içeren gerçek zamanlı servis logları.', list: ['JSON log ayrıştırma','Log seviyesi filtreleme','Arama işlevi','Örüntü tespiti'] },
        { t: 'Registry Yönetimi', d: "Tüm Envoy yapılandırmaları için sürüm takibi, kaynak meta verisi ve şema bilgisi içeren merkezi yapılandırma registry'si.", list: ['Sürüm takibi','Kaynak meta verisi','Şema doğrulama','Registry tarayıcı'] },
        { t: 'Sürüm Yükseltme', d: 'Envoy yapılandırmalarını bir sürümden diğerine zahmetsizce yükseltin. Kaynakları otomatik uyumluluk kontrolleriyle X sürümünden Y sürümüne taşıyın.', list: ['Sürümler arası geçiş','Uyumluluk doğrulama','Kaynak dönüşümü','Kesintisiz yükseltmeler'] },
        { t: 'Log Aktarımı', d: 'Logları Syslog ve Elastic Logstash aracılığıyla harici sistemlere aktarın. Log yönetimini merkezileştirin ve mevcut gözlemlenebilirlik yığınınızla entegre edin.', list: ['Syslog entegrasyonu','Elastic Logstash desteği','Merkezi loglama','Esnek aktarım formatları'] },
        { t: 'Metrik Görselleştirme', d: 'Ayrıntılı metrikleri hem platform üzerinde hem de Grafana entegrasyonuyla görüntüleyin. Performansı, trafik örüntülerini ve sistem sağlığını gerçek zamanlı izleyin.', list: ['Yerleşik gösterge panoları','Grafana entegrasyonu','Özel metrikler','Gerçek zamanlı güncellemeler'] },
        { t: 'LDAP Kimlik Doğrulama', d: 'Mevcut LDAP/Active Directory altyapınızla entegre olun. Kurumsal dağıtımlar için merkezi kullanıcı kimlik doğrulama ve yetkilendirme.', list: ['LDAP entegrasyonu','Active Directory desteği','Merkezi kimlik doğrulama','Kurumsal SSO'] },
        { t: 'ACME Sertifikaları', d: "DNS-01 challenge ile Let's Encrypt ve Google Trust Services için ACME protokol desteğiyle otomatik sertifika yaşam döngüsü yönetimi.", list: ["Let's Encrypt entegrasyonu",'Google Trust Services','DNS sağlayıcı yönetimi','Otomatik yenileme'] },
        { t: 'API Discovery & Envanter', d: "Proxy'lerinizin sunduğu her API'yi sürekli keşfedin, her endpoint'i tehdit ve maruziyet açısından puanlayın; sapmaları, eksik kimlik doğrulamayı ve PII sızıntılarını olaya dönüşmeden yakalayın.", list: ['İki eksenli risk puanlaması',"Sapma & temel snapshot'leri",'PII & tüketici analitiği','OpenAPI 3.0.3 dışa aktarımı'] },
        { t: 'Tehdit İstihbaratı & GeoIP', d: 'Trafik analitiğini itibar beslemeleri ve GeoIP veritabanlarıyla zenginleştirin. Kötü amaçlı kaynakları işaretleyin ve istemcileri gösterge panolarında ülke, ASN ve coğrafyaya çözümleyin.', list: ['Özel tehdit beslemeleri','GeoIP / ASN çözümleme','Bot & tarayıcı tespiti','İtibar tabanlı işaretler'] },
        { t: 'Arka Plan İş Motoru', d: 'Uzun süren operasyonlar tam görünürlükle asenkron çalışır. Snapshot güncellemelerini, WAF yayılımını, ACME doğrulamasını ve sürüm yükseltmelerini yeniden deneme desteğiyle takip edin.', list: ['Asenkron iş takibi','Canlı faz & loglar','Takılan iş tespiti','Tek tıkla yeniden deneme'] },
        { t: 'İki Faktörlü Kimlik Doğrulama', d: "QR kaydı ve yedek kodlarla TOTP tabanlı çok faktörlü kimlik doğrulama. Yöneticiler 2FA'yı zorunlu kılabilir ve kilitlenen kullanıcılar için sıfırlayabilir.", list: ['TOTP / authenticator uygulamaları','Yedek kodlar','Yönetici sıfırlama & zorunlu kılma','Kullanıcı bazlı kayıt'] },
        { t: 'Registry HA & Topoloji', d: "Birden fazla Controller ve Control-Plane'i leader election ve canlı topoloji görünürlüğüyle çalıştırın. Standby node'lar dayanıklı operasyonlar için registry snapshot'larından beslenir.", list: ['Instance izleme','Leader election durumu',"Çok Controller'lı HA",'Eski instance temizliği'] },
      ],
    },
    compliance: {
      eyebrow: 'UYUMLULUK & STANDARTLAR',
      title1: 'Güvenlik öncelikli',
      title2: 'bir yaklaşımla inşa edildi.',
      subtitle: 'Kurumsal düzeyde dağıtımlar için güvenlik öncelikli bir yaklaşımla inşa edildi.',
      items: [
        'SOC 2 Hazır Mimari',
        'GDPR Uyumlu Veri İşleme',
        'Eksiksiz Denetim İzi',
        'Beklemede Veri Şifreleme',
        'Rol Tabanlı Erişim Kontrolü',
        'Çok Faktörlü Kimlik Doğrulamaya Hazır',
      ],
    },
  },
};

function FeaturesApp() {
  return (
    <>
      <Nav active="features"/>
      <FeaturesHero/>
      <CoreFeatures/>
      <AdvancedFeatures/>
      <ComprehensiveFeatures/>
      <Compliance/>
      <Footer/>
    </>
  );
}

function FeaturesHero() {
  const t = STR[getLocale()];
  return (
    <section className="section" style={{ paddingTop: 80, paddingBottom: 60, position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 800, height: 500, top: -100, left: '20%', background: 'radial-gradient(closest-side, #c7d2fe, transparent)', opacity: .5 }}></div>
      <div className="grid-bg"></div>
      <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
        <span className="eyebrow"><span className="dot"></span>{t.hero.eyebrow}</span>
        <h1 style={{ marginTop: 24, marginBottom: 24 }}>
          {t.hero.title1}<br/>
          <span className="grad-text">{t.hero.title2}</span>
        </h1>
        <p style={{ fontSize: 19, color: 'var(--slate-600)', maxWidth: 640, margin: '0 auto' }}>
          {t.hero.subtitle}
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop: 32 }}>
          <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">{t.hero.btnDemo}</a>
          <a href={locHref('architecture')} className="btn btn-ghost">{t.hero.btnArch}</a>
        </div>
      </div>
    </section>
  );
}

function CoreFeatures() {
  const t = STR[getLocale()];
  const items = t.core.items;
  const ICONS = ['proto', 'graph', 'spark', 'agent', 'xds', 'check', 'flow', 'version', 'lock'];

  const ICON = {
    proto:   <path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
    graph:   <g stroke="currentColor" strokeWidth="2" fill="none"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v6M18 8v6M8 6h8M8 18h8" strokeLinecap="round"/></g>,
    spark:   <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>,
    agent:   <g stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 12h8M8 9h4M8 15h6" strokeLinecap="round"/></g>,
    xds:     <g stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 8l4 4-4 4M20 8l-4 4 4 4M14 4l-4 16" strokeLinecap="round"/></g>,
    check:   <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    flow:    <g stroke="currentColor" strokeWidth="2" fill="none"><path d="M3 12c4-4 8 4 12 0s4-4 6 0" strokeLinecap="round"/><circle cx="3" cy="12" r="2"/><circle cx="21" cy="12" r="2"/></g>,
    version: <g stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 7l4-4 4 4M8 3v18M12 17l4 4 4-4M16 21V3" strokeLinecap="round" strokeLinejoin="round"/></g>,
    lock:    <g stroke="currentColor" strokeWidth="2" fill="none"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round"/></g>,
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.core.eyebrow}</span>
          <h2>{t.core.title1}<br/>{t.core.title2}</h2>
          <p>{t.core.subtitle}</p>
        </div>
        <div className="features-grid">
          {items.map((it, i) => (
            <div key={i} className="card feat-card">
              <div className="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none">{ICON[ICONS[i]]}</svg></div>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvancedFeatures() {
  const t = STR[getLocale()];
  const items = t.advanced.items;
  const META = [
    { accent: '#6366f1', visual: 'inventory' },
    { accent: '#f43f5e', visual: 'shield' },
    { accent: '#8b5cf6', visual: 'ai' },
    { accent: '#06b6d4', visual: 'k8s' },
    { accent: '#10b981', visual: 'cert' },
    { accent: '#f59e0b', visual: 'gslb' },
  ];

  return (
    <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.advanced.eyebrow}</span>
          <h2>{t.advanced.title1}<br/>{t.advanced.title2}</h2>
          <p>{t.advanced.subtitle}</p>
        </div>

        <div className="adv-grid">
          {items.map((it, i) => {
            const m = META[i];
            return (
              <div key={i} className="adv-card">
                <div className="adv-content">
                  <span className="adv-tag mono" style={{ color: m.accent, background: `${m.accent}1a`, borderColor: `${m.accent}33` }}>{it.tag}</span>
                  <h3 style={{ marginTop: 14, marginBottom: 12, fontSize: 24 }}>{it.t}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--slate-600)', marginBottom: 20 }}>{it.d}</p>
                  <ul className="adv-bullets">
                    {it.bullets.map((b, j) => (
                      <li key={j}>
                        <span className="adv-dot" style={{ background: m.accent }}></span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="adv-visual" style={{ background: `linear-gradient(135deg, ${m.accent}10, ${m.accent}03)` }}>
                  <AdvVisual kind={m.visual} accent={m.accent}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AdvVisual({ kind, accent }) {
  if (kind === 'ai') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        <defs>
          <linearGradient id="ai-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent}/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
        </defs>
        {/* neural network */}
        {[60, 110, 160].map((y, i) => (
          <circle key={`l1-${i}`} cx="60" cy={y} r="8" fill="url(#ai-g)" opacity="0.8">
            <animate attributeName="r" values="6;9;6" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {[40, 80, 130, 170].map((y, i) => (
          <circle key={`l2-${i}`} cx="150" cy={y} r="8" fill="url(#ai-g)" opacity="0.6">
            <animate attributeName="r" values="6;10;6" dur={`${2.5+i*0.2}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {[80, 130].map((y, i) => (
          <circle key={`l3-${i}`} cx="240" cy={y} r="10" fill="url(#ai-g)">
            <animate attributeName="r" values="8;12;8" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {[60,110,160].flatMap(y1 => [40,80,130,170].map(y2 => (
          <line key={`${y1}-${y2}`} x1="60" y1={y1} x2="150" y2={y2} stroke={accent} strokeOpacity="0.18" strokeWidth="1"/>
        )))}
        {[40,80,130,170].flatMap(y1 => [80,130].map(y2 => (
          <line key={`b-${y1}-${y2}`} x1="150" y1={y1} x2="240" y2={y2} stroke={accent} strokeOpacity="0.18" strokeWidth="1"/>
        )))}
      </svg>
    );
  }
  if (kind === 'k8s') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        {/* k8s cluster grid */}
        {Array.from({length: 4}).map((_, row) =>
          Array.from({length: 6}).map((_, col) => {
            const x = 30 + col*42;
            const y = 30 + row*42;
            const delay = (row*6 + col)*0.1;
            return (
              <g key={`${row}-${col}`}>
                <rect x={x} y={y} width="32" height="32" rx="6" fill="white" stroke={accent} strokeWidth="1.5" strokeOpacity="0.5">
                  <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" begin={`${delay}s`}/>
                </rect>
                <circle cx={x+16} cy={y+16} r="4" fill={accent}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" begin={`${delay}s`}/>
                </circle>
              </g>
            );
          })
        )}
      </svg>
    );
  }
  if (kind === 'cert') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        <g transform="translate(150, 100)">
          <circle r="70" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4 6" opacity="0.4">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
          </circle>
          <circle r="55" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="2 4" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="16s" repeatCount="indefinite"/>
          </circle>
          <rect x="-30" y="-36" width="60" height="72" rx="6" fill="white" stroke={accent} strokeWidth="2"/>
          <path d="M -10 -10 l 8 8 l 16 -16" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="-22" y="14" width="44" height="2" fill={accent} opacity="0.4"/>
          <rect x="-22" y="20" width="30" height="2" fill={accent} opacity="0.4"/>
        </g>
      </svg>
    );
  }
  if (kind === 'gslb') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        <defs>
          <radialGradient id="globe-g">
            <stop offset="0%" stopColor={accent} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <g transform="translate(150, 100)">
          <circle r="70" fill="url(#globe-g)"/>
          <circle r="60" fill="none" stroke={accent} strokeWidth="1.5"/>
          <ellipse rx="60" ry="22" fill="none" stroke={accent} strokeWidth="1" opacity="0.6"/>
          <ellipse rx="60" ry="44" fill="none" stroke={accent} strokeWidth="1" opacity="0.4"/>
          <line x1="-60" y1="0" x2="60" y2="0" stroke={accent} strokeWidth="1" opacity="0.6"/>
          <line x1="0" y1="-60" x2="0" y2="60" stroke={accent} strokeWidth="1" opacity="0.4"/>
          {[
            [-32, -16], [22, -28], [40, 14], [-20, 30], [10, 38]
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={accent}>
                <animate attributeName="r" values="3;6;3" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
              </circle>
              <circle cx={x} cy={y} r="8" fill="none" stroke={accent} strokeWidth="1" opacity="0.4">
                <animate attributeName="r" values="4;14;4" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
              </circle>
            </g>
          ))}
        </g>
      </svg>
    );
  }
  if (kind === 'shield') {
    const shieldPath = "M0,-62 L54,-42 L54,8 C54,44 30,64 0,74 C-30,64 -54,44 -54,8 L-54,-42 Z";
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        <g transform="translate(150, 100)">
          <path d={shieldPath} fill="white" stroke={accent} strokeWidth="2"/>
          {/* scan lines sweeping the shield */}
          {[-34, -18, -2, 14].map((y, i) => (
            <line key={i} x1="-40" y1={y} x2="40" y2={y} stroke={accent} strokeWidth="1.5" opacity="0.35">
              <animate attributeName="opacity" values="0.12;0.6;0.12" dur={`${2 + i * 0.3}s`} repeatCount="indefinite"/>
            </line>
          ))}
          {/* verified check */}
          <path d="M-20,6 l13,13 l26,-30" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          {/* pulse outline */}
          <path d={shieldPath} fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4">
            <animateTransform attributeName="transform" type="scale" values="1;1.06;1" dur="3s" repeatCount="indefinite"/>
          </path>
        </g>
      </svg>
    );
  }
  if (kind === 'inventory') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        {/* axes: exposure (x) vs threat (y) */}
        <line x1="40" y1="170" x2="270" y2="170" stroke={accent} strokeWidth="1.5" opacity="0.5"/>
        <line x1="40" y1="170" x2="40" y2="20" stroke={accent} strokeWidth="1.5" opacity="0.5"/>
        {[60, 100, 140].map((y, i) => (
          <line key={`g-${i}`} x1="40" y1={y} x2="270" y2={y} stroke={accent} strokeWidth="0.5" strokeDasharray="3 5" opacity="0.2"/>
        ))}
        {/* endpoint dots — bigger/redder = higher risk */}
        {[
          [80, 140, 4, 0.4], [120, 120, 5, 0.5], [150, 95, 6, 0.6],
          [185, 70, 8, 0.85], [215, 50, 10, 1], [100, 150, 3, 0.35],
          [170, 110, 5, 0.55], [235, 80, 7, 0.7], [60, 155, 3, 0.3],
        ].map(([x, y, r, op], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={accent} opacity={op}>
              <animate attributeName="r" values={`${r-1};${r+2};${r-1}`} dur={`${2.4+i*0.25}s`} repeatCount="indefinite"/>
            </circle>
            <circle cx={x} cy={y} r={r+4} fill="none" stroke={accent} strokeWidth="1" opacity={op*0.4}>
              <animate attributeName="r" values={`${r};${r+10};${r}`} dur={`${2.4+i*0.25}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values={`${op*0.5};0;${op*0.5}`} dur={`${2.4+i*0.25}s`} repeatCount="indefinite"/>
            </circle>
          </g>
        ))}
      </svg>
    );
  }
  return null;
}

function ComprehensiveFeatures() {
  const t = STR[getLocale()];
  const items = t.comprehensive.items;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.comprehensive.eyebrow}</span>
          <h2>{t.comprehensive.title1}<br/>{t.comprehensive.title2}</h2>
          <p>{t.comprehensive.subtitle}</p>
        </div>

        <div className="comp-grid">
          {items.map((it, i) => (
            <div key={i} className="comp-card card">
              <div className="comp-num mono">{String(i+1).padStart(2,'0')}</div>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
              <ul>
                {it.list.map((l, j) => (
                  <li key={j}><span>•</span> {l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Compliance() {
  const t = STR[getLocale()];
  const items = t.compliance.items;
  return (
    <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div className="dot-bg" style={{ opacity: 0.15 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="section-head">
          <span className="eyebrow" style={{ background: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.3)', color: '#93c5fd' }}>
            <span className="dot"></span>{t.compliance.eyebrow}
          </span>
          <h2 style={{ color: 'white' }}>{t.compliance.title1}<br/>{t.compliance.title2}</h2>
          <p style={{ color: '#94a3b8' }}>{t.compliance.subtitle}</p>
        </div>

        <div className="comply-grid">
          {items.map((it, i) => (
            <div key={i} className="comply-cell">
              <span className="comply-tick">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>{it}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<FeaturesApp/>);
