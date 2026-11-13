import React from 'react';
import ReactDOM from 'react-dom/client';
import { getLocale, locHref } from './i18n.js';
import { Nav, Footer } from './shared.jsx';
import { Band, BandHead, PageHero, Arrow } from './relief.jsx';

// All user-visible strings for the Architecture page, per locale. Technical terms
// (Envoy, Shield, proxy, control plane, xDS, WAF, gRPC, MongoDB, ClickHouse, …) and
// component/product names (Registry, Controller, Control-Plane, Collector,
// elchi-client) are intentionally kept in English in both locales. Structural values
// (accent colors, ports, layout flags) are identical across locales.
const STR = {
  en: {
    hero: {
      eyebrow: 'ARCHITECTURE',
      titleLine1: 'Elchi architecture:',
      titleGrad: 'three processes and an edge agent.',
      subtitle: 'A Registry, a Controller and one Control-Plane per Envoy version run centrally; on each edge host an agent runs Envoy next to Shield. Every backend process scales out and can run as several instances.',
    },
    threeProcess: {
      eyebrow: '3-PROCESS DISTRIBUTED ARCHITECTURE',
      headingLine1: 'What do the Registry, Controller',
      headingLine2: 'and Control-Plane each do?',
      intro: 'Three backend processes, each with one job. They are built from one binary, scale out independently, and run as several instances behind the Registry.',
      procs: [
        { name: 'Registry', port: 'routing', accent: '#06b6d4', desc: 'Service discovery and routing hub',
          items: ['Controller registration', 'Client location tracking', 'Version-based control-plane routing', 'Automatic cleanup of stale instances'] },
        { name: 'Controller', port: 'API', accent: '#8b5cf6', desc: 'REST API and management layer',
          items: ['Client management & command dispatch', 'xDS resource management (CDS, LDS, RDS, EDS)', 'User & authorization (RBAC)', 'Persistent configuration store', 'AI-assisted config analysis (OpenRouter)', 'K8s Discovery system'] },
        { name: 'Control-Plane', port: 'xDS', accent: '#3b82f6', desc: 'xDS control plane',
          items: ['Envoy ADS (Aggregated Discovery Service)', 'VHDS (Virtual Host Discovery Service)', 'Snapshot management per Envoy', 'Live updates on every change', 'Auto-registration with registry', 'Health monitoring & keepalive'] },
      ],
      ha: [
        ['High availability', 'Several controllers and control planes share one MongoDB and elect a leader for scheduled work, so the management plane keeps running when an instance fails. At the edge, active/passive Elchi OS pairs share VIPs and fail over in about two seconds.'],
        ['Scaling out', 'The processes are horizontally scalable behind the Registry. The sizing guide recommends adding replicas before raising limits; the Control-Plane\'s memory is the first to watch as the xDS snapshot grows.'],
        ['Version routing', 'Each Envoy reports its version, and its xDS stream goes to the control plane built for that version, so several Envoy versions run side by side in one project.'],
      ],
    },
    edge: {
      eyebrow: 'EDGE & DATA PLANE',
      headingLine1: 'What runs on each',
      headingLine2: 'Envoy edge host?',
      intro: 'Each edge host runs Envoy plus the agent that deploys it and the sidecar that secures it; the collector that observes it runs centrally. All of it is driven by the control plane.',
      nodes: [
        { name: 'Envoy', port: 'data plane', accent: '#3b82f6', desc: 'The L7 proxy that carries your traffic',
          items: ['Receives config over xDS from the control-plane', 'Calls Shield over ext_proc for security decisions', 'Ships access logs (ALS) to the collector', 'No restarts — config applied live'] },
        { name: 'elchi-client', port: 'edge agent', accent: '#8b5cf6', desc: 'The agent that operates each edge host',
          items: ['Registers the node & runs controller commands', 'Deploys / upgrades Envoy and bootstrap', 'Bundles & manages the Shield sidecar', 'Ships logs, manages BGP/FRR & networking', 'Runs elchi-ha on Elchi OS: active/passive VIP pairs'] },
        { name: 'Shield', port: 'ext_proc', accent: '#f43f5e', desc: 'API security enforced in the request path',
          items: ['WAF (OWASP CRS), JWT/mTLS, rate-limit, bot — 12 engines + built-in DLP', 'Runs locally next to Envoy on each edge host', 'Policies pushed as files, hot-reloaded', 'block / detect / shadow decisions, fail-open by default'] },
        { name: 'Collector', port: 'analytics', accent: '#10b981', desc: 'Turns traffic into an API inventory',
          items: ['Ingests Envoy access logs', 'Normalizes paths, scores risk & PII', 'Builds the endpoint catalog and the event history', 'Powers API Discovery — metadata only, no bodies'] },
      ],
      docPre: 'Want the full wire map — every port, protocol, and data flow between the control plane and the edge? See the ',
      docLink: 'Architecture reference',
      docPost: ' in the docs.',
    },
    layered: {
      eyebrow: 'LAYERED ARCHITECTURE',
      headingLine1: 'Which layers make up',
      headingLine2: 'the platform?',
      intro: 'The UI, the three backend processes, the stores they write to, and the proxies on the edge hosts.',
      layers: [
        { title: 'Management Console', color: '#3b82f6', items: [
          { name: 'Visual editors', desc: 'Every Envoy resource' },
          { name: 'Dependency graphs', desc: 'Resource relationships' },
          { name: 'Live views', desc: 'Traffic, metrics & logs' },
        ] },
        { title: 'Backend Layer — 3-Process Architecture', color: '#8b5cf6', wide: true, items: [
          { name: 'Controller', desc: 'API · client management, xDS, auth' },
          { name: 'Control-Plane', desc: 'xDS · ADS, VHDS, snapshots' },
          { name: 'Registry', desc: 'Discovery · service routing, versioning' },
        ] },
        { title: 'Data Layer', color: '#06b6d4', items: [
          { name: 'MongoDB', desc: 'Resources, projects & audit' },
          { name: 'VictoriaMetrics', desc: 'Long-term metrics' },
          { name: 'ClickHouse', desc: 'API events & security audit' },
        ] },
        { title: 'Proxy Layer', color: '#10b981', items: [
          { name: 'Envoy Proxy', desc: 'Multi-Version Support' },
          { name: 'Shield', desc: 'ext_proc · OWASP CRS WAF' },
          { name: 'elchi-client', desc: 'Deploys, upgrades & restarts Envoy' },
        ] },
      ],
    },
    requestFlow: {
      eyebrow: 'REQUEST FLOW',
      headingLine1: 'How does a change reach',
      headingLine2: 'a running Envoy?',
      intro: 'From the agent\'s registration to configuration applied in Envoy, step by step.',
      steps: [
        { label: 'Client', sub: 'Agent on host', accent: '#64748b' },
        { label: 'Registry', sub: 'Locate the controller', accent: '#06b6d4', arrow: 'connect' },
        { label: 'Controller', sub: 'Commands & resources', accent: '#8b5cf6', arrow: 'route' },
        { label: 'Control-Plane', sub: 'Snapshot per version', accent: '#3b82f6', arrow: 'snapshot' },
        { label: 'Envoy', sub: 'Apply config', accent: '#10b981', arrow: 'xDS' },
      ],
      explain: [
        ['Connection', 'Agents and Envoys connect through the front-door Envoy; the Registry, an ext_proc service, tells it which controller holds each client.'],
        ['Routing', 'Each Envoy\'s xDS stream is sent to the control plane of its own Envoy version.'],
        ['xDS Protocol', 'When a resource changes, the controller rebuilds the snapshot and the control plane streams it to Envoy.'],
        ['Configuration', 'Envoy applies the new listeners, routes and clusters without a restart.'],
      ],
    },
    integrations: {
      eyebrow: 'NATIVE INTEGRATIONS',
      heading: 'Which systems does Elchi integrate with?',
      intro: 'Platforms, directories, metrics and logging backends, AI providers and certificate authorities Elchi connects to.',
      nativeLabel: 'Native integration',
    },
    cta: {
      eyebrow: 'READY TO DEPLOY',
      headingLine1: 'Run this architecture',
      headingLine2: 'on Kubernetes or plain VMs.',
      subtitle: 'Install with the Helm chart on Kubernetes, or as systemd services on one, two, or three or more Linux VMs with the bare-metal installer. For a demo on your own setup, talk to us.',
      tryDemo: 'Get Started',
      helmCharts: 'Helm Charts',
      contact: 'Contact us',
    },
    docs: {
      label: 'Architecture in the docs',
      links: [
        ['/docs/getting-started/architecture', 'Architecture reference: every port, protocol and data flow'],
        ['/docs/administration/registry-and-ha', 'Registry and high availability'],
        ['/docs/administration/sizing-and-capacity', 'Sizing and capacity'],
        ['/docs/installation/bare-metal/topology', 'Bare-metal topologies: 1, 2 or 3+ VMs'],
      ],
    },
  },
  tr: {
    hero: {
      eyebrow: 'MİMARİ',
      titleLine1: 'Elchi mimarisi:',
      titleGrad: 'üç süreç ve bir edge agent.',
      subtitle: "Merkezde bir Registry, bir Controller ve her Envoy sürümü için bir Control-Plane çalışır; her edge sunucuda bir agent Envoy'u Shield'ın yanında çalıştırır. Her backend süreci yatay ölçeklenir ve birden çok instance olarak çalışabilir.",
    },
    threeProcess: {
      eyebrow: '3 SÜREÇLİ DAĞITIK MİMARİ',
      headingLine1: "Registry, Controller ve Control-Plane",
      headingLine2: 'ayrı ayrı ne yapar?',
      intro: "Her biri tek bir işi olan üç backend süreci. Tek bir binary'den çıkarlar, bağımsız ölçeklenirler ve Registry'nin arkasında birden çok instance olarak çalışırlar.",
      procs: [
        { name: 'Registry', port: 'routing', accent: '#06b6d4', desc: 'Servis keşfi ve yönlendirme merkezi',
          items: ['Controller kaydı', 'İstemci konum takibi', 'Sürüm tabanlı control-plane yönlendirmesi', 'Eski instance’ların otomatik temizliği'] },
        { name: 'Controller', port: 'API', accent: '#8b5cf6', desc: 'REST API ve yönetim katmanı',
          items: ['İstemci yönetimi ve komut dağıtımı', 'xDS kaynak yönetimi (CDS, LDS, RDS, EDS)', 'Kullanıcı ve yetkilendirme (RBAC)', 'Kalıcı yapılandırma deposu', 'AI destekli yapılandırma analizi (OpenRouter)', 'K8s Discovery sistemi'] },
        { name: 'Control-Plane', port: 'xDS', accent: '#3b82f6', desc: 'xDS control plane',
          items: ['Envoy ADS (Aggregated Discovery Service)', 'VHDS (Virtual Host Discovery Service)', 'Envoy başına snapshot yönetimi', 'Her değişiklikte canlı güncelleme', 'Registry ile otomatik kayıt', 'Sağlık izleme ve keepalive'] },
      ],
      ha: [
        ['Yüksek erişilebilirlik', "Birden çok controller ve control plane tek bir MongoDB'yi paylaşır ve zamanlanmış işler için lider seçer; bir instance çöktüğünde yönetim katmanı çalışmaya devam eder. Edge'de VIP paylaşan aktif/pasif Elchi OS çiftleri yaklaşık iki saniyede devreder."],
        ['Yatay ölçekleme', "Süreçler Registry'nin arkasında yatay ölçeklenir. Boyutlandırma rehberi limitleri artırmadan önce replika eklemeyi önerir; xDS snapshot'ı büyüdükçe ilk izlenecek şey Control-Plane'in belleğidir."],
        ['Sürüm yönlendirme', "Her Envoy sürümünü bildirir ve xDS akışı o sürüm için üretilmiş control plane'e gider; böylece birden çok Envoy sürümü tek projede yan yana çalışır."],
      ],
    },
    edge: {
      eyebrow: 'EDGE VE DATA PLANE',
      headingLine1: 'Her Envoy edge sunucusunda',
      headingLine2: 'ne çalışır?',
      intro: "Her edge sunucu Envoy'u, onu dağıtan agent'ı ve onu koruyan sidecar'ı çalıştırır; onu gözlemleyen collector merkezde çalışır. Hepsini control plane yönetir.",
      nodes: [
        { name: 'Envoy', port: 'data plane', accent: '#3b82f6', desc: 'Trafiğinizi taşıyan L7 proxy',
          items: ["Yapılandırmayı control-plane'den xDS üzerinden alır", "Güvenlik kararları için Shield'ı ext_proc üzerinden çağırır", "Erişim loglarını (ALS) Collector'a gönderir", 'Yeniden başlatma yok — yapılandırma canlı uygulanır'] },
        { name: 'elchi-client', port: 'edge agent', accent: '#8b5cf6', desc: "Her edge host'u işleten ajan",
          items: ["Node'u kaydeder ve Controller komutlarını çalıştırır", "Envoy ve bootstrap'i dağıtır / yükseltir", "Shield sidecar'ını paketler ve yönetir", 'Logları gönderir, BGP/FRR ve ağ yönetimini üstlenir', "Elchi OS'ta elchi-ha'yı çalıştırır: aktif/pasif VIP çiftleri"] },
        { name: 'Shield', port: 'ext_proc', accent: '#f43f5e', desc: 'İstek yolunda uygulanan API güvenliği',
          items: ['WAF (OWASP CRS), JWT/mTLS, rate-limit, bot — 12 motor + yerleşik DLP', 'Her edge host’ta Envoy’un yanında yerel olarak çalışır', 'Politikalar dosya olarak iletilir, anlık yeniden yüklenir', 'block / detect / shadow kararları, varsayılan fail-open'] },
        { name: 'Collector', port: 'analytics', accent: '#10b981', desc: 'Trafiği bir API envanterine dönüştürür',
          items: ['Envoy erişim loglarını alır', 'Yolları normalleştirir, risk ve PII puanlar', 'Endpoint kataloğunu ve olay geçmişini oluşturur', "API Discovery'yi besler — yalnızca meta veri, gövde yok"] },
      ],
      docPre: 'Tam bağlantı haritasını mı istiyorsunuz — control plane ile edge arasındaki her port, protokol ve veri akışını? Dokümanlardaki ',
      docLink: 'Mimari referansına',
      docPost: ' göz atın.',
    },
    layered: {
      eyebrow: 'KATMANLI MİMARİ',
      headingLine1: 'Platform hangi',
      headingLine2: 'katmanlardan oluşur?',
      intro: "Arayüz, üç backend süreci, yazdıkları depolar ve edge sunuculardaki proxy'ler.",
      layers: [
        { title: 'Yönetim Konsolu', color: '#3b82f6', items: [
          { name: 'Görsel editörler', desc: 'Her Envoy kaynağı' },
          { name: 'Bağımlılık grafikleri', desc: 'Kaynak ilişkileri' },
          { name: 'Canlı görünümler', desc: 'Trafik, metrik ve log' },
        ] },
        { title: 'Backend Katmanı — 3 Süreçli Mimari', color: '#8b5cf6', wide: true, items: [
          { name: 'Controller', desc: 'API · istemci yönetimi, xDS, yetkilendirme' },
          { name: 'Control-Plane', desc: 'xDS · ADS, VHDS, snapshot' },
          { name: 'Registry', desc: 'Discovery · servis yönlendirme, sürümleme' },
        ] },
        { title: 'Veri Katmanı', color: '#06b6d4', items: [
          { name: 'MongoDB', desc: 'Kaynaklar, projeler ve denetim' },
          { name: 'VictoriaMetrics', desc: 'Uzun vadeli metrikler' },
          { name: 'ClickHouse', desc: 'API olayları ve güvenlik denetimi' },
        ] },
        { title: 'Proxy Katmanı', color: '#10b981', items: [
          { name: 'Envoy Proxy', desc: 'Çoklu Sürüm Desteği' },
          { name: 'Shield', desc: 'ext_proc · OWASP CRS WAF' },
          { name: 'elchi-client', desc: "Envoy'u kurar, yükseltir, yeniden başlatır" },
        ] },
      ],
    },
    requestFlow: {
      eyebrow: 'İSTEK AKIŞI',
      headingLine1: 'Bir değişiklik çalışan',
      headingLine2: "Envoy'a nasıl ulaşır?",
      intro: "Agent'ın kaydından Envoy'da uygulanan yapılandırmaya, adım adım.",
      steps: [
        { label: 'Client', sub: 'Host üzerindeki ajan', accent: '#64748b' },
        { label: 'Registry', sub: "Controller'ı bul", accent: '#06b6d4', arrow: 'bağlan' },
        { label: 'Controller', sub: 'Komutlar ve kaynaklar', accent: '#8b5cf6', arrow: 'yönlendir' },
        { label: 'Control-Plane', sub: 'Sürüm başına snapshot', accent: '#3b82f6', arrow: 'snapshot' },
        { label: 'Envoy', sub: 'Yapılandırmayı uygula', accent: '#10b981', arrow: 'xDS' },
      ],
      explain: [
        ['Bağlantı', "Ajanlar ve Envoy'lar ön kapı Envoy'u üzerinden bağlanır; bir ext_proc servisi olan Registry, her client'ı hangi controller'ın tuttuğunu bildirir."],
        ['Yönlendirme', "Her Envoy'un xDS akışı, kendi Envoy sürümünün control plane'ine gider."],
        ['xDS Protokolü', "Bir kaynak değişince controller snapshot'ı yeniden oluşturur, control plane onu Envoy'a akıtır."],
        ['Yapılandırma', "Envoy yeni listener, route ve cluster'ları yeniden başlatma olmadan uygular."],
      ],
    },
    integrations: {
      eyebrow: 'YERLEŞİK ENTEGRASYONLAR',
      heading: 'Elchi hangi sistemlerle entegre olur?',
      intro: "Elchi'nin bağlandığı platformlar, dizinler, metrik ve log altyapıları, AI sağlayıcıları ve sertifika otoriteleri.",
      nativeLabel: 'Yerleşik entegrasyon',
    },
    cta: {
      eyebrow: 'DAĞITMAYA HAZIR',
      headingLine1: 'Bu mimariyi Kubernetes’te',
      headingLine2: 'ya da düz VM’lerde çalıştırın.',
      subtitle: "Kubernetes'te Helm chart ile, ya da bare-metal kurucuyla bir, iki veya üç ve daha fazla Linux VM üzerinde systemd servisleri olarak kurun. Kendi kurulumunuzda bir demo için bize ulaşın.",
      tryDemo: 'Başlayın',
      helmCharts: 'Helm Charts',
      contact: 'Bize ulaşın',
    },
    docs: {
      label: 'Dokümanlarda mimari',
      links: [
        ['/docs/getting-started/architecture', 'Mimari referansı: her port, protokol ve veri akışı'],
        ['/docs/administration/registry-and-ha', 'Registry ve yüksek erişilebilirlik'],
        ['/docs/administration/sizing-and-capacity', 'Boyutlandırma ve kapasite'],
        ['/docs/installation/bare-metal/topology', 'Bare-metal topolojiler: 1, 2 ya da 3+ VM'],
      ],
    },
  },
};

function ArchApp() {
  return (
    <>
      <Nav active="architecture"/>
      <main className="rl">
        <ArchHero/>
        <ThreeProcess/>
        <EdgeDataPlane/>
        <LayeredArch/>
        <RequestFlow/>
        <Integrations/>
        <ArchCTA/>
      </main>
      <Footer/>
    </>
  );
}

function ArchHero() {
  const locale = getLocale();
  const t = STR[locale].hero;
  const c = STR[locale].cta;
  return (
    <PageHero
      title={<><span className="rl-h1-line">{t.titleLine1}</span> <span className="rl-h1-line">{t.titleGrad}</span></>}
      lede={t.subtitle}
      actions={<>
        <a href="/docs/getting-started/quickstart" className="rl-go">{c.tryDemo}<Arrow/></a>
        <a href="https://charts.elchi.io" target="_blank" rel="noopener" className="rl-pill">{c.helmCharts}</a>
      </>}
    />
  );
}

/* the three backend processes: one tonal row each, name and role on the left, duties on the right */
function ThreeProcess() {
  const all = STR[getLocale()];
  const t = all.threeProcess;
  return (
    <Band tone="water" id="processes">
      <BandHead h2={<>{t.headingLine1} {t.headingLine2}</>} intro={t.intro}/>
      <div className="ap-procs">
        {t.procs.map((p) => (
          <div key={p.name} className="ap-proc">
            <div className="ap-proc-id">
              <div className="ap-name">
                <h3>{p.name}</h3>
                <span className="ap-port">{p.port}</span>
              </div>
              <p>{p.desc}</p>
            </div>
            <ul className="ap-list">{p.items.map((it) => <li key={it}>{it}</li>)}</ul>
          </div>
        ))}
      </div>
      <ul className="rl-notes ap-ha">
        {t.ha.map(([h, d]) => (
          <li key={h}><h3>{h}</h3><p>{d}</p></li>
        ))}
      </ul>
      <nav className="ap-docs" aria-label={all.docs.label}>
        <p className="ap-docs-label">{all.docs.label}</p>
        <ul>
          {all.docs.links.map(([href, label]) => (
            <li key={href}><a href={href} className="rl-link">{label}<Arrow/></a></li>
          ))}
        </ul>
      </nav>
    </Band>
  );
}

/* one edge host: Envoy carries the traffic, the three agents sit beside it on the same host */
const EDGE_DOT = { Envoy: 'rl-dot-flow', Shield: 'rl-dot-coral', 'elchi-client': 'rl-dot-lake' };

function EdgeDataPlane() {
  const t = STR[getLocale()].edge;
  const [envoy, ...agents] = t.nodes;
  return (
    <Band tone="sage" id="edge">
      <BandHead h2={<>{t.headingLine1} {t.headingLine2}</>} intro={t.intro}/>
      <div className="eh">
        <div className="eh-envoy">
          <div className="eh-envoy-id">
            <div className="ap-name">
              <span className={`rl-dot ${EDGE_DOT[envoy.name] || ''}`}></span>
              <h3>{envoy.name}</h3>
              <span className="ap-port">{envoy.port}</span>
            </div>
            <p>{envoy.desc}</p>
          </div>
          <ul className="ap-list">{envoy.items.map((it) => <li key={it}>{it}</li>)}</ul>
        </div>
        <div className="eh-agents">
          {agents.map((n) => (
            <div key={n.name} className={`eh-agent${n.name === 'Shield' ? ' is-shield' : ''}`}>
              <div className="ap-name">
                <span className={`rl-dot ${EDGE_DOT[n.name] || ''}`}></span>
                <h3>{n.name}</h3>
                <span className="ap-port">{n.port}</span>
              </div>
              <p>{n.desc}</p>
              <ul className="ap-list">{n.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <p className="ap-doc">
        {t.docPre}
        <a href="/docs/getting-started/architecture" className="rl-link">{t.docLink}</a>{t.docPost}
      </p>
    </Band>
  );
}

/* the layers as terraces: the console at the top of the hill, the proxy layer the widest and deepest */
function LayeredArch() {
  const t = STR[getLocale()].layered;
  const n = t.layers.length;
  return (
    <Band tone="mist2" id="layers">
      <BandHead h2={<>{t.headingLine1} {t.headingLine2}</>} intro={t.intro}/>
      <div className="terr">
        {t.layers.map((layer, i) => (
          <div key={layer.title} className={`terr-layer terr-${i + 1}`} style={{ '--inset': n - 1 - i }}>
            <h3 className="terr-title">{layer.title}</h3>
            <ul className="terr-items">
              {layer.items.map((it) => (
                <li key={it.name} className={it.name === 'Shield' ? 'is-shield' : it.name === 'Envoy Proxy' ? 'is-flow' : ''}>
                  <strong>{it.name}</strong>
                  <span>{it.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Band>
  );
}

/* the request path across the deep lake: soft nodes joined by animated water lines */
function FlowLine() {
  return (
    <svg className="af-line" width="56" height="20" viewBox="0 0 56 20" aria-hidden="true">
      <path className="af-line-dash" d="M4 10H46" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 7"/>
      <path d="M42 5l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RequestFlow() {
  const t = STR[getLocale()].requestFlow;
  const steps = t.steps;
  return (
    <Band tone="deep" id="request-flow">
      <BandHead h2={<>{t.headingLine1} {t.headingLine2}</>} intro={t.intro}/>
      <ol className="af-row">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && (
              <li className="af-link" aria-hidden="true">
                <FlowLine/>
                <span className="rl-map-label">{s.arrow}</span>
              </li>
            )}
            <li className={`af-step${i === steps.length - 1 ? ' is-end' : ''}`}>
              <span className="af-node"><span></span></span>
              <b>{s.label}</b>
              <span className="af-sub">{s.sub}</span>
            </li>
          </React.Fragment>
        ))}
      </ol>
      <ol className="af-explain">
        {t.explain.map(([h, d]) => (
          <li key={h}><h3>{h}</h3><p>{d}</p></li>
        ))}
      </ol>
    </Band>
  );
}

const INTEGRATIONS = ['Kubernetes', 'Docker', 'Envoy', 'Grafana', 'Prometheus', 'OpenStack', 'OpenRouter', 'LDAP / AD', 'Syslog', 'ELK Stack', 'Let\'s Encrypt', 'Google Trust Services'];

function Integrations() {
  const t = STR[getLocale()].integrations;
  return (
    <Band tone="mist" id="integrations">
      <BandHead h2={t.heading} intro={t.intro}/>
      <div className="ai">
        <span className="rl-map-label">{t.nativeLabel}</span>
        <ul>{INTEGRATIONS.map((name) => <li key={name}>{name}</li>)}</ul>
      </div>
    </Band>
  );
}

function ArchCTA() {
  const t = STR[getLocale()].cta;
  return (
    <Band tone="moss">
      <div className="ap-cta">
        <h2 className="rl-h2 cta-h2">{t.headingLine1} {t.headingLine2}</h2>
        <p className="rl-lede">{t.subtitle}</p>
        <div className="rl-actions">
          <a href="/docs/getting-started/quickstart" className="rl-go">{t.tryDemo}<Arrow/></a>
          <a href="https://charts.elchi.io" target="_blank" rel="noopener" className="rl-pill">{t.helmCharts}</a>
          <a href={locHref('contact')} className="rl-link">{t.contact}<Arrow/></a>
        </div>
      </div>
    </Band>
  );
}

export const Page = ArchApp;
if (typeof document !== 'undefined') ReactDOM.createRoot(document.getElementById('root')).render(<ArchApp/>);
