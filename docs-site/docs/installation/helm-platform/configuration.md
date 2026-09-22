---
title: Configuration
description: Chart values for the Elchi platform, including global parameters and external MongoDB / VictoriaMetrics settings.
sidebar_position: 4
---

Every chart value lives under the `global` namespace so it can be shared across sub-charts. The most common parameters:

The chart does not create or select a Kubernetes namespace — choose one at install time with `helm install --namespace <ns> --create-namespace`.

| Parameter | Description | Default |
|---|---|---|
| `global.mainAddress` | Public base URL for all components. | **required** |
| `global.port` | Controller API port. Falls back to 80/443 based on TLS. | `""` |
| `global.tlsEnabled` | Enable HTTPS for external traffic. | `false` |
| `global.installMongo` | Use the bundled MongoDB. | `true` |
| `global.installVictoriaMetrics` | Use the bundled VictoriaMetrics. | `true` |
| `global.installClickhouse` | Use the bundled ClickHouse (raw API-events store). | `true` |
| `global.installCollector` | Deploy the bundled elchi-collector (API discovery). | `true` |
| `global.installGslb` | Deploy the GSLB DNS component. | `false` |
| `global.internalCommunication` | Enable internal-only communication between services. | `false` |
| `global.versions` | List of Elchi backend versions to deploy (illustrative — see [Envoy versions](/reference/envoy-versions) for the current set). | `[v1.6.15-v0.14.0-envoy1.39.0]` |
| `global.jwt.secret` | JWT signing secret. Leave empty and the chart generates one; an explicit value needs 32+ characters. See [Credentials](#credentials). | `""` (generated) |
| `global.jwt.accessTokenDuration` | Access token lifetime. | `"1h"` |
| `global.jwt.refreshTokenDuration` | Refresh token lifetime. | `"5h"` |
| `global.elchiBackend.controlPlaneDefaultReplicas` | Default replica count for control-plane services. | `4` |
| `global.elchiBackend.controllerDefaultReplicas` | Default replica count for controller services. | `4` |
| `global.cors.allowedOrigins` | CORS allowed origins. Comma-separated, or `*` for all. | `"*"` |

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
