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
export {
  Accordion,
  AccordionItem,
  type AccordionItemProps,
  type AccordionProps,
} from "./components/Accordion";
export { Avatar, type AvatarProps } from "./components/Avatar";
export { Badge, type BadgeProps } from "./components/Badge";
export { Button, type ButtonProps } from "./components/Button";
export { Checkbox, type CheckboxProps } from "./components/Checkbox";
export {
  CheckboxGroup,
  CheckboxGroupItem,
  type CheckboxGroupItemProps,
  type CheckboxGroupProps,
} from "./components/CheckboxGroup";
export {
  Collapsible,
  CollapsiblePanel,
  type CollapsiblePanelProps,
  type CollapsibleProps,
  CollapsibleTrigger,
  type CollapsibleTriggerProps,
} from "./components/Collapsible";
export { Dialog, type DialogProps } from "./components/Dialog";
export { Field, type FieldProps } from "./components/Field";
export { Fieldset, type FieldsetProps } from "./components/Fieldset";
export { Input, type InputProps } from "./components/Input";
export { Label, type LabelProps } from "./components/Label";
export { NumberField, type NumberFieldProps } from "./components/NumberField";
export { OtpField, type OtpFieldProps } from "./components/OtpField";
export { Progress, type ProgressProps } from "./components/Progress";
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupItemProps,
  type RadioGroupProps,
} from "./components/RadioGroup";
export { Separator, type SeparatorProps } from "./components/Separator";
export { Switch, type SwitchProps } from "./components/Switch";
export {
  Tabs,
  TabsList,
  type TabsListProps,
  TabsPanel,
  type TabsPanelProps,
  type TabsProps,
  TabsTrigger,
  type TabsTriggerProps,
} from "./components/Tabs";
export { Textarea, type TextareaProps } from "./components/Textarea";
export { Toast, type ToastProps } from "./components/Toast";
export { Toggle, type ToggleProps } from "./components/Toggle";
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
