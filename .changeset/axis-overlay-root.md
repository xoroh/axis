---
"@xoroh/axis": minor
---

Native overlay root on `PortalHost`: `OverlayRoot`, `OverlayPortal`,
`OverlayBackdrop`, `OverlayPopup`, `OverlayTrigger`, `OverlayClose`
(plus the `Overlay.*` namespace), `useOverlay`, `useScrollLock`, and
the shared `getSharedOverlayModality` registry. One owner for
dismissable layers (outside press + Android back through the shared
`dismissWiring` branches), modal surfaces (accessibility-modal layer,
focus move and restore), nested stacking (monotonic `zIndex`, top
layer isolated, lower layers inert), modal scroll lock, and a presence
machine with reduced-motion handling. `Dialog`, `AlertDialog`,
`Popover`, `Menu` and `Drawer` now present through the overlay root
instead of an RN `Modal` each — stacking, dismissal and focus stop
being per-component. RN host bindings `BackHandler`,
`AccessibilityInfo` and `findNodeHandle` added to the boundary
allowlist. Needs demos for the seven Overlay parts before the
example-app demo gate passes (see `.reports/overlay-root.md`).
Not published.