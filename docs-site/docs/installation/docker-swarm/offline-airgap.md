---
title: "Docker Swarm: Offline / Air-Gapped"
description: Install the Elchi control plane on an air-gapped host — save the image set with save-images.sh, copy the tarball, and install with --offline.
sidebar_position: 5
tags: [installation, docker]
---

The Docker Swarm installer supports a fully air-gapped install: bundle the exact image set on a machine with internet, copy the tarball across, and install with `--offline`. Nothing is pulled at deploy time.

## Step 1 — save the images (on a connected host)

`save-images.sh` pulls the pinned image set and `docker save`s it into a single tarball. It honours the same version flags as the installer, so the bundle matches your intended install exactly:

```bash
deploy/docker/save-images.sh --output=elchi-images.tar
# honours --backend-version / --ui-version / --coredns-version /
# --collector-version / --image-repo, plus --platform and --output
```

| Flag | Default | Purpose |
|---|---|---|
| `--output=<path>` | `elchi-images.tar` | Output tarball path. |
| `--platform=<os/arch>` | `linux/amd64` | Target platform for the pulled images. |
| `--backend-version=<csv>` | from `versions.env` | Backend variant tag(s) to include. |
| `--ui-version=<tag>` | from `versions.env` | UI image tag. |
| `--coredns-version=<tag>` | from `versions.env` | CoreDNS image tag. |
| `--collector-version=<tag>` | from `versions.env` | Collector image tag. |
| `--image-repo=<repo>` | `jhonbrownn` | Elchi image namespace / registry. |
| `--no-collector` | collector on | Omit the collector + ClickHouse images from the bundle. |
| `--no-gslb` | GSLB on | Omit the CoreDNS image from the bundle. |

The script lists every image it wrote so you can verify the set before transferring.

## Step 2 — copy the tarball

Move `elchi-images.tar` to the air-gapped host by whatever channel you use (USB, internal file share, `scp` over the isolated network, …).

## Step 3 — install with `--offline`

Point the installer at the tarball:

```bash
sudo deploy/docker/install.sh --main-address=10.0.0.5 --offline=elchi-images.tar
```

`--offline` runs `docker load -i <tarball>` first and then deploys with `--resolve-image=never`, so Docker never reaches out to a registry.

## Multi-node air-gapped installs

`--offline` `docker load`s **only on the node it runs on**. For a multi-node air-gapped cluster you have two options:

1. **Load on every node** — copy the tarball to each node and `docker load -i elchi-images.tar` there (or let the tarball ride along and load it before the workers pull), then run the installer normally; or
2. **Run a local registry** — stand up a throwaway `registry:2`, `docker load` the bundle and push the images to it, and set `--image-repo=<registry>:<port>` so every node pulls from your local mirror.

See [High Availability](/installation/docker-swarm/high-availability) for the multi-node model.
