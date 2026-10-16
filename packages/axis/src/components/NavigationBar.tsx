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
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * NavigationBar — an unstyled destination tab bar.
 *
 * A row (or column, via `orientation`) of `NavigationBarItem`
 * destinations with single-select state: exactly one destination is
 * active, pressing another activates it, re-pressing the active one
 * changes nothing (the `selection` model rule — single-selection
 * controls do not deselect on re-activation, and the shared
 * controllable-state semantic reports changes only). No default
 * visuals — every visual value is caller-provided, including the
 * active appearance (`activeStyle` merges over `style` while
 * selected). Destinations are named: `label` is required, rendered
 * as text and read as the accessible name unless
 * `accessibilityLabel` overrides it. Screens, routes, and icons live
 * with the caller — this bar owns selection state and tab
 * semantics, never navigation itself.
 */

export type NavigationBarProps = {
  /** Controlled active destination value. Wins over `defaultValue`. */
  value?: string;
  /**
   * Uncontrolled initial active value. Default: the first item's
   * value (a tab bar with no active destination asserts nothing).
   */
  defaultValue?: string;
  /** Fires with the next value when the active destination changes. */
  onValueChange?: (value: string) => void;
  /** Bar direction. Default `"horizontal"`. */
  orientation?: "horizontal" | "vertical";
  /** Accessible name source for the tab list. */
  accessibilityLabel?: string;
  testID?: string;
  /** Bar container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** `NavigationBarItem` elements. */
  children?: ReactNode;
  /** Forwarded to the bar container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type NavigationBarItemProps = {
  /** Destination value identifying this item (required). */
  value: string;
  /** Destination label: rendered text and accessible name (required). */
  label: string;
  /** Leading icon slot. Caller-owned. */
  icon?: ReactNode;
  /** Terminal: it never activates and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. Without one the label is read. */
  accessibilityLabel?: string;
  testID?: string;
  /** Item style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Merged over `style` while this item is active. */
  activeStyle?: StyleProp<ViewStyle>;
  /** Label text style, caller-provided. */
  labelStyle?: StyleProp<TextStyle>;
};

type NavigationBarDisclosure = {
  /** Currently active destination value (`null` before any item exists). */
  activeValue: string | null;
  /** Activate `value` (no-op when already active). */
  activate: (value: string) => void;
};

/**
 * Shared selection state. Internal (not exported): items must render
 * inside a `NavigationBar` to participate; outside one an item
 * renders inert (announced disabled, press is a no-op) rather than
 * dropping silently, like `MenuItem` outside `Menu`.
 */
const NavigationBarDisclosureContext =
  createContext<NavigationBarDisclosure | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: NavigationBarProps["ref"],
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

export function NavigationBarItem({
  value,
  label,
  icon,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  activeStyle,
  labelStyle,
}: NavigationBarItemProps): React.JSX.Element {
  const disclosure = useContext(NavigationBarDisclosureContext);
  const selected = disclosure?.activeValue === value;

  const activateItem = useCallback(() => {
    if (disabled) return;
    disclosure?.activate(value);
  }, [disabled, disclosure, value]);

  // Outside a bar there is no selection to join: render inert
  // rather than dropping the node silently.
  const inert = disclosure === null;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected, disabled: disabled || inert }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      disabled={disabled || inert}
      onPress={activateItem}
      style={[style, selected ? activeStyle : null]}
    >
      {icon}
      <Text style={labelStyle}>{label}</Text>
    </Pressable>
  );
}

export function NavigationBar({
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  accessibilityLabel,
  testID,
  style,
  children,
  ref,
}: NavigationBarProps): React.JSX.Element {
  // Uncontrolled default: the first item's value, read once. A
  // caller that names no default gets the first destination active
  // rather than a bar asserting nothing; a controlled `value`
  // always wins.
  const firstItemValue = useMemo(() => {
    const items = Children.toArray(children).filter(
      (child) => isValidElement(child) && child.type === NavigationBarItem,
    );
    const first = items[0];
    if (first && isValidElement(first)) {
      const props = first.props as { value?: unknown };
      return typeof props.value === "string" ? props.value : undefined;
    }
    return undefined;
  }, [children]);

  const [current, setCurrent] = useControllableState<string>(
    value,
    defaultValue ?? firstItemValue,
    onValueChange,
  );

  const activate = useCallback(
    (next: string) => {
      // No deselect on re-activation, and no event without a change
      // (the shared controllable-state semantic reports changes
      // only — `Object.is`).
      if (next !== current) setCurrent(next);
    },
    [current, setCurrent],
  );

  const disclosure = useMemo<NavigationBarDisclosure>(
    () => ({ activeValue: current ?? null, activate }),
    [current, activate],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render.
  const setBarRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <View
      ref={setBarRef}
      accessible
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        { flexDirection: orientation === "vertical" ? "column" : "row" },
        style,
      ]}
    >
      <NavigationBarDisclosureContext.Provider value={disclosure}>
        {children}
      </NavigationBarDisclosureContext.Provider>
    </View>
  );
}
