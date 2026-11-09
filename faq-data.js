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
          'No. The control plane installs with a Helm chart on Kubernetes, with the Docker Swarm installer, or on bare-metal Linux hosts; a single-VM evaluation install is also available. The Envoy proxies themselves run on Linux edge hosts managed by the Elchi client, or on Elchi OS appliances.'],
        tr: ['Elchi’yi çalıştırmak için Kubernetes gerekir mi?',
          'Hayır. Control plane Kubernetes üzerinde Helm chart ile, Docker Swarm kurucusuyla veya bare-metal Linux sunuculara kurulur; tek VM’lik bir deneme kurulumu da vardır. Envoy proxy’lerin kendisi, Elchi client’ın yönettiği Linux edge sunucularda ya da Elchi OS appliance’larında çalışır.'],
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
    ],
  },
];
