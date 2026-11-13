---
slug: envoy-fleet-without-xds
title: "Running an Envoy Fleet Without Hand-Writing xDS"
description: "Hand-written xDS breaks on references, validation and versions, not syntax. What an Envoy control plane must do, and how Elchi handles each part."
authors: [cnw]
tags: [envoy, xds]
date: 2026-11-11
---

Envoy is easy to start with and hard to operate at fleet scale. One proxy with a static YAML bootstrap is a weekend project. Twenty proxies on VMs, a few on Kubernetes, two Envoy versions in flight and a change window every week is a different job. At that point most teams reach the same conclusion: Envoy is meant to be driven by a control plane over **xDS**, and somebody has to own that control plane.

This post covers what that control plane has to do, why hand-written xDS breaks down, and how we approached each part in Elchi. The problems apply to any Envoy deployment, whichever control plane you end up with.

<!-- truncate -->

## Envoy's configuration is an API, not a file

Every Envoy object (listener, route configuration, cluster, endpoint assignment, secret) is a protobuf message. The xDS protocols (LDS, RDS, CDS, EDS and SDS, aggregated over ADS) stream those messages to a proxy, and Envoy applies them **without a restart**. The static bootstrap only has to contain enough for Envoy to find its control plane.

The resources form a reference graph:

```
Listener ─▶ filter chain (HTTP connection manager) ─▶ route config ─▶ virtual host ─▶ route ─▶ cluster ─▶ endpoints
   └─ transport socket ─▶ secret (TLS)                                              cluster ─▶ transport socket ─▶ secret
```

A typo in a cluster name inside a route does not fail when the config loads. The route points at nothing, and requests get a 503 at runtime. Multiply that by every reference in a non-trivial config and the main cost of hand-written xDS becomes clear: **the references are the hard part, not the fields**.

## What a control plane has to do

If you build your own on top of a library such as go-control-plane, you take on a list of responsibilities. These are the ones that tend to cause trouble:

1. **Model resources and their references.** Know that deleting a cluster breaks three routes before it happens.
2. **Validate before pushing.** Protobuf type checking is not enough. Envoy's API carries validation rules (required fields, ranges, enum constraints) that should be enforced before anything leaves the control plane.
3. **Stage changes and ship them together.** Operators want to change several resources and ship them as one unit, not one push per field edit.
4. **Build and serve snapshots per node.** Each proxy needs a consistent set of resources, keyed by its node identity.
5. **Handle more than one Envoy version.** The API changes between releases. During an upgrade window part of the fleet runs the old version and part runs the new one.
6. **Show what actually shipped.** "I published it" and "the proxy is running it" are different statements.

None of this is exotic, but together it is a product. Elchi is our attempt to build that product so platform teams don't have to.

## Typed resources instead of YAML

In Elchi, everything pushed to Envoy is modeled as a **resource**: listeners, clusters, routes, endpoints, secrets and the bootstrap. HTTP, network, listener and UDP filters and reusable extension configurations are managed alongside them, versioned per Envoy release.

Every resource is created for one Envoy version, and its editor form is **generated from that version's protobuf definitions**. That has two practical effects. When a new Envoy release adds a field, the field appears in the editor for that version without hand-built UI work. And the form offers exactly the fields that version supports, so you don't write `@type` URLs or nest messages by hand.

Details: [Resources & the Config Model](/envoy-configuration/config-model).

## Two-step validation

Every change is checked twice:

1. **In the editor**: types generated from the Envoy API catch shape and type errors as you edit.
2. **On the server**: the controller runs the Envoy API's validation rules before the resource is persisted.

The second step is the one that protects the fleet. A resource that fails it is not stored and never reaches a snapshot, so a proxy is not the first place the error shows up.

Validation has a limit worth stating. A value can be valid against the schema and still be refused by a filter at runtime. The verification step further down is how you catch that case.

## Draft, save, publish

Edits are kept as **drafts**, so you can stage changes across several resources (say, a new route plus the cluster it targets) and publish them together. On publish, the controller validates the changes, persists them, and pushes a new snapshot to the control plane, which streams it to Envoy over ADS. Envoy applies it in place.

Config changes are also recorded in an audit trail, so "who changed this route, and when" has an answer. See [Audit & Syslog Forwarding](/observability/audit-and-syslog).

## Seeing the reference graph

The reference problem from the start of this post gets two views:

- A **dependency graph** for any resource shows what it links to (clusters, routes, secrets, filters). It is the quickest way to spot an orphaned or broken reference before you publish. See [Dependency Graph](/envoy-configuration/dependency-graph).
- A **route map** shows how requests flow through a listener's routes to upstreams. See [Route Map](/envoy-configuration/route-map).

## Verifying what Envoy received

Authoring tells you what you *intended*. The **Snapshot Dump** reads back the xDS snapshot the control plane is serving a specific node, with one tab per resource type and the full JSON. If a resource is not in the dump, the node is not running it, whatever the editor shows. A stale snapshot can be cleared for one node, which forces a rebuild and a re-push.

When a change "isn't taking effect", this check splits the problem in two: either the config never reached the node, or it did and the cause is elsewhere. See [Snapshot Dump](/envoy-configuration/snapshot-dump).

## Several Envoy versions at once

Elchi runs a control-plane instance for each Envoy version you deploy. When a proxy connects, a **registry** matches it to the control plane that speaks the version it reports, so a mixed fleet is a normal state, not an emergency.

Moving listeners to a newer version is a tracked background job. You select the listeners, pick a target version and can run it as a dry run first. The controller:

1. runs a per-listener dependency analysis to find everything that has to move together,
2. recreates the dependencies, then the listeners, in topological order,
3. regenerates snapshots and bootstrap configs for the target version.

Managed listeners switch to the new version through an Envoy hot restart, with no traffic interruption. Once nothing is left on the old version, a cleanup removes that version's leftover resources. See [Versions & Upgrades](/envoy-configuration/versions-and-upgrades).

## Where the proxies run

A central platform does not help if getting Envoy onto hosts is still manual. Each edge host runs a small agent, **elchi-client**. It has **no inbound listener**: it dials out to the controller, registers the node, runs the lifecycle commands the controller sends, and ships logs. Envoy's admin interface stays on loopback.

On the central side, one public TLS listener on `:443` carries the UI, the REST API, the agents' command stream, xDS and access logs. An ext_proc filter in front inspects each stream and routes it to the right internal service, so the internal ports never have to be exposed. The full wire map is in [Architecture](/getting-started/architecture).

## A minimal end-to-end path

The shortest route from nothing to traffic is on Kubernetes:

```bash
helm repo add elchi https://charts.elchi.io
helm repo update

helm install elchi elchi/elchi-stack \
  --set-string global.mainAddress=192.168.1.10 \
  --namespace elchi-stack \
  --create-namespace
```

`192.168.1.10` stands for the IP of one of your nodes or your load balancer. Then install the agent on one Linux host and build the four resources every HTTP path needs: endpoints, cluster, route configuration and listener. Publish them and send a request. The full walkthrough, including the client install, is in [From Install to First Listener](/tutorials/zero-to-envoy).

[Docker Swarm](/installation/docker-swarm/overview), [single-host](/installation/kind-quickstart) and [bare-metal (systemd)](/installation/bare-metal/overview) installs bring up the same control plane.

## When you don't need this

If you run a handful of proxies whose config changes rarely, a static bootstrap in version control is a fine choice and much simpler. A control plane earns its keep when the number of proxies, the rate of change, or the number of Envoy versions you run at once outgrows reviewing YAML diffs by hand. That is roughly when the six responsibilities above stop being theoretical.

## Summary

Hand-written xDS fails on references, validation and versions, not on syntax. A control plane that models resources as typed objects per Envoy version, validates them twice, publishes them as a unit and lets you read back what each node received removes most of those failure modes before a proxy ever sees them.

Without a license, Elchi runs a free tier, Elchi Core with a single managed client, which is enough to try the workflow end to end ([Licensing](/administration/licensing)).

## Next steps

- Follow the how-to: [Manage Envoy proxies without hand-writing xDS or YAML](/guides/manage-envoy-without-yaml).
- Running more than one Envoy version? See [Run multiple Envoy versions](/guides/run-multiple-envoy-versions).
- Read the product overview: [Elchi Core](https://www.elchi.io/products/core.html).
- Want to see it on your own topology? [Book a demo](https://www.elchi.io/contact.html).
