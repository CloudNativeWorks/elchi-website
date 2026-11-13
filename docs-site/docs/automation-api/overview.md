---
title: "Automation API Overview"
description: "Elchi's public REST automation API: versioned base URL, project API tokens, problem+json errors, idempotent writes, long-running operations and rate limits."
sidebar_label: "Overview"
sidebar_position: 1
tags: [automation, api]
---

The **automation API** is elchi's public REST API for scripts, pipelines and other tools. It is separate from the API the elchi UI uses: it takes only [project API tokens](./tokens.md), it is versioned, and every endpoint follows the same conventions, described on this page.

It covers two domains:
- the [endpoint disable](./endpoints.md): taking an upstream endpoint (an IP or a hostname) out of rotation everywhere it is used in a project, and putting it back;
- the [cluster switch](./clusters.md): pointing an EDS cluster at another endpoints resource, for a blue/green release.

## Base URL

```text
https://<your elchi address>/api/public/v1
```

The major version is in the path. The front-door Envoy of an elchi installation routes `/api/public/` to the controller.

The API is described by an **OpenAPI 3.0** document, served without a token:

| Path | Content |
| --- | --- |
| `GET /api/public/v1/openapi.json` | The document as JSON |
| `GET /api/public/v1/openapi.yaml` | The document as YAML |

**[Download the OpenAPI spec](https://www.elchi.io/docs/openapi/elchi-public-v1.yaml)** (YAML, the same document a current elchi controller serves) to read it or generate a client before you have an installation; your own instance's copy always matches its version.

Point a generator (for example openapi-generator) or a tool such as Postman at it. The elchi UI also renders the same document as an interactive reference under **Administration → API Reference** (`/api-docs`). It includes ready-to-copy `curl` commands with your project filled in.

## A first call

1. Create a token in **Settings → Tokens** (see [API tokens](./tokens.md)) and keep it in your pipeline's secrets.
2. Check it:

```bash
export ELCHI_TOKEN=elchi_pat_…
curl -sS -H "Authorization: Bearer $ELCHI_TOKEN" https://elchi.example.com/api/public/v1/token
```

The answer names the token's project and scopes. Every other path names the project: `/api/public/v1/projects/{project}/…`.

### The values a call needs

| Value | Where to find it |
| --- | --- |
| Project ID | `project` in `GET /token`. In the UI: **Settings → Tokens** shows it (and the dialog of a new token), and the API Reference fills it into its examples. |
| Envoy version | `GET /projects/{project}/versions`: the versions this control plane serves and the ones the project's listeners, clusters or endpoints resources are on, newest first. The [clusters API](./clusters.md) takes one as `version`. |
| Cluster and endpoints resource names | `GET /projects/{project}/clusters?version=…` and, for one cluster, its `candidates`. |
| Endpoint address | `GET /projects/{project}/endpoints` lists every address the project uses. |
| Operation ID | The `id` (and the `Location` header) of a change's answer; `GET /projects/{project}/operations` lists them. |

```bash
curl -sS -H "Authorization: Bearer $ELCHI_TOKEN" https://elchi.example.com/api/public/v1/projects/$P/versions
```

```json
{"items": [
  {"version": "v1.40.2", "status": "served", "listeners": 12, "clusters": 30, "endpoints": 8},
  {"version": "v1.39.4", "status": "served", "listeners": 0, "clusters": 0, "endpoints": 0}
]}
```

`status` is `served` when a control plane serves the version now. `not_configured` means this control plane no longer serves it, so its resources reach no proxy. `no_control_plane` means it is configured, but no control plane for it is running. `unknown` means the control planes could not be read.

## Conventions

These rules hold for every endpoint, now and in the future.

### Errors

Every error is `application/problem+json` (RFC 9457). It carries a stable `code` from a closed list and the `request_id`. For an invalid request whose field can be named, it also has `errors`, each with a JSON Pointer to the field at fault. Switch on `code`, never on the text. The codes and what to do about each are on [Errors and codes](./errors.md).

### Request ids

Send `X-Request-Id` (1–128 characters of `A-Za-z0-9._:-`) to tie a call to your logs. It is echoed on every response and recorded in the audit log. Without it, elchi makes one.

### Retries

- `GET` is always safe to send again.
- Every `POST` takes an `Idempotency-Key`: 1–255 visible ASCII characters, such as a UUID. The same key with the same request returns the first answer for **24 hours**, marked `Idempotent-Replayed: true`. The same key with a different request (another body or `If-Match`) is refused with `idempotency_key_reused`. A `5xx` answer is not kept: the same key runs the request again.
- Retry `429` and `503` after `Retry-After`, and `500` with backoff.
- Never retry another `4xx` unchanged.

### Concurrency

A resource that can change under you has an `ETag`. Send it as `If-Match` to change the resource only if it did not change since you read it; otherwise the answer is `412 precondition_failed`. Send it as `If-None-Match` on a `GET` to get `304 Not Modified` when nothing changed.

### Long-running operations

An action that pushes configuration to the proxies answers `202 Accepted` with an **operation** and a `Location` header.

- Follow it with `GET …/projects/{project}/operations/{id}`. Add `?wait=N` to hold the request until the operation ends, up to 60 seconds.
- Or ask the action itself to wait: `Prefer: wait=N` (up to 60). The answer then carries `Preference-Applied`. When the operation ends within that time, the answer is `200` with the finished operation; otherwise it is the usual `202`.

An operation ends `succeeded` or `failed`.

- `succeeded` means the new configuration is set on every control plane that serves the affected proxies. It does not mean every proxy has acknowledged it.
- `failed` lists the proxies the push did not reach in `failed_nodes`.

The project's operations are listed newest first and kept for 30 days.

### Formats

- Times are RFC 3339 in UTC, with milliseconds.
- Fields are `snake_case`.
- An enum marked `x-extensible-enum` may gain values; treat an unknown value as opaque.
- Lists page with `limit` and an opaque `next_cursor`. Pass `cursor` to read the next page, with the same filters as the first one.
- Unknown query parameters and unknown body fields are refused (`400 invalid_request`).
- A request body is at most **1 MiB** of `application/json`.

### Rate limits

Each token may send **300 requests a minute, of which 30 writes**.

- Every response to an authenticated request carries `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`. On a write they describe the write budget.
- Over the limit, the answer is `429 rate_limited` with `Retry-After`.
- The budget refills continuously (a token bucket). It is counted by each controller replica: behind N replicas a token may send up to N times as many.
- Failed authentication is limited separately: 60 a minute per client address.

### Versioning

Within v1, changes only add things: new operations, optional fields, and new values of extensible enums. A change that would break a client becomes v2, and v1 then stays available for at least 12 months. A deprecated operation sends `Deprecation`, `Sunset` and a `Link` to its replacement.
