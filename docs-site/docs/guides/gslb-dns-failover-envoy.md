---
title: "GSLB and DNS Failover for Envoy with CoreDNS"
description: "DNS failover for Envoy edges: an Elchi GSLB record health-checks every edge IP, and elchi-coredns answers with only the healthy ones or a failover name."
sidebar_position: 4
tags: [guide]
---

# How to Do GSLB and DNS-Based Failover for Envoy with CoreDNS and Health Checks

DNS-based failover for Envoy works by answering a hostname with only the IP addresses of edges that pass a health check. In Elchi, a GSLB record maps an FQDN to the IPs of your Envoy edges, the controller probes every IP over HTTP, HTTPS or TCP, and elchi-coredns (a CoreDNS build with the Elchi GSLB plugin) serves the record authoritatively with the unhealthy IPs removed. When every IP of a record is down, the answer falls back to the record's failover FQDN in a backup zone.

## When you need this

- The same service runs on Envoy edges in more than one data center or region, and clients should resolve to an edge that is up.
- A failed edge should leave DNS answers without someone editing records.
- You want to take an edge out of rotation for maintenance and put it back later.
- Resolvers in a region should get the IPs of nearby edges.

GSLB steers at name resolution, so it is coarse-grained and bounded by resolver caching of the record TTL. It does not replace in-path load balancing; Envoy still balances connections behind each resolved IP.

## Steps

1. **Deploy elchi-coredns and set the zone.** The bare-metal installer provisions elchi-coredns by default (DNS on port 53 and a control webhook on 8053) with `--gslb-zone`, `--gslb-secret` and related flags. The zone defaults to the non-routable `elchi.local`; for real traffic, pass a domain delegated to the elchi-coredns nodes (for example `gslb.example.com`) and its NS records with `--gslb-nameservers`. On Kubernetes, set `global.installGslb: true` in the Helm chart. Zone defaults and the shared secret are editable under **Settings → GSLB**.
2. **Create a record with a probe.** Create the record in the GSLB UI or with `POST /api/v3/gslb`: the FQDN, a TTL, an optional `failover_zone`, and a `probe` object. Choose `type` (`http`, `https` or `tcp`), `port`, `path` and `host_header` for HTTP probes, an `interval` (10 to 300 seconds), a `timeout` (0.1 to 3.0 seconds), `expected_status_codes`, and the `warning_threshold`, `critical_threshold` and `passing_threshold` counts. See [Records & IPs](/gslb/records-and-ips).
3. **Add the edge IPs.** Add each edge's address with `POST /api/v3/gslb/:id/ips`. When a client is deployed to a GSLB-enabled service, Elchi creates the record and its IPs automatically; deploy and undeploy then manage those IPs, and you can still add manual backup IPs to the record.
4. **Optionally tag regions.** Set region tags on an IP with `PUT /api/v3/gslb/:id/ips/:ip/regions`. A region-filtered snapshot serves only IPs whose tags match the requested regions.
5. **Push changes now instead of waiting for the poll.** elchi-coredns polls the controller on its sync interval (default `1m`). `POST /api/v3/gslb/nodes/notify-all?project=<id>` pushes the named records to every node at once. See [Nodes & CoreDNS](/gslb/nodes-coredns).
6. **Drain an edge for maintenance.** Set the IP's health state to `critical` with `PUT /api/v3/gslb/:id/ips/:ip` to remove it from answers, and to `passing` to return it. The override is not permanent: the health checker keeps probing and moves the IP again on real results.
7. **Watch probe health.** The [Statistics](/gslb/statistics) page shows IP health, probe success and errors, and latency.

## How it works

**Probing.** The health checker runs inside the elchi-backend controller and shards its work across controllers. Each IP is in one of four states: `passing`, `warning`, `critical` or `recovery`. Consecutive failures move an IP from `passing` to `warning` at `warning_threshold` and to `critical` at `critical_threshold`. With `passing_threshold` above 1, a recovering IP stays in `recovery` until it reaches that many consecutive successes, which keeps an unstable endpoint from flapping in and out of DNS. `warning` and `recovery` IPs are probed at half the interval; `critical` IPs back off exponentially, capped at 300 seconds.

**Serving.** Only `passing` and `warning` IPs appear in DNS answers. elchi-coredns never reads MongoDB and never probes. It polls `GET /dns/snapshot` and `GET /dns/changes` on the controller, authenticated with the zone's shared secret in the `X-Elchi-Secret` header, caches the result and answers queries for the zone. The controller builds each record's answer from the IP health documents, leaving out `critical` and `recovery` IPs. If a record has no healthy IP, or is disabled, the snapshot carries the record's failover FQDN so CoreDNS can steer to the backup zone.

**Failover time** depends on the probe interval, the thresholds, the sync interval (or a notify) and the record TTL that resolvers and clients cache. Shorter TTLs propagate an eviction faster and increase resolver traffic.

## Related docs

- [GSLB Overview](/gslb) - components, the DNS snapshot API and key concepts.
- [Health model](/gslb/health-model) - probe types, the four states and the circuit breaker.
- [Records & IPs](/gslb/records-and-ips) - record fields, IPs, regions and overrides.
- [Nodes & CoreDNS](/gslb/nodes-coredns) - node tracking and notify operations.
- [Services: Recreate GSLB](/operations/services#recreate-gslb-disaster-recovery) - rebuild a service's GSLB record after a restore.

## Next steps

- **Product:** [Elchi GSLB](https://www.elchi.io/products/gslb.html) - health-checked DNS steering across your Envoy edges.
- **Plans:** [compare plans and licensing](https://www.elchi.io/plans.html), from the free tier to enterprise.
- **Talk to us:** running this across many Envoy edges? [Book a demo](https://www.elchi.io/contact.html) with the Elchi team.
