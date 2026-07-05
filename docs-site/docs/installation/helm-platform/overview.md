---
title: Platform Overview
description: Components deployed by the Elchi platform Helm chart and the role each one plays in the management plane.
sidebar_position: 1
---

The Elchi platform Helm chart deploys every component you need to run the management plane: UI, controller, control-plane, registry, and the supporting databases.

| Component | Role |
|---|---|
| **Elchi UI** | Web interface for creating and managing proxy configurations. |
| **Controller** | REST API service for resource management and client command dispatch. |
| **Control-Plane** | Envoy xDS service with snapshot cache and version routing. |
| **Registry** | Service discovery and process routing with automatic registration. |
| **Envoy Proxy** | Internal gateway for intelligent traffic routing between components. |
| **MongoDB** | Stores configurations, users, audit log, and platform state. |
| **VictoriaMetrics** | Time-series database for metrics storage and monitoring. |
