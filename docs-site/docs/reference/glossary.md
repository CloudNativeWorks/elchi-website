---
title: Glossary
description: Definitions of the Elchi, Envoy, and API-security terms used throughout the documentation.
sidebar_position: 1
tags: [reference]
---

A quick reference for the terms and acronyms used across the Elchi documentation.
Terms are grouped by area; many link to the page where the concept is covered in depth.

## Platform & architecture

**Control plane** — the central Elchi backend: three cooperating processes
([Controller](/getting-started/architecture), Control-Plane, Registry) plus MongoDB,
ClickHouse, and the metrics stack. It authors and distributes config; it never carries
your traffic. See [Architecture](/getting-started/architecture).

**Controller** — the backend process exposing the REST API, the gRPC
**CommandStream** to edge agents, and WAF/GSLB/ACME management. Origin
port `8099` (fronted by Envoy on `8080`).

**Control-Plane** — the backend process that serves Envoy configuration over
**xDS** on port `18000` (ADS/VHDS with snapshot caching).

**Registry** — the backend process for service discovery and version-based routing of
xDS streams; port `9090`. See [Registry & HA](/administration/registry-and-ha).

**Data plane** — the **Envoy** proxies that actually carry traffic, configured by
the control plane.

**Edge / edge node** — a host running Envoy plus the agents that operate it
(**elchi-client**, **Shield**, the collector target).

**Snapshot** — an immutable, versioned bundle of Envoy resources the control-plane
serves to a node. Publishing a change produces a new snapshot; a node applies it live.
Inspect the served snapshot with [Snapshot Dump](/envoy-configuration/snapshot-dump).

**Project** — the multi-tenancy boundary. Resources, policies, and access are scoped to
a project. See [Authentication & Access](/administration/auth-and-access).

**Node identity** — the Envoy `node.id` string, formatted `listener::project::ip`. It is
shared across Shield (ext_proc attribute), the collector (ALS `node_id`), and the
registry, and is how telemetry and events are attributed to a project and edge. See
[Architecture → Node identity](/getting-started/architecture).

**elchi-proto** — the shared protobuf/gRPC contract behind the CommandStream and edge
agent communication.

## Envoy & xDS

**Envoy** — the CNCF L7/L4 proxy Elchi manages. Multiple versions run side by side; see
[Envoy versions](/reference/envoy-versions).

**xDS** — Envoy's *discovery service* config APIs. Elchi implements the full set:

- **ADS** — Aggregated Discovery Service (one stream for all resource types).
- **LDS / RDS / CDS / EDS / SDS** — Listener / Route / Cluster / Endpoint / Secret
  Discovery Service. One per [resource type](/envoy-configuration/resources).
- **VHDS** — Virtual Host Discovery Service (on-demand virtual hosts).

**Bootstrap** — the static Envoy config that points a proxy at the control-plane (ADS)
and sets node id, admin, and static resources. See
[Bootstrap](/envoy-configuration/resources/bootstrap).

**ext_proc** — Envoy's *external processing* HTTP filter. Envoy calls an external gRPC
service (here, **Shield**) to inspect requests/responses and get an
allow/block/mutate decision. See [Envoy wiring](/shield/envoy-wiring).

**ALS** — *Access Log Service*. Envoy streams access logs over gRPC to the
**collector**, which builds the API inventory. See
[API Discovery](/api-discovery/overview).

**use_remote_address / XFF** — Envoy settings that determine the trusted client source
IP. Shield's source-IP controls depend on them; see [Envoy wiring](/shield/envoy-wiring).

## Components

**elchi-client** — the edge agent that registers a node, runs controller commands over
the **CommandStream**, deploys/upgrades Envoy, and bundles the Shield
sidecar. See [Elchi Client](/installation/client/overview).

**CommandStream** — the long-lived gRPC stream (controller ↔ elchi-client, port `50051`)
that pushes lifecycle commands (deploy, bootstrap, WAF version, Shield config, …) to
edges. See [Clients](/operations/clients).

**Shield** — the per-edge **ext_proc** API-security sidecar: WAF, auth,
rate-limiting, bot defense, and DLP across 12 engines. See [Shield](/shield/overview).

**Collector** — `elchi-collector`, the service that ingests Envoy **ALS** logs and
produces the API inventory. See [Collector reference](/api-discovery/collector-reference).

**CoreDNS plugin (elchi-gslb)** — the DNS server that answers **GSLB** queries from
the control-plane's DNS snapshot. See [GSLB nodes](/traffic-and-certificates/gslb/nodes-coredns).

## Security & API protection

**WAF** — Web Application Firewall. Elchi has two deliveries: the standalone
[Coraza WASM WAF](/traffic-and-certificates/waf/overview) and Shield's
[Coraza engine](/shield/engines/coraza-waf).

**Coraza** — the Go implementation of the ModSecurity WAF engine used by Elchi.

**OWASP CRS** — the OWASP *Core Rule Set*, the community WAF ruleset Coraza loads;
tunable by paranoia level and anomaly threshold. See [Coraza engine](/shield/engines/coraza-waf).

**Paranoia level** — a CRS setting (1–4) trading detection breadth for false positives.

**Anomaly score** — a collaborative score summed across engines; a request blocks when
the total crosses the policy threshold. See [Anomaly scoring](/shield/anomaly-scoring).

**DLP** — Data Loss Prevention: Shield blocks secrets and redacts PII in bodies. See
[DLP](/shield/policies/dlp).

**JWKS** — JSON Web Key Set, a set of public keys (by `kid`) for verifying JWTs. See
[JWKS engine](/shield/engines/jwks).

**mTLS / XFCC** — mutual TLS; `x-forwarded-client-cert` is the header Envoy uses to
forward the verified client-cert identity to Shield. See [mTLS/XFCC](/shield/engines/mtls-xfcc).

**JA3 / JA4** — TLS-fingerprint hashes Envoy can compute and forward, used by Shield's
[bot engine](/shield/engines/bot-detection) to detect tools masquerading as browsers.

**RFC 9421** — the HTTP Message Signatures standard implemented by Shield's
[http-signature engine](/shield/engines/http-signature).

**detect / shadow / block** — Shield policy [modes](/shield/policies/modes-and-postures):
evaluate-and-log, evaluate-as-if-blocking-but-allow, and enforce (403).

**fail-open / fail-close** — the posture when an engine *errors* or times out: allow, or
block. It does not govern missing/invalid credentials (those always block).

## API Discovery

**Confirmed vs attack surface** — an endpoint is *confirmed* when it matched a real Envoy
route; unmatched probe/scanner traffic is the *attack surface*. See
[Endpoints](/api-discovery/endpoints).

**Threat vs Exposure** — the two-axis risk model: `max_risk_score` (active attack/abuse)
vs `max_posture_score` (standing config hygiene). See [Risk scoring](/api-discovery/risk-scoring).

**Risk flag** — a signal raised on an endpoint (e.g. `bola_suspect`, `weak_tls_version`),
mapped to OWASP API Top-10. See the [Risk flags reference](/api-discovery/risk-flags-reference).

**Path normalization** — collapsing dynamic path segments (`/users/123` → `/users/{id}`)
so operations group correctly. See [Path normalization](/api-discovery/path-normalization).

**PII** — Personally Identifiable Information (email, phone, SSN, card, IBAN) that
Discovery detects and Shield can redact.

## Certificates & traffic

**ACME** — the automated certificate protocol (Let's Encrypt, Google Trust Services)
Elchi uses via DNS-01 challenges. See [Certificates (ACME)](/traffic-and-certificates/acme).

**DNS-01** — the ACME challenge type that proves domain control via a DNS TXT record.

**EAB** — External Account Binding, credentials some CAs require to bind an ACME account.

**GSLB** — Global Server Load Balancing: DNS-based traffic steering with health checks.
See [GSLB](/traffic-and-certificates/gslb).

## Deployment & operations

**Helm / kind / Docker Swarm / bare-metal** — the four ways to install the control plane.
See [Installation](/installation/helm-platform/overview).

**Job** — an asynchronous background operation (snapshot publish, WAF propagation, ACME
verification, resource upgrade) with a live log and retry. See
[Background Jobs](/observability/background-jobs).

**OTel / VictoriaMetrics / Grafana** — the telemetry stack: metrics flow Envoy →
OpenTelemetry Collector → VictoriaMetrics → Grafana. See
[Metrics & Logs](/observability/metrics-and-logs).

**ClickHouse** — the column store for API events (Discovery) and Shield security events.

**RBAC** — Role-Based Access Control. Elchi roles: **Owner, Admin, Editor, Viewer**. See
[Authentication & Access](/administration/auth-and-access).
