---
title: Quick Start
description: Spin up the full Elchi stack on any Kubernetes cluster with three commands using the Helm chart's bundled MongoDB and VictoriaMetrics.
sidebar_position: 2
---

Spin up the full Elchi stack on any Kubernetes cluster with three commands. The default chart bundles MongoDB and VictoriaMetrics so you get a working install with zero external dependencies.

:::tip Not on Kubernetes?
This page uses Helm on an existing cluster. Prefer a different substrate? Elchi installs the same control plane on **[Docker Swarm](/installation/docker-swarm/quickstart)** (one command, container-based), a **[single VM with kind](/installation/kind-quickstart)** (evaluation), or **[bare-metal systemd](/installation/bare-metal/overview)** (no containers).
:::

## 1. Add the Helm repository

```bash
# Add Elchi Helm repository
helm repo add elchi https://charts.elchi.io
helm repo update
```

## 2. Install the stack

```bash
helm install my-elchi elchi/elchi-stack \
  --set-string global.mainAddress="your-domain.com" \
  --namespace elchi-stack \
  --create-namespace
```

## 3. Verify the install

```bash
# Check pod status
kubectl get pods -n elchi-stack

# Inspect service endpoints
kubectl get svc  -n elchi-stack
```

## 4. Sign in

Open the platform at `https://your-domain.com` and sign in with the default credentials:

```bash
# Default credentials
Username: admin
Password: admin
```

:::danger[Change the default password immediately]
The default `admin / admin` credentials exist only to bootstrap the first session. Rotate them right after signing in, and change the JWT signing secret before exposing Elchi to any untrusted network.
:::
