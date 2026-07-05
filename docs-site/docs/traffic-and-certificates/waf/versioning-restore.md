---
title: Versioning & Restore
description: Every WAF save is snapshotted — browse the History tab, diff any version against the current state, and restore a prior version in one click.
sidebar_position: 4
tags: [waf, security]
---

Every saved WAF configuration is **versioned**. The backend captures a point-in-time snapshot on each successful save, so you can review what changed, diff any prior version against the live config, and roll back in one click when a rule change causes false positives. Versions are managed from the **History** tab in the WAF editor.

## How snapshots are recorded

Snapshots live in a dedicated `waf_versions` collection, keyed by config ID and an incrementing version number.

- **v1 is captured on create**, so the history is complete from the very first save — the original create state is always recoverable.
- Every **update** records a new snapshot *after* the change lands.
- **No-op saves are skipped.** A snapshot is only recorded when the post-save state differs from the most recent snapshot (compared by name and data). Double-clicking Save or re-emitting the same body doesn't pollute the history with duplicates.
- Snapshotting is **best-effort**: a snapshot failure is logged but never fails your save.
- Each config keeps up to **50** recent snapshots; older ones are pruned by a background version pruner. The History tab shows the most recent 50.

Each snapshot stores the config `data` (sets, directives, default set, metric labels, per-authority routing), the config name, and the **author** (id and name) and timestamp.

## The History tab

The History tab lists snapshots newest-first. Each row shows:

- The version tag (`v3`), the config name at that point, and the timestamp.
- The **author** who saved it.
- A summary — number of sets and total directives.
- A **Compare** button (diff against current) and a **Restore** button.

It is backed by:

```text
GET /api/v3/waf/config/:config_id/versions?limit=50
```

A single snapshot can be fetched directly with `GET /api/v3/waf/config/:config_id/versions/:version`.

## Diffing a version

**Compare** opens a side-by-side diff (Monaco, Apache/SecLang highlighting) of the serialized `.conf`:

- **Left (red)** — the selected snapshot, `as saved`, with its version, timestamp, and author.
- **Right (green)** — the **current** state. This reads from your in-memory editor, so **unsaved edits are visible** in the diff (tagged `unsaved`); it falls back to the last server-known config only if the editor hasn't loaded yet.

Red lines existed in the snapshot but are gone now; green lines are new or changed.

:::note[Snapshots are taken at save time]
A version captures the state exactly as it was saved. If you renamed or edited and saved in one go, the pre-edit state was never captured as its own snapshot and won't appear in the diff. The diff header spells this out so a "missing" old state doesn't read as a broken diff.
:::

## Restoring a version

**Restore** rolls the config back to a chosen snapshot:

```text
POST /api/v3/waf/config/:config_id/versions/:version/restore
```

Restore is not a raw overwrite — it reads the snapshot and runs it through the **standard update flow**, which means it:

1. **Reverts only the data** — sets, directives, labels, and per-authority routing. The **name and project come from the live config**, not the snapshot. Restoring an old name would orphan the WASM extension references and break the data plane, so identity is deliberately preserved.
2. **Re-validates and propagates** — the restored rules are re-injected into the referencing WASM extensions and shipped through the normal xDS snapshot path, exactly like any save.
3. **Records a fresh snapshot** — the restored state becomes a new version at the top of history. The original version stays untouched in history, so a restore is itself undoable.

If you have unsaved edits when you restore, the UI warns that they'll be discarded, then loads the restored content into the editor immediately so you see the result without waiting for a refetch.

Restoring requires **Admin** or **Owner** role.

:::tip
Restore is the fast fix when a newly shipped rule set causes false positives in production: roll back to the last-known-good version, which re-propagates to every affected proxy, then reopen the problematic version in a diff to see exactly which directive to fix before shipping forward again.
:::

## Related

- [Building a configuration](/traffic-and-certificates/waf/building-config) — the editor that produces each version.
- [WAF Overview](/traffic-and-certificates/waf/overview) — how a saved config propagates to Envoy.
