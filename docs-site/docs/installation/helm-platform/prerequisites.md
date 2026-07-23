---
title: Prerequisites
description: Cluster, tooling, and resource requirements before installing the Elchi platform Helm chart.
sidebar_position: 2
---

- Kubernetes cluster (**v1.21+**)
- Helm **3.0.0+** installed locally
- `kubectl` configured with cluster access
- Minimum **4 GB RAM** and **2 CPU cores** available per node
- A storage class for persistent volumes — only required when using the built-in MongoDB / VictoriaMetrics / ClickHouse
