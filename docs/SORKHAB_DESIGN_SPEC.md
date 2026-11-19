# Server Panic × Sorkhab — design specification / مرجع تطبیق طراحی

**Reviewed:** 2026-11-19  
**Official source:** https://sorkhab.arvancloud.ir/  
**Scope:** UI/UX adaptation guidance for the independent game *Server Panic*. This is **not** certification of affiliation, brand compliance, or an official Arvan game.

## 1. Source authority

Sorkhab («سرخآب») is the **official Arvancloud digital-product design system**, not the independent Dribbble «Arvan Cloud Concept» UI kit used as a tentative reference in the previous research note. The prior `ARVAN_VISUAL_ALIGNMENT.md` should be considered superseded by this document for product UI rules.

The public site organizes content into three pillars:
- **Foundations**: color guidelines, direction (RTL/LTR), micro-kit, UX writing.
- **Components**: 26 entries visible in the navigation (button, card, alert, toast, badge, modal, etc.).
- **UX Patterns**: 10 entries visible in the navigation (structure, internal navigation, main action, lists, resource flows, etc.).

Primary sources:
- About system: https://sorkhab.arvancloud.ir/about-design-system/
- Color: https://sorkhab.arvancloud.ir/foundation/color-guideline/
- Direction: https://sorkhab.arvancloud.ir/foundation/direction/
- Micro-kit: https://sorkhab.arvancloud.ir/foundation/micro-kit/
- UX Writing: https://sorkhab.arvancloud.ir/foundation/ux-writing/
- Button: https://sorkhab.arvancloud.ir/components/button/
- Card: https://sorkhab.arvancloud.ir/components/card/
- Badge: https://sorkhab.arvancloud.ir/components/badge/
- Alert: https://sorkhab.arvancloud.ir/components/alert/
- Toast: https://sorkhab.arvancloud.ir/components/toast/
- Modal: https://sorkhab.arvancloud.ir/components/modal/
- CTA pattern: https://sorkhab.arvancloud.ir/ux-pattern/main-action/
- Section: https://sorkhab.arvancloud.ir/components/section/

## 2. Verified design rules (Sorkhab source; **not game-specific proposals**)

| Topic | Sorkhab documented guidance |
| --- | --- |
| Structure | Tokens → Components → UX Patterns; consistency, predictable behavior, clarity, accessibility |
| Spacing | Base **8 px** spacing system (about-design-system) |
| Colors | Three levels **Base-Variant**, **Theme**, **Color**. Semantic roles **background/foreground/stroke** (BG/FG/ST). Contrast levels **T1/T2/T3** and, in public color layer, **T4**. |
| Color states | `default`, `hover`, `press`, `focus`, `select`, `disable` where provided. `BG0`/`FG0` are theme-invariant. |
| Color naming | Exemplars include `neutral/bg1`, `error/fg1`, `status/fresh-green/fg2`; public layer has named semantic tokens. |
| Color accessibility | Use contrast, never assume purely decorative color is sufficient; state and intent matter. |
| RTL | Right-align Persian; Persian digits; **Yekan Bakh** recommended; right-to-left order for buttons/icons; arrows mirror as appropriate. |
| LTR | Left-align Latin text; English digits; **Inter** recommended. Segregate mixed-direction segments. |
| Button medium | Height `40px`, icon `20px`, gap `8px`, horizontal padding `16px`, radius `12px`; button label short, usually ≤ 3 words. |
| Button small | Height `32px`, icon `20px`, gap `8px`, horizontal padding `16px`, radius `8px`. |
| Card | Padding `16px`, radius `8px`, `1px` normal border, `2px` selected border; selection should not cause layout shift; avoid nested actionable targets. |
| Badge | `Status` dot or content pill; semantic `Primary`, `Neutral`, `Danger`, `Info`, `Warning`, `Success`; limit text to 1–2 words; badge not a primary button. |
| Alert | Persistent context-bound message; color variants success/danger/warning/info/default; don't overwhelm screen with simultaneous alerts. |
| Toast | Short transient confirmation, not for critical/game-over decisions; must not block important controls. |
| Modal | Header/body/footer, explicit main and cancel actions. Product modal widths `456/600/800px` for S/M/L are panel standards, not suitable without mobile adaptation. |
| UX writing | Short, clear, precise, human; stable terminology; write numbers as digits in the language of surrounding text; disclose detail progressively. |
| Micro-kit | Create product-specific combinations on top of common tokens and behavior; official Figma Team Library is mentioned. |

### Availability caveats

- The **Base-Variant** and **Theme** values are explicitly stated to be restricted to the design-system file; the visited public color document does **not** publish a definitive usable hex palette for all tokens. **Do not present `#4272F6`, `#19062F`, or Estedad from the independent Dribbble concept as official Sorkhab tokens.**
- A Figma **Team Library** is mentioned by the Micro-kit guide, but the public text viewed does not provide a verified public download or permission for bundling proprietary design assets or fonts.
- Sorkhab's CTA pattern says product-page `Primary` actions should live in the `Subheader`. This applies to Arvan's **cloud management console**, and should **not** be copied literally into a portrait arcade game.
- The standards are intended for Arvan's products and are used here as an **inspiration/reference**. Distinct game art, names and insignia must remain original.

## 3. Proposed adaptation for Server Panic (**our choices**, not official Sorkhab rules)

### Proposed UI architecture

1. **App shell:** Persian first; `dir="rtl"` on DOM UI. Isometric Phaser/Canvas playfield stays spatially fixed; mirroring the world can break intuitive tap targets and is not required by text direction.
2. **Micro-kit:** Create `src/game/ui/theme/game-tokens.ts` + `src/styles/game-theme.css`; separate `palette`, `semantic`, `status`, `interactive`, and `game-effects` namespaces. Preserve originals as provisional game values until authorized official values are available.
3. **Spacing:** Use multiples of 8px as the default, with 4px sub-spacing only for dense phone HUD labels.
4. **Typography:** Prefer a **licensed, locally bundled** Persian font; Yekan Bakh if legally available. Otherwise a legally available readable Persian fallback (e.g., system font) is acceptable. Never bundle unlicensed fonts.
5. **Button tap targets:** Visually follow documented 40px/12px medium style, but use **44–48px minimum usable hitboxes** on mobile (game adaptation; not a Sorkhab specified dimension).
6. **Semantic states:** Green healthy, amber warning, orange overheating, red critical/offline, cool cyan for repair; redundantly encode state with facial expression, status text, thermometer glyphs, patterns and motion. Don't equate game-effect purple with official brand semantics.
7. **Action hierarchy:** Primary on menu `شروع بازی`; secondary `آموزش`. During gameplay, cooling is a high-priority contextual action; don't show two unrelated competing prominent buttons. In results, `دوباره بازی کن` primary.
8. **Persistent vs fleeting:** Temperature danger should be attached to the server and remain visible. Successful packet delivery can use tiny floating +score and particles (toast-like feedback). Never show a modal during active 90-second survival unless player explicitly pauses.
9. **Narrow layouts:** Maximize unobstructed server space at 360px. Keep score, clock, queue, next packet, heat and cooldown visible. Avoid desktop-style section cards and navbars inside gameplay.
10. **Microcopy dictionary:** Use one Persian term consistently for each concept: `درخواست` / `صف` / `دما` / `خنک‌سازی` / `سرور خاموش` / `زمان باقی‌مانده` / `امتیاز` / `زنجیره` (or explicitly define `کمبو` once). Persian digits in Persian UI; English internal IDs stay in code.

### Mapping screen-by-screen

| Screen | Apply Sorkhab concept | Keep as original game UX |
| --- | --- | --- |
| Main menu | Action hierarchy, concise CTA, consistent typography and focus states | Centered character/hero, animated environment preview; don't force a Subheader |
| Tutorial | Short active verbs, progressive reveal, RTL icons and text | Four intuitive <20s gameplay steps, no long admin cards |
| Gameplay HUD | Spacing, semantic statuses, badges/status dots and readable hierarchy | Fixed playfield, taps on three racks, cooldown target action, small contextual flashes |
| Results | Simple clear modal/panel hierarchy, primary replay action, accessible contrast | Victory/failure personality and score animations |

### Audit of existing 390x844 screenshots from 2026-11-19

- `menu-mobile.png`: primary `شروع عملیات` is discoverable. However the first caption is English, while the rest is Persian. Normalize a single-language UI; keep `Server Panic` as the distinct brand title.
- `gameplay-mobile.png`: mixed labels (`SCORE`, `COMBO`, `LIVE DATA CENTER`, `WAVE`, `ALPHA/BETA/GAMMA`) and Western digits conflict with the Persian-first guideline. Move to Persian labels/numerals, preserve semantic identifiers in source.
- `gameplay-mobile.png`: thermal status is displayed but small; add text/icon state near each corresponding rack, and distinguish actionable heat warnings from passive decorative colors.
- `gameplay-mobile.png`: the drone cooldown area is relatively narrow in text weight and could be confused with an ordinary button; make available/targeting/cooldown/disabled states explicit and provide a clearly sized touch target.
- `menu-mobile.png`: the large negative space is aesthetically valid, but the visual transition into the primary action can be stronger without creating a dashboard layout.

## 4. Implementation contract / acceptance tests

- [ ] Theme tokens centralized; no arbitrary repeated hardcoded status colors within UI components.
- [ ] All Persian HUD labels display Persian numerals and correct RTL order; English keys/IDs remain internal.
- [ ] Fixed-canvas playfield hit regions remain stable when swapping `dir` or width.
- [ ] Buttons and controls have pressed/focus/disabled states (not just hover); touch targets at least 44px.
- [ ] Temperature state has **two visual channels**, e.g. color + icon/text/animation.
- [ ] Cooling states (ready, choose server, traveling, cooldown) have distinct accessible feedback.
- [ ] Critical alerts persist when relevant; score toasts are short and never obscure gameplay.
- [ ] No gameplay action is blocked by unrequested overlay/modal.
- [ ] Check 360x800, 390x844, 768x1024, 1440x900; viewport visual regression for menu, normal game, critical, results.
- [ ] Contrast of body text and controls is manually checked against WCAG AA targets where applicable.
- [ ] All fonts and icons included in production build are legally licensed.
- [ ] No claim of official Arvan affiliation or direct use of protected trademarks without permission.

## 5. Immediate design sprint priorities

1. **P0 — RTL and legibility**: convert HUD text/numbers, restore proper bidirectional layout, enlarge important small labels and control hitboxes.
2. **P0 — Operational semantics**: warnings/cooling button states, consistent server-status icons, offline disabled interaction.
3. **P1 — Visual consistency**: spacing and radii scales, colors with semantic aliases, cards and result panels.
4. **P1 — Motion/feedback**: coherent component press feedback, non-intrusive feedback toast and critical failure alert.
5. **P2 — Brand/3D polish**: optional cyan/magenta visual alignment only after official color files/license terms are available.

**Bottom line:** Adopt Sorkhab's *interaction discipline* and its validated tokens' **structure** while keeping Server Panic's bespoke playful 3D styling. The design system is a dependable reference, not a reason to transform the arcade game into an Arvan service dashboard.
