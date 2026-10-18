---
title: Installation
description: Download and verify the Elchi OS image, deploy it from ISO, OVA or qcow2, run the first-login setup wizard to register with the controller, or configure it unattended with setup.yaml, cloud-init or OVF properties.
sidebar_position: 2
tags: [elchi-os, installation]
---

An appliance needs three things to become a working edge client: a management address, the controller's address, and a client token. You can type them into the [setup wizard](#the-setup-wizard) at the first login, or hand them over in advance through one of the [unattended inputs](#unattended-setup). Every setting is optional: anything left out is asked for on the console, and everything can be changed later.

## Getting the image

Elchi OS releases are listed in the Elchi archive index (`https://archive.elchi.io/index.json`, key `elchi_os_releases`) and published as release assets of the `CloudNativeWorks/elchi-archive` GitHub repository, under the tag `elchi-os-v<version>`:

```text
https://github.com/CloudNativeWorks/elchi-archive/releases/download/elchi-os-v<version>/<file>
```

Each release carries:

| File | Contents |
| --- | --- |
| `elchi-os-<ver>.iso` | Installation medium (BIOS + UEFI, bare metal and virtual) |
| `elchi-os-<ver>.ova` | VMware vSphere / Workstation appliance |
| `elchi-os_<ver>.qcow2` | Disk image for KVM / Proxmox / OpenStack |
| `elchi-os_<ver>.update.tar` | In-place upgrade bundle for an existing appliance (see [Upgrades](./upgrades.md)) |
| `SHA256SUMS` | Checksums of the files above |
| `SHA256SUMS.asc` | Detached signature of `SHA256SUMS` |
| `elchi-release-signing.asc` | The Elchi release signing key (GitHub release only) |

### Verifying a download

`SHA256SUMS` is signed with the **Elchi release signing key**, fingerprint `D822 FA7D 843D 531B 0BB7 2517 E0CD 8557 2DDF 1ACE`:

```bash
gpg --import elchi-release-signing.asc
gpg --verify SHA256SUMS.asc SHA256SUMS && sha256sum -c --ignore-missing SHA256SUMS
```

Check that the fingerprint `gpg` reports matches the one above. The installed appliance carries the same key and uses it to verify every upgrade it downloads.

## Deploying

Size the VM or server as described in [Sizing](./overview.md#sizing). All formats boot the same image.

### OVA (VMware)

Deploy the OVA with vSphere's **Deploy OVF Template**. The wizard shows the `elchi.*` properties in three groups — *1. System*, *2. Management network*, *3. Elchi control plane* — and the guest reads them back through VMware Tools at first boot (see [OVF properties](#ovf-properties)). Every field may be left empty; the appliance then starts unconfigured and the console wizard takes over.

The OVA defaults to 4 vCPU, 8 GB RAM, one VMXNET3 NIC on the management network, EFI firmware with Secure Boot, and a 50 GiB disk.

### qcow2 (KVM, Proxmox, OpenStack)

Import the qcow2 as the VM's disk. To configure it unattended, attach a cloud-init seed that writes `/etc/elchi/setup.yaml` (see [cloud-init](#cloud-init)).

The qcow2 describes a 50 GiB disk but holds 21 GiB of data. A disk under 21 GiB does not fit.

:::warning[Proxmox with UEFI (OVMF)]
On the default i440fx machine type, the UEFI firmware leaves the IDE controller's channels off, so a cloud-init drive on `ide2` (Proxmox's default) is never seen and the appliance boots unconfigured. Attach the seed as `sata0` or `scsi1`, or use the `q35` machine type. BIOS (SeaBIOS) VMs read `ide2` normally. When the appliance detects this case, the login summary, `show health` and `show events` say what to change.
:::

### ISO (bare metal or any hypervisor)

Boot the ISO. The boot menu offers:

| Entry | Use |
| --- | --- |
| Install Elchi OS | Local screen and `ttyS0` |
| Install Elchi OS (serial console) | Installer on the serial console |
| Install Elchi OS (serial console on COM2 / ttyS1 — Dell iDRAC, Supermicro SOL) | BMC serial-over-LAN on COM2; the installed system uses that port too |
| Install Elchi OS (verbose) | Boot with systemd logging |

The interactive installer lists every disk with what it contains and asks which one to install to (when there is more than one), lists every NIC with its driver, link state and MAC and asks which one is management (when there is more than one), then asks for the hostname, time zone, console keyboard, the management network, optionally the control plane, and the admin password. It refuses a disk smaller than 30 GiB and disks with 4Kn sectors. When it finishes, remove the medium and press Enter to reboot.

For a zero-touch install, pass installer parameters on the kernel command line, or put an answer file (a [setup document](#the-setup-document)) on the medium at `elchi/setup.yaml`:

| Parameter | Meaning |
| --- | --- |
| `elchi.auto=1` | Install without prompts |
| `elchi.disk=/dev/…` | Target disk. **Required** for an unattended install on a machine with more than one disk; prefer a stable path such as `/dev/disk/by-id/…` |
| `elchi.force=1` | Install over an existing Elchi OS, a disk with foreign data, or with a second Elchi disk present |
| `elchi.allow_small_disk=1` | Lab only: install below the 30 GiB minimum |
| `elchi.console=ttyS1,115200` | Use another serial port; the installed system keeps it |
| `elchi.<key>=<value>` | Any [OVF property key](#ovf-properties), for example `elchi.controller.host=…` |

Kernel command-line values override the answer file.

## First login

Log in as **`admin`** with the password **`admin`** on the local console, the serial console or over SSH. The shipped password is expired, so you must change it at the first login on every path; until then SSH accepts no remote command, `scp` or `sftp`. The new password needs at least 12 characters from at least 3 character classes and must pass a dictionary check.

`admin` lands in the Elchi console, not a Linux shell. On an appliance that is not registered yet, the console prints:

```text
This appliance is not registered yet. Type 'setup' to run the wizard, 'help' for commands.
```

If no setup source was found at first boot, the appliance configures DHCP on the first NIC so it is reachable, and waits for registration.

## The setup wizard

`setup` asks every question in order; `setup system`, `setup network` and `setup controller` ask one section, and `setup password` changes the admin password. Press Enter to keep the value in `[brackets]` — the current value, including the address the appliance is reached on. At the end the wizard prints a summary and asks `Apply now?`. `^C` or `^D` at any prompt cancels; nothing is applied.

### System

| Prompt | Answer |
| --- | --- |
| `Hostname` | Lowercase letters, digits and hyphens |
| Timezone | Region, then city (number or name); `Area/City`, e.g. `Europe/Istanbul` |
| `Keyboard layout` | Local console layout: `us`, `tr`, `trf`, `de`, `fr`, `uk`, `es`, `it`, …; `list` shows all |
| `NTP servers (comma separated; 'default' = public pool)` | Your own time servers, or `default` |

### Management network

| Prompt | Answer |
| --- | --- |
| `Management interface (…)` | One of the listed NICs |
| `Bond it with additional NICs (comma separated, empty = no bond)` | Extra NICs to aggregate into `mgmt-bond`; empty for none |
| `LACP (802.3ad; the switch side must be an LACP port channel)? No = active-backup` | Asked only for a bond |
| `VLAN id for the management traffic (empty = untagged)` | 802.1Q tag, or empty |
| `Use DHCP for the management interface?` | `y` for DHCP, `n` for a static address |
| `IP address (CIDR, e.g. 10.0.0.10/24)` | Static only |
| `Default gateway` | Static only. A gateway outside the subnet (a hosting provider's `/32`) is reached on-link |
| `DNS servers (comma separated, required)` | Static only; required |
| `Search domain` | Static addressing only; optional |
| `IPv6 on the management interface (none, slaac, static)` | IPv6 is a second stack; IPv4 stays required because the agent reaches the controller over IPv4 |

Data NICs are configured after the wizard with `set interface …` (see [Interfaces and bonds](./console.md#interfaces-and-bonds)).

Changing the management network from the console is **commit-confirmed**: after `apply`, run `network confirm` within 120 seconds — from the new address if it changed — or the previous configuration is restored. See [Network changes](./console.md#network-changes-and-the-confirm-window).

### Registering with the controller

The full wizard first asks `Register with an Elchi control plane now?`; `setup controller` goes straight to these questions:

| Prompt | Answer |
| --- | --- |
| `Controller host (IP or DNS)` | The address the controller's client gRPC endpoint is reached on |
| `Controller gRPC port` | Default `50051` |
| `Use TLS to the controller?` | Default no |
| `Skip TLS certificate verification?` | Asked with TLS; default yes |
| `Client token (<uuid>--<projectId>)` | The project's client token (input hidden) — see [Client Configuration](/installation/client/configuration) for where to generate one |
| `Client name shown in the Elchi UI` | Defaults to the hostname |
| `Advertise BGP capability?` | Default yes |
| `Install as an HA appliance (pair with a second one later)?` | Yes makes the appliance the first member of an [HA pair](/ha-pairs/overview) at registration |

Before asking for the token, the wizard probes the controller address, so a closed port shows up early (and, with TLS on, a proxy without HTTP/2). After `apply` the agent (re)starts and registers; the appliance then appears in the Elchi UI's clients list with an [Appliance tab](./appliance-tab.md). `system diagnose controller` checks DNS and TCP towards the controller and, with TLS on, the handshake, HTTP/2 (ALPN) and a gRPC call, step by step.

:::warning[The token is a fleet credential]
The agent writes systemd units and network configuration and runs commands as root by design, so a leaked client token is effectively a root credential for every appliance in the project. On the appliance, `/etc/elchi/config.yaml` is readable only by the agent and `admin`.
:::

The agent connects with `insecure_skip_verify: true` by default: TLS encrypts the session but does not authenticate the controller. Once the controller has a certificate the appliance can validate, set `controller.insecure_skip_verify: false` with `controller.ca_pem` in the setup document.

## Unattended setup

All inputs fill the same setup document and are applied by the same applier, `elchi-setup`:

| Input | How |
| --- | --- |
| OVA deployment wizard | The `elchi.*` OVF properties ([below](#ovf-properties)) |
| cloud-init | `write_files` an `/etc/elchi/setup.yaml` ([below](#cloud-init)) |
| ISO | An answer file on the medium at `elchi/setup.yaml`, or `elchi.*` parameters on the kernel command line |
| Console | The `setup` wizard, or `set …` followed by `apply` |

At first boot cloud-init is read first, then the OVF environment; values from the later source win. A document from a seed that contains keys this release does not know is still applied: the unknown keys are ignored and named in a warning.

### The setup document

Every block is optional.

```yaml
# /etc/elchi/setup.yaml
version: 1
system:
  hostname: elchi-edge01
  timezone: Europe/Istanbul        # Area/City; default UTC
  keyboard: tr                     # local console layout; default us
  ntp: [ntp1.example.net, ntp2.example.net]
network:
  interface: auto                  # or ens18 / ens160
  mode: static                     # dhcp | static
  address: 10.0.0.10/24
  gateway: 10.0.0.1
  dns: [10.0.0.2]
  search: [corp.example]
controller:
  host: controller.example.com
  port: 50051
  tls: false
  insecure_skip_verify: true
  token: "<uuid>--<projectId>"
client:
  name: elchi-edge01
  bgp: true
admin:
  password: "…"                    # empty keeps admin/admin (changed at first login)
  ssh_authorized_keys: ["ssh-ed25519 AAAA… ops@example"]
firewall:
  enabled: true                    # turn the host firewall on at first boot (off by default)
```

| Key | Values |
| --- | --- |
| `system.hostname`, `system.timezone`, `system.keyboard` | As in the wizard |
| `system.ntp` | List of time servers |
| `system.logging.remote` | `host`, `port`, `protocol` (`udp` \| `tcp` \| `tls`) — see [remote syslog](./console.md#logs-and-remote-syslog) |
| `network.interface` | A NIC name, or `auto`: the first NIC with link in natural name order (USB NICs and the seed's data interfaces never count), else the first NIC |
| `network.mac` | Pins the management NIC by MAC; filled in automatically at the first apply |
| `network.mode` | `dhcp` \| `static` |
| `network.address`, `network.gateway`, `network.dns`, `network.search` | Static IPv4 settings; DNS is required with a static address |
| `network.vlan` | VLAN id for management traffic; `0` or absent = untagged |
| `network.bond` | `mode` (`active-backup` \| `lacp`), `members` (list of `name`), optional `up_delay`, `down_delay`, `primary_reselect`, `fail_over_mac`, `hash`, `min_links` |
| `network.ipv6` | `mode` (`none` \| `static` \| `slaac`), `address`, `gateway` (static only) |
| `network.interfaces` | Data NICs, bonds and VLANs: `name` (or `mac` alone), `label`, `mode` (`static` \| `dhcp` \| `none`), `addresses`, `mtu`, `bond`. Needs a static management address |
| `controller.host`, `controller.port`, `controller.tls`, `controller.insecure_skip_verify`, `controller.token`, `controller.ca_pem` | Registration |
| `client.name`, `client.bgp`, `client.cloud`, `client.ha` | Client identity, BGP capability, cloud, HA appliance |
| `admin.password`, `admin.ssh_authorized_keys` | The `admin` account |
| `firewall.enabled` | Turn the host firewall on or off |

On a physical server with more than one cabled port, name the management port in `network.interface` (or give its `mac`): with several links up, "the first with link" can be a data port.

:::note
An appliance provisioned with SSH keys but no `admin.password` keeps the expired default password, so automation cannot drive it over SSH until someone has logged in once on a real terminal and changed it.
:::

### cloud-init

Deliver the setup document with `write_files`:

```yaml
#cloud-config
write_files:
  - path: /etc/elchi/setup.yaml
    permissions: "0600"
    content: |
      version: 1
      network: { interface: auto, mode: dhcp }
      controller:
        host: controller.example.com
        port: 50051
        token: "<uuid>--<projectId>"
      client: { name: elchi-edge01 }
```

- Use `permissions: "0600"`: the document carries the token and the admin password. The appliance tightens the file as soon as it reads it.
- The seed is read while the appliance is unregistered. A new `instance-id` makes cloud-init write the file again, and the same document is applied only once.
- `local-hostname` from the seed's meta-data is used only when `system.hostname` is absent.
- **The hypervisor's IP/gateway panel is not read.** The image disables cloud-init's network management, so put the network into the setup document.
- Supported datasources: NoCloud, ConfigDrive, OpenStack, OVF and VMware.

### OVF properties

The OVA's deployment wizard exposes these properties; the ISO kernel command line accepts the same keys:

| Property | Wizard label (description where the property has no label) | Default |
| --- | --- | --- |
| `elchi.hostname` | Hostname | `elchi-edge01` |
| `elchi.admin.password` | Admin password | empty (keep `admin`/`admin`) |
| `elchi.keyboard` | Console keyboard layout | empty (`us`) |
| `elchi.timezone` | Time zone | empty (UTC) |
| `elchi.admin.ssh_key` | SSH public key | empty |
| `elchi.net.mode` | Address mode | `dhcp` |
| `elchi.net.address` | IP address (CIDR) | empty |
| `elchi.net.gateway` | Default gateway | empty |
| `elchi.net.dns` | DNS servers | empty |
| `elchi.net.search` | DNS search domain | empty |
| `elchi.net.ipv6.mode` | IPv6 mode (`none`, `static`, `slaac`) | `none` |
| `elchi.net.ipv6.address` | IPv6 address (CIDR) | empty |
| `elchi.net.ipv6.gateway` | IPv6 gateway | empty |
| `elchi.net.vlan` | VLAN id (1-4094) | empty (untagged) |
| `elchi.net.bond.members` | Bond members (comma separated) | empty |
| `elchi.net.bond.mode` | `active-backup` or `lacp` | `active-backup` |
| `elchi.net.bond.up_delay`, `elchi.net.bond.down_delay` | Bond delays (ms) | empty |
| `elchi.net.bond.primary_reselect` | `always`, `better`, `failure` | `always` |
| `elchi.net.bond.fail_over_mac` | `none`, `active`, `follow` | `none` |
| `elchi.net.bond.hash` | `layer2`, `layer2+3`, `layer3+4` | `layer3+4` |
| `elchi.net.bond.min_links` | LACP minimum links | empty |
| `elchi.controller.host` | Controller host | empty |
| `elchi.controller.port` | Controller port | `50051` |
| `elchi.controller.tls` | Use TLS | `false` |
| `elchi.controller.insecure_skip_verify` | Skip TLS verification | `true` |
| `elchi.controller.token` | Client token | empty |
| `elchi.client.name` | Client name | empty |
| `elchi.client.bgp` | Advertise BGP capability | `true` |

The setup applier also reads `elchi.net.interface`, `elchi.net.mac`, `elchi.controller.ca_pem` (with `\n` for line breaks), `elchi.client.ha`, `elchi.client.cloud` and `elchi.firewall.enabled` when they are present, for example on the ISO kernel command line.

The OVA uses only the `com.vmware.guestInfo` transport, so the token and password are never written as an ISO into the VM folder on the datastore.

## Clones and templates

The management NIC is pinned by MAC address after the first apply, and every other physical NIC keeps the name it had when it was first seen. A cloned VM has new MACs; at boot the appliance re-pins the management configuration to the right card and logs it. Before turning an appliance into a template, run `system factory-reset` (it also forgets the NIC pins and the appliance's identity). A clone of a *static* appliance boots with the source's address, so template from a DHCP-configured appliance or change the address on the console.

## Next steps

- Install the Envoy version your listeners use from the client's **Apps** tab (or with `import proxy-binary` offline), then deploy as usual.
- Decide on the [host firewall](./security-and-networking.md#host-firewall).
- For an HA pair, continue with [Setting up a pair](/ha-pairs/setup).
