---
title: Records & IPs
description: Managing GSLB DNS records and the IPs behind them — create, update, bulk enable/disable, add/remove IPs, assign regions, override health state, and clear status history.
sidebar_position: 2
tags: [gslb, traffic]
---

A GSLB **record** maps a fully-qualified domain name to a set of IPs and a probe configuration. This page covers managing records and the IPs behind them, from the UI list view and the REST API. All record and IP endpoints require JWT authentication; write operations require the **Admin** or **Owner** role.

## The record list

The GSLB list view shows every record in the current project with live IP statistics — total, healthy, and unhealthy IP counts per record — and its probe type, interval, TTL, and enabled state. The list is paginated (default 10 per page, max 100) and filterable.

### Filters

`GET /api/v3/gslb?project=<id>` accepts these query parameters, which combine freely:

| Filter | Values | Notes |
| --- | --- | --- |
| `search` | any string | Case-insensitive match on FQDN. |
| `status` | `enabled` / `disabled` | Record enabled state. |
| `probe_type` | `http` / `https` / `tcp` | The probe protocol. |
| `probe_interval` | `10`, `20`, `30`, `60`, `90`, `120`, `180`, `300` | Probe interval in seconds. |
| `ttl` | `1`–`86400` | DNS TTL in seconds. |
| `page`, `limit` | integers | Pagination (`limit` max 100). |

```bash
# All enabled HTTPS records with a 30s probe interval and 60s TTL
GET /api/v3/gslb?project=<id>&status=enabled&probe_type=https&probe_interval=30&ttl=60
```

## Creating a record

Manual records are created with `POST /api/v3/gslb`. The record is created **without IPs** — you add IPs separately after creation (see below).

```json
{
  "fqdn": "api.global.example.com",
  "project": "production",
  "version": "v1",
  "enabled": true,
  "ttl": 120,
  "failover_zone": "backup.example.com",
  "probe": {
    "type": "https",
    "port": 443,
    "path": "/health",
    "host_header": "api.example.com",
    "interval": 30,
    "timeout": 2.5,
    "warning_threshold": 2,
    "critical_threshold": 3,
    "passing_threshold": 2,
    "expected_status_codes": ["200-299"]
  }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `fqdn` | yes | Normalized with a trailing dot on storage. Must be unique (409 on conflict). |
| `project` | yes | Project the record belongs to. |
| `version` | yes | Version identifier (e.g. `v1`). |
| `enabled` | yes | Whether the record is served and health-checked. |
| `ttl` | yes | DNS TTL, 1–86400 seconds. |
| `failover_zone` | no | Per-record failover zone. Defaults to the first entry in the project's `failover_zones` setting. |
| `probe` | no | Health-check config — see [Health model](/traffic-and-certificates/gslb/health-model). |

The record is placed in a shard (a `shard_id` derived from the FQDN hash) so the distributed health checker can pick it up.

## Updating a record

`PUT /api/v3/gslb/:id` updates the `enabled` flag, `ttl`, `failover_zone`, and `probe` config only. FQDN and project are immutable. The `probe` field is three-way:

- **Provide a probe object** — replaces the probe configuration.
- **Provide `null`** — removes the probe entirely (deletes all probe settings).
- **Omit the field** — leaves the existing probe unchanged.

When the probe is updated or removed, all per-IP backoff timers are reset so the record's IPs get a fresh start.

:::warning[Auto-created records]
Auto-created records (`service_id != ""`) cannot be updated or deleted through these endpoints — you get `400 Bad Request` ("Delete the service instead"). Manage them via the service's deploy/undeploy lifecycle. You **can** still add manual backup IPs and override health states on them.
:::

## Bulk enable / disable

To flip many records at once — for example, draining a set of records for maintenance — use `PUT /api/v3/gslb/batch`:

```json
{
  "record_ids": ["507f...011", "507f...012", "507f...013"],
  "enabled": false
}
```

Up to **100 records** per request. Validation is atomic: if any ID is malformed, the whole operation fails. The change is applied in a single database operation and triggers an immediate reload so DNS reflects it right away. The response reports `matched_count` and `modified_count` (the latter may be lower if some records were already in the target state).

Disabling a record does not delete it — the health checker keeps state, but the record is served with **empty IPs**, which triggers its failover FQDN. This is a controlled failover, distinct from all IPs going critical.

## Deleting a record

`DELETE /api/v3/gslb/:id` removes a manual record and all its associated IP health records. The response reports `deleted_ips`. Auto-created records reject deletion here.

## Managing IPs

Each record holds a set of IP health documents. IPs are managed through dedicated endpoints.

### Add an IP

`POST /api/v3/gslb/:id/ips`:

```json
{
  "ip": "203.0.113.15",
  "client_id": "external-lb-4",
  "health_state": "passing"
}
```

- `ip` — required, valid IPv4 or IPv6.
- `client_id` — optional identifier (may be empty).
- `health_state` — optional initial state: `passing` (default), `warning`, or `critical`.

Every IP added through the API is flagged `is_manual: true`. Manual IPs can be added to **both** manual and auto-created records — this is how you attach external load balancers or backup IPs to a service record. The response returns the shard assignment (`shard_id/sub_shard_id`) and creation timestamp.

### List IPs

`GET /api/v3/gslb/:id/ips` returns every IP health document for the record, including current state, backoff, and status history. The backend returns `null` when there are no IPs.

### Assign regions

`PUT /api/v3/gslb/:id/ips/:ip/regions` sets the geographic region tags for an IP:

```json
{ "regions": ["europe", "asia"] }
```

Regions let CoreDNS request a region-filtered snapshot. When a snapshot poll includes a `regions` parameter, **only IPs whose region tags intersect the requested regions are served** — and IPs with no region tags are excluded from a regional query entirely. An unfiltered poll (`regions` empty or `all`) returns every IP regardless of tags. Regions available for a project come from the GSLB settings (`GET /api/v3/setting/gslb/options`).

### Manual health-state override

`PUT /api/v3/gslb/:id/ips/:ip` forces an IP's health state — used for maintenance drains, staged rollouts, or emergency cutovers:

```json
{ "health_state": "critical" }
```

- Setting `critical` immediately removes the IP from DNS answers.
- Setting `passing` returns it to rotation and clears any backoff.

The override sets a `manual_reset_at` timestamp; the health checker's counter is reset to zero so the next probe establishes a fresh baseline. Manual overrides are allowed on both manual and auto-created records. **The override is not permanent** — the health checker keeps probing and may change the state again based on results. If the endpoint is genuinely down, a forced `passing` will flip back on the next failed probe.

### Remove an IP

`DELETE /api/v3/gslb/:id/ips/:ip` removes an IP. Only manually-added IPs (`is_manual: true`) can be removed this way. Auto-generated IPs (`is_manual: false`) are protected and can only be removed via undeploy operations — attempting to delete one returns `400 Bad Request`.

### Clear IP status history

Each IP accumulates a `status_history` array of probe results. `DELETE /api/v3/gslb/ip/:id/history` (where `:id` is the IP **health document** ID, not the record ID) clears that array:

```bash
DELETE /api/v3/gslb/ip/507f1f77bcf86cd799439012/history
```

This only removes historical entries — the current health state, monitoring, and DNS behavior are untouched, and the health checker resumes appending new entries. Useful for cleaning up test data or shrinking large documents.

:::danger[Irreversible]
Clearing status history permanently deletes the historical probe records. There is no undo.
:::

## Applying changes to DNS

Record and IP changes are written to the database and reflected the next time elchi-coredns polls the snapshot API (on its sync interval). To push a change to nodes immediately rather than waiting for the poll, use the **notify** operations described in [Nodes & CoreDNS](/traffic-and-certificates/gslb/nodes-coredns).
