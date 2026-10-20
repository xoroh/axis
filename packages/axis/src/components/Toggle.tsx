import {
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
} from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { ToggleGroupPressedContext } from "./ToggleGroup";

/**
 * Toggle — an unstyled two-state button (on/off).
 *
 * Structure only: a `Pressable` host element carrying the `button` role
 * and `aria-selected` / `aria-pressed` state, with caller-provided label content
 * inside. No default padding, background, border, or text styles are
 * imposed — every visual value is caller-provided. State follows the
 * `useControllableState` pattern: `pressed` (+ `onPressedChange`) for
 * controlled use, `defaultPressed` for uncontrolled.
 *
 * ADR-112 aria-only: parts set accessibility state, role, and value
 * ONLY through `aria-*` props and `role` (`role="button"`,
 * `aria-selected`, `aria-pressed`, `aria-disabled`, `aria-label`).
 * Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 *
 * Compound export (Base UI parity): `Toggle` is exported standalone and
 * as `Toggle.Root` so both `Toggle` and `Toggle.Root` work identically.
 */

export type ToggleState = {
  /** Current pressed state of the toggle. */
  pressed: boolean;
  /** Whether the toggle is disabled. */
  disabled: boolean;
};

export type ToggleProps = {
  /**
   * Group value: when rendered inside a `ToggleGroup`, this string
   * identifies the toggle within the group's selection set.
   * Standalone toggles omit this.
   */
  value?: string;
  /** Controlled pressed state. Wins over `defaultPressed` when defined. */
  pressed?: boolean;
  /** Uncontrolled initial pressed state. Default `false`. */
  defaultPressed?: boolean;
  /** Fires with the next state on every committed toggle. */
  onPressedChange?: (pressed: boolean) => void;
  /** Terminal: no transitions, no callbacks, announced as disabled. */
  disabled?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of toggle state, caller-provided. */
  style?: StateStyle<ToggleState, StyleProp<ViewStyle>>;
  /** Label content rendered inside the pressable. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToggleState, SlotProps>;
  /** Forwarded to the root pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes.
 */
function assignRef(
  ref: ToggleProps["ref"],
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

export function Toggle({
  value,
  pressed,
  defaultPressed = false,
  onPressedChange,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ToggleProps): React.ReactNode {
  const [isPressed, setPressed] = useControllableState<boolean>(
    pressed,
    defaultPressed,
    onPressedChange,
  );

  const group = useContext(ToggleGroupPressedContext);
  const joined = group !== null && value !== undefined;
  const groupPressed =
    value !== undefined && (group?.pressedValues?.includes(value) ?? false);
  const effectiveDisabled =
    disabled || (joined && (group?.groupDisabled ?? false));

  const toggle = useCallback(() => {
    if (effectiveDisabled) return;
    if (joined && group && value !== undefined) {
      onPressedChange?.(!groupPressed);
      group.toggle(value);
      return;
    }
    setPressed((previous) => !(previous ?? false));
  }, [
    effectiveDisabled,
    joined,
    group,
    value,
    groupPressed,
    onPressedChange,
    setPressed,
  ]);

  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: ToggleState = {
    pressed: joined ? groupPressed : (isPressed ?? false),
    disabled: effectiveDisabled,
  };

  const hostProps = {
    role: "button" as const,
    "aria-pressed": state.pressed,
    "aria-selected": state.pressed,
    "aria-disabled": effectiveDisabled,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {}),
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
      role="button"
      aria-pressed={state.pressed}
      aria-selected={state.pressed}
      aria-disabled={effectiveDisabled}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={toggle}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export const ToggleRoot = Toggle;
