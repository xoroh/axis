import { fireEvent, render, screen } from "@testing-library/react-native";
import { act, createRef, type ElementRef } from "react";
import { Text, type View } from "react-native";
import {
  PortalHost,
  PreviewCardArrow,
  PreviewCardBackdrop,
  PreviewCardPopup,
  PreviewCardPortal,
  PreviewCardPositioner,
  PreviewCardRoot,
  PreviewCardTrigger,
} from "./index";

/**
 * PreviewCard compound behavior through the public entry: press opens card,
 * scrim press dismisses, controlled mode works — observed in RN runtime.
 */

describe("PreviewCard compound on React Native", () => {
  it("hides the popup until opened", async () => {
    await render(
      <PortalHost>
        <PreviewCardRoot>
          <PreviewCardTrigger testID="pc-trigger">
            <Text>Hover me</Text>
          </PreviewCardTrigger>
          <PreviewCardPortal>
            <PreviewCardBackdrop testID="pc-scrim" />
            <PreviewCardPositioner testID="pc-positioner">
              <PreviewCardPopup testID="pc-popup">
                <Text>Preview Content</Text>
              </PreviewCardPopup>
            </PreviewCardPositioner>
          </PreviewCardPortal>
        </PreviewCardRoot>
      </PortalHost>,
    );
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByText("Preview Content")).toBeNull();
  });

  it("opens on trigger press and dismisses via backdrop", async () => {
    const seen: boolean[] = [];
    await render(
      <PortalHost>
        <PreviewCardRoot
          delay={0}
          closeDelay={0}
          onOpenChange={(v) => seen.push(v)}
        >
          <PreviewCardTrigger testID="pc-trigger">
            <Text>Hover me</Text>
          </PreviewCardTrigger>
          <PreviewCardPortal>
            <PreviewCardBackdrop testID="pc-scrim" />
            <PreviewCardPositioner testID="pc-positioner">
              <PreviewCardPopup testID="pc-popup" aria-label="Link preview">
                <PreviewCardArrow testID="pc-arrow" />
                <Text>Preview Content</Text>
              </PreviewCardPopup>
            </PreviewCardPositioner>
          </PreviewCardPortal>
        </PreviewCardRoot>
      </PortalHost>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("pc-trigger"));
    });
    expect(seen).toEqual([true]);
    expect(screen.getByRole("region")).toBeTruthy();
    expect(screen.getByLabelText("Link preview")).toBeTruthy();
    expect(screen.getByText("Preview Content")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Dismiss preview"));
    });
    expect(seen).toEqual([true, false]);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("controlled open shows the preview card", async () => {
    await render(
      <PortalHost>
        <PreviewCardRoot open>
          <PreviewCardTrigger>
            <Text>Link</Text>
          </PreviewCardTrigger>
          <PreviewCardPortal>
            <PreviewCardPositioner>
              <PreviewCardPopup>
                <Text>Controlled Content</Text>
              </PreviewCardPopup>
            </PreviewCardPositioner>
          </PreviewCardPortal>
        </PreviewCardRoot>
      </PortalHost>,
    );
    expect(screen.getByRole("region")).toBeTruthy();
    expect(screen.getByText("Controlled Content")).toBeTruthy();
  });

  it("forwards a ref to the trigger host element", async () => {
    const ref = createRef<ElementRef<typeof View>>();
    await render(
      <PortalHost>
        <PreviewCardRoot>
          <PreviewCardTrigger ref={ref}>
            <Text>Link</Text>
          </PreviewCardTrigger>
        </PreviewCardRoot>
      </PortalHost>,
    );
    expect(ref.current).not.toBeNull();
  });
});
