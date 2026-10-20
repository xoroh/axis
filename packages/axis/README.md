# `@xoroh/axis`

Unstyled, accessible UI components and native interaction primitives for React Native.

Axis provides composable state models, hooks, and unstyled rendered components with complete control over styling, full accessibility support, and native-first behavior — with zero CSS assumptions, no design system opinions, and no web-only API leaks.

- **Unstyled & headless:** You have 100% control over layout, styling, and design system integration.
- **Native-first accessibility:** Built specifically around React Native's accessibility model (`aria-*`, roles, focus order, announcements).
- **Separation of concerns:** Pure state models live in `@xoroh/axis/models` (pure TypeScript/JS, no React Native runtime dependency). Rendered components live in `@xoroh/axis`.

## Scope and independence

Axis is standalone and design-system neutral: it contains no hardcoded tokens, themes, or styling rules. Any design system or visual theme can be built on top of Axis primitives.

## Install

```sh
bun add @xoroh/axis react react-native
# or
npm install @xoroh/axis react react-native
```

Peers: `react >= 18`; rendered components additionally need `react-native >=0.86 <0.89`. State models and behavior modules under `@xoroh/axis/models` are pure JavaScript and run anywhere React/Node/Web runs.

## Usage

```tsx
import { useState } from "react";
import { Text, StyleSheet } from "react-native";
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogPopup,
  DialogBackdrop,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@xoroh/axis";

export function ExampleDialog() {
  const [open, setOpen] = useState(false);

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogTrigger style={styles.button}>
        <Text style={styles.buttonText}>Open Dialog</Text>
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop style={styles.backdrop} />
        <DialogPopup style={styles.popup} aria-label="Example dialog">
          <DialogTitle style={styles.title}>Edit profile</DialogTitle>
          <DialogDescription style={styles.description}>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
          <DialogClose style={styles.closeButton}>
            <Text>Done</Text>
          </DialogClose>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}

const styles = StyleSheet.create({
  button: { padding: 12, borderRadius: 8, backgroundColor: "#007AFF" },
  buttonText: { color: "#FFF", fontWeight: "600" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  popup: { margin: 24, padding: 24, borderRadius: 12, backgroundColor: "#FFF" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  description: { fontSize: 14, color: "#666", marginBottom: 16 },
  closeButton: { alignSelf: "flex-end", padding: 8 },
});
```

For Node.js environments or tests outside React Native view trees:

```ts
import { createDialogMachine, normalizeTimeValue } from "@xoroh/axis/models";
```

## Components

The package provides 43 native component primitives:

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
| [Direction Provider](https://github.com/xoroh/axis/blob/main/docs/components/direction-provider.md) |
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
| [Preview Card](https://github.com/xoroh/axis/blob/main/docs/components/preview-card.md) |
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

- [`docs/VISION.md`](https://github.com/xoroh/axis/blob/main/docs/VISION.md) — north star, design principles, non-goals, quality bar.
- [`docs/COMPONENT_CONTRACT.md`](https://github.com/xoroh/axis/blob/main/docs/COMPONENT_CONTRACT.md) — slice rules and component invariants.
- [`docs/BASE_UI_PARITY.md`](https://github.com/xoroh/axis/blob/main/docs/BASE_UI_PARITY.md) — Base UI parity mapping and native adaptations.
- [`docs/COVERAGE.md`](https://github.com/xoroh/axis/blob/main/docs/COVERAGE.md) — full component matrix across all 43 components.

## Compatibility

- React >= 18
- React Native >= 0.86 < 0.89 (New Architecture / bridgeless compatible)
- Works seamlessly across iOS, Android, and React Native Web.
