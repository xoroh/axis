import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * Fieldset — an unstyled group of related fields with a legend.
 *
 * Structure only: an optional legend `Text` plus caller children. No
 * invented group role (React Native defines none for this) — the
 * legend is read as text. Validation and disabled-group semantics
 * belong to the caller, never here.
 */

export type FieldsetProps = {
  /** Legend content rendered above the group. */
  legend?: ReactNode;
  /** The grouped fields. */
  children?: ReactNode;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Legend text style, caller-provided. */
  legendStyle?: StyleProp<TextStyle>;
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
  ref: FieldsetProps["ref"],
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

export function Fieldset({
  legend,
  children,
  testID,
  style,
  legendStyle,
  ref,
}: FieldsetProps): React.JSX.Element {
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
      {legend !== undefined ? <Text style={legendStyle}>{legend}</Text> : null}
      {children}
    </View>
  );
}
