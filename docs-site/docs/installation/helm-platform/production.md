---
title: Production Setup
description: A reference production values file and high-availability guidelines for the Elchi platform.
sidebar_position: 6
---

The chart generates every credential on first install and keeps them in one Secret
([Credentials](/installation/helm-platform/configuration#credentials)), so a production values
file carries no passwords at all. Set them explicitly only when the values must come from your
own secret store — or when you render manifests outside the cluster (GitOps), where generation
cannot work:

```bash
# Only if you are supplying it yourself. Command substitution does not run inside a values file,
# so pass it at install time: --set-string global.jwt.secret="$JWT_SECRET"
JWT_SECRET=$(openssl rand -base64 32)
```

A reference values file for production-grade deployments:

```yaml
global:
  mainAddress: "elchi.company.com"
  tlsEnabled: true
  jwt:
    # secret: ""   # omit → generated once and kept in elchi-stack-secrets
    accessTokenDuration: "1h"
    refreshTokenDuration: "24h"
  elchiBackend:
    controlPlaneDefaultReplicas: 3
    controllerDefaultReplicas: 3
  versions:
    - tag: v1.6.15-v0.14.0-envoy1.39.0

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
