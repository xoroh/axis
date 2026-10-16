import { describe, expect, test } from "bun:test";
import {
  classifyComponentImports,
  extractImports,
  findDynamicLoads,
  resolvesInsideSrc,
  stripNonCode,
} from "./boundary-policy.mjs";

/**
 * Boundary-policy mutation suite. Each case is a miniature component
 * file: approved shapes pass, smuggled dependencies fail. Run in CI as
 * part of the boundary step — a gate whose own tests do not run is a
 * comment, not a gate.
 */

const APPROVED = `import { useCallback } from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { useControllableState } from "../useControllableState";
`;

describe("extractImports", () => {
  test("parses multiline named imports with type markers", () => {
    const found = extractImports(
      `import {\n  Pressable,\n  type StyleProp,\n  View,\n} from "react-native";`,
    );
    expect(found).toHaveLength(1);
    expect(found[0].module).toBe("react-native");
    expect(found[0].names).toEqual([
      { name: "Pressable", isType: false },
      { name: "StyleProp", isType: true },
      { name: "View", isType: false },
    ]);
  });

  test("default and side-effect imports yield their module", () => {
    const found = extractImports(
      `import React from "react";\nimport "./polyfill";`,
    );
    expect(found.map((f) => f.module)).toEqual(["react", "./polyfill"]);
  });
});

describe("classifyComponentImports", () => {
  test("approved component imports pass", () => {
    expect(classifyComponentImports("components/Switch.tsx", APPROVED)).toEqual(
      [],
    );
  });

  test("unauthorized external package fails", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `${APPROVED}import { gravitate } from "motion-magic";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("motion-magic");
  });

  test("unlisted react-native binding fails", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `import { FlatList } from "react-native";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("FlatList");
  });

  test("forbidden design-system and web-only imports fail", () => {
    for (const mod of [
      "@xoroh/kern-primitives",
      "@xoroh/kern-tokens",
      "react-dom",
      "expo",
    ]) {
      const failures = classifyComponentImports(
        "components/Fancy.tsx",
        `import { x } from "${mod}";\n`,
      );
      expect(failures.length).toBeGreaterThan(0);
    }
  });

  test("escapes above src fail", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `import { secret } from "../../elsewhere";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("escapes src");
  });

  test("sibling and parent-internal relative imports stay valid", () => {
    expect(
      classifyComponentImports(
        "components/Fancy.tsx",
        `import { useControllableState } from "../useControllableState";\nimport { helper } from "./helper";\n`,
      ),
    ).toEqual([]);
  });

  test("direct parent traversal outside src fails", () => {
    const failures = classifyComponentImports(
      "components/Switch.tsx",
      `import { x } from "../../outside";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("escapes src");
  });

  test("traversal beginning with ./../../ fails", () => {
    const failures = classifyComponentImports(
      "components/Switch.tsx",
      `import { x } from "./../../outside";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("escapes src");
  });

  test("equivalent normalized traversal paths fail", () => {
    // Every spelling below climbs above src/components/ (depth 1), so
    // each normalizes to ../outside regardless of ./, //, or nesting.
    for (const mod of [".././../outside", "..//../outside"]) {
      const failures = classifyComponentImports(
        "components/Switch.tsx",
        `import { x } from "${mod}";\n`,
      );
      expect(failures).toEqual(
        expect.arrayContaining([expect.stringContaining("escapes src")]),
      );
    }
    // From a nested file the same spellings need one more level.
    for (const mod of ["../../../outside", "./../../../outside"]) {
      const failures = classifyComponentImports(
        "components/nested/Fancy.tsx",
        `import { x } from "${mod}";\n`,
      );
      expect(failures).toEqual(
        expect.arrayContaining([expect.stringContaining("escapes src")]),
      );
    }
  });

  test("normalized-inside paths with ./ segments pass", () => {
    expect(
      classifyComponentImports(
        "components/nested/Fancy.tsx",
        `import { x } from "./../helper";\nimport { y } from "../../useControllableState";\n`,
      ),
    ).toEqual([]);
  });

  test("dynamic import() in a component fails", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `const mod = await import("motion-magic");\n`,
    );
    expect(failures).toEqual(
      expect.arrayContaining([expect.stringContaining("dynamic import()")]),
    );
  });

  test("require() in a component fails", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `const mod = require("motion-magic");\n`,
    );
    expect(failures).toEqual(
      expect.arrayContaining([expect.stringContaining("require()")]),
    );
  });
});

describe("resolvesInsideSrc", () => {
  test("extensionless and nested-inside targets stay valid", () => {
    expect(
      resolvesInsideSrc("components/Switch.tsx", "../useControllableState"),
    ).toBe(true);
    expect(resolvesInsideSrc("components/Switch.tsx", "./helper")).toBe(true);
    expect(
      resolvesInsideSrc(
        "components/nested/F.tsx",
        "../../useControllableState",
      ),
    ).toBe(true);
  });

  test("escapes fail regardless of spelling", () => {
    for (const [file, mod] of [
      ["components/Switch.tsx", "../../outside"],
      ["components/Switch.tsx", "./../../outside"],
      ["components/Switch.tsx", "../.."],
      ["components/nested/F.tsx", "../../../outside"],
    ]) {
      expect(resolvesInsideSrc(file, mod)).toBe(false);
    }
  });
});

describe("stripNonCode + findDynamicLoads", () => {
  test("mentions in comments and strings are not loads", () => {
    const src = [
      '// const x = require("nope");',
      '/* import("nope") */',
      'const a = "require(\\"nope\\")";',
      "const b = 'import(\"nope\")';",
      'const c = `template with require("nope") inside`;',
    ].join("\n");
    expect(findDynamicLoads(stripNonCode(src))).toEqual([]);
  });

  test("real loads are found, including inside template interpolation", () => {
    // Built without a literal ${…} placeholder so the linter does not
    // mistake test data for a template mistake; the evaluated string
    // contains import(`./mod-${name}`).
    const tmpl = ["`./mod-", "{name}`"].join("$");
    const src = [
      `const a = await import(${tmpl});`,
      'const b = require("real");',
      'x.require("method-call");',
    ].join("\n");
    expect(findDynamicLoads(stripNonCode(src))).toEqual(["import", "require"]);
  });

  test("stripping preserves code outside literals", () => {
    // Module specifiers are string literals, so they blank out by
    // design; structure and comments behave as asserted.
    const stripped = stripNonCode(`import { x } from "mod"; // trailing`);
    expect(stripped).toContain("import { x } from");
    expect(stripped).not.toContain("trailing");
    expect(stripped).not.toContain("mod");
  });
});

describe("nested interpolation desynchronization", () => {
  // Discriminating shapes: the load sits in the SAME interpolation AFTER
  // a brace hidden in a string/comment. The old brace-counter ended the
  // interpolation at the hidden brace and blanked the load; the recursive
  // scanner keeps it as code. Verified: old finds [], new finds the load.
  test("brace inside a string does not hide a later load in the same interpolation", () => {
    const src = `const t = \`\${cond ? "}" : import("evil")}\`;`;
    expect(findDynamicLoads(stripNonCode(src))).toEqual(["import"]);
  });

  test("brace inside a comment does not hide a later load in the same interpolation", () => {
    const src = `const t = \`\${/* } */ import("evil")}\`;`;
    expect(findDynamicLoads(stripNonCode(src))).toEqual(["import"]);
  });

  test("load in a later interpolation still found (characterization)", () => {
    const src = `const t = \`\${cond ? "}" : x} \${import("evil")}\`;`;
    expect(findDynamicLoads(stripNonCode(src))).toEqual(["import"]);
  });

  test("nested template expressions still expose loads", () => {
    const src = `\`outer \${\`inner \${import("evil")}\`} end\`;`;
    expect(findDynamicLoads(stripNonCode(src))).toEqual(["import"]);
  });

  test("balanced braces without loads stay silent", () => {
    const src = `const t = \`text } more \${x} and {less}\`;`;
    expect(findDynamicLoads(stripNonCode(src))).toEqual([]);
  });

  test("escaped quotes do not leak code regions", () => {
    const src = 'const s = "say \\"hi\\" }"; const m = require("real");';
    expect(findDynamicLoads(stripNonCode(src))).toEqual(["require"]);
  });

  test("gate-level: interpolation-hidden require fails the classifier", () => {
    const src = `import { View } from "react-native";\nconst t = \`\${cond ? "}" : require("evil")}\`;\n`;
    const failures = classifyComponentImports("components/Fancy.tsx", src);
    expect(failures).toEqual(
      expect.arrayContaining([expect.stringContaining("require()")]),
    );
  });
});
