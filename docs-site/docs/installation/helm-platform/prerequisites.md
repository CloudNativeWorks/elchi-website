---
title: "Helm Platform Prerequisites"
sidebar_label: "Prerequisites"
description: "What you need before installing the elchi-stack Helm chart: Kubernetes 1.21+, Helm 3, CPU, memory and storage, a NodePort or load balancer, and a main address."
sidebar_position: 2
---

Check these before you run `helm install` for the `elchi-stack` chart. The chart refuses to render when a required value is missing, so most gaps show up as a clear error, but sizing, storage and network reachability are easier to settle first.

## Cluster and tools

| Requirement | Detail |
| --- | --- |
| Kubernetes | **v1.21 or newer** (the chart declares `kubeVersion: >=1.21.0-0`) |
| Helm | **3.0.0 or newer**, on the machine you install from |
| `kubectl` | Configured with access to the target cluster |
| Permissions | Create namespaces, Deployments, StatefulSets, Services, ConfigMaps, Secrets and PersistentVolumeClaims in the release namespace. List Services cluster-wide so the chart can pick a free NodePort (or set one yourself, below). |

Quick checks:

```bash
kubectl version              # server must report v1.21+
helm version                 # v3.x
kubectl get nodes -o wide    # node IPs, useful for global.mainAddress
kubectl get storageclass     # one marked (default), or name one in global.storageClass
```

## Compute

The default install runs **one replica of each component** and needs about **2 CPU cores, 4 GB of RAM and 20 GB of disk** free. That is enough to try Elchi. Production runs 3 or more controller and control-plane replicas and 2 or more gateway, UI and collector replicas, which needs proportionally more; see [Production](/installation/helm-platform/production) and the [values profiles](/installation/helm-platform/values-profiles).

## Storage

The bundled datastores each claim a persistent volume:

| Component | Default size | Turn off with |
| --- | --- | --- |
| MongoDB (configuration, users, audit trail) | 5 GB | `global.installMongo: false` |
| VictoriaMetrics (metrics) | 5 GB | `global.installVictoriaMetrics: false` |
| ClickHouse (API Discovery events) | 10 GB | `global.installClickhouse: false` |

You need a **default StorageClass**, or a class named in `global.storageClass`, only when you keep at least one of them. If you point at external MongoDB, VictoriaMetrics or ClickHouse instead, have their addresses and credentials ready; see [Storage](/installation/helm-platform/storage) and [Configuration](/installation/helm-platform/configuration#external-mongodb-parameters).

## Network access

Everything outside the cluster (browsers, Envoy proxies and the elchi-client agents on edge hosts) reaches Elchi through one **gateway** Service. Decide how it is exposed:

- **NodePort** (default). The chart picks the first free port from **30000** up and keeps it on upgrades. Picking needs cluster-wide read access to Services; without it, or for GitOps and `helm template`, set `global.envoy.service.httpNodePort` yourself (30000–32767).
- **LoadBalancer**. Set `global.envoy.service.type: LoadBalancer`; the gateway then listens on 8080, or 8443 with TLS. Use this with a cloud load balancer or MetalLB.
- **Your own load balancer or VIP** in front of the NodePort on every node.

The control plane keeps long-lived gRPC streams open to every Envoy proxy and client. A load balancer in front must be layer 4 (TCP), or layer 7 with HTTP/2 to the backend and no stream or idle timeouts. Edge hosts must be able to reach the gateway's address and port.

## Decide the main address

`global.mainAddress` is required: the install fails without it. It is the IP or DNS name that Envoy proxies and clients use to reach Elchi, and it is written into every Envoy bootstrap and into the self-signed gateway certificate. A single node IP works for a first try; a DNS name in front of a load balancer or VIP is better for production. See [Choosing mainAddress](/installation/helm-platform/configuration#choosing-mainaddress).

## For production

- A TLS certificate for the main address, stored as a `kubernetes.io/tls` Secret, or TLS terminated at your load balancer. See [Security](/installation/helm-platform/security).
- A managed MongoDB replica set instead of the bundled single instance.
- A plan for credentials: let the chart generate them, or keep all six in your own secret store when you deploy with GitOps. See [Credentials](/installation/helm-platform/configuration#credentials).
- If you upgrade a release installed before chart 2.0.0, read Credentials before you run the upgrade.

## Next step

[Install the chart](/installation/helm-platform/installation).
