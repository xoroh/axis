import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

/**
 * Toolbar — an unstyled container grouping a set of controls.
 *
 * Structure only: a `View` carrying the toolbar role, rendering
 * caller-provided controls (`children`). No default visuals — every
 * visual value (`style`) is caller-provided. `orientation` is
 * structural documentation: it selects the container's `flexDirection`
 * (`row` for `"horizontal"`, `column` for `"vertical"`) as a base the
 * caller style overrides, and records the reading order future focus
 * management must follow.
 *
 * No roving keyboard traversal in v1 (deferred with rationale):
 * single tab-stop management belongs to the `roving` model, whose
 * transfer gate has no approved consumer yet, and React Native moves
 * accessibility focus by traversal rather than DOM tab order — there
 * is no arrow-key layer to wire until that model is adopted. `disabled`
 * is observational only (see the prop docs): the container declares no
 * press handling, so there is nothing for it to block.
 */

export type ToolbarProps = {
  /**
   * Reading order of the grouped controls. Default `"horizontal"`.
   * Applied structurally as the container `flexDirection` (`row` /
   * `column`); the caller `style` merges over it and wins on conflict.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Observational only: announced on the container via
   * `accessibilityState`, never forwarded to children and blocking
   * nothing — the container itself is not interactive. Each grouped
   * control owns its own `disabled` state.
   */
  disabled?: boolean;
  /** Accessible name source for the group. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root view style. Merges over the orientation base direction. */
  style?: StyleProp<ViewStyle>;
  /** Grouped controls rendered inside the container. Required. */
  children: ReactNode;
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
  ref: ToolbarProps["ref"],
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

export function Toolbar({
  orientation = "horizontal",
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  ref,
}: ToolbarProps): React.JSX.Element {
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
    <View
      ref={setHostRef}
      accessibilityRole="toolbar"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        { flexDirection: orientation === "vertical" ? "column" : "row" },
        style,
      ]}
    >
      {children}
    </View>
  );
}
