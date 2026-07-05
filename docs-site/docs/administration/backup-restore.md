---
title: Backup & Restore
description: Export and re-import a project's platform state, validate a backup before applying it, inspect backup metadata, and clean up resources for a retired Envoy version.
sidebar_position: 6
tags: [administration, backup, maintenance]
---

Elchi's **Maintenance** tools let you snapshot a project's configuration to a portable JSON file, move it between projects or environments, and clean up resources left behind by retired Envoy versions. Find them under **Settings → Maintenance**, which has two sub-tabs: **Backup & Restore** and **Cleanup**. Every operation here is restricted to **Owner/Admin** roles.

## What a backup contains

A backup is **project-scoped** — it captures everything that belongs to one project, as a single JSON document. Included collections:

| Area | Collections |
| --- | --- |
| Settings | projects, users, groups, settings |
| Envoy / xDS resources | secrets, endpoints, extensions, clusters, virtual_hosts, routes, filters, listeners, bootstrap, tls |
| Templates | resource_templates, snippets, scenarios |
| Services | clients, services, admin_ports, waf |
| ACME | acme_accounts, acme_dns_credentials, acme_temp_keys, acme_certificates |

Some things are deliberately **not** in a backup:

- **Shared/global resources** (those with no project) and, unless you opt in, **default resources** are excluded.
- **API Discovery / collector data** (`api_inventory`, `api_collector_config`, threat-intel and baseline collections) is never exported — that inventory is rebuilt from live traffic, not restored.
- **User session tokens** (JWT access/refresh tokens) are stripped from exported user records; password hashes are retained.

:::warning[Backups contain secrets]
A backup file carries sensitive material — cloud credentials, LDAP bind passwords, ACME DNS credentials, TLS material, and API tokens. Treat the downloaded JSON as a secret: store it encrypted and restrict who can read it.
:::

## Exporting a backup

**UI — Settings → Maintenance → Backup & Restore → Export Backup:**

1. Toggle **Include Default Resources** if you want the platform's default resources in the file (off by default).
2. Optionally add a **description** (up to 200 characters).
3. Click **Create & Download Backup**. The browser downloads `backup-project-<backup_id>.json`, and a summary modal reports the backup ID, project, total resource count, and size.

**API:**

```bash
curl -X POST "$ELCHI/api/v3/setting/maintenance/backup/export?project=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "backup_type": "project",
        "project_id": "'$PROJECT_ID'",
        "include_defaults": false,
        "description": "pre-upgrade snapshot"
      }' \
  -o backup-project.json
```

:::note[Project-scoped only]
Backups are project-scoped in practice — supply the `project_id`. An Admin can export a project in their own scope; an Owner can export any project. The request body is capped at 100 MB.
:::

## Inspecting a backup before you restore

Two read-only endpoints let you check a file without touching any data (both Owner/Admin):

- **Metadata** (`POST .../backup/metadata`) — returns just the backup's header: backup ID, type, project, the Elchi version that produced it, who created it and when, the description, and per-collection resource counts. Use it to identify an unlabeled file.
- **Validate** (`POST .../backup/validate`) — checks the file is structurally sound: required metadata is present, the backup type is valid, and there are **no duplicate resource IDs**. Returns `valid`, `warnings`, and `errors`.

In the UI you don't call these directly — selecting a file for import runs validation and a dry-run automatically (see below).

## Restoring (importing) a backup

Import re-homes every resource in the file into a **target project** you specify, and is **destructive**: a resource whose ID already exists in the target is **fully replaced**; new ones are inserted.

Key behaviors and safeguards:

- **The target project must already exist** — import never creates or overwrites projects; it only imports resources into an existing one. Create the project first.
- **Validation runs first.** A structurally invalid backup is rejected before any write.
- **Dry-run preview.** With `dry_run: true`, no data is written — you get a preview of how many resources would be created, updated, skipped, and failed.
- **Resource permissions are cleared** on import (imported resources come in with empty user/group ACLs, for safety) — re-grant access afterward.
- **Default/system resources are skipped**, and every project reference is remapped to the target project.
- **Name conflicts are non-fatal.** A resource that collides on name/version but has a different ID is left as-is and reported as a warning.

**UI flow — Import Backup:**

1. Upload the `.json` file. Elchi auto-validates its structure and runs a **dry-run**, then shows an **Import Preview** modal (Will Create / Update / Skip / Fail counts, plus any errors).
2. The **Import Backup** button appears only when the dry-run reports **zero failures**.
3. Click it, confirm the "this will overwrite existing data" prompt, and the real import runs. The result modal breaks down created/updated/skipped/failed per resource type.

**API:**

```bash
# Dry run first — no writes, just a preview
curl -X POST "$ELCHI/api/v3/setting/maintenance/backup/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "backup_data": '"$(cat backup-project.json)"',
        "target_project": "'$TARGET_PROJECT'",
        "dry_run": true }'

# Then the real import (dry_run: false)
```

A fully successful import returns `200`; a partial import (some collection failed) returns `206 Partial Content` with per-collection details.

### When to use it

- **Before a risky change or upgrade** — export a snapshot you can re-import if you need to roll back.
- **Promoting config** between projects or environments (e.g. staging → production) — export from one, import into the target project.
- **Migrating a project** to a new platform instance.

## Version cleanup

When you retire an Envoy version, its xDS resources can linger. **Settings → Maintenance → Cleanup** removes resources tied to a specific version within a project.

1. **Select Version** — the version whose resources you want to remove.
2. **Cleanup Mode** — `All Resources`, `Default Resources Only`, or `User Resources Only (non-default)`.
3. Click **Clean Up Resources** and confirm.

Safeguards:

- **Active listeners block cleanup.** If any listener still uses that version in the project, the operation aborts with a conflict and deletes nothing — delete or migrate the listeners first.
- Only xDS resource collections are affected (clusters, routes, endpoints, filters, extensions, secrets, bootstrap, virtual_hosts, tls). Discovery/collector data is never touched.
- There is **no dry-run** for cleanup — the confirmation modal is the last checkpoint, and the action can't be undone.

**API:**

```bash
curl -X DELETE \
  "$ELCHI/api/v3/setting/maintenance/cleanup/versions/$VERSION?project=$PROJECT_ID&mode=non-default-only" \
  -H "Authorization: Bearer $TOKEN"
```

The response reports per-collection deleted counts and the total.

## Related

- [Authentication & Access](/administration/auth-and-access) — the Owner/Admin roles these tools require.
- [Envoy versions & upgrades](/envoy-configuration/versions-and-upgrades) — retiring a version before cleanup.
