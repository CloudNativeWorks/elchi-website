---
title: Network & External Access
description: A firewall checklist for every Elchi component — what the platform exposes (ingress), what it needs to reach (egress), what edge hosts running elchi-client / Envoy / elchi-shield need, and the side-channels opened only when a feature is configured.
sidebar_position: 5
---

This page is the firewall checklist for the whole Elchi platform. It covers **both sides** of an installation:

- the **platform servers** (controller, control-plane, registry, MongoDB, metrics stack) — what they expose and what they must reach, and
- the **edge hosts** (machines running `elchi-client`, its managed Envoy instances, and optionally `elchi-shield`) — what they dial out to and the few things they expose.

Use it to size egress allow-lists, plan NAT/proxy rules, or harden a network policy. Everything below is derived from the running code paths in `elchi-backend`, `elchi-client`, `elchi-shield`, and the installers in `elchi-archive` — not aspirational.

## Big picture — who talks to whom

```text
                         ┌────────────────────────  Platform server(s)  ───────────────────────┐
                         │                                                                     │
 Browser / operator ─────►:443  Front Envoy ──► nginx (UI)          MongoDB :27017             │
                         │        │      └────► controller REST     ClickHouse :9000           │
 elchi-client (gRPC) ────►:443    │ x-target-cluster                VictoriaMetrics / Grafana  │
                         │        │ (set by registry ext_proc)                                 │
 Managed Envoy (xDS) ────►:443    ├───────────► control-plane(s)  ◄─── registry (routing)      │
 Managed Envoy (ALS) ────►:443    └───────────► elchi-collector ──► ClickHouse                 │
                         │                                                                     │
 DNS resolvers ──────────►:53   CoreDNS (GSLB, optional)                                       │
                         └─────────────────────────────────────────────────────────────────────┘

 Edge host:  elchi-client ──gRPC──► platform :443        elchi-shield: loopback/UDS only,
             elchi-client ──HTTPS─► archive.elchi.io     optional egress → ClickHouse / OTel
```

The key design fact: **in every production install path (bare-metal standalone, Docker Swarm, Helm), all client-facing traffic — browser UI, REST API, elchi-client command stream, Envoy xDS/ADS, and Envoy access-log streaming — enters through a single TLS port (`443`) on a front Envoy.** The registry's `ext_proc` filter inspects each request and sets an `x-target-cluster` header that routes it to the right internal process. You do not expose the controller, control-plane, or registry ports directly.

## Inbound — platform servers

### Single-node (standalone) install: one port

The bare-metal standalone installer opens exactly one port in the host firewall on a single-node install:

- **`:443` TCP** — Front Envoy TLS listener. Carries the browser UI, REST API, `elchi-client` gRPC command stream, Envoy xDS/ADS subscriptions, and Envoy access-log (ALS) streams. Allow from operator networks **and** every edge-host subnet.
- **`:53` TCP + UDP** — CoreDNS GSLB authoritative DNS. Only opened when the platform is installed with `--gslb`. Allow from your DNS resolvers.

Everything else (controller, control-plane, registry, MongoDB, Grafana, VictoriaMetrics, ClickHouse, OTel, collector) binds loopback or stays firewall-blocked on a single node.

### Multi-node (cluster) install: inter-node ports

When the standalone installer runs with 2+ nodes, these ports are additionally opened **between cluster nodes only** — they never need to be reachable from operators or edge hosts:

| Port | Proto | Purpose | When |
|------|-------|---------|------|
| 27017 | TCP | MongoDB replica set | 2+ nodes |
| 1870 | TCP | Registry gRPC (routing, ext_proc, HA peers) | 2+ nodes |
| 1960 | TCP | Controller gRPC (client command server) | 2+ nodes |
| 1980 | TCP | Controller REST API | 2+ nodes |
| 1990, 1991, … | TCP | Control-plane xDS — one port per installed Envoy version variant | 2+ nodes |
| 9000 | TCP | ClickHouse native protocol (collector → ClickHouse cross-node) | 2+ nodes, collector enabled |
| 9009 / 9181 / 9234 | TCP | ClickHouse interserver / Keeper client / Keeper Raft | 3+ nodes |

Docker Swarm deployments use the same logical ports and additionally require the standard Swarm mesh ports between nodes: **2377/tcp, 7946/tcp+udp, 4789/udp**.

:::note[Bare-metal ports differ from Helm/Kubernetes ports]
The Go processes have different built-in defaults, used as-is by the Helm charts inside the cluster network: controller REST `:8099`, controller gRPC `:50051`, control-plane xDS `:18000`, registry gRPC `:9090`, registry Prometheus metrics `:9091` (hardcoded). The bare-metal installer remaps these to the 18xx/19xx range shown above. In both cases they are internal — the front Envoy on `:443` is the only public entry point.
:::

### Internal-only ports (never open these)

For completeness — these bind on platform nodes but are loopback-only or intentionally firewall-blocked: front Envoy internal plaintext listener `:8080`, Envoy admin `:9901`, nginx UI `:8081`, Grafana `:3000` (proxied at `/grafana`), VictoriaMetrics `:8428`, OTel Collector `:4317`/`:4318`, elchi-collector ALS `:18090` + health `:18091`, ClickHouse HTTP `:8123`, registry metrics `:9091`, CoreDNS webhook `:8053`.

## Inbound — edge hosts (elchi-client, Envoy, elchi-shield)

Edge hosts need almost nothing opened:

- **Your Envoy data-plane listeners** — whatever ports the services you publish through Envoy use (e.g. 80/443 for an edge proxy). These are defined by your listener configs, not by Elchi.
- **`:179` TCP (BGP)** — only when the client is installed with `--enable-bgp` (FRR). Allow from/to your BGP peers.

Everything else is local-only and needs **no firewall rule**:

- `elchi-client` itself listens on **no TCP port at all** — its controller connection is a single outbound gRPC stream.
- `elchi-shield` serves Envoy over a **Unix socket** (`/run/elchi-shield/extproc.sock`, or loopback TCP) and exposes health/metrics/admin only on **`127.0.0.1:9001`**. Nothing needs to reach shield from off-box.
- Envoy admin interfaces bind `127.0.0.1` per instance.

## Outbound — platform servers

### Always required

The platform will not boot or stay healthy without these.

- **MongoDB** (27017 / SRV) — Primary state store, used by controller, control-plane, and registry (leader election). `mongodb+srv://<cluster>` for Atlas (TLS) or your self-hosted host:port. On a standalone install MongoDB is local, so no egress rule is needed.
- **archive.elchi.io** (HTTPS 443) — Envoy version metadata index (`/index.json`) used to surface available versions in the UI and validate upgrade paths.
- **license-api.cloudnativeworks.com** (HTTPS 443) — CNW License Server. Controllers validate / refresh the license fingerprint on startup and on a periodic check loop. Without it the platform falls back to the free tier.

### Internal (standalone install pulls these in locally)

- **ClickHouse** (native TCP 9000) — Controller reads shield audit events and traffic inventory; elchi-collector writes Envoy access logs. Local on standalone; a cross-node flow in clusters. Endpoints return 503 if `CLICKHOUSE_URI` is unset.
- **GSLB nodes** (HTTP 8053) — Controller pushes DNS record changes and queries health/records on the GSLB node instances (`X-Elchi-Secret` header). Only when GSLB is enabled.

### Feature-gated

Open these only when the matching feature is enabled. None is needed for a vanilla install.

- **Let's Encrypt ACME** (HTTPS 443) — `acme-v02.api.letsencrypt.org` (production) and `acme-staging-v02.api.letsencrypt.org` (staging). Google Trust Services (`dv.acme-v02.api.pki.goog`) when `ca_provider: google` is selected.
- **DNS provider APIs** (HTTPS 443) — For ACME DNS-01 challenges. Per provider: `api.cloudflare.com`, `api.godaddy.com`, `api.digitalocean.com`, `route53.amazonaws.com`, `lightsail.{region}.amazonaws.com`, Google Cloud DNS APIs. Only the providers you actually attach need to be reachable.
- **OpenRouter API** (HTTPS 443) — `openrouter.ai/api/v1` for the AI Analyzer. Only contacted when an OpenRouter token is set per project. (All AI traffic goes through OpenRouter — no direct Anthropic/OpenAI egress.)
- **OpenStack APIs** (HTTPS 443 / 5000) — Cloud provider integration (Keystone / Nova / Neutron). Only when a cloud is registered under `Settings → Clouds`.
- **LDAP / LDAPS** (389 / 636) — Optional external auth, when LDAP is enabled in `Settings → LDAP`.
- **Syslog / SIEM** (UDP, TCP, or TCP+TLS — your host:port) — Audit-log forwarding, when a syslog target is configured under `Settings → Audit Forwarding`.
- **download.db-ip.com** (HTTPS 443) — Free DB-IP Lite GeoIP database (city / ASN `.mmdb`, ~80 MB) fetched on demand via `POST /api/v3/setting/geoip/download` for shield's GeoIP features. Not needed if you upload a database file manually instead.
- **Kubernetes API** (HTTPS 6443) — For the Discovery agent syncing endpoints back to the controller. The agent runs in-cluster, so this is normally an internal call rather than true egress.
- **GSLB probe targets** (HTTP / HTTPS / TCP) — When a GSLB record is created, the health checker continuously probes every IP/FQDN you list, on whatever port you configure. This is the largest egress surface — scope it by destination, not by port.

### Install-time only

The installer downloads artifacts over HTTPS 443; after installation these are only needed again for upgrades:

- `github.com` + `api.github.com` + `codeload.github.com` + `raw.githubusercontent.com` — Elchi binaries, UI bundle, Envoy, collector, CoreDNS/GSLB from `CloudNativeWorks/elchi-archive` releases; VictoriaMetrics and OTel Collector releases.
- Distro package repos — `repo.mongodb.org` + `pgp.mongodb.com`, `apt.grafana.com` / `rpm.grafana.com`, `packages.clickhouse.com`.

## Outbound — edge hosts

What every machine running `elchi-client` must be able to reach:

- **Elchi platform `:443`** (gRPC over TLS) — The one rule that matters. A single long-lived gRPC stream carries commands, heartbeat, stats, and bootstrap/config pushes; the managed Envoy instances open their xDS/ADS and access-log streams to the same address and port.
- **archive.elchi.io** (HTTPS 443) — Downloads of Envoy binaries and WAF (Coraza WASM) rule modules, SHA256-verified. Needed at install time and whenever a new Envoy/WAF version is deployed to the host.
- **github.com / api.github.com** (HTTPS 443) — Install-time only: `elchi-client` and `elchi-shield` binaries from `CloudNativeWorks/elchi-archive` releases (FRR packages too, if `--enable-bgp`).
- **Cloud metadata endpoints** (HTTP 80, link-local) — `169.254.169.254` and `metadata.google.internal` for cloud auto-detection. Local to the hypervisor; no firewall rule normally needed.

Optional, only when configured at shield install:

- **ClickHouse** (native TCP 9000) — `elchi-shield` audit-event sink (`--shield-audit-dsn`), batched and best-effort. Points at the platform's ClickHouse (or your own).
- **OTel Collector** (OTLP gRPC 4317 / OTLP HTTP 4318) — `elchi-shield` metrics push and/or audit-event alternative.
- **JWKS endpoints** (HTTPS) — Only if a shield JWT policy uses a remote `url:` instead of a local key file; fetched at config load and refreshed in the background.

## Quick reference — firewall snippets

### Platform server (standalone, single node)

```text
# Ingress
443/tcp    from operators + edge-host subnets   # UI, API, client gRPC, xDS, ALS
53/tcp+udp from DNS resolvers                   # only with --gslb

# Egress — always
archive.elchi.io:443                            # version metadata + artifacts
license-api.cloudnativeworks.com:443            # license validation
github.com:443, api.github.com:443              # install/upgrade artifacts

# Egress — only if you issue certificates from Elchi
acme-v02.api.letsencrypt.org:443
acme-staging-v02.api.letsencrypt.org:443
api.cloudflare.com:443                          # …plus only the DNS providers you attach

# Egress — only when the feature is on
openrouter.ai:443                               # AI Analyzer
download.db-ip.com:443                          # GeoIP database download (or upload manually)
<your-ldap-host>:636                            # LDAP auth
<your-siem-host>:<port>                         # syslog forwarding
<gslb-node-ips>:8053                            # GSLB node management
<gslb-probe-targets>:<any>                      # GSLB health probes
```

### Edge host (elchi-client + Envoy + elchi-shield)

```text
# Ingress
<your data-plane listener ports>                # defined by your Envoy listeners
179/tcp    from BGP peers                       # only with --enable-bgp

# Egress
<elchi-platform-address>:443                    # client gRPC + Envoy xDS/ALS (the one that matters)
archive.elchi.io:443                            # Envoy binaries + WAF rules
github.com:443, api.github.com:443              # install-time binaries

# Egress — only if shield telemetry is configured
<clickhouse-host>:9000                          # shield audit events
<otel-collector>:4317                           # shield metrics (OTLP/gRPC)
```

:::note[ACME uses DNS-01 — no inbound 80 or 443 needed for cert issuance]
Elchi's ACME integration runs DNS-01 challenges through the configured DNS provider API. You do **not** need to expose port 80 or 443 to the public internet for Let's Encrypt to issue or renew certificates. This makes Elchi safe to run entirely behind a VPN / private network.
:::

:::warning[GSLB probe traffic is the widest egress surface]
Each GSLB record produces continuous outbound probes (HTTP, HTTPS, or TCP) against every IP you list, on whatever port you configured. If your egress policy is allow-listed, you must add every probe target. Plan ahead — there is no way to consolidate this list because the targets are user-defined.
:::
