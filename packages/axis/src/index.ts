/**
 * `@xoroh/axis` — design-system-neutral, native-first unstyled behavior
 * models and components (the `.` entry: everything).
 *
 * Two zones, one package:
 *
 * - Models (`src/*.ts`, re-exported alone as `@xoroh/axis/models`):
 *   UNIVERSAL behavior — pure TypeScript/React, no `react-native`
 *   import anywhere in the transitive closure (boundary gate
 *   enforced). Usable by Kern web and native alike.
 * - Components (`src/components/`, `.` entry only): NATIVE-ONLY
 *   rendered controls. No DOM renderer will ever be added.
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
  type CalendarMonthNameStyle,
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
  resolveCalendarMonthNames,
  resolveCalendarSelection,
  resolveCalendarWeekdayNames,
  resolveLocaleFirstDay,
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
  AccordionHeader,
  type AccordionHeaderProps,
  type AccordionHeaderState,
  AccordionItem,
  type AccordionItemProps,
  type AccordionItemState,
  AccordionPanel,
  type AccordionPanelProps,
  type AccordionPanelState,
  AccordionRoot,
  type AccordionRootProps,
  type AccordionRootState,
  AccordionTrigger,
  type AccordionTriggerProps,
  type AccordionTriggerState,
} from "./components/Accordion";
export {
  AlertDialogBackdrop,
  type AlertDialogBackdropProps,
  type AlertDialogBackdropState,
  AlertDialogClose,
  type AlertDialogCloseProps,
  type AlertDialogCloseState,
  AlertDialogDescription,
  type AlertDialogDescriptionProps,
  AlertDialogPopup,
  type AlertDialogPopupProps,
  type AlertDialogPopupState,
  AlertDialogPortal,
  type AlertDialogPortalProps,
  AlertDialogRoot,
  type AlertDialogRootProps,
  type AlertDialogRootState,
  AlertDialogTitle,
  type AlertDialogTitleProps,
  AlertDialogTrigger,
  type AlertDialogTriggerProps,
  type AlertDialogTriggerState,
} from "./components/AlertDialog";
export { AspectRatio, type AspectRatioProps } from "./components/AspectRatio";
export {
  Autocomplete,
  type AutocompleteProps,
  type AutocompleteState,
} from "./components/Autocomplete";
export {
  AvatarFallback,
  type AvatarFallbackProps,
  type AvatarFallbackState,
  AvatarImage,
  type AvatarImageProps,
  type AvatarImageState,
  AvatarRoot,
  type AvatarRootProps,
  type AvatarRootState,
  type ImageLoadingStatus,
} from "./components/Avatar";
export {
  Button,
  type ButtonProps,
  type ButtonState,
} from "./components/Button";
export {
  CheckboxIndicator,
  type CheckboxIndicatorProps,
  type CheckboxIndicatorState,
  CheckboxRoot,
  type CheckboxRootProps,
  type CheckboxState,
} from "./components/Checkbox";
export {
  CheckboxGroup,
  CheckboxGroupItem,
  type CheckboxGroupItemProps,
  type CheckboxGroupItemState,
  type CheckboxGroupProps,
  type CheckboxGroupState,
} from "./components/CheckboxGroup";
export {
  Collapsible,
  CollapsiblePanel,
  type CollapsiblePanelProps,
  type CollapsibleProps,
  type CollapsibleState,
  CollapsibleTrigger,
  type CollapsibleTriggerProps,
  type CollapsibleTriggerState,
} from "./components/Collapsible";
export {
  Combobox,
  type ComboboxProps,
  type ComboboxState,
} from "./components/Combobox";
export {
  ContextMenu,
  type ContextMenuProps,
  type ContextMenuState,
} from "./components/ContextMenu";
export {
  Dialog,
  DialogBackdrop,
  type DialogBackdropProps,
  type DialogBackdropState,
  DialogClose,
  type DialogCloseProps,
  type DialogCloseState,
  DialogDescription,
  type DialogDescriptionProps,
  DialogPopup,
  type DialogPopupProps,
  type DialogPopupState,
  DialogPortal,
  type DialogPortalProps,
  DialogRoot,
  type DialogRootProps,
  type DialogRootState,
  DialogTitle,
  type DialogTitleProps,
  DialogTrigger,
  type DialogTriggerProps,
  type DialogTriggerState,
} from "./components/Dialog";
export {
  DrawerBackdrop,
  type DrawerBackdropProps,
  type DrawerBackdropState,
  DrawerClose,
  type DrawerCloseProps,
  type DrawerCloseState,
  DrawerDescription,
  type DrawerDescriptionProps,
  DrawerHandle,
  type DrawerHandleProps,
  type DrawerHandleState,
  DrawerPopup,
  type DrawerPopupProps,
  type DrawerPopupState,
  DrawerPortal,
  type DrawerPortalProps,
  DrawerRoot,
  type DrawerRootProps,
  type DrawerRootState,
  type DrawerSide,
  type DrawerSnapPoint,
  DrawerTitle,
  type DrawerTitleProps,
  DrawerTrigger,
  type DrawerTriggerProps,
  type DrawerTriggerState,
} from "./components/Drawer";
export {
  DropdownMenu,
  DropdownMenuItem,
  type DropdownMenuItemProps,
  type DropdownMenuItemState,
  type DropdownMenuProps,
  type DropdownMenuState,
  DropdownMenuSub,
  DropdownMenuSubContent,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubProps,
  DropdownMenuSubTrigger,
  type DropdownMenuSubTriggerProps,
  DropdownMenuTrigger,
  type DropdownMenuTriggerProps,
  type DropdownMenuTriggerState,
} from "./components/DropdownMenu";
export { Field, type FieldProps, type FieldState } from "./components/Field";
export { Fieldset, type FieldsetProps } from "./components/Fieldset";
export { Input, type InputProps, type InputState } from "./components/Input";
export { Label, type LabelProps } from "./components/Label";
export {
  Menu,
  MenuArrow,
  type MenuArrowProps,
  MenuBackdrop,
  type MenuBackdropProps,
  type MenuBackdropState,
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  type MenuCheckboxItemIndicatorProps,
  type MenuCheckboxItemProps,
  type MenuCheckboxItemState,
  MenuClear,
  type MenuClearProps,
  type MenuClearState,
  MenuEmpty,
  type MenuEmptyProps,
  MenuGroup,
  MenuGroupLabel,
  type MenuGroupLabelProps,
  type MenuGroupProps,
  MenuInput,
  type MenuInputProps,
  MenuItem,
  type MenuItemProps,
  type MenuItemState,
  MenuLinkItem,
  type MenuLinkItemProps,
  MenuPopup,
  type MenuPopupProps,
  type MenuPopupState,
  MenuPortal,
  type MenuPortalProps,
  MenuPositioner,
  type MenuPositionerProps,
  type MenuPositionerState,
  type MenuProps,
  MenuRadioGroup,
  type MenuRadioGroupProps,
  MenuRadioItem,
  MenuRadioItemIndicator,
  type MenuRadioItemIndicatorProps,
  type MenuRadioItemProps,
  type MenuRadioItemState,
  MenuRoot,
  type MenuRootProps,
  type MenuRootState,
  MenuSeparator,
  type MenuSeparatorProps,
  MenuSubmenuContent,
  type MenuSubmenuContentProps,
  MenuSubmenuRoot,
  type MenuSubmenuRootProps,
  MenuSubmenuTrigger,
  type MenuSubmenuTriggerProps,
  MenuTrigger,
  type MenuTriggerProps,
  type MenuTriggerState,
} from "./components/Menu";
export {
  Menubar,
  MenubarMenu,
  type MenubarMenuProps,
  type MenubarProps,
  type MenubarState,
} from "./components/Menubar";
export {
  MeterIndicator,
  type MeterIndicatorProps,
  MeterLabel,
  type MeterLabelProps,
  MeterRoot,
  type MeterRootProps,
  type MeterRootState,
  MeterTrack,
  type MeterTrackProps,
  MeterValue,
  type MeterValueProps,
} from "./components/Meter";
export {
  NavigationMenu,
  NavigationMenuItem,
  type NavigationMenuItemProps,
  NavigationMenuPanel,
  type NavigationMenuPanelProps,
  type NavigationMenuProps,
  type NavigationMenuState,
  NavigationMenuTrigger,
  type NavigationMenuTriggerProps,
  type NavigationMenuTriggerState,
} from "./components/NavigationMenu";
export {
  NumberFieldDecrement,
  type NumberFieldDecrementProps,
  NumberFieldGroup,
  type NumberFieldGroupProps,
  NumberFieldIncrement,
  type NumberFieldIncrementProps,
  NumberFieldInput,
  type NumberFieldInputProps,
  NumberFieldRoot,
  type NumberFieldRootProps,
  NumberFieldScrubArea,
  type NumberFieldScrubAreaProps,
  type NumberFieldScrubDirection,
  type NumberFieldState,
} from "./components/NumberField";
export {
  OtpField,
  type OtpFieldProps,
  type OtpFieldState,
} from "./components/OtpField";
export {
  Overlay,
  OverlayBackdrop,
  type OverlayBackdropProps,
  type OverlayBackdropState,
  OverlayClose,
  type OverlayCloseProps,
  type OverlayCloseState,
  type OverlayContextValue,
  type OverlayDismissOptions,
  OverlayPopup,
  type OverlayPopupProps,
  type OverlayPopupState,
  OverlayPortal,
  type OverlayPortalProps,
  OverlayRoot,
  type OverlayRootProps,
  type OverlayRootState,
  OverlayTrigger,
  type OverlayTriggerProps,
  type OverlayTriggerState,
  useModalActive,
  useOverlay,
  useScrollLock,
} from "./components/Overlay";
export {
  Popover,
  PopoverArrow,
  type PopoverArrowProps,
  PopoverBackdrop,
  type PopoverBackdropProps,
  type PopoverBackdropState,
  PopoverClose,
  type PopoverCloseProps,
  type PopoverCloseState,
  PopoverDescription,
  type PopoverDescriptionProps,
  PopoverPopup,
  type PopoverPopupProps,
  type PopoverPopupState,
  PopoverPortal,
  type PopoverPortalProps,
  PopoverPositioner,
  type PopoverPositionerProps,
  type PopoverPositionerState,
  type PopoverProps,
  PopoverRoot,
  type PopoverRootProps,
  type PopoverRootState,
  PopoverTitle,
  type PopoverTitleProps,
  PopoverTrigger,
  type PopoverTriggerProps,
  type PopoverTriggerState,
} from "./components/Popover";
export {
  Portal,
  PortalHost,
  type PortalHostProps,
  type PortalProps,
} from "./components/Portal";
export {
  Progress,
  type ProgressProps,
  type ProgressState,
} from "./components/Progress";
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupItemProps,
  type RadioGroupItemState,
  type RadioGroupProps,
  type RadioGroupState,
} from "./components/RadioGroup";
export {
  Select,
  SelectArrow,
  type SelectArrowProps,
  SelectBackdrop,
  type SelectBackdropProps,
  type SelectBackdropState,
  SelectGroup,
  SelectGroupLabel,
  type SelectGroupLabelProps,
  type SelectGroupProps,
  SelectItem,
  SelectItemIndicator,
  type SelectItemIndicatorProps,
  type SelectItemProps,
  type SelectItemState,
  SelectItemText,
  type SelectItemTextProps,
  SelectPopup,
  type SelectPopupProps,
  type SelectPopupState,
  SelectPortal,
  type SelectPortalProps,
  SelectPositioner,
  type SelectPositionerProps,
  type SelectPositionerState,
  type SelectProps,
  SelectRoot,
  type SelectRootProps,
  type SelectRootState,
  SelectSeparator,
  type SelectSeparatorProps,
  SelectTrigger,
  type SelectTriggerProps,
  type SelectTriggerState,
  SelectValue,
  type SelectValueProps,
  type SelectValueState,
} from "./components/Select";
export { Separator, type SeparatorProps } from "./components/Separator";
export {
  Slider,
  type SliderProps,
  type SliderState,
} from "./components/Slider";
export {
  Switch,
  type SwitchProps,
  type SwitchState,
} from "./components/Switch";
export {
  Table,
  TableCell,
  type TableCellProps,
  TableHeader,
  type TableHeaderProps,
  type TableProps,
  TableRow,
  type TableRowProps,
  type TableRowState,
} from "./components/Table";
export {
  Tabs,
  TabsList,
  type TabsListProps,
  TabsPanel,
  type TabsPanelProps,
  type TabsProps,
  type TabsState,
  TabsTrigger,
  type TabsTriggerProps,
  type TabsTriggerState,
} from "./components/Tabs";
export {
  Toast,
  type ToastManager,
  type ToastOptions,
  type ToastProps,
  ToastProvider,
  type ToastState,
  ToastViewport,
  type ToastViewportProps,
  type ToastViewportState,
  useToast,
} from "./components/Toast";
export {
  Toggle,
  type ToggleProps,
  type ToggleState,
} from "./components/Toggle";
export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupItemProps,
  type ToggleGroupItemState,
  type ToggleGroupProps,
  type ToggleGroupState,
} from "./components/ToggleGroup";
export {
  Toolbar,
  type ToolbarProps,
  type ToolbarState,
} from "./components/Toolbar";
export {
  Tooltip,
  TooltipArrow,
  type TooltipArrowProps,
  TooltipPopup,
  type TooltipPopupProps,
  type TooltipPopupState,
  TooltipPortal,
  type TooltipPortalProps,
  TooltipPositioner,
  type TooltipPositionerProps,
  type TooltipPositionerState,
  type TooltipProps,
  TooltipProvider,
  type TooltipProviderProps,
  TooltipRoot,
  type TooltipRootProps,
  type TooltipState,
  TooltipTrigger,
  type TooltipTriggerProps,
  type TooltipTriggerState,
} from "./components/Tooltip";
export type {
  FocusInteraction,
  OverlayFocusValue,
} from "./components/useAccessibilityFocus";
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
  type OverlayOpenChangeDetails,
  type OverlayOpenChangeReason,
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
  clampNumberValue,
  formatNumberValue,
  type NumberFormatSpec,
  parseNumberValue,
  stepNumberValue,
} from "./number";
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
  addTimeMinutes,
  formatTimeParts,
  formatTimeValue,
  minutesForStep,
  normalizeTimeValue,
  type TimeParts,
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
