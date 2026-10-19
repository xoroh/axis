# `@xoroh/axis`

Design-system-neutral, native-first behavior and interaction primitives
for React Native — the counterpart of Base UI for native. Composable
state models, hooks, and unstyled rendered components with no token
reads, no styling, and no web-only APIs.

Axis is independent and standalone: it never depends on Kern, Kern
tokens, or any design system, and it is usable without Kern.
Design-system variants (Material, Astryx, …) live in the consuming
system, never here.

## Install

```sh
bun add @xoroh/axis react react-native
```

Nothing is published yet (version `0.0.0`; releases are owner-gated
— see [`docs/RELEASING.md`](https://github.com/xoroh/axis/blob/main/docs/RELEASING.md)).
Until the first release, install from source with the same
pack-vendor flow Kern uses to vendor Axis:

```sh
git clone https://github.com/xoroh/axis.git && cd axis
bun install --frozen-lockfile
node scripts/pack-vendor.mjs --out /tmp/axis-vendor
# prints /tmp/axis-vendor/axis-<short-sha>.tgz + sha512 — add it
# in your app: bun add /tmp/axis-vendor/axis-<short-sha>.tgz
```

Peers: `react >= 18`; rendered components additionally need
`react-native >=0.86 <0.89` (D-STACK support policy). The behavior
modules (`useControllableState`, `normalizeTimeValue`, …) are pure
React and run anywhere React runs.

## Usage

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { DialogRoot, DialogTrigger, DialogPortal, DialogPopup } from "@xoroh/axis";

function Example() {
  return (
    <DialogRoot>
      <DialogTrigger>
        <Text>Open</Text>
      </DialogTrigger>
      <DialogPortal>
        <DialogPopup accessibilityLabel="Example dialog">
          <Text>Hello</Text>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
```

Only the documented public entry (`.`) is supported. Deep imports are
not part of the contract.

## Components

Per-component notes (props, examples, accessibility) live in
[`docs/components/`](https://github.com/xoroh/axis/tree/main/docs/components):

<!-- index:begin -->
| [Accordion](https://github.com/xoroh/axis/blob/main/docs/components/accordion.md) |
| [Alert Dialog](https://github.com/xoroh/axis/blob/main/docs/components/alert-dialog.md) |
| [Aspect Ratio](https://github.com/xoroh/axis/blob/main/docs/components/aspect-ratio.md) |
| [Autocomplete](https://github.com/xoroh/axis/blob/main/docs/components/autocomplete.md) |
| [Avatar](https://github.com/xoroh/axis/blob/main/docs/components/avatar.md) |
| [Button](https://github.com/xoroh/axis/blob/main/docs/components/button.md) |
| [Checkbox](https://github.com/xoroh/axis/blob/main/docs/components/checkbox.md) |
| [Checkbox Group](https://github.com/xoroh/axis/blob/main/docs/components/checkbox-group.md) |
| [Collapsible](https://github.com/xoroh/axis/blob/main/docs/components/collapsible.md) |
| [Combobox](https://github.com/xoroh/axis/blob/main/docs/components/combobox.md) |
| [Context Menu](https://github.com/xoroh/axis/blob/main/docs/components/context-menu.md) |
| [Dialog](https://github.com/xoroh/axis/blob/main/docs/components/dialog.md) |
| [Drawer](https://github.com/xoroh/axis/blob/main/docs/components/drawer.md) |
| [Dropdown Menu](https://github.com/xoroh/axis/blob/main/docs/components/dropdown-menu.md) |
| [Field](https://github.com/xoroh/axis/blob/main/docs/components/field.md) |
| [Fieldset](https://github.com/xoroh/axis/blob/main/docs/components/fieldset.md) |
| [Form](https://github.com/xoroh/axis/blob/main/docs/components/form.md) |
| [Input](https://github.com/xoroh/axis/blob/main/docs/components/input.md) |
| [Label](https://github.com/xoroh/axis/blob/main/docs/components/label.md) |
| [Menu](https://github.com/xoroh/axis/blob/main/docs/components/menu.md) |
| [Menubar](https://github.com/xoroh/axis/blob/main/docs/components/menubar.md) |
| [Meter](https://github.com/xoroh/axis/blob/main/docs/components/meter.md) |
| [Navigation Menu](https://github.com/xoroh/axis/blob/main/docs/components/navigation-menu.md) |
| [Number Field](https://github.com/xoroh/axis/blob/main/docs/components/number-field.md) |
| [OTP Field](https://github.com/xoroh/axis/blob/main/docs/components/otp-field.md) |
| [Overlay](https://github.com/xoroh/axis/blob/main/docs/components/overlay.md) |
| [Popover](https://github.com/xoroh/axis/blob/main/docs/components/popover.md) |
| [Portal](https://github.com/xoroh/axis/blob/main/docs/components/portal.md) |
| [Progress](https://github.com/xoroh/axis/blob/main/docs/components/progress.md) |
| [Radio Group](https://github.com/xoroh/axis/blob/main/docs/components/radio-group.md) |
| [Select](https://github.com/xoroh/axis/blob/main/docs/components/select.md) |
| [Separator](https://github.com/xoroh/axis/blob/main/docs/components/separator.md) |
| [Slider](https://github.com/xoroh/axis/blob/main/docs/components/slider.md) |
| [Switch](https://github.com/xoroh/axis/blob/main/docs/components/switch.md) |
| [Table](https://github.com/xoroh/axis/blob/main/docs/components/table.md) |
| [Tabs](https://github.com/xoroh/axis/blob/main/docs/components/tabs.md) |
| [Toast](https://github.com/xoroh/axis/blob/main/docs/components/toast.md) |
| [Toggle](https://github.com/xoroh/axis/blob/main/docs/components/toggle.md) |
| [Toggle Group](https://github.com/xoroh/axis/blob/main/docs/components/toggle-group.md) |
| [Toolbar](https://github.com/xoroh/axis/blob/main/docs/components/toolbar.md) |
| [Tooltip](https://github.com/xoroh/axis/blob/main/docs/components/tooltip.md) |
<!-- index:end -->

## Docs

- [`docs/COMPONENT_CONTRACT.md`](https://github.com/xoroh/axis/blob/main/docs/COMPONENT_CONTRACT.md) —
  what a component is, and the rules every slice follows.
- [`docs/BASE_UI_PARITY.md`](https://github.com/xoroh/axis/blob/main/docs/BASE_UI_PARITY.md) —
  per-component Base UI parity with documented native deviations.
- [`docs/COVERAGE.md`](https://github.com/xoroh/axis/blob/main/docs/COVERAGE.md) —
  the component coverage inventory.
- [`docs/COMPATIBILITY.md`](https://github.com/xoroh/axis/blob/main/docs/COMPATIBILITY.md) —
  what the supported ranges rest on, honestly labeled.
- [`docs/RELEASING.md`](https://github.com/xoroh/axis/blob/main/docs/RELEASING.md) —
  manual releases only; nothing is published yet.

## Compatibility

- Declared supported: `react-native >=0.86 <0.89`, React 19, Expo 57
  host (peer ranges + D-STACK).
- Exercised by automation: jest + RN preset; shipped-artifact bundle
  export on the Expo 57 host. Untested versions inside the range are
  untested — the range is policy, not proof.
- Not performed: emulator, simulator, physical-device, or
  screen-reader validation.
