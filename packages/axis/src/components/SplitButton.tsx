import { type ElementRef, type ReactNode, type Ref, useCallback } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";
import { Button } from "./Button";

/**
 * SplitButton — a primary action with a sibling menu-trigger action.
 *
 * Structure only: a `View` row (`flexDirection: "row"`) holding two Axis
 * `Button`s side by side. No default visuals — every visual value
 * (`style` for the primary pressable, `secondaryStyle` for the
 * secondary pressable) is caller-provided; the container itself is a
 * structural row with no caller style. Both pressables carry the button
 * role via `Button`; press handling is never reimplemented here.
 *
 * Two independent press paths: `onPress` (primary) and
 * `onSecondaryPress` (secondary) never cross. `disabled` is shared and
 * terminal across both: no callbacks from either, both announced as
 * disabled. Accessible names come from content: `children` (primary)
 * and `secondaryLabel` (secondary, default `"More actions"`).
 *
 * Test ids: the primary pressable carries `testID`; the secondary
 * carries `${testID}-secondary` when `testID` is given (the Dialog
 * `-scrim` precedent). The container carries no testID.
 *
 * String secondary labels render inside a `Text` (the `ListItem`
 * precedent): a bare string directly inside a `Pressable` trips the
 * RN test renderer ("Text strings must be rendered within a <Text>"),
 * and the default `"More actions"` is a bare string this module owns,
 * so it wraps strings/numbers here. Primary `children` follow the
 * `Button` contract as-is (typically a caller `Text`).
 */

export type SplitButtonProps = {
  /** Fires on primary press. Suppressed while `disabled`. */
  onPress?: () => void;
  /** Fires on secondary (menu-trigger) press. Suppressed while `disabled`. */
  onSecondaryPress?: () => void;
  /** Terminal across both pressables: no callbacks, both announced disabled. */
  disabled?: boolean;
  /** Primary pressable testID; secondary is `${testID}-secondary`. */
  testID?: string;
  /** Primary pressable style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Secondary pressable style, caller-provided. */
  secondaryStyle?: StyleProp<ViewStyle>;
  /** Primary label content rendered inside the primary pressable. */
  children?: ReactNode;
  /** Secondary label content. Default `"More actions"`. */
  secondaryLabel?: ReactNode;
  /** Forwarded to the root row container host element. */
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
  ref: SplitButtonProps["ref"],
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

export function SplitButton({
  onPress,
  onSecondaryPress,
  disabled = false,
  testID,
  style,
  secondaryStyle,
  children,
  secondaryLabel = "More actions",
  ref,
}: SplitButtonProps): React.JSX.Element {
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
    <View ref={setHostRef} style={{ flexDirection: "row" }}>
      <Button
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        style={style}
      >
        {children}
      </Button>
      <Button
        onPress={onSecondaryPress}
        disabled={disabled}
        testID={testID ? `${testID}-secondary` : undefined}
        style={secondaryStyle}
      >
        {typeof secondaryLabel === "string" ||
        typeof secondaryLabel === "number" ? (
          <Text>{secondaryLabel}</Text>
        ) : (
          secondaryLabel
        )}
      </Button>
    </View>
  );
}
