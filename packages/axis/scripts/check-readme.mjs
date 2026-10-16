#!/usr/bin/env node
/**
 * check-readme — docs layout discipline after the README split.
 *
 * Component notes live in `docs/components/*.md` (one `##` section
 * each, moved verbatim from the old monolith README); the package
 * README carries a generated index table linking to them. Three
 * mechanical properties keep that layout honest:
 *
 * 1. Every component file holds exactly one `##` title, unique
 *    across the directory, and names its `Source of truth` props
 *    type — a component note without one documents nothing
 *    checkable.
 * 2. The README index (between `<!-- index:begin -->` and
 *    `<!-- index:end -->`) lists every component file exactly
 *    once, alphabetically by title, linking to its GitHub page
 *    (absolute URLs — the npm package page cannot resolve
 *    repo-relative links). Regenerate with `--write`.
 * 3. No `##` component sections remain in the package README
 *    itself (split compliance — a section there instead of
 *    `docs/components/` drifts from the layout).
 *
 * Section titles use spaced human titles (Base UI docs pattern).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const README = join(HERE, "..", "README.md");
const COMPONENTS = join(HERE, "..", "..", "..", "docs", "components");
const BASE_URL = "https://github.com/xoroh/axis/blob/main/docs/components/";

const failures = [];

const files = readdirSync(COMPONENTS)
  .filter((f) => f.endsWith(".md"))
  .sort();
const titles = new Map();
for (const file of files) {
  const text = readFileSync(join(COMPONENTS, file), "utf8");
  const heads = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  if (heads.length !== 1) {
    failures.push(
      `docs/components/${file} holds ${heads.length} sections (expected exactly 1).`,
    );
    continue;
  }
  if (titles.has(heads[0])) {
    failures.push(
      `"## ${heads[0]}" appears in both ${titles.get(heads[0])} and ${file} — one copy must go.`,
    );
  } else {
    titles.set(heads[0], file);
  }
  if (!/Source of truth/.test(text)) {
    failures.push(
      `docs/components/${file} has no \`Source of truth\` line — a component note must name its props type.`,
    );
  }
}

const want = [...titles.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([title, file]) => `| [${title}](${BASE_URL}${file}) |`);

const readme = readFileSync(README, "utf8");
const lines = readme.split("\n");
const begin = lines.findIndex((l) => l.trim() === "<!-- index:begin -->");
const end = lines.findIndex((l) => l.trim() === "<!-- index:end -->");
if (begin === -1 || end === -1 || end < begin) {
  failures.push(
    "README index markers `<!-- index:begin -->` / `<!-- index:end -->` missing or misordered.",
  );
} else {
  // Intro sections live here by design; anything else is a
  // component note in the wrong place.
  const INTRO = new Set([
    "Scope and independence",
    "Install",
    "Usage",
    "Components",
    "Docs",
    "Compatibility",
  ]);
  const stray = lines.filter(
    (l) => l.startsWith("## ") && !INTRO.has(l.slice(3)),
  );
  if (stray.length > 0) {
    failures.push(
      `package README carries ${stray.length} component section(s) outside docs/components/ (${stray.slice(0, 3).join(", ")}…) — move them.`,
    );
  }
  const actual = lines.slice(begin + 1, end);
  if (actual.join("\n") !== want.join("\n")) {
    failures.push(
      `README index is stale (${actual.length} rows, expected ${want.length}). Run \`node scripts/check-readme.mjs --write\`.`,
    );
  }
}

if (process.argv.includes("--write")) {
  if (begin !== -1 && end !== -1 && end > begin) {
    const next = [...lines.slice(0, begin + 1), ...want, ...lines.slice(end)];
    writeFileSync(README, `${next.join("\n")}`);
    console.log(`check-readme: index rewritten (${want.length} rows).`);
  }
  process.exit(0);
}

if (failures.length > 0) {
  console.error("check-readme FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `check-readme holds: ${titles.size} component notes (unique, sourced), README index in sync, no stray sections.`,
);
