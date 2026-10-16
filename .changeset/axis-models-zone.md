---
"@xoroh/axis": minor
---

Universal models zone: new `@xoroh/axis/models` subpath exporting
every behavior model and hook with no `react-native` in its
transitive closure (boundary-gated, mirrors the barrel's model
sections exactly). Web consumers import models without pulling
the native runtime. Not published.
