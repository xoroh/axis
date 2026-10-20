---
"@xoroh/axis": patch
---

First-class polish for the public package: `resolvePortalTarget` no
longer falls back to an internal brand name — the default target is
now `axis-portal-root`. Comments and docs drop internal project
naming. Package discovery improves: expanded keywords, the project
homepage (`https://axis.xoroh.org`), and a declared published file
set (`dist`, README, LICENSE). The install docs note that Yarn
Classic installs peer dependencies only when you list them
explicitly.
