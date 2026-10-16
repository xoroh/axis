import type { ElementRef, ReactNode, Ref } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

/**
 * SettingsRow — an unstyled labeled row with an optional control.
 *
 * Title plus optional description text with a trailing `control` slot
 * (a caller-owned Switch, Checkbox, chevron, or value readout). The
 * row itself is a `Pressable` only when `onPress` is provided (detail
 * navigation); otherwise it stays a static `View` and the control
 * remains independently operable — wrapping a switch in a pressable
 * row would fire navigation when the user meant the switch.
 * Selection is caller state expressed through `selected`, announced
 * when the row is pressable.
 */

export type SettingsRowProps = {
  /** Row title (required — a settings row without a label is nameless). */
  title: string;
  /** Secondary line under the title. */
  description?: string;
  /** Trailing control (Switch, value, chevron). Caller-owned. */
  control?: ReactNode;
  /** Detail action. Absence renders a static row. */
  onPress?: () => void;
  /** Selected state, announced when pressable. */
  selected?: boolean;
  /** Terminal: no press. */
  disabled?: boolean;
  /** Accessible name source. Without one the title is read. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** Title text style, caller-provided. */
  titleStyle?: StyleProp<TextStyle>;
  /** Description text style, caller-provided. */
  descriptionStyle?: StyleProp<TextStyle>;
  /** Ref to the host element (both hosts resolve to a View). */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * until `mergeRefs` has a consumer-approved transfer; covered by the
 * ref-forwarding test below.
 */
function assignRefs(
  ref: SettingsRowProps["ref"],
  value: ElementRef<typeof View> | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    (ref as { current: unknown }).current = value;
  }
}

export function SettingsRow({
  title,
  description,
  control,
  onPress,
  selected = false,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  titleStyle,
  descriptionStyle,
  ref,
}: SettingsRowProps): React.JSX.Element {
  const body = (
    <>
      <Text style={titleStyle}>{title}</Text>
      {description === undefined ? null : (
        <Text style={descriptionStyle}>{description}</Text>
      )}
      {control}
    </>
  );
  if (onPress === undefined) {
    return (
      <View
        accessible={false}
        testID={testID}
        style={style}
        ref={(node) => assignRefs(ref, node)}
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={style}
      ref={(node) => assignRefs(ref, node)}
    >
      {body}
    </Pressable>
  );
}
