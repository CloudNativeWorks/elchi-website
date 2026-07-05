// Marketing-site i18n helpers.
// The site ships static pages at the root (English) and under /tr/ (Turkish).
// Locale is derived from the URL path so each page is a distinct, SEO-indexable URL
// (mirrors the docs' /docs/ vs /docs/tr/ split). No router, no client-side toggle.

export const LOCALES = ['en', 'tr'];

export function getLocale() {
  if (typeof location !== 'undefined' && location.pathname.startsWith('/tr')) return 'tr';
  return 'en';
}

// Locale-aware link to a marketing page. `page` is 'home' | 'features' | 'architecture'
// (optionally with a #hash, e.g. 'home#screenshots'). Returns an absolute path so it
// resolves correctly from both / and /tr/ pages.
export function locHref(page, locale = getLocale()) {
  const base = locale === 'tr' ? '/tr/' : '/';
  if (page === 'home' || page === 'home#screenshots') {
    return page === 'home' ? base : base + '#screenshots';
  }
  return base + page + '.html';
}

// The same page in the other locale — for the language switcher.
export function otherLocaleHref(activePage, locale = getLocale()) {
  const other = locale === 'tr' ? 'en' : 'tr';
  const page = activePage === 'home' ? 'home' : activePage;
  return locHref(page, other);
}
