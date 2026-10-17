import { type ElementRef, type Ref, useCallback } from "react";
import { type StyleProp, TextInput, type TextStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * Input — an unstyled single-line text entry.
 *
 * Structure only: the host `TextInput` with controlled/uncontrolled
 * value plumbing. Payloads stay primitive strings (`onValueChange`) —
 * no event-object types cross this boundary. Keyboard selection,
 * masking beyond `secureTextEntry`, and multiline belong to future
 * props or the Textarea component, not hidden behavior here.
 */

export type InputState = {
  /** Current text. */
  value: string;
  /** Whether the input is currently editable. */
  editable: boolean;
};

export type InputProps = {
  /** Controlled text. Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial text. Default `""`. */
  defaultValue?: string;
  /** Fires with the next text on every change (Base UI name). */
  onValueChange?: (text: string) => void;
  /** Placeholder text. Visual only, caller-provided. */
  placeholder?: string;
  /** Obscured entry. Default `false`. */
  secureTextEntry?: boolean;
  /** Editable flag. `false` renders read-only. Default `true`. */
  editable?: boolean;
  /** Fires on the return key. */
  onSubmitEditing?: () => void;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Input style: value or function of input state, caller-provided. */
  style?: StateStyle<InputState, StyleProp<TextStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<InputState, SlotProps>;
  /** Forwarded to the host text input. */
  ref?: Ref<ElementRef<typeof TextInput>>;
};

function assignRef(
  ref: InputProps["ref"],
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

export function Input({
  value,
  defaultValue = "",
  onValueChange,
  onSubmitEditing,
  placeholder,
  secureTextEntry = false,
  editable = true,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: InputProps): React.ReactNode {
  const [text, setText] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof TextInput> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: InputState = { value: text ?? "", editable };
  const substituted = resolveRender(
    render,
    {
      value: text ?? "",
      onChangeText: editable ? setText : undefined,
      onSubmitEditing: editable ? onSubmitEditing : undefined,
      placeholder,
      secureTextEntry,
      editable,
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <TextInput
      ref={setHostRef}
      value={text ?? ""}
      onChangeText={editable ? setText : undefined}
      onSubmitEditing={editable ? onSubmitEditing : undefined}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      editable={editable}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    />
  );
}
