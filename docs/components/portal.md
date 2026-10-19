## Portal

Standalone native portal host (rn-primitives `Portal` /
`PortalHost` parity, Base UI `Portal` counterpart). `PortalHost`
owns a `createPortalRegistry` (the shared model: which overlay
ids are mounted, in what order — unmount removes exactly one)
plus the nodes per id, and paints registered nodes at the
host's location in mount order. `Portal` declares content
anywhere under the host; the content renders at the host, not
where it is declared. Structure and mount behavior only — every
visual value (`style`) is caller-provided.

Source of truth: `PortalHostProps`, `PortalProps` in
`@xoroh/axis` (`packages/axis/src/components/Portal.tsx:57-200`).

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
| `PortalHost` | `Portal` (host side) | App-level host: named hosts (`name`), registry-ordered painting, `render` substitution. |
| `Portal` | `Portal` (content side) | Declares content anywhere under the host; renders at the host, not where declared. |

Omitted Base UI pieces are documented deviations, not
oversights: no `container` (no native meaning — parity D2), no
`keepMounted` (D3), no `data-*` attributes (D1) — all recorded
in `docs/BASE_UI_PARITY.md` (§ Portal — aligned).

### Overlay hosting

`PortalHost` is the ground `OverlayPortal` paints on: the
overlay families (`Select` and `Menu` compound with `modal`,
`Dialog` compound, `Popover` compound with
`modal`, `Drawer`) present through `OverlayRoot` +
`OverlayPortal` at the app's host — one root presents every
layer, so Android back, stacking, dismissal, and focus belong to
one owner (see `docs/components/overlay.md`). The RN `Modal`
host survives only where a platform guarantee needs it: the
`useModal` opt-in on direct `OverlayRoot` compositions (every
family, `Drawer` included, presents through the overlay stack).
The host owns ordering and mount state, not root
presentation. A `Portal` with no matching host renders its
children inline rather than dropping them silently.

### Props

#### `PortalHost`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `name` | `string` | no | — | Host name. A `Portal` with the same `hostName` renders here; a `Portal` with no `hostName` renders into the nearest unnamed host. Omitted is the default host. |
| `children` | `ReactNode` | no | — | Content around (and including) the portals that target this host. |
| `testID` | `string` | no | — | Test identifier, forwarded to the host container. |
| `style` | `StyleProp<ViewStyle>` | no | — | Host container style, caller-provided (static — host chrome carries no state). |
| `render` | `RenderProp<Record<string, never>, SlotProps>` | no | — | Element or function substitution for the host container; portaled nodes travel in the props as `children` after the declared children. The function form receives an empty state object. |
| `ref` | `Ref<ElementRef<typeof View>>` | no | — | Forwarded to the host container `View`. |

Matching scopes to the nearest host: a named `Portal` renders
into the nearest host with the same name; nesting hosts scopes
matching. The host paints in-box — portaled content lays out
inside the host's box.

#### `Portal`

| Prop | Type | Required | Default | Behavior |
|---|---|---|---|---|
| `hostName` | `string` | no | — | Target host name. Omitted targets the nearest unnamed (default) host. No matching host renders the children inline — never silently dropped. |
| `children` | `ReactNode` | no | — | Content painted at the host. |

### Examples

Default host near the app root, content declared anywhere under
it:

```tsx
import { Text } from "react-native";
import { Portal, PortalHost } from "@xoroh/axis";

function App() {
  return (
    <PortalHost>
      <Text>App</Text>
      <Portal>
        <Text>Painted at the host</Text>
      </Portal>
    </PortalHost>
  );
}
```

Named host (a panel zone paints separately from the default
host):

```tsx
import { Text } from "react-native";
import { Portal, PortalHost } from "@xoroh/axis";

function Hosts() {
  return (
    <PortalHost name="panel">
      <Text>Panel zone</Text>
      <Portal hostName="panel">
        <Text>Panel content</Text>
      </Portal>
    </PortalHost>
  );
}
```

Host with substituted container (portaled nodes travel as
`children` after the declared children):

```tsx
import { Text, View } from "react-native";
import { Portal, PortalHost } from "@xoroh/axis";

function FramedHost() {
  return (
    <PortalHost
      testID="overlay-host"
      render={<View style={{ flex: 1 }} />}
    >
      <Text>App</Text>
      <Portal>
        <Text>Painted inside the framed host</Text>
      </Portal>
    </PortalHost>
  );
}
```

### Accessibility

- The host and its portals carry no roles, labels, or states of
  their own: they are pure mount points, and content keeps
  whatever accessibility semantics it declares.
- Closed or unmounted overlays paint nothing at the host — no
  scrim, no surface, for assistive tech or tests to find.
- Top-layer isolation (`accessibilityViewIsModal`,
  `accessibilityElementsHidden`, pointer-event gating) belongs
  to the `OverlayPortal` layer painted here, not to the host
  itself (see `docs/components/overlay.md`).

### Composition

`PortalHost` takes `render` (an element, cloned with the host
props merged under its own, or a `(props, state)` function with
an empty state object); host `style` stays static (host chrome
carries no state). `data-*` attributes are deliberately absent
on native — state flows through those functions instead
(contract §11, parity D1). Verified by the portal RNTL suites
(7 tests — `docs/COVERAGE.md`). Renders in
`apps/example/src/demos/overlays.tsx`.
