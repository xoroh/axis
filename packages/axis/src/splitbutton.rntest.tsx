import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import { SplitButton } from "./index";

/**
 * SplitButton behavior through the public entry. Every assertion renders
 * the real component in the RN runtime and interacts through RN events —
 * two side-by-side button roles, independent press paths, shared
 * disabled terminality, the default secondary label, and container ref
 * forwarding are observed, not assumed.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("SplitButton on React Native", () => {
  it("renders primary content with the default secondary label", async () => {
    await render(
      <SplitButton testID="sp">
        <Text>Save</Text>
      </SplitButton>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("More actions")).toBeTruthy();
  });

  it("primary press fires onPress only", async () => {
    let primary = 0;
    let secondary = 0;
    await render(
      <SplitButton
        testID="sp"
        onPress={() => (primary += 1)}
        onSecondaryPress={() => (secondary += 1)}
      >
        <Text>Save</Text>
      </SplitButton>,
    );
    await press("sp");
    expect(primary).toBe(1);
    expect(secondary).toBe(0);
  });

  it("secondary press fires onSecondaryPress only", async () => {
    let primary = 0;
    let secondary = 0;
    await render(
      <SplitButton
        testID="sp"
        onPress={() => (primary += 1)}
        onSecondaryPress={() => (secondary += 1)}
      >
        <Text>Save</Text>
      </SplitButton>,
    );
    await press("sp-secondary");
    expect(secondary).toBe(1);
    expect(primary).toBe(0);
  });

  it("disabled blocks both paths and announces disabled on both", async () => {
    let primary = 0;
    let secondary = 0;
    await render(
      <SplitButton
        testID="sp"
        disabled
        onPress={() => (primary += 1)}
        onSecondaryPress={() => (secondary += 1)}
      >
        <Text>Save</Text>
      </SplitButton>,
    );
    expect(screen.getByTestId("sp").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(
      screen.getByTestId("sp-secondary").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await press("sp");
    await press("sp-secondary");
    expect(primary).toBe(0);
    expect(secondary).toBe(0);
  });

  it("renders a custom secondary label", async () => {
    await render(
      <SplitButton testID="sp" secondaryLabel="Options">
        <Text>Save</Text>
      </SplitButton>,
    );
    expect(screen.getByText("Options")).toBeTruthy();
    expect(screen.queryByText("More actions")).toBeNull();
  });

  it("forwards container ref and caller styles per pressable", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <SplitButton
        testID="sp"
        ref={ref}
        style={{ opacity: 0.5 }}
        secondaryStyle={{ opacity: 0.25 }}
      >
        <Text>Save</Text>
      </SplitButton>,
    );
    expect(ref.current).not.toBeNull();
    expect(screen.getByTestId("sp").props.style).toMatchObject({
      opacity: 0.5,
    });
    expect(screen.getByTestId("sp-secondary").props.style).toMatchObject({
      opacity: 0.25,
    });
  });
});
