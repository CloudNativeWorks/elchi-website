# CNCF Landscape (cncf/landscape)

Status: **not submitted**. Drafts only.

Sources read on 2026-11-09:
- `cncf/landscape` README, "New entries" section
- `cncf/landscape/.github/PULL_REQUEST_TEMPLATE.md`
- `cncf/landscape/landscape.yml` (master, 20,885 lines)
- `cncf/landscape2/docs/config/data.yml` (field reference for `extra`)

## Rules that apply to Elchi

From the README and PR template, verbatim where quoted:

- "Cloud native projects with **at least 300 GitHub stars** that clearly fit in an existing category are generally included."
- PR checklist: "Are you only including a `repo_url` if your project is **100% open source**?" and "Is your project **closed source** or, if it is open source, does your project have at least 300 GitHub stars?"
- "**Closed source products need to link to a clear description of your product**; no stealth mode companies."
- "We generally will only list a company's product in **one box**", meaning a single category.
- "Crunchbase organization should be the company or organization that controls the software."
- PR checklist: "Have you verified that the Crunchbase data for your organization is correct (including headquarters and LinkedIn)?"
- Logo: "must be added to the `hosted_logos` directory (in SVG format)". "Logos must include the company, product or project name in English." "Don't use reversed logos (i.e. with a non-white, non-transparent background color)." "When multiple variants exist, use stacked (not horizontal) logos." Also: "Does your project/product name match the text on the logo?"
- Removal: closed-source items that stop posting publicly get pruned. A mirrored older README says closed-source products are removed "when they have not tweeted in over 3 months". The current README no longer says this, but keep posting regularly anyway.

### What this means for Elchi

- **Public repos are 0 stars and the main repos are private.** Elchi cannot enter on the open-source path (300 stars). It *can* enter as a **closed-source product**: no `repo_url`, homepage `https://www.elchi.io/`, which describes the product clearly.
  - Do **not** add `repo_url` (pointing at a private or 404 repo fails the "100% open source" check and the build's GitHub data fetch).
  - Do not describe it as open source in the description while the source is private.
- **Crunchbase:** a `crunchbase:` URL is effectively expected (about 90% of the 2,441 items have one) and the PR checklist asks for it. I could not verify a CloudNativeWorks (or Profelis) Crunchbase organization: crunchbase.com returns 403 to automated requests. **Action for the user:** search Crunchbase for the company that owns the Elchi trademark (CloudNativeWorks or Profelis). If none exists, create one (free) with HQ, website `https://www.elchi.io` and LinkedIn filled in, then put that URL in the entry. Decide which legal entity "controls the software". The site footer says "Built by CloudNativeWorks, powered by Profelis".
- **One box only:** choose the single best subcategory (below).

## Category choice

**`Orchestration & Management` / `API Gateway`.**

Reasoning, based on what is already listed:
- `API Gateway` contains the Envoy control planes, including Envoy Gateway ("the control plane for dynamically managing Envoy Proxy") and several Envoy-based gateways. Elchi is a control plane that manages Envoy fleets, so it sits next to them. That is the comparison a reviewer will make.
- `Service Proxy` holds data planes (Envoy itself, HAProxy, NGINX, Caddy). Elchi is not a proxy.
- `Service Mesh` would misdescribe it (Elchi does not inject sidecars into workloads).
- Do not add `second_path` (for example to `Provisioning / Security & Compliance` for Shield). The README says one box per company product, and asking for exceptions slows review.

TAG: `network` (set explicitly in `extra.tag` so automatic detection does not guess).

## Logo

Use `public/logo.svg` from this repo (viewBox `0 0 174 64`). It is the ELCHI wordmark drawn as paths:
- dark strokes (`#1d1d1f`) plus blue/grey accents on a **transparent** background, so it is not reversed and is valid;
- the name "ELCHI" is the logo itself, so the "name in English" and "name matches logo" rules hold;
- no `<text>`, `<image>`, `<style>` or `<script>` elements (checked with grep), which suits landscape2 rendering;
- it is a single wordmark, so the "stacked vs horizontal" rule does not apply.

Do **not** use `public/logo-light.svg` (made for dark backgrounds). Copy the file to
`hosted_logos/elchi.svg` in the fork. Optional tidy-up before submitting: run it through
SVGO, and confirm the wordmark has a little padding inside the viewBox (landscape crops tightly).

## The YAML entry

Insert it in `landscape.yml` under `Orchestration & Management` → `API Gateway` → `items:`,
**alphabetically**: after `Easegress`, before `Emissary-Ingress`.

```yaml
          - item:
            name: Elchi
            description: >-
              Control plane and web UI for Envoy proxy fleets. Typed xDS editors generated from each Envoy version's
              protobuf definitions, two-step validation, draft/save/publish with an audit log, several Envoy versions
              served side by side, and an edge agent that installs and runs Envoy on Linux hosts. Add-ons: API security
              (an ext_proc WAF sidecar with the OWASP Core Rule Set), traffic-derived API discovery and GSLB.
            homepage_url: https://www.elchi.io/
            logo: elchi.svg
            crunchbase: https://www.crunchbase.com/organization/REPLACE-ME   # must exist and be correct before the PR
            extra:
              documentation_url: https://www.elchi.io/docs/
              youtube_url: https://www.youtube.com/@CloudNativeWorks
              package_manager_url: https://artifacthub.io/packages/helm/elchi/elchi-stack
              summary_personas: Platform Engineers, SREs, DevOps Engineers, Network Engineers
              summary_tags: envoy, xds, control plane, api gateway, waf, api discovery, gslb
              summary_use_case: >-
                Operate a fleet of Envoy proxies on VMs and Kubernetes from one control plane instead of hand-written
                xDS or bootstrap files. Listeners, routes, clusters, endpoints and secrets are edited as typed resources,
                validated in the editor and on the server, and pushed to Envoy over ADS without a restart.
              summary_integrations: Envoy, Kubernetes, Helm, MongoDB, ClickHouse, VictoriaMetrics, OpenTelemetry, Grafana, CoreDNS, OWASP Core Rule Set
              tag: network
```

Notes on fields:
- No `repo_url`, `license` or `project`, because the source is not public. When `CloudNativeWorks/elchi` becomes public **and** has 300+ stars, open a follow-up PR that adds `repo_url` (and `license: Apache-2.0`).
- `summary_release_rate` was left out on purpose: there is no fixed cadence to state truthfully.
- `twitter` / `linkedin_url` / `slack_url`: add them only if official accounts exist (none are listed on the site today). An active X/Bluesky/LinkedIn account helps the item survive the closed-source pruning.
- Check `package_manager_url` against ArtifactHub after the fixes in `03-artifacthub.md`.

## PR

**Title:** `Add Elchi to Orchestration & Management / API Gateway`

**Body** (the repo's PR template, filled in):

```markdown
Adds **Elchi** (https://www.elchi.io/), a control plane and web UI for Envoy proxy
fleets, to Orchestration & Management / API Gateway.

Elchi serves xDS (ADS) to Envoy proxies on VMs and Kubernetes. Its editors are
generated from each Envoy version's protobuf definitions; changes are validated
in the editor and on the server, kept as drafts, and published as a new snapshot
without restarting Envoy. Several Envoy versions are served side by side. An edge
agent installs and runs Envoy on Linux hosts. Product description:
https://www.elchi.io/products/core — docs: https://www.elchi.io/docs/

Category: it sits next to the other Envoy control planes already listed under
API Gateway; it is not a proxy (Service Proxy) and not a sidecar mesh.

### Pre-submission checklist:

* [x] Are you only including a `repo_url` if your project is 100% open source? — No `repo_url`: the product is listed as closed source.
* [x] Is your project closed source or, if it is open source, does your project have at least 300 GitHub stars? — Closed source; links to a clear product description.
* [x] Have you picked the single best (existing) category for your project?
* [x] Does it follow the other guidelines from the new entries section?
* [x] Have you added your SVG to `hosted_logos` and referenced it there? — `hosted_logos/elchi.svg`
* [x] Does your logo clearly state the name of the project/product and follow the other guidelines? — Wordmark "ELCHI", transparent background.
* [x] Does your project/product name match the text on the logo?
* [x] Have you verified that the Crunchbase data for your organization is correct (including headquarters and LinkedIn)?

Disclosure: I work on Elchi.
```

## Blockers checklist before opening the PR

- [ ] Crunchbase organization exists and is correct (HQ, LinkedIn, website). **Hard requirement in practice.**
- [ ] Decide the "controls the software" entity (CloudNativeWorks vs Profelis) and use it consistently on Crunchbase, the site footer and ArtifactHub.
- [ ] Decide how the source license is described. PRODUCT.md and the site say Apache-2.0, but the repos are private. Listing as closed source is the only accurate option today.
- [ ] Optional but helpful: an official social account that posts at least monthly.
