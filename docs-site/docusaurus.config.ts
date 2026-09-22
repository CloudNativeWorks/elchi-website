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
        <span class="nav-version-key">UI</span> <span class="nav-version-tag">${uiVersion}</span></a>
      <a class="nav-version" href="https://github.com/CloudNativeWorks/elchi-archive/releases" target="_blank" rel="noopener">
        <span class="nav-version-key">API</span> <span class="nav-version-tag">${backendVersion}</span></a>
    </span>`;

  return {
    title: 'Elchi Documentation',
    tagline: 'Enterprise Envoy management platform',
    url: 'https://www.elchi.io',
    // Served from GH Pages under /docs/ next to the Vite marketing site.
    baseUrl: '/docs/',
    trailingSlash: false,
    onBrokenLinks: 'throw',
    onBrokenAnchors: 'throw',
    favicon: 'img/favicon.ico',

    future: {
      v4: true,
      faster: true,
    },

    i18n: {defaultLocale: 'en', locales: ['en']},

    // .md files parse as CommonMark (curly braces / angle brackets in prose and
    // shell snippets stay literal); .mdx files opt into MDX when they need
    // components. Keeps bulk-converted content robust.
    markdown: {format: 'detect', mermaid: true},

    presets: [
      [
        'classic',
        {
          docs: {
            // Docs-only mode: docs are the site root (final URLs /docs/<area>/<page>).
            routeBasePath: '/',
            sidebarPath: './sidebars.ts',
            editUrl: 'https://github.com/CloudNativeWorks/elchi-website/edit/main/docs-site/',
            showLastUpdateTime: false,
          },
          blog: false,
          pages: false,
          theme: {customCss: './src/css/custom.css'},
          sitemap: {changefreq: 'weekly'},
          googleTagManager: {containerId: 'GTM-5G5WC537'},
        } satisfies Preset.Options,
      ],
    ],

    plugins: [
      [
        '@docusaurus/plugin-client-redirects',
        {
          // GSLB and WAF were promoted from "Traffic & Certificates" to
          // top-level product categories; keep the old URLs working.
          createRedirects(existingPath: string) {
            if (existingPath.startsWith('/gslb') || existingPath.startsWith('/waf')) {
              return [`/traffic-and-certificates${existingPath}`];
            }
            return undefined;
          },
        },
      ],
    ],

    themes: [
      [
        '@easyops-cn/docusaurus-search-local',
        {
          hashed: true,
          docsRouteBasePath: '/',
          indexBlog: false,
          highlightSearchTermsOnTargetPage: true,
        },
      ],
      '@docusaurus/theme-mermaid',
    ],

    themeConfig: {
      colorMode: {defaultMode: 'light', respectPrefersColorScheme: true},
      navbar: {
        logo: {alt: 'Elchi', src: 'img/logo.png', href: 'https://www.elchi.io/', target: '_self'},
        items: [
          {href: 'https://www.elchi.io/', label: 'Home', position: 'left', target: '_self'},
          {href: 'https://www.elchi.io/features.html', label: 'Features', position: 'left', target: '_self'},
          {href: 'https://www.elchi.io/architecture.html', label: 'Architecture', position: 'left', target: '_self'},
          {type: 'html', position: 'right', value: versionBadgesHtml},
          // When a second locale is enabled (see docs/contributing/translating.md),
          // add the language switcher here:
          //   {type: 'localeDropdown', position: 'right'},
          {href: 'https://github.com/orgs/CloudNativeWorks/repositories', label: 'GitHub', position: 'right'},
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
            ],
          },
          {
            title: 'Documentation',
            items: [
              {label: 'Getting Started', to: '/getting-started/introduction'},
              {label: 'Installation', to: '/installation/helm-platform/overview'},
              {label: 'Troubleshooting', to: '/troubleshooting/common-issues'},
            ],
          },
          {
            title: 'Community',
            items: [
              {label: 'GitHub', href: 'https://github.com/orgs/CloudNativeWorks/repositories'},
              {label: 'Releases', href: 'https://github.com/CloudNativeWorks/elchi-archive/releases'},
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} CloudNativeWorks. All rights reserved.`,
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
