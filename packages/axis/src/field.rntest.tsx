import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, View } from "react-native";
import {
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
  FieldValidity,
  Input,
} from "./index";

/**
 * Field compound behavior through the public entry: label association,
 * control wiring, validation modes and timing, external state control,
 * disabled terminality, error rendering, validity reporting, and the
 * monolith adapter — observed in the RN runtime, not assumed.
 */

async function typeText(testID: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), text);
  });
}

async function blurField(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), "blur");
  });
}

async function focusField(testID: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), "focus");
  });
}

function Entry(props: {
  testID?: string;
  onValueChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}) {
  return (
    <FieldRoot name="name" validate={(v) => (!v ? "Required" : null)}>
      <FieldLabel>Full name</FieldLabel>
      <FieldControl testID={props.testID}>
        <Input
          aria-label="Name input"
          onValueChange={props.onValueChange as never}
          onBlur={props.onBlur}
          onFocus={props.onFocus}
        />
      </FieldControl>
      <FieldError>Required</FieldError>
    </FieldRoot>
  );
}

describe("FieldRoot", () => {
  it("associates the label with the control", async () => {
    await render(<Entry testID="in" />);
    const labelId = screen.getByText("Full name").props.nativeID;
    expect(typeof labelId).toBe("string");
    expect(screen.getByTestId("in").props["aria-labelledby"]).toBe(labelId);
  });

  it("reports typed values and validates on submit-mode change", async () => {
    const seen: unknown[] = [];
    await render(
      <FieldRoot
        name="name"
        validate={(v) => (!v ? "Required" : null)}
        onValueChange={(v) => seen.push(v)}
      >
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldError>Required</FieldError>
      </FieldRoot>,
    );
    await typeText("in", "Ada");
    expect(seen).toEqual(["Ada"]);
    // onSubmit mode: typing alone does not validate yet.
    expect(screen.queryByText("Required")).toBeNull();
  });

  it("validates on blur in onBlur mode", async () => {
    await render(
      <FieldRoot
        name="name"
        validationMode="onBlur"
        validate={(v) => (!v ? "Required" : null)}
      >
        <FieldControl>
          <Input testID="in" defaultValue="" />
        </FieldControl>
        <FieldError>Required</FieldError>
      </FieldRoot>,
    );
    expect(screen.queryByText("Required")).toBeNull();
    await blurField("in");
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("validates on every change in onChange mode", async () => {
    await render(
      <FieldRoot
        name="name"
        validationMode="onChange"
        validate={(v) => (v === "ok" ? null : "Must be ok")}
      >
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldError>Must be ok</FieldError>
      </FieldRoot>,
    );
    await typeText("in", "nope");
    expect(screen.getByText("Must be ok")).toBeTruthy();
    await typeText("in", "ok");
    expect(screen.queryByText("Must be ok")).toBeNull();
  });

  it("tracks dirty, touched, filled, and focused", async () => {
    let observed = "";
    await render(
      <FieldRoot name="name" defaultValue="">
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldValidity>
          {(s) => {
            observed = `dirty=${String(s.dirty)} touched=${String(s.touched)} filled=${String(s.filled)} focused=${String(s.focused)}`;
            return null;
          }}
        </FieldValidity>
      </FieldRoot>,
    );
    expect(observed).toBe(
      "dirty=false touched=false filled=false focused=false",
    );
    await focusField("in");
    expect(observed).toContain("focused=true");
    await typeText("in", "Ada");
    expect(observed).toContain("dirty=true");
    expect(observed).toContain("filled=true");
    await blurField("in");
    expect(observed).toContain("touched=true");
    expect(observed).toContain("focused=false");
  });

  it("accepts async validators", async () => {
    await render(
      <FieldRoot
        name="name"
        validationMode="onBlur"
        validate={async (v) => (v === "taken" ? "Taken" : null)}
      >
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldError>Taken</FieldError>
      </FieldRoot>,
    );
    await typeText("in", "taken");
    await blurField("in");
    expect(await screen.findByText("Taken")).toBeTruthy();
  });

  it("survives throwing validators without crashing", async () => {
    await render(
      <FieldRoot
        name="name"
        validationMode="onChange"
        validate={() => {
          throw new Error("boom");
        }}
      >
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldError>Never shown</FieldError>
      </FieldRoot>,
    );
    await typeText("in", "Ada");
    expect(screen.queryByText("Never shown")).toBeNull();
  });

  it("honors external invalid, dirty, touched, and disabled", async () => {
    await render(
      <FieldRoot name="name" invalid dirty touched disabled>
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldError>Forced</FieldError>
      </FieldRoot>,
    );
    expect(screen.getByText("Forced")).toBeTruthy();
    expect(getInput().props.editable).toBe(false);
  });

  it("blocks validation and reporting while disabled", async () => {
    const seen: unknown[] = [];
    await render(
      <FieldRoot
        name="name"
        disabled
        validate={() => "Nope"}
        validationMode="onChange"
        onValueChange={(v) => seen.push(v)}
      >
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldError>Nope</FieldError>
      </FieldRoot>,
    );
    await typeText("in", "Ada");
    expect(seen).toEqual([]);
    expect(screen.queryByText("Nope")).toBeNull();
  });

  it("exposes validate and state through the render prop", async () => {
    await render(
      <FieldRoot
        name="name"
        defaultValue="Ada"
        render={(_props, state) => (
          <View testID="root">
            <Text testID="st">{`v=${String(state.value)}`}</Text>
          </View>
        )}
      />,
    );
    expect(screen.getByText("v=Ada")).toBeTruthy();
  });

  it("forwards a ref to the root host", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <FieldRoot ref={ref}>
        <FieldLabel>Name</FieldLabel>
      </FieldRoot>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("substitutes the whole root through render", async () => {
    await render(
      <FieldRoot render={<View testID="sub-root" />}>
        <FieldLabel>Name</FieldLabel>
      </FieldRoot>,
    );
    expect(screen.getByTestId("sub-root")).toBeTruthy();
  });

  it("rejects use outside a root", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      await expect(render(<FieldLabel>Name</FieldLabel>)).rejects.toThrow(
        /under a FieldRoot/,
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

describe("FieldControl", () => {
  it("chains the child handlers with reporting", async () => {
    const changed: unknown[] = [];
    let blurred = 0;
    await render(
      <FieldRoot name="name">
        <FieldControl>
          <Input
            testID="in"
            onValueChange={(t) => changed.push(t)}
            onBlur={() => {
              blurred += 1;
            }}
          />
        </FieldControl>
      </FieldRoot>,
    );
    await typeText("in", "Ada");
    expect(changed).toEqual(["Ada"]);
    await blurField("in");
    expect(blurred).toBe(1);
  });

  it("renders a default Axis Input without children", async () => {
    await render(
      <FieldRoot name="name">
        <FieldControl testID="ctl" />
      </FieldRoot>,
    );
    expect(screen.getByTestId("ctl")).toBeTruthy();
  });

  it("passes control props to a function child", async () => {
    let sawLabelledBy: unknown;
    await render(
      <FieldRoot name="name">
        <FieldLabel>Full name</FieldLabel>
        <FieldControl>
          {(props) => {
            sawLabelledBy = props["aria-labelledby"];
            return <View testID="custom" />;
          }}
        </FieldControl>
      </FieldRoot>,
    );
    expect(screen.getByTestId("custom")).toBeTruthy();
    expect(typeof sawLabelledBy).toBe("string");
  });
});

describe("Field parts", () => {
  it("describes with a native id", async () => {
    await render(
      <FieldRoot name="name">
        <FieldDescription>Visible on your profile</FieldDescription>
      </FieldRoot>,
    );
    const node = screen.getByText("Visible on your profile");
    expect(typeof node.props.nativeID).toBe("string");
  });

  it("hides the error while valid and shows it when invalid", async () => {
    await render(
      <FieldRoot
        name="name"
        validationMode="onChange"
        validate={(v) => (!v ? "Required" : null)}
      >
        <FieldControl>
          <Input testID="in" defaultValue="Ada" />
        </FieldControl>
        <FieldError>Required</FieldError>
      </FieldRoot>,
    );
    expect(screen.queryByText("Required")).toBeNull();
    await typeText("in", "");
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("reports validity state through FieldValidity", async () => {
    let observed = "";
    await render(
      <FieldRoot
        name="nick"
        defaultValue="Ada"
        validationMode="onChange"
        validate={(v) => (v === "Ada" ? null : "Unknown")}
      >
        <FieldControl>
          <Input testID="in" />
        </FieldControl>
        <FieldValidity>
          {(s) => {
            observed = `error=${s.error} initial=${String(s.initialValue)} valid=${String(s.valid)}`;
            return null;
          }}
        </FieldValidity>
      </FieldRoot>,
    );
    expect(observed).toBe("error= initial=Ada valid=null");
    await typeText("in", "Bo");
    expect(observed).toBe("error=Unknown initial=Ada valid=false");
  });

  it("substitutes label, description, and error", async () => {
    await render(
      <FieldRoot name="name" invalid>
        <FieldLabel render={<Text testID="sub-label">N</Text>} />
        <FieldDescription render={<Text testID="sub-desc">D</Text>} />
        <FieldError render={<Text testID="sub-error">E</Text>} />
      </FieldRoot>,
    );
    expect(screen.getByTestId("sub-label")).toBeTruthy();
    expect(screen.getByTestId("sub-desc")).toBeTruthy();
    expect(screen.getByTestId("sub-error")).toBeTruthy();
  });
});

function getInput() {
  const root = screen.root;
  if (root === null) throw new Error("Field test: no render root");
  const match = root.queryAll((node) => node.type === "TextInput")[0];
  if (match === undefined)
    throw new Error("Field test: expected one host TextInput");
  return match;
}
