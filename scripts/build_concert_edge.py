#!/usr/bin/env python3
"""Package the Concert Night entry, without publishing or changing Classic."""
from pathlib import Path
import json
from base64 import b64encode

root = Path(__file__).resolve().parents[1]
concert = root / 'concert'
names = ('index.html', 'concert.css', 'main.mjs', 'city.mjs', 'mission.mjs',
         'vendor/three.core.min.js', 'vendor/three.module.min.js', 'vendor/LICENSE', 'fonts/OFL.txt')
files = {name: (concert / name).read_text(encoding='utf-8') for name in names}
for font in sorted((concert/'fonts').glob('*.woff2')):
    files['fonts/' + font.name] = b64encode(font.read_bytes()).decode('ascii')
worker = """// Arvan-Shahr: Concert Night; static first-party bundle. Three.js license at /vendor/LICENSE.
const files = __FILES__;
const headers = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'permissions-policy': 'camera=(), microphone=(), geolocation=()' };
const types = {html:'text/html', css:'text/css', mjs:'text/javascript', js:'text/javascript', LICENSE:'text/plain', txt:'text/plain', woff2:'font/woff2'};
addEventListener('fetch', e => e.respondWith(serve(e.request)));
function serve(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(null,{status:405,headers:{...headers,allow:'GET, HEAD'}});
  const path = new URL(req.url).pathname;
  if (path === '/favicon.ico') return new Response(null,{status:204,headers});
  if (path === '/healthz') return new Response(req.method === 'HEAD' ? null : '{"status":"ok","game":"arvan-shahr-concert"}',{headers:{...headers,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  const name = path === '/' ? 'index.html' : path.slice(1);
  if (!Object.hasOwn(files,name)) return new Response(req.method === 'HEAD' ? null : 'Not Found',{status:404,headers});
  const type = types[name.slice(name.lastIndexOf('.') + 1)] || 'text/plain';
  const body = req.method === 'HEAD' ? null : type === 'font/woff2' ?
    Uint8Array.from(atob(files[name]), c => c.charCodeAt(0)) : files[name];
  return new Response(body,{headers:{...headers,'content-type':type === 'font/woff2' ? type : type+'; charset=utf-8','cache-control':'public, max-age=120'}});
}
""".replace('__FILES__', json.dumps(files, ensure_ascii=False, separators=(',', ':')))
out = root / 'dist-edge'
out.mkdir(exist_ok=True)
dest = out / 'arvan-shahr-concert.worker.js'
dest.write_text(worker, encoding='utf-8')
print(f'{dest.name}: {dest.stat().st_size:,} bytes. Live Arvan quota/runtime not verified.')
