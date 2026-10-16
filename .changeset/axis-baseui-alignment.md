"@xoroh/axis": minor
---

Base UI alignment pass: `render` element/function composition plus
value-or-function `style` on every Axis part (with per-part state
types exported), `Input`/`Textarea` hard-cut to `onValueChange`
(contract §6), `AlertDialog` rebuilt on the compound Dialog parts,
`ToastProvider` + `useToast` + `ToastViewport` queue (new
`toastQueue` model, also under `./models`), standalone
`PortalHost` + `Portal` over the shared portal registry, and
`role="dialog"` on the compound `DialogPopup` (monolith parity).
RNTL suites (`renderparity`, `disclosureparity`, `toastqueue`,
`portalhost`) + `toastQueue` unit tests; parity record updated.
Not published.
