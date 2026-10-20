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
 * Switch — an unstyled binary toggle built on a disclosure pattern.
 *
 * Compound anatomy:
 *
 *   <SwitchRoot>
 *     <SwitchThumb />
 *   </SwitchRoot>
 *
 * Structure only: a `Pressable` host element with the `switch` role and
 * state (`checked`, `disabled`), carrying a thumb `View` whose position
 * and styling are caller-controlled via state-driven styles. No default
 * track dimensions, thumb sizes, or colors are imposed — every visual
 * value is caller-provided. State follows the `useControllableState`
 * pattern: `checked` (+ `onCheckedChange`) for controlled use,
 * `defaultChecked` for uncontrolled.
 *
 * ADR-112 aria-only: the root part sets accessibility state, role, and
 * value ONLY through `aria-*` props and `role` (`role="switch"`,
 * `aria-checked`, `aria-disabled`, `aria-valuetext`). Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 *
 * Compound export (Base UI parity): `SwitchRoot` and `SwitchThumb` are
 * exported standalone and as `Switch.Root` / `Switch.Thumb`.
 */

export type SwitchRootState = {
  /** Current state of the switch. */
  checked: boolean;
  /** Whether the switch is disabled. */
  disabled: boolean;
  /** Whether the switch is read-only. */
  readOnly: boolean;
};

export type SwitchThumbState = SwitchRootState;

export type SwitchDisclosure = {
  checked: boolean;
  disabled: boolean;
  readOnly: boolean;
};

export const SwitchDisclosureContext =
  createContext<SwitchDisclosure | null>(null);

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
   * announces disabled).
   */
  readOnly?: boolean;
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  /**
   * Value text announcement (controls-D11, ADR-112). Defaults to "on"
   * when checked and "off" when unchecked.
   */
  "aria-valuetext"?: string;
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
 * tested composition until its transfer gate passes.
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

export function SwitchRoot({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  readOnly = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-valuetext": ariaValueText,
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

  const setHostRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const isChecked = on ?? false;
  const state: SwitchRootState = {
    checked: isChecked,
    disabled,
    readOnly,
  };
  const disclosure: SwitchDisclosure = {
    checked: isChecked,
    disabled,
    readOnly,
  };

  const valueText = ariaValueText ?? (isChecked ? "on" : "off");

  const hostProps = {
    role: "switch" as const,
    "aria-checked": isChecked,
    "aria-disabled": disabled,
    "aria-valuetext": valueText,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {}),
    testID,
    disabled,
    onPress: toggle,
    style: resolveStyle(style, state),
    ref: setHostRef,
  } satisfies SlotProps;

  const substituted = resolveRender(render, hostProps, state);
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
        role="switch"
        aria-checked={isChecked}
        aria-disabled={disabled}
        aria-valuetext={valueText}
        {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
        {...(ariaLabelledBy !== undefined ? { "aria-labelledby": ariaLabelledBy } : {})}
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

export type SwitchThumbProps = {
  testID?: string;
  style?: StateStyle<SwitchThumbState, StyleProp<ViewStyle>>;
  children?: ReactNode;
  render?: RenderProp<SwitchThumbState, SlotProps>;
  ref?: Ref<ElementRef<typeof View>>;
};

export function SwitchThumb({
  testID,
  style,
  children,
  render,
  ref,
}: SwitchThumbProps): React.ReactNode {
  const disclosure = useContext(SwitchDisclosureContext);
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
          // A frozen ref object cannot take the write
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

export const Switch = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Thumb: SwitchThumb,
});
