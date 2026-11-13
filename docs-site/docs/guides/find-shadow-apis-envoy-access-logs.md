---
title: "Find Shadow APIs from Envoy Access Logs"
description: "Find shadow and undocumented APIs: stream Envoy ALS access logs to the Elchi collector, build a live API inventory and compare it with your OpenAPI specs."
sidebar_position: 5
tags: [guide]
---

# How to Find Shadow and Undocumented APIs from Envoy Access Logs

You can find shadow APIs by building an inventory from the requests Envoy actually serves and comparing it with the specs your teams maintain. In Elchi, API Discovery reads Envoy's Access Log Service (ALS v3) records, normalizes paths into operations such as `GET /users/{id}`, and keeps one inventory entry per operation. Import your OpenAPI or Swagger specs and the coverage view marks every observed operation that falls inside a spec's scope but matches no operation in it as **undocumented**. The inventory can also be exported as an OpenAPI 3.0.3 document.

## When you need this

- You do not know every endpoint your services expose, or the specs you have are out of date.
- You need a list of endpoints that receive traffic without authentication or that return personal data.
- You want to know when a deploy adds a new endpoint, or when an old one that went quiet receives traffic again.
- You need an OpenAPI document for an API that never had one.

## Steps

1. **Turn on Discovery for a listener.** Enable `api_discovery` on the listener's HTTP connection manager. Elchi wires an HTTP gRPC access-log sink to the collector (the project's `elchi-als` access-log extension, with the request and response headers the collector reads). The node id must have the form `listener_name::project_id::listener_ip`. Set `use_remote_address` and `xff_num_trusted_hops` on the listener so the recorded client IP is the real caller. See [How to enable it](/api-discovery/overview#how-to-enable-it).
2. **Let traffic flow for a representative window.** Listeners appear at `/api-discovery` within a couple of flush intervals. The inventory only knows what it has seen, so wait through daily and weekly jobs, retries and admin flows before treating it as complete.
3. **Work from the confirmed catalog.** On the endpoints view, set the **Catalog** toggle to **Confirmed**. Confirmed operations matched a configured Envoy route; requests that matched no route, or got only `404`/`405` from the backend, or look like scanner probes go to the attack-surface view instead.
4. **Review the dashboards.** **New APIs** lists operations first seen inside a window (default 24 hours); review it after every deploy. **Zombies** lists operations that once carried traffic and have been silent for a while (default 30 days). **Auth Coverage** lists operations that accepted anonymous traffic, and **PII** lists operations that carried personal data, by category. See [Discovery Dashboards](/api-discovery/dashboards).
5. **Import your specs.** On the **Specs** tab, upload OpenAPI 3.x or Swagger 2.0 documents (YAML or JSON) and set each spec's scope: listener, host prefix and path prefixes. Uploading under an existing name creates a new version.
6. **Read coverage.** Coverage puts every confirmed operation seen in the window into one status: **Documented**, **Overlap**, **Undocumented** (inside some spec's scope, matched by none: the shadow APIs) or **Unscoped**. It also lists spec operations nobody calls, deprecated operations that still receive traffic, and parameter and status-code drift. See [OpenAPI Specs & Coverage](/api-discovery/specs-and-coverage).
7. **Export the observed surface.** **Export OpenAPI** on the endpoints view downloads the confirmed inventory as YAML or JSON, honouring the listener and host filters. See [OpenAPI Export](/api-discovery/openapi-export).
8. **Track change over time.** [Drift](/api-discovery/drift) compares daily snapshots: new and removed operations, auth downgrades, new PII categories, risk increases and zombie resurrections.

## How it works

Envoy streams ALS v3 records over gRPC to `elchi-collector`. Nothing sits in the request path: there is no inline filter and no ext_proc, so Discovery cannot block or slow traffic. The collector normalizes paths, fingerprints consumers, runs its detectors and scores risk, then writes raw events to ClickHouse (`api_events_raw`, 7-day retention by default, with minute, hour and day rollups) and one document per operation to the MongoDB `api_inventory` collection, which has no TTL. The controller serves the inventory, specs, coverage and drift to the UI.

The pipeline records metadata only. Request and response bodies are never shipped, query-string values are dropped (only parameter names are kept), a fixed set of sensitive headers such as `Authorization`, `Cookie` and `X-Api-Key` is dropped before storage (only their presence is recorded), source IP and User-Agent are hashed, and PII found in a path segment is replaced with `{pii}`.

Coverage compares all current spec versions with confirmed HTTP operations seen within the window (default 7 days, up to 90). gRPC, TCP and GraphQL rows are not compared. The exported document reflects what ran in the observation window: an operation that exists in code but received no traffic does not appear in it.

## Related docs

- [API Discovery Overview](/api-discovery/overview) - data flow, privacy posture and confirmed vs attack surface.
- [Tutorial: Build an API Inventory in a Day](/tutorials/api-inventory-in-one-day) - the full walkthrough.
- [Exploring Endpoints](/api-discovery/endpoints) - the endpoints view and detail pages.
- [Risk Scoring](/api-discovery/risk-scoring) - threat and exposure scores.
- [Suggest Policy](/api-discovery/suggest-policy) - turn discovered endpoints into a Shield policy.
- [Shield OpenAPI validation](/shield/engines/openapi-validation) - enforce a spec at the edge.

## Next steps

- **Product:** [Elchi API Discovery](https://www.elchi.io/products/api-discovery.html) - the traffic-derived API inventory, risk scoring and spec coverage used in this guide.
- **Plans:** [compare plans and licensing](https://www.elchi.io/plans.html), from the free tier to enterprise.
- **Talk to us:** running this across many Envoy edges? [Book a demo](https://www.elchi.io/contact.html) with the Elchi team.
