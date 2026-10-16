#!/usr/bin/env node
/**
 * check:boundary — Axis public-boundary gate.
 *
 * Two zones, one boundary:
 *
 * - Behavior models (`src/*.ts`, excluding `src/components/`): pure and
 *   platform-neutral. No `react-native` here either — a model that needs
 *   the host runtime is a component concern, not a model concern.
 * - Rendered components (`src/components/**`, per the component
 *   contract): may import `react` and `react-native` host primitives
 *   (`View`, `Text`, `Pressable`, types) and nothing else new.
 *
 * Everywhere forbidden: Kern packages, `react-dom`, `expo`, browser
 * globals, design-token references, and design-system code. The public
 * barrel must not export contract-internal symbols. Mirrors the intent
 * of Kern's `check:primitives` graph rule for the Axis-owned tree.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = new URL("../src", import.meta.url).pathname;
const COMPONENTS = join(SRC, "components");
const failures = [];

const ALWAYS_FORBIDDEN = [
  "@xoroh/kern",
  "@xoroh/kern-primitives",
  "@xoroh/kern-tokens",
  "@xoroh/kern-native",
  "@xoroh/kern-material-3",
  "react-dom",
  "expo",
];
const MODEL_ONLY_FORBIDDEN = ["react-native"];
const FORBIDDEN_SOURCE_ALWAYS = [
  ...ALWAYS_FORBIDDEN.flatMap((s) => [`from "${s}"`, `from '${s}'`]),
  "document.",
  "window.",
  "localStorage",
  "--sys-",
  "--comp-",
  "--ref-",
];
const FORBIDDEN_SOURCE_MODELS = [
  ...MODEL_ONLY_FORBIDDEN.flatMap((s) => [`from "${s}"`, `from '${s}'`]),
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

function sourceFiles(dir, inComponents) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full, inComponents || full === COMPONENTS));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) continue;
    if (entry.endsWith(".rntest.tsx")) continue;
    out.push({ file: full, inComponents });
  }
  return out;
}

for (const { file, inComponents } of sourceFiles(SRC, false)) {
  const rel = file.slice(SRC.length + 1);
  const text = readFileSync(file, "utf8");
  const needles = inComponents
    ? FORBIDDEN_SOURCE_ALWAYS
    : [...FORBIDDEN_SOURCE_ALWAYS, ...FORBIDDEN_SOURCE_MODELS];
  for (const needle of needles) {
    if (text.includes(needle)) {
      failures.push(`${rel}: forbidden reference ${JSON.stringify(needle)}`);
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
  "boundary holds: models pure; components RN-host-only; internals unexported.",
);
