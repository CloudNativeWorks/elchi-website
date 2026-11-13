---
title: "Cluster Switch API: Blue/Green for Envoy EDS"
description: "Point an Envoy EDS cluster at another endpoints resource (backend-blue to backend-green and back) with the Elchi automation API; every listener gets it at once."
sidebar_label: "Clusters (blue/green switch)"
sidebar_position: 5
tags: [automation, api, operations]
---

An **EDS cluster** takes its endpoints from an [endpoints resource](/envoy-configuration/resources/endpoints), named in its `eds_cluster_config.service_name`. A **switch** points the cluster at another endpoints resource of the same Envoy version. For example, `payments` uses `backend-blue`; after a switch it uses `backend-green`.

elchi then pushes every listener that uses the cluster. This is a **blue/green release**: prepare the new servers in their own endpoints resource, switch, and switch back if something goes wrong.

This is the API counterpart of the [Cluster Endpoints](/operations/cluster-endpoints) page. Both make the same switch.

## What a switch does

- **Only `service_name` changes.** It is written in the stored cluster, so the change is permanent; it is not an overlay like an [endpoint disable](./endpoints.md). Every other field of the cluster, `eds_config` included, stays as it is.
- **Envoy swaps without dropping requests.** The changed cluster is a new cluster to Envoy. Envoy builds it and waits for its endpoints, while the old one keeps serving. It then swaps them, and the old connections finish the requests they carry.
- **A switch is for one Envoy version.** A cluster exists once per version; switch each version you serve.
- **The listener history records it.** The listener's publish history names `clusters/<name>` as changed. A switch back is the way to undo it.

### What elchi checks first

Envoy subscribes the new cluster to the new name only. If that endpoints resource does not come, or comes with no endpoint, the cluster has **no host** and answers 503. So a switch is refused, and nothing is written, when:

| Refusal | Why |
| --- | --- |
| `409 not_eds_cluster` | The cluster is not EDS (STATIC, a DNS type, or a custom `cluster_type`). |
| `409 no_service_name` | The cluster names no endpoints resource. |
| `422 unprocessable`, pointer `/to` | There is no such endpoints resource in that version. |
| `409 target_name_mismatch` | The target's own `cluster_name` is not its name. Envoy would wait for an assignment that never comes. |
| `409 target_has_no_endpoints` | The target holds no endpoint with an address. |

The [preview](#preview-a-switch) also warns about things that do not stop a switch:
- `all_target_endpoints_disabled`: every endpoint of the target is [disabled](./endpoints.md). Envoy's panic mode sends traffic to them anyway, unless the cluster turns panic mode off.
- `target_kept_by_discovery`: Kubernetes discovery keeps the target, and rewrites its endpoints.
- `listeners_incomplete`: part of the walk to the listeners could not be read.

## List the EDS clusters

```http
GET /api/public/v1/projects/{project}/clusters?version=v1.40.2&q=payments&limit=50
```

Scope: `clusters:read`.

The list holds the version's EDS clusters that name an endpoints resource, sorted by name.

| Parameter | Meaning |
| --- | --- |
| `version` | Required. The Envoy version; [`GET /projects/{project}/versions`](./overview.md#the-values-a-call-needs) lists them. |
| `q` | A part of the cluster's name or of its endpoints resource's name (at most 255 characters). |
| `limit` | 1–500, default 50. |
| `cursor` | The previous page's `next_cursor`. |

```json
{
  "items": [
    {
      "name": "payments", "version": "v1.40.2", "endpoints": "backend-green",
      "current": {"name": "backend-green", "endpoints": 2, "addresses": ["10.0.1.5:8080", "10.0.1.6:8080"], "disabled": 0, "discovery": false, "cluster_name": "backend-green"},
      "updated_at": "2026-10-29T10:00:00.000Z",
      "last_switch": {"version": "v1.40.2", "cluster": "payments", "from": "backend-blue", "to": "backend-green", "by": {"type": "api_token", "name": "api-token:release-pipeline"}, "reason": "release 7", "at": "2026-10-29T10:00:00.000Z", "operation_id": "op_…"}
    }
  ],
  "next_cursor": null
}
```

`endpoints` is the endpoints resource the cluster uses. `current` describes it, or is `null` when that resource does not exist in the version (Envoy then serves the cluster with no host).

## Read one cluster

```http
GET /api/public/v1/projects/{project}/clusters/{name}?version=v1.40.2
```

Scope: `clusters:read`.

The answer is the cluster as above, plus:
- `candidates`: every endpoints resource of the version, each with its counts and `cluster_name`;
- `listeners`: the listeners that use the cluster;
- `incomplete`: part of the walk to the listeners could not be read.

The answer has an `ETag`. Send it as `If-Match` on a switch to switch only if the cluster did not change meanwhile, or as `If-None-Match` to get `304` while nothing changed.

## Switch

```http
POST /api/public/v1/projects/{project}/clusters/{name}/switch-endpoints
Content-Type: application/json
Idempotency-Key: 7b0c3f5e-…
Prefer: wait=60

{"version": "v1.40.2", "to": "backend-green", "from": "backend-blue", "reason": "release 7"}
```

Scope: `clusters:write`.

| Field | Meaning |
| --- | --- |
| `version` | Required. The Envoy version of the cluster. |
| `to` | Required. The endpoints resource to switch to. |
| `from` | The one you expect it to use now. If it uses another, the switch is refused with `409 from_mismatch`, and `data.current` names it. Send it from a pipeline, so that two releases never overwrite each other. |
| `reason` | Why, for the audit log and the switch history (at most 500 characters). |
| `allow_pending_changes` | Go ahead although the listeners have saved, unpublished changes; they go live too. |
| `dry_run` | Answer what the switch would reach, and change nothing. |

## Answers to a switch

| Answer | When |
| --- | --- |
| `202` with an [operation](./overview.md#long-running-operations) and `Location` | The switch is saved and its push is running. |
| `200` with the finished operation | The push ended within `Prefer: wait`. |
| `200` with the cluster | Nothing to change: it uses `to` already, and its last push went through or is still running. |
| `200` with an impact | `dry_run`. |
| `404 not_found` | No such cluster in that version. |
| `409` | A [refusal above](#what-elchi-checks-first), `from_mismatch`, `pending_unpublished_changes`, or `concurrent_change` (another request changed the cluster at the same moment; read it again and retry). See [conflict](./errors.md#conflict). |
| `412 precondition_failed` | The `If-Match` is stale. |
| `503 unavailable` | The switch is saved, but its push could not be started. Send it again. |

A repeat of a switch whose push failed or never started pushes it again, together with the listeners the failed push did not reach.

## Preview a switch

`dry_run: true` answers the **impact** and changes nothing:

| Field | Meaning |
| --- | --- |
| `from`, `to` | The endpoints resources, each with its endpoints and addresses. |
| `listeners` | The listeners whose configuration is pushed again. |
| `incomplete` | Part of the walk to the listeners could not be read; some may be missing. |
| `pending_changes`, `pending_hidden` | Saved, unpublished resources the push would also take live, and how many of them you cannot see. |
| `pending_unknown` | Whether other saved changes go live could not be told. The switch is then refused like one with pending changes, unless you send `allow_pending_changes`. |
| `warnings` | See [what elchi checks first](#what-elchi-checks-first). |

## The switch history

```http
GET /api/public/v1/projects/{project}/clusters/{name}/switches?version=v1.40.2&limit=50
```

Scope: `clusters:read`.

The cluster's switches, newest first (`limit` 1–200), each with `from`, `to`, who made it, the reason, the time and its `operation_id`. Switches are kept for a year.

## Follow the push

```http
GET /api/public/v1/projects/{project}/operations/{operation_id}?wait=30
```

`clusters.*` operations need `clusters:read`. The operation is the same as for an [endpoint change](./endpoints.md#follow-the-push): one job for the version, with its listeners.

## Example: a blue/green release

```bash
BASE=https://elchi.example.com/api/public/v1
P=6a85908d74f75a273fbc421d   # the project; GET $BASE/token shows it
V=v1.40.2

# 1. backend-green holds the new servers. What would the switch reach?
curl -sS -X POST "$BASE/projects/$P/clusters/payments/switch-endpoints" \
  -H "Authorization: Bearer $ELCHI_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"version\": \"$V\", \"to\": \"backend-green\", \"dry_run\": true}"

# 2. switch, waiting for the push
curl -sS -X POST "$BASE/projects/$P/clusters/payments/switch-endpoints" \
  -H "Authorization: Bearer $ELCHI_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  -H 'Prefer: wait=60' -H 'Content-Type: application/json' \
  -d "{\"version\": \"$V\", \"to\": \"backend-green\", \"from\": \"backend-blue\", \"reason\": \"release 7\"}"

# 3. if the release goes wrong: switch back
curl -sS -X POST "$BASE/projects/$P/clusters/payments/switch-endpoints" \
  -H "Authorization: Bearer $ELCHI_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  -H 'Prefer: wait=60' -H 'Content-Type: application/json' \
  -d "{\"version\": \"$V\", \"to\": \"backend-blue\", \"from\": \"backend-green\", \"reason\": \"rollback release 7\"}"
```

The old target stays as it is after a switch. Once nothing uses it, it can be deleted, or left in place for the next release.

:::tip OpenAPI
[Download the OpenAPI spec](https://www.elchi.io/docs/openapi/elchi-public-v1.yaml) for the full request and response schemas of the automation API.
:::
