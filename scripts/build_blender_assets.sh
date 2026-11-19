#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v blender >/dev/null 2>&1; then
 echo 'Blender not installed. Run npm run assets:2d for deterministic temporary art.' >&2
 exit 2
fi
blender --background --python assets/blender/render_assets.py -- \
  --out "$PWD/public/assets" --source "$PWD/assets/generated"
python3 scripts/optimize_blender.py
python3 scripts/build_atlas.py
