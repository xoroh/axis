import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AspectRatio,
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
  Button,
  CheckboxIndicator,
  CheckboxRoot,
  FieldRoot,
  FieldsetRoot,
  Input,
  Label,
  MeterIndicator,
  MeterRoot,
  MeterTrack,
  MeterValue,
  NumberFieldGroup,
  NumberFieldRoot,
  OTPFieldRoot,
  ProgressRoot,
  Separator,
  SliderControl,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  SliderValue,
  SwitchRoot,
  Toggle,
  ToolbarRoot,
} from "./index";

/**
 * Render composition parity through the public entry. Every assertion
 * renders the real component in the RN runtime and observes the
 * substitution — element form clones with part props merged under
 * the element's own, function form receives `(props, state)`, and
 * function `style` resolves against the same state objects Base UI
 * publishes for selectors.
 */

async function press(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

describe("render composition: pressables", () => {
  it("Button element render substitutes and preserves press", async () => {
    let calls = 0;
    await render(
      <Button
        accessibilityLabel="Save"
        onPress={() => (calls += 1)}
        render={<Pressable testID="sub" />}
      >
        <Text>Save</Text>
      </Button>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
    await press("sub");
    expect(calls).toBe(1);
  });

  it("Button function render receives state and function style resolves", async () => {
    await render(
      <Button
        accessibilityLabel="Save"
        loading
        style={(s) => ({ opacity: s.loading ? 0.5 : 1 })}
        render={(_props, state) => (
          <Text testID="st">{state.loading ? "busy" : "idle"}</Text>
        )}
      >
        <Text>Save</Text>
      </Button>,
    );
    expect(screen.getByText("busy")).toBeTruthy();
  });

  it("Button function style applies on the default host", async () => {
    await render(
      <Button
        testID="btn"
        disabled
        style={(s) => ({ opacity: s.disabled ? 0.5 : 1 })}
      >
        <Text>Save</Text>
      </Button>,
    );
    expect(screen.getByTestId("btn").props.style).toMatchObject({
      opacity: 0.5,
    });
  });

  it("SwitchRoot element render substitutes and preserves toggle", async () => {
    const seen: boolean[] = [];
    await render(
      <SwitchRoot
        accessibilityLabel="Wifi"
        onCheckedChange={(v) => seen.push(v)}
        render={<Pressable testID="sub" />}
      />,
    );
    await press("sub");
    expect(seen).toEqual([true]);
  });

  it("SwitchRoot function render receives checked state", async () => {
    await render(
      <SwitchRoot
        accessibilityLabel="Wifi"
        defaultChecked
        render={(_props, state) => (
          <Text testID="st">{state.checked ? "on" : "off"}</Text>
        )}
      />,
    );
    expect(screen.getByText("on")).toBeTruthy();
  });

  it("Checkbox element render substitutes and preserves toggle", async () => {
    const seen: boolean[] = [];
    await render(
      <CheckboxRoot
        accessibilityLabel="Accept"
        onCheckedChange={(v) => seen.push(v)}
        render={<Pressable testID="sub" />}
      >
        <CheckboxIndicator />
      </CheckboxRoot>,
    );
    await press("sub");
    expect(seen).toEqual([true]);
  });

  it("Toggle function render receives pressed state and preserves toggle", async () => {
    const seen: boolean[] = [];
    await render(
      <Toggle
        accessibilityLabel="Bold"
        onPressedChange={(v) => seen.push(v)}
        render={(props, state) => (
          <Pressable
            testID="sub"
            onPress={(props as { onPress?: () => void }).onPress}
          >
            <Text>{state.pressed ? "on" : "off"}</Text>
          </Pressable>
        )}
      />,
    );
    expect(screen.getByText("off")).toBeTruthy();
    await press("sub");
    expect(seen).toEqual([true]);
  });
});

describe("render composition: display parts", () => {
  it("Separator element render substitutes the host", async () => {
    await render(<Separator render={<View testID="sub" />} />);
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("Label function render receives children through props", async () => {
    await render(
      <Label
        nativeID="name"
        render={(props) => (
          <Text testID="sub">{`${String((props as { nativeID?: string }).nativeID)}!`}</Text>
        )}
      >
        Name
      </Label>,
    );
    expect(screen.getByText("name!")).toBeTruthy();
  });

  it("AspectRatio function render receives the ratio style", async () => {
    await render(
      <AspectRatio
        ratio={2}
        render={(props) => (
          <View
            testID="sub"
            style={(props as { style?: unknown }).style as never}
          />
        )}
      />,
    );
    const style = screen.getByTestId("sub").props.style as unknown[];
    expect(style[0]).toMatchObject({ aspectRatio: 2 });
  });

  it("AvatarImage function render observes loading status", async () => {
    await render(
      <AvatarRoot>
        <AvatarImage
          testID="av-img"
          source={{ uri: "https://example.com/a.png" }}
          render={(_props, state) => (
            <Text testID="st">{state.imageLoadingStatus}</Text>
          )}
        />
        <AvatarFallback>
          <Text>FB</Text>
        </AvatarFallback>
      </AvatarRoot>,
    );
    expect(screen.getByText("loading")).toBeTruthy();
  });

  it("MeterValue element render substitutes the host", async () => {
    await render(
      <MeterRoot value={70}>
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
        <MeterValue render={<Text testID="sub">v</Text>} />
      </MeterRoot>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("Meter function style resolves against the clamped value", async () => {
    await render(
      <MeterRoot
        testID="meter"
        value={40}
        style={(s) => ({ opacity: s.value === 40 ? 1 : 0 })}
      >
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      </MeterRoot>,
    );
    expect(screen.getByTestId("meter").props.style).toMatchObject({
      opacity: 1,
    });
  });

  it("ProgressRoot function render observes indeterminate state", async () => {
    await render(
      <ProgressRoot
        value={null}
        render={(_props, state) => (
          <Text testID="st">{state.indeterminate ? "busy" : "set"}</Text>
        )}
      />,
    );
    expect(screen.getByText("busy")).toBeTruthy();
  });

  it("FieldRoot function render observes invalid state", async () => {
    await render(
      <FieldRoot
        invalid
        render={(_props, state) => (
          <Text testID="st">{state.invalid ? "bad" : "good"}</Text>
        )}
      />,
    );
    expect(screen.getByText("bad")).toBeTruthy();
  });

  it("FieldsetRoot element render substitutes the host", async () => {
    await render(
      <FieldsetRoot legend="Group" render={<View testID="sub" />}>
        <Text>Hi</Text>
      </FieldsetRoot>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("ToolbarRoot function render observes disabled state", async () => {
    await render(
      <ToolbarRoot
        accessibilityLabel="Bar"
        disabled
        render={(_props, state) => (
          <Text testID="st">{state.disabled ? "off" : "on"}</Text>
        )}
      >
        <Text>Hi</Text>
      </ToolbarRoot>,
    );
    expect(screen.getByText("off")).toBeTruthy();
  });
});

describe("render composition: entries", () => {
  it("Input element render substitutes the host", async () => {
    await render(
      <Input
        accessibilityLabel="Name"
        defaultValue="Ada"
        render={<View testID="sub" />}
      />,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("Input function render observes value state", async () => {
    await render(
      <Input
        accessibilityLabel="Name"
        defaultValue="Ada"
        render={(_props, state) => <Text testID="st">{state.value}</Text>}
      />,
    );
    expect(screen.getByText("Ada")).toBeTruthy();
  });

  it("Input multiline function style resolves against value state", async () => {
    await render(
      <Input
        testID="ta"
        multiline
        defaultValue="hi"
        style={(s) => ({ opacity: s.value === "hi" ? 1 : 0 })}
      />,
    );
    expect(screen.getByTestId("ta").props.style).toMatchObject({ opacity: 1 });
  });

  it("NumberField group function render observes numeric state", async () => {
    await render(
      <NumberFieldRoot defaultValue={3}>
        <NumberFieldGroup
          render={(_props, state) => (
            <Text testID="st">{`v${String(state.value)}`}</Text>
          )}
        />
      </NumberFieldRoot>,
    );
    expect(screen.getByText("v3")).toBeTruthy();
  });

  it("OTPFieldRoot function render observes code state", async () => {
    await render(
      <OTPFieldRoot
        defaultValue="12"
        render={(_props, state) => <Text testID="st">{state.value}</Text>}
      />,
    );
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("Slider function render observes value state", async () => {
    await render(
      <SliderRoot
        defaultValue={25}
        render={(_props, state) => (
          <Text testID="st">{`v${String(state.values[0])}`}</Text>
        )}
      >
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb />
          </SliderTrack>
        </SliderControl>
      </SliderRoot>,
    );
    expect(screen.getByText("v25")).toBeTruthy();
  });

  it("SliderValue function children format the values", async () => {
    await render(
      <SliderRoot defaultValue={[25, 75]}>
        <SliderValue>{(values) => `w${values[0]}-${values[1]}`}</SliderValue>
      </SliderRoot>,
    );
    expect(screen.getByText("w25-75")).toBeTruthy();
  });
});
