import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { Button, ButtonGroup } from "./index";

/**
 * ButtonGroup behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * group-role announcement, caller buttons keeping their own independent
 * press paths and disabled states (the group propagates nothing), and
 * ref forwarding are observed, not assumed. The group is layout-only.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("ButtonGroup on React Native", () => {
  it("renders a group containing the caller buttons", async () => {
    await render(
      <ButtonGroup testID="bg" accessibilityLabel="Actions">
        <Button testID="a">
          <Text>Save</Text>
        </Button>
        <Button testID="b">
          <Text>Cancel</Text>
        </Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole("group")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("buttons keep independent press paths", async () => {
    let a = 0;
    let b = 0;
    await render(
      <ButtonGroup testID="bg">
        <Button testID="a" onPress={() => (a += 1)}>
          <Text>Save</Text>
        </Button>
        <Button testID="b" onPress={() => (b += 1)}>
          <Text>Cancel</Text>
        </Button>
      </ButtonGroup>,
    );
    await press("a");
    expect(a).toBe(1);
    expect(b).toBe(0);
    await press("b");
    expect(a).toBe(1);
    expect(b).toBe(1);
  });

  it("disabled stays per-button: the group propagates nothing", async () => {
    let a = 0;
    let b = 0;
    await render(
      <ButtonGroup testID="bg">
        <Button testID="a" disabled onPress={() => (a += 1)}>
          <Text>Save</Text>
        </Button>
        <Button testID="b" onPress={() => (b += 1)}>
          <Text>Cancel</Text>
        </Button>
      </ButtonGroup>,
    );
    await press("a");
    expect(a).toBe(0);
    expect(screen.getByTestId("a").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await press("b");
    expect(b).toBe(1);
    expect(screen.getByTestId("b").props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("forwards a ref to the group root", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <ButtonGroup testID="bg" ref={ref}>
        <Button testID="a">
          <Text>Save</Text>
        </Button>
      </ButtonGroup>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("accepts caller styles and labels without imposing any", async () => {
    await render(
      <ButtonGroup
        testID="bg"
        style={{ opacity: 0.5 }}
        accessibilityLabel="Actions"
      >
        <Button testID="a">
          <Text>Save</Text>
        </Button>
      </ButtonGroup>,
    );
    expect(screen.getByTestId("bg").props.style).toMatchObject({
      opacity: 0.5,
    });
    expect(screen.getByLabelText("Actions")).toBeTruthy();
  });
});
