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
  namespace: "elchi-stack"
  mainAddress: "elchi.example.com"
  tlsEnabled: true
  jwt:
    secret: "your-secure-32-character-minimum-secret-key-here"
  versions:
    - tag: v0.1.0-v0.14.0-envoy1.37.0
    - tag: v0.1.0-v0.14.0-envoy1.38.3
```

```bash
helm install my-elchi elchi/elchi-stack -f values.yaml
```

## Sign in

Default bootstrap credentials are `admin` / `admin`. Change them on first login.

:::warning[Production checklist]

- Set `global.tlsEnabled: true` and provide certificates.
- Replace `global.jwt.secret` with a 32+ character random value.
- Disable the bundled MongoDB and point at a managed replica set.
- Run at least 3 replicas of the controller and control-plane.

:::
