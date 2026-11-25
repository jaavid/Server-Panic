# Arvan-Shahr: Concert Night

Playable release candidate, not publicly deployed. The original Classic build is untouched.
The new mission has its own entry at `/concert/` in development and at `/` in its dedicated Edge worker.

## Try locally

1. Open `arvan-shahr-concert.html` in a current Chrome, Firefox or Safari; use the real browser, not a chat attachment preview. It can load without a network connection.
2. For source development, run `python3 -m http.server 8765` from the repository root and open `http://localhost:8765/concert/`.
3. Start the seven-minute mission. Select racks by touching their buildings or via the rack buttons. Route queued packets, restore the failed rack with the drone, and use the control center to activate backup during the live stream outage. A session ends with a score and replay.

## Build and check

```sh
python3 scripts/build_concert_offline.py
python3 scripts/build_concert_edge.py
node --test tests/concert/*.test.mjs
```

The Edge output is `dist-edge/arvan-shahr-concert.worker.js`. It embeds its static assets,
makes no upstream calls, needs no credentials, has no personal-data collection code,
and is not the original Classic worker. The offline artifact is in `dist-offline/`.
The local VM tests do not establish that the live Arvan plan accepts the approximately 764 KB script.

Scene art and synthesizer audio are original, procedural placeholders, not the final Blender/GLB art.
Three.js r180 is pinned at upstream commit
[0af9729](https://github.com/mrdoob/three.js/commit/0af9729d0c143a86a1d725d6e2c3ad83301f3f34)
and included with its MIT license for offline builds. There is no CDN dependency.
Browsers without usable WebGL can still play using the DOM controls, without the 3D view.

## Verification

Eight Node checks cover deterministic simulation, five-minute-plus gameplay paths,
HTTP responses and byte-for-byte asset delivery. Offline HTML also passed an
accelerated start-to-win-and-replay flow with real WebGL on software-rendered
headless Chromium at 360×800 and 1440×900. These are viewport checks, not phone
performance or a real-time playthrough. To regenerate the browser-only test page,
run `python3 tests/concert/make_browser_smoke.py` after the offline build, then load
`dist-offline/concert-smoke.html` in a WebGL2-capable browser and inspect the
body's `data-qa` attribute after the scripted run.

## Release gates still open

- Play the full production-length mission on a physical midrange Android and verify
  readability, playback and performance under peak pressure.
- Confirm current Arvan plan limits, upload to a private test target if available,
  verify runtime/media headers, then check the assigned HTTPS address on mobile.
- Apply final art and balance review as needed before deciding whether the project is ready
  to publish or register. Local validation is not a publication decision.
