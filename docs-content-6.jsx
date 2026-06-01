import { Icon, Code, T, Callout } from './docs-shared.jsx';

// ============== API DISCOVERY & OBSERVABILITY + ADMINISTRATION ==============
function SectionInventory() {
  return (
    <>
      <section id="api-discovery">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Network/></span>API Discovery</h2>
        <p>API Discovery turns the traffic flowing through your proxies into a living inventory of every API your platform exposes. Elchi watches access logs, normalizes paths into operations, and continuously scores each endpoint for risk and exposure — so you find shadow APIs, missing auth, and PII leaks before an attacker does.</p>

        <Callout kind="info" title="How it gets the data">
          <p>API Discovery is powered by the <strong>elchi-collector</strong> and a <strong>ClickHouse</strong> analytics pipeline that ingest Envoy access logs (ALS). The bare-metal installer provisions both automatically — see <a href="#baremetal-overview">Bare-Metal</a>. Make sure the analytics pipeline is running before you expect inventory data.</p>
        </Callout>

        <h3 className="docs-h3">From traffic to operations</h3>
        <ul>
          <li><strong>Listeners → endpoints</strong> — start at <code>/api-discovery</code> for a per-listener overview, then drill into the endpoints seen on each one.</li>
          <li><strong>Operations</strong> — endpoints are grouped by normalized path (e.g. <code>/users/&#123;id&#125;</code>) so high-cardinality IDs don't explode the list.</li>
          <li><strong>Confirmed vs attack surface</strong> — real, served endpoints are <em>confirmed</em>; scanner and probe noise is separated into the <strong>attack-surface</strong> view so it never pollutes your inventory.</li>
          <li><strong>Endpoint detail</strong> — every endpoint has a deep-linkable detail page with traffic, latency, status distribution, auth schemes, and risk flags.</li>
        </ul>

        <h3 className="docs-h3">Risk &amp; security posture</h3>
        <ul>
          <li><strong>Two-axis risk scoring</strong> — each endpoint is plotted on a <strong>threat</strong> axis (how dangerous it looks) and an <strong>exposure</strong> axis (how reachable it is), so you can triage what is both risky and exposed first.</li>
          <li><strong>Security score</strong> — an overall posture grade (A–F) for an API surface, with the signals that moved it.</li>
          <li><strong>Risk flags &amp; remediation</strong> — flags such as unauthenticated, PII-bearing, or inconsistent-auth endpoints come with a remediation guide (<code>/api-discovery/risks</code>).</li>
          <li><strong>Auth coverage</strong> — find endpoints with no auth or inconsistent auth schemes (JWT, mTLS, API key are auto-detected).</li>
        </ul>

        <h3 className="docs-h3">Specialized views</h3>
        <div className="comp-grid">
          <div className="comp-tile">
            <div className="comp-tile-head">PII Inventory</div>
            <div className="comp-tile-desc">Endpoints carrying personal data, broken down by PII category.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Consumers</div>
            <div className="comp-tile-desc">Top API consumers by identity hash, plus an anonymous bucket — per-consumer endpoints, methods, status, geo, and risk.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Drift Detection</div>
            <div className="comp-tile-desc">Field-level changes against a baseline snapshot — what appeared, vanished, or changed.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Bot &amp; Scanner</div>
            <div className="comp-tile-desc">Heatmap of automated and scanner traffic hitting your surface.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Zombies</div>
            <div className="comp-tile-desc">Old or once-popular endpoints that are now stale — candidates for removal.</div>
          </div>
          <div className="comp-tile">
            <div className="comp-tile-head">Transport &amp; Errors</div>
            <div className="comp-tile-desc">TLS/protocol posture and 4xx/5xx hotspots with time series.</div>
          </div>
        </div>

        <h3 className="docs-h3">Snapshots &amp; export</h3>
        <ul>
          <li><strong>Baseline snapshots</strong> — Elchi captures a point-in-time snapshot of your API surface on a daily cadence (and admins can capture one on demand). Drift is measured against these baselines.</li>
          <li><strong>OpenAPI export</strong> — export the discovered surface as an OpenAPI 3.0.3 document (YAML or JSON) to feed gateways, test tools, or docs.</li>
          <li><strong>Stale cleanup</strong> — admins can bulk-remove endpoints not seen for N days to keep the inventory honest.</li>
        </ul>
      </section>

      <section id="api-discovery-config">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Settings/></span>Collector Configuration</h2>
        <p>Tune how the collector observes traffic under <strong>Settings → API Discovery</strong>. These policies control sampling fidelity and how client identity and geography are derived:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Setting</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td className="param">Request size limits</td><td>Cap how much of each request the collector inspects.</td></tr>
              <tr><td className="param">Normalization patterns</td><td>Regex patterns that fold dynamic path segments into stable operations.</td></tr>
              <tr><td className="param">Trusted proxies</td><td>CIDR ranges used to resolve the real client IP behind upstream load balancers.</td></tr>
              <tr><td className="param">IP thresholds</td><td>Per-IP rate policies that drive bot/scanner classification.</td></tr>
            </tbody>
          </table>
        </div>
        <Callout kind="info" title="Enrich the inventory">
          <p>Upload <a href="#security-data">GeoIP and Threat Intelligence</a> data so consumer, geo, and risk views are populated with location and reputation context.</p>
        </Callout>
      </section>

      <section id="observability">
        <h2 className="docs-h2"><span className="docs-h2-icon cyan"><Icon.Database/></span>Metrics &amp; Logs</h2>
        <h3 className="docs-h3">Metrics</h3>
        <p>Built-in dashboards (powered by ECharts) chart downstream, upstream, and listener metrics with custom time ranges, grouping, and auto-refresh. For deeper analysis, Elchi integrates Grafana so you can use full Grafana dashboards against the same VictoriaMetrics data. Open <strong>Observability → Metrics</strong>.</p>

        <h3 className="docs-h3">Logs</h3>
        <p>The log viewer (<strong>Observability → Logs</strong>) streams service logs with JSON parsing, HTTP access-log detection, level filtering, and search. To centralize logs, the client agent can export to <strong>Syslog</strong> or <strong>Elastic/Logstash</strong>.</p>

        <h3 className="docs-h3">Endpoint discovery</h3>
        <p>Under <strong>Discovery</strong>, connected Kubernetes clusters report their services so Envoy clusters always see up-to-date upstreams. See <a href="#discovery-overview">Elchi Discovery</a> to install the agent.</p>
      </section>

      <section id="audit">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Book/></span>Audit &amp; Syslog Forwarding</h2>
        <p>Every user action and configuration change is recorded in an immutable audit trail. Browse it under <strong>Audit</strong>, filter by date, action, user, or resource, and open any event for the full before/after detail.</p>

        <h3 className="docs-h3">Forwarding to a SIEM</h3>
        <p>Forward audit events to an external collector under <strong>Settings → Syslog</strong>. Elchi speaks <strong>RFC5424</strong> over UDP, TCP, or TLS, and includes a connection test so you can validate the destination before enabling it.</p>
      </section>

      <section id="jobs">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Settings/></span>Background Jobs</h2>
        <p>Long-running work runs asynchronously so the UI stays responsive. Track everything under <strong>Jobs</strong>, where each job carries a human-friendly ID (e.g. <code>EC-1</code>), a phase, and a live log.</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Job type</th><th>Triggered by</th></tr></thead>
            <tbody>
              <tr><td className="param">SNAPSHOT_UPDATE</td><td>Publishing resource changes to the control-plane.</td></tr>
              <tr><td className="param">WAF_PROPAGATION</td><td>Pushing a saved WAF configuration to proxies.</td></tr>
              <tr><td className="param">ACME_VERIFICATION</td><td>Certificate issuance / DNS-01 validation.</td></tr>
              <tr><td className="param">RESOURCE_UPGRADE</td><td>Migrating resources to a new Envoy version.</td></tr>
            </tbody>
          </table>
        </div>
        <p>Jobs move through <code>ANALYZING → PENDING → CLAIMED → RUNNING → COMPLETED/FAILED</code>. A heartbeat detects stuck jobs (stale for &gt; 5&nbsp;min), and you can <strong>retry</strong> a failed job. Stats and the worker pool status are shown alongside the list.</p>
      </section>
    </>
  );
}

function SectionAdmin() {
  return (
    <>
      <section id="registry-ha">
        <h2 className="docs-h2"><span className="docs-h2-icon cyan"><Icon.Network/></span>Registry &amp; High Availability</h2>
        <p>The registry is the discovery hub that tracks controllers, control-planes, and clients. The <strong>Registry</strong> page gives you live visibility into your topology:</p>
        <ul>
          <li><strong>Instances</strong> — every active controller and control-plane, with its zone, version, node count, and uptime.</li>
          <li><strong>Leader election</strong> — see which instance currently holds leadership for scheduled work (snapshots, renewals).</li>
          <li><strong>Cleanup</strong> — remove a stale controller or control-plane that no longer reports in.</li>
        </ul>
        <p>Multiple controllers share one MongoDB, elect a leader for singleton tasks, and standby nodes hydrate from registry snapshots — so the management plane keeps running through instance failures.</p>
      </section>

      <section id="auth-access">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Shield/></span>Authentication &amp; Access</h2>
        <h3 className="docs-h3">Projects &amp; RBAC</h3>
        <p>Resources are isolated by <strong>project</strong> (team, environment, or customer). Access is governed by a four-tier role model:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Role</th><th>Can do</th></tr></thead>
            <tbody>
              <tr><td className="param">Owner</td><td>Everything, including project and member management.</td></tr>
              <tr><td className="param">Admin</td><td>Manage resources and most settings within a project.</td></tr>
              <tr><td className="param">Editor</td><td>Create and edit resources; no admin settings.</td></tr>
              <tr><td className="param">Viewer</td><td>Read-only access.</td></tr>
            </tbody>
          </table>
        </div>
        <p>Manage users, groups, and projects under <strong>Settings</strong>.</p>

        <h3 className="docs-h3">Tokens</h3>
        <p>Issue API tokens for automation and <strong>discovery tokens</strong> for the client and endpoint-discovery agents under <strong>Settings → Tokens</strong>. Rotating a token immediately invalidates the old one.</p>

        <h3 className="docs-h3">LDAP / Active Directory</h3>
        <p>Connect an existing directory under <strong>Settings → LDAP</strong> for centralized authentication. The page includes both a connection test and an authentication test so you can validate binding and search before rollout.</p>

        <h3 className="docs-h3">Two-factor authentication</h3>
        <p>Users can enable TOTP-based 2FA from their profile, complete with QR enrollment and backup codes. Admins can require it and reset 2FA for a locked-out user.</p>
      </section>

      <section id="security-data">
        <h2 className="docs-h2"><span className="docs-h2-icon rose"><Icon.Database/></span>Threat Intelligence &amp; GeoIP</h2>
        <p>These data sources enrich API Discovery and the collector with reputation and location context.</p>
        <ul>
          <li><strong>Threat Intelligence</strong> — upload and manage threat feeds under <strong>Settings → Threat Intel</strong>; matching traffic is flagged in the inventory and risk views.</li>
          <li><strong>GeoIP</strong> — upload or download MMDB databases under <strong>Settings → GeoIP</strong> to resolve client IPs to country, ASN, and geo for the consumer and geo dashboards.</li>
        </ul>
        <Callout kind="info" title="Why it matters">
          <p>Without GeoIP and threat data, the <a href="#api-discovery">geo, consumer, and risk</a> views still work but show less context. Loading these databases makes them far more actionable.</p>
        </Callout>
      </section>

      <section id="ai-analysis">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Rocket/></span>AI-Powered Analysis</h2>
        <p>Bring your own <strong>OpenRouter</strong> key and pick any supported model to get AI assistance with your configuration. Add the key under <strong>Settings → OpenRouter</strong>, then use the <strong>AI Analyzer</strong>:</p>
        <ul>
          <li><strong>Analyze configuration</strong> — review a resource and surface misconfigurations, risks, and optimization tips.</li>
          <li><strong>Analyze logs</strong> — correlate logs with the config to explain errors and suggest a root cause.</li>
          <li><strong>Models &amp; usage</strong> — test model connectivity and track token usage over time.</li>
        </ul>
        <Callout kind="info" title="Your key, your model">
          <p>Elchi never bundles an AI provider. Analysis runs against the OpenRouter key and model you choose, and requires outbound access to OpenRouter — see <a href="#network">Network &amp; Access</a>.</p>
        </Callout>
      </section>

      <section id="licensing">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Check/></span>Licensing</h2>
        <p>License status is shown as a badge in the header and managed under <strong>Settings → Licensing</strong>. From there you can:</p>
        <ul>
          <li><strong>View status</strong> — current entitlement and validity (available to any signed-in user).</li>
          <li><strong>Activate</strong> a license key (Admin/Owner).</li>
          <li><strong>Force a check</strong> to re-validate immediately (Admin/Owner).</li>
          <li><strong>Remove</strong> the active license (Admin/Owner).</li>
        </ul>
        <Callout kind="info" title="Required egress">
          <p>License activation and periodic checks need outbound access to the Elchi license API — see the egress allow-list in <a href="#network">Network &amp; Access</a>.</p>
        </Callout>
      </section>
    </>
  );
}

export { SectionInventory, SectionAdmin };
