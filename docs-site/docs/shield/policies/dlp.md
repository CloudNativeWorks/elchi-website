---
title: Data Loss Prevention (DLP)
description: Block hard secrets and redact PII in request or response bodies — kinds, block vs redact precedence, and how in-place redaction works mechanically.
sidebar_position: 5
tags: [shield, policy]
---

The built-in DLP check (`checks.body.dlp`) scans message bodies for secrets and
PII and takes one of two actions per finding kind: **block** the message
outright, or **redact** the match in place and forward the rewritten body. It is
the only Shield check that *mutates* traffic rather than just deciding on it —
typically used to stop keys and credentials from leaving through API responses,
and to mask PII before it reaches downstream consumers or logs.

DLP is a built-in body check, not an engine — it runs inside the `body_checks`
stage (see [Built-in Checks & Pipeline Order](/shield/policies/checks)). It needs
the body buffered on its direction; you do **not** have to set `inspect_request_body`
/ `inspect_response_body` yourself — shield derives them from `direction` (see
[Body Inspection & Limits](/shield/policies/body-inspection)).

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `direction` | string | `response` | Where DLP runs: `response` \| `request` \| `both`. |
| `block` | string[] | empty | DLP kinds that cause a **block**. |
| `redact` | string[] | empty | DLP kinds **masked in place**. |

At least one of `block` / `redact` is required.

:::warning[DLP defaults to the response direction]
With no `direction` set, DLP only scans **responses**. To scrub or block request
bodies (e.g. stop users pasting credentials into your API), set
`direction: request` or `both`. Shield auto-enables body inspection for whichever
direction you choose — no separate `inspect_*_body` flag needed.
:::

## The ten kinds

| Kind | What it matches | Redaction behavior |
|---|---|---|
| `credit_card` | Payment card numbers (Luhn-validated, IIN 2–6) | Keeps the **last 4 digits** |
| `ssn` | US Social Security numbers (dash- or space-separated) | `[REDACTED:ssn]` |
| `email` | Email addresses | `[REDACTED:email]` |
| `jwt` | JSON Web Tokens | `[REDACTED:jwt]` |
| `aws_access_key` | AWS access key IDs | `[REDACTED:aws_access_key]` |
| `private_key` | PEM private keys — RSA/EC/OpenSSH/DSA, **ENCRYPTED (PKCS#8), and PGP** blocks | `[REDACTED:private_key]` |
| `google_api_key` | Google API keys | `[REDACTED:google_api_key]` |
| `slack_token` | Slack tokens | `[REDACTED:slack_token]` |
| `github_token` | GitHub tokens — classic (`ghp_`/`gho_`/…) **and fine-grained (`github_pat_`)** | `[REDACTED:github_token]` |
| `stripe_key` | Stripe secret/restricted keys (`sk_live_…`, `rk_…`) | `[REDACTED:stripe_key]` |

:::note
The Luhn check requires a valid leading card-issuer digit (2–6), so benign
16-digit identifiers (all-zeros, sequential IDs) are not flagged as cards. All
ten kinds are usable in both a DLP `block`/`redact` list and the simpler
`checks.body.detect_sensitive_data` hook (which blocks on the first hit).
:::

## Block vs redact: precedence

DLP finds **all** matches in the body, then applies:

1. **Block wins.** Any match whose kind is in `block` blocks the message
   (finding `body.dlp_block:<kind>`) **before any redaction happens** — a hard
   secret fails closed; no partially-scrubbed body ever leaves.
2. **Redact.** If nothing blocked, every match whose kind is in `redact` is
   masked in place and the rewritten body is forwarded.

The recommended split: things whose presence is an *incident* (keys, private
keys, tokens) → `block`; things that are legitimate data you must not expose in
full (cards, SSNs, emails) → `redact`.

Both lists follow the policy `mode` (see [Modes & Fail Postures](/shield/policies/modes-and-postures)):

- In `block` mode a `block` match blocks and a `redact` match rewrites the body.
- In `detect`/`shadow` **nothing is modified** — a `block` match is recorded as a
  would-block and a `redact` match is recorded as a would-redaction (rule
  `body.dlp_redact_would`, counted under `detections_total`/`shadow_detections_total`),
  and the **original body is forwarded unchanged**. This keeps detect/shadow a true
  observe-only dry run: staging a DLP policy never silently mutates live traffic.
- `mode: off` skips inspection entirely.

## How redaction works mechanically

Redaction rewrites the buffered body and sends the modified bytes back to Envoy
through the ext_proc **body-mutation channel**:

- Shield returns a `BodyMutation` carrying the redacted body.
- The `Content-Encoding` header is **stripped** — the body Shield inspected was
  already decompressed by the structural decode stage, so the mutated body is
  plaintext and must not be advertised as gzip.
- Envoy **recomputes `Content-Length`** for the new body size; Shield does not
  set it.
- Each mutated message is counted in the `body_mutations_total` metric — watch
  it on the [Overview dashboard](/shield/ui/overview-dashboard) to confirm a new
  redact policy is actually rewriting traffic.

Because a body-redacting policy must return its mutation on the body message,
Shield inspects the buffered body there even when trailers follow — a
`BodyMutation` cannot ride the trailers message. You get this behavior
automatically; it is called out only to explain why redacting policies behave
slightly differently from detect-only body policies in traces.

:::warning[Redaction changes the bytes downstream sees]
Anything that verifies the body downstream of Shield — body digests, HMAC
signatures, checksums — will see the redacted bytes, not the originals. If a
route combines DLP redaction with [HMAC signing](/shield/engines/hmac-signing)
(`require_body_digest`) or [HTTP signatures](/shield/engines/http-signature) on
the same direction, mind the pipeline-stage order (see
[Built-in Checks & Pipeline Order](/shield/policies/checks)).
:::

## Prerequisites checklist

- `inspect_response_body: true` + `max_response_body_bytes > 0` for
  `direction: response`; the request pair for `direction: request`; both for
  `both`. A DLP policy without body inspection on its direction inspects
  nothing.
- The size cap must cover your real payloads — an over-limit body is **blocked**
  by the structural truncation guard, not passed unscanned
  (see [Body Inspection & Limits](/shield/policies/body-inspection)).
- Findings carry the `dlp` engine label in `findings_total{engine="dlp"}` and in
  [Security Events](/shield/ui/security-events), so DLP activity is separable
  from WAF/engine findings.

## Example: block secrets on requests, redact PII on responses

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-dlp
spec:
  defaults:
    mode: block
    fail_mode: fail_close        # a DLP error must not silently leak data

  domains:
    - hosts: ["dlp.example.com"]
      routes:
        - match:
            path_prefix: "/"
          policy:
            mode: block
            inspect_request_body: true
            max_request_body_bytes: 1048576
            inspect_response_body: true
            max_response_body_bytes: 1048576
            checks:
              body:
                dlp:
                  direction: both
                  # Hard secrets: a leak is an incident → block the message.
                  block: [private_key, aws_access_key, google_api_key, slack_token, github_token]
                  # PII: mask in place so the response stays usable.
                  #   credit_card keeps the last 4; others become [REDACTED:<kind>].
                  redact: [credit_card, ssn, email, jwt]
```

If you only need the classic "scrub outbound PII" posture, scope it tighter:
`direction: response`, `inspect_response_body: true`, and no request-side
buffering — DLP adds latency and memory only where it runs, so keep it on the
routes that return sensitive data (see the sizing guidance in
[Body Inspection & Limits](/shield/policies/body-inspection)).

:::tip[Rollout]
Roll a `block` list out via `mode: detect` → `shadow` → `block` and watch
[Security Events](/shield/ui/security-events) for false positives (the `email`
kind in particular can match legitimate payload fields). A `redact` list rides
the same ramp — in `detect`/`shadow` each match is only recorded as a
would-redaction and the body is untouched; redaction actually rewrites the body
in `block` mode, which is when `body_mutations_total` starts moving. See
[Modes & Fail Postures](/shield/policies/modes-and-postures).
:::
