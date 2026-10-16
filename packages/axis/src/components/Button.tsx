import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";

/**
 * Button — an unstyled pressable action.
 *
 * Structure only: a `Pressable` carrying the button role and state.
 * No default visuals — every visual value (`style`, and the rendered
 * `children` themselves) is caller-provided. `disabled` or `loading`
 * suppresses `onPress`; `loading` additionally announces `busy`, and
 * the caller swaps the children to reflect the busy state (no spinner
 * is rendered here). Stateless: no `useControllableState` needed.
 */

export type ButtonState = {
  /** Whether the button is currently disabled. */
  disabled: boolean;
  /** Whether the button is currently busy. */
  loading: boolean;
};

export type ButtonProps = {
  /** Fires on press. Suppressed while `disabled` or `loading`. */
  onPress?: () => void;
  /** Terminal: no callbacks, announced as disabled. */
  disabled?: boolean;
  /**
   * Busy: suppresses `onPress`, announced as busy. The caller swaps
   * `children` to reflect the busy state — nothing renders here.
   */
  loading?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Native labelled-by association where the platform supports it. */
  accessibilityLabelledBy?: string;
  testID?: string;
  /** Value or function of button state, caller-provided. */
  style?: StateStyle<ButtonState, StyleProp<ViewStyle>>;
  /** Caller-provided content. A button without label content is useless. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ButtonState, SlotProps>;
  /** Forwarded to the root pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: ButtonProps["ref"],
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

export function Button({
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ButtonProps): React.ReactNode {
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress?.();
  }, [disabled, loading, onPress]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: ButtonState = { disabled, loading };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "button",
      accessibilityState: { disabled, busy: loading },
      accessibilityLabel,
      accessibilityLabelledBy,
      testID,
      disabled,
      onPress: handlePress,
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
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      accessibilityLabel={accessibilityLabel}
      accessibilityLabelledBy={accessibilityLabelledBy}
      testID={testID}
      disabled={disabled}
      onPress={handlePress}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}
