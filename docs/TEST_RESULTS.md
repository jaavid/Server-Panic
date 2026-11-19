# Verification report — 2026-11-19

All listed results were obtained inside the build container. Do not interpret missing dependencies as passing Phaser/Vite tests.

| Area | Command / tool | Actual outcome |
|---|---|---|
| TypeScript core + UI + Canvas2D (strict, unused checks) | `tsc -p tsconfig.check.json` | PASS |
| Offline build | `bash scripts/build_offline.sh` | PASS — `dist-offline/play.html` built, ~385 KiB, no network needed |
| Pure simulation mechanics (Node built-in test runner) | `node --test tests/node/simulation.test.mjs` | PASS **14/14** |
| Edge fetch-event bundle | `python3 scripts/build_edge_worker.py` | PASS — `dist-edge/server-panic.worker.js` ~399 kB |
| Edge event contract | `node scripts/test_edge_worker.mjs` | PASS — 200 HTML, healthz, nested routes, 204, 405, HEAD |
| Chromium real menu/tap/score/cooling/cooldown | `python3 scripts/smoke_offline.py` | PASS at 360×800, 390×844, 768×1024, 1440×900 |
| Critical heat, queue loss, result screen and replay | same browser smoke | PASS (real engine advanced in browser, not API mocks) |
| JS page errors and horizontal overflow | same browser smoke | PASS — zero uncaught page errors and no horizontal overflow |
| Images and screenshot capture | Chromium screenshots | PASS — `screenshots/*.png` |
| Phaser/Vite dependency install | `npm view phaser`, npm registry check | BLOCKED — DNS cannot resolve registry.npmjs.org |
| Production Phaser/Vite build | `npm run build` | NOT RUN — npm dependencies absent |
| Vitest and npm Playwright | `npm test`, `npm run test:ui` | NOT RUN — npm dependencies absent; equivalent Node and Python tests ran |
| Blender asset render | `blender` | NOT RUN — binary absent; provided procedural SVG/WebP assets and Blender scripts |
| Live Arvan Edge deployment | requires account | NOT RUN — no credentials; deployment method researched and genuine worker built |

## Browser screenshots

- `menu-mobile.png`: 390×844 main menu
- `tutorial-mobile.png`: 390×844 tutorial
- `gameplay-mobile.png`: 390×844 live simulation, request routing and drone usage
- `gameplay-360.png`: 360×800 narrow display
- `gameplay-tablet.png`: 768×1024
- `gameplay-desktop.png`: 1440×900
- `critical-mobile.png`: 390×844 simulated high heat and queued packets **inside the real game simulation**
- `results-mobile.png`: 390×844 real queue-overload loss, results and replay tested

## Known limitations / next work

1. **Validate Phaser renderer in an internet-enabled environment** and fix any build/type/runtime differences; the fallback renderer has been browser-tested, the Phaser adapter has not.
2. **Execute Blender generator** on Blender 4.x and inspect/iterate actual rendered sprites/.blend files. Current fallback 2.5D artwork is coherent but not 3D-rendered.
3. **Test actual Arvan upload and deployed Edge Worker URL**, especially upload limits and platform worker JavaScript compatibility.
4. **Manual audio and device testing** on several actual Android devices; browser simulator tested layout and pointer interactions but not thermal/battery impact.
5. Additional balance iteration from real players. Offline deterministic bot probes indicate outcomes vary with routing strategy and seeds; difficulty tuning is deliberately exposed in `src/game/config/balance.ts`.
6. Verify real-origin localStorage persistence on deployed HTTPS host. Local storage code uses safe access, but browser smoke navigations were restricted and executed under `about:blank`.
