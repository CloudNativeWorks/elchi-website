---
title: Wiring Shield into Envoy
description: The ext_proc cluster and filter configuration that connects Envoy to the Shield sidecar, plus the Envoy settings Shield's engines depend on.
sidebar_position: 9
---

Envoy reaches Shield through the `ext_proc` HTTP filter: a bidirectional gRPC stream per HTTP transaction, carried over a local socket. This page shows the Envoy side of that wiring and the listener settings some Shield engines require to receive trustworthy inputs.

## The ext_proc cluster

Shield is a gRPC service, so the cluster must speak **HTTP/2**. The preferred transport is a **Unix domain socket** (local by construction); loopback TCP also works. The address must match Shield's `--extproc-network` / `--extproc-addr` flags.

```yaml
clusters:
  - name: elchi_shield
    type: STATIC
    connect_timeout: 0.25s
    # gRPC requires HTTP/2 to the ext_proc service.
    typed_extension_protocol_options:
      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
        "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
        explicit_http_config:
          http2_protocol_options: {}
    load_assignment:
      cluster_name: elchi_shield
      endpoints:
        - lb_endpoints:
            # Unix domain socket (preferred):
            #   --extproc-network unix --extproc-addr /run/elchi-shield/extproc.sock
            - endpoint:
                address:
                  pipe:
                    path: /run/elchi-shield/extproc.sock
            # Or loopback TCP (--extproc-network tcp --extproc-addr 127.0.0.1:9000):
            # - endpoint:
            #     address:
            #       socket_address: { address: 127.0.0.1, port_value: 9000 }
```

:::tip
When using the UDS, Envoy's user needs filesystem access to the socket. The installer creates `/run/elchi-shield` group-owned by `elchi` and adds Envoy's user to that group — restart Envoy after installation so it picks up the new group. See [Deploying Policies to Edges](/shield/deployment) for the full edge layout.
:::

## The ext_proc filter

The filter goes in the HTTP filter chain **before the router**:

```yaml
http_filters:
  - name: envoy.filters.http.ext_proc
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.ext_proc.v3.ExternalProcessor
      failure_mode_allow: true        # if elchi-shield is unreachable, fail open
      # The FIRST request_attribute becomes shield's `listener` metric label and
      # its project attribution — put your identifier first (the Envoy node id).
      request_attributes: ["xds.node.id"]
      grpc_service:
        envoy_grpc: { cluster_name: elchi_shield }
        timeout: 0.2s
      processing_mode:
        request_header_mode: SEND
        response_header_mode: SKIP    # enable if inspecting responses
        request_body_mode: NONE       # shield upgrades to BUFFERED per policy
        response_body_mode: NONE
  - name: envoy.filters.http.router
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

What each setting does:

- **`failure_mode_allow: true`** — Envoy-level fail-open: if the Shield process is down or the gRPC call fails, traffic continues uninspected instead of erroring. This is the availability backstop *outside* Shield; Shield's own per-policy `fail_open`/`fail_close` posture governs errors *inside* inspection. Set it to `false` only if you accept an outage when the sidecar is down.
- **`request_attributes: ["xds.node.id"]`** — Envoy sends the node id with the request-headers message. Shield uses the **first** attribute as the `listener` label on all per-request metrics, and parses node ids of the form `listener::project::ip` to attribute audit events to a listener and project (this is how the UI scopes the [Overview dashboard](/shield/ui/overview-dashboard) and [Security Events](/shield/ui/security-events) to a project). If no attribute arrives, Shield falls back to its `--listener-id` value.
- **`timeout: 0.2s`** — the per-message gRPC deadline Envoy grants Shield. Keep it aligned with (slightly above) the policies' processing timeouts.
- **`processing_mode`** — send request headers only. Shield **dynamically upgrades** the body mode to `BUFFERED` (via `mode_override`) for exactly the routes whose policy inspects bodies, so there is no body streaming cost on routes that don't need it. Leave `response_header_mode: SKIP` unless some policy inspects responses.

## Required Envoy settings for Shield's inputs

Shield can only be as trustworthy as what Envoy hands it. Three inputs need explicit listener configuration.

### Source IP: `use_remote_address`

Shield derives the client IP from `X-Forwarded-For`, reading from the **right** (`--xff-trusted-hops` hops in from the rightmost entry; default 0 = the address Envoy itself appends). That model only works when Envoy appends the real peer address:

```yaml
# in the HttpConnectionManager config
use_remote_address: true
xff_num_trusted_hops: 0   # raise only for trusted proxies in front of Envoy
```

:::warning No use_remote_address, no trustworthy source IP
Without `use_remote_address: true`, the rightmost XFF entry is whatever the client (or any upstream proxy) chose to send — and every source-IP control in Shield is built on that address: IP-reputation deny/allow lists and GeoIP rules, per-IP rate limiting, and bot verified-crawler checks. Shield deliberately never reads the leftmost XFF token (trivially spoofable), so with a misconfigured Envoy these engines act on an attacker-controlled value. If additional trusted proxies sit in front of Envoy, set Shield's `--xff-trusted-hops` to match.
:::

### mTLS identity: `forward_client_cert_details` (for the XFCC engine)

The [mTLS identity engine](/shield/engines/mtls-xfcc) authenticates by the client certificate **Envoy** validated, forwarded in the `x-forwarded-client-cert` header. Envoy must be told to build that header — and to sanitize any client-supplied copy:

```yaml
# in the HttpConnectionManager config, on the mTLS listener
forward_client_cert_details: SANITIZE_SET
set_current_client_cert_details:
  uri: true       # SPIFFE / URI SANs
  dns: true       # DNS SANs
  subject: true   # certificate subject
  cert: false
```

`SANITIZE_SET` replaces whatever XFCC the client sent with the details of the certificate from Envoy's own TLS handshake, so the engine's SPIFFE/DNS/subject/fingerprint allow-lists match against a verified identity, never a forged header.

### TLS fingerprints: JA3/JA4 headers (for the Bot engine)

The [bot-detection engine](/shield/engines/bot-detection) consumes TLS client fingerprints from the request headers `x-shield-ja4` (and `x-shield-ja3`), which **Envoy supplies** — Shield never sees the TLS handshake itself. Two requirements on the listener:

- The listener needs the **TLS inspector** listener filter (and your fingerprinting mechanism) so a fingerprint is available for the connection, and the fingerprint must be **propagated to Shield** as the `x-shield-ja4` / `x-shield-ja3` request headers.
- Any **client-supplied copies of those headers must be stripped** at the edge (e.g. `request_headers_to_remove` before the value is re-added from the connection). If a client can inject `x-shield-ja4` itself, it can impersonate a "consistent" browser fingerprint and defeat the JA4↔User-Agent consistency check.

If the fingerprint headers are absent, the bot engine simply skips its TLS-fingerprint layer — the UA rules, verified-crawler IP checks, and header heuristics still apply.

## Multiple listeners

Shield can serve several Envoy listeners from one process, each on its **own socket** with isolated metrics: repeat `--extproc-listener id=network:addr` (e.g. `lst-public-443=unix:/run/elchi-shield/lst-public-443.sock`) and point each Envoy listener's ext_proc cluster at its socket. Listeners are an isolation and metrics dimension, not a policy selector — policies match on hosts and routes. See the [CLI & Configuration Reference](/shield/reference).
