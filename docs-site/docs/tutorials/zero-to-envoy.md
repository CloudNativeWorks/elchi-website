---
title: "Tutorial: From Install to First Listener"
description: The hello-world of Elchi — install the platform, connect an edge client, build a listener → route → cluster → endpoint, publish it, and verify traffic flows.
sidebar_position: 2
tags: [tutorial]
---

This is the "hello world" of Elchi: get from an empty machine to a request flowing through an Envoy you configured entirely from the UI. You will install the control plane, connect one edge node, then build the four resources every HTTP path needs — a [listener](/envoy-configuration/resources/listeners), a [route](/envoy-configuration/resources/routes), a [cluster](/envoy-configuration/resources/clusters), and an [endpoint](/envoy-configuration/resources/endpoints) — publish them as one snapshot, and watch Envoy serve traffic.

## What you'll build

A single edge Envoy that accepts HTTP on a port and forwards `/` to one upstream backend — managed as live xDS, with no Envoy restart at any point.

## Prerequisites

- A machine (or cluster) for the **central platform** and a separate Linux host for the **edge**.
- Network reachability from the edge to the controller's port.
- One reachable **upstream backend** (any HTTP service) for Envoy to route to.

## Step 1 — Install the platform

Pick the install path that matches your environment:

- **Kubernetes** — the bundled `elchi-stack` Helm chart installs every component (controller, control-plane, registry, MongoDB, collector, UI) with sensible defaults. See [Helm installation](/installation/helm-platform/installation).
- **Bare metal / VM** — the single-host installer script. See the [bare-metal quickstart](/installation/bare-metal/quickstart).

The Helm quick start is:

```bash
helm repo add elchi https://charts.elchi.io
helm repo update

helm install my-elchi elchi/elchi-stack \
  --set-string global.mainAddress="elchi.example.com" \
  --namespace elchi-stack \
  --create-namespace
```

Sign in with the bootstrap credentials `admin` / `admin` and change them on first login.

:::warning[Don't ship the defaults]
Before production, set `global.tlsEnabled: true`, replace `global.jwt.secret` with a 32+ character random value, point at a managed MongoDB, and run ≥3 replicas of the controller and control-plane. See the [production checklist](/installation/helm-platform/installation).
:::

## Step 2 — Connect an edge client

Each edge host runs Envoy plus the **elchi-client** agent, which registers the node and applies what the controller pushes. Install it with one command — grab your project's auth token from the UI first:

```bash
wget https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v1.1.0/elchi-install.sh

sudo bash elchi-install.sh \
  --name=edge-01 \
  --host=elchi.example.com \
  --port=443 \
  --tls=true \
  --token=your-auth-token
```

Full flag reference and OpenStack/BGP variants are in the [client installation guide](/installation/client/installation). Once it registers, `edge-01` appears under **Clients** in the UI, and the agent bootstraps an Envoy that connects back to the control plane over xDS.

## Step 3 — Understand the resource chain

Everything Elchi pushes to Envoy is a typed, validated [resource](/envoy-configuration/config-model). An HTTP request path is a dependency chain, top to bottom:

```
Listener (LDS)  → binds an address, runs the HTTP Connection Manager
   └─ Route (RDS)     → virtual host matches Host, first matching route picks a cluster
        └─ Cluster (CDS)   → the upstream pool + load-balancing policy
             └─ Endpoint (EDS)  → the concrete host:port to send to
```

You build them **bottom-up** (so each reference resolves), then publish the whole tree at once. Every resource is created against a specific **Envoy version** — you pick the version first and Elchi generates the form from that version's protobuf schema.

:::tip[Prefer the wizard]
Rather than build all four by hand, [Scenario Workflows](/envoy-configuration/scenario-workflows) generate a complete, valid API-gateway or load-balancer configuration in a few guided steps. This tutorial does it resource-by-resource so you understand what the wizard produces.
:::

## Step 4 — Create the cluster and endpoint

Go to **Resources → Endpoint** → **Add New**. Pick your Envoy version. Set `cluster_name` (this is the join key — it must match the cluster you create next) and add your backend's address:

```yaml
cluster_name: hello_backend
endpoints:
  - lb_endpoints:
      - endpoint:
          address:
            socket_address: { address: 10.0.1.20, port_value: 8080 }
```

Then **Resources → Cluster** → **Add New**. Name it `hello_backend`, discovery type `EDS`, and point it at the assignment you just made — see [Clusters](/envoy-configuration/resources/clusters):

```yaml
name: hello_backend
connect_timeout: 2s
type: EDS
eds_cluster_config:
  eds_config: { ads: {} }
lb_policy: ROUND_ROBIN
```

:::tip[STATIC is simpler for one host]
For a single fixed backend you can skip the separate endpoint resource entirely: use a `STATIC` cluster with an inline `load_assignment`. EDS shines when you add, drain, or reweight hosts without touching cluster policy — see [Endpoints](/envoy-configuration/resources/endpoints).
:::

## Step 5 — Create the route

**Resources → Route** → **Add New**. Build one virtual host that matches your host and forwards everything to the cluster — see [Routes](/envoy-configuration/resources/routes):

```yaml
name: hello_routes
virtual_hosts:
  - name: hello
    domains: ["hello.example.com", "*"]
    routes:
      - match: { prefix: "/" }
        route:
          cluster: hello_backend
          timeout: 15s
```

Routes are evaluated top-to-bottom, first match wins — put specific prefixes above catch-alls.

## Step 6 — Create the listener

**Resources → Listener** → **Add New**. A listener binds an address and runs the **HTTP Connection Manager**, which selects your route config and holds the HTTP filter chain (here, just the router) — see [Listeners](/envoy-configuration/resources/listeners):

```yaml
name: hello_ingress
address:
  socket_address:
    address: 0.0.0.0
    port_value: 8000
filter_chains:
  - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          rds:
            route_config_name: hello_routes
            config_source: { ads: {} }
          http_filters:
            - name: envoy.filters.http.router
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
```

:::tip[Managed listeners keep addresses portable]
Listeners default to **Managed by Service** — the bind address is filled from the edge node's IPs, so the same definition works across hosts. Leave it on unless you need a literal address.
:::

## Step 7 — Publish and deploy to the edge

Elchi keeps edits as **drafts** so you can stage the whole tree, then publish it together. Publishing validates the bundle (frontend proto types, then `protoc-gen-validate` on the controller), persists it, and pushes a new snapshot to the control plane. Assign the listener to your `edge-01` node and deploy — Envoy applies it **without a restart**.

Before publishing, check the **dependency graph** in the UI for orphaned references (a route pointing at an unpublished cluster is flagged). After publishing, open **Snapshot dump** on the listener to confirm the exact xDS payload that reached the proxy — the fastest way to prove a publish landed.

## Step 8 — Verify traffic flows

Send a request to the edge host on the port you bound:

```bash
curl -i http://<edge-01-host>:8000/ -H "Host: hello.example.com"
# HTTP/1.1 200 OK   ← served by your upstream backend
```

If it hangs or 503s, walk the chain back: **Snapshot dump** to confirm LDS/RDS/CDS/EDS all landed, then the dependency graph for a broken reference, then the cluster's health — a cluster with no reachable endpoints returns `503 no healthy upstream`.

## Next steps

- Add TLS: create a [Secret](/envoy-configuration/resources/secrets) and attach a downstream transport socket to the listener's filter chain, or issue certificates automatically with [ACME](/traffic-and-certificates/acme/overview).
- Turn on [API Discovery](/api-discovery/overview) for this listener and [build an inventory](/tutorials/api-inventory-in-one-day).
- Protect it: [Secure an API with Shield](/tutorials/secure-an-api-with-shield).
