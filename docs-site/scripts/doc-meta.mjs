#!/usr/bin/env node
// Lists every doc's effective <title> and meta description (frontmatter title,
// else first H1) and flags SEO problems: duplicate titles, titles > 60 chars,
// descriptions outside 120-160 chars. Usage: node scripts/doc-meta.mjs [--all]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dirs = ['docs', 'blog'].map((d) => path.join(root, d)).filter((d) => fs.existsSync(d));
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, {withFileTypes: true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.mdx?$/.test(e.name) && !e.name.startsWith('_')) files.push(p);
  }
};
dirs.forEach(walk);

const rows = files.sort().map((f) => {
  const src = fs.readFileSync(f, 'utf8');
  const fm = (src.match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
  const get = (k) => {
    const m = fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'));
    return m ? m[1].trim().replace(/^(['"])(.*)\1$/, '$2') : undefined;
  };
  const h1 = (src.match(/^# (.+)$/m) || [])[1];
  const title = get('title') || h1 || path.basename(f).replace(/\.mdx?$/, '');
  const description = get('description') || '';
  return {file: path.relative(root, f), title, description};
});

const count = {};
rows.forEach((r) => (count[r.title] = (count[r.title] || 0) + 1));
const all = process.argv.includes('--all');
let problems = 0;
for (const r of rows) {
  const issues = [];
  if (count[r.title] > 1) issues.push(`dup-title x${count[r.title]}`);
  if (r.title.length > 60) issues.push(`title ${r.title.length}`);
  const d = r.description.length;
  if (d < 120 || d > 160) issues.push(`desc ${d}`);
  if (issues.length) problems++;
  if (all || issues.length) console.log(`${r.file}\t${issues.join(', ') || 'ok'}\t${r.title}`);
}
console.error(`${rows.length} docs, ${problems} with issues`);
process.exitCode = 0;
