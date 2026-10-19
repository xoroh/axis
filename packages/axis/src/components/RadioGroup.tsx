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
 * RadioGroup — an unstyled single-select group.
 *
 * Structure only: a `View` carrying the radiogroup role, with
 * `RadioGroupItem` pressables carrying the radio role and checked state.
 * No default visuals — every visual value (`style`) is caller-provided.
 * State follows the `useControllableState` pattern: `value` (+
 * `onValueChange`) for controlled use, `defaultValue` for uncontrolled.
 * Selection is single-select and replacing: activating the selected item
 * keeps it (never deselects to `null`), per the selection-model rule.
 */

export type RadioGroupState = {
  /** Currently selected item value (`null` for none). */
  value: string | null;
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /**
   * Whether the whole group is read-only. Default `false`.
   * Focusable and announced like an enabled group, but selections
   * do not change (distinct from `disabled` — React Native maps no
   * readonly key, so the announcement is the normal group state).
   */
  readOnly: boolean;
};

export type RadioGroupItemState = {
  /** Whether this item is currently checked. */
  checked: boolean;
  /** Whether this item is currently disabled. */
  disabled: boolean;
  /** Whether the group is read-only (selections do not change). */
  readOnly: boolean;
};

export type RadioGroupProps = {
  /** Controlled selection (an item value, or `null` for none). Wins over `defaultValue` when defined. */
  value?: string | null;
  /** Uncontrolled initial selection. Default `null` (nothing selected). */
  defaultValue?: string | null;
  /** Fires with the selected item value on every committed selection. */
  onValueChange?: (value: string) => void;
  /** Terminal: disables every item — no selections, no callbacks. */
  disabled?: boolean;
  /**
   * Read-only: focusable and announced like an enabled group, but
   * selections do not change and no callbacks fire. Default `false`.
   * Distinct from `disabled` (which blocks interaction and announces
   * disabled) — React Native maps no readonly key, so the
   * announcement is the normal group state.
   */
  readOnly?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root group view style: value or function of group state. */
  style?: StateStyle<RadioGroupState, StyleProp<ViewStyle>>;
  /** The group's items (`RadioGroupItem`). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<RadioGroupState, SlotProps>;
  /** Forwarded to the root group host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

export type RadioGroupItemProps = {
  /** Selection value contributed to the group when this item is activated. */
  value: string;
  /** Terminal for this item only: it never selects and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /**
   * Read-only for this item only: focusable and announced like an
   * enabled option, but it never selects. OR'ed with the group's
   * `readOnly` (either freezes it). Default `false`. Distinct from
   * `disabled` — React Native maps no readonly key, so the
   * announcement is the normal option state.
   */
  readOnly?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Item pressable style: value or function of item state. */
  style?: StateStyle<RadioGroupItemState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<RadioGroupItemState, SlotProps>;
};

type RadioGroupSelection = {
  selectedValue: string | null | undefined;
  groupDisabled: boolean;
  groupReadOnly: boolean;
  select: (value: string) => void;
};

/**
 * Shared selection state for the group's items. Internal to this module
 * (not exported): items must render inside a `RadioGroup` to participate
 * in selection; outside one they render unchecked and inert.
 */
const RadioGroupSelectionContext = createContext<RadioGroupSelection | null>(
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
  ref: RadioGroupProps["ref"],
  value: ElementRef<typeof Pressable> | null,
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

function RadioGroupRoot({
  value,
  defaultValue = null,
  onValueChange,
  disabled = false,
  readOnly = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: RadioGroupProps): React.ReactNode {
  // `onValueChange` takes a plain `string` while the state domain includes
  // `null` (nothing selected), so forward only committed selections —
  // `select` below never offers `null`, the guard is type-level honesty.
  const handleChange = useCallback(
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
    handleChange,
  );

  const select = useCallback(
    (next: string) => {
      if (disabled || readOnly) return;
      setSelectedValue(next);
    },
    [disabled, readOnly, setSelectedValue],
  );

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const selection = useMemo<RadioGroupSelection>(
    () => ({
      selectedValue,
      groupDisabled: disabled,
      groupReadOnly: readOnly,
      select,
    }),
    [selectedValue, disabled, readOnly, select],
  );

  const state: RadioGroupState = {
    value: selectedValue ?? null,
    disabled,
    readOnly,
  };
  const substituted = resolveRender(
    render,
    {
      accessible: true,
      accessibilityRole: "radiogroup",
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
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <RadioGroupSelectionContext.Provider value={selection}>
        {children}
      </RadioGroupSelectionContext.Provider>
    </View>
  );
}

export function RadioGroupItem({
  value,
  disabled = false,
  readOnly = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
}: RadioGroupItemProps): React.ReactNode {
  const group = useContext(RadioGroupSelectionContext);
  const effectiveDisabled = disabled || (group?.groupDisabled ?? false);
  const effectiveReadOnly = readOnly || (group?.groupReadOnly ?? false);
  const checked = group?.selectedValue === value;

  const selectItem = useCallback(() => {
    if (effectiveDisabled || effectiveReadOnly) return;
    group?.select(value);
  }, [effectiveDisabled, effectiveReadOnly, group, value]);

  const state: RadioGroupItemState = {
    checked,
    disabled: effectiveDisabled,
    readOnly: effectiveReadOnly,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "radio",
      accessibilityState: { checked, disabled: effectiveDisabled },
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled,
      onPress: selectItem,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={selectItem}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export { RadioGroupRoot as RadioGroup };
