---
title: Quick Start
description: Spin up the full Elchi stack on any Kubernetes cluster with one Helm command, using the chart's bundled MongoDB, VictoriaMetrics, and ClickHouse, then connect your first edge host.
sidebar_position: 2
---

Spin up the full Elchi stack on any Kubernetes cluster with one Helm command. The chart bundles MongoDB, VictoriaMetrics, and ClickHouse and generates every credential itself, so you need nothing else. Everything on this page also works on an on-premises cluster with no load balancer.

:::tip[Not on Kubernetes?]
This page uses Helm on an existing cluster. Prefer a different substrate? Elchi installs the same control plane on **[Docker Swarm](/installation/docker-swarm/quickstart)** (one command, container-based), a **[single VM with kind](/installation/kind-quickstart)** (evaluation), or **[bare-metal systemd](/installation/bare-metal/overview)** (no containers).
:::

## Before you start

- A Kubernetes cluster, and `kubectl` + `helm` pointed at it.
- About **2 CPU, 4 GB RAM and 20 GB disk** free.
- TCP port **30000** open on your nodes, from your browser and from the hosts that will run Envoy.
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

Open the address the install printed under **OPEN ELCHI**:

```text
http://192.168.1.10:30000
```

Sign in with `admin` / `admin`. Elchi then asks you to choose your own password before anything else opens; it needs at least 12 characters with an uppercase letter, a lowercase letter, a number and a symbol. Sign in again with it. See [Passwords](/administration/auth-and-access#passwords).

The JWT secret and the database passwords were generated during the install and kept in the `elchi-stack-secrets` Secret. You don't need to set them. See [Credentials](/installation/helm-platform/configuration#credentials).

## 5. Connect your first edge host

An edge host is the Linux machine that will run Envoy. It runs the **elchi-client** agent, which connects to Elchi and installs and manages Envoy for you.

1. In the UI, open **Settings → Tokens** and create a token.
2. On the edge host, run the installer with the same address and port as above, without TLS:

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

**`provided port is already allocated`**: something else on the cluster already uses port `30000`, for example a second Elchi install. List the ports in use and pick a free one between 30000 and 32767:

```bash
kubectl get svc -A -o jsonpath='{.items[*].spec.ports[*].nodePort}' | tr ' ' '\n' | sort -n | uniq
```

Run the install command again with that port, then use it everywhere instead of 30000, including the client's `--port`:

```bash
helm upgrade --install elchi elchi/elchi-stack \
  --set-string global.mainAddress=192.168.1.10 \
  --set global.envoy.service.httpNodePort=30500 \
  --namespace elchi-stack --create-namespace
```

Then open `http://192.168.1.10:30500`.

**The page does not open**: check that your computer can reach the node IP on port 30000 (firewall). To rule out the network, forward the gateway to your machine and open `http://localhost:8080`:

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
