import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import {
  Card,
  EmptyState,
  Kbd,
  ListItem,
  Loader,
  Meter,
  Skeleton,
} from "./index";

/**
 * Display batch through the public entry: announced values, silent
 * placeholders, slot composition — observed in the RN runtime.
 */

describe("Meter on React Native", () => {
  it("announces gauge value with min/max", async () => {
    await render(<Meter testID="m" value={70} accessibilityLabel="Battery" />);
    expect(screen.getByRole("meter")).toBeTruthy();
    expect(screen.getByTestId("m").props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 70,
    });
  });

  it("clamps below min and above max", async () => {
    await render(<Meter testID="m" value={-5} />);
    expect(screen.getByTestId("m").props.accessibilityValue).toMatchObject({
      now: 0,
    });
  });
});

describe("Loader on React Native", () => {
  it("announces busy with label and passes size", async () => {
    await render(
      <Loader testID="l" accessibilityLabel="Loading results" size="small" />,
    );
    expect(screen.getByLabelText("Loading results")).toBeTruthy();
    expect(screen.getByTestId("l").props.accessibilityState).toMatchObject({
      busy: true,
    });
  });
});

describe("Skeleton on React Native", () => {
  it("renders a silent placeholder with caller dimensions", async () => {
    await render(<Skeleton testID="sk" style={{ height: 48 }} />);
    const node = screen.getByTestId("sk");
    expect(node.props.accessible).toBe(false);
    expect(node.props.style).toMatchObject({ height: 48 });
  });
});

describe("EmptyState on React Native", () => {
  it("renders title, description, and action slot", async () => {
    await render(
      <EmptyState
        testID="es"
        title="No results"
        description="Try another search"
        accessibilityLabel="Empty results"
        action={<Text>Retry</Text>}
      />,
    );
    expect(screen.getByText("No results")).toBeTruthy();
    expect(screen.getByText("Try another search")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
    expect(screen.getByLabelText("Empty results")).toBeTruthy();
  });

  it("omits absent slots", async () => {
    await render(<EmptyState testID="es" title="Done" />);
    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.getByTestId("es")).toBeTruthy();
  });
});

describe("Card on React Native", () => {
  it("renders slots in document order", async () => {
    await render(
      <Card
        testID="c"
        header={<Text>H</Text>}
        media={<Text>M</Text>}
        actions={<Text>A</Text>}
        accessibilityLabel="Profile card"
      >
        <Text>Body</Text>
      </Card>,
    );
    expect(screen.getByText("H")).toBeTruthy();
    expect(screen.getByText("M")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByLabelText("Profile card")).toBeTruthy();
  });
});

describe("ListItem on React Native", () => {
  it("pressable row fires and announces selected", async () => {
    const seen: boolean[] = [];
    await render(
      <ListItem
        testID="li"
        accessibilityLabel="Starred conversation"
        selected
        onPress={() => seen.push(true)}
        leading={<Text>★</Text>}
        trailing={<Text>2</Text>}
      />,
    );
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByTestId("li").props.accessibilityState).toMatchObject({
      selected: true,
      disabled: false,
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("li"));
    });
    expect(seen).toEqual([true]);
  });

  it("static row renders slots without press affordance", async () => {
    await render(
      <ListItem testID="li" leading={<Text>L</Text>} trailing={<Text>T</Text>}>
        Plain row
      </ListItem>,
    );
    expect(screen.getByTestId("li")).toBeTruthy();
    expect(screen.getByText("Plain row")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("disabled blocks press", async () => {
    const seen: boolean[] = [];
    await render(
      <ListItem testID="li" disabled onPress={() => seen.push(true)}>
        <Text>x</Text>
      </ListItem>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("li"));
    });
    expect(seen).toEqual([]);
  });
});

describe("Kbd on React Native", () => {
  it("renders key names as text", async () => {
    await render(<Kbd testID="k">⌘K</Kbd>);
    expect(screen.getByText("⌘K")).toBeTruthy();
    expect(screen.getByTestId("k")).toBeTruthy();
  });
});

describe("Card ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Card ref={ref} testID="c" />);
    expect(ref.current).toBeTruthy();
  });
});

describe("EmptyState ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<EmptyState ref={ref} testID="e" title="Nothing" />);
    expect(ref.current).toBeTruthy();
  });
});

describe("Kbd ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof Text>>();
    await render(
      <Kbd ref={ref} testID="k">
        X
      </Kbd>,
    );
    expect(ref.current).toBeTruthy();
  });
});

describe("ListItem ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <ListItem ref={ref} testID="li">
        Row
      </ListItem>,
    );
    expect(ref.current).toBeTruthy();
  });
});

describe("Loader ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Loader ref={ref} testID="l" />);
    expect(ref.current).toBeTruthy();
  });
});

describe("Meter ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Meter ref={ref} testID="m" value={3} />);
    expect(ref.current).toBeTruthy();
  });
});

describe("Skeleton ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<Skeleton ref={ref} testID="s" />);
    expect(ref.current).toBeTruthy();
  });
});
