// Write dist/sitemap.xml after the build. Each page's <lastmod> is the date of the
// last commit that touched its sources (both locales' HTML, the page component and the
// data it renders), so the dates move only when the content does. CI must check out the
// full history (fetch-depth: 0) or every page gets the date of the latest commit.
// The docs have their own sitemap (/docs/sitemap.xml, from Docusaurus).
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.elchi.io';

// [en path, component + data sources]. No changefreq/priority: Google ignores both.
const PAGES = [
  ['', ['home.jsx', 'hero-stage.jsx', 'screens-data.js', 'products-data.js']],
  ['features.html', ['features.jsx']],
  ['architecture.html', ['architecture.jsx']],
  ['products/core.html', ['product.jsx', 'products-data.js']],
  ['products/api-security.html', ['product.jsx', 'products-data.js']],
  ['products/api-discovery.html', ['product.jsx', 'products-data.js']],
  ['products/gslb.html', ['product.jsx', 'products-data.js']],
  ['compare.html', ['compare.jsx', 'compare-data.js']],
  ['compare/istio.html', ['compare.jsx', 'compare-data.js']],
  ['compare/envoy-gateway.html', ['compare.jsx', 'compare-data.js']],
  ['compare/go-control-plane.html', ['compare.jsx', 'compare-data.js']],
  ['plans.html', ['plans.jsx', 'products-data.js']],
  ['faq.html', ['faq.jsx', 'faq-data.js']],
  ['videos.html', ['videos.jsx', 'videos-data.js', 'film-data.js']],
  ['contact.html', ['contact.jsx', 'offices.jsx']],
  ['about.html', ['about.jsx', 'offices.jsx', 'legal-layout.jsx']],
  ['privacy.html', ['privacy.jsx', 'offices.jsx', 'legal-layout.jsx']],
];

const today = new Date().toISOString().slice(0, 10);
function lastmod(files) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: root, encoding: 'utf8' }).trim();
    return out || today; // uncommitted new page: today
  } catch {
    return today;
  }
}

const enHtml = (p) => (p === '' ? 'index.html' : p);
const url = (p, tr) => `${SITE}/${tr ? 'tr/' : ''}${p}`;

const entries = PAGES.flatMap(([p, sources]) => {
  const mod = lastmod([enHtml(p), 'tr/' + enHtml(p), ...sources]);
  const alts = [
    `<xhtml:link rel="alternate" hreflang="en" href="${url(p, false)}"/>`,
    `<xhtml:link rel="alternate" hreflang="tr" href="${url(p, true)}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${url(p, false)}"/>`,
  ].join('\n    ');
  return [false, true].map((tr) => `  <url>
    <loc>${url(p, tr)}</loc>
    ${alts}
    <lastmod>${mod}</lastmod>
  </url>`);
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
writeFileSync(join(root, 'dist', 'sitemap.xml'), xml);
console.log(`[sitemap] ${entries.length} URLs`);
