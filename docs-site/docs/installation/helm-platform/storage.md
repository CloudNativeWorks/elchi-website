---
title: Storage Options
description: Configure built-in or external MongoDB and VictoriaMetrics storage for the Elchi platform, with sizing guidance.
sidebar_position: 5
---

## Built-in MongoDB (default)

```yaml
global:
  installMongo: true

mongodb:
  persistence:
    enabled: true
    size: "10Gi"            # adjust for production
```

The storage class is not set per subchart — it comes from the global `global.storageClass` key, which applies to all bundled PVCs (MongoDB, VictoriaMetrics, ClickHouse).

## External MongoDB

```yaml
global:
  installMongo: false
  mongodb:
    hosts: "mongo1.example.com:27017,mongo2.example.com:27017"
    username: "elchi"
    password: "secure-password"
    database: "elchi"
    replicaset: "rs0"
    tlsEnabled: true
```

## Built-in VictoriaMetrics

```yaml
global:
  installVictoriaMetrics: true
  storageClass: "standard"   # storage class for all bundled PVCs

victoriametrics:
  persistence:
    size: "20Gi"
  retentionPeriod: "30d"     # default 15d
```

## External VictoriaMetrics

```yaml
global:
  installVictoriaMetrics: false
  victoriametrics:
    endpoint: "http://victoria-metrics.monitoring:8428"
```

## Built-in ClickHouse (default)

ClickHouse holds the raw API-events stream that feeds [API discovery](/api-discovery/overview).
It is bundled by default and consumed by the elchi-collector:

```yaml
global:
  installClickhouse: true
  installCollector: true
```

## External ClickHouse

Point the collector at an existing ClickHouse cluster instead of the bundled one:

```yaml
global:
  installClickhouse: false
  clickhouse:
    hosts: "clickhouse.example.com:9000"
    password: ""   # set your own — do not commit it
```

:::info[Sizing guide]

- MongoDB — 10 GB for small deployments, 50 GB+ for production.
- VictoriaMetrics — 20 GB for ~30 days retention; scale with metric volume.
- ClickHouse — sized by event volume and retention (default 7-day TTL on raw events).
- SSD-backed storage classes give meaningful headroom for all three.

:::
