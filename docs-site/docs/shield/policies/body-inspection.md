---
title: Body Inspection & Limits
description: Enabling request/response body buffering, size and time limits, and the always-on structural protections — truncation guard, content decoding, and the process-wide body budget.
sidebar_position: 3
tags: [shield, policy]
---

Header inspection is nearly free; **body inspection is not**. A body-inspecting
policy tells Envoy to stream the message body to Shield in **BUFFERED** mode,
which costs memory and latency on every matched request. Body inspection is
therefore **off by default** and opt-in per direction, per policy. This page
covers the switches, the limits, and the structural protections that always run
underneath.

## Body inspection options

All of these are `PolicySpec` fields — settable at `spec.defaults`,
`domain.policy`, or `route.policy`, most-specific-wins
(see [The SecurityPolicy Model](/shield/policies/policy-model)).

| Option | Type | Default | Description |
|---|---|---|---|
| `inspect_request_body` | bool | `false` | Buffer & inspect the request body. |
| `inspect_response_body` | bool | `false` | Buffer & inspect the response body. |
| `max_request_body_bytes` | int64 | `1048576` (1 MiB) | Per-request body buffer cap. Range `0`–`1073741824` (1 GiB); `0` = do not inspect. Over-limit ⇒ **block** (non-skippable). |
| `max_response_body_bytes` | int64 | `0` (no inspect) | Per-response body buffer cap. Same range and semantics. |
| `max_header_bytes` | int64 | `8192` (8 KiB) | Default per-header-value size cap when a route's `checks` doesn't set a tighter one. `≥ 0`. |
| `timeout` | duration | `50ms` | Per-request inspection deadline (applied as a context deadline). Must be `> 0` if set. |

:::note[Zero means "do not inspect", not "no limit"]
In `PolicySpec`, an omitted field inherits, while a present field — even a zero —
overrides. `max_request_body_bytes: 0` therefore means "do not inspect the
request body", not "unlimited". Two cross-field rules follow from this and are
enforced at load: `inspect_request_body: true` with `max_request_body_bytes: 0`
is rejected (enabled but no budget), and the same for the response pair.
`mode: off` with either inspect flag set is also rejected.
:::

## What buffering actually means

When a policy inspects a body, Shield asks Envoy for the body in **BUFFERED**
mode: Envoy holds the request (or response) while the complete body — up to the
size cap — is accumulated and shipped to Shield, inspected once, and the verdict
returned. The costs:

- **Memory**: up to the size cap per in-flight request, on the Shield side.
- **Latency**: the message does not move forward until the body has fully
  arrived and been inspected. The `timeout` budget must cover this — if body
  inspection regularly exceeds it, you will see `timeouts_total` climb and the
  policy `fail_mode` applied (see
  [Modes & Fail Postures](/shield/policies/modes-and-postures)).

Scope body inspection to the routes that need it, and set caps to realistic
payload sizes — a 1 MiB cap on an API whose real payloads are 16 KiB is 64× more
buffering headroom than you need.

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-body-limits
spec:
  defaults:
    mode: block
    fail_mode: fail_open
    timeout: 50ms

  domains:
    - hosts: ["app.example.com"]
      routes:
        # JSON API: inspect request bodies with a tight cap.
        - match:
            path_prefix: "/api/"
            methods: [POST, PUT, PATCH]
          policy:
            inspect_request_body: true
            max_request_body_bytes: 262144      # 256 KiB — real payloads are small
            checks:
              body:
                require_json: true

        # Upload endpoint: larger cap, more time.
        - match:
            path_prefix: "/upload/"
          policy:
            inspect_request_body: true
            max_request_body_bytes: 10485760    # 10 MiB
            timeout: 250ms

        # Everything else: headers only (inherited inspect flags stay false).
        - match: {}
          policy:
            mode: block
```

## The structural protections (always on, never skippable)

Three protections sit underneath every body-inspecting policy. They are
**structural** — not part of the reorderable inspector stages, not listed in
`policy.pipeline`, and they honor no `skip_checks` entry.

### Truncation guard: over-limit bodies block

A body that exceeds the per-message cap (`max_request_body_bytes` /
`max_response_body_bytes`) is marked truncated and **blocked, non-skippably**.
Shield never inspects a partial body and pretends the result is meaningful — a
truncated inspection would let an attacker push the payload past the cap and
smuggle anything in the tail.

### Content decoding: compressed bodies are decoded or blocked

Inspectors must see the real payload, never compressed bytes. The structural
decode stage decompresses `gzip` and `deflate` bodies (decompression-bomb
bounded) before any inspector runs. An encoding Shield cannot decode — `br`, or
stacked/multiple encodings — **blocks fail-closed**, whether the layers arrive
comma-joined in one `Content-Encoding` header or split across several. A
Content-Encoded body is never inspected as if it were plaintext.

### Process-wide in-flight body budget

Total buffered body memory across **all** concurrent streams is capped by a
shared budget (the `--max-inflight-body-bytes` startup flag — an operational
flag, not a policy field; see [Deployment](/shield/deployment)). A body that
would exceed the shared budget is marked truncated and blocked, exactly like a
per-message over-limit. This turns "per-request cap × concurrency" from a memory
DoS into a bounded, observable rejection.

Both rejection paths are counted in
`body_budget_rejections_total{reason="per_request_cap"|"inflight_budget"}` — see
[Observability](/shield/observability).

:::warning
Because over-limit and over-budget bodies **block**, a cap set below your real
payload sizes is a self-inflicted outage in `block` mode. Roll body-inspecting
policies out in `detect`/`shadow` first and watch for `body_size` findings in
[Security Events](/shield/ui/security-events) before enforcing.
:::

## Which engines need bodies — and which don't

Only enable body inspection on a direction if something on that route actually
reads the body there. Header-only policies must never buffer bodies — and Shield
enforces this internally: the `waf_engine` stage is partitioned so header-phase
engines run at header time and never trigger buffering by themselves.

| Needs the body (body-phase) | Direction | Header-only (no buffering) |
|---|---|---|
| [Coraza WAF](/shield/engines/coraza-waf) | request **and** response | [JWT](/shield/engines/jwt) |
| [GraphQL guard](/shield/engines/graphql) | request | [JWKS](/shield/engines/jwks) |
| [OpenAPI validation](/shield/engines/openapi-validation) (with `validate_request_body: true`) | request | [API key](/shield/engines/api-key) |
| [DLP](/shield/policies/dlp) (`checks.body.dlp`) | per its `direction` (default response) | [HMAC signing](/shield/engines/hmac-signing)¹ |
| `checks.body.require_json`, `detect_sensitive_data` | request | [HTTP signatures](/shield/engines/http-signature)² |
| | | [mTLS/XFCC](/shield/engines/mtls-xfcc) |
| | | [IP reputation](/shield/engines/ip-reputation) |
| | | [Rate limit](/shield/engines/rate-limit) |
| | | [Bot detection](/shield/engines/bot-detection) |

¹ `hmac_sign` is header-phase, but `require_body_digest: true` binds the
signature to a body digest — pair it with request-body inspection.

² `http_signature` is header-phase, but when its `covered_components` include
`content-digest` the signature binds the body and the engine runs at the body
phase — pair it with request-body inspection.

:::tip
**Every `checks.body.*` option auto-enables inspection:** shield derives
`inspect_request_body` / `inspect_response_body` from the DLP `direction`, and if
`require_json` or `detect_sensitive_data` is configured with **neither** inspect
flag set, it defaults to the **request** body — so no body check can silently
no-op. Set `inspect_*_body` explicitly only to pick a different direction for
those direction-agnostic checks (and raise the size cap if needed). Body-phase
**engines**, by contrast, still require you to set the matching `inspect_*_body`
flag yourself. See [Checks](/shield/policies/checks).
:::

A typical Coraza route, sized deliberately:

```yaml
domains:
  - hosts: ["app.example.com"]
    routes:
      - match:
          path_prefix: "/api/"
        policy:
          mode: detect                      # roll out non-blocking first
          fail_mode: fail_open
          inspect_request_body: true
          max_request_body_bytes: 1048576   # 1 MiB
          engines:
            coraza:
              include_owasp: true
```

For the metrics to watch while sizing (`body_inspected_bytes_total`,
`inflight_body_bytes`, `processing_latency_seconds{phase}`), see
[Observability](/shield/observability) and the
[Overview dashboard](/shield/ui/overview-dashboard).
