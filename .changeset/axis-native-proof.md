---
"@xoroh/axis": minor
---

Native verification slice: jest with the React Native preset mirroring
kern-native's runner, four `*.rntest.tsx` behavior suites (12 tests:
controllable state, selection, press binding, overlay stack, portal
registry, floating-rect math) proving the public entry in the RN
runtime, and a boundary-gate extension requiring native proofs to
consume `./index` only. `collection` and `mergeRefs` remain gated
(audits recorded in Kern: no native collection-state holder, zero
replaceable ref-merge duplication). Not published.
