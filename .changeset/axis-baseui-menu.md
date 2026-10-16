---
"@xoroh/axis": minor
---

Base UI alignment, Menu family: compound parts (`MenuRoot`,
`MenuPortal`, `MenuBackdrop`, `MenuPositioner`, `MenuPopup`,
`MenuSeparator`) with `render` composition and value-or-function
styles; `MenuTrigger`/`MenuItem` extended in place (`render`,
anchor registration, `onClick`/`closeOnClick`, optional `value`,
`highlighted` press state) with zero monolith behavior change;
positioning model gains `align`/`alignOffset` (unit-tested);
`DialogRoot` gains consistent `onDismiss`. Parity row aligned.
Monolith `Menu` tree untouched. Not published.
