---
title: Threat Intelligence & GeoIP
description: Upload threat feeds and GeoIP MMDB databases to enrich API Discovery with reputation and location context.
sidebar_position: 3
---

These data sources enrich API Discovery and the collector with reputation and location context.

- **Threat Intelligence** — upload and manage threat feeds under **Settings → Threat Intel**; matching traffic is flagged in the inventory and risk views.
- **GeoIP** — upload or download MMDB databases under **Settings → GeoIP** to resolve client IPs to country, ASN, and geo for the consumer and geo dashboards.

:::info[Why it matters]
Without GeoIP and threat data, the [geo, consumer, and risk](/api-discovery/overview) views still work but show less context. Loading these databases makes them far more actionable.
:::
