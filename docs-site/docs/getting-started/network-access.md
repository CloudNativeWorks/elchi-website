---
title: Network & External Access
description: A firewall checklist of every host and port Elchi needs to reach (egress), every port it exposes (ingress), and the side-channels opened only when a feature is configured.
sidebar_position: 5
---

This page is your firewall checklist. It lists every host and port Elchi needs to reach (egress), every port it exposes (ingress), and the side-channels it opens only when a feature is configured.

Use it to size egress allow-lists, plan NAT/proxy rules, or harden a network policy. Everything below is derived from the running code paths in `elchi-backend` — not aspirational.

## Outbound — always required

The platform will not boot or stay healthy without these.

- **MongoDB** (27017 / SRV) — Primary state store. `mongodb+srv://<cluster>` for Atlas (TLS, port 27017 + 27015–27017 SRV resolution) or your self-hosted host:port. Required by every controller pod.
- **archive.elchi.io** (HTTPS 443) — Envoy version metadata index used to surface available versions in the UI and validate upgrade paths. One short JSON GET per controller startup / version page load.
- **license-api.cloudnativeworks.com** (HTTPS 443) — CNW License Server. Every controller calls it on startup to validate / refresh the license fingerprint and again on a periodic check loop. A single pod cluster-wide actually hits the server (TryClaimCheck dedups across replicas), but the host must be reachable from any controller that may be elected. Without it the platform falls back to the free tier; explicit network blocks on this host will prevent paid-tier features from staying active.
- **charts.elchi.io** (HTTPS 443) — Helm chart repository. Only the operator workstation running `helm install/upgrade` needs this — not the running pods.

## Outbound — feature-gated

Open these only when the matching feature is enabled. None of them is needed for a vanilla install.

- **Let's Encrypt ACME** (HTTPS 443) — `acme-v02.api.letsencrypt.org` (production) and `acme-staging-v02.api.letsencrypt.org` (staging). Reached when an ACME account is configured. Google Trust Services CA endpoints are also supported when `ca_provider: google` is selected.
- **DNS provider APIs** (HTTPS 443) — Used for ACME DNS-01 challenges. Per provider: `api.cloudflare.com`, `api.godaddy.com`, `api.digitalocean.com`, `route53.amazonaws.com`, `lightsail.{region}.amazonaws.com`, Google Cloud DNS APIs. Each project can attach its own credential set; only the providers actually used need to be reachable.
- **OpenRouter API** (HTTPS 443) — `openrouter.ai/api/v1` for the AI Analyzer (Claude / GPT models). Only contacted when an OpenRouter token is set per project.
- **OpenStack APIs** (HTTPS 443 / 5000) — Cloud provider integration (Keystone / Nova / Neutron). Only contacted when a cloud is registered under `Settings → Clouds`.
- **LDAP / LDAPS** (389 / 636) — Optional external auth. Only contacted when LDAP is enabled in `Settings → LDAP Config`.
- **Kubernetes API** (HTTPS 6443) — For the Discovery agent: registers clusters and syncs endpoints back to the controller. The agent runs in-cluster, so this is normally an internal call rather than true egress.
- **GSLB probe targets** (HTTP / HTTPS / TCP) — When a GSLB record is created, the health checker reaches out to every IP/FQDN you list. Ports are whatever you configure (commonly 80 / 443 / 22 / custom). This is the largest egress surface — scope it by destination, not by port.

## Inbound — what Elchi exposes

Every port below should be allowed from the matching client population only — never the open internet by default.

- **Controller HTTP / REST** (`:8099`) — Browser UI, REST API, and OpenAPI. Reached by operators (admins) and the Discovery agent. Put this behind your edge load balancer or VPN.
- **Controller gRPC** (`:50051`) — Command stream that the Elchi Client (Go agent on every Envoy host) connects to for receiving operations. Allow only from your Envoy fleet subnets.
- **Control-Plane gRPC (xDS)** (`:18000`) — ADS / VHDS streams that Envoy proxies subscribe to for live configuration. Allow only from Envoy data-plane subnets.
- **GSLB nodes** (`:53` + `:8053`) — DNS authoritative answers on UDP/TCP 53 to your DNS resolvers; metadata + management on TCP 8053 (X-Elchi-Secret header). Run only when GSLB is enabled.

## Internal — process-to-process

Inside an Elchi cluster (Helm or bare-metal), these flows must work between the pods/hosts:

```text
# Within the Elchi cluster
Controller    → Registry      :9090   (register, heartbeat)
Control-Plane → Registry      :9090   (register, snapshot notify)
Controller    → Control-Plane :18000  (via Registry routing)
Controller    → MongoDB       :27017  (state)
Control-Plane → MongoDB       :27017  (read snapshot data)
Controller    → GSLB nodes    :8053   (notify-on-change)
```

## Quick reference — egress allow-list

If your network team wants a single block to drop into a firewall policy, this is the minimum for a feature-rich install. Trim lines for features you do not use.

```text
# Always required
<your-mongodb-host>:27017                          # state
archive.elchi.io:443                                # version metadata
license-api.cloudnativeworks.com:443                # CNW License Server (validate + periodic check)

# ACME (Let's Encrypt) — only if you issue certificates from Elchi
acme-v02.api.letsencrypt.org:443
acme-staging-v02.api.letsencrypt.org:443

# DNS providers — open only the ones you actually attach
api.cloudflare.com:443
api.godaddy.com:443
api.digitalocean.com:443
route53.amazonaws.com:443

# AI Analyzer — only when OpenRouter token is set
openrouter.ai:443

# Operator workstation only (helm install/upgrade)
charts.elchi.io:443
```

:::note[ACME uses DNS-01 — no inbound 80 or 443 needed for cert issuance]
Elchi's ACME integration runs DNS-01 challenges through the configured DNS provider API. You do **not** need to expose port 80 or 443 to the public internet for Let's Encrypt to issue or renew certificates. This makes Elchi safe to run entirely behind a VPN / private network.
:::

:::warning[GSLB probe traffic is the widest egress surface]
Each GSLB record produces continuous outbound probes (HTTP, HTTPS, or TCP) against every IP you list, on whatever port you configured. If your egress policy is allow-listed, you must add every probe target. Plan ahead — there is no way to consolidate this list because the targets are user-defined.
:::
