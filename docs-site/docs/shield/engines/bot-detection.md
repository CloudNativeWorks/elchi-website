---
title: Bot Detection
description: The layered bot/scanner scorer — verified-crawler checks, User-Agent rules, JA3/JA4 TLS fingerprints, and header-anomaly heuristics.
sidebar_position: 10
tags: [shield, engine]
---

The `bot` engine protects against scanners, scrapers, and crawler impersonators using a **layered scorer**: verified-crawler IP checks, User-Agent rules, JA3/JA4 TLS-fingerprint matching (supplied by Envoy as request headers), and header-anomaly heuristics. It is a **header-phase, request-only** engine — the body is never buffered for it. Any hard-block layer short-circuits immediately; the scoring layers accumulate a per-request score that blocks at a threshold, or feeds the policy-wide [anomaly aggregator](/shield/anomaly-scoring).

## When to use it

- Block security scanners and scripted clients by UA (`sqlmap`, `nikto`, `python-requests`, …).
- Let real Googlebot/Bingbot through while **hard-blocking impersonators** — a UA claiming a crawler from an IP outside that crawler's published ranges.
- Catch clients whose TLS fingerprint contradicts their claimed identity (curl presenting a browser User-Agent).
- Accumulate weak signals (known-bot UA, suspicious JA4, missing standard headers) into a score, standalone or combined with other engines via [anomaly scoring](/shield/anomaly-scoring).

## Configuration

| Field | Type | Default | Purpose |
|---|---|---|---|
| `score_threshold` | int | `0` (disabled) | Block when the accumulated score reaches it. `0` disables score-based blocking (hard-block layers still apply). |
| `emit_score` | bool | `false` | Contribute the bot score to the policy **anomaly** aggregator instead of blocking at `score_threshold`. |
| `user_agent` | `BotUASpec` | — | User-Agent layer. |
| `verified_bots` | `BotVerifiedSpec`[] | — | Verified-crawler IP checks. |
| `tls_fingerprint` | `BotTLSSpec` | — | JA3/JA4 layer. |
| `heuristics` | `BotHeuristicsSpec` | — | Header-anomaly layer. |

### `user_agent` (`BotUASpec`)

| Field | Type | Default | Purpose |
|---|---|---|---|
| `deny_substrings` | string[] | — | UA substrings that hard-block (an empty substring is rejected — it would match all traffic). |
| `block_empty` | bool | `false` | Block a missing/empty User-Agent. |
| `score_known_bot` | int | `0` | Score added for a known-bot UA. `≥ 0`. |

### `verified_bots` (`BotVerifiedSpec`) — each entry

| Field | Type | Required | Allowed |
|---|---|---|---|
| `name` | string | yes | identifier |
| `file` | string | yes | IP feed path |
| `format` | string | yes | `cidr_lines` \| `firehol_netset` \| `spamhaus_json` |
| `ua_match` | string (regex) | yes | UA pattern claiming this bot (must compile) |

### `tls_fingerprint` (`BotTLSSpec`)

| Field | Type | Default | Purpose |
|---|---|---|---|
| `ja4_header` | string | `x-shield-ja4` | Header carrying the JA4 hash. |
| `ja3_header` | string | `x-shield-ja3` | Header carrying the JA3 hash. |
| `deny_ja4` | string[] | — | JA4 hashes that hard-block. |
| `deny_ja3` | string[] | — | JA3 hashes that hard-block. |
| `score_ja4` | map[string]int | — | Per-JA4 score contributions (each `≥ 0`). |
| `tool_ja4` | string[] | — | JA4s flagged as tools (used for JA4↔UA consistency). |

### `heuristics` (`BotHeuristicsSpec`)

| Field | Type | Default | Purpose |
|---|---|---|---|
| `require_accept` | bool | `false` | Anomaly if `Accept` absent. |
| `require_accept_language` | bool | `false` | Anomaly if `Accept-Language` absent. |
| `require_accept_encoding` | bool | `false` | Anomaly if `Accept-Encoding` absent. |
| `score_per_anomaly` | int | `0` | Score added per header anomaly. `≥ 0`. |

Rules: at least one detection layer is required. If any **score** layer is set, either `score_threshold > 0` or `emit_score: true` is required (otherwise the score could never block — a silent no-op). `emit_score` without a score layer is also rejected.

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-bot
spec:
  defaults:
    mode: block
    fail_mode: fail_open

  domains:
    - hosts: ["shop.example.com"]
      routes:
        - match:
            path_prefix: "/"
          policy:
            # Start in detect mode to size the score threshold before enforcing.
            mode: detect
            engines:
              bot:
                score_threshold: 100
                user_agent:
                  deny_substrings:
                    - "sqlmap"
                    - "nikto"
                    - "masscan"
                    - "python-requests"
                    - "Go-http-client"
                  block_empty: true
                  score_known_bot: 40
                verified_bots:
                  # Verified crawlers are allow-listed; impersonators are blocked.
                  - name: googlebot
                    file: "/etc/elchi/elchi-shield/feeds/googlebot.json"
                    format: cidr_lines
                    ua_match: "(?i)googlebot|google-inspectiontool"
                  - name: bingbot
                    file: "/etc/elchi/elchi-shield/feeds/bingbot.json"
                    format: cidr_lines
                    ua_match: "(?i)bingbot"
                tls_fingerprint:
                  ja4_header: "x-shield-ja4"
                  deny_ja4:
                    - "t13d1516h2_8daaf6152771_b186095e22b6"   # example known-bad
                  tool_ja4:
                    # curl/python/Go JA4s: presenting one with a browser UA is a lie.
                    - "t13d1715h2_5b57614c22b0_3d5424432f57"
                  score_ja4:
                    "t13d1516h2_8daaf6152771_b0da82dd1658": 60
                heuristics:
                  require_accept: true
                  require_accept_language: true
                  require_accept_encoding: true
                  score_per_anomaly: 30
```

## How it decides

Layers run cheapest-decisive-first; **any hard-block layer short-circuits, and scoring layers run only if nothing hard-blocked**:

1. **Verified bots:** if the UA matches a configured crawler's `ua_match` regex **and** the source IP is inside that crawler's feed CIDRs ⇒ **immediate ALLOW** (real Googlebot is never collateral-damaged). If the UA *claims* a crawler but the IP matches **none** of its ranges ⇒ hard-block **`bot.impersonation:<name>`**.
2. **User-Agent:** empty UA with `block_empty` ⇒ **`bot.ua_empty`**; a case-insensitive `deny_substrings` match ⇒ **`bot.ua_deny`**.
3. **TLS fingerprint:** JA4 ∈ `deny_ja4` ⇒ block; JA4 ∈ `tool_ja4` **and** the UA claims a mainstream browser ⇒ hard-block **`bot.ja4_ua_mismatch`** (catches curl/python faking a browser UA); JA3 ∈ `deny_ja3` ⇒ block.
4. **Scoring (additive):** `score_known_bot` for a known-bot UA, `score_ja4[fingerprint]`, and `score_per_anomaly` per missing `Accept` / `Accept-Language` / `Accept-Encoding`.

**Score resolution:** standalone (the default), the engine blocks **`bot.score`** when `score ≥ score_threshold` (requires `score_threshold > 0`). With **`emit_score: true`** it instead contributes the score to the policy-wide [anomaly aggregator](/shield/anomaly-scoring) and never blocks on its own — several weak signals across engines can then cross `anomaly_threshold` together. **Hard-block layers always block regardless of `emit_score`.**

## Envoy prerequisites

- **Verified-crawler checks key on the trusted source IP:** run Envoy with `use_remote_address` and set `--xff-trusted-hops` to the exact trusted-proxy count, or an impersonator can spoof its way into a crawler's range. See [Envoy wiring](/shield/envoy-wiring).
- **The JA3/JA4 layer depends entirely on Envoy.** Envoy must compute the TLS fingerprint and forward it in the configured request header (`x-shield-ja4` / `x-shield-ja3` by default) — **and strip any client-supplied copy of those headers**. If Envoy doesn't set the header, all JA-based layers silently no-op; if it doesn't strip client copies, a client can clear or forge the value to dodge `deny_ja4` / `score_ja4`.

## Verify

A normal browser-like request passes:

```bash
curl -i http://shop.example.com/ \
  -H 'User-Agent: Mozilla/5.0' -H 'Accept: text/html' \
  -H 'Accept-Language: en' -H 'Accept-Encoding: gzip'
# HTTP/1.1 200 OK
```

A denied UA is hard-blocked (in `mode: block`):

```bash
curl -i http://shop.example.com/ -A 'sqlmap/1.7'
# HTTP/1.1 403 Forbidden        <- bot.ua_deny
```

A crawler impersonation is hard-blocked (UA claims Googlebot from a non-Google IP):

```bash
curl -i http://shop.example.com/ -A 'Googlebot/2.1'
# HTTP/1.1 403 Forbidden        <- bot.impersonation:googlebot
```

In `mode: detect` these appear in `detections_total` and `findings_total{engine="bot"}` instead.

## Gotchas

:::warning
**JA3/JA4 protection is useless unless Envoy supplies the fingerprint header — and strips client-supplied copies.** Without the Envoy side, the TLS layers silently no-op (no false blocks, but no protection either), and without stripping, the header is attacker-writable.
:::

- **Verified-bot feeds are trusted files** — whoever writes them could whitelist their own IP for an impersonated crawler UA. Treat feed distribution as part of your trust boundary.
- A score layer with neither `score_threshold > 0` nor `emit_score: true` is rejected at load — the score could never act.
- Start in `detect` mode and size `score_threshold` from real traffic before enforcing — see [Modes & Fail Postures](/shield/policies/modes-and-postures).

Related engines: [IP reputation](/shield/engines/ip-reputation), [Rate limiting](/shield/engines/rate-limit).
