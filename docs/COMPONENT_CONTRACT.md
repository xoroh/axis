# Axis component contract (draft for review)

Status: **proposal** — documentation only. No component is implemented
under this contract yet. A component lands only after this contract is
reviewed, and then one component at a time behind the gates below.

Scope: the minimum consistent shape of a rendered `@xoroh/axis`
component. It constrains the first real components (a Switch-class
control is the expected first vertical slice); it is not a framework
for every future component. Component-type-specific requirements are
marked conditional — a time-picker does not inherit a Switch's
contract.

## 1. What a component is

- A React Native rendered control: `View`/`Text`/`Pressable` (or
  platform equivalents) composed in this package, driven by the
  existing behavior models where they apply (`useControllableState`,
  `usePress`, `useSelection`, …). New behavior needed by a component
  is added as a model with its own unit tests first — never inline.
- Unstyled: structure, behavior, and accessibility only. All visual
  values (colors, spacing, type) are caller-provided plain values
  (dp numbers, color strings). No token reads, no `--*` references,
  no theme resolution inside the component (boundary gate enforces).
- Design-system variants (Material, Astryx, …) live in the consuming
  system, never here.

## 2. Naming and public exports

- Component name: `PascalCase`, matching the RN ecosystem term
  (`Switch`, `Dialog`, `Pressable`-backed `Button` only if the
  contract's Button section exists — do not invent names).
- Exactly one public entry: the package `.` barrel. Types ship with
  the component (`ComponentNameProps` exported). Deep imports are not
  supported and must not be documented.
- Props type name: `<Name>Props`. Event callbacks: `on<EventName>`
  (`onValueChange`, `onOpenChange`). No `render` inversion unless the
  component's section defines it; ref forwarding is required (see §7).

## 3. Props, types, API consistency

- Every prop has a documented type, default (or "no default —
  uncontrolled initial"), and requiredness. `boolean | undefined`
  with `defaultValue` + `onChange` follows the `useControllableState`
  pattern already in this package; controlled and uncontrolled modes
  are both tested (see §8).
- Compound parts (e.g. `Dialog.Trigger/Content`) are separate exports
  with per-part prop tables. Shared family-level props are documented
  once and referenced, never copy-pasted per part with divergent text.
- Type text in generated tables is informational; prop NAMES are the
  contract. Removing or renaming a public prop is a breaking change
  and requires a changeset + migration note.

## 4. Native rendering and platform behavior

- Renders with host components only; no DOM, no web-only APIs, no
  `react-native-web` assumptions. Platform extensions (`.ios.`/
  `.android.`) only where behavior genuinely differs, with the shared
  contract asserted on both.
- Measurement (`onLayout`/`measure`) stays per-consumer; shared code
  takes plain rect numbers (the `positioning` precedent: math shared,
  measurement not).
- Dismissal, modality, portal hosting, and presence follow the
  existing models (`dismissPolicy`/`dismissWiring`,
  `overlayModality`, `portal`, `presence`). A component that cannot
  use them documents why in its section.
- Prerequisite note: the current `check:boundary` ban on
  `react-native` imports and the AGENTS.md scope text predate
  rendered components. The first component PR must propose their
  scoped update (allow RN host imports for component sources, keep
  the token/Kern/design-system bans absolute). Until then, the
  rendering clauses above are not yet satisfiable in CI — which is
  why no component starts before this contract is agreed.

## 5. Accessibility (required, not later)

- Every interactive component declares its `accessibilityRole`,
  `accessibilityState` (disabled/checked/selected/expanded as
  applicable), and accessible label source (label prop and/or
  children). Control relationships are declared where the platform
  supports them (e.g. labelled-by associations); a component that
  cannot express its relationship documents the gap instead of
  silently dropping it. Non-interactive containers expose
  `accessible={false}` passthrough unless their section says
  otherwise.
- Focus: single tab-stop discipline via the `roving` model where a
  group manages focus; modal surfaces contain focus per
  `overlayModality` + `focusTrap` semantics adapted to RN (no DOM
  tab-order assumptions; accessibility-focus traversal instead).
- Screen-reader announcements for state changes that have no visual
  equivalent in the harness come from `AccessibilityInfo`/`announce*`
  only where the component section requires it — never speculative
  announcements.
- Conditional: keyboard-specific behavior (arrow-key traversal,
  type-ahead, PageUp/Down) applies only to components whose section
  adopts the `roving`/`collection` models; a Switch MUST NOT grow
  type-ahead to look complete.

## 6. Controlled / uncontrolled state

- Where both modes exist: `value` + `defaultValue` + `onValueChange`
  naming, built on `useControllableState`; uncontrolled state never
  resets on re-render; controlled mode never writes internal state.
- Single-selection controls do not deselect on re-activation unless
  their section specifies toggle semantics (the `selection` model
  rule).

## 7. Refs, composition, events, prop merging

- Components forward refs to the host element (`mergeRefs`-class
  composition once that module has a consumer-approved transfer;
  until then, an inline documented composition with a test).
- Consumer event handlers compose with internal ones — both fire,
  internal first (the `slot` `composeEventHandlers` precedent).
  `mergeSlotProps` order (internal → consumer, consumer wins on
  conflict except `ref`/`key`) is the default unless a section
  overrides with rationale.
- `disabled` is terminal: no state transitions, no callbacks, no
  announcements from a disabled control (the `usePress` precedent).

## 8. Test requirements and evidence

- Unit (vitest): model-level behavior, edge cases (empty nodes,
  unknown keys, repeated type-ahead characters, clamping).
- Native behavior (jest + RN preset, `*.rntest.tsx`, public-entry
  imports only per the boundary gate): render the component,
  interact through RN events (`fireEvent.press`, `pressIn`/`pressOut`),
  assert state changes AND `accessibilityRole`/`accessibilityState`
  values. Import-success-only tests are rejected in review.
- A component with dismissal/modality/portal behavior includes the
  stack-order and cleanup tests (the `overlay` suite precedent).
- Each component slice re-runs package validation (declaration
  output, `publint`, `attw`): a component that breaks the published
  surface or its types fails the slice, even with green unit tests.
- No physical-device run is claimed until it executes (D-DEVICE in
  the Kern roadmap); emulator-independent suites are labeled as such.

## 9. Documentation and examples

- Each component ships: purpose (one paragraph), install snippet,
  minimal working example, full prop table, accessibility section
  (role/states/labels/focus/SR behavior), and controlled +
  uncontrolled examples where both modes exist.
- Examples are tested or generated from tested fixtures where the
  tooling supports it — never untested copy-paste.
- Passive discovery metadata (`keywords`, docs index entries) is
  added with the component, not after.

## 10. Compatibility, deprecation, versioning

- Peer ranges widen only with evidence (a tested consumer on the new
  range). `react-native` peer is declared when the first component
  lands — not before, not as `*`.
- Deprecation: one minor release with runtime warning + docs note
  before removal. Removal without deprecation is a process failure.
- Changesets (`minor` for new components until `1.0`) accompany every
  user-facing change. Nothing here publishes anything; release
  operations stay manual and separately authorized.

## Non-goals of this contract

- No styling system, theme, or token layer. No design-system
  variants. No CLI/MCP surface (Kern tooling stays the AI surface).
- No `collection`/`mergeRefs` adoption by fiat — their transfer
  gates stand until a real consumer justifies them.
- No second component until the first passes review against this
  contract.
