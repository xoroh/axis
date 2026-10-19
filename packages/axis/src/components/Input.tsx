import { type ElementRef, type Ref, useCallback, useState } from "react";
import { type StyleProp, TextInput, type TextStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * Input — an unstyled text entry, single-line or multiline.
 *
 * Structure only: the host `TextInput` with controlled/uncontrolled
 * value plumbing. `multiline` switches the host into multiline mode
 * (the folded `Textarea`: `numberOfLines` defaults to 3 there);
 * `autoGrow` tracks content height into the caller's layout with
 * optional `minRows`/`maxRows` clamps and `onHeightChange` reports.
 * Payloads stay primitive strings (`onValueChange`) — no event-object
 * types cross this boundary. Keyboard selection and masking beyond
 * `secureTextEntry` stay out, not hidden behavior here.
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
  /** Fires on the return key. Multiline callers typically omit it (return inserts a newline). */
  onSubmitEditing?: () => void;
  /**
   * Multiline entry (the folded `Textarea`). Default `false`.
   * `numberOfLines` defaults to 3 in multiline mode.
   */
  multiline?: boolean;
  /** Visible line hint. Defaults to 3 in multiline mode, unset otherwise. */
  numberOfLines?: number;
  /**
   * Grow the host height with content. Implemented as measured height
   * state merged under caller `style`; no animation. Ignored unless
   * `multiline`.
   */
  autoGrow?: boolean;
  /**
   * Minimum grown rows. Constrains the `autoGrow` height: rows × one
   * row, where one row is the caller style `lineHeight`, else
   * `fontSize`, else 14 (the RN default, documented fallback).
   * Only inspectable styles (objects/arrays) resolve a row — registered
   * styles fall back to 14. Ignored without `autoGrow`.
   */
  minRows?: number;
  /**
   * Maximum grown rows (same row-height rule as `minRows`; applied
   * after it, so `maxRows` wins on conflict). Ignored without `autoGrow`.
   */
  maxRows?: number;
  /**
   * Fires with the measured content height on every content-size change
   * while `autoGrow` is set (the clamped value, after `minRows`/`maxRows`).
   */
  onHeightChange?: (height: number) => void;
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

/**
 * One row in dp for `minRows`/`maxRows` clamping: the caller style
 * `lineHeight`, else `fontSize`, else 14 (the RN default font size).
 * Walks plain objects/arrays only — registered styles cannot be
 * inspected, so they take the fallback (documented, not silent).
 */
function rowHeightFor(style: StyleProp<TextStyle> | undefined): number {
  const flat: Record<string, unknown> = {};
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, val] of Object.entries(node)) flat[key] = val;
    }
  };
  walk(style);
  const lineHeight = flat.lineHeight;
  if (
    typeof lineHeight === "number" &&
    Number.isFinite(lineHeight) &&
    lineHeight > 0
  ) {
    return lineHeight;
  }
  const fontSize = flat.fontSize;
  if (
    typeof fontSize === "number" &&
    Number.isFinite(fontSize) &&
    fontSize > 0
  ) {
    return fontSize;
  }
  return 14;
}

export function Input({
  value,
  defaultValue = "",
  onValueChange,
  onSubmitEditing,
  placeholder,
  secureTextEntry = false,
  editable = true,
  multiline = false,
  numberOfLines,
  autoGrow = false,
  minRows,
  maxRows,
  onHeightChange,
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
  const [measuredHeight, setMeasuredHeight] = useState<number | undefined>(
    undefined,
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof TextInput> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: InputState = { value: text ?? "", editable };
  const resolvedStyle = resolveStyle(style, state);
  const lines = numberOfLines ?? (multiline ? 3 : undefined);
  const grow = multiline && autoGrow;

  const handleContentSizeChange = (event: {
    nativeEvent: { contentSize: { height: number } };
  }): void => {
    const raw = event.nativeEvent.contentSize.height;
    const row = rowHeightFor(resolvedStyle);
    const floor =
      minRows !== undefined && Number.isFinite(minRows)
        ? Math.max(0, minRows) * row
        : undefined;
    const ceiling =
      maxRows !== undefined && Number.isFinite(maxRows)
        ? Math.max(0, maxRows) * row
        : undefined;
    let next = raw;
    if (floor !== undefined) next = Math.max(next, floor);
    if (ceiling !== undefined) next = Math.min(next, ceiling);
    setMeasuredHeight(next);
    onHeightChange?.(next);
  };

  const substituted = resolveRender(
    render,
    {
      value: text ?? "",
      onChangeText: editable ? setText : undefined,
      onSubmitEditing: editable ? onSubmitEditing : undefined,
      placeholder,
      secureTextEntry,
      editable,
      multiline,
      numberOfLines: lines,
      onContentSizeChange: grow ? handleContentSizeChange : undefined,
      onHeightChange,
      accessibilityLabel,
      testID,
      style: resolvedStyle,
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
      multiline={multiline}
      numberOfLines={lines}
      onContentSizeChange={grow ? handleContentSizeChange : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={
        grow
          ? [
              resolvedStyle,
              measuredHeight !== undefined ? { height: measuredHeight } : null,
            ]
          : resolvedStyle
      }
    />
  );
}
