---
title: Single-Host (kind + Helm)
description: Evaluate the full Elchi stack on a single Ubuntu 24.04 VM — the root installer auto-provisions Docker, kind, kubectl and Helm and deploys the elchi-stack chart into a local kind cluster.
sidebar_position: 3
tags: [installation, docker]
---

The root installer in [elchi-archive](https://github.com/CloudNativeWorks/elchi-archive) brings the full Elchi stack up on a **single Ubuntu 24.04 VM** with no existing Kubernetes cluster. It auto-provisions everything — Docker, kind, kubectl and Helm — creates a local kind cluster, and installs the `elchi-stack` Helm chart into it. It is the fastest way to get a complete evaluation environment on one machine.

:::note This wraps the Helm chart
Under the hood this runs the same `elchi-stack` Helm chart as the production Kubernetes install — it just provides the cluster (a local kind cluster) for you. For a real Kubernetes deployment, use the [Helm platform install](/installation/helm-platform/overview) against your own cluster.
:::

## When to use it

| Path | Use when |
|---|---|
| **kind + Helm** (this) | Evaluation or a single VM with **no existing Kubernetes cluster** |
| [**Helm**](/installation/helm-platform/overview) | You already run Kubernetes (production) |
| [**Docker Swarm**](/installation/docker-swarm/overview) | Containers on one or more hosts **without** Kubernetes |
| [**Bare-metal / systemd**](/installation/bare-metal/overview) | No container runtime — plain systemd services |

## Prerequisites

- **Ubuntu 24.04** (minimal install). The script warns on other distros/versions.
- **Root or sudo** privileges and internet connectivity.
- **~15 GB free disk** (20 GB recommended) — Docker images, the kind cluster, and the Elchi containers.

## Install

Clone the repo and run the root `install.sh` with your address and the port to expose:

```bash
git clone https://github.com/CloudNativeWorks/elchi-archive.git
cd elchi-archive
./install.sh <mainAddress> <port>
```

For example:

```bash
./install.sh elchi.example.com 8080
./install.sh 192.168.1.100 30080
```

- `mainAddress` — the DNS name or IP clients use to reach Elchi.
- `port` — the port to expose the UI on (1–65535); it is mapped into the kind cluster.

## What it does

The installer runs through a fixed sequence:

1. **Validates the OS** (expects Ubuntu 24.04) and checks sudo access + disk space.
2. **Installs the required tools** if missing: Docker (from the official Docker apt repo), **kubectl**, **kind `v0.20.0`**, **Helm**, and network utilities.
3. **Creates the `elchi-cluster` kind cluster** — one control-plane + two worker nodes — with your `<port>` mapped from container to host, and waits for all nodes to be Ready.
4. **Adds the Elchi Helm repo** (`https://charts.elchi.io/`) and installs the **`elchi-stack`** chart into the `elchi-stack` namespace, passing `global.mainAddress`, `global.port`, and standard-class persistent storage for MongoDB and VictoriaMetrics.
5. **Verifies** the pods and services and prints a summary.

When it finishes, the UI is reachable at `http://<mainAddress>:<port>`. Pods may still be starting in the background:

```bash
kubectl get pods -n elchi-stack -w
```

## Teardown

The root `uninstall.sh` removes the kind cluster and the tools it installed, while **preserving Docker itself** and other system packages:

```bash
./uninstall.sh
```

It deletes the `elchi-cluster` kind cluster, cleans up the Elchi/kind/mongo/victoriametrics/envoy Docker images, and removes the `kubectl`, `kind` and `helm` binaries. To remove only the cluster and keep the tooling, run `kind delete cluster --name elchi-cluster` instead.

## Next steps

- Log in and create your first configuration — see the [Quickstart](/getting-started/quickstart).
- Moving to production Kubernetes — see the [Helm platform install](/installation/helm-platform/overview).
