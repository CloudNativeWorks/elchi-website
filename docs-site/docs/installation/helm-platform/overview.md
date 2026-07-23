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
| **OpenTelemetry Collector** | Scrapes Envoy metrics and remote-writes them to VictoriaMetrics. |
| **Grafana** | Dashboards over the collected platform and Envoy metrics. |
| **ClickHouse** | Raw API-events store feeding API discovery (default on via `installClickhouse`). |
| **elchi-collector** | Envoy access-log (ALS) ingestion into ClickHouse (default on via `installCollector`). |
| **Elchi CoreDNS** | GSLB DNS server — deployed only when `installGslb: true` (default off). |
