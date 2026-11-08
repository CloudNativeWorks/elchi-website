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
      title1: 'A complete proxy ',
      title2: 'management toolkit.',
      subtitle: 'Comprehensive platform for enterprise proxy management with modern UI, intelligent automation, and powerful enterprise capabilities.',
      btnDemo: 'Get Started →',
      btnArch: 'See architecture',
    },
    core: {
      eyebrow: 'CORE FEATURES',
      title1: 'The fundamentals,',
      title2: 'automated end-to-end.',
      subtitle: 'Comprehensive platform for enterprise proxy management with modern UI and powerful automation.',
      items: [
        { t: 'Proto-Driven Configuration', d: 'Typed models and field metadata are generated from each Envoy version\'s protobuf definitions. Create Listeners, Clusters, Endpoints, and Routes with typed fields and validation.' },
        { t: 'Interactive Dependency Graphs', d: 'Interactive visual diagrams display relationships between Envoy components. Understand resource dependencies, data flow, and troubleshoot configurations.' },
        { t: 'Quick Start Scenarios', d: 'Guided wizards that build a complete set of resources for common Envoy setups, such as an HTTP proxy with or without EDS and a TCP proxy. Create and manage your own scenarios too.' },
        { t: 'Lightweight Edge Agent', d: 'A lightweight agent that manages Envoy on every edge host. Automatic registration, health monitoring, log export to Syslog/ELK, and seamless integration with the control plane.' },
        { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS). Delta xDS support for efficient incremental configuration updates.' },
        { t: 'Two-Step Validation', d: 'Validation in the editor and again on the server ensures configurations are correct before deployment. Catch errors early and prevent misconfigurations.' },
        { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically when ready. Every change is recorded in the audit log.' },
        { t: 'Multi-Version Envoy Support', d: 'Manage multiple Envoy versions side by side from a single interface — new releases are added continuously. Intelligent version-based routing with seamless version upgrade capability.' },
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
          d: 'Enterprise GSLB with intelligent health probing, automatic failover, and region-scoped answers: each regional DNS node serves only the healthy IPs tagged for its region. Integrates with CoreDNS for dynamic DNS responses based on endpoint health.',
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
        { t: 'Web Application Firewall (WAF)', d: 'The OWASP Core Rule Set runs inside Shield, next to authentication, bot defense and rate limiting: paranoia levels, anomaly thresholds and per-policy rule exclusions, rolled out from detect to block.', list: ['OWASP CRS built into Shield','Paranoia levels & anomaly scoring','Per-policy rule exclusions','Detect → shadow → block'] },
        { t: 'Scenario Workflows', d: 'Pre-built scenario workflows with step-by-step wizards for common Envoy configurations. Execute, test, and deploy configurations efficiently.', list: ['Scenario wizard','Dynamic forms','Configuration review','Quick deployment'] },
        { t: 'Kubernetes Cluster Discovery', d: 'See every Kubernetes cluster that reports through the discovery agent: its status, when it was last seen, and which endpoints use it.', list: ['Cluster list','Status monitoring','Usage statistics','Last seen tracking'] },
        { t: 'Audit Logging', d: 'Complete audit trail for all user actions, configuration changes, and system operations. Filter by date, action type, user, and resource.', list: ['Action tracking','User accountability','Resource changes','Forwarding to syslog'] },
        { t: 'Advanced Metrics', d: 'Interactive charts for downstream, upstream, and listener metrics. Custom time ranges, metric grouping, and auto-refresh.', list: ['Real-time charts','Custom time ranges','Metric filtering','Export capabilities'] },
        { t: 'Log Management', d: 'Real-time service logs with JSON parsing, HTTP access log detection, and intelligent log analysis for pattern detection and troubleshooting.', list: ['JSON log parsing','Log level filtering','Search functionality','Pattern detection'] },
        { t: 'Backup & Restore', d: 'Export a project\'s configuration, services and certificates to one JSON file, validate it, and import it into the same or another installation.', list: ['Project-scoped export','Validation before import','Dependency-aware restore','Version cleanup tools'] },
        { t: 'Version Upgrade', d: 'Move a listener and the resources it depends on from one Envoy version to another, then cut over with a hot restart.', list: ['Dependency-aware cloning','Target client version check','Hot-restart cut-over','Zero dropped requests'] },
        { t: 'Log Export', d: 'Ship logs to external systems with Filebeat (Elasticsearch or Logstash) or rsyslog. Centralize log management and integrate with your existing observability stack.', list: ['Syslog integration','Elasticsearch & Logstash output','Centralized logging','Audit log forwarding'] },
        { t: 'Metrics Visualization', d: 'View detailed metrics both on the platform and through Grafana integration. Monitor performance, traffic patterns, and system health in real-time.', list: ['Built-in dashboards','Grafana integration','Custom metrics','Real-time updates'] },
        { t: 'LDAP Authentication', d: 'Integrate with your existing LDAP/Active Directory infrastructure. Centralized user authentication and authorization for enterprise deployments.', list: ['LDAP integration','Active Directory support','Centralized auth','TLS-secured LDAP'] },
        { t: 'ACME Certificates', d: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services with DNS-01 challenge.', list: ['Let\'s Encrypt integration','Google Trust Services','DNS provider management','Automatic renewal'] },
        { t: 'API Discovery & Inventory', d: 'Continuously discover every API your proxies expose, score each endpoint for threat and exposure, and catch drift, missing auth, and PII leaks before they become incidents.', list: ['Two-axis risk scoring','Drift & baseline snapshots','PII & consumer analytics','OpenAPI spec coverage & export'] },
        { t: 'Threat Intelligence & GeoIP', d: 'Enrich traffic analytics with reputation feeds and GeoIP databases. Flag malicious sources and resolve clients to country, ASN, and geography across dashboards.', list: ['Custom threat feeds','GeoIP / ASN resolution','Bot & scanner detection','Reputation-based flags'] },
        { t: 'Background Job Engine', d: 'Long-running operations run asynchronously with full visibility. Track snapshot updates, Shield policy rollout, ACME verification, and version upgrades with retry support.', list: ['Async job tracking','Live phase & logs','Stuck-job detection','One-click retry'] },
        { t: 'Two-Factor Authentication', d: 'TOTP-based multi-factor authentication with QR enrollment and backup codes. Admins can enforce 2FA and reset it for locked-out users.', list: ['TOTP / authenticator apps','Backup codes','Admin reset & enforcement','Per-user enrollment'] },
        { t: 'Edge HA Pairs', d: 'Pair two Elchi OS appliances so they share VIPs active/passive. The boxes elect the active member themselves, the standby runs the same Envoys warm, and a failed active is replaced in about two seconds on plain L2 (over BGP, with BFD on the neighbours).', list: ['Active/passive VIP failover','Planned failover in ~50 ms','Maintenance mode & standby-first upgrades','Floating next-hops, BGP & BFD'] },
        { t: 'Registry HA & Topology', d: 'Run multiple controllers and control-planes with leader election and live topology visibility. Standby nodes hydrate from registry snapshots for resilient operations.', list: ['Instance monitoring','Leader election status','Multi-controller HA','Stale instance cleanup'] },
        { t: 'Live Traffic View', d: 'Watch a listener as it runs. Requests sampled from the access log flow from the clients through connection managers, domains, routes and clusters to the endpoints — each placed where Envoy ended it — with rates, p99 and 5xx origin from metrics every 5 seconds.', list: ['Sampled requests, played in order','Per-node rates & latency','Shield blocks & 5xx origin','Side panel linking to Logs'] },
        { t: 'Reports', d: 'Answers about the whole project in one place: what needs a look first, which listener serves which domain and where it goes, TLS and Shield coverage per filter chain, unused resources, the fleet and recent changes.', list: ['Problems, worst first','Traffic map & domains','Security & certificates','CSV / JSON export'] },
      ],
    },
    compliance: {
      eyebrow: 'COMPLIANCE & STANDARDS',
      title1: 'Built with a security-',
      title2: 'first mindset.',
      subtitle: 'Built with security-first mindset for enterprise-grade deployments.',
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
      title1: 'Eksiksiz bir proxy ',
      title2: 'yönetim araç seti.',
      subtitle: 'Modern arayüz, akıllı otomasyon ve güçlü kurumsal yeteneklerle donatılmış, kurumsal proxy yönetimi için kapsamlı bir platform.',
      btnDemo: 'Başlayın →',
      btnArch: 'Mimariyi inceleyin',
    },
    core: {
      eyebrow: 'TEMEL ÖZELLİKLER',
      title1: 'Temel işlevler,',
      title2: 'uçtan uca otomatik.',
      subtitle: 'Modern arayüz ve güçlü otomasyonla kurumsal proxy yönetimi için kapsamlı bir platform.',
      items: [
        { t: "Proto Tabanlı Yapılandırma", d: "Tipli modeller ve alan meta verileri her Envoy sürümünün protobuf tanımlarından üretilir. Tipli alanlar ve doğrulamayla Listener, Cluster, Endpoint ve Route oluşturun." },
        { t: "Etkileşimli Bağımlılık Grafikleri", d: "Etkileşimli görsel diyagramlar Envoy bileşenleri arasındaki ilişkileri gösterir. Kaynak bağımlılıklarını ve veri akışını anlayın, yapılandırma sorunlarını giderin." },
        { t: "Hızlı Başlangıç Senaryoları", d: "EDS'li veya EDS'siz HTTP proxy ve TCP proxy gibi yaygın Envoy kurulumları için eksiksiz kaynak setini oluşturan sihirbazlar. Kendi senaryolarınızı da oluşturup yönetin." },
        { t: "Hafif Edge Agent", d: "Her edge host'ta Envoy'u yöneten hafif bir agent. Otomatik kayıt, sağlık izleme, Syslog/ELK'ye log aktarımı ve control plane ile kusursuz entegrasyon." },
        { t: "Tam xDS Protokol Desteği", d: "Eksiksiz xDS (ADS, CDS, EDS, LDS, RDS, VHDS) implementasyonu. Verimli artımlı yapılandırma güncellemeleri için Delta xDS desteği." },
        { t: "İki Aşamalı Doğrulama", d: "Editörde ve ardından sunucuda yapılan doğrulama, yapılandırmaların dağıtımdan önce doğru olmasını sağlar. Hataları erken yakalayın ve hatalı yapılandırmaları önleyin." },
        { t: "Kaydet & Yayınla İş Akışı", d: "Güvenli yapılandırma değişiklikleri için taslak modu. Değişiklikleri kademeli kaydedin, hazır olduğunuzda toplu güncellemeleri atomik biçimde yayınlayın. Her değişiklik denetim kaydına yazılır." },
        { t: "Çok Sürümlü Envoy Desteği", d: "Birden fazla Envoy sürümünü tek bir arayüzden yan yana yönetin — yeni sürümler sürekli eklenir. Kusursuz sürüm yükseltme yeteneğiyle akıllı, sürüm tabanlı yönlendirme." },
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
          d: 'Akıllı sağlık kontrolü, otomatik yük devretme ve bölgeye göre yanıt sunan kurumsal GSLB: her bölgesel DNS düğümü yalnızca kendi bölgesine etiketli sağlıklı IP\'leri döner. Endpoint sağlığına göre dinamik DNS yanıtları için CoreDNS ile entegre olun.',
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
        { t: 'Web Application Firewall (WAF)', d: "OWASP Core Rule Set, Shield'ın içinde kimlik doğrulama, bot savunması ve rate limiting ile birlikte çalışır: paranoya seviyeleri, anomali eşikleri ve policy başına kural istisnaları, detect'ten block'a kademeli devreye alma.", list: ["Shield'a gömülü OWASP CRS",'Paranoya seviyeleri & anomali puanlama','Policy başına kural istisnaları','Detect → shadow → block'] },
        { t: 'Senaryo İş Akışları', d: 'Yaygın Envoy yapılandırmaları için adım adım sihirbazlar içeren hazır senaryo iş akışları. Yapılandırmaları verimli biçimde çalıştırın, test edin ve dağıtın.', list: ['Senaryo sihirbazı','Dinamik formlar','Yapılandırma incelemesi','Hızlı dağıtım'] },
        { t: 'Kubernetes Cluster Keşfi', d: "Keşif ajanı üzerinden bildirilen her Kubernetes cluster'ını görün: durumu, en son ne zaman görüldüğü ve hangi endpoint'lerin onu kullandığı.", list: ['Cluster listesi','Durum izleme','Kullanım istatistikleri','Son görülme takibi'] },
        { t: 'Denetim Kaydı', d: 'Tüm kullanıcı eylemleri, yapılandırma değişiklikleri ve sistem operasyonları için eksiksiz denetim izi. Tarihe, eylem türüne, kullanıcıya ve kaynağa göre filtreleyin.', list: ['Eylem takibi','Kullanıcı hesap verebilirliği','Kaynak değişiklikleri',"Syslog'a iletim"] },
        { t: 'Gelişmiş Metrikler', d: 'Downstream, upstream ve listener metrikleri için etkileşimli grafikler. Özel zaman aralıkları, metrik gruplama ve otomatik yenileme.', list: ['Gerçek zamanlı grafikler','Özel zaman aralıkları','Metrik filtreleme','Dışa aktarma yetenekleri'] },
        { t: 'Log Yönetimi', d: 'JSON ayrıştırma, HTTP erişim logu tespiti ve örüntü tespiti ile sorun giderme için akıllı log analizi içeren gerçek zamanlı servis logları.', list: ['JSON log ayrıştırma','Log seviyesi filtreleme','Arama işlevi','Örüntü tespiti'] },
        { t: 'Yedekleme ve Geri Yükleme', d: "Bir projenin yapılandırmasını, servislerini ve sertifikalarını tek bir JSON dosyasına aktarın, doğrulayın ve aynı ya da başka bir kuruluma geri yükleyin.", list: ['Proje bazlı dışa aktarım','İçe aktarmadan önce doğrulama','Bağımlılık sıralı geri yükleme','Sürüm temizleme araçları'] },
        { t: 'Sürüm Yükseltme', d: 'Bir listener\'ı ve bağlı olduğu kaynakları bir Envoy sürümünden diğerine taşıyın, ardından hot restart ile geçiş yapın.', list: ['Bağımlılık farkında kopyalama',"Hedef client sürüm kontrolü",'Hot restart ile geçiş','İstek kaybı olmadan'] },
        { t: 'Log Aktarımı', d: 'Logları Filebeat (Elasticsearch veya Logstash) ya da rsyslog ile harici sistemlere gönderin. Log yönetimini merkezileştirin ve mevcut gözlemlenebilirlik yığınınızla entegre edin.', list: ['Syslog entegrasyonu','Elasticsearch ve Logstash çıkışı','Merkezi loglama','Denetim kaydı iletimi'] },
        { t: 'Metrik Görselleştirme', d: 'Ayrıntılı metrikleri hem platform üzerinde hem de Grafana entegrasyonuyla görüntüleyin. Performansı, trafik örüntülerini ve sistem sağlığını gerçek zamanlı izleyin.', list: ['Yerleşik gösterge panoları','Grafana entegrasyonu','Özel metrikler','Gerçek zamanlı güncellemeler'] },
        { t: 'LDAP Kimlik Doğrulama', d: 'Mevcut LDAP/Active Directory altyapınızla entegre olun. Kurumsal dağıtımlar için merkezi kullanıcı kimlik doğrulama ve yetkilendirme.', list: ['LDAP entegrasyonu','Active Directory desteği','Merkezi kimlik doğrulama','TLS ile güvenli LDAP'] },
        { t: 'ACME Sertifikaları', d: "DNS-01 challenge ile Let's Encrypt ve Google Trust Services için ACME protokol desteğiyle otomatik sertifika yaşam döngüsü yönetimi.", list: ["Let's Encrypt entegrasyonu",'Google Trust Services','DNS sağlayıcı yönetimi','Otomatik yenileme'] },
        { t: 'API Discovery & Envanter', d: "Proxy'lerinizin sunduğu her API'yi sürekli keşfedin, her endpoint'i tehdit ve maruziyet açısından puanlayın; sapmaları, eksik kimlik doğrulamayı ve PII sızıntılarını olaya dönüşmeden yakalayın.", list: ['İki eksenli risk puanlaması',"Sapma & temel snapshot'leri",'PII & tüketici analitiği','OpenAPI spec kapsamı & dışa aktarımı'] },
        { t: 'Tehdit İstihbaratı & GeoIP', d: 'Trafik analitiğini itibar beslemeleri ve GeoIP veritabanlarıyla zenginleştirin. Kötü amaçlı kaynakları işaretleyin ve istemcileri gösterge panolarında ülke, ASN ve coğrafyaya çözümleyin.', list: ['Özel tehdit beslemeleri','GeoIP / ASN çözümleme','Bot & tarayıcı tespiti','İtibar tabanlı işaretler'] },
        { t: 'Arka Plan İş Motoru', d: 'Uzun süren operasyonlar tam görünürlükle asenkron çalışır. Snapshot güncellemelerini, Shield policy dağıtımını, ACME doğrulamasını ve sürüm yükseltmelerini yeniden deneme desteğiyle takip edin.', list: ['Asenkron iş takibi','Canlı faz & loglar','Takılan iş tespiti','Tek tıkla yeniden deneme'] },
        { t: 'İki Faktörlü Kimlik Doğrulama', d: "QR kaydı ve yedek kodlarla TOTP tabanlı çok faktörlü kimlik doğrulama. Yöneticiler 2FA'yı zorunlu kılabilir ve kilitlenen kullanıcılar için sıfırlayabilir.", list: ['TOTP / authenticator uygulamaları','Yedek kodlar','Yönetici sıfırlama & zorunlu kılma','Kullanıcı bazlı kayıt'] },
        { t: 'Edge HA Çiftleri', d: "İki Elchi OS cihazını VIP'leri aktif/pasif paylaşacak şekilde eşleyin. Aktif üyeyi cihazlar kendileri seçer, standby aynı Envoy'ları sıcak çalıştırır ve çöken aktifin yerini düz L2'de yaklaşık iki saniyede alır (BGP üzerinde, komşularda BFD açıkken).", list: ['Aktif/pasif VIP failover','~50 ms planlı failover',"Bakım modu ve standby-önce yükseltme","Floating next-hop, BGP ve BFD"] },
        { t: 'Registry HA & Topoloji', d: "Birden fazla Controller ve Control-Plane'i leader election ve canlı topoloji görünürlüğüyle çalıştırın. Standby node'lar dayanıklı operasyonlar için registry snapshot'larından beslenir.", list: ['Instance izleme','Leader election durumu',"Çok Controller'lı HA",'Eski instance temizliği'] },
        { t: 'Canlı Trafik Görünümü', d: "Bir listener'ı çalışırken izleyin. Access log'dan örneklenen istekler client'lardan connection manager, domain, route ve cluster'lar üzerinden endpoint'lere akar — her biri Envoy'un bitirdiği yerde durur — oranlar, p99 ve 5xx kaynağı 5 saniyede bir metriklerden gelir.", list: ['Örneklenen istekler, sırasıyla','Düğüm bazında oran & gecikme',"Shield blokları & 5xx kaynağı","Log'lara bağlanan yan panel"] },
        { t: 'Raporlar', d: "Projenin tamamı hakkında yanıtlar tek yerde: önce neye bakılmalı, hangi listener hangi domain'e hizmet veriyor ve nereye gidiyor, filter chain bazında TLS ve Shield kapsamı, kullanılmayan kaynaklar, filo ve son değişiklikler.", list: ['Sorunlar, en kötüsü önce','Trafik haritası & domain\'ler','Güvenlik & sertifikalar','CSV / JSON dışa aktarma'] },
      ],
    },
    compliance: {
      eyebrow: 'UYUMLULUK & STANDARTLAR',
      title1: 'Güvenlik öncelikli',
      title2: 'bir yaklaşımla inşa edildi.',
      subtitle: 'Kurumsal düzeyde dağıtımlar için güvenlik öncelikli bir yaklaşımla inşa edildi.',
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
        {t.items.map((it) => (
          <li key={it.t}><h3>{it.t}</h3><p>{it.d}</p></li>
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
        {t.items.map((it) => (
          <div key={it.t} className="uc-row">
            <h3>{it.t}</h3>
            <p>{it.d}</p>
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
