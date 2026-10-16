# Research: organization across web + native (Axis / Kern)

> Correction (Axis Lead, 2026-10-16): R-1 is wrong; the ADRs are authoritative. The approved rename is kern-material-3 -> kern-m3 only, no aliases.

Status: research report, 2026-10-16. Untracked working note in `axis/.reports/`
— not a contract, not an ADR. Read-only study; no repo was modified to
produce it (this file itself is the only write, per the task brief).

Scope: how Axis and Kern should be organized across web and native —
(1) whether Axis needs a web side, (2) the Kern package structure that
scales to 10+ design systems, (3) one placement rule for any new piece,
(4) how docs present web + native. Evidence is local repo reads plus
official docs / GitHub sources, cited inline.

## 1. Findings with evidence

### 1.1 The mature ecosystems agree on three layers, not two

| Ecosystem | Behavior / unstyled | Styled system(s) | Web vs native |
|---|---|---|---|
| Adobe: Stately / Aria / Spectrum (monorepo `adobe/react-spectrum`, https://github.com/adobe/react-spectrum) | `@react-stately/*`: state logic only, explicitly "cross-platform… can also be used independently (e.g. on other platforms like React Native)" (repo README, https://github.com/adobe/react-spectrum/blob/main/README.md) | `@adobe/react-spectrum`: styled Adobe implementation, `Provider theme={...}` (https://react-spectrum.adobe.com/getting-started) | `react-aria` hooks are **web-only**: "react-aria specifically is web only since it relies heavily on browser APIs… We don't have anything around React Native yet" — Devon Govett, https://github.com/adobe/react-spectrum/issues/696. RN spreading breaks (role/tabIndex/keyDown gaps, same thread). Adobe's answer: share Stately + `@react-types/*` API definitions, re-implement behavior per platform ("a middle layer for React Native… using react native props… Then multiple design systems could be built on top" — same thread). |
| Base UI (`mui/base-ui`, https://github.com/mui/base-ui) | `@base-ui/react` (single package, per-component subpaths, https://www.npmjs.com/package/@base-ui/react): 100% unstyled, no bundled CSS, any styling engine (https://base-ui.com/react/overview/about — verified 2026-10-16). Components-only + escape hatches (`render` prop, `useRender`, `mergeProps`); old `useButton`-style headless hooks retired (https://base-ui.com/react/handbook/composition, https://base-ui.com/react/utils/use-render) | None — styling is the consumer's job; state via `data-*` attributes + `className`/`style` as value-or-function-of-state (https://base-ui.com/react/handbook/styling) | **DOM-only.** Browser support = Baseline Widely Available, React 17+, Vite/webpack/Turbopack/Parcel (https://base-ui.com/react/overview/about). No RN story. |
| Radix + shadcn (https://github.com/radix-ui/primitives, https://ui.shadcn.com/docs) | Radix: unstyled, `asChild` (Slot), controlled-or-uncontrolled, `data-state` (https://www.radix-ui.com/primitives/docs); single `radix-ui` package replacing per-component installs (changelog 2026-02, https://ui.shadcn.com/docs/changelog/2026-02-radix-ui) | shadcn: **not a library** — registry + CLI copy-paste (`components/ui/*.tsx`), "you own the code", manual re-sync (https://ui.shadcn.com/docs). Since 2025-12 the same styled API generates over Radix **or** Base UI (https://ui.shadcn.com/docs/changelog/2026-01-base-ui) — proof a stable styled API can sit atop competing headless layers | Both DOM-only. Native reuse is community, not upstream. |
| rn-primitives + react-native-reusables + NativeWind (https://github.com/roninoss/rn-primitives, https://github.com/founded-labs/react-native-reusables, https://github.com/nativewind/nativewind) | rn-primitives: "Unstyled, accessible primitives… Bring your own styles" (https://rnprimitives.com/); Radix-shaped API (`Root/Item/Trigger/Content`, `asChild` via Slot); **web side backed by Radix UI, native side re-implemented with RN primitives + Portal/Slot shims**; zero styles, no tokens in package | react-native-reusables: thin styled wrappers (`components/ui/*.tsx` + `lib/cn.ts` + `global.css` vars), copy-paste-first via CLI/registry (https://reactnativereusables.com/docs, https://reactnativereusables.com/docs/customization). Consensus: **behavior = npm dep, styled DS components = vendored source** so each app/DS owns variants | Same JS API everywhere; web-only props marked per component table. NativeWind compiles `className` → styles at build + minimal reactive runtime; web emits real CSS (https://www.nativewind.dev/docs/core-concepts/tailwindcss, https://www.nativewind.dev/blog/announcement-nativewind-v4). Weakest point: SSR/RSC (client-only, import-order fragility — https://www.nativewind.dev/docs/getting-started/installation/nextjs). |
| Tamagui (https://github.com/tamagui/tamagui, https://tamagui.dev) | N/A (styled-system vendor) | One `styled()` + token/theme contract, platform divergence pushed into **compiler/runtime**: atomic CSS on web, hoisted style objects on RN; `createTamagui({ tokens, themes, fonts, media })`, tokens → CSS vars on web / values on native (https://tamagui.dev/docs/core/configuration, https://tamagui.dev/docs/core/theme, https://tamagui.dev/blog/version-three) | No per-component `.web.tsx`/`.native.tsx` forks in user code; bundler plugins (`@tamagui/cli/vite`, `/metro`) + `tamagui build --target web\|native` (https://tamagui.dev/docs/intro/compiler-install) |
| Gluestack v2+ (https://github.com/gluestack/gluestack-ui, https://gluestack.io/ui/docs/home/overview/introduction) | Compound unstyled components, "like React Aria & Radix: decouple customization from API + accessibility"; "today gluestack-ui and shadcn/ui are very similar, although gluestack-ui exists in mobile and web both" | v1 bundled `styled()` system abandoned → v2 copy-paste + Tailwind classes via NativeWind; `tva()` variants + `withStyleContext` parent→child state (https://gluestack.io/ui/docs/home/getting-started/gluestack-ui-nativewind-utils); tokens in Tailwind `@theme` + CSS vars, no JS theme provider | One codebase, `Core Concepts > Universal` (https://gluestack.io/ui/docs/home/core-concepts/universal) |
| Google M3: Material Web vs Compose M3 (https://github.com/material-components/material-web, Compose `androidx.compose.material3`, spec https://m3.material.io/) | None shared — behavior re-implemented per platform (LitElement + ARIA/pointer on web; Compose foundation gestures/semantics on Android) | Tokens are the shared artifact: web = CSS custom properties (`--md-sys-*`, https://material-web.dev/theming/material-theming); Compose = **generated Kotlin token objects** (`// GENERATED CODE`, `// VERSION: 29.0.0`, e.g. `tokens/CheckboxTokens.kt`, https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/CheckboxTokens.kt). Sync = spec + versioned token generation, not a monorepo; interchange via `material-foundation/material-tokens` DSP (https://github.com/material-foundation/material-tokens). Both MDC-Android Views and Material Web are now in maintenance mode; Compose M3 is the forward path | Entirely separate renderers; *spec parity*, not code sharing |
| Unistyles v3 (https://github.com/jpudysz/react-native-unistyles, https://unistyl.es/v3/start/how-unistyles-works) | N/A | One `StyleSheet.create(theme, runtime)` surface (themes/breakpoints/variants/compoundVariants); **two engines**: C++/JSI on native, custom atomic-CSS parser on web (NOT react-native-web); themes → CSS vars by default, root-class switch, no re-render (https://unistyl.es/v3/references/web-styles, https://unistyl.es/v3/references/web-only/); SSR via collect-once/inject (`useServerUnistyles`, https://www.unistyl.es/v3/guides/server-side-rendering); strictly-scoped `_web` escape hatch | Proves one authoring surface + per-platform compilers works at scale |

**Convergent lessons:**

1. **Three layers** (Adobe's shape): (a) platform-free state/logic — genuinely shared, RN-safe; (b) per-renderer behavior bindings — DOM props vs RN props, never one codebase with `if (isNative)`; (c) styled per-design-system implementations. Radix/Base UI fuse (b) with the DOM, which is exactly why they have no native story — and why Axis exists.
2. **Behavior = dependency, styled = vendored-or-versioned-per-system.** shadcn, reusables, and Gluestack-v2 all land on: unstyled behavior ships as a package you import; styled components ship as source you own per app/system. Kern's CLI source-vendoring (`kern add`) is the same instinct, already built.
3. **Sync across renderers happens at the token/spec layer**, never by sharing component implementation (Google M3, Kern's own resolver design).
4. **Documented, systematic deviations beat ad-hoc forks**: `data-*`→state-fns, `Portal container`, `_web` escape hatch, per-component web-only prop tables. Axis already does this (D1–D10); Kern's parity page does this (API-shape table, deliberate-asymmetry rulings).

### 1.2 Where the two repos actually stand (verified reads, 2026-10-16)

**Axis** (`axis/packages/axis`, `@xoroh/axis@0.0.0`, peers `react>=18` + `react-native>=0.86 <0.89`):

- Single package, single `.` barrel with a `react-native` export condition (`packages/axis/package.json`); `files: dist + README + LICENSE` (no `src/` leak).
- **Two-zone boundary, CI-enforced** (`packages/axis/scripts/check-boundary.mjs` + `boundary-policy.mjs`): behavior models in `src/*.ts` are pure/platform-neutral (not even `react-native`); rendered components in `src/components/` may use RN host bindings only; Kern packages, `react-dom`, Expo, browser globals, and token references forbidden everywhere. `*.rntest.tsx` proofs must import `./index` (the public entry) only.
- Public contract (`docs/COMPONENT_CONTRACT.md` §11): Axis mirrors Base UI per family — `Root` + named parts, Base UI prop names/semantics, `render`-style composition — with **one systematic deviation recorded once**: no `data-*` attributes (RN hosts reject unknown props; state flows through function `style`/`render` props). This is exactly the Base UI styling contract translated to a renderer without a stylesheet engine.
- Parity record (`docs/BASE_UI_PARITY.md`): Dialog/Menu aligned with per-part tables; systematic deviations D1–D10 (no `container`/`keepMounted` on Portal — RN `Modal` host; no Viewport/focus-trap/nested-overlay coordination/animation states/hover-keyboard traversal yet, each with a native reason).
- Coverage (`docs/COVERAGE.md`): ~60 rendered components `complete` (each = implementation + RNTL suites + docs + boundary-clean), 2 `na-native` with reasons (Scroll Area → native ScrollView covers it; Preview Card → hover-only, no touch equivalent). Policy line that matters for this report: *"Kern keeps its own M3 implementations regardless of this table; nothing here replaces a design-system component."*
- Header comment in `src/index.ts` still says "behavior primitives" while the barrel now exports rendered components too — **stale one-liner**, cosmetic only, flagged for the Axis thread (see §5).

**Kern** (verified):

- Renderer split already matches the ecosystem consensus: `@xoroh/kern` = web M3 (deps `@base-ui/react`, `cva/clsx/tailwind-merge`; peers react/react-dom/Base UI) vs `@xoroh/kern-native` = native M3 (deps `@xoroh/kern-tokens`, `@xoroh/kern-material-3`, `react-native-svg`; peers react + RN). Peers, never importing each other (`docs/architecture.md`, `docs/conventions/file-ownership.md`).
- **Token pipeline is the shared layer**: `kern-tokens` = engine + resolver + generators (platform-free, no React/DOM); `kern-material-3` = M3 preset data/policy/overrides that *registers with* the engine ("The universal theme engine lives in `@xoroh/kern-tokens` and knows none of this" — `packages/kern-material-3/README.md`). This engine-vs-preset split is the template for systems 2–10 (§3).
- **Kern already consumes Axis on BOTH renderers** via vendored tarball (`vendor/axis/axis-bed35547.tgz`, `file:` spec in both `packages/kern` and `packages/kern-native` `package.json`): native ~28 component files (`useControllableState`, `useSelection`, `useRovingModel`, `mergeSlotProps`, overlay/dismissal models…); web 3 files (`menu-family.tsx`, `sheet-family.tsx`, `presentation.tsx` — whose header reads *"Every host here binds an `@xoroh/axis` model to DOM mechanics"*). I.e. the Stately pattern (universal models, per-renderer hosts) is already live in-tree.
- Migration/ownership authority: `docs/architecture/kern-axis-migration-and-roadmap.md` — Kern→Axis public-interface-only, Axis zero deps on Kern (D-DEP); pre-publish vendored tarball → semver at first publish; `libs/kern-primitives` frozen pending deletion; "M3 implementations stay per-design-system and are never collapsed."
- Parity doctrine (`docs/conventions/parity.md` + `docs/platform-parity.md`): same M3-canonical unprefixed names; frozen per-component `variant` meaning; multipart web API vs flat native API is an accepted shape difference; deliberate asymmetries ruled (Sonner web-only over shared Toast manager; `form`/`native-select`/`preview-card`/`focus-ring` web-only; native-only brand kit + composition); **empty-abstraction test** — a web component exists only where it owns behavior, else "web via CSS" (5 filed, 0 warranted). The concept-counting rule (registry-generated, never hand counts) keeps coverage honest.
- Naming law + barrels-as-contract + independent versioning (`docs/architecture.md`): deep `src/` blocked by `exports` maps; consumers pay only for what they depend on.

## 2. Recommendation 1 — Axis stays native-only (current rule: correct, with one refinement)

**Verdict: the "Axis is native-only" rule is correct and should stand. Do NOT build an Axis web side.**

Why, with evidence:

1. **Base UI already is the web layer, and it is DOM-only by design.** Browser/Baseline support statement, `data-*` + CSS styling contract, zero RN story (§1.1, verified page fetch). An Axis web side would either duplicate Base UI (two unstyled DOM libraries to keep in API sync forever — the exact failure mode shadcn's Radix/Base UI switcher exists to avoid) or wrap it (a pass-through package owning no behavior — fails Kern's own empty-abstraction test).
2. **Every ecosystem that tried sharing behavior across DOM + RN hit the same wall.** React Aria is web-only by maintainer ruling; spreading hook props onto RN components breaks on role/tabIndex/keyDown (issue #696, verified). rn-primitives — the closest thing to Axis in the wild — re-implements per renderer and puts Radix on the web side. Axis's D1–D10 deviations are the same wall, documented honestly.
3. **The in-tree evidence already shows the right shape**: Kern web binds Axis *models* to DOM hosts (`presentation.tsx`), Kern native binds the same models to RN hosts. The sharing happens at the model layer, not at a rendered web component layer.

**The one refinement — name the two zones, because the current rule as stated ("Axis is native-only") is slightly false and will confuse the next contributor:**

- **Zone A — behavior models (`src/*.ts`): UNIVERSAL, not native-only.** Pure TS/React, no host imports (boundary gate already enforces this). Consumable by web and native. This is React Stately's position in the stack, and Kern web already consumes it. The rule should bless this explicitly rather than leave 3 web importers looking like violations.
- **Zone B — rendered components (`src/components/`): NATIVE-ONLY, permanently.** RN host bindings only; no DOM renderer will ever be added. This is the "counterpart of Base UI" half: same API philosophy, opposite renderer.

Concrete consequences:

- Keep ONE package (`@xoroh/axis`), one `.` barrel — matches `@base-ui/react`'s single-package shape and the roadmap's public-entry rule. Do not split into `@xoroh/axis-models` / `@xoroh/axis-components` pre-1.0 (a split is a second public contract to version; nothing in the evidence earns it yet). Revisit only if a non-RN consumer (e.g. a second native design system outside Kern, or docs tooling) needs models without the RN peer — see Open questions.
- Fix the stale `src/index.ts` header ("behavior primitives" → "unstyled behavior models + native components") so the barrel describes what it ships.
- Note the **web peer wrinkle**: `@xoroh/kern` (web) depends on `@xoroh/axis`, whose `peerDependencies` include `react-native`. Today that resolves through the vendored tarball and is harmless, but at publish time a web-only installer would see an unmet/incorrect RN peer. Options, in preference order: (i) document that `@xoroh/kern` requires the Axis models zone only and the RN peer is inert on web (peer warnings are advisory; Metro/bundler never resolves RN on web); (ii) if it ever bites, add a `./models` subpath export with no RN peer implications — NOT a second package. No action now; record as Open question O-3.

## 3. Recommendation 2 — Kern package structure that scales to 10+ systems

**Principle (from evidence): engines are shared, presets are per-system, widgets are per-system-per-renderer, composition is per-renderer, recipes are never published.**

```
@xoroh/kern-tokens            engine: token store, resolver, themes/tones/motion,
                              contrast, DTCG interchange, generators. Platform-free.
                              (exists; changes rarely; every system builds on it)

@xoroh/kern-<system>          SYSTEM PRESET, platform-free data+policy only:
                              role tables, presets, contrast policy, seed themes,
                              feedback spec, shape/elevation policy.
                              Template: packages/kern-material-3 (no React, no DOM,
                              no peers; JSON themes readable without eval).
                              One per design system.  M3 = first instance.

@xoroh/kern                  web M3 widgets (current package; keeps its name)
@xoroh/kern-native           native M3 widgets (current package)
@xoroh/kern-<system>-web     web widgets for system N (created iff system N ships web)
@xoroh/kern-<system>-native  native widgets for system N (iff system N ships native)
  -- OR per-system single package with ./web + ./native subpaths; decide per system
     at creation (see rule R-4). Default: separate, mirroring kern/kern-native.

@xoroh/kern/start            web composition for M3 (blocks, scaffolds)
<system>-native composition  lives inside its -native package (current native rule)
  -- at 10 systems, revisit symmetric -start packages (see R-5); not now.

@xoroh/kern-icons            cross-system icon registry + dual renderers (exists;
                              stays system-agnostic; per-system glyph packs register
                              like M3 presets register with the token engine)
@xoroh/kern-contracts        pure schemas (exists; new systems add records, not packages)
@xoroh/kern-cli              installer: gains --system flag; vendors per-system
@xoroh/kern-mcp              discovery: system-scoped registry/queries (both already
                              on the D-STRUCTURE decision per roadmap freshness note)
```

Rules that make this scale:

- **R-1 — Rename the M3 preset package `kern-material-3` → `kern-m3` (hard rename, no alias).** The approved rename is the preset package, not `@xoroh/kern` (web M3 widgets keep their name). Nothing is published, so there is nobody to migrate: no re-export shim, no deprecation warning, no redirects (owner rule: no backward compatibility before the first public release). The roadmap freshness addendum records owner decision D-STRUCTURE covering this rename — this report endorses executing it as a flag day with a codemod.
- **R-2 — New systems copy the `kern-material-3` preset pattern, never the `kern` widget pattern.** A new system starts as data (preset package, platform-free, JSON-readable themes) + engine registration. Widgets come second, per renderer, only where the system ships. This keeps system #5 from forking the engine and keeps "10 systems" to ~10 small preset packages + only the renderer packages each system actually ships.
- **R-3 — Renderer packages depend on preset + tokens + behavior only; presets depend on tokens only; engines depend on nothing.** Dependency arrows (extends `file-ownership.md`):
  `kern-tokens ← kern-<system> ← { kern-<system>-web, kern-<system>-native }`,
  with behavior edges `Base UI ← *-web` and `Axis ← *-native`, icons independent. Enforce with the existing `check:layers`-family gates extended per package (mechanical, same shape).
- **R-4 — One package per system per renderer by default; subpaths only inside a renderer package.** Separate packages = independent versioning per system per renderer (a fix in system 7's native widgets never re-versions system 3's web). A single `@xoroh/kern-<system>` with `./web` + `./native` subpaths is allowed only when both renderers version in lockstep AND share no extra peers — record the choice + reason in the system brief. Never one package spanning systems ("universal themed implementation" is explicitly out of scope per roadmap Product boundaries).
- **R-5 — Composition-tier asymmetry is tolerated, not modeled.** Today web blocks live in `/kern/start` (separate edge) while native blocks live inside `kern-native` (no new peer needed) — `architecture.md` justifies it per-package. At 10 systems, do NOT preemptively create 10 `-start` packages; keep the rule "composition ships on the cheapest dependency edge of its renderer" and re-evaluate when a second system needs web composition. Record each system's choice in its brief (one line + reason).
- **R-6 — Styled code travels by vendoring (CLI), behavior by semver (npm).** shadcn/reusables/Gluestack-v2 consensus (§1.1). Kern CLI already vendors; extend `kern add --system <name>` to vendor that system's styled sources while behavior deps (`@base-ui/react`, `@xoroh/axis`) stay semver imports. This is what lets 10 systems coexist in one consumer without version entanglement.
- **R-7 — Registry/MCP/CLI/docs are system-scoped from system #2 onward** (no global registration; per D-STRUCTURE). Concretely: manifest rows carry `system`; `check:parity`/`generate:components` aggregate per system; docs URLs are system-scoped. Retrofitting scoping at system #6 is the expensive version — do it while there is one system.

What explicitly does NOT scale and is therefore prohibited: per-system forks of Axis or Base UI; token authoring outside `kern-tokens` + preset packages; cross-system shared widgets ("never collapsed" per roadmap); `Web*`/`Native*` bridge names (parity prohibitions); publishing recipes/blocks with app-domain props (slots only).

## 4. Recommendation 3 — the single placement rule (decision tree + table)

**Decision tree.** For any new piece of UI code, answer in order — first "yes" places it:

```
1. Is it a token, theme, tone, motion, contrast, or feedback VALUE/POLICY?
   YES → Kern tokens engine (generic) or a kern-<system> preset package (system-specific).
   (Axis: never. Widgets: never inline — check:kern rejects raw values.)
2. Is it a rendered DOM (web) component?
   a. Does it own behavior (state, focus, dismissal, keyboard/pointer, a11y semantics)?
      NO  → it is CSS (or a pure function). No component. Record "web via CSS".
            (empty-abstraction test, parity.md — e.g. shape, aspect-ratio, arc-rotations.)
      YES, and it is UNSTYLED shared infrastructure → use @base-ui/react (external).
            Never build it in Axis (DOM is out of scope) or Kern (don't fork Base UI).
      YES, and it is STYLED for design system S → kern-<S>-web (M3: @xoroh/kern).
3. Is it a rendered React Native component?
   a. Is it UNSTYLED, design-system-neutral behavior (usable without Kern)?
      YES → Axis src/components/ (one slice at a time, contract gates, RNTL proofs,
            Base UI part/prop mirroring, deviations recorded in BASE_UI_PARITY.md).
   b. Is it STYLED for design system S (reads roles/tokens, M3 anatomy)?
      YES → kern-<S>-native (M3: @xoroh/kern-native). Consume Axis, never copy it.
      (COVERAGE.md policy: Kern keeps its own implementations regardless of Axis.)
4. Is it platform-free logic (state model, collection/selection math, dismissal policy,
   modality registry, positioning MATH, time utils, slot/ref composition)?
   a. Genuinely identical on both renderers AND has a real consumer on at least one?
      YES → Axis src/*.ts models (Stately position; both renderers' hosts bind it —
            cf. presentation.tsx on web, overlay-surfaces.tsx on native).
      NO consumer → nowhere. No speculative transfers (collection/mergeRefs precedent:
            gated until a consumer exists; adoption.json ledger pattern).
   b. Web-only mechanics (VISUALLY_HIDDEN_STYLE, isPressActivationKey, viewport-clamp
      with DOM semantics)? → Kern web-owned code. Never Axis.
5. Is it COMPOSITION of existing pieces (slot-driven, domain-free)?
   YES → block tier: /kern/start (web) or inside the -native package (native).
   Page frame (named regions + behavior)? → scaffold tier, same homes.
   Carries app domain (auth, routing, tenancy as anything but props/slots)? → NOT a block.
      Demote to recipe: lives in apps/site (docs) or the consuming app. Never published.
6. Is it icons, contracts/schemas, installer, or agent discovery?
   → kern-icons / kern-contracts / kern-cli / kern-mcp respectively (Kern-owned,
      system-scoped where applicable). Never Axis (roadmap: no CLI/MCP in Axis).
```

**Placement table** (concrete; "do not build" rows are load-bearing):

| New piece | Home | Never | Example / precedent |
|---|---|---|---|
| Controlled-state hook, selection/collection model, dismiss policy, modality registry, press/roving/focus models, positioning math, time utils | Axis models (`src/*.ts`), needs a consumer | Kern libs (frozen); per-renderer copies | `useControllableState` (21 RN + 2 web importers); `presentation.tsx` binds models to DOM |
| Unstyled RN widget (any family) | Axis `src/components/`, contract slice | Kern-native (don't pre-style); DOM port | Switch slice (RNTL 7, PRESSABLE+role/state) |
| Unstyled DOM widget | `@base-ui/react` (external dep) | Axis; new Kern code | Dialog/Toast consumed by `@xoroh/kern` |
| M3 web styled widget | `@xoroh/kern` (keeps its name; R-1) | Axis; Radix fork | `button.tsx` (Base UI + Tailwind + roles) |
| M3 native styled widget | `@xoroh/kern-native` | Axis (styling); copy of Axis internals | `button.tsx` (StyleSheet + `useKernScheme`) |
| M3 token/policy/preset data | `@xoroh/kern-material-3` | `kern-tokens` (engine stays generic); widgets | preset tables register with engine (side effect) |
| Generic token engine/resolver/generators/DTCG | `@xoroh/kern-tokens` | Any system package; Axis | `resolveThemeDetails(mode, contrast, variant)` single resolver |
| New system's preset data | NEW `kern-<system>` (copy material-3 pattern) | Engine fork; widget-first | R-2 |
| New system's web/native widgets | NEW `kern-<system>-web` / `-native` | Shared cross-system package; Axis styling | R-4 |
| Slot-driven pattern, domain-free | Block tier (`/start` web; in `-native`) | Published with app props | TopAppBar both renderers; BottomSheet native |
| Page frame | Scaffold tier, same homes | New package per scaffold | AppShell/Document; BootSplash/Panes |
| Product-shaped screen/recipe | `apps/site` or consuming app | Any published package | Roadmap: "recipes built from the same regions, not new API" |
| Pure decoration, no behavior | CSS / style object / shared pure fn — no component | A component on either side | shape/aspect-ratio/arc-rotations rulings |
| Icon glyph / renderer | `@xoroh/kern-icons` (+ per-system registration) | Token/widget packages | dual DOM/RN-SVG via export condition |
| Install/upgrade scaffolding | `@xoroh/kern-cli` (+ `--system`) | Published styled packages as the channel | `init/add/list/diff/upgrade`, receipt v2 |
| Discovery/validation metadata | `@xoroh/kern-mcp`, `kern-contracts`, registry | Axis (only its public-export inventory) | 419-row manifest; `parity/contract.ts` |

Worked examples (sanity-checking the tree):

- "Native date-picker with M3 styling" → Q3b → `kern-native` (exists: `calendar.tsx`/`time-picker.tsx`); behavior models it needs (time math) already in Axis models (Q4a).
- "Web hover-card for M3" → Q2a: hover-only, no touch equivalent → check native analogue; if none, either web-only with ruled asymmetry (Preview Card precedent, Axis `na-native`) or reject. Never an Axis component.
- "Shared spring animation curve" → Q1 if it is a motion token (kern-tokens motion schemes) else Q4a (pure function in Axis models only with consumers on both sides; else inline per renderer).
- "Auth-gated settings screen" → Q5: carries app domain → recipe in app/site, never a block.

## 5. Critique of the current layout (against §§2–4)

1. **Renderer split: correct.** `kern` (DOM/Base UI) vs `kern-native` (RN/Axis) as peers around one token resolver is exactly the Adobe-stately / Google-spec-parity shape. Keep.
2. **Engine-vs-preset split: correct and the scaling template.** `kern-tokens` (generic engine) vs `kern-material-3` (M3 data registering with it) is the best-structured part of the tree. System #2 should be a copy of the preset side, not the engine side.
3. **Preset package name: `kern-material-3` is verbose.** D-STRUCTURE decided the `kern-m3` rename of the M3 preset package (not `@xoroh/kern`, which keeps its name) — execute as a hard rename with a codemod, no alias, no deprecation (owner rule: no backward compatibility before the first public release). This is the highest-value structural move in this report and it is already authorized.
4. **Composition-tier asymmetry (`/start` vs in-package): acceptable, under-documented.** The dependency-edge justification (`architecture.md`) is real, but the rule "cheapest edge of its renderer" should be written as a rule (R-5), not re-derived per system.
5. **Axis barrel scope: correct, header stale.** One package/one entry matches Base UI and the public-contract rule; the `src/index.ts` "behavior primitives" header no longer describes a barrel exporting 60 components. One-line fix, Axis thread.
6. **Axis `COVERAGE.md` vs Kern `platform-parity.md`: two truths, one seam.** Both are honest, but a newcomer cannot tell which table answers "does X exist for native?" (Axis coverage = unstyled availability; Kern parity = M3 availability). Docs fix, not code: cross-link the two tables' roles in each header (§7).
7. **Web's dependency on RN-peered `@xoroh/axis`: works, slightly off-spec.** Three web files import models from a package peering `react-native`. Harmless via vendored tarball today; revisit at publish (O-3). Do not "fix" by duplicating models into Kern web — that recreates the `useControllableState` two-copy failure the whole migration exists to end.
8. **Counting discipline: exemplary, keep.** Registry-generated counts + concept rule + empty-abstraction test are better than anything found in the surveyed ecosystems (none of Base UI/Radix/Tamagui/Gluestack publish an equivalent anti-wrapper gate). Extend the pattern per system (R-7) rather than inventing new gates.
9. **Missing for scale (expected, not a fault):** no `--system` in CLI, no system-scoped registry/URLs, no second-system brief template. All covered by D-STRUCTURE + R-7; the gap is execution, not direction.

## 6. Migration steps (pre-release hard cuts, no deprecation)

Pre-release renames and removals land as hard cuts with no aliases, shims, or deprecation windows (owner rule: no backward compatibility before the first public release); the Axis-contract §10 one-minor window applies from 1.0, not before.

1. **(Kern) Execute the `kern-m3` rename** (authorized: D-STRUCTURE). Rename the M3 preset package `kern-material-3` → `kern-m3` (manifest `@xoroh/kern-m3`); `@xoroh/kern` and `@xoroh/kern-native` keep their names. Hard cut via codemod across packages/site/tests; old specifiers are deleted, not aliased; registry/MCP/CLI/docs/URLs move to system-scoped rows with no legacy rows kept. Acceptance: `preflight:publish`-family gates pass on the new names; zero old-specifier references remain.
2. **(Axis, 1 line) Fix the `src/index.ts` header** to "unstyled native behavior models + components". Docs-only; no version impact.
3. **(Docs, both repos) Cross-link the coverage tables' roles** (Axis COVERAGE = unstyled availability; Kern platform-parity = styled M3 availability) + add the decision tree (§4) as the single placement page, each repo linking the one canonical copy (lives in Kern docs per roadmap "contract homes"; Axis links it). New docs pages only — no code moves.
4. **(Kern) Bless Zone A sharing explicitly**: one paragraph in `file-ownership.md` / `primitives.md` successor stating Kern web may import Axis *models* (never `components/`), mirroring the boundary gate's two zones. Closes the "3 web importers look like violations" ambiguity. No code moves.
5. **(Kern) System #2 pilot = the template validation.** Scaffold `kern-<system2>` preset (copy material-3 shape: JSON themes, policy, registration side effect) + at most one renderer package; extend `generate:components`/`check:parity`/manifest/CLI with `system` scoping (R-7); write the per-system brief template from what the pilot actually needed. Defer the other eight systems; the pilot's diff is the design review.
6. **Explicitly deferred (do NOT migrate now):** splitting Axis into models/components packages; symmetric `-start` packages for native; moving native composition out of `kern-native`; adopting NativeWind/Tailwind in any styled renderer (StyleSheet+tokens and Tailwind+CSS-vars both ship today — unify only with a measured reason); any web rendered components in Axis (prohibited, §2).

## 7. Recommendation 4 — how docs present web + native

Follow the pattern the evidence rewards (Base UI's per-component pages + Kern's parity page + rn-primitives' web-only prop tables), with one structural addition:

- **One page per concept, both renderers, system-scoped URL.** E.g. `/systems/m3/components/dialog` with renderer tabs (Web | Native) sharing: purpose paragraph, anatomy diagram, `variant` meaning (frozen, identical), token roles used. Per-tab: install snippet, code example (tested/generated fixtures only — Axis contract §9), prop table with a `Web only` / `Native only` column (rn-primitives precedent), accessibility section per renderer (ARIA roles vs RN `accessibility*` roles/states — same intent, different mechanism), controlled/uncontrolled examples.
- **The parity/coverage tables stay generated and stay the index.** `docs/components.md` (generated) + `platform-parity.md` (curated gaps/asymmetries) + Axis `COVERAGE.md`/`BASE_UI_PARITY.md` (unstyled layer) link to the concept pages. Counts in concepts, never files (parity rule). New systems add a parallel generated index; the curated gap list is per system.
- **Asymmetries are first-class content, not footnotes.** Each ruled difference (Sonner, form, focus-ring, Loader sizes, multipart-vs-flat API, Axis D1–D10) renders as a callout on the affected concept page AND in the parity table — the current "recorded once centrally + per-component tables" split is right; the addition is bidirectional links so neither copy drifts.
- **Recipes vs blocks vs components are visually distinct.** Blocks/scaffolds get composition guides (slots, regions); recipes live in guides/apps, never in component navigation. This enforces Q5 of the tree in the information architecture.
- **Axis docs stay neutral and unstyled** (roadmap staged plan: install, APIs, examples, a11y, contributing; no styled identity, no CLI/MCP). Kern docs own theming, tokens, and system switching. Agent surfaces (`llms.txt`, MCP) stay Kern's; Axis contributes only its public-export inventory.

## 8. Open questions (for owners, not blockers)

- **O-1 Device/SR truth.** No device or screen-reader runs exist in either repo (roadmap D-DEVICE). All "native behavior" evidence is emulator-independent (vitest + RNTL + Expo export bundles). The placement rule assumes Axis components are genuinely proven; until D-DEVICE runs, treat `complete` as "contract-complete, device-unverified" in docs. (Pre-existing, restated for scope.)
- **O-2 Second foundation?** Roadmap reserves "future foundations (React Aria/Radix on web, potentially RNP on native) through documented contracts + registration." The tree's Q2a/Q3a currently route to exactly one behavior source per renderer (Base UI / Axis). If a second foundation ever registers, the placement page needs a "which foundation" branch — do not add it speculatively.
- **O-3 Web peer on `@xoroh/axis` at publish.** `react-native` peer is inert-but-present for web installers (§2). Decide at publish-time: document-and-keep vs `./models` subpath. Measure installer warnings first.
- **O-4 Subpath exports mirroring Base UI.** `@base-ui/react` offers per-component subpaths; both Axis and Kern barrels are single-entry by contract. At 10 systems × 2 renderers, install granularity may matter (Tamagui's per-target builds are the cautionary tale in the other direction). Revisit with bundle-size evidence, not before.
- **O-5 Styling-engine convergence.** Kern web = Tailwind v4 + CSS vars; native = StyleSheet + scheme objects; icons bridge via export conditions. Unistyles/NativeWind show a single-authoring-surface alternative exists, but migration cost is high and SSR (NativeWind) is weak. Default: keep both engines; unify only on measured pain.
- **O-6 `collection` / `mergeRefs` gating.** Still gated on real consumers (Axis inventory). If Kern's menu/filter work produces the consumer, transfer per the gate — the tree's Q4a already handles it; no policy change needed.
- **O-7 Who owns the placement page.** Roadmap says shared dependency direction is canonical in Kern (D-DEP) with Axis mirroring. Put the tree in Kern docs, link from Axis AGENTS/docs. Confirm with both threads to avoid a second editable copy.

## Sources

Local (all paths verified 2026-10-16): `axis/packages/axis/package.json`,
`axis/packages/axis/scripts/check-boundary.mjs`,
`axis/packages/axis/src/index.ts`, `axis/docs/COMPONENT_CONTRACT.md`,
`axis/docs/BASE_UI_PARITY.md`, `axis/docs/COVERAGE.md`,
`kern/docs/architecture.md`,
`kern/docs/architecture/kern-axis-migration-and-roadmap.md`,
`kern/docs/conventions/file-ownership.md`,
`kern/docs/conventions/parity.md`, `kern/docs/conventions/primitives.md`,
`kern/docs/platform-parity.md`, `kern/packages/kern*/package.json`,
`kern/packages/kern-material-3/README.md`,
`kern/packages/kern/src/components/{menu-family,sheet-family,presentation}.tsx`
(plus grep-verified Axis importers in `kern-native`).

External (official docs / GitHub source; two load-bearing claims re-fetched
2026-10-16): https://base-ui.com/react/overview/about,
https://base-ui.com/react/handbook/styling,
https://base-ui.com/react/handbook/composition,
https://base-ui.com/react/utils/use-render, https://github.com/mui/base-ui,
https://www.radix-ui.com/primitives/docs, https://github.com/radix-ui/primitives,
https://ui.shadcn.com/docs,
https://ui.shadcn.com/docs/changelog/2026-01-base-ui,
https://ui.shadcn.com/docs/changelog/2026-02-radix-ui,
https://react-spectrum.adobe.com/react-aria/,
https://github.com/adobe/react-spectrum,
https://github.com/adobe/react-spectrum/blob/main/README.md,
https://github.com/adobe/react-spectrum/blob/main/rfcs/2023-react-aria-components.md,
https://github.com/adobe/react-spectrum/issues/696,
https://react-spectrum.adobe.com/getting-started, https://spectrum.adobe.com/,
https://github.com/tamagui/tamagui, https://tamagui.dev/docs/core/configuration,
https://tamagui.dev/docs/core/theme, https://tamagui.dev/blog/version-three,
https://tamagui.dev/docs/intro/compiler-install,
https://github.com/gluestack/gluestack-ui,
https://gluestack.io/ui/docs/home/overview/introduction,
https://gluestack.io/ui/docs/home/core-concepts/universal,
https://github.com/roninoss/rn-primitives, https://rnprimitives.com/,
https://github.com/founded-labs/react-native-reusables,
https://reactnativereusables.com/docs,
https://github.com/nativewind/nativewind,
https://www.nativewind.dev/docs/core-concepts/tailwindcss,
https://www.nativewind.dev/docs/getting-started/installation/nextjs,
https://github.com/material-components/material-web, https://material-web.dev/,
https://material-web.dev/theming/material-theming, https://m3.material.io/,
https://m3.material.io/foundations/design-tokens/overview,
https://github.com/material-components/material-components-android,
https://developer.android.com/jetpack/androidx/releases/compose-material3,
https://github.com/material-foundation/material-tokens,
https://github.com/jpudysz/react-native-unistyles,
https://unistyl.es/v3/start/how-unistyles-works,
https://unistyl.es/v3/references/web-styles,
https://unistyl.es/v3/references/web-only/,
https://www.unistyl.es/v3/guides/server-side-rendering.
