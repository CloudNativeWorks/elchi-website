---
title: Standalone Shield Install
description: Install elchi-shield as its own hardened systemd service on an edge host that runs Envoy without elchi-client.
sidebar_position: 7
tags: [installation]
---

Most edges run elchi-shield **bundled by elchi-client** — the client installer drops
the sidecar in the same run and manages its lifecycle. If an edge runs Envoy *without*
elchi-client (a standalone proxy host, a third-party Envoy, a test box), you can install
elchi-shield on its own with `deploy/elchi-shield-install.sh`. This page covers that path.

:::info[Which install do I want?]
If elchi-client already runs on the host, do **not** use this installer — the client
installs and owns elchi-shield for you. See
[The Bundled Shield Sidecar](/installation/client/shield-sidecar) and the
[Elchi Client overview](/installation/client/overview). Use the standalone installer only
when there is no elchi-client on the box.
:::

Unlike elchi-client, elchi-shield has **no central connection of its own**. Its policy is
delivered as files into a watched directory; the standalone installer only places the binary
and the systemd unit, so it takes no `--host` and no `--token`. On a client-less host you are
responsible for populating the watched config directory yourself.

## What the installer does

Run it as root from an elchi-shield checkout (or a downloaded copy of the script):

```bash
sudo ./deploy/elchi-shield-install.sh
```

By default this:

- creates the shared **`elchi` system user and group** (idempotent — the same identity the
  rest of the Elchi stack uses);
- adds Envoy's user (`envoyuser`) to the `elchi` group so it can reach the ext_proc socket;
- builds the `/etc/elchi/elchi-shield` directory tree;
- downloads the latest release binary, **sha256-verified**, to `/etc/elchi/bin/elchi-shield`;
- writes a hardened `elchi-shield.service` systemd unit;
- enables and starts the service.

### Flags

| Flag | Description |
| --- | --- |
| `--version=vX.Y.Z` | Install a specific release (default: latest). |
| `--build` | Compile this checkout instead of downloading a release. Needs **Go 1.26+** on `PATH` (static, `CGO_ENABLED=0`). |
| `--user=NAME` | Service user/group (default `elchi`). |
| `--no-start` | Install and enable the unit but do not start it. |
| `--audit-clickhouse-dsn=DSN` | Send audit events to central ClickHouse. Omit → audit is **OFF** (there is no local-file sink). Env: `ELCHI_SHIELD_AUDIT_CLICKHOUSE_DSN`. |
| `--metrics-otlp-endpoint=H:P` | Push metrics to an OTel Collector over OTLP/gRPC. Omit → only the loopback `/metrics` scrape exists. Env: `ELCHI_SHIELD_METRICS_OTLP_ENDPOINT`. |
| `--metrics-otlp-insecure` | Use plaintext gRPC to the metrics collector. Env: `ELCHI_SHIELD_METRICS_OTLP_INSECURE`. |

```bash
# Pin a release, wire audit to ClickHouse and metrics to an OTel Collector
sudo ./deploy/elchi-shield-install.sh \
  --version=v0.4.5 \
  --audit-clickhouse-dsn=clickhouse://user:pass@ch.internal:9000/elchi \
  --metrics-otlp-endpoint=otel-collector:4317 --metrics-otlp-insecure

# Build from the local checkout instead of downloading
sudo ./deploy/elchi-shield-install.sh --build
```

The `make install` target wraps this and passes `--build` (compile the checkout);
pass extra args with `ARGS=…` (e.g. `make install ARGS="--version=v0.4.5"`).

:::note[Audit DSN handling]
When you pass `--audit-clickhouse-dsn`, the DSN may carry credentials, so it is written to a
restricted `EnvironmentFile` (`/etc/elchi/elchi-shield/audit.env`, mode `0640`) that the unit
reads — never to the world-readable `ExecStart`. Re-running **without** the flag drops any
stale DSN and disables audit. See [Shield observability](/shield/observability).
:::

## Layout and socket

| Path | Purpose |
| --- | --- |
| `/etc/elchi/bin/elchi-shield` | The binary (owned `root:elchi`, mode `0755`). |
| `/etc/elchi/elchi-shield/conf.d` | Watched policy directory (`*.yaml` / `*.json`); hot-reloaded. |
| `/etc/elchi/elchi-shield/files` | Data files (threat feeds, JWKS, OpenAPI specs). |
| `/run/elchi-shield/extproc.sock` | ext_proc UDS Envoy connects to (systemd `RuntimeDirectory`, group-owned `elchi`). |
| `127.0.0.1:9001` | Loopback health/metrics (`/healthz`, `/readyz`, `/metrics`). |
| `/var/log/elchi` | Shared log directory. |

The watched `conf.d` starts empty — an empty directory means "no policy", so the configured
default posture applies. On a standalone host, drop your policy files here yourself (there is
no elchi-client to push them). Policy authoring is covered in
[Shield deployment](/shield/deployment).

### systemd hardening

The generated unit runs the sidecar locked down: `NoNewPrivileges`, `ProtectSystem=strict`,
`ProtectHome`, `PrivateTmp`, `ProtectKernelTunables`, `ProtectControlGroups`,
`RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6`, `UMask=0007`, and `ReadWritePaths` limited
to the shield tree and the log dir. Health/metrics bind loopback only; the ext_proc socket is a
group-owned UDS. The sidecar is **never reachable off-box** by construction. An
`ExecStartPre=… validate` step checks the config dir at boot but is non-fatal — a bad file
never blackholes traffic; shield keeps the last valid config and applies the default posture.

## Wire Envoy to the socket

Point Envoy's ext_proc cluster at the UDS and make sure Envoy's user is in the `elchi` group
(restart Envoy after `usermod` so it picks up the new group):

```
unix:///run/elchi-shield/extproc.sock
```

The full filter/cluster configuration — and the request attributes shield reads — is in
[Envoy wiring](/shield/envoy-wiring). All process flags are in the
[Shield reference](/shield/reference).

## Run Shield in a container

elchi-shield also ships as a minimal, static, **distroless non-root** image — a single full
binary with every engine (including the Coraza WAF and embedded OWASP CRS) and audit sink
compiled in. There are no build tags and no "lean" variant.

- `make docker` builds the from-source reference image (`deploy/Dockerfile`, multi-stage,
  `golang:1.26` → `gcr.io/distroless/static-debian12:nonroot`).
- The release pipeline instead bundles the prebuilt release binary with
  `deploy/Dockerfile-release-binary` (no Go toolchain, reusing the exact GitHub Release
  artifact).

Both images run as UID `65532` and `EXPOSE 9001` (the loopback health/metrics port).

Share the ext_proc socket and config with Envoy through a mounted volume. The socket directory
must be **writable by uid 65532**:

```bash
docker run --rm \
  -v /etc/elchi/elchi-shield:/etc/elchi/elchi-shield \
  -v /run/elchi-shield:/run/elchi-shield \
  elchi-shield:latest \
    --config-dir /etc/elchi/elchi-shield/conf.d \
    --extproc-network unix \
    --extproc-addr /run/elchi-shield/extproc.sock \
    --http-addr 127.0.0.1:9001
```

Envoy (in the same pod / on the same host) then dials the shared UDS.

:::warning[Exposing 9001 in a container]
9001 is loopback-only by default; a non-loopback bind is **refused** unless you pass
`--allow-non-loopback`. Only expose the port (`-p 9001:9001 … --http-addr 0.0.0.0:9001
--allow-non-loopback`) on a trusted, network-isolated interface — the sidecar must never be
reachable from untrusted networks.
:::

## Uninstall

```bash
sudo ./deploy/elchi-shield-uninstall.sh          # prompts for confirmation
sudo ./deploy/elchi-shield-uninstall.sh --yes    # non-interactive
```

This removes **only** elchi-shield's own artifacts: the service, the binary, the
`/etc/elchi/elchi-shield` tree (offering a `tar.gz` backup of `conf.d`/`files` first if policy
files are present), and any legacy local audit log from pre-ClickHouse installs. The shared
`elchi` user/group, `/etc/elchi`, `/etc/elchi/bin`, and `/var/log/elchi` are **left intact** —
they belong to elchi-client and the rest of the stack. Remember to remove the ext_proc
cluster/filter from Envoy afterward so it stops dialing the now-absent socket.
