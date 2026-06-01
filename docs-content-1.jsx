import { Icon, Code, T, Callout } from './docs-shared.jsx';

// ============== INTRODUCTION + QUICKSTART + CONCEPTS ==============
function SectionIntro() {
  return (
    <>
      <section id="introduction">
        <div className="docs-hero">
          <div className="docs-hero-eyebrow">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }}></span>
            DOCUMENTATION
          </div>
          <h1>Elchi Documentation</h1>
          <p>Everything you need to install, configure, and operate the Elchi proxy management platform — from quick local trials to production-grade Kubernetes deployments.</p>
        </div>

        <p>Elchi is a comprehensive proxy management platform that provides a UI-driven workflow for managing clients at enterprise scale. It bundles three coordinated processes — Registry, Controller, and Control-Plane — alongside a modern React UI, MongoDB for state, and VictoriaMetrics for time-series.</p>

        <div className="docs-cards">
          <a href="#quickstart" className="docs-card">
            <span className="docs-card-icon"><Icon.Rocket /></span>
            <div className="docs-card-title">Quick Start <Icon.Arrow className="docs-card-title-arrow" /></div>
            <p className="docs-card-desc">Get Elchi running on a Kubernetes cluster in under five minutes with Helm.</p>
          </a>
          <a href="#platform-install" className="docs-card">
            <span className="docs-card-icon violet"><Icon.Cube /></span>
            <div className="docs-card-title">Install the Platform <Icon.Arrow className="docs-card-title-arrow" /></div>
            <p className="docs-card-desc">Full Helm install — controller, control-plane, registry, MongoDB & VictoriaMetrics.</p>
          </a>
          <a href="#client-overview" className="docs-card">
            <span className="docs-card-icon cyan"><Icon.Terminal /></span>
            <div className="docs-card-title">Set up the Client <Icon.Arrow className="docs-card-title-arrow" /></div>
            <p className="docs-card-desc">Install the Go agent on Linux hosts to register Envoy proxies with your control plane.</p>
          </a>
          <a href="#discovery-overview" className="docs-card">
            <span className="docs-card-icon emerald"><Icon.Network /></span>
            <div className="docs-card-title">Endpoint Discovery <Icon.Arrow className="docs-card-title-arrow" /></div>
            <p className="docs-card-desc">Auto-discover Kubernetes services and sync endpoints to your Envoy clusters.</p>
          </a>
        </div>
      </section>

      <section id="quickstart">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Rocket /></span>Quick Start</h2>
        <p>Spin up the full Elchi stack on any Kubernetes cluster with three commands. The default chart bundles MongoDB and VictoriaMetrics so you get a working install with zero external dependencies.</p>

        <h3 className="docs-h3">1. Add the Helm repository</h3>
        <Code lang="shell">{T.c('# Add Elchi Helm repository\n')}{T.cmd('helm repo add')} elchi {T.s('https://charts.elchi.io')}{'\n'}{T.cmd('helm repo update')}</Code>

        <h3 className="docs-h3">2. Install the stack</h3>
        <Code lang="shell">{T.cmd('helm install')} my-elchi elchi/elchi-stack {'\\\n'}  {T.f('--set-string')} global.mainAddress={T.s('"your-domain.com"')} {'\\\n'}  {T.f('--namespace')} elchi-stack {'\\\n'}  {T.f('--create-namespace')}</Code>

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
        <h2 className="docs-h2"><span className="docs-h2-icon cyan"><Icon.Layers /></span>Core Concepts</h2>
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

      <section id="network">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Network /></span>Network &amp; External Access</h2>
        <p>This page is your firewall checklist. It lists every host and port Elchi needs to reach (egress), every port it exposes (ingress), and the side-channels it opens only when a feature is configured.</p>
        <p>Use it to size egress allow-lists, plan NAT/proxy rules, or harden a network policy. Everything below is derived from the running code paths in <code>elchi-backend</code> — not aspirational.</p>

        <h3 className="docs-h3">Outbound — always required</h3>
        <p>The platform will not boot or stay healthy without these.</p>

        <div className="comp-grid">
          <div className="comp-tile">
            <div className="comp-tile-head">MongoDB <span className="comp-tile-port">27017 / SRV</span></div>
            <div className="comp-tile-desc">Primary state store. <code>mongodb+srv://&lt;cluster&gt;</code> for Atlas (TLS, port 27017 + 27015–27017 SRV resolution) or your self-hosted host:port. Required by every controller pod.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">archive.elchi.io <span className="comp-tile-port">HTTPS 443</span></div>
            <div className="comp-tile-desc">Envoy version metadata index used to surface available versions in the UI and validate upgrade paths. One short JSON GET per controller startup / version page load.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">license-api.cloudnativeworks.com <span className="comp-tile-port">HTTPS 443</span></div>
            <div className="comp-tile-desc">CNW License Server. Every controller calls it on startup to validate / refresh the license fingerprint and again on a periodic check loop. A single pod cluster-wide actually hits the server (TryClaimCheck dedups across replicas), but the host must be reachable from any controller that may be elected. Without it the platform falls back to the free tier; explicit network blocks on this host will prevent paid-tier features from staying active.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">charts.elchi.io <span className="comp-tile-port">HTTPS 443</span></div>
            <div className="comp-tile-desc">Helm chart repository. Only the operator workstation running <code>helm install/upgrade</code> needs this — not the running pods.</div>
          </div>
        </div>

        <h3 className="docs-h3">Outbound — feature-gated</h3>
        <p>Open these only when the matching feature is enabled. None of them is needed for a vanilla install.</p>

        <div className="comp-grid">
          <div className="comp-tile">
            <div className="comp-tile-head">Let&apos;s Encrypt ACME <span className="comp-tile-port">HTTPS 443</span></div>
            <div className="comp-tile-desc"><code>acme-v02.api.letsencrypt.org</code> (production) and <code>acme-staging-v02.api.letsencrypt.org</code> (staging). Reached when an ACME account is configured. Google Trust Services CA endpoints are also supported when <code>ca_provider: google</code> is selected.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">DNS provider APIs <span className="comp-tile-port">HTTPS 443</span></div>
            <div className="comp-tile-desc">Used for ACME DNS-01 challenges. Per provider: <code>api.cloudflare.com</code>, <code>api.godaddy.com</code>, <code>api.digitalocean.com</code>, <code>route53.amazonaws.com</code>, <code>lightsail.{'{region}'}.amazonaws.com</code>, Google Cloud DNS APIs. Each project can attach its own credential set; only the providers actually used need to be reachable.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">OpenRouter API <span className="comp-tile-port">HTTPS 443</span></div>
            <div className="comp-tile-desc"><code>openrouter.ai/api/v1</code> for the AI Analyzer (Claude / GPT models). Only contacted when an OpenRouter token is set per project.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">OpenStack APIs <span className="comp-tile-port">HTTPS 443 / 5000</span></div>
            <div className="comp-tile-desc">Cloud provider integration (Keystone / Nova / Neutron). Only contacted when a cloud is registered under <code>Settings → Clouds</code>.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">LDAP / LDAPS <span className="comp-tile-port">389 / 636</span></div>
            <div className="comp-tile-desc">Optional external auth. Only contacted when LDAP is enabled in <code>Settings → LDAP Config</code>.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Kubernetes API <span className="comp-tile-port">HTTPS 6443</span></div>
            <div className="comp-tile-desc">For the Discovery agent: registers clusters and syncs endpoints back to the controller. The agent runs in-cluster, so this is normally an internal call rather than true egress.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">GSLB probe targets <span className="comp-tile-port">HTTP / HTTPS / TCP</span></div>
            <div className="comp-tile-desc">When a GSLB record is created, the health checker reaches out to every IP/FQDN you list. Ports are whatever you configure (commonly 80 / 443 / 22 / custom). This is the largest egress surface — scope it by destination, not by port.</div>
          </div>
        </div>

        <h3 className="docs-h3">Inbound — what Elchi exposes</h3>
        <p>Every port below should be allowed from the matching client population only — never the open internet by default.</p>

        <div className="comp-grid">
          <div className="comp-tile">
            <div className="comp-tile-head">Controller HTTP / REST <span className="comp-tile-port">:8099</span></div>
            <div className="comp-tile-desc">Browser UI, REST API, and OpenAPI. Reached by operators (admins) and the Discovery agent. Put this behind your edge load balancer or VPN.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Controller gRPC <span className="comp-tile-port">:50051</span></div>
            <div className="comp-tile-desc">Command stream that the Elchi Client (Go agent on every Envoy host) connects to for receiving operations. Allow only from your Envoy fleet subnets.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Control-Plane gRPC (xDS) <span className="comp-tile-port">:18000</span></div>
            <div className="comp-tile-desc">ADS / VHDS streams that Envoy proxies subscribe to for live configuration. Allow only from Envoy data-plane subnets.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">GSLB nodes <span className="comp-tile-port">:53 + :8053</span></div>
            <div className="comp-tile-desc">DNS authoritative answers on UDP/TCP 53 to your DNS resolvers; metadata + management on TCP 8053 (X-Elchi-Secret header). Run only when GSLB is enabled.</div>
          </div>
        </div>

        <h3 className="docs-h3">Internal — process-to-process</h3>
        <p>Inside an Elchi cluster (Helm or bare-metal), these flows must work between the pods/hosts:</p>

        <Code lang="text">{T.c('# Within the Elchi cluster\n')}{T.k('Controller')}    → Registry      :9090   {T.c('(register, heartbeat)')}
{T.k('Control-Plane')} → Registry      :9090   {T.c('(register, snapshot notify)')}
{T.k('Controller')}    → Control-Plane :18000  {T.c('(via Registry routing)')}
{T.k('Controller')}    → MongoDB       :27017  {T.c('(state)')}
{T.k('Control-Plane')} → MongoDB       :27017  {T.c('(read snapshot data)')}
{T.k('Controller')}    → GSLB nodes    :8053   {T.c('(notify-on-change)')}</Code>

        <h3 className="docs-h3">Quick reference — egress allow-list</h3>
        <p>If your network team wants a single block to drop into a firewall policy, this is the minimum for a feature-rich install. Trim lines for features you do not use.</p>

        <Code lang="text">{T.c('# Always required\n')}{'<your-mongodb-host>:27017'}                          {T.c('# state')}
archive.elchi.io:443                                {T.c('# version metadata')}
license-api.cloudnativeworks.com:443                {T.c('# CNW License Server (validate + periodic check)')}

{T.c('# ACME (Let\'s Encrypt) — only if you issue certificates from Elchi\n')}acme-v02.api.letsencrypt.org:443
acme-staging-v02.api.letsencrypt.org:443

{T.c('# DNS providers — open only the ones you actually attach\n')}api.cloudflare.com:443
api.godaddy.com:443
api.digitalocean.com:443
route53.amazonaws.com:443

{T.c('# AI Analyzer — only when OpenRouter token is set\n')}openrouter.ai:443

{T.c('# Operator workstation only (helm install/upgrade)\n')}charts.elchi.io:443</Code>

        <Callout kind="note" title="ACME uses DNS-01 — no inbound 80 or 443 needed for cert issuance">
          <p>Elchi&apos;s ACME integration runs DNS-01 challenges through the configured DNS provider API. You do <strong>not</strong> need to expose port 80 or 443 to the public internet for Let&apos;s Encrypt to issue or renew certificates. This makes Elchi safe to run entirely behind a VPN / private network.</p>
        </Callout>

        <Callout kind="warning" title="GSLB probe traffic is the widest egress surface">
          <p>Each GSLB record produces continuous outbound probes (HTTP, HTTPS, or TCP) against every IP you list, on whatever port you configured. If your egress policy is allow-listed, you must add every probe target. Plan ahead — there is no way to consolidate this list because the targets are user-defined.</p>
        </Callout>
      </section>
    </>
  );
}

export { SectionIntro };
