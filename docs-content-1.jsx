import { Icon, Code, T, Callout } from './docs-shared.jsx';

// ============== INTRODUCTION + QUICKSTART + CONCEPTS ==============
function SectionIntro() {
  return (
    <>
      <section id="introduction">
        <div className="docs-hero">
          <div className="docs-hero-eyebrow">
            <span style={{width:6,height:6,borderRadius:'50%',background:'#2563eb'}}></span>
            DOCUMENTATION · v1.4.2
          </div>
          <h1>Elchi Documentation</h1>
          <p>Everything you need to install, configure, and operate the Elchi proxy management platform — from quick local trials to production-grade Kubernetes deployments.</p>
        </div>

        <p>Elchi is a comprehensive proxy management platform that provides a UI-driven workflow for managing clients at enterprise scale. It bundles three coordinated processes — Registry, Controller, and Control-Plane — alongside a modern React UI, MongoDB for state, and VictoriaMetrics for time-series.</p>

        <div className="docs-cards">
          <a href="#quickstart" className="docs-card">
            <span className="docs-card-icon"><Icon.Rocket/></span>
            <div className="docs-card-title">Quick Start <Icon.Arrow className="docs-card-title-arrow"/></div>
            <p className="docs-card-desc">Get Elchi running on a Kubernetes cluster in under five minutes with Helm.</p>
          </a>
          <a href="#platform-install" className="docs-card">
            <span className="docs-card-icon violet"><Icon.Cube/></span>
            <div className="docs-card-title">Install the Platform <Icon.Arrow className="docs-card-title-arrow"/></div>
            <p className="docs-card-desc">Full Helm install — controller, control-plane, registry, MongoDB & VictoriaMetrics.</p>
          </a>
          <a href="#client-overview" className="docs-card">
            <span className="docs-card-icon cyan"><Icon.Terminal/></span>
            <div className="docs-card-title">Set up the Client <Icon.Arrow className="docs-card-title-arrow"/></div>
            <p className="docs-card-desc">Install the Go agent on Linux hosts to register Envoy proxies with your control plane.</p>
          </a>
          <a href="#discovery-overview" className="docs-card">
            <span className="docs-card-icon emerald"><Icon.Network/></span>
            <div className="docs-card-title">Endpoint Discovery <Icon.Arrow className="docs-card-title-arrow"/></div>
            <p className="docs-card-desc">Auto-discover Kubernetes services and sync endpoints to your Envoy clusters.</p>
          </a>
        </div>
      </section>

      <section id="quickstart">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Rocket/></span>Quick Start</h2>
        <p>Spin up the full Elchi stack on any Kubernetes cluster with three commands. The default chart bundles MongoDB and VictoriaMetrics so you get a working install with zero external dependencies.</p>

        <h3 className="docs-h3">1. Add the Helm repository</h3>
        <Code lang="shell">{T.c('# Add Elchi Helm repository\n')}{T.cmd('helm repo add')} elchi {T.s('https://charts.elchi.io')}{'\n'}{T.cmd('helm repo update')}</Code>

        <h3 className="docs-h3">2. Install the stack</h3>
        <Code lang="shell">{T.cmd('helm install')} my-elchi elchi/elchi-stack \\{'\n'}  {T.f('--set-string')} global.mainAddress={T.s('"your-domain.com"')} \\{'\n'}  {T.f('--namespace')} elchi-stack \\{'\n'}  {T.f('--create-namespace')}</Code>

        <h3 className="docs-h3">3. Verify the install</h3>
        <Code lang="shell">{T.c('# Check pod status\n')}{T.cmd('kubectl get pods')} {T.f('-n')} elchi-stack{'\n'}{'\n'}{T.c('# Inspect service endpoints\n')}{T.cmd('kubectl get svc')}  {T.f('-n')} elchi-stack</Code>

        <h3 className="docs-h3">4. Sign in</h3>
        <p>Open the platform at <code>https://your-domain.com</code> and sign in with the default credentials:</p>
        <Code lang="shell">{T.c('# Default credentials\n')}{T.k('Username:')} {T.s('admin')}{'\n'}{T.k('Password:')} {T.s('admin')}</Code>
        <Callout kind="danger" title="Change the default password immediately">
          <p>The default <code>admin / admin</code> credentials exist only to bootstrap the first session. Rotate them right after signing in, and change the JWT signing secret before exposing Elchi to any untrusted network.</p>
        </Callout>
      </section>

      <section id="concepts">
        <h2 className="docs-h2"><span className="docs-h2-icon cyan"><Icon.Layers/></span>Core Concepts</h2>
        <p>Elchi splits responsibilities across three cooperating processes. Understanding what each one owns makes the rest of the docs much easier to follow.</p>

        <div className="comp-grid">
          <div className="comp-tile">
            <div className="comp-tile-head">Registry <span className="comp-tile-port">:9090</span></div>
            <div className="comp-tile-desc">Service discovery hub. Tracks controllers and clients, routes requests to the right control-plane version.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Controller <span className="comp-tile-port">REST</span></div>
            <div className="comp-tile-desc">Management plane. Owns xDS resources, users, RBAC, MongoDB persistence, and AI analysis.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Control-Plane <span className="comp-tile-port">:18000</span></div>
            <div className="comp-tile-desc">gRPC xDS server. Streams ADS / VHDS configurations to Envoy with snapshot caching.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Client Agent <span className="comp-tile-port">Go</span></div>
            <div className="comp-tile-desc">Lightweight host agent. Registers Envoy proxies, exports logs to Syslog/ELK, manages BGP.</div>
          </div>
        </div>

        <p>Day-to-day, the configuration loop looks like this:</p>
        <ol>
          <li>You make a change in the UI — say, add a new <code>Cluster</code>.</li>
          <li>The controller validates the change against Envoy's protobuf schemas, persists it to MongoDB, and pushes a snapshot to the control-plane.</li>
          <li>The control-plane's gRPC stream notifies every connected Envoy, which applies the new config without a restart.</li>
        </ol>
      </section>
    </>
  );
}

export { SectionIntro };
