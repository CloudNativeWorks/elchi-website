---
title: IP Reputation
description: Source-IP blocking by CIDR allow/deny lists, disk threat-intelligence feeds, and GeoIP country/ASN rules.
sidebar_position: 8
tags: [shield, engine]
---

The `ip_reputation` engine blocks or admits requests by **source IP**: explicit CIDR deny lists, an allow list that flips the policy to default-deny, threat-intelligence feed files, and GeoIP country/ASN rules. It protects against known-bad networks, botnet/scanner ranges, and geography- or ASN-based abuse. It is a **header-phase, request-only** engine — the body is never buffered for it — and every lookup is a lock-free, allocation-free prefix-trie match compiled at config load.

## When to use it

- Drop traffic from known-bad networks (Spamhaus DROP, FireHOL, your own blocklists) before any expensive inspection runs.
- Restrict an admin or partner surface to corporate ranges (`allow_cidrs` default-deny).
- Enforce geo policy: block sanctioned countries or specific ASNs, or allow only a fixed set of countries.
- As the cheapest first line in a layered policy — combine with [rate limiting](/shield/engines/rate-limit) and [bot detection](/shield/engines/bot-detection).

## Configuration

| Field | Type | Required | Purpose |
|---|---|---|---|
| `allow_cidrs` | string[] (CIDR) | — | When **non-empty**, the policy is **default-DENY**: a source IP not in any allow prefix is blocked. |
| `deny_cidrs` | string[] (CIDR) | — | Explicitly blocked prefixes. |
| `feeds` | `FeedSpec`[] | — | Disk threat-intel feeds (block lists). |
| `geoip` | `GeoIPSpec` | — | Country/ASN blocking. |

At least one of `allow_cidrs` / `deny_cidrs` / `feeds` / `geoip` is required. Precedence: explicit `deny` wins, then `allow` (default-deny), then feeds, then geo.

### `FeedSpec`

| Field | Type | Required | Default | Allowed |
|---|---|---|---|---|
| `name` | string | yes | — | Identifies the feed in reasons/metrics. |
| `file` | string | yes | — | Feed file path (written by the management plane; never network-fetched). |
| `format` | string | yes | — | `cidr_lines` \| `firehol_netset` \| `spamhaus_json`. |
| `severity` | string | no | `medium` | `low` \| `medium` \| `high` \| `critical`. |

### `GeoIPSpec`

| Field | Type | Required | Default | Allowed / notes |
|---|---|---|---|---|
| `database_file` | string | one-of | — | MaxMind GeoLite2/GeoIP2 **Country** `.mmdb`. |
| `asn_database_file` | string | one-of | — | MaxMind **ASN** `.mmdb`. |
| `block_countries` | string[] | — | — | ISO 3166-1 alpha-2 codes to block (e.g. `["KP","RU"]`). |
| `allow_countries` | string[] | — | — | When **non-empty**, geo is **default-DENY**: any other country is blocked. |
| `block_asns` | uint[] | — | — | Autonomous system numbers to block. |
| `on_missing` | string | no | `continue` | `continue` \| `block` — behavior for an IP absent from the DB. |

Rules: one of `database_file` / `asn_database_file` is required; at least one of `block_countries` / `allow_countries` / `block_asns` / `on_missing: block`. A country in **both** block and allow lists is rejected at load.

## Example

```yaml
apiVersion: sentinel.elchi.io/v1
kind: SecurityPolicy
metadata:
  name: api-ipreputation
spec:
  defaults:
    mode: block
    fail_mode: fail_open

  domains:
    - hosts: ["edge.example.com"]
      routes:
        # Block known-bad networks + threat feeds. A match is a 403.
        - match:
            path_prefix: "/v1/"
          policy:
            mode: block
            engines:
              ip_reputation:
                deny_cidrs:
                  - "192.0.2.0/24"
                  - "198.51.100.7/32"
                  - "2001:db8:bad::/48"
                feeds:
                  - name: spamhaus_drop
                    file: "/etc/elchi/elchi-shield/feeds/spamhaus_drop.json"
                    format: spamhaus_json     # cidr_lines | firehol_netset | spamhaus_json
                    severity: high            # low | medium | high | critical
                  - name: firehol_level1
                    file: "/etc/elchi/elchi-shield/feeds/firehol_level1.netset"
                    format: firehol_netset
                    severity: medium

        # Allow-list (default-DENY): only corporate ranges may reach /admin.
        # Start in detect mode to avoid locking yourself out, then switch to block.
        - match:
            path_prefix: "/admin/"
          policy:
            mode: detect
            engines:
              ip_reputation:
                allow_cidrs:
                  - "10.0.0.0/8"
                  - "203.0.113.0/24"

        # GeoIP / ASN blocking via MaxMind databases (files distributed by the
        # management plane). Evaluated after CIDR/feed rules.
        - match:
            path_prefix: "/checkout/"
          policy:
            mode: block
            engines:
              ip_reputation:
                geoip:
                  database_file: "/etc/elchi/elchi-shield/geo/GeoLite2-Country.mmdb"
                  asn_database_file: "/etc/elchi/elchi-shield/geo/GeoLite2-ASN.mmdb"
                  block_countries: ["KP", "RU"]
                  block_asns: [64512]
                  on_missing: continue
```

## How it decides

Evaluation is cheapest-decisive-first and short-circuits:

0. **Unparseable source IP:** if an allow list is configured ⇒ block `ipreputation.not_allowlisted` (an unidentifiable client can't be allow-listed); otherwise continue. The IP is then unmapped (IPv4-in-IPv6 → IPv4).
1. **Deny CIDRs** ⇒ block `ipreputation.deny_cidr`. **Deny always wins**, even over allow.
2. **Allow CIDRs ⇒ default-DENY mode.** If *any* `allow_cidrs` entry is set, an allow-listed (and not denied) IP is treated as **trusted and short-circuits to ALLOW** — skipping feeds and geo. Anything else ⇒ block `ipreputation.not_allowlisted`.
3. **Threat feeds** (only reached when no allow list is configured) ⇒ block `ipreputation.feed:<name>` with the feed's configured severity (default medium).
4. **GeoIP:** a blocked country ⇒ block `ipreputation.geo_country:<CC>`; a blocked ASN ⇒ block `ipreputation.geo_asn:<n>`. When a country **allow list** is set (default-deny), any IP whose country isn't allowed is blocked — this **includes an IP absent from the database entirely** (no confirmable country ⇒ not allow-listed ⇒ blocked, reason `ipreputation.geo_country:unknown`), consistent with an ASN-only hit. Otherwise (no allow list) a total DB miss follows `on_missing` (`continue` default \| `block`, reason `ipreputation.geo_unknown`). All geo blocks are 403.

All block reasons are prefixed `ipreputation.` — grep audit logs for the full id (e.g. `ipreputation.deny_cidr`), not the bare suffix.

A GeoIP **lookup error propagates** so the policy `fail_mode` governs it — it is never silently allowed. See [Modes & Fail Postures](/shield/policies/modes-and-postures).

## Envoy prerequisites

Every decision here keys on the **trusted-hop-derived source IP**, never the spoofable leftmost `X-Forwarded-For` token. For that IP to be trustworthy:

- Envoy must run with **`use_remote_address: true`** so it appends the real peer address to XFF.
- Set Shield's **`--xff-trusted-hops`** to the exact number of trusted proxies (LB/CDN) in front of Envoy. Too low and you trust a hop the attacker controls; too high and the derivation clamps toward the client-controlled left.

See [Envoy wiring](/shield/envoy-wiring) for the full setup.

## Verify

From a permitted source, the request passes:

```bash
curl -i http://edge.example.com/v1/status
# HTTP/1.1 200 OK
```

To confirm blocking, temporarily add your own egress IP to `deny_cidrs` (as a `/32`) and reload:

```bash
curl -i http://edge.example.com/v1/status
# HTTP/1.1 403 Forbidden
```

The audit finding carries the reason (`ipreputation.deny_cidr`, `ipreputation.not_allowlisted`, `ipreputation.feed:<name>`, or a `ipreputation.geo_*` id) and `findings_total{engine="ipreputation"}` increments. Remove the test entry afterwards.

## Gotchas

:::warning
**`allow_cidrs` is a hard switch to default-deny** — *and* it suppresses feeds and geo for allow-listed IPs. Any source not covered by the allow list is blocked, so it is easy to lock out all unmatched legitimate traffic (including yourself). Roll it out in `detect` mode first and watch `detections_total` before switching to `block`.
:::

:::warning
**Pair a country allow list with `fail_close`.** A GeoIP lookup error propagates to the policy fail posture — a `fail_open` policy with `allow_countries` (positive security) will fail *open* on a corrupt-DB read, silently admitting everything the allow list was supposed to exclude.
:::

- Feed files are **fully trusted** — whoever writes them controls the blocklist. A malformed feed line **aborts the whole reload** (fail-loud); the last-good config stays active.
- Feeds and geo are **skipped entirely** for allow-listed IPs — a trusted range is trusted, full stop.

Related engines: [Rate limiting](/shield/engines/rate-limit), [Bot detection](/shield/engines/bot-detection).
