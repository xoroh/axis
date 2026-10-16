import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Pressable, View } from "react-native";
import { ExtendedFab, Fab } from "./index";

/**
 * Fab family behavior through the public entry. Button role with
 * disabled/busy states, label-required icon fab vs text-named
 * extended fab, the square dp box, terminal disabled/loading, and
 * ref forwarding — observed in the RN runtime.
 */

async function pressLabel(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByLabelText(label));
  });
}

describe("Fab on React Native", () => {
  it("renders with the button role and fires onPress", async () => {
    let pressed = 0;
    await render(
      <Fab accessibilityLabel="Create" onPress={() => (pressed += 1)} />,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeTruthy();
    await pressLabel("Create");
    expect(pressed).toBe(1);
  });

  it("applies the square dp box when size is given", async () => {
    await render(<Fab testID="fab" accessibilityLabel="Create" size={56} />);
    const host = screen.getByTestId("fab");
    expect(host.props.style).toMatchObject([
      { width: 56, height: 56 },
      undefined,
    ]);
  });

  it("is terminal when disabled or loading", async () => {
    let pressed = 0;
    const onPress = () => (pressed += 1);
    await render(
      <Fab accessibilityLabel="Create" disabled onPress={onPress} />,
    );
    expect(
      screen.getByLabelText("Create").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await pressLabel("Create");
    expect(pressed).toBe(0);

    await render(
      <Fab
        accessibilityLabel="Saving"
        loading
        onPress={onPress}
        testID="busy"
      />,
    );
    expect(screen.getByTestId("busy").props.accessibilityState).toMatchObject({
      busy: true,
    });
    await pressLabel("Saving");
    expect(pressed).toBe(0);
  });

  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(<Fab accessibilityLabel="Create" ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});

describe("ExtendedFab on React Native", () => {
  it("is named by its visible text without a label", async () => {
    let pressed = 0;
    await render(
      <ExtendedFab onPress={() => (pressed += 1)}>Create note</ExtendedFab>,
    );
    expect(screen.getByRole("button", { name: "Create note" })).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Create note" }));
    });
    expect(pressed).toBe(1);
  });

  it("renders the leading icon beside the text", async () => {
    await render(
      <ExtendedFab testID="xfab" icon={<View testID="xfab-icon" />}>
        Create note
      </ExtendedFab>,
    );
    expect(screen.getByTestId("xfab")).toBeTruthy();
    expect(screen.getByTestId("xfab-icon")).toBeTruthy();
    expect(screen.getByText("Create note")).toBeTruthy();
  });

  it("prefers an explicit label over visible text", async () => {
    await render(
      <ExtendedFab accessibilityLabel="Create a new note">Create</ExtendedFab>,
    );
    expect(screen.getByLabelText("Create a new note")).toBeTruthy();
  });

  it("is terminal when disabled", async () => {
    let pressed = 0;
    await render(
      <ExtendedFab disabled onPress={() => (pressed += 1)}>
        Create note
      </ExtendedFab>,
    );
    const host = screen.getByRole("button", { name: "Create note" });
    expect(host.props.accessibilityState).toMatchObject({ disabled: true });
    await act(async () => {
      fireEvent.press(host);
    });
    expect(pressed).toBe(0);
  });

  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof Pressable>>();
    await render(<ExtendedFab ref={ref}>Create note</ExtendedFab>);
    expect(ref.current).toBeTruthy();
  });
});
