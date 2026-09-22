---
title: Standalone Collector
description: Deploy elchi-collector as a standalone Deployment against your existing MongoDB and ClickHouse, separate from the full platform.
sidebar_position: 9
tags: [installation]
---

The [elchi-collector](/api-discovery/overview) is normally deployed as part of the platform via
the `installCollector` subchart toggle (see
[Configuration](/installation/helm-platform/configuration)). You can also run it **standalone**
— a plain Deployment pointed at datastores you already operate — when you want the
central API-discovery service to live separately from the full Elchi stack (a dedicated
ingestion tier, a different cluster, or an existing Mongo/ClickHouse estate).

The collector is a passive gRPC service: it ingests Envoy ALS v3 access logs, normalizes paths,
and writes the raw event stream to **ClickHouse** (`api_events_raw`) and the endpoint catalog to
**MongoDB** (`api_inventory`). It does **not** deploy those datastores — they are external
prerequisites you supply.

## Install

The collector is configured **entirely through environment variables** and ships as a public
container image, so a standalone deployment is a plain Deployment + Service — no chart of its
own. Point it at the datastores you already operate:

```yaml
# elchi-collector.yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: elchi-collector }
spec:
  replicas: 3
  selector: { matchLabels: { app: elchi-collector } }
  template:
    metadata:
      labels: { app: elchi-collector }
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "18091"
    spec:
      containers:
        - name: collector
          image: jhonbrownn/elchi-collector:v0.1.13
          ports:
            - { name: grpc, containerPort: 18090 }
            - { name: http, containerPort: 18091 }
          env:
            - { name: ELCHI_COLLECTOR_GRPC_ADDR, value: ":18090" }
            - { name: ELCHI_COLLECTOR_HTTP_ADDR, value: ":18091" }
            - { name: GOMEMLIMIT, value: "500MiB" }
            - { name: GOGC, value: "200" }
            # Connection URIs and the hash salt come from secrets, never inline:
            - name: MONGO_URI
              valueFrom: { secretKeyRef: { name: elchi-collector-secrets, key: mongo-uri } }
            - name: CLICKHOUSE_URI
              valueFrom: { secretKeyRef: { name: elchi-collector-secrets, key: clickhouse-uri } }
            - name: HASH_SALT
              valueFrom: { secretKeyRef: { name: elchi-collector-secrets, key: hash-salt } }
            - { name: MONGO_DATABASE, value: "elchi" }
            - { name: CLICKHOUSE_TABLE, value: "api_events_raw" }
          readinessProbe: { httpGet: { path: /readyz, port: http } }
          livenessProbe:  { httpGet: { path: /healthz, port: http } }
          resources:
            requests: { memory: 128Mi, cpu: 100m }
            limits:   { memory: 512Mi, cpu: "1" }
---
apiVersion: v1
kind: Service
metadata: { name: elchi-collector }
spec:
  selector: { app: elchi-collector }
  ports:
    - { name: grpc, port: 18090, targetPort: grpc }
    - { name: http, port: 18091, targetPort: http }
```

```bash
kubectl create secret generic elchi-collector-secrets \
  --from-literal=mongo-uri='mongodb://user:pass@mongo:27017/?authSource=admin' \
  --from-literal=clickhouse-uri='clickhouse://user:pass@clickhouse:9000/elchi' \
  --from-literal=hash-salt="$(openssl rand -hex 16)"
kubectl apply -f elchi-collector.yaml
```

:::warning[Never inline the URIs]
`MONGO_URI` and `CLICKHOUSE_URI` carry credentials and `HASH_SALT` pseudonymizes client
identifiers — all three belong in a Secret. A URI pasted into a manifest leaks the moment that
manifest is committed.
:::

The full environment-variable surface (Mongo/ClickHouse DSNs, batcher tuning, retention,
enrichment, TLS) is documented in the
[Collector reference](/api-discovery/collector-reference).

## Key settings

| Environment variable | Default | Purpose |
|---|---|---|
| `MONGO_URI` | — | Inventory + runtime-config store (required; from a Secret). |
| `MONGO_DATABASE` / `MONGO_INVENTORY_COLLECTION` | `elchi` / `api_inventory` | Where the endpoint catalog lands. |
| `CLICKHOUSE_URI` | — | Raw-events sink (required; from a Secret). |
| `CLICKHOUSE_TABLE` | `api_events_raw` | Raw-events table. |
| `HASH_SALT` | — | Pseudonymizes client identifiers; keep it stable across replicas and restarts. |
| `ELCHI_COLLECTOR_GRPC_ADDR` / `_HTTP_ADDR` | `:18090` / `:18091` | ALS ingest (gRPC) and metrics/health (HTTP). |
| `GOMEMLIMIT` | `500MiB` | Go soft memory limit; set ~80 % of the container memory cap so GC gets aggressive before OOMKill. |
| `GOGC` | `200` | GC runs at 3× the live set — roughly half the GC work of the default under the flush path. |
| `ELCHI_COLLECTOR_INSTANCE_ID` | — | Distinguishes replicas in metrics and inventory upserts; set it from `metadata.name` via `fieldRef`. |

Replicas are safe to scale: inventory upserts are idempotent, so every replica can ingest ALS
streams concurrently. Pair `replicas: 3` with a `PodDisruptionBudget` (`minAvailable: 1`) so a
node drain never takes the whole ingest tier down.

### Scraping

The pod annotations above cover annotation-based Prometheus discovery on port `18091`. With
kube-prometheus-stack, add your own `ServiceMonitor` selecting the `elchi-collector` Service's
`http` port instead.

### mTLS

To require mutual TLS on the gRPC ingest port, mount a cert secret and point the three TLS
variables at the mounted files — presenting a client CA is what turns TLS into *mutual* TLS:

```bash
kubectl create secret generic elchi-grpc-tls \
  --from-file=tls.crt --from-file=tls.key --from-file=ca.crt
```

```yaml
          env:
            - { name: ELCHI_COLLECTOR_GRPC_TLS_CERT_FILE,      value: /etc/elchi/tls/tls.crt }
            - { name: ELCHI_COLLECTOR_GRPC_TLS_KEY_FILE,       value: /etc/elchi/tls/tls.key }
            - { name: ELCHI_COLLECTOR_GRPC_TLS_CLIENT_CA_FILE, value: /etc/elchi/tls/ca.crt }
          volumeMounts:
            - { name: grpc-tls, mountPath: /etc/elchi/tls, readOnly: true }
      volumes:
        - name: grpc-tls
          secret: { secretName: elchi-grpc-tls }
```

Every Envoy that streams access logs here must then present a client certificate that chains to
that CA.

## Container image

The collector ships as a static, distroless non-root image
(`gcr.io/distroless/static-debian12:nonroot`, UID/GID `65532`), built with Go 1.26.4, exposing
`18090` (gRPC ALS) and `18091` (metrics/health). It is published to Docker Hub as
`jhonbrownn/elchi-collector:vX.Y.Z` (and `latest`); the version this page pins, `v0.1.13`, is
the current release.

## When to run it standalone

Deploy it on its own when the discovery/ingestion service should be decoupled from the full
platform — for example a separate cluster dedicated to access-log ingestion, or reusing an
existing MongoDB + ClickHouse estate rather than the stack's bundled datastores. If you want it
managed as part of the platform instead, leave `global.installCollector: true` on the
[elchi-stack chart](/installation/helm-platform/overview). Either way, the ingested inventory
and risk data are what [API discovery](/api-discovery/overview) surfaces.
