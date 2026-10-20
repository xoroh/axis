## Toast

Transient notification compound family with timed auto-dismiss: structure and
accessibility only — every visual value is caller-provided. State follows the
controlled + uncontrolled pattern: `open` (+ `onOpenChange`) for controlled use,
`defaultOpen` for uncontrolled.

Anatomy mirrors Base UI: `ToastProvider`, `ToastViewport`, `ToastPortal`,
`ToastRoot`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`.
A queue model (`ToastProvider` + `useToast` + `ToastViewport`) coordinates
multiple concurrent toasts.

Source of truth: `ToastRootProps`, `ToastRootState` in
`@xoroh/axis`
(`packages/axis/src/components/Toast.tsx:56-82`).

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
| `ToastProvider` | `Toast.Provider` | Owns the queue; renders no element. |
| `useToast()` | `toast.add()` | Adds, dismisses, and clears queued toasts from anywhere under the provider. |
| `ToastViewport` | `Toast.Viewport` | Paints queued toasts, oldest-first. |
| `ToastPortal` | `Toast.Portal` | Optional portal presentation wrapper. |
| `ToastRoot` | `Toast.Root` | One notification surface: timed auto-dismiss, live region. |
| `ToastTitle` | `Toast.Title` | Notification title heading. |
| `ToastDescription` | `Toast.Description` | Notification message text. |
| `ToastAction` | `Toast.Action` | Interactive action button (e.g. "Undo"). |
| `ToastClose` | `Toast.Close` | Dismiss button. |

### Props

#### `ToastRoot` (single notification)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled visibility. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial visibility. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next visibility on every committed open/close. |
| `duration` | `number` | no | `4000` | Auto-dismiss delay in milliseconds. `0` or less disables the timer. |
| `onDismiss` | `() => void` | no | — | Fires before closing when dismissed. |
| `children` | `ReactNode` | no | — | Compound toast parts or content. |
| `"aria-label"` | `string` | no | — | Accessible name source for the toast surface. |
| `style` | `StateStyle<ToastRootState, StyleProp<ViewStyle>>` | no | — | Surface style. |
| `testID` | `string` | no | — | Test identifier. |
| `render` | `RenderProp<ToastRootState, SlotProps>` | no | — | Element or function substitution. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the toast surface `View`. |

`ToastRootState`: `{ open: boolean }`.

#### `ToastProvider`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | App content. Toasts paint wherever `ToastViewport` sits. |

#### `useToast()` — the manager

Returns a `ToastManager` (throws outside a `ToastProvider`):

| Method | Signature | Behavior |
|---|---|---|
| `add` | `(options: ToastOptions) => string` | Queues a toast; returns its id for targeted dismissal. |
| `dismiss` | `(id: string) => void` | Dismisses one queued toast. Unknown ids are a no-op. |
| `clear` | `() => void` | Dismisses every queued toast. |

#### `ToastViewport`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `limit` | `number` | no | — (no limit) | Maximum visible toasts; older toasts beyond the limit stay queued but unpainted. |
| `style` | `StateStyle<ToastViewportState, StyleProp<ViewStyle>>` | no | — | Container style. |
| `testID` | `string` | no | — | Test identifier. |
| `render` | `RenderProp<ToastViewportState, SlotProps>` | no | — | Element or function substitution. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to container `View`. |

### Examples

Single toast with compound action:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Button, ToastAction, ToastDescription, ToastRoot } from "@xoroh/axis";

function SavedNotice() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button aria-label="Save" onPress={() => setOpen(true)}>
        <Text>Save</Text>
      </Button>
      <ToastRoot
        open={open}
        onOpenChange={setOpen}
        duration={4000}
        style={{ padding: 12, flexDirection: "row", gap: 8 }}
      >
        <ToastDescription>Saved</ToastDescription>
        <ToastAction onPress={() => setOpen(false)}>
          Undo
        </ToastAction>
      </ToastRoot>
    </>
  );
}
```

Single toast, uncontrolled with timer disabled:

```tsx
import { ToastDescription, ToastRoot } from "@xoroh/axis";

function PersistentHint() {
  return (
    <ToastRoot defaultOpen duration={0} aria-label="Hint">
      <ToastDescription>Press and hold any row for options</ToastDescription>
    </ToastRoot>
  );
}
```

App-level queue (Base UI Provider + Viewport pattern):

```tsx
import { Text } from "react-native";
import { Button, ToastProvider, ToastViewport, useToast } from "@xoroh/axis";

function ToastDemo() {
  return (
    <ToastProvider>
      <CopyButton />
      <ToastViewport limit={2} />
    </ToastProvider>
  );
}

function CopyButton() {
  const toast = useToast();
  return (
    <Button
      aria-label="Copy to clipboard"
      onPress={() => {
        toast.add({ message: "Copied", actionLabel: "Undo" });
      }}
    >
      <Text>Copy</Text>
    </Button>
  );
}
```

### Accessibility

- The toast surface carries `role="status"` and `aria-live="polite"`, so
  the message is announced on appearance without stealing focus.
- The action button carries `role="button"` and accessible name.
- Zero legacy `accessibility*` props emitted (ADR-112 aria-only).
