# Server Panic / ArvanCloud Edge Computing Deployment

Last researched: **2026-11-19**. Not deployed: no credentials or live Arvan tenant were provided. This document distinguishes confirmed official information from account-specific unknowns.

## What was verified in official documentation

1. Arvan **Edge Computing** accepts serverless functions, sites and HTML pages; this is not just a CDN cache. The panel supports selecting a template **or uploading an already-built file**. Source: [official Getting Started](https://docs.arvancloud.ir/fa/edge-computing/), [official Dashboard / uploading a built file](https://docs.arvancloud.ir/fa/edge-computing/dashboard/).
2. Arvan documents a `fetch` event handler using `addEventListener('fetch', event => event.respondWith(...))`, `Request` and `Response`. Source: [official Edge Examples / GeoIP](https://docs.arvancloud.ir/fa/edge-computing/examples/geoip/).
3. A new Edge app receives an **Arvan `arvanedge.ir` subdomain** automatically. Custom-domain routes are attached via existing Arvan CDN domains and an edge route (page rule). Source: [official Routes](https://docs.arvancloud.ir/fa/edge-computing/trigger/path/).
4. Environment variables are JSON values attached per Edge app, with an optional encrypted value; `EC_URL` is reserved. The present game needs **none**. Source: [official Environment Variables](https://docs.arvancloud.ir/fa/edge-computing/env-variables/).
5. The dashboard supports deployments/version history and testing the default address. Official product information also documents panel/CLI deployment and included SSL for Edge. Sources: [Dashboard](https://docs.arvancloud.ir/fa/edge-computing/dashboard/), [Product](https://www.arvancloud.ir/fa/products/edge-computing).
6. The **Edge Games competition announcement** requires you to publish on Arvan Edge Computing and register the resulting playable URL on the competition form **by 9 Azar 1405**. Source: [ArvanCloud's official Telegram announcement](https://t.me/s/arvancloud) and [competition page](https://try.arvancloud.ir/edge-games/). The competition page could not be loaded through our research tool; check its latest terms in your own browser before submission.

## Deployable artifact generated

`dist-edge/server-panic.worker.js` (approximately **399 kB**) is a real JavaScript worker with a documented `fetch` listener. It serves an entirely self-contained game in a single response, without origin hosting, backend, storage bucket, login, external JS/CSS/fonts or images. No runtime config or API key appears in the source.

Routes:
- `GET /` or any other GET path: playable game (`text/html; charset=utf-8`)
- `GET /healthz`: `{"status":"ok","game":"server-panic"}`
- `GET /favicon.ico`: 204
- `HEAD`: correct status/headers, empty body
- Other methods: 405

`max-age=120` for the HTML response; all sprites/WebP/JS/CSS are inline, avoiding separate cache rules. For final competition deployment, disable/adjust browser HTML caching if updating frequently.

## Exact operator checklist (no fake URL or credentials)

1. On your own machine: run `python3 scripts/build_edge_worker.py` (or use the already-included compiled file). `node scripts/test_edge_worker.mjs` is the local handler test.
2. Log in at [ArvanCloud panel](https://panel.arvancloud.ir/) and open **Edge Computing**.
3. Create a new Edge Compute app or worker. Choose the option to **upload a built code file** instead of a sample template. Select `dist-edge/server-panic.worker.js`; do not upload `dist/` as if it were an Edge worker.
4. Save and **deploy/publish**. Inspect the deployment status, preview console and assigned default `*.arvanedge.ir` hostname.
5. Visit the actual default URL from both a desktop and a phone; test menu, routing, cooling, countdown, local best-score and replay. Also check `/healthz` and browser console errors. Ensure HTML response has the correct content type. Check the size limit and isolate/runtime support; this build has not been tested against Arvan's real service.
6. If you want a custom domain, first register it on Arvan CDN, then create a route mapping that domain/path to the **Edge app**. You do not need a custom domain for a working default Edge subdomain. The official routes docs show the panel and API procedure, but **do not** guess route IDs/API keys.
7. Submit the **actual publicly reachable Edge game URL** to the Edge Games competition form before the official deadline. Keep a screenshot of the Arvan deployment and successful mobile gameplay to establish compliance.

## Important restrictions and unresolved items

- We **did not confirm the maximum code/bundle upload size, memory/CPU execution limits, JavaScript support profile, account quota, or free plan limits**. A ~399 kB bundled worker is small compared with a full JS app but still needs an actual upload test.
- Fetch handler compatibility was validated against official source examples and locally in Node. It is **not** a remote Arvan deployment test.
- The primary Phaser/Vite `dist/` contains separate assets. Arvan's page mentions uploading built files, but it does not conclusively specify multi-file static asset mapping for the chosen plan. Hence we deliberately use one genuine, self-contained worker bundle, not unsupported automatic Vite dist hosting.
- We have not verified Arvan provides durable KV, storage bindings, or database services for a scoreboard. This MVP only uses browser localStorage.
- Caching, compression, custom routes, HTTPS, mobile reachability and competition acceptance need to be confirmed on the deployed URL.
- If Arvan rejects the bundled worker due to size, consider smaller artwork, lossless HTML minification, or an **officially-supported** static asset binding/route after checking the active service docs; do not silently substitute generic object storage + CDN for Edge Computing.

## Security

No credentials or authentication. The worker restricts methods, sends `nosniff` and a restrictive browser permissions policy. All state stays in-browser. HTML, CSS, sprites and JS are original or ordinary build outputs. The `healthz` endpoint reveals only a generic status.
