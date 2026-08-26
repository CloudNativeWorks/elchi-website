---
title: Licensing
description: View, activate, re-validate, and remove license keys, and the egress the license API requires.
sidebar_position: 5
---

License status is shown as a badge in the header and managed under **Settings → License**. From there you can:

- **View status** — current entitlement and validity (available to any signed-in user).
- **Activate** a license key (Admin/Owner).
- **Force a check** to re-validate immediately (Admin/Owner).
- **Remove** the active license (Admin/Owner).

## What a license controls

Today the license gates the **number of clients (edge nodes) that may be concurrently connected** to the controller:

| Plan | Concurrent clients |
|------|--------------------|
| Free (no license) | 1 |
| Advance | 5 |
| Enterprise | Unlimited |

All platform features run on every plan — the free tier is the full platform limited to a single managed client. When a client connects beyond the plan's cap, the connection is rejected with a `license limit reached` error; removing a license (or an expired/invalid one) reverts the platform to the free tier.

Per-product licensing for the add-on modules ([API Security](/shield/overview), [API Discovery](/api-discovery/overview), [GSLB](/gslb), [WAF](/waf)) is planned but not yet enforced by the platform.

## Activation

Activation requires **both** a `license_key` and an `api_key`, entered together under **Settings → License**. Activation and the periodic re-validation checks are **online** — the controller must reach the license API. A transient network failure during a periodic check does not downgrade the platform; only an explicit invalid/expired result does.

:::info[Required egress]
License activation and periodic checks need outbound access to the Elchi license API — see the egress allow-list in [Network & Access](/getting-started/network-access).
:::
