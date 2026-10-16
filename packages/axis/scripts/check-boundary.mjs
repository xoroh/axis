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
 *   contract): may import `react`, the approved `react-native` host
 *   bindings (`boundary-policy.mjs`), and relative paths inside
 *   `src/` — nothing else.
 *
 * Everywhere forbidden: Kern packages, `react-dom`, `expo`, browser
 * globals, design-token references, and design-system code. The public
 * barrel must not export contract-internal symbols. Mirrors the intent
 * of Kern's `check:primitives` graph rule for the Axis-owned tree.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  ALWAYS_FORBIDDEN_MODULES,
  ALWAYS_FORBIDDEN_SOURCE,
  classifyComponentImports,
} from "./lib/boundary-policy.mjs";

const SRC = new URL("../src", import.meta.url).pathname;
const COMPONENTS = join(SRC, "components");
const failures = [];

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

const FORBIDDEN_SOURCE_ALWAYS = [
  ...ALWAYS_FORBIDDEN_MODULES.flatMap((s) => [`from "${s}"`, `from '${s}'`]),
  ...ALWAYS_FORBIDDEN_SOURCE,
];
const FORBIDDEN_SOURCE_MODELS = [`from "react-native"`, `from 'react-native'`];

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
  if (inComponents) {
    failures.push(...classifyComponentImports(rel, text));
  }
}

const barrel = readFileSync(join(SRC, "index.ts"), "utf8");
for (const name of NON_PUBLIC) {
  if (new RegExp(`\\bexport\\b[^;]*\\b${name}\\b`).test(barrel)) {
    failures.push(`index.ts: internal factory ${name} must not be exported`);
  }
}

// --- Models zone: `./models` subpath --------------------------------------
// `@xoroh/axis/models` is the universal behavior zone (web-safe): its
// transitive closure must contain no `react-native` import and no file
// under `src/components/`. Walk it from `src/models.ts` following
// relative imports, the same string-matching discipline as above.
// Its export list must mirror the model sections of `./index.ts`
// exactly — a model exported from one entry but not the other is a
// second public contract drawn by accident.
const MODELS_BARREL = join(SRC, "models.ts");
if (!existsSync(MODELS_BARREL)) {
  failures.push(
    "src/models.ts is missing — the ./models subpath has no source.",
  );
} else {
  const seen = new Set();
  const queue = [MODELS_BARREL];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const match of text.matchAll(
      /(?:import|export)[^'"]*from\s*["']([^"']+)["']/g,
    )) {
      const spec = match[1];
      if (spec === "react-native" || spec.startsWith("react-native/")) {
        failures.push(
          `${file.slice(SRC.length + 1)}: models closure imports react-native — models stay platform-neutral.`,
        );
      }
      if (spec.startsWith(".")) {
        const resolved = join(file.slice(0, file.lastIndexOf("/")), spec);
        const withExt = [
          `${resolved}.ts`,
          `${resolved}.tsx`,
          join(resolved, "index.ts"),
        ];
        const hit = withExt.find((p) => existsSync(p));
        if (hit) {
          const rel = hit.slice(SRC.length + 1);
          if (rel === "components" || rel.startsWith("components/")) {
            failures.push(
              `${file.slice(SRC.length + 1)}: models closure reaches src/components/ (${rel}) — move the shared code to a model or the import to a component.`,
            );
          } else {
            queue.push(hit);
          }
        }
      }
    }
  }

  // Export-name parity per model module (not just module presence:
  // a renamed symbol in one entry is the same accident class).
  const namesOf = (text, mod) => {
    const m = text.match(
      new RegExp(`export\\s*\\{([^}]*)\\}\\s*from\\s*["']\\.\\/${mod}["']`),
    );
    if (!m) return null;
    return new Set(
      m[1]
        .split(",")
        .map((p) =>
          p
            .replace(/\btype\s+/g, "")
            .trim()
            .split(/\s+as\s+/)
            .pop()
            ?.trim(),
        )
        .filter(Boolean),
    );
  };
  const modelsText = readFileSync(MODELS_BARREL, "utf8");
  const modelModules = new Set();
  for (const m of barrel.matchAll(/from\s*["']\.\/([A-Za-z0-9]+)["']/g)) {
    if (m[1] === "index") continue;
    try {
      if (statSync(join(SRC, m[1])).isDirectory() || m[1] === "components") {
        continue;
      }
    } catch {
      continue;
    }
    if (existsSync(join(SRC, `${m[1]}.ts`))) modelModules.add(m[1]);
  }
  for (const mod of [...modelModules].sort()) {
    const a = namesOf(barrel, mod);
    const b = namesOf(modelsText, mod);
    if (a === null) continue;
    if (b === null) {
      failures.push(
        `src/models.ts: missing model module "./${mod}" present in index.ts.`,
      );
      continue;
    }
    for (const name of [...a].sort()) {
      if (!b.has(name)) {
        failures.push(
          `src/models.ts: "./${mod}" is missing export "${name}" present in index.ts.`,
        );
      }
    }
    for (const name of [...b].sort()) {
      if (!a.has(name)) {
        failures.push(
          `src/models.ts: "./${mod}" exports "${name}" absent from index.ts.`,
        );
      }
    }
  }
}

// The manifest must expose the models zone (types + dual format,
// no react-native condition — the same file serves every
// renderer precisely because it imports no native runtime).
try {
  const manifest = JSON.parse(
    readFileSync(join(SRC, "..", "package.json"), "utf8"),
  );
  const entry = manifest.exports?.["./models"];
  // Types may sit top-level or nested per condition (mirroring the
  // `.` entry shape); either way every resolution path must land
  // on the built models files.
  const typesPaths = [
    entry?.types,
    entry?.import?.types,
    entry?.require?.types,
  ].filter((v) => typeof v === "string");
  const implPaths = [entry?.import, entry?.require, entry?.default]
    .map((v) => (typeof v === "string" ? v : v?.default))
    .filter((v) => typeof v === "string");
  if (
    typesPaths.length === 0 ||
    !typesPaths.every((p) => p.includes("models")) ||
    implPaths.length === 0 ||
    !implPaths.every((p) => p.includes("models"))
  ) {
    failures.push(
      'package.json: exports["./models"] must resolve (types + dual format) to the built models entry.',
    );
  }
  if (entry && "react-native" in entry) {
    failures.push(
      'package.json: exports["./models"] must carry no react-native condition — one file serves all renderers.',
    );
  }
} catch {
  failures.push("package.json: unreadable while checking ./models export.");
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
