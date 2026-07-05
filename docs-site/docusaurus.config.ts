import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js at build time — no client-side code here.

// Latest release tags for the navbar version badges — fetched once at build time,
// mirroring the vite `define` globals used by the marketing site's nav.
async function latestTag(repo: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'elchi-website-build',
        ...(process.env.GITHUB_TOKEN ? {Authorization: `Bearer ${process.env.GITHUB_TOKEN}`} : {}),
      },
    });
    if (!res.ok) return 'unknown';
    const json = (await res.json()) as {tag_name?: string};
    return json.tag_name ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export default async function createConfig(): Promise<Config> {
  const [uiVersion, backendVersion] = await Promise.all([
    latestTag('CloudNativeWorks/elchi'),
    latestTag('CloudNativeWorks/elchi-backend'),
  ]);

  const versionBadgesHtml = `
    <span class="nav-versions">
      <a class="nav-version" href="https://github.com/CloudNativeWorks/elchi/releases" target="_blank" rel="noopener">
        <span class="nav-version-key">UI</span> <span class="nav-version-tag">${uiVersion}</span></a>
      <a class="nav-version" href="https://github.com/CloudNativeWorks/elchi-backend/releases" target="_blank" rel="noopener">
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
    markdown: {format: 'detect'},

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
        } satisfies Preset.Options,
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
          {href: 'https://github.com/orgs/CloudNativeWorks/repositories', label: 'GitHub', position: 'right'},
          {href: 'https://demo.elchi.io', label: 'Try Demo →', position: 'right', className: 'navbar-demo-btn'},
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
