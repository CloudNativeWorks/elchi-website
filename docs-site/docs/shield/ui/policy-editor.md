---
title: Policy Editor
description: Build, test, and deploy Shield policies from the Elchi UI — the Builder, YAML, Data Files, and Test tabs, templates, and Import from Discovery.
sidebar_position: 1
---

Shield policies are authored in the Elchi UI under **Shield → Policies**. Clicking a policy (or **New Shield Policy**) opens the policy editor: a structured **policy builder** where you compose domains, routes, and protections with forms, while the YAML config file — its name, path, and content hash — is generated automatically. Editing is gated to **Admin** and **Owner** roles; everyone else gets a read-only view.

The top bar shows the policy name, the generated config file it becomes on every edge (the name is slugified, e.g. `Api Public` → `api-public.yaml`), the stored version tag, and an **unsaved** marker while you have pending edits. Next to it sit **Undo**/**Redo**, **Templates**, **Import from Discovery**, **Delete**, and the save button — **Create & Deploy** for a new policy, **Save & Deploy** for an existing one.

:::info
Saving *is* deploying. There is no separate publish step: a successful save queues an asynchronous `SHIELD_DEPLOY` background job that pushes the project's merged policy bundle to every connected edge. The toast links to the job's per-client results. See [Deploying Policies to Edges](/shield/deployment).
:::

## The four tabs

### Builder

The visual composer. You define the policy's **domains** (each with one or more `hosts` entries — exact, `*.example.com` wildcard, or `*` catch-all), the **routes** under each domain (path/method/content-type matching plus per-route policy overrides), and the **protections**: each security engine is a toggleable card with its own form. The mode (`block` / `detect` / `shadow` / `off`), fail posture, body-inspection settings, and built-in checks are all set here — see the [policy model](/shield/policies/policy-model) for what these mean.

If the policy contains content the builder cannot represent, the Builder tab is disabled with a banner and the YAML tab becomes the source of truth (see below).

### YAML

A two-way Monaco editor over the same policy. Normally it mirrors the Builder: edits you type are parsed back into the builder model (after a short debounce), and builder edits regenerate the document. Three situations are surfaced inline:

- **Parse error** — the store is left untouched until the YAML parses again; nothing invalid is applied.
- **Invalid values** — a known enum field carrying a bad value (e.g. `fail_mode: fail_opent`) is flagged as *"shield will reject this config on the edge"*, because Shield strict-decodes its config and would reject the whole document.
- **Unsupported fields** — content the builder can't represent flips the policy into **YAML mode**: the raw text becomes the source of truth, the Builder is disabled, and the banner lists exactly which fields caused it. A **Back to Builder** button returns control by dropping the unsupported fields.

### Data Files

Supporting artifacts referenced by engines: IP threat feeds, GeoIP databases (`.mmdb`), JWT public keys, OpenAPI specs. Two ways to add one:

- **Upload** — the file is read in the browser, its SHA-256 is computed automatically (never typed by hand), and it ships inline with the bundle. Inline content is capped at 3 MiB per project.
- **Fetch from URL** — for large artifacts (up to 512 MiB), the *edge itself* downloads the file. A 64-hex SHA-256 is required: it is the only integrity guarantee for a URL fetch, and the edge rejects the download on a mismatch.

Data files land on every edge inside Shield's watched config tree (under a `files/` subpath) and are picked from the engine forms in the Builder. The tab shows each file's source, size, and integrity hash.

### Test

A **dry-run** of the policy — no deploy needed. Enter a sample request (method, host, path, optional content type) and the tab shows what the edge would do: the normalized host/path, whether the path hits an **excluded path** (bypasses all inspection), which **domain** matched and via which host entry, which **route** was selected (or the domain default), the effective **mode** and **fail posture**, whether request/response bodies are inspected, and the ordered list of **engines that run**, each tagged `header` or `body` phase. Caveats (e.g. predicates that can't be evaluated without live headers) are listed under the result. The simulation mirrors the edge resolver, so it is the fastest way to prove a policy does what you intend before shipping it.

### Domains and routes inherit protections

A domain's protections apply to its routes; the policy defaults apply to domains and routes without their own. Shield **replaces** the inherited protections whole wherever a scope sets its own — they are never merged. So when a route (or a domain) that inherits protections gets its first one of its own, the editor asks:

- **Start from inherited** (recommended) copies what it inherits — say the WAF and JWT — and adds the new protection. Later changes above no longer reach this route. A copied rate limit counts the route's requests on its own; a copied WAF is compiled once more on the edge.
- **Start empty** adds only the new protection; the inherited ones stop running here.

The texts name the real source of what is inherited: the domain, this policy's defaults, or the defaults of another policy of the project (Shield merges every policy's defaults, the later file winning). Selecting a domain on the left shows its own **Domain policy** (mode, fail posture) and **Domain protections**.

### Rule traffic

Opened from a domain or route, the WAF Studio's rule library shows each CRS rule's real traffic in that domain — requests matched and blocked in the last hour, day or week — and opens them in Security Events on a click. See [Rule traffic in the WAF Studio](/shield/engines/coraza-waf#rule-traffic-in-the-waf-studio) for what the counts mean.

### History

**History** lists the policy's saved versions (the 50 newest) with who saved them and when. Pick one to see its files side by side with the current ones; **Restore** saves that version as a new one and deploys it like any save. Each save also carries the version the editor loaded: if someone else saved in between, the save is refused with *"changed since it was loaded; reload it"* instead of overwriting their change.

## Templates and Import from Discovery

- **Templates** opens a drawer of ready-made example policies; picking one loads it into the Builder (or into YAML mode if it uses fields the builder can't represent).
- **Import from Discovery** opens a drawer where you pick endpoints from the API Discovery inventory. The backend suggests protections for them, and the resulting routes and engines are **merged into the policy you are editing** — with a rationale panel above the Builder explaining why each protection was suggested. This also works in the other direction: from an API Discovery finding you can jump straight into creating (or extending) a Shield policy. See [Suggest a Shield policy](/api-discovery/suggest-policy). Import is disabled while a policy is in raw-YAML mode.

## Unsaved changes and validation

The editor keeps a full undo/redo history and guards unsaved edits twice: navigating back in-app asks for confirmation before discarding, and closing or reloading the browser tab triggers the browser's leave warning.

Before anything is sent to the backend, the editor blocks saves that the edge would reject anyway:

- the policy needs a name and at least one domain, and every domain needs at least one host (`*` matches any);
- YAML must parse, and known fields must carry valid values;
- an enabled engine missing a required field (one that couldn't function on the edge) blocks the save with the specific problem.

:::tip
These checks mirror Shield's strict config decoding on the edge, so problems surface as readable messages in the editor instead of an opaque reload rejection after deploy. The edge additionally validates every pushed bundle with the real `elchi-shield validate` binary before committing it — see [Deploying Policies to Edges](/shield/deployment).
:::

## The engine catalog

The Builder surfaces **12 security engines** as protection cards, grouped into three categories, plus DLP:

| Group | Engine | Phase | What it does |
|---|---|---|---|
| Authentication | [JWT](/shield/engines/jwt) | header | Require a valid JWT (issuer/audience/algorithm/claims) verified against a public key or HMAC secret |
| Authentication | [JWKS](/shield/engines/jwks) | header | Validate RS256/ES256 JWTs against a JWK Set from a URL (background-refreshed) or a local file |
| Authentication | [API Key](/shield/engines/api-key) | header | Authenticate by API key (stored hashed) with optional scope→path restrictions |
| Authentication | [HMAC Signing](/shield/engines/hmac-signing) | header | Require HMAC-signed requests: timestamp window + nonce replay protection + optional body digest |
| Authentication | [HTTP Signature (RFC 9421)](/shield/engines/http-signature) | header | Verify standard HTTP Message Signatures over selected message components |
| Authentication | [mTLS Identity (XFCC)](/shield/engines/mtls-xfcc) | header | Authenticate by the client certificate Envoy forwards: SPIFFE/DNS/subject/fingerprint allow-lists |
| Traffic Control | [IP Reputation](/shield/engines/ip-reputation) | header | Block by source IP: CIDR deny/allow lists, threat-intel feed files, GeoIP country/ASN rules |
| Traffic Control | [Rate Limit](/shield/engines/rate-limit) | header | Token-bucket rate limiting per client IP, host, or header value |
| Traffic Control | [Bot Detection](/shield/engines/bot-detection) | header | Layered bot scoring: User-Agent rules, verified-crawler IP checks, JA3/JA4 TLS fingerprints, header heuristics |
| Content Inspection | [WAF — Coraza / OWASP CRS](/shield/engines/coraza-waf) | body | Full web application firewall with the embedded OWASP Core Rule Set |
| Content Inspection | [GraphQL Guard](/shield/engines/graphql) | body | Bound GraphQL query depth/aliases/fields/batch size and block introspection |
| Content Inspection | [OpenAPI Validation](/shield/engines/openapi-validation) | body | Positive security: only requests matching your OpenAPI 3.x spec are allowed |
| Content Inspection | [DLP — Data Loss Prevention](/shield/policies/dlp) | body | Block hard secrets and redact PII in message bodies |

`header`-phase engines are cheap and never buffer the body; `body`-phase engines require body inspection. DLP is technically a built-in body *check* (`checks.body.dlp` on the wire), but the editor presents it alongside the engines because users think of it as one.
