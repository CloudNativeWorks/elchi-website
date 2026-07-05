---
title: Execute and Validate
description: Turn a saved scenario into live Envoy resources — validate the component set, choose a version, fill execution-time values, and apply, with automatic rollback if any resource fails.
sidebar_position: 3
tags: [scenarios, execute, validate, rollback]
---

Building a scenario produces a template; **executing** it produces the real resources. This page covers validation, the execution flow at `/scenarios/:id/execute`, what actually happens to the generated resources, and how editing fits in.

## Validate first

Validation checks that a set of components satisfies the catalog's composition rules — required companions are present, nothing conflicts, and min/max counts hold — before anything is created.

```bash
POST /api/v3/scenario/validate?project=<id>
```

The request body is the array of component instances. The response is explicit:

```json
{
  "valid": true,
  "errors": [],
  "grouped_errors": {},
  "error_count": 0
}
```

When there are problems, `errors` is the flat list and `grouped_errors` buckets them by component so the UI can show them next to the offending component. Validation runs automatically at key points in the wizard and again as part of execution, so a scenario cannot be applied while it is structurally invalid.

## Executing a scenario

Open a scenario's execute view at `/scenarios/<id>/execute` (the **Start Configuration** button on a Quick Start template lands here).

### Choose a version and mode

Execution opens with a version selector. You pick the target **Envoy version** the generated resources should be built for, the **project** they belong to, and a **managed** flag that governs how the resources are generated. These choices are carried through the whole run.

### Fill in the components

The wizard then steps through the scenario's components **in priority order** — dependencies first (for example a cluster before the listener that routes to it). For each component you:

- Give it a **name** (validated for the allowed naming format).
- Fill any fields that were marked **required for execution** — these are the placeholders left open when the scenario was built.

Each step is gated: you cannot advance until the current component is valid.

### Apply

Applying issues:

```bash
POST /api/v3/scenario/execute?project=<id>
```

with the scenario ID, the finalized components, the project, the chosen version, and the managed flag:

```json
{
  "scenario_id": "edge_gateway_1042",
  "components": [ /* named, value-filled component instances */ ],
  "project": "team-a",
  "version": "1.35.0",
  "managed": true
}
```

## What happens to the generated resources

Execution is where a scenario becomes live configuration. On the backend, `ExecuteScenario`:

1. **Rejects viewers** up front — creating resources requires write access.
2. **Re-validates** the components with full execution context.
3. **Generates an Envoy resource document** for each component (in order), using the selected version and managed flag.
4. **Persists each document through the normal xDS path** (`SetResource`) — the same code path a hand-authored resource takes, so every resource gets full validation and, where relevant, automatic bootstrap/service creation. These become real [listeners](/envoy-configuration/resources/listeners), routes, clusters, endpoints, and filters in the project, published to Envoy by the control plane.

### Atomic — all or nothing

If **any** component fails to generate or save, execution **rolls back every resource it already created** in that run and returns the error. You never end up with a half-applied scenario: either the whole set is created or none of it is. The response on success lists the generated resource documents; on a validation failure it returns the numbered list of problems.

After execution, the resulting resources are ordinary Elchi resources — inspect and manage them like any other via the [configuration model](/envoy-configuration/config-model) and the [dependency graph](/envoy-configuration/dependency-graph).

## Editing vs. re-executing

- To change the **template** (which components/fields the scenario offers), edit it at `/scenarios/<id>/edit` — see the [wizard walkthrough](/envoy-configuration/scenario-workflows/wizard-walkthrough#editing-an-existing-scenario). This does not alter resources from past executions.
- To apply the scenario again — with different names or values — simply run the execute flow again. Each execution is independent and produces its own resources.

## Related

- [Scenario overview](/envoy-configuration/scenario-workflows/overview) — the build → validate → execute lifecycle.
- [Import and export](/envoy-configuration/scenario-workflows/import-export) — reuse a scenario across projects.
