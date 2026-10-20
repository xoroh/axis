import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";
import { type RenderProp, resolveRender } from "../render";
import type { SlotProps } from "../slot";

/**
 * Label — an unstyled text label for associating with a control.
 *
 * Structure only: a `Text` host carrying caller content. Association
 * with a control is by `nativeID`: set the same id on the label and
 * the control's `aria-labelledby`. Focus behavior belongs to
 * the control, never here. No role is declared — a label is read as
 * text; inventing a role the platform does not define would be a lie
 * a screen reader cannot cash.
 */

export type LabelProps = {
  /** Content of the label. */
  children?: ReactNode;
  /** Association id, mirrored on the control's `aria-labelledby`. */
  nativeID?: string;
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The label carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
  /** Forwarded to the `Text` host element. */
  ref?: Ref<ElementRef<typeof Text>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: LabelProps["ref"],
  value: ElementRef<typeof Text> | null,
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

export function Label({
  children,
  nativeID,
  testID,
  style,
  render,
  ref,
}: LabelProps): React.ReactNode {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Text> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const substituted = resolveRender(
    render,
    {
      nativeID,
      testID,
      style,
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <Text ref={setHostRef} nativeID={nativeID} testID={testID} style={style}>
      {children}
    </Text>
  );
}
