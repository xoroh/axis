import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

/**
 * The naming rule (contract §2) asserted on the real barrel.
 *
 * Where Base UI 1.9.0 has `X.Root` with sibling parts, Axis exports
 * `XRoot` plus `X<Part>` and no bare `X` beside them (rule a;
 * no monolith wrappers — composites belong in Kern). Where Base UI's
 * component is bare, the Axis export is bare (rule b). A compound
 * family with no Base UI counterpart follows (a) (rule c). Types
 * follow their component (`XRootProps`, `XRootState`).
 *
 * Static analysis, not imports: the native entry cannot load in
 * node (boundary rule — no `react-native` outside the device/jest
 * runtime), so this suite parses the barrel text instead. It fails
 * on any tree that still ships a bare monolith next to an `XRoot`
 * and passes once every family below holds.
 */

const here = dirname(fileURLToPath(import.meta.url));
const indexText = readFileSync(join(here, "index.ts"), "utf8");

const barrel = new Set<string>();
for (const m of indexText.matchAll(
  /export\s*\{([^}]*)\}\s*from\s*["'][^"']+["']/g,
)) {
  for (const part of m[1].split(",")) {
    const name = part
      .replace(/\btype\s+/g, "")
      .trim()
      .split(/\s+as\s+/)
      .pop()
      ?.trim();
    if (name) barrel.add(name);
  }
}

// [oldName, newName] — every rename the migration landed. Old must be
// gone from the barrel (no aliases, no compat re-exports); new must
// be present. Bare monoliths map to null: removed outright, callers
// moved onto the compound parts.
const renames: Array<[string, string | null]> = [
  ["Tabs", "TabsRoot"],
  ["TabsProps", "TabsRootProps"],
  ["TabsState", "TabsRootState"],
  ["Collapsible", "CollapsibleRoot"],
  ["CollapsibleProps", "CollapsibleRootProps"],
  ["CollapsibleState", "CollapsibleRootState"],
  ["NavigationMenu", "NavigationMenuRoot"],
  ["NavigationMenuProps", "NavigationMenuRootProps"],
  ["NavigationMenuState", "NavigationMenuRootState"],
  ["DropdownMenu", "DropdownMenuRoot"],
  ["DropdownMenuProps", "DropdownMenuRootProps"],
  ["DropdownMenuState", "DropdownMenuRootState"],
  ["Switch", "SwitchRoot"],
  ["SwitchProps", "SwitchRootProps"],
  ["SwitchState", "SwitchRootState"],
  ["Progress", "ProgressRoot"],
  ["ProgressProps", "ProgressRootProps"],
  ["ProgressState", "ProgressRootState"],
  ["Field", "FieldRoot"],
  ["FieldProps", "FieldRootProps"],
  ["FieldState", "FieldRootState"],
  ["Fieldset", "FieldsetRoot"],
  ["FieldsetProps", "FieldsetRootProps"],
  ["ContextMenu", "ContextMenuRoot"],
  ["ContextMenuProps", "ContextMenuRootProps"],
  ["ContextMenuState", "ContextMenuRootState"],
  ["Toolbar", "ToolbarRoot"],
  ["ToolbarProps", "ToolbarRootProps"],
  ["ToolbarState", "ToolbarRootState"],
  ["Toast", "ToastRoot"],
  ["ToastProps", "ToastRootProps"],
  ["ToastState", "ToastRootState"],
  ["Table", "TableRoot"],
  ["TableProps", "TableRootProps"],
  ["Dialog", null],
  ["Popover", null],
  ["PopoverProps", null],
  ["Select", null],
  ["SelectProps", null],
  ["Tooltip", null],
  ["TooltipProps", null],
  ["TooltipState", null],
  ["Menu", null],
  ["MenuProps", null],
  ["RadioGroupItem", "RadioRoot"],
  ["RadioGroupItemProps", "RadioRootProps"],
  ["RadioGroupItemState", "RadioRootState"],
  ["ToggleGroupItem", "Toggle"],
  ["ToggleGroupItemProps", "Toggle"],
  ["ToggleGroupItemState", "Toggle"],
  ["CheckboxState", "CheckboxRootState"],
];

// New sibling parts each renamed family must export (rule a/c), plus
// the state/props types that travel with them.
const familyParts: Record<string, string[]> = {
  Tabs: ["TabsRoot", "TabsList", "TabsTrigger", "TabsPanel"],
  Collapsible: ["CollapsibleRoot", "CollapsibleTrigger", "CollapsiblePanel"],
  NavigationMenu: [
    "NavigationMenuRoot",
    "NavigationMenuItem",
    "NavigationMenuTrigger",
    "NavigationMenuPanel",
  ],
  DropdownMenu: [
    "DropdownMenuRoot",
    "DropdownMenuTrigger",
    "DropdownMenuItem",
    "DropdownMenuSub",
    "DropdownMenuSubTrigger",
    "DropdownMenuSubContent",
  ],
  Switch: ["SwitchRoot", "SwitchThumb"],
  Progress: [
    "ProgressRoot",
    "ProgressTrack",
    "ProgressIndicator",
    "ProgressLabel",
    "ProgressValue",
  ],
  Field: [
    "FieldRoot",
    "FieldLabel",
    "FieldControl",
    "FieldDescription",
    "FieldError",
  ],
  Fieldset: ["FieldsetRoot", "FieldsetLegend"],
  ContextMenu: ["ContextMenuRoot"],
  Toolbar: [
    "ToolbarRoot",
    "ToolbarButton",
    "ToolbarLink",
    "ToolbarGroup",
    "ToolbarInput",
    "ToolbarSeparator",
  ],
  Toast: ["ToastRoot", "ToastProvider", "ToastViewport", "useToast"],
  Table: ["TableRoot", "TableHeader", "TableRow", "TableCell"],
  Dialog: [
    "DialogRoot",
    "DialogTrigger",
    "DialogPortal",
    "DialogBackdrop",
    "DialogPopup",
    "DialogTitle",
    "DialogDescription",
    "DialogClose",
  ],
  Popover: [
    "PopoverRoot",
    "PopoverTrigger",
    "PopoverPortal",
    "PopoverBackdrop",
    "PopoverPositioner",
    "PopoverPopup",
    "PopoverTitle",
    "PopoverDescription",
    "PopoverClose",
    "PopoverArrow",
  ],
  Select: [
    "SelectRoot",
    "SelectTrigger",
    "SelectValue",
    "SelectPortal",
    "SelectBackdrop",
    "SelectPositioner",
    "SelectPopup",
    "SelectArrow",
    "SelectItem",
    "SelectItemText",
    "SelectItemIndicator",
    "SelectGroup",
    "SelectGroupLabel",
    "SelectSeparator",
  ],
  Tooltip: [
    "TooltipRoot",
    "TooltipProvider",
    "TooltipTrigger",
    "TooltipPortal",
    "TooltipPositioner",
    "TooltipPopup",
    "TooltipArrow",
  ],
  Menu: [
    "MenuRoot",
    "MenuTrigger",
    "MenuPortal",
    "MenuBackdrop",
    "MenuPositioner",
    "MenuPopup",
    "MenuSeparator",
    "MenuItem",
  ],
  Radio: ["RadioGroup", "RadioRoot", "RadioIndicator"],
  Toggle: ["Toggle", "ToggleGroup"],
  Checkbox: ["CheckboxRoot", "CheckboxIndicator"],
  Overlay: [
    "OverlayRoot",
    "OverlayPortal",
    "OverlayBackdrop",
    "OverlayPopup",
    "OverlayTrigger",
    "OverlayClose",
  ],
};

// Rule (b): bare by design — present with no `XRoot` beside them.
const bareFamilies = [
  "Button",
  "Input",
  "Toggle",
  "ToggleGroup",
  "RadioGroup",
  "CheckboxGroup",
  "Separator",
  "Menubar",
];

test("renames hold: old names gone, new names exported", () => {
  for (const [oldName, newName] of renames) {
    expect(
      barrel.has(oldName),
      `bare/monolith export ${oldName} must be gone`,
    ).toBe(false);
    if (newName !== null) {
      expect(
        barrel.has(newName),
        `renamed export ${newName} (was ${oldName}) must be exported`,
      ).toBe(true);
    }
  }
  // ToggleGroupItem collapses onto the existing Toggle part.
  expect(barrel.has("Toggle")).toBe(true);
});

test("every listed family exports its parts", () => {
  for (const [family, parts] of Object.entries(familyParts)) {
    for (const part of parts) {
      expect(barrel.has(part), `${family} must export ${part}`).toBe(true);
    }
  }
});

test("no bare monolith next to an XRoot", () => {
  for (const [family, parts] of Object.entries(familyParts)) {
    // A Root part marks a compound family (rule a/c). The Toggle
    // family (bare Toggle + bare ToggleGroup, rule b) has none and is
    // proven by the dedicated rule-(b) test instead.
    if (!parts.includes(`${family}Root`)) continue;
    // Exact-name ban: siblings (XList, XTrigger, …) legitimately
    // start with X; only the bare X itself is the monolith.
    if (family === "Overlay") continue; // namespace carve-out, proven below
    expect(
      barrel.has(family),
      `bare ${family} must not sit beside ${family}Root`,
    ).toBe(false);
  }
});

test("Overlay namespace is a parts object, not a monolith", () => {
  // The one bare-X carve-out: `Overlay` is a namespace over the
  // compound parts (Base UI has no Overlay component; rule c), not a
  // wrapper component. Pin its shape so a future monolith cannot hide
  // behind this exception.
  const overlaySource = readFileSync(
    join(here, "components", "Overlay.tsx"),
    "utf8",
  );
  expect(overlaySource).toContain("export const Overlay = {");
  expect(overlaySource).toContain("Root: OverlayRoot,");
  expect(barrel.has("Overlay")).toBe(true);
  expect(barrel.has("OverlayRoot")).toBe(true);
});

test("rule (b) families stay bare with no Root", () => {
  for (const name of bareFamilies) {
    expect(barrel.has(name), `${name} stays a bare export`).toBe(true);
    expect(
      barrel.has(`${name}Root`),
      `${name} must not grow a Root (rule b)`,
    ).toBe(false);
  }
});
