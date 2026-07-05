---
title: /etc/elchi/validate.sh — per-node post-install audit
description: Read-only per-node audit script that checks systemd, ports, service health, Envoy admin, config integrity, and system tuning.
sidebar_position: 7
---

Read-only. The installer drops this on EVERY node so you can confirm the install end-to-end without leaning on the orchestrator. Run it on each machine after install (or any time you want a sanity check):

```bash
sudo /etc/elchi/validate.sh
```

What it walks (in order):

- **Topology context** — this node's index, role flags (`runs_mongo`, `runs_otel`, `runs_coredns`, …), `backend_variants` set.
- **Systemd** — every `elchi-*` unit + mongod / grafana-server / nginx (where present). Active = ✓, activating = warning, failed/inactive = ✗. Watchdog timer state checked separately.
- **Listening ports** — compares `ss -lntp` against expected per-node + M1-singleton + per-variant control-plane ports. Flags any M1-only port that shows up on Mn (and vice-versa).
- **Service health** — OTel `:13133` health (every node). M1 only: `mongod` ping via mongosh, VictoriaMetrics `/api/v1/query`, Grafana `/api/health`.
- **Envoy admin** — `/ready`, `/clusters` health flags for every cluster (registry / controller-rest / otel / grafana / vm + every per-node controller and control-plane), `/listeners` bind verification.
- **Config integrity** — sha256 of `envoy.yaml`, `topology.full.yaml`, `ports.full.json`, `nodes.list`, `tls/server.crt`. Compare hashes by hand across nodes to confirm the bundle distributed cleanly.
- **Stale variant detection** — flags any `/etc/elchi/<variant>/` dir or `elchi-control-plane-<sanitized>@.service` unit whose tag isn't in the active `backend_variants` list.
- **System tuning** — sysctl probe (somaxconn, max_map_count, swappiness, fs.file-max, fs.inotify.*), THP state, swap state, mongod LimitNOFILE/LimitMEMLOCK, envoy LimitNOFILE.
- **CoreDNS GSLB ports** (when enabled) — `53/tcp`, `53/udp`, `8053`.

Output is colored, with a final `PASS / WARN / FAIL` count. Exit code is non-zero on any FAIL.

:::info[Why per-node?]
The installer renders Envoy bootstrap + bundle on M1 and SCPs to Mn — drift between nodes is the most common "weird symptom" cause. Running validate on each box and diffing the sha256 lines surfaces it in one shell command.
:::
