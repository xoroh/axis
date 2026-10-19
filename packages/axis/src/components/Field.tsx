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
 * FieldRoot — an unstyled field container with parts.
 *
 * Structure only: the caller-provided control (`children`) with
 * `FieldLabel`/`FieldControl`/`FieldDescription`/`FieldError`
 * composed inside. No validation logic lives here — validity is the
 * caller's state, expressed by passing `invalid` (Base UI
 * `Field.Root` parity). Control-id wiring beyond plain composition
 * is deferred until a consumer demonstrates the need.
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
  /**
   * Whether the field is currently invalid. Caller-owned validity
   * state (Base UI `Field.Root` parity): `FieldError` mounts only
   * while `true`. Default `false`.
   */
  invalid?: boolean;
  /** The control element (`FieldLabel`/`FieldControl`/`FieldError` composed inside). */
  children?: ReactNode;
  testID?: string;
  /** Container style: value or function of field state. */
  style?: StateStyle<FieldRootState, StyleProp<ViewStyle>>;
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
  invalid = false,
  children,
  testID,
  style,
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

  const state: FieldRootState = { invalid };
  const disclosure: FieldDisclosure = { invalid };
  const substituted = resolveRender(
    render,
    {
      testID,
      style: resolveStyle(style, state),
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
        {children}
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
