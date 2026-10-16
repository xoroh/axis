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
export { AlertDialog, type AlertDialogProps } from "./components/AlertDialog";
export { AspectRatio, type AspectRatioProps } from "./components/AspectRatio";
export {
  Autocomplete,
  type AutocompleteProps,
} from "./components/Autocomplete";
export { Avatar, type AvatarProps } from "./components/Avatar";
export { Badge, type BadgeProps } from "./components/Badge";
export { Button, type ButtonProps } from "./components/Button";
export { ButtonGroup, type ButtonGroupProps } from "./components/ButtonGroup";
export { Calendar, type CalendarProps } from "./components/Calendar";
export { Card, type CardProps } from "./components/Card";
export { Carousel, type CarouselProps } from "./components/Carousel";
export { Checkbox, type CheckboxProps } from "./components/Checkbox";
export {
  CheckboxGroup,
  CheckboxGroupItem,
  type CheckboxGroupItemProps,
  type CheckboxGroupProps,
} from "./components/CheckboxGroup";
export { Chip, type ChipProps } from "./components/Chip";
export {
  Collapsible,
  CollapsiblePanel,
  type CollapsiblePanelProps,
  type CollapsibleProps,
  CollapsibleTrigger,
  type CollapsibleTriggerProps,
} from "./components/Collapsible";
export { Combobox, type ComboboxProps } from "./components/Combobox";
export { ContextMenu, type ContextMenuProps } from "./components/ContextMenu";
export { Dialog, type DialogProps } from "./components/Dialog";
export {
  DropdownMenu,
  DropdownMenuItem,
  type DropdownMenuItemProps,
  type DropdownMenuProps,
  DropdownMenuSub,
  DropdownMenuSubContent,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubProps,
  DropdownMenuSubTrigger,
  type DropdownMenuSubTriggerProps,
  DropdownMenuTrigger,
  type DropdownMenuTriggerProps,
} from "./components/DropdownMenu";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState";
export { ExtendedFab, type ExtendedFabProps } from "./components/ExtendedFab";
export { Fab, type FabProps } from "./components/Fab";
export { Field, type FieldProps } from "./components/Field";
export { Fieldset, type FieldsetProps } from "./components/Fieldset";
export { IconButton, type IconButtonProps } from "./components/IconButton";
export { Input, type InputProps } from "./components/Input";
export { Kbd, type KbdProps } from "./components/Kbd";
export { Label, type LabelProps } from "./components/Label";
export { LinkButton, type LinkButtonProps } from "./components/LinkButton";
export { ListItem, type ListItemProps } from "./components/ListItem";
export { Loader, type LoaderProps } from "./components/Loader";
export {
  LoadingButton,
  type LoadingButtonProps,
} from "./components/LoadingButton";
export {
  Menu,
  MenuItem,
  type MenuItemProps,
  type MenuProps,
  MenuTrigger,
  type MenuTriggerProps,
} from "./components/Menu";
export {
  Menubar,
  MenubarMenu,
  type MenubarMenuProps,
  type MenubarProps,
} from "./components/Menubar";
export { Meter, type MeterProps } from "./components/Meter";
export {
  NavigationBar,
  NavigationBarItem,
  type NavigationBarItemProps,
  type NavigationBarProps,
} from "./components/NavigationBar";
export {
  NavigationDrawer,
  type NavigationDrawerProps,
} from "./components/NavigationDrawer";
export {
  NavigationMenu,
  NavigationMenuItem,
  type NavigationMenuItemProps,
  NavigationMenuPanel,
  type NavigationMenuPanelProps,
  type NavigationMenuProps,
  NavigationMenuTrigger,
  type NavigationMenuTriggerProps,
} from "./components/NavigationMenu";
export {
  NavigationRail,
  NavigationRailItem,
  type NavigationRailItemProps,
  type NavigationRailProps,
} from "./components/NavigationRail";
export { NumberField, type NumberFieldProps } from "./components/NumberField";
export { OtpField, type OtpFieldProps } from "./components/OtpField";
export { Pagination, type PaginationProps } from "./components/Pagination";
export { Popover, type PopoverProps } from "./components/Popover";
export { Progress, type ProgressProps } from "./components/Progress";
export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupItemProps,
  type RadioGroupProps,
} from "./components/RadioGroup";
export { Search, type SearchProps } from "./components/Search";
export {
  Select,
  SelectItem,
  type SelectItemProps,
  type SelectProps,
} from "./components/Select";
export { Separator, type SeparatorProps } from "./components/Separator";
export {
  SettingsRow,
  type SettingsRowProps,
} from "./components/SettingsRow";
export { Sheet, type SheetProps } from "./components/Sheet";
export { Skeleton, type SkeletonProps } from "./components/Skeleton";
export { Slider, type SliderProps } from "./components/Slider";
export { SplitButton, type SplitButtonProps } from "./components/SplitButton";
export { Switch, type SwitchProps } from "./components/Switch";
export {
  Table,
  TableCell,
  type TableCellProps,
  TableHeader,
  type TableHeaderProps,
  type TableProps,
  TableRow,
  type TableRowProps,
} from "./components/Table";
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
export { Text, type TextProps } from "./components/Text";
export { Textarea, type TextareaProps } from "./components/Textarea";
export { TimePicker, type TimePickerProps } from "./components/TimePicker";
export { Toast, type ToastProps } from "./components/Toast";
export { Toggle, type ToggleProps } from "./components/Toggle";
export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupItemProps,
  type ToggleGroupProps,
} from "./components/ToggleGroup";
export { Toolbar, type ToolbarProps } from "./components/Toolbar";
export { Tooltip, type TooltipProps } from "./components/Tooltip";
export { TopAppBar, type TopAppBarProps } from "./components/TopAppBar";
export { Trigger, type TriggerProps } from "./components/Trigger";
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
