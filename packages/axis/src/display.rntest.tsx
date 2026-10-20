import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { type Image, Text, type View } from "react-native";
import { AvatarFallback, AvatarImage, AvatarRoot, ProgressRoot } from "./index";

/**
 * Display primitives through the public entry: announced values,
 * fallback behavior, and honest semantics — observed in the RN
 * runtime, not assumed.
 */

describe("ProgressRoot on React Native", () => {
  it("announces role and clamped value", async () => {
    await render(
      <ProgressRoot testID="pg" value={42} aria-label="Loading" />,
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    const props = screen.getByTestId("pg").props;
    expect(props["aria-valuemin"]).toBe(0);
    expect(props["aria-valuemax"]).toBe(100);
    expect(props["aria-valuenow"]).toBe(42);
  });

  it("clamps out-of-range values and fills proportionally", async () => {
    await render(<ProgressRoot testID="pg" value={250} max={100} />);
    const props = screen.getByTestId("pg").props;
    expect(props["aria-valuenow"]).toBe(100);
  });

  it("indeterminate announces busy with no value", async () => {
    await render(<ProgressRoot testID="pg" value={null} />);
    const props = screen.getByTestId("pg").props;
    expect(props["aria-busy"]).toBe(true);
    expect(props["aria-valuenow"]).toBeUndefined();
  });
});

describe("Avatar on React Native", () => {
  it("shows fallback content without a source (idle)", async () => {
    await render(
      <AvatarRoot testID="av">
        <AvatarFallback testID="av-fb">
          <Text>AD</Text>
        </AvatarFallback>
      </AvatarRoot>,
    );
    expect(screen.getByTestId("av-fb")).toBeTruthy();
    expect(screen.getByText("AD")).toBeTruthy();
    expect(screen.queryByRole("image")).toBeNull();
  });

  it("hides the loading image from assistive tech so the fallback names it", async () => {
    await render(
      <AvatarRoot testID="av">
        <AvatarImage
          testID="av-img"
          source={{ uri: "https://example.com/ada.png" }}
          aria-label="Ada"
        />
        <AvatarFallback testID="av-fb">
          <Text>AD</Text>
        </AvatarFallback>
      </AvatarRoot>,
    );
    // Loading: the image is mounted (still fetching) but hidden from
    // assistive tech; the fallback provides the name.
    expect(screen.getByTestId("av-img")).toBeTruthy();
    expect(screen.queryByRole("image")).toBeNull();
    expect(screen.getByTestId("av-fb")).toBeTruthy();
  });

  it("announces the loaded image with role and label, fallback unmounts", async () => {
    await render(
      <AvatarRoot testID="av">
        <AvatarImage
          testID="av-img"
          source={{ uri: "https://example.com/ada.png" }}
          aria-label="Ada"
        />
        <AvatarFallback testID="av-fb">
          <Text>AD</Text>
        </AvatarFallback>
      </AvatarRoot>,
    );
    await act(async () => {
      fireEvent(screen.getByTestId("av-img"), "load");
    });
    expect(screen.getByRole("image")).toBeTruthy();
    expect(screen.getByLabelText("Ada")).toBeTruthy();
    expect(screen.queryByTestId("av-fb")).toBeNull();
  });

  it("falls back after a load error and reports the status sequence", async () => {
    const seen: string[] = [];
    await render(
      <AvatarRoot testID="av">
        <AvatarImage
          testID="av-img"
          source={{ uri: "https://example.com/nope.png" }}
          onLoadingStatusChange={(s) => seen.push(s)}
        />
        <AvatarFallback testID="av-fb">
          <Text>AD</Text>
        </AvatarFallback>
      </AvatarRoot>,
    );
    await act(async () => {
      fireEvent(screen.getByTestId("av-img"), "loadStart");
    });
    await act(async () => {
      fireEvent(screen.getByTestId("av-img"), "error");
    });
    expect(seen).toEqual(["loading", "error"]);
    // Error unmounts the image; the fallback shows.
    expect(screen.queryByTestId("av-img")).toBeNull();
    expect(screen.getByTestId("av-fb")).toBeTruthy();
  });

  it("fallback delay suppresses the flash while loading", async () => {
    jest.useFakeTimers();
    try {
      await render(
        <AvatarRoot>
          <AvatarImage
            testID="av-img"
            source={{ uri: "https://example.com/ada.png" }}
          />
          <AvatarFallback testID="av-fb" delay={1000}>
            <Text>AD</Text>
          </AvatarFallback>
        </AvatarRoot>,
      );
      // Still loading, delay not elapsed: no fallback.
      expect(screen.queryByTestId("av-fb")).toBeNull();
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByTestId("av-fb")).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it("image outside a root never loads", async () => {
    await render(
      <AvatarImage
        testID="orphan"
        source={{ uri: "https://example.com/a.png" }}
      />,
    );
    expect(screen.queryByTestId("orphan")).toBeNull();
  });
});

describe("Avatar ref forwarding", () => {
  it("forwards refs to the root container and the image host", async () => {
    const rootRef = createRef<ElementRef<typeof View>>();
    const imageRef = createRef<ElementRef<typeof Image>>();
    await render(
      <AvatarRoot ref={rootRef} testID="av">
        <AvatarImage
          ref={imageRef}
          testID="av-img"
          source={{ uri: "https://example.com/a.png" }}
        />
        <AvatarFallback>
          <Text>AD</Text>
        </AvatarFallback>
      </AvatarRoot>,
    );
    expect(rootRef.current).toBeTruthy();
    expect(imageRef.current).toBeTruthy();
  });
});

describe("ProgressRoot ref forwarding", () => {
  it("forwards a ref to the host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(<ProgressRoot ref={ref} testID="p" value={42} />);
    expect(ref.current).toBeTruthy();
  });
});
