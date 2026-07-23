---
title: Installation
description: Install the Elchi Client with the installer script or manually place the binary.
sidebar_position: 3
---

## Quick install

```bash
# Fetch the installer
wget https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v1.1.0/elchi-install.sh
```

## Production setup

```bash
sudo bash elchi-install.sh \
  --name=web-server-01 \
  --host=backend.elchi.io \
  --port=443 \
  --tls=true \
  --token=your-auth-token
```

## OpenStack deployment

```bash
sudo bash elchi-install.sh \
  --name=openstack-vm \
  --host=controller.elchi.io \
  --port=443 \
  --tls=true \
  --token=prod-token \
  --cloud=my-openstack
```

## With BGP routing

```bash
sudo bash elchi-install.sh \
  --enable-bgp \
  --name=edge-router \
  --host=controller.elchi.io \
  --port=443 \
  --tls=true \
  --token=prod-token \
  --cloud=production
```

## Installer flags

| Flag | Description | Required |
| --- | --- | --- |
| `--name=NAME` | Client name as it appears in Elchi. | yes |
| `--host=HOST` | Controller server address. | yes |
| `--port=PORT` | Server port (1–65535). | yes |
| `--tls=true\|false` | Enable TLS connection. | yes |
| `--token=TOKEN` | Authentication token (min 8 chars). | yes |
| `--cloud=CLOUD` | Cloud / infrastructure provider. Defaults to `other`. | no |
| `--enable-bgp` | Install FRR for BGP routing. | no |
| `--no-shield` | Do **not** install the elchi-shield sidecar (installed by default). | no |
| `--shield-version=vX.Y.Z` | Pin the elchi-shield release (default: bundled/latest). | no |
| `--shield-audit-dsn=DSN` | Send shield audit events to central ClickHouse (else off). | no |
| `--shield-metrics-otlp=H:P` | Push shield metrics to an OTel Collector (OTLP/gRPC). | no |
| `--shield-metrics-insecure` | Use plaintext gRPC to the shield metrics collector. | no |

:::info[Shield installs by default]
The installer also brings up the **elchi-shield** ext_proc WAF sidecar in the same run. Use
`--no-shield` to skip it, and see [The Bundled Shield Sidecar](/installation/client/shield-sidecar)
for the sink config the `--shield-*` flags write.
:::

:::warning[OpenStack deployments]
If you're running on OpenStack, pass `--cloud=YOUR_CLOUD_NAME` using the cloud name shown in the Elchi UI.
:::

## Manual installation

Skip the installer and place the binary yourself:

```bash
# AMD64
wget https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v1.1.0/elchi-client-linux-amd64
sudo mkdir -p /etc/elchi/bin
sudo mv elchi-client-linux-amd64 /etc/elchi/bin/elchi-client
sudo chmod +x /etc/elchi/bin/elchi-client
```

`/etc/elchi/bin/elchi-client` is the path the `elchi-client.service` systemd unit executes (`ExecStart=/etc/elchi/bin/elchi-client start --config /etc/elchi/config.yaml`), so the binary must live there — not in `/usr/local/bin`.
