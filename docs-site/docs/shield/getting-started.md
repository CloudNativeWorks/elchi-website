---
title: Get Started with Shield
description: Write, deploy, and verify your first Shield policy in about 10 minutes — starting safely in detect mode.
sidebar_position: 3
tags: [shield, security]
---

This walkthrough takes you from zero to a working Shield policy in about 10 minutes: write a minimal policy, deploy it, watch it flag a bad request without blocking anything, and learn the rollout path to enforcement.

## Prerequisites

- **Shield running as a sidecar** next to Envoy on the edge host — see [Deployment](/shield/deployment).
- **Envoy wired to Shield** via the `ext_proc` HTTP filter, with `use_remote_address` set on the HTTP connection manager — see [Envoy Wiring](/shield/envoy-wiring).

## Step 1 — Write a minimal policy

Shield policies are Kubernetes-style `SecurityPolicy` documents. Start from the shape of the bundled `api-public.yaml` example, trimmed to a catch-all host in **detect mode** with a couple of header checks — it evaluates every request but never blocks:

```yaml title="first-policy.yaml"
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: first-policy
spec:
  defaults:
    mode: detect           # evaluate + record, but always allow
    fail_mode: fail_open
    timeout: 50ms

  domains:
    - hosts: ["*"]         # catch-all: applies to any host this edge serves
      routes:
        - match: {}        # domain default route: every request
          policy:
            checks:
              headers:
                required: ["X-Request-Id"]
                forbidden: ["X-Debug"]
```

Two things to notice:

- `hosts: ["*"]` is the lowest-precedence catch-all — later you'll scope policies to exact hosts (`api.example.com`) or wildcards (`*.example.com`), which always win over `*`.
- `mode: detect` means a failed check produces a **finding** (metric + audit event) while the request is still allowed. Always start here.

## Step 2 — Deploy it

Either author the same policy in the Elchi UI — see [Policy Editor](/shield/ui/policy-editor) — or drop the file straight into Shield's watched config directory on the edge host:

```bash
sudo cp first-policy.yaml /etc/elchi/elchi-shield/conf.d/
```

Shield watches the directory and hot-reloads: the file is parsed, merged with any other policy files, validated, compiled, and atomically swapped in. If the file is invalid, the previous config stays active and the error is logged with the file and field — traffic is never affected by a bad policy.

## Step 3 — Verify with curl

Send a clean request through Envoy, then one that trips the checks:

```bash
# Clean: carries the required header, no forbidden header — passes untouched
curl -i "http://<edge-host>/api/users" -H "X-Request-Id: demo-1"

# Flagged: missing X-Request-Id AND carrying the forbidden X-Debug header
curl -i "http://<edge-host>/api/users" -H "X-Debug: 1"
```

Both requests return the upstream's normal response — the policy is in `detect` mode, so nothing blocks. But the second one is recorded as a would-block finding.

## Step 4 — Read the result

- **Security Events** — open the [Security Events](/shield/ui/security-events) feed in the UI: the flagged request appears with **action = detect**, the rule that fired, and the host/path.
- **Metrics** — on the edge host, Shield's loopback metrics endpoint shows the counters moving:

```bash
curl -s http://127.0.0.1:9001/metrics | grep -E 'detections_total|requests_total'
```

`detections_total` counts detect-mode would-blocks; `requests_total` / `requests_allowed_total` confirm traffic is flowing through Shield. See [Observability](/shield/observability) for the full metric set and the per-request decision log.

## Step 5 — Roll out to enforcement

The recommended path from monitoring to blocking:

1. **`mode: detect`** — evaluate and record, allow everything. Watch the event stream until it is quiet on legitimate traffic; tune your checks and route matches.
2. **`mode: shadow`** — evaluate *as if blocking* and record exactly what would be blocked, still allowing everything. This is your dress rehearsal for enforcement.
3. **`mode: block`** — enforce. A failed check now gets an immediate `403` at the edge, before the request reaches your backend.

See [Modes & Postures](/shield/policies/modes-and-postures) for the full semantics, including the `fail_open` / `fail_close` postures.

:::tip[Shortcut: import a policy from API Discovery]
If the platform has already been observing this API's traffic, you don't have to write the policy by hand — Elchi can suggest a Shield policy from the discovered endpoint inventory. See [Suggest Policy](/api-discovery/suggest-policy).
:::

## Where to go next

- [Policy Model](/shield/policies/policy-model) — hosts, routes, inheritance, and precedence, so you can scope beyond the catch-all.
- [How Shield Works](/shield/how-it-works) — what actually happens to each request.
- [Shield: API Security Overview](/shield/overview) — the full engine catalog (auth, rate limiting, bot detection, WAF, DLP) to grow this policy into.
