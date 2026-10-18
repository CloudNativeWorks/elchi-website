import ReactDOM from 'react-dom/client';
import { getLocale, locHref } from './i18n.js';
import { Nav, Footer } from './shared.jsx';
import { PRODUCTS } from './products-data.js';
import { ArchDiagram, ArchOrbit, ArchTerminal } from './arch-diagram.jsx';
import { ScreenGallery } from './screens.jsx';

const homeStyles = {
  hero: {
    position: 'relative',
    paddingTop: 80,
    paddingBottom: 80,
    overflow: 'hidden',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 48,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  badges: {
    display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 32,
  },
};

// All user-visible strings for the home page. Technical/product terms (Envoy, xDS,
// GSLB, WAF, Kubernetes, Registry, Controller, Control-Plane, category filter keys…)
// are intentionally kept in English in both locales. `cats`/`shots[].cat` are stable
// filter identifiers (compared against the hardcoded 'All' sentinel), so they stay in
// English in both locales.
const STR = {
  en: {
    // Hero
    heroEyebrow: 'TRAFFIC MANAGEMENT & API SECURITY',
    heroH1a: 'Manage Traffic at',
    heroH1b: 'enterprise scale.',
    heroPara1: 'A visual control plane for your entire Envoy fleet — full xDS config, GSLB, and certificates — with ',
    heroParaStrong1: 'edge API security',
    heroPara2: ' and traffic-derived',
    heroParaStrong2: ' API discovery',
    heroPara3: ' built in. Scalable, automated, enterprise-ready.',
    heroBtnDemo: 'Get Started →',
    heroBtnArch: 'View architecture',
    heroBadges: [
      ['3-Process', 'Distributed Architecture'],
      ['Full xDS', 'Protocol Support'],
      ['Multi-Version', 'Proxy & Upgrade'],
      ['Real-time', 'Validation'],
    ],

    // Logos
    logosLabel: 'TRUSTED INTEGRATIONS',
    logosItems: ['Kubernetes', 'Envoy', 'Grafana', 'OpenStack', 'LDAP / AD', 'Let\'s Encrypt', 'OpenRouter'],

    // Features
    featuresEyebrow: 'CORE FEATURES',
    featuresH2a: 'Everything you need.',
    featuresH2b: "Nothing you don't.",
    featuresIntro: 'Comprehensive platform for enterprise proxy management with modern UI and powerful automation.',
    features: [
      { t: 'Proto-Driven Configuration', d: 'Typed models and field metadata are generated from each Envoy version\'s protobufs. Listeners, Clusters, Endpoints, Routes — with full TypeScript safety.', icon: 'proto' },
      { t: 'Interactive Dependency Graphs', d: 'Interactive visual diagrams display relationships between Envoy resources. Understand data flow and troubleshoot interactively.', icon: 'graph' },
      { t: 'Shield — Edge API Security', d: 'A per-edge ext_proc sidecar that enforces API security in the request path: WAF (OWASP CRS), authentication, rate limiting, and bot defense — twelve engines plus built-in DLP, rolled out safely from detect to block.', icon: 'lock' },
      { t: 'API Discovery & Inventory', d: 'Turn live traffic into a continuously-scored inventory of every API you expose — shadow endpoints, missing auth, PII leaks, enumeration — check it against your OpenAPI specs and export it as OpenAPI.', icon: 'graph' },
      { t: 'Quick Start Scenarios', d: 'Guided wizards that build a complete set of resources for common setups, such as an HTTP or TCP proxy, plus your own reusable scenarios.', icon: 'spark' },
      { t: 'Lightweight Edge Agent', d: 'A lightweight agent on every edge host. Auto-registration, health monitoring, log export to Syslog/ELK.', icon: 'agent' },
      { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS). Delta xDS for efficient updates.', icon: 'xds' },
      { t: 'Two-Step Validation', d: 'Validation in the editor and again on the server ensures configurations are correct before deployment.', icon: 'check' },
      { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically. Every change is recorded in the audit log.', icon: 'flow' },
      { t: 'Multi-Version Envoy Support', d: 'Manage multiple Envoy versions from a single interface. Intelligent version routing with seamless migration X → Y.', icon: 'version' },
      { t: 'Project-Based Multi-Tenancy', d: 'Organize configurations by teams, environments, or customers. 4-tier RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
    ],

    // Comparison
    cmpEyebrow: 'WHY ELCHI',
    cmpH2a: 'Built for the work,',
    cmpH2b: 'not the workaround.',
    cmpIntro: 'See how Elchi compares to hand-written Envoy configuration and to a service mesh.',
    cmpHeadFeature: 'Feature',
    cmpHeadElchi: 'Elchi',
    cmpHeadManual: 'Manual Config',
    cmpHeadMesh: 'Service Mesh',
    cmpRows: [
      { f: 'AI-Assisted Configuration Analysis', e: true, m: false, s: 'basic', sub: 'On-demand review of a resource and its dependencies' },
      { f: 'Proto-Driven Configuration UI', e: true, m: false, s: false, sub: 'Typed models generated per Envoy version' },
      { f: 'Multi-Version Envoy Support', e: true, m: false, s: 'partial', sub: 'Single interface, version routing' },
      { f: '3-Process Distributed Architecture', e: true, m: false, s: false, sub: 'Registry, Controller, Control-Plane' },
      { f: 'Real-time Configuration Validation', e: true, m: false, s: 'basic', sub: 'Two-step validation before production' },
      { f: 'Kubernetes Discovery', e: true, m: false, s: true, sub: 'Endpoints synced from cluster node IPs' },
      { f: 'Visual Dependency Graphs', e: true, m: false, s: 'via add-ons', sub: 'Interactive resource graphs' },
      { f: 'Enterprise Multi-Tenancy', e: true, m: false, s: 'varies', sub: 'Project isolation, 4-tier RBAC' },
      { f: 'Envoy Version Upgrade', e: true, m: false, s: 'varies', sub: 'Move a listener to a new Envoy version' },
      { f: 'LDAP / AD Authentication', e: true, m: false, s: 'varies', sub: 'Central login against your directory' },
      { f: 'Log Export (Syslog / ELK)', e: true, m: false, s: 'varies', sub: 'External observability stack' },
      { f: 'Web Application Firewall (WAF)', e: true, m: false, s: 'via add-ons', sub: 'Integrated OWASP CRS' },
      { f: 'ACME Certificate Management', e: true, m: false, s: 'via add-ons', sub: 'Let\'s Encrypt + Google Trust' },
      { f: 'Global Server Load Balancing', e: true, m: false, s: false, sub: 'DNS-based with health probing' },
      { f: 'API Discovery & Inventory', e: true, m: false, s: false, sub: 'Auto-discovered surface, risk & PII scoring' },
      { f: 'Shield — Edge API Security', e: true, m: false, s: false, sub: 'ext_proc WAF/auth/rate-limit, 12 engines + built-in DLP' },
    ],
    cmpUnique: [
      ['AI-Assisted Analysis', 'On-demand AI review of configuration and logs, with your own OpenRouter key.'],
      ['Proto-Driven Models', 'Typed models and field metadata come from each Envoy version\'s protos, so the editors follow the Envoy API closely.'],
      ['Version Routing', 'Each Envoy is served by the control plane of its own version.'],
      ['Enterprise Ready', 'Built from the ground up for multi-tenancy, RBAC, two-factor authentication and a complete audit trail.'],
      ['Seamless Upgrades', 'Move a listener and its resources to a new Envoy version and cut over with a hot restart, without dropped requests.'],
      ['Enterprise Auth', 'LDAP / AD integration for centralized authentication and authorization.'],
      ['Log Centralization', 'Ship logs with Filebeat to Elasticsearch or Logstash, or through rsyslog.'],
      ['Advanced Metrics', 'Built-in dashboards with Grafana integration for comprehensive monitoring.'],
    ],

    // Screenshots
    ssEyebrow: 'PLATFORM SCREENSHOTS',
    ssH2a: 'Designed for the operator,',
    ssH2b: 'built for the platform team.',
    ssIntro: 'Captured from a live environment — real Envoy traffic, Shield blocks and discovered APIs. Drag the slider to see each screen in light and dark.',

    // Architecture (3-process)
    archEyebrow: '3-PROCESS ARCHITECTURE',
    archH2a: 'Three processes.',
    archH2b: 'One coherent platform.',
    archIntro: 'Enterprise-grade scalability with specialized microservices working in harmony.',
    archProc: [
      { name: 'Registry', port: 'routing', accent: '#22d3ee', desc: 'Service discovery and routing hub',
        items: ['Controller registration', 'Client location tracking', 'Version-based routing', 'Automatic cleanup'] },
      { name: 'Controller', port: 'API', accent: '#a78bfa', desc: 'API and management layer',
        items: ['Client management & dispatch', 'xDS resources (CDS, LDS, RDS, EDS)', 'RBAC & authentication', 'Persistent config store', 'AI config analysis', 'K8s discovery'] },
      { name: 'Control-Plane', port: 'xDS', accent: '#60a5fa', desc: 'xDS control plane',
        items: ['Client ADS', 'VHDS (Virtual Host Discovery)', 'Snapshot management', 'Live updates', 'Auto-registration', 'Health & keepalive'] },
    ],
    archHa: [
      ['High Availability', 'Multiple control-plane instances with automatic failover, and active/passive edge pairs that share VIPs'],
      ['Scalability', 'Load balancing across controllers and control-planes for enterprise workloads'],
      ['Version Routing', 'Intelligent routing to appropriate control-plane versions based on client requirements'],
    ],

    // Use cases
    ucEyebrow: 'USE CASES',
    ucH2: 'Versatile by design.',
    ucIntro: 'Versatile platform designed for diverse deployment scenarios.',
    ucCases: [
      { t: 'API Gateway Management', d: 'Centralized management of clients as an API gateway for microservices architectures.', list: ['Rate limiting & traffic control','Authentication & authorization','Request/response transformation','API versioning & routing'] },
      { t: 'Load Balancing & Traffic Steering', d: 'Run Envoy fleets as load balancers in front of your services, with health checks and controlled rollouts.', list: ['Weighted traffic splitting & canary','Circuit breaking, retries & outlier detection','Active health checks','Metrics & live traffic view'] },
      { t: 'Multi-Site & Multi-Cluster Backends', d: 'Put edge fleets in front of several sites and Kubernetes clusters, managed from one control plane.', list: ['Kubernetes node discovery per cluster','GSLB failover between sites','Active/passive edge HA pairs','Unified policy enforcement'] },
      { t: 'Enterprise Microservices', d: 'Enterprise-grade client management with multi-tenancy and role-based access control.', list: ['Team-based config isolation','Complete audit trail','Centralized policy management','Self-service configuration'] },
      { t: 'Cloud-Native Applications', d: 'Run the control plane on Kubernetes and keep the edge proxies in step with your clusters.', list: ['Control plane on Kubernetes via Helm','Kubernetes node discovery','Zero-downtime listener upgrades','Health checking & monitoring'] },
      { t: 'Edge Proxy & Ingress', d: 'Run Envoy at the edge to terminate TLS, protect incoming traffic and route it.', list: ['SSL/TLS termination with ACME certificates','Rate limits & connection limits','Bot & IP-reputation blocking (Shield)','Region-scoped DNS answers with GSLB'] },
    ],

    // Industries
    indLabel: 'BUILT FOR',
    indItems: ['Financial Services','E-Commerce','Healthcare','Technology','Telecommunications','Media & Entertainment'],
    indNote: 'Whatever your use case, Elchi provides the flexibility and power you need.',

    // Final CTA
    ctaEyebrow: 'EXPERIENCE ELCHI NOW',
    ctaH2a: 'Ready to simplify your',
    ctaH2b: 'client management?',
    ctaIntro: 'Try the stack solution for proxy management with our demo, or deploy to your Kubernetes cluster using our Helm chart.',
    ctaBtnDemo: 'Contact us',
    ctaBtnHelm: 'Helm Charts',
    ctaBadges: ['Ready To Use','Self-Hosted','Multi-Version Proxy','Agent Support'],
  },

  tr: {
    // Hero
    heroEyebrow: 'TRAFİK YÖNETİMİ VE API GÜVENLİĞİ',
    heroH1a: 'Trafiği yönetin,',
    heroH1b: 'kurumsal ölçekte.',
    heroPara1: 'Tüm Envoy filonuz için görsel bir control plane — tam xDS yapılandırması, GSLB ve sertifikalar — üstelik ',
    heroParaStrong1: 'edge API güvenliği',
    heroPara2: ' ve trafikten türetilen',
    heroParaStrong2: ' API keşfi',
    heroPara3: ' yerleşik olarak. Ölçeklenebilir, otomatik ve kurumsala hazır.',
    heroBtnDemo: 'Başlayın →',
    heroBtnArch: 'Mimariyi görün',
    heroBadges: [
      ['3 Süreç', 'Dağıtık Mimari'],
      ['Tam xDS', 'Protokol Desteği'],
      ['Çok Sürümlü', 'Proxy ve Yükseltme'],
      ['Gerçek Zamanlı', 'Doğrulama'],
    ],

    // Logos
    logosLabel: 'GÜVENİLİR ENTEGRASYONLAR',
    logosItems: ['Kubernetes', 'Envoy', 'Grafana', 'OpenStack', 'LDAP / AD', 'Let\'s Encrypt', 'OpenRouter'],

    // Features
    featuresEyebrow: 'TEMEL ÖZELLİKLER',
    featuresH2a: 'İhtiyacınız olan her şey.',
    featuresH2b: 'Fazlası değil.',
    featuresIntro: 'Modern arayüz ve güçlü otomasyonla kurumsal proxy yönetimi için kapsamlı bir platform.',
    features: [
      { t: 'Proto Tabanlı Yapılandırma', d: 'Tipli modeller ve alan meta verileri her Envoy sürümünün protobuf tanımlarından üretilir. Listener, Cluster, Endpoint, Route — tam TypeScript güvenliğiyle.', icon: 'proto' },
      { t: 'Etkileşimli Bağımlılık Grafikleri', d: 'Envoy kaynakları arasındaki ilişkileri gösteren etkileşimli görsel diyagramlar. Veri akışını anlayın ve etkileşimli olarak sorun giderin.', icon: 'graph' },
      { t: 'Shield — Edge API Güvenliği', d: 'Request path’inde API güvenliğini uygulayan, her edge’de çalışan bir ext_proc sidecar: WAF (OWASP CRS), kimlik doğrulama, rate limiting ve bot savunması — on iki motor artı yerleşik DLP, detect’ten block’a güvenle devreye alınır.', icon: 'lock' },
      { t: 'API Keşfi ve Envanteri', d: 'Canlı trafiği, sunduğunuz her API’nin sürekli puanlanan bir envanterine dönüştürün — shadow endpoint’ler, eksik kimlik doğrulama, PII sızıntıları, numaralandırma — OpenAPI spec’lerinizle karşılaştırın ve OpenAPI olarak dışa aktarın.', icon: 'graph' },
      { t: 'Hızlı Başlangıç Senaryoları', d: 'HTTP veya TCP proxy gibi yaygın kurulumlar için eksiksiz kaynak setini adım adım oluşturan sihirbazlar; kendi senaryolarınızı da kaydedip yeniden kullanın.', icon: 'spark' },
      { t: 'Hafif Edge Agent', d: 'Her edge host’ta çalışan hafif bir agent. Otomatik kayıt, sağlık izleme, Syslog/ELK’ye log aktarımı.', icon: 'agent' },
      { t: 'Tam xDS Protokol Desteği', d: 'xDS’in (ADS, CDS, EDS, LDS, RDS, VHDS) eksiksiz uygulaması. Verimli güncellemeler için Delta xDS.', icon: 'xds' },
      { t: 'İki Aşamalı Doğrulama', d: 'Editörde ve ardından sunucuda yapılan doğrulama, yapılandırmaların dağıtımdan önce doğru olmasını sağlar.', icon: 'check' },
      { t: 'Kaydet ve Yayınla Akışı', d: 'Güvenli yapılandırma değişiklikleri için taslak modu. Adım adım kaydedin ve toplu güncellemeleri atomik olarak yayınlayın. Her değişiklik denetim kaydına yazılır.', icon: 'flow' },
      { t: 'Çok Sürümlü Envoy Desteği', d: 'Birden fazla Envoy sürümünü tek bir arayüzden yönetin. Sorunsuz X → Y geçişiyle akıllı sürüm yönlendirmesi.', icon: 'version' },
      { t: 'Proje Bazlı Çok Kiracılılık', d: 'Yapılandırmaları ekiplere, ortamlara veya müşterilere göre düzenleyin. 4 katmanlı RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
    ],

    // Comparison
    cmpEyebrow: 'NEDEN ELCHI',
    cmpH2a: 'Çözüm için tasarlandı,',
    cmpH2b: 'geçici çözümler için değil.',
    cmpIntro: 'Elchi’nin elle yazılan Envoy yapılandırması ve bir service mesh ile nasıl karşılaştırıldığını görün.',
    cmpHeadFeature: 'Özellik',
    cmpHeadElchi: 'Elchi',
    cmpHeadManual: 'Manuel Yapılandırma',
    cmpHeadMesh: 'Service Mesh',
    cmpRows: [
      { f: 'AI Destekli Yapılandırma Analizi', e: true, m: false, s: 'temel', sub: 'Bir kaynağın ve bağımlılıklarının istek üzerine incelenmesi' },
      { f: 'Proto Tabanlı Yapılandırma Arayüzü', e: true, m: false, s: false, sub: 'Her Envoy sürümü için üretilen tipli modeller' },
      { f: 'Çok Sürümlü Envoy Desteği', e: true, m: false, s: 'kısmi', sub: 'Tek arayüz, sürüm yönlendirme' },
      { f: '3 Süreçli Dağıtık Mimari', e: true, m: false, s: false, sub: 'Registry, Controller, Control-Plane' },
      { f: 'Gerçek Zamanlı Yapılandırma Doğrulaması', e: true, m: false, s: 'temel', sub: 'Üretimden önce iki aşamalı doğrulama' },
      { f: 'Kubernetes Keşfi', e: true, m: false, s: true, sub: 'Cluster node IP’lerinden endpoint senkronizasyonu' },
      { f: 'Görsel Bağımlılık Grafikleri', e: true, m: false, s: 'eklentiyle', sub: 'Etkileşimli kaynak grafikleri' },
      { f: 'Kurumsal Çok Kiracılılık', e: true, m: false, s: 'değişken', sub: 'Proje izolasyonu, 4 katmanlı RBAC' },
      { f: 'Envoy Sürüm Yükseltme', e: true, m: false, s: 'değişken', sub: 'Bir listener’ı yeni Envoy sürümüne taşıyın' },
      { f: 'LDAP / AD Kimlik Doğrulama', e: true, m: false, s: 'değişken', sub: 'Dizininize karşı merkezi giriş' },
      { f: 'Log Aktarımı (Syslog / ELK)', e: true, m: false, s: 'değişken', sub: 'Harici observability yığını' },
      { f: 'Web Application Firewall (WAF)', e: true, m: false, s: 'eklentiyle', sub: 'Entegre OWASP CRS' },
      { f: 'ACME Sertifika Yönetimi', e: true, m: false, s: 'eklentiyle', sub: 'Let\'s Encrypt + Google Trust' },
      { f: 'Global Server Load Balancing', e: true, m: false, s: false, sub: 'Sağlık kontrollü, DNS tabanlı' },
      { f: 'API Keşfi ve Envanteri', e: true, m: false, s: false, sub: 'Otomatik keşfedilen yüzey, risk ve PII puanlaması' },
      { f: 'Shield — Edge API Güvenliği', e: true, m: false, s: false, sub: 'ext_proc WAF/auth/rate-limit, 12 motor + yerleşik DLP' },
    ],
    cmpUnique: [
      ['AI Destekli Analiz', 'Kendi OpenRouter anahtarınızla yapılandırma ve logların istek üzerine AI incelemesi.'],
      ['Proto Tabanlı Modeller', 'Tipli modeller ve alan meta verileri her Envoy sürümünün proto’larından gelir; editörler Envoy API’sini yakından izler.'],
      ['Sürüm Yönlendirme', 'Her Envoy, kendi sürümünün control plane’inden beslenir.'],
      ['Kurumsala Hazır', 'Çok kiracılılık, RBAC, iki faktörlü kimlik doğrulama ve eksiksiz denetim kaydı için baştan tasarlandı.'],
      ['Sorunsuz Yükseltmeler', 'Bir listener’ı ve kaynaklarını yeni Envoy sürümüne taşıyın, hot restart ile istek kaybetmeden geçin.'],
      ['Kurumsal Kimlik Doğrulama', 'Merkezi kimlik doğrulama ve yetkilendirme için LDAP / AD entegrasyonu.'],
      ['Log Merkezileştirme', 'Logları Filebeat ile Elasticsearch veya Logstash’e ya da rsyslog üzerinden gönderin.'],
      ['Gelişmiş Metrikler', 'Kapsamlı izleme için Grafana entegrasyonlu yerleşik dashboard’lar.'],
    ],

    // Screenshots
    ssEyebrow: 'PLATFORM EKRAN GÖRÜNTÜLERİ',
    ssH2a: 'Operatör için tasarlandı,',
    ssH2b: 'platform ekibi için inşa edildi.',
    ssIntro: 'Canlı bir ortamdan alındı — gerçek Envoy trafiği, Shield engellemeleri ve keşfedilen API’ler. Her ekranı açık ve koyu temada görmek için kaydırıcıyı sürükleyin.',

    // Architecture (3-process)
    archEyebrow: '3 SÜREÇLİ MİMARİ',
    archH2a: 'Üç süreç.',
    archH2b: 'Tek tutarlı platform.',
    archIntro: 'Uyum içinde çalışan özelleşmiş mikroservislerle kurumsal düzeyde ölçeklenebilirlik.',
    archProc: [
      { name: 'Registry', port: 'routing', accent: '#22d3ee', desc: 'Servis keşfi ve yönlendirme merkezi',
        items: ['Controller kaydı', 'Client konum takibi', 'Sürüm tabanlı yönlendirme', 'Otomatik temizleme'] },
      { name: 'Controller', port: 'API', accent: '#a78bfa', desc: 'API ve yönetim katmanı',
        items: ['Client yönetimi ve dağıtımı', 'xDS kaynakları (CDS, LDS, RDS, EDS)', 'RBAC ve kimlik doğrulama', 'Kalıcı yapılandırma deposu', 'AI yapılandırma analizi', 'K8s keşfi'] },
      { name: 'Control-Plane', port: 'xDS', accent: '#60a5fa', desc: 'xDS control plane',
        items: ['Client ADS', 'VHDS (Virtual Host Discovery)', 'Snapshot yönetimi', 'Canlı güncellemeler', 'Otomatik kayıt', 'Sağlık ve keepalive'] },
    ],
    archHa: [
      ['Yüksek Erişilebilirlik', "Otomatik failover'lı birden fazla control plane örneği ve VIP paylaşan aktif/pasif edge çiftleri"],
      ['Ölçeklenebilirlik', 'Kurumsal iş yükleri için controller ve control plane’ler arasında load balancing'],
      ['Sürüm Yönlendirme', 'Client gereksinimlerine göre uygun control plane sürümlerine akıllı yönlendirme'],
    ],

    // Use cases
    ucEyebrow: 'KULLANIM SENARYOLARI',
    ucH2: 'Tasarımı gereği çok yönlü.',
    ucIntro: 'Farklı dağıtım senaryoları için tasarlanmış çok yönlü platform.',
    ucCases: [
      { t: 'API Gateway Yönetimi', d: 'Mikroservis mimarileri için client’ları bir API gateway olarak merkezi yönetim.', list: ['Rate limiting ve trafik kontrolü','Kimlik doğrulama ve yetkilendirme','Request/response dönüşümü','API sürümleme ve yönlendirme'] },
      { t: 'Load Balancing ve Trafik Yönlendirme', d: 'Envoy filolarını servislerinizin önünde sağlık kontrollü ve kontrollü geçişli load balancer olarak çalıştırın.', list: ['Ağırlıklı trafik bölme ve canary','Circuit breaking, yeniden deneme ve outlier detection','Aktif sağlık kontrolleri','Metrikler ve canlı trafik görünümü'] },
      { t: 'Çok Lokasyonlu ve Çok Cluster’lı Backend’ler', d: 'Edge filolarını birden fazla lokasyonun ve Kubernetes cluster’ının önüne koyun, tek control plane’den yönetin.', list: ['Cluster başına Kubernetes node keşfi','Lokasyonlar arası GSLB failover','Aktif/pasif edge HA çiftleri','Birleşik politika uygulama'] },
      { t: 'Kurumsal Mikroservisler', d: 'Çok kiracılılık ve rol tabanlı erişim kontrolüyle kurumsal düzeyde client yönetimi.', list: ['Ekip bazlı yapılandırma izolasyonu','Eksiksiz denetim kaydı','Merkezi politika yönetimi','Self-servis yapılandırma'] },
      { t: 'Cloud-Native Uygulamalar', d: 'Control plane’i Kubernetes’te çalıştırın, edge proxy’leri cluster’larınızla senkron tutun.', list: ['Helm ile Kubernetes’te control plane','Kubernetes node keşfi','Kesintisiz listener yükseltmeleri','Sağlık kontrolü ve izleme'] },
      { t: 'Edge Proxy ve Ingress', d: 'Envoy’u edge’de çalıştırarak TLS’i sonlandırın, gelen trafiği koruyun ve yönlendirin.', list: ['ACME sertifikalarıyla SSL/TLS termination','Rate limit ve bağlantı limitleri','Bot ve IP itibarı engelleme (Shield)','GSLB ile bölgeye göre DNS yanıtları'] },
    ],

    // Industries
    indLabel: 'KİMLER İÇİN',
    indItems: ['Finansal Hizmetler','E-Ticaret','Sağlık','Teknoloji','Telekomünikasyon','Medya ve Eğlence'],
    indNote: 'Kullanım senaryonuz ne olursa olsun, Elchi ihtiyacınız olan esnekliği ve gücü sunar.',

    // Final CTA
    ctaEyebrow: 'ELCHI’Yİ ŞİMDİ DENEYİN',
    ctaH2a: 'Client yönetiminizi',
    ctaH2b: 'basitleştirmeye hazır mısınız?',
    ctaIntro: 'Proxy yönetimi için yığın çözümünü demomuzla deneyin veya Helm chart’ımızı kullanarak Kubernetes cluster’ınıza dağıtın.',
    ctaBtnDemo: 'Bize Ulaşın',
    ctaBtnHelm: 'Helm Charts',
    ctaBadges: ['Kullanıma Hazır','Kendi Altyapınızda','Çok Sürümlü Proxy','Agent Desteği'],
  },
};

function App() {
  return (
    <>
      <Nav active="home" />
      <Hero variant="flow" />
      <Logos />
      <ProductFamily />
      <FeaturesGrid />
      <Comparison />
      <ScreenshotsGallery />
      <Architecture3 />
      <UseCases />
      <Industries />
      <FinalCTA />
      <Footer />
    </>
  );
}

/* ====================== HERO ====================== */
function Hero({ variant }) {
  const t = STR[getLocale()];
  return (
    <section className="section hero" style={homeStyles.hero}>
      {/* aurora */}
      <div className="aurora" style={{ width: 700, height: 700, top: -200, right: -150, background: 'radial-gradient(closest-side, #c7d2fe, transparent)' }}></div>
      <div className="aurora" style={{ width: 600, height: 600, top: 100, left: -200, background: 'radial-gradient(closest-side, #bae6fd, transparent)', opacity: .4 }}></div>
      <div className="grid-bg"></div>

      <div className="container" style={{ position: 'relative' }}>
        <div className="hero-grid">
          <div className="fade-in">
            <span className="eyebrow">
              <span className="dot"></span>
              {t.heroEyebrow}
            </span>
            <h1 style={{ marginTop: 24 }}>
              {t.heroH1a} <br/>
              <span className="grad-text">{t.heroH1b}</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--slate-600)', marginTop: 24, maxWidth: 560 }}>
              {t.heroPara1}<strong>{t.heroParaStrong1}</strong>{t.heroPara2}
              <strong>{t.heroParaStrong2}</strong>{t.heroPara3}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <a href="/docs/getting-started/quickstart" className="btn btn-blue">{t.heroBtnDemo}</a>
              <a href={locHref('architecture')} className="btn btn-ghost">{t.heroBtnArch}</a>
            </div>
            <div style={homeStyles.badges}>
              {t.heroBadges.map(([k, v]) => (
                <div key={k} className="hero-badge">
                  <span className="hero-badge-key">{k}</span>
                  <span className="hero-badge-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual fade-in" style={{ animationDelay: '.1s' }}>
            {variant === 'flow' && <ArchDiagram />}
            {variant === 'orbit' && <ArchOrbit />}
            {variant === 'terminal' && <ArchTerminal />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ====================== LOGOS / TRUST ====================== */
function Logos() {
  const t = STR[getLocale()];
  const items = t.logosItems;
  return (
    <div className="logos-strip">
      <div className="container">
        <div className="logos-label mono">{t.logosLabel}</div>
        <div className="logos-marquee">
          <div className="logos-track">
            {[...items, ...items].map((it, i) => (
              <span key={i} className="logos-item">{it}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================== FEATURES GRID ====================== */
// ============== PRODUCT FAMILY ==============
// One card per licensed product; copy comes from products-data.js so the home
// page, nav dropdown, and product pages never drift apart.
const PF_STR = {
  en: {
    eyebrow: 'THE ELCHI PRODUCT FAMILY',
    h2a: 'One platform.',
    h2b: 'Five products.',
    intro: 'Start with Elchi Core — the complete Envoy management platform — and license security, discovery, and traffic products as you need them.',
    base: 'Base platform',
    addon: 'Add-on',
    learnMore: 'Learn more →',
    plansCta: 'See plans & licensing →',
  },
  tr: {
    eyebrow: 'ELCHI ÜRÜN AİLESİ',
    h2a: 'Tek platform.',
    h2b: 'Beş ürün.',
    intro: 'Eksiksiz Envoy yönetim platformu Elchi Core ile başlayın; güvenlik, keşif ve trafik ürünlerini ihtiyacınız oldukça lisanslayın.',
    base: 'Temel platform',
    addon: 'Eklenti',
    learnMore: 'İncele →',
    plansCta: 'Paketleri & lisanslamayı görün →',
  },
};

function ProductFamily() {
  const locale = getLocale();
  const t = PF_STR[locale];
  const slugs = ['core', 'api-security', 'api-discovery', 'gslb', 'waf'];
  return (
    <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.eyebrow}</span>
          <h2>{t.h2a}<br/>{t.h2b}</h2>
          <p>{t.intro}</p>
        </div>
        <div className="pf-grid">
          {slugs.map((slug) => {
            const p = PRODUCTS[slug];
            const pt = p[locale];
            const isCore = slug === 'core';
            return (
              <a key={slug} href={locHref(`products/${slug}`)} className={`card pf-card${isCore ? ' pf-card-core' : ''}`} style={isCore ? { borderColor: `${p.accent}55` } : {}}>
                <div className="pf-card-head">
                  <span className="pf-kind mono" style={isCore ? { color: p.accent, background: `${p.accent}14`, borderColor: `${p.accent}33` } : {}}>
                    {isCore ? t.base : t.addon}
                  </span>
                </div>
                <h3><span className="pf-dot" style={{ background: p.accent }}></span>{pt.metaName}</h3>
                <p>{pt.subtitle.length > 140 ? pt.subtitle.slice(0, 137) + '…' : pt.subtitle}</p>
                <span className="pf-more" style={{ color: p.accent }}>{t.learnMore}</span>
              </a>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href={locHref('plans')} className="btn btn-ghost">{t.plansCta}</a>
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const t = STR[getLocale()];
  const items = t.features;
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.featuresEyebrow}</span>
          <h2>{t.featuresH2a}<br/>{t.featuresH2b}</h2>
          <p>{t.featuresIntro}</p>
        </div>
        <div className="features-grid">
          {items.map((it, i) => (
            <div key={i} className="card feat-card">
              <div className="feat-icon"><FeatIcon name={it.icon}/></div>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatIcon({ name }) {
  const map = {
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
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none">{map[name]}</svg>;
}

/* ====================== COMPARISON ====================== */
function Comparison() {
  const t = STR[getLocale()];
  const rows = t.cmpRows;

  const Cell = ({ v }) => {
    if (v === true) return <span className="cmp-yes">✓</span>;
    if (v === false) return <span className="cmp-no">—</span>;
    return <span className="cmp-partial">{v}</span>;
  };

  return (
    <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.cmpEyebrow}</span>
          <h2>{t.cmpH2a}<br/>{t.cmpH2b}</h2>
          <p>{t.cmpIntro}</p>
        </div>

        <div className="cmp-table card" style={{ overflow: 'hidden' }}>
          <div className="cmp-row cmp-head">
            <div className="cmp-feat">{t.cmpHeadFeature}</div>
            <div className="cmp-col cmp-elchi">{t.cmpHeadElchi}</div>
            <div className="cmp-col">{t.cmpHeadManual}</div>
            <div className="cmp-col">{t.cmpHeadMesh}</div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="cmp-row">
              <div className="cmp-feat">
                <div style={{ fontWeight: 500 }}>{r.f}</div>
                <div style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 2 }}>{r.sub}</div>
              </div>
              <div className="cmp-col cmp-elchi"><Cell v={r.e}/></div>
              <div className="cmp-col"><Cell v={r.m}/></div>
              <div className="cmp-col"><Cell v={r.s}/></div>
            </div>
          ))}
        </div>

        <div className="unique-grid" style={{ marginTop: 64 }}>
          {t.cmpUnique.map(([ut, d], i) => (
            <div key={i} className="unique-cell">
              <div className="unique-num mono">{String(i+1).padStart(2,'0')}</div>
              <h4>{ut}</h4>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ====================== SCREENSHOTS GALLERY ====================== */
function ScreenshotsGallery() {
  const t = STR[getLocale()];
  return <ScreenGallery eyebrow={t.ssEyebrow} title1={t.ssH2a} title2={t.ssH2b} intro={t.ssIntro}/>;
}

/* ====================== 3-PROCESS ARCHITECTURE ====================== */
function Architecture3() {
  const t = STR[getLocale()];
  return (
    <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div className="dot-bg" style={{ opacity: 0.2 }}></div>
      <div className="aurora" style={{ width: 600, height: 600, top: -100, right: -100, background: 'radial-gradient(closest-side, #1d4ed8, transparent)', opacity: 0.4 }}></div>

      <div className="container" style={{ position: 'relative' }}>
        <div className="section-head">
          <span className="eyebrow" style={{ background: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.3)', color: '#93c5fd' }}>
            <span className="dot"></span>{t.archEyebrow}
          </span>
          <h2 style={{ color: 'white' }}>{t.archH2a}<br/>{t.archH2b}</h2>
          <p style={{ color: '#94a3b8' }}>{t.archIntro}</p>
        </div>

        <div className="proc-grid">
          {t.archProc.map((p, i) => (
            <div key={i} className="proc-card">
              <div className="proc-head">
                <span className="proc-dot" style={{ background: p.accent, boxShadow: `0 0 14px ${p.accent}` }}></span>
                <span className="proc-name">{p.name}</span>
                <span className="mono proc-port">{p.port}</span>
              </div>
              <p className="proc-desc">{p.desc}</p>
              <ul>
                {p.items.map((it, j) => (
                  <li key={j}>
                    <span className="proc-tick" style={{ color: p.accent }}>›</span> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ha-grid">
          {t.archHa.map(([ht, d], i) => (
            <div key={i} className="ha-cell">
              <h4>{ht}</h4>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ====================== USE CASES ====================== */
function UseCases() {
  const t = STR[getLocale()];
  const cases = t.ucCases;
  return (
    <section className="section" id="use-cases">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.ucEyebrow}</span>
          <h2>{t.ucH2}</h2>
          <p>{t.ucIntro}</p>
        </div>
        <div className="uc-grid">
          {cases.map((c, i) => (
            <div key={i} className="uc-card card">
              <div className="uc-num mono">{String(i+1).padStart(2, '0')}</div>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
              <ul>
                {c.list.map((it, j) => (
                  <li key={j}><span>›</span> {it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ====================== INDUSTRIES ====================== */
function Industries() {
  const t = STR[getLocale()];
  const items = t.indItems;
  return (
    <section className="section-tight" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--slate-500)', marginBottom: 24 }}>
          {t.indLabel}
        </div>
        <div className="ind-row">
          {items.map(it => (
            <div key={it} className="ind-item">{it}</div>
          ))}
        </div>
        <p style={{ marginTop: 28, color: 'var(--slate-500)' }}>
          {t.indNote}
        </p>
      </div>
    </section>
  );
}

/* ====================== FINAL CTA ====================== */
function FinalCTA() {
  const t = STR[getLocale()];
  return (
    <section className="section">
      <div className="container">
        <div className="cta-card">
          <div className="grid-bg" style={{ opacity: .4 }}></div>
          <div style={{ position: 'relative' }}>
            <span className="eyebrow"><span className="dot"></span>{t.ctaEyebrow}</span>
            <h2 style={{ marginTop: 16, marginBottom: 16 }}>
              {t.ctaH2a}<br/>{t.ctaH2b}
            </h2>
            <p style={{ fontSize: 18, color: 'var(--slate-600)', maxWidth: 600 }}>
              {t.ctaIntro}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <a href={locHref('contact')} className="btn btn-blue">{t.ctaBtnDemo}</a>
              <a href="https://charts.elchi.io" target="_blank" rel="noopener" className="btn btn-ghost">{t.ctaBtnHelm}</a>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 36, flexWrap: 'wrap' }}>
              {t.ctaBadges.map(bt => (
                <span key={bt} style={{ fontSize: 14, color: 'var(--slate-700)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</span>
                  {bt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const Page = App;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
