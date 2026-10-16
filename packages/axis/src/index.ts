/**
 * `@xoroh/axis` — design-system-neutral, native-first behavior primitives.
 *
 * Provenance: slices transfer from `xoroh/kern` (`libs/kern-primitives`)
 * byte-identical; see `axis-contract.md` in Kern for the per-symbol
 * provenance and the AX0 dispositions. Later slices add remaining models
 * with native bindings. No symbol transfers without a consumer or an
 * explicit gate.
 *
 * Public surface discipline: only adopted behavior is exported here.
 * Factory internals (`createPressModel`, `createRovingModel`,
 * `createFocusTrapModel`), the web-only key predicate
 * (`isPressActivationKey`), the CSS hiding style
 * (`VISUALLY_HIDDEN_STYLE`), and viewport-clamp math
 * (`clampRectToViewport`, `resolveFloatingOrigin`) exist in source where
 * hooks or tests need them but are NOT public API. Promote any of them
 * only with a consumer and a contract amendment.
 *
 * Boundary (enforced by review + CI): nothing here imports design-system
 * code, token packages, or web-only APIs.
 */

export {
  type A11yDir,
  createIdScope,
  type IdScope,
  resolveDir,
} from "./a11y";
export { Switch, type SwitchProps } from "./components/Switch";
export {
  createDismissPolicy,
  type DismissPolicy,
  type DismissPolicyOptions,
  type DismissTriggers,
  dismissTriggersFor,
} from "./dismissPolicy";
export {
  type DismissBranches,
  type DismissSource,
  type DismissWiringOptions,
  dismissBranchesFor,
  shouldDismissOn,
} from "./dismissWiring";
export {
  type AutofocusEvent,
  type FocusTrapModel,
  nextTrapIndex,
  resolveAutofocus,
  type TrapMove,
} from "./focusTrap";
export {
  createOverlayModality,
  type OverlayId,
  type OverlayModalityState,
  useOverlayModality,
  useOverlayRegistration,
} from "./overlayModality";
export {
  createPortalRegistry,
  type PortalEntry,
  type PortalRegistry,
  resolvePortalTarget,
} from "./portal";
export {
  type Placement,
  type PositioningOptions,
  type Rect,
  resolveFloatingRect,
} from "./positioning";
export {
  createPresenceModel,
  nextPresenceState,
  type PresenceModel,
  type PresenceState,
  usePresence,
} from "./presence";
export {
  type PressModel,
  type PressPhase,
  usePress,
} from "./press";
export {
  type RovingItem,
  type RovingModel,
  type RovingOptions,
  type RovingOrientation,
  useRovingModel,
} from "./roving";
export {
  isSelected,
  normalizeSelection,
  type Selection,
  type SelectionKey,
  type SelectionMode,
  toggleSelection,
  useSelection,
} from "./selection";
export {
  composeEventHandlers,
  mergeSlotProps,
  type SlotProps,
} from "./slot";
export {
  formatTimeValue,
  minutesForStep,
  normalizeTimeValue,
  type TimePickerFormat,
  type TimePickerValue,
  toTwentyFourHour,
} from "./time";
export { type StateAction, useControllableState } from "./useControllableState";
