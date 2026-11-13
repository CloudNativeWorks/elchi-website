---
title: "Using K8s Discovery"
description: "The in-UI workflow after installing the discovery agent: browse imported clusters, link endpoints to them, check which endpoints use a cluster, remove one."
sidebar_position: 5
tags: [discovery]
---

Once the [discovery agent is installed](/installation/discovery-agent/installation)
in a Kubernetes cluster, it registers the cluster with Elchi and keeps reporting
its nodes. This page covers what you do **in the Elchi UI** after that: the
**Discovery** view, where imported clusters appear, and the endpoint resources
that turn discovered nodes into Envoy upstreams.

For what the agent is and how to deploy it, start with the
[Discovery overview](/installation/discovery-agent/overview) and
[installation guide](/installation/discovery-agent/installation).

## The imported-clusters list

The Discovery view lists every Kubernetes cluster registered by a discovery agent
in the current project, backed by `GET /api/discovery/clusters`. Each row shows:

- **Cluster name**: the unique name you set when deploying the agent
  (`clusterName`).
- **Status**: **ACTIVE** or **INACTIVE**, computed from the last report: a
  cluster that hasn't reported in the last **10 minutes** is shown as inactive
  (and highlighted), a quick signal that an agent has stopped reporting. The
  last-seen time is refreshed at most every 2 minutes.
- **Version**: the Kubernetes version of the cluster.
- **Nodes**: the number of nodes the agent reported.
- **Last seen**: how long ago the agent last checked in.

Inactive clusters are sorted to the top and visually flagged so they're easy to
spot. The list has per-column search, and a **Refresh** button re-fetches the
current state. If no clusters have registered yet, the view shows a **Setup
Instructions** panel with the Helm commands to deploy an agent.

## Inspecting a cluster

Opening a cluster's **details** shows its full inventory:

- **Cluster information**: name, active/inactive status, Kubernetes version, node
  count, project, and last-seen time.
- **Nodes**: a per-node table with the node **name**, **status** (`Ready` /
  `NotReady`), Kubernetes **version**, **roles** (e.g. control-plane / worker), and
  its **addresses** (internal/external IP, hostname).

This is a read-only view of what the agent reports, useful for confirming the
agent sees the cluster you expect and that its nodes are healthy.

## Link an endpoint to a cluster

Discovered nodes reach Envoy through **endpoint** resources. Open an endpoint
resource and click **Configure Discovery** in its header to open **Cluster
Discovery Configuration**. For each cluster you add, choose:

| Field | Meaning |
| --- | --- |
| **Cluster** | A cluster from the imported-clusters list. |
| **Protocol** | `TCP` or `UDP`, written into each address. |
| **Port** | 1–65535. Every discovered node is added on this port, typically the service's NodePort. |
| **Address Type** | **External IP** or **Internal IP** of each node. Only the types the cluster's nodes actually report can be selected. |
| **Node Roles** | **Control Plane (Master)** and/or **Worker**. Worker is checked by default; an entry saved with no role is treated as worker-only. |

One endpoint resource can draw on several clusters. After you save, the button
shows the number of linked clusters.

## How discovered endpoints feed clusters

On every report from the agent, Elchi finds the endpoint resources in the
project that are linked to that cluster name and, for each one:

1. selects the reported nodes that have one of the chosen roles, and takes each
   node's chosen address type;
2. compares that IP list with the one the endpoint currently holds for this
   cluster;
3. if it changed, replaces the cluster's `lb_endpoints` with one address per node
   (`ip:port` with the chosen protocol), records an entry in the
   [audit log](/observability/audit-and-syslog) with the before and after IPs,
   and pushes the change to the listeners that use the endpoint.

Each linked cluster is kept as its own locality (its `region` is the cluster
name), so addresses from other clusters, and entries you added by hand, are left
alone. If the new list would be **empty** while the endpoint currently has
addresses (for example, a role or address type that no node matches), Elchi
keeps the current addresses and logs a warning instead of emptying the endpoint.

## Per-cluster usage: who depends on this cluster

Before changing or removing a discovery cluster, check what relies on it. The
**Usage** view (`GET /api/discovery/clusters/{id}/usage`) lists the Elchi
**endpoint** resources that consume this cluster's discovered addresses. For each
consuming endpoint it shows:

- **Endpoint name** and **version**.
- **IP count**: how many discovered addresses currently back it.
- **Last updated**: when the endpoint's address set last changed.
- **IP addresses**: the actual discovered IPs feeding the endpoint.

A usage count of **0** means no endpoint currently references this cluster.

## Removing a cluster

To deregister a cluster, use the **Delete** action
(`DELETE /api/discovery/clusters/{id}`). Deletion is confirmed and permanent.

:::warning[Unlink endpoints first]
Elchi refuses to delete a discovery cluster while any endpoint resource is still
linked to it; the error names the endpoints (up to five). Open its **Usage** view,
remove the cluster from each endpoint's **Configure Discovery** dialog (or
repoint the endpoint), then delete the cluster.
:::

Deleting the cluster record in Elchi and stopping the agent are separate
actions. A cluster record is created from an agent's initial report, so an agent
that is still running can register the cluster again. To retire a cluster for
good, uninstall the agent Helm release and then delete the record.

## Related

- [Discovery overview](/installation/discovery-agent/overview)
- [Installing the discovery agent](/installation/discovery-agent/installation)
- [Discovery agent configuration](/installation/discovery-agent/configuration)
