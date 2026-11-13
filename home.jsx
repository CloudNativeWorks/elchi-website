import ReactDOM from 'react-dom/client';
import './home.css';
import { getLocale, locHref } from './i18n.js';
import { Nav, Footer, useArchiveVersions } from './shared.jsx';
import { PRODUCTS } from './products-data.js';
import { lazy, startTransition, Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HOME_FILM } from './film-data.js';

// The film player (and videos.css) loads only when the visitor presses "Watch the film".
// "Watch the film" opens the featured video; the player and the video list load on demand
const loadPlayer = () => Promise.all([import('./video-player.jsx'), import('./video-list.js')]);
const FilmPlayer = lazy(() => loadPlayer().then(([m, l]) => ({ default: (p) => <m.Player v={l.FEATURED} {...p} /> })));
import { HeroStage } from './hero-stage.jsx';
import { Band, BandHead, Tick, Dash, Half, Arrow, Play } from './relief.jsx';
import { ScreenGallery } from './screens.jsx';

// All user-visible strings for the home page. Technical/product terms (Envoy, xDS,
// GSLB, WAF, Kubernetes, Registry, Controller, Control-Plane, category filter keys…)
// are intentionally kept in English in both locales. `cats`/`shots[].cat` are stable
// filter identifiers (compared against the hardcoded 'All' sentinel), so they stay in
// English in both locales.
const STR = {
  en: {
    // Hero
    heroH1a: 'Elchi:',
    heroH1b: 'every proxy, every edge, one control plane.',
    heroPara: 'With Elchi you configure, validate and publish listeners, routes, clusters and certificates for every proxy from one place, and protect your APIs at the edge with Elchi Shield and Elchi API Discovery.',
    heroBtnStart: 'Get Started',
    heroBtnDemo: 'Book a demo',
    heroBtnArch: 'View architecture',
    heroBtnFilm: 'Watch the film',
    heroFree: 'Free tier: Elchi Core with one managed client, no license needed.',
    heroBadges: [
      ['3-Process', 'Distributed Architecture'],
      ['Full xDS', 'Protocol Support'],
      ['Multi-Version', 'Proxy & Upgrade'],
      ['Real-time', 'Validation'],
    ],

    // What is Elchi (the definitional paragraph)
    whatH2: 'What is Elchi?',
    whatP: 'Elchi is a self-hosted control plane with a web UI for fleets of Envoy proxies. In Elchi you edit listeners, routes, clusters and certificates in typed forms instead of hand-writing xDS or YAML; Elchi validates each change and publishes it to the proxies that the Elchi agent runs on each Linux host. Elchi Shield (WAF), Elchi API Discovery and Elchi GSLB are add-ons.',

    // Logos
    logosItems: ['Kubernetes', 'Envoy', 'Grafana', 'OpenStack', 'LDAP / AD', 'Let\'s Encrypt', 'OpenRouter'],

    // Features
    featuresH2: 'What Elchi does, feature by feature.',
    featuresIntro: 'Typed editors, two-step validation, versioned rollouts and edge security, all in Elchi.',
    features: [
      { t: 'Proto-Driven Configuration', d: 'Elchi generates its typed models and field metadata from each proxy version\'s protobufs. Listeners, Clusters, Endpoints, Routes — with full TypeScript safety.', icon: 'proto' },
      { t: 'Interactive Dependency Graphs', d: 'Diagrams of how listeners, routes, clusters and endpoints depend on each other, to follow a request and find what a change affects.', icon: 'graph' },
      { t: 'Shield — Edge API Security', d: 'A per-edge ext_proc sidecar that enforces API security in the request path: WAF (OWASP CRS), authentication, rate limiting, and bot defense — twelve engines plus built-in DLP, rolled out safely from detect to block.', icon: 'lock' },
      { t: 'API Discovery & Inventory', d: 'Turn live traffic into a continuously-scored inventory of every API you expose — shadow endpoints, missing auth, PII leaks, enumeration — check it against your OpenAPI specs and export it as OpenAPI.', icon: 'graph' },
      { t: 'Quick Start Scenarios', d: 'Guided wizards that build a complete set of resources for common setups, such as an HTTP or TCP proxy, plus your own reusable scenarios.', icon: 'spark' },
      { t: 'Lightweight Edge Agent', d: 'A lightweight agent on every edge host. Auto-registration, health monitoring, log export to Syslog/ELK.', icon: 'agent' },
      { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS). Delta xDS for efficient updates.', icon: 'xds' },
      { t: 'Two-Step Validation', d: 'Validation in the editor and again on the server ensures configurations are correct before deployment.', icon: 'check' },
      { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically. Every change is recorded in the audit log.', icon: 'flow' },
      { t: 'Multi-Version Support', d: 'Run several Envoy versions from one Elchi. Each proxy is served by a control plane built for its own version, and a listener moves to a newer version by hot restart.', icon: 'version' },
      { t: 'Project-Based Multi-Tenancy', d: 'Organize configurations by teams, environments, or customers. 4-tier RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
    ],

    // Comparison: buyer criteria, named alternatives, honest answers
    cmpH2: 'Elchi vs. hand-written xDS and a service mesh.',
    cmpIntro: 'Compared on what platform teams check before they choose. A service mesh is the better fit when you need mTLS and policy between pods inside Kubernetes; Elchi manages the proxy fleets at your edge.',
    cmpCaption: 'Elchi compared with hand-written xDS (go-control-plane) and a service mesh such as Istio',
    cmpHeadFeature: 'What you need',
    cmpHeadElchi: 'Elchi',
    cmpHeadManual: 'Hand-written xDS / go-control-plane',
    cmpHeadMesh: 'Service mesh (e.g. Istio)',
    cmpRows: [
      { f: 'Edit proxy config without writing YAML or xDS code',
        e: ['yes', 'Typed forms generated from each version’s protobufs'],
        m: ['no', 'You write the YAML, or Go code against go-control-plane'],
        s: ['part', 'Mesh resources; raw Envoy settings through EnvoyFilter patches'] },
      { f: 'Checked before it reaches a proxy',
        e: ['yes', 'Validated in the editor and again on the server'],
        m: ['part', 'Only the checks you build into your pipeline'],
        s: ['part', 'Schema checks on the mesh’s own resources'] },
      { f: 'Runs on plain Linux hosts and VMs',
        e: ['yes', 'The Elchi agent runs each proxy as a systemd service'],
        m: ['yes', 'With your own deployment tooling'],
        s: ['part', 'VMs join a mesh whose control plane runs on Kubernetes'] },
      { f: 'Several proxy versions at once',
        e: ['yes', 'One Elchi control plane per version; listeners move by hot restart'],
        m: ['part', 'If you build and run it'],
        s: ['part', 'Through control-plane revisions during an upgrade'] },
      { f: 'Draft, publish and an audit log for every change',
        e: ['yes', 'Save as a draft, publish atomically, every change recorded'],
        m: ['part', 'Git history, if you build the workflow'],
        s: ['part', 'Through your GitOps tooling'] },
      { f: 'WAF and API discovery in the same control plane',
        e: ['yes', 'Shield (OWASP CRS via ext_proc) and API Discovery add-ons'],
        m: ['no', 'Separate tools to integrate'],
        s: ['no', 'Separate products to integrate'] },
      { f: 'mTLS and traffic policy between pods inside Kubernetes',
        e: ['no', 'Not a sidecar mesh: Elchi manages edge and gateway fleets'],
        m: ['part', 'Only what you configure yourself'],
        s: ['yes', 'The core job of a service mesh'] },
      { f: 'Cost',
        e: ['info', 'Free tier with one managed client; licensed by client count above that'],
        m: ['info', 'Open source; you pay in engineering time'],
        s: ['info', 'Open source; you run and upgrade the mesh'] },
    ],
    cmpMore: 'Detailed comparisons',
    cmpUnique: [
      ['AI-Assisted Analysis', 'On-demand AI review of configuration and logs, with your own OpenRouter key.'],
      ['Proto-Driven Models', 'Elchi\'s typed models come from each version\'s protos, so its editors follow the proxy API closely.'],
      ['Version Routing', 'Each proxy is served by the Elchi control plane of its own version.'],
      ['Multi-Tenancy & Audit', 'Projects isolate teams; 4-tier RBAC, two-factor authentication and an audit log of every change.'],
      ['Zero-Downtime Upgrades', 'Move a listener and its resources to a new version and cut over with a hot restart, without dropped requests.'],
      ['Enterprise Auth', 'LDAP / AD integration for centralized authentication and authorization.'],
      ['Log Centralization', 'Ship logs with Filebeat to Elasticsearch or Logstash, or through rsyslog.'],
      ['Metrics', 'Built-in per-service dashboards, plus Grafana integration.'],
    ],

    // Screenshots
    ssH2: 'The Elchi UI, captured from a live environment.',
    ssIntro: 'Elchi with real traffic, Shield blocks and discovered APIs. Drag the slider to see each screen in light and dark.',

    // Architecture (3-process)
    archH2: 'Elchi architecture: Registry, Controller, Control-Plane.',
    archIntro: 'Three processes plus a lightweight agent on every edge host. Run several Controllers and Control-Planes; the Elchi Registry sends each client to a control plane built for its version.',
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
      ['Scalability', 'Run several controller and control-plane instances and spread the clients across them'],
      ['Version Routing', 'Each client is served by a control plane of its own version'],
    ],

    // Use cases
    ucH2: 'Six ways teams use Elchi.',
    ucIntro: 'Common deployments, each linked to the docs page that sets it up.',
    ucCases: [
      { t: 'API Gateway Management', d: 'Run your edge clients as an API gateway in front of microservices, managed centrally.', list: ['Rate limiting & traffic control','Authentication & authorization','Request/response transformation','API versioning & routing'],
        href: '/docs/shield/overview', more: 'Shield docs' },
      { t: 'Load Balancing & Traffic Steering', d: 'Use Elchi to run load balancers in front of your services, with health checks and controlled rollouts.', list: ['Weighted traffic splitting & canary','Circuit breaking, retries & outlier detection','Active health checks','Metrics & live traffic view'],
        href: '/docs/guides/blue-green-envoy-eds', more: 'Blue/green guide' },
      { t: 'Multi-Site & Multi-Cluster Backends', d: 'Put edge fleets in front of several sites and Kubernetes clusters, managed from one control plane.', list: ['Kubernetes node discovery per cluster','GSLB failover between sites','Active/passive edge HA pairs','Unified policy enforcement'],
        href: '/docs/gslb/overview', more: 'GSLB docs' },
      { t: 'Multi-Team Platforms', d: 'Client management with project-based multi-tenancy and role-based access control.', list: ['Team-based config isolation','Complete audit trail','Centralized policy management','Self-service configuration'],
        href: '/docs/administration/auth-and-access', more: 'Access control docs' },
      { t: 'Cloud-Native Applications', d: 'Run the control plane on Kubernetes and keep the edge proxies in step with your clusters.', list: ['Control plane on Kubernetes via Helm','Kubernetes node discovery','Zero-downtime listener upgrades','Health checking & monitoring'],
        href: '/docs/installation/helm-platform/installation', more: 'Helm install' },
      { t: 'Edge Proxy & Ingress', d: 'Use Elchi at the edge to terminate TLS, protect incoming traffic and route it.', list: ['SSL/TLS termination with ACME certificates','Rate limits & connection limits','Bot & IP-reputation blocking (Shield)','Region-scoped DNS answers with GSLB'],
        href: '/docs/traffic-and-certificates/acme/overview', more: 'ACME certificates docs' },
    ],

    // Guides (docs/guides)
    guidesH3: 'How-to guides',
    guidesNote: '',
    guideLabel: 'Guide',
    guides: [
      ['manage-envoy-without-yaml', 'Manage proxies without hand-writing xDS or YAML'],
      ['run-multiple-envoy-versions', 'Run several versions and upgrade listeners with zero downtime'],
      ['add-waf-to-envoy-ext-proc', 'Add a WAF (OWASP Core Rule Set) with Elchi Shield'],
      ['find-shadow-apis-envoy-access-logs', 'Find shadow and undocumented APIs from access logs'],
      ['gslb-dns-failover-envoy', 'GSLB and DNS-based failover with Elchi'],
      ['blue-green-envoy-eds', 'Blue/green deployments with EDS'],
    ],

    // Final CTA
    ctaH2a: 'Ready to simplify your',
    ctaH2b: 'traffic management?',
    ctaIntro: 'Book a demo to walk through Elchi with your own setup in mind, or install the free tier on Kubernetes with the Helm chart and manage one client without a license.',
    ctaBtnDemo: 'Book a demo',
    ctaBtnHelm: 'Helm Charts',
    ctaBadges: ['Ready To Use','Self-Hosted','Multi-Version Proxy','Agent Support'],
  },

  tr: {
    // Hero
    heroH1a: 'Elchi:',
    heroH1b: 'her proxy, her edge, tek control plane.',
    heroPara: 'Elchi ile her proxy için listener, route, cluster ve sertifikaları tek yerden yapılandırın, doğrulayın ve yayınlayın; API’lerinizi Elchi Shield ve Elchi API Discovery ile edge’de koruyun.',
    heroBtnStart: 'Başlayın',
    heroBtnDemo: 'Demo talep et',
    heroBtnArch: 'Mimariyi görün',
    heroBtnFilm: 'Filmi izleyin',
    heroFree: 'Ücretsiz seviye: lisans gerekmeden tek yönetilen client ile Elchi Core.',
    heroBadges: [
      ['3 Süreç', 'Dağıtık Mimari'],
      ['Tam xDS', 'Protokol Desteği'],
      ['Çok Sürümlü', 'Proxy ve Yükseltme'],
      ['Gerçek Zamanlı', 'Doğrulama'],
    ],

    // What is Elchi
    whatH2: 'Elchi nedir?',
    whatP: 'Elchi, Envoy proxy filoları için web arayüzlü ve kendi altyapınızda çalışan bir control plane’dir. Elchi’de xDS veya YAML’ı elle yazmak yerine listener, route, cluster ve sertifikaları tipli formlarda düzenlersiniz; Elchi her değişikliği doğrular ve Elchi agent’ının her Linux host’ta çalıştırdığı proxy’lere yayınlar. Elchi Shield (WAF), Elchi API Discovery ve Elchi GSLB eklenti ürünlerdir.',

    // Logos
    logosItems: ['Kubernetes', 'Envoy', 'Grafana', 'OpenStack', 'LDAP / AD', 'Let\'s Encrypt', 'OpenRouter'],

    // Features
    featuresH2: 'Özellik özellik Elchi.',
    featuresIntro: 'Tipli editörler, iki aşamalı doğrulama, sürümlü geçişler ve edge güvenliği; hepsi Elchi’de.',
    features: [
      { t: 'Proto Tabanlı Yapılandırma', d: 'Elchi tipli modelleri ve alan meta verilerini her proxy sürümünün protobuf tanımlarından üretir. Listener, Cluster, Endpoint, Route — tam TypeScript güvenliğiyle.', icon: 'proto' },
      { t: 'Etkileşimli Bağımlılık Grafikleri', d: 'Listener, route, cluster ve endpoint’lerin birbirine nasıl bağlandığını gösteren diyagramlar; bir isteği izleyin, bir değişikliğin neyi etkilediğini görün.', icon: 'graph' },
      { t: 'Shield — Edge API Güvenliği', d: 'Request path’inde API güvenliğini uygulayan, her edge’de çalışan bir ext_proc sidecar: WAF (OWASP CRS), kimlik doğrulama, rate limiting ve bot savunması — on iki motor artı yerleşik DLP, detect’ten block’a güvenle devreye alınır.', icon: 'lock' },
      { t: 'API Keşfi ve Envanteri', d: 'Canlı trafiği, sunduğunuz her API’nin sürekli puanlanan bir envanterine dönüştürün — shadow endpoint’ler, eksik kimlik doğrulama, PII sızıntıları, numaralandırma — OpenAPI spec’lerinizle karşılaştırın ve OpenAPI olarak dışa aktarın.', icon: 'graph' },
      { t: 'Hızlı Başlangıç Senaryoları', d: 'HTTP veya TCP proxy gibi yaygın kurulumlar için eksiksiz kaynak setini adım adım oluşturan sihirbazlar; kendi senaryolarınızı da kaydedip yeniden kullanın.', icon: 'spark' },
      { t: 'Hafif Edge Agent', d: 'Her edge host’ta çalışan hafif bir agent. Otomatik kayıt, sağlık izleme, Syslog/ELK’ye log aktarımı.', icon: 'agent' },
      { t: 'Tam xDS Protokol Desteği', d: 'xDS’in (ADS, CDS, EDS, LDS, RDS, VHDS) eksiksiz uygulaması. Verimli güncellemeler için Delta xDS.', icon: 'xds' },
      { t: 'İki Aşamalı Doğrulama', d: 'Editörde ve ardından sunucuda yapılan doğrulama, yapılandırmaların dağıtımdan önce doğru olmasını sağlar.', icon: 'check' },
      { t: 'Kaydet ve Yayınla Akışı', d: 'Güvenli yapılandırma değişiklikleri için taslak modu. Adım adım kaydedin ve toplu güncellemeleri atomik olarak yayınlayın. Her değişiklik denetim kaydına yazılır.', icon: 'flow' },
      { t: 'Çok Sürüm Desteği', d: 'Birden fazla Envoy sürümünü tek bir Elchi’den çalıştırın. Her proxy kendi sürümü için derlenmiş bir control plane’den beslenir; bir listener hot restart ile yeni sürüme geçer.', icon: 'version' },
      { t: 'Proje Bazlı Çok Kiracılılık', d: 'Yapılandırmaları ekiplere, ortamlara veya müşterilere göre düzenleyin. 4 katmanlı RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
    ],

    // Comparison
    cmpH2: 'Elchi, elle yazılan xDS ve service mesh karşısında.',
    cmpIntro: 'Platform ekiplerinin seçmeden önce baktığı ölçütlerle karşılaştırma. Kubernetes içinde pod’lar arasında mTLS ve politika gerekiyorsa service mesh daha uygundur; Elchi edge’inizdeki proxy filolarını yönetir.',
    cmpCaption: 'Elchi; elle yazılan xDS (go-control-plane) ve Istio gibi bir service mesh ile karşılaştırma',
    cmpHeadFeature: 'İhtiyaç',
    cmpHeadElchi: 'Elchi',
    cmpHeadManual: 'Elle yazılan xDS / go-control-plane',
    cmpHeadMesh: 'Service mesh (ör. Istio)',
    cmpRows: [
      { f: 'YAML veya xDS kodu yazmadan proxy yapılandırması',
        e: ['yes', 'Her sürümün protobuf’larından üretilen tipli formlar'],
        m: ['no', 'YAML’ı ya da go-control-plane ile Go kodunu siz yazarsınız'],
        s: ['part', 'Mesh kaynakları; ham Envoy ayarları EnvoyFilter yamalarıyla'] },
      { f: 'Proxy’ye ulaşmadan önce denetim',
        e: ['yes', 'Editörde ve ardından sunucuda doğrulanır'],
        m: ['part', 'Yalnızca pipeline’ınıza eklediğiniz kontroller'],
        s: ['part', 'Mesh’in kendi kaynaklarında şema kontrolü'] },
      { f: 'Düz Linux host’lar ve VM’lerde çalışır',
        e: ['yes', 'Elchi agent her proxy’yi systemd servisi olarak çalıştırır'],
        m: ['yes', 'Kendi dağıtım araçlarınızla'],
        s: ['part', 'VM’ler, control plane’i Kubernetes’te çalışan bir mesh’e katılır'] },
      { f: 'Aynı anda birden fazla proxy sürümü',
        e: ['yes', 'Sürüm başına bir Elchi control plane; listener’lar hot restart ile geçer'],
        m: ['part', 'Kendiniz kurup işletirseniz'],
        s: ['part', 'Yükseltme sırasında control-plane revizyonlarıyla'] },
      { f: 'Her değişiklik için taslak, yayın ve denetim kaydı',
        e: ['yes', 'Taslak olarak kaydedin, atomik yayınlayın, her değişiklik kayıtlı'],
        m: ['part', 'Akışı kurarsanız Git geçmişi'],
        s: ['part', 'GitOps araçlarınız üzerinden'] },
      { f: 'Aynı control plane’de WAF ve API keşfi',
        e: ['yes', 'Shield (ext_proc ile OWASP CRS) ve API Discovery eklentileri'],
        m: ['no', 'Ayrı araçları entegre edersiniz'],
        s: ['no', 'Ayrı ürünleri entegre edersiniz'] },
      { f: 'Kubernetes içinde pod’lar arası mTLS ve trafik politikası',
        e: ['no', 'Sidecar mesh değildir: Elchi edge ve gateway filolarını yönetir'],
        m: ['part', 'Yalnızca kendiniz yapılandırdığınız kadar'],
        s: ['yes', 'Service mesh’in asıl işi'] },
      { f: 'Maliyet',
        e: ['info', 'Tek yönetilen client ile ücretsiz seviye; üzerinde client sayısına göre lisans'],
        m: ['info', 'Açık kaynak; bedeli mühendislik zamanıyla ödersiniz'],
        s: ['info', 'Açık kaynak; mesh’i siz işletir ve yükseltirsiniz'] },
    ],
    cmpMore: 'Ayrıntılı karşılaştırmalar',
    cmpUnique: [
      ['AI Destekli Analiz', 'Kendi OpenRouter anahtarınızla yapılandırma ve logların istek üzerine AI incelemesi.'],
      ['Proto Tabanlı Modeller', 'Elchi’nin tipli modelleri her sürümün proto’larından gelir; editörler proxy API’sini yakından izler.'],
      ['Sürüm Yönlendirme', 'Her proxy, kendi sürümünün Elchi control plane’inden beslenir.'],
      ['Çok Kiracılılık ve Denetim', 'Projeler ekipleri ayırır; 4 katmanlı RBAC, iki faktörlü kimlik doğrulama ve her değişikliğin denetim kaydı.'],
      ['Kesintisiz Yükseltmeler', 'Bir listener’ı ve kaynaklarını yeni sürüme taşıyın, hot restart ile istek kaybetmeden geçin.'],
      ['Kurumsal Kimlik Doğrulama', 'Merkezi kimlik doğrulama ve yetkilendirme için LDAP / AD entegrasyonu.'],
      ['Log Merkezileştirme', 'Logları Filebeat ile Elasticsearch veya Logstash’e ya da rsyslog üzerinden gönderin.'],
      ['Metrikler', 'Servis başına yerleşik dashboard’lar ve Grafana entegrasyonu.'],
    ],

    // Screenshots
    ssH2: 'Canlı bir ortamdan Elchi arayüzü.',
    ssIntro: 'Gerçek trafik, Shield engellemeleri ve keşfedilen API’lerle Elchi. Her ekranı açık ve koyu temada görmek için kaydırıcıyı sürükleyin.',

    // Architecture (3-process)
    archH2: 'Elchi mimarisi: Registry, Controller, Control-Plane.',
    archIntro: 'Üç süreç ve her edge host’ta hafif bir agent. Birden fazla Controller ve Control-Plane çalıştırın; Elchi Registry her client’ı kendi sürümü için derlenmiş bir control plane’e yönlendirir.',
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
      ['Ölçeklenebilirlik', 'Birden fazla controller ve control plane örneği çalıştırın, client’ları aralarında dağıtın'],
      ['Sürüm Yönlendirme', 'Her client, kendi sürümünün control plane’inden beslenir'],
    ],

    // Use cases
    ucH2: 'Ekiplerin Elchi’yi kullandığı altı yol.',
    ucIntro: 'Yaygın kurulumlar; her biri onu kuran doküman sayfasına bağlı.',
    ucCases: [
      { t: 'API Gateway Yönetimi', d: 'Edge client’larınızı mikroservislerin önünde bir API gateway olarak çalıştırın, merkezden yönetin.', list: ['Rate limiting ve trafik kontrolü','Kimlik doğrulama ve yetkilendirme','Request/response dönüşümü','API sürümleme ve yönlendirme'],
        href: '/docs/shield/overview', more: 'Shield dokümanı' },
      { t: 'Load Balancing ve Trafik Yönlendirme', d: 'Elchi ile servislerinizin önünde sağlık kontrollü ve kontrollü geçişli load balancer olarak çalıştırın.', list: ['Ağırlıklı trafik bölme ve canary','Circuit breaking, yeniden deneme ve outlier detection','Aktif sağlık kontrolleri','Metrikler ve canlı trafik görünümü'],
        href: '/docs/guides/blue-green-envoy-eds', more: 'Blue/green rehberi' },
      { t: 'Çok Lokasyonlu ve Çok Cluster’lı Backend’ler', d: 'Edge filolarını birden fazla lokasyonun ve Kubernetes cluster’ının önüne koyun, tek control plane’den yönetin.', list: ['Cluster başına Kubernetes node keşfi','Lokasyonlar arası GSLB failover','Aktif/pasif edge HA çiftleri','Birleşik politika uygulama'],
        href: '/docs/gslb/overview', more: 'GSLB dokümanı' },
      { t: 'Çok Ekipli Platformlar', d: 'Proje bazlı çok kiracılılık ve rol tabanlı erişim kontrolüyle client yönetimi.', list: ['Ekip bazlı yapılandırma izolasyonu','Eksiksiz denetim kaydı','Merkezi politika yönetimi','Self-servis yapılandırma'],
        href: '/docs/administration/auth-and-access', more: 'Erişim kontrolü dokümanı' },
      { t: 'Cloud-Native Uygulamalar', d: 'Control plane’i Kubernetes’te çalıştırın, edge proxy’leri cluster’larınızla senkron tutun.', list: ['Helm ile Kubernetes’te control plane','Kubernetes node keşfi','Kesintisiz listener yükseltmeleri','Sağlık kontrolü ve izleme'],
        href: '/docs/installation/helm-platform/installation', more: 'Helm kurulumu' },
      { t: 'Edge Proxy ve Ingress', d: 'Elchi’yi edge’de kullanarak TLS’i sonlandırın, gelen trafiği koruyun ve yönlendirin.', list: ['ACME sertifikalarıyla SSL/TLS termination','Rate limit ve bağlantı limitleri','Bot ve IP itibarı engelleme (Shield)','GSLB ile bölgeye göre DNS yanıtları'],
        href: '/docs/traffic-and-certificates/acme/overview', more: 'ACME sertifika dokümanı' },
    ],

    // Guides (docs/guides; the docs are in English)
    guidesH3: 'Adım adım rehberler',
    guidesNote: 'Rehberler İngilizcedir.',
    guideLabel: 'Rehber',
    guides: [
      ['manage-envoy-without-yaml', 'Proxy’leri xDS veya YAML elle yazmadan yönetin'],
      ['run-multiple-envoy-versions', 'Birden fazla sürümü yan yana çalıştırın, listener’ları kesintisiz yükseltin'],
      ['add-waf-to-envoy-ext-proc', 'Elchi Shield ile WAF (OWASP Core Rule Set) ekleyin'],
      ['find-shadow-apis-envoy-access-logs', 'Access loglarından shadow ve belgelenmemiş API’leri bulun'],
      ['gslb-dns-failover-envoy', 'Elchi ile GSLB ve DNS tabanlı failover'],
      ['blue-green-envoy-eds', 'EDS ile blue/green dağıtım'],
    ],

    // Final CTA
    ctaH2a: 'Trafik yönetiminizi',
    ctaH2b: 'basitleştirmeye hazır mısınız?',
    ctaIntro: 'Elchi’yi kendi kurulumunuz üzerinden konuşmak için demo talep edin ya da Helm chart ile ücretsiz seviyeyi Kubernetes’e kurup tek bir client’ı lisanssız yönetin.',
    ctaBtnDemo: 'Demo talep et',
    ctaBtnHelm: 'Helm Charts',
    ctaBadges: ['Kullanıma Hazır','Kendi Altyapınızda','Çok Sürümlü Proxy','Agent Desteği'],
  },
};

// Strings of the relief-map chrome. Product facts stay in STR.
const RL = {
  en: {
    integrations: 'Works with', notes: 'What sets it apart', requires: 'Requires Core', release: 'Current release',
    verdict: { yes: 'Yes', no: 'No', part: 'Partly' },
    shipTitle: 'How a change ships',
    ship: [['Save', 'as a draft'], ['Validate', 'in the editor and on the server'], ['Publish', 'to the fleet, atomically']],
    shipNote: 'Every change is recorded in the audit log.',
  },
  tr: {
    integrations: 'Birlikte çalışır', notes: 'Farkı', requires: 'Core gerektirir', release: 'Güncel sürüm',
    verdict: { yes: 'Evet', no: 'Hayır', part: 'Kısmen' },
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
          <p className="rl-hero-p">{t.heroPara}</p>
          <div className="rl-actions">
            <a href="/docs/getting-started/quickstart" className="rl-go">
              {t.heroBtnStart}<Arrow />
            </a>
            <a href={locHref('contact')} className="rl-pill rl-pill-demo">{t.heroBtnDemo}</a>
            <button type="button" className="rl-pill" onClick={() => setFilmOpen(true)} onPointerEnter={loadPlayer} onFocus={loadPlayer}>
              <span className="rl-pill-play"><Play /></span>{t.heroBtnFilm}<span className="rl-pill-dur">{HOME_FILM.duration}</span>
            </button>
          </div>
          <p className="rl-free">{t.heroFree}</p>
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
        <div className="rl-whatis">
          <h2>{t.whatH2}</h2>
          <p>{t.whatP}</p>
        </div>
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
    h2a: 'Elchi Core',
    h2b: 'and three add-ons.',
    intro: 'Start with Elchi Core — the base of the Elchi platform — and license security, discovery, and traffic products as you need them.',
    base: 'Base platform',
    addon: 'Add-on',
    learnMore: 'Learn more →',
    plansCta: 'See plans & licensing →',
  },
  tr: {
    h2a: 'Elchi Core',
    h2b: 've üç eklenti.',
    intro: 'Elchi platformunun temeli Elchi Core ile başlayın; güvenlik, keşif ve trafik ürünlerini ihtiyacınız oldukça lisanslayın.',
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
      <BandHead h2={t.featuresH2} intro={t.featuresIntro} />
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
  const ICON = { yes: Tick, no: Dash, part: Half };
  // icon for the eye, the verdict and the reason as text (screen readers and extractors read the text)
  const Cell = ({ v: [k, text], head, e }) => {
    const Icon = ICON[k];
    return (
      <td className={`cmp-c${e ? ' cmp-e' : ''} cmp-${k}`} data-h={head}>
        {Icon && <Icon />}
        <span className="cmp-val">{r.verdict[k] && <b className="cmp-k">{r.verdict[k]}. </b>}{text}</span>
      </td>
    );
  };
  return (
    <Band tone="sage" id="compare">
      <BandHead h2={t.cmpH2} intro={t.cmpIntro} />
      {/* explicit roles keep the table semantics when the phone layout turns rows into grids */}
      <table className="cmp" role="table">
        <caption className="sr">{t.cmpCaption}</caption>
        <thead role="rowgroup">
          <tr className="cmp-row cmp-head" role="row">
            <th scope="col" className="cmp-f" role="columnheader">{t.cmpHeadFeature}</th>
            <th scope="col" className="cmp-c cmp-e" role="columnheader">{t.cmpHeadElchi}</th>
            <th scope="col" className="cmp-c" role="columnheader">{t.cmpHeadManual}</th>
            <th scope="col" className="cmp-c" role="columnheader">{t.cmpHeadMesh}</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {t.cmpRows.map((row) => (
            <tr key={row.f} className="cmp-row" role="row">
              <th scope="row" className="cmp-f" role="rowheader">{row.f}</th>
              <Cell v={row.e} head={t.cmpHeadElchi} e />
              <Cell v={row.m} head={t.cmpHeadManual} />
              <Cell v={row.s} head={t.cmpHeadMesh} />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="rl-after"><a href={locHref('compare')} className="rl-link">{t.cmpMore}<Arrow /></a></p>
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
      <BandHead h2={t.ssH2} intro={t.ssIntro} />
      <ScreenGallery bare />
    </Band>
  );
}

/* ====================== ARCHITECTURE: the deep lake ====================== */
function Architecture3() {
  const t = STR[getLocale()];
  return (
    <Band tone="deep">
      <BandHead h2={t.archH2} intro={t.archIntro} />
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
  const locale = getLocale();
  const t = STR[locale];
  return (
    <Band tone="mist2" id="use-cases">
      <BandHead h2={t.ucH2} intro={t.ucIntro} />
      <div className="uc">
        {t.ucCases.map((c) => (
          <div key={c.t} className="uc-row">
            <h3>{c.t}</h3>
            <div className="uc-d">
              <p>{c.d}</p>
              <a href={c.href} className="rl-link uc-more">{c.more}<Arrow /></a>
            </div>
            <ul>{c.list.map((it) => <li key={it}>{it}</li>)}</ul>
          </div>
        ))}
      </div>
      <h3 className="rl-h3" id="guides">{t.guidesH3}</h3>
      {t.guidesNote && <p className="guides-note">{t.guidesNote}</p>}
      <ul className="guides">
        {t.guides.map(([slug, title]) => (
          <li key={slug}>
            <a href={`/docs/guides/${slug}`} hrefLang={locale === 'tr' ? 'en' : undefined}>
              <span className="guides-kind">{t.guideLabel}</span>
              <span className="guides-t">{title}</span>
              <Arrow />
            </a>
          </li>
        ))}
      </ul>
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
// The prerendered HTML stays on screen until React commits; rendering inside a transition lets React
// split that first render into small slices instead of one long task.
if (typeof document !== 'undefined') {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  startTransition(() => root.render(<App/>));
}
