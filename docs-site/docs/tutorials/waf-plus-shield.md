---
title: "Tutorial: WAF and Shield Together"
description: When to use the WASM WAF vs Shield's Coraza engine vs both — a layered edge-WAF-plus-Shield setup with a clear division of labor, honest about the overlap.
sidebar_position: 4
tags: [tutorial]
---

Elchi delivers the same Coraza/OWASP Core Rule Set **two different ways**, and it ships API-specific engines the CRS was never meant to cover. This tutorial helps you decide which to run — the [WASM WAF](/traffic-and-certificates/waf/overview), [Shield's Coraza engine](/shield/engines/coraza-waf), or both — and then builds a layered setup where each layer does the job it's best at. It's honest about where they overlap.

## What you'll build

A defense-in-depth edge: the WASM WAF providing broad CRS coverage inside Envoy, and Shield adding API-specific auth, rate-limiting, and DLP as an `ext_proc` sidecar — with a clear division of labor and no wasteful double-inspection.

## Prerequisites

- An edge Envoy managed by Elchi — see [From Install to First Listener](/tutorials/zero-to-envoy).
- **Shield running as a sidecar** and wired via `ext_proc` — see [Deployment](/shield/deployment) and [Envoy Wiring](/shield/envoy-wiring).
- Familiarity with the [detect → shadow → block rollout](/shield/policies/modes-and-postures) — you'll roll out each layer that way.

## Step 1 — Understand the two WAF deliveries

Both share a rule engine (Coraza) and rule set (OWASP CRS). They differ entirely in how they're wired into the data path — pick by **how you run inspection**, not by the rules. The [WAF overview](/traffic-and-certificates/waf/overview) has the full table; the essentials:

| | **Standalone WASM WAF** | **Shield Coraza engine** |
|---|---|---|
| Delivery | Envoy **WASM filter**, shipped via xDS | Shield **`ext_proc` sidecar** engine |
| Authored in | The UI (`/waf`), backend-versioned | Shield policy YAML in the watched dir |
| Runtime | *Inside* Envoy (Proxy-Wasm sandbox, TinyGo) | *Beside* Envoy as a native Go process |
| Response inspection | Partial (WASM sandbox limits) | Full — the only Shield engine that inspects responses |
| Runtime limits | No persistent state, no `exec`/Lua, no filesystem | Native Go — fewer limits, per-policy fail posture |

They are **complementary, not exclusive** — you can run both.

## Step 2 — Decide which layers you need

Reason from what each is best at:

- **Use the WASM WAF** when your protection lives in the Envoy config you already manage through Elchi and you want CRS delivered on the **same xDS pipeline** as your listeners and routes — one control plane, one propagation path, browsable/versioned/rollback-able rules in the UI. It's the right home for broad, host-wide signature coverage.
- **Use Shield's Coraza engine** when you already run Shield and want the WAF **alongside Shield's other engines** under one policy — with **response inspection** (outbound data-leakage rules) and native-Go behavior with a per-policy fail posture.
- **Use both** for defense in depth: the WASM WAF as a broad edge filter over *all* traffic, and Shield adding the things a CRS can't do — **auth, per-consumer rate limiting, bot scoring, DLP redaction, and positive-security contract validation** on your API routes specifically.

:::tip[The honest overlap]
Running CRS in *both* the WASM filter and Shield's Coraza engine means the same request is scored by the same rules twice — wasted work and duplicate findings. Don't. If you run both layers, put **broad CRS in the WASM WAF** and use **Shield for what CRS doesn't do** (auth, rate-limit, DLP, OpenAPI). Reach for Shield's Coraza engine specifically when you need **response-side** inspection, which the WASM sandbox does only partially.
:::

## Step 3 — Layer 1: broad CRS at the edge (WASM WAF)

Author the ruleset in the UI under **WAF** (`/waf`). Reference the embedded CRS and go — see [building a configuration](/traffic-and-certificates/waf/building-config) and the [CRS library](/traffic-and-certificates/waf/crs-library):

```text
Include @owasp_crs/*.conf
```

On save, the controller injects the encoded rules into every WASM extension that references this config and re-snapshots — the rules ride your normal xDS pipeline to Envoy, no restart. Roll out the CRS in **detection-only** mode first, watch what *would* have blocked, then promote — see [WAF Studio](/traffic-and-certificates/waf/waf-studio) for tuning and custom `SecRule`s.

This layer sees **all** traffic to the listener and catches the broad attack classes: SQLi, XSS, command injection, path traversal, scanners, protocol abuse.

## Step 4 — Layer 2: API-specific protection (Shield)

Now add a Shield policy for your **API routes**, doing the things the CRS layer can't. This is Shield's home turf — auth, per-consumer rate limiting, and DLP redaction on responses:

```yaml title="api-layered.yaml"
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-layered
spec:
  defaults:
    mode: detect                 # start every layer in detect
    fail_mode: fail_open
    timeout: 50ms

  domains:
    - hosts: ["api.example.com"]
      routes:
        # Auth + per-consumer rate limiting — pure header phase, no body buffering.
        # The CRS layer above has already screened this request for injection.
        - match:
            path_prefix: "/v1/"
          policy:
            engines:
              jwt:
                issuer: "https://auth.example.com/"
                audience: "api"
                algorithms: ["RS256"]
                public_key_file: "/etc/elchi/elchi-shield/keys/jwt-pub.pem"
              rate_limit:
                requests_per_second: 100
                burst: 200
                key: ip

        # DLP on a sensitive response surface — redact PII Envoy's WASM WAF can't see.
        # Fail closed: an error here must not silently ship un-redacted data.
        - match:
            path_prefix: "/v1/exports/"
          policy:
            fail_mode: fail_close
            inspect_response_body: true
            max_response_body_bytes: 1048576
            checks:
              body:
                dlp:
                  direction: response          # inspect the response body
                  redact: ["credit_card", "ssn", "email"]   # mask PII in place
```

Why this split works: Shield's [header-phase engines](/shield/engines/jwt) (JWT, rate-limit, bot, IP-reputation) are cheap and **never buffer the body** — they add API-specific controls the CRS has no concept of, at near-zero cost. And [DLP](/shield/policies/dlp) inspects **responses**, which the WASM WAF only partially can.

Deploy it from the [policy editor](/shield/ui/policy-editor) (saving *is* deploying), then follow the same [detect → shadow → block](/shield/policies/modes-and-postures) rollout you used for the WAF.

## Step 5 — When you want Shield's Coraza engine instead

If you're **not** running the WASM WAF (or you specifically need response-side CRS rules), put Coraza in the Shield policy itself. It's a body-phase engine, so buffer the body on that route — see [Coraza WAF](/shield/engines/coraza-waf):

```yaml
        - match:
            path_prefix: "/admin/"
          policy:
            mode: block
            inspect_request_body: true
            max_request_body_bytes: 1048576
            inspect_response_body: true      # outbound CRS rules — WASM can't fully do this
            max_response_body_bytes: 1048576
            engines:
              coraza:
                include_owasp: true
                paranoia_level: 2
                exclude_rule_ids: ["920350"]
```

:::warning[Don't double-run CRS]
This is the layer that overlaps the WASM WAF. If both are active on the same route you're scoring identical rules twice. Choose one home for the CRS per route — the WASM filter for broad edge coverage, or Shield's engine when you need response inspection and native-Go fail posture on that specific surface.
:::

## Step 6 — Promote to block

Everything so far runs in detect — the CRS layer in detection-only and the Shield policy with `mode: detect` — so findings are logged but nothing is enforced yet. Follow the [detect → shadow → block rollout](/shield/policies/modes-and-postures) for both layers: promote the WASM WAF out of detection-only in [WAF Studio](/traffic-and-certificates/waf/waf-studio), and once the Shield policy's shadow stream has been clean for a representative window, flip it to enforce:

```yaml
spec:
  defaults:
    mode: block
```

## Step 7 — Verify the division of labor

With both layers enforcing, confirm each catches its own class of attack:

```bash
# Injection → caught by the CRS layer (WASM WAF or Shield Coraza), 403
curl -i "https://api.example.com/v1/search?q=1%27%20OR%201=1--"

# Missing credential → caught by Shield's JWT engine (CRS has no concept of auth), 403
curl -i "https://api.example.com/v1/users/42"

# Flood from one IP → throttled by Shield's rate-limit engine, 429
for i in $(seq 1 300); do curl -s -o /dev/null -w "%{http_code}\n" \
  "https://api.example.com/v1/status" -H "Authorization: Bearer <valid-jwt>"; done | sort | uniq -c
```

In [Security Events](/shield/ui/security-events), filter by **Engine** to see the division cleanly: `coraza` findings are the injection attempts, `jwt` the auth failures, `ratelimit` the throttles, `dlp` the redactions. Each layer owns its lane.

## Next steps

- [Secure an API with Shield](/tutorials/secure-an-api-with-shield) — the full Discovery → policy → enforcement journey.
- [OpenAPI validation](/shield/engines/openapi-validation) — add positive security so the WAF denies known-bad while a contract allows known-good.
- [WAF versioning & restore](/traffic-and-certificates/waf/versioning-restore) — diff and one-click rollback when a rule false-positives.
