---
title: Collector Reference
description: Complete reference for the elchi-collector — bootstrap environment variables, ports, Prometheus metrics, ClickHouse and MongoDB schema, and Envoy ALS wiring.
sidebar_position: 12
tags: [api-discovery, collector]
---

This is the reference page for the **elchi-collector**, the ingest engine behind [API Discovery](/api-discovery/overview). It documents every bootstrap environment variable, the ports it listens on, the metrics it exports, and the storage schema the read API depends on. Runtime (hot-reloaded) configuration is covered separately in [Collector Configuration](/api-discovery/collector-configuration).

:::info[Bootstrap vs runtime]
Everything on this page is **bootstrap** — read from the environment once at process start; changing it needs a restart. The header policy, ingest exclusions, path-normalization rules, and detector thresholds are **runtime** config in MongoDB and hot-reload without a restart. Only set env vars you want to override; anything unset uses the compiled-in default.
:::

## Ports

| Port | Protocol | Purpose |
| --- | --- | --- |
| `18090` | gRPC | Envoy ALS v3 sink (plain TCP, or TLS/mTLS when configured). |
| `18091` | HTTP | `/healthz`, `/readyz`, `/metrics`, plus the gRPC health check. |

## Environment variables

### Core

| Variable | Default | Notes |
| --- | --- | --- |
| `ELCHI_COLLECTOR_INSTANCE_ID` | hostname | Identifies this collector replica; stamped on every event as `instance_id`. |
| `ELCHI_COLLECTOR_GRPC_ADDR` | `:18090` | ALS gRPC listen address. |
| `ELCHI_COLLECTOR_HTTP_ADDR` | `:18091` | Health / metrics HTTP listen address. |
| `SHUTDOWN_TIMEOUT` | `30s` | Drain budget on SIGTERM. |
| `LOG_LEVEL` | `info` | zerolog levels (`debug`/`info`/`warn`/`error`). |
| `LOG_FORMAT` | `json` | `json` or `console`. |
| `GOMEMLIMIT` | _unset_ | Go runtime soft heap cap. Set to ~80% of the container memory limit to make GC aggressive before OOMKill. |

### gRPC server tuning

| Variable | Default | Notes |
| --- | --- | --- |
| `ELCHI_COLLECTOR_GRPC_MAX_RECV_MSG_SIZE` | `16777216` | Per-message cap (16 MiB); larger ALS batches are rejected. |
| `ELCHI_COLLECTOR_GRPC_MAX_CONCURRENT_STREAMS` | `4096` | Server-wide concurrent stream limit. |
| `ELCHI_COLLECTOR_GRPC_READ_BUFFER_SIZE` | `65536` | Per-connection read buffer. |
| `ELCHI_COLLECTOR_GRPC_WRITE_BUFFER_SIZE` | `65536` | Per-connection write buffer. |
| `ELCHI_COLLECTOR_GRPC_NUM_SERVER_WORKERS` | `0` | grpc-go worker pool size; `0` = goroutine-per-stream. |
| `ELCHI_COLLECTOR_GRPC_MAX_CONNECTION_AGE` | `30m` | Force-recycle a connection after this (slowloris defense). |
| `ELCHI_COLLECTOR_GRPC_MAX_CONNECTION_AGE_GRACE` | `30s` | Graceful drain window before hangup. |

### gRPC TLS / mTLS (optional)

| Variable | Default | Notes |
| --- | --- | --- |
| `ELCHI_COLLECTOR_GRPC_TLS_CERT_FILE` | _empty_ | PEM server certificate. Setting cert + key enables TLS. |
| `ELCHI_COLLECTOR_GRPC_TLS_KEY_FILE` | _empty_ | PEM server private key; must be set with the cert. |
| `ELCHI_COLLECTOR_GRPC_TLS_CLIENT_CA_FILE` | _empty_ | PEM CA bundle; when set, the server requires + verifies client certs (mTLS). |

### MongoDB — inventory + runtime config

| Variable | Default | Notes |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://localhost:27017` | **Required.** |
| `MONGO_DATABASE` | `elchi` | Shared with elchi-backend. |
| `MONGO_INVENTORY_COLLECTION` | `api_inventory` | Endpoint catalog. |
| `MONGO_CONFIG_COLLECTION` | `api_collector_config` | Singleton runtime-config doc. |
| `MONGO_THREAT_INTEL_COLLECTION` | `api_collector_threatintel` | Singleton threat-intel feed doc. |
| `MONGO_BASELINE_COLLECTION` | `api_collector_baselines` | Per-instance self-learning detector baselines, restored on startup. |
| `MONGO_NORMALIZE_GAP_COLLECTION` | `api_collector_normalize_gaps` | Suspected path-normalization gaps (TTL-indexed). |
| `MONGO_CONNECT_TIMEOUT` | `5s` | |
| `MONGO_MAX_POOL_SIZE` | `200` | Connection pool cap (`.env.example` shows `100` only as a dev override). |
| `MONGO_MIN_POOL_SIZE` | `10` | |
| `MONGO_WRITE_CONCERN_W` | `1` | `1` or `majority`. |
| `MONGO_WRITE_CONCERN_JOURNAL` | `false` | |
| `MONGO_COMPRESSORS` | `snappy,zstd` | Wire-protocol compressors negotiated with the cluster. |
| `MONGO_INVENTORY_WRITE_TIMEOUT` | `15s` | Per-flush deadline for inventory `BulkWrite`. |
| `MONGO_INVENTORY_CARDINALITY_CAP` | `100000` | Distinct endpoints admitted per instance before new keys drop; `0` disables. |

### ClickHouse — raw events

| Variable | Default | Notes |
| --- | --- | --- |
| `CLICKHOUSE_URI` | `clickhouse://elchi:elchi@127.0.0.1:9000/elchi` | Native (`clickhouse://`, port 9000) or HTTP (`http://`, port 8123); native is 2–3× faster. |
| `CLICKHOUSE_DATABASE` | `elchi` | |
| `CLICKHOUSE_TABLE` | `api_events_raw` | |
| `CLICKHOUSE_USERNAME` | _empty_ | Overrides DSN userinfo (use a secret in prod). |
| `CLICKHOUSE_PASSWORD` | _empty_ | Overrides DSN userinfo. |
| `CLICKHOUSE_CONNECT_TIMEOUT` | `5s` | |
| `CLICKHOUSE_WRITE_TIMEOUT` | `10s` | Per-flush deadline; abandoned writes count as `clickhouse_errors_total{op="timeout"}`. |
| `CLICKHOUSE_MAX_OPEN_CONNS` | `20` | |
| `CLICKHOUSE_MAX_IDLE_CONNS` | `5` | |

### Retention & secrets

| Variable | Default | Notes |
| --- | --- | --- |
| `RETENTION_DAYS` | `7` | ClickHouse-side TTL on the raw table (`TTL ts + INTERVAL N DAY`). Only affects newly created tables; existing tables need an explicit `ALTER TABLE … MODIFY TTL`. |
| `HASH_SALT` | _required_ | Secret keeping IP/UA/consumer hashes one-way. Empty/whitespace values are rejected at startup. Rotating it invalidates all downstream consumer joins. |
| `RUNTIME_CONFIG_POLL_INTERVAL` | `2m` | How often the runtime config doc is re-read; `0` disables hot-reload (still loaded once at startup). Also paces threat-intel feed polling. |

### Batching

Budgets are **total** and divided across shards, so raising `BATCH_SHARDS` does not increase memory — it only makes each ClickHouse insert smaller.

| Variable | Default | Notes |
| --- | --- | --- |
| `BATCH_MAX_SIZE` | `20000` | Rows-per-flush budget across shards. |
| `BATCH_MAX_BYTES` | `8388608` | Byte budget per flush across shards (~8 MiB, usually the binding cap). |
| `BATCH_FLUSH_INTERVAL` | `1s` | Interval-triggered flush. |
| `BATCH_BACKPRESSURE_POLICY` | `drop_new` | `block` \| `drop_new` \| `drop_old`. Default keeps ingest non-blocking under sink slowness. |
| `BATCH_QUEUE_SIZE` | `20000` | Total in-flight item cap across shards. |
| `BATCH_SHARDS` | `0` (auto) | Parallel batchers; `0` = `min(2 × GOMAXPROCS, 8)`. |
| `BATCH_SHUTDOWN_DRAIN_TIMEOUT` | `20s` | Caps the final flush during shutdown; kept shorter than `SHUTDOWN_TIMEOUT`. `0` = unbounded. |

:::note[Defaults differ between docs]
The compiled-in defaults above (from the README's env table) are the production values. The shipped `.env.example` shows lower developer-oriented values (e.g. `BATCH_MAX_SIZE=1000`, `BATCH_FLUSH_INTERVAL=250ms`, `BATCH_QUEUE_SIZE=5000`) as override examples — the collector uses the production defaults when the vars are unset.
:::

### Enrichment

| Variable | Default | Notes |
| --- | --- | --- |
| `ENRICHER_TIMEOUT` | `50ms` | Per-enricher budget in the chain, so one slow lookup can't starve the rest. |
| `GEOIP_CACHE_DIR` | `data/geoip` | Collector-owned cache for the GridFS-synced MMDB files (`city.mmdb` / `asn.mmdb`). Point at a stable, writable, persistent path. |
| `GEOIP_GRIDFS_BUCKET` | `geoip` | GridFS bucket the backend uploads the MMDB databases to. |
| `BASELINE_SNAPSHOT_INTERVAL` | `5m` | How often learned detector baselines persist to `MONGO_BASELINE_COLLECTION` (plus one on graceful shutdown); `0` disables persistence. |
| `NORMALIZE_GAP_FLUSH_INTERVAL` | `5m` | How often suspected normalization gaps are written; `0` disables the writer (the detector still feeds `detector_state_entries`). |

See [Threat Intelligence & GeoIP](/api-discovery/threat-intel-geoip) for the enrichment chain and how feeds/GeoIP databases are uploaded.

## Metrics

Every series is namespaced `elchi_collector_` and exposed at `:18091/metrics`. Standard `go_*` and `process_*` collectors are also exported (`go_goroutines` is the canonical leak signal).

**Throughput / drops**

```promql
elchi_collector_events_received_total{protocol}      # accepted ALS entries
elchi_collector_events_dropped_total{reason}         # every drop site labels its reason
elchi_collector_active_streams                       # live ALS streams
elchi_collector_event_processing_duration_seconds    # ingest → sink-submit latency
elchi_collector_normalize_duration_seconds
```

`events_dropped_total` reasons: `ingest_filter`, `exclude_method`/`exclude_host`/`exclude_listener`/`exclude_project`/`exclude_source_ip`/`exclude_user_agent`, `malformed`, `panic`, `backpressure`, `inventory_cardinality`, `brute_force_no_key`.

**Backends / batching**

```promql
elchi_collector_mongo_insert_duration_seconds{collection}
elchi_collector_clickhouse_insert_duration_seconds
elchi_collector_mongo_errors_total{collection,op}       # op=bulk_write
elchi_collector_clickhouse_errors_total{op}
elchi_collector_clickhouse_rows_inserted_total
elchi_collector_batch_flush_errors_total{collection,kind}  # kind=flush|panic, both sinks
elchi_collector_batch_size{collection}
elchi_collector_flush_count_total{collection,trigger}
elchi_collector_batcher_queue_depth{collection,shard}
```

**Risk / detectors / enrichers**

```promql
elchi_collector_risk_flag_fired_total{flag}
elchi_collector_risk_score_distribution                 # per-event score histogram
elchi_collector_detector_state_entries{detector}
elchi_collector_detector_skipped_total{detector,reason} # e.g. geo_spread reason=no_geo
elchi_collector_enrich_duration_seconds{enricher}
elchi_collector_enrich_errors_total{enricher}
elchi_collector_uaclass_classifications_total{kind}
elchi_collector_geoip_lookups_total{result}             # hit|miss|no_db|internal
elchi_collector_threatintel_feed_entries{feed}
elchi_collector_consumer_identity_total{identified}
elchi_collector_raw_events_sampled_out_total
```

**Config / lifecycle**

```promql
elchi_collector_runtime_config_version                  # applied config-doc version
elchi_collector_runtime_config_reloads_total
elchi_collector_runtime_config_poll_failures_total
elchi_collector_goroutine_panics_recovered_total{source}
elchi_collector_pipeline_panics_total{type}
elchi_collector_backend_healthy{backend}
```

## Storage schema

### ClickHouse — `api_events_raw`

Append-only event log. Engine `MergeTree`, order key `(project_id, normalized_path, ts)`, partitioned `toYYYYMMDD(ts)`, TTL = `RETENTION_DAYS`. Compression: ZSTD on strings, Gorilla on `duration_ms`, DoubleDelta on timestamps (typically 10–20× vs. raw).

Key columns the read API relies on:

| Column | Type | Notes |
| --- | --- | --- |
| `event_id` | `String` | Hex `bson.ObjectID`; cross-DB join key to `api_inventory.sample_event_ids[]`. |
| `ts` | `DateTime64(3)` | Extraction wall-clock; primary time axis. |
| `project_id`, `listener_name`, `listener_ip` | `LowCardinality(String)` | Parsed from Envoy `node.id` = `listener::project::ip`. |
| `protocol`, `method`, `host` | `LowCardinality(String)` | `protocol` ∈ `http/1.0`…`http/3`, `tcp`. |
| `normalized_path` | `String` | Templated path; query string always stripped. |
| `grpc_service`, `grpc_method` | `LowCardinality(String)` | For gRPC paths. |
| `status_code` | `UInt16` | `grpc_status` (`Nullable(Int32)`), `grpc_message` (only when status ≠ 0). |
| `duration_ms` | `Float64` | Request → last downstream tx byte. |
| `request_bytes`, `response_bytes` | `UInt64` | |
| `source_ip_hash`, `user_agent_hash`, `consumer_hash` | `String` | SHA-256(salt + value), 16 hex chars. |
| `source_ip`, `user_agent` | `String` | Raw values, only when the `store_raw_*` policy is on. |
| `auth_observed` | `UInt8` | 1 when an auth-bearing header was present (value never stored). |
| `risk_flags` | `Array(LowCardinality(String))` | Detection output. |
| `pii_categories`, `endpoint_categories` | `Array(LowCardinality(String))` | |
| `risk_score`, `posture_score` | `UInt8` | Two-axis severity (threat vs exposure). |
| `tls_version`, `tls_sni`, `tls_peer_subject`, `tls_peer_issuer` | | Envoy ALS TLS properties. |
| `tags` | `Map(LowCardinality(String), String)` | Enrichment output (`geo.*` / `ua.*` / `ti.*`). |
| `headers` | `Map(LowCardinality(String), String)` | Only when `store_headers` is on; sensitive headers always stripped. |

### ClickHouse — rollups

Three `AggregatingMergeTree` tables, populated by materialized views off the raw table, back the dashboard's time-series panels without scanning raw. Query with `-Merge` combinators; always filter/`GROUP BY` the `bucket` column (there is no `ts` on the rollups).

| Table | Bucket | Dimensions | Retention |
| --- | --- | --- | --- |
| `api_events_1m` | 1 minute | project, listener, method, path, status class | 30 days |
| `api_events_1h` | 1 hour | project, listener, method, path, status class | 180 days |
| `api_events_1d` | 1 day | project, listener, method, status class (no path) | 730 days |

Aggregate columns: `events_count` (`countMerge`), `duration_quantiles` (`quantilesTDigestMerge(0.5,0.95,0.99)`), `duration_avg` (`avgMerge`), `response_bytes_sum`/`_max`, `max_risk_score` (`maxMerge`), `unique_consumers`/`unique_source_ips` (`uniqHLL12Merge`), `error_count` (5xx), `client_error_count` (4xx).

:::warning[Sampling caveat on the rollups]
The rollups are materialized from the raw table, so when `policy.raw_sample_rate ≥ 2` their `events_count` / `unique_consumers` under-count benign traffic. Derive exact request volume from the **MongoDB inventory** counters (fed before sampling), not from rollup or `COUNT(*)` queries.
:::

### MongoDB — `api_inventory`

The canonical endpoint catalog — one row per unique operation. **No TTL** (cardinality-capped, default 100K/instance). Compound unique key:

```
(project_id, listener_name, protocol, host, method, normalized_path, grpc_service, grpc_method)
```

Key document fields:

| Field | Notes |
| --- | --- |
| `confirmed` | Sticky boolean — `true` once a real route-matched hit is seen; scanner/probe/static-asset hits force `false`. Drives the confirmed-vs-attack-surface split. |
| `seen_count` | `$inc` per event; the exact request count (unaffected by raw sampling). |
| `first_seen` / `last_seen` | Timestamps. |
| `risk_flags` | `$addToSet` union of every flag ever seen on the endpoint. |
| `max_risk_score` / `max_posture_score` | `$max` — worst-ever threat / posture severity. |
| `endpoint_categories` | `admin_endpoint`, `auth_endpoint`, `payment_endpoint`, `data_export`, … |
| `pii_categories` | `email`, `phone`, `ssn`, `credit_card`, `iban`, `secret_in_path`, `jwt_in_path`. |
| `auth_schemes` | `$addToSet` of `jwt` / `mtls` / `apikey` / `none`. |
| `auth_observed` / `noauth_observed` | Drive the cross-batch `auth_inconsistent` flag. |
| `consumers` | Consumer hash values (last ~5–10). |
| `status_dist` | Per-status counters, e.g. `{"200": 1100, "404": 100}`. |
| `latency_buckets` | `lt5`/`lt25`/`lt100`/`lt500`/`lt2000`/`ge2000` counters + `latency_max_ms`. |
| `sample_event_ids` | Last 5 `event_id`s — join back to `api_events_raw`. |
| `clusters` / `routes` / `content_types` / `origins` | Discovered sets. |

Indexes the read API relies on: `inventory_unique` (the eight key fields), `project_last_seen`, `project_risk_lastseen`, `project_endpoint_categories`, `project_host_path`, `project_riskscore_lastseen`, `inventory_created_at` (`{created_at: -1}`).

## Envoy ALS wiring

Point an Envoy `HttpGrpcAccessLog` sink at the collector's `:18090`. The collector identifies inventory rows from `node.id`, formatted `listener_name::project_id::listener_ip` (the trailing IP is optional and ignored by the inventory key):

```yaml
node:
  id: "public-edge::acme-prod::10.0.1.42"
  cluster: envoy
```

The header allowlist below maps directly to the fields the collector extracts. The `authorization` header is logged for **presence only** — its value is dropped by policy.

```yaml
access_log:
  - name: envoy.access_loggers.http_grpc
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.access_loggers.grpc.v3.HttpGrpcAccessLogConfig
      common_config:
        log_name: elchi
        transport_api_version: V3
        grpc_service:
          envoy_grpc:
            cluster_name: elchi_collector
        buffer_size_bytes: 262144      # 256 KiB
        buffer_flush_interval: 1s
      additional_request_headers_to_log:
        - authorization                 # presence only — value dropped by policy
        - user-agent
        - x-forwarded-for               # source-IP fallback
        - x-request-id                  # correlation
      additional_response_headers_to_log:
        - content-type
        - grpc-status
        - location                      # query string stripped before persistence
        - strict-transport-security     # presence drives the missing_hsts flag
      additional_response_trailers_to_log:
        - grpc-status
        - grpc-message                  # only stored when grpc-status != OK
```

:::warning[Source IP must be trustworthy]
The collector hashes Envoy's `downstream_remote_address`, never the client-spoofable `X-Forwarded-For` directly. Behind an edge, configure Envoy with `use_remote_address` + `xff_num_trusted_hops` so `source_ip_hash` reflects the real client, not the edge.
:::

## See also

- [API Discovery overview](/api-discovery/overview) — what the inventory and risk views show.
- [Collector Configuration](/api-discovery/collector-configuration) — the hot-reloaded runtime document.
- [Threat Intelligence & GeoIP](/api-discovery/threat-intel-geoip) — the enrichment chain.
- [Bare-Metal install](/installation/bare-metal/overview) · [Helm platform](/installation/helm-platform/overview) — provisioning the collector + ClickHouse.
