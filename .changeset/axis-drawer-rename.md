---
"@xoroh/axis": minor
---

Owner Q5 decision (Base UI naming): the edge-anchored panel is
`Drawer`; `NavigationDrawer` stays as a warn-once deprecated
alias until removal. `Sheet` is untouched — detents, snap index,
and drag-to-snap make it a genuinely different primitive, not an
alias (recorded in the component header and README). RNTL suite
gains the alias test; README/COVERAGE updated. Not published.
