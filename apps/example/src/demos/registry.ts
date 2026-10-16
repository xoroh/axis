import type { ReactNode } from "react";
import { BarsDemo } from "./bars";
import { ButtonDemo } from "./button";
import { DialogDemo } from "./dialog";
import { DisclosureDemo } from "./disclosure";
import { DisplayDemo } from "./display";
import { DropdownDemo } from "./dropdown";
import { EntryDemo } from "./entry";
import { ListSelectDemo } from "./list-select";
import { MenuDemo } from "./menu";
import { OverlaysDemo } from "./overlays";
import { PopoverDemo } from "./popover";
import { RangesDemo } from "./ranges";
import { SelectionDemo } from "./selection";
import { SwitchDemo } from "./switch";

/**
 * Demo registry — one runnable demo per Axis component family.
 *
 * Each demo renders its components with plain caller styles (no
 * tokens, no design system — demos prove the unstyled contract).
 * `components` names the public barrel exports demonstrated, so
 * `scripts/check-demo-coverage.mjs` can prove every component has
 * a demo. Slugs are stable, kebab-case, unique.
 */

export type Demo = {
  /** Stable kebab-case id, also the file name in `./demos`. */
  slug: string;
  /** Human title in the demo list. */
  title: string;
  /** Barrel export names demonstrated here. */
  components: string[];
  /** Rendered demo screen. */
  render: () => ReactNode;
};

export const DEMOS: Demo[] = [
  SwitchDemo,
  ButtonDemo,
  DialogDemo,
  SelectionDemo,
  EntryDemo,
  ListSelectDemo,
  RangesDemo,
  DisplayDemo,
  DisclosureDemo,
  OverlaysDemo,
  MenuDemo,
  DropdownDemo,
  BarsDemo,
  PopoverDemo,
];
