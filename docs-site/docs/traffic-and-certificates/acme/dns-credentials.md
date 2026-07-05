---
title: DNS Credentials
description: Storing DNS provider API tokens that authorize the ACME DNS-01 challenge — supported providers, creating, testing, and rotating credentials.
sidebar_position: 3
tags: [acme, tls, certificates]
---

A **DNS credential** is an encrypted provider API token that lets Elchi create and delete the `_acme-challenge` TXT records the DNS-01 challenge requires. Store it once, then attach it to certificates for fully automatic issuance and renewal — you never touch DNS by hand. Certificates created **without** a DNS credential fall back to manual DNS (you place the TXT records yourself); see [Renewal & troubleshooting](/traffic-and-certificates/acme/renewal).

DNS credentials live under the **DNS Credentials** tab of the Certificates page and are scoped to a project.

## How a credential authorizes the challenge

During DNS-01, the CA hands Elchi a token for each domain. Elchi must publish that token as a TXT record at `_acme-challenge.<domain>` so the CA can confirm you control the zone. The DNS credential is what grants Elchi API access to your zone to **create** that record before validation and **delete** it afterward. The token is provider-specific and is stored **encrypted at rest** — it is never returned in API responses (list/get responses are sanitized to omit the encrypted material).

## Supported providers

Elchi ships DNS-01 providers for the following, backed by the `go-acme/lego` library:

| Provider key | Provider | Auth method | Required fields |
| --- | --- | --- | --- |
| `cloudflare` | Cloudflare | API Token | `api_token` (token with `Zone:DNS:Edit`) |
| `route53` | AWS Route 53 | Access key + secret | `access_key_id`, `secret_access_key` (opt. `region`, `hosted_zone_id`) |
| `lightsail` | AWS Lightsail | Access key + secret | `access_key_id`, `secret_access_key`, `dns_zone` (opt. `region`) |
| `google` | Google Cloud DNS | Service Account JSON | `project_id`, `service_account_json` (opt. `zone_id`) |
| `godaddy` | GoDaddy | API key + secret | `api_key`, `api_secret` |
| `digitalocean` | DigitalOcean | API Token | `api_token` (Personal Access Token, `dop_v1_…`) |

Notes on individual providers:

- **Route 53 / Lightsail** — `region` defaults to `us-east-1` when omitted. Lightsail additionally **requires** `dns_zone` (e.g. `example.com`). Use IAM credentials scoped to the relevant Route 53 / Lightsail permissions.
- **Google Cloud DNS** — pass the full service-account JSON in `service_account_json`. The optional `zone_id` (the GCP Managed Zone ID) bypasses the SOA lookup, which avoids split-horizon DNS problems in some environments.
- **Cloudflare** — the token needs `Zone:DNS:Edit` on the target zone(s).

There is also a pseudo-provider `manual`, which is not a stored credential — it is the mode a certificate uses when no DNS credential is attached.

## Creating a credential

```bash
POST /api/v3/acme/dns-credentials?project=<project-id>
Content-Type: application/json

{
  "name": "cloudflare-prod",
  "provider": "cloudflare",
  "credentials": { "api_token": "<cloudflare token>" }
}
```

The `credentials` object is provider-specific (use the required fields from the table). Elchi encrypts it before storing.

```bash title="Google Cloud DNS example"
{
  "name": "gcp-dns",
  "provider": "google",
  "credentials": {
    "project_id": "my-gcp-project",
    "service_account_json": "{ ...service account key... }",
    "zone_id": "my-managed-zone"
  }
}
```

:::note[Who can manage DNS credentials]
Creating, updating, deleting, and testing DNS credentials is restricted to **Admin/Owner**. Editors and Viewers can see credentials they have permission to (via the credential's `permissions`) and select them when creating certificates, but cannot modify them.
:::

## Testing a credential

Before you rely on a credential, test it. Elchi creates a throwaway TXT record for a domain you choose and then deletes it, exercising the exact create/cleanup path DNS-01 uses:

```bash
POST /api/v3/acme/dns-credentials/test?project=<project-id>
Content-Type: application/json

{
  "provider": "cloudflare",
  "domain": "example.com",
  "credentials": { "api_token": "<cloudflare token>" }
}
```

A success means the credential can create and remove records in that zone. A failure returns the underlying provider error (bad token, missing permission, wrong zone), so you can fix it before issuing a real certificate. You can test credentials inline (as above) without having saved them yet.

## Updating and rotating

```bash
PUT /api/v3/acme/dns-credentials/{cred_id}?project=<project-id>
```

You can update the name, description, and permissions, and optionally supply a new `credentials` object to **rotate the token**. Omit `credentials` to change only metadata. Rotating the token in place means every certificate already pointing at this credential keeps auto-renewing with the new token — no per-certificate change needed.

## Deleting a credential

```bash
DELETE /api/v3/acme/dns-credentials/{cred_id}?project=<project-id>
```

:::warning[Credential in use]
If certificates still reference the credential, the delete is rejected and the response lists the affected certificate count and IDs. Deleting anyway with `force=true` **orphans** those certificates: they can no longer auto-renew until you point them at a working credential (see *Change DNS credential* in [Renewal & troubleshooting](/traffic-and-certificates/acme/renewal)).
:::

## From credential to issued certificate

Once a credential exists and tests clean, attach it when you create a certificate to get automatic verification:

```bash
POST /api/v3/acme/certificates?project=<project-id>
Content-Type: application/json

{
  "domains": ["example.com", "*.example.com"],
  "secret_name": "example-tls",
  "acme_account_id": "<account id>",
  "versions": ["v1.36.0"],
  "environment": "production",
  "dns_credential_id": "<credential id>"
}
```

With `dns_credential_id` present, issuance runs as a background job that publishes and cleans up the TXT records for you. Continue in [Multi-version secrets](/traffic-and-certificates/acme/multi-version-secrets).
