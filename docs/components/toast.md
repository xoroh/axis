## Toast

Transient notification with timed auto-dismiss. A single `ToastRoot`
renders `null` when closed and a polite live region when open; an
app-level queue (`ToastProvider` + `useToast` + `ToastViewport`)
adds toasts from anywhere and paints them oldest-first. No default
visuals — every visual value (`style`) is caller-provided. No
animation: presence is binary.

Source of truth: `ToastRootProps`, `ToastViewportProps`, `ToastOptions`,
`ToastManager` in `@xoroh/axis`.

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
| `ToastViewport` | `Toast.Viewport` | Paints one single-shot `ToastRoot` per queued id, oldest-first. |
| `ToastRoot` | `Toast.Root` | One notification: message, optional action, timed auto-dismiss. |

Base UI's separate `Title`/`Description`/`Action`/`Close` parts are
mapped, not mirrored: `children` composes the title/description
text (caller text in the live region), `actionLabel`/`onAction` is
the action, and timed auto-dismiss is the close behavior. Kern's M3
Snackbar is a separate styled component in Kern — never conflate
the two.

### Props

#### `ToastRoot` (single notification)

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `open` | `boolean` | no | — | Controlled visibility. Wins over `defaultOpen` when defined. |
| `defaultOpen` | `boolean` | no | `false` | Uncontrolled initial visibility. |
| `onOpenChange` | `(open: boolean) => void` | no | — | Fires with the next visibility on every committed open/close (including timer expiry and action press). |
| `duration` | `number` | no | `4000` | Auto-dismiss delay in milliseconds. `0` or less disables the timer — the toast stays open until the parent closes it or the action fires. The timer clears on close, on `duration` change, and on unmount. |
| `children` | `ReactNode` | no | — | Message content. |
| `actionLabel` | `string` | no | — | Action button label. The action button renders only when this is provided — no label, no action button. |
| `onAction` | `() => void` | no | — | Fires when the action button is pressed; the toast dismisses as part of the same press. |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the toast surface. |
| `style` | `StateStyle<ToastRootState, StyleProp<ViewStyle>>` | no | — | Surface style: a value or a function of toast state. |
| `testID` | `string` | no | — | Test identifier, forwarded to the surface. |
| `render` | `RenderProp<ToastRootState, SlotProps>` | no | — | Element or function substitution (Base UI parity). |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the toast surface `View`. |

`ToastRootState`: `{ open: boolean }`.

#### `ToastProvider`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `children` | `ReactNode` | no | — | App content. Toasts paint wherever `ToastViewport` sits. |

The provider owns state, never layout: it renders no element of its
own.

#### `useToast()` — the manager

Returns a `ToastManager` (throws outside a `ToastProvider` — a
manager with no queue would silently drop toasts):

| Method | Signature | Behavior |
|---|---|---|
| `add` | `(options: ToastOptions) => string` | Queues a toast; returns its id for targeted dismissal. |
| `dismiss` | `(id: string) => void` | Dismisses one queued toast. Unknown ids are a no-op. |
| `clear` | `() => void` | Dismisses every queued toast. |

`ToastOptions` (the `add` payload):

| FieldRoot | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `message` | `ReactNode` | yes | — | Message content rendered inside the queued toast. |
| `actionLabel` | `string` | no | — | Action button label. No label, no action button. |
| `onAction` | `() => void` | no | — | Fires when the action button is pressed (the toast dismisses too). |
| `accessibilityLabel` | `string` | no | — | Accessible name source for the toast surface. |
| `duration` | `number` | no | `4000` | Auto-dismiss delay in milliseconds; `0` or less disables it. |

#### `ToastViewport`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `limit` | `number` | no | — (no limit) | Maximum visible toasts; older toasts beyond the limit stay queued but unpainted. |
| `style` | `StateStyle<ToastViewportState, StyleProp<ViewStyle>>` | no | — | Container style: a value or a function of viewport state. |
| `testID` | `string` | no | — | Test identifier; each painted toast also gets `${testID}-${id}`. |
| `render` | `RenderProp<ToastViewportState, SlotProps>` | no | — | Element or function substitution for the container; queued toasts arrive as `children`. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the viewport container `View`. |

`ToastViewportState`: `{ count: number }` — the number of queued
toasts (not just painted ones). Outside a `ToastProvider` the
viewport renders nothing rather than an unbacked container.

### Examples

Single toast, controlled by the parent, with an action:

```tsx
import { useState } from "react";
import { Text } from "react-native";
import { Button, ToastRoot } from "@xoroh/axis";

function SavedNotice() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button accessibilityLabel="Save" onPress={() => setOpen(true)}>
        <Text>Save</Text>
      </Button>
      <ToastRoot
        open={open}
        onOpenChange={setOpen}
        duration={4000}
        actionLabel="Undo"
        onAction={() => setOpen(false)}
        style={{ padding: 12, flexDirection: "row", gap: 8 }}
      >
        Saved
      </ToastRoot>
    </>
  );
}
```

Single toast, uncontrolled with the timer disabled (`duration={0}`
keeps it until the parent hides it or the action fires):

```tsx
import { ToastRoot } from "@xoroh/axis";

function PersistentHint() {
  return (
    <ToastRoot defaultOpen duration={0} accessibilityLabel="Hint">
      Press and hold any row for options
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
      accessibilityLabel="Copy to clipboard"
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

- The toast surface carries `accessibilityLiveRegion="polite"`, so
  the message is announced on appearance without stealing focus.
- No `accessibilityRole="alert"` by design: the live region alone
  covers the announcement; callers needing a stronger semantic wrap
  the message themselves.
- The action button carries `accessibilityRole="button"` with its
  `actionLabel` as the accessible name.
- Each queued toast is its own polite live region; `limit` only
  caps painting — over-limit toasts stay queued and announce when
  painted.

### Composition

`ToastRoot` and `ToastViewport` take `render` (an element, cloned with
the part props merged under its own, or a `(props, state)` function)
and state-driven `style` over `{ open }` / `{ count }`;
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11, parity D1). The
provider/queue/viewport mapping, the omitted `Title`/`Description`/
`Close`/`Action` parts, and the no-animation deviation are recorded
in `docs/BASE_UI_PARITY.md` (§ ToastRoot — aligned). Verified by the
toast RNTL suites (single-shot + queue — `docs/COVERAGE.md`).
