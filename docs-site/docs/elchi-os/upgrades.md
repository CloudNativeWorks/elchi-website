---
title: Upgrades
description: In-place Elchi OS upgrades with A/B root slots, a health-gated trial boot and automatic rollback; security updates; moving elchi-client or elchi-shield on its own with system component; and the upgrade order for HA pairs.
sidebar_position: 4
tags: [elchi-os, operations, upgrade]
---

Elchi OS has three update paths, each with its own scope:

| What | How | Moves |
| --- | --- | --- |
| **OS release** | `system upgrade …` | The whole image: kernel, boot loader, base system, and the bundled `elchi-client` and `elchi-shield` |
| **Security updates** | `system update check` / `apply` | Base-system packages from `trixie-security`, plus `ca-certificates` and `tzdata` |
| **One component** | `system component …` | `elchi-client` or `elchi-shield` on its own |

Envoy versions are separate from all three: they live on the shared data partition, are installed from the client's **Apps** tab in the Elchi UI (or with `import proxy-binary`), and survive every OS upgrade.

The appliance never upgrades itself. Every OS upgrade is an operator's decision, made on the console.

## How an OS upgrade works

The disk has two root slots, `elchi-a` and `elchi-b`, and one data partition (`/var`) that both share. An upgrade:

1. writes the new release into the **other** slot — the running system is not touched;
2. carries this appliance's identity and configuration across;
3. arms exactly **one trial boot** of the new slot;
4. at the next reboot, the new slot judges itself against a snapshot of what was healthy before the reboot, and **commits** itself when the health gate passes;
5. if the gate does not pass within **10 minutes** — or the agent is stopped or rejected on the new slot — the appliance reboots back to the committed slot on its own and records why.

A trial that never gets that far (a power cut mid-boot) also comes back on the old slot, because the slot selection is a one-shot. Both boot menus show both slots with a three-second timeout.

### The health gate

The trial slot commits only when:

- the agent is where it was (registered stays registered; a control plane that was already unreachable is not held against it);
- every listener that was ready is ready again;
- BGP neighbours that were established come back;
- the WAF answers;
- the management link is up.

After a rollback, `show health` stays red until you run `system upgrade acknowledge`. What the rolled-back trial found is kept in `/var/lib/elchi/upgrade/last-rollback.txt`.

## Upgrading step by step

```text
system upgrade check        is a newer release published? (runs the preflight too)
system upgrade download     fetch and verify the newest release (or: download <version>, e.g. 0.6.1)
system upgrade notes        what is new in the staged release
system upgrade apply        write the other slot, arm the trial, offer to reboot
```

`system upgrade` (or `system upgrade status`) shows the state at any time.

**`check`** reads the signed release index at `https://archive.elchi.io/index.json` and refuses an index that is not signed by the Elchi release key. **`download`** fetches the release's bundle (`elchi-os_<version>.update.tar`, a few hundred MB) and verifies it against the release's `SHA256SUMS` and `SHA256SUMS.asc` with the release key the installed OS already carries. Egress is `archive.elchi.io` and `github.com` on port 443, through the [egress proxy](./console.md#configuring-set-and-apply) if one is set. Nothing is downloaded unless an operator asks.

**`apply`** prints the state and the preflight, then asks `Write the staged release to the other slot now?`, asks you to type the hostname, writes the slot, and asks `Reboot now to start the trial boot?`. If you decline, run `system reboot` when ready; `system upgrade cancel` disarms the trial. Your SSH session drops at the reboot.

Before an upgrade writes the other slot, the appliance saves its configuration to a root-only snapshot under `/var/lib/elchi/snapshots` (three are kept; proxy binaries are left out).

### Preflight

`system upgrade preflight` — also run by `check`, `download` and `apply` — lists what could stop the upgrade, and the download or apply is refused with the reason instead of failing half-way:

| Row | Checks |
| --- | --- |
| Running / Staged / Available | Versions |
| Free on /var, Needed for the download, Bundle size advertised | Space for the bundle |
| Free on /boot | Space on the ESP |
| Network change pending | An unconfirmed network change blocks the upgrade |
| Trial boot armed | A trial that has not booted yet |
| Agent | The agent's state |
| Clock synchronised | Signatures and TLS depend on the clock |
| Egress proxy, Release index, Index reachable | Where the index comes from and whether it answers |
| Not carried over | Files changed by hand under `/etc` that the new slot will not have (see below) |
| HA rows | On an HA pair member: this member's role and the peer's release (see [HA pairs](#ha-pairs)) |

### Other `system upgrade` verbs

| Command | Effect |
| --- | --- |
| `system upgrade rollback` | Boot the release that ran before the last commit as one trial boot, judged by the same gate. Nothing is written to that slot except this appliance's current identity and configuration (password, network, SSH keys, listeners). Asks for the hostname. |
| `system upgrade cancel` | Drop the staged bundle and disarm a trial that has not booted yet |
| `system upgrade acknowledge` | Clear a rolled-back, failed or committed state line |
| `show upgrade` | Staged, armed, committed, and the history of every outcome |
| `system boot-slot` | Which slot is running, committed and selected for the next boot |

The previous slot is cleared by the next `apply`; from then on `rollback` is unavailable and says so. `show version` names the release the appliance was upgraded from and when.

## What an upgrade carries across

| | |
| --- | --- |
| **Carried by the upgrade** | Control-plane registration and token, the setup document, the management network, data interfaces and the control plane's routes, NIC name pins, hostname, time zone, keyboard, NTP servers, remote logging, the egress proxy and the release index source, the deployed listeners' units, the admin password |
| **Kept on the shared data partition** | FRR's and the WAF's configuration, SSH host keys, an installed controller CA, the operator's firewall rules and the firewall decision, `/home/admin` (authorized keys included), proxy binaries, pinned components, logs |
| **Not carried** | Anything changed by hand under `/etc` outside the console — a file in `/etc/sysctl.d`, a line in `/etc/hosts`, an extra `sshd_config.d` drop-in, an apt source, your own unit. The preflight lists such files under **Not carried over**; set them through the console or again after the upgrade. `system upgrade rollback` boots the previous slot, which still has them. |

The kernel and the boot loader move only with an OS release, never with a package update. Loader files on the ESP are refreshed only after a commit, and only when the release's packages are newer.

## Closed networks

| Situation | What to do |
| --- | --- |
| No egress at all | Copy `elchi-os_<version>.update.tar`, `SHA256SUMS` and `SHA256SUMS.asc` to `/home/admin/` with `scp` and run `import os-update /home/admin/elchi-os_<version>.update.tar` |
| Removable media | Put the same three files on a USB stick or DVD, at its root or under `/elchi`, attach it and run `system upgrade from-media` |
| Your own mirror of the release index | `set upgrade source https://<mirror>/<path>/index.json` once. The release key is still the only trust: the mirrored index must carry its signature. `set upgrade source default` returns to `archive.elchi.io`. |
| An HTTP proxy | `set proxy http://[user:password@]host:port` (used by the agent, the upgrader and the component installer) |

Staged bundles from any of these paths are verified the same way, and then applied with `system upgrade apply`.

## HA pairs

On an [HA pair](/ha-pairs/overview) the standby is upgraded first. On the active member, `system upgrade apply` is refused until the peer is a heard, ready standby running the target release; once allowed, it hands the VIPs over before the reboot; on the only member of a pair it is blocked. The console explains the block and offers an explicit override (`Override the HA upgrade order and apply anyway?`) for when you accept the outage. The full procedure is in [Upgrading a serving pair](/ha-pairs/failover-and-maintenance#upgrading-a-serving-pair).

## Security updates

The appliance refreshes its package lists daily and reports how many security updates are waiting — at login and in `show system` — but installs none of them on its own.

| Command | Effect |
| --- | --- |
| `system update check` | Check now |
| `system update apply` | Install the waiting updates. Never reboots on its own; the [Appliance tab](./appliance-tab.md) says when a reboot is required to finish installed updates. |

Updates come from `trixie-security`, plus exactly two packages from `trixie-updates`: `ca-certificates` (the root CA list) and `tzdata`. The kernel, the boot loader (`shim-signed`, `systemd-boot*`, `grub-pc-bin`), `filebeat`, `frr` and `netplan.io` are held and move only with an OS release. A site behind an HTTP proxy for `archive.elchi.io` only: apt does not read `/etc/elchi/environment`, so the daily check reports "could not be checked" there.

## Moving the agent or the WAF on its own

A release ships one `elchi-client` and one `elchi-shield` and is tested as that combination, so normally they move with `system upgrade`. When one of them has to move on its own — a fix you need before the next OS release — use `system component`:

```text
system component status                          what is installed, and whether an operator put it there
system component list elchi-client               the versions the signed index offers, newest first
system component install elchi-client v1.6.5     download, verify and install one of them
system component reset elchi-client              back to the version this release was tested with
import component elchi-shield /home/admin/elchi-shield-linux-amd64 v0.4.13 [sha256]
```

- **One binary at a time.** The download is verified against the sha256 in the release index, whose signature is checked with the key the appliance already trusts. `import component` takes a file brought by hand and, with a checksum, refuses anything that does not match.
- **Automatic put-back.** Exactly one previous copy is kept, so a binary that starts and dies is put back automatically and the console says so. `system component reset` restores the release's own binary without network access.
- **The WAF versions offered** are those some `elchi-client` release bundled.
- **Pins follow upgrades.** An installed component is pinned: it follows the appliance into the new slot on the next `system upgrade`, so an upgrade never takes a fix away. `show version` marks a pinned component, and `show health` warns when the pin is older than what the running release bundles; `system component reset` clears both. `config export` carries the pin and `config import` re-installs it on a replacement.
- On an [HA pair](/ha-pairs/failover-and-maintenance#upgrading-a-serving-pair), upgrade the standby's agent first.
