---
title: "Install the Kubernetes Discovery Agent"
sidebar_label: "Installation"
description: "Install the Elchi Discovery agent with Helm: generate a discovery token, set the API endpoint and cluster name, then confirm the cluster appears in Elchi."
sidebar_position: 3
---

The discovery agent ships as the `elchi-discovery` chart in the Elchi Helm repository. Installing it takes three values: the Elchi API endpoint, a discovery token and a unique cluster name. Check the [requirements](/installation/discovery-agent/overview#requirements) first.

## 1. Generate a discovery token

In the Elchi UI, open **Settings → Tokens** and, under **Discovery token**, click **Generate token** (Owner or Admin role). Each project has one discovery token, in the form `<uuid>--<project>`. Copy it; every cluster that reports to this project uses the same token.

## 2. Add the Helm repository

```bash
helm repo add elchi https://charts.elchi.io
helm repo update
```

## 3. Install the chart

```bash
helm install elchi-discovery elchi/elchi-discovery \
  --set config.apiEndpoint="https://your-elchi-instance.com/api/discovery/k8s" \
  --set config.token="your-discovery-token" \
  --set clusterName="my-k8s-cluster" \
  --namespace elchi-stack \
  --create-namespace
```

- `config.apiEndpoint` is the full URL of the discovery API: your Elchi address (the one browsers and clients use) followed by `/api/discovery/k8s`.
- `clusterName` is required; the install fails with `clusterName is required` if it is empty. Pick a name that is unique across all clusters reporting to the project, because endpoints refer to clusters by this name.
- The namespace is your choice. The agent reads nodes cluster-wide whatever namespace it runs in.

:::warning[TLS verification is off by default]
The chart's `values.yaml` ships `config.insecureSkipVerify: true`, so the agent accepts any certificate. If your Elchi address has a certificate the cluster trusts, add `--set config.insecureSkipVerify=false`.
:::

## 4. Verify

Check that the pod is running and reporting:

```bash
kubectl get pods -n elchi-stack -l app.kubernetes.io/instance=elchi-discovery
kubectl logs -n elchi-stack -l app.kubernetes.io/instance=elchi-discovery --tail=50
```

Then open **Discovery** in the Elchi UI. The cluster appears with its Kubernetes version, node count and an **Active** status. If it is missing, check the agent's logs for an authentication error (wrong or deleted token) or a connection error (the pod cannot reach `config.apiEndpoint`).

With the cluster listed, link it to an endpoint resource with **Configure Discovery**, as described in [Using K8s Discovery](/installation/discovery-agent/using-discovery#link-an-endpoint-to-a-cluster).

## Install from a values file

Once the overrides outgrow `--set`, keep them in a file:

```bash
helm show values elchi/elchi-discovery > values.yaml   # start from the defaults
# edit config.apiEndpoint, config.token, clusterName, ...
helm install elchi-discovery elchi/elchi-discovery \
  --namespace elchi-stack --create-namespace --values values.yaml
```

Every value is listed in the [configuration reference](/installation/discovery-agent/configuration). The chart validates values against its JSON schema, so a wrong type or an out-of-range `discoveryInterval` fails at install time.

## Upgrade or change settings

```bash
helm upgrade elchi-discovery elchi/elchi-discovery \
  --namespace elchi-stack --reuse-values --set discoveryInterval=60
```

The settings are rendered into a ConfigMap mounted at `/etc/elchi/config.yaml`. The Deployment carries no checksum of that ConfigMap, so an upgrade that changes only settings does not restart the pod. Restart it yourself:

```bash
kubectl rollout restart deployment -n elchi-stack -l app.kubernetes.io/instance=elchi-discovery
```

## Uninstall

```bash
helm uninstall elchi-discovery --namespace elchi-stack
```

Uninstalling stops the reports but keeps the cluster record in Elchi. To remove the record too, unlink it from every endpoint and delete it from the **Discovery** view, as described in [Removing a cluster](/installation/discovery-agent/using-discovery#removing-a-cluster).
