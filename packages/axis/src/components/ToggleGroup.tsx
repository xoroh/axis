import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * ToggleGroup — an unstyled multi-press group.
 *
 * Structure only: a `View` carrying the group role, with
 * `ToggleGroupItem` pressables carrying the button role and pressed
 * state. No default visuals — every visual value (`style`) is
 * caller-provided. State follows the `useControllableState` pattern:
 * `value` (+ `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled. Selection is multi-press with toggle semantics:
 * activating a pressed item removes it, per the selection-model rule.
 *
 * Pressed semantics (not checked semantics): items announce
 * `accessibilityState.selected`, never `checked` — this is a group
 * of toggle buttons, not a group of checkboxes.
 */

export type ToggleGroupState = {
  /** Currently pressed item keys. */
  value: readonly string[];
  /** Whether the whole group is disabled. */
  disabled: boolean;
};

export type ToggleGroupItemState = {
  /** Whether this item is currently pressed. */
  pressed: boolean;
  /** Whether this item is currently disabled. */
  disabled: boolean;
};

export type ToggleGroupProps = {
  /** Controlled pressed keys. Wins over `defaultValue` when defined. */
  value?: readonly string[];
  /** Uncontrolled initial pressed keys. Default `[]` (nothing pressed). */
  defaultValue?: readonly string[];
  /** Fires with the pressed keys on every committed toggle. */
  onValueChange?: (value: readonly string[]) => void;
  /** Terminal: disables every item — no toggles, no callbacks. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root group view style: value or function of group state. */
  style?: StateStyle<ToggleGroupState, StyleProp<ViewStyle>>;
  /** The group's items (`ToggleGroupItem`). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToggleGroupState, SlotProps>;
  /** Forwarded to the root group host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type ToggleGroupItemProps = {
  /** Pressed key contributed to (or removed from) the group when this item is activated. */
  value: string;
  /** Terminal for this item only: it never toggles and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Item pressable style: value or function of item state. */
  style?: StateStyle<ToggleGroupItemState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToggleGroupItemState, SlotProps>;
};

type ToggleGroupPressed = {
  pressedValues: readonly string[] | undefined;
  groupDisabled: boolean;
  toggle: (value: string) => void;
};

/**
 * Shared pressed state for the group's items. Internal to this module
 * (not exported): items must render inside a `ToggleGroup` to
 * participate in selection; outside one they render unpressed and inert.
 */
const ToggleGroupPressedContext = createContext<ToggleGroupPressed | null>(
  null,
);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: ToggleGroupProps["ref"],
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

function ToggleGroupRoot({
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: ToggleGroupProps): React.ReactNode {
  const [pressedValues, setPressedValues] = useControllableState<
    readonly string[]
  >(value, defaultValue, onValueChange);

  const toggle = useCallback(
    (next: string) => {
      if (disabled) return;
      setPressedValues((previous) => {
        const current = previous ?? [];
        return current.includes(next)
          ? current.filter((item) => item !== next)
          : [...current, next];
      });
    },
    [disabled, setPressedValues],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const pressed = useMemo<ToggleGroupPressed>(
    () => ({ pressedValues, groupDisabled: disabled, toggle }),
    [pressedValues, disabled, toggle],
  );

  const state: ToggleGroupState = {
    value: pressedValues ?? [],
    disabled,
  };
  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "group",
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      // The group must be an accessibility element for its role and
      // label to reach assistive technology (and the `*ByRole` proofs):
      // a plain `View` is not one by default, unlike `Pressable`.
      accessible
      accessibilityRole="group"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <ToggleGroupPressedContext.Provider value={pressed}>
        {children}
      </ToggleGroupPressedContext.Provider>
    </View>
  );
}

export function ToggleGroupItem({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: ToggleGroupItemProps): React.ReactNode {
  const group = useContext(ToggleGroupPressedContext);
  const effectiveDisabled = disabled || (group?.groupDisabled ?? false);
  const pressed = group?.pressedValues?.includes(value) ?? false;

  const toggleItem = useCallback(() => {
    if (effectiveDisabled) return;
    group?.toggle(value);
  }, [effectiveDisabled, group, value]);

  const state: ToggleGroupItemState = {
    pressed,
    disabled: effectiveDisabled,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { selected: pressed, disabled: effectiveDisabled },
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled,
      onPress: toggleItem,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: pressed, disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={toggleItem}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export { ToggleGroupRoot as ToggleGroup };
