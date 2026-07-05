---
title: Production Checklist & DR
description: A go-live checklist tying together TLS, HA, persistent datastores, hardening, monitoring, backups, and shield source-IP trust — plus a disaster-recovery runbook grounded in Elchi's restart-safe, last-good config behavior.
sidebar_position: 12
tags: [operations]
---

Elchi's production concerns are documented across several pages — TLS, HA replicas, storage, hardening, backups, alerting. This page pulls them into one **pre-flight checklist** and a **disaster-recovery runbook**, so nothing scattered gets missed on the way to go-live.

## Go-live checklist

Work top to bottom. Each item links to the page with the actual how-to; this is the index, not the manual.

### Security & access

- [ ] **TLS enabled.** Set `global.tlsEnabled: true` and a real `global.mainAddress` (the office example does — `values_office.yaml` ships `tlsEnabled: true`, `port: "443"`). The chart default is `tlsEnabled: false`, which is for local bring-up only.
- [ ] **Strong JWT secret.** The chart ships a **placeholder** `global.jwt.secret` marked *"important! change this value"*. Rotate it to a strong, unique secret before exposing the platform. See [Security](/installation/helm-platform/security).
- [ ] **CORS locked down.** `global.cors.allowedOrigins` defaults to `"*"`. Set it to your actual UI origin(s) for production.
- [ ] **RBAC roles assigned.** Confirm real users have the least-privilege roles they need — see [Auth & Access](/administration/auth-and-access).
- [ ] **Edge hardening applied.** Loopback-only binds, systemd sandboxing, and file permissions on each edge — see [Bare-Metal Hardening](/installation/bare-metal/hardening).

### High availability & data durability

- [ ] **HA replicas in place.** Keep the default **4** controllers / **4** control-planes (`global.elchiBackend.controllerDefaultReplicas` / `controlPlaneDefaultReplicas`). Understand how leader election + standby hydration make them resilient — [Registry & HA](/administration/registry-and-ha).
- [ ] **External, persistent datastores.** The bundled single-replica MongoDB/ClickHouse/VictoriaMetrics PVCs are get-started defaults. For production, use **external replicated stores** (the office example sets `installMongo: false` with an external replica set). Confirm every datastore has persistence and a storage class — [Storage](/installation/helm-platform/storage), [Production Deployment](/installation/helm-platform/production).
- [ ] **Capacity sized from measured traffic.** Don't ship the default PVCs blind — size ClickHouse especially from a measured day of traffic. [Sizing & Capacity](/administration/sizing-and-capacity).
- [ ] **Backups scheduled.** MongoDB (the system of record) has a running, *tested* backup/restore job — [Backup & Restore](/administration/backup-restore).

### Observability

- [ ] **Monitoring wired.** Shield and collector metrics are reaching Prometheus/VictoriaMetrics (scrape and/or OTLP push) — [Metrics & Logs](/observability/metrics-and-logs).
- [ ] **Alerts configured.** At minimum the Tier-1/Tier-2 rules from [Recommended Alerts](/observability/alerting): config-reload failures, audit drops/export errors, fail-close spikes, goroutine leaks.
- [ ] **Audit sink configured.** Shield audit goes to ClickHouse (`--audit-clickhouse-dsn`) or OTLP (`--audit-otel-endpoint`); with **neither set, audit is off** (there is no local-file sink). Verify `elchi_shield_audit_enabled == 1` on edges where you expect audit.

### Shield edge correctness

- [ ] **Source-IP trust configured.** This is easy to get wrong and silently breaks every source-IP control. On the Envoy in front of shield, set `use_remote_address` and the correct number of trusted hops, and set shield's `--xff-trusted-hops` to match your proxy depth. The default is `0` (the immediate hop Envoy appends — the secure default); **never** let a source-IP control read the spoofable leftmost `X-Forwarded-For` token. The collector needs the same Envoy setting for its `source_ip_hash` — see the source-IP note in [Collector Reference](/api-discovery/collector-reference).
- [ ] **Shield is loopback-only.** ext_proc over a Unix socket (default) or loopback TCP; a non-loopback bind is refused unless `--allow-non-loopback`. Confirm no edge overrode that.
- [ ] **Memory bounds set.** `--mem-limit-bytes` (`GOMEMLIMIT`) sits **well above** `--max-inflight-body-bytes` (default `256MiB`), and the container/host memory limit is above that. [Sizing & Capacity](/administration/sizing-and-capacity).
- [ ] **`/readyz` gates rollout.** A shield with no valid policy is deliberately **not ready** — make sure your rollout waits on `/readyz` so an edge never serves traffic with an empty config.

## Disaster recovery runbook

Elchi degrades gracefully by design, and only **one** store is irreplaceable. Knowing which is which is the whole runbook.

### What to back up (and what not to)

| Data | Store | Backup posture |
| --- | --- | --- |
| **Configuration (system of record)** | MongoDB | **Back this up.** It is the canonical source of truth — everything else is derived or rebuildable. Use [Backup & Restore](/administration/backup-restore). |
| API inventory / discovery | MongoDB | Backed up with MongoDB; also *rebuildable* from ongoing traffic if lost. |
| API events (forensic) | ClickHouse | **Telemetry — TTL'd and rebuildable** from ongoing traffic (`RETENTION_DAYS`, default 7). Back up only if you have a compliance retention requirement beyond the TTL. |
| Shield audit findings | ClickHouse | Same — TTL'd (default 7 days), forensic. Rebuildable only going forward, not retroactively. |
| Metrics | VictoriaMetrics | Telemetry, retention-bounded (`15d` default). Not part of DR. |
| Shield edge policy | Files on each edge | **Restart-safe from disk** — no central backup needed (see below). |

The one-line summary: **back up MongoDB; treat ClickHouse and VictoriaMetrics as rebuildable telemetry.**

### How the platform degrades (why most failures aren't outages)

Elchi is built so that partial failures fail safe rather than fail down:

- **A bad config push does nothing.** Config reload is atomic — an invalid config is rejected and **the last-good config stays active**. Shield surfaces this via `config_reload_failures_consecutive` and the `/configz` reload error; the collector via `runtime_config_poll_failures_total`. Traffic is never affected by a bad push.
- **A down audit/metrics sink is non-fatal.** If shield's audit sink is unreachable or misconfigured, it **degrades to no-audit** and keeps protecting traffic (watch `audit_enabled` / `audit_export_errors_total`). The metrics OTLP push is likewise non-fatal — a down collector never stops shield, and `/metrics` scraping keeps working.
- **Edges are isolated from the control plane.** Shield enforces from its **local** config files. If the entire central platform is down, every edge keeps enforcing its last-good policy — you lose the ability to *push changes* and to *collect* events/metrics, not the ability to *protect* traffic. The collector's `drop_new` backpressure means a slow/absent sink drops events rather than back-pressuring Envoy.
- **Control-plane instance failure is survivable.** Multiple controllers share one MongoDB, elect a leader for singleton work, and standbys hydrate from registry snapshots — [Registry & HA](/administration/registry-and-ha).

### Restore order

Restore in dependency order — the system of record first, telemetry last (or never):

1. **MongoDB first.** Restore the configuration/inventory from your backup — [Backup & Restore](/administration/backup-restore). Nothing else is meaningful until the source of truth is back.
2. **Bring up the control plane** (Controller, Control-Plane, Registry) pointed at the restored MongoDB. Confirm the Registry shows the expected instance count and a leader is elected.
3. **Rebuild derived stores as needed.** ClickHouse and VictoriaMetrics do **not** need restoring for the platform to function — they refill from live traffic within their retention windows. Provision empty stores; the collector recreates its tables (TTL applies only to newly created tables — see [Collector Reference](/api-discovery/collector-reference)).
4. **Edges need no action.** They kept enforcing their last-good local policy throughout; once the control plane is back, normal pushes and event collection resume automatically.

### Runbook: "we lost the control plane"

The failure that sounds worst but is the most survivable:

1. **Confirm the blast radius.** Edges keep protecting traffic from local config — verify by checking a sample edge's `/healthz` and that it's still returning decisions. The outage is *management + telemetry*, not *data-plane protection*.
2. **Restore MongoDB** from the latest backup onto healthy infrastructure (Step 1 above). This is the only step that recovers irreplaceable state.
3. **Redeploy the backend** against the restored MongoDB. Watch the Registry come back to full instance count and a leader get elected ([Registry & HA](/administration/registry-and-ha)).
4. **Provision fresh telemetry stores** (ClickHouse, VictoriaMetrics) — empty is fine; they refill from live traffic. Only restore ClickHouse from a backup if a compliance mandate requires forensic history older than the gap.
5. **Reconnect edges.** Once the control plane is healthy, `elchi-client` resumes config pushes and event/metric flow. Confirm on a sample edge that `config_age_seconds` drops after your first post-recovery push and that `audit_enabled == 1` again.
6. **Post-incident:** the gap in ClickHouse/VictoriaMetrics is expected and unrecoverable (it's TTL'd telemetry). Note the window; no data-plane security was lost during it.

:::warning[Test the restore, not just the backup]
The DR properties above (last-good config, non-fatal sink loss, edge isolation) mean the platform *tolerates* failures — but the one irreplaceable store, MongoDB, is only as good as a **restore you have actually rehearsed**. Schedule and periodically test the MongoDB restore per [Backup & Restore](/administration/backup-restore). A backup you've never restored is a hypothesis.
:::

## See also

- [Backup & Restore](/administration/backup-restore) — MongoDB backup/restore procedure.
- [Registry & HA](/administration/registry-and-ha) — control-plane resilience and leader election.
- [Storage](/installation/helm-platform/storage) · [Production Deployment](/installation/helm-platform/production) — persistent, external datastores.
- [Bare-Metal Hardening](/installation/bare-metal/hardening) · [Security](/installation/helm-platform/security) — edge and platform hardening.
- [Recommended Alerts](/observability/alerting) — the monitoring that tells you a DR event is starting.
- [Sizing & Capacity](/administration/sizing-and-capacity) — provisioning the restored stores.
