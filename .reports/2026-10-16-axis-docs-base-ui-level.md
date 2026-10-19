# 2026-10-16 — Axis docs to Base UI level (batch 1: Tabs, Toast, Field)

Thread brief: `2026-10-16-axis-docs-base-ui-level`. Branch
`docs/axis-docs-batch1-select-tabs-toast-field` (worktree
`/tmp/opencode/axis-docs-batch1`), based on `origin/main` `82c3179`.

## Outcome

**Docs for Tabs, Toast and Field are now at Base UI docs level** —
purpose, honest source-path install note, anatomy/Base-UI mapping,
full per-part prop tables matched line-by-line against the current
`*Props` types on main, runnable minimal/controlled/uncontrolled
examples (all mechanically verified by the Q15 gate), dedicated
Accessibility sections with named deferrals, and composition +
parity pointers. `packages/axis/README.md` Install now says the
truth (unpublished `0.0.0`) beside the eventual registry command.
Open PR, not merged by me.

Scope steering during the batch (Axis Lead, twice): the three
small fixes (popover title typo, switch unused import, Select text
warning) were reassigned off this thread, and `select.md` /
`combobox.md` / `tooltip.md` / `menu.md` were assigned to the parity
thread d8fd88db. Final scope delivered: `docs/components/{tabs,
toast,field}.md` + `packages/axis/README.md` only. A duplicate
thread (1d339bbb) was stopped by the lead; this thread owns
`/tmp/opencode/axis-docs-batch1`.

## PR

- **https://github.com/xoroh/axis/pull/59** (open — Axis Lead
  reviews and merges; never self-merged)
- Full test-sweep comment:
  https://github.com/xoroh/axis/pull/59#issuecomment-6229948217
- t3-code `link_pull_request` / `list_thread_pull_requests` are **not
  exposed in this session's tool catalog** (searched twice) — the
  PR could not be registered with the thread through the tool.
  Reported here instead of claiming it linked. PR URL above is the
  source of truth.

## Commands run + real output

```text
$ node scripts/check-readme.mjs
check-readme holds: 47 component notes (unique, sourced), README index in sync, no stray sections.
(check:readme exit=0)

$ node scripts/check-readme-examples.mjs          # Q15 gate
check-readme-examples holds: 20 tsx blocks parse, axis imports resolve, component props exist.
(check:readme-examples exit=0)

$ bun run lint                                    # biome
Checked 190 files in 2s. Found 1 warning.         # pre-existing: apps/example/src/demos/switch.tsx:3
(lint exit=0)

$ bun run typecheck
@xoroh/axis typecheck: Exited with code 0

$ bun test tests/
2 pass, 0 fail, 9 expect() calls (Ran 2 tests across 1 file. [27.00ms])

$ bun run --filter @xoroh/axis test               # vitest
Test Files  25 passed (25)
     Tests  237 passed (237)

$ bun run --filter @xoroh/axis test:jest
Test Suites: 52 passed, 52 total
      Tests: 403 passed, 403 total
   (205.7s; "worker force exited" line = pre-existing teardown noise, 0 failures)

# Install-note verification (DoD 4 — the documented line runs):
$ node scripts/pack-vendor.mjs --out /tmp/opencode/axis-vendor
/tmp/opencode/axis-vendor/axis-d0dbb4f.tgz
sha512:W8XjABs/COz1e5PuQqAYFuaIAmh1XiuEg7OvkjjHMa2YyoL5Lp7t+4q15ig72pySt57jqGZ15RCj5VqEqRzMLA==
(tarball contains package/dist/*, LICENSE — release-equivalent npm pack)

$ (scratch app) bun add /tmp/opencode/axis-vendor/axis-d0dbb4f.tgz react react-native
207 packages installed → node -e "…console.log('installed @xoroh/axis', p.version)"
installed @xoroh/axis 0.0.0
```

## Screenshots

Desktop browser was not connected to this session, so docs were
rendered with headless Chrome + `github-markdown-css` 5.5.1 (same
renderer families GitHub uses). 12 PNGs in
`.reports/axis-docs-batch1-shots/`: `tabs|toast|field` ×
`light|dark` × `1440|390`, full-page, trimmed. Eyeball-checked:
tables, code blocks, and dark mode render correctly; at 390px the
5-column prop tables get narrow (standard GitHub markdown
reflow — same as every repo doc).

## Acceptance (observed)

1. **Touched docs: prop table, a11y section, runnable example,
   install note; tables match current `*Props` on main — PASS.**
   All three docs verified against `packages/axis/src/components/
   {Tabs,Toast,Field}.tsx` at `82c3179` prop-by-prop, including the
   `render`/`StateStyle` composition pass from #53. Screenshots
   above show the rendered result.
2. **`check:readme` + `check:readme-examples` (Q15) pass; no Kern
   call-site regression — PASS.** Real outputs above. The PR
   changes docs + README prose only; Kern's 44 Axis imports are all
   hooks/pure models (`.reports/kern-needs-from-axis.md`) —
   untouched surface. Jest/vitest/lint/typecheck all green on the
   branch.
3. **Three fixes fail-before/pass-after — NOT APPLICABLE to this
   thread (reassigned by lead steering mid-batch).** Evidence for
   the new owners is below so discovery is not repeated.

## Handoff evidence (reassigned fixes)

- **Select text warning → d8fd88db (parity).** Repro:
  `apps/example/src/demos/list-select.tsx:24`
  (`placeholder="Sort by"`); warning as recorded by the DX audit:
  React "Unexpected text node: Sort by". Root cause by code reading:
  `packages/axis/src/components/Select.tsx` trigger renders
  `{selectedLabel ?? placeholder}` directly inside the trigger
  `Pressable`, so a raw **string** placeholder becomes a text node
  under a `View` (harmless native, console noise in the
  react-native-web/SSR path the audit used — I could not reproduce
  the exact warning locally: the string is not in the RN JS sources
  in `node_modules`, so it comes from the web/reconciler path).
  Proposed fix (not applied — component files out of scope): wrap
  only string nodes, e.g.
  `{typeof content === "string" ? <Text>{content}</Text> : content}`.
  Proposed check: RNTL suite asserting the trigger renders no raw
  string child when `placeholder` is set (console-spy check only if
  run under the web renderer; the jest RN renderer did not show the
  warning in this session).
- **Popover title typo → not reproducible; likely an audit false
  positive.** Byte-level: `git show 7c97560:apps/example/src/demos/
  popover.tsx | sed -n '22p' | od -c` → `title: "Popover",` —
  correct spelling, unchanged since file creation, identical on
  `origin/main`. Repo-wide token scan (every `*Pop*` token at both
  `7c97560` and `82c3179`) found no misspelling anywhere. The
  audit's own screenshot, zoomed 6×, also reads "Popover". Whoever
  owns this fix should not burn time hunting — there is nothing to
  change at `popover.tsx:22`.
- **Switch unused import → trivial, with a gate caveat.**
  `apps/example/src/demos/switch.tsx:3` imports `Pressable` and
  `ScrollView`, both unused — still present on `origin/main`.
  Caveat for the fix owner: plain `bun run lint` (biome) exits **0**
  with this warning, so it is not currently a failing check — a
  fail-before/pass-after story needs the repo lint policy to treat
  it as an error (or a dedicated check), which is a lead decision.

## What's still weak (honest)

- **3 of 46 component docs** are at this level. The other 43 need
  batches; Select/Combobox/Tooltip/Menu are with d8fd88db and
  `menu.md` must not be touched by later batches until parity lands.
- **Prop tables are hand-written.** The Q15 gate verifies example
  props, not table rows — a table can drift from the types without
  any gate noticing. A props-table extraction gate would lock this
  acceptance criterion mechanically.
- **Install flow verified on this machine** (pack-vendor → scratch
  consumer install → `@xoroh/axis 0.0.0` resolves), not from a
  clean clone on a fresh machine.
- **Screenshots are renders of the markdown**, not the live GitHub
  PR page (browser session disconnected) and not a device run
  (no emulator/simulator exists here — `docs/COMPATIBILITY.md`).
- Pre-existing jest "worker force exited" teardown warning remains
  (0 failures; not introduced here).

## Gaps for other leads

- **d8fd88db (parity):** Select text-warning fix + check (details
  above); when rewriting `select.md`/`menu.md`, the Tabs/Toast/
  Field docs in PR #59 are the agreed template (anatomy table,
  per-part props, examples, a11y, composition).
- **Fixes-thread owner:** popover typo is a false positive (evidence
  above); switch import needs a lint-policy decision to have a real
  failing gate.
- **Axis Lead:** consider a docs gate that extracts prop tables and
  diffs them against `*Props` types — the only remaining manual step
  in the acceptance criteria.
- **t3 infra:** `link_pull_request` not exposed to this session —
  PRs from this thread cannot self-register.
- Missing Kern part: **none** — docs-only batch; nothing added to
  `kern-pending/`.

## Suggested next item

Batch 2 of the same template: **Button, Dialog, Popover** docs
(checkbox.md/switch.md polish can ride along). Deliberately exclude
`menu.md`/`select.md`/`combobox.md`/`tooltip.md` until d8fd88db
merges, then a final parity-sync sweep over the whole
`docs/components/` directory.
