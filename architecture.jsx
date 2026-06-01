import React from 'react';
import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';

function ArchApp() {
  return (
    <>
      <Nav active="architecture"/>
      <ArchHero/>
      <ThreeProcess/>
      <LayeredArch/>
      <RequestFlow/>
      <Integrations/>
      <ArchCTA/>
      <Footer/>
    </>
  );
}

function ArchHero() {
  return (
    <section className="section" style={{ paddingTop: 80, paddingBottom: 60, position: 'relative', overflow: 'hidden' }}>
      <div className="aurora" style={{ width: 700, height: 500, top: -150, right: '10%', background: 'radial-gradient(closest-side, #c7d2fe, transparent)', opacity: .55 }}></div>
      <div className="aurora" style={{ width: 500, height: 400, top: 80, left: '5%', background: 'radial-gradient(closest-side, #bae6fd, transparent)', opacity: .4 }}></div>
      <div className="grid-bg"></div>
      <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 920, margin: '0 auto' }}>
        <span className="eyebrow"><span className="dot"></span>ARCHITECTURE</span>
        <h1 style={{ marginTop: 24, marginBottom: 24 }}>
          Three processes,<br/>
          <span className="grad-text">built to scale.</span>
        </h1>
        <p style={{ fontSize: 19, color: 'var(--slate-600)', maxWidth: 720, margin: '0 auto' }}>
          A modern technology stack with distributed processing, intelligent routing,
          and enterprise-grade components — designed from day one for high availability.
        </p>
      </div>
    </section>
  );
}

function ThreeProcess() {
  const procs = [
    { name: 'Registry', port: ':9090', accent: '#06b6d4', desc: 'Service discovery and routing hub',
      items: ['Controller registration & address sharing', 'Client location tracking', 'Version-based control-plane routing', 'External processing integration', 'In-memory data with auto-cleanup'] },
    { name: 'Controller', port: 'REST', accent: '#8b5cf6', desc: 'REST API and management layer',
      items: ['Client management & command dispatch', 'xDS resource management (CDS, LDS, RDS, EDS)', 'User & authorization (JWT + RBAC)', 'MongoDB integration', 'AI-powered config analysis', 'K8s Discovery system'] },
    { name: 'Control-Plane', port: ':18000', accent: '#3b82f6', desc: 'gRPC-based xDS control plane',
      items: ['Envoy ADS (Aggregated Discovery Service)', 'VHDS (Virtual Host Discovery Service)', 'Snapshot management & cache system', 'Bridge services (snapshot, resource, poke)', 'Auto-registration with registry', 'Health monitoring & keepalive'] },
  ];

  return (
    <section className="section" style={{ background: 'var(--bg-tint)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>3-PROCESS DISTRIBUTED ARCHITECTURE</span>
          <h2>Specialized microservices,<br/>working in harmony.</h2>
          <p>Enterprise-grade scalability through three specialized processes — each with a clear role and lifecycle.</p>
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
          {[
            ['High Availability', 'Multiple control-plane instances with automatic failover and health monitoring.'],
            ['Scalability', 'Load balancing across controllers and control-planes for enterprise workloads.'],
            ['Version Routing', 'Intelligent routing to appropriate control-plane versions based on client requirements.'],
          ].map(([t, d], i) => (
            <div key={i} className="ha-cell-light">
              <div className="mono" style={{ fontSize: 11, color: 'var(--blue-600)', marginBottom: 10 }}>{String(i+1).padStart(2,'0')}</div>
              <h4 style={{ marginBottom: 8, fontSize: 16 }}>{t}</h4>
              <p style={{ fontSize: 13.5, color: 'var(--slate-600)' }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LayeredArch() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>LAYERED ARCHITECTURE</span>
          <h2>From frontend to proxy.<br/>Each layer, intentional.</h2>
          <p>Modern technology stack with distributed processing and enterprise-grade components.</p>
        </div>

        <div className="layered-stack">
          {/* Frontend Layer */}
          <Layer
            title="Frontend Layer"
            color="#3b82f6"
            items={[
              { name: 'React', desc: 'Modern UI Framework' },
              { name: 'TypeScript', desc: 'Type Safety' },
              { name: 'Cytoscape', desc: 'Graph Visualization' },
            ]}
          />

          {/* Backend Layer */}
          <Layer
            title="Backend Layer — 3-Process Architecture"
            color="#8b5cf6"
            wide
            items={[
              { name: 'Controller', desc: 'REST API · client mgmt, xDS, auth', port: 'Custom' },
              { name: 'Control-Plane', desc: 'gRPC xDS · ADS, VHDS, snapshot cache', port: ':18000' },
              { name: 'Registry', desc: 'Discovery · service routing, versioning', port: ':9090' },
            ]}
          />

          {/* Data layer */}
          <Layer
            title="Data & Storage Layer"
            color="#06b6d4"
            items={[
              { name: 'MongoDB', desc: 'Config Storage' },
              { name: 'VictoriaMetrics', desc: 'Time-Series DB' },
              { name: 'OpenRouter', desc: 'AI Model Integration' },
            ]}
          />

          {/* Proxy layer */}
          <Layer
            title="Proxy Layer"
            color="#10b981"
            items={[
              { name: 'Envoy Proxy', desc: 'Multi-Version Support' },
              { name: 'WAF', desc: 'OWASP CRS' },
              { name: 'Health Check', desc: 'Auto-Recovery' },
            ]}
          />
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
  const steps = [
    { label: 'Client', sub: 'Agent on host', accent: '#64748b' },
    { label: 'Registry', sub: 'Register & discover', accent: '#06b6d4', arrow: 'register' },
    { label: 'Controller', sub: 'Route to version', accent: '#8b5cf6', arrow: 'route' },
    { label: 'Control-Plane', sub: 'Serve xDS config', accent: '#3b82f6', arrow: 'xDS' },
    { label: 'Envoy', sub: 'Apply config', accent: '#10b981', arrow: 'config' },
  ];

  return (
    <section className="section" style={{ background: 'var(--slate-900)', color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div className="dot-bg" style={{ opacity: 0.18 }}></div>
      <div className="aurora" style={{ width: 700, height: 500, top: 100, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(closest-side, #1d4ed8, transparent)', opacity: 0.35 }}></div>

      <div className="container" style={{ position: 'relative' }}>
        <div className="section-head">
          <span className="eyebrow" style={{ background: 'rgba(59,130,246,.15)', borderColor: 'rgba(59,130,246,.3)', color: '#93c5fd' }}>
            <span className="dot"></span>REQUEST FLOW
          </span>
          <h2 style={{ color: 'white' }}>From client connection<br/>to live config.</h2>
          <p style={{ color: '#94a3b8' }}>How a request travels through the platform — from initial registration to applied configuration.</p>
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
          {[
            ['Registration', 'Clients register with Registry for service discovery on startup.'],
            ['Routing', 'Registry routes clients to the appropriate Controller version.'],
            ['xDS Protocol', 'Control-Plane serves Envoy configurations via gRPC streams.'],
            ['Configuration', 'Envoy receives and applies dynamic configurations live.'],
          ].map(([t, d], i) => (
            <div key={i} className="flow-explain-cell">
              <div className="mono" style={{ fontSize: 11, color: '#60a5fa', marginBottom: 8 }}>{String(i+1).padStart(2,'0')}</div>
              <h4 style={{ color: 'white', fontSize: 15, marginBottom: 6 }}>{t}</h4>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.55 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  const ints = ['Kubernetes', 'Docker', 'gRPC', 'Prometheus', 'MongoDB', 'Grafana', 'Envoy', 'OpenRouter', 'LDAP', 'Syslog', 'ELK Stack', 'Let\'s Encrypt'];
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>NATIVE INTEGRATIONS</span>
          <h2>Plays well with your stack.</h2>
          <p>First-class integrations with the cloud-native ecosystem.</p>
        </div>
        <div className="int-grid">
          {ints.map((t, i) => (
            <div key={i} className="int-cell card">
              <div className="int-mark mono">{t.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>Native integration</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchCTA() {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-card">
          <div className="grid-bg" style={{ opacity: .4 }}></div>
          <div style={{ position: 'relative', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <span className="eyebrow"><span className="dot"></span>READY TO DEPLOY</span>
            <h2 style={{ marginTop: 16, marginBottom: 16 }}>
              Bring this architecture<br/>to your cluster.
            </h2>
            <p style={{ fontSize: 18, color: 'var(--slate-600)', maxWidth: 560, margin: '0 auto' }}>
              Try the full stack with our demo, or deploy to your Kubernetes cluster
              using our Helm chart.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'center' }}>
              <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-blue">Try Demo</a>
              <a href="https://artifacthub.io/packages/helm/elchi-stack/elchi-stack" target="_blank" rel="noopener" className="btn btn-ghost">Helm Chart</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ArchApp/>);
