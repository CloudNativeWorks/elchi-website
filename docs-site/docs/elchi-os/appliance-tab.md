---
title: Appliance Tab
description: The Appliance tab on an Elchi OS client's detail page in the Elchi UI — release and boot slots, health, upgrade state, firewall, network confirm, the CIS compliance check, and support bundle and configuration archive downloads.
sidebar_position: 6
tags: [elchi-os, operations]
---

A client that is an Elchi OS appliance gets an extra **Appliance** tab on its detail page (**Clients → \<client\>**), after **Shield**. It shows the appliance's own status, read live from the agent, and lets admins re-run the compliance check and download a support bundle or the configuration archive. The UI shows the tab when the agent reports at registration that it runs on Elchi OS (`os_id: elchi` or `network_managed_by: os` in the client's metadata). The tab needs Elchi OS 0.5.0 or later.

The tab is a view, not a remote console. Upgrades, firewall rules, network changes and configuration restores are done on the [appliance console](./console.md).

## Who can do what

| Action | Roles |
| --- | --- |
| View the tab, **Refresh** | Every role |
| **Run now** (compliance check) | Owner, Admin |
| **Exports** (support bundle, configuration archive) | Owner, Admin — the section is hidden for other roles |

Viewing the status is not written to the audit log; starting an export, running the compliance check, issuing a download ticket and the download itself are.

## Header and summary

The header shows the product name (`Elchi OS`), a dot with the worst health severity, and **Refresh**, which bypasses the agent's short cache and collects a fresh status.

| Field | Meaning |
| --- | --- |
| **Version** | The running Elchi OS release |
| **Hostname** | The appliance's hostname |
| **Uptime** | Time since boot |
| **Boot slot** | The running slot, and in brackets the committed one |
| **Slot A**, **Slot B** | The release installed in each [root slot](./upgrades.md#how-an-os-upgrade-works) |
| **Upgraded** | The release this appliance was upgraded from, when it was |
| **Collected** | When the agent collected this status |

Banners above the summary:

| Banner | Meaning |
| --- | --- |
| *Some sections could not be read* | Lists the parts of the status the appliance could not collect |
| *A reboot is required to finish installed updates* | Security updates were installed with `system update apply`; reboot with `system reboot` |
| *Running a trial boot on slot X; slot Y is committed* | An upgrade or rollback trial is being judged by the [health gate](./upgrades.md#the-health-gate) |

## Health

The same items as `show health` on the console, worst first:

| Column | Content |
| --- | --- |
| **Level** | Severity |
| **Area** | The part of the appliance |
| **Status** | What is wrong, or that it is fine |

*Did not answer in time:* under the table lists the probes that timed out.

## Upgrade

| Row | Meaning |
| --- | --- |
| **State** | The upgrader's state line (staged, trial, committed, rolled back, failed), or *no upgrade has run* |
| **Available** | A newer release seen by the last `system upgrade check`, or *none* |
| **Schedule** | Legacy; scheduled upgrades were removed in Elchi OS 0.5.2, so this reads *off* |
| **Last result** | The last verdict |

**History (n)** shows the latest outcomes (up to 10) on hover; `show upgrade` on the console has the full history. To upgrade, use `system upgrade` on the console — see [Upgrades](./upgrades.md).

## Firewall

The decision (**on**, **off**, or **unknown**), and while on, whether the ruleset is loaded (**ruleset loaded** / **ruleset not loaded**). **unconfirmed change (reverts in Ns)** appears while an operator rule change waits for `firewall confirm`. A red banner shows a firewall warning from the appliance.

| Row | Meaning |
| --- | --- |
| **SSH from** | The `set ssh allow` list, or *any address*; *(public management address)* is added when the management address is public |
| **Open data ports** | The listener ports the firewall has opened on the management address |
| **Operator rules** | Number of `firewall rule` entries |

See [Host firewall](./security-and-networking.md#host-firewall).

## Network

| Item | Meaning |
| --- | --- |
| *A network change waits for 'network confirm' on the console (reverts in Ns)* | A console network change is inside its [confirm window](./console.md#network-changes-and-the-confirm-window) |
| *Configured on the console but the card is not present: …* | An interface configured on the console whose NIC is missing |
| **Management** | The management interface |
| **Last revert** | The last automatic or manual network revert |

## Compliance (CIS benchmark)

The last result of the appliance's [compliance check](./security-and-networking.md#compliance-check): counts of **pass**, **fail**, **deviation** and **n/a**, when it was checked and when the next run is due. Failing controls are listed with **Control**, **Title** and **Evidence**. Before the first run the panel reads *No check has run yet*.

The check runs daily and after every `system compliance` on the console. **Run now** starts it from the UI; it takes a few minutes, and the panel shows **running** and follows it until it finishes.

## Exports

Two downloads, built by the appliance in the background:

| Button | Contents |
| --- | --- |
| **Support bundle** | Logs and configuration for support, with tokens, passwords and private keys removed — the same file as `support bundle` on the console |
| **Configuration archive** | The appliance configuration without proxy binaries (as `config export … without-proxies`), to restore on the console with `config import` |

**Configuration archive** first asks *Download the configuration archive?*: the archive contains the appliance's control-plane token and, when they are set, the admin password hash and the egress proxy setting. It is not encrypted — anyone holding it can present themselves to Elchi as this appliance, so store it like a private key. Confirm with **Create the archive**.

While the appliance builds the file the button reads **Preparing…**; then **Download \<filename\> (\<size\>)** appears. The browser downloads through a single-use link valid for 60 seconds. The control plane streams the file from the appliance, checks its sha256 on the way and keeps nothing; the appliance deletes the file after delivery, or after an hour. An export that is still on the appliance comes back after a page reload. If it expires first, the tab says *The export expired on the appliance; create it again.* The UI stops waiting after 20 minutes.

Restoring an archive is done on the replacement appliance's console with `config import` — see [Backup, restore and imports](./console.md#backup-restore-and-imports).

## When the tab shows no status

| Message | Meaning |
| --- | --- |
| *The appliance is offline* | The status is read live from the agent; it appears once the appliance reconnects |
| *Could not read the appliance status* | The request failed; the reason is shown |
| *The agent on this appliance is too old* | Appliance status and exports need a newer Elchi agent; it arrives with the next Elchi OS upgrade |
| *Not available on this host* | The host is not an Elchi OS 0.5.0+ appliance |
| *The appliance returned no status* | The agent answered without a status document |
