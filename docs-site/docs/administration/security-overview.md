---
title: Security Model
description: Elchi's security posture in one place — identities and secrets, per-wire trust, RBAC and audit as controls, hardening, and what is encrypted or at rest.
sidebar_position: 9
tags: [administration, security, rbac, hardening]
---

Elchi's security controls are spread across the stack by design — each subsystem owns its own posture. This page is the **map**: it ties the pieces together and links the authoritative page for each, rather than duplicating them. Read it to understand *what* protects *what*, then follow the links for the operational detail.

The mental model has three layers:

1. **Identities & secrets** — who/what is trusted, and where the secret material lives.
2. **Per-wire trust** — how each inter-component connection is authenticated.
3. **Controls & hardening** — RBAC, audit, and the OS/network baseline that contain the blast radius.

## Identities and secrets

| Secret / identity | Purpose | Where it lives |
|---|---|---|
| **JWT signing secret** | Signs the browser/API session tokens the Controller issues. | Controller config. Must be a random **32+ char** value — the shipped default is unsafe and must be replaced. See [Platform Security](/installation/helm-platform/security). |
| **API / client tokens** | Automation + client-agent auth against the REST API. Per project; the project is embedded as a `--<project>` suffix. Shown once on creation. | Issued under **Settings → Tokens**; stored hashed. See [Authentication & Access](/administration/auth-and-access). |
| **Discovery token** | A single per-project token endpoint/K8s discovery agents use to push endpoints. Returned unmasked so the agent can parse its project. | **Settings → Tokens → Discovery Token**. |
| **OpenRouter token** | Powers AI features (LLM calls); one per project. Keys begin `sk-or-`. | **Settings → AI**. |
| **GSLB zone secret** (`dns_secret`) | Authenticates the CoreDNS ↔ Controller snapshot/notify channel via the `X-Elchi-Secret` header. | Set with `--gslb-secret` or **Settings → GSLB**. See [GSLB Nodes & CoreDNS](/traffic-and-certificates/gslb/nodes-coredns). |
| **DNS provider / cloud / LDAP credentials** | ACME DNS-01 challenges, OpenStack integration, directory login. Per project, only for enabled features. | Controller config / **Settings** (Clouds, LDAP). |
| **Datastore DSNs** | MongoDB (`MONGO_URI`) and ClickHouse (`CLICKHOUSE_URI`) connection credentials. | Process env / config; on bare-metal, a restricted `EnvironmentFile`. |
| **Collector `HASH_SALT`** | Keeps IP / user-agent / consumer hashes one-way in the discovery pipeline; rotating it invalidates downstream joins. | elchi-collector env (required, non-empty). See [Collector Reference](/api-discovery/collector-reference). |
| **User 2FA / backup codes** | TOTP second factor; 10 one-time backup codes shown once. | Per user (**Profile → Two-Factor**). Owners can emergency-reset. |
| **Envoy `node.id`** | Not a secret — the `listener::project::ip` identity that attributes edge telemetry to a project. | Set on each edge Envoy. See [Architecture](/getting-started/architecture#node-identity). |

## Per-wire trust

Each connection in the stack is authenticated differently. The [Architecture wire map](/getting-started/architecture#wire-map) has the full table with ports; the trust-relevant summary:

- **Operators → Controller REST** — JWT bearer (session) or API token. Fronted by an internal Envoy; put it behind your VPN/edge LB. Optionally behind LDAP/AD login and TOTP 2FA.
- **elchi-client → Controller `CommandStream`** and **Envoy → Control-Plane xDS** — internal, node-identity / token-based, **network-restricted to the edge fleet**. These are not internet-facing; firewall them to known subnets. See [Network & External Access](/getting-started/network-access).
- **Envoy → elchi-shield (ext_proc)** — a **Unix domain socket, local by construction**; Shield **refuses** to bind ext_proc or its HTTP surface to a non-loopback address unless `--allow-non-loopback` is set. This is a hard invariant: Shield inspects raw bodies and must never be reachable off-box. See [How Shield Works](/shield/how-it-works).
- **Envoy → elchi-collector (ALS)** — plain gRPC by default, or **TLS/mTLS** when the collector's cert/CA env is configured.
- **CoreDNS ↔ Controller (GSLB)** — the `X-Elchi-Secret` shared-secret header on the `/dns/snapshot` poll and the `:8053` notify; **not** JWT. See [GSLB Nodes & CoreDNS](/traffic-and-certificates/gslb/nodes-coredns).
- **Discovery agent → Controller** — the per-project discovery token.

:::danger Shield is never off-box
`elchi-shield` inspects raw request/response bodies. It binds ext_proc to a Unix domain socket and its management HTTP to loopback, and refuses non-loopback binds without an explicit `--allow-non-loopback` override. Never expose it. See the [Port Reference](/reference/ports).
:::

## Controls: RBAC and audit

Two platform-wide controls govern *who can act* and *what happened*.

**RBAC.** Every user holds exactly one of four roles, enforced platform-wide (the whole `/setting` surface defaults to Admin/Owner-only):

| Role | Scope |
|---|---|
| **Owner** | Everything — projects, member management, elevating users to Owner, emergency 2FA resets. Implicitly sees all projects. |
| **Admin** | Manage resources + most settings **within their projects**; cannot manage projects or touch Owner users. |
| **Editor** | Create/edit permitted resources; read-only on admin settings. |
| **Viewer** | Read-only. |

Resources are isolated by **project** (the tenancy boundary); scoping and cleanup queries filter on it. Full detail — roles, projects, tokens, LDAP JIT-provisioning, and TOTP 2FA — is in [Authentication & Access](/administration/auth-and-access).

**Audit.** Every user action and config change is recorded in an **immutable audit trail** (browse under **Audit**, filter, open any event for before/after detail). It can be forwarded to a SIEM over **RFC5424 syslog** (UDP/TCP/TLS) from **Settings → Syslog**. See [Audit & Syslog Forwarding](/observability/audit-and-syslog). This is distinct from Shield's own **security-event audit** (blocked/detected requests → ClickHouse), covered in [Shield Observability](/shield/observability).

## Hardening and data at rest

**OS + systemd baseline (bare-metal).** Every install lands a uniform hardening set: kernel sysctl tuning, a MongoDB drop-in, and per-service systemd sandboxing — `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `ProtectKernel*`, `RestrictNamespaces`, dropped `CapabilityBoundingSet` (only Envoy/CoreDNS keep `CAP_NET_BIND_SERVICE`), `UMask=0077`, and per-unit FD/proc limits. Verify with `sudo /etc/elchi/validate.sh`. Full table: [Production hardening](/installation/bare-metal/hardening).

**Kubernetes baseline.** The critical requirements — a strong JWT secret, TLS everywhere, authenticated MongoDB with strong passwords, and pod-to-pod **NetworkPolicies** — are in [Platform Security](/installation/helm-platform/security).

**Data at rest.**

- **MongoDB** is the system of record (config, users, tokens, inventory). Enable authentication and encryption at rest per your deployment; DSN credentials should come from a secret/`EnvironmentFile`, not inline.
- **ClickHouse** stores high-volume events — the collector's `api_events_raw` and Shield's security audit — both **TTL'd** (default **7 days**) and column-compressed (ZSTD/`LowCardinality`), so forensic data ages out rather than accumulating.
- **Hashing, not storage, of sensitive fields.** The discovery pipeline stores **SHA-256(salt + value)** hashes of source IP, user-agent, and consumer identity — raw values only when an explicit `store_raw_*` policy is on. Auth headers are logged for **presence only**; their values are dropped. Shield's audit carries **no header/body values**, query-stripped paths, and no engine error strings — [no secrets in logs](/shield/observability).

## See also

- [Architecture](/getting-started/architecture) — the wire map and node-identity model this page references.
- [Authentication & Access](/administration/auth-and-access) — RBAC, projects, tokens, LDAP, 2FA in depth.
- [Audit & Syslog Forwarding](/observability/audit-and-syslog) · [Shield Observability](/shield/observability) — the two audit trails.
- [Production hardening](/installation/bare-metal/hardening) · [Platform Security](/installation/helm-platform/security) — the OS and K8s baselines.
- [Network & External Access](/getting-started/network-access) · [Port Reference](/reference/ports) — exposure and egress/ingress.
