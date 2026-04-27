import { useState } from 'react';
import ReactDOM from 'react-dom/client';
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
              ENTERPRISE PROXY MANAGEMENT
            </span>
            <h1 style={{ marginTop: 24 }}>
              Manage Traffic at <br/>
              <span className="grad-text">enterprise scale.</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--slate-600)', marginTop: 24, maxWidth: 540 }}>
              Scalable 3-process distributed architecture with intelligent automation,
              comprehensive xDS protocol support, and a modern UI for managing
              clients at enterprise scale.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
              <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">Try Demo →</a>
              <a href="architecture.html" className="btn btn-ghost">View architecture</a>
            </div>
            <div style={homeStyles.badges}>
              {[
                ['3-Process', 'Distributed Architecture'],
                ['Full xDS', 'Protocol Support'],
                ['Multi-Version', 'Proxy & Upgrade'],
                ['Real-time', 'Validation'],
              ].map(([k, v]) => (
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
  const items = ['Kubernetes', 'Docker', 'gRPC', 'Prometheus', 'MongoDB', 'Grafana', 'OpenRouter'];
  return (
    <div className="logos-strip">
      <div className="container">
        <div className="logos-label mono">TRUSTED INTEGRATIONS</div>
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
  const items = [
    { t: 'Proto to UI Auto-Generation', d: 'Automatically generates UI configuration components from client protobuf definitions. Listeners, Clusters, Endpoints, Routes — with full TypeScript safety.', icon: 'proto' },
    { t: 'Interactive Dependency Graphs', d: 'Cytoscape-powered visual diagrams display relationships between client components. Understand data flow and troubleshoot interactively.', icon: 'graph' },
    { t: 'Quick Start Scenarios', d: 'Pre-built templates for common client configurations. Generate complete setups for API gateways, load balancers, and service mesh in clicks.', icon: 'spark' },
    { t: 'Go-Based Agent', d: 'Lightweight Go agent for client-side management. Auto-registration, health monitoring, log export to Syslog/ELK.', icon: 'agent' },
    { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS) using go-control-plane. Delta xDS for efficient updates.', icon: 'xds' },
    { t: 'Two-Step Validation', d: 'Frontend TypeScript validation and backend protoc-gen-validate ensures configurations are correct before deployment.', icon: 'check' },
    { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically. Rollback on demand.', icon: 'flow' },
    { t: 'Multi-Version Client Support', d: 'Manage multiple client versions from a single interface. Intelligent version routing with seamless migration X → Y.', icon: 'version' },
    { t: 'Project-Based Multi-Tenancy', d: 'Organize configurations by teams, environments, or customers. 4-tier RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
  ];
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>CORE FEATURES</span>
          <h2>Everything you need.<br/>Nothing you don't.</h2>
          <p>Comprehensive platform for enterprise proxy management with modern UI and powerful automation.</p>
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
  const rows = [
    { f: 'Intelligent Configuration Analysis', e: true, m: false, s: false, sub: 'Automated config analysis with recommendations' },
    { f: 'Proto-to-UI Auto Generation', e: true, m: false, s: false, sub: 'UI auto-generated from client protobufs' },
    { f: 'Multi-Version Client Support', e: true, m: false, s: 'partial', sub: 'Single interface, version routing' },
    { f: '3-Process Distributed Architecture', e: true, m: false, s: false, sub: 'Registry, Controller, Control-Plane' },
    { f: 'Real-time Configuration Validation', e: true, m: false, s: 'basic', sub: 'Two-step validation before production' },
    { f: 'Kubernetes Auto-Discovery', e: true, m: false, s: true, sub: 'Real-time endpoint sync' },
    { f: 'Visual Dependency Graphs', e: true, m: false, s: 'limited', sub: 'Cytoscape-based, interactive' },
    { f: 'Enterprise Multi-Tenancy', e: true, m: false, s: 'varies', sub: 'Project isolation, 4-tier RBAC' },
    { f: 'Version Upgrade & Migration', e: true, m: false, s: false, sub: 'Migrate configs X → Y' },
    { f: 'LDAP / AD Authentication', e: true, m: false, s: 'varies', sub: 'Centralized SSO' },
    { f: 'Log Export (Syslog / ELK)', e: true, m: false, s: 'limited', sub: 'External observability stack' },
    { f: 'Web Application Firewall (WAF)', e: true, m: false, s: false, sub: 'Integrated OWASP CRS' },
    { f: 'ACME Certificate Management', e: true, m: false, s: 'limited', sub: 'Let\'s Encrypt + Google Trust' },
    { f: 'Global Server Load Balancing', e: true, m: false, s: false, sub: 'DNS-based with health probing' },
  ];

  const Cell = ({ v }) => {
    if (v === true) return <span className="cmp-yes">✓</span>;
    if (v === false) return <span className="cmp-no">—</span>;
    return <span className="cmp-partial">{v}</span>;
  };

  return (
    <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>WHY ELCHI</span>
          <h2>Built for the work,<br/>not the workaround.</h2>
          <p>See how Elchi compares to manual client configuration and traditional service mesh solutions.</p>
        </div>

        <div className="cmp-table card" style={{ overflow: 'hidden' }}>
          <div className="cmp-row cmp-head">
            <div className="cmp-feat">Feature</div>
            <div className="cmp-col cmp-elchi">Elchi</div>
            <div className="cmp-col">Manual Config</div>
            <div className="cmp-col">Service Mesh</div>
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
          {[
            ['Intelligent Automation', 'Advanced automated analysis for configuration optimization and intelligent log troubleshooting.'],
            ['Auto-Generated UI', 'Unique proto-to-UI generation means support for new client features without manual UI updates.'],
            ['Version Intelligence', 'Smart routing to appropriate control-plane versions based on client version.'],
            ['Enterprise Ready', 'Built from ground up for multi-tenancy, RBAC, and compliance requirements.'],
            ['Seamless Upgrades', 'Effortlessly upgrade between client versions with automated compatibility validation.'],
            ['Enterprise Auth', 'LDAP / AD integration for centralized authentication and authorization.'],
            ['Log Centralization', 'Export logs to Syslog and ELK stack for unified observability.'],
            ['Advanced Metrics', 'Built-in dashboards with Grafana integration for comprehensive monitoring.'],
          ].map(([t, d], i) => (
            <div key={i} className="unique-cell">
              <div className="unique-num mono">{String(i+1).padStart(2,'0')}</div>
              <h4>{t}</h4>
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
  const cats = ['All','Management','Tools','Configuration','Monitoring','Visualization','Overview','AI','Security','Discovery','Documentation','Load Balancing'];
  const [active, setActive] = useState('All');
  const shots = [
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
  ];
  const filtered = active === 'All' ? shots : shots.filter(s => s.cat === active);

  return (
    <section className="section" id="screenshots">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>PLATFORM SCREENSHOTS</span>
          <h2>Designed for the operator,<br/>built for the platform team.</h2>
          <p>Explore Elchi's powerful interface designed for enterprise-grade proxy management.</p>
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
  return (
    <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div className="dot-bg" style={{ opacity: 0.2 }}></div>
      <div className="aurora" style={{ width: 600, height: 600, top: -100, right: -100, background: 'radial-gradient(closest-side, #1d4ed8, transparent)', opacity: 0.4 }}></div>

      <div className="container" style={{ position: 'relative' }}>
        <div className="section-head">
          <span className="eyebrow" style={{ background: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.3)', color: '#93c5fd' }}>
            <span className="dot"></span>3-PROCESS ARCHITECTURE
          </span>
          <h2 style={{ color: 'white' }}>Three processes.<br/>One coherent platform.</h2>
          <p style={{ color: '#94a3b8' }}>Enterprise-grade scalability with specialized microservices working in harmony.</p>
        </div>

        <div className="proc-grid">
          {[
            { name: 'Registry', port: ':9090', accent: '#22d3ee', desc: 'Service discovery and routing hub',
              items: ['Controller registration', 'Client location tracking', 'Version-based routing', 'External processing', 'In-memory + auto-cleanup'] },
            { name: 'Controller', port: 'REST', accent: '#a78bfa', desc: 'REST API and management layer',
              items: ['Client management & dispatch', 'xDS resources (CDS, LDS, RDS, EDS)', 'JWT + RBAC auth', 'MongoDB integration', 'AI config analysis', 'K8s discovery'] },
            { name: 'Control-Plane', port: ':18000', accent: '#60a5fa', desc: 'gRPC-based xDS control plane',
              items: ['Client ADS', 'VHDS (Virtual Host Discovery)', 'Snapshot management', 'Bridge services', 'Auto-registration', 'Health & keepalive'] },
          ].map((p, i) => (
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
          {[
            ['High Availability', 'Multiple control-plane instances with automatic failover and health monitoring'],
            ['Scalability', 'Load balancing across controllers and control-planes for enterprise workloads'],
            ['Version Routing', 'Intelligent routing to appropriate control-plane versions based on client requirements'],
          ].map(([t, d], i) => (
            <div key={i} className="ha-cell">
              <h4>{t}</h4>
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
  const cases = [
    { t: 'API Gateway Management', d: 'Centralized management of clients as an API gateway for microservices architectures.', list: ['Rate limiting & traffic control','Authentication & authorization','Request/response transformation','API versioning & routing'] },
    { t: 'Service Mesh Management', d: 'Deploy and manage clients as a service mesh data plane with centralized control.', list: ['Service-to-service communication','Traffic splitting & canary','Circuit breaking & retries','Observability & metrics'] },
    { t: 'Multi-Cluster Deployment', d: 'Manage client instances across multiple Kubernetes clusters with unified configuration.', list: ['Cross-cluster service discovery','Unified policy enforcement','Disaster recovery & failover','Global load balancing'] },
    { t: 'Enterprise Microservices', d: 'Enterprise-grade client management with multi-tenancy and role-based access control.', list: ['Team-based config isolation','Audit logging & compliance','Centralized policy management','Self-service configuration'] },
    { t: 'Cloud-Native Applications', d: 'Modern cloud-native applications leveraging clients for traffic management and observability.', list: ['Container-based deployments','Auto-scaling & load balancing','Zero-downtime deployments','Health checking & monitoring'] },
    { t: 'Edge Proxy & CDN', d: 'Deploy clients at the edge for content delivery and request routing.', list: ['Geographic traffic routing','Cache management','DDoS protection','SSL/TLS termination'] },
  ];
  return (
    <section className="section" id="use-cases">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>USE CASES</span>
          <h2>Versatile by design.</h2>
          <p>Versatile platform designed for diverse deployment scenarios.</p>
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
  const items = ['Financial Services','E-Commerce','Healthcare','Technology','Telecommunications','Media & Entertainment'];
  return (
    <section className="section-tight" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--slate-500)', marginBottom: 24 }}>
          TRUSTED ACROSS INDUSTRIES
        </div>
        <div className="ind-row">
          {items.map(it => (
            <div key={it} className="ind-item">{it}</div>
          ))}
        </div>
        <p style={{ marginTop: 28, color: 'var(--slate-500)' }}>
          Whatever your use case, Elchi provides the flexibility and power you need.
        </p>
      </div>
    </section>
  );
}

/* ====================== FINAL CTA ====================== */
function FinalCTA() {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-card">
          <div className="grid-bg" style={{ opacity: .4 }}></div>
          <div style={{ position: 'relative' }}>
            <span className="eyebrow"><span className="dot"></span>EXPERIENCE ELCHI NOW</span>
            <h2 style={{ marginTop: 16, marginBottom: 16 }}>
              Ready to simplify your<br/>client management?
            </h2>
            <p style={{ fontSize: 18, color: 'var(--slate-600)', maxWidth: 600 }}>
              Try the stack solution for proxy management with our demo, or deploy to
              your Kubernetes cluster using our Helm chart.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">Try Demo</a>
              <a href="https://artifacthub.io/packages/helm/elchi-stack/elchi-stack" target="_blank" rel="noopener" className="btn btn-ghost">Helm Chart</a>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 36, flexWrap: 'wrap' }}>
              {['Ready To Use','MongoDB Store','Multi-Version Proxy','Agent Support'].map(t => (
                <span key={t} style={{ fontSize: 14, color: 'var(--slate-700)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</span>
                  {t}
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
