---
title: How Shield Works
description: The request pipeline, header vs body phases, the five engine rules, always-on body protections, the source-IP trust model, and atomic hot reload.
sidebar_position: 2
tags: [shield, security]
---

Shield processes every HTTP transaction as an ordered, Envoy-style **security filter chain** — never a monolithic function. Cheap, discriminating checks run first; body and WAF inspection are gated by policy; and a small set of structural protections is always on and cannot be disabled by any policy.

## The request pipeline

One `ext_proc` stream equals one HTTP transaction. At stream start, Shield pins the active config snapshot, so a reload mid-request never tears a decision. The request then flows through a fixed prelude followed by the resolved policy's inspection pipeline:

1. **Context init** — request id, host, path, method, headers, content type; the per-request deadline is set from the policy `timeout`.
2. **Policy resolve** — match the host and route to the most-specific policy (exact host beats `*.example.com` beats `*`; exact path beats regex beats longest prefix). No match falls back to the default posture.
3. **Early decision** — a policy that needs no further inspection concludes here: allow continues, block denies, detect/shadow record and continue.
4. **Fast pre-checks** — method, host validity, forbidden/required headers, per-header size caps, content type, source IP. No body is read.
5. **Body gate** — is a body needed at all? Size caps are enforced *before* buffering; the common path buffers nothing.
6. **Body checks** — JSON validation, sensitive-data detection, DLP.
7. **WAF engines** — the policy's body-phase engines (Coraza, GraphQL, OpenAPI-with-body). Header-phase engines (JWT, API key, rate limit, IP reputation, bot, …) already ran back at the header phase.
8. **Decision** — verdicts aggregate ("most severe wins"), the policy mode maps the verdict to an action, and the answer goes back to Envoy: a deny becomes an immediate `403`; everything else continues.

**Response inspection is a separate pipeline** that reuses the policy pinned by the request: response header checks, body gate, response body checks (e.g. DLP redaction, outbound CRS rules), then the final decision.

## Header phase vs body phase

Every engine declares `RequiresBody()`:

- **Header phase** (`RequiresBody() == false`) — runs in the cheap pre-body stage; the body is **never buffered** for it. This covers jwt, jwks, api_key, ip_reputation, bot, xfcc, and hmac_sign / http_signature / openapi when they are not body-bound.
- **Body phase** (`RequiresBody() == true`) — runs after the body is buffered: coraza, graphql, openapi with body validation, hmac_sign with `require_body_digest`, http_signature when it covers `content-digest`.

A policy whose engines don't need the body **never buffers the body just to run the WAF**. Header-phase and body-phase engines are strictly partitioned, so no engine ever runs twice.

## The five engine rules

Five cross-cutting rules explain most engine behavior:

1. **Header phase vs body phase.** As above — the phase is decided by the engine, and the body is buffered only when some engine or check actually needs it.
2. **Direction.** Authentication, traffic, and bot engines are **request-side only** — they pass responses through untouched. Only Coraza inspects responses (CRS phase 3/4).
3. **A missing or invalid credential always blocks.** Auth engines report a failed or absent credential as a **block verdict, never as an error**. There is no anonymous pass-through — and `fail_open` does **not** let a missing credential through.
4. **The fail posture governs internal errors only.** When an engine returns a genuine error (a Coraza body-processing failure, a GeoIP database read error), the policy's `fail_mode` applies: `fail_open` allows (counted in `fail_open_total`), `fail_close` blocks with a fixed, non-leaking reason. A confirmed block always beats an error — if one engine blocks while another errors, the request blocks.
5. **How multiple engines combine.** Engines run in the policy's order, with the per-request deadline checked before each engine. The set returns the **highest-severity block**, and **positive anomaly scores are summed** across engines (see [Anomaly Scoring](/shield/anomaly-scoring)).

Block status codes: auth, WAF, and positive-security blocks are `403`; rate-limit blocks are `429`; a Coraza rule that forces a status is honored.

## Always-on structural body protections

Three guards are prepended to the body pipeline. They are **structural** — not reorderable, not skippable via `skip_checks`, and impossible for a policy to opt out of. Each turns a body that cannot be fully inspected into a **block**, never a silent allow:

- **Truncation guard.** A body truncated by the per-request size cap or the in-flight budget is blocked (`body.too_large`). This closes the bypass of padding a payload past the cap to hide it from the WAF.
- **Content decode.** Compressed bodies (`gzip`, `deflate`) are decompressed — decompression-bomb-bounded — so inspectors see the real payload, never raw compressed bytes. An undecodable or stacked encoding (`br`, multiple encodings) fails closed (`body.undecodable_encoding`). This closes the gzip-the-attack WAF bypass.
- **In-flight body budget.** A single process-wide cap (`--max-inflight-body-bytes`) bounds the bytes buffered across *all* concurrent streams, so the per-request cap can't be multiplied by concurrency into a memory-exhaustion DoS. An over-budget body is marked truncated and blocked by the truncation guard; rejections are counted in `body_budget_rejections_total{reason}` (`per_request_cap` / `inflight_budget`).

## Source-IP anti-spoofing

Every source-IP control — IP reputation, rate limiting by IP, the bot engine's verified-crawler check — reads one derived client IP, computed once per request.

Shield reads `X-Forwarded-For` **from the right**: `--xff-trusted-hops` entries in from the rightmost address. The default (`0`) takes the rightmost entry — the address Envoy itself appends when `use_remote_address` is set, which a client cannot forge. The **leftmost** XFF token is client-controlled and is **never** used — reading it would let any client forge its source IP and defeat every source-IP control. The derived IP is canonicalized before matching: `ip:port` tolerated, IPv6 zone stripped, IPv4-in-IPv6 unmapped (`::ffff:1.2.3.4` → `1.2.3.4`).

:::warning[Operator gotcha: set the trusted-hop count exactly]
Set `--xff-trusted-hops` to the **exact** number of trusted proxies (load balancer, CDN) in front of Envoy. Too low and you trust a hop the attacker controls; too high and the index clamps toward the spoofable left of the header. And Envoy must run with `use_remote_address` — otherwise there is no trustworthy source IP to key on. See [Envoy Wiring](/shield/envoy-wiring).
:::

## Atomic hot reload

Shield's config arrives as files in a watched directory (`/etc/elchi/elchi-shield/conf.d`, written by elchi-client). The reload path is entirely off the hot path:

```text
fsnotify event → debounce → read all files → parse → merge
  → validate → compile → immutable snapshot → atomic pointer swap
```

The guarantees you can rely on:

- **Invalid config never affects live traffic.** Any parse, merge, validation, or compile failure aborts the reload — the last valid snapshot stays active, `config_reload_failure_total` increments, and the error is logged with the offending **file and field**.
- **Reloads are atomic.** Readers do one lock-free atomic load per stream; the writer swaps in a fully built snapshot. In-flight requests keep the snapshot they started with.
- **Restart-safe.** On boot, Shield loads the last valid config from disk. It also starts safely with *no* config (empty snapshot, default posture) rather than blackholing traffic before the first policy lands.

Watch `active_config_version`, `config_age_seconds`, and `config_reload_failures_consecutive` in [Observability](/shield/observability).

## Where to go next

- [Policy Model](/shield/policies/policy-model) — hosts, routes, inheritance, precedence.
- [Modes & Postures](/shield/policies/modes-and-postures) — `block` / `detect` / `shadow` / `off` and the rollout strategy.
- [Anomaly Scoring](/shield/anomaly-scoring) — the collaborative per-request score.
