---
title: Nodes & CoreDNS
description: The elchi-coredns GSLB nodes — how CoreDNS consumes the zone-authenticated DNS snapshot API, node tracking and cleanup, proxied health/records, and single-node vs. broadcast notify.
sidebar_position: 4
tags: [gslb, traffic]
---

The IP addresses GSLB computes are only useful once something answers DNS with them. That something is **elchi-coredns** — a CoreDNS build with the Elchi GSLB plugin, running on each edge node. This page covers how CoreDNS is wired to the Controller, how the Controller tracks nodes, and the operations you can run against them.

## How CoreDNS is wired

elchi-coredns is authoritative for your GSLB zone and answers real DNS queries on port 53 (TCP + UDP). It never touches MongoDB. Instead, on a fixed sync interval it **polls the Controller's DNS snapshot API**, caches the returned records, and serves them. A small control webhook listens on port **8053** for push notifications from the Controller.

```text
   client ──DNS query :53──► elchi-coredns ──poll GET /dns/snapshot──► Controller
                                   ▲                                       │
                                   └──────push POST :8053/notify◄──────────┘
```

The plugin, the zone, and the shared secret are provisioned by the bare-metal installer (default-on). Relevant install flags: `--gslb-zone`, `--gslb-secret`, `--gslb-sync-interval` (default `1m`), `--gslb-ttl`, `--gslb-regions`, `--gslb-nameservers`. See the [bare-metal overview](/installation/bare-metal/overview) for the full list. Zone defaults are also editable at runtime under **Settings → GSLB**.

## The DNS snapshot API

Two endpoints serve the plugin. Both are rooted at `/dns` (not under `/api/v3`) and use **secret-based auth**, not JWT.

### Authentication

The plugin sends the zone's shared secret in the `X-Elchi-Secret` header; the Controller validates it against the zone's configured `dns_secret`. This is the value you set under **Settings → GSLB** or via `--gslb-secret`.

```bash
GET /dns/snapshot?zone=global.example.com&node_ip=10.0.0.5
X-Elchi-Secret: my-super-secret-key-xyz
```

### Full snapshot

`GET /dns/snapshot?zone=<zone>&node_ip=<ip>` returns the complete record set for a zone.

| Parameter | Required | Notes |
| --- | --- | --- |
| `zone` | yes | The DNS zone to fetch. |
| `node_ip` | yes | The polling node's IP (must be a valid IP). Used to track the node. |
| `regions` | no | Comma-separated region tags. Filters IPs to those whose region tags intersect the request; `all` or empty returns all IPs. |

```json
{
  "zone": "global.example.com",
  "version_hash": "6c01cd97…efb7",
  "records": [
    {
      "name": "api.global.example.com.",
      "type": "A",
      "ttl": 120,
      "ips": ["203.0.113.15", "203.0.113.16"],
      "failover": "api.backup.example.com."
    }
  ]
}
```

Each record carries only healthy IPs (`critical`/`recovery` are already excluded). When a record has no healthy IPs, `ips` is empty and `failover` names the record's failover FQDN in the backup zone, which the plugin uses to steer traffic on. The `version_hash` is a SHA-256 over the sorted records (and requested regions, so per-region polls hash distinctly).

### Incremental changes

`GET /dns/changes?zone=<zone>&since=<version_hash>&node_ip=<ip>` is the poll the plugin uses on its interval:

- If `since` matches the current version, the Controller returns **`304 Not Modified`** — a cheap no-op.
- If the data changed (or `since` is omitted), it returns the full snapshot with the new `version_hash`.

This lets CoreDNS poll frequently at near-zero cost when nothing has changed. Node tracking is updated on both the 304 and 200 paths.

## Node tracking

Every time a node polls the snapshot or changes endpoint, the Controller upserts a record in `gslb_nodes` — keyed by `node_ip` + `zone` — capturing `first_seen`, `last_seen`, a running `request_count`, and the `last_version_hash` the node received. This gives you a live inventory of which CoreDNS instances are syncing your zones.

### List nodes

`GET /api/v3/gslb/nodes` returns the tracked nodes. Each entry:

| Field | Meaning |
| --- | --- |
| `id` | Node document ID. |
| `node_ip` | The node's IP. |
| `zone` | Zone it's polling. |
| `first_seen` / `last_seen` | First and most recent poll timestamps. |
| `request_count` | Total polls served. |
| `last_version_hash` | Version the node last received (compare against the current snapshot to spot drift). |

### Delete a stale node

`DELETE /api/v3/gslb/nodes/:id` removes a node entry. Use this to clean up nodes that were decommissioned — a stale entry lingers because tracking is poll-driven, so a node that stops polling never removes itself. Deleting the entry does not affect a live node (it will re-register on its next poll).

## Node proxy operations

The Controller can reach into a tracked node's control webhook (port 8053) on your behalf. These endpoints require **Admin/Owner** and forward using the zone's `dns_secret`.

### Health

`GET /api/v3/gslb/nodes/:id/health` proxies a health check to the node and returns its status, zone, `records_count`, `version_hash`, `last_sync`, and `last_sync_status`. If the node is unreachable you get `502 Bad Gateway`.

### Records

`GET /api/v3/gslb/nodes/:id/records?project=<id>` asks the node what records it is **currently serving** — the plugin's own view, not the Controller's database. Optional `name` and `type` filters narrow the query. This is the tool for confirming a node actually applied the latest snapshot.

### Notify a single node

`POST /api/v3/gslb/nodes/:id/notify?project=<id>` pushes specific records to one node immediately, instead of waiting for its next poll:

```json
{
  "records": ["api.global.example.com", "web.global.example.com"],
  "deletes": ["old.global.example.com"]
}
```

You send only FQDNs. The Controller looks up the current healthy IPs for the `records` FQDNs from the database, builds the DNS payload, and forwards it to the node's `/notify` webhook; `deletes` FQDNs are sent as removals. At least one `records` or `deletes` entry is required. The response reports how many records were `updated` and `deleted`.

### Broadcast to all nodes

`POST /api/v3/gslb/nodes/notify-all?project=<id>` builds the payload once and fans it out **concurrently to every tracked node in the zone**. Same request body as single-node notify. The response summarizes the broadcast:

```json
{
  "total": 3,
  "success": 2,
  "failed": 1,
  "results": [
    { "node_ip": "10.0.0.5", "status": 200 },
    { "node_ip": "10.0.0.6", "status": 200 },
    { "node_ip": "10.0.0.7", "status": 0, "error": "GSLB node unreachable" }
  ]
}
```

Use `notify-all` after a change you need to propagate everywhere at once (a failover cutover, a bulk enable/disable) rather than waiting up to one sync interval for each node to poll. A node that is temporarily unreachable still converges on its next scheduled poll.

:::info[Notify vs. poll]
Notify is an optimization, not a requirement. Even with no notify, every node converges to the current snapshot within one `--gslb-sync-interval`. Notify just makes propagation immediate for time-sensitive changes.
:::
