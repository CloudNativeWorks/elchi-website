---
title: "Threat Intel & GeoIP Settings"
sidebar_label: "Threat Intelligence & GeoIP"
description: "Load threat-intel blocklists and GeoIP MMDB databases under Settings → API Discovery so API Discovery can tag traffic with reputation, country and ASN."
sidebar_position: 3
---

Elchi enriches the traffic that API Discovery observes with two kinds of reference data that you load as an administrator:

- **Threat-intel feeds**: lists of IP addresses and CIDR ranges (a Spamhaus DROP list, an AbuseIPDB export, your own red-team list). A request from a listed address is tagged with the feed name and raises the critical `threat_intel_hit` risk flag.
- **GeoIP databases**: a **City** and an **ASN** database in MaxMind MMDB format. They resolve each client IP to continent, country, city, ASN and network owner for the geo, consumer and risk views.

Both are managed under **Settings → API Discovery**, in the **Threat Intel** and **GeoIP** sections below the collector configuration. Only the **Owner** and **Admin** roles can change them. This page is the administrator's checklist; how the collector applies the data, and the tags it writes, is in [Threat Intel & GeoIP in API Discovery](/api-discovery/threat-intel-geoip).

## Scope: platform-wide

Feeds and databases are **global**. They are stored once (the feeds in the MongoDB document `api_collector_threatintel`, the databases in the MongoDB GridFS bucket `geoip`) and apply to every project. Every collector replica picks up a change on its next poll, about every two minutes, without a restart, so one upload covers the whole fleet.

## Load GeoIP databases

The GeoIP section shows one card each for `city` and `asn`, with the size, source, uploader and SHA-256 of the database in use. For each card you can:

- **Download db-ip Lite**: the backend fetches the free db-ip.com Lite database for the current month (falling back to the previous month) and stores it. The backend needs outbound HTTPS to `download.db-ip.com`.
- **Upload .mmdb**: bring your own file, for example a paid MaxMind GeoIP2 or a GeoLite2 database, up to **256 MiB**. The backend checks that it is a valid MaxMind database of the right type (City for `city`, ASN for `asn`) before storing it.
- **Delete**: remove the database.

Downloads and uploads can take a while for large files; the backend allows them up to five minutes. Without a database, GeoIP is simply off: traffic is still marked internal or external, but gets no country or ASN. The ASN database also drives the hosting/VPN signal of the `impossible_travel` detector.

Plan to refresh the databases regularly (db-ip publishes its Lite databases monthly), since IP allocations change over time.

## Load threat-intel feeds

Click **Upload feed**, give the feed a name (for example `spamhaus-drop`) and drop a text file with one IPv4 or IPv6 address or CIDR range per line. Blank lines and `#` comments are ignored. Lines that do not parse are skipped and counted; one bad line never rejects the whole file.

| Limit | Value |
| --- | --- |
| Entries per feed | 250,000 |
| Entries across all feeds | 600,000 |

Uploading a feed under an existing name replaces it. In the feed list you can view a feed's entries, mute it with the **Enabled** switch without losing its entries, or delete it. When an address is on several feeds, the event lists all of them.

To keep a feed current, re-upload it on a schedule, either by hand or by calling the API from a job.

## Automating updates

The same operations are available on the controller API for an Owner or Admin session:

| Task | Call |
| --- | --- |
| List feeds | `GET /api/v3/setting/threat-intel` |
| Upload or replace a feed | `POST /api/v3/setting/threat-intel/upload` (multipart: `name`, `file`) |
| Enable, disable or replace all feeds | `PUT /api/v3/setting/threat-intel` |
| Delete a feed | `DELETE /api/v3/setting/threat-intel/{name}` |
| Show GeoIP databases | `GET /api/v3/setting/geoip` |
| Upload a database | `POST /api/v3/setting/geoip/upload` (multipart: `kind` = `city` or `asn`, `file`) |
| Fetch db-ip Lite | `POST /api/v3/setting/geoip/download` (body `{"kind": "city"}`) |
| Delete a database | `DELETE /api/v3/setting/geoip/{kind}` |

Request and response shapes are in [Threat Intel & GeoIP in API Discovery](/api-discovery/threat-intel-geoip#uploading-feeds-and-databases).

## Detection, not blocking

These feeds tag and score traffic in API Discovery; they do not block anything. To drop requests from bad addresses at the edge, use Shield's [IP reputation engine](/shield/engines/ip-reputation), which enforces inline in the Envoy `ext_proc` sidecar and has its own address lists.

:::info[Why it matters]
Without GeoIP and threat data, the [geo, consumer, and risk](/api-discovery/overview) views still work but show less context. Loading these databases makes them far more actionable.
:::
