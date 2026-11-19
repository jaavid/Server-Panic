#!/usr/bin/env python3
"""Build an Arvan Edge fetch-event worker that serves the *real* offline game.
No upstream, storage bucket, Node APIs, secrets, or runtime CDN required.
Keep one single HTML route so no unverified asset-upload semantics are assumed.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'dist-offline/play.html').read_text(encoding='utf-8')
worker = """/* Server Panic — Arvan Edge Compute fetch event bundle.
 * Original browser game bundled as one HTML response. No secrets and no origin.
 * See docs/ARVAN_DEPLOYMENT.md before uploading.
 */
const GAME_HTML = __HTML__;
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
async function handleRequest(request) {
  const path = new URL(request.url).pathname;
  if (path === '/healthz') {
    return new Response(JSON.stringify({ status: 'ok', game: 'server-panic' }), {
      status: 200, headers: { 'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
    });
  }
  if (path === '/favicon.ico') return new Response(null, {status:204});
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {status: 405,
      headers: {'allow':'GET, HEAD'}});
  }
  return new Response(request.method === 'HEAD' ? null : GAME_HTML, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=120',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()'
    }
  });
}
""".replace('__HTML__',json.dumps(html,ensure_ascii=False,separators=(',',':')))
output=ROOT/'dist-edge';output.mkdir(exist_ok=True)
(output/'server-panic.worker.js').write_text(worker,encoding='utf-8')
(output/'game.html').write_text(html,encoding='utf-8')
print(f'Edge script: {len(worker.encode()):,} bytes. Edge bundle limits must be verified in the active Arvan plan.')
