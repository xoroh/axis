import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { CheckboxGroupSelectionContext } from "./CheckboxGroup";

/**
 * Checkbox — an unstyled three-state checkbox (checked, unchecked,
 * indeterminate).
 *
 * Compound anatomy:
 *
 *   <CheckboxRoot>
 *     <CheckboxIndicator />
 *   </CheckboxRoot>
 *
 * Structure only: a `Pressable` host element with the `checkbox` role
 * and state (`checked` — boolean or `"mixed"`, `disabled`), carrying an
 * indicator `View` whose presence is state-driven. No default box
 * dimensions, borders, or colors are imposed — every visual value is
 * caller-provided. State follows the `useControllableState` pattern:
 * `checked` (+ `onCheckedChange`) for controlled use, `defaultChecked`
 * for uncontrolled. `indeterminate` is a separate boolean that forces
 * `"mixed"` checked semantics and keeps the indicator mounted; it is
 * caller-owned and not cleared by toggles.
 *
 * ADR-112 aria-only: parts set accessibility state, role, and value
 * ONLY through `aria-*` props and `role` (`role="checkbox"`,
 * `aria-checked`, `aria-disabled`, `aria-label`, `aria-hidden`).
 * Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 *
 * Compound export (Base UI parity): `CheckboxRoot` and
 * `CheckboxIndicator` are exported standalone and as `Checkbox.Root` /
 * `Checkbox.Indicator`.
 */

export type CheckboxRootState = {
  /** Current checked state of the box. */
  checked: boolean;
  /** Whether the box is disabled. */
  disabled: boolean;
  /** Whether the box is in an indeterminate state. */
  indeterminate: boolean;
  /** Whether the box is read-only. */
  readOnly: boolean;
};

export type CheckboxIndicatorState = CheckboxRootState;

export type CheckboxDisclosure = {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
  readOnly: boolean;
};

export const CheckboxDisclosureContext =
  createContext<CheckboxDisclosure | null>(null);

export type CheckboxRootProps = {
  /**
   * Group value: when rendered inside a `CheckboxGroup`, this string
   * identifies the box within the group's selection set.
   * Standalone checkboxes omit this.
   */
  value?: string;
  /** Controlled checked state. Wins over `defaultChecked` when defined. */
  checked?: boolean;
  /** Uncontrolled initial checked state. Default `false`. */
  defaultChecked?: boolean;
  /** Fires with the next state on every committed toggle. */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Mixed state: neither ticked nor unticked. Default `false`.
   * Announced as the `mixed` checked mapping; the indicator mounts
   * while set. Caller-owned: toggling does not clear it.
   */
  indeterminate?: boolean;
  /** Terminal: no transitions, no callbacks, announced as disabled. */
  disabled?: boolean;
  /**
   * Read-only: focusable and announced like an enabled checkbox,
   * but presses do not change state and no callbacks fire. Default
   * `false`. Distinct from `disabled` (which blocks interaction and
   * announces disabled).
   */
  readOnly?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of checkbox state, caller-provided. */
  style?: StateStyle<CheckboxRootState, StyleProp<ViewStyle>>;
  /** Box content (`CheckboxIndicator` composed by the caller). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<CheckboxRootState, SlotProps>;
  /** Forwarded to the root pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

export type CheckboxIndicatorProps = {
  testID?: string;
  /** Indicator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Indicator content. Mounts while the box is checked or indeterminate (or always with `keepMounted`). */
  children?: ReactNode;
  /**
   * When `true`, the indicator stays mounted while the box is
   * unchecked: mounted but hidden from assistive tech via `aria-hidden`,
   * with `{ checked: false, indeterminate: false }` state. The indicator
   * stays visible by design (Base UI parity — the caller styles it from state).
   * Default `false`.
   */
  keepMounted?: boolean;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)` with `{ checked, disabled,
   * indeterminate, readOnly }`.
   */
  render?: RenderProp<CheckboxIndicatorState, SlotProps>;
};

function assignRef(
  ref: CheckboxRootProps["ref"],
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
      // A frozen ref object cannot take the write
    }
  }
}

export function CheckboxRoot({
  value,
  checked,
  defaultChecked = false,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  readOnly = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: CheckboxRootProps): React.ReactNode {
  const [isChecked, setChecked] = useControllableState<boolean>(
    checked,
    defaultChecked,
    onCheckedChange,
  );

  const group = useContext(CheckboxGroupSelectionContext);
  const joined = group !== null && value !== undefined;
  const groupChecked =
    value !== undefined && (group?.selectedValues?.includes(value) ?? false);
  const effectiveDisabled =
    disabled || (joined && (group?.groupDisabled ?? false));

  const toggle = useCallback(() => {
    if (effectiveDisabled || readOnly) return;
    if (joined && group && value !== undefined) {
      onCheckedChange?.(!groupChecked);
      group.toggle(value);
      return;
    }
    setChecked((previous) => !(previous ?? false));
  }, [
    effectiveDisabled,
    readOnly,
    joined,
    group,
    value,
    groupChecked,
    onCheckedChange,
    setChecked,
  ]);

  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: CheckboxRootState = {
    checked: joined ? groupChecked : (isChecked ?? false),
    disabled: effectiveDisabled,
    indeterminate: joined ? false : indeterminate,
    readOnly,
  };

  const hostProps = {
    role: "checkbox" as const,
    "aria-checked": state.indeterminate ? ("mixed" as const) : state.checked,
    "aria-disabled": effectiveDisabled,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined
      ? { "aria-labelledby": ariaLabelledBy }
      : {}),
    testID,
    disabled: effectiveDisabled,
    onPress: toggle,
    style: resolveStyle(style, state),
    children,
    ref: setHostRef,
  } satisfies SlotProps;

  const substituted = resolveRender(render, hostProps, state);
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setHostRef}
      role="checkbox"
      aria-checked={state.indeterminate ? "mixed" : state.checked}
      aria-disabled={effectiveDisabled}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={toggle}
      style={resolveStyle(style, state)}
    >
      <CheckboxDisclosureContext.Provider
        value={{
          checked: state.checked,
          disabled: effectiveDisabled,
          indeterminate: state.indeterminate,
          readOnly,
        }}
      >
        {children}
      </CheckboxDisclosureContext.Provider>
    </Pressable>
  );
}

export function CheckboxIndicator({
  testID,
  style,
  children,
  keepMounted = false,
  render,
}: CheckboxIndicatorProps): React.ReactNode {
  const disclosure = useContext(CheckboxDisclosureContext);
  if (!disclosure) return null;
  const { checked, disabled, indeterminate, readOnly } = disclosure;
  const shown = checked || indeterminate;
  if (!shown && !keepMounted) return null;

  const state: CheckboxIndicatorState = {
    checked,
    disabled,
    indeterminate,
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
    <View testID={testID} style={style} aria-hidden={!shown}>
      {children}
    </View>
  );
}

export const Checkbox = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
});
