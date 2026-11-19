# Arvan-Shahr: Concert Night — Game Design Document v0.2
# آروان‌شهر: شب کنسرت

**Status:** Design baseline / قابل‌بازنگری  
**Version/date:** 0.2 — 2026-11-19  
**Owner:** Independent game project  
**Repository:** https://github.com/jaavid/Server-Panic  
**Related:** [Architecture](../architecture/ARVAN_SHAHR_ARCHITECTURE_v0.2.md) · [Vertical slice](../production/VERTICAL_SLICE_CONCERT.md) · [Codex plan](../production/CODEX_EXECUTION_PLAN.md)

> **Decision taxonomy:** **LOCKED** = selected by project owner; **PROPOSED** = design starting value, requires playtesting; **OPEN** = unresolved. This is a design specification, not a claim that the new gameplay already exists in code.

## 1. High concept

آروان‌شهر یک شهر آینده‌نگر با هویت ایرانی است؛ زندگی عادی مردم بر زیرساختی دیجیتال، زنده و آسیب‌پذیر استوار است. بازیکن در نقش هماهنگ‌کنندهٔ عملیات پایداری، باید جریان یک کنسرت بزرگ و پخش زندهٔ آن را در برابر فشار ترافیک و خرابی‌های زنجیره‌ای حفظ کند. هر تصمیم فنی باید **پیامد قابل مشاهده در زندگی شهر** داشته باشد؛ از تصویر روی نمایشگرها و چراغ‌های میدان تا واکنش جمعیت.

**One-line pitch:** «وقتی تمام شهر کنسرت را تماشا می‌کند، تو نمی‌گذاری پخش قطع شود.»

**Title — LOCKED:** آروان‌شهر: شب کنسرت (Arvan-Shahr: Concert Night). «Server Panic / نجات سرور» نام حالت/مکانیک میراثی است، نه عنوان نسخهٔ جدید.  
**Genre — LOCKED:** Cinematic arcade strategy + lightweight incident management.  
**Platform — LOCKED:** mobile web first; desktop browser secondary; بدون حساب کاربری.  
**Mission length — LOCKED range:** 5–10 minutes. **PROPOSED default:** 420 seconds (7 minutes), fast-forward only for testing.  
**Audience — LOCKED:** عموم مردم؛ اطلاعات فنی بیشتر در لایهٔ اختیاری.  
**Tone — LOCKED:** جدی و سینمایی با طنز ظریف در جزئیات و واکنش‌ها.

## 2. Player fantasy & experience pillars

بازیکن نه یک سرور، بلکه **شب شهر** را نجات می‌دهد. از مرکز کنترل تصمیم می‌گیرد و پهپاد را برای عملیات محلی اعزام می‌کند؛ انتخاب او باید بر پخش زنده و حال‌وهوای شهر اثر بگذارد.

1. **شهر زنده:** وضعیت دیجیتال، بلافاصله روی صحنهٔ شهری بازتاب دارد؛ هیچ نموداری نباید تنها بازخورد اصلی باشد.
2. **تصمیم‌های کوتاه و معنادار:** بازیکن بین سرعت، ظرفیت، بازسازی و ریسک حق انتخاب دارد.
3. **ترکیب اتاق کنترل و عملیات میدانی:** اعزام پهپاد با انتخاب هدف و زمان رسیدن واقعی، نه دکمهٔ جادویی بی‌هزینه.
4. **فشار قابل پیش‌بینی و منصفانه:** بحران با هشدار می‌آید؛ چند راه بازیابی وجود دارد؛ یک اشتباه به باخت فوری نمی‌انجامد.
5. **بصری با ریشهٔ ایرانی، خوانا روی موبایل:** معماری حیاط ایرانی زیر شهر سرمه‌ای-سایان زیرساختی؛ دوربین سه‌ربع با pan/zoom محدود.

**Emotion curve:** آرامش کنسرت → اولین هشدار → کنترل هوشمندانه → فشار هم‌زمان → حادثهٔ بزرگ → نجات پرتنش → نتیجهٔ ملموس.

## 3. World & visual narrative

### Three interactive locations — LOCKED

| Zone ID | مکان | عملکرد | اثر شهر |
|---|---|---|---|
| concert | محوطهٔ کنسرت / حیاط ایرانی | نمایشگر، استریم، رضایت تماشاگران | روشن/تاریک شدن نمایشگر، انرژی جمعیت، صدا |
| datacenter | دیتاسنتر و لایهٔ زیرساخت بالای شهر | توزیع بار، صف، دما، نودهای پردازش | روشنایی خطوط انتقال، هشدار حرارتی و خرابی |
| control | مرکز کنترل | انتخاب اقدام، دیدن هشدارها، اولویت سرویس | داشبورد روایی و اعزام پهپاد به مقصد |

**Presentation:** یک صحنهٔ پیوستهٔ سه‌ربع/ایزومتریک با سه hotspot و دوربین محدود. برای نسخه اول لازم نیست بازیکن آزادانه در شهری با چندین خیابان حرکت کند. مرکز کنترل هم محل قابل‌انتخاب در شهر است و هم پنل تصمیم‌گیری آن باز می‌شود.

**Visual north star:** مرجع تصویری کاربر: گذر از معماری آجری و انسانی با نور گرم در پایین کادر به شهر ماژولار سرمه‌ای با کانال‌های دادهٔ سایان در بالا. نسخهٔ بازی از همان ترکیب الهام می‌گیرد اما کنتراست، شکل ساختمان‌ها و hitboxها برای 360px استایلایز می‌شوند. از کپی مستقیم عناصر برند یا فایل‌های محافظت‌شده استفاده نشود.

**Art rules:** silhouette readable; two visual channels for danger (shape/text + color); neon cyan for connectivity; amber for living spaces; red only for actionable danger; use original Persian geometry abstracted from arches, brick rhythms and courtyard proportions, not a literal real-world heritage building.

**Camera — LOCKED:** 3/4 angle, cinematic limited pan and zoom, no free fly camera, no mandatory pinch. Tap zone focus + clearly visible return-to-overview. Dramatic camera movement must never steal input while a critical action is required.

## 4. The moment-to-moment loop

**Observe → Identify → Prioritize → Act → Wait for consequence → Rebalance → Save the show.**

- Incoming traffic waves reach **service queues**; older rack-routing mechanic is preserved within datacenter.
- The player taps a **zone**, selects a node/service, and issues a contextual action. Actions are never silent: show projected impact, execution status, cooldown and outcome.
- Two to three alerts may overlap at a time; only one is critical by default in the early game.
- Selected decision cards introduce tradeoffs (e.g. protect livestream quality vs conserve backup capacity), but gameplay is not a text-only card game.
- Drone dispatch has clear **target → travel → repair/cool → return → recharge** states.
- After a crisis, a recovery window lets the player repair damage before the next predictable escalation.

### Proposed action set for vertical slice

| Action | Input | Benefit | Cost/tradeoff |
|---|---|---|---|
| Route request | tap available datacenter node | processes queued traffic / score | heats node; one active job per node initially |
| Dispatch drone | select drone then tap target | removes heat / repairs node | travel time + cooldown; cannot instantly save multiple targets |
| Activate backup stream | tap concert/control CTA, choose confirm | restores live continuity after ingest disruption | temporary capacity reserve / cooldown |
| Edge redistribution | select service then healthy node | shifts load away from stressed node | temporary processing cost / warming delay |

**PROPOSED:** 3 active, prominent tools maximum on 360px screen; less-used controls open in one compact contextual tray. CDN/cache boosting is a candidate event-card action, not a fifth permanent hotbar button.

## 5. Mission 01 — Concert Night

**Runtime target:** 420 s; no unskippable cutscene. First decision within 15 s. Tutorial should be optional and under 20 s. The venue is already active when play begins; the goal is keeping the broadcast and venue services alive until the finale.

| Time (PROPOSED) | Beat | Incident | Design purpose |
|---|---|---|---|
| 0–60s | Doors open | low traffic, teach routing and drone affordance | confidence & agency |
| 60–180s | Audience surge | queue pressure and warmer racks | allocation and tempo |
| 180–300s | Concert goes live | concurrent streaming + ticket validation | prioritization |
| 300–390s | Main incident | one guaranteed ingest/link disruption with warning + counterplay | tactical choice and recovery |
| 390–420s | Final encore | high but bounded wave and city response | satisfying payoff |

**Scenario seed:** event order and traffic variance deterministic by seed. Keep the scripted main incident and bounded sub-events. No random event may spawn without respecting a telegraph/grace interval, nor may it create an unavoidable chain failure.

### Service model (not a network simulator)

- **Streaming:** ingest → processing/transcoding → delivery capacity → viewers. User-visible indicators: stream health, buffering, audience reaction.
- **Ticketing/access:** queue of entry checks/purchases; critical at doors-open, lower priority during show.
- **Operations:** datacenter capacity, temperature, power/recovery and repair state.

Service health derives from **the actual simulation**; no fake randomized health meters. Alerts should be derived from causal state changes.

### Key player choices

- Route hot traffic toward a cooler but slower server or keep a faster node hot and risk downtime.
- Send drone to cooling vs use it on a failed relay, while backup streaming runs on cooldown.
- When simultaneous ticketing and livestream incidents occur, protect the stream at the cost of a temporary ticket queue.
- Decide whether to spend backup capacity early or hold it for the headliner.

## 6. Win, loss, scoring & feedback — PROPOSED starting rules

- Main display: **زمان تا پایان** and **پایداری پخش**. Supporting indicator: **رضایت شهر** (not a fourth full-width analytics chart).
- **Success:** complete 420 seconds without a sustained critical collapse; report stream uptime and audience trust.
- **Failure:** streaming fully unavailable for 30 continuous seconds, OR trust reaches zero and remains zero 15 seconds, OR all critical processing paths stay unavailable 25 seconds. All timers are configurable and **must be tuned with playtests**.
- **Recoverability:** a single node failure is never an instant failure; optional backup allows recovery. Warnings precede hard failure.
- **Scoring (draft):** packets processed + active stream uptime points + successfully mitigated incidents + small combo bonus − downtime/queue penalties. No score rewards for deliberately causing incidents.
- **Results:** successful/failed show; score; stream uptime percentage; incidents solved; best score per mission; number of drone deployments; replay; optional 1–3-star rating. Store locally for offline gameplay; an **optional competition-mode, privacy-preserving Edge-verified score + anonymous leaderboard** is proposed after the playable slice. See [Edge Games rules](../EDGE_GAMES_RULES_AND_ARCHITECTURE.md).
- **City feedback:** good stream = synchronized projection and warm animated crowds; degradation = buffering/flicker and visible restlessness; recovery = return of synchronized lighting and a small hopeful cheer. Avoid flashing effects that may cause photosensitivity.

## 7. UX & accessibility

- **Language:** Persian RTL for UI and Persian numerals; mixed English network acronyms should be isolated to LTR spans. IDs/code remain English. Apply the principles in [Sorkhab spec](../SORKHAB_DESIGN_SPEC.md), but the game is **not** an official Arvan interface.
- **360px HUD priorities:** (1) timer and stream health, (2) active alert, (3) large next action/selected target, (4) compact queue and drone recharge. Put secondary stats in an expandable panel.
- **Input:** tap first; 44–48px active targets; selection and targeting cancelable; camera pan must not be interpreted as a zone click; mouse and keyboard support on desktop.
- **Legibility:** always show a text/icon fallback for heat and availability; pause, mute and reduced motion; critical messages persist until state clears.
- **Cognitive budget:** one new mechanic per phase; no more than two simultaneously actionable decisions in the first minute; avoid tutorial walls.
- **No registration or player personal-data collection.** Core gameplay must work without a remote API; a small optional Arvan Edge challenge/verified-score API may run at start/end if proven compatible, without transmitting identifying data. No ads, trackers or external promotional links.

## 8. Sound & narrative tone

- Sound design: distant city hum, concert ambience, data pulses, drone thrusters, concise incident alerts. World-space positional sound should follow 3D zone anchors where helpful.
- Sound starts after interaction and is muted on request. Don't use copyrighted commercial concert music. Use original or properly licensed loops.
- Humor is subtle: server facial expression, a drone's apologetic wobble, a delayed stage-screen reaction. Never make citizen distress slapstick.

## 9. Art pipeline, delivery and performance

- Blender Python produces original stylized 3D modular buildings, server nodes, drone and environments as optimized GLB/glTF with baked lighting/lightmaps and versioned scene anchors. Render 3/4 transparent WebP/PNG atlases only for classic mode, cutscenes or distant/background layers.
- **ACCEPTED engine direction (ADR-0001):** Three.js + strict TypeScript + Vite for a real-time 3D city with constrained 3/4 camera and world-space picking. WebGL2 first; opt-in WebGPU only after measurements. Keep the existing Phaser/Canvas2D classic Server Panic as a separate legacy entry. The supplied opening video is a reference/cinematic asset, not evidence of a current playable 3D city. See [ADR-0001](../architecture/ADR_0001_THREEJS_CITY_RENDERER.md).
- Desktop centered playable viewport; responsive portrait first; optional landscape layout. Target 30 FPS minimum and 45–60 FPS where hardware allows, validated on actual device.
- Audit GLB geometry, draw calls, textures and download sizes; bake lighting, instance repeated buildings and lazy-load high-detail zone assets. Use locally served packaged assets and prefetch shortly before camera movement.
- Edge deployment: keep local build functional; verify the real competition/Edge route and upload limits. Existing docs describe a bundled worker fallback; new city assets may exceed the old one-file strategy.

## 10. Future progression (not in first slice)

- Multiple missions/chapters; expanding neighborhoods; operator/drone upgrades; non-pay-to-win cosmetics and daily challenges remain future features. The **competition-scoped anonymous Edge leaderboard** is addressed separately as an optional release enhancement, not progression.
- Each chapter should reuse the world model but have a distinct **player decision**, not only new scenery.
- No campaign UI unlock loop, economy, accounts, multiplayer, live AI generation or mandatory online requests in v0.2.

## 11. Edge Games competition requirements

The owner provided these additional constraints: some game logic on Arvan Edge (score validation, Arvan database leaderboard and optional AIaaS content) can improve judging; all violence, political/sexual content and ethnic/religious/gender insults are forbidden; advertisements and collection of player personal information are forbidden; fabricated visitors are disqualifying; original commercial-game logos/music/art must not be used; the registered competition URL must remain available through 14 Azar 1405; ownership remains with creator while Arvan may showcase it.

The proposed implementation is **optional edge-side score replay verification**, then **anonymous leaderboard** if Arvan Edge→DB connectivity and privacy are confirmed. AIaaS is a non-essential stretch goal with curated text, safeguards and local fallback. All new components stay outside the deterministic gameplay loop and may not compromise the no-login browser experience. The public competition page was not tool-readable on 2026-11-19; final terms must be verified directly. See [Competition rules and architecture](../EDGE_GAMES_RULES_AND_ARCHITECTURE.md).

## 12. Open decisions / assumptions register

| ID | Status | Assumption needing validation | Test or decision trigger |
|---|---|---|---|
| OD-01 | OPEN | rights/competition rules for using name «آروان‌شهر» | review trademark and competition terms; no official logo or endorsement until permission |
| OD-02 | PROPOSED | 420-second default session | 5 external players: boredom/pressure curve, adjust within 5–10 min |
| OD-03 | ACCEPTED (pending performance gate) | Three.js runtime 3D for new city, Phaser for classic | 3D P0 spike: real-phone FPS, bundle size, camera interaction |
| OD-04 | OPEN | exact drone repair vs cooling targeting model | paper/test with 360px HUD |
| OD-05 | PROPOSED | three tools + contextual decision cards | tutorial comprehension and mis-tap tests |
| OD-06 | OPEN | real venue/cultural architecture reference and licensing | art review; avoid identifiable copies |
| OD-07 | PROPOSED | service health / trust thresholds | seeded simulations for no unwinnable waves |
| OD-08 | OPEN | score/medal weights | playtesting after 20 completed runs |
| OD-09 | OPEN | streaming/ticketing UI names and optional advanced info | usability test with non-technical players |
| OD-10 | OPEN | actual Arvan Edge constraints, contest eligibility and submission format | test upload on account; check official terms; do not assume old worker fit |
| OD-11 | OPEN | character/personality count and crowd visual richness | frame-time/atlas budget after art import |
| OD-12 | OPEN | source assets and permission for the cinematic opening video | trace source, rights and version; never assume it can ship publicly |

## 13. Definition of done for GDD v0.2

This GDD is a **design baseline**, not a final production contract. A vertical slice is complete only when one full Concert Night run is playable on 360px mobile, player decisions causally impact city visuals, there are both recoverable crises and a meaningful fail state, all controls work, automated tests pass, and the deployment checklist is validated. See [acceptance matrix](../production/VERTICAL_SLICE_CONCERT.md).

## References

- User decisions, 2026-11-19: 12 locked direction choices.
- Existing repo: https://github.com/jaavid/Server-Panic (GameSimulation, Phaser and Canvas2D renderers, 90-second Server Panic game).
- Design reference: https://sorkhab.arvancloud.ir/ (official Sorkhab design system; inspiration only).
- AI game development practices: https://developers.openai.com/blog/how-to-build-games-with-astra ; https://developers.openai.com/showcase/games
