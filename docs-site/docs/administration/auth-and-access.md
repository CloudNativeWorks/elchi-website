---
title: Authentication & Access
description: The Owner/Admin/Editor/Viewer role model, project scoping, API/discovery/OpenRouter tokens, LDAP/AD integration with connection and auth tests, and TOTP two-factor authentication.
sidebar_position: 2
tags: [administration, auth, rbac, ldap, 2fa]
---

Elchi isolates resources by **project** and governs who can do what with a four-tier **role** model, on top of directory-based login (LDAP/AD) and TOTP two-factor authentication. This page covers roles, projects, the three token types, LDAP, and 2FA. Most of it lives under **Settings**; 2FA is on your **Profile**.

## Roles (RBAC)

Every user has one role. Roles are enforced platform-wide — the whole `/setting` surface defaults to **Admin/Owner only**, with specific read carve-outs for Editors and Viewers.

| Role | Can do |
| --- | --- |
| **Owner** | Everything, including **project** and member management, elevating users to Owner, emergency 2FA resets, and global operations. Owners implicitly have access to **all** projects. |
| **Admin** | Manage resources and most settings **within their projects**. Cannot manage projects, cannot create or elevate a user to Owner, and cannot modify an Owner user. |
| **Editor** | Create and edit resources they're permitted on; read-only for admin settings. |
| **Viewer** | Read-only access. |

Some finer points that matter in practice:

- **Project management is Owner-only** (create, update, delete, list) — see below.
- Admins are blocked from creating or promoting a user to the **Owner** role, and from editing Owner users; an Owner can update any user.
- The built-in `admin` user and the default project can't be deleted.
- Editor vs. Viewer on a given resource is further narrowed by per-resource permissions (the resource's allowed users/groups).

:::note[There is no "member" role]
The role set is exactly **Owner / Admin / Editor / Viewer**. "Members" is not a role — it's a **field** on a project (and on groups) listing the users attached to it. See [Projects](#projects) for how non-owners are attached.
:::

## Projects

A **project** is the isolation boundary — a team, environment, or customer. Every resource (clusters, listeners, routes, secrets, services, WAF, ACME, …) carries the project it belongs to, and scoping/cleanup queries filter on it. Creating a project also seeds a default group and default resources for each Envoy version.

- **Only Owners manage projects.** Creating, updating, deleting, and listing projects is gated to Owners; non-owners get "Only system owners can manage projects." The default project cannot be deleted, and a project with dependent resources can't be removed until they're cleared.
- **How users attach to a project:**
  - **Owners** automatically see and act on **all** projects — a project's `members` list is specifically for Owner-role users.
  - **Admin / Editor / Viewer** users are attached to a project through their **base project** (set on the user), not the members array.
- Manage projects and their members under **Settings → Projects** (open a project to add/remove member users via the transfer panel). Manage users under **Settings → Users** and groups under **Settings → Groups**.

## Tokens

Elchi has **three distinct token types**, all managed per project. Issue and revoke them under **Settings** (Admin/Owner).

### API / client tokens

For automation and client-agent authentication against the controller API. Under **Settings → Tokens → Client Tokens**, enter a name and click **Create Token** — the value is shown **once** in a modal (copy it; you can't view it again).

```bash
# Create (name must be unique within the project)
curl -X POST "$ELCHI/api/v3/setting/tokens?project=$PROJECT&name=ci-pipeline" \
  -H "Authorization: Bearer $TOKEN"
```

The generated token embeds the project (a `--<project>` suffix) so a consumer can derive which project it belongs to. Use it as a bearer token for scripted/CI access. List with `GET /setting/tokens` (values masked) and revoke with `DELETE /setting/tokens/:token_id`.

### Discovery token

A single per-project token consumed by **endpoint/Kubernetes discovery agents** to push discovered cluster endpoints. Under **Settings → Tokens → Discovery Token**, click **Generate Discovery Token**. Unlike API tokens, `GET /setting/discovery-token` returns the **full unmasked** value so agents can parse the project from it.

```bash
curl -X POST "$ELCHI/api/v3/setting/discovery-token/generate?project=$PROJECT" \
  -H "Authorization: Bearer $TOKEN"
```

See the [discovery agent installation](/installation/discovery-agent/overview) for using it.

### OpenRouter token

Powers the platform's **AI features** (LLM calls via OpenRouter), not automation. Set it on the **AI** tab: paste a key beginning with `sk-or-` and save (one per project). See [AI Analysis](/administration/ai-analysis).

:::info[Rotation]
Regenerating or deleting a token immediately invalidates the old one — any client or agent using it loses access until re-issued.
:::

## LDAP / Active Directory

Connect an existing directory under **Settings → LDAP** for centralized login. Configuration is per project.

| Field | Notes |
| --- | --- |
| **Enable LDAP** | Master switch. |
| **Server / Port** | LDAP host; default `636` (LDAPS) or `389`. |
| **Base DN** | e.g. `dc=company,dc=com`. |
| **User Filter** | Must contain `{username}`, e.g. `(uid={username})`. |
| **Bind User / Password** | Service-account DN used to search for users. |
| **Enable TLS / Skip Verify** | LDAPS on by default; skip-verify for self-signed labs only. |

Two test buttons validate the setup before rollout:

- **Test Connection** (`POST /setting/ldap-config/test`) — dials the server and (optionally) binds the service account; no user credentials involved.
- **Test Authentication** (`POST /setting/ldap-config/test-auth`) — you enter a real username/password; Elchi searches for the user and re-binds as them to prove a credential actually authenticates.

**How LDAP users map to roles/projects.** On first login, an unknown username is authenticated against the first LDAP-enabled project and **just-in-time provisioned**: the new user gets auth type `ldap`, the **Viewer** role by default (read-only), the LDAP-enabled project as its base project, and is added to that project's members. No password is stored locally; the username is escaped before the directory search to prevent injection. Existing LDAP users re-authenticate against the directory on every login, and can't change email/password through the profile page. Promote an LDAP user or move them between projects the same way as any user — via an Owner/Admin user update.

## Two-factor authentication (2FA / OTP)

Elchi supports **TOTP** two-factor auth (6-digit codes, 30-second period, compatible with standard authenticator apps), managed from your **Profile → Two-Factor Authentication**.

### Enroll

1. Click **Enable 2FA** and confirm your **current password**.
2. Elchi shows a **QR code** (and the secret) plus **10 one-time backup codes** — scan the QR into your authenticator and save the backup codes (download PDF or print). They're shown **once**.
3. Enter the 6-digit code from your app to **verify** and activate 2FA.

Enrollment isn't complete until you verify a code — enable → verify → active.

### Manage

When 2FA is active the panel shows how many **backup codes remain** (of the 10 issued) and warns when fewer than 5 remain. From here you can:

- **Regenerate backup codes** — confirm with a current authenticator code; new codes replace and invalidate the old ones.
- **Disable 2FA** — requires your password **plus** either a valid authenticator code or a backup code.

### Login and enforcement

- At sign-in, a 2FA-enabled user is prompted for a code; a **backup code** works if the authenticator is unavailable (and is consumed on use).
- **Project-enforced 2FA:** an Owner/Admin can require 2FA for a project (**Settings**, OTP config). A user who hasn't set it up is routed into a one-time setup flow at login rather than being let in.
- **Emergency reset:** an **Owner** can reset a locked-out user's 2FA (e.g. lost authenticator) from the user's detail page, letting them re-enroll.

## Related

- [Backup & Restore](/administration/backup-restore) — Owner/Admin maintenance tools.
- [Cloud & OpenStack](/administration/cloud-openstack) — cloud config CRUD (Owner/Admin).
- [Licensing](/administration/licensing) — license activation (Admin/Owner).
