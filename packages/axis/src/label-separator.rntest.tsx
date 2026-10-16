import { render, screen } from "@testing-library/react-native";
import { Label, Separator } from "./index";

/**
 * Label + Separator through the public entry. Static structure with
 * honest semantics: Label associates by nativeID, Separator stays
 * silent (no invented role).
 */

describe("Label on React Native", () => {
  it("renders content with association id and caller style", async () => {
    await render(
      <Label testID="lb" nativeID="email-label" style={{ fontSize: 12 }}>
        Email
      </Label>,
    );
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByTestId("lb").props.nativeID).toBe("email-label");
    expect(screen.getByTestId("lb").props.style).toMatchObject({
      fontSize: 12,
    });
  });
});

describe("Separator on React Native", () => {
  it("renders a silent divider with caller style", async () => {
    await render(<Separator testID="sep" style={{ height: 1 }} />);
    const node = screen.getByTestId("sep");
    expect(node.props.accessible).toBe(false);
    expect(node.props.style).toMatchObject({ height: 1 });
  });
});
