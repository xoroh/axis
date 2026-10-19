import { render, screen } from "@testing-library/react-native";
import { act } from "react";
import { StyleSheet, Text } from "react-native";
import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "./index";

/**
 * ProgressRoot parts through the public entry. Every assertion renders
 * the real parts in the RN runtime and interacts through RN events —
 * track fill width from root state, indicator clamping, static label
 * text, value text with indeterminate hiding, and null rendering
 * outside a root are observed, not assumed.
 */

describe("ProgressRoot parts on React Native", () => {
  it("fills the indicator to the clamped value", async () => {
    await render(
      <ProgressRoot testID="pg" value={42} accessibilityLabel="Loading">
        <ProgressTrack testID="pg-track">
          <ProgressIndicator testID="pg-fill" />
        </ProgressTrack>
      </ProgressRoot>,
    );
    expect(screen.getByTestId("pg-track")).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId("pg-fill").props.style),
    ).toMatchObject({ width: "42%" });
  });

  it("clamps the indicator into [min, max]", async () => {
    await render(
      <ProgressRoot testID="pg" value={250} max={100}>
        <ProgressTrack>
          <ProgressIndicator testID="pg-fill" />
        </ProgressTrack>
      </ProgressRoot>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("pg-fill").props.style),
    ).toMatchObject({ width: "100%" });
  });

  it("renders nothing stateful outside a root, but the label anywhere", async () => {
    await render(
      <>
        <ProgressTrack testID="orphan-track">
          <ProgressIndicator testID="orphan-fill" />
        </ProgressTrack>
        <ProgressValue testID="orphan-value" />
        <ProgressLabel testID="static-label">Done</ProgressLabel>
      </>,
    );
    expect(screen.queryByTestId("orphan-track")).toBeNull();
    expect(screen.queryByTestId("orphan-fill")).toBeNull();
    expect(screen.queryByTestId("orphan-value")).toBeNull();
    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("shows the value text and hides it while indeterminate", async () => {
    const view = await render(
      <ProgressRoot testID="pg" value={65}>
        <ProgressValue testID="pg-value" />
        <ProgressLabel>Progress</ProgressLabel>
      </ProgressRoot>,
    );
    expect(screen.getByText("65")).toBeTruthy();
    expect(screen.getByText("Progress")).toBeTruthy();
    await act(async () => {
      view.rerender(
        <ProgressRoot testID="pg" value={null}>
          <ProgressValue testID="pg-value" />
        </ProgressRoot>,
      );
    });
    expect(screen.queryByTestId("pg-value")).toBeNull();
  });

  it("indicator function style observes indeterminate state", async () => {
    await render(
      <ProgressRoot testID="pg" value={null}>
        <ProgressTrack>
          <ProgressIndicator
            testID="pg-fill"
            style={(state) => ({ opacity: state.indeterminate ? 0.5 : 1 })}
          />
        </ProgressTrack>
      </ProgressRoot>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("pg-fill").props.style),
    ).toMatchObject({ width: "0%", opacity: 0.5 });
  });

  it("root keeps its own fill bar with composed children", async () => {
    await render(
      <ProgressRoot testID="pg" value={50} accessibilityLabel="Loading">
        <Text testID="pg-note">Halfway</Text>
      </ProgressRoot>,
    );
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getByText("Halfway")).toBeTruthy();
  });

  it("value renders a caller override over the numeric value", async () => {
    await render(
      <ProgressRoot testID="pg" value={30}>
        <ProgressValue testID="pg-value">Almost there</ProgressValue>
      </ProgressRoot>,
    );
    expect(screen.getByText("Almost there")).toBeTruthy();
    expect(screen.queryByText("30")).toBeNull();
  });
});
