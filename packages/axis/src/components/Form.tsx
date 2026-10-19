import {
  createContext,
  type ElementRef,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import type { FieldErrors } from "../form";
import type { StateStyle } from "../render";
import { type RenderProp, resolveRender, resolveStyle } from "../render";
import type { SlotProps } from "../slot";
import type { FieldRegistration } from "./Field";

/**
 * Form — unstyled submit-and-validate root for field groups.
 *
 * There is no native form submit on React Native, so submission is
 * explicit: wire a button to `actions.submit()` (via `actionsRef`),
 * which validates every registered field and calls `onFormSubmit`
 * with the collected values only when everything passes. `validate()`
 * (optionally scoped to one field) and `clearErrors()` complete the
 * imperative surface. Server errors arrive through `errors`, keyed by
 * field `name`; fields report their own changes, blur, and focus into
 * the shared registry, and the nearest Form supplies the fallback
 * validation mode. No default visuals — every visual value is
 * caller-provided.
 *
 * Base UI names hold except `actionsRef`: it carries
 * `{ submit, validate, clearErrors }` (a superset of Base UI's
 * `{ validate }`) because there is no native submit event to hook.
 * `onClearErrors` fires whenever the Form clears errors on its own
 * (the `clearErrors` action) so the caller can drop its server map.
 * `onValueCommitted`-style per-field commit hooks do not exist;
 * validation commits through the field actions.
 */

export type FormActions = {
  /**
   * Validate every registered field (submit semantics: arms
   * re-validate-on-change) and call `onFormSubmit(values)` when all
   * pass. Resolves `true` when the form is valid.
   */
  submit: () => Promise<boolean>;
  /**
   * Validate all fields, or one field by name. Updates field states
   * but never calls `onFormSubmit`. Resolves `true` when the
   * validated scope is valid.
   */
  validate: (fieldName?: string) => Promise<boolean>;
  /** Clear every field's errors and notify `onClearErrors`. */
  clearErrors: () => void;
};

export type FormState = {
  /** Overall validity (`null` = never validated). */
  valid: boolean | null;
};

export type FormProps = {
  /**
   * Server errors, keyed by field `name`. Take precedence over locally
   * computed errors while present for that field.
   */
  errors?: FieldErrors;
  /** Fires when the Form clears errors on its own (the `clearErrors` action). */
  onClearErrors?: () => void;
  /**
   * Called with the collected field values when `submit()` validates
   * every registered field. Never fires when anything is invalid.
   */
  onFormSubmit?: (values: Record<string, unknown>) => void;
  /**
   * Fallback validation timing for fields without their own
   * `validationMode`. Default `"onSubmit"`.
   */
  validationMode?: "onSubmit" | "onBlur" | "onChange";
  testID?: string;
  /** Container style: value or function of form state, caller-provided. */
  style?: StateStyle<FormState, StyleProp<ViewStyle>>;
  /**
   * Element or function substitution (Base UI parity): an element is
   * cloned with the form props merged under its own; a function
   * receives `(props, state)`. Field registration stays on the part.
   */
  render?: RenderProp<FormState, SlotProps>;
  /** Forwarded to the container `View` host element. */
  ref?: Ref<ElementRef<typeof View>>;
  /** Form content (fields plus the caller's own submit control). */
  children?: ReactNode;
  /** Imperative handle: `{ submit, validate, clearErrors }`. */
  actionsRef?: Ref<FormActions>;
};

type InternalFormContext = {
  registerField: (entry: FieldRegistration) => () => void;
  getFormValues: () => Record<string, unknown>;
  formValidationMode: "onSubmit" | "onBlur" | "onChange";
  serverErrorFor: (name: string | undefined) => string[];
};

export const FormContext = createContext<InternalFormContext | null>(null);

/**
 * Assign one value to every ref in the list. Inline here (not imported)
 * deliberately: the shared `mergeRefs` composition has no approved
 * consumer yet, and the contract requires an inline, documented,
 * tested composition until its transfer gate passes. When it does,
 * this body is its first consumer.
 */
function assignRef(
  ref: FormProps["ref"],
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

function assignActionsRef(
  ref: FormProps["actionsRef"],
  value: FormActions | null,
): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref && typeof ref === "object" && "current" in ref) {
    try {
      (ref as { current: unknown }).current = value;
    } catch {
      // A frozen ref object cannot take the write — leave it alone.
    }
  }
}

export function Form({
  errors,
  onClearErrors,
  onFormSubmit,
  validationMode = "onSubmit",
  testID,
  style,
  render,
  ref,
  children,
  actionsRef,
}: FormProps): React.ReactNode {
  const registry = useRef(new Map<number, FieldRegistration>());
  const sequence = useRef(0);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [valid, setValid] = useState<boolean | null>(null);

  // Mirror the caller-owned server errors. The mirror is local state
  // (not the prop object) so `clearErrors` can drop it without
  // waiting for the caller — the next prop change re-syncs.
  useEffect(() => {
    setServerErrors(errors ?? {});
  }, [errors]);

  const registerField = useCallback(
    (entry: FieldRegistration): (() => void) => {
      const id = sequence.current++;
      registry.current.set(id, entry);
      return () => {
        registry.current.delete(id);
      };
    },
    [],
  );

  const getFormValues = useCallback((): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const entry of registry.current.values()) {
      if (entry.name !== undefined) values[entry.name] = entry.getValue();
    }
    return values;
  }, []);

  const serverErrorFor = useCallback(
    (name: string | undefined): string[] => {
      if (name === undefined) return [];
      const found = serverErrors[name];
      if (found === undefined) return [];
      return Array.isArray(found) ? [...found] : [found];
    },
    [serverErrors],
  );

  const validateEntries = useCallback(
    async (entries: FieldRegistration[]): Promise<boolean> => {
      let allValid = true;
      for (const entry of entries) {
        const fieldErrors = await entry.validateField({ fromSubmit: true });
        if (fieldErrors.length > 0) allValid = false;
      }
      setValid(allValid);
      return allValid;
    },
    [],
  );

  const validate = useCallback(
    async (fieldName?: string): Promise<boolean> => {
      const entries = [...registry.current.values()];
      const scoped =
        fieldName === undefined
          ? entries
          : entries.filter((entry) => entry.name === fieldName);
      return validateEntries(scoped);
    },
    [validateEntries],
  );

  const submit = useCallback(async (): Promise<boolean> => {
    const entries = [...registry.current.values()];
    const ok = await validateEntries(entries);
    if (ok) {
      const values: Record<string, unknown> = {};
      for (const entry of entries) {
        if (entry.name !== undefined) values[entry.name] = entry.getValue();
      }
      onFormSubmit?.(values);
    }
    return ok;
  }, [onFormSubmit, validateEntries]);

  const clearErrors = useCallback(() => {
    for (const entry of registry.current.values()) {
      entry.clearField();
    }
    setServerErrors({});
    setValid(null);
    onClearErrors?.();
  }, [onClearErrors]);

  useEffect(() => {
    assignActionsRef(actionsRef, { submit, validate, clearErrors });
    return () => {
      assignActionsRef(actionsRef, null);
    };
  }, [actionsRef, clearErrors, submit, validate]);

  const state: FormState = { valid };

  const context = useMemo<InternalFormContext>(
    () => ({
      registerField,
      getFormValues,
      formValidationMode: validationMode,
      serverErrorFor,
    }),
    [getFormValues, registerField, serverErrorFor, validationMode],
  );

  const setHostRef = useCallback(
    (node: ElementRef<typeof View> | null) => {
      assignRef(ref, node);
    },
    [ref],
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
      <FormContext.Provider value={context}>{substituted}</FormContext.Provider>
    );
  }

  return (
    <FormContext.Provider value={context}>
      <View ref={setHostRef} testID={testID} style={resolveStyle(style, state)}>
        {children}
      </View>
    </FormContext.Provider>
  );
}
