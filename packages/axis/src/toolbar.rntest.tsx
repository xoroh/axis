import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Pressable, StyleSheet, Text, type View } from "react-native";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarRoot,
  ToolbarSeparator,
} from "./index";

/**
 * ToolbarRoot behavior through the public entry. Every assertion renders
 * the real component in the RN runtime: the toolbar role, the
 * orientation direction, the container-only nature of `disabled`, ref
 * forwarding, and caller-style passthrough are observed, not assumed.
 *
 * Note: the role is asserted on the host props, not through
 * `getByRole("toolbar")` — RNTL v14's `isAccessibilityElement`
 * heuristic only treats host Text/TextInput/Switch (or an explicit
 * `accessible` prop) as queryable, so a role-bearing `View` never
 * matches `*ByRole` queries. The prop value is what the native
 * runtime receives; forcing `accessible` onto the container just to
 * satisfy the query heuristic would change real screen-reader
 * grouping behavior, so the test asserts the prop instead.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("ToolbarRoot on React Native", () => {
  it("renders children with the toolbar role", async () => {
    await render(
      <ToolbarRoot testID="tb" aria-label="Formatting">
        <Text>Bold</Text>
      </ToolbarRoot>,
    );
    expect(screen.getByTestId("tb").props.role).toBe("toolbar");
    expect(screen.getByLabelText("Formatting")).toBeTruthy();
    expect(screen.getByText("Bold")).toBeTruthy();
  });

  it("applies row direction by default and column when vertical", async () => {
    await render(
      <ToolbarRoot testID="tb-h">
        <Text>H</Text>
      </ToolbarRoot>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("tb-h").props.style),
    ).toMatchObject({ flexDirection: "row" });
    await render(
      <ToolbarRoot testID="tb-v" orientation="vertical">
        <Text>V</Text>
      </ToolbarRoot>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("tb-v").props.style),
    ).toMatchObject({ flexDirection: "column" });
  });

  it("disabled is container-only: announced, but blocks nothing itself", async () => {
    const calls: number[] = [];
    await render(
      <ToolbarRoot testID="tb" disabled>
        <Pressable testID="inner" onPress={() => calls.push(1)}>
          <Text>Bold</Text>
        </Pressable>
      </ToolbarRoot>,
    );
    expect(screen.getByTestId("tb").props["aria-disabled"]).toBe(true);
    expect(screen.getByTestId("tb").props.onPress).toBeUndefined();
    await press("inner");
    expect(calls).toEqual([1]);
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <ToolbarRoot testID="tb" ref={ref}>
        <Text>R</Text>
      </ToolbarRoot>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("passes caller styles through over the orientation base", async () => {
    await render(
      <ToolbarRoot testID="tb" style={{ opacity: 0.5 }}>
        <Text>S</Text>
      </ToolbarRoot>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("tb").props.style),
    ).toMatchObject({ flexDirection: "row", opacity: 0.5 });
  });
});

describe("Toolbar parts on React Native", () => {
  it("button activates and announces disabled", async () => {
    let calls = 0;
    await render(
      <ToolbarRoot>
        <ToolbarButton testID="tb-bold" onPress={() => (calls += 1)}>
          <Text>B</Text>
        </ToolbarButton>
        <ToolbarButton testID="tb-italic" disabled>
          <Text>I</Text>
        </ToolbarButton>
      </ToolbarRoot>,
    );
    await press("tb-bold");
    expect(calls).toBe(1);
    await press("tb-italic");
    expect(calls).toBe(1);
    expect(
      screen.getByTestId("tb-italic").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("parts take aria-label (ADR-112 aria-only)", async () => {
    await render(
      <ToolbarRoot>
        <ToolbarButton aria-label="Make bold">
          <Text>B</Text>
        </ToolbarButton>
        <ToolbarLink aria-label="Open docs">Docs</ToolbarLink>
      </ToolbarRoot>,
    );
    expect(screen.getByLabelText("Make bold")).toBeTruthy();
    expect(screen.getByLabelText("Open docs")).toBeTruthy();
  });

  it("button inherits root orientation and disabled", async () => {
    await render(
      <ToolbarRoot testID="tb" orientation="vertical" disabled>
        <ToolbarButton
          testID="tb-btn"
          render={(_props, state) => (
            <Text testID="st">{`${state.orientation}-${state.disabled}`}</Text>
          )}
        />
      </ToolbarRoot>,
    );
    expect(screen.getByText("vertical-true")).toBeTruthy();
  });

  it("link renders with the link role", async () => {
    let calls = 0;
    await render(
      <ToolbarRoot>
        <ToolbarLink testID="tb-link" onPress={() => (calls += 1)}>
          Docs
        </ToolbarLink>
      </ToolbarRoot>,
    );
    expect(screen.getByTestId("tb-link").props.role).toBe("link");
    await press("tb-link");
    expect(calls).toBe(1);
  });

  it("group renders children and announces disabled", async () => {
    await render(
      <ToolbarRoot>
        <ToolbarGroup testID="tb-group" disabled>
          <Text>G</Text>
        </ToolbarGroup>
      </ToolbarRoot>,
    );
    expect(screen.getByText("G")).toBeTruthy();
    expect(
      screen.getByTestId("tb-group").props["aria-disabled"],
    ).toBe(true);
  });

  it("input commits value changes", async () => {
    const seen: string[] = [];
    await render(
      <ToolbarRoot>
        <ToolbarInput
          testID="tb-input"
          defaultValue=""
          onValueChange={(v) => seen.push(v)}
        />
      </ToolbarRoot>,
    );
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("tb-input"), "query");
    });
    expect(seen).toEqual(["query"]);
  });

  it("separator defaults perpendicular to the toolbar", async () => {
    await render(
      <ToolbarRoot>
        <ToolbarSeparator
          testID="tb-sep"
          render={(_props, state) => (
            <Text testID="st">{state.orientation}</Text>
          )}
        />
      </ToolbarRoot>,
    );
    expect(screen.getByText("vertical")).toBeTruthy();
  });
});
