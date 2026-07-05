---
title: Threat Intelligence & GeoIP
description: The elchi-collector enrichment chain — GeoIP, User-Agent classification, and Mongo-backed threat-intel feeds that add geo, reputation, and bot context to API Discovery.
sidebar_position: 11
tags: [api-discovery, collector]
---

Between path normalization and risk evaluation, every event the [collector](/api-discovery/collector-reference) ingests passes through an ordered **enrichment chain**. Each enricher is an in-process lookup that can add `tags` (persisted as the `tags` map in ClickHouse) and append risk flags. This is what turns a bare access-log line into an event that knows its client's country, whether the User-Agent is a scanner, and whether the source IP is on a blocklist — the context behind the geo, consumer, bot, and risk views in [API Discovery](/api-discovery/overview).

The chain runs synchronously on the hot path, with a per-enricher timeout (`ENRICHER_TIMEOUT`, default 50ms) so one slow lookup can't starve the rest. Registration order matters: a later enricher sees earlier enrichers' tags, so GeoIP runs first and downstream rules can branch on `geo.country`. Failures are observable via `enrich_errors_total{enricher}` — the pipeline continues with whatever the enricher managed to set.

## The three enrichers

### GeoIP

An MMDB-based country / ASN / city resolver. The database is a MaxMind GeoLite2 or a db-ip.com Lite file (both share the MMDB schema); the collector mmaps it for sub-microsecond lookups. Internal IPs (RFC1918 / loopback / link-local) short-circuit before the lookup — `geo.kind=internal` is set and country/ASN/city are omitted.

| Tag | Source | Example |
| --- | --- | --- |
| `geo.kind` | address shape | `internal` / `external` |
| `geo.continent` | City DB | `EU` / `NA` / `AS` |
| `geo.country` | City DB (ISO-3166-1 α-2) | `TR` |
| `geo.country_name` | City DB (English) | `Turkey` |
| `geo.city` | City DB | `Istanbul` |
| `geo.asn` | ASN DB | `13335` |
| `geo.asn_org` | ASN DB | `Cloudflare, Inc.` |
| `geo.asn_type` | ASN DB | `hosting` (when the ASN is a known cloud/datacenter provider; absent otherwise) |

:::info[The MMDB databases come only from MongoDB GridFS]
There is no operator-placed file and no on-disk fallback. The backend uploads the city/asn databases to a GridFS bucket (`GEOIP_GRIDFS_BUCKET`, default `geoip`); every collector replica syncs them into `GEOIP_CACHE_DIR` and hot-reloads on every later upload. One backend upload fans out to the whole fleet. If the bucket holds no database, **GeoIP is simply off** — `geo.kind` is still tagged, but no country/ASN. A fresh deploy against an empty bucket starts fine and lights up GeoIP the moment a database is uploaded.
:::

Point `GEOIP_CACHE_DIR` at a stable, writable, persistent path in production — the syncer then skips the ~100 MB re-download on restart when the cached file's hash already matches GridFS. Downloads are atomic (temp file + rename), so a concurrent reader never sees a half-written file. The databases can also be swapped in place with a `SIGHUP` (`kill -HUP $(pgrep -f elchi-collector)`), which reloads the readers behind an `atomic.Pointer` with a 5s grace window — no restart, no traffic interruption.

### User-Agent classifier

A stateless regex matcher over the raw User-Agent header. It runs unconditionally (no env switch, no external dependency) and its pattern list is prioritized security-first, so a scanner masquerading as Mozilla is still classified as `scanner`.

| `ua.kind` | Examples |
| --- | --- |
| `scanner` | sqlmap, Nuclei, Nikto, OWASP ZAP, BurpSuite, masscan, Nmap, ffuf, Acunetix, Nessus, … |
| `bot` | Googlebot, Bingbot, AhrefsBot, SemrushBot, generic crawlers |
| `monitor` | uptime/monitoring agents — Pingdom, UptimeRobot, StatusCake, … |
| `sdk` | curl, wget, python-requests, aiohttp, go-http, okhttp, axios, Postman, … |
| `cli` | HTTPie, k6, vegeta, siege, apachebench |
| `browser` | Chrome, Firefox, Safari, Edge, Opera |
| `empty` / `unknown` | UA header absent / nothing matched |

It emits `ua.kind` and `ua.family` (the tool/agent name when classifiable). A `scanner` classification also raises the `scanner_user_agent` risk flag. This is what powers the **Bot & Scanner** dashboard; `uaclass_classifications_total{kind}` lets you alert on scanner-UA fraction without a ClickHouse query.

### Threat-intel feeds

CIDR / IP blocklists matched against each event's source IP — a Spamhaus DROP list, an AbuseIPDB snapshot, a hand-curated red-team list, anything that fits the format. It is **multi-feed**: the config doc holds an array of named feeds, each matched independently, and an IP present in multiple feeds gets a comma-joined `ti.source`.

| Tag / flag | Value |
| --- | --- |
| `ti.hit` | `"true"` |
| `ti.source` | feed name(s), comma-joined when multiple feeds claim the IP |
| risk flag | `threat_intel_hit` (Critical severity, score 10) |

:::info[Mongo-backed, not file-backed]
Feeds live in the `api_collector_threatintel` singleton document, managed by the backend (typically by parsing an operator-uploaded file). The collector polls the doc on the `RUNTIME_CONFIG_POLL_INTERVAL` cadence and hot-swaps the compiled blocklists into the enricher's `atomic.Pointer` — a single backend update fans out to every replica with no per-host file distribution, and swapping feeds does **not** rebuild the pipeline or reset detector state. An empty or missing feed doc is a zero-cost no-op (the legitimate "no current threats" state).
:::

## Uploading feeds and databases

Both enrichers are fed from the UI under **Settings → API Discovery**, where the threat-intel and GeoIP sections sit below the collector config. The forms call the backend, which owns the GridFS bucket and the Mongo feed doc; the collector picks up changes on its ~2-minute poll (GeoIP via GridFS sync, feeds via the config poll). All mutations are restricted to Admin / Owner roles.

### Threat-intel feeds

The threat-intel section manages the `api_collector_threatintel` singleton (shown with its `version` and last-updated attribution).

| Action | API call | Notes |
| --- | --- | --- |
| List feeds | `GET /api/v3/setting/threat-intel` | Returns `{ version, updated_at, updated_by, feeds: [{name, enabled, entry_count}] }`. |
| View a feed's entries | `GET /api/v3/setting/threat-intel/{name}` | Full `{name, enabled, entries[]}` (the viewer caps rendering at 2000 rows). |
| Upload a feed | `POST /api/v3/setting/threat-intel/upload` | Multipart form with `name` + `file`; returns `{ added, skipped, feed }`. |
| Enable / disable / replace | `PUT /api/v3/setting/threat-intel` | Whole-replace of `feeds[]` (each `{name, enabled, entries}`). |
| Delete a feed | `DELETE /api/v3/setting/threat-intel/{name}` | |

The **Upload feed** modal takes a feed name (e.g. `spamhaus-drop`) and a drag-and-drop blocklist file — one IPv4/IPv6 address or CIDR per line, with `#` comments and blank lines ignored. Unparseable lines are counted and skipped in aggregate; one bad entry never rejects the whole feed. A feed can be muted with the **Enabled** switch (`enabled: false`) without dropping its entries. Loaded entry counts per feed are exported as `threatintel_feed_entries{feed}`, which catches silent feed shrinkage.

### GeoIP databases

The GeoIP section manages two MMDB databases in GridFS, `city` and `asn`, each shown with its size, source, uploader, and SHA-256.

| Action | API call | Notes |
| --- | --- | --- |
| List databases | `GET /api/v3/setting/geoip` | Returns `{ databases: [{kind, present, size, sha256, source, uploaded_by, upload_date}] }`. |
| Upload an `.mmdb` | `POST /api/v3/setting/geoip/upload` | Multipart form with `kind` (`city`/`asn`) + `file`; the backend verifies it is a real MaxMind DB whose type matches `kind`. |
| Fetch db-ip Lite | `POST /api/v3/setting/geoip/download` | Body `{ kind }`; the backend fetches the free db-ip Lite database server-side. |
| Delete a database | `DELETE /api/v3/setting/geoip/{kind}` | |

Each card offers **Download db-ip Lite** (fetch the free database automatically), **Upload .mmdb** (bring your own paid MaxMind file, up to 256 MiB), and **Delete**. Uploads and downloads run with a 5-minute timeout to accommodate the large files. Once a database lands in GridFS, every collector replica syncs it and lights up geo enrichment on the next poll.

## Where this fits in the platform

This enrichment chain is **collector-side** — it annotates *observed* traffic for the API Discovery inventory and risk views. It is distinct from [Shield's `ip_reputation` engine](/shield/overview), which is an *edge-side enforcement* control that blocks requests inline at the Envoy `ext_proc` sidecar. They are complementary: the collector tells you which discovered endpoints are being probed from a flagged IP; Shield stops those requests before they reach the backend. The admin/configuration surface for both — feed uploads, GeoIP databases, and how they are shared across the platform — is covered in [Threat Intelligence & GeoIP administration](/administration/threat-intel-geoip).

## See also

- [Collector Configuration](/api-discovery/collector-configuration) — the runtime policy/detection document and the poll cadence feeds share.
- [Collector Reference](/api-discovery/collector-reference) — `GEOIP_*`, `ENRICHER_TIMEOUT`, the `tags` schema, and enrichment metrics.
- [PII & Auth](/api-discovery/pii-and-auth) — the detection signals enrichment tags feed into.
- [Threat Intelligence & GeoIP administration](/administration/threat-intel-geoip) — platform-level upload and sharing.
