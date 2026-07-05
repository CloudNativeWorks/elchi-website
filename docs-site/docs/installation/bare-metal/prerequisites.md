---
title: Prerequisites
description: OS, hardware, network, and SSH requirements for the bare-metal Elchi stack installer.
sidebar_position: 2
---

- **OS:** Ubuntu 22.04 / 24.04 · Debian 12 · RHEL / Rocky / Alma / Oracle 9 (every cluster member must run the same major + arch — the pre-flight homogeneity check refuses mixed clusters)
- **Architecture:** linux/amd64 (arm64 lands when upstream backend ships arm64 binaries)
- **Privileges:** root (script auto-bootstraps every missing tool — curl, openssl, jq, tar, gzip, awk, sed, grep, envsubst, hostname, sshpass, ssh-keygen)
- **Memory:** 4 GB recommended (soft-warn below; pass `ELCHI_REQUIRE_HEALTHY=1` to make it fatal)
- **Disk:** 5 GB free under `/var/lib` (hard-fail below)
- **Network:** outbound HTTPS to `github.com`, `raw.githubusercontent.com`, distro mirrors, Mongo + Grafana repos
- **Time sync:** systemd-timesyncd / chronyd / ntpd active (mongo replica-set election sensitivity)
- **SSH between nodes:** key auth (recommended) or password — script can mint & distribute a cluster key via `--ssh-bootstrap`

:::info[One-step mode]
Pipe the bootstrap script straight into bash. It downloads the installer payload, exec's `install.sh`, and any required CLI tool that's missing on the host gets installed automatically.
:::
