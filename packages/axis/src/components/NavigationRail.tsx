import type { ElementRef, Ref } from "react";
import type { View } from "react-native";
import type {
  NavigationBarItemProps,
  NavigationBarProps,
} from "./NavigationBar";
import { NavigationBar, NavigationBarItem } from "./NavigationBar";

/**
 * NavigationRail — an unstyled vertical destination rail.
 *
 * A rail IS a vertical bar: same selection state, same tab
 * semantics, same items, column layout. Implemented as a thin
 * wrapper over `NavigationBar` (vertical default, overridable)
 * rather than a second implementation — a parallel selectable-row
 * component would be exactly the duplication the contract exists to
 * prevent. `NavigationRailItem` is `NavigationBarItem` under its
 * rail name so catalogues read naturally; the inventory row stays
 * one row because the implementation is one.
 */

export type NavigationRailProps = Omit<
  NavigationBarProps,
  "orientation" | "ref"
> & {
  /** Rail direction. Default `"vertical"` (a horizontal rail is a bar). */
  orientation?: "horizontal" | "vertical";
  /** Forwarded to the rail container `View`. */
  ref?: Ref<ElementRef<typeof View>>;
};

export type NavigationRailItemProps = NavigationBarItemProps;

export function NavigationRail({
  orientation = "vertical",
  ref,
  ...rest
}: NavigationRailProps): React.JSX.Element {
  return <NavigationBar orientation={orientation} ref={ref} {...rest} />;
}

export const NavigationRailItem = NavigationBarItem;
