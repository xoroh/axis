## Context Menu

Long-press popup menu compound family: long-press the anchor trigger to open a menu
measured and placed relative to the anchor; backdrop scrim press dismisses.
Structure, behavior, and accessibility only — every visual value
(`style`) is caller-provided. State follows the
controlled + uncontrolled pattern throughout: `open` (plus
`onOpenChange`) for controlled use, `defaultOpen` for uncontrolled.
Anatomy mirrors Base UI: `ContextMenuRoot`, `ContextMenuTrigger`,
`ContextMenuPortal`, `ContextMenuBackdrop`, `ContextMenuPositioner`,
`ContextMenuPopup`, `ContextMenuItem`, `ContextMenuSeparator`,
`ContextMenuGroup`, `ContextMenuGroupLabel`, `ContextMenuArrow`.

Source of truth: `ContextMenuRootProps`, `ContextMenuRootState` in
`@xoroh/axis`
(`packages/axis/src/components/ContextMenu.tsx:56-68`).

### Install

`@xoroh/axis` is not on npm yet (version `0.0.0`; releases are
owner-gated — `docs/RELEASING.md`). Install from source with the
repo's pack-vendor script, the same flow Kern uses to vendor Axis:

```sh
git clone https://github.com/xoroh/axis.git
cd axis
bun install --frozen-lockfile
node scripts/pack-vendor.mjs --out /tmp/axis-vendor
# prints /tmp/axis-vendor/axis-<short-sha>.tgz + sha512
```

Then add the printed tarball to your app (peers `react >= 18`,
`react-native >=0.86 <0.89`):

```sh
bun add /tmp/axis-vendor/axis-<short-sha>.tgz react react-native
```

### Anatomy

| Axis part | Base UI part | Role |
| --- | --- | --- |
| `ContextMenuRoot` | `ContextMenu.Root` | State and context owner; renders no element. |
| `ContextMenuTrigger` | `ContextMenu.Trigger` | Anchor element wrapper; long-press toggles the menu. |
| `ContextMenuPortal` | `ContextMenu.Portal` | Presents floating tree at the app's `PortalHost`. |
| `ContextMenuBackdrop` | `ContextMenu.Backdrop` | Fullscreen dismiss scrim. |
| `ContextMenuPositioner` | `ContextMenu.Positioner` | Measured floating container placed relative to anchor. |
| `ContextMenuPopup` | `ContextMenu.Popup` | Menu surface container carrying `role="menu"`. |
| `ContextMenuItem` | `ContextMenu.Item` | Menu action item with `role="menuitem"`. |
| `ContextMenuSeparator` | `ContextMenu.Separator` | Visual divider with `role="separator"`. |
| `ContextMenuGroup` | `ContextMenu.Group` | Group container with `role="group"`. |
| `ContextMenuGroupLabel` | `ContextMenu.GroupLabel` | Group label with `role="presentation"`. |
| `ContextMenuArrow` | `ContextMenu.Arrow` | Optional floating pointer indicator. |

### Props

#### `ContextMenuRoot`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | Context menu compound parts. |
| `open` | `boolean` | no | — | Controlled open state. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires on open change. |
| `onDismiss` | `() => void` | no | — | Fires on scrim dismissal, before `onOpenChange(false)`. |

### Examples

Minimal compound context menu:

```tsx
import { Text } from "react-native";
import {
  ContextMenuBackdrop,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuRoot,
  ContextMenuTrigger,
} from "@xoroh/axis";

function FileRow() {
  return (
    <ContextMenuRoot>
      <ContextMenuTrigger>
        <Text>Report.pdf</Text>
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuBackdrop />
        <ContextMenuPositioner side="bottom">
          <ContextMenuPopup aria-label="File actions">
            <ContextMenuItem onSelect={() => {}}>
              <Text>Rename</Text>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => {}}>
              <Text>Delete</Text>
            </ContextMenuItem>
          </ContextMenuPopup>
        </ContextMenuPositioner>
      </ContextMenuPortal>
    </ContextMenuRoot>
  );
}
```

Controlled with placement:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  ContextMenuBackdrop,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuPortal,
  ContextMenuPositioner,
  ContextMenuRoot,
  ContextMenuTrigger,
} from "@xoroh/axis";

function ControlledRow() {
  const [open, setOpen] = useState(false);
  return (
    <ContextMenuRoot open={open} onOpenChange={setOpen}>
      <ContextMenuTrigger>
        <Text>Report.pdf</Text>
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuBackdrop />
        <ContextMenuPositioner side="bottom">
          <ContextMenuPopup aria-label="File actions">
            <ContextMenuItem onSelect={() => {}}>
              <Text>Duplicate</Text>
            </ContextMenuItem>
          </ContextMenuPopup>
        </ContextMenuPositioner>
      </ContextMenuPortal>
    </ContextMenuRoot>
  );
}
```

### Accessibility

- The menu box carries `role="menu"` and accessible label.
- The items carry `role="menuitem"` and `aria-disabled`.
- The backdrop is a pressable labelled "Dismiss menu".
- Zero legacy `accessibility*` props emitted (ADR-112 aria-only).
