import { type ElementRef, type Ref, useCallback, useState } from "react";
import { type StyleProp, TextInput, type TextStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
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

export type TextareaState = {
  /** Current text. */
  value: string;
  /** Whether the input is currently editable. */
  editable: boolean;
};

export type TextareaProps = {
  /** Controlled text. Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial text. Default `""`. */
  defaultValue?: string;
  /** Fires with the next text on every change (Base UI name). */
  onValueChange?: (text: string) => void;
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
  /** Input style: value or function of textarea state, caller-provided. */
  style?: StateStyle<TextareaState, StyleProp<TextStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<TextareaState, SlotProps>;
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
  onValueChange,
  placeholder,
  editable = true,
  numberOfLines = 3,
  autoGrow = false,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: TextareaProps): React.ReactNode {
  const [text, setText] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
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

  const state: TextareaState = { value: text ?? "", editable };
  const substituted = resolveRender(
    render,
    {
      value: text ?? "",
      onChangeText: editable ? setText : undefined,
      placeholder,
      editable,
      multiline: true,
      numberOfLines,
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
        resolveStyle(style, state),
        measuredHeight !== undefined ? { height: measuredHeight } : null,
      ]}
    />
  );
}
