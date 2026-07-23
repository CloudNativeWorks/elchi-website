import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { getLocale, locHref } from './i18n.js';
import { Nav, Footer } from './shared.jsx';
import { ArchDiagram, ArchOrbit, ArchTerminal } from './arch-diagram.jsx';

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
    heroBtnDemo: 'Try Demo →',
    heroBtnArch: 'View architecture',
    heroBadges: [
      ['3-Process', 'Distributed Architecture'],
      ['Full xDS', 'Protocol Support'],
      ['Multi-Version', 'Proxy & Upgrade'],
      ['Real-time', 'Validation'],
    ],

    // Logos
    logosLabel: 'TRUSTED INTEGRATIONS',
    logosItems: ['Kubernetes', 'Docker', 'gRPC', 'VictoriaMetrics', 'MongoDB', 'Grafana', 'OpenRouter'],

    // Features
    featuresEyebrow: 'CORE FEATURES',
    featuresH2a: 'Everything you need.',
    featuresH2b: "Nothing you don't.",
    featuresIntro: 'Comprehensive platform for enterprise proxy management with modern UI and powerful automation.',
    features: [
      { t: 'Proto to UI Auto-Generation', d: 'Automatically generates UI configuration components from client protobuf definitions. Listeners, Clusters, Endpoints, Routes — with full TypeScript safety.', icon: 'proto' },
      { t: 'Interactive Dependency Graphs', d: 'React Flow visual diagrams display relationships between Envoy resources. Understand data flow and troubleshoot interactively.', icon: 'graph' },
      { t: 'Shield — Edge API Security', d: 'A per-edge ext_proc sidecar that enforces API security in the request path: WAF (OWASP CRS), authentication, rate limiting, and bot defense — twelve engines plus built-in DLP, rolled out safely from detect to block.', icon: 'lock' },
      { t: 'API Discovery & Inventory', d: 'Turn live traffic into a continuously-scored inventory of every API you expose — shadow endpoints, missing auth, PII leaks — and export it as OpenAPI.', icon: 'graph' },
      { t: 'Quick Start Scenarios', d: 'Pre-built templates for common client configurations. Generate complete setups for API gateways, load balancers, and service mesh in clicks.', icon: 'spark' },
      { t: 'Go-Based Agent', d: 'Lightweight Go agent for client-side management. Auto-registration, health monitoring, log export to Syslog/ELK.', icon: 'agent' },
      { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS) using go-control-plane. Delta xDS for efficient updates.', icon: 'xds' },
      { t: 'Two-Step Validation', d: 'Frontend TypeScript validation and backend protoc-gen-validate ensures configurations are correct before deployment.', icon: 'check' },
      { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically. Rollback on demand.', icon: 'flow' },
      { t: 'Multi-Version Envoy Support', d: 'Manage multiple Envoy versions from a single interface. Intelligent version routing with seamless migration X → Y.', icon: 'version' },
      { t: 'Project-Based Multi-Tenancy', d: 'Organize configurations by teams, environments, or customers. 4-tier RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
    ],

    // Comparison
    cmpEyebrow: 'WHY ELCHI',
    cmpH2a: 'Built for the work,',
    cmpH2b: 'not the workaround.',
    cmpIntro: 'See how Elchi compares to manual client configuration and traditional service mesh solutions.',
    cmpHeadFeature: 'Feature',
    cmpHeadElchi: 'Elchi',
    cmpHeadManual: 'Manual Config',
    cmpHeadMesh: 'Service Mesh',
    cmpRows: [
      { f: 'Intelligent Configuration Analysis', e: true, m: false, s: false, sub: 'Automated config analysis with recommendations' },
      { f: 'Proto-to-UI Auto Generation', e: true, m: false, s: false, sub: 'UI auto-generated from client protobufs' },
      { f: 'Multi-Version Envoy Support', e: true, m: false, s: 'partial', sub: 'Single interface, version routing' },
      { f: '3-Process Distributed Architecture', e: true, m: false, s: false, sub: 'Registry, Controller, Control-Plane' },
      { f: 'Real-time Configuration Validation', e: true, m: false, s: 'basic', sub: 'Two-step validation before production' },
      { f: 'Kubernetes Auto-Discovery', e: true, m: false, s: true, sub: 'Real-time endpoint sync' },
      { f: 'Visual Dependency Graphs', e: true, m: false, s: 'limited', sub: 'React Flow, interactive' },
      { f: 'Enterprise Multi-Tenancy', e: true, m: false, s: 'varies', sub: 'Project isolation, 4-tier RBAC' },
      { f: 'Version Upgrade & Migration', e: true, m: false, s: false, sub: 'Migrate configs X → Y' },
      { f: 'LDAP / AD Authentication', e: true, m: false, s: 'varies', sub: 'Centralized SSO' },
      { f: 'Log Export (Syslog / ELK)', e: true, m: false, s: 'limited', sub: 'External observability stack' },
      { f: 'Web Application Firewall (WAF)', e: true, m: false, s: false, sub: 'Integrated OWASP CRS' },
      { f: 'ACME Certificate Management', e: true, m: false, s: 'limited', sub: 'Let\'s Encrypt + Google Trust' },
      { f: 'Global Server Load Balancing', e: true, m: false, s: false, sub: 'DNS-based with health probing' },
      { f: 'API Discovery & Inventory', e: true, m: false, s: false, sub: 'Auto-discovered surface, risk & PII scoring' },
      { f: 'Shield — Edge API Security', e: true, m: false, s: false, sub: 'ext_proc WAF/auth/rate-limit, 12 engines + built-in DLP' },
    ],
    cmpUnique: [
      ['Intelligent Automation', 'Advanced automated analysis for configuration optimization and intelligent log troubleshooting.'],
      ['Auto-Generated UI', 'Unique proto-to-UI generation means support for new client features without manual UI updates.'],
      ['Version Intelligence', 'Smart routing to appropriate control-plane versions based on client version.'],
      ['Enterprise Ready', 'Built from ground up for multi-tenancy, RBAC, and compliance requirements.'],
      ['Seamless Upgrades', 'Effortlessly upgrade between client versions with automated compatibility validation.'],
      ['Enterprise Auth', 'LDAP / AD integration for centralized authentication and authorization.'],
      ['Log Centralization', 'Export logs to Syslog and ELK stack for unified observability.'],
      ['Advanced Metrics', 'Built-in dashboards with Grafana integration for comprehensive monitoring.'],
    ],

    // Screenshots
    ssEyebrow: 'PLATFORM SCREENSHOTS',
    ssH2a: 'Designed for the operator,',
    ssH2b: 'built for the platform team.',
    ssIntro: "Explore Elchi's powerful interface designed for enterprise-grade proxy management.",
    ssCats: ['All','Management','Tools','Configuration','Monitoring','Visualization','Overview','AI','Security','Discovery','Documentation','Load Balancing'],
    ssShots: [
      { src: '/main.png',          cat: 'Overview',       title: 'Platform Overview',     desc: 'Complete overview of Elchi platform capabilities' },
      { src: '/service.png',       cat: 'Management',     title: 'Service Management',    desc: 'Manage your services and their configurations' },
      { src: '/configuration.png', cat: 'Configuration',  title: 'xDS Configuration',     desc: 'Comprehensive xDS protocol configuration interface' },
      { src: '/metric.png',        cat: 'Monitoring',     title: 'Metrics Dashboard',     desc: 'Real-time metrics visualization with ECharts' },
      { src: '/dependency.png',    cat: 'Visualization',  title: 'Dependency Graph',      desc: 'Interactive visual representation of dependencies' },
      { src: '/ai.png',            cat: 'AI',             title: 'AI Assistant',          desc: 'Intelligent configuration help with OpenRouter' },
      { src: '/filter.png',        cat: 'Tools',          title: 'Advanced Filters',      desc: 'Powerful filters to find and manage proxies' },
      { src: '/scenario.png',      cat: 'Configuration',  title: 'Scenario Workflows',    desc: 'Wizard-based configuration management' },
      { src: '/audit.png',         cat: 'Security',       title: 'Audit Trail',           desc: 'Complete audit logging for compliance' },
      { src: '/logs.png',          cat: 'Monitoring',     title: 'Log Viewer',            desc: 'Advanced log viewing and analysis' },
      { src: '/agent.png',         cat: 'Management',     title: 'Agent Management',      desc: 'Distribute configurations and manage agents' },
      { src: '/registry.png',      cat: 'Discovery',      title: 'Service Registry',      desc: 'Service discovery and registry management' },
      { src: '/routemap.png',      cat: 'Configuration',  title: 'Route Mapping',         desc: 'Visual route configuration and traffic flow' },
      { src: '/flow.png',          cat: 'Documentation',  title: 'Architecture Flow',     desc: 'Visual diagram of how Elchi works end-to-end' },
      { src: '/acme1.png',         cat: 'Security',       title: 'ACME Certificates',     desc: 'Automatic certificate management' },
      { src: '/gslb1.png',         cat: 'Load Balancing', title: 'GSLB Overview',         desc: 'Global Server Load Balancing dashboard' },
      { src: '/gslb2.png',         cat: 'Load Balancing', title: 'GSLB Health Checks',    desc: 'Configure health checks and failover policies' },
      { src: '/jobs.png',          cat: 'Management',     title: 'Background Jobs',       desc: 'Monitor and manage background processing' },
    ],

    // Architecture (3-process)
    archEyebrow: '3-PROCESS ARCHITECTURE',
    archH2a: 'Three processes.',
    archH2b: 'One coherent platform.',
    archIntro: 'Enterprise-grade scalability with specialized microservices working in harmony.',
    archProc: [
      { name: 'Registry', port: ':9090', accent: '#22d3ee', desc: 'Service discovery and routing hub',
        items: ['Controller registration', 'Client location tracking', 'Version-based routing', 'External processing', 'In-memory + auto-cleanup'] },
      { name: 'Controller', port: 'REST', accent: '#a78bfa', desc: 'REST API and management layer',
        items: ['Client management & dispatch', 'xDS resources (CDS, LDS, RDS, EDS)', 'JWT + RBAC auth', 'MongoDB integration', 'AI config analysis', 'K8s discovery'] },
      { name: 'Control-Plane', port: ':18000', accent: '#60a5fa', desc: 'gRPC-based xDS control plane',
        items: ['Client ADS', 'VHDS (Virtual Host Discovery)', 'Snapshot management', 'Bridge services', 'Auto-registration', 'Health & keepalive'] },
    ],
    archHa: [
      ['High Availability', 'Multiple control-plane instances with automatic failover and health monitoring'],
      ['Scalability', 'Load balancing across controllers and control-planes for enterprise workloads'],
      ['Version Routing', 'Intelligent routing to appropriate control-plane versions based on client requirements'],
    ],

    // Use cases
    ucEyebrow: 'USE CASES',
    ucH2: 'Versatile by design.',
    ucIntro: 'Versatile platform designed for diverse deployment scenarios.',
    ucCases: [
      { t: 'API Gateway Management', d: 'Centralized management of clients as an API gateway for microservices architectures.', list: ['Rate limiting & traffic control','Authentication & authorization','Request/response transformation','API versioning & routing'] },
      { t: 'Service Mesh Management', d: 'Deploy and manage clients as a service mesh data plane with centralized control.', list: ['Service-to-service communication','Traffic splitting & canary','Circuit breaking & retries','Observability & metrics'] },
      { t: 'Multi-Cluster Deployment', d: 'Manage client instances across multiple Kubernetes clusters with unified configuration.', list: ['Cross-cluster service discovery','Unified policy enforcement','Disaster recovery & failover','Global load balancing'] },
      { t: 'Enterprise Microservices', d: 'Enterprise-grade client management with multi-tenancy and role-based access control.', list: ['Team-based config isolation','Audit logging & compliance','Centralized policy management','Self-service configuration'] },
      { t: 'Cloud-Native Applications', d: 'Modern cloud-native applications leveraging clients for traffic management and observability.', list: ['Container-based deployments','Auto-scaling & load balancing','Zero-downtime deployments','Health checking & monitoring'] },
      { t: 'Edge Proxy & CDN', d: 'Deploy clients at the edge for content delivery and request routing.', list: ['Geographic traffic routing','Cache management','DDoS protection','SSL/TLS termination'] },
    ],

    // Industries
    indLabel: 'TRUSTED ACROSS INDUSTRIES',
    indItems: ['Financial Services','E-Commerce','Healthcare','Technology','Telecommunications','Media & Entertainment'],
    indNote: 'Whatever your use case, Elchi provides the flexibility and power you need.',

    // Final CTA
    ctaEyebrow: 'EXPERIENCE ELCHI NOW',
    ctaH2a: 'Ready to simplify your',
    ctaH2b: 'client management?',
    ctaIntro: 'Try the stack solution for proxy management with our demo, or deploy to your Kubernetes cluster using our Helm chart.',
    ctaBtnDemo: 'Try Demo',
    ctaBtnHelm: 'Helm Charts',
    ctaBadges: ['Ready To Use','MongoDB Store','Multi-Version Proxy','Agent Support'],
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
    heroBtnDemo: 'Demoyu Dene →',
    heroBtnArch: 'Mimariyi görün',
    heroBadges: [
      ['3 Süreç', 'Dağıtık Mimari'],
      ['Tam xDS', 'Protokol Desteği'],
      ['Çok Sürümlü', 'Proxy ve Yükseltme'],
      ['Gerçek Zamanlı', 'Doğrulama'],
    ],

    // Logos
    logosLabel: 'GÜVENİLİR ENTEGRASYONLAR',
    logosItems: ['Kubernetes', 'Docker', 'gRPC', 'VictoriaMetrics', 'MongoDB', 'Grafana', 'OpenRouter'],

    // Features
    featuresEyebrow: 'TEMEL ÖZELLİKLER',
    featuresH2a: 'İhtiyacınız olan her şey.',
    featuresH2b: 'Fazlası değil.',
    featuresIntro: 'Modern arayüz ve güçlü otomasyonla kurumsal proxy yönetimi için kapsamlı bir platform.',
    features: [
      { t: 'Proto’dan UI’ya Otomatik Üretim', d: 'Client protobuf tanımlarından UI yapılandırma bileşenlerini otomatik üretir. Listener, Cluster, Endpoint, Route — tam TypeScript güvenliğiyle.', icon: 'proto' },
      { t: 'Etkileşimli Bağımlılık Grafikleri', d: 'Envoy kaynakları arasındaki ilişkileri gösteren React Flow görsel diyagramları. Veri akışını anlayın ve etkileşimli olarak sorun giderin.', icon: 'graph' },
      { t: 'Shield — Edge API Güvenliği', d: 'Request path’inde API güvenliğini uygulayan, her edge’de çalışan bir ext_proc sidecar: WAF (OWASP CRS), kimlik doğrulama, rate limiting ve bot savunması — on iki motor artı yerleşik DLP, detect’ten block’a güvenle devreye alınır.', icon: 'lock' },
      { t: 'API Keşfi ve Envanteri', d: 'Canlı trafiği, sunduğunuz her API’nin sürekli puanlanan bir envanterine dönüştürün — shadow endpoint’ler, eksik kimlik doğrulama, PII sızıntıları — ve bunu OpenAPI olarak dışa aktarın.', icon: 'graph' },
      { t: 'Hızlı Başlangıç Senaryoları', d: 'Yaygın client yapılandırmaları için hazır şablonlar. API gateway, load balancer ve service mesh için eksiksiz kurulumları birkaç tıklamayla oluşturun.', icon: 'spark' },
      { t: 'Go Tabanlı Agent', d: 'Client tarafı yönetimi için hafif Go agent’ı. Otomatik kayıt, sağlık izleme, Syslog/ELK’ye log aktarımı.', icon: 'agent' },
      { t: 'Tam xDS Protokol Desteği', d: 'go-control-plane kullanarak xDS’in (ADS, CDS, EDS, LDS, RDS, VHDS) eksiksiz uygulaması. Verimli güncellemeler için Delta xDS.', icon: 'xds' },
      { t: 'İki Aşamalı Doğrulama', d: 'Frontend TypeScript doğrulaması ve backend protoc-gen-validate, yapılandırmaların dağıtımdan önce doğru olmasını sağlar.', icon: 'check' },
      { t: 'Kaydet ve Yayınla Akışı', d: 'Güvenli yapılandırma değişiklikleri için taslak modu. Adım adım kaydedin ve toplu güncellemeleri atomik olarak yayınlayın. İstediğinizde geri alın.', icon: 'flow' },
      { t: 'Çok Sürümlü Envoy Desteği', d: 'Birden fazla Envoy sürümünü tek bir arayüzden yönetin. Sorunsuz X → Y geçişiyle akıllı sürüm yönlendirmesi.', icon: 'version' },
      { t: 'Proje Bazlı Çok Kiracılılık', d: 'Yapılandırmaları ekiplere, ortamlara veya müşterilere göre düzenleyin. 4 katmanlı RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
    ],

    // Comparison
    cmpEyebrow: 'NEDEN ELCHI',
    cmpH2a: 'Çözüm için tasarlandı,',
    cmpH2b: 'geçici çözümler için değil.',
    cmpIntro: 'Elchi’nin manuel client yapılandırması ve geleneksel service mesh çözümleriyle nasıl karşılaştırıldığını görün.',
    cmpHeadFeature: 'Özellik',
    cmpHeadElchi: 'Elchi',
    cmpHeadManual: 'Manuel Yapılandırma',
    cmpHeadMesh: 'Service Mesh',
    cmpRows: [
      { f: 'Akıllı Yapılandırma Analizi', e: true, m: false, s: false, sub: 'Öneriler sunan otomatik yapılandırma analizi' },
      { f: 'Proto’dan UI’ya Otomatik Üretim', e: true, m: false, s: false, sub: 'Client protobuf’larından otomatik üretilen UI' },
      { f: 'Çok Sürümlü Envoy Desteği', e: true, m: false, s: 'kısmi', sub: 'Tek arayüz, sürüm yönlendirme' },
      { f: '3 Süreçli Dağıtık Mimari', e: true, m: false, s: false, sub: 'Registry, Controller, Control-Plane' },
      { f: 'Gerçek Zamanlı Yapılandırma Doğrulaması', e: true, m: false, s: 'temel', sub: 'Üretimden önce iki aşamalı doğrulama' },
      { f: 'Kubernetes Otomatik Keşfi', e: true, m: false, s: true, sub: 'Gerçek zamanlı endpoint senkronizasyonu' },
      { f: 'Görsel Bağımlılık Grafikleri', e: true, m: false, s: 'sınırlı', sub: 'React Flow, etkileşimli' },
      { f: 'Kurumsal Çok Kiracılılık', e: true, m: false, s: 'değişken', sub: 'Proje izolasyonu, 4 katmanlı RBAC' },
      { f: 'Sürüm Yükseltme ve Geçiş', e: true, m: false, s: false, sub: 'Yapılandırmaları X → Y taşıyın' },
      { f: 'LDAP / AD Kimlik Doğrulama', e: true, m: false, s: 'değişken', sub: 'Merkezi SSO' },
      { f: 'Log Aktarımı (Syslog / ELK)', e: true, m: false, s: 'sınırlı', sub: 'Harici observability yığını' },
      { f: 'Web Application Firewall (WAF)', e: true, m: false, s: false, sub: 'Entegre OWASP CRS' },
      { f: 'ACME Sertifika Yönetimi', e: true, m: false, s: 'sınırlı', sub: 'Let\'s Encrypt + Google Trust' },
      { f: 'Global Server Load Balancing', e: true, m: false, s: false, sub: 'Sağlık kontrollü, DNS tabanlı' },
      { f: 'API Keşfi ve Envanteri', e: true, m: false, s: false, sub: 'Otomatik keşfedilen yüzey, risk ve PII puanlaması' },
      { f: 'Shield — Edge API Güvenliği', e: true, m: false, s: false, sub: 'ext_proc WAF/auth/rate-limit, 12 motor + yerleşik DLP' },
    ],
    cmpUnique: [
      ['Akıllı Otomasyon', 'Yapılandırma optimizasyonu ve akıllı log sorun giderme için gelişmiş otomatik analiz.'],
      ['Otomatik Üretilen UI', 'Benzersiz proto’dan UI’ya üretim, yeni client özelliklerinin manuel UI güncellemesi olmadan desteklenmesi demektir.'],
      ['Sürüm Zekâsı', 'Client sürümüne göre uygun control plane sürümlerine akıllı yönlendirme.'],
      ['Kurumsala Hazır', 'Çok kiracılılık, RBAC ve uyumluluk gereksinimleri için baştan sona tasarlandı.'],
      ['Sorunsuz Yükseltmeler', 'Otomatik uyumluluk doğrulamasıyla client sürümleri arasında zahmetsizce yükseltin.'],
      ['Kurumsal Kimlik Doğrulama', 'Merkezi kimlik doğrulama ve yetkilendirme için LDAP / AD entegrasyonu.'],
      ['Log Merkezileştirme', 'Birleşik observability için logları Syslog ve ELK yığınına aktarın.'],
      ['Gelişmiş Metrikler', 'Kapsamlı izleme için Grafana entegrasyonlu yerleşik dashboard’lar.'],
    ],

    // Screenshots
    ssEyebrow: 'PLATFORM EKRAN GÖRÜNTÜLERİ',
    ssH2a: 'Operatör için tasarlandı,',
    ssH2b: 'platform ekibi için inşa edildi.',
    ssIntro: 'Kurumsal düzeyde proxy yönetimi için tasarlanan Elchi’nin güçlü arayüzünü keşfedin.',
    ssCats: ['All','Management','Tools','Configuration','Monitoring','Visualization','Overview','AI','Security','Discovery','Documentation','Load Balancing'],
    ssShots: [
      { src: '/main.png',          cat: 'Overview',       title: 'Platform Genel Bakışı',  desc: 'Elchi platform yeteneklerinin eksiksiz görünümü' },
      { src: '/service.png',       cat: 'Management',     title: 'Servis Yönetimi',        desc: 'Servislerinizi ve yapılandırmalarını yönetin' },
      { src: '/configuration.png', cat: 'Configuration',  title: 'xDS Yapılandırması',     desc: 'Kapsamlı xDS protokol yapılandırma arayüzü' },
      { src: '/metric.png',        cat: 'Monitoring',     title: 'Metrik Dashboard’u',     desc: 'ECharts ile gerçek zamanlı metrik görselleştirmesi' },
      { src: '/dependency.png',    cat: 'Visualization',  title: 'Bağımlılık Grafiği',     desc: 'Bağımlılıkların etkileşimli görsel temsili' },
      { src: '/ai.png',            cat: 'AI',             title: 'AI Asistanı',            desc: 'OpenRouter ile akıllı yapılandırma yardımı' },
      { src: '/filter.png',        cat: 'Tools',          title: 'Gelişmiş Filtreler',     desc: 'Proxy’leri bulmak ve yönetmek için güçlü filtreler' },
      { src: '/scenario.png',      cat: 'Configuration',  title: 'Senaryo Akışları',       desc: 'Sihirbaz tabanlı yapılandırma yönetimi' },
      { src: '/audit.png',         cat: 'Security',       title: 'Denetim İzi',            desc: 'Uyumluluk için eksiksiz denetim kaydı' },
      { src: '/logs.png',          cat: 'Monitoring',     title: 'Log Görüntüleyici',      desc: 'Gelişmiş log görüntüleme ve analiz' },
      { src: '/agent.png',         cat: 'Management',     title: 'Agent Yönetimi',         desc: 'Yapılandırmaları dağıtın ve agent’ları yönetin' },
      { src: '/registry.png',      cat: 'Discovery',      title: 'Servis Registry’si',     desc: 'Servis keşfi ve registry yönetimi' },
      { src: '/routemap.png',      cat: 'Configuration',  title: 'Route Eşleme',           desc: 'Görsel route yapılandırması ve trafik akışı' },
      { src: '/flow.png',          cat: 'Documentation',  title: 'Mimari Akışı',           desc: 'Elchi’nin uçtan uca nasıl çalıştığını gösteren görsel diyagram' },
      { src: '/acme1.png',         cat: 'Security',       title: 'ACME Sertifikaları',     desc: 'Otomatik sertifika yönetimi' },
      { src: '/gslb1.png',         cat: 'Load Balancing', title: 'GSLB Genel Bakışı',      desc: 'Global Server Load Balancing dashboard’u' },
      { src: '/gslb2.png',         cat: 'Load Balancing', title: 'GSLB Sağlık Kontrolleri', desc: 'Sağlık kontrollerini ve failover politikalarını yapılandırın' },
      { src: '/jobs.png',          cat: 'Management',     title: 'Arka Plan İşleri',       desc: 'Arka plan işlemeyi izleyin ve yönetin' },
    ],

    // Architecture (3-process)
    archEyebrow: '3 SÜREÇLİ MİMARİ',
    archH2a: 'Üç süreç.',
    archH2b: 'Tek tutarlı platform.',
    archIntro: 'Uyum içinde çalışan özelleşmiş mikroservislerle kurumsal düzeyde ölçeklenebilirlik.',
    archProc: [
      { name: 'Registry', port: ':9090', accent: '#22d3ee', desc: 'Servis keşfi ve yönlendirme merkezi',
        items: ['Controller kaydı', 'Client konum takibi', 'Sürüm tabanlı yönlendirme', 'External processing', 'Bellek içi + otomatik temizleme'] },
      { name: 'Controller', port: 'REST', accent: '#a78bfa', desc: 'REST API ve yönetim katmanı',
        items: ['Client yönetimi ve dağıtımı', 'xDS kaynakları (CDS, LDS, RDS, EDS)', 'JWT + RBAC kimlik doğrulama', 'MongoDB entegrasyonu', 'AI yapılandırma analizi', 'K8s keşfi'] },
      { name: 'Control-Plane', port: ':18000', accent: '#60a5fa', desc: 'gRPC tabanlı xDS control plane',
        items: ['Client ADS', 'VHDS (Virtual Host Discovery)', 'Snapshot yönetimi', 'Bridge servisleri', 'Otomatik kayıt', 'Sağlık ve keepalive'] },
    ],
    archHa: [
      ['Yüksek Erişilebilirlik', 'Otomatik failover ve sağlık izlemeyle birden fazla control plane örneği'],
      ['Ölçeklenebilirlik', 'Kurumsal iş yükleri için controller ve control plane’ler arasında load balancing'],
      ['Sürüm Yönlendirme', 'Client gereksinimlerine göre uygun control plane sürümlerine akıllı yönlendirme'],
    ],

    // Use cases
    ucEyebrow: 'KULLANIM SENARYOLARI',
    ucH2: 'Tasarımı gereği çok yönlü.',
    ucIntro: 'Farklı dağıtım senaryoları için tasarlanmış çok yönlü platform.',
    ucCases: [
      { t: 'API Gateway Yönetimi', d: 'Mikroservis mimarileri için client’ları bir API gateway olarak merkezi yönetim.', list: ['Rate limiting ve trafik kontrolü','Kimlik doğrulama ve yetkilendirme','Request/response dönüşümü','API sürümleme ve yönlendirme'] },
      { t: 'Service Mesh Yönetimi', d: 'Client’ları merkezi kontrolle bir service mesh data plane olarak dağıtın ve yönetin.', list: ['Servisler arası iletişim','Trafik bölme ve canary','Circuit breaking ve yeniden denemeler','Observability ve metrikler'] },
      { t: 'Çok Cluster’lı Dağıtım', d: 'Birden fazla Kubernetes cluster’ında client örneklerini birleşik yapılandırmayla yönetin.', list: ['Cluster’lar arası servis keşfi','Birleşik politika uygulama','Felaket kurtarma ve failover','Global load balancing'] },
      { t: 'Kurumsal Mikroservisler', d: 'Çok kiracılılık ve rol tabanlı erişim kontrolüyle kurumsal düzeyde client yönetimi.', list: ['Ekip bazlı yapılandırma izolasyonu','Denetim kaydı ve uyumluluk','Merkezi politika yönetimi','Self-servis yapılandırma'] },
      { t: 'Cloud-Native Uygulamalar', d: 'Trafik yönetimi ve observability için client’lardan yararlanan modern cloud-native uygulamalar.', list: ['Container tabanlı dağıtımlar','Otomatik ölçeklenme ve load balancing','Kesintisiz dağıtımlar','Sağlık kontrolü ve izleme'] },
      { t: 'Edge Proxy ve CDN', d: 'İçerik dağıtımı ve request yönlendirme için client’ları edge’de dağıtın.', list: ['Coğrafi trafik yönlendirme','Cache yönetimi','DDoS koruması','SSL/TLS termination'] },
    ],

    // Industries
    indLabel: 'SEKTÖRLER GENELİNDE GÜVENİLİR',
    indItems: ['Finansal Hizmetler','E-Ticaret','Sağlık','Teknoloji','Telekomünikasyon','Medya ve Eğlence'],
    indNote: 'Kullanım senaryonuz ne olursa olsun, Elchi ihtiyacınız olan esnekliği ve gücü sunar.',

    // Final CTA
    ctaEyebrow: 'ELCHI’Yİ ŞİMDİ DENEYİN',
    ctaH2a: 'Client yönetiminizi',
    ctaH2b: 'basitleştirmeye hazır mısınız?',
    ctaIntro: 'Proxy yönetimi için yığın çözümünü demomuzla deneyin veya Helm chart’ımızı kullanarak Kubernetes cluster’ınıza dağıtın.',
    ctaBtnDemo: 'Demoyu Dene',
    ctaBtnHelm: 'Helm Charts',
    ctaBadges: ['Kullanıma Hazır','MongoDB Deposu','Çok Sürümlü Proxy','Agent Desteği'],
  },
};

function App() {
  return (
    <>
      <Nav active="home" />
      <Hero variant="flow" />
      <Logos />
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
              <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">{t.heroBtnDemo}</a>
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
  const cats = t.ssCats;
  const [active, setActive] = useState('All');
  const shots = t.ssShots;
  const filtered = active === 'All' ? shots : shots.filter(s => s.cat === active);

  return (
    <section className="section" id="screenshots">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.ssEyebrow}</span>
          <h2>{t.ssH2a}<br/>{t.ssH2b}</h2>
          <p>{t.ssIntro}</p>
        </div>

        <div className="ss-tabs">
          {cats.map(c => (
            <button key={c} className={`ss-tab ${active === c ? 'active' : ''}`} onClick={() => setActive(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="ss-grid">
          {filtered.map((s, i) => (
            <a key={i} href={s.src} target="_blank" rel="noopener" className="ss-card">
              <div className="ss-img">
                <img src={s.src} alt={s.title} loading="lazy"/>
                <span className="ss-cat mono">{s.cat}</span>
              </div>
              <div className="ss-meta">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
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
              <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">{t.ctaBtnDemo}</a>
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

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
