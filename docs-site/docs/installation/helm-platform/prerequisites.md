---
title: Prerequisites
description: Cluster, tooling, and resource requirements before installing the Elchi platform Helm chart.
sidebar_position: 2
---

- Kubernetes cluster (**v1.21+**)
- Helm **3.0.0+** installed locally
- `kubectl` configured with cluster access
- About **2 CPU cores, 4 GB RAM and 20 GB of disk** free for the default install (one replica of each component). Production replica counts need more; see [Production](/installation/helm-platform/production).
- A default storage class for persistent volumes (MongoDB 5 GB, VictoriaMetrics 5 GB, ClickHouse 10 GB) — only required when using the built-in MongoDB / VictoriaMetrics / ClickHouse
- A free NodePort for the gateway: `30000` by default, changed with `global.envoy.service.httpNodePort`
