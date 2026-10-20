# Axis component contract

Status: **adopted** — owner-approved substance. (Adopted from the
archived PR #7 proposal byte-identical; only lifecycle language has
changed since.) `Switch` is the first component implemented under
this contract. Each further component lands one at a time behind the
gates below — no second component until the first passes review.

Scope: the minimum consistent shape of a rendered `@xoroh/axis`
component. Component-type-specific requirements are marked
conditional — a time-picker does not inherit a Switch's contract.

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

- Component name: `PascalCase`. The naming rule mirrors Base UI
  anatomy (owner direction; verified against Base UI 1.9.0):
  - (a) Where Base UI has `X.Root` with sibling parts, Axis exports
    `XRoot` plus `X<Part>` (Base UI `Tabs.List` becomes `TabsList`),
    and exports no bare `X` beside them: no monolith wrappers
    (ADR 009; composites belong in Kern). `ContextMenu` is here:
    Base UI has `ContextMenu.Root`.
  - (b) Where Base UI's component is bare, the Axis export is bare:
    `Button`, `Input`, `Toggle`, `ToggleGroup` (its items are
    `Toggle`), `RadioGroup` (its items are `RadioRoot` and
    `RadioIndicator`, as in Base UI `Radio.*`), `CheckboxGroup`
    (its items are `CheckboxRoot`), `Separator`, `Menubar` (its
    menus are `MenuRoot`). Single-part components with no Base UI
    counterpart (`Label`, `Portal`, `PortalHost`, `AspectRatio`)
    stay bare.
  - (c) A compound family with no Base UI counterpart
    (`DropdownMenu`, `Table`) follows (a). `Overlay` follows (a)
    with no bare export: `OverlayRoot` plus `Overlay<Part>` only.
  - Types follow their component: `XRootProps` and `XRootState`
    (single-part states keep the component name: `ToggleState`,
    `ButtonState`).
  - Pending in lane PRs (not renamed here — their lanes own the
    files): `AlertDialog` and `Drawer` go to Root names in #98
    (overlays), `Combobox` and `Autocomplete` in #96 (select),
    `Slider` in #91, `OtpField` to `OTPFieldRoot` in #93 (form).
  - Known monolith gaps (tracked): `ContextMenuRoot` (content prop)
    and `ToastRoot` still need Base UI part anatomy.
- Two public entries, not one package split: the package `.`
  barrel (everything) and the `./models` subpath (behavior
  models and hooks only — no `react-native` in its transitive
  closure, so web consumers never pull the native runtime).
  Both entries' model lists must match exactly (boundary gate).
  Types ship with the component (`ComponentNameProps` exported).
  Deep imports are not supported and must not be documented.
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
- Prerequisite (satisfied by the Switch slice): the pre-component
  `check:boundary` ban on `react-native` imports and the AGENTS.md
  scope text were updated to the two-zone rule — behavior models stay
  fully platform-neutral, rendered components under `src/components/`
  may use RN host primitives only. Future components use that rule as
  written; no bypass, no per-component exemptions.

## 5. Accessibility (required, not later — ADR-112 aria-only)

- All rendered components emit ONLY web-aligned `role` and `aria-*`
  props (`aria-label`, `aria-labelledby`, `aria-disabled`, `aria-checked`,
  `aria-selected`, `aria-expanded`, `aria-valuenow`, `aria-valuemin`,
  `aria-valuemax`, `aria-valuetext`, `aria-live`, `aria-hidden`, `aria-modal`).
- Zero tolerance for legacy React Native accessibility props: never emit
  `accessibilityRole`, `accessibilityState`, `accessibilityValue`,
  `accessibilityLabel`, `accessibilityLabelledBy`, `accessibilityElementsHidden`,
  or `accessibilityLiveRegion` from any component. React Native (0.71+)
  maps `role` and `aria-*` internally to native platform accessibility APIs
  on iOS and Android.
- Every interactive component declares its `role`, appropriate `aria-*` state
  (disabled/checked/selected/expanded as applicable), and accessible name source
  (`aria-label` / `aria-labelledby` prop and/or children). Control relationships
  are declared where supported (e.g. `aria-labelledby` associations); a component
  that cannot express its relationship documents the gap instead of silently
  dropping it. Non-interactive containers expose `accessible={false}` passthrough
  unless their section says otherwise.
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

- Where both modes exist, state props follow Base UI exactly
  (critic decision 2026-10-16): binary controls use
  `checked`/`defaultChecked`/`onCheckedChange` (`Switch`,
  `Checkbox`); press-state controls use
  `pressed`/`defaultPressed`/`onPressedChange` (`Toggle`);
  value controls (groups, fields, sliders, selects) use
  `value`/`defaultValue`/`onValueChange`. All built on
  `useControllableState`; uncontrolled state never resets on
  re-render; controlled mode never writes internal state.
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

## 11. Base UI parity (owner direction 2026-10-16)

Axis is the React Native counterpart of Base UI and mirrors it as
closely as React Native allows. Concretely, per component family:

- **Compound parts**: `Root` (state owner, renders no element) plus
  the Base UI part names that have native meaning (`Trigger`,
  `Portal`, `Backdrop`, `Popup`, `Title`, `Description`, `Close`,
  `Item`, `Positioner` where measurement applies, …), and each
  family documents which Base UI pieces it omits and why.
- **Props**: Base UI names and semantics (`open`/`defaultOpen`/
  `onOpenChange`, `value`/`defaultValue`/`onValueChange`,
  `disabled`, controlled + uncontrolled via
  `useControllableState`). Axis additions (testIDs, caller styles)
  are marked as such in the parity record, never silently merged
  into mirrored semantics.
- **`render` composition** (Base UI parity for `asChild`-style
  substitution): every compound part accepts `render` — an element
  (cloned with part props merged under its own via the `slot`
  model: part handlers first, consumer style winning) or a function
  of `(props, state)`. `style` accepts a value or a function of the
  same state objects Base UI publishes.
- **`data-*` attributes**: deliberately absent everywhere. React
  Native hosts reject unknown props, and there is no stylesheet
  engine to consume attribute selectors. The same state objects
  Base UI exposes for selectors flow through function
  `style`/`render` props instead. A `className` passed on a
  substituted element is overridden to `undefined` (renderers skip
  it — no host warning fires). This is the one systematic
  deviation; it is recorded once here rather than per component.
- **`Portal`**: the native portal host is an RN `Modal`
  (presents above the app, the equivalent of appending to `body`).
  `container` has no native meaning and is omitted; `keepMounted`
  is omitted until a device-verified keep-alive strategy exists
  (invisible modal subtrees hide from RNTL exactly like the
  platform hides them — an untestable prop violates §8).
- Per-component API parity tables with deviations live in
  `docs/BASE_UI_PARITY.md`, filled family by family. A row becomes
  `complete` there only with the parts, props, composition, and
  deviations all recorded.

## Non-goals of this contract

- No styling system, theme, or token layer. No design-system
  variants. No CLI/MCP surface (Kern tooling stays the AI surface).
- No `collection`/`mergeRefs` adoption by fiat — their transfer
  gates stand until a real consumer justifies them.
- No second component until the first passes review against this
  contract.
