import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";

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

export type FieldState = {
  /** Whether an error is currently shown. */
  invalid: boolean;
};

export type FieldProps = {
  /** Label content rendered above the control. */
  label?: ReactNode;
  /** The control element. */
  children?: ReactNode;
  /** Error content; rendered only when provided. */
  error?: ReactNode;
  testID?: string;
  /** Container style: value or function of field state. */
  style?: StateStyle<FieldState, StyleProp<ViewStyle>>;
  /** Label text style, caller-provided. */
  labelStyle?: StyleProp<TextStyle>;
  /** Error text style, caller-provided. */
  errorStyle?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<FieldState, SlotProps>;
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
  render,
  ref,
}: FieldProps): React.ReactNode {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: FieldState = { invalid: error !== undefined };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      label,
      labelStyle,
      error,
      errorStyle,
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
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
