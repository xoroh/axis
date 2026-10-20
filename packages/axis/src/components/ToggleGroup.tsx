import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useMemo,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * ToggleGroup — an unstyled pressed-item group.
 *
 * Structure only: a `View` carrying the group role, with `Toggle`
 * pressables (each with a `value`) carrying the button role and
 * pressed state. No default visuals — every visual value (`style`) is
 * caller-provided. State follows the `useControllableState` pattern:
 * `value` (+ `onValueChange`) for controlled use, `defaultValue` for
 * uncontrolled. `multiple` (default `false`, the Base UI default)
 * selects the cardinality: single-press replaces, multi-press
 * toggles membership; activating a pressed item always removes it,
 * per the selection-model rule. `orientation` (default
 * `"horizontal"`) is structural documentation: it selects the
 * container's `flexDirection` as a base the caller style overrides.
 *
 * ADR-112 aria-only: the group carries `role="group"`, `aria-orientation`,
 * and caller `aria-label` / `aria-labelledby`. Never emit legacy RN a11y props (ADR-112 aria-only: role and aria-* only).
 */

export type ToggleGroupState = {
  /** Currently pressed item keys. */
  value: readonly string[];
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /**
   * When `false` only one item can be pressed (activating an
   * unpressed item replaces the pressed one). Default `false`.
   */
  multiple: boolean;
  /** Reading order of the grouped items. Default `"horizontal"`. */
  orientation: "horizontal" | "vertical";
};

export type ToggleGroupProps = {
  /** Controlled pressed set. Wins over `defaultValue` when defined. */
  value?: readonly string[];
  /** Uncontrolled initial pressed set. Default `[]`. */
  defaultValue?: readonly string[];
  /** Fires with the next pressed set on every committed change. */
  onValueChange?: (value: readonly string[]) => void;
  /** Group-wide disabled terminal: disables every joined item. */
  disabled?: boolean;
  /**
   * Whether multiple items can be pressed simultaneously. Default
   * `false` (single-press replaces).
   */
  multiple?: boolean;
  /**
   * Visual and traversal reading order. Sets the default
   * `flexDirection` (`row` for horizontal, `column` for vertical).
   * Default `"horizontal"`.
   */
  orientation?: "horizontal" | "vertical";
  /** Accessible name source (ADR-112). */
  "aria-label"?: string;
  /** Native labelled-by association where the platform supports it (ADR-112). */
  "aria-labelledby"?: string;
  testID?: string;
  /** Value or function of group state, caller-provided. */
  style?: StateStyle<ToggleGroupState, StyleProp<ViewStyle>>;
  /** Group items composed by the caller. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToggleGroupState, SlotProps>;
  /** Forwarded to the container View host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type ToggleGroupPressed = {
  pressedValues: readonly string[];
  groupDisabled: boolean;
  toggle: (itemValue: string) => void;
};

export const ToggleGroupPressedContext =
  createContext<ToggleGroupPressed | null>(null);

function assignRef(
  ref: ToggleGroupProps["ref"],
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
      // A frozen ref object cannot take the write
    }
  }
}

export function ToggleGroup({
  value,
  defaultValue = [],
  onValueChange,
  disabled = false,
  multiple = false,
  orientation = "horizontal",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  testID,
  style,
  children,
  render,
  ref,
}: ToggleGroupProps): React.ReactNode {
  const [pressedValues, setPressedValues] = useControllableState<
    readonly string[]
  >(value, defaultValue, onValueChange);

  const toggle = useCallback(
    (itemValue: string) => {
      setPressedValues((previous = []) => {
        const has = previous.includes(itemValue);
        if (multiple) {
          return has
            ? previous.filter((v) => v !== itemValue)
            : [...previous, itemValue];
        }
        return has ? [] : [itemValue];
      });
    },
    [multiple, setPressedValues],
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const pressed = useMemo<ToggleGroupPressed>(
    () => ({
      pressedValues: pressedValues ?? [],
      groupDisabled: disabled,
      toggle,
    }),
    [pressedValues, disabled, toggle],
  );

  const state: ToggleGroupState = {
    value: pressedValues ?? [],
    disabled,
    multiple,
    orientation,
  };
  const baseDirection = {
    flexDirection: orientation === "vertical" ? "column" : "row",
  } as const;

  const hostProps = {
    accessible: true,
    role: "group" as const,
    "aria-orientation": orientation,
    ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}),
    ...(ariaLabelledBy !== undefined
      ? { "aria-labelledby": ariaLabelledBy }
      : {}),
    testID,
    style: [baseDirection, resolveStyle(style, state)],
    children,
    ref: setHostRef,
  } satisfies SlotProps;

  const substituted = resolveRender(render, hostProps, state);
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setHostRef}
      accessible
      role="group"
      aria-orientation={orientation}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(ariaLabelledBy !== undefined
        ? { "aria-labelledby": ariaLabelledBy }
        : {})}
      testID={testID}
      style={[baseDirection, resolveStyle(style, state)]}
    >
      <ToggleGroupPressedContext.Provider value={pressed}>
        {children}
      </ToggleGroupPressedContext.Provider>
    </View>
  );
}

export const ToggleGroupRoot = ToggleGroup;
