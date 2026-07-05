import React from 'react';
import ReactDOM from 'react-dom/client';
import { getLocale, locHref } from './i18n.js';
import { Nav, Footer } from './shared.jsx';

// All user-visible strings for the Architecture page, per locale. Technical terms
// (Envoy, Shield, proxy, control plane, xDS, WAF, gRPC, MongoDB, ClickHouse, …) and
// component/product names (Registry, Controller, Control-Plane, Collector,
// elchi-client) are intentionally kept in English in both locales. Structural values
// (accent colors, ports, layout flags) are identical across locales.
const STR = {
  en: {
    hero: {
      eyebrow: 'ARCHITECTURE',
      titleLine1: 'Three processes,',
      titleGrad: 'built to scale.',
      subtitle: 'A modern technology stack with distributed processing, intelligent routing, and enterprise-grade components — designed from day one for high availability.',
    },
    threeProcess: {
      eyebrow: '3-PROCESS DISTRIBUTED ARCHITECTURE',
      headingLine1: 'Specialized microservices,',
      headingLine2: 'working in harmony.',
      intro: 'Enterprise-grade scalability through three specialized processes — each with a clear role and lifecycle.',
      procs: [
        { name: 'Registry', port: ':9090', accent: '#06b6d4', desc: 'Service discovery and routing hub',
          items: ['Controller registration & address sharing', 'Client location tracking', 'Version-based control-plane routing', 'External processing integration', 'In-memory data with auto-cleanup'] },
        { name: 'Controller', port: 'REST', accent: '#8b5cf6', desc: 'REST API and management layer',
          items: ['Client management & command dispatch', 'xDS resource management (CDS, LDS, RDS, EDS)', 'User & authorization (JWT + RBAC)', 'MongoDB integration', 'AI-powered config analysis', 'K8s Discovery system'] },
        { name: 'Control-Plane', port: ':18000', accent: '#3b82f6', desc: 'gRPC-based xDS control plane',
          items: ['Envoy ADS (Aggregated Discovery Service)', 'VHDS (Virtual Host Discovery Service)', 'Snapshot management & cache system', 'Bridge services (snapshot, resource, poke)', 'Auto-registration with registry', 'Health monitoring & keepalive'] },
      ],
      ha: [
        ['High Availability', 'Multiple control-plane instances with automatic failover and health monitoring.'],
        ['Scalability', 'Load balancing across controllers and control-planes for enterprise workloads.'],
        ['Version Routing', 'Intelligent routing to appropriate control-plane versions based on client requirements.'],
      ],
    },
    edge: {
      eyebrow: 'EDGE & DATA PLANE',
      headingLine1: 'The control plane is half the story.',
      headingLine2: 'The edge is where traffic lives.',
      intro: 'Each edge host runs Envoy plus the agents that deploy it, secure it, and observe it — driven by the central control plane.',
      nodes: [
        { name: 'Envoy', port: 'data plane', accent: '#3b82f6', desc: 'The L7 proxy that carries your traffic',
          items: ['Receives config over xDS from the control-plane', 'Calls Shield over ext_proc for security decisions', 'Ships access logs (ALS) to the collector', 'No restarts — config applied live'] },
        { name: 'elchi-client', port: 'edge agent', accent: '#8b5cf6', desc: 'The agent that operates each edge host',
          items: ['Registers the node & runs controller commands (gRPC CommandStream)', 'Deploys / upgrades Envoy and bootstrap', 'Bundles & manages the Shield sidecar + Coraza WASM', 'Ships logs, manages BGP/FRR & networking'] },
        { name: 'Shield', port: 'ext_proc', accent: '#f43f5e', desc: 'API security enforced in the request path',
          items: ['WAF (OWASP CRS), JWT/mTLS, rate-limit, bot, DLP — 12 engines', 'Runs as a local sidecar over a UDS socket', 'Policies pushed as files, hot-reloaded', 'block / detect / shadow decisions, fail-open safe'] },
        { name: 'Collector', port: ':18090', accent: '#10b981', desc: 'Turns traffic into an API inventory',
          items: ['Ingests Envoy ALS access logs (gRPC)', 'Normalizes paths, scores risk & PII', 'Writes the endpoint catalog (MongoDB) + events (ClickHouse)', 'Powers API Discovery — metadata only, no bodies'] },
      ],
      docPre: 'Want the full wire map — every port, protocol, and data flow between the control plane and the edge? See the ',
      docLink: 'Architecture reference',
      docPost: ' in the docs.',
    },
    layered: {
      eyebrow: 'LAYERED ARCHITECTURE',
      headingLine1: 'From frontend to proxy.',
      headingLine2: 'Each layer, intentional.',
      intro: 'Modern technology stack with distributed processing and enterprise-grade components.',
      layers: [
        { title: 'Frontend Layer', color: '#3b82f6', items: [
          { name: 'React', desc: 'Modern UI Framework' },
          { name: 'TypeScript', desc: 'Type Safety' },
          { name: 'React Flow', desc: 'Graph Visualization' },
        ] },
        { title: 'Backend Layer — 3-Process Architecture', color: '#8b5cf6', wide: true, items: [
          { name: 'Controller', desc: 'REST API · client mgmt, xDS, auth', port: 'Custom' },
          { name: 'Control-Plane', desc: 'gRPC xDS · ADS, VHDS, snapshot cache', port: ':18000' },
          { name: 'Registry', desc: 'Discovery · service routing, versioning', port: ':9090' },
        ] },
        { title: 'Data & Storage Layer', color: '#06b6d4', items: [
          { name: 'MongoDB', desc: 'Config Storage' },
          { name: 'VictoriaMetrics', desc: 'Time-Series DB' },
          { name: 'OpenRouter', desc: 'AI Model Integration' },
        ] },
        { title: 'Proxy Layer', color: '#10b981', items: [
          { name: 'Envoy Proxy', desc: 'Multi-Version Support' },
          { name: 'WAF', desc: 'OWASP CRS' },
          { name: 'Health Check', desc: 'Auto-Recovery' },
        ] },
      ],
    },
    requestFlow: {
      eyebrow: 'REQUEST FLOW',
      headingLine1: 'From client connection',
      headingLine2: 'to live config.',
      intro: 'How a request travels through the platform — from initial registration to applied configuration.',
      steps: [
        { label: 'Client', sub: 'Agent on host', accent: '#64748b' },
        { label: 'Registry', sub: 'Register & discover', accent: '#06b6d4', arrow: 'register' },
        { label: 'Controller', sub: 'Route to version', accent: '#8b5cf6', arrow: 'route' },
        { label: 'Control-Plane', sub: 'Serve xDS config', accent: '#3b82f6', arrow: 'xDS' },
        { label: 'Envoy', sub: 'Apply config', accent: '#10b981', arrow: 'config' },
      ],
      explain: [
        ['Registration', 'Clients register with Registry for service discovery on startup.'],
        ['Routing', 'Registry routes clients to the appropriate Controller version.'],
        ['xDS Protocol', 'Control-Plane serves Envoy configurations via gRPC streams.'],
        ['Configuration', 'Envoy receives and applies dynamic configurations live.'],
      ],
    },
    integrations: {
      eyebrow: 'NATIVE INTEGRATIONS',
      heading: 'Plays well with your stack.',
      intro: 'First-class integrations with the cloud-native ecosystem.',
      nativeLabel: 'Native integration',
    },
    cta: {
      eyebrow: 'READY TO DEPLOY',
      headingLine1: 'Bring this architecture',
      headingLine2: 'to your cluster.',
      subtitle: 'Try the full stack with our demo, or deploy to your Kubernetes cluster using our Helm chart.',
      tryDemo: 'Try Demo',
      helmCharts: 'Helm Charts',
    },
  },
  tr: {
    hero: {
      eyebrow: 'MİMARİ',
      titleLine1: 'Üç süreç,',
      titleGrad: 'ölçeklenmek üzere kuruldu.',
      subtitle: 'Dağıtık işleme, akıllı yönlendirme ve kurumsal seviye bileşenlerle modern bir teknoloji yığını — yüksek erişilebilirlik için ilk günden tasarlandı.',
    },
    threeProcess: {
      eyebrow: '3 SÜREÇLİ DAĞITIK MİMARİ',
      headingLine1: 'Uzmanlaşmış mikroservisler,',
      headingLine2: 'uyum içinde çalışıyor.',
      intro: 'Üç uzmanlaşmış süreçle kurumsal seviye ölçeklenebilirlik — her biri net bir role ve yaşam döngüsüne sahip.',
      procs: [
        { name: 'Registry', port: ':9090', accent: '#06b6d4', desc: 'Servis keşfi ve yönlendirme merkezi',
          items: ['Controller kaydı ve adres paylaşımı', 'İstemci konum takibi', 'Sürüm tabanlı control-plane yönlendirmesi', 'External processing entegrasyonu', 'Otomatik temizlemeli bellek içi veri'] },
        { name: 'Controller', port: 'REST', accent: '#8b5cf6', desc: 'REST API ve yönetim katmanı',
          items: ['İstemci yönetimi ve komut dağıtımı', 'xDS kaynak yönetimi (CDS, LDS, RDS, EDS)', 'Kullanıcı ve yetkilendirme (JWT + RBAC)', 'MongoDB entegrasyonu', 'AI destekli yapılandırma analizi', 'K8s Discovery sistemi'] },
        { name: 'Control-Plane', port: ':18000', accent: '#3b82f6', desc: 'gRPC tabanlı xDS control plane',
          items: ['Envoy ADS (Aggregated Discovery Service)', 'VHDS (Virtual Host Discovery Service)', 'Snapshot yönetimi ve önbellek sistemi', 'Köprü servisleri (snapshot, resource, poke)', 'Registry ile otomatik kayıt', 'Sağlık izleme ve keepalive'] },
      ],
      ha: [
        ['Yüksek Erişilebilirlik', 'Otomatik yük devretme ve sağlık izlemeyle birden fazla control-plane örneği.'],
        ['Ölçeklenebilirlik', "Kurumsal iş yükleri için Controller ve control-plane'ler arasında yük dengeleme."],
        ['Sürüm Yönlendirme', 'İstemci gereksinimlerine göre uygun control-plane sürümlerine akıllı yönlendirme.'],
      ],
    },
    edge: {
      eyebrow: 'EDGE VE DATA PLANE',
      headingLine1: 'Control plane hikayenin yalnızca yarısı.',
      headingLine2: 'Trafiğin yaşadığı yer ise edge.',
      intro: "Her edge host, Envoy'un yanında onu dağıtan, güvenli hale getiren ve gözlemleyen ajanları çalıştırır — merkezi control plane tarafından yönetilir.",
      nodes: [
        { name: 'Envoy', port: 'data plane', accent: '#3b82f6', desc: 'Trafiğinizi taşıyan L7 proxy',
          items: ["Yapılandırmayı control-plane'den xDS üzerinden alır", "Güvenlik kararları için Shield'ı ext_proc üzerinden çağırır", "Erişim loglarını (ALS) Collector'a gönderir", 'Yeniden başlatma yok — yapılandırma canlı uygulanır'] },
        { name: 'elchi-client', port: 'edge agent', accent: '#8b5cf6', desc: "Her edge host'u işleten ajan",
          items: ["Node'u kaydeder ve Controller komutlarını çalıştırır (gRPC CommandStream)", "Envoy ve bootstrap'i dağıtır / yükseltir", "Shield sidecar'ını + Coraza WASM'ı paketler ve yönetir", 'Logları gönderir, BGP/FRR ve ağ yönetimini üstlenir'] },
        { name: 'Shield', port: 'ext_proc', accent: '#f43f5e', desc: 'İstek yolunda uygulanan API güvenliği',
          items: ['WAF (OWASP CRS), JWT/mTLS, rate-limit, bot, DLP — 12 motor', 'UDS socket üzerinden yerel bir sidecar olarak çalışır', 'Politikalar dosya olarak iletilir, anlık yeniden yüklenir', 'block / detect / shadow kararları, fail-open güvenli'] },
        { name: 'Collector', port: ':18090', accent: '#10b981', desc: 'Trafiği bir API envanterine dönüştürür',
          items: ['Envoy ALS erişim loglarını alır (gRPC)', 'Yolları normalleştirir, risk ve PII puanlar', 'Endpoint kataloğunu (MongoDB) + olayları (ClickHouse) yazar', "API Discovery'yi besler — yalnızca meta veri, gövde yok"] },
      ],
      docPre: 'Tam bağlantı haritasını mı istiyorsunuz — control plane ile edge arasındaki her port, protokol ve veri akışını? Dokümanlardaki ',
      docLink: 'Mimari referansına',
      docPost: ' göz atın.',
    },
    layered: {
      eyebrow: 'KATMANLI MİMARİ',
      headingLine1: "Frontend'den proxy'ye.",
      headingLine2: 'Her katman, özenle tasarlandı.',
      intro: 'Dağıtık işleme ve kurumsal seviye bileşenlerle modern teknoloji yığını.',
      layers: [
        { title: 'Frontend Katmanı', color: '#3b82f6', items: [
          { name: 'React', desc: 'Modern UI Çerçevesi' },
          { name: 'TypeScript', desc: 'Tip Güvenliği' },
          { name: 'React Flow', desc: 'Graf Görselleştirme' },
        ] },
        { title: 'Backend Katmanı — 3 Süreçli Mimari', color: '#8b5cf6', wide: true, items: [
          { name: 'Controller', desc: 'REST API · istemci yönetimi, xDS, yetkilendirme', port: 'Custom' },
          { name: 'Control-Plane', desc: 'gRPC xDS · ADS, VHDS, snapshot önbelleği', port: ':18000' },
          { name: 'Registry', desc: 'Discovery · servis yönlendirme, sürümleme', port: ':9090' },
        ] },
        { title: 'Veri ve Depolama Katmanı', color: '#06b6d4', items: [
          { name: 'MongoDB', desc: 'Yapılandırma Deposu' },
          { name: 'VictoriaMetrics', desc: 'Zaman Serisi Veritabanı' },
          { name: 'OpenRouter', desc: 'AI Model Entegrasyonu' },
        ] },
        { title: 'Proxy Katmanı', color: '#10b981', items: [
          { name: 'Envoy Proxy', desc: 'Çoklu Sürüm Desteği' },
          { name: 'WAF', desc: 'OWASP CRS' },
          { name: 'Health Check', desc: 'Otomatik Kurtarma' },
        ] },
      ],
    },
    requestFlow: {
      eyebrow: 'İSTEK AKIŞI',
      headingLine1: 'İstemci bağlantısından',
      headingLine2: 'canlı yapılandırmaya.',
      intro: 'Bir isteğin platform boyunca izlediği yol — ilk kayıttan uygulanan yapılandırmaya.',
      steps: [
        { label: 'Client', sub: 'Host üzerindeki ajan', accent: '#64748b' },
        { label: 'Registry', sub: 'Kaydet ve keşfet', accent: '#06b6d4', arrow: 'kayıt' },
        { label: 'Controller', sub: 'Sürüme yönlendir', accent: '#8b5cf6', arrow: 'yönlendir' },
        { label: 'Control-Plane', sub: 'xDS yapılandırması sun', accent: '#3b82f6', arrow: 'xDS' },
        { label: 'Envoy', sub: 'Yapılandırmayı uygula', accent: '#10b981', arrow: 'yapılandır' },
      ],
      explain: [
        ['Kayıt', "İstemciler başlangıçta servis keşfi için Registry'ye kaydolur."],
        ['Yönlendirme', 'Registry, istemcileri uygun Controller sürümüne yönlendirir.'],
        ['xDS Protokolü', 'Control-Plane, Envoy yapılandırmalarını gRPC akışları üzerinden sunar.'],
        ['Yapılandırma', 'Envoy, dinamik yapılandırmaları canlı olarak alır ve uygular.'],
      ],
    },
    integrations: {
      eyebrow: 'YERLEŞİK ENTEGRASYONLAR',
      heading: 'Yığınınızla uyumlu çalışır.',
      intro: 'Cloud-native ekosistemiyle birinci sınıf entegrasyonlar.',
      nativeLabel: 'Yerleşik entegrasyon',
    },
    cta: {
      eyebrow: 'DAĞITMAYA HAZIR',
      headingLine1: 'Bu mimariyi',
      headingLine2: "cluster'ınıza taşıyın.",
      subtitle: "Tüm yığını demomuzla deneyin ya da Helm chart'ımızı kullanarak Kubernetes cluster'ınıza dağıtın.",
      tryDemo: 'Demoyu Dene',
      helmCharts: 'Helm Charts',
    },
  },
};

function ArchApp() {
  return (
    <>
      <Nav active="architecture"/>
      <ArchHero/>
      <ThreeProcess/>
      <EdgeDataPlane/>
      <LayeredArch/>
      <RequestFlow/>
      <Integrations/>
      <ArchCTA/>
      <Footer/>
    </>
  );
}

function ArchHero() {
  const t = STR[getLocale()].hero;
  return (
    <section className="section" style={{ paddingTop: 80, paddingBottom: 60, position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 700, height: 500, top: -150, right: '10%', background: 'radial-gradient(closest-side, #c7d2fe, transparent)', opacity: .55 }}></div>
      <div className="aurora" style={{ width: 500, height: 400, top: 80, left: '5%', background: 'radial-gradient(closest-side, #bae6fd, transparent)', opacity: .4 }}></div>
      <div className="grid-bg"></div>
      <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 920, margin: '0 auto' }}>
        <span className="eyebrow"><span className="dot"></span>{t.eyebrow}</span>
        <h1 style={{ marginTop: 24, marginBottom: 24 }}>
          {t.titleLine1}<br/>
          <span className="grad-text">{t.titleGrad}</span>
        </h1>
        <p style={{ fontSize: 19, color: 'var(--slate-600)', maxWidth: 720, margin: '0 auto' }}>
          {t.subtitle}
        </p>
      </div>
    </section>
  );
}

function ThreeProcess() {
  const t = STR[getLocale()].threeProcess;
  const procs = t.procs;

  return (
    <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.eyebrow}</span>
          <h2>{t.headingLine1}<br/>{t.headingLine2}</h2>
          <p>{t.intro}</p>
        </div>

        <div className="proc-grid-light">
          {procs.map((p, i) => (
            <div key={i} className="proc-card-light card">
              <div className="proc-head-light" style={{ borderBottomColor: `${p.accent}33` }}>
                <span className="proc-dot" style={{ background: p.accent, boxShadow: `0 0 12px ${p.accent}` }}></span>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', background: 'var(--slate-100)', padding: '3px 8px', borderRadius: 6 }}>{p.port}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--slate-600)', margin: '14px 0 18px' }}>{p.desc}</p>
              <ul className="proc-list-light">
                {p.items.map((it, j) => (
                  <li key={j}>
                    <span style={{ color: p.accent, fontWeight: 700 }}>›</span> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ha-grid-light">
          {t.ha.map(([t2, d], i) => (
            <div key={i} className="ha-cell-light">
              <div className="mono" style={{ fontSize: 11, color: 'var(--blue-600)', marginBottom: 10 }}>{String(i+1).padStart(2,'0')}</div>
              <h4 style={{ marginBottom: 8, fontSize: 16 }}>{t2}</h4>
              <p style={{ fontSize: 13.5, color: 'var(--slate-600)' }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EdgeDataPlane() {
  const t = STR[getLocale()].edge;
  const nodes = t.nodes;
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.eyebrow}</span>
          <h2>{t.headingLine1}<br/>{t.headingLine2}</h2>
          <p>{t.intro}</p>
        </div>

        <div className="proc-grid-light">
          {nodes.map((p, i) => (
            <div key={i} className="proc-card-light card">
              <div className="proc-head-light" style={{ borderBottomColor: `${p.accent}33` }}>
                <span className="proc-dot" style={{ background: p.accent, boxShadow: `0 0 12px ${p.accent}` }}></span>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', background: 'var(--slate-100)', padding: '3px 8px', borderRadius: 6 }}>{p.port}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--slate-600)', margin: '14px 0 18px' }}>{p.desc}</p>
              <ul className="proc-list-light">
                {p.items.map((it, j) => (
                  <li key={j}>
                    <span style={{ color: p.accent, fontWeight: 700 }}>›</span> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14.5, color: 'var(--slate-600)' }}>
          {t.docPre}
          <a href="/docs/getting-started/architecture" style={{ color: 'var(--blue-600)', fontWeight: 600 }}>{t.docLink}</a>{t.docPost}
        </p>
      </div>
    </section>
  );
}

function LayeredArch() {
  const t = STR[getLocale()].layered;
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.eyebrow}</span>
          <h2>{t.headingLine1}<br/>{t.headingLine2}</h2>
          <p>{t.intro}</p>
        </div>

        <div className="layered-stack">
          {t.layers.map((layer, i) => (
            <Layer
              key={i}
              title={layer.title}
              color={layer.color}
              wide={layer.wide}
              items={layer.items}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Layer({ title, items, color, wide }) {
  return (
    <div className="layer">
      <div className="layer-label">
        <span className="layer-dot" style={{ background: color }}></span>
        <span className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--slate-500)' }}>
          {title}
        </span>
      </div>
      <div className="layer-row" style={{ '--accent': color }}>
        {items.map((it, i) => (
          <div key={i} className="layer-cell">
            <div className="layer-cell-head">
              <strong>{it.name}</strong>
              {it.port && <span className="mono" style={{ fontSize: 10, color, background: `${color}1a`, padding: '2px 6px', borderRadius: 4 }}>{it.port}</span>}
            </div>
            <span style={{ fontSize: 13, color: 'var(--slate-500)' }}>{it.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestFlow() {
  const t = STR[getLocale()].requestFlow;
  const steps = t.steps;

  return (
    <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div className="dot-bg" style={{ opacity: 0.18 }}></div>
      <div className="aurora" style={{ width: 700, height: 500, top: 100, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(closest-side, #1d4ed8, transparent)', opacity: 0.35 }}></div>

      <div className="container" style={{ position: 'relative' }}>
        <div className="section-head">
          <span className="eyebrow" style={{ background: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.3)', color: '#93c5fd' }}>
            <span className="dot"></span>{t.eyebrow}
          </span>
          <h2 style={{ color: 'white' }}>{t.headingLine1}<br/>{t.headingLine2}</h2>
          <p style={{ color: '#94a3b8' }}>{t.intro}</p>
        </div>

        <div className="flow-row">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flow-step">
                <div className="flow-circle" style={{ borderColor: s.accent, color: s.accent }}>
                  <span className="flow-dot" style={{ background: s.accent }}></span>
                </div>
                <div className="flow-label">{s.label}</div>
                <div className="flow-sub">{s.sub}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="flow-arrow">
                  <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="92" y2="20" stroke={steps[i+1].accent} strokeWidth="2" strokeDasharray="4 4">
                      <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.4s" repeatCount="indefinite"/>
                    </line>
                    <path d={`M 86 14 L 96 20 L 86 26`} stroke={steps[i+1].accent} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="mono flow-arrow-label">{steps[i+1].arrow}</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flow-explain">
          {t.explain.map(([t2, d], i) => (
            <div key={i} className="flow-explain-cell">
              <div className="mono" style={{ fontSize: 11, color: '#60a5fa', marginBottom: 8 }}>{String(i+1).padStart(2,'0')}</div>
              <h4 style={{ color: 'white', fontSize: 15, marginBottom: 6 }}>{t2}</h4>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.55 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  const t = STR[getLocale()].integrations;
  const ints = ['Kubernetes', 'Docker', 'gRPC', 'Prometheus', 'MongoDB', 'Grafana', 'Envoy', 'OpenRouter', 'LDAP', 'Syslog', 'ELK Stack', 'Let\'s Encrypt'];
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{t.eyebrow}</span>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>
        </div>
        <div className="int-grid">
          {ints.map((name, i) => (
            <div key={i} className="int-cell card">
              <div className="int-mark mono">{name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{t.nativeLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchCTA() {
  const t = STR[getLocale()].cta;
  return (
    <section className="section">
      <div className="container">
        <div className="cta-card">
          <div className="grid-bg" style={{ opacity: .4 }}></div>
          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <span className="eyebrow"><span className="dot"></span>{t.eyebrow}</span>
            <h2 style={{ marginTop: 16, marginBottom: 16 }}>
              {t.headingLine1}<br/>{t.headingLine2}
            </h2>
            <p style={{ fontSize: 18, color: 'var(--slate-600)', maxWidth: 560, margin: '0 auto' }}>
              {t.subtitle}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'center' }}>
              <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">{t.tryDemo}</a>
              <a href="https://charts.elchi.io" target="_blank" rel="noopener" className="btn btn-ghost">{t.helmCharts}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ArchApp/>);
