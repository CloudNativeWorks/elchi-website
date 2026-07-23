---
title: FAQ
description: Frequently asked questions about Elchi — what it is, how config reaches edges, Shield vs the WASM WAF, API Discovery privacy, deployment options, and data locality.
sidebar_position: 2
tags: [troubleshooting, faq]
---

Short answers to the questions that come up most. Follow the links for depth.

### What is Elchi?

Elchi is an enterprise **Envoy management platform**. A central control plane authors and distributes Envoy configuration to a fleet of edge nodes over xDS, and adds certificate automation (ACME), DNS load balancing (GSLB), a WAF, API Discovery, and a per-edge security sidecar (Shield). See [Introduction](/getting-started/introduction) and [Concepts](/getting-started/concepts).

### What runs centrally versus at the edge?

The **central platform** runs once: the backend (controller, control plane, registry), MongoDB, ClickHouse, the collector, the UI, and a gateway Envoy. **Each edge node** runs Envoy plus the lightweight `elchi-client` agent — and optionally the Shield sidecar. See [Topology](/installation/bare-metal/topology).

### How does configuration reach the edges?

The control plane serves Envoy config over **xDS (ADS)**; each edge Envoy maintains a stream and receives versioned snapshots. Node lifecycle and edge-side tasks are driven by the `elchi-client` agent over a command stream from the controller. Shield policies are delivered as **files** the client writes into a watched directory, which Shield hot-reloads. See [Deploying Policies to Edges](/shield/deployment).

### Is my traffic or request data forwarded off-box?

No. Edge data-plane traffic stays local. Shield inspects requests in-process next to Envoy and never forwards payloads off the host. API Discovery ships only **access-log metadata** (never request/response bodies or query strings) to the collector. The management plane distributes configuration, not traffic.

### Which Envoy versions are supported?

Elchi supports a set of Envoy versions you deploy and can run several in parallel; each node must match a deployed version tag. See [Envoy versions & upgrades](/envoy-configuration/versions-and-upgrades).

### How do I add a new Envoy version?

Add the version to the platform's deployed set so its resources and bootstrap become available, then move nodes onto it. See [Envoy versions & upgrades](/envoy-configuration/versions-and-upgrades).

### What's the difference between Shield and the WAF?

They're **complementary WAF deliveries**. The platform WAF is **Coraza/OWASP-CRS delivered as an Envoy WASM filter**, configured under [WAF](/traffic-and-certificates/waf) and injected into the xDS snapshot. **Shield** is a separate **ext_proc sidecar** next to Envoy with a broader engine set (JWT/JWKS, rate limiting, IP reputation, bot detection, API keys, HMAC/HTTP signatures, GraphQL/OpenAPI guards, DLP, and its own embedded Coraza CRS). Shield is not a replacement wired into the WASM path — it's a parallel, security-focused processor. See [Shield overview](/shield/overview).

### Do I have to run Shield to use Elchi?

No. Shield is an optional edge sidecar. You can run Elchi purely for Envoy config management, certificates, GSLB, the WASM WAF, and API Discovery, and add Shield where you want inline enforcement. See [Shield deployment](/shield/deployment).

### How does Shield connect to Envoy?

Through Envoy's `ext_proc` HTTP filter over a local gRPC stream — preferably a Unix domain socket. Some Shield engines depend on Envoy settings (notably `use_remote_address` for trustworthy source IPs and the `node.id` format for metric/audit attribution). See [Wiring Shield into Envoy](/shield/envoy-wiring).

### Is API Discovery a privacy risk? What does it store?

API Discovery is **metadata-only** — it never persists request/response bodies or query strings. Source IP and User-Agent are **always hashed** with a salt. The raw IP/UA columns are **also populated by default**, but that raw retention is a per-field **opt-out** (`store_raw_source_ip` / `store_raw_user_agent: false`) for a stricter hash-only posture. See [PII, Auth & Consumers](/api-discovery/pii-and-auth).

### How does API Discovery get its data?

Each edge Envoy sends **ALS v3 access logs** over gRPC to the central collector — no inline filter or ext_proc. The collector normalizes paths, builds an endpoint inventory in MongoDB, and stores forensic events in ClickHouse. Enable `api_discovery` on the listener and point an ALS sink at the collector. See [API Discovery overview](/api-discovery/overview) and the [Collector reference](/api-discovery/collector-reference).

### Bare-metal or Helm — which should I use?

**Helm** deploys the central platform on Kubernetes; **bare-metal** installs the platform (or edge components) on hosts via install scripts/systemd. Edge nodes typically run the `elchi-client` agent on the host regardless. See [Bare-metal overview](/installation/bare-metal/overview) and [Helm platform](/installation/helm-platform/overview).

### How are resources isolated between teams?

By **project**. Every resource belongs to a project, and access is governed by a role model (Owner/Admin/Editor/Viewer). See [Authentication & Access](/administration/auth-and-access).

### Can I automate Elchi from scripts or CI?

Yes — issue an **API token** under Settings → Tokens and use it as a bearer token against the controller API. Separate **discovery tokens** exist for discovery agents. See [Authentication & Access](/administration/auth-and-access).

### Does Elchi support SSO / directory login?

It supports **LDAP / Active Directory** authentication, configured and testable under Settings → LDAP, plus TOTP-based two-factor auth. See [Authentication & Access](/administration/auth-and-access).

### How do I back up my configuration?

Export a project's state to a JSON file under **Settings → Maintenance → Backup & Restore**, and re-import it into a target project (with a dry-run preview) when you need to roll back or promote config. See [Backup & Restore](/administration/backup-restore).

### How do certificates get issued and renewed?

Elchi automates the full lifecycle via **ACME with DNS-01 validation**, storing the result as an Envoy secret and auto-renewing. See [ACME certificates](/traffic-and-certificates/acme).

### How does GSLB failover work?

Elchi actively health-probes each endpoint and serves only healthy IPs through a **CoreDNS** plugin, steering clients to live targets and failing over automatically. See [GSLB](/traffic-and-certificates/gslb).

### Where do I see metrics and logs?

Shield and the collector expose Prometheus metrics and structured logs; Shield can also push metrics over OTLP. The UI's Overview and Security Events views are scoped per project via the Envoy `node.id`. See [Metrics & Logs](/observability/metrics-and-logs).

### How is Elchi licensed?

License status is a badge in the header, managed under **Settings → License**; activation and periodic checks need outbound access to the Elchi license API. See [Licensing](/administration/licensing).
