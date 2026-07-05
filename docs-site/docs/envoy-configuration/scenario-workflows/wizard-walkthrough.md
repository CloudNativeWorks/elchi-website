---
title: Wizard Walkthrough
description: Step through the Quick Start hub and the three-step create wizard — basic info, picking components and their fields, and review — and see exactly what the wizard generates.
sidebar_position: 2
tags: [scenarios, wizard, quick-start, create]
---

This page walks through building a scenario from scratch, starting at the Quick Start hub and finishing with a saved, reusable template.

## Start at Quick Start

Open **Scenarios** in the sidebar (route `/quick_start`). The hub has two primary actions and a gallery:

- **Create New Scenario** → takes you to `/scenarios/create`, the build wizard covered below.
- **Manage Scenarios** → `/scenarios`, the list of everything you have already built.
- **Ready-to-Use Templates** → a grid of the scenarios that already exist in the project (loaded from `GET /api/v3/scenario/scenarios?project=<id>`). Each card shows the scenario's name, description, and the components it includes; **Start Configuration** jumps straight to executing it at `/scenarios/<id>/execute`.

Use a template when one already matches your need; use **Create New Scenario** to build your own.

## The three-step create wizard

`/scenarios/create` renders the wizard as three ordered steps.

### Step 1 — Basic Information

Give the scenario a **name** and **description**. A stable `scenario_id` is generated from the name automatically (a slugified form with a short numeric suffix), so you don't have to invent one. A toggle lets you mark the scenario **global** instead of project-scoped — global scenarios are available to every project rather than just the current one.

### Step 2 — Resources & Fields

This is the heart of the wizard. You choose which **components** the scenario contains and, for each one, which **fields** it exposes.

- Components come from the [component catalog](/envoy-configuration/scenario-workflows/overview#the-component-catalog) — `cluster`, `listener`, `http_connection_manager`, `route`, `virtual_host`, `endpoint`, `tcp_proxy`, `router_filter`, and the access-log components.
- For each component you select the fields you care about. Fields can be simple (string, number, boolean, select), arrays, objects, or **nested choices** where picking one option reveals a different set of sub-fields. Some fields are marked **required for creation** (they must be part of the scenario) and others **required for execution** (they must be given a value when the scenario is later run).
- You are choosing the *shape* here, not necessarily the final values. Leaving an execution-time field without a value is fine — it becomes a placeholder to fill in at execution.

If the components you have chosen violate the catalog's composition rules — a required companion is missing, a conflict exists, or a min/max count is off — the wizard surfaces those problems inline (grouped per component) so you can fix them before moving on.

### Step 3 — Review & Create

The review step summarizes the basic info and every component with its selected fields. Confirm and the wizard saves the scenario:

- **Create** → `POST /api/v3/scenario/scenarios?project=<id>` with the name, description, `scenario_id`, and components.

If the backend rejects the payload with validation errors, the wizard routes you back to the component step and lists the issues; simpler errors are shown in place on the review step.

## What the wizard produces

Creating a scenario does **not** yet touch your running configuration. It stores a reusable **template** — the component/field definition you just built — under the project (or globally). Nothing is generated in Envoy until you [execute](/envoy-configuration/scenario-workflows/execute-and-validate) the scenario and supply the runtime values.

That separation is deliberate: build once, then execute the same scenario as many times as you need, each run producing its own set of real resources.

## Editing an existing scenario

To change a saved scenario, open it from `/scenarios` and edit it at `/scenarios/<id>/edit`. This reuses the same three-step wizard in **edit mode** — it pre-loads the existing basic info and components, and saving issues a `PUT /api/v3/scenario/scenarios/<id>` instead of a create. Editing changes the template; it does not retroactively alter resources produced by earlier executions.

## Next

Once the scenario exists, move on to [execute and validate](/envoy-configuration/scenario-workflows/execute-and-validate) to turn it into live resources.
