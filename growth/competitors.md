# Competitors: who Elchi meets when a buyer replaces or avoids a hardware ADC

Internal research, not published. Checked 2026-11-25 against vendor pages, vendor docs and datasheets (URLs inline). No prices anywhere in this file. "UNVERIFIED" = no vendor or reputable source confirmed it; do not use those points in public copy.

Positioning assumed: Elchi is an enterprise, commercially licensed (not open source) platform positioned as an alternative to hardware, virtual and software ADCs. Envoy is the engine under the hood, not the headline. Istio is not a direct competitor; go-control-plane is a library Elchi uses, never a competitor.

## Summary table

| Product | Category | Threat to Elchi | Why, in one line |
|---|---|---|---|
| F5 BIG-IP (hardware, VE) | Hardware + virtual ADC | **High** | The incumbent most buyers are replacing; same network-team buyer, same VIP/HA/WAF/GSLB checklist. |
| F5 NGINX Plus / NGINX Enterprise (formerly NGINX One) | Software LB / API gateway | **Medium** | F5's own software answer, with a central console and WAF; sells to platform teams more than network teams. |
| NetScaler (MPX/SDX, VPX, BLX, CPX) | Hardware + virtual ADC | **High** | Second incumbent; licensing changes push customers to re-evaluate. |
| A10 Thunder / vThunder / cThunder | Hardware + virtual ADC | **High** | Third incumbent; common in service providers; FlexPool software licensing. |
| HAProxy Enterprise + HAProxy Fusion (+ ALOHA) | Software LB + control plane | **High** | The software alternative named most often against F5, NetScaler and Avi; runs on VMs/bare metal, has WAF, GSLB, VRRP HA and a central control plane. |
| VMware Avi Load Balancer (Broadcom) | Software ADC (controller + service engines) | **High** | Closest architecture to Elchi (central controller, distributed data plane, WAF, GSLB); also a demand source as Broadcom changes licensing. |
| Progress Kemp LoadMaster | Hardware + virtual ADC | **Medium** | Mid-market virtual ADC with aggressive "migrate from F5/NetScaler/Avi" campaigns. |
| Fortinet FortiADC | Hardware + virtual ADC | **Medium-Low** | Wins inside Fortinet Security Fabric accounts; same feature checklist. |
| Radware Alteon | Hardware + virtual ADC | **Medium-Low** | Large enterprise/carrier accounts bundling Radware security (AppWall, DefensePro). |
| Loadbalancer.org | Hardware + virtual ADC | **Medium-Low** | Mid-market, "WAF and GSLB as standard", explicitly targets F5 refresh; no Kubernetes controller. |
| Array Networks APV / vAPV / AVX | Hardware + virtual ADC | **Low** | Price-sensitive and regional (Asia); rarely on the same shortlist. |
| Kong Konnect / Kong Gateway Enterprise | API gateway (hybrid CP/DP) | **Low-Medium** | Runs on VMs with a central control plane, but sold as API management to API teams; no native WAF engine. Compare page already exists. |
| Tetrate Enterprise Gateway for Envoy (TEG) | Envoy-based enterprise gateway | **Low-Medium** | The other "enterprise Envoy" offer, but Kubernetes-only in practice. |
| Solo Enterprise for kgateway (formerly Gloo Gateway) | Envoy-based enterprise gateway | **Low** | Kubernetes-only, platform-team buyer. kgateway compare page exists. |
| Traefik Hub (Traefik Enterprise upgraded to Hub) | API gateway / ingress | **Low** | Kubernetes-first API gateway for DevOps; can run on a Linux host but has no ADC-style HA/GSLB story. |
| Edgenexus (Total Uptime) | Virtual/physical ADC | **Low** | Small vendor, ADC-as-a-Service angle. |
| Cloud LBs (AWS ALB, Cloudflare Load Balancing) | Managed cloud service | **Low (adjacent)** | The answer when workloads leave the data center; not an on-prem ADC replacement. |

## Vendor notes

### F5 BIG-IP (hardware, Virtual Edition) — High
- Form factors: FPGA-accelerated hardware, BIG-IP Virtual Edition for public/private cloud and hypervisors, and a Cloud-Native Edition for Kubernetes. https://www.f5.com/products/big-ip
- Hardware generations: VIPRION B2000 blades end of sale April 2023, VELOS is the successor; rSeries replaces iSeries. https://www.f5.com/company/events/webinars/say-goodbye-to-viprion-hello-to-velos (iSeries EoSD dates: UNVERIFIED)
- Central management: BIG-IQ Centralized Management. https://www.f5.com/products/big-ip
- **BIG-IP Next discontinued** (2025-08-13): "Modernizing BIG-IP TMOS and discontinuing BIG-IP Next"; "does not impact BIG-IP Next for Kubernetes or BIG-IP Next Cloud-Native Network Functions." https://community.f5.com/discussions/technicalforum/strategic-update-from-myf5-modernizing-big-ip-tmos-and-discontinuing-big-ip-next/342998 (full notice K000152956 is login-only)
- F5 Distributed Cloud: Customer Edge software managed from a SaaS control plane (WAF, API security, bot, DDoS, DNS LB). https://www.f5.com/products/distributed-cloud-services
- WAF: F5 WAF for BIG-IP (formerly Advanced WAF), add-on module. GSLB: BIG-IP DNS module. https://www.f5.com/products/big-ip
- HA: Device Service Clustering, Sync-Failover device groups, traffic groups, active-standby or active-active, floating addresses, connection mirroring. https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/big-ip-device-service-clustering-administration-14-1-0/10.html
- Automation: AS3 (declarative), Declarative Onboarding, Telemetry Streaming; Terraform provider. https://www.f5.com/products/automation-and-orchestration , https://clouddocs.f5.com/products/orchestration/terraform/latest/BIG-IP/index-bigip.html
- Kubernetes: Container Ingress Services (Ingress, Routes, CRDs, IngressLink). https://clouddocs.f5.com/containers/latest/
- Licensing: subscriptions, perpetual, Flex Consumption Program (site navigation). https://www.f5.com/products/big-ip
- FIPS/HSM: r5920-DF / r10920-DF integrated HSM (FIPS 140-3 L3). https://www.f5.com/company/certifications
- Buyer: network/infrastructure teams (inference).
- Market event (vendor-disclosed): F5 disclosed on 2025-10-15 that a nation-state actor accessed its systems and took BIG-IP source code and undisclosed-vulnerability data; CISA ED 26-01. https://www.helpnetsecurity.com/2025/10/15/f5-big-ip-data-breach/ , https://www.fedramp.gov/2025-10-15-responding-to-cisa-emergency-directive-26-01/ — **do not use in marketing copy** (FUD risk); context only.

### F5 NGINX Plus / NGINX Enterprise — Medium
- NGINX One launched 2024-09-17 as a package of NGINX Plus, App Protect, Kubernetes tooling and management. https://www.f5.com/company/news/press-releases/nginx-one-app-security-delivery
- The same product URL is now branded "F5 NGINX Enterprise" (data plane, Ingress Controller, Gateway Fabric, F5 WAF/DoS for NGINX, Console incl. a Local Edition). https://www.f5.com/products/nginx/one (date of rename: UNVERIFIED)
- NGINX One Console manages NGINX Plus/OSS instances, Ingress Controller, Gateway Fabric and F5 WAF policies. https://docs.nginx.com/nginx-one-console/
- WAF: NGINX App Protect WAF renamed "F5 WAF for NGINX". https://docs.nginx.com/nginx-one-console/waf-integration/overview/
- NGINX publishes a BIG-IP → NGINX Plus migration guide. https://docs.nginx.com/nginx/deployment-guides/migrate-hardware-adc/f5-big-ip-configuration/
- Buyer: platform/DevOps (inference). GSLB: none native (UNVERIFIED).

### NetScaler — High
- Form factors: MPX (hardware), SDX (multi-tenant hardware), VPX (VM, also public cloud), BLX (bare-metal Linux), CPX (container); one OS across all. https://docs.netscaler.com/en-us/citrix-adc/netscaler-form-factors
- Rebranded from "Citrix ADC" back to NetScaler (2022-10-03). https://www.netscaler.com/blog/news/netscaler-is-back
- Central management: NetScaler Console (formerly ADM), as a cloud service or on-prem. https://docs.netscaler.com/en-us/netscaler-console-service/manage-licenses/legacy-license/pooled-capacity
- WAF: NetScaler Web App Firewall, built in (own engine). GSLB: yes. https://docs.netscaler.com/en-us/citrix-adc/current-release/global-server-load-balancing
- HA: HA pair or cluster up to 32 nodes. https://docs.netscaler.com/en-us/citrix-adc/current-release/clustering.html
- Automation: NITRO REST API, Terraform, Ansible. https://docs.citrix.com/en-us/citrix-adc/13-1/deploying-vpx/citrix-adc-automation
- Kubernetes: NetScaler Ingress Controller (CPX/VPX/MPX). https://docs.netscaler.com/en-us/netscaler-k8s-ingress-controller/deploy/multicluster-ingress.html
- **Licensing changes (vendor-announced):** perpetual MPX/SDX hardware and VPX/BLX software end of sale 2023-03-05; "subscription licenses ... will be the preferred way". https://support.citrix.com/external/article/CTX476864/notice-of-change-announcement-for-netsca.html . Pooled capacity listed as "legacy"; file-based licensing EOL 2026-04-15, License Activation Service only. https://docs.netscaler.com/en-us/netscaler-console-service/manage-licenses/legacy-license/pooled-capacity . License telemetry: https://support.citrix.com/external/article/CTX477614/citrix-license-telemetry-faq.html
- FIPS: MPX 9230 FIPS (FIPS 140-3 L2), VPX FIPS model. https://www.netscaler.com/content/dam/netscaler/documents/data-sheet/netscaler-data-sheet.pdf

### A10 Thunder ADC / vThunder / cThunder — High
- Form factors: "hardware, virtual, cloud, bare metal and container". https://www.a10networks.com/products/thunder-adc
- Central management: A10 Control, which consolidates Harmony Controller and aGalaxy. https://www.a10networks.com/products/thunder-adc
- WAF: "A10 Next-Gen WAF, powered by Fastly" (datasheet); GSLB included; DNS application firewall. https://www.a10networks.com/wp-content/uploads/A10-DS-Thunder-ADC.pdf
- HA: VRRP-A (A10's own protocol) and aVCS virtual chassis. https://documentation.a10networks.com/ACOS/703x/ACOS_7.0.3/pdf/VRRP-A_High_Availability.pdf
- Automation: aXAPI REST (100% coverage), Terraform, Ansible. Kubernetes: Thunder Kubernetes Connector. https://www.a10networks.com/products/thunder-adc
- Licensing: FlexPool (Capacity and Instance) subscription pools; modular capacity licenses on hardware. https://a10networks.com/how-to-buy/flexpool-licensing/
- FIPS: dedicated FIPS 140-2 L2 models; hardware SSL acceleration. Datasheet above.
- Buyer: "From SMBs and large enterprises to service providers and cloud operators." Datasheet.

### HAProxy Enterprise / HAProxy Fusion / HAProxy ALOHA — High
- Form factors: "software load balancer, virtual appliance, or within rack-mounted hardware appliances". https://www.haproxy.com/products/haproxy-enterprise ; ALOHA hardware + virtual. https://www.haproxy.com/products/haproxy-aloha
- Central management: HAProxy Fusion Control Plane, self-hosted, single API + UI, RBAC, service discovery; HA multi-server and air-gapped modes. https://www.haproxy.com/products/haproxy-fusion-control-plane ; Fusion 2.0 adds K8s operator, Terraform, Ansible. https://www.haproxy.com/blog/announcing-haproxy-fusion-2-0
- WAF: Intelligent WAF Engine (own engine, not ModSecurity). GSLB: HAProxy Enterprise as authoritative DNS. FIPS-ready builds. https://www.haproxy.com/products/haproxy-enterprise
- HA: VRRP active/standby via a Keepalived wrapper (needs multicast); active/active documented. https://www.haproxy.com/documentation/haproxy-enterprise/administration/high-availability/active-standby/
- Kubernetes: ingress controller, external LB for on-prem K8s; HAProxy Unified Gateway (free, Gateway API). https://www.haproxy.com/documentation/haproxy-unified-gateway/overview/
- Licensing: annual subscription, single support level. https://www.haproxy.com/assets/legal/subscription_agreement.pdf , https://www.haproxy.com/support/support-options
- Runs dedicated migration pages: https://haproxy.com/migrate-from-f5 , https://haproxy.com/migrate-from-avi-networks , NetScaler guide https://cdn.haproxy.com/content-library/guides/citrix-netscaler-alternative
- Why High: same buyer, same "software replaces hardware" pitch, VM/bare-metal first, WAF+GSLB+central control plane; the alternative most review sites list for F5.

### VMware Avi Load Balancer (Broadcom) — High
- Architecture: Controller (single node or 3-node cluster) + Service Engines. https://docs.vmware.com/en/VMware-Avi-Load-Balancer/30.2/Installation-Guide/GUID-43BF1223-E77B-4379-BBCB-8E6BD91ABF63.html
- WAF included; GSLB with automated leader election; Kubernetes ingress via VKS on VCF, Gateway API. https://www.vmware.com/products/cloud-infrastructure/avi-load-balancer ; WAF CRS "based on the OWASP ModSecurity CRS with heavy modifications". https://avinetworks.com/docs/waf-crs/release-notes
- HA: Service Engine Elastic HA N+M (default), active/active, legacy active/standby. https://docs.vmware.com/en/VMware-Avi-Load-Balancer/30.2/Configuration-Guide/GUID-D155D842-57E9-4FB7-BE02-C12792AC3D5D.html
- Automation: Terraform vmware/avi, Ansible vmware.alb. https://www.github.com/vmware/terraform-provider-avi
- **Licensing (vendor docs):** subscription software metered in Service Units (1 SU = 1 core in virtual environments), can be a VCF add-on. https://ftpdocs.broadcom.com/cadocs/0/VMware_Avi_Load_Balancer_Specific_Program_Documentation_2026_08_13.pdf . From VCF 9.0 the built-in NSX Load Balancer entitlement changed; Broadcom advises buying Avi; NSX LB usable until 2027-05-30 with equivalent Avi licenses. https://knowledge.broadcom.com/external/article/439411
- Why High: closest architectural match (central controller, distributed data plane, WAF, GSLB), and Broadcom-driven re-evaluation is the most event-driven demand in this market.

### Progress Kemp LoadMaster — Medium
- Hardware, virtual, cloud, bare metal. https://www.kemptechnologies.com
- Central management: Kemp 360 Central (on-prem), LoadMaster 360 (SaaS). https://docs.progress.com/bundle/loadmaster-360/page/Learn-about-LoadMaster-360.html
- WAF: OWASP CRS WAF (LMOS 7.2.54.0+); WAF and GSLB in the Enterprise Plus tier. https://docs.progress.com/bundle/loadmaster-technical-note-owasp-standard-rules-ga/page/OWASP-Standard-Rules.html
- HA: active/passive pair; **clustering feature deprecated July 2026**. https://kemptechnologies.com/blog/loadmaster--clustering--feature-being-deprecated-in-july-2026
- Automation: REST API, Ansible (Terraform UNVERIFIED). Kubernetes: LoadMaster Ingress Controller running on the LoadMaster.
- Licensing: perpetual, subscription, pooled, metered, PAYG, SPLA. https://kemptechnologies.com/pricing/licensing-models
- FIPS: 140-2 L1 certificates going historical 2026-09-22, 140-3 "planned". https://kemptechnologies.com/de/industry/government/fips
- Migration campaigns: F5 iRules migration tool (beta) https://kemptechnologies.com/devops/f5-big-ip-irules-migration-to-kemp-tool ; Avi replacement https://kemptechnologies.com/blog/progress-kemp-loadmaster-replacement-for-avi

### Fortinet FortiADC — Medium-Low
- Appliance, VM, cloud (AWS/Azure/GCP/OCI, BYOL/PAYG), FortiFlex. https://www.fortinet.com/products/application-delivery-controller/fortiadc
- FortiADC Manager (central). WAF built in, licensed by bundle (Network/Application/AI Security). GSLB included (also FortiGSLB Cloud). HA: VRRP A/A, A/P. REST/declarative API, Terraform, Ansible. Hardware SSL ASIC, SafeNet HSM integration. https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/FortiADC.pdf
- Buyer: Fortinet Security Fabric customers (inference).

### Radware Alteon — Medium-Low
- Hardware, vADC, VA (cloud) with identical feature set. https://support.radware.com/app/answers/answer_view/a_id/1019604/
- Central: Radware Cyber Controller (formerly APSolute Vision) with vDirect. WAF: AppWall (integrated module). GSLB: yes (package-dependent, from datasheet snippet). HA: VRRP, Switch HA, Service HA, Extended HA. REST + Ansible. Alteon Kubernetes Connector. https://support.radware.com/app/answers/answer_view/a_id/16467/
- Licensing: Global Elastic License (GEL), a shared throughput subscription across physical and virtual. https://www.radware.com/products/alteon-gel/
- FIPS 140 L3 HSM on certain platforms.

### Loadbalancer.org — Medium-Low
- Hardware (Dell/HPE/Supermicro/Lenovo), virtual (VMware, Hyper-V, KVM, Xen, Proxmox, Nutanix), cloud. Central: ADC Portal (can also manage other vendors' LBs). WAF (ModSecurity v2 + OWASP CRS 3) and GSLB "as standard" except Basic tiers. Active/passive, active/active, n+1 clustering. REST/PowerShell APIs, Ansible. Licensing: perpetual, annual, "Freedom License". https://pdfs.loadbalancer.org/datasheets/enterprise-family-datasheet-loadbalancer.pdf
- No Kubernetes load balancer ("not yet available"). https://www.loadbalancer.org/blog/which-load-balancer-compare-f5-citrix-a10-radware-nginx-haproxy-avinetworks-kemp-loadbalancer/
- Runs F5 end-of-life alternative content. https://www.loadbalancer.org/blog/the-f5-load-balancer-alternative-turning-heads

### Array Networks APV / vAPV / AVX — Low
- Hardware APV, virtual vAPV (VMware/KVM/Hyper-V, AWS/Azure), AVX multi-tenant host. Central: Array Management Platform (AMP). WAF: WebWall + separate ASF WAF. GSLB yes. HA: up to 32 nodes, VRRP. REST/XML-RPC. Hardware SSL, FIPS model. https://www.arraynetworks.com/wp-content/uploads/2023/07/DS-APV-x900-Series.pdf , https://www.arraynetworks.com/wp-content/uploads/2021/08/DS-AMP.pdf

### Kong Konnect / Kong Gateway Enterprise — Low-Medium
- Linux packages (Debian/Ubuntu/RHEL/Amazon Linux), Docker, Kubernetes; hybrid mode with Konnect hosted control plane and self-managed data planes on VMs/bare metal. https://developer.konghq.com/gateway/install/ , https://developer.konghq.com/gateway/hybrid-mode/
- No native WAF engine; protection via plugins and partner WAFs. https://developer.konghq.com/waf/
- Licensing: Konnect Plus (base + metered), Konnect Enterprise (annual), self-hosted Gateway Enterprise license. https://konghq.com/pricing
- Existing Elchi compare page: /compare/kong-gateway.html

### Tetrate Enterprise Gateway for Envoy (TEG) — Low-Medium
- "Enterprise enablement and support offering for Envoy Gateway", FIPS-verified build. https://docs.tetrate.io/envoy-gateway/introduction/intro
- Kubernetes-only in practice (VM/bare metal UNVERIFIED). Coraza WAF bundled from v1.8.2 with OWASP CRS. https://docs.tetrate.io/envoy-gateway/howto/coraza
- GSLB only via Tetrate Global Load Balancer for TSB gateways, Azure/AWS DNS. https://docs.tetrate.io/global-load-balancer/
- 24/7 support subscription. https://tetrate.io/tetrate-enterprise-gateway-for-envoy

### Solo Enterprise for kgateway (formerly Gloo Gateway) — Low
- Gloo Gateway donated to CNCF as kgateway; enterprise renamed "Solo Enterprise for kgateway" from 2.1. https://solo.io/blog/donating-gloo-gateway-to-the-cncf-introducing-kgateway-and-advancing-cloud-connectivity
- Kubernetes-only; Coraza WAF with OWASP CRS v4 (2.x). https://docs.solo.io/kgateway/2.2.x/security/waf/overview/ ; enterprise support, N-3 LTS, FIPS images. https://www.solo.io/products/gloo/

### Traefik Hub — Low
- Traefik Enterprise "has been upgraded to Traefik Hub". https://traefik.io/traefik-enterprise
- Kubernetes-native; also a Linux binary under systemd; air-gapped offline mode. https://doc.traefik.io/traefik-hub/api-gateway/setup/linux/installation
- Coraza WAF middleware with OWASP CRS. https://traefik.io/traefik-hub . Subscription tiers (API Gateway, API Management). https://traefik.io/pricing . No GSLB found.

### Others (one line each)
- Edgenexus (Total Uptime): virtual/physical ADC with WAF and GSLB, plus ADC-as-a-Service. https://www.edgenexus.io/
- Snapt: appears discontinued (domain redirects elsewhere; loadbalancer.org publishes Snapt Nova migration material). UNVERIFIED end-of-life.
- Cloudflare Load Balancing: health- and latency-based steering across data centers and clouds. https://www.cloudflare.com/application-services/products/load-balancing/
- AWS Application Load Balancer + AWS WAF. https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html

## Where Elchi differs (docs-backed, for later compare pages)

- Edge appliance OS (Elchi OS: ISO/OVA/qcow2, A/B upgrades with rollback) + active/passive HA pairs on gratuitous ARP or BGP/BFD; measured ≈50 ms planned failover, ≈2 s takeover on power-off; control-plane outage never moves a VIP. (/docs/ha-pairs/overview, /docs/elchi-os/overview)
- WAF = Shield's Coraza engine with OWASP CRS embedded, plus 11 other engines (JWT/JWKS, API keys, mTLS, rate limit, bot, IP reputation, GraphQL, OpenAPI). (/docs/shield/overview)
- GSLB: CoreDNS plugin fed by distributed health checks; HA pair VIP is one GSLB row. (/docs/gslb/overview)
- Several Envoy versions side by side, listener upgrades by hot restart. (/docs/envoy-configuration/versions-and-upgrades)
- ACME DNS-01 issuance/renewal. Automation API (endpoint disable, blue/green cluster switch). RBAC + LDAP/AD + TOTP, audit log with SIEM forwarding.
- Gaps vs ADC incumbents (do not claim): no Terraform provider or Ansible collection documented; no FIPS-validated build or HSM integration documented; no hardware SSL offload; no iRules/AppExpert conversion tool; HA pairs are active/passive, IPv4, Elchi OS only; edge is amd64 only.

## Search demand ("<X> alternative / vs")

No keyword-volume tool was used; "demand" = how well the SERP is served (US WebSearch, 2026-11-25).

| Query | Signal | What ranks |
|---|---|---|
| F5 BIG-IP alternative(s) | **Strong** | Gartner Peer Insights https://www.gartner.com/reviews/product/f5-big-ip/alternatives , G2, TrustRadius, Capterra; vendor pages (loadbalancer.org, Relianoid, A10 https://a10networks.com/f5-load-balancer-alternatives ) |
| NetScaler / Citrix ADC alternative | **Strong** | Capterra; F5 https://www.f5.com/products/compare/citrix-netscaler ; A10 https://www.a10networks.com/citrix-alternatives/ ; HAProxy guide; loadbalancer.org |
| VMware Avi alternative (Broadcom) | **Strong, event-driven** | G2, PeerSpot; Kemp, Radware and HAProxy Broadcom-specific pages (https://haproxy.com/migrate-from-avi-networks ) |
| HAProxy Enterprise vs F5 | **Strong (vs)** | TrustRadius https://www.trustradius.com/compare-products/f5-big-ip-vs-haproxy-enterprise , G2, PeerSpot, StackShare, F5 DevCentral |
| Migrate from F5 / F5 iRules migration | **High intent, vendor-served** | HAProxy https://haproxy.com/migrate-from-f5 , Kemp iRules tool, NGINX migration guide, Avi migration tool |
| A10 Thunder alternative | Medium | Aggregators only (G2, TrustRadius, PeerSpot), F5 compare page |
| Kemp LoadMaster alternative | Medium | Aggregators (Gartner, G2, TrustRadius) |
| NGINX Plus alternative | Medium | Directories, small vendors |
| Software vs hardware load balancer | Informational | TechTarget, CDW, old NGINX posts |
| HAProxy Fusion vs | Weak | Vendor datasheet, junk comparison pages |
| Envoy as ADC replacement / Envoy load balancer enterprise | **Weak but unowned** | StackShare, dev blogs; no vendor or review site frames Envoy as an enterprise ADC — positioning gap for Elchi |

## Recommended next comparison pages (after F5, NetScaler, A10)

1. **Elchi vs VMware Avi Load Balancer** (`/compare/vmware-avi.html`) — strongest event-driven demand (VCF 9 NSX LB entitlement change, Service Unit subscription), closest architecture, competitors already run Broadcom pages so the SERP is proven.
2. **Elchi vs HAProxy Enterprise / Fusion** (`/compare/haproxy-enterprise.html`) — the software alternative buyers shortlist most; "HAProxy Enterprise vs F5" has review-site demand; honest software-vs-software page (VRRP/keepalived vs Elchi OS HA pairs, IWE vs CRS, Fusion vs Elchi control plane).
3. **Elchi vs F5 NGINX Plus / NGINX Enterprise** (`/compare/nginx-plus.html`) — moderate demand, the default "software" answer inside F5 accounts; Envoy vs NGINX is a familiar engineering debate.
4. **Elchi vs Progress Kemp LoadMaster** (`/compare/kemp-loadmaster.html`) — medium demand, mid-market virtual ADC; clustering deprecation and FIPS status are verifiable differences to state carefully.
5. (Content, not a compare page) **"Migrating from F5 BIG-IP to Elchi: VIPs, pools, monitors, iRules"** guide — highest-intent query, currently vendor-only; must be honest that iRules need manual re-implementation (routes, Lua/WASM, Shield).
