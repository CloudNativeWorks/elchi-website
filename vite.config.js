import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Release versions for the nav/footer badges, resolved at build time.
//
// They come from elchi-archive's index.json, NOT from the components' own
// repositories: elchi and elchi-backend are private, so
// api.github.com/repos/<private>/releases/latest answers 404 to an
// unauthenticated build — and CI's GITHUB_TOKEN is scoped to this repository
// only, so it cannot read them either. Every badge rendered "unknown" and the
// links they build (…/releases/tag/elchi-ui-unknown) 404'd. The archive is the
// public mirror and its index is kept sorted newest-first by semver, so [0] is
// the current release. The docs site resolves them the same way
// (docs-site/docusaurus.config.ts).
const ARCHIVE_INDEX = 'https://archive.elchi.io/index.json';

async function fetchArchiveVersions() {
  const fallback = { ui: 'unknown', backend: 'unknown' };
  try {
    const res = await fetch(ARCHIVE_INDEX, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'elchi-website-build' },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    const newest = (key) => {
      const list = data[key];
      return Array.isArray(list) && list.length > 0 && list[0].version ? list[0].version : 'unknown';
    };
    return { ui: newest('ui_releases'), backend: newest('backend_releases') };
  } catch (err) {
    console.warn(`[vite] failed to read ${ARCHIVE_INDEX}:`, err.message);
    return fallback;
  }
}

export default defineConfig(async () => {
  const { ui: uiVersion, backend: backendVersion } = await fetchArchiveVersions();
  console.log(`[vite] elchi UI: ${uiVersion} · elchi backend: ${backendVersion}`);

  return {
    plugins: [react()],
    base: '/',
    define: {
      __ELCHI_UI_VERSION__: JSON.stringify(uiVersion),
      __ELCHI_BACKEND_VERSION__: JSON.stringify(backendVersion),
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          index:        resolve(__dirname, 'index.html'),
          features:     resolve(__dirname, 'features.html'),
          architecture: resolve(__dirname, 'architecture.html'),
          contact:      resolve(__dirname, 'contact.html'),
          docs:         resolve(__dirname, 'docs.html'),
          plans:        resolve(__dirname, 'plans.html'),
          productCore:        resolve(__dirname, 'products/core.html'),
          productApiSecurity: resolve(__dirname, 'products/api-security.html'),
          productApiDiscovery: resolve(__dirname, 'products/api-discovery.html'),
          productGslb:        resolve(__dirname, 'products/gslb.html'),
          productWaf:         resolve(__dirname, 'products/waf.html'),
          trIndex:        resolve(__dirname, 'tr/index.html'),
          trFeatures:     resolve(__dirname, 'tr/features.html'),
          trArchitecture: resolve(__dirname, 'tr/architecture.html'),
          trContact:      resolve(__dirname, 'tr/contact.html'),
          trPlans:        resolve(__dirname, 'tr/plans.html'),
          trProductCore:        resolve(__dirname, 'tr/products/core.html'),
          trProductApiSecurity: resolve(__dirname, 'tr/products/api-security.html'),
          trProductApiDiscovery: resolve(__dirname, 'tr/products/api-discovery.html'),
          trProductGslb:        resolve(__dirname, 'tr/products/gslb.html'),
          trProductWaf:         resolve(__dirname, 'tr/products/waf.html'),
        },
      },
    },
  };
});
