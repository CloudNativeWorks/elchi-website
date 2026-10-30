---
title: Endpoints (disable and enable)
description: Take an upstream endpoint (an IP or a hostname, every port or some) out of rotation everywhere it is used in a project, and put it back, through the automation API.
sidebar_position: 4
tags: [automation, api, operations]
---

An **endpoint** here is an upstream address: an **IP** (IPv4 or IPv6) or a **hostname**, optionally with ports.

Disabling an endpoint takes it out of rotation **everywhere it is used in the project**, on every Envoy version. That covers:
- [endpoint resources](/envoy-configuration/resources/endpoints) (EDS);
- clusters' own endpoints (the `load_assignment` of a STATIC, STRICT_DNS or LOGICAL_DNS cluster).

This is the API counterpart of the [Endpoint Control](/operations/endpoint-control) page. Both change the same state.

## What a disable does

elchi serves every matching endpoint to the proxies with `health_status: DRAINING`:

- Envoy sends a draining host **no new requests**.
- Open connections end on their own.
- Active health checks go on, and do not bring the host back.

The **stored resources do not change**. Editing and publishing them, or a Kubernetes discovery update, keeps the endpoint disabled. Enabling the endpoint puts its own health status back.

Matching follows these rules:

- **IPs are compared in canonical form.** `2001:0DB8::0001` is `2001:db8::1`, and `::ffff:10.0.0.5` is `10.0.0.5`.
- **Hostnames are compared in lower case, without a trailing dot.** `API.Example.com.` is `api.example.com`.
- **A disable matches the address as the configuration writes it.**
  - A hostname disable reaches a DNS cluster (STRICT_DNS or LOGICAL_DNS) that names that hostname, and through it every address the name resolves to.
  - An IP disable does not reach a hostname that happens to resolve to that IP. Target the hostname instead.
- **Without ports**, every port of the address is disabled. With `ports`, only those ports are.
- An endpoint's `additional_addresses` are matched too.

### Limits

- **Every endpoint of a cluster disabled.** If you disable all of a cluster's endpoints, Envoy enters **panic mode** and keeps sending traffic to them. It answers 503 instead when the cluster sets `common_lb_config.healthy_panic_threshold: 0` or `zone_aware_lb_config.fail_traffic_on_panic: true`. The [preview](#preview-a-change) of a disable says which, in `empty_clusters`.
- **Bootstrap clusters.** A cluster that a bootstrap carries in `static_resources` is read by Envoy at start, not over xDS, so a disable does not reach it there. The usage names such bootstraps in `bootstraps`.
- **Dynamic forward proxy and ORIGINAL_DST.** Their upstreams are not `lb_endpoints`, so they are not affected.

## List the project's endpoints

```http
GET /api/public/v1/projects/{project}/endpoints?q=10.0.&state=disabled&limit=50
```

Scope: `endpoints:read`.

The list holds every address the project's configuration uses, on every Envoy version, and every disabled address even when nothing uses it any more. It is sorted by address. Unix sockets, internal listeners and `0.0.0.0` are not endpoints and are not listed.

| Parameter | Meaning |
| --- | --- |
| `q` | A part of the address, in any case (at most 255 characters). |
| `state` | `enabled`, `disabled` (every port) or `partially_disabled` (some ports). |
| `limit` | 1–500, default 50. |
| `cursor` | The previous page's `next_cursor`. |

```json
{
  "items": [
    {
      "address": "10.0.0.5", "kind": "ip", "state": "partially_disabled",
      "all_ports": null,
      "disabled_ports": [{"port": 443, "reason": "kernel patch", "disabled_at": "2026-10-29T10:00:00.000Z", "disabled_by": {"type": "api_token", "name": "api-token:release-pipeline"}}],
      "updated_at": "2026-10-29T10:00:00.000Z",
      "ports": [80, 443],
      "places": {"endpoint_resources": 3, "clusters": 1}
    }
  ],
  "next_cursor": null
}
```

`ports` are the ports the endpoint is used on. `places` counts the resources that use it, each once per Envoy version.

## Read one endpoint

```http
GET /api/public/v1/projects/{project}/endpoints/{address}
```

Scope: `endpoints:read`.

`{address}` is an IP or a hostname, in any case, with or without a trailing dot. The answer carries the normalized address, its state, and `usages`: every place it is used.

Each usage has:
- `version`;
- `kind` (`endpoints` or `cluster`);
- `resource`;
- `port`;
- `configured_address`, as written there;
- `source` (`eds`, `discovery`, `inline`, `dns`) and `cluster_type`;
- for an endpoint resource, the EDS `clusters` that deliver it;
- `bootstraps`, when a bootstrap carries the cluster statically.

The answer has an `ETag`. Send it as `If-Match` on a change to make the change only if the state did not move meanwhile, or as `If-None-Match` to get `304` while nothing changed. An address that was never disabled answers `state: "enabled"`.

## Disable

```http
POST /api/public/v1/projects/{project}/endpoints/{address}/disable
Content-Type: application/json
Idempotency-Key: 7b0c3f5e-…
Prefer: wait=60

{"ports": [443], "reason": "kernel patch"}
```

Scope: `endpoints:write`.

| Field | Meaning |
| --- | --- |
| `ports` | The ports to disable; none (or empty) is every port. |
| `reason` | Why, for the audit log and for the people who see it disabled (at most 500 characters). |
| `allow_pending_changes` | Go ahead although the affected listeners have saved, unpublished changes; they go live too. |
| `dry_run` | Answer what the change would reach, and change nothing. |

## Enable

```http
POST /api/public/v1/projects/{project}/endpoints/{address}/enable

{"ports": [443]}
```

Scope: `endpoints:write`.

The fields are the same as for disable, without `reason`.

- **Without `ports`**, every port of the address is enabled again.
- **One port of an address disabled on every port** cannot be enabled on its own. That is a `409` with reason [`whole_address_disabled`](./errors.md#conflict). Enable the address, then disable the ports that should stay out.

An enable also rebuilds the listeners still served with the endpoint draining, even when their saved configuration no longer names it.

## Answers to a change

| Answer | When |
| --- | --- |
| `202` with an [operation](./overview.md#long-running-operations) and `Location` | The change is saved and its push is running. |
| `200` with the finished operation | The push ended within `Prefer: wait`. |
| `200` with the endpoint | Nothing to change: it is already in that state, and its last push went through or is still running. |
| `200` with an impact | `dry_run`. |
| `409 pending_unpublished_changes` | The affected listeners have saved, unpublished changes. See [conflict](./errors.md#conflict). |
| `412 precondition_failed` | The `If-Match` is stale. |
| `503 unavailable` | The change is saved, but its push could not be started. Send it again. |

A repeat of a change whose push failed or never started pushes it again. It also pushes the listeners that the failed push did not reach.

Every control plane serving the project's proxies must run an elchi release with this feature. A control plane without it serves its proxies without the disable.

## Preview a change

`dry_run: true` answers the **impact** and changes nothing:

| Field | Meaning |
| --- | --- |
| `usages` | Where the endpoint is used (as above). |
| `listeners` | The listeners, per Envoy version, whose configuration is pushed again. |
| `incomplete` | Part of the walk to the listeners could not be read; some may be missing. |
| `empty_clusters` | For a disable: clusters it leaves without an endpoint to balance to. `outcome` is `panic_traffic_continues` (Envoy's panic mode keeps sending traffic) or `no_healthy_upstream` (it answers 503). |
| `pending_changes` | Saved, unpublished resources the push would also take live, per Envoy version. |
| `pending_unknown` | Whether other saved changes go live could not be told. The change is then refused like one with pending changes, unless you send `allow_pending_changes`. |

## Follow the push

```http
GET /api/public/v1/projects/{project}/operations/{operation_id}?wait=30
```

Needs the read scope of the operation's domain: `endpoints:read` for `endpoints.*` operations.

The answer is the operation:
- `status`: `pending`, `running`, `succeeded` or `failed`;
- `jobs`: one per Envoy version;
- `progress`;
- on failure, `error` and the proxies in `failed_nodes`.

`GET …/operations` lists the project's operations, newest first.

## Example: drain a server for maintenance

```bash
BASE=https://elchi.example.com/api/public/v1
P=6a85908d74f75a273fbc421d   # the project; GET $BASE/token shows it

# what would it reach?
curl -sS -X POST "$BASE/projects/$P/endpoints/10.0.0.5/disable" \
  -H "Authorization: Bearer $ELCHI_TOKEN" -H 'Content-Type: application/json' \
  -d '{"dry_run": true}'

# take it out, waiting for the push
curl -sS -X POST "$BASE/projects/$P/endpoints/10.0.0.5/disable" \
  -H "Authorization: Bearer $ELCHI_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  -H 'Prefer: wait=60' -H 'Content-Type: application/json' \
  -d '{"reason": "kernel patch"}'

# … maintenance …

# put it back
curl -sS -X POST "$BASE/projects/$P/endpoints/10.0.0.5/enable" \
  -H "Authorization: Bearer $ELCHI_TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  -H 'Prefer: wait=60' -H 'Content-Type: application/json' -d '{}'
```
