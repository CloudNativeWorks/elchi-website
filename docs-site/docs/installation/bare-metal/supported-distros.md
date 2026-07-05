---
title: Supported distros + idempotency
description: Supported Linux distributions, why older releases are dropped, and how hash-based reconcile makes reruns idempotent.
sidebar_position: 12
---

Ubuntu 22.04 + 24.04 · Debian 12 · RHEL / Rocky / Alma / Oracle 9. amd64 only. **Debian 11 (bullseye)** and **Ubuntu 20.04 (focal)** are dropped because MongoDB 8.0 (the cluster-wide canonical default) has no apt repo for them — we deliberately don't silently fall back to an older mongo major because version drift inside a replica set kills the cluster in subtle ways. **RHEL / Rocky / Alma / Oracle 8** is dropped on a separate axis: the systemd hardening directives we use require systemd ≥ 247, which RHEL 8 ships older. The pre-flight homogeneity check also refuses mixed-major clusters upfront.

**Idempotency & reconcile** — Every setup module uses hash-based reconcile (`systemd::install_and_apply` for elchi-* units; `systemd::reconcile_external` for grafana-server / mongod / nginx). The fingerprint = sha256(unit_file ‖ EnvironmentFile contents ‖ ExecStart binary) and is persisted at `/var/lib/elchi/.unit-fingerprint/<unit>`. Decision matrix on rerun:

- Fingerprint changed + active → `restart`
- Fingerprint changed + inactive → `start`
- Fingerprint same + active → `noop` (zero downtime)
- Fingerprint same + inactive → `start` (crash recovery)

Binary downloads keep a `.prev` snapshot for rollback. `upgrade.sh` fails closed if any node fails the deep-health gate; per-binary rollback is automatic.
