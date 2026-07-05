---
title: "Docker Swarm: High Availability"
description: Multi-node Docker Swarm — SSH fan-out, the auto-formed MongoDB replica set and ClickHouse Keeper cluster, and the required Swarm ports.
sidebar_position: 4
tags: [installation, docker]
---

For high availability the Docker Swarm installer runs **once on M1** (the first `--nodes` host) and fans out over SSH: it installs Docker on each other node, joins them to the Swarm with per-node logging, and then deploys. Clustering of the stateful tier is fully automatic — there are **no storage/HA flags**.

## Install (multi-node)

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/docker/get.sh \
  | sudo bash -s -- \
      --main-address=45.13.226.177 \
      --nodes=45.13.226.177,45.13.226.226,198.105.112.107 \
      --ssh-key=/root/.ssh/id_rsa        # or --ssh-password=… (default: root's identity)
```

`--nodes` accepts **IPs or hostnames**. The **first entry is M1**, where you run the installer. With no `--ssh-key`, M1 mints an ed25519 key, prompts once for each node's SSH password, distributes the key (`ssh-copy-id`), and uses the key for everything after.

SSH auto-join is idempotent (already-joined nodes are skipped). It can be turned off with `--no-ssh` — then join the workers yourself with the `docker swarm join …` command M1 prints, and re-run the installer.

## Required Swarm ports

Whether you let M1 auto-join or join workers manually, open the standard Swarm ports **between the nodes**:

| Port | Protocol | Purpose |
|---|---|---|
| `2377` | TCP | Cluster management (manager API) |
| `7946` | TCP + UDP | Node-to-node control plane (gossip) |
| `4789` | UDP | Overlay network data plane (VXLAN) |

See the [Ports reference](/reference/ports) for the full platform port map.

## How clustering is derived from the node count

The storage tier is derived entirely from how many nodes you pass — exactly like the bare-metal installer:

| Nodes | MongoDB | ClickHouse |
|---|---|---|
| 1–2 | single instance on the first node | single instance on the first node |
| 3+ | 3-member replica set on the **first 3** nodes | Keeper cluster on the **first 3** nodes |

A 4th or 5th node runs the Elchi control-plane tier and connects to the cluster over the overlay network — it does **not** run MongoDB or ClickHouse. The cluster is always exactly 3 members.

### MongoDB replica set (3+ nodes)

Three single-replica services `elchi-mongo-1..3`, each on its own volume, with keyfile internal auth. Member 1 runs a bootstrap that retries `rs.initiate` until all members are up, then creates the scoped `elchi` app user via the localhost exception. Backend and collector connect with a multi-host `replicaSet=elchi-rs` URI.

### ClickHouse Keeper cluster (3+ nodes)

Three servers `elchi-clickhouse-1..3`, each with an embedded Keeper (Raft) and the `elchi_cluster` remote-servers config. The Replicated `elchi` database is created by `install.sh` right after deploy, against each member, so it is never accidentally created as a plain Atomic database.

:::note[ClickHouse first-connect race]
The installer waits for the Keeper cluster to converge before issuing the Replicated DDL. If a collector ever wins the race and creates a plain Atomic database, just re-run `install.sh` — it is idempotent and refuses to proceed past a non-Replicated database.
:::

## Per-node topology

Every Elchi node runs the **full control-plane tier**: one controller + one control-plane *per backend variant* + the global services (envoy / registry / otel / collector / coredns / ui). With `--nodes`, the installer creates per-node, individually addressable services — `elchi-controller-node<i>` and `elchi-cp-<envoy>-node<i>`, each pinned via `node.hostname` with container `hostname=node<i>`.

The backend auto-derives `node<i>-controller` / `node<i>-controlplane-<X.Y.Z>` identities (the same scheme as the bare-metal installer), and the Envoy bootstrap carries a matching cluster + `x-target-cluster` route for each `(node, variant)` — so the registry can pin a client's xDS stream to a specific instance, not just round-robin.

## Placement

Placement is derived from `--nodes` via `node.hostname` constraints: storage member `i` pins to the `i`-th `--nodes` host; the M1 singletons (VictoriaMetrics + Grafana) pin to the first. Override the M1-singleton placement constraint with `--placement-m1="<expr>"` (default `node.role == manager`). Without `--nodes`, everything lands on the single manager.

Stateless services (envoy / otel / collector / coredns / registry are `global`; controller / cp / ui are replicable) scale the same way in both modes.

## HA limitations

- **CoreDNS GSLB `node_ip`**: a Swarm overlay container can't learn its host's external IP, so `node_ip` is set to `--main-address`. True multi-region GSLB (per-node external IPs) needs host-network CoreDNS and is out of scope here — the control plane itself is fully HA without it. See [GSLB](/traffic-and-certificates/gslb/overview).
- **Multi-node offline**: `--offline` `docker load`s only on the node it runs on. For a multi-node air-gapped install, load the bundle on every node or use a local registry — see [Offline / Air-Gapped](/installation/docker-swarm/offline-airgap).

## Config distribution

Config, secrets and TLS are host bind-mounts under `/etc/elchi`, so every node that can run a task needs them on local disk. The installer SSH-copies the whole `/etc/elchi` tree to every other node before deploy (re-copied each run). With `--no-ssh` it can't reach the workers — you must place the tree on every node yourself, e.g.:

```bash
tar -C /etc/elchi -cf - . | ssh root@<node> 'mkdir -p /etc/elchi && tar -C /etc/elchi -xpf -'
```
