## Pagination

Source of truth: `PaginationProps` in `@xoroh/axis`.

Bounded page navigator: `page?`, `defaultPage?` (default 1),
`pageCount?` (below 1 collapses to one page),
`onPageChange?`, `disabled?`, `accessibilityLabel?`, `testID?`,
`style?`, `children?` (page indicator, e.g. "3 of 12"),
`previousLabel?`/`nextLabel?` (default "Previous/Next page"),
`ref` (container). At bounds the corresponding control disables
itself. Page arithmetic beyond clamp belongs to the caller. All
optional.
