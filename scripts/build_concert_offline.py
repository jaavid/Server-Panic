#!/usr/bin/env python3
"""Build a downloadable single HTML file that runs without a server or network."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / 'concert'
source_files = ('vendor/three.core.min.js', 'vendor/three.module.min.js',
                'mission.mjs', 'city.mjs', 'main.mjs')
data = json.dumps([ (src / f).read_text(encoding='utf-8') for f in source_files ], ensure_ascii=False).replace('<', r'\u003c')
license_text = (src / 'vendor/LICENSE').read_text(encoding='utf-8')
css = (src / 'concert.css').read_text(encoding='utf-8')
html = (src / 'index.html').read_text(encoding='utf-8')
boot = '''<script type="module">
const source = __SOURCE__;
const moduleURL = text => URL.createObjectURL(new Blob([text], {type:'text/javascript'}));
const urls = [];
try {
  urls.push(moduleURL(source[0]));
  urls.push(moduleURL(source[1].replaceAll('./three.core.min.js', urls[0])));
  urls.push(moduleURL(source[2]));
  urls.push(moduleURL(source[3].replace('./vendor/three.module.min.js', urls[1])));
  urls.push(moduleURL(source[4].replace('./mission.mjs', urls[2]).replace('./city.mjs', urls[3])));
  await import(urls[4]);
} catch (err) {
  console.error(err);
  document.querySelector('#overlay-title').textContent = 'بازی در این مرورگر بارگذاری نشد';
  document.querySelector('#overlay-copy').textContent = 'فایل را روی دستگاه ذخیره کن و با مرورگر به‌روز باز کن، نه با پیش‌نمایش داخل پیام‌رسان.';
  document.querySelector('#start').disabled = true;
} finally { urls.forEach(u=>URL.revokeObjectURL(u)); }
</script>'''.replace('__SOURCE__', data)
html = html.replace('<link rel="stylesheet" href="./concert.css">','<style>'+css+'</style>')
html = html.replace('<script type="module" src="./main.mjs"></script>',boot)
html = html.replace('</head>', '<!-- Vendored Three.js license:\n'+license_text+'\n-->\n</head>')
out = root / 'dist-offline'
out.mkdir(exist_ok=True)
dest = out / 'arvan-shahr-concert.html'
dest.write_text(html,encoding='utf-8')
print(f'{dest.name}: {dest.stat().st_size:,} bytes, no network or local HTTP server required.')
