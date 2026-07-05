---
title: Import and Export
description: Share and reuse scenarios across projects and installations — the export bundle format, importing into another project, and how naming conflicts are resolved.
sidebar_position: 4
tags: [scenarios, import, export, portability]
---

Scenarios are portable. Export turns one or more scenarios into a self-contained bundle you can store, version, or hand to someone else; import loads that bundle into a target project. Together they let you build a scenario once and reuse it everywhere.

## Exporting scenarios

Export packages a chosen set of scenarios into a single document.

```bash
POST /api/v3/scenario/export
```

The request names the scenarios to include:

```json
{ "scenario_ids": ["edge_gateway_1042", "grpc_service_2210"] }
```

The response is a portable bundle — the full scenario definitions plus provenance:

```json
{
  "scenarios": [ /* full scenario objects */ ],
  "exported_by": "you@example.com",
  "exported_at": "2026-07-04T10:15:00Z",
  "version": "…",
  "count": 2
}
```

Because the bundle carries the complete component/field definition of each scenario (not just a reference), it stands on its own — you can save it to source control or send it to another Elchi installation.

## Importing scenarios

Import loads a bundle into a **target project**.

```bash
POST /api/v3/scenario/import?project=<target>&conflict_action=<skip|overwrite|rename>
```

The importer is deliberately forgiving about input shape. It accepts:

- an export **bundle wrapped in a `data` field** (the raw export API response),
- a bare **export bundle** (the `data` object itself), or
- a direct **import request** containing a `scenarios` array.

This means you can usually paste back exactly what you got out of export without reshaping it.

The **target project** is required — it comes from the `project` query parameter (or the request body) and is where the imported scenarios will live. That is the mechanism for moving a scenario **into another project**: export from the source, import with the destination project.

### Resolving conflicts

If an incoming scenario collides with one that already exists, `conflict_action` decides what happens:

| Action | Behavior |
| --- | --- |
| `skip` (default) | Leave the existing scenario untouched; don't import the incoming one. |
| `overwrite` | Replace the existing scenario with the incoming definition. |
| `rename` | Import the incoming scenario under a new, non-colliding name. |

The import response reports exactly what it did:

```json
{
  "success": true,
  "imported": 1,
  "skipped": 1,
  "conflicts": [
    { "scenario_id": "edge_gateway_1042", "existing_name": "Edge Gateway", "action": "skipped" }
  ],
  "imported_by": "you@example.com",
  "imported_at": "2026-07-04T10:20:00Z"
}
```

`imported` and `skipped` are the counts, and `conflicts` lists each collision with the resolution applied (and, for renames, the new name).

## Typical uses

- **Promote between environments.** Build and test a scenario in a staging project, export it, and import it into production with `conflict_action=overwrite` to keep them in sync.
- **Seed a new project.** Import a curated bundle of standard scenarios so a new team starts with proven patterns.
- **Distribute templates.** Keep organization-wide scenarios in version control as export bundles and import them wherever needed.

:::note Import creates templates, not live resources
Importing adds the scenario **definitions** to the target project. It does not create any Envoy resources on its own — run the scenario from [execute and validate](/envoy-configuration/scenario-workflows/execute-and-validate) to generate live configuration.
:::

## Related

- [Scenario overview](/envoy-configuration/scenario-workflows/overview) — where import/export fits in the lifecycle.
- [Wizard walkthrough](/envoy-configuration/scenario-workflows/wizard-walkthrough) — building a scenario to export in the first place.
