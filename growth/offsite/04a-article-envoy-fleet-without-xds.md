# Article draft (a): Running an Envoy fleet without hand-writing xDS

Status: **not published**. Target: dev.to and Medium (EN). About 1,300 words in the body below.

## Publishing notes (not part of the article)

- **Canonical URL:** publish on elchi.io first if a blog section exists. If not, publish on dev.to first, and in both
  places point the canonical at the most specific elchi.io page you control. The body links to the docs, so the docs
  get the link equity either way.
  - dev.to: front matter `canonical_url: https://www.elchi.io/...` (Settings → "Canonical URL" in the editor).
  - Medium: *Story settings → Advanced settings → "This story was originally published elsewhere"* → the canonical URL.
    Medium's "Import a story" tool sets it automatically.
- If there is no elchi.io blog, consider publishing this text as a docs page or blog post on the site first
  (for example `/blog/envoy-fleet-without-xds`), then cross-post with the canonical set. This repo is being edited by
  others, so that is the user's call. Nothing was added to the site.
- dev.to tags (max 4): `envoy`, `kubernetes`, `devops`, `networking`.
- Disclose affiliation in the first or last paragraph (included below).
- Cover image: `public/shots/listener-light.webp` (the typed listener editor), or the OG card.
- Fact base: `docs/envoy-configuration/config-model.md`, `versions-and-upgrades.md`, `snapshot-dump.md`,
  `getting-started/architecture.md`, `tutorials/zero-to-envoy.md`. Every product claim below is taken from those pages.
  No numbers, customers or benchmarks.

---

## Running an Envoy fleet without hand-writing xDS

*Disclosure: I work on Elchi, the control plane used for the examples. The problems described apply to any Envoy deployment.*

Envoy is easy to start with and hard to operate at fleet scale. One proxy with a static YAML bootstrap is a weekend
project. Twenty proxies on VMs, a few on Kubernetes, two Envoy versions in flight and a change window every week is a
different job. At that point most teams arrive at the same conclusion: Envoy is meant to be driven by a control plane
over **xDS**, and somebody has to own that control plane.

This post covers what that control plane has to do, why hand-written xDS breaks down, and how we approached it in Elchi.

### Envoy's configuration is an API, not a file

Every Envoy object (listener, route configuration, cluster, endpoint assignment, secret) is a protobuf message.
The xDS protocols (LDS, RDS, CDS, EDS, SDS, aggregated over ADS) stream those messages to a proxy, and Envoy applies
them **without a restart**. The static bootstrap is only the minimum needed to find the control plane.

The resources form a reference graph:

```
Listener ─▶ filter chain (HTTP connection manager) ─▶ route config ─▶ virtual host ─▶ route ─▶ cluster ─▶ endpoints
   └─ transport socket ─▶ secret (TLS)                                              cluster ─▶ transport socket ─▶ secret
```

A typo in a cluster name inside a route does not fail at "file load". The route points at nothing, and requests get
a 503 at runtime. Multiply that by every reference in a non-trivial config and the main cost of hand-written xDS
becomes clear: **the references are the hard part, not the fields**.

### What a control plane actually has to do

If you build your own on top of a library such as go-control-plane, you inherit a list of responsibilities. These are
the ones that tend to bite:

1. **Model resources and their references.** Know that deleting a cluster breaks three routes before it happens.
2. **Validate before pushing.** Protobuf type checking is not enough: Envoy's API carries validation rules
   (required fields, ranges, enum constraints) that should be enforced before anything leaves the control plane.
3. **Version and stage changes.** Operators want to change several resources and ship them together, not
   one push per field edit.
4. **Build and serve snapshots per node.** Each proxy needs a consistent set of resources, keyed by its node identity.
5. **Handle more than one Envoy version.** The API evolves between releases. During an upgrade window part of the fleet
   runs the old version and part runs the new one.
6. **Show what actually shipped.** "I published it" and "the proxy is running it" are different statements.

None of this is exotic, but together it is a product. Elchi is our attempt to build that product so platform teams don't
have to.

### Typed resources instead of YAML

In Elchi, everything pushed to Envoy is modeled as a **resource**: listeners, clusters, routes, endpoints, secrets and
the bootstrap. Filters (HTTP, network, listener, UDP) and reusable extensions are managed alongside them.

The editor forms are **generated from Envoy's protobuf definitions**, per Envoy version. That has two practical effects.
First, when a new Envoy release adds a field, the field appears in the editor without hand-built UI work. Second,
you cannot set a field that does not exist in the version a resource targets, because the form is built from that
version's schema.

Details: [Resources & the Config Model](https://www.elchi.io/docs/envoy-configuration/config-model).

### Two-step validation

Every change is checked twice:

1. **In the editor**: types generated from the Envoy API catch shape and type errors as you type.
2. **On the server**: the controller runs the Envoy API's validation rules before the resource is persisted.

The second step matters because it runs on every write path, not only in the UI. A bad resource is rejected with a
reason instead of being stored and discovered later by a proxy.

### Draft, save, publish

Edits are kept as **drafts**, so you can stage changes across several resources (say, a new route plus the cluster it
targets) and publish them together. On publish, the controller validates the bundle, persists it, and hands a new
snapshot to the control-plane process, which pushes it over ADS. Envoy applies it live.

Changes are recorded in an audit log, so "who changed this route, and when" has an answer.

### Seeing the reference graph

The reference problem from the start of this post gets two views:

- A **dependency graph** for any resource: what it links to (clusters, routes, secrets, filters) and what links to it.
  It is the quickest way to spot an orphaned or broken reference.
  See [Dependency Graph](https://www.elchi.io/docs/envoy-configuration/dependency-graph).
- A **route map**: a topology view of how requests flow through a listener's routes to upstreams.

### Verifying what Envoy received

Authoring tells you what you *intended*. The **Snapshot Dump** reads back the xDS snapshot the control-plane is serving
a specific node, as a JSON tree with one tab per resource type. If a resource is not in the dump, the node is not
running it, whatever the editor shows. A stale snapshot can be cleared for one node, which forces a rebuild and a re-push.

When a change "isn't taking effect", this check splits the problem in two: did the config reach the node, or is the
cause elsewhere? See [Snapshot Dump](https://www.elchi.io/docs/envoy-configuration/snapshot-dump).

### Several Envoy versions at once

Elchi runs control-plane instances for each Envoy version you deploy. A **registry** process matches each connecting proxy
to the control-plane that speaks its version, so a mixed fleet is a normal state, not an emergency.

Moving listeners to a newer version is a tracked operation. You pick the listeners and a target version (with an
optional dry run). The controller runs a per-listener dependency analysis, recreates the dependencies and then the
listeners in topological order, and regenerates snapshots and bootstraps for the target version. Managed listeners
switch over with an Envoy hot restart, without interrupting traffic. When nothing is left on the old version, a
cleanup removes its resources.
See [Versions & Upgrades](https://www.elchi.io/docs/envoy-configuration/versions-and-upgrades).

### Where the proxies run

A central platform does not help if getting Envoy onto hosts is still manual. Each edge host runs a small agent,
**elchi-client**. It has **no inbound listener**: it dials out to the controller over gRPC, registers the node, runs
the lifecycle commands the controller sends (deploying a service, for example), and ships logs. Envoy's admin
interface stays on loopback.

On the central side, one public TLS listener (`:443`) carries the UI, the REST API, the agents' command stream, xDS
and access logs. An ext_proc filter routes each stream to the right internal service, so only one port has to be exposed. Full wire map: [Architecture](https://www.elchi.io/docs/getting-started/architecture).

### A minimal end-to-end path

The shortest route from nothing to traffic, on Kubernetes:

```bash
helm repo add elchi https://charts.elchi.io
helm repo update
helm install my-elchi elchi/elchi-stack \
  --set-string global.mainAddress="elchi.example.com" \
  --namespace elchi-stack --create-namespace
```

Then install the agent on one Linux host, and build the four resources every HTTP path needs (listener, route,
cluster, endpoint). Publish them as one snapshot and send a request. The full walkthrough, including the client install,
is in [From Install to First Listener](https://www.elchi.io/docs/tutorials/zero-to-envoy). Docker Swarm, single-VM
and bare-metal (systemd) installs bring up the same control plane:
[installation options](https://www.elchi.io/docs/).

### When you don't need this

If you run a handful of proxies whose config changes rarely, a static bootstrap in version control is a fine choice
and much simpler. A control plane earns its keep when the number of proxies, the rate of change, or the number of
Envoy versions you run at once outgrows reviewing YAML diffs by hand. That is roughly when the six responsibilities
above stop being theoretical.

### Summary

Hand-written xDS fails on references, validation and versions, not on syntax. A control plane that models resources
as typed, versioned objects, validates them twice, publishes them as a unit and lets you read back what each node
received removes most of the failure modes before a proxy ever sees them.

Elchi's free tier manages one edge node without a license, which is enough to try the workflow end to end.
Docs: [elchi.io/docs](https://www.elchi.io/docs/). Video walkthroughs: [CloudNativeWorks on YouTube](https://www.youtube.com/@CloudNativeWorks).
