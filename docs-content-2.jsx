import { Icon, Code, T, Callout } from './docs-shared.jsx';

// ============== PLATFORM SECTION ==============
function SectionPlatform() {
  return (
    <>
      <section id="platform-overview">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Cube/></span>Platform Overview</h2>
        <p>The Elchi platform Helm chart deploys every component you need to run the management plane: UI, controller, control-plane, registry, and the supporting databases.</p>

        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Component</th><th>Role</th></tr></thead>
            <tbody>
              <tr><td><strong>Elchi UI</strong></td><td>Web interface for creating and managing proxy configurations.</td></tr>
              <tr><td><strong>Controller</strong></td><td>REST API service for resource management and client command dispatch.</td></tr>
              <tr><td><strong>Control-Plane</strong></td><td>Envoy xDS service with snapshot cache and version routing.</td></tr>
              <tr><td><strong>Registry</strong></td><td>Service discovery and process routing with automatic registration.</td></tr>
              <tr><td><strong>Envoy Proxy</strong></td><td>Internal gateway for intelligent traffic routing between components.</td></tr>
              <tr><td><strong>MongoDB</strong></td><td>Stores configurations, users, audit log, and platform state.</td></tr>
              <tr><td><strong>VictoriaMetrics</strong></td><td>Time-series database for metrics storage and monitoring.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="platform-prerequisites">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Check/></span>Prerequisites</h2>
        <ul>
          <li>Kubernetes cluster (<strong>v1.19+</strong>)</li>
          <li>Helm <strong>3.2.0+</strong> installed locally</li>
          <li><code>kubectl</code> configured with cluster access</li>
          <li>Minimum <strong>4 GB RAM</strong> and <strong>2 CPU cores</strong> available across nodes</li>
          <li>A storage class for persistent volumes — only required when using the built-in MongoDB / VictoriaMetrics</li>
        </ul>
      </section>

      <section id="platform-install">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Download/></span>Installation</h2>
        <p>The fastest path is the bundled <code>elchi-stack</code> chart, which installs every component with sensible defaults.</p>

        <h3 className="docs-h3">Add the Helm repository</h3>
        <Code lang="shell">{T.cmd('helm repo add')} elchi {T.s('https://charts.elchi.io')}{'\n'}{T.cmd('helm repo update')}</Code>

        <h3 className="docs-h3">Install with defaults</h3>
        <Code lang="shell">{T.cmd('helm install')} my-elchi elchi/elchi-stack {'\\\n'}  {T.f('--set-string')} global.mainAddress={T.s('"your-domain.com"')} {'\\\n'}  {T.f('--namespace')} elchi-stack {'\\\n'}  {T.f('--create-namespace')}</Code>

        <h3 className="docs-h3">Install with a values file</h3>
        <p>For anything beyond a quick trial, pass a <code>values.yaml</code> with your overrides:</p>
        <Code lang="yaml">{T.k('global:')}{'\n'}  {T.k('namespace:')} {T.s('"elchi-stack"')}{'\n'}  {T.k('mainAddress:')} {T.s('"elchi.example.com"')}{'\n'}  {T.k('tlsEnabled:')} {T.b('true')}{'\n'}  {T.k('jwt:')}{'\n'}    {T.k('secret:')} {T.s('"your-secure-32-character-minimum-secret-key-here"')}{'\n'}  {T.k('versions:')}{'\n'}    - {T.k('tag:')} {T.s('v0.1.0-v0.13.4-envoy1.34.2')}{'\n'}    - {T.k('tag:')} {T.s('v0.1.0-v0.13.4-envoy1.35.0')}</Code>
        <Code lang="shell">{T.cmd('helm install')} my-elchi elchi/elchi-stack {T.f('-f')} values.yaml</Code>

        <h3 className="docs-h3">Sign in</h3>
        <p>Default bootstrap credentials are <code>admin</code> / <code>admin</code>. Change them on first login.</p>
        <Callout kind="warn" title="Production checklist">
          <ul>
            <li>Set <code>global.tlsEnabled: true</code> and provide certificates.</li>
            <li>Replace <code>global.jwt.secret</code> with a 32+ character random value.</li>
            <li>Disable the bundled MongoDB and point at a managed replica set.</li>
            <li>Run at least 3 replicas of the controller and control-plane.</li>
          </ul>
        </Callout>
      </section>

      <section id="platform-config">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Settings/></span>Configuration</h2>
        <p>Every chart value lives under the <code>global</code> namespace so it can be shared across sub-charts. The most common parameters:</p>

        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Parameter</th><th>Description</th><th>Default</th></tr></thead>
            <tbody>
              <tr><td className="param">global.namespace</td><td>Namespace where all components deploy.</td><td className="default">"elchi-stack"</td></tr>
              <tr><td className="param">global.mainAddress</td><td>Public base URL for all components.</td><td className="default req">required</td></tr>
              <tr><td className="param">global.port</td><td>Controller API port. Falls back to 80/443 based on TLS.</td><td className="default">""</td></tr>
              <tr><td className="param">global.tlsEnabled</td><td>Enable HTTPS for external traffic.</td><td className="default">false</td></tr>
              <tr><td className="param">global.installMongo</td><td>Use the bundled MongoDB.</td><td className="default">true</td></tr>
              <tr><td className="param">global.installVictoriaMetrics</td><td>Use the bundled VictoriaMetrics.</td><td className="default">true</td></tr>
              <tr><td className="param">global.internalCommunication</td><td>Enable internal-only communication between services.</td><td className="default">false</td></tr>
              <tr><td className="param">global.versions</td><td>List of Elchi backend versions to deploy.</td><td className="default">[v0.13.4-envoy1.33.5, v0.13.4-envoy1.34.2]</td></tr>
              <tr><td className="param">global.jwt.secret</td><td>JWT signing secret (min 32 chars).</td><td className="default req">change me</td></tr>
              <tr><td className="param">global.jwt.accessTokenDuration</td><td>Access token lifetime.</td><td className="default">"1h"</td></tr>
              <tr><td className="param">global.jwt.refreshTokenDuration</td><td>Refresh token lifetime.</td><td className="default">"5h"</td></tr>
              <tr><td className="param">global.elchiBackend.controlPlaneDefaultReplicas</td><td>Default replica count for control-plane services.</td><td className="default">2</td></tr>
              <tr><td className="param">global.elchiBackend.controllerDefaultReplicas</td><td>Default replica count for controller services.</td><td className="default">2</td></tr>
              <tr><td className="param">global.cors.allowedOrigins</td><td>CORS allowed origins. Comma-separated, or <code>*</code> for all.</td><td className="default">"*"</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">External MongoDB parameters</h3>
        <p>When <code>global.installMongo: false</code>, point Elchi at your own MongoDB cluster:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <tbody>
              <tr><td className="param">global.mongodb.hosts</td><td>Connection hosts (comma-separated for replica sets).</td></tr>
              <tr><td className="param">global.mongodb.username</td><td>MongoDB username (default <code>"elchi"</code>).</td></tr>
              <tr><td className="param">global.mongodb.password</td><td>MongoDB password.</td></tr>
              <tr><td className="param">global.mongodb.database</td><td>Database name (default <code>"elchi"</code>).</td></tr>
              <tr><td className="param">global.mongodb.scheme</td><td>Connection scheme — <code>mongodb</code> or <code>mongodb+srv</code>.</td></tr>
              <tr><td className="param">global.mongodb.replicaset</td><td>Replica set name, if applicable.</td></tr>
              <tr><td className="param">global.mongodb.tlsEnabled</td><td>Enable TLS connection to MongoDB.</td></tr>
              <tr><td className="param">global.mongodb.authSource</td><td>Authentication source database.</td></tr>
              <tr><td className="param">global.mongodb.authMechanism</td><td>Authentication mechanism.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="docs-h3">External VictoriaMetrics</h3>
        <p>When <code>global.installVictoriaMetrics: false</code>, set:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <tbody>
              <tr><td className="param">global.victoriametrics.endpoint</td><td>External VictoriaMetrics endpoint. Accepts <code>http://host:port</code> or <code>host:port</code>.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="platform-storage">
        <h2 className="docs-h2"><span className="docs-h2-icon amber"><Icon.Database/></span>Storage Options</h2>

        <h3 className="docs-h3">Built-in MongoDB (default)</h3>
        <Code lang="yaml">{T.k('global:')}{'\n'}  {T.k('installMongo:')} {T.b('true')}{'\n'}{'\n'}{T.k('mongodb:')}{'\n'}  {T.k('persistence:')}{'\n'}    {T.k('enabled:')} {T.b('true')}{'\n'}    {T.k('size:')} {T.s('"10Gi"')}            {T.c('# adjust for production')}{'\n'}    {T.k('storageClass:')} {T.s('"fast-ssd"')}</Code>

        <h3 className="docs-h3">External MongoDB</h3>
        <Code lang="yaml">{T.k('global:')}{'\n'}  {T.k('installMongo:')} {T.b('false')}{'\n'}  {T.k('mongodb:')}{'\n'}    {T.k('hosts:')} {T.s('"mongo1.example.com:27017,mongo2.example.com:27017"')}{'\n'}    {T.k('username:')} {T.s('"elchi"')}{'\n'}    {T.k('password:')} {T.s('"secure-password"')}{'\n'}    {T.k('database:')} {T.s('"elchi"')}{'\n'}    {T.k('replicaset:')} {T.s('"rs0"')}{'\n'}    {T.k('tlsEnabled:')} {T.b('true')}</Code>

        <h3 className="docs-h3">Built-in VictoriaMetrics</h3>
        <Code lang="yaml">{T.k('global:')}{'\n'}  {T.k('installVictoriaMetrics:')} {T.b('true')}{'\n'}{'\n'}{T.k('victoriametrics:')}{'\n'}  {T.k('storage:')}{'\n'}    {T.k('size:')} {T.s('"20Gi"')}{'\n'}    {T.k('storageClass:')} {T.s('"standard"')}{'\n'}  {T.k('retentionPeriod:')} {T.s('"30d"')}</Code>

        <h3 className="docs-h3">External VictoriaMetrics</h3>
        <Code lang="yaml">{T.k('global:')}{'\n'}  {T.k('installVictoriaMetrics:')} {T.b('false')}{'\n'}  {T.k('victoriametrics:')}{'\n'}    {T.k('endpoint:')} {T.s('"http://victoria-metrics.monitoring:8428"')}</Code>

        <Callout kind="info" title="Sizing guide">
          <ul>
            <li>MongoDB — 10 GB for small deployments, 50 GB+ for production.</li>
            <li>VictoriaMetrics — 20 GB for ~30 days retention; scale with metric volume.</li>
            <li>SSD-backed storage classes give meaningful headroom for both.</li>
          </ul>
        </Callout>
      </section>

      <section id="platform-production">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Settings/></span>Production Setup</h2>
        <p>A reference values file for production-grade deployments:</p>
        <Code lang="yaml">{T.k('global:')}{'\n'}  {T.k('namespace:')} {T.s('"elchi-production"')}{'\n'}  {T.k('mainAddress:')} {T.s('"elchi.company.com"')}{'\n'}  {T.k('tlsEnabled:')} {T.b('true')}{'\n'}  {T.k('jwt:')}{'\n'}    {T.k('secret:')} {T.s('"$(openssl rand -base64 32)"')}{'\n'}    {T.k('accessTokenDuration:')} {T.s('"1h"')}{'\n'}    {T.k('refreshTokenDuration:')} {T.s('"24h"')}{'\n'}  {T.k('elchiBackend:')}{'\n'}    {T.k('controlPlaneDefaultReplicas:')} {T.n('3')}{'\n'}    {T.k('controllerDefaultReplicas:')} {T.n('3')}{'\n'}  {T.k('versions:')}{'\n'}    - {T.k('tag:')} {T.s('v0.1.0-v0.13.4-envoy1.35.0')}{'\n'}{'\n'}{T.c('# Resource limits')}{'\n'}{T.k('elchi:')}{'\n'}  {T.k('replicas:')} {T.n('3')}{'\n'}  {T.k('resources:')}{'\n'}    {T.k('requests:')}{'\n'}      {T.k('memory:')} {T.s('"512Mi"')}{'\n'}      {T.k('cpu:')} {T.s('"500m"')}{'\n'}    {T.k('limits:')}{'\n'}      {T.k('memory:')} {T.s('"1Gi"')}{'\n'}      {T.k('cpu:')} {T.s('"1000m"')}</Code>

        <h3 className="docs-h3">High availability</h3>
        <ul>
          <li>Run at least 3 replicas for every critical component.</li>
          <li>Configure pod anti-affinity rules to spread replicas across nodes.</li>
          <li>Use an external MongoDB replica set for durable persistence.</li>
          <li>Hand metrics off to an external VictoriaMetrics cluster.</li>
          <li>Set both resource <code>requests</code> and <code>limits</code> on every workload.</li>
        </ul>
      </section>

      <section id="platform-security">
        <h2 className="docs-h2"><span className="docs-h2-icon rose"><Icon.Shield/></span>Security</h2>
        <Callout kind="danger" title="Critical security requirements">
          <ul>
            <li><strong>JWT secret</strong> — must be a randomly generated value of 32+ characters. The default ships unsafe and must be replaced.</li>
            <li><strong>TLS</strong> — always enable TLS for production deployments.</li>
            <li><strong>MongoDB</strong> — use strong passwords and enable authentication.</li>
            <li><strong>Network policies</strong> — restrict pod-to-pod communication using Kubernetes NetworkPolicies.</li>
          </ul>
        </Callout>

        <h3 className="docs-h3">Generate a secure JWT secret</h3>
        <Code lang="shell">{T.c('# 32-byte secret, base64 encoded\n')}{T.cmd('openssl rand -base64 32')}{'\n'}{'\n'}{T.c('# Or, using /dev/urandom\n')}{T.cmd('cat')} /dev/urandom | {T.cmd('tr')} {T.f('-dc')} {T.s("'a-zA-Z0-9'")} | {T.cmd('fold')} {T.f('-w')} {T.n('32')} | {T.cmd('head')} {T.f('-n')} {T.n('1')}</Code>
      </section>
    </>
  );
}

export { SectionPlatform };
