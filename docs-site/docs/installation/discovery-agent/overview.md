---
title: "Kubernetes Discovery Agent Overview"
sidebar_label: "Overview"
description: "The Elchi Discovery agent reports a Kubernetes cluster's nodes to Elchi, which keeps Envoy endpoints in sync with node IPs. How it works and what you need."
sidebar_position: 1
---

The Elchi Discovery agent (`elchi-discovery`) is a small Deployment you install with Helm inside a Kubernetes cluster. It reports the cluster's nodes to Elchi on a fixed interval (30 seconds by default). Elchi then keeps the addresses of the **endpoint** resources you link to that cluster up to date, so the Envoy clusters that use them follow the Kubernetes nodes without manual edits.

Use it when Envoy proxies outside Kubernetes send traffic to services exposed on the cluster's nodes, for example through a NodePort: nodes come and go, and the endpoint list follows.

## How it works

1. **The agent reports.** Each report carries the cluster name you chose (`clusterName`), the Kubernetes version, and every node with its status, roles (control-plane or worker) and addresses (InternalIP, ExternalIP, hostname). It is sent to the controller's `/api/discovery/k8s` endpoint with a project **discovery token**.
2. **Elchi registers the cluster.** The cluster appears in the UI's **Discovery** view with its nodes, status and last-seen time. A cluster that has not reported for 10 minutes is shown as inactive.
3. **You link endpoints to it.** On an endpoint resource, **Configure Discovery** picks a discovered cluster, a protocol (TCP or UDP), a port, the node address type (External IP or Internal IP) and the node roles to include.
4. **Elchi updates the endpoint.** On each report, Elchi computes the matching node IPs and, when the set changed, rewrites that cluster's `lb_endpoints` (one locality per discovery cluster, so one endpoint resource can draw on several clusters), records an audit entry and pushes the change to the affected listeners.

If a report would leave an endpoint with no addresses while it currently has some, Elchi keeps the current addresses and logs a warning instead of emptying it.

The full in-UI workflow is in [Using K8s Discovery](/installation/discovery-agent/using-discovery).

## Requirements

- **Kubernetes 1.19 or newer.** The chart declares `kubeVersion: >=1.19.0-0`.
- **Helm 3** on your workstation. The chart's own README asks for 3.2.0 or newer.
- **Permission to create cluster-scoped RBAC.** The chart creates a ClusterRole with read-only access (`get`, `list`, `watch`) to nodes, endpoints, services and pods, bound to its ServiceAccount. Set `rbac.create=false` only if you provide an equivalent role yourself.
- **A discovery token.** An Owner or Admin generates one per project under **Settings → Tokens → Discovery token**. It has the form `<uuid>--<project>` and ties every report to that project. Deleting it stops agents that use it from reporting.
- **Network access from the cluster to Elchi.** The agent pod must reach the address in `config.apiEndpoint` (your Elchi address plus `/api/discovery/k8s`) over HTTP or HTTPS.
- **A unique cluster name** for every cluster that reports to the same project. Elchi keys clusters by name, and endpoints refer to them by name.

The agent asks for 100m CPU and 64Mi memory (limits 200m and 128Mi) and runs as a non-root user with a read-only root filesystem.

## Next steps

- [Install the agent](/installation/discovery-agent/installation)
- [Chart configuration reference](/installation/discovery-agent/configuration)
- [Use discovered clusters in the UI](/installation/discovery-agent/using-discovery)
