import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { Portal, PortalHost } from "./index";

/**
 * Standalone portal host through the public entry. Every assertion
 * renders the host + portal in the RN runtime — content declared
 * under a portal paints at its host in mount order, named hosts
 * scope matching, and content without a matching host renders
 * nothing (with a dev warning) rather than painting in place.
 */

describe("Portal host on React Native", () => {
  it("paints portal content at the host", async () => {
    await render(
      <PortalHost testID="host">
        <View testID="anchor">
          <Portal>
            <Text>Lifted</Text>
          </Portal>
        </View>
      </PortalHost>,
    );
    // Declared inside the anchor, painted at the host: the anchor
    // holds no text of its own.
    expect(screen.getByText("Lifted")).toBeTruthy();
    expect(screen.getByTestId("host")).toBeTruthy();
  });

  it("paints multiple portals in mount order", async () => {
    await render(
      <PortalHost testID="host">
        <Portal>
          <Text>first</Text>
        </Portal>
        <Portal>
          <Text>second</Text>
        </Portal>
      </PortalHost>,
    );
    expect(screen.getByText("first")).toBeTruthy();
    expect(screen.getByText("second")).toBeTruthy();
  });

  it("named portals scope to the matching host", async () => {
    await render(
      <PortalHost>
        <View>
          <PortalHost testID="host-a" name="a">
            <Portal hostName="a">
              <Text>for-a</Text>
            </Portal>
          </PortalHost>
          <PortalHost testID="host-b" name="b">
            <Text>plain-b</Text>
          </PortalHost>
        </View>
      </PortalHost>,
    );
    expect(screen.getByText("for-a")).toBeTruthy();
    expect(screen.getByText("plain-b")).toBeTruthy();
  });

  it("renders nothing without a matching host and warns in dev", async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((part) => String(part)).join(" "));
    };
    try {
      await render(
        <PortalHost>
          <View testID="plain">
            <Portal hostName="missing">
              <Text>Nowhere</Text>
            </Portal>
          </View>
        </PortalHost>,
      );
    } finally {
      console.warn = originalWarn;
    }
    expect(screen.getByTestId("plain")).toBeTruthy();
    expect(screen.queryByText("Nowhere")).toBeNull();
    expect(warnings.some((w) => w.includes("PortalHost"))).toBe(true);
  });

  it("renders nothing with no host at all and warns in dev", async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((part) => String(part)).join(" "));
    };
    try {
      await render(
        <View testID="plain">
          <Portal>
            <Text>Lonely</Text>
          </Portal>
        </View>,
      );
    } finally {
      console.warn = originalWarn;
    }
    expect(screen.getByTestId("plain")).toBeTruthy();
    expect(screen.queryByText("Lonely")).toBeNull();
    expect(warnings.some((w) => w.includes("PortalHost"))).toBe(true);
  });

  it("removes content when the portal unmounts", async () => {
    const view = await render(
      <PortalHost testID="host">
        <Portal>
          <Text>Temporary</Text>
        </Portal>
      </PortalHost>,
    );
    expect(screen.getByText("Temporary")).toBeTruthy();
    await view.rerender(<Text>Empty</Text>);
    expect(screen.queryByText("Temporary")).toBeNull();
    expect(screen.getByText("Empty")).toBeTruthy();
  });

  it("host accepts a render substitution", async () => {
    await render(
      <PortalHost testID="host" render={<View testID="sub-host" />}>
        <Portal>
          <Text>Lifted</Text>
        </Portal>
      </PortalHost>,
    );
    expect(screen.getByTestId("sub-host")).toBeTruthy();
    expect(screen.getByText("Lifted")).toBeTruthy();
  });
});
