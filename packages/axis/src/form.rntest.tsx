import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef, useState } from "react";
import { Text, View } from "react-native";
import {
  FieldControl,
  FieldError,
  type FieldErrors,
  FieldLabel,
  FieldRoot,
  FieldValidity,
  Form,
  type FormActions,
  Input,
} from "./index";

/**
 * Form submit-and-validate behavior through the public entry:
 * per-field validation timing, submit gating with collected values,
 * server-error mapping, single/all/programmatic validation, and
 * clearing — observed in the RN runtime, not assumed. There is no
 * native submit on RN, so every flow is driven through the
 * actions ref, exactly as consuming code would.
 */

function FieldHarness({
  name,
  validate,
  defaultValue,
  mode,
}: {
  name?: string;
  validate?: (value: unknown) => string | string[] | null | undefined;
  defaultValue?: unknown;
  mode?: "onSubmit" | "onBlur" | "onChange";
}) {
  const [value, setValue] = useState<unknown>(defaultValue ?? "");
  const key = name ?? "anon";
  return (
    <FieldRoot
      name={name}
      validate={validate}
      validationMode={mode}
      defaultValue={defaultValue}
    >
      <FieldLabel>{key} label</FieldLabel>
      <FieldControl>
        <Input
          testID={`${key}-in`}
          value={value as string}
          onValueChange={setValue as (text: string) => void}
        />
      </FieldControl>
      <FieldError>
        <Text testID={`${key}-err`}>invalid</Text>
      </FieldError>
    </FieldRoot>
  );
}

async function typeText(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), text);
  });
}

function SignUpForm({
  errors,
  onFormSubmit,
  onClearErrors,
  validationMode,
  actionsRef,
  asyncEmail = false,
}: {
  errors?: FieldErrors;
  onFormSubmit?: (values: Record<string, unknown>) => void;
  onClearErrors?: () => void;
  validationMode?: "onSubmit" | "onBlur" | "onChange";
  actionsRef?: React.Ref<FormActions>;
  asyncEmail?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const emailValidate = (v: unknown) => {
    const check = () => {
      if (typeof v !== "string" || v === "") return "Email required";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return "Bad email";
      return null;
    };
    return asyncEmail ? Promise.resolve(check()) : check();
  };
  return (
    <Form
      errors={errors}
      onFormSubmit={onFormSubmit}
      onClearErrors={onClearErrors}
      validationMode={validationMode}
      actionsRef={actionsRef}
    >
      <FieldRoot name="name" validate={(v) => (!v ? "Name required" : null)}>
        <FieldLabel>Name</FieldLabel>
        <FieldControl>
          <Input testID="name-in" value={name} onValueChange={setName} />
        </FieldControl>
        <FieldError>
          <Text testID="name-err">Name required</Text>
        </FieldError>
      </FieldRoot>
      <FieldRoot name="email" validate={emailValidate}>
        <FieldLabel>Email</FieldLabel>
        <FieldControl>
          <Input testID="email-in" value={email} onValueChange={setEmail} />
        </FieldControl>
        <FieldError>
          <Text testID="email-err">Bad email</Text>
        </FieldError>
      </FieldRoot>
    </Form>
  );
}

describe("Form submit", () => {
  it("calls onFormSubmit with values keyed by name when valid", async () => {
    const seen: Array<Record<string, unknown>> = [];
    const actions = createRef<FormActions>();
    await render(
      <SignUpForm onFormSubmit={(v) => seen.push(v)} actionsRef={actions} />,
    );
    await typeText("name-in", "Ada");
    await typeText("email-in", "ada@lovelace.dev");
    let ok = false;
    await act(async () => {
      ok = (await actions.current?.submit()) ?? false;
    });
    expect(ok).toBe(true);
    expect(seen).toEqual([{ name: "Ada", email: "ada@lovelace.dev" }]);
  });

  it("blocks submit and shows errors when invalid", async () => {
    const seen: Array<Record<string, unknown>> = [];
    const actions = createRef<FormActions>();
    await render(
      <SignUpForm onFormSubmit={(v) => seen.push(v)} actionsRef={actions} />,
    );
    await typeText("email-in", "not-an-email");
    let ok = true;
    await act(async () => {
      ok = (await actions.current?.submit()) ?? true;
    });
    expect(ok).toBe(false);
    expect(seen).toEqual([]);
    expect(screen.getByTestId("name-err")).toBeTruthy();
    expect(screen.getByTestId("email-err")).toBeTruthy();
  });

  it("awaits async validators before submitting", async () => {
    const seen: Array<Record<string, unknown>> = [];
    const actions = createRef<FormActions>();
    await render(
      <SignUpForm
        asyncEmail
        onFormSubmit={(v) => seen.push(v)}
        actionsRef={actions}
      />,
    );
    await typeText("name-in", "Ada");
    await typeText("email-in", "taken");
    let ok = true;
    await act(async () => {
      ok = (await actions.current?.submit()) ?? true;
    });
    expect(ok).toBe(false);
    expect(seen).toEqual([]);
    expect(screen.getByTestId("email-err")).toBeTruthy();
  });
});

describe("Form validation modes", () => {
  it("revalidates on change after a submit attempt", async () => {
    const actions = createRef<FormActions>();
    await render(<SignUpForm actionsRef={actions} />);
    await act(async () => {
      await actions.current?.submit();
    });
    expect(screen.getByTestId("name-err")).toBeTruthy();
    await typeText("name-in", "Ada");
    expect(screen.queryByTestId("name-err")).toBeNull();
  });

  it("form-level onChange validates on every keystroke", async () => {
    await render(<SignUpForm validationMode="onChange" />);
    await typeText("name-in", "Ada");
    expect(screen.queryByTestId("name-err")).toBeNull();
    await typeText("name-in", "");
    expect(screen.getByTestId("name-err")).toBeTruthy();
  });

  it("field-level mode wins over the form", async () => {
    await render(
      <Form validationMode="onSubmit">
        <FieldHarness
          name="code"
          mode="onChange"
          validate={(v) => (v === "ok" ? null : "Must be ok")}
        />
      </Form>,
    );
    expect(screen.queryByText("invalid")).toBeNull();
    await typeText("code-in", "nope");
    expect(screen.getByText("invalid")).toBeTruthy();
  });

  it("validates one field by name", async () => {
    const actions = createRef<FormActions>();
    await render(<SignUpForm actionsRef={actions} />);
    await typeText("email-in", "bad");
    let ok = true;
    await act(async () => {
      ok = (await actions.current?.validate("email")) ?? true;
    });
    expect(ok).toBe(false);
    // Untouched name field stays unvalidated.
    expect(screen.queryByTestId("name-err")).toBeNull();
    expect(screen.getByTestId("email-err")).toBeTruthy();
  });
});

describe("Form server errors", () => {
  function ServerProbe({ errors }: { errors?: FieldErrors }) {
    return (
      <Form errors={errors}>
        <FieldRoot name="email" validate={() => "Local bad"}>
          <FieldControl>
            <Input testID="email-in" />
          </FieldControl>
          <FieldValidity>
            {(s) => <Text testID="server-err">{s.error || "none"}</Text>}
          </FieldValidity>
        </FieldRoot>
      </Form>
    );
  }

  it("maps errors by field name with precedence over internal errors", async () => {
    await render(<ServerProbe errors={{ email: "Taken" }} />);
    // Server text wins over the local validate output.
    expect(screen.getByTestId("server-err").props.children).toBe("Taken");
  });

  it("marks the field invalid from server errors alone", async () => {
    await render(<SignUpForm errors={{ email: "Taken" }} />);
    // Invalid via server alone, so the static message shows...
    expect(screen.getByText("Bad email")).toBeTruthy();
    // ...but only for the field the server named.
    expect(screen.queryByTestId("name-err")).toBeNull();
  });

  it("clears errors and notifies onClearErrors", async () => {
    const cleared: number[] = [];
    const actions = createRef<FormActions>();
    function ClearingProbe() {
      return (
        <Form
          errors={{ email: "Taken" }}
          onClearErrors={() => cleared.push(1)}
          actionsRef={actions}
        >
          <FieldRoot name="email" validate={() => "Local bad"}>
            <FieldControl>
              <Input testID="email-in" />
            </FieldControl>
            <FieldValidity>
              {(s) => <Text testID="server-err">{s.error || "none"}</Text>}
            </FieldValidity>
          </FieldRoot>
        </Form>
      );
    }
    await render(<ClearingProbe />);
    expect(screen.getByTestId("server-err").props.children).toBe("Taken");
    await act(async () => {
      actions.current?.clearErrors();
    });
    expect(cleared).toEqual([1]);
    expect(screen.getByTestId("server-err").props.children).toBe("none");
  });
});

describe("Form misc", () => {
  it("omits unnamed fields from submitted values", async () => {
    const seen: Array<Record<string, unknown>> = [];
    const actions = createRef<FormActions>();
    await render(
      <Form onFormSubmit={(v) => seen.push(v)} actionsRef={actions}>
        <FieldHarness name="named" />
        <FieldHarness />
      </Form>,
    );
    await typeText("named-in", "x");
    await typeText("anon-in", "y");
    await act(async () => {
      await actions.current?.submit();
    });
    expect(seen).toEqual([{ named: "x" }]);
  });

  it("forwards a ref to the host", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Form ref={ref}>
        <FieldHarness name="named" />
      </Form>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("substitutes the host through render", async () => {
    await render(
      <Form render={<View testID="sub-form" />}>
        <FieldHarness name="named" />
      </Form>,
    );
    expect(screen.getByTestId("sub-form")).toBeTruthy();
  });
});
