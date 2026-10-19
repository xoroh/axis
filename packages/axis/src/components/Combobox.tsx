import {
  type ElementRef,
  type Ref,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { defaultCollectionMatch } from "../collection";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { Input } from "./Input";
import { Portal } from "./Portal";
import { useFloatingPlacement } from "./useFloatingPlacement";

/**
 * Combobox — a filterable single-select (Select + text entry).
 *
 * Structure only: an Axis `Input` entry showing the query, a chevron
 * toggle `Pressable` beside it, and — when open — a positioned list of
 * option pressables derived from the `options` data prop (options are
 * data, not children: unlike `Select`, there is no `ComboboxItem`
 * part). No default visuals — every visual value (`style`,
 * `listStyle`, `inputStyle`) is caller-provided. Value state follows
 * the `useControllableState` pattern: `value` (+ `onValueChange`) for
 * controlled use, `defaultValue` for uncontrolled (`null` means empty).
 * Open state is a SEPARATE `useControllableState` pair: `open` (+
 * `onOpenChange`) controlled, `defaultOpen` uncontrolled (default
 * `false`). The query is plain local `useState`, initialized from the
 * selected option's label and reset to the selected label on close
 * without selection (scrim dismiss or toggle-close); choosing an
 * option sets the query to its label.
 *
 * Composition choice (deliberate, not oversight): the list opens via
 * the explicit chevron toggle (`"Show options"`/`"Hide options"`
 * labels) and automatically on text change. The Axis `Input` is kept
 * minimal deliberately — it exposes no focus API — so there is no
 * focus-driven open; entry-press opening is impossible for the same
 * reason (a `TextInput` is not pressable, and wrapping it in a
 * `Pressable` would swallow focus/typing). The toggle is therefore
 * the explicit open control, with first-text-change auto-open as the
 * typing path.
 *
 * Filtering is the shared `collection` default match
 * (case-insensitive substring on `label`, trimmed); a custom
 * `filter` prop is NOT supported in v1 (deferred until a
 * consumer needs ranked/fuzzy matching). An empty result renders the
 * list container with zero items — no `"no results"` chrome, caller
 * content only. Choosing an option always closes the list and commits
 * (`setSelectedValue` + `setOpen(false)`); re-selecting the selected
 * value keeps it (never deselects to `null`), per the
 * selection-model rule — the hook's identity guard additionally
 * suppresses a repeat `onValueChange` for the same value. Scrim press
 * closes without selecting and resets the query (the Dialog scrim
 * precedent: a `Pressable` labelled `"Dismiss"`).
 *
 * The list is positioned with `useFloatingPlacement` (anchor
 * `measure()` + viewport + `resolveFloatingRect`); until measured it
 * stays transparent at origin rather than flashing somewhere wrong
 * (the Tooltip precedent). Unlike Dialog there is no `Modal`: the
 * scrim and the list present through `Portal` at the app's
 * `PortalHost` — above sibling content, never trapped in the anchor's
 * box.
 *
 * Accessibility: the entry `Input` carries `accessibilityLabel` when
 * given; the toggle carries `accessibilityRole="button"` with
 * `accessibilityState { expanded, disabled }` and the fixed labels
 * `"Show options"`/`"Hide options"` (used as both visible text and
 * accessible name — a `Pressable` without label content is useless,
 * the NumberField stepper precedent); the list is an accessibility
 * element with `accessibilityRole="listbox"`; each option carries
 * `role="option"` with `accessibilityState { selected, disabled }`.
 * Role provenance, verified against the RN 0.87 generated types
 * (`types_generated/Libraries/Components/View/ViewAccessibility.d.ts`):
 * the native `AccessibilityRole` union has no `option`/`listbox`
 * keys, so the option uses the web `Role` prop (which DOES include
 * `option`) — the Dialog `role="dialog"` precedent — while the list
 * uses `accessibilityRole="listbox"`, which typechecks through that
 * union's `| string` tail. `listbox` is absent from the web `Role`
 * union too, so `role="listbox"` would NOT typecheck. Both props are
 * read by the RN test renderer's role queries.
 *
 * Deferred, each for a named reason (not oversight):
 * - No multi-select — single value only.
 * - No async loading — `options` are synchronous data.
 * - No animation: the list mounts/unmounts synchronously with open
 *   state (the Accordion panel precedent).
 * - No keyboard traversal: the `roving`/`collection` models are not
 *   adopted by Combobox's section.
 *
 * Test ids: the entry `Input` carries `testID`; the toggle carries
 * `<testID>-toggle`; the scrim carries `<testID>-scrim`; each option
 * carries `<testID>-option-<value>` (the Accordion `-panel`
 * precedent). All are omitted when `testID` is omitted.
 */

export type ComboboxState = {
  /** Currently selected option value (`null` for none). */
  value: string | null;
  /** Whether the list is currently open. */
  open: boolean;
  /** Whether the whole combobox is disabled. */
  disabled: boolean;
};

export type ComboboxProps = {
  /** Synchronous option data (required — options are data, not children). */
  options: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  /** Controlled selection (an option value, or `null` for none). Wins over `defaultValue` when defined. */
  value?: string | null;
  /** Uncontrolled initial selection. Default `null` (nothing selected, empty query). */
  defaultValue?: string | null;
  /** Fires with the chosen option value on every committed selection. */
  onValueChange?: (value: string) => void;
  /** Controlled open state. Wins over `defaultOpen` when defined. */
  open?: boolean;
  /** Uncontrolled initial open state. Default `false`. */
  defaultOpen?: boolean;
  /** Fires with the next open state on every committed open/close. */
  onOpenChange?: (open: boolean) => void;
  /** Shown in the entry when the query is empty. */
  placeholder?: string;
  /** Terminal: the entry never edits, the toggle never opens, options never select, no callbacks. Default `false`. */
  disabled?: boolean;
  /** Accessible name source for the entry input. */
  accessibilityLabel?: string;
  testID?: string;
  /** Entry row (input + toggle) box style: value or function of combobox state. */
  style?: StateStyle<ComboboxState, StyleProp<ViewStyle>>;
  /** Popup (listbox) box style, caller-provided. */
  listStyle?: StyleProp<ViewStyle>;
  /** Text-entry style, caller-provided. */
  inputStyle?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the anchor container (entry
   * row plus list); typing, toggle, and choose wiring travel in the
   * props.
   */
  render?: RenderProp<ComboboxState, SlotProps>;
  /** Forwarded to the root anchor view. */
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
  ref: ComboboxProps["ref"],
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

/**
 * Read the selected option's label back out of the data so the query
 * can show it. An unmatched value (or `null`) yields `""` (the empty
 * query shows every option and the placeholder shows).
 */
function labelFor(
  options: ComboboxProps["options"],
  value: string | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  return options.find((option) => option.value === value)?.label ?? "";
}

/** Anchor-relative scrim fill: structural layout, not a visual value. */
const scrimFillStyle: ViewStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

export function Combobox({
  options,
  value,
  defaultValue = null,
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  listStyle,
  inputStyle,
  render,
  ref,
}: ComboboxProps): React.ReactNode {
  // `onValueChange` takes a plain `string` while the state domain includes
  // `null` (nothing selected), so forward only committed selections —
  // `choose` below never offers `null`, the guard is type-level honesty
  // (the RadioGroup precedent).
  const handleValueChange = useCallback(
    (next: string | null) => {
      if (next !== null) {
        onValueChange?.(next);
      }
    },
    [onValueChange],
  );
  const [selectedValue, setSelectedValue] = useControllableState<string | null>(
    value,
    defaultValue,
    handleValueChange,
  );

  const [isOpen, setOpen] = useControllableState<boolean>(
    open,
    defaultOpen,
    onOpenChange,
  );

  const [query, setQuery] = useState(() =>
    labelFor(options, value !== undefined ? value : defaultValue),
  );

  const filtered = useMemo(() => {
    // Shared `collection` match (case-insensitive substring): the
    // same query filters identically here, in menu filtering, and
    // in select lookups. Options are data, so they filter directly
    // without registering into a collection registry.
    return options.filter((option) =>
      defaultCollectionMatch(query, option.label),
    );
  }, [options, query]);

  const choose = useCallback(
    (next: string) => {
      if (disabled) return;
      const target = options.find((option) => option.value === next);
      if (target === undefined || target.disabled) return;
      // Re-selecting the selected value keeps it: the hook's identity
      // guard suppresses the repeat callback, but the close below
      // still commits (the selection-model rule).
      setSelectedValue(next);
      setQuery(target.label);
      setOpen(false);
    },
    [disabled, options, setOpen, setSelectedValue],
  );

  // Closing without a selection (scrim dismiss, toggle-close) restores
  // the query to the selected label so stale filter text never lingers
  // behind a closed list. Guarded on `disabled` (terminal: no state
  // transitions from a disabled control).
  const closeWithoutSelection = useCallback(() => {
    if (disabled) return;
    setQuery(labelFor(options, selectedValue));
    setOpen(false);
  }, [disabled, options, selectedValue, setOpen]);

  const toggle = useCallback(() => {
    if (disabled) return;
    if (isOpen ?? false) {
      closeWithoutSelection();
    } else {
      setOpen(true);
    }
  }, [closeWithoutSelection, disabled, isOpen, setOpen]);

  // Every text change opens the list (the hook's identity guard
  // suppresses a repeat `onOpenChange` when already open); the Axis
  // `Input` exposes no focus API, so typing is the open path alongside
  // the explicit toggle (documented above).
  const handleChangeText = useCallback(
    (text: string) => {
      if (disabled) return;
      setQuery(text);
      setOpen(true);
    },
    [disabled, setOpen],
  );

  const anchorHostRef = useRef<ElementRef<typeof View> | null>(null);
  const setAnchorRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      anchorHostRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  const floating = useFloatingPlacement({
    anchorRef: anchorHostRef,
    active: isOpen ?? false,
  });

  const toggleLabel = (isOpen ?? false) ? "Hide options" : "Show options";

  const state: ComboboxState = {
    value: selectedValue ?? null,
    open: isOpen ?? false,
    disabled,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      value: selectedValue ?? null,
      query,
      onQueryChange: handleChangeText,
      onChoose: choose,
      onToggle: toggle,
      onDismiss: closeWithoutSelection,
      placeholder,
      inputStyle,
      listStyle,
      options: filtered,
      ref: setAnchorRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setAnchorRef}>
      <View style={resolveStyle(style, state)}>
        <Input
          value={query}
          onValueChange={handleChangeText}
          placeholder={placeholder}
          editable={!disabled}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          style={inputStyle}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen ?? false, disabled }}
          accessibilityLabel={toggleLabel}
          testID={testID ? `${testID}-toggle` : undefined}
          disabled={disabled}
          onPress={toggle}
        >
          <Text>{toggleLabel}</Text>
        </Pressable>
      </View>
      {isOpen ? (
        <Portal>
          <Pressable
            accessibilityLabel="Dismiss"
            testID={testID ? `${testID}-scrim` : undefined}
            onPress={closeWithoutSelection}
            style={scrimFillStyle}
          />
        </Portal>
      ) : null}
      {isOpen ? (
        <Portal>
          <View
            // The list must be an accessibility element for its role to
            // reach assistive technology (and the `*ByRole` proofs): a
            // plain `View` is not one by default, unlike `Pressable`.
            accessible
            accessibilityRole="listbox"
            onLayout={floating.onContentLayout}
            style={[floating.style, listStyle]}
          >
            {filtered.map((option) => {
              const optionDisabled = disabled || option.disabled === true;
              return (
                <Pressable
                  key={option.value}
                  role="option"
                  accessibilityState={{
                    selected: selectedValue === option.value,
                    disabled: optionDisabled,
                  }}
                  accessibilityLabel={option.label}
                  testID={
                    testID ? `${testID}-option-${option.value}` : undefined
                  }
                  disabled={optionDisabled}
                  onPress={() => choose(option.value)}
                >
                  <Text>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Portal>
      ) : null}
    </View>
  );
}
