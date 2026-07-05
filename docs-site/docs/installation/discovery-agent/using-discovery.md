---
title: Using K8s Discovery
description: The in-UI workflow after the discovery agent is installed — browse imported clusters, inspect nodes, check which endpoints use a cluster, and remove a cluster safely.
sidebar_position: 5
tags: [discovery]
---

Once the [discovery agent is installed](/installation/discovery-agent/installation)
in a Kubernetes cluster, it registers the cluster with Elchi and continuously
reports its nodes and discovered service endpoints. This page covers what you do
**in the Elchi UI** after that: the **Kubernetes Discovery** view, where imported
clusters appear and where discovered endpoints feed your Envoy configuration.

For what the agent is and how to deploy it, start with the
[Discovery overview](/installation/discovery-agent/overview) and
[installation guide](/installation/discovery-agent/installation).

## The imported-clusters list

The Discovery view lists every Kubernetes cluster registered by a discovery agent,
backed by `GET /api/discovery/clusters`. Each row shows:

- **Cluster name** — the unique name you set when deploying the agent
  (`clusterName`).
- **Status** — **ACTIVE** or **INACTIVE**, computed from the last heartbeat: a
  cluster that hasn't reported in the last **10 minutes** is shown as inactive
  (and highlighted), a quick signal that an agent has stopped reporting.
- **Version** — the Kubernetes version of the cluster.
- **Nodes** — the number of nodes the agent reported.
- **Last seen** — how long ago the agent last checked in.

Inactive clusters are sorted to the top and visually flagged so they're easy to
spot. The list has per-column search, and a **Refresh** button re-fetches the
current state. If no clusters have registered yet, the view shows a **Setup
Instructions** panel with the Helm commands to deploy an agent.

## Inspecting a cluster

Opening a cluster's **details** shows its full inventory:

- **Cluster information** — name, active/inactive status, Kubernetes version, node
  count, project, and last-seen time.
- **Nodes** — a per-node table with the node **name**, **status** (`Ready` /
  `NotReady`), Kubernetes **version**, **roles** (e.g. control-plane / worker), and
  its **addresses** (internal/external IP, hostname).

This is a read-only view of what the agent reports, useful for confirming the
agent sees the cluster you expect and that its nodes are healthy.

## Per-cluster usage — who depends on this cluster

Before changing or removing a discovery cluster, check what relies on it. The
**Usage** view (`GET /api/discovery/clusters/{id}/usage`) lists the Elchi
**endpoint** resources that consume this cluster's discovered addresses. For each
consuming endpoint it shows:

- **Endpoint name** and **version**.
- **IP count** — how many discovered addresses currently back it.
- **Last updated** — when the endpoint's address set last changed.
- **IP addresses** — the actual discovered IPs feeding the endpoint.

A usage count of **0** means no endpoint currently references this cluster — it can
be removed without affecting any Envoy config. A non-zero count tells you exactly
which endpoints would lose their dynamically discovered upstreams if you delete it.

## How discovered endpoints feed clusters

The agent's job is to keep Envoy upstreams in sync with Kubernetes reality. As
services and endpoints change in the cluster, the agent syncs the current set of
addresses to Elchi, and those addresses populate the **endpoint** resources that
your Envoy **clusters** point at. The result: your Envoy clusters always see an
up-to-date set of upstream IPs without you editing endpoints by hand. The Usage
view above is the bridge between the two worlds — it names the endpoint resources
each discovery cluster is currently feeding.

## Removing a cluster

To deregister a cluster, use the **Delete** action
(`DELETE /api/discovery/clusters/{id}`). Deletion is confirmed and permanent.

:::warning Check usage first
Deleting a discovery cluster removes it as a source of discovered addresses.
Open its **Usage** view first: if endpoints still reference it (usage count &gt; 0),
those endpoints will stop receiving updated addresses. Delete only clusters with no
active usage, or after repointing the affected endpoints.
:::

Note that deleting the cluster record in Elchi and stopping the agent are separate
actions — if the agent is still running in Kubernetes, it will re-register the
cluster on its next heartbeat. To retire a cluster for good, uninstall the agent
Helm release and then delete the record.

## Related

- [Discovery overview](/installation/discovery-agent/overview)
- [Installing the discovery agent](/installation/discovery-agent/installation)
