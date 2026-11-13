---
slug: envoy-on-vms-without-kubernetes
title: Running Envoy on VMs Without Kubernetes
description: Envoy runs well on plain VMs if you cover bootstrap, xDS, process supervision, upgrades and telemetry. Here is what each needs and how Elchi automates it.
authors: [cnw]
tags: [envoy, vms]
date: 2026-11-10
---

Envoy does not need Kubernetes. It is a single static binary that reads a bootstrap file and, if you let it, fetches the rest of its configuration from a control plane over xDS. Many teams run it on virtual machines or bare metal as an edge proxy, an API gateway or a load balancer in front of services that will never move into a cluster.

What Kubernetes and a service mesh normally give you for free is everything around the binary: a bootstrap for each proxy, a connection to a control plane, a supervisor that restarts it, a way to upgrade it, and a path for its logs and metrics. This post lists what you have to provide yourself on a VM, and then shows how the Elchi edge agent, `elchi-client`, provides each piece.

<!-- truncate -->

## What a VM-based Envoy needs

### A bootstrap per proxy

Every Envoy process starts from a bootstrap file. At minimum it sets a node identity (`node.id`, `node.cluster`), the admin interface, and either the full configuration under `static_resources` or a `dynamic_resources` section that points at a control plane. If you run several Envoy processes on one host, each needs its own bootstrap, its own admin port and its own `--base-id`, the value Envoy uses to keep the shared memory of separate processes apart.

### A connection to a control plane

With a static bootstrap, every change means editing a file on every host and restarting. With `dynamic_resources` and ADS, Envoy keeps a gRPC stream open to a management server and applies listener, route, cluster, endpoint and secret changes live. Our post [What is an Envoy control plane?](./2026-11-13-what-is-an-envoy-control-plane.md) explains the xDS side.

### Process supervision

On a VM, something has to start Envoy at boot, restart it when it crashes, limit its resources and stop it cleanly. On Linux that is systemd. You also need the unit to fail early on a broken bootstrap instead of crash-looping; `envoy --mode validate` checks a bootstrap without starting the proxy.

### Binary distribution and upgrades

Envoy releases often. You need a way to get a given version onto each host, verify it, keep the previous version around, and move a running proxy to the new binary. A plain `systemctl restart` closes the listening sockets and the connections on them. Envoy's answer is **hot restart**: a new process is started with `--restart-epoch` one higher, takes over the listening sockets from the old process over a Unix domain socket, and the old process drains its connections for `--drain-time-s` and is shut down after `--parent-shutdown-time-s`. Hot restart only works between two binaries that report the same `--hot-restart-version`, and Envoy itself does not supervise this; the upstream project ships a small Python wrapper, `hot-restarter.py`, that forks the new epoch when it receives SIGHUP. See the [hot restart documentation](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/operations/hot_restart).

### Logs and metrics

Envoy writes access logs, exposes statistics on its admin interface and can push both through stats sinks and the access log service (ALS). On a VM there is no sidecar collector by default, so you choose where each signal goes and wire it into every bootstrap.

## How Elchi does it

Elchi splits this work between the central platform and an agent on each host. The control plane builds configuration and serves it over xDS; `elchi-client` runs on every edge VM, registers with the platform, and does the host-side work.

### Registration

`elchi-client` has no inbound listener. It dials out to the platform's controller over gRPC (through the platform's single front door on port 443) and registers with a token of the form `<uuid>--<projectId>`, which ties the host to one project. On every registration it also reports the listeners it already runs, so the control plane can reconcile what it expects with what is on the box. Installation is one command; see [Client installation](/installation/client/installation).

### Envoy binaries

The agent downloads Envoy binaries from the release archive (`https://archive.elchi.io/index.json` by default, configurable for a mirror), verifies each download's checksum, and stores every version under its own directory in `/var/lib/elchi/envoys/`. Several versions can be present at once, and the client's **Apps** tab in the UI shows which ones are downloaded and which can be installed. See [Clients](/operations/clients).

### One systemd unit per listener

When you deploy a listener from the UI, the control plane generates its bootstrap. That bootstrap sets the node ID (`listener::project::ip`), fetches LDS and CDS over ADS with delta xDS, and sends the Envoy version as gRPC metadata so the platform routes the stream to the control plane built for that version.

The agent writes the bootstrap to `/var/lib/elchi/bootstraps/` and runs the listener as its own systemd unit, `<listener>-<adminPort>.service`. One Envoy process per listener means a bad change, a crash or an upgrade affects one listener, not every listener on the host. Each unit:

- validates the bootstrap with the same binary (`--mode validate`) before starting;
- uses the admin port as `--base-id`, so the processes on one host never share hot-restart memory;
- runs Envoy through a hot-restart wrapper, with `ExecReload` sending SIGHUP;
- restarts 3 seconds after Envoy exits, and stops trying after 10 starts in 5 minutes;
- adds the listener's address to the host only once Envoy reports it is live and ready, and removes it when the unit stops, so a crashed or held listener stops attracting traffic;
- caps memory with `MemoryHigh` and the Envoy overload manager that the agent adds to the bootstrap, rather than a hard kill.

Deployed listeners appear in the UI under [Services](/operations/services), with their status per client.

### Zero-downtime version upgrades

Upgrading a listener to a newer Envoy version is a job in the UI or API. The control plane copies the listener's dependencies into the target version and moves the listener and its bootstrap; the agent then switches the running process.

The agent does not point the unit at a versioned binary path. The unit runs a per-listener symlink in `/var/lib/elchi/envoys/current/`, and the wrapper re-runs that same path on SIGHUP. To upgrade, the agent compares the `--hot-restart-version` of the running binary with that of the target binary. When they match, it repoints the symlink and reloads the unit: Envoy's hot restart starts the next epoch, which takes over the listening sockets while the old process drains. When they do not match, the agent falls back to a full restart and says so in the job result.

In our end-to-end tests, the listener upgrade runs against a control plane serving at least two Envoy versions, with a client on a separate VM. The recorded run moved a listener from Envoy 1.38.3 to 1.39.0 under a steady load of 20 requests per second: 1,499 requests were sent and 0 were dropped. The service kept the same systemd main PID, the restart epoch went up by one, and the agent reported "hot restarted (epoch 0 -> 1), zero connection loss". A later run of the same test group, upgrading from 1.39.1 to 1.39.3, again lost no request. The test judges a dropped request with Envoy's own request counters, read before and after the load window, not only with the load generator's view.

The conditions matter. The result applies when the two binaries are hot-restart compatible, the target version is already on the agent, and every client of the service is connected; otherwise the job fails or the agent falls back to a full restart, which drops the open connections. The step-by-step guide is [Run several Envoy versions side by side](/guides/run-multiple-envoy-versions), and the details are in [Versions & Upgrades](/envoy-configuration/versions-and-upgrades).

### Logs and metrics

Envoy statistics go through a stats sink to an OpenTelemetry Collector and on to VictoriaMetrics, with dashboards in the UI and Grafana. Access logs can stream over ALS to `elchi-collector` for API discovery. Service logs are searchable in the UI's log viewer, and the agent can forward them to Syslog or Elastic/Logstash. See [Metrics & Logs](/observability/metrics-and-logs).

## High availability without Kubernetes

A single VM is a single point of failure. Elchi offers two ways to remove it.

With BGP, several edge hosts can announce the same listener address, and each unit's address handling means a host whose listener is down stops announcing it.

Without BGP, use an **HA pair**: two [Elchi OS](/elchi-os/overview) appliances that serve the same services on the same virtual IPs. Both members receive the same xDS configuration and run the same Envoy listeners; only the active member holds the VIPs. The boxes elect the active member themselves with a heartbeat on UDP 8650 and probes of the peer's data plane, so a control-plane outage never moves a VIP. On failover, the standby adds the VIP and sends gratuitous ARP. An Envoy hot restart or an xDS update does not cause a failover. HA pairs need Elchi OS on both members; they are not available for a client installed on a general-purpose Linux host. See [HA Pairs Overview](/ha-pairs/overview) for the failover rules and the measured takeover times.

## Next steps

- Install the agent: [Elchi Client installation](/installation/client/installation).
- Deploy and upgrade listeners: [Run several Envoy versions side by side](/guides/run-multiple-envoy-versions) and [Manage Envoy without YAML](/guides/manage-envoy-without-yaml).
- Remove the single box: [HA Pairs Overview](/ha-pairs/overview) and [Elchi OS](/elchi-os/overview).
- Learn more about [Elchi Core](https://www.elchi.io/products/core.html), or [book a demo](https://www.elchi.io/contact.html).
