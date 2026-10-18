---
title: Failover & Maintenance
description: How pair members elect and take over, planned and forced failover, maintenance mode, flap suspension, replacing a failed member, rotating the heartbeat key, and upgrading a serving pair.
sidebar_position: 4
tags: [operations, high-availability]
---

All pair actions live on the **HA Pairs** page: the **Failover** button and the row's **⋮** menu. They need the **Owner** or **Admin** role. Every action is recorded in the [audit log](/observability/audit-and-syslog).

## How the members decide

Each member's `elchi-ha` daemon runs a small state machine every 100 ms. Its roles are:

| Role | Meaning |
| --- | --- |
| **Init** | Starting up: listening for the peer (1 s), holds no VIP yet. |
| **Active** | Holds the pair's VIPs and serves the traffic. |
| **Standby** | Runs the same Envoys warm; ready to take the VIPs. |
| **Demoting** | Handing the VIPs to its peer (planned failover or leaving the pair). |
| **Maintenance** | Out of the election: hands its VIPs over and does not take them back. |
| **Fenced** | Took itself out after detecting that it is cut off; takes no VIPs. |
| **Unpaired** | `elchi-ha` runs but the box belongs to no pair. |

**Start-up.** A member that boots — including one back from a reboot or power cut — joins as **standby**. When nobody is active, the members elect: the higher **priority** wins once the peer has been heard steadily for a second. A member whose own data link or gateway is down does not stand. A box that boots without ever hearing its peer waits 60 s before it serves alone (or immediately with `system ha start-alone`).

**Takeover of a lost peer.** The standby takes the VIPs only when **all** of these hold:

1. no heartbeat on **any** path (data and management);
2. the peer's **data plane is down** — the standby's TCP probe of the active's VIP listeners fails (two failures spanning at least 1 s);
3. its own data link and VIP links have carrier, and its **gateway is not unreachable** (with no answering fence target, fencing is off and this check is skipped);
4. no hold-down (3 s after it last took or gave up the VIPs) and no misconfiguration.

A flap suspension, a heartbeat key mismatch or a clock skew does not stop the takeover of a peer whose data plane is down; a suspension blocks it only while the data plane reads *unknown*. A member that has just booted and never heard its peer also waits out the 60 s boot hold.

So a heartbeat partition with a working data plane never causes a split brain, and an isolated standby never steals the VIPs. When the pair has no data-plane target at all (no VIP yet, or UDP-only listeners), the probe reads *unknown* and the decision rests on the heartbeat and the gateway.

**Handovers from the active.** The active hands over (a planned handover, so the standby must be ready) when its data or VIP link loses carrier, when it loses its gateway while the peer still reaches its own, when one of its VIPs stays unhealthy, or when a listener unit is down for 10 s or more. The whole member moves, never a single VIP. If the peer cannot take an unhealthy VIP either, the active keeps serving it and raises *VIP unhealthy*.

**Two actives.** If both members ever hold the VIPs (for example after a healed partition), the one with the newer **epoch** wins and the other demotes at once; the winner re-announces its VIPs. A standby that finds a pair VIP on its own interfaces removes it, and the active probes its VIPs for duplicates every 2 s (*VIP conflict* if a foreign MAC answers).

## Planned failover

Click **Failover** on the pair. The confirmation names who hands the VIPs to whom; confirm with **Fail over**.

The active member first checks that the standby can take over: the peer is heard on every path, is standby, runs the same configuration revision and protocol, and is **ready for every VIP** (unit active, healthy, not held). Then it removes the addresses, the standby adds them and sends gratuitous ARP, and the roles swap — typically in about 50 ms. If the standby does not confirm within a second, the old active takes the VIPs back.

**Failover** is disabled, with the reason in its tooltip, when the pair has one member, a member is in maintenance or fenced, the standby is not ready, or the pair is not **Live** or **Failed over**.

If the active member refuses (*"The active member refused the failover"*), the UI offers **Force failover**.

## Forced failover

**⋮ → Force failover…** hands the VIPs over **without** the standby's readiness checks. If the standby is not ready, the services are down until it is — expect a short outage. Use it when the active member must give up the VIPs now.

:::note[When the outcome is unknown]
If the controller loses the active member during the command (HTTP 503 *"the failover's outcome is unknown"*), check the roles on the HA Pairs page before retrying — the handover may already have happened.
:::

## Failback

Preemption is off. After a failover the lower-priority member stays active and the pair reads **Failed over** — a healthy state. To move the VIPs back, do a planned failover at a quiet moment. Changing priorities only affects the **next** election, not the current roles.

## Maintenance mode

**⋮ → Maintenance on: \<member\>** takes a member out of the election, for hardware work or an OS upgrade you want to control by hand.

| Member | What happens |
| --- | --- |
| **Active** | The VIPs move to the peer now (a planned handover), then the member enters maintenance and does not take them back until maintenance is off. |
| **Standby** | It stops being a takeover candidate: if the active fails, nobody takes the VIPs over until maintenance is off. |
| **Only member** | The pair stops serving. Allowed only as **Force maintenance**, for a planned outage. |

- Only one member can be in maintenance at a time.
- If the box refuses (for example the peer cannot take over safely), the UI offers **Force maintenance**.
- Maintenance survives a daemon restart. **Maintenance off** returns the member to the election as **standby**.

## Flap suspension

Three **automatic** role changes within 10 minutes suspend the members' discretionary moves (alarm **Suspended**, pair **Degraded**). A peer that is provably dead (no heartbeat on any path and its data plane down) is still taken over, and carrier and gateway moves still happen. The suspension clears itself after 10 quiet minutes, or at once with `system ha clear` on the appliance console. The UI has no button for it; through the API, send the `SUB_HA_CLEAR` client command to the member (see [Appliance commands through the API](./api.md#appliance-commands-through-the-api)).

## Reboot and shutdown

Rebooting or shutting down an appliance from its console (and a factory reset) first runs a **planned handover** with listener draining (up to 2 s), so the active member's reboot loses no requests. The rebooted box comes back as **standby**. A box that loses power is handled as a lost peer (≈2 s takeover).

## Replacing a failed member

When a member is gone for good (dead hardware, deleted VM):

1. **Force-delete the dead client** on the Clients page. The dialog says *Client Is an HA Pair Member*: a force delete frees its slot. It is allowed only when the client is provably gone (disconnected and silent for at least 5 minutes).
2. The pair keeps running on the survivor, reads **Degraded** (*a member was lost*), and its **heartbeat key is rotated**, so the old box would be a stranger if it ever came back.
3. Install a fresh Elchi OS appliance, register it to the same project, and use **Add member** on the pair. All pair services are deployed to it and it joins as standby.

A member that is still connected cannot be removed on its own; leave the pair by unpairing instead.

## Rotating the heartbeat key

**⋮ → Rotate secret…** sends a new heartbeat key to both members. The old key stays accepted until both members have applied the new one, so the heartbeat is never interrupted; an offline member gets it when it reconnects. A second rotation is refused while one is in progress.

The keys are stored encrypted with a key derived from the controller's `ELCHI_JWT_SECRET`, which HA pairs therefore require. If you change `ELCHI_JWT_SECRET`, re-encrypt stored secrets with `elchi-backend elchi-reencrypt` (`ELCHI_REENCRYPT_OLD_SECRET` / `ELCHI_REENCRYPT_NEW_SECRET`, with `--check` and `--dry-run`). Otherwise pairs read **Degraded** (*the pair's key was sealed under a previous ELCHI_JWT_SECRET …*): failover keeps working on the boxes, but no configuration can be pushed.

## Push config and Sync now

- **⋮ → Push config** re-sends the pair's current configuration revision to the connected members. Use it when a member reports **Config pending**, a pair mismatch or a heartbeat key mismatch. A member already on the revision keeps running unchanged.
- **Sync now** (Sync column) retries the pair's pending deployments immediately and removes units that no service record accounts for. Removals held for an offline member complete when it reconnects.

The controller also does both on its own: it re-pushes unapplied revisions and retries pending work every 2 minutes.

## Upgrading a serving pair

**Upgrade the standby first, then fail over, then upgrade the other member.**

- **Elchi OS upgrades** enforce this order. On the active member `system upgrade apply` is blocked until the peer is a heard, ready standby already running the target version; on the only member of a pair it is blocked. The console offers an explicit override.
- **Agent upgrades** restart the agent and `elchi-ha` on the new binary; the role is kept, so even an in-place upgrade of the active member lost no requests in tests. A binary that fails to start is rolled back.
- While the members run different `elchi-ha` versions, the pair reads **Degraded** with the *Version skew* alarm — finish the upgrade on both. Members with different protocol **major** versions do not take over automatically (*Version mismatch*).
- **Envoy (listener) upgrades** on a pair are applied standby first, then to the active member, which keeps its role.
