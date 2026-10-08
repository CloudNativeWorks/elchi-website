---
title: Discovery Dashboards
description: The tabbed dashboards at /api-discovery — listeners, new APIs, auth coverage, bots, PII, zombies, risk, security score, transport, errors, drift, consumers, specs and teams.
sidebar_position: 2
tags: [api-discovery]
---

The landing page at `/api-discovery` is a strip of tabbed dashboards. The first tab is the **Listeners** catalog; the rest are focused security lenses over the same inventory, each answering one operational question. Every dashboard is scoped to the currently-selected project.

:::info[Active findings and time windows]
Inventory-backed dashboards (Risk, PII, Auth Coverage, New APIs) count **active** findings — those seen within the active window (`policy.risk_active_days`, default 7 days) — and show lifetime counts next to them where useful; see [active, historical and derived flags](/api-discovery/risk-flags-reference#active-historical-and-derived-flags). ClickHouse-backed dashboards (Bot / Scanner, Security Score, Transport, Errors, Consumers) take a time window of up to **7 days**; a longer window is rejected rather than silently clamped. All windows are half-open `[from, to)`.
:::

The strip has **fourteen** tabs. Country / ASN / city / threat-intel insights live on the **Insights** tab of an individual endpoint and as cross-filters in the endpoints view — see [Exploring Endpoints](/api-discovery/endpoints).

## Listeners

**Answers:** *What Envoy listeners are serving API traffic, and how healthy is each?*

A paginated table of listeners: distinct normalized paths and operations, the hostnames served, lifetime and **active** risk flags, an aggregated HTTP **status distribution** bar, and last activity. Header KPIs summarize total endpoints, operations, and how many listeners carry at least one active, non-info flag. Click a listener to drill into its [endpoints](/api-discovery/endpoints).

Panels and admin actions on this tab:

- **Normalization Gaps panel** — path prefixes accumulating many distinct un-normalized child segments. Admins/Owners get a one-click *"Add normalize rule"* and a link to **Learned path shapes**. See [Path Normalization](/api-discovery/path-normalization).
- **Rebaseline** (Admin/Owner) — project-wide reset of the lifetime scores that also makes every earlier finding historical. See [Risk Scoring](/api-discovery/risk-scoring#resetting-scores-admin).
- **Cleanup stale** (Admin/Owner) — delete endpoints not seen for N days (7–3650, default 90). Endpoints still receiving traffic are recreated on the next request.

## New APIs

**Answers:** *What appeared on my surface recently?*

Endpoints whose `first_seen` falls inside a selectable window (default 24 hours, up to 90 days), with their active flags and scores. The shadow-API early-warning: review it after every deploy.

## Auth Coverage

**Answers:** *What is reachable without credentials, and where is auth inconsistent?*

Two modes over **active** auth markers — **Unauthenticated** (accepted anonymous traffic and no authenticated traffic) and **Inconsistent** (both) — write methods by default, with a toggle for reads. See [PII, Auth & Consumers](/api-discovery/pii-and-auth#the-auth-coverage-dashboard).

## Bot / Scanner

**Answers:** *Who is automating against me — and is it a good bot or a scanner?*

Automated and scanner traffic from the collector's User-Agent classifier (`scanner` / `bot` / `monitor` / `sdk` / `cli` / `browser`) and the probe flags (`scanner_user_agent`, `vuln_probe_path`, `path_scan_suspect`). Cells are per path **and operation** (GraphQL operations and gRPC methods apart) and link to the inventory row when it is unambiguous.

## PII

**Answers:** *Which endpoints carry personal data, and of what kind?*

Category cards (`email`, `phone`, `ssn`, `credit_card`, `iban`, `tr_national_id`, `secret_in_path`, `jwt_in_path`) with active, lifetime and historical endpoint counts, and the list of endpoints with active PII. See [PII, Auth & Consumers](/api-discovery/pii-and-auth#pii-detection).

## Zombies

**Answers:** *What can I safely retire?*

Endpoints silent for a while (default 30 days, up to 365) that once carried real traffic (default ≥ 1000 calls). Because a zombie is silent, its active score is ~0, so this tab ranks by **lifetime** scores. Feed it into **Cleanup stale**.

## Risk

**Answers:** *What are my worst risks, by class and severity?*

The project-wide summary of **active** findings: endpoint counts per flag, **by class**, and **by severity** (Critical / High / Medium / Low / Info). *Flagged endpoints* counts endpoints with at least one active, non-info flag. Derived flags are included. The same data drives the **API Risk Guide** (`/api-discovery/risks`), which adds a remediation action plan and an OWASP API Top-10 coverage panel.

## Security Score

**Answers:** *What's my grade, and what moved it?*

A **0–100** score and an A–F grade for a time window (default 1 hour, max 7 days), from five weighted pillars — auth coverage, transport security, risk exposure, attack surface and threat activity. A pillar with too little traffic is marked *insufficient data*, shown with its provisional score, and left out of the overall score. See [Risk Scoring](/api-discovery/risk-scoring#security-score) for the formulas and gates.

## Transport

**Answers:** *How is my TLS posture?*

TLS version mix (TLS 1.3 / 1.2 / 1.0–1.1 / plaintext / TLS via a trusted proxy), HTTP protocol mix (HTTP/1.x, HTTP/2, HTTP/3, TCP), weak-TLS and plaintext percentages, HTTP/2 adoption, and a per-operation list of weak-transport issues. Effective TLS includes **TLS terminated by a trusted proxy** (`policy.trusted_tls_proxy_cidrs` + `x-forwarded-proto: https`); plaintext requests that *claim* https from an untrusted peer are counted separately. Legacy protocol is reported for information only.

## Errors

**Answers:** *Where are my 4xx / 5xx hotspots?*

One hotspot per **operation** (GraphQL operations and gRPC methods apart) with 4xx, 5xx, error rate, **shield blocks** and block rate, plus a dense UTC time series. Shield blocks are their own class: they are subtracted from the status class they were served in, so the error rate is the **upstream's** — `(4xx + 5xx) / (total − blocked)`. Counters are exact to the minute: the window's edges are read from the 1-minute rollup and the body from the hourly one, never snapped to the hour; an edge older than the 30-day minute retention is read hourly and marked as such.

## Drift

**Answers:** *What changed against my baseline?*

The change feed against daily (or on-demand) snapshots — new and removed operations, auth downgrades, new PII categories and flags, cleared flags, risk increases, status regressions, zombie resurrections and templated merges. See [Drift & Snapshots](/api-discovery/drift).

## Consumers

**Answers:** *Who are my top API consumers, and how do they behave?*

Per-consumer behaviour keyed on the hashed consumer identity, with machine-vs-human classification, new-consumer and trend signals, and the enumeration / scraping / auth-failure indicators. See [Consumers & Enumeration](/api-discovery/consumers-and-enumeration).

## Specs

**Answers:** *How does traffic line up with our OpenAPI contracts?*

Imported specs with versions and scopes, coverage (documented / overlap / undocumented / unscoped), unused operations and parameter / status drift. See [OpenAPI Specs & Coverage](/api-discovery/specs-and-coverage).

## Teams

**Answers:** *Which team owns which risk?*

Per-team endpoint counts, active risk distribution, unauthenticated writes, PII and ownership gaps. See [Ownership & Teams](/api-discovery/ownership-and-teams).

## Raw-event sampling

With `policy.raw_sample_rate` ≥ 2, benign raw events are stored 1-in-N and carry a `sample_weight`. ClickHouse-backed event **counts** are weighted, so they estimate the real request count; **distinct** counts (consumers, IPs, object ids) become lower bounds and are badged in the UI. Errors, blocks and every risky event are never sampled.

## Related

- [Exploring Endpoints](/api-discovery/endpoints)
- [Risk Scoring: Threat vs Exposure](/api-discovery/risk-scoring)
- [Risk Flags Reference](/api-discovery/risk-flags-reference)
