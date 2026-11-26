# Arvan-Shahr: Concert Night

Concert Night has its own playable entry at `/concert/` and at `/` in its dedicated Edge worker.

## Play locally

Serve the source worktree from its root.

```sh
python3 -m http.server 8769 --bind 127.0.0.1
```

Open [Concert Night](http://127.0.0.1:8769/concert/). Send the first packet to start the seven-minute timer, or skip the practice. The incident guide names the next useful action and links to the corresponding area when it is out of view.

- **Datacenter** · Route queued packets to free racks. Send the drone to recover an offline rack or cool a hot one. Alternate racks during sustained bursts.
- **Concert** · Inform the audience during service degradation to reduce trust loss for 15 seconds. The notice is available again after 60 seconds.
- **Control** · Start backup during the ingest outage. It takes five seconds to come online and has lower capacity than the primary feed. The blackout has a 27-second limit.
- **Service priorities** · Choose a temporary tradeoff between stable broadcast and faster entry. The choices expire if ignored.

The final report shows the result, score, local best, processed and lost packets, manual routes, drone recoveries and downtime. Trust can reach zero through prolonged degradation. Replay resets the mission and uses a fresh seed. The new scoring rules use a separate local-best record. Sound starts muted.

## Build and verify

```sh
python3 scripts/build_concert_offline.py
python3 scripts/build_concert_edge.py
node --test tests/concert/*.test.mjs
python3 tests/concert/make_browser_smoke.py
```

Open `dist-offline/arvan-shahr-concert.html` in Chrome, Firefox or Safari for the single-file version. Without WebGL it remains playable using the area and rack buttons. For an accelerated smoke check, open `dist-offline/concert-smoke.html` and inspect the body's `data-qa` attribute.

With Playwright and Chrome installed, run the source browser checks while the local server is running.

```sh
node tests/concert/browser-flow.cjs
node tests/concert/browser-flow.cjs --real
```

Set `PLAYWRIGHT_MODULE` if Playwright is installed outside this checkout. The accelerated checks cover both loss paths, victory, pause, replay, mobile layout and picking, offline play without WebGL, and a simulated Edge service. The normal-speed run takes about seven minutes and uses the same controls as a player.

The compiled Edge worker is `dist-edge/arvan-shahr-concert.worker.js`. The local verification runs it without credentials or deployment. The generated offline and Edge packages use the built-in procedural city. Three.js r180 is pinned at upstream commit `0af9729` and included with its MIT license. Physical Android performance and the live Arvan runtime still need separate verification.
