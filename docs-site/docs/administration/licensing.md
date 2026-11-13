---
title: "Licensing: Activate and Manage License Keys"
sidebar_label: "Licensing"
description: "View, activate, re-validate and remove Elchi license keys, the free tier (Elchi Core with one managed client), and the access the license API needs."
sidebar_position: 5
---

License status is shown as a badge in the header and managed under **Settings → License**. From there you can:

- **View status** — current entitlement and validity (available to any signed-in user).
- **Activate** a license online with a license key, or offline with a license file (Admin/Owner).
- **Force a check** to re-validate an online license immediately (Admin/Owner).
- **Remove** the active license (Admin/Owner).

## How Elchi is licensed

Elchi licensing has two dimensions:

- **Managed clients** — the number of clients (edge nodes) that may be concurrently connected to the controller.
- **Products** — [Elchi Core](https://www.elchi.io/products/core.html) is the base of every deployment; the add-on products ([API Security](/shield/overview) with its built-in WAF, [API Discovery](/api-discovery/overview), [GSLB](/gslb)) are licensed individually on top of it.

Without a license the platform runs the **free tier: Elchi Core with a single managed client** — ideal for evaluation. When a client connects beyond the licensed cap, the connection is rejected with a `license limit reached` error; removing a license (or an expired/invalid one) reverts the platform to the free tier.

Each member of an [HA pair](/ha-pairs/overview) is a client, so a full pair uses **two** client slots (a pair in HA mode, with one member, uses one). A pair member that is temporarily away (rebooting or disconnected) keeps its slot, and it is let back in when it returns even if the cap is reached.

:::note
Per-product entitlements are being rolled out; on current releases the enforced limit is the concurrent client count.
:::

## Activation

Activation requires **both** a `license_key` and an `api_key`, entered together under **Settings → License**. Activation is **online**: the controller must reach the license API. The license server signs its answer and the controller stores it with the license.

After that the license API is asked only when a controller starts (and when you press re-check). If it cannot be reached, the stored signed answer keeps the license in force until its expiry date, however long the outage lasts. When the expiry date passes the platform falls back to the free tier; if the license was renewed, the controller picks that up with one check at that moment. Only a signed invalid answer (for example a suspended license) downgrades the platform earlier. Editing the stored license in the database does not change the plan: the plan comes from the signed answer.

:::info[Required egress]
License activation and the check at controller start need outbound access to the Elchi license API — see the egress allow-list in [Network & Access](/getting-started/network-access). An offline license needs no outbound access.
:::

## Offline license

For installations without internet access, CloudNativeWorks issues a **license file** (a signed JSON document). Under **Settings → License → Activate license**, choose **Offline (license file)** and select the file or paste its content.

- The controller verifies the file's signature with the license server key built into Elchi; an edited file is refused.
- The file must be an Elchi license; a license file of another CloudNativeWorks product is refused.
- The license API is never contacted. The plan is in force until the expiry date in the file, then the platform falls back to the free tier. To renew, upload the new file.
- Activating an offline license replaces an online one, and the other way round.
- The file is stored encrypted, like the license and API keys.

