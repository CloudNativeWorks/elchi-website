---
title: HA Pairs API
description: REST reference for HA pairs — list, create, update, delete, add a member, failover, maintenance, push, sync — and the HA client commands.
sidebar_position: 7
tags: [operations, high-availability, api]
---

All endpoints are under **`/api/v3/ha`**, need an **Owner** or **Admin** token, and take the project as the `project` query parameter (in the body on create). Errors return `{"message": "..."}`. If the controller runs without `ELCHI_JWT_SECRET`, every route answers `503` *"HA pairs are not available on this controller"*.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v3/ha/pairs?project=` | List the project's pairs. |
| `GET` | `/api/v3/ha/pairs/eligible?project=&for_pair=` | Elchi OS clients that can join a pair, with `selectable` and `disabled_reason`. |
| `GET` | `/api/v3/ha/pairs/:pair_id?project=` | One pair. |
| `POST` | `/api/v3/ha/pairs` | Create a pair from one or two clients. |
| `PUT` | `/api/v3/ha/pairs/:pair_id?project=` | Rename, priorities, address overrides, heartbeat timing, fence targets, next-hops, key rotation. |
| `DELETE` | `/api/v3/ha/pairs/:pair_id?project=[&force=true]` | Unpair. |
| `POST` | `/api/v3/ha/pairs/:pair_id/members?project=` | Fill the vacant slot (second member or replacement). |
| `POST` | `/api/v3/ha/pairs/:pair_id/failover?project=` | Planned (or forced) failover. |
| `POST` | `/api/v3/ha/pairs/:pair_id/maintenance?project=` | Maintenance on/off for a member. |
| `POST` | `/api/v3/ha/pairs/:pair_id/push?project=` | Re-send the configuration to the connected members. |
| `POST` | `/api/v3/ha/pairs/:pair_id/sync?project=` | Retry pending service work (asynchronous, `202`). |
| `GET` | `/api/v3/ha/pairs/:pair_id/services?project=` | The services the pair serves. |

## The pair object

```json
{
  "id": "6712…",
  "name": "edge-ha",
  "project": "6501…",
  "members": [
    { "slot": 0, "client_id": "…", "name": "ha-a", "priority": 200,
      "hb_addrs": { "data": { "auto": "172.31.1.31", "prefix": "172.31.1.0/24" },
                    "mgmt": { "auto": "10.20.0.131" } } },
    { "slot": 1, "client_id": "…", "name": "ha-b", "priority": 100, "hb_addrs": { "…": "…" } }
  ],
  "hb": { "port": 8650, "interval_ms": 250, "misses": 3 },
  "fence_targets": ["172.31.1.1"],
  "preempt": false,
  "config_rev": 7,
  "state": "ok",
  "status": "live",
  "members_ha": { "<client_id>": { "role": "active", "epoch": 12, "peer_ok": true, "…": "…" } },
  "connected": { "<client_id>": true },
  "sync": { "pending": [] },
  "service_count": 3
}
```

Empty fields (no vacancy, no next-hops, no alarms, no status reason, nothing missing) are left out of the response.

- `status` — `split_brain`, `no_active`, `handing_over`, `config_pending`, `syncing`, `degraded`, `awaiting_peer`, `failed_over`, `live`, `unknown` (see [Monitoring](./monitoring.md#pair-status)).
- `vacancy` — the empty slot of a one-member pair: `{slot, priority, since?, reason?}`. `since`/`reason` (for example `force_delete`) are set when a member was lost.
- `members_ha` — what each member reports: `role` (`init`, `active`, `standby`, `demoting`, `maintenance`, `fenced`, `unpaired`), `epoch`, `since`, `reason`, `daemon` (`running`, `absent`, `stale`, `misconfigured`), `peer_role`, `peer_ok`, `paths[]`, `peer_dataplane` (`up`, `down`, `unknown`), `gateway_reachable`, `fencing_enabled`, `config_rev_applied`, `maintenance`, `vips[]` (`vip`, `admin_port`, `unit`, `present`, `healthy`, `held`, `ready`, `holder`: `self`/`peer`/`none`/`conflict`), `daemon_version`, `clock_skew_ms`, `alarms[]`.
- The heartbeat key is never returned.

## Create

```http
POST /api/v3/ha/pairs
{
  "name": "edge-ha",
  "project": "<project-id>",
  "members": [
    { "client_id": "<loaded-client>", "priority": 200 },
    { "client_id": "<empty-client>",  "priority": 100, "data_override": "172.31.1.32" }
  ],
  "hb": { "port": 8650, "interval_ms": 250, "misses": 3 },
  "fence_targets": ["172.31.1.1"],
  "next_hops": []
}
```

Returns `201` with the pair. One member creates an HA-mode pair (`awaiting_peer`). If one member has services they are synced to the other one in the background.

## Update

`PUT` accepts any of `name`, `members` (`client_id` with `priority`, `data_override`, `mgmt_override`), `hb`, `fence_targets`, `next_hops`, and `"rotate_secret": true`. **Send `[]` to clear a list** — `null` means "not given", and a body that changes nothing is refused (`400` *"invalid request: nothing to change (to clear next_hops or fence_targets send [], not null)"*). Every successful update raises `config_rev` and pushes the new revision to the members.

## Members, failover, maintenance

```http
POST /api/v3/ha/pairs/:pair_id/members?project=<id>
{ "client_id": "<id>", "priority": 100, "interfaces": { "<service>": "<openstack-interface-id>" } }

POST /api/v3/ha/pairs/:pair_id/failover?project=<id>
{ "force": false }

POST /api/v3/ha/pairs/:pair_id/maintenance?project=<id>
{ "client_id": "<id>", "enabled": true, "force": false }
```

- `failover` answers with the members' state a few seconds later. If the active member refuses, it answers `409` with `"refused": true` — retry with `"force": true` only if you accept a possible short outage. A `503` means the outcome is unknown: read the pair before retrying.
- `interfaces` is needed only for OpenStack members.
- There is no endpoint to remove a single member: force-delete a dead client with `DELETE /api/op/clients/:id?force=true`, or delete the pair.

## Delete

`DELETE` refuses a pair that still serves services with `409` and a `services` list. `?force=true` deletes it anyway (all members must be connected): the services stay on one member and are removed from the other.

## Appliance commands through the API

The appliance-side actions without their own endpoint are sent as client commands with `POST /api/op/clients`:

```json
{
  "type": "HA",
  "sub_type": "SUB_HA_RESEND_GARP",
  "clients": [{ "client_id": "<member-id>" }],
  "command": { "project": "<project-id>" }
}
```

| `sub_type` | Effect |
| --- | --- |
| `SUB_HA_RESEND_GARP` | Re-announce the held VIPs. |
| `SUB_HA_CLEAR` | Clear a flap suspension. |
| `SUB_HA_START_ALONE` | Skip the boot-time wait for the peer. |
| `SUB_STATUS` | Refresh the member's HA state (also allowed to Editors and Viewers). |

The others require Owner or Admin.

## Common errors

| HTTP | Message |
| --- | --- |
| 400 | HA pairs need Elchi OS appliances; this client is not one |
| 400 | the client has not reported its HA addresses (agent too old, or no usable IPv4 address) |
| 400 | invalid request: the heartbeat port is fixed at 8650 (the appliance firewall opens only that port) |
| 400 | invalid request: hb interval 100-1000 ms, misses 2-10 · invalid request: priority N is outside 1-1000 · invalid request: the members' priorities must differ (both N) |
| 404 | HA pair not found · client not found in the project |
| 409 | an HA pair with this name already exists in the project |
| 409 | the client is already a member of an HA pair · the client is not connected |
| 409 | both clients have services; pair an empty client with a loaded one |
| 409 | a client joining a pair that already serves must have no services · the pair has no vacant slot |
| 409 | the pair still has services deployed; undeploy them first or delete with force |
| 409 | the pair has a single member; there is nobody to fail over to · failover refused by the active member |
| 409 | the other member is in maintenance · a secret rotation is in progress · an HA pair member is offline |
| 503 | no answer from the active member; the failover's outcome is unknown — check the pair's roles |
