---
title: Elchi Client
description: A lightweight agent that connects each Envoy proxy host to your Elchi control plane.
sidebar_position: 1
---

The Elchi Client is a lightweight agent that runs on Linux hosts and connects each Envoy proxy to your control plane. It handles registration, log shipping, BGP routing, and lifecycle commands.

:::note[HA pairs need Elchi OS]
Two edge boxes can share VIPs active/passive as an [HA pair](/ha-pairs/overview). HA pairs run only on **Elchi OS appliances**, which ship the `elchi-ha` service, its firewall rules and kernel settings; a client installed with the installer on a general-purpose Linux host cannot join a pair. To run the client as an appliance instead of on your own Linux host, see [Elchi OS](/elchi-os/overview).
:::
