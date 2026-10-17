import {
  Children,
  createContext,
  type ElementRef,
  isValidElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import {
  type CollectionItem,
  findCollectionText,
  useCollectionRegistry,
} from "../collection";
import type { Align, Placement } from "../positioning";
import {
  type RenderProp,
  resolveRender,
  resolveStyle,
  type StateStyle,
} from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { useFloatingPlacement } from "./useFloatingPlacement";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Select — an unstyled single-select dropdown.
 *
 * Structure only: a trigger `Pressable` showing the selected item's
 * label (or `placeholder` when nothing is selected) toggling a
 * positioned list of `SelectItem` pressables. No default visuals —
 * every visual value (`style`, `listStyle`) is caller-provided. Value
 * state follows the `useControllableState` pattern: `value` (+
 * `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled (`null` means empty). Open state is a SEPARATE
 * `useControllableState` pair: `open` (+ `onOpenChange`) controlled,
 * `defaultOpen` uncontrolled (default `false`). Selection is
 * single-select and replacing: activating the selected item keeps it
 * (never deselects to `null`), per the selection-model rule — the
 * hook's identity guard additionally suppresses a repeat
 * `onValueChange` for the same value. Choosing an item always closes
 * the list; scrim press closes without selecting (the Dialog scrim
 * precedent: a `Pressable` labelled `"Dismiss"`).
 *
 * The list is positioned with `useFloatingPlacement` (anchor
 * `measure()` + viewport + `resolveFloatingRect`); until measured it
 * stays transparent at origin rather than flashing somewhere wrong
 * (the Tooltip precedent). Unlike Dialog there is no `Modal`: the
 * scrim is an anchor-relative absolute fill layer behind the list.
 *
 * Accessibility: the trigger carries `accessibilityRole="button"`
 * with `accessibilityState { expanded, disabled }`; the list is an
 * accessibility element with `accessibilityRole="listbox"`; each
 * item carries `role="option"` with `accessibilityState { selected,
 * disabled }`. Role provenance, verified against the RN 0.87
 * generated types
 * (`types_generated/Libraries/Components/View/ViewAccessibility.d.ts`):
 * the native `AccessibilityRole` union has no `option`/`listbox`
 * keys, so the item uses the web `Role` prop (which DOES include
 * `option`) — the Dialog `role="dialog"` precedent — while the list
 * uses `accessibilityRole="listbox"`, which typechecks through that
 * union's `| string` tail. `listbox` is absent from the web `Role`
 * union too, so `role="listbox"` would NOT typecheck. Both props are
 * read by the RN test renderer's role queries.
 *
 * Deferred, each for a named reason (not oversight):
 * - No filtering/search text entry — that is Combobox, not Select.
 * - No multi-select — single value only.
 * - No animation: the list mounts/unmounts synchronously with open
 *   state (the Accordion panel precedent).
 * - No keyboard traversal: the `roving`/`collection` models are not
 *   adopted by Select's section.
 *
 * Test ids: the trigger carries `testID`; the scrim carries
 * `<testID>-scrim` when `testID` is given (the Accordion `-panel`
 * precedent).
 *
 * Compound form (Base UI parity) lives below in this module:
 * `SelectRoot` (value + open state, anchor registration, item-label
 * registry) with `SelectTrigger`, `SelectValue` (label lookup),
 * `SelectPortal`, `SelectBackdrop`, `SelectPositioner`,
 * `SelectPopup`, `SelectArrow`, `SelectItem` (shared, extended),
 * `SelectItemText`, `SelectItemIndicator`, `SelectGroup`,
 * `SelectGroupLabel`, `SelectSeparator`. Omitted Base UI pieces are
 * recorded there, not here.
 */

export type SelectState = {
  /** Currently selected item value (`null` for none). */
  value: string | null;
  /** Whether the list is currently open. */
  open: boolean;
  /** Whether the whole select is disabled. */
  disabled: boolean;
};

export type SelectItemState = {
  /** Whether this item is currently selected. */
  selected: boolean;
  /** Whether this item is currently disabled. */
  disabled: boolean;
  /**
   * Whether the item is pressed. Touch has no hover highlight —
   * the press is the highlight (the `MenuItem` touch adaptation).
   */
  highlighted: boolean;
};

export type SelectProps = {
  /** Controlled selection (an item value, or `null` for none). Wins over `defaultValue` when defined. */
  value?: string | null;
  /** Uncontrolled initial selection. Default `null` (nothing selected, placeholder shown). */
  defaultValue?: string | null;
  /** Fires with the chosen item value on every committed selection. */
  onValueChange?: (value: string) => void;
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /** Shown in the trigger when nothing is selected. */
  placeholder?: ReactNode;
  /** Terminal: the trigger never opens, items never select, no callbacks. Default `false`. */
  disabled?: boolean;
  /** Accessible name source for the trigger. */
  accessibilityLabel?: string;
  testID?: string;
  /** Trigger box style: value or function of select state. */
  style?: StateStyle<SelectState, StyleProp<ViewStyle>>;
  /** Popup (listbox) box style, caller-provided. */
  listStyle?: StyleProp<ViewStyle>;
  /** The list's items (`SelectItem`, required). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the anchor container (trigger
   * plus list); open/close and selection wiring travel in the props.
   */
  render?: RenderProp<SelectState, SlotProps>;
  /** Forwarded to the root anchor view. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SelectItemProps = {
  /** Selection value contributed to the group when this item is activated. */
  value: string;
  /**
   * Display label for this item (Base UI `Item` `label` parity):
   * the trigger value lookup and future typeahead read this, not
   * the rendered children. Defaults to string children (direct or
   * inside one `SelectItemText`), else the raw `value`.
   */
  label?: string;
  /** Terminal for this item only: it never selects and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of item state, caller-provided. */
  style?: StateStyle<SelectItemState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<SelectItemState, SlotProps>;
};

type SelectSelection = {
  selectedValue: string | null | undefined;
  groupDisabled: boolean;
  choose: (value: string) => void;
};

/**
 * Shared selection state for the list's items. Internal to this module
 * (not exported): items must render inside a `Select` to participate
 * in selection; outside one they render unselected and inert (the
 * RadioGroup context precedent).
 */
const SelectSelectionContext = createContext<SelectSelection | null>(null);

/**
 * Shared root state for the compound parts. Internal (not exported):
 * `SelectRoot` owns value + open state, the anchor registration, and
 * the item-label registry; `SelectItem` reads whichever selection
 * context is present (compound root first, monolith second) so one
 * item implementation serves both APIs.
 */
const SelectRootContext = createContext<SelectRootDisclosure | null>(null);

/**
 * The matchable text an item publishes to the label registry: the
 * explicit `label` first, then direct string children, then the
 * string content of a top-level `SelectItemText` (fragments and
 * custom wrappers are skipped, the monolith `findItemLabel`
 * precedent), else the raw value.
 */
function selectItemText(
  label: string | undefined,
  children: ReactNode,
  value: string,
): string {
  if (label !== undefined) return label;
  if (typeof children === "string") return children;
  let text: string | undefined;
  Children.forEach(children, (child) => {
    if (text !== undefined) return;
    if (
      isValidElement<{ children?: unknown }>(child) &&
      child.type === SelectItemText &&
      typeof child.props.children === "string"
    ) {
      text = child.props.children;
    }
  });
  return text ?? value;
}

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: SelectProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

/**
 * Read the selected item's label back out of the declared children so
 * the trigger can show it. Top-level `SelectItem` elements only;
 * anything else (fragments, arrays, custom wrappers) is skipped, and
 * an unmatched value yields `undefined` (the placeholder shows).
 */
function findItemLabel(
  children: ReactNode,
  value: string | null | undefined,
): ReactNode {
  if (value === null || value === undefined) return undefined;
  let label: ReactNode;
  Children.forEach(children, (child) => {
    if (label !== undefined) return;
    if (
      isValidElement<SelectItemProps>(child) &&
      child.type === SelectItem &&
      child.props.value === value
    ) {
      label = child.props.children;
    }
  });
  return label;
}

/** Anchor-relative scrim fill: structural layout, not a visual value. */
const scrimFillStyle: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function Select({
  value,
  defaultValue = null,
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  listStyle,
  children,
  render,
  ref,
}: SelectProps): React.ReactNode {
  // `onValueChange` takes a plain `string` while the state domain includes
  // `null` (nothing selected), so forward only committed selections —
  // `choose` below never offers `null`, the guard is type-level honesty
  // (the RadioGroup precedent).
  const handleValueChange = useCallback(
    (next: string | null) => {
      if (next !== null) {
        onValueChange?.(next);
      }
    },
    [onValueChange],
  );
  const [selectedValue, setSelectedValue] = useControllableState<string | null>(
    value,
    defaultValue,
    handleValueChange,
  );

  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const choose = useCallback(
    (next: string) => {
      if (disabled) return;
      // Re-selecting the selected value keeps it: the hook's identity
      // guard suppresses the repeat callback, but the close below
      // still commits (the selection-model rule).
      setSelectedValue(next);
      setOpen(false);
    },
    [disabled, setOpen, setSelectedValue],
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((previous) => !(previous ?? false));
  }, [disabled, setOpen]);

  // Scrim dismissal closes without selecting. Guarded on `disabled`
  // (terminal: no state transitions from a disabled control).
  const dismiss = useCallback(() => {
    if (disabled) return;
    setOpen(false);
  }, [disabled, setOpen]);

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      anchorHostRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const floating = useFloatingPlacement({
    anchorRef: anchorHostRef,
    active: isOpen ?? false,
  });

  const selectedLabel = useMemo(
    () => findItemLabel(children, selectedValue),
    [children, selectedValue],
  );

  const selection = useMemo<SelectSelection>(
    () => ({ selectedValue, groupDisabled: disabled, choose }),
    [selectedValue, disabled, choose],
  );

  const state: SelectState = {
    value: selectedValue ?? null,
    open: isOpen ?? false,
    disabled,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      disabled,
      onPress: toggle,
      open: isOpen ?? false,
      value: selectedValue ?? null,
      selectedLabel,
      placeholder,
      onDismiss: dismiss,
      listStyle,
      children,
      ref: setAnchorRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setAnchorRef}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen ?? false, disabled }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled={disabled}
        onPress={toggle}
        style={resolveStyle(style, state)}
      >
        {selectedLabel ?? placeholder}
      </Pressable>
      {isOpen ? (
        <Pressable
          accessibilityLabel="Dismiss"
          testID={testID ? `${testID}-scrim` : undefined}
          onPress={dismiss}
          style={scrimFillStyle}
        />
      ) : null}
      {isOpen ? (
        <View
          // The list must be an accessibility element for its role to
          // reach assistive technology (and the `*ByRole` proofs): a
          // plain `View` is not one by default, unlike `Pressable`.
          accessible
          accessibilityRole="listbox"
          onLayout={floating.onContentLayout}
          style={[floating.style, listStyle]}
        >
          <SelectSelectionContext.Provider value={selection}>
            {children}
          </SelectSelectionContext.Provider>
        </View>
      ) : null}
    </View>
  );
}

export function SelectItem({
  value,
  label,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: SelectItemProps): React.ReactNode {
  const group = useContext(SelectSelectionContext);
  const root = useContext(SelectRootContext);
  const selection = group ?? root;
  const effectiveDisabled = disabled || (selection?.groupDisabled ?? false);
  const selected = selection?.selectedValue === value;
  const [highlighted, setHighlighted] = useState(false);
  const state: SelectItemState = {
    selected,
    disabled: effectiveDisabled,
    highlighted,
  };

  // Publish the label to the compound root's registry so
  // `SelectValue` resolves labels without reading children itself.
  // Monolith items (no root above) skip registration: the monolith
  // reads labels from its own children directly. Deps are the stable
  // registry callbacks — never the disclosure object, whose identity
  // changes with unrelated state and would re-run this effect
  // (unregister + re-register allocate) on every such change.
  const itemText = selectItemText(label, children, value);
  const registerItem = root?.register;
  const unregisterItem = root?.unregister;
  useEffect(() => {
    if (!registerItem || !unregisterItem) return;
    registerItem({ key: value, text: itemText });
    return () => unregisterItem(value);
  }, [registerItem, unregisterItem, value, itemText]);

  const chooseItem = useCallback(() => {
    if (effectiveDisabled) return;
    selection?.choose(value);
  }, [effectiveDisabled, selection, value]);

  const pressableProps = {
    role: "option",
    accessibilityState: { selected, disabled: effectiveDisabled },
    accessibilityLabel,
    testID,
    disabled: effectiveDisabled,
    onPress: chooseItem,
    onPressIn: () => setHighlighted(true),
    onPressOut: () => setHighlighted(false),
    style: resolveStyle(style, state),
    children,
  } satisfies SlotProps;

  // Outside any select there is no selection to join: render inert
  // (announced disabled, press is a no-op) rather than dropping the
  // node silently.
  if (!selection) {
    const inertState: SelectItemState = {
      selected: false,
      disabled: true,
      highlighted: false,
    };
    const substituted = resolveRender(
      render,
      {
        ...pressableProps,
        disabled: true,
        accessibilityState: { selected: false, disabled: true },
      },
      inertState,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        role="option"
        accessibilityState={{ selected: false, disabled: true }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled
        style={resolveStyle(style, inertState)}
      >
        {children}
      </Pressable>
    );
  }

  const substituted = resolveRender(render, pressableProps, state);
  const node = substituted ?? (
    <Pressable
      role="option"
      accessibilityState={{ selected, disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={chooseItem}
      onPressIn={() => setHighlighted(true)}
      onPressOut={() => setHighlighted(false)}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );

  // The indicator reads its item's selected state from here (the
  // `Menu` indicator precedent) — including inside `render`
  // substitutions, whose children still render under this provider.
  return (
    <SelectIndicatorContext.Provider value={{ selected }}>
      {node}
    </SelectIndicatorContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Compound parts (Base UI parity)                                      */
/*                                                                      */
/* `<Select>` above is the concise inline API (trigger + in-box scrim  */
/* + positioned list, labels read from its own children). The parts    */
/* below mirror Base UI's Select anatomy — Root (state owner, renders  */
/* no element), Trigger, Value (label lookup over the item registry),  */
/* Portal (an RN `Modal`: the native portal host), Backdrop (the        */
/* scrim), Positioner (measured placement against the trigger          */
/* anchor), Popup (the listbox), Arrow (caller-positioned marker),      */
/* Item (shared with the monolith, extended with `label`, `render`,    */
/* and function styles), ItemText, ItemIndicator, Group, GroupLabel,   */
/* Separator — with `render` element/function composition and          */
/* value-or-function `style` on every part. Omitted Base UI pieces     */
/* are documented deviations, not oversights: no `Label` (the          */
/* trigger's `accessibilityLabel`, or the Axis `Label` component,       */
/* names the control), no `Icon` (caller content inside `Trigger`),    */
/* no `List` (the popup IS the list container, the `Menu` compound     */
/* precedent), no `ScrollUpArrow`/`ScrollDownArrow` (hover-scroll       */
/* chrome Base UI itself hides on touch input), no                     */
/* `alignItemWithTrigger` overlap positioning (Base UI disables it      */
/* for touch input; standard side/align placement only), no            */
/* `multiple` (single value only), no form integration                 */
/* (`name`/`required`/`readOnly` — native forms are caller-owned),      */
/* no `actionsRef`/imperative handle (D7), no highlight-on-hover       */
/* (D8 — the press is the highlight), no animation states (D9), no     */
/* hardware-keyboard typeahead (the registry exists for a section      */
/* that adopts it; none has), and no `data-*` attributes (D1).        */
/* Non-modal roots (`modal={false}`) render the portal in-box with     */
/* no Backdrop; outside-press without a scrim is the documented        */
/* `Menu` limitation.                                                  */
/* ------------------------------------------------------------------ */

export type SelectRootState = {
  /** Whether the list is currently open. */
  open: boolean;
  /** The selected value (`null` nothing selected). */
  value: string | null;
};

export type SelectRootProps = {
  /** Controlled selection (an item value, or `null` for none). Wins over `defaultValue` when defined. */
  value?: string | null;
  /** Uncontrolled initial selection. Default `null` (nothing selected, placeholder shown). */
  defaultValue?: string | null;
  /** Fires with the chosen item value on every committed selection. */
  onValueChange?: (value: string) => void;
  /**
   * Value-label lookup table (Base UI `items` parity): the trigger
   * value display reads the selected item's registered label while
   * the list is open, but items unmount with a closed list — pass
   * `items` so the label (not the raw value) shows while closed.
   * Live registrations win over this table while mounted.
   */
  items?: ReadonlyArray<{ value: string; label: string }>;
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /** Fires on scrim dismissal, before `onOpenChange(false)`. */
  onDismiss?: () => void;
  /**
   * Whether the open list presents modally (a `Modal` host with a
   * scrim). Default `true`. When `false` the portal renders in-box
   * with no scrim and the trigger stays pressable (the `Menu`
   * compound precedent).
   */
  modal?: boolean;
  /**
   * When `true`, backdrop press does not dismiss. Default `false`.
   */
  disablePointerDismissal?: boolean;
  /** Terminal: the trigger never opens, items never select, no callbacks — and the list reads closed even under a controlled `open`. Default `false`. */
  disabled?: boolean;
  /** Trigger, Portal, and shared content. Renders no element itself. */
  children?: ReactNode;
  /** Forwarded nowhere (the root renders no element); accepted so ref-spreading callers typecheck. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SelectTriggerState = {
  /** Whether the list is currently open. */
  open: boolean;
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
};

export type SelectTriggerProps = {
  testID?: string;
  /** Value or function of trigger state, caller-provided. */
  style?: StateStyle<SelectTriggerState, StyleProp<ViewStyle>>;
  /** Trigger content (`SelectValue` + caller icon composed by the caller). */
  children?: ReactNode;
  /** Terminal: it never opens and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<SelectTriggerState, SlotProps>;
};

export type SelectValueState = {
  /** The selected value (`null` nothing selected). */
  value: string | null;
  /** Whether the placeholder is showing. */
  placeholder: boolean;
};

export type SelectValueProps = {
  /** Shown when nothing is selected. */
  placeholder?: ReactNode;
  /**
   * Value content: a node, or a function of the selected value
   * (Base UI parity — formatting without a lookup table).
   * Defaults to the selected item's registered label, else the raw
   * value, else the placeholder.
   */
  children?: ReactNode | ((value: string | null) => ReactNode);
  testID?: string;
  /** Value or function of value state, caller-provided. */
  style?: StateStyle<SelectValueState, StyleProp<TextStyle>>;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<SelectValueState, SlotProps>;
};

export type SelectPortalProps = {
  /** Portal content (Backdrop + Positioner composed by the caller). */
  children?: ReactNode;
  testID?: string;
};

export type SelectBackdropState = {
  /** Whether the list is currently open. */
  open: boolean;
};

export type SelectBackdropProps = {
  testID?: string;
  /** Value or function of backdrop state, caller-provided. */
  style?: StateStyle<SelectBackdropState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * scrim host; dismissal wiring stays on the part.
   */
  render?: RenderProp<SelectBackdropState, SlotProps>;
};

export type SelectPositionerState = {
  /** Whether the list is currently open. */
  open: boolean;
};

export type SelectPositionerProps = {
  /** Preferred side for the list. Default `"bottom"`. */
  side?: Placement;
  /** Cross-axis alignment. Default `"center"`. */
  align?: Align;
  /** Gap between anchor and list edges. Default `0`. */
  sideOffset?: number;
  /** Shift along the cross axis after alignment. Default `0`. */
  alignOffset?: number;
  testID?: string;
  /** Value or function of positioner state, caller-provided. */
  style?: StateStyle<SelectPositionerState, StyleProp<ViewStyle>>;
  /** Popup (and optional Arrow content) composed by the caller. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * positioned wrapper; measurement stays on the part.
   */
  render?: RenderProp<SelectPositionerState, SlotProps>;
};

export type SelectPopupState = {
  /** Whether the list is currently open. */
  open: boolean;
};

export type SelectPopupProps = {
  testID?: string;
  /** Value or function of popup state, caller-provided. */
  style?: StateStyle<SelectPopupState, StyleProp<ViewStyle>>;
  /** Item content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity). Replaces the
   * content host; the listbox role stays on the part.
   */
  render?: RenderProp<SelectPopupState, SlotProps>;
  /** Forwarded to the content `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SelectArrowProps = {
  testID?: string;
  /** Arrow marker style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Arrow marker content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectGroupProps = {
  testID?: string;
  /** Group container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Group content (`SelectGroupLabel` + `SelectItem` elements). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectGroupLabelProps = {
  testID?: string;
  /** Group label style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Group label content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectSeparatorProps = {
  testID?: string;
  /** Separator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectItemTextProps = {
  testID?: string;
  /** Item text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Item label content (registers as the item's text when the item has no `label`). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type SelectItemIndicatorProps = {
  testID?: string;
  /** Indicator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Indicator content. Rendered only while the enclosing item is selected. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

type SelectRootDisclosure = SelectSelection & {
  open: boolean;
  toggle: () => void;
  close: () => void;
  /** Scrim dismissal (`onDismiss` first unless pointer dismissal is disabled). */
  dismiss: () => void;
  disablePointerDismissal: boolean;
  modal: boolean;
  anchorHostRef: { current: ElementRef<typeof View> | null };
  setAnchorRef: (node: ElementRef<typeof View> | null) => void;
  items: readonly CollectionItem[];
  register: (item: CollectionItem) => void;
  unregister: (key: string) => void;
  /** Static value-label table for closed-list display (Base `items`). */
  labelItems: ReadonlyArray<{ value: string; label: string }>;
};

type SelectIndicatorDisclosure = {
  /** Whether the enclosing item is selected. */
  selected: boolean;
};

/**
 * Selected state for indicator parts. Internal (not exported): an
 * indicator renders its children only while its item is selected,
 * mirroring Base UI's indicator behavior without a second state
 * owner (the `Menu` indicator precedent).
 */
const SelectIndicatorContext = createContext<SelectIndicatorDisclosure | null>(
  null,
);

export function SelectRoot({
  value,
  defaultValue = null,
  onValueChange,
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  onDismiss,
  modal = true,
  disablePointerDismissal = false,
  disabled = false,
  children,
  ref,
}: SelectRootProps): React.JSX.Element {
  // Accepted for ref-spreading callers; the root renders no element
  // to attach it to (the `MenuRoot` precedent).
  void ref;
  // `onValueChange` takes a plain `string` while the state domain
  // includes `null` (nothing selected), so forward only committed
  // selections (the monolith precedent).
  const handleValueChange = useCallback(
    (next: string | null) => {
      if (next !== null) {
        onValueChange?.(next);
      }
    },
    [onValueChange],
  );
  const [selectedValue, setSelectedValue] = useControllableState<string | null>(
    value,
    defaultValue,
    handleValueChange,
  );

  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const registry = useCollectionRegistry();
  const { items: registryItems, register, unregister } = registry;

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((previous) => !(previous ?? false));
  }, [disabled, setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const dismiss = useCallback(() => {
    if (disablePointerDismissal) return;
    onDismiss?.();
    setOpen(false);
  }, [disablePointerDismissal, onDismiss, setOpen]);

  const choose = useCallback(
    (next: string) => {
      if (disabled) return;
      // Re-selecting the selected value keeps it: the hook's identity
      // guard suppresses the repeat callback, but the close still
      // commits (the selection-model rule).
      setSelectedValue(next);
      setOpen(false);
    },
    [disabled, setSelectedValue, setOpen],
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback((node: ElementRef<typeof View> | null) => {
    anchorHostRef.current = node;
  }, []);

  // Terminal: a disabled root reads closed under any open state — no
  // list, no scrim, no portal (the `disabled` contract rule).
  const effectiveOpen = disabled ? false : (isOpen ?? false);

  const disclosure = useMemo<SelectRootDisclosure>(
    () => ({
      selectedValue,
      groupDisabled: disabled,
      choose,
      open: effectiveOpen,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      anchorHostRef,
      setAnchorRef,
      items: registryItems,
      register,
      unregister,
      labelItems: items ?? [],
    }),
    [
      selectedValue,
      disabled,
      choose,
      effectiveOpen,
      toggle,
      close,
      dismiss,
      disablePointerDismissal,
      modal,
      setAnchorRef,
      registryItems,
      register,
      unregister,
      items,
    ],
  );

  // The root owns state, never layout: no host element (Base UI parity).
  return (
    <SelectRootContext.Provider value={disclosure}>
      {children}
    </SelectRootContext.Provider>
  );
}

export function SelectTrigger({
  testID,
  style,
  children,
  disabled = false,
  accessibilityLabel,
  render,
}: SelectTriggerProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  const open = root?.open ?? false;
  const effectiveDisabled = disabled || (root?.groupDisabled ?? false);
  const state: SelectTriggerState = { open, disabled: effectiveDisabled };

  const toggleTrigger = useCallback(() => {
    if (effectiveDisabled) return;
    root?.toggle();
  }, [effectiveDisabled, root]);

  // Register the host for `SelectPositioner` measurement; outside a
  // root there is nothing to anchor to and registration is a no-op.
  const setTriggerRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      root?.setAnchorRef(node);
    },
    [root],
  );

  // Outside a root there is no disclosure to toggle: render inert
  // rather than dropping the node silently.
  const inert = root === null;
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: {
        expanded: open,
        disabled: effectiveDisabled || inert,
      },
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled || inert,
      onPress: toggleTrigger,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setTriggerRef}
      accessibilityRole="button"
      accessibilityState={{
        expanded: open,
        disabled: effectiveDisabled || inert,
      }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled || inert}
      onPress={toggleTrigger}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function SelectValue({
  placeholder,
  children,
  testID,
  style,
  render,
}: SelectValueProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  const value = root?.selectedValue ?? null;
  // The registered label first (items publish on mount while the
  // list is open), then the root `items` table (closed-list display
  // — registrations unmount with the list), then the raw value (an
  // item that never registered still shows something honest), then
  // the placeholder.
  const registered =
    value === null || value === undefined
      ? undefined
      : findCollectionText(root?.items ?? [], value);
  const tabled =
    value === null || value === undefined
      ? undefined
      : root?.labelItems.find((entry) => entry.value === value)?.label;
  const label = registered ?? tabled ?? value ?? undefined;
  const showingPlaceholder = label === undefined;
  const state: SelectValueState = { value, placeholder: showingPlaceholder };
  const content =
    typeof children === "function"
      ? children(value)
      : (children ?? label ?? placeholder);

  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      children: content,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Text testID={testID} style={resolveStyle(style, state)}>
      {content}
    </Text>
  );
}

export function SelectPortal({
  children,
  testID,
}: SelectPortalProps): React.JSX.Element | null {
  const root = useContext(SelectRootContext);
  // Outside a root there is no open state to present: render nothing.
  if (!root) return null;
  if (!root.open) return null;

  // The RN portal host: a transparent `Modal` presents above the app
  // (the native equivalent of appending to `body`). When the shared
  // overlay root lands, this host can move onto it; positioning
  // (`SelectPositioner` + the `positioning` model) stays separable
  // from the host either way, so the move touches only this part.
  // Non-modal roots render in-box with no scrim instead (the `Menu`
  // compound precedent).
  if (!root.modal) {
    return <View testID={testID}>{children}</View>;
  }
  return (
    <Modal
      transparent
      visible={root.open}
      onRequestClose={root.dismiss}
      testID={testID}
    >
      {children}
    </Modal>
  );
}

export function SelectBackdrop({
  testID,
  style,
  render,
}: SelectBackdropProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  if (!root) return null;
  if (!root.open) return null;
  const state: SelectBackdropState = { open: root.open };

  if (!root.disablePointerDismissal) {
    const substituted = resolveRender(
      render,
      {
        accessibilityLabel: "Dismiss select",
        testID,
        onPress: root.dismiss,
        style: resolveStyle(style, state),
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
    return (
      <Pressable
        accessibilityLabel="Dismiss select"
        testID={testID}
        onPress={root.dismiss}
        style={[scrimFillStyle, resolveStyle(style, state)]}
      />
    );
  }

  // Non-dismissable: a plain host with no label and no handler — no
  // fake affordance (the `MenuBackdrop` precedent).
  const substituted = resolveRender(
    render,
    { testID, style: resolveStyle(style, state) } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <View
      testID={testID}
      style={[scrimFillStyle, resolveStyle(style, state)]}
    />
  );
}

export function SelectPositioner({
  side,
  align,
  sideOffset,
  alignOffset,
  testID,
  style,
  children,
  render,
}: SelectPositionerProps): React.ReactNode {
  const root = useContext(SelectRootContext);
  // Hooks before guards: measurement runs (harmlessly) even while
  // closed so activation never reorders hook calls.
  const floating = useFloatingPlacement({
    anchorRef: root?.anchorHostRef ?? { current: null },
    placement: side,
    offset: sideOffset,
    align,
    alignOffset,
    active: root?.open ?? false,
  });
  if (!root) return null;
  if (!root.open) return null;
  const state: SelectPositionerState = { open: root.open };

  const substituted = resolveRender(
    render,
    {
      testID,
      onLayout: floating.onContentLayout,
      style: [floating.style, resolveStyle(style, state)],
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      testID={testID}
      onLayout={floating.onContentLayout}
      style={[floating.style, resolveStyle(style, state)]}
    >
      {children}
    </View>
  );
}

/**
 * Assign one value to every ref in the list, for the popup host.
 * Inline here (not imported) deliberately — the contract rule, see
 * every other part in this package.
 */
function assignPopupRef(
  ref: SelectPopupProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

export function SelectPopup({
  testID,
  style,
  children,
  render,
  ref,
}: SelectPopupProps): React.ReactNode {
  const root = useContext(SelectRootContext);

  const setPopupRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignPopupRef(ref, node);
    },
    [ref],
  );

  if (!root) return null;
  if (!root.open) return null;
  const state: SelectPopupState = { open: root.open };

  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "listbox",
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setPopupRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setPopupRef}
      accessible
      accessibilityRole="listbox"
      testID={testID}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

export function SelectArrow({
  testID,
  style,
  children,
  render,
}: SelectArrowProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View accessible={false} testID={testID} style={style}>
      {children}
    </View>
  );
}

export function SelectGroup({
  testID,
  style,
  children,
  render,
}: SelectGroupProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "group",
      testID,
      style,
      children,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View accessibilityRole="group" testID={testID} style={style}>
      {children}
    </View>
  );
}

export function SelectGroupLabel({
  testID,
  style,
  children,
  render,
}: SelectGroupLabelProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function SelectSeparator({
  testID,
  style,
  render,
}: SelectSeparatorProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return <View accessible={false} testID={testID} style={style} />;
}

export function SelectItemText({
  testID,
  style,
  children,
  render,
}: SelectItemTextProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function SelectItemIndicator({
  testID,
  style,
  children,
  render,
}: SelectItemIndicatorProps): React.ReactNode {
  const indicator = useContext(SelectIndicatorContext);
  // Rendered only while the enclosing item is selected (Base UI
  // indicator behavior). Outside an item there is no selection to
  // read: render nothing.
  if (!indicator?.selected) return null;
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}
