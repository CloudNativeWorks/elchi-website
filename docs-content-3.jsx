import { Icon, Code, T, Callout } from './docs-shared.jsx';

// ============== CLIENT + DISCOVERY + RESOURCES ==============
function SectionClient() {
  return (
    <>
      <section id="client-overview">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Terminal/></span>Elchi Client</h2>
        <p>The Elchi Client is a lightweight Go agent that runs on Linux hosts and connects each Envoy proxy to your control plane. It handles registration, log shipping, BGP routing, and lifecycle commands.</p>
      </section>

      <section id="client-download">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Download/></span>Download</h2>
        <h3 className="docs-h3">Linux AMD64</h3>
        <ul>
          <li><a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-amd64">elchi-client-linux-amd64</a></li>
          <li><a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-amd64.sha256">elchi-client-linux-amd64.sha256</a></li>
        </ul>
        <h3 className="docs-h3">Linux ARM64</h3>
        <ul>
          <li><a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-arm64">elchi-client-linux-arm64</a></li>
          <li><a href="https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-arm64.sha256">elchi-client-linux-arm64.sha256</a></li>
        </ul>
      </section>

      <section id="client-install">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Settings/></span>Installation</h2>
        <h3 className="docs-h3">Quick install</h3>
        <Code lang="shell">{T.c('# Fetch the installer\n')}{T.cmd('wget')} {T.s('https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-install.sh')}</Code>

        <h3 className="docs-h3">Production setup</h3>
        <Code lang="shell">{T.cmd('sudo bash')} elchi-install.sh \\{'\n'}  {T.f('--name')}=web-server-01 \\{'\n'}  {T.f('--host')}=backend.elchi.io \\{'\n'}  {T.f('--port')}={T.n('443')} \\{'\n'}  {T.f('--tls')}={T.b('true')} \\{'\n'}  {T.f('--token')}=your-auth-token</Code>

        <h3 className="docs-h3">OpenStack deployment</h3>
        <Code lang="shell">{T.cmd('sudo bash')} elchi-install.sh \\{'\n'}  {T.f('--name')}=openstack-vm \\{'\n'}  {T.f('--host')}=controller.elchi.io \\{'\n'}  {T.f('--port')}={T.n('443')} \\{'\n'}  {T.f('--tls')}={T.b('true')} \\{'\n'}  {T.f('--token')}=prod-token \\{'\n'}  {T.f('--cloud')}=my-openstack</Code>

        <h3 className="docs-h3">With BGP routing</h3>
        <Code lang="shell">{T.cmd('sudo bash')} elchi-install.sh \\{'\n'}  {T.f('--enable-bgp')} \\{'\n'}  {T.f('--name')}=edge-router \\{'\n'}  {T.f('--host')}=controller.elchi.io \\{'\n'}  {T.f('--port')}={T.n('443')} \\{'\n'}  {T.f('--tls')}={T.b('true')} \\{'\n'}  {T.f('--token')}=prod-token \\{'\n'}  {T.f('--cloud')}=production</Code>

        <h3 className="docs-h3">Installer flags</h3>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Flag</th><th>Description</th><th>Required</th></tr></thead>
            <tbody>
              <tr><td className="param">--name=NAME</td><td>Client name as it appears in Elchi.</td><td className="default req">yes</td></tr>
              <tr><td className="param">--host=HOST</td><td>Controller server address.</td><td className="default req">yes</td></tr>
              <tr><td className="param">--port=PORT</td><td>Server port (1–65535).</td><td className="default req">yes</td></tr>
              <tr><td className="param">--tls=true|false</td><td>Enable TLS connection.</td><td className="default req">yes</td></tr>
              <tr><td className="param">--token=TOKEN</td><td>Authentication token (min 8 chars).</td><td className="default req">yes</td></tr>
              <tr><td className="param">--cloud=CLOUD</td><td>Cloud / infrastructure provider. Defaults to <code>other</code>.</td><td className="default">no</td></tr>
              <tr><td className="param">--enable-bgp</td><td>Install FRR for BGP routing.</td><td className="default">no</td></tr>
            </tbody>
          </table>
        </div>

        <Callout kind="warn" title="OpenStack deployments">
          <p>If you're running on OpenStack, pass <code>--cloud=YOUR_CLOUD_NAME</code> using the cloud name shown in the Elchi UI.</p>
        </Callout>

        <h3 className="docs-h3">Manual installation</h3>
        <p>Skip the installer and place the binary yourself:</p>
        <Code lang="shell">{T.c('# AMD64\n')}{T.cmd('wget')} {T.s('https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-amd64')}{'\n'}{T.cmd('sudo mv')} elchi-client-linux-amd64 /usr/local/bin/elchi-client{'\n'}{T.cmd('sudo chmod')} {T.f('+x')} /usr/local/bin/elchi-client{'\n'}{'\n'}{T.c('# ARM64\n')}{T.cmd('wget')} {T.s('https://github.com/CloudNativeWorks/elchi-client/releases/download/v1.0.0/elchi-client-linux-arm64')}{'\n'}{T.cmd('sudo mv')} elchi-client-linux-arm64 /usr/local/bin/elchi-client{'\n'}{T.cmd('sudo chmod')} {T.f('+x')} /usr/local/bin/elchi-client</Code>
      </section>

      <section id="client-config">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Settings/></span>Configuration</h2>
        <p>After installation, edit the client config to point at your Elchi server.</p>

        <h3 className="docs-h3">1. Open the config file</h3>
        <Code lang="shell">{T.cmd('sudo nano')} /etc/elchi/config.yaml</Code>

        <h3 className="docs-h3">2. Fill in server &amp; client</h3>
        <Code lang="yaml">{T.k('server:')}{'\n'}  {T.k('host:')} {T.s('""')}                    {T.c('# Main server address')}{'\n'}  {T.k('port:')} {T.n('80')}                    {T.c('# Main server port')}{'\n'}  {T.k('tls:')} {T.b('false')}                  {T.c('# Set true if main server uses TLS')}{'\n'}  {T.k('token:')} {T.s('"xxxx-xxxx-xxxx-xxxx"')} {T.c('# From Elchi UI → Settings')}{'\n'}{'\n'}{T.k('client:')}{'\n'}  {T.k('name:')} {T.s('"web-server-01"')}      {T.c('# Hostname / display name')}{'\n'}  {T.k('bgp:')} {T.b('false')}                  {T.c('# Enable BGP routing')}{'\n'}  {T.k('cloud:')} {T.s('"aws"')}                {T.c('# aws | azure | gcp | openstack | other')}</Code>

        <h3 className="docs-h3">Examples</h3>
        <p>AWS deployment:</p>
        <Code lang="yaml">{T.k('client:')}{'\n'}  {T.k('name:')} {T.s('"aws-instance-01"')}{'\n'}  {T.k('bgp:')} {T.b('false')}{'\n'}  {T.k('cloud:')} {T.s('"aws"')}</Code>
        <p>OpenStack with BGP:</p>
        <Code lang="yaml">{T.k('client:')}{'\n'}  {T.k('name:')} {T.s('"openstack-router"')}{'\n'}  {T.k('bgp:')} {T.b('true')}{'\n'}  {T.k('cloud:')} {T.s('"my-openstack"')}</Code>

        <h3 className="docs-h3">3. Restart the service</h3>
        <Code lang="shell">{T.cmd('systemctl restart')} elchi-client.service</Code>

        <Callout kind="info" title="Configuration tips">
          <ul>
            <li>Make sure the controller address is reachable from the host.</li>
            <li>Enable TLS when the controller is behind HTTPS.</li>
            <li>Generate the token from <strong>Elchi UI → Settings → Tokens</strong>.</li>
          </ul>
        </Callout>
      </section>

      <section id="client-os">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Layers/></span>Supported Operating Systems</h2>
        <ul>
          <li><strong>Linux</strong> — Ubuntu 24.04 (minimum required).</li>
        </ul>
        <p>Additional distributions are tracked on the roadmap. <a href="mailto:admin@cloudnativeworks.com?subject=Elchi%20Client%20Build%20Request">Request a build →</a></p>
      </section>
    </>
  );
}

function SectionDiscovery() {
  return (
    <>
      <section id="discovery-overview">
        <h2 className="docs-h2"><span className="docs-h2-icon amber"><Icon.Network/></span>Elchi Discovery</h2>
        <p>The Elchi Endpoint Discovery agent runs as a Helm chart inside your Kubernetes cluster. It watches services and endpoints in real time and syncs them to Elchi so your Envoy clusters always see up-to-date upstreams.</p>
      </section>

      <section id="discovery-prereq">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Check/></span>Prerequisites</h2>
        <ul>
          <li>Kubernetes <strong>1.19+</strong></li>
          <li>Helm <strong>3.2.0+</strong> installed locally</li>
          <li>A discovery token from <strong>Settings → Tokens</strong> in the Elchi UI</li>
        </ul>
      </section>

      <section id="discovery-install">
        <h2 className="docs-h2"><span className="docs-h2-icon emerald"><Icon.Download/></span>Installation</h2>
        <h3 className="docs-h3">1. Add the Helm repo</h3>
        <Code lang="shell">{T.cmd('helm repo add')} elchi {T.s('https://charts.elchi.io')}{'\n'}{T.cmd('helm repo update')}</Code>

        <h3 className="docs-h3">2. Install the discovery agent</h3>
        <Code lang="shell">{T.cmd('helm install')} endpoint-discovery elchi/elchi-discovery \\{'\n'}  {T.f('--set')} config.elchiEndpoint={T.s('"https://your-elchi-instance.com"')} \\{'\n'}  {T.f('--set')} config.token={T.s('"your-discovery-token"')} \\{'\n'}  {T.f('--set')} clusterName={T.s('"my-k8s-cluster"')} \\{'\n'}  {T.f('--namespace')} elchi-stack \\{'\n'}  {T.f('--create-namespace')}</Code>

        <h3 className="docs-h3">3. Verify</h3>
        <Code lang="shell">{T.cmd('kubectl get pods')} {T.f('-n')} elchi-stack</Code>

        <h3 className="docs-h3">Install from a local chart</h3>
        <Code lang="shell">{T.cmd('helm install')} endpoint-discovery . {T.f('--values')} values.yaml</Code>
      </section>

      <section id="discovery-config">
        <h2 className="docs-h2"><span className="docs-h2-icon"><Icon.Settings/></span>Configuration</h2>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Parameter</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="param">config.elchiEndpoint</td><td>URL of your Elchi controller.</td></tr>
              <tr><td className="param">config.token</td><td>Discovery token from <strong>Settings → Tokens</strong>.</td></tr>
              <tr><td className="param">clusterName</td><td>Unique cluster name. Must be distinct across every connected K8s cluster.</td></tr>
            </tbody>
          </table>
        </div>
        <Callout kind="info" title="Quick tips">
          <ul>
            <li>Generate the discovery token from <strong>Elchi UI → Settings → Tokens</strong>.</li>
            <li>Pick a unique <code>clusterName</code> per cluster — it identifies the source of every endpoint.</li>
            <li>The agent registers services automatically as they appear in the cluster.</li>
          </ul>
        </Callout>
      </section>
    </>
  );
}

function SectionResources() {
  return (
    <>
      <section id="cli-reference">
        <h2 className="docs-h2"><span className="docs-h2-icon cyan"><Icon.Terminal/></span>CLI Reference</h2>
        <Callout kind="info" title="Coming soon">
          <p>A complete reference for the <code>elchi</code> and <code>elchi-client</code> command-line tools is in progress. In the meantime, run any binary with <code>--help</code> for a flag listing.</p>
        </Callout>
      </section>

      <section id="api-reference">
        <h2 className="docs-h2"><span className="docs-h2-icon violet"><Icon.Book/></span>API Reference</h2>
        <Callout kind="info" title="Coming soon">
          <p>Full REST and gRPC reference is being generated from the proto sources. Until it ships, the controller exposes an OpenAPI schema at <code>/api/v1/openapi.json</code>.</p>
        </Callout>
      </section>

      <section id="troubleshoot">
        <h2 className="docs-h2"><span className="docs-h2-icon rose"><Icon.Shield/></span>Troubleshooting</h2>
        <h3 className="docs-h3">Pods stuck in <code>Pending</code></h3>
        <p>Usually a missing storage class or insufficient cluster resources. Check <code>kubectl describe pod</code> output for the actual scheduling error.</p>

        <h3 className="docs-h3">Client cannot connect to controller</h3>
        <ul>
          <li>Verify <code>server.host</code> resolves and is reachable from the host.</li>
          <li>If the controller is behind HTTPS, set <code>server.tls: true</code>.</li>
          <li>Re-issue the token from <strong>Settings → Tokens</strong> — old tokens are invalidated when rotated.</li>
        </ul>

        <h3 className="docs-h3">Envoy not receiving config updates</h3>
        <ul>
          <li>Check the control-plane pod logs for snapshot errors.</li>
          <li>Confirm the Envoy version matches one of the deployed <code>global.versions</code> tags.</li>
          <li>Look at the dependency graph in the UI to spot orphaned references.</li>
        </ul>
      </section>
    </>
  );
}

export { SectionClient, SectionDiscovery, SectionResources };
