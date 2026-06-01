import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Nav, Footer } from './shared.jsx';
import { NAV, Sidebar, TocRail } from './docs-nav.jsx';
import { SectionIntro } from './docs-content-1.jsx';
import { SectionPlatform } from './docs-content-2.jsx';
import { SectionClient, SectionDiscovery, SectionResources } from './docs-content-3.jsx';
import { SectionBareMetal } from './docs-content-4.jsx';
import { SectionConfig, SectionTraffic } from './docs-content-5.jsx';
import { SectionInventory, SectionAdmin } from './docs-content-6.jsx';

const TOC = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'quickstart',   label: 'Quick Start' },
  { id: 'concepts',     label: 'Core Concepts' },
  { id: 'network',      label: 'Network & Access' },
  { id: 'platform-overview',     label: 'Platform Overview' },
  { id: 'platform-prerequisites',label: 'Prerequisites', sub: true },
  { id: 'platform-install',      label: 'Installation', sub: true },
  { id: 'platform-config',       label: 'Configuration', sub: true },
  { id: 'platform-storage',      label: 'Storage', sub: true },
  { id: 'platform-production',   label: 'Production', sub: true },
  { id: 'platform-security',     label: 'Security', sub: true },
  { id: 'baremetal-overview',  label: 'Bare-Metal' },
  { id: 'baremetal-prereq',    label: 'Prerequisites', sub: true },
  { id: 'baremetal-quickstart',label: 'Quick Start', sub: true },
  { id: 'baremetal-install',   label: 'install.sh', sub: true },
  { id: 'baremetal-upgrade',   label: 'upgrade.sh', sub: true },
  { id: 'baremetal-uninstall', label: 'uninstall.sh', sub: true },
  { id: 'baremetal-validate',  label: 'validate.sh', sub: true },
  { id: 'baremetal-helper',    label: 'elchi-stack', sub: true },
  { id: 'baremetal-ports',     label: 'Port atlas', sub: true },
  { id: 'baremetal-topology',  label: 'Topology', sub: true },
  { id: 'baremetal-hardening', label: 'Hardening', sub: true },
  { id: 'baremetal-distros',   label: 'Distros', sub: true },
  { id: 'client-overview', label: 'Client' },
  { id: 'client-install',  label: 'Installation', sub: true },
  { id: 'client-config',   label: 'Configuration', sub: true },
  { id: 'discovery-overview', label: 'Discovery' },
  { id: 'discovery-install',  label: 'Installation', sub: true },
  { id: 'config-model',    label: 'Resources & Config' },
  { id: 'scenarios',       label: 'Scenarios', sub: true },
  { id: 'version-upgrade', label: 'Versions & Upgrades', sub: true },
  { id: 'gslb', label: 'GSLB' },
  { id: 'acme', label: 'Certificates (ACME)', sub: true },
  { id: 'waf',  label: 'WAF', sub: true },
  { id: 'api-discovery',        label: 'API Discovery' },
  { id: 'api-discovery-config', label: 'Collector Config', sub: true },
  { id: 'observability',        label: 'Metrics & Logs', sub: true },
  { id: 'audit',                label: 'Audit & Syslog', sub: true },
  { id: 'jobs',                 label: 'Background Jobs', sub: true },
  { id: 'registry-ha',   label: 'Registry & HA' },
  { id: 'auth-access',   label: 'Auth & Access', sub: true },
  { id: 'security-data', label: 'Threat Intel & GeoIP', sub: true },
  { id: 'ai-analysis',   label: 'AI Analysis', sub: true },
  { id: 'licensing',     label: 'Licensing', sub: true },
  { id: 'troubleshoot',   label: 'Troubleshooting' },
];

function App() {
  const [active, setActive] = useState('introduction');

  // scrollspy
  useEffect(() => {
    const ids = [];
    NAV.forEach((g) => g.items.forEach((i) => ids.push(i.id)));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Nav active="docs" />
      <div className="docs-layout">
        <Sidebar active={active} setActive={setActive} />
        <main className="docs-main">
          <div className="docs-breadcrumb">
            <a href="index.html">Home</a>
            <span className="docs-breadcrumb-sep">/</span>
            <span className="docs-breadcrumb-current">Documentation</span>
          </div>
          <SectionIntro />
          <SectionPlatform />
          <SectionBareMetal />
          <SectionClient />
          <SectionDiscovery />
          <SectionConfig />
          <SectionTraffic />
          <SectionInventory />
          <SectionAdmin />
          <SectionResources />

          <div className="docs-pagefoot">
            <a href="features.html" className="prev">
              <span className="docs-pagefoot-label">← Browse</span>
              <span className="docs-pagefoot-title">Feature catalog</span>
            </a>
            <a href="architecture.html" className="next">
              <span className="docs-pagefoot-label">Read more →</span>
              <span className="docs-pagefoot-title">Architecture deep-dive</span>
            </a>
          </div>
        </main>
        <TocRail active={active} headings={TOC} />
      </div>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
