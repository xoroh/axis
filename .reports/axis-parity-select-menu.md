# Report — Base UI Parity for Select, Combobox, Tooltip, and Menu Filter

Date: 2026-10-17. Branch: `feat/axis-parity-select-menu` in worktree `/tmp/opencode/axis-parity-select`.
PR: https://github.com/xoroh/axis/pull/57 (open only, no merge).

## Outcome

Delivered Base UI parity for Select, Combobox, Tooltip, and Menu filtering:
- New pure TypeScript models in `./models` (zero React Native dependency):
  - `collection`: item registry and default case-insensitive substring matching (`defaultCollectionMatch`).
  - `typeahead`: character-by-character typeahead matching with debounce and query wrap.
- Compound component anatomy:
  - `Select`: `SelectRoot` (items label lookup table, value + open state, modal default true), `SelectTrigger`, `SelectValue`, `SelectPortal` (RN `Modal` host), `SelectBackdrop`, `SelectPositioner` (floating placement), `SelectPopup`, `SelectArrow`, `SelectItem` (extended with `label`, touch highlight, collection registration, indicator context), `SelectItemText`, `SelectItemIndicator`, `SelectGroup`, `SelectGroupLabel`, `SelectSeparator`.
  - `Tooltip`: `TooltipProvider` (shared delay group), `TooltipRoot`, `TooltipTrigger` (`delayLongPress`), `TooltipPortal` (in-box host), `TooltipPositioner`, `TooltipPopup`, `TooltipArrow`.
  - `Menu`: filter parts `MenuInput`, `MenuClear`, `MenuEmpty` with `filterText` matching on menu items.
  - `Combobox`: updated to adopt shared `defaultCollectionMatch` from `collection`.
- Merged cleanly with latest `origin/main` (incorporating `feat/axis-baseui-alignment` #53 with `render` prop composition, `ToastQueue`, and `PortalHost`).
- Example app updated to cover all new parts; demo coverage gate held (130 components).
- Changeset written (`.changeset/axis-parity-select-menu.md`).

## Verification (Commands Run + Real Output)

1. Unit tests:
   `bun run test`: 2 pass (monorepo tests)
   `bun run --filter @xoroh/axis test`: 26 files passed, 243 tests passed (vitest)
2. React Native Jest suite:
   `bun run --filter @xoroh/axis test:jest`: 51 suites passed, 372 tests passed
3. Lint and formatting:
   `bun run lint`: Checked 197 files, 0 errors, 1 pre-existing warning on main (`switch.tsx`)
4. Typecheck:
   `bun run --filter @xoroh/axis typecheck`: clean
   `bun run --filter @xoroh/axis-example typecheck`: clean
5. Boundary and policy gates:
   `bun run --filter @xoroh/axis check:boundary`: boundary holds (models pure; components RN-host-only)
   `bun test packages/axis/scripts/lib/boundary-policy.test.mjs`: 28 pass
6. Documentation & Example checks:
   `bun run --filter @xoroh/axis check:readme`: clean
   `bun run --filter @xoroh/axis check:readme-examples`: clean
   `bun run --filter @xoroh/axis-example check:demos`: "demo coverage holds: all 130 components demoed."
7. Build & Packaging:
   `bun run --filter @xoroh/axis build`: ESM, CJS, and DTS successfully built
   `bun run --filter @xoroh/axis check:publish`: publint & attw clean across all exports (both `.` and `./models`)

## Acceptance

- Acceptance 1 (Base UI parity for Select, Tooltip, Combobox, and Menu filter): PASS. All parts implemented, documented, tested, and demoed.
- Acceptance 2 (No regression in consumers / full suite): PASS. All 51 Jest suites and 26 Vitest suites green.
- Acceptance 3 (No backward compat, no shims/aliases): PASS. Pure greenfield Base UI compound anatomy matching Axis architectural standards.
- Acceptance 4 (Branch worktree only, PR opened, no self-merge): PASS. PR #57 created and linked to thread.

## What's Still Weak (Honest)

- Virtualization in Select and Combobox lists remains deliberately omitted per Axis contract (§4); very large lists (>500 items) will rely on caller pagination/virtualization wrappers.
- Hardware keyboard typeahead in RN is bounded by platform event availability (touch is primary).

## Next Steps

- Axis Lead reviews and merges PR #57.
- Kern Lead ports any relevant Kern components to the new compound Select/Tooltip/Menu APIs.
