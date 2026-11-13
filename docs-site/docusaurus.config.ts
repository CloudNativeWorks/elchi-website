import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js at build time — no client-side code here.

// Latest release versions for the navbar version badges — fetched once at build
// time. They come from elchi-archive's index.json, not from the components'
// own repositories: those are private, so api.github.com answers 404 for an
// unauthenticated build and every badge rendered "unknown". The archive is the
// public mirror and index.json is kept sorted newest-first by semver
// (tools/index-upsert.py --check enforces it), so [0] is the current release.
// Self-hosted Geist / Geist Mono variable fonts (latin + latin-ext subsets from
// @fontsource-variable), font-display: swap.
const GEIST_FONT_FACES = `@font-face {font-family: 'Geist'; font-style: normal; font-display: swap; font-weight: 100 900; src: url('/docs/fonts/geist-latin-wght-normal.woff2') format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;} @font-face {font-family: 'Geist'; font-style: normal; font-display: swap; font-weight: 100 900; src: url('/docs/fonts/geist-latin-ext-wght-normal.woff2') format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;} @font-face {font-family: 'Geist Mono'; font-style: normal; font-display: swap; font-weight: 100 900; src: url('/docs/fonts/geist-mono-latin-wght-normal.woff2') format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;} @font-face {font-family: 'Geist Mono'; font-style: normal; font-display: swap; font-weight: 100 900; src: url('/docs/fonts/geist-mono-latin-ext-wght-normal.woff2') format('woff2'); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;}`;

const ARCHIVE_INDEX = 'https://archive.elchi.io/index.json';

async function archiveVersions(): Promise<{ui: string; backend: string}> {
  const fallback = {ui: 'unknown', backend: 'unknown'};
  try {
    const res = await fetch(ARCHIVE_INDEX, {
      headers: {Accept: 'application/json', 'User-Agent': 'elchi-website-build'},
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as Record<string, unknown>;
    const newest = (key: string): string => {
      const list = json[key] as Array<{version?: string}> | undefined;
      if (!Array.isArray(list) || list.length === 0) return 'unknown';
      return list[0]?.version ?? 'unknown';
    };
    return {ui: newest('ui_releases'), backend: newest('backend_releases')};
  } catch {
    return fallback;
  }
}

export default async function createConfig(): Promise<Config> {
  const {ui: uiVersion, backend: backendVersion} = await archiveVersions();

  const versionBadgesHtml = `
    <span class="nav-versions">
      <a class="nav-version" href="https://github.com/CloudNativeWorks/elchi-archive/releases" target="_blank" rel="noopener">
        <span class="nav-version-key">UI</span> <span class="nav-version-tag" data-archive="ui_releases">${uiVersion}</span></a>
      <a class="nav-version" href="https://github.com/CloudNativeWorks/elchi-archive/releases" target="_blank" rel="noopener">
        <span class="nav-version-key">API</span> <span class="nav-version-tag" data-archive="backend_releases">${backendVersion}</span></a>
    </span>`;

  return {
    // Also the <title> suffix of every page ("Page | Elchi Docs").
    title: 'Elchi Docs',
    tagline: 'Enterprise Envoy management platform',
    url: 'https://www.elchi.io',
    // Served from GH Pages under /docs/ next to the Vite marketing site.
    baseUrl: '/docs/',
    trailingSlash: false,
    onBrokenLinks: 'throw',
    onBrokenAnchors: 'throw',
    favicon: 'img/favicon.ico',
    headTags: [
      {tagName: 'link', attributes: {rel: 'icon', type: 'image/svg+xml', href: '/docs/img/favicon.svg'}},
      {tagName: 'link', attributes: {rel: 'apple-touch-icon', sizes: '180x180', href: '/docs/img/apple-touch-icon.png'}},
      // Self-hosted Geist (src/css/custom.css @font-face): preload the body face so
      // text paints in Geist without a render-blocking font stylesheet.
      {
        tagName: 'link',
        attributes: {
          rel: 'preload',
          href: '/docs/fonts/geist-latin-wght-normal.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: 'anonymous',
        },
      },
      // @font-face lives here, not in custom.css: the bundler would try to resolve
      // the static /docs/fonts/ URLs. Geist is SIL OFL (static/fonts/OFL.txt).
      {tagName: 'style', attributes: {}, innerHTML: GEIST_FONT_FACES},
      // Machine-readable index of every docs page (generated by scripts/postbuild.mjs).
      {tagName: 'link', attributes: {rel: 'alternate', type: 'text/plain', title: 'llms.txt', href: '/docs/llms.txt'}},
      // Cookie consent (KVKK / GDPR): same Consent Mode default as the marketing
      // site (vite.config.js). Google Tag Manager itself is NOT in the head: the
      // shared /consent.js loads it only after the visitor accepts, so no request
      // reaches Google before consent. Don't add the preset's googleTagManager option.
      {
        tagName: 'script',
        attributes: {},
        innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
var c;try{c=localStorage.getItem('elchi-consent');}catch(e){}var g=c==='granted'?'granted':'denied';
gtag('consent','default',{ad_storage:g,ad_user_data:g,ad_personalization:g,analytics_storage:g,functionality_storage:g,personalization_storage:g,security_storage:'granted'});`,
      },
      // Banner + Crisp live chat. Served by the marketing site at the origin
      // root (public/consent.js), so it is absent under `npm start` here.
      {tagName: 'script', attributes: {src: '/consent.js', defer: 'true'}},
    ],

    future: {
      v4: true,
      faster: true,
    },

    i18n: {defaultLocale: 'en', locales: ['en']},

    // .md files parse as CommonMark (curly braces / angle brackets in prose and
    // shell snippets stay literal); .mdx files opt into MDX when they need
    // components. Keeps bulk-converted content robust.
    markdown: {format: 'detect', mermaid: true},

    clientModules: [require.resolve('./src/js/archive-versions.js')],

    presets: [
      [
        'classic',
        {
          docs: {
            // Docs-only mode: docs are the site root (final URLs /docs/<area>/<page>).
            routeBasePath: '/',
            sidebarPath: './sidebars.ts',
            editUrl: 'https://github.com/CloudNativeWorks/elchi-website/edit/main/docs-site/',
            // visible "Last updated" date (from git; CI checks out full history)
            showLastUpdateTime: true,
          },
          // Blog at /docs/blog (BlogPosting JSON-LD is built in). Authors are the
          // team, never invented people: blog/authors.yml. Tags are a closed list.
          blog: {
            path: 'blog',
            routeBasePath: 'blog',
            blogTitle: 'Elchi Blog: Envoy Control Plane Engineering',
            blogDescription:
              'Engineering notes from the team that builds Elchi: Envoy control planes, xDS, running Envoy on VMs, and WAF/API security with ext_proc.',
            blogSidebarTitle: 'Recent posts',
            blogSidebarCount: 'ALL',
            postsPerPage: 10,
            showReadingTime: true,
            authorsMapPath: 'authors.yml',
            tags: 'tags.yml',
            onInlineTags: 'throw',
            onInlineAuthors: 'throw',
            onUntruncatedBlogPosts: 'throw',
            showLastUpdateTime: true,
            feedOptions: {
              type: ['rss', 'atom'],
              title: 'Elchi Blog',
              description: 'Engineering notes on Envoy control planes, xDS and API security.',
              copyright: `© ${new Date().getFullYear()} CloudNativeWorks`,
            },
          },
          pages: false,
          theme: {customCss: './src/css/custom.css'},
          // lastmod from git: search engines and the CI IndexNow ping see real change dates.
          // changefreq/priority carry no information (Google ignores them): omitted.
          // Tag listings, the search page, the blog archive and the auto-generated
          // /category/* index pages are link lists with no content of their own;
          // keep them out so the sitemap lists only pages worth indexing. (Tag pages
          // and the archive are also noindex: src/theme/*Tags*Page, BlogArchivePage.)
          sitemap: {
            changefreq: null,
            priority: null,
            lastmod: 'date',
            ignorePatterns: [
              '/docs/tags/**',
              '/docs/search',
              '/docs/category/**',
              '/docs/blog/tags/**',
              '/docs/blog/archive',
              '/docs/blog/authors/**',
            ],
          },
        } satisfies Preset.Options,
      ],
    ],

    plugins: [
      [
        '@docusaurus/plugin-client-redirects',
        {
          // GSLB was promoted from "Traffic & Certificates" to a top-level
          // product category; keep the old URLs working.
          createRedirects(existingPath: string) {
            if (existingPath.startsWith('/gslb')) {
              return [`/traffic-and-certificates${existingPath}`];
            }
            return undefined;
          },
          // The separate (WASM) WAF is gone: the WAF is Shield's Coraza engine.
          redirects: [
            {
              to: '/shield/engines/coraza-waf',
              from: [
                ...['', '/overview', '/waf-studio', '/crs-library', '/building-config', '/versioning-restore']
                  .flatMap((p) => [`/waf${p}`, `/traffic-and-certificates/waf${p}`]),
                '/tutorials/waf-plus-shield',
                '/installation/client/waf-versions',
              ],
            },
            // Old URLs Google still crawls (Search Console reported them as 404).
            {to: '/category/api-security-shield', from: '/category/shield-api-security'},
            {to: '/envoy-configuration/versions-and-upgrades', from: '/reference/envoy-versions'},
            {to: '/installation/bare-metal/port-atlas', from: '/reference/ports'},
            {to: '/getting-started/concepts', from: '/reference/glossary'},
            // Stub pages merged into their parent overview (thin-content cleanup).
            {to: '/installation/client/overview', from: ['/installation/client/supported-os', '/installation/client/download']},
            {to: '/installation/discovery-agent/overview', from: '/installation/discovery-agent/prerequisites'},
          ],
        },
      ],
    ],

    themes: [
      [
        '@easyops-cn/docusaurus-search-local',
        {
          hashed: true,
          docsRouteBasePath: '/',
          indexBlog: true,
          blogRouteBasePath: '/blog',
          highlightSearchTermsOnTargetPage: true,
        },
      ],
      '@docusaurus/theme-mermaid',
    ],

    themeConfig: {
      // Social card for every docs page (og:image / twitter:image), 1200×630.
      image: 'img/og-docs.png',
      colorMode: {defaultMode: 'light', respectPrefersColorScheme: true},
      navbar: {
        // width/height = the SVG's 174×64 viewBox at the 32px navbar height (no layout shift).
        logo: {
          alt: 'Elchi',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
          href: 'https://www.elchi.io/',
          target: '_self',
          width: 87,
          height: 32,
        },
        // Marketing-site links use full https://www.elchi.io URLs (an `href`), so
        // the /docs/ baseUrl is never prefixed. All items also render in the
        // mobile drawer, CTAs included.
        items: [
          {href: 'https://www.elchi.io/', label: 'Home', position: 'left', target: '_self'},
          {href: 'https://www.elchi.io/features.html', label: 'Features', position: 'left', target: '_self'},
          {href: 'https://www.elchi.io/architecture.html', label: 'Architecture', position: 'left', target: '_self'},
          {href: 'https://www.elchi.io/plans.html', label: 'Plans', position: 'left', target: '_self'},
          {to: '/blog', label: 'Blog', position: 'left'},
          {href: 'https://www.elchi.io/contact.html', label: 'Contact', position: 'left', target: '_self'},
          {type: 'html', position: 'right', value: versionBadgesHtml},
          // When a second locale is enabled,
          // add the language switcher here:
          //   {type: 'localeDropdown', position: 'right'},
          {href: 'https://github.com/orgs/CloudNativeWorks/repositories', label: 'GitHub', position: 'right'},
          {
            href: 'https://www.elchi.io/contact.html',
            label: 'Book a demo',
            position: 'right',
            target: '_self',
            className: 'navbar-contact-btn',
          },
          {to: '/getting-started/quickstart', label: 'Get Started →', position: 'right', className: 'navbar-demo-btn'},
        ],
      },
      footer: {
        style: 'light',
        links: [
          {
            title: 'Product',
            items: [
              {label: 'Home', href: 'https://www.elchi.io/'},
              {label: 'Features', href: 'https://www.elchi.io/features.html'},
              {label: 'Architecture', href: 'https://www.elchi.io/architecture.html'},
              {label: 'Plans & licensing', href: 'https://www.elchi.io/plans.html'},
              {label: 'Book a demo', href: 'https://www.elchi.io/contact.html'},
            ],
          },
          {
            title: 'Documentation',
            items: [
              {label: 'Getting Started', to: '/getting-started/introduction'},
              {label: 'Installation', to: '/installation/helm-platform/overview'},
              {label: 'How-to guides', to: '/category/how-to-guides'},
              {label: 'Automation API', to: '/automation-api/overview'},
              {label: 'Troubleshooting', to: '/troubleshooting/common-issues'},
              {label: 'Blog', to: '/blog'},
            ],
          },
          {
            title: 'Community',
            items: [
              {label: 'GitHub', href: 'https://github.com/orgs/CloudNativeWorks/repositories'},
              {label: 'Releases', href: 'https://github.com/CloudNativeWorks/elchi-archive/releases'},
            ],
          },
          {
            title: 'Company',
            items: [
              {label: 'About', href: 'https://www.elchi.io/about.html'},
              {label: 'Contact', href: 'https://www.elchi.io/contact.html'},
              {label: 'Privacy', href: 'https://www.elchi.io/privacy.html'},
              {html: '<a class="footer__link-item" href="#cookie-preferences">Cookie preferences</a>'},
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} CloudNativeWorks. Maintained by the Elchi engineering team at CloudNativeWorks. All rights reserved.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.vsDark,
        additionalLanguages: ['bash', 'yaml', 'json', 'ini', 'docker', 'nginx', 'promql'],
      },
    } satisfies Preset.ThemeConfig,

    customFields: {uiVersion, backendVersion},
  };
}
