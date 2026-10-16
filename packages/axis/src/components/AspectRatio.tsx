import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { type RenderProp, resolveRender } from "../render";
import type { SlotProps } from "../slot";

/**
 * AspectRatio — a container that keeps a width-to-height ratio.
 *
 * Structure only: a `View` whose style carries
 * `{ aspectRatio: ratio }` ahead of the caller-provided `style`, so
 * the caller can still override layout values downstream. No default
 * visuals — every visual value beyond the ratio is caller-provided.
 * Stateless: no `useControllableState` needed.
 *
 * The `aspectRatio` style key is a core React Native layout prop, so
 * no new host binding is involved — the ratio travels in a plain
 * style object. A `ratio` that is not a finite number greater than
 * zero (`0`, negatives, `NaN`, `Infinity`) is clamped to `1`, never
 * thrown: an invalid ratio is a caller typo, not a render failure.
 */

export type AspectRatioProps = {
  /**
   * Width-to-height ratio. Must be a finite number greater than zero;
   * anything else is clamped to `1`. Default `1` (square).
   */
  ratio?: number;
  testID?: string;
  /** Container style, merged after the ratio (caller wins on conflict). */
  style?: StyleProp<ViewStyle>;
  /** Content sized by the ratio container. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The container carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
  /** Forwarded to the root view host element. */
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
  ref: AspectRatioProps["ref"],
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

export function AspectRatio({
  ratio = 1,
  testID,
  style,
  children,
  render,
  ref,
}: AspectRatioProps): React.ReactNode {
  const safeRatio =
    typeof ratio === "number" && Number.isFinite(ratio) && ratio > 0
      ? ratio
      : 1;

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
      style: [{ aspectRatio: safeRatio }, style],
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      testID={testID}
      style={[{ aspectRatio: safeRatio }, style]}
    >
      {children}
    </View>
  );
}
