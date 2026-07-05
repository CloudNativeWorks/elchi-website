---
title: Building a Configuration
description: Author a WAF config in the two-pane editor — directive sets, the lint badge, CRS setup and demo includes, starter presets, the template builder, per-authority routing, metric labels, and the live .conf preview.
sidebar_position: 3
tags: [waf, security]
---

A WAF configuration is authored in a two-pane editor: a **sidebar** on the left (rule sets, library, references, advanced settings) and a **main pane** on the right with three tabs — **Editor**, **Live .conf**, and **History**. Open a config from **WAF** (`/waf`), or create a new one to start from a preset.

A configuration is a set of one or more **directive sets**, a **default set**, and optional per-authority routing and metric labels. Each set is a named, ordered list of SecLang directives.

## Starting a config: presets

When you create a new WAF, a **preset picker** opens first so you don't start from a blank file. Each preset creates a single directive set you can rename and extend. You can also open **Load template** from the sidebar at any time to add a preset as a new set or replace the active set's directives.

Presets are grouped by intent:

| Preset | Mode | Paranoia | What it is |
|---|---|---|---|
| Detect-only — light | `DetectionOnly` | 1 | Logs likely attacks without blocking. Best for week one of a new deployment. |
| Detect-everything | `DetectionOnly` | 4 | Every CRS rule evaluates and logs — use for tuning. |
| Block known threats | `On` | 1 | Only high-confidence rules block. Conservative production starting point. |
| Balanced | `On` | 2 | Common attacks plus some heuristics. A reasonable middle ground after tuning. |
| Strict — block everything | `On` | 4 | Aggressive; anomaly thresholds tightened. Expect false positives. |
| Minimal | `On` | — | Engine on, no CRS rules. A blank slate for your own `SecRule`s. |
| Blank | — | — | Empty set. Start completely from scratch. |

Every preset is curated for `coraza-proxy-wasm` v0.6.0 — directives that the WASM runtime parses but doesn't enforce (file-system audit logs, per-arg limits, and the like) are deliberately omitted so nothing silently misbehaves. The blocking presets use the modern CRS variable `tx.blocking_paranoia_level` (CRS 4.0+).

## Directive sets

Sets live in the sidebar under **Rule Sets**. Click a set to make it active and edit it; the star marks the **default set** (applied when no per-authority override matches). You can add, rename, and delete sets (the last set can't be deleted, and deleting a set with several directives asks for confirmation — undo with ⌘Z).

### The Editor tab

Editing the active set, the Editor tab shows:

- The set name, a **Default** badge if it's the default, and a directive count.
- An optional **description** for the set (e.g. "Paranoia 4 + custom DDoS rules").
- The **lint badge** (see below).
- The directives as a **drag-to-reorder** list — order is part of correctness in SecLang, so this matters.
- An **add bar** at the bottom to type a directive, plus a **Templates** button that opens the directive template builder.

### The lint badge

Directives are linted client-side (debounced) and summarized as a badge: how many lines are **ok**, how many **warnings**, and how many **errors**. Hover it for the first diagnostics with line numbers. The heuristics catch the mistakes that bite most:

- **Duplicate rule ID** across the set → error.
- A `SecRule` / `SecAction` **without an `id:`** action → warning.
- An **empty** directive line → warning.
- An **unknown leading keyword** (possible typo) → info.

:::note
The lint is a fast structural check, not a full Coraza parse — the backend does not run Coraza in-process. It catches the common structural errors; it does not fully validate operator/variable semantics.
:::

## Includes: the three magic paths

The WASM plugin resolves three special `Include` paths to files bundled inside it. Two of them have dedicated read-only reference drawers in the sidebar so you can read them verbatim.

| Include | Loads | Sidebar drawer |
|---|---|---|
| `@demo-conf` | Body parsing setup: `SecRequestBodyAccess On`, body limits, JSON/XML processor selection, parse-error handling, audit defaults. | **Demo Conf** |
| `@crs-setup-conf` | The upstream `crs-setup.conf.example`. Almost every line is commented out; it stamps the CRS setup version. | **CRS Setup** |
| `@owasp_crs/*.conf` | The actual OWASP CRS rule files — the defenses themselves. | (browse in [CRS Library](/traffic-and-certificates/waf/crs-library)) |

Order is load-bearing. A working baseline is:

```nginx
SecRuleEngine On
Include @demo-conf
Include @crs-setup-conf
# ... your setvar SecAction overrides here ...
Include @owasp_crs/*.conf
```

`@demo-conf` must come first so body parsing is configured — without it most CRS rules can't fire on POST/JSON/XML payloads. `@crs-setup-conf` must load before `@owasp_crs/*.conf` (CRS init refuses to run without the setup version stamped). Your `setvar` `SecAction`s must run **before** CRS init, so its "set if unset" defaults don't overwrite you.

### CRS Setup drawer

The **CRS Setup** drawer renders the bundled `crs-setup.conf.example` (v4.14.0) read-only in a Monaco editor, with a Copy button. Almost every `setvar:tx.X=...` line is commented out by design — the CRS ships defaults disabled so each deployment opts in. The practical move is to add your own `SecAction` with the value you want into your set *after* the `Include`, rather than editing this file (which you can't — it's the plugin's embedded copy). Real default values (paranoia 1, anomaly threshold 5) come from `REQUEST-901-INITIALIZATION.conf`, which loads later.

### Demo Conf drawer

The **Demo Conf** drawer renders the bundled `coraza-demo-0.6.0.conf` read-only — the body-parsing configuration that `@demo-conf` resolves to.

## The template builder

The **Templates** button in the editor opens the **Directive Template Builder** drawer — a guided form for constructing a directive without hand-writing SecLang. Pick a directive type (`SecRule`, `SecAction`, and others), fill in the fields the type needs, and watch a **live, syntax-highlighted preview** update as you type. **Build & Add Directive** appends it to the active set. It's the friendly on-ramp; see [WAF Studio](/traffic-and-certificates/waf/waf-studio) for hand-writing rules and the full SecLang reference (the **How to write rules** drawer).

## Advanced: per-authority and metric labels

The **Advanced** drawer holds two editors:

### Per-authority overrides

Map a domain (HTTP authority) to a specific directive set. Every request whose authority matches uses that set; everything else falls back to the default set. This is how one WAF config serves multiple tenants or hosts with different strictness — e.g. `api.example.com → strict`, everything else `permissive`. Stored as `per_authority_directives` (domain → set name).

### Metric labels

Custom key/value labels attached to the WAF's metrics for monitoring and observability. Stored as `metric_labels`.

## The Live .conf preview

The **Live .conf** tab renders the whole configuration as the single `.conf` file Coraza would load — the default set first, then the rest, each under a banner header, with per-authority and metric-label notes as comments. It's a read-only Monaco view (Apache/SecLang highlighting) with line and byte counts and a **Copy** button, so you can read, copy, or eyeball exactly what ships before saving.

## Saving and propagation

Saving (⌘S or the top-bar button) serializes the editor to the API shape and writes the config. On update, the backend finds every WASM extension that references the config, re-injects the encoded rules, and kicks off a propagation job — the success message tells you how many extensions are being updated (or that none reference this WAF yet). Names must be unique within a project (a clash returns `WAF_NAME_TAKEN`). Creating and updating require **Admin** or **Owner** role. Every save also records a version snapshot — see [Versioning & restore](/traffic-and-certificates/waf/versioning-restore).

:::warning[WASM runtime limits apply]
Because the runtime is a WebAssembly sandbox, some ModSecurity directives are parsed but never enforced (persistent collections for rate-limiting, `exec`/Lua, filesystem audit logs, GeoIP, external pattern files). Building rules on them means the control you intended quietly doesn't exist. The presets and templates steer clear of these; the full list is in [WAF Studio](/traffic-and-certificates/waf/waf-studio).
:::
