import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
} from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * SwitchRoot — an unstyled on/off control with a thumb part.
 *
 * Structure only: a `Pressable` row carrying the switch role and
 * state. No default visuals — every visual value (`style`) is
 * caller-provided; the track is caller composition (a plain `View`)
 * and the thumb is the `SwitchThumb` part, which reads root state
 * for function styles. State follows the
 * `useControllableState` pattern with Base UI names: `checked` (+
 * `onCheckedChange`) for controlled use, `defaultChecked` for
 * uncontrolled.
 *
 * One clean current API (owner no-compat rule): no aliases, no
 * warn-once shims. Nothing was published, so there is nobody to
 * migrate.
 */

export type SwitchRootState = {
  /** Whether the switch is currently on. */
  checked: boolean;
  /** Whether the switch is currently disabled. */
  disabled: boolean;
  /**
   * Whether the switch is read-only. Default `false`. Focusable
   * and announced like an enabled switch, but presses do not change
   * state (distinct from `disabled` — React Native maps no readonly
   * key, so the announcement is the normal switch state).
   */
  readOnly: boolean;
};

export type SwitchThumbState = {
  /** Whether the switch is currently on. */
  checked: boolean;
  /** Whether the switch is currently disabled. */
  disabled: boolean;
  /** Whether the switch is read-only (presses do not change state). */
  readOnly: boolean;
};

export type SwitchThumbProps = {
  testID?: string;
  /** Thumb style: value or function of thumb state, caller-provided. */
  style?: StateStyle<SwitchThumbState, StyleProp<ViewStyle>>;
  /** Thumb content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<SwitchThumbState, SlotProps>;
  /** Forwarded to the thumb `View` host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type SwitchRootProps = {
  /** Controlled state. Wins over `defaultChecked` when defined. */
  checked?: boolean;
  /** Uncontrolled initial state. Default `false`. */
  defaultChecked?: boolean;
  /** Fires with the next state on every committed toggle. */
  onCheckedChange?: (checked: boolean) => void;
  /** Terminal: no transitions, no callbacks, announced as disabled. */
  disabled?: boolean;
  /**
   * Read-only: focusable and announced like an enabled switch, but
   * presses do not change state and no callbacks fire. Default
   * `false`. Distinct from `disabled` (which blocks interaction and
   * announces disabled) — React Native maps no readonly key, so the
   * announcement is the normal switch state.
   */
  readOnly?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  /** Native labelled-by association where the platform supports it. */
  accessibilityLabelledBy?: string;
  testID?: string;
  /** Value or function of switch state, caller-provided. */
  style?: StateStyle<SwitchRootState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<SwitchRootState, SlotProps>;
  /** Switch content (`SwitchThumb`, optionally inside a caller
   * track `View`) composed by the caller. */
  children?: ReactNode;
  /** Forwarded to the root pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: SwitchRootProps["ref"],
  value: ElementRef<typeof Pressable> | null,
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

type SwitchDisclosure = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
};

/**
 * Shared switch state for the thumb. Internal to this module (not
 * exported): the thumb reads it to style from; outside a root it
 * renders a plain `View` with default (off/enabled) state.
 */
const SwitchDisclosureContext = createContext<SwitchDisclosure | null>(null);

export function SwitchRoot({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  readOnly = false,
  accessibilityLabel,
  accessibilityLabelledBy,
  testID,
  style,
  render,
  ref,
  children,
}: SwitchRootProps): React.ReactNode {
  const [on, setOn] = useControllableState<boolean>(
    checked,
    defaultChecked,
    onCheckedChange,
  );

  const toggle = useCallback(() => {
    if (disabled || readOnly) return;
    setOn((previous) => !(previous ?? false));
  }, [disabled, readOnly, setOn]);

  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: SwitchRootState = {
    checked: on ?? false,
    disabled,
    readOnly,
  };
  const disclosure: SwitchDisclosure = {
    checked: on ?? false,
    disabled,
    readOnly,
  };
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "switch",
      accessibilityState: { checked: on ?? false, disabled },
      accessibilityLabel,
      accessibilityLabelledBy,
      testID,
      disabled,
      onPress: toggle,
      style: resolveStyle(style, state),
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) {
    return (
      <SwitchDisclosureContext.Provider value={disclosure}>
        {substituted}
      </SwitchDisclosureContext.Provider>
    );
  }

  return (
    <SwitchDisclosureContext.Provider value={disclosure}>
      <Pressable
        ref={setHostRef}
        accessibilityRole="switch"
        accessibilityState={{ checked: on ?? false, disabled }}
        accessibilityLabel={accessibilityLabel}
        accessibilityLabelledBy={accessibilityLabelledBy}
        testID={testID}
        disabled={disabled}
        onPress={toggle}
        style={resolveStyle(style, state)}
      >
        {children}
      </Pressable>
    </SwitchDisclosureContext.Provider>
  );
}

export function SwitchThumb({
  testID,
  style,
  children,
  render,
  ref,
}: SwitchThumbProps): React.ReactNode {
  const disclosure = useContext(SwitchDisclosureContext);
  // Outside a root there is no switch state to style from: render a
  // plain `View` rather than dropping the node silently.
  const state: SwitchThumbState = {
    checked: disclosure?.checked ?? false,
    disabled: disclosure?.disabled ?? false,
    readOnly: disclosure?.readOnly ?? false,
  };

  const setThumbRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      if (ref && typeof ref === "object" && "current" in ref) {
        try {
          (ref as { current: unknown }).current = node;
        } catch {
          // A frozen ref object cannot take the write — leave it
          // alone rather than failing the render over it.
        }
      }
    },
    [ref],
  );

  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setThumbRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View ref={setThumbRef} testID={testID} style={resolveStyle(style, state)}>
      {children}
    </View>
  );
}
