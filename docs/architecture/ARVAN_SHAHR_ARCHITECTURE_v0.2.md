# Architecture Decision Record — Arvan-Shahr v0.2
**Status:** Proposed; no implementation claimed. **Date:** 2026-11-19.

Related: [GDD v0.2](../gdd/ARVAN_SHAHR_GDD_v0.2.md) · [Vertical slice](../production/VERTICAL_SLICE_CONCERT.md) · [Codex execution](../production/CODEX_EXECUTION_PLAN.md)

## 1. Decision

Evolve the currently playable Server Panic Phaser 3 + TypeScript/Vite codebase **incrementally**. Preserve its deterministic game simulation, sprite/Blender pipeline and known-working Canvas2D fallback; introduce a mission-scoped domain simulation, three-zone city view and scenario scripting. The city will **look three-dimensional** through authored/pre-rendered 2.5D layers, but run in Phaser (not runtime WebGL 3D meshes).

This avoids a risky engine rewrite and keeps the mobile browser first. A true Three.js runtime 3D camera is an **explicit later ADR** if gameplay genuinely requires free rotation and the 2.5D prototype fails visual objectives.

## 2. Existing code — verified on main

- **src/game/systems/GameSimulation.ts**: deterministic seeded 90s loop with request queue, rack states, heat, failure, recovery, cooldown, scoring, events, and snapshots.
- **src/game/renderers/PhaserRenderer.ts**: interactive fixed scene with 3 racks, lights, particles, drone and direct rack tap.
- **src/game/renderers/CanvasRenderer.ts**: offline renderer for shared logic.
- **src/game/ui/GameController.ts**: menu/tutorial/play/results flow, sounds and local score.
- **src/game/config/balance.ts**, **tests/unit**, **tests/e2e**, **assets/blender/**, **docs/SORKHAB_DESIGN_SPEC.md** already exist.
- **Important:** old README says npm-dependent Phaser build was not verified in earlier environment; this plan does not assert the new city or a passing build.

**Refactor policy:** leave classic mode playable. Extract only what will be reused; never turn old GameSimulation into a giant class handling three services and camera UI.

## 3. System boundary map

~~~mermaid
flowchart TD
  UI["RTL HUD + Command Input"] --> Cmd["Command Dispatcher / target validation"]
  Cmd --> Sim["Mission Simulation (fixed-step, seeded)"]
  Director["Mission Timeline / Incident Director"] --> Sim
  Sim --> Events["Typed Game Events + immutable snapshots"]
  Events --> Render["Phaser City Renderer"]
  Events --> HUD["HUD Presenter"]
  Events --> Sound["Audio / FX presenter"]
  Render --> Input["Zone hit-testing / Camera adapter"]
  Input --> Cmd
  Sim --> Store["Local Mission Results"]
  QA["Debug API + Vitest + Playwright"] --> Sim
  QA --> Render
~~~

**Simulation owns truth**. UI/renderer may request actions but may not directly mutate queues, availability or audience trust. Incident script may issue scheduled state changes only via typed simulation events, with deterministic seed and fairness validation.

### Recommended files (new; names not existing yet)

~~~text
src/
  game/
    config/               # current balance.ts plus concert balance and phase definitions
    systems/              # current GameSimulation and SeededRandom retained
    missions/
      types.ts
      concert-night/
        config.ts
        incidents.ts
        timeline.ts
        ConcertSimulation.ts
        scoring.ts
    world/
      CityWorld.ts          # city zones / hotspot definitions
      CameraController.ts
      WorldStateProjector.ts # translate domain state to visible world cues
    renderers/
      PhaserRenderer.ts     # existing classic renderer retained
      CityPhaserRenderer.ts # new layered city scene
      CanvasRenderer.ts     # existing classic fallback retained
    ui/
      MissionController.ts
      components/
      theme/
  services/
    ScoreStorage.ts
    SoundManager.ts
assets/
  blender/                 # reuse generator conventions
  generated/               # sprite atlases, city layer manifests
tests/
  unit/mission/
  e2e/mission/
  fixtures/
    mission-seeds.json
docs/
  gdd/
  architecture/
  production/
~~~

**Compatibility path:** avoid renaming old entrypoints in initial PR. Add an optional game mode selector or separate mission entry during development, then switch root menu only after vertical-slice acceptance.

## 4. Domain types and contracts — design only

~~~ts
type ZoneId = 'concert' | 'datacenter' | 'control';
type ServiceId = 'livestream' | 'ticketing' | 'operations';
type ToolId = 'route' | 'drone' | 'backup-stream' | 'redistribute';

interface MissionCommand {
  atTick: number; // logical tick, not Date.now
  type: 'ROUTE' | 'DISPATCH_DRONE' | 'ACTIVATE_BACKUP' | 'REDISTRIBUTE';
  actor: 'player';
  targetId: string;
  params?: Record<string, string | number | boolean>;
}
interface ServiceSnapshot {
  id: ServiceId;
  availability: number; // 0..1
  queueDepth: number;
  deliveredRate: number; // per simulation second
  demandRate: number;
}
interface ConcertSnapshot {
  tick: number;
  phase: 'intro' | 'surge' | 'live' | 'incident' | 'finale' | 'won' | 'lost';
  remainingSeconds: number;
  services: ReadonlyArray<ServiceSnapshot>;
  incidents: readonly { id: string; severity: 'info'|'warning'|'critical'; expiresAtTick: number }[];
  cityTrust: number; // 0..100
  streamContinuity: number; // 0..1 computed from delivered minutes
  nodes: readonly { id: string; heat: number; status: string }[];
  drone: { status: 'ready'|'enroute'|'working'|'returning'|'cooldown'; targetId?: string; readyAtTick: number };
}
~~~

These are provisional contract shapes. Before implementation choose exact precision/serializability and use discriminated-union commands instead of permissive params in production.

## 5. Simulation architecture

**Fixed timestep:** deterministic 50ms logical steps (20Hz) for mission simulation, decoupled from Phaser render FPS. Input commands stamped in tick order. Consume accumulated real time with a max catch-up budget and a documented policy for background/tab suspension. Do not silently use rendered frame count as mission time.

**Independent systems:**
- **TrafficDirector:** seeded, scheduled demand per service; bounded burst size and grace intervals.
- **CapacitySystem:** available nodes, queue throughput, routing, warm-up and failover.
- **ThermalSystem:** processing heat and passive cooling; preserved from classic mode where feasible.
- **StreamingSystem:** ingress, processing and delivered audience capacity; actual derived availability.
- **DroneSystem:** target reservation, travel, intervention and recharge, one drone initially.
- **IncidentDirector:** deterministic event budget, event prerequisites, warnings, scripted main failure and cooldowns.
- **CityMoodProjector:** pure mapping of service snapshots to projection flicker, sound state, lighting, crowd mood. No RNG-based fake service stats.
- **ScoreSystem:** uptime, incidents mitigated, routing, penalties; independent from rendering.
- **MissionDirector:** timeline beats, progress, victory/loss conditions.

**Fairness invariants:**
1. At least one mitigatable path must remain available for any scripted incident.
2. Every major fail has an observable warning and enough intervention time.
3. Two simultaneous critical incidents are forbidden in onboarding; peak concurrent critical incidents must be tuned from playtesting.
4. No cooldown bypass or invalid target dispatch.
5. Stream-uptime accumulation uses actual simulation time, not number of frames.
6. Same seed + command sequence + tick schedule yields byte-equivalent canonical snapshots.

**Persistence:** localStorage holds schema-versioned results per mission; future remote scores behind an interface, but no backend in MVP. No runtime AI calls.

## 6. Camera and world rendering

Use **one city tableau** composed of independently optimized layers: backdrop/mountains; distant modular city; datacenter midground; courtyard/concert foreground; control-center highlight/overlay; FX and HUD. Build clickable zone polygons or bounding volumes bound to model coordinates; do not use raw pixel guesses tied to one aspect ratio.

- Three camera bookmarks: overview, concert, datacenter/control. Smooth ~250–400ms pan with collision-free UI anchor zones; buttons always work while camera animates (or animation cancels input).
- Zoom limited to pre-approved ranges where no sprite becomes excessively blurry; 3/4 visual perspective is baked in Blender outputs.
- World and HUD are separate coordinate systems. Fit mobile with clipped world view and a distinct persistent HUD; no squeezed wide-city image.
- Texture manifests label layer, depth, anchor, scale, hit area, atlas frame and license/provenance.
- For opening video: optional compressed short cinematic on menu only, with poster fallback and immediate skip; do not autoplay audio before gesture.

## 7. Rendering and performance

- Budget targets to validate: interactive under ~4s on a representative midrange Android 4G connection; active play smooth at >=30 FPS, aim 45–60; initial compressed assets ideally <=6 MB; no uncontrolled particle production.
- Lazy load city detail for zoomed regions; deterministic animation states in render adapter, avoid per-frame DOM reflow. Cap DPR (e.g. at 2) as in existing renderer; measure GPU memory.
- Keep 2D fallback but do not promise identical cinematic layers unless created.
- If game content grows beyond worker upload size, treat Edge asset delivery as separate verified deployment architecture; do not inline multi-megabyte movie in worker without size test.

## 8. Debuggability and testing interface

Follow inspectable game principle from https://developers.openai.com/blog/how-to-build-games-with-astra. **Development/test builds only** expose an opt-in debug API; never ship commands that can fake public leaderboards.

~~~ts
window.__ARVAN_SHAHR_DEV__ = {
  version: '0.2-dev',
  snapshot: () => mission.snapshot(),
  counters: () => ({fps, frameMs, textureBytes, drawCalls}),
  loadScenario: (id: 'concert_calm' | 'concert_peak' | 'concert_blackout' | 'concert_recovery') => {},
  stepTicks: (n: number) => {},
  dispatch: (command: MissionCommand) => {},
};
~~~

Implement debug API only with explicit dev/test flag and enforce no import in production. Browser tests use named scenarios plus real pointer/touch control flows; fixtures cannot replace real integration coverage.

### Required test layers

- **Vitest**: queue, heat, backup capacity, drone transitions, incident fairness, deterministic seed/commands, win/loss/grace, score/persistence migration, paused-tab rules.
- **Playwright**: 360×800, 390×844, 768×1024, 1440×900; menu, tutorial, control-to-target, drone travel/cooldown, camera pan+tap, stream outage and recovery, results/replay; screenshots and console error check.
- **Manual**: one midrange Android, audio unlock, touch accuracy, readability outdoors, reduced motion, 7-min blind playtest.
- **CI**: npm ci, typecheck, lint, Vitest, build, Playwright (with browser install/cache); archive screenshots/reports for regressions.

## 9. Explicit decisions deferred

- Actual 3D engine / Three.js — no until 2.5D prototype shows an unmet interaction need.
- Multiplayer, real-time viewer counts, network APIs, online leaderboard, campaign save/sync, monetization — outside first slice.
- Official Arvan tokens/fonts/assets — must verify distribution rights; Sorkhab UI guidance is not permission to use logos.
- Production Arvan Edge bundle layout — must be tested on target account.

## 10. ADR review trigger

Revisit this architecture only if: a tested playable requirement cannot be satisfied in 2.5D; mobile frame timing fails; deterministic event model becomes inaccurate; or Arvan hosting restrictions demonstrably force another packaging strategy. Record evidence, not aesthetic preference alone.
