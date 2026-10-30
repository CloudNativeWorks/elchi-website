---
title: API tokens
description: Project API tokens for the automation API — who can create them, scopes, expiry, how a token is checked on every request, and revoking one.
sidebar_position: 2
tags: [automation, api, security]
---

The automation API authenticates with **API tokens**:

```http
Authorization: Bearer elchi_pat_…
```

An API token belongs to **one project** and carries only the **scopes** it was given. It works only on the automation API (`/api/public/v1`). Sent to the API the elchi UI uses, it is refused with `401`. Likewise, a UI sign-in session does not work on the automation API.

## Creating a token

Open **Settings → Tokens**. The **API tokens** section lists the current project's tokens. An **owner** (of the installation), or an **admin** who is a member of the project (directly or through a group), can create and revoke them. Editors and viewers cannot.

1. Give the token a **name**: one per pipeline or script, for example `release-pipeline`. A name is 1–64 letters, digits, spaces, `.`, `_` or `-`, starting with a letter or a digit. A token that is not revoked holds its name in the project.
2. Pick an **expiry**: 30 days, 90 days (the default), 1 year, or never.
3. Tick the **scopes** it needs. Give a token only what its job needs.
4. **Create token.** The value is shown **once**. Copy it into your pipeline's secrets before you close the dialog.

A project can have at most **50** tokens that are not revoked. An expired token still counts until you revoke it.

Revoked and expired tokens stay in the list, with their status.

elchi stores only a hash of the value, never the value itself. The list shows each token's prefix (`elchi_pat_AbCd1234…`), its scopes, who created it and when, the expiry, and when and from where it was last used.

## Scopes

A scope is `<domain>:read` or `<domain>:write`. Each operation names the scope it needs (`x-elchi-scope` in the OpenAPI document, shown on every endpoint in the in-app API Reference).

| Scope | Allows |
| --- | --- |
| `endpoints:read` | List endpoints, read one endpoint and where it is used, read endpoint operations. |
| `endpoints:write` | Disable and enable endpoints (including `dry_run` previews). |
| `clusters:read` | List EDS clusters, read one and its switch history, read cluster operations. |
| `clusters:write` | [Switch an EDS cluster](./clusters.md) to another endpoints resource (including `dry_run` previews). |

`write` does not include `read`. A pipeline that changes endpoints and follows the push needs both scopes. With `endpoints:write` alone it cannot read the operation its change started.

Some operations need no scope:

- `GET /token` and `GET /projects/{project}/versions` work with any valid token of the project.
- Listing operations returns only the operations of the domains the token can read.
- The OpenAPI document needs no token at all.

A token without the needed scope is refused with `403 insufficient_scope`. A path naming another project is refused with `403 project_mismatch`.

New domains add their own `read` and `write` scopes. **Settings → Tokens** lists every scope the controller offers.

## How a token is checked

Every request checks, in order:

1. **The format and checksum** of the value. A malformed value is `401 unauthenticated`.
2. **The token exists and is not revoked.** This is read from the database on every request, so revoking takes effect at once.
3. **The expiry.** An expired token is `401 token_expired`. Create a new token and replace the old one.
4. **Its creator may still grant it.** The creator must still be an active owner, or an active admin who is a member of the project, directly or through a group. A token never outlives its creator's access. This check is cached for 30 seconds.

## Revoking a token

In **Settings → Tokens**, select **Revoke** on the token's row and confirm. The token stops working with its next request. Revoking a token twice keeps the first revoke's time and author.

Deleting a project deletes its tokens.

## Audit

Every change made through the automation API is written to the audit log (**Administration → Audit** in the UI) with:

- the API type `PUBLIC_API`;
- the actor type `api_token`;
- the token's id and name;
- the request's `X-Request-Id`.
