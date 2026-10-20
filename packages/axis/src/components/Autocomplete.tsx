import { type ElementRef, type Ref, useCallback, useMemo } from "react";
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
 * Autocomplete — filter-as-type text entry with commit.
 *
 * Structure only: an Axis `Input` for entry (no reimplemented text
 * entry) plus a toggle `Pressable` and a filtered suggestion list.
 * The TEXT is the value — a plain `string`, never a value object:
 * there is no selection domain here, so there is nothing to wrap.
 * Typing drives both states: the text through `useControllableState`
 * (`value` + `onValueChange` controlled, `defaultValue`
 * uncontrolled), and the list through a SEPARATE `useControllableState`
 * pair (`open` + `onOpenChange` controlled, `defaultOpen`
 * uncontrolled, default `false`). Typing a non-empty query opens the
 * list; clearing the query closes it; the toggle `Pressable`
 * (`"Show suggestions"` / `"Hide suggestions"`) flips it explicitly.
 * Matches are a case-insensitive substring filter over `options`.
 *
 * Commit (not selection): an option press writes its text (firing
 * `onValueChange` through the text state when the text actually
 * changes, per the hook's identity guard), fires `onCommit` with that
 * text, and closes the list. Submitting the entry (return key via
 * `Input` `onSubmitEditing`) fires `onCommit` with the CURRENT text —
 * which may match no option — and closes. Scrim press closes without
 * committing (the Dialog scrim precedent: a `Pressable` labelled
 * `"Dismiss"`).
 *
 * ADR-112 aria-only: the toggle carries `role="button"` with
 * `aria-expanded` and `aria-disabled`. Options are commit
 * actions, NOT a selection set — each carries `role="button"` with
 * NO selected state, and the list is a plain container with NO
 * `listbox` role. `option`/`listbox` roles would promise selection
 * semantics (a chosen member of a value domain) that this component
 * deliberately lacks. Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 *
 * Deferred, each for a named reason (not oversight):
 * - No multi-commit — the value is one string.
 * - No async loading — `options` is a plain synchronous array.
 * - No animation: the list mounts/unmounts synchronously with open
 *   state (the Accordion panel precedent).
 * - No keyboard traversal: the `roving`/`collection` models are not
 *   adopted here.
 *
 * Test ids: the root carries `testID`; the scrim carries
 * `<testID>-scrim` when `testID` is given (the Accordion `-panel`
 * precedent).
 */

export type AutocompleteState = {
  /** Current text. */
  value: string;
  /** Whether the suggestion list is currently open. */
  open: boolean;
  /** Whether the whole autocomplete is disabled. */
  disabled: boolean;
};

export type AutocompleteProps = {
  /** Suggestion pool, filtered by case-insensitive substring (required). */
  options: ReadonlyArray<string>;
  /** Controlled text. Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial text. Default `""`. */
  defaultValue?: string;
  /** Fires with the next text on every change (typing or option press). */
  onValueChange?: (text: string) => void;
  /** Fires with the committed text on option press AND on submit. */
  onCommit?: (text: string) => void;
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /** Placeholder text. Visual only, caller-provided. */
  placeholder?: string;
  /** Terminal: no text changes, no open/close, no commits, no callbacks. Default `false`. */
  disabled?: boolean;
  /** Accessible name source for the entry (ADR-112). */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  testID?: string;
  /** Root (entry box) style: value or function of autocomplete state. */
  style?: StateStyle<AutocompleteState, StyleProp<ViewStyle>>;
  /** Suggestion list style, caller-provided. */
  listStyle?: StyleProp<ViewStyle>;
  /** Entry input style, caller-provided. Also styles the toggle label, which has no text of its own to read. */
  inputStyle?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the root (entry plus list);
   * typing, toggle, and commit wiring travel in the props.
   */
  render?: RenderProp<AutocompleteState, SlotProps>;
  /** Forwarded to the root host element. */
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
  ref: AutocompleteProps["ref"],
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

export function Autocomplete({
  options,
  value,
  defaultValue = "",
  onValueChange,
  onCommit,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  listStyle,
  inputStyle,
  render,
  ref,
}: AutocompleteProps): React.ReactNode {
  const [text, setText] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
  );

  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  // Typing drives open state: a non-empty query opens the list so the
  // matches are visible; clearing the query closes it (nothing to
  // filter to — the toggle stays available for a manual open).
  const changeText = useCallback(
    (next: string) => {
      if (disabled) return;
      setText(next);
      setOpen(next !== "");
    },
    [disabled, setOpen, setText],
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((previous) => !(previous ?? false));
  }, [disabled, setOpen]);

  // Scrim dismissal closes without committing. Guarded on `disabled`
  // (terminal: no state transitions from a disabled control).
  const dismiss = useCallback(() => {
    if (disabled) return;
    setOpen(false);
  }, [disabled, setOpen]);

  // Option press commits: the option's text becomes the text (firing
  // `onValueChange` through the text state when it actually changes),
  // `onCommit` fires with that text, and the list closes.
  const commitOption = useCallback(
    (option: string) => {
      if (disabled) return;
      setText(option);
      onCommit?.(option);
      setOpen(false);
    },
    [disabled, onCommit, setOpen, setText],
  );

  // Submit commits the CURRENT text — which may match no option — and
  // closes. The text itself is unchanged, so no `onValueChange`.
  const submit = useCallback(() => {
    if (disabled) return;
    onCommit?.(text ?? "");
    setOpen(false);
  }, [disabled, onCommit, setOpen, text]);

  const matches = useMemo(() => {
    const query = (text ?? "").toLowerCase();
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, text]);

  const expanded = isOpen ?? false;

  const state: AutocompleteState = {
    value: text ?? "",
    open: expanded,
    disabled,
  };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      value: text ?? "",
      onValueChange: changeText,
      onCommit: commitOption,
      onSubmit: submit,
      placeholder,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      inputStyle,
      listStyle,
      options: matches,
      onDismiss: dismiss,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
      <Input
        value={text ?? ""}
        onValueChange={changeText}
        onSubmitEditing={submit}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        style={inputStyle}
      />
      <Pressable
        role="button"
        aria-expanded={expanded}
        aria-disabled={disabled || undefined}
        aria-label={expanded ? "Hide suggestions" : "Show suggestions"}
        disabled={disabled}
        onPress={toggle}
      >
        <Text style={inputStyle}>
          {expanded ? "Hide suggestions" : "Show suggestions"}
        </Text>
      </Pressable>
      {expanded ? (
        <Pressable
          aria-label="Dismiss"
          testID={testID ? `${testID}-scrim` : undefined}
          disabled={disabled}
          onPress={dismiss}
        />
      ) : null}
      {expanded ? (
        <View style={listStyle}>
          {matches.map((option, index) => (
            <Pressable
              // biome-ignore lint/suspicious/noArrayIndexKey: duplicate option strings need positional disambiguation.
              key={`${option}-${index}`}
              role="button"
              aria-disabled={disabled || undefined}
              aria-label={option}
              disabled={disabled}
              onPress={() => commitOption(option)}
            >
              <Text>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
