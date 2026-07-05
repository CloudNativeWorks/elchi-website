---
title: install.sh — full flag reference
description: Complete reference for every install.sh flag — topology, SSH, versioning, TLS, MongoDB, VictoriaMetrics, Grafana, GSLB, backend, and op-mode.
sidebar_position: 4
---

Every variant tag in `--backend-version` is a full release-asset name (`elchi-vX.Y.Z-vA.B.C-envoyP.Q.R`), downloaded from the public [elchi-archive releases](https://github.com/CloudNativeWorks/elchi-archive/releases) — the binaries are mirrored there from the private `elchi-backend` repo by the `build-elchi-backend` workflow. Multiple variants are comma-separated and each gets its own systemd template unit + `/etc/elchi/<variant>/` config dir + `/var/lib/elchi/<variant>/` HOME dir.

## Topology & SSH

| Flag | Description | Default |
|---|---|---|
| `--nodes=<csv>` | Comma-separated host list, M1 first. M1 is the local machine; M2..Mn are reached over SSH. | **required** |
| `--ssh-user=<user>` | SSH login on M2..Mn. | root |
| `--ssh-port=<n>` | SSH port. | 22 |
| `--ssh-key=<path>` | Private key for non-interactive auth (recommended for production). | — |
| `--ssh-password=<pwd>` | Password fallback (uses sshpass). Avoid for production. | — |
| `--ssh-bootstrap` | Mint an ed25519 key on M1 and copy it to every remote node. Prompts INTERACTIVELY for each remote node's password (M1 skipped). Subsequent SSH uses the generated key; passwords are discarded. | — |
| `--admin-user=<name>` | **Default-ON.** Dedicated admin user provisioned on every node during bootstrap with passwordless sudo + cluster key authorized. Orchestrator's SSH user flips to this identity (persisted to `orchestrator.env`). After this, root's password / SSH login / account itself can change without breaking `upgrade` or `uninstall`. Idempotent on rerun. | elchi-cluster-admin |
| `--no-admin-user` | Opt OUT — orchestration stays on the original login user (root). Use only when your environment forbids provisioning users. | — |

## Versioning

| Flag | Description | Default |
|---|---|---|
| `--backend-version=<csv>` | One or more variant tags (release-asset basenames). Each variant runs side-by-side. Alias: `--backend-variants=`. | elchi-v1.4.8-v0.14.0-envoy1.36.2 |
| `--ui-version=<vX.Y.Z>` | UI bundle version (`elchi-dist-vX.Y.Z.tar.gz`). Mirrored to the public elchi-archive releases by the build-elchi-ui workflow. | v1.4.4 |
| `--envoy-version=<vX.Y.Z>` | Front-door Envoy proxy binary version. | v1.37.0 |
| `--coredns-version=<vX.Y.Z>` | Custom CoreDNS-with-elchi-plugin version (used only when GSLB is enabled). | v0.1.4 |
| `--collector-version=<vX.Y.Z>` | elchi-collector binary version (ALS gRPC sink → ClickHouse / Mongo). Mirrored to the public elchi-archive releases by the build-elchi-collector workflow. | v0.1.8 |
| `--no-collector` | Skip the elchi-collector install entirely (cluster runs without ALS ingestion; envoy data-plane logs are not captured). | — |

## Backend instance count per node

Replica count is **fixed by design** — there is no flag to tune it:

- **Controller** — exactly ONE per node. Version-agnostic singleton; uses `versions[0]`'s binary. Registers as bare `<hostname>`.
- **Control-plane** — exactly ONE per (node, variant). Total per node = number of variants. Each registers as `<hostname>-controlplane-<envoy-X.Y.Z>`.

Capacity for a different Envoy version → add another variant tag. Capacity for the same Envoy version → add another node. Running the same variant twice on the same host would collide on the registry name and is rejected by topology compute.

## Network & TLS

| Flag | Description | Default |
|---|---|---|
| `--main-address=<dns\|ip>` | Public address. Cert SAN. Use a DNS name with A records pointing at every node IP for round-robin, or a single VIP. | **required** |
| `--port=<n>` | Public HTTPS port; Envoy terminates TLS here. | 443 |
| `--hostnames=<csv>` | Extra cert SANs (e.g. each node's hostname). | — |
| `--tls=self-signed\|provided` | TLS mode. Default mints a 10-year ECDSA-P256 certificate via openssl. | self-signed |
| `--cert=<path>` | PEM cert (with `--tls=provided`). | — |
| `--key=<path>` | PEM private key (with `--tls=provided`). | — |
| `--ca=<path>` | Optional CA bundle for client trust verification. | — |
| `--timezone=<tz>` | TZ env var written into every elchi-* unit. | UTC |

## MongoDB

| Flag | Description | Default |
|---|---|---|
| `--mongo=local\|external` | Use bundled mongod (1 VM standalone / 2 VM standalone on M1 / 3+ VM RS-3) or operator-supplied URI. | local |
| `--mongo-uri=<uri>` | Full `mongodb[+srv]://...` for `--mongo=external`; granular flags below win on conflicts. | — |
| `--mongo-version=auto\|6.0\|7.0\|8.0` | Mongo major. `auto` picks the highest version supported on the detected distro. | auto |
| `--mongo-hosts=<csv>` | External: `host1:port1,host2:port2,...` | — |
| `--mongo-username` | External: app user. | — |
| `--mongo-password` | External: app password. | — |
| `--mongo-database` | App DB name. | elchi |
| `--mongo-scheme` | `mongodb` or `mongodb+srv`. | mongodb |
| `--mongo-port=<n>` | Per-host port (used when granular hosts list omits explicit port). | 27017 |
| `--mongo-replicaset` | External RS name. Local mode uses `elchi-rs`. | — |
| `--mongo-tls=true\|false` | TLS to external mongo. | false |
| `--mongo-auth-source` | Auth source DB. | admin |
| `--mongo-auth-mechanism` | e.g. `SCRAM-SHA-256`. Empty = backend default. | — |
| `--mongo-timeout-ms` | Server-selection timeout (ms). | 9000 |
| `--mongo-data-dir=<path>` | Local mode data dir. | /var/lib/mongodb |

## VictoriaMetrics

| Flag | Description | Default |
|---|---|---|
| `--vm=local\|external` | Bundle a VM instance on M1 or use external endpoint. | local |
| `--vm-endpoint=<url\|host:port>` | Required when `--vm=external`. | — |
| `--vm-data-dir=<path>` | Local TSDB path. | /var/lib/elchi/victoriametrics |
| `--vm-retention=<dur>` | Storage retention. | 15d |

## Grafana

| Flag | Description | Default |
|---|---|---|
| `--grafana-user` | Admin login. | admin |
| `--grafana-password` | Admin password. | random (printed in summary) |
| `--grafana-allow-plugin=<csv>` | Allow-list of unsigned plugin IDs. Pass once per plugin or comma-separated. | — |

## GSLB / CoreDNS plugin

**Default ON.** CoreDNS GSLB plugin installs on every node (port 53 TCP+UDP, webhook on 8053). The zone defaults to `elchi.local` — a non-routable `.local`-style domain that is safe out of the box for internal cluster DNS / testing. Override with `--gslb-zone=<your-delegated-domain>` for production, or pass `--no-gslb` to opt out of the plugin entirely.

| Flag | Description | Default |
|---|---|---|
| `--gslb` | No-op (default already on); kept for explicitness. | on |
| `--no-gslb` | Opt out of the GSLB CoreDNS install. | — |
| `--gslb-zone=<domain>` | Authoritative zone (e.g. `gslb.example.com`). Override the default for a real delegated domain. | elchi.local |
| `--gslb-admin-email=<email>` | SOA RNAME (with `@` → `.`). Defaults to `hostmaster@<zone>` per RFC 2142. | hostmaster@\<zone\> |
| `--gslb-nameservers=<csv>` | `ns1:ip,ns2:ip,...` NS records + glue. | — |
| `--gslb-regions=<csv>` | Region tags for the regions directive. | — |
| `--gslb-tls-skip-verify` | Skip TLS verify when plugin polls backend `/dns/snapshot`. | — |
| `--gslb-ttl=<sec>` | Default record TTL. | 300 |
| `--gslb-sync-interval=<dur>` | Backend snapshot poll interval. | 1m |
| `--gslb-timeout=<dur>` | Snapshot HTTP timeout. | 4s |
| `--gslb-static-records=<csv>` | Inline static A/AAAA/CNAME records. | — |
| `--gslb-secret=<value>` | Override the auto-generated `X-Elchi-Secret` shared secret. | auto |
| `--gslb-forwarders=<csv>` | Recursive resolvers for non-zone queries. | 8.8.8.8,8.8.4.4 |

## Backend behavior & JWT

| Flag | Description | Default |
|---|---|---|
| `--internal-communication=true\|false` | Use internal addresses for inter-service traffic. | false |
| `--cors-origins=<csv>` | Backend CORS allow-list. | * |
| `--jwt-access-duration=<dur>` | Access token lifetime. | 1h |
| `--jwt-refresh-duration=<dur>` | Refresh token lifetime. | 5h |
| `--enable-demo` | Backend demo mode (read-only sample data). | — |
| `--log-level` | Backend log level. | info |
| `--log-format=text\|json` | Log format. | text |

## Op-mode

| Flag | Description |
|---|---|
| `--non-interactive` | Never prompt; fail if a confirmation would be required. |
| `--no-firewall` | Skip firewalld/ufw port opening. |
| `--upgrade-os` | Opt-in: apply OS security advisories before the elchi-stack install (`unattended-upgrade` on debian, `dnf upgrade-minimal --security` on rhel). Security-only — never a full dist-upgrade. Default off so reruns don't churn the host OS unexpectedly. |
| `--no-upgrade-os` | Explicit opt-out (matches the default; provided for symmetry / scripting). |
| `--dry-run` | Render configs to `/tmp/elchi-dryrun-*`; skip every side-effect. |
| `--force-redownload` | Bypass sha256 cache; re-download every binary. |
| `--keep-bundle` | Preserve the encrypted handoff bundle artifact at `/tmp/` after orchestration. Also preserves the orchestrator-staged secrets-from file so the operator can re-decrypt mid-incident. |
| `--bundle-key-out=<path>` | Write the bundle decryption key to a file (mode 0600). |
| `--quiet-key` | Suppress the plaintext bundle-key emission at end of install; only a sha256 fingerprint is shown. Full key is persisted at `/etc/elchi/.bundle-key` (sealed via `systemd-creds` when available) and is recoverable via `elchi-stack show-secret bundle-key`. Use when capturing install logs so the key doesn't leak into screen recordings / tmux scrollback / CI logs. |
| `-h \| --help` | Print full usage and exit. |
