# Arvan Edge Games 1405 — Competition Compliance & Edge Features

**Status:** Design requirements / NOT implemented or deployed  
**Updated:** 2026-11-19  
**Applies to:** «آروان‌شهر: شب کنسرت» and public competition build  
**Related:** [GDD](gdd/ARVAN_SHAHR_GDD_v0.2.md), [Three.js ADR](architecture/ADR_0001_THREEJS_CITY_RENDERER.md), [Vertical Slice](production/VERTICAL_SLICE_CONCERT.md), [Codex plan](production/CODEX_EXECUTION_PLAN.md), [Deployment](ARVAN_DEPLOYMENT.md).

## 1. Evidence and rules register

**Rules reported verbatim in substance by project owner from the competition:** These are treated as release requirements. The official competition page https://try.arvancloud.ir/edge-games/ was not retrievable from our research tool on 2026-11-19. Before the final submission, verify the exact current text and interpretation directly in the page/panel, and retain a screenshot/archived copy for internal release audit.

| ID | Source rule | Project interpretation / release obligation |
|---|---|---|
| REG-01 | Running *some* gameplay logic at the Edge (e.g. Arvan DB leaderboard, edge-side score validation, AIaaS generation) improves judging | Add **genuine server-side computation** where feasible. Static deployment alone may not qualify for the extra criterion. Any implemented feature must actually run on Arvan Edge and be demonstrable. |
| REG-02 | No depictions of violence, political or sexual messages, nor insults based on ethnicity, religion or gender | No fights, injured crowds, weapons, political slogans, hateful text, sexual visuals, or insulting dialog. Nonviolent technical incidents (buffering, server overheating and outage) are acceptable *design candidates* pending rules review. |
| REG-03 | No advertisement and no collection of player personal data | No sponsor banners, self-promotion, outbound advertising links, trackers, signup, email/phone/name collection, user-generated handles, or identifying analytics. No personal identifiers stored with scores. Verify CDN/Edge logging and DB operator behavior before go-live. |
| REG-04 | Fake/artificial visitor acquisition is cheating and results in disqualification | No bot traffic, click farms, paid artificial views, automated public-hit checks intended to inflate unique player numbers, traffic-replay schemes, or fake engagement. Test automation uses localhost/staging, never the published competition URL for load tests. |
| REG-05 | Inspiration from and naming classic games is allowed | Inspirations may inform mechanics, but do not assume this grants rights to unrelated modern marks or official Arvan branding. |
| REG-06 | No original game-commercial logos, music or graphics | All art, fonts and SFX must be original or properly licensed; document provenance and commercial/distribution license. |
| REG-07 | Game remains accessible on **the same registered URL** until results announced on **14 Azar 1405** | Stable URL, monitor availability, do not break/remove route or change public hostname, maintain rollback and certificates through 14 Azar. Announcement still requires on-time registration. |
| REG-08 | Game ownership remains with creator; Arvan can showcase it for competition | Confirm that any included third-party material is licensed for this display/use; no exclusive transfer is implied by the quoted provision. |

**Related public announcement:** [official Arvan Telegram](https://t.me/s/arvancloud) states competition registration by **9 Azar 1405**. The user-provided rule establishes the **14 Azar** availability requirement. Treat both as separate gates; re-check the official competition page when it loads. A press report also corroborates publication/registration and availability through 14 Azar: https://xnet-ai.com/news/news-zoomit-3a4b703999a3703f/.

## 2. Changed architectural priority

Original v0.2 GDD intentionally had localStorage scores and no backend. For the **competition track**, preserve the offline playable core, but add one *small optional Edge capability* **after** the simulation and 3D world are demonstrably playable.

Priority order:
1. **A. Actual score verification in Arvan Edge worker** (high judging relevance; server-side logic).
2. **B. Anonymous public leaderboard backed by an Arvan-compatible database** (high relevance but requires confirmed Edge→DB connectivity, credentials, quota and privacy assessment).
3. **C. Arvan AIaaS-generated flavor content** (optional stretch goal only; after game release gates, and only if runtime/connection/policy confirmed).

No live backend is required to START or COMPLETE a game; the scoreboard should degrade gracefully if unavailable. Avoid holding gameplay hostage to a remote call.

### Example API contract — PROPOSED, NOT IMPLEMENTED

\`POST /api/run/start\`
- Response: \`{ runToken, seed, rulesetVersion, issuedAt, expiresAt }\`.
- Edge signs a short-lived challenge with a secret **not present in browser code**. The browser must not supply its own authoritative seed. Set strict expiry and prevent one token being submitted more than once; verify token storage strategy with available DB.
- The runToken is a **one-run validation token**, not a persistent user ID. Avoid cookies and tracking across sessions.

\`POST /api/run/finish\`
- Request: \`{ runToken, commands: [{ tick, type, targetId, ... }], clientScore? }\`.
- Edge verifies challenge signature, expiry, one-use status and plausible wall-clock duration; reruns the deterministic game simulation using version-pinned rules, original seed and chronological input commands. Edge computes the **authoritative score** and ignores the claimed clientScore. Validate command count/rate/cooldowns and bounds; limit payload size and execution cost.
- Response: \`{ accepted, verifiedScore, anonymousRank?, reasonCode? }\` (safe errors, no token leakage).
- Limits of this approach: deterministic replay checks impossible claims, but cannot prove a human operated the client or prevent algorithmic perfect play; do not claim full anti-cheat.

\`GET /api/leaderboard?limit=20\`
- Read-only aggregated **anonymous** ranked entries: \`[{ rank, score, missionId, badge }]\`. Badge should be randomly assigned non-identifying generic labels ("اپراتور ۱۲"), not user-submitted free text or a stable player identifier.
- Database retains only minimum competition data (verified score, coarse timestamp/date, rulesetVersion, challenge consumption state with short TTL). Avoid IP, email, name, phone, user-agent, fingerprint, raw request headers, persistent unique IDs and third-party analytics.
- Challenge replay logs and session tokens should have short retention; check whether any emitted log from Cloudflare/Arvan automatically records an IP and whether that conflicts with strict organizer rules. No database table is privacy-neutral by default.

**Open technical gate:** Official Arvan Edge service constraints and connection methods from Edge compute to managed database, secret injection, quotas, runtime crypto and traffic policies have not been verified. DO NOT invent a database binding or store production credentials in the repository. The end-to-end leaderboard feature remains a proposal until this is proven.

### Edge AIaaS stretch goal (not required)

If the team chooses the optional integration, use a **server-invoked, curated and reviewable** small set of short nonpolitical/peaceful incident captions or daily mission flavor text, seeded by day, never player prompts. Feed it through strict JSON schema and allowlisted categories; sanitize and review before presentation; cache the approved result and keep deterministic offline fallback. Do **not** let AI modify the physics/incident difficulty in an unreplayable way. No player data sent to AIaaS. Keep inference keys at Edge only, budget calls and timeout. The runtime API compatibility and content safety enforcement still need validation.

## 3. Content & brand review

- The scene contains a lively concert, crowd and gentle technical disruption; keep crisis feedback **nonviolent**. No explosions causing harm, injured people, aggressive policing, realistic disaster victims, sexualized avatars or real political slogans.
- Original instrumental audio only; no cover songs, copied commercial performance visuals, branded posters or celebrity likenesses.
- Because the project is **independent**, title «آروان‌شهر» has an unresolved potential trademark/endorsement/advertising interpretation. Do not add official Arvan logo or claim corporate sponsorship. Review name against contest rules and request permission if necessary; preserve easy renameability through config/metadata.
- Even a link to GitHub, personal portfolio or cloud sponsor inside the game may be read as an advertisement. Keep public gameplay free of external CTA/banners. Source/license acknowledgements can live in repository documentation unless public in-game credits are confirmed acceptable.
- Any generated scripts/UI strings must be checked for restricted themes and discriminatory language. Keep AI (if used) only on predefined safe topics.

## 4. Distinguish competition score from player score

The competition may measure **unique visitors/player activity** using Arvan-side systems. We do **not** implement independent tracking of unique visitors because personal-data collection is disallowed. An anonymous leaderboard is a game feature, **not** the official competition counting mechanism. Do not claim a game score influences the judge's unique-player metric.

The production public URL must not be used for automated browser screenshot sweeps, synthetic benchmarks or traffic tests that could corrupt official usage metrics. Use localhost or a private staging route. Real humans may play and revisit normally.

## 5. Deployment & date gates

- **By 9 Azar 1405 (announcement deadline, verify):** obtain real \`*.arvanedge.ir\` URL, verify public mobile/desktop playability, submit *that exact URL* via official competition form. Store submission confirmation internally.
- **Through 14 Azar 1405:** maintain availability at exactly the registered URL (even if implementation is upgraded behind same route), certificates, DB if ranking enabled, error-free gameplay and rollback path.
- Keep a deployment log: date/time, hostname, Edge app/version ID, release SHA, health check, screenshots, rollback procedure. Do not invent URL or claim live release without access.
- Arrange in-account uptime review/monitoring that doesn't generate fake play events. Technical health checks should be limited to \`/healthz\` in a way confirmed not to count as fake visits; if uncertain, avoid automated external polls and use deployment/panel monitoring.
- Validate real Edge request/response behavior, allowed methods, origin limitations and asset caching. For GLB textures, verify supported asset delivery; the existing single-file worker is insufficient as proof for 3D build.

## 6. Compliance QA checklist (hard release gates)

- [ ] No forbidden content or insensitive jokes in all Persian/English text, assets, audio, cinematic intro and AI-generated content.
- [ ] No ads, sponsor assets, promotional CTA, outbound marketing links in public game.
- [ ] No registration, user-provided nicknames, email/phone, IP/user-agent storage, fingerprinting or third-party analytics.
- [ ] Scoreboard data fields and retention policy reviewed; provider automatic logs assessed.
- [ ] Only valid/verified scores inserted; invalid score/cooldown/duplicate/challenge replay requests rejected.
- [ ] No secret in client bundle; edge routes enforce method/content type/body size and timeout; DB credential least privilege.
- [ ] Production target has no test bots, public-URL load tests or fabricated traffic.
- [ ] Original/license provenance for all art, logos, fonts, audio and video; independent project brand checked.
- [ ] Real Arvan Edge deploy tested and remains accessible under registered URL through 14 Azar.
- [ ] No fake "connected to Arvan database/AIaaS" messages if those integrations are not yet real.
- [ ] Game works when score API or AIaaS is down.
- [ ] Review organizer's actual rules in their browser before submission, since official page was not tool-readable.

## 7. Codex execution additions

- **P0 / P1:** keep shared deterministic rules serializable and replayable at Edge, version score formulas, define canonical run transcript schema. No leaderboard writes yet.
- **P2:** polished offline-capable game and score UI fallback; no account.
- **P4 parallel spike (after core loop is validated):** verify real Edge route, HMAC/crypto and database connectivity on Arvan's service with non-identifying synthetic data in a private test environment. No requests to public competition URL.
- **P5 optional competition increment:** implement validate-and-score worker and DB leaderboard only after technical and privacy gates; add adversarial replay tests, body limits, rate/cost limits not based on prohibited identifiers. AIaaS is optional after validated leaderboard.
- Keep PRs separate: simulation replayer, Edge worker, DB schema/integration, UI, deployment. Avoid implementation until API/permissions are verified.

**This file defines policy and engineering requirements only; no new Edge/database/AIaaS features have been implemented here.**
