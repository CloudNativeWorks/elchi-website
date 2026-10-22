---
title: Elchi OS Overview
description: What the Elchi OS edge appliance is, what it bundles, the image formats and platforms it runs on, sizing, and when to use it instead of installing the Elchi Client on a Linux host.
sidebar_position: 1
tags: [elchi-os, installation, operations]
---

**Elchi OS** is a system image for edge nodes. It boots, asks for its management network and control-plane settings, registers itself with the Elchi control plane as a client, and then gets out of the way. Every Envoy listener deployed to it is managed from the Elchi UI like on any other [edge client](/operations/clients).

The image is a hardened Debian 13 (trixie) base with two root slots for [in-place upgrades](./upgrades.md), a host firewall, and a management console that replaces the Linux shell for day-to-day work.

## What the image contains

| Component | Notes |
| --- | --- |
| `elchi-client` | The Elchi agent. Registers with the controller, deploys listeners, owns the data plane (listener VIPs, routes, policy rules, BGP). |
| `elchi-shield` | The WAF / API-security sidecar, enabled by default. |
| Management console | `elchi-console`, the login shell of the `admin` user on the local console, the serial console and SSH. See [Console Reference](./console.md). |
| Setup applier | `elchi-setup`, which applies the setup document (`/etc/elchi/setup.yaml`) from every input: the console wizard, OVF properties, cloud-init, or the ISO answer file. |
| FRR | Routing daemons for BGP and BFD. Their configuration belongs to the control plane. |
| Filebeat, rsyslog | Log shipping. |
| `elchi-ha.service` | The HA pair daemon, run as `elchi-client ha` (see [HA Pairs](/ha-pairs/overview)). |

The component versions are fixed per release. Elchi OS 0.7.3 ships `elchi-client` v2.1.0 and `elchi-shield` v1.2.1 (0.6.1 shipped v1.7.7 / v0.5.0). You can move one of them on its own with [`system component`](./upgrades.md#moving-the-agent-or-the-waf-on-its-own).

:::note[The proxy is not in the image]
The image ships no Envoy binary (`/var/lib/elchi/envoys/` is empty). Before the first deploy, install the Envoy version the listener uses from the client's **Apps** tab in the Elchi UI. The appliance downloads it over HTTPS from `archive.elchi.io`, which redirects to `github.com` release assets, and checks the sha256 the archive index publishes. Air-gapped sites load the binary with [`import proxy-binary`](./console.md#importing-files) instead.
:::

## Image formats

Each release is published in three formats, plus an upgrade bundle for existing appliances:

| File | Use it for |
| --- | --- |
| `elchi-os-<ver>.iso` | Bare metal and any hypervisor. Hybrid BIOS + UEFI installation medium. |
| `elchi-os-<ver>.ova` | VMware vSphere / Workstation. The deployment wizard asks for the settings. |
| `elchi-os_<ver>.qcow2` | KVM, Proxmox, OpenStack. |
| `elchi-os_<ver>.update.tar` | In-place upgrade of an existing appliance with `system upgrade`. Not an installation image. |

See [Installation](./installation.md#getting-the-image) for where to download them and how to verify the signature.

## Platform support

- **x86-64 (amd64) only.**
- **UEFI with Secure Boot, UEFI without it, and BIOS.** The UEFI boot chain is shim, systemd-boot and the kernel, all signed with keys firmware already trusts (shim by the Microsoft UEFI CA, systemd-boot and the kernel by the base system). Nothing has to be enrolled. The OVA declares Secure Boot.
- **Bare metal:** the image includes NIC firmware for common server LOMs (Broadcom bnx2x/bnx2, QLogic FastLinQ, Intel E810 DDP, Chelsio, Realtek) and `smartctl`, `nvme` and `ipmitool`. The installer refuses disks with 4Kn sectors: the image is laid out for 512-byte sectors.
- **Serial console:** `ttyS0` at 115200 baud by default.

## Sizing

| | Minimum | Default / recommended |
| --- | --- | --- |
| vCPU | 2 | 4 |
| RAM | 4 GB | 8 GB (the appliance ships `elchi-shield` enabled) |
| Disk | 30 GiB (the installer's floor) | 100 GiB |

The OVA and qcow2 ship a sparse 50 GiB disk. Enlarge the virtual disk in the hypervisor and the appliance grows into it, at boot or on demand with `system disk grow`.

## Disk layout

```text
p1  esp        vfat    1 GiB    kernels and boot entries for both slots
p2  bios boot          1 MiB
p3  elchi-a    ext4    8 GiB    OS root, slot A (a fresh install boots this)
p4  elchi-b    ext4    8 GiB    OS root, slot B — empty until the first in-place upgrade
p5  data       btrfs   rest     /var, /var/log, /var/log/elchi and /var/home (/home) as subvolumes; grows into the disk
```

`/var` is shared by both root slots and is never rewritten by an upgrade, so proxy binaries, listener bootstraps, logs and the agent's state survive an OS upgrade. `/home` is on the data partition as well. The proxies' logs under `/var/log/elchi` have their own btrfs quota, separate from the rest of `/var/log`, so a burst of access logs cannot fill the OS or the agent's state. `show disk` shows where the space goes.

## Elchi OS or the Elchi Client on Linux?

| | Elchi OS appliance | [Elchi Client](/installation/client/overview) on a Linux host |
| --- | --- | --- |
| Host OS | Delivered as the image; upgraded as a whole with A/B slots and automatic rollback | Your own Ubuntu 24.04 host, patched by you |
| Agent and WAF | Bundled and tested together per release | Installed by the client installer |
| Management NICs, data NICs, bonds, VLANs | Configured on the appliance console (or the seed); shown read-only in the UI | Configured from the Elchi UI |
| Routes, routing tables, policy rules, BGP | From the Elchi UI | From the Elchi UI |
| [HA pairs](/ha-pairs/overview) | Supported | Not supported |
| Host firewall | Built in, opt-in (see [Security & Networking](./security-and-networking.md)) | Your own |
| Appliance tab in the UI | Yes — see [Appliance Tab](./appliance-tab.md) | No |

Choose Elchi OS for a dedicated edge box — physical or virtual — that you want to manage as an appliance, and whenever you need an HA pair. Choose the client installer when Envoy must run on a host you already operate.

## Next steps

1. [Installation](./installation.md) — download, first boot, setup wizard, unattended setup.
2. [Console Reference](./console.md) — every console command.
3. [Upgrades](./upgrades.md) — in-place OS upgrades and component updates.
4. [Security & Networking](./security-and-networking.md) — firewall, ports, accounts, support bundle.
5. [Appliance Tab](./appliance-tab.md) — the appliance's status in the Elchi UI.
