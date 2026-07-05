---
title: Standalone Collector
description: Deploy elchi-collector on its own Helm chart against your existing MongoDB and ClickHouse, separate from the full platform.
sidebar_position: 9
tags: [installation]
---

The [elchi-collector](/api-discovery/overview) is normally deployed as part of the platform via
the `installCollector` subchart toggle (see
[Configuration](/installation/helm-platform/configuration)). You can also run it **standalone**
— its own skeleton Helm chart, pointed at datastores you already operate — when you want the
central API-discovery service to live separately from the full Elchi stack (a dedicated
ingestion tier, a different cluster, or an existing Mongo/ClickHouse estate).

The collector is a passive gRPC service: it ingests Envoy ALS v3 access logs, normalizes paths,
and writes the raw event stream to **ClickHouse** (`api_events_raw`) and the endpoint catalog to
**MongoDB** (`api_inventory`). It does **not** deploy those datastores — they are external
prerequisites you supply.

## Install

The chart lives at `deploy/helm/elchi-collector` in the collector repo. Point it at an existing
MongoDB (and ClickHouse) using Kubernetes secrets:

```bash
helm install elchi deploy/helm/elchi-collector \
  --set mongo.existingSecret.name=mongo-uri-secret \
  --set policy.hashSaltSecret.name=elchi-hash-salt
```

:::warning[Use secrets, not inline URIs]
The chart exposes plaintext `mongo.uri` / `clickhouse.uri` values for DEV convenience only —
they leak credentials if committed. In production, mount the connection URIs from Kubernetes
secrets via `mongo.existingSecret` / `clickhouse.existingSecret`, and the `HASH_SALT` via
`policy.hashSaltSecret`.
:::

The full environment-variable surface (Mongo/ClickHouse DSNs, batcher tuning, retention,
enrichment, TLS) is documented in the
[Collector reference](/api-discovery/collector-reference).

## Key chart values

| Value | Default | Purpose |
|---|---|---|
| `replicaCount` | `2` | Collector replicas (idempotent inventory upserts across replicas). |
| `image.repository` | `cloudnativeworks/elchi-collector` | Distroless non-root image; `tag` defaults to the chart appVersion. |
| `mongo.existingSecret.name` | `""` | K8s secret holding `MONGO_URI` (production). |
| `mongo.database` / `mongo.inventoryCollection` | `elchi` / `api_inventory` | Inventory + runtime-config store. |
| `clickhouse.existingSecret.name` | `""` | K8s secret holding `CLICKHOUSE_URI` (external prerequisite). |
| `clickhouse.table` | `api_events_raw` | Raw-events sink table. |
| `retention.days` | `7` | ClickHouse-side TTL on the raw events table. |
| `service.grpcPort` / `service.httpPort` | `18090` / `18091` | ALS ingest (gRPC) and metrics/health (HTTP). |
| `goMemLimit` | `"400MiB"` | Go soft memory limit (`GOMEMLIMIT`); set ~80% of `resources.limits.memory` so GC gets aggressive before OOMKill. |
| `resources.limits.memory` | `512Mi` | Container memory cap (pair with `goMemLimit`). |
| `podDisruptionBudget.enabled` / `minAvailable` | `true` / `1` | Keeps ≥1 replica during voluntary disruptions. |
| `serviceMonitor.enabled` | `false` | Emit a Prometheus-Operator `ServiceMonitor` (requires kube-prometheus-stack). |

### Enable the ServiceMonitor

If you run kube-prometheus-stack, turn on scraping:

```bash
helm upgrade elchi deploy/helm/elchi-collector --reuse-values \
  --set serviceMonitor.enabled=true
```

Otherwise the pod already carries `prometheus.io/scrape` annotations on port `18091` for
annotation-based scraping.

### mTLS

To require mutual TLS on the gRPC ingest port, mount a cert secret and point the chart at it:

```bash
kubectl create secret generic elchi-grpc-tls \
  --from-file=tls.crt --from-file=tls.key --from-file=ca.crt
helm upgrade elchi deploy/helm/elchi-collector --reuse-values \
  --set tls.enabled=true \
  --set tls.existingSecret=elchi-grpc-tls \
  --set tls.clientCAFile=/etc/elchi/tls/ca.crt
```

## Container image

The collector ships as a static, distroless non-root image
(`gcr.io/distroless/static-debian12:nonroot`, UID/GID `65532`), built with Go 1.26.4, exposing
`18090` (gRPC ALS) and `18091` (metrics/health). Build a local image with `make docker` from the
collector checkout.

## When to run it standalone

Run the standalone chart when the discovery/ingestion service should be decoupled from the full
platform — for example a separate cluster dedicated to access-log ingestion, or reusing an
existing MongoDB + ClickHouse estate rather than the stack's bundled datastores. If you want it
managed as part of the platform instead, leave `global.installCollector: true` on the
[elchi-stack chart](/installation/helm-platform/overview). Either way, the ingested inventory
and risk data are what [API discovery](/api-discovery/overview) surfaces.
