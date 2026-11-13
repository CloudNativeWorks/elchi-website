import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { getLocale, locHref } from './i18n.js';
import { Band, BandHead, PageHero, Tick, Arrow } from './relief.jsx';

// All user-visible copy for the features page. Technical terms (Envoy, xDS, WAF,
// DLP, JWT, mTLS, Kubernetes, Grafana, OpenAPI, GSLB, ACME, …) are intentionally
// kept in English inside the Turkish prose. STR.en is the current English verbatim.
const STR = {
  en: {
    hero: {
      eyebrow: 'FEATURES',
      title1: 'Elchi features,',
      title2: 'from xDS to WAF.',
      subtitle: 'What Elchi Core and its add-ons do, grouped by area: configuring Envoy, securing and observing the traffic, and operating the fleet. Each entry links the documentation page that describes it.',
      btnDemo: 'Get Started →',
      btnArch: 'See architecture',
    },
    core: {
      eyebrow: 'CORE FEATURES',
      title1: 'How does Elchi Core',
      title2: 'configure Envoy?',
      subtitle: 'Typed editors for every Envoy resource, validation before anything is stored, a draft/save/publish workflow, and the agent that runs Envoy on your hosts.',
      items: [
        { t: 'Proto-Driven Configuration', d: 'Typed models and field metadata are generated from each Envoy version\'s protobuf definitions. Create Listeners, Clusters, Endpoints, and Routes with typed fields and validation.' },
        { t: 'Interactive Dependency Graphs', d: 'Interactive visual diagrams display relationships between Envoy components. Understand resource dependencies, data flow, and troubleshoot configurations.' },
        { t: 'Quick Start Scenarios', d: 'Guided wizards that build a complete set of resources for common Envoy setups, such as an HTTP proxy with or without EDS and a TCP proxy. Create and manage your own scenarios too.' },
        { t: 'Lightweight Edge Agent', d: 'A lightweight agent that manages Envoy on every edge host. Automatic registration, health monitoring, log export to Syslog/ELK, and the deploy, upgrade and restart commands the controller sends over gRPC.' },
        { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS). Delta xDS support for efficient incremental configuration updates.' },
        { t: 'Two-Step Validation', d: 'Each change is checked in the editor against types generated from the Envoy API, and again on the server against the Envoy API\'s validation rules before it is stored.' },
        { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically when ready. Every change is recorded in the audit log.' },
        { t: 'Multi-Version Envoy Support', d: 'Run several Envoy versions side by side: the registry sends each proxy to the control plane built for its version. Move a listener to a newer version and cut over with a hot restart (0 dropped requests in Elchi\'s end-to-end test at a steady 20 requests per second).' },
        { t: 'Project-Based Multi-Tenancy', d: 'Organize configurations by teams, environments, or customers. Resources are isolated per project, with 4-tier RBAC (Owner, Admin, Editor, Viewer).' },
      ],
    },
    advanced: {
      eyebrow: 'ADVANCED FEATURES',
      title1: 'Which add-ons and integrations',
      title2: 'extend it?',
      subtitle: 'API security and API inventory in or beside the request path, AI-assisted review, Kubernetes endpoint sync, ACME certificates and DNS-based GSLB.',
      items: [
        {
          tag: 'API Security Inventory',
          t: 'API Discovery',
          d: 'Turn live proxy traffic into a continuously-scored inventory of every API you expose. Find shadow endpoints, missing auth, and PII leaks — and export the whole surface as OpenAPI.',
          bullets: ['Two-axis threat & exposure scoring', 'OpenAPI spec import, coverage & drift', 'Consumer enumeration & PII analytics (incl. TCKN)', 'Team ownership & OpenAPI 3.0.3 export'],
        },
        {
          tag: 'Edge API Security',
          t: 'Shield',
          d: 'A per-edge ext_proc sidecar that enforces API security right in the request path: WAF, authentication, rate limiting, and bot defense — twelve engines you compose per route and roll out safely from detect to block, plus built-in data-loss prevention.',
          bullets: ['12 engines: JWT, mTLS, WAF, bot & more — plus built-in DLP', 'OWASP CRS + positive-security OpenAPI', 'Detect → shadow → block rollout', 'Live metrics & forensic event feed'],
        },
        {
          tag: 'OpenRouter AI Integration',
          t: 'AI-Powered Analysis',
          d: 'Bring your own OpenRouter API key and choose any AI model. Ask for a review of a resource and its dependencies, or of selected logs, and get troubleshooting suggestions on demand.',
          bullets: ['Configuration review with dependencies', 'Log analysis', 'Troubleshooting suggestions', 'Usage & cost tracking'],
        },
        {
          tag: 'Auto Endpoint Management',
          t: 'Kubernetes Discovery',
          d: 'An in-cluster discovery agent reports your Kubernetes nodes, and Elchi keeps Endpoint resources in sync with the node IPs (NodePort-style), across several clusters.',
          bullets: ['Lightweight in-cluster agent (Helm)', 'Endpoints follow cluster node IPs', 'Multi-cluster support', 'Project discovery token & cluster status'],
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
          d: 'DNS-based GSLB for Envoy edges: the controller probes every IP over HTTP, HTTPS or TCP, and elchi-coredns answers only with healthy IPs. Each regional DNS node serves only the healthy IPs tagged for its region, and a record with no healthy IP falls back to its failover name.',
          bullets: ['HTTP/HTTPS/TCP health probes', 'Anti-flapping protection', 'Per-record failover zones', 'Circuit breaker with backoff'],
        },
      ],
    },
    comprehensive: {
      eyebrow: 'OPERATIONS FEATURES',
      title1: 'Security, observability',
      title2: 'and fleet operations.',
      subtitle: 'Access control, audit, logs and metrics, backup, version upgrades and HA, all in the same control plane.',
      items: [
        { t: 'Web Application Firewall (WAF)', d: 'The OWASP Core Rule Set runs inside Shield, next to authentication, bot defense and rate limiting: paranoia levels, anomaly thresholds and per-policy rule exclusions, rolled out from detect to block.', list: ['OWASP CRS built into Shield','Paranoia levels & anomaly scoring','Per-policy rule exclusions','Detect → shadow → block'] },
        { t: 'Scenario Workflows', d: 'Pre-built scenarios with step-by-step wizards that create every resource a common Envoy setup needs, validate them, and create them in one run, rolling back if a step fails.', list: ['Scenario wizard','Dynamic forms','Configuration review','Quick deployment'] },
        { t: 'Kubernetes Cluster Discovery', d: 'See every Kubernetes cluster that reports through the discovery agent: its status, when it was last seen, and which endpoints use it.', list: ['Cluster list','Status monitoring','Usage statistics','Last seen tracking'] },
        { t: 'Audit Logging', d: 'An audit trail of user actions, configuration changes, and system operations. Filter by date, action type, user, and resource.', list: ['Action tracking','User accountability','Resource changes','Forwarding to syslog'] },
        { t: 'Advanced Metrics', d: 'Interactive charts for downstream, upstream, and listener metrics. Custom time ranges, metric grouping, and auto-refresh.', list: ['Real-time charts','Custom time ranges','Metric filtering','Export capabilities'] },
        { t: 'Log Management', d: 'Search a listener\'s Envoy and access logs on the proxy hosts by time range, with a histogram, field filters and exact paging.', list: ['Time-range search','Histogram','Field filters','Exact paging'] },
        { t: 'Backup & Restore', d: 'Export a project\'s configuration, services and certificates to one JSON file, validate it, and import it into the same or another installation.', list: ['Project-scoped export','Validation before import','Dependency-aware restore','Version cleanup tools'] },
        { t: 'Version Upgrade', d: 'Move a listener and the resources it depends on from one Envoy version to another, then cut over with a hot restart.', list: ['Dependency-aware cloning','Target client version check','Hot-restart cut-over','Zero dropped requests'] },
        { t: 'Log Export', d: 'Ship logs to external systems with Filebeat (Elasticsearch or Logstash) or rsyslog, configured per client from the UI.', list: ['Syslog integration','Elasticsearch & Logstash output','Centralized logging','Audit log forwarding'] },
        { t: 'Metrics Visualization', d: 'View Envoy metrics on the platform and through Grafana. Charts compare against an hour, a day or a week ago, and each chart downloads as CSV or PNG.', list: ['Built-in dashboards','Grafana integration','Period comparison','CSV / PNG export'] },
        { t: 'LDAP Authentication', d: 'Sign users in against your LDAP or Active Directory, with TLS to the directory server.', list: ['LDAP integration','Active Directory support','Centralized auth','TLS-secured LDAP'] },
        { t: 'ACME Certificates', d: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services with DNS-01 challenge.', list: ['Let\'s Encrypt integration','Google Trust Services','DNS provider management','Automatic renewal'] },
        { t: 'API Discovery & Inventory', d: 'Continuously discover every API your proxies expose, score each endpoint for threat and exposure, and catch drift, missing auth, and PII leaks before they become incidents.', list: ['Two-axis risk scoring','Drift & baseline snapshots','PII & consumer analytics','OpenAPI spec coverage & export'] },
        { t: 'Threat Intelligence & GeoIP', d: 'Enrich traffic analytics with reputation feeds and GeoIP databases. Flag malicious sources and resolve clients to country, ASN, and geography across dashboards.', list: ['Custom threat feeds','GeoIP / ASN resolution','Bot & scanner detection','Reputation-based flags'] },
        { t: 'Background Job Engine', d: 'Long-running operations run asynchronously, each with its phase and logs. Track snapshot updates, Shield policy rollout, ACME verification, and version upgrades with retry support.', list: ['Async job tracking','Live phase & logs','Stuck-job detection','One-click retry'] },
        { t: 'Two-Factor Authentication', d: 'TOTP-based multi-factor authentication with QR enrollment and backup codes. Admins can enforce 2FA and reset it for locked-out users.', list: ['TOTP / authenticator apps','Backup codes','Admin reset & enforcement','Per-user enrollment'] },
        { t: 'Edge HA Pairs', d: 'Pair two Elchi OS appliances so they share VIPs active/passive. The boxes elect the active member themselves, the standby runs the same Envoys warm, and a failed active is replaced in about two seconds on plain L2 (over BGP, with BFD on the neighbours).', list: ['Active/passive VIP failover','Planned failover in ~50 ms','Maintenance mode & standby-first upgrades','Floating next-hops, BGP & BFD'] },
        { t: 'Registry HA & Topology', d: 'Run multiple controllers and control-planes that share one MongoDB, with leader election for scheduled work and a live topology view. Standby nodes hydrate from registry snapshots.', list: ['Instance monitoring','Leader election status','Multi-controller HA','Stale instance cleanup'] },
        { t: 'Live Traffic View', d: 'Watch a listener as it runs. Requests sampled from the access log flow from the clients through connection managers, domains, routes and clusters to the endpoints — each placed where Envoy ended it — with rates, p99 and 5xx origin from metrics every 5 seconds.', list: ['Sampled requests, played in order','Per-node rates & latency','Shield blocks & 5xx origin','Side panel linking to Logs'] },
        { t: 'Reports', d: 'Answers about the whole project in one place: what needs a look first, which listener serves which domain and where it goes, TLS and Shield coverage per filter chain, unused resources, the fleet and recent changes.', list: ['Problems, worst first','Traffic map & domains','Security & certificates','CSV / JSON export'] },
      ],
    },
    compliance: {
      eyebrow: 'COMPLIANCE & STANDARDS',
      title1: 'What does a security review',
      title2: 'need to know?',
      subtitle: 'The controls that come up in a security review, as the shipped product implements them.',
      items: [
        'Complete Audit Trail & Syslog Forwarding',
        'Configurable Data Retention',
        'Traffic Metadata Only, No Request Bodies',
        'Encrypted ACME & DNS-Provider Credentials',
        'Role-Based Access Control',
        'Enforceable Two-Factor Authentication',
      ],
    },
  },
  tr: {
    hero: {
      eyebrow: 'ÖZELLİKLER',
      title1: 'Elchi özellikleri,',
      title2: "xDS'ten WAF'a.",
      subtitle: 'Elchi Core ve eklentilerinin yaptıkları, alanlara göre: Envoy yapılandırması, trafiğin korunması ve gözlemlenmesi, filonun işletilmesi. Her madde onu anlatan doküman sayfasına bağlanır.',
      btnDemo: 'Başlayın →',
      btnArch: 'Mimariyi inceleyin',
    },
    core: {
      eyebrow: 'TEMEL ÖZELLİKLER',
      title1: "Elchi Core Envoy'u",
      title2: 'nasıl yapılandırır?',
      subtitle: "Her Envoy kaynağı için tipli editörler, kaydedilmeden önce doğrulama, taslak/kaydet/yayınla iş akışı ve Envoy'u sunucularınızda çalıştıran agent.",
      items: [
        { t: "Proto Tabanlı Yapılandırma", d: "Tipli modeller ve alan meta verileri her Envoy sürümünün protobuf tanımlarından üretilir. Tipli alanlar ve doğrulamayla Listener, Cluster, Endpoint ve Route oluşturun." },
        { t: "Etkileşimli Bağımlılık Grafikleri", d: "Etkileşimli görsel diyagramlar Envoy bileşenleri arasındaki ilişkileri gösterir. Kaynak bağımlılıklarını ve veri akışını anlayın, yapılandırma sorunlarını giderin." },
        { t: "Hızlı Başlangıç Senaryoları", d: "EDS'li veya EDS'siz HTTP proxy ve TCP proxy gibi yaygın Envoy kurulumları için eksiksiz kaynak setini oluşturan sihirbazlar. Kendi senaryolarınızı da oluşturup yönetin." },
        { t: "Hafif Edge Agent", d: "Her edge host'ta Envoy'u yöneten hafif bir agent. Otomatik kayıt, sağlık izleme, Syslog/ELK'ye log aktarımı ve controller'ın gRPC üzerinden gönderdiği deploy, yükseltme ve yeniden başlatma komutları." },
        { t: "Tam xDS Protokol Desteği", d: "Eksiksiz xDS (ADS, CDS, EDS, LDS, RDS, VHDS) implementasyonu. Verimli artımlı yapılandırma güncellemeleri için Delta xDS desteği." },
        { t: "İki Aşamalı Doğrulama", d: "Her değişiklik editörde Envoy API'sinden üretilen tiplere göre, kaydedilmeden önce de sunucuda Envoy API'sinin doğrulama kurallarına göre kontrol edilir." },
        { t: "Kaydet & Yayınla İş Akışı", d: "Güvenli yapılandırma değişiklikleri için taslak modu. Değişiklikleri kademeli kaydedin, hazır olduğunuzda toplu güncellemeleri atomik biçimde yayınlayın. Her değişiklik denetim kaydına yazılır." },
        { t: "Çok Sürümlü Envoy Desteği", d: "Birden fazla Envoy sürümünü yan yana çalıştırın: registry her proxy'yi kendi sürümü için üretilmiş control plane'e yönlendirir. Bir listener'ı daha yeni sürüme taşıyıp hot restart ile geçin (Elchi'nin uçtan uca testinde saniyede sabit 20 istek altında 0 istek kaybı)." },
        { t: "Proje Bazlı Çok Kiracılı Yapı", d: "Yapılandırmaları ekiplere, ortamlara veya müşterilere göre düzenleyin. Kaynaklar proje bazında izole edilir; 4 katmanlı RBAC (Owner, Admin, Editor, Viewer)." },
      ],
    },
    advanced: {
      eyebrow: 'GELİŞMİŞ ÖZELLİKLER',
      title1: 'Hangi eklentiler ve entegrasyonlar',
      title2: 'onu genişletir?',
      subtitle: 'İstek yolunda ya da yanında API güvenliği ve API envanteri, AI destekli inceleme, Kubernetes endpoint senkronu, ACME sertifikaları ve DNS tabanlı GSLB.',
      items: [
        {
          tag: 'API Güvenlik Envanteri',
          t: 'API Discovery',
          d: "Canlı proxy trafiğini, sunduğunuz her API'nin sürekli puanlanan bir envanterine dönüştürün. Shadow endpoint'leri, eksik kimlik doğrulamayı ve PII sızıntılarını bulun — ve tüm yüzeyi OpenAPI olarak dışa aktarın.",
          bullets: ['İki eksenli tehdit & maruziyet puanlaması', 'OpenAPI spec içe aktarma, kapsam & sapma', 'Tüketici numaralandırma & PII analitiği (TCKN dahil)', 'Ekip sahipliği & OpenAPI 3.0.3 dışa aktarımı'],
        },
        {
          tag: 'Edge API Güvenliği',
          t: 'Shield',
          d: "API güvenliğini doğrudan istek yolunda uygulayan, her edge'de çalışan bir ext_proc sidecar: WAF, kimlik doğrulama, rate limiting ve bot savunması — her route için birleştirdiğiniz ve detect'ten block'a güvenle yaydığınız on iki engine, artı yerleşik veri sızıntısı önleme.",
          bullets: ['12 engine: JWT, mTLS, WAF, bot ve daha fazlası — artı yerleşik DLP', 'OWASP CRS + pozitif güvenlik OpenAPI', 'Detect → shadow → block dağıtımı', 'Canlı metrikler & adli olay akışı'],
        },
        {
          tag: 'OpenRouter AI Entegrasyonu',
          t: 'AI Destekli Analiz',
          d: 'Kendi OpenRouter API anahtarınızı getirin ve dilediğiniz AI modelini seçin. Bir kaynağın ve bağımlılıklarının ya da seçtiğiniz logların incelenmesini isteyin, sorun giderme önerilerini anında alın.',
          bullets: ['Bağımlılıklarla yapılandırma incelemesi', 'Log analizi', 'Sorun giderme önerileri', 'Kullanım ve maliyet takibi'],
        },
        {
          tag: 'Otomatik Endpoint Yönetimi',
          t: 'Kubernetes Keşfi',
          d: "Cluster içindeki keşif ajanı Kubernetes node'larınızı bildirir; Elchi, Endpoint kaynaklarını node IP'leriyle (NodePort tarzı) birden fazla cluster genelinde senkron tutar.",
          bullets: ['Hafif cluster içi ajan (Helm)', "Endpoint'ler cluster node IP'lerini izler", 'Çoklu cluster desteği', 'Proje keşif token’ı ve cluster durumu'],
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
          d: 'Envoy edge\'leri için DNS tabanlı GSLB: controller her IP\'yi HTTP, HTTPS ya da TCP ile yoklar, elchi-coredns yalnızca sağlıklı IP\'lerle yanıt verir. Her bölgesel DNS düğümü yalnızca kendi bölgesine etiketli sağlıklı IP\'leri döner; sağlıklı IP\'si kalmayan kayıt failover adına düşer.',
          bullets: ['HTTP/HTTPS/TCP sağlık kontrolleri', 'Anti-flapping koruması', 'Kayıt başına failover bölgeleri', "Backoff'lu circuit breaker"],
        },
      ],
    },
    comprehensive: {
      eyebrow: 'OPERASYON ÖZELLİKLERİ',
      title1: 'Güvenlik, gözlemlenebilirlik',
      title2: 've filo operasyonları.',
      subtitle: 'Erişim kontrolü, denetim, log ve metrikler, yedekleme, sürüm yükseltme ve HA; hepsi aynı control plane içinde.',
      items: [
        { t: 'Web Application Firewall (WAF)', d: "OWASP Core Rule Set, Shield'ın içinde kimlik doğrulama, bot savunması ve rate limiting ile birlikte çalışır: paranoya seviyeleri, anomali eşikleri ve policy başına kural istisnaları, detect'ten block'a kademeli devreye alma.", list: ["Shield'a gömülü OWASP CRS",'Paranoya seviyeleri & anomali puanlama','Policy başına kural istisnaları','Detect → shadow → block'] },
        { t: 'Senaryo İş Akışları', d: 'Yaygın bir Envoy kurulumunun ihtiyaç duyduğu tüm kaynakları adım adım sihirbazlarla oluşturan, doğrulayan ve bir adım başarısız olursa geri alarak tek seferde uygulayan hazır senaryolar.', list: ['Senaryo sihirbazı','Dinamik formlar','Yapılandırma incelemesi','Hızlı dağıtım'] },
        { t: 'Kubernetes Cluster Keşfi', d: "Keşif ajanı üzerinden bildirilen her Kubernetes cluster'ını görün: durumu, en son ne zaman görüldüğü ve hangi endpoint'lerin onu kullandığı.", list: ['Cluster listesi','Durum izleme','Kullanım istatistikleri','Son görülme takibi'] },
        { t: 'Denetim Kaydı', d: 'Kullanıcı eylemleri, yapılandırma değişiklikleri ve sistem operasyonları için denetim izi. Tarihe, eylem türüne, kullanıcıya ve kaynağa göre filtreleyin.', list: ['Eylem takibi','Kullanıcı hesap verebilirliği','Kaynak değişiklikleri',"Syslog'a iletim"] },
        { t: 'Gelişmiş Metrikler', d: 'Downstream, upstream ve listener metrikleri için etkileşimli grafikler. Özel zaman aralıkları, metrik gruplama ve otomatik yenileme.', list: ['Gerçek zamanlı grafikler','Özel zaman aralıkları','Metrik filtreleme','Dışa aktarma yetenekleri'] },
        { t: 'Log Yönetimi', d: "Bir listener'ın Envoy ve access log'larını proxy sunucularında zaman aralığına göre arayın; histogram, alan filtreleri ve kesin sayfalama ile.", list: ['Zaman aralığıyla arama','Histogram','Alan filtreleri','Kesin sayfalama'] },
        { t: 'Yedekleme ve Geri Yükleme', d: "Bir projenin yapılandırmasını, servislerini ve sertifikalarını tek bir JSON dosyasına aktarın, doğrulayın ve aynı ya da başka bir kuruluma geri yükleyin.", list: ['Proje bazlı dışa aktarım','İçe aktarmadan önce doğrulama','Bağımlılık sıralı geri yükleme','Sürüm temizleme araçları'] },
        { t: 'Sürüm Yükseltme', d: 'Bir listener\'ı ve bağlı olduğu kaynakları bir Envoy sürümünden diğerine taşıyın, ardından hot restart ile geçiş yapın.', list: ['Bağımlılık farkında kopyalama',"Hedef client sürüm kontrolü",'Hot restart ile geçiş','İstek kaybı olmadan'] },
        { t: 'Log Aktarımı', d: 'Logları Filebeat (Elasticsearch veya Logstash) ya da rsyslog ile harici sistemlere gönderin; client başına arayüzden yapılandırılır.', list: ['Syslog entegrasyonu','Elasticsearch ve Logstash çıkışı','Merkezi loglama','Denetim kaydı iletimi'] },
        { t: 'Metrik Görselleştirme', d: 'Envoy metriklerini platformda ve Grafana üzerinden görüntüleyin. Grafikler bir saat, bir gün ya da bir hafta öncesiyle karşılaştırılır; her grafik CSV ya da PNG olarak indirilir.', list: ['Yerleşik gösterge panoları','Grafana entegrasyonu','Dönem karşılaştırma','CSV / PNG dışa aktarma'] },
        { t: 'LDAP Kimlik Doğrulama', d: 'Kullanıcıları dizin sunucusuna TLS ile bağlanarak LDAP ya da Active Directory üzerinden doğrulayın.', list: ['LDAP entegrasyonu','Active Directory desteği','Merkezi kimlik doğrulama','TLS ile güvenli LDAP'] },
        { t: 'ACME Sertifikaları', d: "DNS-01 challenge ile Let's Encrypt ve Google Trust Services için ACME protokol desteğiyle otomatik sertifika yaşam döngüsü yönetimi.", list: ["Let's Encrypt entegrasyonu",'Google Trust Services','DNS sağlayıcı yönetimi','Otomatik yenileme'] },
        { t: 'API Discovery & Envanter', d: "Proxy'lerinizin sunduğu her API'yi sürekli keşfedin, her endpoint'i tehdit ve maruziyet açısından puanlayın; sapmaları, eksik kimlik doğrulamayı ve PII sızıntılarını olaya dönüşmeden yakalayın.", list: ['İki eksenli risk puanlaması',"Sapma & temel snapshot'leri",'PII & tüketici analitiği','OpenAPI spec kapsamı & dışa aktarımı'] },
        { t: 'Tehdit İstihbaratı & GeoIP', d: 'Trafik analitiğini itibar beslemeleri ve GeoIP veritabanlarıyla zenginleştirin. Kötü amaçlı kaynakları işaretleyin ve istemcileri gösterge panolarında ülke, ASN ve coğrafyaya çözümleyin.', list: ['Özel tehdit beslemeleri','GeoIP / ASN çözümleme','Bot & tarayıcı tespiti','İtibar tabanlı işaretler'] },
        { t: 'Arka Plan İş Motoru', d: 'Uzun süren operasyonlar asenkron çalışır, her birinin fazı ve logları görünür. Snapshot güncellemelerini, Shield policy dağıtımını, ACME doğrulamasını ve sürüm yükseltmelerini yeniden deneme desteğiyle takip edin.', list: ['Asenkron iş takibi','Canlı faz & loglar','Takılan iş tespiti','Tek tıkla yeniden deneme'] },
        { t: 'İki Faktörlü Kimlik Doğrulama', d: "QR kaydı ve yedek kodlarla TOTP tabanlı çok faktörlü kimlik doğrulama. Yöneticiler 2FA'yı zorunlu kılabilir ve kilitlenen kullanıcılar için sıfırlayabilir.", list: ['TOTP / authenticator uygulamaları','Yedek kodlar','Yönetici sıfırlama & zorunlu kılma','Kullanıcı bazlı kayıt'] },
        { t: 'Edge HA Çiftleri', d: "İki Elchi OS cihazını VIP'leri aktif/pasif paylaşacak şekilde eşleyin. Aktif üyeyi cihazlar kendileri seçer, standby aynı Envoy'ları sıcak çalıştırır ve çöken aktifin yerini düz L2'de yaklaşık iki saniyede alır (BGP üzerinde, komşularda BFD açıkken).", list: ['Aktif/pasif VIP failover','~50 ms planlı failover',"Bakım modu ve standby-önce yükseltme","Floating next-hop, BGP ve BFD"] },
        { t: 'Registry HA & Topoloji', d: "Tek bir MongoDB'yi paylaşan birden fazla Controller ve Control-Plane'i, zamanlanmış işler için leader election ve canlı topoloji görünümüyle çalıştırın. Standby node'lar registry snapshot'larından beslenir.", list: ['Instance izleme','Leader election durumu',"Çok Controller'lı HA",'Eski instance temizliği'] },
        { t: 'Canlı Trafik Görünümü', d: "Bir listener'ı çalışırken izleyin. Access log'dan örneklenen istekler client'lardan connection manager, domain, route ve cluster'lar üzerinden endpoint'lere akar — her biri Envoy'un bitirdiği yerde durur — oranlar, p99 ve 5xx kaynağı 5 saniyede bir metriklerden gelir.", list: ['Örneklenen istekler, sırasıyla','Düğüm bazında oran & gecikme',"Shield blokları & 5xx kaynağı","Log'lara bağlanan yan panel"] },
        { t: 'Raporlar', d: "Projenin tamamı hakkında yanıtlar tek yerde: önce neye bakılmalı, hangi listener hangi domain'e hizmet veriyor ve nereye gidiyor, filter chain bazında TLS ve Shield kapsamı, kullanılmayan kaynaklar, filo ve son değişiklikler.", list: ['Sorunlar, en kötüsü önce','Trafik haritası & domain\'ler','Güvenlik & sertifikalar','CSV / JSON dışa aktarma'] },
      ],
    },
    compliance: {
      eyebrow: 'UYUMLULUK & STANDARTLAR',
      title1: 'Bir güvenlik incelemesi',
      title2: 'neyi bilmek ister?',
      subtitle: 'Güvenlik incelemelerinde sorulan kontroller, ürünün uyguladığı şekliyle.',
      items: [
        'Eksiksiz Denetim İzi ve Syslog İletimi',
        'Yapılandırılabilir Veri Saklama Süresi',
        'Yalnızca Trafik Meta Verisi, İstek Gövdesi Yok',
        'Şifreli ACME ve DNS Sağlayıcı Kimlik Bilgileri',
        'Rol Tabanlı Erişim Kontrolü',
        'Zorunlu Kılınabilir İki Faktörlü Doğrulama',
      ],
    },
  },
};

/* The docs page behind each feature, in the same order as the items of each section
   (identical in both locales). Paths are under /docs (docs-site/docs). */
const FEATURE_DOCS = {
  core: [
    '/docs/envoy-configuration/config-model',
    '/docs/envoy-configuration/dependency-graph',
    '/docs/envoy-configuration/scenario-workflows/overview',
    '/docs/installation/client/overview',
    '/docs/getting-started/architecture',
    '/docs/envoy-configuration/config-model#two-step-validation',
    '/docs/envoy-configuration/config-model#save--publish',
    '/docs/guides/run-multiple-envoy-versions',
    '/docs/administration/auth-and-access',
  ],
  advanced: [
    '/docs/api-discovery/overview',
    '/docs/shield/overview',
    '/docs/administration/ai-analysis',
    '/docs/installation/discovery-agent/overview',
    '/docs/traffic-and-certificates/acme/overview',
    '/docs/guides/gslb-dns-failover-envoy',
  ],
  comprehensive: [
    '/docs/shield/engines/coraza-waf',
    '/docs/envoy-configuration/scenario-workflows/overview',
    '/docs/installation/discovery-agent/using-discovery',
    '/docs/observability/audit-and-syslog',
    '/docs/observability/metrics-and-logs',
    '/docs/observability/service-logs',
    '/docs/administration/backup-restore',
    '/docs/envoy-configuration/versions-and-upgrades',
    '/docs/operations/clients',
    '/docs/observability/metrics-and-logs',
    '/docs/administration/auth-and-access',
    '/docs/traffic-and-certificates/acme/overview',
    '/docs/api-discovery/endpoints',
    '/docs/administration/threat-intel-geoip',
    '/docs/observability/background-jobs',
    '/docs/administration/auth-and-access',
    '/docs/ha-pairs/overview',
    '/docs/administration/registry-and-ha',
    '/docs/observability/live-traffic',
    '/docs/observability/reports',
  ],
};
const DOC_LINK = { en: (t) => `${t} docs`, tr: (t) => `${t} dokümanı` };

/* One docs link per feature: the feature name is the anchor text, so every link says where it goes. */
function DocLink({ section, i, title }) {
  const href = FEATURE_DOCS[section][i];
  if (!href) return null;
  return <a className="fx-doc" href={href}>{DOC_LINK[getLocale()](title)}<Arrow/></a>;
}

/* The section headings were stored as two lines; join them back into one sentence
   ("security-" + "first mindset." keeps the hyphenated word whole). */
const join = (a, b) => (/[\s-]$/.test(a) ? a + b : `${a} ${b}`);
const noArrow = (s) => s.replace(/\s*→$/, '');
/* The old uppercase eyebrows become sentence-case legend entries in the hero. */
const sentence = (s, loc) => {
  const low = s.toLocaleLowerCase(loc);
  return low.charAt(0).toLocaleUpperCase(loc) + low.slice(1);
};

function FeaturesApp() {
  return (
    <>
      <Nav active="features"/>
      <main className="rl">
        <FeaturesHero/>
        <CoreFeatures/>
        <AdvancedFeatures/>
        <ComprehensiveFeatures/>
        <Compliance/>
      </main>
      <Footer/>
    </>
  );
}

/* ====================== HERO ====================== */
function FeaturesHero() {
  const loc = getLocale();
  const t = STR[loc];
  const legend = [
    ['core', t.core, 'rl-dot'],
    ['advanced', t.advanced, 'rl-dot rl-dot-flow'],
    ['comprehensive', t.comprehensive, 'rl-dot rl-dot-lake'],
    ['compliance', t.compliance, 'rl-dot'],
  ];
  return (
    <PageHero
      title={<><span className="rl-h1-line">{t.hero.title1.trim()}</span>{' '}<span className="rl-h1-line">{t.hero.title2}</span></>}
      lede={t.hero.subtitle}
      actions={<>
        <a href="/docs/getting-started/quickstart" className="rl-go">{noArrow(t.hero.btnDemo)}<Arrow/></a>
        <a href={locHref('architecture')} className="rl-link">{t.hero.btnArch}<Arrow/></a>
      </>}
      aside={
        <nav className="fx-legend" aria-label={sentence(t.hero.eyebrow, loc)}>
          <ul>
            {legend.map(([id, sec, dot]) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span className={dot} aria-hidden="true"/>
                  <span className="fx-legend-name">{sentence(sec.eyebrow, loc)}</span>
                  <span className="fx-legend-n">{sec.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      }
    />
  );
}

/* ====================== CORE ====================== */
function CoreFeatures() {
  const t = STR[getLocale()].core;
  return (
    <Band tone="mist" id="core">
      <BandHead h2={join(t.title1, t.title2)} intro={t.subtitle}/>
      <ul className="rl-notes">
        {t.items.map((it, i) => (
          <li key={it.t}><h3>{it.t}</h3><p>{it.d}</p><DocLink section="core" i={i} title={it.t}/></li>
        ))}
      </ul>
    </Band>
  );
}

/* ====================== ADVANCED ======================
   The two security products stand as plates with a small picture each; the other four follow
   as open entries on the water band. Dot colour carries meaning: flow = traffic, coral = Shield. */
const ADV_DOT = ['flow', 'coral', 'lake', 'moss', 'moss', 'flow'];

function AdvancedFeatures() {
  const t = STR[getLocale()].advanced;
  const [lead, rest] = [t.items.slice(0, 2), t.items.slice(2)];
  return (
    <Band tone="water" id="advanced">
      <BandHead h2={join(t.title1, t.title2)} intro={t.subtitle}/>
      <div className="fx-plates">
        {lead.map((it, i) => (
          <article key={it.t} className={`fx-plate fx-${ADV_DOT[i]}`}>
            <div className="fx-plate-pic" aria-hidden="true">{i === 0 ? <InventoryPic/> : <ShieldPic/>}</div>
            <div className="fx-plate-body">
              <h3>{it.t}</h3>
              <span className="rl-map-label">{it.tag}</span>
              <p>{it.d}</p>
              <ul className="fx-bullets">{it.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              <DocLink section="advanced" i={i} title={it.t}/>
            </div>
          </article>
        ))}
      </div>
      <div className="fx-open">
        {rest.map((it, i) => (
          <article key={it.t} className={`fx-entry fx-${ADV_DOT[i + 2]}`}>
            <h3>{it.t}</h3>
            <span className="rl-map-label">{it.tag}</span>
            <p>{it.d}</p>
            <ul className="fx-chips">{it.bullets.map((b) => <li key={b} className="rl-chip">{b}</li>)}</ul>
            <DocLink section="advanced" i={i + 2} title={it.t}/>
          </article>
        ))}
      </div>
    </Band>
  );
}

/* API Discovery: endpoints scattered by exposure (x) and threat (y); larger and darker = riskier. */
function InventoryPic() {
  const pts = [
    [80, 140, 4, .35], [120, 120, 5, .45], [150, 95, 6, .6], [185, 70, 8, .8], [215, 50, 10, 1],
    [100, 150, 3, .3], [170, 110, 5, .5], [235, 80, 7, .7], [60, 155, 3, .3],
  ];
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%">
      <path className="fx-axis" d="M40 20v150h230" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y, r, op], i) => (
        <g key={i}>
          <circle className="fx-halo" cx={x} cy={y} r={r + 6} opacity={op * .35}/>
          <circle className="fx-pt" cx={x} cy={y} r={r} opacity={op}/>
        </g>
      ))}
    </svg>
  );
}

/* Shield: the guard in the request path. */
function ShieldPic() {
  const d = 'M0,-62 L54,-42 L54,8 C54,44 30,64 0,74 C-30,64 -54,44 -54,8 L-54,-42 Z';
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%">
      <path className="fx-flowline" d="M14 100H96M204 100H286" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10"/>
      <g transform="translate(150 96)">
        <path className="fx-shield-back" d={d} transform="scale(1.12)"/>
        <path className="fx-shield" d={d} strokeWidth="3" strokeLinejoin="round"/>
        <path className="fx-shield-tick" d="M-20,6 l13,13 l26,-30" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

/* ====================== COMPREHENSIVE ====================== */
function ComprehensiveFeatures() {
  const t = STR[getLocale()].comprehensive;
  return (
    <Band tone="sage" id="comprehensive">
      <BandHead h2={join(t.title1, t.title2)} intro={t.subtitle}/>
      <div className="uc fx-rows">
        {t.items.map((it, i) => (
          <div key={it.t} className="uc-row">
            <h3>{it.t}</h3>
            <div className="fx-row-copy">
              <p>{it.d}</p>
              <DocLink section="comprehensive" i={i} title={it.t}/>
            </div>
            <ul>{it.list.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        ))}
      </div>
    </Band>
  );
}

/* ====================== COMPLIANCE (closing band) ====================== */
function Compliance() {
  const all = STR[getLocale()];
  const t = all.compliance;
  return (
    <Band tone="moss" id="compliance">
      <BandHead h2={join(t.title1, t.title2)} intro={t.subtitle}/>
      <ul className="fx-comply">
        {t.items.map((it) => (
          <li key={it}><Tick/><span>{it}</span></li>
        ))}
      </ul>
      <div className="rl-actions">
        <a href="/docs/getting-started/quickstart" className="rl-go">{noArrow(all.hero.btnDemo)}<Arrow/></a>
        <a href={locHref('architecture')} className="rl-link">{all.hero.btnArch}<Arrow/></a>
      </div>
    </Band>
  );
}

export const Page = FeaturesApp;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<FeaturesApp/>);
