---
title: Anomaly Scoring
description: Combine weak signals from multiple engines into one collaborative per-request score and block only when the total crosses a policy threshold.
sidebar_position: 6
tags: [shield, security]
---

Instead of every engine blocking on its own threshold, Shield lets scoring engines feed a **collaborative per-request anomaly score** — the same model the OWASP Core Rule Set uses. No single weak signal blocks alone, but several together cross the line. This catches "low-and-slow" clients that no individual check would stop, while avoiding false positives from one borderline signal.

## How the score works

- A scoring engine returns a **non-blocking verdict carrying a positive `Score`** instead of a block.
- The engine set **sums only positive scores** across the engines in the policy. A negative score is **clamped to zero** — a buggy or misconfigured engine can never *subtract* from the total and mask an attack below the threshold.
- The score accumulates across both the header phase and the body phase of the request.
- When the policy sets `anomaly_threshold > 0` and the running total reaches it, Shield emits a **synthetic block**: reason `anomaly.threshold`, engine `anomaly`, status `403`.
- `anomaly_threshold: 0` (the default) disables anomaly blocking entirely.

The synthetic block is subject to the policy `mode` like any other finding: in `detect` or `shadow` it is recorded and the request is allowed — which is exactly how you tune the threshold before enforcing.

## Which engines feed the score

| Engine | How it contributes |
|---|---|
| [Bot Detection](/shield/engines/bot-detection) with `emit_score: true` | Contributes its accumulated bot score (known-bot UA, per-JA4 scores, header-anomaly points) to the policy aggregator instead of blocking on its own `score_threshold`. Hard-block layers (UA deny, bot impersonation, JA4 deny) still block immediately, independent of the score. |
| [Coraza WAF](/shield/engines/coraza-waf) | **Does not feed the policy score.** The CRS runs its own internal anomaly scoring (`inbound_anomaly_threshold` / `outbound_anomaly_threshold`) and turns a crossed CRS threshold into a regular block verdict itself. |

:::note[Two scoreboards, deliberately separate]
Coraza's CRS score and Shield's policy-level `anomaly_threshold` are independent mechanisms. Tune the CRS thresholds inside the `coraza` engine block; tune `anomaly_threshold` for the engines (like bot) that opt in with an emit-score switch.
:::

## Worked example

The bundled `api-anomaly.yaml` example scores bot signals instead of hard-blocking on any one of them:

```yaml title="api-anomaly.yaml"
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-anomaly
spec:
  defaults:
    mode: block
    fail_mode: fail_open

  domains:
    - hosts: ["scored.example.com"]
      routes:
        - match:
            path_prefix: "/"
          policy:
            mode: block
            # Block when the accumulated score reaches 70. Start in detect mode to
            # tune the threshold against real traffic before enforcing.
            anomaly_threshold: 70
            engines:
              bot:
                emit_score: true          # contribute to the score instead of self-blocking
                user_agent:
                  score_known_bot: 30
                  deny_substrings: ["sqlmap", "nikto"]   # still a hard block
                heuristics:
                  require_accept: true
                  require_accept_language: true
                  require_accept_encoding: true
                  score_per_anomaly: 25
```

Reading the math: a client with a known-bot User-Agent scores **30** — below the threshold of 70, allowed. A client missing all three of `Accept` / `Accept-Language` / `Accept-Encoding` scores **75** (3 × 25) — over the threshold, blocked with `anomaly.threshold`. A known-bot UA *plus* one missing header scores **55** — still allowed. Meanwhile a `sqlmap` User-Agent hard-blocks immediately (`deny_substrings`), regardless of any score.

## Tuning the threshold

:::tip[Start high, lower gradually — in detect mode]
Set `mode: detect` with a deliberately **high** `anomaly_threshold`, run against real traffic, and watch the recorded `anomaly.threshold` findings in Security Events. Lower the threshold (or raise per-signal scores) step by step until the findings match traffic you actually want stopped — then switch the policy to `block`.
:::

Practical guidance:

- **Size each signal relative to the threshold.** In the example, one weak signal (30) can never block alone, two anomalies (50) still pass, but three (75) cross — decide how many co-occurring signals should mean "block" and set the numbers accordingly.
- **Keep hard blocks for hard evidence.** Signals that are conclusive on their own (a `sqlmap` UA, a denied JA4 fingerprint, crawler impersonation) belong in the bot engine's hard-block layers, not the score — they fire regardless of `emit_score`.
- **Remember the mode gate.** In `detect`/`shadow`, a crossed threshold records a finding but allows the request — the aggregate score model only enforces once the policy is in `block`.
