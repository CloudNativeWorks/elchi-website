# ArtifactHub (repo "elchi": charts `elchi-stack`, `elchi-discovery`)

Status: **not submitted**. This is a proposed patch for `../elchi-helm`. Nothing in that repo was edited.

Sources:
- ArtifactHub Helm annotations reference: https://artifacthub.io/docs/topics/annotations/helm/
- ArtifactHub repositories (verified publisher, ownership claim, official): https://artifacthub.io/docs/topics/repositories/
- Live package data: `https://artifacthub.io/api/v1/packages/helm/elchi/elchi-stack` (fetched 2026-11-09)
- `elchi-helm` at commit `1227185` (2026-11-05): `artifacthub-repo.yml`, `charts/*/Chart.yaml`, `charts/elchi-stack/charts/*/values.yaml`, `LICENSE`

## What ArtifactHub shows today (live API, 2026-11-09)

| Field | Live value | Problem |
|---|---|---|
| repository `verified_publisher` | `false` | see finding 1 |
| repository `scanner_disabled` | `true` | no `artifacthub.io/images`, so nothing is scanned |
| `license` | `MIT` | the repo `LICENSE` is **Apache-2.0** |
| `links` | `github.com/cloudnativeworks/elchi-helm` (source), `charts.elchi.io` (source) | GitHub link returns **404** for everyone (private repo) |
| `maintainers` | John Brown, admin@cloudnativeworks.com | `artifacthub-repo.yml` owner is spelled "**Jhon** Brown"; `elchi-discovery` uses `support@cloudnativeworks.io` (.io vs .com) |
| `signed` | `false` | charts are not signed (no `.prov`) |
| `images`, `category`, `changes`, `screenshots` | not set | missing recommended metadata |

## Findings, in order of impact

1. **Verified publisher is blocked by a wrong `repositoryID`.**
   `artifacthub-repo.yml` (served at `https://charts.elchi.io/artifacthub-repo.yml`, next to `index.yaml`, which is correct) says
   `repositoryID: 6af4e7d9-23ba-47cf-923b-0644a0b8ea84`. The live repository's ID is
   **`c32bd54b-1ec0-487b-a045-c4bd20082dd9`** (`repository.repository_id` in the package API).
   ArtifactHub grants Verified Publisher only when the file's `repositoryID` matches the ID shown on the
   repository card in the control panel. The old ID most likely belongs to a deleted or re-created registration.
   → Copy the ID from *Control Panel → Repositories → elchi* (it should be the `c32bd54b…` value), publish, and wait for the next tracking run.
2. **License mismatch.** Both charts declare `artifacthub.io/license: MIT`, but the repo's `LICENSE` is Apache-2.0
   (and PRODUCT.md says the product is Apache-2.0). The annotation overrides detection, so ArtifactHub shows MIT. → `Apache-2.0`.
3. **Dead source links.** `home`/`sources` point at the private GitHub repo. ArtifactHub shows them as links, and they 404.
   → Point them at public URLs (site, docs, public `elchi-archive` releases) and add `artifacthub.io/links`, including a `support` link.
4. **No security scanning.** Without `artifacthub.io/images`, ArtifactHub has nothing to scan (`scanner_disabled: true`).
   Listing images gives a security report, which is a quality signal on the package page. The images and tags below
   are read from the chart values at `1227185`. Keep them in sync through `bump-versions.sh` (extend it to rewrite this block).
   - Check before publishing: `global.versions[0].tag` is `v1.8.4-v0.14.0-envoy1.40.2` while the front-door
     `envoy` subchart pins `envoyproxy/envoy:v1.39.4`. If that difference is intended (the front door is independent of the
     backend's Envoy variant), keep it. Otherwise fix it before listing the image.
5. **Owner/maintainer identity is inconsistent** ("Jhon"/"John", `.com`/`.io`). An ownership claim requires the claimer's
   ArtifactHub sign-in email to be listed under `owners`. Use one real, monitored address.
6. **Missing `category`, `changes`, `screenshots`**, and no `icon` on `elchi-discovery`.
7. **README badge points at a non-existent repo name.** `charts/elchi-stack/README.md` uses
   `artifacthub.io/badge/repository/elchi-stack`. The repo is named `elchi` (`/badge/repository/elchi` returns 200).
8. **Signing (`artifacthub.io/signKey`) is optional and later.** It is only meaningful once charts are signed with
   `helm package --sign` and `.prov` files are published. Do not add the annotation before that.
   The signing key needs an HTTPS `url` (for example `https://charts.elchi.io/pgp_keys.asc`).
9. **Keywords:** drop `service-mesh` (Elchi does not inject workload sidecars, so it misclassifies the chart). Add `xds`, `envoy-proxy`, `waf`, `api-security`, `api-discovery`.

After 1, 3 and a README that renders on ArtifactHub, the repo also meets the documented preconditions to **request
"Official" status** (verified publisher, requester is the publisher, every official package has a README).

## Proposed patch (apply in `elchi-helm`; not applied)

```diff
--- a/artifacthub-repo.yml
+++ b/artifacthub-repo.yml
@@
 # Artifact Hub repository metadata file
-repositoryID: 6af4e7d9-23ba-47cf-923b-0644a0b8ea84
+# Must equal the ID on the repository card in the ArtifactHub control panel
+# (live API, 2026-11-09: c32bd54b-1ec0-487b-a045-c4bd20082dd9). Verify before publishing.
+repositoryID: c32bd54b-1ec0-487b-a045-c4bd20082dd9
 owners:
-  - name: Jhon Brown
-    email: admin@cloudnativeworks.com
+  # The email must be the one used to sign in to ArtifactHub (needed for ownership claims).
+  - name: John Brown
+    email: admin@cloudnativeworks.com
```

```diff
--- a/charts/elchi-stack/Chart.yaml
+++ b/charts/elchi-stack/Chart.yaml
@@
 apiVersion: v2
 name: elchi-stack
-description: A comprehensive Helm chart for deploying Elchi proxy management platform with UI, controller, control plane and registry components
+description: Elchi, a control plane and web UI for Envoy proxy fleets (UI, controller, xDS control plane, registry, collector and datastores)
 type: application
 version: 2.0.29
 appVersion: "v1.8.4"
 kubeVersion: ">=1.21.0-0"
 icon: "https://charts.elchi.io/logo.png"
 keywords:
-  - proxy
   - envoy
-  - management
-  - configuration
-  - service-mesh
-  - traffic-management
+  - envoy-proxy
+  - xds
   - control-plane
-  - ui
   - api-gateway
+  - traffic-management
+  - waf
+  - api-security
+  - api-discovery
+  - gslb

-home: https://charts.elchi.io
+home: https://www.elchi.io
 sources:
-  - https://github.com/cloudnativeworks/elchi-helm
   - https://charts.elchi.io
+  - https://github.com/CloudNativeWorks/elchi-archive
 maintainers:
   - name: John Brown
     email: admin@cloudnativeworks.com
     url: https://cloudnativeworks.com

 annotations:
-  artifacthub.io/license: MIT
+  artifacthub.io/license: Apache-2.0
+  artifacthub.io/category: networking
   artifacthub.io/prerelease: "false"
   artifacthub.io/containsSecurityUpdates: "false"
   artifacthub.io/valuesSchema: "true"
   artifacthub.io/readme: "true"
+  artifacthub.io/links: |
+    - name: Website
+      url: https://www.elchi.io
+    - name: Documentation
+      url: https://www.elchi.io/docs/
+    - name: Helm installation guide
+      url: https://www.elchi.io/docs/installation/helm-platform/overview
+    - name: Releases
+      url: https://github.com/CloudNativeWorks/elchi-archive/releases
+    - name: Video tutorials
+      url: https://www.youtube.com/@CloudNativeWorks
+    - name: support
+      url: https://www.elchi.io/contact
+  artifacthub.io/images: |
+    - name: elchi-ui
+      image: jhonbrownn/elchi:v1.7.6
+    - name: elchi-backend
+      image: jhonbrownn/elchi-backend:v1.8.4-v0.14.0-envoy1.40.2
+    - name: elchi-collector
+      image: jhonbrownn/elchi-collector:v0.1.15
+    - name: elchi-coredns
+      image: jhonbrownn/elchi-coredns:v0.1.4
+    - name: envoy
+      image: envoyproxy/envoy:v1.39.4
+    - name: mongodb
+      image: mongo:6.0.12
+    - name: clickhouse
+      image: clickhouse/clickhouse-server:24.8
+    - name: victoriametrics
+      image: victoriametrics/victoria-metrics:v1.93.5
+    - name: otel-collector
+      image: otel/opentelemetry-collector-contrib:0.89.0
+    - name: grafana
+      image: grafana/grafana:12.2.0
+  artifacthub.io/screenshots: |
+    - title: Dashboard
+      url: https://www.elchi.io/shots/dashboard-light.webp
+    - title: Listener editor (typed xDS form)
+      url: https://www.elchi.io/shots/listener-light.webp
+    - title: Resource dependency graph
+      url: https://www.elchi.io/shots/dependency-light.webp
+    - title: Edge clients
+      url: https://www.elchi.io/shots/clients-light.webp
+    - title: API Discovery
+      url: https://www.elchi.io/shots/api-discovery-light.webp
+  artifacthub.io/changes: |
+    # Replace on every release with that release's real changes (kinds: added, changed, deprecated, removed, fixed, security).
+    - kind: changed
+      description: Chart metadata for ArtifactHub (license, links, images, screenshots, category)
   artifacthub.io/recommendations: |
     - url: https://artifacthub.io/packages/helm/bitnami/mongodb
       title: MongoDB (optional)
   artifacthub.io/requirements: |
     - Kubernetes 1.21+
     - Helm 3.0.0+
     - At least 2 CPU cores and 4GB RAM per node
```

```diff
--- a/charts/elchi-discovery/Chart.yaml
+++ b/charts/elchi-discovery/Chart.yaml
@@
 apiVersion: v2
 name: elchi-discovery
-description: A Helm chart for Elchi Discovery
+description: Elchi Endpoint Discovery, which watches Kubernetes services and syncs their endpoints to Envoy clusters managed by Elchi
 type: application
 version: 1.0.0
 appVersion: "1.0.0"
 kubeVersion: ">=1.19.0-0"
+icon: "https://charts.elchi.io/logo.png"
 keywords:
   - elchi
   - kubernetes
   - endpoint-discovery
+  - envoy
+  - eds
   - cloud-native
-home: https://github.com/CloudNativeWorks/elchi-helm
+home: https://www.elchi.io/docs/installation/discovery-agent/overview
 sources:
-  - https://github.com/CloudNativeWorks/elchi-helm
+  - https://charts.elchi.io
 maintainers:
-  - name: CloudNativeWorks
-    email: support@cloudnativeworks.io
+  - name: John Brown
+    email: admin@cloudnativeworks.com
+    url: https://cloudnativeworks.com

 annotations:
-  artifacthub.io/license: MIT
+  artifacthub.io/license: Apache-2.0
+  artifacthub.io/category: networking
   artifacthub.io/prerelease: "false"
   artifacthub.io/containsSecurityUpdates: "false"
   artifacthub.io/valuesSchema: "true"
+  artifacthub.io/links: |
+    - name: Documentation
+      url: https://www.elchi.io/docs/installation/discovery-agent/overview
+    - name: support
+      url: https://www.elchi.io/contact
+  artifacthub.io/images: |
+    - name: elchi-discovery
+      image: jhonbrownn/elchi-discovery:v1.0.0
   artifacthub.io/requirements: |
     - Kubernetes 1.19+
     - Helm 3.0.0+
```

```diff
--- a/charts/elchi-stack/README.md
+++ b/charts/elchi-stack/README.md
@@
-[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/elchi-stack)](https://artifacthub.io/packages/search?repo=elchi-stack)
+[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/elchi)](https://artifacthub.io/packages/search?repo=elchi)
```

### Before applying, confirm

- [ ] The repository ID on the ArtifactHub control panel card (the `c32bd54b…` value is from the public API).
- [ ] The owner email you sign in to ArtifactHub with. Put that exact address in `owners`.
- [ ] Whether `support@cloudnativeworks.io` or `admin@cloudnativeworks.com` is the monitored address. Use one everywhere.
- [ ] Image tags match the released chart (`bump-versions.sh` is the source of truth). The UI image tag `v1.7.6` in values differs from the `elchi-ui-v1.7.2` GitHub release name, which is fine if the image and release numbering differ by design.
- [ ] Docker Hub namespace `jhonbrownn/*` is a personal account name. Consider an org namespace (for example `cloudnativeworks/*`) before advertising images, since the namespace shows on ArtifactHub's security report.
- [ ] Bump the chart version (`elchi-stack` 2.0.30, `elchi-discovery` 1.0.1). ArtifactHub reads annotations per chart version, so the new metadata appears only on a new version.
- [ ] In the ArtifactHub control panel, after the next sync: confirm "Verified Publisher", then (optional) request "Official" status.
