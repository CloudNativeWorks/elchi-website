// Product catalog for the marketing site: copy ({en,tr}) + accent + docs link
// per product. Imported by product.jsx (product pages), plans.jsx, home.jsx and shared.jsx.
// Technical terms are intentionally kept in English inside the Turkish prose.
//
// Every statement here must be true of the shipped product and traceable to
// docs-site/docs (or the product repos). Per product:
//   guides       docs pages linked from the page (label per locale)
//   <locale>.what      the opening definition ("What is …?"), the first passage on the page
//   <locale>.evaluate  question-style H2 sections for engineers evaluating the product
//   <locale>.qa        a short visible Q&A block (no FAQPage schema on product pages)

const PRODUCTS = {
  core: {
    accent: '#2563eb',
    docs: '/docs/getting-started/introduction',
    related: ['api-security', 'api-discovery', 'gslb'],
    shots: ['dashboard', 'live-traffic', 'services', 'listener', 'metrics', 'reports-problems', 'dependency', 'clients'],
    guides: [
      { href: '/docs/getting-started/introduction', en: 'Introduction to Elchi', tr: 'Elchi’ye giriş' },
      { href: '/docs/getting-started/architecture', en: 'Architecture reference: ports, protocols, data flows', tr: 'Mimari referansı: portlar, protokoller, veri akışları' },
      { href: '/docs/guides/manage-envoy-without-yaml', en: 'Guide: manage Envoy without hand-writing xDS or YAML', tr: 'Rehber: xDS ya da YAML yazmadan Envoy yönetimi' },
      { href: '/docs/guides/run-multiple-envoy-versions', en: 'Guide: run several Envoy versions and upgrade listeners', tr: 'Rehber: birden çok Envoy sürümü ve listener yükseltme' },
      { href: '/docs/guides/blue-green-envoy-eds', en: 'Guide: blue/green releases with EDS', tr: 'Rehber: EDS ile blue/green sürüm' },
      { href: '/docs/installation/client/overview', en: 'The edge agent (elchi-client)', tr: 'Edge agent (elchi-client)' },
      { href: '/docs/installation/bare-metal/overview', en: 'Bare-metal install, no Kubernetes or Docker', tr: 'Kubernetes ve Docker olmadan bare-metal kurulum' },
    ],
    en: {
      metaName: 'Elchi Core',
      tag: 'ELCHI CORE',
      title1: 'Elchi Core:',
      title2: 'every Envoy resource, one control plane.',
      subtitle: 'The foundation of the Elchi platform: a visual control plane for your entire Envoy fleet — full xDS, several versions side by side, draft/save/publish with an audit log, and an edge agent that runs Envoy on your hosts.',
      badges: ['Full xDS Protocol', 'Multi-Version Envoy', 'Edge Agent', 'RBAC & Multi-Tenancy'],
      positioning: 'Elchi Core is the base of every deployment. All other Elchi products plug into it as add-ons.',
      what: {
        q: 'What is Elchi Core?',
        p: 'Elchi Core is a control plane for Envoy proxy fleets with a web UI in front of it. You edit listeners, routes, virtual hosts, clusters, endpoints, secrets, filters and bootstrap in forms generated from the protobuf schema of the Envoy version you run, and each change is validated in the editor and again on the server before it is stored. Publishing builds a new xDS snapshot, and the control plane streams it to the subscribed Envoys over ADS, so the change takes effect without a restart. On each edge host a small agent, elchi-client, installs Envoy, runs every deployed listener as its own systemd service, and carries out the upgrades and network changes the controller sends it. Core is part of every Elchi deployment; the add-ons API Security, API Discovery and GSLB attach to it. Without a license, the free tier runs Core with one managed client.',
      },
      capsTitle: 'What Elchi Core manages',
      shotsTitle: 'Elchi Core in the UI',
      caps: [
        { t: 'Complete Envoy resource management', d: 'Listeners, routes, virtual hosts, clusters, endpoints, TLS secrets, filters, extensions, and bootstrap — UI generated from Envoy protobufs with type-checked validation.' },
        { t: 'Full xDS protocol support', d: 'ADS, CDS, EDS, LDS, RDS and VHDS, with delta xDS for incremental updates.' },
        { t: 'Multi-version fleet', d: 'Run several Envoy versions side by side with per-version control-planes. Move a listener and its dependencies to a newer version with the listener upgrade.' },
        { t: 'Save & publish workflow', d: 'Draft changes, validate twice (in the editor and on the server), publish them together, and trace every change in the audit log.' },
        { t: 'Edge agent (elchi-client)', d: 'Installs and supervises Envoy as systemd services, upgrades with Envoy hot restart, and manages BGP/FRR routing, netplan networking and log shipping.' },
        { t: 'Edge HA pairs', d: 'Two Elchi OS appliances share VIPs active/passive: the standby runs the same Envoys warm and takes over in about two seconds, a planned failover in milliseconds. Works on plain L2 with gratuitous ARP; BGP is optional, with BFD for a fast failover over BGP.' },
        { t: 'Dependency graph & route map', d: 'Interactive views of resource relationships and route-to-cluster paths for troubleshooting.' },
        { t: 'Scenarios, templates & snippets', d: 'Guided multi-resource wizards and a reusable config library for API gateways, load balancers, and mesh setups.' },
        { t: 'Multi-project & RBAC', d: 'Project-based isolation with 4-tier roles (Owner, Admin, Editor, Viewer), LDAP/Active Directory, 2FA, and an audit trail of every change.' },
        { t: 'Observability built in', d: 'Metrics dashboards, live service logs, Grafana integration, and a background job engine that shows the phase and logs of long-running operations.' },
        { t: 'Live traffic view', d: 'Watch a listener as it runs: sampled requests from the access log flow through connection managers, domains, routes, clusters and endpoints, with rates, p99 and 5xx origin from metrics every 5 seconds.' },
        { t: 'Problems at a glance', d: 'One report of everything that needs a look, worst first: configuration a proxy rejected, failed or stuck jobs, offline clients, ACME and GSLB trouble, broken references and expiring certificates.' },
        { t: 'Configuration reports', d: 'Traffic map, domains, certificates, security per filter chain, unused resources, fleet and changes — every name links to its resource, every report exports to CSV or JSON.' },
      ],
      also: {
        title: 'Also included in Core',
        items: ['ACME certificates (Let\'s Encrypt & Google Trust, DNS-01)', 'Kubernetes endpoint discovery', 'AI-assisted config & log analysis', 'Threat intelligence & GeoIP enrichment', 'Registry HA & leader election', 'Backup, restore & maintenance tooling', 'Per-client networking & BGP management', 'OpenStack cloud integration', 'Form tools: regex tester, certificate inspector, key generators'],
      },
      evaluate: [
        { q: 'How does Elchi Core reach the proxies?', a: [
          'The backend is three processes. The Controller serves the REST API and the UI, stores resources in MongoDB, and talks to the edge agents over gRPC. The Control-Plane serves xDS (ADS) to the Envoys. You run one control-plane variant per Envoy version, and the Registry sends each proxy to the variant that matches the version it reports, so a proxy only ever receives configuration built for its own version.',
          'When you publish, the controller rebuilds the snapshot and the control plane pushes it. The Snapshot Dump view shows the exact payload a connected node was served, which is the quickest way to confirm that a publish landed.',
        ] },
        { q: 'Does it run Envoy on VMs and bare metal, without Kubernetes?', a: [
          'Yes. Envoy runs on Linux hosts managed by elchi-client (Ubuntu 24.04, amd64). The agent registers with the controller, downloads the Envoy versions you choose, and runs each deployed listener as its own Envoy process under systemd. A listener upgrade to a newer Envoy version uses Envoy’s hot restart; in Elchi’s end-to-end test suite, an upgrade under a steady 20 requests per second dropped 0 requests.',
          'The control plane installs on Kubernetes with Helm, on Docker Swarm, or as systemd services on one, two, or three or more Linux VMs with no Kubernetes and no Docker. For two-box redundancy at the edge, Elchi OS appliances form active/passive pairs that share VIPs.',
        ] },
        { q: 'Should we build our own control plane on go-control-plane instead?', a: [
          'go-control-plane is the Envoy project’s Go library for writing an xDS server, and Elchi’s control plane is built on it, using a variant pinned to each Envoy version. The library gives you the xDS protocol and a snapshot cache. The rest is yours to write: storing and versioning resources, validating them before a push, a way for people to edit and review configuration, access control and an audit trail, a separate build for each Envoy release you run, and the agent that installs and upgrades Envoy on hosts.',
          'A custom control plane is a good fit when configuration is generated entirely from another system, such as a service registry, and nobody edits it by hand. Elchi is aimed at teams that operate Envoy configuration directly and want those parts already built.',
        ] },
        { q: 'What happens to traffic when the control plane is unavailable?', a: [
          'The proxies keep serving. Envoy keeps the last configuration it received while its xDS stream is down and resubscribes when the control plane is back; what stops is the delivery of new changes. Controllers and control planes can run as several instances that share one MongoDB and elect a leader for scheduled work, and edge HA pairs keep failing over even while the control plane is down.',
        ] },
        { q: 'What are the limits of Elchi Core?', a: [
          'The edge agent runs on Ubuntu 24.04 on amd64. Each Envoy version you run needs a matching control-plane variant, so you can deploy the versions Elchi publishes builds for. HA pairs need Elchi OS appliances; a client installed on a general-purpose Linux host cannot join a pair. Elchi does not inject sidecars into Kubernetes pods: Kubernetes discovery keeps Endpoint resources in sync with cluster node IPs, NodePort-style, for Envoys that run outside or at the edge of the cluster.',
        ] },
      ],
      flow: {
        title: 'How a change reaches Envoy',
        steps: [
          { t: 'Configure', d: 'Build resources in visual editors generated from Envoy protos.' },
          { t: 'Validate', d: 'Two-step validation catches errors before anything ships.' },
          { t: 'Publish', d: 'xDS push to every subscribed Envoy, recorded in the audit log.' },
          { t: 'Operate', d: 'The agent upgrades, monitors, and restarts Envoy on your edge hosts.' },
        ],
      },
      qa: {
        title: 'Questions about Elchi Core',
        items: [
          { q: 'Does a published change restart Envoy?', a: 'No. Configuration changes arrive over xDS and apply live. A restart happens only when the Envoy binary changes, for example in a listener upgrade, and then Envoy’s hot restart hands the listening sockets to the new process.' },
          { q: 'Can I see exactly what a proxy was sent?', a: 'Yes. Snapshot Dump shows the xDS payload the control plane streamed to a connected node (Registry → Control Planes → Details).' },
          { q: 'Can scripts and CI pipelines drive it?', a: 'Yes. The automation API is a versioned REST API with project API tokens. It can take an upstream endpoint out of rotation across a project and switch an EDS cluster to other endpoints for a blue/green release.' },
        ],
      },
    },
    tr: {
      metaName: 'Elchi Core',
      tag: 'ELCHI CORE',
      title1: 'Elchi Core:',
      title2: 'tüm Envoy kaynakları, tek control plane.',
      subtitle: 'Elchi platformunun temeli: tüm Envoy filonuz için görsel bir control plane — tam xDS, yan yana birden çok sürüm, denetim kaydıyla taslak/kaydet/yayınla ve Envoy\'u sunucularınızda çalıştıran edge agent.',
      badges: ['Tam xDS Protokolü', 'Çok Sürümlü Envoy', 'Edge Agent', 'RBAC & Çok Kiracılılık'],
      positioning: 'Elchi Core her kurulumun temelidir. Diğer tüm Elchi ürünleri ona eklenti (add-on) olarak bağlanır.',
      what: {
        q: 'Elchi Core nedir?',
        p: 'Elchi Core, önünde bir web arayüzü bulunan, Envoy proxy filoları için bir control plane’dir. Listener, route, virtual host, cluster, endpoint, secret, filter ve bootstrap’i, çalıştırdığınız Envoy sürümünün protobuf şemasından üretilen formlarda düzenlersiniz; her değişiklik kaydedilmeden önce editörde ve sunucuda olmak üzere iki kez doğrulanır. Yayınlamak yeni bir xDS snapshot’ı oluşturur ve control plane bunu ADS üzerinden abone Envoy’lara akıtır; değişiklik yeniden başlatma olmadan devreye girer. Her edge sunucuda küçük bir agent olan elchi-client Envoy’u kurar, deploy edilen her listener’ı ayrı bir systemd servisi olarak çalıştırır ve controller’ın gönderdiği yükseltme ve ağ değişikliklerini uygular. Core her Elchi kurulumunun parçasıdır; API Security, API Discovery ve GSLB eklentileri ona bağlanır. Lisans olmadan ücretsiz seviye, Core’u bir yönetilen client ile çalıştırır.',
      },
      capsTitle: 'Elchi Core neleri yönetir',
      shotsTitle: 'Arayüzde Elchi Core',
      caps: [
        { t: 'Eksiksiz Envoy kaynak yönetimi', d: 'Listener, route, virtual host, cluster, endpoint, TLS secret, filter, extension ve bootstrap — Envoy protobuf\'larından üretilen arayüz ve tip kontrollü doğrulama.' },
        { t: 'Tam xDS protokol desteği', d: 'ADS, CDS, EDS, LDS, RDS ve VHDS; artımlı güncellemeler için delta xDS.' },
        { t: 'Çok sürümlü filo', d: 'Birden fazla Envoy sürümünü sürüm başına control-plane\'lerle yan yana çalıştırın. Listener yükseltmesiyle bir listener\'ı bağımlılıklarıyla birlikte daha yeni bir sürüme taşıyın.' },
        { t: 'Kaydet & yayınla iş akışı', d: 'Değişiklikleri taslakta hazırlayın, iki kez doğrulayın (editörde ve sunucuda), birlikte yayınlayın, her değişikliği denetim kaydında izleyin.' },
        { t: 'Edge agent (elchi-client)', d: 'Envoy\'u systemd servisi olarak kurar ve yönetir, Envoy hot restart ile yükseltir; BGP/FRR, netplan ağ yönetimi ve log aktarımını üstlenir.' },
        { t: 'Edge HA çiftleri', d: 'İki Elchi OS cihazı VIP\'leri aktif/pasif paylaşır: standby aynı Envoy\'ları sıcak çalıştırır ve yaklaşık iki saniyede devralır, planlı failover milisaniyeler sürer. Gratuitous ARP ile düz L2\'de çalışır; BGP isteğe bağlıdır, BGP üzerinde hızlı failover için BFD kullanılır.' },
        { t: 'Bağımlılık grafiği & route haritası', d: 'Kaynak ilişkilerinin ve route-cluster yollarının etkileşimli görünümleriyle sorun giderme.' },
        { t: 'Senaryolar, şablonlar & snippet\'ler', d: 'API gateway, load balancer ve mesh kurulumları için rehberli sihirbazlar ve yeniden kullanılabilir yapılandırma kütüphanesi.' },
        { t: 'Çoklu proje & RBAC', d: '4 katmanlı roller (Owner, Admin, Editor, Viewer), LDAP/Active Directory, 2FA ve her değişikliğin denetim iziyle proje bazlı izolasyon.' },
        { t: 'Yerleşik gözlemlenebilirlik', d: 'Metrik panoları, canlı servis logları, Grafana entegrasyonu ve uzun süren işlemlerin fazını ve loglarını gösteren arka plan iş motoru.' },
        { t: 'Canlı trafik görünümü', d: 'Bir listener\'ı çalışırken izleyin: access log\'dan örneklenen istekler connection manager, domain, route, cluster ve endpoint\'ler üzerinden akar; oranlar, p99 ve 5xx kaynağı 5 saniyede bir metriklerden gelir.' },
        { t: 'Sorunlar tek bakışta', d: 'Bakılması gereken her şey tek raporda, en kötüsü önce: proxy\'nin reddettiği yapılandırma, başarısız ya da takılan işler, çevrimdışı client\'lar, ACME ve GSLB sorunları, kırık referanslar ve süresi dolan sertifikalar.' },
        { t: 'Yapılandırma raporları', d: 'Trafik haritası, domain\'ler, sertifikalar, filter chain bazında güvenlik, kullanılmayan kaynaklar, filo ve değişiklikler — her isim kaynağına bağlanır, her rapor CSV ya da JSON olarak dışa aktarılır.' },
      ],
      also: {
        title: 'Core\'a dahil diğer yetenekler',
        items: ['ACME sertifikaları (Let\'s Encrypt & Google Trust, DNS-01)', 'Kubernetes endpoint keşfi', 'AI destekli yapılandırma & log analizi', 'Tehdit istihbaratı & GeoIP zenginleştirme', 'Registry HA & leader election', 'Yedekleme, geri yükleme & bakım araçları', 'Client başına ağ ve BGP yönetimi', 'OpenStack bulut entegrasyonu', 'Form araçları: regex test, sertifika inceleme, anahtar üreticiler'],
      },
      evaluate: [
        { q: 'Elchi Core proxy’lere nasıl ulaşır?', a: [
          'Backend üç süreçten oluşur. Controller REST API’yi ve arayüzü sunar, kaynakları MongoDB’de tutar ve edge agent’larla gRPC üzerinden konuşur. Control-Plane, Envoy’lara xDS (ADS) sunar. Her Envoy sürümü için bir control-plane varyantı çalıştırırsınız; Registry her proxy’yi bildirdiği sürüme uyan varyanta yönlendirir, böylece bir proxy yalnızca kendi sürümü için üretilmiş yapılandırmayı alır.',
          'Yayınladığınızda controller snapshot’ı yeniden oluşturur ve control plane onu iletir. Snapshot Dump görünümü bağlı bir node’a gönderilen payload’un birebir kendisini gösterir; bir yayının ulaştığını doğrulamanın en hızlı yolu budur.',
        ] },
        { q: 'Envoy’u Kubernetes olmadan, VM ve bare metal üzerinde çalıştırır mı?', a: [
          'Evet. Envoy, elchi-client’ın yönettiği Linux sunucularda (Ubuntu 24.04, amd64) çalışır. Agent controller’a kaydolur, seçtiğiniz Envoy sürümlerini indirir ve deploy edilen her listener’ı systemd altında ayrı bir Envoy süreci olarak çalıştırır. Bir listener’ı daha yeni bir Envoy sürümüne yükseltmek Envoy’un hot restart’ını kullanır; Elchi’nin uçtan uca test paketinde saniyede sabit 20 istek altında yapılan bir yükseltmede 0 istek kaybedildi.',
          'Control plane Kubernetes üzerinde Helm ile, Docker Swarm ile ya da Kubernetes ve Docker olmadan bir, iki veya üç ve daha fazla Linux VM üzerinde systemd servisleri olarak kurulur. Edge’de iki cihazlı yedeklilik için Elchi OS appliance’ları VIP paylaşan aktif/pasif çiftler oluşturur.',
        ] },
        { q: 'Kendi control plane’imizi go-control-plane üzerine mi kurmalıyız?', a: [
          'go-control-plane, Envoy projesinin xDS sunucusu yazmak için sunduğu Go kütüphanesidir ve Elchi’nin control plane’i, her Envoy sürümüne sabitlenmiş bir varyantıyla bunun üzerine kuruludur. Kütüphane size xDS protokolünü ve bir snapshot önbelleğini verir. Gerisini sizin yazmanız gerekir: kaynakları saklamak ve sürümlemek, göndermeden önce doğrulamak, insanların yapılandırmayı düzenleyip gözden geçirebileceği bir arayüz, erişim kontrolü ve denetim izi, çalıştırdığınız her Envoy sürümü için ayrı bir derleme ve Envoy’u sunuculara kurup yükselten agent.',
          'Yapılandırma tamamen başka bir sistemden, örneğin bir servis kayıt defterinden üretiliyorsa ve kimse elle düzenlemiyorsa özel bir control plane iyi bir seçimdir. Elchi, Envoy yapılandırmasını doğrudan işleten ve bu parçaları hazır isteyen ekipler içindir.',
        ] },
        { q: 'Control plane erişilemez olduğunda trafiğe ne olur?', a: [
          'Proxy’ler hizmet vermeye devam eder. Envoy, xDS akışı kopukken aldığı son yapılandırmayı korur ve control plane geri geldiğinde yeniden abone olur; duran şey yeni değişikliklerin iletilmesidir. Controller’lar ve control plane’ler tek bir MongoDB’yi paylaşan ve zamanlanmış işler için lider seçen birden çok instance olarak çalışabilir; edge HA çiftleri control plane kapalıyken bile failover yapmaya devam eder.',
        ] },
        { q: 'Elchi Core’un sınırları neler?', a: [
          'Edge agent amd64 üzerinde Ubuntu 24.04’te çalışır. Çalıştırdığınız her Envoy sürümü için uyumlu bir control-plane varyantı gerekir; yani Elchi’nin derleme yayınladığı sürümleri deploy edebilirsiniz. HA çiftleri Elchi OS appliance’ı gerektirir; genel amaçlı bir Linux sunucuya kurulan client bir çifte katılamaz. Elchi Kubernetes pod’larına sidecar enjekte etmez: Kubernetes keşfi, cluster dışında ya da kenarında çalışan Envoy’lar için Endpoint kaynaklarını NodePort tarzında cluster node IP’leriyle senkron tutar.',
        ] },
      ],
      flow: {
        title: 'Bir değişiklik Envoy’a nasıl ulaşır',
        steps: [
          { t: 'Yapılandır', d: 'Envoy proto\'larından üretilen görsel editörlerle kaynakları oluşturun.' },
          { t: 'Doğrula', d: 'İki aşamalı doğrulama hataları yayına çıkmadan yakalar.' },
          { t: 'Yayınla', d: 'Abone tüm Envoy\'lara xDS gönderimi, denetim kaydına işlenir.' },
          { t: 'İşlet', d: 'Agent edge sunucularınızda Envoy\'u yükseltir, izler ve yeniden başlatır.' },
        ],
      },
      qa: {
        title: 'Elchi Core hakkında sorular',
        items: [
          { q: 'Yayınlanan bir değişiklik Envoy’u yeniden başlatır mı?', a: 'Hayır. Yapılandırma değişiklikleri xDS ile gelir ve canlı uygulanır. Yeniden başlatma yalnızca Envoy binary’si değiştiğinde, örneğin bir listener yükseltmesinde olur; o zaman da Envoy’un hot restart’ı dinleyen soketleri yeni sürece devreder.' },
          { q: 'Bir proxy’ye tam olarak ne gönderildiğini görebilir miyim?', a: 'Evet. Snapshot Dump, control plane’in bağlı bir node’a akıttığı xDS payload’unu gösterir (Registry → Control Planes → Details).' },
          { q: 'Script’ler ve CI pipeline’ları onu yönetebilir mi?', a: 'Evet. Automation API, proje API token’larıyla çalışan sürümlü bir REST API’dir. Bir upstream endpoint’i tüm projede trafikten çıkarabilir ve blue/green sürüm için bir EDS cluster’ını başka endpoint’lere geçirebilir.' },
        ],
      },
    },
  },

  'api-security': {
    accent: '#f43f5e',
    docs: '/docs/shield/overview',
    related: ['api-discovery'],
    shots: ['shield-overview', 'shield-events', 'shield-policy'],
    guides: [
      { href: '/docs/shield/overview', en: 'Shield overview and engine catalog', tr: 'Shield genel bakış ve engine kataloğu' },
      { href: '/docs/guides/add-waf-to-envoy-ext-proc', en: 'Guide: add a WAF (OWASP CRS) to Envoy with ext_proc', tr: 'Rehber: ext_proc ile Envoy’a WAF (OWASP CRS) ekleme' },
      { href: '/docs/tutorials/secure-an-api-with-shield', en: 'Tutorial: secure an API with Shield', tr: 'Eğitim: Shield ile bir API’yi koruma' },
      { href: '/docs/shield/how-it-works', en: 'How Shield works: the request pipeline', tr: 'Shield nasıl çalışır: istek pipeline’ı' },
      { href: '/docs/shield/envoy-wiring', en: 'Wiring Shield into Envoy', tr: 'Shield’ı Envoy’a bağlama' },
      { href: '/docs/shield/engines/coraza-waf', en: 'Coraza WAF: CRS, paranoia levels, tuning', tr: 'Coraza WAF: CRS, paranoya seviyeleri, ayar' },
      { href: '/docs/administration/sizing-and-capacity', en: 'Sizing and capacity', tr: 'Boyutlandırma ve kapasite' },
    ],
    en: {
      metaName: 'Elchi API Security',
      tag: 'ELCHI API SECURITY · SHIELD',
      title1: 'Elchi API Security:',
      title2: 'WAF and API protection at the edge.',
      subtitle: 'Shield is an ext_proc sidecar next to each Envoy: authentication, rate limiting, bot defense, data-loss prevention and a WAF built on Coraza and the OWASP Core Rule Set, composed per route and rolled out from detect to block.',
      badges: ['12 Security Engines', 'Built-in DLP', 'OWASP CRS WAF', 'Detect → Shadow → Block'],
      positioning: 'Add-on to Elchi Core. Deployed and configured centrally, enforced locally on every edge host — traffic never leaves the box.',
      what: {
        q: 'What is Elchi API Security?',
        p: 'Elchi API Security is a web application firewall and API security layer for Envoy. Its engine, Shield (elchi-shield), runs as a sidecar process on every edge host and plugs into Envoy through the External Processing (ext_proc) HTTP filter. Envoy streams each request’s headers, and the body when a policy asks for it, to Shield over a local Unix domain socket, and Shield answers allow, block (403) or record-only before the request reaches your backend. A policy can combine 12 engines: JWT, JWKS, API keys, HMAC signing, RFC 9421 HTTP signatures, mTLS identity, IP reputation, rate limiting, bot detection, GraphQL limits, OpenAPI validation and Coraza with the OWASP Core Rule Set embedded in the binary. DLP runs alongside them as a built-in body check. Policies are written per host and route in the UI, delivered to the edges as files and hot-reloaded. Inspection happens on the edge host.',
      },
      capsTitle: 'What Shield enforces',
      shotsTitle: 'Shield policies and security events in the UI',
      caps: [
        { t: 'Authentication engines', d: 'JWT and JWKS (remote keys refreshed in the background), API keys with SHA-256 hashing and scopes, HMAC request signing including RFC 9421, and mTLS client-certificate checks.' },
        { t: 'Rate limiting', d: 'Token-bucket limits keyed by IP, host, or any header — requests per second plus burst, per route.' },
        { t: 'Bot & scanner defense', d: 'Layered scoring over User-Agent heuristics, verified-crawler feeds, JA3/JA4 TLS fingerprints, and header-anomaly detection.' },
        { t: 'IP reputation & GeoIP', d: 'Threat-intel feeds with severity, static CIDR allow/deny lists, and country or ASN blocking backed by GeoIP databases.' },
        { t: 'DLP & redaction', d: 'Detects credit cards (Luhn-validated), SSNs, JWTs, cloud keys, and tokens in requests and responses — block the call or mask the data in place.' },
        { t: 'Built-in WAF', d: 'Coraza with the OWASP Core Rule Set embedded in the Shield binary: paranoia levels 1–4, anomaly thresholds, and per-policy rule exclusions.' },
        { t: 'GraphQL & OpenAPI guard', d: 'Depth, complexity, and introspection limits for GraphQL; positive-security validation against your OpenAPI spec.' },
        { t: 'Safe rollout', d: 'Per-policy block / detect / shadow modes with fail-open or fail-close behavior, path excludes, and sampling.' },
        { t: 'Forensics & telemetry', d: 'Redacted-by-construction audit events streamed to the platform\'s event store or to OpenTelemetry, a live event feed in the UI, and Prometheus metrics.' },
      ],
      evaluate: [
        { q: 'How does Shield sit in the request path?', a: [
          'Turning on API Security for a listener’s HTTP connection manager adds an ext_proc filter at the head of the HTTP filter chain, ahead of the router. One ext_proc stream carries one HTTP transaction. Shield resolves the most specific policy for the host and route, runs the cheap header checks and the header-phase engines (JWT, API key, rate limit, IP reputation, bot) first, and buffers the body only when an engine or check needs it: the WAF, DLP, GraphQL or OpenAPI body validation.',
          'Verdicts combine as “most severe wins”. A block returns 403 to the client at once (429 for rate limits); everything else continues to the router.',
        ] },
        { q: 'What does Shield need to run?', a: [
          'A Linux edge host with Envoy. The elchi-client installer installs Shield in the same run as a hardened systemd service listening on /run/elchi-shield/extproc.sock; hosts that run Envoy without elchi-client can use the standalone Shield installer. Shield’s management endpoint is loopback-only, and non-loopback TCP binds are refused by default.',
          'Security events go to the platform’s event store (ClickHouse) or to OpenTelemetry. Shield’s cost is set mostly by the ext_proc round trip and by body buffering, not by the engines, so the sizing guide recommends enabling body inspection only on the routes that need it.',
        ] },
        { q: 'What happens when the sidecar is down or an engine fails?', a: [
          'Two settings decide this. On the Envoy side, the ext_proc filter Elchi sets up for Shield has failure_mode_allow: true, so if the Shield process is down or the gRPC call fails, requests continue uninspected instead of failing. Set it to false only if you prefer an outage to unprotected traffic.',
          'Inside Shield, each policy declares fail_open or fail_close for engine errors and timeouts, and the default when no policy matches is fail-open. A missing or invalid credential is a normal block in either posture. A panic inside an engine is recovered at the stream boundary, and an invalid configuration file is rejected while the last valid one stays active.',
        ] },
        { q: 'How do we tune the WAF without blocking real users?', a: [
          'Every policy has a mode: block, detect, shadow or off. Detect and shadow evaluate everything and record what would have been blocked without changing traffic, so a new policy can run against live requests first. The CRS paranoia level is set per policy from 1 to 4, and detection_paranoia_level runs stricter rules in record-only mode while blocking at the lower level. Noisy rules go into exclude_rule_ids.',
          'The CRS version is compiled into the Shield binary. WAF Studio shows, for the version your edges run, which common legitimate requests each paranoia level blocks, measured with Shield’s own engine.',
        ] },
        { q: 'What are the limits of Shield?', a: [
          'Shield inspects HTTP traffic that passes through Envoy’s HTTP connection manager; listeners that only run a TCP proxy are not inspected. Body inspection is opt-in per policy and capped: a body over the cap, or one that cannot be decoded (Brotli or stacked encodings), is blocked rather than passed on uninspected. The CRS version changes only with a Shield binary upgrade. Elchi publishes no general latency figure for Shield; the sizing guide reports relative throughput measured on one machine and asks you to measure on your own hardware.',
        ] },
      ],
      flow: {
        title: 'From discovery to enforcement',
        steps: [
          { t: 'Discover', d: 'Import endpoints and risks straight from API Discovery.' },
          { t: 'Compose', d: 'Build policies per domain and route in the visual builder.' },
          { t: 'Roll out', d: 'Start in detect, verify in shadow, then switch to block.' },
          { t: 'Watch', d: 'Follow verdicts live in the security event feed.' },
        ],
      },
      qa: {
        title: 'Questions about Elchi API Security',
        items: [
          { q: 'Does traffic leave the host to be inspected?', a: 'No. Envoy and Shield talk over a local socket on the same host. Only redacted audit events and metrics leave the box.' },
          { q: 'Which CRS version does Shield run?', a: 'The one embedded in the Shield binary on each edge. Shield reports it in /configz and in the build_info metric, and WAF Studio pins its rule library to the version your edges run.' },
          { q: 'Can different routes have different rules?', a: 'Yes. Policies match by host (exact, wildcard, default) and by route (exact path, regex, longest prefix), so a payments API can run a stricter paranoia level than the rest and a health check can skip inspection.' },
        ],
      },
    },
    tr: {
      metaName: 'Elchi API Security',
      tag: 'ELCHI API SECURITY · SHIELD',
      title1: 'Elchi API Security:',
      title2: 'edge’de WAF ve API koruması.',
      subtitle: 'Shield, her Envoy\'un yanında çalışan bir ext_proc sidecar\'ıdır: kimlik doğrulama, rate limiting, bot savunması, veri sızıntısı önleme ve Coraza ile OWASP Core Rule Set üzerine kurulu WAF — route başına birleştirilir, detect\'ten block\'a kademeli yayılır.',
      badges: ['12 Güvenlik Engine\'i', 'Yerleşik DLP', 'OWASP CRS WAF', 'Detect → Shadow → Block'],
      positioning: 'Elchi Core eklentisidir. Merkezden dağıtılır ve yönetilir, her edge sunucuda yerel olarak uygulanır — trafik makineden dışarı çıkmaz.',
      what: {
        q: 'Elchi API Security nedir?',
        p: 'Elchi API Security, Envoy için bir web application firewall ve API güvenlik katmanıdır. Motoru Shield (elchi-shield), her edge sunucuda sidecar süreci olarak çalışır ve Envoy’a External Processing (ext_proc) HTTP filter’ı üzerinden bağlanır. Envoy her isteğin header’larını, policy istediğinde de gövdesini yerel bir Unix domain socket üzerinden Shield’a iletir; Shield istek backend’e ulaşmadan allow, block (403) ya da yalnızca kayıt kararı döner. Bir policy 12 engine’i birleştirebilir: JWT, JWKS, API key, HMAC imzalama, RFC 9421 HTTP imzaları, mTLS kimliği, IP itibarı, rate limiting, bot tespiti, GraphQL sınırları, OpenAPI doğrulaması ve OWASP Core Rule Set’i binary’ye gömülü Coraza. DLP bunların yanında yerleşik bir gövde kontrolü olarak çalışır. Policy’ler arayüzde host ve route başına yazılır, edge’lere dosya olarak iletilir ve anlık yeniden yüklenir. İnceleme edge sunucunun üzerinde yapılır.',
      },
      capsTitle: 'Shield neleri uygular',
      shotsTitle: 'Arayüzde Shield policy’leri ve güvenlik olayları',
      caps: [
        { t: 'Kimlik doğrulama engine\'leri', d: 'JWT ve JWKS (uzak anahtarlar arka planda yenilenir), SHA-256 ile saklanan scope\'lu API key\'ler, RFC 9421 dahil HMAC istek imzalama ve mTLS istemci sertifikası kontrolleri.' },
        { t: 'Rate limiting', d: 'IP, host veya herhangi bir header\'a göre anahtarlanan token-bucket limitleri — route başına saniyelik istek + burst.' },
        { t: 'Bot & tarayıcı savunması', d: 'User-Agent sezgileri, doğrulanmış crawler beslemeleri, JA3/JA4 TLS parmak izleri ve header anomali tespiti üzerinde katmanlı puanlama.' },
        { t: 'IP itibarı & GeoIP', d: 'Önem dereceli tehdit istihbaratı beslemeleri, statik CIDR izin/engel listeleri ve GeoIP veritabanı destekli ülke veya ASN engelleme.' },
        { t: 'DLP & maskeleme', d: 'İstek ve yanıtlarda kredi kartı (Luhn doğrulamalı), SSN, JWT, bulut anahtarları ve token tespiti — çağrıyı engelleyin ya da veriyi yerinde maskeleyin.' },
        { t: 'Yerleşik WAF', d: 'OWASP Core Rule Set’i Shield binary’sine gömülü Coraza: 1–4 paranoya seviyeleri, anomali eşikleri ve policy başına kural istisnaları.' },
        { t: 'GraphQL & OpenAPI koruması', d: 'GraphQL için derinlik, karmaşıklık ve introspection sınırları; OpenAPI spesifikasyonunuza karşı pozitif güvenlik doğrulaması.' },
        { t: 'Güvenli yayılım', d: 'Policy başına block / detect / shadow modları, fail-open veya fail-close davranışı, path istisnaları ve örnekleme.' },
        { t: 'Adli kayıt & telemetri', d: 'Tasarımı gereği maskelenmiş denetim olayları platformun olay deposuna veya OpenTelemetry\'ye akar; arayüzde canlı olay akışı, Prometheus metrikleri.' },
      ],
      evaluate: [
        { q: 'Shield istek yolunda nerede durur?', a: [
          'Bir listener’ın HTTP connection manager’ında API Security’yi açmak, HTTP filter zincirinin başına, router’dan önce bir ext_proc filter’ı ekler. Bir ext_proc akışı bir HTTP işlemini taşır. Shield host ve route için en özel policy’yi bulur, önce ucuz header kontrollerini ve header aşaması engine’lerini (JWT, API key, rate limit, IP itibarı, bot) çalıştırır; gövdeyi yalnızca bir engine ya da kontrol ihtiyaç duyduğunda buffer’lar: WAF, DLP, GraphQL ya da OpenAPI gövde doğrulaması.',
          'Kararlar “en ağır olan kazanır” kuralıyla birleşir. Block istemciye anında 403 döner (rate limit için 429); geri kalan her şey router’a devam eder.',
        ] },
        { q: 'Shield’ın çalışması için ne gerekir?', a: [
          'Envoy çalışan bir Linux edge sunucu. elchi-client kurucusu Shield’ı aynı çalıştırmada, /run/elchi-shield/extproc.sock üzerinde dinleyen sertleştirilmiş bir systemd servisi olarak kurar; Envoy’u elchi-client olmadan çalıştıran sunucular bağımsız Shield kurucusunu kullanabilir. Shield’ın yönetim endpoint’i yalnızca loopback’tedir ve loopback dışı TCP bind’leri varsayılan olarak reddedilir.',
          'Güvenlik olayları platformun olay deposuna (ClickHouse) ya da OpenTelemetry’ye gider. Shield’ın maliyetini engine’ler değil, çoğunlukla ext_proc gidiş-dönüşü ve gövde buffer’lama belirler; bu yüzden boyutlandırma rehberi gövde incelemesini yalnızca gereken route’larda açmayı önerir.',
        ] },
        { q: 'Sidecar kapalıysa ya da bir engine hata verirse ne olur?', a: [
          'Bunu iki ayar belirler. Envoy tarafında, Elchi’nin Shield için kurduğu ext_proc filter’ında failure_mode_allow: true vardır; Shield süreci kapalıysa ya da gRPC çağrısı başarısız olursa istekler hata vermek yerine incelenmeden devam eder. Korumasız trafik yerine kesintiyi tercih ediyorsanız bunu false yapın.',
          'Shield’ın içinde her policy, engine hataları ve zaman aşımları için fail_open ya da fail_close belirtir; hiçbir policy eşleşmediğinde varsayılan fail-open’dır. Eksik ya da geçersiz bir kimlik bilgisi her iki duruşta da normal bir block’tur. Bir engine içindeki panic akış sınırında yakalanır; geçersiz bir yapılandırma dosyası reddedilir ve son geçerli yapılandırma devrede kalır.',
        ] },
        { q: 'Gerçek kullanıcıları engellemeden WAF’ı nasıl ayarlarız?', a: [
          'Her policy’nin bir modu vardır: block, detect, shadow ya da off. Detect ve shadow her şeyi değerlendirir ve trafiği değiştirmeden neyin engelleneceğini kaydeder; böylece yeni bir policy önce canlı isteklere karşı çalışabilir. CRS paranoya seviyesi policy başına 1’den 4’e ayarlanır; detection_paranoia_level daha katı kuralları yalnızca kayıt modunda çalıştırırken düşük seviyede engeller. Gürültülü kurallar exclude_rule_ids’e eklenir.',
          'CRS sürümü Shield binary’sine derlenmiştir. WAF Studio, edge’lerinizin çalıştırdığı sürüm için her paranoya seviyesinin hangi yaygın meşru istekleri engellediğini, Shield’ın kendi engine’iyle ölçülmüş olarak gösterir.',
        ] },
        { q: 'Shield’ın sınırları neler?', a: [
          'Shield, Envoy’un HTTP connection manager’ından geçen HTTP trafiğini inceler; yalnızca TCP proxy çalıştıran listener’lar incelenmez. Gövde incelemesi policy başına isteğe bağlıdır ve sınırlıdır: sınırı aşan ya da çözülemeyen (Brotli veya üst üste encoding) bir gövde incelenmeden geçirilmez, engellenir. CRS sürümü yalnızca Shield binary yükseltmesiyle değişir. Elchi, Shield için genel bir gecikme rakamı yayınlamaz; boyutlandırma rehberi tek bir makinede ölçülen göreli throughput değerlerini verir ve kendi donanımınızda ölçmenizi ister.',
        ] },
      ],
      flow: {
        title: 'Keşiften uygulamaya',
        steps: [
          { t: 'Keşfet', d: 'Endpoint\'leri ve riskleri doğrudan API Discovery\'den içe aktarın.' },
          { t: 'Birleştir', d: 'Görsel builder\'da domain ve route başına policy kurun.' },
          { t: 'Yay', d: 'Detect\'te başlayın, shadow\'da doğrulayın, block\'a geçin.' },
          { t: 'İzle', d: 'Kararları canlı güvenlik olay akışından takip edin.' },
        ],
      },
      qa: {
        title: 'Elchi API Security hakkında sorular',
        items: [
          { q: 'Trafik incelenmek için sunucudan çıkar mı?', a: 'Hayır. Envoy ve Shield aynı sunucuda yerel bir soket üzerinden konuşur. Sunucudan yalnızca maskelenmiş denetim olayları ve metrikler çıkar.' },
          { q: 'Shield hangi CRS sürümünü çalıştırır?', a: 'Her edge’deki Shield binary’sine gömülü olanı. Shield bunu /configz’de ve build_info metriğinde bildirir; WAF Studio kural kütüphanesini edge’lerinizin çalıştırdığı sürüme sabitler.' },
          { q: 'Farklı route’lar farklı kurallar kullanabilir mi?', a: 'Evet. Policy’ler host’a (tam, wildcard, varsayılan) ve route’a (tam path, regex, en uzun önek) göre eşleşir; böylece bir ödeme API’si diğerlerinden daha katı bir paranoya seviyesi çalıştırabilir, bir health check incelemeyi atlayabilir.' },
        ],
      },
    },
  },

  'api-discovery': {
    accent: '#6366f1',
    docs: '/docs/api-discovery/overview',
    related: ['api-security'],
    shots: ['api-discovery', 'api-endpoints'],
    guides: [
      { href: '/docs/api-discovery/overview', en: 'API Discovery overview and data flow', tr: 'API Discovery genel bakış ve veri akışı' },
      { href: '/docs/guides/find-shadow-apis-envoy-access-logs', en: 'Guide: find shadow APIs from Envoy access logs', tr: 'Rehber: Envoy access log’larından shadow API bulma' },
      { href: '/docs/tutorials/api-inventory-in-one-day', en: 'Tutorial: an API inventory in one day', tr: 'Eğitim: bir günde API envanteri' },
      { href: '/docs/api-discovery/pii-and-auth', en: 'PII, auth and the metadata-only model', tr: 'PII, kimlik doğrulama ve yalnızca metadata modeli' },
      { href: '/docs/api-discovery/collector-reference', en: 'Collector reference', tr: 'Collector referansı' },
    ],
    en: {
      metaName: 'Elchi API Discovery',
      tag: 'ELCHI API DISCOVERY',
      title1: 'Elchi API Discovery:',
      title2: 'know every API you actually expose.',
      subtitle: 'Turns live traffic into a continuously scored API inventory: shadow endpoints, missing auth, PII in URLs, drift — with a one-click path from finding to protection.',
      badges: ['Zero Instrumentation', 'A–F Security Score', 'OpenAPI 3.0.3 Export', 'Drift Detection'],
      positioning: 'Add-on to Elchi Core. Built from Envoy access-log streams — no SDKs, no code changes, no traffic interception.',
      what: {
        q: 'What is Elchi API Discovery?',
        p: 'Elchi API Discovery builds an inventory of the API operations your Envoy proxies actually serve, from Envoy’s access logs. Each listener with discovery turned on sends Access Log Service (ALS v3) records over gRPC to elchi-collector, a central service shared by the fleet. The collector normalizes paths into operations such as GET /users/{id}, records which authentication schemes it saw, detects personal data in URLs, scores risk, and writes the catalog to MongoDB and per-event rows to ClickHouse. The UI shows the confirmed catalog apart from scanner noise, new and silent endpoints, operations that accepted anonymous traffic, coverage against the OpenAPI specs you import, and an OpenAPI 3.0.3 export of what it observed. Discovery is passive and reads metadata only: it is not in the request path and cannot block or slow a request. Findings can be turned into a draft API Security (Shield) policy.',
      },
      capsTitle: 'What the inventory shows',
      shotsTitle: 'The API inventory in the UI',
      caps: [
        { t: 'Traffic-based discovery', d: 'The inventory is built from Envoy access-log (ALS) streams. Path normalization turns IDs, UUIDs, and tokens into {placeholders}, letter+digit ids are learned per position; gRPC methods and GraphQL operations are separate operations.' },
        { t: 'Attack surface separation', d: 'Operations that matched a configured Envoy route are kept apart from scanner and probe noise, so the catalog stays clean while you still see what attackers are trying.' },
        { t: 'Auth coverage', d: 'Every endpoint is tagged with its observed auth schemes (JWT, mTLS, API key, Basic, session cookie), so accepted anonymous writes and inconsistently authenticated surfaces stand out.' },
        { t: 'PII inventory', d: 'Know which endpoints carry personal data in paths and query strings, by category — including Turkish national ids (TCKN) and mobile numbers — with per-detector switches and credential-in-URL detection.' },
        { t: 'Risk flags & scoring', d: 'Detectors with false-positive-first defaults flag BOLA, BFLA, brute force, weak TLS and more. Findings age from active to historical, endpoints get active threat and exposure scores, and the surface gets a 0–100 score with an A–F grade.' },
        { t: 'Drift & change detection', d: 'Daily snapshots and a change feed: new and removed operations, auth downgrades, new PII and flags, zombie resurrections and learned-template merges.' },
        { t: 'Consumers & enumeration', d: 'Per-consumer behavior with machine-vs-human classification and enumeration, scraping and auth-failure indicators — plus bot, scanner, geo / ASN and threat-intel views.' },
        { t: 'OpenAPI spec coverage', d: 'Import versioned OpenAPI / Swagger specs scoped to listeners, hosts and paths; see what is documented, undocumented, unused or drifting from its contract.' },
        { t: 'Ownership & teams', d: 'Assign teams, owners, criticality and data classes by rule or per endpoint, see risk per team, and export the catalog as CSV.' },
        { t: 'OpenAPI 3.0.3 export', d: 'Generate an OpenAPI spec from confirmed endpoints — paths, parameters, methods, status codes, and auth schemes reconstructed from real traffic.' },
        { t: 'One-click protection', d: 'Turn findings into a draft Elchi API Security policy: matching engines are pre-selected per endpoint with the rationale attached.' },
      ],
      evaluate: [
        { q: 'How does discovery get its data without touching requests?', a: [
          'It uses the access-log sink Envoy already has. When you enable api_discovery on a listener’s HTTP connection manager, Elchi wires an HTTP gRPC access-log sink to the collector, with the request and response headers the collector reads. Envoy buffers log records and flushes them in the background, so the request path does not wait on the collector. There is no ext_proc call, no SDK and no change to application code.',
          'Set use_remote_address and xff_num_trusted_hops on the listener so the recorded client IP is the real caller rather than the last proxy.',
        ] },
        { q: 'What does API Discovery need to run?', a: [
          'The elchi-collector service, MongoDB for the endpoint catalog and the collector’s runtime configuration, and ClickHouse for per-event rows and the time-series rollups behind the dashboards. The collector is stateless and scales out: the Helm chart runs three replicas by default, and ALS streams from the edges are balanced across them.',
          'Raw events are kept for 7 days by default; the catalog has no TTL. Path normalization rules, PII switches and detector thresholds live in one MongoDB document and reload without a restart.',
        ] },
        { q: 'What does it store, and what does it never store?', a: [
          'Only metadata. Request and response bodies are never shipped, because ALS carries none. Query-string values are not stored; only accepted parameter names are kept. Fourteen sensitive headers, among them Authorization, Cookie and X-Api-Key, are dropped before anything is persisted, and their presence is recorded as an observed auth scheme without the value. Client identifiers are hashed with a salt you set.',
        ] },
        { q: 'What are the limits of API Discovery?', a: [
          'The inventory only knows what has been called, so it needs a representative window, including nightly jobs and admin flows, before it is complete. PII detection looks at paths and query strings, not at headers or bodies. The catalog is bounded by a cardinality cap, 100,000 endpoints per collector by default. Discovery observes and scores but does not enforce: blocking and redaction belong to API Security (Shield), and the suggest-policy bridge creates a draft Shield policy from the findings.',
        ] },
      ],
      flow: {
        title: 'From access log to inventory',
        steps: [
          { t: 'Observe', d: 'Envoy streams access logs to the collector.' },
          { t: 'Normalize', d: 'Paths are normalized, enriched with GeoIP and threat intel.' },
          { t: 'Score', d: 'Detectors flag risk; endpoints and the whole surface get graded.' },
          { t: 'Act', d: 'Export OpenAPI or generate a Shield policy draft.' },
        ],
      },
      qa: {
        title: 'Questions about Elchi API Discovery',
        items: [
          { q: 'Does it cover gRPC and GraphQL?', a: 'Yes. gRPC methods and GraphQL operations (from the operation-name header) are kept as separate operations in the inventory.' },
          { q: 'How do I find shadow APIs?', a: 'Import your OpenAPI or Swagger specs with a scope (listener, host and path prefixes). Every confirmed operation inside a spec’s scope that matches no operation in it is marked Undocumented.' },
          { q: 'Can I export what it found?', a: 'Yes. Export OpenAPI downloads the confirmed inventory as an OpenAPI 3.0.3 document in YAML or JSON, filtered by listener and host, and the catalog also exports as CSV.' },
        ],
      },
    },
    tr: {
      metaName: 'Elchi API Discovery',
      tag: 'ELCHI API DISCOVERY',
      title1: 'Elchi API Discovery:',
      title2: 'gerçekte sunduğunuz her API’yi bilin.',
      subtitle: 'Canlı trafiği sürekli puanlanan bir API envanterine dönüştürür: shadow endpoint\'ler, eksik kimlik doğrulama, URL\'lerdeki PII, sapma — ve bulgudan korumaya tek tıkla giden yol.',
      badges: ['Sıfır Enstrümantasyon', 'A–F Güvenlik Notu', 'OpenAPI 3.0.3 Dışa Aktarım', 'Sapma Tespiti'],
      positioning: 'Elchi Core eklentisidir. Envoy access-log akışlarından beslenir — SDK yok, kod değişikliği yok, trafiğe müdahale yok.',
      what: {
        q: 'Elchi API Discovery nedir?',
        p: 'Elchi API Discovery, Envoy proxy’lerinizin gerçekte sunduğu API operasyonlarının envanterini Envoy’un access log’larından çıkarır. Keşfin açık olduğu her listener, Access Log Service (ALS v3) kayıtlarını gRPC ile filonun ortak kullandığı merkezi bir servis olan elchi-collector’a gönderir. Collector path’leri GET /users/{id} gibi operasyonlara normalize eder, gördüğü kimlik doğrulama şemalarını kaydeder, URL’lerdeki kişisel veriyi tespit eder, riski puanlar; kataloğu MongoDB’ye, olay bazlı satırları ClickHouse’a yazar. Arayüz doğrulanmış kataloğu tarayıcı gürültüsünden ayrı gösterir: yeni ve sessizleşen endpoint’ler, anonim trafik kabul eden operasyonlar, içe aktardığınız OpenAPI spec’lerine göre kapsam ve gözlemlenenlerin OpenAPI 3.0.3 dışa aktarımı. Keşif pasiftir ve yalnızca metadata okur: istek yolunda değildir, bir isteği engelleyemez ya da yavaşlatamaz. Bulgular taslak bir API Security (Shield) policy’sine dönüştürülebilir.',
      },
      capsTitle: 'Envanter neleri gösterir',
      shotsTitle: 'Arayüzde API envanteri',
      caps: [
        { t: 'Trafik tabanlı keşif', d: 'Envanter Envoy access-log (ALS) akışlarından oluşur. Path normalizasyonu ID, UUID ve token\'ları {placeholder}\'lara çevirir, harf+rakam ID\'leri konum bazında öğrenir; gRPC metodları ve GraphQL operasyonları ayrı operasyon olarak tutulur.' },
        { t: 'Saldırı yüzeyi ayrımı', d: 'Yapılandırılmış bir Envoy route\'uyla eşleşen operasyonlar tarayıcı ve probe gürültüsünden ayrı tutulur — katalogunuz temiz kalır, saldırganların ne denediğini yine de görürsünüz.' },
        { t: 'Kimlik doğrulama kapsamı', d: 'Her endpoint gözlemlenen auth şemalarıyla etiketlenir (JWT, mTLS, API key, Basic, oturum çerezi) — kimlik doğrulamasız kabul edilen yazma istekleri ve tutarsız doğrulamalı yüzeyler öne çıkar.' },
        { t: 'PII envanteri', d: 'Hangi endpoint\'in path ve query string\'inde hangi kategoride kişisel veri taşıdığını bilin — T.C. kimlik numarası (TCKN) ve cep telefonu numaraları dahil; dedektör bazında aç/kapa ve URL\'de kimlik bilgisi tespitiyle.' },
        { t: 'Risk bayrakları & puanlama', d: 'Yanlış pozitifi en aza indiren varsayılanlarla dedektörler BOLA, BFLA, brute force, zayıf TLS ve fazlasını işaretler. Eskiyen bulgular aktif görünümden geçmişe taşınır; endpoint\'ler aktif tehdit ve maruziyet puanı, tüm yüzey 0–100 puan ve A–F notu alır.' },
        { t: 'Sapma & değişiklik tespiti', d: 'Günlük snapshot\'lar ve değişiklik akışı: yeni ve kaldırılan operasyonlar, kimlik doğrulama gerilemeleri, yeni PII ve bayraklar, geri dönen zombie\'ler ve öğrenilmiş şablon birleştirmeleri.' },
        { t: 'Tüketiciler & numaralandırma', d: 'Makine/insan ayrımıyla tüketici bazlı davranış; numaralandırma (enumeration), kazıma (scraping) ve kimlik doğrulama hatası göstergeleri — ayrıca bot, tarayıcı, geo / ASN ve tehdit istihbaratı görünümleri.' },
        { t: 'OpenAPI spec kapsamı', d: 'Listener, host ve path\'e göre kapsamlanan, sürümlü OpenAPI / Swagger spec\'lerini içe aktarın; neyin belgelenmiş, belgelenmemiş, kullanılmayan ya da sözleşmesinden sapmış olduğunu görün.' },
        { t: 'Sahiplik & ekipler', d: 'Ekip, sahip, kritiklik ve veri sınıfını kuralla ya da endpoint bazında atayın, riski ekip bazında görün ve kataloğu CSV olarak dışa aktarın.' },
        { t: 'OpenAPI 3.0.3 dışa aktarımı', d: 'Doğrulanmış endpoint\'lerden OpenAPI spesifikasyonu üretin — path\'ler, parametreler, metodlar, durum kodları ve auth şemaları gerçek trafikten çıkarılır.' },
        { t: 'Tek tıkla koruma', d: 'Bulguları taslak bir Elchi API Security policy\'sine dönüştürün: uygun engine\'ler endpoint başına, gerekçesiyle birlikte önceden seçilir.' },
      ],
      evaluate: [
        { q: 'Keşif, isteklere dokunmadan veriyi nasıl alır?', a: [
          'Envoy’da zaten bulunan access-log sink’ini kullanır. Bir listener’ın HTTP connection manager’ında api_discovery’yi açtığınızda Elchi, collector’ın okuduğu istek ve yanıt header’larıyla birlikte collector’a bir HTTP gRPC access-log sink’i bağlar. Envoy log kayıtlarını buffer’lar ve arka planda gönderir; istek yolu collector’ı beklemez. ext_proc çağrısı, SDK ya da uygulama kodunda değişiklik yoktur.',
          'Kaydedilen istemci IP’sinin son proxy değil gerçek çağıran olması için listener’da use_remote_address ve xff_num_trusted_hops ayarlayın.',
        ] },
        { q: 'API Discovery’nin çalışması için ne gerekir?', a: [
          'elchi-collector servisi; endpoint kataloğu ve collector’ın çalışma zamanı yapılandırması için MongoDB; olay bazlı satırlar ve panoların dayandığı zaman serisi özetleri için ClickHouse. Collector durumsuzdur ve yatay ölçeklenir: Helm chart varsayılan olarak üç replika çalıştırır ve edge’lerden gelen ALS akışları bunlara dağıtılır.',
          'Ham olaylar varsayılan olarak 7 gün tutulur; kataloğun TTL’i yoktur. Path normalizasyon kuralları, PII anahtarları ve dedektör eşikleri tek bir MongoDB belgesinde durur ve yeniden başlatma olmadan yüklenir.',
        ] },
        { q: 'Neyi saklar, neyi asla saklamaz?', a: [
          'Yalnızca metadata. İstek ve yanıt gövdeleri asla gönderilmez, çünkü ALS gövde taşımaz. Query string değerleri saklanmaz; yalnızca kabul edilen parametre adları tutulur. Authorization, Cookie ve X-Api-Key dahil on dört hassas header hiçbir şey kalıcı hale gelmeden önce atılır; varlıkları değeri olmadan gözlemlenen bir auth şeması olarak kaydedilir. İstemci tanımlayıcıları sizin belirlediğiniz bir salt ile hash’lenir.',
        ] },
        { q: 'API Discovery’nin sınırları neler?', a: [
          'Envanter yalnızca çağrılmış olanı bilir; tamamlanmış sayılmadan önce gece işleri ve yönetim akışları dahil temsili bir süre gerekir. PII tespiti path’lere ve query string’lere bakar, header’lara ya da gövdelere bakmaz. Katalog bir kardinalite sınırıyla sınırlıdır: varsayılan olarak collector başına 100.000 endpoint. Keşif gözlemler ve puanlar ama uygulamaz: engelleme ve maskeleme API Security’nin (Shield) işidir; suggest-policy köprüsü bulgulardan taslak bir Shield policy’si oluşturur.',
        ] },
      ],
      flow: {
        title: 'Access log’dan envantere',
        steps: [
          { t: 'Gözlemle', d: 'Envoy, access loglarını collector\'a akıtır.' },
          { t: 'Normalize et', d: 'Path\'ler normalize edilir; GeoIP ve tehdit istihbaratıyla zenginleşir.' },
          { t: 'Puanla', d: 'Dedektörler riski işaretler; endpoint\'ler ve tüm yüzey notlanır.' },
          { t: 'Harekete geç', d: 'OpenAPI dışa aktarın ya da Shield policy taslağı üretin.' },
        ],
      },
      qa: {
        title: 'Elchi API Discovery hakkında sorular',
        items: [
          { q: 'gRPC ve GraphQL’i kapsar mı?', a: 'Evet. gRPC metodları ve GraphQL operasyonları (operation-name header’ından) envanterde ayrı operasyonlar olarak tutulur.' },
          { q: 'Shadow API’leri nasıl bulurum?', a: 'OpenAPI ya da Swagger spec’lerinizi bir kapsamla (listener, host ve path önekleri) içe aktarın. Bir spec’in kapsamına girip içindeki hiçbir operasyonla eşleşmeyen her doğrulanmış operasyon Undocumented olarak işaretlenir.' },
          { q: 'Bulduklarını dışa aktarabilir miyim?', a: 'Evet. Export OpenAPI, doğrulanmış envanteri listener ve host’a göre filtrelenmiş, YAML ya da JSON biçiminde bir OpenAPI 3.0.3 belgesi olarak indirir; katalog ayrıca CSV olarak da dışa aktarılır.' },
        ],
      },
    },
  },

  gslb: {
    accent: '#f59e0b',
    docs: '/docs/gslb/overview',
    related: ['core'],
    shots: ['gslb'],
    guides: [
      { href: '/docs/gslb/overview', en: 'GSLB overview', tr: 'GSLB genel bakış' },
      { href: '/docs/guides/gslb-dns-failover-envoy', en: 'Guide: GSLB and DNS failover for Envoy', tr: 'Rehber: Envoy için GSLB ve DNS failover' },
      { href: '/docs/gslb/health-model', en: 'Health model: probes, states, circuit breaker', tr: 'Sağlık modeli: problar, durumlar, circuit breaker' },
      { href: '/docs/gslb/records-and-ips', en: 'Records, IPs and regions', tr: 'Kayıtlar, IP’ler ve bölgeler' },
      { href: '/docs/gslb/nodes-coredns', en: 'elchi-coredns nodes and notify', tr: 'elchi-coredns düğümleri ve notify' },
    ],
    en: {
      metaName: 'Elchi GSLB',
      tag: 'ELCHI GSLB',
      title1: 'Elchi GSLB:',
      title2: 'DNS that follows your health.',
      subtitle: 'Authoritative DNS from elchi-coredns, driven by health checks the controller runs: unhealthy edges leave the answer, regions get nearby IPs, and a record with no healthy IP falls back to its failover name.',
      badges: ['CoreDNS Authoritative', 'HTTP/HTTPS/TCP Probes', 'Region-Scoped Answers', 'Sharded Health Checks'],
      positioning: 'Add-on to Elchi Core. Health state lives in the platform; CoreDNS nodes serve answers from versioned snapshots.',
      what: {
        q: 'What is Elchi GSLB?',
        p: 'Elchi GSLB is DNS-based global server load balancing for Envoy edges. A GSLB record maps a hostname to the IP addresses of the edges that serve it. The health checker inside the Elchi controller probes every IP over HTTP, HTTPS or TCP on its own schedule and moves it through four states: passing, warning, critical and recovery. elchi-coredns, a CoreDNS build with the Elchi GSLB plugin, serves the zone authoritatively from snapshots it polls from the controller, with critical and recovering IPs already removed. If every IP of a record is down, the answer points to the record’s failover name in a backup zone. IPs can carry region tags, so a regional DNS node answers with nearby edges. Records are created in the UI or through the REST API, or automatically when a client is deployed to a GSLB-enabled service.',
      },
      capsTitle: 'What Elchi GSLB does',
      shotsTitle: 'GSLB records and IP health in the UI',
      caps: [
        { t: 'Authoritative DNS via CoreDNS', d: 'GSLB nodes pull versioned zone snapshots (with incremental change feeds) over a per-zone secret-authenticated API and answer authoritatively.' },
        { t: 'Health probes everywhere', d: 'HTTP, HTTPS, and TCP probes with custom Host headers and skip-TLS-verify options; intervals from 10 seconds to 5 minutes.' },
        { t: 'Anti-flapping state machine', d: 'A quad-state model (PASSING → WARNING → CRITICAL → RECOVERY) with configurable thresholds keeps unstable endpoints from bouncing in and out of DNS.' },
        { t: 'Failover zones', d: 'When every IP behind a record is unhealthy, DNS answers with the record\'s failover FQDN in a backup zone.' },
        { t: 'Region-scoped answers', d: 'Tag IPs with regions; each regional DNS node serves only the healthy IPs tagged for its region. Place a DNS node per region to keep users on nearby endpoints.' },
        { t: 'Circuit-breaker probing', d: 'Failing IPs back off gradually, up to 12× the probe interval (at most 5 minutes), instead of hammering dead hosts; state transitions trigger immediate re-probes.' },
        { t: 'Record & IP management', d: 'CRUD with bulk operations, manual health overrides, per-IP history, and IPs created automatically from service deployments.' },
        { t: 'Sharded health checking', d: 'Health checks are sharded across controllers with lease-based ownership; when a controller fails, its shards move to the remaining controllers.' },
      ],
      evaluate: [
        { q: 'How does GSLB decide that an Envoy edge is down?', a: [
          'Each record has a probe: the type, port, path and Host header for HTTP, an interval from 10 to 300 seconds, a timeout from 0.1 to 3 seconds, and the accepted status codes. Consecutive failures move an IP from passing to warning at warning_threshold and to critical at critical_threshold. Only passing and warning IPs are served, so an IP leaves DNS when it reaches critical.',
          'Warning and recovery IPs are probed at half the interval. With passing_threshold above 1, a recovering IP stays out of DNS until it has that many consecutive successes, which keeps an unstable edge from flapping.',
        ] },
        { q: 'How long does a DNS failover take?', a: [
          'It is the sum of three parts, each set by your configuration. First, the time for the IP to reach critical_threshold failures (warning IPs are probed at half the interval). Second, propagation to the DNS nodes: elchi-coredns polls the controller on its sync interval, one minute by default, and a notify call pushes changes to every node at once. Third, caching: resolvers and clients keep the old answer for up to the record’s TTL. Shorter intervals and TTLs fail over faster and cost more probes and more DNS queries.',
        ] },
        { q: 'What does Elchi GSLB need to run?', a: [
          'The health checker runs inside the Elchi controller, so there is no separate prober to deploy. elchi-coredns nodes answer DNS on port 53 (TCP and UDP) and take push notifications on port 8053. The bare-metal installer provisions them by default; on Kubernetes, set global.installGslb: true in the Helm chart.',
          'For real traffic, delegate a zone (for example gslb.example.com) to the elchi-coredns nodes; the default zone, elchi.local, is not routable. The nodes never read the database: they fetch snapshots from the controller’s DNS API, authenticated with the zone’s shared secret.',
        ] },
        { q: 'What are the limits of GSLB?', a: [
          'GSLB steers at name resolution, so it is coarse-grained and bounded by resolver caching; a client that holds an answer longer than the TTL keeps using it. It does not replace in-path load balancing: Envoy still balances connections behind each resolved IP. It answers only for the zone delegated to the elchi-coredns nodes. A manual health override drains an edge only until the next probe result moves it again.',
        ] },
      ],
      flow: {
        title: 'From probe to DNS answer',
        steps: [
          { t: 'Define', d: 'Create records and attach IPs — manually or from services.' },
          { t: 'Probe', d: 'Controllers health-check every IP on its own schedule.' },
          { t: 'Serve', d: 'CoreDNS answers with only healthy, region-matched IPs.' },
          { t: 'Fail over', d: 'A record with no healthy IP falls back to its failover name.' },
        ],
      },
      qa: {
        title: 'Questions about Elchi GSLB',
        items: [
          { q: 'Do the DNS nodes probe the backends?', a: 'No. Probing happens in the controller. elchi-coredns only serves the snapshot it receives, with unhealthy IPs already removed.' },
          { q: 'Does it work with services Elchi deploys?', a: 'Yes. When a client is deployed to a GSLB-enabled service, Elchi creates the record and its IPs, and deploy and undeploy keep them current. You can add manual backup IPs to the same record.' },
          { q: 'Can I take an edge out of DNS for maintenance?', a: 'Yes. Set the IP’s health state to critical to remove it from answers, and back to passing to return it. Probing continues, so a real result can move it again.' },
        ],
      },
    },
    tr: {
      metaName: 'Elchi GSLB',
      tag: 'ELCHI GSLB',
      title1: 'Elchi GSLB:',
      title2: 'sağlık durumunu izleyen DNS.',
      subtitle: 'Controller’ın çalıştırdığı sağlık kontrolleriyle beslenen, elchi-coredns’ten yetkili DNS: sağlıksız edge’ler yanıttan çıkar, bölgeler yakın IP’leri alır, sağlıklı IP’si kalmayan kayıt failover adına düşer.',
      badges: ['CoreDNS Yetkili DNS', 'HTTP/HTTPS/TCP Probları', 'Bölgeye Göre Yanıt', 'Parçalı Sağlık Kontrolü'],
      positioning: 'Elchi Core eklentisidir. Sağlık durumu platformda tutulur; CoreDNS düğümleri sürümlü snapshot\'lardan yanıt verir.',
      what: {
        q: 'Elchi GSLB nedir?',
        p: 'Elchi GSLB, Envoy edge’leri için DNS tabanlı global server load balancing’dir. Bir GSLB kaydı bir hostname’i, onu sunan edge’lerin IP adreslerine eşler. Elchi controller’ının içindeki sağlık denetleyicisi her IP’yi kendi takvimiyle HTTP, HTTPS ya da TCP üzerinden yoklar ve onu dört durum arasında taşır: passing, warning, critical ve recovery. Elchi GSLB eklentili bir CoreDNS derlemesi olan elchi-coredns, zone’u controller’dan çektiği snapshot’lardan yetkili olarak sunar; critical ve recovery durumundaki IP’ler bu snapshot’larda zaten yoktur. Bir kaydın tüm IP’leri kapalıysa yanıt, kaydın yedek zone’daki failover adını gösterir. IP’ler bölge etiketi taşıyabilir; böylece bölgesel bir DNS düğümü yakın edge’lerle yanıt verir. Kayıtlar arayüzde ya da REST API ile, veya bir client GSLB etkin bir servise deploy edildiğinde otomatik olarak oluşturulur.',
      },
      capsTitle: 'Elchi GSLB ne yapar',
      shotsTitle: 'Arayüzde GSLB kayıtları ve IP sağlığı',
      caps: [
        { t: 'CoreDNS ile yetkili DNS', d: 'GSLB düğümleri, zone başına secret ile doğrulanan API üzerinden sürümlü zone snapshot\'larını (artımlı değişiklik akışıyla) çeker ve yetkili yanıt verir.' },
        { t: 'Her yerde sağlık probu', d: 'Özel Host header ve TLS doğrulama atlama seçenekleriyle HTTP, HTTPS ve TCP probları; 10 saniyeden 5 dakikaya aralıklar.' },
        { t: 'Anti-flapping durum makinesi', d: 'Ayarlanabilir eşikli dörtlü durum modeli (PASSING → WARNING → CRITICAL → RECOVERY), kararsız endpoint\'lerin DNS\'e girip çıkmasını engeller.' },
        { t: 'Failover bölgeleri', d: 'Bir kaydın arkasındaki tüm IP\'ler sağlıksızsa DNS, kaydın yedek zone\'daki failover FQDN\'iyle yanıt verir.' },
        { t: 'Bölgeye göre yanıtlar', d: 'IP\'leri bölgelerle etiketleyin; her bölgesel DNS düğümü yalnızca kendi bölgesine etiketli sağlıklı IP\'leri döner. Kullanıcıları yakın endpoint\'lerde tutmak için her bölgeye bir DNS düğümü koyun.' },
        { t: 'Circuit-breaker\'lı problama', d: 'Başarısız IP\'lerde prob aralığı kademeli artar (prob aralığının en fazla 12 katı, en çok 5 dakika), ölü sunucular boşuna yoklanmaz; durum geçişleri anında yeniden prob tetikler.' },
        { t: 'Kayıt & IP yönetimi', d: 'Toplu işlemli CRUD, manuel sağlık geçersiz kılma, IP başına geçmiş ve servis dağıtımlarından otomatik oluşturulan IP\'ler.' },
        { t: 'Parçalı sağlık kontrolü', d: 'Sağlık kontrolleri kira (lease) tabanlı sahiplikle controller\'lar arasında parçalanır; bir controller çökerse parçaları kalan controller\'lara geçer.' },
      ],
      evaluate: [
        { q: 'GSLB bir Envoy edge’inin kapalı olduğuna nasıl karar verir?', a: [
          'Her kaydın bir probu vardır: tip, port, HTTP için path ve Host header, 10 ile 300 saniye arası bir aralık, 0,1 ile 3 saniye arası bir zaman aşımı ve kabul edilen durum kodları. Art arda gelen başarısızlıklar bir IP’yi warning_threshold’da passing’den warning’e, critical_threshold’da critical’a taşır. Yalnızca passing ve warning IP’ler sunulur; yani bir IP critical’a ulaştığında DNS’ten çıkar.',
          'Warning ve recovery IP’ler aralığın yarısında yoklanır. passing_threshold 1’den büyükse, toparlanan bir IP o kadar art arda başarıya ulaşana kadar DNS dışında kalır; bu, kararsız bir edge’in girip çıkmasını önler.',
        ] },
        { q: 'Bir DNS failover ne kadar sürer?', a: [
          'Üç parçanın toplamıdır ve her birini yapılandırmanız belirler. Birincisi, IP’nin critical_threshold sayıda başarısızlığa ulaşma süresi (warning IP’ler aralığın yarısında yoklanır). İkincisi, DNS düğümlerine yayılma: elchi-coredns controller’ı sync aralığında yoklar, varsayılan olarak bir dakika; bir notify çağrısı değişiklikleri tüm düğümlere aynı anda iletir. Üçüncüsü, önbellek: resolver’lar ve istemciler eski yanıtı kaydın TTL’i kadar tutar. Daha kısa aralıklar ve TTL’ler daha hızlı failover sağlar, karşılığında daha fazla prob ve DNS sorgusu üretir.',
        ] },
        { q: 'Elchi GSLB’nin çalışması için ne gerekir?', a: [
          'Sağlık denetleyicisi Elchi controller’ının içinde çalışır; ayrıca kurulacak bir prob servisi yoktur. elchi-coredns düğümleri DNS’e 53 numaralı portta (TCP ve UDP) yanıt verir ve push bildirimlerini 8053 portunda alır. Bare-metal kurucu bunları varsayılan olarak kurar; Kubernetes’te Helm chart’ta global.installGslb: true ayarlayın.',
          'Gerçek trafik için bir zone’u (örneğin gslb.example.com) elchi-coredns düğümlerine delege edin; varsayılan zone elchi.local yönlendirilebilir değildir. Düğümler veritabanını asla okumaz: snapshot’ları controller’ın DNS API’sinden, zone’un paylaşılan secret’ıyla doğrulanarak çeker.',
        ] },
        { q: 'GSLB’nin sınırları neler?', a: [
          'GSLB ad çözümleme aşamasında yönlendirir; bu yüzden kaba tanelidir ve resolver önbelleğiyle sınırlıdır: bir yanıtı TTL’den uzun tutan istemci onu kullanmaya devam eder. Yol içi yük dengelemenin yerini almaz: Envoy her çözülen IP’nin arkasında bağlantıları yine dengeler. Yalnızca elchi-coredns düğümlerine delege edilen zone için yanıt verir. Manuel sağlık geçersiz kılma bir edge’i yalnızca bir sonraki prob sonucu onu yeniden taşıyana kadar devre dışı bırakır.',
        ] },
      ],
      flow: {
        title: 'Probdan DNS yanıtına',
        steps: [
          { t: 'Tanımla', d: 'Kayıtları oluşturun, IP\'leri elle ya da servislerden bağlayın.' },
          { t: 'Probla', d: 'Controller\'lar her IP\'yi kendi takvimiyle sağlık kontrolünden geçirir.' },
          { t: 'Yanıtla', d: 'CoreDNS yalnızca sağlıklı, bölgeye uygun IP\'lerle yanıt verir.' },
          { t: 'Devret', d: 'Sağlıklı IP\'si kalmayan kayıt failover adına düşer.' },
        ],
      },
      qa: {
        title: 'Elchi GSLB hakkında sorular',
        items: [
          { q: 'DNS düğümleri backend’leri yoklar mı?', a: 'Hayır. Yoklama controller’da yapılır. elchi-coredns yalnızca aldığı, sağlıksız IP’leri zaten çıkarılmış snapshot’ı sunar.' },
          { q: 'Elchi’nin deploy ettiği servislerle çalışır mı?', a: 'Evet. Bir client GSLB etkin bir servise deploy edildiğinde Elchi kaydı ve IP’lerini oluşturur; deploy ve undeploy bunları güncel tutar. Aynı kayda manuel yedek IP’ler ekleyebilirsiniz.' },
          { q: 'Bakım için bir edge’i DNS’ten çıkarabilir miyim?', a: 'Evet. IP’nin sağlık durumunu critical yaparak yanıtlardan çıkarın, passing yaparak geri alın. Yoklama sürer; gerçek bir sonuç onu yeniden taşıyabilir.' },
        ],
      },
    },
  },
};

export { PRODUCTS };
