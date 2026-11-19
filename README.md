# Server Panic — نجات سرور

**A complete playable 90-second mobile-first data-center arcade MVP.** Original game logic and characters. No accounts, telemetry, API calls, or backend.

## Play immediately (offline, no dependencies)

Open **`play.html`** from the repository root in a browser (committed playable Canvas2D build). Running `npm run build:offline` regenerates it at **`dist-offline/play.html`**. It is one self-contained HTML file (~385 KiB) with JavaScript, CSS, and illustrated WebP art embedded. No local HTTP server or npm is required. This is the **Canvas2D fallback build**, not the Phaser build.

The project **primary source is Phaser 3 + TypeScript + Vite**. The alternate Canvas2D renderer shares the same real gameplay simulation, score management, sound, UI and assets, making the game playable in offline/dependency-restricted environments. See `docs/TEST_RESULTS.md` for tested and untested capabilities.

## Standard Phaser development

```bash
npm install
npm run dev
# open the local address printed by Vite
npm run build
npm run preview
```

For strict typechecking, formatting and tests (dependencies installed):

```bash
npm test
npm run test:ui
npm run lint
npm run format
```

> Current execution environment could not resolve `registry.npmjs.org`. Consequently npm dependencies were not installed here and the Phaser/Vite production build **has not been executed or verified**. The standalone offline build was compiled and browser-tested successfully. On a normal network-enabled machine, run the Phaser commands above, review potential issues and rerun all tests.

## How to play

- Select **شروع عملیات**. A real 90-second countdown begins immediately.
- Incoming normal (cyan) and priority (amber) packets appear in the visible FIFO queue. **Tap a rack** or its corresponding rack status button to route the oldest request there. Occupied or offline racks reject traffic; no packet is removed on rejection.
- Processing takes about 0.76–0.93 seconds, scores points and generates heat. Servers cool naturally when idle. At 66°C they warn, near 85°C become critical and at 100°C they shut down for ~5.2 seconds before recovering.
- **Cooling drone:** press the cooling button, then tap the target rack. It removes 43 degrees and requires an 11.5-second recharge. It does not cool offline racks.
- Traffic accelerates every 15 seconds. Survive 90 seconds to win; lose if a queue remains full for 5 seconds or all servers stay offline for 3.2 seconds.
- Combos multiply points. Best score is persisted locally with `localStorage` when permitted by the browser. The game is fully usable with audio muted; audio starts after user gesture.
- Results show score, personal best, processed packets, recoveries, maximum combo and Replay without refresh.

## Architecture

```text
src/main.ts                     Phaser production entry
src/main-offline.ts             Offline Canvas2D entry
src/game/config/balance.ts      Every balancing parameter
src/game/systems/               Deterministic, seeded, framework-independent simulation
src/game/renderers/             PhaserRenderer, CanvasRenderer
src/game/ui/                    DOM HUD, responsive screens, controller
src/services/                   SoundManager + local score store and future gateway interface
src/styles/game.css             Original responsive RTL design system
assets/source/                  Original editable SVG illustration sources
assets/blender/                 Original procedural 3D Blender Python source
assets/generated/               Editable .blend files once Blender is run
public/assets/                  Committed runtime atlas, floor and icon; `npm run assets:2d` regenerates all sprites
scripts/                       Asset generation, packaging, offline and edge builds
scripts/smoke_offline.py        Browser E2E screenshots and critical/results/replay validation
tests/unit/                    Vitest mechanics tests
tests/node/                    Dependency-free Node test equivalents
tests/e2e/                     Playwright spec (when npm dependencies are available)
play.html                       Committed playable self-contained HTML delivery
 dist-offline/play.html          Rebuild output (generated, gitignored)
dist-edge/server-panic.worker.js Arvan Edge fetch-event entry (not yet deployed)
screenshots/                    Optimized WebP versions of real Chromium captures
```

The `GameSimulation` handles requests, route eligibility, server temperature/status/failure, cooling cooldown, difficulty ramps, scoring and win/loss. It emits typed events. Phaser and Canvas2D adapters consume the exact same snapshots/events; neither owns gameplay rules. Animations use pre-rendered sprites. The runtime has no third-party network requests.

## Rebuild the original art

**Procedural illustrated 2.5D fallback** (Python 3 + Pillow + CairoSVG):

```bash
python3 -m pip install pillow cairosvg
npm run assets:2d      # or: python3 scripts/generate_fallback.py && python3 scripts/build_atlas.py
```

Generates 3 distinct racks × 6 states, drone, 8 hover frames, 8 repair frames, floor and logo with editable SVG masters. `public/assets/characters-atlas.{png,json}` is a deterministic atlas (35 frames); standalone files also contain optimized WebP/PNG.

**Blender original 3D pipeline** (Blender 4.x recommended):

```bash
npm run assets:blender
# or: bash scripts/build_blender_assets.sh
```

This runs Blender in background, calls `assets/blender/render_assets.py`, builds three rounded rack characters and their states, a floating drone with 16 animation frames, a modeled data-center diorama, standardized orthographic lighting, transparent RGBA PNG sprite frames, WebP exports, a packed atlas and editable `.blend` scene files in `assets/generated/`.

**Blender was not installed in the build environment. The delivered assets are the original SVG-based procedural 2.5D fallback; no Blender-rendered output or `.blend` files are claimed as generated.** The Python Blender scripts are included but not runtime-validated here.

## Verified offline build and tests

```bash
bash scripts/verify_offline.sh
# requires globally available `tsc`, Node 22+, Python Pillow/CairoSVG,
# and Python Playwright with Chromium for the screenshot pass
```

Individual steps:

```bash
tsc -p tsconfig.check.json
bash scripts/build_offline.sh
node --test tests/node/simulation.test.mjs
python3 scripts/build_edge_worker.py
node scripts/test_edge_worker.mjs
python3 scripts/smoke_offline.py
```

The snapshot tests generate all screens in `screenshots/` (this repository includes selected WebP-compressed captures) at 360×800, 390×844, 768×1024 and 1440×900. See `docs/TEST_RESULTS.md`.

## Arvan Edge deployment

The **competition requirement is Edge Computing deployment**. The project includes scripts to generate a genuine fetch-event Edge Worker bundle at `dist-edge/server-panic.worker.js`, based on Arvan's documented `addEventListener('fetch', ...)` model, that serves the entire playable game as one HTML response. This avoids assuming generic CDN/static hosting qualifies. Not uploaded, unverified against your account's script-size/resource limits. **See `docs/ARVAN_DEPLOYMENT.md` for official sources, actual steps and open questions.**

## Controls and accessibility

Tap/click on each rack in the scene; separate large rack buttons below the scene provide alternate touch and keyboard access. The tutorial and all primary actions use native HTML buttons. Persian content is RTL, with LTR identifiers and readouts. `prefers-reduced-motion` disables CSS animation; some canvas animations remain.

## License / origin

All gameplay, SVG illustrations, textures, graphics, sound synth cues, UI and Blender generators in this deliverable are original. Game uses the official Phaser engine package under its upstream license when the production renderer is installed. Fonts are system fallbacks (no network font fetch).
