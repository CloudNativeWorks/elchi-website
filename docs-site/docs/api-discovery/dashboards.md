---
title: Discovery Dashboards
description: The tabbed dashboards at /api-discovery — listeners, new APIs, auth coverage, bots, PII, zombies, risk, security score, transport, errors, drift, and consumers.
sidebar_position: 2
tags: [api-discovery]
---

The landing page at `/api-discovery` is a strip of tabbed dashboards. The first tab is the **Listeners** catalog; the rest are focused security lenses over the same inventory, each answering one operational question. Every dashboard is scoped to the currently-selected project and reads the live `api_inventory` (with time-series panels backed by the ClickHouse rollups).

:::info[Geo lives on the endpoint, not here]
The dashboard strip has **twelve** tabs (Listeners plus eleven lenses). Country / ASN / city / threat-intel geo insights are presented on the **Insights** tab of an individual endpoint's detail page, and as geo cross-filters in the endpoints view — not as a top-level dashboard. See [Exploring Endpoints](/api-discovery/endpoints).
:::

## Listeners

**Answers:** *What Envoy listeners are serving API traffic, and how healthy is each?*

The home tab. A paginated table of listeners, one row each, with the distinct-endpoint count (normalized paths collapsed to templates), the hostnames served, the union of risk flags seen under the listener, an aggregated HTTP **status distribution** bar (1xx–5xx), and last activity. Header KPIs summarize total listeners, endpoints, and how many carry risk. Click a listener to drill into its [endpoints](/api-discovery/endpoints).

Two panels and a set of admin actions live on this tab:

- **Normalization Gaps panel** — path prefixes that are accumulating many distinct un-normalized child segments (a deployment-specific ID format the built-in detectors missed, bloating the catalog). Admins/Owners get a one-click *"Add normalize rule"* that appends a `path_normalize_patterns` rule to the collector config (applied within ~2 min). See [Path Normalization](/api-discovery/path-normalization).
- **Reset risk scores** (Admin/Owner) — project-wide re-baseline of the monotonic `max_risk_score` / `max_posture_score`; the collector re-accumulates from the next event. Nothing is deleted.
- **Cleanup stale** (Admin/Owner) — bulk-delete endpoints not seen for N days (7–3650, default 90; server-clamped). Endpoints still receiving traffic are recreated on the next request, so this only clears genuinely dead entries.

## New APIs

**Answers:** *What appeared on my surface recently?*

Endpoints whose `first_seen` falls inside a selectable window. This is the shadow-API early-warning: a newly-appeared unauthenticated or PII-bearing endpoint is the thing to look at before an attacker does. Use it as a review queue every time you deploy.

## Auth Coverage

**Answers:** *What is reachable without credentials, and where is auth inconsistent?*

Splits the surface by auth posture: endpoints only ever seen **unauthenticated**, endpoints seen with **inconsistent** auth (some calls with a credential, some without — the `auth_inconsistent` signal, often a bypass path or a mid-rollout misconfig), and the detected **auth schemes** (`jwt` / `mtls` / `apikey` / `none`). The prioritized list is *public endpoints that should not be*. See [PII & Auth Detection](/api-discovery/pii-and-auth).

## Bot / Scanner

**Answers:** *Who is automating against me — and is it a good bot or a scanner?*

Automated and scanner traffic, derived from the collector's User-Agent classifier (`scanner` / `bot` / `monitor` / `sdk` / `cli` / `browser`) and the scanner/probe risk flags (`scanner_user_agent`, `vuln_probe_path`, `path_scan_suspect`). Use it to separate legitimate crawlers and SDKs from active reconnaissance, and to find the source IPs worth an RBAC deny or a rate limit.

## PII

**Answers:** *Which endpoints carry personal data, and of what kind?*

The PII inventory: endpoints where a PII pattern was observed in the path, broken down by category (`email`, `phone`, `ssn`, `credit_card`, `iban`, plus the normalize-driven `secret_in_path` / `jwt_in_path`). The raw values are never stored — only that PII of a given category flowed through this endpoint. It is the GDPR/PCI review list. See [PII & Auth Detection](/api-discovery/pii-and-auth).

## Zombies

**Answers:** *What can I safely retire?*

Two flavours of dead weight: **old** endpoints (not seen in a long time) and **formerly-popular** endpoints (once high-traffic, now quiet). Both are decommission candidates — a stale endpoint that no client uses is pure attack surface. Feed this into the **Cleanup stale** action on the Listeners tab.

## Risk

**Answers:** *What are my worst risks, by class and severity?*

The project-wide risk summary: risk-flag occurrences aggregated **by class** (auth / attack_pattern / transport / data_leak / discovery / behavior / consistency) and **by severity** (Critical / High / Medium / Low), with endpoint counts per flag. It is the top-level triage view; each flag links into the [Risk Flags Reference](/api-discovery/risk-flags-reference) and its remediation. The same data drives the **API Risk Guide** (`/api-discovery/risks`), which adds a consolidated remediation action plan and an OWASP API Top-10 coverage panel.

## Security Score

**Answers:** *What's my one-letter grade, and what moved it?*

An overall **A–F** posture grade for an API surface, computed from the mix of threat and exposure signals, with the contributing factors called out. It is the number to put in front of a stakeholder and to track release-over-release.

## Transport

**Answers:** *How is my TLS posture?*

Connection-layer hygiene across the surface: TLS version distribution, plain-text (`plain_text_transport`) endpoints, weak/legacy TLS (`weak_tls_version`, `legacy_protocol`), and missing security headers (`missing_hsts` and friends). These are the [Exposure-axis](/api-discovery/risk-scoring) flags — standing config you fix once at the listener, not per-request attacks.

## Errors

**Answers:** *Where are my 4xx / 5xx hotspots?*

Endpoints and time windows with elevated client-error (4xx) and server-error (5xx) rates, with time series. A 5xx cluster is usually an outage or a bad deploy; a 4xx cluster from one source cross-references with `path_scan_suspect` / `brute_force_suspect`. Cross-check against the endpoint's Events tab to classify the failures.

## Drift

**Answers:** *What changed against my baseline?*

Field-level diffs of the API surface against baseline snapshots: what **appeared**, what **vanished**, and what **changed** since the last captured baseline. Elchi captures a baseline on a daily cadence (admins can capture one on demand). Drift is how you catch an endpoint silently gaining an unauthenticated code path, a new PII category, or a route that shouldn't exist.

## Consumers

**Answers:** *Who are my top API consumers, and how do they behave?*

Per-identity behaviour, keyed on the hashed `consumer_hash` (JWT `sub` or mTLS peer subject), plus an anonymous bucket for unfingerprinted traffic. For each consumer: the endpoints and methods they touch, their status mix, geo, and risk. It is how you spot the one credential enumerating IDs (`bola_suspect`), abusing a payment flow (`payment_abuse_suspect`), or showing up from two continents at once (`impossible_travel`). See [PII & Auth Detection](/api-discovery/pii-and-auth) for how consumers are fingerprinted.

## Geo & threat insights (on endpoint detail)

Geolocation and threat intelligence are presented **per endpoint**, on the **Insights** tab of the detail page: top source **countries**, **ASNs**, and **cities**, a **User-Agent** breakdown, and **threat-intel** hits, each with an optional time-series stack. The endpoints list also exposes **country / ASN / source-IP / user-agent cross-filters** so you can pivot the whole catalog to "endpoints served from this country/network". Both require ClickHouse to be configured. See [Exploring Endpoints](/api-discovery/endpoints).

## Related

- [Exploring Endpoints](/api-discovery/endpoints)
- [Risk Scoring: Threat vs Exposure](/api-discovery/risk-scoring)
- [Risk Flags Reference](/api-discovery/risk-flags-reference)
