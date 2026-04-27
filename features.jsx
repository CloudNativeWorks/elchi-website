import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';

function FeaturesApp() {
  return (
    <>
      <Nav active="features"/>
      <FeaturesHero/>
      <CoreFeatures/>
      <AdvancedFeatures/>
      <ComprehensiveFeatures/>
      <Compliance/>
      <Footer/>
    </>
  );
}

function FeaturesHero() {
  return (
    <section className="section" style={{ paddingTop: 80, paddingBottom: 60, position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 800, height: 500, top: -100, left: '20%', background: 'radial-gradient(closest-side, #c7d2fe, transparent)', opacity: .5 }}></div>
      <div className="grid-bg"></div>
      <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
        <span className="eyebrow"><span className="dot"></span>FEATURES</span>
        <h1 style={{ marginTop: 24, marginBottom: 24 }}>
          A complete proxy <br/>
          <span className="grad-text">management toolkit.</span>
        </h1>
        <p style={{ fontSize: 19, color: 'var(--slate-600)', maxWidth: 640, margin: '0 auto' }}>
          Comprehensive platform for enterprise proxy management with modern UI,
          intelligent automation, and powerful enterprise capabilities.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop: 32 }}>
          <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">Try Demo →</a>
          <a href="architecture.html" className="btn btn-ghost">See architecture</a>
        </div>
      </div>
    </section>
  );
}

function CoreFeatures() {
  const items = [
    { t: 'Proto to UI Auto-Generation', d: 'Automatically generates UI configuration components from Envoy protobuf definitions. Create Listeners, Clusters, Endpoints, and Routes with full TypeScript type safety and validation.', icon: 'proto' },
    { t: 'Interactive Dependency Graphs', d: 'Cytoscape-powered visual diagrams display relationships between Envoy components. Understand resource dependencies, data flow, and troubleshoot configurations.', icon: 'graph' },
    { t: 'Quick Start Scenarios', d: 'Pre-built templates for common Envoy configurations. Generate complete setups for API gateways, load balancers, and service mesh deployments with just a few clicks.', icon: 'spark' },
    { t: 'Go-Based Agent', d: 'Lightweight Go agent for client-side Envoy management. Automatic registration, health monitoring, log export to Syslog/ELK, and seamless integration with the control plane.', icon: 'agent' },
    { t: 'Full xDS Protocol Support', d: 'Complete implementation of xDS (ADS, CDS, EDS, LDS, RDS, VHDS) using go-control-plane. Delta xDS support for efficient incremental configuration updates.', icon: 'xds' },
    { t: 'Two-Step Validation', d: 'Frontend TypeScript validation and backend protoc-gen-validate ensures configurations are correct before deployment. Catch errors early and prevent misconfigurations.', icon: 'check' },
    { t: 'Save & Publish Workflow', d: 'Draft mode for safe configuration changes. Save incrementally and publish bulk updates atomically when ready. Rollback support for quick recovery from issues.', icon: 'flow' },
    { t: 'Multi-Version Envoy Support', d: 'Manage Envoy versions 1.27 through 1.35+ from a single interface. Intelligent version-based routing with seamless version upgrade capability.', icon: 'version' },
    { t: 'Project-Based Multi-Tenancy', d: 'Organize configurations by teams, environments, or customers. Complete resource isolation with 4-tier RBAC (Owner, Admin, Editor, Viewer).', icon: 'lock' },
  ];

  const ICON = {
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

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>CORE FEATURES</span>
          <h2>The fundamentals,<br/>automated end-to-end.</h2>
          <p>Comprehensive platform for enterprise proxy management with modern UI and powerful automation.</p>
        </div>
        <div className="features-grid">
          {items.map((it, i) => (
            <div key={i} className="card feat-card">
              <div className="feat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none">{ICON[it.icon]}</svg></div>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvancedFeatures() {
  const items = [
    {
      tag: 'OpenRouter AI Integration',
      t: 'AI-Powered Analysis',
      d: 'Bring your own OpenRouter API key and choose any AI model for configuration analysis, log debugging, pattern recognition, and intelligent troubleshooting recommendations.',
      bullets: ['Configuration analysis', 'Log pattern recognition', 'Anomaly detection', 'Root cause analysis'],
      accent: '#8b5cf6',
      visual: 'ai',
    },
    {
      tag: 'Auto Endpoint Management',
      t: 'Kubernetes Discovery',
      d: 'Automatic discovery and synchronization of Kubernetes endpoints with real-time updates as your services scale.',
      bullets: ['Auto-discover K8s services', 'Real-time endpoint updates', 'Multi-cluster support', 'Service mesh integration'],
      accent: '#06b6d4',
      visual: 'k8s',
    },
    {
      tag: 'Automated SSL/TLS',
      t: 'ACME Certificate Management',
      d: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services. DNS-01 challenge verification with auto-renewal.',
      bullets: ['Let\'s Encrypt integration', 'Google Trust Services', 'DNS provider management', 'Automatic renewal'],
      accent: '#10b981',
      visual: 'cert',
    },
    {
      tag: 'DNS-Based Traffic Management',
      t: 'Global Server Load Balancing',
      d: 'Enterprise GSLB with intelligent health probing, automatic failover, and geo-based traffic routing. Integrate with CoreDNS for dynamic DNS responses based on endpoint health.',
      bullets: ['HTTP/HTTPS/TCP health probes', 'Anti-flapping protection', 'Per-record failover zones', 'Circuit breaker with backoff'],
      accent: '#f59e0b',
      visual: 'gslb',
    },
  ];

  return (
    <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>ADVANCED FEATURES</span>
          <h2>Enterprise-grade capabilities.<br/>Modern cloud-native architecture.</h2>
          <p>Intelligent automation meets cloud-native architecture.</p>
        </div>

        <div className="adv-grid">
          {items.map((it, i) => (
            <div key={i} className="adv-card">
              <div className="adv-content">
                <span className="adv-tag mono" style={{ color: it.accent, background: `${it.accent}1a`, borderColor: `${it.accent}33` }}>{it.tag}</span>
                <h3 style={{ marginTop: 14, marginBottom: 12, fontSize: 24 }}>{it.t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--slate-600)', marginBottom: 20 }}>{it.d}</p>
                <ul className="adv-bullets">
                  {it.bullets.map((b, j) => (
                    <li key={j}>
                      <span className="adv-dot" style={{ background: it.accent }}></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="adv-visual" style={{ background: `linear-gradient(135deg, ${it.accent}10, ${it.accent}03)` }}>
                <AdvVisual kind={it.visual} accent={it.accent}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvVisual({ kind, accent }) {
  if (kind === 'ai') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        <defs>
          <linearGradient id="ai-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent}/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
        </defs>
        {/* neural network */}
        {[60, 110, 160].map((y, i) => (
          <circle key={`l1-${i}`} cx="60" cy={y} r="8" fill="url(#ai-g)" opacity="0.8">
            <animate attributeName="r" values="6;9;6" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {[40, 80, 130, 170].map((y, i) => (
          <circle key={`l2-${i}`} cx="150" cy={y} r="8" fill="url(#ai-g)" opacity="0.6">
            <animate attributeName="r" values="6;10;6" dur={`${2.5+i*0.2}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {[80, 130].map((y, i) => (
          <circle key={`l3-${i}`} cx="240" cy={y} r="10" fill="url(#ai-g)">
            <animate attributeName="r" values="8;12;8" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {[60,110,160].flatMap(y1 => [40,80,130,170].map(y2 => (
          <line key={`${y1}-${y2}`} x1="60" y1={y1} x2="150" y2={y2} stroke={accent} strokeOpacity="0.18" strokeWidth="1"/>
        )))}
        {[40,80,130,170].flatMap(y1 => [80,130].map(y2 => (
          <line key={`b-${y1}-${y2}`} x1="150" y1={y1} x2="240" y2={y2} stroke={accent} strokeOpacity="0.18" strokeWidth="1"/>
        )))}
      </svg>
    );
  }
  if (kind === 'k8s') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        {/* k8s cluster grid */}
        {Array.from({length: 4}).map((_, row) =>
          Array.from({length: 6}).map((_, col) => {
            const x = 30 + col*42;
            const y = 30 + row*42;
            const delay = (row*6 + col)*0.1;
            return (
              <g key={`${row}-${col}`}>
                <rect x={x} y={y} width="32" height="32" rx="6" fill="white" stroke={accent} strokeWidth="1.5" strokeOpacity="0.5">
                  <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" begin={`${delay}s`}/>
                </rect>
                <circle cx={x+16} cy={y+16} r="4" fill={accent}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" begin={`${delay}s`}/>
                </circle>
              </g>
            );
          })
        )}
      </svg>
    );
  }
  if (kind === 'cert') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        <g transform="translate(150, 100)">
          <circle r="70" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="4 6" opacity="0.4">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
          </circle>
          <circle r="55" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="2 4" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="16s" repeatCount="indefinite"/>
          </circle>
          <rect x="-30" y="-36" width="60" height="72" rx="6" fill="white" stroke={accent} strokeWidth="2"/>
          <path d="M -10 -10 l 8 8 l 16 -16" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="-22" y="14" width="44" height="2" fill={accent} opacity="0.4"/>
          <rect x="-22" y="20" width="30" height="2" fill={accent} opacity="0.4"/>
        </g>
      </svg>
    );
  }
  if (kind === 'gslb') {
    return (
      <svg viewBox="0 0 300 200" width="100%" height="100%">
        <defs>
          <radialGradient id="globe-g">
            <stop offset="0%" stopColor={accent} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <g transform="translate(150, 100)">
          <circle r="70" fill="url(#globe-g)"/>
          <circle r="60" fill="none" stroke={accent} strokeWidth="1.5"/>
          <ellipse rx="60" ry="22" fill="none" stroke={accent} strokeWidth="1" opacity="0.6"/>
          <ellipse rx="60" ry="44" fill="none" stroke={accent} strokeWidth="1" opacity="0.4"/>
          <line x1="-60" y1="0" x2="60" y2="0" stroke={accent} strokeWidth="1" opacity="0.6"/>
          <line x1="0" y1="-60" x2="0" y2="60" stroke={accent} strokeWidth="1" opacity="0.4"/>
          {[
            [-32, -16], [22, -28], [40, 14], [-20, 30], [10, 38]
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={accent}>
                <animate attributeName="r" values="3;6;3" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
              </circle>
              <circle cx={x} cy={y} r="8" fill="none" stroke={accent} strokeWidth="1" opacity="0.4">
                <animate attributeName="r" values="4;14;4" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
              </circle>
            </g>
          ))}
        </g>
      </svg>
    );
  }
  return null;
}

function ComprehensiveFeatures() {
  const items = [
    { t: 'Web Application Firewall (WAF)', d: 'Integrated OWASP Core Rule Set (CRS) with customizable directive sets, per-authority rules, and comprehensive filtering by severity, phase, and paranoia level.', list: ['OWASP CRS integration','Custom directive management','Domain-specific rules','Rule browser & import'] },
    { t: 'Scenario Workflows', d: 'Pre-built scenario workflows with step-by-step wizards for common Envoy configurations. Execute, test, and deploy configurations efficiently.', list: ['Scenario wizard','Dynamic forms','Configuration review','Quick deployment'] },
    { t: 'Service Discovery', d: 'Discover and manage clusters automatically. Track service status, monitor cluster health, and manage registration with real-time updates.', list: ['Cluster discovery','Status monitoring','Usage statistics','Last seen tracking'] },
    { t: 'Audit Logging', d: 'Complete audit trail for all user actions, configuration changes, and system operations. Filter by date, action type, user, and resource.', list: ['Action tracking','User accountability','Resource changes','Compliance reporting'] },
    { t: 'Advanced Metrics', d: 'ECharts-powered visualization with downstream, upstream, and listener metrics. Custom time ranges, metric grouping, and auto-refresh.', list: ['Real-time charts','Custom time ranges','Metric filtering','Export capabilities'] },
    { t: 'Log Management', d: 'Real-time service logs with JSON parsing, HTTP access log detection, and intelligent log analysis for pattern detection and troubleshooting.', list: ['JSON log parsing','Log level filtering','Search functionality','Pattern detection'] },
    { t: 'Registry Management', d: 'Centralized configuration registry with version tracking, resource metadata, and schema information for all Envoy configurations.', list: ['Version tracking','Resource metadata','Schema validation','Registry browser'] },
    { t: 'Version Upgrade', d: 'Effortlessly upgrade Envoy configurations from one version to another. Migrate resources from version X to version Y with automated compatibility checks.', list: ['Cross-version migration','Compatibility validation','Resource transformation','Zero-downtime upgrades'] },
    { t: 'Log Export', d: 'Export logs to external systems via Syslog and Elastic Logstash. Centralize log management and integrate with your existing observability stack.', list: ['Syslog integration','Elastic Logstash support','Centralized logging','Flexible export formats'] },
    { t: 'Metrics Visualization', d: 'View detailed metrics both on the platform and through Grafana integration. Monitor performance, traffic patterns, and system health in real-time.', list: ['Built-in dashboards','Grafana integration','Custom metrics','Real-time updates'] },
    { t: 'LDAP Authentication', d: 'Integrate with your existing LDAP/Active Directory infrastructure. Centralized user authentication and authorization for enterprise deployments.', list: ['LDAP integration','Active Directory support','Centralized auth','Enterprise SSO'] },
    { t: 'ACME Certificates', d: 'Automated certificate lifecycle management with ACME protocol support for Let\'s Encrypt and Google Trust Services with DNS-01 challenge.', list: ['Let\'s Encrypt integration','Google Trust Services','DNS provider management','Automatic renewal'] },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>COMPREHENSIVE FEATURES</span>
          <h2>Security, monitoring,<br/>operational excellence.</h2>
          <p>Advanced capabilities for security, monitoring, and operational excellence — all integrated into a unified platform.</p>
        </div>

        <div className="comp-grid">
          {items.map((it, i) => (
            <div key={i} className="comp-card card">
              <div className="comp-num mono">{String(i+1).padStart(2,'0')}</div>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
              <ul>
                {it.list.map((l, j) => (
                  <li key={j}><span>•</span> {l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Compliance() {
  const items = [
    'SOC 2 Ready Architecture',
    'GDPR Compliant Data Handling',
    'Complete Audit Trail',
    'Data Encryption at Rest',
    'Role-Based Access Control',
    'Multi-Factor Authentication Ready',
  ];
  return (
    <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div className="dot-bg" style={{ opacity: 0.15 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="section-head">
          <span className="eyebrow" style={{ background: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.3)', color: '#93c5fd' }}>
            <span className="dot"></span>COMPLIANCE & STANDARDS
          </span>
          <h2 style={{ color: 'white' }}>Built with a security-<br/>first mindset.</h2>
          <p style={{ color: '#94a3b8' }}>Built with security-first mindset for enterprise-grade deployments.</p>
        </div>

        <div className="comply-grid">
          {items.map((it, i) => (
            <div key={i} className="comply-cell">
              <span className="comply-tick">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span>{it}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<FeaturesApp/>);
