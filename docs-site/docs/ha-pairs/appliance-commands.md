---
title: Appliance Commands
description: Inspect and operate an HA pair on the Elchi OS appliance itself — show ha, system ha commands, elchi-client ha, the elchi-ha service, its files, and the support bundle.
sidebar_position: 6
tags: [operations, high-availability, troubleshooting]
---

The members keep working without the control plane, so the appliance has its own view of the pair and its own controls. Use them when the controller is unreachable, or to see the boxes' live state (the UI lags by a few seconds).

## Elchi OS console

### `show ha`

Shows this box and its peer side by side:

```text
HA pair edge-ha (config rev 7)

                   THIS BOX (ha-a)                PEER (ha-b)
  role             ACTIVE  epoch 12               STANDBY  epoch 12
  since            3m0s ago
  heartbeat        —                              data ✓ 0.2s ago  mgmt ✓ 0.2s ago
  data plane       —                              unknown
  OS / elchi-ha    0.7.0 / v1.7.120               0.7.0 / v1.7.120
  takeover         —                              peer ready to take over
  maintenance      no
  reason           planned failover

VIPs
  172.31.1.45     ha-svc-10045                   present healthy ready        holder=self

Next-hops (floating gateway addresses)
  172.31.2.40     present ready                holder=self

gateway reachable · fencing on · clock skew 3ms
alarms: none
```

The example is abridged; values are illustrative. A suspended member adds a `SUSPENDED:` line, alarms are listed as `ALARM <key>: <text>`, and a member that is not in a pair prints *"this appliance is not a member of an HA pair"*.

`show ha json` prints the same as JSON (`{paired, stale, status}`). The screen warns when the daemon's state is older than 3 seconds. The status screen has an **HA:** line, and `show health` reports the daemon not running, misconfiguration, a key mismatch or a VIP conflict as critical, and fenced, maintenance, peer not heard, peer not ready, version skew and every other alarm as warnings.

### `system ha …`

| Command | What it does |
| --- | --- |
| `system ha failover` | Planned failover. Shows the pre-check, asks for confirmation and for the hostname to be typed. From the standby it asks the active to hand over. |
| `system ha maintenance on` / `off` | Maintenance mode for this box (asks to confirm `on`). |
| `system ha resend-garp` | Active only: announce the held VIPs again with gratuitous ARP — useful after a switch or router lost its ARP entries. |
| `system ha clear` | Clear a flap suspension. |
| `system ha start-alone` | Skip the boot-time wait for a peer that has never been seen (60 s) and serve alone. |

Reboot and shutdown from the console run a planned handover first. Network changes applied on a pair member show a warning, because they can affect the heartbeat paths and the VIP subnets.

## `elchi-client ha`

The same controls are available as a CLI (root, or the `elchi` user):

```bash
elchi-client ha status [--json]
elchi-client ha failover [--force]
elchi-client ha maintenance on|off [--force]
elchi-client ha prepare-shutdown [--wait 5s]
elchi-client ha resend-garp
elchi-client ha clear
elchi-client ha start-alone
elchi-client ha reload
elchi-client ha unconfigure
```

`--timeout` (default 5 s) applies to `resend-garp`, `clear`, `start-alone`, `reload` and `unconfigure`; `prepare-shutdown` waits up to `--wait`. A command the daemon refuses exits non-zero with the reason, except `prepare-shutdown`, which never fails. `elchi-client status` includes a one-line HA summary.

`ha status` prints the pair, role and epoch, the reason, the peer (with *ready to take over* or *not ready: …*), each heartbeat path, gateway and fencing, every VIP with `present / healthy / held / ready / holder`, and any alarms.

### Listener health holds

The VIP health gate still protects pair listeners: an Envoy that crash-loops is **held** (for 15 minutes) and the pair hands its VIP to the standby. After fixing the cause, release the hold with:

```bash
elchi-client vip resume <admin-port>
```

On the appliance console the same is `system listener resume <listener>`.

## The elchi-ha service

| Item | Value |
| --- | --- |
| Unit | `elchi-ha.service` (runs `elchi-client ha` as the `elchi` user with `CAP_NET_ADMIN` and `CAP_NET_RAW`; `Restart=always`, systemd watchdog 5 s) |
| Active only on a pair member | The unit starts only when `/var/lib/elchi/ha/pair.json` exists. |
| Logs | `journalctl -u elchi-ha` |
| Pair configuration | `/var/lib/elchi/ha/pair.json` (written by the agent from the controller's configuration; the previous copy is kept as `pair.json.prev`) |
| Live state | `/run/elchi-ha/status.json` (rewritten every second) |
| Role file | `/var/lib/elchi/state/ha-role` — read by the listener units; a role from an earlier boot never brings a VIP up |
| Control socket | `/run/elchi-ha/ha.sock` |
| Firewall | Table `inet elchi_ha` (standby egress drop) and the appliance's `ha_guard` chain for UDP 8650 |

Restarting `elchi-ha` on the active member keeps its role and VIPs. Stopping it sends a goodbye to the peer, which holds off for 3 seconds before deciding anything.

## Support bundle

The appliance's support bundle has an `ha/` section: `elchi-ha` journals for this and the previous boot, `status.json`, the role and pair markers, `pair.json` with secrets redacted, the `elchi_ha` firewall table, the ARP kernel settings and the interface addresses. Attach it to any HA support request.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| The member never becomes active, peer says *not ready* | `show ha` alarms: *Misconfigured* (kernel ARP settings), *Gateway unreachable*, *Suspended*, *Heartbeat key mismatch*. |
| *Heartbeat key mismatch* | **Push config** from the HA Pairs page. A replaced member that came back keeps this alarm by design. |
| One heartbeat path down | UDP 8650 between the two addresses of that path; NIC and addressing on both boxes. |
| Clients still reach the old box after a failover | The switch or router kept a stale ARP entry: `system ha resend-garp`, and check that GARP is accepted on that network. |
| VIP unreachable from some hosts after adding a NIC | Restart the agent so the pair learns the new addresses; check the VIP is on a subnet **both** members have. |
| Long outage on power loss with BGP | Enable **BFD** on the members' neighbours, or lower the BGP timers. |
| *Suspended* after testing | Wait 10 quiet minutes or run `system ha clear`. |
