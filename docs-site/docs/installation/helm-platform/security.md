---
title: "Helm Platform Security Hardening"
sidebar_label: "Security"
description: "Harden an Elchi Helm install: generated credentials and JWT secret, TLS with your own certificate, admin password, CORS, Envoy admin, NetworkPolicies."
sidebar_position: 7
---

The `elchi-stack` chart starts from safe defaults: it ships no built-in passwords, runs MongoDB with authentication and keeps the Envoy admin interface off the gateway Service. A production install still needs a few decisions from you. This page lists them in order of importance.

:::danger[Before exposing the platform]

- **Keep the generated credentials, or supply strong ones.** An explicit JWT secret needs 32+ characters.
- **Serve the UI and API over TLS with a certificate your clients trust.**
- **Change the `admin` password** at first sign-in (the UI forces it).
- **Restrict CORS** to your UI's origin instead of `*`.
- **Restrict pod-to-pod traffic with NetworkPolicies.** The chart does not ship any.

:::

## Credentials and the JWT secret

Since chart 2.0.0 every credential lives in one Secret, `elchi-stack-secrets`, and the chart generates any value you leave empty: the JWT secret (48 characters), the MongoDB and ClickHouse passwords (32), the collector hash salt (48), the GSLB secret (48) and the Grafana password (24). The Secret is kept on `helm upgrade` and on `helm uninstall`, so nothing rotates by accident. The full resolution order is in [Credentials](/installation/helm-platform/configuration#credentials).

The JWT secret (`global.jwt.secret`) signs the session and API tokens the controller issues and derives the key that protects the license. Changing it logs every user out and invalidates the license key derivation, so set it once. To supply your own, generate a random value and pass it at install time:

```bash
JWT_SECRET=$(openssl rand -base64 32)   # 44 characters
helm install elchi elchi/elchi-stack ... --set-string global.jwt.secret="$JWT_SECRET"
```

Read a generated value back with:

```bash
kubectl -n <namespace> get secret elchi-stack-secrets \
  -o jsonpath='{.data.ELCHI_JWT_SECRET}' | base64 -d
```

For GitOps renderers (Argo CD, Flux, `helm template`), the chart cannot see the existing Secret, so set `global.secrets.autoGenerate: false` and provide all six values from your own secret store (SOPS, helm-secrets, an external secrets operator). MongoDB and ClickHouse passwords must be URL-safe (`[A-Za-z0-9._~-]`).

## TLS

The gateway Envoy terminates TLS itself on its `https` port; `global.envoy.tls.enabled` is `true` by default. Without your own certificate, the chart generates a **self-signed** certificate for `global.mainAddress` once and keeps it in the Secret `elchi-gateway-tls`. For production:

1. Put a certificate for your Elchi DNS name in a `kubernetes.io/tls` Secret (`tls.crt`, `tls.key`) in the release namespace and name it in `global.envoy.tls.secretName`. Alternatively, terminate TLS at your own load balancer or ingress.
2. Set `global.tlsEnabled: true` so the platform generates `https://` URLs for the UI, the API and the address clients use.

Edge hosts that send Shield metrics through the front door must trust its certificate (there is no skip-verify option for that path), so a self-signed certificate has to be added to every such host's CA store. A certificate from a CA your hosts already trust avoids that. On elchi-client hosts, the config template ships `server.insecure_skip_verify: true` in `/etc/elchi/config.yaml`; set it to `false` once the hosts trust the certificate (see [Client configuration](/installation/client/configuration) for editing and restarting).

## Sign-in and users

The first sign-in uses the bootstrap account `admin` / `admin` and must set a new password (12+ characters with upper case, lower case, a number and a symbol) before anything else opens. After that, create named users or connect LDAP, give each person the lowest role that works, and keep the Owner account for administration. See [Authentication & Access](/administration/auth-and-access).

Access and refresh tokens last `1h` and `5h` by default (`global.jwt.accessTokenDuration`, `global.jwt.refreshTokenDuration`); shorten them if your policy requires it.

## Network exposure

- **CORS.** `global.cors.allowedOrigins` defaults to `*`. Set it to the origins your UI is served from (comma-separated).
- **Envoy admin.** The gateway's admin interface (port 9901) can stop the gateway, so it is not part of the gateway Service unless you set `global.envoy.service.exposeAdmin: true` or `adminNodePort`. Leave it closed and use `kubectl port-forward deploy/envoy 9901` when you need it.
- **Metrics.** The gateway forwards only VictoriaMetrics query endpoints; import and delete are not reachable from outside.
- **The front door.** Clients, Envoy proxies and browsers reach Elchi only through the gateway at `global.mainAddress`. Expose that one Service (NodePort, LoadBalancer or ingress) and nothing else.

## MongoDB and other datastores

The bundled MongoDB starts listening on its Service only after it is running with authentication, using the generated `elchi` user. For production, prefer a managed MongoDB replica set: set `global.installMongo: false`, point `global.mongodb.hosts` at it, use a dedicated user with a strong password, and enable TLS to it with `global.mongodb.tlsEnabled`. The same applies to ClickHouse (`global.installClickhouse: false`, `global.clickhouse.hosts`). See [External MongoDB parameters](/installation/helm-platform/configuration#external-mongodb-parameters) and [Storage](/installation/helm-platform/storage).

## NetworkPolicies

The chart does not create NetworkPolicy objects, so by default every pod can reach every other pod. If your CNI enforces NetworkPolicies, write your own for the release namespace: allow ingress from outside only to the gateway Envoy, and allow traffic to MongoDB, ClickHouse and VictoriaMetrics only from Elchi's own pods. Test a policy in a staging install first; the controller, control plane, collector and gateway all need to reach each other.

## Container hardening

The UI runs as a non-root user (65534) with a read-only root filesystem, and the gateway Envoy runs as user 101. Both containers drop all Linux capabilities and disallow privilege escalation. If your cluster enforces Pod Security Admission, check the install in a test namespace first.

## Related

- [Production Setup](/installation/helm-platform/production): replica counts and a reference values file.
- [Production checklist](/administration/production-checklist): everything to verify before go-live.
- [Security Overview](/administration/security-overview): the platform's security model end to end.
