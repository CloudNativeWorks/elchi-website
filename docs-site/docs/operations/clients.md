---
title: Clients
description: The Clients console — connected edge nodes, remote command dispatch, host statistics and logs, and OpenStack interface/IP lookups.
sidebar_position: 3
tags: [operations]
---

![The Clients console — connected edge agents](/img/docs/clients-light.webp#gh-light-mode-only)
![The Clients console — connected edge agents](/img/docs/clients-dark.webp#gh-dark-mode-only)

A **client** is an edge node running the [`elchi-client`](/installation/client/overview) agent next to Envoy. The Clients console is the fleet's remote-control surface: it lists every connected node and is where you send it commands, read its host metrics and logs, and — on cloud hosts — look up network interfaces and available IPs.

## The clients list

Open **Clients** (`/clients`) for the list of every registered node in the current project:

```bash
GET /api/op/clients?project=<project>&with_service_ips=true
```

| Column | Meaning |
| --- | --- |
| **Name** | The client (node) name. |
| **Status** | **Live** (connected) or **Offline**. |
| **HA** | The [HA pair](/ha-pairs/overview) the node belongs to and its role (**Active**, **Standby**, …), or `—`. |
| **Version** | The `elchi-client` agent version. |
| **Service IPs** | Count of downstream service IPs the node serves; expand a row to see them. |
| **CPU** | Live load average per core, for connected nodes. |
| **Memory** | Live memory usage, for connected nodes. |
| **Last seen** | When the node last reported in. |

The **CPU** and **Memory** columns are populated by a bulk statistics command (`CLIENT_STATS`) sent to all connected clients when the list loads — this is command dispatch (below) used for live telemetry. Use the search box (*Find by name, host, IP, OS or version*) to filter by name, client id, hostname, OS, arch, version, HA pair name or service IP.

Members of an [HA pair](/ha-pairs/overview) are grouped under a header row (*HA pair · N of 2 members · members hear each other*); a pair in HA mode shows its vacant slot as an *awaiting peer* row. Searching for a pair name keeps the whole pair together.

New clients are added by [installing the agent](/installation/client/installation) on the host; they appear here once they register. Row actions are **Edit** (open the detail page), **Delete** and, for Owner/Admin on an Elchi OS client that is in no pair, **Enable HA mode** (see [Setting up a pair](/ha-pairs/setup#2-enable-ha-mode-on-an-existing-client)).

### Deleting a client

**Delete** first asks for a plain confirmation (**Delete Client**) and calls `DELETE /api/op/clients/:client_id`. A client that no service references is removed outright.

If the client is still referenced by services, or is a member of an HA pair, the controller refuses the plain delete and a second dialog opens — **Client Still Has Services** (or **Client Is an HA Pair Member**). It shows whether the client is **Live** or **Offline** and lists every service record that points at it (**Service**, **Version**, **Address**). From there:

- **Force Delete** (`DELETE /api/op/clients/:client_id?force=true`) is only enabled when the client is **offline** and the controller allows it. On a live client the button is disabled: remove its services from each service page instead (**Manage service** → **Remove**, see [Removing a service from an offline client](./services.md#removing-a-service-from-an-offline-client)).
- A force delete **detaches records only**: the agent is not contacted and nothing is stopped or removed on the host. The service records are detached from the client, GSLB IPs it owned are removed (an IP shared with a live client is kept), its Envoy connection entries and pending deploy intents are dropped, and OpenStack addresses are cleaned up best-effort (failures are reported, not retried). It cannot be undone.
- On an HA pair member, a force delete frees its slot: the pair runs on with the other member alone (degraded) until a new member is added — see [Replacing a failed member](/ha-pairs/failover-and-maintenance#replacing-a-failed-member). A member that is still connected should leave the pair by unpairing instead.

When it finishes, a **Client Force-Deleted** report (or **Force Delete Stopped Partway**, if it stopped after detaching some records) lists the **Services detached**, **GSLB IPs removed** / **kept**, **Envoy entries pruned**, **Deploy intents dropped** and **OpenStack cleanup** results, plus any warnings.

:::warning[Listener units may still run on the host]
If a force-deleted host ever comes back, its Envoy listener units are orphans. Remove them on the host with `system listener remove <name>` in the Elchi OS console, or `sudo elchi-client undeploy-local <listener>-<port> --yes` on other hosts.
:::

## Client detail

Clicking a row opens `/clients/:client_id`:

```bash
GET /api/op/clients/:client_id?project=<project>
```

The header shows a live **Live/Offline** badge. The tabs are:

- **Overview** — identity and connection facts: client id, hostname, OS, architecture, kernel, agent version, last-seen, connect/disconnect time and reason, whether **BGP** is enabled, cloud/provider (for cloud hosts), and any metadata. It also lists the services running on the node.
- **Network** — sub-tabs **Interfaces**, **Route**, **Routing policy**, **Routing tables** and **BGP**. On Elchi OS appliances the console owns the interfaces, so **Interfaces** is view-only there while the rest stays editable. See [Network & BGP](/operations/network-and-bgp).
- **Statistics** — host resource metrics.
- **Logs** — agent and service logs pulled from the node.
- **Apps** — the versioned components installed on the node.
- **Settings** — per-client agent settings.
- **Shield** — the node's [elchi-shield](/shield/deployment) status and on-disk policy files.
- **Appliance** — only on Elchi OS clients (see [below](#the-appliance-tab)).

On a member of an [HA pair](/ha-pairs/overview), the header also shows the pair and the node's role, and the overview has an **HA pair** panel: pair status, role, priority and epoch, peer, heartbeat paths, data plane, VIPs held here or on the peer, configuration revision and the `elchi-ha` daemon's state and alarms — see [Monitoring a pair](/ha-pairs/monitoring#ha-state-elsewhere-in-the-ui).

### Orphan listener units

The **Overview** tab warns about listener units that run on the host without a service record:

- **Offline client** — a *Client is offline* notice explains that if the host is gone for good you can detach its services from the service page (**Manage service** → **Remove**; offline clients can be selected) or delete the client (**Delete** → **Force Delete**). Neither contacts the agent.
- **Connected client** — the agent reports the `<listener>-<adminPort>` units it finds on the host (the `deployed_listeners` registration metadata). Any unit with no matching service record is listed under *N listener unit(s) on this host have no service record*; these were detached while the host was unreachable (force delete / force remove) and keep running there. The check repeats every 15 seconds.

Remove each orphan on the host:

```bash
# Elchi OS console
system listener remove <name>

# any other host
sudo elchi-client undeploy-local <name>-<port> --yes
```

The agent re-registers afterwards and the notice clears.

### The Appliance tab

Clients running Elchi OS (the agent reports `os_id=elchi`, or that the network is managed by the OS) get an extra **Appliance** tab. Its status is read live from the agent, so it is only shown while the appliance is connected; it needs Elchi OS 0.5.0 or later and a recent enough agent, and says so otherwise. **Refresh** fetches a freshly collected status.

- **Summary** — the product name and worst health level, then **Version**, **Hostname**, **Uptime**, **Boot slot** (running and committed), **Slot A** / **Slot B**, **Upgraded** (the release it was upgraded from, when present) and **Collected**. Banners flag sections that could not be read, a reboot required to finish installed updates, and a trial boot (running slot differs from the committed one).
- **Health** — the appliance's health items (**Level**, **Area**, **Status**), worst first, plus any check that did not answer in time.
- **Upgrade** — **State**, **Available**, **Schedule**, **Last result** and the upgrade history.
- **Firewall** — the firewall decision, whether the ruleset is loaded, an unconfirmed change and its revert countdown, **SSH from**, **Open data ports** and **Operator rules**.
- **Network** — the **Management** interface, the **Last revert**, and warnings for a change that waits for `network confirm` on the console or a configured card that is not present.
- **Compliance (CIS benchmark)** — pass / fail / deviation / n/a counts, when it was checked and when the next run is due, and the failing controls (**Control**, **Title**, **Evidence**). Owners and admins can start a check with **Run now** (it takes a few minutes).
- **Exports** (Owner/Admin) — **Support bundle** (logs and configuration for support, with tokens, passwords and private keys removed) and **Configuration archive** (the appliance configuration without proxy binaries, to restore on the console with `config import`). The appliance builds the file in the background; when it is ready, a **Download** button streams it through a single-use link. The configuration archive asks for confirmation first: it contains the appliance's control-plane token (and, when set, the admin password hash and egress proxy setting), is not encrypted, and must be stored like a private key.

## Sending remote commands

Remote commands are dispatched by posting to the clients collection:

```bash
POST /api/op/clients
```

```json
{
  "type": "CLIENT_STATS",
  "clients": [{ "client_id": "edge-01" }],
  "command": { "count": 100 }
}
```

The controller authorizes the command against your role and its type, selects a **processor** for that type (which validates the body and builds the protobuf message), then fans the command out to the target clients over the [command stream](./overview.md#1-the-command-stream-lifecycle) — sending directly to clients on this controller and, for clients elsewhere, forwarding through the [Registry](/administration/registry-and-ha) to the controller that owns them. Responses come back per client, with partial success (one failed client does not abort the rest).

### Command types

Each command `type` maps to a registered processor on the controller. The verifiable set:

| `type` | Purpose |
| --- | --- |
| `DEPLOY` | Deploy an Envoy service to the client. |
| `UNDEPLOY` | Remove a deployed Envoy service from the client. |
| `SERVICE` | Control the service unit on the host (start / stop / restart / status). |
| `UPDATE_BOOTSTRAP` | Push an updated Envoy [bootstrap](/envoy-configuration/resources/bootstrap) to the client. |
| `PROXY` | Proxy/admin operations against the running Envoy (read vs. write distinguished by path). |
| `ENVOY_VERSION` | Manage the Envoy binary version on the host. |
| `UPGRADE_LISTENER` | Perform a listener upgrade on the deployment. |
| `NETWORK` | Host networking — netplan apply/get/rollback, routes, policies, tables (via sub-types). |
| `FRR` | FRR/BGP routing management. |
| `CLIENT_LOGS` | Fetch host/agent logs from the node. |
| `FRR_LOGS` | Fetch FRR routing logs from the node. |
| `CLIENT_STATS` | Collect live host statistics (CPU, memory, …). |
| `FILEBEAT` | Manage Filebeat config/status on the node. |
| `RSYSLOG` | Manage rsyslog config/status on the node. |
| `SHIELD` | Get/update the client's [elchi-shield](/shield/deployment) config and read its status. |
| `WAF_VERSION` | Manage the WAF/CRS version on the node. |
| `HA` | [HA pair](/ha-pairs/overview) commands on a pair member — configure/unconfigure, failover, maintenance, resend GARP, clear a suspension, start alone, status. Pairs themselves are managed through the [HA Pairs API](/ha-pairs/api). |

Many commands carry a **sub-type** to select the exact operation — for example the network command uses sub-types such as netplan apply/get/rollback and route/policy/table management, and the service command uses start/stop/restart/status. BGP operations are a large family of FRR sub-types.

:::note[Command routing across controllers]
When the target client is connected to a different controller, the command is forwarded there transparently via the Registry. If routing is failing for reachable-but-remote clients, check [Registry & HA](/administration/registry-and-ha).
:::

## OpenStack interface and IP lookups

For clients running on OpenStack, the console can query the cloud's networking directly (used when assigning fixed IPs or allowed-address-pairs to an Envoy). These lookups go against the OpenStack Neutron API using the project's stored cloud credentials — the client must have `provider = openstack`.

### List a server's interfaces

```bash
GET /api/op/clients/:client_id/openstack/interfaces?os_uuid=<server-uuid>&osp_project=<openstack-project-uuid>&project=<db-project>
```

Returns each port on the server, enriched with its network and subnet details (name, status, MAC, fixed IPs, allowed address pairs, CIDR, gateway, and so on). All three query parameters are required: `os_uuid` (the OpenStack server), `osp_project` (the OpenStack project UUID), and `project` (the Elchi project whose cloud config supplies the credentials).

### Available IPs in a subnet

```bash
GET /api/op/clients/:client_id/openstack/subnets/:subnet_id/available_ips?osp_project=<openstack-project-uuid>&project=<db-project>
```

Returns the free and used IPs for a subnet — the subnet/network names, CIDR, gateway, the list of available IPs, the list of used IPs, and totals. Availability is computed from the subnet's allocation pools minus the network's in-use addresses and the gateway.

:::note[Cloud configuration]
These endpoints resolve the OpenStack credentials from the project's cloud settings. Configuring those credentials is covered in [Cloud & OpenStack](/administration/cloud-openstack).
:::

## Related

- **[Client Overview](/installation/client/overview)** and **[Installation](/installation/client/installation)** — getting the agent onto a host.
- **[Services](./services.md)** — the Envoy deployments you push to these clients.
- **[Cloud & OpenStack](/administration/cloud-openstack)** — the cloud credentials behind interface/IP lookups.
- **[Registry & HA](/administration/registry-and-ha)** — cross-controller command routing.
- **[Shield deployment](/shield/deployment)** — the shield config the `SHIELD` command manages.
