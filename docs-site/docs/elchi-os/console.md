---
title: Console Reference
description: The Elchi OS management console — show, set and apply, network changes with commit-confirm, firewall, system, config and import commands, logs, diagnostics and help, with exact syntax.
sidebar_position: 3
tags: [elchi-os, operations, reference]
---

The `admin` user's login shell is the Elchi console, on the local console (tty1), the serial console and SSH. Nothing in day-to-day operation needs a Linux shell.

## Using the console

- **`help`** prints a one-screen overview; `help show`, `help set`, `help system`, `help config` and `help logs` print one topic in full; `help all` prints everything. `<command> ?` shows how to use one command (`set network vlan ?`).
- **Prefixes:** any prefix that names exactly one command is that command (`sh he` is `show health`); an exact word always wins, and an ambiguous prefix lists the candidates instead of guessing.
- **Tab** completes listener names, keymaps, time zones and NICs from the appliance itself.
- Long output pages on a terminal (space or Enter for the next screen, `q` to stop).
- **`^C` or `^D`** at any confirmation cancels the command; nothing is applied.
- Destructive commands (`system upgrade apply`, `system upgrade rollback`, `system factory-reset`) ask you to type the hostname to confirm.
- An interactive session closes itself after 30 minutes without input (with a warning at 29).
- `shell` opens a Linux shell (interactive terminal only); `exit` returns to the console. `exit`, `quit` or `logout` ends the session.

### One command over SSH

```bash
ssh admin@<address> 'show health'
```

runs one read-only `show …` line and exits with the worst severity it found: **0** ok, **1** WARN, **2** CRIT — usable as a monitoring check. `show health json` returns the same report as JSON with the same exit status. Anything else on the `ssh` command line runs in bash instead (for example `sudo -n systemctl status elchi-client` as a break-glass path). Both need the default password to have been changed. `follow` and `capture` need an interactive terminal.

## Show commands

| Command | Shows |
| --- | --- |
| `show health` | Everything that can be wrong, worst first. The login banner prints its red lines. |
| `show health json` | The health screen as JSON |
| `show system`, `show network`, `show version`, `show upgrade`, `show listeners` | Each also accepts `json` |
| `show controller`, `show client` | The control-plane connection and the agent |
| `show interfaces [json]` | Every NIC: label, owner (`management` / `os` / `ui-legacy` / `service`), mode, link, MAC, addresses |
| `show routes [all\|<table>] [json]` | The kernel's routes — the main and `elchi-mgmt` tables, every table with `all` — and who owns each: `os` (the console or the OS's own files, with the file named), `ui` (the Elchi UI), `kernel` (a connected subnet), `dhcp`, `bgp`, `unpersisted` (a static route in no file, gone at reboot) |
| `show rules [json]` | The policy rules in the order the kernel tries them, with the same owners (`system` for the kernel's own) |
| `show listeners` | Every proxy: state, restarts, CPU%, memory, tasks, open TCP/UDP, nearest certificate expiry |
| `show connections [<listener>\|<port>]` | Who is connected now, per listener port, and the outbound side; one listener in full (bytes, idle, RTT); `show connections json` |
| `show vip` | Each listener's VIP as the agent's health gate sees it: announced, withdrawn or held, since when and why |
| `show ha [json]` | The HA pair — see [Appliance Commands](/ha-pairs/appliance-commands) |
| `show proxy <listener>` | The running proxy: readiness, listeners, connections, cluster health, certificates |
| `show bgp [neighbors [<ip>] \| advertised <ip>]` | BGP sessions |
| `show bfd` | BFD sessions |
| `show waf` | WAF readiness, active policy, reload errors, counters |
| `show events [n]` | Timeline since boot: deploys, restarts, sessions, links, reverts |
| `show logging` | The remote syslog target, the queue and rsyslog's last complaints |
| `show metrics` | The metrics exporter (loopback, for the agent), its address and the last scrape |
| `show services` | The appliance's services |
| `show firewall` | Firewall decision and ruleset |
| `show hardware` | CPU, memory, disks with SMART/NVMe health, NICs with driver and firmware, BMC, sensors |
| `show disk` | Filesystems and quotas, and where the space goes: proxy binaries per version, WAF bundles, a staged upgrade, the agent's state, logs, `/home/admin`, the largest files |
| `show time` | Clock and time synchronisation |
| `show ssh-keys` | Public keys that may log in as `admin` |
| `show pending` | Unapplied `set` changes |

`show version` also lists the proxy versions present on the appliance.

## Configuring: `set` and `apply`

Most settings are recorded with `set …` and take effect with `apply`. `set` records only what you change; `apply` merges it onto the running configuration, so changing the time zone never resets the network. `show pending` lists what is waiting, `discard` drops it.

| Command | Effect |
| --- | --- |
| `setup [system\|network\|controller\|password]` | The [guided wizard](./installation.md#the-setup-wizard), or one section of it |
| `set hostname <name>` | Hostname |
| `set timezone <Area/City>` | Time zone (`set timezone ?` lists them) |
| `set keyboard <layout>` | Local console keyboard: `tr`, `trf`, `us`, `de`, … (`set keyboard ?` lists them) |
| `set ntp <a,b>` \| `set ntp default` | The site's time servers, or the public pool |
| `set controller <host> [port] [tls=true\|false] [skip-verify=true\|false]` | Control-plane address |
| `set token [<token>]` | Client token `<uuid>--<projectId>`; prompts with hidden input if omitted |
| `set password` | Change the admin password |
| `set logging remote <host> [port] [udp\|tcp\|tls]` \| `set logging remote none` | Remote syslog target |
| `apply` | Write pending changes and (re)start the client |

These apply at once, without `apply`:

| Command | Effect |
| --- | --- |
| `set ssh-key <paste>` \| `set ssh-key remove <n>` | Add or remove a public key for `admin` |
| `set ssh allow <cidr>[,…]` \| `set ssh allow any` | Which source addresses may reach SSH (enforced by the host firewall). The console refuses a list that would lock out the session running it unless you confirm explicitly. |
| `set proxy <url>` \| `set proxy none` | Egress HTTP proxy for the agent, the upgrader and the component installer: `http://[user:password@]host:port`. The password never appears on a screen or in a log. Offers to restart the agent. |
| `set upgrade source <url>` \| `set upgrade source default` | An `https` mirror of the release index for a closed network (see [Upgrades](./upgrades.md#closed-networks)) |

### Management network

| Command | Effect |
| --- | --- |
| `set network dhcp` | DHCP on the management interface |
| `set network static <ip/cidr> <gateway> <dns1,dns2> [searchdomain]` | Static address. DNS is required. A gateway outside the subnet (a hosting provider's `/32`) is reached on-link. |
| `set network interface <name>` | Choose the management NIC, or re-pin it after a NIC swap (drops the MAC pin) |
| `set network vlan <id>` \| `set network vlan none` | Tag the management traffic (802.1Q) on the NIC or the bond; the device becomes `mgmt.<id>` |
| `set network bond <nic1,nic2,…> [active-backup\|lacp] [options]` \| `set network bond none` | Aggregate NICs into `mgmt-bond`. `active-backup` needs nothing on the switch; `lacp` needs an 802.3ad port channel. |
| `set network ipv6 static <addr/prefix> [gateway]` \| `slaac` \| `none` | IPv6 as a second stack on the management device; IPv4 stays required |

`diagnose gateway` helps on a hosting provider without DHCP: it listens on the link for ten seconds, names the router asking for the appliance's address, and prints the exact `set network static` line to type.

### Interfaces and bonds

Every NIC other than the management one is configured on the console. Routing tables, policy rules and BGP for these interfaces come from the Elchi UI, and so do most routes; a data interface carries no gateway — a route that needs one is added with `set route` ([Routes](#routes)) or from the UI. Data interfaces need a static management address.

| Command | Effect |
| --- | --- |
| `set interface <nic> static <ip/cidr>[,<ip6/cidr>…]` | Addresses on a data NIC, bond or VLAN (`<link>.<id>`) |
| `set interface <nic> dhcp` | An address from DHCP; the lease's router and DNS are ignored |
| `set interface <nic> none` | No address (a bond member, a VLAN parent, or just pinned) |
| `set interface <nic> mtu <576-9216>` \| `set interface <nic> mtu default` | MTU |
| `set interface <nic> label <text>` \| `set interface <nic> label none` | Display label in `show interfaces`, health and metrics |
| `set interface <nic> remove` | Forget a data interface (its addresses go; the name pin stays) |
| `set bond <name> <nic1,nic2,…> [active-backup\|lacp] [options]` | A data bond; `set interface <name> static …` addresses it and `set interface <name>.<id> …` puts a VLAN on it |

A VLAN can also sit on the management bond or NIC (`set interface mgmt-bond.200 …`, `set interface ens18.300 …`), but never with the management VLAN's id.

**Bond options** (management and data bonds): `up-delay <ms>` and `down-delay <ms>` (steps of 100); for `active-backup`, `reselect always|better|failure` and `fail-over-mac none|active|follow`; for `lacp`, `hash layer2|layer2+3|layer3+4` and `min-links <n>`. Example: `set bond bond0 ens21,ens22 lacp min-links 2`.

Once a data interface exists, the appliance keeps management on its own gateway with a source rule (`from <mgmt-ip> lookup elchi-mgmt`, table 1000), so the UI may move the main table's default route to a data NIC without cutting SSH or the agent's session. The rule is IPv4 only. If the controller, the archive, NTP or DNS are beyond the management gateway, add a route to them via the management gateway from the UI before moving the default route. The two- and three-NIC recipes are in [Edge Network Topologies](/operations/network-topologies).

### Routes

The console can add routes of the OS's own (Elchi OS 0.7.3), on the management device or a data interface. They are what an appliance needs **before** it can reach the Elchi UI — a control plane beyond a data NIC's router — and what keeps working whatever the UI does.

| Command | Effect |
| --- | --- |
| `set route <cidr\|default> via <gateway> [dev <iface>] [table main\|elchi-mgmt] [metric <n>] [on-link]` | A route through a gateway. `dev` defaults to the interface whose subnet holds the gateway; `on-link` accepts a gateway outside it (a provider's `/32`). |
| `set route <cidr> dev <iface> [table …] [metric <n>]` | A route on the link, without a gateway |
| `set route <cidr> remove [table …] [metric <n>]` \| `set route none` | Remove one console route, or all of them |

Routes are a network change: `apply`, then `network confirm` within the window below. They are written to `/etc/netplan/52-elchi-routes.yaml` — the UI's routes stay in their own files and `show routes` tells them apart. The console refuses:

- the UI's tables **100–999** (a console route goes in `main` or `elchi-mgmt`, table 1000; no rule points at any other table);
- a route the UI's files already define (same destination, table and metric) — netplan would merge both into the device;
- a second **main default** while the management gateway is the default — give it a `metric` to make it a backup, or move the default from the UI;
- a gateway outside every subnet of the device (unless `on-link`), a device that is neither the management device nor an addressed data interface, mixed IP families.

**Registering through a data NIC.** When the controller is reachable only through a data NIC's router: address the NIC (`set interface …`), then `set route <controller-ip>/32 via <data-gateway>`, `apply`, `network confirm`. The agent's connection to the controller is a new outbound connection, so it takes this route and the data address as its source; `set controller` / `set token` and `apply` register over it. `diagnose route <controller-ip>` shows the path before you try.

### When a UI route cuts the appliance off

A route or policy rule from the UI can take the agent's own path to the controller away — and the UI then cannot undo it. Two things now answer that:

- **The agent checks its own path** (an agent released after elchi-client v2.1.0). Every route and policy rule from the UI, and every table delete, is applied, then the agent looks at its controller connection twice at once: a gRPC ping over its own session and a new TCP connection to the controller, the way a reconnect makes it. What worked before the change must still work — two good looks confirm, three bad ones or 12 seconds without a pass roll back. The new connection matters here: with the main default moved to a data NIC and no route to the controller, the management rule keeps the session alive, but the next reconnect would leave through the data side. On failure exactly what the change did is undone (routes and rules of other programs are left alone), the agent's route/policy files keep their previous content, and the UI shows *rolled back: …*. A route or rule that repairs an already broken path is not refused.
- **`network routes reset`** on the console is the way back when nothing else is left (an older agent, a rule added by hand): it removes every route and policy rule the UI set — from its `99-elchi-route-*` / `99-elchi-policy-*` files and from the kernel — re-applies the appliance's own network configuration (a management default the UI replaced comes back), and restarts the agent if it is not connected. The files are kept under `/var/lib/elchi/ui-routes-reset/<time>/`; the console's own routes stay. The control plane stores no network state of its own, so nothing puts the UI's routes back.

`diagnose route <ip> [from <source>]` explains a path: the NIC and source address a packet leaves with, the policy rule that chose the table, the route that matched and who owns it — and, for an address used as a VIP, the NIC whose subnet answers ARP for it.

### Network changes and the confirm window

Changing the management network or the data interfaces is **commit-confirmed**:

1. `apply` backs up the current management files, arms a revert timer and runs the change in a transient systemd unit that survives your SSH session dropping.
2. Reconnect — to the new address if it changed — and run **`network confirm`** within **120 seconds**.
3. If nobody confirms, the previous configuration is restored automatically. A reboot inside the window counts as *not confirmed*.

| Command | Effect |
| --- | --- |
| `network confirm` | Keep the change |
| `network rollback` | Restore the previous configuration now (asks to confirm; may drop the session) |
| `network status` | What is pending and what was last reverted |
| `network routes reset` | Remove the Elchi UI's routes and policy rules (files and kernel) and re-apply the OS's own network — [the way back](#when-a-ui-route-cuts-the-appliance-off) |

`config import` applies through the same window. Changes applied without a console — OVF, cloud-init, the ISO answer file — do not arm a timer, since nobody is there to confirm. Only the OS's own network files are backed up or restored — the management, data-interface and console-route files (`50-`, `51-`, `52-elchi-*.yaml`); the files the agent writes for the UI's routes, policy rules and listener VIPs are not touched (`network routes reset` is for those). On an [HA pair](/ha-pairs/overview) member the console warns before a network change, because it can affect the heartbeat paths and the VIP subnets.

## Firewall

| Command | Effect |
| --- | --- |
| `firewall enable` \| `firewall disable` | Turn the host firewall on or off (off on a new appliance) |
| `firewall status` | On/off, the loaded ruleset and any unconfirmed rule change |
| `firewall rule list` | The operator's rules, numbered |
| `firewall rule add <accept\|drop\|reject> <tcp\|udp\|icmp\|any> [dport <port\|A-B\|N,N>] [from <cidr>] [to <cidr>] [comment <text>]` | Add a rule |
| `firewall rule delete <number>` | Delete a rule |
| `firewall rule move <from> <to>` | Reorder |
| `firewall confirm` \| `firewall rollback` | Keep or undo the last rule change (120-second window, like network changes) |

The model and what each rule can match are described in [Security & Networking](./security-and-networking.md#host-firewall).

## System commands

| Command | Effect |
| --- | --- |
| `system update check` \| `system update apply` | Security updates. Never installed automatically; `apply` never reboots on its own. |
| `system upgrade [check\|preflight\|download [ver]\|notes\|apply\|cancel\|acknowledge]` | In-place OS upgrade — see [Upgrades](./upgrades.md) |
| `system upgrade rollback` | Boot the release that ran before the last commit (one trial boot) |
| `system upgrade from-media` | Stage the release files from an attached USB stick or DVD |
| `system component [status\|list [<name>]\|install <name> <ver>\|reset <name>]` | Move the agent or the WAF to another version — see [Upgrades](./upgrades.md#moving-the-agent-or-the-waf-on-its-own) |
| `system boot-slot` | Show which root slot is running, committed and selected for the next boot |
| `system boot-slot set a\|b` \| `system boot-slot next a\|b` | Choose the slot permanently or for one boot. A slot with nothing installed is refused. |
| `system ha failover` \| `maintenance on\|off` \| `resend-garp` \| `clear` \| `start-alone` | HA pair controls — see [Appliance Commands](/ha-pairs/appliance-commands) |
| `system diagnose self` | Is this the release it says it is: shipped files, components, boot loader, filesystems, sudoers, keyring, slots, watchdog, clock |
| `system diagnose controller` | DNS and TCP towards the control plane and, with TLS on, the handshake, HTTP/2 (ALPN) and a gRPC call, step by step |
| `system compliance [json]` | The CIS benchmark for the base system, checked from the inside (see [Security & Networking](./security-and-networking.md#compliance-check)) |
| `system nic-pins [reset]` | Which name belongs to which card; `reset` forgets the pins (before templating) |
| `system disk grow` | Grow into an enlarged virtual disk (no reboot needed) |
| `system proxy remove <version>` | Remove a downloaded proxy version no listener uses |
| `system listener remove <name>` | Remove a deployed listener the control plane no longer knows (unit, interface, bootstrap); the agent restarts |
| `system listener resume <name>` | Release a listener the agent holds after a crash loop; its VIP is announced again once it answers healthy |
| `system unlock` | Clear the failed-login lockout — local or serial console only. 5 wrong passwords on any path (sudo included) lock the account; it clears after 15 minutes. |
| `system factory-reset` | Erase this appliance's configuration and identity (see [below](#factory-reset)) |
| `system reboot` \| `system shutdown` | Reboot or power off (asks to confirm) |

### Factory reset

`system factory-reset` erases the control-plane registration, everything the control plane pushed (listener units, the agent's netplan files, its state), every downloaded proxy binary, the admin password and SSH keys, the egress proxy setting, the login lockout, any boot-slot choice, installed component pins, NIC name pins, the configuration snapshots taken before upgrades, and the appliance's identity (machine-id, SSH host keys). **The management address is kept** so a remote operator does not lose the box. The next boot is a new appliance: the host firewall is off again, and proxy versions must be installed again before the first deploy. Run `config export` first if you may want the configuration back.

## Backup, restore and imports

### Configuration archive

| Command | Effect |
| --- | --- |
| `config export <file> [without-proxies]` | Back up this appliance: the setup document including the token, the management interface, SSH keys, the agent's identity, the last state the control plane pushed, the admin password hash, the WAF bundles and configuration, pinned components and — unless `without-proxies` — every installed proxy binary. `<file>` under `/home/admin` or `/tmp`. |
| `config export media` | The same archive onto an attached USB stick |
| `config import <file> [identity <uuid>]` | Restore onto a replacement appliance and apply it. `identity` supplies the agent identity a 0.1.0 archive does not carry. |

Because the identity travels in the archive, the control plane sees the replacement as the **same** client — same name, same licence slot, same history. If the appliance already has a different identity, the import stops and asks: take the archived identity over only when the archived appliance is offline for good. Deployed listeners are not in the archive; the control plane pushes them again. An import validates everything before writing anything, and runs through the network [confirm window](#network-changes-and-the-confirm-window).

:::warning[The archive is a credential]
It contains the control-plane token and is not encrypted. It is written `0600`; store it like a private key.
:::

Copy files off the appliance with `scp` once the default password has been changed:

```bash
scp admin@<address>:/home/admin/<host>.tar.gz .
scp admin@<address>:/var/lib/elchi/support-<date>.tar.gz .
```

### Importing files

For sites without egress. Copy the file to `/home/admin/` (or `/tmp/`, a 512 MB tmpfs) with `scp` first; it must be a regular file owned by `admin`.

| Command | Effect |
| --- | --- |
| `import proxy-binary <path> <version> [sha256]` | Install an x86-64 Envoy binary, e.g. `import proxy-binary /tmp/proxy-v1.39.3 v1.39.3`. The version must be `vX.Y.Z` and exactly the version the listener's resource names; with a sha256 the file is verified. It lands in `/var/lib/elchi/envoys/vX.Y.Z/envoy`. |
| `import waf-bundle <path>` | Install a WAF bundle |
| `import os-update <path>` | Stage an OS upgrade bundle; `SHA256SUMS` and `SHA256SUMS.asc` must be next to it |
| `import component <name> <path> <version> [sha256]` | Install an `elchi-client` or `elchi-shield` binary brought by hand |

### Support bundle

`support bundle` collects logs and configuration into `/var/lib/elchi/support-<date>.tar.gz`. Control-plane tokens, anything on a line naming a token, password, secret or Authorization header, and PEM private keys are redacted automatically. Admins can also download it from the [Appliance tab](./appliance-tab.md#exports).

## Logs, diagnostics and restarts

| Command | Effect |
| --- | --- |
| `logs client\|shield\|frr\|agent-file [n] [follow] [grep <pattern>]` | Service logs |
| `logs proxy <listener> [system\|access] [n] [follow] [grep <pattern>]` | A listener's proxy logs |
| `diagnose all` | Run the checks in sequence, starting with the control plane |
| `diagnose upstream <host:port> [tls]` | DNS, TCP and TLS from this appliance to a backend |
| `diagnose vip <ip> [via <iface>]` | Who answers ARP for a VIP (duplicate detection) |
| `diagnose route <ip> [from <source>]` | The NIC, source and next hop a packet to `<ip>` leaves with, the policy rule and the route that decided it (with owners), and the NIC a VIP at `<ip>` would be answered on. Then it looks for a **missing route**: no route at all, a next hop that does not answer ARP, and every address of the appliance (data addresses, listener VIPs) whose replies to `<ip>` leave a different NIC than the one it lives on — the asymmetric path a stateful firewall drops — with the route or rule to add. |
| `diagnose http <url> [count <n>] [interval <ms>] [from <ip>] [insecure] [host <name>] [verbose]` | Up to 100 `GET`s, each on a new connection, the way the proxy's upstream connections leave the appliance (the egress proxy is not used): per request the status, DNS, connect, TLS, first-byte and total time, the bytes and the source address and NIC; then the status codes and min/avg/p95/max. `from` leaves with a given local address (a VIP takes that VIP's routes and rules), `host` sends another Host header and TLS name (a backend tried by its address). `verbose` (or `-v`) prints each exchange as `curl -v` does: DNS answers, the connect, TLS version, cipher and ALPN, the server certificate and whether it verifies, every request and response header. A bare number is the count (`diagnose http example.com 4`). `diagnose http ?` shows examples. |
| `diagnose dns <name>` | Resolve with the system resolver and each configured server |
| `diagnose controller` | DNS, TCP, TLS and agent state towards the control plane |
| `diagnose gateway [via <iface>]` | Listen 10 s for routers on the link and print the `set network static` line |
| `capture <iface> [port <n> \| arp] [count <n>] [seconds <n>]` | Packet capture on the terminal; `^C` stops it. At most 1000 packets or 60 seconds, 256 bytes per packet, never written to disk. Only the management interface, listener interfaces and physical NICs. |
| `restart client\|shield\|frr` | Restart a service. Restarting FRR drops every BGP session; restarting the WAF interrupts inspection — both ask first. |

### Logs and remote syslog

`set logging remote <host> [port] [udp|tcp|tls]` followed by `apply` ships the appliance's own events — every journal message at warning or above, the authentication trail, and the appliance's own helpers (network commits and reverts, firewall reloads, factory resets, boot-slot changes, captures, the console's audit trail, the agent, `sshd`, `sudo`) — to a syslog server. `tcp` and `tls` queue through an outage (10 000 messages in memory, 64 MiB on disk); `udp` does not. `tls` verifies the server certificate against the system trust store and the given name, so the target must be a host name the certificate carries. `set logging remote none` stops it. This is separate from the proxy access-log shipping configured in the Elchi UI.
