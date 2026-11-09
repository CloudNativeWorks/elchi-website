# Product directories: Product Hunt, G2, Capterra, AlternativeTo, StackShare

Status: **not submitted** on any of them. Copy only. Accounts and sign-ups are the user's job.

Fact base: `PRODUCT.md`, `products-data.js` (EN copy), docs index. Rules that apply to every listing:
- No customers, logos, testimonials, star counts, benchmarks or fleet sizes (none exist to cite).
- Do not call it "open source" while the source repositories are private (see README.md, blockers). Describe the
  **free tier** (one managed edge node without a license) and the **enterprise license** (priced by number of managed
  edge nodes) instead.
- No competitor names in any listing copy. Directory sites will add "alternatives" themselves.
- Use one canonical URL everywhere: `https://www.elchi.io/` (no tracking parameters on directories that check, such as awesome-devops).

## Shared copy blocks (reuse across directories)

**Name:** Elchi
**Company:** CloudNativeWorks (footer: "Built by CloudNativeWorks, powered by Profelis". Pick the legal entity once and use it everywhere: Crunchbase, G2, Capterra.)
**Website:** https://www.elchi.io/ · **Docs:** https://www.elchi.io/docs/ · **Videos:** https://www.youtube.com/@CloudNativeWorks · **Contact/demo:** https://www.elchi.io/contact
**Deployment:** self-hosted (Kubernetes via Helm, Docker Swarm, single VM, bare-metal systemd) plus an edge agent on Linux hosts; Elchi OS appliance image for edges.
**Pricing model:** free tier (one managed edge node); enterprise license scales with the number of managed edge nodes; contact for pricing.

**Tagline (≤60 chars):**
- `Visual control plane for your Envoy proxy fleet` (47)
- Alt: `Manage every Envoy proxy from one control plane` (47)

**Short description (≤160 chars):**
> Elchi is a self-hosted control plane for Envoy fleets: typed xDS editors, validated draft/publish, multi-version Envoy, and an edge agent that runs Envoy.

(155 chars)

**Medium description (~260 chars, Product Hunt-safe):**
> Elchi manages a whole Envoy proxy fleet from one place without hand-written xDS. Editors are generated from Envoy's protobufs, every change is validated twice and published as a unit, and several Envoy versions run side by side. Add-ons: WAF, API discovery, GSLB.

(about 260 chars. Trim the last sentence if a field enforces 260.)

**Long description (~1,200 chars):**
> Elchi is an enterprise control plane for Envoy proxy fleets on VMs and Kubernetes. Instead of hand-written xDS or
> bootstrap files, every Envoy resource (listeners, routes, clusters, endpoints, TLS secrets, filters) is edited in a
> typed form generated from that Envoy version's protobuf definitions. Changes are validated in the editor and again on
> the server, staged as drafts, published together as a new snapshot over ADS without restarting Envoy, and recorded
> in an audit log. Several Envoy versions run side by side, and listeners move to a newer version through a tracked
> upgrade. A lightweight edge agent installs and runs Envoy on Linux hosts and dials out to the controller, so edges
> need no inbound management port.
>
> Add-on products plug into the same control plane: API Security (Shield), an ext_proc sidecar next to each Envoy with
> authentication, rate limiting, bot defense, DLP and a built-in OWASP Core Rule Set WAF, rolled out per route from
> detect to block; API Discovery, a risk-scored API inventory built from Envoy access logs; and GSLB, CoreDNS-based
> authoritative DNS driven by health checks.
>
> Install it on Kubernetes with Helm, on Docker Swarm, on a single VM or on bare metal. The free tier manages one edge
> node without a license.

**Feature bullets (pick 5–10 per site):**
- Typed editors for every Envoy resource, generated from Envoy's protobuf definitions
- Full xDS: ADS, LDS, RDS, CDS, EDS, VHDS, with delta xDS
- Two-step validation (editor and server) before anything is stored or pushed
- Draft → save → publish workflow with an audit log
- Several Envoy versions side by side, with tracked listener upgrades (hot restart, no traffic interruption)
- Snapshot Dump: read back the exact xDS snapshot a node is being served
- Dependency graph and route map for resource references
- Scenario wizard, templates and snippets for common multi-resource setups
- Edge agent: installs and supervises Envoy as systemd services, BGP/FRR, log shipping
- Projects, RBAC (Owner/Admin/Editor/Viewer), LDAP/Active Directory, 2FA
- ACME certificates (DNS-01)
- Public automation API with project tokens (endpoint disable, blue/green cluster endpoint switch)
- Add-on: Shield API security: JWT/JWKS, API keys, HMAC signing, mTLS, rate limiting, bot defense, IP reputation/GeoIP, DLP, OWASP CRS WAF, GraphQL and OpenAPI validation
- Add-on: API Discovery: traffic-derived inventory, auth coverage, PII detection, risk flags, drift, OpenAPI export, one-click Shield policy draft
- Add-on: GSLB: CoreDNS-based authoritative DNS with distributed health checks and failover

**Screenshots** (from `public/shots/`, light variants, all live at `https://www.elchi.io/shots/…`):
`dashboard`, `listener`, `dependency`, `live-traffic`, `services`, `clients`, `api-discovery`, `gslb`, `audit`.
**Video:** launch film and explainer on the YouTube channel; the 1:04 brand film `public/videos/sale-night.mp4`
(its host IPs and paths are illustrative, so do not present it as a real incident).

---

## Product Hunt

Format researched (third-party guides plus PH's own launch guide, 2026): tagline max **60 chars**; description is
reported as **260 chars** in the help article (500 in some guides), so write to 260. A first "maker comment" is
strongly recommended (PH's launch guide: most Product of the Day winners had one). Launches go live at 12:01 AM PT.
Gallery: at least 2 images; 1270×760 is the common recommendation. Thumbnail 240×240.
Verify the current limits in the submission form before launch day.

**Fit warning:** PH's audience skews toward consumer and SaaS products. A self-hosted infrastructure tool can still do
well if the maker is present all day and the copy is concrete. Launch **after** the GitHub/ArtifactHub fixes, so the
links people click are not 404s.

- **Name:** Elchi
- **Tagline:** Visual control plane for your Envoy proxy fleet
- **Description (≤260):** use the medium description above.
- **Topics:** Developer Tools, DevOps, Open Source *(only if the repos are public by then; otherwise drop it)*, Security, SaaS *(no: it is self-hosted)*. Pick: **Developer Tools, DevOps, Security, Kubernetes** (if offered).
- **Pricing:** Free options (free tier: one managed edge node) / paid.
- **Links:** https://www.elchi.io/ , docs, YouTube.
- **Gallery order:** 1) dashboard, 2) listener editor, 3) dependency graph, 4) live traffic, 5) Shield/security events or API Discovery, 6) the launch video (YouTube link).

**Maker comment (first comment):**

```text
Hi Product Hunt! I'm part of the team behind Elchi.

We built it because running Envoy beyond a handful of proxies means building a
control plane: modeling resources and their references, validating before you
push, staging changes, serving several Envoy versions during upgrades, and
checking what each proxy actually received.

Elchi does that from one UI:
• Editors generated from Envoy's protobufs, per Envoy version
• Validation in the editor and on the server, then draft → publish over xDS, no restarts
• Several Envoy versions side by side, with tracked listener upgrades
• An edge agent that installs and runs Envoy on Linux hosts
• Add-ons for API security (ext_proc sidecar with the OWASP Core Rule Set), API discovery and GSLB

It's self-hosted (Helm, Docker Swarm, single VM or bare metal). The free tier
manages one edge node, enough to try the full workflow: https://www.elchi.io/docs/

I'd love feedback from anyone running Envoy today — what's the most painful part
of your config workflow?
```

---

## G2

How it works (G2 docs, "Finding or listing a product on G2"): search first so you don't create a duplicate. If the
product isn't listed, request it. After G2's research team approves the profile, **claim** it to edit (free). One
listing per product.

- **Product name:** Elchi
- **Vendor:** CloudNativeWorks
- **Categories (choose in G2's taxonomy; verify exact names in the form):** primary **API Management**; secondary
  **Web Application Firewall (WAF)** (for the Shield add-on) and **Load Balancing**. Avoid "Service Mesh" (it
  misdescribes the product).
- **Product description:** long description above.
- **Short description / tagline:** short description above.
- **Features list:** feature bullets above.
- **Deployment:** On-premise / self-hosted; Linux; Kubernetes.
- **Pricing:** Free tier (1 managed edge node). Enterprise: contact sales (licensed per managed edge node).
- **Media:** 5 screenshots + YouTube explainer.
- **Do not** offer gift cards or incentives for reviews without following G2's review incentive rules. Ask real users only.

## Capterra (Gartner Digital Markets: Capterra, GetApp, Software Advice)

Listing happens through the Gartner Digital Markets **vendor portal** (free basic listing; check eligibility in the
portal). One free listing syndicates to all three sites. I could not reach an official requirements page, so verify in
the portal.

- **Categories:** API Management Software; Network Management Software; Web Application Firewall (if offered).
- **Description:** long description (Capterra truncates; lead with the first two sentences).
- **Target market (who uses it):** "Platform, SRE and DevOps teams that run Envoy proxies on VMs and Kubernetes."
- **Deployment:** Installed / on-premise, Linux. Not cloud/SaaS.
- **Pricing:** Free version available; "Contact vendor" for enterprise.
- **Support:** documentation, videos, email (`info@profelis.com.tr`, per PRODUCT.md; confirm this is the address you want public).
- **Features:** pick from their checklist based on the feature bullets above. Do not tick features the product lacks.

## AlternativeTo

Rules (official FAQ, via search; the form needs sign-in): developers may add their own software with "Suggest new
application" from the user menu. Submissions are moderated before going live. After approval you can request
developer access to keep the page updated. A paid "priority review" exists, but it is optional.

- **Name:** Elchi
- **Short description:** short description above.
- **Description:** long description above (first paragraph plus the add-on sentence).
- **Platforms:** Self-Hosted, Linux, Kubernetes (if offered).
- **License:** **Freemium / Proprietary** while the source is private. Switch to Open Source (Apache-2.0) only when the
  repo is public.
- **Tags:** envoy, envoy-proxy, xds, control-plane, api-gateway, load-balancer, reverse-proxy, waf, api-security, api-discovery, gslb, kubernetes, devops
- **"Alternative to":** add it as an alternative to the Envoy-based control planes and gateways users already search
  for. AlternativeTo users pick these, and naming competitors here is the site's mechanic, not our copy. Choose them
  in the form; do not put them in the description.
- **Links:** website, docs, YouTube.
- **Screenshots:** 3–5 from the list above.

## StackShare

Status uncertain: FOSSA acquired StackShare in 2024 and sunset StackShare **Enterprise**, keeping the free community
site. 2026 secondary sources describe it as a mostly static archive, and stackshare.io returned HTTP 429 to my check.
**Verify that new tools can still be added before spending time here.** Lowest priority.

If adding works:
- **Tool name:** Elchi · **Category:** Application and Data → Load Balancer / Reverse Proxy (or "API Tools")
- **Tagline:** Visual control plane for your Envoy proxy fleet
- **Description:** short description above
- **Website:** https://www.elchi.io/ · **Docs:** https://www.elchi.io/docs/
- **Integrations to link:** Envoy, Kubernetes, Helm, MongoDB, ClickHouse, VictoriaMetrics, Grafana, OpenTelemetry, CoreDNS

## Post-listing checklist

- [ ] Same name, tagline, company and URL on every directory (entity consistency is what search engines and LLMs pick up).
- [ ] Add each live listing URL to the site's Organization JSON-LD `sameAs` (website repo; coordinate with whoever owns the SEO work).
- [ ] Re-check listings every quarter after releases. Directories that show stale screenshots hurt more than they help.
