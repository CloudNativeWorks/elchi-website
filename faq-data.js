// Frequently asked questions — the single source for the FAQ page (faq.jsx) and its
// FAQPage JSON-LD (rendered from the same entries, so the markup always matches the
// visible text). Plain strings only: the same text is the schema's answer.
// Every answer must be true of the shipped product; each links the doc that backs it.

export const FAQ_GROUPS = [
  {
    en: 'The platform',
    tr: 'Platform',
    items: [
      {
        doc: '/docs/getting-started/introduction',
        en: ['What is Elchi?',
          'Elchi is a visual control plane for Envoy proxy fleets. You configure listeners, routes, clusters, endpoints, filters and certificates in a UI whose editors are generated from each Envoy version’s protobufs, validate the change, and publish it; Elchi pushes it to your Envoys over xDS. Lightweight edge agents run Envoy on your hosts, and add-on products bring API security (Shield), API discovery and GSLB into the same control plane.'],
        tr: ['Elchi nedir?',
          'Elchi, Envoy proxy filoları için görsel bir control plane’dir. Listener, route, cluster, endpoint, filtre ve sertifikaları, editörleri her Envoy sürümünün protobuf’larından üretilen bir arayüzde yapılandırır, değişikliği doğrular ve yayınlarsınız; Elchi bunu xDS ile Envoy’larınıza iletir. Hafif edge agent’lar Envoy’u kendi sunucularınızda çalıştırır; ek ürünler API güvenliğini (Shield), API keşfini ve GSLB’yi aynı control plane’e getirir.'],
      },
      {
        doc: '/docs/getting-started/architecture',
        en: ['Is Elchi a service mesh, or an alternative to Istio?',
          'No, Elchi is not a service mesh. It is a control plane for Envoy proxies that run as edge and gateway proxies on Linux hosts, where an agent runs each listener as its own Envoy process. It does not inject sidecars into Kubernetes pods. Elchi fits when you run Envoy fleets on VMs or bare metal, need several Envoy versions side by side, or want the full Envoy API through typed editors. If what you need is service-to-service traffic management between pods with automatic sidecar injection, a mesh such as Istio is the better fit; Elchi can still run the Envoy edge in front of the cluster.'],
        tr: ['Elchi bir service mesh mi, Istio’ya bir alternatif mi?',
          'Hayır, Elchi bir service mesh değildir. Linux sunucularda edge ve gateway proxy olarak çalışan Envoy’lar için bir control plane’dir; her listener’ı bir agent ayrı bir Envoy süreci olarak çalıştırır. Kubernetes pod’larına sidecar enjekte etmez. Envoy filolarını VM ya da bare metal üzerinde çalıştırıyorsanız, birden çok Envoy sürümünü yan yana kullanmanız gerekiyorsa ya da Envoy API’sinin tamamına tipli editörlerle erişmek istiyorsanız Elchi uygundur. İhtiyacınız pod’lar arası servisten servise trafik yönetimi ve otomatik sidecar enjeksiyonuysa Istio gibi bir mesh daha uygundur; Elchi yine de cluster’ın önündeki Envoy edge’ini çalıştırabilir.'],
      },
      {
        doc: '/docs/envoy-configuration/config-model',
        en: ['Do I still have to write Envoy YAML or xDS by hand?',
          'No. Every Envoy resource is edited through typed forms, and each change is checked twice: in the editor against types generated from the Envoy API, and on the server against the Envoy API’s validation rules before it is stored. Changes go through draft, save and publish steps with an audit log, and a published change reaches the running Envoys over xDS without a restart.'],
        tr: ['Envoy YAML’ını veya xDS’i hâlâ elle yazmam gerekir mi?',
          'Hayır. Her Envoy kaynağı tipli formlarla düzenlenir ve her değişiklik iki kez kontrol edilir: editörde Envoy API’sinden üretilen tiplere göre, sunucuda ise kaydedilmeden önce Envoy API’sinin doğrulama kurallarına göre. Değişiklikler taslak, kaydet ve yayınla adımlarından audit log ile geçer; yayınlanan değişiklik çalışan Envoy’lara yeniden başlatma olmadan xDS ile ulaşır.'],
      },
      {
        doc: '/docs/envoy-configuration/versions-and-upgrades',
        en: ['Which Envoy versions does Elchi support?',
          'Elchi runs several Envoy versions side by side. Its registry routes each proxy to a control plane that speaks that proxy’s version, and resources can be migrated from one version to the next. The exact set depends on the versions you deploy; the current list is shown under Settings → General in the UI.'],
        tr: ['Elchi hangi Envoy sürümlerini destekler?',
          'Elchi birden fazla Envoy sürümünü yan yana çalıştırır. Registry her proxy’yi o proxy’nin sürümünü konuşan bir control plane’e yönlendirir ve kaynaklar bir sürümden diğerine taşınabilir. Kesin liste kurduğunuz sürümlere bağlıdır; güncel liste arayüzde Settings → General altında görünür.'],
      },
      {
        doc: '/docs/automation-api/overview',
        en: ['Can I automate Elchi from scripts and CI pipelines?',
          'Yes. The automation API is a versioned REST API with project API tokens. It can take an upstream endpoint out of rotation across a whole project and put it back, and switch an EDS cluster to another endpoints resource for a blue/green release.'],
        tr: ['Elchi’yi script’lerden ve CI pipeline’larından otomatikleştirebilir miyim?',
          'Evet. Automation API, proje API token’larıyla çalışan sürümlü bir REST API’dir. Bir upstream endpoint’i tüm projede trafikten çıkarıp geri alabilir ve blue/green sürüm için bir EDS cluster’ını başka bir endpoints kaynağına geçirebilir.'],
      },
    ],
  },
  {
    en: 'Installation and operations',
    tr: 'Kurulum ve operasyon',
    items: [
      {
        doc: '/docs/installation/helm-platform/overview',
        en: ['Do I need Kubernetes to run Elchi?',
          'No. The control plane installs with a Helm chart on Kubernetes, with the Docker Swarm installer, or as systemd services on bare-metal Linux hosts with no Kubernetes and no Docker; a single-VM evaluation install is also available. The Envoy proxies themselves run on Linux edge hosts (VMs or bare metal) managed by the Elchi client, each listener as its own systemd service, or on Elchi OS appliances.'],
        tr: ['Elchi’yi çalıştırmak için Kubernetes gerekir mi?',
          'Hayır. Control plane Kubernetes üzerinde Helm chart ile, Docker Swarm kurucusuyla ya da Kubernetes ve Docker olmadan bare-metal Linux sunuculara systemd servisleri olarak kurulur; tek VM’lik bir deneme kurulumu da vardır. Envoy proxy’lerin kendisi, Elchi client’ın yönettiği Linux edge sunucularda (VM ya da bare metal), her listener ayrı bir systemd servisi olarak, ya da Elchi OS appliance’larında çalışır.'],
      },
      {
        doc: '/docs/installation/client/overview',
        en: ['Where do the Envoy proxies run?',
          'On your own hosts. The Elchi client is a lightweight agent on each Linux edge host (Ubuntu 24.04): it registers with the control plane, runs the deployed Envoys and handles lifecycle commands. Elchi OS is a hardened edge appliance image that does the same and adds active/passive HA pairs that share virtual IPs.'],
        tr: ['Envoy proxy’ler nerede çalışır?',
          'Kendi sunucularınızda. Elchi client, her Linux edge sunucuda (Ubuntu 24.04) çalışan hafif bir agent’tır: control plane’e kaydolur, deploy edilen Envoy’ları çalıştırır ve yaşam döngüsü komutlarını yürütür. Elchi OS aynısını yapan sertleştirilmiş bir edge appliance imajıdır ve sanal IP paylaşan aktif/pasif HA çiftleri ekler.'],
      },
      {
        doc: '/docs/installation/docker-swarm/offline-airgap',
        en: ['Can Elchi run in an air-gapped network?',
          'Yes. The Docker Swarm installer supports a fully offline install from a saved image bundle, and an offline license file activates the platform without contacting the license API. API discovery data stays in your own ClickHouse.'],
        tr: ['Elchi internetsiz (air-gapped) bir ağda çalışabilir mi?',
          'Evet. Docker Swarm kurucusu, kaydedilmiş bir imaj paketinden tamamen çevrimdışı kurulumu destekler; çevrimdışı lisans dosyası platformu lisans API’sine bağlanmadan etkinleştirir. API keşif verileri kendi ClickHouse’unuzda kalır.'],
      },
    ],
  },
  {
    en: 'Security and API discovery',
    tr: 'Güvenlik ve API keşfi',
    items: [
      {
        doc: '/docs/shield/overview',
        en: ['How does Elchi add a WAF to Envoy?',
          'Through Shield, an ext_proc sidecar that runs next to Envoy on each edge host. Envoy streams each request to Shield over a local socket, and Shield returns allow, block (403) or record-only detect verdicts from twelve security engines (among them authentication, rate limiting, bot defense and a WAF built on the OWASP Core Rule Set) plus built-in data-loss prevention. Policies are rolled out from detect to block.'],
        tr: ['Elchi, Envoy’a WAF’ı nasıl ekler?',
          'Her edge sunucuda Envoy’un yanında çalışan bir ext_proc sidecar olan Shield ile. Envoy her isteği yerel bir soket üzerinden Shield’a iletir; Shield; kimlik doğrulama, rate limiting, bot savunması ve OWASP Core Rule Set tabanlı bir WAF dahil on iki güvenlik motoru ile yerleşik veri sızıntısı önleme üzerinden allow, block (403) veya yalnızca kayıt tutan detect kararı döner. Politikalar detect’ten block’a kademeli olarak devreye alınır.'],
      },
      {
        doc: '/docs/guides/add-waf-to-envoy-ext-proc',
        en: ['How does Shield compare to a Wasm-based WAF?',
          'Shield runs outside Envoy. Envoy’s ext_proc filter streams each request to the Shield sidecar over a local Unix socket, so the WAF is a separate process with its own memory limit, its own release cycle and its own failure domain: a crash in Shield does not take Envoy down, and Envoy’s failure_mode_allow setting decides whether traffic continues without it. The cost is a gRPC round trip per inspected message, and the body is buffered only on routes whose policy inspects it. A Wasm WAF runs inside Envoy’s worker threads in a sandboxed VM: it avoids the extra hop but shares Envoy’s process and resources, and it is loaded and updated through the Envoy configuration. Shield also runs authentication, rate limiting, bot detection and DLP in the same pass as the OWASP Core Rule Set.'],
        tr: ['Shield, Wasm tabanlı bir WAF ile nasıl karşılaştırılır?',
          'Shield Envoy’un dışında çalışır. Envoy’un ext_proc filter’ı her isteği yerel bir Unix soketi üzerinden Shield sidecar’ına akıtır; böylece WAF kendi bellek sınırı, kendi sürüm döngüsü ve kendi hata alanı olan ayrı bir süreçtir: Shield’daki bir çökme Envoy’u düşürmez ve trafiğin onsuz devam edip etmeyeceğine Envoy’un failure_mode_allow ayarı karar verir. Bedeli, incelenen her mesaj için bir gRPC gidiş-dönüşüdür; gövde yalnızca policy’si gövde inceleyen route’larda buffer’lanır. Wasm tabanlı bir WAF Envoy’un worker thread’lerinde, sandbox’lı bir VM içinde çalışır: ek atlamadan kaçınır ama Envoy’un sürecini ve kaynaklarını paylaşır, Envoy yapılandırması üzerinden yüklenir ve güncellenir. Shield ayrıca kimlik doğrulama, rate limiting, bot tespiti ve DLP’yi OWASP Core Rule Set ile aynı geçişte çalıştırır.'],
      },
      {
        doc: '/docs/api-discovery/overview',
        en: ['Does API discovery sit in the request path?',
          'No. API discovery is passive and metadata-only: Envoy ships access-log records to the Elchi collector, which normalizes and scores them into an API inventory. It never touches request bodies and cannot block or slow live traffic. The inventory flags unauthenticated endpoints, PII exposure, shadow endpoints and drift against your OpenAPI specs.'],
        tr: ['API keşfi isteklerin yolunda mı çalışır?',
          'Hayır. API keşfi pasiftir ve yalnızca metadata kullanır: Envoy erişim log kayıtlarını Elchi collector’a gönderir, collector bunları normalize edip puanlayarak bir API envanteri oluşturur. İstek gövdelerine dokunmaz, canlı trafiği engelleyemez ve yavaşlatamaz. Envanter kimlik doğrulamasız endpoint’leri, PII sızıntısını, gölge endpoint’leri ve OpenAPI spec’lerinizden sapmaları işaretler.'],
      },
      {
        doc: '/docs/gslb/overview',
        en: ['What does Elchi GSLB do?',
          'GSLB steers traffic at DNS. Elchi actively probes every IP behind a record and serves only healthy targets through a CoreDNS plugin, so clients resolve a hostname to reachable backends across regions and data centers.'],
        tr: ['Elchi GSLB ne yapar?',
          'GSLB trafiği DNS seviyesinde yönlendirir. Elchi bir kaydın arkasındaki her IP’yi aktif olarak yoklar ve bir CoreDNS eklentisiyle yalnızca sağlıklı hedefleri döner; böylece istemciler bir hostname’i bölgeler ve veri merkezleri arasında erişilebilir backend’lere çözer.'],
      },
    ],
  },
  {
    en: 'Licensing',
    tr: 'Lisanslama',
    items: [
      {
        doc: '/docs/administration/licensing',
        en: ['How is Elchi licensed?',
          'By the number of managed clients (edge nodes) connected at the same time, and by product. Elchi Core is the base of every deployment; API Security, API Discovery and GSLB are licensed individually on top of it. Licenses can be activated online or with an offline license file.'],
        tr: ['Elchi nasıl lisanslanır?',
          'Aynı anda bağlı yönetilen client (edge node) sayısına ve ürüne göre. Elchi Core her kurulumun temelidir; API Security, API Discovery ve GSLB bunun üzerine ayrı ayrı lisanslanır. Lisanslar çevrimiçi veya çevrimdışı bir lisans dosyasıyla etkinleştirilebilir.'],
      },
      {
        doc: '/docs/administration/licensing',
        en: ['Is there a free tier?',
          'Yes. Without a license, Elchi runs Elchi Core with one managed client, which is enough to evaluate the platform end to end.'],
        tr: ['Ücretsiz bir sürüm var mı?',
          'Evet. Lisans olmadan Elchi, bir yönetilen client ile Elchi Core olarak çalışır; bu, platformu uçtan uca denemek için yeterlidir.'],
      },
      {
        doc: '/docs/changelog',
        en: ['Is Elchi open source?',
          'No. The source code of Elchi’s components (the UI, the backend, the edge agent, Shield and the collector) is not public. Release binaries and the installers are published openly in the elchi-archive repository on GitHub, container images on Docker Hub, and the Helm charts at charts.elchi.io. Without a license the platform runs the free tier, Elchi Core with one managed client, so you can install and evaluate it without talking to anyone.'],
        tr: ['Elchi açık kaynak mı?',
          'Hayır. Elchi bileşenlerinin (arayüz, backend, edge agent, Shield ve collector) kaynak kodu herkese açık değildir. Sürüm binary’leri ve kurucular GitHub’daki elchi-archive deposunda, container imajları Docker Hub’da, Helm chart’ları charts.elchi.io adresinde açıkça yayınlanır. Lisans olmadan platform ücretsiz seviyede, bir yönetilen client ile Elchi Core olarak çalışır; yani kimseyle konuşmadan kurup deneyebilirsiniz.'],
      },
    ],
  },
];
