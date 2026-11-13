---
title: "Elchi Quick Start on Kubernetes with Helm"
sidebar_label: "Quick Start"
description: "Run the full Elchi stack on any Kubernetes cluster with one Helm command, with bundled MongoDB, VictoriaMetrics and ClickHouse, then connect your first edge."
sidebar_position: 2
---

Spin up the full Elchi stack on any Kubernetes cluster with one Helm command. The chart bundles MongoDB, VictoriaMetrics, and ClickHouse and generates every credential itself, so you need nothing else. Everything on this page also works on an on-premises cluster with no load balancer.

:::tip[Not on Kubernetes?]
This page uses Helm on an existing cluster. Prefer a different substrate? Elchi installs the same control plane on **[Docker Swarm](/installation/docker-swarm/quickstart)** (one command, container-based), a **[single VM with kind](/installation/kind-quickstart)** (evaluation), or **[bare-metal systemd](/installation/bare-metal/overview)** (no containers).
:::

## Before you start

- A Kubernetes cluster, and `kubectl` + `helm` pointed at it.
- About **2 CPU, 4 GB RAM and 20 GB disk** free.
- The NodePort range (**30000–32767**) reachable on your nodes from your browser and from the hosts that will run Envoy. Elchi uses one port from it and prints which one in step 4; you can open only that port afterwards.
- A **default storage class**. Check it:

```bash
kubectl get storageclass   # one line must say (default)
```

If none says `(default)`, which is common on on-premises clusters, install the local-path provisioner. It stores the data on the node's disk:

```bash
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.31/deploy/local-path-storage.yaml
```

Then add `--set-string global.storageClass=local-path` to the install command in step 2.

## 1. Pick the address

Elchi needs one address that your browser **and** your Envoy proxies use to reach it: `global.mainAddress`.

**No load balancer? Use the IP of any one of your nodes.** That is all you need. Get it with:

```bash
kubectl get nodes -o wide   # INTERNAL-IP column
```

Elchi is reachable through any node, so pick one that stays up. If that node goes down, your Envoy proxies keep serving traffic with the configuration they already have; they only stop receiving changes until the node is back, or until you point Elchi at another node (see [Change the address later](#change-the-address-later)).

Have a load balancer, a VIP or a DNS name in front of your nodes? Use that instead. See [Choosing mainAddress](/installation/helm-platform/configuration#choosing-mainaddress).

## 2. Install

Add the Helm repository, then install. Replace `192.168.1.10` with your address:

```bash
helm repo add elchi https://charts.elchi.io
helm repo update

helm upgrade --install elchi elchi/elchi-stack \
  --set-string global.mainAddress=192.168.1.10 \
  --namespace elchi-stack --create-namespace
```

`helm upgrade --install` installs the first time; if the first try fails, fix the cause and run the same command again.

## 3. Wait for the pods

```bash
kubectl get pods -n elchi-stack -w
```

Every pod shows `1/1 Running` within a few minutes; the first install spends most of that time pulling images.

## 4. Open Elchi

Elchi picks a free port for its gateway (**30000** when it is free, otherwise the next free one) and keeps it on upgrades. The install prints the full address under **OPEN ELCHI**. Open it in your browser:

```text
http://192.168.1.10:30000
```

This address and port are where everything reaches Elchi: your browser, and the edge hosts in step 5. Lost the output? Show it again, or ask for the port:

```bash
helm get notes elchi -n elchi-stack
kubectl get svc envoy-service -n elchi-stack -o jsonpath='{.spec.ports[?(@.name=="http")].nodePort}'
```

Sign in with `admin` / `admin`. Elchi then asks you to choose your own password before anything else opens; it needs at least 12 characters with an uppercase letter, a lowercase letter, a number and a symbol. Sign in again with it. See [Passwords](/administration/auth-and-access#passwords).

The JWT secret and the database passwords were generated during the install and kept in the `elchi-stack-secrets` Secret. You don't need to set them. See [Credentials](/installation/helm-platform/configuration#credentials).

## 5. Connect your first edge host

An edge host is the Linux machine that will run Envoy. It runs the **elchi-client** agent, which connects to Elchi and installs and manages Envoy for you.

1. In the UI, open **Settings → Tokens** and create a token.
2. On the edge host, run the installer with the address and port from step 4, without TLS:

```bash
curl -fsSL https://raw.githubusercontent.com/CloudNativeWorks/elchi-archive/main/deploy/client/get.sh \
  | sudo bash -s -- \
  --name=edge-01 \
  --host=192.168.1.10 \
  --port=30000 \
  --tls=false \
  --token=<your-token>
```

`edge-01` appears under **Clients** in the UI. Without a license Elchi manages **one** client; see [Licensing](/administration/licensing). Then follow [Zero to Envoy](/tutorials/zero-to-envoy) to put your first listener on it.

## If something goes wrong

**`cannot list resource "services" ... at the cluster scope`**: your Kubernetes user may only manage its own namespace, so Elchi cannot see which ports are free. Choose a free port between 30000 and 32767 yourself and run the install command again with `--set global.envoy.service.httpNodePort=<port>`.

**`provided port is already allocated`**: the port you set with `httpNodePort` is taken. Pick another one, or leave the setting out and Elchi picks a free one.

**The page does not open**: check that your computer can reach the node IP on the port from step 4 (firewall). To rule out the network, forward the gateway to your machine and open `http://localhost:8080`:

```bash
kubectl port-forward svc/envoy-service 8080:8080 -n elchi-stack
```

**A pod stays in `Pending`**: usually no default storage class (see [Before you start](#before-you-start)) or not enough free CPU or memory. `kubectl describe pod <name> -n elchi-stack` shows which.

**The client says `license limit reached`**: the free tier manages one client. Remove the old client in the UI, or add a license.

## Change the address later

Point Elchi at another node, or at a load balancer you added later:

```bash
helm upgrade elchi elchi/elchi-stack -n elchi-stack --reuse-values \
  --set-string global.mainAddress=192.168.1.11
```

Then update `--host` in each client's `/etc/elchi/config.yaml`, restart the client, and download and redeploy the Envoy bootstraps so the proxies use the new address.

## Remove Elchi

```bash
helm uninstall elchi -n elchi-stack
kubectl delete namespace elchi-stack   # also deletes the data volumes and the kept credentials Secret
```

## Next steps

- Put your first listener on the edge host: [Zero to Envoy](/tutorials/zero-to-envoy).
- Going to production (TLS, a DNS name, more replicas, external MongoDB): [Production](/installation/helm-platform/production).
