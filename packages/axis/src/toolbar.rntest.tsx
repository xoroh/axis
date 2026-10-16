import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Pressable, StyleSheet, Text, type View } from "react-native";
import { Toolbar } from "./index";

/**
 * Toolbar behavior through the public entry. Every assertion renders
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

describe("Toolbar on React Native", () => {
  it("renders children with the toolbar role", async () => {
    await render(
      <Toolbar testID="tb" accessibilityLabel="Formatting">
        <Text>Bold</Text>
      </Toolbar>,
    );
    expect(screen.getByTestId("tb").props.accessibilityRole).toBe("toolbar");
    expect(screen.getByLabelText("Formatting")).toBeTruthy();
    expect(screen.getByText("Bold")).toBeTruthy();
  });

  it("applies row direction by default and column when vertical", async () => {
    await render(
      <Toolbar testID="tb-h">
        <Text>H</Text>
      </Toolbar>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("tb-h").props.style),
    ).toMatchObject({ flexDirection: "row" });
    await render(
      <Toolbar testID="tb-v" orientation="vertical">
        <Text>V</Text>
      </Toolbar>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("tb-v").props.style),
    ).toMatchObject({ flexDirection: "column" });
  });

  it("disabled is container-only: announced, but blocks nothing itself", async () => {
    const calls: number[] = [];
    await render(
      <Toolbar testID="tb" disabled>
        <Pressable testID="inner" onPress={() => calls.push(1)}>
          <Text>Bold</Text>
        </Pressable>
      </Toolbar>,
    );
    expect(screen.getByTestId("tb").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(screen.getByTestId("tb").props.onPress).toBeUndefined();
    await press("inner");
    expect(calls).toEqual([1]);
  });

  it("forwards a ref to the root host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <Toolbar testID="tb" ref={ref}>
        <Text>R</Text>
      </Toolbar>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("passes caller styles through over the orientation base", async () => {
    await render(
      <Toolbar testID="tb" style={{ opacity: 0.5 }}>
        <Text>S</Text>
      </Toolbar>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("tb").props.style),
    ).toMatchObject({ flexDirection: "row", opacity: 0.5 });
  });
});
