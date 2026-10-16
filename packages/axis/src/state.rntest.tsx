import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, useState } from "react";
import { Pressable, Text } from "react-native";
import { useControllableState, useSelection } from "./index";

/**
 * State primitives under the React Native runtime. These prove the public
 * state API behaves in an RN host (Pressable-driven, no DOM) — the vitest
 * suites prove the same contracts under jsdom; both renderers must agree.
 */

function UncontrolledToggle() {
  const [on, setOn] = useControllableState<boolean | undefined>(
    undefined,
    false,
    undefined,
  );
  return (
    <Pressable
      testID="toggle"
      accessibilityRole="switch"
      accessibilityState={{ checked: on ?? false }}
      onPress={() => setOn((v) => !(v ?? false))}
    >
      <Text>{on ? "on" : "off"}</Text>
    </Pressable>
  );
}

function ControlledToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const [on, setOn] = useControllableState<boolean>(value, undefined, onChange);
  return (
    <Pressable testID="controlled" onPress={() => setOn(!on)}>
      <Text>{on ? "on" : "off"}</Text>
    </Pressable>
  );
}

function MultiSelect() {
  const [selected, select] = useSelection<string>({
    mode: "multiple",
    defaultValue: [],
  });
  return (
    <>
      <Pressable testID="pick-a" onPress={() => select("a")}>
        <Text>a</Text>
      </Pressable>
      <Pressable testID="pick-b" onPress={() => select("b")}>
        <Text>b</Text>
      </Pressable>
      <Text testID="count">{selected.length}</Text>
    </>
  );
}

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("state primitives on React Native", () => {
  it("uncontrolled toggle flips on press", async () => {
    await render(<UncontrolledToggle />);
    expect(screen.getByText("off")).toBeTruthy();
    await press("toggle");
    expect(screen.getByText("on")).toBeTruthy();
    expect(screen.getByTestId("toggle").props.accessibilityState).toMatchObject(
      { checked: true },
    );
  });

  it("controlled toggle reports through onChange and follows the prop", async () => {
    const seen: boolean[] = [];
    function Host() {
      const [value, setValue] = useState(false);
      return (
        <ControlledToggle
          value={value}
          onChange={(next) => {
            seen.push(next);
            setValue(next);
          }}
        />
      );
    }
    await render(<Host />);
    await press("controlled");
    expect(seen).toEqual([true]);
    expect(screen.getByText("on")).toBeTruthy();
  });

  it("multi-select accumulates independent keys", async () => {
    await render(<MultiSelect />);
    expect(screen.getByTestId("count").props.children).toBe(0);
    await press("pick-a");
    await press("pick-b");
    expect(screen.getByTestId("count").props.children).toBe(2);
    // Toggling a selected key off removes exactly that key.
    await press("pick-a");
    expect(screen.getByTestId("count").props.children).toBe(1);
  });
});
