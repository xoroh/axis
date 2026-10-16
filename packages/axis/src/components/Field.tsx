import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Field — an unstyled label/control/error row.
 *
 * Structure only: an optional label `Text`, the caller-provided
 * control (`children`), and an optional error `Text` announced
 * politely when present. No validation logic lives here — validity
 * is the caller's state, expressed by passing `error`. Control-id
 * wiring beyond plain composition is deferred until a consumer
 * demonstrates the need.
 */

export type FieldProps = {
  /** Label content rendered above the control. */
  label?: ReactNode;
  /** The control element. */
  children?: ReactNode;
  /** Error content; rendered only when provided. */
  error?: ReactNode;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Label text style, caller-provided. */
  labelStyle?: StyleProp<TextStyle>;
  /** Error text style, caller-provided. */
  errorStyle?: StyleProp<TextStyle>;
  /** Forwarded to the container `View` host element. */
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
  ref: FieldProps["ref"],
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

export function Field({
  label,
  children,
  error,
  testID,
  style,
  labelStyle,
  errorStyle,
  ref,
}: FieldProps): React.JSX.Element {
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
      {label !== undefined ? <Text style={labelStyle}>{label}</Text> : null}
      {children}
      {error !== undefined ? (
        <Text accessibilityLiveRegion="polite" style={errorStyle}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
