import { Icon, Code, T, Callout } from './docs-shared.jsx';

// ============== CONFIGURING ENVOY + TRAFFIC & CERTIFICATES ==============
function SectionConfig() {
  return (
    <>
      <section id="config-model">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Cube/></span>Resources &amp; the Config Model</h2>
        <p>Everything Elchi pushes to Envoy is modeled as a <strong>resource</strong>. The UI generates a typed form for every resource directly from Envoy's protobuf definitions, so new Envoy fields appear in the editor without any manual UI work.</p>

        <h3 className="docs-h3">Resource types</h3>
        <div className="comp-grid">
          <div className="comp-tile">
            <div className="comp-tile-head">Listeners <span className="comp-tile-port">LDS</span></div>
            <div className="comp-tile-desc">Entry points. Bind addresses, filter chains, TLS termination, and the HTTP/TCP filter pipeline.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Clusters <span className="comp-tile-port">CDS</span></div>
            <div className="comp-tile-desc">Upstream pools. Load-balancing policy, health checks, circuit breakers, transport sockets.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Routes <span className="comp-tile-port">RDS</span></div>
            <div className="comp-tile-desc">Route configurations and virtual hosts. Match rules, rewrites, retries, timeouts.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Endpoints <span className="comp-tile-port">EDS</span></div>
            <div className="comp-tile-desc">Concrete upstream addresses. Managed manually or synced live by Endpoint Discovery.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Secrets &amp; TLS <span className="comp-tile-port">SDS</span></div>
            <div className="comp-tile-desc">Certificates, keys, and validation contexts. Issued automatically through ACME or uploaded.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Bootstrap <span className="comp-tile-port">Boot</span></div>
            <div className="comp-tile-desc">The static config each Envoy starts with — node ID, admin, and the xDS connection back to Elchi.</div>
          </div>
        </div>

        <h3 className="docs-h3">Filters &amp; Extensions</h3>
        <p>HTTP, network, listener, and UDP filters are managed under <strong>Filters</strong>, and reusable custom configurations live under <strong>Extensions</strong>. Both are versioned per Envoy release and validated against the matching proto schema.</p>

        <h3 className="docs-h3">Two-step validation</h3>
        <p>Every change is checked twice before it can ship:</p>
        <ol>
          <li><strong>Frontend</strong> — TypeScript types generated from the proto catch shape and type errors as you edit.</li>
          <li><strong>Backend</strong> — <code>protoc-gen-validate</code> rules run on the controller before the resource is persisted.</li>
        </ol>

        <h3 className="docs-h3">Save &amp; Publish</h3>
        <p>Edits are kept as drafts so you can stage several changes safely, then publish them together. The controller validates the bundle, persists it to MongoDB, and pushes a new snapshot to the control-plane — Envoy applies it without a restart.</p>
        <Callout kind="info" title="Inspect what Envoy actually received">
          <p>Open <strong>Snapshot dump</strong> for any listener to see the exact xDS payload streamed to connected proxies — the fastest way to confirm a publish landed.</p>
        </Callout>

        <h3 className="docs-h3">Understanding relationships</h3>
        <ul>
          <li><strong>Dependency graph</strong> — a Cytoscape view of how a resource links to clusters, routes, secrets, and filters. Use it to spot orphaned or broken references.</li>
          <li><strong>Route map</strong> — a topology view of how requests flow through a listener's routes to upstreams.</li>
          <li><strong>Global search</strong> — find any hostname, resource, or value across the project from one search box.</li>
          <li><strong>Templates &amp; Snippets</strong> — save reusable resource templates and config snippets to standardize new setups.</li>
        </ul>
      </section>

      <section id="scenarios">
        <h2 className="docs-h2"><span className="docs-h2-icon cyan"><Icon.Layers/></span>Scenario Workflows</h2>
        <p>Scenarios are guided, wizard-based recipes for common Envoy setups — API gateways, load balancers, and service-mesh data planes — so you can produce a complete, valid configuration in a few steps instead of hand-building each resource.</p>
        <ul>
          <li><strong>Dynamic forms</strong> — each step renders the fields relevant to your choices; the wizard wires the resources together for you.</li>
          <li><strong>Validate &amp; execute</strong> — preview and validate the full configuration before it is created.</li>
          <li><strong>Import / export</strong> — share scenarios across projects or environments as portable definitions.</li>
        </ul>
        <p>Manage scenarios under <strong>Scenarios</strong> in the UI — create, edit, execute, or re-run an existing one.</p>
      </section>

      <section id="version-upgrade">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Layers/></span>Versions &amp; Upgrades</h2>
        <p>Elchi manages multiple Envoy versions (1.27 through 1.38+) from a single interface. The registry routes each proxy to a control-plane that speaks its version, so mixed fleets are first-class.</p>

        <h3 className="docs-h3">Version-based routing</h3>
        <p>When a proxy connects, the registry matches it to the right control-plane instance based on the Envoy version it reports. You can run several versions side by side without conflicts.</p>

        <h3 className="docs-h3">Upgrading resources</h3>
        <p>The upgrade subsystem migrates configurations from one Envoy version to another. Trigger it from <strong>Settings → Upgrade</strong>; the controller:</p>
        <ol>
          <li>Runs a per-listener dependency analysis to find everything that must move together.</li>
          <li>Recreates the dependencies, then the listeners, in topological order.</li>
          <li>Regenerates snapshots and bootstrap configs for the target version.</li>
        </ol>
        <p>The migration runs as a tracked background job, so you can watch progress and retry if a step fails — see <a href="#jobs">Background Jobs</a>.</p>
        <Callout kind="warn" title="Confirm the target version is deployed">
          <p>The target Envoy version must be one of your deployed <code>global.versions</code> (Helm) or <code>--backend-version</code> variants (bare-metal) before you upgrade resources into it.</p>
        </Callout>
      </section>
    </>
  );
}

function SectionTraffic() {
  return (
    <>
      <section id="gslb">
        <h2 className="docs-h2"><span className="docs-h2-icon amber"><Icon.Network/></span>Global Server Load Balancing</h2>
        <p>GSLB gives you DNS-based traffic management with active health probing and automatic failover. Elchi probes each endpoint, decides which IPs are healthy, and serves them through a CoreDNS plugin so clients are always steered to a live target.</p>

        <h3 className="docs-h3">Records &amp; IPs</h3>
        <p>A GSLB <strong>record</strong> maps a hostname to a set of IPs. For each IP you can:</p>
        <ul>
          <li>Assign one or more <strong>regions</strong> so resolvers in a region prefer nearby IPs.</li>
          <li>Pin a manual health state (force up/down) for maintenance or cutovers.</li>
          <li>Review per-IP status history.</li>
        </ul>
        <p>Manage records under <strong>GSLB</strong> (<code>/gslb</code>), open a record to edit IPs and regions, and watch live status on <strong>GSLB → Statistics</strong>.</p>

        <h3 className="docs-h3">Health model</h3>
        <p>Elchi runs HTTP, HTTPS, and TCP probes with connection pooling and a quad-state model that resists flapping:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>State</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td className="param">PASSING</td><td>Healthy and served in DNS answers.</td></tr>
              <tr><td className="param">WARNING</td><td>Degraded — failing checks but not yet evicted.</td></tr>
              <tr><td className="param">CRITICAL</td><td>Unhealthy and removed from DNS answers.</td></tr>
              <tr><td className="param">RECOVERY</td><td>Coming back — passing again but held until stable.</td></tr>
            </tbody>
          </table>
        </div>
        <p>An adaptive circuit breaker backs off probes for repeatedly failing targets (10s → 20s → 30s → 50s → 80s → 120s), keeping load proportional to the problem.</p>

        <h3 className="docs-h3">Nodes &amp; CoreDNS</h3>
        <p>GSLB nodes (the CoreDNS instances serving your zone) register with Elchi and appear in the node list. From a node's drawer you can check its health, inspect the records it is serving, and push a notify so it pulls the latest snapshot. CoreDNS consumes the zone over a secured snapshot/change feed.</p>
        <Callout kind="info" title="Deploying GSLB nodes">
          <p>The CoreDNS plugin and GSLB zone are provisioned by the bare-metal installer — see the <a href="#baremetal-install">GSLB / CoreDNS flags</a>. This page covers managing records and health from the UI; set the zone defaults under <strong>Settings → GSLB</strong>.</p>
        </Callout>
      </section>

      <section id="acme">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Shield/></span>Certificates (ACME)</h2>
        <p>Elchi automates the full TLS certificate lifecycle with the ACME protocol — issuance, DNS-01 validation, storage as an Envoy secret, and renewal — so listeners always have a valid certificate.</p>

        <h3 className="docs-h3">CA providers</h3>
        <p>Issue from Let's Encrypt, ZeroSSL / Google Trust Services, or a custom ACME CA. Providers that require <strong>External Account Binding (EAB)</strong> are supported; Elchi validates the EAB credentials before the first order. Pick a staging or production environment per certificate.</p>

        <h3 className="docs-h3">DNS-01 workflow</h3>
        <p>Validation uses the DNS-01 challenge, which works for wildcard and internal names. Store provider API tokens once as <strong>DNS credentials</strong> (encrypted at rest), then the controller:</p>
        <ol>
          <li>Creates the order and the required <code>_acme-challenge</code> TXT records.</li>
          <li>Waits for DNS propagation, then asks the CA to validate.</li>
          <li>Downloads the certificate and stores it as a secret for your listeners.</li>
        </ol>
        <p>Manage everything under <strong>Certificates</strong> (<code>/acme</code>): create a certificate, attach a DNS credential, run or retry verification, and check DNS propagation. You can also <strong>duplicate</strong> a certificate's config or <strong>change its DNS provider</strong>.</p>

        <h3 className="docs-h3">Auto-renewal</h3>
        <p>A renewal scheduler checks expiry and renews automatically ahead of time; you can also trigger a renewal manually. A distributed lock keeps renewals safe across multiple controllers.</p>
        <Callout kind="info" title="Required egress">
          <p>ACME needs outbound access to the CA directory (e.g. Let's Encrypt) and your DNS provider's API. See <a href="#network">Network &amp; Access</a> for the egress allow-list.</p>
        </Callout>
      </section>

      <section id="waf">
        <h2 className="docs-h2"><span className="docs-h2-icon rose"><Icon.Shield/></span>Web Application Firewall</h2>
        <p>Elchi ships an integrated WAF built on Coraza with the OWASP Core Rule Set (CRS). Attach a WAF configuration to your traffic to block common attacks — injection, XSS, scanners — with rules you can tune.</p>

        <h3 className="docs-h3">Building a configuration</h3>
        <ul>
          <li><strong>CRS library</strong> — browse the bundled rule sets, filter by version, severity, phase, and paranoia level, and add rules in bulk.</li>
          <li><strong>Directive editor</strong> — write and order SecRules and directives, with per-authority (per-host) rule scoping.</li>
          <li><strong>Lint &amp; preview</strong> — inline linting flags syntax issues, and a preview pane shows the rendered <code>.conf</code> before you save.</li>
          <li><strong>Presets</strong> — start from a demo or starter preset instead of an empty config.</li>
        </ul>

        <h3 className="docs-h3">Versioning &amp; restore</h3>
        <p>Every saved configuration is versioned. Browse the history, diff any two versions, and restore a previous one in a click — useful when a rule change causes false positives. Manage configs under <strong>WAF</strong> (<code>/waf</code>).</p>
        <Callout kind="info" title="How rules reach Envoy">
          <p>Saving a WAF config triggers a propagation job that pushes the rules to the affected proxies. Track it under <a href="#jobs">Background Jobs</a>.</p>
        </Callout>
      </section>
    </>
  );
}

export { SectionConfig, SectionTraffic };
