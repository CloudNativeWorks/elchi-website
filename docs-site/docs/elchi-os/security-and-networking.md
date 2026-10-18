---
title: Security & Networking
description: The Elchi OS host firewall model, which ports are open and to whom, outbound requirements, SSH and account permissions, kernel settings, the CIS compliance check, metrics, and the support bundle.
sidebar_position: 5
tags: [elchi-os, security, operations]
---

## What is reachable

| Port | Where | From |
| --- | --- | --- |
| TCP 22 (SSH) | Management address only | Everyone, or the `set ssh allow` list when the firewall is on; rate limited |
| UDP 68, UDP 546 | Management address | DHCPv4 / DHCPv6 client replies |
| TCP 179 (BGP) | Management address and data interfaces | Only the BGP neighbours the control plane configured |
| UDP 3784, 3785, 4784, 7784 (BFD) | Management address and data interfaces | Only the configured BGP neighbours |
| UDP 8650 (HA heartbeat) | Data and management addresses | Only the HA pair's peer (see [HA Pairs](/ha-pairs/overview)) |
| ICMP / ICMPv6 | Management address | Echo, errors, and the neighbour-discovery and MLD types IPv6 needs |
| Listener ports | Listener VIPs, and the management address when a listener binds `0.0.0.0` | Everyone |

Bound to loopback by design, never reachable from the network:

| Service | Address |
| --- | --- |
| Envoy admin interfaces | `127.0.0.1`, ports 30000-39999 (reserved from the ephemeral range) |
| `elchi-shield` HTTP endpoint | `127.0.0.1:9001` |
| Metrics exporter | `127.0.0.1:9100` (proxied by the agent) |
| systemd-resolved | Loopback |

LLMNR and MulticastDNS are switched off. The firewall rules for BGP, BFD, the HA heartbeat and SSH only apply while the host firewall is on (see below); sshd is pinned to the management address either way.

### Outbound

| Destination | Why |
| --- | --- |
| The controller's client gRPC port (default 50051) | Registration and commands |
| `archive.elchi.io` and `github.com`, TCP 443 | Envoy downloads, OS upgrades, component installs (the archive redirects to GitHub release assets) |
| NTP and DNS servers | Time and name resolution |

A site that needs an HTTP proxy sets it with `set proxy` on the console.

## Host firewall

**The host firewall is off on a new appliance.** Most deployments bind their services to loopback or to the listener VIPs, and a firewall that discovers ports on its own is one more thing that can go wrong. Turn it on with `firewall enable` (or `firewall: {enabled: true}` in the [setup document](./installation.md#the-setup-document)); `firewall disable` removes the ruleset. `show health` and `show firewall` say which it is, and `show health` warns when it is off on a public management address. An appliance upgraded from a release before 0.4.4 keeps the firewall on. A factory reset turns it off again; `config export`/`import` carry the decision to a replacement.

While it is off, sshd is still pinned to the management address, but the SSH source list and rate limit are not enforced and every bound socket answers on every address.

### What it filters

The agent owns the data plane — listener VIPs on `elchi-if-*` dummy interfaces, routes, policy rules and BGP — and never manages the firewall. So the firewall **filters only traffic addressed to the appliance's own management addresses**; every other destination (the VIPs, and on a single-NIC box everything that is not the management IP) is accepted. A rule that could deny a listener would eventually deny one.

When it is on:

- **SSH** is accepted on the management interface only. New connections from one source over 10 per minute (burst 5) are dropped, and with `set ssh allow <cidr>[,…]` only the listed sources get through. `PermitRootLogin no`.
- **BGP and BFD** are accepted only from the neighbours configured in FRR, read back every tick — on the management address and on the data interfaces alike, so 179 is not open to the whole segment.
- **Listener ports on the management address** are discovered from a socket scan of what the proxy's own account (`envoyuser`) has bound, non-loopback only. The scan runs as soon as the agent writes a bootstrap or unit file, and every 15 seconds. Opening is immediate; a port leaves the set **120 seconds** after it stops being bound, so established connections are not cut.
- Anything else to the management address is dropped and logged at a limited rate with the prefix `elchi-drop`.
- **The forward chain drops** and `ip_forward` is 0: listener VIPs are delivered locally, nothing routes.

`elchi-firewall-sync` keeps the address and port sets current in one atomic `nft -f` transaction on every deploy and every 15 seconds, runs before sshd starts, and restores the ruleset if something wiped it. Data-plane traffic is not connection-tracked (`notrack`); only management traffic is.

### Operator rules

```text
firewall rule add <accept|drop|reject> <tcp|udp|icmp|any> [dport <port|A-B|N,N>] [from <cidr>] [to <cidr>] [comment <text>]
firewall rule list | delete <number> | move <from> <to>
firewall confirm | rollback
```

The firewall must be on to add rules. Operator rules are evaluated **before** the built-in management and data-plane rules, so they can filter traffic to the appliance itself **and** to the listener VIPs. Every add, delete and move is commit-confirmed: run `firewall confirm` within 120 seconds or the change is rolled back; a reboot inside the window counts as not confirmed. The console warns when an `accept` rule covers SSH (it then bypasses the SSH source list and rate limit) and when a `drop`/`reject` rule matches TCP 22. Rules are kept on the data partition and survive upgrades.

## SSH

| Setting | Value |
| --- | --- |
| Login | `admin` only (`AllowUsers admin`, `PermitRootLogin no`) |
| Authentication | Password and public key; `set ssh-key` adds a key, `show ssh-keys` lists them |
| `MaxAuthTries` / `MaxSessions` / `LoginGraceTime` | 3 / 5 / 30 s |
| Forwarding | TCP, stream-local, agent and X11 forwarding off; no tunnels |
| Host keys | Kept on the data partition (`/var/lib/elchi-persist/ssh`), so they survive upgrades; regenerated when a clone's SMBIOS UUID changes and on factory reset |

## Accounts and permissions

| Account | Role |
| --- | --- |
| `admin` | The operator. Login shell is the Elchi console. Full `sudo`; **anyone with the admin password owns the appliance.** Member of `sudo`, `adm`, `elchi`, `elchi-cfg` (can read the token), `systemd-journal` and `frrvty` (`show bgp` reads FRR directly). |
| `elchi` (uid/gid 800) | Runs the agent. Owns `/var/lib/elchi`. |
| `envoyuser` (uid/gid 801) | Runs the proxies. Cannot read the control-plane token. |
| `elchi-metrics` | Runs the metrics exporter, with no access to the token, the setup document, customer access logs or the agent's state |

- **Password policy:** at least 12 characters, 3 character classes, dictionary check. The shipped password `admin` is expired and must be changed at first login.
- **Lockout:** 5 wrong passwords on any path (sudo included) lock the account for 15 minutes; `system unlock` on the local or serial console clears it.
- **Idle sessions** on the console close after 30 minutes.
- **The control plane is root on every appliance in its project.** The agent writes units and network configuration and runs commands as root; treat a client token as a root credential for the fleet.
- **AppArmor** profiles for the proxy, the WAF and the agent run in complain mode: nothing is blocked, and an access outside a profile is logged as `apparmor="ALLOWED"` in the audit log.
- **auditd** records the operator's actions (uid ≥ 1000), is bounded to 5 × 32 MB and suspends rather than halts when full.

## Kernel settings

The appliance's sysctls are in `/etc/sysctl.d/90-elchi.conf`, `95-elchi-performance.conf` and `95-elchi-hardening.conf`. The settings that shape networking:

| Setting | Value | Why |
| --- | --- | --- |
| `net.ipv4.ip_forward` | `0` | The appliance does not route |
| `net.ipv4.ip_nonlocal_bind` | `1` | Listeners can bind a VIP before it is on an interface |
| `net.ipv4.conf.all.arp_ignore` / `arp_announce` | `0` / `2` | The physical NIC answers ARP for VIPs on dummy interfaces; a VIP never leaks as the source of the appliance's own ARP requests |
| `net.ipv4.conf.all.rp_filter` | `2` (loose) | Asymmetric and ECMP paths |
| `net.ipv4.ip_local_reserved_ports` | `30000-39999` | Envoy admin ports |
| `net.ipv4.ip_local_port_range` | `10240 65535` | |
| `net.netfilter.nf_conntrack_max` | `262144` | Sized to the hardware; data-plane traffic is untracked |
| `net.ipv4.tcp_congestion_control` / `net.core.default_qdisc` | `bbr` / `fq_codel` | |
| `net.core.somaxconn` / `net.ipv4.tcp_max_syn_backlog` | `32768` / `32768` | |
| `net.core.rmem_max` / `wmem_max` | `16777216` | Large socket buffers |
| `net.ipv4.fib_multipath_hash_policy` | `1` | Layer-4 ECMP hashing |
| `net.ipv6.conf.all.accept_ra` | `0` | Router advertisements are taken on the management interface only when SLAAC is chosen |
| `kernel.panic` / `kernel.panic_on_oops` | `10` / `1` | Reboot instead of hanging |

The hardening file disables source routing and redirects, logs martians, and restricts kernel pointers, `dmesg`, perf events, unprivileged BPF and user namespaces.

Only one appliance can own a VIP with these ARP settings; two appliances sharing a VIP use an [HA pair](/ha-pairs/overview) or BGP/ECMP.

## Compliance check

`system compliance` checks the appliance against the CIS benchmark for its base system from the inside — partitions and mount options, kernel modules, sysctls, AppArmor, SSH, sudo, PAM and the password policy, audit rules, file permissions, accounts and the host firewall — and prints each control with its evidence, or what to do when it fails. Controls not met on purpose are listed as **deviations** with the reason. Nothing is changed by the run.

- `system compliance json` is the same report for a GRC tool.
- `ssh admin@<address> 'system compliance'` exits 1 when a control fails.
- The check also runs daily; the latest result is shown on the [Appliance tab](./appliance-tab.md#compliance-cis-benchmark).

## Metrics

`/metrics` (Prometheus text format) is served on `127.0.0.1:9100` for the agent, which proxies it; nothing on the network reaches the exporter directly. It renders the same probes as `show health` (`elchi_health_severity{area,item}`, `elchi_health_worst`) plus per-listener readiness and restarts, control-plane connections, BGP neighbours, conntrack, load, memory, filesystems, the management NIC's link and errors, pending updates, an unconfirmed network change and the upgrader's state. The report is cached for 10 seconds; scrape every 15 seconds or more. `show metrics` shows the exporter and the last scrape.

## Support bundle

`support bundle` on the console writes `/var/lib/elchi/support-<date>.tar.gz` with logs and configuration, including the boot journal, service logs, the netplan files, the proxy bootstraps, hardware health (SMART, SEL/SDR, EDAC/MCE, pstore) and, on an HA pair member, an `ha/` section (see [Appliance Commands](/ha-pairs/appliance-commands#support-bundle)). Redaction runs over everything collected on the way out: control-plane tokens, anything on a line naming a token, password, passphrase, secret, API key or Authorization header, and PEM private keys are replaced.

Copy it off with `scp admin@<address>:/var/lib/elchi/support-<date>.tar.gz .`, or download it from the [Appliance tab](./appliance-tab.md#exports).
