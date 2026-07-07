---
title: Coraza WAF (OWASP CRS)
description: The embedded ModSecurity-style WAF engine — OWASP Core Rule Set, paranoia levels, anomaly thresholds, and custom SecLang directives.
sidebar_position: 1
tags: [shield, engine]
---

The `coraza` engine is Shield's flagship content-inspection engine: a full ModSecurity-style WAF that protects against injection attacks (SQLi, XSS, command injection, path traversal, protocol abuse and the rest of the OWASP attack classes) using the **OWASP Core Rule Set embedded directly in the Shield binary** — there are no rule files to ship. It is a **body-phase** engine, and it is the **only engine that inspects responses** as well as requests (CRS phase 3/4 outbound rules).

:::info
The Elchi platform also delivers Coraza/OWASP-CRS as an **Envoy WASM filter** — the standalone [WAF product](/traffic-and-certificates/waf) configured from the UI and shipped through xDS. The Shield `coraza` engine is a different, complementary delivery of the same rule set: an `ext_proc` sidecar engine governed by Shield [policies](/shield/policies/policy-model), not a replacement for that path. See [How Shield Works](/shield/how-it-works) for where it sits.
:::

## When to use it

- You want broad, signature-plus-anomaly protection against common web attacks without writing rules yourself (`include_owasp: true`).
- You need custom SecLang rules for an application-specific pattern (`directives` / `directives_file`), with or without the CRS underneath.
- You want response-side inspection (outbound data-leakage rules) — no other Shield engine inspects responses.
- Pair it with a positive-security engine ([OpenAPI validation](/shield/engines/openapi-validation)) for defense in depth: the WAF denies known-bad, the contract allows known-good.

## Configuration

Body-phase WAF. The OWASP Core Rule Set is embedded in the binary — set `include_owasp: true` to load it from memory.

| Field | Type | Required | Default | Purpose |
|---|---|---|---|---|
| `directives` | string | one-of | — | Inline SecLang directives (run **after** the CRS so they can add/override rules). |
| `directives_file` | string | one-of | — | Path to a SecLang file (concatenated into `directives`). |
| `include_owasp` | bool | one-of | `false` | Load the embedded OWASP Core Rule Set. |
| `exclude_rule_ids` | string[] | no | — | CRS/custom rule IDs to disable (`SecRuleRemoveById`, applied last). Each entry must be a bare numeric rule id or id range (e.g. `"942100"` or `"942100-942999"`); anything else is rejected at load. |
| `paranoia_level` | int | no | `0` → CRS default (1) | CRS **blocking** paranoia level `1`–`4` (higher = stricter, more false positives). |
| `detection_paranoia_level` | int | no | `0` → = `paranoia_level` | Run rules up to this PL in **detection** but only block at `paranoia_level`. Must be `≥ paranoia_level`. |
| `inbound_anomaly_threshold` | int | no | `0` → CRS default (5) | Request-side collaborative score that triggers a block (lower = stricter). |
| `outbound_anomaly_threshold` | int | no | `0` → CRS default (4) | Response-side score that triggers a block. |

Rules:

- At least one of `directives` / `directives_file` / `include_owasp` is required.
- The CRS tuning fields (`paranoia_level`, `detection_paranoia_level`, `inbound_anomaly_threshold`, `outbound_anomaly_threshold`) **require `include_owasp: true`** — they tune the CRS and are rejected at load otherwise. PL values are `1`–`4` (`0` = use the CRS default); thresholds are `≥ 0`.

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

With `include_owasp: true`, the directive bundle is assembled in this order: `@coraza.conf-recommended` → **`SecRuleEngine On`** → `@crs-setup.conf.example` → your tuning SecAction → `@owasp_crs/*.conf` → your `directives` / `directives_file` → `exclude_rule_ids` removals. The WAF is compiled once into an atomic pointer, so a config reload can never race in-flight inspection.

At request time the CRS uses **collaborative anomaly scoring**: each matching rule adds to a per-transaction anomaly score, and the blocking-evaluation rule (949110) raises an interruption when the score crosses the threshold:

- `paranoia_level` (default 1) controls which rules run in blocking mode; higher levels enable more aggressive rules and more false positives.
- `detection_paranoia_level` runs the higher-PL rules in detection only — they log but do not add to the blocking decision.
- `inbound_anomaly_threshold` (default 5) / `outbound_anomaly_threshold` (default 4) — lower is stricter.

A CRS hit becomes a **Block verdict, severity High**, with the rule-forced status honored (e.g. `status:418`) or **403** otherwise. `REMOTE_ADDR` inside rules is the trusted derived client IP, so IP-keyed CRS rules work correctly.

**Fail behavior:** body-processing errors **propagate**, so the policy `fail_mode` governs — a body Coraza cannot process is never silently allowed. See [Modes & Fail Postures](/shield/policies/modes-and-postures).

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

Related engines: [OpenAPI validation](/shield/engines/openapi-validation) (positive security), [GraphQL](/shield/engines/graphql) (query-shape DoS guard).
