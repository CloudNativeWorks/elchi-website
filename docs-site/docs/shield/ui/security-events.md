---
title: Security Events
description: The per-event forensic feed of what Shield is blocking and detecting across a project's edges, backed by central ClickHouse — filters, facets, and the redaction model.
sidebar_position: 3
---

**Shield → Security Events** is a project-scoped, filterable feed of the individual audit events Shield's edges emit — every block, detect-mode and shadow-mode finding, plus a sample of allowed traffic. Events flow from each edge sidecar to the **central ClickHouse** table (`elchi_shield_audit`) and are served to the UI through the backend (`/api/v3/shield/events`). The tab is gated to **Admin** and **Owner** roles.

Where the [Overview dashboard](/shield/ui/overview-dashboard) shows rates and trends, this feed answers the forensic question: *which request, on which edge, was blocked by which engine and rule, and why*.

## What an event contains — and what it never contains

Each row carries the event metadata only: timestamp, action, severity, engine, rule id, policy id, method, host, path, response status code, the edge identity (instance, node id, listener), request id (Envoy `x-request-id`), processing phase and direction, the active config version, and a short reason string.

Edges running **elchi-shield 1.2.0 or newer** add the **scoring trail** of the Coraza WAF: for a CRS decision the `rule_id` is only the blocking-evaluation rule (`949110` inbound, `959100` outbound — "anomaly score exceeded"), so the event also lists **which rules filled the score** — each with its id, message template, severity, the points it added, how many variables it matched, its paranoia level and rule file — plus the request's **anomaly score** and the **threshold** in force. The trail is rule metadata only; the matched data (the payload) is never exported. Allowed requests carry it too: a request that scored 3 against a threshold of 5 is recorded as `allow` with its rule and `3/5`.

:::info[The redaction model]
Audit events **never contain header or body values** — no tokens, cookies, payloads, or query strings. The **path is stored query-stripped**, and engine reason strings are structured descriptions, never request content. What lands in ClickHouse is safe to retain and share: enough to attribute and investigate a finding, nothing that leaks the request itself.
:::

Two things to remember when reading counts:

- **Findings are always audited** — every block, detect, and shadow event is recorded.
- **Allowed traffic is sampled** (per-policy `sampling_rate`, 5% by default, plus an optional global cap), so `allow` rows are a sample, not a total. Use the [Overview dashboard](/shield/ui/overview-dashboard) or Prometheus metrics for exact request tallies.
- Rows expire from ClickHouse by TTL (7 days by default) — see [Metrics, Audit & Health](/shield/observability) for the schema and retention.

## Filters

The filter bar drives both the feed and the summary, server-side:

- **Time range** — quick relative ranges from *Last 15 minutes* to *Last 30 days*, or a custom range with times. A relative range is **live**: Refresh (and the Live auto-refresh) slides the window forward to "now". Manually editing the range pins it, and refreshes re-query the same fixed window.
- **Engine** — one of the engines that produced findings (the dropdown is built from real data in the window; e.g. `coraza`, `jwt`, `bot`, `ratelimit`, `ipreputation`, `dlp`, `body_size`, `body_decode`, `anomaly`, …).
- **Action** — `block`, `detect`, `shadow`, or `allow`.
- **Severity** — `critical`, `high`, `medium`, `low`, `info`.
- **Edge (node)** — a specific edge's node id.
- **Findings only** — on by default: keeps blocks, detections and shadow findings and — on edges that record the scoring trail — the **allowed requests that scored under the threshold** (they are findings too); the clean, sampled allow stream is hidden. Switch it off to see that stream.
- **Rule** — set by clicking a rule in the **Top rules** card (or the `rule=` query parameter): events *involving* that rule, i.e. rows whose `rule_id` it is **or** whose scoring trail contains it — so `942100` finds the CRS blocks it scored in, whose `rule_id` is `949110`.
- **Quick search** — a client-side filter on host / path / request id, applied to the currently loaded page only (paging is collapsed while a search is active).

Draft filter edits are applied with **Apply** (the button lights up when the draft differs from what's active); **Clear** returns to the defaults.

## Summary, chart, and facets

Above the feed:

- **Summary cards** — Total, Blocked, Detected, and Shadow counts for the filtered window, computed server-side from `engine × action × severity` groups over the same filter as the feed (so the total is exact, not an estimate).
- **Activity over time** — a stacked area chart with one series per action, bucketed over the window.
- **Top engines** — the engines producing the most events in the window.
- **Top rules** — the rules behind the window's decisions, ranked by the events they took part in: for the WAF the CRS rules that filled the anomaly score (from the scoring trail), for the other engines their rule id. Click a rule to filter the feed on it. Empty until the edges run shield 1.2.0+.

The engine and edge dropdowns are **facets**: they list the distinct values actually present in the selected time window, so you never filter on an engine that produced nothing.

## The feed

The table pages 50 events at a time, newest first: time, action, severity, engine, the request (`method host+path`), status code, reason (with the rule id in the tooltip; on a trail-carrying event a chip such as `3 rules · 25/5` — rules that scored, score over threshold), and the edge. Expanding a row reveals the remaining fields — request id, policy id, rule id, node id, listener, instance, phase, direction, config version, and the full reason — each copyable for cross-referencing with edge logs (the request id matches the `request_id` in Shield's per-request decision log).

The expanded row also shows **Matched rules** when the edge recorded them:

- a header `score N / threshold M`; `under threshold` on an allowed request that scored, or `blocked directly by rule <id> (no anomaly score)` when a rule denied on its own (for example `200002`, Coraza's "Failed to parse request body" — a `deny` that writes no score, so the total can be `0/5` on a block);
- one line per rule: id, severity, the points it added (`+10 (×2)` when the rule matched two variables — the CRS scores once per matched variable, so the lines add up to the score), paranoia level, message and file; a `deny` badge instead of points for a rule that blocked directly;
- `no CRS rule matched` on a clean, sampled allow; `not recorded by this edge (shield < 1.2.0)` for rows written by older edges.

- **Live** — a toggle that auto-refreshes every **15 seconds** while the tab is visible, sliding a relative window forward each tick.
- **CSV** — exports the filtered result set (up to 500 rows) client-side, with the trail as `matched_rule_ids` (`;`-separated), `anomaly_score` and `anomaly_threshold` columns. Only the redacted fields are exported, and cells are neutralized against spreadsheet formula injection.

## When to use it vs the Overview dashboard

Reach for **Security Events** when you have a *what happened* question: verifying that a new policy blocks the right things, tracing a user-reported 403 by request id, reviewing what a shadow-mode policy would have blocked before enforcing it, or pulling evidence for an incident. Reach for the **[Overview dashboard](/shield/ui/overview-dashboard)** when you have a *how much / how healthy* question — rates, latency, and edge health. The two are designed as a pair: spot the spike on Overview, explain it here.
