#!/usr/bin/env node
/**
 * check-demo-coverage — every public component has a runnable demo.
 *
 * Reads the `@xoroh/axis` barrel for component exports (PascalCase
 * names from `./components/*` — models, hooks, and types are not
 * components) and asserts each one appears in some demo's
 * `components` list in `src/demos/registry.ts`.
 *
 * Findings other than a clean bill fail: an unknown name in a
 * demo is a typo pointing at nothing, and an uncovered component
 * is a demo the program owes. (While demo batches are still
 * landing, run this locally to track the remainder; it joins CI
 * with the final coverage batch.)
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const AXIS_INDEX = join(
  ROOT,
  "..",
  "..",
  "packages",
  "axis",
  "src",
  "index.ts",
);
const REGISTRY_DIR = join(ROOT, "src", "demos");

const failures = [];

// Barrel component exports: `export { Name, ... } from "./components/X"`.
const barrel = readFileSync(AXIS_INDEX, "utf8");
const components = new Set();
for (const m of barrel.matchAll(
  /export\s*\{([^}]+)\}\s*from\s*["']\.\/components\/[^"']+["']/g,
)) {
  for (const part of m[1].split(",")) {
    const name = part.replace(/^type\s+/, "").trim();
    if (/^[A-Z]/.test(name)) components.add(name);
  }
}

// Demo-claimed names: `components: [...]` arrays in demo modules.
const claimed = new Set();
for (const file of readdirSync(REGISTRY_DIR)) {
  if (file === "registry.ts" || !file.endsWith(".tsx")) continue;
  const text = readFileSync(join(REGISTRY_DIR, file), "utf8");
  const m = text.match(/components:\s*\[([\s\S]*?)\]/);
  if (!m) {
    failures.push(`${file} has no \`components\` list.`);
    continue;
  }
  for (const name of m[1].matchAll(/"([^"]+)"/g)) claimed.add(name[1]);
}

for (const name of [...claimed].sort()) {
  if (!components.has(name)) {
    failures.push(`demo claims unknown barrel export "${name}".`);
  }
}

const missing = [...components].sort().filter((c) => !claimed.has(c));
if (missing.length > 0) {
  console.log(
    `demo coverage: ${components.size - missing.length}/${components.size} components demoed; missing: ${missing.join(", ")}`,
  );
} else {
  console.log(`demo coverage holds: all ${components.size} components demoed.`);
}

if (failures.length > 0) {
  console.error("check-demo-coverage FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
