---
title: Settings & the General Tab
description: An orientation to the Settings area — the full tab set with links to each feature's doc, and the General tab's version hero and live storage-usage card.
sidebar_position: 10
tags: [administration, settings]
---

**Settings** is the platform's administrative console. The whole surface defaults to **Admin/Owner only** (with narrow read carve-outs), so most tabs are gated by [role](/administration/auth-and-access#roles-rbac). This page orients you to the tab set and covers the **General** tab in detail.

## The tab set

Settings is a set of tabs, each an entry point to one management area. Most map to a dedicated doc:

| Tab | What it does | Docs |
|---|---|---|
| **General** | Platform version hero, live storage usage, theme. | This page ↓ |
| **Users** | Create/manage users, roles, and base projects. | [Authentication & Access](/administration/auth-and-access#roles-rbac) |
| **Groups** | Group membership for resource permissions. | [Authentication & Access](/administration/auth-and-access) |
| **Projects** | The tenancy boundary — create/manage projects and members (Owner-only). | [Authentication & Access](/administration/auth-and-access#projects) |
| **Tokens** | API/client tokens and the per-project discovery token. | [Authentication & Access](/administration/auth-and-access#tokens) |
| **AI** | The per-project OpenRouter key for AI features. | [AI Analysis](/administration/ai-analysis) |
| **Clouds** | OpenStack cloud registration. | [Cloud & OpenStack](/administration/cloud-openstack) |
| **LDAP** | Directory (LDAP/AD) login configuration, per project. | [Authentication & Access](/administration/auth-and-access#ldap--active-directory) |
| **GSLB** | GSLB zone defaults and the DNS zone secret. | [GSLB Nodes & CoreDNS](/traffic-and-certificates/gslb/nodes-coredns) |
| **API-Discovery** | Runtime config for the discovery collector. | [API Discovery](/api-discovery/overview) |
| **Audit-Forwarding** | Forward the audit trail to a SIEM over syslog. | [Audit & Syslog Forwarding](/observability/audit-and-syslog) |
| **License** | License activation and status. | [Licensing](/administration/licensing) |
| **Maintenance** | Backup/restore and maintenance tooling. | [Backup & Restore](/administration/backup-restore) |

:::note[2FA lives on your Profile]
Two-factor auth (TOTP) is managed per user under **Profile**, not Settings. Project-enforced 2FA is toggled from Settings, but enrollment is personal. See [Authentication & Access](/administration/auth-and-access#two-factor-authentication-2fa--otp).
:::

## The General tab

General is the platform's at-a-glance status page — version identity, live storage, and appearance.

### Version hero

A banner surfaces the three versions that define what this deployment can manage:

- **UI Version** — the frontend build.
- **API Version** — the Controller/backend version (from the license status).
- **Envoy Builds** — the count of supported Envoy versions this control plane can manage.

A **Supported Envoy Versions** card below lists each build as a tag. This is the set the control plane can compile and validate config against — see [Supported Envoy Versions](/reference/envoy-versions) for the versioning model.

### Storage usage

A live **Storage** card (Owner/Admin-gated, same as the backing endpoint) shows real ClickHouse + MongoDB usage and a retention-window projection, polled every 30 seconds. It is backed by `GET /api/v3/setting/storage-stats`, which measures usage live from each store's system tables.

**ClickHouse** (the request-volume-bound store):

- **Used now** — on-disk bytes, split into **Discovery** (`api_events`) and **Security** (Shield audit).
- **Written last 1h** and the **24h average/day** rate.
- **Projected Nd** — the steady-state size the TTL'd tables converge to at the current rate (default **7-day** window, matching the collector's `RETENTION_DAYS` and Shield's audit TTL).
- **Free disk**, a used/total bar with a reserve marker, and a **fit** verdict — whether the projected steady state fits in free disk, with the headroom (or shortfall).

**MongoDB** (the cardinality-bound store — it grows with distinct endpoints, not traffic):

- **Storage** (data + index bytes).
- **Inventory endpoints** — the `api_inventory` document count, plus **new in the last 1h / 24h** as the meaningful growth signal.

If ClickHouse isn't configured the card degrades gracefully — MongoDB stats still render and ClickHouse is marked unavailable.

:::info[Two stores, two growth models]
ClickHouse grows with **req/s** but is TTL-capped, so it converges to a steady-state size. MongoDB grows with **distinct endpoints** and has no TTL (it is cardinality-capped instead). The General tab shows both so you can size disk against the right signal for each. Full schema detail: [Collector Reference](/api-discovery/collector-reference).
:::

### Appearance

A Light / Dark / System theme toggle, applied immediately and remembered per browser.

## See also

- [Authentication & Access](/administration/auth-and-access) — the roles, projects, tokens, LDAP, and 2FA behind most tabs.
- [Security Model](/administration/security-overview) — where each secret configured here is stored and trusted.
- [Supported Envoy Versions](/reference/envoy-versions) — the build set shown in the version hero.
