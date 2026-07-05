---
title: Quick Start
description: One-command bare-metal installs — single VM all-in-one and 3-VM clusters with key-based or interactively bootstrapped SSH.
sidebar_position: 3
---

## Single VM (all-in-one)

Without `--nodes` the installer defaults to a single-VM setup on this machine — it auto-detects the first non-loopback IPv4 from `hostname -I` and uses that as M1.

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- \
      --main-address=elchi.example.com \
      --gslb-zone=gslb.example.com \
      --ui-version=v1.4.4 \
      --backend-version=elchi-v1.4.8-v0.14.0-envoy1.36.2 \
      --envoy-version=v1.36.2
```

## 3-VM cluster, multi-version backend, key-based SSH

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- \
      --nodes=10.10.10.2,10.10.10.3,10.10.10.4 \
      --ssh-user=ubuntu --ssh-key=/root/.ssh/cluster_key \
      --main-address=elchi.example.com \
      --gslb-zone=gslb.example.com \
      --ui-version=v1.4.4 \
      --backend-version=elchi-v1.4.8-v0.14.0-envoy1.35.3,elchi-v1.4.8-v0.14.0-envoy1.36.2,elchi-v1.4.8-v0.14.0-envoy1.38.0 \
      --envoy-version=v1.36.2
```

:::info[GSLB zone (default elchi.local)]
The CoreDNS GSLB plugin is enabled by default. If you skip `--gslb-zone`, the installer falls back to `elchi.local` — a non-routable `.local`-style namespace safe for internal cluster DNS / testing. Pass `--gslb-zone=<your-delegated-domain>` for a real authoritative deployment, or `--no-gslb` to skip the plugin entirely.
:::

:::warning[Post-install UI activation (required for GSLB to actually serve records)]
The installer ships and boots the CoreDNS daemon (TCP/UDP `:53`, webhook `:8053`), but the backend-side configuration that the plugin polls for the authoritative snapshot is OFF until you turn it on in the UI:

1. Open the UI → **Settings → GSLB**.
2. Toggle **Enable GSLB**.
3. Set **DNS Zone** (the same value you passed as `--gslb-zone`; warning: zone cannot be changed later without a re-install).
4. Paste the **DNS Secret**. Grab it on M1 with `sudo elchi-stack show-secret gslb` — this is the `X-Elchi-Secret` the plugin uses to authenticate its `/dns/snapshot` poll to the backend, and the values MUST match.
5. Click **Update Configuration**. Within one `--gslb-sync-interval` (default 1 min) every node's CoreDNS plugin pulls the fresh snapshot and starts answering queries.

Verify after activation: `dig @<node-ip> <zone> SOA +short` on any node should return the SOA record. If it doesn't, `journalctl -u elchi-coredns -n 50` and the plugin `/health` endpoint on `127.0.0.1:8053` will say why (auth failure / snapshot poll error).
:::

:::info[Variants & replicas]
Each `--backend-version` entry is ONE variant. The number of variants determines how many backend processes per node: 3 variants = 1 controller + 3 control-planes per node (one control-plane per Envoy version). Same variant cannot appear twice — duplicates collide on the registry name `<hostname>-controlplane-<X.Y.Z>` and the installer rejects them. Capacity scales by adding nodes, not by replicating a variant on the same node.
:::

## 3-VM cluster, no SSH key set up yet (interactive bootstrap)

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- \
      --nodes=10.10.10.2,10.10.10.3,10.10.10.4 \
      --ssh-bootstrap \
      --main-address=elchi.example.com \
      --gslb-zone=gslb.example.com \
      --backend-version=elchi-v1.4.8-v0.14.0-envoy1.36.2
```

`--ssh-bootstrap` mints a fresh ed25519 key on M1, then prompts the operator *once per remote node* for that node's password. Each password is used only for that node's `ssh-copy-id` and is discarded immediately after. M1 itself is local — no password prompt for it. Subsequent SSH (orchestration, upgrades, uninstall) all use the generated key.

:::info[Dedicated admin user (default)]
By default the bootstrap also creates a key-only, passwordless-sudo admin user (`elchi-cluster-admin`) on every node — including M1 — and locks all subsequent orchestration to that identity. After the first install, the operator can lock root's password, disable root SSH login, or even delete the root account; `upgrade` and `uninstall` keep working because they run as `elchi-cluster-admin` with sudo. Override the name with `--admin-user=<name>` or opt out with `--no-admin-user`.
:::

:::warning[Node order matters]
The first IP in `--nodes` is "M1" — orchestrator + singleton storage (mongo, VictoriaMetrics, Grafana). It MUST be the local machine you're running the curl on. Re-installing or upgrading? Keep the same order — swapping IPs reassigns M1 and orphans data.
:::
