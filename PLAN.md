# VYRA Energy · build plan

A scroll-driven 3D product website for **VYRA**, a _concept_ zero-sugar energy drink (fictional brand,
portfolio piece for Arslan Agayev, CS student). Reference: the "Websites in 2026" reel style, mainly the
CIRO Energy site: real 3D cans on an arc, the selected can rising on a glowing ring, a close-up that spins
with scroll while feature callouts appear, a flavour carousel, and a final lineup of all cans.

This file is the brief. Keep it updated as work lands; delete the "Status" items as they are done.

## Non-negotiables

- **Fictional brand only.** Never use a real brand name, logo or product. Footer and label already say
  "concept brand, not a real product". Keep that.
- **Palette: exactly one two-colour combo** — Charcoal Violet `#3C1A47` + Cyber Line `#B6FF00`, plus tints
  and shades of those two and near-neutrals (page background `#0E0612`, paper text `#F3EEFA`). No other hues.
  Flavour colours in `src/data/flavors.ts` already follow this.
- **Fonts:** Unbounded Variable (display, heavy, uppercase) + Inter Tight Variable (text), via `@fontsource-variable/*`.
- **Quality bar = the existing repo `arslanagayev/nebula-auth`:** strict TypeScript (configs copied from it),
  ESLint strictTypeChecked, Prettier, Vitest with ≥90 % coverage on `src/lib`, GitHub Actions CI. Small,
  well-named modules with short comments explaining _why_.
- **Accessible:** real HTML text for everything (canvas is `aria-hidden`), keyboard-usable controls,
  visible focus, `prefers-reduced-motion` (no smooth scroll, no spin/bob, intro jumps to the end), and a
  readable no-WebGL fallback (CSS glow background, text sections still work).
- **Performance:** one WebGLRenderer, DPR ≤ 2, no post-processing (canvas stays transparent; glow is done
  with additive sprites), three.js loaded with a dynamic `import()` so text paints first. 60 fps on a
  laptop iGPU; pause rendering when the tab is hidden.

## Stack

Vite 8 + TypeScript 6 (strict) · three.js 0.186 · GSAP 3.15 (ScrollTrigger, free) · Lenis (smooth scroll).
Already installed (`package.json`). `npm run dev | build | lint | typecheck | test | test:coverage`.

## What already exists (written and reviewed, not yet run in a browser)

| File                        | What it is                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/math.ts`           | clamp, lerp, invLerp, mapRange, smoothstep, easings, `damp` (frame-rate independent), `wrap`, `circularOffset`                                                                                                                                                                                                                                                                                                    |
| `src/lib/color.ts`          | hex ↔ rgb, `mixHex`, WCAG `luminance` / `contrastRatio`                                                                                                                                                                                                                                                                                                                                                           |
| `src/lib/layout.ts`         | **the choreography.** `SceneState {intro, center, focus, spin, lineup, time}` → `computeLayout()` returns a transform per can. Poses: `arcPose` (carousel; continuous fractional `center`, hides cans at the wrap seam), `focusPose` (centre can forward + spin + tilt, others drop away), `lineupPose` (row in flavour order, staggered). Plus `introProgress`, `lineupProgress`, `ringOpacity`, `nearestIndex`. |
| `src/lib/scroll.ts`         | pure scroll mapping: `featureWindows/featureOpacity/activeFeature` (callouts in the "inside" section), `flavorCenter` (carousel travel with holds at both ends), `glowAt` (background glow blended between flavours), `counter` ("01 / 05")                                                                                                                                                                       |
| `src/lib/camera.ts`         | `cameraFrame(aspect, focus)` – backs off / widens FOV on narrow screens                                                                                                                                                                                                                                                                                                                                           |
| `src/lib/canProfile.ts`     | lathe profile of a 355 ml can + `CAN` dimensions + `labelAspect()`                                                                                                                                                                                                                                                                                                                                                |
| `src/data/flavors.ts`       | `BRAND`, 5 `FLAVORS` (Original Volt, Zero Night, Lime Rush, Grape Storm, Ice Lilac), 4 `FEATURES`                                                                                                                                                                                                                                                                                                                 |
| `src/scene/labelTexture.ts` | draws a full wrap-around can label on a 2D canvas (vertical VYRA logo, flavour name, speed lines, nutrition panel, barcode) → `CanvasTexture` with `offset.x = 0.5` so the logo faces +Z                                                                                                                                                                                                                          |
| `src/scene/can.ts`          | `CanFactory`: shared LatheGeometry body, label sleeve (open cylinder), extruded pull tab + rivet, shared aluminium material; one `MeshPhysicalMaterial` (clearcoat) per label                                                                                                                                                                                                                                     |
| `src/scene/effects.ts`      | glowing ring (torus + additive halo + soft light beam cylinder), contact-shadow sprites, radial gradient textures                                                                                                                                                                                                                                                                                                 |
| `src/scene/Stage.ts`        | renderer (ACES, sRGB, alpha), RoomEnvironment PMREM lighting, key light + violet & lime rim lights, 5 cans + shadows + ring + drifting dust points, pointer parallax, `update(state, dt)` applies `computeLayout`, `supportsWebGL()`                                                                                                                                                                              |
| `index.html`                | full page markup: skip link, fixed `.backdrop` (glow + giant outlined flavour word), fixed `canvas.stage`, top bar, sections `#hero` (headline, flavour picker ‹ ›, scroll cue), `#inside` (sticky, `ol.features` filled from data, meter), `#flavors` (sticky, flavour card with live region + `.swatches`), `#lineup` (sticky title + CTA), footer                                                              |
| configs                     | tsconfig*, eslint, prettier, editorconfig, `.nvmrc` (24), `vite.config.ts` (Pages base, coverage thresholds), `.github/workflows/ci.yml`                                                                                                                                                                                                                                                                          |

## What to build

### 1. `src/main.ts` + `src/ui/*`

- Import fonts and styles. Render dynamic content from data: `ol.features` (`li.feature` with number, `h3`,
  `p`, alternate `data-side="left|right"`), `.swatches` (one button per flavour, coloured dot, accessible name).
- If no WebGL: add `html.no-webgl`, still wire the text parts, stop.
- `await document.fonts.load()` for both families **before** creating label textures (canvas text needs them).
- `const { Stage } = await import('./scene/Stage')` → `new Stage(canvas, FLAVORS)`; `ResizeObserver`/resize →
  `stage.resize(innerWidth, innerHeight)`; `pointermove` → `stage.setPointer(-1..1)`.
- **State model:** `targets: SceneState` written by UI/scroll; `state` follows targets with `damp()` in the
  loop (λ ≈ 6–8; `intro` and `time` are set directly). Loop on `gsap.ticker` (one rAF for GSAP, Lenis and
  three). Pause on `visibilitychange`.
- **Lenis + ScrollTrigger:** `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))`,
  `gsap.ticker.lagSmoothing(0)`. Skip Lenis under reduced motion.
- **Scroll mapping** (ScrollTriggers only _measure_ progress; one function recomputes all targets):
  - `insideIn`: `#inside` from `top bottom` to `top top`; `inside`: `top top` → `bottom bottom`.
  - `flavorsIn`: `#flavors` `top bottom` → `top top`; `flavors`: `top top` → `bottom bottom`.
  - `lineupIn`/`lineup`: `#lineup` similarly.
  - `focus = insideIn * (1 - flavorsIn)`, `spin = inside`, `center = heroCenter` before the flavours section
    and `flavorCenter(heroCenter, flavors, 5)` inside it, `lineup = lineup progress` (reach 1 around 70 %).
- **Hero picker:** arrows change `heroCenter` by ±1 (not wrapped, so the carousel always moves the way you
  clicked); label shows `counter()` + flavour name of `nearestIndex`. Also ← / → keys while the hero is in view.
- **Inside section:** feature opacity/translate from `featureOpacity(spin, i, 4)`; meter fill = `spin`.
- **Flavours section:** when `nearestIndex(center)` changes, swap the card (count, name, notes, stats) with a
  quick GSAP fade/slide; active swatch gets `aria-pressed="true"`; clicking swatch `j` scrolls (Lenis
  `scrollTo`) to the progress where flavour `j` is centred (invert `flavorCenter`, mind the holds).
  `.backdrop__word` shows the flavour's first word (ORIGINAL, ZERO, LIME, GRAPE, ICE), opacity ≈
  `flavorsIn * (1 - lineupIn)`.
- **Glow:** every frame set `--glow` on `:root` from `glowAt(center, FLAVORS)` (only write when changed);
  in the lineup blend back to the brand violet.
- **Intro:** on load tween `state.intro` 0 → 1 (≈ 2.2 s, `power3.out`) and reveal the hero headline lines
  (`.line > span` translateY 100 % → 0, staggered).
- Reveal section headings (`.display .line > span`) with ScrollTrigger once.

### 2. Styles `src/styles/{tokens,base,sections}.css`

- Tokens: `--night #0E0612`, `--violet #3C1A47`, `--lime #B6FF00`, `--paper #F3EEFA`, `--muted` (paper ~62 %),
  `--glow` (JS-driven), fonts, fluid type with `clamp()`.
- Layers: `.backdrop` fixed z 0 (radial `--glow` + vignette + giant outlined word), `canvas.stage` fixed z 1
  (pointer-events none), content z 2.
- `.display`: Unbounded 900, uppercase, `clamp(56px, 9.5vw, 168px)`, line-height .88, tracking −0.02em,
  `em` in lime, `.line { overflow: hidden }` for reveals.
- Hero: copy bottom-left, picker bottom-right (round 52 px arrow buttons, thin border), scroll cue bottom-centre.
- `#inside` 420vh, `#flavors` 520vh, `#lineup` 220vh, each with a `.sticky` 100svh child.
- Features alternate left/right around the centred can; flavour card left; swatches bottom centre;
  lineup title near the top so the row of cans sits below it.
- Top bar: logo, nav, lime pill CTA. Mobile: hide nav, features/card move to the bottom, smaller type.
- Visible focus rings (lime), `.skip-link`, reduced-motion overrides.

### 3. Tests `tests/*.test.ts` (Vitest, node env)

Cover `src/lib/**` and `src/data/**` to ≥ 90 %: math (clamp/wrap/circularOffset edge cases, damp
converges, easings hit 0 and 1), color (parse 3/6 digit, round trip, mix ends, contrast of known pairs),
layout (centre can is highest & frontmost, symmetric arc, wrap seam hidden, focus brings centre forward,
others leave the frame, lineup x order matches flavour order, intro starts below the floor), scroll
(windows cover the range without gaps, opacity 0 outside / 1 inside, flavorCenter endpoints & holds,
glowAt at integers equals the flavour glow), camera (narrow screens back off), canProfile (starts/ends
on the axis, never exceeds the radius, label aspect ≈ 2.13), data integrity (unique ids, valid hex, every
flavour's ink/accent has contrast ≥ 3 against its can colour).

### 4. Polish & verify

- Run `npm run dev`, look at every section at 1440×900 and 390×844, fix framing (camera, arc radius,
  label orientation: logo must face the camera on the centre can; check the sleeve UV direction).
- `npm run lint && npm run typecheck && npm run test:coverage && npm run build` all green.
- README (English) in the style of nebula-auth: what it is, live demo link, features, how the scroll
  choreography works (the pure `computeLayout` idea is the interview story), tech stack, project
  structure, scripts, accessibility & performance notes, credits ("inspired by the 'Websites in 2026'
  trend; palette from @design.deb's colour combos"), MIT.
- `.github/workflows/deploy.yml` for GitHub Pages (copy nebula-auth's; it needs the repo to be public,
  so it may stay unused until the owner flips visibility).

## Status

- [x] Tooling, data, pure choreography, 3D can, label, stage, page markup
- [ ] main.ts + UI wiring
- [ ] Styles
- [ ] Tests
- [ ] Browser check + polish
- [ ] README + deploy workflow

## Working rules for the cloud session

- Work on a branch (e.g. `build/site`), commit in small, meaningful steps (`feat:`, `test:`, `docs:` …),
  and open a pull request into `main` when everything above is green. Do not make the repo public,
  do not deploy, do not post anywhere — the owner reviews and approves that.
- Keep commit messages and all repo text in English.
