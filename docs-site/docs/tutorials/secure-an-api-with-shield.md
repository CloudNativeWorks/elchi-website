---
title: "Tutorial: Secure an API with Shield"
description: The full end-to-end journey — observe an API with Discovery, review its risk, suggest a Shield policy, roll it out from detect to block, and verify enforcement with curl.
sidebar_position: 1
tags: [tutorial]
---

This is the flagship walkthrough for the Elchi platform: you will take a real API from *"we're not sure what it exposes"* to *"it's protected at the edge"* — using both halves of the platform together. [API Discovery](/api-discovery/overview) tells you **what you have and where the risk is**; [Shield](/shield/overview) **enforces** protections inline. The [suggest-policy bridge](/api-discovery/suggest-policy) connects them, so you protect an endpoint *from its own observed traffic* instead of authoring engines by hand.

## What you'll build

An enforced Shield `SecurityPolicy` for one API — drafted from its discovered inventory, rolled out safely through `detect → shadow → block`, and verified so that a clean request passes while an attack is first flagged, then blocked.

## Prerequisites

- The Elchi platform running (control plane + collector), and at least one edge node with Envoy + the [elchi-client](/installation/client/installation) agent connected. If you're starting from nothing, do [From Install to First Listener](/tutorials/zero-to-envoy) first.
- **Shield running as a sidecar** next to Envoy on that edge, wired via `ext_proc` — see [Deployment](/shield/deployment) and [Envoy Wiring](/shield/envoy-wiring).
- **API Discovery enabled** on the listener (an ALS v3 gRPC access-log sink pointed at the collector) — see the [API Discovery overview](/api-discovery/overview#how-to-enable-it).
- Admin or Owner role — the Shield editor and Security Events feed are gated to those roles.

## Step 1 — Observe the API with Discovery

Discovery is passive and metadata-only — it never touches bodies or forwards a byte off-box, so turning it on is safe. Once the ALS sink is wired, just let traffic flow. Within a couple of flush intervals the listener appears at **`/api-discovery`**.

Give it a representative window. The inventory is only as complete as the traffic it has seen, so wait through a normal cycle — including daily batch jobs, webhook retries, and admin flows — before treating the catalog as done.

:::tip Confirmed vs attack surface
Discovery splits every request into **confirmed** (matched a real Envoy route — your actual API) and **attack surface** (matched no route: `/.env`, `wp-login.php`, scanner noise). You build policies from the **confirmed** catalog. See [confirmed vs attack surface](/api-discovery/overview#confirmed-vs-attack-surface--route-match-ground-truth).
:::

## Step 2 — Review the risk in the inventory

Open the listener from the [Listeners dashboard](/api-discovery/dashboards) to reach its [endpoints view](/api-discovery/endpoints). Switch the **Catalog** toggle to **Confirmed** and the **View** toggle to **Group by path**.

Now read the two-axis [risk score](/api-discovery/risk-scoring) on each endpoint. This is the model's core idea: **Threat** (is it being attacked *right now*?) and **Exposure** (how open is it *standing still*?) are separate columns, not one number. Prioritize with the 2×2:

- **High Threat + High Exposure** — open *and* under attack. Protect first.
- **High Exposure, Low Threat** — "boring but open." A standing weakness (unauthenticated, missing headers) an attacker hasn't found yet.

Use the focused dashboards to build your shortlist: **Auth Coverage** (what's reachable without credentials), **PII** (what carries personal data), and **New APIs** (what appeared recently). Pick the highest-exposure, highest-risk path group to protect first.

## Step 3 — Suggest a Shield policy from the endpoints

Back in the endpoints view, select one or more **path groups** and click **Suggest Shield Policy**. Discovery drafts a `SecurityPolicy` derived from what it actually observed — [Suggest Policy](/api-discovery/suggest-policy) covers exactly what it proposes:

- **Routes** — one per selected operation, matched on the normalized path and method.
- **Authentication** — an auth engine where operations carry (or should carry) credentials; `unauthenticated`/`auth_inconsistent` endpoints are called out.
- **Data protection** — a [DLP](/shield/policies/dlp) redact suggestion for operations that returned PII.
- **Rate limiting / bot / WAF** — proposed against operations whose risk flags warrant them.

Each suggestion carries a **rationale** — the risk flag that prompted it.

:::warning The draft is a starting point, not a finished policy
The suggestion opens in the [policy editor](/shield/ui/policy-editor) as **unsaved** work — it is not persisted server-side. Review every route and engine before deploying. Positive-security suggestions (an [OpenAPI](/shield/engines/openapi-validation) allow-list, IP allow-lists) especially need review — they block everything *not* explicitly permitted.
:::

## Step 4 — Review the draft in the editor

The draft lands in the [Policy Editor](/shield/ui/policy-editor). Work the four tabs:

- **Builder** — each engine is a card; the rationale panel above it explains why it was suggested. Drop anything that doesn't fit.
- **YAML** — the same policy as a document. A trimmed draft often looks like this:

```yaml title="api-users.yaml"
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-users
spec:
  defaults:
    mode: detect            # start safe — evaluate + record, never block
    fail_mode: fail_open
    timeout: 50ms

  domains:
    - hosts: ["api.example.com"]
      routes:
        - match:
            path_prefix: "/v1/users/"
          policy:
            engines:
              jwt:
                issuer: "https://auth.example.com/"
                audience: "users-api"
                algorithms: ["RS256"]
                public_key_file: "/etc/elchi/elchi-shield/keys/jwt-pub.pem"
              rate_limit:
                requests_per_second: 100
                burst: 200
                key: ip
              coraza:
                include_owasp: true
```

- **Test** — a dry-run resolver. Enter a sample request and confirm the right domain, route, mode, and ordered engine list — the fastest way to prove the policy does what you intend *before* shipping.

Note the whole policy is in **`mode: detect`**. Keep it there for the first deploy.

## Step 5 — Deploy in detect mode and watch

Click **Create & Deploy**. Saving *is* deploying — a `SHIELD_DEPLOY` job pushes the merged bundle to every connected edge, [elchi-client lands it atomically](/shield/deployment), and Shield hot-reloads. The toast links to per-client results (applied version + reload confirmation).

Now generate traffic and open [Security Events](/shield/ui/security-events) (**Shield → Security Events**). Set **Findings only** and watch the feed. In `detect` mode the pipeline records the **full detection trail** — every would-block finding, with its engine, rule id, and reason — while allowing every request.

Verify with curl through the edge:

```bash
# Clean request — passes untouched, appears only in the sampled allow stream
curl -i "https://api.example.com/v1/users/42" \
  -H "Authorization: Bearer <valid-jwt>"

# SQL-injection probe — allowed (detect mode) but recorded as a would-block
curl -i "https://api.example.com/v1/users/search?q=1%27%20UNION%20SELECT%20password%20FROM%20users--"
```

The second request still returns the upstream's response, but shows up in Security Events with **action = detect**, engine `coraza`, and the CRS rule that fired. On the edge, the counters move too:

```bash
curl -s http://127.0.0.1:9001/metrics | grep -E 'detections_total|requests_total'
```

## Step 6 — Tune

Detect mode is for tuning against real traffic. Aim for a detection stream that contains **only traffic you genuinely want to block**:

- If `detections_total` is a meaningful fraction of traffic, hunt the false positives. For Coraza, collect noisy rule ids from Security Events into `exclude_rule_ids`, and keep the paranoia level modest — see [Coraza WAF](/shield/engines/coraza-waf).
- Confirm `fail_open_total` and `timeouts_total` stay at zero. A nonzero timeout rate means your `timeout` budget is too tight for the body sizes you inspect.

## Step 7 — Promote to shadow, then block

Follow the [detect → shadow → block rollout](/shield/policies/modes-and-postures). Never flip a new policy straight to `block` against live traffic.

**Shadow** is your dress rehearsal — evaluate exactly as if blocking, log what *would* be blocked (`shadow_detections_total`), still allow everything. Promote when the shadow stream has been clean (or attack-only) for a representative window:

```yaml
spec:
  defaults:
    mode: shadow
```

**Block** enforces. A finding now returns an immediate `403` at the edge, before the request reaches your backend:

```yaml
spec:
  defaults:
    mode: block
```

Re-run the curl checks. The clean request still returns `200`; the injection probe now returns `403 Forbidden`:

```bash
curl -i "https://api.example.com/v1/users/search?q=1%27%20UNION%20SELECT%20password%20FROM%20users--"
# HTTP/1.1 403 Forbidden
```

Keep Security Events open for the first hours of enforcement — every block is always audited, so a false positive surfaces immediately with the exact rule and reason.

:::tip Enforce per-surface
`mode` is a per-scope field, so you can `block` on a mature `/v1/` prefix while a new `/v2/` prefix stays in `detect` — same policy. See [per-route mode overrides](/shield/policies/modes-and-postures#per-route-mode-overrides).
:::

## Next steps

- [Export an OpenAPI contract](/api-discovery/openapi-export) from the confirmed catalog and enforce it with Shield's [OpenAPI validation](/shield/engines/openapi-validation) engine for positive security.
- [WAF and Shield Together](/tutorials/waf-plus-shield) — layer the edge WASM WAF under Shield's API-specific engines.
- [Modes & Fail Postures](/shield/policies/modes-and-postures) — the full semantics behind `fail_open` vs `fail_close`.
