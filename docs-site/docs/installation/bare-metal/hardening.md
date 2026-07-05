---
title: Production hardening (kernel + systemd)
description: The kernel sysctl baseline, MongoDB systemd drop-in, per-service systemd hardening set, and preflight RAM/swap checks applied by every install.
sidebar_position: 11
---

Every install lands a production tuning baseline. The defaults below come from the upstream production checklists for Envoy, MongoDB, and the Linux kernel — they're not opinionated guesses, they're the values these projects explicitly call out.

## Kernel sysctl (`/etc/sysctl.d/99-elchi-stack.conf`)

| Key | Value | Why |
|---|---|---|
| `net.core.somaxconn` | 65535 | listen() backlog ceiling for Envoy + nginx + grpc |
| `net.core.netdev_max_backlog` | 10000 | NIC RX queue per CPU |
| `net.ipv4.ip_local_port_range` | 10240-65535 | ~55K ephemeral ports for Envoy upstream + mongo failover churn |
| `net.ipv4.tcp_tw_reuse` | 1 | reuse TIME_WAIT sockets (RFC 6191 safe) |
| `net.ipv4.tcp_fin_timeout` | 15 | recycle FIN_WAIT2 (default 60) |
| `net.ipv4.tcp_keepalive_time` | 120 | detect dead peers in 2min, not 2hr |
| `net.ipv4.tcp_syncookies` | 1 | SYN flood protection (explicit) |
| `fs.file-max` | 2097152 | system-wide FD ceiling above any LimitNOFILE |
| `vm.swappiness` | 1 | never page out unless OOM (mongo prerequisite) |
| `vm.max_map_count` | 262144 | WiredTiger mmap regions |
| `fs.inotify.max_queued_events` | 65536 | event queue depth (default 16384) |
| `fs.inotify.max_user_instances` | 8192 | RHEL 9 default 128 — too low for VM/Grafana/mongo together |
| `fs.inotify.max_user_watches` | 524288 | RHEL 9 default 8192; Ubuntu already 524288 |
| `user.max_inotify_instances` | 8192 | per-userns (Linux 5.11+); default 128 |
| `user.max_inotify_watches` | 524288 | per-userns; default 65536 |

## MongoDB systemd drop-in (`/etc/systemd/system/mongod.service.d/10-elchi.conf`)

Mongo's package unit ships almost no resource limits; we override:

| Directive | Value | Why |
|---|---|---|
| `LimitNOFILE` | 64000 | file per collection + index + cursor + connection |
| `LimitNPROC` | 64000 | WiredTiger thread pool + connection pool |
| `LimitMEMLOCK` | infinity | required to silence the "ulimit -l too low" warnings |
| `OOMScoreAdjust` | -1000 | never let mongod be the OOM victim |
| `TasksMax` | infinity | cgroup task limit (default ~4915 on RHEL is not enough) |

Plus a one-shot `elchi-disable-thp.service` (`Before=mongod.service`) that writes `never` to `/sys/kernel/mm/transparent_hugepage/{enabled,defrag}`. THP-induced khugepaged compaction is the most common cause of second-scale latency spikes in WiredTiger.

## Per-service systemd hardening

Every elchi-* unit (envoy, otel, victoriametrics, grafana, registry, controller, control-plane, coredns) ships with a uniform hardening set:

- `NoNewPrivileges=true`, `PrivateTmp=true`
- `ProtectSystem=strict`, `ProtectHome=true`, `ReadWritePaths=` minimum
- `ProtectKernelTunables/Modules/ControlGroups/Logs=true`
- `ProtectClock=true`, `ProtectHostname=true`, `ProtectProc=invisible`, `ProcSubset=pid`
- `RestrictSUIDSGID=true`, `LockPersonality=true`, `RestrictRealtime=true`, `RestrictNamespaces=true`
- `SystemCallArchitectures=native`, `KeyringMode=private`, `RemoveIPC=yes`, `UMask=0077`
- `CapabilityBoundingSet=` (drop ALL) — except Envoy + CoreDNS keep `CAP_NET_BIND_SERVICE` for :443 / :53

Per-service resource limits:

| Unit | Limits | Notes |
|---|---|---|
| elchi-envoy | LimitNOFILE=1048576 (override `ELCHI_ENVOY_NOFILE`) | front-door scale needs 1M FDs |
| control-plane / controller / registry | LimitNOFILE=65536, LimitNPROC=65536, LimitMEMLOCK=64M | gRPC fan-in |
| otel / victoriametrics / coredns | LimitNOFILE=65536, LimitNPROC=65536/4096 | local sink + TSDB + DNS |
| grafana-server (drop-in) | LimitNOFILE=65536, LimitNPROC=4096, MemoryMax=1G | UI; not in hot path |

## Preflight RAM/swap checks

Before any side-effect, `preflight::check_ram_swap` warns if total system RAM is below 4 GB and if any swap is active. Both are soft warnings on a normal install; set `ELCHI_REQUIRE_HEALTHY=1` to escalate to fatal. To remove swap permanently:

```bash
sudo swapoff -a
sudo sed -i.bak '/\sswap\s/d' /etc/fstab
```

:::info[Verifying the hardening landed]
Run `sudo /etc/elchi/validate.sh` on every node. The "System tuning" section checks `somaxconn`, `vm.max_map_count`, `vm.swappiness`, `fs.file-max`, `fs.inotify.*`, THP state, swap state, mongo's `LimitNOFILE/MEMLOCK`, and envoy's `LimitNOFILE`.
:::
