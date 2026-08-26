import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

async function fetchLatestTag(repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'elchi-website-build',
        // Authenticated in CI (shared runner IPs exhaust the anonymous rate limit).
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.tag_name || 'unknown';
  } catch (err) {
    console.warn(`[vite] failed to fetch latest release for ${repo}:`, err.message);
    return 'unknown';
  }
}

export default defineConfig(async () => {
  const [uiVersion, backendVersion] = await Promise.all([
    fetchLatestTag('CloudNativeWorks/elchi'),
    fetchLatestTag('CloudNativeWorks/elchi-backend'),
  ]);
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
