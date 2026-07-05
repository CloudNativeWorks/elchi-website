---
title: Troubleshooting
description: Fixes for common issues across the platform — control-plane config delivery, Shield ext_proc, API Discovery, certificates, GSLB, and edge resource pressure.
sidebar_position: 1
tags: [troubleshooting]
---

Each entry below is a **symptom**, its likely **cause**, and the **fix**. Work top-to-bottom within a section; most issues are a missing wiring step rather than a bug.

## Platform & control plane

### Pods stuck in `Pending`

**Cause.** Usually a missing storage class or insufficient cluster resources — the scheduler can't place the pod.

**Fix.** Check `kubectl describe pod <name>` for the actual scheduling event (`FailedScheduling`, `unbound PersistentVolumeClaim`). Provision a default `StorageClass` or free up node capacity. See [Helm storage](/installation/helm-platform/storage).

### Client cannot connect to the controller

**Cause.** DNS/TLS mismatch or a stale token.

**Fix.**

- Verify `server.host` resolves and is reachable from the edge host.
- If the controller is behind HTTPS, set `server.tls: true` in the client config.
- Re-issue the token from **Settings → Tokens** — old tokens are invalidated when rotated. See [Authentication & Access](/administration/auth-and-access).

### Envoy not receiving config updates

**Cause.** A control-plane snapshot error, an Envoy version that isn't in the deployed set, or an orphaned resource reference.

**Fix.**

- Check the control-plane pod logs for snapshot errors.
- Confirm the Envoy version matches one of the deployed version tags — see [Envoy versions & upgrades](/envoy-configuration/versions-and-upgrades).
- Use the dependency graph in the UI to spot orphaned references.

### Config published in the UI but Envoy still runs the old config

**Cause.** The control plane builds a **versioned snapshot** per node; if the node's ADS stream is unhealthy or the snapshot version didn't advance, Envoy keeps the last good config.

**Fix.**

- Confirm the node's xDS stream is connected (the node appears healthy in `/clients`).
- Check the control-plane logs for a snapshot `version` bump after your publish. A rejected resource (NACK) keeps the previous version live.
- Look for a NACK reason in Envoy's own admin `/config_dump` or logs — a single invalid resource can reject the whole update for that node.

## Shield (edge WAF / ext_proc)

### Envoy logs `ext_proc` connection refused / permission denied on the socket

**Cause.** Envoy's OS user isn't in the `elchi` group, so it can't open Shield's Unix domain socket at `/run/elchi-shield/extproc.sock`.

**Fix.** The installer creates `/run/elchi-shield` group-owned by `elchi` and adds Envoy's user to that group. **Restart Envoy** after installing Shield so it picks up the new group membership. Confirm with `id envoy` (or your Envoy user) that `elchi` is listed, and that the socket exists and is group-readable/writable. See [Wiring Shield into Envoy](/shield/envoy-wiring).

### Shield blocks all legitimate traffic (403 on everything)

**Cause.** The most common false positive is OWASP CRS rule **920280 "Missing Host Header" (CRITICAL)**. Behind Envoy over HTTP/2, requests carry `:authority` but no classic `Host` header, so a naive Coraza setup 403s every request.

**Fix.** Shield already synthesizes a `Host` header from the derived host to prevent this — make sure you're on a current Shield build and haven't disabled that behavior. If you still see blanket blocks, check `/configz` and the audit stream for the firing `rule_id`; switch the offending policy to `detect` mode temporarily to confirm which engine is blocking before tuning. See [Shield engines](/shield/engines).

### Shield's source-IP controls never fire (IP reputation / rate-limit / bot checks do nothing)

**Cause.** Shield derives the client IP from the **right** side of `X-Forwarded-For` (never the spoofable leftmost token). If Envoy isn't running with `use_remote_address: true`, the rightmost XFF entry is attacker-controlled, and if `--xff-trusted-hops` doesn't match the real proxy count, Shield keys on the wrong hop.

**Fix.**

- Set `use_remote_address: true` on the Envoy HTTP Connection Manager so Envoy appends the real peer address.
- Set `xff_num_trusted_hops` on Envoy and Shield's `--xff-trusted-hops` to the **exact** number of trusted proxies in front of Envoy (default `0`).

See the source-IP section in [Wiring Shield into Envoy](/shield/envoy-wiring).

### Shield config reload failed and the new policy isn't live

**Cause.** A bad policy file (invalid field, too-short secret, unparseable feed) aborts the reload. Shield keeps the **last-good** config rather than applying a broken one — by design.

**Fix.** On the edge host, `curl -s 127.0.0.1:9001/configz` shows the active version/hash/sources **and the last reload error** with the attributed reason (e.g. `auth.yaml: engines.hmac_sign.secret: must be at least 64 bytes`). Fix the file and re-push; the `elchi_shield_config_reload_failure_total` and `config_reload_failures_consecutive` metrics also back alerting. See [Shield observability](/shield/observability).

### Shield metrics are missing from the Overview dashboard

**Cause.** Two independent wiring gaps: metrics aren't reaching the time-series store, or the node id isn't in the form the UI scopes on.

**Fix.**

- Confirm the OTLP push (`--metrics-otlp-endpoint`) or scrape path actually reaches your metrics store (VictoriaMetrics via the OTel Collector). `/metrics` on the edge should always be scrapeable locally.
- Set Envoy's `node.id` to `listener::project::ip` and send it as an ext_proc `request_attribute` (`request_attributes: ["xds.node.id"]`). Shield uses the first attribute as the `listener` label and parses `listener::project::ip` to scope audit/metrics to a project; without it, series land on the `--listener-id` fallback and the UI can't attribute them. See [Wiring Shield into Envoy](/shield/envoy-wiring) and [Metrics & Logs](/observability/metrics-and-logs).

### High memory on an edge host running Shield

**Cause.** Body-inspecting policies buffer request bodies. Total buffered body memory is process-wide bounded by `--max-inflight-body-bytes`; over-budget bodies are marked truncated and blocked. If the limit is set too high for the host, buffering can dominate memory.

**Fix.** Lower `--max-inflight-body-bytes` (and the per-policy body size limits) to fit the host, or set `--mem-limit-bytes` (GOMEMLIMIT) so the Go runtime GCs aggressively near the ceiling. Watch `inflight_body_bytes` and `body_budget_rejections_total`. Header-only policies never buffer the body. See [Shield deployment](/shield/deployment).

## API Discovery & collector

### The collector isn't ingesting — no API events appear

**Cause.** Envoy has no **ALS v3 gRPC access-log sink** pointed at the collector, or the sink can't reach it. API Discovery uses the access-log stream — there's no inline filter or ext_proc for discovery.

**Fix.**

- Add an `envoy.access_loggers.http_grpc` sink on the listener's HCM, `transport_api_version: V3`, targeting the collector's gRPC address (`:18090` by default).
- Verify network reachability from the edge to the collector and check `elchi_collector_events_received_total` on the collector's `/metrics` (`:18091`).
- Watch `events_dropped_total{reason=...}` — a spiking `backpressure` or `ingest_filter` reason explains silent loss. See [Collector reference](/api-discovery/collector-reference).

### API Discovery inventory is empty even though traffic flows

**Cause.** `api_discovery` isn't enabled on the listener, or the node id isn't keyed for the inventory.

**Fix.**

- Turn on `api_discovery` on the listener's HTTP Connection Manager extension (the UI hint says: *"Enable `api_discovery` on a listener's HCM extension to start collecting events."*).
- Set the node id to `listener_name::project_id::listener_ip`. The inventory unique key is built from `(project_id, listener_name, …)`; without a parseable node id, rows can't be attributed.
- Give it a couple of flush intervals — listeners appear at `/api-discovery` shortly after traffic starts. See [API Discovery overview](/api-discovery/overview).

### Collector metrics or dashboards show data, but ClickHouse/VictoriaMetrics is empty

**Cause.** The collector writes raw events to ClickHouse and the inventory to MongoDB; a down or misconfigured sink is abandoned (no retry) rather than blocking ingest.

**Fix.** Check `clickhouse_errors_total`, `mongo_errors_total{op="bulk_write"}`, and `batch_flush_errors_total` on the collector. Verify `CLICKHOUSE_URI` (prefer native `clickhouse://host:9000` over HTTP) and `MONGO_URI`. Sustained sink failure sheds events at the batcher boundary — the ingest path stays responsive by design. See [Collector reference](/api-discovery/collector-reference).

## Certificates & GSLB

### Certificate verification is stuck / pending

**Cause.** DNS-01 validation can't create or propagate the `_acme-challenge` TXT record — usually a missing or wrong DNS credential, or slow DNS propagation.

**Fix.** Under **Certificates** (`/acme`), confirm the certificate has a **DNS credential** attached for the right provider, then run/retry verification and use the DNS-propagation check. For providers needing **External Account Binding**, verify the EAB credentials. See [ACME certificates](/traffic-and-certificates/acme).

### GSLB records don't resolve (clients get NXDOMAIN or stale IPs)

**Cause.** The CoreDNS node serving the zone hasn't pulled the latest snapshot, or the zone isn't authoritative for the name.

**Fix.** Under **GSLB** (`/gslb`), open the node's drawer, check its health, and **push a notify** so it pulls the latest snapshot/change feed. Confirm the record's IPs are marked healthy on **GSLB → Statistics** and that the zone defaults under **Settings → GSLB** cover the queried name. See [GSLB](/traffic-and-certificates/gslb).

## Access & login

### Login or 2FA problems (locked out, lost authenticator)

**Cause.** A lost TOTP device, exhausted backup codes, or a directory/binding issue for LDAP users.

**Fix.**

- Use a **backup code** at the 2FA prompt if the authenticator is unavailable.
- An Owner/Admin can reset a locked-out user's 2FA so they can re-enroll.
- For LDAP/AD accounts, run the **connection test** and **authentication test** on **Settings → LDAP** to isolate a bind vs. search vs. credential problem. See [Authentication & Access](/administration/auth-and-access).
