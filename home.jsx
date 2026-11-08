import ReactDOM from 'react-dom/client';
import { getLocale, locHref } from './i18n.js';
import { Nav, Footer, useArchiveVersions } from './shared.jsx';
import { PRODUCTS } from './products-data.js';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HOME_FILM } from './film-data.js';

// The film player (and videos.css) loads only when the visitor presses "Watch the film".
// "Watch the film" opens the featured video; the player and the video list load on demand
const loadPlayer = () => Promise.all([import('./video-player.jsx'), import('./video-list.js')]);
const FilmPlayer = lazy(() => loadPlayer().then(([m, l]) => ({ default: (p) => <m.Player v={l.FEATURED} {...p} /> })));
import { HeroStage } from './hero-stage.jsx';
import { ScreenGallery } from './screens.jsx';

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
    heroPara1: 'The enterprise control plane for ',
    heroParaStrong1: 'traffic management',
    heroPara2: ' and ',
    heroParaStrong2: 'API security',
    heroPara3: '. Configure, validate and publish your entire Envoy fleet from one place — listeners, routes, GSLB and certificates — and protect every API at the edge with Shield and traffic-derived API discovery.',
    heroBtnDemo: 'Get Started →',
    heroBtnArch: 'View architecture',
    heroBtnFilm: 'Watch the film',
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
      { f: 'ACME Certificate Management', e: true, m: false, s: 'via add-ons', sub: 'Let\'s Encrypt + Google Trust' },
      { f: 'Global Server Load Balancing', e: true, m: false, s: false, sub: 'DNS-based with health probing' },
      { f: 'API Discovery & Inventory', e: true, m: false, s: false, sub: 'Auto-discovered surface, risk & PII scoring' },
      { f: 'Shield — Edge API Security', e: true, m: false, s: false, sub: 'OWASP CRS WAF, auth, rate limit — 12 engines + built-in DLP' },
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
    ctaH2b: 'traffic management?',
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
    heroPara1: '',
    heroParaStrong1: 'Trafik yönetimi',
    heroPara2: ' ve ',
    heroParaStrong2: 'API güvenliği',
    heroPara3: ' için kurumsal control plane. Tüm Envoy filonuzu tek yerden yapılandırın, doğrulayın ve yayınlayın — listener’lar, route’lar, GSLB ve sertifikalar — ve her API’yi Shield ile trafikten türetilen API keşfi sayesinde edge’de koruyun.',
    heroBtnDemo: 'Başlayın →',
    heroBtnArch: 'Mimariyi görün',
    heroBtnFilm: 'Filmi izleyin',
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
      { f: 'ACME Sertifika Yönetimi', e: true, m: false, s: 'eklentiyle', sub: 'Let\'s Encrypt + Google Trust' },
      { f: 'Global Server Load Balancing', e: true, m: false, s: false, sub: 'Sağlık kontrollü, DNS tabanlı' },
      { f: 'API Keşfi ve Envanteri', e: true, m: false, s: false, sub: 'Otomatik keşfedilen yüzey, risk ve PII puanlaması' },
      { f: 'Shield — Edge API Güvenliği', e: true, m: false, s: false, sub: 'OWASP CRS WAF, auth, rate limit — 12 motor + yerleşik DLP' },
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
    ctaH2a: 'Trafik yönetiminizi',
    ctaH2b: 'basitleştirmeye hazır mısınız?',
    ctaIntro: 'Proxy yönetimi için yığın çözümünü demomuzla deneyin veya Helm chart’ımızı kullanarak Kubernetes cluster’ınıza dağıtın.',
    ctaBtnDemo: 'Bize Ulaşın',
    ctaBtnHelm: 'Helm Charts',
    ctaBadges: ['Kullanıma Hazır','Kendi Altyapınızda','Çok Sürümlü Proxy','Agent Desteği'],
  },
};

// Strings of the relief-map chrome. Product facts stay in STR.
const RL = {
  en: {
    integrations: 'Works with', notes: 'What sets it apart', requires: 'Requires Core', release: 'Current release',
    yes: 'Yes', no: 'No',
    shipTitle: 'How a change ships',
    ship: [['Save', 'as a draft'], ['Validate', 'in the editor and on the server'], ['Publish', 'to the fleet, atomically']],
    shipNote: 'Every change is recorded in the audit log.',
  },
  tr: {
    integrations: 'Birlikte çalışır', notes: 'Farkı', requires: 'Core gerektirir', release: 'Güncel sürüm',
    yes: 'Var', no: 'Yok',
    shipTitle: 'Bir değişiklik nasıl yayına çıkar',
    ship: [['Kaydet', 'taslak olarak'], ['Doğrula', 'editörde ve sunucuda'], ['Yayınla', 'filoya, atomik olarak']],
    shipNote: 'Her değişiklik denetim kaydına yazılır.',
  },
};

function App() {
  return (
    <>
      <Nav active="home" />
      <main className="rl">
        <Hero />
        <ProductFamily />
        <FeaturesGrid />
        <Comparison />
        <ScreenshotsGallery />
        <Architecture3 />
        <UseCases />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

/* One elevation band of the relief: tone sets it apart from its neighbours, never a rule. */
function Band({ tone = 'mist', id, className = '', children }) {
  return (
    <section className={`rl-band rl-${tone} ${className}`} id={id}>
      <div className="rl-wrap">{children}</div>
    </section>
  );
}

function BandHead({ h2, intro }) {
  return (
    <header className="rl-head">
      <h2 className="rl-h2">{h2}</h2>
      {intro && <p className="rl-lede">{intro}</p>}
    </header>
  );
}

const Tick = () => (
  <svg className="rl-tick" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".14"/><path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const Dash = () => (
  <svg className="rl-dash" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 10h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
);
const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const Play = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l7-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" fill="currentColor"/></svg>
);

/* ====================== HERO ====================== */
function Hero() {
  const locale = getLocale();
  const t = STR[locale];
  const r = RL[locale];
  const { ui, backend } = useArchiveVersions();
  const [filmOpen, setFilmOpen] = useState(false);
  const closeFilm = useCallback(() => setFilmOpen(false), []);
  // fetch the player while the visitor reads, so the click opens it at once
  useEffect(() => {
    const id = window.requestIdleCallback ? window.requestIdleCallback(() => loadPlayer(), { timeout: 4000 }) : setTimeout(loadPlayer, 3000);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);
  return (
    <section className="rl-hero">
      <div className="rl-wrap rl-hero-grid">
        <div className="rl-hero-copy">
          <h1 className="rl-h1">
            <span className="rl-h1-line">{t.heroH1a}</span>{' '}
            <span className="rl-h1-line">{t.heroH1b}</span>
          </h1>
          <p className="rl-hero-p">
            {t.heroPara1}<strong>{t.heroParaStrong1}</strong>{t.heroPara2}
            <strong>{t.heroParaStrong2}</strong>{t.heroPara3}
          </p>
          <div className="rl-actions">
            <a href="/docs/getting-started/quickstart" className="rl-go">
              {t.heroBtnDemo.replace(/\s*→$/, '')}<Arrow />
            </a>
            <button type="button" className="rl-pill" onClick={() => setFilmOpen(true)} onPointerEnter={loadPlayer} onFocus={loadPlayer}>
              <span className="rl-pill-play"><Play /></span>{t.heroBtnFilm}<span className="rl-pill-dur">{HOME_FILM.duration}</span>
            </button>
          </div>
          <a href={locHref('architecture')} className="rl-link">{t.heroBtnArch}<Arrow /></a>
        </div>
        <HeroStage locale={locale} paused={filmOpen} />
        <div className="rl-facts">
          {t.heroBadges.map(([k, v]) => (
            <div key={k} className="rl-fact"><b>{k}</b><span>{v}</span></div>
          ))}
          <div className="rl-fact rl-fact-rev">
            <span className="rl-map-label">{r.release}</span>
            <span className="rl-revs">
              <a href={`https://github.com/CloudNativeWorks/elchi-archive/releases/tag/elchi-ui-${ui}`} target="_blank" rel="noopener">UI {ui}</a>
              <a href={`https://github.com/CloudNativeWorks/elchi-archive/releases/tag/elchi-backend-${backend}`} target="_blank" rel="noopener">API {backend}</a>
            </span>
          </div>
        </div>
        <p className="rl-works"><span className="rl-map-label rl-works-label">{r.integrations}</span>{t.logosItems.map((it) => <span key={it} className="rl-works-item">{it}</span>)}</p>
      </div>
      {filmOpen && createPortal(
        <Suspense fallback={null}><FilmPlayer onClose={closeFilm} /></Suspense>,
        document.body,
      )}
    </section>
  );
}

/* ====================== PRODUCT FAMILY: plateaus on Core ====================== */
// One panel per licensed product; copy comes from products-data.js so the home page, nav
// dropdown, and product pages never drift apart. Core is the ground every add-on stands on.
const PF_STR = {
  en: {
    h2a: 'One platform.',
    h2b: 'Four products.',
    intro: 'Start with Elchi Core — the complete Envoy management platform — and license security, discovery, and traffic products as you need them.',
    base: 'Base platform',
    addon: 'Add-on',
    learnMore: 'Learn more →',
    plansCta: 'See plans & licensing →',
  },
  tr: {
    h2a: 'Tek platform.',
    h2b: 'Dört ürün.',
    intro: 'Eksiksiz Envoy yönetim platformu Elchi Core ile başlayın; güvenlik, keşif ve trafik ürünlerini ihtiyacınız oldukça lisanslayın.',
    base: 'Temel platform',
    addon: 'Eklenti',
    learnMore: 'İncele →',
    plansCta: 'Paketleri & lisanslamayı görün →',
  },
};
// what each add-on works on: Shield guards the request path, discovery reads it, GSLB steers it
const PF_TONE = { 'api-security': 'coral', 'api-discovery': 'flow', gslb: 'moss' };

function ProductFamily() {
  const locale = getLocale();
  const t = PF_STR[locale];
  const r = RL[locale];
  const core = PRODUCTS.core;
  const addons = ['api-security', 'api-discovery', 'gslb'];
  return (
    <Band tone="water">
      <BandHead h2={<>{t.h2a} {t.h2b}</>} intro={t.intro} />
      <div className="pf">
        <div className="pf-addons">
          {addons.map((slug) => {
            const pt = PRODUCTS[slug][locale];
            return (
              <a key={slug} href={locHref(`products/${slug}`)} className={`pf-unit pf-${PF_TONE[slug]}`}>
                <h3>{pt.metaName}</h3>
                <p>{pt.subtitle}</p>
                <span className="pf-foot"><span className="pf-kind">{t.addon} · {r.requires}</span><span className="pf-more">{t.learnMore.replace(/\s*→$/, '')}<Arrow /></span></span>
              </a>
            );
          })}
        </div>
        <a href={locHref('products/core')} className="pf-core">
          <h3>{core[locale].metaName}</h3>
          <span className="pf-kind">{t.base}</span>
          <p>{core[locale].subtitle}</p>
          <span className="pf-more">{t.learnMore.replace(/\s*→$/, '')}<Arrow /></span>
        </a>
      </div>
      <p className="rl-after"><a href={locHref('plans')} className="rl-link">{t.plansCta.replace(/\s*→$/, '')}<Arrow /></a></p>
    </Band>
  );
}

/* ====================== FEATURES ====================== */
function FeaturesGrid() {
  const t = STR[getLocale()];
  return (
    <Band tone="mist" id="features">
      <BandHead h2={<>{t.featuresH2a} {t.featuresH2b}</>} intro={t.featuresIntro} />
      <ul className="rl-notes">
        {t.features.map((it, i) => (
          <li key={i}>
            <h3>{it.t}</h3>
            <p>{it.d}</p>
          </li>
        ))}
      </ul>
    </Band>
  );
}

/* ====================== COMPARISON ====================== */
function Comparison() {
  const locale = getLocale();
  const t = STR[locale];
  const r = RL[locale];
  const Cell = ({ v }) => {
    if (v === true) return <><Tick /><span className="sr">{r.yes}</span></>;
    if (v === false) return <><Dash /><span className="sr">{r.no}</span></>;
    return <span className="cmp-val">{v}</span>;
  };
  return (
    <Band tone="sage">
      <BandHead h2={<>{t.cmpH2a} {t.cmpH2b}</>} intro={t.cmpIntro} />
      <div className="cmp" role="table">
        <div className="cmp-row cmp-head" role="row">
          <div className="cmp-f" role="columnheader">{t.cmpHeadFeature}</div>
          <div className="cmp-c cmp-e" role="columnheader">{t.cmpHeadElchi}</div>
          <div className="cmp-c" role="columnheader">{t.cmpHeadManual}</div>
          <div className="cmp-c" role="columnheader">{t.cmpHeadMesh}</div>
        </div>
        {t.cmpRows.map((row, i) => (
          <div key={i} className="cmp-row" role="row">
            <div className="cmp-f" role="rowheader"><b>{row.f}</b><span>{row.sub}</span></div>
            <div className="cmp-c cmp-e" role="cell" data-h={t.cmpHeadElchi}><Cell v={row.e} /></div>
            <div className="cmp-c" role="cell" data-h={t.cmpHeadManual}><Cell v={row.m} /></div>
            <div className="cmp-c" role="cell" data-h={t.cmpHeadMesh}><Cell v={row.s} /></div>
          </div>
        ))}
      </div>
      <h3 className="rl-h3">{r.notes}</h3>
      <ul className="rl-notes rl-notes-4">
        {t.cmpUnique.map(([ut, ud], i) => (
          <li key={i}><h3>{ut}</h3><p>{ud}</p></li>
        ))}
      </ul>
    </Band>
  );
}

/* ====================== SCREENSHOTS ====================== */
function ScreenshotsGallery() {
  const t = STR[getLocale()];
  return (
    <Band tone="mist" id="screenshots" className="rl-shots">
      <BandHead h2={<>{t.ssH2a} {t.ssH2b}</>} intro={t.ssIntro} />
      <ScreenGallery bare />
    </Band>
  );
}

/* ====================== ARCHITECTURE: the deep lake ====================== */
function Architecture3() {
  const t = STR[getLocale()];
  return (
    <Band tone="deep">
      <BandHead h2={<>{t.archH2a} {t.archH2b}</>} intro={t.archIntro} />
      <div className="arch">
        {t.archProc.map((p) => (
          <div key={p.name} className="arch-proc">
            <div className="arch-proc-head">
              <h3>{p.name}</h3>
              <span className="arch-port">{p.port}</span>
            </div>
            <p>{p.desc}</p>
            <ul>{p.items.map((it) => <li key={it}>{it}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="arch-ha">
        {t.archHa.map(([ht, hd]) => (
          <div key={ht}><h3>{ht}</h3><p>{hd}</p></div>
        ))}
      </div>
    </Band>
  );
}

/* ====================== USE CASES ====================== */
function UseCases() {
  const t = STR[getLocale()];
  return (
    <Band tone="mist2" id="use-cases">
      <BandHead h2={t.ucH2} intro={t.ucIntro} />
      <div className="uc">
        {t.ucCases.map((c) => (
          <div key={c.t} className="uc-row">
            <h3>{c.t}</h3>
            <p>{c.d}</p>
            <ul>{c.list.map((it) => <li key={it}>{it}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="ind">
        <span className="rl-map-label">{t.indLabel}</span>
        <ul>{t.indItems.map((it) => <li key={it}>{it}</li>)}</ul>
        <p>{t.indNote}</p>
      </div>
    </Band>
  );
}

/* ====================== FINAL CTA ====================== */
function FinalCTA() {
  const locale = getLocale();
  const t = STR[locale];
  const r = RL[locale];
  return (
    <Band tone="moss" className="rl-cta-band">
      <div className="cta">
        <div className="cta-main">
          <h2 className="rl-h2 cta-h2">{t.ctaH2a} {t.ctaH2b}</h2>
          <p className="rl-lede">{t.ctaIntro}</p>
          <div className="rl-actions">
            <a href={locHref('contact')} className="rl-go">{t.ctaBtnDemo}<Arrow /></a>
            <a href="https://charts.elchi.io" target="_blank" rel="noopener" className="rl-pill">{t.ctaBtnHelm}</a>
          </div>
          <ul className="cta-specs">{t.ctaBadges.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
        <div className="ship">
          <h3 className="rl-map-label">{r.shipTitle}</h3>
          <ol>
            {r.ship.map(([step, how], i) => (
              <li key={step} className={`ship-step ship-${i}`}>
                <span className="ship-dot" aria-hidden="true" />
                <b>{step}</b>
                <span>{how}</span>
              </li>
            ))}
          </ol>
          <p>{r.shipNote}</p>
        </div>
      </div>
    </Band>
  );
}

export const Page = App;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
