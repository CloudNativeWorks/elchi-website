#!/usr/bin/env bash
# Re-render the social cards from scripts/og/card.html with headless Chrome.
#   public/og-image.png               (www.elchi.io pages without their own card)
#   docs-site/static/img/og-docs.png  (docs site)
#   public/og/<page>.png              (product and compare pages, EN and tr-*)
#   docs-site/static/img/og/blog-<slug>.png (blog posts, front matter `image:`)
# Card copy restates each page's own title and claims; keep it in step with the page.
# ONLY=<regex> re-renders just the cards whose output path matches, e.g.
#   ONLY='og/(tr-)?compare' scripts/og/render.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
card="file://$PWD/scripts/og/card.html"

enc() { python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$1"; }

render() { # out eyebrow l1 l2a l2b sub url
  if [[ -n "${ONLY:-}" && ! "$1" =~ $ONLY ]]; then return 0; fi
  local qs="eyebrow=$(enc "$2")&l1=$(enc "$3")&l2a=$(enc "$4")&l2b=$(enc "$5")&sub=$(enc "$6")&url=$(enc "$7")"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --virtual-time-budget=5000 --window-size=1200,630 --screenshot="$PWD/$1" "$card?$qs" 2>/dev/null
  echo "wrote $1"
}

render public/og-image.png \
  "Enterprise application delivery" \
  "Application delivery" "for " "every edge." \
  "Load balancing · TLS & ACME · WAF (Shield) · GSLB · HA pairs with VIPs · One control plane" \
  "www.elchi.io"

render docs-site/static/img/og-docs.png \
  "Documentation" \
  "Install, configure and" "operate " "Elchi." \
  "Installation · Envoy configuration · Shield · API Discovery · GSLB · WAF · Edge HA pairs · Elchi OS" \
  "www.elchi.io/docs"

# ---- per-page cards ---------------------------------------------------------------
mkdir -p public/og docs-site/static/img/og

render public/og/products-core.png "Elchi Core" \
  "Visual control plane" "for " "Envoy and xDS." \
  "Typed Envoy editors · Validation · Draft, save, publish · Several Envoy versions · Edge agent" \
  "www.elchi.io/products/core.html"
render public/og/products-api-security.png "Elchi API Security (Shield)" \
  "WAF, auth and rate limits" "for " "Envoy via ext_proc." \
  "OWASP CRS · JWT/JWKS · mTLS · API keys · Rate limiting · Bot defense · DLP" \
  "www.elchi.io/products/api-security.html"
render public/og/products-api-discovery.png "Elchi API Discovery" \
  "API inventory" "from " "Envoy traffic." \
  "Shadow endpoints · Missing auth · PII exposure · Drift · OpenAPI export" \
  "www.elchi.io/products/api-discovery.html"
render public/og/products-gslb.png "Elchi GSLB" \
  "DNS failover & global" "load balancing " "for Envoy." \
  "HTTP, HTTPS and TCP health probes · CoreDNS plugin · Healthy targets only" \
  "www.elchi.io/products/gslb.html"
render public/og/compare.png "Compare" \
  "Elchi vs F5 BIG-IP, NetScaler," "A10 Thunder " "and gateways." \
  "Enterprise ADCs · Cloud-native gateways and meshes · Criterion by criterion, with sources" \
  "www.elchi.io/compare.html"
render public/og/compare-f5-big-ip.png "Compare" \
  "Elchi vs F5 BIG-IP:" "Application delivery " "in software." \
  "Load balancing · TLS · WAF · GSLB · HA and VIPs · Upgrades · Criterion by criterion, with F5 sources" \
  "www.elchi.io/compare/f5-big-ip.html"
render public/og/compare-netscaler.png "Compare" \
  "Elchi vs NetScaler:" "Application delivery " "in software." \
  "Load balancing · TLS · WAF · GSLB · HA and VIPs · Criterion by criterion, with NetScaler sources" \
  "www.elchi.io/compare/netscaler.html"
render public/og/compare-a10-thunder.png "Compare" \
  "Elchi vs A10 Thunder:" "Application delivery " "in software." \
  "Load balancing · TLS · WAF · GSLB · HA and VIPs · Upgrades · Criterion by criterion, with A10 sources" \
  "www.elchi.io/compare/a10-thunder.html"
render public/og/compare-istio.png "Compare" \
  "Elchi vs Istio" "for " "Envoy on VMs." \
  "Edge and gateway fleets without a mesh · Criterion by criterion, with sources" \
  "www.elchi.io/compare/istio.html"
render public/og/compare-envoy-gateway.png "Compare" \
  "Elchi vs Envoy Gateway:" "Typed Envoy API " "vs Gateway API." \
  "VMs · Standalone mode · Envoy versions · WAF · GSLB · Criterion by criterion, with sources" \
  "www.elchi.io/compare/envoy-gateway.html"
render public/og/compare-kong-gateway.png "Compare" \
  "Elchi vs Kong Gateway:" "Envoy fleet " "vs NGINX gateway." \
  "Proxy · Config model · Versions · Publish and audit · WAF · Criterion by criterion, with sources" \
  "www.elchi.io/compare/kong-gateway.html"
render public/og/compare-kgateway.png "Compare" \
  "Elchi vs kgateway:" "Typed Envoy API " "vs Gateway API." \
  "VMs vs Kubernetes · Envoy versions · WAF · GSLB · Criterion by criterion, with sources" \
  "www.elchi.io/compare/kgateway.html"
render public/og/compare-contour.png "Compare" \
  "Elchi vs Contour:" "Envoy beyond " "Kubernetes ingress." \
  "Edge fleets on VMs · Envoy versions · WAF · GSLB · Criterion by criterion, with sources" \
  "www.elchi.io/compare/contour.html"

render public/og/tr-products-core.png "Elchi Core" \
  "Envoy ve xDS için" "görsel " "control plane." \
  "Tipli Envoy editörleri · Doğrulama · Taslak, kaydet, yayınla · Birden fazla Envoy sürümü · Edge agent" \
  "www.elchi.io/tr/products/core.html"
render public/og/tr-products-api-security.png "Elchi API Security (Shield)" \
  "ext_proc ile Envoy için" "WAF, auth " "ve rate limit." \
  "OWASP CRS · JWT/JWKS · mTLS · API key · Rate limiting · Bot savunması · DLP" \
  "www.elchi.io/tr/products/api-security.html"
render public/og/tr-products-api-discovery.png "Elchi API Discovery" \
  "Envoy trafiğinden" "" "API envanteri." \
  "Gölge endpoint’ler · Eksik kimlik doğrulama · PII · Sapma · OpenAPI export" \
  "www.elchi.io/tr/products/api-discovery.html"
render public/og/tr-products-gslb.png "Elchi GSLB" \
  "Envoy için DNS failover" "ve " "küresel yük dengeleme." \
  "HTTP, HTTPS ve TCP sağlık yoklamaları · CoreDNS eklentisi · Yalnızca sağlıklı hedefler" \
  "www.elchi.io/tr/products/gslb.html"
render public/og/tr-compare.png "Karşılaştırma" \
  "Elchi vs F5 BIG-IP, NetScaler," "A10 Thunder " "ve gateway’ler." \
  "Kurumsal ADC’ler · Cloud-native gateway ve mesh’ler · Kriter kriter, kaynaklarıyla" \
  "www.elchi.io/tr/compare.html"
render public/og/tr-compare-f5-big-ip.png "Karşılaştırma" \
  "Elchi vs F5 BIG-IP:" "Yazılımla " "uygulama dağıtımı." \
  "Yük dengeleme · TLS · WAF · GSLB · HA ve VIP · Yükseltme · Kriter kriter, F5 kaynaklarıyla" \
  "www.elchi.io/tr/compare/f5-big-ip.html"
render public/og/tr-compare-netscaler.png "Karşılaştırma" \
  "Elchi vs NetScaler:" "Yazılımla " "uygulama dağıtımı." \
  "Yük dengeleme · TLS · WAF · GSLB · HA ve VIP · Yükseltme · Kriter kriter, NetScaler kaynaklarıyla" \
  "www.elchi.io/tr/compare/netscaler.html"
render public/og/tr-compare-a10-thunder.png "Karşılaştırma" \
  "Elchi vs A10 Thunder:" "Yazılımla " "uygulama dağıtımı." \
  "Yük dengeleme · TLS · WAF · GSLB · HA ve VIP · Yükseltme · Kriter kriter, A10 kaynaklarıyla" \
  "www.elchi.io/tr/compare/a10-thunder.html"
render public/og/tr-compare-istio.png "Karşılaştırma" \
  "Elchi vs Istio:" "VM’lerde " "Envoy yönetimi." \
  "Mesh olmadan edge ve gateway filoları · Kriter kriter, kaynaklarıyla" \
  "www.elchi.io/tr/compare/istio.html"
render public/og/tr-compare-envoy-gateway.png "Karşılaştırma" \
  "Elchi vs Envoy Gateway:" "Tipli Envoy API " "vs Gateway API." \
  "VM · Standalone mod · Envoy sürümleri · WAF · GSLB · Kriter kriter, kaynaklarıyla" \
  "www.elchi.io/tr/compare/envoy-gateway.html"
render public/og/tr-compare-kong-gateway.png "Karşılaştırma" \
  "Elchi vs Kong Gateway:" "Envoy filosu " "vs NGINX gateway." \
  "Proxy · Config modeli · Sürümler · Yayınlama ve audit · WAF · Kriter kriter, kaynaklarıyla" \
  "www.elchi.io/tr/compare/kong-gateway.html"
render public/og/tr-compare-kgateway.png "Karşılaştırma" \
  "Elchi vs kgateway:" "Tipli Envoy API " "vs Gateway API." \
  "VM ve Kubernetes · Envoy sürümleri · WAF · GSLB · Kriter kriter, kaynaklarıyla" \
  "www.elchi.io/tr/compare/kgateway.html"
render public/og/tr-compare-contour.png "Karşılaştırma" \
  "Elchi vs Contour:" "Ingress ötesinde " "Envoy filoları." \
  "VM’lerde edge filoları · Envoy sürümleri · WAF · GSLB · Kriter kriter, kaynaklarıyla" \
  "www.elchi.io/tr/compare/contour.html"

render docs-site/static/img/og/blog-what-is-an-envoy-control-plane.png "Elchi Blog" \
  "What is an" "" "Envoy control plane?" \
  "xDS explained: LDS, RDS, CDS, EDS, SDS · ADS ordering · Delta xDS · ACK/NACK" \
  "www.elchi.io/docs/blog"
render docs-site/static/img/og/blog-owasp-crs-waf-envoy-ext-proc.png "Elchi Blog" \
  "The OWASP Core Rule Set" "on " "Envoy with ext_proc." \
  "UDS wiring · Per-route body buffering · Detect, shadow, block rollout" \
  "www.elchi.io/docs/blog"
render docs-site/static/img/og/blog-envoy-on-vms-without-kubernetes.png "Elchi Blog" \
  "Running Envoy on VMs" "without " "Kubernetes." \
  "Bootstrap · xDS · Process supervision · Upgrades · Telemetry" \
  "www.elchi.io/docs/blog"
render docs-site/static/img/og/blog-envoy-fleet-without-xds.png "Elchi Blog" \
  "Running an Envoy fleet" "without " "hand-written xDS." \
  "References · Validation · Versions · What an Envoy control plane must do" \
  "www.elchi.io/docs/blog"
render docs-site/static/img/og/blog-software-adc-alternatives.png "Elchi Blog" \
  "Software ADC alternatives" "to " "F5, NetScaler, A10." \
  "VIP & HA · L4/L7 · TLS · WAF · GSLB · Central management · Evaluation checklist" \
  "www.elchi.io/docs/blog"
