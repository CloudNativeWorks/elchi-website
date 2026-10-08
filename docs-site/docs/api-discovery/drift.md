---
title: Drift & Snapshots
description: Daily snapshots of the confirmed API surface and the change feed against them — new and removed operations, auth downgrades, new PII categories and risk flags, cleared flags, risk increases, status regressions, zombie resurrections and templated merges.
sidebar_position: 11
tags: [api-discovery]
---

The **Drift** tab answers *"what changed since my baseline?"*. API Discovery snapshots the confirmed surface and diffs the live inventory against a snapshot, so you catch an endpoint silently gaining an anonymous code path, a new PII category or a route that shouldn't exist.

## Snapshots

- A snapshot stores the project's **confirmed** rows together with their **active** flags and PII categories, the accepted-anonymous marker, the active window and the status codes seen.
- A leader-elected scheduler takes one snapshot per project every **24 hours**; on startup it also captures every project whose newest snapshot is missing or older than 23 hours.
- Admins/Owners can **take a snapshot now**. Its id is the RFC3339 timestamp to the second, so it can be used directly as the drift anchor.
- Snapshots are kept for **30 days** (TTL). The 100 newest are listed.

## The change feed

Pick an anchor — a snapshot id, an RFC3339 time or a duration such as `24h` / `7d` (default 24 hours, relative values up to 30 days; an older anchor is clamped to 30 days and flagged as clamped). The baseline is the newest snapshot at or before the anchor; with none, the feed tells you so.

| Change | Detail |
|---|---|
| **New operation**, **New method**, **Removed operation** | The operation appeared, gained a method, or vanished |
| **Auth downgrade** | Authenticated-only in the baseline, now with an **active** accepted-anonymous marker. An acceptance that has aged out is not a downgrade; endpoints reset after the baseline are suppressed (and counted) |
| **New PII category** | An **active** category the baseline never had |
| **New risk flag** | An **active**, non-info flag (stored or derived) the baseline never had — a transient flag that aged out is not new |
| **Flag cleared** | A flag active in the baseline that is no longer active (baselines that stored active flags) |
| **Risk increase** | Max risk score above the baseline's |
| **Status regress** | New error status codes |
| **Zombie resurrection** | An endpoint that had gone quiet is receiving traffic again |
| **Templated** | Literal baseline rows that were merged into a learned `{id}` template — reported once as a merge instead of as removed + new |

Filter the feed with `mode`: all, new, removed, auth, pii, risk, status, zombie or templated. Each row links to its inventory entry.

:::tip[Use drift as a release gate]
Take a snapshot before a deploy and review the change feed after it: new anonymous writes, new PII and new flags are exactly the regressions to stop before an attacker finds them.
:::

## Related

- [Path Normalization](/api-discovery/path-normalization#learned-templating) — why literal rows become `{id}` templates.
- [Risk Flags Reference](/api-discovery/risk-flags-reference#active-historical-and-derived-flags) — active vs historical flags.
- [OpenAPI Specs & Coverage](/api-discovery/specs-and-coverage) — drift against a contract rather than a snapshot.
