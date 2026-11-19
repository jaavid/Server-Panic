# Codex Execution Plan — Arvan-Shahr: Concert Night
**v0.2 — 2026-11-19**  
**Intent:** Execution-ready roadmap; each milestone ends with one independently reviewable PR. No new game logic is claimed to be implemented by this planning PR.

Read before coding:
1. [GDD v0.2](../gdd/ARVAN_SHAHR_GDD_v0.2.md)
2. [Architecture v0.2](../architecture/ARVAN_SHAHR_ARCHITECTURE_v0.2.md)
3. [Vertical slice acceptance](VERTICAL_SLICE_CONCERT.md)
4. [Sorkhab adaptation](../SORKHAB_DESIGN_SPEC.md)
5. [Arvan deployment constraints](../ARVAN_DEPLOYMENT.md)

## Global Codex operating contract

- **Repository:** jaavid/Server-Panic. Inspect current main and uncommitted work first. Do not overwrite parallel human/Codex changes or force-push.
- **Branch per milestone:** feature/arvanshahr-p0-baseline, feature/arvanshahr-p1-simulation, etc. Each subsequent PR branches from updated main **after merge** to avoid duplicate changes.
- **Small verifiable PRs.** Do not combine simulation refactor, full Blender assets and deployment in one PR.
- **Use existing tools/stack:** TypeScript strict, Phaser 3, Vite, Vitest, Playwright, Blender Python. No React, runtime Three.js, backend or third-party live services unless a separate ADR and user approval exist.
- **Preserve legacy game:** Classic Server Panic remains playable throughout. Create new mission mode; avoid destructive renames until parity.
- **No mock success:** simulation metrics must be real; screenshots from actual render, not a conceptual design presented as implementation.
- **Measure before claim:** npm ci / npm test / npm run build / npm run lint / npm run test:ui, real browser captures, relevant FPS and memory metrics. Report exactly what passed and failed.
- **GDD in parallel:** Every mechanic-affecting PR updates the GDD decision log, affected balance assumptions and acceptance criteria. User choices labelled LOCKED are not to be silently changed.
- **Performance mobile-first:** test 360×800 first and don't let polished intro hurt interaction latency.
- **Brand independence:** don't bundle Arvan trademarks/logos/fonts without verified rights; use Sorkhab's interaction principles as guidance only.

## PR sequence (strict dependencies)

| ID | PR scope | Dependencies | Concrete exit gate |
|---|---|---|---|
| P0 | Baseline audit, CI + test harness | None | Classic mode builds/tests on CI; known defects documented; browser screenshot; sample dev inspect API |
| P1 | ConcertSimulation + MissionDirector + deterministic incidents | P0 | Unit tests for 7min clock, services, backup, recovery, fairness, fixed seeds |
| P2 | Whitebox 3-zone city interaction + camera bookmarks + minimal HUD | P1 | Playable 420s scenario with city taps, 4 actions and results (placeholder art allowed) |
| P3 | Blender city pipeline + 3 visual city states + drone animation | P2 interface contract | Real generated art / atlases / license manifests; no broken hitboxes |
| P4 | Visual/game feel polish + Sorkhab-inspired RTL HUD | P2 + P3 | Honest city feedback, clear mobile controls and audio/motion options |
| P5 | Real mobile QA, balance and Arvan Edge packaging | P4 | Full test suite and performance, verified deployment or explicitly blocked |

**Parallelism:** Asset technical artist can build scripts in P3 branch during P2, but must use agreed atlas manifest/coordinate interface and be rebased after P2. GDD document owner reviews changes with every PR. Avoid parallel edits to GameSimulation.ts or balance.ts.

## P0 — Establish a trustworthy baseline

1. Confirm clean checkout and HEAD/branches; inspect README, package, source and existing tests.
2. Run npm ci; npm test; npm run build; npm run lint; npm run test:ui. Separate environmental failures from code defects and attach actual logs.
3. Review fixed-step + tab suspension: existing GameSimulation.advance clamps elapsed to 0.2s per frame; specify a testable policy for hidden-tab behavior before expanding to 7 minutes.
4. Add simple CI (GitHub Actions) and record artifact screenshots.
5. Gate the future dev inspector behind dev/test flags. Add deterministic snapshot fixture for classic game before refactor.
6. Add one README section linking GDD v0.2.

**Acceptance:** legacy playable and repeatable, no project-specific secret or private production studio committed, CI checks reported.

## P1 — Build mission systems without city art

Implement typed ConcertSimulation, service dependency graph and mission clock, action validation, drone state machine, streamed availability calculation and short deterministic incident timeline. Derive city trust from delivered service quality rather than arbitrary random animations. Keep all balance numbers in a mission config.

**Required tests:** command ordering; seed determinism; backup delayed activation; offline route block; drone target validation/cooldown; thermal behavior; grace conditions; impossible crisis detection; 420s victory and failure; no double-counting elapsed time.

**Acceptance:** headless 7-minute simulated run reaches valid win and loss outcomes with test commands; classic unaffected.

## P2 — Whitebox playable vertical slice

Create three logical zones: courtyard venue, datacenter and command center. Use simple original placeholder layers and named camera bookmarks. Wire pointer coordinates to world coordinates and inspect cards. Stream health affects screen brightness and audience status in the actual game. Two decision cards must have observable effects. Include pause, mute, input cancellation and results/replay.

**Acceptance:** full run in Chromium with touch controls and no JS error at 360, 390, 768 and 1440 widths; screenshots attached. Do not begin elaborate art polish before this passes.

## P3 — Reproducible production art

Generate via Blender Python:
- stylized Iranian arcade courtyard and stage, warm lighting and original geometric details;
- futuristic navy modular server district with cyan data lines;
- control hub, racks and repair drone with interaction states;
- transparent orthographic render layers and atlases, stable frame names;
- muted/normal/critical/recovering animation variants for stage display and city state.

Record asset manifest (anchoring, camera rig, layer depth, hitboxes), version, seed, dependency setup and exact build commands. Include licensing notes and an art approval sheet. If Blender unavailable, mark step blocked and continue playable fallback, never claim 3D render was performed.

**Acceptance:** repeatable asset export and screenshot diff inspected by art/design reviewer; mobile frame time/size budget evaluated.

## P4 — Interface and game feel

- Build minimal mobile-first RTL HUD; inline LTR technical strings; Persian digits; status as color + icon + text.
- Use inspired component/token patterns from Sorkhab, not its unlicensed brand assets.
- Clear warning escalation and cooldown; tactile pressed states; significant city feedback synced with simulation.
- Add audio unlock/mute, reduced motion, small scene transition, floating score if meaningful.
- Usability: 5 people unfamiliar with CDN can start and react without developer narration.

**Acceptance:** critical alerts aren't hidden by overlays; camera motion cannot steal action; before/after screenshots and user testing notes attached.

## P5 — Release hardening

- Run CI and browser screenshot baselines; on-device Android FPS/memory, 7-minute end-to-end runs, slow-network loading.
- Verify new build size vs Arvan Edge worker limitations; if bundled worker exceeds constraints, research verified static asset mechanism and document new deployment ADR.
- Publish only with approved account access; test a real arvanedge.ir URL and verify official Edge Games participation terms. Do not fabricate deployment URL.
- Check independent brand identity, licenses and credits.
- Publish competition build tag only if all vertical slice release gates green.

## Master prompt to start Codex (copy as-is)

~~~text
You are upgrading jaavid/Server-Panic to the first vertical slice of
"Arvan-Shahr: Concert Night" (آروان‌شهر: شب کنسرت).

Read in this order:
docs/gdd/ARVAN_SHAHR_GDD_v0.2.md
docs/architecture/ARVAN_SHAHR_ARCHITECTURE_v0.2.md
docs/production/VERTICAL_SLICE_CONCERT.md
docs/production/CODEX_EXECUTION_PLAN.md
docs/SORKHAB_DESIGN_SPEC.md
docs/ARVAN_DEPLOYMENT.md

These documents distinguish LOCKED user decisions, PROPOSED balance values
and OPEN questions. Do not silently replace locked design choices.
Do not assume the cinematic reference is already in the repository.

Begin with milestone P0 ONLY, not all milestones at once.
Inspect current HEAD, branch and working tree first. Preserve ongoing work,
existing Server Panic classic mode, and the Phaser/CanvasRenderer architecture.
Create a dedicated feature branch and a small reviewable PR.

P0 tasks: establish clean dependency installation/build/test/lint/browser
baseline with logs, correct verified defects, add/repair CI, confirm the
simulation fixed-step and tab-resume policy, and add dev-only deterministic
inspect hooks. Do not invent passed test results. Document blockers honestly.

Run all relevant commands, record actual results, capture real browser
screenshots, update project docs/decision log when behavior changes, and
return PR URL, changed files, verified tests, known limitations and next gate.
No deployment or external credentials without explicit permission.
~~~

## Next prompts after each merge

**P1 prompt:** "Implement only P1 from docs/production/CODEX_EXECUTION_PLAN.md. Use deterministic seeded domain simulation and MissionCommand contracts. Show actual Vitest pass/fail and playback fixtures; preserve Classic."

**P2 prompt:** "Implement only P2. Real three-zone whitebox city scene, cinematic limited 3/4 pan/zoom, touch target mapping, routed traffic, drone and backup-stream actions. Demonstrate a full mission and real Playwright screenshots on four viewports."

**P3 prompt:** "Implement only P3. Respect the shared manifest/anchors. Create reproducible Blender Python assets and optimize/export atlases; show generated files and real performance/size measurements. Never fabricate renders."

**P4 prompt:** "Implement only P4. Improve visual feedback, city reactions, Sorkhab-inspired RTL game UI, accessible targeting and audio; verify 360px and 7-minute playtest."

**P5 prompt:** "Implement only P5. Run final CI/E2E, manual Android QA, balance analysis, verify actual Arvan Edge requirements and only then prepare a competition-ready build with deployment evidence."

## Change control and GDD synchronization

Whenever playtest evidence motivates a change, make a small pull-request note:

~~~text
Design change:
Observed problem:
Measured/reproducible evidence:
Alternatives considered:
Proposed tuning and impacted systems:
GDD section + test updated:
Needs project-owner approval (yes/no):
~~~

No milestone is "done" merely because a screenshot looks right or TypeScript compiles. Vertical-slice signoff requires the checklist in VERTICAL_SLICE_CONCERT.md.

## Known planning risks

1. **Art-first trap:** do not build a full city before interactive mechanics exist.
2. **Engine churn:** user selected camera behavior, not runtime 3D architecture. Prove 2.5D inadequate before migrating.
3. **Legacy conflict:** never replace the classic 90-second mode without a safe migration.
4. **Scope creep:** multi-episode progression, economy and upgrades are design groundwork only.
5. **Arvan/rights:** independent project with potentially confusing name; validate terms and permitted marks.
6. **Deadline pressure:** choose a truthful demo with complete loop over a large unfinished world.
