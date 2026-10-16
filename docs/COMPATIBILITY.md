# Compatibility evidence

Honestly labeled: what the supported ranges rest on, and what has
actually been exercised. (Moved here from the package README during
the Q7 split so the short README stays short — no content dropped.)

Peers: `react >= 18` (behavior modules are pure React and run
anywhere React runs); rendered components additionally need
`react-native >=0.86 <0.89` (D-STACK support policy).

- Declared supported: `react-native >=0.86 <0.89`, React 19, Expo 57
  host (peer ranges + D-STACK).
- Exercised by automation: jest + RN preset on `react-native
  0.87.1`; shipped-artifact bundle export on the Expo 57 host
  (React Native 0.86.3). Untested versions inside the range are
  untested — the range is policy, not proof.
- Not performed: emulator, simulator, physical-device, or
  screen-reader validation.
