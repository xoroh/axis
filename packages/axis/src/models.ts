/**
 * `@xoroh/axis/models` — the universal behavior zone.
 *
 * Every behavior model and hook, without the native components: pure
 * TypeScript/React, no `react-native` import anywhere in its
 * transitive closure (enforced by `check:boundary`). Web consumers
 * (including Kern web) import models from here and never pull the
 * native runtime. Rendered components live under the `.` entry only.
 *
 * The export list mirrors the model sections of `./index.ts` exactly:
 * adding a model export to one entry without the other is a gate
 * failure (see `check-boundary.mjs` models-parity section).
 */
export {
  type A11yDir,
  createIdScope,
  type IdScope,
  resolveDir,
} from "./a11y";
export {
  type AttachmentError,
  type AttachmentLimits,
  type AttachmentState,
  type ChatAttachment,
  updateAttachment,
  useAttachments,
  validateAttachment,
} from "./attachments";
export {
  buildCalendarGrid,
  type CalendarCell,
  type CalendarDateParts,
  type CalendarDirection,
  type CalendarGrid,
  type CalendarGridOptions,
  type CalendarKey,
  type CalendarMonthParts,
  type CalendarRange,
  type CalendarRangePosition,
  type CalendarSelection,
  type CalendarSelectionMode,
  daysInCalendarMonth,
  type FirstDayOfWeek,
  isCalendarDateDisabled,
  leadingBlankCount,
  parseCalendarDate,
  parseCalendarMonth,
  resolveCalendarFocus,
  resolveCalendarSelection,
  resolveCalendarWeekdayNames,
  shiftCalendarMonth,
  toCalendarDate,
  toCalendarMonth,
} from "./calendar";
export {
  nextBranchIndex,
  normalizeBranchIndex,
  previousBranchIndex,
  shouldHideBranchPicker,
  useBranch,
} from "./chatBranch";
export {
  type ChatMessage,
  type ChatRole,
  isUserMessage,
  resolveChatMessageLabel,
  resolveChatMessageSpeaker,
} from "./chatMessage";
export {
  type ChatSource,
  normalizeChatSources,
  resolveChatSourceLabel,
} from "./chatSource";
export {
  type ChatStatus,
  isChatBusy,
  isChatError,
  isChatStreaming,
} from "./chatStatus";
export {
  type CollectionItem,
  type CollectionMatch,
  defaultCollectionMatch,
  filterCollectionKeys,
  findCollectionText,
  useCollectionRegistry,
} from "./collection";
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
  getSharedOverlayModality,
  type OverlayId,
  type OverlayModalityRegistry,
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
  type Align,
  type Placement,
  type PositioningOptions,
  type Rect,
  resolveFloatingRect,
  resolveFloatingSide,
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
  type PromptInputSubmitMode,
  resolveCanSend,
  resolveComposerHeight,
  shouldCancelOnEscapeKey,
  shouldSubmitOnKey,
  usePromptInput,
} from "./promptInput";
export { resolveReasoningOpen } from "./reasoning";
export {
  type RenderProp,
  resolveRender,
  resolveStyle,
  type StateStyle,
} from "./render";
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
  isAtBottom,
  resolveScrollButtonVisible,
  type StickToBottomMetrics,
  useStickToBottom,
} from "./stickToBottom";
export {
  formatTimeValue,
  minutesForStep,
  normalizeTimeValue,
  type TimePickerFormat,
  type TimePickerValue,
  toTwentyFourHour,
} from "./time";
export {
  createToastQueue,
  type ToastQueue,
} from "./toastQueue";
export {
  isToolCallApproval,
  isToolCallComplete,
  isToolCallError,
  isToolCallRunning,
  resolveToolCallLabel,
  type ToolCallState,
  useToolCall,
} from "./toolCall";
export {
  appendTypeaheadQuery,
  isTypeaheadExpired,
  matchTypeaheadKey,
  type TypeaheadBuffer,
} from "./typeahead";
export { type StateAction, useControllableState } from "./useControllableState";
