---
title: Errors and codes
description: Every error code of the elchi automation API — its HTTP status, what it means, whether to retry, and what to do; the conflict reasons; the problem body.
sidebar_position: 3
tags: [automation, api]
---

Every error of the automation API is a **problem** (RFC 9457, `Content-Type: application/problem+json`):

```json
{
  "type": "https://www.elchi.io/docs/automation-api/errors#conflict",
  "title": "The request conflicts with the current state",
  "status": 409,
  "code": "conflict",
  "reason": "whole_address_disabled",
  "detail": "every port of 10.0.0.5 is disabled: enable the address, then disable the ports that should stay disabled",
  "instance": "/api/public/v1/projects/6a85908d74f75a273fbc421d/endpoints/10.0.0.5/enable",
  "request_id": "5c0f3e5e-0d7e-4b8f-9d0c-1f1d2b3a4c5d"
}
```

| Field | Meaning |
| --- | --- |
| `type` | Links to this page, at the code's section. |
| `title` | The code's title. |
| `status` | The HTTP status. |
| `code` | A stable code from the closed list below. **Switch on this.** |
| `detail` | What happened, for a person. Never parse it. |
| `instance` | The request path. |
| `request_id` | The request's `X-Request-Id`. Quote it when you report a problem. |
| `errors` | For `invalid_request` and `unprocessable`, when a field can be named: the fields at fault, each with a `pointer` (a JSON Pointer into the body, or `query:<name>`, `header:<name>`, `path:<name>`), a `code` and a `detail`. |
| `reason`, `data` | For `conflict`: why, and details of it. |

The list of codes is **closed**: a new code would be a new API version. "Retry" below says whether the same request, sent again unchanged, may succeed later.

| Code | HTTP | Retry |
| --- | --- | --- |
| [`invalid_request`](#invalid_request) | 400 | no |
| [`unauthenticated`](#unauthenticated) | 401 | no |
| [`token_expired`](#token_expired) | 401 | no |
| [`insufficient_scope`](#insufficient_scope) | 403 | no |
| [`project_mismatch`](#project_mismatch) | 403 | no |
| [`not_found`](#not_found) | 404 | no |
| [`method_not_allowed`](#method_not_allowed) | 405 | no |
| [`conflict`](#conflict) | 409 | depends on `reason` |
| [`precondition_failed`](#precondition_failed) | 412 | no |
| [`payload_too_large`](#payload_too_large) | 413 | no |
| [`unsupported_media_type`](#unsupported_media_type) | 415 | no |
| [`idempotency_key_reused`](#idempotency_key_reused) | 422 | no |
| [`unprocessable`](#unprocessable) | 422 | no |
| [`rate_limited`](#rate_limited) | 429 | yes, after `Retry-After` |
| [`internal`](#internal) | 500 | yes, with backoff |
| [`unavailable`](#unavailable) | 503 | yes, after `Retry-After` |

## Codes

### invalid_request {#invalid_request}

**400. The request is malformed.**

The body is not valid JSON, or the request has something the endpoint does not take: an unknown body field or query parameter, a repeated parameter, data after the JSON, a cursor this list did not give. When a field can be named, `errors` points at it.

### unauthenticated {#unauthenticated}

**401. Authentication is required.**

Send `Authorization: Bearer elchi_pat_…` with a live [API token](./tokens.md). These are refused:
- a malformed value;
- a revoked token;
- a token whose creator lost access to the project;
- a sign-in session's token from the elchi UI.

### token_expired {#token_expired}

**401. The API token has expired.**

Create a new token in **Settings → Tokens** and replace the old one.

### insufficient_scope {#insufficient_scope}

**403. The API token lacks the scope this needs.**

Use a token that has the scope the operation names (see [scopes](./tokens.md#scopes)).

### project_mismatch {#project_mismatch}

**403. The API token belongs to another project.**

Call the token's own project. `GET /api/public/v1/token` shows it.

### not_found {#not_found}

**404. Not found.**

Check the path, and the id in it. Unknown paths answer this too.

### method_not_allowed {#method_not_allowed}

**405. Method not allowed.**

Use a method this path documents.

### conflict {#conflict}

**409. The request conflicts with the current state.**

Read `reason`:

| Reason | Meaning | What to do |
| --- | --- | --- |
| `whole_address_disabled` | You enabled some ports of an address that is disabled on every port. | Enable the address (no `ports`), then disable the ports that should stay out. |
| `pending_unpublished_changes` | The listeners the change rebuilds have saved, unpublished resource changes, which the push would also take live. `data.pending_changes` names them. It is empty when elchi could not tell whether such changes exist; the preview ([endpoints](./endpoints.md#preview-a-change), [clusters](./clusters.md#preview-a-switch)) then shows `pending_unknown`. A publish counts as unpublished until its rebuild records it, so a change sent a few seconds after a publish may get this too. | Publish or revert them, or send `allow_pending_changes: true` to take them live with this change. |
| `idempotency_in_progress` | A request with the same `Idempotency-Key` is still running. | Retry after `Retry-After`. |
| `concurrent_change` | Another request changed the same endpoint, or the same cluster, at the same moment. | Retry after `Retry-After`. For a cluster switch, read the cluster again first: it may use another endpoints resource now. |
| `not_eds_cluster` | A [cluster switch](./clusters.md#what-elchi-checks-first) named a cluster that is not EDS. | Only an EDS cluster takes its endpoints from an endpoints resource. |
| `no_service_name` | A cluster switch named an EDS cluster with no `eds_cluster_config.service_name`. | Name an endpoints resource in the cluster first. |
| `target_name_mismatch` | The switch target's own `cluster_name` is not its name; Envoy would wait for an assignment that never comes. | Fix the target's `cluster_name`, then switch. |
| `target_has_no_endpoints` | The switch target holds no endpoint with an address; the cluster would have no host. | Add its endpoints, then switch. |
| `from_mismatch` | The cluster does not use the `from` the switch named. `data.current` names the one it uses. | Someone else switched it; read it again and decide. |

New reasons may be added; treat an unknown one like a conflict you cannot resolve automatically.

### precondition_failed {#precondition_failed}

**412. The resource changed since it was read.**

Read it again and send its new `ETag` as `If-Match`.

### payload_too_large {#payload_too_large}

**413. The request body is too large.**

Keep the body under 1 MiB.

### unsupported_media_type {#unsupported_media_type}

**415. The request body must be application/json.**

Send the body with `Content-Type: application/json`.

### idempotency_key_reused {#idempotency_key_reused}

**422. The Idempotency-Key was used for another request.**

Use a new `Idempotency-Key` for every different request. A key is kept for 24 hours.

### unprocessable {#unprocessable}

**422. The request is not valid.**

Fix the value `errors` points at. Examples:
- a field of the wrong type, such as a port sent as a string;
- an address that is neither an IP nor a hostname;
- a port outside 1–65535.

### rate_limited {#rate_limited}

**429. Too many requests.**

Wait the seconds in `Retry-After`. The `RateLimit-*` headers show the budget (see [rate limits](./overview.md#rate-limits)).

### internal {#internal}

**500. Internal error.**

Retry with backoff. Quote `request_id` when you report it.

### unavailable {#unavailable}

**503. The service is unavailable.**

Retry after `Retry-After`.

When a change was saved but its push to the proxies could not be started, the answer is `503`. Send the same request again to push it: a repeat of a change whose push did not get through pushes it again.
