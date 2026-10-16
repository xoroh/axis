import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Pressable, Text } from "react-native";
import { LinkButton } from "./index";

/**
 * LinkButton behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * link-role announcement (outer accessible container), inner button
 * press delivery, disabled suppression, and ref forwarding are
 * observed, not assumed. The inner pressable retains the button role
 * via `Button` (see the component's composition note); the link role
 * lives on the outer container.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("LinkButton on React Native", () => {
  it("renders link role wrapping a button with children text", async () => {
    await render(
      <LinkButton testID="lnk">
        <Text>Learn more</Text>
      </LinkButton>,
    );
    expect(screen.getByRole("link")).toBeTruthy();
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByText("Learn more")).toBeTruthy();
  });

  it("press fires onPress once", async () => {
    let calls = 0;
    await render(
      <LinkButton testID="lnk" onPress={() => (calls += 1)}>
        <Text>Learn more</Text>
      </LinkButton>,
    );
    await press("lnk");
    expect(calls).toBe(1);
  });

  it("disabled blocks: no callback, announced disabled on the pressable", async () => {
    let calls = 0;
    await render(
      <LinkButton testID="lnk" disabled onPress={() => (calls += 1)}>
        <Text>Learn more</Text>
      </LinkButton>,
    );
    expect(screen.getByTestId("lnk").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await press("lnk");
    expect(calls).toBe(0);
  });

  it("forwards a ref to the inner pressable host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(
      <LinkButton testID="lnk" ref={ref}>
        <Text>Learn more</Text>
      </LinkButton>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles and labels without imposing any", async () => {
    await render(
      <LinkButton
        testID="lnk"
        style={{ opacity: 0.5 }}
        accessibilityLabel="Learn more about billing"
      >
        <Text>Learn more</Text>
      </LinkButton>,
    );
    expect(screen.getByTestId("lnk").props.style).toMatchObject({
      opacity: 0.5,
    });
    expect(screen.getByLabelText("Learn more about billing")).toBeTruthy();
  });
});
