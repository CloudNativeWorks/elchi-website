---
title: "Envoy Blue/Green with EDS and Endpoint Draining"
description: "Blue/green behind Envoy: switch an EDS cluster's service_name between two endpoint sets, or drain one upstream IP with the Elchi automation API."
sidebar_position: 6
tags: [guide]
---

# How to Do Blue/Green Deployments with Envoy EDS and Drain an Upstream Endpoint via API

For a blue/green release behind Envoy, put the blue servers and the green servers in two separate endpoints resources (EDS `ClusterLoadAssignment`s) and point the EDS cluster at one of them through `eds_cluster_config.service_name`. Elchi's cluster endpoints switch rewrites that one field and pushes every listener that uses the cluster; Envoy builds and warms the changed cluster while the old one keeps serving, then swaps them. To take one upstream server out of rotation instead, the endpoint disable marks that IP or hostname as `DRAINING` everywhere it is used in the project, so Envoy sends it no new requests. Both are available in the UI and through the public automation API with a project API token.

## When you need this

- You release a new version of a backend on new servers and want to move traffic to them at once, with a fast way back.
- A release pipeline should make the switch, check the result and switch back without a person in the UI.
- You need to patch or reboot one upstream server and want Envoy to stop sending it requests first, wherever it is configured.

## Steps: blue/green switch

1. **Prepare two endpoints resources.** Create `backend-blue` and `backend-green` as [endpoints resources](/envoy-configuration/resources/endpoints) in the same Envoy version. Each resource's own `cluster_name` must equal its name.
2. **Use an EDS cluster.** The [cluster](/envoy-configuration/resources/clusters) must be of type `EDS` and name the current resource in `eds_cluster_config.service_name`. STATIC and DNS clusters carry their endpoints themselves and cannot be switched.
3. **Create an API token.** In **Settings → Tokens**, create a [project API token](/automation-api/tokens) with `clusters:read` and `clusters:write`. `GET /api/public/v1/token` returns the project ID, and `GET /api/public/v1/projects/{project}/versions` lists the Envoy versions.
4. **Preview the switch.** Send the switch with `"dry_run": true` to see the endpoints before and after, the listeners that will be pushed, and any warnings:

   ```bash
   curl -sS -X POST \
     -H "Authorization: Bearer $ELCHI_TOKEN" -H "Content-Type: application/json" \
     https://elchi.example.com/api/public/v1/projects/$P/clusters/payments/switch-endpoints \
     -d '{"version": "v1.40.2", "to": "backend-green", "from": "backend-blue", "dry_run": true}'
   ```

5. **Switch.** Send the same request without `dry_run`, with an `Idempotency-Key` header and optionally `Prefer: wait=60` to wait for the push. Sending `from` makes the switch fail with `409 from_mismatch` if the cluster no longer uses the resource you expect, so two releases never overwrite each other. A `202` answer carries an operation you can follow with `GET /api/public/v1/projects/{project}/operations/{operation_id}`.
6. **Switch back if needed.** Send the switch again with `to` and `from` reversed. In the UI, **Operations → Cluster Endpoints** offers **Switch back** with the last origin preselected.

A switch is for one Envoy version; switch each version you serve.

## Steps: drain one upstream endpoint

1. **Create a token** with `endpoints:read` and `endpoints:write`.
2. **Preview the disable.** `POST /api/public/v1/projects/{project}/endpoints/10.0.1.5/disable` with `{"dry_run": true}` lists every place the address is used, the listeners that will be pushed, and `empty_clusters`: clusters the disable leaves with no endpoint to balance to.
3. **Disable.** Send it without `dry_run`, with a `reason` and optionally `ports` (no ports means every port of the address).
4. **Enable it again** with `POST …/endpoints/10.0.1.5/enable` after the maintenance.

The same operations are on **Operations → Endpoint Control** in the UI.

## How it works

**Switch.** Only `service_name` changes in the stored cluster; `eds_config` and every other field stay as they are, and the listener's publish history records the cluster as changed. To Envoy, a cluster whose `service_name` changed is a modified cluster: Envoy builds the new one and waits for its endpoints while the old one keeps serving, swaps them, and the old connections finish the requests they carry. Because the new cluster subscribes only to the new name, a target that is missing or holds no endpoint would leave it with zero hosts and answer `503`. Elchi therefore refuses such a switch before writing anything (`not_eds_cluster`, `no_service_name`, `target_name_mismatch`, `target_has_no_endpoints`, or `422` when the target does not exist). In Elchi's end-to-end test suite, switching blue to green and back under 20 requests per second dropped 0 requests.

**Disable.** The disable is an overlay applied when the control plane builds a snapshot: every matching `lb_endpoint`, in EDS endpoints resources and in the `load_assignment` of STATIC, STRICT_DNS and LOGICAL_DNS clusters, is served with `health_status: DRAINING`. Envoy sends a draining host no new requests, open connections end on their own, and active health checks do not bring it back. The stored resources never change, so editing and publishing them keeps the endpoint disabled. If you disable every endpoint of a cluster, Envoy enters panic mode and keeps sending traffic to them unless the cluster sets `common_lb_config.healthy_panic_threshold: 0` or `zone_aware_lb_config.fail_traffic_on_panic: true`; the preview reports which. A cluster carried in a bootstrap's `static_resources` is not reached.

Both operations refuse to run with `409 pending_unpublished_changes` when the affected listeners have saved but unpublished changes, unless you send `allow_pending_changes`.

## Related docs

- [Clusters (blue/green switch)](/automation-api/clusters) - the switch API, refusals, preview and history.
- [Endpoints (disable and enable)](/automation-api/endpoints) - the disable API, matching rules and limits.
- [Cluster Endpoints](/operations/cluster-endpoints) - the switch in the UI.
- [Endpoint Control](/operations/endpoint-control) - the disable in the UI.
- [Automation API overview](/automation-api/overview) - base URL, conventions and long-running operations.
- [API tokens](/automation-api/tokens) - scopes and revocation.
- [Errors](/automation-api/errors) - every problem+json code.

## Next steps

- **Product:** [Elchi Core](https://www.elchi.io/products/core.html) - the control plane, cluster endpoints switch and endpoint disable used in this guide.
- **Plans:** [compare plans and licensing](https://www.elchi.io/plans.html), from the free tier to enterprise.
- **Talk to us:** running this across many Envoy edges? [Book a demo](https://www.elchi.io/contact.html) with the Elchi team.
