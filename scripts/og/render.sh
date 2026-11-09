#!/usr/bin/env bash
# Re-render the social cards from scripts/og/card.html with headless Chrome.
#   public/og-image.png               (www.elchi.io pages)
#   docs-site/static/img/og-docs.png  (docs site)
set -euo pipefail
cd "$(dirname "$0")/../.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
card="file://$PWD/scripts/og/card.html"

enc() { python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$1"; }

render() { # out eyebrow l1 l2a l2b sub url
  local qs="eyebrow=$(enc "$2")&l1=$(enc "$3")&l2a=$(enc "$4")&l2b=$(enc "$5")&sub=$(enc "$6")&url=$(enc "$7")"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --virtual-time-budget=5000 --window-size=1200,630 --screenshot="$PWD/$1" "$card?$qs" 2>/dev/null
  echo "wrote $1"
}

render public/og-image.png \
  "Traffic management & API security" \
  "The visual control plane" "for " "Envoy at scale." \
  "xDS config · GSLB · ACME · WAF · API Discovery · Shield edge security · Edge HA pairs" \
  "www.elchi.io"

render docs-site/static/img/og-docs.png \
  "Documentation" \
  "Install, configure and" "operate " "Elchi." \
  "Installation · Envoy configuration · Shield · API Discovery · GSLB · WAF · Edge HA pairs · Elchi OS" \
  "www.elchi.io/docs"
