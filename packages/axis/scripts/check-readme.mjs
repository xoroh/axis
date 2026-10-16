#!/usr/bin/env node
/**
 * check-readme — the README table of contents and section discipline.
 *
 * The README grew by batch-appended component sections until fourteen
 * of them existed twice with no gate noticing. Three mechanical
 * properties keep that class of rot out:
 *
 * 1. Every `##` header is unique (a second copy of a section is a
 *    merge error, not documentation).
 * 2. The `## Contents` TOC (between `<!-- toc:begin --> and
 *    `<!-- toc:end -->`) exactly matches the section headers in
 *    order, with GitHub anchors. Regenerate by running this script
 *    with `--write`.
 * 3. Every section except the intro set (Scope/Install/Usage/
 *    Contents) carries a `Source of truth` line naming the props
 *    type — a component section without one documents nothing
 *    checkable.
 *
 * Section titles use spaced human titles (Base UI docs pattern:
 * "Navigation Menu", "Top App Bar") rather than PascalCase.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const README = join(HERE, "..", "README.md");
const INTRO = new Set([
  "Scope and independence",
  "Install",
  "Usage",
  "Contents",
]);

const anchor = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function parse(text) {
  const lines = text.split("\n");
  const headers = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^## (.+)$/.exec(lines[i]);
    if (m) headers.push({ title: m[1], line: i + 1 });
  }
  return { lines, headers };
}

function expectedToc(headers) {
  return headers
    .filter((h) => !INTRO.has(h.title))
    .map((h) => `- [${h.title}](#${anchor(h.title)})`);
}

const failures = [];
const text = readFileSync(README, "utf8");
const { lines, headers } = parse(text);

// 1. Unique headers.
const seen = new Map();
for (const h of headers) {
  if (seen.has(h.title)) {
    failures.push(
      `"## ${h.title}" appears twice (lines ${seen.get(h.title)} and ${h.line}) — delete one copy.`,
    );
  } else {
    seen.set(h.title, h.line);
  }
}

// 2. TOC matches.
const begin = lines.findIndex((l) => l.trim() === "<!-- toc:begin -->");
const end = lines.findIndex((l) => l.trim() === "<!-- toc:end -->");
const want = expectedToc(headers);
if (begin === -1 || end === -1 || end < begin) {
  failures.push(
    "TOC markers `<!-- toc:begin -->` / `<!-- toc:end -->` missing or misordered.",
  );
} else {
  const actual = lines.slice(begin + 1, end);
  if (actual.join("\n") !== want.join("\n")) {
    failures.push(
      `TOC is stale (${actual.length} entries, expected ${want.length}). Run \`node scripts/check-readme.mjs --write\`.`,
    );
  }
}

// 3. Source-of-truth lines.
for (let i = 0; i < headers.length; i++) {
  if (INTRO.has(headers[i].title)) continue;
  const next = i + 1 < headers.length ? headers[i + 1].line : lines.length + 1;
  const body = lines.slice(headers[i].line, next - 1).join("\n");
  if (!/Source of truth/.test(body)) {
    failures.push(
      `"## ${headers[i].title}" has no \`Source of truth\` line — a component section must name its props type.`,
    );
  }
}

if (process.argv.includes("--write")) {
  if (begin !== -1 && end !== -1 && end > begin) {
    const next = [...lines.slice(0, begin + 1), ...want, ...lines.slice(end)];
    writeFileSync(README, `${next.join("\n")}`);
    console.log(`check-readme: TOC rewritten (${want.length} entries).`);
  }
  process.exit(0);
}

if (failures.length > 0) {
  console.error("check-readme FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `check-readme holds: ${headers.length} unique sections, TOC in sync, every component section names its source of truth.`,
);
