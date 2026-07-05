---
title: Built-in Checks & Pipeline Order
description: The built-in header and body checks, skip_checks exemptions, custom pipeline stage ordering, audit sampling, and per-policy log level.
sidebar_position: 4
tags: [shield, policy]
---

Besides the pluggable engines, every policy can enable a set of cheap **built-in
checks** — header hygiene at the header phase, JSON/sensitive-data checks at the
body phase — and control how the inspector stages are ordered, how allow
decisions are sampled into audit, and how verbosely the policy logs. This page
covers `checks`, `skip_checks`, `pipeline`, `sampling_rate`, and `log_level`.

All of these are `PolicySpec` fields, settable at any scope with the merge rules
described in [The SecurityPolicy Model](/shield/policies/policy-model) — in
particular, `checks.headers` and `checks.body` each **replace wholesale** when
set at a narrower scope, while `skip_checks` **unions** across scopes.

## `checks`

| Option | Type | Default | Description |
|---|---|---|---|
| `headers` | `HeaderChecks` | none | Header inspection. |
| `body` | `BodyChecks` | none | Body inspection. |

### `checks.headers`

Runs in the `fast_pre_checks` stage at the header phase — no body buffering.

| Option | Type | Default | Description |
|---|---|---|---|
| `forbidden` | string[] | empty | Header names that cause a **block** when present. |
| `required` | string[] | empty | Header names that cause a **block** when absent. |
| `max_header_value_bytes` | int64 | `0` (off) | Cap on a single header value's size; `0` disables. Falls back to the policy-level `max_header_bytes` (default `8192`) when unset here. |
| `enforce_valid_host` | bool | `false` | Block requests with a missing/invalid Host/authority. |

### `checks.body`

Runs in the `body_checks` stage at the body phase.

| Option | Type | Default | Description |
|---|---|---|---|
| `require_json` | bool | `false` | Block bodies that are not valid JSON for JSON content types. |
| `detect_sensitive_data` | bool | `false` | Enable the built-in PII/secret detection hook (block on first hit). |
| `dlp` | `DLPSpec` | none | Data-loss prevention (block/redact) — see [DLP](/shield/policies/dlp). |

:::note
`checks.body.*` options need the body, but do not enable buffering by
themselves — set `inspect_request_body` / `inspect_response_body` and the
matching size cap for the relevant direction. See
[Body Inspection & Limits](/shield/policies/body-inspection).
:::

## `skip_checks`

| Option | Type | Default | Description |
|---|---|---|---|
| `skip_checks` | string[] | empty | Named built-in checks to exempt. **Accumulates (union) across scopes** — a broad scope can exempt, a narrow scope can add more. |

Valid values:

| Value | Skips |
|---|---|
| `host` | the `enforce_valid_host` check |
| `forbidden_headers` | the forbidden-header-names block |
| `required_headers` | the required-header-names block |
| `oversized_headers` | the per-header size cap |
| `json` | the `require_json` body check |
| `sensitive_data` | the `detect_sensitive_data` body hook |

:::warning Structural protections are not skippable
The body **truncation guard**, the content **decode** stage, and the process-wide
body-memory **budget** are structural — they always run and honor no
`skip_checks` entry. Only the six named built-in checks above can be exempted.
See [Body Inspection & Limits](/shield/policies/body-inspection).
:::

Because `skip_checks` unions, the typical pattern is: enable a check broadly at
`spec.defaults`, then exempt the one route that legitimately violates it:

```yaml
spec:
  defaults:
    mode: block
    checks:
      headers:
        required: ["X-Request-Id"]
        enforce_valid_host: true

  domains:
    - hosts: ["api.example.com"]
      routes:
        # Legacy webhook sender doesn't set X-Request-Id — exempt just that check.
        - match:
            path_prefix: "/webhooks/"
          policy:
            skip_checks: [required_headers]
        - match: {}
```

## `pipeline` — reordering (and disabling) inspector stages

| Option | Type | Default | Description |
|---|---|---|---|
| `pipeline.request` | string[] | `[fast_pre_checks, body_checks, waf_engine]` | Inspector order for the request pipeline. **Replaces wholesale** when set. |
| `pipeline.response` | string[] | `[fast_pre_checks, body_checks, waf_engine]` | Inspector order for the response pipeline. **Replaces wholesale** when set. |

The structural stages (context init, policy resolve, early decision,
body-truncation guard, content-decode, body gate) are always present at fixed
positions and are **not** listed here — `pipeline` only orders the reorderable
inspector stages.

Valid stage names (no duplicates):

| Stage | Phase | Contains |
|---|---|---|
| `fast_pre_checks` | header | host / forbidden / required / oversized-header checks |
| `body_checks` | body | `require_json`, `detect_sensitive_data`, DLP |
| `waf_engine` | header **and** body | expands to header-phase engines (JWT, API key, IP reputation, bot, XFCC, HMAC, JWKS, rate limit, HTTP signatures) at header time + body engines (Coraza, GraphQL, OpenAPI) at body time |

Behavior:

- **Omitting a stage disables it** for that direction. `request: [waf_engine]`
  means no built-in header checks and no body checks on requests.
- Cross-phase position is normalized — header-phase inspectors always run at
  header time, body-phase at body time — but **ordering within a phase is
  honored exactly**: listing `waf_engine` before `body_checks` runs the body
  engines before the body checks.

```yaml
policy:
  pipeline:
    request:  [fast_pre_checks, waf_engine, body_checks]
    response: [body_checks]      # only DLP/body checks on the response
```

:::warning
Because `pipeline.request`/`pipeline.response` replace wholesale per direction,
setting `pipeline` at a route silently discards the inherited order — and any
stage you forget to list is **disabled** on that route for that direction. If a
route sets `pipeline.request: [body_checks]`, its engines (`waf_engine`) no
longer run on requests. List every stage you still want.
:::

Ordering within a phase matters for correctness in one notable case: DLP
**redaction** rewrites the body (see [DLP](/shield/policies/dlp)), so if the same
route also runs a body-digest or signature check, place the stages deliberately —
a digest computed over a redacted body will not match the client's signature.

## `sampling_rate` — audit sampling of allow decisions

| Option | Type | Default | Description |
|---|---|---|---|
| `sampling_rate` | float | `0.05` | Fraction of **allow** decisions audited, range `[0, 1]`. Blocks and detections are **always** audited (this only samples the allow stream). |

Findings — blocks, detect-mode would-blocks, shadow detections — are always
audited in full; `sampling_rate` only thins the plain-allow stream. This is your
lever for controlling audit volume: on a high-traffic route, `sampling_rate: 0.05`
keeps 5% of allows for baseline visibility in
[Security Events](/shield/ui/security-events) while every security-relevant
event is still captured.

```yaml
policy:
  mode: block
  sampling_rate: 0.05    # audit 5% of allows; all findings still audited
```

Where audit events actually go (ClickHouse, OTLP, or off) is an operational
concern, not a policy one — see [Observability](/shield/observability).

## `log_level`

| Option | Type | Default | Description |
|---|---|---|---|
| `log_level` | string | `info` | Per-policy log verbosity: `debug` \| `info` \| `warn` \| `warning` \| `error`. |

Per-request allow decisions log at `debug`; enforced blocks and lifecycle events
log at `info`. Bumping one problematic route to `log_level: debug` gives you the
full per-phase decision log — request id, host/method/path, action, policy id,
rule id/engine/reason, status code, duration — without drowning the whole node.
See [Troubleshooting](/troubleshooting/common-issues) for how to read the
decision log.

## Complete example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-checks
spec:
  defaults:
    mode: block
    fail_mode: fail_open
    sampling_rate: 0.05
    checks:
      headers:
        enforce_valid_host: true
        max_header_value_bytes: 4096

  domains:
    - hosts: ["api.example.com"]
      routes:
        # JSON API: strict header hygiene + body checks.
        - match:
            path_prefix: "/v1/"
            methods: [POST, PUT, PATCH]
          policy:
            inspect_request_body: true
            max_request_body_bytes: 524288
            checks:
              headers:
                required: ["X-Request-Id"]
                forbidden: ["X-Debug"]
                enforce_valid_host: true
                max_header_value_bytes: 4096
              body:
                require_json: true
                detect_sensitive_data: true

        # Debug route while investigating an issue: verbose logs, monitor only.
        - match:
            path_prefix: "/v1/orders/"
          policy:
            mode: detect
            log_level: debug

        # Response direction: only body checks (DLP), no response-side engines.
        - match:
            path_prefix: "/v1/export/"
          policy:
            inspect_response_body: true
            max_response_body_bytes: 1048576
            pipeline:
              response: [body_checks]
            checks:
              body:
                dlp:
                  direction: response
                  redact: [email, credit_card]
```
