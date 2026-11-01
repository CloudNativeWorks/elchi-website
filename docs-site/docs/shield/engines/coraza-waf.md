---
title: Coraza WAF (OWASP CRS)
description: The embedded ModSecurity-style WAF engine — OWASP Core Rule Set, paranoia levels, anomaly thresholds, and custom SecLang directives.
sidebar_position: 1
tags: [shield, engine]
---

The `coraza` engine is Shield's flagship content-inspection engine: a full ModSecurity-style WAF that protects against injection attacks (SQLi, XSS, command injection, path traversal, protocol abuse and the rest of the OWASP attack classes) using the **OWASP Core Rule Set embedded directly in the Shield binary** — there are no rule files to ship. It is a **body-phase** engine, and it is the **only engine that inspects responses** as well as requests (CRS phase 3/4 outbound rules).

:::info
This is Elchi's WAF. There is no separate WAF product: the OWASP CRS runs in Shield, governed by Shield [policies](/shield/policies/policy-model) with their modes and fail postures. See [How Shield Works](/shield/how-it-works) for where it sits in the request path.
:::

## When to use it

- You want broad, signature-plus-anomaly protection against common web attacks without writing rules yourself (`include_owasp: true`).
- You need custom SecLang rules for an application-specific pattern (`directives` / `directives_file`), with or without the CRS underneath.
- You want response-side inspection (outbound data-leakage rules) — no other Shield engine inspects responses.
- Pair it with a positive-security engine ([OpenAPI validation](/shield/engines/openapi-validation)) for defense in depth: the WAF denies known-bad, the contract allows known-good.

## Configuration

Body-phase WAF. The OWASP Core Rule Set is embedded in the binary — set `include_owasp: true` to load it from memory.

:::info[CRS version]
The CRS version is **compiled into the Shield binary** (the `coraza-coreruleset` pin), so every edge enforces whatever ruleset *its* binary embeds — it is not selected per policy. Shield reports that version (its `/configz` `coreruleset_version` field and the `build_info` metric), and the **WAF Studio auto-pins the CRS Rule Library to the version your project's edges actually run** — with a version badge, and a warning if the fleet is running mixed versions. Excluding a rule id that isn't present in that version is flagged, since it would be a silent no-op. Upgrading is a binary bump (rebuild with a newer `coraza-coreruleset`); rule ids are stable across CRS minors, so existing tuning keeps working. This version axis is independent of the WASM WAF's own CRS.
:::

| Field | Type | Required | Default | Purpose |
|---|---|---|---|---|
| `directives` | string | one-of | — | Inline SecLang directives (run **after** the CRS so they can add/override rules). |
| `directives_file` | string | one-of | — | Path to a SecLang file (concatenated into `directives`). |
| `include_owasp` | bool | one-of | `false` | Load the embedded OWASP Core Rule Set. |
| `exclude_rule_ids` | string[] | no | — | CRS/custom rule IDs to disable (`SecRuleRemoveById`, applied last). Each entry must be a bare numeric rule id or id range (e.g. `"942100"` or `"942100-942999"`); anything else is rejected at load. |
| `crs_files` | string[] | no | — | **Enforce only these CRS rule files** (e.g. `REQUEST-942-APPLICATION-ATTACK-SQLI.conf`); the engine adds the frame the CRS needs (901 setup, 949/959 evaluation, 980 reporting). A file keeps the CRS's own scoring and thresholds. Frame files and `REQUEST-999-…` cannot be listed. A non-empty selection loads the CRS even without `include_owasp`. (shield ≥ 1.1.0) |
| `crs_rule_ids` | int[] | no | — | **Enforce only these CRS rules** (their files are loaded with every other rule of the file removed, except the paranoia-level gates). With a rule selection, an unset `inbound_anomaly_threshold` becomes **1** and an unset `paranoia_level` the highest level among the selected rules — *a selected rule that matches blocks*. Must not overlap `exclude_rule_ids`. (shield ≥ 1.1.0) |
| `paranoia_level` | int | no | `0` → CRS default (1) | CRS **blocking** paranoia level `1`–`4` (higher = stricter, more false positives). |
| `detection_paranoia_level` | int | no | `0` → = `paranoia_level` | Run rules up to this PL in **detection** but only block at `paranoia_level`. Must be `≥ paranoia_level`. |
| `inbound_anomaly_threshold` | int | no | `0` → CRS default (5) | Request-side collaborative score that triggers a block (lower = stricter). |
| `outbound_anomaly_threshold` | int | no | `0` → CRS default (4) | Response-side score that triggers a block. |
| `crs_settings` | object | no | — | What the CRS accepts as normal traffic: methods, content types, charsets, restricted extensions and headers, argument and upload limits. See [CRS policy settings](#crs-policy-settings). |

Rules:

- At least one of `directives` / `directives_file` / `include_owasp` / `crs_files` / `crs_rule_ids` is required.
- An id or file the loaded rule set does not have is a **hard error, by name** (`crs_rule_ids: 999999 is not in the embedded ruleset` / `… bundle v4.30.0`), so the edge keeps its last good policy — and the installer's upgrade gate and `elchi-shield validate` refuse it before it is pushed.
- A raw `Include @owasp_crs/…` (or `@crs-setup*`, `@coraza*`) inside `directives` / `directives_file` is **refused**: without the CRS there is no rule file system to read it from, with the CRS the ids would be duplicated. Load the CRS with `include_owasp`, `crs_files` or `crs_rule_ids` instead; in the WAF Studio, the library's **Select file** / **Select rule** actions write exactly these fields.
- The CRS tuning fields (`paranoia_level`, `detection_paranoia_level`, `inbound_anomaly_threshold`, `outbound_anomaly_threshold`, `crs_settings`) **require the CRS** — they tune the CRS and are rejected at load otherwise. PL values are `1`–`4` (`0` = use the CRS default); thresholds are `≥ 0`. A shield that predates `crs_settings` refuses a policy that sets it. The project's policies deploy together, so such an edge then refuses **every** policy update of the project and keeps its last good set until it is updated; WAF Studio names those edges and blocks Apply while a setting is set.
- **Rule id `900000` is reserved when the CRS is loaded.** Shield writes its tuning (the fields above) as one SecAction with that id, so the same id in `directives` / `directives_file` is refused at load. Removing or editing it is refused too: `exclude_rule_ids` covering `900000`, or `SecRuleRemoveById` / `SecRuleUpdateActionById` / `SecRuleUpdateTargetById` naming it (also across a `\` line continuation). With a rule selection that raises the paranoia level, a lower detection level is lifted to it (CRS would otherwise deny every request).

:::info
Shield forces **`SecRuleEngine On`** internally, overriding the CRS-shipped `DetectionOnly` default. Coraza always evaluates in enforcing mode so a CRS hit raises a real interruption — and the Shield policy **`mode`** (`block` / `detect` / `shadow` / `off`) then decides whether that interruption actually blocks. Never express monitor mode via SecLang `DetectionOnly`; use the policy mode. See [Modes & Fail Postures](/shield/policies/modes-and-postures).
:::

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-coraza
spec:
  defaults:
    mode: block
    fail_mode: fail_open          # a WAF bug must never blackhole traffic
    inspect_request_body: true
    max_request_body_bytes: 1048576   # 1 MiB

  domains:
    - hosts: ["app.example.com"]
      routes:
        # Full OWASP CRS at the default paranoia level (PL1) and default anomaly
        # thresholds (inbound 5 / outbound 4). Start in detect, then switch to block.
        - match:
            path_prefix: "/api/"
          policy:
            mode: detect
            engines:
              coraza:
                include_owasp: true

        # Stricter posture for the admin surface: paranoia level 2 and a tighter
        # inbound anomaly threshold. Drop two noisy rules by id. Response-side
        # CRS rules also run, so inspect the response body too.
        - match:
            path_prefix: "/admin/"
          policy:
            mode: block
            inspect_response_body: true
            max_response_body_bytes: 1048576
            engines:
              coraza:
                include_owasp: true
                paranoia_level: 2              # 1..4 (0 = CRS default 1)
                detection_paranoia_level: 3    # run PL3 rules in detect, block at PL2
                inbound_anomaly_threshold: 3   # 0 = CRS default 5 (lower = stricter)
                outbound_anomaly_threshold: 4  # 0 = CRS default 4
                exclude_rule_ids: ["920350", "942100"]

        # CRS plus your own custom SecLang. directives/directives_file run AFTER
        # the CRS so they can add or override rules; exclude_rule_ids runs last.
        - match:
            path_prefix: "/upload/"
          policy:
            mode: block
            engines:
              coraza:
                include_owasp: true
                directives: |
                  SecRule REQUEST_HEADERS:Content-Type "@rx ^multipart/form-data" \
                    "id:100001,phase:1,pass,nolog,ctl:requestBodyProcessor=MULTIPART"

    # A domain that uses ONLY custom rules (no CRS) — directives_file points at a
    # SecLang file the management plane writes into the watched config dir.
    - hosts: ["legacy.example.com"]
      routes:
        - match: {}
          policy:
            mode: block
            engines:
              coraza:
                directives_file: "/etc/elchi/elchi-shield/coraza/legacy.conf"
```

## How it decides

With `include_owasp: true`, the directive bundle is assembled in this order: `@coraza.conf-recommended` → **`SecRuleEngine On`** → `@crs-setup.conf.example` → your tuning SecAction → `@owasp_crs/*.conf` → your `directives` / `directives_file` → `exclude_rule_ids` removals. With `crs_files` / `crs_rule_ids` the `@owasp_crs/*.conf` step becomes the frame plus the selected files (and `SecRuleRemoveById` for the unselected ids of a file loaded for one rule). The WAF is compiled once into an atomic pointer, so a config reload can never race in-flight inspection.

Two details of CRS scoring that show up in [Security Events](/shield/ui/security-events): the CRS adds a rule's score **once per matched variable** (the same payload in two query arguments counts twice — the event's trail shows `+10 (×2)`), and the rules of `@coraza.conf-recommended` that `deny` on their own (such as `200002`, "Failed to parse request body", on a body the declared `Content-Type` cannot parse) block **without** adding to the anomaly score; disable them with `exclude_rule_ids` or turn off body access if they fire on legitimate clients.

At request time the CRS uses **collaborative anomaly scoring**: each matching rule adds to a per-transaction anomaly score, and the blocking-evaluation rule (949110) raises an interruption when the score crosses the threshold:

- `paranoia_level` (default 1) controls which rules run in blocking mode; higher levels enable more aggressive rules and more false positives.
- `detection_paranoia_level` runs the higher-PL rules in detection only — they log but do not add to the blocking decision.
- `inbound_anomaly_threshold` (default 5) / `outbound_anomaly_threshold` (default 4) — lower is stricter.
- `crs_settings` — the CRS policy variables, written into the same SecAction. The method list is always written: the CRS on its own only allows `GET HEAD POST OPTIONS`, and rule 911100 is CRITICAL (+5), enough to block at the default threshold, so every PUT, PATCH and DELETE would get a 403. Shield's default is `GET HEAD POST OPTIONS PUT PATCH DELETE`. The CRS rules themselves are untouched — the CRS reads each variable and only sets its default when it is still unset.

A CRS hit becomes a **Block verdict, severity High**, with the rule-forced status honored (e.g. `status:418`) or **403** otherwise. `REMOTE_ADDR` inside rules is the trusted derived client IP, so IP-keyed CRS rules work correctly.

**Fail behavior:** body-processing errors **propagate**, so the policy `fail_mode` governs — a body Coraza cannot process is never silently allowed. See [Modes & Fail Postures](/shield/policies/modes-and-postures).

## What each paranoia level blocks

The CRS flags some legitimate traffic, and which traffic depends on the paranoia level and on the CRS version. Elchi does not guess this: a catalog of about 150 common legitimate requests and responses is run through shield's real engine at PL1–PL4 for every CRS release the archive publishes. WAF Studio shows the result for your project's CRS version, applies your disabled rules and thresholds, and offers the narrowest fix for each blocked case.

The cases below start being blocked at the level named (CRS 4.25.0, default thresholds). The catalog is made of patterns, not a share of real traffic.

| From | Ordinary traffic that gets blocked | Rules |
|---|---|---|
| **PL1** | GraphQL queries and mutations | 932235, 942290, 942190, 932370 |
| | Unix / Windows / relative file paths in JSON; shell or code snippets; Markdown code fences | 930110, 930120, 932xxx, 933xxx, 934100, 941390 |
| | Prose that looks like commands or SQL (“It is time to make a change”, “Offices: Seattle; San Jose”, “Timestamp (UTC)”) | 932235, 932380, 942151, 942270, 942360 |
| | HTML from editors with images or full email templates; data-URL images | 941100, 941160, 941180, 941260, 934170 |
| | A body without `Content-Type`; a GET with a body | 920340, 920640, 920170 |
| | Malformed bodies: JSON with a BOM or trailing comma, NDJSON as `application/jsonl`, XML in ISO-8859-1, an unquoted multipart filename — refused without scoring | 200002, 200003 |
| | `localhost` / IP / Kubernetes service URLs; Java stack traces; `session_id` in a query | 931100, 934110, 934190, 944100, 943120 |
| | Policy defaults: TRACE / PROPFIND, `text/plain`, `octet-stream`, grpc, protobuf bodies, `.log` / `.pem` paths or a path ending in a domain, `Content-Encoding` / `Content-Range` | 911100, 920420, 920440, 920450 — adjustable in [CRS policy settings](#crs-policy-settings) |
| | Responses (when response inspection is on): directory listings, shell scripts, form errors such as “must be a valid email address”, docs mentioning SQL drivers or exceptions | 950xxx–956xxx |
| **PL2** | PromQL / Grafana queries, SOAP 1.2, rich-text HTML, prose with select/update/delete, URLs and emails, base64, cron, CSV, coordinates, Markdown inline code, `_method=DELETE` | 931130, 932236, 941xxx, 942xxx, 920650 |
| | Any 5xx response (by status, whatever the body type) | 950100 |
| **PL3** | Turkish or other non-ASCII text, video `Range` requests, repeated query parameters, non-standard `Cache-Control` | 920272, 921230, 921180, 920510 |
| **PL4** | An apostrophe or two special characters anywhere (search, names, form logins) | 920273, 942432 |

Passing at every level: curl, python-requests, Go/Java/okhttp clients, Kubernetes probes, browser JSON GET/POST, CORS preflight, plain multipart uploads, PUT and DELETE (shield's method default), and ordinary HTML/JSON responses. Response bodies are inspected only for `text/plain`, `text/html` and `text/xml` and when not compressed; `application/json` responses are judged by status only.

Versions differ — for example PATCH with `application/merge-patch+json` passes by default in 4.25.2 and 4.30.0 but not in 4.26–4.29, and the form-error false positive is gone from 4.29 — which is why the list is measured per version and never borrowed from another one.

**Where the measurement comes from.** The archive measures every CRS release when it publishes it, with the newest shield, and publishes the report next to the bundle (`crs_impact_<version>.json`, covered by the release's signed checksums). The control plane fetches it, checks its sha256 against the archive index, caches it and serves it to WAF Studio; a new CRS release is therefore measured without a UI update. When a newer shield measures something else, the archive re-publishes the report and the control plane picks it up within its CRS refresh interval (15 minutes by default, for the CRS versions your edges' shield can run). The reports for the CRS releases known when the control plane was built are also built into it, for installs that cannot reach the archive. A version with no report yet shows *Not measured for CRS … yet* — another version's list is never shown.

## CRS policy settings

The CRS judges some legitimate traffic as abnormal out of the box — its defaults describe a classic web site, not an API. Measured on shield's CRS (4.25, paranoia level 1, threshold 5), each of these is blocked by a single rule scoring +5:

| Blocked request | Rule | Fix |
|---|---|---|
| PATCH with `application/merge-patch+json` or `application/json-patch+json`; bodies in `text/plain`, `application/octet-stream`, yaml, csv, ndjson, graphql, protobuf | 920420 | add the type to `allowed_request_content_type` |
| `GET /domains/example.com`, `/files/app.log`, `/certs/server.pem` | 920440 | leave `.com` / `.log` / `.pem` out of `restricted_extensions` |
| a request with `Expect: 100-continue`, `Content-Encoding`, `Content-Range` or `X-HTTP-Method-Override` | 920450 | leave the header out of `restricted_headers_basic` |

`crs_settings` sets these CRS variables. A key left out keeps the default; a list **replaces** the default list, it does not add to it. The WAF Studio shows every default in full next to its field.

| Key | Type | Rule (PL) | Default |
|---|---|---|---|
| `allowed_methods` | list | 911100 (1) | `GET HEAD POST OPTIONS PUT PATCH DELETE` |
| `allowed_request_content_type` | list | 920420 (1) | `application/x-www-form-urlencoded` `multipart/form-data` `text/xml` `application/xml` `application/soap+xml` `application/json` |
| `allowed_request_content_type_charset` | list | 920480 (1) | `utf-8` `iso-8859-1` `iso-8859-15` `windows-1252` |
| `restricted_extensions` | list | 920440 (1) | 97 extensions: `.bak`, `.config`, `.com`, `.db`, `.ini`, `.key`, `.log`, `.pem`, `.sql`, … |
| `restricted_headers_basic` | list | 920450 (1) | `content-encoding` `proxy` `lock-token` `content-range` `if` `x-http-method-override` `x-http-method` `x-method-override` `x-middleware-subrequest` `expect` |
| `restricted_headers_extended` | list | 920451 (2) | `accept-charset` |
| `max_num_args` | number | 920380 (1) | off — counts query and body arguments; **every JSON leaf counts** |
| `arg_name_length` / `arg_length` / `total_arg_length` | number | 920360 / 920370 / 920390 (1) | off |
| `max_file_size` | number | 920400 (1) | off — the whole multipart request's size, not one file |
| `combined_file_sizes` | number | 920410 (1) | off — the uploaded files together |
| `allow_method_override_parameter` | true/false | 920650 (2) | `false` — a `_method` argument different from the method is flagged |
| `crs_validate_utf8_encoding` | true/false | 920250 (1) | depends on the CRS version: off in 4.25, on in 4.30 |

```yaml
coraza:
  include_owasp: true
  crs_settings:
    allowed_request_content_type: [application/json, application/merge-patch+json]
    restricted_extensions: [.bak, .config, .env, .key, .pem, .sql]   # .com/.log no longer refused
    restricted_headers_basic: []                                      # restrict no header
    max_num_args: 255
```

**Rules the edge enforces when it loads the policy:**
- Methods are upper-case (`PUT`; `M-SEARCH` is fine); media types have no parameters (`application/json`, not `application/json; charset=utf-8`); an extension is one extension (`.bak` or `bak`); a header is a plain name. Entries are lower-cased where the CRS compares lower-case, and a repeat is refused.
- The allow-lists (methods, content types, charsets) cannot be empty — that would block every request. The restricted lists can: `[]` restricts nothing.
- Limits are whole numbers from 1 (a limit equal to the value passes). `1.5`, `1e3` or `"10"` are refused rather than silently rounded; switches are `true` or `false` (`"yes"` is refused).
- A setting must reach a rule that runs: with a CRS file or rule selection that does not include the rule, or with the rule in `exclude_rule_ids`, it is refused as "has no effect".
- `restricted_headers_extended` and `allow_method_override_parameter` act only at paranoia level 2 or higher; the WAF Studio warns when the level is lower.

**Not offered, on purpose:** `allowed_http_versions` (shield gives the CRS a fixed protocol, so it would either do nothing or block everything), `enforce_bodyproc_urlencoded` (shield's engine already parses unknown body types as arguments), `sampling_percentage` (below 100 it silently skips inspection), and the anomaly score weights (use the thresholds).

## Rule exceptions

The narrow fix for a false positive: the rule keeps running, but skips a field — or, on some paths, the request. In the WAF Studio's **Rule exceptions** card (or from a security event: **Add exception…**):

```yaml
engines:
  coraza:
    include_owasp: true
    rule_exceptions:
      - rule_ids: ["942100", "942200-942299"]
        targets: ["ARGS:password", 'ARGS:/^json\.(.*\.)?token$/']
      - rule_ids: ["913100"]
        targets: ["REQUEST_HEADERS:user-agent"]    # a header rule: works too
      - rule_ids: ["942100"]
        paths: ["/api/import/"]                    # the whole rule, on these paths only
```

- **Targets**: `COLLECTION`, `COLLECTION:key` or `COLLECTION:/regex/` — `ARGS`, `ARGS_GET`, `ARGS_POST`, the `*_NAMES` collections, `REQUEST_HEADERS`, `REQUEST_COOKIES`, `FILES`, `REQUEST_FILENAME`, `REQUEST_BASENAME`, `REQUEST_URI`, `REQUEST_BODY`, `XML`. JSON body fields are `ARGS:json.<path>` (arrays as `json.items.0.name`). Keys compare case-insensitively.
- **Paths**: `paths` match by prefix (a plain prefix, like a route's `path_prefix`), `exact_paths` exactly — the path without the query string, with `..` segments resolved first. Without paths the exception applies to every request of the policy; without targets (paths only) the rules are removed on those paths.
- Shield writes each exception **before the CRS rules**, so it also reaches the rules that read headers and cookies (phase 1), which a rule in `directives` (written after the CRS) cannot.
- Refused at save and on the edge: an unknown collection, a key with characters outside letters, digits and `_ . - [ ] @ $` (use a regex), a regex with a comma, quote, whitespace or an upper-case letter (keys are compared lower-cased — write `[^0-9]` for `\D`; RE2 syntax, no look-around), a rule that does not run (not selected, or disabled: "has no effect"), rule 900000 and ids 4900000–4900999 (shield's own).
- Needs elchi-shield 1.3 or newer on every edge; WAF Studio names older edges and blocks Apply.

## Rule traffic in the WAF Studio

The rule library of the WAF Studio shows, on every CRS rule, how it behaved in real traffic: **`1.2k matched · 312 blocked`** — how many requests it matched, and how many of those were blocked (by the CRS score, or by another protection of the same request). Each file shows the sum of its rules, and **Most matched** orders the files and their rules by matches. Click a count to open those requests in **Security Events** (a new tab, so the policy you are editing stays as it is).

- **Which traffic**: opened on a domain or one of its routes, the counts are the **domain's, with all its routes** — every request a policy of that domain decided. Opened on the policy defaults, they are the whole project's. Path or route breakdowns are not offered.
- **Window**: 1 hour, 24 hours (default) or 7 days — the audit table keeps 7 days by default.
- **Blocked is complete; matched may be lower.** Shield records every blocked request, but a request that only scored under the threshold is recorded at the policy's `sampling_rate` (5% unless set). The Studio says which rate applies (the lowest of the domain and its routes). Set `sampling_rate: 1` on a domain you are tuning to see every match.
- **Requests, not events**: a request counts once per rule even when it wrote several audit rows. Counts of 65,536 and more are estimates (`~70k`).
- **0 matched does not make a rule unnecessary** — it may not have been attacked in the window.
- A domain is identified by its host list as written: after you change a domain's hosts, its earlier traffic no longer shows under it. A request that matched more than 32 rules keeps the first 32.
- Shown to Admins and Owners (Security Events is theirs); without ClickHouse the Studio says the counts are unavailable and works as before.

## Envoy prerequisites

- Coraza is a body-phase engine: set `inspect_request_body: true` and a `max_request_body_bytes` cap on any policy running it, and `inspect_response_body: true` + `max_response_body_bytes` if you want the outbound (response) CRS rules. See the general [ext_proc wiring](/shield/envoy-wiring) for body-mode configuration.
- IP-keyed CRS rules rely on the trusted source IP: run Envoy with `use_remote_address` and set `--xff-trusted-hops` to the exact number of proxies in front of Envoy.

## Verify

A benign request passes:

```bash
curl -i http://app.example.com/api/users
# HTTP/1.1 200 OK
```

A classic injection probe is blocked (in `mode: block`):

```bash
curl -i "http://app.example.com/admin/search?q=1%27%20UNION%20SELECT%20password%20FROM%20users--"
# HTTP/1.1 403 Forbidden
```

In `mode: detect` the same request returns 200 but increments `detections_total` and emits an audit finding — watch that metric during rollout.

## Gotchas

- **Roll out in `detect` first.** Watch `detections_total`, tune `exclude_rule_ids` and the thresholds, then switch to `block`. The CRS at PL1 is already opinionated; PL2+ will false-positive on real traffic you haven't tuned for.
- **Never use SecLang `DetectionOnly`** in custom directives — Shield forces `SecRuleEngine On` and expresses monitor/shadow via the policy `mode`. A `DetectionOnly` override would silently disable enforcement for every mode.
- **Request and response are separate transactions** — response-phase rules do not see request-phase variables.
- The CRS tuning fields are rejected at load without `include_owasp: true` — they tune the CRS, not custom directives.
- **To block a method, take it out of `crs_settings.allowed_methods`** — the route `methods` match only chooses which requests a route applies to, it allows nothing. Set CRS variables in `crs_settings`, not with `setvar:tx.…` in `directives`: directives load after the CRS initialisation, so such a setvar misses the rules of phase 1 but overrides the value for phase-2 rules (argument limits, utf-8, charsets). A directive that setvars a variable `crs_settings` sets is refused.

Related engines: [OpenAPI validation](/shield/engines/openapi-validation) (positive security), [GraphQL](/shield/engines/graphql) (query-shape DoS guard).
