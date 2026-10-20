import {
  cloneElement,
  createContext,
  type ElementRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { isEmptyValue, normalizeFieldErrors } from "../form";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import { useControllableState } from "../useControllableState";
import { FormContext } from "./Form";
import { Input } from "./Input";

/**
 * Field — validation-aware label/control/error grouping, in Base UI
 * compound parts.
 *
 * `FieldRoot` owns the field state (`value` + `onValueChange` for
 * controlled use, `defaultValue` for uncontrolled) and validation:
 * `validate` (+ `validationMode`) with `invalid` / `dirty` / `touched`
 * state, `name`-keyed registration with the nearest `Form`, and label
 * / description association via auto-generated native ids. `FieldLabel`
 * names the control; `FieldControl` binds one value-holding child
 * (reporting changes, blur, and focus back to the root);
 * `FieldDescription` adds helper text; `FieldError` shows the message
 * while invalid; `FieldValidity` renders caller UI from the validity
 * state.
 *
 * Base UI names and semantics hold except where native has no
 * counterpart (each recorded, never silent):
 * - `FieldControl` takes no value props: there is no DOM to read, so
 *   the Root owns the single field value and the control reports into
 *   it. Display state stays in the caller's control; do not bind a
 *   second value onto a child of `FieldControl` — the Root wins.
 * - `Field.Item` is not ported: item/label/description grouping for
 *   checkbox and radio groups is never composed here (check the group
 *   components instead).
 * - `Field.Error match` is not ported: there is no DOM ValidityState
 *   on native, so errors match by presence, not by validity flag.
 * - External `valid` has no prop (computed from validation only);
 *   `actionsRef` has no counterpart (per-field validate travels
 *   through `Form.validate(name)`; field registration replaces it).
 * - `aria-invalid` does not exist in
 *   this React Native version, so invalidity is announced only through
 *   the error live region (the `Table` role-gap precedent). Label and
 *   description association uses `nativeID` /
 *   `aria-labelledby`; the description is additionally plain
 *   traversable text, since native labelled-by takes a single id.
 * - No `data-*` attributes (D1); state flows through `render`/`style`
 *   functions. No animation (Dialog precedent).
 */

export type FieldValidationMode = "onSubmit" | "onBlur" | "onChange";

export type FieldValidate = (
  value: unknown,
  formValues: Record<string, unknown>,
) =>
  | string
  | string[]
  | null
  | undefined
  | Promise<string | string[] | null | undefined>;

export type FieldState = {
  /** Current field value (reported by the control). */
  value: unknown;
  /** Terminal: no entry, no validation callbacks. */
  disabled: boolean;
  /** Read-only terminal (never announced as disabled). */
  readOnly: boolean;
  /** Whether the control has lost focus at least once. */
  touched: boolean;
  /** Whether the reported value has ever changed. */
  dirty: boolean;
  /** Validation outcome (`null` = never validated). */
  valid: boolean | null;
  /** Whether the field is currently invalid. */
  invalid: boolean;
  /** Whether the value is non-empty. */
  filled: boolean;
  /** Whether the control is currently focused. */
  focused: boolean;
};

export type FieldRootState = FieldState;

export type FieldRootProps = {
  /** Field name: the errors-map key and submit payload key. */
  name?: string;
  /** Controlled value. Wins over `defaultValue` when defined. */
  value?: unknown;
  /** Uncontrolled initial value. */
  defaultValue?: unknown;
  /** Fires with the next value on every reported change. */
  onValueChange?: (value: unknown) => void;
  /**
   * Custom validation. Return a message or messages when invalid;
   * nothing (or an empty array) when valid. May be async — submit
   * awaits every field (unlike the web, there is no native submit to
   * race).
   */
  validate?: FieldValidate;
  /**
   * When validation runs. A field-level value wins over the Form's.
   * Default `"onSubmit"` (validate on submit, then re-validate on
   * every change).
   */
  validationMode?: FieldValidationMode;
  /** Terminal: no entry, no validation callbacks. Default `false`. */
  disabled?: boolean;
  /** Read-only terminal: no entry, never announced as disabled. Default `false`. */
  readOnly?: boolean;
  /** Externally controlled invalid flag. Wins over computed state. */
  invalid?: boolean | null;
  /** Externally controlled dirty flag. Wins over computed state. */
  dirty?: boolean;
  /** Externally controlled touched flag. Wins over computed state. */
  touched?: boolean;
  testID?: string;
  /** Container style: value or function of field state. */
  style?: StateStyle<FieldState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity) for the root
   * host. A function receives `(props, state)`.
   */
  render?: RenderProp<FieldState, SlotProps>;
  /** Forwarded to the root host element. */
  ref?: Ref<ElementRef<typeof View>>;
  /** Field content (label, control, description, error, validity). */
  children?: ReactNode;
};

export type FieldLabelProps = {
  /** Label content. */
  children?: ReactNode;
  testID?: string;
  /** Label text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity). The native id
   * association stays on the part.
   */
  render?: RenderProp<FieldState, SlotProps>;
};

export type FieldControlProps = {
  /**
   * The value-holding child: an element (cloned with the control
   * props merged under its own) or a function receiving them.
   * Do not bind a second value onto the child — the Root owns the
   * field value. Omit entirely for a plain Axis `Input`.
   */
  children?: ReactNode | ((props: FieldControlChildProps) => ReactNode);
  testID?: string;
  /** Control style, merged under the child's own. */
  style?: StyleProp<ViewStyle>;
  /**
   * Element or function substitution (Base UI parity) for the whole
   * control. Receives the same control props as a function child.
   */
  render?: RenderProp<FieldState, SlotProps>;
};

export type FieldControlChildProps = {
  onValueChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  "aria-labelledby"?: string;
  editable?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export type FieldDescriptionProps = {
  /** Helper text. */
  children?: ReactNode;
  testID?: string;
  /** Description text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity). The native id
   * stays on the part.
   */
  render?: RenderProp<FieldState, SlotProps>;
};

export type FieldErrorProps = {
  /** Message shown while the field is invalid. */
  children?: ReactNode;
  testID?: string;
  /** Error text style, caller-provided. */
  style?: StyleProp<TextStyle>;
  /**
   * Element or function substitution (Base UI parity). Shown only
   * while the field is invalid.
   */
  render?: RenderProp<FieldState, SlotProps>;
};

export type FieldValidityState = {
  /** Current field value. */
  value: unknown;
  /** Effective error messages. */
  errors: string[];
  /** First error message, or `""`. */
  error: string;
  /** Initial value. */
  initialValue: unknown;
  /** Validation outcome (`null` = never validated). */
  valid: boolean | null;
  /** Whether the field is currently invalid. */
  invalid: boolean;
  /** Whether the control has lost focus at least once. */
  touched: boolean;
  /** Whether the reported value has ever changed. */
  dirty: boolean;
  /** Whether the value is non-empty. */
  filled: boolean;
  /** Whether the control is currently focused. */
  focused: boolean;
  /** Read-only terminal (never announced as disabled). */
  readOnly: boolean;
};

export type FieldValidityProps = {
  /** Rendered with the validity state. */
  children: (validity: FieldValidityState) => ReactNode;
};

/** Kept monolith props: `label` / control / `error` in one part. */

export type FieldRegistration = {
  name: string | undefined;
  getValue: () => unknown;
  validateField: (options?: { fromSubmit?: boolean }) => Promise<string[]>;
  clearField: () => void;
};

type FieldContextValue = {
  state: FieldState;
  errors: string[];
  initialValue: unknown;
  labelId: string;
  descriptionId: string;
  reportChange: (next: unknown) => void;
  reportBlur: () => void;
  reportFocus: () => void;
  validateField: (options?: { fromSubmit?: boolean }) => Promise<string[]>;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useField(message: string): FieldContextValue {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error(`${message} must be used under a FieldRoot.`);
  }
  return context;
}

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: Ref<ElementRef<typeof View>> | undefined,
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

export function FieldRoot({
  name,
  value,
  defaultValue,
  onValueChange,
  validate,
  validationMode,
  disabled = false,
  readOnly = false,
  invalid: invalidProp,
  dirty: dirtyProp,
  touched: touchedProp,
  testID,
  style,
  render,
  ref,
  children,
}: FieldRootProps): React.ReactNode {
  const terminal = disabled;

  const form = useContext(FormContext);
  const mode = validationMode ?? form?.formValidationMode ?? "onSubmit";
  const validateRef = useRef(validate);
  validateRef.current = validate;

  const [stored, setStored] = useControllableState<unknown>(
    value,
    defaultValue,
    onValueChange,
  );
  const current = stored ?? null;
  const initialRef = useRef<unknown>(defaultValue ?? null);
  const [touchedInner, setTouchedInner] = useState(false);
  const [dirtyInner, setDirtyInner] = useState(false);
  const [focused, setFocused] = useState(false);
  const [internalErrors, setInternalErrors] = useState<string[]>([]);
  const [validated, setValidated] = useState(false);
  const submittedRef = useRef(false);
  const validationSeq = useRef(0);
  const valueRef = useRef<unknown>(current);
  valueRef.current = current;

  const serverErrors = useMemo(
    () => form?.serverErrorFor(name) ?? [],
    [form, name],
  );
  const valid: boolean | null = validated ? internalErrors.length === 0 : null;
  const mergedErrors = useMemo(
    () => (serverErrors.length > 0 ? serverErrors : internalErrors),
    [internalErrors, serverErrors],
  );
  const invalid =
    invalidProp ?? (mergedErrors.length > 0 ? true : valid === false);
  const touched = touchedProp ?? touchedInner;
  const dirty = dirtyProp ?? dirtyInner;
  const filled = !isEmptyValue(current);

  const state: FieldState = useMemo(
    () => ({
      value: current ?? null,
      disabled,
      touched,
      dirty,
      valid,
      invalid,
      filled,
      focused,
      readOnly,
    }),
    [
      current,
      disabled,
      dirty,
      filled,
      focused,
      invalid,
      readOnly,
      touched,
      valid,
    ],
  );

  const validateField = useCallback(
    async (options?: { fromSubmit?: boolean }): Promise<string[]> => {
      if (terminal) return [];
      const seq = ++validationSeq.current;
      const formValues = form?.getFormValues() ?? {};
      let raw:
        | string
        | string[]
        | null
        | undefined
        | Promise<string | string[] | null | undefined>;
      try {
        raw = validateRef.current?.(valueRef.current, formValues);
      } catch {
        raw = null;
      }
      const resolved = await raw;
      const errors = normalizeFieldErrors(resolved ?? undefined);
      // A newer validation run supersedes this one — never apply stale
      // results over fresh state.
      if (seq !== validationSeq.current) return errors;
      setInternalErrors(errors);
      setValidated(true);
      if (options?.fromSubmit) submittedRef.current = true;
      return errors;
    },
    [form, terminal],
  );

  const clearField = useCallback(() => {
    validationSeq.current += 1;
    setInternalErrors([]);
    submittedRef.current = false;
  }, []);

  const reportChange = useCallback(
    (next: unknown) => {
      // Mirror synchronously: validation below reads the ref in the
      // same tick, before React has re-rendered.
      valueRef.current = next;
      setStored(next);
      setDirtyInner(true);
      if (
        mode === "onChange" ||
        (mode === "onSubmit" && submittedRef.current)
      ) {
        void validateField();
      }
    },
    [mode, setStored, validateField],
  );

  const reportBlur = useCallback(() => {
    setTouchedInner(true);
    setFocused(false);
    if (mode === "onBlur") {
      void validateField();
    }
  }, [mode, validateField]);

  const reportFocus = useCallback(() => {
    setFocused(true);
  }, []);

  // Register with the enclosing Form (submit collects values and runs
  // validation in mount order). Unregister on unmount or rename.
  useEffect(() => {
    if (!form) return undefined;
    return form.registerField({
      name,
      getValue: () => valueRef.current,
      validateField,
      clearField,
    });
  }, [clearField, form, name, validateField]);

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
  );

  // Auto-generated association ids (sanitized React id). The Label
  // carries `nativeID`; the control points back at it.
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fieldId = `axis-field-${reactId}`;
  const labelId = `${fieldId}-label`;
  const descriptionId = `${fieldId}-description`;

  const context = useMemo<FieldContextValue>(
    () => ({
      state,
      errors: mergedErrors,
      initialValue: initialRef.current,
      labelId,
      descriptionId,
      reportChange,
      reportBlur,
      reportFocus,
      validateField,
    }),
    [
      descriptionId,
      labelId,
      mergedErrors,
      reportBlur,
      reportChange,
      reportFocus,
      state,
      validateField,
    ],
  );

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
      <FieldContext.Provider value={context}>
        {substituted}
      </FieldContext.Provider>
    );
  }

  return (
    <FieldContext.Provider value={context}>
      <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
        {children}
      </View>
    </FieldContext.Provider>
  );
}

export function FieldLabel({
  children,
  testID,
  style,
  render,
}: FieldLabelProps): React.ReactNode {
  const { state, labelId } = useField("FieldLabel");
  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      nativeID: labelId,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <Text nativeID={labelId} testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function FieldControl({
  children,
  testID,
  style,
  render,
}: FieldControlProps): React.ReactNode {
  const { state, labelId, reportChange, reportBlur, reportFocus } =
    useField("FieldControl");
  const terminal = state.disabled || state.readOnly;

  const controlProps: FieldControlChildProps = {
    onValueChange: terminal
      ? undefined
      : (next: unknown) => {
          if (typeof children !== "function") {
            const own = (
              children as {
                props?: { onValueChange?: (next: unknown) => void };
              } | null
            )?.props?.onValueChange;
            own?.(next);
          }
          reportChange(next);
        },
    onBlur: terminal
      ? undefined
      : () => {
          if (typeof children !== "function") {
            const own = (children as { props?: { onBlur?: () => void } } | null)
              ?.props?.onBlur;
            own?.();
          }
          reportBlur();
        },
    onFocus: terminal
      ? undefined
      : () => {
          if (typeof children !== "function") {
            const own = (
              children as { props?: { onFocus?: () => void } } | null
            )?.props?.onFocus;
            own?.();
          }
          reportFocus();
        },
    "aria-labelledby": labelId,
    editable: !terminal,
    disabled: terminal,
    testID,
    style: resolveStyle(style, state),
  };

  if (typeof children === "function") {
    return <>{children(controlProps)}</>;
  }

  const substituted = resolveRender(
    render,
    {
      ...controlProps,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;

  if (children === undefined || children === null) {
    return <Input {...controlProps} />;
  }

  if (typeof children === "object" && "type" in children) {
    const element = children as ReactElement<Record<string, unknown>>;
    const elementProps = element.props;
    const merged: Record<string, unknown> = {
      ...controlProps,
      ...elementProps,
    };
    // The caller's own props win (slot convention) — except identity
    // and reporting, which the field owns.
    merged.testID = testID ?? elementProps.testID;
    merged.style = [controlProps.style, elementProps.style];
    merged.onValueChange = controlProps.onValueChange;
    merged.onBlur = controlProps.onBlur;
    merged.onFocus = controlProps.onFocus;
    merged["aria-labelledby"] = labelId;
    merged.editable = !terminal;
    merged.disabled = terminal;
    return cloneElement(element, merged);
  }

  // Non-element children (arrays, strings) render untouched: wiring
  // needs a single element child or a function child (or no child).
  return <>{children}</>;
}

export function FieldDescription({
  children,
  testID,
  style,
  render,
}: FieldDescriptionProps): React.ReactNode {
  const { state, descriptionId } = useField("FieldDescription");
  const substituted = resolveRender(
    render,
    {
      testID,
      style,
      nativeID: descriptionId,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <Text nativeID={descriptionId} testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function FieldError({
  children,
  testID,
  style,
  render,
}: FieldErrorProps): React.ReactNode {
  const context = useContext(FieldContext);
  if (!context) return null;
  const { state, errors } = context;
  const invalid = state.invalid || errors.length > 0;
  if (!invalid) return null;
  if (render !== undefined) {
    const substituted = resolveRender(
      render,
      {
        "aria-live": "polite",
        testID,
        style,
        children,
      } satisfies SlotProps,
      state,
    );
    if (substituted !== null) return substituted;
  }
  if (children === undefined || children === null) return null;
  const substituted = resolveRender(
    render,
    {
      "aria-live": "polite",
      testID,
      style,
      children,
    } satisfies SlotProps,
    state,
  );
  if (substituted !== null) return substituted;
  return (
    <Text aria-live="polite" testID={testID} style={style}>
      {children}
    </Text>
  );
}

export function FieldValidity({
  children,
}: FieldValidityProps): React.ReactNode {
  const { state, errors, initialValue } = useField("FieldValidity");
  return (
    <>
      {children({
        value: state.value,
        errors,
        error: errors[0] ?? "",
        initialValue,
        valid: state.valid,
        invalid: state.invalid,
        touched: state.touched,
        dirty: state.dirty,
        filled: state.filled,
        focused: state.focused,
        readOnly: state.readOnly,
      })}
    </>
  );
}
