---
title: elchi-stack — operator helper
description: Subcommand reference for the elchi-stack operator helper installed on every node.
sidebar_position: 8
---

Installed at `/usr/local/bin/elchi-stack` on every node. M1 is the orchestrator (where SSH credentials are persisted) — most subcommands are intended to run from there.

| Subcommand | Description |
|---|---|
| `elchi-stack status` | Cluster-wide service summary (each node's `systemctl is-active` for every elchi-* unit). |
| `elchi-stack logs <unit> [-f]` | Tail journalctl for the named unit on every node. `-f` follows; per-line `[host]` prefixing keeps streams readable, Ctrl+C exits cleanly. |
| `elchi-stack reload-envoy` | Re-render Envoy bootstrap + restart Envoy on every node (after a topology change). |
| `elchi-stack add-node <ip>` | Extend the cluster: provision the new node with the existing bundle, recompute topology, push updated `/etc/hosts` + Envoy bootstrap to all peers. |
| `elchi-stack init-replica-set` | Run `rs.initiate()` on M1 (idempotent — checks `rs.status()` first). |
| `elchi-stack mongo-status` | M1-only: `rs.status()` snapshot — PRIMARY identification, per-member state / health / uptime / replication lag / lastHeartbeatMessage. Recovery hint surfaces when `NotYetInitialized` (gate dropped between phase 1 and `rs.initiate()`). |
| `elchi-stack clickhouse-status` | Local ClickHouse + Keeper diagnostics: version, uptime, Keeper quorum reachability, `system.clusters` member health, `elchi` database engine (`Replicated` in cluster mode), replicated tables. |
| `elchi-stack mongosh [args...]` | Open mongosh against the local mongod, authenticated as root via `/etc/elchi/mongo/root.env`. Pass any further mongosh args (`--eval 'rs.status()'`, scripts, etc.). |
| `elchi-stack ch-client [args...]` | Open clickhouse-client against the local server, authenticated as the `elchi` user from `secrets.env`. |
| `elchi-stack ssh <node>` | Open an SSH session to a cluster node using the persisted cluster credentials from `/etc/elchi/orchestrator.env` — no flags needed. |
| `elchi-stack stack-version` | One-screen "what's actually installed on this node" report: cluster-wide pins from `topology.full.yaml` + binary versions on this host (mongo, clickhouse, envoy, otel, grafana, nginx, elchi-collector, backend variants). |
| `elchi-stack tls-info` | Cluster TLS cert summary: subject, SAN list, validity window, days-to-expiry (colored red &lt; 30, yellow &lt; 90), sha256 fingerprint. |
| `elchi-stack endpoint-test` | Round-trip probe through the public Envoy: UI `/`, VictoriaMetrics `/api/v1/query`, Grafana `/grafana/api/health`, internal plaintext listener `:8080/`. Prints HTTP status for each. |
| `elchi-stack collector-stats` | Per-node elchi-collector metrics summary (from `:18091/metrics`): events received / dropped, active ALS streams, batcher queue depth, ClickHouse rows inserted, ClickHouse / Mongo errors, flush count, pipeline panics. Best-effort — missing metrics render as 0. |
| `elchi-stack export-bundle <out> [--reuse-bundle-key]` | Repackage cluster artifacts into an encrypted bundle. `--reuse-bundle-key` uses the install-time key persisted via systemd-creds at `/etc/elchi/.bundle-key` so the bundle can be reapplied without redistributing a fresh decryption key. |
| `elchi-stack show-secret <name>` | Print a stored credential without rotating it. `name` ∈ `grafana \| jwt \| gslb \| mongo-app \| mongo-root \| clickhouse \| collector \| bundle-key \| all`. `collector`'s HASH_SALT is never rotatable — rotating it breaks event correlation. `bundle-key` re-decrypts `/etc/elchi/.bundle-key` when sealed via systemd-creds. Persisted in `/etc/elchi/secrets.env` (mode 0600 root:root); preserved across re-runs and upgrades. |
| `elchi-stack rotate-secret <jwt\|gslb\|grafana>` | Mint a new JWT, GSLB, or Grafana admin password. JWT/GSLB get re-rendered into every variant's `common.env` and pushed cluster-wide via SSH; Grafana password gets re-applied via `grafana-cli` on M1 only (singleton). |
| `elchi-stack verify` | End-to-end cluster health: per-node systemd + Envoy admin `/clusters` health flags + Envoy `/listeners` public listener bind + ClickHouse Keeper leader probe + (M1-side) mongo RS PRIMARY probe. |
