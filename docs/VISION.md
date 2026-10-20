# Axis VISION

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: current. Date: 2026-10-16.

Planning sources (not duplicated here): [`docs/COMPONENT_CONTRACT.md`](COMPONENT_CONTRACT.md) (what a component is), [`docs/BASE_UI_PARITY.md`](BASE_UI_PARITY.md) (per-component parity), [`docs/COVERAGE.md`](COVERAGE.md) (coverage inventory), [`docs/RELEASING.md`](RELEASING.md) (release flow).

## North star

Unstyled, token-free React Native primitives — the native counterpart of Base UI.

## Who it is for

- React Native teams needing accessible behavior primitives without a design system attached.
- Design-system builders composing neutral behavior into their own styled components.

## Principles

1. Matches Base UI component by component: same names, compound parts, prop semantics, controlled + uncontrolled patterns, `render`-style composition — with every intentional native deviation documented.
2. Unstyled and token-free: structure, behavior, accessibility only. All visual values are caller-provided; zero `--*` references, zero token reads (boundary-gated).
3. Never depends on a design system, tokens, or theming. Dependency direction is always design system → `@xoroh/axis`, never the reverse.
4. `rn-primitives` and other mature RN libraries are implementation references for native behavior, accessibility, gestures, and portals only: no dependency, no wholesale copying.
5. Contains only base behavior primitives (Base UI equivalents plus standard mobile primitives). Design patterns live in the consuming design systems.

## Explicit non-goals

- No styling system, theme, or token layer. No design-system variants (any brand or material system) here.
- No MCP or CLI — AI tooling surfaces stay with consumers; Axis exposes only its public API inventory for discovery.
- No DOM, Expo, or design-system token imports (RN host imports only under `packages/axis/src/components/` per contract).
- No website/playground as a second product identity (docs stay neutral; site stages are owner-gated and must not gate primitives work).
- No `collection` / `mergeRefs` adoption by fiat — transfer only with a real consumer.

## Quality bar

- A row becomes `complete` in `docs/COVERAGE.md` only with implementation + RNTL behavior tests + docs + boundary-clean review. Never mark by export alone.
- Ships as `@xoroh/axis` (0.1.0 shipped 2026-10-20 through the release pipeline; see `docs/RELEASING.md`).

## How Axis stays neutral

- Axis is a standalone library: no tokens, themes, icons, or styled components of its own.
- Consuming design systems (a multi-design-system platform, a brand system, an app) own tokens/themes, styled components, blocks, and docs/discovery, built on the `@xoroh/axis` public entry.
- Axis never grows a design-system identity of its own; it stays the neutral native foundation underneath.
