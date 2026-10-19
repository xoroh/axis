#!/usr/bin/env node
/**
 * check-readme-examples — README tsx blocks stay mechanically accurate.
 *
 * Prose examples rot: a renamed prop or export breaks every snippet
 * silently, and review reads prose, not APIs. This gate parses each
 * ```tsx block in the package README, the root README, and
 * `docs/components/*.md`, then asserts three properties that do not
 * require executing anything:
 *
 * 1. Syntax: the block parses as TSX (a typo'd example fails here).
 * 2. Imports: every name imported from `@xoroh/axis` is a real
 *    barrel export (renames break here).
 * 3. Props: every prop set on a known Axis component exists in its
 *    `<Name>Props` type (renamed/removed props break here).
 *
 * Deliberately unchecked (documented, not overlooked): unknown
 * identifiers (`openWifi`, `SearchButton`, demo state) are caller
 * context, not API claims; non-Axis components and RN hosts are
 * skipped; prop VALUES are not typechecked (presence, not types —
 * a full typecheck would need a harness per snippet).
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const REPO = join(ROOT, "..", "..");
const failures = [];

// --- Barrel exports + component file map -------------------------------
const indexText = readFileSync(join(ROOT, "src", "index.ts"), "utf8");
const barrelNames = new Set();
const componentFile = new Map();
for (const m of indexText.matchAll(
  /export\s*\{([^}]*)\}\s*from\s*["']\.\/(components\/[A-Za-z]+|[A-Za-z]+)["']/g,
)) {
  const mod = m[2];
  for (const part of m[1].split(",")) {
    const name = part
      .replace(/\btype\s+/g, "")
      .trim()
      .split(/\s+as\s+/)
      .pop()
      ?.trim();
    if (!name) continue;
    barrelNames.add(name);
    if (mod.startsWith("components/")) componentFile.set(name, mod);
  }
}

// --- Props keys per component (top-level PropertySignature names) -----
const propsCache = new Map();
function propsOf(component) {
  if (propsCache.has(component)) return propsCache.get(component);
  const mod = componentFile.get(component);
  const out = new Set();
  if (mod) {
    try {
      const text = readFileSync(join(ROOT, "src", `${mod}.tsx`), "utf8");
      const sf = ts.createSourceFile(
        `${mod}.tsx`,
        text,
        ts.ScriptTarget.Latest,
        false,
      );
      const want = `${component}Props`;
      const visit = (node) => {
        if (ts.isTypeAliasDeclaration(node) && node.name.text === want) {
          const walk = (t) => {
            if (ts.isTypeLiteralNode(t)) {
              for (const member of t.members) {
                if (ts.isPropertySignature(member)) {
                  // Quoted names (`"aria-label"`) are real props too
                  // (ADR-112 aria-only parts).
                  if (
                    ts.isIdentifier(member.name) ||
                    ts.isStringLiteral(member.name)
                  ) {
                    out.add(member.name.text);
                  }
                }
              }
            } else if (ts.isIntersectionTypeNode(t)) {
              for (const part of t.types) walk(part);
            } else if (
              ts.isTypeReferenceNode(t) &&
              ts.isIdentifier(t.typeName)
            ) {
              const nested = propsOfNamed(t.typeName.text, sf);
              for (const n of nested) out.add(n);
            }
          };
          walk(node.type);
        } else {
          ts.forEachChild(node, visit);
        }
      };
      visit(sf);
    } catch {
      // Unreadable here; typecheck reports it properly.
    }
  }
  propsCache.set(component, out);
  return out;
}

function propsOfNamed(name, sf) {
  const out = new Set();
  const visit = (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === name) {
      const walk = (t) => {
        if (ts.isTypeLiteralNode(t)) {
          for (const member of t.members) {
            if (!ts.isPropertySignature(member)) continue;
            if (ts.isIdentifier(member.name)) {
              out.add(member.name.text);
            } else if (ts.isStringLiteralLike(member.name)) {
              // Quoted names (`"aria-label"`) — the aria-only props.
              out.add(member.name.text);
            }
          }
        } else if (ts.isIntersectionTypeNode(t)) {
          for (const part of t.types) walk(part);
        }
      };
      walk(node.type);
    } else {
      ts.forEachChild(node, visit);
    }
  };
  visit(sf);
  return out;
}

// --- Collect markdown sources ------------------------------------------
const sources = [
  join(ROOT, "README.md"),
  join(ROOT, "..", "..", "README.md"),
  ...readdirSync(join(ROOT, "..", "..", "docs", "components"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(ROOT, "..", "..", "docs", "components", f)),
];

let blocks = 0;
for (const file of sources) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const short = file.startsWith(`${REPO}/`)
    ? file.slice(REPO.length + 1)
    : file;
  for (const m of text.matchAll(/```tsx\n([\s\S]*?)```/g)) {
    blocks++;
    const code = m[1];
    const label = `${short} block ${blocks}`;
    let sf;
    try {
      sf = ts.createSourceFile(
        "example.tsx",
        code,
        ts.ScriptTarget.Latest,
        true,
      );
      const errors = (sf.parseDiagnostics ?? []).filter(
        (d) => d.category === ts.DiagnosticCategory.Error,
      );
      if (errors.length > 0) {
        failures.push(
          `${label}: syntax error — ${ts.flattenDiagnosticMessageText(errors[0].messageText, " ")}`,
        );
        continue;
      }
    } catch {
      failures.push(`${label}: unparseable as TSX.`);
      continue;
    }

    const axisImports = new Map();
    const visitImports = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteralLike(node.moduleSpecifier) &&
        node.moduleSpecifier.text === "@xoroh/axis"
      ) {
        const clause = node.importClause;
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) {
            const exported = el.propertyName?.text ?? el.name.text;
            axisImports.set(el.name.text, exported);
            if (!barrelNames.has(exported)) {
              failures.push(
                `${label}: imports "${exported}" from @xoroh/axis, which the barrel does not export.`,
              );
            }
          }
        }
      }
      ts.forEachChild(node, visitImports);
    };
    visitImports(sf);
    const visit = (node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName;
        if (ts.isIdentifier(tag) && /^[A-Z]/.test(tag.text)) {
          const local = tag.text;
          const exported = axisImports.get(local);
          if (exported !== undefined) {
            if (barrelNames.has(exported) && componentFile.has(exported)) {
              const keys = propsOf(exported);
              for (const attr of node.attributes.properties) {
                if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name)) {
                  if (!keys.has(attr.name.text)) {
                    failures.push(
                      `${label}: <${exported}> has no prop "${attr.name.text}" in ${exported}Props.`,
                    );
                  }
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
}

if (failures.length > 0) {
  console.error(
    `check-readme-examples FAILED — ${failures.length} violation(s):`,
  );
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `check-readme-examples holds: ${blocks} tsx blocks parse, axis imports resolve, component props exist.`,
);
