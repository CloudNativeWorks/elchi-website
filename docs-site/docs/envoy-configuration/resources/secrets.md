---
title: Secrets & TLS
description: How Elchi models Envoy secrets (SDS) — TLS certificates, validation contexts, and the link to ACME-managed certificates.
sidebar_position: 6
tags: [envoy, resources]
---

A **secret** holds the sensitive material Envoy needs for TLS: a certificate and its private key, a CA bundle for validating peers, or a shared secret. In xDS terms these are served by the **Secret Discovery Service (SDS)**. Keeping secrets as their own resource means a listener or cluster references a certificate *by name* rather than embedding key material inline — so certs can rotate independently and are streamed to the proxy over a dedicated, sensitive channel.

Secrets are referenced by [Transport Sockets](/envoy-configuration/resources/transport-sockets): a downstream TLS context (on a listener) names a server certificate and, for mTLS, a validation context; an upstream TLS context (on a cluster) names a client certificate and CA bundle.

## In Elchi

Secrets live under **Resources → Secret** (`/resource/secret`). Create one with **Add New**, choosing an Envoy version first. Elchi models four SDS secret shapes, and the editor renders the right form based on the type you pick:

| Type | Envoy type URL | Holds |
| --- | --- | --- |
| TLS Certificate | `...tls.v3.TlsCertificate` | A cert chain + private key (server or client identity). |
| Certificate Validation Context | `...tls.v3.CertificateValidationContext` | Trusted CA(s) + SAN match rules for verifying peers. |
| Generic Secret | `...tls.v3.GenericSecret` | An opaque named secret (e.g. an HMAC/OAuth key). |
| TLS Session Ticket Keys | `...tls.v3.TlsSessionTicketKeys` | Keys for TLS session resumption. |

Secret material is redacted in logs and handled as sensitive config throughout — it is delivered to proxies over SDS, not written into listener/cluster documents.

:::tip[Let ACME issue and rotate certs for you]
Instead of uploading a certificate and key by hand, use Elchi's ACME integration to issue and auto-renew certificates (Let's Encrypt / any ACME CA, with DNS-01 or HTTP-01). ACME-managed certs surface as SDS secrets your transport sockets can reference, and renewals flow to Envoy automatically. See [ACME Certificates](/traffic-and-certificates/acme).
:::

## Key fields

**TLS Certificate**

| Field | Purpose |
| --- | --- |
| `certificate_chain` | The leaf certificate plus any intermediates (PEM). |
| `private_key` | The matching private key (PEM). Redacted in the UI/logs. |
| `password` | Optional key passphrase. |

**Certificate Validation Context**

| Field | Purpose |
| --- | --- |
| `trusted_ca` | CA bundle used to verify the peer's certificate. |
| `match_typed_subject_alt_names` | Allowed SANs (DNS, URI/SPIFFE, etc.) — the core of mTLS identity checks. |
| `verify_certificate_hash` / `spki` | Pin specific certs/keys. |

## Relationships

- **Referenced by transport sockets** — a downstream or upstream [Transport Socket](/envoy-configuration/resources/transport-sockets) names the secret in its `common_tls_context`.
- **Attached to listeners (downstream)** — server certs terminate TLS on a [Listener](/envoy-configuration/resources/listeners) filter chain.
- **Attached to clusters (upstream)** — client certs and CA bundles secure connections from a [Cluster](/envoy-configuration/resources/clusters) to its backend.
- **Issued by ACME** — [ACME](/traffic-and-certificates/acme) can own the lifecycle of certificate secrets.

## Example

A server certificate secret and a validation context for mTLS:

```yaml
# TlsCertificate secret
name: example_com_cert
tls_certificate:
  certificate_chain: { inline_string: "-----BEGIN CERTIFICATE-----\n..." }
  private_key: { inline_string: "-----BEGIN PRIVATE KEY-----\n..." }
---
# CertificateValidationContext secret
name: client_ca
validation_context:
  trusted_ca: { inline_string: "-----BEGIN CERTIFICATE-----\n..." }
  match_typed_subject_alt_names:
    - san_type: DNS
      matcher: { exact: "client.internal.example.com" }
```

## Tips

- **Reference by name, don't inline.** Attach secrets to transport sockets via SDS so certs rotate without editing listeners/clusters.
- **Prefer ACME for public certs.** Automated issuance and renewal avoids expiry outages; reserve manual upload for private-PKI or pinned certs.
- **mTLS needs two halves.** A validation context alone verifies peers; add the matching identity certificate on the other side of the connection.
- **Secrets ride their own snapshot channel.** Publishing a secret used by a listener re-snapshots that proxy; use **Snapshot dump** to confirm the SDS resource landed (values stay redacted).
