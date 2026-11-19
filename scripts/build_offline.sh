#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
TSC="$(command -v tsc || true)"
if [[ -z "$TSC" ]]; then echo 'TypeScript compiler required. Install TypeScript or run npm install.' >&2;exit 1;fi
rm -rf dist-offline
"$TSC" -p tsconfig.offline.json
mkdir -p dist-offline/assets
cp -a public/assets/. dist-offline/assets/
cp src/styles/game.css dist-offline/style.css
cat > dist-offline/index.html <<'HTML'
<!doctype html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101827"><title>Server Panic — نجات سرور</title><link rel="stylesheet" href="./style.css"></head><body><div id="app"></div><script type="module" src="./main-offline.js"></script></body></html>
HTML
echo 'Offline playable build at dist-offline/index.html'
python3 scripts/bundle_offline.py
