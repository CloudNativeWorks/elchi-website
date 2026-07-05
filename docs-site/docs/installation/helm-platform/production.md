---
title: Production Setup
description: A reference production values file and high-availability guidelines for the Elchi platform.
sidebar_position: 6
---

A reference values file for production-grade deployments:

```yaml
global:
  namespace: "elchi-production"
  mainAddress: "elchi.company.com"
  tlsEnabled: true
  jwt:
    secret: "$(openssl rand -base64 32)"
    accessTokenDuration: "1h"
    refreshTokenDuration: "24h"
  elchiBackend:
    controlPlaneDefaultReplicas: 3
    controllerDefaultReplicas: 3
  versions:
    - tag: v0.1.0-v0.14.0-envoy1.38.3

# Resource limits
elchi:
  replicas: 3
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
```

## High availability

- Run at least 3 replicas for every critical component.
- Configure pod anti-affinity rules to spread replicas across nodes.
- Use an external MongoDB replica set for durable persistence.
- Hand metrics off to an external VictoriaMetrics cluster.
- Set both resource `requests` and `limits` on every workload.
