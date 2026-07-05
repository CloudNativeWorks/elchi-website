---
title: Modes & Fail Postures
description: What block, detect, shadow, and off actually do to a request; fail_open vs fail_close; and the recommended detect → shadow → block rollout.
sidebar_position: 2
tags: [shield, policy]
---

Every resolved policy carries two orthogonal settings: the **mode** (what happens
when an inspection finds something) and the **fail posture** (what happens when an
engine *errors* or times out). Getting the distinction right is the difference
between a safe rollout and a self-inflicted outage — this page covers both, plus
the recommended rollout sequence.

Both fields live in `PolicySpec` and can be set at any scope
(`spec.defaults`, `domain.policy`, `route.policy`) — the most-specific set value
wins, per the [inheritance model](/shield/policies/policy-model).

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | enum | `block` | `block` \| `detect` \| `shadow` \| `off` — enforcement posture. |
| `fail_mode` | enum | `fail_open` | `fail_open` \| `fail_close` — behavior when an engine **errors or times out**. |

## The four modes

| Mode | What happens to the request | Metric fed |
|---|---|---|
| `block` | Enforce. A finding blocks the request — the client gets an immediate **403**. | `requests_blocked_total` |
| `detect` | Evaluate everything, record the finding as a would-block, but **allow** the request (monitor mode). | `detections_total` |
| `shadow` | Evaluate as if blocking, log what *would* have been blocked, **allow** the request. | `shadow_detections_total` |
| `off` | Skip inspection entirely — the request continues untouched. | — |

Behavior details worth internalizing:

- In `block` mode the first finding **short-circuits**: later stages do not run,
  and one finding is emitted.
- In `detect` and `shadow` modes the pipeline keeps running after a finding, so
  you get the **full detection trail** — every finding is recorded and audited
  individually, not just the highest-severity one. This is exactly what makes
  these modes useful for tuning: you see everything that *would* fire.
- Findings in `detect`/`shadow` are **always audited** regardless of
  `sampling_rate` (sampling applies only to plain allow decisions — see
  [Built-in Checks](/shield/policies/checks)).
- `mode: off` is a per-policy switch and still goes through policy resolution.
  For paths that should skip resolution entirely (health checks, metrics), use
  `spec.exclude` instead — see
  [The SecurityPolicy Model](/shield/policies/policy-model).

:::note
`mode: off` combined with `inspect_request_body: true` or
`inspect_response_body: true` is rejected at load — inspecting a body while off
can never do anything.
:::

## `fail_open` vs `fail_close`

The fail posture governs **internal engine errors only** — for example, a Coraza
body-processing failure, a GeoIP database read error, or the per-request
`timeout` expiring.

| Posture | On engine error / timeout | Metric fed |
|---|---|---|
| `fail_open` | Allow the request. | `fail_open_total` |
| `fail_close` | Block the request with a fixed reason (`fail_close_error` / `fail_close_timeout`). The underlying error string is never leaked into the audit reason. | `fail_close_total` |

:::danger[Fail posture is NOT an auth bypass valve]
A **missing or invalid credential always blocks, regardless of `fail_mode`**.
Auth engines ([JWT](/shield/engines/jwt), [JWKS](/shield/engines/jwks),
[API key](/shield/engines/api-key), [HMAC signing](/shield/engines/hmac-signing),
[HTTP signatures](/shield/engines/http-signature),
[mTLS/XFCC](/shield/engines/mtls-xfcc)) report a failed or absent credential as a
**finding**, never as an error — there is no anonymous pass-through.
`fail_open` will not let an unauthenticated request through; it only governs the
rare case where an engine itself malfunctions.
:::

Two more rules that shape behavior under errors:

- **A confirmed block always beats an error.** If one engine blocks while another
  errors, the request blocks — the fail posture never overrides a real finding.
- **When no policy resolves at all**, the default is fail-open, so a Shield bug
  never blackholes traffic to hosts you haven't onboarded.

Posture guidance:

- `fail_open` (the default) is right for most WAF-style policies — a WAF bug must
  never take down legitimate traffic.
- `fail_close` is right for **positive-security** policies where an error would
  otherwise silently disable the control:
  [OpenAPI validation](/shield/engines/openapi-validation), country allow-lists,
  and DLP on sensitive response surfaces
  ([Data Loss Prevention](/shield/policies/dlp)).

:::warning[fail_open silently disables positive-security allow-lists]
A `fail_open` policy with a **country allow-list** in
[IP reputation](/shield/engines/ip-reputation) fails *open* on a GeoIP database
read error — the geo-fence quietly stops fencing. Any allow-list-style control
(country allow-lists, OpenAPI positive security, DLP on a sensitive surface)
should be paired with `fail_close`, because for these an error that allows is
exactly the failure you deployed them to prevent.
:::

## Recommended rollout: detect → shadow → block

Never turn on `block` for a new policy against live traffic. The safe sequence:

### 1. `detect` — establish the baseline and tune

```yaml
policy:
  mode: detect
```

Detect evaluates everything, records each finding as a would-block, and allows
the request — the monitor mode for initial tuning against real traffic. Watch:

- `detections_total` — the would-block rate. If it is a meaningful fraction of
  traffic, you have false positives to hunt down before going further.
- Individual would-block events in [Security Events](/shield/ui/security-events)
  — each carries the engine, rule id, and reason, so you can identify noisy rules
  (for Coraza, collect `exclude_rule_ids` candidates here — see
  [Coraza WAF](/shield/engines/coraza-waf)).

Use this phase to tune thresholds (Coraza paranoia/anomaly levels, bot scores,
`anomaly_threshold`) until the detection stream contains only traffic you
genuinely want to block. Also confirm `fail_open_total`/`timeouts_total` stay at
zero — a nonzero timeout rate means your `timeout` budget is too tight for the
body sizes you inspect
(see [Body Inspection & Limits](/shield/policies/body-inspection)).

### 2. `shadow` — dress-rehearse enforcement

```yaml
policy:
  mode: shadow
```

Shadow evaluates the tuned policy exactly as if it were blocking and logs what
*would* have been blocked (`shadow_detections_total`), still with zero traffic
impact. This is the final verification pass: after tuning in detect, the
shadow stream should contain **only traffic you are willing to reject**. Any
remaining legitimate request showing up in
[Security Events](/shield/ui/security-events) here is a block you just avoided
shipping. Promote when the shadow stream has been clean (or attack-only) for a
representative traffic window — including whatever weekly batch jobs, webhook
retries, and traffic peaks your service sees.

### 3. `block` — enforce

```yaml
policy:
  mode: block
```

Flip to enforcement. `shadow_detections_total` for this policy drops to zero and
`requests_blocked_total` picks up the same traffic. Keep
[Security Events](/shield/ui/security-events) open for the first hours — every
block is always audited, so a false positive shows up immediately with the exact
rule and reason.

## Per-route mode overrides

Because `mode` is a scalar `PolicySpec` field, you can run different postures on
different surfaces of the same domain — enforce where you are confident, monitor
where you are still tuning:

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-rollout
spec:
  defaults:
    mode: block                # enforced everywhere by default
    fail_mode: fail_open

  domains:
    - hosts: ["api.example.com"]
      routes:
        # Mature surface: enforce.
        - match:
            path_prefix: "/v1/"
          policy:
            mode: block

        # New surface still being tuned: monitor only, fail closed on errors.
        - match:
            path_prefix: "/v2/"
          policy:
            mode: detect
            fail_mode: fail_close

        # Not yet onboarded: skip inspection for this route.
        - match:
            path_prefix: "/legacy/"
          policy:
            mode: off
```

:::tip
The Coraza engine always runs in enforcing mode internally (Shield forces
`SecRuleEngine On`); the policy `mode` is the single switch that decides whether
a CRS hit actually blocks. Never try to do monitor-mode via SecLang
`DetectionOnly` — use `mode: detect`. See [Coraza WAF](/shield/engines/coraza-waf).
:::
