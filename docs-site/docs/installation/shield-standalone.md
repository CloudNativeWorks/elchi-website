---
title: Standalone Shield Install
description: Install elchi-shield as its own hardened systemd service on an edge host that runs Envoy without elchi-client.
sidebar_position: 7
tags: [installation]
---

Most edges run elchi-shield **bundled by elchi-client** — the client installer drops
the sidecar in the same run and manages its lifecycle. If an edge runs Envoy *without*
elchi-client (a standalone proxy host, a third-party Envoy, a test box), you can install
elchi-shield on its own from the public release mirror. This page covers that path.

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

## 1. Install the binary

Every published sidecar binary is mirrored, with a sha256, in the Elchi archive's
[`index.json`](https://archive.elchi.io/index.json) under `elchi_shield_releases`. Pick the
newest entry, download it and verify it:

```bash
# Resolve the newest published elchi-shield build from the archive manifest
URL=$(curl -fsSL https://archive.elchi.io/index.json \
      | python3 -c 'import json,sys; r=json.load(sys.stdin)["elchi_shield_releases"][0]; f=r["files"][0]; print(f["download_url"], f["sha256"], r["version"])')
set -- $URL; echo "elchi-shield $3"

sudo install -d -m 0755 /etc/elchi/bin
sudo curl -fsSL -o /etc/elchi/bin/elchi-shield "$1"
echo "$2  /etc/elchi/bin/elchi-shield" | sha256sum -c -
sudo chmod 0755 /etc/elchi/bin/elchi-shield
```

## 2. Create the identity and the tree

elchi-shield runs as the shared **`elchi` system user and group** — the same identity the rest
of the stack uses — and Envoy's user must be in that group to reach the ext_proc socket:

```bash
sudo groupadd --system elchi 2>/dev/null || true
sudo useradd --system --gid elchi --home-dir /etc/elchi --shell /usr/sbin/nologin elchi 2>/dev/null || true
sudo usermod -aG elchi envoyuser          # Envoy's own user; restart Envoy afterwards

sudo install -d -o root -g elchi -m 0750 /etc/elchi/elchi-shield
sudo install -d -o elchi -g elchi -m 2750 /etc/elchi/elchi-shield/conf.d /etc/elchi/elchi-shield/files
sudo install -d -o elchi -g elchi -m 2750 /var/log/elchi
sudo chown root:elchi /etc/elchi/bin/elchi-shield
```

## 3. Write the unit

```ini
# /etc/systemd/system/elchi-shield.service
[Unit]
Description=Elchi Shield — Envoy ext_proc API security / WAF sidecar
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=elchi
Group=elchi
# Only when you enable the ClickHouse audit sink (step 4):
#EnvironmentFile=-/etc/elchi/elchi-shield/audit.env
Environment=ELCHI_SHIELD_GOGC=200

# systemd creates/cleans /run/elchi-shield, group-owned so Envoy can reach the UDS.
RuntimeDirectory=elchi-shield
RuntimeDirectoryMode=2750

# Non-fatal on purpose: a bad policy file never blackholes traffic.
ExecStartPre=-/etc/elchi/bin/elchi-shield validate /etc/elchi/elchi-shield/conf.d
ExecStart=/etc/elchi/bin/elchi-shield \
  --config-dir /etc/elchi/elchi-shield/conf.d \
  --extproc-network unix \
  --extproc-addr /run/elchi-shield/extproc.sock \
  --http-addr 127.0.0.1:9001 \
  --log-format json \
  --log-level info

Restart=always
RestartSec=5

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
ReadWritePaths=/etc/elchi/elchi-shield /var/log/elchi
UMask=0007
LimitNOFILE=262144

StandardOutput=journal
StandardError=journal
SyslogIdentifier=elchi-shield

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now elchi-shield
curl -fsS 127.0.0.1:9001/healthz
```

## 4. Optional: audit and metrics exporters

Both are **off** unless you configure them — there is no local-file audit sink.

| Goal | What to add to the unit |
| --- | --- |
| Audit → central ClickHouse | `--audit-exporter clickhouse` on `ExecStart`, plus the DSN in the `EnvironmentFile` (below). |
| Metrics → OTel Collector | `--metrics-otlp-endpoint otel-collector:4317` (add `--metrics-otlp-insecure` for plaintext gRPC). |
| Memory tuning | `Environment=ELCHI_SHIELD_GOGC=…`, `ELCHI_SHIELD_MEM_LIMIT=…`, `ELCHI_SHIELD_MAX_INFLIGHT_BODY_BYTES=…`. |

:::note[Keep the audit DSN out of ExecStart]
The DSN carries credentials, so put it in a restricted `EnvironmentFile` — `ExecStart` is
world-readable through `systemctl cat`:

```bash
printf 'ELCHI_SHIELD_AUDIT_CLICKHOUSE_DSN=clickhouse://user:pass@ch.internal:9000/elchi\n' \
  | sudo install -o root -g elchi -m 0640 /dev/stdin /etc/elchi/elchi-shield/audit.env
```

Then uncomment the `EnvironmentFile=` line and add `--audit-exporter clickhouse`. See
[Shield observability](/shield/observability).
:::

:::tip[Bundled installs do all of this for you]
On a host that runs elchi-client, the client's installer performs every step above — and takes
`--shield-version=`, `--shield-audit-dsn=` and `--shield-metrics-otlp=` for the same settings.
See [The Bundled Shield Sidecar](/installation/client/shield-sidecar).
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

Every release is published to Docker Hub as `jhonbrownn/elchi-shield:vX.Y.Z` (plus `latest`),
built from the prebuilt release binary on `gcr.io/distroless/static-debian12:nonroot` — the
exact artifact the archive mirrors, no Go toolchain in the image. It runs as UID `65532` and
`EXPOSE`s 9001 (the loopback health/metrics port).

Share the ext_proc socket and config with Envoy through a mounted volume. The socket directory
must be **writable by uid 65532**:

```bash
docker run --rm \
  -v /etc/elchi/elchi-shield:/etc/elchi/elchi-shield \
  -v /run/elchi-shield:/run/elchi-shield \
  jhonbrownn/elchi-shield:v0.4.13 \
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

Back the policy up first — `conf.d` and `files` are the only state that is yours:

```bash
sudo tar czf ~/elchi-shield-policy.tar.gz -C /etc/elchi/elchi-shield conf.d files

sudo systemctl disable --now elchi-shield
sudo rm -f /etc/systemd/system/elchi-shield.service
sudo systemctl daemon-reload

sudo rm -rf /etc/elchi/elchi-shield /etc/elchi/bin/elchi-shield
```

Remove **only** elchi-shield's own artifacts. The shared `elchi` user/group, `/etc/elchi`,
`/etc/elchi/bin` and `/var/log/elchi` belong to elchi-client and the rest of the stack — leave
them intact on a host that runs anything else from Elchi. Finally, remove the ext_proc
cluster/filter from Envoy so it stops dialing the now-absent socket.
