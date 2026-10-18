// Prerender the marketing pages into dist/ after `vite build`.
//
// The site is a set of small React apps that mount into <div id="root">. Without
// this step every page ships an empty root, so crawlers that do not run
// JavaScript (and link previews) see no content. Here each page's component is
// rendered to HTML with Vite's SSR loader and written into the built page's
// root. In the browser the page still mounts with createRoot, which replaces the
// prerendered markup with the live app — no hydration, so client-only state
// (e.g. the light/dark screenshot choice) can never mismatch.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

// Every HTML entry except docs.html (a redirect to /docs/).
const PAGES = [
  'index.html', 'features.html', 'architecture.html', 'contact.html', 'plans.html',
  'products/core.html', 'products/api-security.html', 'products/api-discovery.html',
  'products/gslb.html', 'products/waf.html',
  'tr/index.html', 'tr/features.html', 'tr/architecture.html', 'tr/contact.html', 'tr/plans.html',
  'tr/products/core.html', 'tr/products/api-security.html', 'tr/products/api-discovery.html',
  'tr/products/gslb.html', 'tr/products/waf.html',
];

const ROOT_RE = /<div id="root"([^>]*)><\/div>/;

const vite = await createServer({
  root,
  configFile: join(root, 'vite.config.js'),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
});

let failed = 0;
try {
  for (const page of PAGES) {
    const src = readFileSync(join(root, page), 'utf8');
    const script = src.match(/<script type="module" src="([^"]+)"><\/script>/);
    const rootTag = src.match(ROOT_RE);
    if (!script || !rootTag) throw new Error(`${page}: no module script or empty #root`);

    const entry = '/' + relative(root, resolve(dirname(join(root, page)), script[1]));
    const product = rootTag[1].match(/data-product="([^"]+)"/)?.[1];

    // getLocale() reads location.pathname: /tr/... renders Turkish.
    const pathname = '/' + page.replace(/index\.html$/, '');
    globalThis.location = { pathname, hash: '', search: '', href: `https://www.elchi.io${pathname}` };

    try {
      const mod = await vite.ssrLoadModule(entry);
      if (!mod.Page) throw new Error(`${entry} exports no Page component`);
      const html = renderToString(React.createElement(mod.Page, product ? { slug: product } : null));

      const out = join(dist, page);
      if (!existsSync(out)) throw new Error(`missing build output ${out}`);
      const built = readFileSync(out, 'utf8');
      if (!ROOT_RE.test(built)) throw new Error(`${out}: #root not found or not empty`);
      writeFileSync(out, built.replace(ROOT_RE, (_, attrs) => `<div id="root"${attrs}>${html}</div>`));
      console.log(`[prerender] ${page} (${(html.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      failed++;
      console.error(`[prerender] ${page} failed: ${err.message}`);
    }
  }
} finally {
  delete globalThis.location;
  await vite.close();
}

if (failed) {
  console.error(`[prerender] ${failed} page(s) failed`);
  process.exit(1);
}
