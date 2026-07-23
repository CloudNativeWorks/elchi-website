---
title: upgrade.sh — version-diff upgrade
description: Version-diff upgrades with hash-based reconcile, additive or declarative variant changes, health gate, and per-binary rollback.
sidebar_position: 5
---

Run on M1. Computes the diff against the running cluster (`added` / `kept` / `removed` variants) and re-runs `install.sh` with the union. Every `elchi-*` systemd unit goes through hash-based reconcile so binary or config changes trigger a restart; unchanged services stay running. Single-flight via `flock /run/elchi-upgrade.lock`.

:::info[No SSH flags needed after install]
`install.sh` persists `ELCHI_SSH_USER / KEY / PORT` to `/etc/elchi/orchestrator.env` (mode 0600 root). Re-run upgrade or uninstall without `--ssh-user / --ssh-key / --ssh-port` and they'll fall back to the persisted values. Pass a flag explicitly to override.
:::

## Add a new variant (additive — keeps current set)

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- --upgrade \
      --add-backend-version=elchi-v1.6.9-v0.14.0-envoy1.38.3
```

One-liner shortcut: appends a new envoy version to the current variant set without re-listing what's already deployed. Cluster-wide effect — control-plane systemd unit + binary land on every node, port allocations are deterministic, UI's `config.js` `AVAILABLE_VERSIONS` regenerates so the new envoy version shows up in the version dropdown.

## Bump just the UI

```bash
curl -fsSL .../get.sh | sudo bash -s -- --upgrade --ui-version=v1.5.12
```

Backend / envoy / coredns / mongo / VM stay on their current versions — install.sh's hash-based reconcile marks each as `noop`. Only nginx may restart if the UI config block changed.

## Bump just CoreDNS (GSLB plugin)

```bash
curl -fsSL .../get.sh | sudo bash -s -- --upgrade --coredns-version=v0.1.4
```

## Replace variant set explicitly (full union)

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- --upgrade \
      --backend-version=elchi-v1.6.6-v0.14.0-envoy1.38.0,elchi-v1.6.9-v0.14.0-envoy1.38.3
```

Declarative — supplies the FULL desired variant set. Anything currently deployed but not in this list is auto-pruned by install.sh's stale-variants pass (no `--prune-missing` needed; the flag remains for operators who prefer the intent visible in the plan banner).

## Replace a variant + drop the old one (declarative)

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- --upgrade \
      --backend-version=elchi-v1.6.9-v0.14.0-envoy1.38.3 \
      --prune-missing
```

## Bump UI + Envoy proxy together

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/standalone/get.sh \
  | sudo bash -s -- --upgrade \
      --ui-version=v1.5.12 \
      --envoy-version=v1.38.3
```

## Upgrade flags

| Flag | Description |
|---|---|
| `--backend-version=<csv>` | New variant set (replaces current). Omit to keep the current set. |
| `--add-backend-version=<csv>` | Additive: appends to the current variant set. UX shortcut — start serving an additional Envoy version without re-listing what's already deployed. Triggers control-plane unit creation + UI `config.js` regeneration cluster-wide. Mutually exclusive with `--prune-version` / `--prune-missing`. |
| `--ui-version=<vX.Y.Z>` | Bump UI bundle. |
| `--envoy-version=<vX.Y.Z>` | Bump front-door Envoy. |
| `--coredns-version=<vX.Y.Z>` | Bump CoreDNS plugin (only with GSLB enabled). |
| `--mongo-version=auto\|6.0\|7.0\|8.0` | Forwarded to install.sh; package upgrade if differs. |
| `--grafana-user / --grafana-password` | Rotate Grafana admin login. |
| `--prune-version=<tag>` | Remove this specific variant after install. Repeatable / csv. Mutually exclusive with `--prune-missing`. Note: any variant simply omitted from `--backend-version` is also auto-pruned by install.sh — this flag is for making the intent visible in the plan banner. |
| `--prune-missing` | Declarative — remove every CURRENT variant that isn't in the new `--backend-version` list. Same effect as just dropping them; redundant in practice but kept for explicitness. |
| `--upgrade-os` | Apply OS security patches as part of this upgrade. Default OFF — most upgrade reruns just refresh elchi-stack code, not the host OS. Security-only when enabled (`unattended-upgrade` on debian, `dnf upgrade-minimal --security` on rhel). |
| `--no-upgrade-os` | Explicit opt-out (matches the default). |
| `--skip-health-gate` | Bypass post-upgrade `verify::deep_health`. Faster but unsafer; only use when verify itself is the problem. |
| `--ssh-user / --ssh-key / --ssh-port` | Override persisted SSH credentials. |
| `-h \| --help` | Usage Banner. |

:::info[Health gate & rollback]
After install.sh finishes, every node runs `verify::deep_health`: systemd state + journalctl registration log + Envoy admin `/listeners` bind check. A failure triggers per-binary rollback on the failed nodes (`.prev` snapshot → restart). Healthy nodes keep the new version; the operator retries against the bad node. **install.sh also auto-prunes** any variant left on disk but not in the active set, so a partial / aborted upgrade self-heals on the next run.
:::

:::info[No double-fetch on remote nodes]
Backend binaries and the UI tarball are downloaded once on M1 and shipped to every other node inside the encrypted handoff bundle (`/tmp/elchi-bundle-*.tar.gz.enc`). A 3-node upgrade fetches one 79MB binary + 16MB UI tarball from GitHub, not three. Remote nodes log `binary already present` / `UI bundle already extracted` instead of re-downloading.
:::
