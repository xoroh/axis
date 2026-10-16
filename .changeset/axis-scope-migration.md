---
"@xoroh/axis": minor
---

Scope migration (ADR 006, no-alias per ADR 011): 21
design-pattern components leave Axis for Kern M3 in one hard
cut — Badge, ButtonGroup, Card, Carousel, Chip, EmptyState,
Fab, ExtendedFab, IconButton, Kbd, LinkButton, ListItem,
LoadingButton, NavigationBar, NavigationRail, Pagination,
SettingsRow, Skeleton, SplitButton, TopAppBar, and the
NavigationDrawer alias (Drawer stays canonical). `Button`
(`loading`/busy, required-label usage) covers the icon/loading
press cases; link-look is caller styling. Nothing was
published, so no deprecation window. Not published.
