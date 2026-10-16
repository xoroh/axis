import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Toggle — an unstyled pressed-state button.
 *
 * Structure only: a `Pressable` carrying the button role with the
 * selected state, rendering caller-provided label content
 * (`children`). No default visuals — every visual value (`style`)
 * is caller-provided. State follows the `useControllableState`
 * pattern: `pressed` (+ `onPressedChange`) for controlled use,
 * `defaultPressed` for uncontrolled.
 */

export type ToggleProps = {
  /** Controlled state. Wins over `defaultPressed` when defined. */
  pressed?: boolean;
  /** Uncontrolled initial state. Default `false`. */
  defaultPressed?: boolean;
  /** Fires with the next state on every committed toggle. */
  onPressedChange?: (pressed: boolean) => void;
  /** Terminal: no transitions, no callbacks, announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Native labelled-by association where the platform supports it. */
  accessibilityLabelledBy?: string;
  testID?: string;
  /** Root pressable style. */
  style?: StyleProp<ViewStyle>;
  /** Label content rendered inside the pressable. */
  children?: ReactNode;
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
  pressed,
  defaultPressed = false,
  onPressedChange,
  disabled = false,
  accessibilityLabel,
  accessibilityLabelledBy,
  testID,
  style,
  children,
  ref,
}: ToggleProps): React.JSX.Element {
  const [isPressed, setPressed] = useControllableState<boolean>(
    pressed,
    defaultPressed,
    onPressedChange,
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setPressed((previous) => !(previous ?? false));
  }, [disabled, setPressed]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <Pressable
      ref={setHostRef}
      accessibilityRole="button"
      accessibilityState={{ selected: isPressed ?? false, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityLabelledBy={accessibilityLabelledBy}
      testID={testID}
      disabled={disabled}
      onPress={toggle}
      style={style}
    >
      {children}
    </Pressable>
  );
}
