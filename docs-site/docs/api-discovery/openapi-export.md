---
title: OpenAPI Export
description: Turn the traffic-derived API inventory into an OpenAPI 3.x document — and feed it into Shield's positive-security enforcement.
sidebar_position: 8
tags: [api-discovery]
---

API Discovery builds its inventory from real traffic. That inventory *is* a description of your API surface — so it can be exported as an OpenAPI 3.x document with one click. Unlike a hand-authored spec, this one reflects what your services actually serve, not what someone once wrote down.

## The Export OpenAPI action

On the endpoints view, the **Export OpenAPI** button opens a dropdown with two choices:

- **Download YAML**
- **Download JSON**

Both call the inventory OpenAPI endpoint (`/api/v3/inventory/openapi`) for the current project, honoring the active listener and host filters, and download the generated spec as a file. The request is authenticated with your bearer token and streamed back as a blob, so the download respects the same access controls as the rest of the UI.

## What the exported spec contains

The document is assembled from the discovered inventory:

| OpenAPI element | Source in the inventory |
|---|---|
| Paths | Normalized operations (e.g. `/users/{id}`) — see [Path Normalization](/api-discovery/path-normalization) |
| Operations | The HTTP methods observed on each path |
| Responses | The status codes actually seen (from the endpoint's status distribution) |
| Content types | The response content types observed on the endpoint |

Because the spec is **traffic-derived, not hand-authored**, it has two defining properties:

- **It reflects reality.** Every path, method, status, and content type in it was actually observed in production traffic — there are no aspirational or stale entries.
- **It can miss never-exercised operations.** An endpoint that exists in code but received no traffic in the observation window won't appear. The export is a description of *what ran*, not a guarantee of *everything that could run*.

:::note[Export from the confirmed catalog]
The clean catalog is the set of **confirmed** endpoints — operations that matched a configured Envoy route, as opposed to scanner/probe noise separated into the attack-surface view. Treat a contract you intend to *enforce* as coming from the confirmed catalog: exporting the attack-surface view would bake probe paths into your spec. See [Overview](/api-discovery/overview) for the confirmed vs. attack-surface distinction.
:::

## Complementing Shield's positive-security engine

The export closes a loop with Shield. Shield ships an [OpenAPI validation engine](/shield/engines/openapi-validation) that enforces **positive security** — requests that don't match a supplied OpenAPI contract are rejected. Authoring that contract by hand for a large, evolving API is exactly the friction that keeps positive security on the shelf.

API Discovery removes it:

1. Let the collector observe traffic and build the inventory.
2. **Export the discovered contract** as OpenAPI (YAML or JSON).
3. Review and trim it to the surface you want to enforce.
4. Hand it to Shield's OpenAPI engine as the positive-security spec.

You go from "traffic" to "enforced contract" without ever hand-writing the spec — and because the contract came from observed reality, the false-positive rate at enforcement time is low.

## The suggest-policy bridge

For the same "discovery → enforcement" motion at the policy level rather than the schema level, API Discovery can turn selected endpoints directly into a suggested Shield policy target. See [Suggest a Policy](/api-discovery/suggest-policy) for that workflow, which pairs naturally with an exported OpenAPI contract.

## Caveats

- **Observation-window bound.** The spec only knows what traffic showed it. Widen the window or wait for a full traffic cycle (daily/weekly batch jobs, admin flows) before treating an export as complete.
- **Confirmed, not attack surface.** Export the confirmed catalog for an enforceable contract; the attack-surface view is for investigation, not for baking into a spec.
- **Review before enforcing.** A traffic-derived spec captures what happened, including any endpoints you'd rather *not* keep exposed. Trim it before it becomes an allow-list.

## Related

- [Path Normalization](/api-discovery/path-normalization) — how paths become the operation templates in the spec.
- [Suggest a Policy](/api-discovery/suggest-policy) — turn discovered endpoints into Shield policy targets.
- [Shield OpenAPI validation](/shield/engines/openapi-validation) — enforce the exported contract at the edge.
