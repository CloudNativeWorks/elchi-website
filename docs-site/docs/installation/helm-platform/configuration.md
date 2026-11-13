---
title: "Helm Chart Configuration Values"
sidebar_label: "Configuration"
description: "elchi-stack Helm chart values for the Elchi platform: global parameters, the required main address, credentials, and external MongoDB and VictoriaMetrics."
sidebar_position: 4
---

Every chart value lives under the `global` namespace so it can be shared across sub-charts. The most common parameters:

The chart does not create or select a Kubernetes namespace — choose one at install time with `helm install --namespace <ns> --create-namespace`.

| Parameter | Description | Default |
|---|---|---|
| `global.mainAddress` | IP or DNS name Envoy proxies and clients use to reach Elchi. See [Choosing mainAddress](#choosing-mainaddress). | **required** |
| `global.port` | Port clients use with `mainAddress`. Empty = derived from the gateway Service: the http NodePort (the https NodePort with `tlsEnabled`), or 80/443 behind an ingress or load balancer. Set it when a load balancer in front listens on another port. A release installed before chart 2.1.0 keeps the port it runs with. | `""` (derived) |
| `global.tlsEnabled` | Enable HTTPS for external traffic. | `false` |
| `global.installMongo` | Use the bundled MongoDB. | `true` |
| `global.installVictoriaMetrics` | Use the bundled VictoriaMetrics. | `true` |
| `global.installClickhouse` | Use the bundled ClickHouse (raw API-events store). | `true` |
| `global.installCollector` | Deploy the bundled elchi-collector (API discovery). | `true` |
| `global.installGslb` | Deploy the GSLB DNS component. | `false` |
| `global.internalCommunication` | Controller → control-plane calls stay inside the cluster (through `envoy-service:8080`) instead of going out to `mainAddress:port` and back. | `true` |
| `global.versions` | List of Elchi backend versions to deploy (illustrative — see [Versions & Upgrades](/envoy-configuration/versions-and-upgrades) for how the current set is resolved). | `[v1.8.4-v0.14.0-envoy1.40.2]` |
| `global.envoy.service.type` | Gateway Service type: `NodePort`, `LoadBalancer` or `ClusterIP`. | `NodePort` |
| `global.envoy.service.httpNodePort` | Gateway NodePort (30000–32767). Empty = the first free one from 30000 up, kept on upgrades (needs cluster-wide Service read; set it for GitOps / `helm template`). | `null` (auto) |
| `global.envoy.service.exposeAdmin` | Add the Envoy admin interface (9901) to the gateway Service. It can stop the gateway, so it stays off; use `kubectl port-forward deploy/envoy 9901` instead. Setting `adminNodePort` also exposes it. | `false` |
| `global.jwt.secret` | JWT signing secret. Leave empty and the chart generates one; an explicit value needs 32+ characters. See [Credentials](#credentials). | `""` (generated) |
| `global.jwt.accessTokenDuration` | Access token lifetime. | `"1h"` |
| `global.jwt.refreshTokenDuration` | Refresh token lifetime. | `"5h"` |
| `global.elchiBackend.controlPlaneDefaultReplicas` | Replica count for control-plane services. Production: 3 or more. | `1` |
| `global.elchiBackend.controllerDefaultReplicas` | Replica count for controller services. Production: 3 or more. | `1` |
| `envoy.replicas` / `elchi.replicas` / `elchi-collector.replicaCount` | Replica counts of the gateway Envoy, the UI and the collector. Production: 2 or more. | `1` |
| `global.cors.allowedOrigins` | CORS allowed origins. Comma-separated, or `*` for all. | `"*"` |

## Choosing mainAddress

`global.mainAddress` (with the port the chart derives, or `global.port`) is the **front door that
everything outside the cluster uses**. It ends up in:

- every Envoy bootstrap Elchi generates: the `elchi-control-plane` cluster the proxy dials for its
  configuration (ADS), and the gRPC authority it sends;
- the access-log stream (`elchi-als`) those proxies send to the collector, which uses the same cluster;
- the self-signed gateway certificate, which is issued for this name;
- the address you give each elchi-client (`--host` / `--port`, see [Client installation](/installation/client/installation)).

The browser UI does not depend on it: it calls the API on whatever address you opened it on.

Envoy proxies and clients run **outside** the cluster, so pick an address they can always reach:

| Cluster | Use as mainAddress | Port |
|---|---|---|
| One node, a first try, or no load balancer (typical on-premises) | The IP of any one node | derived (the http NodePort the chart picked, printed at install) |
| Several nodes, cloud or MetalLB | A DNS name for the gateway's LoadBalancer IP (`global.envoy.service.type=LoadBalancer`) | derived (`8080`, or `8443` with TLS) |
| Several nodes, own load balancer or VIP (HAProxy, F5, kube-vip, keepalived) | A DNS name for the VIP, which forwards to the gateway NodePort on **every** node | the port the VIP listens on: set `global.port` when it differs from the NodePort |

A single node's IP always works, because the gateway NodePort answers on every node. Its only cost:
when that node goes down, Envoy proxies keep serving traffic with the configuration they have but
stop receiving changes, and clients lose their connection, until the node is back or you move
`mainAddress` to another node. On a cluster of many nodes, a load balancer or VIP in front of all of
them (by DNS name) removes that single point; add one when you can.

Prefer a DNS name over an IP. The address is written into every bootstrap, so moving to a new IP is
then a DNS change, not a reconfiguration. With `global.tlsEnabled: true`, put a certificate for that
name in `global.envoy.tls.secretName`.

The control plane speaks long-lived gRPC streams. Use a layer-4 (TCP) load balancer, or a layer-7 one
with HTTP/2 to the backend and no stream or idle timeouts.

When `mainAddress` or the port changes, Elchi updates the default `elchi-control-plane` cluster when it
restarts, unless someone edited that cluster by hand. Proxies that are already running keep their old
bootstrap: download it again and redeploy them.

## Credentials

Since **chart 2.0.0** every credential the platform needs lives in ONE Kubernetes Secret —
`elchi-stack-secrets` by default — and the chart resolves each one in this order:

1. the **explicit value** you set (`global.jwt.secret`, `global.mongodb.password`, …);
2. the value already in the Secret from an earlier install or upgrade;
3. a **generated** one, when `global.secrets.autoGenerate` is true (the default).

So a plain `helm install` needs no credentials at all, and a later `helm upgrade` never rotates
what is already running. The Secret carries `helm.sh/resource-policy: keep`, so `helm uninstall`
leaves it behind — reinstalling into the same namespace adopts the existing credentials instead
of locking you out of your own MongoDB volume.

| Secret key | Value | Generated length |
|---|---|---|
| `ELCHI_JWT_SECRET` | `global.jwt.secret` — signs API tokens and derives the license KEK. | 48 |
| `MONGODB_PASSWORD` | `global.mongodb.password` | 32 |
| `CLICKHOUSE_PASSWORD` | `global.clickhouse.password` | 32 |
| `HASH_SALT` | `global.collector.hashSalt` — pseudonymizes client identifiers. | 48 |
| `GSLB_SECRET` | `global.gslb.secret` | 48 |
| `GRAFANA_PASSWORD` | `global.grafana.password` | 24 |

| Parameter | Description | Default |
|---|---|---|
| `global.secrets.name` | Name of the Secret holding every credential. | `elchi-stack-secrets` |
| `global.secrets.autoGenerate` | Generate a missing credential at install time. | `true` |
| `global.secrets.adoptLegacyDefaults` | One-shot seed of the pre-2.0.0 built-in defaults on the first upgrade. | `false` |

:::warning[Two cases that need your attention]
**GitOps / `helm template`.** Generation reads the cluster through `lookup`, which returns
nothing when the manifests are rendered outside it — every run would then invent new
credentials. For Argo CD, Flux or any rendered pipeline, set `global.secrets.autoGenerate:
false` and supply all six values explicitly (from your own secret store).

**Upgrading a release installed before 2.0.0.** Those chart versions had built-in default
passwords and no shared Secret, so the chart cannot know what your datastores are using and
refuses to guess. Set `global.secrets.adoptLegacyDefaults: true` for that one upgrade — it
seeds the Secret with those former defaults so the running system keeps working — then rotate
each credential.
:::

Because they end up inside connection URIs, `MONGODB_PASSWORD` and `CLICKHOUSE_PASSWORD` must
be **URL-safe**: an explicit value is accepted only if it matches `[A-Za-z0-9._~-]+` (the
unreserved URI characters). Anything else is rejected at render time rather than producing a
DSN that silently fails to parse.

## External MongoDB parameters

When `global.installMongo: false`, point Elchi at your own MongoDB cluster:

| Parameter | Description |
|---|---|
| `global.mongodb.hosts` | Connection hosts (comma-separated for replica sets). |
| `global.mongodb.username` | MongoDB username (default `"elchi"`). |
| `global.mongodb.password` | MongoDB password. |
| `global.mongodb.database` | Database name (default `"elchi"`). |
| `global.mongodb.scheme` | Connection scheme — `mongodb` or `mongodb+srv`. |
| `global.mongodb.replicaset` | Replica set name, if applicable. |
| `global.mongodb.tlsEnabled` | Enable TLS connection to MongoDB. |
| `global.mongodb.authSource` | Authentication source database. |
| `global.mongodb.authMechanism` | Authentication mechanism. |

## External VictoriaMetrics

When `global.installVictoriaMetrics: false`, set:

| Parameter | Description |
|---|---|
| `global.victoriametrics.endpoint` | External VictoriaMetrics endpoint. Accepts `http://host:port` or `host:port`. |

## External ClickHouse

When `global.installClickhouse: false`, point the collector at your own ClickHouse cluster:

| Parameter | Description |
|---|---|
| `global.clickhouse.hosts` | Connection hosts for the raw API-events store. |
| `global.clickhouse.password` | ClickHouse password — **set your own**; do not commit it. |

:::note[Subchart toggles feed the collector]
`global.installClickhouse` and `global.installCollector` drive the [API discovery](/api-discovery/overview)
pipeline: the collector writes raw events to ClickHouse and the endpoint inventory to MongoDB.
Turn `installGslb` on only when you need the GSLB DNS component. Which datastores each shipped
profile bundles vs. externalizes is summarized in [Values Profiles](/installation/helm-platform/values-profiles).
:::
