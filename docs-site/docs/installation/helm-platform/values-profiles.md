---
title: Values Profiles
description: The -f values_<profile>.yaml pattern and a reference matrix of the dev, office, cloud, and cloud2 elchi-stack profiles.
sidebar_position: 8
tags: [installation]
---

The `elchi-stack` chart is maintained alongside several **profile overlays** —
`values_<profile>.yaml` files that layer on top of the base `values.yaml` to describe a concrete
deployment shape (local dev, an on-prem office cluster, a cloud production node, …). They are
reference shapes rather than packaged files: the matrix below is the whole content, so copy the
column you want into your own overlay and apply it with `-f`:

```bash
helm show values elchi/elchi-stack > values.yaml     # the base, as published
# …write my-office.yaml with the overrides from the matrix below…
helm install elchi elchi/elchi-stack -f my-office.yaml
```

Later `-f` files win, so your overlay overrides the base. Everything you can override lives under
the shared `global` namespace — see [Configuration](/installation/helm-platform/configuration)
for the parameter reference and [Storage Options](/installation/helm-platform/storage) for the
datastore toggles.

:::info[Values are schema-validated]
`values.schema.json` (JSON Schema draft-07) validates your merged values at install time. Only
`global.mainAddress` is strictly required (plus `tag` on each `versions[]` entry) — credentials
are [generated when omitted](/installation/helm-platform/configuration#credentials). It enforces
types (booleans for the `install*` toggles, integers for replica counts), an enum on
`envoy.service.type` (`ClusterIP | NodePort | LoadBalancer`), a 32-character minimum on a
**non-empty** `jwt.secret`, and NodePort bounds (`30000–32767`). It does **not** enforce
cross-field rules — e.g. it won't force `mongodb.hosts` when `installMongo: false`; that
discipline is on you.
:::

## Profile intent

| Profile | Intent |
| --- | --- |
| **base** `values.yaml` | Neutral template: everything self-hosted, GSLB off, `mainAddress` blank (must be supplied). |
| **`values_dev`** | Local single-node developer setup: plain HTTP on fixed NodePorts, all datastores bundled, small footprint. |
| **`values_office`** | On-prem/office cluster: TLS, `local-path` storage, GSLB on, external MongoDB replica set, and the only profile running **two** Envoy versions side by side. |
| **`values_cloud`** | Cloud production (demo-facing): public domain + TLS, GSLB on, external MongoDB, demo mode on, scaled lean to 1 replica on the newer stack. |
| **`values_cloud2`** | Cloud production (self-contained): public IP, plain HTTP, GSLB off, all datastores bundled, 2 replicas on the older stack. |

## Reference matrix

Values below are drawn from the profile files. Hosts, IPs, and any credentials are described,
not reproduced — set your own for every secret and address.

| Key | base | dev | office | cloud | cloud2 |
|---|---|---|---|---|---|
| `global.mainAddress` | *(required, blank)* | local domain | private domain | public domain | public IP |
| `global.tlsEnabled` | `false` | `false` | `true` | `true` | `false` |
| `global.port` | auto (80/443) | `8010` | `443` | auto | `30010` |
| `global.installMongo` | `true` | `true` | `false` (external) | `false` (external) | `true` |
| `global.installVictoriaMetrics` | `true` | `true` | `true` | `true` | `true` |
| `global.installClickhouse` | `true` | default `true` | default `true` | default `true` | default `true` |
| `global.installCollector` | `true` | default `true` | default `true` | default `true` | default `true` |
| `global.installGslb` | `false` | default `false` | `true` | `true` | default `false` |
| `global.internalCommunication` | `false` | `false` | `false` | `false` | `false` |
| Envoy versions | 1 | 1 | **2** | 1 | 1 |
| `global.storageClass` | `""` | inherits base `""` | `local-path` | `""` | inherits base `""` |
| Controller / control-plane replicas | 4 / 4 | 2 / 2 | 4 / 4 | 1 / 1 | 2 / 2 |
| External MongoDB (`mongodb.hosts`) | none | none | configured | configured | none |
| `envoy.service.httpNodePort` | `30000` | `30080` | `30083` | `30000` | `30010` |

Notes:

- **Storage is governed by the single `global.storageClass` key** (it covers the MongoDB,
  VictoriaMetrics, and ClickHouse PVCs); the profiles set no per-subchart size or storage-class
  overrides. See [Storage Options](/installation/helm-platform/storage).
- **No profile configures an external VictoriaMetrics or external ClickHouse** — only office and
  cloud point at an external MongoDB. Everything else is self-hosted by the bundled subcharts.
- **`enableDemo`** is the other cloud-vs-cloud2 tell: `cloud` runs with demo mode on, `cloud2`
  off.

### cloud vs cloud2

Both are cloud production overlays, but opposite in shape. **`values_cloud`** is the polished,
demo-facing instance: TLS on a public domain, external MongoDB, GSLB on, demo mode on, on the
newer Envoy stack, scaled down to 1 replica. **`values_cloud2`** is a fully self-contained
node: a public IP on a high NodePort, plain HTTP, GSLB off, all datastores bundled, 2 replicas
on the older stack.

The subchart toggles referenced here (`installMongo`, `installVictoriaMetrics`,
`installClickhouse`, `installCollector`, `installGslb`) and their external-datastore
counterparts are documented in [Configuration](/installation/helm-platform/configuration).
