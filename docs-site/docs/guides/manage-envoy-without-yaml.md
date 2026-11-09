---
title: How to Manage Envoy Proxies Without Hand-Writing xDS or YAML
description: Use Elchi as the Envoy control plane - every listener, route, cluster, endpoint and secret is edited in a typed form generated from Envoy's protobuf definitions, validated in the editor and on the server, and pushed to running proxies over xDS without a restart.
sidebar_position: 1
tags: [guide]
---

You can run Envoy without writing xDS payloads or YAML by managing it through a control plane that builds the configuration for you. In Elchi, every Envoy object (listener, route configuration, cluster, endpoints, secret, filter) is a resource edited in a form generated from that Envoy version's protobuf definitions. Each change is validated twice, in the editor and on the controller, and a publish pushes a new snapshot to connected proxies over xDS (ADS), which they apply without a restart.

## When you need this

- Your Envoy configuration lives in large static YAML files and every change means editing, reviewing and reloading them by hand.
- You run several Envoy proxies and want one place that holds the desired configuration and pushes it to all of them.
- Typos in field names, wrong `@type` URLs or broken references between listeners, routes and clusters only show up when Envoy rejects the config.
- You want to see what a proxy is actually running, not only what was intended.

## Steps

1. **Install the platform and connect an edge host.** Install the control plane ([Helm](/installation/helm-platform/installation) or [bare metal](/installation/bare-metal/quickstart)), then install the [elchi-client](/installation/client/installation) agent on the host that runs Envoy. The agent registers the node, and the Envoy it bootstraps connects back to the control plane over xDS.
2. **Pick the Envoy version.** Every resource is created for one Envoy version. The form you get is generated from that version's protobuf schema, so it offers exactly the fields that version supports.
3. **Build the resource chain bottom-up.** Create the [endpoints](/envoy-configuration/resources/endpoints), then the [cluster](/envoy-configuration/resources/clusters) that uses them, then the [route configuration](/envoy-configuration/resources/routes), then the [listener](/envoy-configuration/resources/listeners) whose HTTP connection manager selects that route configuration. You fill in typed fields; you do not write `@type` URLs or nest messages by hand. For common setups, the [Scenario wizard](/envoy-configuration/scenario-workflows/overview) generates the whole chain in a few guided steps.
4. **Use the in-form tools for error-prone fields.** The editor has an RE2 regex tester on `safe_regex` fields, a certificate chain inspector on TLS secrets, and generators for random secrets, 80-byte session ticket keys and Basic Auth hashes. See [In-Form Tools](/envoy-configuration/form-tools).
5. **Check references before you publish.** The [dependency graph](/envoy-configuration/dependency-graph) shows how a resource links to clusters, routes, secrets and filters and flags orphaned or broken references. The [route map](/envoy-configuration/route-map) shows how requests flow through a listener's routes to upstreams.
6. **Save, then publish.** Edits are kept as drafts so you can stage several related changes, then publish them together. Publishing validates the changes, stores them and pushes a new snapshot to the control plane.
7. **Confirm what the proxy received.** Open **Registry → Control Planes**, expand the control plane that serves the listener and click **Details** in the node's **Snapshot** column. The [Snapshot Dump](/envoy-configuration/snapshot-dump) shows the exact xDS resources the control plane serves that node.

## How it works

Elchi splits the work across three processes (see [Core Concepts](/getting-started/concepts)):

- The **controller** owns the resources. It validates each change against Envoy's protobuf schemas and the Envoy API's validation rules, then stores it in MongoDB.
- The **control plane** is a gRPC xDS server (`:18000`). It builds a versioned snapshot per node and streams it to Envoy over ADS. Envoy applies listener, route, cluster, endpoint and secret updates in place, so a publish needs no restart.
- The **registry** routes each proxy and each controller request to the control plane that serves the proxy's Envoy version.

Validation runs at two points. In the editor, types generated from the Envoy API catch shape and type errors as you edit. On the server, the Envoy API's validation rules run before the resource is persisted. A resource that passes both can still be refused by the proxy, for example when a value is valid in the schema but not accepted by the filter at runtime; the Snapshot Dump and the configuration errors on the [Services](/operations/services) console show what the proxy is running and what it refused.

Because the forms are generated from the protobuf definitions, a field added in a newer Envoy release appears in the editor for that version without separate UI work. HTTP, network, listener and UDP filters and reusable extension configurations are versioned per Envoy release in the same way. See [Resources & the Config Model](/envoy-configuration/config-model).

## Related docs

- [Tutorial: From Install to First Listener](/tutorials/zero-to-envoy) - the full walkthrough, with the YAML each form produces.
- [Resources & the Config Model](/envoy-configuration/config-model) - resource types, two-step validation, save and publish.
- [Scenario Workflows](/envoy-configuration/scenario-workflows/overview) - generate multi-resource configurations step by step.
- [Templates & Snippets](/envoy-configuration/templates-snippets) - reusable resource templates and config snippets.
- [Snapshot Dump](/envoy-configuration/snapshot-dump) - the xDS snapshot a node is served.
- [Architecture](/getting-started/architecture) - every process, port and data flow.
