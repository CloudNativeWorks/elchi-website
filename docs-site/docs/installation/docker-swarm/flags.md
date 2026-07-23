---
title: "Docker Swarm: Installer Flags"
description: The full flag reference for the Docker Swarm installer — core, versions, TLS, features, datastores, multi-node, offline and paths.
sidebar_position: 3
tags: [installation, docker]
---

The complete flag reference for `deploy/docker/install.sh` (and, verbatim, the `get.sh` bootstrap and `upgrade.sh`, which just re-exec `install.sh`). Run `install.sh --help` for the built-in list. Defaults for the component image tags live in [`versions.env`](https://github.com/CloudNativeWorks/elchi-archive/blob/main/deploy/docker/versions.env), the single source of truth; a flag or environment variable always overrides whatever is pinned there.

## Core

| Flag | Default | Purpose |
|---|---|---|
| `--main-address=<dns\|ip>` | **required** | Public address — TLS SAN + UI API URL. |
| `--port=<n>` | `443` | Public Envoy edge port. `--port=80` implies plaintext (TLS off) unless overridden. |
| `--ui-port=<n>` | `8080` | Internal UI port. |
| `--log-level=<level>` | `info` | Backend log level. |

## Versions

Component image tags. `versions.env` holds the defaults; these flags override per component.

| Flag | Default | Purpose |
|---|---|---|
| `--backend-version=<csv>` | `v1.6.9-v0.14.0-envoy1.38.3` | Backend variant tag(s), comma-separated. One control-plane + Envoy cluster is generated per variant; the embedded Envoy version must be unique per variant. |
| `--ui-version=<tag>` | `v1.5.12` | UI image tag. |
| `--coredns-version=<tag>` | `v0.1.4` | CoreDNS GSLB image tag. |
| `--collector-version=<tag>` | `v0.1.11` | elchi-collector image tag. |
| `--image-repo=<repo>` | `jhonbrownn` | Docker Hub namespace / registry for the Elchi images (point at a private mirror for air-gapped installs). |

## TLS

| Flag | Default | Purpose |
|---|---|---|
| `--tls=self-signed\|provided` | `self-signed` | Certificate mode. Self-signed is a 10-year ECDSA-P256 cert. |
| `--cert=<path>` | — | Certificate file for `--tls=provided`. |
| `--key=<path>` | — | Private key file for `--tls=provided`. |
| `--tls-san=<csv>` | — | Extra SAN names/IPs for the self-signed cert. `--main-address` and all `--nodes` are included automatically. |

## Features / external services

| Flag | Default | Purpose |
|---|---|---|
| `--no-gslb` | GSLB on | Disable the CoreDNS GSLB service. |
| `--gslb-zone=<domain>` | `elchi.local` | GSLB authoritative zone. |
| `--gslb-publish` | off | Publish CoreDNS `:53` on the host (off by default to avoid clashing with the host resolver). |
| `--no-collector` | collector on | Disable elchi-collector **and** ClickHouse. |
| `--enable-demo` | off | Enable UI demo mode. |

## Datastores

MongoDB, ClickHouse and VictoriaMetrics each default to a local container; point at an external service instead with the corresponding URI/endpoint flag.

| Flag | Default | Purpose |
|---|---|---|
| `--mongo=local\|external` | `local` | MongoDB placement. |
| `--mongo-uri=<uri>` | — | Connection URI for `--mongo=external`. |
| `--clickhouse=local\|external` | `local` | ClickHouse placement. |
| `--clickhouse-uri=<uri>` | — | Connection URI for `--clickhouse=external`. |
| `--vm=local\|external` | `local` | VictoriaMetrics placement. |
| `--vm-endpoint=<url\|host:port>` | — | Endpoint for `--vm=external`. |

:::note[Clustering has no flags]
Whether MongoDB and ClickHouse run standalone or clustered is derived entirely from the `--nodes` count — there are **no storage/HA flags**. See [High Availability](/installation/docker-swarm/high-availability).
:::

## Grafana

| Flag | Default | Purpose |
|---|---|---|
| `--grafana-user=<u>` | `admin` | Grafana admin user. |
| `--grafana-password=<p>` | auto-generated | Grafana admin password. If unset, a random one of the form `elchi-<8 hex>` is minted and printed at the end of the install. |

## Host tuning

| Flag | Default | Purpose |
|---|---|---|
| `--no-tune-host` | tuning on | Skip all host tuning (sysctl, Transparent Huge Pages off, docker log rotation). Use on a shared / externally-managed host. All tuning steps are best-effort and idempotent. |

By default the installer applies kernel sysctl tuning (`vm.max_map_count`, `net.core.somaxconn`, `nf_conntrack_max`, and more), disables Transparent Huge Pages via a persistent `elchi-thp.service` oneshot (MongoDB and ClickHouse require this), and configures Docker json-file log rotation (`max-size=50m`, `max-file=5`) if `/etc/docker/daemon.json` is absent. On multi-node it applies these on every node over SSH.

## Multi-node

Run the installer **once on M1** (the first `--nodes` host); it fans out over SSH. See [High Availability](/installation/docker-swarm/high-availability) for the full model.

| Flag | Default | Purpose |
|---|---|---|
| `--nodes=<csv>` | single node | Node IPs or hostnames — the first is M1, where you run this. M1 SSHes into the rest, installs Docker, joins them to the Swarm, then deploys. |
| `--ssh-user=<user>` | `root` | SSH user for the other nodes. |
| `--ssh-port=<port>` | `22` | SSH port. |
| `--ssh-key=<path>` | mints ed25519 | Existing private key (skips the key-bootstrap step). |
| `--ssh-password=<pwd>` | prompted | Password for the one-time key copy (else prompted once per node). |
| `--no-ssh` | auto-join | Don't auto-join; join the workers yourself first, then re-run. |
| `--placement-m1="<expr>"` | `node.role == manager` | Placement constraint for the M1-pinned stateful services. |

## Operational

| Flag | Default | Purpose |
|---|---|---|
| `--offline=<tarball>` | online | `docker load` a `save-images.sh` bundle before deploy and deploy with `--resolve-image=never`. See [Offline / Air-Gapped](/installation/docker-swarm/offline-airgap). |
| `--overlay-mtu=<n>` | `1500` | Set the `elchi-net` overlay MTU (e.g. `1400`) for tunnelled / cross-DC links where path MTU < 1500. |
| `--non-interactive` | off | Never prompt. |

## Paths

| Flag | Default | Purpose |
|---|---|---|
| `--stack-name=<name>` | `elchi` | Swarm stack name. |
| `--state-dir=<path>` | `~/.elchi-docker` | Where the generated `stack.yml` lives (`<state-dir>/gen`). |
| `--etc-dir=<path>` | `/etc/elchi` | Root of the bind-mounted, editable config/secrets/TLS tree. |
| `--dry-run` | off | Render config + stack file only; no deploy, no root, no daemon. Inspect `~/.elchi-docker/gen/`. |
