---
title: CA Providers & EAB
description: Choosing a Certificate Authority, listing supported CA providers and environments, and supplying External Account Binding (EAB) credentials.
sidebar_position: 2
tags: [acme, tls, certificates]
---

A **CA provider** is the Certificate Authority that issues your certificate. Before you can request certificates you register an **ACME account** with one CA provider, in one environment (`staging` or `production`). Every certificate then references that account.

CA providers are configured on the controller (they are part of the platform's configuration, not something end users create), so the exact set available to you depends on your Elchi deployment. Each provider entry carries a display name, a description, whether it is currently `supported`, whether it `requires_eab`, and the ACME **directory URL** for each environment.

## Listing supported providers

The UI populates the CA selector from the controller. Programmatically:

```bash
GET /api/v3/acme/ca-providers
```

Each entry looks like this:

```json
{
  "provider": "letsencrypt",
  "name": "Let's Encrypt",
  "description": "Free, automated, and open Certificate Authority",
  "supported": true,
  "requires_eab": false,
  "environments": ["staging", "production"]
}
```

Providers that require EAB may also include an `eab_instructions_url` pointing at the CA's page for obtaining EAB credentials.

## The known CA providers

Elchi recognizes these CA provider keys. Which ones are actually enabled (`supported: true`) and their directory URLs are set by controller configuration.

| Provider key | CA | EAB required |
| --- | --- | --- |
| `letsencrypt` | Let's Encrypt | No |
| `google` | Google Trust Services | Yes |
| `zerossl` | ZeroSSL | Yes |
| `buypass` | Buypass | No |

:::note
The table lists the provider keys the code understands. Your deployment may enable only a subset — always trust the `GET /ca-providers` response for what is available and whether EAB is required. Requesting an account for an unknown or unsupported provider is rejected.
:::

## Environments: staging vs production

Every provider exposes one or more environments, each with its own ACME directory URL and rate limits:

- **`staging`** — no meaningful rate limits. Use it while you get DNS credentials and the workflow working. Staging certificates are issued by an untrusted test root, so browsers will not trust them; that is expected.
- **`production`** — issues browser-trusted certificates and is subject to the CA's rate limits (for example, Let's Encrypt limits certificates per registered domain per week). Switch here once your dry run on staging succeeds.

An ACME account is bound to a single environment, and a certificate's environment **must match** its account's environment — Elchi rejects a mismatch.

## Choosing a CA

- **Let's Encrypt** — the default; free, widely trusted, no EAB. A good starting point for most public domains.
- **Google Trust Services / ZeroSSL** — require EAB (see below). Choose these when you have an existing relationship with the CA, need their trust chain, or want their rate-limit terms.
- **Buypass** — trusted CA that does not require EAB.

Practically: start on `staging` with Let's Encrypt to validate DNS and the end-to-end flow, then create a `production` account with your chosen CA.

## External Account Binding (EAB)

Some CAs require you to **bind** your ACME account to an existing account you hold with them. This is done with **EAB credentials** — a `key_id` and an `hmac_key` you obtain from the CA's dashboard. When a provider has `requires_eab: true`, you must supply these when you create the ACME account, or the request is rejected.

Elchi encrypts the EAB HMAC key at rest and uses the credentials during ACME account registration to prove ownership.

### Validating EAB credentials

You can pre-check EAB credentials for a provider before creating the account:

```bash
POST /api/v3/acme/ca-providers/{provider}/validate-eab
Content-Type: application/json

{
  "email": "ops@example.com",
  "environment": "production",
  "eab": {
    "key_id": "<EAB key id from the CA>",
    "hmac_key": "<EAB HMAC key from the CA>"
  }
}
```

The endpoint checks that the provider exists, is supported, actually requires EAB, and that the environment is valid, then confirms the credential **format**.

:::caution[Format check, not a live registration]
The validate-eab endpoint currently verifies that the request is well-formed; it does not perform a full test registration against the CA. The real proof happens when you **create the ACME account** — that is when Elchi registers with the CA using the EAB credentials, and bad credentials cause the account creation (or its first order) to fail. Treat account creation on `staging` as your true validation step.
:::

## Creating the account

Once you have chosen a provider, environment, and (if required) EAB credentials, create the ACME account:

```bash
POST /api/v3/acme/acme-accounts?project=<project-id>
Content-Type: application/json

{
  "name": "prod-letsencrypt",
  "email": "ops@example.com",
  "ca_provider": "letsencrypt",
  "environment": "production",
  "eab": { "key_id": "...", "hmac_key": "..." }
}
```

Notes:

- Creating, deleting, and validating ACME accounts is restricted to **Admin/Owner**.
- `ca_provider` defaults to `letsencrypt` if omitted.
- If the provider requires EAB and you omit it, the request is rejected.
- An account's ECDSA registration key is generated and stored **encrypted**; you never handle it directly.
- Emails are unique per environment per project — the same email cannot register two accounts in the same environment.

Use `POST /api/v3/acme/acme-accounts/{account_id}/validate` to re-check registration status; the response reports the account `status`, its `registration_url`, and when it was last validated.

:::warning[Deleting an account in use]
An ACME account cannot be deleted while certificates reference it, unless you pass `force=true`. Force-deleting **orphans** those certificates — they can no longer auto-renew. The delete response returns the count and IDs of the affected certificates so you can reassign them first.
:::
