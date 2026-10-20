import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * RadioGroup — an unstyled single-selection group with mutually exclusive items.
 *
 * Compound anatomy:
 *
 *   <RadioGroup>
 *     <RadioRoot value="a">
 *       <RadioIndicator />
 *     </RadioRoot>
 *   </RadioGroup>
 *
 * Structure only: a `View` host element carrying the `radiogroup` role,
 * coordinating `RadioRoot` pressables carrying the `radio` role,
 * state (`checked`, `disabled`), and an indicator `View` whose
 * presence is state-driven. No default group layout, borders, or
 * colors are imposed — every visual value is caller-provided. State
 * follows the `useControllableState` pattern: `value` (+
 * `onValueChange`) for controlled use, `defaultValue` for uncontrolled.
 *
 * ADR-112 aria-only: parts set accessibility state, role, and value
 * ONLY through `aria-*` props and `role` (`role="radiogroup"`,
 * `role="radio"`, `aria-checked`, `aria-disabled`, `aria-label`, `aria-hidden`).
 * Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 *
 * Compound export (Base UI parity): `RadioGroupRoot`, `RadioRoot`, and
 * `RadioIndicator` are exported standalone and as `RadioGroup.Root`,
 * `RadioGroup.Item`, and `RadioGroup.Indicator` (and on `Radio`).
 */

export type RadioGroupState = {
  /** Currently selected item value, or `null` if nothing selected. */
  value: string | null;
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /** Whether the whole group is read-only. */
  readOnly: boolean;
};

export type RadioRootState = {
  /** Whether this item is currently selected. */
  checked: boolean;
  /** Whether this item is disabled (own `disabled` OR group `disabled`). */
  disabled: boolean;
  /** Whether this item is read-only (own `readOnly` OR group `readOnly`). */
  readOnly: boolean;
};

export type RadioIndicatorState = RadioRootState;

export type RadioGroupProps = {
  /** Controlled selection. Wins over `defaultValue` when defined. */
  value?: string | null;
  /** Uncontrolled initial selection. Default `null` (nothing selected). */
  defaultValue?: string | null;
  /** Fires with the selected item's value on every committed selection. */
  onValueChange?: (value: string) => void;
  /** Terminal: disables every item — no selections, no callbacks. */
  disabled?: boolean;
  /**
   * Read-only: focusable and announced like an enabled group, but
   * presses do not change selection and no callbacks fire. Default
   * `false`.
   */
  readOnly?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  testID?: string;
  /** Root group view style: value or function of group state. */
  style?: StateStyle<RadioGroupState, StyleProp<ViewStyle>>;
  /** The group's items (`RadioRoot` with `RadioIndicator`). */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<RadioGroupState, SlotProps>;
  /** Forwarded to the root group host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type RadioRootProps = {
  /** Selection value contributed to the group when this item is activated. */
  value: string;
  /** Terminal for this item only: it never selects and is announced as disabled. Siblings are unaffected. */
  disabled?: boolean;
  /**
   * Read-only for this item only: focusable and announced like an
   * enabled option, but it never selects. OR'ed with the group's
   * `readOnly` (either freezes it). Default `false`.
   */
  readOnly?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  testID?: string;
  /** Item pressable style: value or function of item state. */
  style?: StateStyle<RadioRootState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<RadioRootState, SlotProps>;
};

export type RadioIndicatorProps = {
  testID?: string;
  /** Indicator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Indicator content. Mounts while the radio is checked (or always with `keepMounted`). */
  children?: ReactNode;
  keepMounted?: boolean;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<RadioIndicatorState, SlotProps>;
};

export type RadioGroupSelection = {
  selectedValue: string | null;
  groupDisabled: boolean;
  groupReadOnly: boolean;
  select: (itemValue: string) => void;
};

export const RadioGroupSelectionContext =
  createContext<RadioGroupSelection | null>(null);

export type RadioItemDisclosure = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
};

export const RadioItemDisclosureContext =
  createContext<RadioItemDisclosure | null>(null);

function assignRef(
  ref: RadioGroupProps["ref"],
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

export function RadioGroupRoot({
  value,
  defaultValue = null,
  onValueChange,
  disabled = false,
  readOnly = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: RadioGroupProps): React.ReactNode {
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
    (itemValue: string) => {
      setSelectedValue(itemValue);
    },
    [setSelectedValue],
  );

  const selection = useMemo<RadioGroupSelection>(
    () => ({
      selectedValue: selectedValue ?? null,
      groupDisabled: disabled,
      groupReadOnly: readOnly,
      select,
    }),
    [selectedValue, disabled, readOnly, select],
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: RadioGroupState = {
    value: selectedValue ?? null,
    disabled,
    readOnly,
  };

  const hostProps = {
    accessible: true,
    role: "radiogroup" as const,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {}),
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
      role="radiogroup"
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      <RadioGroupSelectionContext.Provider value={selection}>
        {children}
      </RadioGroupSelectionContext.Provider>
    </View>
  );
}

export function RadioRoot({
  value,
  disabled = false,
  readOnly = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
}: RadioRootProps): React.ReactNode {
  const group = useContext(RadioGroupSelectionContext);
  const effectiveDisabled = disabled || (group?.groupDisabled ?? false);
  const effectiveReadOnly = readOnly || (group?.groupReadOnly ?? false);
  const checked = group?.selectedValue === value;

  const selectItem = useCallback(() => {
    if (effectiveDisabled || effectiveReadOnly) return;
    group?.select(value);
  }, [effectiveDisabled, effectiveReadOnly, group, value]);

  const state: RadioRootState = {
    checked,
    disabled: effectiveDisabled,
    readOnly: effectiveReadOnly,
  };

  const hostProps = {
    role: "radio" as const,
    "aria-checked": checked,
    "aria-disabled": effectiveDisabled,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {}),
    testID,
    disabled: effectiveDisabled,
    onPress: selectItem,
    style: resolveStyle(style, state),
    children,
  } satisfies SlotProps;

  const substituted = resolveRender(render, hostProps, state);
  if (substituted !== null) {
    return (
      <RadioItemDisclosureContext.Provider
        value={{
          checked,
          disabled: effectiveDisabled,
          readOnly: effectiveReadOnly,
        }}
      >
        {substituted}
      </RadioItemDisclosureContext.Provider>
    );
  }

  return (
    <Pressable
      role="radio"
      aria-checked={checked}
      aria-disabled={effectiveDisabled}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={selectItem}
      style={resolveStyle(style, state)}
    >
      <RadioItemDisclosureContext.Provider
        value={{
          checked,
          disabled: effectiveDisabled,
          readOnly: effectiveReadOnly,
        }}
      >
        {children}
      </RadioItemDisclosureContext.Provider>
    </Pressable>
  );
}

export function RadioIndicator({
  testID,
  style,
  children,
  keepMounted = false,
  render,
}: RadioIndicatorProps): React.ReactNode {
  const disclosure = useContext(RadioItemDisclosureContext);
  if (!disclosure) return null;
  const { checked, disabled, readOnly } = disclosure;
  if (!checked && !keepMounted) return null;

  const state: RadioIndicatorState = {
    checked,
    disabled,
    readOnly,
  };
  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      testID={testID}
      style={style}
      aria-hidden={!checked}
    >
      {children}
    </View>
  );
}

export { RadioGroupRoot as RadioGroup };
export const Radio = Object.assign(RadioRoot, {
  Root: RadioRoot,
  Indicator: RadioIndicator,
});
