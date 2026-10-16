import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Chip — an unstyled selectable token with an optional remove affordance.
 *
 * Structure only: an outer `View` holding a main `Pressable` (the
 * button role with the selected state, rendering caller-provided label
 * content) plus, when `onRemove` is provided, a sibling remove
 * `Pressable` labelled `"Remove"`. No default visuals — every visual
 * value (`style`, `removeStyle`) is caller-provided. State follows the
 * `useControllableState` pattern: `selected` (+ `onSelectedChange`)
 * for controlled use, `defaultSelected` for uncontrolled.
 *
 * Selection toggles only through the main pressable; the remove
 * affordance fires `onRemove` and never toggles. `onPress` is a tap
 * action independent of selection: it fires on every committed main
 * press, after the internal toggle (contract §7 composition order).
 * `disabled` is terminal across both pressables: no transitions, no
 * callbacks, announced as disabled.
 */

export type ChipProps = {
  /** Controlled selection. Wins over `defaultSelected` when defined. */
  selected?: boolean;
  /** Uncontrolled initial selection. Default `false`. */
  defaultSelected?: boolean;
  /** Fires with the next state on every committed selection toggle. */
  onSelectedChange?: (selected: boolean) => void;
  /** Terminal: no transitions, no callbacks, announced as disabled. */
  disabled?: boolean;
  /**
   * When provided, a sibling remove affordance (labelled `"Remove"`)
   * renders and fires this on press. It never toggles selection.
   */
  onRemove?: () => void;
  /**
   * Tap action on the main pressable, independent of selection. Fires
   * on every committed main press, after the internal selection
   * toggle. Blocked while `disabled`, like the toggle itself.
   */
  onPress?: () => void;
  /** Accessible name source for the main pressable. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root view style. */
  style?: StyleProp<ViewStyle>;
  /** Remove affordance pressable style. */
  removeStyle?: StyleProp<ViewStyle>;
  /** Label content rendered inside the main pressable. */
  children?: ReactNode;
  /** Forwarded to the root view host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: ChipProps["ref"],
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

export function Chip({
  selected,
  defaultSelected = false,
  onSelectedChange,
  disabled = false,
  onRemove,
  onPress,
  accessibilityLabel,
  testID,
  style,
  removeStyle,
  children,
  ref,
}: ChipProps): React.JSX.Element {
  const [isSelected, setSelected] = useControllableState<boolean>(
    selected,
    defaultSelected,
    onSelectedChange,
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setSelected((previous) => !(previous ?? false));
    onPress?.();
  }, [disabled, onPress, setSelected]);

  const remove = useCallback(() => {
    if (disabled) return;
    onRemove?.();
  }, [disabled, onRemove]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <View ref={setHostRef} testID={testID} style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected ?? false, disabled }}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={toggle}
      >
        {children}
      </Pressable>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          accessibilityLabel="Remove"
          disabled={disabled}
          onPress={remove}
          style={removeStyle}
        />
      ) : null}
    </View>
  );
}
