---
title: Installation
description: Install the Elchi Discovery agent into your Kubernetes cluster with Helm.
sidebar_position: 3
---

## 1. Add the Helm repo

```bash
helm repo add elchi https://charts.elchi.io
helm repo update
```

## 2. Install the discovery agent

```bash
helm install endpoint-discovery elchi/elchi-discovery \
  --set config.elchiEndpoint="https://your-elchi-instance.com" \
  --set config.token="your-discovery-token" \
  --set clusterName="my-k8s-cluster" \
  --namespace elchi-stack \
  --create-namespace
```

## 3. Verify

```bash
kubectl get pods -n elchi-stack
```

## Install from a local chart

```bash
helm install endpoint-discovery . --values values.yaml
```
