---
title: Configuration
description: Chart values for the Elchi platform, including global parameters and external MongoDB / VictoriaMetrics settings.
sidebar_position: 4
---

Every chart value lives under the `global` namespace so it can be shared across sub-charts. The most common parameters:

| Parameter | Description | Default |
|---|---|---|
| `global.namespace` | Namespace where all components deploy. | `"elchi-stack"` |
| `global.mainAddress` | Public base URL for all components. | **required** |
| `global.port` | Controller API port. Falls back to 80/443 based on TLS. | `""` |
| `global.tlsEnabled` | Enable HTTPS for external traffic. | `false` |
| `global.installMongo` | Use the bundled MongoDB. | `true` |
| `global.installVictoriaMetrics` | Use the bundled VictoriaMetrics. | `true` |
| `global.installClickhouse` | Use the bundled ClickHouse (raw API-events store). | `true` |
| `global.installCollector` | Deploy the bundled elchi-collector (API discovery). | `true` |
| `global.installGslb` | Deploy the GSLB DNS component. | `false` |
| `global.internalCommunication` | Enable internal-only communication between services. | `false` |
| `global.versions` | List of Elchi backend versions to deploy (illustrative — see [Envoy versions](/reference/envoy-versions) for the current set). | `[v0.14.0-envoy1.37.0, v0.14.0-envoy1.38.3]` |
| `global.jwt.secret` | JWT signing secret (min 32 chars). | **change me** |
| `global.jwt.accessTokenDuration` | Access token lifetime. | `"1h"` |
| `global.jwt.refreshTokenDuration` | Refresh token lifetime. | `"5h"` |
| `global.elchiBackend.controlPlaneDefaultReplicas` | Default replica count for control-plane services. | `2` |
| `global.elchiBackend.controllerDefaultReplicas` | Default replica count for controller services. | `2` |
| `global.cors.allowedOrigins` | CORS allowed origins. Comma-separated, or `*` for all. | `"*"` |

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
