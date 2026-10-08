---
title: PII, Auth & Consumers
description: How API Discovery detects PII in paths and query strings (including Turkish national ids and mobile numbers), the per-detector switches, credential parameter names, auth-scheme and consumer inference, and the metadata-only privacy model.
sidebar_position: 6
tags: [api-discovery]
---

API Discovery enriches every operation with what it can *observe* from traffic metadata: whether sensitive data is leaking into URLs, whether the endpoint is authenticated, and which consumers are calling it. All of it is derived from metadata alone — the collector never persists request bodies or query-string values, and it hashes the identifiers it keeps. This page covers PII, auth and consumer identity, and the privacy model underneath them.

:::info[Where this data comes from]
These signals are produced by **elchi-collector** as it ingests Envoy access logs (ALS). See [Overview](/api-discovery/overview) for the pipeline, and [Collector Configuration](/api-discovery/collector-configuration) for the knobs referenced below.
:::

## PII detection

When `detection.detect_pii` is on (the default), the collector scans the request **path and query string** twice: first the percent-decoded raw URL *before* templating (so a value in a segment that normalization turns into `{id}`, or a `?email=…` in the query, is still seen), then the templated path. Headers and bodies are not scanned (ALS carries no bodies).

A matching path segment is stored as `{pii}`; query values are never stored at all. Only the **category** is recorded:

| Category | Example detected |
|---|---|
| `email` | `user@example.com` |
| `phone` | `+1 415 555 1212`, `(415) 555-1212` |
| `phone` (Turkish mobile) | `0 (532) 123 45 67`, `+90 532 123 4567`, `0090 5321234567`; bare `5321234567` / `905321234567` only under a phone-like name (`?gsm=…`, `/gsm/…`) |
| `ssn` | `123-45-6789` |
| `credit_card` | `4111 1111 1111 1111` |
| `iban` | `TR32 0010 0099 9990 1234 5678 90` |
| `tr_national_id` | `?tckn=10000000146`, `/kimlik/10000000146` (checksum-valid, named) — or endpoint-level, see below |
| `secret_in_path` | a leaked vendor key (AWS `AKIA…`, GitHub `ghp_…`, Stripe `sk_live_…`, …) collapsed to `{secret}` |
| `jwt_in_path` | a leaked JWT collapsed to `{token}` |

On a hit the category is added to the event's `pii_categories[]` and `$addToSet` into the inventory row, the per-category `pii_last_seen.<category>` is stamped, and the `pii_observed` flag (High, threat axis) fires.

### Reporting gates

What an event **reports** is gated per URL piece (a path segment named by the preceding segment, or a query value named by its parameter), to keep random ids from being reported as PII:

- `credit_card` — only under a card-like name (`card`, `cc`, `pan`, `credit_card`, `kart`, …) or in the 4-4-4-4 grouping;
- `ssn` — only under an SSN-like name (`ssn`, `social_security`, `tin`, `tax_id`);
- `email` — not when the "TLD" is an asset extension (`logo@2x.png`) or the domain is `*.gserviceaccount.com`;
- `phone` — a phone-like name, or a `+` / `(` introduced number with ≥ 10 digits, or a Turkish mobile dialled with separators; a bare all-digit mobile needs the name;
- `jwt_in_path` — not on an emailed-link path (reset / verify / confirm / unsubscribe / invite / activate / magic / onboard).

:::note[Privacy guards are never gated]
The gates change what is *reported*, not what is *stored*: every PII-shaped segment is still masked to `{pii}` in the stored path, and every PII-shaped query-parameter **name** is still dropped.
:::

### Turkish mobile numbers

The dialled forms — prefix `0`, `+90` or `0090`, the operator code `5XX` (optionally in parentheses), then 7 digits, with optional ` `, `-` or `.` separators — are detected anywhere in the path or query. The operator code must be one of 501, 505–507, 530–549, 551–559, 561. The bare 10-digit `5XXXXXXXXX` and 12-digit `905XXXXXXXXX` forms look like any other id, so they count only when the query parameter name or the preceding path segment is one of `phone`, `tel`, `telefon`, `gsm`, `cep`, `cep_tel`, `ceptel`, `mobile`, `msisdn`, `phone_number`, `phonenumber`, `mobile_no` (lowercased, `-` ≡ `_`). A number touching another digit never matches.

### Turkish national id (TCKN)

`tr_national_id` (T.C. kimlik no — personal data under KVKK). A candidate is a run of exactly 11 digits, not adjacent to another digit, first digit ≠ 0, that passes the TCKN checksum. A random 11-digit number passes the checksum about 1% of the time, so the checksum alone never flags an event:

- **Event level** — a checksum-valid TCKN whose query parameter name or preceding path segment is a national-id hint (`tc`, `tckn`, `tcno`, `tc_no`, `tc_kimlik`, `tc_kimlik_no`, `tckimlikno`, `kimlik`, `kimlik_no`, `kimlikno`, `vatandaslik_no`, `national_id`, `nationalid`, `citizen_id`, `citizenship_no`, `identity_no`, `identityno`) is a normal PII hit.
- **Endpoint level** — without a name, each event only reports how many candidates it carried and how many were checksum-valid. The inventory row accumulates them (`tr_id_candidates` / `tr_id_valid`), and once **≥ 3 are valid and at least half of the candidates are valid**, the row records `tr_national_id` like an event hit would. Random ids settle near 1% valid and never reach it.

:::warning[Endpoint-level evidence is not in ClickHouse]
An endpoint-level TCKN finding lives on the inventory row only — the raw ClickHouse events that contributed keep an empty `pii_categories`. A ClickHouse PII query therefore undercounts such endpoints; use the inventory (the PII dashboard does).
:::

### Per-detector switches

Each detector can be switched off for **reporting** when it produces false positives in a deployment — **Settings → API Discovery → PII detectors**, stored as `policy.pii_detectors`:

| Key | Values | Default |
|---|---|---|
| `email`, `ssn`, `credit_card`, `iban` | boolean | on |
| `phone_international` | boolean — the `+CC …` / `(area) …` shapes | on |
| `tr_mobile` | boolean — Turkish dialled forms and name-hinted bare forms | on |
| `tr_national_id` | `off` \| `named` (event-level named hits only) \| `named_and_endpoint` (named hits + the endpoint-level evidence) | `named_and_endpoint` |

An absent field, `null`, `{}` or a missing key means **on**. The two phone detectors are independent: `tr_mobile: false` stops only the Turkish forms (a `+90 …` number in a shape the international detector also matches still reports `phone` while `phone_international` is on), and vice versa. Changes apply on the next config poll, without a restart.

The switches govern only the event's `pii_categories` / `pii_observed` and, through them, the inventory row's PII. They **never** govern the `{pii}` mask of the stored path or the query-parameter-name filter — those always run every detector, so switching a category off can never let a PII-shaped value reach storage. Switching a detector off stops **new** hits only: categories already on a row age out of the active view once `pii_last_seen.<category>` falls outside the active window.

### Active vs historical PII

Like risk flags, PII categories are split into **active** (seen within `policy.risk_active_days`, default 7) and **historical**. The PII dashboard, the `pii_category` filter and ownership suggestions use the active categories; the dashboard also shows lifetime and historical endpoint counts per category.

### The PII dashboard

- A hero count of endpoints with active PII, plus **category cards** — click one to filter the table to that category. Each card shows active, lifetime and historical endpoint counts.
- A table of the affected operations (active only): method, normalized path (deep-linked to the endpoint detail), listener, call count and last-seen.

The `pii_observed` flag means the *upstream* API accepts PII in the URL — even though the stored path is masked, that data still flows through logs, proxies, and browser history. The fix is upstream.

:::tip[Enforce, don't just observe]
API Discovery only sees URLs — it cannot inspect bodies. To **redact or block PII in request/response bodies** at the edge, use Shield's [DLP policy](/shield/policies/dlp), which also has `tr_national_id` and `phone` kinds.
:::

## Auth detection

The collector infers the authentication posture of each operation from header **presence** and other metadata — it never verifies a signature.

### When a request counts as authenticated

A request is authenticated when any of `Authorization`, `Proxy-Authorization`, `X-Forwarded-Authorization`, `X-Original-Authorization`, `X-Api-Key` or `X-Auth-Token` is present (the value is never stored), or when the **auth gate** finds evidence outside an auth header:

- an mTLS peer certificate subject;
- a session-like **cookie name** (contains `sess` / `sid` / `auth` / `token` after an optional `__Host-` / `__Secure-` prefix; CSRF/XSRF names excluded);
- a webhook signature header **name** (`stripe-signature`, `x-hub-signature-256`, `svix-signature`, `webhook-signature`, `x-<vendor>-signature`, `x-hmac…`, …);
- a signed-URL parameter set.

The `Cookie` header itself counts only when `detection.cookie_inspection` is on.

:::info[Cookie-session apps work without cookie inspection]
Every HCM with `api_discovery` on carries the Elchi-managed **`elchi-cookie-names`** HTTP filter (an Envoy `header_to_metadata` filter, injected at the head of the chain). It writes the request's cookie **names** — never values — into Envoy dynamic metadata, which the access log ships to the collector. The upstream still gets the untouched header. The names are used for the auth decision only and are never stored. `detection.cookie_inspection` (default **off** — cookie headers are heavy) is needed only for the `Set-Cookie` flags (`cookie_missing_secure`, `cookie_missing_httponly`, `cookie_samesite_none_insecure`).
:::

The inventory row keeps the evidence as last-seen stamps: `auth_last_seen` (newest authenticated request, any outcome), `noauth_last_seen` (newest **accepted** anonymous request — 2xx/101/304, gRPC OK) and `anon_rejected_last_seen` (newest anonymous request refused with 401/403). The sticky `auth_observed` / `noauth_observed` booleans are still written; the backend derives `auth_active` / `noauth_active` from the stamps within the active window.

:::warning[Presence, not verification]
"Authenticated" means a credential was *attached* — not that it was valid. A forged or expired token still counts. Treat it as "a credential was attached," nothing stronger.
:::

### Auth schemes

When consumer fingerprinting is on, each operation records the schemes seen on it (`auth_schemes[]`, plus `auth_scheme_last_seen.<scheme>`):

| Value | Meaning |
|---|---|
| `jwt` | JWT bearer token (the `sub` claim was fingerprinted) |
| `mtls` | Client peer certificate |
| `apikey` | `X-Api-Key` header |
| `basic` | `Authorization: Basic` |
| `cookie` | A session cookie name, or any cookie under cookie inspection — only when no stronger scheme was recognised |
| `none` | No recognised scheme — anonymous **or** an unfingerprintable credential (e.g. an opaque bearer) |

`none` is deliberately ambiguous; the anonymous-access signal is the accepted-anonymous stamp, not `none`. The derived `mixed_auth_schemes` (info) is active while ≥ 2 schemes other than `none` / `cookie` were seen in the active window.

### auth_inconsistent

`auth_inconsistent` is **derived** by the backend at read time: active while the endpoint served an authenticated request, an **accepted** anonymous request **and** a **refused** anonymous request inside the active window. It works across flushes, replicas and restarts, and decays when the evidence ages out. An optional-auth endpoint (a public catalogue that personalises for logged-in users) never refuses anonymous callers and is not flagged.

### Credential parameter names

Query-string **values** are never stored, but accepted parameter **names** are (`query_params` on the event, a capped `query_params[]` on the row, default cap 50). A name is kept only when it matches `^[a-z0-9_.\-\[\]]{1,64}$`, contains a letter, and is not itself PII-shaped.

`credential_in_query` (High, exposure axis) fires when a name matches `policy.credential_param_names` — exactly, after stripping one trailing `[…]`, or as `<prefix>_<entry>` / `<prefix>-<entry>` for entries of ≥ 3 characters (`x-api-key`, `my_token`, `api_key[0]` match; `mytoken`, `tokenizer` do not). The built-in list:

```
api_key apikey token access_token id_token refresh_token auth_token
password passwd pwd secret client_secret private_key jwt bearer
sessionid session_id jsessionid phpsessid
```

Generic words (`key`, `auth`, `session`, `sig`, `signature`) are **opt-in** — add them explicitly for a stricter check. In **Settings → API Discovery → Credential parameter names** the list is *defaults*, *custom* (≤ 64 names) or *disabled* (`[]`).

### The Auth Coverage dashboard

- **Unauthenticated** — endpoints whose accepted-anonymous marker is active and that have no active authenticated traffic. By default only **write methods** (POST/PUT/PATCH/DELETE); *Include read methods* adds GET/HEAD/OPTIONS.
- **Inconsistent** — endpoints with both active markers.

Counts are active, with the lifetime count next to them. When cookie inspection is off **and** the project has no `elchi-cookie-names` filter, the page shows a hint that cookie-session writes may be counted as anonymous.

## Consumer fingerprinting

When `detection.extract_consumer_fingerprint` is on (the default), the collector derives a stable `consumer_hash` per event. Sources, in precedence order:

1. The JWT `sub` claim from `Authorization: Bearer <jwt>` (the token is never stored).
2. The mTLS peer certificate subject.
3. The `X-Api-Key` header value.
4. The username of `Authorization: Basic …` (the password is never read).

The identity is hashed one-way with `HASH_SALT`. Each inventory row keeps a capped sample of consumers (`policy.consumers_cap`, default **10**), and every consumer-bearing event also updates a persistent per-project consumer record (`api_consumers`: first/last seen, events, schemes, listeners). Anonymous events and cookie sessions have no consumer hash.

:::warning[Signatures are not verified]
The collector does **not** verify JWT signatures. Treat `consumer_hash` as a stable grouping key, not an authenticated identity.
:::

The Consumers dashboard, enumeration indicators and per-endpoint enumerators are covered in [Consumers & Enumeration](/api-discovery/consumers-and-enumeration).

## The privacy model

| Data | What is kept |
|---|---|
| Request/response bodies | **Never persisted** (ALS doesn't ship them). |
| Query strings | **Values never persisted.** Only accepted parameter **names** are kept; redirect `Location` headers have their query + fragment stripped. |
| Path segments matching PII | Masked to `{pii}` before storage; only the category name is kept. |
| Sensitive headers | 14 headers are dropped regardless of any allowlist: `Authorization`, `Proxy-Authorization`, `X-Forwarded-Authorization`, `X-Original-Authorization`, `X-Forwarded-User`, `Cookie`, `Set-Cookie`, `Set-Cookie2`, `X-Api-Key`, `X-Auth-Token`, `X-CSRF-Token`, `X-XSRF-Token`, `Traceparent`, `Tracestate`. Webhook signature headers are never stored either. |
| Cookie names | Used for the auth decision only — never stored. |
| Source IP / User-Agent | Always hashed (`SHA-256(salt + value)`, 16 hex chars); the raw columns are also filled unless `store_raw_source_ip` / `store_raw_user_agent` is `false`. |
| Consumer identity | JWT `sub` / mTLS subject / API key / Basic username hashed one-way with `HASH_SALT`. |

### Raw IP / User-Agent retention

The raw `source_ip` and `user_agent` columns default to **on**, next to the hashes. Set `store_raw_source_ip` / `store_raw_user_agent` to `false` for a stricter, hash-only posture.

:::warning[HASH_SALT is required — and load-bearing]
`HASH_SALT` is a mandatory bootstrap secret; the collector rejects an empty or whitespace-only value at startup. **Rotating it invalidates every downstream hash join** — consumer/IP/UA correlations restart from the rotation point.
:::

## Related

- [Consumers & Enumeration](/api-discovery/consumers-and-enumeration) — per-consumer behaviour, BOLA / enumeration indicators.
- [Collector Configuration](/api-discovery/collector-configuration) — PII switches, credential names, cookie inspection, hashing.
- [Risk Flags Reference](/api-discovery/risk-flags-reference) — full flag catalog.
- [DLP policy](/shield/policies/dlp) — enforce redaction of PII in bodies at the edge.
