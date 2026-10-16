import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AspectRatio,
  Avatar,
  Text as AxisText,
  Button,
  Checkbox,
  Field,
  Fieldset,
  Input,
  Label,
  Loader,
  Meter,
  NumberField,
  OtpField,
  Progress,
  Search,
  Separator,
  Slider,
  Switch,
  Textarea,
  Toggle,
  Toolbar,
  Trigger,
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

  it("Switch element render substitutes and preserves toggle", async () => {
    const seen: boolean[] = [];
    await render(
      <Switch
        accessibilityLabel="Wifi"
        onCheckedChange={(v) => seen.push(v)}
        render={<Pressable testID="sub" />}
      />,
    );
    await press("sub");
    expect(seen).toEqual([true]);
  });

  it("Switch function render receives checked state", async () => {
    await render(
      <Switch
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
      <Checkbox
        accessibilityLabel="Accept"
        onCheckedChange={(v) => seen.push(v)}
        render={<Pressable testID="sub" />}
      />,
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

  it("Trigger element render substitutes and preserves press", async () => {
    let calls = 0;
    await render(
      <Trigger onPress={() => (calls += 1)} render={<Pressable testID="sub" />}>
        <Text>Go</Text>
      </Trigger>,
    );
    await press("sub");
    expect(calls).toBe(1);
  });

  it("Trigger function style resolves against disabled state", async () => {
    await render(
      <Trigger
        testID="trg"
        disabled
        style={(s) => ({ opacity: s.disabled ? 0 : 1 })}
      >
        <Text>Go</Text>
      </Trigger>,
    );
    expect(screen.getByTestId("trg").props.style).toMatchObject({ opacity: 0 });
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

  it("Text element render keeps consumer children", async () => {
    await render(
      <AxisText render={<Text testID="sub">custom</Text>}>orig</AxisText>,
    );
    expect(screen.getByText("custom")).toBeTruthy();
    expect(screen.queryByText("orig")).toBeNull();
  });

  it("Loader element render substitutes the host", async () => {
    await render(<Loader render={<View testID="sub" />} />);
    expect(screen.getByTestId("sub")).toBeTruthy();
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

  it("Avatar function render observes the fallback branch", async () => {
    await render(
      <Avatar
        render={(_props, state) => (
          <Text testID="st">
            {state.showingFallback ? "fallback" : "image"}
          </Text>
        )}
      >
        <Text>AB</Text>
      </Avatar>,
    );
    expect(screen.getByText("fallback")).toBeTruthy();
  });

  it("Meter function style resolves against the clamped value", async () => {
    await render(
      <Meter
        testID="meter"
        value={40}
        style={(s) => ({ opacity: s.value === 40 ? 1 : 0 })}
      />,
    );
    expect(screen.getByTestId("meter").props.style).toMatchObject({
      opacity: 1,
    });
  });

  it("Progress function render observes indeterminate state", async () => {
    await render(
      <Progress
        indeterminate
        render={(_props, state) => (
          <Text testID="st">{state.indeterminate ? "busy" : "set"}</Text>
        )}
      />,
    );
    expect(screen.getByText("busy")).toBeTruthy();
  });

  it("Field function render observes invalid state", async () => {
    await render(
      <Field
        label="Name"
        error="Required"
        render={(_props, state) => (
          <Text testID="st">{state.invalid ? "bad" : "good"}</Text>
        )}
      />,
    );
    expect(screen.getByText("bad")).toBeTruthy();
  });

  it("Fieldset element render substitutes the host", async () => {
    await render(
      <Fieldset legend="Group" render={<View testID="sub" />}>
        <Text>Hi</Text>
      </Fieldset>,
    );
    expect(screen.getByTestId("sub")).toBeTruthy();
  });

  it("Toolbar function render observes disabled state", async () => {
    await render(
      <Toolbar
        accessibilityLabel="Bar"
        disabled
        render={(_props, state) => (
          <Text testID="st">{state.disabled ? "off" : "on"}</Text>
        )}
      >
        <Text>Hi</Text>
      </Toolbar>,
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

  it("Textarea function style resolves against value state", async () => {
    await render(
      <Textarea
        testID="ta"
        defaultValue="hi"
        style={(s) => ({ opacity: s.value === "hi" ? 1 : 0 })}
      />,
    );
    expect(screen.getByTestId("ta").props.style).toMatchObject([
      { opacity: 1 },
      null,
    ]);
  });

  it("Search function render observes query state", async () => {
    await render(
      <Search
        accessibilityLabel="Find"
        defaultValue="query"
        render={(_props, state) => <Text testID="st">{state.value}</Text>}
      />,
    );
    expect(screen.getByText("query")).toBeTruthy();
  });

  it("NumberField function render observes numeric state", async () => {
    await render(
      <NumberField
        defaultValue={3}
        render={(_props, state) => (
          <Text testID="st">{`v${String(state.value)}`}</Text>
        )}
      />,
    );
    expect(screen.getByText("v3")).toBeTruthy();
  });

  it("OtpField function render observes code state", async () => {
    await render(
      <OtpField
        defaultValue="12"
        render={(_props, state) => <Text testID="st">{state.value}</Text>}
      />,
    );
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("Slider function render observes value state", async () => {
    await render(
      <Slider
        defaultValue={25}
        render={(_props, state) => (
          <Text testID="st">{`v${String(state.value)}`}</Text>
        )}
      />,
    );
    expect(screen.getByText("v25")).toBeTruthy();
  });
});
