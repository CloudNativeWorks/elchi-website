---
slug: owasp-crs-waf-envoy-ext-proc
title: "Adding the OWASP Core Rule Set to Envoy with ext_proc"
description: "Run the OWASP CRS as an Envoy ext_proc sidecar: UDS wiring, per-route body buffering, the HTTP-method trap, and a detect, shadow, block rollout."
authors: [cnw]
tags: [envoy, waf]
date: 2026-11-12
---

Envoy does not ship a request-inspecting WAF. If you want the OWASP Core Rule Set (CRS) in front of your APIs, you have to bring an engine and connect it to Envoy. Envoy's **external processing** filter (`ext_proc`) is a clean way to do that: the WAF runs as a separate process with its own release cycle, and Envoy stays a standard build.

This post walks through the Envoy side of the wiring, the design choices that make ext_proc workable for a WAF, and the rollout sequence that keeps the CRS from blocking legitimate traffic on day one. The examples use Shield, Elchi's ext_proc sidecar, but the Envoy configuration works for any ext_proc service.

<!-- truncate -->

## How ext_proc works

`envoy.filters.http.ext_proc` opens a **bidirectional gRPC stream per HTTP transaction** to an external service. Envoy sends messages for request headers, request body, response headers and response body, as selected by the filter's `processing_mode`. The service answers each message: continue, mutate, or return an immediate response (a `403`, for a WAF).

Three properties matter for a WAF:

- **Body handling is configurable per phase**, and when the filter sets `allow_mode_override`, the external service can change it per request with `mode_override`. You don't have to buffer every body because some routes need inspection.
- **Failure behavior is explicit.** `failure_mode_allow` decides what happens when the service cannot be reached.
- **The transport can be a Unix domain socket**, which keeps the hop on the host.

## The Envoy side

The external service is a gRPC server, so its cluster must use HTTP/2. A Unix domain socket is the preferred transport:

```yaml
clusters:
  - name: elchi_shield
    type: STATIC
    connect_timeout: 0.25s
    typed_extension_protocol_options:
      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
        "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
        explicit_http_config:
          http2_protocol_options: {}
    load_assignment:
      cluster_name: elchi_shield
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  pipe:
                    path: /run/elchi-shield/extproc.sock
```

The filter goes in the HTTP filter chain **before the router**:

```yaml
http_filters:
  - name: envoy.filters.http.ext_proc
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_proc.v3.ExternalProcessor
      failure_mode_allow: true
      allow_mode_override: true
      request_attributes: ["xds.node.id"]
      grpc_service:
        envoy_grpc: { cluster_name: elchi_shield }
        timeout: 0.2s
      processing_mode:
        request_header_mode: SEND
        response_header_mode: SKIP
        request_body_mode: NONE
        response_body_mode: NONE
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

Three lines deserve attention.

`request_body_mode: NONE` looks wrong for a WAF that needs bodies. It is deliberate. Envoy sends **headers only** by default, and Shield upgrades the body mode to `BUFFERED` through `mode_override` only for the routes whose policy inspects bodies. Routes that need no body inspection never pay for buffering.

`allow_mode_override: true` is what lets Envoy accept that per-request upgrade. Without it, Envoy ignores `mode_override` and the processor never sees a body.

`failure_mode_allow: true` is the availability backstop *outside* the WAF. If the sidecar process is down or the gRPC call fails, traffic continues uninspected instead of failing. Set it to `false` only if you accept an outage when the sidecar is down. This is a separate decision from how the WAF treats its *own* internal errors, covered below.

One more listener setting is not optional: the WAF needs a client IP it can trust.

```yaml
# HttpConnectionManager
use_remote_address: true
xff_num_trusted_hops: 0
```

Shield reads the client IP from the right-hand end of `X-Forwarded-For`. Without `use_remote_address`, that entry is whatever the client sent, and every IP-based rule (reputation lists, GeoIP, per-IP rate limits) acts on an attacker-controlled value. Full reference: [Wiring Shield into Envoy](/shield/envoy-wiring).

## Running the CRS inside the processor

Shield embeds **Coraza** (the OWASP Go WAF library, which runs SecLang rules) with the **CRS compiled into the binary**. There are no rule files to ship to the edge. A policy turns it on per host and route:

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-coraza
spec:
  defaults:
    mode: block
    fail_mode: fail_open
    inspect_request_body: true
    max_request_body_bytes: 1048576
  domains:
    - hosts: ["app.example.com"]
      routes:
        - match:
            path_prefix: "/api/"
          policy:
            mode: detect
            engines:
              coraza:
                include_owasp: true
```

The CRS uses **anomaly scoring**: each matching rule adds to a per-transaction score, and the blocking rule fires when the score crosses a threshold. Shield exposes the CRS's usual controls as policy fields: `paranoia_level` (1 to 4, default 1), `detection_paranoia_level` (run stricter rules in detection only), `inbound_anomaly_threshold` (default 5) and `outbound_anomaly_threshold` (default 4), plus `exclude_rule_ids` for tuning out noisy rules by ID.

The directive bundle is assembled in a fixed order: the recommended Coraza config, `SecRuleEngine On`, the CRS setup, your tuning, the CRS rules, your own SecLang `directives`, and finally the rule exclusions. The WAF is compiled once and swapped in atomically, so a config reload never races a request that is being inspected.

One trap catches almost everyone who puts the CRS in front of an API. On its own, the CRS allows only `GET HEAD POST OPTIONS`. Rule 911100 is critical (+5), which is enough to block at the default threshold, so every `PUT`, `PATCH` and `DELETE` would get a 403. Shield always writes an explicit method list into the CRS settings for that reason, defaulting to `GET HEAD POST OPTIONS PUT PATCH DELETE`. If you wire the CRS up yourself, set `tx.allowed_methods` before your first deploy.

Engine reference: [Coraza WAF (OWASP CRS)](/shield/engines/coraza-waf).

## Header phase vs body phase

The CRS is a **body-phase** engine. Shield runs each request as an ordered pipeline: policy resolution, cheap pre-checks (method, host, headers, content type, source IP) and header-phase engines such as JWT or rate limiting, and only then, if the policy needs it, the body gate and the body-phase engines. A policy whose engines don't need the body never buffers it just to run the WAF. Response inspection is a separate pipeline that reuses the request's policy, and it is where the CRS's outbound rules run. See [How Shield Works](/shield/how-it-works).

## Rolling out without breaking traffic

The CRS will produce false positives on real APIs, so plan the rollout around that. Shield policies have four modes:

| Mode | Effect |
|---|---|
| `detect` | Evaluate everything, record would-blocks, allow the request |
| `shadow` | Evaluate as if blocking, log what would have been blocked, allow |
| `block` | A finding returns an immediate 403 |
| `off` | Skip inspection |

`detect` and `shadow` never modify traffic, and they record the **full trail** of findings rather than stopping at the first, which is what you need for tuning. The recommended sequence is **detect, then shadow, then block**, per route if needed: establish a baseline, exclude the rule IDs that fire on legitimate traffic, rehearse enforcement, then enforce.

Keep the two failure settings apart:

- `fail_mode: fail_open | fail_close` (policy) governs **engine errors and timeouts inside the WAF**. It never lets a confirmed finding through.
- `failure_mode_allow` (Envoy) governs **the sidecar being unreachable**.

Details: [Modes & Fail Postures](/shield/policies/modes-and-postures).

## Getting policies to every edge

A WAF on one host is a demo. On a fleet, the question is how policy changes reach every sidecar safely. Shield's answer is that its configuration is **files in a watched directory**. It hot-reloads on change, without a restart, and an invalid config never replaces the last good one.

In Elchi, the controller merges a project's policies into one bundle and the edge agent applies it in phases: it stages each file, validates the staged set with the local `elchi-shield validate` binary (the same version that will run it), and only then renames the files into place. The agent then confirms that Shield's active config version changed. If Shield rejected the config, the deploy reports Shield's file-and-field error instead of a false success. See [Deploying Policies to Edges](/shield/deployment).

The client installer puts Shield on each edge by default, next to Envoy: [The Bundled Shield Sidecar](/installation/client/shield-sidecar).

## Verifying it

With the policy in `detect`, a SQL-injection probe still gets the upstream's response and shows up in Security Events as a would-block, with the CRS rule that fired. Move the route to `block`, repeat the request, and it returns `403 Forbidden`, while a clean request still gets `200`. The end-to-end walkthrough, including discovering the API first and drafting the policy from its observed traffic, is in [Secure an API with Shield](/tutorials/secure-an-api-with-shield).

## Takeaways

- ext_proc gives you a WAF without a custom Envoy build. Use a Unix domain socket, send headers only, and let the processor upgrade the body mode per route (`allow_mode_override`).
- Make the client IP trustworthy (`use_remote_address`) before any IP-based rule means anything.
- Allow your API's methods in the CRS before the first deploy.
- Roll out detect, shadow, block, and keep sidecar-down behavior separate from engine-error behavior.
- Treat WAF config as files that are validated before they go live, on every edge.

## Next steps

- Follow the how-to: [Add a WAF (OWASP Core Rule Set) to Envoy with ext_proc](/guides/add-waf-to-envoy-ext-proc).
- Read the Shield docs: [Shield overview](/shield/overview).
- Product overview: [Elchi API Security](https://www.elchi.io/products/api-security.html).
- Want to see it against your own APIs? [Book a demo](https://www.elchi.io/contact.html).
