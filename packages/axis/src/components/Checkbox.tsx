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

/**
 * Checkbox — an unstyled binary selection control with compound parts.
 *
 * Structure only: a `CheckboxRoot` `Pressable` carrying the checkbox
 * role and state, with a caller-composed `CheckboxIndicator` that
 * mounts when the box is checked or indeterminate. No default
 * visuals — every visual value (`style` on each part) is
 * caller-provided. State follows the `useControllableState`
 * pattern: `checked` (+ `onCheckedChange`) for controlled use,
 * `defaultChecked` for uncontrolled.
 *
 * `indeterminate` (default `false`) marks the mixed state: neither
 * ticked nor unticked (a "select all" box over a partial
 * selection). It is announced through the `mixed` checked mapping —
 * React Native's `AccessibilityState` types `checked` as `boolean |
 * 'mixed'` (verified against the installed RN `ViewAccessibility`
 * union), so the platform mapping is type-honest, not smuggled past
 * the typechecker. The indicator mounts for both `checked` and
 * indeterminate; the caller styles the difference through the
 * indicator's `indeterminate` state. Toggling reports through
 * `onCheckedChange`; `indeterminate` itself is caller-owned state
 * (the caller clears it when committing a choice).
 */

export type CheckboxState = {
  /** Whether the checkbox is currently checked. */
  checked: boolean;
  /** Whether the checkbox is currently disabled. */
  disabled: boolean;
  /** Whether the checkbox is in the mixed state. Default `false`. */
  indeterminate: boolean;
};

export type CheckboxIndicatorState = {
  /** Whether the checkbox is currently checked. */
  checked: boolean;
  /** Whether the checkbox is currently disabled. */
  disabled: boolean;
  /** Whether the checkbox is in the mixed state. */
  indeterminate: boolean;
};

export type CheckboxRootProps = {
  /** Controlled state. Wins over `defaultChecked` when defined. */
  checked?: boolean;
  /** Uncontrolled initial state. Default `false`. */
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
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Native labelled-by association where the platform supports it. */
  accessibilityLabelledBy?: string;
  testID?: string;
  /** Value or function of checkbox state, caller-provided. */
  style?: StateStyle<CheckboxState, StyleProp<ViewStyle>>;
  /** Box content (`CheckboxIndicator` composed by the caller). */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<CheckboxState, SlotProps>;
  /** Forwarded to the root pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

export type CheckboxIndicatorProps = {
  testID?: string;
  /** Indicator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Indicator content. Mounts while the box is checked or indeterminate. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)` with `{ checked, disabled,
   * indeterminate }` so the caller can style checked and mixed
   * differently.
   */
  render?: RenderProp<CheckboxIndicatorState, SlotProps>;
};

type CheckboxDisclosure = {
  checked: boolean;
  disabled: boolean;
  indeterminate: boolean;
};

/**
 * Shared box state for the indicator. Internal to this module (not
 * exported): the indicator must render inside a `CheckboxRoot` to
 * participate; outside one it never mounts.
 */
const CheckboxDisclosureContext = createContext<CheckboxDisclosure | null>(
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
      // A frozen ref object cannot take the write — leave it alone
      // rather than failing the render over it.
    }
  }
}

export function CheckboxRoot({
  checked,
  defaultChecked = false,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  accessibilityLabel,
  accessibilityLabelledBy,
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

  const toggle = useCallback(() => {
    if (disabled) return;
    setChecked((previous) => !(previous ?? false));
  }, [disabled, setChecked]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: CheckboxState = {
    checked: isChecked ?? false,
    disabled,
    indeterminate,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "checkbox",
      accessibilityState: {
        checked: indeterminate ? "mixed" : (isChecked ?? false),
        disabled,
      },
      accessibilityLabel,
      accessibilityLabelledBy,
      testID,
      disabled,
      onPress: toggle,
      style: resolveStyle(style, state),
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setHostRef}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? "mixed" : (isChecked ?? false),
        disabled,
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityLabelledBy={accessibilityLabelledBy}
      testID={testID}
      disabled={disabled}
      onPress={toggle}
      style={resolveStyle(style, state)}
    >
      <CheckboxDisclosureContext.Provider
        value={{ checked: isChecked ?? false, disabled, indeterminate }}
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
  render,
}: CheckboxIndicatorProps): React.ReactNode {
  const disclosure = useContext(CheckboxDisclosureContext);
  if (!disclosure) return null;
  const { checked, disabled, indeterminate } = disclosure;
  if (!checked && !indeterminate) return null;

  const state: CheckboxIndicatorState = {
    checked,
    disabled,
    indeterminate,
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
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}
