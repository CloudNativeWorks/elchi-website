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
// 3. Markdown for machines: llms-full.txt (every indexable page's Markdown source,
//    concatenated with its title and URL) and a per-page copy next to each page
//    (/docs/<slug>.md), linked from the page head with rel="alternate".
// 4. /search: drop the search plugin's invalid <meta property="robots"> (the valid
//    name="robots" tag comes from src/theme/SearchPage).
// 5. FAQPage JSON-LD on /troubleshooting/faq, built from the page's own ### Q&As.
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

Full text of every page below, as Markdown: ${ORIGIN}${BASE}llms-full.txt. Each page also has its Markdown source at its URL plus \`.md\` (for example ${ORIGIN}${BASE}getting-started/introduction.md).
`;
for (const s of sections) {
  const list = pages
    .filter((p) => p.section === s)
    .sort((a, b) => (s === 'blog' ? b.rel.localeCompare(a.rel) : a.rel.localeCompare(b.rel)));
  out += `\n## ${sectionMeta[s]?.label ?? s}\n\n`;
  for (const p of list) out += `- [${p.title}](${p.url})${p.description ? `: ${p.description}` : ''}\n`;
}
fs.writeFileSync(path.join(outDir, 'llms.txt'), out);

// ---- 3. llms-full.txt + per-page Markdown ------------------------------------------
// Docusaurus' generated route metadata maps each permalink to its source file.
const genDir = path.join(root, '.docusaurus');
const sourceOf = {}; // permalink -> absolute source path
const permalinkOf = {}; // absolute source path -> permalink
for (const plugin of ['docusaurus-plugin-content-docs', 'docusaurus-plugin-content-blog']) {
  const dir = path.join(genDir, plugin, 'default');
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!/^site-.*\.json$/.test(f)) continue;
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (!j.permalink || !j.source?.startsWith('@site/')) continue;
    const abs = path.join(root, j.source.slice('@site/'.length));
    sourceOf[j.permalink] = abs;
    permalinkOf[abs] = j.permalink;
  }
}

// Make a page's Markdown stand alone: absolute URLs for root-relative and file
// links, light-mode screenshots only, no front matter.
const toMarkdown = (file) => {
  let md = fs.readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  md = md.replace(/^!\[[^\]]*\]\([^)]*#gh-dark-mode-only\)\n?/gm, '');
  md = md.replace(/(\]\()([^)\s]+)(\))/g, (all, a, href, b) => {
    if (/^(https?:|mailto:|#)/.test(href)) return all;
    href = href.replace(/#gh-light-mode-only$/, '');
    const [p, hash = ''] = href.split(/(?=#)/);
    if (/\.mdx?$/.test(p)) {
      const target = permalinkOf[path.resolve(path.dirname(file), p)];
      return target ? `${a}${ORIGIN}${target}${hash}${b}` : all;
    }
    if (p.startsWith('/')) return `${a}${ORIGIN}${BASE}${p.slice(1)}${hash}${b}`;
    return all;
  });
  return md.trim() + '\n';
};

let full = `# Elchi Docs: full text

> Every indexable page of the Elchi documentation (${ORIGIN}${BASE}) as Markdown, in the order of ${ORIGIN}${BASE}llms.txt. Elchi is a visual control plane for Envoy proxy fleets, built by CloudNativeWorks.
`;
let mdCopies = 0;
for (const s of sections) {
  const list = pages
    .filter((p) => p.section === s)
    .sort((a, b) => (s === 'blog' ? b.rel.localeCompare(a.rel) : a.rel.localeCompare(b.rel)));
  for (const p of list) {
    const src = sourceOf[p.url.slice(ORIGIN.length)];
    if (!src || !fs.existsSync(src)) continue;
    const body = toMarkdown(src);
    const head = `# ${p.title}\n\nURL: ${p.url}\n${p.description ? `\n> ${p.description}\n` : ''}`;
    full += `\n---\n\n${head}\n${body}`;
    // per-page copy: /docs/<rel>.md (the docs root page is /docs/index.md)
    const mdRel = (p.rel === '' ? 'index' : p.rel) + '.md';
    fs.mkdirSync(path.dirname(path.join(outDir, mdRel)), {recursive: true});
    fs.writeFileSync(path.join(outDir, mdRel), `${head}\n${body}`);
    // advertise it from the page itself
    const htmlFile = path.join(outDir, p.rel === '' ? 'index.html' : `${p.rel}.html`);
    if (fs.existsSync(htmlFile)) {
      const html = fs.readFileSync(htmlFile, 'utf8');
      if (!html.includes('type="text/markdown"')) {
        fs.writeFileSync(
          htmlFile,
          html.replace('</head>', `<link rel="alternate" type="text/markdown" href="${ORIGIN}${BASE}${mdRel}"></head>`),
        );
      }
    }
    mdCopies++;
  }
}
fs.writeFileSync(path.join(outDir, 'llms-full.txt'), full);

// ---- 4. search page robots meta ----------------------------------------------------
const searchHtml = path.join(outDir, 'search.html');
if (fs.existsSync(searchHtml)) {
  const html = fs.readFileSync(searchHtml, 'utf8');
  fs.writeFileSync(searchHtml, html.replace(/<meta[^>]*property="?robots"?[^>]*>/g, ''));
}

// ---- 5. FAQPage JSON-LD -----------------------------------------------------------
// Google no longer shows FAQ rich results; this is for parity with the marketing
// faq.html and for parsers. Questions and answers are the page's own visible text.
const faqSrc = path.join(docsDir, 'troubleshooting', 'faq.md');
const faqHtml = path.join(outDir, 'troubleshooting', 'faq.html');
let faqCount = 0;
if (fs.existsSync(faqSrc) && fs.existsSync(faqHtml)) {
  const plain = (t) =>
    t
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  const body = fs.readFileSync(faqSrc, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  const qa = [...body.matchAll(/^### (.+)\n([\s\S]*?)(?=^#{1,3} |(?![\s\S]))/gm)].map((m) => ({
    '@type': 'Question',
    name: plain(m[1]),
    acceptedAnswer: {'@type': 'Answer', text: plain(m[2])},
  }));
  faqCount = qa.length;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${ORIGIN}${BASE}troubleshooting/faq#faq`,
    url: `${ORIGIN}${BASE}troubleshooting/faq`,
    inLanguage: 'en',
    mainEntity: qa,
  };
  const html = fs.readFileSync(faqHtml, 'utf8');
  if (qa.length && !html.includes('"FAQPage"')) {
    const json = JSON.stringify(ld).replace(/</g, '\\u003c');
    fs.writeFileSync(faqHtml, html.replace('</head>', `<script type="application/ld+json">${json}</script></head>`));
  }
}

console.log(
  `postbuild: ${stubs} redirect stubs fixed (absolute canonical + noindex); llms.txt with ${pages.length} pages; ` +
    `llms-full.txt + ${mdCopies} per-page .md copies; FAQPage with ${faqCount} questions`,
);
