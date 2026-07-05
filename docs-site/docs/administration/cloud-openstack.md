---
title: Cloud & OpenStack
description: Register an OpenStack cloud, discover a VM's network interfaces and subnets, and bind an edge Envoy node's downstream IP to an OpenStack port.
sidebar_position: 7
tags: [administration, openstack, cloud]
---

Elchi can integrate with **OpenStack** so that edge Envoy nodes running on OpenStack VMs get their downstream IPs managed on the underlying Neutron port. You register a cloud once under **Settings → Clouds**, then, when deploying an edge client, Elchi discovers the VM's interfaces and available IPs and binds the chosen address to the port.

:::note[Scope — OpenStack today]
The provider list shows AWS, Azure, and GCP, but only **OpenStack** is functional; the others are placeholders. The integration is narrow and specific: it does **network interface / subnet discovery, available-IP calculation, and IP binding** on an existing VM. It does not manage VM lifecycle, load balancers, or floating IPs.
:::

## Registering a cloud

**Settings → Clouds → Add Cloud.** OpenStack authenticates with a **Keystone Identity v3 application credential**. Fill in:

| Field | Notes |
| --- | --- |
| **Cloud Name** | `^[a-zA-Z0-9_-]+$`; can't be reused or edited later. Reserved names (`other`, `default`, `system`, `admin`, `root`) are rejected. |
| **Region** | e.g. `RegionOne`. |
| **Provider** | OpenStack (fixed). |
| **Authentication URL** | Keystone endpoint, e.g. `https://os.example.com:5000`. |
| **Interface** | `public`, `internal`, or `admin` — which Keystone catalog endpoint to use (default `public`). |
| **Application Credential ID** | Required. |
| **Application Credential Secret** | Required. |

The API version (`3`), auth type (`v3applicationcredential`), and identity API version are fixed for OpenStack.

Existing clouds render as cards showing the auth URL, region, interface, and credential ID, with edit and delete actions.

:::info[Credentials are masked and preserved]
GET responses mask the credential ID and secret. When you edit a cloud, values that still contain the mask (`*`) are treated as unchanged and are **not** overwritten — so re-saving the form without retyping the secret keeps the stored one.
:::

**API** (all endpoints require `?project=<elchi-project>` and Owner/Admin):

```bash
# Create
curl -X POST "$ELCHI/api/v3/setting/clouds/$CLOUD_NAME?project=$PROJECT" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
        "provider": "openstack",
        "region_name": "RegionOne",
        "interface": "public",
        "auth": {
          "auth_url": "https://os.example.com:5000",
          "application_credential_id": "…",
          "application_credential_secret": "…"
        }
      }'
```

`GET /setting/clouds`, `GET/PUT/DELETE /setting/clouds/:cloud_name` complete the CRUD. Cloud config is stored per project (in that project's settings), not as a global resource.

## Discovering interfaces, subnets, and available IPs

For an edge client whose provider is OpenStack, Elchi queries Neutron on your behalf so you can pick where the node binds. Two read endpoints back the UI (readable by Owner, Admin, Editor, and Viewer):

- **Interfaces** — `GET /api/op/clients/:client_id/openstack/interfaces` returns the VM's ports enriched with full network and subnet detail: port ID/MAC/status, `fixed_ips`, `allowed_address_pairs`, and each attached network's subnets (CIDR, gateway, allocation pools, DNS, DHCP).
- **Available IPs** — `GET /api/op/clients/:client_id/openstack/subnets/:subnet_id/available_ips` computes free addresses for a subnet by expanding its allocation pools and subtracting the IPs already used by Neutron ports and the gateway. It returns `available_ips[]`, `used_ips[]`, and totals.

Both require query params identifying the OpenStack server and project:

```bash
curl "$ELCHI/api/op/clients/$CLIENT_ID/openstack/interfaces?os_uuid=$VM_UUID&osp_project=$OSP_PROJECT&project=$PROJECT" \
  -H "Authorization: Bearer $TOKEN"
```

:::note[IPv4 only]
Available-IP calculation covers **IPv4** subnets only.
:::

## Binding an edge node's IP

When you deploy an edge client (Envoy node) that lives on an OpenStack VM and has an interface selected, Elchi binds the node's downstream (listener) IP to the Neutron port using one of two modes:

- **`aap` (allowed address pair)** — adds the IP as an allowed address pair on the port, suitable for VIP/floating-style addresses shared across nodes.
- **`fixed`** — adds the IP as a fixed IP on the port; Elchi validates the address falls inside the subnet CIDR and auto-detects the subnet.

On undeploy, the pairing is removed. This is what ties an Elchi listener's advertised address to a real, routable IP on the OpenStack network — so the discovery step (interfaces → subnet → available IP) feeds directly into a working edge deployment.

## Roles

- **Cloud CRUD** (`/setting/clouds`) is **Owner/Admin** only — Editors and Viewers get `403` even on reads.
- The **OpenStack discovery** reads (interfaces, available IPs) are additionally accessible to **Editor** and **Viewer**.

See [Authentication & Access](/administration/auth-and-access) for the role model, and the [client installation](/installation/client/overview) docs for deploying an edge node.
