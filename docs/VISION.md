# Axis VISION

> Rule: the roadmap is the single source for planned work; VISION is the test every decision is checked against; ideas only move to the roadmap through an ADR.

Status: current. Date: 2026-10-16.

Planning sources (not duplicated here): [`docs/COMPONENT_CONTRACT.md`](COMPONENT_CONTRACT.md) (what a component is), [`docs/BASE_UI_PARITY.md`](BASE_UI_PARITY.md) (per-component parity), [`docs/COVERAGE.md`](COVERAGE.md) (coverage inventory), [`docs/RELEASING.md`](RELEASING.md) (release hold). Cross-repo consumer plan: Kern [`docs/architecture/kern-axis-migration-and-roadmap.md`](https://github.com/xoroh/kern/blob/main/docs/architecture/kern-axis-migration-and-roadmap.md) §§C–G (Axis readiness + Kern integration).

## North star

Unstyled, token-free React Native primitives — the native counterpart of Base UI.

## Who it is for

- React Native teams needing accessible behavior primitives without a design system attached.
- Design-system builders (starting with Kern) composing neutral behavior into their own styled components.
- Usable with or without Kern.

## Principles

1. Matches Base UI component by component: same names, compound parts, prop semantics, controlled + uncontrolled patterns, `render`-style composition — with every intentional native deviation documented.
2. Unstyled and token-free: structure, behavior, accessibility only. All visual values are caller-provided; zero `--*` references, zero token reads (boundary-gated).
3. Never depends on Kern or tokens. Dependency direction is Kern → `@xoroh/axis`, never the reverse.
4. `rn-primitives` and other mature RN libraries are implementation references for native behavior, accessibility, gestures, and portals only: no dependency, no wholesale copying.
5. Contains only base behavior primitives (Base UI equivalents plus standard mobile primitives). Design patterns live in Kern design systems.

## Explicit non-goals

- No styling system, theme, or token layer. No design-system variants (Material, Astryx, …) here.
- No MCP or CLI — Kern tooling stays the AI surface; Axis exposes only its public API inventory for discovery.
- No DOM, Expo, or design-system token imports (RN host imports only under `packages/axis/src/components/` per contract).
- No website/playground as a second product identity (docs stay neutral; site stages are owner-gated and must not gate primitives work).
- No `collection` / `mergeRefs` adoption by fiat — transfer only with a real consumer.

## Quality bar

- A row becomes `complete` in `docs/COVERAGE.md` only with implementation + RNTL behavior tests + docs + boundary-clean review. Never mark by export alone.
- Ships as `@xoroh/axis` alongside Kern 0.1.0 (see `docs/decisions/005-ship-with-kern-0-1-0.md`); release HOLD applies — no versions, tags, or publish until explicitly authorized.

## How Axis relates to Kern

- Kern is the open-source multi-design-system platform (“One foundation. Every design system.”) owning M3 (first) and future systems, tokens/themes, icons, blocks, docs/discovery, CLI source-vendoring, and MCP/AI surfaces.
- Axis is Kern’s native foundation for behavior, consumed via the `@xoroh/axis` public entry. Axis stays independent and standalone.
