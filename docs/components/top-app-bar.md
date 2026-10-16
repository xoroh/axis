## Top App Bar

Source of truth: `TopAppBarProps` in `@xoroh/axis`.

Top application header: header role, `title` (required — a header
without one is a `Toolbar`), `leading?` (navigation slot),
`actions?` (trailing slot), `accessibilityLabel?` (defaults to the
title), `testID?`, `style?`, `titleStyle?`, `ref`. No navigation
behavior, no scroll elevation, no menu handling — shell and
design-system decisions. Example: `<TopAppBar title="Inbox"
actions={<SearchButton />} />`.
