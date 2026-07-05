---
title: Suggest a Shield Policy
description: Turn a discovered API inventory into a draft Shield SecurityPolicy — the bridge from API Discovery to API Security.
sidebar_position: 9
tags: [api-discovery, shield]
---

Once [API Discovery](/api-discovery/overview) has observed an API's real traffic,
it knows that API's operations, which ones carry authentication, which return PII,
and how each is scored for risk. **Suggest Policy** turns that knowledge into a
draft [Shield](/shield/overview) `SecurityPolicy` — so you protect an endpoint from
the inventory instead of authoring routes and engines by hand.

This is the bridge between the two halves of the platform: Discovery tells you
*what you have and where the risk is*; Shield *enforces* protections at the edge.
Suggest Policy connects them.

## Where it lives

There are two entry points, both producing the same result — a draft policy handed
to the [Shield policy editor](/shield/ui/policy-editor):

- **From API Discovery** — in the endpoints view, select one or more path groups
  and choose **Suggest Shield Policy**. Discovery builds a draft `SecurityPolicy`
  covering those operations, plus a rationale for each suggested protection.
- **From the Shield editor** — the **Import from Discovery** drawer lets you pick
  discovered endpoints without leaving the policy you are editing; the suggested
  routes and engines are **merged** into it.

## What it suggests

The draft is derived from what Discovery actually observed, so the protections fit
the endpoints:

- **Routes** — one per selected operation (or path group), matched on the
  normalized path and method, mirroring the inventory.
- **Authentication** — where an operation is seen carrying (or expected to carry)
  auth, a matching Shield auth engine is proposed. Endpoints flagged
  `unauthenticated` or `auth_inconsistent` are called out.
- **Data protection** — operations that returned PII get a
  [DLP](/shield/policies/dlp) suggestion (redact the observed categories).
- **Rate limiting / bot / WAF** — proposed against operations whose risk flags
  (rate anomalies, scanner traffic, injection-style probes) warrant them.

Each suggestion comes with a **rationale** — the risk flag or observation that
prompted it — shown in a panel above the Builder so you can accept, adjust, or drop
it before deploying.

:::info The suggestion is a starting point, not a finished policy
The draft is **not persisted server-side** — it opens in the editor as unsaved
work. Review every route and engine, then follow the standard
[rollout](/shield/policies/modes-and-postures): deploy in `mode: detect`, watch
[Security Events](/shield/ui/security-events), and promote to `block` once it's
clean. Positive-security suggestions (an [OpenAPI](/shield/engines/openapi-validation)
allow-list, IP allow-lists) especially need review — they block everything not
explicitly permitted.
:::

## Typical flow

1. Enable Discovery on the listener and let it observe traffic (see
   [API Discovery overview](/api-discovery/overview)).
2. Review the inventory and [risk scoring](/api-discovery/overview); decide which
   endpoints to protect first (usually the highest-exposure, highest-risk ones).
3. Select them and **Suggest Shield Policy** (or **Import from Discovery** inside
   an existing policy).
4. Review the draft and its rationale in the [policy editor](/shield/ui/policy-editor).
5. **Create & Deploy** in `detect` mode; watch, tune, then switch to `block`.

## See also

- [Shield: getting started](/shield/getting-started) — writing and deploying a first policy.
- [Deploying policies to edges](/shield/deployment) — how a saved policy reaches every edge.
- [API Discovery overview](/api-discovery/overview) — how the inventory is built.
