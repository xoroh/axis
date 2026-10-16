import type { ElementRef, ReactNode, Ref } from "react";
import { Text as HostText, type StyleProp, type TextStyle } from "react-native";
import { type RenderProp, resolveRender } from "../render";
import type { SlotProps } from "../slot";

/**
 * Text — an unstyled readable-text host.
 *
 * A `Text` carrying caller content with explicit accessibility props
 * (label source, role passthrough) and truncation passthrough. It
 * carries deliberately NO typographic scale: size, weight, and color
 * are design-system decisions expressed through caller `style`.
 * A component that needs key-hint semantics owns it (Axis
 * carries no key-hint primitive — key hints are display
 * typography, not behavior).
 */

export type TextProps = {
  /** Content to display. */
  children?: ReactNode;
  /** Accessible name source. Without one the content itself is read. */
  accessibilityLabel?: string;
  /** Role passthrough (e.g. `"header"` for headings). No default claim. */
  accessibilityRole?: "none" | "text" | "header" | "summary";
  /** Truncation: maximum lines before ellipsizing. */
  numberOfLines?: number;
  /** Where the ellipsis lands when `numberOfLines` truncates. */
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
  /** Whether the text is selectable. */
  selectable?: boolean;
  testID?: string;
  /** Text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. The host carries no state, so the
   * function form receives an empty state object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
  /** Ref to the host element. */
  ref?: Ref<ElementRef<typeof HostText>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * until `mergeRefs` has a consumer-approved transfer; covered by the
 * ref-forwarding test below.
 */
function assignRefs(
  ref: TextProps["ref"],
  value: ElementRef<typeof HostText> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    (ref as { current: unknown }).current = value;
  }
}

export function Text({
  children,
  accessibilityLabel,
  accessibilityRole,
  numberOfLines,
  ellipsizeMode,
  selectable,
  testID,
  style,
  render,
  ref,
}: TextProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      accessibilityRole,
      numberOfLines,
      ellipsizeMode,
      selectable,
      testID,
      style,
      children,
      ref,
    } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;

  return (
    <HostText
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      selectable={selectable}
      testID={testID}
      style={style}
      ref={(node) => assignRefs(ref, node)}
    >
      {children}
    </HostText>
  );
}
