---
title: WAF Overview
description: Elchi's standalone WAF — Coraza with the OWASP Core Rule Set, authored in the UI and delivered to Envoy as a WASM filter through the xDS snapshot.
sidebar_position: 1
tags: [waf, security]
---

Elchi ships an integrated **Web Application Firewall** built on [Coraza](https://www.coraza.io/) with the **OWASP Core Rule Set (CRS)**. You author a rule configuration in the UI under **WAF** (`/waf`), the control plane stores and versions it, and it is delivered to your edge proxies as an **Envoy WASM filter** — no rule files to ship, no per-node config push.

This is the platform's *original* WAF: a control-plane-managed ruleset that rides the normal Envoy configuration pipeline. It protects against the common attack classes — SQL injection, XSS, command injection, path traversal, scanners, protocol abuse — with rules you can browse, tune, lint, version, and roll back.

## What it is

- **Engine:** Coraza, a Go implementation of the ModSecurity SecLang rule language, compiled to WebAssembly as `coraza-proxy-wasm` **v0.6.0** (TinyGo 0.34) and loaded by Envoy as a Proxy-Wasm HTTP filter.
- **Rules:** OWASP **CRS 4.14.0** is bundled inside the WASM plugin, alongside the CRS setup file and a demo body-parsing config. You add rules by referencing them (`Include @owasp_crs/*.conf`) or write your own `SecRule` / `SecAction` directives.
- **Authoring:** a two-pane editor in the Elchi UI — a directive editor, a browsable CRS rule library, a live `.conf` preview, and full version history.
- **Storage:** each config is a MongoDB document scoped to a project, with a rolling snapshot history.

## How it is delivered

The WAF config never travels as a standalone file to the edge. It is folded into the Envoy configuration you already ship:

```text
UI (/waf editor)
   │  POST/PUT /api/v3/waf/config
   ▼
Controller (elchi-backend)
   │  stores WAFConfig in MongoDB (project-scoped, versioned)
   │  on save → propagation job
   ▼
WASM injector
   │  serializes the config to the Coraza plugin's JSON shape
   │  base64-encodes it into the WASM extension's typed_config
   │  (resource.config.configuration, a google.protobuf.StringValue)
   ▼
Dependency analysis → control-plane snapshot → xDS
   ▼
Envoy (edge) reloads the WASM filter with the new rules
```

When you save, the Controller finds every WASM extension that references the WAF config, re-injects the encoded rules, and triggers the same dependency-analysis + snapshot-generation flow as any other Envoy resource change. The save response reports how many WASM extensions were affected. See [Envoy resource types](/envoy-configuration/resources) for where the WASM extension sits in the resource graph, and [versions and upgrades](/envoy-configuration/versions-and-upgrades) for how snapshots reach the proxy.

:::info[Standalone WAF vs. Shield's Coraza engine]
The Elchi platform delivers Coraza/OWASP CRS **two different ways**. They share a rule engine and rule set but are wired into completely different data paths — pick by how you run inspection, not by the rules.

| | **Standalone WAF** (this section) | **Shield Coraza engine** |
|---|---|---|
| Delivery | Envoy **WASM filter**, injected into `typed_config` and shipped via xDS | Shield **`ext_proc` sidecar** engine, configured by a Shield policy file |
| Authored in | The Elchi UI (`/waf`), stored + versioned by the backend | Shield policy YAML in the watched config directory |
| Runtime | Runs *inside* Envoy (Proxy-Wasm sandbox, TinyGo) | Runs *beside* Envoy as a local Go process |
| Rules | CRS 4.14.0 embedded in the WASM plugin | OWASP CRS embedded in the Shield binary (`include_owasp: true`) |
| Response inspection | Partial (WASM sandbox limits) | Full — the only Shield engine that inspects responses |
| Constraints | No persistent collections, no `exec`/Lua, no filesystem (see [WASM limits](/traffic-and-certificates/waf/waf-studio)) | Native Go — fewer runtime limits, per-policy fail posture |

Use the **standalone WAF** when your protection lives in the Envoy config you already manage through Elchi and you want it delivered with the rest of your xDS snapshot — one control plane, one propagation path. Use the **Shield Coraza engine** when you run Shield as a security sidecar and want the WAF alongside Shield's other engines (JWT, rate-limit, bot, DLP, OpenAPI...) under a single policy with response inspection and native-Go behavior. They are complementary, not exclusive — you can run both. See [Shield's Coraza WAF engine](/shield/engines/coraza-waf) and the [Shield overview](/shield/overview).
:::

## When to use the WAF

- You want broad, signature-plus-anomaly protection against common web attacks without writing rules yourself — reference the CRS and go.
- You manage your Envoy edge through Elchi and want WAF rules delivered on the same xDS pipeline as your listeners, routes, and clusters.
- You need application-specific custom `SecRule`s scoped per host, versioned and diffable, with one-click rollback when a rule causes false positives.
- You want to run new rules in **detection-only** mode first, watch what *would* have been blocked, then promote to blocking.

## Where to go next

- [CRS rule library](/traffic-and-certificates/waf/crs-library) — browse and add OWASP CRS rules.
- [Building a configuration](/traffic-and-certificates/waf/building-config) — the editor, presets, includes, and live preview.
- [Versioning & restore](/traffic-and-certificates/waf/versioning-restore) — history, diff, and rollback.
- [WAF Studio: custom rules & tuning](/traffic-and-certificates/waf/waf-studio) — writing your own SecLang and tuning the CRS.
