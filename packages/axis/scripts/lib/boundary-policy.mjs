/**
 * boundary-policy — the pure classification core of `check:boundary`.
 *
 * Importable (no side effects) so the policy has unit tests
 * (`boundary-policy.test.mjs`). The gate script walks files; this module
 * decides, per file, which imports are allowed and why.
 *
 * Component allowlist (enforceable by default): implementation files
 * under `src/components/` may import exactly
 * - `react` (any bindings — the renderer hooks),
 * - `react-native`, restricted to `RN_HOST_BINDINGS` below, and
 * - relative paths that resolve inside `src/` (internal Axis reuse).
 * Anything else — third-party packages, absolute paths, escapes above
 * `src/`, unlisted RN bindings, dynamic `import()` / `require()` —
 * fails. Additions to the host set are a deliberate per-component-PR
 * decision with justification, never drive-by widening.
 */

import { posix } from "node:path";

export const RN_HOST_BINDINGS = ["Pressable", "StyleProp", "View", "ViewStyle"];

export const ALWAYS_FORBIDDEN_MODULES = [
  "@xoroh/kern",
  "@xoroh/kern-primitives",
  "@xoroh/kern-tokens",
  "@xoroh/kern-native",
  "@xoroh/kern-material-3",
  "react-dom",
  "expo",
];

export const ALWAYS_FORBIDDEN_SOURCE = [
  "document.",
  "window.",
  "localStorage",
  "--sys-",
  "--comp-",
  "--ref-",
];

/**
 * Extract static imports: [{ module, names: [{ name, isType }] }].
 * Covers `import x from`, `import {…} from`, `import type {…} from`,
 * and `export … from` (multiline included). Dynamic `import()` and
 * `require()` do not occur in `src/`; encountering them is a failure
 * handled by the caller (unknown module shape).
 */
export function extractImports(source) {
  const out = [];
  const re =
    /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/gs;
  for (const m of source.matchAll(re)) {
    const statement = m[0];
    const names = [];
    const list = statement.match(/\{([^}]*)\}/s);
    if (list) {
      for (const part of list[1].split(",")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const isType = trimmed.startsWith("type ");
        const name = (isType ? trimmed.slice(5) : trimmed)
          .split(/\s+as\s+/)[0]
          .trim();
        if (name) names.push({ name, isType });
      }
    }
    out.push({ module: m[1], names });
  }
  return out;
}

/**
 * Resolve a relative import against the importing file and decide
 * whether the target stays inside `src/`. `relPath` is the importing
 * file's path relative to `src/` (e.g. `components/Switch.tsx`), so
 * resolution is pure POSIX path math — no filesystem reads, identical
 * on every OS. Extensionless imports are location-checked only;
 * existence is the typechecker's job.
 */
export function resolvesInsideSrc(relPath, module) {
  const normalized = posix.normalize(
    posix.join(posix.dirname(relPath), module),
  );
  return (
    normalized !== "" && normalized !== ".." && !normalized.startsWith("../")
  );
}

/**
 * Replace comments and string literals with blanks so dependency-loading
 * detection sees code, not prose. Handles `//`, `/* … *\/`, single- and
 * double-quoted strings (with escapes), and template literals including
 * nested `${ … }` interpolation (recursed as code). Deliberately small:
 * `src/` has no exotic syntax beyond this.
 */
export function stripNonCode(source) {
  let out = "";
  let i = 0;
  const n = source.length;
  function blanks(s) {
    return s.replace(/[^\n]/g, " ");
  }
  while (i < n) {
    const c = source[i];
    const next = source[i + 1] ?? "";
    if (c === "/" && next === "/") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? n : end;
      out += blanks(source.slice(i, stop));
      i = stop;
      continue;
    }
    if (c === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      out += blanks(source.slice(i, stop));
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && source[j] !== c) j = source[j] === "\\" ? j + 2 : j + 1;
      out += blanks(source.slice(i, Math.min(j + 1, n)));
      i = Math.min(j + 1, n);
      continue;
    }
    if (c === "`") {
      let j = i + 1;
      let chunkStart = i;
      while (j < n) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === "`") break;
        if (source[j] === "$" && source[j + 1] === "{") {
          out += blanks(source.slice(chunkStart, j));
          let k = j + 2;
          let braces = 1;
          while (k < n && braces > 0) {
            if (source[k] === "{") braces += 1;
            else if (source[k] === "}") braces -= 1;
            k += 1;
          }
          // Interpolation is code: keep it so dynamic loads inside
          // `${ … }` are still detected.
          out += source.slice(j, k);
          chunkStart = k;
          j = k;
          continue;
        }
        j += 1;
      }
      out += blanks(source.slice(chunkStart, Math.min(j + 1, n)));
      i = Math.min(j + 1, n);
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/**
 * Find dynamic dependency-loading expressions in code (comments and
 * strings already stripped): `import(…)` and `require(…)`. A preceding
 * `.`, `$`, or word character disqualifies (`x.require(`, `$import(`),
 * so method calls and identifiers never match.
 */
export function findDynamicLoads(codeStripped) {
  const found = [];
  for (const m of codeStripped.matchAll(/(?<![\w$.])(import|require)\s*\(/g)) {
    found.push(m[1]);
  }
  return found;
}

/**
 * Classify one component file's imports. Returns failure strings (empty
 * when the file complies). `relPath` is the file's path relative to
 * `src/` and doubles as the resolution base.
 */
export function classifyComponentImports(relPath, source) {
  const failures = [];
  for (const { module, names } of extractImports(source)) {
    if (ALWAYS_FORBIDDEN_MODULES.includes(module)) {
      failures.push(`${relPath}: forbidden module ${JSON.stringify(module)}`);
      continue;
    }
    if (module === "react") continue;
    if (module === "react-native") {
      for (const { name } of names) {
        if (!RN_HOST_BINDINGS.includes(name)) {
          failures.push(
            `${relPath}: react-native binding ${JSON.stringify(name)} is not in the approved host set`,
          );
        }
      }
      continue;
    }
    if (module.startsWith(".")) {
      if (!resolvesInsideSrc(relPath, module)) {
        failures.push(
          `${relPath}: relative import ${JSON.stringify(module)} escapes src/`,
        );
      }
      continue;
    }
    failures.push(
      `${relPath}: external module ${JSON.stringify(module)} is not allowlisted for components`,
    );
  }
  const code = stripNonCode(source);
  for (const kind of findDynamicLoads(code)) {
    failures.push(
      `${relPath}: dynamic ${kind}() dependency loading is not allowed in components`,
    );
  }
  return failures;
}
