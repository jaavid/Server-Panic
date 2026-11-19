# ADR-0001: Three.js as the Arvan-Shahr city runtime (2026-11-19)

**Status:** ACCEPTED as design direction for the next playable slice. This decision does not mean the 3D port has been implemented or benchmarked.

## Context

The first Server Panic prototype was a 90-second 2D arcade game using Phaser 3, deterministic TypeScript GameSimulation, a Canvas2D standalone fallback, and pre-rendered rack sprites. The product has now pivoted to **آروان‌شهر: شب کنسرت**: a 5–10 minute, three-zone interactive city mission with cinematographic 3/4 camera movement, dimensional infrastructure, a flying drone, direct touch selection of buildings, and visible consequences on the concert venue.

The visual reference is a layered Iranian courtyard and futuristic city rendered as a 3D scene. It is **reference art**; a runtime implementation may need different lighting/LOD to reach mobile frame budgets. A fixed 2.5D projection could mimic one camera angle, but full positional camera movement, true occlusion and drone travel between 3D locations require complex custom hacks and multiple 2D art variants.

### External facts
- Phaser 4 remains a **2D engine**, per the Phaser team: https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update . Phaser AE is a separate non-open-source product with different APIs, not an upgrade to the Phaser npm package.
- Three.js supports Blender-produced glTF with \`GLTFLoader\` and compressed textures via \`KTX2Loader\`, world-space selection with \`Raycaster\`, and instancing to reduce draw calls: https://threejs.org/docs/pages/GLTFLoader.html ; https://threejs.org/docs/pages/Raycaster.html ; https://threejs.org/docs/pages/InstancedMesh.html .
- PlayCanvas is a valid standalone engine with WebGL2/WebGPU, scene/component framework and editor: https://developer.playcanvas.com/user-manual/engine/ . Babylon.js is a capable full 3D engine: https://www.babylonjs.com/specifications/ .
- OpenAI's game building report uses a TypeScript/Vite/Three.js approach, with deterministic scenario tests, debug hooks and measured optimizations: https://developers.openai.com/blog/how-to-build-games-with-astra .

## Decision

**NEW ARVAN-SHAHR WORLD:** Three.js + TypeScript (strict) + Vite, running **WebGLRenderer (WebGL 2)** as the default initially; WebGPU renderer is a later evidence-based option after benchmarks. Do not force WebGPU as a day-one requirement.

**GAMEPLAY:** retain pure TypeScript simulation systems, seeded RNG, Vitest, typed commands and events, with no engine import inside the domain layer. Move the 7-minute mission to a separate \`ConcertSimulation\` module with a fixed tick.

**3D ASSET PIPELINE:** Blender procedural modeling and source \`.blend\` files; GLB/glTF scene exports; low polygon counts, lightmaps/baked lighting, compressed textures (KTX2 where measurable), instanced repeated props, LOD/culling. Blender still may render high-quality stills for introduction/cutscenes; those images are not clickable runtime geometry.

**UI:** native DOM/CSS overlay with RTL Persian and Sorkhab-inspired micro-kit, not an embedded heavy UI framework. Preserve touch sizing, accessibility, safe areas and local score storage.

**LEGACY CLASSIC MODE:** preserve existing Phaser 3 + Canvas2D classic game behind a separate entry and code-split loading path. Do **not** render Phaser and Three simultaneously. No hard rewrite until Three.js vertical proof-of-concept passes.

**CAMERA/INPUT:** \`PerspectiveCamera\` (narrow field of view) or \`OrthographicCamera\` selected after a visual comparison using actual GLB assets; constrained pan, zoom and fixed azimuth/elevation for 3/4 appearance. \`Raycaster\` from normalized pointer coordinates; 3 named camera bookmarks + focus transition. No general orbit controls/free camera in MVP.

**DEPLOYMENT:** output remains browser HTML+JS+assets. Arvan Edge runtime restrictions/asset serving must be verified in the account. Do not assume a larger GLB fits inside the existing single-file Edge worker.

## Alternatives weighed

| Option | Fit for new city | Drawback in this project |
|---|---|---|
| Keep Phaser 3/4 + 2.5D city | Very good if view is fixed and only sprites animate | 3D occlusion, camera reframing and drone flight need baked angles/special-case math |
| **Three.js** | Direct Blender glTF, authored camera, raycasting, minimum architecture for code-first simulation | Must build own scene/game orchestration and performance budgets |
| Babylon.js | Rich 3D game features, debugging, mobile scene tooling | Extra engine systems beyond this no-physics simulation; larger migration surface |
| PlayCanvas Engine | Capable WebGL/WebGPU game engine, scene editor optional, good art workflows | Scene/editor and ECS coupling not needed for current code-first small team; still a credible fallback |
| Godot web export | Complete game editor and scripting | New toolchain/runtime/export behavior, more complex Arvan and mobile load considerations |

This is not a claim that Three.js is universally faster or lighter; actual mobile profiling decides. Use **PlayCanvas** as the first re-evaluation candidate if future work becomes content-heavy with numerous non-programmer scene designers.

## Non-negotiable architecture constraints

1. Preserve original source code and existing Classic mode until new vertical slice is verified.
2. 3D renderer only reads mission snapshots and may emit typed commands; renderer never owns resource economics.
3. Asset names, zone anchors and hit volumes are stable, versioned contracts from Blender to TypeScript.
4. Frame-time budget: start with 30 FPS floor on a real midrange Android and aim for stable 45–60 FPS; adapt render resolution/props dynamically, not simulation ticks.
5. Limit startup download (initial target <= 6 MB compressed, subject to actual art), use lazy loading and fallbacks.
6. Baked illumination and selective real-time lights; avoid dozens of shadow-casting lights and high-resolution real-time shadows.
7. Instancing for repeated server housings, windows, bricks and city structures; sensible draw-call budgets measured per scene.
8. Use a dev-only inspect API, deterministic incident fixtures, screenshot tests on all agreed viewports and real-device testing.
9. Keep gameplay legible on mobile — a photorealistic opening is worthless if touch targets and alerts disappear.

## Migration plan and exit tests

**P0:** Baseline Classic, tests and CI; build a **3D technical spike** in separate Vite entry using three.js and a minimal GLB exported from Blender. Features: courtyard + 3 infrastructure structures + 3 clickable zone proxies + drone + camera 3 bookmarks; measure first load/geometry count/texture bytes/draw calls and FPS. No gameplay rewrite yet.

**P0 gate:** real screenshots at 360x800 and 1440x900; hit test on 3 locations; camera pan/zoom and drone flight; WebGL2 fallback error handling; baseline FPS and bundle size from machine where available.

**P1:** Develop new ConcertSimulation and event systems independently from any rendering engine.

**P2:** Connect simulation to Three.js city, mission HUD and actions. Retain Classic as a separate optional mode.

**P3:** Build complete Blender asset generation/export pipeline and mobile-optimized runtime GLB scene.

**P4:** Polish visual feedback/camera, accessible Sorkhab-inspired UI, touch target and audio.

**P5:** Real mobile testing, balanced mission completion, Arvan Edge packaging and verified deployment.

### Revisit conditions

- The 3D tech spike fails the 30 FPS floor or download budget on target Android even after optimization.
- The camera turns out to be fully fixed and no mission genuinely needs depth-dependent world interactions.
- Collaboration shifts toward a designer-heavy workflow requiring a visual game editor, making PlayCanvas preferable.
- Real Arvan Edge packaging prevents deployable size/asset strategies.

## Scope note

This ADR updates the earlier *proposal* of 2.5D Phaser as production city renderer, **not** the user's locked GDD choices. User chose a 3/4 camera and interactive city, not a particular engine. The v0.2 design and implementation plan must now treat Three.js as the new city renderer and Phaser only as a legacy Classic mode option. No new browser game has been shipped by this ADR.
