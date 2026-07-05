---
title: Configuration
description: Helm chart parameters for the Elchi Discovery agent.
sidebar_position: 4
---

| Parameter | Description |
| --- | --- |
| `config.elchiEndpoint` | URL of your Elchi controller. |
| `config.token` | Discovery token from **Settings → Tokens**. |
| `clusterName` | Unique cluster name. Must be distinct across every connected K8s cluster. |

:::info[Quick tips]
- Generate the discovery token from **Elchi UI → Settings → Tokens**.
- Pick a unique `clusterName` per cluster — it identifies the source of every endpoint.
- The agent registers services automatically as they appear in the cluster.
:::
