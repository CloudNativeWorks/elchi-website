# Bing Webmaster Tools + IndexNow

Status: **not done**. These steps need the user's Microsoft and Google accounts.

Scope: IndexNow (key file and CI ping) is being implemented in the website repo by the caller. This file covers only
the account-side steps. Current state observed on 2026-11-09:

- Google Search Console is verified through the HTML file `public/google40e705b3b6becf97.html`.
- `public/2495e897fc8278a147b89e6d790e8689.txt` exists and contains its own name: the IndexNow key file (in progress).
- `https://www.elchi.io/robots.txt` lists both sitemaps (`/sitemap.xml`, `/docs/sitemap.xml`); both return 200.
- `robots.txt` has `Crawl-delay: 1`. Bing honors `Crawl-delay` (Google ignores it). One second is harmless for a site
  this size, but it is the one directive that slows Bing specifically. Consider removing it, or set the crawl rate in
  Bing Webmaster Tools → Crawl Control instead. This is a website-repo change: the caller's call.
- No `msvalidate.01` meta tag and no `BingSiteAuth.xml`. That is fine if the GSC import is used.

Why it matters for the stated goal: Microsoft Copilot and Bing's AI answers are grounded in the Bing index, and several
other assistants use Bing's web results. A verified site also gets Bing's **AI Performance** report (public preview
since Feb 2026, per third-party coverage), which shows when Copilot and Bing AI answers cite elchi.io pages. It is the
only first-party "are AI answers citing us" data available, so it doubles as the measurement for this whole effort.

## Steps (about 15 minutes)

1. **Sign in** at https://www.bing.com/webmasters with a Microsoft account the company controls (not a personal one,
   since access is shared later through *Settings → User management*).
2. **Add the site by importing from Google Search Console** (fastest, no file or DNS change):
   - On *Add a site*, choose **Import** under "Import your sites from GSC".
   - Sign in with the Google account that has access to the `https://www.elchi.io/` property (or the `elchi.io` domain
     property) and allow the requested permissions.
   - Select the elchi.io property and **Import**. Sitemaps registered in GSC come across too.
   - Caveat: verification stays tied to Google access. If that Google authorization is revoked later, Bing asks for
     re-verification. To make it independent, also add one of the manual methods below.
3. **(Recommended) Add a durable second verification method.** Pick one:
   - **DNS CNAME/TXT** record at the elchi.io DNS provider (survives site rebuilds; best option), or
   - `BingSiteAuth.xml` in `public/` (website repo change: coordinate), or
   - `<meta name="msvalidate.01" content="…">` in every page head (website repo change: coordinate).
4. **Sitemaps:** in *Sitemaps*, confirm both are present. If not, submit both:
   - `https://www.elchi.io/sitemap.xml`
   - `https://www.elchi.io/docs/sitemap.xml`
5. **IndexNow:** after the website change is deployed, open *IndexNow* in Bing Webmaster Tools and confirm submissions
   from the CI ping appear (Bing lists the URLs it received through IndexNow). Spot-check that the key file URL
   `https://www.elchi.io/2495e897fc8278a147b89e6d790e8689.txt` returns the key as plain text.
6. **URL Inspection:** inspect `https://www.elchi.io/`, `/products/core`, `/docs/` and
   `/docs/getting-started/introduction`. Fix anything reported as blocked or "discovered but not crawled".
7. **Site Scan** (*SEO → Site Scan*): run once and review errors (missing titles/descriptions, broken links). The docs
   site is large, so this catches stale internal links.
8. **AI Performance:** bookmark the report and note a baseline date (2026-11) so the off-site work in this folder can be
   measured against it.
9. **Users:** add the second team member under *Settings → User management* so access does not depend on one account.

## Optional, same session

- **Bing Places:** not relevant (no physical storefront).
- **Microsoft Clarity:** not needed for this goal. Skip.
- **Yandex/Seznam/Naver:** they also accept IndexNow. Once the CI ping goes to `api.indexnow.org`, all participating
  engines receive it, so no separate sign-ups are needed.

## Done when

- [ ] Site verified in Bing Webmaster Tools (import plus one durable method)
- [ ] Both sitemaps show "Success" with discovered URL counts
- [ ] IndexNow submissions visible after a deploy
- [ ] AI Performance baseline noted
- [ ] Second admin user added
