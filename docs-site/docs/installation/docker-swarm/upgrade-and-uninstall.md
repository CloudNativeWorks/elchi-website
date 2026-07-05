---
title: "Docker Swarm: Upgrade & Uninstall"
description: Upgrade the Elchi Docker Swarm stack with a version bump and rolling update, edit live configs in place, and tear the stack down.
sidebar_position: 6
tags: [installation, docker]
---

The installer is fully idempotent: secrets are preserved across runs, configs are bind-mounted from `/etc/elchi` and carry a per-service `elchi.cfghash` label, and `docker stack deploy` rolling-updates every changed service. So an **upgrade is just `install.sh` re-run** with new version flags, and `upgrade.sh` is a thin wrapper that re-execs `install.sh` with whatever arguments you pass.

## Upgrade (version bump)

Re-run with the new `--*-version` flags:

```bash
deploy/docker/upgrade.sh \
  --main-address=elchi.example.com \
  --ui-version=v1.5.5 \
  --backend-version=v1.6.6-v0.14.0-envoy1.38.3
```

Under the hood this re-renders the configs and stack file. Each service carries an `elchi.cfghash` container label over its mounted files, so a changed image tag or config file changes the label, and `docker stack deploy` rolling-updates exactly the affected services — nothing else is bounced.

The bootstrap one-liner also supports upgrades directly:

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/docker/get.sh \
  | sudo bash -s -- --upgrade --main-address=elchi.example.com --ui-version=v1.5.5
```

## Editing live configs

The bind-mounted files under `/etc/elchi` are the live source of truth. Edit a file, then force the service to pick it up:

```bash
sudo vi /etc/elchi/config/Corefile          # or envoy.yaml, config-prod-*.yaml, …
docker service update --force elchi_elchi-coredns
```

Because a bind-mount content change is invisible to Swarm on its own, a manual edit needs the `--force`. Re-running `install.sh` instead auto-applies changes via the `elchi.cfghash` label.

:::note Multi-node edits
On a multi-node cluster the config tree exists on **every** node. For a manual live edit, edit the file on every node that runs the service (or re-run the installer, which SSH-copies `/etc/elchi` to every node). One exception: `collector.env` is an `env_file:` read at deploy, so editing it needs a redeploy / `--force`.
:::

## Uninstall

`uninstall.sh` removes the stack. By default it **keeps your data volumes**:

```bash
deploy/docker/uninstall.sh                    # remove the stack, keep data volumes
deploy/docker/uninstall.sh --purge-data       # also delete data volumes (all nodes)
deploy/docker/uninstall.sh --purge            # + configs, secrets, state, host tuning
deploy/docker/uninstall.sh --purge --leave-swarm   # + every node leaves the Swarm
```

| Flag | Effect |
|---|---|
| *(none)* | `docker stack rm` — the stack is removed, volumes preserved. |
| `--purge-data` | Also delete the `elchi_*` data volumes on every node. |
| `--purge` | Everything `--purge-data` does, plus `/etc/elchi`, the state dir, legacy `elchi_*` config/secret objects, and the host tuning (`/etc/sysctl.d/99-elchi.conf`, `elchi-thp.service`). Leaves `/etc/docker/daemon.json` in place. |
| `--leave-swarm` | Every node runs `docker swarm leave --force` to dissolve the Swarm. |

:::warning Multi-node teardown
Pass the **same `--nodes`** you installed with so M1 can SSH into the workers to remove their node-local volumes and make them leave the Swarm — a manager-only `docker volume rm` can't reach worker volumes. Teardown reuses the bootstrap SSH key (`~/.ssh/elchi_cluster`) by default.
:::
