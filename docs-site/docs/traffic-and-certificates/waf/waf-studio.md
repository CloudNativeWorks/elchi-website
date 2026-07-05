---
title: WAF Studio — Custom Rules & Tuning
description: The guided rule-building experience — write custom SecLang, exclude and tune CRS rules, set paranoia and anomaly thresholds, and stay within the WASM runtime's limits.
sidebar_position: 5
tags: [waf, security]
---

Beyond referencing the OWASP CRS, the WAF editor is a full authoring environment for **custom rules and CRS tuning** — writing your own `SecRule`s, excluding or adjusting CRS rules, and dialing in paranoia and anomaly thresholds. This is the "studio" side of the editor: the [template builder](/traffic-and-certificates/waf/building-config#the-template-builder), the CRS Library's per-rule controls, and the built-in **How to write rules** reference, working together.

:::note[On the name]
"WAF Studio" is the *authoring experience* — the collection of drawers and editors described here and in [Building a configuration](/traffic-and-certificates/waf/building-config), not a separate product surface. There is no standalone "Studio" screen distinct from the WAF detail editor. This page collects the custom-rule and tuning workflows that live across those drawers.
:::

## Two ways to build a rule

- **Guided** — the **Templates** button opens the Directive Template Builder: pick a directive type, fill in the fields, and get a live syntax-highlighted preview before adding it to the active set. Good for getting the shape right without memorizing SecLang.
- **By hand** — type directly into the add bar (or edit any directive row in place). The **How to write rules** drawer in the sidebar is a distilled SecLang reference — anatomy, variables, operators, transformations, actions, plus copy-ready recipes.

## Anatomy of a SecRule

Every `SecRule` glues three things together:

```text
SecRule  VARIABLES   "OPERATOR"   "ACTIONS"
         └─ what      └─ how        └─ what to do
            to inspect   to compare    when matched
```

A concrete one:

```nginx
SecRule REQUEST_URI "@contains /admin" "id:1001,phase:1,deny,status:403,msg:'Admin path blocked'"
```

The `id` is mandatory and must be unique. **Custom rule IDs belong in `1–99999`; OWASP CRS reserves `900000–999999`** — stay out of that range. `SecAction` is a `SecRule` with no variable/operator, so it always runs — use it to flip transaction variables or remove a CRS rule.

### Variables, operators, transformations, actions

A quick orientation (the How-to drawer has the full tables):

- **Variables** — what to inspect: `ARGS`, `ARGS_NAMES`, `REQUEST_URI`, `REQUEST_METHOD`, `REQUEST_HEADERS:Name`, `REQUEST_BODY`, `REQUEST_COOKIES`, `REMOTE_ADDR`, `RESPONSE_HEADERS`, `TX:var`. Combine with `|`; negate with `!`; count with `&`.
- **Operators** — how to compare: `@rx` (regex), `@contains`, `@beginsWith`/`@endsWith`, `@streq`, `@eq`/`@gt`/`@lt`, `@within`, `@pm` (fast multi-pattern), `@detectSQLi`/`@detectXSS` (libinjection), `@ipMatch`. Prefix `!` to negate.
- **Transformations** — normalize before compare, in order: `t:none`, `t:lowercase`, `t:urlDecode`/`t:urlDecodeUni`, `t:htmlEntityDecode`, `t:base64Decode`, `t:removeWhitespace`/`t:compressWhitespace`, `t:replaceComments`, `t:cmdLine`.
- **Actions** — what happens on match: disruptive (`deny`, `block`, `drop`, `redirect`, `pass`, `allow` — one per rule, pair with `status:403`); logging (`log`/`nolog`, `msg`, `logdata`); metadata (`id`, `phase`, `severity`, `tag`); variable manipulation (`setvar:'tx.score=+5'`); flow (`chain`, `skipAfter`, `ctl:`).

### Phases

Coraza walks each request through five phases; each rule runs in exactly one, chosen with `phase:N`:

| Phase | When | Typical rules |
|---|---|---|
| 1 | Request headers | Cheap pre-checks: bad methods, malformed URIs, header probes. |
| 2 | Request body | SQLi, XSS, RCE, file-upload checks. Most CRS rules. |
| 3 | Response headers | Status/content-type checks. |
| 4 | Response body | Data-leak detection, error fingerprinting. |
| 5 | Logging | Audit only; no blocking. |

## Tuning the CRS

OWASP CRS rules **don't block individually** — each match adds to a running **anomaly score**, and a late rule blocks if the score crosses a threshold. Two knobs govern almost all tuning.

### Paranoia level

How many CRS rules evaluate. Higher = stricter = more false positives. Defaults to 1. Set it *before* the CRS include with a `SecAction`:

```nginx
SecAction "id:900000,phase:1,nolog,pass,t:none,setvar:tx.blocking_paranoia_level=2"
```

:::note
On CRS 4.x use `tx.blocking_paranoia_level` (and `tx.detection_paranoia_level`); the older `tx.paranoia_level` is deprecated. The starter presets use the modern variable.
:::

### Anomaly threshold

The score at which to block. Default 5 inbound, 4 outbound. Lower = block sooner = more aggressive:

```nginx
SecAction "id:900110,phase:1,nolog,pass,t:none,setvar:tx.inbound_anomaly_score_threshold=3,setvar:tx.outbound_anomaly_score_threshold=2"
```

### Detection-only while tuning

Put the engine in detection-only mode so rules still match and log but nothing is blocked. Run for a week, watch what *would* have been blocked, add exceptions, then promote to `On`:

```nginx
SecRuleEngine DetectionOnly
```

The **Detect-only** and **Detect-everything** [presets](/traffic-and-certificates/waf/building-config#starting-a-config-presets) wire this up for you.

## Excluding and adjusting CRS rules

When a specific CRS rule is a false positive, exclude or adjust it rather than lowering paranoia globally:

```nginx
# Disable one rule by ID
SecRuleRemoveById 920100

# Disable a whole category by tag
SecRuleRemoveByTag "attack-injection-php"

# Whitelist an IP from all CRS rules
SecRule REMOTE_ADDR "@ipMatch 10.0.0.0/8" \
    "id:1000,phase:1,pass,nolog,ctl:ruleEngine=Off"
```

In the [CRS Library](/traffic-and-certificates/waf/crs-library), when hosted with exclusion support each rule row offers a **Disable/Enable** toggle that adds the rule ID to an exclude list; in this WASM-WAF editor you express the same intent with a `SecRuleRemoveById` directive in your set.

### Per-set scoping

Need one host strict and another permissive? Create two sets (e.g. `strict` and `permissive`) and map domains to them with **Per-authority** overrides in the Advanced drawer — see [Building a configuration](/traffic-and-certificates/waf/building-config#advanced-per-authority-and-metric-labels).

## Recipes

A few copy-ready patterns from the How-to reference:

```nginx
# Allow only specific HTTP methods
SecAction "id:900200,phase:1,nolog,pass,t:none,setvar:'tx.allowed_methods=GET HEAD POST OPTIONS PUT DELETE'"

# Block a known-bad user agent
SecRule REQUEST_HEADERS:User-Agent "@rx (?:sqlmap|nikto|nmap)" "id:1100,phase:1,deny,status:403,msg:'Scanner blocked',tag:'attack-recon'"

# Custom rule that adds anomaly score instead of blocking outright
SecRule REQUEST_URI "@contains /wp-login.php" \
    "id:1200,phase:1,pass,t:lowercase,\
    msg:'WordPress login probed',\
    setvar:'tx.inbound_anomaly_score_pl1=+3'"

# Limit request body size
SecRequestBodyAccess On
SecRequestBodyLimit 5242880
SecRequestBodyLimitAction Reject
```

## WASM runtime limits — read before you build

The runtime is `coraza-proxy-wasm` **v0.6.0**, a Proxy-Wasm filter compiled with TinyGo 0.34. The WebAssembly sandbox has **no filesystem writes, no shell, no outbound network beyond the proxy, and no shared memory between requests**. Coraza features that depend on those are silent no-ops or rejected — build a rule on them and the security control you intended quietly won't exist.

**Works well** — per-request content inspection: CRS 4.14.0, multiphase evaluation, `@rx`/`@pm`/`@detectSQLi`/`@detectXSS` (via `coraza-wasilibs`), `@contains`/`@beginsWith`/`@streq`/`@within`/`@eq`/`@ipMatch`/`@validateByteRange`, Prometheus metrics with phase + rule-id labels, and audit logs to Envoy stdout.

**Parsed but not enforced** — `SecArgumentsLimit` (use `SecRequestBodyLimit`), `SecRequestBodyNoFilesLimit`, `SecDefaultAction` (applies only within a phase), `setvar` outside the `tx` collection.

**Not supported at all:**

- **Persistent collections** — `initcol`, `setsid`, `setuid`, and writes to `IP`/`SESSION`/`USER`/`GLOBAL`/`RESOURCE` don't persist across requests. **Rate-limiting / brute-force counters built on these count nothing past a single request** — use Envoy's native `local_ratelimit`/`ratelimit` filter instead.
- **Lua / external scripts** — the `exec` action and `SecRuleScript` need script execution; rules using them fail to load.
- **External files** — `@pmFromFile` with a path, `@geoLookup` (no GeoIP DB), `@inspectFile` (no exec), `SecRemoteRules`. Only the plugin's embedded read-only files (`@owasp_crs/...`, `@demo-conf`, `@crs-setup-conf`) are visible. Use inline `@pm pattern1 pattern2`.
- **Filesystem audit logs** — `SecAuditLog /var/log/...`, `SecAuditLogStorageDir`, `SecAuditLogType Concurrent` are no-ops; logs go to Envoy stdout. `SecAuditLogParts` D/G/I/J aren't generated (safe set: `ABCFHZ`).
- **Upload/format directives** — `SecUploadDir`/`SecUploadKeepFiles`/`SecUploadFileMode`, `SecCookieFormat`, `SecArgumentSeparator`.

**Mental model:** anything that must *remember state across requests* (counters, sessions, IP throttling) or *touch external resources* (files, scripts, remote URLs, GeoIP) is unsupported here. Coraza-proxy-wasm is best at per-request content inspection — exactly what OWASP CRS uses it for.

:::info[Need the features WASM can't do?]
State across requests, native rate-limiting, GeoIP, response inspection, and per-policy fail posture are exactly where [Shield's ext_proc Coraza engine](/shield/engines/coraza-waf) and its sibling engines (`ratelimit`, `ipreputation`, `bot`) come in — a native-Go sidecar without the WASM sandbox limits. See the [Shield overview](/shield/overview) for when to reach for it instead of, or alongside, this WASM WAF.
:::

## Reference

- [Coraza SecLang directives](https://www.coraza.io/docs/seclang/directives/)
- [OWASP CRS docs](https://coreruleset.org/docs/)
- In-app: the **How to write rules** drawer (sidebar) — the same material, offline and version-pinned to CRS 4.14.
