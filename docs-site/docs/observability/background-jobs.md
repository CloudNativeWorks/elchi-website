---
title: Background Jobs
description: Track asynchronous work — snapshots, WAF propagation, ACME verification, and resource upgrades — with live logs and retry.
sidebar_position: 3
---

![The background jobs view](/img/docs/jobs.png)

Long-running work runs asynchronously so the UI stays responsive. Track everything under **Jobs**, where each job carries a human-friendly ID (e.g. `EC-1`), a phase, and a live log.

| Job type | Triggered by |
| --- | --- |
| SNAPSHOT_UPDATE | Publishing resource changes to the control-plane. |
| WAF_PROPAGATION | Pushing a saved WAF configuration to proxies. |
| ACME_VERIFICATION | Certificate issuance / DNS-01 validation. |
| RESOURCE_UPGRADE | Migrating resources to a new Envoy version. |

Jobs move through `ANALYZING → PENDING → CLAIMED → RUNNING → COMPLETED/FAILED`.

## Monitoring the job system

The Jobs view surfaces the whole async subsystem, backed by these controller endpoints:

| View | What it shows |
| --- | --- |
| **Stats** (`GET /jobs/stats`) | Aggregate counts by phase — how much work is queued, running, and failed. |
| **Workers** (`GET /jobs/workers`) | The worker-pool status — how many workers are alive and what they're claiming. |
| **Stuck jobs** (`GET /jobs/stuck`) | Jobs whose heartbeat has gone stale (> 5 min) — a worker died or a step hung. |
| **Retry** (`POST /jobs/:id/retry`) | Re-run a failed (or stuck) job from the beginning. |

A healthy system shows workers alive, few or no stuck jobs, and failures clearing on retry. Persistent stuck jobs or a failing retry point at an upstream problem (control-plane unreachable, a bad config, a DNS-01 that can't validate) — open the job's live log to see the failing phase.
