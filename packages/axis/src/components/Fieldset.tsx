import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { type RenderProp, resolveRender } from "../render";
import type { SlotProps } from "../slot";

/**
 * FieldsetRoot — an unstyled group of related fields with a legend part.
 *
 * Structure only: an optional legend `Text` plus caller children. No
 * invented group role (React Native defines none for this) — the
 * legend is read as text. Validation and disabled-group semantics
 * belong to the caller, never here.
 */

export type FieldsetLegendProps = {
  testID?: string;
  /** Legend text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Legend content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): static text
   * carries no state, so the function form receives an empty state
   * object (the `DialogTitle` precedent).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type FieldsetRootProps = {
  /** Legend content rendered above the group. */
  legend?: ReactNode;
  /** The grouped fields. */
  children?: ReactNode;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Legend text style, caller-provided. */
  legendStyle?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The group carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
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
  ref: FieldsetRootProps["ref"],
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

export function FieldsetRoot({
  legend,
  children,
  testID,
  style,
  legendStyle,
  render,
  ref,
}: FieldsetRootProps): React.ReactNode {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      legend,
      legendStyle,
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setHostRef} testID={testID} style={style}>
      {legend !== undefined ? <Text style={legendStyle}>{legend}</Text> : null}
      {children}
    </View>
  );
}

export function FieldsetLegend({
  testID,
  style,
  children,
  render,
}: FieldsetLegendProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text testID={testID} style={style}>
      {children}
    </Text>
  );
}
