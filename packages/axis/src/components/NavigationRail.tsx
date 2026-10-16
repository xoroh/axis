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

export type NavigationRailProps = Omit<NavigationBarProps, "orientation"> & {
  /** Rail direction. Default `"vertical"` (a horizontal rail is a bar). */
  orientation?: "horizontal" | "vertical";
};

export type NavigationRailItemProps = NavigationBarItemProps;

export function NavigationRail({
  orientation = "vertical",
  ...rest
}: NavigationRailProps): React.JSX.Element {
  return <NavigationBar orientation={orientation} {...rest} />;
}

export const NavigationRailItem = NavigationBarItem;
