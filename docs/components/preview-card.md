## Preview Card

Rich destination preview popup triggered by link interaction (hover, focus, or touch press):
displays destination details and rich metadata without disrupting screen reader navigation.
Structure, behavior, and accessibility only — every visual value is caller-provided.
State follows the controlled + uncontrolled pattern: `open` (+ `onOpenChange`) for controlled use,
`defaultOpen` for uncontrolled.

Anatomy mirrors Base UI: `PreviewCardRoot`, `PreviewCardTrigger`, `PreviewCardPortal`,
`PreviewCardBackdrop`, `PreviewCardPositioner`, `PreviewCardPopup`, `PreviewCardArrow`.

Source of truth: `PreviewCardRootProps`, `PreviewCardRootState` in
`@xoroh/axis`
(`packages/axis/src/components/PreviewCard.tsx:56-68`).

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
| `PreviewCardRoot` | `PreviewCard.Root` | State and delay timer owner; renders no element. |
| `PreviewCardTrigger` | `PreviewCard.Trigger` | Anchor link or pressable trigger. |
| `PreviewCardPortal` | `PreviewCard.Portal` | Presents preview popup at the app's `PortalHost`. |
| `PreviewCardBackdrop` | `PreviewCard.Backdrop` | Optional dismiss scrim. |
| `PreviewCardPositioner` | `PreviewCard.Positioner` | Measured floating container placed relative to anchor. |
| `PreviewCardPopup` | `PreviewCard.Popup` | Popup card container carrying `role="region"`. |
| `PreviewCardArrow` | `PreviewCard.Arrow` | Optional floating pointer indicator. |

### Props

#### `PreviewCardRoot`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | yes | — | Preview card compound parts. |
| `open` | `boolean` | no | — | Controlled open state. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial open state. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires on open change. |
| `delay` | `number` | no | `600` | Open delay in milliseconds. |
| `closeDelay` | `number` | no | `300` | Close delay in milliseconds. |

### Examples

Minimal compound preview card:

```tsx
import { Text } from "react-native";
import {
  PreviewCardBackdrop,
  PreviewCardPopup,
  PreviewCardPortal,
  PreviewCardPositioner,
  PreviewCardRoot,
  PreviewCardTrigger,
} from "@xoroh/axis";

function LinkPreview() {
  return (
    <PreviewCardRoot>
      <PreviewCardTrigger>
        <Text>Hover me</Text>
      </PreviewCardTrigger>
      <PreviewCardPortal>
        <PreviewCardBackdrop />
        <PreviewCardPositioner side="bottom">
          <PreviewCardPopup aria-label="Link preview">
            <Text>Preview destination details</Text>
          </PreviewCardPopup>
        </PreviewCardPositioner>
      </PreviewCardPortal>
    </PreviewCardRoot>
  );
}
```

Controlled preview card:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import {
  PreviewCardBackdrop,
  PreviewCardPopup,
  PreviewCardPortal,
  PreviewCardPositioner,
  PreviewCardRoot,
  PreviewCardTrigger,
} from "@xoroh/axis";

function ControlledPreview() {
  const [open, setOpen] = useState(false);
  return (
    <PreviewCardRoot open={open} onOpenChange={setOpen}>
      <PreviewCardTrigger>
        <Text>Destination link</Text>
      </PreviewCardTrigger>
      <PreviewCardPortal>
        <PreviewCardBackdrop />
        <PreviewCardPositioner side="bottom">
          <PreviewCardPopup aria-label="Destination preview">
            <Text>Card contents...</Text>
          </PreviewCardPopup>
        </PreviewCardPositioner>
      </PreviewCardPortal>
    </PreviewCardRoot>
  );
}
```

### Accessibility

- The popup carries `role="region"` with accessible label.
- Screen readers treat the trigger as an anchor or button.
- Zero legacy `accessibility*` props emitted (ADR-112 aria-only).
