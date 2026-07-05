---
title: Deploying Policies to Edges
description: How a Shield policy travels from the UI to every edge — the merged bundle, the SHIELD_DEPLOY job, elchi-client's atomic file sync, and reload confirmation.
sidebar_position: 8
---

Shield never talks to the management plane. Its configuration is **files in a watched directory**, and the delivery chain is: the controller renders a project's policies into one bundle, the edge agent (`elchi-client`) lands the files atomically, and Shield's own watcher hot-reloads them. This page walks that chain end to end.

:::info[Config is files-only]
The management plane **distributes configuration only** — there is no per-update API call to Shield. `elchi-client` writes files into `/etc/elchi/elchi-shield/conf.d`; Shield self-watches the directory (fsnotify + debounce) and hot-reloads atomically. Shield is **never restarted** for a config change, and an invalid config never affects live traffic — the last-good snapshot stays active. See [How Shield Works](/shield/how-it-works).
:::

## One project, one bundle

All of a project's Shield policies are **merged into a single full-sync bundle** — the complete desired state every edge mirrors. Each policy contributes its generated config file (e.g. `api-public.yaml`) plus any data files; file paths must be unique across the project's policies (collisions are rejected at save time). The bundle version is a deterministic digest of the merged content, so the edge's active config version changes if — and only if — the content does.

Deploys are **automatic and asynchronous**:

- **Create / Save / Delete** in the [Policy Editor](/shield/ui/policy-editor) queues a `SHIELD_DEPLOY` background job that pushes the merged bundle to **every connected edge** in the project. The UI toast links to the job's per-client results (applied version, reload confirmation, precise config errors). If a deploy for the project is already queued, the change is deduplicated into it.
- **Reconnect** — when an edge comes (back) online, a connect-triggered deploy brings that one client up to the project's desired state, so edges that were offline during a change heal automatically.
- **Sync** — the button on the policy list re-pushes the project's merged policy set to all connected edges on demand (e.g. after recovering an edge, or to force convergence).

### Deleting the last policy

Deleting policies re-deploys the remaining set. Deleting the **last** policy does not leave an empty directory behind — the controller pushes an explicit **"inspection off" clear config**: a valid zero-domain policy with `mode: "off"` as the default. Shield loads it (the active version changes, so the reload confirms honestly) and inspection genuinely stops. Running **Sync** on a project with zero policies pushes the same clear config, and the UI asks for confirmation first.

## The elchi-client SHIELD command

On each edge, `elchi-client` handles three `SHIELD` sub-commands from the controller's command stream:

### `UPDATE_SHIELD_CONFIG`

Reconciles the watched directory to the pushed bundle with a **two-phase, atomic** sync designed so Shield never sees a half-written state:

1. **Prepare** — every file is validated and staged into a sibling `.tmp` file (an extension Shield's loader ignores). Inline content is hash-checked against its SHA-256; URL-fetched artifacts *require* a SHA-256 and are bounded (2-minute timeout, 512 MiB cap). Any error aborts with the live directory untouched.
2. **Validate** — before touching any live file, the staged config is checked with the local `elchi-shield validate` binary — the same version that will run it — so a bad config is rejected with Shield's precise file+field error instead of landing on disk and being silently kept out at reload.
3. **Commit** — the staged temps are renamed into place in a fast burst that Shield's watch debounce coalesces into a **single reload** of the final state. On a full sync, files not in the bundle are pruned (deletions propagate), and re-pushing identical content is a no-op (per-file SHA-256 idempotency).

After the commit, the agent **confirms the reload** against Shield's loopback management endpoint: it snapshots `/configz` before the push and then polls until either the active config **version (a content hash) changes** — the new config is live — or Shield's **reload-failure counters advance**, meaning Shield rejected the config and kept last-good. In the rejection case the agent surfaces Shield's attributed reason (e.g. `auth.yaml: engines.hmac_sign.secret: must be at least 64 bytes`) back to the job, and the command reports **failure** rather than an optimistic success. An idempotent re-push (nothing changed on disk) skips the wait entirely.

### `GET_SHIELD_CONFIG`

Lists the files currently under the watched directory — relative path, SHA-256, and file mode (content is omitted) — so the control plane can inspect what an edge is actually running.

### `GET_SHIELD_STATUS`

Reports the `elchi-shield` systemd service state plus the most recent journald log lines (best-effort), mirroring the other edge-service status commands.

## File layout on the edge

```
/etc/elchi/elchi-shield/
├── conf.d/                  # the WATCHED directory (--config-dir) — managed by elchi-client
│   ├── api-public.yaml      # one generated config file per policy
│   ├── payments.yaml
│   └── files/               # data files shipped in the bundle (feeds, keys, specs, .mmdb)
│       └── geo.mmdb
├── audit.env                # restricted EnvironmentFile with the ClickHouse DSN (installer-managed)
└── extproc.sock             # default ext_proc UDS (installers typically use /run/elchi-shield/)
```

Two kinds of configuration live in this tree, and only one is managed by deploys:

- **Policies** — everything under `conf.d/` is owned by `elchi-client`'s full-sync reconciliation. Files you place there by hand are treated as unmanaged and pruned on the next push.
- **Sink / process config** — the audit DSN and metrics endpoint are *process* settings (flags, `ELCHI_SHIELD_*` env, or a `--config-file` YAML), delivered by the installer, **not** by policy deploys. The sync deliberately scopes to `conf.d` so it can never touch them. See the [CLI & Configuration Reference](/shield/reference).

:::warning
An empty `conf.d` means "no policy": Shield stays up and applies the default posture (`--default-allow`) instead of blackholing traffic — but it also reports **not ready** on `/readyz`, because a security sidecar with no policy protects nothing. That is why clearing a project pushes the explicit `mode: "off"` marker file rather than an empty directory.
:::

## Verifying a rollout

- The `SHIELD_DEPLOY` **job page** shows per-client results: applied version, whether the reload was confirmed, and Shield's rejection reason when it wasn't.
- The [Overview dashboard](/shield/ui/overview-dashboard)'s *Config & rollout* table shows each edge's running version, config age, and consecutive reload-failure streak.
- On the edge itself: `curl -s 127.0.0.1:9001/configz` shows the active version/hash/sources and the last reload error, and `elchi_shield_config_*` metrics back alerting — see [Metrics, Audit & Health](/shield/observability).
