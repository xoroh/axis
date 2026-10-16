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
import { useControllableState } from "../useControllableState";

/**
 * CheckboxGroup — an unstyled multi-select group.
 *
 * Structure only: a `View` carrying the group role, with
 * `CheckboxGroupItem` pressables carrying the checkbox role and checked
 * state. No default visuals — every visual value (`style`) is
 * caller-provided. State follows the `useControllableState` pattern:
 * `value` (+ `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled. Selection is multi-select with toggle semantics:
 * activating a selected item removes it, per the selection-model rule
 * (unlike `RadioGroup`, which never deselects on re-activation).
 */

export type CheckboxGroupProps = {
  /** Controlled selection (item values). Wins over `defaultValue` when defined. */
  value?: readonly string[];
  /** Uncontrolled initial selection. Default `[]` (nothing selected). */
  defaultValue?: readonly string[];
  /** Fires with the selected item values on every committed toggle. */
  onValueChange?: (value: readonly string[]) => void;
  /** Terminal: disables every item — no toggles, no callbacks. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root group view style. */
  style?: StyleProp<ViewStyle>;
  /** The group's items (`CheckboxGroupItem`). */
  children: ReactNode;
  /** Forwarded to the root group host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type CheckboxGroupItemProps = {
  /** Selection value contributed to (or removed from) the group when this item is activated. */
  value: string;
  /** Terminal for this item only: it never toggles and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Item pressable style. */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

type CheckboxGroupSelection = {
  selectedValues: readonly string[] | undefined;
  groupDisabled: boolean;
  toggle: (value: string) => void;
};

/**
 * Shared selection state for the group's items. Internal to this module
 * (not exported): items must render inside a `CheckboxGroup` to
 * participate in selection; outside one they render unchecked and inert.
 */
const CheckboxGroupSelectionContext =
  createContext<CheckboxGroupSelection | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: CheckboxGroupProps["ref"],
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

function CheckboxGroupRoot({
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  ref,
}: CheckboxGroupProps): React.JSX.Element {
  const [selectedValues, setSelectedValues] = useControllableState<
    readonly string[]
  >(value, defaultValue, onValueChange);

  const toggle = useCallback(
    (next: string) => {
      if (disabled) return;
      setSelectedValues((previous) => {
        const current = previous ?? [];
        return current.includes(next)
          ? current.filter((item) => item !== next)
          : [...current, next];
      });
    },
    [disabled, setSelectedValues],
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

  const selection = useMemo<CheckboxGroupSelection>(
    () => ({ selectedValues, groupDisabled: disabled, toggle }),
    [selectedValues, disabled, toggle],
  );

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
      style={style}
    >
      <CheckboxGroupSelectionContext.Provider value={selection}>
        {children}
      </CheckboxGroupSelectionContext.Provider>
    </View>
  );
}

export function CheckboxGroupItem({
  value,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
}: CheckboxGroupItemProps): React.JSX.Element {
  const group = useContext(CheckboxGroupSelectionContext);
  const effectiveDisabled = disabled || (group?.groupDisabled ?? false);
  const checked = group?.selectedValues?.includes(value) ?? false;

  const toggleItem = useCallback(() => {
    if (effectiveDisabled) return;
    group?.toggle(value);
  }, [effectiveDisabled, group, value]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={toggleItem}
      style={style}
    >
      {children}
    </Pressable>
  );
}

export { CheckboxGroupRoot as CheckboxGroup };
