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

`global.mainAddress` is the IP or DNS name browsers and Envoy proxies use to reach Elchi. For a
first try, use the IP of one of your nodes (`kubectl get nodes -o wide`):

```bash
helm install elchi elchi/elchi-stack \
  --set-string global.mainAddress=192.168.1.10 \
  --namespace elchi-stack \
  --create-namespace
```

The gateway listens on NodePort `30000`; the install prints the address to open
(`http://192.168.1.10:30000`). If that port is taken, pick another one between 30000 and 32767
with `--set global.envoy.service.httpNodePort=30080`. The chart passes the same port to the
Envoy proxies it configures, so set only this one. Set `global.port` yourself only when clients
reach Elchi through a load balancer or ingress on a different port.

## Install with a values file

For anything beyond a quick trial, pass a `values.yaml` with your overrides:

```yaml
global:
  mainAddress: "elchi.example.com"
  tlsEnabled: true
  versions:
    - tag: v1.8.4-v0.14.0-envoy1.40.2
```

Only `global.mainAddress` is required. Credentials — the JWT secret, the MongoDB and ClickHouse
passwords, the collector hash salt — are generated on first install and kept in one Secret, so
you only set them when you want specific values. See [Credentials](/installation/helm-platform/configuration#credentials).

```bash
helm install elchi elchi/elchi-stack -f values.yaml --namespace elchi-stack --create-namespace
```

## Sign in

Default bootstrap credentials are `admin` / `admin`. They are temporary: the first sign-in asks for a new password (12+ characters, upper, lower, number, symbol) before anything else opens.

:::warning[Production checklist]

- Serve Elchi over TLS and set `global.tlsEnabled: true` so the platform generates `https://` URLs. The gateway Envoy already terminates TLS on its `https` port with a self-signed certificate for `global.mainAddress`; put your own certificate in a `kubernetes.io/tls` Secret and name it in `global.envoy.tls.secretName`, or terminate TLS at your load balancer or ingress instead.
- Let the chart generate the credentials, or set all six explicitly from your own secret store — and if this is an upgrade from a chart older than 2.0.0, read [Credentials](/installation/helm-platform/configuration#credentials) **before** running it.
- Disable the bundled MongoDB and point at a managed replica set.
- Run at least 3 replicas of the controller and control-plane, and 2 or more of the gateway Envoy, the UI and the collector (the defaults are 1 each, sized for a first try). See [Production](/installation/helm-platform/production).

:::
