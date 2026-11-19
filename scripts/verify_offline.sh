#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
./scripts/build_offline.sh
node --test tests/node/simulation.test.mjs
python3 scripts/build_edge_worker.py
node scripts/test_edge_worker.mjs
if python3 -c 'import playwright.sync_api' 2>/dev/null; then
 python3 scripts/smoke_offline.py
else
 echo 'Browser tests skipped: Python Playwright is unavailable'
fi
