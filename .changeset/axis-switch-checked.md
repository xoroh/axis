---
"@xoroh/axis": minor
---

Critic decision (Base UI state props, exactly): `Switch` moves
from `value`/`defaultValue`/`onValueChange` to
`checked`/`defaultChecked`/`onCheckedChange`. The old spellings
still work with a warn-once deprecation (both handlers fire;
canonical wins) until removal after one minor. Contract §6 now
states the per-control naming rule; parity rows added for
Switch/Checkbox/Toggle (all aligned). Not published.
