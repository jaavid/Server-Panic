#!/usr/bin/env python3
"""Dependency-free distributable including ALL art as data URLs and zero network requests."""
from pathlib import Path
import base64, json, re
root = Path(__file__).resolve().parents[1]
dist = root/'dist-offline'
paths = [
    'game/config/balance.js',
    'game/systems/SeededRandom.js',
    'game/systems/GameSimulation.js',
    'services/ScoreStorage.js',
    'services/SoundManager.js',
    'game/renderers/CanvasRenderer.js',
    'game/ui/shell.js',
    'game/ui/GameController.js',
    'main-offline.js',
]
assets = {p.stem: 'data:image/webp;base64,'+base64.b64encode(p.read_bytes()).decode() for p in sorted((dist/'assets').glob('*.webp'))}
chunks=['"use strict";', 'const ASSET_URLS = '+json.dumps(assets)+';']
for rel in paths:
    code=(dist/rel).read_text()
    code=re.sub(r'^import\s+.*?;\s*$', '', code, flags=re.M)
    code=re.sub(r'^export\s+', '', code, flags=re.M)
    if rel.endswith('CanvasRenderer.js'):
        code=code.replace('img.src = `./assets/${name}.webp`;', 'img.src = ASSET_URLS[name] ?? `./assets/${name}.webp`;')
    if rel.endswith('/shell.js'):
        code=code.replace('src="./assets/icon.webp"','src="${ASSET_URLS.icon}"')
    chunks.append('// ==== '+rel+' ====\n'+code)
bundle='\n'.join(chunks)
(dist/'bundle.js').write_text(bundle)
css=(dist/'style.css').read_text()
# Fully self-contained ONE FILE, works even as a file:// URL, with no external resources.
html='<!doctype html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101827"><title>Server Panic — نجات سرور</title><style>'+css+'</style></head><body><div id="app"></div><script>'+bundle.replace('</script','<\\/script')+'</script></body></html>'
(dist/'play.html').write_text(html)
print('Generated play.html',len(html)//1024,'KiB', 'assets embedded:',len(assets))
