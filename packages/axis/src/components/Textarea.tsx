import { type ElementRef, type Ref, useCallback, useState } from "react";
import { type StyleProp, TextInput, type TextStyle } from "react-native";
import { useControllableState } from "../useControllableState";

/**
 * Textarea — an unstyled multiline text entry.
 *
 * Structure only: the host `TextInput` in multiline mode with
 * controlled/uncontrolled value plumbing. `autoGrow` tracks content
 * height into the caller's layout (no animation, no max-lines policy
 * beyond `numberOfLines` passthrough). Payloads stay primitive
 * strings, as in `Input`.
 */

export type TextareaProps = {
  /** Controlled text. Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial text. Default `""`. */
  defaultValue?: string;
  /** Fires with the next text on every change. */
  onChangeText?: (text: string) => void;
  /** Placeholder text. Visual only, caller-provided. */
  placeholder?: string;
  /** Editable flag. `false` renders read-only. Default `true`. */
  editable?: boolean;
  /** Visible line hint. Default `3`. */
  numberOfLines?: number;
  /**
   * Grow the host height with content. Implemented as measured height
   * state merged under caller `style`; no animation.
   */
  autoGrow?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Input style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Forwarded to the host text input. */
  ref?: Ref<ElementRef<typeof TextInput>>;
};

function assignRef(
  ref: TextareaProps["ref"],
  value: ElementRef<typeof TextInput> | null,
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

export function Textarea({
  value,
  defaultValue = "",
  onChangeText,
  placeholder,
  editable = true,
  numberOfLines = 3,
  autoGrow = false,
  accessibilityLabel,
  testID,
  style,
  ref,
}: TextareaProps): React.JSX.Element {
  const [text, setText] = useControllableState<string>(
    value,
    defaultValue,
    onChangeText,
  );
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(
    undefined,
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof TextInput> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <TextInput
      ref={setHostRef}
      value={text ?? ""}
      onChangeText={editable ? setText : undefined}
      placeholder={placeholder}
      editable={editable}
      multiline
      numberOfLines={numberOfLines}
      onContentSizeChange={
        autoGrow
          ? (event) => setMeasuredHeight(event.nativeEvent.contentSize.height)
          : undefined
      }
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        style,
        measuredHeight !== undefined ? { height: measuredHeight } : null,
      ]}
    />
  );
}
