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
 * - relative paths that stay inside `src/` (internal Axis reuse).
 * Anything else — third-party packages, absolute paths, escapes above
 * `src/`, unlisted RN bindings — fails. Additions to the host set are a
 * deliberate per-component-PR decision with justification, never
 * drive-by widening.
 */

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
 * Classify one component file's imports. Returns failure strings (empty
 * when the file complies).
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
      if (module.startsWith("../..") || module === ".." || module === ".") {
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
  return failures;
}
