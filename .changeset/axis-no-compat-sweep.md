---
"@xoroh/axis": minor
---

No-compat sweep (owner rule, ADR 011): removed the `Switch`
`value`/`defaultValue`/`onValueChange` warn-once aliases —
canonical `checked`/`defaultChecked`/`onCheckedChange` only.
Nothing was published, so nobody migrates. The
controlled↔uncontrolled misuse warning stays (real dev need,
React precedent) with its stale vendor prefix corrected.
Not published.
