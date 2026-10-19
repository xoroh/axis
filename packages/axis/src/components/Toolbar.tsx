import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
} from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  TextInput,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";

/**
 * ToolbarRoot — an unstyled container grouping a set of controls
 * (`ToolbarButton`, `ToolbarLink`, `ToolbarGroup`, `ToolbarInput`,
 * `ToolbarSeparator`).
 *
 * Structure only: a `View` carrying the toolbar role, rendering
 * caller-provided controls (`children`). No default visuals — every
 * visual value (`style`) is caller-provided. `orientation` is
 * structural documentation: it selects the container's `flexDirection`
 * (`row` for `"horizontal"`, `column` for `"vertical"`) as a base the
 * caller style overrides, and records the reading order future focus
 * management must follow.
 *
 * No roving keyboard traversal in v1 (deferred with rationale):
 * single tab-stop management belongs to the `roving` model, whose
 * transfer gate has no approved consumer yet, and React Native moves
 * accessibility focus by traversal rather than DOM tab order — there
 * is no arrow-key layer to wire until that model is adopted. `disabled`
 * is observational only (see the prop docs): the container declares no
 * press handling, so there is nothing for it to block.
 */

export type ToolbarRootState = {
  /** Observational disabled flag announced on the container. */
  disabled: boolean;
  /** Reading order of the grouped controls. */
  orientation: "horizontal" | "vertical";
};

export type ToolbarButtonState = {
  /** Whether the button is currently disabled. */
  disabled: boolean;
  /** Reading order of the toolbar. */
  orientation: "horizontal" | "vertical";
};

export type ToolbarLinkState = {
  /** Whether the link is currently disabled. */
  disabled: boolean;
  /** Reading order of the toolbar. */
  orientation: "horizontal" | "vertical";
};

export type ToolbarGroupState = {
  /** Whether the group is currently disabled. */
  disabled: boolean;
  /** Reading order of the toolbar. */
  orientation: "horizontal" | "vertical";
};

export type ToolbarInputState = {
  /** Whether the input is currently disabled. */
  disabled: boolean;
  /** Reading order of the toolbar. */
  orientation: "horizontal" | "vertical";
};

export type ToolbarSeparatorState = {
  /** The orientation of the separator (perpendicular to the toolbar by default). */
  orientation: "horizontal" | "vertical";
};

export type ToolbarButtonProps = {
  /** Button content. */
  children?: ReactNode;
  /** Fires on activation. */
  onPress?: () => void;
  /** Terminal: it never activates and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of button state, caller-provided. */
  style?: StateStyle<ToolbarButtonState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToolbarButtonState, SlotProps>;
  /** Forwarded to the button pressable host element. */
  ref?: Ref<ElementRef<typeof Pressable>>;
};

export type ToolbarLinkProps = {
  /** Link content. */
  children?: ReactNode;
  /** Fires on activation. */
  onPress?: () => void;
  /** Terminal: it never activates and is announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Value or function of link state, caller-provided. */
  style?: StateStyle<ToolbarLinkState, StyleProp<TextStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToolbarLinkState, SlotProps>;
};

export type ToolbarGroupProps = {
  /** Grouped toolbar items. */
  children: ReactNode;
  /** Terminal for the group: announced as disabled. */
  disabled?: boolean;
  /** Accessible name source for the group. */
  accessibilityLabel?: string;
  testID?: string;
  /** Group view style: value or function of group state. */
  style?: StateStyle<ToolbarGroupState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToolbarGroupState, SlotProps>;
  /** Forwarded to the group `View` host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type ToolbarInputProps = {
  /** Controlled value. Wins over `defaultValue` when defined. */
  value?: string;
  /** Uncontrolled initial value. Default `""`. */
  defaultValue?: string;
  /** Fires with the next value on every committed change. */
  onValueChange?: (value: string) => void;
  /** Placeholder text shown while empty. */
  placeholder?: string;
  /** Terminal: no edits, no callbacks, announced as disabled. */
  disabled?: boolean;
  /** Accessible name source. */
  accessibilityLabel?: string;
  testID?: string;
  /** Input style: value or function of input state, caller-provided. */
  style?: StateStyle<ToolbarInputState, StyleProp<TextStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`. Replaces the `TextInput` host.
   */
  render?: RenderProp<ToolbarInputState, SlotProps>;
  /** Forwarded to the `TextInput` host element. */
  ref?: Ref<ElementRef<typeof TextInput>>;
};

export type ToolbarSeparatorProps = {
  /**
   * Separator orientation. Default: perpendicular to the toolbar
   * (`"vertical"` in a horizontal bar, `"horizontal"` in a vertical
   * one).
   */
  orientation?: "horizontal" | "vertical";
  testID?: string;
  /** Separator style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity). The separator
   * carries only orientation state.
   */
  render?: RenderProp<ToolbarSeparatorState, SlotProps>;
};

export type ToolbarRootProps = {
  /**
   * Reading order of the grouped controls. Default `"horizontal"`.
   * Applied structurally as the container `flexDirection` (`row` /
   * `column`); the caller `style` merges over it and wins on conflict.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Observational only: announced on the container via
   * `accessibilityState`, never forwarded to children and blocking
   * nothing — the container itself is not interactive. Each grouped
   * control owns its own `disabled` state.
   */
  disabled?: boolean;
  /** Accessible name source for the group. */
  accessibilityLabel?: string;
  testID?: string;
  /** Root view style: value or function of toolbar state. Merges over the orientation base direction. */
  style?: StateStyle<ToolbarRootState, StyleProp<ViewStyle>>;
  /** Grouped controls rendered inside the container. Required. */
  children: ReactNode;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<ToolbarRootState, SlotProps>;
  /** Forwarded to the root view host element. */
  ref?: Ref<ElementRef<typeof View>>;
};

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
type ToolbarDisclosure = {
  orientation: "horizontal" | "vertical";
  disabled: boolean;
};

/**
 * Shared toolbar state for the parts. Internal to this module (not
 * exported): parts read orientation (and the observational root
 * `disabled`) from it; outside a root they use horizontal order and
 * their own `disabled`.
 */
const ToolbarDisclosureContext = createContext<ToolbarDisclosure | null>(null);

function useToolbarPartState(disabled: boolean): ToolbarDisclosure {
  const disclosure = useContext(ToolbarDisclosureContext);
  return {
    orientation: disclosure?.orientation ?? "horizontal",
    disabled: disabled || (disclosure?.disabled ?? false),
  };
}

function assignRef(
  ref: ToolbarRootProps["ref"],
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

export function ToolbarRoot({
  orientation = "horizontal",
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  children,
  render,
  ref,
}: ToolbarRootProps): React.ReactNode {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: ToolbarRootState = { disabled, orientation };
  const disclosure: ToolbarDisclosure = { orientation, disabled };
  const baseDirection = {
    flexDirection: orientation === "vertical" ? "column" : "row",
  } as const;
  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "toolbar",
      accessibilityState: { disabled },
      accessibilityLabel,
      testID,
      style: [baseDirection, resolveStyle(style, state)],
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) {
    return (
      <ToolbarDisclosureContext.Provider value={disclosure}>
        {substituted}
      </ToolbarDisclosureContext.Provider>
    );
  }

  return (
    <ToolbarDisclosureContext.Provider value={disclosure}>
      <View
        ref={setHostRef}
        accessibilityRole="toolbar"
        accessibilityState={{ disabled }}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[baseDirection, resolveStyle(style, state)]}
      >
        {children}
      </View>
    </ToolbarDisclosureContext.Provider>
  );
}

export function ToolbarButton({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: ToolbarButtonProps): React.ReactNode {
  const { orientation, disabled: effectiveDisabled } =
    useToolbarPartState(disabled);
  const state: ToolbarButtonState = {
    disabled: effectiveDisabled,
    orientation,
  };

  const pressButton = useCallback(() => {
    if (effectiveDisabled) return;
    onPress?.();
  }, [effectiveDisabled, onPress]);

  const setButtonRef = useCallback(
    (node: ElementRef<typeof Pressable> | null) => {
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
      accessibilityRole: "button",
      accessibilityState: { disabled: effectiveDisabled },
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled,
      onPress: pressButton,
      style: resolveStyle(style, state),
      children,
      ref: setButtonRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Pressable
      ref={setButtonRef}
      accessibilityRole="button"
      accessibilityState={{ disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={pressButton}
      style={resolveStyle(style, state)}
    >
      {children}
    </Pressable>
  );
}

export function ToolbarLink({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  render,
}: ToolbarLinkProps): React.ReactNode {
  const { orientation, disabled: effectiveDisabled } =
    useToolbarPartState(disabled);
  const state: ToolbarLinkState = {
    disabled: effectiveDisabled,
    orientation,
  };

  const pressLink = useCallback(() => {
    if (effectiveDisabled) return;
    onPress?.();
  }, [effectiveDisabled, onPress]);

  const substituted = resolveRender(
    render,
    {
      accessibilityRole: "link",
      accessibilityState: { disabled: effectiveDisabled },
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled,
      onPress: pressLink,
      style: resolveStyle(style, state),
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <Text
      accessibilityRole="link"
      accessibilityState={{ disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      disabled={effectiveDisabled}
      onPress={pressLink}
      style={resolveStyle(style, state)}
    >
      {children}
    </Text>
  );
}

export function ToolbarGroup({
  children,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: ToolbarGroupProps): React.ReactNode {
  const { orientation, disabled: effectiveDisabled } =
    useToolbarPartState(disabled);
  const state: ToolbarGroupState = {
    disabled: effectiveDisabled,
    orientation,
  };

  const setGroupRef = useCallback(
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
      accessibilityRole: "toolbar",
      accessibilityState: { disabled: effectiveDisabled },
      accessibilityLabel,
      testID,
      style: resolveStyle(style, state),
      children,
      ref: setGroupRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <View
      ref={setGroupRef}
      accessibilityRole="toolbar"
      accessibilityState={{ disabled: effectiveDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={resolveStyle(style, state)}
    >
      {children}
    </View>
  );
}

export function ToolbarInput({
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  render,
  ref,
}: ToolbarInputProps): React.ReactNode {
  const { orientation, disabled: effectiveDisabled } =
    useToolbarPartState(disabled);
  const [current, setCurrent] = useControllableState<string>(
    value,
    defaultValue,
    onValueChange,
  );
  const state: ToolbarInputState = {
    disabled: effectiveDisabled,
    orientation,
  };

  const substituted = resolveRender(
    render,
    {
      accessibilityLabel,
      testID,
      disabled: effectiveDisabled,
      editable: !effectiveDisabled,
      value: current ?? "",
      placeholder,
      onChangeText: setCurrent,
      style: resolveStyle(style, state),
      ref,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  return (
    <TextInput
      ref={ref}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      editable={!effectiveDisabled}
      value={current ?? ""}
      placeholder={placeholder}
      onChangeText={setCurrent}
      style={resolveStyle(style, state)}
    />
  );
}

export function ToolbarSeparator({
  orientation,
  testID,
  style,
  render,
}: ToolbarSeparatorProps): React.ReactNode {
  const disclosure = useContext(ToolbarDisclosureContext);
  const toolbarOrientation = disclosure?.orientation ?? "horizontal";
  // Perpendicular to the toolbar by default (the Base UI rule).
  const resolved =
    orientation ??
    (toolbarOrientation === "horizontal" ? "vertical" : "horizontal");
  const state: ToolbarSeparatorState = { orientation: resolved };
  const substituted = resolveRender(
    render,
    { testID, style, children: undefined } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return <View testID={testID} style={style} />;
}
