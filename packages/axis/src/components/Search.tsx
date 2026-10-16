import { type ElementRef, type Ref, useCallback } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { Input } from "./Input";

/**
 * Search — an unstyled search entry with clear affordance.
 *
 * Composes the Axis `Input` (no reimplemented text entry) with a
 * clear `Pressable` rendered only while the query is non-empty.
 * Submit is the caller's `onSubmit` on the return key
 * (`onSubmitEditing`); result filtering belongs to the caller, never
 * here — this component owns entry, not data.
 */

export type SearchState = {
  /** Current query. */
  value: string;
};

export type SearchProps = {
  /** Controlled query. Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial query. Default `""`. */
  defaultValue?: string;
  /** Fires with the next query on every change. */
  onValueChange?: (value: string) => void;
  /** Fires with the current query on submit (return key). */
  onSubmit?: (value: string) => void;
  /** Placeholder text. Visual only, caller-provided. */
  placeholder?: string;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Container style: value or function of search state. */
  style?: StateStyle<SearchState, StyleProp<ViewStyle>>;
  /** Input style, caller-provided. */
  inputStyle?: StyleProp<TextStyle>;
  /** Clear-button label for assistive tech. Default `"Clear search"`. */
  clearAccessibilityLabel?: string;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the whole search container
   * (entry plus clear affordance).
   */
  render?: RenderProp<SearchState, SlotProps>;
  /** Forwarded to the container host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

function assignRef(
  ref: SearchProps["ref"],
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

export function Search({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  placeholder,
  accessibilityLabel,
  testID,
  style,
  inputStyle,
  clearAccessibilityLabel = "Clear search",
  render,
  ref,
}: SearchProps): React.ReactNode {
  const [query, setQuery] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const clear = useCallback(() => {
    setQuery("");
  }, [setQuery]);

  const submit = useCallback(() => {
    onSubmit?.(query ?? "");
  }, [onSubmit, query]);

  const state: SearchState = { value: query ?? "" };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      value: query ?? "",
      placeholder,
      accessibilityLabel,
      inputStyle,
      clearAccessibilityLabel,
      onValueChange: setQuery,
      onSubmit: submit,
      onClear: clear,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
      <Input
        value={query ?? ""}
        onValueChange={setQuery}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        onSubmitEditing={submit}
        style={inputStyle}
      />
      {(query ?? "") !== "" ? (
        <Pressable
          accessibilityLabel={clearAccessibilityLabel}
          accessibilityRole="button"
          onPress={clear}
        >
          <Text>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
