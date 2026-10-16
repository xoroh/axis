/**
 * `@xoroh/axis` — design-system-neutral, native-first behavior primitives.
 *
 * Provenance: `time` and `useControllableState` transfer from
 * `xoroh/kern` (`libs/kern-primitives`) as the first extraction slice:
 * pure, renderer-agnostic behavior with no token, DOM, or platform
 * imports. Later slices add overlay, focus, dismissal, and gesture
 * models with native bindings per `docs/architecture/axis-contract.md`
 * in Kern. No symbol transfers without a consumer or an explicit gate.
 *
 * Boundary (enforced by review + CI): nothing here imports design-system
 * code, token packages, or web-only APIs.
 */

export {
  formatTimeValue,
  minutesForStep,
  normalizeTimeValue,
  type TimePickerFormat,
  type TimePickerValue,
  toTwentyFourHour,
} from "./time";
export { type StateAction, useControllableState } from "./useControllableState";
