import {
  Children,
  createContext,
  type ElementRef,
  isValidElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
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
 */

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
  /** Trigger box style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Popup (listbox) box style, caller-provided. */
  listStyle?: StyleProp<ViewStyle>;
  /** The list's items (`SelectItem`, required). */
  children: ReactNode;
  /** Forwarded to the root anchor view. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SelectItemProps = {
  /** Selection value contributed to the group when this item is activated. */
  value: string;
  /** Terminal for this item only: it never selects and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Item pressable style. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
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
  ref,
}: SelectProps): React.JSX.Element {
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

  return (
    <View ref={setAnchorRef}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen ?? false, disabled }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        disabled={disabled}
        onPress={toggle}
        style={style}
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
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
}: SelectItemProps): React.JSX.Element {
  const group = useContext(SelectSelectionContext);
  const effectiveDisabled = disabled || (group?.groupDisabled ?? false);
  const selected = group?.selectedValue === value;

  const chooseItem = useCallback(() => {
    if (effectiveDisabled) return;
    group?.choose(value);
  }, [effectiveDisabled, group, value]);

  return (
    <Pressable
      role="option"
      accessibilityState={{ selected, disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={chooseItem}
      style={style}
    >
      {children}
    </Pressable>
  );
}
