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

## How Elchi is licensed

Elchi licensing has two dimensions:

- **Managed clients** — the number of clients (edge nodes) that may be concurrently connected to the controller.
- **Products** — [Elchi Core](https://www.elchi.io/products/core.html) is the base of every deployment; the add-on products ([API Security](/shield/overview), [API Discovery](/api-discovery/overview), [GSLB](/gslb), [WAF](/waf)) are licensed individually on top of it.

Without a license the platform runs the **free tier: Elchi Core with a single managed client** — ideal for evaluation. When a client connects beyond the licensed cap, the connection is rejected with a `license limit reached` error; removing a license (or an expired/invalid one) reverts the platform to the free tier.

:::note
Per-product entitlements are being rolled out; on current releases the enforced limit is the concurrent client count.
:::

## Activation

Activation requires **both** a `license_key` and an `api_key`, entered together under **Settings → License**. Activation and the periodic re-validation checks are **online** — the controller must reach the license API. A transient network failure during a periodic check does not downgrade the platform; only an explicit invalid/expired result does.

:::info[Required egress]
License activation and periodic checks need outbound access to the Elchi license API — see the egress allow-list in [Network & Access](/getting-started/network-access).
:::
