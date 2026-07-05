---
title: CLI & Configuration Reference
description: Every elchi-shield command-line flag with its default and purpose, the ELCHI_SHIELD_* environment variables, the validate subcommand, and on-disk paths.
sidebar_position: 11
---

The `elchi-shield` binary is configured entirely at process start: command-line flags, with `ELCHI_SHIELD_*` environment-variable fallbacks, and an optional process-config file for sink settings. Policies are **not** configured here — they arrive as files in the watched directory (see [Deploying Policies to Edges](/shield/deployment)).

Precedence: **flag → environment variable → default**. Each flag's env var is `ELCHI_SHIELD_` plus the flag name upper-cased with dashes as underscores (e.g. `--config-dir` → `ELCHI_SHIELD_CONFIG_DIR`), with two exceptions noted below.

## Identity & config

| Flag | Default | Purpose |
|---|---|---|
| `--instance-id` | `<hostname>-shield` | Instance identity stamped on metrics, logs, and audit events |
| `--config-dir` | `/etc/elchi/elchi-shield/conf.d` | Directory of policy config files to watch and hot-reload |
| `--config-file` | *(empty)* | Optional process-config YAML for the audit/metrics **sink** settings (DSN, OTLP endpoint, …); flags/env override it. Separate from `--config-dir` (policies) |

## Transport

| Flag | Default | Purpose |
|---|---|---|
| `--extproc-network` | `unix` | ext_proc listener network: `unix` or `tcp` |
| `--extproc-addr` | `/etc/elchi/elchi-shield/extproc.sock` | Single-listener ext_proc address (socket path or `host:port`). Installers typically use `/run/elchi-shield/extproc.sock` |
| `--extproc-listener` | *(none)* | Per-listener ext_proc socket, repeatable: `id=network:addr` (e.g. `lst1=unix:/etc/elchi/elchi-shield/lst1.sock`). Env: `ELCHI_SHIELD_EXTPROC_LISTENERS` (comma-separated) |
| `--http-addr` | `127.0.0.1:9001` | HTTP address for health/metrics — must be loopback |
| `--allow-non-loopback` | `false` | **Dangerous:** permit binding TCP to non-loopback addresses (exposes the sidecar) |
| `--listener-id` | *(empty)* | Envoy listener id this instance serves; the fallback `listener` metric label when Envoy sends no request attribute |

:::danger Loopback only
Shield refuses to bind non-loopback TCP (for both ext_proc and the HTTP server) unless `--allow-non-loopback` is set. The sidecar inspects data-plane traffic and must never be reachable off-box; prefer Unix domain sockets, which are local by construction. See [Wiring Shield into Envoy](/shield/envoy-wiring).
:::

## Limits & behavior

| Flag | Default | Purpose |
|---|---|---|
| `--max-body-bytes` | `1048576` (1 MiB) | Hard fallback body cap when a policy specifies none; an over-limit body is blocked, non-skippably |
| `--xff-trusted-hops` | `0` | Trusted reverse proxies in front of Envoy; the client IP is read this many hops in from the **right** of `X-Forwarded-For` (0 = the immediate hop Envoy appends — the secure default; the spoofable leftmost token is never trusted) |
| `--max-inflight-body-bytes` | `268435456` (256 MiB) | Cap on total body bytes buffered across **all** concurrent streams (0 = unbounded); over-budget bodies are truncated → blocked |
| `--watch-debounce` | `300ms` | Config watcher debounce window (coalesces multi-file writes into one reload) |
| `--default-allow` | `true` | Posture when no policy matches a request: allow (`true`) or deny (`false`) |

## Audit

| Flag | Default | Purpose |
|---|---|---|
| `--audit-exporter` | *(auto)* | Audit sink: `none` \| `clickhouse` \| `otel`. Default: `clickhouse` if a DSN is set, `otel` if an OTLP endpoint is set, else `none` — there is **no local-file sink** |
| `--audit-clickhouse-dsn` | *(empty)* | ClickHouse DSN (the default audit sink when set) |
| `--audit-clickhouse-table` | *(empty)* | Audit table name (empty = `elchi_shield_audit`) |
| `--audit-clickhouse-batch-size` | `0` | Insert batch size (0 = default 500) |
| `--audit-clickhouse-flush-interval` | `1s` | Time-based flush so low-traffic rows land promptly (0 = size-only flushing) |
| `--audit-clickhouse-ttl-days` | `0` | Audit row TTL in days (0 = default 7, matching the collector's retention) |
| `--audit-otel-endpoint` | *(empty)* | OTLP endpoint for the `otel` audit exporter |
| `--audit-otel-insecure` | `false` | Use an insecure (plaintext) OTLP connection for audit |
| `--audit-max-per-sec` | `0` | Global cap on **non-finding** (allow-stream) audit events/sec (0 = unlimited). Findings are always audited |

## Metrics

| Flag | Default | Purpose |
|---|---|---|
| `--metrics-otlp-endpoint` | *(empty)* | Push metrics to this OTel Collector (OTLP/gRPC `host:port`); empty = scrape `/metrics` only |
| `--metrics-otlp-insecure` | `false` | Plaintext gRPC to the metrics collector |
| `--metrics-otlp-interval` | `15s` | Metrics push interval |

## Runtime & diagnostics

| Flag | Default | Purpose |
|---|---|---|
| `--log-level` | `info` | `debug`, `info`, `warn`, `error` |
| `--log-format` | `json` | `json` or `text` |
| `--log-source` | `false` | Include source `file:line` in logs (auto-on at debug level) |
| `--pprof` | `true` | Expose `/debug/pprof/*` on the loopback HTTP server |
| `--mem-limit-bytes` | `0` | Soft memory limit (GOMEMLIMIT) in bytes; the GC reins in before the kernel OOM-kills the sidecar (0 = unset). Env: `ELCHI_SHIELD_MEM_LIMIT`. Set it well above `--max-inflight-body-bytes` |
| `--gogc` | `0` | GC target percent; higher = less frequent GC, more throughput, more heap. Pair with `--mem-limit-bytes`. 0 = runtime/`GOGC` default |
| `--block-profile-rate` | `0` | `runtime.SetBlockProfileRate` (0 = off); opt-in contention profiling |
| `--mutex-profile-fraction` | `0` | `runtime.SetMutexProfileFraction` (0 = off) |
| `--shutdown-timeout` | `15s` | Graceful shutdown timeout (drain ext_proc streams, flush audit) |
| `--version` | — | Print the version and exit |

## The `validate` subcommand

```bash
elchi-shield validate /etc/elchi/elchi-shield/conf.d
```

Runs the config parse → validate → merge pipeline against a directory and reports every problem with **file + field attribution** (e.g. `api.yaml: domains[2].routes[0].match.path_regex: invalid regex`), touching no running state. `elchi-client` invokes it on every staged config bundle as a **pre-commit gate** — against the same binary version that will run the config — before committing files into the live directory (see [Deploying Policies to Edges](/shield/deployment)). The installer also runs it as a non-fatal `ExecStartPre`.

Exit codes: `0` = valid (an empty directory is valid — it means "clear"), `1` = invalid (errors on stderr), `2` = usage error.

Scope: parse and schema/field validation. Engine *compilation* (Coraza ruleset build, data-file loading) is not run here; a compile-stage failure is still caught at the real reload, where the last-good config stays active.

## On-disk paths

| Path | What it is |
|---|---|
| `/etc/elchi/elchi-shield/conf.d/` | The watched policy directory (`--config-dir`), managed by `elchi-client` |
| `/etc/elchi/elchi-shield/extproc.sock` | Default ext_proc UDS path (flag default); the installer uses `/run/elchi-shield/extproc.sock` (a systemd `RuntimeDirectory`) instead |
| `/etc/elchi/elchi-shield/audit.env` | Restricted `EnvironmentFile` holding the ClickHouse DSN (installer-managed; the DSN may carry credentials, so it never appears in the unit file) |
| `/etc/elchi/bin/elchi-shield` | The binary (installer layout) |
| `/etc/systemd/system/elchi-shield.service` | The hardened systemd unit |

Operational quick checks on an edge:

```bash
systemctl status elchi-shield
journalctl -u elchi-shield -f
curl -s http://127.0.0.1:9001/healthz
curl -s http://127.0.0.1:9001/configz | jq
```

For the metric catalog, audit schema, and health endpoints behind `--http-addr`, see [Metrics, Audit & Health](/shield/observability).
