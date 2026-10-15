---
title: Reports
description: Project-wide reports — problems first, then the traffic map, domains, certificates, security per filter chain, unused and broken resources, the fleet and changes — each exportable to CSV or JSON.
sidebar_position: 2.7
tags: [operations]
---

**Observability → Reports** answers questions about the whole project in one place, from the
controller's `/api/v3/reports` endpoints. Every report exports to **CSV** or **JSON** (CSV files carry
a BOM and are guarded against formula injection), and every resource name links to its resource.

The configuration and change reports are shown to project **owners and admins**; other roles see
the fleet report. When the control plane has not built any report yet, the page says so instead of
showing empty tables.

## Problems

Everything that needs a look, worst first, in one list: configuration a proxy rejected, failed or
stuck jobs, offline and outdated clients, ACME and GSLB trouble, broken references, expiring
certificates, domain conflicts and configuration hygiene (for example routes without a retry policy
or clusters without outlier detection). Each problem has a severity — critical, error, warning or
info — the resource it is about, since when it holds, and a suggested fix. Filter by severity or
kind, or search.

![Problems report — everything that needs a look, worst first](/img/docs/reports-problems-light.webp#gh-light-mode-only)
![Problems report — everything that needs a look, worst first](/img/docs/reports-problems-dark.webp#gh-dark-mode-only)

## Traffic map

Which listener serves which domain, and where each route sends it: listener → domain → route →
cluster → endpoint, with ports and TLS. Shown as a tree (**Map**) or a flat **Table**, grouped by
listener or by domain. The filters — listener, host, cluster, endpoint, port — are kept in the URL,
so a filtered view can be shared. Type a host such as `api.example.com` to see only the virtual host
that answers it.

![Traffic map report — listeners, domains, routes, clusters and endpoints](/img/docs/reports-traffic-light.webp#gh-light-mode-only)
![Traffic map report — listeners, domains, routes, clusters and endpoints](/img/docs/reports-traffic-dark.webp#gh-dark-mode-only)

## Security

Per HTTP filter chain: whether it has TLS, a WAF (elchi-shield or Coraza), a local rate limit and
authentication filters, and the certificates to renew. The counters on top show the chains without
each protection.

![Security report — TLS, WAF, rate limit and auth per filter chain](/img/docs/reports-security-light.webp#gh-light-mode-only)
![Security report — TLS, WAF, rate limit and auth per filter chain](/img/docs/reports-security-dark.webp#gh-dark-mode-only)

## Fleet

Every service of the project: where it runs, how many proxies are connected, its version, when it
last synced and its active configuration errors. Counters for live, partial, offline and not
deployed services.

![Fleet report — services, proxies, versions and configuration errors](/img/docs/reports-fleet-light.webp#gh-light-mode-only)
![Fleet report — services, proxies, versions and configuration errors](/img/docs/reports-fleet-dark.webp#gh-dark-mode-only)

## The other reports

| Report | What it lists |
|---|---|
| **Domains** | Every domain a listener serves, its TLS certificate and where it goes. Duplicate domains and wildcards that overlap other hosts are flagged. |
| **Certificates** | TLS certificates and CA bundles stored in secrets, the soonest to expire first, with the listeners and clusters that use them. Private keys are never read. |
| **Unused and broken** | Resources nothing references, and references to resources that do not exist. Defaults the platform seeds are marked as such. |
| **Changes** | The audit log of a period (7, 30 or 90 days) summarised by day, resource type and person, with the changes that failed and the most changed resources. |
