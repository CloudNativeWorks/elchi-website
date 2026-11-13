---
title: "Elchi Client Overview and Requirements"
sidebar_label: "Overview"
description: "The Elchi Client is the edge agent that runs Envoy for your control plane. Supported OS (Ubuntu 24.04, amd64), downloads, and what it installs on a host."
sidebar_position: 1
---

The Elchi Client (`elchi-client`) is the agent you install on each Linux edge host. It registers the host with your Elchi control plane over gRPC, then runs the Envoy listeners you deploy from the UI as systemd services on that host. It also carries out the commands the control plane sends it: deploys and undeploys, service start/stop/restart, Envoy version downloads, network and BGP (FRR) changes, and log shipping.

The installer also brings up the [elchi-shield](/installation/client/shield-sidecar) ext_proc WAF sidecar on the same host, unless you pass `--no-shield`.

## How the client fits in

1. You install the client with a **name**, the control plane's **host** and **port**, **TLS** on or off, and a **token** from **Settings → Tokens** in the Elchi UI. The token has the form `<uuid>--<project>`, so the host joins the project the token was issued for.
2. The client starts as `elchi-client.service` (`/etc/elchi/bin/elchi-client start --config /etc/elchi/config.yaml`, restarted automatically) and appears under [Operations → Clients](/operations/clients).
3. When you deploy a listener to the host, the client writes its bootstrap and runs Envoy as a systemd unit named `<listener>-<adminPort>.service`. If the Envoy version that listener needs is not on the host yet, the client downloads it in the background; retry the deploy once the download finishes.

Day-two work (deploys, commands, logs, metrics) is covered in [Operations](/operations/overview).

## Supported operating systems

| Requirement | Supported |
| --- | --- |
| Operating system | **Ubuntu 24.04 LTS** (minimum) |
| Architecture | **linux/amd64**. Published builds are amd64 only. |
| Privileges | root (the installer must run with `sudo`) |
| Init system | systemd |
| Network | Outbound access to the control plane's `--host:--port`, and to the public Elchi archive to download binaries |

The installer configures apt sources only on Ubuntu, and it refuses to run on an [Elchi OS](/elchi-os/overview) appliance, which configures its agent from the console instead. Additional distributions are on the roadmap: [request a build](mailto:admin@cloudnativeworks.com?subject=Elchi%20Client%20Build%20Request).

## Download

Every client release is mirrored in the public `elchi-archive` repository. A release contains the client binary, the installer script (`elchi-install.sh`) and the elchi-shield binary bundled with it, each with a `.sha256` file. The newest release when this page was last updated is **v2.1.6** (bundles elchi-shield v1.3.2):

- [elchi-client-linux-amd64](https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v2.1.6/elchi-client-linux-amd64) ([sha256](https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v2.1.6/elchi-client-linux-amd64.sha256))
- [elchi-install.sh](https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v2.1.6/elchi-install.sh) ([sha256](https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v2.1.6/elchi-install.sh.sha256))

This page is only as fresh as its last edit. The [archive manifest](https://archive.elchi.io/index.json) lists the newest build first under `elchi_client_releases`, with a sha256 for every file, and the [download portal](https://archive.elchi.io) shows the same list. You rarely need the files by hand: the [`get.sh` bootstrap](/installation/client/installation) picks the newest release, checks the installer's sha256 against the manifest and runs it. Pin a release with `--client-version=vX.Y.Z`.

To verify a file you downloaded yourself:

```bash
curl -fsSLO https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v2.1.6/elchi-client-linux-amd64
curl -fsSLO https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-client-v2.1.6/elchi-client-linux-amd64.sha256
sha256sum -c elchi-client-linux-amd64.sha256
```

## What the installer sets up

Besides the client binary at `/etc/elchi/bin/elchi-client` and its config at `/etc/elchi/config.yaml`, the installer:

- creates the `elchi` and `envoy` system users (no login shell),
- writes kernel tuning (sysctl) for proxy workloads and a sudoers rule for the agent,
- configures rsyslog and filebeat for log shipping, and takes over the host's netplan file so the agent can manage interfaces and routes,
- installs and starts **FRR** for BGP when you pass `--enable-bgp`,
- installs **elchi-shield** as `elchi-shield.service` unless you pass `--no-shield`.

Running `elchi-install.sh --upgrade` on an installed host replaces only the client binary, its unit, sudoers and tuning files, then restarts the agent. The config, identity, filebeat, rsyslog, netplan, FRR and shield stay as they are. Add `--shield-version=vX.Y.Z` (or `latest`) to upgrade the shield as well.

:::note[HA pairs need Elchi OS]
Two edge boxes can share VIPs active/passive as an [HA pair](/ha-pairs/overview). HA pairs run only on **Elchi OS appliances**, which ship the `elchi-ha` service, its firewall rules and kernel settings; a client installed with the installer on a general-purpose Linux host cannot join a pair. To run the client as an appliance instead of on your own Linux host, see [Elchi OS](/elchi-os/overview).
:::

## Next steps

- [Install the client](/installation/client/installation) with `get.sh` or the installer.
- [Configure it](/installation/client/configuration): `/etc/elchi/config.yaml` reference.
- [The bundled Shield sidecar](/installation/client/shield-sidecar): audit and metrics sinks, policies.
