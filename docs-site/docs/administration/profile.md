---
title: Your Profile
description: Self-service account management in Elchi — change your email and password, and enable or manage two-factor authentication for your own account.
sidebar_position: 8
tags: [administration, security]
---

The **Profile** page (**My Profile**) is your personal account surface: it's where
you manage your *own* email, password, and two-factor authentication. It is
distinct from the administrative [Auth & Access](/administration/auth-and-access)
controls, which govern users, roles, and the platform-wide RBAC/2FA model — the
Profile page only ever acts on the account you're signed in as.

The page header summarizes your account at a glance: **username**, **email**,
**role**, **authentication type** (`LOCAL` or `LDAP`), and your current **2FA
status**.

## Local vs. LDAP accounts

What you can edit depends on how your account authenticates:

- **Local accounts** can change their email and password directly in Elchi.
- **LDAP accounts** have their email and password managed by the LDAP server —
  those fields are read-only in Elchi and show an informational note. LDAP users
  can still enable two-factor authentication.

## Change your email

Under **Update Email**, enter a new email address and **confirm with your current
password**, then submit. The change is applied via `PUT /api/v3/profile/email`.
This form is available to local accounts only; for LDAP accounts the email is
sourced from the directory.

## Change your password

Under **Change Password**, provide your **current password** and a **new
password** (`PUT /api/v3/profile/password`). New passwords are validated against a
strength policy — a password must:

- be at least **12 characters** long,
- contain at least one **uppercase** letter,
- contain at least one **lowercase** letter,
- contain at least one **number**, and
- contain at least one **special character** (`@ $ ! % * ? &`).

As with email, password changes apply to local accounts; LDAP passwords are
managed by the directory.

## Two-factor authentication (TOTP)

The **Two-Factor Authentication** panel is the self-service surface for TOTP-based
2FA, backed by the profile OTP endpoints (`/api/v3/profile/otp/*`). Your current
state is read from `GET /api/v3/profile/otp/status`.

**Enabling 2FA** walks you through pairing an authenticator app (scan a QR code)
and verifying a code to confirm the setup (`otp/enable`, `otp/verify`). On
enrollment you receive a set of **10 backup codes** — one-time codes to use if you
lose access to your authenticator. Store them somewhere safe.

Once enabled, the panel shows:

- **2FA is Active**, and
- **Backup codes remaining** (out of 10). When fewer than 5 remain, Elchi warns you
  to regenerate them.

**Managing an active 2FA setup:**

- **Regenerate backup codes** (`otp/regenerate-backup-codes`) — confirm with a
  current authenticator code; this **invalidates all previous backup codes** and
  issues a fresh set of 10. Make sure you still have your authenticator before
  regenerating.
- **Disable 2FA** (`otp/disable`) — requires your **password plus** either a
  current authenticator code **or** a backup code. Disabling 2FA lowers your
  account security, so Elchi warns before proceeding.

:::info[The bigger picture]
This page is scoped to your own account. For how roles, permissions, and 2FA fit
into Elchi's overall authentication and authorization model — including
LDAP integration and administrative controls — see
[Auth & Access](/administration/auth-and-access).
:::
