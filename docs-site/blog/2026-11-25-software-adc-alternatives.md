---
slug: software-adc-alternatives
title: "Software ADC Alternatives to F5, NetScaler and A10"
description: "Replacing F5 BIG-IP, NetScaler or A10 Thunder with a software ADC: a capability map, the vendor landscape, where Elchi fits and an evaluation checklist."
authors: [safa]
tags: [load-balancing, envoy, waf]
date: 2026-11-25
image: /img/og/blog-software-adc-alternatives.png
---

A software ADC (application delivery controller) provides what a hardware ADC does (virtual IPs with failover, L4 and L7 load balancing, health monitoring, TLS termination, a web application firewall and global server load balancing) as software that runs on standard servers, virtual machines, cloud instances or containers. Replacing F5 BIG-IP, NetScaler or A10 Thunder with one means mapping every function you use today to its software equivalent, then checking how the new platform is managed, automated and licensed.

This guide is for network, infrastructure and platform teams that run hardware or virtual ADCs and are weighing what comes next. We build Elchi, one of the options, so we say plainly where it fits and where it does not. Every statement about another vendor links to that vendor's own page.

<!-- truncate -->

## Why teams move off hardware ADCs

There is rarely one reason. In practice, four things put the question on the table.

**A hardware refresh forces a decision.** Appliances have end-of-sale dates. F5, for example, ended sales of VIPRION B2000 blades in April 2023 and names VELOS as the successor ([F5](https://www.f5.com/company/events/webinars/say-goodbye-to-viprion-hello-to-velos)). At refresh time, a like-for-like box gets compared with software that runs on servers you already buy.

**Vendors have changed their own licensing and product models.** NetScaler ended sales of perpetual licenses for MPX and SDX hardware and VPX and BLX software on 5 March 2023 and made subscriptions the preferred way to buy ([Citrix notice CTX476864](https://support.citrix.com/external/article/CTX476864/notice-of-change-announcement-for-netsca.html)). Broadcom changed the built-in NSX Load Balancer entitlement from VCF 9.0 and advises customers who need advanced load balancing to buy VMware Avi Load Balancer ([Broadcom KB 439411](https://knowledge.broadcom.com/external/article/439411)). In August 2025, F5 announced it is modernizing BIG-IP TMOS and discontinuing BIG-IP Next, except BIG-IP Next for Kubernetes and Cloud-Native Network Functions ([F5 community](https://community.f5.com/discussions/technicalforum/strategic-update-from-myf5-modernizing-big-ip-tmos-and-discontinuing-big-ip-next/342998)). None of these forces a migration, but each one starts a re-evaluation.

**Configuration is expected to be automated.** The incumbents all ship automation today: F5 has the declarative AS3 toolchain and a Terraform provider ([F5](https://clouddocs.f5.com/products/orchestration/terraform/latest/)), NetScaler has the NITRO REST API, Terraform and Ansible ([NetScaler](https://docs.citrix.com/en-us/citrix-adc/13-1/deploying-vpx/citrix-adc-automation)), and A10 has aXAPI with Terraform and Ansible ([A10](https://www.a10networks.com/products/thunder-adc)). So the question is no longer whether an API exists. It is whether a change is validated, reviewed and audited before it reaches traffic, and whether it can be rolled back.

**Applications have spread out.** Services now live on VMs at several sites, in Kubernetes and in public clouds. A central appliance pair in one data center either becomes a hairpin or one more thing to integrate. The vendors' own response is virtual and container editions plus Kubernetes connectors: F5 Container Ingress Services, the NetScaler Ingress Controller, A10's Thunder Kubernetes Connector. Software ADCs go further: they put a proxy next to the application and manage the whole fleet from one place.

## ADC capabilities and their software equivalents

Use this table to inventory what you actually run before you look at products. Most migrations stall on the one feature nobody listed.

| ADC function | On a hardware ADC | Software equivalent | What to check |
|---|---|---|---|
| **VIP and HA** | Active/standby pair, floating IPs, connection mirroring | Two or more software instances sharing a VIP via ARP (VRRP or similar) or BGP/ECMP | Failover time measured under load; split-brain behaviour; whether a control-plane outage can move a VIP |
| **L4 load balancing** | Virtual servers, pools, persistence | TCP/UDP proxy listeners and upstream clusters | Algorithms you use (least connections, hashing); source-IP preservation |
| **L7 load balancing** | HTTP profiles, content switching | HTTP routing on host, path, header; retries, timeouts | HTTP/2 and gRPC, header rewrites, redirects |
| **Health monitors** | Built-in and custom monitors | Active health checks (HTTP, TCP, gRPC) plus passive outlier detection | Custom monitor logic you rely on today |
| **TLS offload and certificates** | SSL profiles, often hardware acceleration and HSMs | Software TLS termination, secret distribution, ACME automation | Certificate lifecycle; FIPS or HSM requirements |
| **WAF** | Add-on module or built-in firewall | WAF engine in or next to the proxy, often the OWASP Core Rule Set | Detect-before-block rollout; per-application tuning; false-positive workflow |
| **GSLB** | DNS module answering for wide IPs | Authoritative DNS driven by health checks | Health probe types; regional answers; failover when all targets are down |
| **Programmability** | iRules, aFleX, AppExpert policies | Declarative routing plus filters (Lua, WebAssembly, external processing) | Which scripts must be rewritten, and who owns them |
| **Central management** | BIG-IQ, NetScaler Console, A10 Control | A control plane that pushes config to every instance | RBAC, directory login, audit trail, staged publish, version skew |
| **Observability** | Device stats, logs, analytics module | Metrics and access logs into your own stack | Per-route latency and error rates; SIEM forwarding |

The scripting row deserves its own line in your plan. F5 iRules are event-driven Tcl ([F5 clouddocs](https://clouddocs.f5.com/api/irules/WhatIsAnIRule.html)), A10 aFleX is based on Tcl as well ([A10](https://www.a10networks.com/resources/glossary/aflex)), and NetScaler AppExpert uses its own policy and expression language ([NetScaler docs](https://docs.netscaler.com/en-us/citrix-adc/current-release/appexpert)). No tool converts these perfectly into another product. Vendor migration tools exist, but they convert only part of the logic, so plan to re-implement scripts as declarative routes, filters or WAF rules.

## The software ADC landscape

These are the options buyers most often shortlist. Each description restates the vendor's own material.

**The incumbents' virtual editions.** You can stay with your current vendor in software. F5 offers BIG-IP Virtual Edition for clouds and hypervisors and a Cloud-Native Edition for Kubernetes ([F5](https://www.f5.com/products/big-ip)). NetScaler offers VPX (virtual machine), BLX (bare-metal Linux) and CPX (container) on the same operating system as its hardware ([NetScaler](https://docs.netscaler.com/en-us/citrix-adc/netscaler-form-factors)). A10 runs Thunder ADC on hardware, virtual, cloud, bare-metal and container form factors ([A10](https://www.a10networks.com/products/thunder-adc)). This keeps your configuration and skills but not much else changes: the licensing model and management tooling stay the same.

**HAProxy Enterprise and HAProxy Fusion.** HAProxy Enterprise ships as a software load balancer, a virtual appliance or a hardware appliance. It includes a WAF built on HAProxy's own Intelligent WAF Engine and GSLB as an authoritative DNS server ([HAProxy](https://www.haproxy.com/products/haproxy-enterprise)). HAProxy Fusion is the self-hosted control plane with a single API and UI ([HAProxy](https://www.haproxy.com/products/haproxy-fusion-control-plane)). Active/standby HA uses VRRP through a Keepalived wrapper ([HAProxy docs](https://www.haproxy.com/documentation/haproxy-enterprise/administration/high-availability/active-standby/)).

**VMware Avi Load Balancer.** Avi pairs a central controller with Service Engines as the data plane ([VMware docs](https://docs.vmware.com/en/VMware-Avi-Load-Balancer/30.2/Installation-Guide/GUID-43BF1223-E77B-4379-BBCB-8E6BD91ABF63.html)). It includes a WAF and GSLB and integrates with VMware Cloud Foundation and Kubernetes ingress ([VMware](https://www.vmware.com/products/cloud-infrastructure/avi-load-balancer)). It is licensed as subscription software metered in Service Units ([Broadcom program documentation](https://ftpdocs.broadcom.com/cadocs/0/VMware_Avi_Load_Balancer_Specific_Program_Documentation_2026_08_13.pdf)).

**F5 NGINX Plus (NGINX One, now F5 NGINX Enterprise).** F5's software line bundles the NGINX Plus data plane, the NGINX Ingress Controller and Gateway Fabric, F5 WAF for NGINX and a central console ([F5](https://www.f5.com/products/nginx/one)). NGINX publishes its own guide for moving BIG-IP configuration to NGINX Plus ([NGINX docs](https://docs.nginx.com/nginx/deployment-guides/migrate-hardware-adc/f5-big-ip-configuration/)).

**Progress Kemp LoadMaster.** LoadMaster runs as hardware, virtual, cloud and bare metal, with central management in Kemp 360 Central or the SaaS LoadMaster 360 ([Progress](https://docs.progress.com/bundle/loadmaster-360/page/Learn-about-LoadMaster-360.html)). Its WAF uses OWASP Core Rule Set rules ([Progress](https://docs.progress.com/bundle/loadmaster-technical-note-owasp-standard-rules-ga/page/OWASP-Standard-Rules.html)). Kemp is deprecating the clustering feature and recommends HA pairs ([Kemp](https://kemptechnologies.com/blog/loadmaster--clustering--feature-being-deprecated-in-july-2026)).

**Other virtual ADCs.** Fortinet FortiADC (appliance, VM and cloud, with FortiADC Manager, a WAF and GSLB) suits teams already on the Fortinet Security Fabric ([Fortinet datasheet](https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/FortiADC.pdf)). Radware Alteon shares one throughput license across physical and virtual instances ([Radware](https://www.radware.com/products/alteon-gel/)). Loadbalancer.org includes a WAF and GSLB as standard on hardware, virtual and cloud appliances ([Loadbalancer.org datasheet](https://pdfs.loadbalancer.org/datasheets/enterprise-family-datasheet-loadbalancer.pdf)).

**Envoy-based enterprise gateways.** Tetrate Enterprise Gateway is an enterprise support and enablement offering for Envoy Gateway, configured through Kubernetes Gateway API resources ([Tetrate docs](https://docs.tetrate.io/envoy-gateway/introduction/intro)). Solo Enterprise for kgateway, formerly Gloo Gateway, adds enterprise features such as a Coraza WAF to kgateway ([Solo.io docs](https://docs.solo.io/kgateway/2.2.x/security/waf/overview/)). Both are built for Kubernetes clusters, so they replace an ingress tier rather than an ADC that fronts VMs.

**API gateways.** Kong Gateway runs on Linux hosts, Docker and Kubernetes, with Konnect as a hosted control plane for self-managed data planes ([Kong](https://developer.konghq.com/gateway/hybrid-mode/)). Kong relies on plugins and partner WAFs rather than a native WAF engine ([Kong](https://developer.konghq.com/waf/)). Traefik Hub is a Kubernetes-native API gateway that includes a Coraza WAF and can also run as a Linux service ([Traefik](https://traefik.io/traefik-hub)). Both target API management more than VIP and failover work.

## Where Elchi fits

Elchi is a commercially licensed platform for running a fleet of software load balancers from one control plane. The data plane is Envoy, the CNCF proxy, deployed on your Linux hosts or on Elchi's own appliance OS. Elchi supplies everything an ADC team expects around it. Here is the same capability map, answered with what the [Elchi docs](/getting-started/introduction) describe.

**VIPs and HA.** Two [Elchi OS](/elchi-os/overview) appliances form an [HA pair](/ha-pairs/overview) that shares virtual IPs active/passive, on a plain Layer 2 network with gratuitous ARP or with BGP. The members elect the active one themselves, so a control-plane outage never moves a VIP. Measured with continuous traffic, a planned failover takes about 50 ms and loses at most one request. When the active member is powered off, the standby takes over in about 2 seconds. BGP and BFD are configured per edge node from the UI through FRR ([Client network and BGP](/operations/network-and-bgp)).

**Appliance form factor.** Elchi OS is a hardened Debian 13 image delivered as ISO, OVA and qcow2 for bare metal, VMware, KVM, Proxmox and OpenStack. It has A/B root slots and automatic rollback for [upgrades](/elchi-os/upgrades), plus a management console instead of a Linux shell. If you would rather use your own hosts, the [Elchi Client](/installation/client/overview) agent installs on Ubuntu 24.04.

**L4 and L7 load balancing and health checks.** Listeners carry TCP proxy, UDP proxy and HTTP filter chains ([Filters](/envoy-configuration/resources/filters)). Upstream [clusters](/envoy-configuration/resources/clusters) offer round-robin, least-request, ring-hash and Maglev balancing, active HTTP, gRPC and TCP health checks, outlier detection and circuit breakers. [Endpoint Control](/operations/endpoint-control) takes a server out of rotation everywhere it is used in one action, like disabling a pool member on an ADC.

**TLS and certificates.** Certificates reach the proxies as secrets over SDS. Elchi issues and renews them automatically through [ACME DNS-01](/traffic-and-certificates/acme/overview) with Let's Encrypt, Google Trust Services, ZeroSSL or Buypass, including wildcard certificates.

**WAF.** Elchi's WAF is the [Coraza engine in Shield](/shield/engines/coraza-waf), with the OWASP Core Rule Set embedded in the binary. Shield runs next to Envoy on each edge host, and you can roll out per host and per route from detect to shadow to block. The same policy can also run [JWT, mTLS, rate limiting, bot detection and OpenAPI validation](/shield/overview).

**GSLB.** [Elchi GSLB](/gslb/overview) is authoritative DNS served by a CoreDNS plugin. Distributed HTTP, HTTPS and TCP probes decide which IPs appear in each answer, with region tags and a failover zone. An HA pair's VIP is one GSLB entry, so failovers do not touch DNS.

**Programmability.** Routes, header rewrites and retries are declarative. When that is not enough, the filter catalog includes Lua, WebAssembly, ext_authz and ext_proc. The versioned [automation API](/automation-api/overview) disables endpoints and switches EDS clusters for [blue/green releases](/guides/blue-green-envoy-eds) from pipelines.

**Central management.** One control plane manages every edge node, and several controllers can run together for [management-plane HA](/administration/registry-and-ha). Access control has Owner, Admin, Editor and Viewer roles, per-project isolation, LDAP/AD login and TOTP ([Authentication and access](/administration/auth-and-access)). Every change is recorded in an [audit log that can be forwarded to a SIEM](/observability/audit-and-syslog). Several Envoy versions run side by side, and listeners move to a new version by hot restart without dropping traffic ([Versions and upgrades](/envoy-configuration/versions-and-upgrades)).

**Observability.** Envoy and Shield metrics flow over OTLP into VictoriaMetrics and Grafana and appear in built-in dashboards ([Metrics and logs](/observability/metrics-and-logs)). A [live traffic view](/observability/live-traffic) shows a listener's requests moving through routes and clusters.

**Licensing.** Elchi is not open source. [Licensing](/administration/licensing) counts managed edge nodes. Elchi Core is the base product, and API Security (Shield with the WAF), API Discovery and GSLB are add-ons. Without a license it runs a free tier with one managed node, which is enough to evaluate. The control plane installs with [Helm](/installation/helm-platform/overview), on [Docker Swarm](/installation/docker-swarm/overview) (including air-gapped) or [on bare-metal VMs](/installation/bare-metal/overview).

For side-by-side detail, see [Elchi vs F5 BIG-IP](https://www.elchi.io/compare/f5-big-ip.html), [Elchi vs NetScaler](https://www.elchi.io/compare/netscaler.html) and [Elchi vs A10 Thunder](https://www.elchi.io/compare/a10-thunder.html), or the [comparison hub](https://www.elchi.io/compare.html).

## When a hardware ADC is still the right choice

Software is not always the better answer. Keep the appliance, or a virtual edition from the same vendor, if any of these describe you:

- **You need hardware cryptography.** Some ADC models have dedicated TLS acceleration or integrated FIPS-validated HSMs; F5's r5920-DF and r10920-DF, for example, carry an integrated HSM validated to FIPS 140-3 Level 3 ([F5 certifications](https://www.f5.com/company/certifications)). If a regulation requires a validated module, check each software option's certificates before anything else. Elchi's documentation does not list a FIPS validation or HSM integration today.
- **Your logic lives in scripts.** Hundreds of iRules, aFleX scripts or AppExpert policies are a real asset. Rewriting them is a project of its own, and the business case has to include it.
- **You use functions beyond load balancing.** Remote access gateways, access policy management, DDoS scrubbing and carrier-grade NAT are separate products. A software load balancer does not replace them.
- **Nobody will own the platform.** A software ADC fleet needs a team that runs Linux hosts or appliances, upgrades them and monitors them. If that capacity does not exist, a managed appliance may cost less overall.
- **The contract is the constraint.** If your current agreement runs for several more years, a staged move (new applications first) is usually better than a big-bang replacement.

## Evaluation checklist

Score each candidate against your inventory, not a vendor's feature list:

1. **Inventory.** List every virtual server, pool, monitor, profile, certificate, WAF policy, GSLB name and script in use today. Mark which ones are actually used.
2. **HA under failure.** Power off the active node under continuous traffic. Measure lost requests, takeover time and what happens when the heartbeat link fails but the data plane is up.
3. **Control-plane loss.** Stop the management plane. Traffic and failover should continue unaffected.
4. **Change safety.** Check whether a broken change is rejected before it reaches traffic, whether changes can be staged and published, and whether every change is attributed in an audit log.
5. **WAF rollout.** Run the WAF in detect mode on real traffic, tune false positives per application, then block. Check where blocked-request events go.
6. **Certificates.** Test automated issuance and renewal for your CA and DNS provider, wildcard names and internal names.
7. **GSLB.** Fail every target behind a name and see what DNS answers. Test regional answers if you use them.
8. **Upgrades.** Upgrade the proxy and the platform under load. Measure dropped requests and check for a rollback path.
9. **Automation.** Drive the main day-two tasks (draining a server, a blue/green switch, adding a route) from a pipeline with a scoped token.
10. **Placement.** Confirm the data plane runs where your applications are: bare metal, your hypervisor, the cloud, Kubernetes.
11. **Licensing model.** Find out what is counted (nodes, cores, throughput, requests), what happens at the limit, and whether a license check failure stops traffic.
12. **Gaps.** Write down every function you will lose or move to another product, and who owns each one.

## FAQ

### What is a software ADC?

A software ADC delivers application delivery controller functions, such as load balancing, TLS termination, WAF and GSLB, as software on commodity servers, VMs, cloud instances or containers instead of on dedicated hardware. Most also include a central control plane that manages many instances at once.

### Can a software ADC replace F5 BIG-IP?

For load balancing, TLS, WAF and GSLB, usually yes, if the candidate covers your inventory and passes failure tests. The hard parts are scripts such as iRules, hardware cryptography requirements and modules beyond load balancing, such as access management. Plan for those explicitly.

### Do software ADCs include a WAF?

Most do. HAProxy Enterprise has its own WAF engine, Avi includes a WAF, Kemp and Loadbalancer.org use OWASP Core Rule Set rules, and Elchi runs the OWASP Core Rule Set in Shield's Coraza engine. What differs is the rollout workflow: detect-only modes, per-route tuning and where events land.

### How does HA work without hardware?

Two or more instances share a virtual IP. One holds it and announces it with gratuitous ARP (VRRP-style) or BGP. When it fails, the peer takes the address over. With Elchi, two [Elchi OS](/elchi-os/overview) appliances form an [active/passive pair](/ha-pairs/overview) that does this on ARP or BGP and keeps working when the control plane is down.

### Is Elchi open source?

No. Elchi is an enterprise product under a commercial license, counted by managed edge nodes. A free tier with one managed node is available for evaluation ([Licensing](/administration/licensing)). The proxy it runs, Envoy, is an open-source CNCF project.

### Does Elchi require Kubernetes?

No. The edge runs on Elchi OS appliances or on Ubuntu hosts with the Elchi agent. The control plane installs on Kubernetes with Helm, on Docker Swarm or as systemd services on plain VMs ([Installation](/installation/bare-metal/overview)).

## Next steps

- Read the [HA pairs overview](/ha-pairs/overview) and [Elchi OS overview](/elchi-os/overview) for the appliance model.
- Compare Elchi with [F5 BIG-IP](https://www.elchi.io/compare/f5-big-ip.html), [NetScaler](https://www.elchi.io/compare/netscaler.html) and [A10 Thunder](https://www.elchi.io/compare/a10-thunder.html), or browse the [comparison hub](https://www.elchi.io/compare.html).
- [Book a demo](https://www.elchi.io/contact.html) or start with the [quick start](/getting-started/quickstart) on the free tier.
