import { Icon, Code, T, Callout } from './docs-shared.jsx';

// ============== BARE-METAL / OS INSTALL SECTION ==============
function SectionBareMetal() {
  return (
    <>
      <section id="baremetal-overview">
        <h2 className="docs-h2"><span className="docs-h2-icon amber"><Icon.Terminal/></span>Bare-Metal Install (no Docker, no Kubernetes)</h2>
        <p>The standalone installer brings the entire Elchi stack up as <strong>systemd services</strong> on 1, 2, or 3+ Linux VMs — no Kubernetes, no Helm, no Docker required. The script runs once on the first node ("M1", the local machine) and SSHes into the rest to provision them. Source lives at <a href="https://github.com/CloudNativeWorks/elchi-archive/tree/main/deploy/standalone">elchi-archive/deploy/standalone/</a>; the installer itself is unversioned and always runs from the <code>main</code> branch. Component versions (elchi-backend, UI, envoy, coredns) are pinned per-flag.</p>

        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Component</th><th>Where it runs</th><th>Default port</th></tr></thead>
            <tbody>
              <tr><td><strong>Envoy</strong> (front-door)</td><td>Every node</td><td>0.0.0.0:443 (TLS), 127.0.0.1:8080, 127.0.0.1:9901 (admin)</td></tr>
              <tr><td><strong>nginx</strong> (UI)</td><td>Every node</td><td>127.0.0.1:8081</td></tr>
              <tr><td><strong>elchi-registry</strong></td><td>Every node (HA peer set, gRPC HC pins to leader)</td><td>:1870 gRPC, :9091 metrics</td></tr>
              <tr><td><strong>elchi-controller</strong></td><td>Every node (singleton)</td><td>:1960 gRPC, :1980 REST</td></tr>
              <tr><td><strong>elchi-control-plane</strong></td><td>Every node (one per backend variant)</td><td>:1990 (per variant)</td></tr>
              <tr><td><strong>OTel Collector</strong></td><td>Every node (local sink for envoy <code>/opentelemetry</code>)</td><td>:4317 gRPC, :4318 HTTP, :13133 health, :8888 prom</td></tr>
              <tr><td><strong>MongoDB</strong></td><td>1–2 VM: M1 standalone · 3+ VM: M1+M2+M3 RS · 4+: no extra members</td><td>:27017</td></tr>
              <tr><td><strong>VictoriaMetrics</strong></td><td>M1 only (or external via <code>--vm=external</code>)</td><td>:8428</td></tr>
              <tr><td><strong>Grafana</strong></td><td>M1 only (proxied at <code>/grafana/</code>)</td><td>127.0.0.1:3000</td></tr>
              <tr><td><strong>CoreDNS GSLB</strong></td><td>Every node when <code>--gslb-zone</code> is supplied (default-on, graceful skip otherwise)</td><td>:53 tcp+udp, :8053 webhook</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="baremetal-prereq">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Check/></span>Prerequisites</h2>
        <ul>
          <li><strong>OS:</strong> Ubuntu 22.04 / 24.04 · Debian 11 / 12 · RHEL / Rocky / Alma / Oracle 9</li>
          <li><strong>Architecture:</strong> linux/amd64 (arm64 lands when upstream backend ships arm64 binaries)</li>
          <li><strong>Privileges:</strong> root (script auto-bootstraps every missing tool — curl, openssl, jq, tar, gzip, awk, sed, grep, envsubst, hostname, sshpass, ssh-keygen)</li>
          <li><strong>Memory:</strong> 4 GB recommended (soft-warn below; pass <code>ELCHI_REQUIRE_HEALTHY=1</code> to make it fatal)</li>
          <li><strong>Disk:</strong> 5 GB free under <code>/var/lib</code> (hard-fail below)</li>
          <li><strong>Network:</strong> outbound HTTPS to <code>github.com</code>, <code>raw.githubusercontent.com</code>, distro mirrors, Mongo + Grafana repos</li>
          <li><strong>Time sync:</strong> systemd-timesyncd / chronyd / ntpd active (mongo replica-set election sensitivity)</li>
          <li><strong>SSH between nodes:</strong> key auth (recommended) or password — script can mint &amp; distribute a cluster key via <code>--ssh-bootstrap</code></li>
        </ul>

        <Callout kind="info" title="One-step mode">
          <p>Pipe the bootstrap script straight into bash. It downloads the installer payload, exec's <code>install.sh</code>, and any required CLI tool that's missing on the host gets installed automatically.</p>
        </Callout>
      </section>

      <section id="baremetal-quickstart">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Rocket/></span>Quick Start</h2>

        <h3 className="docs-h3">Single VM (all-in-one)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {'\\\n'}      {T.f('--nodes')}={T.s('"$(hostname -I | awk \'{print $1}\')"')} {'\\\n'}      {T.f('--main-address')}={T.s('elchi.example.com')} {'\\\n'}      {T.f('--ui-version')}={T.s('v1.1.5')} {'\\\n'}      {T.f('--backend-version')}={T.s('elchi-v1.2.0-v0.14.0-envoy1.36.2')} {'\\\n'}      {T.f('--envoy-version')}={T.s('v1.36.2')}</Code>

        <h3 className="docs-h3">3-VM cluster, multi-version backend, key-based SSH</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {'\\\n'}      {T.f('--nodes')}={T.s('10.10.10.2,10.10.10.3,10.10.10.4')} {'\\\n'}      {T.f('--ssh-user')}={T.s('ubuntu')} {T.f('--ssh-key')}={T.s('/root/.ssh/cluster_key')} {'\\\n'}      {T.f('--main-address')}={T.s('elchi.example.com')} {'\\\n'}      {T.f('--ui-version')}={T.s('v1.1.5')} {'\\\n'}      {T.f('--backend-version')}={T.s('elchi-v1.2.0-v0.14.0-envoy1.35.3,elchi-v1.2.0-v0.14.0-envoy1.36.2,elchi-v1.2.0-v0.14.0-envoy1.38.0')} {'\\\n'}      {T.f('--envoy-version')}={T.s('v1.37.0')}</Code>

        <Callout kind="info" title="Variants & replicas">
          <p>Each <code>--backend-version</code> entry is ONE variant. The number of variants determines how many backend processes per node: 3 variants = 1 controller + 3 control-planes per node (one control-plane per Envoy version). Same variant cannot appear twice — duplicates collide on the registry name <code>&lt;hostname&gt;-controlplane-&lt;X.Y.Z&gt;</code> and the installer rejects them. Capacity scales by adding nodes, not by replicating a variant on the same node.</p>
        </Callout>

        <h3 className="docs-h3">3-VM cluster, no SSH key set up yet (interactive bootstrap)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {'\\\n'}      {T.f('--nodes')}={T.s('10.10.10.2,10.10.10.3,10.10.10.4')} {'\\\n'}      {T.f('--ssh-bootstrap')} {'\\\n'}      {T.f('--main-address')}={T.s('elchi.example.com')} {'\\\n'}      {T.f('--backend-version')}={T.s('elchi-v1.2.0-v0.14.0-envoy1.36.2')}</Code>

        <p><code>--ssh-bootstrap</code> mints a fresh ed25519 key on M1, then prompts the operator <em>once per remote node</em> for that node's password. Each password is used only for that node's <code>ssh-copy-id</code> and is discarded immediately after. M1 itself is local — no password prompt for it. Subsequent SSH (orchestration, upgrades, uninstall) all use the generated key.</p>

        <Callout kind="info" title="Dedicated admin user (default)">
          <p>By default the bootstrap also creates a key-only, passwordless-sudo admin user (<code>elchi-cluster-admin</code>) on every node — including M1 — and locks all subsequent orchestration to that identity. After the first install, the operator can lock root's password, disable root SSH login, or even delete the root account; <code>upgrade</code> and <code>uninstall</code> keep working because they run as <code>elchi-cluster-admin</code> with sudo. Override the name with <code>--admin-user=&lt;name&gt;</code> or opt out with <code>--no-admin-user</code>.</p>
        </Callout>

        <Callout kind="warn" title="Node order matters">
          <p>The first IP in <code>--nodes</code> is "M1" — orchestrator + singleton storage (mongo, VictoriaMetrics, Grafana). It MUST be the local machine you're running the curl on. Re-installing or upgrading? Keep the same order — swapping IPs reassigns M1 and orphans data.</p>
        </Callout>
      </section>

      <section id="baremetal-install">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Settings/></span><code>install.sh</code> — full flag reference</h2>
        <p>Every variant tag in <code>--backend-version</code> is a full release-asset name from <a href="https://github.com/CloudNativeWorks/elchi-backend/releases">elchi-backend releases</a>: <code>elchi-vX.Y.Z-vA.B.C-envoyP.Q.R</code>. Multiple variants are comma-separated and each gets its own systemd template unit + <code>/etc/elchi/&lt;variant&gt;/</code> config dir + <code>/var/lib/elchi/&lt;variant&gt;/</code> HOME dir.</p>

        <h3 className="docs-h3">Topology &amp; SSH</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--nodes=&lt;csv&gt;</td><td>Comma-separated host list, M1 first. M1 is the local machine; M2..Mn are reached over SSH.</td><td className="default req">required</td></tr>
              <tr><td className="param">--ssh-user=&lt;user&gt;</td><td>SSH login on M2..Mn.</td><td className="default">root</td></tr>
              <tr><td className="param">--ssh-port=&lt;n&gt;</td><td>SSH port.</td><td className="default">22</td></tr>
              <tr><td className="param">--ssh-key=&lt;path&gt;</td><td>Private key for non-interactive auth (recommended for production).</td><td className="default">—</td></tr>
              <tr><td className="param">--ssh-password=&lt;pwd&gt;</td><td>Password fallback (uses sshpass). Avoid for production.</td><td className="default">—</td></tr>
              <tr><td className="param">--ssh-bootstrap</td><td>Mint an ed25519 key on M1 and copy it to every remote node. Prompts INTERACTIVELY for each remote node's password (M1 skipped). Subsequent SSH uses the generated key; passwords are discarded.</td><td className="default">—</td></tr>
              <tr><td className="param">--admin-user=&lt;name&gt;</td><td><strong>Default-ON.</strong> Dedicated admin user provisioned on every node during bootstrap with passwordless sudo + cluster key authorized. Orchestrator's SSH user flips to this identity (persisted to <code>orchestrator.env</code>). After this, root's password / SSH login / account itself can change without breaking <code>upgrade</code> or <code>uninstall</code>. Idempotent on rerun.</td><td className="default">elchi-cluster-admin</td></tr>
              <tr><td className="param">--no-admin-user</td><td>Opt OUT — orchestration stays on the original login user (root). Use only when your environment forbids provisioning users.</td><td className="default">—</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">Versioning</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--backend-version=&lt;csv&gt;</td><td>One or more variant tags (release-asset basenames). Each variant runs side-by-side. Alias: <code>--backend-variants=</code>.</td><td className="default">elchi-v1.2.0-v0.14.0-envoy1.36.2</td></tr>
              <tr><td className="param">--ui-version=&lt;vX.Y.Z&gt;</td><td>UI bundle version (<code>elchi-dist-vX.Y.Z.tar.gz</code> from elchi releases).</td><td className="default">v1.1.3</td></tr>
              <tr><td className="param">--envoy-version=&lt;vX.Y.Z&gt;</td><td>Front-door Envoy proxy binary version.</td><td className="default">v1.37.0</td></tr>
              <tr><td className="param">--coredns-version=&lt;vX.Y.Z&gt;</td><td>Custom CoreDNS-with-elchi-plugin version (used only when GSLB is enabled).</td><td className="default">v0.1.3</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">Backend instance count per node</h3>
        <p>Replica count is <strong>fixed by design</strong> — there is no flag to tune it:</p>
        <ul>
          <li><strong>Controller</strong> — exactly ONE per node. Version-agnostic singleton; uses <code>versions[0]</code>'s binary. Registers as bare <code>&lt;hostname&gt;</code>.</li>
          <li><strong>Control-plane</strong> — exactly ONE per (node, variant). Total per node = number of variants. Each registers as <code>&lt;hostname&gt;-controlplane-&lt;envoy-X.Y.Z&gt;</code>.</li>
        </ul>
        <p>Capacity for a different Envoy version → add another variant tag. Capacity for the same Envoy version → add another node. Running the same variant twice on the same host would collide on the registry name and is rejected by topology compute.</p>

        <h3 className="docs-h3">Network &amp; TLS</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--main-address=&lt;dns|ip&gt;</td><td>Public address. Cert SAN. Use a DNS name with A records pointing at every node IP for round-robin, or a single VIP.</td><td className="default req">required</td></tr>
              <tr><td className="param">--port=&lt;n&gt;</td><td>Public HTTPS port; Envoy terminates TLS here.</td><td className="default">443</td></tr>
              <tr><td className="param">--hostnames=&lt;csv&gt;</td><td>Extra cert SANs (e.g. each node's hostname).</td><td className="default">—</td></tr>
              <tr><td className="param">--tls=self-signed|provided</td><td>TLS mode. Default mints a 10-year ECDSA-P256 certificate via openssl.</td><td className="default">self-signed</td></tr>
              <tr><td className="param">--cert=&lt;path&gt;</td><td>PEM cert (with <code>--tls=provided</code>).</td><td className="default">—</td></tr>
              <tr><td className="param">--key=&lt;path&gt;</td><td>PEM private key (with <code>--tls=provided</code>).</td><td className="default">—</td></tr>
              <tr><td className="param">--ca=&lt;path&gt;</td><td>Optional CA bundle for client trust verification.</td><td className="default">—</td></tr>
              <tr><td className="param">--timezone=&lt;tz&gt;</td><td>TZ env var written into every elchi-* unit.</td><td className="default">UTC</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">MongoDB</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--mongo=local|external</td><td>Use bundled mongod (1 VM standalone / 2 VM standalone on M1 / 3+ VM RS-3) or operator-supplied URI.</td><td className="default">local</td></tr>
              <tr><td className="param">--mongo-uri=&lt;uri&gt;</td><td>Full <code>mongodb[+srv]://...</code> for <code>--mongo=external</code>; granular flags below win on conflicts.</td><td className="default">—</td></tr>
              <tr><td className="param">--mongo-version=auto|6.0|7.0|8.0</td><td>Mongo major. <code>auto</code> picks the highest version supported on the detected distro.</td><td className="default">auto</td></tr>
              <tr><td className="param">--mongo-hosts=&lt;csv&gt;</td><td>External: <code>host1:port1,host2:port2,...</code></td><td className="default">—</td></tr>
              <tr><td className="param">--mongo-username</td><td>External: app user.</td><td className="default">—</td></tr>
              <tr><td className="param">--mongo-password</td><td>External: app password.</td><td className="default">—</td></tr>
              <tr><td className="param">--mongo-database</td><td>App DB name.</td><td className="default">elchi</td></tr>
              <tr><td className="param">--mongo-scheme</td><td><code>mongodb</code> or <code>mongodb+srv</code>.</td><td className="default">mongodb</td></tr>
              <tr><td className="param">--mongo-port=&lt;n&gt;</td><td>Per-host port (used when granular hosts list omits explicit port).</td><td className="default">27017</td></tr>
              <tr><td className="param">--mongo-replicaset</td><td>External RS name. Local mode uses <code>elchi-rs</code>.</td><td className="default">—</td></tr>
              <tr><td className="param">--mongo-tls=true|false</td><td>TLS to external mongo.</td><td className="default">false</td></tr>
              <tr><td className="param">--mongo-auth-source</td><td>Auth source DB.</td><td className="default">admin</td></tr>
              <tr><td className="param">--mongo-auth-mechanism</td><td>e.g. <code>SCRAM-SHA-256</code>. Empty = backend default.</td><td className="default">—</td></tr>
              <tr><td className="param">--mongo-timeout-ms</td><td>Server-selection timeout (ms).</td><td className="default">9000</td></tr>
              <tr><td className="param">--mongo-data-dir=&lt;path&gt;</td><td>Local mode data dir.</td><td className="default">/var/lib/mongodb</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">VictoriaMetrics</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--vm=local|external</td><td>Bundle a VM instance on M1 or use external endpoint.</td><td className="default">local</td></tr>
              <tr><td className="param">--vm-endpoint=&lt;url|host:port&gt;</td><td>Required when <code>--vm=external</code>.</td><td className="default">—</td></tr>
              <tr><td className="param">--vm-data-dir=&lt;path&gt;</td><td>Local TSDB path.</td><td className="default">/var/lib/elchi/victoriametrics</td></tr>
              <tr><td className="param">--vm-retention=&lt;dur&gt;</td><td>Storage retention.</td><td className="default">15d</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">Grafana</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--grafana-user</td><td>Admin login.</td><td className="default">admin</td></tr>
              <tr><td className="param">--grafana-password</td><td>Admin password.</td><td className="default">random (printed in summary)</td></tr>
              <tr><td className="param">--grafana-allow-plugin=&lt;csv&gt;</td><td>Allow-list of unsigned plugin IDs. Pass once per plugin or comma-separated.</td><td className="default">—</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">GSLB / CoreDNS plugin</h3>
        <p><strong>Default ON.</strong> When <code>--gslb-zone</code> is supplied, CoreDNS GSLB plugin installs on every node (port 53 TCP+UDP, webhook on 8053). Without zone, it gracefully skips with a hint. Pass <code>--no-gslb</code> to silence the hint.</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--gslb</td><td>No-op (default already on); kept for explicitness.</td><td className="default">on</td></tr>
              <tr><td className="param">--no-gslb</td><td>Opt out of the GSLB CoreDNS install.</td><td className="default">—</td></tr>
              <tr><td className="param">--gslb-zone=&lt;domain&gt;</td><td>Authoritative zone (e.g. <code>gslb.example.com</code>). Only flag actually required to install GSLB.</td><td className="default">— (skip)</td></tr>
              <tr><td className="param">--gslb-admin-email=&lt;email&gt;</td><td>SOA RNAME (with <code>@</code> → <code>.</code>). Defaults to <code>hostmaster@&lt;zone&gt;</code> per RFC 2142.</td><td className="default">hostmaster@&lt;zone&gt;</td></tr>
              <tr><td className="param">--gslb-nameservers=&lt;csv&gt;</td><td><code>ns1:ip,ns2:ip,...</code> NS records + glue.</td><td className="default">—</td></tr>
              <tr><td className="param">--gslb-regions=&lt;csv&gt;</td><td>Region tags for the regions directive.</td><td className="default">—</td></tr>
              <tr><td className="param">--gslb-tls-skip-verify</td><td>Skip TLS verify when plugin polls backend <code>/dns/snapshot</code>.</td><td className="default">—</td></tr>
              <tr><td className="param">--gslb-ttl=&lt;sec&gt;</td><td>Default record TTL.</td><td className="default">300</td></tr>
              <tr><td className="param">--gslb-sync-interval=&lt;dur&gt;</td><td>Backend snapshot poll interval.</td><td className="default">1m</td></tr>
              <tr><td className="param">--gslb-timeout=&lt;dur&gt;</td><td>Snapshot HTTP timeout.</td><td className="default">4s</td></tr>
              <tr><td className="param">--gslb-static-records=&lt;csv&gt;</td><td>Inline static A/AAAA/CNAME records.</td><td className="default">—</td></tr>
              <tr><td className="param">--gslb-secret=&lt;value&gt;</td><td>Override the auto-generated <code>X-Elchi-Secret</code> shared secret.</td><td className="default">auto</td></tr>
              <tr><td className="param">--gslb-forwarders=&lt;csv&gt;</td><td>Recursive resolvers for non-zone queries.</td><td className="default">8.8.8.8,8.8.4.4</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">Backend behavior &amp; JWT</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">--internal-communication=true|false</td><td>Use internal addresses for inter-service traffic.</td><td className="default">false</td></tr>
              <tr><td className="param">--cors-origins=&lt;csv&gt;</td><td>Backend CORS allow-list.</td><td className="default">*</td></tr>
              <tr><td className="param">--jwt-access-duration=&lt;dur&gt;</td><td>Access token lifetime.</td><td className="default">1h</td></tr>
              <tr><td className="param">--jwt-refresh-duration=&lt;dur&gt;</td><td>Refresh token lifetime.</td><td className="default">5h</td></tr>
              <tr><td className="param">--enable-demo</td><td>Backend demo mode (read-only sample data).</td><td className="default">—</td></tr>
              <tr><td className="param">--log-level</td><td>Backend log level.</td><td className="default">info</td></tr>
              <tr><td className="param">--log-format=text|json</td><td>Log format.</td><td className="default">text</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">Op-mode</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="param">--non-interactive</td><td>Never prompt; fail if a confirmation would be required.</td></tr>
              <tr><td className="param">--no-firewall</td><td>Skip firewalld/ufw port opening.</td></tr>
              <tr><td className="param">--no-upgrade-os</td><td>Skip the apt/dnf <code>dist-upgrade</code> preflight (default-on for security currency; opt out for reproducible images / air-gapped runs).</td></tr>
              <tr><td className="param">--dry-run</td><td>Render configs to <code>/tmp/elchi-dryrun-*</code>; skip every side-effect.</td></tr>
              <tr><td className="param">--force-redownload</td><td>Bypass sha256 cache; re-download every binary.</td></tr>
              <tr><td className="param">--keep-bundle</td><td>Preserve the encrypted handoff bundle artifact at <code>/tmp/</code> after orchestration.</td></tr>
              <tr><td className="param">--bundle-key-out=&lt;path&gt;</td><td>Write the bundle decryption key to a file (mode 0600).</td></tr>
              <tr><td className="param">-h | --help</td><td>Print full usage and exit.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="baremetal-upgrade">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Download/></span><code>upgrade.sh</code> — version-diff upgrade</h2>
        <p>Run on M1. Computes the diff against the running cluster (<code>added</code> / <code>kept</code> / <code>removed</code> variants) and re-runs <code>install.sh</code> with the union. Every <code>elchi-*</code> systemd unit goes through hash-based reconcile so binary or config changes trigger a restart; unchanged services stay running. Single-flight via <code>flock /run/elchi-upgrade.lock</code>.</p>

        <Callout kind="info" title="No SSH flags needed after install">
          <p><code>install.sh</code> persists <code>ELCHI_SSH_USER / KEY / PORT</code> to <code>/etc/elchi/orchestrator.env</code> (mode 0600 root). Re-run upgrade or uninstall without <code>--ssh-user / --ssh-key / --ssh-port</code> and they'll fall back to the persisted values. Pass a flag explicitly to override.</p>
        </Callout>

        <h3 className="docs-h3">Add a new variant (additive — keeps current set)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--upgrade')} {'\\\n'}      {T.f('--add-backend-version')}={T.s('elchi-v1.2.0-v0.14.0-envoy1.37.0')}</Code>
        <p>One-liner shortcut: appends to the current variant set without re-listing what's already deployed. Cluster-wide effect — control-plane systemd unit + binary land on every node, port allocations are deterministic, UI's <code>config.js</code> <code>AVAILABLE_VERSIONS</code> regenerates so the new envoy version shows up in the version dropdown.</p>

        <h3 className="docs-h3">Bump just the UI</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('.../get.sh')} | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--upgrade')} {T.f('--ui-version')}={T.s('v1.1.6')}</Code>
        <p>Backend / envoy / coredns / mongo / VM stay on their current versions — install.sh's hash-based reconcile marks each as <code>noop</code>. Only nginx may restart if the UI config block changed.</p>

        <h3 className="docs-h3">Bump just CoreDNS (GSLB plugin)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('.../get.sh')} | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--upgrade')} {T.f('--coredns-version')}={T.s('v0.1.4')}</Code>

        <h3 className="docs-h3">Replace variant set explicitly (full union)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--upgrade')} {'\\\n'}      {T.f('--backend-version')}={T.s('elchi-v1.2.0-v0.14.0-envoy1.36.2,elchi-v1.2.0-v0.14.0-envoy1.37.0')}</Code>

        <h3 className="docs-h3">Replace a variant + drop the old one (declarative)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--upgrade')} {'\\\n'}      {T.f('--backend-version')}={T.s('elchi-v1.2.0-v0.14.0-envoy1.37.0')} {'\\\n'}      {T.f('--prune-missing')}</Code>

        <h3 className="docs-h3">Bump UI + Envoy proxy together</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--upgrade')} {'\\\n'}      {T.f('--ui-version')}={T.s('v1.1.4')} {'\\\n'}      {T.f('--envoy-version')}={T.s('v1.38.0')}</Code>

        <h3 className="docs-h3">Upgrade flags</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="param">--backend-version=&lt;csv&gt;</td><td>New variant set (replaces current). Omit to keep the current set.</td></tr>
              <tr><td className="param">--add-backend-version=&lt;csv&gt;</td><td>Additive: appends to the current variant set. UX shortcut — start serving an additional Envoy version without re-listing what's already deployed. Triggers control-plane unit creation + UI <code>config.js</code> regeneration cluster-wide. Mutually exclusive with <code>--prune-version</code> / <code>--prune-missing</code>.</td></tr>
              <tr><td className="param">--ui-version=&lt;vX.Y.Z&gt;</td><td>Bump UI bundle.</td></tr>
              <tr><td className="param">--envoy-version=&lt;vX.Y.Z&gt;</td><td>Bump front-door Envoy.</td></tr>
              <tr><td className="param">--coredns-version=&lt;vX.Y.Z&gt;</td><td>Bump CoreDNS plugin (only with GSLB enabled).</td></tr>
              <tr><td className="param">--mongo-version=auto|6.0|7.0|8.0</td><td>Forwarded to install.sh; package upgrade if differs.</td></tr>
              <tr><td className="param">--grafana-user / --grafana-password</td><td>Rotate Grafana admin login.</td></tr>
              <tr><td className="param">--prune-version=&lt;tag&gt;</td><td>Remove this specific variant after install. Repeatable / csv. Mutually exclusive with <code>--prune-missing</code>.</td></tr>
              <tr><td className="param">--prune-missing</td><td>Declarative — remove every CURRENT variant that isn't in the new <code>--backend-version</code> list.</td></tr>
              <tr><td className="param">--skip-health-gate</td><td>Bypass post-upgrade <code>verify::deep_health</code>. Faster but unsafer; only use when verify itself is the problem.</td></tr>
              <tr><td className="param">--ssh-user / --ssh-key / --ssh-port</td><td>Override persisted SSH credentials.</td></tr>
              <tr><td className="param">-h | --help</td><td>Usage banner.</td></tr>
            </tbody>
          </table>
        </div>

        <Callout kind="info" title="Health gate &amp; rollback">
          <p>After install.sh finishes, every node runs <code>verify::deep_health</code>: systemd state + journalctl registration log + Envoy admin <code>/listeners</code> bind check. A failure triggers per-binary rollback on the failed nodes (<code>.prev</code> snapshot → restart). Healthy nodes keep the new version; the operator retries against the bad node. <strong>install.sh also auto-prunes</strong> any variant left on disk but not in the active set, so a partial / aborted upgrade self-heals on the next run.</p>
        </Callout>
      </section>

      <section id="baremetal-uninstall">
        <h2 className="docs-h2"><span className="docs-h2-icon rose"><Icon.Trash/></span><code>uninstall.sh</code> — remove the stack</h2>
        <p>Default uninstall is non-destructive: services stop, unit files / binaries / installer payload / nginx vhost / journald drop-in / firewall ports / managed <code>/etc/hosts</code> block all go. Mongo, VictoriaMetrics, Grafana data + secrets + TLS material are preserved unless you opt in via the matching <code>--purge*</code> flag.</p>

        <h3 className="docs-h3">Single node (this machine only)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--uninstall')} {T.f('--yes-i-mean-it')}</Code>

        <h3 className="docs-h3">Whole cluster — fan out from M1</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--uninstall')} {T.f('--all-nodes')} {T.f('--yes-i-mean-it')}</Code>

        <p>Reads <code>/etc/elchi/nodes.list</code> on M1, SSHes into every M2..Mn using the SSH credentials saved at install time, and runs the local uninstall on each. Order is reverse-by-design (Mn first, M1 last) so shared state on M1 is dropped only after the dependents are gone. Add <code>--continue-on-error</code> if you want partial-cluster uninstall to finish all reachable nodes instead of aborting on the first SSH failure.</p>

        <h3 className="docs-h3">Wipe everything (data + packages + secrets + SSH bootstrap material)</h3>
        <Code lang="shell">{T.cmd('curl')} {T.f('-fsSL')} {T.s('https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh')} {'\\\n'}  | {T.cmd('sudo bash')} {T.f('-s')} {T.f('--')} {T.f('--uninstall')} {T.f('--all-nodes')} {T.f('--purge-all')} {T.f('--yes-i-mean-it')}</Code>

        <Callout kind="danger" title="--purge-all is destructive and irreversible">
          <p>Drops Mongo + VictoriaMetrics + Grafana + nginx packages, deletes <code>/var/lib/{'{mongodb,grafana,elchi}'}</code>, removes the cluster SSH key + known_hosts pin + our authorized_keys entry, and clears the CA we added to the system trust store. Combine with <code>--all-nodes</code> only when you genuinely want a clean slate across the whole fleet.</p>
        </Callout>

        <h3 className="docs-h3">Uninstall flags</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="param">--purge</td><td>Wipe <code>/etc/elchi</code>, <code>/var/lib/elchi</code>, <code>/var/log/elchi</code>, <code>/opt/elchi</code>, system trust-store anchors, and SSH bootstrap material.</td></tr>
              <tr><td className="param">--purge-mongo</td><td>Also remove mongo packages + <code>/var/lib/mongodb</code> + repo files. Implies <code>--purge</code>.</td></tr>
              <tr><td className="param">--purge-vm</td><td>Wipe VictoriaMetrics data dir.</td></tr>
              <tr><td className="param">--purge-grafana</td><td>Remove grafana package + <code>/var/lib/grafana</code> + repo files.</td></tr>
              <tr><td className="param">--purge-nginx</td><td>Remove nginx package + restore the original <code>nginx.conf</code> backup.</td></tr>
              <tr><td className="param">--purge-all</td><td>All purge flags above.</td></tr>
              <tr><td className="param">--all-nodes</td><td>Fan out to every node from <code>/etc/elchi/nodes.list</code> (M1 last, in reverse, so shared state is dropped last).</td></tr>
              <tr><td className="param">--continue-on-error</td><td>Don't abort on per-node failure; collect errors and print a summary.</td></tr>
              <tr><td className="param">--ssh-user / --ssh-key / --ssh-port</td><td>Override persisted SSH credentials.</td></tr>
              <tr><td className="param">--yes-i-mean-it</td><td>Skip the destructive-action confirmation. Required for <code>--non-interactive</code> purge.</td></tr>
              <tr><td className="param">-h | --help</td><td>Usage banner.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="baremetal-validate">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Check/></span><code>/etc/elchi/validate.sh</code> — per-node post-install audit</h2>
        <p>Read-only. The installer drops this on EVERY node so you can confirm the install end-to-end without leaning on the orchestrator. Run it on each machine after install (or any time you want a sanity check):</p>
        <Code lang="shell">{T.cmd('sudo')} /etc/elchi/validate.sh</Code>

        <p>What it walks (in order):</p>
        <ul>
          <li><strong>Topology context</strong> — this node's index, role flags (<code>runs_mongo</code>, <code>runs_otel</code>, <code>runs_coredns</code>, …), <code>backend_variants</code> set.</li>
          <li><strong>Systemd</strong> — every <code>elchi-*</code> unit + mongod / grafana-server / nginx (where present). Active = ✓, activating = warning, failed/inactive = ✗. Watchdog timer state checked separately.</li>
          <li><strong>Listening ports</strong> — compares <code>ss -lntp</code> against expected per-node + M1-singleton + per-variant control-plane ports. Flags any M1-only port that shows up on Mn (and vice-versa).</li>
          <li><strong>Service health</strong> — OTel <code>:13133</code> health (every node). M1 only: <code>mongod</code> ping via mongosh, VictoriaMetrics <code>/api/v1/query</code>, Grafana <code>/api/health</code>.</li>
          <li><strong>Envoy admin</strong> — <code>/ready</code>, <code>/clusters</code> health flags for every cluster (registry / controller-rest / otel / grafana / vm + every per-node controller and control-plane), <code>/listeners</code> bind verification.</li>
          <li><strong>Config integrity</strong> — sha256 of <code>envoy.yaml</code>, <code>topology.full.yaml</code>, <code>ports.full.json</code>, <code>nodes.list</code>, <code>tls/server.crt</code>. Compare hashes by hand across nodes to confirm the bundle distributed cleanly.</li>
          <li><strong>Stale variant detection</strong> — flags any <code>/etc/elchi/&lt;variant&gt;/</code> dir or <code>elchi-control-plane-&lt;sanitized&gt;@.service</code> unit whose tag isn't in the active <code>backend_variants</code> list.</li>
          <li><strong>System tuning</strong> — sysctl probe (somaxconn, max_map_count, swappiness, fs.file-max, fs.inotify.*), THP state, swap state, mongod LimitNOFILE/LimitMEMLOCK, envoy LimitNOFILE.</li>
          <li><strong>CoreDNS GSLB ports</strong> (when enabled) — <code>53/tcp</code>, <code>53/udp</code>, <code>8053</code>.</li>
        </ul>
        <p>Output is colored, with a final <code>PASS / WARN / FAIL</code> count. Exit code is non-zero on any FAIL.</p>

        <Callout kind="info" title="Why per-node?">
          <p>The installer renders Envoy bootstrap + bundle on M1 and SCPs to Mn — drift between nodes is the most common "weird symptom" cause. Running validate on each box and diffing the sha256 lines surfaces it in one shell command.</p>
        </Callout>
      </section>

      <section id="baremetal-helper">
        <h2 className="docs-h2"><span className="docs-h2-icon cyan"><Icon.Terminal/></span><code>elchi-stack</code> — operator helper</h2>
        <p>Installed at <code>/usr/local/bin/elchi-stack</code> on every node. M1 is the orchestrator (where SSH credentials are persisted) — most subcommands are intended to run from there.</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Subcommand</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="param">elchi-stack status</td><td>Cluster-wide service summary (each node's <code>systemctl is-active</code> for every elchi-* unit).</td></tr>
              <tr><td className="param">elchi-stack logs &lt;unit&gt; [-f]</td><td>Tail journalctl for the named unit on every node. <code>-f</code> follows; per-line <code>[host]</code> prefixing keeps streams readable, Ctrl+C exits cleanly.</td></tr>
              <tr><td className="param">elchi-stack reload-envoy</td><td>Re-render Envoy bootstrap + restart Envoy on every node (after a topology change).</td></tr>
              <tr><td className="param">elchi-stack add-node &lt;ip&gt;</td><td>Extend the cluster: provision the new node with the existing bundle, recompute topology, push updated <code>/etc/hosts</code> + Envoy bootstrap to all peers.</td></tr>
              <tr><td className="param">elchi-stack init-replica-set</td><td>Run <code>rs.initiate()</code> on M1 (idempotent — checks <code>rs.status()</code> first).</td></tr>
              <tr><td className="param">elchi-stack export-bundle &lt;out&gt; [--reuse-bundle-key]</td><td>Repackage cluster artifacts into an encrypted bundle. <code>--reuse-bundle-key</code> uses the install-time key persisted via systemd-creds at <code>/etc/elchi/.bundle-key</code> so the bundle can be reapplied without redistributing a fresh decryption key.</td></tr>
              <tr><td className="param">elchi-stack show-secret &lt;name&gt;</td><td>Print a stored credential. <code>name</code> ∈ <code>grafana | jwt | gslb | mongo-app | mongo-root | all</code>. Same values are also printed once at the end of the install. Persisted in <code>/etc/elchi/secrets.env</code> (mode 0640 root:elchi); preserved across re-runs and upgrades.</td></tr>
              <tr><td className="param">elchi-stack rotate-secret &lt;jwt|gslb&gt;</td><td>Mint a new secret, restart affected services.</td></tr>
              <tr><td className="param">elchi-stack verify</td><td>End-to-end cluster health: registration log evidence + Envoy admin listener probe + service active state on every node.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="baremetal-ports">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Network/></span>Port atlas</h2>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Service</th><th>Port</th><th>Where it runs</th></tr></thead>
            <tbody>
              <tr><td>Envoy public (TLS)</td><td className="param">0.0.0.0:443</td><td>Every node (configurable via <code>--port</code>)</td></tr>
              <tr><td>Envoy internal (plaintext)</td><td className="param">127.0.0.1:8080</td><td>Every node — UI/API to backend</td></tr>
              <tr><td>Envoy admin</td><td className="param">127.0.0.1:9901</td><td>Every node — hardcoded loopback only</td></tr>
              <tr><td>nginx (UI)</td><td className="param">127.0.0.1:8081</td><td>Every node — SPA + config.js, fronted by Envoy</td></tr>
              <tr><td>Registry gRPC</td><td className="param">0.0.0.0:1870</td><td>Every node — HA peer set; Envoy gRPC HC picks the leader</td></tr>
              <tr><td>Registry metrics</td><td className="param">:9091</td><td>Every node — hardcoded in backend; OTel scrape target</td></tr>
              <tr><td>Controller REST</td><td className="param">:1980</td><td>Every node — singleton, uses <code>versions[0]</code> binary</td></tr>
              <tr><td>Controller gRPC</td><td className="param">:1960</td><td>Every node — singleton</td></tr>
              <tr><td>Control-plane</td><td className="param">:1990, 1991, …</td><td>Every node — one port per variant by 0-indexed list position; same variant gets same port on every node</td></tr>
              <tr><td>OTel gRPC</td><td className="param">:4317</td><td>Every node — local sink for envoy <code>/opentelemetry</code></td></tr>
              <tr><td>OTel HTTP</td><td className="param">:4318</td><td>Every node</td></tr>
              <tr><td>OTel health</td><td className="param">:13133</td><td>Every node</td></tr>
              <tr><td>OTel prom self-metrics</td><td className="param">:8888</td><td>Every node</td></tr>
              <tr><td>MongoDB</td><td className="param">:27017</td><td>Standalone for 1-2 VM topology, RS-3 for 3+</td></tr>
              <tr><td>Grafana</td><td className="param">127.0.0.1:3000</td><td>M1 only — reverse-proxied at <code>/grafana/</code></td></tr>
              <tr><td>VictoriaMetrics</td><td className="param">0.0.0.0:8428</td><td>M1 only (with <code>--vm=local</code>)</td></tr>
              <tr><td>CoreDNS</td><td className="param">:53/tcp+udp</td><td>Every node when GSLB enabled</td></tr>
              <tr><td>CoreDNS webhook</td><td className="param">0.0.0.0:8053</td><td>M1 → M2/M3 push notifications (X-Elchi-Secret auth)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="baremetal-topology">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Layers/></span>Topology</h2>
        <p><strong>1 VM:</strong> all-in-one. <strong>2 VM:</strong> Mongo standalone on M1; M2 connects over LAN. <strong>3+ VM:</strong> Mongo replica set across the first 3 nodes; additional nodes (4+) run no mongod. Registry runs on every node with HA leader election (Mongo lease, TTL 30s, renew 10s). UI/Envoy/backend run on every node — each node's front-door Envoy round-robins UI traffic across all peers' nginx instances and uses <code>ext_proc</code> + the registry to decide which control-plane / controller to route each request to (<code>x-target-cluster</code> header).</p>

        <p><strong>OTEL collector on every node.</strong> Each node ships its own <code>otelcol-contrib</code> instance bound to <code>0.0.0.0:4317/4318</code>; that node's Envoy routes <code>/opentelemetry</code> traffic to <code>127.0.0.1:4317</code> (no cross-node hop). All collectors export to the singleton VictoriaMetrics on M1 — or to <code>--vm-endpoint</code> when <code>--vm=external</code>. Failure mode: M1 OTEL outage no longer cascades to M2/M3 envoys, and the per-node collector's <code>sending_queue</code> buffers writes if VM is briefly unreachable.</p>

        <p><strong>Storage tier stays on M1:</strong> VictoriaMetrics TSDB and Grafana UI are still singletons. With <code>--vm=external</code> the TSDB moves out entirely; Grafana stays on M1.</p>
      </section>

      <section id="baremetal-hardening">
        <h2 className="docs-h2"><span className="docs-h2-icon rose"><Icon.Shield/></span>Production hardening (kernel + systemd)</h2>
        <p>Every install lands a production tuning baseline. The defaults below come from the upstream production checklists for Envoy, MongoDB, and the Linux kernel — they're not opinionated guesses, they're the values these projects explicitly call out.</p>

        <h3 className="docs-h3">Kernel sysctl (<code>/etc/sysctl.d/99-elchi-stack.conf</code>)</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Key</th><th>Value</th><th>Why</th></tr></thead>
            <tbody>
              <tr><td className="param">net.core.somaxconn</td><td className="default">65535</td><td>listen() backlog ceiling for Envoy + nginx + grpc</td></tr>
              <tr><td className="param">net.core.netdev_max_backlog</td><td className="default">10000</td><td>NIC RX queue per CPU</td></tr>
              <tr><td className="param">net.ipv4.ip_local_port_range</td><td className="default">10240-65535</td><td>~55K ephemeral ports for Envoy upstream + mongo failover churn</td></tr>
              <tr><td className="param">net.ipv4.tcp_tw_reuse</td><td className="default">1</td><td>reuse TIME_WAIT sockets (RFC 6191 safe)</td></tr>
              <tr><td className="param">net.ipv4.tcp_fin_timeout</td><td className="default">15</td><td>recycle FIN_WAIT2 (default 60)</td></tr>
              <tr><td className="param">net.ipv4.tcp_keepalive_time</td><td className="default">120</td><td>detect dead peers in 2min, not 2hr</td></tr>
              <tr><td className="param">net.ipv4.tcp_syncookies</td><td className="default">1</td><td>SYN flood protection (explicit)</td></tr>
              <tr><td className="param">fs.file-max</td><td className="default">2097152</td><td>system-wide FD ceiling above any LimitNOFILE</td></tr>
              <tr><td className="param">vm.swappiness</td><td className="default">1</td><td>never page out unless OOM (mongo prerequisite)</td></tr>
              <tr><td className="param">vm.max_map_count</td><td className="default">262144</td><td>WiredTiger mmap regions</td></tr>
              <tr><td className="param">fs.inotify.max_queued_events</td><td className="default">65536</td><td>event queue depth (default 16384)</td></tr>
              <tr><td className="param">fs.inotify.max_user_instances</td><td className="default">8192</td><td>RHEL 9 default 128 — too low for VM/Grafana/mongo together</td></tr>
              <tr><td className="param">fs.inotify.max_user_watches</td><td className="default">524288</td><td>RHEL 9 default 8192; Ubuntu already 524288</td></tr>
              <tr><td className="param">user.max_inotify_instances</td><td className="default">8192</td><td>per-userns (Linux 5.11+); default 128</td></tr>
              <tr><td className="param">user.max_inotify_watches</td><td className="default">524288</td><td>per-userns; default 65536</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">MongoDB systemd drop-in (<code>/etc/systemd/system/mongod.service.d/10-elchi.conf</code>)</h3>
        <p>Mongo's package unit ships almost no resource limits; we override:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Directive</th><th>Value</th><th>Why</th></tr></thead>
            <tbody>
              <tr><td className="param">LimitNOFILE</td><td className="default">64000</td><td>file per collection + index + cursor + connection</td></tr>
              <tr><td className="param">LimitNPROC</td><td className="default">64000</td><td>WiredTiger thread pool + connection pool</td></tr>
              <tr><td className="param">LimitMEMLOCK</td><td className="default">infinity</td><td>required to silence the "ulimit -l too low" warnings</td></tr>
              <tr><td className="param">OOMScoreAdjust</td><td className="default">-1000</td><td>never let mongod be the OOM victim</td></tr>
              <tr><td className="param">TasksMax</td><td className="default">infinity</td><td>cgroup task limit (default ~4915 on RHEL is not enough)</td></tr>
            </tbody>
          </table>
        </div>
        <p>Plus a one-shot <code>elchi-disable-thp.service</code> (<code>Before=mongod.service</code>) that writes <code>never</code> to <code>/sys/kernel/mm/transparent_hugepage/{'{enabled,defrag}'}</code>. THP-induced khugepaged compaction is the most common cause of second-scale latency spikes in WiredTiger.</p>

        <h3 className="docs-h3">Per-service systemd hardening</h3>
        <p>Every elchi-* unit (envoy, otel, victoriametrics, grafana, registry, controller, control-plane, coredns) ships with a uniform hardening set:</p>
        <ul>
          <li><code>NoNewPrivileges=true</code>, <code>PrivateTmp=true</code></li>
          <li><code>ProtectSystem=strict</code>, <code>ProtectHome=true</code>, <code>ReadWritePaths=</code> minimum</li>
          <li><code>ProtectKernelTunables/Modules/ControlGroups/Logs=true</code></li>
          <li><code>ProtectClock=true</code>, <code>ProtectHostname=true</code>, <code>ProtectProc=invisible</code>, <code>ProcSubset=pid</code></li>
          <li><code>RestrictSUIDSGID=true</code>, <code>LockPersonality=true</code>, <code>RestrictRealtime=true</code>, <code>RestrictNamespaces=true</code></li>
          <li><code>SystemCallArchitectures=native</code>, <code>KeyringMode=private</code>, <code>RemoveIPC=yes</code>, <code>UMask=0077</code></li>
          <li><code>CapabilityBoundingSet=</code> (drop ALL) — except Envoy + CoreDNS keep <code>CAP_NET_BIND_SERVICE</code> for :443 / :53</li>
        </ul>
        <p>Per-service resource limits:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Unit</th><th>Limits</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td>elchi-envoy</td><td>LimitNOFILE=1048576 (override <code>ELCHI_ENVOY_NOFILE</code>)</td><td>front-door scale needs 1M FDs</td></tr>
              <tr><td>control-plane / controller / registry</td><td>LimitNOFILE=65536, LimitNPROC=65536, LimitMEMLOCK=64M</td><td>gRPC fan-in</td></tr>
              <tr><td>otel / victoriametrics / coredns</td><td>LimitNOFILE=65536, LimitNPROC=65536/4096</td><td>local sink + TSDB + DNS</td></tr>
              <tr><td>grafana-server (drop-in)</td><td>LimitNOFILE=65536, LimitNPROC=4096, MemoryMax=1G</td><td>UI; not in hot path</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">Preflight RAM/swap checks</h3>
        <p>Before any side-effect, <code>preflight::check_ram_swap</code> warns if total system RAM is below 4 GB and if any swap is active. Both are soft warnings on a normal install; set <code>ELCHI_REQUIRE_HEALTHY=1</code> to escalate to fatal. To remove swap permanently:</p>
        <Code lang="shell">{T.cmd('sudo swapoff')} {T.f('-a')}{'\n'}{T.cmd('sudo sed')} {T.f('-i.bak')} {T.s("'/\\sswap\\s/d'")} /etc/fstab</Code>

        <Callout kind="info" title="Verifying the hardening landed">
          <p>Run <code>sudo /etc/elchi/validate.sh</code> on every node. The "System tuning" section checks <code>somaxconn</code>, <code>vm.max_map_count</code>, <code>vm.swappiness</code>, <code>fs.file-max</code>, <code>fs.inotify.*</code>, THP state, swap state, mongo's <code>LimitNOFILE/MEMLOCK</code>, and envoy's <code>LimitNOFILE</code>.</p>
        </Callout>
      </section>

      <section id="baremetal-distros">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Check/></span>Supported distros + idempotency</h2>
        <p>Ubuntu 22.04 + 24.04 · Debian 11 + 12 · RHEL / Rocky / Alma / Oracle 9. amd64 only.</p>
        <p><strong>Idempotency &amp; reconcile</strong> — Every setup module uses hash-based reconcile (<code>systemd::install_and_apply</code> for elchi-* units; <code>systemd::reconcile_external</code> for grafana-server / mongod / nginx). The fingerprint = sha256(unit_file ‖ EnvironmentFile contents ‖ ExecStart binary) and is persisted at <code>/var/lib/elchi/.unit-fingerprint/&lt;unit&gt;</code>. Decision matrix on rerun:</p>
        <ul>
          <li>Fingerprint changed + active → <code>restart</code></li>
          <li>Fingerprint changed + inactive → <code>start</code></li>
          <li>Fingerprint same + active → <code>noop</code> (zero downtime)</li>
          <li>Fingerprint same + inactive → <code>start</code> (crash recovery)</li>
        </ul>
        <p>Binary downloads keep a <code>.prev</code> snapshot for rollback. <code>upgrade.sh</code> fails closed if any node fails the deep-health gate; per-binary rollback is automatic.</p>
      </section>
    </>
  );
}

export { SectionBareMetal };
