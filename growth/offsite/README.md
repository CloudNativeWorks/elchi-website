# Off-site presence: drafts and checklist

Prepared 2026-11-09. **Drafts only.** No PRs, issues, posts or sign-ups were made, and no other repository was edited.
The user submits everything personally.

Goal: Elchi barely exists as an entity outside elchi.io. For "Envoy control plane UI", AI answers find only a stale
awesome.ecosyste.ms record of `github.com/cloudnativeworks/elchi` (0 stars, last synced 2026-05-11). That repo is now
private, so the link 404s. The work below creates consistent, crawlable, third-party mentions that all point to
the same name, description and URL.

## Blockers found (read before submitting anything)

1. **Every product repo is private.** `gh api orgs/CloudNativeWorks/repos` (2026-11-09): `elchi`, `elchi-backend`,
   `elchi-client`, `elchi-shield`, `elchi-collector`, `elchi-helm`, `elchi-os` are **private**. Public: `elchi-archive`,
   `elchi-proto`, `versioned-go-control-plane`, `elchi-website` (all 0 stars).
   - Blocks: `rootsongjc/awesome-cloud-native` (needs an OSI-licensed public repo), awesome-selfhosted/sysadmin (FOSS
     only), the `oss` tag on awesome-devops, the CNCF Landscape open-source path (also needs 300 stars), and an "Open
     Source" label on AlternativeTo/Product Hunt.
   - Hurts: KubeCon CFP ("closed-source technologies are almost always rejected"), Show HN and r/selfhosted reception.
   - PRODUCT.md says "Source is Apache-2.0 licensed". The public site itself makes no open-source claim (checked by
     grep), so nothing on the site is wrong today. But no listing may say "open source" until the code is public.
   - **Decision for the user:** making `CloudNativeWorks/elchi` public (it already has an Apache-2.0 LICENSE, topics and
     homepage set, per the ecosyste.ms record) is the single biggest unblocker. Until then, everything here is written
     as a closed-source/freemium product.
2. **ArtifactHub `repositoryID` mismatch** blocks the Verified Publisher badge (file `6af4e7d9…` vs live `c32bd54b…`).
   The listed license is also wrong (MIT vs the repo's Apache-2.0), and the source links point at a private repo (404).
   Details and patch: `03-artifacthub.md`.
3. **Crunchbase organization unverified.** The CNCF Landscape PR checklist requires correct Crunchbase data. I could not
   confirm whether a CloudNativeWorks/Profelis org exists (Crunchbase blocks automated reads). Decide which entity
   "controls the software" and create or verify it.
4. **The public `elchi-archive` repo is bare:** no description, homepage, topics, README or license. Every listing that
   links to "Releases" sends people there.
5. **KubeCon EU 2027 CFP already closed** (11 Oct 2026). The next realistic CFP is NA 2027 (expected spring 2027) or
   EU 2027 co-located events. Check those today.

## Prerequisite fixes (low effort, do first; GitHub settings, not submissions)

- [ ] `CloudNativeWorks/elchi-archive`: set description ("Elchi release binaries and installers: control plane, edge client, Shield, Elchi OS"), homepage `https://www.elchi.io`, topics (`envoy`, `envoy-proxy`, `xds`, `control-plane`, `api-gateway`, `waf`), a short README linking docs/quickstart, and a LICENSE if one applies.
- [ ] `CloudNativeWorks/elchi-website`: description + homepage + topics.
- [ ] GitHub org profile: add a `CloudNativeWorks/.github` repo with `profile/README.md` describing Elchi, and pin the public repos. The org page is what `sameAs: https://github.com/CloudNativeWorks` on elchi.io points to.
- [ ] One canonical description everywhere (use the short description in `05-product-directories.md`).

## Prioritized checklist

Impact = how much it builds Elchi as a recognizable, citable entity for search engines and AI answers. Effort is the user's time.

| # | Target | File | Effort | Requirement / eligibility | Eligible now? | Status |
|---|---|---|---|---|---|---|
| 1 | **ArtifactHub metadata fix** (Verified Publisher, license, links, images, screenshots) | `03-artifacthub.md` | S (30 min + chart release) | Patch `elchi-helm`, release a new chart version; repositoryID must match the control panel | Yes | not submitted |
| 2 | **CNCF Landscape** (Orchestration & Management / API Gateway) | `02-cncf-landscape.md` | M (1–2 h incl. Crunchbase) | Closed-source path: clear product page, SVG logo in `hosted_logos`, Crunchbase org; one box only | Yes, once Crunchbase exists | not submitted |
| 3 | **Bing Webmaster Tools** (import from GSC, sitemaps, AI Performance baseline) | `06-bing-webmaster-indexnow.md` | S (15 min) | Microsoft account + Google account with GSC access | Yes | not done |
| 4 | **Article (a)**: Envoy fleet without hand-written xDS (dev.to + Medium, canonical to elchi.io) | `04a-article-envoy-fleet-without-xds.md` | S–M | dev.to/Medium accounts; set canonical | Yes | not published |
| 5 | **Article (b)**: OWASP CRS WAF on Envoy via ext_proc | `04b-article-owasp-crs-waf-envoy-ext-proc.md` | S–M | same | Yes | not published |
| 6 | **awesome-devops** (API Gateway section) | `01-awesome-lists.md` §1 | XS | Website domain at least 6 months old (elchi.io: 2024-06-12); tags `free` `paid` `self-hosted` | Yes | not submitted |
| 7 | **G2** profile | `05-product-directories.md` | S | Request listing → research approval → claim | Yes | not submitted |
| 8 | **AlternativeTo** | `05-product-directories.md` | XS | Account; moderated; license = Freemium/Proprietary for now | Yes | not submitted |
| 9 | **Capterra / GetApp / Software Advice** | `05-product-directories.md` | S | Gartner Digital Markets vendor portal | Yes (verify in portal) | not submitted |
| 10 | **Reddit weekly threads** (r/kubernetes, r/devops) + Envoy/CNCF Slack participation | `07-where-engineers-talk.md` | XS each, ongoing | Weekly self-promo threads only; disclose affiliation | Yes | not posted |
| 11 | **Product Hunt** launch | `05-product-directories.md` | L (launch day presence) | Do after #1, prerequisites and ideally a public repo | Possible, better later | not submitted |
| 12 | **Kami-no/awesome-envoy** | `01-awesome-lists.md` §2 | XS | No rules; maintainer inactive since 2020 | Yes (low merge odds) | not submitted |
| 13 | **Show HN** | `07-where-engineers-talk.md` | M | Must be easy to try; best after the repo is public | Better later | not posted |
| 14 | **awesome-cloud-native** | `01-awesome-lists.md` §3 | XS | Public OSI-licensed canonical repo | **No (private repo)** | blocked |
| 15 | **StackShare** | `05-product-directories.md` | XS | Unclear whether new tools can still be added (FOSSA era) | Verify first | not submitted |
| 16 | **KubeCon NA 2027 / EU 2027 co-located CFPs** | `07-where-engineers-talk.md` | L | Vendor-neutral talk; closed source hurts | EU main CFP closed; others TBD | not submitted |

## Files

- `01-awesome-lists.md`: awesome-devops, awesome-envoy, awesome-cloud-native (blocked): exact lines, PR titles and bodies
- `02-cncf-landscape.md`: category choice, YAML entry, logo rules, Crunchbase, PR body with checklist
- `03-artifacthub.md`: audit of the live listing plus a proposed diff for `elchi-helm` (not applied)
- `04a-article-envoy-fleet-without-xds.md`: about 1,350 words plus publishing and canonical notes
- `04b-article-owasp-crs-waf-envoy-ext-proc.md`: about 1,400 words plus publishing and canonical notes
- `05-product-directories.md`: shared copy blocks, Product Hunt, G2, Capterra, AlternativeTo, StackShare
- `06-bing-webmaster-indexnow.md`: Bing Webmaster verification (GSC import), sitemaps, IndexNow check, AI Performance
- `07-where-engineers-talk.md`: subreddits, Slack, mailing lists, Show HN, CFPs with verified dates and promotion rules

## After each submission

- [ ] Update the Status column here (date + URL).
- [ ] Add live third-party profile URLs (G2, AlternativeTo, Crunchbase, ArtifactHub, CNCF Landscape item) to the
      Organization/SoftwareApplication JSON-LD `sameAs` on elchi.io (website repo; coordinate with the SEO work in progress).
- [ ] Re-query AI assistants for "Envoy control plane UI" monthly and note the results, together with Bing's AI Performance report.
