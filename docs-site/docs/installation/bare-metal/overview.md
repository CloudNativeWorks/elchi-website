---
title: Bare-Metal Install (no Docker, no Kubernetes)
description: How the standalone installer brings the entire Elchi stack up as systemd services on 1, 2, or 3+ Linux VMs.
sidebar_position: 1
---

The standalone installer brings the entire Elchi stack up as **systemd services** on 1, 2, or 3+ Linux VMs — no Kubernetes, no Helm, no Docker required. The script runs once on the first node ("M1", the local machine) and SSHes into the rest to provision them. Source lives at [elchi-archive/deploy/standalone/](https://github.com/CloudNativeWorks/elchi-archive/tree/main/deploy/standalone); the installer itself is unversioned and always runs from the `main` branch. Component versions (elchi-backend, UI, envoy, coredns) are pinned per-flag.

| Component | Where it runs | Default port |
|---|---|---|
| **Envoy** (front-door) | Every node | 0.0.0.0:443 (TLS), 127.0.0.1:8080, 127.0.0.1:9901 (admin) |
| **nginx** (UI) | Every node | 127.0.0.1:8081 |
| **elchi-registry** | Every node (HA peer set, gRPC HC pins to leader) | :1870 gRPC, :9091 metrics |
| **elchi-controller** | Every node (singleton) | :1960 gRPC, :1980 REST |
| **elchi-control-plane** | Every node (one per backend variant) | :1990 (per variant) |
| **OTel Collector** | Every node (local sink for envoy `/opentelemetry`) | :4317 gRPC, :4318 HTTP, :13133 health (`:8888` self-metrics is otelcol's built-in default — not configured or firewall-opened by the installer) |
| **elchi-collector** | Every node (ALS sink — Envoy data-plane proxies push Access Log Service streams here; writes to local ClickHouse + MongoDB). Opt out with `--no-collector` | :18090 gRPC, :18091 HTTP/metrics |
| **MongoDB** | 1–2 VM: M1 standalone · 3+ VM: M1+M2+M3 RS · 4+: no extra members | :27017 |
| **ClickHouse** | 1–2 VM: standalone · 3+ VM: clustered with embedded Keeper on each member (Replicated engine, replicated tables) | :9000 native, :8123 HTTP, :9009 interserver (3+), :9181/:9234 Keeper (3+) |
| **VictoriaMetrics** | M1 only (or external via `--vm=external`) | :8428 |
| **Grafana** | M1 only (proxied at `/grafana/`) | 127.0.0.1:3000 |
| **CoreDNS GSLB** | Every node (default-on, zone defaults to `elchi.local`; opt out with `--no-gslb`) | :53 tcp+udp, :8053 webhook |
