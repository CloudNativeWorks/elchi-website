---
title: Elchi Documentation
description: Everything you need to install, configure, and operate the Elchi proxy management platform, from quick local trials to production-grade Kubernetes deployments.
sidebar_position: 1
---

![From a client connection to live Envoy config](/img/docs/flow.png)

Everything you need to install, configure, and operate the Elchi proxy management platform — from quick local trials to production-grade Kubernetes deployments.

Elchi is a comprehensive proxy management platform that provides a UI-driven workflow for managing clients at enterprise scale. It bundles three coordinated processes — Registry, Controller, and Control-Plane — alongside a modern React UI, MongoDB for state, and VictoriaMetrics for time-series.

- **[Quick Start](/getting-started/quickstart)** — Get Elchi running on a Kubernetes cluster in under five minutes with Helm.
- **[Install the Platform](/installation/helm-platform/installation)** — Full Helm install — controller, control-plane, registry, MongoDB & VictoriaMetrics.
- **[Set up the Client](/installation/client/overview)** — Install the Go agent on Linux hosts to register Envoy proxies with your control plane.
- **[Endpoint Discovery](/installation/discovery-agent/overview)** — Auto-discover Kubernetes services and sync endpoints to your Envoy clusters.
