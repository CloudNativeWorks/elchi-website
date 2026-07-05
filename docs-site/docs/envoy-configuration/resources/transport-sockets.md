---
title: Transport Sockets
description: How Elchi models Envoy transport sockets — downstream vs upstream TLS/mTLS on listeners and clusters, plus QUIC and Proxy Protocol.
sidebar_position: 7
tags: [envoy, resources]
---

A **transport socket** is the layer Envoy wraps a connection in — most importantly **TLS**. It decides whether bytes on a connection are plaintext, TLS-encrypted, QUIC, or Proxy-Protocol-wrapped, and it carries the certificate/validation config that makes TLS and mTLS work. Transport sockets attach in two places, and the direction matters:

- **Downstream** — on a [Listener](/envoy-configuration/resources/listeners) filter chain, terminating TLS from clients (`DownstreamTlsContext`).
- **Upstream** — on a [Cluster](/envoy-configuration/resources/clusters), securing Envoy's connection to the backend (`UpstreamTlsContext`).

The actual key material lives in [Secrets](/envoy-configuration/resources/secrets); the transport socket references those secrets and adds the TLS parameters (versions, ciphers, ALPN, SNI, peer verification).

## In Elchi

Transport sockets live under **Resources → Transport Socket** (`/resource/transport-socket`). Create one with **Add New**, choosing an Envoy version first. Elchi models several transport types and renders the matching form by type URL:

| Type | Direction | Envoy type URL |
| --- | --- | --- |
| Downstream TLS Context | downstream | `...tls.v3.DownstreamTlsContext` |
| Upstream TLS Context | upstream | `...tls.v3.UpstreamTlsContext` |
| QUIC Downstream Transport | downstream | `...quic.v3.QuicDownstreamTransport` |
| QUIC Upstream Transport | upstream | `...quic.v3.QuicUpstreamTransport` |
| Proxy Protocol Upstream Transport | upstream | `...proxy_protocol.v3.ProxyProtocolUpstreamTransport` |
| Raw Buffer | both | `...raw_buffer.v3.RawBuffer` |

You define a transport socket once as a reusable resource, then **attach it by reference**. On a listener filter chain you pick a downstream (or QUIC-downstream / raw-buffer) transport socket; on a cluster you pick an upstream one. Elchi filters the picker by direction so you can't attach a downstream context to a cluster or vice versa.

## Key fields

The heart of a TLS transport socket is its `common_tls_context`:

| Field | Purpose |
| --- | --- |
| `tls_certificate_sds_secret_configs` | References the server (downstream) or client (upstream) certificate [Secret](/envoy-configuration/resources/secrets) over SDS. |
| `validation_context_sds_secret_config` | References the CA/validation [Secret](/envoy-configuration/resources/secrets) — enables mTLS by verifying the peer. |
| `tls_params` | Min/max TLS version and the cipher suites / curves allowed. |
| `alpn_protocols` | Negotiated protocols (e.g. `h2`, `http/1.1`). |

**Downstream-only:** `require_client_certificate` turns on mutual TLS. **Upstream-only:** `sni` and `auto_host_sni` set the SNI Envoy presents to the backend.

:::info[mTLS = certificate + validation context, on both ends]
For mutual TLS, the downstream context needs a server cert **and** a validation context with `require_client_certificate: true`; the upstream context (on the client side) needs a client cert **and** a validation context for the server's CA. Each side proves identity and verifies the other.
:::

## Relationships

- **Attached to listeners (downstream)** — terminates client TLS on a [Listener](/envoy-configuration/resources/listeners) filter chain.
- **Attached to clusters (upstream)** — secures the hop to the backend from a [Cluster](/envoy-configuration/resources/clusters).
- **References secrets** — pulls certificates and CA bundles from [Secrets](/envoy-configuration/resources/secrets) via SDS.
- **Interacts with the TLS Inspector** — SNI/ALPN-based filter-chain matching on a listener relies on the TLS Inspector [listener filter](/envoy-configuration/resources/filters).

## Example

Downstream mTLS on a listener, and upstream TLS on a cluster:

```yaml
# Downstream (listener filter chain) — terminate + require client cert
name: envoy.transport_sockets.tls
typed_config:
  "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
  require_client_certificate: true
  common_tls_context:
    tls_certificate_sds_secret_configs:
      - name: example_com_cert
    validation_context_sds_secret_config:
      name: client_ca
    alpn_protocols: ["h2", "http/1.1"]
---
# Upstream (cluster) — verify backend, present client identity
name: envoy.transport_sockets.tls
typed_config:
  "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
  sni: backend.internal.example.com
  common_tls_context:
    tls_certificate_sds_secret_configs:
      - name: envoy_client_cert
    validation_context_sds_secret_config:
      name: internal_ca
```

## Tips

- **Direction is not interchangeable.** Downstream contexts terminate client TLS; upstream contexts originate TLS to a backend. Elchi enforces this in the picker.
- **Reference secrets over SDS** rather than inlining PEMs, so certs rotate without editing the transport socket.
- **Set `tls_params` deliberately.** Pin a minimum TLS version and a sane cipher list rather than accepting defaults on internet-facing listeners.
- **Add ALPN for HTTP/2.** Without `h2` in `alpn_protocols`, clients fall back to HTTP/1.1.
- **QUIC and Proxy Protocol are separate transports** — use the QUIC transports for HTTP/3 listeners and the Proxy Protocol upstream transport when a downstream must carry the original client address.
