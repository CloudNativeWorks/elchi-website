---
title: The Bundled Shield Sidecar
description: How the elchi-client installer installs and configures elchi-shield by default, its sink config, and how to skip or pin it.
sidebar_position: 6
tags: [installation]
---

The elchi-client installer installs **elchi-shield** — the Envoy `ext_proc` API-security / WAF
sidecar — **by default**, in the same run. On each edge host the client writes shield's policy
files into a watched directory and shield inspects Envoy traffic over a local socket. This is
the normal way to get shield onto an edge; you rarely install it separately.

:::info[Running Envoy without elchi-client?]
If a host runs Envoy but not elchi-client, install shield on its own instead — see
[Standalone Shield Install](/installation/shield-standalone).
:::

## Installed by default

Running the standard client installer already brings up shield alongside it:

```bash
sudo bash elchi-install.sh \
  --name=web-server-01 --host=backend.elchi.io --port=443 --tls=true --token=YOUR_TOKEN
```

The shield binary is fetched from the **public elchi-archive mirror** (bundled into the same
release as the client installer), sha256-verified, and installed to
`/etc/elchi/bin/elchi-shield`. A hardened `elchi-shield.service` systemd unit is written,
enabled, and started. The shield version is pinned at release time by the elchi-archive
workflow.

### Skip or pin shield

| Flag | Description |
| --- | --- |
| `--no-shield` | Do **not** install the shield sidecar (it is installed by default). |
| `--shield-version=vX.Y.Z` | Pin a specific elchi-shield release (default: the bundled/latest version). |

```bash
# Install the client only, without the shield sidecar
sudo bash elchi-install.sh --no-shield --name=web-01 --host=… --port=443 --tls=true --token=…
```

These flags are also listed on the [client installation page](/installation/client/installation).

## Audit and metrics sink config

Unlike the standalone installer (which stores the audit DSN in a systemd `EnvironmentFile`), the
client writes **one editable sink config file** that shield reads via its `--config-file`:

```
/etc/elchi/elchi-shield/config.yaml   # mode 0600, owned by the elchi user
```

It holds the audit (ClickHouse) and metrics (OTLP) sink settings only — **not** the security
policies. It may contain the ClickHouse DSN (with a password), so it is `chmod 0600` and shield
warns if it is group-readable. Set it at install time with:

| Flag | Writes | Description |
| --- | --- | --- |
| `--shield-audit-dsn=DSN` | `audit.clickhouse_dsn` (+ `exporter: clickhouse`) | Send shield audit events to central ClickHouse. Omit → `exporter: none` (audit off, no local file). Env: `ELCHI_SHIELD_AUDIT_CLICKHOUSE_DSN`. |
| `--shield-metrics-otlp=H:P` | `metrics.otlp_endpoint` | Push shield metrics to an OTel Collector (OTLP/gRPC). Omit → `/metrics` scrape only. Env: `ELCHI_SHIELD_METRICS_OTLP_ENDPOINT`. |
| `--shield-metrics-insecure` | `metrics.otlp_insecure: true` | Use plaintext gRPC to the metrics collector. Env: `ELCHI_SHIELD_METRICS_OTLP_INSECURE`. |

The generated `config.yaml` looks like:

```yaml
# elchi-shield SINK config — audit (ClickHouse) + metrics (OTLP).
# Edit, then:  systemctl restart elchi-shield
# Holds the ClickHouse DSN (may contain a password) — keep this file chmod 0600.
audit:
  # exporter: none | clickhouse | otel  (auto = clickhouse when a dsn is set)
  exporter: clickhouse
  # ClickHouse audit sink. e.g. clickhouse://user:pass@CH-HOST:9000/elchi
  clickhouse_dsn: "clickhouse://user:pass@ch.internal:9000/elchi"
  clickhouse_ttl_days: 7
metrics:
  # Push metrics to an OTel Collector (OTLP/gRPC host:port). Empty = /metrics scrape only.
  otlp_endpoint: "otel-collector:4317"
  otlp_insecure: false
```

You can also edit this file by hand after install and `systemctl restart elchi-shield`. If the
file already exists on a re-run, the installer **preserves** it (re-asserting `0600`) rather
than overwriting your edits.

:::note[Legacy `audit.env` → `config.yaml` migration]
Installs predating `config.yaml` stored the audit DSN in `/etc/elchi/elchi-shield/audit.env`.
On upgrade, if you re-run **without** `--shield-audit-dsn`, the installer migrates the DSN out
of `audit.env` into the new `config.yaml` (so audit isn't silently dropped), then removes the
legacy file.
:::

## Where policies come from

The sink config above is separate from the **security policies**. Policies land as `*.yaml`
files in the watched directory:

```
/etc/elchi/elchi-shield/conf.d/*.yaml
```

These are pushed from the Elchi control plane (via elchi-client) and hot-reloaded atomically —
a bad file never affects live traffic. Authoring and structure are covered in
[Shield deployment](/shield/deployment).

## Socket and endpoints

The client-installed unit mirrors the standalone layout:

| Endpoint | Value |
| --- | --- |
| ext_proc UDS (Envoy connects here) | `/run/elchi-shield/extproc.sock` |
| Health / metrics (loopback) | `127.0.0.1:9001` |
| Watched policies | `/etc/elchi/elchi-shield/conf.d` |
| Data files | `/etc/elchi/elchi-shield/files` |

The socket is a group-owned UDS under a systemd `RuntimeDirectory`; Envoy's user must be in the
`elchi` group to reach it. The unit is hardened (`NoNewPrivileges`, `ProtectSystem=strict`,
loopback-only HTTP) exactly like the standalone install. Wire Envoy to the socket per
[Envoy wiring](/shield/envoy-wiring); the full flag set is in the
[Shield reference](/shield/reference).
