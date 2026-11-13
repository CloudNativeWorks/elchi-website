#!/usr/bin/env node
// Runs after `docusaurus build` (npm "postbuild" lifecycle, so CI's `npm run build`
// picks it up). Two jobs on build/:
//
// 1. Redirect stubs from @docusaurus/plugin-client-redirects: give them an
//    absolute canonical (https://www.elchi.io/docs/...) and
//    <meta name="robots" content="noindex, follow">, so the old URL drops out
//    of the index and its signals consolidate on the target. (GitHub Pages
//    cannot send real 301s; these stubs are the redirect.)
// 2. llms.txt: one line per indexable page (title, URL, description), read
//    from the built HTML so it always matches what is deployed.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'build');
const ORIGIN = 'https://www.elchi.io';
const BASE = '/docs/';

if (!fs.existsSync(outDir)) {
  console.error('postbuild: build/ not found, run docusaurus build first');
  process.exit(1);
}

const htmlFiles = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'assets') walk(p);
    } else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
};
walk(outDir);

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

// ---- 1. redirect stubs -------------------------------------------------------
let stubs = 0;
for (const f of htmlFiles) {
  let html = fs.readFileSync(f, 'utf8');
  if (!/<meta http-equiv="refresh"/.test(html) || html.length > 4000) continue;
  const m = html.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/);
  if (!m) continue;
  const abs = m[1].startsWith('/') ? ORIGIN + m[1] : m[1];
  html = html.replace(m[0], `<link rel="canonical" href="${abs}" />`);
  if (!/name="robots"/.test(html)) {
    html = html.replace(
      /<meta charset="UTF-8">/,
      '<meta charset="UTF-8">\n    <meta name="robots" content="noindex, follow">',
    );
  }
  fs.writeFileSync(f, html);
  stubs++;
}

// ---- 2. llms.txt -----------------------------------------------------------------
const sectionMeta = {};
const docsDir = path.join(root, 'docs');
for (const e of fs.readdirSync(docsDir, {withFileTypes: true})) {
  const cat = path.join(docsDir, e.name, '_category_.json');
  if (e.isDirectory() && fs.existsSync(cat)) {
    const j = JSON.parse(fs.readFileSync(cat, 'utf8'));
    sectionMeta[e.name] = {label: j.label, position: j.position ?? 50};
  }
}
sectionMeta[''] = {label: 'Start here', position: -1};
sectionMeta.blog = {label: 'Blog', position: 1000};

// Docusaurus minifies HTML, so attributes may be unquoted: parse tags loosely.
const attrs = (tag) => {
  const out = {};
  for (const m of tag.matchAll(/([\w-]+)(?:=("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
    let v = m[2] ?? '';
    if (/^["']/.test(v)) v = v.slice(1, -1);
    out[m[1].toLowerCase()] = v;
  }
  return out;
};
const findTag = (html, name, pred) => {
  for (const m of html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'g'))) {
    const a = attrs(m[1].replace(/\/$/, ''));
    if (pred(a)) return a;
  }
  return undefined;
};

const pages = [];
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const robots = findTag(html, 'meta', (a) => a.name === 'robots');
  if (robots && /noindex/.test(robots.content)) continue;
  if (/http-equiv="?refresh/.test(html) || path.basename(f) === '404.html') continue;
  const canonical = findTag(html, 'link', (a) => a.rel === 'canonical')?.href;
  if (!canonical || !canonical.startsWith(ORIGIN + BASE)) continue;
  const rel = canonical.slice((ORIGIN + BASE).length);
  // generated category indexes, search, tag and paginated blog lists add nothing
  if (/^(category|tags|search|blog\/(tags|archive|authors|page))(\/|$)/.test(rel)) continue;
  if (pages.some((p) => p.url === canonical)) continue;
  const title = decode((html.match(/<title[^>]*>([^<]*)<\/title>/) || [, ''])[1]).replace(/ \| Elchi Docs$/, '');
  const description = decode(findTag(html, 'meta', (a) => a.name === 'description')?.content ?? '');
  const seg = rel.split('/')[0];
  const section = rel.includes('/') || seg === 'blog' ? seg : '';
  pages.push({url: canonical, rel, title, description, section});
}

const sections = [...new Set(pages.map((p) => p.section))].sort(
  (a, b) => (sectionMeta[a]?.position ?? 50) - (sectionMeta[b]?.position ?? 50) || a.localeCompare(b),
);

let out = `# Elchi Docs

> Elchi is a visual control plane for Envoy proxy fleets, built by CloudNativeWorks (not the Elchi dictation app). It edits every Envoy resource in typed forms, validates it, and pushes it to Envoy over xDS; an edge agent runs Envoy on VMs as systemd services; Shield adds API security (WAF with the OWASP Core Rule Set, auth, rate limiting, DLP) through ext_proc; API Discovery builds an API inventory from Envoy access logs; GSLB steers DNS to healthy edges.

Product site: ${ORIGIN}/ · Plans: ${ORIGIN}/plans.html · Contact: ${ORIGIN}/contact.html · OpenAPI (public automation API): ${ORIGIN}${BASE}openapi/elchi-public-v1.yaml
`;
for (const s of sections) {
  const list = pages
    .filter((p) => p.section === s)
    .sort((a, b) => (s === 'blog' ? b.rel.localeCompare(a.rel) : a.rel.localeCompare(b.rel)));
  out += `\n## ${sectionMeta[s]?.label ?? s}\n\n`;
  for (const p of list) out += `- [${p.title}](${p.url})${p.description ? `: ${p.description}` : ''}\n`;
}
fs.writeFileSync(path.join(outDir, 'llms.txt'), out);

console.log(`postbuild: ${stubs} redirect stubs fixed (absolute canonical + noindex); llms.txt with ${pages.length} pages`);
