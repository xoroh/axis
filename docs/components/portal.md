## Portal

Source of truth: `PortalHostProps` / `PortalProps` in `@xoroh/axis`.

Standalone native portal host (rn-primitives `Portal` / `PortalHost`
parity, Base UI `Portal` counterpart). `PortalHost` (optional `name`,
`testID?`, `style?`, `render?`, `ref?`) owns a `createPortalRegistry`
plus the nodes per id and paints registered nodes at the host in
mount order. `Portal` (`hostName?`, `children?`) declares content
anywhere under the host; it renders at the host, not where declared.
A `Portal` with no `hostName` targets the nearest unnamed (default)
host; a named one targets the nearest host with the same name. A
`Portal` with no matching host renders its children inline rather
than dropping them silently.

Native scope: the host paints in-box — portaled content lays out
inside the host's box (the `Menu` precedent). Painting above the app
root stays each overlay's own `Modal` (Dialog, Drawer, Sheet); the
host owns ordering and mount state, not root presentation.
`container` has no native meaning (parity-record D2); `keepMounted`
stays omitted (D3).

### Composition

Every part takes `render` (element or `(props, state)` function);
parts with interaction state take value-or-function `style`, while
stateless parts keep a static `style` (the `DialogTitle` precedent).
`data-*` attributes are deliberately absent on native — state flows
through those functions instead (contract §11). See
`docs/BASE_UI_PARITY.md` for the per-family parity record.
