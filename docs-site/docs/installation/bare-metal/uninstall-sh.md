---
title: uninstall.sh — remove the stack
description: Non-destructive uninstall by default, cluster-wide fan-out from M1, and opt-in purge flags for data, packages, and secrets.
sidebar_position: 6
---

Default uninstall is non-destructive: services stop, unit files / binaries / installer payload / nginx vhost / journald drop-in / firewall ports / managed `/etc/hosts` block all go. Mongo, VictoriaMetrics, Grafana data + secrets + TLS material are preserved unless you opt in via the matching `--purge*` flag.

## Single node (this machine only)

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- --uninstall --yes-i-mean-it
```

## Whole cluster — fan out from M1

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- --uninstall --all-nodes --yes-i-mean-it
```

Reads `/etc/elchi/nodes.list` on M1, SSHes into every M2..Mn using the SSH credentials saved at install time, and runs the local uninstall on each. Order is reverse-by-design (Mn first, M1 last) so shared state on M1 is dropped only after the dependents are gone. Add `--continue-on-error` if you want partial-cluster uninstall to finish all reachable nodes instead of aborting on the first SSH failure.

## Wipe everything (data + packages + secrets + SSH bootstrap material)

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- --uninstall --all-nodes --purge-all --yes-i-mean-it
```

:::danger[--purge-all is destructive and irreversible]
Drops Mongo + VictoriaMetrics + Grafana + nginx packages, deletes `/var/lib/{mongodb,grafana,elchi}`, removes the cluster SSH key + known_hosts pin + our authorized_keys entry, and clears the CA we added to the system trust store. Combine with `--all-nodes` only when you genuinely want a clean slate across the whole fleet.
:::

## Uninstall flags

| Flag | Description |
|---|---|
| `--purge` | Wipe `/etc/elchi`, `/var/lib/elchi`, `/var/log/elchi`, `/opt/elchi`, system trust-store anchors, and SSH bootstrap material. |
| `--purge-mongo` | Also remove mongo packages + `/var/lib/mongodb` + repo files. Implies `--purge`. |
| `--purge-vm` | Wipe VictoriaMetrics data dir. |
| `--purge-grafana` | Remove grafana package + `/var/lib/grafana` + repo files. |
| `--purge-nginx` | Remove nginx package + restore the original `nginx.conf` backup. |
| `--purge-all` | All purge flags above. |
| `--all-nodes` | Fan out to every node from `/etc/elchi/nodes.list` (M1 last, in reverse, so shared state is dropped last). |
| `--continue-on-error` | Don't abort on per-node failure; collect errors and print a summary. |
| `--ssh-user / --ssh-key / --ssh-port` | Override persisted SSH credentials. |
| `--yes-i-mean-it` | Skip the destructive-action confirmation. Required for `--non-interactive` purge. |
| `-h \| --help` | Usage banner. |
