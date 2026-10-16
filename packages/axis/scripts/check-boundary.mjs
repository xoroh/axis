#!/usr/bin/env node
/**
 * check:boundary — Axis public-boundary gate.
 *
 * Fails if `src/` (non-test) imports design-system code, token packages,
 * React DOM / browser APIs, or references CSS variables; fails if the
 * public barrel exports a symbol the contract reserves as internal.
 * Mirrors the intent of Kern's `check:primitives` graph rule for the
 * Axis-owned tree.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname;
const failures = [];

const FORBIDDEN_IMPORT = [
  "@xoroh/kern",
  "@xoroh/kern-primitives",
  "@xoroh/kern-tokens",
  "@xoroh/kern-native",
  "@xoroh/kern-material-3",
  "react-dom",
  "react-native",
  "expo",
];
const FORBIDDEN_SOURCE = [
  ...FORBIDDEN_IMPORT.flatMap((s) => [`from "${s}"`, `from '${s}'`]),
  "document.",
  "window.",
  "localStorage",
  "--sys-",
  "--comp-",
  "--ref-",
];
// Present in source where hooks/tests need them, but never public API:
// factory internals plus web-only behavior excluded by the contract.
const NON_PUBLIC = [
  "createPressModel",
  "createRovingModel",
  "createFocusTrapModel",
  "isPressActivationKey",
  "VISUALLY_HIDDEN_STYLE",
  "clampRectToViewport",
  "resolveFloatingOrigin",
];

for (const entry of readdirSync(SRC)) {
  if (!entry.endsWith(".ts") || entry.endsWith(".test.ts")) continue;
  const text = readFileSync(join(SRC, entry), "utf8");
  for (const needle of FORBIDDEN_SOURCE) {
    if (text.includes(needle)) {
      failures.push(`${entry}: forbidden reference ${JSON.stringify(needle)}`);
    }
  }
}

const barrel = readFileSync(join(SRC, "index.ts"), "utf8");
for (const name of NON_PUBLIC) {
  if (new RegExp(`\\bexport\\b[^;]*\\b${name}\\b`).test(barrel)) {
    failures.push(`index.ts: internal factory ${name} must not be exported`);
  }
}

// Native proofs consume the PUBLIC entry only: a deep relative import
// (`./press`, `../src/x`) would prove a private path, not the contract
// Kern Native will adopt. Test-library, react, and react-native imports
// are the proof harness itself and are allowed here (unlike in src/).
for (const entry of readdirSync(SRC)) {
  if (!entry.endsWith(".rntest.tsx")) continue;
  const text = readFileSync(join(SRC, entry), "utf8");
  for (const match of text.matchAll(/from\s*["'](\.[^"']*)["']/g)) {
    if (match[1] !== "./index") {
      failures.push(
        `${entry}: native proof must import ./index, not ${match[1]}`,
      );
    }
  }
  for (const needle of ["@xoroh/kern", "kern-primitives", "document."]) {
    if (text.includes(needle)) {
      failures.push(`${entry}: forbidden reference ${JSON.stringify(needle)}`);
    }
  }
}

if (failures.length) {
  console.error(`boundary violations (${failures.length}):`);
  for (const f of failures) console.error(`  x ${f}`);
  process.exit(1);
}
console.log(
  "boundary holds: no token/renderer/web imports; internals unexported.",
);
