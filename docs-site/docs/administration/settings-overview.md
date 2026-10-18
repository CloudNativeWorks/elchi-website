---
title: Settings & the General Tab
description: An orientation to the Settings area — the full tab set with links to each feature's doc, and the General tab's installation versions, Envoy versions list and live storage-usage card.
sidebar_position: 10
tags: [administration, settings]
---

**Settings** is the platform's administrative console. The whole surface defaults to **Admin/Owner only** (with narrow read carve-outs), so most tabs are gated by [role](/administration/auth-and-access#roles-rbac). This page orients you to the tab set and covers the **General** tab in detail.

## The tab set

Settings is a set of tabs, each an entry point to one management area. Most map to a dedicated doc:

| Tab | What it does | Docs |
|---|---|---|
| **General** | Installation versions, the Envoy versions list, theme, live storage usage. | This page ↓ |
| **Users** | Create/manage users, roles, and base projects. Hidden when the UI runs in demo mode. | [Authentication & Access](/administration/auth-and-access#roles-rbac) |
| **Groups** | Group membership for resource permissions. | [Authentication & Access](/administration/auth-and-access) |
| **Projects** | The tenancy boundary — create/manage projects and members (Owner-only). | [Authentication & Access](/administration/auth-and-access#projects) |
| **AI** | The per-project OpenRouter key for AI features. | [AI Analysis](/administration/ai-analysis) |
| **Tokens** | API/client tokens and the per-project discovery token. | [Authentication & Access](/administration/auth-and-access#tokens) |
| **Clouds** | OpenStack cloud registration. | [Cloud & OpenStack](/administration/cloud-openstack) |
| **LDAP** | Directory (LDAP/AD) login configuration, per project. | [Authentication & Access](/administration/auth-and-access#ldap--active-directory) |
| **GSLB** | GSLB zone defaults and the DNS zone secret. | [GSLB Nodes & CoreDNS](/gslb/nodes-coredns) |
| **API Discovery** | Runtime config for the discovery collector. | [API Discovery](/api-discovery/overview) |
| **Audit Forwarding** | Forward the audit trail to a SIEM over syslog. | [Audit & Syslog Forwarding](/observability/audit-and-syslog) |
| **License** | License activation and status. | [Licensing](/administration/licensing) |
| **Maintenance** | Backup/restore and maintenance tooling. | [Backup & Restore](/administration/backup-restore) |

When the window is too narrow for every tab, a **⋮** button (**All tabs**) at the right of the tab strip opens a menu listing all of them.

:::note[2FA lives on your Profile]
Two-factor auth (TOTP) is managed per user under **Profile**, not Settings. Project-enforced 2FA is toggled from Settings, but enrollment is personal. See [Authentication & Access](/administration/auth-and-access#two-factor-authentication-2fa--otp).
:::

## The General tab

General is the platform's at-a-glance status page — version identity, the Envoy versions, appearance and live storage.

### This installation

The top panel names the installation and shows three figures:

- **Interface** — the frontend build (the UI's configured `VERSION`).
- **Backend** — the Controller/backend version (from the license status).
- **Envoy versions** — how many Envoy versions this control plane configures.

### Envoy versions

The **Envoy versions** panel ("The proxy versions this control plane configures.") lists each version, newest first, and marks the highest one **Newest**. Every listener, cluster and route is built for one of these versions; **Upgrade** moves a resource to a newer version: for listeners from the list header, for other resources from the row menu (when more than one version is configured) — see [Versions & Upgrades](/envoy-configuration/versions-and-upgrades) for the versioning model.

### Storage

A live **Storage** card (Owner/Admin-gated, same as the backing endpoint) shows what ClickHouse and MongoDB use now and where ClickHouse settles once its retention window is full. It polls every 30 seconds while the General tab is open, and **Refresh** reloads it on demand. It is backed by `GET /api/v3/setting/storage-stats`, which measures usage live from each store's system tables.

The headline figures:

- **Used now** — ClickHouse on disk plus MongoDB storage.
- **Written in the last hour** — ClickHouse (raw events, audit and rollups), estimated from the current bytes per row.
- **Size at N days** — the size the time-limited tables settle at, from the last 24 hours' average rate (default **7-day** window, matching the collector's `RETENTION_DAYS` and Shield's audit TTL).
- **Free disk** — free space on the ClickHouse data disk, shown green or red depending on whether the projected size fits.

Below them, a disk bar (`Disk: <used> of <total> used`, plus the **Kept free** reserve) and a verdict line — the N-day size fits with a given amount to spare, or needs a given amount more than the free disk.

**ClickHouse** breakdown: **API discovery events**, **Shield audit**, **Total**, and **Last 24 hours** (average per day).

**MongoDB** breakdown (the cardinality-bound store — it grows with distinct endpoints, not traffic): **On disk** (compressed), **Data and indexes** (uncompressed), **API inventory** (the endpoint count across all projects, unconfirmed included) and **New endpoints** in the last hour and 24 hours.

If ClickHouse isn't reachable, its heading is marked **Unavailable** and the MongoDB figures still render.

:::info[Two stores, two growth models]
ClickHouse grows with **req/s** but is TTL-capped, so it converges to a steady-state size. MongoDB grows with **distinct endpoints** and has no TTL (it is cardinality-capped instead). The General tab shows both so you can size disk against the right signal for each. Full schema detail: [Collector Reference](/api-discovery/collector-reference).
:::

### Appearance

A **Light** / **Dark** / **System** theme choice, applied immediately and saved in this browser only. **System** follows the operating system's dark or light setting.

## See also

- [Authentication & Access](/administration/auth-and-access) — the roles, projects, tokens, LDAP, and 2FA behind most tabs.
- [Security Model](/administration/security-overview) — where each secret configured here is stored and trusted.
- [Versions & Upgrades](/envoy-configuration/versions-and-upgrades) — the versioning model behind the Envoy versions shown on the General tab.
