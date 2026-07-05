const ELCHI_UI_VERSION = typeof __ELCHI_UI_VERSION__ !== 'undefined' ? __ELCHI_UI_VERSION__ : 'dev';
const ELCHI_BACKEND_VERSION = typeof __ELCHI_BACKEND_VERSION__ !== 'undefined' ? __ELCHI_BACKEND_VERSION__ : 'dev';

// ============== NAV ==============
function Nav({ active }) {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="index.html" className="brand">
          <span className="brand-mark"></span>
        </a>
        <div className="nav-links">
          <a href="index.html" className={active === 'home' ? 'active' : ''}>Home</a>
          <a href="features.html" className={active === 'features' ? 'active' : ''}>Features</a>
          <a href="architecture.html" className={active === 'architecture' ? 'active' : ''}>Architecture</a>
          <a href="/docs/" className={active === 'docs' ? 'active' : ''}>Docs</a>
        </div>
        <div className="nav-cta">
          <div className="nav-versions">
            <a
              href={`https://github.com/CloudNativeWorks/elchi-archive/releases/tag/elchi-ui-${ELCHI_UI_VERSION}`}
              target="_blank"
              rel="noopener"
              className="nav-version"
              title={`Elchi UI ${ELCHI_UI_VERSION}`}
            >
              <span className="nav-version-key">UI</span>
              <span className="nav-version-tag">{ELCHI_UI_VERSION}</span>
            </a>
            <a
              href={`https://github.com/CloudNativeWorks/elchi-archive/releases/tag/elchi-backend-${ELCHI_BACKEND_VERSION}`}
              target="_blank"
              rel="noopener"
              className="nav-version"
              title={`Elchi Backend ${ELCHI_BACKEND_VERSION}`}
            >
              <span className="nav-version-key">API</span>
              <span className="nav-version-tag">{ELCHI_BACKEND_VERSION}</span>
            </a>
          </div>
          <a href="https://demo.elchi.io" target="_blank" rel="noopener" className="btn btn-primary">Try Demo →</a>
        </div>
      </div>
    </nav>
  );
}

// ============== FOOTER ==============
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{marginBottom: 14}}>
              <span className="brand-mark"></span>
            </div>
            <p style={{maxWidth: 360, fontSize: 14, lineHeight: 1.6}}>
              Enterprise proxy management platform. 3-process distributed
              architecture with full xDS protocol support.
            </p>
            <div style={{display: 'flex', gap: 8, marginTop: 18}}>
              <span className="pill" style={{background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0'}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e'}}></span>
                Demo online
              </span>
              <span className="pill">UI {ELCHI_UI_VERSION}</span>
              <span className="pill">API {ELCHI_BACKEND_VERSION}</span>
            </div>
          </div>
          <div>
            <h5>Product</h5>
            <ul>
              <li><a href="features.html">Features</a></li>
              <li><a href="architecture.html">Architecture</a></li>
              <li><a href="index.html#screenshots">Screenshots</a></li>
              <li><a href="https://demo.elchi.io" target="_blank" rel="noopener">Demo</a></li>
            </ul>
          </div>
          <div>
            <h5>Resources</h5>
            <ul>
              <li><a href="/docs/">Documentation</a></li>
              <li><a href="https://charts.elchi.io" target="_blank" rel="noopener">Helm Charts</a></li>
              <li><a href="https://github.com/orgs/CloudNativeWorks/repositories" target="_blank" rel="noopener">GitHub</a></li>
              <li><a href="/docs/installation/client/installation">Client Install</a></li>
              <li><a href="/docs/installation/helm-platform/installation">Platform Install</a></li>
            </ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li><a href="https://www.cloudnativeworks.com" target="_blank" rel="noopener">About</a></li>
              <li><a href="mailto:admin@cloudnativeworks.com">Contact</a></li>
              <li><a href="https://github.com/orgs/CloudNativeWorks/repositories" target="_blank" rel="noopener">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Elchi. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export { Nav, Footer };
