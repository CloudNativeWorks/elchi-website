---
title: Installation
description: Install the Elchi platform with the bundled elchi-stack Helm chart, from quick defaults to a customized values file.
sidebar_position: 3
---

The fastest path is the bundled `elchi-stack` chart, which installs every component with sensible defaults.

## Add the Helm repository

```bash
helm repo add elchi https://charts.elchi.io
helm repo update
```

## Install with defaults

```bash
helm install my-elchi elchi/elchi-stack \
  --set-string global.mainAddress="your-domain.com" \
  --namespace elchi-stack \
  --create-namespace
```

## Install with a values file

For anything beyond a quick trial, pass a `values.yaml` with your overrides:

```yaml
global:
  mainAddress: "elchi.example.com"
  tlsEnabled: true
  versions:
    - tag: v1.6.15-v0.14.0-envoy1.39.0
```

Only `global.mainAddress` is required. Credentials — the JWT secret, the MongoDB and ClickHouse
passwords, the collector hash salt — are generated on first install and kept in one Secret, so
you only set them when you want specific values. See [Credentials](/installation/helm-platform/configuration#credentials).

```bash
helm install my-elchi elchi/elchi-stack -f values.yaml
```

## Sign in

Default bootstrap credentials are `admin` / `admin`. Change them on first login.

:::warning[Production checklist]

- Terminate TLS at your external load balancer or ingress (the chart manages no certificates), and set `global.tlsEnabled: true` so the platform generates `https://` URLs.
- Let the chart generate the credentials, or set all six explicitly from your own secret store — and if this is an upgrade from a chart older than 2.0.0, read [Credentials](/installation/helm-platform/configuration#credentials) **before** running it.
- Disable the bundled MongoDB and point at a managed replica set.
- Run at least 3 replicas of the controller and control-plane.

:::
