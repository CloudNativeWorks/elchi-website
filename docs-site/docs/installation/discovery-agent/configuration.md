---
title: "Discovery Agent Helm Values Reference"
sidebar_label: "Configuration"
description: "Every Helm value of the elchi-discovery chart with its default: API endpoint, token, cluster name, interval, logging, RBAC, resources and pod security."
sidebar_position: 4
---

The `elchi-discovery` chart is configured through Helm values. Three are required for a working agent: `config.apiEndpoint`, `config.token` and `clusterName`. Everything else has a usable default. The defaults below are the chart's `values.yaml`; print them for the version you install with `helm show values elchi/elchi-discovery`.

## Required values

| Value | Description | Default |
| --- | --- | --- |
| `config.apiEndpoint` | Full URL of Elchi's discovery API: your Elchi address followed by `/api/discovery/k8s`, for example `https://elchi.example.com/api/discovery/k8s`. Must be a URI. | `https://<elchi-main-address>/api/discovery/k8s` (placeholder) |
| `config.token` | The project's discovery token from **Settings → Tokens** (`<uuid>--<project>`). The agent sends it as a `Bearer` token. Without it the install prints a warning, and Elchi rejects the reports. | `""` |
| `clusterName` | Name this cluster reports under. Must be non-empty (the install fails otherwise) and unique per project, because endpoint resources refer to clusters by name. | `x-cluster` |

## Agent behaviour

| Value | Description | Default |
| --- | --- | --- |
| `discoveryInterval` | Seconds between reports. Allowed range 10 to 3600. | `30` |
| `config.insecureSkipVerify` | Skip TLS certificate verification when calling `config.apiEndpoint`. Set it to `false` when Elchi's certificate is trusted by the cluster. | `true` |
| `config.log.level` | `debug`, `info`, `warn` or `error`. | `info` |
| `config.log.format` | `json` or `text`. | `json` |
| `config.log.output` | `stdout` or `stderr`. | `stdout` |
| `timezone` | Container time zone, passed as `TZ`. | `Europe/Istanbul` |
| `timezonePath` | Host path mounted read-only at `/etc/localtime`. | `/etc/localtime` |
| `env` | Extra environment variables, as `name`/`value` pairs. | `[]` |
| `envFrom` | Extra environment from ConfigMaps or Secrets (`configMapRef` / `secretRef`). | `[]` |

The chart renders these into a ConfigMap and mounts it at `/etc/elchi/config.yaml` (the agent finds it through `ELCHI_CONFIG`):

```yaml
elchi:
  token: "<config.token>"
  api_endpoint: "<config.apiEndpoint>"
  insecure_skip_verify: true
log:
  level: "info"
  format: "json"
  output: "stdout"
discovery_interval: 30
cluster_name: "<clusterName>"
```

## Image, scheduling and resources

| Value | Description | Default |
| --- | --- | --- |
| `replicaCount` | Number of agent pods. | `1` |
| `image.repository` | Agent image. | `jhonbrownn/elchi-discovery` |
| `image.tag` | Image tag, pinned so `helm rollback` restores a known image. Empty falls back to the chart's `appVersion`. | `v1.0.0` |
| `image.pullPolicy` | `Always`, `IfNotPresent` or `Never`. | `Always` |
| `imagePullSecrets` | Pull secrets for a private registry mirror. | `[]` |
| `resources` | Requests 100m CPU / 64Mi memory, limits 200m / 128Mi. | see values |
| `nodeSelector`, `tolerations`, `affinity` | Standard pod scheduling controls. | empty |
| `podAnnotations` | Extra annotations on the pod. | `{}` |
| `nameOverride`, `fullnameOverride` | Override the generated resource names. | `""` |

## RBAC and pod security

| Value | Description | Default |
| --- | --- | --- |
| `serviceAccount.create` | Create a ServiceAccount for the agent. | `true` |
| `serviceAccount.name` | Use this ServiceAccount name (generated when empty). | `""` |
| `serviceAccount.annotations` | Annotations on the ServiceAccount. | `{}` |
| `rbac.create` | Create a ClusterRole and ClusterRoleBinding with `get`, `list` and `watch` on nodes, endpoints, services and pods. | `true` |
| `podSecurityContext` | Runs as UID/GID `65534` (non-root), `fsGroup: 65534`. | see values |
| `securityContext` | Read-only root filesystem, no privilege escalation, all capabilities dropped. | see values |

## Example values file

```yaml
config:
  apiEndpoint: "https://elchi.example.com/api/discovery/k8s"
  token: "3f6c…--my-project"
  insecureSkipVerify: false
  log:
    level: info
clusterName: "prod-eu-1"
discoveryInterval: 60
timezone: "UTC"
```

Install it with `helm install elchi-discovery elchi/elchi-discovery -n elchi-stack --create-namespace -f values.yaml`. See [Installation](/installation/discovery-agent/installation) for verification and upgrades.

:::tip[One token, many clusters]
All clusters that report to the same project share that project's discovery token; `clusterName` is what tells them apart. Regenerating or deleting the token in **Settings → Tokens** cuts off every agent that still uses the old one.
:::
