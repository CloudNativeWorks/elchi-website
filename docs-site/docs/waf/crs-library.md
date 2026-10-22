---
title: CRS Rule Library
description: Browse the bundled OWASP Core Rule Set — filter by version, severity, phase, paranoia level, and tags; inspect rule detail; add rules or whole files in bulk.
sidebar_position: 2
tags: [waf, security]
---

The **CRS Rule Library** is a browsable catalog of every rule in the bundled OWASP Core Rule Set. Open it from the **CRS Library** entry in the WAF editor sidebar — it slides in as a right-hand drawer over the editor. From here you inspect rules, filter down to what you care about, and add either individual rules or whole rule files into your directive set.

The catalog is served by the control plane, so it reflects exactly the rules that ship in the WASM plugin. If the control plane is unreachable the drawer surfaces an error, but CRS tuning and your custom rules still work without it — the library is a browsing aid, not a runtime dependency.

## CRS versions

The library is always pinned to a specific CRS version. The version list comes from:

```text
GET /api/v3/waf/crs/versions
```

Each entry reports its `crs_version`, the `coraza_version` it was generated against, and the `total_rules` count. The drawer defaults to `4.14.0` and auto-pins to the first available version if that one isn't present. Pick a version from the **CRS** selector in the filter bar to browse a different rule generation.

## Browsing rules

Rules for the selected version are loaded with:

```text
GET /api/v3/waf/crs?crs_version=4.14.0
```

The `crs_version` parameter is **required**; everything else is an optional filter. The response carries the `coraza_version`, `crs_version`, the total rule count, the filtered count, and the rule array.

### Filters

The sticky filter bar drives the query. All filters are optional and combine:

| Filter | Query param | Notes |
|---|---|---|
| Search | *(client-side)* | Matches rule ID, title, short/extended description, and file name. |
| CRS version | `crs_version` | Required; selects the rule generation. |
| Severity | `severity` | `CRITICAL`, `ERROR`, `WARNING`, `NOTICE`. |
| Phase | `phase` | 1 Request Headers · 2 Request Body · 3 Response Headers · 4 Response Body · 5 Logging. |
| Paranoia | `paranoia_level` | 1–4; higher = more rules, more false positives. |
| Tags | `tags` | Comma-separated (e.g. `sqli,xss`) or repeated params. |

The severity, phase, paranoia, and tag options are derived from the rules actually present in the selected version, so you never see a filter that would return nothing. Search runs on top of the server-filtered set, so it narrows what's already loaded.

:::note
Rule types are also available (`rule_type`, e.g. `blocking`) on the backend query. The rule row shows the rule type as a tag when present.
:::

## Rule-file groups

Rules are grouped by their source CRS file (`REQUEST-901-INITIALIZATION.conf`, `REQUEST-942-APPLICATION-ATTACK-SQLI.conf`, `RESPONSE-9xx`, and so on). Each group is **collapsed by default** and shows:

- A **file checkbox** that selects/deselects every rule in the file at once (indeterminate when only some are selected).
- A **count badge** of how many rules the file contains.
- An **Include** button that appends `Include @owasp_crs/<file>` to the active set — loading the whole file by reference instead of copying rules.

Expanding a group lazily mounts its rows (large files page in 60 rules at a time, or narrow the filters). When your active set already contains an `Include @owasp_crs/*.conf` **wildcard**, the drawer marks every file as already loaded by it and tells you so.

If a file is already referenced by an `Include`, or rules from it are already present, the group shows an "added" tag (`3/57`) so you don't duplicate what's there.

## Rule detail

Each rule row is compact by default — rule ID, title, and a row of tags: severity, phase (`P2`), paranoia level (`PL1`), and rule type. A short description sits under the title. Click **Details** to lazily expand the full record:

- **Description** — the extended human-readable explanation.
- **Logic** — what the rule actually checks.
- **Directive** — the raw `SecRule` body, syntax-highlighted, exactly as it would be copied into your set.
- **Transformations** — the `t:` transformation chain (e.g. `lowercase`, `urlDecode`).
- **View source on GitHub** — a link to the upstream rule when available.

You can also fetch a single rule directly:

```text
GET /api/v3/waf/crs/:crs_version/:rule_id
```

This returns the same rule record the drawer renders for one rule ID.

## Adding rules

There are three ways to pull CRS rules into your configuration, all writing into the **active directive set** (pick or create one in the editor first — the drawer warns when none is selected):

1. **Add one rule** — the `+` on a rule row copies that rule's decoded `SecRule` text into the active set. Rules already present (matched by rule ID, not full text) show an "Added" state and can't be re-added with a duplicate ID.
2. **Include a whole file** — the **Include** button on a file group adds `Include @owasp_crs/<file>` rather than copying every rule. Prefer this for whole-category coverage; it stays in sync with the bundled rules.
3. **Bulk add** — select rules (per-row or per-file checkboxes), then use the sticky bottom action bar.

### Bulk actions

When at least one rule is selected, a bar appears at the bottom of the drawer showing the selection count and how many are **already in the target**. On the WAF page — which can have several directive sets — a **target picker** lets you choose which set the batch is added to; the bar trims rules already present so you only add what's new. Clear the selection or apply it in one click.

:::tip
Referencing a file with `Include @owasp_crs/<file>` keeps you aligned with the bundled CRS as it evolves; copying individual rules pins that exact rule text into your config. Use includes for coverage, copies for the handful of rules you need to hand-edit or tune.
:::

## Reuse across the platform

The library is callback-driven so the same browser powers both this WASM-WAF editor and Shield's WAF authoring. On the WASM-WAF page it writes into your directive sets (**Include** adds `Include @owasp_crs/<file>`, **+** copies a rule's SecLang). In this editor, disabling a CRS rule is done with a `SecRuleRemoveById` directive — see [WAF Studio](/waf/waf-studio) for CRS tuning and exclusions.

Hosted in **Shield's WAF Studio** the same actions mean something else, because there the CRS is loaded by the engine, not by directives:

- **Select file** / **Select rule** write `crs_files` / `crs_rule_ids` on the policy's Coraza engine — the edge enforces *only* that selection inside the frame it needs (see [Coraza WAF](/shield/engines/coraza-waf#configuration)); a selected rule that matches blocks (threshold 1, paranoia level raised to the rule's). The frame files (901/949/959/980) show **always loaded** and `REQUEST-999-…` **automatic**; a paranoia-level gate rule shows **paranoia gate · kept by shield** and cannot be selected.
- **Copy as template** copies the SecLang into custom rules as a starting point for your own rule — a copy alone does not block (the CRS's `tx.*` scoring needs the frame).
- **Disable / Enable** toggles the id in `exclude_rule_ids` when the full CRS (or a file) is loaded.
- A raw `Include @owasp_crs/…` is refused by Shield and is not offered.

The selection needs every edge of the project on shield ≥ 1.1.0; the Studio gates the buttons otherwise and names the older edges. When the project's pinned CRS bundle version changes, the Activate pre-scan lists selected rules whose text differs in the new version and refuses — by name — ids the new version does not have.

The two hosts differ in **which CRS store they browse**: this WASM-WAF editor lists the backend-managed CRS versions (default `4.14.0`), while Shield's WAF Studio browses the CRS version **compiled into your edge binaries** and auto-pins to whatever your project's fleet actually runs — see [Shield's Coraza engine](/shield/engines/coraza-waf). The component is shared; the rule source and version are not.
