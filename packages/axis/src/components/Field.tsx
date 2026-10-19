import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
} from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";

/**
 * FieldRoot — an unstyled label/control/error row with parts.
 *
 * Structure only: an optional label `Text`, the caller-provided
 * control (`children`), and an optional error `Text` announced
 * politely when present. No validation logic lives here — validity
 * is the caller's state, expressed by passing `error`. Control-id
 * wiring beyond plain composition is deferred until a consumer
 * demonstrates the need.
 */

export type FieldRootState = {
  /** Whether an error is currently shown. */
  invalid: boolean;
};

export type FieldLabelProps = {
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Label content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): static text
   * carries no state, so the function form receives an empty state
   * object (the `DialogTitle` precedent).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type FieldControlProps = {
  testID?: string;
  /** Control wrapper style, caller-provided. */
  style?: StyleProp<ViewStyle>;
  /** The control element. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): the wrapper
   * carries no state, so the function form receives an empty state
   * object.
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type FieldDescriptionProps = {
  testID?: string;
  /** Description text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Description content. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): static text
   * carries no state, so the function form receives an empty state
   * object (the `DialogTitle` precedent).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type FieldErrorProps = {
  testID?: string;
  /** Error text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /** Error content; rendered only while the field is invalid. */
  children?: ReactNode;
  /**
   * Element or function substitution (Base UI parity): static text
   * carries no state, so the function form receives an empty state
   * object (the `DialogTitle` precedent).
   */
  render?: RenderProp<Record<string, never>, SlotProps>;
};

export type FieldRootProps = {
  /** Label content rendered above the control. */
  label?: ReactNode;
  /** The control element. */
  children?: ReactNode;
  /** Error content; rendered only when provided. */
  error?: ReactNode;
  testID?: string;
  /** Container style: value or function of field state. */
  style?: StateStyle<FieldRootState, StyleProp<ViewStyle>>;
  /** Label text style, caller-provided. */
  labelStyle?: StyleProp<TextStyle>;
  /** Error text style, caller-provided. */
  errorStyle?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the part props merged under its own; a function
   * receives `(props, state)`.
   */
  render?: RenderProp<FieldRootState, SlotProps>;
  /** Forwarded to the container `View` host element. */
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
  ref: FieldRootProps["ref"],
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

type FieldDisclosure = {
  invalid: boolean;
};

/**
 * Shared field state for the parts. Internal to this module (not
 * exported): `FieldError` reads it to gate on invalid; validity
 * wiring itself belongs to the Form/Field behaviour lane.
 */
const FieldDisclosureContext = createContext<FieldDisclosure | null>(null);

function FieldText({
  testID,
  style,
  children,
  render,
  liveRegion,
}: {
  testID?: string;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
  render?: RenderProp<Record<string, never>, SlotProps>;
  liveRegion?: "polite";
}): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <Text accessibilityLiveRegion={liveRegion} testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function FieldRoot({
  label,
  children,
  error,
  testID,
  style,
  labelStyle,
  errorStyle,
  render,
  ref,
}: FieldRootProps): React.ReactNode {
  // Stable identity so the host element is not detached and re-attached
  // on every render — the ref callback reads through `ref`, never
  // closing over render-scoped values besides it.
  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  const state: FieldRootState = { invalid: error !== undefined };
  const disclosure: FieldDisclosure = { invalid: error !== undefined };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
      label,
      labelStyle,
      error,
      errorStyle,
      children,
      ref: setHostRef,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) {
    return (
      <FieldDisclosureContext.Provider value={disclosure}>
        {substituted}
      </FieldDisclosureContext.Provider>
    );
  }

  return (
    <FieldDisclosureContext.Provider value={disclosure}>
      <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
        {label !== undefined ? <Text style={labelStyle}>{label}</Text> : null}
        {children}
        {error !== undefined ? (
          <Text accessibilityLiveRegion="polite" style={errorStyle}>
            {error}
          </Text>
        ) : null}
      </View>
    </FieldDisclosureContext.Provider>
  );
}

export function FieldLabel({
  testID,
  style,
  children,
  render,
}: FieldLabelProps): React.ReactNode {
  return (
    <FieldText testID={testID} style={style} render={render}>
      {children}
    </FieldText>
  );
}

export function FieldControl({
  testID,
  style,
  children,
  render,
}: FieldControlProps): React.ReactNode {
  const substituted = resolveRender(
    render,
    { testID, style, children } satisfies SlotProps,
    {},
  );
  if (substituted !== null) return substituted;
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

export function FieldDescription({
  testID,
  style,
  children,
  render,
}: FieldDescriptionProps): React.ReactNode {
  return (
    <FieldText testID={testID} style={style} render={render}>
      {children}
    </FieldText>
  );
}

export function FieldError({
  testID,
  style,
  children,
  render,
}: FieldErrorProps): React.ReactNode {
  const disclosure = useContext(FieldDisclosureContext);
  // Validity is caller state: the error shows only while the root is
  // invalid, and never outside a root (the `CheckboxIndicator`
  // precedent — full validity wiring belongs to the behaviour lane).
  if (!(disclosure?.invalid ?? false)) return null;
  return (
    <FieldText
      testID={testID}
      style={style}
      render={render}
      liveRegion="polite"
    >
      {children}
    </FieldText>
  );
}
