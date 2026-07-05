---
title: "Docker Swarm: Quick Start"
description: Bring the Elchi control plane up on Docker Swarm with one command — the bootstrap one-liner, what it does, and how to inspect a dry run.
sidebar_position: 2
tags: [installation, docker]
---

Bring the full Elchi control plane up on Docker Swarm with a single command. This is the minimal single-node happy path; for multi-node HA see [High Availability](/installation/docker-swarm/high-availability).

## Prerequisites

**A Linux host and root — nothing else.** The bootstrap script auto-installs anything missing: Docker Engine (via the official `get.docker.com`) plus `curl`, `tar`, `gzip` and `openssl`.

## Install (online)

Run the `get.sh` bootstrap, which downloads the installer from the `main` branch and runs it:

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/docker/get.sh \
  | sudo bash -s -- --main-address=<your-dns-or-ip>
```

Or, from a checkout of the repo (this assumes Docker and openssl are already present):

```bash
sudo deploy/docker/install.sh --main-address=10.0.0.5
```

`--main-address` is the only required flag. It becomes the TLS certificate SAN and the UI's API URL, so use the DNS name or IP clients will actually reach the host on.

## What it does

The installer runs a fixed sequence:

1. **Initializes Swarm** if it isn't already active (`docker swarm init`).
2. **Mints secrets** — the MongoDB credentials/keyfile, the Grafana password, and other internal secrets, written as files under `/etc/elchi/secrets`.
3. **Generates a self-signed TLS certificate** (10-year ECDSA-P256) covering `--main-address`, unless you supply your own with `--tls=provided`.
4. **Renders every config** into the bind-mount tree under `/etc/elchi` (`config/`, `secrets/`, `tls/`).
5. **Generates the stack file** (`~/.elchi-docker/gen/stack.yml`) and runs `docker stack deploy` for the `elchi` stack.
6. **Waits for the services to converge**, then prints a summary.

## When it finishes

The installer prints the access URLs and the Grafana credentials, for example:

```text
┌── elchi (Docker Swarm) ───────────────────────────────
  Stack:        elchi
  UI:           https://<main-address>/
  Grafana:      https://<main-address>/grafana/   (user: admin, pass: elchi-XXXXXXXX)
  Backend API:  https://<main-address>/  (envoy edge :443)
  GSLB zone:    elchi.local
  Variants:     v1.6.6-v0.14.0-envoy1.38.3
  Manage:       docker stack services elchi
  Teardown:     deploy/docker/uninstall.sh
└────────────────────────────────────────────────────────
```

With the default self-signed certificate your browser will warn about trust — that is expected. For a real public DNS name with a reachable `:443`, ACME (Let's Encrypt) is enabled in the backend config and can issue a trusted cert; self-signed is the safe default otherwise.

Check the running services at any time:

```bash
docker stack services elchi
```

## Inspect before deploying: `--dry-run`

`--dry-run` renders every config and writes the stack file **without deploying, without root, and without touching the Docker daemon**. Everything lands under `~/.elchi-docker/gen/` for inspection:

```bash
deploy/docker/install.sh --main-address=10.0.0.5 --dry-run
# then inspect the rendered tree:
find ~/.elchi-docker/gen -type f
```

This is the fastest way to see exactly what the installer would deploy — the generated `stack.yml`, the rendered Envoy / CoreDNS / backend configs, and the TLS material.

## Next steps

- [Installer Flags](/installation/docker-swarm/flags) — tune versions, TLS, GSLB, datastores and more.
- [High Availability](/installation/docker-swarm/high-availability) — go multi-node.
- Log in and create your first configuration — see the [Quickstart](/getting-started/quickstart).
