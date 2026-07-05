---
title: "Tutorial: Build an API Inventory in a Day"
description: Enable API Discovery on a listener, let it observe real traffic, triage risk across the dashboards, and export an OpenAPI spec of the confirmed catalog.
sidebar_position: 3
tags: [tutorial]
---

In an afternoon you can go from *"we're not entirely sure what our edge exposes"* to a **living, traffic-derived inventory of every API operation your platform serves** — scored for risk, split into real endpoints vs. probe noise, and exportable as an OpenAPI contract. [API Discovery](/api-discovery/overview) builds it by watching the access logs Envoy already emits: passive, metadata-only, never in the request path.

## What you'll build

A confirmed endpoint catalog for one listener, a triaged risk shortlist, and an exported OpenAPI 3.x spec of the surface you actually serve.

## Prerequisites

- An edge Envoy managed by Elchi, serving real traffic — if you don't have one yet, do [From Install to First Listener](/tutorials/zero-to-envoy) first.
- The **elchi-collector** running centrally (bundled with the platform install) and reachable from the edge.
- Real traffic to observe — the inventory is only as complete as what flows through it.

## Step 1 — Enable Discovery on the listener

Discovery is turned on **per listener** by pointing an ALS v3 gRPC access-log sink at the collector. Two things must be present, both covered in the [overview's enable section](/api-discovery/overview#how-to-enable-it):

**A node id the collector can key on** — of the form `listener::project::ip`:

```yaml
node:
  id: "public-edge::acme-prod::10.0.1.42"
  cluster: envoy
```

**An HTTP gRPC ALS sink** on the listener's HCM, logging the specific headers the collector extracts (`authorization` for presence only, `user-agent`, `x-forwarded-for`, `x-request-id`, and the response headers that drive posture flags):

```yaml
access_log:
  - name: envoy.access_loggers.http_grpc
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.access_loggers.grpc.v3.HttpGrpcAccessLogConfig
      common_config:
        log_name: elchi
        transport_api_version: V3
        grpc_service:
          envoy_grpc: { cluster_name: elchi_collector }
        buffer_flush_interval: 1s
      additional_request_headers_to_log: [authorization, user-agent, x-forwarded-for, x-request-id]
      additional_response_headers_to_log: [content-type, grpc-status, location, strict-transport-security]
```

:::warning[Get the source IP right]
Discovery derives the client IP from Envoy's downstream connection, never the spoofable leftmost `X-Forwarded-For`. Configure the listener with `use_remote_address` + `xff_num_trusted_hops` so the recorded IP is the real caller and not your CDN. See [collector configuration](/api-discovery/collector-configuration).
:::

## Step 2 — Let it observe

There is nothing to tune yet — just let traffic flow. Within a couple of flush intervals the listener appears at **`/api-discovery`**. Discovery is passive, so this step costs your request path nothing; it can never block, slow, or break live traffic.

Give it a **representative window**. The catalog only knows what it has seen, so leave it running through a full cycle — daily and weekly batch jobs, webhook retries, admin flows — before you treat it as complete. This is the "in a day" part: the wait is the work.

:::tip[Privacy posture]
No request/response bodies, no query strings, and sensitive headers (`Authorization`, `Cookie`, `X-Api-Key`…) are dropped before persistence — only their *presence* is recorded. Source IP and User-Agent are hashed. Turning Discovery on does not create a new exfiltration surface — see [PII & Auth Detection](/api-discovery/pii-and-auth).
:::

## Step 3 — Review the dashboards

The landing page at `/api-discovery` is a strip of tabbed [dashboards](/api-discovery/dashboards) — the **Listeners** catalog plus focused security lenses over the same inventory. Start with these:

- **Listeners** — the home tab. Distinct-endpoint counts, hostnames, the union of risk flags, and a status distribution per listener. Click yours to drill in.
- **New APIs** — what appeared on your surface recently. Your shadow-API early-warning; treat it as a review queue after every deploy.
- **Auth Coverage** — what's reachable without credentials, and where auth is inconsistent (`auth_inconsistent` — often a bypass path or mid-rollout misconfig).
- **PII** — which endpoints carry personal data, by category. Your GDPR/PCI review list.
- **Zombies** — old and formerly-popular endpoints you can safely retire. A stale endpoint no client uses is pure attack surface.
- **Risk** and **Security Score** — the project-wide triage view and a single A–F posture grade for the surface.

## Step 4 — Understand confirmed vs attack surface

This is the single most important concept in the catalog. Open the listener's [endpoints view](/api-discovery/endpoints) and find the **Catalog** toggle:

- **Confirmed** — the request **matched a real Envoy route**. This is your actual API, *regardless of status code* — a `401`/`403`/`500` from a real backend is still a real endpoint. This is the clean catalog you export and build policies from.
- **Attack surface** — the request **matched no route** (`/.env`, `/cgi-bin`, `wp-login.php`, SPA-fallback `200`s) or carried scanner/probe flags. Genuine probe noise, deliberately kept **out** of the real catalog.

The distinction is not a guess — it is Envoy's route match, the ground truth. Add the **Maturity ≥5** gate to hide one-off hits that a single scanner request could otherwise promote into the confirmed catalog.

## Step 5 — Triage risk

Switch to **Group by path** and read the two-axis [risk score](/api-discovery/risk-scoring) on each endpoint. **Threat** (active attack/abuse — red) and **Exposure** (standing config hygiene — blue) are independent columns on purpose: collapsing them would let a storm of misconfiguration flags drown out one real attack. Prioritize as a 2×2:

- **High Threat + High Exposure** — open *and* under attack. **Top priority.**
- **High Exposure, Low Threat** — "boring but open": fix the hygiene (TLS, auth, headers) before it's found.
- **High Threat, Low Exposure** — a solid endpoint under attack: lean on rate limits/RBAC and watch it.

Sort by **Threat** to find what's being attacked, by **Exposure** to find what to harden. Each flag links into the [Risk Flags Reference](/api-discovery/risk-flags-reference) with its OWASP mapping and remediation. Drill into any endpoint's detail page for the **How to fix this endpoint** action plan.

## Step 6 — Export the confirmed catalog as OpenAPI

Your inventory *is* a description of your API surface, so export it. On the endpoints view, with the **Confirmed** catalog selected, click **Export OpenAPI** → **Download YAML** (or JSON). See [OpenAPI Export](/api-discovery/openapi-export).

The spec is assembled from observed operations, statuses, and content types — so it has two defining properties:

- **It reflects reality.** Every path, method, status, and content type in it was actually observed. No aspirational or stale entries.
- **It can miss never-exercised operations.** An endpoint that got no traffic in the window won't appear.

:::warning[Export confirmed, not attack surface]
Always export the **confirmed** catalog. Exporting the attack-surface view would bake probe paths (`/.env`, `wp-login.php`) into your spec. And review before you enforce — a traffic-derived spec captures everything that happened, including endpoints you'd rather not keep exposed. Trim it before it becomes an allow-list.
:::

## Next steps

- Feed the trimmed spec into Shield's [OpenAPI validation](/shield/engines/openapi-validation) engine for positive security — only conforming requests reach the service.
- Turn the discovered endpoints directly into a Shield policy: [Secure an API with Shield](/tutorials/secure-an-api-with-shield) walks the [suggest-policy bridge](/api-discovery/suggest-policy) end to end.
- Set a normalization rule for any deployment-specific ID format the built-in detectors missed — see [Path Normalization](/api-discovery/path-normalization).
