---
title: Security
description: Critical security requirements for Elchi platform deployments and how to generate a secure JWT secret.
sidebar_position: 7
---

:::danger[Critical security requirements]

- **JWT secret** — must be a randomly generated value of 32+ characters. The default ships unsafe and must be replaced.
- **TLS** — always enable TLS for production deployments.
- **MongoDB** — use strong passwords and enable authentication.
- **Network policies** — restrict pod-to-pod communication using Kubernetes NetworkPolicies. The chart does not ship NetworkPolicy manifests — author your own.

:::

## Generate a secure JWT secret

```bash
# 32-byte secret, base64 encoded
openssl rand -base64 32

# Or, using /dev/urandom
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
```
