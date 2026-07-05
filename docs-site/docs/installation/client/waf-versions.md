---
title: WAF (Coraza WASM) Versions
description: How elchi-client manages the Coraza WASM WAF lifecycle via the WAF_VERSION command pushed from the controller.
sidebar_position: 7
tags: [installation]
---

Besides the [bundled ext_proc shield sidecar](/installation/client/shield-sidecar), elchi-client
manages a second, **separate** WAF: the **Coraza WASM filter** that runs *inside* Envoy. The
client downloads and installs its `.wasm` binaries on demand, driven by the controller.

:::info[Two different WAFs]
- **Coraza WASM filter** (this page) — an Envoy WASM extension configured through xDS; the
  client's job is only to fetch and stage the `.wasm` binary versions on the host. This is the
  delivery behind the platform's [WAF product](/traffic-and-certificates/waf/overview).
- **elchi-shield** — a parallel, `ext_proc` sidecar WAF/API-security engine (its own Coraza
  build is compiled into the binary). Different delivery, different lifecycle. See
  [Shield overview](/shield/overview).

They are complementary, not the same component.
:::

## The `WAF_VERSION` command

The controller pushes a `WAF_VERSION` command to elchi-client over its command stream. The
client's WAF manager handles two operations:

| Operation | Behavior |
| --- | --- |
| `GET_VERSIONS` | List the WAF versions already downloaded on the host (scans the WAF var dir for `coraza.wasm` binaries). |
| `SET_VERSION` | Download and install a specific version's `coraza.wasm` (idempotent — an existing binary is skipped unless `force_download` is set). |

On `SET_VERSION` the client creates a per-version directory, downloads the WASM binary, sets
permissions, and reports the installed version and path back to the controller. Failures are
classified into distinct statuses (`VERSION_NOT_FOUND`, `DOWNLOAD_FAILED`, `NETWORK_ERROR`,
`PERMISSION_FAILED`), so the controller sees *why* a version failed, not just that it did.

## Where binaries land

| Setting | Value |
| --- | --- |
| WAF var directory | `/var/lib/elchi/waf` |
| Per-version binary | `/var/lib/elchi/waf/<version>/coraza.wasm` |
| Architecture | `wasm-amd64` |
| Archive index | `https://archive.elchi.io/index.json` (the `coroza_releases` list) |
| Download timeout | 300s (5 min) |

Available versions come from the public elchi-archive index (`index.json`); the client fetches
the `coroza_releases` entries, ignoring the Envoy releases in the same document. Each version
is staged in its own directory so multiple versions can coexist on a host and Envoy can be
pointed at whichever is active.

## How it fits together

The controller decides which Coraza WASM version an edge should run and pushes `WAF_VERSION` to
stage it; the WAF rule/config for the filter itself rides the normal xDS snapshot into Envoy as
a WASM extension `typed_config`. The client never authors WAF rules — it only ensures the
requested `.wasm` binary is present on the host. Manage the WAF product and its rules from the
UI as described in [WAF overview](/traffic-and-certificates/waf/overview).
