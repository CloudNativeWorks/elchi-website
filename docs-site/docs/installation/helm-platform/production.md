---
title: Production Setup
description: A reference production values file and high-availability guidelines for the Elchi platform.
sidebar_position: 6
---

Generate the JWT secret in your shell first — command substitution does not run inside a values file:

```bash
JWT_SECRET=$(openssl rand -base64 32)
```

A reference values file for production-grade deployments (paste the generated secret, or leave it out and pass `--set-string global.jwt.secret=$JWT_SECRET` at install time):

```yaml
global:
  mainAddress: "elchi.company.com"
  tlsEnabled: true
  jwt:
    secret: "<paste-the-generated-secret-here>"  # 32+ characters
    accessTokenDuration: "1h"
    refreshTokenDuration: "24h"
  elchiBackend:
    controlPlaneDefaultReplicas: 3
    controllerDefaultReplicas: 3
  versions:
    - tag: v1.6.9-v0.14.0-envoy1.38.3

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
