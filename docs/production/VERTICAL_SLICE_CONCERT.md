# Vertical Slice Contract — Arvan-Shahr: Concert Night
**Revision:** v0.2 / 2026-11-19. **Status:** Target specification; not implemented.  
Links: [GDD](../gdd/ARVAN_SHAHR_GDD_v0.2.md) · [Architecture](../architecture/ARVAN_SHAHR_ARCHITECTURE_v0.2.md) · [Codex plan](CODEX_EXECUTION_PLAN.md)

## 1. The promise

A new player opens the browser on a phone, sees a beautiful recognizable Iranian courtyard below a futuristic infrastructure city, starts a concert, understands the goal within 20 seconds, handles a series of increasingly complex service incidents via direct city taps and short action decisions, dispatches one drone, experiences a real live-stream interruption and recovery, and finishes the **same 7-minute mission** with a readable score and reasons for success/failure.

The game must be **fun without knowing what CDN or ingest means**; the optional technical panel explains the systems without turning gameplay into a console.

## 2. Must-have playable surface (single connected world)

| Zone | Visual target | Interaction | Sim connection |
|---|---|---|---|
| CONCERT | stylized Iranian courtyard, stage, animated audience, screens, warm lighting | tap venue / inspect streaming | streaming availability -> screen state / crowd reaction |
| DATACENTER | modular navy server district with cyan data tracks; 3 distinct nodes | tap node -> route demand / drone targeting | processing queues, heat, failure, recovery |
| CONTROL | small city command center and panel | inspect one or two alerts / choose failover or priority | mission command dispatcher / cooldowns |

Cinematography: 3/4 camera with one overview and three bookmarks; slow non-intrusive moves, short camera intro that is skippable. World appears continuous even if composed of 2.5D layered imagery. No free roam.

## 3. Gameplay minimum

**Tools (must work, not decorative):**
1. Route traffic to online node. Cannot route to busy/offline node; reject without consuming queue item.
2. Drone: select tool and target, visible travel and repair/cool animation, deterministic effect, recharge. Cannot dispatch while unavailable.
3. Backup broadcast: recover stream from scripted ingest failure; activation delay and capacity tradeoff. Prevent infinite spam.
4. Redistribute demand: one genuine policy choice between two available paths, visible change in load and queue.

**Incidents (3 required, 2 optional):**
- required: audience traffic burst (telegraphed)
- required: overheating and rack failure/recovery
- required: live ingest outage during main incident with backup recovery
- optional, only if polished: ticket gate latency, brief region/network degradation

**Decision-card moments:** at least two contextual choices across run, e.g. "protect broadcast" vs "prioritize entry". Each choice has a measurable consequence lasting at least 10 seconds and no misleading random result.

**Win:** complete configured event duration while avoiding prolonged broadcast/city collapse. **Loss:** sustained outage or audience trust at zero according to centralized balance. User can recover from individual rack failure and stream blackout before grace expires. Replay uses a fresh seed by default; debug seed fixed via test scenario.

## 4. Timeline acceptance

| Segment | 0–60 | 60–180 | 180–300 | 300–390 | 390–420 |
|---|---|---|---|---|---|
| Player learns | route, drone | node choice | service priority | backup + recovery | multi-task |
| City mood | calm | lively | projected concert starts | visible screen damage | ending show |
| Pressure | low | medium | medium-high | critical but bounded | high, fair |

At least one memorable event must visibly change **both infrastructure and city scene**. A mission ending at 90 seconds with a reskinned backdrop fails this milestone.

## 5. HUD acceptance at 360×800

Required permanently visible: timer, streaming status, one actionable alert, next interaction affordance, drone status. Queue and selected-node temperature can be a tiny compact row or be shown when zone selected.

No horizontal overflow; all tap targets >=44px; Persian text and digits; crisp icon+text for warning (not color only); no blocking modal during active incident. Pause and mute. First user action unlocks audio.

**Information hierarchy:**
- Top: show goal, time, stream state.
- Center: city interactive playfield (majority of vertical space).
- Bottom: 2–3 contextual buttons, active alert, actionable selection.
- Expanded optional panel: service graph, technical terms and precise node stats.

## 6. Content & asset list

**Must ship:** 1 layered city composition; 1 Iranian courtyard/stage; 1 distant dark infrastructure district; 3 rack characters × meaningful health/heat/offline states; 1 repair drone; 1 small control center; 3 critical city state variations (normal/buffering/blackout/recovery); one brief original atmosphere loop and procedural alerts or properly licensed audio; menu/tutorial/HUD/results; 1 offline-safe poster in case introductory video fails.

**Asset reproducibility:** Blender scripts specify version, seed, camera, lighting, frame names, output dirs and atlas packing. Source projects editable when actually generated. Record provenance and license. If no Blender, preserve fallback sprites and mark missing renders as missing.

**Art constraint:** cinematic screenshot is visual direction, not automatically an interactive scene nor permission to publish its video. Do not block gameplay on large cinematic video download.

## 7. QA and deterministic cases

Named deterministic scenario fixtures (all functional):
- concert_calm: no critical alerts, stable targets
- concert_peak: queue pressure, one overheating node
- concert_blackout: ingest failure with functional backup opportunity
- concert_recovery: drone enroute and backup stream warming
- concert_failure: known failure countdown, no graceful exit without action

**Unit acceptance:** same seed + commands -> identical state snapshots; queue FIFO; node offline rejection; heat and cooling; drone full state machine + cooldown; traffic/availability causality; no event without warning; incident overlap cap; grace period; win/loss; scores, save and replay.

**Browser acceptance:** menu → tutorial skip → play → city zone select → route → incident → drone → backup → recover → results → replay. Touch and mouse at 360×800, 390×844, 768×1024 and 1440×900. Screenshots of menu, calm, traffic peak, failure/recovery and results at phone and desktop. No uncaught errors. Interaction paths verified by both snapshot state and visual behavior.

**Performance acceptance (targets, not measured results):**
- >=30 fps on a real mid-range Android phone for the busiest incident, 45–60 preferred; keep peak frame spikes under control.
- initial compressed assets ideally <=6 MB and responsive to first input in ~4 s on representative 4G; show progress/preload fallback.
- low-power mode reduces particles/fog/ambience, not input rate or simulation correctness.
- offline game run should not require network fetch after assets loaded; local results persist (when browser storage allowed).

## 8. Definition of Done (release gate)

- [ ] npm ci, TypeScript build, lint, tests, browser build all green **on CI** with recorded logs.
- [ ] New mission available without breaking existing 90-second classic mode.
- [ ] All 3 zones are actionable; selections/hit areas follow camera transform.
- [ ] At least 3 required incidents, 4 real player actions, 2 meaningful decisions.
- [ ] At least one outage has fail and successful recovery routes.
- [ ] City display/crowd responds causally to streaming status; not timeline-only animation.
- [ ] Seven-minute mission can be fully completed and replayed; no unwinnable seeded scenario.
- [ ] Results distinguish win/loss and explain most important incidents.
- [ ] Visual quality matches reviewed style; no unlicensed logos, fonts or media.
- [ ] Real mobile manual playtest and four viewport automation screenshots checked.
- [ ] Edge packaging and upload verified in real Arvan account; build URL and submission rules verified before claiming competition readiness.
- [ ] Privacy/security: no credentials, telemetry or unapproved external APIs included.

## 9. Explicit out-of-scope

Open-world free roaming, multiple playable districts, extensive crowd AI, physics-driven city destruction, multiplayer, accounts, shop/upgrades UI, online scores, dynamic music generated by AI, real network streaming, procedural generation of entire city, any new backend.

## 10. Risk-first exit criteria

- **Gameplay first:** If the city looks excellent but no real service-choice gameplay exists, do NOT label vertical slice complete.
- **Art first risk:** If layered city rendering overwhelms mobile performance, use lower-resolution layers/atlas optimization, not a surprise engine rewrite.
- **Complexity risk:** if 4 tools confuse non-technical users, make redistribute a contextual card and keep 3 primary controls.
- **Brand/contest risk:** treat name and competition eligibility as pending; independent project needs explicit non-affiliation wording until cleared.
- **Current baseline vs target:** existing repo has a functional 90s Server Panic, not this 7min mission; any claim of completion requires fresh automated/manual evidence.
