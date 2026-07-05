---
title: Multi-Version Secrets
description: The version-scoped certificate model — how one ACME certificate is written to per-Envoy-version secrets, adding versions, and duplicating.
sidebar_position: 4
tags: [acme, tls, certificates]
---

An Elchi certificate is **version-scoped**. A single certificate — one set of domains, one ACME account, one DNS credential — is written into the Envoy `secrets` store **once per Envoy version** it targets. That set of versions is the certificate's `secret_versions`. This mirrors how every Elchi resource is version-pinned so that config for different Envoy versions stays isolated (see [Versions & upgrades](/envoy-configuration/versions-and-upgrades)).

## Why version-scoped

Elchi resources are stored per Envoy version because Envoy's config schema evolves between releases. A TLS secret referenced by a listener must exist **for the same version** as that listener. If a certificate only existed for `v1.36.0`, a listener built for `v1.37.0` could not find it. Version-scoping a certificate means the same key material is available to every Envoy version you run, under the same secret name.

## How a certificate binds to Envoy secrets

When a certificate is issued or renewed, Elchi writes the certificate chain and private key into the `secrets` collection — **one document for each entry in `secret_versions`**. Each document is a standard Envoy `TLSCertificate` secret:

- **Name** — the certificate's `secret_name` (identical across versions).
- **Version** — one of the `secret_versions`.
- **GType** — `TLSCertificate`, canonical name `envoy.transport_sockets.tls_certificate`.
- **Contents** — `certificate_chain.inline_string` (the PEM chain) and `private_key.inline_string` (the PEM key).
- **Metadata** — tagged `acme_enabled: true` with the originating `acme_cert_id`, so the secret is recognizably ACME-managed.

Because the secret uses the same `secret_name` on every version, a listener references it the same way regardless of which Envoy version it is built for. These secrets are consumed by a downstream TLS [transport socket](/envoy-configuration/resources/transport-sockets); the secret itself is documented under [Secrets](/envoy-configuration/resources/secrets).

```text
ACME certificate  "example-tls"
   ├── secret "example-tls" @ v1.36.0   (TLSCertificate: chain + key)
   ├── secret "example-tls" @ v1.37.0   (TLSCertificate: chain + key)
   └── secret "example-tls" @ v1.38.0   (TLSCertificate: chain + key)
```

:::info[Renewal updates every version together]
When a certificate renews, Elchi writes the fresh chain and key to **all** of its `secret_versions` in one operation and pokes the dependent listeners/TLS contexts. You never renew per version — one renewal keeps every version in lockstep.
:::

## Creating a certificate for one or more versions

`versions` is required and accepts an array, so you can back several Envoy versions from the first issuance:

```bash
POST /api/v3/acme/certificates?project=<project-id>
Content-Type: application/json

{
  "domains": ["example.com", "*.example.com"],
  "secret_name": "example-tls",
  "acme_account_id": "<account id>",
  "versions": ["v1.36.0", "v1.37.0"],
  "environment": "production",
  "dns_credential_id": "<credential id>"
}
```

Rules enforced at creation:

- `domains`, `secret_name`, `acme_account_id`, and a non-empty `versions` array are all required.
- The referenced ACME account must be **registered/active**, and the certificate's `environment` must match the account's environment (if `environment` is omitted it defaults to the account's).
- `secret_name` must be unique within the project — you cannot create two certificates with the same name. To grow an existing certificate onto a new version, **duplicate** it (below) rather than creating a second one.
- Creating certificates requires **Editor+** (Viewers cannot).

## Adding a certificate for a new Envoy version

When you [upgrade Envoy](/envoy-configuration/versions-and-upgrades) to a version your certificate does not yet cover, add that version to the certificate with **Duplicate**. Despite the name, this does not create a second certificate — it adds a new version entry to the existing one so the same domains and key material are written to the new version's secret:

```bash
POST /api/v3/acme/certificates/{cert_id}/duplicate?project=<project-id>
Content-Type: application/json

{
  "version": "v1.38.0"
}
```

After duplicating, the certificate's `secret_versions` includes the new version, and a `TLSCertificate` secret named `secret_name` now exists for it. Duplicating requires **Editor+**.

:::tip[Add the version before you cut over]
Duplicate the certificate onto the target Envoy version **before** you point that version's listeners at it, so the secret is already present when the new config is deployed. Then the renewal scheduler keeps all versions — old and new — refreshed together.
:::

## Inspecting the binding

`GET /api/v3/acme/certificates/{cert_id}?project=<project-id>` returns the certificate with its `secret_versions`, `domains`, `status`, `expires_at`, and the ACME/DNS metadata. In the UI, the Certificates table shows each version as a tag in the **Versions** column.

:::caution[Orphaned certificate]
If the certificate's ACME account has been deleted, list/get responses include a warning that the certificate is **orphaned** — its key material is still served from the secrets, but automatic renewal will fail until it is reattached to a valid account. Reassign it before the renewal window opens.
:::
