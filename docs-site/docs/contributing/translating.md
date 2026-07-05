---
title: Translating the Docs
description: How to translate the Elchi documentation into another language (e.g. Turkish). The i18n scaffolding is in place — English is the default; a translated locale can be enabled with a one-line change.
sidebar_position: 1
tags: [contributing]
---

The documentation is built with Docusaurus i18n. **English (`en`) is the default and
the only language shipped today**, but the Turkish (`tr`) scaffolding is already
generated, so a translation can be added incrementally without any structural work.

This page is the workflow for adding or completing a translation.

## How it's wired

- `docusaurus.config.ts` → `i18n: {defaultLocale: 'en', locales: ['en']}`. Only `en`
  is built. Adding a locale to the `locales` array is what turns a translation on.
- The navbar has a commented-out **language dropdown** (`localeDropdown`) ready to
  uncomment — see step 1 below. (It is kept out of the English-only build so the site
  doesn't ship a one-option switcher.)
- `i18n/tr/` holds the Turkish message catalogs, pre-generated:
  - `code.json` — UI strings (theme chrome, buttons).
  - `docusaurus-theme-classic/navbar.json` + `footer.json` — navbar/footer labels.
  - `docusaurus-plugin-content-docs/current.json` — sidebar **category** labels.
  - `docusaurus-plugin-content-docs/current/` — the translated **doc pages** go here
    (created when you copy pages in — see below).

:::info[Nothing is half-shipped]
Because `tr` is not in the built `locales` list, the live site stays 100% English
until someone deliberately enables it. There is no partially-translated locale in
production.
:::

## Adding / working on the Turkish translation

### 1. Enable the locale locally

In `docs-site/docusaurus.config.ts`, add `tr` to the locales list **and** uncomment the
language dropdown navbar item:

```ts
i18n: {defaultLocale: 'en', locales: ['en', 'tr']},
// …and in navbar.items, uncomment:
{type: 'localeDropdown', position: 'right'},
```

### 2. Refresh the translation stubs

From `docs-site/`:

```bash
npm run write-translations -- --locale tr
```

This (re)generates the UI/navbar/footer/category JSON stubs under `i18n/tr/`. Existing
translations are preserved; only new/changed source strings are added.

### 3. Translate the UI strings

Edit the `"message"` values (leave the keys and `"description"` untouched) in:

- `i18n/tr/code.json`
- `i18n/tr/docusaurus-theme-classic/navbar.json`
- `i18n/tr/docusaurus-theme-classic/footer.json`
- `i18n/tr/docusaurus-plugin-content-docs/current.json` (sidebar category labels)

### 4. Translate the doc pages

Doc pages are translated by **copying** the English Markdown into the locale tree and
translating the body. Start with the highest-value pages (getting-started, quickstart,
Shield overview, installation) — you do **not** have to translate everything at once;
any page you haven't copied falls back to English.

```bash
# from docs-site/
mkdir -p i18n/tr/docusaurus-plugin-content-docs/current
# copy a page (keep the same relative path), then translate its body
cp docs/getting-started/quickstart.md \
   i18n/tr/docusaurus-plugin-content-docs/current/getting-started/quickstart.md
```

Keep the frontmatter keys and any `:::admonition[Title]` / code fences intact —
translate only the prose and the admonition titles.

### 5. Preview and build

```bash
npm run start -- --locale tr      # live preview of the Turkish site
npm run build                     # builds every locale in the locales array
```

The built Turkish site lands under `build/tr/…`; in production that maps to
`www.elchi.io/docs/tr/…`, and the navbar language dropdown switches between them.

## Guidelines

- **Don't translate:** code, commands, flag names, env vars, metric names, API paths,
  YAML keys, and product/component names (`Envoy`, `Shield`, `elchi-client`, `xDS`,
  `ext_proc`, …). Translate the surrounding explanation only.
- **Keep links working:** internal links are absolute (`/shield/overview`) and are
  locale-resolved automatically — don't add a `/tr/` prefix by hand.
- **Match structure:** keep the same headings and frontmatter so the sidebar and
  anchors line up with the English version.
- **Partial is fine:** an untranslated page shows in English. Ship what you have.

## The marketing site (home / features / architecture)

The marketing pages (`www.elchi.io/`, `/features.html`, `/architecture.html`) are a
separate hand-built Vite + React site — **not** Docusaurus — and they are **already
bilingual**: English at the root and Turkish under `/tr/`. A language switcher in the
nav toggles between them, and `hreflang` alternates are wired for SEO.

To edit the marketing translations, change the `STR = { en: {...}, tr: {...} }` object
at the top of each source file in the repo root:

- `shared.jsx` — nav + footer strings
- `home.jsx`, `features.jsx`, `architecture.jsx` — each page's content
- `i18n.js` — the locale mechanism (`getLocale`, `locHref`); rarely needs changes
- `tr/*.html` — the per-page `<title>`/meta/OG for the Turkish pages

Keep technical terms in English there too (see the guideline above).

## See also

- [Docusaurus i18n docs](https://docusaurus.io/docs/i18n/introduction) — the upstream reference.
- [Glossary](/reference/glossary) — canonical term definitions (a good translation memory anchor).
