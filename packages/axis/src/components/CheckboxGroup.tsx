import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useMemo,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * CheckboxGroup — an unstyled multi-selection group for checkboxes.
 *
 * Structure only: a `View` host element carrying the `group` role,
 * coordinating `CheckboxRoot` children through context. No default
 * borders, gap, or padding are imposed — every visual value is
 * caller-provided. State follows the `useControllableState` pattern:
 * `value` (+ `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled. Activating an item toggles its membership in the array.
 * A group-wide `disabled` cascades to every joined item.
 *
 * ADR-112 aria-only: the group carries `role="group"` and caller
 * `aria-label` / `aria-labelledby`. Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 *
 * Base UI parity: exported as `CheckboxGroupRoot` and `CheckboxGroup`.
 */

export type CheckboxGroupState = {
  /** Currently selected item values. */
  value: readonly string[];
  /** Whether the whole group is disabled. */
  disabled: boolean;
};

export type CheckboxGroupProps = {
  /** Controlled selection (item values). Wins over `defaultValue` when defined. */
  value?: readonly string[];
  /** Uncontrolled initial selection. Default `[]` (nothing selected). */
  defaultValue?: readonly string[];
  /** Fires with the selected item values on every committed toggle. */
  onValueChange?: (value: readonly string[]) => void;
  /** Terminal: disables every item — no toggles, no callbacks. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  testID?: string;
  /** Root group view style: value or function of group state. */
  style?: StateStyle<CheckboxGroupState, StyleProp<ViewStyle>>;
  /** The group's items (`CheckboxRoot` with `value`). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<CheckboxGroupState, SlotProps>;
  /** Forwarded to the root group host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type CheckboxGroupSelection = {
  selectedValues: readonly string[];
  groupDisabled: boolean;
  toggle: (itemValue: string) => void;
};

export const CheckboxGroupSelectionContext =
  createContext<CheckboxGroupSelection | null>(null);

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
      // A frozen ref object cannot take the write
    }
  }
}

export function CheckboxGroupRoot({
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: CheckboxGroupProps): React.ReactNode {
  const [selectedValues, setSelectedValues] = useControllableState<
    readonly string[]
  >(value, defaultValue, onValueChange);

  const toggle = useCallback(
    (itemValue: string) => {
      setSelectedValues((previous = []) => {
        const has = previous.includes(itemValue);
        return has
          ? previous.filter((v) => v !== itemValue)
          : [...previous, itemValue];
      });
    },
    [setSelectedValues],
  );

  const selection = useMemo<CheckboxGroupSelection>(
    () => ({
      selectedValues: selectedValues ?? [],
      groupDisabled: disabled,
      toggle,
    }),
    [selectedValues, disabled, toggle],
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: CheckboxGroupState = {
    value: selectedValues ?? [],
    disabled,
  };

  const hostProps = {
    accessible: true,
    role: "group" as const,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined
      ? { "aria-labelledby": ariaLabelledBy }
      : {}),
    testID,
    style: resolveStyle(style, state),
    children,
    ref: setHostRef,
  } satisfies SlotProps;

  const substituted = resolveRender(render, hostProps, state);
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessible
      role="group"
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <CheckboxGroupSelectionContext.Provider value={selection}>
        {children}
      </CheckboxGroupSelectionContext.Provider>
    </View>
  );
}

export { CheckboxGroupRoot as CheckboxGroup };
